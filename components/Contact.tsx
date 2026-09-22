"use client";

import { useState } from "react";
import { getSupabase } from "@/lib/supabase/client";
import { Icon } from "@/components/icons";

export default function Contact() {
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMsg("");
    setError("");
    const form = e.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const phone = String(data.get("phone") || "").trim();
    const message = String(data.get("message") || "").trim();

    const supabase = getSupabase();
    if (!supabase) {
      setMsg("Thanks! We will call you back soon. (demo — connect Supabase to save)");
      form.reset();
      return;
    }

    setLoading(true);
    const { error } = await supabase
      .from("contact_messages")
      .insert({ name, phone, message });
    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }
    setMsg("Thanks! We will call you back soon.");
    form.reset();
  };

  return (
    <section id="contact" className="section alt">
      <div className="container contact-grid">
        <div>
          <span className="eyebrow">Get in touch</span>
          <h2>Contact Us</h2>
          <p className="muted">
            Have questions about fitting, pricing or bulk orders? Reach out.
          </p>
          <ul className="contact-list">
            <li>
              <Icon name="pin" size={17} />
              <span><strong>Address:</strong> 26B, Hanuman Society, Vaishali Nagar, Nagpur, Maharashtra 440017</span>
            </li>
            <li>
              <Icon name="phone" size={17} />
              <span><strong>Phone:</strong> +91 98765 43210</span>
            </li>
            <li>
              <Icon name="mail" size={17} />
              <span><strong>Email:</strong> hello@digitaltailor.in</span>
            </li>
            <li>
              <Icon name="clock" size={17} />
              <span><strong>Hours:</strong> Mon–Sat, 10am – 8pm</span>
            </li>
          </ul>
        </div>
        <form className="card form" onSubmit={handleSubmit}>
          <label>
            Name
            <input name="name" type="text" placeholder="Your name" required />
          </label>
          <label>
            Phone
            <input name="phone" type="tel" placeholder="98765 43210" required />
          </label>
          <label>
            Message
            <textarea
              name="message"
              rows={4}
              placeholder="How can we help?"
              required
            />
          </label>
          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? "Sending…" : "Send Message"}
          </button>
          {msg && <p className="form-msg">{msg}</p>}
          {error && <p className="form-err">{error}</p>}
        </form>
      </div>
    </section>
  );
}
