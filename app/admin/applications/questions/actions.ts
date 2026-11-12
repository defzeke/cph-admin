"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { pool } from "@/lib/pg";

const MAX_PROMPT = 1000;

function readId(formData: FormData, key: string) {
  const id = String(formData.get(key) ?? "");
  if (!/^\d+$/.test(id)) throw new Error("Invalid id.");
  return id;
}

function readPrompt(formData: FormData) {
  const prompt = String(formData.get("prompt") ?? "").trim();
  if (!prompt || prompt.length > MAX_PROMPT) throw new Error(`A question must be 1 to ${MAX_PROMPT} characters.`);
  return prompt;
}

// A question that already has answers is never rewritten: it is turned off and a new row takes its place,
// so old answers keep the wording they answered (rule from cph-membership-forms/db/schema.sql).
export async function updateQuestion(formData: FormData) {
  await requireAdmin();
  const id = readId(formData, "id");
  const prompt = readPrompt(formData);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows: [q] } = await client.query(
      `SELECT role_id, position, prompt, active,
              EXISTS (SELECT 1 FROM department_answers WHERE question_id = $1) AS answered
       FROM department_questions WHERE id = $1 FOR UPDATE`,
      [id],
    );
    if (!q?.active) throw new Error("That question no longer exists. Reload the page.");
    if (q.prompt !== prompt) {
      if (q.answered) {
        await client.query("UPDATE department_questions SET active = false WHERE id = $1", [id]);
        await client.query(
          "INSERT INTO department_questions (role_id, position, prompt) VALUES ($1, $2, $3)",
          [q.role_id, q.position, prompt],
        );
      } else {
        await client.query("UPDATE department_questions SET prompt = $2 WHERE id = $1", [id, prompt]);
      }
    }
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
  revalidatePath("/admin/applications/questions");
}

export async function addQuestion(formData: FormData) {
  await requireAdmin();
  const roleId = readId(formData, "roleId");
  const prompt = readPrompt(formData);
  const { rowCount } = await pool.query(
    `INSERT INTO department_questions (role_id, position, prompt)
     SELECT r.id, COALESCE((SELECT max(position) FROM department_questions WHERE role_id = r.id), 0) + 1, $2
     FROM department_roles r WHERE r.id = $1`,
    [roleId, prompt],
  );
  if (!rowCount) throw new Error("That position no longer exists. Reload the page.");
  revalidatePath("/admin/applications/questions");
}

// Closed departments are disabled in the form's picker and refuse submissions.
export async function setDepartmentClosed(formData: FormData) {
  await requireAdmin();
  const slug = String(formData.get("slug") ?? "");
  const closed = formData.get("closed") === "true";
  const { rowCount } = await pool.query("UPDATE departments SET closed = $2 WHERE slug = $1", [slug, closed]);
  if (!rowCount) throw new Error("That department no longer exists. Reload the page.");
  revalidatePath("/admin/applications/questions");
}

export async function setAllDepartmentsClosed(formData: FormData) {
  await requireAdmin();
  await pool.query("UPDATE departments SET closed = $1", [formData.get("closed") === "true"]);
  revalidatePath("/admin/applications/questions");
}

// Turned off, not deleted: answers may point at it.
export async function removeQuestion(formData: FormData) {
  await requireAdmin();
  await pool.query("UPDATE department_questions SET active = false WHERE id = $1", [readId(formData, "id")]);
  revalidatePath("/admin/applications/questions");
}
