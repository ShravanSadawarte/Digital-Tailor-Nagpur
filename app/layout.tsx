import type { Metadata, Viewport } from "next";
import { Fraunces } from "next/font/google";
import { CartProvider } from "@/lib/cart";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BottomNav from "@/components/BottomNav";
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
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='22' fill='%23330C4B'/><g fill='none' stroke='%23E3A88A' stroke-width='6' stroke-linecap='round'><circle cx='30' cy='30' r='9'/><circle cx='30' cy='70' r='9'/><path d='M37 35 73 68M37 65 73 32'/></g></svg>",
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
          <BottomNav />
          <BackToTop />
        </CartProvider>
      </body>
    </html>
  );
}
