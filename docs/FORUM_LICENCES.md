# Forum licences & attribution

## Approach

CCDesigner Community Forum is an **integrated native forum** (Supabase Postgres + React SPA + Vercel serverless). Full forum platforms (Discourse, NodeBB, Flarum, Forem, Talkyard) require separate application servers and were not embedded.

## Libraries used

| Package / code | Licence | Role |
| --- | --- | --- |
| Original `api/_forumShared.js` Markdown → HTML sanitiser | MIT (this repo) | Server-side sanitisation |
| [DOMPurify](https://github.com/cure53/DOMPurify) (`dompurify` already in `artifacts/ccd`) | Apache-2.0 OR MPL-2.0 | Client defence-in-depth HTML sanitisation |
| Patterns inspired by typical MIT discussion UIs (category list / topic / reply) | N/A — original CCDesigner UI | No third-party forum starter was vendored |

We intentionally did **not** copy GPL/AGPL forum codebases (Discourse AGPL, NodeBB GPL, Flarum MIT-but-server, Forem AGPL).

## Optional future attribution

If a specific MIT React discussion kit is later adapted, record here:

- URL:
- Version / commit:
- Licence file retained under `docs/third-party/`
