import { adminDb } from "./neon";
import { MEMBER_CATEGORIES } from "./statuses";

// Tables from db/schema.sql in the admin's own database.

export type Member = { id: string; name: string; department: string; college: string | null; position: string; category: string };
export type Deadline = { id: string; title: string; owner: string; due: string; status: string };

export async function listMembers() {
  const { rows } = await adminDb.query<Member>(
    `SELECT id::text, name, department, college, position, category FROM members
     ORDER BY array_position($1::text[], category), name`,
    [MEMBER_CATEGORIES],
  );
  return rows;
}

// due as text ("2026-11-14") so formatDate doesn't shift it by the server's time zone.
export async function listDeadlines() {
  const { rows } = await adminDb.query<Deadline>(
    "SELECT id::text, title, owner, due::text, status FROM deadlines ORDER BY due, id",
  );
  return rows;
}
