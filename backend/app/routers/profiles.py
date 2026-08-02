from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models import CarePlan, Medication, Profile, Record, User, Vital
from ..profile_scope import ensure_primary_profile

router = APIRouter(prefix="/api/profiles", tags=["profiles"])

RELATIONSHIPS = {"child", "parent", "other"}
MAX_PROFILES = 8


class ProfileCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    relationship: str


class ProfileOut(BaseModel):
    id: int
    name: str
    relationship: str
    is_primary: bool
    abha_number: Optional[str] = None
    abha_address: Optional[str] = None
    abha_linked: bool = False

    model_config = {"from_attributes": True}


@router.get("", response_model=list[ProfileOut])
def list_profiles(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ensure_primary_profile(user, db)
    rows = db.scalars(
        select(Profile).where(Profile.user_id == user.id).order_by(Profile.is_primary.desc(), Profile.created_at)
    ).all()
    return [ProfileOut.model_validate(p) for p in rows]


@router.post("", response_model=ProfileOut, status_code=201)
def create_profile(payload: ProfileCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if payload.relationship not in RELATIONSHIPS:
        raise HTTPException(status_code=400, detail=f"relationship must be one of {sorted(RELATIONSHIPS)}.")
    ensure_primary_profile(user, db)
    count = len(db.scalars(select(Profile.id).where(Profile.user_id == user.id)).all())
    if count >= MAX_PROFILES:
        raise HTTPException(status_code=400, detail="Profile limit reached.")
    profile = Profile(user_id=user.id, name=payload.name.strip(), relationship=payload.relationship)
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return ProfileOut.model_validate(profile)


@router.delete("/{profile_id}", status_code=204)
def delete_profile(profile_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.get(Profile, profile_id)
    if profile is None or profile.user_id != user.id:
        raise HTTPException(status_code=404, detail="Profile not found.")
    if profile.is_primary:
        raise HTTPException(status_code=400, detail="The primary profile cannot be removed.")
    for model in (Record, CarePlan, Medication, Vital):
        if db.scalar(select(model.id).where(model.user_id == user.id, model.profile_id == profile.id).limit(1)):
            raise HTTPException(
                status_code=400,
                detail=f"{profile.name} still has health data. Remove their records first.",
            )
    db.delete(profile)
    db.commit()
