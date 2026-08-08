from typing import Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models import HealthProfile, User

router = APIRouter(prefix="/api/profile/health", tags=["health-profile"])

BLOOD_TYPES = {"A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "unknown"}


class HealthProfileIn(BaseModel):
    date_of_birth: Optional[str] = Field(None, pattern=r"^\d{4}-\d{2}-\d{2}$")
    height_cm: Optional[str] = Field(None, max_length=10)
    weight_kg: Optional[str] = Field(None, max_length=10)
    blood_type: Optional[str] = None
    allergies: Optional[str] = Field(None, max_length=2000)
    conditions: Optional[str] = Field(None, max_length=2000)
    emergency_contact_name: Optional[str] = Field(None, max_length=120)
    emergency_contact_phone: Optional[str] = Field(None, max_length=20, pattern=r"^[+\d][\d\s-]*$")


class HealthProfileOut(HealthProfileIn):
    model_config = {"from_attributes": True}


def get_or_create_profile(user: User, db: Session) -> HealthProfile:
    profile = db.scalar(select(HealthProfile).where(HealthProfile.user_id == user.id))
    if profile is None:
        profile = HealthProfile(user_id=user.id)
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile


def profile_context(user: User, db: Session) -> dict:
    """Compact dict of the filled-in basics, for AI context (chat, care plans).
    Empty fields are omitted so the engine never sees blanks."""
    profile = db.scalar(select(HealthProfile).where(HealthProfile.user_id == user.id))
    if profile is None:
        return {}
    fields = {
        "date_of_birth": profile.date_of_birth,
        "height_cm": profile.height_cm,
        "weight_kg": profile.weight_kg,
        "blood_type": profile.blood_type,
        "allergies": profile.allergies,
        "conditions": profile.conditions,
    }
    return {k: v for k, v in fields.items() if v and v.strip() and v != "unknown"}


@router.get("", response_model=HealthProfileOut)
def get_profile(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return HealthProfileOut.model_validate(get_or_create_profile(user, db))


@router.put("", response_model=HealthProfileOut)
def update_profile(payload: HealthProfileIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = get_or_create_profile(user, db)
    data = payload.model_dump(exclude_unset=True)
    if "blood_type" in data and data["blood_type"] not in BLOOD_TYPES:
        data["blood_type"] = "unknown"
    for field, value in data.items():
        setattr(profile, field, value.strip() if isinstance(value, str) else value)
    db.commit()
    db.refresh(profile)
    return HealthProfileOut.model_validate(profile)
