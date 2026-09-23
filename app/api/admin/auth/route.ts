import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  adminCookieValue,
  getSessionEmail,
  isAdminRequest,
} from "@/lib/admin-auth";
import { clientIp, isSameOrigin, rateLimit } from "@/lib/api-guard";

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
  if (!isSameOrigin(req.headers.get("host") || "", req.headers.get("origin"), req.headers.get("referer")))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

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
    // Brute-force guard on the passcode: 10 tries per 10 minutes per IP.
    if (!rateLimit(`admin-verify:${clientIp(req.headers)}`, 10, 10 * 60 * 1000))
      return NextResponse.json({ ok: false, error: "Too many attempts. Try again later." }, { status: 429 });
    if (typeof code !== "string" || code.length > 200)
      return NextResponse.json({ ok: false, error: "Wrong passcode." });
    if (code && code === process.env.ADMIN_PASSCODE) {
      const res = NextResponse.json({ ok: true });
      res.cookies.set(ADMIN_COOKIE, adminCookieValue(adminEmail), cookieOpts);
      return res;
    }
    return NextResponse.json({ ok: false, error: "Wrong passcode." });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
