import type { Metadata } from "next";
import { getProducts } from "@/lib/data";
import { ProductList } from "@/components/product-list";

export const metadata: Metadata = { title: "Sneakers" };

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const [{ products, configured },params] = await Promise.all([getProducts(),searchParams]);
  return <main className="page-shell"><div className="page-title-row"><div><span className="section-kicker">DSEB / The collection</span><h1>FIND YOUR<br/>NEXT PAIR.</h1></div><p>Được thiết kế cho nhiều cách vận động. Tìm đúng đôi cho lịch trình và nhịp điệu của bạn.</p></div>
    {products.length ? <ProductList products={products} initialCategory={params.category}/> : <div className="empty-state"><strong>{configured?"Chưa có sản phẩm trong catalog":"Chưa kết nối Supabase"}</strong>{configured?"Chạy supabase/seed.sql để nạp 100 mẫu sneaker và dữ liệu demo.":"Sao chép store/.env.example thành store/.env.local, nhập thông tin Supabase, rồi chạy bộ SQL trong thư mục supabase/."}</div>}
  </main>;
}
