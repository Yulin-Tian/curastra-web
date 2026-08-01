"""Populate a demo account with realistic data for demos and video recording.

Creates (idempotently): a demo user with health basics, three uploaded records
run through real OCR + confirmation, care plans for each, imported medications,
two weeks of vitals history, chat turns, and today's adherence checks.

Run:
  .venv\\Scripts\\python.exe tests\\seed_demo.py                 # against local (:3000)
  .venv\\Scripts\\python.exe tests\\seed_demo.py https://curastra-web-backend.onrender.com

Requires the engine to be up (real OCR and LLM calls; costs a few cents).
"""

import glob
import os
import sys
from datetime import datetime, timedelta, timezone

import httpx

BASE = sys.argv[1].rstrip("/") if len(sys.argv) > 1 else "http://localhost:3000"
EMAIL = "demo@curastra.app"
PASSWORD = "curastra-demo-2026"
SAMPLES = r"C:\Users\tiany\OneDrive\BITS\StudyProject\active_care_engine\data\inputs"

client = httpx.Client(timeout=180)
print(f"Seeding {BASE} as {EMAIL}")

# ---- account ----
r = client.post(f"{BASE}/api/auth/register",
                json={"name": "Demo Patient", "email": EMAIL, "password": PASSWORD})
if r.status_code == 409:
    r = client.post(f"{BASE}/api/auth/login", json={"email": EMAIL, "password": PASSWORD})
r.raise_for_status()
H = {"Authorization": f"Bearer {r.json()['token']}"}
print("account ready")

# ---- health basics ----
client.put(f"{BASE}/api/profile/health", headers=H, json={
    "date_of_birth": "1962-03-05", "height_cm": "168", "weight_kg": "74",
    "blood_type": "O+", "allergies": "penicillin",
    "conditions": "hypertension, acid reflux",
}).raise_for_status()
print("health basics saved")

# ---- records -> OCR -> confirm -> care plan ----
existing = client.get(f"{BASE}/api/records", headers=H).json()
have = {rec["file_name"] for rec in existing}
candidates = sorted(glob.glob(os.path.join(SAMPLES, "*.png")) + glob.glob(os.path.join(SAMPLES, "*.docx")))[:3]

plan_ids = []
for i, path in enumerate(candidates):
    fname = os.path.basename(path)
    if fname in have:
        print(f"record exists, skipping upload: {fname}")
        continue
    mime = "image/png" if fname.endswith(".png") else \
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    with open(path, "rb") as f:
        r = client.post(f"{BASE}/api/records", headers=H,
                        files={"file": (fname, f.read(), mime)},
                        data={"type": "prescription",
                              "notes": ["Follow-up visit", "New prescription", "Repeat consultation"][i % 3]})
    r.raise_for_status()
    rec_id = r.json()["id"]
    r = client.post(f"{BASE}/api/records/{rec_id}/extract", headers=H)
    r.raise_for_status()
    text = r.json()["extracted_text"]
    client.post(f"{BASE}/api/records/{rec_id}/confirm-text", headers=H,
                json={"verified_text": text}).raise_for_status()
    r = client.post(f"{BASE}/api/care-plans", headers=H,
                    json={"record_id": rec_id, "verified_text": text})
    r.raise_for_status()
    plan = r.json()
    plan_ids.append(plan["id"])
    print(f"record + plan created: {fname} (plan {plan['id']}, "
          f"{len(plan['plan'].get('medications', []))} meds, {len(plan['plan'].get('tasks', []))} tasks)")

# import meds from the first new plan
if plan_ids:
    r = client.post(f"{BASE}/api/care-plans/{plan_ids[0]}/import-medications", headers=H)
    print(f"imported {len(r.json())} medications")

# ---- vitals: 14 days of history ----
if not client.get(f"{BASE}/api/vitals?limit=5", headers=H).json():
    now = datetime.now(timezone.utc)
    for d in range(14, 0, -1):
        when = (now - timedelta(days=d)).replace(hour=8, minute=30)
        sys_bp = 128 + d  # 142 two weeks ago, trending down to 129 yesterday
        dia_bp = 84 + d // 2
        client.post(f"{BASE}/api/vitals", headers=H, json={
            "type": "blood_pressure", "value": f"{sys_bp}/{dia_bp}",
            "unit": "mmHg", "measured_at": when.isoformat()})
        if d % 2 == 0:
            client.post(f"{BASE}/api/vitals", headers=H, json={
                "type": "glucose", "value": str(98 + (d * 3) % 14),
                "unit": "mg/dL", "measured_at": when.isoformat()})
        if d % 3 == 0:
            client.post(f"{BASE}/api/vitals", headers=H, json={
                "type": "weight", "value": str(round(74.6 - (14 - d) * 0.06, 1)),
                "unit": "kg", "measured_at": when.isoformat()})
    print("vitals history seeded (14 days)")
else:
    print("vitals exist, skipping")

# ---- adherence: check some tasks for today ----
plans = client.get(f"{BASE}/api/care-plans", headers=H).json()
today = datetime.now().strftime("%Y-%m-%d")
if plans:
    top = plans[0]
    n_tasks = len(top["plan"].get("tasks", []))
    for idx in range(max(n_tasks - 1, 0)):  # all but one: shows progress, not perfection
        client.post(f"{BASE}/api/care-plans/{top['id']}/tasks/{idx}/toggle",
                    headers=H, json={"day": today})
    print(f"adherence: checked {max(n_tasks - 1, 0)}/{n_tasks} tasks for today")

# ---- chat history ----
history = client.get(f"{BASE}/api/chat/history", headers=H).json()
if not history:
    for q in ["When should I take my medicines?",
              "Is my blood pressure improving?"]:
        r = client.post(f"{BASE}/api/chat", headers=H, json={"message": q})
        print(f"chat: '{q}' -> {r.json().get('reply', '')[:70]}...")
else:
    print("chat history exists, skipping")

print()
print("Demo account ready:")
print(f"  {EMAIL}  /  {PASSWORD}")
