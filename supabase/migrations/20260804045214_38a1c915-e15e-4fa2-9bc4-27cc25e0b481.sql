ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS students_user_id_key ON public.students(user_id) WHERE user_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.current_student_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.students WHERE user_id = auth.uid() LIMIT 1;
$$;

DROP POLICY IF EXISTS students_self_read ON public.students;
CREATE POLICY students_self_read ON public.students
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS student_events_self_read ON public.student_events;
CREATE POLICY student_events_self_read ON public.student_events
  FOR SELECT TO authenticated
  USING (student_id = public.current_student_id());

DROP POLICY IF EXISTS bookings_self_read ON public.seminar_bookings;
CREATE POLICY bookings_self_read ON public.seminar_bookings
  FOR SELECT TO authenticated
  USING (student_id = public.current_student_id());