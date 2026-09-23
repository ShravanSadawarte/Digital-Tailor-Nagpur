"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { getSupabase } from "@/lib/supabase/client";
import { inr } from "@/components/Receipt";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import { MonoMark, Icon } from "@/components/icons";
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
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [sheet, setSheet] = useState(false);

  useEffect(() => {
    if (!sheet) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSheet(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sheet]);

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

  const list = products.filter((p) => {
    const okCat =
      cat === "all" || (p as any).category_id === cat || p.categories?.name === cat;
    const okSize = size === "all" || p.sizes.includes(size);
    const needle = q.trim().toLowerCase();
    const okQ =
      !needle ||
      `${p.name} ${p.description || ""} ${p.categories?.name || ""}`
        .toLowerCase()
        .includes(needle);
    return okCat && okSize && okQ;
  });
  const activeFilters = (cat !== "all" ? 1 : 0) + (size !== "all" ? 1 : 0);
  const groups = (() => {
    const byName = new Map<string, Product[]>();
    list.forEach((p) => {
      const name = p.categories?.name || "Boutique";
      if (!byName.has(name)) byName.set(name, []);
      byName.get(name)!.push(p);
    });
    const ordered = cats.map((c) => c.name).filter((n) => byName.has(n));
    byName.forEach((_v, n) => {
      if (!ordered.includes(n)) ordered.push(n);
    });
    return ordered.map((name) => ({ name, items: byName.get(name)! }));
  })();
  const clearAll = () => {
    setCat("all");
    setSize("all");
    setQ("");
  };

  return (
    <main className="container page">
      <PageHero
        eyebrow="Ready to wear"
        title="Shop Collection"
        sub="Ready-made kurtis, suits, gowns & more — standard sizes S to XXL."
      />

      <div className="searchbar">
        <Icon name="search" size={20} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search kurtis, gowns, suits…"
          type="search"
          inputMode="search"
          enterKeyHint="search"
          aria-label="Search products"
          autoComplete="off"
        />
        {q && (
          <button className="search-x" onClick={() => setQ("")} aria-label="Clear search">
            ✕
          </button>
        )}
      </div>

      <div className="filters">
        <select value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Filter by category">
          <option value="all">All categories</option>
          {cats.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select value={size} onChange={(e) => setSize(e.target.value)} aria-label="Filter by size">
          <option value="all">All sizes</option>
          {["S", "M", "L", "XL", "XXL"].map((s) => (
            <option key={s} value={s}>
              Size {s}
            </option>
          ))}
        </select>
      </div>

      <div className="shop-tools">
        <button className="btn btn-outline filters-toggle" onClick={() => setSheet(true)}>
          Filters{activeFilters > 0 ? ` (${activeFilters})` : ""}
        </button>
        <p className="result-count" role="status">
          {loading ? "Loading…" : `${list.length} item${list.length === 1 ? "" : "s"}`}
        </p>
      </div>

      {sheet && (
        <div
          className="sheet-scrim"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSheet(false);
          }}
        >
          <div className="sheet" role="dialog" aria-modal="true" aria-label="Filters">
            <div className="sheet-grip" aria-hidden="true" />
            <div className="sheet-head">
              <h3>Filters{activeFilters > 0 ? ` (${activeFilters})` : ""}</h3>
              <button className="sheet-x" onClick={() => setSheet(false)} aria-label="Close filters">
                ✕
              </button>
            </div>
            <div className="sheet-filters">
              <select value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Filter by category">
                <option value="all">All categories</option>
                {cats.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <select value={size} onChange={(e) => setSize(e.target.value)} aria-label="Filter by size">
                <option value="all">All sizes</option>
                {["S", "M", "L", "XL", "XXL"].map((s) => (
                  <option key={s} value={s}>
                    Size {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="sheet-actions">
              <button className="btn btn-outline" onClick={clearAll}>
                Clear
              </button>
              <button className="btn btn-primary" onClick={() => setSheet(false)}>
                Show {list.length} item{list.length === 1 ? "" : "s"}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="product-grid" aria-hidden>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card skel skel-card" />
          ))}
        </div>
      )}

      {!loading && list.length === 0 && (
        <div className="empty-state">
          <p className="empty-title">No matches found</p>
          <p className="muted">Try a different search or clear your filters.</p>
          <button className="btn btn-outline" onClick={clearAll}>
            Clear search &amp; filters
          </button>
        </div>
      )}

      <div className="shop-groups">
        {groups.map((g) => (
          <section key={g.name} className="shop-cat">
            <div className="shop-cat-head">
              <h2>{g.name}</h2>
              <span>{g.items.length} item{g.items.length === 1 ? "" : "s"}</span>
            </div>
            <div className="product-grid shop-cat-grid">
              {g.items.map((p) => {
                const off = p.mrp && p.mrp > p.price ? Math.round((1 - p.price / p.mrp) * 100) : 0;
                return (
                <Reveal key={p.id}>
                <Link href={`/shop/${p.id}`} className="card product-card lift">
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
            <div className="price-line">
              <strong>{inr(p.price)}</strong>
              {p.mrp ? <s>{inr(p.mrp)}</s> : null}
              {p.stock <= 5 && p.stock > 0 && (
                <span className="stock-low">Only {p.stock} left!</span>
              )}
              {p.stock <= 0 && <span className="stock-out">Out of stock</span>}
            </div>
            </Link>
          </Reveal>
                );
              })}
            </div>
          </section>
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
