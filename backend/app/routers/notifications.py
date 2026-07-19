"""Web Push daily reminders.

Flow: the browser subscribes via the service worker and POSTs its subscription
here. Users pick a daily time in Profile. An external scheduler (GitHub
Actions, hourly) calls /dispatch with the CRON_SECRET; we send the digest to
every user whose chosen UTC hour matches the current one.
"""

import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel, Field
from pywebpush import WebPushException, webpush
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..config import settings
from ..database import get_db
from ..models import CarePlan, Medication, NotificationSetting, PushSubscription, User

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


class SubscriptionKeys(BaseModel):
    p256dh: str
    auth: str


class SubscribeRequest(BaseModel):
    endpoint: str
    keys: SubscriptionKeys


class UnsubscribeRequest(BaseModel):
    endpoint: str


class SettingsRequest(BaseModel):
    daily_digest: bool
    hour_local: int = Field(ge=0, le=23)
    tz_offset_minutes: int = Field(ge=-840, le=720)  # JS getTimezoneOffset() range


class SettingsResponse(BaseModel):
    daily_digest: bool
    hour_local: int
    tz_offset_minutes: int
    subscribed_devices: int


def _get_or_create_settings(user: User, db: Session) -> NotificationSetting:
    setting = db.scalar(select(NotificationSetting).where(NotificationSetting.user_id == user.id))
    if setting is None:
        setting = NotificationSetting(user_id=user.id)
        db.add(setting)
        db.commit()
        db.refresh(setting)
    return setting


def _send_to_subscription(sub: PushSubscription, payload: dict, db: Session) -> bool:
    """Send one push; prune the subscription if the push service says it's gone."""
    try:
        webpush(
            subscription_info={
                "endpoint": sub.endpoint,
                "keys": {"p256dh": sub.p256dh, "auth": sub.auth},
            },
            data=json.dumps(payload),
            vapid_private_key=settings.vapid_private_key,
            vapid_claims={"sub": settings.vapid_subject},
            ttl=6 * 3600,
        )
        return True
    except WebPushException as exc:
        status = exc.response.status_code if exc.response is not None else None
        if status in (404, 410):
            db.delete(sub)
            db.commit()
        return False


def _build_digest(user: User, db: Session) -> dict:
    meds = db.scalars(
        select(Medication).where(Medication.user_id == user.id, Medication.active)
    ).all()
    latest_plan = db.scalar(
        select(CarePlan).where(CarePlan.user_id == user.id).order_by(CarePlan.created_at.desc()).limit(1)
    )

    lines = []
    if meds:
        names = ", ".join(m.name for m in meds[:4])
        more = f" and {len(meds) - 4} more" if len(meds) > 4 else ""
        lines.append(f"Medicines today: {names}{more}.")
    if latest_plan and latest_plan.plan.get("tasks"):
        lines.append(f"{len(latest_plan.plan['tasks'])} care-plan task(s) to keep up.")
    if not lines:
        lines.append("A good moment to log a reading or upload your latest prescription.")

    return {
        "title": f"Good day, {user.name.split(' ')[0]} — your care check-in",
        "body": " ".join(lines),
        "url": "/dashboard",
    }


@router.get("/public-key")
def public_key():
    if not settings.vapid_public_key:
        raise HTTPException(status_code=503, detail="Push notifications are not configured.")
    return {"public_key": settings.vapid_public_key}


@router.post("/subscribe", status_code=201)
def subscribe(payload: SubscribeRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    existing = db.scalar(select(PushSubscription).where(PushSubscription.endpoint == payload.endpoint))
    if existing:
        existing.user_id = user.id
        existing.p256dh = payload.keys.p256dh
        existing.auth = payload.keys.auth
    else:
        db.add(
            PushSubscription(
                user_id=user.id,
                endpoint=payload.endpoint,
                p256dh=payload.keys.p256dh,
                auth=payload.keys.auth,
            )
        )
    db.commit()
    return {"ok": True}


@router.post("/unsubscribe", status_code=204)
def unsubscribe(payload: UnsubscribeRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    sub = db.scalar(
        select(PushSubscription).where(
            PushSubscription.endpoint == payload.endpoint, PushSubscription.user_id == user.id
        )
    )
    if sub:
        db.delete(sub)
        db.commit()


@router.get("/settings", response_model=SettingsResponse)
def get_settings(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    setting = _get_or_create_settings(user, db)
    devices = len(db.scalars(select(PushSubscription).where(PushSubscription.user_id == user.id)).all())
    return SettingsResponse(
        daily_digest=setting.daily_digest,
        hour_local=setting.hour_local,
        tz_offset_minutes=setting.tz_offset_minutes,
        subscribed_devices=devices,
    )


@router.put("/settings", response_model=SettingsResponse)
def update_settings(payload: SettingsRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    setting = _get_or_create_settings(user, db)
    setting.daily_digest = payload.daily_digest
    setting.hour_local = payload.hour_local
    setting.tz_offset_minutes = payload.tz_offset_minutes
    # JS convention: UTC = local + getTimezoneOffset()/60
    setting.hour_utc = (payload.hour_local + payload.tz_offset_minutes // 60) % 24
    db.commit()
    devices = len(db.scalars(select(PushSubscription).where(PushSubscription.user_id == user.id)).all())
    return SettingsResponse(
        daily_digest=setting.daily_digest,
        hour_local=setting.hour_local,
        tz_offset_minutes=setting.tz_offset_minutes,
        subscribed_devices=devices,
    )


@router.post("/test")
def send_test(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Send the real digest to the caller right now — used by the settings UI
    (and great in demos)."""
    subs = db.scalars(select(PushSubscription).where(PushSubscription.user_id == user.id)).all()
    if not subs:
        raise HTTPException(status_code=400, detail="No subscribed browser — enable notifications first.")
    payload = _build_digest(user, db)
    sent = sum(1 for s in subs if _send_to_subscription(s, payload, db))
    if sent == 0:
        raise HTTPException(status_code=502, detail="Could not deliver to any subscribed browser.")
    return {"sent": sent}


@router.post("/dispatch")
def dispatch(x_cron_key: str | None = Header(None), db: Session = Depends(get_db)):
    """Hourly entry point for the external scheduler. Sends the daily digest
    to every user whose chosen hour (in UTC) is the current one."""
    if not settings.cron_secret or x_cron_key != settings.cron_secret:
        raise HTTPException(status_code=401, detail="Bad or missing X-Cron-Key.")

    current_hour = datetime.now(timezone.utc).hour
    due = db.scalars(
        select(NotificationSetting).where(
            NotificationSetting.daily_digest, NotificationSetting.hour_utc == current_hour
        )
    ).all()

    sent = 0
    for setting in due:
        user = db.get(User, setting.user_id)
        if user is None:
            continue
        subs = db.scalars(select(PushSubscription).where(PushSubscription.user_id == user.id)).all()
        if not subs:
            continue
        payload = _build_digest(user, db)
        sent += sum(1 for s in subs if _send_to_subscription(s, payload, db))
    return {"hour_utc": current_hour, "users_due": len(due), "notifications_sent": sent}
