# ChatGPT → Zaqone SaleCRM

## Which method?

| Screen in ChatGPT | Use this URL | Auth |
|-------------------|--------------|------|
| **New Plugin / Custom MCP** | `https://salescrm.zaqone.com/api/mcp` | **OAuth** |
| Create a GPT → Actions | `https://salescrm.zaqone.com/agent-openapi.json` | API Key (`X-API-Key`) |

**Wrong:** pasting `/agent-openapi.json` into the MCP Plugin “Server URL” field — that is OpenAPI, not MCP. Connection will fail.

---

## A) MCP Plugin (recommended for your screenshot)

1. Admin CRM → **AI API Key / ChatGPT** → Generate & copy `zaqone_...`
2. ChatGPT → **New Plugin**
3. Fill:
   - **Name:** `SALESCRM`
   - **Connection:** Server URL
   - **URL:** `https://salescrm.zaqone.com/api/mcp`
   - **Authentication:** OAuth
4. Tick the safety checkbox → **Create**
5. ChatGPT opens SaleCRM authorize page → paste `zaqone_...` → **Authorize ChatGPT**
6. Test prompts:
   - `List sales users`
   - `Summary for alip last 30 days`
   - `Recent activity for shiema`

Admin live docs: `https://salescrm.zaqone.com/admin/api-key#chatgpt`

---

## B) Custom GPT Actions (alternative)

1. Create a GPT → Configure → Actions → Import from URL  
   `https://salescrm.zaqone.com/agent-openapi.json`
2. Auth: API Key → header `X-API-Key` → paste `zaqone_...`

### GPT Instructions

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

## Endpoints

### MCP tools (`/api/mcp`)
- `test_connection`
- `list_sales_users`
- `get_sales_summary`
- `get_sales_activity`
- `get_sales_daily_breakdown`

### REST Agent API (Custom GPT)
| Method | Path |
|--------|------|
| GET | `/api/agent/test` |
| GET | `/api/agent/sales-users` |
| GET | `/api/agent/sales-user/{slug}/summary?days=30` |
| GET | `/api/agent/sales-user/{slug}/activity?limit=50` |
| GET | `/api/agent/sales-user/{slug}/daily-breakdown?days=30` |

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| MCP Create fails / OAuth blank | URL must be `/api/mcp`, not openapi.json. Wait for deploy. |
| Authorize page says API key wrong | Regenerate key in Admin → AI API Key |
| 401 on tools | Re-connect plugin (OAuth again) |
| Custom GPT invents data | Remind it to use Actions |

---

## Security

- Treat `zaqone_...` like a password
- Admin only — do not share with sales
- Read-oriented sales monitor access
