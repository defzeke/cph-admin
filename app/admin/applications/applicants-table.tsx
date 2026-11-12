"use client";

import Link from "next/link";
import { useState } from "react";
import type { ApplicationRow } from "@/lib/applications";
import { APPLICATION_STATUSES } from "@/lib/statuses";
import { formatDate } from "../data";
import { td, th } from "../ui";
import { toCsv } from "./csv";
import RowLink from "./row-link";
import ApplicationStatusSelect from "./status-select";

const label = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function download(apps: ApplicationRow[]) {
  const csv = toCsv([
    ["First name", "Last name", "Email", "Phone", "Position", "Department", "College", "Course, Year, Section", "Status", "Submitted"],
    ...apps.map((a) => [
      a.first_name, a.last_name, a.email, a.phone, a.role, a.department,
      a.college_campus, a.course_year_section, label(a.status), new Date(a.created_at).toISOString().slice(0, 10),
    ]),
  ]);
  // BOM so Excel opens it as UTF-8 (names with ñ etc.)
  const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
  const link = Object.assign(document.createElement("a"), {
    href: url,
    download: `applicants-${new Date().toISOString().slice(0, 10)}.csv`,
  });
  link.click();
  URL.revokeObjectURL(url);
}

export default function ApplicantsTable({ apps }: { apps: ApplicationRow[] }) {
  const [status, setStatus] = useState("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const shown = status === "all" ? apps : apps.filter((a) => a.status === status);
  const picked = shown.filter((a) => selected.has(a.id));
  const allPicked = shown.length > 0 && picked.length === shown.length;

  const toggle = (id: string) =>
    setSelected((s) => {
      const next = new Set(s);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  const toggleAll = () =>
    setSelected((s) => {
      const next = new Set(s);
      for (const a of shown) if (allPicked) next.delete(a.id); else next.add(a.id);
      return next;
    });

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div role="group" aria-label="Filter by status" className="flex flex-wrap gap-2">
          {["all", ...APPLICATION_STATUSES].map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={status === s}
              onClick={() => setStatus(s)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                status === s ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 bg-white text-slate-700 hover:border-brand-500"
              }`}
            >
              {label(s)}{" "}
              <span className="tabular-nums opacity-60">{s === "all" ? apps.length : apps.filter((a) => a.status === s).length}</span>
            </button>
          ))}
        </div>
        <button
          type="button"
          disabled={shown.length === 0}
          onClick={() => download(picked.length ? picked : shown)}
          className="rounded-md bg-brand-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-brand-700 disabled:opacity-50"
        >
          Export CSV ({picked.length || shown.length})
        </button>
      </div>

      {shown.length === 0 ? (
        <p className="py-6 text-sm text-slate-500">No applicants with this status.</p>
      ) : (
        <div className="-mx-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className={`${th} w-10`}>
                  <input type="checkbox" checked={allPicked} onChange={toggleAll} aria-label="Select all shown" className="h-4 w-4 accent-brand-600" />
                </th>
                <th className={`${th} w-12`}>#</th>
                <th className={th}>Name</th>
                <th className={th}>Position</th>
                <th className={th}>College</th>
                <th className={th}>Submitted</th>
                <th className={`${th} text-right`}>Status</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((a) => (
                <RowLink key={a.id} href={`/admin/applications/${a.id}`}>
                  {/* stopPropagation: ticking the box shouldn't open the applicant */}
                  <td className={td} onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selected.has(a.id)}
                      onChange={() => toggle(a.id)}
                      aria-label={`Select ${a.first_name} ${a.last_name}`}
                      className="h-4 w-4 accent-brand-600"
                    />
                  </td>
                  {/* numbered by submission order across all applicants: the newest gets the highest number */}
                  <td className={`${td} tabular-nums text-slate-500`}>{apps.length - apps.indexOf(a)}</td>
                  <td className={`${td} whitespace-nowrap font-medium text-slate-900`}>
                    <Link href={`/admin/applications/${a.id}`} className="hover:underline">
                      {a.first_name} {a.last_name}
                    </Link>
                  </td>
                  <td className={`${td} text-slate-700`}>{a.role}</td>
                  <td className={`${td} text-slate-700`}>{a.college_campus}</td>
                  <td className={`${td} whitespace-nowrap tabular-nums text-slate-600`}>{formatDate(a.created_at)}</td>
                  <td className={`${td} text-right`}>
                    {/* key resets the select if the saved status changes */}
                    <ApplicationStatusSelect key={a.status} id={a.id} status={a.status} />
                  </td>
                </RowLink>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
