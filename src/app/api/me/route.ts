import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  return NextResponse.json({ email: s.email, name: s.name, admin: s.admin });
}
