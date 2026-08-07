"""HTTP client for the Active Care Engine.

The engine is a separate stateless FastAPI service (OCR + LLM). This backend
owns all persistence and calls the engine synchronously per request, matching
the integration contract: X-Internal-Key auth, 60 s timeout, and a friendly
fallback error when the engine is unreachable (e.g. Render cold start gone
wrong or the service being down).
"""

import time
from typing import Any

import httpx
from fastapi import HTTPException

from ..config import settings

_TIMEOUT = httpx.Timeout(90.0, connect=30.0)

# When the free-tier engine is asleep, its first request can bounce off the
# host's edge while the instance boots (~20-30s). One patient retry turns
# that cold-start error into a slow-but-successful call.
_COLD_START_RETRY_DELAY = 12.0

FALLBACK_MESSAGE = "The AI assistant is temporarily unavailable. Please try again in a minute."


def _headers() -> dict:
    headers = {}
    if settings.internal_api_key:
        headers["X-Internal-Key"] = settings.internal_api_key
    return headers


def _try_post(url: str, **kwargs) -> httpx.Response | None:
    """One attempt; None signals a retryable failure (network or 5xx)."""
    try:
        with httpx.Client(timeout=_TIMEOUT) as client:
            resp = client.post(url, headers=_headers(), **kwargs)
    except httpx.HTTPError:
        return None
    return None if resp.status_code >= 500 else resp


def _post(path: str, **kwargs) -> dict:
    url = f"{settings.ai_engine_url.rstrip('/')}{path}"
    resp = _try_post(url, **kwargs)
    if resp is None:
        time.sleep(_COLD_START_RETRY_DELAY)
        resp = _try_post(url, **kwargs)
    if resp is None:
        raise HTTPException(status_code=503, detail=FALLBACK_MESSAGE)
    if resp.status_code >= 400:
        # Engine 4xx = our request was wrong; surface its message.
        try:
            message = resp.json().get("error", "AI engine rejected the request.")
        except ValueError:
            message = "AI engine rejected the request."
        raise HTTPException(status_code=resp.status_code, detail=message)
    return resp.json()


def extract(file_name: str, file_bytes: bytes, mime_type: str) -> dict:
    """OCR/text-extract an uploaded document via multipart /v1/extract."""
    files = {"file": (file_name, file_bytes, mime_type or "application/octet-stream")}
    return _post("/v1/extract", files=files)


def generate_care_plan(file_name: str, verified_text: str, user_notes: str | None = None) -> dict:
    payload: dict[str, Any] = {"file_name": file_name, "verified_text": verified_text}
    if user_notes:
        payload["user_notes"] = user_notes
    return _post("/v1/generate", json=payload)


def simplify(text: str, language: str = "en") -> dict:
    return _post("/v1/simplify", json={"text": text, "language": language})


def lab_analyze(verified_text: str, language: str = "en") -> dict:
    return _post("/v1/lab-analyze", json={"verified_text": verified_text, "language": language})


def med_safety(medications: list[dict], language: str = "en") -> dict:
    return _post("/v1/med-safety", json={"medications": medications, "language": language})


def insights(user_id: str, vitals_history: list[dict], adherence: list[dict], language: str = "en") -> dict:
    return _post(
        "/v1/insights",
        json={"user_id": user_id, "vitals_history": vitals_history, "adherence": adherence,
              "language": language},
    )


def chat(user_id: str, message: str, context: dict | None, history: list[dict], language: str = "en") -> dict:
    return _post(
        "/v1/chat",
        json={"user_id": user_id, "message": message, "context": context, "history": history,
              "language": language},
    )
