import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { getServiceClient } from "@/lib/supabase/admin";
import { catalogFields, uuid, ValidationError } from "@/lib/validate";
import { isSameOrigin, safeError } from "@/lib/api-guard";

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
  if (error) return NextResponse.json({ error: safeError(error) }, { status: 400 });
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
  if (!isSameOrigin(req.headers.get("host") || "", req.headers.get("origin"), req.headers.get("referer")))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  let fields: Record<string, unknown>;
  try {
    fields = catalogFields(table, await req.json());
  } catch (e) {
    const status = e instanceof ValidationError ? 422 : 400;
    return NextResponse.json({ error: safeError(e) }, { status });
  }
  const { data, error } = await getServiceClient()
    .from(table)
    .insert(fields)
    .select()
    .single();
  if (error) return NextResponse.json({ error: safeError(error) }, { status: 400 });
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
  if (!isSameOrigin(req.headers.get("host") || "", req.headers.get("origin"), req.headers.get("referer")))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  let id: string;
  let fields: Record<string, unknown>;
  try {
    const raw = await req.json();
    id = uuid(raw?.id);
    fields = catalogFields(table, raw);
    delete (fields as Record<string, unknown>).id;
  } catch (e) {
    const status = e instanceof ValidationError ? 422 : 400;
    return NextResponse.json({ error: safeError(e) }, { status });
  }
  const { data, error } = await getServiceClient()
    .from(table)
    .update(fields)
    .eq("id", id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: safeError(error) }, { status: 400 });
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
  let id: string;
  try {
    id = uuid(new URL(req.url).searchParams.get("id"));
  } catch (e) {
    return NextResponse.json({ error: safeError(e) }, { status: 422 });
  }
  const { error } = await getServiceClient().from(table).delete().eq("id", id);
  if (error) return NextResponse.json({ error: safeError(error) }, { status: 400 });
  return NextResponse.json({ ok: true });
}
