// @ts-nocheck
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TRACKS, BOOKING_URL } from "@/lib/tracks";
import { Header, Mono, WeightSpine, requireUser } from "@/components/ui";
import { pct } from "@/lib/helpers";

export default function Dashboard() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [adminF, setAdminF] = useState(false);
  const [track, setTrack] = useState("arch");
  const [data, setData] = useState(null);

  useEffect(() => {
    (async () => {
      const me = await requireUser(router);
      if (!me) return;
      setEmail(me.email); setAdminF(me.admin);
      const r = await fetch("/api/stats");
      setData(await r.json());
    })();
  }, [router]);

  const T = TRACKS[track];
  const p = data?.agg?.[track];
  const totT = p ? p.reduce((a, d) => a + d.t, 0) : 0;
  const totC = p ? p.reduce((a, d) => a + d.c, 0) : 0;
  const trackExams = (data?.exams || []).filter((e) => e.track === track);

  // Readiness: coverage-weighted domain accuracy blended with recent mocks.
  let readiness = null, weakest = null;
  if (p) {
    let wAcc = 0, wSum = 0, weakVal = 2;
    T.domains.forEach((dom, i) => {
      const st = p[i];
      if (st.t > 0) {
        const acc = (st.c / st.t) * Math.min(1, st.t / 5);
        wAcc += acc * dom.weight; wSum += dom.weight;
        if (acc < weakVal) { weakVal = acc; weakest = { ...dom, di: i }; }
      }
    });
    if (wSum) {
      const base = wAcc / wSum;
      const mocks = trackExams.slice(0, 3);
      const mockAvg = mocks.length ? mocks.reduce((a, e) => a + e.pct, 0) / mocks.length / 100 : null;
      readiness = Math.round((mockAvg !== null ? 0.55 * mockAvg + 0.45 * base : base * 0.85) * 100);
    }
  }
  const verdict = readiness === null ? null
    : readiness >= 85 && trackExams.length >= 2 ? { text: "You look ready — book the exam.", color: "var(--pine)", book: true }
    : readiness >= 85 ? { text: "Strong — pass one more mock above 75% and book it.", color: "var(--pine)", book: true }
    : readiness >= 70 ? { text: `Close. Drill ${weakest ? weakest.code : "your weakest domain"} and retake a mock.`, color: "var(--mark-line)" }
    : { text: "Keep building — study notes first, then domain drills.", color: "var(--red)" };

  return (
    <div>
      <Header email={email} admin={adminF} />
      <div className="flex gap-1 mb-4">
        {Object.entries(TRACKS).map(([k, tr]) => (
          <button key={k} onClick={() => setTrack(k)} className="btn" style={{ background: track === k ? "var(--ink)" : "transparent", color: track === k ? "#fff" : "var(--muted)", border: `1px solid ${track === k ? "var(--ink)" : "var(--line)"}` }}>{tr.short}</button>
        ))}
      </div>
      <div className="card mb-4">
        <div className="flex justify-between mb-3"><b>Blueprint vs your accuracy</b><Mono style={{ fontSize: 11, color: "var(--muted)" }}>fill = accuracy · green ≥ 70%</Mono></div>
        {p && <WeightSpine domains={T.domains} per={p} />}
        <div className="flex gap-5 mt-4 text-sm flex-wrap" style={{ color: "var(--muted)" }}>
          <span><Mono style={{ color: "var(--ink)", fontWeight: 600 }}>{readiness ?? "—"}%</Mono> readiness</span>
          <span><Mono style={{ color: "var(--ink)", fontWeight: 600 }}>{totT}</Mono> answered</span>
          <span><Mono style={{ color: "var(--ink)", fontWeight: 600 }}>{pct(totC, totT) ?? "—"}%</Mono> accuracy</span>
          <span><Mono style={{ color: "var(--ink)", fontWeight: 600 }}>{trackExams[0] ? `${trackExams[0].pct}%` : "—"}</Mono> last mock</span>
          {data?.streak > 0 && <span>🔥 <Mono style={{ color: "var(--pine)", fontWeight: 600 }}>{data.streak}-day</Mono> streak</span>}
        </div>
        {verdict && (
          <div className="mt-3 rounded-md p-3 text-sm flex items-center justify-between gap-3 flex-wrap" style={{ border: `1px solid ${verdict.color}`, background: "var(--paper)" }}>
            <span><b>Verdict:</b> {verdict.text}</span>
            <span className="flex gap-2">
              {weakest && <Link href={`/practice?mode=ai&track=${track}&domain=${weakest.di}`} className="btn btn-blue no-underline" style={{ padding: "3px 10px", fontSize: 13 }}>AI drill: {weakest.code}</Link>}
              {verdict.book && <a href={BOOKING_URL} target="_blank" rel="noreferrer" className="btn btn-mark no-underline" style={{ padding: "3px 10px", fontSize: 13 }}>Book at Pearson VUE →</a>}
            </span>
          </div>
        )}
      </div>
      {data?.due > 0 && (
        <div className="card mb-4" style={{ background: "var(--mark-soft)", borderColor: "var(--mark-line)" }}>
          <div className="flex items-center justify-between">
            <span><b>Daily review:</b> {data.due} question{data.due > 1 ? "s" : ""} due.</span>
            <Link href="/practice?mode=review" className="btn btn-primary no-underline">Review now</Link>
          </div>
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-3 mb-4">
        <div className="card"><div className="display" style={{ fontSize: 18 }}>Study notes</div><p className="text-sm my-2" style={{ color: "var(--muted)" }}>Concepts per domain, with audio.</p><Link href="/study" className="btn btn-ghost no-underline inline-block">Open</Link></div>
        <div className="card"><div className="display" style={{ fontSize: 18 }}>Practice drill</div><p className="text-sm my-2" style={{ color: "var(--muted)" }}>Instant explanations + AI tutor.</p><Link href={`/practice?track=${track}`} className="btn btn-primary no-underline inline-block">Start</Link></div>
        <div className="card"><div className="display" style={{ fontSize: 18 }}>Mock exam</div><p className="text-sm my-2" style={{ color: "var(--muted)" }}>{T.exam.n} q · {T.exam.min} min · forms A/B/C/R.</p><Link href={`/exam?track=${track}`} className="btn btn-mark no-underline inline-block">Start</Link></div>
      </div>
      <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>Spotted a concept worth testing? <Link href="/submit" style={{ color: "var(--blue)" }}>Submit a question</Link> for the team bank.</p>
      {trackExams.length > 0 && (
        <div className="card"><b>Recent mocks — {T.short}</b>
          {trackExams.map((e) => (
            <div key={e.id} className="flex justify-between py-1.5 text-sm" style={{ borderTop: "1px solid var(--line)" }}>
              <Mono style={{ color: "var(--muted)" }}>{String(e.created_at).slice(0, 10)} · Form {e.form}</Mono>
              <span>{e.score}/{e.total} · <Mono style={{ fontWeight: 600, color: e.pct >= 70 ? "var(--pine)" : "var(--red)" }}>{e.pct}%</Mono></span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
