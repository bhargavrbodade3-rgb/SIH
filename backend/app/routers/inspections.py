import datetime
import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from backend.app.database import get_db
from backend.app.models.user import User, UserRole
from backend.app.models.application import Application, ApplicationStatusHistory, ApplicationStatus
from backend.app.models.inspection import Inspection
from backend.app.models.notification import Notification
from backend.app.models.audit import AuditLog
from backend.app.schemas.inspection import InspectionCreate, InspectionUpdate, InspectionResponse
from backend.app.services.auth import get_current_user, require_officer

router = APIRouter(prefix="/inspections", tags=["Inspection Management"])

def format_inspection(insp: Inspection) -> dict:
    return {
        "id": insp.id,
        "application_id": insp.application_id,
        "officer_id": insp.officer_id,
        "scheduled_date": insp.scheduled_date,
        "scheduled_time": insp.scheduled_time,
        "status": insp.status,
        "result": insp.result,
        "checklist_json": insp.checklist_json,
        "remarks": insp.remarks,
        "completed_at": insp.completed_at,
        "created_at": insp.created_at,
        "officer_name": insp.officer.full_name if insp.officer else "Regulatory Inspecting Officer",
        "application_number": insp.application.application_number if insp.application else "",
        "business_name": insp.application.business.name if insp.application and insp.application.business else "",
        "approval_name": insp.application.approval.name if insp.application and insp.application.approval else ""
    }

@router.get("", response_model=List[dict])
def list_inspections(
    application_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Inspection)
    if application_id:
        query = query.filter(Inspection.application_id == application_id)

    if current_user.role == UserRole.ENTREPRENEUR.value:
        biz_ids = [b.id for b in current_user.businesses]
        query = query.join(Application).filter(Application.business_id.in_(biz_ids))

    inspections = query.order_by(Inspection.created_at.desc()).all()
    return [format_inspection(i) for i in inspections]

@router.post("", response_model=dict)
def schedule_inspection(
    insp_in: InspectionCreate,
    current_user: User = Depends(require_officer),
    db: Session = Depends(get_db)
):
    app = db.query(Application).filter(Application.id == insp_in.application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    checklist = insp_in.checklist_items or [
        "Machinery Layout & Working Spacing Verified",
        "Physical Hygiene & Cold Chain Sanitation Verified",
        "Potable Water Treatment & Storage Tested",
        "Fire Extinguishers & Emergency Exits Operational",
        "Effluent Treatment Neutralization Pit Inspected"
    ]
    checklist_dict = {item: False for item in checklist}

    insp = Inspection(
        application_id=app.id,
        officer_id=current_user.id,
        scheduled_date=insp_in.scheduled_date,
        scheduled_time=insp_in.scheduled_time,
        status="SCHEDULED",
        checklist_json=json.dumps(checklist_dict),
        remarks=insp_in.remarks or "Mandatory statutory pre-commissioning physical premises inspection."
    )
    db.add(insp)

    old_status = app.status
    app.status = ApplicationStatus.INSPECTION_SCHEDULED

    hist = ApplicationStatusHistory(
        application_id=app.id,
        from_status=old_status,
        to_status=ApplicationStatus.INSPECTION_SCHEDULED,
        remarks=f"Physical on-site regulatory inspection scheduled for {insp.scheduled_date} at {insp.scheduled_time}.",
        changed_by_name=current_user.full_name
    )
    db.add(hist)

    db.add(Notification(
        user_id=app.business.owner_id,
        title=f"On-site Inspection Scheduled: {insp.scheduled_date}",
        message=f"Department officer has scheduled an inspection for application {app.application_number} on {insp.scheduled_date} at {insp.scheduled_time}.",
        category="INSPECTION",
        link=f"/applications/{app.id}"
    ))

    audit = AuditLog(
        user_id=current_user.id,
        user_name=current_user.full_name,
        action="INSPECTION_SCHEDULED",
        entity="Inspection",
        entity_id=app.id,
        details=f"Scheduled inspection for {insp.scheduled_date} on Application {app.application_number}"
    )
    db.add(audit)
    db.commit()
    db.refresh(insp)

    return format_inspection(insp)

@router.put("/{id}", response_model=dict)
def update_inspection_result(
    id: int,
    insp_update: InspectionUpdate,
    current_user: User = Depends(require_officer),
    db: Session = Depends(get_db)
):
    insp = db.query(Inspection).filter(Inspection.id == id).first()
    if not insp:
        raise HTTPException(status_code=404, detail="Inspection not found")

    now = datetime.datetime.utcnow()
    if insp_update.status:
        insp.status = insp_update.status
    if insp_update.result:
        insp.result = insp_update.result
    if insp_update.remarks:
        insp.remarks = insp_update.remarks
    if insp_update.checklist_results:
        insp.checklist_json = json.dumps(insp_update.checklist_results)

    if insp_update.status == "COMPLETED" or insp_update.result in ["PASSED", "CONDITIONAL", "FAILED"]:
        insp.status = "COMPLETED"
        insp.completed_at = now

        # Update application status
        app = insp.application
        old_status = app.status
        if insp.result == "PASSED":
            app.status = ApplicationStatus.UNDER_REVIEW # Ready for final sign-off!
            summary = f"Physical premises inspection PASSED with satisfactory compliance score."
        elif insp.result == "CONDITIONAL":
            app.status = ApplicationStatus.UNDER_REVIEW
            summary = f"Physical inspection CONDITIONAL approval granted pending minor rectifications."
        else:
            app.status = ApplicationStatus.REJECTED
            summary = f"Physical premises inspection FAILED: {insp.remarks}"

        hist = ApplicationStatusHistory(
            application_id=app.id,
            from_status=old_status,
            to_status=app.status,
            remarks=summary,
            changed_by_name=current_user.full_name
        )
        db.add(hist)

        db.add(Notification(
            user_id=app.business.owner_id,
            title=f"Inspection Outcome: {insp.result}",
            message=f"Inspection completed for {app.application_number}. Result: {insp.result}. {insp.remarks or ''}",
            category="INSPECTION",
            link=f"/applications/{app.id}"
        ))

    audit = AuditLog(
        user_id=current_user.id,
        user_name=current_user.full_name,
        action="INSPECTION_COMPLETED",
        entity="Inspection",
        entity_id=insp.id,
        details=f"Recorded inspection result '{insp.result}' for Application {insp.application.application_number}"
    )
    db.add(audit)
    db.commit()
    db.refresh(insp)

    return format_inspection(insp)
