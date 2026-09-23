# Mock Interview Management Application

A full-stack application for preparing, conducting, and
reviewing mock technical interviews.

## Live Application

- Frontend: https://...
- API health: https://...
- Repository: https://...

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
- Vercel
- Render
- GitHub

## Local Setup

### Prerequisites

- Node.js
- npm
- PostgreSQL

### Database

1. Create a PostgreSQL database.
2. Execute `server/database/schema.sql`.
3. Copy `server/.env.example` to `server/.env`.
4. Configure `DATABASE_URL`.

### Backend

```bash
cd server
npm install
npm run dev
