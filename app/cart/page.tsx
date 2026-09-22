"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { getSupabase } from "@/lib/supabase/client";
import { useCart } from "@/lib/cart";
import AuthModal, { type AuthMode } from "@/components/AuthModal";
import { Receipt, inr, type ReceiptLine } from "@/components/Receipt";

export default function CartPage() {
  const { items, setQty, remove, clear, total } = useCart();
  const [userId, setUserId] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [pay, setPay] = useState<"cod" | "online">("cod");
  const [qr, setQr] = useState("");
  const [proof, setProof] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState<any>(null);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    sb.auth.getSession().then(({ data }) => setUserId(data.session?.user.id ?? null));
    const { data: sub } = sb.auth.onAuthStateChange((_e, s) =>
      setUserId(s?.user.id ?? null)
    );
    sb.from("shop_settings")
      .select("upi_qr_url")
      .eq("id", 1)
      .single()
      .then(({ data }) => data?.upi_qr_url && setQr(data.upi_qr_url));
    return () => sub.subscription.unsubscribe();
  }, []);

  const placeOrder = async () => {
    setError("");
    if (items.length === 0) return;
    const sb = getSupabase();
    if (!sb || !userId) {
      setAuthMode("signup");
      setError("Please login or create an account first.");
      return;
    }
    if (!name.trim() || !phone.trim()) {
      setError("Please add your name and phone.");
      return;
    }
    if (pay === "online" && !proof) {
      setError("Please upload your UPI payment screenshot.");
      return;
    }
    setLoading(true);
    try {
      const orderItems = items.map((i) => ({
        product_id: i.product_id,
        name: i.name,
        price: i.price,
        size: i.size,
        qty: i.qty,
      }));
      const { data: order, error: insErr } = await sb
        .from("shop_orders")
        .insert({
          user_id: userId,
          items: orderItems,
          total,
          name: name.trim(),
          phone: phone.trim(),
          address: address.trim() || null,
          payment_method: pay,
          payment_status: pay === "cod" ? "paid_on_pickup" : "pending",
          status: "pending",
        })
        .select()
        .single();
      if (insErr) throw insErr;

      let payment_status = order.payment_status;
      if (pay === "online" && proof) {
        const form = new FormData();
        form.append("kind", "shop");
        form.append("orderId", order.id);
        form.append("file", proof);
        const res = await fetch("/api/proof", { method: "POST", body: form });
        const j = await res.json();
        if (!res.ok) throw new Error(j.error || "Proof upload failed.");
        payment_status = "awaiting_verification";
      }

      const lines: ReceiptLine[] = orderItems.map((i) => ({
        label: `${i.qty} × ${i.name} (Size ${i.size})`,
        amount: i.qty * i.price,
      }));
      setReceipt({ ...order, payment_status, lines });
      clear();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Order failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container page">
      <h1 className="page-title">Your Bag</h1>

      {items.length === 0 && !receipt && (
        <p className="muted">Your bag is empty. Visit the Shop to add outfits!</p>
      )}

      {items.length > 0 && (
        <>
          <div className="cart-list">
            {items.map((i) => (
              <div key={i.product_id + i.size} className="card cart-row">
                {i.image ? (
                  <Image src={i.image} alt={i.name} width={80} height={80} className="cart-thumb" />
                ) : (
                  <div className="cart-ph">👗</div>
                )}
                <div className="cart-info">
                  <strong>{i.name}</strong>
                  <span>Size {i.size} • {inr(i.price)}</span>
                </div>
                <div className="qty">
                  <button onClick={() => setQty(i.product_id, i.size, i.qty - 1)}>−</button>
                  <span>{i.qty}</span>
                  <button onClick={() => setQty(i.product_id, i.size, i.qty + 1)}>+</button>
                </div>
                <strong>{inr(i.price * i.qty)}</strong>
                <button className="link-danger" onClick={() => remove(i.product_id, i.size)}>
                  Remove
                </button>
              </div>
            ))}
          </div>

          <div className="card form checkout">
            <h3>Delivery details</h3>
            <label>Name<input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" /></label>
            <label>Phone<input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="98765 43210" /></label>
            <label>Address<textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={2} placeholder="House no, street, area, Nagpur" /></label>

            <h3>Payment</h3>
            <div className="pay-opts">
              <label className="pay-opt">
                <input type="radio" checked={pay === "cod"} onChange={() => setPay("cod")} />
                💵 Pay on pickup / delivery
              </label>
              <label className="pay-opt">
                <input type="radio" checked={pay === "online"} onChange={() => setPay("online")} />
                📱 Pay online via UPI QR
              </label>
            </div>

            {pay === "online" && (
              <div className="qr-box">
                {qr ? (
                  <Image src={qr} alt="UPI QR" width={200} height={200} className="qr-img" />
                ) : (
                  <p className="muted">QR coming soon — please choose pay on pickup.</p>
                )}
                <label>
                  Upload payment screenshot
                  <input type="file" accept="image/*" onChange={(e) => setProof(e.target.files?.[0] || null)} />
                </label>
                {proof && <small>Selected: {proof.name}</small>}
              </div>
            )}

            <div className="receipt-total">
              <span>Total payable</span>
              <strong>{inr(total)}</strong>
            </div>
            {error && <p className="form-err">{error}</p>}
            <button className="btn btn-primary btn-block btn-lg" disabled={loading} onClick={placeOrder}>
              {loading ? "Placing order…" : "Place Order"}
            </button>
          </div>
        </>
      )}

      <AuthModal mode={authMode} onClose={() => setAuthMode(null)} />
      {receipt && (
        <Receipt
          open
          onClose={() => setReceipt(null)}
          title="Order Receipt"
          orderNo={receipt.id}
          date={new Date(receipt.created_at).toLocaleString("en-IN")}
          lines={receipt.lines}
          total={receipt.total}
          pay={receipt.payment_status}
        />
      )}
    </main>
  );
}
