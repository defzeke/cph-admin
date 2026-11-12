import { connection } from "next/server";
import { Suspense } from "react";
import { listMembers } from "@/lib/admin-data";
import { MEMBER_CATEGORIES } from "@/lib/statuses";
import { PageHeader, Panel } from "../ui";
import { addMember } from "./actions";
import MembersTable from "./members-table";

const input = "w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 outline-none focus:border-brand-500";

export default function MembersPage() {
  return (
    <>
      <PageHeader title="Members" description="Executives, consultants, leads, chapter leads, and ambassadors." />
      <div className="space-y-6">
        <Panel title="Add member">
          <form action={addMember} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6 lg:items-end">
            <Field label="Name" name="name" placeholder="Full name" />
            <Field label="Position" name="position" placeholder="Role or title" />
            <Field label="Department" name="department" placeholder="Department" />
            <Field label="College (optional)" name="college" placeholder="College or campus" optional />
            <label className="block text-xs font-medium text-slate-500">
              Category
              <select name="category" required defaultValue="" className={`${input} mt-1`}>
                <option value="" disabled>Pick one</option>
                {MEMBER_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </label>
            <button type="submit" className="rounded-md bg-brand-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-brand-700">
              Add member
            </button>
          </form>
        </Panel>

        <Suspense fallback={<Panel><p className="text-sm text-slate-500">Loading members…</p></Panel>}>
          <Members />
        </Suspense>
      </div>
    </>
  );
}

function Field({ label, name, placeholder, optional }: { label: string; name: string; placeholder: string; optional?: boolean }) {
  return (
    <label className="block text-xs font-medium text-slate-500">
      {label}
      <input name={name} required={!optional} maxLength={200} placeholder={placeholder} className={`${input} mt-1`} />
    </label>
  );
}

async function Members() {
  await connection();
  return (
    <Panel>
      <MembersTable members={await listMembers()} />
    </Panel>
  );
}
