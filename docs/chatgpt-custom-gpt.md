# ChatGPT Custom GPT → Zaqone SaleCRM (Cara 1)

Connect ChatGPT to SaleCRM using the existing **Agent API**.  
No MCP server needed. Auth = API key only (`zaqone_...`).

**Never** ask ChatGPT (or the GPT) to open the CRM login page or use email/password.

---

## Prerequisites

- ChatGPT **Plus / Pro** (Custom GPTs)
- Admin access to SaleCRM
- Production URL: `https://salescrm.zaqone.com`

---

## 1. Generate API key

1. Login as **admin** → Settings / panel **AI API Key**
2. Click **Generate**
3. Copy the key (`zaqone_...`) and store it safely  
   - You may not see the full key again after leaving the page

Test in browser or terminal:

```text
https://salescrm.zaqone.com/api/agent/test?api_key=zaqone_YOUR_KEY
```

Expected: `"ok": true`, `"connected": true`.

---

## 2. Create a Custom GPT

1. Open [ChatGPT](https://chatgpt.com) → **Explore GPTs** → **Create a GPT**
2. Open tab **Configure**
3. Fill:

| Field | Suggested value |
|--------|------------------|
| Name | Zaqone CRM |
| Description | Ask about sales performance from SaleCRM |
| Instructions | See block below |

### Instructions (paste into GPT)

```text
You are the Zaqone SaleCRM assistant.

Rules:
- Use Actions (API) only to answer CRM questions.
- Never ask the user for email or password.
- Never tell the user to open the CRM website login page.
- Authentication is already configured via X-API-Key.
- Prefer sales slugs like: shiema, alip, fatin (lowercase).
- If unsure which sales user, call listSalesUsers first.

Typical tasks:
- Test connection
- List sales users
- Performance summary for a sales user (default last 30 days)
- Recent activity
- Daily breakdown
```

---

## 3. Add Actions (OpenAPI)

1. In the GPT editor → **Actions** → **Create new action**
2. **Import from URL** (after this deploy is live):

```text
https://salescrm.zaqone.com/agent-openapi.json
```

or:

```text
https://salescrm.zaqone.com/api/agent/openapi
```

3. **Authentication**
   - Auth Type: **API Key**
   - API Key → **Custom** / Header
   - Header name: `X-API-Key`
   - API Key value: paste `zaqone_...`

4. Click **Save** / update action schema if prompted

---

## 4. Test prompts

After publishing/saving the GPT:

- `Test CRM connection`
- `List all sales users`
- `Summary for alip last 30 days`
- `Recent activity for shiema`
- `Daily breakdown for fatin last 14 days`

---

## Available endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/agent/help` | Public setup help (no auth) |
| GET | `/api/agent/test` | Test key + connection |
| GET | `/api/agent/sales-users` | List sales reps |
| GET | `/api/agent/sales-user/{slug}/summary?days=30` | Performance summary |
| GET | `/api/agent/sales-user/{slug}/activity?limit=50` | Recent activity |
| GET | `/api/agent/sales-user/{slug}/daily-breakdown?days=30` | Daily breakdown |
| GET | `/api/agent/openapi` | OpenAPI JSON for ChatGPT |
| GET | `/agent-openapi.json` | Same schema (static file) |

Auth (any one):

- Header: `X-API-Key: zaqone_...`
- Header: `Authorization: Bearer zaqone_...`
- Query: `?api_key=zaqone_...`

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| 401 Invalid API key | Regenerate key in Admin; update GPT Actions auth |
| 503 CRM API key not configured | Generate key in Admin settings first |
| Import OpenAPI failed | Confirm URL opens in browser; wait for Vercel deploy |
| GPT invents data | Remind it to use Actions; check Actions are enabled for the chat |
| Wrong sales person | Ask GPT to list users first, use exact `slug` |

---

## Security notes

- Treat `zaqone_...` like a password — do not commit it to git or share in chat logs
- Rotate the key from Admin if leaked
- This API is **read-oriented** sales monitor access; do not expose write admin tools without a separate review

---

## Files in this repo

- [`public/agent-openapi.json`](../public/agent-openapi.json) — schema for ChatGPT Actions
- [`src/app/api/agent/openapi/route.ts`](../src/app/api/agent/openapi/route.ts) — serves OpenAPI
- [`src/app/api/agent/help/route.ts`](../src/app/api/agent/help/route.ts) — live help JSON
- [`src/lib/agent-auth.ts`](../src/lib/agent-auth.ts) — API key validation
