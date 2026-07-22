// @ts-nocheck
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header, Mono, requireUser } from "@/components/ui";
import { TRACKS } from "@/lib/tracks";

// 1-minute placement: 3 fundamentals + 3 architect questions from the built-in banks.
const IDS = ["a1q1", "a3q1", "a5q1", "d4q1", "d3q1", "d1q2"];

export default function Start() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [adminF, setAdminF] = useState(false);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState(null);
  const [scoreA, setScoreA] = useState(0); // fundamentals correct
  const [scoreB, setScoreB] = useState(0); // architect correct
  const [done, setDone] = useState(false);
  const qs = IDS.map((id) => TRACKS.assoc.bank.find((q) => q.id === id) || TRACKS.arch.bank.find((q) => q.id === id)).filter(Boolean);

  useEffect(() => { requireUser(router).then((me) => { if (me) { setEmail(me.email); setAdminF(me.admin); } }); }, [router]);

  const q = qs[idx];
  const answer = (i) => {
    if (picked !== null) return;
    setPicked(i);
    if (i === q.a) { if (idx < 3) setScoreA(scoreA + 1); else setScoreB(scoreB + 1); }
  };
  const next = () => {
    if (idx + 1 < qs.length) { setIdx(idx + 1); setPicked(null); }
    else { setDone(true); try { localStorage.setItem("at_placed", "1"); } catch {} }
  };

  if (done) {
    const beginner = scoreA <= 1;
    const ready = scoreA >= 3 && scoreB >= 2;
    return (
      <div><Header email={email} admin={adminF} />
        <div className="card text-center p-8">
          <div className="display" style={{ fontSize: 26 }}>{beginner ? "Start at the beginning — that's the point!" : ready ? "You're past the basics." : "Solid base — build on it."}</div>
          <p className="mt-2 mb-4" style={{ color: "var(--muted)", maxWidth: 480, margin: "8px auto 16px" }}>
            {beginner ? "The learning path was built exactly for you: plain English, tap-to-define terms, five short units."
              : ready ? "Skip the hand-holding: drill the CCA-F domains and take a mock to find your gaps."
              : "Run the learning path quickly to shore up fundamentals, then move to drills."}
          </p>
          <div className="flex gap-2 justify-center">
            {ready
              ? <button className="btn btn-primary" onClick={() => router.push("/practice?track=arch")}>Go to CCA-F drills</button>
              : <button className="btn btn-primary" onClick={() => router.push("/path")}>Start the learning path</button>}
            <button className="btn btn-ghost" onClick={() => router.push("/dashboard")}>Dashboard</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div><Header email={email} admin={adminF} />
      <div className="flex justify-between mb-3">
        <Mono style={{ fontSize: 12, color: "var(--pine)", fontWeight: 600 }}>PLACEMENT · 1 MINUTE</Mono>
        <Mono style={{ fontSize: 12, color: "var(--muted)" }}>{idx + 1}/{qs.length}</Mono>
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
      </div>
      {picked !== null && <button className="btn btn-primary mt-4" onClick={next}>{idx + 1 < qs.length ? "Next" : "See my placement"}</button>}
      <p className="text-xs mt-3" style={{ color: "var(--muted)" }}>No pressure — this doesn't count toward your stats. It just routes you to the right starting point.</p>
    </div>
  );
}
