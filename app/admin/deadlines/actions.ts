"use server";

import { revalidatePath } from "next/cache";
import { DEADLINE_STATUSES } from "@/lib/statuses";
import { requireAdmin } from "@/lib/auth";
import { adminDb } from "@/lib/neon";

function readId(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!/^\d+$/.test(id)) throw new Error("Invalid id.");
  return id;
}

function refresh() {
  revalidatePath("/admin/deadlines");
  revalidatePath("/admin");
}

export async function setDeadlineStatus(formData: FormData) {
  await requireAdmin();
  const id = readId(formData);
  const status = String(formData.get("status") ?? "");
  if (!(DEADLINE_STATUSES as readonly string[]).includes(status)) throw new Error("Invalid status.");
  await adminDb.query("UPDATE deadlines SET status = $2 WHERE id = $1", [id, status]);
  refresh();
}

function text(formData: FormData, key: string, label: string) {
  const value = String(formData.get(key) ?? "").trim();
  if (!value || value.length > 300) throw new Error(`${label} must be 1 to 300 characters.`);
  return value;
}

export async function addDeadline(formData: FormData) {
  await requireAdmin();
  const due = String(formData.get("due") ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(due)) throw new Error("Invalid due date.");
  await adminDb.query("INSERT INTO deadlines (title, owner, due) VALUES ($1, $2, $3)", [
    text(formData, "title", "Task"),
    text(formData, "owner", "Department"),
    due,
  ]);
  refresh();
}
