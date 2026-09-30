import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Box, PackageCheck } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { formatVnd, oneRelation, type Product, type Related } from "@/lib/types";
import { ProductArt } from "@/components/product-art";

export const dynamic = "force-dynamic";
type MovementRow = { id: string; movement_type: string; quantity: number; note: string; created_at: string; orders: Related<{ order_number: string; status: string }> };
type ProductOrderRow = {
  id: string; size: string; color: string; quantity: number; created_at: string;
  orders: Related<{ id: string; order_number: string; status: string; customers: Related<{ full_name: string }> }>;
};

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireAdmin();
  const [{ data: productData }, { data: movementData }, { data: recentOrderData }] = await Promise.all([
    supabase.from("products").select("*").eq("id", id).maybeSingle(),
    supabase.from("inventory_movements").select("*,orders(order_number,status)").eq("product_id", id).order("created_at", { ascending: false }).limit(12),
    supabase.from("order_items").select("*,orders(id,order_number,status,created_at,customers(full_name))").eq("product_id", id).order("created_at", { ascending: false }).limit(10),
  ]);
  if (!productData) notFound();
  const product = productData as unknown as Product;
  const movements = (movementData ?? []) as unknown as MovementRow[];
  const recentOrders = (recentOrderData ?? []) as unknown as ProductOrderRow[];
  const max = Math.max(1, Number(product.on_hand));

  return <>
    <div className="page-heading"><div><Link className="cell-sub" href="/products" style={{ display: "inline-flex", alignItems: "center", gap: 5, marginBottom: 8 }}><ArrowLeft size={12} /> Catalog</Link><h1>{product.name}</h1><p>{product.sku} · {product.category}</p></div><span className={`status-badge ${product.available < 1 ? "out-of-stock" : product.available < 10 ? "low-stock" : "completed"}`}>{product.available < 1 ? "Out of stock" : product.available < 10 ? "Low stock" : "Healthy"}</span></div>
    <div className="detail-layout">
      <div>
        <section className="detail-card"><div className="erp-product-visual"><ProductArt category={product.category}/><span>{product.category} · DSEB ORIGINAL</span></div><div style={{ display: "flex", alignItems: "center", gap: 12 }}><span className="product-dot" style={{ width: 46, height: 46, borderRadius: 10 }}><Box size={21} /></span><div><span className="cell-sub">{product.sku}</span><h2 style={{ margin: "4px 0" }}>{product.name}</h2></div></div><p style={{ fontSize: 11, lineHeight: 1.8, color: "var(--muted)" }}>{product.description}</p><div className="detail-kv"><div><span>Danh mục</span><strong>{product.category}</strong></div><div><span>Giá bán</span><strong>{formatVnd(product.price)}</strong></div><div><span>Giá vốn</span><strong>{formatVnd(product.cost ?? 0)}</strong></div><div><span>Biên gộp</span><strong>{formatVnd(Number(product.price) - Number(product.cost ?? 0))}</strong></div><div className="full"><span>Size có sẵn</span><strong>{product.sizes?.join(" · ")}</strong></div><div className="full"><span>Màu sắc</span><strong>{product.colors?.join(" · ")}</strong></div></div></section>
        <section className="detail-card"><h2>Đơn hàng gần đây có sản phẩm này</h2><div className="table-scroll"><table className="data-table"><thead><tr><th>Đơn hàng</th><th>Khách hàng</th><th>Ngày</th><th>Size / màu</th><th>SL</th><th>Trạng thái</th></tr></thead><tbody>{recentOrders.map((row) => {const order = oneRelation(row.orders);const customer = order ? oneRelation(order.customers) : null;return <tr key={row.id}><td><Link className="cell-main" href={`/orders/${order?.id}`}>{order?.order_number}</Link></td><td>{customer?.full_name ?? "—"}</td><td>{new Date(row.created_at).toLocaleDateString("vi-VN")}</td><td>{row.size} / {row.color}</td><td>{row.quantity}</td><td>{order?.status}</td></tr>})}{!recentOrders.length && <tr><td colSpan={6}>Chưa có lịch sử bán hàng.</td></tr>}</tbody></table></div></section>
      </div>
      <div>
        <section className="detail-card"><h2>Tình trạng tồn kho</h2><div className="detail-kv"><div><span>On hand</span><strong>{product.on_hand} units</strong></div><div><span>Reserved</span><strong>{product.reserved} units</strong></div><div><span>Available</span><strong>{product.available} units</strong></div><div><span>Stock cover</span><strong>{product.on_hand ? Math.round(product.available / product.on_hand * 100) : 0}%</strong></div></div><div className={`inventory-bar ${product.available < 10 ? "low" : ""}`}><span style={{ width: `${product.on_hand ? Math.max(2, Math.min(100, product.available / max * 100)) : 0}%` }} /></div><p className="cell-sub">Reserved stock stays on hand until receipt confirmation.</p></section>
        <section className="detail-card"><h2><PackageCheck size={14} /> Lịch sử điều chuyển</h2><div className="timeline">{movements.map((movement) => <div className="timeline-row" key={movement.id}><span className="timeline-icon"><PackageCheck size={10} /></span><span><strong>{movement.movement_type.replaceAll("_", " ")} · {movement.quantity}</strong><small>{movement.note}</small></span><time>{new Date(movement.created_at).toLocaleDateString("vi-VN")}</time></div>)}{!movements.length && <p className="cell-sub">Chưa có lịch sử điều chuyển.</p>}</div></section>
      </div>
    </div>
  </>;
}
