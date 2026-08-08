"""In-memory rate limiting for the authentication endpoints.

A sliding-window counter per (bucket, client IP, optional key). In-memory is
the right size for this deployment: a single backend instance, and the goal
is blunting brute force on login/reset — not distributed quota accounting.
"""

import time
from collections import defaultdict, deque

from fastapi import HTTPException, Request

_BUCKETS: dict[str, deque] = defaultdict(deque)

RATE_MESSAGE = "Too many attempts. Please wait a few minutes and try again."


def client_ip(request: Request) -> str:
    # Render terminates TLS at its edge; the client lands in X-Forwarded-For.
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def check_rate(request: Request, bucket: str, limit: int, window_seconds: int, key: str = "") -> None:
    """Raise 429 when more than `limit` calls hit this bucket within the window."""
    slot = f"{bucket}:{client_ip(request)}:{key.lower()}"
    now = time.monotonic()
    q = _BUCKETS[slot]
    while q and now - q[0] > window_seconds:
        q.popleft()
    if len(q) >= limit:
        raise HTTPException(status_code=429, detail=RATE_MESSAGE)
    q.append(now)
