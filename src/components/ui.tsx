// @ts-nocheck
"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export const Mono = ({ children, style = {} }) => <span className="mono" style={style}>{children}</span>;

export function WeightSpine({ domains, per, height = 44 }) {
  return (
    <div>
      <div className="flex w-full rounded-md overflow-hidden" style={{ height, border: "1px solid var(--line)" }}>
        {domains.map((dom, i) => {
          const s = per?.[i];
          const acc = s && s.t > 0 ? s.c / s.t : null;
          return (
            <div key={dom.code} className="relative" style={{ width: `${dom.weight}%`, background: "var(--card)", borderRight: i < domains.length - 1 ? "1px solid var(--line)" : "none" }} title={`${dom.name} — ${dom.weight}%`}>
              <div className="absolute bottom-0 left-0 w-full" style={{ height: `${acc !== null ? Math.round(acc * 100) : 0}%`, background: acc === null ? "transparent" : acc >= 0.7 ? "var(--pine)" : "var(--mark)", transition: "height .5s" }} />
              <div className="absolute top-1 left-0 w-full text-center"><Mono style={{ fontSize: 10, color: "var(--muted)" }}>{dom.code}</Mono></div>
            </div>
          );
        })}
      </div>
      <div className="flex w-full mt-1">
        {domains.map((dom) => <div key={dom.code} className="text-center" style={{ width: `${dom.weight}%` }}><Mono style={{ fontSize: 10, color: "var(--muted)" }}>{dom.weight}%</Mono></div>)}
      </div>
    </div>
  );
}

export function Header({ email, admin }) {
  const path = usePathname();
  const router = useRouter();
  const tabs = [["/dashboard", "Home"], ["/study", "Study"], ["/cards", "Cards"], ["/practice", "Drill"], ["/exam", "Exam"], ["/notebook", "Notebook"], ["/labs", "Labs"], ["/tutor", "Tutor"], ["/board", "Board"]];
  if (admin) tabs.push(["/admin", "Admin"]);
  return (
    <div className="mb-6 pb-4" style={{ borderBottom: "2px solid var(--ink)" }}>
      <div className="flex items-center justify-between">
        <Link href="/dashboard" className="no-underline" style={{ color: "var(--ink)" }}>
          <div className="display" style={{ fontSize: 22, lineHeight: 1.1 }}>AnthroTest</div>
          <Mono style={{ fontSize: 11, color: "var(--muted)" }}>Claude cert study room</Mono>
        </Link>
        <div className="flex items-center gap-2">
          {email && <Mono style={{ fontSize: 11, color: "var(--muted)" }}>{email}</Mono>}
          <button className="btn btn-ghost" style={{ fontSize: 12, padding: "2px 8px" }} onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); router.push("/login"); }}>Sign out</button>
        </div>
      </div>
      <div className="flex gap-1 mt-3 flex-wrap">
        {tabs.map(([href, label]) => (
          <Link key={href} href={href} className="btn no-underline" style={{ background: path === href ? "var(--mark-soft)" : "transparent", border: `1px solid ${path === href ? "var(--mark-line)" : "var(--line)"}`, color: "var(--ink)", padding: "3px 10px" }}>{label}</Link>
        ))}
      </div>
    </div>
  );
}

export async function requireUser(router) {
  const r = await fetch("/api/me");
  if (r.status === 401) { router.push("/login"); return null; }
  return r.json();
}
