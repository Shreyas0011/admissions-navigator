# Stabilize admissions flows and add chat + exams

## Outcome
Repair the current deployment blockers and complete four connected workflows:

1. Reliable staff/student authentication and portal routing.
2. Reliable seminar ground-staff check-in on iOS, preview, and production.
3. Validated XLSX bulk import with working dropdowns.
4. Assigned-pair chat plus a complete exam builder, registration, hall-ticket, and exam-day attendance flow.

The requested staff account `admissionadmin@transcend.com` has already been created as an Admissions Admin with the supplied password, so it will use the existing Staff sign-in form.

## 1. Build, authentication, and route repairs

- Fix the `/auth` hydration mismatch by keeping browser-auth rendering behind the existing client-only route boundary.
- Resolve the production build failure and verify the generated route tree contains `/portal/qr`, `/portal/exams`, seminar-day routes, and the new exam-day routes.
- Keep staff role resolution server-authorized so the requested Admissions Admin lands on `/dashboard`; students continue to land on `/portal`.
- Verify the static student QR page loads after a direct refresh and after student sign-in.
- Add the complete required route metadata to affected routes while touching them.

## 2. Ground access that works on iOS and every deployment

Replace the fragile deployment-secret/local-storage signed token with a database-backed, opaque ground access session:

- Successful name + session password login creates a random one-device access token; only its hash is stored in the database with session, staff name, purpose, and expiry.
- Seminar/exam board, scan, and mark-attendance calls validate that token server-side on every request.
- The token remains device-local, supports many staff devices simultaneously, does not depend on cookies, and does not depend on preview/production having the same signing secret.
- Preserve the static QR payload rule: the student QR contains only the stable student ID/name payload and never embeds an expiring attendance token.
- Improve expired/invalid access handling so the console clears stale state and returns to the correct mode rather than looping.

## 3. XLSX template and bulk import

- Generate dropdowns from a hidden workbook list sheet and named/range references instead of inline comma-separated lists. This avoids Excel’s 255-character validation limit, which the current programme list exceeds.
- Include dropdowns for programme code and lead source across all template input rows; keep CSV explicitly plain because CSV cannot store dropdown validation.
- Validate programme codes against the current configured programmes during preview and again on the server.
- Make each failed import row show its exact reason and prevent orphaned login/profile records if student creation fails.
- Verify generated passwords, first-login reset flags, student creation, and automatic counsellor allocation.

## 4. Assigned student–counsellor chat

- Add a `student_messages` table with message body, sender, timestamps, and read state.
- Enforce database and server authorization so only the student and their currently assigned counsellor can read/send in that conversation; admins do not participate in or read private chat.
- Validate and limit every message on both client and server; render as plain text only.
- Add a Chat tab to the student portal and a chat action/thread in the counsellor’s assigned-lead workspace.
- Refresh messages automatically and show unread indicators without exposing conversations across assignments.

## 5. Exam builder and student registration

Build exams on the existing programme-centric event/session engine rather than creating a second scheduling system:

- Admin Exams becomes a full builder filtered to `EXAM`, reusing seminar event configuration, programme/stage eligibility, registration windows, session venue, capacity, 12-hour pickers, publication, bookings, and attendance overview.
- Add exam-specific configuration: duration in minutes and exam instructions.
- Student Exams lists eligible published exam sessions and uses the same capacity-safe self-registration rules as seminars.
- On registration, create one hall ticket tied to the student, event, session, and booking.
- Add a formatted hall-ticket view and PDF download containing student name, student number/code, student UUID, static student QR, exam date, venue, 12-hour start time, reporting time 30 minutes earlier, configured duration, and the Aadhaar card + hall-ticket instruction.
- Tickets remain reproducible and cannot be downloaded by another student.

## 6. Exam day mode

- Add an Exam day entry beside Seminar day on Staff sign-in.
- Admin can generate/show/hide a password for each exam session.
- Ground staff select today’s published exam session, enter name + password, and open the same mobile attendance console adapted for exams.
- QR scan verifies the student’s exam registration; registered candidates can be marked present.
- Exam attendance is visible to admin with registered/present student details. Walk-ins will remain disabled for exams because an exam requires a hall ticket/registration.

## Database and security changes

- Create `ground_access_sessions`, `student_messages`, and an exam configuration table, with explicit grants, RLS, indexes, timestamps, and narrow policies.
- Extend hall tickets to the event/session/booking model while preserving existing records.
- Reuse the existing attendance table for seminar and exam sessions; enforce uniqueness per student/session to prevent double check-in.
- Keep role data in `user_roles`; all protected server functions use authenticated middleware and assignment/admin checks.

## Verification

- Run the production-compatible build and focused checks.
- Test email/password Admissions Admin login and role landing.
- Test a new student application → student login → direct `/portal/qr` refresh.
- Download the XLSX in Excel-compatible form, confirm dropdowns, import a valid row, and verify assignment plus generated credentials.
- Test seminar access on two independent browser contexts, including an iPhone/WebKit-compatible flow, then scan and mark attendance.
- Test student/counsellor chat in both personas and confirm an unrelated user is denied.
- Test exam creation → publish → student registration → hall-ticket PDF → exam-day login → QR attendance → admin attendance view.
