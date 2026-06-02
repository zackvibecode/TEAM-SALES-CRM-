# Deploy Zaqone CRM on Vercel

## 1. Import from GitHub

1. Open [vercel.com/new](https://vercel.com/new)
2. Import **zackvibecode/TEAM-SALES-CRM-**
3. Framework: **Next.js** (auto-detected)
4. Root directory: `.` (repo root)

## 2. Environment variables (required)

Add these in **Project → Settings → Environment Variables** for **Production**, **Preview**, and **Development**:

| Name | Notes |
|------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (server only — never expose to client) |

Copy values from your local `.env.local` or Supabase Dashboard → Project Settings → API.

## 3. Supabase auth redirect URLs

In Supabase → **Authentication → URL Configuration**, add:

- **Site URL:** `https://YOUR-VERCEL-DOMAIN.vercel.app`
- **Redirect URLs:** `https://YOUR-VERCEL-DOMAIN.vercel.app/**`

Use your production domain and preview URLs (`*.vercel.app`) as needed.

## 4. Deploy

- **Git push to `main`** triggers production deploy (if Git integration is connected).
- Or run locally: `npx vercel` (preview) / `npx vercel --prod` (production).

## 5. Run SQL migrations

In Supabase SQL Editor, run files in `supabase-migrations/` in order (001 → 005). See `MIGRATION.md`.
