# Harbor Street Clinic - project notes

## What the app is for
Online booking for a small clinic. Patients book a visit without an account and manage it with a private link.
Staff use a front desk day view. Times are shown in the clinic's time zone (Asia/Jerusalem); the week runs Sunday to Thursday.

## Screens (HashRouter)
- `/` Home: heading "Book a visit at ...", the line "Hello 30-2" under it (bold, dark: the user chose this), service cards.
- `/book/:serviceId` Book: practitioner, day, time, patient details.
- `/booked` Confirmation with the manage link (shown once).
- `/manage/:token` Move or cancel a visit.
- `/staff` Front desk day view. Needs the staff key (X-Staff-Key header vs the CLINIC_STAFF_KEY variable).
  The variable is not set in this workspace, so this page answers "The staff key is not set up on the server yet".
- `/minutes` Minutes dashboard: booked minutes for one week (Sunday start), with week arrows. Tiles (booked minutes,
  visits, average visit, busiest day), columns per day, bars per practitioner and per service, and a table view.
  Open without the staff key because it shows totals only (no patient details). Linked from the header.

## API
- `GET /api/clinic`, `/api/services`, `/api/practitioners?serviceId`
- `GET /api/availability/days`, `GET /api/availability`
- `POST /api/appointments`, `GET /api/appointments/manage/{token}`, `POST .../cancel`, `POST .../reschedule`
- `GET /api/staff/day?date`, `POST /api/staff/appointments/{id}/status`, `POST|DELETE /api/staff/time-off` (staff key)
- `GET /api/stats/minutes?from=yyyy-mm-dd&days=7` (public, totals only; cancelled visits add no minutes)

## Decisions and conventions
- Browser tab title comes from the app name in Settings, not from the page.
- "Minutes" was read as booked visit minutes (the user asked for "a visual dashboard to the minutes").
- Charts are plain HTML/CSS (no chart library), one colour (brand teal) because there is one series.
- Database over its monthly limit: DatabaseRestingMiddleware answers 503 `database_resting`; api.js fires an event
  and App shows the full-page "This app is resting and will be back soon." message.
