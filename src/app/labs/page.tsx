// @ts-nocheck
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header, Mono, requireUser } from "@/components/ui";
import { LABS } from "@/lib/tracks";

export default function Labs() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [admin, setAdmin] = useState(false);
  const [lab, setLab] = useState(null);
  const [text, setText] = useState("");
  const [fb, setFb] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { requireUser(router).then((me) => { if (me) { setEmail(me.email); setAdmin(me.admin); } }); }, [router]);

  const grade = async () => {
    if (!text.trim() || busy) return;
    setBusy(true); setFb("");
    try {
      const r = await fetch("/api/tutor", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: [{ role: "user", content: `You are grading a hands-on certification prep lab.\nLab brief: ${lab.brief}\nRubric: ${lab.rubric}\n\nStudent submission:\n${text}\n\nGive: a score out of 10, what they did well, what to fix (be specific), and a model-quality reference version or key excerpt. Encouraging but rigorous.` }] }) });
      setFb((await r.json()).text);
    } catch { setFb("Could not reach the grader — try again."); }
    setBusy(false);
  };

  if (!lab) return (
    <div><Header email={email} admin={admin} />
      <div className="display mb-1" style={{ fontSize: 22 }}>Hands-on labs</div>
      <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>Write real artifacts — a tool definition, a CLAUDE.md, a fixed prompt — and the AI grades them against a rubric.</p>
      <div className="grid gap-2">
        {LABS.map((l) => (
          <button key={l.id} onClick={() => { setLab(l); setText(""); setFb(""); }} className="card text-left">
            <b>{l.title}</b>
            <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>{l.brief.slice(0, 110)}…</p>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div><Header email={email} admin={admin} />
      <div className="display mb-2" style={{ fontSize: 22 }}>{lab.title}</div>
      <div className="card mb-3"><p className="text-sm" style={{ lineHeight: 1.6 }}>{lab.brief}</p></div>
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={10} placeholder="Write your submission here…" className="input mono" style={{ background: "var(--card)" }} />
      <div className="mt-3 flex gap-2">
        <button className="btn btn-blue" onClick={grade} disabled={busy}>{busy ? "Grading…" : "Grade my answer"}</button>
        <button className="btn btn-ghost" onClick={() => setLab(null)}>Back to labs</button>
      </div>
      {fb && (
        <div className="mt-4 rounded-md p-4" style={{ background: "var(--blue-soft)", border: "1px solid #BFD4E6" }}>
          <Mono style={{ fontSize: 11, color: "var(--blue)", fontWeight: 600 }}>GRADER FEEDBACK</Mono>
          <p className="text-sm mt-2" style={{ whiteSpace: "pre-wrap", lineHeight: 1.55 }}>{fb}</p>
        </div>
      )}
    </div>
  );
}
