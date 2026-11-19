import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { listApplications } from "@/lib/applications";
import { DEPARTMENTS } from "@/lib/departments";
import { listDeadlines, listMembers } from "@/lib/admin-data";
import { formatDate } from "./data";
import Donut from "./donut";
import { PageHeader, Panel, Status, td, th } from "./ui";

export default function OverviewPage() {
  return (
    <>
      <PageHeader title="Overview" description="Where CyberPH stands this semester." />
      <Suspense fallback={<Panel><p className="text-sm text-slate-500">Loading…</p></Panel>}>
        <Dashboard />
      </Suspense>
    </>
  );
}

async function Dashboard() {
  await connection();
  const [applications, deadlines, members] = await Promise.all([listApplications(), listDeadlines(), listMembers()]);
  const openDeadlines = deadlines.filter((d) => d.status !== "Done");
  const next = openDeadlines[0]; // listDeadlines sorts by due
  const perDept = DEPARTMENTS.map((d, i) => ({
    name: d.name,
    color: SERIES[i % SERIES.length],
    value: applications.filter((a) => a.department === d.name).length,
  }));

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
        <Stat label="Members" value={members.length} note={`${members.filter((m) => m.category === "Executive").length} executives`} />
        <Stat label="Nearest deadline" value={next ? formatDate(next.due) : "None"} note={next ? next.title : "Nothing open"} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Panel title="Recent applications" action={{ href: "/admin/applications", label: "View all" }}>
          <div className="-mx-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className={th}>Name</th>
                  <th className={th}>Department</th>
                  <th className={`${th} text-right`}>Status</th>
                </tr>
              </thead>
              <tbody>
                {applications.slice(0, 5).map((a) => (
                  <tr key={a.id}>
                    <td className={`${td} whitespace-nowrap font-medium text-slate-900`}>
                      <Link href={`/admin/applications/${a.id}`} className="hover:underline">{a.first_name} {a.last_name}</Link>
                    </td>
                    <td className={`${td} whitespace-nowrap text-slate-700`}>{a.department}</td>
                    <td className={`${td} text-right`}><Status value={a.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Upcoming deadlines" action={{ href: "/admin/deadlines", label: "View all" }}>
          <div className="-mx-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className={th}>Task</th>
                  <th className={`${th} text-right`}>Due</th>
                </tr>
              </thead>
              <tbody>
                {openDeadlines.slice(0, 5).map((d) => (
                  <tr key={d.id}>
                    <td className={`${td} w-full max-w-0 truncate font-medium text-slate-900`} title={d.title}>{d.title}</td>
                    <td className={`${td} whitespace-nowrap text-right tabular-nums text-slate-600`}>{formatDate(d.due)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>

      <Panel title="Applications per department" className="mt-6">
        <div className="flex flex-col items-center gap-8 md:flex-row">
          <Donut slices={perDept} total={applications.length} />
          {/* doubles as the chart's legend and table view */}
          <ul className="grid w-full flex-1 gap-x-8 sm:grid-cols-2">
            {perDept.map((d) => (
              <li key={d.name} className="flex items-center gap-3 border-b border-slate-200 py-2.5 text-sm">
                <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: d.color }} />
                <span className="flex-1 text-slate-700">{d.name}</span>
                <span className="font-medium tabular-nums text-slate-900">{d.value}</span>
              </li>
            ))}
          </ul>
        </div>
      </Panel>
    </>
  );
}

// Categorical palette from the dataviz skill (checked with its validator). Fixed per department, never re-ordered.
const SERIES = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#6250d6", "#e34948", "#0097a7"];

function Stat({ label, value, note }: { label: string; value: number | string; note: string }) {
  return (
    <Panel>
      <p className="text-sm text-slate-600">{label}</p>
      <p className="mt-1 text-3xl font-semibold tabular-nums text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{note}</p>
    </Panel>
  );
}
