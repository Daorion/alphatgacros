
-- Drop the old simple columns and add rich workout structure
ALTER TABLE public.weekly_workouts 
  DROP CONSTRAINT IF EXISTS weekly_workouts_week_start_day_of_week_key;

ALTER TABLE public.weekly_workouts
  ADD COLUMN IF NOT EXISTS intensity text DEFAULT 'média',
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS warmup text,
  ADD COLUMN IF NOT EXISTS activation text,
  ADD COLUMN IF NOT EXISTS strength text,
  ADD COLUMN IF NOT EXISTS wod text,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS week_label text;

-- Move old description to wod if it exists, title stays
UPDATE public.weekly_workouts SET wod = description WHERE description IS NOT NULL AND wod IS NULL;

-- Re-add unique constraint
ALTER TABLE public.weekly_workouts
  ADD CONSTRAINT weekly_workouts_week_start_day_of_week_key UNIQUE (week_start, day_of_week);
