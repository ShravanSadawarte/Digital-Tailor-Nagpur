"use client";

import Reveal from "@/components/Reveal";
import { useSiteContent } from "@/lib/content";

type Props = {
  onSignup: () => void;
};

const SERVICES = ["Shirts", "Blouses", "Kurtis", "Suits", "Alteration"];

const AVATARS = [
  { initial: "R", bg: "#711E7B", color: "#fff" },
  { initial: "S", bg: "#B9379D", color: "#fff" },
  { initial: "P", bg: "#E3A88A", color: "#330C4B" },
  { initial: "A", bg: "#51017C", color: "#fff" },
];

export default function Hero({ onSignup }: Props) {
  const hero = useSiteContent<any>("hero");
  const scrollToBooking = () => {
    document.getElementById("booking")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="hero hero-v2">
      <div className="container hero-grid">
        <Reveal className="hero-copy">
          <a href="#booking" className="hero-pill">
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
            Digital Tailor brings the masterji to your doorstep — custom
            stitching and 24-hour alterations across Nagpur, starting at
            just ₹199.
          </p>

          <div className="hero-ctas">
            <button
              className="btn btn-primary btn-lg hero-cta"
              onClick={scrollToBooking}
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

          <div className="hero-trust">
            <div className="avatars">
              {AVATARS.map((a) => (
                <span
                  key={a.initial}
                  className="avatar"
                  style={{ background: a.bg, color: a.color }}
                >
                  {a.initial}
                </span>
              ))}
              <span className="avatar avatar-more">5k+</span>
            </div>
            <div className="trust-text">
              <div className="stars">
                ★★★★★ <strong>{hero.score}</strong>
              </div>
              <span>{hero.customers}</span>
            </div>
          </div>
        </Reveal>

        <Reveal delay={140} className="hero-visual">
          <div className="hero-blob" aria-hidden />
          <div className="card pickup-card">
            <div className="pickup-head">
              <h3>Book your pickup</h3>
              <span className="pickup-tag">Free doorstep service</span>
            </div>
            <div className="chips">
              {SERVICES.map((s) => (
                <span key={s} className="chip">
                  {s}
                </span>
              ))}
            </div>
            <div className="price-row">
              <span>Stitching from</span>
              <strong>₹199</strong>
            </div>
            <button
              className="btn btn-primary btn-block"
              onClick={scrollToBooking}
            >
              Schedule pickup
            </button>
            <small>No advance payment • Pay on delivery</small>
          </div>

          <div className="float-card float-reviews">
            <div className="stars">★★★★★</div>
            <strong>{hero.score} / 5</strong>
            <span>{hero.reviews}</span>
          </div>

          <div className="float-card float-order">
            <div className="order-top">
              <span className="order-dot" />
              <strong>Order #DT-4821</strong>
            </div>
            <span>Out for delivery</span>
            <div className="progress">
              <div className="progress-bar" />
            </div>
          </div>
        </Reveal>
      </div>

      <div className="container">
        <Reveal delay={220}>
        <div className="hero-stats-bar">
          <div>
            <strong>{hero.orders}</strong>
            <span>{hero.orders_label}</span>
          </div>
          <div>
            <strong>{hero.rating}</strong>
            <span>{hero.rating_label}</span>
          </div>
          <div>
            <strong>{hero.delivery}</strong>
            <span>{hero.delivery_label}</span>
          </div>
          <div>
            <strong>{hero.express}</strong>
            <span>{hero.express_label}</span>
          </div>
        </div>
        </Reveal>
      </div>
    </section>
  );
}
