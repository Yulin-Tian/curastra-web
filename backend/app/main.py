"""Curastra main backend (web).

Owns users, records, care plans, medications, vitals, and chat history.
Delegates all OCR/AI work to the Active Care Engine over HTTP (see
services/engine_client.py). Serves the React web frontend's API.

    Web app  ->  this backend (port 3000)  ->  Active Care Engine (port 8000)
"""

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from .config import settings
from .database import Base, engine
from .routers import abha, ai, auth_routes, care_plans, chat, medications, records, vitals

app = FastAPI(title="Curastra Backend", version="1.0")

# Dev-friendly table creation; on Render's fresh Postgres this bootstraps the
# schema on first boot.
Base.metadata.create_all(bind=engine)

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(settings.cors_origins),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------------------------------------------------------------------- #
# Error shape: { "error": "<message>" } — the same convention the engine uses,
# so the frontend handles failures from either service identically.
# --------------------------------------------------------------------------- #
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(status_code=exc.status_code, content={"error": str(exc.detail)})


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    first = exc.errors()[0] if exc.errors() else {}
    field = ".".join(str(p) for p in first.get("loc", []) if p != "body")
    message = f"{field}: {first.get('msg', 'invalid input')}" if field else "Invalid input."
    return JSONResponse(status_code=422, content={"error": message})


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    return JSONResponse(status_code=500, content={"error": "Internal server error."})


@app.get("/health")
async def health():
    return {"status": "ok", "service": "curastra-backend", "version": app.version}


app.include_router(auth_routes.router)
app.include_router(abha.router)
app.include_router(records.router)
app.include_router(care_plans.router)
app.include_router(medications.router)
app.include_router(vitals.router)
app.include_router(chat.router)
app.include_router(ai.router)
