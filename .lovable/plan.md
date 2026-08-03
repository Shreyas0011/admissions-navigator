# Programme-Centric Refactor + Two Engines

Confirmed current state: `students.course` is free text, `seminars.venue` is free text with a single embedded date/capacity, counsellor assignment is a manual `counsellor_id` write in `students.server.ts`, and there is no programme, venue, pool, or policy table. Everything below is additive schema plus a re-point of existing reads — no data loss.

## 1. Domain shift: Programme as aggregate root

New tables (one migration, with GRANTs → RLS → policies, admin-write / staff-read):

```text
academic_years      programmes (code, name, department, year, intake, duration,
                                status, applications_open_at, applications_close_at)
venues (campus, building, floor, room, capacity, facilities, priority, is_active)
counsellor_pools    counsellor_pool_members
assignment_policies (type, enabled, priority, fallback, auto_assign)
assignment_rules    (condition_programme_id, target_pool_id, algorithm)
assignments         (student, counsellor, rule, algorithm, candidates, source, actor)
events              (programme scope, type WOC|ACC|EXAM|OTHER, registration rules)
event_sessions      (starts_at, ends_at, venue_id, capacity, reserved, allocation_strategy)
```

Changes to existing tables:
- `students.programme_id` (FK, nullable during backfill) alongside the existing `course` text, which becomes display-only legacy. Backfill by matching seeded course names to seeded programmes.
- `seminars` / `seminar_bookings` / `attendance` / `exams`: add `programme_id`; bookings gain `session_id`. Existing `seminars` rows are migrated into `events` + one `event_sessions` row each, so today's screens keep working.

Stage machine stays as-is — it now runs *within* a programme application, which the events + assignments audit rows already scope.

## 2. Assignment Engine (configuration, not code)

- Service `domains/assignment/` with one `resolveAssignment(student)` entry: match rules by programme → target pool → run algorithm → fall back to the default pool/policy.
- Algorithms as a small strategy map: `round_robin`, `least_workload`, `least_active`, `manual`. Adding one later = one map entry.
- Every decision writes an `assignments` audit row (rule matched, algorithm, eligible counsellors considered, chosen, auto vs manual, actor).
- Called automatically on enquiry submit when auto-assign is on; the existing manual assign path writes the same audit row with `source = 'manual'`.
- Admin UI: `/settings/assignment` (current policy, fallback, default pool, auto-assign toggle), pool builder, and per-programme rule rows. `/lead-assignment` gains an Unassigned queue with a "Run engine" action and a decision log.

## 3. Seminar / Event Engine

- Event (what) → Sessions (when + venue + capacity) → Booking (source of truth for QR, attendance, emails).
- Booking allocation strategies: `first_available`, `least_filled`, `round_robin`, `manual` — the student picks an event, the engine picks the session/venue.
- Capacity respects reserved seats and waiting list; timestamps stored as `timestamptz` only.
- Admin UI: event builder (basics → schedule/sessions → capacity → venue → registration rules → target audience), plus live utilisation per event with a session breakdown.
- Venues become a managed list reused across events.

## 4. Architecture (4 layers, enforced)

```text
src/routes/<page>.tsx              thin, renders a feature shell
src/domains/<domain>/
  <domain>.functions.ts   controller  createServerFn only, declarations + imports
  <domain>.service.ts     service     rules, engines, orchestration
  <domain>.repo.ts        repo        the only file touching supabaseAdmin
  schema.ts  types.ts     contracts
src/components/<feature>/index.ts   barrel; pages import the barrel only
```

Existing `*.server.ts` files split into `.service.ts` + `.repo.ts` as they are touched — no big-bang rewrite. Every file stays under 200 LOC; components stay presentational and reusable.

## 5. Screens touched

- Enquiry form: free-text course → programme dropdown fed from published programmes.
- New `/programmes` (list + builder) and `/venues`; sidebar reordered so Programmes is first.
- Students registry, dashboard, and reports gain a programme filter and programme-scoped rollups (applications → assigned → attendance → exam → admissions).
- Seminars page becomes the event/session view; exams get a programme column.

## 6. Verification

One runnable assert-based check per engine — `resolveAssignment` over a fixed pool set (round robin cycles, least workload picks the minimum, no eligible counsellor falls back), and session allocation (least filled picks the emptiest, full session overflows to waiting list). No framework, no fixtures.

## Build order

1. Migration: programmes, academic years, venues, `programme_id` columns + backfill, seminars → events/sessions.
2. Programme + venue domain, routes, and the enquiry-form dropdown.
3. Assignment Engine: schema already in step 1, service + audit + admin config screens.
4. Event Engine: builder, allocation, booking rewrite, utilisation dashboard.
5. Programme-scoped dashboard and reports.
