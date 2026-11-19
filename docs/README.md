# CyberPH Admin — documentation

The internal admin console for CyberPH: a Next.js app that reads officer applications from the
membership-forms database, and keeps its own small database of members, deadlines, and login
throttling.

It is a single-tenant, allowlisted tool. There is no public sign-up path into `/admin`, no roles
table, and no multi-org support — one email address is the administrator.

## Read in this order

| # | Page | Read it when |
|---|---|---|
| 1 | [Getting started](01-getting-started.md) | You just cloned the repo and want it running locally. |
| 2 | [Architecture](02-architecture.md) | You need the shape of the system: processes, databases, request lifecycle. |
| 3 | [Authentication](03-authentication.md) | You are touching login, sessions, or anything under `/admin`. |
| 4 | [Data model](04-data-model.md) | You are writing SQL, a migration, or a new read. |
| 5 | [Admin features](05-admin-features.md) | You are changing a screen and want to know what it already does. |
| 6 | [Server actions](06-server-actions.md) | You are adding or auditing a mutation. |
| 7 | [Infrastructure](07-infrastructure.md) | You are touching Neon services, storage, functions, or the health check. |
| 8 | [Design system](08-design-system.md) | You are adding UI and want it to match. |
| 9 | [Conventions and gotchas](09-conventions-and-gotchas.md) | Before your first PR, and whenever something looks odd. |

## The one-paragraph version

`/admin` is guarded by `proxy.ts`, which asks Neon Auth for the current session and compares the
email against a hardcoded allowlist in `lib/auth.ts`. Every page under `/admin` is a Server
Component that awaits `connection()`, opens a `Suspense` boundary, and then queries one of two
Postgres databases: the admin's own Neon project (`DATABASE_URL`) for `members`, `deadlines`, and
`login_attempts`, and the separate membership-forms project (`FORMS_DATABASE_URL`) for
applications, departments, roles, questions, and answers. All mutations are Server Actions that
call `requireAdmin()` first, validate with a small regex or allowlist, run one parameterised query,
and `revalidatePath()` the affected routes. Neon Auth sessions, Neon Object Storage, a Neon
Function, and Neon Realtime are also wired up and exercised by `GET /admin/neon-check`.

## Vocabulary

| Term | Meaning |
|---|---|
| **admin DB** | This app's own Neon project (`round-feather`), reached with `DATABASE_URL`. Tables in `db/schema.sql`. |
| **forms DB** | The separate `cph-membership-forms` project (`super-math`), reached with `FORMS_DATABASE_URL`. Read-mostly from here. |
| **department** | One of nine fixed org units (including "General Member"), defined in code in `lib/departments.ts` and mirrored in the forms DB's `departments` table. |
| **role** | A position inside a department (`department_roles`). Applicants apply to one role. |
| **question** | A screening prompt attached to a role (`department_questions`). Questions are versioned, never rewritten once answered. |
| **application** | One submission (`applications`), joined to personal info, role, and department. |
| **category** | A member classification (`Executive`, `Consultant`, `Lead`, `Chapter Lead`, `Ambassador`), distinct from a role. |

## Conventions used in these docs

- Code references are written as `path:line`, relative to the repository root.
- Mermaid diagrams are rendered by GitHub and most Markdown viewers.
- Environment variables are listed by name and purpose only. Values stay in `.env.local`, which is
  gitignored.
- "Server Action" means a `"use server"` function invoked by a form; "route handler" means a
  `route.ts` export.
