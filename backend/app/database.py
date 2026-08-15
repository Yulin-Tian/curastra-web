from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from .config import settings

# Render's Postgres URLs start with postgres:// but SQLAlchemy 2 requires
# postgresql://.
_url = settings.database_url
if _url.startswith("postgres://"):
    _url = _url.replace("postgres://", "postgresql://", 1)

_connect_args = {"check_same_thread": False} if _url.startswith("sqlite") else {}

engine = create_engine(_url, connect_args=_connect_args)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Columns added to EXISTING tables after first deploy. create_all() creates
# missing tables but never missing columns, so each (table, column, pg_type,
# generic_type) here is applied idempotently at startup.
_COLUMN_MIGRATIONS = [
    ("records", "confirmed_at", "TIMESTAMPTZ", "TIMESTAMP"),
    # Multi-profile scoping: NULL means the account's primary ('self') profile.
    ("records", "profile_id", "INTEGER", "INTEGER"),
    ("care_plans", "profile_id", "INTEGER", "INTEGER"),
    ("care_plans", "title", "TEXT", "TEXT"),
    ("medications", "profile_id", "INTEGER", "INTEGER"),
    ("vitals", "profile_id", "INTEGER", "INTEGER"),
    ("chat_history", "profile_id", "INTEGER", "INTEGER"),
    # Account security & personalisation
    ("users", "avatar", "BYTEA", "BLOB"),
    ("users", "avatar_mime", "VARCHAR(120)", "VARCHAR(120)"),
    ("users", "totp_secret", "VARCHAR(64)", "VARCHAR(64)"),
    ("users", "totp_enabled", "BOOLEAN DEFAULT FALSE", "BOOLEAN DEFAULT 0"),
    ("users", "reset_code_hash", "VARCHAR(255)", "VARCHAR(255)"),
    ("users", "reset_expires", "TIMESTAMPTZ", "TIMESTAMP"),
    # Care-plan treatment lifecycle (duration from the prescription, an
    # explicit start, and an end-of-course outcome)
    ("care_plans", "duration_days", "INTEGER", "INTEGER"),
    ("care_plans", "starts_on", "VARCHAR(10)", "VARCHAR(10)"),
    ("care_plans", "status", "VARCHAR(12)", "VARCHAR(12)"),
    ("care_plans", "outcome", "VARCHAR(12)", "VARCHAR(12)"),
    # Emergency card: who to call when things go wrong
    ("health_profiles", "emergency_contact_name", "VARCHAR(120)", "VARCHAR(120)"),
    ("health_profiles", "emergency_contact_phone", "VARCHAR(20)", "VARCHAR(20)"),
    # End-of-course push: sent once per plan
    ("care_plans", "end_notified", "BOOLEAN DEFAULT FALSE", "BOOLEAN DEFAULT 0"),
    # Terms/privacy consent timestamp (DPDP: demonstrable consent)
    ("users", "consented_at", "TIMESTAMPTZ", "TIMESTAMP"),
    # Per-dose medicine reminders (frequency-aware pushes)
    ("notification_settings", "med_reminders", "BOOLEAN DEFAULT FALSE", "BOOLEAN DEFAULT 0"),
]


def apply_column_migrations():
    from sqlalchemy import text

    is_pg = engine.dialect.name == "postgresql"
    for table, column, pg_type, generic_type in _COLUMN_MIGRATIONS:
        col_type = pg_type if is_pg else generic_type
        try:
            with engine.begin() as conn:
                conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} {col_type}"))
        except Exception:
            pass  # already exists
