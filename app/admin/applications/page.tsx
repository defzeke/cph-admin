import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { listApplications } from "@/lib/applications";
import { DEPARTMENTS } from "@/lib/departments";
import { formatDate } from "../data";
import { Panel, td, th } from "../ui";
import RowLink from "./row-link";
import ApplicationStatusSelect from "./status-select";

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
          <div className="-mx-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className={`${th} w-12`}>#</th>
                  <th className={th}>Name</th>
                  <th className={th}>Position</th>
                  <th className={th}>College</th>
                  <th className={th}>Submitted</th>
                  <th className={`${th} text-right`}>Status</th>
                </tr>
              </thead>
              <tbody>
                {apps.map((a, i) => (
                  <RowLink key={a.id} href={`/admin/applications/${a.id}`}>
                    {/* numbered by submission order: the newest gets the highest number */}
                    <td className={`${td} tabular-nums text-slate-500`}>{apps.length - i}</td>
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
