"use client";

import { useEffect } from "react";

/** Last-resort catch for a crashed route segment. Never leaks internals. */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Logged for diagnostics only — never rendered.
    console.error("Route error:", error?.digest || error?.name || "unknown");
  }, [error]);

  return (
    <main className="container page" style={{ textAlign: "center", paddingTop: 70 }}>
      <h1 className="page-title">Something went wrong</h1>
      <p className="muted">
        This section hit an unexpected problem. Your data is safe — please try again.
      </p>
      <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
        <button className="btn btn-primary btn-lg" onClick={() => reset()}>
          Try again
        </button>
        <a className="btn btn-outline btn-lg" href="/">
          Back to home
        </a>
      </div>
    </main>
  );
}
