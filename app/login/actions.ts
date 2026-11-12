"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isAdminEmail } from "@/lib/auth";
import { LOCK_MINUTES, attemptKey, clearFailures, lockedMinutes, recordFailure } from "@/lib/login-limit";
import { neonAuth } from "@/lib/neon-auth";

const WRONG = "Wrong email or password.";
const locked = (mins: number) => `Too many failed sign-ins. Try again in ${mins} minute${mins === 1 ? "" : "s"}.`;

export async function login(_prev: string | null, formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  const key = attemptKey(ip, email);

  // Checked before calling Neon Auth, so a locked pair can't keep guessing.
  const mins = await lockedMinutes(key);
  if (mins > 0) return locked(mins);

  // Every email takes the same path (sign in first, allowlist after), so neither the message
  // nor the response time reveals which email is an admin.
  const { data, error } = await neonAuth.signIn.email({ email, password });
  if (error || !isAdminEmail(data?.user?.email ?? "")) {
    if (!error) await neonAuth.signOut(); // don't leave a non-admin session behind
    return (await recordFailure(key)) ? locked(LOCK_MINUTES) : WRONG;
  }
  await clearFailures(key);
  redirect("/admin");
}

export async function logout() {
  await neonAuth.signOut();
  redirect("/login");
}
