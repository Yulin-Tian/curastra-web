import re
import secrets
from typing import Optional

import httpx
from fastapi import APIRouter, Depends, Header, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from sqlalchemy import select

from ..auth import get_current_user
from ..config import settings
from ..database import get_db
from ..models import Profile, User
from ..profile_scope import ensure_primary_profile, get_active_profile
from ..schemas import AbhaLinkRequest, UserOut

router = APIRouter(prefix="/api/abha", tags=["abha"])


def _real_service() -> bool:
    return bool(settings.abha_service_url)


# Raw upstream/axios/gateway messages we never want to show a patient. When
# any of these fragments appears, we substitute clean guidance instead.
_TECHNICAL_FRAGMENTS = (
    "request failed with status",
    "econnrefused",
    "etimedout",
    "socket hang up",
    "network error",
    "internal server error",
    "cannot read propert",
    "undefined",
    "exception",
    "traceback",
    "axioserror",
)


def _friendly_message(status_code: int, raw: str) -> str:
    """Turn a possibly-technical upstream message into patient-facing text."""
    low = (raw or "").strip().lower()
    if not low or any(frag in low for frag in _TECHNICAL_FRAGMENTS):
        # Axios wraps the ABDM gateway's status inside the message ("Request
        # failed with status code 422"); that inner code is more truthful
        # about the cause than whatever outer status the wrapper chose.
        embedded = re.search(r"status code (\d{3})", low)
        effective = int(embedded.group(1)) if embedded else status_code
        if effective == 422:
            return ("This Aadhaar could not be enrolled. It may already be linked "
                    "to an existing ABHA account, or the details did not match "
                    "ABDM records. Please verify and try again.")
        if effective == 400:
            return ("We could not start ABHA enrollment for this Aadhaar number. "
                    "Please check the number and try again.")
        if effective in (502, 503, 504):
            return "The ABHA service is busy right now. Please try again in a moment."
        return "ABHA enrollment could not be completed. Please try again."
    return raw  # a genuine, human-readable message from upstream — keep it


def _forward(path: str, payload: dict, authorization: str | None):
    """Proxy a call to the real ABHA microservice, forwarding the user's own
    bearer token (the services share a JWT secret). Upstream error messages
    are sanitised so raw gateway/axios strings never reach the user."""
    try:
        resp = httpx.post(
            f"{settings.abha_service_url}{path}",
            headers={"Authorization": authorization or "", "Content-Type": "application/json"},
            json=payload,
            timeout=60,
        )
    except httpx.HTTPError:
        return _abha_envelope(502, "The ABHA service is unreachable right now. Please try again.")
    try:
        body = resp.json()
    except ValueError:
        return _abha_envelope(502, "The ABHA service returned an unexpected response.")

    # On error, clean the message; on success pass the body through untouched.
    if resp.status_code >= 400 or body.get("success") is False:
        raw = body.get("message") or body.get("error") or ""
        return _abha_envelope(resp.status_code if resp.status_code >= 400 else 400,
                              _friendly_message(resp.status_code, raw))
    return JSONResponse(status_code=resp.status_code, content=body)

_AADHAAR_RE = re.compile(r"^\d{12}$")


class EnrollInitiateRequest(BaseModel):
    # Contract by A. Pawar's mock ABHA service (gist, Aug 2026). profile_id is
    # optional there too: his service falls back to the caller's primary
    # profile, which in this backend is the user account itself.
    aadhaarNumber: str
    profile_id: Optional[str] = None


def _abha_envelope(status_code: int, message: str, data: dict | None = None):
    """This endpoint speaks the mock-ABHA service's response envelope
    ({success, message, data}) rather than the app-wide {error} shape, so the
    contract matches A. Pawar's specification exactly."""
    body: dict = {"success": status_code < 400, "message": message}
    if data is not None:
        body["data"] = data
    return JSONResponse(status_code=status_code, content=body)


@router.post("/enroll/initiate")
def enroll_initiate(
    payload: EnrollInitiateRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    active: Profile | None = Depends(get_active_profile),
    authorization: str | None = Header(None),
):
    """ABHA enrollment step 1 for the ACTIVE profile.

    With ABHA_SERVICE_URL set, this proxies to the real India-hosted ABDM
    gateway service (returns a txnId; an OTP goes to the Aadhaar-linked
    mobile). Otherwise the built-in mock links instantly."""
    if not _AADHAAR_RE.match(payload.aadhaarNumber or ""):
        return _abha_envelope(400, "Aadhaar number must be exactly 12 digits")

    if _real_service():
        target = active or ensure_primary_profile(user, db)
        if target.abha_linked:
            return _abha_envelope(409, "This profile is already linked to an ABHA number.")
        return _forward("/api/abha/enroll/initiate", {"aadhaarNumber": payload.aadhaarNumber}, authorization)

    target = active or ensure_primary_profile(user, db)
    if target.abha_linked:
        return _abha_envelope(409, "This profile is already linked to an ABHA number.")

    # Credential generation per the mock service spec:
    # 91-XXXX-XXXX-XXXX and <sanitized_name><suffix>@sbx
    chunks = [str(secrets.randbelow(9000) + 1000) for _ in range(3)]
    abha_number = f"91-{chunks[0]}-{chunks[1]}-{chunks[2]}"
    sanitized = re.sub(r"[^a-z0-9]", "", target.name.lower()) or "user"
    abha_address = f"{sanitized}{chunks[2]}@sbx"

    target.abha_number = abha_number.replace("-", "")
    target.abha_address = abha_address
    target.abha_linked = True
    if target.is_primary:  # keep the legacy user fields in step for 'self'
        user.abha_number = target.abha_number
        user.abha_address = abha_address
        user.abha_linked = True
    db.commit()

    return _abha_envelope(200, "ABHA card linked successfully.", {
        "abhaNumber": abha_number,
        "abhaAddress": abha_address,
        "name": target.name,
        "isNew": True,
        "profile_id": str(target.id),
    })


class EnrollVerifyRequest(BaseModel):
    txnId: str
    otp: str
    mobileNumber: str


@router.post("/enroll/verify")
def enroll_verify(
    payload: EnrollVerifyRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    active: Profile | None = Depends(get_active_profile),
    authorization: str | None = Header(None),
):
    """ABHA enrollment step 2 (real service only): verify the OTP; on success
    the returned credentials are persisted to the active profile."""
    if not _real_service():
        return _abha_envelope(400, "OTP verification is not part of the mock enrollment.")

    result = _forward(
        "/api/abha/enroll/verify",
        {"txnId": payload.txnId, "otp": payload.otp, "mobileNumber": payload.mobileNumber},
        authorization,
    )
    if result.status_code == 200:
        import json

        data = json.loads(bytes(result.body)).get("data", {})
        abha_number = (data.get("abhaNumber") or "").replace("-", "")
        if abha_number:
            # ABHA uniqueness (the README requires the calling backend to
            # enforce this): reject a number already linked to any other
            # profile, so an Aadhaar cannot be double-registered.
            clash = db.scalar(
                select(Profile).where(Profile.abha_number == abha_number)
            )
            if clash is not None:
                return _abha_envelope(
                    409, "This ABHA number is already linked to another Curastra profile."
                )
            target = active or ensure_primary_profile(user, db)
            target.abha_number = abha_number
            target.abha_address = data.get("abhaAddress")
            target.abha_linked = True
            if target.is_primary:
                user.abha_number = abha_number
                user.abha_address = data.get("abhaAddress")
                user.abha_linked = True
            db.commit()
    return result


@router.post("/link", response_model=UserOut)
def link_abha(payload: AbhaLinkRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Mock ABHA linking.

    A production build would go through the ABDM sandbox (Aadhaar OTP flow).
    Here we validate the shape of the ABHA number and store the linkage, which
    is enough to demonstrate the continuity-of-care flow end to end.
    """
    digits = payload.abha_number.replace("-", "").strip()
    if not (digits.isdigit() and len(digits) == 14):
        raise HTTPException(status_code=400, detail="ABHA number must be 14 digits.")

    user.abha_number = digits
    user.abha_address = payload.abha_address.strip()
    user.abha_linked = True
    db.commit()
    db.refresh(user)
    return UserOut.model_validate(user)


@router.post("/unlink", response_model=UserOut)
def unlink_abha(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    active: Profile | None = Depends(get_active_profile),
):
    target = active or ensure_primary_profile(user, db)
    target.abha_number = None
    target.abha_address = None
    target.abha_linked = False
    if target.is_primary:
        user.abha_number = None
        user.abha_address = None
        user.abha_linked = False
    db.commit()
    db.refresh(user)
    return UserOut.model_validate(user)
