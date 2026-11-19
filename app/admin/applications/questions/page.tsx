import { connection } from "next/server";
import { Suspense } from "react";
import { DEPARTMENTS } from "@/lib/departments";
import { listQuestions, type QuestionRow } from "@/lib/applications";
import { Panel, Status } from "../../ui";
import { addQuestion, removeQuestion, setAllDepartmentsClosed, setDepartmentClosed, updateQuestion } from "./actions";
import ConfirmButton from "./confirm-button";

// Fields on the membership form's personal information step. These live in the form's code, not the database.
const personalFields: [label: string, required: boolean][] = [
  ["First Name", true],
  ["Last Name", true],
  ["Email Address", true],
  ["Facebook Link", true],
  ["Facebook Shared Post", true],
  ["Discord Username", true],
  ["LinkedIn Link", false],
  ["Phone Number", true],
  ["Course, Year, and Section", true],
  ["Valid ID (school or government)", true],
  ["College/campus", true],
];

const textarea =
  "w-full resize-y rounded-md border border-slate-300 bg-white px-3 py-2 text-sm leading-6 text-slate-900 outline-none focus:border-brand-500";
const outlineButton =
  "rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 transition hover:border-brand-500 hover:text-brand-700";
const saveButton = "rounded-md bg-brand-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-brand-700";

export default function QuestionsPage() {
  return (
    <div className="space-y-6">
      <Panel title="Personal information">
        <ul className="grid gap-x-8 sm:grid-cols-2">
          {personalFields.map(([label, required]) => (
            <li key={label} className="flex items-center justify-between border-b border-slate-200 py-2.5 text-sm">
              <span className="text-slate-800">{label}</span>
              <span className={`text-xs ${required ? "text-slate-500" : "text-slate-400"}`}>{required ? "Required" : "Optional"}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-slate-600">
          Then the applicant picks one open department and a position, and answers that position&apos;s questions below.
        </p>
      </Panel>

      <p className="rounded-lg border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-slate-700">
        Edits go live on the membership form right away. If a question already has answers, saving a new wording keeps
        the old wording attached to those answers.
      </p>

      <Suspense fallback={<Panel><p className="text-sm text-slate-500">Loading questions…</p></Panel>}>
        <Departments />
      </Suspense>
    </div>
  );
}

async function Departments() {
  await connection();
  const rows = await listQuestions();
  const departments = [...Map.groupBy(rows, (r) => r.department_slug)];
  const openCount = departments.filter(([, d]) => !d[0].closed).length;

  return (
    <>
      <Panel>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Accepting applications</h2>
            <p className="mt-1 text-sm text-slate-600">
              {openCount} of {departments.length} departments open. Closed departments can&apos;t be picked on the form.
            </p>
          </div>
          <div className="flex gap-2">
            <form action={setAllDepartmentsClosed}>
              <input type="hidden" name="closed" value="false" />
              <button type="submit" className={outlineButton}>Open all</button>
            </form>
            <form action={setAllDepartmentsClosed}>
              <input type="hidden" name="closed" value="true" />
              <ConfirmButton
                message="Close every department? No one will be able to apply until you open one again."
                className="rounded-md bg-crimson px-3 py-1.5 text-xs font-medium text-white transition hover:bg-crimson/90"
              >
                Close all
              </ConfirmButton>
            </form>
          </div>
        </div>
      </Panel>
      {departments.map(([slug, deptRows]) => (
        <Department key={slug} slug={slug} rows={deptRows} />
      ))}
    </>
  );
}

function Department({ slug, rows: deptRows }: { slug: string; rows: QuestionRow[] }) {
  const info = DEPARTMENTS.find((d) => d.slug === slug);
  const roles = Map.groupBy(deptRows, (r) => r.role_id);
  const closed = deptRows[0].closed;
  return (
      <Panel>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-3 text-base font-semibold text-slate-900">
            {deptRows[0].department}
            <Status value={closed ? "Closed" : "Open"} />
          </h2>
          <form action={setDepartmentClosed}>
            <input type="hidden" name="slug" value={slug} />
            <input type="hidden" name="closed" value={String(!closed)} />
            <button type="submit" className={outlineButton}>{closed ? "Open applications" : "Close applications"}</button>
          </form>
        </div>
        {info && <p className="-mt-1 mb-5 text-sm leading-6 text-slate-600">{info.description}</p>}
        <div className="grid gap-6 md:grid-cols-2">
          {[...roles].map(([roleId, roleRows]) => (
            <Role key={roleId} roleId={roleId} rows={roleRows} />
          ))}
        </div>
      </Panel>
  );
}

function Role({ roleId, rows }: { roleId: string; rows: QuestionRow[] }) {
  const questions = rows.filter((r) => r.question_id);
  const { role, category, teams, interview } = rows[0];
  return (
    <div className="flex flex-col rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-slate-900">{role}</h3>
      <p className="mt-1 text-xs text-slate-500">{category}{interview ? "" : " · No interview"}</p>
      {teams?.length ? <p className="mt-1 text-xs text-slate-500">Teams: {teams.join(", ")}</p> : null}

      <ol className="mt-3 flex-1 space-y-4">
        {questions.map((q, i) => (
          // key on id: an edit can create a new row, which should remount with the new text
          <li key={q.question_id}>
            <form action={updateQuestion} className="space-y-2">
              <input type="hidden" name="id" value={q.question_id!} />
              <label htmlFor={`q-${q.question_id}`} className="text-xs font-medium text-slate-500">
                Question {i + 1}
              </label>
              <textarea id={`q-${q.question_id}`} name="prompt" defaultValue={q.prompt!} required maxLength={1000} rows={3} className={textarea} />
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-slate-500">
                  {q.answers ? `${q.answers} ${q.answers === 1 ? "answer" : "answers"}` : "No answers yet"}
                </span>
                <span className="flex gap-1">
                  <ConfirmButton
                    message="Remove this question from the live form?"
                    formAction={removeQuestion}
                    className="rounded-md px-3 py-1.5 text-xs font-medium text-rose-700 transition hover:bg-rose-50"
                  >
                    Remove
                  </ConfirmButton>
                  <button type="submit" className={saveButton}>Save</button>
                </span>
              </div>
            </form>
          </li>
        ))}
        {!questions.length && <li className="text-sm text-slate-500">No questions. Applicants submit with no answers.</li>}
      </ol>

      <form action={addQuestion} className="mt-5 space-y-2 border-t border-slate-200 pt-4">
        <input type="hidden" name="roleId" value={roleId} />
        <label htmlFor={`new-${roleId}`} className="text-xs font-medium text-slate-500">Add a question</label>
        <textarea id={`new-${roleId}`} name="prompt" required maxLength={1000} rows={2} className={textarea} />
        <div className="flex justify-end">
          <button type="submit" className={saveButton}>Add</button>
        </div>
      </form>
    </div>
  );
}
