/**
 * Tiny dependency-free validators for API routes.
 * Every validator returns the cleaned value or throws ValidationError.
 * Keep limits generous — the goal is rejecting malformed/malicious input,
 * not policing legitimate admin content.
 */

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

const fail = (what: string): never => {
  throw new ValidationError(`Invalid ${what}.`);
};

export function str(v: unknown, what: string, max = 500): string | null {
  if (v === undefined || v === null || v === "") return null;
  if (typeof v !== "string") fail(what);
  const s = (v as string).trim();
  if (s.length > max) fail(what);
  return s;
}

export function reqStr(v: unknown, what: string, max = 500): string {
  const s = str(v, what, max);
  if (!s) throw new ValidationError(`Invalid ${what}.`);
  return s;
}

export function num(v: unknown, what: string, min = 0, max = 10000000): number | null {
  if (v === undefined || v === null || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n) || n < min || n > max) fail(what);
  return Math.round(n);
}

export function bool(v: unknown): boolean | null {
  if (v === undefined || v === null) return null;
  return v === true || v === "true" || v === 1;
}

export function oneOf<T extends string>(v: unknown, what: string, allowed: readonly T[]): T | null {
  if (v === undefined || v === null || v === "") return null;
  if (typeof v !== "string" || !(allowed as readonly string[]).includes(v)) fail(what);
  return v as T;
}

export function reqOneOf<T extends string>(v: unknown, what: string, allowed: readonly T[]): T {
  const r = oneOf(v, what, allowed);
  if (!r) throw new ValidationError(`Invalid ${what}.`);
  return r;
}

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function uuid(v: unknown, what = "id"): string {
  if (typeof v !== "string") fail(what);
  const s = (v as string).trim();
  if (!UUID.test(s)) fail(what);
  return s;
}

export function strArr(v: unknown, what: string, maxItems = 20, maxLen = 200): string[] | null {
  if (v === undefined || v === null) return null;
  if (!Array.isArray(v) || v.length > maxItems) fail(what);
  return (v as unknown[]).map((s) => {
    if (typeof s !== "string" || s.length > maxLen) fail(what);
    return (s as string).trim();
  });
}

export function httpUrl(v: unknown, what: string): string | null {
  const s = str(v, what, 2000);
  if (!s) return null;
  let u: URL;
  try {
    u = new URL(s);
  } catch {
    fail(what);
  }
  if (u!.protocol !== "https:" && u!.protocol !== "http:") fail(what);
  return u!.toString();
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export function email(v: unknown, what = "email"): string {
  const s = reqStr(v, what, 254).toLowerCase();
  if (!EMAIL.test(s)) fail(what);
  return s;
}

/**
 * Validate an uploaded image. SVG/HTML are rejected (stored-XSS vectors in
 * public buckets). Returns a safe extension derived from the MIME type —
 * never from the client filename. Throws ValidationError.
 */
const IMAGE_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export function imageFile(
  file: unknown,
  what = "file",
  maxBytes = 5 * 1024 * 1024
): { file: Blob; ext: string } {
  if (!file || typeof file !== "object") fail(what);
  const f = file as { size?: unknown; type?: unknown; name?: unknown };
  if (typeof f.size !== "number" || f.size <= 0 || f.size > maxBytes)
    throw new ValidationError("Image must be under 5MB.");
  const ext = typeof f.type === "string" ? IMAGE_MIME[f.type.toLowerCase()] : undefined;
  if (!ext) throw new ValidationError("Only JPG, PNG, WebP or GIF images allowed.");
  return { file: f as Blob, ext };
}

/** Drop keys the admin API never writes (id/created_at/user tampering). */export function pick<T extends Record<string, unknown>>(obj: unknown, allowed: readonly string[]): Partial<T> {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) fail("request body");
  const out: Record<string, unknown> = {};
  for (const k of allowed) {
    const val = (obj as Record<string, unknown>)[k];
    if (val !== undefined) out[k] = val;
  }
  return out as Partial<T>;
}

/** Per-resource writable fields + coercion for /api/admin/catalog. */
export function catalogFields(resource: string, body: unknown): Record<string, unknown> {
  const b = pick(body, [
    "name", "title", "slug", "kind", "description", "conditions",
    "category_id", "price", "mrp", "images", "sizes", "stock", "available",
    "dress_type", "before_image", "after_image", "image_url",
    "price_addon", "active", "valid_from", "valid_to",
  ]);
  const out: Record<string, unknown> = {};
  const set = (k: string, val: unknown) => {
    if (val !== undefined && val !== null) out[k] = val;
  };
  if ("name" in b) set("name", reqStr(b.name, "name", 160));
  if ("title" in b) set("title", reqStr(b.title, "title", 160));
  if ("slug" in b) set("slug", reqStr(b.slug, "slug", 120));
  if ("kind" in b) set("kind", reqStr(b.kind, "kind", 40));
  if ("description" in b) set("description", str(b.description, "description", 2000));
  if ("conditions" in b) set("conditions", str(b.conditions, "conditions", 2000));
  if ("category_id" in b) {
    const c = str(b.category_id, "category", 60);
    if (c) out["category_id"] = uuid(c, "category");
  }
  if ("price" in b) set("price", num(b.price, "price") ?? 0);
  if ("mrp" in b) {
    const m = num(b.mrp, "mrp");
    if (m !== null) out["mrp"] = m;
  }
  if ("images" in b) set("images", strArr(b.images, "images", 12, 2000) ?? []);
  if ("sizes" in b) set("sizes", strArr(b.sizes, "sizes", 12, 12) ?? []);
  if ("stock" in b) set("stock", num(b.stock, "stock", 0, 100000) ?? 0);
  if ("available" in b) set("available", bool(b.available) ?? true);
  if ("dress_type" in b) set("dress_type", str(b.dress_type, "dress type", 120));
  if ("before_image" in b) set("before_image", httpUrl(b.before_image, "before photo"));
  if ("after_image" in b) set("after_image", httpUrl(b.after_image, "after photo"));
  if ("image_url" in b) set("image_url", httpUrl(b.image_url, "image"));
  if ("price_addon" in b) set("price_addon", num(b.price_addon, "price addon", 0, 1000000) ?? 0);
  if ("active" in b) set("active", bool(b.active) ?? true);
  if ("valid_from" in b || "valid_to" in b) {
    const d = (x: unknown) => {
      const s = str(x, "date", 10);
      if (s && !/^\d{4}-\d{2}-\d{2}$/.test(s)) fail("date");
      return s;
    };
    const f = "valid_from" in b ? d(b.valid_from) : undefined;
    const t = "valid_to" in b ? d(b.valid_to) : undefined;
    if (f !== undefined) out["valid_from"] = f;
    if (t !== undefined) out["valid_to"] = t;
  }
  void resource;
  return out;
}
