import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { getApplication } from "@/lib/applications";
import { formatDate, formatDateTime } from "../../data";
import { Panel } from "../../ui";
import ApplicationStatusSelect from "../status-select";

export default function ApplicantPage({ params }: PageProps<"/admin/applications/[id]">) {
  return (
    <>
      <Link href="/admin/applications" className="mb-4 block w-fit text-sm text-brand-50/70 hover:text-white">
        ← All applicants
      </Link>
      <Suspense fallback={<Panel><p className="text-sm text-slate-500">Loading applicant…</p></Panel>}>
        <Applicant params={params} />
      </Suspense>
    </>
  );
}

// Links come from applicants; only render http(s) ones so a "javascript:" value can't run.
const safeUrl = (v: string | null) => (v && /^https?:\/\//i.test(v) ? v : null);

async function Applicant({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const a = await getApplication(id);
  if (!a) notFound();

  const info: [label: string, value: string | null, link?: boolean][] = [
    ["Email", a.email],
    ["Phone", a.phone],
    ["Discord", a.discord_username],
    ["Course, Year, and Section", a.course_year_section],
    ["College/campus", a.college_campus],
    ["Facebook", a.facebook_link, true],
    ["Facebook shared post", a.facebook_shared_post, true],
    ["LinkedIn", a.linkedin_link, true],
    ["Valid ID", a.certificate_link, true],
  ];
  // Older applicants were asked for a PUP Webmail; newer ones are not.
  if (a.pup_webmail) info.splice(1, 0, ["PUP Webmail", a.pup_webmail]);

  return (
    <div className="space-y-6">
      <Panel>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">{a.first_name} {a.last_name}</h2>
            <p className="mt-1 text-sm text-slate-600">{[a.role, a.team, a.department].filter(Boolean).join(" · ")}</p>
          </div>
          <div className="text-right">
            <ApplicationStatusSelect key={a.status} id={a.id} status={a.status} />
            <p className="mt-2 text-xs text-slate-500">Submitted {formatDate(a.created_at)}</p>
            {a.interview_at && <p className="mt-1 text-xs text-slate-500">Interview {formatDateTime(a.interview_at)}</p>}
          </div>
        </div>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Answers" className="lg:col-span-2">
          {a.answers.length === 0 ? (
            <p className="text-sm text-slate-500">No answers on file.</p>
          ) : (
            <ol className="space-y-6">
              {a.answers.map((x, i) => (
                <li key={i}>
                  <p className="text-sm font-medium text-slate-900">{i + 1}. {x.question}</p>
                  <p className="mt-2 whitespace-pre-wrap rounded-lg border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-700">
                    {x.answer}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </Panel>

        <Panel title="Personal information" className="self-start">
          <dl className="space-y-3 text-sm">
            {info.map(([label, value, link]) => {
              const url = link ? safeUrl(value) : null;
              return (
                <div key={label}>
                  <dt className="text-xs text-slate-500">{label}</dt>
                  <dd className="break-words text-slate-900">
                    {url ? (
                      <a href={url} target="_blank" rel="noopener noreferrer" className="text-brand-700 underline">
                        {value}
                      </a>
                    ) : (
                      value || <span className="text-slate-400">None</span>
                    )}
                  </dd>
                </div>
              );
            })}
          </dl>
        </Panel>
      </div>
    </div>
  );
}
