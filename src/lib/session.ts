import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const secret = () => new TextEncoder().encode(process.env.AUTH_SECRET || "dev-secret-change-me");
export type Session = { uid: string; email: string; name: string; admin: boolean };

export async function createSession(s: Session) {
  const jwt = await new SignJWT(s as any).setProtectedHeader({ alg: "HS256" }).setExpirationTime("30d").sign(secret());
  cookies().set("at_session", jwt, { httpOnly: true, secure: true, sameSite: "lax", maxAge: 30 * 86400, path: "/" });
}
export async function getSession(): Promise<Session | null> {
  const c = cookies().get("at_session")?.value;
  if (!c) return null;
  try { const { payload } = await jwtVerify(c, secret()); return payload as any; } catch { return null; }
}
export function clearSession() { cookies().set("at_session", "", { maxAge: 0, path: "/" }); }
