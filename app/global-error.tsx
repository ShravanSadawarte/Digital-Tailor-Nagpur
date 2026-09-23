"use client";

/** Root-level crash fallback (replaces the whole app incl. layout). */
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", background: "#FBF3EC", color: "#330C4B" }}>
        <main style={{ maxWidth: 520, margin: "80px auto", padding: "0 20px", textAlign: "center" }}>
          <h1>Something went wrong</h1>
          <p style={{ color: "#8A648F" }}>
            The shop hit an unexpected problem. Please reload — your bag and
            account are safe.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <button
              onClick={() => reset()}
              style={{ padding: "12px 28px", borderRadius: 8, border: "none", cursor: "pointer", background: "#B9379D", color: "#fff", fontWeight: 700, fontSize: 16 }}
            >
              Reload
            </button>
            <a
              href="/"
              style={{ padding: "12px 28px", borderRadius: 8, border: "1.5px solid #EBD3BC", background: "#fff", color: "#330C4B", fontWeight: 700, fontSize: 16, textDecoration: "none" }}
            >
              Home
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
