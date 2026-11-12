"use client";

import { useState } from "react";
import { authClient } from "@/lib/neon-auth-client";

const input = "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-brand-500";

// Account sign-up only. It does not grant access to /admin (that still uses the admin login).
export default function SignupPage() {
  const [error, setError] = useState("");
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setPending(true);
    setError("");
    const { data, error } = await authClient.signUp.email({
      name: String(f.get("name")),
      email: String(f.get("email")),
      password: String(f.get("password")),
    });
    setPending(false);
    if (error) setError(error.message ?? "Sign-up failed.");
    else if (data?.user) setUser({ name: data.user.name, email: data.user.email });
  }

  return (
    <main className="mx-auto grid min-h-screen w-full max-w-sm place-items-center px-4">
      <div className="w-full rounded-2xl border border-brand-100 bg-white/95 p-6 shadow-lg shadow-black/30">
        <h1 className="text-xl font-semibold text-slate-900">Create account</h1>
        {user ? (
          <p className="mt-4 text-sm text-slate-700" role="status">
            Signed up as <strong>{user.name}</strong> ({user.email}).
          </p>
        ) : (
          <form onSubmit={onSubmit} className="mt-4 space-y-3">
            <label className="block text-xs font-medium text-slate-500">
              Name
              <input name="name" required autoComplete="name" className={`${input} mt-1`} />
            </label>
            <label className="block text-xs font-medium text-slate-500">
              Email
              <input name="email" type="email" required autoComplete="email" className={`${input} mt-1`} />
            </label>
            <label className="block text-xs font-medium text-slate-500">
              Password
              <input name="password" type="password" required minLength={8} autoComplete="new-password" className={`${input} mt-1`} />
            </label>
            {error && <p className="text-sm text-rose-700" role="alert">{error}</p>}
            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-md bg-brand-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-60"
            >
              {pending ? "Creating…" : "Sign up"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
