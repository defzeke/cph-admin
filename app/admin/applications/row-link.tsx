"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

// Whole row opens the applicant; the name cell holds a real <Link> for keyboard and screen readers.
export default function RowLink({ href, children }: { href: string; children: ReactNode }) {
  const router = useRouter();
  return (
    <tr onClick={() => router.push(href)} className="cursor-pointer transition-colors hover:bg-brand-50/70">
      {children}
    </tr>
  );
}
