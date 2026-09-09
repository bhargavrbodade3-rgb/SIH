import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from backend.app.database import get_db
from backend.app.models.user import User, UserRole
from backend.app.models.application import Application, ApplicationStatusHistory, ApplicationStatus
from backend.app.models.query import Query
from backend.app.models.notification import Notification
from backend.app.models.audit import AuditLog
from backend.app.schemas.query import QueryCreate, QueryRespondRequest, QueryResponse
from backend.app.services.auth import get_current_user, require_officer

router = APIRouter(prefix="/queries", tags=["Query Management"])

def format_query(q: Query) -> dict:
    return {
        "id": q.id,
        "application_id": q.application_id,
        "officer_id": q.officer_id,
        "title": q.title,
        "description": q.description,
        "priority": q.priority,
        "deadline": q.deadline,
        "status": q.status,
        "response_text": q.response_text,
        "response_document_id": q.response_document_id,
        "responded_at": q.responded_at,
        "resolved_at": q.resolved_at,
        "created_at": q.created_at,
        "officer_name": q.officer.full_name if q.officer else "Inspecting Officer",
        "application_number": q.application.application_number if q.application else "",
        "business_name": q.application.business.name if q.application and q.application.business else "",
        "response_document": {
            "id": q.response_document.id,
            "filename": q.response_document.filename,
            "original_name": q.response_document.original_name,
            "doc_type": q.response_document.doc_type,
            "category": q.response_document.category,
            "validity_status": q.response_document.validity_status
        } if q.response_document else None
    }

@router.get("", response_model=List[dict])
def list_queries(
    application_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Query)
    if application_id:
        query = query.filter(Query.application_id == application_id)

    if current_user.role == UserRole.ENTREPRENEUR.value:
        biz_ids = [b.id for b in current_user.businesses]
        query = query.join(Application).filter(Application.business_id.in_(biz_ids))

    queries = query.order_by(Query.created_at.desc()).all()
    return [format_query(q) for q in queries]

@router.post("", response_model=dict)
def raise_query(
    query_in: QueryCreate,
    current_user: User = Depends(require_officer),
    db: Session = Depends(get_db)
):
    app = db.query(Application).filter(Application.id == query_in.application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    q = Query(
        application_id=app.id,
        officer_id=current_user.id,
        title=query_in.title,
        description=query_in.description,
        priority=query_in.priority or "HIGH",
        deadline=query_in.deadline or (datetime.datetime.utcnow() + datetime.timedelta(days=7)).strftime("%Y-%m-%d"),
        status="OPEN"
    )
    db.add(q)

    # Change application status to QUERY RAISED
    old_status = app.status
    app.status = ApplicationStatus.QUERY_RAISED

    hist = ApplicationStatusHistory(
        application_id=app.id,
        from_status=old_status,
        to_status=ApplicationStatus.QUERY_RAISED,
        remarks=f"Statutory clarification requested: '{q.title}'. Deadline: {q.deadline}",
        changed_by_name=current_user.full_name
    )
    db.add(hist)

    # Urgent notification to entrepreneur
    db.add(Notification(
        user_id=app.business.owner_id,
        title=f"ACTION REQUIRED: Query Raised on {app.application_number}",
        message=f"Department officer has raised a clarification request: '{q.title}'. Response required before {q.deadline}.",
        category="QUERY",
        link=f"/applications/{app.id}"
    ))

    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        user_name=current_user.full_name,
        action="QUERY_RAISED",
        entity="Query",
        entity_id=app.id,
        details=f"Raised query '{q.title}' on Application {app.application_number}"
    )
    db.add(audit)
    db.commit()
    db.refresh(q)

    return format_query(q)

@router.post("/{id}/respond", response_model=dict)
def respond_to_query(
    id: int,
    resp_in: QueryRespondRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    q = db.query(Query).filter(Query.id == id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Query not found")

    now = datetime.datetime.utcnow()
    q.response_text = resp_in.response_text
    q.response_document_id = resp_in.response_document_id
    q.responded_at = now
    q.status = "RESPONDED"

    # Advance application back to UNDER REVIEW
    app = q.application
    old_status = app.status
    app.status = ApplicationStatus.UNDER_REVIEW

    hist = ApplicationStatusHistory(
        application_id=app.id,
        from_status=old_status,
        to_status=ApplicationStatus.UNDER_REVIEW,
        remarks=f"Entrepreneur submitted formal response to query '{q.title}'. Dossier under department re-evaluation.",
        changed_by_name=current_user.full_name
    )
    db.add(hist)

    # Notify officer
    db.add(Notification(
        user_id=q.officer_id,
        title=f"Query Responded: {app.application_number}",
        message=f"Entrepreneur has submitted their response to '{q.title}'. Ready for officer review.",
        category="QUERY",
        link=f"/officer/applications/{app.id}"
    ))

    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        user_name=current_user.full_name,
        action="QUERY_RESPONDED",
        entity="Query",
        entity_id=q.id,
        details=f"Responded to query '{q.title}' for Application {app.application_number}"
    )
    db.add(audit)
    db.commit()
    db.refresh(q)

    return format_query(q)

@router.put("/{id}/resolve", response_model=dict)
def resolve_query(
    id: int,
    current_user: User = Depends(require_officer),
    db: Session = Depends(get_db)
):
    q = db.query(Query).filter(Query.id == id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Query not found")

    q.status = "RESOLVED"
    q.resolved_at = datetime.datetime.utcnow()
    db.commit()
    return format_query(q)
