"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/admin/applications", label: "Applicants" },
  { href: "/admin/applications/questions", label: "Form questions" },
];

export default function Tabs() {
  return <TabsView pathname={usePathname()} />;
}

// Suspense fallback: same tabs before the pathname is known.
export function TabsView({ pathname }: { pathname: string }) {
  return (
    <nav className="mb-6 inline-flex rounded-lg border border-brand-50/10 bg-black/40 p-1">
      {tabs.map((t) => {
        // Applicants also covers /admin/applications/<id> detail pages.
        const onQuestions = pathname.startsWith(tabs[1].href);
        const active = t.href === tabs[1].href ? onQuestions : !onQuestions;
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className={`rounded-md px-4 py-1.5 text-sm transition-colors ${
              active ? "bg-brand-50 font-medium text-slate-900" : "text-brand-50/70 hover:text-white"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
