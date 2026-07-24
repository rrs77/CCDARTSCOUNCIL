import type { LsoCustomPage } from '../../../../utils/lsoSiteContent';
import { LsoEditableHtml, LsoImageSlot, LsoPlainField } from '../LsoEditable';

interface TemplateProps {
  page: LsoCustomPage;
  editing: boolean;
  onChange: (patch: Partial<LsoCustomPage>) => void;
}

function patchField(
  page: LsoCustomPage,
  key: string,
  html: string,
): Partial<LsoCustomPage> {
  return { fields: { ...page.fields, [key]: html } };
}

function patchMeta(page: LsoCustomPage, key: string, value: string): Partial<LsoCustomPage> {
  return { meta: { ...page.meta, [key]: value } };
}

function patchImage(
  page: LsoCustomPage,
  key: string,
  image: { src: string; alt: string } | null,
): Partial<LsoCustomPage> {
  const images = { ...page.images };
  if (!image || !image.src) delete images[key];
  else images[key] = image;
  return { images };
}

/** 1 — Hero + intro + CTA */
export function HeroIntroCtaTemplate({ page, editing, onChange }: TemplateProps) {
  const ctaUrl = page.meta.ctaUrl || '#';
  const ctaLabel = page.meta.ctaLabel || 'Learn more';

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <LsoImageSlot
        editing={editing}
        image={page.images.hero}
        onChange={(img) => onChange(patchImage(page, 'hero', img))}
        label="Hero image"
        aspectClassName="aspect-[21/9] min-h-[180px]"
        className="rounded-none"
      />
      <div className="space-y-4 px-5 py-6 sm:px-8 sm:py-8">
        <LsoEditableHtml
          editing={editing}
          html={page.fields.headline || ''}
          onChange={(html) => onChange(patchField(page, 'headline', html))}
          label="Headline"
          placeholder="Page headline…"
        />
        <LsoEditableHtml
          editing={editing}
          html={page.fields.intro || ''}
          onChange={(html) => onChange(patchField(page, 'intro', html))}
          label="Intro"
          placeholder="Supporting introduction…"
        />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          {editing ? (
            <>
              <LsoPlainField
                editing
                label="CTA label"
                value={ctaLabel}
                onChange={(v) => onChange(patchMeta(page, 'ctaLabel', v))}
                className="flex-1"
              />
              <LsoPlainField
                editing
                label="CTA link"
                value={ctaUrl}
                onChange={(v) => onChange(patchMeta(page, 'ctaUrl', v))}
                className="flex-[1.4]"
                placeholder="https://…"
              />
            </>
          ) : (
            <a
              href={ctaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-fit items-center justify-center rounded-lg bg-[#0a1628] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-95"
            >
              {ctaLabel}
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

/** 2 — Two-column story */
export function TwoColumnStoryTemplate({ page, editing, onChange }: TemplateProps) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="grid gap-6 lg:grid-cols-2 lg:items-center lg:gap-10">
        <div className="space-y-3">
          <LsoEditableHtml
            editing={editing}
            html={page.fields.title || ''}
            onChange={(html) => onChange(patchField(page, 'title', html))}
            label="Title"
          />
          <LsoEditableHtml
            editing={editing}
            html={page.fields.body || ''}
            onChange={(html) => onChange(patchField(page, 'body', html))}
            label="Story"
            minHeight="160px"
          />
        </div>
        <LsoImageSlot
          editing={editing}
          image={page.images.side}
          onChange={(img) => onChange(patchImage(page, 'side', img))}
          label="Story image"
          aspectClassName="aspect-[4/3]"
        />
      </div>
    </article>
  );
}

/** 3 — Resources / link list */
export function ResourcesListTemplate({ page, editing, onChange }: TemplateProps) {
  return (
    <article className="rounded-2xl border border-teal-200 bg-teal-50/40 p-5 shadow-sm sm:p-7">
      <div className="space-y-4">
        <LsoEditableHtml
          editing={editing}
          html={page.fields.title || ''}
          onChange={(html) => onChange(patchField(page, 'title', html))}
          label="Title"
        />
        <LsoEditableHtml
          editing={editing}
          html={page.fields.intro || ''}
          onChange={(html) => onChange(patchField(page, 'intro', html))}
          label="Intro"
        />
        <div className="rounded-xl border border-teal-100 bg-white/90 p-4 sm:p-5">
          <LsoEditableHtml
            editing={editing}
            html={page.fields.list || ''}
            onChange={(html) => onChange(patchField(page, 'list', html))}
            label="Resource list (use links in the toolbar)"
            minHeight="180px"
            placeholder="Add bullet points with links…"
          />
        </div>
      </div>
    </article>
  );
}

/** 4 — Programme / cards grid */
export function ProgrammeGridTemplate({ page, editing, onChange }: TemplateProps) {
  const cards = [
    { title: 'card1Title', body: 'card1Body', image: 'card1', label: 'Card 1' },
    { title: 'card2Title', body: 'card2Body', image: 'card2', label: 'Card 2' },
    { title: 'card3Title', body: 'card3Body', image: 'card3', label: 'Card 3' },
  ] as const;

  return (
    <article className="space-y-5">
      <LsoEditableHtml
        editing={editing}
        html={page.fields.title || ''}
        onChange={(html) => onChange(patchField(page, 'title', html))}
        label="Section title"
        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <div
            key={card.label}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
          >
            <LsoImageSlot
              editing={editing}
              image={page.images[card.image]}
              onChange={(img) => onChange(patchImage(page, card.image, img))}
              label={`${card.label} image`}
              aspectClassName="aspect-[16/10]"
              className="rounded-none"
            />
            <div className="space-y-2 p-4">
              <LsoEditableHtml
                editing={editing}
                html={page.fields[card.title] || ''}
                onChange={(html) => onChange(patchField(page, card.title, html))}
                label={`${card.label} title`}
                minHeight="60px"
              />
              <LsoEditableHtml
                editing={editing}
                html={page.fields[card.body] || ''}
                onChange={(html) => onChange(patchField(page, card.body, html))}
                label={`${card.label} blurb`}
                minHeight="80px"
              />
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

/** 5 — Event / date spotlight */
export function EventSpotlightTemplate({ page, editing, onChange }: TemplateProps) {
  const dateLabel = page.meta.dateLabel || 'Date TBC';
  const venue = page.meta.venue || '';

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-[#0a1628] text-white shadow-sm">
      <div className="grid lg:grid-cols-2">
        <div className="space-y-4 p-6 sm:p-8">
          {editing ? (
            <LsoPlainField
              editing
              label="Date / when"
              value={dateLabel}
              onChange={(v) => onChange(patchMeta(page, 'dateLabel', v))}
              className="[&_span]:text-teal-200 [&_input]:text-gray-900"
            />
          ) : (
            <p className="inline-flex rounded-md bg-[#3DB7E4]/20 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-[#3DB7E4]">
              {dateLabel}
            </p>
          )}
          <div className="lso-event-prose [&_.lso-prose]:text-white/90 [&_.lso-prose_h2]:text-white [&_.lso-prose_h3]:text-white [&_.lso-prose_a]:text-[#3DB7E4]">
            <LsoEditableHtml
              editing={editing}
              html={page.fields.title || ''}
              onChange={(html) => onChange(patchField(page, 'title', html))}
              label="Event title"
              className={editing ? '' : 'border-0 bg-transparent p-0'}
            />
            <LsoEditableHtml
              editing={editing}
              html={page.fields.details || ''}
              onChange={(html) => onChange(patchField(page, 'details', html))}
              label="Details"
              className={editing ? 'mt-3' : 'mt-3 border-0 bg-transparent p-0'}
            />
          </div>
          {editing ? (
            <LsoPlainField
              editing
              label="Venue"
              value={venue}
              onChange={(v) => onChange(patchMeta(page, 'venue', v))}
              className="[&_span]:text-teal-200 [&_input]:text-gray-900"
            />
          ) : (
            venue && <p className="text-sm text-white/70">{venue}</p>
          )}
        </div>
        <LsoImageSlot
          editing={editing}
          image={page.images.poster}
          onChange={(img) => onChange(patchImage(page, 'poster', img))}
          label="Event image"
          aspectClassName="aspect-[4/3] lg:aspect-auto lg:min-h-full"
          className="rounded-none bg-slate-800"
        />
      </div>
    </article>
  );
}

export function LsoTemplateRenderer(props: TemplateProps) {
  switch (props.page.template) {
    case 'hero-intro-cta':
      return <HeroIntroCtaTemplate {...props} />;
    case 'two-column-story':
      return <TwoColumnStoryTemplate {...props} />;
    case 'resources-list':
      return <ResourcesListTemplate {...props} />;
    case 'programme-grid':
      return <ProgrammeGridTemplate {...props} />;
    case 'event-spotlight':
      return <EventSpotlightTemplate {...props} />;
    default:
      return (
        <p className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-600">
          Unknown template.
        </p>
      );
  }
}
