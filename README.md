# Rockeklubben Scheduler (Vite + React + TypeScript)

Simple calendar where users drag names onto dates and bookings are saved to Supabase.

## Quick start

1. Copy `.env.example` → `.env` and add your Supabase `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
   Optionally set `VITE_CALENDAR_ID` to provide a default calendar when
   the `?cal=` query‑parameter is not present.

2. (optional) seed the database with the weekly schedule using the helper
   script:
   ```bash
   # default calendar from .env or ?cal
   npm run seed:weekly [--weeks N]
   # specify calendar explicitly
   node scripts/seed-weekly.mjs --calendar mycalendar --weeks 12
   ```
3. Run:
   - npm install
   - npm run dev
4. Open http://localhost:5173

## Supabase setup

This repository now supports **multiple logical calendars (tenants)** inside a
single Supabase project. Each booking row has a `calendar_id` column; the
frontend passes a calendar identifier (via `?cal=foo` or `VITE_CALENDAR_ID`) on
every request and the database constraint ensures calendars don’t interfere.

To prepare an existing project for multi‑tenant use:

1. Run the SQL in `supabase/migrations/create_bookings_table.sql` to create the
   `bookings` table (if not done already).
2. Run `supabase/migrations/add_calendar_id.sql` to add the `calendar_id`
   column and update the exclusion constraint.
3. (Optional) run `supabase/migrations/alter_bookings_for_time_slots.sql` if
   you are upgrading from an older schema.

- Run the SQL in `supabase/migrations/create_bookings_table.sql` (Supabase SQL editor) to create the `bookings` table.
  - New schema uses `start_ts` / `end_ts` (timestamps) and an exclusion constraint to prevent overlapping bookings.
  - If you upgraded from the older single-day schema, run `supabase/migrations/alter_bookings_for_time_slots.sql` to migrate existing table.
- To support multiple calendars in one project run the new migration `supabase/migrations/add_calendar_id.sql`.
  The app will automatically add `calendar_id` to every insert and filter queries based
  on the `?cal=` query param (or `VITE_CALENDAR_ID` environment variable).
- For testing run `supabase/migrations/policies_for_testing.sql` to enable permissive RLS policies (see warnings in that file).
- Important: use the **anon** key (never the service role key) for this client app.

SQL note: the table now stores hourly `start_ts` / `end_ts` and enforces no overlapping time ranges using a GIST exclusion constraint.

### Troubleshooting: "Failed to save booking"

- Common causes:
  - Invalid `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` in `.env` (check Dashboard → Settings → API).
  - `bookings` table not created or RLS policies blocking anon access.
  - DB-level UNIQUE constraint rejection (date already booked) or invalid date format.
- How to diagnose:
  1. Open browser DevTools Console — look for Supabase error details.
  2. Check the notice banner in the app (appears when Supabase returns errors).
  3. Run the verification SQL in Supabase SQL editor: `SELECT * FROM public.bookings LIMIT 5;` or check `pg_policies`.
  4. Ensure `.env` values are correct and restart the dev server.

### Deploying to Netlify

Because this is a single-page React app, you must add a redirect so that any
path (including `/admin`) returns `index.html`. Netlify will otherwise return a
404 when you refresh or navigate directly to a client-side route. A suitable
`public/_redirects` file is included in this repo:

```
/*    /index.html   200
```

This is copied to `dist/` on build; make sure the file is present in your
published folder so that accessing `/admin` works correctly.

## Behavior

- Landing page now provides links for multiple rooms/call them "musikkbinge".
  visit `/musikkbinge1`, `/musikkbinge2`, or `/musikkbinge3` (or use
  `?cal=musikkbinge1` query parameter) to open a specific calendar.

- Drag a name from the left column onto a date to create a booking.
- Client prevents visible double-booking; the DB has a UNIQUE constraint to prevent race-condition double-booking.
- If DB rejects the insert, the UI removes the calendar event and shows an error.
- Realtime updates: bookings made in one browser appear in other open sessions automatically.
- Undo toast: after creating/rescheduling a booking you get an "Undo" toast to quickly cancel it.
- Cancel / Reschedule: click an existing booking to cancel it or pick a new date to reschedule.
- **Admin-only action**: the “Gjenstart ukeplan” button has been moved to a hidden administration page. Visit `/admin` (or click the small “Admin” link in the header) to access it; it is not shown on the normal scheduling UI to avoid accidental presses.

## Files

- `src/components/Calendar.tsx` — FullCalendar + drop handling
- `src/components/DraggableNames.tsx` — external draggable names
- `src/lib/supabase.ts` — Supabase client
- `supabase/migrations/create_bookings_table.sql` — SQL to create `bookings` table

## Next steps (optional)

- Add auth (Supabase Auth)
- Real-time updates using `supabase.channel` / Realtime
- Allow cancelling/rescheduling bookings
- Extend the multi‑tenant logic if you need per‑calendar settings, themes, or
  separate name lists. The current implementation uses a simple
  `calendar_id` column and query parameter – you could build a selector or
  store the id in localStorage for a richer user experience.
