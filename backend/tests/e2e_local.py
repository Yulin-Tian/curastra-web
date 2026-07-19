"""Full-chain E2E: web backend (3000) -> Active Care Engine (8000).

Both servers must be running. Uses a real sample prescription image from the
engine's data/inputs, so this exercises real OCR and (if the engine has a key
and SIMULATION_MODE=false) real OpenAI calls.

Run:  .venv\\Scripts\\python.exe tests\\e2e_local.py
"""

import glob
import os
import sys
import uuid

import httpx

BACKEND = "http://localhost:3000"
ENGINE = "http://localhost:8000"
SAMPLES = r"C:\Users\tiany\OneDrive\BITS\StudyProject\active_care_engine\data\inputs"

client = httpx.Client(timeout=90)
failures = []


def check(name, condition, detail=""):
    print(f"[{'PASS' if condition else 'FAIL'}] {name}" + (f"  -> {detail}" if detail and not condition else ""))
    if not condition:
        failures.append(name)


# Both services healthy
r = client.get(f"{ENGINE}/health")
check("engine /health", r.status_code == 200, r.text)
r = client.get(f"{BACKEND}/health")
check("backend /health", r.status_code == 200, r.text)

# Fresh user
email = f"e2e-{uuid.uuid4().hex[:8]}@test.com"
r = client.post(f"{BACKEND}/api/auth/register", json={"name": "E2E Tester", "email": email, "password": "password123"})
check("register", r.status_code == 201, r.text)
headers = {"Authorization": f"Bearer {r.json()['token']}"}

# Upload a real sample prescription image
images = glob.glob(os.path.join(SAMPLES, "*.png")) + glob.glob(os.path.join(SAMPLES, "*.jpg"))
if not images:
    print("No sample image found in data/inputs — aborting.")
    sys.exit(1)
sample = images[0]
print(f"       (sample: {os.path.basename(sample)})")
with open(sample, "rb") as f:
    r = client.post(
        f"{BACKEND}/api/records",
        files={"file": (os.path.basename(sample), f.read(), "image/png")},
        data={"type": "prescription", "notes": "e2e test"},
        headers=headers,
    )
check("upload record", r.status_code == 201, r.text)
rec_id = r.json()["id"]

# OCR through the chain: backend pulls bytes from DB, engine runs tesseract
r = client.post(f"{BACKEND}/api/records/{rec_id}/extract", headers=headers)
ocr_ok = r.status_code == 200 and len(r.json().get("extracted_text", "")) > 50
check("extract (real OCR via engine)", ocr_ok, r.text[:300])
extracted = r.json().get("extracted_text", "") if r.status_code == 200 else ""
print(f"       (OCR chars: {len(extracted)})")

# Human-in-the-loop confirm
r = client.post(f"{BACKEND}/api/records/{rec_id}/confirm-text", json={"verified_text": extracted}, headers=headers)
check("confirm text", r.status_code == 200, r.text[:300])

# Care plan generation (engine LLM)
r = client.post(f"{BACKEND}/api/care-plans", json={"record_id": rec_id, "verified_text": extracted}, headers=headers)
plan_ok = r.status_code == 201 and "plan" in r.json() and "safety_disclaimer" in r.json()["plan"]
check("generate care plan (engine LLM)", plan_ok, r.text[:300])
plan_id = r.json().get("id") if r.status_code == 201 else None
if plan_ok:
    p = r.json()["plan"]
    print(f"       (plan: {len(p.get('medications', []))} meds, {len(p.get('tasks', []))} tasks, "
          f"{len(p.get('red_flags', []))} red flags, simulated={p.get('simulated', 'n/a')})")

# Import plan medications into the user's list
if plan_id:
    r = client.post(f"{BACKEND}/api/care-plans/{plan_id}/import-medications", headers=headers)
    check("import medications from plan", r.status_code == 200, r.text[:300])
    print(f"       (imported: {len(r.json())} medications)")

# Chat turn 1 — context should include the imported meds
r = client.post(f"{BACKEND}/api/chat", json={"message": "When should I take my medicines?"}, headers=headers)
chat_ok = r.status_code == 200 and r.json().get("reply")
check("chat with context", chat_ok, r.text[:300])
if chat_ok:
    print(f"       (used_context={r.json().get('used_context')}, safety_flag={r.json().get('safety_flag')})")

# Chat turn 2 — multi-turn: 'it' must resolve from history
r = client.post(f"{BACKEND}/api/chat", json={"message": "And should I take it before or after food?"}, headers=headers)
check("chat multi-turn follow-up", r.status_code == 200 and r.json().get("reply"), r.text[:300])

# History persisted (4 messages)
r = client.get(f"{BACKEND}/api/chat/history", headers=headers)
check("chat history persisted", r.status_code == 200 and len(r.json()) == 4, r.text[:300])

# Vitals + insights
for vital in [{"type": "blood_pressure", "value": "138/88", "unit": "mmHg"},
              {"type": "blood_pressure", "value": "142/90", "unit": "mmHg"},
              {"type": "glucose", "value": "110", "unit": "mg/dL"}]:
    client.post(f"{BACKEND}/api/vitals", json=vital, headers=headers)
r = client.post(f"{BACKEND}/api/vitals/insights", headers=headers)
check("insights from vitals", r.status_code == 200 and "insights" in r.json(), r.text[:300])

# Med safety check
r = client.post(f"{BACKEND}/api/medications/safety-check", headers=headers)
check("medication safety check", r.status_code in (200, 400), r.text[:300])

# Simplify pass-through
r = client.post(f"{BACKEND}/api/ai/simplify", json={"text": "Tab Pan 40 OD AC"}, headers=headers)
check("simplify", r.status_code == 200 and r.json().get("simplified"), r.text[:300])

print()
if failures:
    print(f"{len(failures)} FAILURES: {failures}")
    sys.exit(1)
print("Full-chain E2E passed: web backend <-> Active Care Engine verified.")
