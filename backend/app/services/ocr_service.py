import os
import re
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
import pypdf

# Document Classification Taxonomy
DOC_CLASSIFICATION_RULES = [
    {
        "doc_type": "Food Safety Management Plan",
        "category": "Technical",
        "keywords": ["food safety", "fsms", "haccp", "fssai", "hazard analysis", "processing plan", "hygiene"],
        "default_authority": "Food Safety and Standards Authority of India (FSSAI)",
        "has_expiry": True,
        "validity_years": 1
    },
    {
        "doc_type": "Land Lease Deed / Ownership Proof",
        "category": "Land/Property",
        "keywords": ["lease deed", "ownership", "title deed", "khata", "industrial plot", "registry", "allotment"],
        "default_authority": "Sub-Registrar / State Industrial Development Corporation",
        "has_expiry": False
    },
    {
        "doc_type": "Factory Layout & Machine Installation Plan",
        "category": "Technical",
        "keywords": ["factory layout", "machinery plan", "equipment layout", "plant engineering", "architectural", "drawing"],
        "default_authority": "Directorate of Industrial Safety & Health (DISH)",
        "has_expiry": False
    },
    {
        "doc_type": "Environmental Impact & Effluent Management Plan",
        "category": "Environmental",
        "keywords": ["effluent", "pollution", "etp", "stp", "air emissions", "consent to establish", "mpcb", "cpcb"],
        "default_authority": "Maharashtra State Pollution Control Board",
        "has_expiry": True,
        "validity_years": 3
    },
    {
        "doc_type": "Fire Safety NOC & Evacuation Plan",
        "category": "NOCs",
        "keywords": ["fire safety", "fire noc", "evacuation", "fire fighting", "extinguisher", "hydrant", "emergency exit"],
        "default_authority": "State Fire & Emergency Services",
        "has_expiry": True,
        "validity_years": 1
    },
    {
        "doc_type": "Water Quality & Potability Test Report",
        "category": "Compliance",
        "keywords": ["water test", "potability", "microbiological", "water sample", "nabl", "is 10500"],
        "default_authority": "NABL Accredited Testing Laboratory",
        "has_expiry": True,
        "validity_years": 1
    },
    {
        "doc_type": "Certificate of Incorporation / Partnership Deed",
        "category": "Business",
        "keywords": ["incorporation", "cin", "partnership", "mca", "memorandum of association", "company registry"],
        "default_authority": "Ministry of Corporate Affairs (MCA)",
        "has_expiry": False
    },
    {
        "doc_type": "PAN & GST Registration Certificate",
        "category": "Financial",
        "keywords": ["gstin", "permanent account number", "gst registration", "taxation", "cbic"],
        "default_authority": "Goods and Services Tax Network (GSTN)",
        "has_expiry": False
    }
]

def extract_text_from_file(file_path: str, mime_type: str) -> str:
    extracted_text = ""
    try:
        if "pdf" in mime_type.lower() or file_path.lower().endswith(".pdf"):
            reader = pypdf.PdfReader(file_path)
            for page in reader.pages:
                text = page.extract_text()
                if text:
                    extracted_text += text + "\n"
        elif "image" in mime_type.lower() or file_path.lower().endswith((".png", ".jpg", ".jpeg")):
            # Fallback heuristic for images: extract basename or metadata
            extracted_text = f"Scanned Document: {os.path.basename(file_path)}"
    except Exception as e:
        extracted_text = f"Error extracting text: {str(e)}"
    
    return extracted_text.strip()

def extract_dates(text: str) -> tuple[Optional[str], Optional[str]]:
    # Look for DD/MM/YYYY or YYYY-MM-DD
    date_patterns = [
        r'\b(\d{1,2}[/-]\d{1,2}[/-]\d{4})\b',
        r'\b(\d{4}[/-]\d{1,2}[/-]\d{1,2})\b',
        r'\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2},? \d{4}\b'
    ]
    dates = []
    for pat in date_patterns:
        matches = re.findall(pat, text, re.IGNORECASE)
        dates.extend(matches)

    issue_date = None
    expiry_date = None

    now = datetime.utcnow()
    # Check for keywords near dates
    lines = text.splitlines()
    for line in lines:
        lower_l = line.lower()
        if "expiry" in lower_l or "valid up to" in lower_l or "valid until" in lower_l or "due date" in lower_l:
            for pat in date_patterns:
                m = re.search(pat, line, re.IGNORECASE)
                if m:
                    expiry_date = m.group(0)
                    break
        elif "issue" in lower_l or "dated" in lower_l or "effective" in lower_l or "registration date" in lower_l:
            for pat in date_patterns:
                m = re.search(pat, line, re.IGNORECASE)
                if m:
                    issue_date = m.group(0)
                    break

    if not issue_date and dates:
        issue_date = dates[0]
    if not expiry_date and len(dates) > 1:
        expiry_date = dates[-1]

    # Normalize dates if not found
    if not issue_date:
        issue_date = now.strftime("%Y-%m-%d")
        
    return issue_date, expiry_date

def extract_document_number(text: str, doc_type: str) -> Optional[str]:
    # Try finding specific document number formats
    patterns = [
        r'\b([A-Z]{5}[0-9]{4}[A-Z]{1})\b',          # PAN
        r'\b([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1})\b', # GSTIN
        r'\b(FSSAI[-/][0-9A-Z]{8,14})\b',           # FSSAI License
        r'\b(NOC[-/][0-9A-Z]{6,12})\b',             # NOC number
        r'\b(DOC[-/][0-9]{4,10})\b',                # Generic Doc Num
        r'\b(REG[-/][0-9A-Z]{5,12})\b',             # Registration Num
        r'\b([A-Z]{2,4}/[0-9]{4,8}/[0-9]{2,4})\b'   # File Reference Number
    ]
    for pat in patterns:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            return m.group(0)
            
    # Heuristic based on timestamp hash
    return f"DEMO-{datetime.utcnow().strftime('%Y%m%d')}-{abs(hash(text)) % 10000:04d}"

def calculate_validity(expiry_date_str: Optional[str]) -> tuple[str, Optional[int]]:
    if not expiry_date_str:
        return "VALID", None

    # Parse date
    formats = ["%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y", "%d/%m/%y"]
    parsed_date = None
    for fmt in formats:
        try:
            parsed_date = datetime.strptime(expiry_date_str, fmt)
            break
        except Exception:
            continue

    if not parsed_date:
        return "UNKNOWN", None

    now = datetime.utcnow()
    diff = (parsed_date - now).days

    if diff < 0:
        return "EXPIRED", diff
    elif diff <= 30:
        return "EXPIRING_SOON", diff
    else:
        return "VALID", diff

def classify_and_extract_document(file_path: str, filename: str, mime_type: str) -> Dict[str, Any]:
    """
    Simulates OCR & classifies uploaded document deterministically with AI heuristic tags.
    """
    extracted_text = extract_text_from_file(file_path, mime_type)
    search_space = f"{filename} {extracted_text}".lower()

    best_match = None
    max_score = 0

    for rule in DOC_CLASSIFICATION_RULES:
        score = sum(1 for kw in rule["keywords"] if kw in search_space)
        if score > max_score:
            max_score = score
            best_match = rule

    now = datetime.utcnow()

    if best_match and max_score > 0:
        doc_type = best_match["doc_type"]
        category = best_match["category"]
        authority = best_match["default_authority"]
        
        issue_date, expiry_date = extract_dates(extracted_text)
        if not expiry_date and best_match.get("has_expiry"):
            # Set a valid demo expiry date 1-3 years out
            valid_years = best_match.get("validity_years", 1)
            expiry_date = (now + timedelta(days=365 * valid_years)).strftime("%Y-%m-%d")
            
        doc_number = extract_document_number(extracted_text, doc_type)
    else:
        doc_type = os.path.splitext(filename)[0].replace("_", " ").title()
        category = "Compliance"
        authority = "Competent Statutory Authority"
        issue_date = now.strftime("%Y-%m-%d")
        expiry_date = (now + timedelta(days=365)).strftime("%Y-%m-%d")
        doc_number = f"GEN-{now.strftime('%y%m%d')}-{abs(hash(filename)) % 1000:03d}"

    validity_status, days_to_expiry = calculate_validity(expiry_date)

    return {
        "doc_type": doc_type,
        "category": category,
        "issuing_authority": authority,
        "issue_date": issue_date,
        "expiry_date": expiry_date,
        "doc_number": doc_number,
        "validity_status": validity_status,
        "days_to_expiry": days_to_expiry,
        "extracted_text": extracted_text,
        "ai_detected": True,
        "is_verified": False
    }
