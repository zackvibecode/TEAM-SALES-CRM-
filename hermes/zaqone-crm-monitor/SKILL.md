---
name: zaqone-crm-monitor
description: Zaqone CRM sales monitor. WAJIB guna HTTP GET ke /api/agent/ — JANGAN login web.
---

# Zaqone CRM — WAJIB IKUT (Hermes Telegram)

## JANGAN BUAT INI ❌

- JANGAN buka browser ke salescrm.zaqone.com
- JANGAN guna /api/auth/login
- JANGAN minta email atau password Boss Zack
- JANGAN guna Vercel bypass (tak perlu)
- JANGAN treat token zaqone_* sebagai password login

## YANG BETUL ✅

Token `zaqone_*` = **API key** untuk HTTP GET sahaja.

### Langkah 1 — Test connection (WAJIB pertama kali)

Guna tool `curl` atau `web_fetch` ke URL ini (ganti KEY):

```
https://salescrm.zaqone.com/api/agent/test?api_key=ZAQONE_API_KEY
```

Kalau `ok: true` → connected. Teruskan langkah 2.

### Langkah 2 — Jawab soalan user

Contoh soalan: "Berapa hari SHIEMA aktif?"

```
https://salescrm.zaqone.com/api/agent/sales-user/shiema/summary?days=30&api_key=ZAQONE_API_KEY
```

Baca JSON: `active_days_count`, `total_whatsapp_clicks`, `today_completed`, `daily_follow_up_goal`.

### Langkah 3 — Jawab Bahasa Melayu

Ringkas, guna angka dari JSON. Jangan tunjuk API key.

## Env vars (~/.hermes/.env)

```
ZAQONE_CRM_URL=https://salescrm.zaqone.com
ZAQONE_API_KEY=zaqone_xxxxxxxx
```

## Bantuan awam (tanpa key)

```
GET https://salescrm.zaqone.com/api/agent/help
```

## Slug sales

| Nama | Slug |
|------|------|
| SHIEMA | shiema |
| ALIP | alip |
| AIN | ain |
| FATIN | fatin |
| RIFQI | rifqi |

Senarai penuh: `/api/agent/sales-users?api_key=KEY`
