# Technical Requirements & Architecture Document (TRD)

**Project:** DefenseDesk

---

## 1. System Architecture

**Pattern:** Client-Server Architecture

The system is divided into two decoupled apps (`client` and `server` folders in a single GitHub repository) communicating via a REST API:

1. **Client (Frontend):** Handles UI, state management, and client-side validation.
2. **Server (Backend):** Handles authentication, role checks, business logic, complex data processing, and database transactions.

---

## 2. Technical Stack

### Frontend

| Concern                     | Technology                                                        |
| --------------------------- | ----------------------------------------------------------------- |
| Framework                   | React (built with Vite) using TypeScript                          |
| Styling                     | Tailwind CSS (custom theme with a deliberate color palette)       |
| Routing                     | React Router DOM v6+                                              |
| Form Handling & Validation  | React Hook Form + Zod (`z.infer` for types)                       |
| API Client                  | Axios (single configured instance with `baseURL` and `withCredentials: true`) |

### Backend

| Concern        | Technology                                                  |
| -------------- | ----------------------------------------------------------- |
| Runtime        | Node.js                                                     |
| Framework      | Express.js                                                  |
| Database       | MongoDB Atlas                                               |
| ODM            | Mongoose (strict schemas with timestamps and validation)    |
| Auth           | `jsonwebtoken` (JWT), `bcryptjs` (password hashing), `cookie-parser` (read cookies) |
| Other          | `cors`, `dotenv`                                            |

---

## 3. Design Methodology

- **Backend:** Layered Architecture focusing on separated Routes, Controllers, and Models.
- **Frontend:** Feature-based Component Architecture.

---

## 4. Context & Folder Structure (AI Agent Guide)

> **AI Instructions:** Strictly follow this folder structure when generating or updating files. Do not create monolithic files.

### Repository Layout (single GitHub repository)

```text
defensedesk/
├── client/            # React app (see A)
├── server/            # Express app (see B)
├── .gitignore         # Ignores node_modules, .env, dist
└── README.md          # Title, members, concept, screenshots, setup, API table, limitations
```

### A. Client (`/client`)

```text
src/
├── assets/            # Static files like NU logos and custom icons
├── components/        # Reusable UI components
│   ├── common/        # Buttons, Inputs, Cards, Loaders, ConfirmDialog, EmptyState, Toast
│   ├── layout/        # Navbar (with role switch), Sidebar, Footer, PageWrappers, ProtectedRoute
│   └── features/      # Feature-specific components (e.g., DefenseCard, GroupCard, PanelSuggestionList, SlotPicker)
├── context/
│   └── AuthContext.tsx  # Holds the logged-in user restored from /api/auth/me and the active view (coordinator or panelist)
├── hooks/             # Custom hooks (e.g., useAuth, useAxiosFetch)
├── lib/
│   └── axios.ts       # Single axios.create instance (baseURL + withCredentials: true)
├── pages/             # Route-level components (12 pages plus NotFound)
│   ├── Landing/       # Public landing page (/)
│   ├── Auth/          # Login page
│   ├── Dashboard/     # Role-based dashboard (coordinator statistics)
│   ├── Accounts/      # Accounts List and Account Form (create/edit)
│   ├── Groups/        # Groups List and Group Form (create/edit)
│   ├── Defenses/      # Defense Calendar and Schedule Defense
│   ├── Rooms/         # Rooms
│   ├── Assignments/   # My Assignments and Evaluation Form (panelist)
│   ├── MyDefense/     # My Defense (student, read only)
│   └── NotFound/      # 404 page
├── schemas/           # Zod validation schemas, separated from components
├── types/             # Global TypeScript interfaces and types
├── App.tsx            # Main component containing React Router configuration
├── main.tsx           # Vite entry point
└── index.css          # Tailwind directives and custom variables
```

### B. Server (`/server`)

```text
server/                    # Server root
├── controllers/           # Business logic, separated from routes
│   ├── authController.js      # login, logout, me, change password
│   ├── userController.js      # list, get, create, update, delete, update roles
│   ├── groupController.js     # CRUD, panel suggestions
│   ├── roomController.js      # list, create, update, delete
│   ├── defenseController.js   # CRUD, availability, mine, status change
│   ├── evaluationController.js # submit and list evaluations
│   └── statsController.js     # overview statistics
├── middlewares/           # Custom middleware functions
│   ├── auth.js            # protect (verify JWT cookie) and restrictTo (role check)
│   ├── errorHandler.js    # Centralized JSON error handler (AppError, Mongoose validation, CastError, duplicate key -> 400; else 500)
│   ├── logger.js          # Request logger middleware
│   └── notFound.js        # JSON 404 catch-all
├── models/                # Mongoose schemas with validation and timestamps
│   ├── User.js
│   ├── Group.js
│   ├── Room.js
│   ├── Defense.js
│   └── Evaluation.js
├── routes/                # express.Router() definitions mapping paths to controllers
│   ├── authRoutes.js
│   ├── userRoutes.js
│   ├── groupRoutes.js
│   ├── roomRoutes.js
│   ├── defenseRoutes.js
│   ├── evaluationRoutes.js
│   └── statsRoutes.js
├── utils/                 # Helper functions (e.g., processing logic, formatting)
│   ├── AppError.js        # Error class carrying a message and statusCode
│   ├── asyncHandler.js    # Wraps async controllers so errors reach errorHandler
│   ├── generateToken.js   # Sign JWT and set the httpOnly cookie
│   └── seedData.js        # Script to inject initial sample data
├── .env.example           # Example environment variables (to be committed)
├── app.js                 # Clean entry file containing ONLY config and mounting
└── package.json
```

### C. Required Middleware Order in `app.js`

1. `cors` (exact client origin, `credentials: true`)
2. `express.json()`
3. `cookieParser()`
4. `logger`
5. Routers (`/api/auth`, `/api/users`, `/api/groups`, `/api/rooms`, `/api/defenses`, `/api/evaluations`, `/api/stats`)
6. `notFound`
7. `errorHandler`

---

## 5. Security & Technical Constraints

- **CORS:** Must be explicitly configured in Express to allow requests only from the deployed frontend/localhost URL, with `credentials: true` (wildcard origin is not allowed with cookies).
- **Environment Variables:** `PORT`, `MONGO_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, and `CLIENT_URL` must be stored in a `.env` file. This file must be added to `.gitignore` and never committed; `.env.example` is committed.
- **Authentication:** JWT is stored in an httpOnly cookie (never in localStorage) with `sameSite: 'lax'`, `secure: true` in production, and a matching expiry. Passwords are hashed with bcryptjs and never returned in responses (`select: false`). Cross-domain deployment would require `sameSite: 'none'` with `secure: true`.
- **Authorization:** `protect` middleware rejects missing or invalid tokens with 401; `restrictTo('coordinator')` and assigned-panelist checks reject with 403. The acting user is always taken from `req.user`, never from the request body.
- **Accounts:** There is no public sign-up. A coordinator creates accounts and a temporary password is returned once; `mustChangePassword` stays true until the user changes it.
- **Roles:** The last remaining coordinator can never be demoted or deleted.
- **Data Rendering:** Derived values (e.g., average score, workload counts) must be computed during render, **NOT** stored in React state.
- **Stable IDs:** Lists in React must be rendered using `map()` with stable database IDs (`_id`) as keys, never using the array index.
- **Error Handling:** Server must return consistent JSON objects for errors (e.g., `{ "message": "Invalid ID format" }`). Business-rule violations, Mongoose validation errors, invalid ObjectIds (`CastError`), and duplicate keys all map to `400 Bad Request`. See Section 6.

---

## 6. Error Handling Pattern (how to return 400)

Controllers never build error responses by hand; they throw an `AppError` and the centralized handler formats the JSON.

```js
// utils/AppError.js
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}
module.exports = AppError;
```

```js
// utils/asyncHandler.js
module.exports = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
```

```js
// middlewares/errorHandler.js
const errorHandler = (err, req, res, next) => {
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map((e) => e.message).join(', ');
    return res.status(400).json({ message });
  }
  if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid ID format' });
  if (err.code === 11000) return res.status(400).json({ message: 'Duplicate value not allowed' });
  const status = err.statusCode || 500;
  res.status(status).json({ message: status === 500 ? 'Internal server error' : err.message });
};
module.exports = errorHandler;
```

```js
// controllers/defenseController.js (example of a business-rule 400)
const overlapping = await Defense.findOne({
  room: req.body.room,
  startTime: { $lt: req.body.endTime },
  endTime: { $gt: req.body.startTime },
});
if (overlapping) throw new AppError('Room is already booked for that time', 400);
```

| Situation                                   | Status |
| ------------------------------------------- | ------ |
| Success (read, update, delete, status change) | 200  |
| Created (account, group, room, defense, evaluation) | 201 |
| Validation error, bad ID, room or panelist conflict, invalid panel, daily limit exceeded, invalid status transition, last coordinator removal, deleting a record still in use, duplicate evaluation | 400 |
| Not logged in or invalid token              | 401    |
| Wrong role or not assigned to the defense   | 403    |
| Record not found, unknown route             | 404    |
| Unexpected server error                     | 500    |
