# Scripts

Utility scripts (not part of the Next.js runtime). Run from repo root.

## npm shortcuts

```bash
npm run local:reset
npm run local:fresh
npm run backfill:dates -- "path/to/file.xlsx"
npm run backfill:dates-from-order
```

## Maintenance / one-off

| Script | Purpose |
|--------|---------|
| `clear-sfu-leads-by-email.ts` | Clear SFU leads for a PIC email |
| `estimate-db-mb.ts` | Estimate DB size |
| `supabase-size-report.ts` | Supabase usage report |
| `local-reset.ps1` | Reset local Next cache |
| `setup-hermes-env.ps1` | Hermes env helper |

## Backfill / checks

| Script | Purpose |
|--------|---------|
| `backfill-created-at-from-xlsx.ts` | Backfill lead dates from Excel |
| `backfill-created-at-from-list-order.mjs` | Backfill from list order |
| `check-lead-years.mjs` / `count-lead-years.mjs` | Year checks |
| `check-list-order.mjs` / `verify-client-sort.mjs` | Sort verification |
| `test-*.mjs` | Manual test helpers |

No application code under `src/` depends on rearranging these files.
