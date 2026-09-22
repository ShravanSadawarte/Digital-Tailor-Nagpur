"use client";

import { useState } from "react";

export default function Announcement() {
  const [open, setOpen] = useState(true);
  if (!open) return null;
  return (
    <div className="announce" role="note">
      🚚 <strong>Free doorstep pickup</strong> across Nagpur &nbsp;•&nbsp; No
      advance payment &nbsp;•&nbsp; 48-hr delivery
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
