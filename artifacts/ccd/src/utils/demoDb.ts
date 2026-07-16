/**
 * Demo-mode database: a localStorage-backed stand-in for the Supabase client.
 *
 * When the public Preview / Demo mode is active, `config/supabase.ts` exports
 * this mock instead of a real Supabase client. Every table the app touches is
 * served from a per-browser localStorage copy (`demo-db-<table>`) seeded from
 * a snapshot of the owner's account, so:
 *   - NO request of any kind ever reaches the live Supabase project
 *   - visitors can create / edit / delete freely
 *   - each visitor's changes stay in their own browser and are wiped on reset
 *
 * The builder implements the small subset of the PostgREST query API the app
 * actually uses: select (incl. the nested embeds in customObjectivesApi), eq,
 * neq, in, contains, or, match, order, limit, single, maybeSingle, insert,
 * update, upsert, delete.
 */

export const DEMO_DB_PREFIX = 'demo-db-';

type Row = Record<string, unknown>;

// ---------- table storage ----------

function storageKey(table: string): string {
  return `${DEMO_DB_PREFIX}${table}`;
}

export function readDemoTable(table: string): Row[] {
  try {
    const raw = localStorage.getItem(storageKey(table));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeDemoTable(table: string, rows: Row[]): void {
  try {
    localStorage.setItem(storageKey(table), JSON.stringify(rows));
  } catch (err) {
    console.warn(`Demo DB: failed to persist table ${table}:`, err);
  }
}

function newId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `demo-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }
}

// Relations used by the app's embedded selects (customObjectivesApi).
const RELATIONS: Record<string, Record<string, { table: string; type: 'many' | 'one'; localKey?: string; foreignKey?: string }>> = {
  custom_objective_year_groups: {
    custom_objective_areas: { table: 'custom_objective_areas', type: 'many', foreignKey: 'year_group_id' },
  },
  custom_objective_areas: {
    custom_objectives: { table: 'custom_objectives', type: 'many', foreignKey: 'area_id' },
    custom_objective_year_groups: { table: 'custom_objective_year_groups', type: 'one', localKey: 'year_group_id' },
  },
  custom_objectives: {
    custom_objective_areas: { table: 'custom_objective_areas', type: 'one', localKey: 'area_id' },
  },
  activity_custom_objectives: {
    custom_objectives: { table: 'custom_objectives', type: 'one', localKey: 'objective_id' },
  },
};

interface Embed {
  alias: string;
  table: string;
  children: Embed[];
}

/** Parse a PostgREST select string like `*, areas:custom_objective_areas(*, objectives:custom_objectives(*))`. */
function parseEmbeds(select: string): Embed[] {
  const embeds: Embed[] = [];
  let depth = 0;
  let token = '';
  const flush = () => {
    const t = token.trim();
    token = '';
    if (!t || !t.includes('(')) return;
    const open = t.indexOf('(');
    const head = t.slice(0, open);
    const inner = t.slice(open + 1, t.lastIndexOf(')'));
    const [aliasPart, tablePart] = head.includes(':') ? head.split(':') : [head, head];
    embeds.push({
      alias: aliasPart.trim(),
      table: tablePart.trim().replace(/!.*$/, ''),
      children: parseEmbeds(inner),
    });
  };
  for (const ch of select) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (ch === ',' && depth === 0) {
      flush();
    } else {
      token += ch;
    }
  }
  flush();
  return embeds;
}

function attachEmbeds(parentTable: string, row: Row, embeds: Embed[]): Row {
  const out: Row = { ...row };
  for (const embed of embeds) {
    const rel = RELATIONS[parentTable]?.[embed.table];
    if (!rel) {
      out[embed.alias] = null;
      continue;
    }
    const childRows = readDemoTable(rel.table);
    if (rel.type === 'many') {
      out[embed.alias] = childRows
        .filter((c) => c[rel.foreignKey as string] === row.id)
        .map((c) => attachEmbeds(rel.table, c, embed.children));
    } else {
      const match = childRows.find((c) => c.id === row[rel.localKey as string]);
      out[embed.alias] = match ? attachEmbeds(rel.table, match, embed.children) : null;
    }
  }
  return out;
}

// ---------- query builder ----------

type Filter = (row: Row) => boolean;

class DemoQueryBuilder implements PromiseLike<{ data: unknown; error: null | { message: string; code?: string } }> {
  private table: string;
  private op: 'select' | 'insert' | 'update' | 'upsert' | 'delete' = 'select';
  private filters: Filter[] = [];
  private embeds: Embed[] = [];
  private orderings: { column: string; ascending: boolean }[] = [];
  private limitCount: number | null = null;
  private payload: Row[] | Row | null = null;
  private wantSingle: 'single' | 'maybeSingle' | null = null;
  private returnRows = false;
  private upsertOnConflict: string[] = ['id'];

  constructor(table: string) {
    this.table = table;
  }

  select(columns?: string) {
    if (this.op === 'select') {
      // plain read
    } else {
      this.returnRows = true;
    }
    if (columns && columns.includes('(')) {
      this.embeds = parseEmbeds(columns);
    }
    return this;
  }

  insert(rows: Row | Row[]) {
    this.op = 'insert';
    this.payload = rows;
    return this;
  }

  update(values: Row) {
    this.op = 'update';
    this.payload = values;
    return this;
  }

  upsert(rows: Row | Row[], options?: { onConflict?: string }) {
    this.op = 'upsert';
    this.payload = rows;
    if (options?.onConflict) {
      this.upsertOnConflict = options.onConflict.split(',').map((s) => s.trim());
    }
    return this;
  }

  delete() {
    this.op = 'delete';
    return this;
  }

  eq(column: string, value: unknown) {
    // The demo store is single-tenant: snapshot rows have `user_id` stripped,
    // so tenant-scoping filters are a no-op here (isolation is per-browser).
    if (column === 'user_id') return this;
    this.filters.push((row) => row[column] === value);
    return this;
  }

  neq(column: string, value: unknown) {
    this.filters.push((row) => row[column] !== value);
    return this;
  }

  in(column: string, values: unknown[]) {
    this.filters.push((row) => values.includes(row[column]));
    return this;
  }

  contains(column: string, values: unknown[]) {
    this.filters.push((row) => {
      const cell = row[column];
      return Array.isArray(cell) && values.every((v) => (cell as unknown[]).includes(v));
    });
    return this;
  }

  match(query: Row) {
    this.filters.push((row) =>
      Object.entries(query).every(([k, v]) => k === 'user_id' || row[k] === v),
    );
    return this;
  }

  or(expression: string) {
    // Supports the `col.ilike.%pat%` / `col.eq.val` disjunctions used in the app.
    const clauses = expression.split(',').map((clause) => {
      const [column, operator, ...rest] = clause.split('.');
      const value = rest.join('.');
      return { column, operator, value };
    });
    this.filters.push((row) =>
      clauses.some(({ column, operator, value }) => {
        const cell = row[column];
        if (operator === 'eq') return String(cell) === value;
        if (operator === 'ilike' || operator === 'like') {
          const pattern = value.replace(/%/g, '');
          return typeof cell === 'string' && cell.toLowerCase().includes(pattern.toLowerCase());
        }
        return false;
      }),
    );
    return this;
  }

  is(column: string, value: unknown) {
    this.filters.push((row) => row[column] === value || (value === null && row[column] == null));
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.orderings.push({ column: column.split(',')[0].trim(), ascending: options?.ascending !== false });
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  range(from: number, to: number) {
    this.limitCount = to - from + 1;
    return this;
  }

  single() {
    this.wantSingle = 'single';
    return this;
  }

  maybeSingle() {
    this.wantSingle = 'maybeSingle';
    return this;
  }

  private execute(): { data: unknown; error: null | { message: string; code?: string } } {
    try {
      const rows = readDemoTable(this.table);
      const matches = (row: Row) => this.filters.every((f) => f(row));
      const now = new Date().toISOString();

      let resultRows: Row[] = [];

      if (this.op === 'select') {
        resultRows = rows.filter(matches);
      } else if (this.op === 'insert' || this.op === 'upsert') {
        const incoming = (Array.isArray(this.payload) ? this.payload : [this.payload]) as Row[];
        const next = [...rows];
        for (const item of incoming) {
          const record: Row = { created_at: now, updated_at: now, ...item };
          if (record.id == null || record.id === '') record.id = newId();
          let replaced = false;
          if (this.op === 'upsert') {
            const idx = next.findIndex((r) => this.upsertOnConflict.every((k) => r[k] === record[k]));
            if (idx >= 0) {
              next[idx] = { ...next[idx], ...record, updated_at: now };
              resultRows.push(next[idx]);
              replaced = true;
            }
          }
          if (!replaced) {
            next.push(record);
            resultRows.push(record);
          }
        }
        writeDemoTable(this.table, next);
      } else if (this.op === 'update') {
        const next = rows.map((row) => {
          if (!matches(row)) return row;
          const updated = { ...row, ...(this.payload as Row), updated_at: now };
          resultRows.push(updated);
          return updated;
        });
        writeDemoTable(this.table, next);
      } else if (this.op === 'delete') {
        const next = rows.filter((row) => {
          if (matches(row)) {
            resultRows.push(row);
            return false;
          }
          return true;
        });
        writeDemoTable(this.table, next);
      }

      for (const { column, ascending } of [...this.orderings].reverse()) {
        resultRows.sort((a, b) => {
          const av = a[column];
          const bv = b[column];
          if (av == null && bv == null) return 0;
          if (av == null) return 1;
          if (bv == null) return -1;
          if (av < bv) return ascending ? -1 : 1;
          if (av > bv) return ascending ? 1 : -1;
          return 0;
        });
      }

      if (this.limitCount != null) resultRows = resultRows.slice(0, this.limitCount);

      if (this.embeds.length > 0) {
        resultRows = resultRows.map((row) => attachEmbeds(this.table, row, this.embeds));
      }

      if (this.wantSingle) {
        if (resultRows.length === 0) {
          if (this.wantSingle === 'maybeSingle') return { data: null, error: null };
          return { data: null, error: { message: 'No rows found', code: 'PGRST116' } };
        }
        return { data: resultRows[0], error: null };
      }

      if (this.op !== 'select' && !this.returnRows) {
        return { data: null, error: null };
      }

      return { data: resultRows, error: null };
    } catch (err) {
      return { data: null, error: { message: err instanceof Error ? err.message : 'Demo DB error' } };
    }
  }

  then<TResult1 = { data: unknown; error: null | { message: string } }, TResult2 = never>(
    onfulfilled?: ((value: { data: unknown; error: null | { message: string; code?: string } }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    return Promise.resolve(this.execute()).then(onfulfilled, onrejected);
  }
}

// ---------- mock client ----------

/**
 * Creates the demo-mode client. Its type is intentionally `any`-compatible
 * with the real SupabaseClient for the subset of methods the app uses; no
 * network request is ever issued.
 */
export function createDemoSupabaseClient() {
  const noSession = { data: { session: null }, error: null };
  return {
    from(table: string) {
      return new DemoQueryBuilder(table);
    },
    auth: {
      getSession: async () => noSession,
      getUser: async () => ({ data: { user: null }, error: null }),
      onAuthStateChange: (_cb: unknown) => ({
        data: { subscription: { unsubscribe: () => undefined } },
      }),
      signInWithPassword: async () => ({
        data: { session: null, user: null },
        error: { message: 'Sign-in is disabled in the prototype preview.' },
      }),
      signOut: async () => ({ error: null }),
      resetPasswordForEmail: async () => ({
        data: {},
        error: { message: 'Password reset is disabled in the prototype preview.' },
      }),
      updateUser: async () => ({
        data: { user: null },
        error: { message: 'Account changes are disabled in the prototype preview.' },
      }),
    },
    storage: {
      createBucket: async () => ({ data: null, error: null }),
      from: (_bucket: string) => ({
        upload: async () => ({ data: null, error: { message: 'Uploads are disabled in the prototype preview.' } }),
        getPublicUrl: (path: string) => ({ data: { publicUrl: path } }),
      }),
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
}

/** Remove every demo table from localStorage (used on demo reset/exit). */
export function clearDemoDb(): void {
  try {
    const doomed: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(DEMO_DB_PREFIX)) doomed.push(key);
    }
    doomed.forEach((k) => localStorage.removeItem(k));
  } catch {
    /* noop */
  }
}
