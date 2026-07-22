// @ts-nocheck
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header, Mono, requireUser } from "@/components/ui";
import { PATH } from "@/lib/data/path";
import { TRACKS } from "@/lib/tracks";
import { useBanks } from "@/lib/useBanks";
import { Gloss } from "@/components/gloss";
import { shuffle } from "@/lib/helpers";

export default function Path() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [adminF, setAdminF] = useState(false);
  const [prog, setProg] = useState(null);
  const [open, setOpen] = useState(null); // unit being read
  const [quiz, setQuiz] = useState(null); // {unit, qs, idx, picked, score}
  const [speaking, setSpeaking] = useState(false);
  const banks = useBanks();
  const T = TRACKS.assoc;

  const load = async () => { const r = await fetch("/api/path"); setProg((await r.json()).rows || []); };
  useEffect(() => {
    (async () => {
      const me = await requireUser(router);
      if (!me) return;
      setEmail(me.email); setAdminF(me.admin);
      load();
    })();
    return () => { try { window.speechSynthesis.cancel(); } catch {} };
  }, [router]);

  const passed = (u) => prog?.some((r) => r.unit === u && r.passed);
  const unlocked = (u) => u === 1 || passed(u - 1);
  const doneCount = PATH.filter((p) => passed(p.unit)).length;

  const startQuiz = (unit) => {
    const bank = (banks ? banks.assoc : T.bank).filter((q) => q.d === unit.domain);
    setQuiz({ unit: unit.unit, qs: shuffle(bank).slice(0, 5), idx: 0, picked: null, score: 0 });
  };
  const answer = (i) => {
    if (quiz.picked !== null) return;
    const q = quiz.qs[quiz.idx];
    const ok = i === q.a;
    fetch("/api/attempt", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ qid: q.id, track: "assoc", domain: q.d, correct: ok }) });
    setQuiz({ ...quiz, picked: i, score: quiz.score + (ok ? 1 : 0) });
  };
  const next = async () => {
    if (quiz.idx + 1 < quiz.qs.length) { setQuiz({ ...quiz, idx: quiz.idx + 1, picked: null }); return; }
    await fetch("/api/path", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ unit: quiz.unit, score: quiz.score, total: quiz.qs.length }) });
    await load();
    setQuiz({ ...quiz, done: true });
  };
  const listen = (unit) => {
    try {
      const synth = window.speechSynthesis;
      if (speaking) { synth.cancel(); setSpeaking(false); return; }
      const u = new SpeechSynthesisUtterance(`${unit.title}. ` + unit.intro.join(" "));
      u.rate = 0.95; u.onend = () => setSpeaking(false);
      synth.speak(u); setSpeaking(true);
    } catch {}
  };

  // ---- checkpoint quiz view ----
  if (quiz) {
    const q = quiz.qs[quiz.idx];
    if (quiz.done) {
      const ok = quiz.score >= Math.ceil(quiz.qs.length * 0.8);
      return (
        <div><Header email={email} admin={adminF} />
          <div className="card text-center p-8" style={{ border: `2px solid ${ok ? "var(--pine)" : "var(--red)"}` }}>
            <div className="display" style={{ fontSize: 26 }}>{ok ? "Checkpoint passed!" : "Not yet — 4 of 5 to pass"}</div>
            <p className="mt-2" style={{ color: "var(--muted)" }}>{quiz.score}/{quiz.qs.length} correct on Unit {quiz.unit}.</p>
            <div className="mt-4 flex gap-2 justify-center">
              {!ok && <button className="btn btn-primary" onClick={() => { const u = PATH.find((p) => p.unit === quiz.unit); setQuiz(null); setOpen(u.unit); }}>Reread & retry</button>}
              <button className="btn btn-ghost" onClick={() => { setQuiz(null); setOpen(null); }}>Back to path</button>
            </div>
          </div>
        </div>
      );
    }
    return (
      <div><Header email={email} admin={adminF} />
        <div className="flex justify-between mb-3">
          <Mono style={{ fontSize: 12, color: "var(--pine)", fontWeight: 600 }}>UNIT {quiz.unit} CHECKPOINT</Mono>
          <Mono style={{ fontSize: 12, color: "var(--muted)" }}>{quiz.idx + 1}/{quiz.qs.length} · {quiz.score}✓ · need 4/5</Mono>
        </div>
        <div className="card">
          <p className="font-medium mb-4" style={{ fontSize: 16, lineHeight: 1.5 }}>{q.q}</p>
          <div className="grid gap-2">
            {q.opts.map((o, i) => {
              let bg = "var(--paper)", bd = "var(--line)";
              if (quiz.picked !== null) { if (i === q.a) { bg = "var(--green-soft)"; bd = "var(--pine)"; } else if (i === quiz.picked) { bg = "var(--red-soft)"; bd = "var(--red)"; } }
              return <button key={i} onClick={() => answer(i)} className="text-left rounded-md px-4 py-3 text-sm" style={{ background: bg, border: `1px solid ${bd}` }}><Mono style={{ fontSize: 11, color: "var(--muted)", marginRight: 8 }}>{String.fromCharCode(65 + i)}</Mono>{o}</button>;
            })}
          </div>
          {quiz.picked !== null && <div className="mt-4 rounded-md p-4 text-sm" style={{ background: "var(--mark-soft)", border: "1px solid #E9D48A", lineHeight: 1.55 }}><b>{quiz.picked === q.a ? "Correct. " : "Not quite. "}</b><Gloss>{q.why}</Gloss></div>}
        </div>
        {quiz.picked !== null && <button className="btn btn-primary mt-4" onClick={next}>{quiz.idx + 1 < quiz.qs.length ? "Next" : "Finish checkpoint"}</button>}
      </div>
    );
  }

  // ---- reading view ----
  if (open) {
    const unit = PATH.find((p) => p.unit === open);
    return (
      <div><Header email={email} admin={adminF} />
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <Mono style={{ fontSize: 12, color: "var(--pine)", fontWeight: 600 }}>UNIT {unit.unit} · ~{unit.minutes} MIN</Mono>
          <div className="display" style={{ fontSize: 22 }}>{unit.title}</div>
          <button onClick={() => listen(unit)} className="btn ml-auto" style={{ border: `1px solid ${speaking ? "var(--pine)" : "var(--line)"}`, background: speaking ? "var(--green-soft)" : "transparent", color: speaking ? "var(--pine)" : "var(--muted)", padding: "2px 10px" }}>{speaking ? "■ Stop" : "▶ Listen"}</button>
        </div>
        <div className="card mb-3">
          {unit.intro.map((p, i) => <p key={i} className="text-base mb-3" style={{ lineHeight: 1.65 }}><Gloss>{p}</Gloss></p>)}
          <p className="text-sm" style={{ color: "var(--muted)" }}>Dotted-underlined words are tappable definitions. Next: skim the <b>{T.domains[unit.domain].code}</b> cards on the Study page if you want more, then take the checkpoint.</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-mark" onClick={() => startQuiz(unit)}>Take the checkpoint (5 questions, need 4)</button>
          <button className="btn btn-ghost" onClick={() => { setOpen(null); try { window.speechSynthesis.cancel(); } catch {}; setSpeaking(false); }}>Back</button>
        </div>
      </div>
    );
  }

  // ---- path overview ----
  return (
    <div><Header email={email} admin={adminF} />
      <div className="display mb-1" style={{ fontSize: 22 }}>Learning path — Fundamentals</div>
      <p className="text-sm mb-3" style={{ color: "var(--muted)" }}>Zero-background friendly. Read, listen, pass the checkpoint, unlock the next. {doneCount}/{PATH.length} complete.</p>
      <div className="rounded h-2 w-full mb-5" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
        <div className="rounded h-full" style={{ width: `${(doneCount / PATH.length) * 100}%`, background: "var(--pine)", transition: "width .5s" }} />
      </div>
      {PATH.map((u) => {
        const isDone = passed(u.unit), isOpen = unlocked(u.unit);
        return (
          <div key={u.unit} className="card mb-2 flex items-center justify-between gap-3" style={{ opacity: isOpen ? 1 : 0.55 }}>
            <div>
              <Mono style={{ fontSize: 11, color: isDone ? "var(--pine)" : "var(--muted)", fontWeight: 600 }}>{isDone ? "✓ COMPLETE" : isOpen ? `UNIT ${u.unit} · ~${u.minutes} min` : "🔒 LOCKED"}</Mono>
              <div className="font-semibold">{u.title}</div>
            </div>
            {isOpen && <button className={`btn ${isDone ? "btn-ghost" : "btn-primary"}`} onClick={() => setOpen(u.unit)}>{isDone ? "Revisit" : "Start"}</button>}
          </div>
        );
      })}
      {doneCount === PATH.length && (
        <div className="card mt-3 text-center" style={{ border: "2px solid var(--pine)" }}>
          <div className="display" style={{ fontSize: 22, color: "var(--pine)" }}>Path complete 🎓</div>
          <p className="text-sm mt-1 mb-3" style={{ color: "var(--muted)" }}>Graduation lap: take a Fundamentals mock exam.</p>
          <button className="btn btn-mark" onClick={() => router.push("/exam?track=assoc")}>Take the mock</button>
        </div>
      )}
    </div>
  );
}
