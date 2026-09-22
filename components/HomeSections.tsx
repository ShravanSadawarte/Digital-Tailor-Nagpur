"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { getSupabase } from "@/lib/supabase/client";
import { inr } from "@/components/Receipt";

export function ShopPreview() {
  const [products, setProducts] = useState<any[]>([]);
  useEffect(() => {
    getSupabase()
      ?.from("products")
      .select("*, categories(name)")
      .eq("available", true)
      .order("created_at", { ascending: false })
      .limit(4)
      .then(({ data }) => data && setProducts(data));
  }, []);
  if (products.length === 0) return null;
  return (
    <section className="section">
      <div className="container">
        <div className="sec-head">
          <div>
            <h2>Shop Collection</h2>
            <p className="muted">Ready-made outfits in sizes S to XXL.</p>
          </div>
          <Link href="/shop" className="btn btn-outline">
            View all →
          </Link>
        </div>
        <div className="product-grid mini">
          {products.map((p) => (
            <Link key={p.id} href="/shop" className="card product-card">
              {p.images?.[0] ? (
                <Image src={p.images[0]} alt={p.name} width={400} height={260} className="product-img" />
              ) : (
                <div className="product-ph">👗</div>
              )}
              <h3>{p.name}</h3>
              <div className="price-line">
                <strong>{inr(p.price)}</strong>
                {p.mrp ? <s>{inr(p.mrp)}</s> : null}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export function TransformationsPreview() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    getSupabase()
      ?.from("transformation_examples")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(3)
      .then(({ data }) => data && setRows(data));
  }, []);
  if (rows.length === 0) return null;
  return (
    <section className="section alt">
      <div className="container">
        <div className="sec-head">
          <div>
            <h2>Raw → Best</h2>
            <p className="muted">Your old sarees, reborn as new favourites.</p>
          </div>
          <Link href="/transformations" className="btn btn-outline">
            See all →
          </Link>
        </div>
        <div className="grid3">
          {rows.map((r) => (
            <Link key={r.id} href="/transformations" className="feature tf-mini">
              <div className="tf-mini-imgs">
                <span>🧵</span>
                <span className="tf-arrow">→</span>
                <span>👗</span>
              </div>
              <h3>{r.title}</h3>
              <p>{r.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export function BuilderCTA() {
  return (
    <section className="section">
      <div className="container">
        <div className="builder-cta">
          <div>
            <span className="pickup-tag">Custom Dress Builder</span>
            <h2>Design it stitch by stitch</h2>
            <p>
              Pick your fabric, neck, sleeves &amp; decoration — review the
              price live and order in minutes.
            </p>
          </div>
          <Link href="/builder" className="btn btn-primary btn-lg">
            Start building →
          </Link>
        </div>
      </div>
    </section>
  );
}

// EDIT: replace public/father.jpg with your father's photo (square works best).
// Until then a monogram placeholder shows automatically.
export function Craftsman() {
  const [imgOk, setImgOk] = useState(true);
  return (
    <section className="section alt" id="craftsman">
      <div className="container craftsman-grid">
        <div className="craftsman-photo">
          {imgOk ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src="/father.jpg" alt="Master tailor at work" onError={() => setImgOk(false)} />
          ) : (
            <div className="craftsman-ph">✂️<small>Add photo as public/father.jpg</small></div>
          )}
          <div className="craftsman-badge">25+ yrs of fitting</div>
        </div>
        <div>
          <span className="pickup-tag">Meet the masterji</span>
          <h2>The hands behind every stitch</h2>
          <p className="muted">
            For over 25 years, our masterji has stitched for Nagpur families —
            bridal trousseaus, festive kurtis, school uniforms and those
            last-minute function alterations that simply had to be perfect.
          </p>
          <ul className="contact-list">
            <li><strong>📏 Fitting-first:</strong> every outfit checked twice before delivery</li>
            <li><strong>🤝 Honest pricing:</strong> quoted upfront, no surprises later</li>
            <li><strong>⏰ On-time, every time:</strong> function-date delivery you can trust</li>
          </ul>
          <a href="#contact" className="btn btn-primary btn-lg" style={{ marginTop: 16 }}>
            Visit the shop
          </a>
        </div>
      </div>
    </section>
  );
}

export function OffersStrip() {
  const [offers, setOffers] = useState<any[]>([]);
  useEffect(() => {
    getSupabase()
      ?.from("offers")
      .select("*")
      .eq("active", true)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (!data) return;
        const today = new Date().toISOString().slice(0, 10);
        setOffers(
          data.filter(
            (o: any) =>
              (!o.valid_from || o.valid_from <= today) &&
              (!o.valid_to || o.valid_to >= today)
          )
        );
      });
  }, []);
  if (offers.length === 0) return null;
  return (
    <section className="section offers-sec">
      <div className="container">
        <h2>🎁 Offers &amp; Promotions</h2>
        <div className="offer-grid">
          {offers.map((o) => (
            <div key={o.id} className="card offer-card">
              {o.image_url ? (
                <Image src={o.image_url} alt={o.title} width={500} height={220} className="offer-img" />
              ) : (
                <div className="offer-ph">🎁</div>
              )}
              <h3>{o.title}</h3>
              <p className="muted">{o.description}</p>
              {o.conditions && <small className="offer-cond">* {o.conditions}</small>}
              {o.valid_to && <div className="offer-valid">Valid till {o.valid_to}</div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
