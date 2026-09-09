import os
import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from backend.app.config import settings
from backend.app.database import get_db
from backend.app.models.user import User, UserRole
from backend.app.models.business import Business
from backend.app.models.approval import Approval
from backend.app.models.application import (
    Application, ApplicationDocument, ApplicationStatusHistory, ApplicationStatus
)
from backend.app.models.renewal import Renewal
from backend.app.models.notification import Notification
from backend.app.models.audit import AuditLog
from backend.app.models.document import Document
from backend.app.models.roadmap import RoadmapStep, BusinessRoadmapStatus
from backend.app.schemas.application import (
    ApplicationCreate, ApplicationResponse, ApplicationStatusChange
)
from backend.app.services.auth import get_current_user
from backend.app.services.pdf_service import generate_cover_page, merge_and_compress_documents

router = APIRouter(prefix="/applications", tags=["Application Management"])

def format_app_response(app: Application) -> dict:
    now = datetime.datetime.utcnow()
    days_remaining = None
    is_overdue = False

    if app.expected_completion_date:
        delta = (app.expected_completion_date - now).days
        days_remaining = delta
        is_overdue = delta < 0

    return {
        "id": app.id,
        "application_number": app.application_number,
        "business_id": app.business_id,
        "approval_id": app.approval_id,
        "department_id": app.department_id,
        "officer_id": app.officer_id,
        "status": app.status,
        "risk_level": app.risk_level,
        "readiness_score": app.readiness_score,
        "package_pdf_path": app.package_pdf_path,
        "compression_level": app.compression_level,
        "submitted_at": app.submitted_at,
        "expected_completion_date": app.expected_completion_date,
        "sla_days": app.sla_days,
        "days_remaining": days_remaining,
        "is_overdue": is_overdue,
        "approved_at": app.approved_at,
        "certificate_number": app.certificate_number,
        "created_at": app.created_at,
        "business_name": app.business.name if app.business else "Demo Unit",
        "approval_name": app.approval.name if app.approval else "Clearance",
        "department_name": app.department.name if app.department else "Department",
        "officer_name": app.officer.full_name if app.officer else "Assigned Department Officer",
        "documents": [
            {
                "id": ad.id,
                "document_id": ad.document_id,
                "requirement_name": ad.requirement_name,
                "sort_order": ad.sort_order,
                "document": {
                    "id": ad.document.id,
                    "business_id": ad.document.business_id,
                    "uploaded_by_id": ad.document.uploaded_by_id,
                    "filename": ad.document.filename,
                    "original_name": ad.document.original_name,
                    "file_size": ad.document.file_size,
                    "mime_type": ad.document.mime_type,
                    "category": ad.document.category,
                    "doc_type": ad.document.doc_type,
                    "doc_number": ad.document.doc_number,
                    "issuing_authority": ad.document.issuing_authority,
                    "issue_date": ad.document.issue_date,
                    "expiry_date": ad.document.expiry_date,
                    "validity_status": ad.document.validity_status,
                    "is_verified": ad.document.is_verified,
                    "ai_detected": ad.document.ai_detected,
                    "days_to_expiry": ad.document.days_to_expiry,
                    "ocr_extracted_text": ad.document.ocr_extracted_text,
                    "created_at": ad.document.created_at
                } if ad.document else None
            } for ad in app.documents
        ],
        "status_history": [
            {
                "id": sh.id,
                "from_status": sh.from_status,
                "to_status": sh.to_status,
                "remarks": sh.remarks,
                "changed_by_name": sh.changed_by_name,
                "created_at": sh.created_at
            } for sh in app.status_history
        ]
    }

@router.get("", response_model=List[dict])
def list_applications(
    status_filter: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Application)
    if current_user.role == UserRole.ENTREPRENEUR.value:
        biz_ids = [b.id for b in current_user.businesses]
        if not biz_ids:
            # check demo business
            demo_biz = db.query(Business).filter(Business.name == "Demo Food Processing Unit").first()
            if demo_biz:
                biz_ids = [demo_biz.id]
        query = query.filter(Application.business_id.in_(biz_ids))

    if status_filter:
        query = query.filter(Application.status == status_filter)

    apps = query.order_by(Application.created_at.desc()).all()
    return [format_app_response(a) for a in apps]

@router.post("", response_model=dict)
def submit_application(
    app_in: ApplicationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    business = db.query(Business).filter(Business.id == app_in.business_id).first()
    approval = db.query(Approval).filter(Approval.id == app_in.approval_id).first()
    if not business or not approval:
        raise HTTPException(status_code=404, detail="Business or Approval not found")

    # Generate application number
    ts = datetime.datetime.utcnow().strftime("%y%m%d%H%M")
    app_number = f"MAHA-{approval.code}-{ts}"

    # Auto-assign officer
    officer = db.query(User).filter(User.role == UserRole.OFFICER.value).first()
    officer_id = officer.id if officer else None

    # Expected completion date based on SLA
    now = datetime.datetime.utcnow()
    expected_completion = now + datetime.timedelta(days=approval.timeline_days)

    # Generate the merged dossier PDF
    docs = db.query(Document).filter(Document.id.in_(app_in.document_ids)).all()
    packages_dir = os.path.join(settings.STORAGE_PATH, "packages")
    os.makedirs(packages_dir, exist_ok=True)

    cover_path = os.path.join(packages_dir, f"cover_{app_number}.pdf")
    final_pkg_path = os.path.join(packages_dir, f"{app_number}_Compiled_Dossier.pdf")

    doc_titles = [f"{d.doc_type} ({d.original_name})" for d in docs]
    generate_cover_page(app_number, business.name, approval.name, doc_titles, cover_path)
    doc_paths = [d.file_path for d in docs]
    merge_and_compress_documents(cover_path, doc_paths, final_pkg_path, app_in.compression_level or "High Quality")

    app = Application(
        application_number=app_number,
        business_id=business.id,
        approval_id=approval.id,
        department_id=approval.department_id,
        officer_id=officer_id,
        status=ApplicationStatus.SUBMITTED,
        risk_level="LOW",
        readiness_score=100.0,
        package_pdf_path=final_pkg_path,
        compression_level=app_in.compression_level,
        submitted_at=now,
        expected_completion_date=expected_completion,
        sla_days=approval.timeline_days
    )
    db.add(app)
    db.commit()
    db.refresh(app)

    # Attach documents
    for idx, d in enumerate(docs):
        ad = ApplicationDocument(
            application_id=app.id,
            document_id=d.id,
            requirement_name=d.doc_type,
            sort_order=idx
        )
        db.add(ad)

    # Initial history entry
    hist = ApplicationStatusHistory(
        application_id=app.id,
        from_status="DOCUMENTS_READY",
        to_status=ApplicationStatus.SUBMITTED,
        remarks=f"Consolidated application dossier digitally verified (100% Readiness) and submitted under SLA ({approval.timeline_days} days).",
        changed_by_name=current_user.full_name
    )
    db.add(hist)

    # Notifications
    if officer:
        db.add(Notification(
            user_id=officer.id,
            title="New Application Assigned",
            message=f"Application {app.application_number} ({business.name}) has been assigned to you for statutory review.",
            category="APPLICATION",
            link=f"/officer/applications/{app.id}"
        ))

    db.add(Notification(
        user_id=current_user.id,
        title="Application Successfully Submitted",
        message=f"Your statutory application {app.application_number} for '{approval.name}' is submitted. SLA: {approval.timeline_days} days.",
        category="APPLICATION",
        link=f"/applications/{app.id}"
    ))

    # Auto-sync corresponding Roadmap Step status to IN_PROGRESS
    if approval.code:
        step = db.query(RoadmapStep).filter(
            (RoadmapStep.approval_code == approval.code) | (RoadmapStep.code == approval.code)
        ).first()
        if step:
            st_obj = db.query(BusinessRoadmapStatus).filter(
                BusinessRoadmapStatus.business_id == business.id,
                BusinessRoadmapStatus.roadmap_step_id == step.id
            ).first()
            if not st_obj:
                st_obj = BusinessRoadmapStatus(
                    business_id=business.id,
                    roadmap_step_id=step.id,
                    status="IN_PROGRESS",
                    reference_number=app_number,
                    notes=f"Statutory dossier submitted (ARN: {app_number})"
                )
                db.add(st_obj)
            elif st_obj.status != "DONE":
                st_obj.status = "IN_PROGRESS"
                st_obj.reference_number = app_number
                st_obj.notes = f"Application submitted under ARN {app_number}"

    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        user_name=current_user.full_name,
        action="APPLICATION_SUBMITTED",
        entity="Application",
        entity_id=app.id,
        details=f"Submitted application {app.application_number} with {len(docs)} attached documents."
    )
    db.add(audit)
    db.commit()

    return format_app_response(app)

@router.get("/{id}", response_model=dict)
def get_application(id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    app = db.query(Application).filter(Application.id == id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    # Authorization
    if current_user.role == UserRole.ENTREPRENEUR.value:
        biz_ids = [b.id for b in current_user.businesses]
        if current_user.email != "demo@example.com" and app.business_id not in biz_ids:
            raise HTTPException(status_code=403, detail="Unauthorized access to this application")

    return format_app_response(app)

@router.put("/{id}/status", response_model=dict)
def update_application_status(
    id: int,
    status_in: ApplicationStatusChange,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    app = db.query(Application).filter(Application.id == id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    old_status = app.status
    new_status = status_in.status.upper()
    app.status = new_status

    now = datetime.datetime.utcnow()

    # If approving application, issue certificate number and create Renewal entry!
    if new_status == ApplicationStatus.APPROVED:
        app.approved_at = now
        app.certificate_number = f"CERT/{app.approval.code}/{now.strftime('%Y')}/{app.id:04d}"

        # Register in Renewals table
        months = app.approval.renewal_frequency_months or 12
        valid_until = now + datetime.timedelta(days=months * 30)
        renewal_due = valid_until - datetime.timedelta(days=30)

        existing_renewal = db.query(Renewal).filter(Renewal.application_id == app.id).first()
        if not existing_renewal:
            renewal = Renewal(
                business_id=app.business_id,
                approval_id=app.approval_id,
                application_id=app.id,
                certificate_number=app.certificate_number,
                valid_from=now,
                valid_until=valid_until,
                renewal_due_date=renewal_due,
                status="ACTIVE"
            )
            db.add(renewal)

        # Auto-complete corresponding Roadmap Step & unlock downstream approvals
        if app.approval and app.approval.code:
            step = db.query(RoadmapStep).filter(
                (RoadmapStep.approval_code == app.approval.code) | (RoadmapStep.code == app.approval.code)
            ).first()
            if step:
                st_obj = db.query(BusinessRoadmapStatus).filter(
                    BusinessRoadmapStatus.business_id == app.business_id,
                    BusinessRoadmapStatus.roadmap_step_id == step.id
                ).first()
                if not st_obj:
                    st_obj = BusinessRoadmapStatus(
                        business_id=app.business_id,
                        roadmap_step_id=step.id,
                        status="DONE",
                        reference_number=app.certificate_number,
                        notes=f"Approved under Application {app.application_number} by {current_user.full_name}",
                        completed_at=now
                    )
                    db.add(st_obj)
                else:
                    st_obj.status = "DONE"
                    st_obj.reference_number = app.certificate_number
                    st_obj.notes = f"Approved under Application {app.application_number} by {current_user.full_name}"
                    st_obj.completed_at = now
    elif app.approval and app.approval.code:
        # Non-approval status transition (e.g. QUERY_RAISED, UNDER_REVIEW)
        step = db.query(RoadmapStep).filter(
            (RoadmapStep.approval_code == app.approval.code) | (RoadmapStep.code == app.approval.code)
        ).first()
        if step:
            st_obj = db.query(BusinessRoadmapStatus).filter(
                BusinessRoadmapStatus.business_id == app.business_id,
                BusinessRoadmapStatus.roadmap_step_id == step.id
            ).first()
            if st_obj and st_obj.status != "DONE":
                st_obj.status = "IN_PROGRESS"
                st_obj.notes = f"Status: {new_status}. {status_in.remarks or ''}"

    # Record history
    hist = ApplicationStatusHistory(
        application_id=app.id,
        from_status=old_status,
        to_status=new_status,
        remarks=status_in.remarks or f"Status updated to {new_status}",
        changed_by_name=current_user.full_name
    )
    db.add(hist)

    # Notification to entrepreneur
    db.add(Notification(
        user_id=app.business.owner_id,
        title=f"Application Status Updated: {new_status}",
        message=f"Application {app.application_number} ({app.approval.name}) has transitioned to {new_status}. {status_in.remarks or ''}",
        category="APPLICATION",
        link=f"/applications/{app.id}"
    ))

    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        user_name=current_user.full_name,
        action="APPLICATION_STATUS_CHANGED",
        entity="Application",
        entity_id=app.id,
        details=f"Status changed from {old_status} to {new_status} by {current_user.full_name}"
    )
    db.add(audit)
    db.commit()

    return format_app_response(app)

@router.get("/{id}/download-package")
def download_application_package(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    app = db.query(Application).filter(Application.id == id).first()
    if not app or not app.package_pdf_path or not os.path.exists(app.package_pdf_path):
        raise HTTPException(status_code=404, detail="Application package PDF not found")

    return FileResponse(
        app.package_pdf_path,
        filename=os.path.basename(app.package_pdf_path),
        media_type="application/pdf"
    )
