import { requireAdmin } from "@/lib/auth";
import { ProductsTable } from "@/components/products-table";
import type { Product } from "@/lib/types";
export const dynamic="force-dynamic";
export default async function ProductsPage(){const {supabase}=await requireAdmin();const {data}=await supabase.from("products").select("id,sku,name,category,price,cost,on_hand,reserved,available").order("name");const products=(data??[]) as unknown as Product[];return <><div className="page-heading"><div><h1>Sản phẩm</h1><p>Catalog DSEB dùng chung với Store · giá bán và thông tin tồn kho trực tiếp từ Supabase.</p></div><span className="status-badge completed">{products.length} SKU</span></div><ProductsTable products={products}/></>}
