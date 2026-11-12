"use client";

import { useState } from "react";

type Slice = { name: string; color: string; value: number };

const R = 70;
const C = 2 * Math.PI * R;

// Donut: one stroked circle per slice, offset along the ring; 2px gap between slices.
// Own tooltip (not SVG <title>) so it shows the instant the cursor touches a slice.
export default function Donut({ slices, total }: { slices: Slice[]; total: number }) {
  const [tip, setTip] = useState<{ slice: Slice; x: number; y: number } | null>(null);
  const shown = total > 0 ? slices.filter((s) => s.value) : [];
  const gap = shown.length > 1 ? 2 : 0;
  const starts = shown.map((_, i) => shown.slice(0, i).reduce((sum, s) => sum + (s.value / total) * C, 0));

  return (
    <div className="relative shrink-0" onMouseLeave={() => setTip(null)}>
      <svg viewBox="0 0 180 180" className="h-48 w-48" role="img" aria-label={`${total} applications by department`}>
        <circle cx="90" cy="90" r={R} fill="none" stroke="#e2e8f0" strokeWidth="22" />
        <g transform="rotate(-90 90 90)">
          {shown.map((s, i) => (
            <circle
              key={s.name}
              cx="90"
              cy="90"
              r={R}
              fill="none"
              stroke={s.color}
              // wider than drawn so the hover target is easy to hit
              strokeWidth={tip?.slice.name === s.name ? 26 : 22}
              strokeDasharray={`${Math.max((s.value / total) * C - gap, 0.5)} ${C}`}
              strokeDashoffset={-starts[i]}
              className="cursor-pointer"
              onMouseMove={(e) => {
                const box = e.currentTarget.ownerSVGElement!.getBoundingClientRect();
                setTip({ slice: s, x: e.clientX - box.left, y: e.clientY - box.top });
              }}
            />
          ))}
        </g>
        <text x="90" y="88" textAnchor="middle" className="pointer-events-none fill-slate-900 text-[28px] font-semibold tabular-nums">{total}</text>
        <text x="90" y="110" textAnchor="middle" className="pointer-events-none fill-slate-500 text-[11px]">applications</text>
      </svg>
      {tip && (
        <div
          role="tooltip"
          className="pointer-events-none absolute z-10 whitespace-nowrap rounded-md bg-slate-900 px-2.5 py-1.5 text-xs text-white shadow-lg"
          style={{ left: tip.x + 12, top: tip.y + 12 }}
        >
          <span className="mr-1.5 inline-block h-2 w-2 rounded-sm" style={{ background: tip.slice.color }} />
          {tip.slice.name}: <span className="font-semibold tabular-nums">{tip.slice.value}</span>{" "}
          <span className="text-white/60">({Math.round((tip.slice.value / total) * 100)}%)</span>
        </div>
      )}
    </div>
  );
}
