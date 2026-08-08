from datetime import datetime, timezone

from sqlalchemy import (
    JSON,
    Boolean,
    DateTime,
    ForeignKey,
    LargeBinary,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


def _now():
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    # ABHA (Ayushman Bharat Health Account) linkage — mocked in this build,
    # same fields as the original users schema.
    abha_number: Mapped[str | None] = mapped_column(String(20), nullable=True)
    abha_address: Mapped[str | None] = mapped_column(String(120), nullable=True)
    abha_linked: Mapped[bool] = mapped_column(Boolean, default=False)
    # Account personalisation & security (columns via startup migration)
    avatar: Mapped[bytes | None] = mapped_column(LargeBinary, nullable=True)
    avatar_mime: Mapped[str | None] = mapped_column(String(120), nullable=True)
    totp_secret: Mapped[str | None] = mapped_column(String(64), nullable=True)
    totp_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    # Password recovery: bcrypt hash of the emailed 6-digit code + its expiry.
    reset_code_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)
    reset_expires: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    records: Mapped[list["Record"]] = relationship(back_populates="user", cascade="all, delete-orphan")


class Profile(Base):
    """A family member whose care is managed under this account (self, child,
    parent, ...). Schema aligned with A. Pawar's mock-ABHA service so each
    profile can hold its own ABHA credentials. The primary ('self') profile's
    data lives in rows with profile_id NULL, which keeps all pre-feature data
    valid without a rewrite."""

    __tablename__ = "profiles"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    name: Mapped[str] = mapped_column(String(120))
    relationship: Mapped[str] = mapped_column(String(20), default="self")  # self|child|parent|other
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False)
    abha_number: Mapped[str | None] = mapped_column(String(20), nullable=True)
    abha_address: Mapped[str | None] = mapped_column(String(120), nullable=True)
    abha_linked: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)


class HealthProfile(Base):
    """Basic health context collected at onboarding (Anurag's improvement #2).

    Separate table rather than columns on users: the schema bootstrap
    (create_all) adds missing tables on deploy but not missing columns, so
    this ships safely against the live database.
    """

    __tablename__ = "health_profiles"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True, index=True)
    date_of_birth: Mapped[str | None] = mapped_column(String(10), nullable=True)  # YYYY-MM-DD
    height_cm: Mapped[str | None] = mapped_column(String(10), nullable=True)
    weight_kg: Mapped[str | None] = mapped_column(String(10), nullable=True)
    blood_type: Mapped[str | None] = mapped_column(String(8), nullable=True)  # A+, O-, unknown...
    allergies: Mapped[str | None] = mapped_column(Text, nullable=True)
    conditions: Mapped[str | None] = mapped_column(Text, nullable=True)  # ongoing conditions, free text
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, onupdate=_now)


class Record(Base):
    """An uploaded health document (prescription, lab report, ...).

    The file bytes live in the database. Files here are small (a photo or a
    one-page PDF) and this removes the third-party storage dependency.
    """

    __tablename__ = "records"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    type: Mapped[str] = mapped_column(String(40), default="prescription")  # prescription | lab_report | other
    profile_id: Mapped[int | None] = mapped_column(nullable=True)  # NULL = primary/self profile
    file_name: Mapped[str] = mapped_column(String(255))
    mime_type: Mapped[str] = mapped_column(String(120))
    file_data: Mapped[bytes] = mapped_column(LargeBinary)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    # OCR text as confirmed by the user in the review step (human-in-the-loop).
    extracted_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    uploaded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    # When the user last verified the extracted text. uploaded_at is immutable
    # provenance; this is the audit stamp of the human-in-the-loop step.
    # (Added post-launch: created by the startup column migration in database.py.)
    confirmed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    user: Mapped["User"] = relationship(back_populates="records")


class CarePlan(Base):
    __tablename__ = "care_plans"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    record_id: Mapped[int | None] = mapped_column(ForeignKey("records.id"), nullable=True)
    profile_id: Mapped[int | None] = mapped_column(nullable=True)  # NULL = primary/self profile
    # The user-confirmed text the plan was generated from (traceability).
    source_text: Mapped[str] = mapped_column(Text)
    # Full CarePlanOutput JSON from the engine, stored verbatim.
    plan: Mapped[dict] = mapped_column(JSON)
    # Treatment lifecycle: duration parsed from the prescription; the user
    # explicitly starts the course; at its end they record how they feel.
    # NULL status = legacy plan (tracked without a window).
    duration_days: Mapped[int | None] = mapped_column(nullable=True)
    starts_on: Mapped[str | None] = mapped_column(String(10), nullable=True)  # YYYY-MM-DD
    status: Mapped[str | None] = mapped_column(String(12), nullable=True)  # draft|active|completed
    outcome: Mapped[str | None] = mapped_column(String(12), nullable=True)  # better|not_better
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)


class Medication(Base):
    __tablename__ = "medications"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    name: Mapped[str] = mapped_column(String(160))
    profile_id: Mapped[int | None] = mapped_column(nullable=True)  # NULL = primary/self profile
    dosage: Mapped[str | None] = mapped_column(String(120), nullable=True)
    frequency: Mapped[str | None] = mapped_column(String(120), nullable=True)
    timing: Mapped[str | None] = mapped_column(String(120), nullable=True)
    duration: Mapped[str | None] = mapped_column(String(120), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)


class Vital(Base):
    __tablename__ = "vitals"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    type: Mapped[str] = mapped_column(String(40))  # blood_pressure | glucose | weight | heart_rate | temperature
    profile_id: Mapped[int | None] = mapped_column(nullable=True)  # NULL = primary/self profile
    value: Mapped[str] = mapped_column(String(40))  # string so "120/80" works
    unit: Mapped[str | None] = mapped_column(String(20), nullable=True)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    measured_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)


class PushSubscription(Base):
    """One browser's Web Push endpoint. A user can have several (laptop,
    phone); dead ones are pruned when the push service returns 404/410."""

    __tablename__ = "push_subscriptions"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    endpoint: Mapped[str] = mapped_column(Text, unique=True)
    p256dh: Mapped[str] = mapped_column(String(255))
    auth: Mapped[str] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)


class NotificationSetting(Base):
    __tablename__ = "notification_settings"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True, index=True)
    daily_digest: Mapped[bool] = mapped_column(Boolean, default=False)
    # The user picks a local hour; we store the UTC hour the hourly dispatcher
    # compares against, plus the local rendering info for the settings UI.
    hour_local: Mapped[int] = mapped_column(default=8)
    tz_offset_minutes: Mapped[int] = mapped_column(default=-330)  # IST default
    hour_utc: Mapped[int] = mapped_column(default=2)


class TaskCompletion(Base):
    """One checked-off care-plan task on one day (adherence tracking)."""

    __tablename__ = "task_completions"
    __table_args__ = (UniqueConstraint("plan_id", "task_index", "day"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    plan_id: Mapped[int] = mapped_column(ForeignKey("care_plans.id"), index=True)
    task_index: Mapped[int] = mapped_column()
    day: Mapped[str] = mapped_column(String(10))  # user's local date, YYYY-MM-DD
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)


class ChatMessage(Base):
    __tablename__ = "chat_history"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    role: Mapped[str] = mapped_column(String(12))  # user | assistant
    profile_id: Mapped[int | None] = mapped_column(nullable=True)  # NULL = primary/self profile
    content: Mapped[str] = mapped_column(Text)
    safety_flag: Mapped[str | None] = mapped_column(String(32), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
