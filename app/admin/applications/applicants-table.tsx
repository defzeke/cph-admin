"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { ApplicationRow } from "@/lib/applications";
import { DEPARTMENTS } from "@/lib/departments";
import { APPLICATION_STATUSES } from "@/lib/statuses";
import { formatDate, formatDateTime } from "../data";
import { td, th } from "../ui";
import { setApplicationsStatus } from "./actions";
import { toCsv } from "./csv";
import { byInterview, INTERVIEW_VIEWS, type InterviewView } from "./interview";
import RowLink from "./row-link";
import ApplicationStatusSelect from "./status-select";

const label = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function download(apps: ApplicationRow[]) {
  const csv = toCsv([
    ["First name", "Last name", "Email", "Phone", "Position", "Team", "Department", "College", "Course, Year, Section", "Status", "Submitted", "Interview"],
    ...apps.map((a) => [
      a.first_name, a.last_name, a.email, a.phone, a.role, a.team, a.department,
      a.college_campus, a.course_year_section, label(a.status), new Date(a.created_at).toISOString().slice(0, 10),
      a.interview_at && formatDateTime(a.interview_at),
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
  const [department, setDepartment] = useState("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [contact, setContact] = useState(false);
  const [interview, setInterview] = useState<InterviewView>("any");
  const router = useRouter();
  const [refreshing, startRefresh] = useTransition();

  const inDept = department === "all" ? apps : apps.filter((a) => a.department === department);
  const byStatus = status === "all" ? inDept : inDept.filter((a) => a.status === status);
  const shown = byInterview(byStatus, interview, new Date());
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
        <div className="flex w-full flex-wrap gap-2 sm:w-auto">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            aria-label="Filter by status"
            className="w-full rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 outline-none transition hover:border-brand-500 focus:border-brand-500 sm:w-auto sm:py-1"
          >
            {["all", ...APPLICATION_STATUSES].map((s) => (
              <option key={s} value={s}>
                {label(s)} ({s === "all" ? inDept.length : inDept.filter((a) => a.status === s).length})
              </option>
            ))}
          </select>
          <select
            value={interview}
            onChange={(e) => setInterview(e.target.value as InterviewView)}
            aria-label="Interview schedule"
            className="w-full rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 outline-none transition hover:border-brand-500 focus:border-brand-500 sm:w-auto sm:py-1"
          >
            {Object.entries(INTERVIEW_VIEWS).map(([value, text]) => (
              <option key={value} value={value}>{text}</option>
            ))}
          </select>
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            aria-label="Filter by department"
            className="w-full rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 outline-none transition hover:border-brand-500 focus:border-brand-500 sm:w-auto sm:py-1"
          >
            <option value="all">All departments</option>
            {DEPARTMENTS.map((d) => (
              <option key={d.slug} value={d.name}>
                {d.name} ({apps.filter((a) => a.department === d.name).length})
              </option>
            ))}
          </select>
        </div>
        <div className="flex w-full flex-wrap gap-2 sm:w-auto">
          {picked.length > 0 && (
            <form action={setApplicationsStatus} className="flex w-full items-center gap-2 sm:w-auto">
              {picked.map((a) => <input key={a.id} type="hidden" name="id" value={a.id} />)}
              <label htmlFor="batch-status" className="text-xs font-medium text-slate-600">
                Mark {picked.length} selected as
              </label>
              <select
                id="batch-status"
                name="status"
                value=""
                onChange={(e) => e.currentTarget.form?.requestSubmit()}
                className="flex-1 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 outline-none transition hover:border-brand-500 focus:border-brand-500 sm:flex-none"
              >
                <option value="" disabled>Choose status…</option>
                {APPLICATION_STATUSES.map((s) => (
                  <option key={s} value={s}>{label(s)}</option>
                ))}
              </select>
            </form>
          )}
          <button
            type="button"
            aria-pressed={contact}
            onClick={() => setContact((c) => !c)}
            className={`flex-1 rounded-md border px-3 py-1.5 text-xs font-medium transition sm:flex-none ${
              contact ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 bg-white text-slate-800 hover:border-brand-500 hover:text-brand-700"
            }`}
          >
            Discord &amp; interview
          </button>
          <button
            type="button"
            disabled={refreshing}
            onClick={() => startRefresh(() => router.refresh())}
            className="flex-1 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 transition hover:border-brand-500 hover:text-brand-700 disabled:opacity-50 sm:flex-none"
          >
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
          <button
            type="button"
            disabled={shown.length === 0}
            onClick={() => download(picked.length ? picked : shown)}
            className="flex-1 rounded-md bg-brand-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-brand-700 disabled:opacity-50 sm:flex-none"
          >
            Export CSV ({picked.length || shown.length})
          </button>
        </div>
      </div>

      {shown.length === 0 ? (
        <p className="py-6 text-sm text-slate-500">No applicants match these filters.</p>
      ) : (
        <div className="-mx-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className={`${th} w-10`}>
                  <input type="checkbox" checked={allPicked} onChange={toggleAll} aria-label="Select all shown" className="h-4 w-4 accent-brand-600" />
                </th>
                <th className={`${th} hidden w-12 sm:table-cell`}>#</th>
                <th className={th}>Name</th>
                <th className={`${th} hidden md:table-cell`}>Position</th>
                <th className={`${th} hidden ${contact ? "" : "lg:table-cell"}`}>College</th>
                <th className={`${th} hidden lg:table-cell`}>Submitted</th>
                {contact && <th className={`${th} hidden md:table-cell`}>Discord · Interview</th>}
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
                  <td className={`${td} hidden tabular-nums text-slate-500 sm:table-cell`}>{apps.length - apps.indexOf(a)}</td>
                  <td className={`${td} font-medium text-slate-900 md:whitespace-nowrap`}>
                    <Link href={`/admin/applications/${a.id}`} className="hover:underline">
                      {a.first_name} {a.last_name}
                    </Link>
                    {/* small screens: the hidden columns stack here */}
                    <span className="mt-0.5 block text-xs font-normal text-slate-600 md:hidden">
                      {a.role}{a.team && ` · ${a.team}`}
                    </span>
                    <span className="block text-xs font-normal text-slate-500 lg:hidden">
                      {a.college_campus} · {formatDate(a.created_at)}
                    </span>
                    {contact && (
                      <span className="block text-xs font-normal text-slate-700 md:hidden">
                        {a.discord_username || "No Discord"} · {a.interview_at ? formatDateTime(a.interview_at) : "No interview booked"}
                      </span>
                    )}
                  </td>
                  <td className={`${td} hidden text-slate-700 md:table-cell`}>
                    {a.role}
                    {a.team && <span className="block text-xs text-slate-500">{a.team}</span>}
                  </td>
                  <td className={`${td} hidden text-slate-700 ${contact ? "" : "lg:table-cell"}`}>{a.college_campus}</td>
                  <td className={`${td} hidden whitespace-nowrap tabular-nums text-slate-600 lg:table-cell`}>{formatDate(a.created_at)}</td>
                  {contact && (
                    <td className={`${td} hidden text-slate-700 md:table-cell`}>
                      {a.discord_username || <span className="text-slate-400">No Discord</span>}
                      <span className="block whitespace-nowrap text-xs tabular-nums text-slate-500">
                        {a.interview_at ? formatDateTime(a.interview_at) : "No interview booked"}
                      </span>
                    </td>
                  )}
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
