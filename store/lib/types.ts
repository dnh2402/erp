export type Product = {
  id: string;
  sku: string;
  name: string;
  category: string;
  description: string;
  price: number;
  cost?: number;
  image_url: string | null;
  sizes: string[];
  colors: string[];
  on_hand?: number;
  reserved?: number;
  available: number;
};

export type CartLine = {
  product: Product;
  size: string;
  color: string;
  quantity: number;
};

export type PublicOrder = {
  id: string;
  order_number: string;
  tracking_token: string;
  status: "PENDING" | "CONFIRMED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CUSTOMER_CONFIRMED" | "COMPLETED";
  fulfillment_method: "SHIP" | "PICKUP";
  payment_method: "COD";
  shipping_address: { full_name: string; phone: string; street: string; ward: string; district: string; city: string } | null;
  pickup_store: { name: string; address: string } | null;
  subtotal: number;
  shipping_fee: number;
  total: number;
  revenue_recognized: boolean;
  created_at: string;
  completed_at: string | null;
  customer: { full_name: string; phone: string; email: string };
  items: Array<{ product_id: string; sku: string; name: string; size: string; color: string; quantity: number; unit_price: number; subtotal: number; image_url: string | null }>;
  status_history: Array<{ old_status: string | null; new_status: string; note: string; created_at: string }>;
};

export const formatVnd = (amount: number) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(Number(amount));
