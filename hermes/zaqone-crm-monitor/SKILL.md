---
name: zaqone-crm-monitor
description: Monitor aktiviti sales dalam Zaqone CRM — hari aktif, klik WhatsApp, follow-up, daily goal. Guna API read-only CRM.
---

# Zaqone CRM Sales Monitor

Jawab soalan tentang prestasi sales dalam **Zaqone CRM** dengan memanggil API agent (baca sahaja).

## Konfigurasi

Baca dari environment (`~/.hermes/.env`):
- `ZAQONE_CRM_URL` — URL asas CRM (contoh `https://salescrm.zaqone.com`)
- `ZAQONE_API_KEY` atau `CRM_API_KEY` — API key yang sama seperti dalam Vercel

Hantar key dengan **salah satu** cara (paling senang: `X-API-Key`):
```
X-API-Key: <key-anda>
```
atau
```
Authorization: Bearer <key-anda>
```

API ini **bukan khas Hermes** — mana-mana agent yang boleh HTTP fetch boleh guna.

## Slug nama sales

Tukar nama kepada slug: huruf kecil, ruang → sempang.
- "Timsah Mirata" → `timsah-mirata`

Jika tidak pasti slug, panggil `GET {ZAQONE_CRM_URL}/api/agent/sales-users` dahulu.

## Endpoint

| Soalan biasa | Endpoint |
|--------------|----------|
| Senarai sales | `GET /api/agent/sales-users` |
| Ringkasan (hari aktif, klik, goal) | `GET /api/agent/sales-user/{slug}/summary?days=30` |
| Aktiviti terkini | `GET /api/agent/sales-user/{slug}/activity?limit=50` |
| Pecahan mengikut hari | `GET /api/agent/sales-user/{slug}/daily-breakdown?days=30` |

## Cara jawab

- **Sentiasa jawab dalam Bahasa Melayu** melainkan user minta bahasa lain.
- Jangan dedahkan token API dalam jawapan.
- Terangkan: berapa hari aktif, apa yang dilakukan, sama ada capai daily goal.

## Contoh

User: "Berapa hari Timsah Mirata aktif bulan ini?"
→ `GET .../api/agent/sales-user/timsah-mirata/summary?days=30`
→ Jawab ringkas dalam BM dengan angka dari `active_days_count`, `total_whatsapp_clicks`, `today_completed`, `daily_follow_up_goal`.
