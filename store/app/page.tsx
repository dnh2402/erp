import Link from "next/link";
import { ArrowDownRight, ArrowRight, Sparkles } from "lucide-react";
import { getProducts } from "@/lib/data";
import { ProductCard } from "@/components/product-card";
import { ProductArt } from "@/components/product-art";

const categories = ["Running","Basketball","Training","Lifestyle","Walking","Trail","Court","Performance"];

export default async function HomePage() {
  const { products, configured } = await getProducts();
  const featured = products.slice(0,4);
  return <main>
    <section className="hero"><div className="hero-copy"><span className="eyebrow"><Sparkles size={13}/> Built for what’s next</span><h1>MOVE<span>DIFFERENT.</span></h1><p>Mỗi bước chân mở ra một nhịp mới. Tìm đôi sneaker giúp bạn đi xa hơn, nhanh hơn và theo cách của riêng mình.</p><Link href="/products" className="button-dark">KHÁM PHÁ COLLECTION <ArrowRight size={16}/></Link></div><div className="hero-art"><ProductArt category="Performance" large/><div className="hero-sticker">MADE TO<br/>MOVE<br/><ArrowDownRight size={19}/></div></div><span className="hero-index">DSEB / 001 — 2026</span></section>
    <div className="ticker"><span>MOVE WITH INTENT <b>✳</b> FIND YOUR RHYTHM <b>✳</b> BUILT FOR EVERYDAY MOTION <b>✳</b> MOVE WITH INTENT <b>✳</b> FIND YOUR RHYTHM <b>✳</b></span></div>
    <section className="section"><div className="section-head"><div><span className="section-kicker">01 / Chuyển động mới</span><h2>Fresh off<br/>the floor.</h2></div><Link href="/products" className="text-link">Tất cả sản phẩm <ArrowRight size={15}/></Link></div>
      {featured.length ? <div className="product-grid">{featured.map((p,i)=><ProductCard key={p.id} product={p} index={i}/>)}</div> : <div className="setup-note"><strong>{configured ? "Chưa có sản phẩm được công khai" : "Kết nối bộ sưu tập DSEB"}</strong>{configured ? "Chạy supabase/seed.sql để nạp catalog demo." : "Thiết lập Supabase trong store/.env.local, sau đó chạy schema.sql, functions.sql và seed.sql để tải catalog dùng chung với ERP."}</div>}
    </section>
    <section className="category-band"><span className="section-kicker">02 / Tìm đúng nhịp của bạn</span><h2>Different days.<br/>Different ways to move.</h2><div className="category-tags">{categories.map((c)=><Link href={`/products?category=${encodeURIComponent(c)}`} key={c}><span>{c} ↗</span></Link>)}</div></section>
    <section className="section story-section" id="story"><div className="story-copy"><span className="section-kicker">03 / Tinh thần DSEB</span><h2>Not made to<br/>blend in.</h2><p>DSEB bắt đầu từ một điều đơn giản: chuyển động tốt nhất là chuyển động khiến bạn cảm thấy mình là chính mình. Thiết kế có chủ đích, thoải mái từng bước, sẵn sàng cho mọi kế hoạch.</p><Link href="/products" className="button-light">FIND YOUR PAIR <ArrowRight size={16}/></Link></div><div className="story-graphic"><strong>OWN<br/>YOUR<br/>PACE</strong><ProductArt category="Running" large/></div></section>
    <section className="section" id="locations"><div className="section-head"><div><span className="section-kicker">04 / Ghé flagship</span><h2>Meet us<br/>in Hà Nội.</h2></div><div className="page-title-row"><p>DSEB Flagship Store<br/>National Economics University<br/>207 Giải Phóng, Hà Nội</p></div></div><Link href="/products" className="text-link">Chọn một đôi mới <ArrowRight size={15}/></Link></section>
  </main>;
}
