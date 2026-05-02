#!/usr/bin/env node
/**
 * Check Supabase categories tables: list columns (from first row) and sample data.
 * Run from project root with env vars (or .env with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY):
 *   node scripts/check-supabase-categories.js
 * Or:
 *   VITE_SUPABASE_URL=https://xxx.supabase.co VITE_SUPABASE_ANON_KEY=eyJ... node scripts/check-supabase-categories.js
 *
 * If year_groups is missing from the table, run the migration in Supabase SQL Editor:
 *   - For custom_categories: supabase_migrations/add_custom_categories_year_groups.sql
 *   - For categories: supabase_migrations/add_categories_year_groups_and_use_categories.sql
 */

const url = process.env.VITE_SUPABASE_URL || 'https://wiudrzdkbpyziaodqoog.supabase.co';
const key = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpdWRyemRrYnB5emlhb2Rxb29nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5MzgxNzcsImV4cCI6MjA2NjUxNDE3N30.LpD82hY_1wYzroA09nYfaz13iNx5gRJzmPTt0gPCLMI';

async function fetchTable(tableName) {
  const res = await fetch(`${url}/rest/v1/${tableName}?limit=3`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) {
    return { error: res.status, body: await res.text() };
  }
  return res.json();
}

async function main() {
  console.log('Supabase URL:', url.replace(/\/$/, ''));
  console.log('');

  for (const table of ['categories', 'custom_categories']) {
    console.log('---', table, '---');
    const data = await fetchTable(table);
    if (data.error) {
      console.log('  Error:', data.error, data.body?.slice?.(0, 200) || '');
      console.log('');
      continue;
    }
    const rows = Array.isArray(data) ? data : [];
    console.log('  Row count (sample):', rows.length);
    if (rows.length > 0) {
      const keys = Object.keys(rows[0]);
      console.log('  Columns:', keys.join(', '));
      const hasYearGroups = keys.includes('year_groups');
      console.log('  year_groups column:', hasYearGroups ? 'YES' : 'MISSING – run migration');
      rows.slice(0, 2).forEach((row, i) => {
        console.log('  Row', i + 1, '| name:', row.name, '| year_groups:', JSON.stringify(row.year_groups ?? 'N/A'));
      });
    } else {
      console.log('  (no rows)');
    }
    console.log('');
  }

  console.log('If year_groups is MISSING, run in Supabase SQL Editor:');
  console.log('  - custom_categories: supabase_migrations/add_custom_categories_year_groups.sql');
  console.log('  - categories: supabase_migrations/add_categories_year_groups_and_use_categories.sql');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
