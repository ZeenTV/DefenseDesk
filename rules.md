# Coding Rules & AI Agent Guidelines (RULES.md)

**Project:** DefenseDesk

---

## 1. General Principles

- Generate concise, short solutions for new modules or code.
- Watch for over-engineering and oversized files; **always extract complex logic to Custom Hooks** (e.g., inside the `/hooks` folder).
- Watch for syntax/style mismatching the rest of the React and Express codebase.
- Watch for obvious bugs and consider the blast radius of errors.
- Avoid redundancy unless it improves usability.
- Markdown files must use kebab-naming convention (e.g., `api-documentation.md`).
- **Do not add features, endpoints, fields, pages, or libraries that are not written in `prd.md`, `schema.md`, or `architecture-trd.md`.** If something is missing or unclear, ask the user instead of deciding.

---

## 2. Coding Principles & Standards

- Strictly follow SOLID, KISS, and DRY principles.
- **No external libraries** unless absolutely necessary and explicitly approved by the user.
- **Approved libraries (server):** `express`, `mongoose`, `cors`, `dotenv`, `jsonwebtoken`, `bcryptjs`, `cookie-parser`.
- **Approved libraries (client):** `react`, `react-router-dom`, `react-hook-form`, `zod`, `@hookform/resolvers`, `axios`, `tailwindcss`.
- **TypeScript Rules:** Never implement a function, prop, or variable in the frontend without defining its type or interface.

### Naming Conventions

| Item                                          | Convention                         | Example                          |
| --------------------------------------------- | ---------------------------------- | -------------------------------- |
| React Components                              | PascalCase                         | `DefenseCard.tsx`                |
| Custom Hooks                                  | camelCase, starting with `use`     | `useAxiosFetch.ts`               |
| Functions, Variables                          | camelCase                          | `getPanelSuggestions`            |
| Database fields, JSON keys, query params      | camelCase                          | `maxDefensesPerDay`, `startTime` |
| API endpoint paths                            | lowercase plural nouns             | `/api/defenses/:id/evaluations`  |
| Mongoose models                               | PascalCase, singular               | `Defense`                        |

---

## 3. Commenting & Formatting Rules

- **Comments:** Must be a one-liner and exactly one sentence.
- **NO EMOJIS:** Absolutely no emojis or special characters in comments, console logs, or code strings.
- Output full, functional code for the requested module. Do not use generic placeholders like `// Add logic here`.

---

## 4. Architecture & Implementation Hard Rules

- **Validation Standards:** Always use Zod for frontend forms and Mongoose validation rules (with min/max/enum) for the backend.
- **Error Handling Standards:** The backend must always return consistent JSON objects for errors (e.g., `{ "message": "Record not found" }`) and use a centralized error handler. Controllers throw `new AppError(message, statusCode)` inside `asyncHandler` and never send error responses manually. Business-rule violations (room or panelist conflict, invalid panel, invalid status transition, removing the last coordinator) return 400; missing or invalid login returns 401; insufficient role or ownership returns 403; missing records return 404.
- **State Management:** Derived values must be computed during render, **NOT** stored in React state.
- **Security Practices:** Never hardcode credentials or secrets. Always assume `MONGO_URI`, `PORT`, and `JWT_SECRET` are handled via `.env` files.
- **Authentication Rules:** Store the JWT only in an httpOnly cookie, never in localStorage. Never return `password` in any response. There is no public sign-up; only a coordinator creates accounts. Always take the acting user (coordinator, panelist, or student) from `req.user`, never from the request body.
- **Role Rules:** Faculty hold `roles` of `panelist` and optionally `coordinator`. Coordinator-only routes use `restrictTo('coordinator')`; a panelist may act only on defenses they are assigned to; a student is read only and sees only their own group's data. The last remaining coordinator can never be demoted or deleted.
- **Route Order:** Register static routes (`/me`, `/mine`, `/availability`, `/overview`) before `/:id` routes.
- **Data Rendering:** Always use stable database `_id` values as keys when mapping lists in React, never the array index.
- **Repository:** One GitHub repository with `client` and `server` folders; each member commits with their own GitHub account, in small meaningful commits; never commit `node_modules` or `.env`.
- **Frontend Data Screens:** Every screen that loads data must show loading, error, and empty states; every create, update, and delete must show success feedback; every delete must have a confirmation step.
