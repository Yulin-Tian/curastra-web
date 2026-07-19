from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, EmailStr, Field


# ---------------------------------------------------------------------------- #
# Auth / users
# ---------------------------------------------------------------------------- #
class RegisterRequest(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    abha_number: Optional[str] = None
    abha_address: Optional[str] = None
    abha_linked: bool = False

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    token: str
    user: UserOut


class AbhaLinkRequest(BaseModel):
    abha_number: str = Field(min_length=14, max_length=17)  # 14 digits, may be hyphenated
    abha_address: str = Field(min_length=3, max_length=120)


# ---------------------------------------------------------------------------- #
# Records
# ---------------------------------------------------------------------------- #
class RecordOut(BaseModel):
    id: int
    type: str
    file_name: str
    mime_type: str
    notes: Optional[str] = None
    has_extracted_text: bool = False
    uploaded_at: datetime


class RecordDetailOut(RecordOut):
    extracted_text: Optional[str] = None


class ConfirmTextRequest(BaseModel):
    verified_text: str = Field(min_length=1)


# ---------------------------------------------------------------------------- #
# Care plans
# ---------------------------------------------------------------------------- #
class CarePlanCreateRequest(BaseModel):
    record_id: Optional[int] = None
    verified_text: str = Field(min_length=1)
    user_notes: Optional[str] = None


class CarePlanOut(BaseModel):
    id: int
    record_id: Optional[int] = None
    source_text: str
    plan: dict[str, Any]
    created_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------- #
# Medications
# ---------------------------------------------------------------------------- #
class MedicationCreate(BaseModel):
    name: str = Field(min_length=1, max_length=160)
    dosage: Optional[str] = None
    frequency: Optional[str] = None
    timing: Optional[str] = None
    duration: Optional[str] = None
    notes: Optional[str] = None


class MedicationUpdate(BaseModel):
    name: Optional[str] = None
    dosage: Optional[str] = None
    frequency: Optional[str] = None
    timing: Optional[str] = None
    duration: Optional[str] = None
    notes: Optional[str] = None
    active: Optional[bool] = None


class MedicationOut(BaseModel):
    id: int
    name: str
    dosage: Optional[str] = None
    frequency: Optional[str] = None
    timing: Optional[str] = None
    duration: Optional[str] = None
    notes: Optional[str] = None
    active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------- #
# Vitals
# ---------------------------------------------------------------------------- #
class VitalCreate(BaseModel):
    type: str = Field(min_length=1, max_length=40)
    value: str = Field(min_length=1, max_length=40)
    unit: Optional[str] = None
    note: Optional[str] = None
    measured_at: Optional[datetime] = None


class VitalOut(BaseModel):
    id: int
    type: str
    value: str
    unit: Optional[str] = None
    note: Optional[str] = None
    measured_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------- #
# AI pass-throughs and chat
# ---------------------------------------------------------------------------- #
class SimplifyRequest(BaseModel):
    text: str = Field(min_length=1)


class LabAnalyzeRequest(BaseModel):
    verified_text: str = Field(min_length=1)


class ChatSendRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)


class ChatMessageOut(BaseModel):
    id: int
    role: str
    content: str
    safety_flag: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}
