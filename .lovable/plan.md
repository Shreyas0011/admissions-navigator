# Admissions OS — Phase 1 Foundation

Building on TanStack Start v1 + React 19 + Tailwind v4 + Lovable Cloud (Postgres), per your README stack. This turn delivers the **foundation** — everything Modules 3-12 will plug into — plus the first real screen (Students Registry, matching your reference layout).

## What gets built now

**1. Data model + state machine**
All Phase 1 tables in one migration, so no module needs a schema redesign later:

```text
profiles              counsellors         seminars (type: WOC | ACC)
user_roles            students            seminar_bookings
                      student_events      attendance
                      call_logs           exams / exam_rooms / exam_seats
                      email_queue         hall_tickets / documents
```

`admission_stage` enum drives everything:
`NEW → ASSIGNED → CONTACTED → WOC_BOOKED → WOC_ATTENDED → ACC_BOOKED → ACC_ATTENDED → EXAM_BOOKED → HALL_TICKET_GENERATED`

Stage changes never happen by raw UPDATE from the UI — they go through one transition action that validates the move and writes a row to `student_events` (immutable audit trail). Student IDs are generated server-side as `STU-2026-0001`.

**2. Roles & access**
Separate `user_roles` table + `has_role()` security-definer function (never roles on the profile — that's a privilege-escalation hole). Roles: `super_admin`, `admissions_admin`, `counsellor`, `ground_admin`. RLS on every table: counsellors see only their assigned students; ground admins see only attendance surfaces; admins see all. Auth screen at `/auth`, protected app under `_authenticated`.

**3. Design system from your DESIGN.md**
Luminous Enterprise tokens ported into `src/styles.css` as semantic tokens (primary `#3525cd`, surface scale, Inter type scale, radius/spacing scale). No hardcoded colors in components — everything themed.

**4. App shell**
Dark navy fixed sidebar + top bar with search, exactly as your screenshot: Dashboard, Students, Lead Assignment, Seminars, Exams, Emails, Reports, Settings; "New Application" CTA, Support/Logout footer. Nav items filter by role.

**5. Students Registry (`/students`)**
The screen from your reference: KPI cards (Total Active, WOC Pending), filter bar (status, counsellor, date range, more filters, export, print, Add Student), and the table with Student ID / Details / Parent / Contact / Stage pill / Counsellor / Actions. Server-side filtering, sorting, and cursor-friendly pagination — not a client-side array filter.

**6. Public Inquiry Portal (Module 1) at `/`**
The one module that's part of the foundation because it's the data entry point: enquiry form (name, DOB, school, grade/course, parent details, email, phone, lead source) → Zod-validated server function → student created at `NEW` → welcome email enqueued.

**7. Email as a queue (your choice)**
`email_queue` table with template key, payload, status, attempts. Every module enqueues instead of sending. An admin `/emails` screen renders the queue with a preview. Swapping in a real provider later is one worker function — no call-site changes.

## Architecture

Mapping your Laravel `Domains/` + feature-folder frontend onto this stack:

```text
src/
├── routes/                        # thin: 3-15 lines, import a feature shell
│   ├── index.tsx                  # public enquiry portal
│   ├── auth.tsx
│   └── _authenticated/
│       ├── route.tsx              # role gate + AppShell
│       ├── dashboard.tsx  students.tsx  students.$id.tsx
│       └── emails.tsx  settings.tsx
│
├── domains/                       # ← your app/Domains/
│   ├── students/   { .functions.ts, .server.ts, schema.ts, types.ts }
│   ├── counsellors/  seminars/  attendance/  exams/
│   ├── halltickets/  notifications/  admissions/   # state machine lives here
│   └── users/
│
├── components/
│   ├── layout/      AppShell, Sidebar, TopBar
│   ├── students/    index.ts barrel + StudentsRegistry, StudentTable, FilterBar, StageBadge…
│   ├── shared/      StatCard, DataTable, EmptyState, Pagination
│   └── ui/          shadcn primitives
│
├── config/constants.ts            # NAV_ITEMS, STAGES, LEAD_SOURCES, ROLES
└── lib/
```

Rules enforced: each domain folder exposes `*.functions.ts` (thin `createServerFn` wrappers, declarations only) and `*.server.ts` (all helpers, queries, admin client). Feature folders have `index.ts` barrels; pages import `@/components/students`, never deep paths. Constants and static copy live in `config/`, never inline in UI.

## Technical notes

- Reads follow the loader `ensureQueryData` + `useSuspenseQuery` pattern; mutations use `useMutation` + targeted invalidation.
- Every `CREATE TABLE` in the migration is followed by explicit `GRANT`s, then RLS, then policies.
- Demo seed data (≈40 students spread across stages, 4 counsellors, 2 seminars) ships as literal `INSERT`s in the migration so the registry is populated on first load.
- QR (`qrcode`) and scanning (`html5-qrcode`) get installed when Modules 8-9 land, not now.

## Next turns (in order)

1. Modules 3-4 — Counsellor management, lead assignment, counsellor dashboard, call logging, "Call Completed" → email trigger
2. Modules 6-9 — Seminar admin (WOC), booking with capacity check, QR ticket PDF, camera attendance scanner
3. Module 10 — ACC reusing the same seminar engine
4. Modules 11-12 — Exam admin, seat assignment, hall ticket PDF with QR
5. Admin dashboard, reports, settings polish

Say the word and I'll start with the migration and design system.