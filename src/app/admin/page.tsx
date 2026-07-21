// @ts-nocheck
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header, Mono, requireUser } from "@/components/ui";
import { TRACKS } from "@/lib/tracks";

const blank = { id: null, track: "arch", domain: 0, q: "", opts: ["", "", "", ""], a: 0, why: "" };

export default function Admin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [admin, setAdmin] = useState(false);
  const [tab, setTab] = useState("subs");
  const [subs, setSubs] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [edit, setEdit] = useState(null);
  const [msg, setMsg] = useState("");

  const load = async () => {
    const r = await fetch("/api/admin");
    if (r.status === 403) { router.push("/dashboard"); return; }
    const d = await r.json();
    setSubs(d.subs || []); setQuestions(d.questions || []);
  };
  useEffect(() => {
    (async () => {
      const me = await requireUser(router);
      if (!me) return;
      if (!me.admin) { router.push("/dashboard"); return; }
      setEmail(me.email); setAdmin(true);
      load();
    })();
  }, [router]);

  const act = async (body) => { setMsg(""); const r = await fetch("/api/admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); const d = await r.json(); if (!d.ok) setMsg(d.error || "Error"); await load(); };
  const T = edit ? TRACKS[edit.track] : null;

  return (
    <div><Header email={email} admin={admin} />
      <div className="display mb-3" style={{ fontSize: 22 }}>Admin</div>
      <div className="flex gap-1 mb-4">
        <button className="btn" style={{ background: tab === "subs" ? "var(--ink)" : "transparent", color: tab === "subs" ? "#fff" : "var(--muted)", border: "1px solid var(--line)" }} onClick={() => setTab("subs")}>Pending ({subs.length})</button>
        <button className="btn" style={{ background: tab === "q" ? "var(--ink)" : "transparent", color: tab === "q" ? "#fff" : "var(--muted)", border: "1px solid var(--line)" }} onClick={() => { setTab("q"); setEdit(null); }}>Question bank ({questions.length})</button>
      </div>
      {msg && <p className="text-sm mb-2" style={{ color: "var(--red)" }}>{msg}</p>}

      {tab === "subs" && (<>
        {subs.length === 0 && <div className="card"><p style={{ color: "var(--muted)" }}>No pending submissions.</p></div>}
        {subs.map((p) => (
          <div key={p.id} className="card mb-3">
            <Mono style={{ fontSize: 11, color: "var(--muted)" }}>{p.by_name} · {p.track === "arch" ? "CCA-F" : "Fundamentals"} · {TRACKS[p.track].domains[p.domain]?.code}</Mono>
            <p className="font-medium text-sm mt-1">{p.q}</p>
            <ul className="mt-2 text-sm">
              {p.opts.map((o, i) => <li key={i} style={{ color: i === p.a ? "var(--pine)" : "var(--muted)" }}>{String.fromCharCode(65 + i)}. {o}{i === p.a ? " ✓" : ""}</li>)}
            </ul>
            <p className="text-sm mt-2" style={{ color: "var(--muted)" }}>{p.why}</p>
            <div className="flex gap-2 mt-3">
              <button className="btn btn-primary" onClick={() => act({ action: "approve", id: p.id })}>Approve → live</button>
              <button className="btn btn-ghost" onClick={() => act({ action: "reject", id: p.id })}>Reject</button>
            </div>
          </div>
        ))}
      </>)}

      {tab === "q" && !edit && (<>
        <button className="btn btn-primary mb-3" onClick={() => setEdit({ ...blank })}>+ New question</button>
        {questions.length === 0 && <div className="card"><p style={{ color: "var(--muted)" }}>No custom questions yet — the 85 built-ins live in code; everything you add here goes live instantly.</p></div>}
        {questions.map((q) => (
          <div key={q.id} className="card mb-2" style={{ padding: "0.9rem", opacity: q.active ? 1 : 0.5 }}>
            <div className="flex justify-between gap-3 items-start">
              <p className="text-sm font-medium" style={{ lineHeight: 1.45 }}>{q.q}</p>
              <Mono style={{ fontSize: 10, color: "var(--muted)", whiteSpace: "nowrap" }}>{q.track === "arch" ? "CCA-F" : "Fund."} {TRACKS[q.track].domains[q.domain]?.code}</Mono>
            </div>
            <div className="flex gap-2 mt-2">
              <button className="btn btn-ghost" style={{ padding: "2px 8px", fontSize: 12 }} onClick={() => setEdit({ id: q.id, track: q.track, domain: q.domain, q: q.q, opts: [...q.opts], a: q.a, why: q.why })}>Edit</button>
              <button className="btn btn-ghost" style={{ padding: "2px 8px", fontSize: 12 }} onClick={() => act({ action: "toggle", id: q.id })}>{q.active ? "Deactivate" : "Activate"}</button>
            </div>
          </div>
        ))}
      </>)}

      {tab === "q" && edit && (
        <div className="card">
          <div className="flex gap-2 mb-3 flex-wrap">
            <select className="input" style={{ width: "auto" }} value={edit.track} onChange={(e) => setEdit({ ...edit, track: e.target.value, domain: 0 })}>
              <option value="arch">Architect (CCA-F)</option><option value="assoc">Fundamentals</option>
            </select>
            <select className="input flex-1" style={{ width: "auto" }} value={edit.domain} onChange={(e) => setEdit({ ...edit, domain: Number(e.target.value) })}>
              {T.domains.map((d, i) => <option key={d.code} value={i}>{d.code} — {d.name}</option>)}
            </select>
          </div>
          <textarea className="input mb-2" rows={2} placeholder="Question…" value={edit.q} onChange={(e) => setEdit({ ...edit, q: e.target.value })} />
          {edit.opts.map((o, i) => (
            <div key={i} className="flex gap-2 items-center mb-2">
              <button onClick={() => setEdit({ ...edit, a: i })} className="rounded-full text-xs font-semibold" style={{ width: 26, height: 26, border: `1px solid ${edit.a === i ? "var(--pine)" : "var(--line)"}`, background: edit.a === i ? "var(--green-soft)" : "transparent" }}>{String.fromCharCode(65 + i)}</button>
              <input className="input" value={o} onChange={(e) => setEdit({ ...edit, opts: edit.opts.map((x, j) => (j === i ? e.target.value : x)) })} />
            </div>
          ))}
          <textarea className="input mb-3" rows={2} placeholder="Explanation…" value={edit.why} onChange={(e) => setEdit({ ...edit, why: e.target.value })} />
          <div className="flex gap-2">
            <button className="btn btn-primary" onClick={async () => { await act({ action: edit.id ? "update" : "create", ...edit }); setEdit(null); }}>{edit.id ? "Save changes" : "Create — goes live now"}</button>
            <button className="btn btn-ghost" onClick={() => setEdit(null)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
