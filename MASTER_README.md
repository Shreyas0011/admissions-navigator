# Admissions OS — Master Technical Specification

> **Purpose of this document.** This is the complete, portable technical record of the Admissions OS
> application: schema, RLS, RBAC, every server function (API), every route, every component, every
> button and its action, and every persona flow. It is written so that another team can clone this
> repository and integrate/port the entire system into a different portal **without changing any
> behaviour**. Nothing described here is aspirational — every item below exists in the code.

---

## Table of contents

1. [System overview](#1-system-overview)
2. [Tech stack, tooling & environment](#2-tech-stack-tooling--environment)
3. [Architecture & folder layout](#3-architecture--folder-layout)
4. [Database: enums, tables, indexes](#4-database-enums-tables-indexes)
5. [Database: functions & triggers](#5-database-functions--triggers)
6. [Security: GRANTs, RLS policies, RBAC](#6-security-grants-rls-policies-rbac)
7. [Authentication & session model](#7-authentication--session-model)
8. [API surface: every server function](#8-api-surface-every-server-function)
9. [Domain services: business rules & error strings](#9-domain-services-business-rules--error-strings)
10. [Routes: URLs, guards, metadata](#10-routes-urls-guards-metadata)
11. [Components: props, controls, actions](#11-components-props-controls-actions)
12. [Shared libraries & helpers](#12-shared-libraries--helpers)
13. [Persona flows end to end](#13-persona-flows-end-to-end)
14. [Inter-persona CRUD matrix](#14-inter-persona-crud-matrix)
15. [Invariants that must not be broken when porting](#15-invariants-that-must-not-be-broken-when-porting)
16. [Porting guide](#16-porting-guide)
17. [Known gaps & open items](#17-known-gaps--open-items)

---

## 1. System overview

Admissions OS is an enterprise admissions lifecycle system. The **Programme** is the central business
entity; students are admitted *into programmes*. The system covers the lifecycle from anonymous
enquiry to hall-ticket-carrying exam candidate.

### The five Phase-1 capabilities

| Capability | Implementation |
| --- | --- |
| Lead management | Public enquiry/application capture, configurable Assignment Engine, immutable call logs |
| Student registry | `students` table as source of truth + `student_events` immutable audit trail |
| Seminar/Exam builder | Event (what) → Session (when/where/capacity) scheduling engine, shared by seminars and exams |
| Attendance | Static student QR + ground-staff token console with camera scan (`html5-qrcode`) |
| RBAC | `user_roles` table + `has_role`/`is_admin` SECURITY DEFINER functions + server-side actor checks |

### The admission stage machine

```text
NEW → ASSIGNED → CONTACTED → WOC_BOOKED → WOC_ATTENDED
    → ACC_BOOKED → ACC_ATTENDED → EXAM_BOOKED → HALL_TICKET_GENERATED
```

Rules (`src/domains/admissions/types.ts`):

- `STAGE_ORDER` defines the index positions.
- `canTransition(from, to)` allows **exactly one step forward or one step backward** (`delta === 1 || delta === -1`).
- `nextStages(from)` returns the legal targets.
- The **only** code path that mutates `students.stage` is `transitionStage()` in
  `src/domains/students/students.server.ts`; it appends an immutable `student_events` row every time.

### The four engines

1. **Assignment engine** — `src/domains/assignment/*`: policies → rules → pools → algorithms.
2. **Event/scheduling engine** — `src/domains/events/*`: events, sessions, bookings, auto-allocation.
3. **Attendance engine** — `src/domains/attendance/*`: ground access tokens, QR scan, attendance marking.
4. **Notification engine** — `src/domains/notifications/*`: append-only `email_queue` (simulated delivery).

---

## 2. Tech stack, tooling & environment

### Runtime stack

| Layer | Technology |
| --- | --- |
| Framework | TanStack Start v1 (React 19, SSR + server functions) |
| Router | TanStack Router (file-based, `src/routes/`, generated `src/routeTree.gen.ts`) |
| Build | Vite 8, `@lovable.dev/vite-tanstack-config` |
| Server runtime | Cloudflare Workers–style edge (`nodejs_compat`); entry `src/server.ts` |
| Data layer | Supabase (Postgres + Auth), `@supabase/supabase-js` v2 |
| Data fetching | TanStack Query v5 |
| Forms | react-hook-form + `@hookform/resolvers` + zod 3 |
| UI | Tailwind CSS v4 (`src/styles.css`, `@theme` tokens), shadcn/Radix primitives, lucide icons |
| Toasts | sonner |
| Charts | recharts |
| QR | `qrcode.react` (render), `qrcode` (PDF embed), `html5-qrcode` (camera scan) |
| PDF | `jspdf` |
| Spreadsheets | `xlsx` (parse + CSV template), `exceljs` (XLSX template with dropdown validation) |
| Dates | `date-fns` + custom 12-hour helpers in `src/lib/datetime.ts` |

### Scripts

```bash
bun run dev        # vite dev
bun run build      # vite build (production)
bun run build:dev  # vite build --mode development (prerender check)
bun run lint       # eslint
bun run format     # prettier
```

### Environment variables

| Variable | Scope | Purpose |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | browser (`import.meta.env`) | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | browser | Publishable/anon key |
| `VITE_SUPABASE_PROJECT_ID` | browser | Project ref |
| `SUPABASE_URL` | server (`process.env`, read inside handlers) | Supabase project URL |
| `SUPABASE_PUBLISHABLE_KEY` | server | Used by `requireSupabaseAuth` to build the user-scoped client |
| `SUPABASE_SERVICE_ROLE_KEY` | server only | Used by `supabaseAdmin` (bypasses RLS) |

> `process.env.*` must be read **inside** `.handler()` bodies, never at module scope.

---

## 3. Architecture & folder layout

Strict four-layer architecture, enforced per domain:

```text
route (src/routes/*.tsx)
   ↓ calls
controller (src/domains/<domain>/<domain>.functions.ts)   ← createServerFn + zod + auth middleware
   ↓ calls
service  (src/domains/<domain>/<domain>.service.ts | *.server.ts)  ← business rules
   ↓ calls
repository (src/domains/<domain>/<domain>.repo.ts)         ← raw Supabase queries only
```

```text
src/
├── components/
│   ├── assignment/     PolicyPanel, PoolPanel, RulePanel, AssignmentLog, types
│   ├── attendance/     GroundConsole, GroundLogin, QrScanner, SessionAttendancePanel
│   ├── chat/           ChatThread
│   ├── counsellors/    CounsellorCreateForm, CounsellorList, CounsellorDetailDrawer,
│   │                   CounsellorProfilePanel, FirstLoginGate
│   ├── events/         EventForm
│   ├── layout/         AppShell, Sidebar, TopBar
│   ├── portal/         PortalShell, ProgressTimeline, StudentPasswordGate
│   ├── programmes/     ProgrammeForm, ProgrammeTable
│   ├── shared/         AdminOnly, DateTimeField, EmptyState, PageHeader, Pagination,
│   │                   StageBadge, StatCard, index.ts (barrel)
│   ├── students/       ApplicationForm, EnquiryForm, StudentTable, StudentFilters,
│   │                   StudentDetailDrawer, BulkUploadPanel, BulkResultTable
│   └── ui/             shadcn primitives (unmodified)
├── config/constants.ts   APP_NAME, NAV_ITEMS, ROLE_LABELS, STAGES, LEAD_SOURCES, PAGE_SIZE
├── domains/
│   ├── admissions/     types.ts (stage machine)
│   ├── analytics/      analytics.functions.ts, analytics.server.ts
│   ├── assignment/     schema, functions, repo, service, console.service, policies.repo, algorithms
│   ├── attendance/     schema, functions, repo, service, ground.access.server, ground-token
│   ├── chat/           schema, functions, repo, service
│   ├── counsellors/    schema, functions, counsellors.server, accounts.server, detail.server,
│   │                   leads.server, profile.server
│   ├── events/         schema, functions, repo, service, events.server, allocation.service
│   ├── exams/          exams.functions, exams.repo, exams.service
│   ├── notifications/  notifications.functions, email.server
│   ├── portal/         portal.functions, portal.repo, portal.service
│   ├── programmes/     schema, functions, repo, service
│   ├── students/       schema, bulk.schema, students.functions, students.server,
│   │                   applications.server, detail.server, bulk.server
│   └── users/          users.functions, access.server
├── hooks/              use-session.ts, use-mobile.tsx
├── integrations/
│   ├── lovable/        OAuth helper
│   └── supabase/       client.ts, client.server.ts, auth-middleware.ts, auth-attacher.ts,
│                       previewAuthStorage.ts, types.ts (generated)
├── lib/                qr.ts, hall-ticket-pdf.ts, bulk-upload.ts, datetime.ts,
│                       error-capture.ts, error-page.ts, utils.ts
├── routes/             file-based routes (see §10)
├── router.tsx          createRouter + QueryClient context
├── start.ts            createStart: functionMiddleware + requestMiddleware
├── server.ts           fetch entry + catastrophic-SSR-error normalisation
└── styles.css          Tailwind v4 theme tokens
```

### Module-boundary rules (critical when porting)

- `*.functions.ts` files ship their **module scope** to the client bundle; only handler bodies are
  stripped. Therefore every server-only import (`supabaseAdmin`, `*.server.ts`, `*.service.ts`,
  `*.repo.ts`) is loaded with `await import(...)` **inside** the handler.
- `src/integrations/supabase/client.server.ts` (`supabaseAdmin`, service role) may only be imported
  at module scope by other `*.server.ts` / `*.repo.ts` / `*.service.ts` files.
- No files under `src/routes/api/**` exist. **All** client→server traffic is `createServerFn` RPC.

---

## 4. Database: enums, tables, indexes

Migrations, applied in order (`supabase/migrations/`):

| File | Contents |
| --- | --- |
| `20260730132945_*.sql` | Base schema: enums, profiles, user_roles, counsellors, students, student_events, call_logs, seminars, seminar_bookings, attendance, exams, exam_rooms, exam_seats, hall_tickets, email_queue; core functions and triggers |
| `20260730133023_*.sql` | Function-level REVOKE/GRANT hardening |
| `20260803050318_*.sql` | Programme pivot: academic_years, programmes, venues, counsellor_pools, counsellor_pool_members, assignment_policies, assignment_rules, assignments, events, event_sessions; `programme_id` added to legacy tables |
| `20260804043654_*.sql` | `students.user_id` + student self-read policies |
| `20260804045214_*.sql` | `current_student_id()` + student portal policies |
| `20260804045256_*.sql` | `counsellors.must_reset_password`, `assignment_policies.is_published` (single-published unique index), `event_sessions.ground_password`, `seminar_bookings.event_id` + per-event unique booking |
| `20260806092819_*.sql` | Portal/booking policy refinements |
| `20260814045758_*.sql` | `ground_access_sessions`, `student_messages`, `exam_configs`; `call_logs.called_at` + append-only hardening; `attendance` walk-in/session columns; `hall_tickets` event/session/booking columns |

### 4.1 Enums

| Enum | Values |
| --- | --- |
| `app_role` | `super_admin`, `admissions_admin`, `counsellor`, `ground_admin` |
| `admission_stage` | `NEW`, `ASSIGNED`, `CONTACTED`, `WOC_BOOKED`, `WOC_ATTENDED`, `ACC_BOOKED`, `ACC_ATTENDED`, `EXAM_BOOKED`, `HALL_TICKET_GENERATED` |
| `seminar_type` | `WOC`, `ACC` |
| `lead_source` | `WEBSITE`, `REFERRAL`, `WALK_IN`, `SOCIAL_MEDIA`, `EDUCATION_FAIR`, `SCHOOL_VISIT`, `OTHER` |
| `email_status` | `QUEUED`, `SENT`, `FAILED`, `CANCELLED` |
| `booking_status` | `BOOKED`, `ATTENDED`, `CANCELLED`, `NO_SHOW` |
| `call_outcome` | `CONNECTED`, `NO_ANSWER`, `BUSY`, `WRONG_NUMBER`, `NOT_INTERESTED`, `CALLBACK_REQUESTED` |
| `programme_status` | `DRAFT`, `OPEN`, `CLOSED` |
| `assignment_algorithm` | `ROUND_ROBIN`, `LEAST_WORKLOAD`, `LEAST_ACTIVE`, `MANUAL` |
| `assignment_policy_type` | `MANUAL`, `ROUND_ROBIN`, `LEAST_WORKLOAD`, `LEAST_ACTIVE`, `PROGRAMME_BASED`, `HYBRID` |
| `assignment_source` | `AUTO`, `MANUAL` |
| `allocation_strategy` | `FIRST_AVAILABLE`, `LEAST_FILLED`, `ROUND_ROBIN`, `MANUAL` |
| `event_type` | `WOC`, `ACC`, `EXAM`, `OTHER` |

### 4.2 Tables

Every table lives in `public`. `id uuid PK default gen_random_uuid()` unless stated.
`created_at`/`updated_at` are `timestamptz NOT NULL default now()`; `updated_at` is maintained by the
`set_updated_at()` trigger on the tables listed in §5.

#### `profiles`
`id uuid PK → auth.users(id) ON DELETE CASCADE`, `full_name text NOT NULL default ''`,
`email text`, `phone text`, `avatar_url text`, `created_at`, `updated_at`.
Auto-created by `handle_new_user()` on `auth.users` insert.

#### `user_roles`
`id`, `user_id uuid NOT NULL → auth.users(id) CASCADE`, `role app_role NOT NULL`, `created_at`.
**UNIQUE (user_id, role)**. Roles live here and **never** on `profiles`/`students` (privilege-escalation guard).

#### `counsellors`
`id`, `user_id uuid → auth.users(id) SET NULL`, `full_name text NOT NULL`, `email text NOT NULL`,
`phone text`, `is_active boolean NOT NULL default true`, `max_active_leads integer NOT NULL default 60`,
`must_reset_password boolean NOT NULL default false`, `created_at`, `updated_at`.

#### `students`  (source of truth)
`id`, `student_code text NOT NULL UNIQUE`, `full_name text NOT NULL`, `date_of_birth date`,
`school text`, `course text`, `parent_name text`, `parent_phone text`, `email text NOT NULL`,
`phone text NOT NULL`, `lead_source lead_source NOT NULL default 'WEBSITE'`,
`stage admission_stage NOT NULL default 'NEW'`, `counsellor_id uuid → counsellors(id) SET NULL`,
`notes text`, `programme_id uuid → programmes(id) SET NULL`,
`user_id uuid → auth.users(id) SET NULL`, `created_at`, `updated_at`.
Indexes: `idx_students_stage`, `idx_students_counsellor`, `idx_students_created_at (created_at DESC)`,
`idx_students_programme`, unique partial `students_user_id_key (user_id) WHERE user_id IS NOT NULL`.
Sequence `student_id_seq` drives `student_code` = `STU-YYYY-####` via `assign_student_code()`.

#### `student_events`  (immutable audit trail)
`id`, `student_id uuid NOT NULL → students CASCADE`, `from_stage admission_stage`,
`to_stage admission_stage NOT NULL`, `actor_id uuid → auth.users SET NULL`, `actor_label text`,
`reason text`, `created_at`. Index `idx_student_events_student (student_id, created_at DESC)`.

#### `call_logs`  (append-only)
`id`, `student_id NOT NULL → students CASCADE`, `counsellor_id → counsellors SET NULL`,
`outcome call_outcome NOT NULL`, `notes text`, `next_action_at timestamptz`,
`called_at timestamptz NOT NULL default now()`, `created_at`.
Indexes: `idx_call_logs_student (student_id, created_at DESC)`, `idx_call_logs_next_action`.
`UPDATE`/`DELETE` are REVOKEd from `authenticated` — logs cannot be edited once saved.

#### `programmes`
`id`, `code text NOT NULL UNIQUE`, `name text NOT NULL`, `department text NOT NULL default 'General'`,
`academic_year_id → academic_years SET NULL`, `intake integer NOT NULL default 60`, `duration text`,
`description text`, `status programme_status NOT NULL default 'DRAFT'`,
`applications_open_at timestamptz`, `applications_close_at timestamptz`, `created_at`, `updated_at`.

#### `academic_years`
`id`, `label text NOT NULL UNIQUE`, `starts_on date NOT NULL`, `ends_on date NOT NULL`,
`is_active boolean NOT NULL default true`, `created_at`, `updated_at`.

#### `venues`
`id`, `name text NOT NULL`, `campus text NOT NULL default 'Main Campus'`, `building text`, `floor text`,
`capacity integer NOT NULL default 100`, `facilities text[] NOT NULL default '{}'`,
`priority integer NOT NULL default 100`, `is_active boolean NOT NULL default true`, `created_at`, `updated_at`.

#### `counsellor_pools`
`id`, `name text NOT NULL UNIQUE`, `description text`,
`default_algorithm assignment_algorithm NOT NULL default 'LEAST_WORKLOAD'`,
`is_active boolean NOT NULL default true`, `created_at`, `updated_at`.

#### `counsellor_pool_members`
`id`, `pool_id NOT NULL → counsellor_pools CASCADE`, `counsellor_id NOT NULL → counsellors CASCADE`,
`created_at`. **UNIQUE (pool_id, counsellor_id)**.

#### `assignment_policies`
`id`, `name text NOT NULL`, `policy_type assignment_policy_type NOT NULL default 'MANUAL'`,
`enabled boolean NOT NULL default false`, `auto_assign boolean NOT NULL default false`,
`fallback_algorithm assignment_algorithm NOT NULL default 'LEAST_WORKLOAD'`,
`default_pool_id → counsellor_pools SET NULL`, `priority integer NOT NULL default 100`,
`is_published boolean NOT NULL default false`, `created_at`, `updated_at`.
**UNIQUE partial index `assignment_policies_single_published ((is_published)) WHERE is_published`** —
at most one published policy at any time.

#### `assignment_rules`
`id`, `policy_id NOT NULL → assignment_policies CASCADE`,
`programme_id → programmes CASCADE` (NULL = wildcard rule), `pool_id NOT NULL → counsellor_pools CASCADE`,
`algorithm assignment_algorithm NOT NULL default 'LEAST_WORKLOAD'`,
`priority integer NOT NULL default 100`, `created_at`, `updated_at`.

#### `assignments`  (append-only decision audit)
`id`, `student_id NOT NULL → students CASCADE`, `counsellor_id → counsellors SET NULL`,
`programme_id`, `policy_id`, `rule_id`, `pool_id` (all SET NULL), `algorithm assignment_algorithm`,
`source assignment_source NOT NULL default 'AUTO'`, `candidates jsonb NOT NULL default '[]'`,
`rule_label text`, `actor_id → auth.users SET NULL`, `actor_label text NOT NULL default 'System'`,
`created_at`. Index `idx_assignments_student`.
A row is written for **every** engine decision, including misses (with `reason`/`rule_label`).

#### `events`
`id`, `programme_id → programmes CASCADE` (NULL = all programmes), `title text NOT NULL`,
`event_type event_type NOT NULL default 'WOC'`, `subject text`, `description text`,
`allocation_strategy allocation_strategy NOT NULL default 'LEAST_FILLED'`,
`registration_opens_at timestamptz`, `registration_closes_at timestamptz`,
`auto_approve boolean NOT NULL default true`, `allow_cancellation boolean NOT NULL default true`,
`cancellation_cutoff_hours integer NOT NULL default 24`,
`target_stage admission_stage`, `is_open boolean NOT NULL default true`, `created_at`, `updated_at`.
Index `idx_events_programme`.

#### `event_sessions`
`id`, `event_id NOT NULL → events CASCADE`, `venue_id → venues SET NULL`,
`starts_at timestamptz NOT NULL`, `ends_at timestamptz NOT NULL`,
`capacity integer NOT NULL default 100`, `reserved_seats integer NOT NULL default 0`,
`waitlist_enabled boolean NOT NULL default false`, `waitlist_size integer NOT NULL default 0`,
`is_open boolean NOT NULL default true`, `ground_password text`, `created_at`, `updated_at`.
Index `idx_sessions_event`.

#### `seminar_bookings`  (bookings for both seminars and exams)
`id`, `seminar_id → seminars CASCADE` (legacy, nullable), `student_id NOT NULL → students CASCADE`,
`booking_ref text NOT NULL UNIQUE`, `qr_payload text NOT NULL`,
`status booking_status NOT NULL default 'BOOKED'`, `booked_at timestamptz NOT NULL default now()`,
`session_id → event_sessions SET NULL`, `event_id → events CASCADE`.
Constraints: `UNIQUE (seminar_id, student_id)`; unique partial
`seminar_bookings_student_event_key (student_id, event_id) WHERE event_id IS NOT NULL AND status <> 'CANCELLED'`
— **one live booking per student per event**. Index `idx_bookings_seminar`.

#### `attendance`
`id`, `booking_id → seminar_bookings CASCADE` (nullable, walk-ins have none),
`student_id NOT NULL → students CASCADE`, `seminar_id → seminars CASCADE` (legacy, nullable),
`session_id → event_sessions CASCADE`, `scanned_by → auth.users SET NULL`,
`scanned_at timestamptz NOT NULL default now()`, `programme_id → programmes SET NULL`,
`is_walk_in boolean NOT NULL default false`, `staff_name text`.
Unique: `(booking_id)`; unique partial `(session_id, student_id) WHERE session_id IS NOT NULL`
(created twice under names `attendance_unique_session_student` and `idx_attendance_session_student`)
— **no double check-in per session**.

#### `ground_access_sessions`  (device-independent ground-staff auth)
`id`, `session_id NOT NULL → event_sessions CASCADE`, `token_hash text NOT NULL UNIQUE`,
`staff_name text NOT NULL`, `purpose text NOT NULL default 'SEMINAR'`,
`expires_at timestamptz NOT NULL`, `created_at`, `updated_at`.
Index `idx_ground_sessions_session`. Only the SHA-256 **hash** of the token is stored.

#### `student_messages`  (1:1 chat)
`id`, `student_id NOT NULL → students CASCADE`, `counsellor_id NOT NULL → counsellors CASCADE`,
`sender_type text NOT NULL CHECK (IN ('STUDENT','COUNSELLOR'))`, `sender_user_id uuid NOT NULL`,
`body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000)`, `read_at timestamptz`,
`created_at`, `updated_at`. Index `idx_student_messages_thread (student_id, counsellor_id, created_at)`.

#### `exam_configs`
`id`, `event_id NOT NULL UNIQUE → events CASCADE`, `duration_minutes integer NOT NULL default 90`,
`instructions text NOT NULL default 'Carry your Aadhaar card for identity verification along with a printed copy of this hall ticket.'`,
`created_at`, `updated_at`.

#### `hall_tickets`
`id`, `student_id NOT NULL → students CASCADE`, `exam_id → exams CASCADE` (legacy, nullable),
`ticket_number text NOT NULL UNIQUE`, `qr_payload text NOT NULL`,
`issued_at timestamptz NOT NULL default now()`, `event_id → events CASCADE`,
`session_id → event_sessions CASCADE`, `booking_id → seminar_bookings CASCADE`.
Unique: `(student_id, exam_id)`, unique index `idx_hall_tickets_booking (booking_id)`.

#### `email_queue`
`id`, `student_id → students SET NULL`, `to_email text NOT NULL`, `template_key text NOT NULL`,
`subject text NOT NULL`, `payload jsonb NOT NULL default '{}'`,
`status email_status NOT NULL default 'QUEUED'`, `attempts integer NOT NULL default 0`,
`last_error text`, `created_at`, `sent_at timestamptz`.
Index `idx_email_queue_status (status, created_at DESC)`.
Template keys in use: `welcome_enquiry`, `application_received`, `seminar_booking_confirmed`.

#### Legacy tables (retained, superseded by events/sessions)
`seminars`, `exams`, `exam_rooms`, `exam_seats` — still present with RLS/grants, referenced by the
nullable legacy FKs above. The active scheduling path is `events` + `event_sessions`.

---

## 5. Database: functions & triggers

| Function | Returns | Properties | Behaviour |
| --- | --- | --- | --- |
| `set_updated_at()` | trigger | plpgsql, `search_path=public` | `NEW.updated_at = now()` |
| `has_role(_user_id uuid, _role app_role)` | boolean | sql, STABLE, **SECURITY DEFINER**, `search_path=public` | `EXISTS(SELECT 1 FROM user_roles WHERE user_id=_user_id AND role=_role)` |
| `is_admin(_user_id uuid)` | boolean | sql, STABLE, **SECURITY DEFINER** | true when the user holds `super_admin` or `admissions_admin` |
| `handle_new_user()` | trigger | plpgsql, **SECURITY DEFINER** | inserts a `profiles` row from `auth.users` metadata, `ON CONFLICT (id) DO NOTHING` |
| `current_counsellor_id()` | uuid | sql, STABLE, **SECURITY DEFINER** | `counsellors.id WHERE user_id = auth.uid()` |
| `current_student_id()` | uuid | sql, STABLE, **SECURITY DEFINER** | `students.id WHERE user_id = auth.uid()` |
| `assign_student_code()` | trigger | plpgsql | generates `STU-YYYY-####` from `student_id_seq` when `student_code` is blank |

SECURITY DEFINER is required on the role/identity helpers so RLS policies can call them without
recursive policy evaluation.

### Triggers

| Trigger | Table | Timing | Function |
| --- | --- | --- | --- |
| `on_auth_user_created` | `auth.users` | AFTER INSERT | `handle_new_user()` |
| `students_student_code` | `students` | BEFORE INSERT | `assign_student_code()` |
| `*_updated_at` | `profiles`, `counsellors`, `students`, `seminars`, `exams`, `academic_years`, `programmes`, `venues`, `counsellor_pools`, `assignment_policies`, `assignment_rules`, `events`, `event_sessions`, `ground_access_sessions`, `student_messages`, `exam_configs` | BEFORE UPDATE | `set_updated_at()` |

No soft deletes and no AFTER DELETE triggers anywhere.

---

## 6. Security: GRANTs, RLS policies, RBAC

### 6.1 Function grants

```sql
REVOKE ALL ON FUNCTION set_updated_at(), assign_student_code(), handle_new_user()
  FROM PUBLIC, anon, authenticated;      -- trigger-only
REVOKE ALL ON FUNCTION has_role(uuid, app_role), is_admin(uuid), current_counsellor_id()
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION has_role(uuid, app_role), is_admin(uuid), current_counsellor_id()
  TO authenticated;
```

### 6.2 Table grants

| Role | Grants |
| --- | --- |
| `anon` | `SELECT` on `programmes` only |
| `authenticated` | per-table SELECT/INSERT/UPDATE(/DELETE) mirroring the policy intent — see the per-table list below |
| `service_role` | `ALL` on every table |

Per-table `authenticated` grants:

| Table | authenticated |
| --- | --- |
| `profiles` | SELECT, INSERT, UPDATE |
| `user_roles` | SELECT |
| `counsellors`, `seminars`, `exams`, `exam_rooms`, `exam_seats`, `academic_years`, `programmes`, `venues`, `counsellor_pools`, `counsellor_pool_members`, `assignment_policies`, `assignment_rules`, `events`, `event_sessions` | SELECT, INSERT, UPDATE, DELETE |
| `students` | SELECT, INSERT, UPDATE, DELETE |
| `student_events`, `assignments`, `attendance` | SELECT, INSERT |
| `call_logs` | SELECT, INSERT (UPDATE/DELETE later REVOKEd) |
| `seminar_bookings`, `email_queue`, `student_messages` | SELECT, INSERT, UPDATE |
| `hall_tickets` | SELECT (+ legacy INSERT) |
| `exam_configs` | SELECT |
| `ground_access_sessions` | *(none — service_role only)* |

### 6.3 RLS policies (all tables have RLS ENABLED)

| Table | Policy | Cmd | Expression |
| --- | --- | --- | --- |
| `profiles` | `profiles_self_or_admin_read` | SELECT | `id = auth.uid() OR is_admin(auth.uid())` |
| | `profiles_self_insert` | INSERT | `WITH CHECK id = auth.uid()` |
| | `profiles_self_update` | UPDATE | `id = auth.uid()` both sides |
| `user_roles` | `user_roles_self_or_admin_read` | SELECT | `user_id = auth.uid() OR is_admin(auth.uid())` — no write policy; role changes require `service_role` |
| `counsellors` | `counsellors_read` / `counsellors_admin_write` | SELECT / ALL | `true` / `is_admin(auth.uid())` |
| `students` | `students_admin_all` | ALL | `is_admin(auth.uid())` |
| | `students_counsellor_read` | SELECT | `counsellor_id = current_counsellor_id()` |
| | `students_counsellor_update` | UPDATE | `counsellor_id = current_counsellor_id()` |
| | `students_ground_admin_read` | SELECT | `has_role(auth.uid(),'ground_admin')` |
| | `students_self_read` | SELECT | `user_id = auth.uid()` |
| `student_events` | `student_events_admin_read` | SELECT | `is_admin(auth.uid())` |
| | `student_events_counsellor_read` | SELECT | student belongs to `current_counsellor_id()` |
| | `student_events_self_read` | SELECT | `student_id = current_student_id()` |
| `call_logs` | `call_logs_admin_read` / `call_logs_admin_insert` | SELECT / INSERT | `is_admin(auth.uid())` |
| | `call_logs_counsellor_read` / `call_logs_counsellor_insert` | SELECT / INSERT | `counsellor_id = current_counsellor_id()` |
| `programmes` | `programmes_read` | SELECT (authenticated) | `true` |
| | `programmes_public_read` | SELECT (**anon**) | `status = 'OPEN'` |
| | `programmes_admin_write` | ALL | `is_admin(auth.uid())` |
| `academic_years`, `venues`, `counsellor_pools`, `counsellor_pool_members`, `assignment_policies`, `assignment_rules`, `events`, `event_sessions`, `seminars`, `exams`, `exam_rooms`, `exam_configs` | `<t>_read` / `<t>_admin_write` | SELECT / ALL | `true` / `is_admin(auth.uid())` |
| `assignments` | `assignments_admin_read` / `assignments_admin_insert` | SELECT / INSERT | `is_admin(auth.uid())` — append-only |
| `seminar_bookings` | `bookings_admin_all` | ALL | `is_admin(auth.uid())` |
| | `bookings_ground_read` / `bookings_ground_update` | SELECT / UPDATE | `has_role(auth.uid(),'ground_admin')` |
| | `bookings_self_read` / `bookings_self_insert` / `bookings_self_update` | SELECT / INSERT / UPDATE | `student_id = current_student_id()` |
| `attendance` | `attendance_admin_all` | ALL | `is_admin(auth.uid())` |
| | `attendance_ground_read` / `attendance_ground_insert` | SELECT / INSERT | `has_role(auth.uid(),'ground_admin')` |
| `hall_tickets` | `hall_tickets_admin_all` | ALL | `is_admin(auth.uid())` |
| | `hall_tickets_self_read` | SELECT | `student_id = current_student_id() OR is_admin(auth.uid())` |
| `email_queue` | `email_queue_admin_all` | ALL | `is_admin(auth.uid())` |
| `exam_seats` | `exam_seats_admin_all` | ALL | `is_admin(auth.uid())` |
| `ground_access_sessions` | `ground_sessions_admin_read` | SELECT | `is_admin(auth.uid())` (no `authenticated` grant → effectively service_role only) |
| `student_messages` | `messages_party_read` | SELECT | `student_id = current_student_id() OR counsellor_id = current_counsellor_id()` |
| | `messages_student_send` | INSERT | `sender_type='STUDENT' AND sender_user_id=auth.uid() AND student_id=current_student_id() AND` the student is currently assigned to that counsellor |
| | `messages_counsellor_send` | INSERT | `sender_type='COUNSELLOR' AND sender_user_id=auth.uid() AND counsellor_id=current_counsellor_id() AND` the student is allocated to that counsellor |
| | `messages_party_mark_read` | UPDATE | either party |

### 6.4 RBAC model

Roles are stored **only** in `user_roles`. Application-side enforcement lives in
`src/domains/users/access.server.ts` and is applied inside every protected server function:

| Helper | Behaviour | Error thrown |
| --- | --- | --- |
| `loadActor(supabase, userId)` | reads `user_roles` + `profiles` through the **caller's RLS-scoped client**; returns `{ userId, label, roles, isAdmin }` | — |
| `requireStaff` | actor must have ≥1 role | `Forbidden: no staff role assigned` |
| `requireAdmin` | actor must be `super_admin` or `admissions_admin` | `Forbidden: admin role required` |
| `studentScope` | admins → `counsellorId: null` (all students); others must own a `counsellors` row and are pinned to it | `Forbidden: no counsellor profile for this account` |
| `assertStudentVisible` | no-op for admins; counsellors must own the student | `Forbidden: this student is not allocated to you` |

`isAdmin = roles.includes('super_admin') || roles.includes('admissions_admin')`.
`label = profile.full_name || profile.email || 'Staff member'`.

---

## 7. Authentication & session model

There are **three independent identity systems**. Porting must preserve all three.

### 7.1 Staff & student Supabase auth

- Browser client: `src/integrations/supabase/client.ts` — lazily built via `Proxy`, publishable key,
  `persistSession: true`, `autoRefreshToken: true`, storage adapter `brokeredPreviewStorage()`.
- Server middleware: `requireSupabaseAuth` (`auth-middleware.ts`) reads `Authorization: Bearer <jwt>`,
  validates the 3-part JWT, builds a **user-scoped** client (RLS applies as the user), calls
  `supabase.auth.getClaims(token)`, and puts `{ supabase, userId, claims }` on `context`.
  Errors: `Unauthorized: No request headers available`, `... No authorization header provided`,
  `... Only Bearer tokens are supported`, `... No token provided`, `... Invalid token`,
  `... No user ID found in token`.
- Client middleware: `attachSupabaseAuth` (`auth-attacher.ts`) attaches the bearer token to every
  server-fn RPC. Registered in `src/start.ts` as `functionMiddleware`.
- Admin client: `supabaseAdmin` (`client.server.ts`, service role, bypasses RLS) — used by repos/services.

`src/start.ts`:

```ts
requestMiddleware:  [errorMiddleware, csrfMiddleware]   // csrf scoped to handlerType === "serverFn"
functionMiddleware: [attachSupabaseAuth]
```

`src/server.ts` wraps the generated server entry, normalises h3's swallowed
`{"unhandled":true,"message":"HTTPError"}` 5xx bodies into a rendered error page, and logs the last
captured error via `consumeLastCapturedError()`.

### 7.2 Ground-staff opaque token sessions

Ground staff have **no Supabase account**. `src/domains/attendance/ground.access.server.ts`:

- `issueGroundAccess(sessionId, staffName, purpose)` — mints a 32-byte random token, TTL **12 hours**,
  stores only its **SHA-256 hash** in `ground_access_sessions`, returns the raw token once.
- `requireGroundAccess(token)` — rejects tokens shorter than 16 chars, looks up by hash, checks expiry.
  Throws `Ground access expired — sign in again`.
- `revokeGroundAccess(token)` — deletes the row by hash.

The raw token is held client-side in `localStorage` under `GROUND_TOKEN_KEY`
(`src/domains/attendance/ground-token.ts`). This design is deliberate: it supports many staff devices
on the same session simultaneously, works on iOS (no cookie partitioning issues), and needs no shared
signing secret across preview/production.

### 7.3 Session password gates

- `FirstLoginGate` (staff shell) — blocks the whole authenticated app when
  `counsellors.must_reset_password` is true.
- `StudentPasswordGate` (portal) — blocks the portal when
  `user_metadata.must_reset_password` is true (set for bulk-imported students).

---

## 8. API surface: every server function

All functions are `createServerFn` RPC endpoints. Unless noted, `method: "POST"`.
"Auth" = `requireSupabaseAuth` middleware; "AuthZ" = the in-handler role check.

### 8.1 `users`

| Function | Auth | AuthZ | Input | Returns |
| --- | --- | --- | --- | --- |
| `getCurrentActor` | ✅ | — | — | `{ userId, label, roles[], isAdmin }` |

### 8.2 `analytics`

| Function | Auth | Input | Returns |
| --- | --- | --- | --- |
| `getPipelineOverview` | ✅ | — | `{ overview: { total, byStage, bySource, last30, hallTickets, conversionRate }, activity: [{ id, toStage, fromStage, actorLabel, createdAt, studentName, studentCode }] }` |

### 8.3 `programmes`

| Function | Method | Auth | AuthZ | Input | Returns |
| --- | --- | --- | --- | --- | --- |
| `listProgrammesFn` | POST | ✅ | — | — | `ProgrammeSummary[]` (+ `applications`, `converted`, `fillRate`) |
| `getProgrammeFn` | POST | ✅ | — | `{ id: uuid }` | `{ programme, stageBreakdown[] }` |
| `saveProgrammeFn` | POST | ✅ | `requireAdmin` | `programmeInputSchema` | `{ ok: true }` |
| `listAcademicYearsFn` | POST | ✅ | — | — | academic year rows |
| `createAcademicYearFn` | POST | ✅ | `requireAdmin` | `academicYearInputSchema` | `{ ok: true }` |
| `listVenuesFn` | POST | ✅ | — | — | venue rows |
| `saveVenueFn` | POST | ✅ | `requireAdmin` | `venueInputSchema` | `{ ok: true }` |
| `listOpenProgrammesFn` | **GET** | ❌ public | — | — | `{ id, code, name, department }[]` |

Schemas:

```ts
programmeInputSchema  = { id?: uuid, code: 2..40, name: 2..160, department: 2..120,
                          academicYearId?: uuid|null, intake: int 1..10000, duration?: ≤60,
                          description?: ≤1000, status: DRAFT|OPEN|CLOSED = DRAFT,
                          applicationsOpenAt?, applicationsCloseAt? }
academicYearInputSchema = { label: 4..20, startsOn, endsOn }
venueInputSchema      = { id?: uuid, name: 2..120, campus = "Main Campus", building?, floor?,
                          capacity: 1..5000, facilities: string[] ≤20 = [], isActive = true }
```

### 8.4 `students`

| Function | Auth | AuthZ | Input | Returns |
| --- | --- | --- | --- | --- |
| `submitEnquiry` | ❌ public | — | `enquirySchema` | `{ studentCode, studentId }` |
| `submitApplication` | ❌ public | — | `applicationSchema` | `{ studentCode, studentId, counsellorName }` |
| `listStudents` | ✅ | `studentScope` | `registryQuerySchema` | `{ rows, total, page, pageSize, stats }` |
| `getStudent` | ✅ | `assertStudentVisible` | `{ id: uuid }` | `{ student, timeline }` |
| `getStudentDetailFn` | ✅ | `assertStudentVisible` | `{ id: uuid }` | `{ student, timeline, assignments, bookings, programme }` |
| `moveStudentStage` | ✅ | `requireStaff` + `assertStudentVisible` | `stageTransitionSchema` | `{ from, to, changed }` |
| `assignStudentCounsellor` | ✅ | `requireAdmin` | `{ studentId: uuid, counsellorId: uuid\|null }` | `{ ok: true }` |
| `logStudentCall` | ✅ | `requireStaff` + `assertStudentVisible` | `callLogSchema` | `{ ok: true }` |
| `bulkImportStudents` | ✅ | `requireAdmin` | `bulkImportSchema` | `BulkResult[]` |

Schemas:

```ts
enquirySchema  = { fullName: 2..120, dateOfBirth, school: 2..160, course: 1..120,
                   parentName: 2..120, parentPhone: 7..24, email: ≤255, phone: 7..24, leadSource }
applicationSchema = enquirySchema + { programmeId: uuid, password: 8..72, confirmPassword }
                    .refine(passwords match)
registryQuerySchema = { search?: ≤120, stage?, counsellorId?: uuid, from?, to?,
                        sortBy = created_at, order = desc, page = 1 (1..5000), pageSize = 10 (5..100) }
stageTransitionSchema = { studentId: uuid, toStage: admission_stage, reason?: ≤500 }
callLogSchema  = { studentId: uuid, outcome: call_outcome, notes?: ≤1000, calledAt?: ≤40 }
bulkImportSchema = { rows: bulkRowSchema[] (1..500) }
```

`BULK_COLUMNS` (10 columns, **no password column** — the system generates one):
`full_name, date_of_birth (YYYY-MM-DD), school, programme_code, parent_name, parent_phone,
email, phone, lead_source, notes`.

`BulkResult` per row: `{ row, email, fullName, status: CREATED|SKIPPED|FAILED, password?, reason? }`.

### 8.5 `counsellors`

| Function | Auth | AuthZ | Input | Returns |
| --- | --- | --- | --- | --- |
| `listCounsellors` | ✅ | — | — | `CounsellorRow[]` with live `active_leads` |
| `listMyLeadsFn` | ✅ | — | — | `{ counsellor, leads[] }` (leads include joined `call_logs`) |
| `createCounsellorAccountFn` | ✅ | `requireAdmin` | `{ email, password: 8..72 }` | `{ counsellorId, email }` |
| `getCounsellorDetailFn` | ✅ | `requireAdmin` | `{ id: uuid }` | `{ counsellor, students[], calls[] }` |
| `getMyCounsellorFn` | ✅ | — | — | `MyCounsellorProfile \| null` |
| `updateMyCounsellorFn` | ✅ | — | `{ fullName: 2..120, phone?: ≤24, maxActiveLeads: int 1..500 = 50 }` | `{ ok: true }` |
| `completeFirstLoginResetFn` | ✅ | — | `{ password: 8..72, confirmPassword }` (must match) | `{ ok: true }` |

### 8.6 `assignment`

| Function | Auth | AuthZ | Input | Returns |
| --- | --- | --- | --- | --- |
| `getEngineConsoleFn` | ✅ | `requireAdmin` | — | `{ policies, pools, rules, counsellors, programmes, log, queueSize }` |
| `createPolicyFn` | ✅ | `requireAdmin` | `policyCreateSchema` | `{ id }` |
| `updatePolicyFn` | ✅ | `requireAdmin` | `policyInputSchema` | `{ ok: true }` |
| `togglePolicyFn` | ✅ | `requireAdmin` | `{ id: uuid, enabled: bool }` | `{ ok: true }` |
| `publishPolicyFn` | ✅ | `requireAdmin` | `{ id: uuid, published: bool }` | `{ published, assigned }` |
| `savePoolFn` | ✅ | `requireAdmin` | `poolInputSchema` | `{ id }` |
| `saveRuleFn` | ✅ | `requireAdmin` | `ruleInputSchema` | `{ ok: true }` |
| `deleteRuleFn` | ✅ | `requireAdmin` | `{ id: uuid }` | `{ ok: true }` |
| `runAssignmentFn` | ✅ | `requireStaff` | `{ studentId: uuid }` | `AssignmentDecision` |
| `runEngineQueueFn` | ✅ | `requireAdmin` | — | `{ considered, assigned }` |

```ts
policyCreateSchema = { name: 2..120, policyType, autoAssign = true, fallbackAlgorithm,
                       defaultPoolId = null, priority: 1..999 = 100 }
policyInputSchema  = { id: uuid, policyType, autoAssign, fallbackAlgorithm, defaultPoolId }
poolInputSchema    = { id?: uuid, name: 2..120, description?: ≤400, defaultAlgorithm,
                       memberIds: uuid[] ≤200 = [] }
ruleInputSchema    = { id?: uuid, policyId: uuid, programmeId: uuid|null, poolId: uuid,
                       algorithm, priority: 1..999 = 100 }
AssignmentDecision = { assigned, counsellorId, counsellorName, algorithm, ruleLabel, reason? }
```

Publishing a policy also runs a **catch-up pass** over the unassigned queue and reports how many
students were assigned.

### 8.7 `events`

| Function | Auth | AuthZ | Input | Returns |
| --- | --- | --- | --- | --- |
| `listEventsFn` | ✅ | `requireAdmin` | — | `EventSummary[]` (sessions decorated with `booked`/`seatsLeft`) |
| `getEventFn` | ✅ | `requireAdmin` | `{ id: uuid }` | `{ event, bookings }` |
| `saveEventFn` | ✅ | `requireAdmin` | `eventInputSchema` | `{ id }` |
| `saveSessionFn` | ✅ | `requireAdmin` | `sessionInputSchema` | `{ ok: true }` |
| `publishEventFn` | ✅ | `requireAdmin` | `{ id, isOpen }` | `{ ok: true }` |
| `bookSessionFn` | ✅ | `requireStaff` | `{ sessionId: uuid, studentId: uuid }` | booking row |
| `autoAllocateFn` | ✅ | `requireAdmin` | `{ id: uuid }` | `{ considered, allocated, skipped, message }` |
| `getExams` | ✅ | `requireAdmin` | — | `{ exams, examReadyStudents }` (legacy table) |

```ts
eventInputSchema   = { id?, title: 3..160, eventType: WOC|ACC|EXAM|OTHER, programmeId: uuid|null = null,
                       subject?: ≤160, description?: ≤1000, allocationStrategy = LEAST_FILLED,
                       targetStage: admission_stage|null = null, registrationOpensAt?,
                       registrationClosesAt?, autoApprove = true, allowCancellation = true,
                       cancellationCutoffHours: 0..720 = 24, isOpen = false }
sessionInputSchema = { id?, eventId: uuid, venueId: uuid|null, startsAt, endsAt,
                       capacity: 1..5000, reservedSeats: 0..5000 = 0, waitlistEnabled = false,
                       waitlistSize: 0..1000 = 0, isOpen = true }
```

### 8.8 `portal` (student self-service)

All act on `context.userId`'s linked student.

| Function | Auth | Input | Returns |
| --- | --- | --- | --- |
| `getMyApplicationFn` | ✅ | — | `{ student, bookings, timeline, progress[] }` |
| `listMySessionsFn` | ✅ | — | eligible bookable sessions grouped by event |
| `registerForSessionFn` | ✅ | `{ sessionId: uuid }` | booking row |
| `cancelMyBookingFn` | ✅ | `{ bookingId: uuid }` | `{ ok: true }` |

### 8.9 `exams`

| Function | Auth | AuthZ | Input | Returns |
| --- | --- | --- | --- | --- |
| `listExamEventsFn` | ✅ | `requireAdmin` | — | EXAM events + their `exam_configs` (defaults applied) |
| `saveExamConfigFn` | ✅ | `requireAdmin` | `{ eventId: uuid, durationMinutes: int 15..600, instructions: ≤1200 = "" }` | `{ ok: true }` |
| `registerForExamFn` | ✅ | student | `{ sessionId: uuid }` | `{ bookingId }` |
| `getHallTicketFn` | ✅ | student (ownership checked) | `{ bookingId: uuid }` | hall-ticket payload |

Hall-ticket payload: `{ ticketNumber, student: { fullName, studentCode, id }, qrPayload,
examTitle, venue, startsAt, endsAt, reportingAt (startsAt − 30 min), durationMinutes, instructions }`.

### 8.10 `attendance`

| Function | Auth | AuthZ | Input | Returns |
| --- | --- | --- | --- | --- |
| `listTodaySessionsFn` | ❌ public | — | `{ purpose: SEMINAR\|EXAM = SEMINAR }` | today's open sessions with a ground password set (password never exposed) |
| `groundLoginFn` | ❌ public | password check | `{ sessionId: uuid, staffName: 2..80, password: 4..64, purpose = SEMINAR }` | `{ ok, token }` |
| `groundBoardFn` | ❌ public | ground token | `{ token: 16..600 }` | board + `staffName` + `purpose` |
| `groundScanFn` | ❌ public | ground token | `{ token, payload: 6..400 }` | `ScanResult` |
| `groundMarkAttendanceFn` | ❌ public | ground token | `{ token, studentId: uuid, walkIn = false }` | `{ ok, walkIn }` |
| `groundSignOutFn` | ❌ public | ground token | `{ token }` | `{ ok: true }` |
| `setGroundPasswordFn` | ✅ | `requireAdmin` | `{ sessionId: uuid, password?: 4..64 }` | `{ password }` |
| `getSessionAttendanceFn` | ✅ | `requireStaff` | `{ sessionId: uuid }` | session board |

`ScanResult.status` ∈ `UNKNOWN | ALREADY_PRESENT | REGISTERED | NOT_REGISTERED | SESSION_FULL | WALK_IN_AVAILABLE`.

### 8.11 `chat`

| Function | Auth | Input | Returns |
| --- | --- | --- | --- |
| `getChatThreadFn` | ✅ | `{ studentId?: uuid }` | `{ me, counterpartName, messages: [{ id, body, mine, createdAt }] }` (also marks read) |
| `sendChatMessageFn` | ✅ | `{ studentId?: uuid, body: 1..2000 }` | `{ ok: true }` |
| `listChatUnreadFn` | ✅ | — | `Record<studentId, unreadCount>` (empty for non-counsellors) |

### 8.12 `notifications`

| Function | Auth | AuthZ | Input | Returns |
| --- | --- | --- | --- | --- |
| `listEmailQueue` | ✅ | `requireAdmin` | `{ status?: QUEUED\|SENT\|FAILED\|CANCELLED }` | `{ rows (≤200), counts }` |

---

## 9. Domain services: business rules & error strings

Error strings are part of the contract — the UI surfaces them verbatim in toasts.

### 9.1 Stage machine — `students.server.ts`

- `transitionStage()`: `Student not found`; no-op when unchanged; otherwise validates `canTransition`
  and throws `` Cannot move a student from ${from} straight to ${toStage} ``; updates `students.stage`
  then appends a `student_events` row.
- `assignCounsellor()`: `Student not found`; sets `counsellor_id`; if the student was `NEW` and is now
  assigned, auto-transitions to `ASSIGNED`.
- `queryRegistry()`: sanitises `%,()` out of the search term, ILIKE across
  name/code/email/phone, plus stage/counsellor/date filters and pagination.
- `registryStats()`: `totalActive` (≠ HALL_TICKET_GENERATED), `wocPending` (ASSIGNED/CONTACTED/WOC_BOOKED),
  `newLeads` (NEW), `unassigned` (no counsellor).
- `createEnquiry()`: inserts `students` (stage NEW), inserts `student_events`, enqueues `welcome_enquiry`.

### 9.2 Application account — `applications.server.ts`

`createApplicationAccount(input)`:
1. lower-cases email; duplicate → `An application already exists for this email. Please sign in instead.`
2. creates the Supabase Auth user
3. inserts the `students` row linked by `user_id` (rolls back the auth user on failure)
4. inserts the `NEW` `student_events` row
5. enqueues `application_received`
6. runs `resolveAssignment()` immediately — **engine errors are swallowed** so a misconfigured engine
   never blocks an application — and returns `counsellorName`.

### 9.3 Bulk import — `bulk.server.ts`

Per row: resolve `programme_code` (unknown → `FAILED`); duplicate email → `SKIPPED`;
create Auth user + student row (DB failure → delete the auth user, `FAILED`);
insert `student_events`; run `resolveAssignment()` (errors swallowed);
return `CREATED` with a generated 10-char password. No orphan auth users are left behind.

### 9.4 Assignment engine — `assignment.service.ts`

`resolveAssignment({ studentId, actorId, actorLabel, force })`:

1. `Student not found` if missing.
2. Active policy = the published policy, else the highest-priority enabled policy.
   None → miss `No assignment policy is enabled`.
3. `!auto_assign && !force` → miss `Auto-assign is switched off`.
4. Rule selection: rule matching the student's `programme_id`, else the wildcard rule
   (`programme_id IS NULL`), else none.
5. Pool = rule pool → policy `default_pool_id`. Algorithm = rule → pool default → policy fallback.
6. Candidates restricted to pool members when the pool has any.
7. **An `assignments` audit row is written for every outcome, hit or miss.**
8. On a hit, calls `assignCounsellor()`.

`runEngineOnQueue()` iterates up to **200** unassigned students with `force: true`.

`algorithms.ts` — `selectCounsellor(algorithm, candidates)`:
filters to candidates with room (`activeLeads < maxActiveLeads`), falling back to the full list when
nobody has room; then `MANUAL → null`, `ROUND_ROBIN → oldest lastAssignedAt`,
`LEAST_WORKLOAD → fewest activeLeads`, `LEAST_ACTIVE → fewest pendingActions`.

Live candidate metrics come from `selectCandidatePool()`: active counsellors, active-lead count
(students not at `HALL_TICKET_GENERATED`), pending count (stage `ASSIGNED`), last `assignments` timestamp.

`publishPolicy(id)` clears `is_published` on every other row first — exactly one published policy.

### 9.5 Booking engine — `events.service.ts`

`bookSession()` enforces, in order:

| Check | Error |
| --- | --- |
| session exists | `Session not found` |
| event exists | `Event not found` |
| event open | `Registration for this event is closed` |
| session open | `This session is closed` |
| session in the future | `This session has passed` |
| registration window opened | `Registration has not opened yet` |
| registration window not closed | `Registration has closed` |
| one live booking per student per event | `You already have a booking for this event` |
| capacity (`capacity − reserved_seats − booked`) | `This session is full` |

On success: generates `booking_ref` = `{TYPE}-{random6}`, inserts the booking with a JSON `qr_payload`,
then `advanceAndNotify`: auto-advances the stage when `canTransition` allows, via
`STAGE_FOR_TYPE` (`WOC → WOC_BOOKED`, `ACC → ACC_BOOKED`, `EXAM → EXAM_BOOKED`), and enqueues
`seminar_booking_confirmed`.

`cancelBooking({ bookingId, studentId? })`: when `studentId` is supplied the booking must belong to
them (`Booking not found`); sets status `CANCELLED`.

`allocation.service.autoAllocate({ eventId })`: `MANUAL` strategy short-circuits with
`Strategy is manual only`; skips already-booked students; distributes eligible students across
sessions via `pickSession(strategy, ...)` (`LEAST_FILLED` = most seats left, `ROUND_ROBIN` = cursor,
`FIRST_AVAILABLE` = first, `MANUAL` = none); per-student failures are counted as `skipped`.

### 9.6 Student portal — `portal.service.ts`

- `requireStudent(userId)` → `No application is linked to this account`.
- `listMySessions()` eligibility: event `is_open`; programme matches or the event is
  programme-agnostic; `target_stage` gate (student's stage index ≥ target index); registration window
  open; session in the future and open. Events with zero eligible sessions are dropped.
- `getMyApplication()` builds a `progress[]` array over `STAGE_ORDER` with `reached`/`current`/`at`.
- `portal.repo.selectStudentByUser()` **self-heals linkage**: if no student has that `user_id`, it
  looks up the auth user's email and links (`update user_id`) an orphan student row matching by email
  (case-insensitive).

### 9.7 Exams — `exams.service.ts`

- `listExamEvents()` filters `listEvents()` to `EXAM` and attaches the config, defaulting to
  **90 minutes** and the standard Aadhaar instruction text.
- `registerForExam()` delegates to `portal.service.registerForSession` (inheriting every booking rule),
  then issues a hall ticket (`ticketNumber` = `HT-XXXXXXXX`). Errors:
  `No application is linked to this account`, `Exam booking could not be completed`.
- `getHallTicket()`: booking must belong to the caller (`Hall ticket not found`); not cancelled
  (`This registration was cancelled`); must be an EXAM event (`This booking is not an exam`);
  lazily issues the ticket row if missing; `reportingAt = startsAt − 30 minutes`.
- Hall tickets are idempotent/reproducible and cannot be fetched by another student.

### 9.8 Attendance — `attendance.service.ts`

- `listTodaySessions(purpose)`: today's sessions (day bounds) that are `is_open` **and** have a
  `ground_password` set, split by exam vs non-exam. The password is never returned.
- `groundLogin()`: `This session is not available`; `This session belongs to a different day mode`
  (purpose must match `events.event_type`); `No ground password has been set for this session`;
  `Incorrect password` (SHA-256 + timing-safe compare). On success issues a ground access token.
- `scanStudent()` statuses: `UNKNOWN` (bad QR / no student), `ALREADY_PRESENT`, `REGISTERED`
  (exam wording: "hall ticket valid"), `NOT_REGISTERED` (exams only — **walk-ins are never allowed for
  exams**), `SESSION_FULL`, `WALK_IN_AVAILABLE`.
- `markAttendance()`: `Attendance already recorded for this student`; `Student not found`;
  exam sessions require an existing booking (`This candidate has no exam registration`);
  seminar walk-ins blocked when full (`No walk-in seats left`); inserts `attendance` and flips the
  booking to `ATTENDED` when one exists.
- `setGroundPassword()`: generates a random 8-character password from the unambiguous alphabet
  `ABCDEFGHJKMNPQRSTUVWXYZ23456789` when none is supplied.
- `getSessionBoard()`: `Session not found`; returns registered/present/walk-ins/seatsLeft stats.

### 9.9 Chat — `chat.service.ts`

`resolveParty(userId, studentId?)` enforces the pairing:

- caller is a student → must have an assigned counsellor (`No counsellor is assigned to you yet`);
  a mismatched `studentId` → `Forbidden`.
- caller is a counsellor → must pass `studentId` (`Pick a student to open the conversation`);
  the student must be allocated to them (`Forbidden: this student is not allocated to you`).
- neither → `Forbidden: this account has no chat access`.

`sendMessage()` trims and truncates to 2000 chars; empty → `Write a message`.
Admins are **not** participants in private chat.

### 9.10 Counsellor accounts — `accounts.server.ts` / `profile.server.ts`

- `createCounsellorAccount()`: lower-cases the email; existing linked counsellor →
  `A counsellor login already exists for this email.`; creates the Auth user with `email_confirm: true`;
  inserts the `user_roles` row with role `counsellor` (rolling back the auth user on failure);
  links an existing placeholder counsellor row or inserts a new one with
  `is_active: true, must_reset_password: true`.
- `completeFirstLoginReset()`: sets the password through the Auth admin API, maps breached-password
  rejections to `That password appears in known data breaches. Pick a stronger, unique password.`,
  clears `must_reset_password`; `No counsellor profile is linked to this account` if nothing updated.
- `leads.server.logCall()` is **insert-only** — call logs are never updated or deleted.

### 9.11 Notifications — `email.server.ts`

Every module **enqueues**, nothing sends. `enqueueEmail({ studentId?, to, templateKey, subject, payload? })`
inserts a `QUEUED` row; a future worker would drain them. `listEmails(status?)` returns ≤200 rows;
`emailCounts()` returns per-status counts.

---

## 10. Routes: URLs, guards, metadata

### Layout routes

| File | URL prefix | ssr | beforeLoad | Wraps |
| --- | --- | --- | --- | --- |
| `__root.tsx` | — | — | — | QueryClientProvider, error/404 boundaries, base head |
| `_authenticated.tsx` | (pathless) | `false` | no Supabase session → `redirect /auth?redirect=<href>` | `AppShell` → `FirstLoginGate` → `<Outlet/>` |
| `portal.tsx` | `/portal` | `false` | no session → `redirect /auth?redirect=<href>` | `PortalShell` → `StudentPasswordGate` → `<Outlet/>` |

### All routes

| URL | File | Guard | Persona | Purpose |
| --- | --- | --- | --- | --- |
| `/` | `index.tsx` | public, SSR | public | Enquiry/application portal (`ApplicationForm`) |
| `/auth` | `auth.tsx` | public | staff | Staff sign-in + Google OAuth + day-mode entry points |
| `/student-login` | `student-login.tsx` | public | student | Student sign-in |
| `/dashboard` | `_authenticated.dashboard.tsx` | session | all staff | Pipeline KPIs, funnel, lead sources, recent activity |
| `/students` | `_authenticated.students.tsx` | session | all staff | Students registry, filters, CSV export, new application, bulk upload |
| `/my-leads` | `_authenticated.my-leads.tsx` | session | counsellor | Assigned leads, call logging, chat, stage moves |
| `/counsellors` | `_authenticated.counsellors.tsx` | session + `AdminOnly` | admin | Create counsellor logins, directory, drill-down |
| `/lead-assignment` | `_authenticated.lead-assignment.tsx` | session + `AdminOnly` | admin | Assignment engine console (Policies/Pools/Rules/Audit) |
| `/programmes` | `_authenticated.programmes.index.tsx` | session + `AdminOnly` | admin | Programme registry |
| `/programmes/$programmeId` | `_authenticated.programmes.$programmeId.tsx` | session + `AdminOnly` | admin | Programme detail: intake, fill rate, stage breakdown |
| `/seminars` | `_authenticated.seminars.index.tsx` | session + `AdminOnly` | admin | Seminar builder (non-EXAM events) |
| `/seminars/$eventId` | `_authenticated.seminars.$eventId.tsx` | session + `AdminOnly` | admin | Sessions, ground password, live attendance, bookings |
| `/exams` | `_authenticated.exams.tsx` | session + `AdminOnly` | admin | Exam builder (EXAM events, duration + instructions) |
| `/emails` | `_authenticated.emails.tsx` | session + `AdminOnly` | admin | Email queue (read-only) |
| `/reports` | `_authenticated.reports.tsx` | session + `AdminOnly` | admin | Stage distribution + lead-source tables |
| `/settings` | `_authenticated.settings.tsx` | session | all staff | Role badges; counsellor self-profile panel |
| `/portal` | `portal.index.tsx` | session | student | Application summary + bookings |
| `/portal/progress` | `portal.progress.tsx` | session | student | Stage timeline |
| `/portal/counsellor` | `portal.counsellor.tsx` | session | student | Assigned counsellor contact card |
| `/portal/chat` | `portal.chat.tsx` | session | student | Chat with assigned counsellor |
| `/portal/seminars` | `portal.seminars.tsx` | session | student | Eligible seminar sessions + self-registration |
| `/portal/exams` | `portal.exams.tsx` | session | student | Eligible exams + registration + hall-ticket links |
| `/portal/hall-ticket/$bookingId` | `portal.hall-ticket.$bookingId.tsx` | session | student | Hall ticket view, print, PDF download |
| `/portal/qr` | `portal.qr.tsx` | session | student | Static student QR pass |
| `/seminar-day` | `seminar-day.index.tsx` | public, `ssr:false` | ground staff | Pick today's seminar session, name + password |
| `/seminar-day/console` | `seminar-day.console.tsx` | ground token | ground staff | Scan + mark attendance (walk-ins allowed) |
| `/exam-day` | `exam-day.index.tsx` | public, `ssr:false` | ground staff | Pick today's exam session, name + password |
| `/exam-day/console` | `exam-day.console.tsx` | ground token | ground staff | Scan + mark attendance (registration required) |

`AdminOnly` is a **component** gate (renders a "Not available for your role" card), not a route guard;
authoritative enforcement is `requireAdmin` inside every admin server function.

`/auth` sign-in landing logic (`landingPath()` → `getCurrentActor()`):
no roles → `/portal`; counsellor-only → `/my-leads`; otherwise `/dashboard`.
A `redirect` search param is honoured only after `safePath()` confirms it is same-origin.

Each route defines its own `head()` with a unique title/description/OG pair;
`/auth` and `/student-login` additionally set `robots: noindex`.

---

## 11. Components: props, controls, actions

### Layout

| Component | Props | Controls → action |
| --- | --- | --- |
| `AppShell` | `{ children }` | Queries `getCurrentActor` (staleTime 5 min). `handleSignOut`: `cancelQueries()` → `queryClient.clear()` → `supabase.auth.signOut()` → navigate `/auth` (replace) |
| `Sidebar` | `{ roles, onSignOut, onNewApplication }` | Filters `NAV_ITEMS` by role; "New Application" → `onNewApplication`; "Support" mailto; "Logout" → `onSignOut` |
| `TopBar` | `{ name, roles }` | Search input (presentational), notification/help icons (no-op), dark-mode toggle (`documentElement.classList.toggle('dark')`), avatar initials |
| `PortalShell` | `{ children }` | Tab nav: My application / Progress / Counsellor / Chat / Seminars / Exams / My QR; "Sign out" → clear cache + `signOut()` → `/auth` |

### Shared

| Component | Props | Notes |
| --- | --- | --- |
| `AdminOnly` | `{ children }` | Blocks unless `getCurrentActor().isAdmin` |
| `DateTimeField` | `{ label?, value, onChange, id? }` | Date input + **12-hour** time `Select` in 15-minute slots; emits a `datetime-local` string |
| `PageHeader`, `StatCard`, `StageBadge`, `EmptyState` | presentational | |
| `Pagination` | `{ page, pageSize, total, onPageChange }` | page buttons with elision |

### Students

| Component | Controls → action |
| --- | --- |
| `ApplicationForm` (public) | Fields: programme select (auto-fills `course`), fullName, dob, email, phone, password, confirmPassword, parentName, parentPhone, school, leadSource. Submit → `submitApplication` → `supabase.auth.signInWithPassword` → confirmation → navigate `/portal` after 1.2 s. Inline errors + error-count banner |
| `EnquiryForm` (admin dialog) | `enquirySchema` fields incl. `course` from `COURSE_OPTIONS` and `leadSource` from `LEAD_SOURCES`. Submit → `submitEnquiry`; success card with "Submit another enquiry" |
| `StudentTable` | `{ rows, loading, selected, onToggle, onToggleAll, onOpen }` — row checkbox; row click opens the detail drawer |
| `StudentFilters` | `{ filters, counsellors, onChange, onExport }` — search input, stage select, counsellor select, "Clear", "Export CSV" (client-side blob of the current page) |
| `StudentDetailDrawer` | `{ studentId, onClose }` — queries `getStudentDetailFn`; **Auto-assign / Reassign** → `runAssignmentFn`; stage-advance buttons from `nextStages()` → `moveStudentStage`; read-only assignment history, bookings, audit timeline |
| `BulkUploadPanel` | Step 1: "CSV template" / "XLSX template (with dropdowns)" → `downloadTemplate()`. Step 2: file input → `parseUpload()` + per-row `bulkRowSchema` validation. Step 3: preview table → "Confirm import of N student(s)" → `bulkImportStudents` → `BulkResultTable` |
| `BulkResultTable` | "Copy credentials" (clipboard), "Download CSV" (generated passwords), "Import another file" |

### Counsellors

| Component | Controls → action |
| --- | --- |
| `CounsellorCreateForm` | email + temp password → `createCounsellorAccountFn`, toast, invalidates `counsellors` |
| `CounsellorList` | `{ onSelect }` — row click / Enter → `onSelect(id)` |
| `CounsellorDetailDrawer` | `{ counsellorId, onClose }` — read-only allocated students (with stage badges) + call logs |
| `CounsellorProfilePanel` | fullName, phone, maxActiveLeads → `updateMyCounsellorFn` |
| `FirstLoginGate` | blocks the staff shell when `must_reset_password`; password + confirm → `completeFirstLoginResetFn` → `supabase.auth.refreshSession()` |
| `StudentPasswordGate` | blocks the portal when `user_metadata.must_reset_password`; → `supabase.auth.updateUser({ password, data: { must_reset_password: false } })` |

### Assignment engine

| Component | Controls → action |
| --- | --- |
| `PolicyPanel` | "Create policy" (name, type, fallback algorithm, default pool) → `createPolicyFn`; per policy: Publish/Unpublish → `publishPolicyFn` (toast reports auto-assigned count), Enabled switch → `togglePolicyFn`, inline type/algorithm/pool selects + Auto-assign switch → `updatePolicyFn` |
| `PoolPanel` | "Create pool" (name, algorithm, member checkboxes) → `savePoolFn`; membership checkboxes on existing pools → `savePoolFn` |
| `RulePanel` | "Add rule" (policy, programme, pool, algorithm, priority) → `saveRuleFn`; row trash icon → `deleteRuleFn` |
| `AssignmentLog` | read-only audit table (last 30) |
| Page header | "Run engine on queue" → `runEngineQueueFn`, toast `Assigned X of Y`, invalidates `engine-console` + `students` |

### Events / exams

| Component | Controls → action |
| --- | --- |
| `EventForm` | `{ onDone, lockedType? }`. Fields: title, type (locked to EXAM on the exams page), programme select, target-stage select, publish-now select, EXAM-only duration + instructions, dynamic session rows (start/end `DateTimeField`, capacity, venue select) with "Add session". Submit → `saveEventFn`, then `saveSessionFn` per session, then `saveExamConfigFn` when EXAM. Disabled until the title is ≥3 chars and every session has start, end and venue |
| `SessionAttendancePanel` | `{ sessionId, groundPassword }` — "Generate/Regenerate" → `setGroundPasswordFn`; "View/Hide" reveals it; read-only registered/present lists and stats |
| Seminar/exam cards | Publish/Unpublish toggle → `publishEventFn`; "Manage"/"Sessions, password & attendance" → `/seminars/$eventId` |

### Attendance / ground console

| Component | Controls → action |
| --- | --- |
| `GroundLogin` | `{ purpose, consolePath }` — queries `listTodaySessionsFn`; select a session card, enter staff name + password, "Enter check-in console" → `groundLoginFn` → store token in `localStorage[GROUND_TOKEN_KEY]` → navigate to the console |
| `GroundConsole` | `{ loginPath }` — reads the token; stat cards from `groundBoardFn`; "Start/Stop camera" toggles `QrScanner`; decode → `groundScanFn`; result card "Mark attendance" / "Mark walk-in attendance" → `groundMarkAttendanceFn`; "Clear" resets the scan; "Exit" → `groundSignOutFn` + clear token + back to `loginPath`. Expired/invalid tokens clear local state and return to login |
| `QrScanner` | `{ active, onResult }` — lazy-loads `html5-qrcode`, calls `onResult(decodedText)` |

### Chat

| Component | Controls → action |
| --- | --- |
| `ChatThread` | `{ studentId? }` (omitted = the student's own thread). Polls `getChatThreadFn` every 15 s; textarea (max 2000) + "Send" (disabled while empty/pending) → `sendChatMessageFn`, invalidates the thread and the unread count |

Counsellor unread badges come from `listChatUnreadFn`, polled every 30 s on `/my-leads`.

### Programmes / portal

| Component | Controls → action |
| --- | --- |
| `ProgrammeForm` | code, name, department, intake, academic year, duration, applications open/close (`DateTimeField`), status, description → `saveProgrammeFn` |
| `ProgrammeTable` | rows link to `/programmes/$programmeId`; fill-rate bars and status badges |
| `ProgressTimeline` | `{ steps }` — read-only stage stepper |
| Portal seminar/exam cards | "Register" (label switches to Full / waitlist / Already booked) → `registerForSessionFn` / `registerForExamFn` |
| Hall-ticket page | "Print" → `window.print()`; "Download PDF" → `downloadHallTicketPdf()`; renders `QRCodeSVG` of `qrPayload` |

---

## 12. Shared libraries & helpers

### `src/lib/qr.ts` — the static QR contract

```ts
QR_PREFIX = "ADMOS1"
buildStudentQrPayload(id, name) => `ADMOS1|<student uuid>|<student name>`
parseStudentQrPayload(raw)      => accepts a bare UUID or the prefixed payload
```

**Invariant:** the student QR is *static and deterministic* — no timestamps, nonces or expiring
attendance tokens are ever embedded. The same student always renders the same code, so it can be
screenshotted and reused. Expiry lives in the ground-staff session, never in the QR.

### `src/lib/hall-ticket-pdf.ts`

`downloadHallTicketPdf(data)` builds an A4 `jsPDF` document, embeds a `qrcode`-generated PNG of
`qrPayload`, prints candidate name, student code, student UUID, exam date, venue, 12-hour start time,
reporting time (−30 min), duration and the Aadhaar + hall-ticket instruction, then saves as
`hall-ticket-<studentCode>.pdf`.

### `src/lib/bulk-upload.ts`

- `downloadTemplate(format, programmeCodes)`:
  - **CSV** via `xlsx` (`aoa_to_sheet` → `sheet_to_csv`) — deliberately plain; CSV cannot carry validation.
  - **XLSX** via `exceljs` with a **hidden "Lists" sheet** feeding real dropdown data validation for
    `programme_code` and `lead_source`. The hidden-sheet approach exists specifically to dodge Excel's
    255-character inline validation-list limit, which the programme list exceeds.
- `parseUpload(file)`: reads CSV/XLSX through `xlsx.read`, normalises headers to `snake_case`, strips
  template header/sample rows, validates each row against `bulkRowSchema`, returns `ParsedRow[]` with
  per-row errors.

### `src/lib/datetime.ts` — 12-hour time everywhere

`formatTime`, `formatDate`, `formatDateTime`, `formatTimeRange`, plus `datetime-local` helpers
`localNowInput`, `splitLocalInput`, `joinLocalInput`, `label12h`, `timeSlots(stepMinutes)`.
**No 24-hour display exists anywhere in the UI**; all time entry uses pickers, never free text.

### Others

- `src/lib/error-capture.ts` / `error-page.ts` — SSR error capture + static HTML fallback page.
- `src/lib/utils.ts` — `cn()` = `twMerge(clsx(...))`.
- `src/hooks/use-session.ts` — `{ session, loading }` from `onAuthStateChange`; currently unused
  (routes use `beforeLoad` + `getCurrentActor`).
- `src/hooks/use-mobile.tsx` — `useIsMobile()`, 768 px breakpoint (consumed by the shadcn sidebar primitive).

---

## 13. Persona flows end to end

### 13.1 Public applicant → student

1. Visits `/`, fills `ApplicationForm` (programme, personal details, parent details, email, password).
2. `submitApplication` → creates the Auth user, inserts the student (`stage: NEW`, `student_code`
   auto-generated `STU-YYYY-####`), writes the `NEW` audit event, enqueues `application_received`,
   and runs the assignment engine immediately.
3. The form signs the applicant in and redirects to `/portal` after 1.2 s.
4. Returning students sign in at `/student-login`.

### 13.2 Student portal

| Step | Screen | Action |
| --- | --- | --- |
| 1 | `/portal` | Application summary, programme, stage badge, bookings |
| 2 | `/portal/progress` | 9-stage timeline with reached/current markers |
| 3 | `/portal/counsellor` | Assigned counsellor name/email/phone, or "being assigned" |
| 4 | `/portal/chat` | 1:1 thread with the assigned counsellor (polled every 15 s) |
| 5 | `/portal/seminars` | Eligible published sessions → **Register** → booking ref + stage auto-advance |
| 6 | `/portal/exams` | Eligible exams → **Register** → hall ticket issued |
| 7 | `/portal/hall-ticket/$bookingId` | View, **Print**, **Download PDF** |
| 8 | `/portal/qr` | Static `ADMOS1|uuid|name` pass shown at the venue |

Bulk-imported students hit `StudentPasswordGate` on first sign-in and must set a new password.

### 13.3 Admissions Admin / Super Admin

1. `/auth` → sign in → `/dashboard` (KPIs, funnel, lead sources, recent activity).
2. `/programmes` → **New Programme** → set intake, application window, status `OPEN`
   (OPEN programmes become publicly readable by `anon` and appear in the application form).
3. `/counsellors` → create counsellor logins (email + temporary password → `must_reset_password: true`);
   select a counsellor to inspect allocated students, their stages and every call log.
4. `/lead-assignment` → build pools → build a policy (type, fallback algorithm, default pool,
   auto-assign) → add programme rules → **Publish** (auto-runs a catch-up pass) →
   **Run engine on queue** on demand; audit log shows every decision.
5. `/seminars` → **New Event** → sessions with 12-hour pickers, venue, capacity → **Publish**.
6. `/seminars/$eventId` → **Generate ground password** per session; watch live attendance;
   read the booking list.
7. `/exams` → **New exam** (`lockedType="EXAM"`) → duration + instructions + sessions → **Publish**;
   session management reuses the seminar detail page.
8. `/students` → registry with search/stage/counsellor filters, CSV export, **New Application**,
   **Bulk upload** (template → preview → import → generated credentials to hand out);
   the detail drawer allows manual auto-assign/reassign and single-step stage moves.
9. `/emails` and `/reports` → read-only queue and distribution tables.

### 13.4 Counsellor

1. Admin hands over the email + temporary password → sign in at `/auth`.
2. `FirstLoginGate` blocks everything until a new password is set
   (breached passwords are rejected with a clear message).
3. `/my-leads` shows only allocated students. Per lead:
   - **Log call** → date/time picker, outcome, notes → saved permanently (never editable).
   - **Chat** → thread with unread badge.
   - Stage buttons → single-step forward moves.
4. `/settings` → edit own name, phone and `maxActiveLeads` (which feeds the assignment algorithms).
5. `/students` is visible, but reads are scoped by `studentScope`/RLS to their own allocations.

### 13.5 Ground staff (seminar day)

1. Admin generates the session ground password.
2. Staff open `/seminar-day` on any phone → today's open sessions with a password are listed
   (venue, time, capacity) → pick one → enter name + password.
3. `groundLoginFn` mints an opaque 12-hour token stored in `localStorage`; multiple devices can log
   into the same session simultaneously.
4. `/seminar-day/console`: **Start camera** → scan the student's static QR:
   - registered → green "Mark attendance"
   - not registered → walk-in check: seats available → "Mark walk-in attendance"; otherwise blocked
   - already present → blocked with a clear message
5. Every mark writes `attendance` (unique per session+student) and flips the booking to `ATTENDED`.
6. **Exit** revokes the token server-side and clears local state.

### 13.6 Ground staff (exam day)

Identical to 13.5 via `/exam-day`, with two differences enforced server-side:
the purpose must match `event_type = 'EXAM'` (`This session belongs to a different day mode`), and
**walk-ins are disabled** — an unregistered candidate returns `NOT_REGISTERED` and
`This candidate has no exam registration`, because an exam requires a hall ticket.

---

## 14. Inter-persona CRUD matrix

Legend: **C** create · **R** read · **U** update · **D** delete · **—** no access · *(own)* scoped to self/allocation.

| Entity | Super/Admissions Admin | Counsellor | Ground staff | Student | Public (anon) |
| --- | --- | --- | --- | --- | --- |
| `programmes` | C R U D | R | R | R (via application form) | R (`status = OPEN`) |
| `academic_years`, `venues` | C R U D | R | R | — | — |
| `students` | C R U D (all) | R U *(own allocations)* | R (via `ground_admin` role) | R *(own)* | C (application/enquiry only) |
| `student_events` | R (all) | R *(own allocations)* | — | R *(own)* | — |
| `call_logs` | C R (all) | C R *(own)* — never U/D | — | — | — |
| `counsellors` | C R U D | R, U *(own profile)* | R | R *(assigned one, via portal fn)* | — |
| `user_roles` | R (all) — writes via service role | R *(own)* | R *(own)* | R *(own)* | — |
| `counsellor_pools`, `pool_members` | C R U D | R | R | — | — |
| `assignment_policies` / `rules` | C R U D | R | R | — | — |
| `assignments` (audit) | C R (append-only) | R | — | — | — |
| `events`, `event_sessions` | C R U D | R | R (via ground token) | R *(eligible published)* | — |
| `seminar_bookings` | C R U D | R | R U *(ground role)* | C R U *(own)* | — |
| `attendance` | C R (all) | R | C R *(via ground token)* | — | — |
| `hall_tickets` | R (all) | — | — | R *(own)* | — |
| `exam_configs` | C R U D | R | R | R (via hall ticket) | — |
| `student_messages` | — (admins are excluded from private chat) | C R U *(own allocations)* | — | C R U *(own thread)* | — |
| `email_queue` | C R U | — | — | — | — |
| `ground_access_sessions` | R (admin policy) | — | write via service role only | — | — |
| `profiles` | R (all), U *(own)* | R U *(own)* | R U *(own)* | R U *(own)* | — |

---

## 15. Invariants that must not be broken when porting

1. **Roles live only in `user_roles`.** Never store a role on `profiles`, `students` or `counsellors`.
   All role checks go through the SECURITY DEFINER functions `has_role` / `is_admin`.
2. **Stage moves are single-step and audited.** Only `transitionStage()` writes `students.stage`,
   and it always appends a `student_events` row.
3. **Call logs are append-only.** `UPDATE`/`DELETE` are revoked from `authenticated`.
4. **`assignments` is an append-only decision log** — a row is written for hits *and* misses.
5. **At most one published assignment policy** (`assignment_policies_single_published`).
6. **One live booking per student per event** (`seminar_bookings_student_event_key`).
7. **No double check-in** (`attendance` unique on `(session_id, student_id)`).
8. **The student QR is static.** `ADMOS1|<uuid>|<name>` — never embed expiring tokens.
9. **Ground access is a DB-backed opaque token**, hashed at rest, 12-hour TTL, `localStorage`-held,
   device-independent, no shared signing secret, no cookie dependency.
10. **Exams never accept walk-ins.** Seminars do, subject to remaining seats.
11. **All times are 12-hour AM/PM and entered via pickers.** No 24-hour display, no free-text time.
12. **Every `CREATE TABLE` in `public` must be followed by GRANTs** in the same migration, then
    `ENABLE ROW LEVEL SECURITY`, then policies — in that order.
13. **Never import `supabaseAdmin`, `*.server.ts`, `*.service.ts` or `*.repo.ts` at the module scope of
    a `*.functions.ts` file.** Use `await import()` inside the handler.
14. **`requireSupabaseAuth` functions must never be called from a public route loader** — prerender has
    no session and will 401 the build.
15. **Reporting time is always `startsAt − 30 minutes`; the default exam duration is 90 minutes.**
16. **Email is enqueued, never sent inline.**
17. **Emails are lower-cased before every auth/user lookup.**
18. **Auth-user creation rolls back** if the dependent DB insert fails (no orphan logins).

---

## 16. Porting guide

### 16.1 Bring the database over

Apply `supabase/migrations/*.sql` **in filename order** to the target Supabase project. They are
idempotent-friendly (`IF NOT EXISTS` on later objects) but must run in sequence because later files
alter earlier tables. Then regenerate `src/integrations/supabase/types.ts` against the new project.

Post-migration checklist:

- confirm the 13 enums exist;
- confirm `has_role`, `is_admin`, `current_counsellor_id`, `current_student_id` exist and are
  SECURITY DEFINER with `search_path = public`;
- confirm `anon` has `SELECT` on `programmes` only;
- seed at least one `academic_years` row, one `venues` row, one `OPEN` programme, one counsellor pool
  and one published assignment policy — otherwise the engine reports
  `No assignment policy is enabled` and the public form has nothing to select.

### 16.2 Bring the server layer over

Copy `src/domains/**` wholesale — it is framework-light. Each domain is self-contained apart from
these deliberate cross-domain imports:

```text
students.applications.server → assignment.service (resolveAssignment)
students.bulk.server         → assignment.service
students.detail.server       → assignment.policies.repo, portal.repo
portal.service               → events.service (bookSession, cancelBooking)
exams.service                → portal.service, events.service
events.service               → students.server (transitionStage), notifications.email.server
attendance.service           → lib/qr (parseStudentQrPayload)
every *.functions.ts         → users/access.server (requireAdmin / requireStaff / studentScope)
```

If the target portal is not TanStack Start, replace only the `*.functions.ts` layer with the target's
controller idiom (Next server actions, Nest controllers, Laravel controllers, tRPC procedures…).
Keep the zod schemas, the middleware→`{ supabase, userId }` contract, the service/repo files and the
error strings byte-for-byte, and behaviour is preserved.

### 16.3 Bring the frontend over

- `src/components/**`, `src/lib/**`, `src/hooks/**` and `src/config/constants.ts` are framework-agnostic
  React apart from `@tanstack/react-router` `Link`/`useNavigate` imports — swap those for the target
  router's equivalents.
- Routes map 1:1 to the table in §10. Preserve the URL strings; they are referenced by
  `landingPath()`, the sidebar `NAV_ITEMS` union type, hall-ticket links and the ground consoles.
- Preserve the three gates: `_authenticated` session redirect, `FirstLoginGate`,
  `StudentPasswordGate` — plus the `AdminOnly` component gate.
- Keep the two client middlewares wired: bearer-token attachment on every RPC and CSRF on server-fn calls.

### 16.4 Verification script after porting

1. Public application at `/` → student row created, `student_code` generated, counsellor auto-assigned.
2. Student signs in → `/portal` → `/portal/qr` loads after a hard refresh.
3. Admin creates a programme (`OPEN`) → it appears in the public form.
4. Admin creates a counsellor → counsellor signs in → forced password reset succeeds.
5. Admin builds a pool + policy → publishes → the catch-up pass assigns the queue.
6. Counsellor logs a call → the log is immutable; advances a stage → audit row appears.
7. Chat both directions; an unrelated account is rejected with `Forbidden`.
8. Admin publishes a seminar → student registers → booking ref issued and stage advances.
9. Admin generates a ground password → two separate devices log in to the same session →
   both scan and mark attendance → no duplicates.
10. Admin publishes an exam → student registers → hall ticket PDF downloads with QR, reporting time
    and instructions → exam-day console marks the candidate present → walk-in is refused.
11. Download the XLSX template in Excel → dropdowns present → import a valid row → credentials shown.

---

## 17. Known gaps & open items

These are recorded as facts about the current codebase, not recommendations to change behaviour.

1. **`ground_access_sessions` privileges** — the table has an admin `SELECT` RLS policy but no
   `GRANT SELECT TO authenticated`. In practice the table is written and read exclusively through
   `service_role` in `ground.access.server.ts`, so the policy is currently unreachable.
2. **Duplicate index on `attendance`** — the unique partial index on `(session_id, student_id)` was
   created twice under two names (`attendance_unique_session_student`, `idx_attendance_session_student`).
   Harmless, redundant.
3. **`event_sessions.ground_password` is readable** by any authenticated user under the permissive
   `sessions_read` policy (no column-level RLS). The application layer never exposes it outside the
   admin panel, but a direct PostgREST read would see it.
4. **`student_events` has no INSERT RLS policy** despite `GRANT INSERT TO authenticated`; all inserts
   go through `supabaseAdmin` (service role) in the service layer.
5. **`student_messages` UPDATE policy is not column-restricted** — either party could technically
   update columns other than `read_at` via a direct API call; the app only writes `read_at`.
6. **No rate limiting** on the public endpoints (`submitEnquiry`, `submitApplication`,
   `listOpenProgrammesFn`, and the ground-staff endpoints) beyond zod validation and CSRF middleware.
7. **Legacy tables retained** — `seminars`, `exams`, `exam_rooms`, `exam_seats` and the nullable
   `seminar_id`/`exam_id` FKs are superseded by `events`/`event_sessions` but were kept so existing
   rows and the `getExams` legacy function keep working.
8. **`src/hooks/use-session.ts` is currently unused** — routes rely on `beforeLoad` + `getCurrentActor`.
9. **Email delivery is simulated** — `email_queue` is never drained; a worker would need to be added.
10. **No student impersonation** — staff cannot open a student portal; admins inspect students through
    the registry drawer instead.
