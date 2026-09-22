"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase/client";
import AuthModal, { type AuthMode } from "@/components/AuthModal";
import { OrderSteps, Receipt, inr, payLabel, shortId, type ReceiptLine } from "@/components/Receipt";

const MEAS_FIELDS = ["Bust", "Waist", "Hip", "Shoulder", "Sleeve length", "Dress length", "Neck depth"];

export default function ProfilePage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [authMode, setAuthMode] = useState<AuthMode | null>(null);
  const [tab, setTab] = useState<"info" | "meas" | "orders">("info");
  const [profile, setProfile] = useState({ full_name: "", phone: "", address: "" });
  const [saved, setSaved] = useState("");
  const [meas, setMeas] = useState<any[]>([]);
  const [newLabel, setNewLabel] = useState("");
  const [newVals, setNewVals] = useState<Record<string, string>>({});
  const [shopOrders, setShopOrders] = useState<any[]>([]);
  const [customOrders, setCustomOrders] = useState<any[]>([]);
  const [receipt, setReceipt] = useState<any>(null);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    sb.auth.getSession().then(({ data }) => {
      const u = data.session?.user;
      setUserId(u?.id ?? null);
      setEmail(u?.email ?? "");
      if (u) loadAll(u.id);
    });
    const { data: sub } = sb.auth.onAuthStateChange((_e, s) => {
      const u = s?.user;
      setUserId(u?.id ?? null);
      setEmail(u?.email ?? "");
      if (u) loadAll(u.id);
    });
    return () => sub.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAll = async (uid: string) => {
    const sb = getSupabase();
    if (!sb) return;
    const [p, m, s, c] = await Promise.all([
      sb.from("profiles").select("*").eq("id", uid).single(),
      sb.from("measurements").select("*").eq("user_id", uid).order("created_at", { ascending: false }),
      sb.from("shop_orders").select("*").eq("user_id", uid).order("created_at", { ascending: false }),
      sb.from("custom_orders").select("*").eq("user_id", uid).order("created_at", { ascending: false }),
    ]);
    if (p.data) setProfile({ full_name: p.data.full_name || "", phone: p.data.phone || "", address: p.data.address || "" });
    if (m.data) setMeas(m.data);
    if (s.data) setShopOrders(s.data);
    if (c.data) setCustomOrders(c.data);
  };

  const saveProfile = async () => {
    const sb = getSupabase();
    if (!sb || !userId) return;
    const { error } = await sb.from("profiles").upsert({ id: userId, ...profile });
    setSaved(error ? error.message : "Profile saved ✓");
    setTimeout(() => setSaved(""), 2000);
  };

  const addMeas = async () => {
    const sb = getSupabase();
    if (!sb || !userId) return;
    const { data, error } = await sb.from("measurements")
      .insert({ user_id: userId, label: newLabel || "My measurements", data: newVals })
      .select().single();
    if (!error && data) {
      setMeas([data, ...meas]);
      setNewLabel(""); setNewVals({});
    }
  };

  const delMeas = async (id: string) => {
    await getSupabase()?.from("measurements").delete().eq("id", id);
    setMeas(meas.filter((m) => m.id !== id));
  };

  const logout = async () => {
    await getSupabase()?.auth.signOut();
    await fetch("/api/admin/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "logout" }),
    }).catch(() => null);
    setUserId(null);
    setEmail("");
  };

  const shopLines = (o: any): ReceiptLine[] =>
    (o.items || []).map((i: any) => ({ label: `${i.qty} × ${i.name} (Size ${i.size})`, amount: i.qty * i.price }));

  const customLines = (o: any): ReceiptLine[] => [
    { label: `Custom dress${o.design_ref ? ` (ref: ${o.design_ref})` : ""}` },
    { label: `Fabric: ${o.fabric_mode === "shop" ? "Shop fabric" : "Own — " + (o.fabric_own_desc || "")}` },
    { label: `Neck: ${o.neck_front || "-"} / ${o.neck_back || "-"}` },
    { label: `Sleeve: ${o.sleeve || "-"}` },
    ...((o.decorative || []).map((d: any) => ({ label: `+ ${d.name}`, amount: d.addon })) as ReceiptLine[]),
  ];

  if (!userId)
    return (
      <main className="container page">
        <h1 className="page-title">My Profile</h1>
        <p className="muted">Login to see your profile, measurements and order tracking.</p>
        <button className="btn btn-primary btn-lg" onClick={() => setAuthMode("login")}>Login / Sign Up</button>
        <AuthModal mode={authMode} onClose={() => setAuthMode(null)} />
      </main>
    );

  return (
    <main className="container page">
      <div className="profile-head">
        <div>
          <h1 className="page-title">My Profile</h1>
          <p className="muted" style={{ margin: 0 }}>Signed in as <strong>{email}</strong></p>
        </div>
        <button className="btn btn-outline" onClick={logout}>Logout</button>
      </div>

      <div className="tabs">
        {(["info", "meas", "orders"] as const).map((t) => (
          <button key={t} className={`tab${tab === t ? " sel" : ""}`} onClick={() => setTab(t)}>
            {t === "info" ? "Info" : t === "meas" ? "Measurements" : "My Orders"}
          </button>
        ))}
      </div>

      {tab === "info" && (
        <div className="card form narrow">
          <label>Full name<input value={profile.full_name} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} placeholder="Your name" /></label>
          <label>Phone<input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} placeholder="98765 43210" /></label>
          <label>Address<textarea value={profile.address} onChange={(e) => setProfile({ ...profile, address: e.target.value })} rows={3} placeholder="Delivery address" /></label>
          <button className="btn btn-primary btn-block" onClick={saveProfile}>Save Profile</button>
          {saved && <p className="form-msg">{saved}</p>}
        </div>
      )}

      {tab === "meas" && (
        <>
          <div className="card form">
            <h3>Add measurement set</h3>
            <label>Label<input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="e.g. Festive kurti" /></label>
            <div className="meas-grid">
              {MEAS_FIELDS.map((f) => (
                <label key={f}>{f}<input value={newVals[f] || ""} onChange={(e) => setNewVals({ ...newVals, [f]: e.target.value })} placeholder="inches" /></label>
              ))}
            </div>
            <button className="btn btn-primary btn-block" onClick={addMeas}>Save Measurements</button>
          </div>
          <div className="meas-list">
            {meas.map((m) => (
              <div key={m.id} className="card">
                <div className="meas-head"><strong>{m.label}</strong>
                  <button className="link-danger" onClick={() => delMeas(m.id)}>Delete</button>
                </div>
                <div className="meas-vals">
                  {Object.entries(m.data || {}).map(([k, v]) => (
                    <span key={k}>{k}: <strong>{String(v)}&quot;</strong></span>
                  ))}
                </div>
              </div>
            ))}
            {meas.length === 0 && <p className="muted">No measurements saved yet.</p>}
          </div>
        </>
      )}

      {tab === "orders" && (
        <div className="orders-list">
          {shopOrders.map((o) => (
            <div key={o.id} className="card order-card">
              <div className="order-head">
                <strong>Shop Order #{shortId(o.id)}</strong>
                <span className="muted">{new Date(o.created_at).toLocaleDateString("en-IN")}</span>
              </div>
              <OrderSteps status={o.status} />
              <div className="order-foot">
                <span>{inr(o.total)} • {payLabel(o.payment_status)}</span>
                <button className="btn btn-outline" onClick={() => setReceipt({ title: "Order Receipt", id: o.id, created_at: o.created_at, lines: shopLines(o), total: o.total, payment_status: o.payment_status })}>🧾 Receipt</button>
              </div>
            </div>
          ))}
          {customOrders.map((o) => (
            <div key={o.id} className="card order-card">
              <div className="order-head">
                <strong>Custom Dress #{shortId(o.id)}</strong>
                <span className="muted">{new Date(o.created_at).toLocaleDateString("en-IN")}</span>
              </div>
              <OrderSteps status={o.status} />
              <div className="order-foot">
                <span>Est. {inr(o.estimate)} • {payLabel(o.payment_status)}</span>
                <button className="btn btn-outline" onClick={() => setReceipt({ title: "Custom Order Receipt", id: o.id, created_at: o.created_at, lines: customLines(o), total: o.estimate, payment_status: o.payment_status })}>🧾 Receipt</button>
              </div>
            </div>
          ))}
          {shopOrders.length === 0 && customOrders.length === 0 && (
            <p className="muted">No orders yet — visit the Shop or Dress Builder!</p>
          )}
        </div>
      )}

      {receipt && (
        <Receipt open onClose={() => setReceipt(null)} title={receipt.title}
          orderNo={receipt.id} date={new Date(receipt.created_at).toLocaleString("en-IN")}
          lines={receipt.lines} total={receipt.total} pay={receipt.payment_status} />
      )}
    </main>
  );
}
