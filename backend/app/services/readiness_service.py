from typing import List, Dict, Any, Optional
import re
from sqlalchemy.orm import Session
from backend.app.models.approval import Approval, ApprovalRequirement
from backend.app.models.document import Document
from backend.app.models.business import Business
from backend.app.schemas.document import (
    ReadinessScoreResponse, MatchedRequirementItem, DocumentResponse, StepReadinessResponse
)

def _match_document_to_req(
    req_name: str,
    req_type: str,
    vault_docs: List[Document],
    used_doc_ids: set
) -> Optional[Document]:
    req_str = f"{req_name} {req_type}".lower()
    
    # 1. Exact match
    for doc in vault_docs:
        if doc.id not in used_doc_ids and doc.doc_type.lower() == req_type.lower():
            return doc

    # 2. Heuristic keyword groups
    KEYWORD_GROUPS = [
        ("rent", ["rent", "tenancy", "lease deed", "rental", "lease agreement"]),
        ("electricity", ["electricity", "power bill", "utility", "msedcl", "bescom", "ebill"]),
        ("landlord_noc", ["landlord noc", "owner noc", "consent letter", "noc from owner"]),
        ("property_title", ["title deed", "ownership proof", "tax receipt", "allotment order", "property tax", "midc plot"]),
        ("pan", ["pan card", "pan & gst", "gstin", "tax identification"]),
        ("incorporation", ["incorporation", "constitution", "partnership deed", "cin", "mca", "roc"]),
        ("bank", ["bank account", "cancelled cheque", "bank statement", "passbook"]),
        ("signatory_id", ["aadhaar", "passport", "voter id", "signatory", "director id"]),
        ("fsms", ["food safety", "fsms", "haccp", "sanitation plan"]),
        ("water", ["water potability", "water quality", "is 10500", "potability report", "lab analysis"]),
        ("factory_layout", ["factory machine layout", "architectural drawing", "plant layout"]),
        ("etp", ["effluent treatment", "etp", "pollution control", "mpcb"]),
        ("fire_noc", ["fire safety", "evacuation plan", "fire noc"]),
        ("trade_license", ["trade permit", "trade license", "shop act"]),
        ("employee_list", ["employee list", "wage register", "muster roll"]),
    ]

    for group_key, synonyms in KEYWORD_GROUPS:
        if any(syn in req_str for syn in synonyms):
            for doc in vault_docs:
                if doc.id in used_doc_ids:
                    continue
                doc_str = f"{doc.doc_type} {doc.original_name} {doc.filename} {doc.ocr_extracted_text or ''}".lower()
                if any(syn in doc_str for syn in synonyms):
                    return doc

    # 3. Fallback word overlap
    req_words = set(w for w in re.split(r'[\s/\-_]+', req_str) if len(w) > 3)
    best_candidate = None
    best_overlap = 0
    for doc in vault_docs:
        if doc.id in used_doc_ids:
            continue
        doc_str = f"{doc.doc_type} {doc.original_name}".lower()
        doc_words = set(w for w in re.split(r'[\s/\-_]+', doc_str) if len(w) > 3)
        overlap = len(req_words.intersection(doc_words))
        if overlap >= 2 and overlap > best_overlap:
            best_overlap = overlap
            best_candidate = doc

    return best_candidate

def calculate_readiness(db: Session, business_id: int, approval_id: int) -> ReadinessScoreResponse:
    approval = db.query(Approval).filter(Approval.id == approval_id).first()
    if not approval:
        raise ValueError("Approval not found")

    business = db.query(Business).filter(Business.id == business_id).first()
    premises_type = (business.premises_type if business and business.premises_type else "RENTED").upper()

    requirements: List[ApprovalRequirement] = approval.requirements
    vault_docs: List[Document] = db.query(Document).filter(Document.business_id == business_id).all()

    items: List[MatchedRequirementItem] = []
    total_required = len(requirements)
    total_matched = 0
    total_valid = 0
    total_expiring = 0
    total_missing = 0
    used_doc_ids = set()

    for req in requirements:
        # Dynamic premises adjustment for Land/Property category
        req_name = req.name
        req_type = req.document_type
        if req.category == "Land/Property" or "lease" in req.name.lower() or "ownership" in req.name.lower():
            if premises_type == "RENTED":
                req_name = "Registered Rent Agreement / Commercial Lease Deed"
                req_type = "Rent Agreement / Lease Deed"
            elif premises_type == "OWNED":
                req_name = "Property Title Deed / Municipal Tax Receipt"
                req_type = "Property Title Deed / Ownership Proof"
            elif premises_type == "LEASED":
                req_name = "MIDC / Government Plot 99-Year Lease Deed"
                req_type = "Land Lease Deed / Ownership Proof"
            elif premises_type == "CONSENT_SHARED":
                req_name = "Property Owner Consent Letter / NOC"
                req_type = "Consent Letter / Landlord NOC"

        matched_doc = _match_document_to_req(req_name, req_type, vault_docs, used_doc_ids)

        if matched_doc:
            used_doc_ids.add(matched_doc.id)
            total_matched += 1

            if matched_doc.validity_status == "EXPIRED":
                status = "EXPIRED"
                reason = "Document has expired and must be renewed before application."
            elif matched_doc.validity_status == "EXPIRING_SOON":
                status = "EXPIRING_SOON"
                total_valid += 1
                total_expiring += 1
                reason = f"Document is valid but will expire in {matched_doc.days_to_expiry or '<30'} days."
            else:
                status = "MATCHED"
                total_valid += 1
                reason = "Document is valid and verified in your Vault."

            doc_resp = DocumentResponse.from_orm(matched_doc)
        else:
            status = "MISSING"
            total_missing += 1
            reason = f"Required document '{req_name}' is missing from your Vault."
            doc_resp = None

        items.append(MatchedRequirementItem(
            requirement_id=req.id,
            required_name=req_name,
            document_type=req_type,
            category=req.category,
            is_mandatory=req.is_mandatory,
            status=status,
            matched_document=doc_resp,
            reason=reason
        ))

    readiness_percentage = round((total_valid / total_required) * 100, 1) if total_required > 0 else 100.0
    is_ready = (total_missing == 0 and total_valid == total_required)

    return ReadinessScoreResponse(
        approval_id=approval.id,
        approval_name=approval.name,
        total_required=total_required,
        total_matched=total_matched,
        total_valid=total_valid,
        total_expiring=total_expiring,
        total_missing=total_missing,
        readiness_percentage=readiness_percentage,
        is_ready_for_submission=is_ready,
        requirements_status=items
    )

def calculate_step_readiness(db: Session, business_id: int, step_code: str) -> StepReadinessResponse:
    business = db.query(Business).filter(Business.id == business_id).first()
    premises_type = (business.premises_type if business and business.premises_type else "RENTED").upper()
    vault_docs: List[Document] = db.query(Document).filter(Document.business_id == business_id).all()

    norm_code = step_code.upper().replace("-", "_")

    # Premises requirements template
    premises_reqs = []
    if premises_type == "RENTED":
        premises_reqs = [
            ("Registered Rent Agreement / Lease Deed", "Rent Agreement / Lease Deed", "Premises Proof", True),
            ("Landlord NOC / Property Owner Consent Letter", "Landlord NOC / Consent Letter", "Premises Proof", True),
            ("Electricity Bill / Utility Bill of Premises", "Electricity Bill / Utility Bill", "Premises Proof", True),
        ]
    elif premises_type == "OWNED":
        premises_reqs = [
            ("Property Title Deed / Municipal Tax Receipt", "Property Title Deed / Ownership Proof", "Premises Proof", True),
            ("Electricity Bill in Property Owner Name", "Electricity Bill / Utility Bill", "Premises Proof", True),
        ]
    elif premises_type == "LEASED":
        premises_reqs = [
            ("Registered MIDC / Government Plot Lease Deed", "Land Lease Deed / Ownership Proof", "Premises Proof", True),
            ("Electricity Bill / Possession Handover Letter", "Electricity Bill / Utility Bill", "Premises Proof", True),
        ]
    else:  # CONSENT_SHARED
        premises_reqs = [
            ("Owner Consent Letter & NOC for Commercial Operation", "Consent Letter / Landlord NOC", "Premises Proof", True),
            ("Shared Workspace Agreement / Co-working Tenure Proof", "Rent Agreement / Lease Deed", "Premises Proof", True),
        ]

    # Generate step-specific requirements
    req_defs = []
    step_name = step_code

    if "GST" in norm_code:
        step_name = "GST Registration (GSTIN)"
        req_defs = [
            *premises_reqs,
            ("PAN & GST Registration Certificate", "PAN & GST Registration Certificate", "Financial", True),
            ("Certificate of Incorporation / Business Constitution", "Certificate of Incorporation / Partnership Deed", "Business", True),
            ("Bank Account Proof / Cancelled Cheque", "Bank Account Proof / Cancelled Cheque", "Financial", True),
            ("Authorized Signatory Identity (Aadhaar / Passport)", "Identity & Address Proof of Signatory", "Signatory", True),
        ]
    elif "UDYAM" in norm_code:
        step_name = "Udyam MSME Registration"
        req_defs = [
            ("PAN Card of Enterprise / Promoters", "PAN & GST Registration Certificate", "Financial", True),
            ("Aadhaar Card of Authorized Signatory", "Identity & Address Proof of Signatory", "Signatory", True),
            ("Bank Account Proof / Cancelled Cheque", "Bank Account Proof / Cancelled Cheque", "Financial", True),
            ("Certificate of Incorporation / Business Constitution", "Certificate of Incorporation / Partnership Deed", "Business", True),
        ]
    elif "SHOP" in norm_code:
        step_name = "Shop & Establishment Registration (Gumasta)"
        req_defs = [
            *premises_reqs[:2],
            ("Certificate of Incorporation / Business Constitution", "Certificate of Incorporation / Partnership Deed", "Business", True),
            ("PAN Card of Enterprise", "PAN & GST Registration Certificate", "Financial", True),
            ("Employee Details & Wage Register Layout", "Employee List & Wage Register", "Operations", True),
        ]
    elif "FSSAI" in norm_code:
        step_name = "FSSAI Food Safety State License"
        req_defs = [
            ("Certificate of Incorporation / Business Constitution", "Certificate of Incorporation / Partnership Deed", "Business", True),
            ("PAN & GST Registration Certificate", "PAN & GST Registration Certificate", "Financial", True),
            premises_reqs[0],
            ("Food Safety Management System (FSMS) Plan", "Food Safety Management Plan", "Technical", True),
            ("Water Potability & Chemical Analysis Report (IS 10500)", "Water Quality & Potability Test Report", "Compliance", True),
        ]
    elif "MPCB" in norm_code or "POLLUTION" in norm_code:
        step_name = "MPCB Consent to Establish (Orange Category)"
        req_defs = [
            premises_reqs[0],
            ("Effluent Treatment Plant (ETP) Project Scheme", "Environmental Impact & Effluent Management Plan", "Environmental", True),
            ("Manufacturing Process Flowchart & Water Balance", "Process Flowchart & Technical Scheme", "Technical", True),
            ("PAN & GST Registration Certificate", "PAN & GST Registration Certificate", "Financial", True),
        ]
    elif "FACTORY" in norm_code or "DISH" in norm_code:
        step_name = "DISH Factory Plan & Machinery License"
        req_defs = [
            premises_reqs[0],
            ("Factory Machine Layout & Architectural Drawing", "Factory Layout & Machine Installation Plan", "Technical", True),
            ("Fire Safety NOC & Evacuation Plan", "Fire Safety NOC & Evacuation Plan", "NOCs", True),
            ("Certificate of Incorporation / Business Constitution", "Certificate of Incorporation / Partnership Deed", "Business", True),
        ]
    elif "FIRE" in norm_code:
        step_name = "Fire Safety Provisional NOC"
        req_defs = [
            premises_reqs[0],
            ("Building Architectural Layout & Emergency Escape Scheme", "Fire Safety NOC & Evacuation Plan", "NOCs", True),
            ("Certificate of Incorporation / Business Constitution", "Certificate of Incorporation / Partnership Deed", "Business", True),
        ]
    elif "TRADE" in norm_code:
        step_name = "Municipal Industrial / Commercial Trade License"
        req_defs = [
            *premises_reqs[:2],
            ("Certificate of Incorporation / Business Constitution", "Certificate of Incorporation / Partnership Deed", "Business", True),
            ("PAN & GST Registration Certificate", "PAN & GST Registration Certificate", "Financial", True),
        ]
    elif "STPI" in norm_code:
        step_name = "STPI / Software Export & Professional Tax Registration"
        req_defs = [
            premises_reqs[0],
            ("Certificate of Incorporation / Business Constitution", "Certificate of Incorporation / Partnership Deed", "Business", True),
            ("PAN & GST Registration Certificate", "PAN & GST Registration Certificate", "Financial", True),
            ("Software Project Report & Export Forecast", "Software Export Plan & Project Report", "Technical", True),
        ]
    elif "LEGAL" in norm_code or "METROLOGY" in norm_code:
        step_name = "Legal Metrology Packaged Commodities & Verification"
        req_defs = [
            *premises_reqs[:2],
            ("PAN & GST Registration Certificate", "PAN & GST Registration Certificate", "Financial", True),
            ("Model Approval Certificate of Weighing Scales", "Model Approval & Verification Certificate", "Technical", True),
        ]
    elif "INCORPORATION" in norm_code:
        step_name = "Company / Entity Incorporation (MCA)"
        req_defs = [
            premises_reqs[0],
            ("PAN Card of Promoters", "PAN & GST Registration Certificate", "Financial", True),
            ("Identity & Address Proof of Directors", "Identity & Address Proof of Signatory", "Signatory", True),
        ]
    elif "PAN" in norm_code:
        step_name = "Permanent Account Number (PAN & TAN)"
        req_defs = [
            premises_reqs[0],
            ("Certificate of Incorporation / Business Constitution", "Certificate of Incorporation / Partnership Deed", "Business", True),
            ("Identity & Address Proof of Signatory", "Identity & Address Proof of Signatory", "Signatory", True),
        ]
    else:
        step_name = step_code.replace("_", " ").title()
        req_defs = [
            premises_reqs[0],
            ("Certificate of Incorporation / Business Constitution", "Certificate of Incorporation / Partnership Deed", "Business", True),
            ("PAN & GST Registration Certificate", "PAN & GST Registration Certificate", "Financial", True),
        ]

    items: List[MatchedRequirementItem] = []
    total_required = len(req_defs)
    total_matched = 0
    total_valid = 0
    total_expiring = 0
    total_missing = 0
    action_items = []
    used_doc_ids = set()

    for idx, (req_name, req_type, category, is_mandatory) in enumerate(req_defs, start=1):
        matched_doc = _match_document_to_req(req_name, req_type, vault_docs, used_doc_ids)

        if matched_doc:
            used_doc_ids.add(matched_doc.id)
            total_matched += 1

            if matched_doc.validity_status == "EXPIRED":
                status = "EXPIRED"
                reason = "Document has expired and must be renewed in Vault."
                action_items.append(f"Renew expired {req_name}")
            elif matched_doc.validity_status == "EXPIRING_SOON":
                status = "EXPIRING_SOON"
                total_valid += 1
                total_expiring += 1
                reason = f"Document is valid but will expire in {matched_doc.days_to_expiry or '<30'} days."
            else:
                status = "MATCHED"
                total_valid += 1
                reason = "Verified in Document Vault."

            doc_resp = DocumentResponse.from_orm(matched_doc)
        else:
            status = "MISSING"
            total_missing += 1
            reason = f"Required document '{req_name}' is missing from your Vault."
            action_items.append(f"Upload {req_name}")
            doc_resp = None

        items.append(MatchedRequirementItem(
            requirement_id=idx,
            required_name=req_name,
            document_type=req_type,
            category=category,
            is_mandatory=is_mandatory,
            status=status,
            matched_document=doc_resp,
            reason=reason
        ))

    readiness_percentage = round((total_valid / total_required) * 100, 1) if total_required > 0 else 100.0
    is_ready = (total_missing == 0 and total_valid == total_required)

    if is_ready:
        explanation = f"100% Ready! All {total_required} statutory documents required for {step_name} are verified in your Vault."
    else:
        pending_desc = ", ".join(action_items[:2])
        if len(action_items) > 2:
            pending_desc += f" and {len(action_items) - 2} more"
        explanation = f"You are {int(readiness_percentage)}% ready for {step_name}. Complete {len(action_items)} action item(s): {pending_desc}."

    return StepReadinessResponse(
        step_code=step_code,
        step_name=step_name,
        total_required=total_required,
        total_matched=total_matched,
        total_valid=total_valid,
        total_expiring=total_expiring,
        total_missing=total_missing,
        readiness_percentage=readiness_percentage,
        is_ready_for_submission=is_ready,
        action_items=action_items,
        explanation=explanation,
        requirements_status=items
    )
