"""Minimal SMTP mailer for password-recovery codes.

Configured via SMTP_* env vars (Gmail app passwords work: smtp.gmail.com:587).
When unconfigured, is_configured() is False and callers fall back to dev mode.
"""

import smtplib
from email.mime.text import MIMEText

from ..config import settings


def is_configured() -> bool:
    return bool(settings.smtp_host and settings.smtp_user and settings.smtp_password)


def send_email(to: str, subject: str, body: str) -> None:
    msg = MIMEText(body, "plain", "utf-8")
    msg["Subject"] = subject
    msg["From"] = settings.smtp_from or settings.smtp_user
    msg["To"] = to

    with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=20) as server:
        server.starttls()
        server.login(settings.smtp_user, settings.smtp_password)
        server.send_message(msg)


RESET_TEMPLATES = {
    "en": (
        "Your Curastra password reset code",
        "Hello {name},\n\n"
        "Your password reset code is: {code}\n\n"
        "It is valid for 15 minutes. If you did not request this, you can "
        "safely ignore this email.\n\n"
        "Curastra — everyday care, continued",
    ),
    "hi": (
        "आपका Curastra पासवर्ड रीसेट कोड",
        "नमस्ते {name},\n\n"
        "आपका पासवर्ड रीसेट कोड है: {code}\n\n"
        "यह 15 मिनट तक मान्य है। यदि आपने यह अनुरोध नहीं किया है, तो इस ईमेल "
        "को अनदेखा कर दें।\n\n"
        "Curastra — रोज़मर्रा की देखभाल, निरंतर",
    ),
}
