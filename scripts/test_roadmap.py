import os
import sys
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.app.main import app

client = TestClient(app)

def test_roadmap():
    print("Testing Roadmap API with TestClient...")
    
    # 1. Login as entrepreneur
    login_resp = client.post("/api/auth/login", json={
        "email": "demo@example.com",
        "password": "Demo123!"
    })
    assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("[PASS] 1. Authentication successful.")

    # 2. Get Roadmap
    resp = client.get("/api/roadmap", headers=headers)
    assert resp.status_code == 200, f"GET /api/roadmap failed: {resp.text}"
    data = resp.json()
    
    steps = data["steps"]
    summary = data["summary"]
    next_step = data["next_step"]

    print(f"[PASS] 2. Fetched roadmap: {len(steps)} steps.")
    print(f"       Summary: total={summary['total_steps']}, completed={summary['completed_steps']}, progress={summary['completion_percentage']}%")
    print(f"       Next actionable step: {next_step['code'] if next_step else 'None'}")

    assert len(steps) >= 11, f"Expected at least 11 steps, got {len(steps)}"
    
    # Verify Step 1 is PAN
    assert steps[0]["code"] == "PAN", f"First step should be PAN, got {steps[0]['code']}"
    assert steps[0]["category"] == "FOUNDATIONAL"
    assert steps[0]["status"] == "DONE"
    assert steps[0]["reference_number"] == "AAACD1234F"

    # Verify foundational steps 1-5 are DONE
    for s in steps[:5]:
        assert s["category"] == "FOUNDATIONAL"
        assert s["status"] == "DONE", f"Step {s['code']} should be DONE, got {s['status']}"
        assert s["is_locked"] is False

    # Find FACTORY_LICENSE and FSSAI
    factory_step = next(s for s in steps if s["code"] == "FACTORY_LICENSE")
    fssai_step = next(s for s in steps if s["code"] == "FSSAI")
    assert factory_step["is_locked"] is False, "FACTORY_LICENSE should be unlocked because UDYAM and GST are DONE"
    assert fssai_step["is_locked"] is False, "FSSAI should be unlocked because UDYAM and GST are DONE"

    # Verify CONSENT_TO_OPERATE is LOCKED (depends on POLLUTION_CONSENT, FIRE_NOC which are NOT_STARTED)
    cto_step = next(s for s in steps if s["code"] == "CONSENT_TO_OPERATE")
    assert cto_step["is_locked"] is True, "CONSENT_TO_OPERATE must be locked until CTE and FIRE_NOC are DONE"
    assert cto_step["status"] == "LOCKED"
    print(f"[PASS] 3. Dependency locking verified: CTO is locked with unmet dependencies: {cto_step['unmet_dependencies']}")

    # 3. Test updating status
    update_resp = client.put(
        f"/api/roadmap/{fssai_step['id']}/status",
        headers=headers,
        json={
            "status": "IN_PROGRESS",
            "reference_number": "FSSAI-DRAFT-2026-991",
            "notes": "Draft application created"
        }
    )
    assert update_resp.status_code == 200, f"Update status failed: {update_resp.text}"
    print("[PASS] 4. Updated FSSAI status to IN_PROGRESS.")

    # Re-fetch roadmap to verify update
    resp2 = client.get("/api/roadmap", headers=headers)
    assert resp2.status_code == 200
    fssai_updated = next(s for s in resp2.json()["steps"] if s["code"] == "FSSAI")
    assert fssai_updated["status"] == "IN_PROGRESS"
    assert fssai_updated["reference_number"] == "FSSAI-DRAFT-2026-991"
    print("[PASS] 5. Verified persisted status update on roadmap.")

    print("\nALL ROADMAP BACKEND TESTS PASSED SUCCESSFULLY! [SUCCESS]")

if __name__ == "__main__":
    test_roadmap()
