import type { Metadata } from "next";
import Link from "next/link";
import { CartProvider } from "@/components/cart-provider";
import { StoreHeader } from "@/components/store-header";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "DSEB — Move Different", template: "%s — DSEB" },
  description: "DSEB sneakers — chuyển động theo cách của bạn.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="vi"><body><CartProvider><StoreHeader/>{children}<footer className="store-footer"><Link href="/" className="footer-logo">DSEB</Link><span>MOVE DIFFERENT. EVERY DAY.</span><span>HÀ NỘI · VIỆT NAM</span><small>© 2026 DSEB ATHLETICS</small></footer></CartProvider></body></html>;
}
