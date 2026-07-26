# AI Job Portal — Phase 0 (Foundation)

This is the skeleton only. No features yet — just a server that runs, a
frontend that renders, and both talking to each other over `/api/v1/health`.

## Setup

### 1. Backend
```
cd server
npm install
cp .env.example .env
```
Then edit `.env`:
- `MONGO_URI` — get this from MongoDB Atlas (free tier): create a cluster,
  add a database user, whitelist your IP (or 0.0.0.0/0 for dev), copy the
  connection string.
- Leave the JWT secrets as-is for now, we use them starting Phase 1.

Run it:
```
npm run dev
```
You should see `Server running in development mode on port 5000` and
`MongoDB connected: ...` in the terminal.

### 2. Frontend
```
cd client
npm install
cp .env.example .env
npm run dev
```
Open http://localhost:5173 — it should show "Backend status: Server is
healthy" if both are running and connected correctly.

## What's in here
- `server/` — Express + MongoDB backend, layered as
  `routes → controllers → services → models`, with a global error handler
  and consistent JSON response shape already wired up.
- `client/` — Vite + React + Tailwind + React Router + Axios, structured by
  feature (folders get added under `src/features/` as we build).

## What's NOT in here yet
No auth, no database schemas beyond the connection, no real pages. That's
Phase 1 onward — built one feature at a time, one file at a time, with your
confirmation before moving forward.
