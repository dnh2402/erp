"use client";
import { useEffect,useRef,useState } from "react";
import { useRouter } from "next/navigation";
export function ERPHeartbeat(){const router=useRouter();const seen=useRef<string|null>(null);const [toast,setToast]=useState("");
  useEffect(()=>{let alive=true;const poll=async()=>{try{const r=await fetch("/api/orders/latest",{cache:"no-store"});if(!r.ok)return;const data=await r.json();router.refresh();const id=data?.id as string|undefined;if(!id)return;if(seen.current===null){seen.current=id;return}if(id!==seen.current){seen.current=id;setToast(`Đơn hàng mới — #${data.order_number}`);setTimeout(()=>{if(alive)setToast("")},4800)}}catch{/* A transient polling error is retried on the next interval. */}};void poll();const timer=setInterval(poll,3000);return()=>{alive=false;clearInterval(timer)}},[router]);
  return toast?<div className="poll-toast">✦ &nbsp;{toast}</div>:null;
}
