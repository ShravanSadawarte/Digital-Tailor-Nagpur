"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getSupabase } from "@/lib/supabase/client";
import { useCart } from "@/lib/cart";
import { inr } from "@/components/Receipt";
import { MonoMark } from "@/components/icons";

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const [p, setP] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [img, setImg] = useState(0);
  const [size, setSize] = useState("");
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const { add } = useCart();

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) {
      setLoading(false);
      return;
    }
    sb.from("products")
      .select("*, categories(name)")
      .eq("id", id)
      .single()
      .then(({ data }) => {
        if (data) {
          setP(data);
          setSize(data.sizes?.[0] || "");
        }
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <main className="container page">
        <p className="muted">Loading…</p>
      </main>
    );
  }

  if (!p) {
    return (
      <main className="container page">
        <Link href="/shop" className="pdp-back">← Shop</Link>
        <h1 className="page-title">Not found</h1>
        <p className="muted">This item is no longer available.</p>
      </main>
    );
  }

  const off = p.mrp && p.mrp > p.price ? Math.round((1 - p.price / p.mrp) * 100) : 0;

  const addBag = () => {
    if (!size) return;
    add(
      { product_id: p.id, name: p.name, price: p.price, size, image: p.images?.[0] },
      qty
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <main className="container page">
      <Link href="/shop" className="pdp-back">← Shop</Link>
      <div className="pdp-grid">
        <div className="pdp-gallery">
          <div className="pdp-main">
            {p.images?.[img] ? (
              <Image src={p.images[img]} alt={p.name} width={700} height={700} className="pdp-img" priority />
            ) : (
              <div className="product-ph"><MonoMark size={76} /></div>
            )}
            {off > 0 && <span className="off-badge">{off}% off</span>}
          </div>
          {p.images?.length > 1 && (
            <div className="pdp-thumbs">
              {p.images.map((src: string, i: number) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setImg(i)}
                  aria-label={`View photo ${i + 1}`}
                  className="pdp-thumb-btn"
                >
                  <Image
                    src={src}
                    alt={`${p.name} photo ${i + 1}`}
                    width={120}
                    height={120}
                    className={`pdp-thumb${i === img ? " sel" : ""}`}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="pdp-info">
          <div className="product-cat">{p.categories?.name || "Boutique"}</div>
          <h1 className="page-title">{p.name}</h1>
          <div className="pdp-price">
            <strong>{inr(p.price)}</strong>
            {p.mrp ? <s>{inr(p.mrp)}</s> : null}
          </div>
          {p.description ? <p className="muted">{p.description}</p> : null}
          {p.stock <= 5 && p.stock > 0 && (
            <p className="stock-low">Only {p.stock} left!</p>
          )}
          {p.stock <= 0 && <p><span className="stock-out">Out of stock</span></p>}

          <div className="pdp-sec">Select size</div>
          <div className="size-row">
            {(p.sizes || []).map((s: string) => (
              <button
                key={s}
                type="button"
                className={`size-chip${size === s ? " sel" : ""}`}
                onClick={() => setSize(s)}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="pdp-sec">Quantity</div>
          <div className="qty">
            <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
            <span>{qty}</span>
            <button type="button" onClick={() => setQty((q) => Math.min(p.stock || 99, q + 1))}>+</button>
          </div>

          <div className="pdp-actions">
            <button
              type="button"
              className="btn btn-primary btn-lg btn-block"
              disabled={p.stock <= 0 || !size}
              onClick={addBag}
            >
              {added ? "Added ✓" : "Add to Bag"}
            </button>
            <Link href="/cart" className="btn btn-outline btn-lg btn-block">
              Go to Bag →
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
