// @ts-nocheck
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header, Mono, requireUser } from "@/components/ui";
import { TRACKS } from "@/lib/tracks";
import { GLOSSARY } from "@/lib/data/glossary";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { shuffle } from "@/lib/helpers";

function CardsInner() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [admin, setAdmin] = useState(false);
  const initialDeck = useSearchParams().get("deck") === "glossary" ? "glossary" : "arch";
  const [track, setTrack] = useState(initialDeck);
  const [deck, setDeck] = useState(null);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const isGloss = track === "glossary";
  const T = isGloss ? null : TRACKS[track];

  useEffect(() => { requireUser(router).then((me) => { if (me) { setEmail(me.email); setAdmin(me.admin); } }); }, [router]);

  const start = () => {
    const cards = isGloss
      ? GLOSSARY.map((g) => ({ title: g.t, body: g.d + " Think: " + g.a, dom: { code: "TERM", name: "Glossary" } }))
      : T.notes.map((n) => ({ ...n, dom: T.domains[n.d] }));
    setDeck(shuffle(cards)); setIdx(0); setFlipped(false);
  };
  const card = deck?.[idx];

  return (
    <div><Header email={email} admin={admin} />
      <div className="flex gap-1 mb-4">
        {[...Object.entries(TRACKS).map(([k, tr]) => [k, tr.short]), ["glossary", "Glossary terms"]].map(([k, label]) => (
          <button key={k} onClick={() => { setTrack(k); setDeck(null); }} className="btn" style={{ background: track === k ? "var(--ink)" : "transparent", color: track === k ? "#fff" : "var(--muted)", border: `1px solid ${track === k ? "var(--ink)" : "var(--line)"}` }}>{label}</button>
        ))}
      </div>
      {!deck && (
        <div className="card text-center p-8">
          <div className="display" style={{ fontSize: 24 }}>Flashcards — {isGloss ? "Glossary" : T.short}</div>
          <p className="mt-2 mb-4" style={{ color: "var(--muted)" }}>{isGloss ? GLOSSARY.length : T.notes.length} cards, shuffled. Tap to flip, swipe through in stolen minutes.</p>
          <button className="btn btn-primary" onClick={start}>Start deck</button>
        </div>
      )}
      {card && (
        <>
          <div className="flex justify-between mb-2">
            <Mono style={{ fontSize: 12, color: "var(--pine)", fontWeight: 600 }}>{card.dom.code} · {card.dom.name}</Mono>
            <Mono style={{ fontSize: 12, color: "var(--muted)" }}>{idx + 1}/{deck.length}</Mono>
          </div>
          <button onClick={() => setFlipped(!flipped)} className="card w-full text-center" style={{ minHeight: 240, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            {!flipped
              ? <span className="display" style={{ fontSize: 26 }}>{card.title}</span>
              : <span className="text-base" style={{ lineHeight: 1.6, maxWidth: 560 }}>{card.body}</span>}
          </button>
          <p className="text-center text-xs mt-2" style={{ color: "var(--muted)" }}>tap card to {flipped ? "see front" : "reveal"}</p>
          <div className="flex justify-center gap-2 mt-3">
            <button className="btn btn-ghost" onClick={() => { setIdx(Math.max(0, idx - 1)); setFlipped(false); }} disabled={idx === 0}>Back</button>
            {idx < deck.length - 1
              ? <button className="btn btn-primary" onClick={() => { setIdx(idx + 1); setFlipped(false); }}>Next card</button>
              : <button className="btn btn-mark" onClick={start}>Reshuffle</button>}
          </div>
        </>
      )}
    </div>
  );
}

export default function Cards() { return <Suspense><CardsInner /></Suspense>; }
