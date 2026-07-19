from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models import CarePlan, Medication, Record, User
from ..schemas import CarePlanCreateRequest, CarePlanOut, MedicationOut
from ..services import engine_client

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
):
    """Generate a care plan from user-confirmed text (the human-in-the-loop
    contract: the text must have been reviewed on the confirm screen first)."""
    file_name = "manual_input"
    if payload.record_id is not None:
        record = db.get(Record, payload.record_id)
        if record is None or record.user_id != user.id:
            raise HTTPException(status_code=404, detail="Record not found.")
        file_name = record.file_name

    result = engine_client.generate_care_plan(file_name, payload.verified_text, payload.user_notes)

    plan = CarePlan(
        user_id=user.id,
        record_id=payload.record_id,
        source_text=payload.verified_text,
        plan=result,
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return CarePlanOut.model_validate(plan)


@router.get("", response_model=list[CarePlanOut])
def list_care_plans(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    plans = db.scalars(
        select(CarePlan).where(CarePlan.user_id == user.id).order_by(CarePlan.created_at.desc())
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
