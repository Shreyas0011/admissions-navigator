ALTER TABLE public.counsellors ADD COLUMN IF NOT EXISTS must_reset_password boolean NOT NULL DEFAULT false;

ALTER TABLE public.assignment_policies ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT false;
UPDATE public.assignment_policies SET is_published = true WHERE enabled = true AND id = (SELECT id FROM public.assignment_policies WHERE enabled = true ORDER BY priority DESC, created_at LIMIT 1);
CREATE UNIQUE INDEX IF NOT EXISTS assignment_policies_single_published ON public.assignment_policies ((is_published)) WHERE is_published;

ALTER TABLE public.event_sessions ADD COLUMN IF NOT EXISTS ground_password text;

ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS is_walk_in boolean NOT NULL DEFAULT false;
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS staff_name text;
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS session_id uuid REFERENCES public.event_sessions(id) ON DELETE CASCADE;
ALTER TABLE public.attendance ALTER COLUMN booking_id DROP NOT NULL;
ALTER TABLE public.attendance ALTER COLUMN seminar_id DROP NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS attendance_unique_session_student ON public.attendance (session_id, student_id) WHERE session_id IS NOT NULL;

ALTER TABLE public.call_logs ADD COLUMN IF NOT EXISTS called_at timestamptz NOT NULL DEFAULT now();

DROP POLICY IF EXISTS call_logs_admin_all ON public.call_logs;
CREATE POLICY call_logs_admin_read ON public.call_logs FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY call_logs_admin_insert ON public.call_logs FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));
REVOKE UPDATE, DELETE ON public.call_logs FROM authenticated;