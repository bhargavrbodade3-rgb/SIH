from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from backend.app.database import get_db
from backend.app.models.approval import Approval
from backend.app.schemas.approval import ApprovalResponse, DiscoveredApprovalResponse, ApprovalDiscoveryRequest
from backend.app.services.rules_engine import discover_approvals

router = APIRouter(prefix="/approvals", tags=["Approvals Discovery"])

@router.get("", response_model=List[ApprovalResponse])
def list_approvals(db: Session = Depends(get_db)):
    return db.query(Approval).all()

@router.post("/discover", response_model=List[DiscoveredApprovalResponse])
def discover_applicable_approvals(req: ApprovalDiscoveryRequest, db: Session = Depends(get_db)):
    business_data = {
        "sector": req.sector,
        "state": req.state,
        "district": req.district,
        "investment": req.investment,
        "employees": req.employees,
        "business_stage": req.business_stage,
        "business_activity": req.business_activity,
        "business_type": "Manufacturing" if req.sector.lower() in ["food processing", "manufacturing", "chemical", "textile"] else "Services"
    }
    return discover_approvals(db, business_data)

@router.get("/{id}", response_model=ApprovalResponse)
def get_approval_details(id: int, db: Session = Depends(get_db)):
    app = db.query(Approval).filter(Approval.id == id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Approval clearance not found")
    return app
