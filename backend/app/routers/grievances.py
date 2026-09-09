from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import random

from backend.app.database import get_db
from backend.app.models.user import User, UserRole
from backend.app.models.business import Business
from backend.app.models.grievance import Grievance
from backend.app.models.audit import AuditLog
from backend.app.services.auth import get_current_user

router = APIRouter(prefix="/grievances", tags=["Grievances"])

class GrievanceCreate(BaseModel):
    subject: str
    category: str
    priority: Optional[str] = "MEDIUM"
    description: str
    business_id: Optional[int] = None

class GrievanceUpdate(BaseModel):
    status: Optional[str] = None
    resolution_notes: Optional[str] = None
    officer_assigned: Optional[str] = None

@router.get("")
def get_grievances(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role in [UserRole.ADMIN.value, UserRole.OFFICER.value]:
        grievances = db.query(Grievance).order_by(Grievance.created_at.desc()).all()
    else:
        grievances = db.query(Grievance).filter(Grievance.user_id == current_user.id).order_by(Grievance.created_at.desc()).all()
        # If user has none, also include sample demo grievances for the demo business
        if not grievances:
            grievances = db.query(Grievance).order_by(Grievance.created_at.desc()).all()

    return [{
        "id": g.id,
        "ticket_number": g.ticket_number,
        "user_id": g.user_id,
        "business_name": g.business.name if g.business else "Demo Food Processing Unit",
        "subject": g.subject,
        "category": g.category,
        "priority": g.priority,
        "status": g.status,
        "description": g.description,
        "resolution_notes": g.resolution_notes,
        "officer_assigned": g.officer_assigned,
        "created_at": g.created_at.isoformat() if g.created_at else None,
        "updated_at": g.updated_at.isoformat() if g.updated_at else None
    } for g in grievances]

@router.post("")
def create_grievance(payload: GrievanceCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ticket_num = f"GRV-{datetime.utcnow().year}-{random.randint(1000, 9999)}"
    
    # Associate business if not provided
    biz_id = payload.business_id
    if not biz_id:
        b = db.query(Business).filter(Business.owner_id == current_user.id).first()
        if not b:
            b = db.query(Business).first()
        if b:
            biz_id = b.id

    grievance = Grievance(
        ticket_number=ticket_num,
        user_id=current_user.id,
        business_id=biz_id,
        subject=payload.subject,
        category=payload.category,
        priority=payload.priority or "MEDIUM",
        status="OPEN",
        description=payload.description
    )
    db.add(grievance)
    db.commit()
    db.refresh(grievance)

    audit = AuditLog(
        user_id=current_user.id,
        user_name=current_user.full_name,
        action="GRIEVANCE_FILED",
        entity="Grievance",
        entity_id=grievance.id,
        details=f"Filed grievance '{grievance.ticket_number}' ({grievance.category})"
    )
    db.add(audit)
    db.commit()

    return {
        "id": grievance.id,
        "ticket_number": grievance.ticket_number,
        "status": grievance.status,
        "message": "Grievance registered successfully. Regulatory desk will respond within 48 hours."
    }

@router.put("/{id}")
def update_grievance(id: int, payload: GrievanceUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    grievance = db.query(Grievance).filter(Grievance.id == id).first()
    if not grievance:
        raise HTTPException(status_code=404, detail="Grievance ticket not found")

    if payload.status:
        grievance.status = payload.status
    if payload.resolution_notes:
        grievance.resolution_notes = payload.resolution_notes
    if payload.officer_assigned:
        grievance.officer_assigned = payload.officer_assigned

    grievance.updated_at = datetime.utcnow()
    db.commit()

    return {"message": "Grievance ticket updated successfully."}
