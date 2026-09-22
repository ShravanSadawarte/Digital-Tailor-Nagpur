"use client";

import Reveal from "@/components/Reveal";
import { useSiteContent } from "@/lib/content";

export default function Services() {
  const svc = useSiteContent<any>("services");
  const items = Array.isArray(svc.items) ? svc.items : [];
  return (
    <section id="services" className="section">
      <div className="container">
        <Reveal>
          <span className="eyebrow">{svc.eyebrow}</span>
          <h2>{svc.title}</h2>
          <p className="muted">{svc.sub}</p>
        </Reveal>
        <div className="grid3">
          {items.map((s: any, i: number) => (
            <Reveal key={s.title + i} delay={i * 90}>
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
