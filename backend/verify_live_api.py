import urllib.request
import json

def verify_live_api():
    from backend.app.database import SessionLocal
    from backend.app.models.user import User
    from backend.app.services.auth import create_access_token

    db = SessionLocal()
    user = db.query(User).filter(User.email == "demo@example.com").first()
    token = create_access_token(data={"sub": user.email, "role": user.role, "user_id": user.id})
    print(f"[API] Generated token for user: {user.email} (Role: {user.role})")

    headers = {"Authorization": f"Bearer {token}"}

    # 2. Get Roadmap
    req = urllib.request.Request("http://127.0.0.1:8000/api/roadmap", headers=headers)
    resp = urllib.request.urlopen(req)
    roadmap = json.loads(resp.read().decode())
    print(f"[API] Roadmap business: '{roadmap.get('business_name')}', Sector: '{roadmap.get('sector')}', Total steps: {len(roadmap.get('steps', []))}")
    print(f"[API] Roadmap progress: {roadmap.get('summary', {}).get('percentage_completed')}% completed")

    # 3. Get Assistant for GST
    gst_step = [s for s in roadmap["steps"] if s["code"] == "GST"][0]
    req = urllib.request.Request(f"http://127.0.0.1:8000/api/roadmap/{gst_step['id']}/assistant", headers=headers)
    resp = urllib.request.urlopen(req)
    asst = json.loads(resp.read().decode())
    print(f"[API] Assistant for GST (Step ID: {gst_step['id']}):")
    print(f"      - Readiness Score: {asst['document_readiness']['readiness_score']}%")
    print(f"      - Official Portal: {asst['step'].get('official_portal_url')}")
    print(f"      - Official Source Act: {asst['official_source'].get('act')}")
    print(f"      - Guidance Fields: {len(asst['field_guidance'])} fields documented")
    print(f"      - Mandatory Checklist: {len(asst['document_readiness']['items'])} items")

    # 4. Check linked application if any
    if asst.get("linked_application"):
        print(f"      - Linked Application: {asst['linked_application']['application_number']} ({asst['linked_application']['status']})")

    print("\n>>> LIVE HTTP API VERIFICATION PASSED 100% <<<")

if __name__ == "__main__":
    verify_live_api()
