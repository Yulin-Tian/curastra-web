from fastapi import Header, APIRouter, Depends
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models import CarePlan, ChatMessage, Medication, Profile, User, Vital
from ..profile_scope import get_active_profile, scoped, stamp
from ..schemas import ChatMessageOut, ChatSendRequest
from ..services import engine_client
from .health_profile import profile_context

router = APIRouter(prefix="/api/chat", tags=["chat"])

HISTORY_TURNS = 10

# The assistant can also answer "how do I…?" questions about Curastra itself.
# This guide rides along in the chat context; the engine's prompt only allows
# facts from context, so this is the single source of app knowledge.
APP_GUIDE = {
    "what_this_is": "Curastra app features and where to find them, for how-to questions.",
    "records": "Health Records page: upload prescriptions or lab reports (photo, PDF, DOCX). The extracted text must be reviewed and confirmed by the user before it is used. Records can be filtered by type and sorted by date.",
    "care_plans": "Care Plans page: generated from a confirmed prescription. New plans wait as drafts until the user confirms the start; the plan then follows the prescription's course (e.g. 5 days) day by day. A calendar tracks daily task check-offs, past days can be reviewed and corrected, and when the course ends the app asks whether the user feels better.",
    "medications": "Medications page: the medicine list, importable from a care plan in one tap, with AI safety alerts for duplicates and interactions.",
    "vitals": "Vitals page: log blood pressure, glucose, weight, heart rate, temperature; see trend charts and ask for AI insights.",
    "assistant": "This chat, available on every page via the floating button. It is grounded in the user's own record and supports voice input.",
    "family_profiles": "Profile page: add family members (child, parent). Switch the active person in the sidebar; each has their own records, plans, medicines, theme, and ABHA.",
    "abha": "Profile page: Aadhaar-based ABHA enrollment with OTP verification.",
    "sharing": "Profile page, 'Share with doctor or family': creates a revocable, read-only link (valid 30 days) to medications, the latest care plan, and recent vitals. No account is needed to view it.",
    "emergency": "Emergency page (red icon in the menu): a printable card with blood type, allergies, conditions, and medicines, plus confirmed one-tap calling of 112 or the saved emergency contact. The contact is saved in Profile, Health basics.",
    "reminders": "Profile page: a daily care reminder delivered as a browser push notification at the user's chosen hour.",
    "security": "Profile page: change password, enable two-factor authentication with an authenticator app, set a profile photo. Forgotten passwords are recovered by an emailed six-digit code.",
    "language_and_install": "The English/Hindi switcher sits in the sidebar under Sign out; the whole app including AI answers follows it. The app can be installed to the home screen from the browser menu (it is a PWA).",
}


def _build_context(user: User, db: Session, active: Profile | None) -> dict:
    """Assemble the health context the engine's chatbot grounds its answers in:
    the active profile's medications, recent vitals, and latest care plan."""
    meds = db.scalars(
        select(Medication).where(
            Medication.user_id == user.id, Medication.active, scoped(Medication.profile_id, active)
        )
    ).all()
    vitals = db.scalars(
        select(Vital)
        .where(Vital.user_id == user.id, scoped(Vital.profile_id, active))
        .order_by(Vital.measured_at.desc())
        .limit(5)
    ).all()
    latest_plan = db.scalar(
        select(CarePlan)
        .where(CarePlan.user_id == user.id, scoped(CarePlan.profile_id, active))
        .order_by(CarePlan.created_at.desc())
        .limit(1)
    )

    context: dict = {}
    if active is not None:
        context["patient"] = {"name": active.name, "relationship_to_account_holder": active.relationship}
    else:
        basics = profile_context(user, db)
        if basics:
            context["patient_basics"] = basics
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
    context["app_guide"] = APP_GUIDE
    return context


@router.post("")
def send_message(
    payload: ChatSendRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    active: Profile | None = Depends(get_active_profile),
    x_language: str = Header("en", alias="X-Language"),
):
    history_rows = db.scalars(
        select(ChatMessage)
        .where(ChatMessage.user_id == user.id, scoped(ChatMessage.profile_id, active))
        .order_by(ChatMessage.created_at.desc())
        .limit(HISTORY_TURNS)
    ).all()
    history = [{"role": m.role, "content": m.content} for m in reversed(history_rows)]

    context = _build_context(user, db, active)
    result = engine_client.chat(str(user.id), payload.message, context or None, history, language=x_language)

    # Persist both turns only after a successful engine reply, so a failed
    # call doesn't leave a user message with no answer in the history.
    pid = stamp(active)
    db.add(ChatMessage(user_id=user.id, profile_id=pid, role="user", content=payload.message))
    db.add(
        ChatMessage(
            user_id=user.id,
            profile_id=pid,
            role="assistant",
            content=result.get("reply", ""),
            safety_flag=result.get("safety_flag"),
        )
    )
    db.commit()
    return result


@router.get("/history", response_model=list[ChatMessageOut])
def get_history(
    limit: int = 50,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    active: Profile | None = Depends(get_active_profile),
):
    rows = db.scalars(
        select(ChatMessage)
        .where(ChatMessage.user_id == user.id, scoped(ChatMessage.profile_id, active))
        .order_by(ChatMessage.created_at.desc())
        .limit(min(limit, 200))
    ).all()
    return [ChatMessageOut.model_validate(m) for m in reversed(rows)]


@router.delete("/history", status_code=204)
def clear_history(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    active: Profile | None = Depends(get_active_profile),
):
    db.execute(
        delete(ChatMessage).where(ChatMessage.user_id == user.id, scoped(ChatMessage.profile_id, active))
    )
    db.commit()
