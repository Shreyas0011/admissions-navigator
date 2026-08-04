# Wire the three engines to UI, then test end-to-end

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

## Technical notes
- Layering kept strict: route -> `*.functions.ts` (controller, `createServerFn` + zod) -> `*.service.ts` -> `*.repo.ts`. Routes never touch Supabase directly.
- Protected server functions use `requireSupabaseAuth`; all reads through TanStack Query (`ensureQueryData` in loaders under `_authenticated`, `useSuspenseQuery` in components).
- Every new file stays under 200 LOC with single barrel imports/exports per feature folder.
- No schema change is expected; the tables (programmes, counsellor_pools, assignment_policies/rules, assignments, events, event_sessions, venues, seminar_bookings, attendance) already exist.

## Test script (after the build)

1. **Admin login** — sign in at `/auth` with Google as shreyas.777999@gmail.com (already super_admin). Full sidebar should render.
2. **Course configuration** — `/programmes` -> New Programme: code, name, department, academic year, intake, application window -> save -> status Open. Confirm it appears in the registry with 0 applications.
3. **Student application** — sign out (or open an incognito tab) -> `/` public enquiry form -> pick the new programme -> submit -> note the STU-2026-XXXX reference.
4. **Assignment engine config** — back as admin, `/lead-assignment`: create a pool, add 2-3 counsellors, create a policy (e.g. LEAST_WORKLOAD, auto-assign on), add a rule mapping the new programme to that pool.
5. **Auto-assign the lead** — `/students`, open the new enquiry -> Auto-assign. Verify the chosen counsellor, and that the history shows algorithm, rule and candidate list. Reassign manually and confirm a second MANUAL audit row.
6. **Counsellor portal** — sign in as a counsellor account -> `/my-leads` shows only their leads -> log a call -> advance stage to CONTACTED.
7. **Seminar builder** — as admin, `/seminars` -> New Event: type WOC, link the programme, target stage CONTACTED -> add two sessions with venues and capacities -> allocation strategy LEAST_FILLED -> publish.
8. **Seminar registration** — from the counsellor portal (or the student drawer), book the student into a session. Confirm booking ref + QR, seat count increments, stage moves to WOC_BOOKED, and an email row appears in `/emails`.
9. **Auto allocation** — on the event page, run Auto-allocate: all eligible CONTACTED students of that programme get distributed by the strategy, capacity respected, overflow waitlisted. Verify session seat counts and the bookings list.
10. **Dashboard check** — `/dashboard` funnel and recent activity reflect the new programme, assignments and bookings.
