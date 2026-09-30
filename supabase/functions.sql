-- Transactional business operations. These functions are the only public write path.

create or replace function public.place_order(
  p_customer_name text,
  p_phone text,
  p_email text,
  p_fulfillment_method text,
  p_shipping_address jsonb,
  p_items jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_customer_id uuid;
  v_order_id uuid;
  v_order_number text;
  v_tracking_token text;
  v_store_id uuid;
  v_shipping_fee numeric(12,2);
  v_subtotal numeric(12,2) := 0;
  v_total numeric(12,2);
  v_line record;
  v_stock record;
  v_product public.products%rowtype;
begin
  if p_customer_name is null or length(trim(p_customer_name)) not between 2 and 120 then
    raise exception 'Please enter a valid customer name.' using errcode = '22023';
  end if;
  if p_phone is null or length(trim(p_phone)) not between 7 and 32 then
    raise exception 'Please enter a valid phone number.' using errcode = '22023';
  end if;
  if p_email is null or length(trim(p_email)) > 254 or trim(p_email) !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$' then
    raise exception 'Please enter a valid email address.' using errcode = '22023';
  end if;
  if p_fulfillment_method is null or p_fulfillment_method not in ('SHIP','PICKUP') then
    raise exception 'Choose shipping or store pickup.' using errcode = '22023';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' then
    raise exception 'Your cart must contain between 1 and 20 line items.' using errcode = '22023';
  end if;
  if jsonb_array_length(p_items) < 1 or jsonb_array_length(p_items) > 20 then
    raise exception 'Your cart must contain between 1 and 20 line items.' using errcode = '22023';
  end if;
  if exists (
    select 1 from jsonb_to_recordset(p_items) as x(product_id uuid, size text, color text, quantity integer)
    where x.product_id is null or x.size is null or length(trim(x.size)) = 0
      or x.color is null or length(trim(x.color)) = 0 or x.quantity is null or x.quantity <= 0 or x.quantity > 10
  ) then
    raise exception 'One or more cart items are invalid.' using errcode = '22023';
  end if;
  if p_fulfillment_method = 'SHIP' and (
    p_shipping_address is null or jsonb_typeof(p_shipping_address) <> 'object'
    or coalesce(length(trim(p_shipping_address->>'full_name')),0) < 2
    or coalesce(length(trim(p_shipping_address->>'street')),0) < 3
    or coalesce(length(trim(p_shipping_address->>'ward')),0) < 2
    or coalesce(length(trim(p_shipping_address->>'district')),0) < 2
    or coalesce(length(trim(p_shipping_address->>'city')),0) < 2
    or coalesce(p_shipping_address->>'phone','') = ''
  ) then
    raise exception 'Complete the shipping address before placing the order.' using errcode = '22023';
  end if;

  -- Lock every referenced product in a stable order to avoid overselling and deadlocks.
  for v_stock in
    select p.id
    from public.products p
    where p.id in (
      select distinct x.product_id
      from jsonb_to_recordset(p_items) as x(product_id uuid, size text, color text, quantity integer)
    )
    order by p.id
    for update
  loop
    null;
  end loop;

  -- Validate each selected variant and calculate prices from the database, never the browser.
  for v_line in
    select x.product_id, trim(x.size) as size, trim(x.color) as color, sum(x.quantity)::integer as quantity
    from jsonb_to_recordset(p_items) as x(product_id uuid, size text, color text, quantity integer)
    group by x.product_id, trim(x.size), trim(x.color)
    order by x.product_id, trim(x.size), trim(x.color)
  loop
    select * into v_product from public.products where id = v_line.product_id and is_published;
    if not found then
      raise exception 'A product in your cart is no longer available.' using errcode = 'P0002';
    end if;
    if not (v_line.size = any(v_product.sizes)) or not (v_line.color = any(v_product.colors)) then
      raise exception 'A selected size or color is not available.' using errcode = '22023';
    end if;
    v_subtotal := v_subtotal + (v_product.price * v_line.quantity);
  end loop;

  for v_stock in
    select x.product_id, sum(x.quantity)::integer as quantity
    from jsonb_to_recordset(p_items) as x(product_id uuid, size text, color text, quantity integer)
    group by x.product_id order by x.product_id
  loop
    select * into v_product from public.products where id = v_stock.product_id and is_published;
    if not found or v_product.available < v_stock.quantity then
      raise exception 'Insufficient inventory for one or more products.' using errcode = 'P0001';
    end if;
  end loop;

  insert into public.customers (full_name, phone, email)
  values (trim(p_customer_name), trim(p_phone), lower(trim(p_email)))
  on conflict (email) do update set full_name = excluded.full_name, phone = excluded.phone
  returning id into v_customer_id;

  v_shipping_fee := 0;
  v_total := v_subtotal + v_shipping_fee;
  if p_fulfillment_method = 'PICKUP' then
    select id into v_store_id from public.stores where is_active order by created_at limit 1;
    if v_store_id is null then
      raise exception 'Store pickup is temporarily unavailable.' using errcode = 'P0002';
    end if;
  end if;
  v_tracking_token := replace(gen_random_uuid()::text,'-','') || replace(gen_random_uuid()::text,'-','');

  insert into public.orders (
    customer_id, tracking_token, fulfillment_method, payment_method, shipping_address,
    pickup_store_id, subtotal, shipping_fee, total
  ) values (
    v_customer_id, v_tracking_token, p_fulfillment_method, 'COD',
    case when p_fulfillment_method = 'SHIP' then p_shipping_address else null end,
    v_store_id, v_subtotal, v_shipping_fee, v_total
  ) returning id, order_number into v_order_id, v_order_number;

  for v_line in
    select x.product_id, trim(x.size) as size, trim(x.color) as color, sum(x.quantity)::integer as quantity
    from jsonb_to_recordset(p_items) as x(product_id uuid, size text, color text, quantity integer)
    group by x.product_id, trim(x.size), trim(x.color)
    order by x.product_id, trim(x.size), trim(x.color)
  loop
    select * into v_product from public.products where id = v_line.product_id;
    insert into public.order_items (order_id, product_id, size, color, quantity, unit_price, subtotal)
    values (v_order_id, v_product.id, v_line.size, v_line.color, v_line.quantity, v_product.price, v_product.price * v_line.quantity);
    update public.products set reserved = reserved + v_line.quantity where id = v_product.id;
    insert into public.inventory_movements (product_id, order_id, movement_type, quantity, note)
    values (v_product.id, v_order_id, 'RESERVE', v_line.quantity, 'Stock reserved for new COD order');
  end loop;

  insert into public.order_status_history (order_id, old_status, new_status, note)
  values (v_order_id, null, 'PENDING', 'Order placed by customer');

  return jsonb_build_object(
    'order_number', v_order_number,
    'tracking_token', v_tracking_token,
    'status', 'PENDING',
    'subtotal', v_subtotal,
    'shipping_fee', v_shipping_fee,
    'total', v_total
  );
end;
$$;

create or replace function public.get_public_order(p_tracking_token text)
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'id', o.id,
    'order_number', o.order_number,
    'tracking_token', o.tracking_token,
    'status', o.status,
    'fulfillment_method', o.fulfillment_method,
    'payment_method', o.payment_method,
    'shipping_address', o.shipping_address,
    'pickup_store', case when s.id is null then null else jsonb_build_object('name',s.name,'address',s.address) end,
    'subtotal', o.subtotal,
    'shipping_fee', o.shipping_fee,
    'total', o.total,
    'revenue_recognized', o.revenue_recognized,
    'created_at', o.created_at,
    'confirmed_at', o.confirmed_at,
    'processing_at', o.processing_at,
    'shipped_at', o.shipped_at,
    'delivered_at', o.delivered_at,
    'completed_at', o.completed_at,
    'customer', jsonb_build_object('full_name',c.full_name,'phone',c.phone,'email',c.email),
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
        'product_id', p.id, 'sku', p.sku, 'name', p.name, 'category',p.category,
        'size',oi.size,'color',oi.color,'quantity',oi.quantity,'unit_price',oi.unit_price,'subtotal',oi.subtotal,'image_url',p.image_url
      ) order by p.name)
      from public.order_items oi join public.products p on p.id = oi.product_id
      where oi.order_id = o.id
    ), '[]'::jsonb),
    'status_history', coalesce((
      select jsonb_agg(jsonb_build_object('old_status',h.old_status,'new_status',h.new_status,'note',h.note,'created_at',h.created_at) order by h.created_at)
      from public.order_status_history h where h.order_id = o.id
    ), '[]'::jsonb)
  )
  from public.orders o
  join public.customers c on c.id = o.customer_id
  left join public.stores s on s.id = o.pickup_store_id
  where o.tracking_token = p_tracking_token and length(p_tracking_token) = 64
  limit 1;
$$;

create or replace function public.change_order_status(p_order_id uuid, p_new_status text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_order public.orders%rowtype;
begin
  if not public.is_erp_admin() then
    raise exception 'ERP administrator access is required.' using errcode = '42501';
  end if;
  if p_new_status not in ('CONFIRMED','PROCESSING','SHIPPED','DELIVERED') then
    raise exception 'This status cannot be set by an ERP action.' using errcode = '22023';
  end if;
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'Order not found.' using errcode = 'P0002';
  end if;
  if not (
    (v_order.status = 'PENDING' and p_new_status = 'CONFIRMED') or
    (v_order.status = 'CONFIRMED' and p_new_status = 'PROCESSING') or
    (v_order.status = 'PROCESSING' and p_new_status = 'SHIPPED') or
    (v_order.status = 'SHIPPED' and p_new_status = 'DELIVERED')
  ) then
    raise exception 'Invalid order transition: % → %.', v_order.status, p_new_status using errcode = '22023';
  end if;

  update public.orders set
    status = p_new_status,
    confirmed_at = case when p_new_status = 'CONFIRMED' then now() else confirmed_at end,
    processing_at = case when p_new_status = 'PROCESSING' then now() else processing_at end,
    shipped_at = case when p_new_status = 'SHIPPED' then now() else shipped_at end,
    delivered_at = case when p_new_status = 'DELIVERED' then now() else delivered_at end
  where id = p_order_id;
  insert into public.order_status_history (order_id, old_status, new_status, note)
  values (p_order_id, v_order.status, p_new_status, 'Updated by ERP administrator');
  return jsonb_build_object('order_id',p_order_id,'order_number',v_order.order_number,'status',p_new_status);
end;
$$;

create or replace function public.confirm_customer_receipt(p_tracking_token text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_order public.orders%rowtype;
  v_item record;
begin
  if p_tracking_token is null or length(p_tracking_token) <> 64 then
    raise exception 'Tracking link is invalid.' using errcode = '22023';
  end if;
  select * into v_order from public.orders where tracking_token = p_tracking_token for update;
  if not found then
    raise exception 'Order not found.' using errcode = 'P0002';
  end if;
  if v_order.status <> 'DELIVERED' then
    raise exception 'Receipt can only be confirmed after delivery.' using errcode = '22023';
  end if;

  update public.orders set status = 'CUSTOMER_CONFIRMED', confirmed_by_customer_at = now() where id = v_order.id;
  insert into public.order_status_history (order_id, old_status, new_status, note)
  values (v_order.id, 'DELIVERED', 'CUSTOMER_CONFIRMED', 'Customer confirmed receipt through tracking link');

  for v_item in
    select product_id, sum(quantity)::integer as quantity
    from public.order_items where order_id = v_order.id
    group by product_id order by product_id
  loop
    update public.products
    set on_hand = on_hand - v_item.quantity,
        reserved = reserved - v_item.quantity
    where id = v_item.product_id
      and on_hand >= v_item.quantity and reserved >= v_item.quantity;
    if not found then
      raise exception 'Inventory reservation is inconsistent; receipt was not finalized.' using errcode = '23514';
    end if;
    insert into public.inventory_movements (product_id, order_id, movement_type, quantity, note)
    values (v_item.product_id, v_order.id, 'SALE_COMPLETED', v_item.quantity, 'Stock consumed after customer receipt confirmation');
  end loop;

  insert into public.revenue_transactions (order_id, amount, transaction_type)
  values (v_order.id, v_order.total, 'ORDER_REVENUE');
  update public.orders set status = 'COMPLETED', revenue_recognized = true, completed_at = now() where id = v_order.id;
  insert into public.order_status_history (order_id, old_status, new_status, note)
  values (v_order.id, 'CUSTOMER_CONFIRMED', 'COMPLETED', 'Revenue recognized and inventory finalized');

  return public.get_public_order(p_tracking_token);
end;
$$;

revoke all on function public.place_order(text,text,text,text,jsonb,jsonb) from public;
revoke all on function public.get_public_order(text) from public;
revoke all on function public.change_order_status(uuid,text) from public;
revoke all on function public.confirm_customer_receipt(text) from public;
grant execute on function public.place_order(text,text,text,text,jsonb,jsonb) to anon, authenticated;
grant execute on function public.get_public_order(text) to anon, authenticated;
grant execute on function public.change_order_status(uuid,text) to authenticated;
grant execute on function public.confirm_customer_receipt(text) to anon, authenticated;
