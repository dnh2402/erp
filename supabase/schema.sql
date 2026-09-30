-- DSEB Store + ERP shared schema. Run once in a fresh Supabase project.
create extension if not exists pgcrypto;

create sequence if not exists public.order_number_seq start 1;

create or replace function public.make_order_number()
returns text language sql volatile set search_path = public, pg_temp
as $$ select 'DSEB-' || lpad(nextval('public.order_number_seq')::text, 6, '0') $$;

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (length(trim(full_name)) between 2 and 120),
  phone text not null check (length(trim(phone)) between 7 and 32),
  email text not null unique check (email = lower(email)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  sku text not null unique,
  name text not null,
  category text not null check (category in ('Running','Basketball','Training','Lifestyle','Walking','Trail','Court','Performance','Apparel')),
  description text not null default '',
  price numeric(12,2) not null check (price > 0),
  cost numeric(12,2) not null check (cost >= 0 and cost <= price),
  image_url text,
  sizes text[] not null default '{}',
  colors text[] not null default '{}',
  on_hand integer not null default 0 check (on_hand >= 0),
  reserved integer not null default 0 check (reserved >= 0 and reserved <= on_hand),
  available integer generated always as (on_hand - reserved) stored,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.stores (
  id uuid primary key default 'd5eb0000-0000-4000-8000-000000000001',
  name text not null,
  address text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique default public.make_order_number(),
  tracking_token text not null unique default (replace(gen_random_uuid()::text,'-','') || replace(gen_random_uuid()::text,'-','')),
  customer_id uuid not null references public.customers(id) on delete restrict,
  status text not null default 'PENDING' check (status in ('PENDING','CONFIRMED','PROCESSING','SHIPPED','DELIVERED','CUSTOMER_CONFIRMED','COMPLETED')),
  fulfillment_method text not null check (fulfillment_method in ('SHIP','PICKUP')),
  payment_method text not null default 'COD' check (payment_method = 'COD'),
  shipping_address jsonb,
  pickup_store_id uuid references public.stores(id) on delete restrict,
  subtotal numeric(12,2) not null default 0 check (subtotal >= 0),
  shipping_fee numeric(12,2) not null default 0 check (shipping_fee >= 0),
  total numeric(12,2) not null default 0 check (total >= 0),
  revenue_recognized boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  confirmed_at timestamptz,
  processing_at timestamptz,
  shipped_at timestamptz,
  delivered_at timestamptz,
  confirmed_by_customer_at timestamptz,
  completed_at timestamptz,
  check ((fulfillment_method = 'SHIP' and shipping_address is not null and pickup_store_id is null)
      or (fulfillment_method = 'PICKUP' and shipping_address is null and pickup_store_id is not null))
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  size text not null,
  color text not null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(12,2) not null check (unit_price > 0),
  subtotal numeric(12,2) not null check (subtotal > 0),
  created_at timestamptz not null default now()
);

create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete restrict,
  order_id uuid references public.orders(id) on delete set null,
  movement_type text not null check (movement_type in ('RESERVE','RELEASE','SALE_COMPLETED')),
  quantity integer not null check (quantity > 0),
  note text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.revenue_transactions (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id) on delete restrict,
  amount numeric(12,2) not null check (amount > 0),
  transaction_type text not null default 'ORDER_REVENUE' check (transaction_type = 'ORDER_REVENUE'),
  recognized_at timestamptz not null default now()
);

create table if not exists public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  old_status text check (old_status is null or old_status in ('PENDING','CONFIRMED','PROCESSING','SHIPPED','DELIVERED','CUSTOMER_CONFIRMED','COMPLETED')),
  new_status text not null check (new_status in ('PENDING','CONFIRMED','PROCESSING','SHIPPED','DELIVERED','CUSTOMER_CONFIRMED','COMPLETED')),
  note text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.erp_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now()
);

create index if not exists products_category_idx on public.products(category);
create index if not exists products_published_idx on public.products(is_published) where is_published;
create index if not exists orders_status_created_idx on public.orders(status, created_at desc);
create index if not exists orders_customer_idx on public.orders(customer_id, created_at desc);
create index if not exists order_items_order_idx on public.order_items(order_id);
create index if not exists order_items_product_idx on public.order_items(product_id);
create index if not exists inventory_movements_product_created_idx on public.inventory_movements(product_id, created_at desc);
create index if not exists order_status_history_order_created_idx on public.order_status_history(order_id, created_at);
create index if not exists revenue_recognized_at_idx on public.revenue_transactions(recognized_at desc);

create or replace function public.is_erp_admin()
returns boolean language sql stable security definer set search_path = public, pg_temp
as $$ select exists (select 1 from public.erp_admins where user_id = auth.uid()) $$;
revoke all on function public.is_erp_admin() from public, anon;
grant execute on function public.is_erp_admin() to authenticated;

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public, pg_temp
as $$ begin new.updated_at = now(); return new; end $$;
revoke all on function public.make_order_number() from public, anon, authenticated;
revoke all on function public.set_updated_at() from public, anon, authenticated;

drop trigger if exists customers_set_updated_at on public.customers;
create trigger customers_set_updated_at before update on public.customers for each row execute function public.set_updated_at();
drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at before update on public.products for each row execute function public.set_updated_at();
drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at before update on public.orders for each row execute function public.set_updated_at();

insert into public.stores (id, name, address)
values ('d5eb0000-0000-4000-8000-000000000001', 'DSEB Flagship Store', 'National Economics University, 207 Giải Phóng, Hà Nội, Vietnam')
on conflict (id) do nothing;

alter table public.customers enable row level security;
alter table public.products enable row level security;
alter table public.stores enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.revenue_transactions enable row level security;
alter table public.order_status_history enable row level security;
alter table public.erp_admins enable row level security;

drop policy if exists "published products are public" on public.products;
create policy "published products are public" on public.products for select to anon using (is_published);
drop policy if exists "admins read customers" on public.customers;
create policy "admins read customers" on public.customers for select to authenticated using (public.is_erp_admin());
drop policy if exists "admins read all products" on public.products;
create policy "admins read all products" on public.products for select to authenticated using (public.is_erp_admin());
drop policy if exists "admins read stores" on public.stores;
create policy "admins read stores" on public.stores for select to authenticated using (public.is_erp_admin());
drop policy if exists "admins read orders" on public.orders;
create policy "admins read orders" on public.orders for select to authenticated using (public.is_erp_admin());
drop policy if exists "admins read order items" on public.order_items;
create policy "admins read order items" on public.order_items for select to authenticated using (public.is_erp_admin());
drop policy if exists "admins read inventory movements" on public.inventory_movements;
create policy "admins read inventory movements" on public.inventory_movements for select to authenticated using (public.is_erp_admin());
drop policy if exists "admins read revenue" on public.revenue_transactions;
create policy "admins read revenue" on public.revenue_transactions for select to authenticated using (public.is_erp_admin());
drop policy if exists "admins read status history" on public.order_status_history;
create policy "admins read status history" on public.order_status_history for select to authenticated using (public.is_erp_admin());
drop policy if exists "admins read admin allowlist" on public.erp_admins;
create policy "admins read admin allowlist" on public.erp_admins for select to authenticated using (user_id = auth.uid());

revoke all on public.customers, public.products, public.stores, public.orders, public.order_items,
  public.inventory_movements, public.revenue_transactions, public.order_status_history, public.erp_admins
  from anon, authenticated;
grant select (id, sku, name, category, description, price, image_url, sizes, colors, available) on public.products to anon;
grant select on public.customers, public.products, public.stores, public.orders, public.order_items,
  public.inventory_movements, public.revenue_transactions, public.order_status_history, public.erp_admins
  to authenticated;

