import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { getServiceClient } from "@/lib/supabase/admin";

const TABLES: Record<string, string> = {
  products: "products",
  materials: "materials",
  examples: "transformation_examples",
  categories: "categories",
  offers: "offers",
};

// GET /api/admin/catalog/[resource] — list newest first
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ resource: string }> }
) {
  const check = await isAdminRequest();
  if (!check.ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const table = TABLES[(await params).resource];
  if (!table) return NextResponse.json({ error: "Unknown resource" }, { status: 404 });
  const { data, error } = await getServiceClient()
    .from(table)
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ rows: data });
}

// POST — create row (body = fields)
export async function POST(
  req: Request,
  { params }: { params: Promise<{ resource: string }> }
) {
  const check = await isAdminRequest();
  if (!check.ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const table = TABLES[(await params).resource];
  if (!table) return NextResponse.json({ error: "Unknown resource" }, { status: 404 });
  const body = await req.json();
  const { data, error } = await getServiceClient()
    .from(table)
    .insert(body)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ row: data });
}

// PATCH { id, ...fields } — update row
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ resource: string }> }
) {
  const check = await isAdminRequest();
  if (!check.ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const table = TABLES[(await params).resource];
  if (!table) return NextResponse.json({ error: "Unknown resource" }, { status: 404 });
  const { id, ...fields } = await req.json();
  const { data, error } = await getServiceClient()
    .from(table)
    .update(fields)
    .eq("id", id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ row: data });
}

// DELETE ?id= — delete row
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ resource: string }> }
) {
  const check = await isAdminRequest();
  if (!check.ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const table = TABLES[(await params).resource];
  if (!table) return NextResponse.json({ error: "Unknown resource" }, { status: 404 });
  const id = new URL(req.url).searchParams.get("id");
  const { error } = await getServiceClient().from(table).delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
