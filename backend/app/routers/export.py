"""Data portability: one JSON with everything the account holds.

The companion to account deletion — erasure and portability together
complete the data-rights pair. File bytes are excluded (each record's
original file stays downloadable individually); everything textual and
structured is included, across all family profiles.
"""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models import (
    CarePlan,
    ChatMessage,
    HealthProfile,
    Medication,
    Profile,
    Record,
    TaskCompletion,
    User,
    Vital,
)

router = APIRouter(prefix="/api/export", tags=["export"])


@router.get("")
def export_data(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    def rows(model, order_col):
        return db.scalars(
            select(model).where(model.user_id == user.id).order_by(order_col)
        ).all()

    health = db.scalar(select(HealthProfile).where(HealthProfile.user_id == user.id))

    return {
        "format": "curastra-export/1",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "account": {
            "name": user.name,
            "email": user.email,
            "created_at": user.created_at.isoformat(),
            "consented_at": user.consented_at.isoformat() if user.consented_at else None,
            "two_factor_enabled": user.totp_enabled,
            "abha_number": user.abha_number,
            "abha_address": user.abha_address,
        },
        "health_basics": None
        if health is None
        else {
            "date_of_birth": health.date_of_birth,
            "height_cm": health.height_cm,
            "weight_kg": health.weight_kg,
            "blood_type": health.blood_type,
            "allergies": health.allergies,
            "conditions": health.conditions,
            "emergency_contact_name": health.emergency_contact_name,
            "emergency_contact_phone": health.emergency_contact_phone,
        },
        "family_profiles": [
            {
                "id": p.id,
                "name": p.name,
                "relationship": p.relationship,
                "is_primary": p.is_primary,
                "abha_number": p.abha_number,
                "abha_address": p.abha_address,
            }
            for p in rows(Profile, Profile.created_at)
        ],
        "records": [
            {
                "id": r.id,
                "profile_id": r.profile_id,
                "type": r.type,
                "file_name": r.file_name,
                "notes": r.notes,
                "extracted_text": r.extracted_text,
                "uploaded_at": r.uploaded_at.isoformat(),
                "confirmed_at": r.confirmed_at.isoformat() if r.confirmed_at else None,
            }
            for r in rows(Record, Record.uploaded_at)
        ],
        "care_plans": [
            {
                "id": p.id,
                "profile_id": p.profile_id,
                "record_id": p.record_id,
                "source_text": p.source_text,
                "plan": p.plan,
                "duration_days": p.duration_days,
                "starts_on": p.starts_on,
                "status": p.status,
                "outcome": p.outcome,
                "created_at": p.created_at.isoformat(),
            }
            for p in rows(CarePlan, CarePlan.created_at)
        ],
        "task_completions": [
            {"plan_id": c.plan_id, "task_index": c.task_index, "day": c.day}
            for c in rows(TaskCompletion, TaskCompletion.created_at)
        ],
        "medications": [
            {
                "profile_id": m.profile_id,
                "name": m.name,
                "dosage": m.dosage,
                "frequency": m.frequency,
                "timing": m.timing,
                "duration": m.duration,
                "notes": m.notes,
                "active": m.active,
                "created_at": m.created_at.isoformat(),
            }
            for m in rows(Medication, Medication.created_at)
        ],
        "vitals": [
            {
                "profile_id": v.profile_id,
                "type": v.type,
                "value": v.value,
                "unit": v.unit,
                "note": v.note,
                "measured_at": v.measured_at.isoformat(),
            }
            for v in rows(Vital, Vital.measured_at)
        ],
        "chat_history": [
            {
                "profile_id": m.profile_id,
                "role": m.role,
                "content": m.content,
                "created_at": m.created_at.isoformat(),
            }
            for m in rows(ChatMessage, ChatMessage.created_at)
        ],
        "note": "Original uploaded files are not embedded; download each from its record page.",
    }
