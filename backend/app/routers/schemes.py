from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from backend.app.database import get_db
from backend.app.models.user import User
from backend.app.models.business import Business
from backend.app.models.scheme import GovernmentScheme
from backend.app.schemas.scheme import SchemeResponse, SchemeRecommendationResponse
from backend.app.services.auth import get_current_user

router = APIRouter(prefix="/schemes", tags=["Government Scheme Recommendations"])

@router.get("", response_model=List[SchemeResponse])
def list_schemes(db: Session = Depends(get_db)):
    return db.query(GovernmentScheme).all()

@router.get("/recommendations", response_model=List[SchemeRecommendationResponse])
def get_recommendations(
    business_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if business_id:
        biz = db.query(Business).filter(Business.id == business_id).first()
    else:
        biz = db.query(Business).filter(Business.owner_id == current_user.id).first()
        if not biz:
            biz = db.query(Business).first()

    all_schemes = db.query(GovernmentScheme).all()
    recommendations = []

    for s in all_schemes:
        reasons = []
        score = 60 # Base score for registered MSME

        # Sector match
        if s.sector.lower() in (biz.sector.lower() if biz else "food processing") or s.sector.lower() == "manufacturing":
            reasons.append(f"Direct match for sector '{biz.sector if biz else 'Food Processing'}'")
            score += 20

        # Investment range match
        inv = biz.investment if biz else 5000000.0
        if s.min_investment <= inv <= s.max_investment:
            reasons.append(f"Capital investment ₹{inv:,.0f} falls within eligible window (₹{s.min_investment:,.0f} - ₹{s.max_investment:,.0f})")
            score += 15

        # Stage match
        stage = biz.business_stage if biz else "PLANNING"
        if stage in s.target_stage:
            reasons.append(f"Eligible for enterprise stage '{stage}'")
            score += 5

        docs_list = [d.strip() for d in s.required_documents.split(",") if d.strip()] if s.required_documents else []

        recommendations.append(SchemeRecommendationResponse(
            scheme=SchemeResponse.from_orm(s),
            match_score=min(score, 98),
            match_reasons=reasons,
            potential_benefit=f"{s.subsidy_percentage} (Max: {s.max_subsidy_amount})",
            required_documents_list=docs_list
        ))

    # Sort by highest match score
    recommendations.sort(key=lambda x: x.match_score, reverse=True)
    return recommendations
