"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/lib/cart";
import { Icon, type IconName } from "@/components/icons";

const TABS: { href: string; label: string; icon: IconName; match: (p: string) => boolean }[] = [
  { href: "/", label: "Home", icon: "home", match: (p) => p === "/" },
  { href: "/shop", label: "Shop", icon: "dress", match: (p) => p.startsWith("/shop") },
  { href: "/builder", label: "Builder", icon: "needle", match: (p) => p.startsWith("/builder") },
  { href: "/cart", label: "Bag", icon: "bag", match: (p) => p.startsWith("/cart") },
  { href: "/profile", label: "Account", icon: "user", match: (p) => p.startsWith("/profile") || p.startsWith("/admin") },
];

/** Mobile-only bottom tab bar (desktop uses the top navbar). */
export default function BottomNav() {
  const path = usePathname();
  const { count } = useCart();

  return (
    <nav className="bottom-nav" aria-label="Primary">
      {TABS.map((t) => {
        const active = t.match(path);
        return (
          <Link
            key={t.href + t.label}
            href={t.href}
            className={`bottom-tab${active ? " active" : ""}`}
            aria-current={active ? "page" : undefined}
          >
            <span className="bottom-ic">
              <Icon name={t.icon} size={23} />
              {t.href === "/cart" && count > 0 && (
                <span className="cart-count">{count}</span>
              )}
            </span>
            <span className="bottom-lb">{t.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
