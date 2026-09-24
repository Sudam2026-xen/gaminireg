# Digital School Registration System

A complete local school registration and attendance system built with **Node.js, Express, vanilla HTML/CSS/JavaScript, and SQLite**. It is designed for a school project or local demonstration while keeping the main security boundaries that a later production hardening effort would require.

> This project is a local demo implementation. Development encryption, password hashing, and secure cookie settings do not by themselves make the system production-secure. Before deployment, use a managed secret store, HTTPS, stronger operational controls, backups, monitoring, a formal privacy review, and a tested recovery plan.

## Requirements

The system requires **Node.js 22.5 or later**, because it uses the built-in `node:sqlite` module. It runs on Windows, macOS, and Linux. Microsoft Windows users need Node.js and npm available on `PATH`.

## Installation

Open Command Prompt or PowerShell in the project folder:

```text
npm install
```

The server automatically creates `data/school.sqlite` on first start, creates four logical database areas and initializes a clean slate with only the Principal and Administrator accounts requested below. No sample students or academic records are seeded.

For a configured installation, copy the environment template first:

```text
copy .env.example .env
```

Then replace every development value in `.env` before using the application for real school records.

## Running

Start the application with:

```text
npm start
```

Or double-click `START-SCHOOL-SYSTEM.bat` on Windows. The terminal prints:

```text
========================================
DIGITAL SCHOOL REGISTRATION SYSTEM
========================================
Main UI:   http://localhost:3000/
Database 1: http://localhost:3000/DB/1
Database 2: http://localhost:3000/DB/2
Database 3: http://localhost:3000/DB/3
Classes:   26
Server:    RUNNING
========================================
```

## Primary credentials

The one-time initialization removes legacy/sample users and records. These two primary accounts are created with bcrypt-hashed passwords; passwords are never returned by APIs. The Administrator account is the only role allowed to access Database 4.

| Account | User ID | Password | Role |
|---|---|---|---|
| Principal Account | `PRI0102` | `School@123` | `Principal` |
| Administrator Account | `AD1234` | `1357924680AD` | `administrator` |

## Database access

The separate database passwords are:

| Database | URL | Development database password |
|---|---|---|
| Database 1 — Student Information | `http://localhost:3000/DB/1` | `DB1@123` |
| Database 2 — Daily Registration | `http://localhost:3000/DB/2` | `DB2@123` |
| Database 3 — Staff Access Information | `http://localhost:3000/DB/3` | `DB3@123` |
| Database 4 — Master Credentials Database | `http://localhost:3000/DB/4` | `DB4@123` |
| Database 5 — Staff Registration Records | `http://localhost:3000/DB/5` | `DB5@123` for other authorized staff; Principal-level accounts use their own staff password only |

Database 1–3 require an authorized school administrator. Database 4 requires the exact `administrator` role. Database 5 is available to the Principal, Vice Principal, Assistant Principal, and Administrator roles. Principal-level accounts can open authorized databases with their own staff ID and password without entering a separate database password, and can view any class. Non-administrator attempts to access Database 4 receive HTTP 403 Access Denied. Plaintext user passwords are never returned by an API or displayed in the interface.

Database 5 also supports the special ID `REGID`. `REGID` is accepted only at `/DB/5`, requires no staff password or database password, and is limited to Database 5 staff-registration access. It cannot unlock Database 1, 2, 3, or 4.

## How to change passwords

Change the separate database passwords and application secrets in `.env`, then restart the server. The two primary account passwords are established during the one-time clean-slate initialization. To change a seeded user's password later, open Database 3, authenticate, and use the **Staff User Administration** form. Leaving the password blank while updating an existing user keeps its current password hash.

If an existing database must be re-seeded from scratch for a demonstration, stop the server, back up `data/school.sqlite`, remove that file, and run `npm run seed`. This recreates the schema and development records on the next load. Do not do this when the database contains records that must be preserved.

## Project structure

```text
digital-school-registration-system/
├── .env.example
├── .gitignore
├── README.md
├── START-SCHOOL-SYSTEM.bat
├── package.json
├── package-lock.json
├── server.js
├── data/
│   └── school.sqlite                 # generated local database; do not commit
├── public/
│   ├── app.js                        # browser application logic
│   ├── db.html                       # protected DB/1, DB/2, and DB/3 shell
│   ├── index.html                    # main landing page and dashboard shell
│   ├── login.html                    # standalone login route
│   └── style.css                     # responsive school administration UI
└── scripts/
    ├── cleanup.js                    # manual retention-policy cleanup
    └── seed.js                       # idempotent development seeding
```

Store wrapper projects are currently available under `store-packages/` for Google Play Store and Microsoft Store builds. They open a deployed HTTPS server instance; replace the example server URL in each wrapper before building. See `store-packages/README.md` for platform requirements and signing steps.

## Database structure

SQLite is stored in one local file for easy Windows installation, but the application uses separate logical tables matching the requested database areas.

| Logical database | SQLite table | Purpose |
|---|---|---|
| Database 1 | `student_information` | Student identity, class, guardian details, status, and dates |
| Database 2 | `daily_registration` | One attendance submission per class and date |
| Database 3 | `staff_users` | Staff IDs, roles, assignments, active status, hashes, and login dates |
| Database 4 | `staff_users` (administrator-only view) | Master credential identifiers and access status; secrets are never exposed |
| Database 5 | `staff_attendance` | Daily time reported and departure time for academic and non academic staff |
| Cross-cutting | `audit_log` | Login, failed login, student, attendance, database, admin, and cleanup actions |

Sensitive student contact fields are encrypted with AES-256-GCM using a key derived from `ENCRYPTION_KEY`. Passwords are hashed with bcryptjs and are not decryptable. The environment key must be kept private and changed before deployment.

## Classes and access rules

The system generates all 26 classes from one configuration object rather than creating separate pages:

| Grades | Sections |
|---|---|
| 6–11 | A, B, C |
| 12–13 | A, C, T, S |

Internally, classes are stored as `8 A`. Login normalization accepts equivalent forms such as `8A`, `8-A`, and `8 A`. A class teacher or assistant class teacher can submit attendance and manage students only for their assigned class. School administrators can view school-wide records. A normal teacher can view another class only through the read-only class attendance view and cannot modify that class.

## Main features

The class dashboard includes today's registration, student list, new-student creation, student profiles, editing, remove/transfer actions, previous registration, and class statistics. Student IDs are unique, ages are calculated from dates of birth, and transfer or leaving actions update status while preserving an audit record.

The daily registration screen behaves like a small spreadsheet. Active students default to Present, individual students can be marked Absent, totals update live, sticky headers remain usable while scrolling, and the server validates total, gender, present, and absent counts before accepting the record. A class can submit only once per day unless a future administrator-reopen workflow is added.

The school administration dashboard reports total students, gender counts, today's present and absent counts, attendance percentage, registered classes, pending classes, and section-by-section status across all 26 classes. Database 1 supports search and CSV export. Database 2 groups records by date and class and supports CSV export. Database 3 supports staff ID configuration and never displays password hashes.

## Automatic cleanup

The server runs cleanup at startup and then hourly in the local process. `npm run cleanup` can also be run manually.

Student cleanup uses actual UTC date arithmetic and removes only non-active student records (`inactive`, `transferred`, or `left`) whose `date_added` is older than 365 days. Active records are not removed merely because they have not been edited. Daily registration cleanup removes records whose submission time is older than 24 hours. Cleanup actions are written to the audit log.

The requested 24-hour registration expiry and the request for previous registration history conflict after the 24-hour period. This implementation follows the explicit expiry requirement: expired records are actually deleted, so the history view shows retained records only.

## Environment variables

| Variable | Purpose |
|---|---|
| `PORT` | Local HTTP port, default `3000` |
| `DB1_PASSWORD` | Separate password for Database 1 |
| `DB2_PASSWORD` | Separate password for Database 2 |
| `DB3_PASSWORD` | Separate password for Database 3 |
| `DB4_PASSWORD` | Password for Database 4, default `DB4@123` |
| `DB5_PASSWORD` | Password for Database 5 (staff registration records), default `DB5@123` |
| `ADMIN_PASSWORD` | Administrator account password, default `Admin.123` |
| `SESSION_SECRET` | Secret used when generating application session tokens |
| `ENCRYPTION_KEY` | Key material used for AES-256-GCM student-field encryption |

Do not commit `.env`, real credentials, database files, or exported CSV files.

## Backup instructions

Stop the server before copying the database. Copy `data/school.sqlite` and keep a dated backup in a protected location. If SQLite WAL files exist, copy the database only after the server has stopped so all changes have been checkpointed. Do not upload the database or `.env` to public repositories. Test restoring a backup on a separate copy before relying on it.

## Testing instructions

Run the static checks first:

```text
node --check server.js
node --check public/app.js
```

Start the server and exercise these flows:

1. Open `/` and confirm the main landing page loads.
2. Open `/DB/1`, `/DB/2`, and `/DB/3` and confirm each shows its own separate authentication form.
3. Enter a wrong database password and confirm the clear `Incorrect database password.` error.
4. Log in as `PRI0102` with the Principal password; confirm the school dashboard opens.
5. Log in as `admin` with the Administrator password; confirm the school dashboard opens.
6. Confirm the initial student and attendance lists are empty and ready for manual entry.
7. Confirm an administrator can open a restricted class portal without an additional password prompt.
8. Add a new student, then try the same Student ID again and confirm the duplicate is rejected.
9. Open a student profile, verify age calculation, edit the record, and confirm the audit log entry.
10. Open Today's Registration, mark a student absent, confirm live gender totals, submit once, and confirm the record becomes locked.
11. Try submitting the same class again and confirm the duplicate daily registration is rejected.
12. Use View Class Attendance to select another class and confirm the `READ ONLY` state and absence of editing controls.
13. Transfer a student, confirm the student no longer appears in the active source-class list, and confirm the action is audited.
14. Open Database 1, search student information, and export CSV.
15. Open Database 2 and confirm submitted daily records are grouped by date and class.
16. Open Database 3, create a staff user with a strong password, and confirm only non-password staff fields appear in the table.
17. Open the Audit Log and confirm login, failed login, student, attendance, database, and administrative events appear.
18. Confirm no page or API response displays password hashes.

## Troubleshooting

If `node:sqlite` is unavailable, install a current Node.js 22 release or later and run `npm install` again. If port 3000 is already used, set another port in `.env`, for example `PORT=3010`, and open the matching URL. For a clean installation, stop the server, back up `data/school.sqlite`, remove that file, and restart; the one-time initialization recreates only the two primary accounts and empty student/attendance tables. If login suddenly stops working after changing `SESSION_SECRET` or `ENCRYPTION_KEY`, restart the server and ensure the same `.env` values are present; changing encryption key material without a migration makes existing encrypted fields unreadable.

For production use, this demo needs additional work including HTTPS termination, persistent session storage, CSRF protection, rate limiting, account recovery, stronger database access separation, robust backup automation, server process supervision, security review, privacy controls, and deployment-specific hardening.

## Staff registration (new)

The main page has a **REGISTER STAFF ARRIVAL / DEPARTURE** button. Any staff member enters their name, staff ID, role (Teacher, Assistant Principal, Vice Principal, Principal, Non Academic Staff), time reported to school, and optionally departure time. Submitting again the same day with the same ID adds or updates the departure time.

The principal dashboard now has **Student Registration** (school-wide, section-by-section tables per grade for any date, with a print button) and **Staff Registration** (arrival and departure by role for any date, with a print button). Database 5 (`/DB/5`, password `DB5@123`) lists all staff registration records with CSV export; only the Principal can delete records.
