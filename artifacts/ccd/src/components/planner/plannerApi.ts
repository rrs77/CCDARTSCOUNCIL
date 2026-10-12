import { supabase, TABLES, isSupabaseConfigured } from '../../config/supabase';
import { isDemoModeActive } from '../../utils/demoMode';
import type { LessonPlan } from '../../contexts/DataContext';
import { DEFAULT_PREFS, type PlannerPrefs, type PlannerReflection } from './plannerModel';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DEMO_USER_ID = '00000000-0000-4000-8000-000000000d10';

/** Authenticated user id, or null. Every Planner read and write is scoped to it (fail closed). */
export const plannerUserId = (): string | null => {
  if (isDemoModeActive()) return DEMO_USER_ID;
  const id = localStorage.getItem('rhythmstix_user_id');
  return id && UUID.test(id) ? id : null;
};

const rowToPlan = (row: Record<string, any>): LessonPlan => ({
  id: row.id,
  date: new Date(row.date),
  week: row.week,
  className: row.class_name,
  activities: row.activities || [],
  duration: row.duration || 0,
  notes: row.notes || '',
  status: row.status || 'planned',
  unitId: row.unit_id || undefined,
  unitName: row.unit_name || undefined,
  lessonNumber: row.lesson_number || undefined,
  title: row.title || undefined,
  term: row.term || undefined,
  time: row.time || undefined,
  createdAt: row.created_at ? new Date(row.created_at) : new Date(),
  updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),
});

/** Same column mapping as DataContext.saveUserCreatedLessonPlans, so both apps read identical rows. */
const planToRow = (plan: LessonPlan, userId: string) => ({
  id: plan.id,
  date: plan.date instanceof Date ? plan.date.toISOString() : new Date(plan.date).toISOString(),
  week: plan.week,
  class_name: plan.className,
  activities: plan.activities,
  duration: plan.duration,
  notes: plan.notes,
  status: plan.status,
  unit_id: plan.unitId,
  unit_name: plan.unitName,
  lesson_number: plan.lessonNumber,
  title: plan.title,
  term: plan.term,
  time: plan.time,
  user_id: userId,
});

const LOCAL_PLANS_KEY = 'planner-lesson-plans';

export const plannerApi = {
  /** All of the teacher's scheduled lessons between two dates, across every class. */
  async plansInRange(from: Date, to: Date): Promise<LessonPlan[]> {
    const userId = plannerUserId();
    if (!userId || !isSupabaseConfigured()) {
      try {
        const raw = JSON.parse(localStorage.getItem(LOCAL_PLANS_KEY) || '[]') as Record<string, any>[];
        return raw.map((p) => ({ ...p, date: new Date(p.date) }) as LessonPlan).filter((p) => p.date >= from && p.date <= to);
      } catch {
        return [];
      }
    }
    const { data, error } = await supabase
      .from(TABLES.LESSON_PLANS)
      .select('*')
      .eq('user_id', userId)
      .gte('date', from.toISOString())
      .lte('date', to.toISOString());
    if (error) throw error;
    return (data || []).map(rowToPlan);
  },

  /** Insert or update individual plans. Never deletes and never renumbers lessons. */
  async savePlans(plans: LessonPlan[]): Promise<void> {
    const userId = plannerUserId();
    if (!userId || !isSupabaseConfigured()) {
      const raw = JSON.parse(localStorage.getItem(LOCAL_PLANS_KEY) || '[]') as LessonPlan[];
      const byId = new Map(raw.map((p) => [p.id, p]));
      plans.forEach((p) => byId.set(p.id, p));
      localStorage.setItem(LOCAL_PLANS_KEY, JSON.stringify([...byId.values()]));
      return;
    }
    const { error } = await supabase
      .from(TABLES.LESSON_PLANS)
      .upsert(plans.map((p) => planToRow({ ...p, updatedAt: new Date() }, userId)), { onConflict: 'id' });
    if (error) throw error;
  },

  async reflections(planIds: string[]): Promise<Record<string, PlannerReflection>> {
    const userId = plannerUserId();
    if (!userId || planIds.length === 0 || !isSupabaseConfigured()) return {};
    const { data, error } = await supabase
      .from('planner_reflections')
      .select('*')
      .eq('user_id', userId)
      .in('lesson_plan_id', planIds);
    if (error) {
      console.warn('Planner reflections unavailable:', error.message);
      return {};
    }
    const out: Record<string, PlannerReflection> = {};
    (data || []).forEach((r: Record<string, any>) => {
      out[r.lesson_plan_id] = {
        lessonPlanId: r.lesson_plan_id,
        className: r.class_name,
        lessonDate: r.lesson_date,
        outcome: r.outcome,
        wentWell: r.went_well || '',
        toRevisit: r.to_revisit || '',
        nextTime: r.next_time || '',
      };
    });
    return out;
  },

  async saveReflection(r: PlannerReflection): Promise<void> {
    const userId = plannerUserId();
    if (!userId) throw new Error('Sign in to save reflections.');
    const { error } = await supabase.from('planner_reflections').upsert(
      {
        user_id: userId,
        lesson_plan_id: r.lessonPlanId,
        class_name: r.className,
        lesson_date: r.lessonDate,
        outcome: r.outcome,
        went_well: r.wentWell,
        to_revisit: r.toRevisit,
        next_time: r.nextTime,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,lesson_plan_id' },
    );
    if (error) throw error;
  },

  async prefs(): Promise<PlannerPrefs> {
    const local = (() => {
      try {
        return { ...DEFAULT_PREFS, ...JSON.parse(localStorage.getItem('planner-prefs') || '{}') } as PlannerPrefs;
      } catch {
        return DEFAULT_PREFS;
      }
    })();
    const userId = plannerUserId();
    if (!userId || !isSupabaseConfigured()) return local;
    const { data } = await supabase
      .from(TABLES.BRANDING_SETTINGS)
      .select('data')
      .eq('key', `user:${userId}:planner_prefs`)
      .maybeSingle();
    return data?.data ? { ...DEFAULT_PREFS, ...(data.data as Partial<PlannerPrefs>) } : local;
  },

  async savePrefs(prefs: PlannerPrefs): Promise<void> {
    localStorage.setItem('planner-prefs', JSON.stringify(prefs));
    const userId = plannerUserId();
    if (!userId || !isSupabaseConfigured()) return;
    const { error } = await supabase
      .from(TABLES.BRANDING_SETTINGS)
      .upsert(
        { key: `user:${userId}:planner_prefs`, data: prefs, updated_at: new Date().toISOString() },
        { onConflict: 'key' },
      );
    if (error) console.warn('Planner preferences saved on this device only:', error.message);
  },
};
