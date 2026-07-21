// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { sql } from "@/lib/db";
import { createSession, clearSession } from "@/lib/session";

export async function POST(req: NextRequest, { params }: { params: { action: string } }) {
  const body = await req.json().catch(() => ({}));
  const email = String(body.email || "").trim().toLowerCase();

  try {
    if (params.action === "signup") {
      const { pw, name, invite } = body;
      if (!email.includes("@") || !pw || pw.length < 8 || !String(name || "").trim())
        return NextResponse.json({ error: "Valid email, a display name, and a password of 8+ characters are required." }, { status: 400 });
      const allowed = (process.env.ALLOWED_EMAIL_DOMAINS || "").split(",").map((d) => d.trim().toLowerCase()).filter(Boolean);
      if (allowed.length && !allowed.some((d) => email.endsWith("@" + d) || email.endsWith("." + d)))
        return NextResponse.json({ error: "Sign-ups are limited to approved email domains. Ask the admin for access." }, { status: 403 });
      if (process.env.INVITE_CODE && String(invite || "").trim() !== process.env.INVITE_CODE)
        return NextResponse.json({ error: "An invite code is required to sign up — ask the admin." }, { status: 403 });
      const exists = await sql`select 1 from users where email = ${email}`;
      if (exists.length) return NextResponse.json({ error: "That email already has an account — sign in instead." }, { status: 409 });
      const hash = await bcrypt.hash(pw, 10);
      const rows = await sql`insert into users (email, name, pw_hash) values (${email}, ${String(name).trim()}, ${hash}) returning id, is_admin`;
      await createSession({ uid: rows[0].id, email, name: String(name).trim(), admin: rows[0].is_admin });
      return NextResponse.json({ ok: true });
    }

    if (params.action === "login") {
      const rows = await sql`select id, name, pw_hash, is_admin from users where email = ${email}`;
      if (!rows.length || !(await bcrypt.compare(String(body.pw || ""), rows[0].pw_hash)))
        return NextResponse.json({ error: "Wrong email or password." }, { status: 401 });
      await createSession({ uid: rows[0].id, email, name: rows[0].name, admin: rows[0].is_admin });
      return NextResponse.json({ ok: true });
    }

    if (params.action === "logout") { clearSession(); return NextResponse.json({ ok: true }); }

    if (params.action === "forgot") {
      const rows = await sql`select id from users where email = ${email}`;
      // Always answer the same way, so the endpoint can't be used to probe which emails exist.
      if (rows.length && process.env.RESEND_API_KEY) {
        const token = crypto.randomBytes(24).toString("hex");
        await sql`update users set reset_token = ${token}, reset_expires = now() + interval '1 hour' where id = ${rows[0].id}`;
        const link = `https://anthrotest.com/login?reset=${token}`;
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { "content-type": "application/json", authorization: `Bearer ${process.env.RESEND_API_KEY}` },
          body: JSON.stringify({ from: process.env.REPORT_FROM || "AnthroTest <reports@anthrotest.com>", to: email, subject: "Reset your AnthroTest password", html: `<p>Reset link (valid 1 hour): <a href="${link}">${link}</a></p><p>If you didn't request this, ignore it.</p>` }),
        });
      }
      return NextResponse.json({ ok: true, note: process.env.RESEND_API_KEY ? "If that email has an account, a reset link was sent." : "Email is not configured yet — ask the admin to reset your password." });
    }

    if (params.action === "reset") {
      const { token, pw } = body;
      if (!token || !pw || pw.length < 8) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
      const rows = await sql`select id, email, name, is_admin from users where reset_token = ${token} and reset_expires > now()`;
      if (!rows.length) return NextResponse.json({ error: "Reset link is invalid or expired." }, { status: 400 });
      const hash = await bcrypt.hash(pw, 10);
      await sql`update users set pw_hash = ${hash}, reset_token = null, reset_expires = null where id = ${rows[0].id}`;
      await createSession({ uid: rows[0].id, email: rows[0].email, name: rows[0].name, admin: rows[0].is_admin });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unknown action." }, { status: 404 });
  } catch (e) {
    return NextResponse.json({ error: "Server error — try again." }, { status: 500 });
  }
}
