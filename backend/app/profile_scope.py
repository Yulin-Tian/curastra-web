"""Active-profile resolution and data scoping for the multi-profile feature.

The client sends X-Profile-Id for the family member being cared for. No
header, or the primary profile's id, means the account owner ('self') —
whose data are the rows with profile_id NULL (all pre-feature data).
"""

from typing import Optional

from fastapi import Depends, Header, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from .auth import get_current_user
from .database import get_db
from .models import Profile, User


def ensure_primary_profile(user: User, db: Session) -> Profile:
    primary = db.scalar(select(Profile).where(Profile.user_id == user.id, Profile.is_primary))
    if primary is None:
        primary = Profile(
            user_id=user.id,
            name=user.name,
            relationship="self",
            is_primary=True,
            abha_number=user.abha_number,
            abha_address=user.abha_address,
            abha_linked=user.abha_linked,
        )
        db.add(primary)
        db.commit()
        db.refresh(primary)
    return primary


def get_active_profile(
    x_profile_id: Optional[str] = Header(None, alias="X-Profile-Id"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Optional[Profile]:
    """Returns the verified non-primary active profile, or None for 'self'."""
    if not x_profile_id:
        return None
    try:
        pid = int(x_profile_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid X-Profile-Id header.")
    profile = db.get(Profile, pid)
    if profile is None or profile.user_id != user.id:
        raise HTTPException(status_code=404, detail="Profile not found.")
    return None if profile.is_primary else profile


def scoped(profile_id_col, active: Optional[Profile]):
    """SQL filter for the active profile's rows."""
    return profile_id_col.is_(None) if active is None else profile_id_col == active.id


def stamp(active: Optional[Profile]) -> Optional[int]:
    """Value to store in profile_id for new rows."""
    return None if active is None else active.id
