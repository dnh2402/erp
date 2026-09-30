"use client";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { Product } from "@/lib/types";
import { ProductCard } from "@/components/product-card";

export function ProductList({ products, initialCategory }: { products: Product[]; initialCategory?: string }) {
  const [query,setQuery]=useState(""); const [category,setCategory]=useState(initialCategory ?? "ALL"); const [sort,setSort]=useState("featured");
  const categories = useMemo(()=>[...new Set(products.map(p=>p.category))].sort(),[products]);
  const visible = useMemo(()=>products.filter(p=>(category==="ALL"||p.category===category)&&`${p.name} ${p.sku} ${p.category}`.toLowerCase().includes(query.toLowerCase())).sort((a,b)=>sort==="price-low"?Number(a.price)-Number(b.price):sort==="price-high"?Number(b.price)-Number(a.price):a.name.localeCompare(b.name)),[products,category,query,sort]);
  return <><div className="filter-bar"><label className="search-wrap"><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Tìm tên hoặc SKU..."/></label><select value={category} onChange={e=>setCategory(e.target.value)}><option value="ALL">Tất cả danh mục</option>{categories.map(c=><option key={c}>{c}</option>)}</select><select value={sort} onChange={e=>setSort(e.target.value)}><option value="featured">Sắp xếp: đề xuất</option><option value="price-low">Giá: thấp đến cao</option><option value="price-high">Giá: cao đến thấp</option></select><span className="results-count">{visible.length} SẢN PHẨM</span></div>{visible.length?<div className="product-grid">{visible.map((p,i)=><ProductCard key={p.id} product={p} index={i}/>)}</div>:<div className="empty-state"><strong>Không tìm thấy sản phẩm phù hợp</strong>Thử đổi tên, SKU hoặc danh mục tìm kiếm.</div>}</>;
}
