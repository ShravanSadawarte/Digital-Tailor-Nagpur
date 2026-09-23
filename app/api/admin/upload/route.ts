import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { getServiceClient } from "@/lib/supabase/admin";
import { imageFile, ValidationError } from "@/lib/validate";
import { isSameOrigin, safeError } from "@/lib/api-guard";

// POST formData { bucket, file } → { url } (public buckets) or { path } (private)
export async function POST(req: Request) {
  const check = await isAdminRequest();
  if (!check.ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const form = await req.formData();
  const bucket = String(form.get("bucket") || "");
  if (!isSameOrigin(req.headers.get("host") || "", req.headers.get("origin"), req.headers.get("referer")))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  let file: Blob;
  let ext: string;
  try {
    if (!["product-images", "design-images"].includes(bucket))
      throw new ValidationError("Bad upload request.");
    ({ file, ext } = imageFile(form.get("file")));
  } catch (e) {
    const status = e instanceof ValidationError ? 422 : 400;
    return NextResponse.json({ error: safeError(e) }, { status });
  }

  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await getServiceClient().storage.from(bucket).upload(path, file, {
    contentType: (file as File).type || "image/jpeg",
  });
  if (error) return NextResponse.json({ error: safeError(error) }, { status: 400 });
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
  if (
    !["product-images", "design-images", "payment-proofs"].includes(bucket) ||
    !/^[A-Za-z0-9/_\-.]{1,256}$/.test(path) ||
    path.includes("..")
  )
    return NextResponse.json({ error: "Missing params." }, { status: 400 });
  const { data, error } = await getServiceClient()
    .storage.from(bucket)
    .createSignedUrl(path, 3600);
  if (error) return NextResponse.json({ error: safeError(error) }, { status: 400 });
  return NextResponse.json({ url: data.signedUrl });
}
