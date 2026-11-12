import { adminDb } from "./neon";

// 5 failed sign-ins in a row from one IP for one email locks that pair for 30 minutes.
// Keyed by ip|email so someone else typing the admin's email can't lock the admin out everywhere.
// shortcut: trusts x-forwarded-for (set by Vercel); behind another proxy, use that proxy's client-IP header.
export const MAX_FAILURES = 5;
export const LOCK_MINUTES = 30;

export const attemptKey = (ip: string, email: string) => `${ip}|${email}`;

// Minutes left on the lock, or 0 when not locked.
export async function lockedMinutes(key: string) {
  const { rows } = await adminDb.query<{ mins: number }>(
    "SELECT ceil(extract(epoch FROM locked_until - now()) / 60)::int AS mins FROM login_attempts WHERE key = $1 AND locked_until > now()",
    [key],
  );
  return rows[0]?.mins ?? 0;
}

// Counts one failure; on the MAX_FAILURES-th it starts the lock and resets the count. Returns true if now locked.
export async function recordFailure(key: string) {
  const { rows } = await adminDb.query<{ locked: boolean }>(
    `INSERT INTO login_attempts AS a (key, failures) VALUES ($1, 1)
     ON CONFLICT (key) DO UPDATE SET
       failures     = CASE WHEN a.failures + 1 >= $2 THEN 0 ELSE a.failures + 1 END,
       locked_until = CASE WHEN a.failures + 1 >= $2 THEN now() + make_interval(mins => $3) ELSE a.locked_until END
     RETURNING coalesce(locked_until > now(), false) AS locked`,
    [key, MAX_FAILURES, LOCK_MINUTES],
  );
  return rows[0].locked;
}

export async function clearFailures(key: string) {
  await adminDb.query("DELETE FROM login_attempts WHERE key = $1", [key]);
}
