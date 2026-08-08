"""Password strength policy.

Enforced wherever a password is SET — registration, change, and reset — but
never at login, so accounts created before the policy keep working until
their next password change.
"""

import re

from fastapi import HTTPException

POLICY_MESSAGE = (
    "Password must be at least 10 characters and include an uppercase letter, "
    "a lowercase letter, and a number."
)


def validate_password_strength(password: str) -> None:
    ok = (
        len(password) >= 10
        and re.search(r"[a-z]", password)
        and re.search(r"[A-Z]", password)
        and re.search(r"\d", password)
    )
    if not ok:
        raise HTTPException(status_code=400, detail=POLICY_MESSAGE)
