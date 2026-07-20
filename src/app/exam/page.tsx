// @ts-nocheck
"use client";
import { useEffect, useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TRACKS } from "@/lib/tracks";
import { Header, Mono, requireUser } from "@/components/ui";
import { shuffle, mulberry32, pct } from "@/lib/helpers";

function ExamInner() {
  const router = useRouter();
  const track = useSearchParams().get("track") || "arch";
  const T = TRACKS[track];
  const [email, setEmail] = useState(""); const [uid, setUid] = useState(null);
  const [phase, setPhase] = useState("pick"); // pick | run | done
  const [form, setForm] = useState("A");
  const [qs, setQs] = useState([]); const [idx, setIdx] = useState(0); const [ans, setAns] = useState({});
  const [left, setLeft] = useState(0); const [result, setResult] = useState(null);
  const timer = useRef(null); const finishRef = useRef(() => {});

  useEffect(() => {
    requireUser(router).then((me) => { if (me) { setEmail(me.email); setUid(true); } });
    return () => clearInterval(timer.current);
  }, [router]);

  const start = (f) => {
    setForm(f);
    const rnd = f === "R" ? Math.random : mulberry32({ A: 11, B: 22, C: 33 }[f] + (track === "arch" ? 0 : 100));
    let picked = [];
    T.domains.forEach((_, di) => { picked = picked.concat(shuffle(T.bank.filter((q) => q.d === di), rnd).slice(0, T.exam.counts[di])); });
    picked = shuffle(picked, rnd).slice(0, T.exam.n);
    setQs(picked); setIdx(0); setAns({}); setLeft(T.exam.min * 60); setPhase("run");
    clearInterval(timer.current);
    timer.current = setInterval(() => setLeft((s) => { if (s <= 1) { clearInterval(timer.current); finishRef.current(); return 0; } return s - 1; }), 1000);
  };

  const finish = async () => {
    clearInterval(timer.current);
    const byDom = T.domains.map(() => ({ c: 0, t: 0 }));
    let correct = 0;
    const answers = qs.map((q) => { const ok = ans[q.id] === q.a; byDom[q.d].t++; if (ok) { byDom[q.d].c++; correct++; } return { qid: q.id, domain: q.d, correct: ok }; });
    const r = { form, score: correct, total: qs.length, pct: pct(correct, qs.length), byDom };
    setResult(r); setPhase("done");
    fetch("/api/exam", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ track, form, score: r.score, total: r.total, pct: r.pct, byDom, answers }) });
  };
  useEffect(() => { finishRef.current = finish; });

  if (phase === "pick") return (
    <div><Header email={email} />
      <div className="display mb-1" style={{ fontSize: 22 }}>Mock exam — {T.short}</div>
      <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>{T.exam.n} questions · {T.exam.min} minutes · weighted to the blueprint. Forms A/B/C are fixed (compare scores with teammates); Random samples fresh.</p>
      <div className="flex gap-2">{["A", "B", "C", "R"].map((f) => <button key={f} className="btn btn-mark" onClick={() => start(f)}>{f === "R" ? "Random" : `Form ${f}`}</button>)}</div>
    </div>
  );

  if (phase === "done" && result) {
    const passed = result.pct >= 70;
    return (
      <div><Header email={email} />
        <div className="card text-center mb-4" style={{ border: `2px solid ${passed ? "var(--pine)" : "var(--red)"}` }}>
          <div className="display" style={{ fontSize: 44, color: passed ? "var(--pine)" : "var(--red)" }}>{result.pct}%</div>
          <p style={{ color: "var(--muted)" }}>{result.score}/{result.total} · Form {result.form} · {passed ? "at or above the 70% study target" : "below the 70% study target"}</p>
        </div>
        <div className="card mb-4"><b>By domain</b>
          {T.domains.map((dom, i) => { const s = result.byDom[i]; const p = pct(s.c, s.t);
            return (
              <div key={dom.code} className="mt-2">
                <div className="flex justify-between text-sm mb-1"><span><Mono style={{ color: "var(--pine)", fontWeight: 600, fontSize: 12 }}>{dom.code}</Mono> {dom.name}</span><Mono style={{ fontSize: 12 }}>{s.c}/{s.t}</Mono></div>
                <div className="rounded h-2 w-full" style={{ background: "var(--paper)", border: "1px solid var(--line)" }}><div className="rounded h-full" style={{ width: `${p ?? 0}%`, background: (p ?? 0) >= 70 ? "var(--pine)" : "var(--mark)" }} /></div>
              </div>
            ); })}
        </div>
        <div className="card mb-4"><b>Review missed questions</b>
          {qs.filter((q) => ans[q.id] !== q.a).map((q) => (
            <div key={q.id} className="py-3 text-sm" style={{ borderTop: "1px solid var(--line)" }}>
              <p className="font-medium">{q.q}</p>
              <p className="mt-1" style={{ color: "var(--red)" }}>Your answer: {ans[q.id] !== undefined ? q.opts[ans[q.id]] : "(blank)"}</p>
              <p style={{ color: "var(--pine)" }}>Correct: {q.opts[q.a]}</p>
              <p className="mt-1" style={{ color: "var(--muted)", lineHeight: 1.5 }}>{q.why}</p>
            </div>
          ))}
          {qs.every((q) => ans[q.id] === q.a) && <p style={{ color: "var(--pine)" }}>Perfect score.</p>}
        </div>
        <button className="btn btn-primary" onClick={() => setPhase("pick")}>Take another</button>
      </div>
    );
  }

  const q = qs[idx];
  if (!q) return <div><Header email={email} /></div>;
  const mm = String(Math.floor(left / 60)).padStart(2, "0"), ss = String(left % 60).padStart(2, "0");
  return (
    <div>
      <div className="flex justify-between items-center mb-4 pb-3" style={{ borderBottom: "2px solid var(--ink)" }}>
        <div className="display" style={{ fontSize: 18 }}>Mock exam · {T.short} · Form {form}</div>
        <Mono style={{ fontSize: 16, fontWeight: 600, color: left < 300 ? "var(--red)" : "var(--ink)" }}>{mm}:{ss}</Mono>
      </div>
      <div className="flex flex-wrap gap-1 mb-4">
        {qs.map((qq, i) => <button key={qq.id} onClick={() => setIdx(i)} className="rounded mono" style={{ width: 26, height: 26, fontSize: 11, border: `1px solid ${i === idx ? "var(--ink)" : "var(--line)"}`, background: ans[qq.id] !== undefined ? "var(--mark)" : "var(--card)" }}>{i + 1}</button>)}
      </div>
      <div className="card">
        <Mono style={{ fontSize: 11, color: "var(--muted)" }}>Question {idx + 1} of {qs.length}</Mono>
        <p className="font-medium mt-2 mb-4" style={{ fontSize: 16, lineHeight: 1.5 }}>{q.q}</p>
        <div className="grid gap-2">
          {q.opts.map((o, i) => <button key={i} onClick={() => setAns({ ...ans, [q.id]: i })} className="text-left rounded-md px-4 py-3 text-sm" style={{ background: ans[q.id] === i ? "var(--mark-soft)" : "var(--paper)", border: `1px solid ${ans[q.id] === i ? "var(--mark-line)" : "var(--line)"}` }}><Mono style={{ fontSize: 11, color: "var(--muted)", marginRight: 8 }}>{String.fromCharCode(65 + i)}</Mono>{o}</button>)}
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <div className="flex gap-2">
          <button className="btn btn-ghost" onClick={() => setIdx(Math.max(0, idx - 1))} disabled={idx === 0}>Prev</button>
          <button className="btn btn-ghost" onClick={() => setIdx(Math.min(qs.length - 1, idx + 1))} disabled={idx === qs.length - 1}>Next</button>
        </div>
        <div className="flex items-center gap-3">
          <Mono style={{ fontSize: 12, color: "var(--muted)" }}>{Object.keys(ans).length}/{qs.length} answered</Mono>
          <button className="btn btn-primary" onClick={finish}>Submit exam</button>
        </div>
      </div>
    </div>
  );
}

export default function Exam() { return <Suspense><ExamInner /></Suspense>; }
