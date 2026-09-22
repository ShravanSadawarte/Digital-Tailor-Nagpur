import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  adminCookieValue,
  getSessionEmail,
  isAdminRequest,
} from "@/lib/admin-auth";

const cookieOpts = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 7,
  secure: process.env.NODE_ENV === "production",
};

// GET → { isAdmin, email }
export async function GET() {
  const check = await isAdminRequest();
  return NextResponse.json({ isAdmin: check.ok, email: check.email ?? null });
}

// POST { action: "challenge" } → { adminRequired } (email stays server-side)
// POST { action: "verify", code } → sets admin cookie
// POST { action: "logout" } → clears admin cookie
export async function POST(req: Request) {
  const { action, code } = await req.json().catch(() => ({}));
  const adminEmail = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();

  if (action === "logout") {
    const res = NextResponse.json({ ok: true });
    res.cookies.set(ADMIN_COOKIE, "", { ...cookieOpts, maxAge: 0 });
    return res;
  }

  if (!adminEmail || adminEmail.includes("example.com"))
    return NextResponse.json({ adminRequired: false });

  const email = (await getSessionEmail())?.trim().toLowerCase();
  if (!email || email !== adminEmail)
    return NextResponse.json({ adminRequired: false });

  if (action === "challenge") {
    const check = await isAdminRequest();
    return NextResponse.json({ adminRequired: !check.ok });
  }

  if (action === "verify") {
    if (code && code === process.env.ADMIN_PASSCODE) {
      const res = NextResponse.json({ ok: true });
      res.cookies.set(ADMIN_COOKIE, adminCookieValue(adminEmail), cookieOpts);
      return res;
    }
    return NextResponse.json({ ok: false, error: "Wrong passcode." });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
