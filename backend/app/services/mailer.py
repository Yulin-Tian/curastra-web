"""Minimal SMTP mailer for password-recovery codes.

Configured via SMTP_* env vars (Gmail app passwords work: smtp.gmail.com:587).
When unconfigured, is_configured() is False and callers fall back to dev mode.
"""

import smtplib
from email.mime.text import MIMEText

import httpx

from ..config import settings


def is_configured() -> bool:
    return bool(settings.resend_api_key or settings.smtp2go_api_key or settings.brevo_api_key) or bool(
        settings.smtp_host and settings.smtp_user and settings.smtp_password
    )


def _send_via_resend(to: str, subject: str, body: str) -> None:
    resp = httpx.post(
        "https://api.resend.com/emails",
        headers={"Authorization": f"Bearer {settings.resend_api_key}"},
        json={
            "from": settings.email_from or settings.smtp_from or settings.smtp_user,
            "to": [to],
            "subject": subject,
            "text": body,
        },
        timeout=20,
    )
    resp.raise_for_status()


def _send_via_smtp2go(to: str, subject: str, body: str) -> None:
    resp = httpx.post(
        "https://api.smtp2go.com/v3/email/send",
        json={
            "api_key": settings.smtp2go_api_key,
            "sender": settings.smtp_from or settings.smtp_user,
            "to": [to],
            "subject": subject,
            "text_body": body,
        },
        timeout=20,
    )
    resp.raise_for_status()
    data = resp.json().get("data", {})
    if data.get("succeeded", 0) < 1:
        raise RuntimeError(f"smtp2go rejected the message: {data}")


def _send_via_brevo(to: str, subject: str, body: str) -> None:
    resp = httpx.post(
        "https://api.brevo.com/v3/smtp/email",
        headers={"api-key": settings.brevo_api_key, "content-type": "application/json"},
        json={
            "sender": {"email": settings.smtp_from or settings.smtp_user, "name": "Curastra"},
            "to": [{"email": to}],
            "subject": subject,
            "textContent": body,
        },
        timeout=20,
    )
    resp.raise_for_status()


def _send_via_smtp(to: str, subject: str, body: str) -> None:
    msg = MIMEText(body, "plain", "utf-8")
    msg["Subject"] = subject
    msg["From"] = settings.smtp_from or settings.smtp_user
    msg["To"] = to

    with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=20) as server:
        server.starttls()
        server.login(settings.smtp_user, settings.smtp_password)
        server.send_message(msg)


def send_email(to: str, subject: str, body: str) -> None:
    if settings.resend_api_key:
        _send_via_resend(to, subject, body)
    elif settings.smtp2go_api_key:
        _send_via_smtp2go(to, subject, body)
    elif settings.brevo_api_key:
        _send_via_brevo(to, subject, body)
    else:
        _send_via_smtp(to, subject, body)


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
