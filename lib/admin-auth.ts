// SERVER-ONLY stealth admin gate. Admin email + passcode live in env only.
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export const ADMIN_COOKIE = "dt_admin";

export function adminCookieValue(email: string) {
  return crypto
    .createHmac("sha256", process.env.ADMIN_PASSCODE || "unset")
    .update(email)
    .digest("hex");
}

export async function getSessionEmail(): Promise<string | null> {
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    return data.user?.email ?? null;
  } catch {
    return null;
  }
}

export async function isAdminRequest(): Promise<{
  ok: boolean;
  email?: string;
}> {
  const adminEmail = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  if (!adminEmail || adminEmail.includes("example.com"))
    return { ok: false };
  const email = (await getSessionEmail())?.trim().toLowerCase();
  if (!email || email !== adminEmail) return { ok: false };
  const jar = await cookies();
  if (jar.get(ADMIN_COOKIE)?.value !== adminCookieValue(adminEmail))
    return { ok: false };
  return { ok: true, email };
}
