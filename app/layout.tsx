import type { Metadata, Viewport } from "next";
import { Fraunces } from "next/font/google";
import { CartProvider } from "@/lib/cart";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Announcement from "@/components/Announcement";
import BackToTop from "@/components/BackToTop";
import "./globals.css";

const display = Fraunces({
  subsets: ["latin"],
  weight: ["600", "700"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "Digital Tailor Nagpur - Home",
  description:
    "Digital Tailor Nagpur - Custom stitching, alteration & doorstep pickup for men and women.",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>✂️</text></svg>",
  },
};

export const viewport: Viewport = {
  themeColor: "#330C4B",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={display.variable}>
        <CartProvider>
          <Announcement />
          <Navbar />
          {children}
          <Footer />
          <BackToTop />
        </CartProvider>
      </body>
    </html>
  );
}
