# Working rules

Read this before anything else. Then read `docs/README.md` and the page for the area you are
changing. Only then read source and edit.

## Git — hands off

- Do not commit, push, pull, fetch, merge, rebase, tag, or create/switch branches.
- Do not stage, amend, stash, reset, or restore. Leave every change in the working tree.
- Read-only git is fine: `status`, `diff`, `log`, `show`, `ls-files`.
- The human reviews and commits. If a task seems to need a commit, stop and say so.

## Comments — fewer, and human

- Write fewer comments. Keep only what the code cannot say: the why, a constraint, a trap.
  Never restate the next line.
- Sound like a teammate, not a generator: short, plain, specific.
- One line where one line is enough. No banners, no `// ----` separators, no
  "This function will…", no summary of code you just wrote.
- Match the existing voice: lowercase, direct, dry. The comments already in `lib/`,
  `app/admin/`, and `db/schema.sql` are the reference.

## Docs — read before code

- `docs/README.md` first, then the page that matches the task:
  1. `docs/01-getting-started.md`
  2. `docs/02-architecture.md`
  3. `docs/03-authentication.md`
  4. `docs/04-data-model.md`
  5. `docs/05-admin-features.md`
  6. `docs/06-server-actions.md`
  7. `docs/07-infrastructure.md`
  8. `docs/08-design-system.md`
  9. `docs/09-conventions-and-gotchas.md`
- One-line purpose per page: see `AGENTS.md` → Docs map.
- If the code and a doc disagree, the code wins — and fix the doc in the same change.
