import Link from "next/link";

/** Clean 404 — no stack traces, no path leakage. */
export default function NotFound() {
  return (
    <main className="container page" style={{ textAlign: "center", paddingTop: 70 }}>
      <h1 className="page-title">Page not found</h1>
      <p className="muted">
        This fitting room doesn&apos;t exist. Let&apos;s get you back to the shop.
      </p>
      <Link href="/" className="btn btn-primary btn-lg">
        Back to home
      </Link>
    </main>
  );
}
