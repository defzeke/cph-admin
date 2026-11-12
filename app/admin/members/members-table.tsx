"use client";

import { useState } from "react";
import type { Member } from "@/lib/admin-data";
import { MEMBER_CATEGORIES } from "@/lib/statuses";
import { Status, td, th } from "../ui";

// Officer order: President, EVP, Chief of Staff, VPs (equal), AVPs, other executives, then by category.
// shortcut: matches on the position text; a title outside these patterns ranks by its category only.
function rank(m: Member) {
  const p = m.position.trim().toLowerCase();
  if (m.category === "Executive") {
    if (p === "president") return 0;
    if (p.includes("executive vice president") || p === "evp") return 1;
    if (p.includes("chief of staff")) return 2;
    if (/^vp\b/.test(p) || p.startsWith("vice president")) return 3;
    if (/^avp\b/.test(p) || p.startsWith("assistant vice president")) return 4;
    return 5;
  }
  return 6 + MEMBER_CATEGORIES.indexOf(m.category as (typeof MEMBER_CATEGORIES)[number]);
}

const SORTS = {
  Position: (a: Member, b: Member) => rank(a) - rank(b),
  Category: (a: Member, b: Member) =>
    MEMBER_CATEGORIES.indexOf(a.category as never) - MEMBER_CATEGORIES.indexOf(b.category as never),
  "Name A–Z": () => 0,
};
const byName = (a: Member, b: Member) => a.name.localeCompare(b.name);

export default function MembersTable({ members }: { members: Member[] }) {
  const [filter, setFilter] = useState("All");
  const [sort, setSort] = useState<keyof typeof SORTS>("Position");
  const shown = (filter === "All" ? members : members.filter((m) => m.category === filter))
    .toSorted((a, b) => SORTS[sort](a, b) || byName(a, b));

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div role="group" aria-label="Filter by category" className="flex flex-wrap gap-2">
        {["All", ...MEMBER_CATEGORIES].map((c) => (
          <button
            key={c}
            type="button"
            aria-pressed={filter === c}
            onClick={() => setFilter(c)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
              filter === c ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 bg-white text-slate-700 hover:border-brand-500"
            }`}
          >
            {c} <span className="tabular-nums opacity-60">{c === "All" ? members.length : members.filter((m) => m.category === c).length}</span>
          </button>
        ))}
      </div>
      <label className="flex items-center gap-2 text-xs font-medium text-slate-500">
        Sort by
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as keyof typeof SORTS)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900"
        >
          {Object.keys(SORTS).map((s) => <option key={s}>{s}</option>)}
        </select>
      </label>
      </div>

      {shown.length === 0 ? (
        <p className="py-6 text-sm text-slate-500">No members here yet.</p>
      ) : (
        <div className="-mx-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className={th}>Name</th>
                <th className={th}>Position</th>
                <th className={th}>Department</th>
                <th className={th}>College</th>
                <th className={th}>Category</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((m) => (
                <tr key={m.id}>
                  <td className={`${td} whitespace-nowrap font-medium text-slate-900`}>{m.name}</td>
                  <td className={`${td} text-slate-700`}>{m.position}</td>
                  <td className={`${td} whitespace-nowrap text-slate-700`}>{m.department}</td>
                  <td className={`${td} text-slate-700`}>{m.college ?? <span className="text-slate-400">—</span>}</td>
                  <td className={td}><Status value={m.category} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
