import re
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Header, APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models import CarePlan, Medication, Profile, Record, TaskCompletion, User
from ..profile_scope import get_active_profile, scoped, stamp
from ..schemas import CarePlanCreateRequest, CarePlanOut, MedicationOut
from ..services import engine_client
from .health_profile import profile_context

router = APIRouter(prefix="/api/care-plans", tags=["care-plans"])


def _get_owned_plan(plan_id: int, user: User, db: Session) -> CarePlan:
    plan = db.get(CarePlan, plan_id)
    if plan is None or plan.user_id != user.id:
        raise HTTPException(status_code=404, detail="Care plan not found.")
    return plan


@router.post("", response_model=CarePlanOut, status_code=201)
def create_care_plan(
    payload: CarePlanCreateRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    active: Profile | None = Depends(get_active_profile),
    x_language: str = Header("en", alias="X-Language"),
):
    """Generate a care plan from user-confirmed text (the human-in-the-loop
    contract: the text must have been reviewed on the confirm screen first)."""
    file_name = "manual_input"
    if payload.record_id is not None:
        record = db.get(Record, payload.record_id)
        if record is None or record.user_id != user.id:
            raise HTTPException(status_code=404, detail="Record not found.")
        file_name = record.file_name

    # Patient basics (allergies, conditions, age data) travel as user notes so
    # the engine can tailor tasks and red flags without a contract change.
    notes_parts = []
    if x_language.lower().startswith("hi"):
        notes_parts.append(
            "Language: write all user-facing text in the plan (instructions, red flags, "
            "questions, disclaimer) in natural, simple Hindi (Devanagari script). Keep "
            "medicine names as written and keep JSON keys/enums in English."
        )
    if active is not None:
        notes_parts.append(f"This care plan is for the patient's {active.relationship}: {active.name}.")
    basics = profile_context(user, db) if active is None else {}
    if basics:
        notes_parts.append(
            "Patient basics (from profile): "
            + "; ".join(f"{k.replace('_', ' ')}: {v}" for k, v in basics.items())
        )
    if payload.user_notes:
        notes_parts.append(payload.user_notes)

    result = engine_client.generate_care_plan(
        file_name, payload.verified_text, "\n".join(notes_parts) or None
    )

    plan = CarePlan(
        user_id=user.id,
        profile_id=stamp(active),
        record_id=payload.record_id,
        source_text=payload.verified_text,
        plan=result,
        duration_days=parse_duration_days(result),
        status="draft",  # the user explicitly starts the course
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return CarePlanOut.model_validate(plan)


@router.get("", response_model=list[CarePlanOut])
def list_care_plans(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    active: Profile | None = Depends(get_active_profile),
):
    plans = db.scalars(
        select(CarePlan)
        .where(CarePlan.user_id == user.id, scoped(CarePlan.profile_id, active))
        .order_by(CarePlan.created_at.desc())
    ).all()
    return [CarePlanOut.model_validate(p) for p in plans]


@router.get("/{plan_id}", response_model=CarePlanOut)
def get_care_plan(plan_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return CarePlanOut.model_validate(_get_owned_plan(plan_id, user, db))


@router.delete("/{plan_id}", status_code=204)
def delete_care_plan(plan_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    plan = _get_owned_plan(plan_id, user, db)
    db.delete(plan)
    db.commit()


# --------------------------------------------------------------------------- #
# Adherence tracking: care-plan tasks are checkable per local day, so users
# (and later caregivers) can follow progress over the plan's duration.
# --------------------------------------------------------------------------- #
_DAY_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")


class ToggleTaskRequest(BaseModel):
    day: Optional[str] = Field(None, description="User's local date, YYYY-MM-DD")


def _validated_day(day: Optional[str]) -> str:
    if day is None:
        return datetime.now(timezone.utc).date().isoformat()
    if not _DAY_RE.match(day):
        raise HTTPException(status_code=400, detail="day must be YYYY-MM-DD.")
    return day


# A checked task can be un-checked for this long; then it locks, so a slip
# of the finger can't erase an adherence record hours later (safety).
UNDO_WINDOW_MINUTES = 5


def _aware(dt: datetime) -> datetime:
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)


def _is_locked(completion: TaskCompletion) -> bool:
    age = datetime.now(timezone.utc) - _aware(completion.created_at)
    return age > timedelta(minutes=UNDO_WINDOW_MINUTES)


def _adherence_state(plan: CarePlan, day: str, db: Session) -> dict:
    rows = db.scalars(
        select(TaskCompletion).where(
            TaskCompletion.plan_id == plan.id, TaskCompletion.day == day
        )
    ).all()
    any_ever = db.scalar(
        select(TaskCompletion.id).where(TaskCompletion.plan_id == plan.id).limit(1)
    )
    return {
        "day": day,
        "completed": sorted(r.task_index for r in rows),
        "locked": sorted(r.task_index for r in rows if _is_locked(r)),
        "total_tasks": len(plan.plan.get("tasks", [])),
        "has_history": any_ever is not None,
    }


_MONTH_RE = re.compile(r"^\d{4}-\d{2}$")

# "5 days", "2 weeks", "७ दिन" — how long the prescription says the course runs.
_DURATION_RE = re.compile(r"(\d+)\s*(days?|weeks?|दिन|सप्ताह|हफ़?्ते)", re.IGNORECASE)


def parse_duration_days(plan: dict) -> int | None:
    """Longest course length mentioned across medications and tasks."""
    texts: list[str] = []
    for m in plan.get("medications", []):
        texts.append(str(m.get("duration") or ""))
    for task in plan.get("tasks", []):
        texts.append(str(task.get("schedule") or ""))
        texts.append(str(task.get("instruction") or ""))
    best: int | None = None
    for text in texts:
        for n, unit in _DURATION_RE.findall(text):
            days = int(n) * (7 if unit.lower().startswith("week") or unit in ("सप्ताह", "हफ्ते", "हफ़्ते") else 1)
            if 0 < days <= 365:
                best = max(best or 0, days)
    return best


class ActivateRequest(BaseModel):
    start_day: Optional[str] = Field(None, description="User's local date, YYYY-MM-DD")


@router.post("/{plan_id}/activate", response_model=CarePlanOut)
def activate_plan(
    plan_id: int,
    payload: ActivateRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """The user confirms the plan and the course starts: from here the
    calendar window runs strictly for the prescription's duration."""
    plan = _get_owned_plan(plan_id, user, db)
    if plan.status == "completed":
        raise HTTPException(status_code=400, detail="This plan is already completed.")
    plan.starts_on = _validated_day(payload.start_day)
    plan.status = "active"
    db.commit()
    db.refresh(plan)
    return CarePlanOut.model_validate(plan)


class OutcomeRequest(BaseModel):
    feeling: str  # better | not_better


@router.post("/{plan_id}/outcome", response_model=CarePlanOut)
def record_outcome(
    plan_id: int,
    payload: OutcomeRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """End-of-course check-in: the user records how they feel; the plan
    completes either way (a 'not better' answer prompts a doctor follow-up
    in the interface, never advice from us)."""
    if payload.feeling not in ("better", "not_better"):
        raise HTTPException(status_code=400, detail="feeling must be better or not_better.")
    plan = _get_owned_plan(plan_id, user, db)
    plan.status = "completed"
    plan.outcome = payload.feeling
    db.commit()
    db.refresh(plan)
    return CarePlanOut.model_validate(plan)


@router.get("/{plan_id}/adherence/month")
def adherence_month(
    plan_id: int,
    month: str | None = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Per-day completion counts for one calendar month (heatmap data)."""
    plan = _get_owned_plan(plan_id, user, db)
    if month is None:
        month = datetime.now(timezone.utc).strftime("%Y-%m")
    if not _MONTH_RE.match(month):
        raise HTTPException(status_code=400, detail="month must be YYYY-MM.")
    rows = db.execute(
        select(TaskCompletion.day, func.count())
        .where(TaskCompletion.plan_id == plan.id, TaskCompletion.day.like(f"{month}-%"))
        .group_by(TaskCompletion.day)
    ).all()
    return {
        "month": month,
        "total_tasks": len(plan.plan.get("tasks", [])),
        "days": {day: count for day, count in rows},
    }


@router.get("/{plan_id}/adherence")
def get_adherence(
    plan_id: int,
    day: str | None = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    plan = _get_owned_plan(plan_id, user, db)
    return _adherence_state(plan, _validated_day(day), db)


@router.post("/{plan_id}/tasks/{task_index}/toggle")
def toggle_task(
    plan_id: int,
    task_index: int,
    payload: ToggleTaskRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    plan = _get_owned_plan(plan_id, user, db)
    tasks = plan.plan.get("tasks", [])
    if not (0 <= task_index < len(tasks)):
        raise HTTPException(status_code=400, detail="Unknown task index.")
    day = _validated_day(payload.day)

    existing = db.scalar(
        select(TaskCompletion).where(
            TaskCompletion.plan_id == plan.id,
            TaskCompletion.task_index == task_index,
            TaskCompletion.day == day,
        )
    )
    if existing:
        if _is_locked(existing):
            raise HTTPException(
                status_code=409,
                detail="This check-off locked 5 minutes after ticking and can no longer be undone.",
            )
        db.delete(existing)
    else:
        db.add(TaskCompletion(user_id=user.id, plan_id=plan.id, task_index=task_index, day=day))
    db.commit()
    return _adherence_state(plan, day, db)


@router.post("/{plan_id}/import-medications", response_model=list[MedicationOut])
def import_medications(plan_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Copy the plan's medications into the user's medication list, so the
    safety-check and chatbot context can use them. Skips entries already
    present (matched case-insensitively by name)."""
    plan = _get_owned_plan(plan_id, user, db)
    plan_meds = plan.plan.get("medications", [])

    existing = {
        m.name.lower()
        for m in db.scalars(select(Medication).where(Medication.user_id == user.id, Medication.active)).all()
    }

    added: list[Medication] = []
    for med in plan_meds:
        name = (med.get("name") or "").strip()
        if not name or name.lower() in existing:
            continue
        entry = Medication(
            user_id=user.id,
            profile_id=plan.profile_id,
            name=name,
            dosage=med.get("dosage") or med.get("strength"),
            frequency=med.get("frequency"),
            timing=med.get("timing"),
            duration=med.get("duration"),
            notes=med.get("original_line"),
        )
        db.add(entry)
        added.append(entry)
        existing.add(name.lower())

    db.commit()
    for entry in added:
        db.refresh(entry)
    return [MedicationOut.model_validate(m) for m in added]
