// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { TRACKS } from "@/lib/tracks";

export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const { track, domain } = await req.json();
  const T = TRACKS[track];
  if (!T || domain < 0 || domain > 4) return NextResponse.json({ error: "bad request" }, { status: 400 });
  const dom = T.domains[domain];
  const examples = T.bank.filter((q) => q.d === domain).slice(0, 3).map((q) => q.q).join(" | ");

  const prompt = `Write 5 original multiple-choice practice questions for the "${T.name}" certification study track, domain "${dom.name}".
Style: realistic workplace scenarios, one clearly best answer, plausible distractors. Similar difficulty and flavor to these existing questions (do NOT copy them): ${examples}
Respond with ONLY a JSON object, no markdown fences, shaped exactly:
{"questions":[{"q":"...","opts":["...","...","...","..."],"a":0,"why":"one-sentence explanation"}]}
"a" is the index (0-3) of the correct option.`;

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY!, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: "claude-sonnet-4-5", max_tokens: 2500, messages: [{ role: "user", content: prompt }, { role: "assistant", content: "{" }] }),
    });
    const data = await r.json();
    const text = "{" + ((data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("") || "");
    const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
    const qs = (parsed.questions || [])
      .filter((q) => q?.q && Array.isArray(q.opts) && q.opts.length === 4 && q.a >= 0 && q.a <= 3 && q.why)
      .slice(0, 5)
      .map((q, i) => ({ id: `ai_${Date.now()}_${i}`, d: domain, q: String(q.q), opts: q.opts.map(String), a: Number(q.a), why: String(q.why), ai: true }));
    if (!qs.length) return NextResponse.json({ error: "Generation came back malformed — try again." }, { status: 502 });
    return NextResponse.json({ questions: qs });
  } catch {
    return NextResponse.json({ error: "Could not generate questions — try again." }, { status: 500 });
  }
}
