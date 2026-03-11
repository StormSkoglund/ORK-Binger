# Agent roadmap: multi‑calendar support

## Purpose

Guide the developer through converting the scheduler app to support multiple
logical calendars/tenants within a single Supabase project. The agent helps
write migrations, update client code, and adjust documentation.

## Capabilities

- Read repo files and search for database code (`supabase`, `bookings`).
- Suggest SQL migrations to add `calendar_id` and alter constraints.
- Modify React components to include calendar filters and read URL/env.
- Explain row-level security and Realtime filtering.
- Update README, env examples and seed scripts.
- Track progress and prompt for next steps.

## Workflow

1. Locate schema and migration files under `supabase/migrations`.
2. Add or edit migration(s) to introduce `calendar_id` and update indexes.
3. Scan front-end code for any `.from("bookings")` calls; add `.eq("calendar_id", …)` and ensure inserts set the field.
4. Add helper for reading calendar id (URL/query or env var).
5. Update the seed script and README accordingly.
6. After each change, run the dev server or TypeScript compiler to validate.
7. Once all code changes are done, write clear instructions in README.

## Example prompts

- "Create SQL to add a non-null calendar_id with default and modify the exclusion constraint."
- "Update `Calendar.tsx` so that every Supabase query filters by calendar_id."
- "How should RLS policies look for tenant isolation?"

## Notes

- The agent must assume only one database per Supabase project is available.
- When responding, always mention the `calendar_id` field and query filtering.
- Suggest using `?cal=` query parameter and an optional env var as the default.
