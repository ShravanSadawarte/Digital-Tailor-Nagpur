"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase/client";
import { cached, TTL } from "@/lib/data-cache";

// Demo bar — stays live until the admin publishes announcements from /admin → Top Bar.
const DEMO = "Free doorstep pickup across Nagpur • No advance payment • 48-hr delivery";

export default function Announcement() {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    try {
      if (window.localStorage.getItem("dt_ann_closed") === "1") setOpen(false);
    } catch {
      /* ignore */
    }
  }, []);

  const dismiss = () => {
    setOpen(false);
    try {
      window.localStorage.setItem("dt_ann_closed", "1");
    } catch {
      /* ignore */
    }
  };
  const [items, setItems] = useState<string[]>([]);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    cached("announcements", "active", TTL.announcements, async () => {
      const sb = getSupabase();
      if (!sb) return [];
      const { data, error } = await sb
        .from("announcements")
        .select("text")
        .eq("active", true)
        .order("created_at", { ascending: false });
      if (error || !data) return [];
      return data.map((r: any) => String(r.text)).filter(Boolean);
    }).then((texts) => {
      if (texts.length > 0) setItems(texts);
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
        onClick={dismiss}
      >
        ✕
      </button>
    </div>
  );
}
