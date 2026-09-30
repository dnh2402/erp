import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, UserRound } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { formatVnd, statusClass, statusNames } from "@/lib/types";

export const dynamic = "force-dynamic";

type CustomerDetail = {
  id: string; full_name: string; phone: string; email: string; created_at: string;
  orders: Array<{
    id: string; order_number: string; status: string; total: number; created_at: string;
    fulfillment_method: string; order_items: Array<{ quantity: number }>;
  }>;
};

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("customers").select("*,orders(id,order_number,status,total,created_at,fulfillment_method,order_items(quantity))").eq("id", id).maybeSingle();
  if (!data) notFound();
  const customer = data as unknown as CustomerDetail;
  const orders = [...customer.orders].sort((a, b) => b.created_at.localeCompare(a.created_at));
  const completed = orders.filter((order) => order.status === "COMPLETED");
  const spent = completed.reduce((total, order) => total + Number(order.total), 0);

  return <>
    <div className="page-heading">
      <div><Link href="/customers" className="cell-sub" style={{ display: "inline-flex", alignItems: "center", gap: 5, marginBottom: 8 }}><ArrowLeft size={12} /> Customers</Link><h1>{customer.full_name}</h1><p>Customer since {new Date(customer.created_at).toLocaleDateString("vi-VN")}</p></div>
      <span className="product-dot" style={{ width: 42, height: 42 }}><UserRound size={19} /></span>
    </div>
    <section className="kpi-grid" style={{ gridTemplateColumns: "repeat(4,minmax(0,1fr))" }}>
      <div className="kpi-card"><div className="kpi-top">Tổng đơn hàng</div><div className="kpi-value">{orders.length}</div></div>
      <div className="kpi-card"><div className="kpi-top">Hoàn tất</div><div className="kpi-value">{completed.length}</div></div>
      <div className="kpi-card"><div className="kpi-top">Tổng chi hoàn tất</div><div className="kpi-value" style={{ fontSize: 19 }}>{formatVnd(spent)}</div></div>
      <div className="kpi-card"><div className="kpi-top">Số điện thoại</div><div className="kpi-value" style={{ fontSize: 16 }}>{customer.phone}</div></div>
    </section>
    <div className="detail-layout" style={{ marginTop: 14 }}>
      <section className="detail-card"><h2>Thông tin khách hàng</h2><div className="detail-kv"><div><span>Họ tên</span><strong>{customer.full_name}</strong></div><div><span>Phone</span><strong>{customer.phone}</strong></div><div><span>Email</span><strong>{customer.email}</strong></div><div><span>Customer ID</span><strong>{customer.id}</strong></div></div></section>
      <section className="detail-card"><h2>Tình trạng đơn hàng</h2>{orders.slice(0, 7).map((order) => <div key={order.id} className="timeline-row"><span className="timeline-icon"><UserRound size={10} /></span><span><strong>{order.order_number}</strong><small>{new Date(order.created_at).toLocaleDateString("vi-VN")} · {order.order_items.reduce((n, item) => n + Number(item.quantity), 0)} món</small></span><span className={`status-badge ${statusClass(order.status)}`}>{statusNames[order.status]}</span></div>)}{!orders.length && <p className="cell-sub">Khách hàng chưa có đơn hàng.</p>}</section>
    </div>
    <section className="panel table-panel"><div className="panel-head"><div><h2>Lịch sử đơn hàng</h2><p>Doanh thu đã hoàn tất: {formatVnd(spent)}</p></div></div><div className="table-scroll"><table className="data-table"><thead><tr><th>Order</th><th>Date</th><th>Items</th><th>Fulfillment</th><th>Total</th><th>Status</th></tr></thead><tbody>{orders.map((order) => <tr key={order.id}><td><Link className="cell-main" href={`/orders/${order.id}`}>{order.order_number}</Link></td><td>{new Date(order.created_at).toLocaleDateString("vi-VN")}</td><td>{order.order_items.reduce((n, item) => n + Number(item.quantity), 0)}</td><td>{order.fulfillment_method}</td><td>{formatVnd(order.total)}</td><td><span className={`status-badge ${statusClass(order.status)}`}>{statusNames[order.status]}</span></td></tr>)}</tbody></table></div></section>
  </>;
}
