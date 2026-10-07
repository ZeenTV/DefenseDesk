# DefenseDesk

DefenseDesk is a capstone defense coordination system for NU Clark. Coordinators manage accounts, groups, rooms, schedules, assignments, and status progression. Panelists see assigned defenses and submit evaluations. Students can view their own group’s defense information.

This repository follows the lesson's single-project architecture: `frontend/` is the React application and `backend/` is the Express API. The database has five Mongoose collections: User, Group, Room, Defense, and Evaluation.

## Requirements

- Node.js 20 or newer and npm.
- A MongoDB Atlas cluster, database user, and network access rule for your development machine.

## Setup

1. Create your MongoDB Atlas database and database user. Allow your current IP address and copy the Node.js connection URI for the `defensedesk` database.
2. Copy `backend/.env.example` to `backend/.env`. Set `MONGO_URI`, a private `JWT_SECRET`, and the coordinator seed values. Keep this file private.
3. Install and seed the backend:

   ```bash
   cd backend
   npm install
   npm run seed
   npm run dev
   ```

4. In a second terminal, install and start the frontend:

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

5. Open `http://localhost:5173`. The backend runs at `http://localhost:3000`.

`CLIENT_ORIGIN` must exactly match the frontend origin. For a different API origin, set `VITE_API_URL` in `frontend/.env` to the API base URL ending in `/api`. Do not copy a real MongoDB password or JWT secret into this README or send it in chat.

### First coordinator and demo data

`npm run seed` creates the coordinator only if its email does not already exist. It reads the initial password from `SEED_COORDINATOR_PASSWORD`, hashes it with bcryptjs, and marks it for a password change. The script never prints passwords. Re-running it does not duplicate the coordinator. If you set `SEED_DEMO_PASSWORD`, the same command also creates repeatable faculty, student, group, room, and sample defense records for the demonstration. Demo accounts also require a password change on first sign in. Change environment passwords before sharing a demo database.

No public registration route exists. Coordinators create all later accounts; generated temporary passwords are returned once by the create-account API and shown once in the client.

## Application modules

- `backend/models/` defines the five strict, timestamped Mongoose collections and validation.
- `backend/routes/` declares the 31 REST endpoints and access middleware.
- `backend/controllers/` implements authentication, account and academic CRUD, scheduling checks, evaluation authorization, and statistics.
- `backend/middlewares/` handles cookie authentication, roles, request logs, not-found requests, and consistent JSON errors.
- `backend/utils/` contains token/error helpers, processing rules, and repeatable seed setup.
- `frontend/src/context/` restores the current user from the httpOnly cookie session.
- `frontend/src/services/api.ts` is the single Axios instance used by the client.
- `frontend/src/schemas/` contains Zod form schemas and inferred form types.
- `frontend/src/hooks/` contains the shared API loading hook.
- `frontend/src/pages/` implements the 12 PRD pages and the not-found route.

## API

All errors use `{ "message": "..." }`. Business-rule and validation failures return 400, unauthenticated requests 401, unauthorized requests 403, missing records/routes 404, and unexpected failures 500. The JWT is an httpOnly cookie; the browser sends it through Axios `withCredentials`.

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| POST | `/api/auth/login` | Public | Sign in and set session cookie. |
| POST | `/api/auth/logout` | Authenticated | Clear session cookie. |
| GET | `/api/auth/me` | Authenticated | Restore the current session. |
| PATCH | `/api/auth/password` | Authenticated | Change own password. |
| GET | `/api/users` | Coordinator | List accounts. |
| POST | `/api/users` | Coordinator | Create account and return one-time temporary password. |
| GET | `/api/users/:id` | Coordinator | Read account details. |
| PUT | `/api/users/:id` | Coordinator | Update account details. |
| DELETE | `/api/users/:id` | Coordinator | Delete eligible account. |
| PATCH | `/api/users/:id/roles` | Coordinator | Grant/revoke coordinator privilege. |
| GET | `/api/groups` | Coordinator | List groups. |
| POST | `/api/groups` | Coordinator | Create group. |
| GET | `/api/groups/:id` | Coordinator | Read group. |
| PUT | `/api/groups/:id` | Coordinator | Update group details. |
| DELETE | `/api/groups/:id` | Coordinator | Delete group without a defense. |
| GET | `/api/groups/:id/panel-suggestions` | Coordinator | Rank eligible faculty by expertise overlap and workload. |
| GET | `/api/rooms` | Coordinator | List rooms. |
| POST | `/api/rooms` | Coordinator | Create room. |
| PUT | `/api/rooms/:id` | Coordinator | Update room. |
| DELETE | `/api/rooms/:id` | Coordinator | Delete room without scheduled defenses. |
| GET | `/api/defenses` | Coordinator | List defenses. |
| GET | `/api/defenses/availability?date=YYYY-MM-DD` | Coordinator | Return room bookings for a date. Slot calculation awaits room-hour and slot-length requirements. |
| GET | `/api/defenses/mine` | Faculty or student | Return assigned defenses or own-group defense/result. |
| POST | `/api/defenses` | Coordinator | Create defense after panel, adviser, overlap, and daily-load checks. |
| GET | `/api/defenses/:id` | Coordinator | Read defense. |
| PUT | `/api/defenses/:id` | Coordinator | Update a scheduled defense after conflict checks. |
| PATCH | `/api/defenses/:id/status` | Coordinator | Move defense one step through the status sequence. |
| DELETE | `/api/defenses/:id` | Coordinator | Delete defense and its evaluations. |
| POST | `/api/evaluations` | Assigned faculty | Submit scores for an assigned defense. |
| GET | `/api/defenses/:id/evaluations` | Coordinator or assigned faculty | List defense evaluations. |
| GET | `/api/stats/overview` | Coordinator | Calculate daily counts, criterion averages, pass rate, and faculty workload. |

Example create-account request:

```json
{"name":"Avery Student","email":"avery@example.edu","type":"student"}
```

Example response (password value is generated per request):

```json
{"user":{"_id":"...","name":"Avery Student","email":"avery@example.edu","type":"student","mustChangePassword":true},"temporaryPassword":"generated-once"}
```

## Backend health check

The lesson-style `GET /` route responds with `DefenseDesk API is running.` when the server is available. The API still requires valid MongoDB and JWT environment settings to start.

## Thunder Client walkthrough

Start the backend and use `http://localhost:3000` as the request base. First send `POST /api/auth/login` with the coordinator email and password as JSON. Thunder Client should retain the HTTP-only cookie for later requests. Then send `GET /api/auth/me`, exercise the documented CRUD and processing routes, and finish with `POST /api/auth/logout`. Confirm both successful and rejected requests using the status codes in the API table and the demo checklist. Do not save real credentials in a shared collection.

## Tests and builds

- Backend checks and unit tests: `cd backend`, `npm test`.
- Frontend type-check and production build: `cd frontend`, `npm run build`.
- Start the API: `cd backend`, `npm run dev` (port 3000).
- Start the client: `cd frontend`, `npm run dev` (port 5173).

## Demo checklist

1. Seed an initial coordinator and sign in; change the temporary password.
2. Create a faculty account and a student account; verify the one-time password display.
3. Show form validation and an unknown API identifier returning a not-found response.
4. Create a group and room, then schedule its defense.
5. Show panel suggestions and the stats overview computation.
6. Try the group's adviser on its panel or double-book a room/panelist to demonstrate the 400 business-rule rejection.
7. Attempt to remove the last coordinator and demonstrate the 400 protection.
8. Sign in as a panelist, view assignments, submit an evaluation, and show that an unassigned panelist receives 403.
9. Sign in as a student and show only their group's view.
10. Advance status in order and verify that group status follows it.

## Current behavior and accepted decisions

- Panel suggestions use the accepted interim ranking: exact expertise-tag/project-area matches first, then lower scheduled workload, then name. Suggestions are advisory; coordinators can choose any active faculty for panel member slots. The chair must have `canChair`, and the group's adviser is excluded. The backend still checks conflicts and daily limits.
- Room availability currently returns booked intervals for the selected date. Open slots are not generated because room hours and slot length have not been specified.
- Evaluation criteria remain configurable: panelists enter criterion labels and scores from 0 to 100. The UI does not impose a preset rubric.
- Stats uses the documented passing mark of 75 as a fixed value. The status sequence follows the schema’s explicit `scheduled -> defended -> revisions -> cleared` rule.
- The demo seed uses sample names and example.edu emails and does not create evaluations because their required criterion labels are unresolved.
- The optional instructor live-demonstration guide was reviewed. Its examples use `fetch`, but the DefenseDesk grading specification requires one shared Axios instance; the frontend consistently uses Axios through `frontend/src/services/api.ts`.
- MongoDB-backed end-to-end tests require a reachable MongoDB instance; local tests cover schema validation and the isolated status, overlap, and pass-rate calculations.
- The client dependency audit reports seven development dependency advisories in the Tailwind CSS 3 toolchain; production dependency audits for the client and server report no known vulnerabilities. A clean fix requires a Tailwind major-version migration.
- The production client build and preview work in this restricted workspace. `npm run dev` exits during Vite's dependency scan because esbuild attempts to read above the workspace root and receives `Access is denied`; running the dev server in a normal project environment remains to be verified.
