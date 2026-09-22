"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { getSupabase } from "@/lib/supabase/client";
import PageHero from "@/components/PageHero";

type Example = {
  id: string;
  title: string;
  dress_type: string;
  description: string;
  before_image: string | null;
  after_image: string | null;
};

export default function TransformationsPage() {
  const [rows, setRows] = useState<Example[]>([]);

  useEffect(() => {
    getSupabase()
      ?.from("transformation_examples")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => data && setRows(data));
  }, []);

  return (
    <main className="container page">
      <PageHero
        eyebrow="Upcycle"
        title="Raw → Best Transformations"
        sub="See how sarees & old fabrics become stunning new outfits. Pick a design, then visit the shop with your own raw material!"
      />

      {rows.length === 0 && (
        <p className="muted">Examples coming soon!</p>
      )}

      <div className="tf-grid">
        {rows.map((r) => (
          <div key={r.id} className="card tf-card">
            <div className="tf-imgs">
              <div className="tf-side">
                {r.before_image ? (
                  <Image src={r.before_image} alt="Before" width={300} height={220} className="tf-img" />
                ) : (
                  <div className="tf-ph">🧵<small>Raw material</small></div>
                )}
                <span className="tf-tag">Before</span>
              </div>
              <div className="tf-arrow">→</div>
              <div className="tf-side">
                {r.after_image ? (
                  <Image src={r.after_image} alt="After" width={300} height={220} className="tf-img" />
                ) : (
                  <div className="tf-ph">👗<small>Finished dress</small></div>
                )}
                <span className="tf-tag tag-after">After</span>
              </div>
            </div>
            <div className="tf-type">{r.dress_type}</div>
            <h3>{r.title}</h3>
            <p className="muted">{r.description}</p>
            <Link
              href={`/builder?ref=${encodeURIComponent(r.title)}`}
              className="btn btn-primary btn-block"
            >
              Use this design in Dress Builder
            </Link>
          </div>
        ))}
      </div>
    </main>
  );
}
