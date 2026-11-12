"use client";

import { useActionState, useState } from "react";
import { login } from "./actions";

const inputClass =
  "h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-slate-900 outline-none transition focus:border-brand-500 focus:ring-3 focus:ring-brand-500/15";

export default function LoginForm() {
  const [error, action, pending] = useActionState(login, null);
  const [showPassword, setShowPassword] = useState(false);
  return (
    <>
      <form action={action} className="mt-7 space-y-5">
        {error && (
          <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </p>
        )}

        <label className="block space-y-1.5 text-sm">
          <span className="font-medium text-slate-800">Email address</span>
          <input name="email" type="email" autoComplete="email" required className={inputClass} />
        </label>

        <div className="space-y-1.5 text-sm">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="font-medium text-slate-800">Password</label>
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="text-xs font-medium text-brand-700 hover:text-brand-600"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            className={inputClass}
          />
        </div>

        <button
          type="submit"
          disabled={pending}
          className="h-11 w-full rounded-lg bg-brand-600 text-sm font-semibold text-white transition hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:opacity-70"
        >
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </>
  );
}
