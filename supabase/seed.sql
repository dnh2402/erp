-- Fictional history for classroom demos. Run once after schema.sql/functions.sql.

with catalog as (
  select i,
    (array['Running','Basketball','Training','Lifestyle','Walking','Trail','Court','Performance'])[((i-1)%8)+1] as category,
    (array['AirFlex','Velocity','Nova Run','Street Pulse','Urban Flex','Court X','Trail Motion','Sprint Core'])[((i-1)%8)+1] as model
  from generate_series(1,100) as g(i)
)
insert into public.products (sku, name, category, description, price, cost, sizes, colors, on_hand)
select
  'DSEB-SHOE-' || lpad(i::text,3,'0'),
  case when i = 2 then 'DSEB Velocity 01' else 'DSEB ' || model || ' ' || lpad(i::text,2,'0') end,
  category,
  'A fictional DSEB ' || lower(category) || ' sneaker with a responsive sole, breathable knit upper and all-day comfort.' ,
  case when i = 1 then 1299000 else 1000000 + ((i * 41113) % 2000001) end,
  round((case when i = 1 then 1299000 else 1000000 + ((i * 41113) % 2000001) end) * (0.52 + ((i % 15) * 0.01))),
  array['36','37','38','39','40','41','42','43','44','45'],
  (array[
    array['Volt Lime','Cloud White','Graphite'],
    array['Solar Coral','Jet Black','Ice Blue'],
    array['Electric Blue','Cloud White','Sandstone'],
    array['Lilac Haze','Jet Black','Volt Lime']
  ])[((i-1)%4)+1],
  case when i = 1 then 100 when i = 2 then 5 else 32 + ((i * 37) % 119) end
from catalog
on conflict (sku) do nothing;

insert into public.products (sku, name, category, description, price, cost, sizes, colors, on_hand)
values (
  'DSEB-MERCH-001','DSEB Urban Jacket','Apparel',
  'Lightweight fictional DSEB street jacket with a water-resistant finish.',899000,420000,
  array['S','M','L','XL'],array['Black','Volt Lime','Cloud White'],50
)
on conflict (sku) do nothing;

insert into public.customers (full_name, phone, email, created_at)
select
  case when i = 1 then 'Nguyen Van An' else (array['Nguyen','Tran','Le','Pham','Hoang','Vu','Dang','Bui','Do','Ngo','Duong','Ly','Mai','Truong','Dinh','Vo'])[((i-1)%16)+1] || ' ' ||
  (array['Minh Anh','Gia Bao','Ha Linh','Quang Huy','Thao Nguyen','Tuan Kiet','My Linh','Duc Anh','Thanh An','Bao Chau','Khanh Vy','Hoang Nam','Phuong Thao','Minh Quan','Thu Trang','Van An'])[((i*7-1)%16)+1]
  end,
  '+849' || lpad((1000000+i)::text,7,'0'),
  'demo.customer.' || lpad(i::text,3,'0') || '@dseb-demo.com',
  now() - ((i * 19) % 180 + 3) * interval '1 day'
from generate_series(1,96) as g(i)
on conflict (email) do nothing;

with order_seed as (
  select i,
    case
      when i <= 145 then 'COMPLETED'
      when i <= 182 then 'PROCESSING'
      when i <= 207 then 'SHIPPED'
      when i <= 232 then 'DELIVERED'
      when i <= 240 then 'PENDING'
      else 'CONFIRMED'
    end as status,
    now() - (((i * 37) % 180) + 3) * interval '1 day' - (i % 20) * interval '1 hour' as created_at
  from generate_series(1,248) as g(i)
)
insert into public.orders (
  order_number, tracking_token, customer_id, status, fulfillment_method, payment_method,
  shipping_address, pickup_store_id, subtotal, shipping_fee, total, revenue_recognized,
  created_at, updated_at, confirmed_at, processing_at, shipped_at, delivered_at,
  confirmed_by_customer_at, completed_at
)
select
  'DSEB-' || lpad(o.i::text,6,'0'),
  replace(gen_random_uuid()::text,'-','') || replace(gen_random_uuid()::text,'-',''),
  (select c.id from public.customers c order by c.email offset ((o.i-1)%96) limit 1),
  o.status,
  case when o.i % 4 = 0 then 'PICKUP' else 'SHIP' end,
  'COD',
  case when o.i % 4 = 0 then null else jsonb_build_object(
    'full_name',(select c.full_name from public.customers c order by c.email offset ((o.i-1)%96) limit 1),
    'phone',(select c.phone from public.customers c order by c.email offset ((o.i-1)%96) limit 1),
    'street', (20 + (o.i % 90))::text || ' Giải Phóng',
    'ward','Phương Liệt','district','Thanh Xuân','city','Hà Nội'
  ) end,
  case when o.i % 4 = 0 then 'd5eb0000-0000-4000-8000-000000000001'::uuid else null end,
  0,
  0,
  0,
  o.status = 'COMPLETED',
  o.created_at,
  o.created_at + interval '12 hours',
  case when o.status <> 'PENDING' then o.created_at + interval '1 hour' end,
  case when o.status in ('PROCESSING','SHIPPED','DELIVERED','COMPLETED') then o.created_at + interval '3 hours' end,
  case when o.status in ('SHIPPED','DELIVERED','COMPLETED') then o.created_at + interval '5 hours' end,
  case when o.status in ('DELIVERED','COMPLETED') then o.created_at + interval '7 hours' end,
  case when o.status = 'COMPLETED' then o.created_at + interval '9 hours' end,
  case when o.status = 'COMPLETED' then o.created_at + interval '10 hours' end
from order_seed o
on conflict (order_number) do nothing;

insert into public.order_items (order_id, product_id, size, color, quantity, unit_price, subtotal)
select
  o.id,
  p.id,
  p.sizes[((s.i + n.i) % cardinality(p.sizes)) + 1],
  p.colors[((s.i + n.i) % cardinality(p.colors)) + 1],
  1 + ((s.i + n.i) % 2),
  p.price,
  p.price * (1 + ((s.i + n.i) % 2))
from generate_series(1,248) as s(i)
cross join lateral generate_series(1,case when s.i % 3 = 0 then 2 else 1 end) as n(i)
join public.orders o on o.order_number = 'DSEB-' || lpad(s.i::text,6,'0')
join public.products p on p.sku = 'DSEB-SHOE-' || lpad((((s.i * 7 + n.i * 13 - 1) % 98) + 3)::text,3,'0')
where not exists (select 1 from public.order_items oi where oi.order_id = o.id and oi.product_id = p.id);

update public.orders o set
  subtotal = totals.subtotal,
  total = totals.subtotal + o.shipping_fee
from (
  select order_id, sum(subtotal)::numeric(12,2) as subtotal
  from public.order_items group by order_id
) totals
where o.id = totals.order_id and o.order_number like 'DSEB-%';

update public.products p set
  on_hand = p.on_hand - coalesce(sold.quantity,0),
  reserved = coalesce(open_orders.quantity,0)
from (
  select oi.product_id, sum(oi.quantity)::integer as quantity
  from public.order_items oi join public.orders o on o.id = oi.order_id
  where o.status = 'COMPLETED' group by oi.product_id
) sold
full join (
  select oi.product_id, sum(oi.quantity)::integer as quantity
  from public.order_items oi join public.orders o on o.id = oi.order_id
  where o.status <> 'COMPLETED' group by oi.product_id
) open_orders using (product_id)
where p.id = coalesce(sold.product_id,open_orders.product_id);

insert into public.inventory_movements (product_id, order_id, movement_type, quantity, note, created_at)
select oi.product_id, oi.order_id,
  case when o.status = 'COMPLETED' then 'SALE_COMPLETED' else 'RESERVE' end,
  sum(oi.quantity)::integer,
  case when o.status = 'COMPLETED' then 'Historical demo sale' else 'Historical demo reservation' end,
  o.created_at + interval '8 hours'
from public.order_items oi join public.orders o on o.id = oi.order_id
where o.order_number like 'DSEB-%'
group by oi.product_id, oi.order_id, o.status, o.created_at
on conflict do nothing;

insert into public.revenue_transactions (order_id, amount, transaction_type, recognized_at)
select id, total, 'ORDER_REVENUE', coalesce(completed_at,created_at + interval '10 hours')
from public.orders
where status = 'COMPLETED'
on conflict (order_id) do nothing;

with status_rows as (
  select o.id as order_id, o.created_at, step.status, step.ordinality,
    lag(step.status) over (partition by o.id order by step.ordinality) as old_status
  from public.orders o
  cross join lateral unnest(
    case o.status
      when 'COMPLETED' then array['PENDING','CONFIRMED','PROCESSING','SHIPPED','DELIVERED','CUSTOMER_CONFIRMED','COMPLETED']
      when 'DELIVERED' then array['PENDING','CONFIRMED','PROCESSING','SHIPPED','DELIVERED']
      when 'SHIPPED' then array['PENDING','CONFIRMED','PROCESSING','SHIPPED']
      when 'PROCESSING' then array['PENDING','CONFIRMED','PROCESSING']
      when 'CONFIRMED' then array['PENDING','CONFIRMED']
      else array['PENDING']
    end
  ) with ordinality as step(status, ordinality)
  where o.order_number like 'DSEB-%'
)
insert into public.order_status_history (order_id, old_status, new_status, note, created_at)
select order_id, old_status, status,
  case when old_status is null then 'Historical demo order created' else 'Historical demo status progression' end,
  created_at + (ordinality - 1) * interval '2 hours'
from status_rows
on conflict do nothing;

select setval('public.order_number_seq', greatest((select count(*) from public.orders where order_number like 'DSEB-%'),248), true);
