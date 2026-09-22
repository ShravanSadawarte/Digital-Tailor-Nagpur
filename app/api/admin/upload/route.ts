import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { getServiceClient } from "@/lib/supabase/admin";

// POST formData { bucket, file } → { url } (public buckets) or { path } (private)
export async function POST(req: Request) {
  const check = await isAdminRequest();
  if (!check.ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const form = await req.formData();
  const bucket = String(form.get("bucket") || "");
  const file = form.get("file") as File | null;
  if (!["product-images", "design-images"].includes(bucket) || !file)
    return NextResponse.json({ error: "Bad upload request." }, { status: 400 });

  const ext = (file.name.split(".").pop() || "jpg").slice(0, 5);
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await getServiceClient().storage.from(bucket).upload(path, file, {
    contentType: file.type || "image/jpeg",
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  const { data } = getServiceClient().storage.from(bucket).getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl, path });
}

// GET ?bucket=payment-proofs&path=… → { url } signed 1h (for viewing proofs)
export async function GET(req: Request) {
  const check = await isAdminRequest();
  if (!check.ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const q = new URL(req.url).searchParams;
  const bucket = q.get("bucket") || "";
  const path = q.get("path") || "";
  if (!bucket || !path) return NextResponse.json({ error: "Missing params." }, { status: 400 });
  const { data, error } = await getServiceClient()
    .storage.from(bucket)
    .createSignedUrl(path, 3600);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ url: data.signedUrl });
}
