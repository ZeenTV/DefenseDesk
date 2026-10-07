# Build Plan: DefenseDesk

**Timeline:** October 5 to October 11 (build), October 12-13 (defense).

---

## 1. Working Principles

- **Auth first:** every endpoint and page is built already knowing who the user is (`req.user`, `AuthContext`), so nothing is retrofitted.
- **Vertical slices:** each member owns a feature end to end (model, controller, route, Zod schema, page, hook). This keeps commits visible per member and makes every member able to explain the full React to Express to MongoDB flow.
- **Foundation together:** Day 1 scaffolding is done with everyone pushing at least one commit, so the commit history is even from the start.
- **Core before polish:** processing endpoints and role rules work before visual polish; polish happens on Day 6.
- **Test as you go:** keep a Postman or Thunder Client collection in the repo's `server` folder and test every endpoint right after writing it.
- **Understand every line:** AI-generated code must be read and explained by its owner before it is committed.

---

## 2. Suggested Feature Slices

| Slice | Backend | Frontend |
| ----- | ------- | -------- |
| **A. Auth, Accounts, Landing** | User model, auth controller and middleware, users routes (CRUD and role grant or revoke), seed of the first coordinator | Landing, Login, Dashboard shell, Accounts List, Account Form, AuthContext, ProtectedRoute, navbar role switch |
| **B. Groups and Rooms** | Group and Room models; groups routes (CRUD), rooms routes (CRUD), delete guards | Groups List, Group Form, Rooms |
| **C. Defenses and Scheduling** | Defense model; create and update with conflict and panel checks; availability; panel suggestions; status change | Defense Calendar, Schedule Defense (slot picker and panel suggestions) |
| **D. Evaluations, Role Views, Stats** | Evaluation model; submit and list evaluations; `defenses/mine`; stats overview | My Assignments and Evaluation Form, My Defense, Dashboard statistics |

Fewer members than slices: combine B with D. Every member must own at least one backend part and one frontend part.

---

## 3. Day-by-Day Schedule

| Day | Date | Goal | Deliverables |
| --- | ---- | ---- | ------------ |
| 1 | Oct 5 | Foundation | Repo with `client` and `server`, `.gitignore`, `.env.example`; `app.js` with middleware in correct order; `AppError`, `asyncHandler`, `errorHandler`, `logger`, `notFound`; User model; login, logout, me, change password; `protect` and `restrictTo`; Tailwind theme; single axios instance; `AuthContext`; Login page. Every member clones, runs, and pushes a first commit. |
| 2 | Oct 6 | Models and seed | All 5 Mongoose models with validation and indexes; `seedData.js` (one coordinator who is also a panelist, other faculty, students, groups, rooms, defenses in several statuses, evaluations); shared components (Button, Input, Card, Loader, ErrorState, EmptyState, ConfirmDialog, Toast); `useAxiosFetch` hook; Navbar and routing skeleton for all 12 pages plus NotFound. |
| 3 | Oct 7 | Backend slices | Each member finishes the controllers and routes of their slice, including the processing endpoints; test each in Postman. |
| 4 | Oct 8 | Frontend slices | Each member builds their pages with RHF + Zod forms, loading, error, and empty states, success feedback, and delete confirmation. |
| 5 | Oct 9 | Integration | Connect everything; verify all 7 processing endpoints with edge cases (room overlap, panelist overlap including the coordinator, adviser on the panel, daily limit exceeded, invalid status jump, last coordinator removal, evaluation by an unassigned panelist, duplicate evaluation); fix bugs; Landing page content. |
| 6 | Oct 10 | Polish and docs | Check 375px and desktop (no horizontal scroll), consistent buttons, cards, and forms; README with screenshots, setup, API table (sample request and response), features, and limitations; final seed data. |
| 7 | Oct 11 | Rehearsal | Fresh clone and run test; full demo rehearsal including a validation error and a not-found case; each member practices explaining their slice and the others'. |

Oct 12-13: Defense. Application already running and seeded before presenting.

---

## 4. Definition of Done (per feature)

- Endpoint works in Postman and returns the correct status code and JSON `message` on errors.
- Mongoose validation has min, max, enum, or required rules where relevant.
- Page shows loading, error, and empty states, plus success feedback after create, update, and delete.
- Forms use React Hook Form with a Zod schema outside the component and `z.infer` for the type.
- Lists use `_id` as the key; derived values are computed during render.
- Routes are protected by the correct role (401 when logged out, 403 for the wrong role).
- Committed with a meaningful message from the owner's own GitHub account.

---

## 5. Commit Guidelines

- Small commits, several per day, for example `feat(server): add defense room conflict check` or `feat(client): add schedule defense form`.
- One branch per slice (`feat/accounts`, `feat/defenses`), merged to `main` by pull request so each member's work is visible in the history.
- Never commit `node_modules`, `.env`, or build output.
