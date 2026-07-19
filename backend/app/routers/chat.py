from fastapi import APIRouter, Depends
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models import CarePlan, ChatMessage, Medication, User, Vital
from ..schemas import ChatMessageOut, ChatSendRequest
from ..services import engine_client

router = APIRouter(prefix="/api/chat", tags=["chat"])

HISTORY_TURNS = 10


def _build_context(user: User, db: Session) -> dict:
    """Assemble the health context the engine's chatbot grounds its answers in:
    active medications, recent vitals, and the latest care plan summary."""
    meds = db.scalars(
        select(Medication).where(Medication.user_id == user.id, Medication.active)
    ).all()
    vitals = db.scalars(
        select(Vital).where(Vital.user_id == user.id).order_by(Vital.measured_at.desc()).limit(5)
    ).all()
    latest_plan = db.scalar(
        select(CarePlan).where(CarePlan.user_id == user.id).order_by(CarePlan.created_at.desc()).limit(1)
    )

    context: dict = {}
    if meds:
        context["medications"] = [
            {"name": m.name, "dosage": m.dosage, "frequency": m.frequency, "timing": m.timing}
            for m in meds
        ]
    if vitals:
        context["recent_vitals"] = [
            {"type": v.type, "value": v.value, "unit": v.unit, "measured_at": v.measured_at.isoformat()}
            for v in vitals
        ]
    if latest_plan:
        context["active_care_plan"] = {
            "summary": latest_plan.plan.get("structured_summary", {}),
            "red_flags": latest_plan.plan.get("red_flags", []),
            "tasks": [t.get("instruction") for t in latest_plan.plan.get("tasks", [])][:8],
        }
    return context


@router.post("")
def send_message(payload: ChatSendRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    history_rows = db.scalars(
        select(ChatMessage)
        .where(ChatMessage.user_id == user.id)
        .order_by(ChatMessage.created_at.desc())
        .limit(HISTORY_TURNS)
    ).all()
    history = [{"role": m.role, "content": m.content} for m in reversed(history_rows)]

    context = _build_context(user, db)
    result = engine_client.chat(str(user.id), payload.message, context or None, history)

    # Persist both turns only after a successful engine reply, so a failed
    # call doesn't leave a user message with no answer in the history.
    db.add(ChatMessage(user_id=user.id, role="user", content=payload.message))
    db.add(
        ChatMessage(
            user_id=user.id,
            role="assistant",
            content=result.get("reply", ""),
            safety_flag=result.get("safety_flag"),
        )
    )
    db.commit()
    return result


@router.get("/history", response_model=list[ChatMessageOut])
def get_history(limit: int = 50, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = db.scalars(
        select(ChatMessage)
        .where(ChatMessage.user_id == user.id)
        .order_by(ChatMessage.created_at.desc())
        .limit(min(limit, 200))
    ).all()
    return [ChatMessageOut.model_validate(m) for m in reversed(rows)]


@router.delete("/history", status_code=204)
def clear_history(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.execute(delete(ChatMessage).where(ChatMessage.user_id == user.id))
    db.commit()
