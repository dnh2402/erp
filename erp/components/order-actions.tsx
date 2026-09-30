"use client";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { useState } from "react";
const nextStatus:Record<string,{status:string;label:string}>={PENDING:{status:"CONFIRMED",label:"Xác nhận đơn"},CONFIRMED:{status:"PROCESSING",label:"Bắt đầu chuẩn bị"},PROCESSING:{status:"SHIPPED",label:"Đánh dấu đã gửi"},SHIPPED:{status:"DELIVERED",label:"Đánh dấu đã giao"}};
export function OrderActions({orderId,status}:{orderId:string;status:string}){const router=useRouter();const [busy,setBusy]=useState(false);const [error,setError]=useState("");const action=nextStatus[status];
 async function advance(){if(!action)return;setBusy(true);setError("");try{const r=await fetch(`/api/orders/${orderId}/status`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({status:action.status})});const body=await r.json();if(!r.ok)throw new Error(body.error??"Không thể cập nhật đơn.");setBusy(false);router.refresh()}catch(e){setError(e instanceof Error?e.message:"Lỗi cập nhật trạng thái.");setBusy(false)}}
 return <><div className="flow-actions">{action?<button disabled={busy} onClick={advance}>{busy?"Đang cập nhật…":action.label}<ArrowRight size={14}/></button>:<div className="tracking-complete" style={{marginTop:0}}>Không còn bước ERP tiếp theo.</div>}</div>{error&&<div className="error-banner">{error}</div>}<p className="cell-sub">Chỉ có thể chuyển sang bước kế tiếp trong quy trình.</p><div className="cell-sub">Khách xác nhận nhận hàng qua link tracking sau khi đơn đã giao.</div></>}
