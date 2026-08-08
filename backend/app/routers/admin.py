"""Admin console API — operational oversight for the platform owner.

Design stance: admins see METADATA ONLY — counts, dates, activity, service
health. No endpoint here returns medical content (record text, plan bodies,
chat messages, readings). Access is config-driven via the ADMIN_EMAILS
allowlist; there is deliberately no API that grants or stores adminship, so
a compromised account cannot promote itself.
"""

import time
from datetime import datetime, timedelta, timezone

import httpx
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..config import settings
from ..database import get_db
from ..models import (
    CarePlan,
    ChatMessage,
    Medication,
    Profile,
    PushSubscription,
    Record,
    ShareLink,
    TaskCompletion,
    User,
    Vital,
)

router = APIRouter(prefix="/api/admin", tags=["admin"])

TREND_DAYS = 14


def require_admin(user: User = Depends(get_current_user)) -> User:
    if user.email.lower() not in settings.admin_emails:
        raise HTTPException(status_code=403, detail="Admin access required.")
    return user


def _day_series(db: Session, column, days: int) -> dict[str, int]:
    """Counts per UTC day for the trailing window, keyed YYYY-MM-DD."""
    since = datetime.now(timezone.utc) - timedelta(days=days)
    rows = db.execute(
        select(func.date(column), func.count()).where(column >= since).group_by(func.date(column))
    ).all()
    return {str(day): count for day, count in rows}


@router.get("/overview")
def overview(admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    def count(model) -> int:
        return db.scalar(select(func.count()).select_from(model)) or 0

    plans_by_status = dict(
        db.execute(select(CarePlan.status, func.count()).group_by(CarePlan.status)).all()
    )
    now = datetime.now(timezone.utc)
    active_links = db.scalar(
        select(func.count())
        .select_from(ShareLink)
        .where(ShareLink.revoked.is_(False), ShareLink.expires_at > now)
    ) or 0

    # Engine health with measured latency — the ops view in one call.
    engine = {"status": "down", "latency_ms": None}
    try:
        t0 = time.monotonic()
        r = httpx.get(f"{settings.ai_engine_url.rstrip('/')}/health", timeout=10)
        if r.status_code == 200:
            engine = {"status": "ok", "latency_ms": round((time.monotonic() - t0) * 1000)}
    except httpx.HTTPError:
        pass

    days = [(now - timedelta(days=i)).date().isoformat() for i in range(TREND_DAYS - 1, -1, -1)]
    signups = _day_series(db, User.created_at, TREND_DAYS)
    uploads = _day_series(db, Record.uploaded_at, TREND_DAYS)
    readings = _day_series(db, Vital.measured_at, TREND_DAYS)
    chats = _day_series(db, ChatMessage.created_at, TREND_DAYS)

    return {
        "totals": {
            "users": count(User),
            "family_profiles": count(Profile),
            "records": count(Record),
            "care_plans": count(CarePlan),
            "medications": count(Medication),
            "vitals": count(Vital),
            "chat_messages": count(ChatMessage),
            "task_completions": count(TaskCompletion),
            "active_share_links": active_links,
            "push_subscriptions": count(PushSubscription),
        },
        "care_plans_by_status": {str(k): v for k, v in plans_by_status.items()},
        "trends": {
            "days": days,
            "signups": [signups.get(d, 0) for d in days],
            "records": [uploads.get(d, 0) for d in days],
            "vitals": [readings.get(d, 0) for d in days],
            "chats": [chats.get(d, 0) for d in days],
        },
        "services": {
            "backend": {"status": "ok"},
            "database": {"status": "ok"},  # this query answered, so it is
            "engine": engine,
        },
        "generated_at": now.isoformat(),
    }


@router.get("/users")
def list_users(
    query: str = "",
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """User directory: identity, security posture, and volume — no content."""
    stmt = select(User).order_by(User.created_at.desc()).limit(100)
    if query.strip():
        like = f"%{query.strip().lower()}%"
        stmt = (
            select(User)
            .where(func.lower(User.email).like(like) | func.lower(User.name).like(like))
            .order_by(User.created_at.desc())
            .limit(100)
        )
    users = db.scalars(stmt).all()

    def counts_by_user(model, column) -> dict[int, int]:
        return dict(db.execute(select(column, func.count()).group_by(column)).all())

    rec = counts_by_user(Record, Record.user_id)
    plans = counts_by_user(CarePlan, CarePlan.user_id)
    meds = counts_by_user(Medication, Medication.user_id)
    vits = counts_by_user(Vital, Vital.user_id)
    profs = counts_by_user(Profile, Profile.user_id)

    last_vital = dict(db.execute(select(Vital.user_id, func.max(Vital.measured_at)).group_by(Vital.user_id)).all())
    last_record = dict(db.execute(select(Record.user_id, func.max(Record.uploaded_at)).group_by(Record.user_id)).all())
    last_chat = dict(db.execute(select(ChatMessage.user_id, func.max(ChatMessage.created_at)).group_by(ChatMessage.user_id)).all())

    def last_active(uid: int):
        stamps = [s for s in (last_vital.get(uid), last_record.get(uid), last_chat.get(uid)) if s]
        return max(stamps).isoformat() if stamps else None

    return [
        {
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "created_at": u.created_at.isoformat(),
            "totp_enabled": u.totp_enabled,
            "abha_linked": u.abha_linked,
            "is_admin": u.email.lower() in settings.admin_emails,
            "family_profiles": profs.get(u.id, 0),
            "records": rec.get(u.id, 0),
            "care_plans": plans.get(u.id, 0),
            "medications": meds.get(u.id, 0),
            "vitals": vits.get(u.id, 0),
            "last_active": last_active(u.id),
        }
        for u in users
    ]
