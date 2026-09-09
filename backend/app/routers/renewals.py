import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from backend.app.database import get_db
from backend.app.models.user import User, UserRole
from backend.app.models.business import Business
from backend.app.models.renewal import Renewal
from backend.app.schemas.renewal import RenewalResponse
from backend.app.services.auth import get_current_user

router = APIRouter(prefix="/renewals", tags=["Renewals Tracker"])

@router.get("", response_model=List[dict])
def list_renewals(
    business_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Renewal)
    if business_id:
        query = query.filter(Renewal.business_id == business_id)
    elif current_user.role == UserRole.ENTREPRENEUR.value:
        biz_ids = [b.id for b in current_user.businesses]
        if not biz_ids:
            demo_biz = db.query(Business).filter(Business.name == "Demo Food Processing Unit").first()
            if demo_biz:
                biz_ids = [demo_biz.id]
        query = query.filter(Renewal.business_id.in_(biz_ids))

    renewals = query.order_by(Renewal.renewal_due_date.asc()).all()
    results = []
    now = datetime.datetime.utcnow()

    for r in renewals:
        delta = (r.renewal_due_date - now).days
        status = r.status
        if delta < 0:
            status = "RENEWAL_DUE"
        elif delta <= 30:
            status = "RENEWAL_UPCOMING"
        else:
            status = "ACTIVE"

        results.append({
            "id": r.id,
            "business_id": r.business_id,
            "approval_id": r.approval_id,
            "application_id": r.application_id,
            "certificate_number": r.certificate_number,
            "valid_from": r.valid_from,
            "valid_until": r.valid_until,
            "renewal_due_date": r.renewal_due_date,
            "status": status,
            "days_to_due": delta,
            "created_at": r.created_at,
            "approval_name": r.approval.name if r.approval else "Statutory Clearance",
            "authority": r.approval.authority if r.approval else "Regulatory Authority",
            "business_name": r.business.name if r.business else "Business Unit"
        })

    return results
