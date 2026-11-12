"use client";

import { useState } from "react";
import type { Deadline } from "@/lib/admin-data";
import { formatDate } from "../data";
import { td, th } from "../ui";
import StatusSelect from "./status-select";

const STATUS_FILTERS = ["All", "Not done", "Done"] as const;
const DUE_FILTERS = ["Any date", "Overdue", "Next 7 days", "Next 30 days", "Later"] as const;

// Days from today to due; both "YYYY-MM-DD", so plain UTC math with no time zone drift.
const daysUntil = (due: string, today: string) => (Date.parse(due) - Date.parse(today)) / 86_400_000;

function matchesDue(filter: string, days: number) {
  if (filter === "Overdue") return days < 0;
  if (filter === "Next 7 days") return days >= 0 && days <= 7;
  if (filter === "Next 30 days") return days >= 0 && days <= 30;
  if (filter === "Later") return days > 30;
  return true;
}

export default function DeadlinesTable({ deadlines, today }: { deadlines: Deadline[]; today: string }) {
  const [status, setStatus] = useState<string>("Not done");
  const [due, setDue] = useState<string>("Any date");

  const shown = deadlines.filter(
    (d) =>
      (status === "All" || (status === "Done") === (d.status === "Done")) &&
      matchesDue(due, daysUntil(d.due, today)),
  );

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div role="group" aria-label="Filter by status" className="inline-flex rounded-lg border border-slate-300 p-0.5">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={status === s}
              onClick={() => setStatus(s)}
              className={`rounded-md px-3 py-1 text-sm ${status === s ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900"}`}
            >
              {s}
            </button>
          ))}
        </div>
        <select
          value={due}
          onChange={(e) => setDue(e.target.value)}
          aria-label="Filter by due date"
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900"
        >
          {DUE_FILTERS.map((f) => <option key={f}>{f}</option>)}
        </select>
      </div>

      {shown.length === 0 ? (
        <p className="py-6 text-sm text-slate-500">No deadlines match.</p>
      ) : (
        <div className="-mx-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className={th}>Due</th>
                <th className={th}>Task</th>
                <th className={th}>Department</th>
                <th className={th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((d) => {
                const done = d.status === "Done";
                const overdue = !done && daysUntil(d.due, today) < 0;
                return (
                  <tr key={d.id} className={done ? "text-slate-400" : ""}>
                    <td className={`${td} whitespace-nowrap tabular-nums ${overdue ? "font-medium text-rose-700" : ""}`}>
                      {formatDate(d.due)}
                    </td>
                    <td className={`${td} font-medium ${done ? "line-through" : "text-slate-900"}`}>{d.title}</td>
                    <td className={td}>{d.owner}</td>
                    <td className={td}>
                      {/* key resets the select if the saved status changes */}
                      <StatusSelect key={d.status} id={d.id} status={d.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
