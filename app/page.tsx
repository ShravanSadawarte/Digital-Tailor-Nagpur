"use client";

import { useState } from "react";
import Hero from "@/components/Hero";
import Visit from "@/components/Visit";
import Marquee from "@/components/Marquee";
import Services from "@/components/Services";
import Contact from "@/components/Contact";
import AuthModal, { type AuthMode } from "@/components/AuthModal";
import {
  ShopPreview,
  TransformationsPreview,
  BuilderCTA,
  Craftsman,
  OffersStrip,
} from "@/components/HomeSections";

export default function Home() {
  const [authMode, setAuthMode] = useState<AuthMode | null>(null);

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
        <Contact />
      </main>
      <AuthModal mode={authMode} onClose={() => setAuthMode(null)} />
    </>
  );
}
