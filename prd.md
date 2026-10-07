# Product Requirements Document: DefenseDesk

---

## Product Overview

**Product Vision:** To give NU Clark capstone coordinators a single system that schedules capstone panel defenses without room or panelist conflicts, recommends the right panel for each group, and tracks every group from scheduling to clearance, while demonstrating advanced full-stack data processing capabilities.

**Problem:** Capstone defenses are usually scheduled through spreadsheets and group chats. This leads to double-booked panelists and rooms, uneven panel workloads, and no clear record of where each capstone group stands. Coordinators spend hours resolving conflicts that software can detect instantly.

**Scope:** DefenseDesk covers capstone panel defenses only. Each capstone group needs a panel of one chair and two members, and the panel cannot include the group's own adviser.

**Target Users:**

1. **Coordinator (Faculty):** A faculty member with the coordinator role. Creates all student and faculty accounts, manages groups and rooms, schedules defenses, and can also sit on panels. Can give the coordinator role to other faculty and take it back.
2. **Panelist (Faculty):** Every faculty member. Sees the defenses they are assigned to and submits evaluation scores for them.
3. **Student (Capstone group member):** Signs in to view their own group's defense schedule, panel, status, and result. Read only.

**Business & Academic Objectives:** To deliver a fully functional MVP that satisfies the CTADWEBL Final Project Rubrics: Backend API & Database (25), Data Processing & Business Logic (15), Frontend Functionality (20), Frontend Design & Responsiveness (20), Code Quality & Repository (10), and Project Presentation (10). The professor's notes for this project: faculty need two privileges (panelist and coordinator), 20 or more endpoints, 10 pages using React Router, Express REST API, and MongoDB as the database.

**Success Metrics:**

- 100% execution of 31 REST API endpoints (including 5 or more processing endpoints).
- Zero double-booked rooms and zero double-booked panelists, including when the coordinator is on the panel.
- No group's adviser ever appears on that group's panel.
- Every role sees only the pages and data its privileges allow (401 and 403 enforced by the API).
- Fluid, responsive UI (375px to desktop, no horizontal scrolling).
- The application must look complete during the demonstration by utilizing seeded sample data.

---

## User Personas

### Persona 1: The Coordinator (Faculty)

- **Role:** Faculty member who also holds the coordinator role; one is seeded.
- **Goals:** Schedule every capstone defense without conflicts, pick a balanced panel, create the accounts for students and faculty, and see where each group stands.
- **Pain Points:** Spreadsheets and group chats cause double bookings and uneven workloads; resolving conflicts takes hours.
- **User Journey:** Logs in → Sees the Dashboard with statistics → Creates a faculty account and grants the coordinator role if needed → Creates a group → Opens Schedule Defense, views panel suggestions and available slots → Saves the defense → Updates the status after the defense.

### Persona 2: The Panelist (Faculty)

- **Role:** Any faculty member; the coordinator is also a panelist on other groups.
- **Goals:** Know which defenses they are assigned to and submit scores for them.
- **Pain Points:** Unclear schedules and no single place to record evaluations.
- **User Journey:** Logs in → Changes the temporary password on first login → Opens My Assignments → Opens an assigned defense → Submits the Evaluation Form.

### Persona 3: The Student (Capstone group member)

- **Role:** Member of a capstone group; account created by the coordinator.
- **Goals:** See when and where the defense is, who is on the panel, and the result.
- **Pain Points:** No clear record of where the group stands after the defense.
- **User Journey:** Logs in → Changes the temporary password on first login → Opens My Defense → Views schedule, panel, status, and result.

---

## Feature Requirements

All features below are in scope. No SHOULD or COULD tier has been decided.

| Feature | Description | Priority | Acceptance Criteria (Academic Rubric Focus) |
| ------- | ----------- | -------- | ------------------------------------------- |
| **Landing Page** | Public home page introducing DefenseDesk with a call to action (Login). | MUST | Required by the project instructions; responsive and visually polished. |
| **Authentication (JWT + Cookies)** | Login, logout, session restore, and password change using a JWT stored in an httpOnly cookie. There is no public sign-up. | MUST | Passwords hashed; protected routes return 401/403; frontend redirects unauthenticated users to Login; first login forces a password change. (Rubric extra credit; built from the start so every endpoint and page is designed around it.) |
| **Account Management** | Coordinator creates and manages student and faculty accounts. A temporary password is shown once at creation. | MUST | Only coordinators can access; forms use React Hook Form + Zod; delete has a confirmation step. |
| **Role Management (2 Privileges)** | Coordinator grants or revokes the coordinator role on a faculty account. A faculty with both roles switches between the coordinator view and the panelist view from the navbar. | MUST | The last coordinator can never be demoted or deleted; the API returns 400 with a message. |
| **Group Management** | Coordinator creates and manages capstone groups (title, members, adviser, project area). | MUST | Full CRUD; group status is synced from its defense and never edited directly. |
| **Room Management** | Coordinator creates and manages defense rooms. | MUST | Full CRUD; deleting a room with scheduled defenses returns 400. |
| **Defense Scheduling with Conflict Detection** | Coordinator schedules a defense with a room, a chair, and two members. | MUST | API returns 400 if the room or any panelist overlaps another defense, a panelist exceeds their daily limit, the panel is not 1 chair and 2 members, or the group's adviser is on the panel; React Hook Form displays the error. |
| **Available Slots** | Shows open room and time slots for a chosen date. | MUST | Backend subtracts booked defenses from room hours; frontend maps data using stable IDs. |
| **Panel Suggestions** | Recommends 1 chair and 2 members for a group. | MUST | Faculty ranked by expertise match, lowered by current workload; adviser excluded. |
| **Defense Status Flow** | Moves a defense through scheduled, defended, revisions, and cleared. | MUST | Invalid jumps return 400; the group's status is synced. |
| **Evaluations** | An assigned panelist submits scores per criterion for a defense. | MUST | One evaluation per panelist per defense; a panelist not on the panel gets 403. |
| **Statistics Dashboard** | Coordinator sees defenses per day, average score per criterion, pass rate, and panelist load. | MUST | Backend computes the values; the frontend shows derived values computed during render. |
| **Role-based Views** | Panelist sees My Assignments; student sees My Defense (read only). | MUST | Data returned by `/api/defenses/mine` depends on the signed-in user. |
| **Delete Operations** | Coordinator can delete accounts, groups, rooms, and defenses. | MUST | A confirmation step must be present before executing the delete operation. |
| **UI Feedback States** | Clear communication of system status to the user. | MUST | Visible loading, error, and empty states for lists, and success feedback after create, update, and delete actions. |

---

## User Flows

### Flow 1: Scheduling a Defense with Conflict Checking

1. Coordinator opens Schedule Defense and selects a group.
2. Frontend loads panel suggestions (`GET /api/groups/:id/panel-suggestions`) and available slots (`GET /api/defenses/availability?date=`).
3. Coordinator picks a room, a time range, a chair, and two members, then submits.
4. Frontend sends a `POST` request to `/api/defenses` via the single configured axios instance (cookie sent automatically).
5. **Backend Processing:**
   - Checks the panel is exactly 1 chair (with `canChair`) and 2 members, and the group's adviser is not on it.
   - Checks the room and each panelist for time-range overlaps (`startTime` to `endTime`), counting the coordinator when on the panel.
   - Checks each panelist's `maxDefensesPerDay`.
6. **Alternative Path (Error):** If any rule fails, the API returns 400 with a `message`. The frontend displays it through React Hook Form (`setError`).
7. **Success Path:** Defense saved, the group's status becomes `scheduled`, and the user is shown success feedback.

### Flow 2: Authentication and Account Creation

1. Coordinator logs in on the Login page; the backend sets a JWT in an httpOnly cookie.
2. Coordinator opens Account Form and creates a student or faculty account (`POST /api/users`); the temporary password is shown once.
3. The new user logs in with the temporary password and is forced to change it (`PATCH /api/auth/password`).
4. On every page load, the frontend calls `/api/auth/me` to restore the session; a 401 redirects to Login.
5. Logout calls `/api/auth/logout`, which clears the cookie.

### Flow 3: Panelist Evaluation

1. Panelist opens My Assignments (`GET /api/defenses/mine`).
2. Panelist opens an assigned defense and submits the Evaluation Form (`POST /api/evaluations`).
3. Backend takes the panelist from `req.user`, checks the panelist is on that defense's panel, and rejects a second submission.
4. **Alternative Path (Error):** Not on the panel returns 403; already submitted returns 400.
5. **Success Path:** Evaluation saved and success feedback shown.

### Flow 4: Granting the Coordinator Role

1. Coordinator opens Accounts List and selects a faculty account.
2. Coordinator toggles the coordinator role (`PATCH /api/users/:id/roles`).
3. **Alternative Path (Error):** If this would remove the last coordinator, the API returns 400 with a `message`.
4. **Success Path:** The faculty member now sees the coordinator view and the panelist view and can switch between them in the navbar.

---

## Non-Functional Requirements

### Performance & Error Handling

- **API Responses:** Must strictly follow REST conventions (200, 201, 400, 404, 500, plus 401/403 for auth) with a consistent JSON error format (e.g., `{ "message": "Record not found" }`).
- **Server-Side Validation:** Mongoose validation errors must be returned as 400, and invalid IDs must be handled cleanly.
- **Loading States:** No blank screens and no silent failures; explicit loading spinners and error states on every data-fetching screen.

### Design & Compatibility

- **UI/UX:** Must feature a deliberate color palette defined in the Tailwind theme, generous spacing, consistent corners and shadows, and clear type hierarchy using Tailwind CSS. Buttons, cards, and form fields must look the same on every page.
- **Responsiveness:** Fully usable at 375px (mobile) up to desktop resolutions with **NO** horizontal scrolling.

---

## Technical Specifications

### Frontend (Client Repo)

- **Core:** React (Vite) with TypeScript.
- **Styling:** Tailwind CSS.
- **Routing:** React Router (12 pages, including a Landing Page).
- **Forms:** React Hook Form + Zod (for validation, `z.infer` for types, and per-field error messages).
- **Data Fetching:** Axios (single configured `axios.create` instance with a `baseURL` and `withCredentials: true`).
- **Custom Hooks:** Minimum of one inside a `/hooks` folder.

### Frontend Pages (12)

| #  | Page                                                          | Who sees it           |
| -- | ------------------------------------------------------------- | --------------------- |
| 1  | Landing                                                       | Public                |
| 2  | Login                                                         | Public                |
| 3  | Dashboard (content changes by role; coordinator sees statistics) | All signed-in users |
| 4  | Accounts List                                                 | Coordinator           |
| 5  | Account Form (create or edit, with coordinator role toggle)   | Coordinator           |
| 6  | Groups List                                                   | Coordinator           |
| 7  | Group Form (create or edit)                                   | Coordinator           |
| 8  | Defense Calendar                                              | Coordinator           |
| 9  | Schedule Defense (with panel suggestions)                     | Coordinator           |
| 10 | Rooms                                                         | Coordinator           |
| 11 | My Assignments and Evaluation Form                            | Panelist              |
| 12 | My Defense (schedule, panel, status, result)                  | Student               |

A NotFound (404) page is also required for unknown routes.

### Backend (Server Repo)

- **Core:** Node.js + Express.
- **Database:** MongoDB Atlas with Mongoose (5 related collections, strict validation rules, and timestamps).
- **Architecture:** Clean `app.js` mounting routers from a `/routes` folder, with models in a `/models` folder.
- **Middleware:** Custom request logger, auth (JWT) middleware, centralized error handler, and a JSON 404 catch-all registered in the correct order.
- **Endpoints:** 31 total endpoints (full CRUD on the main collections and 7 processing endpoints). See `schema.md`.
- **Environment:** Variables in a `.env` file (`PORT`, `MONGO_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `CLIENT_URL`), which is ignored by Git, alongside a committed `.env.example`.
- **Seed Data:** `utils/seedData.js` injects sample users (including one seeded coordinator who is also a panelist, other faculty, and students), groups, rooms, defenses in several statuses, and evaluations.

### Repository & Documentation

- **Version Control:** A single GitHub repository containing a `client` folder and a `server` folder, a root `README.md`, and a root `.gitignore`. The repository must be public or have the instructor added as a collaborator.
- **Commits:** Every member must have visible and meaningful commits throughout the project, using their own GitHub account.
- **Exclusions:** `node_modules` and `.env` must never be committed.
- **Documentation:** A complete `README.md` containing the project title, group members, concept, what data is processed, screenshots, setup instructions with required environment variables, an API documentation table (method, path, purpose, sample request, sample response), and a list of features and known limitations.

### Demo Checklist (Defense)

- Application already running and seeded before presenting.
- Show a validation error (e.g., submitting an invalid defense form or putting the group's adviser on the panel).
- Show a not-found case (e.g., an unknown defense ID or the 404 page).
- Show each processing endpoint: defense scheduling with conflict (room or panelist, including the coordinator), available slots, panel suggestions, status transition, statistics overview, role grant with the last-coordinator rule, and `mine` for a panelist and a student.
- Show a 403 by submitting an evaluation for a defense the panelist is not assigned to.
- Sign in as a student to show the read-only view of their own group's defense and result.
- Every member can explain the full data flow from React to Express to MongoDB, including parts written by teammates.

---

## Open Questions & Assumptions

- **Assumption 1:** Authentication is implemented with JWT in httpOnly cookies and is built first (Day 1), because retrofitting it into a finished system is harder. The rubric treats it as extra credit, so core requirements still take priority over auth polish. Payments, deployment, and file uploads are skipped for the MVP.
- **Assumption 2:** A faculty account has `roles` of `panelist` and optionally `coordinator`; all students and faculty sign in; there is no public sign-up.
- **Open Question 1:** Final project proposal deadline is October 5 (IT403) or October 6 (IT404), 2026; the defense is October 12-13.
- **Open Question 2:** The rubric's Core Requirements say two repositories (client and server), while the Submission Instructions say a single repository with `client` and `server` folders. This document follows the Submission Instructions; confirm with the instructor.
- **Open Question 3:** The exact panel-suggestion formula (how expertise overlap and workload combine) is not decided.
- **Open Question 4:** Room hours and slot length used by the availability endpoint are not decided (no room-hours field exists yet).
- **Open Question 5:** The evaluation criteria names are not decided.
- **Open Question 6:** How the passing mark of 75 is adjusted (a constant or an optional query param) is not decided.
- **Open Question 7:** Whether a defense may go directly from `defended` to `cleared` (no revisions) is not decided; for now only the order scheduled, defended, revisions, cleared is allowed.
