"use client";

import { DEADLINE_STATUSES } from "@/lib/statuses";
import { setDeadlineStatus } from "./actions";

// Saves as soon as a new status is picked.
export default function StatusSelect({ id, status }: { id: string; status: string }) {
  return (
    <form action={setDeadlineStatus}>
      <input type="hidden" name="id" value={id} />
      <select
        name="status"
        defaultValue={status}
        aria-label="Status"
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-900"
      >
        {DEADLINE_STATUSES.map((s) => (
          <option key={s}>{s}</option>
        ))}
      </select>
    </form>
  );
}
