// @ts-nocheck
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header, Mono, requireUser } from "@/components/ui";
import { useBanks } from "@/lib/useBanks";
import { findQ } from "@/lib/tracks";

export default function Notebook() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [admin, setAdmin] = useState(false);
  const [rows, setRows] = useState(null);
  const banks = useBanks();

  useEffect(() => {
    (async () => {
      const me = await requireUser(router);
      if (!me) return;
      setEmail(me.email); setAdmin(me.admin);
      const r = await fetch("/api/notebook");
      setRows((await r.json()).rows || []);
    })();
  }, [router]);

  const items = rows && banks ? rows.map((r) => ({ ...r, q: findQ(banks, r.qid) })).filter((r) => r.q) : null;
  return (
    <div><Header email={email} admin={admin} />
      <div className="display mb-1" style={{ fontSize: 22 }}>Wrong-answer notebook</div>
      <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>Every question you have missed, worst first. Grind this before exam day.</p>
      {!items && <p style={{ color: "var(--muted)" }}>Loading…</p>}
      {items && items.length === 0 && <div className="card"><p style={{ color: "var(--muted)" }}>Nothing here — miss a question and it lands in your notebook.</p></div>}
      {items && items.length > 0 && (<>
        <button className="btn btn-primary mb-3" onClick={() => router.push("/practice?mode=notebook")}>Drill my notebook ({items.length})</button>
        {items.map((r) => (
          <div key={r.qid} className="card mb-2" style={{ padding: "1rem" }}>
            <div className="flex justify-between gap-3">
              <p className="text-sm font-medium" style={{ lineHeight: 1.5 }}>{r.q.q}</p>
              <Mono style={{ fontSize: 11, color: "var(--red)", whiteSpace: "nowrap" }}>×{r.misses}</Mono>
            </div>
            <p className="text-sm mt-1" style={{ color: "var(--pine)" }}>Answer: {r.q.opts[r.q.a]}</p>
          </div>
        ))}
      </>)}
    </div>
  );
}
