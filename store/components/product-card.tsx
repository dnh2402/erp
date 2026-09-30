import type { CSSProperties } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Product } from "@/lib/types";
import { formatVnd } from "@/lib/types";
import { ProductArt } from "@/components/product-art";

export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  return <Link href={`/products/${product.id}`} className="product-card" style={{ "--card-index": index } as CSSProperties}>
    <div className="product-card-art"><ProductArt category={product.category} /><span className="product-category">{product.category}</span><span className="product-arrow"><ArrowUpRight size={18}/></span></div>
    <div className="product-card-copy"><div><span className="product-sku">{product.sku}</span><h3>{product.name}</h3></div><strong>{formatVnd(Number(product.price))}</strong></div>
    <div className="product-card-foot"><span>{product.colors?.length ?? 0} phối màu</span><span>{product.available > 0 ? `${product.available} đôi sẵn sàng` : "Tạm hết hàng"}</span></div>
  </Link>;
}
