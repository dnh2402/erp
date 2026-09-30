import Link from "next/link";
import { ArrowUpRight, Boxes, CheckCircle2, Clock3, PackageSearch, ShoppingBag, Truck, UsersRound, Wallet } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { formatVnd, oneRelation, statusClass, statusNames, type Related } from "@/lib/types";
import { DashboardCharts, InventoryDistribution, SalesByCategory, TopProducts } from "@/components/dashboard-charts";

type DashboardOrder = {
  id: string; order_number: string; status: string; total: number; created_at: string; payment_method?: string;
  customers: Related<{ full_name: string; phone: string }>;
  order_items: Array<{ quantity: number }>;
};
type StockRecord = { id: string; name: string; category: string; on_hand: number; reserved: number; available: number };
type RevenueRecord = { amount: number; recognized_at: string };
type SaleRecord = { quantity: number; subtotal: number; products: Related<{ name: string; category: string }> };

function seriesFor(rows: Array<{ timestamp: string; value: number }>, days = 14) {
  const now = new Date();
  return Array.from({ length: days }, (_, i) => {
    const day = new Date(now); day.setDate(now.getDate() - (days - 1 - i));
    const iso = day.toISOString().slice(0, 10);
    const value = rows.filter((row) => row.timestamp.slice(0, 10) === iso).reduce((total, row) => total + row.value, 0);
    return { label: day.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" }), value };
  });
}

export default async function DashboardPage() {
  const { supabase } = await requireAdmin();
  const [{ data: ordersData }, { data: productsData }, { count: customerCount }, { data: revenueData }, { data: salesData }] = await Promise.all([
    supabase.from("orders").select("id,order_number,status,total,created_at,payment_method,customers(full_name,phone),order_items(quantity)").order("created_at", { ascending: false }),
    supabase.from("products").select("id,on_hand,reserved,available,category,name,price"),
    supabase.from("customers").select("id", { count: "exact", head: true }),
    supabase.from("revenue_transactions").select("amount,recognized_at").order("recognized_at"),
    supabase.from("order_items").select("quantity,subtotal,products(name,category),orders!inner(status)").eq("orders.status", "COMPLETED"),
  ]);
  const orders = (ordersData ?? []) as unknown as DashboardOrder[];
  const products = (productsData ?? []) as unknown as StockRecord[];
  const revenue = (revenueData ?? []) as unknown as RevenueRecord[];
  const sales = (salesData ?? []) as unknown as SaleRecord[];
  const count = (status: string) => orders.filter((order) => order.status === status).length;
  const onHand = products.reduce((total, product) => total + Number(product.on_hand), 0);
  const reserved = products.reduce((total, product) => total + Number(product.reserved), 0);
  const available = products.reduce((total, product) => total + Number(product.available), 0);
  const recognized = revenue.reduce((total, row) => total + Number(row.amount), 0);
  const revenueSeries = seriesFor(revenue.map((row) => ({ timestamp: row.recognized_at, value: Number(row.amount) })));
  const orderSeries = seriesFor(orders.map((order) => ({ timestamp: order.created_at, value: 1 })));

  const topMap = new Map<string, { name: string; category: string; quantity: number; revenue: number }>();
  const categoryMap = new Map<string, { category: string; quantity: number; revenue: number }>();
  for (const row of sales) {
    const product = oneRelation(row.products);
    if (!product) continue;
    const current = topMap.get(product.name) ?? { name: product.name, category: product.category, quantity: 0, revenue: 0 };
    current.quantity += Number(row.quantity);
    current.revenue += Number(row.subtotal);
    topMap.set(product.name, current);
    const category = categoryMap.get(product.category) ?? { category: product.category, quantity: 0, revenue: 0 };
    category.quantity += Number(row.quantity);
    category.revenue += Number(row.subtotal);
    categoryMap.set(product.category, category);
  }
  const topProducts = [...topMap.values()].sort((a, b) => b.quantity - a.quantity);
  const categorySales = [...categoryMap.values()].sort((a, b) => b.quantity - a.quantity);
  const stockDistribution = {
    healthy: products.filter((product) => product.available >= 10).length,
    low: products.filter((product) => product.available > 0 && product.available < 10).length,
    out: products.filter((product) => product.available === 0).length,
  };
  const cards = [
    { label: "Tổng đơn hàng", value: orders.length, note: `${count("PENDING")} đơn đang chờ`, icon: ShoppingBag },
    { label: "Khách hàng", value: customerCount ?? 0, note: "Hồ sơ khách đã tạo", icon: UsersRound },
    { label: "Sản phẩm", value: products.length, note: "Trong catalog DSEB", icon: PackageSearch },
    { label: "Chờ xử lý", value: count("PENDING") + count("CONFIRMED") + count("PROCESSING"), note: `${count("PROCESSING")} đang chuẩn bị`, icon: Clock3 },
    { label: "Đang giao / đã giao", value: count("SHIPPED") + count("DELIVERED"), note: `${count("DELIVERED")} đã giao`, icon: Truck },
    { label: "Đơn hoàn tất", value: count("COMPLETED"), note: "Đã xác nhận nhận hàng", icon: CheckCircle2 },
    { label: "Doanh thu ghi nhận", value: formatVnd(recognized), note: `${revenue.length} giao dịch hoàn tất`, icon: Wallet },
    { label: "Tồn kho · On hand", value: onHand.toLocaleString("vi-VN"), note: "Đơn vị sản phẩm", icon: Boxes },
    { label: "Đã giữ · Reserved", value: reserved.toLocaleString("vi-VN"), note: `${available.toLocaleString("vi-VN")} còn khả dụng`, icon: Boxes },
  ];

  return <>
    <div className="page-heading"><div><h1>Tổng quan</h1><p>Theo dõi hoạt động DSEB hôm nay và nhịp vận hành gần đây.</p></div><div className="heading-actions"><span className="status-badge completed">DỮ LIỆU SUPABASE LIVE</span></div></div>
    <section className="kpi-grid">{cards.map(({ label, value, note, icon: Icon }) => <article className="kpi-card" key={label}><div className="kpi-top"><span>{label}</span><i className="kpi-icon"><Icon size={14} /></i></div><div className="kpi-value">{value}</div><div className="kpi-note">{note}</div></article>)}</section>
    <DashboardCharts revenue={revenueSeries} orders={orderSeries} />
    <div className="dashboard-grid">
      <TopProducts items={topProducts} />
      <section className="panel"><div className="panel-head"><div><h2>Tồn kho hiện tại</h2><p>On hand · đã giữ · khả dụng</p></div><Link href="/inventory">Chi tiết <ArrowUpRight size={12} /></Link></div><div className="detail-card" style={{ border: 0, boxShadow: "none", margin: 0, padding: "4px 18px 18px" }}><div className="detail-kv"><div><span>On hand</span><strong>{onHand.toLocaleString("vi-VN")} units</strong></div><div><span>Reserved</span><strong>{reserved.toLocaleString("vi-VN")} units</strong></div><div><span>Available</span><strong>{available.toLocaleString("vi-VN")} units</strong></div><div><span>Low stock</span><strong className="low-stock-number">{products.filter((product) => product.available > 0 && product.available < 10).length} SKU</strong></div></div><div className="inventory-bar"><span style={{ width: `${onHand ? Math.max(5, Math.min(100, available / onHand * 100)) : 0}%` }} /></div><div className="cell-sub">Thanh khả dụng thể hiện tỷ lệ chưa được dành cho đơn hàng.</div></div></section>
    </div>
    <div className="dashboard-grid"><SalesByCategory items={categorySales}/><InventoryDistribution counts={stockDistribution}/></div>
    <section className="panel table-panel"><div className="panel-head"><div><h2>Đơn hàng gần đây</h2><p>Dữ liệu được cập nhật tự động mỗi 3 giây</p></div><Link href="/orders">Tất cả đơn hàng <ArrowUpRight size={12} /></Link></div><div className="table-scroll"><table className="data-table"><thead><tr><th>Đơn hàng</th><th>Khách hàng</th><th>Ngày tạo</th><th>Số mặt hàng</th><th>Tổng tiền</th><th>Trạng thái</th></tr></thead><tbody>{orders.slice(0, 8).map((order) => {const customer = oneRelation(order.customers);return <tr key={order.id}><td><Link className="cell-main" href={`/orders/${order.id}`}>{order.order_number}</Link><div className="cell-sub">{order.payment_method ?? "COD"}</div></td><td><span className="cell-main">{customer?.full_name ?? "—"}</span><div className="cell-sub">{customer?.phone ?? ""}</div></td><td>{new Date(order.created_at).toLocaleDateString("vi-VN")}</td><td>{order.order_items.reduce((total, item) => total + Number(item.quantity), 0)} món</td><td className="cell-main">{formatVnd(Number(order.total))}</td><td><span className={`status-badge ${statusClass(order.status)}`}>{statusNames[order.status] ?? order.status}</span></td></tr>})}{!orders.length && <tr><td colSpan={6}>Chưa có đơn hàng.</td></tr>}</tbody></table></div></section>
  </>;
}
