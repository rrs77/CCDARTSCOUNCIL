import React from 'react';

/**
 * DRAFT — FOR OWNER REVIEW before publishing as binding community rules.
 */
export function ForumGuidelines() {
  return (
    <article className="prose prose-sm max-w-none rounded-xl border border-amber-200 bg-amber-50/40 p-6">
      <p className="rounded bg-amber-100 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-amber-900">
        Draft — for owner review
      </p>
      <h1>Community guidelines</h1>
      <p>
        These draft guidelines describe expected behaviour in the CCDesigner community forum.
        They are <strong>not final</strong> until reviewed and approved by the product owner /
        safeguarding lead.
      </p>
      <h2>Be professional</h2>
      <ul>
        <li>Share practice, questions and resources respectfully.</li>
        <li>Do not post personal data about pupils (names, photos, identifiable work) without appropriate consent and school policy compliance.</li>
        <li>Credit sources; do not upload copyrighted materials you do not have rights to share.</li>
      </ul>
      <h2>Safeguarding</h2>
      <ul>
        <li>
          Use the <strong>safeguarding</strong> report reason for child protection or urgent safety
          concerns. Those reports are queued separately for priority review.
        </li>
        <li>If someone is in immediate danger, contact emergency services — do not rely on the forum alone.</li>
      </ul>
      <h2>Moderation</h2>
      <ul>
        <li>Moderators may hide, lock, pin or move content, and suspend forum posting privileges.</li>
        <li>Repeated spam, harassment or policy breaches may lead to account restrictions.</li>
      </ul>
      <h2>Accounts</h2>
      <ul>
        <li>Use your CCDesigner account. Display names are shown publicly — emails are not.</li>
        <li>Hub-scoped categories are visible only to hub members (plus system moderators).</li>
      </ul>
    </article>
  );
}
