# Server actions

Every mutation in the app. All are `"use server"` functions invoked from forms — there is no
`/api/admin/*` surface — and all are public POST endpoints, which is why each one starts by checking
the admin allowlist.

## Summary

| Action | File | Form fields | Guard | Writes to |
|---|---|---|---|---|
| `login` | `app/login/actions.ts:12` | `email`, `password` | none (throttled) | admin DB (`login_attempts`) |
| `logout` | `app/login/actions.ts:33` | — | none | Neon Auth session |
| `setApplicationStatus` | `app/admin/applications/actions.ts:8` | `id`, `status` | `requireAdmin` | forms DB |
| `updateQuestion` | `app/admin/applications/questions/actions.ts:23` | `id`, `prompt` | `requireAdmin` | forms DB |
| `addQuestion` | `app/admin/applications/questions/actions.ts:59` | `roleId`, `prompt` | `requireAdmin` | forms DB |
| `setDepartmentClosed` | `app/admin/applications/questions/actions.ts:74` | `slug`, `closed` | `requireAdmin` | forms DB |
| `setAllDepartmentsClosed` | `app/admin/applications/questions/actions.ts:83` | `closed` | `requireAdmin` | forms DB |
| `removeQuestion` | `app/admin/applications/questions/actions.ts:90` | `id` | `requireAdmin` | forms DB |
| `addMember` | `app/admin/members/actions.ts:16` | `name`, `position`, `department`, `college`, `category` | `requireAdmin` | admin DB |
| `setDeadlineStatus` | `app/admin/deadlines/actions.ts:19` | `id`, `status` | `requireAdmin` | admin DB |
| `addDeadline` | `app/admin/deadlines/actions.ts:34` | `title`, `owner`, `due` | `requireAdmin` | admin DB |

## The common shape

```ts
"use server";

export async function something(formData: FormData) {
  await requireAdmin();          // 1. authorization
  const id = readId(formData);   // 2. validation
  // ...
  await pool.query(/* parameterised */);   // 3. one query
  revalidatePath("/admin/…");              // 4. cache invalidation
}
```

Four conventions hold across the codebase:

1. **`requireAdmin()` is the first statement**, before any parsing. It throws `Unauthorized`.
2. **Ids are strings matching `/^\d+$/`.** Bigints are selected as `id::text` everywhere, so ids
   never round-trip through JavaScript numbers. `readId` helpers exist in the questions and
   deadlines actions; applications and members inline the regex.
3. **Enum-like values are checked against `lib/statuses.ts`**, never trusted from the form:
   `APPLICATION_STATUSES`, `DEADLINE_STATUSES`, `MEMBER_CATEGORIES`. The same lists back the SQL
   `CHECK` constraints.
4. **Free text is trimmed and length-bounded** before it reaches SQL: 200 characters for members,
   300 for deadlines, 1000 for questions.

All queries are parameterised (`$1`, `$2`, …). There is no string interpolation of user input
anywhere; the only dynamic SQL is `format()` with `%I` over a literal array of table names in
`db/schema.sql`.

## Error handling

Actions signal failure by throwing. In development you get the message; in production Next replaces
it with a digest and the form simply appears to do nothing. None of the forms render an error
boundary, so **a rejected action is silent to the user**. The exceptions are:

- `login`, which returns its message through `useActionState` and renders it in an alert.
- `ConfirmButton`-guarded removals, where the confirmation happens before submission.

If you add an action whose failure a user should see, return a message instead of throwing.

## Action by action

### `login(prev, formData)`

`app/login/actions.ts:12-31`. Note the two-argument signature: it is used with
`useActionState(login, null)`, so the previous state is the first parameter and the return value is
a string or `null`.

- Lowercases and trims `email`; reads the first `x-forwarded-for` entry as the client IP.
- Consults the lockout **before** calling Neon Auth.
- Always calls `neonAuth.signIn.email`, then checks the allowlist — equalising response time.
- Signs out any non-admin session it just created.
- On success: `clearFailures(key)` then `redirect("/admin")`.

### `logout()`

`app/login/actions.ts:33-36`. Destroys the session and redirects to `/login`. Bound directly in the
sidebar; no arguments, no guard.

### `setApplicationStatus`

`app/admin/applications/actions.ts:8-18`.

```ts
if (!/^\d+$/.test(id)) throw new Error("Invalid id.");
if (!(APPLICATION_STATUSES as readonly string[]).includes(status)) throw new Error("Invalid status.");
await pool.query("UPDATE applications SET status = $2 WHERE id = $1", [id, status]);
```

Targets the **forms** database. Revalidates `/admin/applications`, the applicant's detail page, and
`/admin` (so the dashboard status badges update). A non-existent id is not an error; the update just
affects zero rows.

### `updateQuestion`

`app/admin/applications/questions/actions.ts:23-57`. The only action with a transaction:

1. `BEGIN`, then `SELECT role_id, position, prompt, active, EXISTS(… answers …) FROM
   department_questions WHERE id = $1 FOR UPDATE`.
2. Reject if the question is no longer `active`.
3. If the prompt is unchanged, do nothing.
4. If it changed and has answers: `active = false` on the old row, then `INSERT` a replacement with
   the same `role_id` and `position`, so it keeps its slot in form ordering.
5. If it changed and has no answers: `UPDATE … SET prompt` in place.
6. `COMMIT`; `ROLLBACK` on any error; always `release()` the client.

Revalidates `/admin/applications/questions` only — the applicant detail page reads prompts live, so
it does not need invalidation.

### `addQuestion`

`app/admin/applications/questions/actions.ts:59-71`. One insert-select:

```sql
INSERT INTO department_questions (role_id, position, prompt)
SELECT r.id, COALESCE((SELECT max(position) FROM department_questions WHERE role_id = r.id), 0) + 1, $2
FROM department_roles r WHERE r.id = $1
```

If the role does not exist, `rowCount` is 0 and the action throws "That position no longer exists.
Reload the page."

### `setDepartmentClosed` / `setAllDepartmentsClosed`

`app/admin/applications/questions/actions.ts:74-87`. `closed` is `formData.get("closed") === "true"`, so any other value
means open. The single-department version keys on `departments.slug` and throws when `rowCount` is 0.
The bulk version has no guard at all — it updates every row.

### `removeQuestion`

`app/admin/applications/questions/actions.ts:90-94`. Soft delete: `UPDATE department_questions SET active = false`. Never
a `DELETE`, because answers reference the row.

### `addMember`

`app/admin/members/actions.ts:16-28`. Category validated against `MEMBER_CATEGORIES`; college is
`trim().slice(0, 200) || null`; the other four fields go through a shared `text()` helper that
enforces 1-200 characters. Inserts into the **admin** DB and revalidates `/admin/members`.

The `.slice(0, 200)` on college means an over-long value is silently truncated rather than rejected,
unlike the other fields — a small inconsistency worth knowing.

### `setDeadlineStatus`

`app/admin/deadlines/actions.ts:19-26`. Validates the status against `DEADLINE_STATUSES`, updates by
id, and refreshes both `/admin/deadlines` and `/admin` via a local `refresh()` helper.

### `addDeadline`

`app/admin/deadlines/actions.ts:34-44`. Requires `/^\d{4}-\d{2}-\d{2}$/` for `due` and 1-300
characters for `title` and `owner`. `status` is left to the column default (`Open`).

## Cache invalidation map

| Action | Revalidates |
|---|---|
| `setApplicationStatus` | `/admin/applications`, `/admin/applications/<id>`, `/admin` |
| `updateQuestion` | `/admin/applications/questions` |
| `addQuestion` | `/admin/applications/questions` |
| `setDepartmentClosed` | `/admin/applications/questions` |
| `setAllDepartmentsClosed` | `/admin/applications/questions` |
| `removeQuestion` | `/admin/applications/questions` |
| `addMember` | `/admin/members` |
| `setDeadlineStatus` | `/admin/deadlines`, `/admin` |
| `addDeadline` | `/admin/deadlines`, `/admin` |

`revalidatePath` is required because pages are cached; it is not a redirect. After an action the
client re-renders the current route, and navigating elsewhere picks up the invalidated data.

## Adding a new action

1. Put it in the `actions.ts` next to the page that uses it, with `"use server"` at the top.
2. Call `requireAdmin()` first.
3. Validate every field — id regex, membership in a `lib/statuses.ts` list, or a length bound.
4. Use the right pool: `adminDb` for the admin DB, `pool` for the forms DB. Mixing them up produces
   a "relation does not exist" error at runtime.
5. `revalidatePath` every route that displays the changed data, including `/admin` if the dashboard
   shows it.
6. Bind it with `<form action={theAction}>`; use `formAction` on a `ConfirmButton` if the action is
   destructive.
7. If the user needs feedback, return a string and use `useActionState` instead of throwing.

---

Next: [Infrastructure →](07-infrastructure.md)
