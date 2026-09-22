import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getServiceClient } from "@/lib/supabase/admin";

// Customer uploads UPI payment screenshot for their own order.
// POST formData { kind: "shop"|"custom", orderId, file } → { proof_url }
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return NextResponse.json({ error: "Login required." }, { status: 401 });

  const form = await req.formData();
  const kind = String(form.get("kind") || "shop");
  const orderId = String(form.get("orderId") || "");
  const file = form.get("file") as File | null;
  if (!file || !orderId || !["shop", "custom"].includes(kind))
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  if (file.size > 5 * 1024 * 1024)
    return NextResponse.json({ error: "Image must be under 5MB." }, { status: 400 });

  const table = kind === "custom" ? "custom_orders" : "shop_orders";
  const svc = getServiceClient();
  const { data: order, error: fetchErr } = await svc
    .from(table)
    .select("id,user_id")
    .eq("id", orderId)
    .single();
  if (fetchErr || !order || order.user_id !== user.id)
    return NextResponse.json({ error: "Order not found." }, { status: 404 });

  const ext = (file.name.split(".").pop() || "jpg").slice(0, 5);
  const path = `${kind}/${orderId}/${Date.now()}.${ext}`;
  const { error: upErr } = await svc.storage
    .from("payment-proofs")
    .upload(path, file, { contentType: file.type || "image/jpeg" });
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 400 });

  const { error: updErr } = await svc
    .from(table)
    .update({ proof_url: path, payment_status: "awaiting_verification" })
    .eq("id", orderId);
  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 400 });
  return NextResponse.json({ proof_url: path });
}
