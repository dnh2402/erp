import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { PublicOrder } from "@/lib/types";
import { TrackingClient } from "@/components/tracking-client";

export const dynamic="force-dynamic";
export default async function TrackPage({params}:{params:Promise<{trackingToken:string}>}){
  const {trackingToken}=await params;const supabase=await createSupabaseServerClient();if(!supabase)return <main className="page-shell"><div className="empty-state"><strong>Supabase chưa được cấu hình</strong>Thiết lập biến môi trường để xem trạng thái đơn hàng.</div></main>;
  const {data}=await supabase.rpc("get_public_order",{p_tracking_token:trackingToken});if(!data)return notFound();
  return <main className="page-shell"><TrackingClient initial={data as unknown as PublicOrder} token={trackingToken}/></main>;
}
