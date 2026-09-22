"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Services from "@/components/Services";
import Booking from "@/components/Booking";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import AuthModal, { type AuthMode } from "@/components/AuthModal";
import { getSupabase } from "@/lib/supabase/client";

export default function Home() {
  const [authMode, setAuthMode] = useState<AuthMode | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user.id ?? null);
      setUserEmail(data.session?.user.email ?? null);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user.id ?? null);
      setUserEmail(session?.user.email ?? null);
      if (session) setAuthMode(null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await getSupabase()?.auth.signOut();
    setUserId(null);
    setUserEmail(null);
  };

  return (
    <>
      <Navbar
        userEmail={userEmail}
        onLogin={() => setAuthMode("login")}
        onSignup={() => setAuthMode("signup")}
        onLogout={handleLogout}
      />
      <main id="home">
        <Hero onSignup={() => setAuthMode("signup")} />
        <Services />
        <Booking userId={userId} />
        <Contact />
      </main>
      <Footer />
      <AuthModal mode={authMode} onClose={() => setAuthMode(null)} />
    </>
  );
}
