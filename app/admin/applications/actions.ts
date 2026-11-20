"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { pool } from "@/lib/pg";
import { APPLICATION_STATUSES } from "@/lib/statuses";

export async function setApplicationStatus(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!/^\d+$/.test(id)) throw new Error("Invalid id.");
  if (!(APPLICATION_STATUSES as readonly string[]).includes(status)) throw new Error("Invalid status.");
  await pool.query("UPDATE applications SET status = $2 WHERE id = $1", [id, status]);
  revalidatePath("/admin/applications");
  revalidatePath(`/admin/applications/${id}`);
  revalidatePath("/admin");
}

export async function setApplicationsStatus(formData: FormData) {
  await requireAdmin();
  const ids = formData.getAll("id").map(String);
  const status = String(formData.get("status") ?? "");
  if (ids.length === 0 || !ids.every((id) => /^\d+$/.test(id))) throw new Error("Invalid id.");
  if (!(APPLICATION_STATUSES as readonly string[]).includes(status)) throw new Error("Invalid status.");
  await pool.query("UPDATE applications SET status = $2 WHERE id = ANY($1::bigint[])", [ids, status]);
  // layout revalidation covers every detail page too
  revalidatePath("/admin/applications", "layout");
  revalidatePath("/admin");
}
