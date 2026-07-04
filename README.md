   # SplitWise+

   A premium, mobile-first expense-splitting PWA. Next.js 15 (App Router) + TypeScript + Tailwind + Framer Motion on the frontend, Supabase (Postgres + Auth + Realtime + RLS) as the entire backend — no custom server.

   **Design:** ink-black surfaces, a single violet brand accent, and a strict money-semantic pair (emerald = owed to you, rose = you owe). The signature visual is the "settlement flow" bar on the Settle Up tab — a moving gradient between two avatars instead of a flat list row.

   ## What's included in this pass

   - Auth: Google OAuth + email magic link, session-aware middleware
   - Groups: create, invite by link or email, strict privacy via RLS
   - Expenses: add with equal-split, animated timeline, expand-to-see-split, delete
   - Balances: net-balance engine + minimum-transaction settlement suggestions, mark as settled
   - Dashboard: total balance, you owe / you're owed, monthly spend, groups list
   - Activity feed per group, realtime-synced
   - Search + category/member filters, both global and per-group
   - Basic analytics (category breakdown, member contributions, highest spender)
   - PWA: manifest, service worker, installable, safe-area support
   - Profile/settings screen with "Developed by Prateek ❤️"

   ## Not yet built (natural next steps)

   - Unequal/percentage/exact-amount splits (equal split only for now)
   - Editing an existing expense (add is wired; edit needs the same form pre-filled)
   - Push notifications, currency conversion, data export/delete-account actions (UI stubs only)
   - Swipe-to-delete / pull-to-refresh gestures
   - Custom app icons in `public/icons/` (placeholders referenced in the manifest)

   ## 1. Set up Supabase

   1. Create a project at supabase.com (you're already signed in via GitHub — just hit "New project").
   2. In the SQL editor, run the two migration files **in order**:
      - `supabase/migrations/0001_schema.sql`
      - `supabase/migrations/0002_rls.sql`
   3. Authentication → Providers: enable **Google** (add your OAuth client ID/secret) and make sure **Email** is on for magic links.
   4. Authentication → URL Configuration: add `http://localhost:3000/auth/callback` (and your production URL later) as a redirect URL.
   5. Project Settings → API: copy the **Project URL** and **anon public key**.

   ## 2. Configure the app

   ```bash
   cp .env.local.example .env.local
   # paste your Project URL and anon key into .env.local
   ```

   ## 3. Run it

   ```bash
   npm install
   npm run dev
   ```

   Open `http://localhost:3000`. On a phone, use your machine's LAN IP so you can test the install-to-home-screen flow.

   ## 4. Deploy

   - Push to GitHub, import into Vercel, add the two `NEXT_PUBLIC_SUPABASE_*` env vars in Vercel's project settings, deploy.
   - Add your Vercel domain to Supabase's redirect URL allowlist (step 4 above).

   ## Verifying group privacy

   This was the spec's hardest requirement, so it's worth checking directly: sign in as two different users, have user A create a group and NOT invite user B, then sign in as user B and confirm that group never appears anywhere (dashboard, search, or via a guessed URL — the `groups_select_member_only` RLS policy blocks the row at the database level, not just in the UI).

   ## Architecture notes

   - `lib/balance-calculator.ts` is the single source of truth for money math (both the dashboard's aggregate balance and each group's balance call into it), so the two screens can't drift out of sync.
   - `lib/queries.ts` wraps every read/write in TanStack Query and subscribes to Supabase Realtime per group; any insert/update/delete on `expenses`, `settlements`, `activity_log`, or `group_members` invalidates the relevant query for every open tab/device.
   - RLS is enforced with a `security definer` helper (`is_group_member`) to avoid the classic recursive-policy trap on `group_members`.
