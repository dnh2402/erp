import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getProduct } from "@/lib/data";
import { ProductArt } from "@/components/product-art";
import { AddToCartForm } from "@/components/add-to-cart-form";
import { formatVnd } from "@/lib/types";

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const {id}=await params;const product=await getProduct(id);if(!product)notFound();
  return <main className="page-shell"><Link href="/products" className="text-link" style={{marginBottom:24,width:"fit-content"}}><ArrowLeft size={14}/> Tất cả sneakers</Link><section className="product-detail"><div className="detail-art"><ProductArt category={product.category} large/><span className="product-category">{product.category}</span></div><div className="detail-copy"><span className="detail-sku">{product.sku} · DSEB ORIGINAL</span><h1>{product.name}</h1><div className="detail-price">{formatVnd(Number(product.price))}</div><p className="description">{product.description}</p><AddToCartForm product={product}/></div></section></main>;
}
