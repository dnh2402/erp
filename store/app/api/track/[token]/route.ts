import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
type Context={params:Promise<{token:string}>};
function publicClient(){const url=process.env.NEXT_PUBLIC_SUPABASE_URL;const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;return url&&key?createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}}):null}

export async function GET(_request:Request,{params}:Context){
  const {token}=await params;const supabase=publicClient();if(!supabase)return NextResponse.json({error:"Supabase chưa được cấu hình."},{status:503});
  const {data,error}=await supabase.rpc("get_public_order",{p_tracking_token:token});
  if(error)return NextResponse.json({error:"Không thể tải trạng thái đơn hàng."},{status:400});
  if(!data)return NextResponse.json({error:"Không tìm thấy đơn hàng."},{status:404});
  return NextResponse.json(data,{headers:{"cache-control":"no-store"}});
}

export async function POST(_request:Request,{params}:Context){
  const {token}=await params;const supabase=publicClient();if(!supabase)return NextResponse.json({error:"Supabase chưa được cấu hình."},{status:503});
  const {data,error}=await supabase.rpc("confirm_customer_receipt",{p_tracking_token:token});
  if(error)return NextResponse.json({error:error.message.includes("after delivery")?"Đơn hàng chỉ có thể xác nhận sau khi đã giao.":"Không thể xác nhận nhận hàng cho đơn này."},{status:error.code==="P0002"?404:409});
  return NextResponse.json(data,{headers:{"cache-control":"no-store"}});
}
