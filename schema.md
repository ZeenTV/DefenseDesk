# Database Schema & API Route Design (SCHEMA.md)

**Project:** DefenseDesk

---

## 1. Entity-Relationship Diagram (ERD) Overview

- **User** has two types: **student** and **faculty**. Faculty carry `roles` (`panelist`, and optionally `coordinator`).
- **Group** (capstone group) has many student **Users** as members and belongs to one faculty **User** as adviser.
- **Room** has many **Defenses**.
- **Defense** belongs to one **Group** and one **Room**, and references one chair and two members (faculty **Users**).
- **Evaluation** belongs to one **Defense** and one panelist (faculty **User**); one evaluation per panelist per defense.

Total: 5 collections.

---

## 2. Conventions

- All field names, query params, and JSON keys use **camelCase** (e.g., `maxDefensesPerDay`, `startTime`).
- All schemas include Mongoose `timestamps: true` (`createdAt`, `updatedAt`).
- Error format for every failure: `{ "message": "..." }`.
- Status codes: 200, 201, 400, 404, 500 for core flows; 401 (not logged in) and 403 (not allowed) for auth.
- Business-rule violations (room or panelist conflict, invalid panel, panelist over the daily limit, invalid status transition, removing the last coordinator, deleting a record that is still in use) return **400**.

---

## 3. MongoDB Collections & Mongoose Schemas

### A. Users Collection (`User`)

| Field                | Type     | Constraints                                                                        |
| -------------------- | -------- | ---------------------------------------------------------------------------------- |
| `_id`                | ObjectId | Auto-generated                                                                     |
| `name`               | String   | required, minlength: 2, maxlength: 60                                              |
| `email`              | String   | required, unique, lowercase, match: regex for email format                         |
| `password`           | String   | required, minlength: 6, **select: false**, hashed with bcryptjs in a pre-save hook |
| `type`               | String   | enum: `['student', 'faculty']`, required                                           |
| `roles`              | [String] | faculty only; enum values: `'panelist'`, `'coordinator'`; faculty default: `['panelist']` |
| `mustChangePassword` | Boolean  | default: true (cleared after the first password change)                            |
| `isActive`           | Boolean  | default: true                                                                      |
| `department`         | String   | faculty only                                                                       |
| `expertiseTags`      | [String] | faculty only                                                                       |
| `canChair`           | Boolean  | faculty only                                                                       |
| `maxDefensesPerDay`  | Number   | faculty only, min: 1, max: 6                                                       |

### B. Groups Collection (`Group`)

| Field         | Type       | Constraints                                                                                          |
| ------------- | ---------- | ---------------------------------------------------------------------------------------------------- |
| `_id`         | ObjectId   | Auto-generated                                                                                       |
| `title`       | String     | required (capstone title)                                                                            |
| `members`     | [ObjectId] | ref: `'User'`, student users                                                                         |
| `adviser`     | ObjectId   | ref: `'User'`, required, faculty user                                                                |
| `projectArea` | String     | required (matched against faculty `expertiseTags`)                                                   |
| `status`      | String     | enum: `['pending', 'scheduled', 'defended', 'revisions', 'cleared']`, default: `'pending'`; synced from the group's defense, never edited directly |

### C. Rooms Collection (`Room`)

| Field       | Type     | Constraints                  |
| ----------- | -------- | ---------------------------- |
| `_id`       | ObjectId | Auto-generated               |
| `name`      | String   | required, unique             |
| `capacity`  | Number   | required, min: 1             |
| `equipment` | [String] |                              |

### D. Defenses Collection (`Defense`)

| Field       | Type       | Constraints                                                                         |
| ----------- | ---------- | ----------------------------------------------------------------------------------- |
| `_id`       | ObjectId   | Auto-generated                                                                      |
| `group`     | ObjectId   | ref: `'Group'`, required                                                            |
| `room`      | ObjectId   | ref: `'Room'`, required                                                             |
| `chair`     | ObjectId   | ref: `'User'`, required (faculty with `canChair: true`)                             |
| `members`   | [ObjectId] | ref: `'User'`, required, exactly 2 faculty users                                    |
| `startTime` | Date       | required                                                                            |
| `endTime`   | Date       | required, must be after `startTime` (needed for conflict checking)                  |
| `status`    | String     | enum: `['scheduled', 'defended', 'revisions', 'cleared']`, default: `'scheduled'`   |

### E. Evaluations Collection (`Evaluation`)

| Field      | Type     | Constraints                                                      |
| ---------- | -------- | ---------------------------------------------------------------- |
| `_id`      | ObjectId | Auto-generated                                                   |
| `defense`  | ObjectId | ref: `'Defense'`, required                                       |
| `panelist` | ObjectId | ref: `'User'`, required (taken from the logged-in user)          |
| `scores`   | Array    | required; each item has `criterion` (String) and `score` (Number, min: 0, max: 100) |
| `remarks`  | String   | optional                                                         |

**Index:** Compound unique index on `{ defense: 1, panelist: 1 }`.

---

## 4. REST API Routes Design (Total: 31 Endpoints, 7 Processing)

> **Access levels:** Public = no login; Auth = logged in (JWT cookie); Coordinator = faculty with the `coordinator` role; Assigned Panelist = faculty on that defense's panel; Panelist/Student = logged-in user of that kind.
> **Route order:** static paths (`/me`, `/mine`, `/availability`, `/overview`) must be registered **before** `/:id` routes.

### Authentication (4 Endpoints)

| Method | Path                 | Access | Description                                                                            |
| ------ | -------------------- | ------ | -------------------------------------------------------------------------------------- |
| POST   | `/api/auth/login`    | Public | Verify credentials, set JWT httpOnly cookie, return user data.                         |
| POST   | `/api/auth/logout`   | Auth   | Clear the JWT cookie.                                                                  |
| GET    | `/api/auth/me`       | Auth   | Return the currently logged-in user (used to restore session on page load).            |
| PATCH  | `/api/auth/password` | Auth   | Change own password and clear `mustChangePassword`.                                    |

### Users and Accounts (6 Endpoints)

| Method | Path                    | Access      | Description                                                                                                                       |
| ------ | ----------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/api/users`            | Coordinator | List all users.                                                                                                                   |
| POST   | `/api/users`            | Coordinator | Create a student or faculty account; returns a temporary password once; sets `mustChangePassword` to true.                        |
| GET    | `/api/users/:id`        | Coordinator | Get one user (no password).                                                                                                       |
| PUT    | `/api/users/:id`        | Coordinator | Update a user.                                                                                                                    |
| DELETE | `/api/users/:id`        | Coordinator | Delete a user. Returns 400 for the last coordinator, faculty with assigned defenses or advisees, or a student in an active group. |
| PATCH  | `/api/users/:id/roles`  | Coordinator | **[PROCESSING 6]** Grants or revokes the `coordinator` role on a faculty account. Returns 400 when it would remove the last coordinator. |

### Groups (6 Endpoints)

| Method | Path                               | Access      | Description                                                                                                                             |
| ------ | ---------------------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/api/groups`                      | Coordinator | List all groups.                                                                                                                        |
| POST   | `/api/groups`                      | Coordinator | Create a group.                                                                                                                         |
| GET    | `/api/groups/:id`                  | Coordinator | Get one group.                                                                                                                          |
| PUT    | `/api/groups/:id`                  | Coordinator | Update a group (`status` cannot be set directly).                                                                                       |
| DELETE | `/api/groups/:id`                  | Coordinator | Delete a group.                                                                                                                         |
| GET    | `/api/groups/:id/panel-suggestions`| Coordinator | **[PROCESSING 3]** Ranks eligible faculty (the group's adviser excluded) by expertise-tag overlap with `projectArea`, lowered by current workload; proposes 1 chair (`canChair`) and 2 members. |

### Rooms (4 Endpoints)

| Method | Path             | Access      | Description                                                              |
| ------ | ---------------- | ----------- | ------------------------------------------------------------------------ |
| GET    | `/api/rooms`     | Coordinator | List all rooms.                                                          |
| POST   | `/api/rooms`     | Coordinator | Create a room.                                                           |
| PUT    | `/api/rooms/:id` | Coordinator | Update a room.                                                           |
| DELETE | `/api/rooms/:id` | Coordinator | Delete a room. Returns 400 if the room has scheduled defenses.           |

### Defenses (8 Endpoints)

| Method | Path                         | Access            | Description                                                                                                                                                                                                              |
| ------ | ---------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| GET    | `/api/defenses`              | Coordinator       | List all defenses.                                                                                                                                                                                                       |
| GET    | `/api/defenses/availability` | Coordinator       | **[PROCESSING 2]** Query `?date=`; returns open room and time slots by subtracting booked defenses from room hours.                                                                                                      |
| GET    | `/api/defenses/mine`         | Panelist, Student | **[PROCESSING 7]** Returns the signed-in user's defenses: assigned ones for a panelist, or the group's defense with status and average score for a student.                                                              |
| POST   | `/api/defenses`              | Coordinator       | **[PROCESSING 1]** Validates the panel (1 chair with `canChair`, 2 members, group adviser excluded), checks room and panelist time overlap and each panelist's `maxDefensesPerDay` (the coordinator counts as a panelist when on the panel); returns 400 on conflict or invalid input; sets the group's status to `scheduled`. |
| GET    | `/api/defenses/:id`          | Coordinator       | Get one defense.                                                                                                                                                                                                         |
| PUT    | `/api/defenses/:id`          | Coordinator       | Update a defense (same panel and conflict validation as create).                                                                                                                                                         |
| PATCH  | `/api/defenses/:id/status`   | Coordinator       | **[PROCESSING 4]** Enforces `scheduled` -> `defended` -> `revisions` -> `cleared`; any other jump returns 400; syncs the group's `status`.                                                                               |
| DELETE | `/api/defenses/:id`          | Coordinator       | Delete a defense.                                                                                                                                                                                                        |

**Overlap check:** an existing defense conflicts when `existing.startTime < new.endTime && existing.endTime > new.startTime`, applied to the room and to each panelist.

### Evaluations (2 Endpoints)

| Method | Path                           | Access                                  | Description                                                                                                                  |
| ------ | ------------------------------ | --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| POST   | `/api/evaluations`             | Assigned Panelist                       | Submit scores for a defense; panelist is taken from the logged-in user; returns 403 if not on that defense's panel, 400 if already submitted. |
| GET    | `/api/defenses/:id/evaluations`| Coordinator, Assigned Panelist          | List the evaluations of a defense.                                                                                           |

### Statistics (1 Endpoint)

| Method | Path                  | Access      | Description                                                                                                                                                                  |
| ------ | --------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/api/stats/overview` | Coordinator | **[PROCESSING 5]** Defenses per day, average score per criterion, pass rate (share of defenses whose average score meets the passing mark of 75), and panelist load distribution. |

---

## 5. Status Rules

| Item            | Rule                                                                                                          |
| --------------- | ------------------------------------------------------------------------------------------------------------- |
| Defense status  | `scheduled` -> `defended` -> `revisions` -> `cleared`; no other transitions.                                  |
| Group status    | `pending` until a defense is created; then mirrors the defense status; never edited directly.                 |
| Coordinator role| At least one coordinator must always exist.                                                                   |
| Panel           | Exactly 1 chair (`canChair`) and 2 members; the group's adviser can never be on the panel.                    |
