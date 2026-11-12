import { connection } from "next/server";
import { Suspense } from "react";
import { listApplications } from "@/lib/applications";
import { DEPARTMENTS } from "@/lib/departments";
import { Panel } from "../ui";
import ApplicantsTable from "./applicants-table";

export default function ApplicantsPage() {
  return (
    <Suspense fallback={<Panel><p className="text-sm text-slate-500">Loading applicants…</p></Panel>}>
      <Applicants />
    </Suspense>
  );
}

async function Applicants() {
  await connection();
  const apps = await listApplications();
  const count = (status: string) => apps.filter((a) => a.status === status).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
        <Count label="Applicants" value={apps.length} />
        <Count label="Pending" value={count("pending")} />
        <Count label="Interview" value={count("interview")} />
        <Count label="Accepted" value={count("accepted")} />
      </div>

      <Panel title="Applicants per department">
        <ul className="grid gap-x-8 sm:grid-cols-2 lg:grid-cols-4">
          {DEPARTMENTS.map((d) => (
            <li key={d.slug} className="flex items-center justify-between border-b border-slate-200 py-2.5 text-sm">
              <span className="text-slate-700">{d.name}</span>
              <span className="font-medium tabular-nums text-slate-900">{apps.filter((a) => a.department === d.name).length}</span>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel>
        {apps.length === 0 ? (
          <p className="text-sm text-slate-500">No applications yet.</p>
        ) : (
          <ApplicantsTable apps={apps} />
        )}
      </Panel>
    </div>
  );
}

function Count({ label, value }: { label: string; value: number }) {
  return (
    <Panel>
      <p className="text-sm text-slate-600">{label}</p>
      <p className="mt-1 text-3xl font-semibold tabular-nums text-slate-900">{value}</p>
    </Panel>
  );
}
