"use client";
import { useState } from "react";
import { ArrowRight, Minus, Plus } from "lucide-react";
import type { Product } from "@/lib/types";
import { useCart } from "@/components/cart-provider";

export function AddToCartForm({ product }: { product: Product }) {
  const {add}=useCart();
  const [size,setSize]=useState("");const [color,setColor]=useState(product.colors?.[0]??"");const [quantity,setQuantity]=useState(1);const [message,setMessage]=useState("");
  const addItem=()=>{try{add(product,size,color,quantity);setMessage("Đã thêm vào giỏ hàng.");}catch(e){setMessage(e instanceof Error?e.message:"Không thể thêm sản phẩm.");}};
  return <><div className="option-label"><span>Chọn size</span><span>CM · US</span></div><div className="size-list">{product.sizes.map(s=><button key={s} className={`size-button ${size===s?"selected":""}`} onClick={()=>setSize(s)}>{s}</button>)}</div><div className="option-label"><span>Phối màu</span></div><div className="color-list">{product.colors.map(c=><button key={c} className={`color-button ${color===c?"selected":""}`} onClick={()=>setColor(c)}>{c}</button>)}</div><div className="quantity-row"><span className="section-kicker">Số lượng</span><div className="quantity-control"><button aria-label="Giảm số lượng" onClick={()=>setQuantity(q=>Math.max(1,q-1))}><Minus size={14}/></button><span>{quantity}</span><button aria-label="Tăng số lượng" onClick={()=>setQuantity(q=>Math.min(Math.max(1,product.available),q+1))}><Plus size={14}/></button></div></div><button className="button-dark" disabled={product.available<1} onClick={addItem}>{product.available<1?"TẠM HẾT HÀNG":"THÊM VÀO GIỎ"}<ArrowRight size={16}/></button>{message&&<div className="inline-message">{message}</div>}<div className="inventory-note">{product.available>0?`${product.available} đôi đang sẵn sàng · COD khi nhận hàng`:"Hiện không còn hàng khả dụng."}</div></>;
}
