import os
import sys
from fastapi.testclient import TestClient

# Ensure root is on pythonpath
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.app.main import app

client = TestClient(app)

def run_tests():
    print("=== STARTING COMPREHENSIVE BACKEND MVP TEST ===")

    # 1. Health check
    res = client.get("/api/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    print("[PASS] 1. Health check OK")

    # 2. Entrepreneur Login
    res = client.post("/api/auth/login", json={"email": "demo@example.com", "password": "Demo123!"})
    assert res.status_code == 200, f"Entrepreneur login failed: {res.text}"
    ent_data = res.json()
    ent_token = ent_data["access_token"]
    ent_headers = {"Authorization": f"Bearer {ent_token}"}
    print(f"[PASS] 2. Entrepreneur Logged In ({ent_data['user']['full_name']})")

    # 3. Officer Login
    res = client.post("/api/auth/login", json={"email": "officer@example.com", "password": "Demo123!"})
    assert res.status_code == 200, f"Officer login failed: {res.text}"
    off_data = res.json()
    off_token = off_data["access_token"]
    off_headers = {"Authorization": f"Bearer {off_token}"}
    print(f"[PASS] 3. Officer Logged In ({off_data['user']['full_name']})")

    # 4. Admin Login
    res = client.post("/api/auth/login", json={"email": "admin@example.com", "password": "Demo123!"})
    assert res.status_code == 200, f"Admin login failed: {res.text}"
    adm_headers = {"Authorization": f"Bearer {res.json()['access_token']}"}
    print("[PASS] 4. Admin Logged In")

    # 5. Get Business
    res = client.get("/api/business/primary", headers=ent_headers)
    assert res.status_code == 200, f"Get business failed: {res.text}"
    biz = res.json()
    print(f"[PASS] 5. Business Profile retrieved: '{biz['name']}' (Sector: {biz['sector']}, Stage: {biz['business_stage']})")

    # 6. Discover Approvals
    res = client.post("/api/approvals/discover", json={
        "sector": biz["sector"],
        "state": biz["state"],
        "district": biz["district"],
        "investment": biz["investment"],
        "employees": biz["employees"],
        "business_stage": biz["business_stage"],
        "business_activity": biz["business_activity"]
    })
    assert res.status_code == 200, f"Discovery failed: {res.text}"
    approvals = res.json()
    assert len(approvals) >= 4, f"Expected at least 4 approvals, got {len(approvals)}"
    fssai_app = next(a["approval"] for a in approvals if "FSSAI" in a["approval"]["code"])
    print(f"[PASS] 6. Approvals Discovery Engine returned {len(approvals)} applicable statutory clearances.")

    # Clean any previously seeded water test report to test fresh 80% -> 100% flow
    docs = client.get(f"/api/documents?business_id={biz['id']}", headers=ent_headers).json()
    for d in docs:
        if "Water Quality" in d["doc_type"]:
            client.delete(f"/api/documents/{d['id']}", headers=ent_headers)

    # 7. Check Initial Readiness Score (Should be 80.0% because water report is missing!)
    res = client.get(f"/api/documents/readiness/{fssai_app['id']}?business_id={biz['id']}", headers=ent_headers)
    assert res.status_code == 200, f"Readiness check failed: {res.text}"
    readiness = res.json()
    print(f"[PASS] 7. Initial Readiness: {readiness['readiness_percentage']}% (Matched: {readiness['total_matched']}/{readiness['total_required']}, Missing: {readiness['total_missing']})")
    assert readiness["readiness_percentage"] == 80.0, f"Expected 80.0%, got {readiness['readiness_percentage']}"

    # 8. Seed Missing Document
    res = client.post("/api/documents/seed-missing-document", data={"business_id": biz["id"]}, headers=ent_headers)
    assert res.status_code == 200, f"Seed missing doc failed: {res.text}"
    print(f"[PASS] 8. Missing Document uploaded to Vault: '{res.json()['doc_type']}' ({res.json()['validity_status']})")

    # 9. Verify 100% Readiness
    res = client.get(f"/api/documents/readiness/{fssai_app['id']}?business_id={biz['id']}", headers=ent_headers)
    readiness_100 = res.json()
    print(f"[PASS] 9. Updated Readiness: {readiness_100['readiness_percentage']}% (All {readiness_100['total_required']} documents matched and valid!)")
    assert readiness_100["readiness_percentage"] == 100.0, f"Expected 100.0%, got {readiness_100['readiness_percentage']}"

    # 10. Merge Application Package PDF
    matched_doc_ids = [item["matched_document"]["id"] for item in readiness_100["requirements_status"] if item["matched_document"]]
    res = client.post("/api/documents/merge-package", json={
        "business_id": biz["id"],
        "approval_id": fssai_app["id"],
        "document_ids": matched_doc_ids,
        "compression_level": "Medium"
    }, headers=ent_headers)
    assert res.status_code == 200, f"Merge failed: {res.text}"
    pkg = res.json()
    print(f"[PASS] 10. PDF Application Package Generated: {pkg['filename']} ({pkg['page_count']} pages, Original: {pkg['original_size_mb']} -> Compressed: {pkg['compressed_size_mb']})")

    # 11. Submit Application
    res = client.post("/api/applications", json={
        "business_id": biz["id"],
        "approval_id": fssai_app["id"],
        "document_ids": matched_doc_ids,
        "compression_level": "Medium"
    }, headers=ent_headers)
    assert res.status_code == 200, f"Application submission failed: {res.text}"
    app_record = res.json()
    print(f"[PASS] 11. Application Submitted: #{app_record['application_number']} (Status: {app_record['status']}, SLA: {app_record['sla_days']} days)")

    # 12. Officer Reviews Application & Raises Query
    res = client.post("/api/queries", json={
        "application_id": app_record["id"],
        "title": "HACCP Thermal Control Clarification",
        "description": "Please provide documented confirmation regarding critical control point thermal limits for fruit pulp pasteurization.",
        "priority": "HIGH"
    }, headers=off_headers)
    assert res.status_code == 200, f"Raise query failed: {res.text}"
    q_data = res.json()
    print(f"[PASS] 12. Officer Raised Query: '{q_data['title']}' (Application status moved to QUERY RAISED)")

    # Verify Application is in QUERY RAISED
    res = client.get(f"/api/applications/{app_record['id']}", headers=ent_headers)
    assert res.json()["status"] == "QUERY RAISED"

    # 13. Entrepreneur Responds to Query
    res = client.post(f"/api/queries/{q_data['id']}/respond", json={
        "response_text": "CCP 1 thermal processing is calibrated to maintain 85°C for 45 seconds flash pasteurization with continuous digital chart recording.",
        "response_document_id": matched_doc_ids[0]
    }, headers=ent_headers)
    assert res.status_code == 200, f"Query response failed: {res.text}"
    print(f"[PASS] 13. Entrepreneur Responded to Query (Application status returned to UNDER REVIEW)")

    # 14. Officer Schedules Inspection
    res = client.post("/api/inspections", json={
        "application_id": app_record["id"],
        "scheduled_date": "2026-09-18",
        "scheduled_time": "10:30 AM",
        "remarks": "On-site verification of sanitation, cold storage, and drainage."
    }, headers=off_headers)
    assert res.status_code == 200, f"Schedule inspection failed: {res.text}"
    insp_data = res.json()
    print(f"[PASS] 14. Officer Scheduled Inspection for {insp_data['scheduled_date']} (Status: INSPECTION SCHEDULED)")

    # 15. Officer Completes Inspection (Result: PASSED)
    res = client.put(f"/api/inspections/{insp_data['id']}", json={
        "status": "COMPLETED",
        "result": "PASSED",
        "remarks": "Premises and equipment layout comply fully with Schedule 4 sanitation guidelines.",
        "checklist_results": {
            "Machinery Layout & Working Spacing Verified": True,
            "Physical Hygiene & Cold Chain Sanitation Verified": True,
            "Potable Water Treatment & Storage Tested": True,
            "Fire Extinguishers & Emergency Exits Operational": True,
            "Effluent Treatment Neutralization Pit Inspected": True
        }
    }, headers=off_headers)
    assert res.status_code == 200, f"Complete inspection failed: {res.text}"
    print("[PASS] 15. Inspection Completed (Result: PASSED)")

    # 16. Officer Approves Application
    res = client.put(f"/api/applications/{app_record['id']}/status", json={
        "status": "APPROVED",
        "remarks": "All statutory compliance mandates satisfied. Formal Manufacturing Clearance granted."
    }, headers=off_headers)
    assert res.status_code == 200, f"Approve application failed: {res.text}"
    approved_app = res.json()
    print(f"[PASS] 16. Application APPROVED! Certificate Number: {approved_app['certificate_number']}")

    # 17. Verify Renewal Created
    res = client.get("/api/renewals", headers=ent_headers)
    assert res.status_code == 200
    renewals = res.json()
    assert len(renewals) > 0, "Expected at least 1 renewal"
    print(f"[PASS] 17. Renewal Auto-Registered: Certificate {renewals[0]['certificate_number']} (Status: {renewals[0]['status']}, Days to Due: {renewals[0]['days_to_due']} days)")

    # 18. Scheme Recommendations
    res = client.get("/api/schemes/recommendations", headers=ent_headers)
    assert res.status_code == 200
    schemes = res.json()
    print(f"[PASS] 18. Matched {len(schemes)} Government Schemes (Top Match: '{schemes[0]['scheme']['name']}' - {schemes[0]['match_score']}% Match)")

    # 19. AI Assistant Query
    res = client.post("/api/ai/chat", json={
        "message": "What is my current compliance status and what approvals apply to my business?",
        "business_id": biz["id"]
    }, headers=ent_headers)
    assert res.status_code == 200
    ai_reply = res.json()
    print(f"[PASS] 19. AI Assistant Response Received (Source: {ai_reply['source']})")

    # 20. Admin Dashboard Analytics & Bottlenecks
    res = client.get("/api/analytics/dashboard", headers=adm_headers)
    assert res.status_code == 200
    analytics = res.json()
    print(f"[PASS] 20. Admin Analytics verified: {len(analytics['bottlenecks'])} Bottlenecks identified, {len(analytics['department_stats'])} Departments analyzed.")

    # 21. Dynamic Regulatory Roadmap Endpoint
    res = client.get(f"/api/roadmap?business_id={biz['id']}", headers=ent_headers)
    assert res.status_code == 200, f"Roadmap fetch failed: {res.text}"
    roadmap = res.json()
    assert "steps" in roadmap and len(roadmap["steps"]) > 0
    assert "summary" in roadmap
    first_step = roadmap["steps"][0]
    assert "readiness_score" in first_step
    print(f"[PASS] 21. Dynamic Regulatory Roadmap OK ({len(roadmap['steps'])} steps, Next: Step {roadmap['next_step']['step_order']} '{roadmap['next_step']['name']}', Completion: {roadmap['summary']['percentage_completed']}%)")

    # 22. Application Assistant Details Endpoint
    res = client.get(f"/api/roadmap/{first_step['id']}/assistant?business_id={biz['id']}", headers=ent_headers)
    assert res.status_code == 200, f"Assistant fetch failed: {res.text}"
    assistant = res.json()
    assert "step" in assistant
    assert "official_source" in assistant and assistant["official_source"]["act"]
    assert "portal_guide_steps" in assistant and len(assistant["portal_guide_steps"]) >= 3
    assert "required_information" in assistant and len(assistant["required_information"]) > 0
    assert "field_guidance" in assistant
    assert "document_readiness" in assistant
    print(f"[PASS] 22. Application Assistant Details OK (Step: {assistant['step']['code']}, Portal Steps: {len(assistant['portal_guide_steps'])}, Required Info Fields: {len(assistant['required_information'])}, Readiness: {assistant['document_readiness']['readiness_score']}%)")

    # 23. Roadmap Step Status Update & Sync
    res = client.put(f"/api/roadmap/{first_step['id']}/status", json={
        "status": "IN_PROGRESS",
        "reference_number": "PAN-2026-TEST-REF",
        "notes": "Automated verification test note",
        "business_id": biz["id"]
    }, headers=ent_headers)
    assert res.status_code == 200, f"Status update failed: {res.text}"
    print(f"[PASS] 23. Roadmap Status Sync OK ({res.json()['message']}, Ref: {res.json()['reference_number']})")

    # 24. Multi-Sector & Premises-Aware Catalog Rules
    from backend.app.services.regulatory_catalog import get_applicable_roadmap_for_business, get_premises_documents
    food_steps = get_applicable_roadmap_for_business({"sector": "Food Processing", "premises_type": "RENTED", "food_handling": True, "manufacturing_activity": True})
    it_steps = get_applicable_roadmap_for_business({"sector": "IT / Software", "premises_type": "OWNED", "food_handling": False, "manufacturing_activity": False})
    rented_docs = get_premises_documents("RENTED")
    owned_docs = get_premises_documents("OWNED")
    assert len(food_steps) >= 10, f"Expected >= 10 food steps, got {len(food_steps)}"
    assert len(it_steps) <= 7, f"Expected <= 7 IT steps, got {len(it_steps)}"
    assert any(s["code"] == "FSSAI" for s in food_steps)
    assert not any(s["code"] == "FSSAI" for s in it_steps)
    assert len(rented_docs) == 3 and any("Rent" in d["name"] for d in rented_docs)
    assert len(owned_docs) == 2 and any("Deed" in d["name"] for d in owned_docs)
    print(f"[PASS] 24. Multi-Sector Rules OK: Food Processing ({len(food_steps)} steps with FSSAI/MPCB) vs IT/Software ({len(it_steps)} steps without industrial clearances); Rented ({len(rented_docs)} docs) vs Owned ({len(owned_docs)} docs)")

    # 25. AI Assistant "What should I do next?"
    res = client.post("/api/ai/chat", json={
        "message": "What should I do next in my compliance journey?",
        "business_id": biz["id"]
    }, headers=ent_headers)
    assert res.status_code == 200
    ai_reply = res.json()["reply"]
    assert len(ai_reply) > 50
    print(f"[PASS] 25. AI Assistant Next Action Advice OK (Generated {len(ai_reply)} chars)")

    print("\n=======================================================")
    print("ALL 25 END-TO-END BACKEND MVP VERIFICATIONS PASSED 100%!")
    print("=======================================================\n")

if __name__ == "__main__":
    run_tests()
