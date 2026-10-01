import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Product } from "@/lib/types";

export async function getProducts(): Promise<{ products: Product[]; configured: boolean }> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { products: [], configured: false };
  const { data, error } = await supabase.from("products").select("id,sku,name,category,description,price,image_url,sizes,colors,available").order("name");
  if (error) return { products: [], configured: true };
  return { products: (data ?? []) as Product[], configured: true };
}

export async function getProduct(id: string): Promise<Product | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const { data } = await supabase.from("products").select("id,sku,name,category,description,price,image_url,sizes,colors,available").eq("id", id).maybeSingle();
  return (data as Product | null) ?? null;
}
