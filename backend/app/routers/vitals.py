from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models import User, Vital
from ..schemas import VitalCreate, VitalOut
from ..services import engine_client

router = APIRouter(prefix="/api/vitals", tags=["vitals"])


@router.post("", response_model=VitalOut, status_code=201)
def add_vital(payload: VitalCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    data = payload.model_dump(exclude_unset=True)
    vital = Vital(user_id=user.id, **data)
    db.add(vital)
    db.commit()
    db.refresh(vital)
    return VitalOut.model_validate(vital)


@router.get("", response_model=list[VitalOut])
def list_vitals(
    type: str | None = None,
    limit: int = 100,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = select(Vital).where(Vital.user_id == user.id)
    if type:
        query = query.where(Vital.type == type)
    vitals = db.scalars(query.order_by(Vital.measured_at.desc()).limit(min(limit, 500))).all()
    return [VitalOut.model_validate(v) for v in vitals]


@router.delete("/{vital_id}", status_code=204)
def delete_vital(vital_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    vital = db.get(Vital, vital_id)
    if vital is None or vital.user_id != user.id:
        raise HTTPException(status_code=404, detail="Vital entry not found.")
    db.delete(vital)
    db.commit()


@router.post("/insights")
def vitals_insights(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Generate gentle, factual health insights from the logged vitals."""
    vitals = db.scalars(
        select(Vital).where(Vital.user_id == user.id).order_by(Vital.measured_at.desc()).limit(30)
    ).all()
    if not vitals:
        raise HTTPException(status_code=400, detail="Log some vitals first to get insights.")

    history = [
        {
            "type": v.type,
            "value": v.value,
            "unit": v.unit,
            "measured_at": v.measured_at.isoformat(),
        }
        for v in reversed(vitals)  # oldest first reads naturally as a series
    ]
    return engine_client.insights(str(user.id), history, adherence=[])
