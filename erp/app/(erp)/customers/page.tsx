import { requireAdmin } from "@/lib/auth";
import { CustomersTable } from "@/components/customers-table";
import type { CustomerTableRow } from "@/lib/types";
export const dynamic="force-dynamic";
export default async function CustomersPage(){const {supabase}=await requireAdmin();const {data}=await supabase.from("customers").select("id,full_name,phone,email,created_at,orders(id,status,total,created_at)").order("created_at",{ascending:false});return <><div className="page-heading"><div><h1>Khách hàng</h1><p>Hồ sơ khách được tạo tự động khi khách checkout trên DSEB Store.</p></div><span className="status-badge completed">{data?.length??0} HỒ SƠ</span></div><CustomersTable customers={(data??[]) as unknown as CustomerTableRow[]}/></>}
