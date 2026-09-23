# Mock Interview Management Application

A full-stack application for preparing, conducting, and
reviewing mock technical interviews.

## Live Application

- Frontend: https://frontend-production-4321.up.railway.app/sessions
- API health: https://backend-production-e935.up.railway.app/api/health
- Repository: https://github.com/SergiuSPT/MagnaInterview

## Features

- Interview session management
- Candidate and interviewer tracking
- Schedule conflict detection
- Feedback and interview outcomes
- Candidate interview history
- Search and discovery
- Progress reporting

## Technology Stack

### Frontend
- React
- Vite
- React Router
- Axios

### Backend
- Node.js
- Express
- Zod
- node-postgres

### Database
- PostgreSQL

### Deployment
- Railway
- GitHub

## Local Setup

### Prerequisites

- Node.js 22.13+ on the 22.x line, or Node.js 24+ (compatible with the installed Vite and ESLint requirements).
- npm, included with Node.js.
- PostgreSQL and a database user allowed to create tables and enable `pgcrypto`.

Run the following commands from the repository root unless a different directory is shown. The client and server have separate dependencies; there is no root-level start command. On Windows, use `npm.cmd` if PowerShell blocks `npm.ps1`.

### Environment configuration

Create `server/.env` manually; an `.env.example` file is not currently included:

```dotenv
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/magna_interview
JWT_SECRET=replace-with-a-random-secret-at-least-32-characters-long
JWT_EXPIRES_IN=1h
```

Replace the database username and password with your local credentials. URL-encode special characters in the password. Generate a random value for `JWT_SECRET`, for example with:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

`CLIENT_URL`, `DATABASE_URL`, and a `JWT_SECRET` of at least 32 characters are required by startup validation. JWT settings are currently unused by application routes; they do not enable authentication.

Create `client/.env`:

```dotenv
VITE_API_URL=http://localhost:5000/api
```

Keep the `/api` suffix. The frontend calls the API directly; Vite does not configure an API proxy. `CLIENT_URL` must match the frontend's origin for CORS. Restart the relevant development server after changing environment values. Environment files are ignored by Git; never put secrets in `VITE_` variables, which are exposed to the browser.

### Database

1. Start PostgreSQL and create the database using pgAdmin or a SQL client:

   ```sql
   CREATE DATABASE magna_interview;
   ```

2. Configure `server/.env` as described above.
3. Install the backend dependencies and apply the schema:

   ```bash
   cd server
   npm install
   npm run db:migrate
   ```

The migration runs `server/database/schema.sql`, which creates the tables, indexes, and `pgcrypto` extension. It does not create the database itself or insert sample data. If extension creation is denied, ask your database administrator to enable `pgcrypto` in this database.

The script uses `CREATE ... IF NOT EXISTS`; rerunning it does not upgrade existing table definitions. Use a fresh database for initial setup, or apply explicit schema changes when upgrading an existing installation.

### Backend

```bash
# In the server directory, after database setup
npm run dev
```

Keep this terminal running. The API listens on `http://localhost:5000` by default. Open `http://localhost:5000/api/health` to verify both the server and database connection; a successful response contains `"success": true`. This endpoint checks connectivity, not whether every application table exists.

### Frontend

In a second terminal, starting at the repository root:

```bash
cd client
npm install
npm run dev -- --port 5173 --strictPort
```

Open `http://localhost:5173`. Using a fixed port keeps the browser origin aligned with `CLIENT_URL`. If you choose a different port, update that server setting as well.

### Build and run without development watchers

Build and preview the frontend from `client`:

```bash
npm run build
npm run preview -- --port 5173 --strictPort
```

The build output is `client/dist`. Preview is for checking the build locally. For deployment, serve that directory with a static host configured to return `index.html` for frontend routes such as `/reports` and `/participants/:id`.

Run the backend from `server`:

```bash
npm start
```

For a hosted deployment, set the backend's `DATABASE_URL`, `CLIENT_URL`, `JWT_SECRET`, `NODE_ENV=production`, and the platform's `PORT`. Set the frontend's `VITE_API_URL` to the deployed API URL ending in `/api` **before building**; changing it requires a new frontend build. Apply the database schema separately with `npm run db:migrate`.

### Checks and first-use walkthrough

Run the frontend checks from `client`:

```bash
npm run lint
npm run build
```

There is no automated application test suite yet. The server's `npm test` command is a placeholder and exits with an error.

To check the main flow manually:

1. Create two participants under **Participants**.
2. Create a session under **Sessions**, then assign one participant as a candidate and the other as an interviewer.
3. Complete the session with a score, strengths, improvement areas, and outcome.
4. Open the candidate's history and **Reports** to inspect the recorded feedback. Try the participant filter in Reports.
5. Search for the completed session using the **Completed interviews** category. Participant search currently has the schema mismatch described below.

## Assumptions Made

- The application is a shared demonstration workspace. Participants are records, not login accounts, and there is no per-user data ownership.
- A participant can act as a candidate in one session and an interviewer in another. Within one session, each participant has exactly one assignment and role.
- Scheduling is optional. Conflict detection treats a missing duration as 60 minutes, checks overlap with planned or in-progress sessions, and allows back-to-back sessions.
- Session dates are entered and displayed in the browser's local timezone and stored as PostgreSQL `TIMESTAMPTZ`. Monthly report grouping uses the database connection's timezone.
- Completing a session records feedback for one assigned candidate from one assigned interviewer. Scores are integers from 1 to 5, with required strengths, improvement areas, and outcome.
- Participant-filtered reports describe candidate participation. Completion rate is completed sessions divided by all matching sessions, including cancelled sessions in the denominator. Average scores use recorded feedback only; missing scores are shown as unavailable.
- Monthly activity counts sessions by creation month over the current and previous five months. Other report sections cover all available history; months without sessions are omitted.

## Design Decisions

- **Separate frontend and API:** React and Vite provide a client-rendered interface, while Express exposes JSON endpoints under `/api`. They can be run and deployed independently.
- **Small, feature-oriented modules:** React Router maps pages to workflows. Axios services centralize API calls, and shared forms, error displays, and the `usePageData` hook reuse common behavior. Backend routes, controllers, schemas, and configuration are kept separate.
- **Relational data model:** PostgreSQL stores sessions, participants, assignments, and feedback. UUID keys identify records; foreign keys, check constraints, and unique indexes enforce relationships and basic data rules.
- **Validation at the API boundary:** Zod validates request bodies, query parameters, and environment settings. Parameterized SQL passes user values separately from query text.
- **Transactions for related writes:** Session completion inserts feedback and updates status in one transaction with a session row lock. Participant assignment locks the participant row to serialize concurrent assignments and check schedule conflicts before inserting.
- **Server-side reports:** SQL aggregates activity, outcomes, and scores so the browser does not need to fetch all underlying records. The reports UI uses CSS bars and accessible tables without a charting dependency, and preserves the participant filter in the URL.
- **Simple search:** PostgreSQL `ILIKE` searches completed interviews, participant profiles, and feedback. This avoids a separate search service for the initial application.

## Known Limitations

- **No authentication or authorization:** API routes are publicly accessible wherever the server is exposed. CORS controls browser origins, not access permissions; JWT configuration alone provides no protection.
- **Incomplete schedule enforcement:** Conflicts are checked when assigning a participant, but editing an already assigned session's date or duration does not repeat the conflict check.
- **Limited session lifecycle:** The schema supports planned, in-progress, completed, and cancelled states, but the API currently provides creation and completion rather than a full start/cancel workflow. Completion accepts one feedback entry and then rejects another completion, even if multiple candidates are assigned.
- **No pagination or advanced search:** Session and participant lists and score history are unpaginated. Search returns at most 25 matches per category and has no relevance ranking.
- **Basic reports:** There are no custom date ranges, exports, or automatic live updates. Separate report queries do not share a database snapshot, so concurrent writes can briefly produce inconsistent totals.
- **Limited setup and verification tooling:** No seed data, environment templates, versioned migrations, or automated application tests are included. The schema bootstrap cannot evolve existing tables.

## Potential Future Improvements

- Add authentication, role-based permissions, and explicit ownership of sessions and feedback.
- Recheck scheduling conflicts on session updates and add tests for concurrent assignments and rescheduling.
- Add start/cancel actions, feedback editing, and a defined workflow for multiple candidates or reviewers.
- Add API integration and browser tests covering completion, validation, scheduling, search, and report calculations; run them with lint and build checks in CI.
- Add pagination, indexed full-text search, report date filters, CSV/PDF exports, and zero-filled monthly activity.
- Provide environment templates, sample data, and container-based local setup; add structured logs and operational monitoring for deployment.
