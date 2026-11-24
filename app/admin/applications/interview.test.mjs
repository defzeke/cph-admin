// node --test app/admin/applications/interview.test.mjs
import assert from "node:assert/strict";
import test from "node:test";
import { byInterview } from "./interview.ts";

const now = new Date("2026-11-24T04:00:00Z"); // noon in Manila
const apps = [
  { id: "late", interview_at: new Date("2026-11-30T02:00:00Z") },
  { id: "none", interview_at: null },
  { id: "earlier-today", interview_at: new Date("2026-11-24T01:00:00Z") },
  { id: "later-today", interview_at: new Date("2026-11-24T15:00:00Z") }, // 11pm Manila, still today
  { id: "past", interview_at: new Date("2026-11-20T02:00:00Z") },
];
const ids = (view) => byInterview(apps, view, now).map((a) => a.id);

test("byInterview", () => {
  assert.deepEqual(ids("any"), ["late", "none", "earlier-today", "later-today", "past"]);
  assert.deepEqual(ids("earliest"), ["past", "earlier-today", "later-today", "late", "none"]);
  assert.deepEqual(ids("latest"), ["late", "later-today", "earlier-today", "past", "none"]);
  assert.deepEqual(ids("today"), ["earlier-today", "later-today"]);
  assert.deepEqual(ids("upcoming"), ["later-today", "late"]);
  assert.deepEqual(ids("past"), ["earlier-today", "past"]);
  assert.deepEqual(ids("none"), ["none"]);
});
