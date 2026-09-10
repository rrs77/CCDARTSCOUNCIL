# Jazz North — Rhythmstix / DreamHost file upload checklist

Upload these files into:

`https://rhythmstix.co.uk/ccdesignerdocs/Organisations/Jazz North/`

(apex host, **no www**; folder name includes a space — the app encodes it as `Jazz%20North`).

Override the base with env `VITE_JN_DREAMHOST_BASE` if the folder moves.

## Classroom worksheets (already wired)

Exact DreamHost File Manager names (spaces / spelling preserved):

- [ ] `Can-you-sing-your-song-activites.pdf`
- [ ] `Can-you-sing-your-song-piano-accomp.pdf`
- [ ] `Can-you-sing-your-song-audio-files.zip`
- [ ] `Hello-song-activities.pdf`
- [ ] `Hello song score.pdf`
- [ ] `Hello-song-audio-files.zip`
- [ ] `2-and 4-chant-activities.pdf`
- [ ] `2-and-4-chant-score-both-versions.pdf`
- [ ] `2-and-4-audio-files.zip`
- [ ] `Not-quite-jazz-improvisation-games.pdf`
- [ ] `Ways-into-Improvisation.pdf`

## Scheme overviews (upload for Mr Big / Playlist Open + Download)

Recommended filenames the app links to:

- [ ] `Mr-Big-scheme-overview.pdf`
- [ ] `Playlist-Project-Milestones-overview.pdf`

Local fallbacks (repo only): `public/partners/jazznorth/jn-mr-big-lesson-overview.pdf` and `jn-playlist-milestones-overview.pdf`.

## Hub template notes

- Jazz North and LSO share `PartnerOrgHubTemplate` (`artifacts/ccd/src/components/partners/PartnerOrgHubTemplate.tsx`).
- **Resources** = downloadable / seedable cards; **Forums & information** = collapsible (closed by default).
- **Subscribe to {Org}** adds partner key dates via `PartnerKeyDatesModal` → Important dates / calendar.
- Admins (`admin` / `superuser` / `creator`) can Edit layout → Add section from a fixed palette; drafts save in `localStorage` (`ccd-partner-org-hub-layout-v1:{slug}`).

## Card actions (6 former “Other examples”)

| Card | Section | Actions |
|------|---------|---------|
| Mr Big scheme of work | Resources | View on site, Open/Download overview, Add Activities, Add Lesson Plan |
| Playlist Project — Milestones | Resources | View on site, Open/Download overview, Add Activities, Add Lesson Plan |
| Jazz Camp for Girls | Forums & information | View on site, Open (jazznorth.org) |
| Educators’ Forum | Forums & information | View on site, Open (jazznorth.org) |
| Northern Line | Forums & information | View on site, Open (jazznorth.org) |
| New Northern | Forums & information | View on site, Open (jazznorth.org) |
