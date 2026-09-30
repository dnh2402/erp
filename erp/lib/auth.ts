import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getAdminContext(){
  const supabase=await createSupabaseServerClient();if(!supabase)return null;
  const {data:{user}}=await supabase.auth.getUser();if(!user)return null;
  const {data:isAdmin,error}=await supabase.rpc("is_erp_admin");
  if(error||!isAdmin)return null;
  return {supabase,user};
}

export async function requireAdmin(){const context=await getAdminContext();if(!context)redirect("/login");return context;}
