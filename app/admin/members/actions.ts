"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { adminDb } from "@/lib/neon";
import { MEMBER_CATEGORIES } from "@/lib/statuses";

const MAX = 200;

function text(formData: FormData, key: string, label: string) {
  const value = String(formData.get(key) ?? "").trim();
  if (!value || value.length > MAX) throw new Error(`${label} must be 1 to ${MAX} characters.`);
  return value;
}

export async function addMember(formData: FormData) {
  await requireAdmin();
  const category = String(formData.get("category") ?? "");
  if (!(MEMBER_CATEGORIES as readonly string[]).includes(category)) throw new Error("Invalid category.");
  // College is optional: blank is stored as NULL.
  const college = String(formData.get("college") ?? "").trim().slice(0, MAX) || null;
  await adminDb.query(
    "INSERT INTO members (name, department, college, position, category) VALUES ($1, $2, $3, $4, $5)",
    [text(formData, "name", "Name"), text(formData, "department", "Department"), college,
      text(formData, "position", "Position"), category],
  );
  revalidatePath("/admin/members");
}
