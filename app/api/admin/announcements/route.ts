import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { getServiceClient } from "@/lib/supabase/admin";
import { reqStr, uuid } from "@/lib/validate";
import { isSameOrigin, safeError } from "@/lib/api-guard";

// GET — list all announcements (admin)
export async function GET() {
  const check = await isAdminRequest();
  if (!check.ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { data, error } = await getServiceClient()
    .from("announcements")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: safeError(error) }, { status: 400 });
  return NextResponse.json({ rows: data });
}

// POST { action: "create", text } | { action: "toggle", id, active } | { action: "remove", id }
export async function POST(req: Request) {
  const check = await isAdminRequest();
  if (!check.ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const svc = getServiceClient();
  const body = await req.json().catch(() => ({}));
  if (!isSameOrigin(req.headers.get("host") || "", req.headers.get("origin"), req.headers.get("referer")))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (body.action === "create") {
    let text: string;
    try {
      text = reqStr(body.text, "announcement", 280);
    } catch (e) {
      return NextResponse.json({ error: safeError(e) }, { status: 422 });
    }
    const { data, error } = await svc
      .from("announcements")
      .insert({ text, active: true })
      .select()
      .single();
    if (error) return NextResponse.json({ error: safeError(error) }, { status: 400 });
    return NextResponse.json({ row: data });
  }

  if (body.action === "toggle") {
    let id: string;
    try {
      id = uuid(body.id);
    } catch (e) {
      return NextResponse.json({ error: safeError(e) }, { status: 422 });
    }
    const { data, error } = await svc
      .from("announcements")
      .update({ active: !!body.active })
      .eq("id", id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: safeError(error) }, { status: 400 });
    return NextResponse.json({ row: data });
  }

  if (body.action === "remove") {
    let id: string;
    try {
      id = uuid(body.id);
    } catch (e) {
      return NextResponse.json({ error: safeError(e) }, { status: 422 });
    }
    const { error } = await svc.from("announcements").delete().eq("id", id);
    if (error) return NextResponse.json({ error: safeError(error) }, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
