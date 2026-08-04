ALTER TABLE public.seminar_bookings
  ALTER COLUMN seminar_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS event_id uuid REFERENCES public.events(id) ON DELETE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS seminar_bookings_student_event_key
  ON public.seminar_bookings(student_id, event_id)
  WHERE event_id IS NOT NULL AND status <> 'CANCELLED';

DROP POLICY IF EXISTS bookings_self_insert ON public.seminar_bookings;
CREATE POLICY bookings_self_insert ON public.seminar_bookings
  FOR INSERT TO authenticated
  WITH CHECK (student_id = public.current_student_id());

DROP POLICY IF EXISTS bookings_self_update ON public.seminar_bookings;
CREATE POLICY bookings_self_update ON public.seminar_bookings
  FOR UPDATE TO authenticated
  USING (student_id = public.current_student_id())
  WITH CHECK (student_id = public.current_student_id());