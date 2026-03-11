-- Migration: add calendar_id column for multi‑tenant support
-- Run this in the Supabase SQL editor after running the original
-- create_bookings_table.sql migration.

-- 1) add the new column with a default value so existing rows are backfilled
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS calendar_id text NOT NULL DEFAULT 'default';

-- 2) (optional) if you already have rows and want to mark them specially:
--    update public.bookings set calendar_id='legacy' where calendar_id='default';
--    -- run only once if you want to keep legacy data separate.

-- 3) recreate the exclusion constraint so it includes calendar_id
ALTER TABLE public.bookings
  DROP CONSTRAINT IF EXISTS bookings_no_time_overlap;

ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_no_time_overlap
    EXCLUDE USING gist
      (calendar_id WITH =,
       tstzrange(start_ts, end_ts) WITH &&);

-- 4) add an index on calendar_id to speed up filtered queries
CREATE INDEX IF NOT EXISTS idx_bookings_calendar ON public.bookings (calendar_id);
