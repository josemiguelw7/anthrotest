// @ts-nocheck
"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginInner() {
  const router = useRouter();
  const resetToken = useSearchParams().get("reset");
  const [mode, setMode] = useState(resetToken ? "reset" : "in"); // in | up | forgot | reset
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [name, setName] = useState("");
  const [invite, setInvite] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const post = async (action, body) => {
    const r = await fetch(`/api/auth/${action}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    return r.json();
  };

  const go = async () => {
    setBusy(true); setMsg("");
    try {
      if (mode === "forgot") { const d = await post("forgot", { email }); setMsg(d.note || d.error || "Done."); }
      else if (mode === "reset") { const d = await post("reset", { token: resetToken, pw }); if (d.ok) router.push("/dashboard"); else setMsg(d.error); }
      else if (mode === "up") { const d = await post("signup", { email, pw, name, invite }); if (d.ok) router.push("/dashboard"); else setMsg(d.error); }
      else { const d = await post("login", { email, pw }); if (d.ok) router.push("/dashboard"); else setMsg(d.error); }
    } catch { setMsg("Something went wrong — try again."); }
    setBusy(false);
  };

  return (
    <div className="max-w-sm mx-auto mt-16">
      <div className="display" style={{ fontSize: 30 }}>AnthroTest</div>
      <p className="mt-1 mb-5" style={{ color: "var(--muted)" }}>
        {mode === "up" ? "Create your account." : mode === "forgot" ? "Request a password reset." : mode === "reset" ? "Choose a new password." : "Welcome back."}
      </p>
      <div className="card">
        {mode === "up" && (<><label className="block text-sm font-medium mb-1">Display name</label>
          <input className="input mb-3" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jose S." />
          <label className="block text-sm font-medium mb-1">Invite code <span style={{ color: "var(--muted)", fontWeight: 400 }}>(only if the admin set one)</span></label>
          <input className="input mb-3" value={invite} onChange={(e) => setInvite(e.target.value)} placeholder="" /></>)}
        {mode !== "reset" && (<><label className="block text-sm font-medium mb-1">Email</label>
          <input className="input mb-3" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" /></>)}
        {mode !== "forgot" && (<><label className="block text-sm font-medium mb-1">{mode === "reset" ? "New password" : "Password"} <span style={{ color: "var(--muted)", fontWeight: 400 }}>(8+ characters)</span></label>
          <input className="input mb-3" type="password" value={pw} onChange={(e) => setPw(e.target.value)} onKeyDown={(e) => e.key === "Enter" && go()} placeholder="••••••••" /></>)}
        {msg && <p className="text-sm mb-2" style={{ color: msg.toLowerCase().includes("sent") || msg.toLowerCase().includes("done") ? "var(--pine)" : "var(--red)" }}>{msg}</p>}
        <button className="btn btn-primary w-full" style={{ padding: "10px" }} onClick={go} disabled={busy}>
          {busy ? "…" : mode === "up" ? "Create account" : mode === "forgot" ? "Send reset link" : mode === "reset" ? "Set password" : "Sign in"}
        </button>
        {mode !== "reset" && (
          <div className="flex justify-between mt-3 text-sm">
            <button className="underline" style={{ color: "var(--muted)" }} onClick={() => { setMode(mode === "up" ? "in" : "up"); setMsg(""); }}>
              {mode === "up" ? "Have an account? Sign in" : "New? Create account"}
            </button>
            {mode === "in" && <button className="underline" style={{ color: "var(--muted)" }} onClick={() => { setMode("forgot"); setMsg(""); }}>Forgot password?</button>}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Login() { return <Suspense><LoginInner /></Suspense>; }
