// @ts-nocheck
"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { TRACKS, qById, trackOf } from "@/lib/tracks";
import { Header, Mono } from "@/components/ui";
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
  const [email, setEmail] = useState(""); const [uid, setUid] = useState(null);
  const [queue, setQueue] = useState(null); const [idx, setIdx] = useState(0); const [picked, setPicked] = useState(null); const [done, setDone] = useState({ c: 0, t: 0 });
  const [domain, setDomain] = useState(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setEmail(user.email); setUid(user.id);
      if (mode === "review") {
        const { data } = await supabase.from("srs").select("qid").eq("user_id", user.id).lte("due", new Date().toISOString());
        setQueue(shuffle((data || []).map((r) => qById(r.qid)).filter(Boolean)));
      }
    })();
  }, [router, mode]);

  const start = (d) => { setDomain(d); setQueue(shuffle(d === -1 ? T.bank : T.bank.filter((q) => q.d === d))); setIdx(0); setPicked(null); setDone({ c: 0, t: 0 }); };

  const answer = async (i) => {
    if (picked !== null) return;
    setPicked(i);
    const q = queue[idx]; const ok = i === q.a; const tr = trackOf(q.id);
    setDone((p) => ({ c: p.c + (ok ? 1 : 0), t: p.t + 1 }));
    await supabase.from("attempts").insert({ user_id: uid, qid: q.id, track: tr, domain: q.d, correct: ok });
    const { data: cur } = await supabase.from("srs").select("*").eq("user_id", uid).eq("qid", q.id).maybeSingle();
    if (!ok) await supabase.from("srs").upsert({ user_id: uid, qid: q.id, misses: (cur?.misses || 0) + 1, ivl: 1, due: new Date(Date.now() + DAY).toISOString() });
    else if (cur) {
      const nxt = cur.ivl >= 7 ? null : cur.ivl >= 3 ? 7 : 3;
      if (nxt) await supabase.from("srs").update({ ivl: nxt, due: new Date(Date.now() + nxt * DAY).toISOString() }).eq("user_id", uid).eq("qid", q.id);
      else await supabase.from("srs").delete().eq("user_id", uid).eq("qid", q.id);
    }
  };

  if (mode !== "review" && queue === null) return (
    <div><Header email={email} />
      <div className="display mb-4" style={{ fontSize: 22 }}>Drill which domain? <Mono style={{ fontSize: 13, color: "var(--muted)" }}>({T.short})</Mono></div>
      <div className="grid gap-2">
        <button onClick={() => start(-1)} className="card text-left"><b>All domains mixed</b> <Mono style={{ fontSize: 12, color: "var(--muted)" }}>· {T.bank.length} questions</Mono></button>
        {T.domains.map((dom, di) => (
          <button key={dom.code} onClick={() => start(di)} className="card text-left flex justify-between">
            <span><Mono style={{ fontSize: 12, color: "var(--pine)", fontWeight: 600 }}>{dom.code}</Mono> <b className="ml-1">{dom.name}</b></span>
            <Mono style={{ fontSize: 12, color: "var(--muted)" }}>{T.bank.filter((q) => q.d === di).length} qs</Mono>
          </button>
        ))}
      </div>
    </div>
  );

  const q = queue?.[idx];
  if (queue && !q) return (
    <div><Header email={email} />
      <div className="card text-center p-8">
        <div className="display" style={{ fontSize: 24 }}>{mode === "review" ? "Review complete" : "Drill complete"}</div>
        <p className="mt-2" style={{ color: "var(--muted)" }}>{done.c} of {done.t} correct ({pct(done.c, done.t) ?? 0}%)</p>
        <button className="btn btn-primary mt-4" onClick={() => router.push("/dashboard")}>Home</button>
      </div>
    </div>
  );
  if (!q) return <div><Header email={email} /><p style={{ color: "var(--muted)" }}>Loading…</p></div>;

  const doms = trackOf(q.id) === "arch" ? TRACKS.arch.domains : TRACKS.assoc.domains;
  return (
    <div><Header email={email} />
      <div className="flex justify-between mb-3">
        <Mono style={{ fontSize: 12, color: "var(--muted)" }}>{mode === "review" ? "REVIEW · " : ""}{doms[q.d].code} · {doms[q.d].name}</Mono>
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
          <div className="mt-4 rounded-md p-4 text-sm" style={{ background: "var(--mark-soft)", border: "1px solid #E9D48A", lineHeight: 1.55 }}><b>{picked === q.a ? "Correct. " : "Not quite. "}</b>{q.why}</div>
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
