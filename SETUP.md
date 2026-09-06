# Setting up Wild Honey Circle

You don't need to know how to code to get this running. Follow these steps in order.

## 1. Set up the database (Supabase)

1. Go to supabase.com and create a free account and a new project.
2. Once it's created, go to the **SQL Editor** (left sidebar) → **New query**.
3. Open `supabase/schema.sql` in this project, copy the whole thing, paste it into the SQL editor, and click **Run**.
   - This creates every table the app needs, sets up security rules so people can only see what they should, and adds 10 starter prompts, 2 starter products, and 1 starter retreat so the app isn't empty on day one.
4. Go to **Settings → API** in Supabase. You'll need three values for the next step:
   - **Project URL**
   - **anon public key**
   - **service_role key** (click "reveal" — keep this one secret, never share it)

## 2. Add your environment variables

1. In this project, copy `.env.example` to a new file called `.env.local`.
2. Paste in the three Supabase values from above.
3. Leave the Stripe fields blank for now — the app works fine without them (checkout buttons will just say "payments aren't connected yet").

## 3. Make yourself an admin

1. Deploy the app (see step 5) or run it locally, and sign up for an account through the normal sign-up page — use your own email.
2. Back in Supabase, go to **Table Editor → profiles**, find your row (search by your email), and change `is_admin` from `false` to `true`.
3. Reload the app — you'll now see an "Admin" link in the header. That's where you manage prompts, products, and retreats without touching code.

## 4. Turn on payments (Stripe) — optional, do this when you're ready to sell

1. Create a free Stripe account at stripe.com.
2. Go to **Developers → API keys**. Copy the **Secret key** and **Publishable key** into `.env.local`.
3. Go to **Product catalog → Add product**. Create one product per membership tier ("The Circle", "Inner Circle"), each with a **recurring monthly price**. Copy each price's ID (starts with `price_`) into `STRIPE_PRICE_CIRCLE` and `STRIPE_PRICE_INNER_CIRCLE`.
4. Go to **Developers → Webhooks → Add endpoint**. Set the URL to `https://YOUR-DOMAIN/api/webhooks/stripe`. Select these events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`. Copy the **Signing secret** into `STRIPE_WEBHOOK_SECRET`.
5. Add all the same variables to Vercel (Project Settings → Environment Variables) so they work in production, not just on your computer. Redeploy after adding them.
6. Optional: set `STRIPE_TRIAL_DAYS` (for example `7`) to give new members a free trial.

What membership opens: both programs, Watch, recipes and meal plans, grocery and pantry, every workout, Freedom, Learning and child sign-ins, and posting in the Circle. Free members keep Today, food logging, Body, check-ins, habits and reading the Circle. Inner Circle adds Ask the experts. You can grant or change anyone's tier by hand from Admin → Members.

Digital products (like the Module One journal PDF) don't need a Stripe Price set up individually — the admin dashboard lets you set a price directly and Stripe checkout will use it automatically.

## 5. Deploy

1. Push this project to a GitHub repo.
2. Go to vercel.com, sign up free, and import that repo.
3. Add your environment variables (same ones from `.env.local`) in Vercel's project settings before the first deploy.
4. Deploy. You'll get a real URL you can open on any phone or share with anyone.

## What's already built

- Real accounts (signup/login), not a "type your name" gate — people are actually remembered now
- Daily prompt + private or shared journal entries, with streaks
- Community feed with reactions and comments
- Shop for one-time digital product purchases
- Retreats with waitlist/reservation signups
- Free / Circle / Inner Circle membership tiers
- Admin dashboard to add prompts, products, and retreats yourself, plus basic metrics

## If something breaks

Most issues trace back to one of two things:
- A missing environment variable (double-check `.env.local` against `.env.example`)
- The SQL schema not having been run yet in Supabase

Paste the exact error message back to Claude and it can usually pinpoint the fix quickly.
