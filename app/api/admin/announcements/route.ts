import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { getServiceClient } from "@/lib/supabase/admin";

// GET — list all announcements (admin)
export async function GET() {
  const check = await isAdminRequest();
  if (!check.ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { data, error } = await getServiceClient()
    .from("announcements")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ rows: data });
}

// POST { action: "create", text } | { action: "toggle", id, active } | { action: "remove", id }
export async function POST(req: Request) {
  const check = await isAdminRequest();
  if (!check.ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const svc = getServiceClient();
  const body = await req.json().catch(() => ({}));

  if (body.action === "create") {
    const text = String(body.text || "").trim();
    if (!text) return NextResponse.json({ error: "Text required." }, { status: 400 });
    const { data, error } = await svc
      .from("announcements")
      .insert({ text, active: true })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ row: data });
  }

  if (body.action === "toggle") {
    if (!body.id) return NextResponse.json({ error: "Bad request." }, { status: 400 });
    const { data, error } = await svc
      .from("announcements")
      .update({ active: !!body.active })
      .eq("id", body.id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ row: data });
  }

  if (body.action === "remove") {
    if (!body.id) return NextResponse.json({ error: "Bad request." }, { status: 400 });
    const { error } = await svc.from("announcements").delete().eq("id", body.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
