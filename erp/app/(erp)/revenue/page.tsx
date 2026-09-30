import { requireAdmin } from "@/lib/auth";
import { formatVnd, oneRelation, type RevenueRow } from "@/lib/types";
import { RevenueChart } from "@/components/revenue-chart";

export const dynamic = "force-dynamic";

export default async function RevenuePage() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("revenue_transactions").select("id,order_id,amount,transaction_type,recognized_at,orders(order_number,customers(full_name))").order("recognized_at", { ascending: false });
  const rows = (data ?? []) as unknown as RevenueRow[];
  const total = rows.reduce((sum, row) => sum + Number(row.amount), 0);
  const thisMonth = new Date().toISOString().slice(0, 7);
  const current = rows.filter((row) => row.recognized_at.slice(0, 7) === thisMonth).reduce((sum, row) => sum + Number(row.amount), 0);
  const months = Array.from({ length: 12 }, (_, i) => {
    const date = new Date(); date.setDate(1); date.setMonth(date.getMonth() - (11 - i));
    const key = date.toISOString().slice(0, 7);
    return { label: date.toLocaleDateString("vi-VN", { month: "short" }), value: rows.filter((row) => row.recognized_at.slice(0, 7) === key).reduce((sum, row) => sum + Number(row.amount), 0) };
  });

  return <>
    <div className="page-heading"><div><h1>Doanh thu</h1><p>Chỉ giao dịch được ghi nhận sau khi khách xác nhận đã nhận hàng.</p></div><span className="status-badge completed">{rows.length} giao dịch hợp lệ</span></div>
    <section className="kpi-grid" style={{ gridTemplateColumns: "repeat(3,minmax(0,1fr))" }}>
      <div className="kpi-card"><div className="kpi-top">Tổng doanh thu ghi nhận</div><div className="kpi-value" style={{ fontSize: 20 }}>{formatVnd(total)}</div><div className="kpi-note">Tổng các revenue transaction</div></div>
      <div className="kpi-card"><div className="kpi-top">Tháng này</div><div className="kpi-value" style={{ fontSize: 20 }}>{formatVnd(current)}</div><div className="kpi-note">Tháng hiện tại · dữ liệu database</div></div>
      <div className="kpi-card"><div className="kpi-top">Giao dịch</div><div className="kpi-value">{rows.length}</div><div className="kpi-note">Mỗi completed order tối đa một giao dịch</div></div>
    </section>
    <div style={{ marginTop: 14 }}><RevenueChart months={months} /></div>
    <section className="panel table-panel"><div className="panel-head"><div><h2>Giao dịch doanh thu</h2><p>Tất cả dòng dưới đây đã hoàn tất.</p></div></div><div className="table-scroll"><table className="data-table"><thead><tr><th>Đơn hàng</th><th>Khách hàng</th><th>Ngày ghi nhận</th><th>Loại giao dịch</th><th>Số tiền</th></tr></thead><tbody>{rows.map((row) => {const order = oneRelation(row.orders);const customer = order ? oneRelation(order.customers) : null;return <tr key={row.id}><td className="cell-main">{order?.order_number ?? "—"}</td><td>{customer?.full_name ?? "—"}</td><td>{new Date(row.recognized_at).toLocaleString("vi-VN")}</td><td>{row.transaction_type}</td><td className="cell-main">{formatVnd(row.amount)}</td></tr>})}{!rows.length && <tr><td colSpan={5}>Chưa có doanh thu được ghi nhận.</td></tr>}</tbody></table></div></section>
  </>;
}
