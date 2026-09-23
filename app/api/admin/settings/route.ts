import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { getServiceClient } from "@/lib/supabase/admin";
import { str, httpUrl, ValidationError } from "@/lib/validate";
import { isSameOrigin, safeError } from "@/lib/api-guard";

// GET — shop settings (public QR read happens client-side via RLS; this is for admin)
export async function GET() {
  const check = await isAdminRequest();
  if (!check.ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { data, error } = await getServiceClient()
    .from("shop_settings")
    .select("*")
    .eq("id", 1)
    .single();
  if (error) return NextResponse.json({ error: safeError(error) }, { status: 400 });
  return NextResponse.json({ settings: data });
}

// PUT { upi_id, upi_qr_url, notice }
export async function PUT(req: Request) {
  const check = await isAdminRequest();
  if (!check.ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!isSameOrigin(req.headers.get("host") || "", req.headers.get("origin"), req.headers.get("referer")))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  let patch: { upi_id: string | null; upi_qr_url: string | null; notice: string | null };
  try {
    const body = await req.json();
    patch = {
      upi_id: str(body?.upi_id, "UPI ID", 60),
      upi_qr_url: httpUrl(body?.upi_qr_url, "QR URL"),
      notice: str(body?.notice, "notice", 500),
    };
  } catch (e) {
    const status = e instanceof ValidationError ? 422 : 400;
    return NextResponse.json({ error: safeError(e) }, { status });
  }
  const { data, error } = await getServiceClient()
    .from("shop_settings")
    .update(patch)
    .eq("id", 1)
    .select()
    .single();
  if (error) return NextResponse.json({ error: safeError(error) }, { status: 400 });
  return NextResponse.json({ settings: data });
}
