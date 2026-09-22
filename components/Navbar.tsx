"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getSupabase } from "@/lib/supabase/client";
import { useCart } from "@/lib/cart";
import AuthModal, { type AuthMode } from "@/components/AuthModal";
import AdminPasscode from "@/components/AdminPasscode";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/transformations", label: "Designs" },
  { href: "/builder", label: "Dress Builder" },
  { href: "/#contact", label: "Contact" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [needPass, setNeedPass] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode | null>(null);
  const { count } = useCart();
  const path = usePathname();

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    sb.auth.getSession().then(({ data }) => {
      setEmail(data.session?.user.email ?? null);
      checkAdmin();
    });
    const { data: sub } = sb.auth.onAuthStateChange((_e, s) => {
      setEmail(s?.user.email ?? null);
      if (s) {
        setAuthMode(null);
        checkAdmin();
      } else {
        setIsAdmin(false);
        setNeedPass(false);
      }
    });
    return () => sub.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAdmin = async () => {
    const me = await fetch("/api/admin/auth").then((r) => r.json()).catch(() => null);
    setIsAdmin(!!me?.isAdmin);
    if (!me?.isAdmin) {
      const ch = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "challenge" }),
      }).then((r) => r.json()).catch(() => null);
      setNeedPass(!!ch?.adminRequired);
    } else {
      setNeedPass(false);
    }
  };

  const logout = async () => {
    await getSupabase()?.auth.signOut();
    await fetch("/api/admin/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "logout" }),
    });
    setEmail(null);
    setIsAdmin(false);
    setNeedPass(false);
    setOpen(false);
  };

  const isActive = (href: string) =>
    href === "/" ? path === "/" : path.startsWith(href);

  return (
    <>
      <header className="navbar">
        <div className="container nav-inner">
          <Link href="/" className="logo">
            <span className="logo-icon">✂️</span>
            <span className="logo-text">
              Digital Tailor <small>Nagpur</small>
            </span>
          </Link>

          <nav className="nav-links">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} className={isActive(l.href) ? "active" : ""}>
                {l.label}
              </Link>
            ))}
            {isAdmin && (
              <Link href="/admin" className={path.startsWith("/admin") ? "active" : ""}>
                Admin
              </Link>
            )}
          </nav>

          <div className="nav-actions">
            <Link href="/cart" className="cart-link" aria-label="Shopping bag">
              🛍️{count > 0 && <span className="cart-count">{count}</span>}
            </Link>
            {email ? (
              <>
                <Link href="/profile" className="user-email" title={email}>
                  👋 {email}
                </Link>
                <button className="btn btn-outline" onClick={logout}>
                  Logout
                </button>
              </>
            ) : (
              <>
                <button className="btn btn-outline" onClick={() => setAuthMode("login")}>
                  Login
                </button>
                <button className="btn btn-primary" onClick={() => setAuthMode("signup")}>
                  Sign Up
                </button>
              </>
            )}
          </div>

          <button className="hamburger" aria-label="Toggle menu" onClick={() => setOpen((v) => !v)}>
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>

        <div className={`mobile-menu${open ? " open" : ""}`}>
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)}>
              {l.label}
            </Link>
          ))}
          <Link href="/cart" onClick={() => setOpen(false)}>🛍️ Bag ({count})</Link>
          <Link href="/profile" onClick={() => setOpen(false)}>👤 My Profile</Link>
          {isAdmin && (
            <Link href="/admin" onClick={() => setOpen(false)}>⚙️ Admin</Link>
          )}
          <div className="mobile-actions">
            {email ? (
              <button className="btn btn-outline" onClick={logout}>
                Logout
              </button>
            ) : (
              <>
                <button className="btn btn-outline" onClick={() => { setOpen(false); setAuthMode("login"); }}>
                  Login
                </button>
                <button className="btn btn-primary" onClick={() => { setOpen(false); setAuthMode("signup"); }}>
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <AuthModal mode={authMode} onClose={() => setAuthMode(null)} />
      {needPass && email && !isAdmin && (
        <AdminPasscode onSuccess={() => { setNeedPass(false); setIsAdmin(true); }} />
      )}
    </>
  );
}
