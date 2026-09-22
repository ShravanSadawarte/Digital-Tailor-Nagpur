import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { getServiceClient } from "@/lib/supabase/admin";

// GET — shop settings (public QR read happens client-side via RLS; this is for admin)
export async function GET() {
  const check = await isAdminRequest();
  if (!check.ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { data, error } = await getServiceClient()
    .from("shop_settings")
    .select("*")
    .eq("id", 1)
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ settings: data });
}

// PUT { upi_id, upi_qr_url, notice }
export async function PUT(req: Request) {
  const check = await isAdminRequest();
  if (!check.ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { upi_id, upi_qr_url, notice } = await req.json();
  const { data, error } = await getServiceClient()
    .from("shop_settings")
    .update({ upi_id, upi_qr_url, notice })
    .eq("id", 1)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ settings: data });
}
