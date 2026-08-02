from dataclasses import dataclass
import os
from dotenv import load_dotenv

# override=False: real environment variables win over .env. Render sets real
# env vars (no .env file there), and tests set DATABASE_URL before importing.
load_dotenv(override=False)


@dataclass(frozen=True)
class Settings:
    database_url: str = os.getenv("DATABASE_URL", "sqlite:///./curastra.db")
    jwt_secret: str = os.getenv("JWT_SECRET", "dev-only-secret-never-use-in-production-0000")
    jwt_algorithm: str = "HS256"
    jwt_expires_minutes: int = int(os.getenv("JWT_EXPIRES_MINUTES", "10080"))  # 7 days

    # The Active Care Engine (Python AI microservice). The engine is stateless;
    # this backend owns the database and calls it over HTTP per request.
    ai_engine_url: str = os.getenv("AI_ENGINE_URL", "http://localhost:8000")
    internal_api_key: str = os.getenv("INTERNAL_API_KEY", "")

    # Web Push (daily reminders). Keys are VAPID; the public one is shared
    # with browsers, the private one signs each push. CRON_SECRET guards the
    # /dispatch endpoint that the external scheduler calls hourly.
    vapid_private_key: str = os.getenv("VAPID_PRIVATE_KEY", "")
    vapid_public_key: str = os.getenv("VAPID_PUBLIC_KEY", "")
    vapid_subject: str = os.getenv("VAPID_SUBJECT", "mailto:group110@curastra.example")
    cron_secret: str = os.getenv("CRON_SECRET", "")

    # Password-recovery email delivery. Render blocks outbound SMTP ports, so
    # production uses Brevo's HTTPS API (BREVO_API_KEY); SMTP_* works locally.
    # Neither configured => dev mode: the API returns the code.
    brevo_api_key: str = os.getenv("BREVO_API_KEY", "").strip()
    smtp2go_api_key: str = os.getenv("SMTP2GO_API_KEY", "").strip()
    smtp_host: str = os.getenv("SMTP_HOST", "")
    smtp_port: int = int(os.getenv("SMTP_PORT", "587"))
    smtp_user: str = os.getenv("SMTP_USER", "").strip()
    # Google shows app passwords with spaces; SMTP wants them without.
    smtp_password: str = os.getenv("SMTP_PASS", "").replace(" ", "").strip()
    smtp_from: str = os.getenv("SMTP_FROM", os.getenv("SMTP_USER", ""))

    cors_origins: tuple = tuple(
        o.strip()
        for o in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
        if o.strip()
    )


settings = Settings()
