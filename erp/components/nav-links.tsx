"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Boxes,ChartNoAxesCombined,LayoutDashboard,PackageSearch,ShoppingCart,UsersRound } from "lucide-react";
const links=[{href:"/dashboard",label:"Tổng quan",icon:LayoutDashboard},{href:"/orders",label:"Đơn hàng",icon:ShoppingCart},{href:"/inventory",label:"Tồn kho",icon:Boxes},{href:"/products",label:"Sản phẩm",icon:PackageSearch},{href:"/customers",label:"Khách hàng",icon:UsersRound},{href:"/revenue",label:"Doanh thu",icon:ChartNoAxesCombined}];
export function NavLinks(){const pathname=usePathname();return <nav className="side-nav">{links.map(({href,label,icon:Icon})=><Link key={href} href={href} className={pathname===href||pathname.startsWith(`${href}/`)?"active":""}><Icon size={16}/>{label}</Link>)}</nav>}
