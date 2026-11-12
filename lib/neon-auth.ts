import { createNeonAuth } from "@neon/auth/next/server";

// Neon Managed Better Auth (users live in the neon_auth schema of the admin DB).
// Separate from lib/auth.ts, the temp admin login that still guards /admin.
export const neonAuth = createNeonAuth({
  baseUrl: process.env.NEON_AUTH_BASE_URL!,
  cookies: { secret: process.env.NEON_AUTH_COOKIE_SECRET! },
});
