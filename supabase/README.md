# Supabase setup

Use one Supabase project for both Next.js apps. In SQL Editor, run `schema.sql`, then `functions.sql`, then `seed.sql`.

Create the demo admin in Supabase Auth and allowlist that Auth user:

```sql
insert into public.erp_admins (user_id, email)
select id, email from auth.users
where lower(email) = 'admin@dseb-demo.com'
on conflict (user_id) do nothing;
```

The frontend only needs the project URL and publishable key. Do not expose a service-role/secret key. Checkout, delivery status transitions, and receipt confirmation are implemented as database RPCs so each critical change is validated and committed atomically.
