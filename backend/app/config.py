from dataclasses import dataclass
import os
from dotenv import load_dotenv

load_dotenv(override=True)


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

    cors_origins: tuple = tuple(
        o.strip()
        for o in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
        if o.strip()
    )


settings = Settings()
