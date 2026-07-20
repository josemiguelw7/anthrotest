// @ts-nocheck
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { TRACKS } from "@/lib/tracks";
import { Header, Mono } from "@/components/ui";

export default function Study() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [track, setTrack] = useState("arch");
  const [speaking, setSpeaking] = useState(null);
  const T = TRACKS[track];

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => { if (!user) router.push("/login"); else setEmail(user.email); });
    return () => { try { window.speechSynthesis.cancel(); } catch {} };
  }, [router]);

  const speak = (di) => {
    try {
      const synth = window.speechSynthesis;
      if (speaking === di) { synth.cancel(); setSpeaking(null); return; }
      synth.cancel();
      const notes = T.notes.filter((n) => n.d === di);
      const u = new SpeechSynthesisUtterance(`${T.domains[di].name}. ` + notes.map((n) => `${n.title}. ${n.body}`).join(" Next. "));
      u.rate = 0.95; u.onend = () => setSpeaking(null);
      synth.speak(u); setSpeaking(di);
    } catch { setSpeaking(null); }
  };

  return (
    <div>
      <Header email={email} />
      <div className="flex gap-1 mb-4">
        {Object.entries(TRACKS).map(([k, tr]) => (
          <button key={k} onClick={() => { setTrack(k); try { window.speechSynthesis.cancel(); } catch {}; setSpeaking(null); }} className="btn" style={{ background: track === k ? "var(--ink)" : "transparent", color: track === k ? "#fff" : "var(--muted)", border: `1px solid ${track === k ? "var(--ink)" : "var(--line)"}` }}>{tr.short}</button>
        ))}
      </div>
      {T.domains.map((dom, di) => (
        <div key={dom.code} className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Mono style={{ fontSize: 12, color: "var(--pine)", fontWeight: 600 }}>{dom.code} · {dom.weight}%</Mono>
            <div className="display" style={{ fontSize: 18 }}>{dom.name}</div>
            <button onClick={() => speak(di)} className="btn ml-auto" style={{ border: `1px solid ${speaking === di ? "var(--pine)" : "var(--line)"}`, background: speaking === di ? "var(--green-soft)" : "transparent", color: speaking === di ? "var(--pine)" : "var(--muted)", padding: "2px 10px" }}>{speaking === di ? "■ Stop" : "▶ Listen"}</button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {T.notes.filter((n) => n.d === di).map((n) => (
              <div key={n.title} className="card" style={{ padding: "1rem" }}>
                <span className="font-semibold text-sm" style={{ background: "var(--mark-soft)", padding: "0 4px" }}>{n.title}</span>
                <p className="text-sm mt-2" style={{ color: "#333e38", lineHeight: 1.55 }}>{n.body}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
