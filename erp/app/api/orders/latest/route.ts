import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/auth";
export const dynamic="force-dynamic";
export async function GET(){const context=await getAdminContext();if(!context)return NextResponse.json({error:"Unauthorized"},{status:401});const {data}=await context.supabase.from("orders").select("id,order_number,created_at").order("created_at",{ascending:false}).limit(1).maybeSingle();return NextResponse.json(data??null,{headers:{"cache-control":"no-store"}})}
