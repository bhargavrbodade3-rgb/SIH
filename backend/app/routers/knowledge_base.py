from fastapi import APIRouter, Depends, Query
from typing import List, Optional
from backend.app.models.user import User
from backend.app.services.auth import get_current_user

router = APIRouter(prefix="/knowledge-base", tags=["Knowledge Base"])

REGULATORY_ARTICLES = [
    {
        "id": 1,
        "title": "Maharashtra Factories Rules, 1963 — Rule 3 Approval of Plans",
        "category": "Industrial Safety & DISH",
        "department": "Directorate of Industrial Safety & Health (DISH)",
        "summary": "Mandates submission of factory layout plans, elevation, machinery layout and structural stability certificates before commencing plant construction.",
        "key_documents": ["Factory Layout Plan in PDF (scale 1:100)", "Structural Stability Certificate from chartered engineer", "Brief Manufacturing Process Flowchart"],
        "timeline_days": 30,
        "fees_info": "Scale-based fee according to total installed electric horse power (HP) and max workers employed.",
        "updated_at": "2025-11-15"
    },
    {
        "id": 2,
        "title": "Consent to Establish (CTE) under Water & Air Acts",
        "category": "Pollution Control",
        "department": "Maharashtra Pollution Control Board (MPCB)",
        "summary": "Required prior to setting up industrial machinery. Orange category units must implement primary and secondary effluent treatment systems or connect to CETP.",
        "key_documents": ["Environmental Management Plan (EMP)", "Water & Material Balance Chart", "Site Topographical Map & D.I.C. Registration"],
        "timeline_days": 45,
        "fees_info": "Calculated based on capital investment (Land + Building + Plant & Machinery).",
        "updated_at": "2025-12-01"
    },
    {
        "id": 3,
        "title": "FSSAI State Manufacturing License — Food Safety & Standards Act 2006",
        "category": "Food Safety",
        "department": "Food Safety & Standards Authority of India (FSSAI)",
        "summary": "Mandatory for food processing facilities with turnover between 12 Lakhs and 20 Crores or processing capacity up to 2 MT/day.",
        "key_documents": ["FSMS Plan / ISO 22000 Certificate", "Water Potability Test Report from NABL lab", "List of Food Product Categories & Production Capacity"],
        "timeline_days": 60,
        "fees_info": "Rs. 3,000 to Rs. 5,000 per year depending on production capacity.",
        "updated_at": "2026-01-10"
    },
    {
        "id": 4,
        "title": "Fire Department Provisional NOC & Safety Clearances",
        "category": "Fire Safety",
        "department": "Directorate of Maharashtra Fire Services",
        "summary": "Comprehensive fire protection infrastructure verification including hydrants, smoke detectors, emergency exits, and water storage capacity.",
        "key_documents": ["Fire Safety & Evacuation Plan", "Architectural Elevation Plan with Road Access", "Underground/Overhead Tank Capacity Certificate"],
        "timeline_days": 21,
        "fees_info": "Fixed nominal inspection scrutiny fee + cess per sq meter of built-up area.",
        "updated_at": "2025-10-20"
    },
    {
        "id": 5,
        "title": "MIDC Trade & Drainage License Regulations",
        "category": "Industrial Development",
        "department": "Maharashtra Industrial Development Corporation (MIDC)",
        "summary": "Governs permission to conduct industrial trade and discharge treated industrial effluent into MIDC common conveyance network.",
        "key_documents": ["MIDC Plot Possession Receipt", "Sanctioned Water Connection Allotment Letter", "MPCB Consent Copy"],
        "timeline_days": 15,
        "fees_info": "Annual drainage maintenance charges as per plot area.",
        "updated_at": "2026-02-05"
    }
]

@router.get("")
def get_knowledge_base_articles(
    search: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user)
):
    results = REGULATORY_ARTICLES
    if category and category != "ALL":
        results = [a for a in results if a["category"].lower() == category.lower()]
    if search:
        s = search.lower()
        results = [
            a for a in results
            if s in a["title"].lower() or s in a["summary"].lower() or s in a["department"].lower()
        ]
    return results
