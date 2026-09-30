import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
const friendly = (message: string) => {
  if (message.includes("Insufficient inventory")) return "Một số sản phẩm vừa hết hàng. Cập nhật giỏ hàng để thử lại.";
  if (message.includes("selected size or color")) return "Size hoặc màu được chọn hiện không còn khả dụng.";
  if (message.includes("address")) return "Vui lòng kiểm tra lại địa chỉ giao hàng.";
  if (message.includes("valid")) return "Thông tin checkout chưa hợp lệ. Vui lòng kiểm tra lại.";
  return "Không thể tạo đơn hàng. Vui lòng thử lại sau.";
};

export async function POST(request: Request) {
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if(!url||!key)return NextResponse.json({error:"Supabase chưa được cấu hình cho DSEB Store."},{status:503});
  try{
    const body=await request.json();
    const supabase=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
    const {data,error}=await supabase.rpc("place_order",{
      p_customer_name:body.customerName,
      p_phone:body.phone,
      p_email:body.email,
      p_fulfillment_method:body.fulfillmentMethod,
      p_shipping_address:body.shippingAddress??null,
      p_items:body.items,
    });
    if(error)return NextResponse.json({error:friendly(error.message)},{status:error.code==="P0001"?409:400});
    return NextResponse.json(data,{status:201});
  }catch{return NextResponse.json({error:"Yêu cầu không hợp lệ."},{status:400});}
}
