import type { CSSProperties } from "react";

export type IconName =
  | "scissors"
  | "spool"
  | "ruler"
  | "truck"
  | "needle"
  | "neckline"
  | "sleeve"
  | "spark"
  | "dress"
  | "bag"
  | "gift"
  | "pin"
  | "phone"
  | "mail"
  | "clock"
  | "check"
  | "user"
  | "home"
  | "search";

const PATHS: Record<IconName, React.ReactNode> = {
  scissors: (
    <>
      <circle cx="6" cy="6" r="2.6" />
      <circle cx="6" cy="18" r="2.6" />
      <path d="M8.3 7.9 20 19.5M8.3 16.1 20 4.5" />
    </>
  ),
  spool: (
    <>
      <path d="M8.5 3.5h7M8.5 20.5h7M10 3.5v17M14 3.5v17" />
      <path d="M10 8.5c3 2 4 3.5 4 3.5s-1 1.5-4 3.5" />
    </>
  ),
  ruler: (
    <>
      <path d="M3.5 17.5 17.5 3.5l3 3L6.5 20.5z" />
      <path d="M8.2 14.7l1.6 1.6M11.2 11.7l1.6 1.6M14.2 8.7l1.6 1.6" />
    </>
  ),
  truck: (
    <>
      <path d="M2.5 6.5h11.5V16H2.5zM14 10.5h3.8l4.2 4.2V16H14" />
      <circle cx="7" cy="18" r="1.8" />
      <circle cx="17" cy="18" r="1.8" />
    </>
  ),
  needle: (
    <>
      <path d="M4 20 14.5 9.5" />
      <circle cx="17.2" cy="6.8" r="2.3" />
      <path d="M4 20l-1.2 1.2" />
    </>
  ),
  neckline: (
    <>
      <path d="M6.5 4c.5 6 2.8 10 5.5 10s5-4 5.5-10" />
      <path d="M4 4h2.5M17.5 4H20" />
    </>
  ),
  sleeve: (
    <>
      <path d="M8.5 3.5h7l1.5 9.5-5 7.5-5-7.5z" />
      <path d="M8.5 8h7" />
    </>
  ),
  spark: (
    <path d="M12 2.5c.8 5.8 3 8.2 8.8 9-5.8.8-8 3.2-8.8 9-.8-5.8-3-8.2-8.8-9 5.8-.8 8-3.2 8.8-9z" />
  ),
  dress: (
    <>
      <path d="M9.5 3.5h5l-.8 5 3.8 12H6.5l3.8-12z" />
      <path d="M9.5 8h5" />
    </>
  ),
  bag: (
    <>
      <path d="M5.5 8h13l-1 12.5h-11z" />
      <path d="M9 8V6.5a3 3 0 0 1 6 0V8" />
    </>
  ),
  gift: (
    <>
      <rect x="4.5" y="10" width="15" height="10.5" rx="1" />
      <path d="M3.5 6.5h17V10h-17zM12 6.5V20.5" />
      <path d="M12 6.5C10.4 6.5 9 5.4 9 4.1c0-1.1 1.2-1.5 2-.7.9.9 1 3.1 1 3.1zm0 0c1.6 0 3-1.1 3-2.4 0-1.1-1.2-1.5-2-.7-.9.9-1 3.1-1 3.1z" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s6.8-6 6.8-10.8a6.8 6.8 0 1 0-13.6 0C5.2 15 12 21 12 21z" />
      <circle cx="12" cy="10" r="2.3" />
    </>
  ),
  phone: (
    <path d="M5.5 3.5h3.6l1.8 4.6-2.3 1.4a12.5 12.5 0 0 0 5.3 5.3l1.4-2.3 4.6 1.8v3.6a2 2 0 0 1-2.1 2.1A16.5 16.5 0 0 1 3.4 5.6a2 2 0 0 1 2.1-2.1z" />
  ),
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3.5 7.5 8.5 6 8.5-6" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.3" />
      <path d="M12 7.5V12l3.3 2" />
    </>
  ),
  check: <path d="m4.5 12.5 5 5 10-11" />,
  user: (
    <>
      <circle cx="12" cy="8" r="3.6" />
      <path d="M4.8 20c1.4-3.4 4.2-5 7.2-5s5.8 1.6 7.2 5" />
    </>
  ),
  home: (
    <>
      <path d="m4 11 8-7 8 7" />
      <path d="M6 9.5V20h12V9.5" />
      <path d="M10 20v-5h4v5" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4.5 4.5" />
    </>
  ),
};

/** Classic thin-stroke line icon. */
export function Icon({
  name,
  size = 20,
  className = "",
  style,
}: {
  name: IconName;
  size?: number;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <svg
      className={`icon ${className}`.trim()}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={style}
    >
      {PATHS[name]}
    </svg>
  );
}

/** Service-icon keys the admin can pick in /admin → Content. */
export const SERVICE_ICONS: { key: string; label: string }[] = [
  { key: "needle", label: "Needle (stitching)" },
  { key: "ruler", label: "Ruler (alteration)" },
  { key: "truck", label: "Van (doorstep)" },
  { key: "spool", label: "Spool (fabric)" },
  { key: "scissors", label: "Scissors (cutting)" },
  { key: "dress", label: "Gown (boutique)" },
];

const KNOWN = new Set<string>(SERVICE_ICONS.map((s) => s.key));

/** Renders an admin-chosen service icon; falls back to plain text for legacy values. */
export function ServiceIcon({ icon, size = 34 }: { icon: string; size?: number }) {
  if (KNOWN.has(icon)) return <Icon name={icon as IconName} size={size} />;
  return <span aria-hidden="true">{icon}</span>;
}

/** DT monogram medallion — classic image placeholder. */
export function MonoMark({ size = 72, label }: { size?: number; label?: string }) {
  return (
    <span className="mono-wrap" aria-hidden="true">
      <span className="mono" style={{ width: size, height: size, fontSize: size * 0.32 }}>
        DT
      </span>
      {label && <small className="mono-label">{label}</small>}
    </span>
  );
}

/** Scissors rule divider. */
export function Ornament() {
  return (
    <div className="ornament" aria-hidden="true">
      <span />
      <Icon name="scissors" size={18} />
      <span />
    </div>
  );
}
