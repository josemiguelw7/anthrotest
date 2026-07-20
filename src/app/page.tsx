import Link from "next/link";

export default function Landing() {
  return (
    <div className="mt-16 max-w-lg">
      <div className="display" style={{ fontSize: 40, lineHeight: 1.1 }}>AnthroTest</div>
      <p className="mt-3" style={{ color: "var(--muted)", fontSize: 17, lineHeight: 1.6 }}>
        A study room for Claude certifications: original practice questions, blueprint-weighted mock exams,
        condensed study notes with audio, spaced repetition, and an AI tutor that explains every miss.
      </p>
      <div className="mt-6 flex gap-2">
        <Link href="/login" className="btn btn-primary no-underline" style={{ padding: "10px 20px", fontSize: 16 }}>Sign in / create account</Link>
      </div>
      <p className="mt-8 text-sm" style={{ color: "var(--muted)" }}>
        Two tracks: <b>Architect Foundations (CCA-F)</b> for builders, and an <b>Entry-Level Fundamentals</b> on-ramp
        for everyone else.
      </p>
    </div>
  );
}
