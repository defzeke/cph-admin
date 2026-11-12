import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { rawSql } from "@neon/realtime/server";
import { connection } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { ASSETS_BUCKET, adminDb, functionUrl, realtimeServer, storage } from "@/lib/neon";

// GET /admin/neon-check: exercises each Neon service end to end and reports pass/fail as JSON.
// Behind the proxy's /admin guard, and re-checked here because route handlers are endpoints too.

async function check(name: string, run: () => Promise<string>) {
  try {
    return { name, ok: true, detail: await run() };
  } catch (err) {
    return { name, ok: false, detail: err instanceof Error ? err.message : String(err) };
  }
}

async function postgres() {
  const { rows: [r] } = await adminDb.query<{ db: string; version: string }>(
    "SELECT current_database() AS db, split_part(version(), ' ', 2) AS version",
  );
  return `connected to ${r.db}, Postgres ${r.version}`;
}

async function objectStorage() {
  const key = `healthcheck/${crypto.randomUUID()}.txt`;
  const body = `neon-check ${new Date().toISOString()}`;
  await storage.send(new PutObjectCommand({ Bucket: ASSETS_BUCKET, Key: key, Body: body, ContentType: "text/plain" }));
  try {
    const got = await storage.send(new GetObjectCommand({ Bucket: ASSETS_BUCKET, Key: key }));
    const text = await got.Body!.transformToString();
    if (text !== body) throw new Error("downloaded content did not match the upload");
    return `put, got back and deleted ${key}`;
  } finally {
    await storage.send(new DeleteObjectCommand({ Bucket: ASSETS_BUCKET, Key: key }));
  }
}

async function functions() {
  const res = await fetch(functionUrl("hello"));
  const text = await res.text();
  if (!res.ok) throw new Error(`hello returned HTTP ${res.status}`);
  return `hello said "${text}"`;
}

// Subscribe to a live query, insert a row, and wait for that row to arrive over the WebSocket.
async function realtime() {
  // Realtime needs a primary key and no row-level security on the table it watches.
  await adminDb.query("CREATE TABLE IF NOT EXISTS neon_healthcheck (id uuid PRIMARY KEY, created_at timestamptz NOT NULL DEFAULT now())");
  const id = crypto.randomUUID();
  const rt = realtimeServer();
  try {
    const sub = await rt.subscribe(rawSql<{ id: string }>("SELECT id FROM neon_healthcheck"));
    const arrived = new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("row did not arrive within 15s")), 15_000);
      const off = sub.onChange((snap) => {
        if (snap.data?.some((r) => r.id === id)) {
          clearTimeout(timer);
          off();
          resolve();
        }
      });
    });
    const started = Date.now();
    await adminDb.query("INSERT INTO neon_healthcheck (id) VALUES ($1)", [id]);
    await arrived;
    return `inserted a row and received it live in ${Date.now() - started} ms`;
  } finally {
    rt.close();
    await adminDb.query("DELETE FROM neon_healthcheck WHERE id = $1", [id]);
  }
}

export async function GET() {
  await connection();
  await requireAdmin();
  const results = await Promise.all([
    check("postgres", postgres),
    check("object-storage", objectStorage),
    check("functions", functions),
    check("realtime", realtime),
  ]);
  return Response.json({ ok: results.every((r) => r.ok), results }, { status: results.every((r) => r.ok) ? 200 : 500 });
}
