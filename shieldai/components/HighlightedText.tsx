"use client";

import React from "react";
import { DetectedEntity } from "@/lib/validators";

interface Props {
  original: string;
  redacted: string;
  entities: DetectedEntity[];
}

/**
 * Renders the original text with inline colored highlights over detected entities,
 * then shows the redacted output below with a divider.
 */
export default function HighlightedText({ original, redacted, entities }: Props) {
  // Build annotated segments from original text
  const segments: { text: string; entity?: DetectedEntity }[] = [];
  let cursor = 0;

  const sorted = [...entities].sort((a, b) => a.start - b.start);

  for (const entity of sorted) {
    if (entity.start > cursor) {
      segments.push({ text: original.slice(cursor, entity.start) });
    }
    segments.push({ text: original.slice(entity.start, entity.end), entity });
    cursor = entity.end;
  }
  if (cursor < original.length) {
    segments.push({ text: original.slice(cursor) });
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Highlighted original */}
      <div>
        <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2 font-semibold">
          Detected Entities (Original)
        </p>
        <p className="whitespace-pre-wrap text-slate-300 leading-7">
          {segments.map((seg, i) =>
            seg.entity ? (
              <span
                key={i}
                className={`entity-highlight entity-${seg.entity.type}`}
                title={`${seg.entity.type} — ${seg.entity.valid ? "✓ Valid" : "⚠ Suspicious"}`}
              >
                {seg.text}
              </span>
            ) : (
              <span key={i}>{seg.text}</span>
            )
          )}
        </p>
      </div>

      {/* Divider */}
      <div className="border-t border-slate-700 relative">
        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-slate-900 px-2 text-[10px] text-slate-500 uppercase tracking-widest">
          Sanitized Output ↓
        </span>
      </div>

      {/* Redacted output */}
      <div>
        <p className="whitespace-pre-wrap text-emerald-300 leading-7">{redacted}</p>
      </div>
    </div>
  );
}
