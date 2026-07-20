// @ts-nocheck
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header, Mono, requireUser } from "@/components/ui";

export default function TutorPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [msgs, setMsgs] = useState([]); const [input, setInput] = useState(""); const [busy, setBusy] = useState(false);
  useEffect(() => { requireUser(router).then((me) => { if (me) setEmail(me.email); }); }, [router]);
  const send = async () => {
    if (!input.trim() || busy) return;
    const next = [...msgs, { role: "user", content: input.trim() }];
    setMsgs(next); setInput(""); setBusy(true);
    try {
      const r = await fetch("/api/tutor", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: next.slice(-12) }) });
      const { text } = await r.json();
      setMsgs([...next, { role: "assistant", content: text }]);
    } catch { setMsgs([...next, { role: "assistant", content: "Tutor unavailable — try again." }]); }
    setBusy(false);
  };
  return (
    <div><Header email={email} />
      <div className="display mb-1" style={{ fontSize: 22 }}>AI tutor</div>
      <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>Ask anything about agents, MCP, Claude Code, prompting, caching…</p>
      <div className="card mb-3" style={{ minHeight: 260 }}>
        {msgs.length === 0 && <p className="text-sm" style={{ color: "var(--muted)" }}>Try: &ldquo;Quiz me on MCP transports&rdquo; or &ldquo;Explain prompt caching with a conference-room analogy.&rdquo;</p>}
        {msgs.map((m, i) => (
          <div key={i} className="mb-3">
            <Mono style={{ fontSize: 10, color: m.role === "user" ? "var(--muted)" : "var(--blue)", fontWeight: 600 }}>{m.role === "user" ? "YOU" : "TUTOR"}</Mono>
            <p className="text-sm mt-0.5" style={{ whiteSpace: "pre-wrap", lineHeight: 1.55 }}>{m.content}</p>
          </div>
        ))}
        {busy && <p className="text-sm" style={{ color: "var(--muted)" }}>Thinking…</p>}
      </div>
      <div className="flex gap-2">
        <input className="input" style={{ background: "var(--card)" }} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Ask the tutor…" />
        <button className="btn btn-blue" onClick={send} disabled={busy}>Send</button>
      </div>
    </div>
  );
}
