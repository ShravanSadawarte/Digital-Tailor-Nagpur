import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { getServiceClient } from "@/lib/supabase/admin";

// GET — all shop + custom orders, newest first
export async function GET() {
  const check = await isAdminRequest();
  if (!check.ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const sb = getServiceClient();
  const [shop, custom] = await Promise.all([
    sb.from("shop_orders").select("*").order("created_at", { ascending: false }),
    sb.from("custom_orders").select("*").order("created_at", { ascending: false }),
  ]);
  if (shop.error) return NextResponse.json({ error: shop.error.message }, { status: 400 });
  if (custom.error) return NextResponse.json({ error: custom.error.message }, { status: 400 });
  return NextResponse.json({ shop: shop.data, custom: custom.data });
}

// PATCH { table: "shop"|"custom", id, fields } — update status / payment
export async function PATCH(req: Request) {
  const check = await isAdminRequest();
  if (!check.ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { table, id, fields } = await req.json();
  const name = table === "custom" ? "custom_orders" : "shop_orders";
  const allowed = ["status", "payment_status"];
  const clean = Object.fromEntries(
    Object.entries(fields || {}).filter(([k]) => allowed.includes(k))
  );
  const { data, error } = await getServiceClient()
    .from(name)
    .update(clean)
    .eq("id", id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ row: data });
}
