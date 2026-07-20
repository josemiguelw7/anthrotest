import { NextRequest, NextResponse } from "next/server";

const SYS =
  "You are a friendly, concise exam-prep tutor for Anthropic Claude certifications (Claude API, agents, MCP, Claude Code, prompt engineering, context management). Explain clearly with small concrete examples. Keep answers under ~180 words unless asked for depth. If a question is outside cert-prep topics, gently steer back.";

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();
    if (!Array.isArray(messages) || messages.length === 0 || messages.length > 20)
      return NextResponse.json({ text: "Invalid request." }, { status: 400 });
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 1000,
        system: SYS,
        messages: messages.map((m: any) => ({ role: m.role === "assistant" ? "assistant" : "user", content: String(m.content).slice(0, 4000) })),
      }),
    });
    const data = await r.json();
    const text = (data.content || []).filter((b: any) => b.type === "text").map((b: any) => b.text).join("\n") || "No response — try again.";
    return NextResponse.json({ text });
  } catch {
    return NextResponse.json({ text: "Tutor error — try again." }, { status: 500 });
  }
}
