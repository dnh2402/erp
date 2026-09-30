import { requireAdmin } from "@/lib/auth";
import { OrdersTable } from "@/components/orders-table";
import type { OrderTableRow } from "@/lib/types";
export const dynamic="force-dynamic";
export default async function OrdersPage(){const {supabase}=await requireAdmin();const {data}=await supabase.from("orders").select("id,order_number,status,fulfillment_method,payment_method,total,created_at,customers(full_name,phone),order_items(quantity)").order("created_at",{ascending:false});return <><div className="page-heading"><div><h1>Đơn hàng</h1><p>Đơn Store và ERP cùng đọc từ một Supabase database.</p></div><span className="status-badge completed">AUTO REFRESH · 3S</span></div><OrdersTable rows={(data??[]) as unknown as OrderTableRow[]}/></>}
