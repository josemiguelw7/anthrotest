// @ts-nocheck
"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TRACKS, findQ, trackIn, DOMAIN_DOCS } from "@/lib/tracks";
import { useBanks } from "@/lib/useBanks";
import { Header, Mono, requireUser } from "@/components/ui";
import { shuffle, pct, DAY } from "@/lib/helpers";

function Tutor({ q, picked }) {
  const [msgs, setMsgs] = useState([]); const [busy, setBusy] = useState(false); const [input, setInput] = useState(""); const [open, setOpen] = useState(false);
  const call = async (history) => {
    setBusy(true);
    try {
      const r = await fetch("/api/tutor", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: history }) });
      const { text } = await r.json();
      setMsgs([...history, { role: "assistant", content: text }]);
    } catch { setMsgs([...history, { role: "assistant", content: "Tutor unavailable — try again." }]); }
    setBusy(false);
  };
  const start = () => { setOpen(true); call([{ role: "user", content: `Practice question: "${q.q}"\nOptions: ${q.opts.map((o, i) => `${String.fromCharCode(65 + i)}. ${o}`).join(" | ")}\nCorrect: ${String.fromCharCode(65 + q.a)}. ${picked !== q.a ? `Student picked ${String.fromCharCode(65 + picked)}.` : "Student was correct."}\nExplain the concept and why wrong options tempt.` }]); };
  if (!open) return <button className="btn btn-blue mt-3" onClick={start}>Ask the AI tutor</button>;
  return (
    <div className="mt-3 rounded-md p-4" style={{ background: "var(--blue-soft)", border: "1px solid #BFD4E6" }}>
      <Mono style={{ fontSize: 11, color: "var(--blue)", fontWeight: 600 }}>AI TUTOR</Mono>
      {msgs.filter((m, i) => i > 0).map((m, i) => <p key={i} className="text-sm mt-2" style={{ whiteSpace: "pre-wrap", lineHeight: 1.55 }}>{m.role === "user" ? "You: " : ""}{m.content}</p>)}
      {busy && <p className="text-sm mt-2" style={{ color: "var(--muted)" }}>Thinking…</p>}
      {!busy && msgs.length > 0 && (
        <div className="flex gap-2 mt-3">
          <input className="input" style={{ background: "#fff" }} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && input.trim()) { call([...msgs, { role: "user", content: input.trim() }]); setInput(""); } }} placeholder="Follow-up…" />
        </div>
      )}
    </div>
  );
}

function PracticeInner() {
  const router = useRouter();
  const params = useSearchParams();
  const mode = params.get("mode") || "drill";
  const track = params.get("track") || "arch";
  const T = TRACKS[track];
  const [email, setEmail] = useState(""); const [uid, setUid] = useState(null); const [adminF, setAdminF] = useState(false); const [genErr, setGenErr] = useState("");
  const banks = useBanks();
  const [queue, setQueue] = useState(null); const [idx, setIdx] = useState(0); const [picked, setPicked] = useState(null); const [done, setDone] = useState({ c: 0, t: 0 });
  const [domain, setDomain] = useState(null);

  useEffect(() => {
    (async () => {
      const me = await requireUser(router);
      if (!me) return;
      setEmail(me.email); setUid(true); setAdminF(me.admin);
      if (mode === "ai") {
        const domain = Number(params.get("domain") || 0);
        const r = await fetch("/api/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ track, domain }) });
        const d = await r.json();
        if (d.questions) setQueue(d.questions); else setGenErr(d.error || "Generation failed.");
      }
    })();
  }, [router, mode]);

  useEffect(() => {
    if (!banks) return;
    (async () => {
      if (mode === "review") {
        const r = await fetch("/api/review");
        const { qids } = await r.json();
        setQueue(shuffle((qids || []).map((id) => findQ(banks, id)).filter(Boolean)));
      }
      if (mode === "notebook") {
        const r = await fetch("/api/notebook");
        const { rows } = await r.json();
        setQueue(shuffle((rows || []).map((x) => findQ(banks, x.qid)).filter(Boolean)));
      }
    })();
  }, [banks, mode]);

  const bank = banks ? banks[track] : T.bank;
  const start = (d) => { setDomain(d); setQueue(shuffle(d === -1 ? bank : bank.filter((q) => q.d === d))); setIdx(0); setPicked(null); setDone({ c: 0, t: 0 }); };

  const answer = async (i) => {
    if (picked !== null) return;
    setPicked(i);
    const q = queue[idx]; const ok = i === q.a; const tr = q.id.startsWith("ai_") || !banks ? track : trackIn(banks, q.id);
    setDone((p) => ({ c: p.c + (ok ? 1 : 0), t: p.t + 1 }));
    fetch("/api/attempt", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ qid: q.id, track: tr, domain: q.d, correct: ok }) });
  };

  if (mode === "ai" && genErr) return (
    <div><Header email={email} admin={adminF} /><div className="card"><p style={{ color: "var(--red)" }}>{genErr}</p><button className="btn btn-ghost mt-3" onClick={() => router.push("/dashboard")}>Back</button></div></div>
  );

  if (mode === "drill" && queue === null) return (
    <div><Header email={email} admin={adminF} />
      <div className="display mb-4" style={{ fontSize: 22 }}>Drill which domain? <Mono style={{ fontSize: 13, color: "var(--muted)" }}>({T.short})</Mono></div>
      <div className="grid gap-2">
        <button onClick={() => start(-1)} className="card text-left"><b>All domains mixed</b> <Mono style={{ fontSize: 12, color: "var(--muted)" }}>· {bank.length} questions</Mono></button>
        {T.domains.map((dom, di) => (
          <button key={dom.code} onClick={() => start(di)} className="card text-left flex justify-between">
            <span><Mono style={{ fontSize: 12, color: "var(--pine)", fontWeight: 600 }}>{dom.code}</Mono> <b className="ml-1">{dom.name}</b></span>
            <Mono style={{ fontSize: 12, color: "var(--muted)" }}>{bank.filter((q) => q.d === di).length} qs</Mono>
          </button>
        ))}
      </div>
    </div>
  );

  const q = queue?.[idx];
  if (queue && !q) return (
    <div><Header email={email} admin={adminF} />
      <div className="card text-center p-8">
        <div className="display" style={{ fontSize: 24 }}>{mode === "review" ? "Review complete" : "Drill complete"}</div>
        <p className="mt-2" style={{ color: "var(--muted)" }}>{done.c} of {done.t} correct ({pct(done.c, done.t) ?? 0}%)</p>
        <button className="btn btn-primary mt-4" onClick={() => router.push("/dashboard")}>Home</button>
      </div>
    </div>
  );
  if (!q) return <div><Header email={email} admin={adminF} /><p style={{ color: "var(--muted)" }}>Loading…</p></div>;

  const qTrack = q.id.startsWith("ai_") || !banks ? track : trackIn(banks, q.id);
  const doms = TRACKS[qTrack].domains;
  const docs = DOMAIN_DOCS[qTrack]?.[q.d];
  return (
    <div><Header email={email} admin={adminF} />
      <div className="flex justify-between mb-3">
        <Mono style={{ fontSize: 12, color: "var(--muted)" }}>{mode === "review" ? "REVIEW · " : mode === "notebook" ? "NOTEBOOK · " : mode === "ai" ? "AI-GENERATED · " : ""}{doms[q.d].code} · {doms[q.d].name}</Mono>
        <Mono style={{ fontSize: 12, color: "var(--muted)" }}>{idx + 1}/{queue.length} · {done.c}✓</Mono>
      </div>
      <div className="card">
        <p className="font-medium mb-4" style={{ fontSize: 16, lineHeight: 1.5 }}>{q.q}</p>
        <div className="grid gap-2">
          {q.opts.map((o, i) => {
            let bg = "var(--paper)", bd = "var(--line)";
            if (picked !== null) { if (i === q.a) { bg = "var(--green-soft)"; bd = "var(--pine)"; } else if (i === picked) { bg = "var(--red-soft)"; bd = "var(--red)"; } }
            return <button key={i} onClick={() => answer(i)} className="text-left rounded-md px-4 py-3 text-sm" style={{ background: bg, border: `1px solid ${bd}` }}><Mono style={{ fontSize: 11, color: "var(--muted)", marginRight: 8 }}>{String.fromCharCode(65 + i)}</Mono>{o}</button>;
          })}
        </div>
        {picked !== null && (<>
          <div className="mt-4 rounded-md p-4 text-sm" style={{ background: "var(--mark-soft)", border: "1px solid #E9D48A", lineHeight: 1.55 }}><b>{picked === q.a ? "Correct. " : "Not quite. "}</b>{q.why}{docs && <span> · <a href={docs.url} target="_blank" rel="noreferrer" style={{ color: "var(--blue)" }}>Docs: {docs.label}</a></span>}</div>
          <Tutor q={q} picked={picked} />
        </>)}
      </div>
      <div className="mt-4 flex gap-2">
        {picked !== null && <button className="btn btn-primary" onClick={() => { setIdx(idx + 1); setPicked(null); }}>Next question</button>}
        <button className="btn btn-ghost" onClick={() => router.push("/dashboard")}>End session</button>
      </div>
    </div>
  );
}

export default function Practice() {
  return <Suspense><PracticeInner /></Suspense>;
}
