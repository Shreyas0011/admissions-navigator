-- 1. Ground access sessions (device-independent ground-staff auth)
CREATE TABLE public.ground_access_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.event_sessions(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  staff_name TEXT NOT NULL,
  purpose TEXT NOT NULL DEFAULT 'SEMINAR',
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.ground_access_sessions TO service_role;
ALTER TABLE public.ground_access_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ground_sessions_admin_read" ON public.ground_access_sessions
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE INDEX idx_ground_sessions_session ON public.ground_access_sessions(session_id);
CREATE TRIGGER ground_sessions_updated_at BEFORE UPDATE ON public.ground_access_sessions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2. Private student <-> assigned counsellor chat
CREATE TABLE public.student_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  counsellor_id UUID NOT NULL REFERENCES public.counsellors(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('STUDENT','COUNSELLOR')),
  sender_user_id UUID NOT NULL,
  body TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.student_messages TO authenticated;
GRANT ALL ON public.student_messages TO service_role;
ALTER TABLE public.student_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "messages_party_read" ON public.student_messages
  FOR SELECT TO authenticated
  USING (student_id = public.current_student_id() OR counsellor_id = public.current_counsellor_id());

CREATE POLICY "messages_student_send" ON public.student_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_type = 'STUDENT'
    AND sender_user_id = auth.uid()
    AND student_id = public.current_student_id()
    AND EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id = student_id AND s.counsellor_id = student_messages.counsellor_id
    )
  );

CREATE POLICY "messages_counsellor_send" ON public.student_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_type = 'COUNSELLOR'
    AND sender_user_id = auth.uid()
    AND counsellor_id = public.current_counsellor_id()
    AND EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id = student_messages.student_id AND s.counsellor_id = public.current_counsellor_id()
    )
  );

CREATE POLICY "messages_party_mark_read" ON public.student_messages
  FOR UPDATE TO authenticated
  USING (student_id = public.current_student_id() OR counsellor_id = public.current_counsellor_id())
  WITH CHECK (student_id = public.current_student_id() OR counsellor_id = public.current_counsellor_id());

CREATE INDEX idx_student_messages_thread ON public.student_messages(student_id, counsellor_id, created_at);
CREATE TRIGGER student_messages_updated_at BEFORE UPDATE ON public.student_messages
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3. Exam configuration per event
CREATE TABLE public.exam_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL UNIQUE REFERENCES public.events(id) ON DELETE CASCADE,
  duration_minutes INTEGER NOT NULL DEFAULT 90,
  instructions TEXT NOT NULL DEFAULT 'Carry your Aadhaar card for identity verification along with a printed copy of this hall ticket.',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.exam_configs TO authenticated;
GRANT ALL ON public.exam_configs TO service_role;
ALTER TABLE public.exam_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "exam_configs_read" ON public.exam_configs
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "exam_configs_admin_write" ON public.exam_configs
  FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER exam_configs_updated_at BEFORE UPDATE ON public.exam_configs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4. Hall tickets move onto the event/session/booking model
ALTER TABLE public.hall_tickets ALTER COLUMN exam_id DROP NOT NULL;
ALTER TABLE public.hall_tickets
  ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES public.event_sessions(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS booking_id UUID REFERENCES public.seminar_bookings(id) ON DELETE CASCADE;
CREATE UNIQUE INDEX IF NOT EXISTS idx_hall_tickets_booking ON public.hall_tickets(booking_id);
GRANT SELECT ON public.hall_tickets TO authenticated;
GRANT ALL ON public.hall_tickets TO service_role;
ALTER TABLE public.hall_tickets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "hall_tickets_self_read" ON public.hall_tickets;
CREATE POLICY "hall_tickets_self_read" ON public.hall_tickets
  FOR SELECT TO authenticated
  USING (student_id = public.current_student_id() OR public.is_admin(auth.uid()));

-- 5. Prevent double check-in per session
CREATE UNIQUE INDEX IF NOT EXISTS idx_attendance_session_student
  ON public.attendance(session_id, student_id) WHERE session_id IS NOT NULL;