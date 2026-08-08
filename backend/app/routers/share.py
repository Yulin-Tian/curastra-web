"""Read-only sharing of a profile's health summary via unguessable links.

The owner creates a link for the active profile; anyone holding the URL can
view a bundled summary (medications, latest care plan, recent vitals) without
an account. Links expire after 30 days and can be revoked at any time.
"""

import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models import CarePlan, Medication, Profile, ShareLink, User, Vital
from ..profile_scope import get_active_profile, scoped, stamp

router = APIRouter(prefix="/api/share", tags=["share"])

LINK_TTL_DAYS = 30


class ShareLinkOut(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    token: str
    created_at: datetime
    expires_at: datetime


def _now():
    return datetime.now(timezone.utc)


def _aware(dt: datetime) -> datetime:
    # SQLite hands back naive datetimes; they were stored as UTC.
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)


@router.post("", response_model=ShareLinkOut)
def create_link(
    user: User = Depends(get_current_user),
    active: Profile | None = Depends(get_active_profile),
    db: Session = Depends(get_db),
):
    link = ShareLink(
        user_id=user.id,
        profile_id=stamp(active),
        token=secrets.token_urlsafe(16),
        expires_at=_now() + timedelta(days=LINK_TTL_DAYS),
    )
    db.add(link)
    db.commit()
    db.refresh(link)
    return link


@router.get("", response_model=list[ShareLinkOut])
def list_links(
    user: User = Depends(get_current_user),
    active: Profile | None = Depends(get_active_profile),
    db: Session = Depends(get_db),
):
    return db.scalars(
        select(ShareLink)
        .where(
            ShareLink.user_id == user.id,
            scoped(ShareLink.profile_id, active),
            ShareLink.revoked.is_(False),
        )
        .order_by(ShareLink.created_at.desc())
    ).all()


@router.delete("/{link_id}", status_code=204)
def revoke_link(
    link_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    link = db.get(ShareLink, link_id)
    if link is None or link.user_id != user.id:
        raise HTTPException(status_code=404, detail="Share link not found.")
    link.revoked = True
    db.commit()


@router.get("/public/{token}")
def view_shared(token: str, db: Session = Depends(get_db)):
    """The doctor's view. No auth: the 128-bit token is the credential."""
    link = db.scalar(select(ShareLink).where(ShareLink.token == token))
    if link is None or link.revoked or _aware(link.expires_at) < _now():
        raise HTTPException(status_code=404, detail="This share link is invalid or has expired.")

    user = db.get(User, link.user_id)
    if link.profile_id is not None:
        profile = db.get(Profile, link.profile_id)
        name = profile.name if profile else user.name
    else:
        name = user.name

    meds = db.scalars(
        select(Medication)
        .where(
            Medication.user_id == link.user_id,
            Medication.profile_id.is_(None) if link.profile_id is None else Medication.profile_id == link.profile_id,
            Medication.active.is_(True),
        )
        .order_by(Medication.created_at.desc())
    ).all()

    plan = db.scalar(
        select(CarePlan)
        .where(
            CarePlan.user_id == link.user_id,
            CarePlan.profile_id.is_(None) if link.profile_id is None else CarePlan.profile_id == link.profile_id,
        )
        .order_by(CarePlan.created_at.desc())
        .limit(1)
    )

    vitals = db.scalars(
        select(Vital)
        .where(
            Vital.user_id == link.user_id,
            Vital.profile_id.is_(None) if link.profile_id is None else Vital.profile_id == link.profile_id,
        )
        .order_by(Vital.measured_at.desc())
        .limit(30)
    ).all()

    return {
        "name": name,
        "generated_at": _now().isoformat(),
        "expires_at": _aware(link.expires_at).isoformat(),
        "medications": [
            {
                "name": m.name,
                "dosage": m.dosage,
                "frequency": m.frequency,
                "timing": m.timing,
                "duration": m.duration,
            }
            for m in meds
        ],
        "care_plan": None
        if plan is None
        else {
            "created_at": plan.created_at.isoformat(),
            "plan": plan.plan,
            "duration_days": plan.duration_days,
            "starts_on": plan.starts_on,
            "status": plan.status,
            "outcome": plan.outcome,
        },
        "vitals": [
            {
                "type": v.type,
                "value": v.value,
                "unit": v.unit,
                "measured_at": v.measured_at.isoformat(),
            }
            for v in vitals
        ],
    }
