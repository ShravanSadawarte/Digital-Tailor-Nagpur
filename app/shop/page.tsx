"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { getSupabase } from "@/lib/supabase/client";
import { useCart } from "@/lib/cart";
import { inr } from "@/components/Receipt";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import { MonoMark } from "@/components/icons";
import { cached, TTL } from "@/lib/data-cache";

type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  mrp: number | null;
  images: string[];
  sizes: string[];
  stock: number;
  available: boolean;
  categories?: { name: string } | null;
};
type Category = { id: string; name: string; slug: string };

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [cat, setCat] = useState("all");
  const [size, setSize] = useState("all");
  const [picked, setPicked] = useState<Record<string, string>>({});
  const [added, setAdded] = useState("");
  const [loading, setLoading] = useState(true);
  const { add } = useCart();

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) {
      setLoading(false);
      return;
    }
    cached("catalog", "shop:categories", TTL.catalog, async () => {
      const { data, error } = await sb
        .from("categories")
        .select("*")
        .eq("kind", "product");
      if (error || !data) return [];
      return data;
    }).then((rows) => {
      if (rows.length > 0) setCats(rows);
    });
    cached("catalog", "shop:products", TTL.catalog, async () => {
      const { data, error } = await sb
        .from("products")
        .select("*, categories(name)")
        .eq("available", true)
        .order("created_at", { ascending: false });
      if (error || !data) return [];
      return data as Product[];
    }).then((rows) => {
      if (rows.length > 0) setProducts(rows);
      setLoading(false);
    });
  }, []);

  const list = products.filter(
    (p) =>
      (cat === "all" || (p as any).category_id === cat || p.categories?.name === cat) &&
      (size === "all" || p.sizes.includes(size))
  );

  const addToCart = (p: Product) => {
    const s = picked[p.id] || p.sizes[0];
    if (!s) return;
    add(
      { product_id: p.id, name: p.name, price: p.price, size: s, image: p.images?.[0] },
      1
    );
    setAdded(p.id);
    setTimeout(() => setAdded(""), 1500);
  };

  return (
    <main className="container page">
      <PageHero
        eyebrow="Ready to wear"
        title="Shop Collection"
        sub="Ready-made kurtis, suits, gowns & more — standard sizes S to XXL."
      />

      <div className="filters">
        <select value={cat} onChange={(e) => setCat(e.target.value)}>
          <option value="all">All categories</option>
          {cats.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select value={size} onChange={(e) => setSize(e.target.value)}>
          <option value="all">All sizes</option>
          {["S", "M", "L", "XL", "XXL"].map((s) => (
            <option key={s} value={s}>
              Size {s}
            </option>
          ))}
        </select>
      </div>

      {loading && (
        <div className="product-grid" aria-hidden>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card skel skel-card" />
          ))}
        </div>
      )}

      {!loading && list.length === 0 && (
        <p className="muted">No products yet — check back soon!</p>
      )}

      <div className="product-grid">
        {list.map((p) => {
          const off = p.mrp && p.mrp > p.price ? Math.round((1 - p.price / p.mrp) * 100) : 0;
          return (
          <Reveal key={p.id}>
          <div className="card product-card lift">
            <div className="product-media">
              {off > 0 && <span className="off-badge">{off}% off</span>}
              {p.images?.[0] ? (
                <Image
                  src={p.images[0]}
                  alt={p.name}
                  width={400}
                  height={300}
                  className="product-img"
                />
              ) : (
                <div className="product-ph"><MonoMark size={76} /></div>
              )}
            </div>
            <div className="product-cat">{p.categories?.name || "Boutique"}</div>
            <h3>{p.name}</h3>
            <p className="muted">{p.description}</p>
            <div className="price-line">
              <strong>{inr(p.price)}</strong>
              {p.mrp ? <s>{inr(p.mrp)}</s> : null}
              {p.stock <= 5 && p.stock > 0 && (
                <span className="stock-low">Only {p.stock} left!</span>
              )}
              {p.stock <= 0 && <span className="stock-out">Out of stock</span>}
            </div>
            <div className="size-row">
              {p.sizes.map((s) => (
                <button
                  key={s}
                  className={`size-chip${(picked[p.id] || p.sizes[0]) === s ? " sel" : ""}`}
                  onClick={() => setPicked({ ...picked, [p.id]: s })}
                >
                  {s}
                </button>
              ))}
            </div>
            <button
              className="btn btn-primary btn-block"
              disabled={p.stock <= 0}
              onClick={() => addToCart(p)}
            >
              {added === p.id ? "Added ✓" : "Add to Bag"}
            </button>
          </div>
          </Reveal>
          );
        })}
      </div>

      <div className="page-cta">
        <Link href="/cart" className="btn btn-outline btn-lg">
          Go to Bag →
        </Link>
      </div>
    </main>
  );
}
