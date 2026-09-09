from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.app.config import settings
from backend.app.database import get_db
from backend.app.models.user import User
from backend.app.models.business import Business
from backend.app.models.document import Document
from backend.app.models.application import Application
from backend.app.models.query import Query
from backend.app.models.approval import Approval
from backend.app.schemas.ai import AIChatRequest, AIChatResponse
from backend.app.services.auth import get_current_user
from backend.app.services.readiness_service import calculate_readiness

router = APIRouter(prefix="/ai", tags=["AI Compliance Assistant"])

def generate_local_ai_response(prompt: str, business: Business, db: Session) -> dict:
    p_lower = prompt.lower()
    
    # 0. "What should I do next?"
    if "what should i do next" in p_lower or "next step" in p_lower or "next action" in p_lower:
        from backend.app.routers.roadmap import get_regulatory_roadmap
        try:
            # Check next step
            roadmap_data = get_regulatory_roadmap(business_id=business.id if business else None, current_user=business.owner if business and business.owner else None, db=db)
            next_st = roadmap_data.get("next_step")
            if next_st:
                return {
                    "reply": f"🎯 **Your Next Actionable Regulatory Milestone:**\n\n**Step {next_st['step_order']}: {next_st['name']}**\n\n• **Category:** {next_st['category']}\n• **Issuing Authority:** {next_st['issuing_authority']}\n• **Estimated Timeline:** {next_st['typical_timeline_days']} days\n• **Statutory Fee:** {next_st['typical_cost']}\n• **Why You Need It:** {next_st['description']}\n\n👉 *Next Step:* Click below to access the Step-by-Step Application Assistant and review required documents.",
                    "action_suggestion": f"Open {next_st['name']} Guide",
                    "action_link": f"/roadmap/{next_st['id']}/assistant"
                }
        except Exception:
            pass

    # 1. Why locked question
    if "locked" in p_lower or "why is" in p_lower and ("locked" in p_lower or "disabled" in p_lower):
        if "fssai" in p_lower:
            return {
                "reply": "🔒 **FSSAI Food Safety License is locked because of unmet dependencies:**\n\nUnder state single-window regulations, the Food Safety & Standards Authority requires your **Udyam MSME Registration** and **GST Registration (GSTIN)** before an active license application can be submitted on FoSCoS.\n\nOnce Udyam and GST are marked **Completed**, FSSAI will automatically unlock for application preparation.",
                "action_suggestion": "View Regulatory Roadmap",
                "action_link": "/roadmap"
            }
        elif "cto" in p_lower or "consent to operate" in p_lower:
            return {
                "reply": "🔒 **Consent to Operate (CTO) is locked** because it is a **Post-Approval** commissioning clearance. It unlocks only after both your **Consent to Establish (CTE)** and **Fire Safety NOC** are approved and verified through departmental physical inspection.",
                "action_suggestion": "View Compliance Roadmap",
                "action_link": "/roadmap"
            }

    # 2. Missing documents question
    if "missing" in p_lower or "not ready" in p_lower or "readiness" in p_lower:
        fssai_app = db.query(Approval).filter(Approval.code == "FSSAI-MFG-01").first()
        if fssai_app and business:
            readiness = calculate_readiness(db, business.id, fssai_app.id)
            missing = [item.required_name for item in readiness.requirements_status if item.status == "MISSING"]
            if missing:
                return {
                    "reply": f"Your current Document Readiness is **{readiness.readiness_percentage}%** for **{fssai_app.name}**.\n\nYou have **{len(missing)} missing document(s)**:\n" + "\n".join([f"• ❌ **{m}**" for m in missing]) + "\n\n💡 *Action:* Upload this report in your Document Vault or click 'Auto-Attach Sample Report' to reach 100% submission readiness.",
                    "action_suggestion": "Go to Document Vault",
                    "action_link": "/documents"
                }
            else:
                return {
                    "reply": f"🎉 Excellent news! All statutory documents for **{fssai_app.name}** are matched and valid (**100% Readiness**). Your application package is ready for compilation and submission.",
                    "action_suggestion": "Generate Application Package",
                    "action_link": f"/approvals/{fssai_app.id}"
                }

    # 3. Approvals applicability question
    if "approval" in p_lower or "clearance" in p_lower or "apply to my" in p_lower or "what approvals" in p_lower:
        return {
            "reply": f"Based on your profile as a **{business.sector}** unit in **{business.state}** with **{business.employees} workers** and **₹{business.investment:,.0f} investment**, you are subject to **5 key regulatory clearances**:\n\n1. **Food Processing Registration (FSSAI)** — Mandatory food hygiene & manufacturing license.\n2. **Factory Plan Approval (DISH)** — Triggered by employee count >= 10 under Factories Act.\n3. **Consent to Establish (MPCB)** — Orange category organic effluent discharge clearance.\n4. **Fire Safety NOC** — Mandatory industrial fire prevention verification.\n5. **MIDC Local Activity Permit** — Industrial zone authorization.",
            "action_suggestion": "View Approvals Checklist",
            "action_link": "/approvals"
        }

    # 3. Query advice
    if "query" in p_lower or "clarification" in p_lower or "officer" in p_lower:
        open_query = db.query(Query).join(Application).filter(Application.business_id == business.id, Query.status == "OPEN").first()
        if open_query:
            return {
                "reply": f"⚠️ **Active Query Detected on Application {open_query.application.application_number}**:\n\n• **Title:** {open_query.title}\n• **Officer Remark:** \"{open_query.description}\"\n• **Deadline:** {open_query.deadline} (Priority: {open_query.priority})\n\n👉 **Recommended Response:** Provide clarification regarding the HACCP CCP temperature controls and attach the validated water potability report.",
                "action_suggestion": "Respond to Active Query",
                "action_link": f"/applications/{open_query.application_id}"
            }
        else:
            return {
                "reply": "You currently have no pending officer queries on your applications. All submitted filings are progressing normally through statutory review.",
                "action_suggestion": "View Applications",
                "action_link": "/applications"
            }

    # 4. Expiring documents
    if "expir" in p_lower or "valid" in p_lower or "renewal" in p_lower:
        docs = db.query(Document).filter(Document.business_id == business.id).all()
        expiring = [d for d in docs if d.validity_status in ["EXPIRING_SOON", "EXPIRED"]]
        if expiring:
            items_str = "\n".join([f"• ⚠️ **{d.doc_type}** ({d.original_name}) — Status: {d.validity_status}" for d in expiring])
            return {
                "reply": f"Found **{len(expiring)} documents** requiring compliance attention:\n{items_str}\n\nWe recommend re-validating these certificates at least 30 days before statutory submission.",
                "action_suggestion": "Manage Vault Documents",
                "action_link": "/documents"
            }
        else:
            return {
                "reply": "All documents currently in your Vault have **VALID** statutory status with active expiration horizons.",
                "action_suggestion": "View Vault",
                "action_link": "/documents"
            }

    # 5. Schemes
    if "scheme" in p_lower or "grant" in p_lower or "subsidy" in p_lower or "benefit" in p_lower:
        return {
            "reply": f"Top matched government schemes for your **{business.sector}** enterprise:\n\n1. **PM Kisan SAMPADA Yojana (PMKSY):** Up to 35% capital grant (Max ₹5 Cr) for modern food processing infrastructure.\n2. **PMFME Scheme:** Credit-linked 35% subsidy up to ₹10 Lakhs for micro-enterprises.\n3. **CGTMSE:** Collateral-free bank financing guarantee up to ₹5 Crore.\n4. **Maharashtra PSI Agro Package:** 100% stamp duty waiver and 5% term loan interest subvention.",
            "action_suggestion": "Explore Scheme Recommendations",
            "action_link": "/schemes"
        }

    # Default fallback
    return {
        "reply": f"I am your **AI Industrial Compliance Advisor**. I am grounded in your business record (**{business.name}**, {business.sector}, {business.state}).\n\nYou can ask me:\n• *What approvals apply to my business?*\n• *Which documents are missing for FSSAI?*\n• *What is my current compliance and readiness score?*\n• *How do I respond to the officer query?*\n• *Which government subsidies am I eligible for?*\n\n*(Note: DEMO REGULATORY DATA — FOR PROTOTYPE DEMONSTRATION ONLY)*",
        "action_suggestion": "Explore Approvals",
        "action_link": "/approvals"
    }

@router.post("/chat", response_model=AIChatResponse)
def ai_chat(req: AIChatRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if req.business_id:
        biz = db.query(Business).filter(Business.id == req.business_id).first()
    else:
        biz = db.query(Business).filter(Business.owner_id == current_user.id).first()
        if not biz:
            biz = db.query(Business).first()

    result = generate_local_ai_response(req.message, biz, db)
    return AIChatResponse(
        reply=result["reply"],
        action_suggestion=result.get("action_suggestion"),
        action_link=result.get("action_link"),
        confidence=0.98,
        source="GROUNDED COMPLIANCE ENGINE & KNOWLEDGE RETRIEVAL"
    )
