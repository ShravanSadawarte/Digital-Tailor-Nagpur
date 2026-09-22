"use client";

import { useEffect, useState } from "react";
import Reveal from "@/components/Reveal";
import { useSiteContent } from "@/lib/content";
import { Icon, MonoMark } from "@/components/icons";

type Props = {
  onSignup: () => void;
};

/** Animated number: counts 0 → target once mounted (e.g. "5000+", "4.9★", "48hr"). */
function Count({ text }: { text: string }) {
  const [out, setOut] = useState(text);
  useEffect(() => {
    const m = String(text).match(/^([\d.]+)(.*)$/);
    if (!m) {
      setOut(text);
      return;
    }
    const target = parseFloat(m[1]);
    const suffix = m[2];
    const decimals = (m[1].split(".")[1] || "").length;
    const dur = 1500;
    let raf = 0;
    const t0 = performance.now() + 350;
    const tick = (t: number) => {
      const p = Math.min(1, Math.max(0, (t - t0) / dur));
      const e = 1 - Math.pow(1 - p, 3);
      setOut((target * e).toFixed(decimals) + suffix);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [text]);
  return <>{out}</>;
}

export default function Hero({ onSignup }: Props) {
  const hero = useSiteContent<any>("hero");
  const scrollToContact = () => {
    document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="hero hero-v2">
      <div className="container hero-grid">
        <Reveal className="hero-copy">
          <a href="#contact" className="hero-pill">
            <span className="pulse-dot" />
            Now accepting orders in Nagpur
            <span className="pill-arrow">→</span>
          </a>

          <h1>
            Perfect fit,
            <br />
            <em>stitched for you.</em>
          </h1>

          <p className="hero-sub">
            Stitch what you want, wear what you want.{" "}
            <span className="hero-only">Only in Nagpur.</span>
          </p>

          <div className="hero-ctas">
            <button
              className="btn btn-primary btn-lg hero-cta"
              onClick={scrollToContact}
            >
              Book free pickup <span aria-hidden>→</span>
            </button>
            <a href="#services" className="btn btn-outline btn-lg">
              Explore services
            </a>
          </div>

          <button className="hero-signup-link" onClick={onSignup}>
            New here? Create a free account
          </button>

          <a
            className="hero-loc"
            href="https://www.google.com/maps/search/?api=1&query=26B%2C%20Hanuman%20Society%2C%20Vaishali%20Nagar%2C%20Nagpur%2C%20Maharashtra%20440017"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Icon name="pin" size={15} /> 26B, Hanuman Society, Vaishali Nagar, Nagpur 440017
          </a>
        </Reveal>

        <Reveal delay={140} className="hero-visual">
          <div className="hero-blob" aria-hidden />
          <div className="hero-fashion">
            {hero.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={hero.image_url} alt="Latest fashion at Digital Tailor" />
            ) : (
              <div className="hero-fashion-empty">
                <MonoMark size={88} />
                <small>Latest fashion photo</small>
                <span>Add it in Admin → Content</span>
              </div>
            )}
            <span className="hero-fashion-tag">New arrival</span>
          </div>
        </Reveal>
      </div>

      <div className="container">
        <Reveal delay={220}>
        <div className="hero-stats-bar">
          <div>
            <strong><Count text={hero.orders} /></strong>
            <span>{hero.orders_label}</span>
          </div>
          <div>
            <strong><Count text={hero.rating} /></strong>
            <span>{hero.rating_label}</span>
          </div>
          <div>
            <strong><Count text={hero.delivery} /></strong>
            <span>{hero.delivery_label}</span>
          </div>
          <div>
            <strong><Count text={hero.express} /></strong>
            <span>{hero.express_label}</span>
          </div>
        </div>
        </Reveal>
      </div>
    </section>
  );
}
