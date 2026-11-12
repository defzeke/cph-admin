import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense, type ReactNode } from "react";
import { getAdmin } from "@/lib/auth";
import Sidebar, { SidebarView } from "./sidebar";

export const metadata: Metadata = { title: "CyberPH Admin" };

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col font-sans text-zinc-900 md:flex-row">
      <Suspense fallback={<SidebarView name="" email="" pathname="" />}>
        <AccountSidebar />
      </Suspense>
      <div className="min-w-0 flex-1">
        <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-10">{children}</main>
      </div>
    </div>
  );
}

// proxy.ts already sent non-admins to /login; this just reads who is signed in.
async function AccountSidebar() {
  // Request-time only: without this the build prerenders it and Neon Auth logs a cookies() error.
  await connection();
  const admin = await getAdmin();
  return <Sidebar name={admin?.name ?? ""} email={admin?.email ?? ""} />;
}
