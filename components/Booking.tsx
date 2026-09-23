"use client";

import { useState } from "react";
import { getSupabase } from "@/lib/supabase/client";
import { friendlyError } from "@/lib/client-error";

const SERVICES = [
  "Shirt",
  "Blouse",
  "Kurti",
  "Suit",
  "Alteration / Repair",
  "Other",
];

type Props = {
  userId: string | null;
};

export default function Booking({ userId }: Props) {
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMsg("");
    setError("");
    const form = e.currentTarget;
    const data = new FormData(form);

    const payload = {
      name: String(data.get("name") || "").trim(),
      phone: String(data.get("phone") || "").trim(),
      service: String(data.get("service") || SERVICES[0]),
      pickup_date: String(data.get("pickup_date") || "") || null,
      notes: String(data.get("notes") || "").trim() || null,
      user_id: userId,
      status: "pending",
    };

    const supabase = getSupabase();
    if (!supabase) {
      setMsg("Booking noted! (demo — connect Supabase to save it)");
      form.reset();
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("bookings").insert(payload);
    setLoading(false);

    if (error) {
      setError(friendlyError(error));
      return;
    }
    setMsg("Booking received! We will call you to confirm pickup.");
    form.reset();
  };

  return (
    <section id="booking" className="section">
      <div className="container contact-grid">
        <div>
          <span className="eyebrow">Doorstep pickup</span>
          <h2>Book a Stitching Order</h2>
          <p className="muted">
            Tell us what you need — we pick up from your doorstep anywhere in
            Nagpur.
          </p>
          <ul className="contact-list">
            <li>
              <strong>1.</strong> Fill the form with your service &amp; pickup
              day
            </li>
            <li>
              <strong>2.</strong> We call to confirm measurements &amp; price
            </li>
            <li>
              <strong>3.</strong> Free pickup → stitching → delivery in 48 hrs
            </li>
          </ul>
          {!userId && (
            <p className="muted" style={{ marginTop: 12 }}>
              Tip: sign up to track your bookings against your account.
            </p>
          )}
        </div>
        <form className="card form" onSubmit={handleSubmit}>
          <label>
            Name
            <input name="name" type="text" placeholder="Your name" required autoComplete="name" />
          </label>
          <label>
            Phone
            <input name="phone" type="tel" inputMode="tel" placeholder="98765 43210" required autoComplete="tel" />
          </label>
          <label>
            Service
            <select name="service" defaultValue={SERVICES[0]}>
              {SERVICES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label>
            Preferred pickup day
            <input name="pickup_date" type="date" />
          </label>
          <label>
            Notes (fabric, size, address)
            <textarea
              name="notes"
              rows={3}
              placeholder="e.g. 2 shirts, cotton fabric, pick up after 5pm"
            />
          </label>
          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? "Booking…" : "Confirm Booking"}
          </button>
          {msg && <p className="form-msg">{msg}</p>}
          {error && <p className="form-err">{error}</p>}
        </form>
      </div>
    </section>
  );
}
