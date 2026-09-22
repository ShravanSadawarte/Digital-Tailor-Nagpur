"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { getSupabase } from "@/lib/supabase/client";
import { useCart } from "@/lib/cart";
import { inr } from "@/components/Receipt";

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
  const { add } = useCart();

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    sb.from("categories")
      .select("*")
      .eq("kind", "product")
      .then(({ data }) => data && setCats(data));
    sb.from("products")
      .select("*, categories(name)")
      .eq("available", true)
      .order("created_at", { ascending: false })
      .then(({ data }) => data && setProducts(data as Product[]));
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
      <h1 className="page-title">Shop Collection</h1>
      <p className="muted">
        Ready-made kurtis, suits, gowns &amp; more — standard sizes S to XXL.
      </p>

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

      {list.length === 0 && (
        <p className="muted">No products yet — check back soon!</p>
      )}

      <div className="product-grid">
        {list.map((p) => (
          <div key={p.id} className="card product-card">
            {p.images?.[0] ? (
              <Image
                src={p.images[0]}
                alt={p.name}
                width={400}
                height={300}
                className="product-img"
              />
            ) : (
              <div className="product-ph">👗</div>
            )}
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
        ))}
      </div>

      <div className="page-cta">
        <Link href="/cart" className="btn btn-outline btn-lg">
          Go to Bag →
        </Link>
      </div>
    </main>
  );
}
