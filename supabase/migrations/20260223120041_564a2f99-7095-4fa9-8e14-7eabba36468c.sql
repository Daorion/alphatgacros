
CREATE TABLE public.weekly_workouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start date NOT NULL,
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  title text NOT NULL,
  description text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(week_start, day_of_week)
);

ALTER TABLE public.weekly_workouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can do everything on workouts"
  ON public.weekly_workouts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can view workouts"
  ON public.weekly_workouts FOR SELECT TO authenticated
  USING (true);

CREATE TRIGGER update_weekly_workouts_updated_at
  BEFORE UPDATE ON public.weekly_workouts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
