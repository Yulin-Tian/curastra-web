from fastapi import APIRouter, Depends

from ..auth import get_current_user
from ..models import User
from ..schemas import LabAnalyzeRequest, SimplifyRequest
from ..services import engine_client

router = APIRouter(prefix="/api/ai", tags=["ai"])


@router.post("/simplify")
def simplify(payload: SimplifyRequest, user: User = Depends(get_current_user)):
    """Rewrite a medical instruction in plain language (+ a speakable version)."""
    return engine_client.simplify(payload.text)


@router.post("/lab-analyze")
def lab_analyze(payload: LabAnalyzeRequest, user: User = Depends(get_current_user)):
    """Plain-language lab report explanation with out-of-range flags. The text
    must be the user-confirmed extraction (human-in-the-loop applies here too)."""
    return engine_client.lab_analyze(payload.verified_text)
