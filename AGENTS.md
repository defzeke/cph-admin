# Agent instructions

Before exploring, planning, or editing anything in this repo:

1. Read `rules.md` at the repo root. It is not optional: no git writes, fewer comments,
   plain human comments.
2. Read `docs/README.md`, then the doc page for the area you are touching.
3. Only then read source and make changes.

If `rules.md` contradicts this file, `rules.md` wins.

## Docs map

Read `docs/README.md` first, then the page for the area you are touching:

| Page | Use it for |
|---|---|
| `docs/01-getting-started.md` | Install, env vars, schema, deploy |
| `docs/02-architecture.md` | System shape, two databases, request lifecycle |
| `docs/03-authentication.md` | Allowlist, login, lockout, proxy, blocked auth route |
| `docs/04-data-model.md` | Admin DB DDL, RLS, forms-DB tables, question versioning |
| `docs/05-admin-features.md` | What each screen does, filters, CSV export |
| `docs/06-server-actions.md` | Every mutation, its validation and cache invalidation |
| `docs/07-infrastructure.md` | Neon services, storage, functions, health check |
| `docs/08-design-system.md` | Tokens, panels, status badges, a11y, responsive |
| `docs/09-conventions-and-gotchas.md` | House rules, traps, repo state, security posture |

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
