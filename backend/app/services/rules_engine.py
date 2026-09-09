from typing import List, Dict, Any
from sqlalchemy.orm import Session
from backend.app.models.approval import Approval, ApprovalRule
from backend.app.schemas.approval import DiscoveredApprovalResponse, ApprovalResponse

def evaluate_rule(rule: ApprovalRule, business_data: Dict[str, Any]) -> tuple[bool, str]:
    field = rule.condition_field.lower()
    op = rule.operator.lower()
    target_val = str(rule.condition_value).strip().lower()
    
    actual_val = business_data.get(field)
    if actual_val is None:
        # Fallback check for alternate keys
        if field == "investment_min":
            actual_val = business_data.get("investment", 0)
            field = "investment"
            op = "gte"
        elif field == "employees_min":
            actual_val = business_data.get("employees", 0)
            field = "employees"
            op = "gte"
            
    if actual_val is None:
        return False, f"Missing business field: {field}"

    str_actual = str(actual_val).strip().lower()

    if op == "equals":
        passed = str_actual == target_val
        reason = f"{rule.condition_field} matches '{rule.condition_value}'"
    elif op == "in":
        allowed_list = [v.strip() for v in target_val.split(",")]
        passed = str_actual in allowed_list
        reason = f"{rule.condition_field} '{actual_val}' is in eligible list [{rule.condition_value}]"
    elif op == "contains":
        passed = target_val in str_actual
        reason = f"{rule.condition_field} includes '{rule.condition_value}'"
    elif op == "gte":
        try:
            passed = float(actual_val) >= float(target_val)
            reason = f"{rule.condition_field} (₹{actual_val:,.0f} / {actual_val}) meets threshold >= {rule.condition_value}"
        except ValueError:
            passed = False
            reason = f"Numeric comparison failed for {field}"
    elif op == "lte":
        try:
            passed = float(actual_val) <= float(target_val)
            reason = f"{rule.condition_field} is within limit <= {rule.condition_value}"
        except ValueError:
            passed = False
            reason = f"Numeric comparison failed for {field}"
    else:
        passed = True
        reason = "Universal rule passed"

    return passed, reason

def discover_approvals(db: Session, business_data: Dict[str, Any]) -> List[DiscoveredApprovalResponse]:
    approvals = db.query(Approval).all()
    results = []

    for app in approvals:
        rules = app.rules
        if not rules:
            # If no specific rules configured, general approval applies
            is_applicable = True
            reasons = ["General industrial compliance clearance required for all registered facilities."]
        else:
            is_applicable = True
            reasons = []
            for r in rules:
                passed, reason_text = evaluate_rule(r, business_data)
                if passed:
                    reasons.append(r.explanation or reason_text)
                else:
                    is_applicable = False
                    break # Rule condition failed

        if is_applicable:
            req_count = len(app.requirements)
            renewal_text = f"Mandatory Renewal every {app.renewal_frequency_months} months" if app.renewal_frequency_months else "Lifetime Validity"
            
            results.append(DiscoveredApprovalResponse(
                approval=ApprovalResponse.from_orm(app),
                is_applicable=True,
                reasons=reasons,
                timeline_days=app.timeline_days,
                mandatory=app.mandatory,
                dependencies=app.dependencies,
                renewal_requirement=renewal_text,
                total_required_docs=req_count
            ))

    return results
