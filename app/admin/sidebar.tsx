"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { logout } from "@/app/login/actions";
import { ApplicationsIcon, DeadlinesIcon, DocumentsIcon, LogoutIcon, MembersIcon, OverviewIcon, ToolsIcon } from "./icons";

const main = [
  { href: "/admin", label: "Overview", icon: <OverviewIcon /> },
  { href: "/admin/documents", label: "Documents", icon: <DocumentsIcon /> },
  { href: "/admin/members", label: "Members", icon: <MembersIcon /> },
  { href: "/admin/deadlines", label: "Deadlines", icon: <DeadlinesIcon /> },
  { href: "/admin/applications", label: "Applications", icon: <ApplicationsIcon /> },
  { href: "/admin/tools", label: "Tools", icon: <ToolsIcon /> },
];

function NavLink({ href, label, icon, active }: { href: string; label: string; icon: ReactNode; active: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`flex items-center gap-3 whitespace-nowrap rounded-lg px-3 py-2 text-sm transition-colors ${
        active ? "bg-brand-50 font-medium text-slate-900 shadow-sm shadow-black/20" : "text-brand-50/70 hover:bg-white/6 hover:text-white"
      }`}
    >
      <span className={active ? "text-brand-600" : ""}>{icon}</span>
      {label}
    </Link>
  );
}

function LogoutButton() {
  return (
    <form action={logout}>
      <button
        type="submit"
        aria-label="Log out"
        title="Log out"
        className="grid h-9 w-9 place-items-center rounded-lg text-brand-50/70 transition-colors hover:bg-brand-50/10 hover:text-white"
      >
        <LogoutIcon />
      </button>
    </form>
  );
}

export default function Sidebar(props: { name: string; email: string }) {
  return <SidebarView {...props} pathname={usePathname()} />;
}

// Rendered without a pathname as the Suspense fallback on pages whose URL isn't known at build time.
export function SidebarView({ name, email, pathname }: { name: string; email: string; pathname: string }) {
  const isActive = (href: string) => (href === "/admin" ? pathname === href : pathname.startsWith(href));

  return (
    <aside className="flex shrink-0 flex-col border-b border-brand-50/12 bg-sidebar shadow-xl shadow-black/40 md:sticky md:top-0 md:h-screen md:w-64 md:border-b-0 md:border-r">
      <div className="flex h-16 items-center gap-3 border-brand-50/10 px-5 md:border-b">
        <Image src="/cyberph/mark.png" alt="" width={34} height={34} className="rounded-lg ring-1 ring-brand-50/15" />
        <span className="leading-tight">
          <span className="block font-semibold text-white">CyberPH</span>
          <span className="block text-xs text-brand-200">Admin</span>
        </span>
        <span className="ml-auto md:hidden">
          <LogoutButton />
        </span>
      </div>

      <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-1 md:flex-col md:overflow-visible md:py-4">
        {main.map((l) => (
          <NavLink key={l.href} {...l} active={isActive(l.href)} />
        ))}
      </nav>

      <div className="hidden items-center gap-3 border-t border-brand-50/10 py-4 pl-5 pr-3 md:flex">
        <span className="min-w-0 flex-1 leading-tight">
          <span className="block truncate text-sm font-medium text-white">{name}</span>
          <span className="block truncate text-xs text-brand-50/55">{email}</span>
        </span>
        <LogoutButton />
      </div>
    </aside>
  );
}
