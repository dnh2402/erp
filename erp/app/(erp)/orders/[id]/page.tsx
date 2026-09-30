import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { formatVnd, oneRelation, statusClass, statusNames, type Related } from "@/lib/types";
import { OrderActions } from "@/components/order-actions";

export const dynamic = "force-dynamic";
type Contact = { full_name: string; phone: string; email: string };
type ProductInfo = { id: string; sku: string; name: string; category: string };
type HistoryEntry = { id: string; old_status: string | null; new_status: string; note: string; created_at: string };
type OrderDetail = {
  id: string; order_number: string; status: string; fulfillment_method: string; payment_method: string;
  shipping_address: Record<string, string> | null; pickup_store_id: string | null; subtotal: number; shipping_fee: number;
  total: number; revenue_recognized: boolean; created_at: string;
  customers: Related<Contact>;
  order_items: Array<{ id: string; size: string; color: string; quantity: number; unit_price: number; subtotal: number; products: Related<ProductInfo> }>;
  order_status_history: HistoryEntry[];
};

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("orders").select("*,customers(*),order_items(*,products(*)),order_status_history(*)").eq("id", id).maybeSingle();
  if (!data) notFound();
  const order = data as unknown as OrderDetail;
  const customer = oneRelation(order.customers);
  const history = [...order.order_status_history].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  return <>
    <div className="page-heading"><div><Link href="/orders" className="cell-sub" style={{ display: "inline-flex", alignItems: "center", gap: 5, marginBottom: 9 }}><ArrowLeft size={12} /> Tất cả đơn hàng</Link><h1>{order.order_number}</h1><p>{new Date(order.created_at).toLocaleString("vi-VN")} · {customer?.full_name}</p></div><span className={`status-badge ${statusClass(order.status)}`}>{statusNames[order.status] ?? order.status}</span></div>
    <div className="detail-layout">
      <div>
        <section className="detail-card"><h2>Sản phẩm trong đơn</h2><div className="table-scroll"><table className="data-table"><thead><tr><th>Sản phẩm</th><th>Size / màu</th><th>SL</th><th>Đơn giá</th><th>Thành tiền</th></tr></thead><tbody>{order.order_items.map((item) => {const product = oneRelation(item.products);return <tr key={item.id}><td><span className="cell-main">{product?.name}</span><div className="cell-sub">{product?.sku} · {product?.category}</div></td><td>{item.size} / {item.color}</td><td>{item.quantity}</td><td>{formatVnd(item.unit_price)}</td><td className="cell-main">{formatVnd(item.subtotal)}</td></tr>})}</tbody></table></div><div className="detail-kv" style={{ marginTop: 20 }}><div><span>Tạm tính</span><strong>{formatVnd(order.subtotal)}</strong></div><div><span>Giao hàng</span><strong>{order.shipping_fee ? formatVnd(order.shipping_fee) : "Miễn phí"}</strong></div><div><span>Tổng COD</span><strong>{formatVnd(order.total)}</strong></div><div><span>Doanh thu</span><strong>{order.revenue_recognized ? "Đã ghi nhận" : "Chưa ghi nhận"}</strong></div></div></section>
        <section className="detail-card"><h2>Khách hàng & giao nhận</h2><div className="detail-kv"><div><span>Họ tên</span><strong>{customer?.full_name}</strong></div><div><span>Điện thoại</span><strong>{customer?.phone}</strong></div><div><span>Email</span><strong>{customer?.email}</strong></div><div><span>Thanh toán</span><strong>COD · Tiền mặt</strong></div><div><span>Phương thức nhận</span><strong>{order.fulfillment_method === "SHIP" ? "Giao tận nơi" : "Nhận tại cửa hàng"}</strong></div>{order.shipping_address ? <div className="full"><span>Địa chỉ</span><strong>{order.shipping_address.full_name}<br />{order.shipping_address.street}<br />{order.shipping_address.ward}, {order.shipping_address.district}, {order.shipping_address.city}<br />{order.shipping_address.phone}</strong></div> : order.pickup_store_id ? <div className="full"><span>Điểm nhận hàng</span><strong>DSEB Flagship Store · National Economics University<br />207 Giải Phóng, Hà Nội</strong></div> : null}</div></section>
        <section className="detail-card"><h2>Ảnh hưởng tồn kho</h2>{order.order_items.map((item) => {const product = oneRelation(item.products);return <div key={item.id} style={{ padding: "8px 0", borderBottom: "1px solid #f0f2ee" }}><div className="detail-kv"><div><span>{product?.name}</span><strong>{item.quantity} unit(s) · size {item.size}</strong></div><div><span>Trạng thái</span><strong>{order.status === "COMPLETED" ? "On hand ↓ · Reserved ↓" : `Reserved +${item.quantity} · On hand unchanged`}</strong></div></div></div>})}<p className="cell-sub">Revenue recognized: {order.revenue_recognized ? "Yes" : "No — customer receipt is required first"}</p></section>
      </div>
      <div>
        <section className="detail-card"><h2>Tiến độ đơn</h2><div className="timeline">{history.map((entry) => <div className="timeline-row" key={entry.id}><span className="timeline-icon"><Check size={10} /></span><span><strong>{statusNames[entry.new_status] ?? entry.new_status}</strong><small>{entry.note}</small></span><time>{new Date(entry.created_at).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" })}</time></div>)}</div></section>
        <section className="detail-card"><h2>Hành động vận hành</h2><OrderActions orderId={order.id} status={order.status} /></section>
        <section className="detail-card"><h2>Ghi nhận doanh thu</h2><div className="detail-kv"><div><span>Trạng thái</span><strong><span className={`status-badge ${order.revenue_recognized ? "completed" : "pending"}`}>{order.revenue_recognized ? "COMPLETED" : "WAITING FOR RECEIPT"}</span></strong></div><div><span>Số tiền</span><strong>{order.revenue_recognized ? formatVnd(order.total) : "—"}</strong></div></div><p className="cell-sub">Chỉ xác nhận của khách từ trang tracking mới hoàn tất đơn COD.</p></section>
      </div>
    </div>
  </>;
}
