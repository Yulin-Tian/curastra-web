from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models import Medication, User
from ..schemas import MedicationCreate, MedicationOut, MedicationUpdate
from ..services import engine_client

router = APIRouter(prefix="/api/medications", tags=["medications"])


def _get_owned_med(med_id: int, user: User, db: Session) -> Medication:
    med = db.get(Medication, med_id)
    if med is None or med.user_id != user.id:
        raise HTTPException(status_code=404, detail="Medication not found.")
    return med


@router.post("", response_model=MedicationOut, status_code=201)
def add_medication(payload: MedicationCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    med = Medication(user_id=user.id, **payload.model_dump())
    db.add(med)
    db.commit()
    db.refresh(med)
    return MedicationOut.model_validate(med)


@router.get("", response_model=list[MedicationOut])
def list_medications(
    include_inactive: bool = False,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = select(Medication).where(Medication.user_id == user.id)
    if not include_inactive:
        query = query.where(Medication.active)
    meds = db.scalars(query.order_by(Medication.created_at.desc())).all()
    return [MedicationOut.model_validate(m) for m in meds]


@router.patch("/{med_id}", response_model=MedicationOut)
def update_medication(
    med_id: int,
    payload: MedicationUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    med = _get_owned_med(med_id, user, db)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(med, field, value)
    db.commit()
    db.refresh(med)
    return MedicationOut.model_validate(med)


@router.delete("/{med_id}", status_code=204)
def delete_medication(med_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    med = _get_owned_med(med_id, user, db)
    db.delete(med)
    db.commit()


@router.post("/safety-check")
def safety_check(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Run the user's current (active) medication list through the engine's
    cross-medication safety analysis: duplicates, interactions, dosage flags."""
    meds = db.scalars(
        select(Medication).where(Medication.user_id == user.id, Medication.active)
    ).all()
    if len(meds) < 1:
        raise HTTPException(status_code=400, detail="Add at least one medication first.")

    items = [{"name": m.name, "dosage": m.dosage, "frequency": m.frequency} for m in meds]
    return engine_client.med_safety(items)
