# Curastra — everyday care, continued

[![CI](https://github.com/Yulin-Tian/curastra-web/actions/workflows/ci.yml/badge.svg)](https://github.com/Yulin-Tian/curastra-web/actions/workflows/ci.yml)

**Live at [curastra.app](https://curastra.app)** · English / हिन्दी

Curastra is an AI-augmented personal health assistant for the moment care most
often breaks down: after the consultation. Bring a prescription — a photo, a
PDF, a document — review the extracted text yourself, and it becomes a
structured after-care plan that follows the prescription's own course, day by
day, until the app asks the question that matters: *are you feeling better?*

## What it does

- **Prescription → care plan**: OCR with a mandatory human review step; no AI
  ever acts on text the patient hasn't confirmed.
- **Treatment lifecycle**: plans start on explicit confirmation, run a strict
  course window parsed from the prescription, track daily adherence on an
  interactive calendar (ticks lock after 5 minutes, for safety), and close
  with an end-of-course check-in — pushed to your device when the course ends.
- **Medications** with AI safety alerts (duplicates, interactions), **vitals**
  with trends and insights, and a **context-grounded assistant** available on
  every page — with voice input, in English or Hindi.
- **Family care**: separate, themed profiles for children and parents, each
  with its own records, plans, medicines, and ABHA linkage (real
  Aadhaar-initiated enrollment via the ABDM sandbox gateway).
- **Sharing & emergencies**: revocable read-only links for doctors and family;
  a printable emergency card with confirmed one-tap calling of 112 or the
  saved contact.
- **Data rights**: consent recorded at registration, one-click full data
  export (JSON), and account deletion behind credential re-proof.
- **Admin console**: metadata-only platform oversight (totals, user segments,
  activity trends, service health) gated by server configuration.

## Architecture

```
React 19 + TypeScript (static site)          FastAPI + PostgreSQL              FastAPI + Docker
        frontend/                    ──▶          backend/              ──▶    Active Care Engine
  curastra.app (Render)                    JWT auth, all persistence           OCR + OpenAI (separate repo)
```

Deployed on Render from the `render.yaml` blueprint; every push to `main`
runs CI (the backend smoke suite plus a production frontend build) and
auto-deploys. The engine keeps its original HTTP contract (X-Internal-Key
auth, `{ "error": … }` shape) — the platform pivot from Android to web
required zero engine changes.

## Security

bcrypt password hashing with a strength policy · optional TOTP two-factor ·
brute-force rate limiting on all auth endpoints · strict security headers and
CSP on both tiers · single-use hashed recovery codes without account
enumeration · per-account isolation covered by tests · clean dependency
audits (npm audit, pip-audit) · error tracking via Sentry when `SENTRY_DSN`
is set.

## Safety design

- The app never diagnoses, prescribes, or changes dosages; refusals and
  emergency escalation are tested behaviours, not prompts alone.
- OCR text is user-verified before any AI consumes it (human-in-the-loop).
- Every AI result carries its disclaimer; possible emergencies raise a
  visible "seek medical help" banner.

## Running locally

```bash
# backend (terminal 1)
cd backend
py -3.12 -m venv .venv && .venv\Scripts\activate     # first time
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --port 3000

# frontend (terminal 2)
cd frontend
npm ci
npm run dev                                          # -> http://localhost:5173

# tests
cd backend
python tests/smoke_test.py        # core API suite, no engine needed
python tests/e2e_local.py         # full chain, engine must run
```

The Vite dev server proxies `/api` to port 3000; the AI engine runs
separately (its own repository) and everything else degrades gracefully
without it.

## Deployment (Render)

| Service  | Type               | Notes                                              |
|----------|--------------------|----------------------------------------------------|
| frontend | Static site        | `npm run build` → `dist`, SPA rewrite, security headers via blueprint |
| backend  | Python web service | `uvicorn app.main:app`, health check `/health`     |
| engine   | Docker web service | its own repo (Tesseract + Poppler + OpenAI)        |
| Postgres | Managed database   | `DATABASE_URL` into the backend                    |

Backend env vars: `DATABASE_URL`, `JWT_SECRET`, `AI_ENGINE_URL`,
`INTERNAL_API_KEY` (must match the engine's), `CORS_ORIGINS`, plus optional
`ADMIN_EMAILS`, `SENTRY_DSN`, `RESEND_API_KEY`, VAPID keys for Web Push, and
`CRON_SECRET` for the hourly reminder dispatcher.

---

Built by Yulin Tian (AI & product) with Anurag Pawar (ABHA gateway service) —
BITS Pilani BSc CS capstone, 2026. **Not a medical device.**
