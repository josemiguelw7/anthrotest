// @ts-nocheck
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header, Mono, requireUser } from "@/components/ui";
import { GLOSSARY } from "@/lib/data/glossary";

export default function Glossary() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [adminF, setAdminF] = useState(false);
  const [q, setQ] = useState("");
  useEffect(() => { requireUser(router).then((me) => { if (me) { setEmail(me.email); setAdminF(me.admin); } }); }, [router]);

  const list = GLOSSARY.filter((g) => !q.trim() || (g.t + " " + g.d + " " + g.a).toLowerCase().includes(q.toLowerCase())).sort((a, b) => a.t.localeCompare(b.t));
  return (
    <div><Header email={email} admin={adminF} />
      <div className="flex items-baseline justify-between flex-wrap gap-2 mb-1">
        <div className="display" style={{ fontSize: 22 }}>Glossary</div>
        <Link href="/cards?deck=glossary" className="btn btn-mark no-underline" style={{ padding: "3px 10px", fontSize: 13 }}>Study as flashcards →</Link>
      </div>
      <p className="text-sm mb-3" style={{ color: "var(--muted)" }}>{GLOSSARY.length} terms in plain English. These same terms are tappable (dotted underline) inside explanations and notes across the site.</p>
      <input className="input mb-4" style={{ background: "var(--card)" }} placeholder="Search terms…" value={q} onChange={(e) => setQ(e.target.value)} />
      {list.map((g) => (
        <div key={g.t} className="card mb-2" style={{ padding: "0.9rem" }}>
          <b style={{ color: "var(--pine)" }}>{g.t}</b>
          <p className="text-sm mt-1" style={{ lineHeight: 1.55 }}>{g.d}</p>
          <p className="text-sm mt-1" style={{ color: "var(--muted)", fontStyle: "italic" }}>Think: {g.a}</p>
          <p className="text-sm mt-1" style={{ color: "var(--blue)" }}>Exam angle: {g.e}</p>
        </div>
      ))}
      {list.length === 0 && <p style={{ color: "var(--muted)" }}>No terms match &ldquo;{q}&rdquo;.</p>}
    </div>
  );
}
