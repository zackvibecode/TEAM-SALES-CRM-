# Supabase migrations

Run in Supabase SQL Editor against the same project as `NEXT_PUBLIC_SUPABASE_URL`.

## Numbered (core CRM)

Run in order: `001` → highest number.

| File | Purpose |
|------|---------|
| `019_payments_subscriptions.sql` | Payment, subscription, invoice tables + storage buckets + RLS |

## Sales Follow-Up (`sales-follow-up/`)

| File | Purpose |
|------|---------|
| `schema.sql` | Base SFU schema |
| `fix-live.sql` | Live fix / align |
| `verify-and-fix.sql` | Verify + fix |
| `events-table.sql` | Audit events table |
| `sfu-wa-templates.sql` | WhatsApp template columns |
| `dedupe-pics.sql` | Dedupe PIC rows (manual) |
| `unique-active-pic-name.sql` | Unique index on active PIC names |

Also: `supabase-schema.sql` (full dump reference, if present).
