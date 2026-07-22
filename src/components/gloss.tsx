// @ts-nocheck
"use client";
import { useState } from "react";
import { GLOSSARY } from "@/lib/data/glossary";

// Longest-first so "prompt caching" wins over "prompt".
const TERMS = [...GLOSSARY].sort((a, b) => b.t.length - a.t.length);
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const RE = new RegExp("\\b(" + TERMS.map((x) => escapeRe(x.t)).join("|") + ")\\b", "gi");
const byTerm = Object.fromEntries(GLOSSARY.map((g) => [g.t.toLowerCase(), g]));

function Term({ children, g }) {
  const [open, setOpen] = useState(false);
  return (
    <span style={{ position: "relative" }}>
      <button onClick={(e) => { e.stopPropagation(); setOpen(!open); }} style={{ borderBottom: "1.5px dotted var(--pine)", color: "inherit", cursor: "help", background: "none", padding: 0, font: "inherit" }}>{children}</button>
      {open && (
        <span className="card" style={{ position: "absolute", zIndex: 40, left: 0, top: "1.4em", width: 290, padding: "0.8rem", fontSize: 13, lineHeight: 1.5, boxShadow: "0 6px 20px rgba(23,37,30,.15)", display: "block", textAlign: "left", fontWeight: 400 }} onClick={(e) => e.stopPropagation()}>
          <b style={{ color: "var(--pine)" }}>{g.t}</b>
          <span style={{ display: "block", marginTop: 4 }}>{g.d}</span>
          <span style={{ display: "block", marginTop: 6, color: "var(--muted)", fontStyle: "italic" }}>Think: {g.a}</span>
          <button onClick={() => setOpen(false)} style={{ display: "block", marginTop: 6, color: "var(--blue)", fontSize: 12, background: "none" }}>close</button>
        </span>
      )}
    </span>
  );
}

// Renders text with glossary terms tappable. Use in EXPLANATIONS, notes, and path content —
// never inside live question/option text (definitions could leak answers mid-question).
export function Gloss({ children }) {
  const text = String(children ?? "");
  const parts = [];
  let last = 0, m, seen = new Set();
  RE.lastIndex = 0;
  while ((m = RE.exec(text)) !== null) {
    const key = m[1].toLowerCase();
    if (seen.has(key)) continue; // link first occurrence only, keep text readable
    parts.push(text.slice(last, m.index));
    parts.push(<Term key={m.index} g={byTerm[key]}>{m[1]}</Term>);
    seen.add(key);
    last = m.index + m[1].length;
  }
  parts.push(text.slice(last));
  return <>{parts}</>;
}
