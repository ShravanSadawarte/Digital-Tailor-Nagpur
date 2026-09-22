"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { getSupabase } from "@/lib/supabase/client";
import { inr } from "@/components/Receipt";
import Reveal from "@/components/Reveal";
import { useSiteContent } from "@/lib/content";
import { MonoMark } from "@/components/icons";

function offPct(price: number, mrp?: number | null) {
  if (!mrp || mrp <= price) return 0;
  return Math.round((1 - price / mrp) * 100);
}

export function ShopPreview() {
  const [products, setProducts] = useState<any[]>([]);
  const sec = useSiteContent<any>("sections");
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
        <Reveal>
        <div className="sec-head">
          <div>
            <span className="eyebrow">{sec.shop_eyebrow}</span>
            <h2>{sec.shop_title}</h2>
            <p className="muted">{sec.shop_sub}</p>
          </div>
          <Link href="/shop" className="btn btn-outline">
            View all →
          </Link>
        </div>
        </Reveal>
        <div className="product-grid mini">
          {products.map((p, i) => (
            <Reveal key={p.id} delay={Math.min(i, 3) * 80}>
            <Link href="/shop" className="card product-card lift">
              <div className="product-media">
                {offPct(p.price, p.mrp) > 0 && (
                  <span className="off-badge">{offPct(p.price, p.mrp)}% off</span>
                )}
                {p.images?.[0] ? (
                  <Image src={p.images[0]} alt={p.name} width={400} height={260} className="product-img" />
                ) : (
                  <div className="product-ph"><MonoMark size={76} /></div>
                )}
              </div>
              <h3>{p.name}</h3>
              <div className="price-line">
                <strong>{inr(p.price)}</strong>
                {p.mrp ? <s>{inr(p.mrp)}</s> : null}
              </div>
            </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function TransformationsPreview() {
  const [rows, setRows] = useState<any[]>([]);
  const sec = useSiteContent<any>("sections");
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
        <Reveal>
        <div className="sec-head">
          <div>
            <span className="eyebrow">{sec.tf_eyebrow}</span>
            <h2>{sec.tf_title}</h2>
            <p className="muted">{sec.tf_sub}</p>
          </div>
          <Link href="/transformations" className="btn btn-outline">
            See all →
          </Link>
        </div>
        </Reveal>
        <div className="grid3">
          {rows.map((r, i) => (
            <Reveal key={r.id} delay={Math.min(i, 2) * 90}>
            <Link href="/transformations" className="feature tf-mini">
              {r.before_image || r.after_image ? (
                <div className="tf-imgs tf-mini-photos">
                  <div className="tf-side">
                    {r.before_image ? (
                      <Image src={r.before_image} alt="Before" width={200} height={140} className="tf-img" />
                    ) : (
                      <div className="tf-ph"><MonoMark size={54} label="Raw" /></div>
                    )}
                    <span className="tf-tag">Before</span>
                  </div>
                  <span className="tf-arrow">→</span>
                  <div className="tf-side">
                    {r.after_image ? (
                      <Image src={r.after_image} alt="After" width={200} height={140} className="tf-img" />
                    ) : (
                      <div className="tf-ph"><MonoMark size={54} label="Stitched" /></div>
                    )}
                    <span className="tf-tag tag-after">After</span>
                  </div>
                </div>
              ) : (
                <div className="tf-mini-imgs tf-mini-words">
                  <span>Before</span>
                  <span className="tf-arrow">→</span>
                  <span>After</span>
                </div>
              )}
              <h3>{r.title}</h3>
              <p>{r.description}</p>
            </Link>
            </Reveal>
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
        <Reveal>
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
        </Reveal>
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
        <Reveal className="craftsman-photo">
          {imgOk ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src="/father.jpg" alt="Master tailor at work" onError={() => setImgOk(false)} />
          ) : (
            <div className="craftsman-ph"><MonoMark size={96} label="Masterji · 25 yrs" /></div>
          )}
          <div className="craftsman-badge">25+ yrs of fitting</div>
        </Reveal>
        <Reveal delay={120}>
        <div>
          <span className="pickup-tag">Meet the masterji</span>
          <h2>The hands behind every stitch</h2>
          <p className="muted">
            For over 25 years, our masterji has stitched for Nagpur families —
            bridal trousseaus, festive kurtis, school uniforms and those
            last-minute function alterations that simply had to be perfect.
          </p>
          <ul className="contact-list">
            <li><strong>Fitting-first:</strong> every outfit checked twice before delivery</li>
            <li><strong>Honest pricing:</strong> quoted upfront, no surprises later</li>
            <li><strong>On-time, every time:</strong> function-date delivery you can trust</li>
          </ul>
          <a href="#contact" className="btn btn-primary btn-lg" style={{ marginTop: 16 }}>
            Visit the shop
          </a>
        </div>
        </Reveal>
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
        <Reveal>
        <span className="eyebrow">Limited time</span>
        <h2>Offers &amp; Promotions</h2>
        </Reveal>
        <div className="offer-grid">
          {offers.map((o, i) => (
            <Reveal key={o.id} delay={Math.min(i, 2) * 90}>
            <div className="card offer-card lift">
              {o.image_url ? (
                <Image src={o.image_url} alt={o.title} width={500} height={220} className="offer-img" />
              ) : (
                <div className="offer-ph"><MonoMark size={72} /></div>
              )}
              <h3>{o.title}</h3>
              <p className="muted">{o.description}</p>
              {o.conditions && <small className="offer-cond">* {o.conditions}</small>}
              {o.valid_to && <div className="offer-valid">Valid till {o.valid_to}</div>}
            </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
