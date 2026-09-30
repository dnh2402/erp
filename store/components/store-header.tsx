"use client";
import Link from "next/link";
import { ArrowUpRight, Menu, ShoppingBag } from "lucide-react";
import { useCart } from "@/components/cart-provider";

export function StoreHeader() {
  const { count } = useCart();
  return <header className="store-header"><Link href="/" className="brand-mark" aria-label="DSEB trang chủ"><span>DSEB</span><i>®</i></Link><nav className="desktop-nav"><Link href="/products">SNEAKERS</Link><Link href="/#story">OUR MOTION</Link><Link href="/#locations">FLAGSHIP</Link></nav><div className="header-actions"><Link className="header-cta" href="/products">Khám phá bộ sưu tập <ArrowUpRight size={15}/></Link><Link className="bag-link" href="/cart" aria-label={`Giỏ hàng, ${count} sản phẩm`}><ShoppingBag size={20}/><span>{count}</span></Link><Link className="mobile-menu" href="/products" aria-label="Mở bộ sưu tập"><Menu size={22}/></Link></div></header>;
}
