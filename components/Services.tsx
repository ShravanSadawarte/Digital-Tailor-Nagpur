"use client";

import Reveal from "@/components/Reveal";

const ITEMS = [
  { icon: "👔", title: "Custom Stitching", text: "Shirts, pants, suits, blouses & kurtis stitched to your exact measurements." },
  { icon: "📏", title: "Alteration & Repair", text: "Fitting correction, length adjustment, zip replacement in 24 hours." },
  { icon: "🚚", title: "Doorstep Service", text: "Free pickup & delivery across Nagpur. Live order tracking on WhatsApp." },
];

export default function Services() {
  return (
    <section id="services" className="section">
      <div className="container">
        <Reveal>
          <span className="eyebrow">What we do</span>
          <h2>Our Services</h2>
          <p className="muted">
            Simple pricing, expert masterjis, perfect finishing.
          </p>
        </Reveal>
        <div className="grid3">
          {ITEMS.map((s, i) => (
            <Reveal key={s.title} delay={i * 90}>
              <div className="feature">
                <div className="f-icon">{s.icon}</div>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
