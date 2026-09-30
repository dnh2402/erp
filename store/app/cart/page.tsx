"use client";
import Link from "next/link";
import { ArrowRight, Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { ProductArt } from "@/components/product-art";
import { formatVnd } from "@/lib/types";

export default function CartPage() {
  const {lines,ready,count,subtotal,setQuantity,remove}=useCart();
  if(!ready)return <main className="page-shell"><div className="empty-state">Đang tải giỏ hàng…</div></main>;
  if(!lines.length)return <main className="page-shell"><div className="page-title-row"><div><span className="section-kicker">DSEB / Your selection</span><h1>YOUR BAG.</h1></div></div><div className="cart-empty"><h2>Giỏ hàng đang trống.</h2><p>Khám phá bộ sưu tập và chọn đôi tiếp theo của bạn.</p><Link className="button-dark" href="/products">MỞ BỘ SƯU TẬP <ArrowRight size={16}/></Link></div></main>;
  return <main className="page-shell"><div className="page-title-row"><div><span className="section-kicker">DSEB / Your selection</span><h1>YOUR BAG.</h1></div><p>{count} sản phẩm · Thông tin tồn kho được xác nhận khi đặt hàng.</p></div><div className="cart-layout"><section>{lines.map(line=>{const key=`${line.product.id}:${line.size}:${line.color}`;return <article className="cart-line" key={key}><div className="cart-line-art"><ProductArt category={line.product.category}/></div><div><span className="product-sku">{line.product.sku}</span><h3>{line.product.name}</h3><p>Size {line.size} · {line.color}</p><div className="quantity-control"><button aria-label="Giảm" onClick={()=>line.quantity===1?remove(key):setQuantity(key,line.quantity-1)}><Minus size={13}/></button><span>{line.quantity}</span><button aria-label="Tăng" onClick={()=>setQuantity(key,line.quantity+1)}><Plus size={13}/></button></div></div><div className="cart-line-price"><strong>{formatVnd(Number(line.product.price)*line.quantity)}</strong><button className="remove-button" onClick={()=>remove(key)}><Trash2 size={13}/> Xóa</button></div></article>})}</section><aside className="summary-card"><h2>Tóm tắt đơn hàng</h2><div className="summary-row"><span>Tạm tính</span><span>{formatVnd(subtotal)}</span></div><div className="summary-row"><span>Giao hàng</span><span>Tính ở checkout</span></div><div className="summary-row total"><span>Tổng cộng</span><span>{formatVnd(subtotal)}</span></div><Link className="button-dark" href="/checkout">TIẾN HÀNH THANH TOÁN <ArrowRight size={16}/></Link><p className="inventory-note">Thanh toán COD. Chưa ghi nhận doanh thu ở bước này.</p></aside></div></main>;
}
