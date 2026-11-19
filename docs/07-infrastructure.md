# Infrastructure

The Neon services this app declares and uses, plus the two integrations that do not go through Neon
(Google Drive, Vercel).

## Declared services — `neon.ts`

```ts
import { defineConfig } from "@neon/config/v1";

export default defineConfig({
  preview: { realtime: true },
  auth: true,
  functions: { hello: { name: "Hello World", source: "./hello.ts" } },
  buckets: { assets: { access: "private" } },
  branch: (branch) => {
    if (branch.isDefault) return {};
    if (!branch.exists) return { ttl: "7d" };
    return {};
  },
});
```

| Declaration | Effect |
|---|---|
| `auth: true` | Provisions Managed Better Auth on the branch; writes `NEON_AUTH_*` into `.env.local`. |
| `functions.hello` | Deploys `hello.ts` as a Neon Function named `hello`. |
| `buckets.assets` | Creates a **private** S3-compatible bucket. Private means credentials are required for every read. |
| `preview.realtime` | Enables Realtime on preview branches. |
| `branch` policy | New non-default branches get a 7-day TTL, so `neon checkout <name>` creates throwaway environments. The default branch gets no overrides. |

`neon deploy` reconciles this file and rewrites `.env.local`. `.neon` links the working copy to org
`org-misty-water-16146631`, project `round-feather-84347871`, branch `production`.

## Clients — `lib/neon.ts`

Four exports, all lazily built from environment variables:

```ts
export const adminDb = (g.adminPool ??= new Pool({ connectionString: process.env.DATABASE_URL }));
export const storage = new S3Client({ forcePathStyle: true });
export const ASSETS_BUCKET = "assets";
export const functionUrl = (slug: string) =>
  `https://${process.env.NEON_BRANCH_ID}-${slug}${process.env.NEON_FUNCTION_HOST_SUFFIX}/`;
export const realtimeServer = () =>
  createRealtime({
    url: process.env.NEON_REALTIME_URL!,
    secret: process.env.NEON_REALTIME_SECRET!,
    db: new URL(process.env.DATABASE_URL!).pathname.slice(1),
  });
```

Notes:

- **`adminDb` is cached on `globalThis`** so `next dev`'s hot reload reuses one pool instead of
  opening a new one per edit. The same trick is used in `lib/pg.ts`, with the extra guard of
  rebuilding the pool when the URL changes.
- **`storage` passes no credentials or endpoint.** The AWS SDK's default provider chain picks up
  `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_ENDPOINT_URL_S3`, and `AWS_REGION`. `forcePathStyle`
  is required because Neon's endpoint does not support virtual-hosted-style bucket URLs.
- **`functionUrl`** composes the public hostname from the branch id and the function host suffix
  (which begins with a dot, hence no separator). The trailing slash is part of the URL.
- **`realtimeServer()` builds a new client per call**, so callers must `close()` it. The database name
  is taken from the path of `DATABASE_URL`.

Nothing in the UI currently uses `storage` or `realtimeServer`; they exist for the health check and
as the starting point for future features.

## The Neon Function — `hello.ts`

```ts
export default async function hello(): Promise<Response> {
  return new Response("Hello from Neon Functions");
}
```

A default-exported handler returning a `Response`. It runs next to the database (same region) and is
reachable at the `functionUrl("hello")` host. Its only consumer is the health check.

## The health check

`GET /admin/neon-check` in `app/admin/neon-check/route.ts`. Deliberately not linked in the sidebar: it is an operator tool.

```ts
export async function GET() {
  await connection();
  await requireAdmin();
  const results = await Promise.all([check("postgres", postgres), …]);
  return Response.json({ ok: results.every(r => r.ok), results },
    { status: results.every(r => r.ok) ? 200 : 500 });
}
```

`connection()` first, because the route reads cookies; `requireAdmin()` second, because a route
handler is a public endpoint and the proxy alone is not sufficient.

Each probe is wrapped by `check(name, run)`, which converts a thrown error into
`{ name, ok: false, detail }`, so one failure never hides the others.

| Probe | What it does | What it proves |
|---|---|---|
| `postgres` | `SELECT current_database(), split_part(version(), ' ', 2)` | The admin pool is connected and reports a version. |
| `object-storage` | `PutObject` to `healthcheck/<uuid>.txt`, `GetObject`, string-compare, `DeleteObject` in `finally` | Credentials, endpoint, bucket, and read-after-write all work. |
| `functions` | `fetch(functionUrl("hello"))`, throw on non-2xx | The branch id and host suffix are correct and the function is deployed. |
| `realtime` | Create `neon_healthcheck` if absent, subscribe to `SELECT id FROM neon_healthcheck`, insert a row, await it over the WebSocket, then close and delete | Realtime auth, publication, and change delivery. |

The realtime probe has a 15-second timeout and is the only probe that writes to the admin database.
It creates:

```sql
CREATE TABLE IF NOT EXISTS neon_healthcheck (
  id uuid PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

That table exists because **Realtime requires a primary key and refuses tables with row-level
security enabled**, which is why it is not in `db/schema.sql` and not covered by the RLS loop. It is
left in place between runs, holding zero rows after each successful check. Do not rely on it for
anything else.

`rawSql` from `@neon/realtime/server` lets trusted server code subscribe to a query directly, rather
than sealing a query for a browser client.

## Google Drive integration

This is not a Neon service, and there is no API key.

```ts
export const FOLDER_ID = "15MamjaX7vX8yPO2b6FIKodQfUI2HD3o6";
const res = await fetch(`https://drive.google.com/embeddedfolderview?id=${FOLDER_ID}`);
```

`listDriveFiles()` (`app/admin/documents/drive.ts:34-38`) fetches Google's public embed page and
`parseDriveEmbed` scrapes `<div class="flip-entry">` blocks for id, title, href, icon type, thumbnail,
and last-modified text. It decodes the handful of HTML entities Google emits (`&amp;`, `&lt;`,
`&gt;`, `&quot;`, `&#39;`) and nothing else.

Constraints that follow:

- The folder must stay shared as **anyone with the link**. The folder id is not a secret; it is
  public by design.
- Only the first page of results is scraped, and Google's markup can change without notice.
- The failure mode is a visible error line on the Documents page, not a broken route.
- Upgrading to the Drive API means replacing `drive.ts` only; `FileBrowser` consumes a plain
  `DriveFile[]`.

## Deployment

- `vercel.json` pins `{ "framework": "nextjs" }`; everything else is Next's default Vercel pipeline.
- Environment variables must be set per environment (production and preview), because branch ids,
  auth URLs, and realtime endpoints differ per Neon branch.
- `proxy.ts` trusts `x-forwarded-for`, which Vercel sets. Behind a different proxy, the login lockout
  would collapse to a single key; see `app/login/actions.ts:15`.
- The admin database schema is applied manually (`psql … -f db/schema.sql`); there is no migration
  runner and no build-time migration step.

## What is not used (yet)

Documenting the gaps avoids confusion when reading `neon.ts`:

- Object Storage is wired but only used by the health check; nothing uploads or serves applicant
  files, even though `certificate_link` (the valid ID) is a URL to somewhere else.
- Realtime is wired but only used by the health check; all admin pages are request/response.
- The `hello` function is a placeholder.
- No logging, tracing, or error reporting beyond Vercel's defaults.
- No scheduled jobs, queues, or cron.

---

Next: [Design system →](08-design-system.md)
