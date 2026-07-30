-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('super_admin','admissions_admin','counsellor','ground_admin');
CREATE TYPE public.admission_stage AS ENUM (
  'NEW','ASSIGNED','CONTACTED','WOC_BOOKED','WOC_ATTENDED',
  'ACC_BOOKED','ACC_ATTENDED','EXAM_BOOKED','HALL_TICKET_GENERATED'
);
CREATE TYPE public.seminar_type AS ENUM ('WOC','ACC');
CREATE TYPE public.lead_source AS ENUM ('WEBSITE','REFERRAL','WALK_IN','SOCIAL_MEDIA','EDUCATION_FAIR','SCHOOL_VISIT','OTHER');
CREATE TYPE public.email_status AS ENUM ('QUEUED','SENT','FAILED','CANCELLED');
CREATE TYPE public.booking_status AS ENUM ('BOOKED','ATTENDED','CANCELLED','NO_SHOW');
CREATE TYPE public.call_outcome AS ENUM ('CONNECTED','NO_ANSWER','BUSY','WRONG_NUMBER','NOT_INTERESTED','CALLBACK_REQUESTED');

-- ============ SHARED ============
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============ ROLES ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('super_admin','admissions_admin')
  );
$$;

CREATE POLICY "profiles_self_or_admin_read" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "profiles_self_insert" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_self_update" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "user_roles_self_or_admin_read" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name',''), NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ COUNSELLORS ============
CREATE TABLE public.counsellors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  max_active_leads INTEGER NOT NULL DEFAULT 60,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.counsellors TO authenticated;
GRANT ALL ON public.counsellors TO service_role;
ALTER TABLE public.counsellors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "counsellors_read" ON public.counsellors FOR SELECT TO authenticated USING (true);
CREATE POLICY "counsellors_admin_write" ON public.counsellors FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER counsellors_updated_at BEFORE UPDATE ON public.counsellors
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.current_counsellor_id()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM public.counsellors WHERE user_id = auth.uid() LIMIT 1;
$$;

-- ============ STUDENTS ============
CREATE SEQUENCE public.student_id_seq START 1;

CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_code TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  date_of_birth DATE,
  school TEXT,
  course TEXT,
  parent_name TEXT,
  parent_phone TEXT,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  lead_source public.lead_source NOT NULL DEFAULT 'WEBSITE',
  stage public.admission_stage NOT NULL DEFAULT 'NEW',
  counsellor_id UUID REFERENCES public.counsellors(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_students_stage ON public.students(stage);
CREATE INDEX idx_students_counsellor ON public.students(counsellor_id);
CREATE INDEX idx_students_created_at ON public.students(created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.students TO authenticated;
GRANT ALL ON public.students TO service_role;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
CREATE POLICY "students_admin_all" ON public.students FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "students_counsellor_read" ON public.students FOR SELECT TO authenticated
  USING (counsellor_id = public.current_counsellor_id());
CREATE POLICY "students_counsellor_update" ON public.students FOR UPDATE TO authenticated
  USING (counsellor_id = public.current_counsellor_id())
  WITH CHECK (counsellor_id = public.current_counsellor_id());
CREATE POLICY "students_ground_admin_read" ON public.students FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'ground_admin'));
CREATE TRIGGER students_updated_at BEFORE UPDATE ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.assign_student_code()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.student_code IS NULL OR NEW.student_code = '' THEN
    NEW.student_code := 'STU-' || to_char(now(), 'YYYY') || '-' ||
      lpad(nextval('public.student_id_seq')::text, 4, '0');
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER students_student_code BEFORE INSERT ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.assign_student_code();

-- ============ STUDENT EVENTS ============
CREATE TABLE public.student_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  from_stage public.admission_stage,
  to_stage public.admission_stage NOT NULL,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_label TEXT,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_student_events_student ON public.student_events(student_id, created_at DESC);
GRANT SELECT, INSERT ON public.student_events TO authenticated;
GRANT ALL ON public.student_events TO service_role;
ALTER TABLE public.student_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "student_events_admin_read" ON public.student_events FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));
CREATE POLICY "student_events_counsellor_read" ON public.student_events FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.students s WHERE s.id = student_id AND s.counsellor_id = public.current_counsellor_id()));

-- ============ CALL LOGS ============
CREATE TABLE public.call_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  counsellor_id UUID REFERENCES public.counsellors(id) ON DELETE SET NULL,
  outcome public.call_outcome NOT NULL,
  notes TEXT,
  next_action_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_call_logs_student ON public.call_logs(student_id, created_at DESC);
CREATE INDEX idx_call_logs_next_action ON public.call_logs(next_action_at);
GRANT SELECT, INSERT, UPDATE ON public.call_logs TO authenticated;
GRANT ALL ON public.call_logs TO service_role;
ALTER TABLE public.call_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "call_logs_admin_all" ON public.call_logs FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "call_logs_counsellor_read" ON public.call_logs FOR SELECT TO authenticated
  USING (counsellor_id = public.current_counsellor_id());
CREATE POLICY "call_logs_counsellor_insert" ON public.call_logs FOR INSERT TO authenticated
  WITH CHECK (counsellor_id = public.current_counsellor_id());

-- ============ SEMINARS ============
CREATE TABLE public.seminars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seminar_type public.seminar_type NOT NULL,
  title TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  venue TEXT NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 100,
  is_open BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.seminars TO authenticated;
GRANT ALL ON public.seminars TO service_role;
ALTER TABLE public.seminars ENABLE ROW LEVEL SECURITY;
CREATE POLICY "seminars_read" ON public.seminars FOR SELECT TO authenticated USING (true);
CREATE POLICY "seminars_admin_write" ON public.seminars FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER seminars_updated_at BEFORE UPDATE ON public.seminars
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.seminar_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seminar_id UUID NOT NULL REFERENCES public.seminars(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  booking_ref TEXT NOT NULL UNIQUE,
  qr_payload TEXT NOT NULL,
  status public.booking_status NOT NULL DEFAULT 'BOOKED',
  booked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (seminar_id, student_id)
);
CREATE INDEX idx_bookings_seminar ON public.seminar_bookings(seminar_id);
GRANT SELECT, INSERT, UPDATE ON public.seminar_bookings TO authenticated;
GRANT ALL ON public.seminar_bookings TO service_role;
ALTER TABLE public.seminar_bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bookings_admin_all" ON public.seminar_bookings FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "bookings_ground_read" ON public.seminar_bookings FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'ground_admin'));
CREATE POLICY "bookings_ground_update" ON public.seminar_bookings FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'ground_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'ground_admin'));

-- ============ ATTENDANCE ============
CREATE TABLE public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.seminar_bookings(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  seminar_id UUID NOT NULL REFERENCES public.seminars(id) ON DELETE CASCADE,
  scanned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  scanned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (booking_id)
);
GRANT SELECT, INSERT ON public.attendance TO authenticated;
GRANT ALL ON public.attendance TO service_role;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "attendance_admin_all" ON public.attendance FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "attendance_ground_read" ON public.attendance FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'ground_admin'));
CREATE POLICY "attendance_ground_insert" ON public.attendance FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'ground_admin'));

-- ============ EXAMS ============
CREATE TABLE public.exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  centre TEXT NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 200,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exams TO authenticated;
GRANT ALL ON public.exams TO service_role;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "exams_read" ON public.exams FOR SELECT TO authenticated USING (true);
CREATE POLICY "exams_admin_write" ON public.exams FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER exams_updated_at BEFORE UPDATE ON public.exams
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.exam_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 40,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exam_rooms TO authenticated;
GRANT ALL ON public.exam_rooms TO service_role;
ALTER TABLE public.exam_rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "exam_rooms_read" ON public.exam_rooms FOR SELECT TO authenticated USING (true);
CREATE POLICY "exam_rooms_admin_write" ON public.exam_rooms FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE TABLE public.exam_seats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  room_id UUID REFERENCES public.exam_rooms(id) ON DELETE SET NULL,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  seat_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (exam_id, student_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exam_seats TO authenticated;
GRANT ALL ON public.exam_seats TO service_role;
ALTER TABLE public.exam_seats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "exam_seats_admin_all" ON public.exam_seats FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- ============ HALL TICKETS ============
CREATE TABLE public.hall_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  ticket_number TEXT NOT NULL UNIQUE,
  qr_payload TEXT NOT NULL,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, exam_id)
);
GRANT SELECT, INSERT ON public.hall_tickets TO authenticated;
GRANT ALL ON public.hall_tickets TO service_role;
ALTER TABLE public.hall_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hall_tickets_admin_all" ON public.hall_tickets FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- ============ EMAIL QUEUE ============
CREATE TABLE public.email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
  to_email TEXT NOT NULL,
  template_key TEXT NOT NULL,
  subject TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status public.email_status NOT NULL DEFAULT 'QUEUED',
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at TIMESTAMPTZ
);
CREATE INDEX idx_email_queue_status ON public.email_queue(status, created_at DESC);
GRANT SELECT, INSERT, UPDATE ON public.email_queue TO authenticated;
GRANT ALL ON public.email_queue TO service_role;
ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "email_queue_admin_all" ON public.email_queue FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- ============ SEED ============
INSERT INTO public.counsellors (id, full_name, email, phone, is_active, max_active_leads) VALUES
  ('11111111-1111-4111-8111-000000000001','Jane Smith','jane.smith@admissions.edu','+91 98100 10001', true, 60),
  ('11111111-1111-4111-8111-000000000002','John Doe','john.doe@admissions.edu','+91 98100 10002', true, 60),
  ('11111111-1111-4111-8111-000000000003','Mike Brown','mike.brown@admissions.edu','+91 98100 10003', true, 45),
  ('11111111-1111-4111-8111-000000000004','Priya Nair','priya.nair@admissions.edu','+91 98100 10004', false, 40);

INSERT INTO public.seminars (id, seminar_type, title, scheduled_at, venue, capacity) VALUES
  ('22222222-2222-4222-8222-000000000001','WOC','WOC — Workshop on Careers', now() + interval '9 days', 'Main Auditorium, Block A', 100),
  ('22222222-2222-4222-8222-000000000002','ACC','ACC — Academic Counselling Camp', now() + interval '24 days', 'Seminar Hall 2, Block C', 80);

INSERT INTO public.exams (id, title, scheduled_at, centre, capacity) VALUES
  ('33333333-3333-4333-8333-000000000001','Entrance Examination 2026 — Cycle 1', now() + interval '45 days', 'Central Examination Centre', 200);

INSERT INTO public.exam_rooms (exam_id, name, capacity) VALUES
  ('33333333-3333-4333-8333-000000000001','Room 101', 40),
  ('33333333-3333-4333-8333-000000000001','Room 102', 40),
  ('33333333-3333-4333-8333-000000000001','Room 103', 40);

INSERT INTO public.students
  (full_name, date_of_birth, school, course, parent_name, parent_phone, email, phone, lead_source, stage, counsellor_id, created_at)
VALUES
  ('Riya Sharma','2008-03-14','Delhi Public School','B.Tech CSE','Amit Sharma','+91 98765 43210','riya.s@email.com','+91 98765 43210','WEBSITE','WOC_BOOKED','11111111-1111-4111-8111-000000000001', now() - interval '20 days'),
  ('Arjun Mehta','2007-11-02','St. Xaviers','MBA Finance','Mehta Senior','+91 98765 43211','arjun@email.com','+91 98765 43211','REFERRAL','CONTACTED','11111111-1111-4111-8111-000000000002', now() - interval '19 days'),
  ('Ishaan Verma','2008-06-21','Ryan International','B.Tech IT','Rohit Verma','+91 98765 43212','ishaan@email.com','+91 98765 43212','WALK_IN','ACC_BOOKED','11111111-1111-4111-8111-000000000002', now() - interval '18 days'),
  ('Ananya Gupta','2008-01-09','Modern School','BCA','Sanjay Gupta','+91 98765 43213','ananya@email.com','+91 98765 43213','SOCIAL_MEDIA','EXAM_BOOKED','11111111-1111-4111-8111-000000000003', now() - interval '17 days'),
  ('Kabir Malhotra','2007-09-30','Springdales','B.Tech ECE','Vikas Malhotra','+91 98765 43214','kabir@email.com','+91 98765 43214','EDUCATION_FAIR','NEW',NULL, now() - interval '1 day'),
  ('Sara Khan','2008-04-18','Amity International','B.Sc Physics','Imran Khan','+91 98765 43215','sara.k@email.com','+91 98765 43215','WEBSITE','NEW',NULL, now() - interval '1 day'),
  ('Dhruv Patel','2007-12-25','DAV Public School','B.Com Hons','Nilesh Patel','+91 98765 43216','dhruv@email.com','+91 98765 43216','SCHOOL_VISIT','NEW',NULL, now() - interval '2 days'),
  ('Meera Iyer','2008-08-08','Bhavans Vidya Mandir','B.Tech CSE','Suresh Iyer','+91 98765 43217','meera@email.com','+91 98765 43217','WEBSITE','ASSIGNED','11111111-1111-4111-8111-000000000001', now() - interval '3 days'),
  ('Rohan Desai','2007-05-11','Cathedral School','BBA','Anil Desai','+91 98765 43218','rohan.d@email.com','+91 98765 43218','REFERRAL','ASSIGNED','11111111-1111-4111-8111-000000000002', now() - interval '3 days'),
  ('Aisha Siddiqui','2008-02-27','Loreto Convent','B.Des','Faisal Siddiqui','+91 98765 43219','aisha@email.com','+91 98765 43219','SOCIAL_MEDIA','ASSIGNED','11111111-1111-4111-8111-000000000003', now() - interval '4 days'),
  ('Vivaan Joshi','2007-10-16','Sanskriti School','B.Tech Mech','Manoj Joshi','+91 98765 43220','vivaan@email.com','+91 98765 43220','WEBSITE','CONTACTED','11111111-1111-4111-8111-000000000001', now() - interval '5 days'),
  ('Nisha Reddy','2008-07-04','Oakridge International','B.Sc Maths','Ravi Reddy','+91 98765 43221','nisha@email.com','+91 98765 43221','WALK_IN','CONTACTED','11111111-1111-4111-8111-000000000003', now() - interval '5 days'),
  ('Aryan Kapoor','2007-08-19','The Doon School','B.Tech CSE','Rajeev Kapoor','+91 98765 43222','aryan.k@email.com','+91 98765 43222','EDUCATION_FAIR','CONTACTED','11111111-1111-4111-8111-000000000002', now() - interval '6 days'),
  ('Tanvi Bhatt','2008-05-23','Jamnabai Narsee','BA Economics','Kiran Bhatt','+91 98765 43223','tanvi@email.com','+91 98765 43223','WEBSITE','WOC_BOOKED','11111111-1111-4111-8111-000000000001', now() - interval '7 days'),
  ('Karan Singh','2007-03-03','Army Public School','B.Tech Civil','Jaspreet Singh','+91 98765 43224','karan.s@email.com','+91 98765 43224','REFERRAL','WOC_BOOKED','11111111-1111-4111-8111-000000000002', now() - interval '7 days'),
  ('Diya Chaudhary','2008-09-12','Vasant Valley','B.Sc Chemistry','Naresh Chaudhary','+91 98765 43225','diya@email.com','+91 98765 43225','SOCIAL_MEDIA','WOC_BOOKED','11111111-1111-4111-8111-000000000003', now() - interval '8 days'),
  ('Advait Rao','2007-06-07','National Public School','BCA','Girish Rao','+91 98765 43226','advait@email.com','+91 98765 43226','WEBSITE','WOC_ATTENDED','11111111-1111-4111-8111-000000000001', now() - interval '9 days'),
  ('Kavya Menon','2008-12-01','Chinmaya Vidyalaya','B.Tech IT','Hari Menon','+91 98765 43227','kavya@email.com','+91 98765 43227','WALK_IN','WOC_ATTENDED','11111111-1111-4111-8111-000000000002', now() - interval '9 days'),
  ('Yash Agarwal','2007-04-29','Birla Vidya Niketan','B.Com Hons','Sunil Agarwal','+91 98765 43228','yash@email.com','+91 98765 43228','SCHOOL_VISIT','WOC_ATTENDED','11111111-1111-4111-8111-000000000003', now() - interval '10 days'),
  ('Ira Saxena','2008-10-20','Step by Step School','B.Des','Alok Saxena','+91 98765 43229','ira@email.com','+91 98765 43229','WEBSITE','ACC_BOOKED','11111111-1111-4111-8111-000000000001', now() - interval '11 days'),
  ('Neel Bose','2007-07-15','South Point High','B.Tech ECE','Sourav Bose','+91 98765 43230','neel@email.com','+91 98765 43230','REFERRAL','ACC_BOOKED','11111111-1111-4111-8111-000000000002', now() - interval '11 days'),
  ('Saanvi Pillai','2008-11-05','Kendriya Vidyalaya','B.Sc Biology','Ramesh Pillai','+91 98765 43231','saanvi@email.com','+91 98765 43231','SOCIAL_MEDIA','ACC_ATTENDED','11111111-1111-4111-8111-000000000003', now() - interval '12 days'),
  ('Reyansh Jain','2007-02-14','Bal Bharati','B.Tech CSE','Mukesh Jain','+91 98765 43232','reyansh@email.com','+91 98765 43232','WEBSITE','ACC_ATTENDED','11111111-1111-4111-8111-000000000001', now() - interval '12 days'),
  ('Anika Shetty','2008-03-08','Podar International','BBA','Deepak Shetty','+91 98765 43233','anika@email.com','+91 98765 43233','WALK_IN','ACC_ATTENDED','11111111-1111-4111-8111-000000000002', now() - interval '13 days'),
  ('Veer Chopra','2007-01-22','Heritage School','B.Tech Mech','Sameer Chopra','+91 98765 43234','veer@email.com','+91 98765 43234','EDUCATION_FAIR','EXAM_BOOKED','11111111-1111-4111-8111-000000000003', now() - interval '14 days'),
  ('Myra Dutta','2008-06-30','La Martiniere','BA Psychology','Abhijit Dutta','+91 98765 43235','myra@email.com','+91 98765 43235','WEBSITE','EXAM_BOOKED','11111111-1111-4111-8111-000000000001', now() - interval '14 days'),
  ('Aarav Nanda','2007-09-09','Shri Ram School','B.Tech CSE','Vikram Nanda','+91 98765 43236','aarav@email.com','+91 98765 43236','REFERRAL','HALL_TICKET_GENERATED','11111111-1111-4111-8111-000000000002', now() - interval '15 days'),
  ('Zara Fernandes','2008-08-26','Don Bosco','B.Sc Statistics','Peter Fernandes','+91 98765 43237','zara@email.com','+91 98765 43237','SOCIAL_MEDIA','HALL_TICKET_GENERATED','11111111-1111-4111-8111-000000000003', now() - interval '15 days'),
  ('Kian Ahuja','2007-11-17','Genesis Global','B.Com Hons','Rohit Ahuja','+91 98765 43238','kian@email.com','+91 98765 43238','WEBSITE','NEW',NULL, now() - interval '6 hours'),
  ('Prisha Kulkarni','2008-05-06','Vibgyor High','B.Tech IT','Ashish Kulkarni','+91 98765 43239','prisha@email.com','+91 98765 43239','WALK_IN','NEW',NULL, now() - interval '4 hours'),
  ('Rudra Thakur','2007-12-11','Delhi Public School','B.Tech Civil','Om Thakur','+91 98765 43240','rudra@email.com','+91 98765 43240','SCHOOL_VISIT','ASSIGNED','11111111-1111-4111-8111-000000000001', now() - interval '2 days'),
  ('Navya Rathi','2008-04-02','Mount Carmel','B.Des','Pankaj Rathi','+91 98765 43241','navya@email.com','+91 98765 43241','WEBSITE','CONTACTED','11111111-1111-4111-8111-000000000002', now() - interval '8 days'),
  ('Shaurya Bansal','2007-10-28','Lotus Valley','B.Tech ECE','Gaurav Bansal','+91 98765 43242','shaurya@email.com','+91 98765 43242','REFERRAL','WOC_BOOKED','11111111-1111-4111-8111-000000000003', now() - interval '10 days'),
  ('Aadhya Ghosh','2008-02-19','Modern High','B.Sc Physics','Tapan Ghosh','+91 98765 43243','aadhya@email.com','+91 98765 43243','SOCIAL_MEDIA','WOC_ATTENDED','11111111-1111-4111-8111-000000000001', now() - interval '11 days'),
  ('Atharv Mishra','2007-07-24','City Montessori','BCA','Deepak Mishra','+91 98765 43244','atharv@email.com','+91 98765 43244','WEBSITE','ACC_BOOKED','11111111-1111-4111-8111-000000000002', now() - interval '13 days'),
  ('Ridhi Kaur','2008-09-15','Guru Harkrishan','BBA','Manpreet Kaur','+91 98765 43245','ridhi@email.com','+91 98765 43245','WALK_IN','ACC_ATTENDED','11111111-1111-4111-8111-000000000003', now() - interval '14 days'),
  ('Om Prakash','2007-05-31','Sarvodaya Vidyalaya','B.Com Hons','Ram Prakash','+91 98765 43246','om.p@email.com','+91 98765 43246','EDUCATION_FAIR','EXAM_BOOKED','11111111-1111-4111-8111-000000000001', now() - interval '16 days'),
  ('Larisa Dsouza','2008-01-13','St. Marys','BA English','Joseph Dsouza','+91 98765 43247','larisa@email.com','+91 98765 43247','WEBSITE','HALL_TICKET_GENERATED','11111111-1111-4111-8111-000000000002', now() - interval '16 days'),
  ('Hriday Sinha','2007-08-05','Delhi Public School','B.Tech Mech','Alok Sinha','+91 98765 43248','hriday@email.com','+91 98765 43248','REFERRAL','CONTACTED','11111111-1111-4111-8111-000000000003', now() - interval '7 days'),
  ('Ela Wadhwa','2008-11-23','Pathways World','B.Sc Economics','Naveen Wadhwa','+91 98765 43249','ela@email.com','+91 98765 43249','SOCIAL_MEDIA','NEW',NULL, now() - interval '3 hours');

INSERT INTO public.email_queue (student_id, to_email, template_key, subject, payload, status, created_at, sent_at)
SELECT s.id, s.email, 'welcome_enquiry',
       'We received your enquiry, ' || split_part(s.full_name,' ',1),
       jsonb_build_object('student_code', s.student_code, 'full_name', s.full_name),
       'SENT', s.created_at, s.created_at + interval '2 minutes'
FROM public.students s;