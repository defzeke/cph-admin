# Getting started

Get the console running locally, with both databases reachable and the admin allowlist honouring
your account.

## Prerequisites

- **Node.js 20.9 or newer** — the minimum declared by `node_modules/next/package.json`
  (`"engines": { "node": ">=20.9.0" }`). The repo was developed on Node 26.
- **npm** (the project ships a `package-lock.json`; no other lockfile is present).
- Access to two Neon projects: the admin project (`round-feather`) and the membership-forms project
  (`super-math`). A Neon account with the `neon` CLI is the path of least resistance.
- Optionally, a Neon Auth user whose email is on the allowlist — without one you can load `/login`
  but not `/admin`.

## Install and run

```bash
npm install
npm run dev
```

Then open <http://localhost:3000>. `/` immediately redirects to `/admin` (`app/page.tsx`), which
`proxy.ts` bounces to `/login` when there is no admin session.

Other scripts (`package.json:5-10`):

| Script | What it does |
|---|---|
| `npm run dev` | `next dev` with Turbopack and the React Compiler. |
| `npm run build` | Production build. |
| `npm start` | Serve a production build. |
| `npm run lint` | `eslint` (flat config, `eslint.config.mjs`). |

## Environment variables

All of these live in `.env.local`, which is gitignored. In practice they are written for you by
`neon deploy` (see below), so you rarely type them by hand.

### Admin database

| Variable | Used by | Purpose |
|---|---|---|
| `DATABASE_URL` | `lib/neon.ts:10` | Pooled connection string for the admin project. Backs `members`, `deadlines`, `login_attempts`, and the Neon Auth schema. |
| `DATABASE_URL_UNPOOLED` | tooling only | Direct (non-pooler) connection, handy for migrations and `psql`. Not referenced by app code. |

### Forms database

| Variable | Used by | Purpose |
|---|---|---|
| `FORMS_DATABASE_URL` | `lib/pg.ts:5` | Pooled connection string for the membership-forms project. Used for every application, question, and department query. |

### Neon Auth

| Variable | Used by | Purpose |
|---|---|---|
| `NEON_AUTH_BASE_URL` | `lib/neon-auth.ts:6` | Base URL of the Neon Auth service for this branch. |
| `NEON_AUTH_COOKIE_SECRET` | `lib/neon-auth.ts:7` | Secret used to sign the session cookie. |
| `NEON_AUTH_JWKS_URL` | Neon Auth SDK | Public keys for validating session JWTs. Not read directly by this repo's code. |
| `AUTH_SECRET` | Neon Auth tooling | Provisioned alongside the auth service; not read directly by this repo's code. |

### Neon platform

| Variable | Used by | Purpose |
|---|---|---|
| `NEON_BRANCH` | tooling | Branch name, informational. |
| `NEON_BRANCH_ID` | `lib/neon.ts:18` | Left half of a Neon Function hostname. |
| `NEON_FUNCTION_HOST_SUFFIX` | `lib/neon.ts:18` | Right half of a Neon Function hostname (starts with a dot). |
| `NEON_REALTIME_URL` | `lib/neon.ts:23` | Realtime WebSocket endpoint. |
| `NEON_REALTIME_SECRET` | `lib/neon.ts:24` | Realtime auth token for server-side subscriptions. |

### Object storage

| Variable | Purpose |
|---|---|
| `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` | Credentials Neon issues for its S3-compatible storage. |
| `AWS_ENDPOINT_URL_S3`, `AWS_REGION` | Endpoint and region read by the AWS SDK's default provider chain. |

`lib/neon.ts:13` builds the client with `forcePathStyle: true` and no explicit credentials or
endpoint, so the SDK picks these four up automatically.

## Provisioning the environment with the Neon CLI

The repo contains a `neon.ts` config (`@neon/config/v1`) and a `.neon` project link:

```json
{ "orgId": "org-misty-water-16146631", "projectId": "round-feather-84347871", "branch": "production" }
```

Typical flow, once the CLI is installed and authenticated:

```bash
neon link            # or: neon init, which writes .neon and neon.ts
neon deploy          # provisions declared services and writes .env.local
```

`neon.ts` declares:

- `auth: true` — Managed Better Auth for this branch.
- `functions.hello` — the `hello.ts` function, used by the health check.
- `buckets.assets` — a **private** bucket.
- `preview.realtime: true` — Realtime on preview branches.
- a branch policy that gives new non-default branches a `7d` TTL.

Do not commit `.env.local` or `.env.local.backup`. Both are covered by `.gitignore`.

## Preparing the databases

The admin database schema is one idempotent file:

```bash
psql "$DATABASE_URL_UNPOOLED" -f db/schema.sql
```

It is safe to re-run: every statement is `IF NOT EXISTS`, `IF EXISTS`, or a `DROP`/`CREATE` pair.
It creates `members`, `deadlines`, and `login_attempts`, then enables and forces row-level security
on all three with a single `admin_only` policy for `neondb_owner`. See
[Data model](04-data-model.md) for what each statement means.

The forms database is owned by the sibling project `cph-membership-forms`. This app never creates
its tables; it only reads and updates them. You need `FORMS_DATABASE_URL` pointing at that project
and its own `db/schema.sql` already applied.

## Your first sign-in

1. Only emails listed in `lib/auth.ts:4` may enter `/admin`. Add yours there, or use the existing
   entry, temporarily.
2. Create that account. `/signup` (`app/signup/page.tsx`) calls `authClient.signUp.email` in the
   browser. Creating an account grants no access — the allowlist still decides.
3. Go to `/login` and sign in. The password check happens in `app/login/actions.ts`, not in the
   Neon Auth route handler, so the lockout applies. Five failures from one IP for one email locks
   that pair for 30 minutes.
4. Successful sign-in redirects to `/admin`.

If sign-in works but `/admin` bounces you straight back to `/login`, the email you signed in with
is not the allowlisted one. They are compared after `trim().toLowerCase()`.

## Deploying

`vercel.json` only pins `"framework": "nextjs"`, so the default Vercel Next.js pipeline applies.
Deployment checklist:

1. Set every variable from the tables above in the Vercel project (production and preview
   separately — each Neon branch has its own auth URL, realtime URL, and branch id).
2. Run `db/schema.sql` against the production admin branch.
3. Confirm `GET /admin/neon-check` returns `{ "ok": true }` while signed in.

`proxy.ts` trusts `x-forwarded-for` for the lockout key, which Vercel sets. If you host elsewhere
behind another proxy, adjust `app/login/actions.ts:15` to read that proxy's client-IP header —
otherwise every request looks like it came from the same IP.

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| `GET /admin` redirect loop to `/login` | Signed in with a non-allowlisted email, or `NEON_AUTH_*` variables point at a different branch than the one issuing your session. |
| Build fails with a `cookies()` error from Neon Auth | A Server Component touched the session during prerender. Every such component must `await connection()` first (see `app/admin/layout.tsx:25`). |
| `Could not load the Drive folder` | The CyberPH Drive folder is no longer shared "anyone with the link", or Google changed the embed markup. See [Infrastructure](07-infrastructure.md#google-drive-integration). |
| `relation "members" does not exist` | `db/schema.sql` has not been applied to the branch in `DATABASE_URL`. |
| `tenant/user … does not exist` on the forms DB | `FORMS_DATABASE_URL` points at the wrong project or a deleted branch. |

---

Next: [Architecture →](02-architecture.md)
