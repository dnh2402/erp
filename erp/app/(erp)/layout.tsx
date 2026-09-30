import Link from "next/link";
import { ExternalLink,LogOut } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { NavLinks } from "@/components/nav-links";
import { ERPHeartbeat } from "@/components/erp-heartbeat";
import { signOut } from "@/app/actions";

export default async function ERPLayout({children}:{children:React.ReactNode}){
  const {user}=await requireAdmin();
  return <div className="erp-shell"><aside className="sidebar"><Link href="/dashboard" className="erp-logo"><b>DS</b><span>DSEB<small>OPERATIONS</small></span></Link><div className="sidebar-label">Workspace</div><NavLinks/><div className="sidebar-bottom"><div className="sidebar-label">Session</div><div className="admin-card"><div className="avatar">{(user.email?.[0]??"A").toUpperCase()}</div><span><strong>{user.email?.split("@")[0]??"Admin"}</strong><small>ERP Administrator</small></span><form action={signOut}><button aria-label="Sign out"><LogOut size={15}/></button></form></div></div></aside><div className="erp-main"><header className="topbar"><div className="topbar-left"><span className="live-dot"/><span className="crumb">DSEB &nbsp;·&nbsp; <b>OPERATIONS</b> &nbsp;·&nbsp; LIVE</span></div><div className="topbar-right"><a className="store-pill" href={process.env.NEXT_PUBLIC_STORE_URL??"http://localhost:3000"} target="_blank" rel="noreferrer">Open Store <ExternalLink size={13}/></a></div></header><main className="admin-content">{children}</main></div><ERPHeartbeat/></div>;
}
