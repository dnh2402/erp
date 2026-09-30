"use client";
import { formatVnd } from "@/lib/types";
type Point={label:string;value:number};
function makeLine(points:Point[],width:number,height:number){const max=Math.max(1,...points.map(p=>p.value));return points.map((p,i)=>`${i===0?"M":"L"} ${(i/(Math.max(points.length-1,1)))*width} ${height-(p.value/max)*(height-14)-4}`).join(" ")}
export function DashboardCharts({revenue,orders}:{revenue:Point[];orders:Point[]}){
  const width=680,height=175;const line=makeLine(revenue,width,height);const orderMax=Math.max(1,...orders.map(p=>p.value));
  return <div className="dashboard-grid"><section className="panel"><div className="panel-head"><div><h2>Doanh thu được ghi nhận</h2><p>14 ngày gần nhất · Chỉ đơn đã hoàn tất</p></div><div className="chart-legend"><span><i className="legend-mark"/> Doanh thu</span></div></div><div className="chart-box"><svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-label="Biểu đồ doanh thu theo ngày"><defs><linearGradient id="revenue-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#c7ff45" stopOpacity=".38"/><stop offset="100%" stopColor="#c7ff45" stopOpacity="0"/></linearGradient></defs>{[0,1,2,3].map(i=><line key={i} x1="0" x2={width} y1={i*height/3} y2={i*height/3} stroke="#edf0eb" strokeDasharray="3 4"/>)}<path d={`${line} L ${width} ${height} L 0 ${height} Z`} fill="url(#revenue-fill)"/><path d={line} fill="none" stroke="#8dbb30" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke"/></svg><div className="chart-labels">{revenue.filter((_,i)=>i%2===0).map(p=><span key={p.label}>{p.label}</span>)}</div></div></section>
    <section className="panel"><div className="panel-head"><div><h2>Đơn hàng mới</h2><p>Số đơn tạo mỗi ngày</p></div><div className="chart-legend"><span><i className="legend-mark orders"/> Đơn hàng</span></div></div><div className="mini-bars">{orders.map((p,i)=><div className="mini-bar-group" key={p.label} title={`${p.label}: ${p.value}`}><div className="mini-bar orders" style={{height:`${Math.max(3,(p.value/orderMax)*85)}%`}}/><span className="mini-bar-label">{i%2===0?p.label:""}</span></div>)}</div><div className="chart-labels" style={{padding:"0 17px 14px"}}><span>{orders[0]?.label}</span><span>{orders.at(-1)?.label}</span></div></section></div>;
}
export function TopProducts({items}:{items:Array<{name:string;category:string;quantity:number;revenue:number}>}){
  return <section className="panel"><div className="panel-head"><div><h2>Sản phẩm bán chạy</h2><p>Đơn đã hoàn tất</p></div></div><div className="top-products">{items.length?items.slice(0,5).map((item,i)=><div className="top-product" key={item.name}><span className="top-product-rank">0{i+1}</span><span><strong>{item.name}</strong><small>{item.category} · {formatVnd(item.revenue)}</small></span><b>{item.quantity} đôi</b></div>):<div className="cell-sub">Chưa có dữ liệu bán hàng.</div>}</div></section>;
}

export function SalesByCategory({items}:{items:Array<{category:string;quantity:number;revenue:number}>}){
  const max=Math.max(1,...items.map(item=>item.quantity));
  return <section className="panel"><div className="panel-head"><div><h2>Doanh số theo danh mục</h2><p>Số lượng trong đơn đã hoàn tất</p></div></div><div className="category-chart">{items.map(item=><div className="category-chart-row" key={item.category}><div><strong>{item.category}</strong><span>{item.quantity} đôi · {formatVnd(item.revenue)}</span></div><div className="category-track"><i style={{width:`${Math.max(2,item.quantity/max*100)}%`}}/></div></div>)}{!items.length&&<span className="cell-sub">Chưa có dữ liệu bán hàng.</span>}</div></section>;
}

export function InventoryDistribution({counts}:{counts:{healthy:number;low:number;out:number}}){
  const total=counts.healthy+counts.low+counts.out;
  const first=total?counts.healthy/total*100:0;const second=total?(counts.healthy+counts.low)/total*100:0;
  return <section className="panel"><div className="panel-head"><div><h2>Phân bổ trạng thái tồn kho</h2><p>Số SKU theo lượng khả dụng</p></div></div><div className="stock-chart"><div className="stock-donut" style={{background:`conic-gradient(#9ac638 0 ${first}%, #efad6b ${first}% ${second}%, #df756a ${second}% 100%)`}}><div><strong>{total}</strong><span>SKU</span></div></div><div className="stock-legend"><div><i className="stock-healthy"/> Healthy <b>{counts.healthy}</b></div><div><i className="stock-low"/> Low stock <b>{counts.low}</b></div><div><i className="stock-out"/> Out of stock <b>{counts.out}</b></div></div></div></section>;
}
