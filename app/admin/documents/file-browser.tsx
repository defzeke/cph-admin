"use client";

import { useState } from "react";
import { td, th } from "../ui";
import type { DriveFile } from "./drive";

const views = ["List", "Grid"] as const;

export default function FileBrowser({ files }: { files: DriveFile[] }) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("All");
  const [view, setView] = useState<(typeof views)[number]>("List");

  const types = ["All", ...new Set(files.map((f) => f.type))];
  const q = query.trim().toLowerCase();
  const shown = files.filter((f) => (type === "All" || f.type === type) && f.title.toLowerCase().includes(q));

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search files"
          aria-label="Search files"
          className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 outline-none focus:border-brand-500"
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          aria-label="Filter by type"
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900"
        >
          {types.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
        <div role="group" aria-label="View" className="inline-flex rounded-lg border border-slate-300 p-0.5">
          {views.map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={view === v}
              onClick={() => setView(v)}
              className={`rounded-md px-3 py-1 text-sm ${view === v ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900"}`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {shown.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500">No files match.</p>
      ) : view === "List" ? (
        <div className="-mx-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className={th}>Title</th>
                <th className={th}>Type</th>
                <th className={th}>Last modified</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((f) => (
                <tr key={f.id} className="hover:bg-slate-50">
                  <td className={td}>
                    <a href={f.href} target="_blank" rel="noreferrer" className="text-slate-900 hover:underline">
                      {f.title}
                    </a>
                  </td>
                  <td className={`${td} text-slate-600`}>{f.type}</td>
                  <td className={`${td} text-slate-600`}>{f.modified}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {shown.map((f) => (
            <li key={f.id}>
              <a
                href={f.href}
                target="_blank"
                rel="noreferrer"
                className="block overflow-hidden rounded-lg border border-slate-200 bg-white hover:border-brand-500"
              >
                <div className="aspect-[4/3] bg-slate-100">
                  {f.thumb && (
                    // eslint-disable-next-line @next/next/no-img-element -- remote Drive thumbnail, not worth image config
                    <img src={f.thumb} alt="" className="h-full w-full object-cover object-top" />
                  )}
                </div>
                <div className="p-3">
                  <p className="truncate text-sm font-medium text-slate-900">{f.title}</p>
                  <p className="text-xs text-slate-500">
                    {f.type} · {f.modified}
                  </p>
                </div>
              </a>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
