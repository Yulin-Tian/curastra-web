"""Quick smoke test of the core (non-engine) API paths.

Run:  .venv\\Scripts\\python.exe tests\\smoke_test.py
Uses a throwaway SQLite DB so it never touches real data.
"""

import os
import sys

os.environ["DATABASE_URL"] = "sqlite:///./smoke_test.db"

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402

client = TestClient(app, raise_server_exceptions=False)
failures = []


def check(name: str, condition: bool, detail=""):
    status = "PASS" if condition else "FAIL"
    print(f"[{status}] {name}" + (f"  -> {detail}" if detail and not condition else ""))
    if not condition:
        failures.append(name)


# Health
r = client.get("/health")
check("health", r.status_code == 200 and r.json()["status"] == "ok", r.text)

# Register
r = client.post("/api/auth/register", json={"name": "Smoke Tester", "email": "smoke@test.com", "password": "password123"})
check("register", r.status_code == 201 and "token" in r.json(), r.text)
token = r.json().get("token", "")
headers = {"Authorization": f"Bearer {token}"}

# Duplicate register -> 409 with error shape
r = client.post("/api/auth/register", json={"name": "Dup", "email": "smoke@test.com", "password": "password123"})
check("register duplicate -> 409 {error}", r.status_code == 409 and "error" in r.json(), r.text)

# Login wrong password
r = client.post("/api/auth/login", json={"email": "smoke@test.com", "password": "wrongpass1"})
check("login wrong password -> 401", r.status_code == 401, r.text)

# Login right
r = client.post("/api/auth/login", json={"email": "smoke@test.com", "password": "password123"})
check("login", r.status_code == 200 and "token" in r.json(), r.text)

# Me (auth) / no auth
r = client.get("/api/auth/me", headers=headers)
check("me", r.status_code == 200 and r.json()["email"] == "smoke@test.com", r.text)
r = client.get("/api/auth/me")
check("me without token -> 401", r.status_code == 401, r.text)

# ABHA mock enrollment (contract per the mock ABHA service spec)
r = client.post("/api/abha/enroll/initiate", json={"aadhaarNumber": "12345"}, headers=headers)
check("abha enroll bad aadhaar -> 400 envelope", r.status_code == 400 and r.json().get("success") is False, r.text)
r = client.post("/api/abha/enroll/initiate", json={"aadhaarNumber": "123456789012"}, headers=headers)
ok = r.status_code == 200 and r.json()["success"] and r.json()["data"]["abhaNumber"].startswith("91-") \
    and r.json()["data"]["abhaAddress"].endswith("@sbx")
check("abha enroll generates credentials", ok, r.text)
r = client.post("/api/abha/enroll/initiate", json={"aadhaarNumber": "123456789012"}, headers=headers)
check("abha enroll already linked -> 409", r.status_code == 409 and r.json().get("success") is False, r.text)
r = client.post("/api/abha/unlink", headers=headers)
check("abha unlink", r.status_code == 200 and r.json()["abha_linked"] is False, r.text)
r = client.post("/api/abha/enroll/initiate", json={"aadhaarNumber": "123456789012"}, headers=headers)
check("abha re-enroll after unlink", r.status_code == 200, r.text)

# Record upload + list + detail + file roundtrip
fake_png = b"\x89PNG\r\n\x1a\n" + b"fakebytes" * 10
r = client.post(
    "/api/records",
    files={"file": ("rx.png", fake_png, "image/png")},
    data={"type": "prescription", "notes": "smoke note"},
    headers=headers,
)
check("record upload", r.status_code == 201, r.text)
rec_id = r.json().get("id")

r = client.get("/api/records", headers=headers)
check("records list", r.status_code == 200 and len(r.json()) == 1, r.text)

r = client.get(f"/api/records/{rec_id}/file", headers=headers)
check("record file roundtrip", r.status_code == 200 and r.content == fake_png, str(r.status_code))

# Confirm text (human-in-the-loop persistence) + audit timestamp
r = client.post(f"/api/records/{rec_id}/confirm-text", json={"verified_text": "Tab Pan 40 OD"}, headers=headers)
check("confirm text", r.status_code == 200 and r.json()["extracted_text"] == "Tab Pan 40 OD", r.text)
check("confirm sets confirmed_at", r.json().get("confirmed_at") is not None, r.text)

# Adherence: create a plan directly in the DB (engine is down in this suite)
from app.database import SessionLocal  # noqa: E402
from app.models import CarePlan  # noqa: E402

me_id = client.get("/api/auth/me", headers=headers).json()["id"]
s = SessionLocal()
plan_row = CarePlan(
    user_id=me_id,
    record_id=None,
    source_text="test",
    plan={"tasks": [{"category": "medication", "instruction": "a"}, {"category": "other", "instruction": "b"}],
          "medications": [], "red_flags": [], "clarification_questions": [], "safety_disclaimer": "x"},
)
s.add(plan_row)
s.commit()
plan_id = plan_row.id
s.close()

r = client.get(f"/api/care-plans/{plan_id}/adherence?day=2026-08-01", headers=headers)
check("adherence empty", r.status_code == 200 and r.json()["completed"] == [] and r.json()["total_tasks"] == 2, r.text)
r = client.post(f"/api/care-plans/{plan_id}/tasks/0/toggle", json={"day": "2026-08-01"}, headers=headers)
check("adherence toggle on", r.status_code == 200 and r.json()["completed"] == [0], r.text)
r = client.post(f"/api/care-plans/{plan_id}/tasks/0/toggle", json={"day": "2026-08-01"}, headers=headers)
check("adherence toggle off", r.status_code == 200 and r.json()["completed"] == [], r.text)
r = client.post(f"/api/care-plans/{plan_id}/tasks/9/toggle", json={"day": "2026-08-01"}, headers=headers)
check("adherence bad index -> 400", r.status_code == 400, r.text)
r = client.post(f"/api/care-plans/{plan_id}/tasks/1/toggle", json={"day": "bad-date"}, headers=headers)
check("adherence bad day -> 400", r.status_code == 400, r.text)
client.post(f"/api/care-plans/{plan_id}/tasks/1/toggle", json={"day": "2026-08-01"}, headers=headers)
r = client.get(f"/api/care-plans/{plan_id}/adherence/month?month=2026-08", headers=headers)
check("adherence month heatmap", r.status_code == 200 and r.json()["days"].get("2026-08-01") == 1
      and r.json()["total_tasks"] == 2, r.text)
r = client.get(f"/api/care-plans/{plan_id}/adherence/month?month=bad", headers=headers)
check("adherence month bad format -> 400", r.status_code == 400, r.text)

# Medications CRUD
r = client.post("/api/medications", json={"name": "Pan 40", "dosage": "40 mg", "frequency": "OD"}, headers=headers)
check("medication add", r.status_code == 201, r.text)
med_id = r.json().get("id")
r = client.patch(f"/api/medications/{med_id}", json={"active": False}, headers=headers)
check("medication deactivate", r.status_code == 200 and r.json()["active"] is False, r.text)
r = client.get("/api/medications", headers=headers)
check("medications list excludes inactive", r.status_code == 200 and len(r.json()) == 0, r.text)

# Vitals
r = client.post("/api/vitals", json={"type": "blood_pressure", "value": "120/80", "unit": "mmHg"}, headers=headers)
check("vital add", r.status_code == 200 or r.status_code == 201, r.text)
r = client.get("/api/vitals", headers=headers)
check("vitals list", r.status_code == 200 and len(r.json()) == 1, r.text)

# Health profile roundtrip
r = client.get("/api/profile/health", headers=headers)
check("health profile default", r.status_code == 200 and r.json()["blood_type"] is None, r.text)
r = client.put(
    "/api/profile/health",
    json={"date_of_birth": "1999-08-19", "height_cm": "175", "weight_kg": "70",
          "blood_type": "O+", "allergies": "penicillin"},
    headers=headers,
)
check("health profile save", r.status_code == 200 and r.json()["allergies"] == "penicillin", r.text)
r = client.put("/api/profile/health", json={"blood_type": "not-a-type"}, headers=headers)
check("health profile bad blood type -> unknown", r.status_code == 200 and r.json()["blood_type"] == "unknown", r.text)
r = client.put("/api/profile/health", json={"date_of_birth": "19/08/1999"}, headers=headers)
check("health profile bad dob -> 422", r.status_code == 422, r.text)

# Engine-dependent endpoint with engine DOWN -> friendly 503 fallback
r = client.post(f"/api/records/{rec_id}/extract", headers=headers)
check("extract with engine down -> 503 {error}", r.status_code == 503 and "error" in r.json(), r.text)

# Password recovery (dev mode: no SMTP configured -> code in response)
r = client.post("/api/auth/forgot", json={"email": "nobody@test.com"})
check("forgot unknown email -> generic 200 no code", r.status_code == 200 and "dev_code" not in r.json(), r.text)
r = client.post("/api/auth/forgot", json={"email": "smoke@test.com"})
check("forgot known email -> dev code", r.status_code == 200 and len(r.json().get("dev_code", "")) == 6, r.text)
reset_code = r.json()["dev_code"]
r = client.post("/api/auth/reset", json={"email": "smoke@test.com", "code": "000000", "new_password": "resetpass123"})
check("reset wrong code -> 400", r.status_code == 400, r.text)
r = client.post("/api/auth/reset", json={"email": "smoke@test.com", "code": reset_code, "new_password": "resetpass123"})
check("reset with code", r.status_code == 200, r.text)
r = client.post("/api/auth/login", json={"email": "smoke@test.com", "password": "resetpass123"})
check("login after reset", r.status_code == 200, r.text)
r = client.post("/api/auth/reset", json={"email": "smoke@test.com", "code": reset_code, "new_password": "again12345"})
check("reset code single-use -> 400", r.status_code == 400, r.text)
# restore original password for the rest of the suite
client.post("/api/auth/change-password", json={"current_password": "resetpass123", "new_password": "password123"}, headers=headers)

# Account security: change password, TOTP 2FA, avatar
r = client.post("/api/auth/change-password", json={"current_password": "wrong", "new_password": "password456"}, headers=headers)
check("change password wrong current -> 400", r.status_code == 400, r.text)
r = client.post("/api/auth/change-password", json={"current_password": "password123", "new_password": "password456"}, headers=headers)
check("change password", r.status_code == 200, r.text)
r = client.post("/api/auth/login", json={"email": "smoke@test.com", "password": "password456"})
check("login with new password", r.status_code == 200, r.text)

import pyotp  # noqa: E402

r = client.post("/api/auth/totp/setup", headers=headers)
check("totp setup", r.status_code == 200 and "otpauth" in r.json()["otpauth_uri"], r.text)
secret = r.json()["secret"]
r = client.post("/api/auth/totp/enable", json={"code": "000000"}, headers=headers)
check("totp enable bad code -> 400", r.status_code == 400, r.text)
r = client.post("/api/auth/totp/enable", json={"code": pyotp.TOTP(secret).now()}, headers=headers)
check("totp enable", r.status_code == 200, r.text)
r = client.post("/api/auth/login", json={"email": "smoke@test.com", "password": "password456"})
check("login without totp -> totp_required", r.status_code == 401 and r.json()["error"] == "totp_required", r.text)
r = client.post("/api/auth/login", json={"email": "smoke@test.com", "password": "password456", "totp_code": pyotp.TOTP(secret).now()})
check("login with totp code", r.status_code == 200, r.text)
r = client.post("/api/auth/totp/disable", json={"password": "password456"}, headers=headers)
check("totp disable", r.status_code == 200, r.text)

r = client.post("/api/auth/avatar", files={"file": ("me.png", fake_png, "image/png")}, headers=headers)
check("avatar upload", r.status_code == 201, r.text)
r = client.get("/api/auth/avatar", headers=headers)
check("avatar roundtrip", r.status_code == 200 and r.content == fake_png, str(r.status_code))
r = client.post("/api/auth/avatar", files={"file": ("x.txt", b"hi", "text/plain")}, headers=headers)
check("avatar non-image -> 400", r.status_code == 400, r.text)

# Multi-profile: creation, scoping, per-profile ABHA
r = client.get("/api/profiles", headers=headers)
check("profiles auto-primary", r.status_code == 200 and r.json()[0]["is_primary"] is True, r.text)
r = client.post("/api/profiles", json={"name": "Little Anu", "relationship": "child"}, headers=headers)
check("profile create child", r.status_code == 201, r.text)
child_id = r.json()["id"]
r = client.post("/api/profiles", json={"name": "X", "relationship": "boss"}, headers=headers)
check("profile bad relationship -> 400", r.status_code == 400, r.text)

child_headers = {**headers, "X-Profile-Id": str(child_id)}
r = client.post("/api/medications", json={"name": "Calpol 250"}, headers=child_headers)
check("child med add", r.status_code == 201, r.text)
r = client.get("/api/medications", headers=headers)
self_meds = [m["name"] for m in r.json()]
check("self meds exclude child's", "Calpol 250" not in self_meds, str(self_meds))
r = client.get("/api/medications", headers=child_headers)
check("child meds scoped", [m["name"] for m in r.json()] == ["Calpol 250"], r.text)

r = client.post("/api/abha/enroll/initiate", json={"aadhaarNumber": "222233334444"}, headers=child_headers)
check("child abha enroll", r.status_code == 200 and r.json()["data"]["profile_id"] == str(child_id), r.text)
r = client.get("/api/profiles", headers=headers)
child_row = next(p for p in r.json() if p["id"] == child_id)
check("child profile holds own abha", child_row["abha_linked"] is True, r.text)

r = client.delete(f"/api/profiles/{child_id}", headers=headers)
check("profile delete blocked with data", r.status_code == 400, r.text)

# Cross-user isolation: second user cannot see first user's record
r = client.post("/api/auth/register", json={"name": "Other", "email": "other@test.com", "password": "password123"})
other_headers = {"Authorization": f"Bearer {r.json()['token']}"}
r = client.get(f"/api/records/{rec_id}", headers=other_headers)
check("cross-user record access -> 404", r.status_code == 404, r.text)

print()
if failures:
    print(f"{len(failures)} FAILURES: {failures}")
    sys.exit(1)
print("All smoke tests passed.")
