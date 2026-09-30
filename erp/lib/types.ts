export type Product = { id:string;sku:string;name:string;category:string;description:string;price:number;cost:number;image_url:string|null;sizes:string[];colors:string[];on_hand:number;reserved:number;available:number;created_at:string };
export type Customer = { id:string;full_name:string;phone:string;email:string;created_at:string };
export type Order = { id:string;order_number:string;status:string;fulfillment_method:"SHIP"|"PICKUP";payment_method:"COD";shipping_address:Record<string,string>|null;subtotal:number;shipping_fee:number;total:number;revenue_recognized:boolean;created_at:string;customer:Customer;order_items:Array<{id:string;product_id:string;size:string;color:string;quantity:number;unit_price:number;subtotal:number;products:Product}> };
export type Related<T> = T | T[] | null;
export type OrderTableRow = {id:string;order_number:string;status:string;fulfillment_method:string;payment_method:string;total:number;created_at:string;customers:Related<Pick<Customer,"full_name"|"phone">>;order_items:Array<{quantity:number}>};
export type CustomerTableRow = Customer & {orders:Array<Pick<Order,"id"|"status"|"total"|"created_at">>};
export type RevenueRow = {id:string;order_id:string;amount:number;transaction_type:string;recognized_at:string;orders:Related<{order_number:string;customers:Related<Pick<Customer,"full_name">>}>};
export const formatVnd=(amount:number)=>new Intl.NumberFormat("vi-VN",{style:"currency",currency:"VND",maximumFractionDigits:0}).format(Number(amount));
export const statusNames:Record<string,string>={PENDING:"Chờ xác nhận",CONFIRMED:"Đã xác nhận",PROCESSING:"Đang chuẩn bị",SHIPPED:"Đang giao",DELIVERED:"Đã giao",CUSTOMER_CONFIRMED:"Khách đã nhận",COMPLETED:"Hoàn tất"};
export const statusClass=(status:string)=>status.toLowerCase().replaceAll("_","-");
export function oneRelation<T>(value:Related<T>):T|null{return Array.isArray(value)?value[0]??null:value as T|null;}
