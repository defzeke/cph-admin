import { S3Client } from "@aws-sdk/client-s3";
import { createRealtime } from "@neon/realtime/server";
import { Pool } from "pg";

// The admin's own Neon project (round-feather, linked by `neon init`). Env comes from `neon deploy` into .env.local.
// The applicants live in a different project: see lib/pg.ts (FORMS_DATABASE_URL).

const g = globalThis as unknown as { adminPool?: Pool };
// Pooled URL for app traffic; one pool per server process, reused across HMR.
export const adminDb = (g.adminPool ??= new Pool({ connectionString: process.env.DATABASE_URL }));

// Object Storage: credentials, endpoint and region come from the AWS_* env vars. Neon needs path-style URLs.
export const storage = new S3Client({ forcePathStyle: true });
export const ASSETS_BUCKET = "assets"; // declared in neon.ts

// Functions: https://<branch id>-<slug><host suffix>/ (suffix starts with a dot).
export const functionUrl = (slug: string) =>
  `https://${process.env.NEON_BRANCH_ID}-${slug}${process.env.NEON_FUNCTION_HOST_SUFFIX}/`;

// Realtime, server side. Passing `url` lets trusted server code subscribe directly (not just seal for browsers).
export const realtimeServer = () =>
  createRealtime({
    url: process.env.NEON_REALTIME_URL!,
    secret: process.env.NEON_REALTIME_SECRET!,
    db: new URL(process.env.DATABASE_URL!).pathname.slice(1),
  });
