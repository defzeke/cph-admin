import { connection } from "next/server";
import { Suspense } from "react";
import { listDeadlines } from "@/lib/admin-data";
import { PageHeader, Panel } from "../ui";
import { addDeadline } from "./actions";
import DeadlinesTable from "./deadlines-table";

export default function DeadlinesPage() {
  return (
    <>
      <PageHeader title="Deadlines" description="Submissions and hand-offs across departments." />
      <div className="space-y-6">
        <Panel title="Add deadline">
          <form action={addDeadline} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_auto_auto] lg:items-end">
            <label className="block text-xs font-medium text-slate-500">
              Task
              <input name="title" required maxLength={300} placeholder="What needs to be done" className={`${input} mt-1`} />
            </label>
            <label className="block text-xs font-medium text-slate-500">
              Department
              <input name="owner" required maxLength={300} placeholder="Who is in charge" className={`${input} mt-1`} />
            </label>
            <label className="block text-xs font-medium text-slate-500">
              Due
              <input name="due" type="date" required className={`${input} mt-1`} />
            </label>
            <button type="submit" className="rounded-md bg-brand-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-brand-700">
              Add deadline
            </button>
          </form>
        </Panel>
        <Suspense fallback={<Panel><p className="text-sm text-slate-500">Loading deadlines…</p></Panel>}>
          <Deadlines />
        </Suspense>
      </div>
    </>
  );
}

const input = "w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 outline-none focus:border-brand-500";

async function Deadlines() {
  await connection();
  const deadlines = await listDeadlines();
  // Today in Manila as YYYY-MM-DD, decided on the server so filters match the dates shown.
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });

  return (
    <Panel>
      {deadlines.length === 0 ? (
        <p className="text-sm text-slate-500">No deadlines yet.</p>
      ) : (
        <DeadlinesTable deadlines={deadlines} today={today} />
      )}
    </Panel>
  );
}
