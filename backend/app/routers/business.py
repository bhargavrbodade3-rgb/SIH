from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from backend.app.database import get_db
from backend.app.models.user import User, UserRole
from backend.app.models.business import Business
from backend.app.models.audit import AuditLog
from backend.app.schemas.business import BusinessCreate, BusinessUpdate, BusinessResponse
from backend.app.services.auth import get_current_user

router = APIRouter(prefix="/business", tags=["Business"])

def calculate_completion(b: Business) -> int:
    # Core entity fields
    core_fields = [
        b.name, b.business_type, b.sector, b.description,
        b.applicant_name, b.phone, b.state, b.district,
        b.city, b.address, b.pincode
    ]
    core_filled = sum(1 for f in core_fields if f is not None and str(f).strip() != "")
    core_score = (core_filled / len(core_fields)) * 60

    # Project parameters & premises
    param_fields = [
        (b.investment or 0) > 0,
        (b.employees or 0) > 0,
        bool(b.business_stage),
        bool(b.premises_type or b.land_property)
    ]
    param_score = (sum(1 for p in param_fields if p) / len(param_fields)) * 25

    # Sector-specific parameters
    sector = (b.sector or "").lower()
    sector_filled = 0
    sector_total = 2

    if "food" in sector:
        if b.food_handling: sector_filled += 1
        if b.water_usage_lpd and str(b.water_usage_lpd).strip(): sector_filled += 1
    elif "manufactur" in sector:
        if b.manufacturing_activity: sector_filled += 1
        if b.electricity_load_kw and str(b.electricity_load_kw).strip(): sector_filled += 1
    elif "it" in sector or "software" in sector:
        if b.business_activity and str(b.business_activity).strip(): sector_filled += 1
        if b.premises_type and str(b.premises_type).strip(): sector_filled += 1
    else:
        if b.business_activity and str(b.business_activity).strip(): sector_filled += 1
        if b.land_property and str(b.land_property).strip(): sector_filled += 1

    sector_score = (sector_filled / sector_total) * 15

    total = int(round(core_score + param_score + sector_score))
    return min(100, max(0, total))

@router.get("", response_model=List[BusinessResponse])
def get_businesses(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role in [UserRole.OFFICER.value, UserRole.ADMIN.value]:
        return db.query(Business).all()
    return db.query(Business).filter(Business.owner_id == current_user.id).all()

@router.get("/primary", response_model=Optional[BusinessResponse])
def get_primary_business(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Returns the primary active business for the logged-in entrepreneur or the default demo business."""
    if current_user.role in [UserRole.OFFICER.value, UserRole.ADMIN.value]:
        # Return first business in system for preview context
        b = db.query(Business).first()
        return b
    b = db.query(Business).filter(Business.owner_id == current_user.id).first()
    if not b:
        # Fallback to demo business if owner has none yet
        b = db.query(Business).filter(Business.name == "Demo Food Processing Unit").first()
    return b

@router.post("", response_model=BusinessResponse)
def create_business(b_in: BusinessCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    business = Business(
        owner_id=current_user.id,
        **b_in.dict()
    )
    business.profile_completion = calculate_completion(business)
    db.add(business)
    db.commit()
    db.refresh(business)

    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        user_name=current_user.full_name,
        action="BUSINESS_CREATED",
        entity="Business",
        entity_id=business.id,
        details=f"Created business '{business.name}' ({business.sector})"
    )
    db.add(audit)
    db.commit()

    return business

@router.get("/{id}", response_model=BusinessResponse)
def get_business(id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    business = db.query(Business).filter(Business.id == id).first()
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")

    # Authorization check
    if current_user.role == UserRole.ENTREPRENEUR.value and business.owner_id != current_user.id:
        # Allow demo access if demo mode
        if business.name != "Demo Food Processing Unit":
            raise HTTPException(status_code=403, detail="Unauthorized access to another business's profile.")

    return business

@router.put("/{id}", response_model=BusinessResponse)
def update_business(id: int, b_update: BusinessUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    business = db.query(Business).filter(Business.id == id).first()
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")

    if current_user.role == UserRole.ENTREPRENEUR.value and business.owner_id != current_user.id and current_user.email != "demo@example.com":
        raise HTTPException(status_code=403, detail="Unauthorized to modify this business.")

    update_data = b_update.dict(exclude_unset=True)
    for field, val in update_data.items():
        setattr(business, field, val)

    business.profile_completion = calculate_completion(business)
    db.commit()
    db.refresh(business)

    audit = AuditLog(
        user_id=current_user.id,
        user_name=current_user.full_name,
        action="BUSINESS_UPDATED",
        entity="Business",
        entity_id=business.id,
        details=f"Updated profile for '{business.name}'"
    )
    db.add(audit)
    db.commit()

    return business
