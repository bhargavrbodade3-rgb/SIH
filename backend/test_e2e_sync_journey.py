import os
from backend.app.database import SessionLocal
from backend.app.models.user import User
from backend.app.models.business import Business
from backend.app.models.approval import Approval
from backend.app.models.application import Application
from backend.app.models.roadmap import RoadmapStep, BusinessRoadmapStatus
from backend.app.routers.roadmap import get_regulatory_roadmap, get_step_assistant_details
from backend.app.routers.applications import update_application_status

def test_sync_lifecycle():
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == "demo@example.com").first()
        assert user is not None, "Demo user not found"

        biz = db.query(Business).filter(Business.owner_id == user.id).first()
        assert biz is not None, "Demo business not found"

        print(f"\n[E2E] Testing for Business: '{biz.name}' (Sector: {biz.sector})")

        # 1. Fetch current roadmap
        roadmap = get_regulatory_roadmap(current_user=user, db=db)
        steps = roadmap["steps"]
        print(f"[E2E] Total Roadmap steps: {len(steps)}")
        step_dict = {s["code"]: s for s in steps}

        # Verify prerequisite chain
        print("[E2E] Step statuses:")
        for s in steps:
            print(f"   - Step {s['step_order']}: {s['code']} ({s['name']}) -> {s['status']}")

        # 2. Check assistant data for a step (e.g. GST)
        gst_step = step_dict.get("GST")
        assert gst_step is not None, "GST step should exist in roadmap"
        assistant_info = get_step_assistant_details(step_id=gst_step["id"], business_id=biz.id, current_user=user, db=db)
        print(f"[E2E] GST Assistant - Guidance items: {len(assistant_info['field_guidance'])}, Checklist: {len(assistant_info['preparation_checklist'])}")

        # 3. Find or create an application for an approval that maps to a roadmap step
        approval_codes = [s.get("approval_code") for s in steps if s.get("approval_code")]
        matching_approvals = db.query(Approval).filter(Approval.code.in_(approval_codes)).all()
        print(f"[E2E] Approvals matching roadmap step approval codes: {[a.code for a in matching_approvals]}")

        target_approval = None
        for a in matching_approvals:
            if "FSSAI" in a.code or "FACTORY" in a.code:
                target_approval = a
                break
        if not target_approval and matching_approvals:
            target_approval = matching_approvals[0]

        assert target_approval is not None, "No approval matches roadmap steps"
        print(f"[E2E] Target Approval for Sync test: {target_approval.code} - {target_approval.name}")

        # Check corresponding step
        target_step = db.query(RoadmapStep).filter(RoadmapStep.approval_code == target_approval.code).first()
        assert target_step is not None, f"RoadmapStep for {target_approval.code} must exist"

        # 4. Create an Application in DRAFT/SUBMITTED state
        app = db.query(Application).filter(
            Application.business_id == biz.id,
            Application.approval_id == target_approval.id
        ).first()

        if not app:
            from datetime import datetime, timezone
            app = Application(
                application_number=f"APP-TEST-{target_approval.code}-001",
                business_id=biz.id,
                approval_id=target_approval.id,
                department_id=target_approval.department_id,
                status="SUBMITTED",
                created_at=datetime.now(timezone.utc),
                submitted_at=datetime.now(timezone.utc)
            )
            db.add(app)
            db.commit()
            db.refresh(app)
            print(f"[E2E] Created test application: {app.application_number} (Status: {app.status})")
        else:
            app.status = "SUBMITTED"
            db.commit()
            print(f"[E2E] Using existing application: {app.application_number} (Reset to SUBMITTED)")

        # 5. Fetch roadmap: verification of Auto-Sync to IN_PROGRESS
        roadmap_after_submit = get_regulatory_roadmap(current_user=user, db=db)
        step_after_submit = [s for s in roadmap_after_submit["steps"] if s["id"] == target_step.id][0]
        print(f"[E2E] Roadmap step {target_step.code} status after application SUBMITTED: {step_after_submit['status']}")
        assert step_after_submit["status"] in ["IN_PROGRESS", "DONE"], "Step should be IN_PROGRESS or DONE"
        assert step_after_submit.get("linked_application") is not None, "Linked application should be attached to step"
        assert step_after_submit["linked_application"]["application_number"] == app.application_number

        # 6. Assistant details should also expose the linked application
        asst_after_submit = get_step_assistant_details(step_id=target_step.id, business_id=biz.id, current_user=user, db=db)
        assert asst_after_submit.get("linked_application") is not None, "Assistant must return linked_application"
        print(f"[E2E] Assistant modal linked application: {asst_after_submit['linked_application']['application_number']} ({asst_after_submit['linked_application']['status']})")

        # 7. Approve the application as an officer
        officer = db.query(User).filter(User.role.in_(["OFFICER", "ADMIN"])).first()
        if not officer:
            officer = user

        class DummyStatusUpdate:
            def __init__(self, status, remarks=None, rejection_reason=None):
                self.status = status
                self.remarks = remarks
                self.rejection_reason = rejection_reason

        print("[E2E] Simulating Officer approval of application...")
        updated_app = update_application_status(
            id=app.id,
            status_in=DummyStatusUpdate(status="APPROVED", remarks="All documents verified. Statutory clearance granted."),
            current_user=officer,
            db=db
        )
        app_status = updated_app["status"] if isinstance(updated_app, dict) else updated_app.status
        cert_num = updated_app["certificate_number"] if isinstance(updated_app, dict) else updated_app.certificate_number
        print(f"[E2E] Application status now: {app_status}, Certificate: {cert_num}")
        assert app_status == "APPROVED"
        assert cert_num is not None

        # 8. Check BusinessRoadmapStatus and roadmap response
        step_status_record = db.query(BusinessRoadmapStatus).filter(
            BusinessRoadmapStatus.business_id == biz.id,
            BusinessRoadmapStatus.roadmap_step_id == target_step.id
        ).first()
        print(f"[E2E] BusinessRoadmapStatus record: status={step_status_record.status if step_status_record else 'None'}, ref={step_status_record.reference_number if step_status_record else 'None'}")
        assert step_status_record is not None
        assert step_status_record.status == "DONE"
        assert step_status_record.reference_number == cert_num

        # 9. Verify that get_regulatory_roadmap reflects DONE
        roadmap_after_approval = get_regulatory_roadmap(current_user=user, db=db)
        step_after_approval = [s for s in roadmap_after_approval["steps"] if s["id"] == target_step.id][0]
        print(f"[E2E] Final Roadmap step status: {step_after_approval['status']}, Reference No: {step_after_approval['reference_number']}")
        assert step_after_approval["status"] == "DONE"
        assert step_after_approval["reference_number"] == cert_num

        print("\n=======================================================")
        print(">>> ALL E2E SYNC JOURNEY TESTS COMPLETED SUCCESSFULLY! <<<")
        print("=======================================================")

    finally:
        db.close()

if __name__ == "__main__":
    test_sync_lifecycle()
