"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase/client";

// Demo bar — stays live until the admin publishes announcements from /admin → Top Bar.
const DEMO = "🚚 Free doorstep pickup across Nagpur • No advance payment • 48-hr delivery";

export default function Announcement() {
  const [open, setOpen] = useState(true);
  const [items, setItems] = useState<string[]>([]);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    getSupabase()
      ?.from("announcements")
      .select("text")
      .eq("active", true)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (!error && data && data.length > 0) {
          setItems(data.map((r: any) => String(r.text)).filter(Boolean));
        }
      });
  }, []);

  useEffect(() => {
    if (items.length < 2) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % items.length), 5000);
    return () => clearInterval(t);
  }, [items.length]);

  if (!open) return null;
  const text = items.length > 0 ? items[idx % items.length] : DEMO;

  return (
    <div className="announce" role="note">
      <span key={idx}>{text}</span>
      <button
        className="announce-close"
        aria-label="Dismiss announcement"
        onClick={() => setOpen(false)}
      >
        ✕
      </button>
    </div>
  );
}
