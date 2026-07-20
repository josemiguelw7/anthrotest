// @ts-nocheck
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Login() {
  const router = useRouter();
  const [mode, setMode] = useState("in"); // in | up | reset
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [name, setName] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const go = async () => {
    setBusy(true); setMsg("");
    try {
      if (mode === "reset") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${location.origin}/login` });
        setMsg(error ? error.message : "Check your email for a reset link.");
      } else if (mode === "up") {
        if (!name.trim()) { setMsg("Add a display name for the team board."); setBusy(false); return; }
        const { data, error } = await supabase.auth.signUp({ email, password: pw });
        if (error) setMsg(error.message);
        else if (data.user) {
          await supabase.from("profiles").upsert({ id: data.user.id, name: name.trim() });
          if (data.session) router.push("/dashboard");
          else setMsg("Account created — check your email to confirm, then sign in.");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
        if (error) setMsg(error.message); else router.push("/dashboard");
      }
    } catch (e) { setMsg("Something went wrong — try again."); }
    setBusy(false);
  };

  return (
    <div className="max-w-sm mx-auto mt-16">
      <div className="display" style={{ fontSize: 30 }}>AnthroTest</div>
      <p className="mt-1 mb-5" style={{ color: "var(--muted)" }}>
        {mode === "up" ? "Create your account." : mode === "reset" ? "Reset your password." : "Welcome back."}
      </p>
      <div className="card">
        {mode === "up" && (<><label className="block text-sm font-medium mb-1">Display name</label>
          <input className="input mb-3" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jose S." /></>)}
        <label className="block text-sm font-medium mb-1">Email</label>
        <input className="input mb-3" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
        {mode !== "reset" && (<><label className="block text-sm font-medium mb-1">Password</label>
          <input className="input mb-3" type="password" value={pw} onChange={(e) => setPw(e.target.value)} onKeyDown={(e) => e.key === "Enter" && go()} placeholder="••••••••" /></>)}
        {msg && <p className="text-sm mb-2" style={{ color: msg.includes("Check") || msg.includes("created") ? "var(--pine)" : "var(--red)" }}>{msg}</p>}
        <button className="btn btn-primary w-full" style={{ padding: "10px" }} onClick={go} disabled={busy}>
          {busy ? "…" : mode === "up" ? "Create account" : mode === "reset" ? "Send reset link" : "Sign in"}
        </button>
        <div className="flex justify-between mt-3 text-sm">
          <button className="underline" style={{ color: "var(--muted)" }} onClick={() => { setMode(mode === "up" ? "in" : "up"); setMsg(""); }}>
            {mode === "up" ? "Have an account? Sign in" : "New? Create account"}
          </button>
          {mode === "in" && <button className="underline" style={{ color: "var(--muted)" }} onClick={() => { setMode("reset"); setMsg(""); }}>Forgot password?</button>}
        </div>
      </div>
    </div>
  );
}
