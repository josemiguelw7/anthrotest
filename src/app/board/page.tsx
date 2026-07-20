// @ts-nocheck
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Header, Mono } from "@/components/ui";

export default function Board() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [rows, setRows] = useState([]);
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setEmail(user.email);
      const { data: profs } = await supabase.from("profiles").select("id,name");
      const { data: ex } = await supabase.from("exam_results").select("user_id,track,pct");
      const map = {};
      (profs || []).forEach((p) => (map[p.id] = { name: p.name, arch: null, assoc: null, n: 0 }));
      (ex || []).forEach((e) => { const r = map[e.user_id]; if (!r) return; r.n++; if (e.pct > (r[e.track] ?? -1)) r[e.track] = e.pct; });
      setRows(Object.values(map).sort((a, b) => (b.arch ?? -1) - (a.arch ?? -1)));
    })();
  }, [router]);
  return (
    <div><Header email={email} />
      <div className="display mb-1" style={{ fontSize: 22 }}>Team board</div>
      <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>Best mock scores per track, visible to everyone with an account.</p>
      <div className="card" style={{ padding: 0 }}>
        <div className="grid grid-cols-4 px-4 py-2 text-xs font-semibold" style={{ borderBottom: "2px solid var(--ink)" }}><span>Name</span><span>CCA-F best</span><span>Fundamentals best</span><span>Mocks taken</span></div>
        {rows.map((r) => (
          <div key={r.name} className="grid grid-cols-4 px-4 py-2.5 text-sm" style={{ borderTop: "1px solid var(--line)" }}>
            <b>{r.name}</b><Mono>{r.arch != null ? `${r.arch}%` : "—"}</Mono><Mono>{r.assoc != null ? `${r.assoc}%` : "—"}</Mono><Mono>{r.n}</Mono>
          </div>
        ))}
        {rows.length === 0 && <p className="px-4 py-6 text-sm" style={{ color: "var(--muted)" }}>No mock exams yet.</p>}
      </div>
    </div>
  );
}
