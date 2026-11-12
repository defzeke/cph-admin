"use server";

import { redirect } from "next/navigation";
import { isAdminEmail } from "@/lib/auth";
import { neonAuth } from "@/lib/neon-auth";

const WRONG = "Wrong email or password.";

export async function login(_prev: string | null, formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  // Every email takes the same path (sign in first, allowlist after), so neither the message
  // nor the response time reveals which email is an admin.
  const { data, error } = await neonAuth.signIn.email({ email, password });
  if (error) return WRONG;
  if (!isAdminEmail(data?.user?.email ?? "")) {
    await neonAuth.signOut(); // don't leave a non-admin session behind
    return WRONG;
  }
  redirect("/admin");
}

export async function logout() {
  await neonAuth.signOut();
  redirect("/login");
}
