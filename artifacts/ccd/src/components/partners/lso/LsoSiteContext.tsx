import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type {
  LsoCustomPage,
  LsoHubContent,
  LsoImageField,
  LsoSiteContent,
  LsoTemplateId,
} from '../../../utils/lsoSiteContent';
import {
  createLsoPage,
  emptySiteContent,
  importLsoSiteJson,
  isLsoEditorUnlocked,
  loadLsoSiteContent,
  saveLsoSiteContent,
  setLsoEditorUnlocked,
  verifyLsoEditorPassword,
} from '../../../utils/lsoSiteContent';

interface LsoSiteContextValue {
  content: LsoSiteContent;
  editing: boolean;
  unlocked: boolean;
  unlock: (password: string) => boolean;
  lock: () => void;
  setEditing: (on: boolean) => void;
  updateHub: (patch: Partial<LsoHubContent>) => void;
  setHubImage: (image: LsoImageField | null) => void;
  addPage: (title: string, template: LsoTemplateId) => LsoCustomPage;
  updatePage: (id: string, patch: Partial<LsoCustomPage>) => void;
  deletePage: (id: string) => void;
  getPageBySlug: (slug: string) => LsoCustomPage | undefined;
  replaceContent: (next: LsoSiteContent) => void;
  importJson: (raw: string) => void;
  resetToDefaults: () => void;
}

const LsoSiteContext = createContext<LsoSiteContextValue | null>(null);

export function LsoSiteProvider({
  children,
  startEditing = false,
}: {
  children: React.ReactNode;
  startEditing?: boolean;
}) {
  const [content, setContent] = useState<LsoSiteContent>(() => loadLsoSiteContent());
  const [unlocked, setUnlocked] = useState(() => isLsoEditorUnlocked());
  const [editing, setEditingState] = useState(() => startEditing && isLsoEditorUnlocked());

  useEffect(() => {
    if (startEditing && unlocked) setEditingState(true);
  }, [startEditing, unlocked]);

  const persist = useCallback((next: LsoSiteContent) => {
    setContent(next);
    saveLsoSiteContent(next);
  }, []);

  const unlock = useCallback((password: string) => {
    const ok = verifyLsoEditorPassword(password);
    if (ok) {
      setLsoEditorUnlocked(true);
      setUnlocked(true);
      setEditingState(true);
    }
    return ok;
  }, []);

  const lock = useCallback(() => {
    setLsoEditorUnlocked(false);
    setUnlocked(false);
    setEditingState(false);
  }, []);

  const setEditing = useCallback(
    (on: boolean) => {
      if (on && !unlocked) return;
      setEditingState(on);
    },
    [unlocked],
  );

  const updateHub = useCallback(
    (patch: Partial<LsoHubContent>) => {
      persist({
        ...content,
        hub: { ...content.hub, ...patch },
        updatedAt: new Date().toISOString(),
      });
    },
    [content, persist],
  );

  const setHubImage = useCallback(
    (image: LsoImageField | null) => {
      updateHub({ heroImage: image });
    },
    [updateHub],
  );

  const addPage = useCallback(
    (title: string, template: LsoTemplateId) => {
      const page = createLsoPage(title, template, content.pages);
      persist({
        ...content,
        pages: [...content.pages, page],
        updatedAt: new Date().toISOString(),
      });
      return page;
    },
    [content, persist],
  );

  const updatePage = useCallback(
    (id: string, patch: Partial<LsoCustomPage>) => {
      persist({
        ...content,
        pages: content.pages.map((p) =>
          p.id === id
            ? { ...p, ...patch, updatedAt: new Date().toISOString() }
            : p,
        ),
        updatedAt: new Date().toISOString(),
      });
    },
    [content, persist],
  );

  const deletePage = useCallback(
    (id: string) => {
      persist({
        ...content,
        pages: content.pages.filter((p) => p.id !== id),
        updatedAt: new Date().toISOString(),
      });
    },
    [content, persist],
  );

  const getPageBySlug = useCallback(
    (slug: string) => content.pages.find((p) => p.slug === slug),
    [content.pages],
  );

  const replaceContent = useCallback(
    (next: LsoSiteContent) => {
      persist(next);
    },
    [persist],
  );

  const importJson = useCallback(
    (raw: string) => {
      replaceContent(importLsoSiteJson(raw));
    },
    [replaceContent],
  );

  const resetToDefaults = useCallback(() => {
    replaceContent(emptySiteContent());
  }, [replaceContent]);

  const value = useMemo<LsoSiteContextValue>(
    () => ({
      content,
      editing: editing && unlocked,
      unlocked,
      unlock,
      lock,
      setEditing,
      updateHub,
      setHubImage,
      addPage,
      updatePage,
      deletePage,
      getPageBySlug,
      replaceContent,
      importJson,
      resetToDefaults,
    }),
    [
      content,
      editing,
      unlocked,
      unlock,
      lock,
      setEditing,
      updateHub,
      setHubImage,
      addPage,
      updatePage,
      deletePage,
      getPageBySlug,
      replaceContent,
      importJson,
      resetToDefaults,
    ],
  );

  return <LsoSiteContext.Provider value={value}>{children}</LsoSiteContext.Provider>;
}

export function useLsoSite(): LsoSiteContextValue {
  const ctx = useContext(LsoSiteContext);
  if (!ctx) throw new Error('useLsoSite must be used within LsoSiteProvider');
  return ctx;
}
