---
name: Imported app previews
description: Durable conventions for importing existing standalone web apps into managed artifact previews.
---

When an imported app already has its own package name and npm scripts, the managed preview should invoke that app directly rather than assuming a workspace package name or pnpm filter.

**Why:** Imported repositories often use standalone package metadata, while generated workspace artifacts use `@workspace/*` names and pnpm-filter commands. Reusing the generated command can leave the preview stopped even though the source app is valid.

**How to apply:** Keep the imported source intact; use validated artifact metadata to point the preview command at the app’s native start script. Preserve the app’s own port behavior where possible, and give the artifact a unique preview path when another registered artifact already owns `/`. After importing a monorepo, reconcile workspace dependencies before restarting apps whose pre-start scripts build sibling artifacts; if an unrelated package is blocked, use a focused workspace install for only the app and its build-time siblings.