# Local development (fresh setup)

## 1. Environment

Copy example env if you do not have `.env.local` yet:

```powershell
Copy-Item .env.example .env.local
```

Edit `.env.local` with values from **Supabase → Project Settings → API**:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## 2. Supabase (one-time)

In **Authentication → URL Configuration**:

- Site URL: `http://localhost:3000`
- Redirect URLs: `http://localhost:3000/**`

Run SQL migrations in order in the SQL Editor (`supabase-migrations/001` … `008`), including WhatsApp pretext:

```sql
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS whatsapp_pretext TEXT;
```

## 3. Install and run (fresh)

From the project folder:

```powershell
cd "C:\Users\User\Desktop\MY PROJECT WEBAPP ZACK\TEAM SALES CRM"
npm run local:fresh
```

This stops old servers on ports 3000–3002, deletes `.next`, then starts **one** dev server.

Or step by step:

```powershell
npm run local:reset
npm run dev
```

**Important:** Run only **one** `npm run dev` at a time. Multiple terminals cause `ENOENT` / missing `lucide-react.js` errors.

Open **http://localhost:3000**

Check: **http://localhost:3000/api/health** → `"ok": true`

## 4. Useful URLs

| Page | URL |
|------|-----|
| Login | http://localhost:3000 |
| Sales dashboard | http://localhost:3000/dashboard/sales |
| WhatsApp message (sales) | http://localhost:3000/dashboard/sales/message |
| Admin settings | http://localhost:3000/admin/settings |

## 5. If you see `ENOENT` / missing `.next` files

Stop all `npm run dev` terminals (Ctrl+C), then:

```powershell
npm run local:clean
npm run dev
```

Still broken:

```powershell
Remove-Item -Recurse -Force .next, node_modules -ErrorAction SilentlyContinue
npm install
npm run dev
```
