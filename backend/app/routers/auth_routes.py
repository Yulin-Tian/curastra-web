import secrets
from datetime import datetime, timedelta, timezone

import pyotp
from fastapi import APIRouter, Depends, File, Header, HTTPException, Response, UploadFile
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..auth import create_token, get_current_user, hash_password, verify_password
from ..database import get_db
from ..models import User
from ..schemas import LoginRequest, RegisterRequest, TokenResponse, UserOut
from ..services import mailer

router = APIRouter(prefix="/api/auth", tags=["auth"])

MAX_AVATAR_BYTES = 2 * 1024 * 1024


@router.post("/register", response_model=TokenResponse, status_code=201)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.scalar(select(User).where(User.email == payload.email.lower()))
    if existing:
        raise HTTPException(status_code=409, detail="An account with this email already exists.")

    user = User(
        name=payload.name.strip(),
        email=payload.email.lower(),
        password_hash=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return TokenResponse(token=create_token(user.id), user=UserOut.model_validate(user))


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == payload.email.lower()))
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect email or password.")
    # Second factor: when enabled, a valid authenticator code must accompany
    # the password. The distinct message tells the client to ask for the code.
    if user.totp_enabled:
        if not payload.totp_code:
            raise HTTPException(status_code=401, detail="totp_required")
        if not pyotp.TOTP(user.totp_secret).verify(payload.totp_code, valid_window=1):
            raise HTTPException(status_code=401, detail="That authenticator code is not valid.")
    return TokenResponse(token=create_token(user.id), user=UserOut.model_validate(user))


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return UserOut.model_validate(user)


# --------------------------------------------------------------------------- #
# Password recovery (email code flow)
# --------------------------------------------------------------------------- #
RESET_VALID_MINUTES = 15


class ForgotRequest(BaseModel):
    email: EmailStr


class ResetRequest(BaseModel):
    email: EmailStr
    code: str = Field(min_length=6, max_length=6)
    new_password: str = Field(min_length=8, max_length=128)


@router.post("/forgot")
def forgot_password(
    payload: ForgotRequest,
    db: Session = Depends(get_db),
    x_language: str = Header("en", alias="X-Language"),
):
    """Always answers 200 with the same shape (no account enumeration).
    With SMTP configured, the code is emailed; without it (development), the
    code is returned in the response as dev_code."""
    user = db.scalar(select(User).where(User.email == payload.email.lower()))
    response: dict = {"ok": True}
    if user is not None:
        code = f"{secrets.randbelow(1000000):06d}"
        user.reset_code_hash = hash_password(code)
        user.reset_expires = datetime.now(timezone.utc) + timedelta(minutes=RESET_VALID_MINUTES)
        db.commit()

        lang = "hi" if x_language.lower().startswith("hi") else "en"
        subject, body = mailer.RESET_TEMPLATES[lang]
        if mailer.is_configured():
            try:
                mailer.send_email(user.email, subject, body.format(name=user.name, code=code))
            except Exception:
                raise HTTPException(status_code=502, detail="Could not send the email. Please try again.")
        else:
            response["dev_code"] = code  # development only: SMTP not configured
    return response


@router.post("/reset")
def reset_password(payload: ResetRequest, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == payload.email.lower()))
    generic = HTTPException(status_code=400, detail="The code is not valid or has expired.")
    if user is None or not user.reset_code_hash or not user.reset_expires:
        raise generic
    expires = user.reset_expires
    if expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)
    if expires < datetime.now(timezone.utc):
        raise generic
    if not verify_password(payload.code, user.reset_code_hash):
        raise generic

    user.password_hash = hash_password(payload.new_password)
    user.reset_code_hash = None  # single use
    user.reset_expires = None
    db.commit()
    return {"ok": True}


# --------------------------------------------------------------------------- #
# Account security & personalisation
# --------------------------------------------------------------------------- #
class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8, max_length=128)


@router.post("/change-password")
def change_password(payload: ChangePasswordRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not verify_password(payload.current_password, user.password_hash):
        raise HTTPException(status_code=400, detail="Your current password is not correct.")
    user.password_hash = hash_password(payload.new_password)
    db.commit()
    return {"ok": True}


class TotpCodeRequest(BaseModel):
    code: str = Field(min_length=6, max_length=8)


class TotpDisableRequest(BaseModel):
    password: str


@router.post("/totp/setup")
def totp_setup(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Generate (or regenerate) a pending secret; 2FA only turns on after the
    user proves their authenticator produces matching codes (/totp/enable)."""
    if user.totp_enabled:
        raise HTTPException(status_code=400, detail="Two-factor authentication is already enabled.")
    user.totp_secret = pyotp.random_base32()
    db.commit()
    uri = pyotp.TOTP(user.totp_secret).provisioning_uri(name=user.email, issuer_name="Curastra")
    return {"otpauth_uri": uri, "secret": user.totp_secret}


@router.post("/totp/enable")
def totp_enable(payload: TotpCodeRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not user.totp_secret:
        raise HTTPException(status_code=400, detail="Run setup first.")
    if not pyotp.TOTP(user.totp_secret).verify(payload.code, valid_window=1):
        raise HTTPException(status_code=400, detail="That code is not valid. Check your authenticator app.")
    user.totp_enabled = True
    db.commit()
    return {"ok": True}


@router.post("/totp/disable")
def totp_disable(payload: TotpDisableRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Password is not correct.")
    user.totp_enabled = False
    user.totp_secret = None
    db.commit()
    return {"ok": True}


@router.post("/avatar", status_code=201)
async def upload_avatar(file: UploadFile = File(...), user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not (file.content_type or "").startswith("image/"):
        raise HTTPException(status_code=400, detail="Please upload an image file.")
    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="The image is empty.")
    if len(data) > MAX_AVATAR_BYTES:
        raise HTTPException(status_code=413, detail="Image too large (max 2 MB).")
    user.avatar = data
    user.avatar_mime = file.content_type
    db.commit()
    return {"ok": True}


@router.get("/avatar")
def get_avatar(user: User = Depends(get_current_user)):
    if not user.avatar:
        raise HTTPException(status_code=404, detail="No profile photo yet.")
    return Response(content=user.avatar, media_type=user.avatar_mime or "image/jpeg")
