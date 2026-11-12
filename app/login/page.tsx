import type { Metadata } from "next";
import Image from "next/image";
import LoginForm from "./login-form";

export const metadata: Metadata = { title: "Sign in · CyberPH Admin" };

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10 font-sans text-zinc-900">
      <main className="w-full max-w-[420px] rounded-2xl border border-brand-100 bg-white/95 p-7 shadow-lg shadow-black/30 sm:p-10">
        <div className="flex items-center gap-3">
          <Image src="/cyberph/mark.png" alt="" width={40} height={40} priority className="rounded-lg" />
          <span className="leading-tight">
            <span className="block font-semibold text-slate-900">CyberPH</span>
            <span className="block text-xs text-slate-500">Admin console</span>
          </span>
        </div>

        <h1 className="mt-8 text-2xl font-semibold tracking-tight text-slate-900 sm:text-[28px]">Sign in</h1>
        <p className="mt-1.5 text-sm text-slate-600">Use your officer account to continue.</p>

        <LoginForm />
      </main>
    </div>
  );
}
