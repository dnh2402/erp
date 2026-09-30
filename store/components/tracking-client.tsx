"use client";
import { useEffect,useState } from "react";
import { useRouter } from "next/navigation";
import type { PublicOrder } from "@/lib/types";
import { formatVnd } from "@/lib/types";
import { ProductArt } from "@/components/product-art";

const stages=["PENDING","CONFIRMED","PROCESSING","SHIPPED","DELIVERED","CUSTOMER_CONFIRMED","COMPLETED"];
const labels=["Đã đặt","Đã xác nhận","Đang chuẩn bị","Đã gửi","Đã giao","Bạn xác nhận","Hoàn tất"];
const statusLabel:Record<string,string>={PENDING:"ĐANG CHỜ XÁC NHẬN",CONFIRMED:"ĐÃ XÁC NHẬN",PROCESSING:"ĐANG CHUẨN BỊ",SHIPPED:"ĐANG GIAO HÀNG",DELIVERED:"ĐÃ GIAO · CHỜ XÁC NHẬN",CUSTOMER_CONFIRMED:"ĐÃ XÁC NHẬN NHẬN HÀNG",COMPLETED:"ĐƠN HÀNG HOÀN TẤT"};

export function TrackingClient({initial,token}:{initial:PublicOrder;token:string}){
  const router=useRouter();const [busy,setBusy]=useState(false);const [error,setError]=useState("");
  useEffect(()=>{const timer=setInterval(()=>router.refresh(),3000);return()=>clearInterval(timer)},[router]);
  async function confirm(){setBusy(true);setError("");try{const response=await fetch(`/api/track/${token}`,{method:"POST"});const data=await response.json();if(!response.ok)throw new Error(data.error);router.refresh()}catch(e){setError(e instanceof Error?e.message:"Không thể xác nhận.");setBusy(false)}}
  const current=stages.indexOf(initial.status);
  return <><div className="tracking-panel"><span className="tracking-status">{statusLabel[initial.status]??initial.status}</span><h1>{initial.order_number}</h1><p className="inventory-note">Đặt lúc {new Date(initial.created_at).toLocaleString("vi-VN",{dateStyle:"medium",timeStyle:"short"})} · COD</p>
    <div className="tracking-timeline">{stages.map((s,i)=><div key={s} className={`timeline-step ${i<=current?"done":""}`}>{labels[i]}</div>)}</div>
    <div className="tracking-info-grid"><section><h3>Sản phẩm</h3>{initial.items.map((item,i)=><div className="tracking-item" key={`${item.product_id}-${i}`}><span>{item.quantity} × {item.name}<br/><small>Size {item.size} · {item.color}</small></span><strong>{formatVnd(Number(item.subtotal))}</strong></div>)}<div className="summary-row"><span>Tạm tính</span><span>{formatVnd(Number(initial.subtotal))}</span></div><div className="summary-row"><span>Giao hàng</span><span>{initial.shipping_fee?formatVnd(Number(initial.shipping_fee)):"Miễn phí"}</span></div><div className="summary-row total"><span>Tổng COD</span><span>{formatVnd(Number(initial.total))}</span></div></section>
      <section><h3>Thông tin nhận hàng</h3><p><strong>{initial.customer.full_name}</strong><br/>{initial.customer.phone}<br/>{initial.customer.email}</p>{initial.fulfillment_method==="SHIP"&&initial.shipping_address?<p>{initial.shipping_address.street}<br/>{initial.shipping_address.ward}, {initial.shipping_address.district}<br/>{initial.shipping_address.city}</p>:<p><strong>{initial.pickup_store?.name}</strong><br/>{initial.pickup_store?.address}</p>}<p>Phương thức: {initial.fulfillment_method==="SHIP"?"Giao tận nơi":"Nhận tại cửa hàng"}<br/>Thanh toán: COD</p></section>
    </div>
    {initial.status==="DELIVERED"&&<><button disabled={busy} className="receipt-button" onClick={confirm}>{busy?"ĐANG XỬ LÝ…":"ĐÃ NHẬN HÀNG"}</button><p className="inventory-note">Xác nhận sẽ hoàn tất đơn hàng, ghi nhận doanh thu và cập nhật tồn kho.</p></>}
    {initial.status==="COMPLETED"&&<div className="tracking-complete"><strong>Đơn hàng đã hoàn tất.</strong><br/>Doanh thu đã được ghi nhận. Cảm ơn bạn đã chọn DSEB.</div>}
    {error&&<div className="error-banner">{error}</div>}
  </div><section className="section" style={{paddingTop:38}}><div className="section-head"><div><span className="section-kicker">DSEB / Made to move</span><h2>Your next<br/>chapter.</h2></div></div><div className="story-graphic" style={{maxWidth:560,margin:"0 auto"}}><ProductArt category="Performance" large/></div></section></>;
}
