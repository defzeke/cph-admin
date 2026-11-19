# Conventions and gotchas

The rules this codebase follows, the traps in it, and the state of things that are half-finished.
Read this before your first change.

## House conventions

### Server-first

Default to a Server Component. Add `"use client"` only when you need state, an event handler, or a
browser API. Today that is thirteen files: `login-form`, `signup/page`, `sidebar`, `donut`, `tabs`,
the three client tables (`applicants-table`, `members-table`, `deadlines-table`), both
`status-select` files, `row-link`, `confirm-button`, and `file-browser`. Everything else is HTML
rendered on the server.

### Every data page has the same skeleton

```tsx
export default function Page() {
  return (
    <Suspense fallback={<Panel><p className="text-sm text-slate-500">Loading…</p></Panel>}>
      <Body />
    </Suspense>
  );
}

async function Body() {
  await connection();          // request-time opt-in, required for cookies/auth
  const rows = await listX();  // one lib call per data source
  return <Panel>…</Panel>;
}
```

Copy this shape. Skipping `connection()` produces a build-time `cookies()` error; skipping
`Suspense` makes the whole route dynamic.

### Mutations

One `actions.ts` next to the page, one exported async function per form, `requireAdmin()` first, a
validation block, a single parameterised query, then `revalidatePath` for every affected route.
Details and a checklist are in [Server actions](06-server-actions.md).

### Validation before SQL

Ids: `/^\d+$/`. Enumerations: membership in the array from `lib/statuses.ts`. Free text:
`trim()`, reject empty, bound the length. FormData values are always `String(formData.get(key) ?? "")`,
never cast.

### Ids are text

Every bigint id is selected as `id::text` and passed around as a string. Nothing converts an id to a
JavaScript `number`. Keep it that way: these ids exceed 2^53 sooner than you would like.

### Dates

- Database `date` columns are selected as `::text` (`due::text`) so they never pass through a `Date`
  and shift a day.
- Display formatting is one function, `formatDate`, pinned to `Asia/Manila`.
- "Today" for deadline filters is computed on the server in Manila time and passed down as
  `YYYY-MM-DD`. Day differences use `Date.parse` on bare dates, which is UTC-safe.
- The CSV export is the one exception: it writes `created_at` as a UTC ISO date.

## Gotchas

| Trap | Detail |
|---|---|
| **`lib/departments.ts` is a copy** | It duplicates `cph-membership-forms/app/register/departments.ts`, with a comment saying to keep them in sync. The `slug` values are the join key for `setDepartmentClosed`, and the `name` values must match `departments.name` in the forms DB or the dashboard counts read zero. |
| **Two databases, similar names** | `adminDb` (admin DB) vs `pool` (forms DB). Importing the wrong one compiles fine and fails at runtime with "relation does not exist". |
| **The allowlist is one literal array** | `ADMIN_EMAILS` in `lib/auth.ts:4`. No roles, no UI, no database row. Changing admins is a code change and a deploy. |
| **`proxy.ts` is not the security boundary** | It only matches `/`, `/login`, and `/admin/:path*`. Anything else — a Server Action POST, a route handler — must call `requireAdmin()` itself. `app/admin/neon-check/route.ts:76` shows the pattern. |
| **`/api/auth` blocks one POST** | `app/api/auth/[...path]/route.ts` rejects `POST …/sign-in/email` with a 404 so the lockout cannot be bypassed. Other auth POSTs (sign-up, sign-out, etc.) pass through. |
| **Lockout is per `ip\|email`** | Five failures lock that pair, not the account. Good: an attacker cannot lock the real admin out. Bad: rotating IPs multiplies attempts. |
| **The login timing side channel is fixed** | An earlier version returned early for non-allowlisted emails, which leaked the admin address through response time (the single LOW finding in the security scan). The current code always calls `neonAuth.signIn.email` first and compares afterwards. Do not "optimise" that early return back in. |
| **`FORCE ROW LEVEL SECURITY` covers three tables only** | `members`, `deadlines`, `login_attempts`. `neon_healthcheck` is created by the health-check probe and deliberately has *no* RLS, because Realtime refuses to watch such a table. |
| **`cacheComponents` changes what "static" means** | Pages render a shell at build time and stream data. Anything session-dependent must sit behind `connection()` and/or `Suspense`. The `SidebarView`/`TabsView` exports exist purely as pathname-less fallbacks. |
| **Selects are keyed by their saved value** | `key={status}` forces a remount when the server-side value changes, so the uncontrolled `<select>` does not go stale. Removing the key reintroduces a subtle bug. |
| **Rows are clickable but the link is separate** | `RowLink` handles the mouse; the name cell contains the real `<Link>`. Interactive cells (checkbox, status select) call `stopPropagation` so they do not navigate. |
| **Applicant row numbers are reverse-ordered** | `apps.length - apps.indexOf(a)`: the newest applicant is numbered highest, across the whole list, not per filter. |
| **CSV cells are sanitised** | Leading `= + - @ \t \r` gets a `'` prefix, quotes are doubled, CRLF line endings, UTF-8 BOM for Excel. Do not "simplify" `csv.ts`. |
| **Links from applicants are untrusted** | `safeUrl` only allows `http:`/`https:`. Any new link field must use it. |
| **`parseDriveEmbed` is a scraper** | It depends on Google's public embed HTML and on the folder staying link-shared. Failure is handled gracefully but silently. |
| **`addMember` truncates college** | `trim().slice(0, 200) \|\| null`, whereas the other fields throw past 200 characters. |
| **Actions fail silently in production** | They throw; Next replaces the message with a digest and no form renders it. Only `login` returns messages. |
| **No delete paths** | Members and deadlines cannot be edited or deleted; questions are soft-deleted; applications only change status. |
| **`getDepartment()` is unused** | Exported from `lib/departments.ts:62` but nothing imports it. Harmless; do not assume it is wired up. |
| **Root metadata is still boilerplate** | `app/layout.tsx:16-17` says "Create Next App" / "Generated by create next app". Only `/admin`, `/login` override the title. |

## Repository state

- **Empty directories:** `components/` and `features/` exist but hold no tracked files. All UI lives
  under `app/`. Either use them for their intended purpose or delete them; do not assume they are
  wired up.
- **`docs/`** is this documentation. It was empty before.
- **`CLAUDE-SECURITY-20261112-190101/`** is an untracked report folder from a whole-repository
  security scan (JSONL, Markdown, SARIF, plus a revision stamp). It contains its own `.gitignore` with
  `*`, so it is invisible to `git status` and will never be committed. Its conclusion: **one LOW
  finding** — the login timing side channel — which the current code already addresses, and three
  rejected candidates (allowlist sign-up race, hardcoded Drive folder id, hardcoded doc id) that were
  judged non-issues. Nothing at MEDIUM or above. Delete the folder whenever; nothing reads it.
- **`.impeccable/config.json`** suppresses one design-linter rule (`overused-font` for Arial) with a
  note that the fonts were copied from the forms site on purpose.
- **`.env.local`, `.env.local.backup`, and `.neon`** are gitignored (`.env*` and `.neon`). The
  `.env.local.backup` file is a copy from provisioning; treat it as a secret.
- **Four commits so far:** backend integration, Vercel init, the login counter, and a database-access
  restriction. The tree is a fresh single-purpose app, not a long-lived branch.

## Security posture, in brief

Handled:

- Session validation plus an email allowlist on every navigation and every mutation.
- DB-backed login throttling that cannot be bypassed through the auth route handler.
- Uniform failure message and uniform timing on login.
- Parameterised SQL everywhere; no dynamic identifiers from input.
- Allowlist validation for every enum-like value.
- RLS with `FORCE` on admin tables so non-owner roles see nothing.
- CSV formula-injection escaping; URL scheme allowlisting for applicant-supplied links.
- `javascript:` cannot reach an `href`; Drive thumbnails are the only remote `<img>`.

Not handled, and worth knowing before you promise otherwise:

- Single admin identity, no MFA, no audit trail, no session revocation.
- No CSRF tokens of the app's own; Server Actions rely on Next's origin check.
- No rate limiting on non-login routes.
- No error reporting, so a failed action is invisible.
- The health check writes to the admin database and creates a table; it is admin-only but not
  read-only.

## Five things to remember

1. Two databases: `adminDb` for members/deadlines/lockouts, `pool` for applications/questions.
2. Every action starts with `requireAdmin()` and ends with `revalidatePath`.
3. Data pages need `await connection()` inside a `Suspense` boundary.
4. Questions are versioned; answers keep their wording.
5. Status vocabularies live in `lib/statuses.ts` **and** in `db/schema.sql` — change both.

---

Back to the [index](README.md).
