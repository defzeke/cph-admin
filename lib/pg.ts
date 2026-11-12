import { Pool } from "pg";

// The membership forms database (cph-membership-forms, Neon project super-math). Same setup as its lib/pg.ts: one pool per server process, reused across HMR.
const globalForPg = globalThis as unknown as { pgPool?: Pool; pgUrl?: string };
const url = process.env.FORMS_DATABASE_URL;
if (!globalForPg.pgPool || globalForPg.pgUrl !== url) {
  void globalForPg.pgPool?.end().catch(() => {});
  globalForPg.pgPool = new Pool({ connectionString: url });
  globalForPg.pgUrl = url;
}
export const pool = globalForPg.pgPool;
