import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { getServiceClient } from "@/lib/supabase/admin";
import { reqOneOf, uuid, ValidationError } from "@/lib/validate";
import { isSameOrigin, safeError } from "@/lib/api-guard";

// GET — all shop + custom orders, newest first
export async function GET() {
  const check = await isAdminRequest();
  if (!check.ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const sb = getServiceClient();
  const [shop, custom] = await Promise.all([
    sb.from("shop_orders").select("*").order("created_at", { ascending: false }),
    sb.from("custom_orders").select("*").order("created_at", { ascending: false }),
  ]);
  if (shop.error) return NextResponse.json({ error: safeError(shop.error) }, { status: 400 });
  if (custom.error) return NextResponse.json({ error: safeError(custom.error) }, { status: 400 });
  return NextResponse.json({ shop: shop.data, custom: custom.data });
}

// PATCH { table: "shop"|"custom", id, fields } — update status / payment
export async function PATCH(req: Request) {
  const check = await isAdminRequest();
  if (!check.ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!isSameOrigin(req.headers.get("host") || "", req.headers.get("origin"), req.headers.get("referer")))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const STATUS = ["pending", "confirmed", "stitching", "ready", "delivered", "cancelled"] as const;
  const PAY = ["pending", "awaiting_verification", "verified", "rejected", "paid_on_pickup", "done"] as const;
  let name: string;
  let id: string;
  let clean: Record<string, string>;
  try {
    const { table, id: rawId, fields } = await req.json();
    name = table === "custom" ? "custom_orders" : "shop_orders";
    if (table !== undefined && table !== "shop" && table !== "custom")
      throw new ValidationError("Invalid table.");
    id = uuid(rawId);
    clean = {};
    const f = (fields || {}) as Record<string, unknown>;
    if (f.status !== undefined) clean.status = reqOneOf(f.status, "status", STATUS);
    if (f.payment_status !== undefined) clean.payment_status = reqOneOf(f.payment_status, "payment status", PAY);
    if (Object.keys(clean).length === 0) throw new ValidationError("Nothing to update.");
  } catch (e) {
    const status = e instanceof ValidationError ? 422 : 400;
    return NextResponse.json({ error: safeError(e) }, { status });
  }
  const { data, error } = await getServiceClient()
    .from(name)
    .update(clean)
    .eq("id", id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: safeError(error) }, { status: 400 });
  return NextResponse.json({ row: data });
}
