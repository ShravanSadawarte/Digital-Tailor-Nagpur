"use client";

import { useEffect, useState } from "react";
import Hero from "@/components/Hero";
import Visit from "@/components/Visit";
import Marquee from "@/components/Marquee";
import Services from "@/components/Services";
import Booking from "@/components/Booking";
import Contact from "@/components/Contact";
import AuthModal, { type AuthMode } from "@/components/AuthModal";
import {
  ShopPreview,
  TransformationsPreview,
  BuilderCTA,
  Craftsman,
  OffersStrip,
} from "@/components/HomeSections";
import { getSupabase } from "@/lib/supabase/client";

export default function Home() {
  const [authMode, setAuthMode] = useState<AuthMode | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user.id ?? null);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user.id ?? null);
      if (session) setAuthMode(null);
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <>
      <main id="home">
        <Hero onSignup={() => setAuthMode("signup")} />
        <Marquee />
        <OffersStrip />
        <Services />
        <ShopPreview />
        <TransformationsPreview />
        <BuilderCTA />
        <Craftsman />
        <Visit />
        <Booking userId={userId} />
        <Contact />
      </main>
      <AuthModal mode={authMode} onClose={() => setAuthMode(null)} />
    </>
  );
}
