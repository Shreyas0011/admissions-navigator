# Wire the three engines to UI, add the student portal, then test end-to-end

Current state (verified): the programme and assignment engine layers exist as repo/service/schema only — there are no server functions and no routes for them. The seminars page still reads the legacy seminar tables, not the new events/sessions model. So the requested walkthrough cannot be tested yet; this plan wires the missing controller + UI layers first, then gives the test script.

## What gets built

### 1. Course (Programme) Management
- `programmes.functions.ts` controller: list, get, create, update, open/close applications.
- Routes: `/programmes` (registry table: code, name, department, intake, applications, fill rate, status) and `/programmes/$programmeId` (detail with tabs: Overview, Applicants, Events, Assignment rules).
- Components under `src/components/programmes/`: `ProgrammeTable`, `ProgrammeForm`, `ProgrammeFilters`, `ProgrammeStats`, `ProgrammeDetailTabs` — each under 200 LOC, exported via an index barrel.

### 2. Lead Assignment Engine
- `assignment.functions.ts` controller: list/create/update policies, rules, pools and pool members; run assignment for a student; fetch assignment audit trail.
- Route `/lead-assignment` rebuilt as an engine console with three tabs: Policies (type, algorithm, auto-assign toggle, priority), Pools (members, workload), Rules (programme -> pool -> algorithm).
- Student drawer gains "Auto-assign" and "Reassign" actions calling the engine, plus an assignment history list showing algorithm, rule used and candidates considered.

### 3. Seminar / Event Builder
- `events.functions.ts` rewritten on the events + event_sessions + venues model: list events, create event, add sessions, open/close registration, book a student into a session, list bookings, attendance scan.
- Route `/seminars` becomes the builder: event list plus a wizard (Event details -> Sessions & venues -> Allocation strategy & capacity -> Publish).
- `/seminars/$eventId` shows sessions, seat usage, bookings and auto-allocation controls.
- Auto-allocation service applies the event's strategy (FIRST_AVAILABLE, LEAST_FILLED, ROUND_ROBIN) across eligible students of the event's programme, respecting capacity, waitlist and target stage, and advances stages + queues emails.

### 4. Counsellor portal
- Route `/my-leads` for the counsellor role: leads assigned to the signed-in counsellor, call logging, stage advance, and booking a student into a seminar session.
- Sidebar becomes role-aware: admins see Programmes / Lead Assignment / Seminars / Exams / Emails / Reports / Settings; counsellors see Dashboard / My Leads / Seminars.

### 5. Student accounts and self-service portal (new)
- **Application creates an account.** The public application form gains email + password (with confirm). Submitting creates the auth user and the student record in one server-side flow, links `students.user_id` to the new auth user, and returns the STU-2026-XXXX reference. Duplicate email is rejected with a clear "already applied — sign in instead" message.
- **Student sign-in** at `/auth` (same page, student vs staff resolved by role) landing on `/portal`.
- **Portal routes** under a student-gated layout:
  - `/portal` — application summary: programme applied to, reference code, current stage.
  - `/portal/progress` — phase-wise admission progress timeline (NEW -> ASSIGNED -> CONTACTED -> WOC -> ACC -> EXAM -> HALL TICKET) driven by `student_events`.
  - `/portal/counsellor` — assigned counsellor name and contact (shown as "being assigned" until the engine runs).
  - `/portal/seminars` — published events for the student's programme, only sessions that are open, in the future, within the registration window, matching the event's target stage, and with seats left; student self-registers, gets booking ref + QR, seat count increments, stage advances, confirmation email queued. Waitlist offered when full and enabled. Cancel allowed within the event's cancellation cutoff.
  - `/portal/exams` — placeholder tab wired to the same layout, showing "exam registration opens soon" (full exam engine deferred).
- **Self-registration is the default path.** Admin/counsellor booking and auto-allocation stay as overrides for the same session capacity, sharing one booking service so capacity can never be oversold.
- **Admin student detail** — selecting a student in `/students` opens a detail view showing the programme applied to, phase-wise progress timeline, assigned counsellor, and seminar bookings.

## Technical notes
- Layering kept strict: route -> `*.functions.ts` (controller, `createServerFn` + zod) -> `*.service.ts` -> `*.repo.ts`. Routes never touch Supabase directly.
- Protected server functions use `requireSupabaseAuth`; all reads through TanStack Query (`ensureQueryData` in loaders under `_authenticated`, `useSuspenseQuery` in components).
- Every new file stays under 200 LOC with single barrel imports/exports per feature folder.
- One migration is required for the student portal: add `students.user_id` (FK to auth users, unique), a `student` value in the app role enum, and RLS/grants so a student can read only their own student row, events/sessions for their programme, and their own bookings. Booking writes stay in a server function that enforces capacity in a single transaction.
- Signup for applicants uses email/password with auto-confirm so the applicant is signed in immediately after applying (staff sign-in is unchanged, including Google).

## Test script (after the build)

1. **Admin login** — sign in at `/auth` with Google as shreyas.777999@gmail.com (already super_admin). Full sidebar should render.
2. **Course configuration** — `/programmes` -> New Programme: code, name, department, academic year, intake, application window -> save -> status Open. Confirm it appears in the registry with 0 applications.
3. **Student application** — incognito tab -> `/` application form -> pick the new programme, fill details, set email + password -> submit -> note the STU-2026-XXXX reference and confirm you land in `/portal` signed in.
4. **Assignment engine config** — back as admin, `/lead-assignment`: create a pool, add 2-3 counsellors, create a policy (e.g. LEAST_WORKLOAD, auto-assign on), add a rule mapping the new programme to that pool.
5. **Auto-assign the lead** — `/students`, open the new applicant -> Auto-assign. Verify the chosen counsellor and that history shows algorithm, rule and candidate list. Reassign manually and confirm a second MANUAL audit row.
6. **Admin student detail** — in the same view confirm programme applied to, phase-wise progress and assigned counsellor are all visible.
7. **Counsellor portal** — sign in as a counsellor -> `/my-leads` shows only their leads -> log a call -> advance stage to CONTACTED.
8. **Seminar builder** — as admin, `/seminars` -> New Event: type WOC, link the programme, target stage CONTACTED -> two sessions with venues and capacities -> allocation strategy LEAST_FILLED -> publish.
9. **Student self-registration** — back in the student portal -> `/portal/seminars` shows only the published sessions they are eligible for -> register for one. Confirm booking ref + QR appear, seat count increments, stage moves to WOC_BOOKED on `/portal/progress`, and an email row appears in admin `/emails`. Fill a session to capacity and confirm it shows Full / waitlist instead of Register.
10. **Auto allocation** — on the event page, run Auto-allocate for the remaining eligible CONTACTED students: distribution follows the strategy, capacity respected (already self-registered students are not double-booked), overflow waitlisted.
11. **Exam tab** — `/portal/exams` renders the placeholder without errors.
12. **Dashboard check** — `/dashboard` funnel and recent activity reflect the new programme, assignments and bookings.
