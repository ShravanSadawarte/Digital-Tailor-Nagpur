"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { getSupabase } from "@/lib/supabase/client";
import PageHero from "@/components/PageHero";
import AuthModal, { type AuthMode } from "@/components/AuthModal";
import { Receipt, inr, type ReceiptLine } from "@/components/Receipt";

type Material = {
  id: string;
  kind: string;
  name: string;
  description: string;
  image_url: string | null;
  price_addon: number;
};

const STEPS = ["Fabric", "Neck (Front)", "Neck (Back)", "Sleeves", "Decoration", "Review"];
const BASE = 499;
const MEAS_FIELDS = ["Bust", "Waist", "Hip", "Shoulder", "Sleeve length", "Dress length", "Neck depth"];

function OptCard(props: {
  selected: boolean;
  onClick: () => void;
  image: string | null;
  emoji: string;
  name: string;
  sub: string;
}) {
  return (
    <button
      type="button"
      className={`opt-card${props.selected ? " sel" : ""}`}
      onClick={props.onClick}
    >
      {props.image ? (
        <Image src={props.image} alt={props.name} width={200} height={130} className="opt-img" />
      ) : (
        <div className="opt-ph">{props.emoji}</div>
      )}
      <strong>{props.name}</strong>
      <small>{props.sub}</small>
    </button>
  );
}

export default function BuilderPage() {
  const [mats, setMats] = useState<Material[]>([]);
  const [step, setStep] = useState(0);
  const [designRef, setDesignRef] = useState("");
  const [fabricMode, setFabricMode] = useState<"shop" | "own">("shop");
  const [fabricId, setFabricId] = useState("");
  const [ownFabric, setOwnFabric] = useState("");
  const [neckF, setNeckF] = useState("");
  const [neckB, setNeckB] = useState("");
  const [sleeve, setSleeve] = useState("");
  const [decor, setDecor] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [refMode, setRefMode] = useState<"measurement" | "reference_dress">("measurement");
  const [measurements, setMeasurements] = useState<any[]>([]);
  const [measId, setMeasId] = useState("");
  const [newMeas, setNewMeas] = useState<Record<string, string>>({});
  const [refDressNote, setRefDressNote] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [pay, setPay] = useState<"cod" | "online">("cod");
  const [qr, setQr] = useState("");
  const [proof, setProof] = useState<File | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState<any>(null);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("ref");
    if (q) setDesignRef(q);
    const sb = getSupabase();
    if (!sb) return;
    sb.from("materials").select("*").eq("available", true).then(({ data }) => data && setMats(data));
    sb.auth.getSession().then(({ data }) => {
      const uid = data.session?.user.id ?? null;
      setUserId(uid);
      if (uid) {
        sb.from("measurements").select("*").eq("user_id", uid).order("created_at", { ascending: false })
          .then(({ data }) => {
            if (data) { setMeasurements(data); if (data[0]) setMeasId(data[0].id); }
          });
      }
    });
    sb.from("shop_settings").select("upi_qr_url").eq("id", 1).single()
      .then(({ data }) => data?.upi_qr_url && setQr(data.upi_qr_url));
  }, []);

  const by = (kind: string) => mats.filter((m) => m.kind === kind);
  const find = (id: string) => mats.find((m) => m.id === id);
  const addon = (id: string) => find(id)?.price_addon || 0;
  const estimate = BASE + (fabricMode === "shop" ? addon(fabricId) : 0) + addon(neckF) + addon(neckB) + addon(sleeve) + decor.reduce((n, id) => n + addon(id), 0);

  const toggleDecor = (id: string) =>
    setDecor((d) => (d.includes(id) ? d.filter((x) => x !== id) : [...d, id]));

  const canNext =
    step === 0 ? fabricMode === "own" ? ownFabric.trim() !== "" : fabricId !== "" :
    step === 1 ? neckF !== "" :
    step === 2 ? neckB !== "" :
    step === 3 ? sleeve !== "" : true;

  const placeOrder = async () => {
    setError("");
    const sb = getSupabase();
    if (!sb || !userId) { setAuthMode("signup"); setError("Please login or create an account first."); return; }
    if (!name.trim() || !phone.trim()) { setError("Please add your name and phone."); return; }
    if (pay === "online" && !proof) { setError("Please upload your UPI payment screenshot."); return; }
    if (refMode === "measurement" && !measId && Object.values(newMeas).every((v) => !v)) {
      setError("Select a saved measurement or enter new ones (or choose reference-dress)."); return;
    }
    setLoading(true);
    try {
      let measurement_id: string | null = measId || null;
      if (refMode === "measurement" && !measId) {
        const { data, error } = await sb.from("measurements")
          .insert({ user_id: userId, label: "Builder measurement", data: newMeas })
          .select().single();
        if (error) throw error;
        measurement_id = data.id;
      }
      const decorObjs = decor.map((id) => ({ id, name: find(id)?.name, addon: addon(id) }));
      const { data: order, error: insErr } = await sb.from("custom_orders").insert({
        user_id: userId,
        design_ref: designRef || null,
        fabric_mode: fabricMode,
        fabric_material_id: fabricMode === "shop" ? fabricId : null,
        fabric_own_desc: fabricMode === "own" ? ownFabric.trim() : null,
        neck_front: find(neckF)?.name || null,
        neck_back: find(neckB)?.name || null,
        sleeve: find(sleeve)?.name || null,
        decorative: decorObjs,
        own_notes: notes.trim() || null,
        reference_mode: refMode,
        measurement_id,
        reference_dress_note: refMode === "reference_dress" ? refDressNote.trim() || null : null,
        estimate,
        name: name.trim(),
        phone: phone.trim(),
        payment_method: pay,
        payment_status: pay === "cod" ? "paid_on_pickup" : "pending",
        status: "pending",
      }).select().single();
      if (insErr) throw insErr;

      let payment_status = order.payment_status;
      if (pay === "online" && proof) {
        const form = new FormData();
        form.append("kind", "custom");
        form.append("orderId", order.id);
        form.append("file", proof);
        const res = await fetch("/api/proof", { method: "POST", body: form });
        const j = await res.json();
        if (!res.ok) throw new Error(j.error || "Proof upload failed.");
        payment_status = "awaiting_verification";
      }

      const lines: ReceiptLine[] = [
        { label: `Custom dress${designRef ? ` (ref: ${designRef})` : ""}` },
        { label: `Fabric: ${fabricMode === "shop" ? find(fabricId)?.name : "Own (" + ownFabric.trim() + ")"}` },
        { label: `Neck: ${find(neckF)?.name} / ${find(neckB)?.name}` },
        { label: `Sleeve: ${find(sleeve)?.name}` },
        ...decorObjs.map((d) => ({ label: `+ ${d.name}`, amount: d.addon })),
        { label: "Stitching base", amount: BASE },
      ];
      setReceipt({ ...order, payment_status, lines });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Order failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container page">
      <PageHero
        eyebrow="Made to measure"
        title="Custom Dress Builder"
        sub="Design your dream outfit step-by-step. Estimated price updates live."
      />

      {designRef && <p className="design-ref">📌 Reference design: <strong>{designRef}</strong></p>}

      <div className="stepper">
        {STEPS.map((s, i) => (
          <button key={s} className={`step-tab${i === step ? " sel" : ""}${i < step ? " done" : ""}`} onClick={() => i < step && setStep(i)}>
            {i + 1}. {s}
          </button>
        ))}
      </div>

      <div className="card builder-card">
        {step === 0 && (
          <>
            <h3>Choose your fabric</h3>
            <div className="pay-opts">
              <label className="pay-opt"><input type="radio" checked={fabricMode === "shop"} onChange={() => setFabricMode("shop")} />🧵 From our shop</label>
              <label className="pay-opt"><input type="radio" checked={fabricMode === "own"} onChange={() => setFabricMode("own")} />👝 I have my own cloth</label>
            </div>
            {fabricMode === "shop" ? (
              <div className="opt-grid">
                {by("fabric").map((m) => (
                  <OptCard key={m.id} selected={fabricId === m.id} onClick={() => setFabricId(m.id)}
                    image={m.image_url} emoji="🧵" name={m.name} sub={`${m.description || ""} ${m.price_addon ? `(+${inr(m.price_addon)})` : "(included)"}`} />
                ))}
              </div>
            ) : (
              <label>Describe your cloth<textarea value={ownFabric} onChange={(e) => setOwnFabric(e.target.value)} rows={3} placeholder="e.g. Mom's blue silk saree, ~6 meters" /></label>
            )}
          </>
        )}

        {step === 1 && (
          <>
            <h3>Front neck design</h3>
            <div className="opt-grid">
              {by("neck_front").map((m) => (
                <OptCard key={m.id} selected={neckF === m.id} onClick={() => setNeckF(m.id)}
                  image={m.image_url} emoji="👚" name={m.name} sub={m.price_addon ? `+${inr(m.price_addon)}` : "Included"} />
              ))}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h3>Back neck design</h3>
            <div className="opt-grid">
              {by("neck_back").map((m) => (
                <OptCard key={m.id} selected={neckB === m.id} onClick={() => setNeckB(m.id)}
                  image={m.image_url} emoji="🎀" name={m.name} sub={m.price_addon ? `+${inr(m.price_addon)}` : "Included"} />
              ))}
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h3>Sleeve design</h3>
            <div className="opt-grid">
              {by("sleeve").map((m) => (
                <OptCard key={m.id} selected={sleeve === m.id} onClick={() => setSleeve(m.id)}
                  image={m.image_url} emoji="💪" name={m.name} sub={m.price_addon ? `+${inr(m.price_addon)}` : "Included"} />
              ))}
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <h3>Decorative materials (pick any)</h3>
            <div className="opt-grid">
              {by("decorative").map((m) => (
                <OptCard key={m.id} selected={decor.includes(m.id)} onClick={() => toggleDecor(m.id)}
                  image={m.image_url} emoji="✨" name={m.name} sub={m.price_addon ? `+${inr(m.price_addon)}` : "Included"} />
              ))}
            </div>
            <label>Anything of your own? (own lace, latkan, etc.)<textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Describe your own decorative materials" /></label>
          </>
        )}

        {step === 5 && (
          <>
            <h3>Review &amp; measurements</h3>
            <div className="review-box">
              <div>Fabric: <strong>{fabricMode === "shop" ? find(fabricId)?.name : `Own — ${ownFabric}`}</strong></div>
              <div>Neck: <strong>{find(neckF)?.name} / {find(neckB)?.name}</strong></div>
              <div>Sleeve: <strong>{find(sleeve)?.name}</strong></div>
              <div>Decoration: <strong>{decor.map((id) => find(id)?.name).join(", ") || "None"}</strong></div>
              <div className="receipt-total"><span>Estimate</span><strong>{inr(estimate)}</strong></div>
            </div>

            <div className="pay-opts">
              <label className="pay-opt"><input type="radio" checked={refMode === "measurement"} onChange={() => setRefMode("measurement")} />📏 Use measurements</label>
              <label className="pay-opt"><input type="radio" checked={refMode === "reference_dress"} onChange={() => setRefMode("reference_dress")} />👗 Well-fitting reference dress</label>
            </div>
            {refMode === "measurement" ? (
              <>
                {measurements.length > 0 && (
                  <label>Saved measurements<select value={measId} onChange={(e) => setMeasId(e.target.value)}>
                    {measurements.map((m: any) => <option key={m.id} value={m.id}>{m.label} ({new Date(m.created_at).toLocaleDateString("en-IN")})</option>)}
                  </select></label>
                )}
                <p className="muted">Or enter fresh measurements:</p>
                <div className="meas-grid">
                  {MEAS_FIELDS.map((f) => (
                    <label key={f}>{f}<input value={newMeas[f] || ""} onChange={(e) => setNewMeas({ ...newMeas, [f]: e.target.value })} placeholder="inches" /></label>
                  ))}
                </div>
              </>
            ) : (
              <label>Reference dress note<textarea value={refDressNote} onChange={(e) => setRefDressNote(e.target.value)} rows={2} placeholder="e.g. Will bring my perfect-fit green kurti to the shop" /></label>
            )}

            <h3>Your details &amp; payment</h3>
            <label>Name<input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" /></label>
            <label>Phone<input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="98765 43210" /></label>
            <div className="pay-opts">
              <label className="pay-opt"><input type="radio" checked={pay === "cod"} onChange={() => setPay("cod")} />💵 Pay on pickup</label>
              <label className="pay-opt"><input type="radio" checked={pay === "online"} onChange={() => setPay("online")} />📱 UPI QR online</label>
            </div>
            {pay === "online" && (
              <div className="qr-box">
                {qr ? <Image src={qr} alt="UPI QR" width={200} height={200} className="qr-img" /> : <p className="muted">QR coming soon — please choose pay on pickup.</p>}
                <label>Upload payment screenshot<input type="file" accept="image/*" onChange={(e) => setProof(e.target.files?.[0] || null)} /></label>
                {proof && <small>Selected: {proof.name}</small>}
              </div>
            )}
            {error && <p className="form-err">{error}</p>}
            <button className="btn btn-primary btn-block btn-lg" disabled={loading} onClick={placeOrder}>
              {loading ? "Placing order…" : `Confirm Custom Order • ${inr(estimate)}`}
            </button>
          </>
        )}

        <div className="builder-nav">
          {step > 0 && <button className="btn btn-outline" onClick={() => setStep(step - 1)}>← Back</button>}
          {step < 5 && <button className="btn btn-primary" disabled={!canNext} onClick={() => setStep(step + 1)}>Next →</button>}
        </div>
      </div>

      <AuthModal mode={authMode} onClose={() => setAuthMode(null)} />
      {receipt && (
        <Receipt open onClose={() => setReceipt(null)} title="Custom Order Receipt"
          orderNo={receipt.id} date={new Date(receipt.created_at).toLocaleString("en-IN")}
          lines={receipt.lines} total={receipt.estimate} pay={receipt.payment_status} />
      )}
    </main>
  );
}
