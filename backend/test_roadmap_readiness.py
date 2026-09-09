from backend.app.database import SessionLocal
from backend.app.models.business import Business
from backend.app.models.user import User
from backend.app.models.document import Document
from backend.app.routers.roadmap import get_regulatory_roadmap, get_step_assistant_details, ensure_all_steps_seeded
from backend.app.services.readiness_service import calculate_step_readiness
from backend.app.routers.business import calculate_completion

def run_tests():
    db = SessionLocal()
    try:
        ensure_all_steps_seeded(db)
        user = db.query(User).filter(User.email == "demo@example.com").first()
        biz = db.query(Business).filter(Business.id == 1).first()
        print(f"Testing with user: {user.email}, business: {biz.name} (Sector: {biz.sector}, Premises: {biz.premises_type})")

        # Test 1: Business profile completion
        comp_score = calculate_completion(biz)
        print(f"Test 1 - Business profile completion: {comp_score}% (profile_completion: {biz.profile_completion}%)")
        assert comp_score > 0

        # Test 2: Roadmap for Food Processing
        roadmap_food = get_regulatory_roadmap(business_id=1, current_user=user, db=db)
        step_codes = [s["code"] for s in roadmap_food["steps"]]
        print(f"Test 2 - Food Processing Steps ({len(step_codes)}): {step_codes}")
        assert "FSSAI" in step_codes
        assert "POLLUTION_CONSENT" in step_codes
        assert "STPI_EXPORT" not in step_codes

        # Test 3: Roadmap for IT / Software
        biz.sector = "IT / Software"
        biz.business_type = "Services"
        db.commit()
        roadmap_it = get_regulatory_roadmap(business_id=1, current_user=user, db=db)
        it_step_codes = [s["code"] for s in roadmap_it["steps"]]
        print(f"Test 3 - IT / Software Steps ({len(it_step_codes)}): {it_step_codes}")
        assert "STPI_EXPORT" in it_step_codes
        assert "IPR_TRADEMARK" in it_step_codes
        assert "FSSAI" not in it_step_codes
        assert "POLLUTION_CONSENT" not in it_step_codes
        assert "FACTORY_LICENSE" not in it_step_codes

        # Restore business to Food Processing
        biz.sector = "Food Processing"
        biz.business_type = "Manufacturing"
        db.commit()

        # Test 4: Step Readiness for GST under RENTED premises
        biz.premises_type = "RENTED"
        db.commit()
        gst_readiness = calculate_step_readiness(db, biz.id, "GST")
        print(f"Test 4 - GST Step Readiness (Premises: {biz.premises_type}):")
        print(f"   Score: {gst_readiness.readiness_percentage}%, Action Items: {len(gst_readiness.action_items)}")
        missing_names = [r.required_name for r in gst_readiness.requirements_status if r.status == "MISSING"]
        matched_names = [r.required_name for r in gst_readiness.requirements_status if r.status == "MATCHED"]
        print(f"   Missing ({len(missing_names)}): {missing_names}")
        print(f"   Matched ({len(matched_names)}): {matched_names}")
        assert any("Landlord NOC" in name for name in missing_names)

        # Test 4b: Change premises to OWNED
        biz.premises_type = "OWNED"
        db.commit()
        gst_owned = calculate_step_readiness(db, biz.id, "GST")
        owned_missing = [r.required_name for r in gst_owned.requirements_status if r.status == "MISSING"]
        print(f"Test 4b - GST Step Readiness (Premises: OWNED):")
        print(f"   Missing: {owned_missing}")
        assert not any("Landlord NOC" in name for name in owned_missing)
        owned_matched = [r.required_name for r in gst_owned.requirements_status if r.status == "MATCHED"]
        print(f"   Matched: {owned_matched}")
        assert any("Title Deed" in name or "Tax Receipt" in name for name in owned_matched)
        biz.premises_type = "RENTED"
        db.commit()

        # Test 5: Step Assistant Details for GST
        gst_step = [s for s in roadmap_food["steps"] if s["code"] == "GST"][0]
        assistant_data = get_step_assistant_details(step_id=gst_step["id"], business_id=biz.id, current_user=user, db=db)
        print(f"Test 5 - Step Assistant API for GST:")
        print(f"   Field Guidance items: {len(assistant_data['field_guidance'])}")
        readiness_pct = assistant_data['document_readiness']['readiness_percentage'] if isinstance(assistant_data['document_readiness'], dict) else assistant_data['document_readiness'].readiness_percentage
        print(f"   Document Readiness Score: {readiness_pct}%")
        assert len(assistant_data['field_guidance']) > 0
        assert readiness_pct is not None

        print("\nALL ROADMAP & READINESS SERVICE TESTS PASSED!")
    finally:
        db.close()

if __name__ == "__main__":
    run_tests()
