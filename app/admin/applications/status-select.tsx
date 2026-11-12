"use client";

import { APPLICATION_STATUSES } from "@/lib/statuses";
import { setApplicationStatus } from "./actions";

const label = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// Saves as soon as a status is picked. Stops clicks so the row link behind it doesn't open.
export default function ApplicationStatusSelect({ id, status }: { id: string; status: string }) {
  return (
    <form action={setApplicationStatus} onClick={(e) => e.stopPropagation()} className="inline-block">
      <input type="hidden" name="id" value={id} />
      <select
        name="status"
        defaultValue={status}
        aria-label="Application status"
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-900"
      >
        {APPLICATION_STATUSES.map((s) => (
          <option key={s} value={s}>{label(s)}</option>
        ))}
      </select>
    </form>
  );
}
