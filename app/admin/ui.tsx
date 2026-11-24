import Link from "next/link";
import type { ReactNode } from "react";

export function PageHeader({ title, description }: { title: string; description: string }) {
  return (
    <header className="mb-6">
      <h1 className="text-2xl font-semibold text-brand-50 sm:text-3xl">{title}</h1>
      <p className="mt-1 text-sm text-brand-50/60">{description}</p>
    </header>
  );
}

// Same card as the membership forms.
export function Panel({
  title,
  action,
  children,
  className = "",
}: {
  title?: ReactNode;
  action?: { href: string; label: string };
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`flex min-w-0 flex-col rounded-2xl border border-brand-100 bg-white/95 p-5 shadow-lg shadow-black/30 sm:p-6 ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-4">
          {title && <h2 className="text-base font-semibold text-slate-900">{title}</h2>}
          {action && (
            <Link href={action.href} className="text-sm text-brand-700 underline-offset-2 hover:underline">
              {action.label}
            </Link>
          )}
        </div>
      )}
      {children}
    </section>
  );
}

const statusStyles: Record<string, string> = {
  Pending: "border-brand-200 bg-brand-50 text-amber-800",
  "Under review": "border-sky-200 bg-sky-50 text-sky-800",
  Interview: "border-brand-500/30 bg-brand-500/10 text-brand-700",
  Accepted: "border-emerald-200 bg-emerald-50 text-emerald-800",
  Declined: "border-rose-200 bg-rose-50 text-rose-700",
  Open: "border-brand-200 bg-brand-50 text-amber-800",
  Closed: "border-slate-200 bg-slate-100 text-slate-600",
  Done: "border-slate-200 bg-slate-100 text-slate-600",
  "In Progress": "border-brand-500/30 bg-brand-500/10 text-brand-700",
  Executive: "border-amber-300 bg-amber-100 text-amber-900",
  Lead: "border-brand-500/30 bg-brand-500/10 text-brand-700",
  Member: "border-slate-200 bg-white text-slate-700",
  Ambassador: "border-sky-200 bg-sky-50 text-sky-800",
  "Chapter Lead": "border-violet-200 bg-violet-50 text-violet-800",
  Consultant: "border-teal-200 bg-teal-50 text-teal-800",
  Planned:"border-slate-200 bg-white text-slate-700",
  Ongoing: "border-brand-500/30 bg-brand-500/10 text-brand-700",
};

// DB statuses are lowercase ("pending"); show them capitalized.
export function Status({ value }: { value: string }) {
  const label = value.charAt(0).toUpperCase() + value.slice(1);
  return (
    <span className={`inline-block whitespace-nowrap rounded-md border px-2 py-0.5 text-xs font-medium ${statusStyles[label] ?? statusStyles.Planned}`}>
      {label}
    </span>
  );
}

export const th = "px-3 py-2 text-left text-xs font-medium text-slate-500";
// fixed row height keeps side-by-side tables level
export const td = "h-12 border-t border-slate-200 px-3 py-2 align-middle";
