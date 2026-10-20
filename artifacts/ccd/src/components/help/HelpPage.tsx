import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  ChevronRight,
  Compass,
  Lightbulb,
  Search,
  Sparkles,
} from 'lucide-react';
import {
  HELP_PRODUCT_NAME,
  HELP_TOPICS,
  getHelpTopic,
  searchHelp,
  type HelpTopicId,
} from './topics';
import {
  clearHelpUrlIfPresent,
  helpHomePath,
  helpTopicPath,
  isHelpPath,
  syncHelpUrl,
  topicFromHelpPath,
} from './routes';

const LOGO_SRC = '/login/ccd-logo.png?v=help-1';
const SCREENSHOT_BASE = '/help/screenshots';

interface HelpPageProps {
  initialTopic?: HelpTopicId | null;
}

function startQuickTour() {
  try {
    window.dispatchEvent(new Event('ccd:start-walkthrough'));
  } catch {
    /* ignore */
  }
}

function openAppTab(tab?: string) {
  if (!tab) return;
  if (tab === 'settings' || tab === 'settings-users') {
    void import('../settings/routes').then(({ navigateToSettings }) => {
      navigateToSettings(tab === 'settings-users' ? 'users' : undefined);
    });
    return;
  }
  window.dispatchEvent(new CustomEvent('ccd:open-tab', { detail: { tab } }));
  if (typeof window !== 'undefined' && isHelpPath(window.location.pathname)) {
    clearHelpUrlIfPresent();
  }
}

export function HelpPage({ initialTopic = null }: HelpPageProps) {
  const [topicId, setTopicId] = useState<HelpTopicId | null>(() => {
    if (initialTopic) return initialTopic;
    if (typeof window !== 'undefined') return topicFromHelpPath(window.location.pathname);
    return null;
  });
  const [query, setQuery] = useState('');
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const articleRef = useRef<HTMLElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const topic = topicId ? getHelpTopic(topicId) : null;
  const searchHits = useMemo(() => searchHelp(query), [query]);
  const showSearch = query.trim().length > 0;

  useEffect(() => {
    const onPop = () => {
      if (!isHelpPath(window.location.pathname)) return;
      setTopicId(topicFromHelpPath(window.location.pathname));
      setQuery('');
    };
    const onTopic = (e: Event) => {
      const next = (e as CustomEvent<{ topic?: HelpTopicId | null }>).detail?.topic ?? null;
      setTopicId(next);
    };
    window.addEventListener('popstate', onPop);
    window.addEventListener('ccd:help-topic', onTopic);
    return () => {
      window.removeEventListener('popstate', onPop);
      window.removeEventListener('ccd:help-topic', onTopic);
    };
  }, []);

  useEffect(() => {
    if (topic?.sections[0]) {
      setActiveSectionId(topic.sections[0].id);
    } else {
      setActiveSectionId(null);
    }
    if (articleRef.current) articleRef.current.scrollTop = 0;
  }, [topicId]);

  // Sticky contents: highlight section in view
  useEffect(() => {
    if (!topic || !articleRef.current) return;
    const root = articleRef.current;
    const nodes = topic.sections
      .map((s) => root.querySelector(`#help-section-${s.id}`))
      .filter(Boolean) as HTMLElement[];
    if (!nodes.length) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target?.id) {
          setActiveSectionId(visible.target.id.replace('help-section-', ''));
        }
      },
      { root, rootMargin: '-12% 0px -55% 0px', threshold: [0.15, 0.4, 0.7] },
    );
    nodes.forEach((n) => obs.observe(n));
    return () => obs.disconnect();
  }, [topic]);

  const goHome = () => {
    setTopicId(null);
    setQuery('');
    syncHelpUrl(null);
  };

  const goTopic = (id: HelpTopicId, sectionId?: string) => {
    setTopicId(id);
    setQuery('');
    syncHelpUrl(id);
    if (sectionId) {
      window.setTimeout(() => {
        document.getElementById(`help-section-${sectionId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 80);
    }
  };

  return (
    <div className="ccd-help-page min-h-0 h-full flex flex-col bg-[#F7F6FB]">
      {/* Hero */}
      <header className="relative overflow-hidden border-b border-[#E2E0EF] bg-gradient-to-br from-[#E9E6FF] via-[#F7F6FB] to-[#E6F7F4]">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 12% 20%, rgba(67,56,232,0.18), transparent 42%), radial-gradient(circle at 88% 10%, rgba(13,148,136,0.14), transparent 40%)',
          }}
        />
        <div className="relative mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <img
                src={LOGO_SRC}
                alt={HELP_PRODUCT_NAME}
                className="h-10 w-auto object-contain sm:h-12 lg:h-14"
                decoding="async"
              />
              <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-[#1F1B4D] sm:text-3xl lg:text-[2rem]">
                {HELP_PRODUCT_NAME}
              </h1>
              <p className="mt-1.5 max-w-2xl text-[15px] font-medium leading-relaxed text-[#5C5878]">
                Help centre — settings, half-terms, planner, slides, users and more. Search or pick a topic.
              </p>
            </div>
            <button
              type="button"
              onClick={startQuickTour}
              className="inline-flex items-center gap-2 rounded-xl border border-[#E2E0EF] bg-white px-3.5 py-2.5 text-[13px] font-extrabold text-[#4338E8] shadow-sm transition hover:border-[#bcb7f4] hover:bg-[#FAFAFC]"
            >
              <Compass className="h-4 w-4" aria-hidden />
              Take a quick tour
            </button>
          </div>

          <div className="relative mt-6 max-w-xl">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#77738F]" />
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search help articles…"
              className="w-full rounded-2xl border border-[#E2E0EF] bg-white py-3 pl-10 pr-4 text-[14px] font-medium text-[#1F1B4D] shadow-sm outline-none ring-[#4338E8]/25 placeholder:text-[#9B97B0] focus:border-[#4338E8] focus:ring-2"
              aria-label="Search help"
            />
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-1 min-h-0 flex-col px-4 py-6 sm:px-6 lg:px-8">
        {showSearch ? (
          <SearchResults
            query={query}
            hits={searchHits}
            onOpen={(id, sectionId) => goTopic(id, sectionId)}
            onClear={() => setQuery('')}
          />
        ) : topic ? (
          <TopicView
            topicId={topic.id}
            activeSectionId={activeSectionId}
            articleRef={articleRef}
            onBack={goHome}
            onNavigateTopic={goTopic}
            onOpenApp={() => openAppTab(topic.openTab)}
          />
        ) : (
          <HomeCards onOpen={goTopic} />
        )}
      </div>
    </div>
  );
}

function HomeCards({ onOpen }: { onOpen: (id: HelpTopicId) => void }) {
  return (
    <div>
      <div className="mb-4 flex items-center gap-2 text-[13px] font-bold text-[#5C5878]">
        <Sparkles className="h-4 w-4 text-[#4338E8]" aria-hidden />
        Browse topics
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {HELP_TOPICS.map((card) => (
          <button
            key={card.id}
            type="button"
            onClick={() => onOpen(card.id)}
            className="group rounded-2xl border border-[#E2E0EF] bg-white p-4 text-left shadow-[0_1px_0_rgba(31,27,77,0.04)] transition hover:-translate-y-0.5 hover:border-[#bcb7f4] hover:shadow-md"
            style={{ borderLeftWidth: 4, borderLeftColor: card.accent }}
          >
            <span
              className="inline-flex rounded-lg px-2 py-0.5 text-[11px] font-extrabold"
              style={{ background: card.tint, color: card.accent }}
            >
              Guide
            </span>
            <h2 className="mt-2 text-[15px] font-extrabold tracking-tight text-[#1F1B4D] group-hover:text-[#4338E8]">
              {card.title}
            </h2>
            <p className="mt-1 text-[13px] font-medium leading-snug text-[#5C5878]">{card.blurb}</p>
            <span className="mt-3 inline-flex items-center gap-1 text-[12px] font-bold text-[#4338E8] opacity-0 transition group-hover:opacity-100">
              Open <ChevronRight className="h-3.5 w-3.5" />
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function SearchResults({
  query,
  hits,
  onOpen,
  onClear,
}: {
  query: string;
  hits: ReturnType<typeof searchHelp>;
  onOpen: (id: HelpTopicId, sectionId: string) => void;
  onClear: () => void;
}) {
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[14px] font-bold text-[#1F1B4D]">
          {hits.length} result{hits.length === 1 ? '' : 's'} for “{query.trim()}”
        </p>
        <button
          type="button"
          onClick={onClear}
          className="text-[13px] font-bold text-[#4338E8] hover:underline"
        >
          Clear search
        </button>
      </div>
      {hits.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#E2E0EF] bg-white px-6 py-12 text-center">
          <BookOpen className="mx-auto h-8 w-8 text-[#bcb7f4]" />
          <p className="mt-3 text-[15px] font-extrabold text-[#1F1B4D]">No matching articles</p>
          <p className="mt-1 text-[13px] font-medium text-[#5C5878]">
            Try “users”, “half-terms”, “password”, or “planner”.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {hits.map((hit) => (
            <li key={`${hit.topicId}-${hit.sectionId}`}>
              <button
                type="button"
                onClick={() => onOpen(hit.topicId, hit.sectionId)}
                className="flex w-full items-start gap-3 rounded-2xl border border-[#E2E0EF] bg-white px-4 py-3.5 text-left transition hover:border-[#bcb7f4] hover:bg-[#FAFAFC]"
              >
                <span
                  className="mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full"
                  style={{ background: hit.accent }}
                  aria-hidden
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-[12px] font-bold text-[#77738F]">
                    {hit.topicTitle}
                    <ChevronRight className="mx-1 inline h-3 w-3" />
                    {hit.sectionTitle}
                  </span>
                  <span className="mt-0.5 block text-[14px] font-extrabold text-[#1F1B4D]">
                    {hit.sectionTitle}
                  </span>
                  <span className="mt-1 block text-[13px] font-medium leading-snug text-[#5C5878]">
                    {hit.snippet}
                  </span>
                </span>
                <ArrowRight className="mt-1 h-4 w-4 flex-shrink-0 text-[#4338E8]" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function TopicView({
  topicId,
  activeSectionId,
  articleRef,
  onBack,
  onNavigateTopic,
  onOpenApp,
}: {
  topicId: HelpTopicId;
  activeSectionId: string | null;
  articleRef: React.RefObject<HTMLElement | null>;
  onBack: () => void;
  onNavigateTopic: (id: HelpTopicId) => void;
  onOpenApp: () => void;
}) {
  const topic = getHelpTopic(topicId);
  if (!topic) return null;

  const related = topic.related
    .map((id) => getHelpTopic(id))
    .filter(Boolean) as NonNullable<ReturnType<typeof getHelpTopic>>[];

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row lg:gap-8">
      {/* Sticky contents */}
      <aside className="lg:w-56 lg:flex-shrink-0">
        <div className="lg:sticky lg:top-2">
          <button
            type="button"
            onClick={onBack}
            className="mb-3 inline-flex items-center gap-1.5 text-[13px] font-bold text-[#4338E8] hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            All topics
          </button>
          <p className="mb-2 text-[11px] font-extrabold uppercase tracking-wider text-[#77738F]">
            On this page
          </p>
          <nav aria-label="Article contents" className="space-y-0.5">
            {topic.sections.map((s) => {
              const active = activeSectionId === s.id;
              return (
                <a
                  key={s.id}
                  href={`#help-section-${s.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    document
                      .getElementById(`help-section-${s.id}`)
                      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className={`block rounded-lg px-2.5 py-2 text-[13px] font-semibold transition ${
                    active
                      ? 'bg-[#E9E6FF] text-[#2A2299]'
                      : 'text-[#5C5878] hover:bg-white hover:text-[#1F1B4D]'
                  }`}
                  style={active ? { boxShadow: `inset 3px 0 0 ${topic.accent}` } : undefined}
                >
                  {s.title}
                </a>
              );
            })}
          </nav>
          {topic.openTab ? (
            <button
              type="button"
              onClick={onOpenApp}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#4338E8] px-3 py-2.5 text-[13px] font-extrabold text-white hover:bg-[#3529d1]"
            >
              Open in app
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </aside>

      {/* Article */}
      <article
        ref={articleRef as React.RefObject<HTMLElement>}
        className="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-[#E2E0EF] bg-white shadow-sm"
      >
        <div
          className="border-b border-[#E2E0EF] px-5 py-5 sm:px-8"
          style={{ background: `linear-gradient(135deg, ${topic.tint}, #ffffff)` }}
        >
          <span
            className="inline-flex rounded-lg px-2 py-0.5 text-[11px] font-extrabold"
            style={{ background: topic.tint, color: topic.accent }}
          >
            Guide
          </span>
          <h2 className="mt-2 text-xl font-extrabold tracking-tight text-[#1F1B4D] sm:text-2xl">
            {topic.title}
          </h2>
          <p className="mt-1 text-[14px] font-medium text-[#5C5878]">{topic.blurb}</p>
        </div>

        <div className="space-y-10 px-5 py-6 sm:px-8 sm:py-8">
          {topic.sections.map((section, idx) => (
            <section key={section.id} id={`help-section-${section.id}`} className="scroll-mt-4">
              <h3 className="flex items-baseline gap-2 text-lg font-extrabold text-[#1F1B4D]">
                <span
                  className="inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-[12px] font-extrabold text-white"
                  style={{ background: topic.accent }}
                >
                  {idx + 1}
                </span>
                {section.title}
              </h3>
              {section.intro ? (
                <p className="mt-3 text-[14px] font-medium leading-relaxed text-[#5C5878]">
                  {section.intro}
                </p>
              ) : null}

              {section.steps && section.steps.length > 0 ? (
                <ol className="mt-4 space-y-3">
                  {section.steps.map((step, i) => (
                    <li
                      key={step.title}
                      className="rounded-xl border border-[#E2E0EF] bg-[#FAFAFC] px-4 py-3"
                    >
                      <p className="text-[13px] font-extrabold text-[#1F1B4D]">
                        <span className="mr-1.5 text-[#4338E8]">{i + 1}.</span>
                        {step.title}
                      </p>
                      <p className="mt-1 text-[13px] font-medium leading-relaxed text-[#5C5878]">
                        {step.body}
                      </p>
                    </li>
                  ))}
                </ol>
              ) : null}

              {section.image ? (
                <figure className="mt-5 overflow-hidden rounded-xl border border-[#E2E0EF] bg-[#F4F3FA]">
                  <img
                    src={`${SCREENSHOT_BASE}/${section.image}`}
                    alt={section.imageAlt || section.title}
                    className="w-full object-cover object-top"
                    loading="lazy"
                    onError={(e) => {
                      const fig = e.currentTarget.closest('figure');
                      if (fig) fig.style.display = 'none';
                    }}
                  />
                  {section.imageAlt ? (
                    <figcaption className="border-t border-[#E2E0EF] px-3 py-2 text-[12px] font-medium text-[#77738F]">
                      {section.imageAlt}
                    </figcaption>
                  ) : null}
                </figure>
              ) : null}

              {section.tips && section.tips.length > 0 ? (
                <div className="mt-4 space-y-2">
                  {section.tips.map((tip) => (
                    <div
                      key={tip}
                      className="flex gap-2.5 rounded-xl border border-amber-200/80 bg-amber-50 px-3.5 py-3 text-[13px] font-medium text-amber-950"
                    >
                      <Lightbulb className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
                      <p>{tip}</p>
                    </div>
                  ))}
                </div>
              ) : null}
            </section>
          ))}

          {related.length > 0 ? (
            <div className="border-t border-[#E2E0EF] pt-6">
              <h3 className="text-[13px] font-extrabold uppercase tracking-wider text-[#77738F]">
                Related
              </h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {related.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => onNavigateTopic(r.id)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[#E2E0EF] bg-[#FAFAFC] px-3 py-2 text-[13px] font-bold text-[#1F1B4D] hover:border-[#bcb7f4] hover:bg-white"
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ background: r.accent }}
                      aria-hidden
                    />
                    {r.title}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E2E0EF] pt-6">
            <button
              type="button"
              onClick={startQuickTour}
              className="inline-flex items-center gap-2 text-[13px] font-extrabold text-[#4338E8] hover:underline"
            >
              <Compass className="h-4 w-4" />
              Take a quick tour
            </button>
            <a
              href={helpTopicPath(topic.id)}
              className="text-[12px] font-medium text-[#9B97B0]"
              onClick={(e) => e.preventDefault()}
            >
              {helpHomePath()}/{topic.id}
            </a>
          </div>
        </div>
      </article>
    </div>
  );
}
