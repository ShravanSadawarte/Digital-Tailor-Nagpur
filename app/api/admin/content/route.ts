import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { getServiceClient } from "@/lib/supabase/admin";
import { reqOneOf, ValidationError } from "@/lib/validate";
import { isSameOrigin, safeError } from "@/lib/api-guard";

const KEYS = ["hero", "services", "sections"] as const;

// GET — all content rows { key: value }
export async function GET() {
  const check = await isAdminRequest();
  if (!check.ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { data, error } = await getServiceClient().from("site_content").select("*");
  if (error) return NextResponse.json({ error: safeError(error) }, { status: 400 });
  return NextResponse.json({ rows: data });
}

// PUT { key, value } — upsert one content block
export async function PUT(req: Request) {
  const check = await isAdminRequest();
  if (!check.ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { key, value } = await req.json().catch(() => ({}));
  if (!isSameOrigin(req.headers.get("host") || "", req.headers.get("origin"), req.headers.get("referer")))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    reqOneOf(key, "content block", KEYS);
    if (!value || typeof value !== "object" || Array.isArray(value))
      throw new ValidationError("Invalid content.");
    if (JSON.stringify(value).length > 20000)
      throw new ValidationError("Content too large.");
  } catch (e) {
    const status = e instanceof ValidationError ? 422 : 400;
    return NextResponse.json({ error: safeError(e) }, { status });
  }
  const { error } = await getServiceClient()
    .from("site_content")
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });
  if (error) return NextResponse.json({ error: safeError(error) }, { status: 400 });
  return NextResponse.json({ ok: true });
}
