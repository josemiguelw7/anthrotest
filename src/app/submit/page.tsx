// @ts-nocheck
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header, Mono, requireUser } from "@/components/ui";
import { TRACKS } from "@/lib/tracks";

export default function Submit() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [admin, setAdmin] = useState(false);
  const [sub, setSub] = useState({ track: "arch", domain: 0, q: "", opts: ["", "", "", ""], a: 0, why: "" });
  const [msg, setMsg] = useState("");
  useEffect(() => { requireUser(router).then((me) => { if (me) { setEmail(me.email); setAdmin(me.admin); } }); }, [router]);

  const send = async () => {
    setMsg("");
    const r = await fetch("/api/submit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(sub) });
    const d = await r.json();
    if (d.ok) { setMsg("Submitted — an admin will review it. Thanks!"); setSub({ track: sub.track, domain: 0, q: "", opts: ["", "", "", ""], a: 0, why: "" }); }
    else setMsg(d.error || "Something went wrong.");
  };
  const T = TRACKS[sub.track];

  return (
    <div><Header email={email} admin={admin} />
      <div className="display mb-1" style={{ fontSize: 22 }}>Submit a question</div>
      <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>Saw a concept worth testing? Write your own scenario — never reproduce actual exam questions. An admin reviews before it joins the bank.</p>
      <div className="card">
        <div className="flex gap-2 mb-3 flex-wrap">
          <select className="input" style={{ width: "auto" }} value={sub.track} onChange={(e) => setSub({ ...sub, track: e.target.value, domain: 0 })}>
            <option value="arch">Architect (CCA-F)</option><option value="assoc">Fundamentals</option>
          </select>
          <select className="input flex-1" style={{ width: "auto" }} value={sub.domain} onChange={(e) => setSub({ ...sub, domain: Number(e.target.value) })}>
            {T.domains.map((d, i) => <option key={d.code} value={i}>{d.code} — {d.name}</option>)}
          </select>
        </div>
        <textarea className="input mb-2" rows={2} placeholder="The question / scenario…" value={sub.q} onChange={(e) => setSub({ ...sub, q: e.target.value })} />
        {sub.opts.map((o, i) => (
          <div key={i} className="flex gap-2 items-center mb-2">
            <button onClick={() => setSub({ ...sub, a: i })} className="rounded-full text-xs font-semibold" style={{ width: 26, height: 26, border: `1px solid ${sub.a === i ? "var(--pine)" : "var(--line)"}`, background: sub.a === i ? "var(--green-soft)" : "transparent", color: sub.a === i ? "var(--pine)" : "var(--muted)" }}>{String.fromCharCode(65 + i)}</button>
            <input className="input" value={o} placeholder={`Option ${String.fromCharCode(65 + i)}${sub.a === i ? " (correct)" : ""}`} onChange={(e) => setSub({ ...sub, opts: sub.opts.map((x, j) => (j === i ? e.target.value : x)) })} />
          </div>
        ))}
        <textarea className="input mb-3" rows={2} placeholder="Explanation of the correct answer…" value={sub.why} onChange={(e) => setSub({ ...sub, why: e.target.value })} />
        {msg && <p className="text-sm mb-2" style={{ color: msg.startsWith("Submitted") ? "var(--pine)" : "var(--red)" }}>{msg}</p>}
        <button className="btn btn-primary" onClick={send}>Submit for review</button>
      </div>
    </div>
  );
}
