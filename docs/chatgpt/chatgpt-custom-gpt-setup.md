# Zaqone SaleCRM → ChatGPT Custom GPT (Cara 1)

Connect ChatGPT to your live CRM using the existing **Agent API**. No MCP server required.

## What you need

- ChatGPT **Plus / Pro** (Create a GPT)
- Admin access to SaleCRM
- Production base URL: `https://salescrm.zaqone.com`

## Step 1 — Generate API key

1. Open SaleCRM Admin → **Settings → AI API Key**
2. Click **Generate**
3. Copy the key (`zaqone_...`) and store it safely  
   You will not see the full key again after leaving the page.

## Step 2 — Create a Custom GPT

1. Go to [ChatGPT](https://chatgpt.com) → **Explore GPTs** → **Create a GPT**
2. Open **Configure**
3. Name example: `Zaqone CRM Assistant`
4. Paste this into **Instructions**:

```text
You are the Zaqone SaleCRM assistant.
Use Actions (API) only to answer questions about sales performance.
Never ask the user for email or password.
Never tell the user to open the CRM login page in a browser.
Auth is API key only (X-API-Key).
Prefer sales slugs like: shiema, alip, fatin (lowercase).
If a name is given, map it to the closest slug from listSalesUsers.
```

## Step 3 — Add Actions (OpenAPI)

1. In the GPT editor, open **Actions**
2. **Import from URL** and paste one of:

```text
https://salescrm.zaqone.com/agent-openapi.json
```

or

```text
https://salescrm.zaqone.com/api/agent/openapi
```

3. Authentication:
   - Auth Type: **API Key**
   - API Key: paste `zaqone_...`
   - Auth Type / location: **Header**
   - Custom Header Name: `X-API-Key`

4. Save

## Step 4 — Test in the GPT

Try:

- `Test CRM connection`
- `List all sales users`
- `Summary for alip last 30 days`
- `Recent activity for shiema`
- `Daily breakdown for fatin last 14 days`

## Available endpoints

| Action | Path |
|--------|------|
| Test connection | `GET /api/agent/test` |
| List sales users | `GET /api/agent/sales-users` |
| Performance summary | `GET /api/agent/sales-user/{slug}/summary?days=30` |
| Recent activity | `GET /api/agent/sales-user/{slug}/activity?limit=50` |
| Daily breakdown | `GET /api/agent/sales-user/{slug}/daily-breakdown?days=30` |
| Public help (no auth) | `GET /api/agent/help` |
| OpenAPI schema | `GET /api/agent/openapi` or `/agent-openapi.json` |

## Auth rules (important)

Send the key as:

- Header: `X-API-Key: zaqone_...` (recommended for ChatGPT)
- or `Authorization: Bearer zaqone_...`
- or query `?api_key=zaqone_...` (for quick browser tests only)

Do **not**:

- Use `/api/auth/login`
- Ask for CRM email/password
- Rely on `*.vercel.app` if Deployment Protection blocks it — use `salescrm.zaqone.com`

## Quick curl checks

```bash
curl "https://salescrm.zaqone.com/api/agent/test" -H "X-API-Key: zaqone_YOUR_KEY"

curl "https://salescrm.zaqone.com/api/agent/sales-users" -H "X-API-Key: zaqone_YOUR_KEY"

curl "https://salescrm.zaqone.com/api/agent/sales-user/alip/summary?days=30" -H "X-API-Key: zaqone_YOUR_KEY"
```

## Files in this repo

| File | Purpose |
|------|---------|
| [`public/agent-openapi.json`](../public/agent-openapi.json) | OpenAPI schema for ChatGPT Actions |
| [`src/app/api/agent/openapi/route.ts`](../src/app/api/agent/openapi/route.ts) | Serves the schema at `/api/agent/openapi` |
| [`src/app/api/agent/help/route.ts`](../src/app/api/agent/help/route.ts) | Live help + setup hints |
| [`src/lib/agent-auth.ts`](../src/lib/agent-auth.ts) | API key validation |

## Later: MCP (optional)

If you later want one connector for ChatGPT + Cursor + Claude, build a remote HTTPS MCP that wraps these same `/api/agent/*` endpoints. Custom GPT (this guide) stays the easiest path for ChatGPT-only use.
