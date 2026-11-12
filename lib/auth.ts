import { neonAuth } from "./neon-auth";

// Neon Auth accounts allowed into /admin. Anyone else can have an account but gets no admin access.
export const ADMIN_EMAILS = ["learncyberph@gmail.com"];

export const isAdminEmail = (email: string) => ADMIN_EMAILS.includes(email.trim().toLowerCase());

// The signed-in admin, or null (not signed in, or signed in with a non-admin account).
export async function getAdmin() {
  const { data } = await neonAuth.getSession();
  const user = data?.user;
  return user && isAdminEmail(user.email) ? user : null;
}

// Call at the top of every admin Server Action: actions are POST endpoints, so don't rely on the proxy alone.
export async function requireAdmin() {
  if (!(await getAdmin())) throw new Error("Unauthorized");
}
