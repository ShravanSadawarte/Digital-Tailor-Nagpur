import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getServiceClient } from "@/lib/supabase/admin";
import { imageFile, reqOneOf, uuid, ValidationError } from "@/lib/validate";
import { isSameOrigin, safeError } from "@/lib/api-guard";

// Customer uploads UPI payment screenshot for their own order.
// POST formData { kind: "shop"|"custom", orderId, file } → { proof_url }
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return NextResponse.json({ error: "Login required." }, { status: 401 });

  const form = await req.formData();
  if (!isSameOrigin(req.headers.get("host") || "", req.headers.get("origin"), req.headers.get("referer")))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  let kind: "shop" | "custom";
  let orderId: string;
  let file: Blob;
  let ext: string;
  try {
    kind = reqOneOf(String(form.get("kind") || "shop"), "kind", ["shop", "custom"] as const);
    orderId = uuid(String(form.get("orderId") || ""));
    ({ file, ext } = imageFile(form.get("file")));
  } catch (e) {
    const status = e instanceof ValidationError ? 422 : 400;
    return NextResponse.json({ error: safeError(e) }, { status });
  }

  const table = kind === "custom" ? "custom_orders" : "shop_orders";
  const svc = getServiceClient();
  const { data: order, error: fetchErr } = await svc
    .from(table)
    .select("id,user_id")
    .eq("id", orderId)
    .single();
  if (fetchErr || !order || order.user_id !== user.id)
    return NextResponse.json({ error: "Order not found." }, { status: 404 });

  const path = `${kind}/${orderId}/${Date.now()}.${ext}`;
  const { error: upErr } = await svc.storage
    .from("payment-proofs")
    .upload(path, file, { contentType: (file as File).type || "image/jpeg" });
  if (upErr) return NextResponse.json({ error: safeError(upErr) }, { status: 400 });

  const { error: updErr } = await svc
    .from(table)
    .update({ proof_url: path, payment_status: "awaiting_verification" })
    .eq("id", orderId);
  if (updErr) return NextResponse.json({ error: safeError(updErr) }, { status: 400 });
  return NextResponse.json({ proof_url: path });
}
