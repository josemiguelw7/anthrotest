// @ts-nocheck
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { TRACKS } from "@/lib/tracks";
import { Header, Mono, WeightSpine } from "@/components/ui";
import { pct } from "@/lib/helpers";

export default function Dashboard() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [track, setTrack] = useState("arch");
  const [per, setPer] = useState(null);
  const [exams, setExams] = useState([]);
  const [due, setDue] = useState(0);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setEmail(user.email);
      const { data: at } = await supabase.from("attempts").select("track,domain,correct").eq("user_id", user.id);
      const agg = { arch: [0,1,2,3,4].map(() => ({ c: 0, t: 0 })), assoc: [0,1,2,3,4].map(() => ({ c: 0, t: 0 })) };
      (at || []).forEach((a) => { const s = agg[a.track]?.[a.domain]; if (s) { s.t++; if (a.correct) s.c++; } });
      setPer(agg);
      const { data: ex } = await supabase.from("exam_results").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10);
      setExams(ex || []);
      const { count } = await supabase.from("srs").select("*", { count: "exact", head: true }).eq("user_id", user.id).lte("due", new Date().toISOString());
      setDue(count || 0);
    })();
  }, [router]);

  const T = TRACKS[track];
  const p = per?.[track];
  const totT = p ? p.reduce((a, d) => a + d.t, 0) : 0;
  const totC = p ? p.reduce((a, d) => a + d.c, 0) : 0;
  const trackExams = exams.filter((e) => e.track === track);

  return (
    <div>
      <Header email={email} />
      <div className="flex gap-1 mb-4">
        {Object.entries(TRACKS).map(([k, tr]) => (
          <button key={k} onClick={() => setTrack(k)} className="btn" style={{ background: track === k ? "var(--ink)" : "transparent", color: track === k ? "#fff" : "var(--muted)", border: `1px solid ${track === k ? "var(--ink)" : "var(--line)"}` }}>{tr.short}</button>
        ))}
      </div>
      <div className="card mb-4">
        <div className="flex justify-between mb-3"><b>Blueprint vs your accuracy</b><Mono style={{ fontSize: 11, color: "var(--muted)" }}>fill = accuracy · green ≥ 70%</Mono></div>
        {p && <WeightSpine domains={T.domains} per={p} />}
        <div className="flex gap-5 mt-4 text-sm" style={{ color: "var(--muted)" }}>
          <span><Mono style={{ color: "var(--ink)", fontWeight: 600 }}>{totT}</Mono> answered</span>
          <span><Mono style={{ color: "var(--ink)", fontWeight: 600 }}>{pct(totC, totT) ?? "—"}%</Mono> accuracy</span>
          <span><Mono style={{ color: "var(--ink)", fontWeight: 600 }}>{trackExams[0] ? `${trackExams[0].pct}%` : "—"}</Mono> last mock</span>
        </div>
      </div>
      {due > 0 && (
        <div className="card mb-4" style={{ background: "var(--mark-soft)", borderColor: "var(--mark-line)" }}>
          <div className="flex items-center justify-between">
            <span><b>Daily review:</b> {due} question{due > 1 ? "s" : ""} due.</span>
            <Link href="/practice?mode=review" className="btn btn-primary no-underline">Review now</Link>
          </div>
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-3 mb-4">
        <div className="card"><div className="display" style={{ fontSize: 18 }}>Study notes</div><p className="text-sm my-2" style={{ color: "var(--muted)" }}>Concepts per domain, with audio.</p><Link href="/study" className="btn btn-ghost no-underline inline-block">Open</Link></div>
        <div className="card"><div className="display" style={{ fontSize: 18 }}>Practice drill</div><p className="text-sm my-2" style={{ color: "var(--muted)" }}>Instant explanations + AI tutor.</p><Link href={`/practice?track=${track}`} className="btn btn-primary no-underline inline-block">Start</Link></div>
        <div className="card"><div className="display" style={{ fontSize: 18 }}>Mock exam</div><p className="text-sm my-2" style={{ color: "var(--muted)" }}>{T.exam.n} q · {T.exam.min} min · forms A/B/C/R.</p><Link href={`/exam?track=${track}`} className="btn btn-mark no-underline inline-block">Start</Link></div>
      </div>
      {trackExams.length > 0 && (
        <div className="card"><b>Recent mocks — {T.short}</b>
          {trackExams.map((e) => (
            <div key={e.id} className="flex justify-between py-1.5 text-sm" style={{ borderTop: "1px solid var(--line)" }}>
              <Mono style={{ color: "var(--muted)" }}>{e.created_at.slice(0, 10)} · Form {e.form}</Mono>
              <span>{e.score}/{e.total} · <Mono style={{ fontWeight: 600, color: e.pct >= 70 ? "var(--pine)" : "var(--red)" }}>{e.pct}%</Mono></span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
