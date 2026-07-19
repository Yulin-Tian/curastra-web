from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models import User
from ..schemas import AbhaLinkRequest, UserOut

router = APIRouter(prefix="/api/abha", tags=["abha"])


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
