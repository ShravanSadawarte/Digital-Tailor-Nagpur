"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase/client";

/** Demo content — live until the admin saves replacements from /admin → Content. */
export const CONTENT_DEFAULTS: Record<string, any> = {
  hero: {
    orders: "5000+",
    orders_label: "Orders delivered",
    rating: "4.9★",
    rating_label: "Average rating",
    delivery: "48hr",
    delivery_label: "Stitch to doorstep",
    express: "24hr",
    express_label: "Alterations express",
    score: "4.9",
    reviews: "2,300+ happy reviews",
    customers: "Loved by 5,000+ customers in Nagpur",
  },
  services: {
    eyebrow: "What we do",
    title: "Our Services",
    sub: "Simple pricing, expert masterjis, perfect finishing.",
    items: [
      { icon: "needle", title: "Custom Stitching", text: "Shirts, pants, suits, blouses & kurtis stitched to your exact measurements." },
      { icon: "ruler", title: "Alteration & Repair", text: "Fitting correction, length adjustment, zip replacement in 24 hours." },
      { icon: "truck", title: "Doorstep Service", text: "Free pickup & delivery across Nagpur. Live order tracking on WhatsApp." },
    ],
  },
  sections: {
    shop_eyebrow: "Ready to wear",
    shop_title: "Shop Collection",
    shop_sub: "Ready-made outfits in sizes S to XXL.",
    tf_eyebrow: "Upcycle",
    tf_title: "Raw → Best",
    tf_sub: "Your old sarees, reborn as new favourites.",
  },
};

const cache: Record<string, any> = {};

/** Live site content for one block; falls back to demo when unset/unreachable. */
export function useSiteContent<T = any>(key: string): T {
  const [val, setVal] = useState<T>(() => cache[key] ?? CONTENT_DEFAULTS[key]);
  useEffect(() => {
    if (cache[key]) {
      setVal(cache[key]);
      return;
    }
    getSupabase()
      ?.from("site_content")
      .select("value")
      .eq("key", key)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!error && data?.value && Object.keys(data.value).length > 0) {
          cache[key] = { ...CONTENT_DEFAULTS[key], ...data.value };
          setVal(cache[key]);
        }
      });
  }, [key]);
  return val as T;
}
