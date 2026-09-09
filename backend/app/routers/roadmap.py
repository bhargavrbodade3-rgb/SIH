import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional, Dict, Any

from backend.app.database import get_db
from backend.app.models.user import User, UserRole
from backend.app.models.business import Business
from backend.app.models.approval import Approval, Department
from backend.app.models.roadmap import RoadmapStep, BusinessRoadmapStatus
from backend.app.models.application import Application, ApplicationStatus
from backend.app.models.audit import AuditLog
from backend.app.services.auth import get_current_user
from backend.app.services.readiness_service import calculate_step_readiness
from backend.app.services.regulatory_catalog import REGULATORY_CATALOG, get_premises_documents

router = APIRouter(prefix="/roadmap", tags=["Regulatory Roadmap"])

class RoadmapStatusUpdate(BaseModel):
    status: str  # NOT_STARTED, IN_PROGRESS, DONE
    reference_number: Optional[str] = None
    notes: Optional[str] = None
    business_id: Optional[int] = None

# Comprehensive statutory catalog covering all target sectors
ALL_ROADMAP_STEPS = [
    {
        "code": "PAN",
        "name": "PAN Card (Business / Proprietor)",
        "category": "FOUNDATIONAL",
        "description": "Permanent Account Number required for corporate tax identity, opening current accounts, and all statutory filings.",
        "issuing_authority": "Income Tax Department, Government of India",
        "official_portal_url": "https://www.incometax.gov.in",
        "typical_timeline_days": "7–15",
        "typical_cost": "₹100 – ₹110",
        "depends_on": "",
        "approval_code": None,
        "step_order": 1
    },
    {
        "code": "INCORPORATION",
        "name": "Business Incorporation / Partnership Deed / Constitution",
        "category": "FOUNDATIONAL",
        "description": "Establishes legal entity structure (Sole Proprietorship, Partnership, LLP, or Private Limited Company).",
        "issuing_authority": "Ministry of Corporate Affairs (MCA) / Registrar of Companies",
        "official_portal_url": "https://www.mca.gov.in",
        "typical_timeline_days": "7–20",
        "typical_cost": "₹0 – ₹2,000 (SPICe+ registration)",
        "depends_on": "PAN",
        "approval_code": None,
        "step_order": 2
    },
    {
        "code": "UDYAM",
        "name": "Udyam Registration (MSME Certificate)",
        "category": "FOUNDATIONAL",
        "description": "Mandatory official certificate recognizing the enterprise as Micro, Small, or Medium under the MSMED Act. Unlocks state subsidies and priority banking.",
        "issuing_authority": "Ministry of Micro, Small and Medium Enterprises (MoMSME)",
        "official_portal_url": "https://udyamregistration.gov.in",
        "typical_timeline_days": "Same day",
        "typical_cost": "₹0 (Free government service)",
        "depends_on": "PAN,INCORPORATION",
        "approval_code": None,
        "step_order": 3
    },
    {
        "code": "GST",
        "name": "Goods and Services Tax (GST) Registration",
        "category": "FOUNDATIONAL",
        "description": "15-digit GSTIN identification necessary for interstate trade, claiming input tax credits, and commercial operations.",
        "issuing_authority": "Central Board of Indirect Taxes and Customs (CBIC) / State GST",
        "official_portal_url": "https://www.gst.gov.in",
        "typical_timeline_days": "3–7",
        "typical_cost": "₹0 (Free government service)",
        "depends_on": "PAN,INCORPORATION",
        "approval_code": None,
        "step_order": 4
    },
    {
        "code": "SHOP_ACT",
        "name": "Shop & Establishment Act License (Gumasta / Maharashtra)",
        "category": "FOUNDATIONAL",
        "description": "State statutory registration governing commercial work premises, employee hours, safety, and local municipal operating rights.",
        "issuing_authority": "Maharashtra State Labour Department / Aaple Sarkar",
        "official_portal_url": "https://aaplesarkar.mahaonline.gov.in",
        "typical_timeline_days": "7–10",
        "typical_cost": "₹100 – ₹2,500 (employee slab based)",
        "depends_on": "INCORPORATION,GST",
        "approval_code": None,
        "step_order": 5
    },
    {
        "code": "FACTORY_LICENSE",
        "name": "Factory Plan Approval & Scrutiny (DISH)",
        "category": "SECTOR_SPECIFIC",
        "description": "Pre-construction and machinery layout approval for industrial factory buildings, plant ventilation, and structural stability under the Factories Act.",
        "issuing_authority": "Directorate of Industrial Safety & Health (DISH), Maharashtra",
        "official_portal_url": "https://dish.maharashtra.gov.in",
        "typical_timeline_days": "30–45",
        "typical_cost": "Varies by built-up area & power schedule",
        "depends_on": "UDYAM,GST",
        "approval_code": "FACTORY-ACT-01",
        "step_order": 6
    },
    {
        "code": "FSSAI",
        "name": "Food Safety Manufacturing License (FSSAI State License)",
        "category": "SECTOR_SPECIFIC",
        "description": "Mandatory hygiene, FSMS plan, and water testing certification to manufacture, package, or process food products under FSS Act.",
        "issuing_authority": "Food Safety and Standards Authority of India (FSSAI) / FoSCoS",
        "official_portal_url": "https://foscos.fssai.gov.in",
        "typical_timeline_days": "30–60",
        "typical_cost": "₹2,000 – ₹7,500 / year (capacity based)",
        "depends_on": "UDYAM,GST",
        "approval_code": "FSSAI-MFG-01",
        "step_order": 7
    },
    {
        "code": "POLLUTION_CONSENT",
        "name": "Consent to Establish (CTE) — Orange/Green Category",
        "category": "SECTOR_SPECIFIC",
        "description": "Statutory prior environmental clearance for wastewater discharge, organic solid waste management, and effluent treatment compliance.",
        "issuing_authority": "Maharashtra Pollution Control Board (MPCB)",
        "official_portal_url": "https://mpcb.gov.in",
        "typical_timeline_days": "30–45",
        "typical_cost": "₹15,000 (Capital scale ₹50L)",
        "depends_on": "UDYAM,GST",
        "approval_code": "MPCB-CTE-01",
        "step_order": 8
    },
    {
        "code": "FIRE_NOC",
        "name": "Provisional Fire Safety NOC",
        "category": "SECTOR_SPECIFIC",
        "description": "Verification of emergency water reserves, fire hydrant layout, smoke evacuation systems, and sprinkler deployment.",
        "issuing_authority": "Directorate of Maharashtra Fire Services / Municipal Fire Brigade",
        "official_portal_url": "https://mahafireservice.gov.in",
        "typical_timeline_days": "15–30",
        "typical_cost": "₹5,000",
        "depends_on": "FACTORY_LICENSE",
        "approval_code": "FIRE-NOC-01",
        "step_order": 9
    },
    {
        "code": "TRADE_LICENCE",
        "name": "Local Industrial & Commercial Trade License",
        "category": "SECTOR_SPECIFIC",
        "description": "Local municipal activity authorization for commercial operation and drainage connection inside municipal/MIDC zones.",
        "issuing_authority": "MIDC Regional Office / Municipal Corporation",
        "official_portal_url": "https://www.midcindia.org",
        "typical_timeline_days": "14–20",
        "typical_cost": "₹3,000",
        "depends_on": "GST",
        "approval_code": "MIDC-TRADE-01",
        "step_order": 10
    },
    {
        "code": "STPI_EXPORT",
        "name": "STPI / Software Export & Professional Tax Registration",
        "category": "SECTOR_SPECIFIC",
        "description": "Software Technology Parks of India unit registration for duty-free capital goods import, 100% foreign equity, and statutory Professional Tax compliance.",
        "issuing_authority": "Software Technology Parks of India (STPI) / State PT Dept",
        "official_portal_url": "https://www.stpi.in",
        "typical_timeline_days": "15–20",
        "typical_cost": "₹2,500 – ₹5,000",
        "depends_on": "UDYAM,GST",
        "approval_code": None,
        "step_order": 11
    },
    {
        "code": "IPR_TRADEMARK",
        "name": "Trademark & Software Copyright Brand Protection",
        "category": "SECTOR_SPECIFIC",
        "description": "Statutory intellectual property registration protecting proprietary algorithms, brand identity, and software trademarks under Controller General of Patents.",
        "issuing_authority": "Controller General of Patents, Designs and Trade Marks (CGPDTM)",
        "official_portal_url": "https://ipindia.gov.in",
        "typical_timeline_days": "10–30",
        "typical_cost": "₹4,500 (MSME fee concession)",
        "depends_on": "INCORPORATION",
        "approval_code": None,
        "step_order": 12
    },
    {
        "code": "LEGAL_METROLOGY",
        "name": "Legal Metrology Packaged Commodities & Calibration License",
        "category": "SECTOR_SPECIFIC",
        "description": "Mandatory manufacturer/packer registration and verification of electronic weighing scales, pre-packaged goods labeling under Legal Metrology Act.",
        "issuing_authority": "Department of Consumer Affairs, Legal Metrology Division",
        "official_portal_url": "https://consumeraffairs.nic.in",
        "typical_timeline_days": "15–25",
        "typical_cost": "₹1,500 – ₹3,000",
        "depends_on": "GST,TRADE_LICENCE",
        "approval_code": None,
        "step_order": 13
    },
    {
        "code": "CONSENT_TO_OPERATE",
        "name": "Consent to Operate (CTO) — Commercial Commissioning",
        "category": "POST_APPROVAL",
        "description": "Final regulatory operational clearance granted after physical inspection confirms ETP compliance and fire safety installations are operational.",
        "issuing_authority": "Maharashtra Pollution Control Board (MPCB)",
        "official_portal_url": "https://mpcb.gov.in",
        "typical_timeline_days": "30–45",
        "typical_cost": "₹15,000",
        "depends_on": "POLLUTION_CONSENT,FIRE_NOC",
        "approval_code": None,
        "step_order": 14
    }
]

def ensure_all_steps_seeded(db: Session):
    for item in ALL_ROADMAP_STEPS:
        existing = db.query(RoadmapStep).filter(RoadmapStep.code == item["code"]).first()
        if not existing:
            step = RoadmapStep(**item)
            db.add(step)
        else:
            # Update metadata if needed
            for k, v in item.items():
                setattr(existing, k, v)
    db.commit()

def get_sector_step_configuration(sector: str, business_type: str) -> List[Dict[str, Any]]:
    """
    Returns ordered steps and customized dependencies tailored to the business profile.
    """
    sec = (sector or "").lower()
    btype = (business_type or "").lower()

    if "food" in sec:
        # Food Processing sequence
        return [
            {"code": "PAN", "depends_on": ""},
            {"code": "INCORPORATION", "depends_on": "PAN"},
            {"code": "UDYAM", "depends_on": "PAN,INCORPORATION"},
            {"code": "GST", "depends_on": "PAN,INCORPORATION"},
            {"code": "FSSAI", "depends_on": "UDYAM,GST"},
            {"code": "POLLUTION_CONSENT", "depends_on": "UDYAM,GST"},
            {"code": "FACTORY_LICENSE", "depends_on": "UDYAM,GST"},
            {"code": "FIRE_NOC", "depends_on": "FACTORY_LICENSE"},
            {"code": "TRADE_LICENCE", "depends_on": "GST"},
            {"code": "CONSENT_TO_OPERATE", "depends_on": "POLLUTION_CONSENT,FIRE_NOC"},
        ]
    elif "it" in sec or "software" in sec or "tech" in sec:
        # IT / Software: strictly non-industrial, no FSSAI, no MPCB, no Factory Act!
        return [
            {"code": "PAN", "depends_on": ""},
            {"code": "INCORPORATION", "depends_on": "PAN"},
            {"code": "UDYAM", "depends_on": "PAN,INCORPORATION"},
            {"code": "GST", "depends_on": "PAN,INCORPORATION"},
            {"code": "SHOP_ACT", "depends_on": "INCORPORATION,GST"},
            {"code": "STPI_EXPORT", "depends_on": "UDYAM,GST"},
            {"code": "IPR_TRADEMARK", "depends_on": "INCORPORATION"},
        ]
    elif "retail" in sec or "trad" in sec or "shop" in sec:
        # Retail & Commercial Trading
        return [
            {"code": "PAN", "depends_on": ""},
            {"code": "INCORPORATION", "depends_on": "PAN"},
            {"code": "UDYAM", "depends_on": "PAN,INCORPORATION"},
            {"code": "GST", "depends_on": "PAN,INCORPORATION"},
            {"code": "SHOP_ACT", "depends_on": "INCORPORATION,GST"},
            {"code": "TRADE_LICENCE", "depends_on": "SHOP_ACT,GST"},
            {"code": "LEGAL_METROLOGY", "depends_on": "GST,TRADE_LICENCE"},
        ]
    elif "manufactur" in sec or "manufactur" in btype:
        # General Manufacturing (Engineering, Auto, Plastic, etc.)
        return [
            {"code": "PAN", "depends_on": ""},
            {"code": "INCORPORATION", "depends_on": "PAN"},
            {"code": "UDYAM", "depends_on": "PAN,INCORPORATION"},
            {"code": "GST", "depends_on": "PAN,INCORPORATION"},
            {"code": "FACTORY_LICENSE", "depends_on": "UDYAM,GST"},
            {"code": "POLLUTION_CONSENT", "depends_on": "UDYAM,GST,FACTORY_LICENSE"},
            {"code": "FIRE_NOC", "depends_on": "FACTORY_LICENSE"},
            {"code": "TRADE_LICENCE", "depends_on": "GST"},
            {"code": "CONSENT_TO_OPERATE", "depends_on": "POLLUTION_CONSENT,FIRE_NOC"},
        ]
    else:
        # Default Commercial
        return [
            {"code": "PAN", "depends_on": ""},
            {"code": "INCORPORATION", "depends_on": "PAN"},
            {"code": "UDYAM", "depends_on": "PAN,INCORPORATION"},
            {"code": "GST", "depends_on": "PAN,INCORPORATION"},
            {"code": "SHOP_ACT", "depends_on": "INCORPORATION,GST"},
            {"code": "TRADE_LICENCE", "depends_on": "SHOP_ACT,GST"},
        ]

@router.get("")
def get_regulatory_roadmap(
    business_id: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ensure_all_steps_seeded(db)

    # Determine business
    biz = None
    if business_id is not None:
        try:
            b_id = int(business_id)
            biz = db.query(Business).filter(Business.id == b_id).first()
        except (ValueError, TypeError):
            biz = None
    if not biz:
        biz = db.query(Business).filter(Business.owner_id == current_user.id).first()
    if not biz:
        biz = db.query(Business).first()

    target_biz_id = biz.id if biz else 1
    sector = biz.sector if biz else "Food Processing"
    btype = biz.business_type if biz else "Manufacturing"

    # Step filtering tailored to profile
    step_configs = get_sector_step_configuration(sector, btype)
    allowed_codes = [sc["code"] for sc in step_configs]
    dep_override_map = {sc["code"]: sc["depends_on"] for sc in step_configs}

    all_db_steps = {s.code: s for s in db.query(RoadmapStep).all()}
    statuses = db.query(BusinessRoadmapStatus).filter(BusinessRoadmapStatus.business_id == target_biz_id).all()
    status_map = {s.roadmap_step_id: s for s in statuses}

    approvals = db.query(Approval).all()
    approval_code_map = {a.code: a.id for a in approvals}
    approval_by_id = {a.id: a for a in approvals}

    # Fetch applications for target_biz_id to sync with roadmap steps
    biz_apps = db.query(Application).filter(Application.business_id == target_biz_id).all()
    app_by_code = {}
    for app in biz_apps:
        if app.approval_id in approval_by_id:
            a_code = approval_by_id[app.approval_id].code
            if a_code not in app_by_code or app.id > app_by_code[a_code].id:
                app_by_code[a_code] = app

    # Code-to-status map for dependency lookup with automatic live Application sync
    code_status_map = {}
    db_changed = False
    for code in allowed_codes:
        step_obj = all_db_steps.get(code)
        if not step_obj:
            continue

        st_obj = status_map.get(step_obj.id)
        current_st = st_obj.status if st_obj else "NOT_STARTED"

        # Check linked application
        linked_app = None
        if step_obj.approval_code and step_obj.approval_code in app_by_code:
            linked_app = app_by_code[step_obj.approval_code]
        elif step_obj.code in app_by_code:
            linked_app = app_by_code[step_obj.code]

        if linked_app:
            if linked_app.status == "APPROVED":
                current_st = "DONE"
                if not st_obj:
                    st_obj = BusinessRoadmapStatus(
                        business_id=target_biz_id,
                        roadmap_step_id=step_obj.id,
                        status="DONE",
                        reference_number=linked_app.certificate_number or linked_app.application_number,
                        notes=f"Auto-synced from approved application {linked_app.application_number}",
                        completed_at=linked_app.approved_at or datetime.datetime.utcnow()
                    )
                    db.add(st_obj)
                    status_map[step_obj.id] = st_obj
                    db_changed = True
                elif st_obj.status != "DONE":
                    st_obj.status = "DONE"
                    st_obj.reference_number = linked_app.certificate_number or linked_app.application_number
                    st_obj.completed_at = linked_app.approved_at or datetime.datetime.utcnow()
                    db_changed = True
            elif linked_app.status in ["SUBMITTED", "UNDER REVIEW", "UNDER_REVIEW", "QUERY RAISED", "QUERY_RAISED", "INSPECTION REQUIRED", "INSPECTION_REQUIRED", "INSPECTION SCHEDULED", "INSPECTION_SCHEDULED"]:
                if current_st == "NOT_STARTED":
                    current_st = "IN_PROGRESS"
                    if not st_obj:
                        st_obj = BusinessRoadmapStatus(
                            business_id=target_biz_id,
                            roadmap_step_id=step_obj.id,
                            status="IN_PROGRESS",
                            reference_number=linked_app.application_number,
                            notes=f"Application {linked_app.application_number} in review."
                        )
                        db.add(st_obj)
                        status_map[step_obj.id] = st_obj
                        db_changed = True
                    elif st_obj.status == "NOT_STARTED":
                        st_obj.status = "IN_PROGRESS"
                        st_obj.reference_number = linked_app.application_number
                        db_changed = True

        code_status_map[code] = current_st

    if db_changed:
        db.commit()

    formatted_steps = []
    completed_count = 0
    in_progress_count = 0
    locked_count = 0

    for idx, code in enumerate(allowed_codes, start=1):
        step = all_db_steps.get(code)
        if not step:
            continue

        st_obj = status_map.get(step.id)
        current_st = code_status_map.get(code, "NOT_STARTED")
        ref_num = st_obj.reference_number if st_obj else None
        completed_at = st_obj.completed_at.isoformat() if (st_obj and st_obj.completed_at) else None
        notes = st_obj.notes if st_obj else None

        # Check linked application
        linked_app = None
        if step.approval_code and step.approval_code in app_by_code:
            linked_app = app_by_code[step.approval_code]
        elif step.code in app_by_code:
            linked_app = app_by_code[step.code]

        # Check dependencies
        dep_str = dep_override_map.get(code, step.depends_on or "")
        dep_codes = [c.strip() for c in dep_str.split(",") if c.strip() and c.strip() in allowed_codes]
        unmet_deps = []
        is_locked = False

        if current_st != "DONE":
            for dep_code in dep_codes:
                if code_status_map.get(dep_code) != "DONE":
                    unmet_deps.append(dep_code)
            if len(unmet_deps) > 0:
                is_locked = True
                current_st = "LOCKED"
                locked_count += 1

        if current_st == "DONE":
            completed_count += 1
        elif current_st == "IN_PROGRESS":
            in_progress_count += 1

        unmet_names = [all_db_steps[c].name for c in unmet_deps if c in all_db_steps]
        dep_names = [all_db_steps[c].name for c in dep_codes if c in all_db_steps]

        # Portal URL tailoring
        portal_url = step.official_portal_url
        if step.code == "TRADE_LICENCE" and biz and biz.district:
            dist = biz.district.lower()
            if "pune" in dist:
                portal_url = "https://www.pmc.gov.in"
            elif "mumbai" in dist:
                portal_url = "https://portal.mcgm.gov.in"

        # Readiness score for this step
        step_readiness = calculate_step_readiness(db, target_biz_id, step.code)
        if isinstance(step_readiness, dict):
            readiness_pct = step_readiness.get("readiness_percentage", step_readiness.get("readiness_score", 0))
            missing_count = step_readiness.get("total_missing", step_readiness.get("missing_count", 0))
            total_docs = step_readiness.get("total_required", 0)
        else:
            readiness_pct = getattr(step_readiness, "readiness_percentage", getattr(step_readiness, "readiness_score", 0))
            missing_count = getattr(step_readiness, "total_missing", getattr(step_readiness, "missing_count", 0))
            total_docs = getattr(step_readiness, "total_required", 0)

        formatted_steps.append({
            "id": step.id,
            "code": step.code,
            "name": step.name,
            "category": step.category,
            "description": step.description,
            "issuing_authority": step.issuing_authority,
            "official_portal_url": portal_url,
            "typical_timeline_days": step.typical_timeline_days,
            "typical_cost": step.typical_cost,
            "depends_on_codes": dep_codes,
            "depends_on_names": dep_names,
            "unmet_dependencies": unmet_names,
            "is_locked": is_locked,
            "status": current_st,
            "reference_number": ref_num,
            "completed_at": completed_at,
            "notes": notes,
            "approval_id": approval_code_map.get(step.approval_code),
            "approval_code": step.approval_code,
            "linked_application": {
                "id": linked_app.id,
                "application_number": linked_app.application_number,
                "status": linked_app.status,
                "certificate_number": linked_app.certificate_number,
                "sla_days": linked_app.sla_days
            } if linked_app else None,
            "step_order": idx,
            "readiness_score": readiness_pct,
            "missing_documents_count": missing_count,
            "total_documents_count": total_docs
        })

    next_step = next((s for s in formatted_steps if s["status"] != "DONE" and not s["is_locked"]), None)

    total_steps = len(formatted_steps)
    pct = int(round((completed_count / total_steps) * 100)) if total_steps > 0 else 0

    return {
        "business_id": target_biz_id,
        "business_name": biz.name if biz else "Demo Enterprise",
        "sector": sector,
        "premises_type": biz.premises_type if biz else "RENTED",
        "summary": {
            "total_steps": total_steps,
            "completed_steps": completed_count,
            "in_progress_steps": in_progress_count,
            "locked_steps": locked_count,
            "percentage_completed": pct,
            "completion_percentage": pct
        },
        "next_step": next_step,
        "steps": formatted_steps
    }

@router.get("/{step_id}/assistant")
def get_step_assistant_details(
    step_id: int,
    business_id: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns step guidance, official portal details, field-by-field instructions,
    and real-time document readiness score and checklist from the Vault.
    """
    step = db.query(RoadmapStep).filter(RoadmapStep.id == step_id).first()
    if not step:
        raise HTTPException(status_code=404, detail="Roadmap step not found")

    biz = None
    if business_id is not None:
        try:
            b_id = int(business_id)
            biz = db.query(Business).filter(Business.id == b_id).first()
        except (ValueError, TypeError):
            biz = None
    if not biz:
        biz = db.query(Business).filter(Business.owner_id == current_user.id).first()
    if not biz:
        biz = db.query(Business).first()

    biz_id = biz.id if biz else 1
    premises = (biz.premises_type if biz and biz.premises_type else "RENTED").upper()

    # Document readiness calculation
    readiness = calculate_step_readiness(db, biz_id, step.code)

    # Field-by-Field instructions for official government portals
    FIELD_GUIDANCE_DB = {
        "GST": [
            {
                "field_name": "Legal Name of Business & Constitution",
                "form_section": "Business Details (Part A)",
                "where_to_find": "Certificate of Incorporation or PAN Card.",
                "example_value": biz.name if biz else "Demo Food Processing Unit Pvt Ltd",
                "pitfall": "Exact spelling match with PAN database is strictly verified via automated API."
            },
            {
                "field_name": "Principal Place of Business & Premises Tenure",
                "form_section": "Principal Place of Business",
                "where_to_find": f"Rent Agreement or Property Tax Deed. Selected Tenure: {premises}.",
                "example_value": f"{premises.title()} Premises — {biz.address or 'Plot E-42 Chakan MIDC, Pune 410501'}",
                "pitfall": f"If {premises.title()}, electricity bill must match the exact municipal address on agreement."
            },
            {
                "field_name": "Authorized Signatory Details & Photo",
                "form_section": "Authorized Signatory",
                "where_to_find": "Aadhaar Card, Mobile OTP, and Passport size photo (<100 KB).",
                "example_value": biz.applicant_name or "Rahul Deshmukh (Managing Director)",
                "pitfall": "Signatory mobile number must be actively linked with UIDAI Aadhaar for e-Sign OTP."
            },
            {
                "field_name": "Commodity / Service Classification (HSN / SAC)",
                "form_section": "Goods and Services",
                "where_to_find": "Customs HSN Tariff Code.",
                "example_value": "HSN 2008 (Fruit concentrates) / SAC 9983 (IT Solutions)",
                "pitfall": "Specifying at least one primary 4 or 6-digit HSN code is mandatory."
            },
            {
                "field_name": "Primary Bank Account Details",
                "form_section": "Bank Accounts",
                "where_to_find": "Cancelled Cheque or First Page of Passbook.",
                "example_value": "HDFC Bank / IFSC HDFC0001234 / A/C 50200088991122",
                "pitfall": "Entity name must be pre-printed on the cheque leaf."
            }
        ],
        "UDYAM": [
            {
                "field_name": "Aadhaar Number & Entrepreneur Name",
                "form_section": "Aadhaar Verification",
                "where_to_find": "12-digit Aadhaar card of proprietor / managing director.",
                "example_value": "XXXX-XXXX-4819 (Aadhaar OTP required)",
                "pitfall": "Name entered must match Aadhaar card spelling character-for-character."
            },
            {
                "field_name": "PAN & Organization Type",
                "form_section": "PAN Validation",
                "where_to_find": "Company PAN Card.",
                "example_value": "AABCD9876E (Private Limited Company)",
                "pitfall": "System fetches ITR & GST filings automatically from government databases."
            },
            {
                "field_name": "NIC 5-Digit Classification Code",
                "form_section": "Activity Details",
                "where_to_find": "National Industrial Classification 2008 handbook.",
                "example_value": "10304 (Manufacture of fruit pulp) or 62011 (Writing software code)",
                "pitfall": "Ensure activity matches the primary description in your incorporation documents."
            },
            {
                "field_name": "Written Down Value of Plant & Machinery",
                "form_section": "Investment Scale",
                "where_to_find": "Previous year audited balance sheet or CA provisional certificate.",
                "example_value": f"₹{int(biz.investment) if biz else 5000000} (Excluding land cost)",
                "pitfall": "Do not include land cost or building cost under plant and machinery."
            }
        ],
        "FSSAI": [
            {
                "field_name": "Kind of Business (KoB) & License Tier",
                "form_section": "General Details (FoSCoS)",
                "where_to_find": "FSSAI Scale Classifier.",
                "example_value": "Food Manufacturer (State License, capacity 2 MT/day)",
                "pitfall": "Turnover > ₹12 Lakhs or capacity > 100 kg/day mandates State License over basic registration."
            },
            {
                "field_name": "Water Potability Report IS 10500",
                "form_section": "Statutory Compliance Uploads",
                "where_to_find": "NABL Accredited Chemical & Microbiological Lab Report.",
                "example_value": "Apex Environmental NABL Analytical Lab (IS 10500:2012)",
                "pitfall": "Test report must be dated within the last 12 months."
            },
            {
                "field_name": "Food Safety Management System (FSMS) Plan",
                "form_section": "Technical SOPs",
                "where_to_find": "Company Quality & Hygiene Manual / HACCP Plan.",
                "example_value": "HACCP & GMP Workflow Layout (5 CCPs identified)",
                "pitfall": "Must clearly display sanitation steps, pest control schedule, and CCP limits."
            }
        ]
    }

    # Preparation checklist items
    PREPARATION_CHECKLIST_DB = {
        "GST": [
            "Confirm that the applicant's mobile number is linked to Aadhaar for instant OTP e-verification.",
            f"Ensure {premises.lower()} premises documents (rent deed / title deed) show the exact PIN code and district.",
            "Obtain pre-printed cancelled cheque showing company legal name and IFSC code.",
            "Verify all PDF uploads are clear, color-scanned, and strictly below 2 MB in file size."
        ],
        "UDYAM": [
            "Have Aadhaar-linked mobile ready for one-time password verification.",
            "Keep company PAN and bank account details accessible.",
            "Confirm NIC code matching your core manufacturing or service operations.",
            "Review employee headcount breakdown (male, female, other)."
        ],
        "FSSAI": [
            "Ensure process water potability certificate complies with Indian Standard IS 10500.",
            "Keep technical equipment list with installed horsepower and daily output capacity ready.",
            "Prepare recall plan and FSMS hygiene declaration on company letterhead.",
            "Verify food handler medical fitness certificates are filed."
        ]
    }

    default_guidance = [
        {
            "field_name": "Enterprise Legal Identity",
            "form_section": "Applicant Profile",
            "where_to_find": "Certificate of Incorporation or PAN Card.",
            "example_value": biz.name if biz else "Registered Enterprise",
            "pitfall": "Ensure name matches exactly with state trade records."
        },
        {
            "field_name": "Premises Proof & Location",
            "form_section": "Premises Location",
            "where_to_find": f"Document Vault — {premises.title()} proof.",
            "example_value": biz.address if biz else "Pune, Maharashtra",
            "pitfall": "Address mismatch is the #1 cause of departmental query rejection."
        }
    ]

    default_prep = [
        "Review statutory requirements and keep digital copies of vault documents ready.",
        "Ensure active mobile and email access for departmental OTPs.",
        "Check that all fees are payable via Net Banking or UPI."
    ]

    # Current roadmap status for this step
    st_obj = db.query(BusinessRoadmapStatus).filter(
        BusinessRoadmapStatus.business_id == biz_id,
        BusinessRoadmapStatus.roadmap_step_id == step.id
    ).first()

    cat_item = REGULATORY_CATALOG.get(step.code, {})

    # Portal guide steps
    portal_guide_steps = cat_item.get("portal_guide_steps", [
        {"step_num": 1, "title": f"Access Official {step.issuing_authority} Portal", "instruction": f"Open the statutory registration portal at {step.official_portal_url} and select 'New Registration'.", "portal_url": step.official_portal_url},
        {"step_num": 2, "title": "Create User Account & Verify Mobile/Email", "instruction": "Register using authorized signatory details and complete mobile and email OTP authentication.", "portal_url": None},
        {"step_num": 3, "title": "Enter Enterprise Details & Location", "instruction": "Fill in legal business name, constitution, and premises details matching your registered documents.", "portal_url": None},
        {"step_num": 4, "title": "Upload Verified Documents from Vault", "instruction": "Upload required identity and premises proofs from your Antigravity Document Vault.", "portal_url": None},
        {"step_num": 5, "title": "Pay Government Statutory Fee & Obtain ARN", "instruction": f"Pay the official statutory fee ({step.typical_cost}) and save your Application Reference Number (ARN) for tracking.", "portal_url": None}
    ])

    # Required information with resolved values from profile
    raw_req_info = cat_item.get("required_information", [
        {"key": "entity_name", "label": "Enterprise Legal Name", "profile_field": "name", "required": True},
        {"key": "applicant_name", "label": "Applicant / Authorized Signatory Name", "profile_field": "applicant_name", "required": True},
        {"key": "pan", "label": "Permanent Account Number (PAN)", "profile_field": "pan_number", "required": True},
        {"key": "premises_type", "label": "Premises Tenure Type", "profile_field": "premises_type", "required": True},
        {"key": "address", "label": "Premises Registered Address", "profile_field": "address", "required": True},
        {"key": "email", "label": "Statutory Contact Email", "profile_field": "email", "required": True},
        {"key": "phone", "label": "Aadhaar-Linked Contact Mobile", "profile_field": "phone", "required": True}
    ])

    resolved_info = []
    for info in raw_req_info:
        val = ""
        pfield = info.get("profile_field")
        if pfield and biz and hasattr(biz, pfield):
            val = getattr(biz, pfield)
        elif info.get("key") == "pan" and biz:
            val = getattr(biz, "pan_number", "") or getattr(biz, "pan", "")
        elif info.get("key") == "applicant_name" and biz:
            val = getattr(biz, "applicant_name", "") or getattr(biz, "owner_name", "") or getattr(biz, "name", "")
        elif info.get("key") == "premises_type" and biz:
            val = premises
        elif info.get("key") == "address" and biz:
            val = getattr(biz, "address", "")
        elif info.get("key") == "sector" and biz:
            val = getattr(biz, "sector", "")
        elif info.get("key") == "business_type" and biz:
            val = getattr(biz, "business_type", "")
        elif info.get("key") == "investment" and biz:
            val = f"₹{int(biz.investment):,}" if getattr(biz, "investment", None) else ""

        resolved_info.append({
            "key": info.get("key"),
            "label": info.get("label"),
            "required": info.get("required", False),
            "current_value": str(val) if val is not None else ""
        })

    # Official Source Metadata
    official_source = {
        "act": cat_item.get("source", "Government Statutory Notification & Regulatory Guidelines"),
        "source_url": cat_item.get("source_url", step.official_portal_url),
        "last_reviewed": cat_item.get("last_reviewed", "15/08/2026"),
        "renewal_info": cat_item.get("renewal_info", "Annual statutory renewal / Permanent registration unless altered"),
        "authority": step.issuing_authority
    }

    # Field guidance: combine catalog or fallback
    field_guidance = cat_item.get("field_guidance") or FIELD_GUIDANCE_DB.get(step.code, default_guidance)
    # Ensure items have field_name, explanation / where_to_find, example / example_value, pitfall
    normalized_field_guidance = []
    for fg in field_guidance:
        normalized_field_guidance.append({
            "field_name": fg.get("field_name", "Field"),
            "form_section": fg.get("form_section", "General Section"),
            "where_to_find": fg.get("where_to_find") or fg.get("explanation", ""),
            "example_value": fg.get("example_value") or fg.get("example", ""),
            "pitfall": fg.get("pitfall", "Ensure exact match with official records.")
        })

    # Format readiness dict with aliases
    readiness_dict = readiness.dict() if hasattr(readiness, "dict") else dict(readiness)
    readiness_dict["readiness_score"] = readiness_dict.get("readiness_percentage", 0)
    readiness_dict["missing_count"] = readiness_dict.get("total_missing", 0)
    readiness_dict["items"] = [
        {
            "requirement_name": item.get("required_name"),
            "required_type": item.get("document_type"),
            "category": item.get("category"),
            "is_mandatory": item.get("is_mandatory"),
            "status": item.get("status"),
            "matched_document": item.get("matched_document"),
            "reason": item.get("reason")
        } for item in readiness_dict.get("requirements_status", [])
    ]

    # Check for linked application
    linked_app = None
    if step.approval_code:
        approval_obj = db.query(Approval).filter(Approval.code == step.approval_code).first()
        if approval_obj:
            linked_app = db.query(Application).filter(
                Application.business_id == biz_id,
                Application.approval_id == approval_obj.id
            ).order_by(Application.created_at.desc()).first()
    if not linked_app:
        approval_obj = db.query(Approval).filter(Approval.code == step.code).first()
        if approval_obj:
            linked_app = db.query(Application).filter(
                Application.business_id == biz_id,
                Application.approval_id == approval_obj.id
            ).order_by(Application.created_at.desc()).first()

    return {
        "step": {
            "id": step.id,
            "code": step.code,
            "name": step.name,
            "category": step.category,
            "description": step.description,
            "issuing_authority": step.issuing_authority,
            "official_portal_url": step.official_portal_url,
            "typical_timeline_days": step.typical_timeline_days,
            "typical_cost": step.typical_cost,
            "approval_code": step.approval_code,
            "approval_id": approval_obj.id if approval_obj else None
        },
        "business": {
            "id": biz_id,
            "name": biz.name if biz else "Enterprise",
            "sector": biz.sector if biz else "General",
            "premises_type": premises
        },
        "official_source": official_source,
        "portal_guide_steps": portal_guide_steps,
        "required_information": resolved_info,
        "field_guidance": normalized_field_guidance,
        "preparation_checklist": PREPARATION_CHECKLIST_DB.get(step.code, default_prep),
        "document_readiness": readiness_dict,
        "current_status": {
            "status": st_obj.status if st_obj else "NOT_STARTED",
            "reference_number": st_obj.reference_number if st_obj else "",
            "notes": st_obj.notes if st_obj else "",
            "completed_at": st_obj.completed_at.isoformat() if (st_obj and st_obj.completed_at) else None
        },
        "linked_application": {
            "id": linked_app.id,
            "application_number": linked_app.application_number,
            "status": linked_app.status,
            "certificate_number": linked_app.certificate_number,
            "submitted_at": linked_app.submitted_at.isoformat() if linked_app.submitted_at else None,
            "sla_days": linked_app.sla_days,
            "readiness_score": linked_app.readiness_score
        } if linked_app else None
    }

@router.put("/{step_id}/status")
def update_roadmap_step_status(
    step_id: int,
    payload: RoadmapStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    step = db.query(RoadmapStep).filter(RoadmapStep.id == step_id).first()
    if not step:
        raise HTTPException(status_code=404, detail="Roadmap step not found")

    # Determine business
    biz_id = payload.business_id
    if not biz_id:
        b = db.query(Business).filter(Business.owner_id == current_user.id).first()
        if not b:
            b = db.query(Business).first()
        biz_id = b.id if b else 1

    status_obj = db.query(BusinessRoadmapStatus).filter(
        BusinessRoadmapStatus.business_id == biz_id,
        BusinessRoadmapStatus.roadmap_step_id == step_id
    ).first()

    valid_statuses = ["NOT_STARTED", "IN_PROGRESS", "DONE", "SUBMITTED"]
    new_status = payload.status.upper()
    if new_status == "SUBMITTED":
        new_status = "DONE"  # Mark step completed on submission
    elif new_status not in valid_statuses:
        new_status = "NOT_STARTED"

    if not status_obj:
        status_obj = BusinessRoadmapStatus(
            business_id=biz_id,
            roadmap_step_id=step_id,
            status=new_status,
            reference_number=payload.reference_number,
            notes=payload.notes,
            completed_at=datetime.datetime.utcnow() if new_status == "DONE" else None
        )
        db.add(status_obj)
    else:
        status_obj.status = new_status
        if payload.reference_number is not None:
            status_obj.reference_number = payload.reference_number
        if payload.notes is not None:
            status_obj.notes = payload.notes
        if new_status == "DONE" and not status_obj.completed_at:
            status_obj.completed_at = datetime.datetime.utcnow()
        elif new_status != "DONE":
            status_obj.completed_at = None
        status_obj.updated_at = datetime.datetime.utcnow()

    # Link/Sync with Application tracker if reference number provided or approval code linked
    if step.approval_code or payload.reference_number:
        app_obj = None
        ref = payload.reference_number or f"{step.code}-APP-2026-001"
        app_obj = db.query(Application).filter(Application.application_number == ref).first()
        
        # Look up approval
        approval = None
        if step.approval_code:
            approval = db.query(Approval).filter(Approval.code == step.approval_code).first()
        if not approval:
            approval = db.query(Approval).first()

        dept_id = approval.department_id if approval else 1

        if not app_obj and approval:
            app_obj = Application(
                application_number=ref,
                business_id=biz_id,
                approval_id=approval.id,
                department_id=dept_id,
                status=ApplicationStatus.SUBMITTED if new_status == "DONE" else ApplicationStatus.READY,
                readiness_score=100.0,
                submitted_at=datetime.datetime.utcnow()
            )
            db.add(app_obj)
        elif app_obj:
            if new_status == "DONE":
                app_obj.status = ApplicationStatus.SUBMITTED
            app_obj.updated_at = datetime.datetime.utcnow()

    db.commit()

    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        user_name=current_user.full_name,
        action="ROADMAP_STEP_UPDATED",
        entity="RoadmapStep",
        entity_id=step.id,
        details=f"Updated step '{step.name}' to {new_status}" + (f" (Ref: {payload.reference_number})" if payload.reference_number else "")
    )
    db.add(audit)
    db.commit()

    return {
        "message": f"Updated '{step.name}' status to {new_status}",
        "step_id": step.id,
        "status": new_status,
        "reference_number": status_obj.reference_number
    }
