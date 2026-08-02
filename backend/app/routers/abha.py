import re
import secrets
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models import User
from ..schemas import AbhaLinkRequest, UserOut

router = APIRouter(prefix="/api/abha", tags=["abha"])

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
):
    """Single-step mock ABHA enrollment (replaces the real multi-step ABDM OTP
    flow, which rejects requests from non-India server regions)."""
    if not _AADHAAR_RE.match(payload.aadhaarNumber or ""):
        return _abha_envelope(400, "Aadhaar number must be exactly 12 digits")
    if user.abha_linked:
        return _abha_envelope(409, "This profile is already linked to an ABHA number.")

    # Credential generation per the mock service spec:
    # 91-XXXX-XXXX-XXXX and <sanitized_name><suffix>@sbx
    chunks = [str(secrets.randbelow(9000) + 1000) for _ in range(3)]
    abha_number = f"91-{chunks[0]}-{chunks[1]}-{chunks[2]}"
    sanitized = re.sub(r"[^a-z0-9]", "", user.name.lower()) or "user"
    abha_address = f"{sanitized}{chunks[2]}@sbx"

    user.abha_number = abha_number.replace("-", "")
    user.abha_address = abha_address
    user.abha_linked = True
    db.commit()

    return _abha_envelope(200, "ABHA card linked successfully.", {
        "abhaNumber": abha_number,
        "abhaAddress": abha_address,
        "name": user.name,
        "isNew": True,
        "profile_id": payload.profile_id or str(user.id),
    })


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
def unlink_abha(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    user.abha_number = None
    user.abha_address = None
    user.abha_linked = False
    db.commit()
    db.refresh(user)
    return UserOut.model_validate(user)
