import { useState, useEffect, useMemo, useSyncExternalStore } from 'react';
import toast from 'react-hot-toast';
import { lessonStacksApi, resolveStackScope } from '../config/lessonStacksApi';
import {
  localStacksKey,
  mergeStacks,
  newStackId,
  readLocalStacks,
  unitsAsSchemes,
  writeLocalStacks,
} from '../utils/lessonStacksLocal';

export interface StackedLesson {
  id: string;
  name: string;
  description?: string;
  color: string;
  lessons: string[];
  totalTime: number;
  totalActivities: number;
  customObjectives?: string[]; // Curriculum objectives for the stack
  curriculumType?: 'EYFS' | 'CUSTOM'; // Type of curriculum
  created_at: string;
  /** Saved on this device only because the Supabase save failed; retried on next load. */
  localOnly?: boolean;
  /** 'unit' = a My units entry shown read-only in Half-terms (see includeUnits). */
  source?: 'stack' | 'unit';
  classSheet?: string;
}

// ---------------------------------------------------------------------------
// One shared store for every useLessonStacks() caller, so the Lessons page,
// Half-terms › Add scheme and the boards all see the same list immediately.
// ---------------------------------------------------------------------------
type StoreState = { stacks: StackedLesson[]; loading: boolean; scopeKey: string | null };
let state: StoreState = { stacks: [], loading: true, scopeKey: null };
const listeners = new Set<() => void>();
let inflight: Promise<void> | null = null;

function emit(next: Partial<StoreState>) {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
}
function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}
const getSnapshot = () => state;

function storage(): Storage | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
}

async function currentLocalKey(): Promise<string> {
  const { organisationId, userId } = await resolveStackScope();
  return localStacksKey(userId, organisationId);
}

function persistLocal(key: string, stacks: StackedLesson[]) {
  writeLocalStacks(storage(), key, stacks.filter((s) => s.localOnly));
}

/** Load server stacks, merge this user's device-only stacks, and try to upload those. */
export async function reloadLessonStacks(): Promise<void> {
  if (inflight) return inflight;
  inflight = (async () => {
    const key = await currentLocalKey();
    let local = readLocalStacks(storage(), key) as StackedLesson[];
    let remote: StackedLesson[] = [];
    try {
      remote = await lessonStacksApi.getAllStrict();
    } catch (error) {
      console.error('Failed to load lesson stacks from Supabase; showing this device\'s copies:', error);
    }
    // Retry uploading device-only stacks (e.g. once the DB migration is applied).
    const remoteIds = new Set(remote.map((s) => s.id));
    const stillLocal: StackedLesson[] = [];
    for (const s of local) {
      if (remoteIds.has(s.id)) continue;
      try {
        const saved = await lessonStacksApi.create({ ...s, id: s.id, created_at: s.created_at });
        remote = [saved, ...remote];
      } catch {
        stillLocal.push(s);
      }
    }
    local = stillLocal;
    writeLocalStacks(storage(), key, local);
    emit({ stacks: mergeStacks(remote, local) as StackedLesson[], loading: false, scopeKey: key });
  })().finally(() => {
    inflight = null;
  });
  return inflight;
}

/** Test/logout helper: forget the in-memory list (device copies stay in localStorage). */
export function resetLessonStacksStore() {
  state = { stacks: [], loading: true, scopeKey: null };
  listeners.forEach((l) => l());
}

export function useLessonStacks(options: { includeUnits?: boolean } = {}) {
  const snap = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const stacks = snap.stacks;
  const loading = snap.loading;
  const [unitsTick, setUnitsTick] = useState(0);

  // Reload on every mount: cheap, and picks up changes made in other tabs/users.
  useEffect(() => {
    void reloadLessonStacks();
  }, []);

  useEffect(() => {
    if (!options.includeUnits) return;
    const bump = () => setUnitsTick((n) => n + 1);
    window.addEventListener('storage', bump);
    window.addEventListener('focus', bump);
    return () => {
      window.removeEventListener('storage', bump);
      window.removeEventListener('focus', bump);
    };
  }, [options.includeUnits]);

  /** Lesson stacks plus My units (read-only), for Half-terms › Add scheme and the boards. */
  const schemes = useMemo(() => {
    if (!options.includeUnits) return stacks;
    const ids = new Set(stacks.map((s) => s.id));
    const units = (unitsAsSchemes(storage()) as StackedLesson[]).filter((u) => !ids.has(u.id));
    return [...stacks, ...units];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stacks, options.includeUnits, unitsTick]);

  const setStacks = (updater: StackedLesson[] | ((prev: StackedLesson[]) => StackedLesson[])) => {
    const next = typeof updater === 'function' ? updater(state.stacks) : updater;
    emit({ stacks: next });
    return next;
  };

  const createStack = async (stackData: Omit<StackedLesson, 'id' | 'created_at'>) => {
    try {
      const newStack = await lessonStacksApi.create(stackData);
      setStacks((prev) => [...prev.filter((s) => s.id !== newStack.id), newStack]);
      return newStack;
    } catch (error) {
      console.error('Failed to create stack; keeping it on this device:', error);
      // LOCAL FALLBACK: this user + organisation only, retried on next load.
      const newStack: StackedLesson = {
        ...stackData,
        id: newStackId(),
        created_at: new Date().toISOString(),
        localOnly: true,
        source: 'stack',
      };
      const key = await currentLocalKey();
      const next = setStacks((prev) => [...prev, newStack]);
      persistLocal(key, next);
      toast('Saved on this device only for now. It will sync to your account when it can.', {
        icon: '⚠️',
        duration: 5000,
      });
      return newStack;
    }
  };

  const updateStack = async (id: string, updates: Partial<Omit<StackedLesson, 'id' | 'created_at'>>) => {
    const existing = state.stacks.find((s) => s.id === id);
    if (existing?.localOnly) {
      const key = await currentLocalKey();
      const next = setStacks((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
      persistLocal(key, next);
      return next.find((s) => s.id === id);
    }
    try {
      const updatedStack = await lessonStacksApi.update(id, updates);
      setStacks((prev) => prev.map((stack) => (stack.id === id ? updatedStack : stack)));
      return updatedStack;
    } catch (error) {
      console.error('Failed to update stack:', error);
      toast.error('Could not save that change to the unit. Please try again.');
      return undefined;
    }
  };

  const deleteStack = async (id: string) => {
    const existing = state.stacks.find((s) => s.id === id);
    if (existing?.localOnly) {
      const key = await currentLocalKey();
      const next = setStacks((prev) => prev.filter((s) => s.id !== id));
      persistLocal(key, next);
      return;
    }
    try {
      await lessonStacksApi.delete(id);
      setStacks((prev) => prev.filter((stack) => stack.id !== id));
    } catch (error) {
      console.error('Failed to delete stack:', error);
      toast.error('Could not delete that unit. Please try again.');
    }
  };

  const getStackById = (id: string): StackedLesson | undefined => {
    return stacks.find(stack => stack.id === id);
  };

  const getStacksByLesson = (lessonNumber: string): StackedLesson[] => {
    return stacks.filter(stack => stack.lessons.includes(lessonNumber));
  };

  const isLessonInAnyStack = (lessonNumber: string): boolean => {
    return stacks.some(stack => stack.lessons.includes(lessonNumber));
  };

  const getAvailableLessons = (allLessonNumbers: string[], excludeStackId?: string): string[] => {
    return allLessonNumbers.filter(lessonNum => {
      return !stacks.some(stack => 
        stack.id !== excludeStackId && stack.lessons.includes(lessonNum)
      );
    });
  };

  const reorderStacks = (fromIndex: number, toIndex: number) => {
    setStacks(prev => {
      const newStacks = [...prev];
      const [movedStack] = newStacks.splice(fromIndex, 1);
      newStacks.splice(toIndex, 0, movedStack);
      return newStacks;
    });
  };

  const duplicateStack = (id: string, newName: string, newColor?: string) => {
    const originalStack = getStackById(id);
    if (!originalStack) return null;

    const duplicatedStack = {
      ...originalStack,
      name: newName,
      color: newColor || originalStack.color,
      lessons: [...originalStack.lessons],
      id: `stack-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date().toISOString()
    };

    setStacks(prev => [...prev, duplicatedStack]);
    return duplicatedStack;
  };

  const exportStacks = () => {
    const dataStr = JSON.stringify(stacks, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `lesson-stacks-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const importStacks = (file: File): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedStacks = JSON.parse(e.target?.result as string);
          if (Array.isArray(importedStacks)) {
            // Validate the imported data structure
            const validStacks = importedStacks.filter(stack => 
              stack.id && 
              stack.name && 
              stack.lessons && 
              Array.isArray(stack.lessons)
            );
            
            if (validStacks.length > 0) {
              setStacks(validStacks);
              resolve(true);
            } else {
              reject(new Error('No valid stacks found in the imported file'));
            }
          } else {
            reject(new Error('Invalid file format'));
          }
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };

  const clearAllStacks = () => {
    setStacks([]);
  };

  return {
    stacks,
    /** stacks + My units (only when called with { includeUnits: true }) */
    schemes,
    loading,
    createStack,
    updateStack,
    deleteStack,
    getStackById,
    getStacksByLesson,
    isLessonInAnyStack,
    getAvailableLessons,
    reorderStacks,
    duplicateStack,
    exportStacks,
    importStacks,
    clearAllStacks
  };
}
