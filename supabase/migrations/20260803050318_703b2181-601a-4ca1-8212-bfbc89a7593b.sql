-- =========================================================
-- Programme-centric refactor + Assignment / Event engines
-- =========================================================

CREATE TYPE public.programme_status AS ENUM ('DRAFT','OPEN','CLOSED');
CREATE TYPE public.assignment_algorithm AS ENUM ('ROUND_ROBIN','LEAST_WORKLOAD','LEAST_ACTIVE','MANUAL');
CREATE TYPE public.assignment_policy_type AS ENUM ('MANUAL','ROUND_ROBIN','LEAST_WORKLOAD','LEAST_ACTIVE','PROGRAMME_BASED','HYBRID');
CREATE TYPE public.assignment_source AS ENUM ('AUTO','MANUAL');
CREATE TYPE public.allocation_strategy AS ENUM ('FIRST_AVAILABLE','LEAST_FILLED','ROUND_ROBIN','MANUAL');
CREATE TYPE public.event_type AS ENUM ('WOC','ACC','EXAM','OTHER');

-- ---------------------------------------------------------
-- Academic years
-- ---------------------------------------------------------
CREATE TABLE public.academic_years (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL UNIQUE,
  starts_on date NOT NULL,
  ends_on date NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.academic_years TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.academic_years TO authenticated;
GRANT ALL ON public.academic_years TO service_role;
ALTER TABLE public.academic_years ENABLE ROW LEVEL SECURITY;
CREATE POLICY academic_years_read ON public.academic_years FOR SELECT TO authenticated USING (true);
CREATE POLICY academic_years_admin_write ON public.academic_years FOR ALL TO authenticated
  USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));
CREATE TRIGGER academic_years_updated_at BEFORE UPDATE ON public.academic_years
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------
-- Programmes  (the aggregate root)
-- ---------------------------------------------------------
CREATE TABLE public.programmes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  department text NOT NULL DEFAULT 'General',
  academic_year_id uuid REFERENCES public.academic_years(id) ON DELETE SET NULL,
  intake integer NOT NULL DEFAULT 60,
  duration text,
  description text,
  status programme_status NOT NULL DEFAULT 'DRAFT',
  applications_open_at timestamptz,
  applications_close_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.programmes TO authenticated;
GRANT SELECT ON public.programmes TO anon;
GRANT ALL ON public.programmes TO service_role;
ALTER TABLE public.programmes ENABLE ROW LEVEL SECURITY;
CREATE POLICY programmes_read ON public.programmes FOR SELECT TO authenticated USING (true);
CREATE POLICY programmes_public_read ON public.programmes FOR SELECT TO anon USING (status = 'OPEN');
CREATE POLICY programmes_admin_write ON public.programmes FOR ALL TO authenticated
  USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));
CREATE TRIGGER programmes_updated_at BEFORE UPDATE ON public.programmes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------
-- Venues
-- ---------------------------------------------------------
CREATE TABLE public.venues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  campus text NOT NULL DEFAULT 'Main Campus',
  building text,
  floor text,
  capacity integer NOT NULL DEFAULT 100,
  facilities text[] NOT NULL DEFAULT '{}',
  priority integer NOT NULL DEFAULT 100,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.venues TO authenticated;
GRANT ALL ON public.venues TO service_role;
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;
CREATE POLICY venues_read ON public.venues FOR SELECT TO authenticated USING (true);
CREATE POLICY venues_admin_write ON public.venues FOR ALL TO authenticated
  USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));
CREATE TRIGGER venues_updated_at BEFORE UPDATE ON public.venues
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------
-- Counsellor pools
-- ---------------------------------------------------------
CREATE TABLE public.counsellor_pools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  default_algorithm assignment_algorithm NOT NULL DEFAULT 'LEAST_WORKLOAD',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.counsellor_pools TO authenticated;
GRANT ALL ON public.counsellor_pools TO service_role;
ALTER TABLE public.counsellor_pools ENABLE ROW LEVEL SECURITY;
CREATE POLICY pools_read ON public.counsellor_pools FOR SELECT TO authenticated USING (true);
CREATE POLICY pools_admin_write ON public.counsellor_pools FOR ALL TO authenticated
  USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));
CREATE TRIGGER pools_updated_at BEFORE UPDATE ON public.counsellor_pools
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.counsellor_pool_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_id uuid NOT NULL REFERENCES public.counsellor_pools(id) ON DELETE CASCADE,
  counsellor_id uuid NOT NULL REFERENCES public.counsellors(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (pool_id, counsellor_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.counsellor_pool_members TO authenticated;
GRANT ALL ON public.counsellor_pool_members TO service_role;
ALTER TABLE public.counsellor_pool_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY pool_members_read ON public.counsellor_pool_members FOR SELECT TO authenticated USING (true);
CREATE POLICY pool_members_admin_write ON public.counsellor_pool_members FOR ALL TO authenticated
  USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

-- ---------------------------------------------------------
-- Assignment engine configuration
-- ---------------------------------------------------------
CREATE TABLE public.assignment_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  policy_type assignment_policy_type NOT NULL DEFAULT 'MANUAL',
  enabled boolean NOT NULL DEFAULT false,
  auto_assign boolean NOT NULL DEFAULT false,
  fallback_algorithm assignment_algorithm NOT NULL DEFAULT 'LEAST_WORKLOAD',
  default_pool_id uuid REFERENCES public.counsellor_pools(id) ON DELETE SET NULL,
  priority integer NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assignment_policies TO authenticated;
GRANT ALL ON public.assignment_policies TO service_role;
ALTER TABLE public.assignment_policies ENABLE ROW LEVEL SECURITY;
CREATE POLICY policies_read ON public.assignment_policies FOR SELECT TO authenticated USING (true);
CREATE POLICY policies_admin_write ON public.assignment_policies FOR ALL TO authenticated
  USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));
CREATE TRIGGER policies_updated_at BEFORE UPDATE ON public.assignment_policies
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.assignment_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id uuid NOT NULL REFERENCES public.assignment_policies(id) ON DELETE CASCADE,
  programme_id uuid REFERENCES public.programmes(id) ON DELETE CASCADE,
  pool_id uuid NOT NULL REFERENCES public.counsellor_pools(id) ON DELETE CASCADE,
  algorithm assignment_algorithm NOT NULL DEFAULT 'LEAST_WORKLOAD',
  priority integer NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assignment_rules TO authenticated;
GRANT ALL ON public.assignment_rules TO service_role;
ALTER TABLE public.assignment_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY rules_read ON public.assignment_rules FOR SELECT TO authenticated USING (true);
CREATE POLICY rules_admin_write ON public.assignment_rules FOR ALL TO authenticated
  USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));
CREATE TRIGGER rules_updated_at BEFORE UPDATE ON public.assignment_rules
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  counsellor_id uuid REFERENCES public.counsellors(id) ON DELETE SET NULL,
  programme_id uuid REFERENCES public.programmes(id) ON DELETE SET NULL,
  policy_id uuid REFERENCES public.assignment_policies(id) ON DELETE SET NULL,
  rule_id uuid REFERENCES public.assignment_rules(id) ON DELETE SET NULL,
  pool_id uuid REFERENCES public.counsellor_pools(id) ON DELETE SET NULL,
  algorithm assignment_algorithm,
  source assignment_source NOT NULL DEFAULT 'AUTO',
  candidates jsonb NOT NULL DEFAULT '[]',
  rule_label text,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_label text NOT NULL DEFAULT 'System',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.assignments TO authenticated;
GRANT ALL ON public.assignments TO service_role;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY assignments_admin_read ON public.assignments FOR SELECT TO authenticated
  USING (is_admin(auth.uid()));
CREATE POLICY assignments_admin_insert ON public.assignments FOR INSERT TO authenticated
  WITH CHECK (is_admin(auth.uid()));

-- ---------------------------------------------------------
-- Events + sessions (scheduling engine)
-- ---------------------------------------------------------
CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  programme_id uuid REFERENCES public.programmes(id) ON DELETE CASCADE,
  title text NOT NULL,
  event_type event_type NOT NULL DEFAULT 'WOC',
  subject text,
  description text,
  allocation_strategy allocation_strategy NOT NULL DEFAULT 'LEAST_FILLED',
  registration_opens_at timestamptz,
  registration_closes_at timestamptz,
  auto_approve boolean NOT NULL DEFAULT true,
  allow_cancellation boolean NOT NULL DEFAULT true,
  cancellation_cutoff_hours integer NOT NULL DEFAULT 24,
  target_stage admission_stage,
  is_open boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.events TO authenticated;
GRANT ALL ON public.events TO service_role;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY events_read ON public.events FOR SELECT TO authenticated USING (true);
CREATE POLICY events_admin_write ON public.events FOR ALL TO authenticated
  USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));
CREATE TRIGGER events_updated_at BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.event_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  venue_id uuid REFERENCES public.venues(id) ON DELETE SET NULL,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  capacity integer NOT NULL DEFAULT 100,
  reserved_seats integer NOT NULL DEFAULT 0,
  waitlist_enabled boolean NOT NULL DEFAULT false,
  waitlist_size integer NOT NULL DEFAULT 0,
  is_open boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_sessions TO authenticated;
GRANT ALL ON public.event_sessions TO service_role;
ALTER TABLE public.event_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY sessions_read ON public.event_sessions FOR SELECT TO authenticated USING (true);
CREATE POLICY sessions_admin_write ON public.event_sessions FOR ALL TO authenticated
  USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));
CREATE TRIGGER event_sessions_updated_at BEFORE UPDATE ON public.event_sessions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------
-- Attach existing tables to programmes / sessions
-- ---------------------------------------------------------
ALTER TABLE public.students ADD COLUMN programme_id uuid REFERENCES public.programmes(id) ON DELETE SET NULL;
ALTER TABLE public.seminars ADD COLUMN programme_id uuid REFERENCES public.programmes(id) ON DELETE SET NULL;
ALTER TABLE public.exams ADD COLUMN programme_id uuid REFERENCES public.programmes(id) ON DELETE SET NULL;
ALTER TABLE public.attendance ADD COLUMN programme_id uuid REFERENCES public.programmes(id) ON DELETE SET NULL;
ALTER TABLE public.seminar_bookings ADD COLUMN session_id uuid REFERENCES public.event_sessions(id) ON DELETE SET NULL;

CREATE INDEX idx_students_programme ON public.students(programme_id);
CREATE INDEX idx_events_programme ON public.events(programme_id);
CREATE INDEX idx_sessions_event ON public.event_sessions(event_id);
CREATE INDEX idx_assignments_student ON public.assignments(student_id);

-- ---------------------------------------------------------
-- Backfill: academic year, programmes from existing courses
-- ---------------------------------------------------------
INSERT INTO public.academic_years (label, starts_on, ends_on, is_active)
VALUES ('2027-2028', '2027-06-01', '2028-05-31', true);

INSERT INTO public.programmes (code, name, department, academic_year_id, intake, duration, status, applications_open_at, applications_close_at, description)
SELECT
  'PRG-' || upper(regexp_replace(c.course, '[^a-zA-Z0-9]', '', 'g')),
  c.course,
  CASE
    WHEN c.course ILIKE 'B.Tech%' THEN 'Engineering'
    WHEN c.course ILIKE 'MBA%' OR c.course ILIKE 'BBA%' OR c.course ILIKE 'B.Com%' THEN 'Management'
    WHEN c.course ILIKE 'B.Sc%' THEN 'Sciences'
    ELSE 'General'
  END,
  (SELECT id FROM public.academic_years WHERE label = '2027-2028'),
  120,
  CASE WHEN c.course ILIKE 'B.Tech%' THEN '4 years' WHEN c.course ILIKE 'M%' THEN '2 years' ELSE '3 years' END,
  'OPEN',
  now() - interval '30 days',
  now() + interval '120 days',
  c.course || ' admissions for the 2027-2028 academic year.'
FROM (SELECT DISTINCT course FROM public.students WHERE course IS NOT NULL AND course <> '') c;

UPDATE public.students s
SET programme_id = p.id
FROM public.programmes p
WHERE p.name = s.course AND s.programme_id IS NULL;

-- ---------------------------------------------------------
-- Backfill: venues from seminar/exam text, seminars -> events + sessions
-- ---------------------------------------------------------
INSERT INTO public.venues (name, campus, capacity, priority)
SELECT DISTINCT s.venue, 'Main Campus', 200, 100
FROM public.seminars s
WHERE s.venue IS NOT NULL AND s.venue <> ''
ON CONFLICT DO NOTHING;

INSERT INTO public.events (id, programme_id, title, event_type, subject, description, allocation_strategy, is_open, registration_opens_at, registration_closes_at)
SELECT s.id, NULL, s.title,
  (s.seminar_type::text)::event_type,
  s.title, 'Migrated from the legacy seminar schedule.',
  'LEAST_FILLED', s.is_open, s.created_at, s.scheduled_at
FROM public.seminars s;

INSERT INTO public.event_sessions (event_id, venue_id, starts_at, ends_at, capacity, is_open)
SELECT s.id, v.id, s.scheduled_at, s.scheduled_at + interval '2 hours', s.capacity, s.is_open
FROM public.seminars s
LEFT JOIN public.venues v ON v.name = s.venue;

UPDATE public.seminar_bookings b
SET session_id = es.id
FROM public.event_sessions es
WHERE es.event_id = b.seminar_id AND b.session_id IS NULL;

-- ---------------------------------------------------------
-- Seed pools + the default assignment policy
-- ---------------------------------------------------------
INSERT INTO public.counsellor_pools (name, description, default_algorithm)
VALUES
  ('General Admissions', 'Fallback pool containing every active counsellor.', 'LEAST_WORKLOAD'),
  ('Engineering Pool', 'Counsellors handling B.Tech programmes.', 'LEAST_WORKLOAD'),
  ('Management Pool', 'Counsellors handling MBA, BBA and B.Com programmes.', 'ROUND_ROBIN');

INSERT INTO public.counsellor_pool_members (pool_id, counsellor_id)
SELECT (SELECT id FROM public.counsellor_pools WHERE name = 'General Admissions'), c.id
FROM public.counsellors c WHERE c.is_active;

INSERT INTO public.assignment_policies (name, policy_type, enabled, auto_assign, fallback_algorithm, default_pool_id, priority)
VALUES (
  'Default Policy', 'PROGRAMME_BASED', true, true, 'LEAST_WORKLOAD',
  (SELECT id FROM public.counsellor_pools WHERE name = 'General Admissions'), 1
);