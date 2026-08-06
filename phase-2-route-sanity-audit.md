# Phase 2 Route Sanity Audit

Date: 2026-08-06

This note records what the pulled codebase actually does today versus the Phase 2 plan, with a focus on persona boundaries, route leakage, and the remaining QR work.

## Scope of this audit

- No UI or flow changes were made for this audit.
- The check was code-path based: route definitions, nav visibility, server function access, and data-scope checks.
- The goal was to separate "same route name" from "wrong persona can see or load data outside scope".

## Route issues found

### 1) Student registry is staff-wide and not persona-scoped

- Route: `/_authenticated/students`
- Nav visibility: shown to all staff roles in `NAV_ITEMS`
- Data source: `listStudents()` in `src/domains/students/students.functions.ts` calls `queryRegistry()` in `src/domains/students/students.server.ts`
- Actual behavior: `queryRegistry()` uses `supabaseAdmin` and applies only filter inputs from the UI. It does not scope rows to the signed-in counsellor or any role-specific partition.
- Impact: a counsellor can see all students, not just assigned students, if they can access the page.
- Related detail: `getStudentDetailFn()` also returns full student detail, timeline, assignments, and bookings with no persona restriction beyond staff auth.

### 2) Counsellor-specific workspace is separate, but the admin student registry overlaps it

- Route: `/_authenticated/my-leads`
- Actual behavior: `listMyLeadsFn()` is correctly limited to the caller’s own leads via `context.userId`.
- Risk: the admin-style student registry remains reachable in the same authenticated shell, so the counsellor can move from a scoped page into an unscoped page.
- Conclusion: the leak is not inside `my-leads`; it is the adjacent registry/detail surfaces.

### 3) Exams route is admin-shaped but not fully persona-guarded at the route level

- Route: `/_authenticated/exams`
- Data source: `getExams()` calls `listExams()` with only staff authentication.
- Actual behavior: the route itself does not enforce admin-only entry. The sidebar hides it from counsellors, but the route can still be deep-linked if a staff user knows the URL.
- Impact: this is a route-level exposure risk even if the data returned is mostly read-only.

### 4) Seminar builder is visible to all staff, not just admins

- Route: `/_authenticated/seminars`
- Nav visibility: shown to all staff roles in `NAV_ITEMS`
- Data source: `listEventsFn()` is staff-authenticated only.
- Actual behavior: counsellors can open the seminar builder surface. The dangerous actions are still admin-gated (`publishEventFn`, `autoAllocateFn`), but the view itself is not persona-restricted.
- Impact: this matches the user report that counsellors can see a seminar route that is not meant for them.

### 5) The authenticated shell is session-gated, not role-gated

- Route guard: `src/routes/_authenticated.tsx` only checks for a Supabase session.
- Result: role separation is mostly handled inside server functions and nav filtering, not at the route boundary.
- Risk: any staff role can deep-link into routes that are not intended for that persona unless the page or server function adds an explicit role check.

## What is completed already

### Done and verified

- Student sign-in exists at `src/routes/student-login.tsx`.
- Counsellor first-login reset exists through `must_reset_password` and the `FirstLoginGate` flow.
- Counsellor profile editing exists.
- Admin counsellor drill-in exists and shows allocated students plus call logs.
- Automatic assignment is now triggered on application creation.
- Policy publishing is implemented with `is_published` and a single-published-policy constraint.
- The migration needed for the above is present, including `must_reset_password`, `is_published`, `ground_password`, `is_walk_in`, `called_at`, and the related types.

### Still incomplete

- QR generation and QR scanning are still missing from the runtime UI.
- Seminar day mode is still missing as a real ground-staff flow.
- Admin attendance views for registered versus present versus walk-ins are still missing.
- Route-level persona enforcement is still incomplete for surfaces that are currently session-only.

## Change log from the pull

1. Student-login route landed.
2. Counsellor reset/profile/detail surfaces landed.
3. Auto-assignment and published policy behavior landed.
4. Phase-2 migration fields landed.
5. The remaining gap is now concentrated in QR/check-in, seminar day mode, and persona route hardening.

## QR code methodology to keep fixed

This is the part that must stay deterministic and static.

### Required behavior

- The student portal must render a static QR for the student record.
- The QR payload must be deterministic and derived only from the student’s UUID and name.
- Do not include timestamps, random salts, URLs, session data, or any changing server-side value.
- The QR should be generated client-side in the student portal using `qrcode.react`.
- The scanner should use `html5-qrcode` in the ground-staff flow.

### Practical rule

- For the same student record, the generated QR must always be the same.
- The QR should be a pure representation of student identity, not a live token.
- The scanner should treat the payload as an identity lookup input, then resolve the UUID server-side.

## Remaining Phase 2 task list

### 1. Route hardening

- Add explicit role checks to routes that should be admin-only.
- Separate counsellor-visible routes from admin registry routes.
- Keep the current UI flow intact; fix the access boundary, not the page design.

### 2. QR student portal

- Add a `View my QR` section in the student portal.
- Generate the QR statically from the student UUID and name.
- Keep the payload deterministic and stable.

### 3. QR ground-staff scanner

- Add the staff scanner flow using `html5-qrcode`.
- Resolve scanned QR payloads into a student lookup.
- Keep scanner behavior read-only until an attendance action is intentionally triggered.

### 4. Seminar day mode

- Add the ground-staff password session flow.
- Add the day-of-seminar dashboard for capacity, registrations, and free seats.
- Add walk-in handling and attendance state tracking.

### 5. Attendance administration

- Add the admin attendance view for registered, present, and walk-in counts.
- Ensure the data remains attached to the existing seminar model.

## Implementation guardrails

- Do not rewrite the current UI flow while fixing scope issues.
- Keep all database changes in migrations.
- Keep edge-function behavior separate from UI behavior where that already exists.
- Keep the QR payload static and deterministic.
- Prefer route and server-function guardrails over visual-only restrictions.

## Summary

The pull completed the student login, counsellor reset/profile/detail, automatic assignment, and migration portions of Phase 2.

The remaining serious issue is route/data leakage across personas: the student registry and its detail surface are not scoped to the counsellor, and the seminars/exams surfaces are still session-gated rather than fully persona-gated.

The remaining QR work must follow the static UUID+name methodology above, with no changing token behavior.