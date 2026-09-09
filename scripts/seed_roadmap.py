import os
import sys
import datetime

# Ensure project root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.app.database import engine, Base, SessionLocal
from backend.app.models.business import Business
from backend.app.models.roadmap import RoadmapStep, BusinessRoadmapStatus
from backend.app.routers.roadmap import ensure_roadmap_steps_seeded

def seed_roadmap_for_demo():
    print("Ensuring database tables for Roadmap are created...")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        print("Ensuring 11 roadmap steps are seeded...")
        steps = ensure_roadmap_steps_seeded(db)
        print(f"Found {len(steps)} roadmap steps.")

        # Find demo business
        biz = db.query(Business).filter(Business.name.like("%Demo Food Processing%")).first()
        if not biz:
            biz = db.query(Business).first()

        if not biz:
            print("No business found to attach status.")
            return

        print(f"Attaching roadmap statuses for Business ID {biz.id}: '{biz.name}'...")

        step_map = {s.code: s for s in steps}

        # Seed initial foundational records as DONE with realistic demo numbers
        demo_initial_statuses = [
            ("PAN", "DONE", "AAACD1234F", "Proprietor PAN verified via NSDL/Income Tax"),
            ("INCORPORATION", "DONE", "MH-PUN-PART-2024-8891", "Partnership deed executed on non-judicial stamp paper ₹1000"),
            ("UDYAM", "DONE", "UDYAM-MH-26-0098765", "MSME classification: Small Enterprise (Manufacturing)"),
            ("GST", "DONE", "27AAACD1234F1Z5", "Regular GSTIN under Maharashtra tax jurisdiction"),
            ("SHOP_ACT", "DONE", "MH-PUN-SHOP-2024-44321", "Gumasta registration valid under Maharashtra Shops & Establishments Act"),
            ("FACTORY_LICENSE", "IN_PROGRESS", "DISH/APP/2026/0492", "Architectural factory plant layout drawings submitted for scrutiny"),
            ("FSSAI", "NOT_STARTED", None, "Application draft ready in document vault"),
            ("POLLUTION_CONSENT", "NOT_STARTED", None, "Pending Factory plan approval"),
            ("FIRE_NOC", "NOT_STARTED", None, "Pending Factory plan approval"),
            ("TRADE_LICENCE", "NOT_STARTED", None, "Awaiting shop act physical inspection verification"),
            ("CONSENT_TO_OPERATE", "NOT_STARTED", None, "Post-approval clearance once machinery is installed")
        ]

        now = datetime.datetime.now(datetime.timezone.utc)

        for code, status, ref, notes in demo_initial_statuses:
            step = step_map.get(code)
            if not step:
                continue

            existing_st = db.query(BusinessRoadmapStatus).filter(
                BusinessRoadmapStatus.business_id == biz.id,
                BusinessRoadmapStatus.roadmap_step_id == step.id
            ).first()

            if not existing_st:
                new_st = BusinessRoadmapStatus(
                    business_id=biz.id,
                    roadmap_step_id=step.id,
                    status=status,
                    reference_number=ref,
                    notes=notes,
                    completed_at=now if status == "DONE" else None
                )
                db.add(new_st)
            else:
                existing_st.status = status
                existing_st.reference_number = ref
                existing_st.notes = notes
                if status == "DONE" and not existing_st.completed_at:
                    existing_st.completed_at = now

        db.commit()
        print("Demo roadmap statuses successfully seeded!")

    finally:
        db.close()

if __name__ == "__main__":
    seed_roadmap_for_demo()
