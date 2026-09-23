"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { inr, shortId } from "@/components/Receipt";
import { SERVICE_ICONS } from "@/components/icons";
import { invalidate } from "@/lib/data-cache";

const SIZES = ["S", "M", "L", "XL", "XXL"];
const TABS = ["products", "examples", "materials", "offers", "orders", "settings", "announcements", "content"] as const;
const TAB_LABEL: Record<string, string> = {
  products: "🛍️ Products",
  examples: "✨ Raw → Best",
  materials: "🧵 Materials",
  offers: "🎁 Offers",
  orders: "📦 Orders",
  settings: "⚙️ Settings",
  announcements: "📢 Top Bar",
  content: "🎨 Content",
};

async function api(resource: string, method = "GET", body?: any) {
  const res = await fetch(`/api/admin/catalog/${resource}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const j = await res.json();
  if (!res.ok) throw new Error(j.error || "Request failed");
  return j;
}

async function uploadFile(bucket: string, file: File): Promise<string> {
  const form = new FormData();
  form.append("bucket", bucket);
  form.append("file", file);
  const res = await fetch("/api/admin/upload", { method: "POST", body: form });
  const j = await res.json();
  if (!res.ok) throw new Error(j.error || "Upload failed");
  return j.url;
}

function Img({ src, alt }: { src: string; alt: string }) {
  return <Image src={src} alt={alt} width={120} height={90} className="adm-thumb" />;
}

export default function AdminPage() {
  const [gate, setGate] = useState<"loading" | "ok" | "no">("loading");
  const [tab, setTab] = useState<(typeof TABS)[number]>("products");
  const [rows, setRows] = useState<any[]>([]);
  const [cats, setCats] = useState<any[]>([]);
  const [msg, setMsg] = useState("");
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);

  // Orders state
  const [shopOrders, setShopOrders] = useState<any[]>([]);
  const [customOrders, setCustomOrders] = useState<any[]>([]);
  // Settings state
  const [settings, setSettings] = useState<any>({ upi_id: "", upi_qr_url: "", notice: "" });
  const [qrFile, setQrFile] = useState<File | null>(null);
  // Announcements state
  const [anncs, setAnncs] = useState<any[]>([]);
  const [newAnn, setNewAnn] = useState("");
  // Site content state (hero stats, services, section headers)
  const [content, setContent] = useState<Record<string, any>>({});

  useEffect(() => {
    fetch("/api/admin/auth")
      .then((r) => r.json())
      .then((j) => setGate(j.isAdmin ? "ok" : "no"))
      .catch(() => setGate("no"));
  }, []);

  useEffect(() => {
    if (gate !== "ok") return;
    if (tab === "orders") loadOrders();
    else if (tab === "settings") loadSettings();
    else if (tab === "announcements") loadAnncs();
    else if (tab === "content") loadContent();
    else loadTab(tab);
    setEditing(null); setForm({}); setFiles([]); setMsg("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, gate]);

  const loadTab = async (t: string) => {
    try {
      const j = await api(t === "products" ? "products" : t);
      setRows(j.rows || []);
      if (t === "products") {
        const c = await api("categories");
        setCats(c.rows || []);
      }
    } catch (e: any) { setMsg(e.message); }
  };
  const loadOrders = async () => {
    const res = await fetch("/api/admin/orders");
    const j = await res.json();
    if (j.shop) { setShopOrders(j.shop); setCustomOrders(j.custom); }
    else setMsg(j.error || "Failed");
  };
  const loadSettings = async () => {
    const res = await fetch("/api/admin/settings");
    const j = await res.json();
    if (j.settings) setSettings(j.settings);
  };

  const loadAnncs = async () => {
    const res = await fetch("/api/admin/announcements");
    const j = await res.json();
    if (j.rows) setAnncs(j.rows);
    else setMsg(j.error || "Failed to load announcements");
  };

  const annAction = async (action: string, body: any = {}) => {    setBusy(true);
    try {
      const res = await fetch("/api/admin/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...body }),
      });
      const j = await res.json();
      if (j.error) setMsg(j.error);
      else {
        setNewAnn("");
        await loadAnncs();
        invalidate("announcements");
        setMsg("Saved ✅");
      }
    } catch (e: any) { setMsg(e.message); }
    finally { setBusy(false); }
  };

  const loadContent = async () => {
    const res = await fetch("/api/admin/content");
    const j = await res.json();
    if (j.rows) {
      const map: Record<string, any> = {};
      j.rows.forEach((r: any) => { map[r.key] = r.value || {}; });
      setContent(map);
    } else setMsg(j.error || "Failed to load content");
  };

  const setC = (key: string, field: string, val: any) =>
    setContent((c) => ({ ...c, [key]: { ...(c[key] || {}), [field]: val } }));

  const setCItem = (key: string, idx: number, field: string, val: any) =>
    setContent((c) => {
      const items = [...((c[key]?.items || [{}, {}, {}]) as any[])];
      while (items.length < 3) items.push({});
      items[idx] = { ...(items[idx] || {}), [field]: val };
      return { ...c, [key]: { ...(c[key] || {}), items } };
    });

  const saveContent = async (key: string) => {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value: content[key] || {} }),
      });
      const j = await res.json();
      if (j.ok) invalidate("content");
      setMsg(j.ok ? "Content saved ✅ — live on the site now." : j.error);
    } catch (e: any) { setMsg(e.message); }
    finally { setBusy(false); }
  };

  if (gate === "loading") return <main className="container page"><p className="muted">Checking access…</p></main>;
  if (gate === "no") {
    if (typeof window !== "undefined") window.location.href = "/";
    return <main className="container page"><p className="muted">Not authorized.</p></main>;
  }

  const resource = tab === "products" ? "products" : tab;
  const bucket = tab === "products" ? "product-images" : "design-images";

  const startAdd = () => {
    setEditing("new");
    setForm(tab === "products" ? { sizes: ["S", "M", "L", "XL", "XXL"], stock: 0, price: 0, available: true, images: [] }
      : tab === "offers" ? { active: true }
      : tab === "materials" ? { kind: "fabric", price_addon: 0, available: true } : {});
    setFiles([]);
  };

  const save = async () => {
    setBusy(true); setMsg("");
    try {
      const payload: any = { ...form };
      // uploads
      if (files.length > 0) {
        const urls = [];
        for (const f of files) urls.push(await uploadFile(bucket, f));
        if (tab === "products") payload.images = [...(payload.images || []), ...urls];
        else if (tab === "examples") {
          if (urls[0] && !payload.before_image) payload.before_image = urls[0];
          if (urls[1]) payload.after_image = urls[1];
          if (urls[0] && payload.before_image && !payload.after_image && urls.length === 1 && editing === "new") {
            // single upload in examples → treat as after image if before set? keep simple
          }
        } else payload.image_url = payload.image_url || urls[0];
      }
      if (tab === "products") {
        payload.price = Number(payload.price || 0);
        payload.mrp = payload.mrp ? Number(payload.mrp) : null;
        payload.stock = Number(payload.stock || 0);
        if (!payload.category_id) delete payload.category_id;
      }
      if (tab === "materials") payload.price_addon = Number(payload.price_addon || 0);
      if (editing === "new") await api(resource, "POST", payload);
      else await api(resource, "PATCH", { ...payload, id: editing });
      setEditing(null); setForm({}); setFiles([]);
      await loadTab(tab);
      invalidate("catalog"); // storefront lists refetch on next visit
      setMsg("Saved ✅");
    } catch (e: any) { setMsg(e.message); }
    finally { setBusy(false); }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this item?")) return;
    try { await api(`${resource}?id=${id}`, "DELETE"); await loadTab(tab); invalidate("catalog"); }
    catch (e: any) { setMsg(e.message); }
  };

  const setF = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const updateOrder = async (table: "shop" | "custom", id: string, fields: any) => {
    const res = await fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ table, id, fields }),
    });
    const j = await res.json();
    if (j.row) loadOrders();
    else setMsg(j.error || "Update failed");
  };

  const viewProof = async (path: string) => {
    const res = await fetch(`/api/admin/upload?bucket=payment-proofs&path=${encodeURIComponent(path)}`);
    const j = await res.json();
    if (j.url) window.open(j.url, "_blank");
    else setMsg(j.error || "Cannot open proof");
  };

  const saveSettings = async () => {
    setBusy(true);
    try {
      let qr = settings.upi_qr_url;
      if (qrFile) qr = await uploadFile("design-images", qrFile);
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ upi_id: settings.upi_id, upi_qr_url: qr, notice: settings.notice }),
      });
      const j = await res.json();
      if (j.settings) { setSettings(j.settings); setQrFile(null); invalidate("settings"); setMsg("Settings saved ✅"); }
      else setMsg(j.error);
    } catch (e: any) { setMsg(e.message); }
    finally { setBusy(false); }
  };

  const STATUS = ["pending", "confirmed", "stitching", "ready", "delivered", "cancelled"];
  const PAY = ["pending", "awaiting_verification", "verified", "rejected", "paid_on_pickup", "done"];

  return (
    <main className="container page">
      <h1 className="page-title">Admin Dashboard</h1>
      <div className="tabs admin-tabs">
        {TABS.map((t) => (
          <button key={t} className={`tab${tab === t ? " sel" : ""}`} onClick={() => setTab(t)}>
            {TAB_LABEL[t]}
          </button>
        ))}
      </div>
      {msg && <p className="form-msg">{msg}</p>}

      {(tab === "products" || tab === "examples" || tab === "materials" || tab === "offers") && (
        <>
          {!editing && (
            <>
              <button className="btn btn-primary" onClick={startAdd}>+ Add new</button>
              <div className="adm-list">
                {rows.map((r) => (
                  <div key={r.id} className="card adm-row">
                    <div>
                      <strong>{r.name || r.title}</strong>
                      <div className="muted small">
                        {tab === "products" && `${inr(r.price)} • Stock ${r.stock} • ${r.available ? "Live" : "Hidden"}`}
                        {tab === "materials" && `${r.kind} • +${inr(r.price_addon)} • ${r.available ? "Live" : "Hidden"}`}
                        {tab === "offers" && `${r.active ? "Active ✅" : "Paused"} ${r.valid_to ? `• till ${r.valid_to}` : ""}`}
                        {tab === "examples" && (r.dress_type || "")}
                      </div>
                    </div>
                    <div className="adm-actions">
                      <button className="btn btn-outline" onClick={() => { setEditing(r.id); setForm({ ...r }); }}>Edit</button>
                      <button className="btn btn-outline" onClick={() => remove(r.id)}>Delete</button>
                    </div>
                  </div>
                ))}
                {rows.length === 0 && <p className="muted">Nothing here yet.</p>}
              </div>
            </>
          )}

          {editing && (
            <div className="card form">
              <h3>{editing === "new" ? "Add" : "Edit"}</h3>

              {(tab === "products" || tab === "materials" || tab === "offers" || tab === "examples") && (
                <label>{tab === "products" || tab === "materials" ? "Name" : "Title"}
                  <input value={form.name || form.title || ""} onChange={(e) => setF(tab === "examples" || tab === "offers" ? "title" : "name", e.target.value)} />
                </label>
              )}

              {tab === "products" && (
                <>
                  <label>Category<select value={form.category_id || ""} onChange={(e) => setF("category_id", e.target.value)}>
                    <option value="">—</option>
                    {cats.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select></label>
                  <label>Description<textarea value={form.description || ""} onChange={(e) => setF("description", e.target.value)} rows={2} /></label>
                  <div className="meas-grid">
                    <label>Price (₹)<input type="number" value={form.price ?? 0} onChange={(e) => setF("price", e.target.value)} /></label>
                    <label>MRP (₹)<input type="number" value={form.mrp ?? ""} onChange={(e) => setF("mrp", e.target.value)} /></label>
                    <label>Stock<input type="number" value={form.stock ?? 0} onChange={(e) => setF("stock", e.target.value)} /></label>
                  </div>
                  <div>Sizes: {SIZES.map((s) => (
                    <label key={s} className="chk"><input type="checkbox" checked={(form.sizes || []).includes(s)}
                      onChange={(e) => setF("sizes", e.target.checked ? [...(form.sizes || []), s] : (form.sizes || []).filter((x: string) => x !== s))} /> {s}</label>
                  ))}</div>
                  <div className="thumbs">
                    {(form.images || []).map((u: string) => <Img key={u} src={u} alt="" />)}
                  </div>
                  <label>Upload product photos<input type="file" accept="image/*" multiple onChange={(e) => setFiles(Array.from(e.target.files || []))} /></label>
                  <label className="chk"><input type="checkbox" checked={!!form.available} onChange={(e) => setF("available", e.target.checked)} /> Visible in shop</label>
                </>
              )}

              {tab === "materials" && (
                <>
                  <label>Kind<select value={form.kind || "fabric"} onChange={(e) => setF("kind", e.target.value)}>
                    <option value="fabric">Fabrics / Raw Materials</option>
                    <option value="neck_front">Neck — Front</option>
                    <option value="neck_back">Neck — Back</option>
                    <option value="sleeve">Sleeve Designs</option>
                    <option value="decorative">Decorative (zumka/latkan/lace…)</option>
                  </select></label>
                  <label>Description<textarea value={form.description || ""} onChange={(e) => setF("description", e.target.value)} rows={2} /></label>
                  <label>Extra price (₹)<input type="number" value={form.price_addon ?? 0} onChange={(e) => setF("price_addon", e.target.value)} /></label>
                  {form.image_url && <Img src={form.image_url} alt="" />}
                  <label>Upload photo<input type="file" accept="image/*" onChange={(e) => setFiles(Array.from(e.target.files || []))} /></label>
                  <label className="chk"><input type="checkbox" checked={!!form.available} onChange={(e) => setF("available", e.target.checked)} /> Available</label>
                </>
              )}

              {tab === "examples" && (
                <>
                  <label>Dress type / category<input value={form.dress_type || ""} onChange={(e) => setF("dress_type", e.target.value)} placeholder="Gown, Kurti Set…" /></label>
                  <label>Description / reference info<textarea value={form.description || ""} onChange={(e) => setF("description", e.target.value)} rows={3} /></label>
                  <div className="meas-grid">
                    <div>{form.before_image && <Img src={form.before_image} alt="before" />}<label>Before / raw-material photo<input type="file" accept="image/*" onChange={async (e) => { const f = e.target.files?.[0]; if (f) setF("before_image", await uploadFile("design-images", f)); }} /></label></div>
                    <div>{form.after_image && <Img src={form.after_image} alt="after" />}<label>Finished-dress photo<input type="file" accept="image/*" onChange={async (e) => { const f = e.target.files?.[0]; if (f) setF("after_image", await uploadFile("design-images", f)); }} /></label></div>
                  </div>
                </>
              )}

              {tab === "offers" && (
                <>
                  <label>Description<textarea value={form.description || ""} onChange={(e) => setF("description", e.target.value)} rows={2} /></label>
                  <label>Conditions<textarea value={form.conditions || ""} onChange={(e) => setF("conditions", e.target.value)} rows={2} placeholder="e.g. valid on 4+ dresses…" /></label>
                  <div className="meas-grid">
                    <label>Valid from<input type="date" value={form.valid_from || ""} onChange={(e) => setF("valid_from", e.target.value)} /></label>
                    <label>Valid till<input type="date" value={form.valid_to || ""} onChange={(e) => setF("valid_to", e.target.value)} /></label>
                  </div>
                  {form.image_url && <Img src={form.image_url} alt="" />}
                  <label>Upload banner<input type="file" accept="image/*" onChange={(e) => setFiles(Array.from(e.target.files || []))} /></label>
                  <label className="chk"><input type="checkbox" checked={!!form.active} onChange={(e) => setF("active", e.target.checked)} /> Active (visible to customers)</label>
                </>
              )}

              <div className="builder-nav">
                <button className="btn btn-outline" onClick={() => { setEditing(null); setForm({}); }}>Cancel</button>
                <button className="btn btn-primary" disabled={busy} onClick={save}>{busy ? "Saving…" : "Save"}</button>
              </div>
            </div>
          )}
        </>
      )}

      {tab === "orders" && (
        <>
          <h3>Shop orders</h3>
          {shopOrders.map((o) => (
            <div key={o.id} className="card adm-row col">
              <div className="order-head"><strong>#{shortId(o.id)} • {o.name} • {o.phone}</strong><span>{inr(o.total)}</span></div>
              <small className="muted">{(o.items || []).map((i: any) => `${i.qty}× ${i.name} (${i.size})`).join(", ")}</small>
              <div className="adm-order-ctl">
                <label>Status<select value={o.status} onChange={(e) => updateOrder("shop", o.id, { status: e.target.value })}>
                  {STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select></label>
                <label>Payment<select value={o.payment_status} onChange={(e) => updateOrder("shop", o.id, { payment_status: e.target.value })}>
                  {PAY.map((s) => <option key={s} value={s}>{s}</option>)}
                </select></label>
                {o.proof_url && <button className="btn btn-outline" onClick={() => viewProof(o.proof_url)}>View payment proof</button>}
              </div>
            </div>
          ))}
          {shopOrders.length === 0 && <p className="muted">No shop orders.</p>}
          <h3>Custom dress orders</h3>
          {customOrders.map((o) => (
            <div key={o.id} className="card adm-row col">
              <div className="order-head"><strong>#{shortId(o.id)} • {o.name} • {o.phone}</strong><span>Est. {inr(o.estimate)}</span></div>
              <small className="muted">{o.design_ref ? `Ref: ${o.design_ref} • ` : ""}{o.fabric_mode === "shop" ? "Shop fabric" : "Own: " + (o.fabric_own_desc || "")} • {o.neck_front}/{o.neck_back} • {o.sleeve} • {(o.decorative || []).map((d: any) => d.name).join(", ")}</small>
              <div className="adm-order-ctl">
                <label>Status<select value={o.status} onChange={(e) => updateOrder("custom", o.id, { status: e.target.value })}>
                  {STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select></label>
                <label>Payment<select value={o.payment_status} onChange={(e) => updateOrder("custom", o.id, { payment_status: e.target.value })}>
                  {PAY.map((s) => <option key={s} value={s}>{s}</option>)}
                </select></label>
                {o.proof_url && <button className="btn btn-outline" onClick={() => viewProof(o.proof_url)}>View payment proof</button>}
              </div>
            </div>
          ))}
          {customOrders.length === 0 && <p className="muted">No custom orders.</p>}
        </>
      )}

      {tab === "settings" && (
        <div className="card form narrow">
          <h3>UPI / QR settings</h3>
          <label>UPI ID<input value={settings.upi_id || ""} onChange={(e) => setSettings({ ...settings, upi_id: e.target.value })} placeholder="yourname@upi" /></label>
          {settings.upi_qr_url && <Img src={settings.upi_qr_url} alt="QR" />}
          <label>Upload QR code<input type="file" accept="image/*" onChange={(e) => setQrFile(e.target.files?.[0] || null)} /></label>
          <label>Shop notice<textarea value={settings.notice || ""} onChange={(e) => setSettings({ ...settings, notice: e.target.value })} rows={2} /></label>
          <button className="btn btn-primary btn-block" disabled={busy} onClick={saveSettings}>{busy ? "Saving…" : "Save Settings"}</button>
        </div>
      )}

      {tab === "announcements" && (
        <>
          <div className="card form">
            <h3>New announcement</h3>
            <p className="muted small" style={{ marginBottom: 12 }}>
              Shows in the top bar for all visitors. Keep it short — one line.
              Until you add one, the demo message stays live.
            </p>
            <label>Text<textarea value={newAnn} onChange={(e) => setNewAnn(e.target.value)} rows={2} placeholder="e.g. Diwali offer — flat 20% off custom stitching till Sunday!" /></label>
            <div className="builder-nav">
              <span />
              <button className="btn btn-primary" disabled={busy || !newAnn.trim()} onClick={() => annAction("create", { text: newAnn })}>
                {busy ? "Saving…" : "Publish"}
              </button>
            </div>
          </div>
          <div className="adm-list">
            {anncs.map((a) => (
              <div key={a.id} className="card adm-row">
                <div>
                  <strong>{a.active ? "🟢 Live" : "⚪ Paused"}</strong>
                  <div className="muted small">{a.text}</div>
                </div>
                <div className="adm-actions">
                  <button
                    className="btn btn-outline"
                    disabled={busy}
                    onClick={() => annAction("toggle", { id: a.id, active: !a.active })}
                  >
                    {a.active ? "Pause" : "Show"}
                  </button>
                  <button
                    className="btn btn-outline"
                    disabled={busy}
                    onClick={() => { if (confirm("Delete this announcement?")) annAction("remove", { id: a.id }); }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
            {anncs.length === 0 && <p className="muted">No announcements yet — the demo message is showing.</p>}
          </div>
        </>
      )}

      {tab === "content" && (
        <>
          <p className="muted">Homepage text. Empty fields keep showing the demo content.</p>
          <div className="card form" style={{ marginBottom: 14 }}>
            <h3>Hero numbers &amp; reviews</h3>
            <label>Latest fashion photo (white circle on homepage){content.hero?.image_url && <Img src={content.hero.image_url} alt="Hero" />}<input type="file" accept="image/*" onChange={async (e) => { const f = e.target.files?.[0]; if (f) { setBusy(true); try { setC("hero", "image_url", await uploadFile("design-images", f)); } catch (err: any) { setMsg(err.message); } finally { setBusy(false); } } }} /></label>
            <div className="meas-grid">
              <label>Orders<input value={content.hero?.orders || ""} onChange={(e) => setC("hero", "orders", e.target.value)} placeholder="5000+" /></label>
              <label>Orders label<input value={content.hero?.orders_label || ""} onChange={(e) => setC("hero", "orders_label", e.target.value)} placeholder="Orders delivered" /></label>
              <label>Rating<input value={content.hero?.rating || ""} onChange={(e) => setC("hero", "rating", e.target.value)} placeholder="4.9★" /></label>
              <label>Rating label<input value={content.hero?.rating_label || ""} onChange={(e) => setC("hero", "rating_label", e.target.value)} placeholder="Average rating" /></label>
              <label>Delivery<input value={content.hero?.delivery || ""} onChange={(e) => setC("hero", "delivery", e.target.value)} placeholder="48hr" /></label>
              <label>Delivery label<input value={content.hero?.delivery_label || ""} onChange={(e) => setC("hero", "delivery_label", e.target.value)} placeholder="Stitch to doorstep" /></label>
              <label>Express<input value={content.hero?.express || ""} onChange={(e) => setC("hero", "express", e.target.value)} placeholder="24hr" /></label>
              <label>Express label<input value={content.hero?.express_label || ""} onChange={(e) => setC("hero", "express_label", e.target.value)} placeholder="Alterations express" /></label>
              <label>Score<input value={content.hero?.score || ""} onChange={(e) => setC("hero", "score", e.target.value)} placeholder="4.9" /></label>
              <label>Reviews line<input value={content.hero?.reviews || ""} onChange={(e) => setC("hero", "reviews", e.target.value)} placeholder="2,300+ happy reviews" /></label>
              <label>Customers line<input value={content.hero?.customers || ""} onChange={(e) => setC("hero", "customers", e.target.value)} placeholder="Loved by 5,000+ customers in Nagpur" /></label>
            </div>
            <button className="btn btn-primary btn-block" disabled={busy} onClick={() => saveContent("hero")}>{busy ? "Saving…" : "Save hero"}</button>
          </div>

          <div className="card form" style={{ marginBottom: 14 }}>
            <h3>Services</h3>
            <label>Eyebrow<input value={content.services?.eyebrow || ""} onChange={(e) => setC("services", "eyebrow", e.target.value)} placeholder="What we do" /></label>
            <label>Title<input value={content.services?.title || ""} onChange={(e) => setC("services", "title", e.target.value)} placeholder="Our Services" /></label>
            <label>Subtitle<textarea value={content.services?.sub || ""} onChange={(e) => setC("services", "sub", e.target.value)} rows={2} /></label>
            {[0, 1, 2].map((i) => (
              <div key={i} className="review-box">
                <strong>Service {i + 1}</strong>
                <label>Icon<select value={content.services?.items?.[i]?.icon || "needle"} onChange={(e) => setCItem("services", i, "icon", e.target.value)}>
                  {SERVICE_ICONS.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
                </select></label>
                <label>Title<input value={content.services?.items?.[i]?.title || ""} onChange={(e) => setCItem("services", i, "title", e.target.value)} /></label>
                <label>Text<textarea value={content.services?.items?.[i]?.text || ""} onChange={(e) => setCItem("services", i, "text", e.target.value)} rows={2} /></label>
              </div>
            ))}
            <button className="btn btn-primary btn-block" disabled={busy} onClick={() => saveContent("services")}>{busy ? "Saving…" : "Save services"}</button>
          </div>

          <div className="card form">
            <h3>Section headers</h3>
            <label>Shop eyebrow<input value={content.sections?.shop_eyebrow || ""} onChange={(e) => setC("sections", "shop_eyebrow", e.target.value)} /></label>
            <label>Shop title<input value={content.sections?.shop_title || ""} onChange={(e) => setC("sections", "shop_title", e.target.value)} /></label>
            <label>Shop subtitle<textarea value={content.sections?.shop_sub || ""} onChange={(e) => setC("sections", "shop_sub", e.target.value)} rows={2} /></label>
            <label>Upcycle eyebrow<input value={content.sections?.tf_eyebrow || ""} onChange={(e) => setC("sections", "tf_eyebrow", e.target.value)} /></label>
            <label>Upcycle title<input value={content.sections?.tf_title || ""} onChange={(e) => setC("sections", "tf_title", e.target.value)} /></label>
            <label>Upcycle subtitle<textarea value={content.sections?.tf_sub || ""} onChange={(e) => setC("sections", "tf_sub", e.target.value)} rows={2} /></label>
            <p className="muted small">Transformation photos are uploaded per item in the Raw → Best tab (before / after photos).</p>
            <button className="btn btn-primary btn-block" disabled={busy} onClick={() => saveContent("sections")}>{busy ? "Saving…" : "Save headers"}</button>
          </div>
        </>
      )}
    </main>
  );
}
