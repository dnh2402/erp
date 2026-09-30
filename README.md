# DSEB Store + ERP

Two independent Next.js applications share one Supabase PostgreSQL database:

```text
store/  ─┐
        ├── Supabase (PostgreSQL + Auth)
erp/    ─┘
```

The demo follows one business transaction from checkout through delivery. Checkout reserves stock. Revenue is posted and stock is consumed only after the customer confirms receipt.

## Apps and stack

- `store/`: public Vietnamese sneaker storefront, cart, COD checkout, and tracking.
- `erp/`: authenticated operations dashboard, orders, inventory, customers, revenue, and products.
- Next.js App Router, TypeScript, Tailwind CSS, Supabase Auth and PostgreSQL.
- No separate backend or payment service. Both apps use the same Supabase URL and publishable key.

## Setup

### 1. Create one Supabase project

Create a project at Supabase, then open **SQL Editor** and run these files in order:

1. `supabase/schema.sql`
2. `supabase/functions.sql`
3. `supabase/seed.sql`

The seed creates 100 fictional sneakers, a separate demo jacket, a flagship pickup store, customers, and historical orders. It is safe to run once on a fresh project; do not rerun it over live demo activity.

### 2. Create the ERP admin

In **Authentication → Users**, add:

- Email: `admin@dseb-demo.com`
- Password: `DSEBadmin2026!`

For a local-only classroom demo, that password is convenient; change it before sharing a deployed ERP. Then run this SQL, which grants ERP access only to that Auth user:

```sql
insert into public.erp_admins (user_id, email)
select id, email from auth.users
where lower(email) = 'admin@dseb-demo.com'
on conflict (user_id) do nothing;
```

### 3. Configure both apps

Copy each `.env.example` to `.env.local` and set the same values in both apps:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
```

Use the Supabase **publishable** key (legacy anon key is also accepted by Supabase). Never put a service-role or secret key in either app. The project does not require one.

### 4. Install and run

Requirements: Node.js 22+ and pnpm 11. The apps use Next.js 16; pnpm 11 itself requires Node.js 22 or newer.

From this directory:

```bash
pnpm install
pnpm dev:store   # http://localhost:3000
pnpm dev:erp     # in another terminal, http://localhost:3001
```

The ERP uses port 3001 by default. You can also run `pnpm --dir store dev` or `pnpm --dir erp dev`.

## Local business flow

1. Browse `/products`, select a size and add a product to the cart.
2. Checkout as a guest with either shipping details or pickup at DSEB Flagship Store. Payment is COD.
3. The database creates the order and reserves stock in one transaction. The confirmation page gives you a private tracking URL.
4. In ERP, advance the order through Confirm → Processing → Shipped → Delivered.
5. Open the tracking URL and choose **ĐÃ NHẬN HÀNG**.
6. The database atomically moves the order to Completed, posts revenue once, reduces reserved stock, and deducts on-hand stock.

ERP lists and customer tracking refresh every three seconds. Dashboard totals are queried from database records, including the seeded history.

### Exact live demo

- Add 2 × `DSEB AirFlex 01` at `1,299,000 ₫` each and 1 × `DSEB Urban Jacket` at `899,000 ₫`.
- Checkout as `Nguyen Van An`, choose ship to address, and use COD. Delivery is free, so the order total is `3,497,000 ₫`.
- After running the seed, AirFlex stock starts at 100 and the jacket at 50. Checkout leaves on-hand unchanged and reserves 2 and 1 units respectively.
- In ERP, advance the order through Confirmed → Processing → Shipped → Delivered. Confirm receipt on the Store tracking page.
- ERP then shows Completed, revenue `+3,497,000 ₫`, AirFlex `100 → 98`, jacket `50 → 49`, and reserved stock `2 → 0` / `1 → 0`.
- Optional inventory demo: `DSEB Velocity 01` starts at 5 units. Reserve 3 from checkout to see available stock fall to 2 while on-hand stays at 5.

## Database rules and security

- Product availability is a generated `on_hand - reserved` value.
- Public clients can read published products and call narrowly scoped order/tracking RPCs. They cannot write tables directly.
- Checkout locks the affected product rows, validates aggregate quantity and selected variants, and reserves inventory in a PostgreSQL transaction.
- ERP reads are protected by Row Level Security and the `erp_admins` allowlist. Status changes require an admin and a valid next step.
- Receipt confirmation accepts a tracking token, requires `DELIVERED`, and is idempotency-protected by order status plus a unique revenue row.
- Only `COMPLETED` orders have recognized revenue. COD is a recorded payment method; no real payment is collected.

## Deployment to Vercel

The deployment has three pieces: one Supabase project, one Vercel project for the Store, and one Vercel project for the ERP. Both apps use the same Supabase database.

### A. Push this project to GitHub

Create an empty GitHub repository, then open PowerShell in this project folder and run:

```powershell
git add .
git commit -m "Create DSEB Store and ERP"
git branch -M main
git remote add origin https://github.com/YOUR_ACCOUNT/YOUR_REPOSITORY.git
git push -u origin main
```

Replace the repository URL with your own. `.env.local` and other `.env.*` files are ignored by Git; keep real credentials out of commits.

### B. Prepare Supabase

1. Create one Supabase project and choose a region close to your users.
2. In **SQL Editor**, run `supabase/schema.sql`, then `supabase/functions.sql`, then `supabase/seed.sql`, in that order. Run the seed once on a fresh database.
3. In **Authentication → Users**, create your ERP admin user. Then run the admin allowlist SQL from [Create the ERP admin](#2-create-the-erp-admin) above, changing the email in the query if you used a different one.
4. In the project API settings, copy the Project URL and the **publishable** key. Do not use a service-role/secret key in either app.

### C. Deploy the Store on Vercel

1. In Vercel choose **Add New → Project** and import the GitHub repository.
2. Set **Root Directory** to `store`. Keep the Next.js framework and detected build settings.
3. Add these Environment Variables for Production (and Preview too if you plan to test previews):

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
   ```

4. Deploy, then copy the Store's production URL, for example `https://dseb-store.vercel.app`.

### D. Deploy the ERP on Vercel

1. Again choose **Add New → Project** and import the same GitHub repository as a second project.
2. Set **Root Directory** to `erp`. Keep the Next.js framework and detected build settings.
3. Add the same `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` values. Also add:

   ```env
   NEXT_PUBLIC_STORE_URL=https://YOUR_STORE.vercel.app
   ```

   Replace the value with the Store URL from step C. It powers the ERP's “Open Store” link.
4. Deploy. If you change an environment variable later, redeploy the affected Vercel project for it to take effect.

Vercel's monorepo flow creates a separate project for each app directory. If a build cannot see the repository's root `pnpm-workspace.yaml` or lockfile, open that project's **Settings → Build and Deployment → Root Directory** and enable **Include source files outside of the Root Directory in the Build Step**. The root workspace declares both apps and pins pnpm 11.25.0.

### E. Finish Supabase Auth URL settings

In Supabase **Authentication → URL Configuration**, set **Site URL** to the ERP production URL, then add both production URLs to **Redirect URLs**. For local sign-in, also allow `http://localhost:3001/**`. If you use Vercel preview deployments for auth testing, add a preview wildcard matching your Vercel account/team slug; keep the production URLs exact. Supabase uses these settings for safe auth redirects and email links.

### F. Check the live deployment

1. Open the Store URL and make sure products load.
2. Open the ERP URL, sign in with the admin account, and make sure the dashboard loads.
3. Place a small COD test order, move it through the ERP statuses to Delivered, then confirm receipt from its Store tracking link. Check that the order completes and stock/revenue update.

There is no separate API server or WebSocket service to deploy. COD is only recorded as a payment method; this project does not collect real payments.

## Project map

```text
store/                 Customer web app
erp/                   Admin web app
supabase/schema.sql    Tables, indexes, constraints, RLS
supabase/functions.sql Transactional RPCs and admin helper
supabase/seed.sql      Historical demo dataset
```

## Troubleshooting

- **Catalog says Supabase is not configured:** check `.env.local` in the app you started, then restart the dev server.
- **Products/orders are blank:** run the three SQL files in order and check the Supabase project URL/key.
- **ERP says this account has no admin access:** add the signed-in Auth user's `id` and email to `public.erp_admins` using the SQL above.
- **Tracking URL is invalid:** the token is a bearer link; use the complete URL returned after checkout.
- **No stock available:** a new order reserves units. Confirming receipt consumes them. The seeded stock is varied and finite.
- **Vercel shows no data:** make sure both deployments point at the same Supabase project and include the same publishable key.
