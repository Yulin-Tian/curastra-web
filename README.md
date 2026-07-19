# Curastra Web

The web application for **Curastra** (AI-Augmented Personal Health Assistant,
BITS Capstone Group 110): a React frontend and a FastAPI main backend that
delegates all OCR/AI work to the separate, unchanged **Active Care Engine**.

```
React web app (5173)  ->  this backend (3000)  ->  Active Care Engine (8000)
      frontend/               backend/               (separate repo)
```

The engine's HTTP contract (X-Internal-Key auth, 60 s timeout, `{ "error": … }`
error shape) is consumed exactly as designed — the platform pivot from Android
to web required **zero engine changes**.

## Features

- Register / login (JWT), profile, mock ABHA linking
- Health records: upload photos/PDFs/documents (stored in the database)
- **OCR with human-in-the-loop review** — extracted text must be read,
  corrected, and confirmed by the user before any AI feature uses it
- After-care plan generation (medications, tasks, red flags, clarifications)
- "Explain in simple words" with read-aloud (browser speech synthesis)
- Lab report analysis with color-coded out-of-range flags
- Medication list with cross-medication safety alerts
- Vitals logging with AI health insights
- Context-aware AI chatbot (multi-turn, red "seek help" banner on
  `advised_see_doctor`, persistent history)

Every AI result shows its disclaimer; every AI action has loading, error, and
empty states.

## Run locally

Three terminals:

```bash
# 1. Active Care Engine (its own repo)
cd active_care_engine
.venv\Scripts\python.exe -m uvicorn app.api_server:app --port 8000

# 2. Backend
cd backend
py -3.12 -m venv .venv          # first time
.venv\Scripts\python.exe -m pip install -r requirements.txt
copy .env.example .env
.venv\Scripts\python.exe -m uvicorn app.main:app --port 3000

# 3. Frontend
cd frontend
npm install                     # first time
npm run dev                     # -> http://localhost:5173
```

The Vite dev server proxies `/api` to port 3000, so no CORS setup is needed in
development.

## Tests

```bash
cd backend
.venv\Scripts\python.exe tests\smoke_test.py    # core API, no engine needed
.venv\Scripts\python.exe tests\e2e_local.py     # full chain, engine must run
```

## Deployment (Render)

Three services + one database:

| Service  | Type                  | Notes                                        |
|----------|-----------------------|----------------------------------------------|
| engine   | Docker web service    | its own repo's Dockerfile (Tesseract+Poppler)|
| backend  | Python web service    | build `pip install -r requirements.txt`, start `uvicorn app.main:app --host 0.0.0.0 --port $PORT`, root dir `backend` |
| frontend | Static site           | build `npm run build`, publish `dist`, root dir `frontend`, rewrite `/*` -> `/index.html` |
| Postgres | Render free tier      | set its URL as backend `DATABASE_URL`        |

Backend env vars on Render: `DATABASE_URL`, `JWT_SECRET` (long random),
`AI_ENGINE_URL` (engine's public URL), `INTERNAL_API_KEY` (must match the
engine's, **non-empty**), `CORS_ORIGINS` (the static site URL).
Frontend env var at build time: `VITE_API_URL` (the backend's public URL).

## Safety design

- The app never diagnoses, prescribes, or changes dosages.
- OCR text is user-verified before any AI consumes it (human-in-the-loop).
- AI disclaimers are always visible; emergencies are escalated to a visible
  "seek medical help" banner.
