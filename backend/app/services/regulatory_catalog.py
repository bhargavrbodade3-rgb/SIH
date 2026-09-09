"""
Centralized Configuration-Driven Regulatory Rules Engine & Catalog
Provides sector-specific regulatory applicability, dynamic dependency chains,
premises-aware document requirements, field-by-field guidance, and official portal guides.
"""

from typing import Dict, List, Any, Optional

# Supported business sectors
SUPPORTED_SECTORS = [
    "Food Processing",
    "IT / Software",
    "Manufacturing",
    "Retail & Trade",
    "Professional Services",
    "Construction",
    "Logistics & Warehousing",
    "Hospitality",
    "Healthcare",
    "Agriculture & Allied",
    "Automobile Workshop"
]

def get_premises_documents(premises_type: str) -> List[Dict[str, Any]]:
    """
    Returns premises-specific statutory document requirements based on whether the premises
    is Owned, Rented, Leased, or Consent/Shared.
    """
    p_type = (premises_type or "RENTED").upper()
    if p_type == "OWNED":
        return [
            {
                "name": "Property Ownership Deed / Registered Index-II",
                "document_type": "Ownership Title Deed",
                "category": "Land/Property",
                "is_mandatory": True,
                "description": "Proof of ownership of commercial / industrial premises (Sale Deed, Gift Deed, or Registered Index-II).",
                "premises_condition": "OWNED"
            },
            {
                "name": "Municipal Property Tax Paid Receipt",
                "document_type": "Property Tax Receipt",
                "category": "Land/Property",
                "is_mandatory": True,
                "description": "Latest municipal corporation or gram panchayat property tax paid assessment receipt.",
                "premises_condition": "OWNED"
            }
        ]
    elif p_type == "LEASED":
        return [
            {
                "name": "Registered Industrial Lease Deed (MIDC / Private)",
                "document_type": "Registered Lease Deed",
                "category": "Land/Property",
                "is_mandatory": True,
                "description": "Registered long-term lease deed or MIDC 99-year industrial plot lease agreement.",
                "premises_condition": "LEASED"
            },
            {
                "name": "Plot Allotment Letter & Possession Receipt",
                "document_type": "MIDC Allotment Letter",
                "category": "Land/Property",
                "is_mandatory": True,
                "description": "Official plot allotment order and physical possession confirmation receipt.",
                "premises_condition": "LEASED"
            }
        ]
    elif p_type == "CONSENT_SHARED":
        return [
            {
                "name": "Consent Letter & No-Objection Declaration from Owner",
                "document_type": "Owner Consent Letter",
                "category": "Land/Property",
                "is_mandatory": True,
                "description": "Signed consent letter on ₹100 stamp paper stating owner permits commercial business operation.",
                "premises_condition": "CONSENT_SHARED"
            },
            {
                "name": "Proof of Property Ownership of Consenter (Electricity Bill/Tax)",
                "document_type": "Consenter Ownership Proof",
                "category": "Land/Property",
                "is_mandatory": True,
                "description": "Utility bill or property tax receipt establishing consenter's legal right over premises.",
                "premises_condition": "CONSENT_SHARED"
            }
        ]
    else:  # RENTED (Default)
        return [
            {
                "name": "Registered Rent / Tenancy Agreement (Min. 11 Months)",
                "document_type": "Rent Agreement",
                "category": "Land/Property",
                "is_mandatory": True,
                "description": "Registered commercial rent agreement between landlord and enterprise with minimum 11 months validity.",
                "premises_condition": "RENTED"
            },
            {
                "name": "Electricity Bill of Premises (Address Verification)",
                "document_type": "Premises Electricity Bill",
                "category": "Land/Property",
                "is_mandatory": True,
                "description": "Latest consumer electricity bill of rented premises (not older than 2 months) matching address.",
                "premises_condition": "RENTED"
            },
            {
                "name": "No Objection Certificate (NOC) from Landlord",
                "document_type": "Landlord NOC",
                "category": "Land/Property",
                "is_mandatory": True,
                "description": "Written NOC from property owner permitting specific commercial/industrial operations.",
                "premises_condition": "RENTED"
            }
        ]

# Master Catalog of Regulatory Approvals
REGULATORY_CATALOG: Dict[str, Dict[str, Any]] = {
    "PAN": {
        "code": "PAN",
        "name": "PAN Card (Business / Proprietor)",
        "category": "FOUNDATIONAL",
        "description": "10-digit Permanent Account Number required for tax identity, bank account opening, and all statutory filings.",
        "issuing_authority": "Income Tax Department, Government of India",
        "official_portal_url": "https://www.incometax.gov.in",
        "typical_timeline_days": "7–15",
        "typical_cost": "₹107 (Online statutory fee)",
        "renewal_info": "Permanent (Lifetime validity unless surrendered)",
        "depends_on": [],
        "source": "Income Tax Act, 1961",
        "source_url": "https://www.incometax.gov.in",
        "last_reviewed": "15/08/2026",
        "applicability": {
            "all_sectors": True
        },
        "required_information": [
            {"key": "applicant_name", "label": "Applicant Legal Name", "profile_field": "applicant_name", "required": True},
            {"key": "dob_doi", "label": "Date of Birth / Date of Incorporation", "profile_field": None, "required": True},
            {"key": "father_or_corp_name", "label": "Father's Name (for Indiv.) or Parent Entity", "profile_field": None, "required": False},
            {"key": "email", "label": "Official Communication Email", "profile_field": "email", "required": True},
            {"key": "phone", "label": "Aadhaar-Linked Mobile Number", "profile_field": "phone", "required": True}
        ],
        "universal_documents": [
            {"name": "Applicant Identity Proof (Aadhaar / Voter ID / Passport)", "document_type": "Identity Proof", "category": "Identity", "is_mandatory": True},
            {"name": "Proof of Address (Utility Bill / Bank Statement)", "document_type": "Address Proof", "category": "Identity", "is_mandatory": True}
        ],
        "portal_guide_steps": [
            {"step_num": 1, "title": "Navigate to NSDL / UTIITSL Portal", "instruction": "Visit official portal (onlineservices.nsdl.com) and select 'Apply Online > Form 49A (Indian Citizen)'.", "portal_url": "https://www.onlineservices.nsdl.com"},
            {"step_num": 2, "title": "Select Application Category", "instruction": "Choose 'Individual' for Sole Proprietor, or 'Partnership Firm' / 'Company' for registered entities.", "portal_url": None},
            {"step_num": 3, "title": "Fill Personal & Business Details", "instruction": "Provide applicant legal name matching Aadhaar, date of incorporation, and contact details.", "portal_url": None},
            {"step_num": 4, "title": "e-KYC & Digital Signature", "instruction": "Authenticate using Aadhaar OTP or upload scanned signatures and supporting ID documents.", "portal_url": None},
            {"step_num": 5, "title": "Payment & Acknowledgement", "instruction": "Pay ₹107 online fee and record your 15-digit PAN Acknowledgement Number.", "portal_url": None}
        ],
        "field_guidance": [
            {"field_name": "Full Name", "explanation": "Must exactly match Aadhaar or MCA Certificate. Initials without full expansion often cause rejection.", "example": "Rajesh Kumar Sharma"},
            {"field_name": "AO Code (Assessing Officer)", "explanation": "Determine Ward/Circle based on your pin code and entity type on NSDL search.", "example": "W-12(1), Pune"}
        ]
    },

    "INCORPORATION": {
        "code": "INCORPORATION",
        "name": "Business Incorporation / Partnership Deed / Proprietorship Declaration",
        "category": "FOUNDATIONAL",
        "description": "Establishes legal entity structure (Sole Proprietorship declaration, Registered Partnership Deed, LLP, or Private Limited via SPICe+).",
        "issuing_authority": "Ministry of Corporate Affairs (MCA) / District Registrar of Firms",
        "official_portal_url": "https://www.mca.gov.in",
        "typical_timeline_days": "7–20",
        "typical_cost": "₹0 – ₹2,000 (Proprietorship stamp duty ~₹500, Partnership deed stamp duty varies, MCA SPICe+ zero filing fee for capital up to ₹15L)",
        "renewal_info": "Lifetime validity",
        "depends_on": ["PAN"],
        "source": "Companies Act 2013 / Indian Partnership Act 1932",
        "source_url": "https://www.mca.gov.in",
        "last_reviewed": "15/08/2026",
        "applicability": {
            "all_sectors": True
        },
        "required_information": [
            {"key": "business_name", "label": "Entity Proposed Name", "profile_field": "name", "required": True},
            {"key": "entity_type", "label": "Constitution (Proprietorship/Partnership/Pvt Ltd)", "profile_field": "business_type", "required": True},
            {"key": "registered_address", "label": "Registered Office Address", "profile_field": "address", "required": True},
            {"key": "capital_investment", "label": "Authorized / Initial Capital (₹)", "profile_field": "investment", "required": True}
        ],
        "universal_documents": [
            {"name": "PAN of Partners / Directors", "document_type": "PAN Card", "category": "Identity", "is_mandatory": True},
            {"name": "Partnership Deed / MoA & AoA Draft", "document_type": "Incorporation Certificate", "category": "Business", "is_mandatory": True}
        ],
        "portal_guide_steps": [
            {"step_num": 1, "title": "MCA Portal Access", "instruction": "Log in to MCA V3 Portal with registered credentials.", "portal_url": "https://www.mca.gov.in"},
            {"step_num": 2, "title": "SPICe+ Part A Name Reservation", "instruction": "Submit unique company or LLP name for approval by CRC.", "portal_url": None},
            {"step_num": 3, "title": "SPICe+ Part B Integrated Form", "instruction": "Fill registered office address, director DIN/PAN, capital allocation, and attach MoA/AoA.", "portal_url": None},
            {"step_num": 4, "title": "DSC Affixation & Submission", "instruction": "Affix Class-3 Digital Signatures of directors and certifying CA/CS.", "portal_url": None}
        ],
        "field_guidance": [
            {"field_name": "Main Objects Clause", "explanation": "Concise definition of the primary commercial activities the enterprise will conduct.", "example": "Manufacturing and processing of dehydrated vegetables and organic fruit pulp."}
        ]
    },

    "UDYAM": {
        "code": "UDYAM",
        "name": "Udyam MSME Registration Certificate",
        "category": "FOUNDATIONAL",
        "description": "Mandatory official certificate recognizing the enterprise as Micro, Small, or Medium under MSMED Act 2006. Unlocks bank priority lending and government subsidies.",
        "issuing_authority": "Ministry of Micro, Small and Medium Enterprises (MoMSME)",
        "official_portal_url": "https://udyamregistration.gov.in",
        "typical_timeline_days": "Same day",
        "typical_cost": "₹0 (Completely free government service)",
        "renewal_info": "Lifetime validity (Annual turnover auto-synced via ITR/GSTIN)",
        "depends_on": ["PAN", "INCORPORATION"],
        "source": "Micro, Small and Medium Enterprises Development Act, 2006",
        "source_url": "https://udyamregistration.gov.in",
        "last_reviewed": "15/08/2026",
        "applicability": {
            "all_sectors": True
        },
        "required_information": [
            {"key": "aadhaar", "label": "Proprietor / Managing Partner Aadhaar", "profile_field": None, "required": True},
            {"key": "pan", "label": "Enterprise PAN Number", "profile_field": None, "required": True},
            {"key": "business_name", "label": "Name of Enterprise", "profile_field": "name", "required": True},
            {"key": "investment", "label": "Investment in Plant & Machinery (₹)", "profile_field": "investment", "required": True},
            {"key": "employees", "label": "Number of Persons Employed", "profile_field": "employees", "required": True}
        ],
        "universal_documents": [
            {"name": "Aadhaar Card of Applicant", "document_type": "Aadhaar Card", "category": "Identity", "is_mandatory": True},
            {"name": "PAN Card of Business / Proprietor", "document_type": "PAN Card", "category": "Identity", "is_mandatory": True}
        ],
        "portal_guide_steps": [
            {"step_num": 1, "title": "Open Official Udyam Portal", "instruction": "Visit udyamregistration.gov.in and click 'For New Entrepreneurs who are not Registered yet as MSME'.", "portal_url": "https://udyamregistration.gov.in"},
            {"step_num": 2, "title": "Aadhaar Verification & OTP", "instruction": "Enter Aadhaar number and applicant name as per Aadhaar. Validate via mobile OTP.", "portal_url": None},
            {"step_num": 3, "title": "PAN Verification", "instruction": "Select entity type, enter PAN number, and validate with Income Tax database.", "portal_url": None},
            {"step_num": 4, "title": "Enter Plant Location & NIC Code", "instruction": "Add manufacturing plant/office address and select 5-digit NIC code (e.g. 10304 for Fruit pulp).", "portal_url": None},
            {"step_num": 5, "title": "Instant Certificate Generation", "instruction": "Submit final declaration. Udyam Registration Number (URN) is issued immediately.", "portal_url": None}
        ],
        "field_guidance": [
            {"field_name": "NIC Code (National Industry Classification)", "explanation": "Identifies your exact commercial activity. You can select multiple 2-digit, 4-digit, and 5-digit codes.", "example": "10300 — Processing and preserving of fruit and vegetables"}
        ]
    },

    "GST": {
        "code": "GST",
        "name": "Goods and Services Tax (GSTIN) Registration",
        "category": "FOUNDATIONAL",
        "description": "15-digit GST identification number required for interstate commerce, input tax credit eligibility, and legal invoicing.",
        "issuing_authority": "Central Board of Indirect Taxes and Customs (CBIC) / State Commercial Tax",
        "official_portal_url": "https://www.gst.gov.in",
        "typical_timeline_days": "3–7",
        "typical_cost": "₹0 (Free government service; ARN issued instantly)",
        "renewal_info": "Lifetime validity subject to monthly/quarterly return filings",
        "depends_on": ["PAN", "INCORPORATION"],
        "source": "Central Goods and Services Tax Act, 2017",
        "source_url": "https://www.gst.gov.in",
        "last_reviewed": "15/08/2026",
        "applicability": {
            "all_sectors": True
        },
        "required_information": [
            {"key": "legal_name", "label": "Legal Name of Business", "profile_field": "name", "required": True},
            {"key": "trade_name", "label": "Trade Name (Brand / Operating Name)", "profile_field": "name", "required": False},
            {"key": "state", "label": "State of Operation", "profile_field": "state", "required": True},
            {"key": "district", "label": "District Jurisdiction", "profile_field": "district", "required": True},
            {"key": "address", "label": "Principal Place of Business", "profile_field": "address", "required": True},
            {"key": "bank_account", "label": "Bank Account Number & IFSC", "profile_field": None, "required": True}
        ],
        "universal_documents": [
            {"name": "PAN Card of Business / Proprietor", "document_type": "PAN Card", "category": "Identity", "is_mandatory": True},
            {"name": "Aadhaar Card of Authorized Signatory", "document_type": "Aadhaar Card", "category": "Identity", "is_mandatory": True},
            {"name": "Bank Account Proof (Cancelled Cheque / First Page of Passbook)", "document_type": "Bank Statement", "category": "Financial", "is_mandatory": True},
            {"name": "Letter of Authorization / Board Resolution for Signatory", "document_type": "Board Resolution", "category": "Business", "is_mandatory": True}
        ],
        "portal_guide_steps": [
            {"step_num": 1, "title": "Part A TRN Generation", "instruction": "Visit gst.gov.in > Services > Registration > New Registration. Enter PAN, Email, and Mobile. Generate Temporary Reference Number (TRN).", "portal_url": "https://www.gst.gov.in"},
            {"step_num": 2, "title": "Log in with TRN", "instruction": "Log in using TRN and mobile OTP to unlock the 10-tab application form.", "portal_url": None},
            {"step_num": 3, "title": "Business Details & Promoters", "instruction": "Fill constitution, date of commencement, promoter/partner identity details and photo.", "portal_url": None},
            {"step_num": 4, "title": "Principal Place of Business & Premises Proof", "instruction": "Enter precise address and upload Rent Agreement or Ownership Deed based on your premises type.", "portal_url": None},
            {"step_num": 5, "title": "Goods / Services HSN Codes", "instruction": "Specify top 5 commodities or services handled by your business.", "portal_url": None},
            {"step_num": 6, "title": "Aadhaar Authentication & ARN Receipt", "instruction": "Opt for Aadhaar authentication to avoid physical site inspection. ARN is generated instantly.", "portal_url": None}
        ],
        "field_guidance": [
            {"field_name": "State & Center Jurisdiction", "explanation": "Determine the exact ward/range/circle for your premises address to avoid application reassignment delays.", "example": "State: Maharashtra - Pune Circle 4 | Center: Range I, Division Pune-I"},
            {"field_name": "Nature of Possession of Premises", "explanation": "Must exactly match your premises proof: 'Rented' requires rent agreement; 'Owned' requires municipal tax / index-II.", "example": "Rented"}
        ]
    },

    "SHOP_ACT": {
        "code": "SHOP_ACT",
        "name": "Shop & Establishment Act Registration (Gumasta)",
        "category": "FOUNDATIONAL",
        "description": "State statutory registration governing conditions of work, employee health, premises operating hours, and local labor standards.",
        "issuing_authority": "Maharashtra State Labour Department / Aaple Sarkar",
        "official_portal_url": "https://aaplesarkar.mahaonline.gov.in",
        "typical_timeline_days": "7–10",
        "typical_cost": "₹100 – ₹2,500 (Free for <=9 employees; slab-based for 10+ employees)",
        "renewal_info": "Lifetime validity for intimation; 1–3 years renewal for 10+ employees",
        "depends_on": ["INCORPORATION"],
        "source": "Maharashtra Shops and Establishments Act, 2017",
        "source_url": "https://aaplesarkar.mahaonline.gov.in",
        "last_reviewed": "15/08/2026",
        "applicability": {
            "all_sectors": True
        },
        "required_information": [
            {"key": "establishment_name", "label": "Name of Establishment", "profile_field": "name", "required": True},
            {"key": "employer_name", "label": "Name of Employer / Manager", "profile_field": "applicant_name", "required": True},
            {"key": "category", "label": "Category of Establishment", "profile_field": "business_type", "required": True},
            {"key": "employees", "label": "Total Number of Workers", "profile_field": "employees", "required": True},
            {"key": "premises_address", "label": "Premises Address", "profile_field": "address", "required": True}
        ],
        "universal_documents": [
            {"name": "Identity Proof of Employer (Aadhaar / PAN)", "document_type": "Identity Proof", "category": "Identity", "is_mandatory": True},
            {"name": "Photograph of Establishment Entrance with Signboard in Marathi", "document_type": "Premises Photo", "category": "Compliance", "is_mandatory": True}
        ],
        "portal_guide_steps": [
            {"step_num": 1, "title": "Aaple Sarkar Portal Access", "instruction": "Visit aaplesarkar.mahaonline.gov.in and log in with Citizen ID.", "portal_url": "https://aaplesarkar.mahaonline.gov.in"},
            {"step_num": 2, "title": "Select Labour Department Service", "instruction": "Choose 'Industries, Energy and Labour Department' > 'Registration under Shops and Establishments'.", "portal_url": None},
            {"step_num": 3, "title": "Form Intimation (Form F) / Registration (Form A)", "instruction": "Units with 0-9 employees submit self-declaration Form F (immediate receipt). Units with 10+ workers fill Form A.", "portal_url": None},
            {"step_num": 4, "title": "Upload Signboard Photo & Premises Proof", "instruction": "Upload photo of shop/office showing name in Devanagari script and electricity bill.", "portal_url": None}
        ],
        "field_guidance": [
            {"field_name": "Signboard Compliance", "explanation": "Under Maharashtra statutory rules, the establishment name on the signboard must be prominently displayed in Marathi (Devanagari script) with equal or larger font size than other languages.", "example": "साई फूड्स / SAI FOODS"}
        ]
    },

    "PROFESSIONAL_TAX": {
        "code": "PROFESSIONAL_TAX",
        "name": "Professional Tax Registration (PTEC & PTRC)",
        "category": "FOUNDATIONAL",
        "description": "State tax registration required for businesses and corporate employers in Maharashtra: PTEC (for the business entity) and PTRC (for deducting employee tax).",
        "issuing_authority": "Maharashtra State Tax Department (MahaGST)",
        "official_portal_url": "https://www.mahagst.gov.in",
        "typical_timeline_days": "3–5",
        "typical_cost": "₹2,500 / year (PTEC statutory slab)",
        "renewal_info": "Annual renewal due by June 30th",
        "depends_on": ["PAN", "GST"],
        "source": "Maharashtra State Tax on Professions, Trades, Callings and Employments Act, 1975",
        "source_url": "https://www.mahagst.gov.in",
        "last_reviewed": "15/08/2026",
        "applicability": {
            "sectors": ["IT / Software", "Professional Services", "Healthcare", "Hospitality"],
            "states": ["Maharashtra"]
        },
        "required_information": [
            {"key": "pan", "label": "Business PAN", "profile_field": None, "required": True},
            {"key": "employee_count", "label": "Number of Salaried Employees", "profile_field": "employees", "required": True}
        ],
        "universal_documents": [
            {"name": "PAN Card of Business", "document_type": "PAN Card", "category": "Identity", "is_mandatory": True},
            {"name": "Incorporation / Shop Act Certificate", "document_type": "Incorporation Certificate", "category": "Business", "is_mandatory": True}
        ],
        "portal_guide_steps": [
            {"step_num": 1, "title": "Access MahaGST Portal", "instruction": "Open mahagst.gov.in and select 'e-Registration > Professional Tax'.", "portal_url": "https://www.mahagst.gov.in"},
            {"step_num": 2, "title": "Fill Form I (PTRC) / Form II (PTEC)", "instruction": "Enter PAN, business address, and employee salary slabs.", "portal_url": None},
            {"step_num": 3, "title": "Instant RC Certificate Generation", "instruction": "Verify via Aadhaar OTP and download PTEC/PTRC Registration Certificate.", "portal_url": None}
        ],
        "field_guidance": [
            {"field_name": "PTEC vs PTRC", "explanation": "PTEC (Profession Tax Enrolment Certificate) is paid by the firm/proprietor for the right to practice. PTRC (Profession Tax Registration Certificate) is needed if you have employees to deduct and remit tax on their salaries.", "example": "Both required if employing salaried staff."}
        ]
    },

    "FACTORY_LICENSE": {
        "code": "FACTORY_LICENSE",
        "name": "Factory Plan Approval & Safety Scrutiny (DISH)",
        "category": "SECTOR_SPECIFIC",
        "description": "Pre-construction approval of industrial plant layout drawings, machine ventilation, hazardous escape routes, and structural worker safety.",
        "issuing_authority": "Directorate of Industrial Safety & Health (DISH), Maharashtra",
        "official_portal_url": "https://dish.maharashtra.gov.in",
        "typical_timeline_days": "30–45",
        "typical_cost": "₹5,000 – ₹25,000 (Calculated on connected horsepower & worker count)",
        "renewal_info": "1, 5, or 10 years factory license validity",
        "depends_on": ["UDYAM", "GST"],
        "source": "The Factories Act, 1948 & Maharashtra Factories Rules",
        "source_url": "https://dish.maharashtra.gov.in",
        "last_reviewed": "15/08/2026",
        "applicability": {
            "sectors": ["Manufacturing", "Food Processing", "Construction"],
            "manufacturing_activity_required": True
        },
        "required_information": [
            {"key": "connected_load", "label": "Total Connected Electric Load (HP / kW)", "profile_field": "electricity_load_kw", "required": True},
            {"key": "workers_count", "label": "Maximum Number of Workers Proposed", "profile_field": "employees", "required": True},
            {"key": "manufacturing_process", "label": "Description of Manufacturing Activity", "profile_field": "business_activity", "required": True}
        ],
        "universal_documents": [
            {"name": "Architectural Plant Layout Drawings (Blueprints signed by Chartered Engineer)", "document_type": "Factory Layout Plan", "category": "Technical", "is_mandatory": True},
            {"name": "Process Flow Chart & Manufacturing Description", "document_type": "Process Flow Diagram", "category": "Technical", "is_mandatory": True},
            {"name": "Machinery List with Horsepower Ratings", "document_type": "Machinery List", "category": "Technical", "is_mandatory": True}
        ],
        "portal_guide_steps": [
            {"step_num": 1, "title": "DISH Single Window Portal", "instruction": "Log in to dish.maharashtra.gov.in and select 'Factory Plan Approval (Form 1)'.", "portal_url": "https://dish.maharashtra.gov.in"},
            {"step_num": 2, "title": "Upload CAD / Vector Plant Layouts", "instruction": "Upload drawings showing emergency exits, minimum 4.2m ceiling height, natural lighting, and sanitation.", "portal_url": None},
            {"step_num": 3, "title": "Department Scrutiny & Site Inspection", "instruction": "DISH Joint Director reviews drawings and issues query or scrutiny approval letter.", "portal_url": None}
        ],
        "field_guidance": [
            {"field_name": "Ventilation & Natural Lighting", "explanation": "Factories Act mandates window opening area equal to at least 15% of the total factory floor area.", "example": "Floor: 10,000 sq ft -> Windows: 1,500 sq ft"}
        ]
    },

    "FSSAI": {
        "code": "FSSAI",
        "name": "Food Safety Manufacturing License / Registration (FSSAI)",
        "category": "SECTOR_SPECIFIC",
        "description": "Mandatory hygiene, Food Safety Management System (FSMS), and product laboratory testing certification to manufacture, package, or distribute food items.",
        "issuing_authority": "Food Safety and Standards Authority of India (FSSAI) / FoSCoS",
        "official_portal_url": "https://foscos.fssai.gov.in",
        "typical_timeline_days": "30–60",
        "typical_cost": "Basic Registration ₹100/yr; State License ₹2,000–₹5,000/yr; Central License ₹7,500/yr (turnover tier based)",
        "renewal_info": "1 to 5 years validity chosen during application",
        "depends_on": ["UDYAM", "GST"],
        "source": "Food Safety and Standards Act, 2006",
        "source_url": "https://foscos.fssai.gov.in",
        "last_reviewed": "15/08/2026",
        "applicability": {
            "sectors": ["Food Processing", "Hospitality", "Agriculture & Allied"],
            "food_handling_required": True
        },
        "required_information": [
            {"key": "installed_capacity", "label": "Installed Food Production Capacity (Metric Tonnes/Day)", "profile_field": None, "required": True},
            {"key": "water_source", "label": "Source of Potable Water Used in Processing", "profile_field": "water_usage_lpd", "required": True},
            {"key": "food_categories", "label": "FSSAI Food Product Categories Handled", "profile_field": "business_activity", "required": True}
        ],
        "universal_documents": [
            {"name": "Food Safety Management System (FSMS) Plan & SOP", "document_type": "FSMS Plan", "category": "Compliance", "is_mandatory": True},
            {"name": "Water Potability & Chemical Analysis Test Report (NABL Accredited)", "document_type": "Water Quality Test Report", "category": "Compliance", "is_mandatory": True},
            {"name": "Plant Equipment & Machinery Layout with Capacity Specs", "document_type": "Machinery List", "category": "Technical", "is_mandatory": True},
            {"name": "Nomination of Food Safety Technical In-Charge (Form IX)", "document_type": "Form IX Nomination", "category": "Compliance", "is_mandatory": True}
        ],
        "portal_guide_steps": [
            {"step_num": 1, "title": "FoSCoS Portal Access", "instruction": "Open foscos.fssai.gov.in and click 'Apply for License and Registration'.", "portal_url": "https://foscos.fssai.gov.in"},
            {"step_num": 2, "title": "Determine License Tier", "instruction": "Select State License for production capacity up to 2 MT/day or turnover up to ₹20 Crore. Otherwise select Central License.", "portal_url": None},
            {"step_num": 3, "title": "Select Food Category (Kind of Business - KoB)", "instruction": "Pick Category 04 (Fruits & Vegetables) or Category 08 (Meat) etc.", "portal_url": None},
            {"step_num": 4, "title": "Upload NABL Water Report & FSMS Plan", "instruction": "Attach potable water test report confirming zero E. coli / coliform.", "portal_url": None},
            {"step_num": 5, "title": "Statutory Payment & Application Tracking", "instruction": "Pay annual fee online and receive 17-digit FoSCoS Application Reference.", "portal_url": None}
        ],
        "field_guidance": [
            {"field_name": "Kind of Business (KoB)", "explanation": "Carefully select 'Manufacturer' rather than 'Trader/Wholesaler' if you transform raw agro-produce into packaged goods.", "example": "Manufacturer — Dairy / Fruit Pulp"}
        ]
    },

    "POLLUTION_CONSENT": {
        "code": "POLLUTION_CONSENT",
        "name": "Consent to Establish (CTE) — Water & Air Pollution Control Acts",
        "category": "SECTOR_SPECIFIC",
        "description": "Mandatory prior environmental clearance from State Pollution Control Board to establish plant machinery and effluent treatment installations.",
        "issuing_authority": "Maharashtra Pollution Control Board (MPCB)",
        "official_portal_url": "https://mpcb.gov.in",
        "typical_timeline_days": "30–60",
        "typical_cost": "₹15,000 – ₹75,000 (Based on gross capital investment & pollution category Red/Orange/Green)",
        "renewal_info": "Valid during construction (up to 5 years); followed by Consent to Operate (CTO)",
        "depends_on": ["UDYAM", "GST", "FACTORY_LICENSE"],
        "source": "Water (Prevention and Control of Pollution) Act 1974 & Air Act 1981",
        "source_url": "https://mpcb.gov.in",
        "last_reviewed": "15/08/2026",
        "applicability": {
            "sectors": ["Manufacturing", "Food Processing", "Hospitality", "Automobile Workshop"],
            "manufacturing_activity_required": True
        },
        "required_information": [
            {"key": "gross_capital", "label": "Gross Capital Investment (Plant + Land + Machinery)", "profile_field": "investment", "required": True},
            {"key": "water_consumption", "label": "Daily Industrial & Domestic Water Requirement (KLD)", "profile_field": "water_usage_lpd", "required": True},
            {"key": "effluent_discharge", "label": "Estimated Effluent Generation (KLD)", "profile_field": None, "required": True},
            {"key": "air_emissions", "label": "Chimney / Stack Details & DG Set Capacity", "profile_field": None, "required": True}
        ],
        "universal_documents": [
            {"name": "Comprehensive Environmental Management Plan (EMP) & ETP Scheme", "document_type": "Environmental Management Plan", "category": "Environmental", "is_mandatory": True},
            {"name": "Manufacturing Process Description with Mass Balance Calculation", "document_type": "Process Description", "category": "Technical", "is_mandatory": True},
            {"name": "MIDC Land Allotment / Gram Panchayat NOC", "document_type": "MIDC Allotment Letter", "category": "Land/Property", "is_mandatory": True}
        ],
        "portal_guide_steps": [
            {"step_num": 1, "title": "MPCB Single Window e-Consent", "instruction": "Access mpcb.gov.in e-portal and select 'Combined Consent Application'.", "portal_url": "https://mpcb.gov.in"},
            {"step_num": 2, "title": "Pollution Category Classification", "instruction": "Confirm whether your activity is Red, Orange, or Green as per CPCB 2016 classification.", "portal_url": None},
            {"step_num": 3, "title": "Submit Water Balance & Effluent Scheme", "instruction": "Provide details of primary/secondary ETP tank capacity and zero liquid discharge (ZLD) systems.", "portal_url": None},
            {"step_num": 4, "title": "Regional Officer Scrutiny & Field Visit", "instruction": "Sub-Regional Officer inspects site buffer distance from rivers/highways before consent grant.", "portal_url": None}
        ],
        "field_guidance": [
            {"field_name": "Industry Categorization", "explanation": "Food processing with washing and canning falls under Orange Category (Score 41-59). Organic dry sorting is Green.", "example": "Orange Category — Fruit & Vegetable Processing"}
        ]
    },

    "FIRE_NOC": {
        "code": "FIRE_NOC",
        "name": "Fire Safety Provisional NOC (State Fire Service)",
        "category": "SECTOR_SPECIFIC",
        "description": "Technical verification of building fire fighting readiness, hydrants, smoke detectors, automated sprinkler layout, and escape corridors.",
        "issuing_authority": "Directorate of Maharashtra Fire Services / Municipal Fire Brigade",
        "official_portal_url": "https://mahafireservice.gov.in",
        "typical_timeline_days": "15–30",
        "typical_cost": "₹5,000 – ₹20,000 (Calculated per sq. meter built-up area)",
        "renewal_info": "Annual fire audit certification mandatory (Form B twice a year)",
        "depends_on": ["FACTORY_LICENSE"],
        "source": "Maharashtra Fire Prevention and Life Safety Measures Act, 2006",
        "source_url": "https://mahafireservice.gov.in",
        "last_reviewed": "15/08/2026",
        "applicability": {
            "sectors": ["Manufacturing", "Food Processing", "Hospitality", "Construction", "Logistics & Warehousing"]
        },
        "required_information": [
            {"key": "built_up_area", "label": "Total Built-Up Area (sq. meters)", "profile_field": None, "required": True},
            {"key": "building_height", "label": "Height of Industrial Building (meters)", "profile_field": None, "required": True},
            {"key": "fire_water_tank", "label": "Underground / Overhead Fire Water Tank Capacity (Litres)", "profile_field": None, "required": True}
        ],
        "universal_documents": [
            {"name": "Architectural Fire Evacuation Plan & Hydrant Layout", "document_type": "Fire Evacuation Plan", "category": "Technical", "is_mandatory": True},
            {"name": "Factory Building Sanctioned Layout Drawing", "document_type": "Sanctioned Plan", "category": "Land/Property", "is_mandatory": True}
        ],
        "portal_guide_steps": [
            {"step_num": 1, "title": "MahaFire Single Window Access", "instruction": "Navigate to mahafireservice.gov.in and select 'Provisional Fire NOC Application'.", "portal_url": "https://mahafireservice.gov.in"},
            {"step_num": 2, "title": "Upload Certified Fire Hydrant Drawings", "instruction": "Upload drawings prepared by a licensed fire agency showing 6-meter driveway access around plant.", "portal_url": None},
            {"step_num": 3, "title": "Field Verification & Provisional NOC", "instruction": "Chief Fire Officer issues Provisional NOC specifying required installations before commissioning.", "portal_url": None}
        ],
        "field_guidance": [
            {"field_name": "Internal Driveway Access", "explanation": "Industrial plots must have at least 6 meters wide unhindered driveway around the perimeter for heavy fire tenders.", "example": "6.0 Meters Perimeter Driveway"}
        ]
    },

    "TRADE_LICENCE": {
        "code": "TRADE_LICENCE",
        "name": "Local Municipal Trade Licence",
        "category": "SECTOR_SPECIFIC",
        "description": "Statutory municipal license issued by Local Urban Municipal Corporation to verify public health, hygiene, and safe local business operation.",
        "issuing_authority": "Local Municipal Corporation (PMC / NMC / MCGM / MIDC)",
        "official_portal_url": "https://www.pmc.gov.in",
        "typical_timeline_days": "15–20",
        "typical_cost": "₹1,000 – ₹10,000 (Based on floor area and trade classification slab)",
        "renewal_info": "Annual renewal every financial year (due March 31st)",
        "depends_on": ["SHOP_ACT", "GST"],
        "source": "Maharashtra Municipal Corporations Act, 1949",
        "source_url": "https://www.pmc.gov.in",
        "last_reviewed": "15/08/2026",
        "applicability": {
            "sectors": ["Retail & Trade", "Food Processing", "Hospitality", "Automobile Workshop", "Manufacturing"]
        },
        "required_information": [
            {"key": "trade_activity", "label": "Specific Nature of Trade", "profile_field": "business_activity", "required": True},
            {"key": "ward_office", "label": "Municipal Ward Office Jurisdiction", "profile_field": "district", "required": True}
        ],
        "universal_documents": [
            {"name": "Shop & Establishment Registration Copy", "document_type": "Shop Act License", "category": "Compliance", "is_mandatory": True},
            {"name": "Property Tax Clearance / No Dues Certificate", "document_type": "Property Tax Receipt", "category": "Land/Property", "is_mandatory": True}
        ],
        "portal_guide_steps": [
            {"step_num": 1, "title": "Municipal Corporation Citizen Portal", "instruction": "Open local municipal corporation portal (e.g. pmc.gov.in for Pune, nmc.gov.in for Nagpur).", "portal_url": "https://www.pmc.gov.in"},
            {"step_num": 2, "title": "Submit Health & Trade License Form", "instruction": "Enter business trade code, square footage of premises, and attach property tax clearance.", "portal_url": None},
            {"step_num": 3, "title": "Ward Inspector Verification & Fee Payment", "instruction": "Sanitary inspector inspects premises. Pay annual trade licence cess online.", "portal_url": None}
        ],
        "field_guidance": [
            {"field_name": "Trade Category Code", "explanation": "Select specific trade code matching your activity (e.g. Food Retail, Industrial Workshop, General Commercial).", "example": "Code 104 — Edible Food Manufacturing & Retail"}
        ]
    },

    "CONSENT_TO_OPERATE": {
        "code": "CONSENT_TO_OPERATE",
        "name": "Consent to Operate (CTO) — Commercial Commissioning",
        "category": "POST_APPROVAL",
        "description": "Final regulatory operational clearance granted after physical inspection confirms ETP compliance and fire safety installations are operational before commercial dispatch.",
        "issuing_authority": "Maharashtra Pollution Control Board (MPCB)",
        "official_portal_url": "https://mpcb.gov.in",
        "typical_timeline_days": "30–45",
        "typical_cost": "Similar fee band to Consent to Establish (capital scale based)",
        "renewal_info": "1 to 5 years validity depending on environmental category",
        "depends_on": ["POLLUTION_CONSENT", "FIRE_NOC"],
        "source": "Water & Air Acts (Operation Clause)",
        "source_url": "https://mpcb.gov.in",
        "last_reviewed": "15/08/2026",
        "applicability": {
            "sectors": ["Manufacturing", "Food Processing", "Automobile Workshop"],
            "manufacturing_activity_required": True
        },
        "required_information": [
            {"key": "actual_capital_spent", "label": "Actual Capital Expenditure Incurred (₹)", "profile_field": "investment", "required": True},
            {"key": "etp_commissioning_date", "label": "Date of ETP Plant Commissioning", "profile_field": None, "required": True}
        ],
        "universal_documents": [
            {"name": "Copy of Consent to Establish (CTE) granted earlier", "document_type": "Consent to Establish", "category": "Environmental", "is_mandatory": True},
            {"name": "Treated Effluent Lab Analysis Report from MPCB Approved Lab", "document_type": "Effluent Analysis Report", "category": "Environmental", "is_mandatory": True},
            {"name": "Final Fire Safety Compliance Certificate / Final NOC", "document_type": "Fire NOC", "category": "Compliance", "is_mandatory": True}
        ],
        "portal_guide_steps": [
            {"step_num": 1, "title": "Apply for CTO 60 Days Before Production", "instruction": "Visit mpcb.gov.in and submit 'Consent to Operate (First)' referencing prior CTE number.", "portal_url": "https://mpcb.gov.in"},
            {"step_num": 2, "title": "Upload ETP Photographs & Commissioning Proof", "instruction": "Attach pictures of functional aerated lagoons/ETP and online monitoring sensors.", "portal_url": None},
            {"step_num": 3, "title": "Final Physical Joint Inspection", "instruction": "Pollution control board officer visits to take effluent samples before commercial clearance.", "portal_url": None}
        ],
        "field_guidance": [
            {"field_name": "Compliance with CTE Conditions", "explanation": "State compliance point-by-point against each specific condition noted in your original CTE grant letter.", "example": "Condition 4.1: Flow meter installed at final outlet — Complied"}
        ]
    }
}

def evaluate_approval_applicability(approval_code: str, business_data: Dict[str, Any]) -> tuple[bool, List[str]]:
    """
    Evaluates whether a catalog approval applies to the given business profile.
    Returns (is_applicable, reasons_list).
    """
    item = REGULATORY_CATALOG.get(approval_code)
    if not item:
        return False, ["Approval code not found in regulatory catalog."]

    rules = item.get("applicability", {})
    if rules.get("all_sectors", False):
        return True, ["Foundational statutory requirement applicable to all registered commercial entities."]

    reasons = []
    b_sector = business_data.get("sector") or "Manufacturing"
    b_type = business_data.get("business_type") or "Manufacturing"

    # 1. Sector check
    allowed_sectors = rules.get("sectors")
    if allowed_sectors:
        sector_matched = False
        for s in allowed_sectors:
            if s.lower() in b_sector.lower() or b_sector.lower() in s.lower():
                sector_matched = True
                break
        if not sector_matched:
            return False, [f"Not applicable: Sector '{b_sector}' does not require {item['name']}."]
        reasons.append(f"Applicable for {b_sector} enterprise operations.")

    # 2. Food handling flag
    if rules.get("food_handling_required"):
        is_food_sector = any(f in b_sector.lower() for f in ["food", "beverage", "dairy", "agro", "bakery", "restaurant", "hospitality"])
        has_food_flag = bool(business_data.get("food_handling"))
        if not (is_food_sector or has_food_flag):
            return False, ["Not applicable: Business does not handle edible food processing or commercial food distribution."]
        reasons.append("Applicable: Involves commercial food handling / processing activities under FSS Act.")

    # 3. Manufacturing activity flag
    if rules.get("manufacturing_activity_required"):
        is_mfg_type = any(m in b_type.lower() for m in ["manufacturing", "production", "processing", "assembly"])
        is_mfg_sector = any(m in b_sector.lower() for m in ["manufacturing", "food", "chemical", "textile", "engineering", "workshop"])
        has_mfg_flag = bool(business_data.get("manufacturing_activity"))
        if not (is_mfg_type or is_mfg_sector or has_mfg_flag):
            return False, ["Not applicable: Pure software, consulting, or retail trade with no physical manufacturing machinery."]
        reasons.append("Applicable: Industrial plant involves physical machinery operations.")

    return True, (reasons or ["Mandatory regulatory compliance threshold met."])

def get_applicable_roadmap_for_business(business_data: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Generates a personalized, dynamic roadmap of approvals for a specific business profile.
    """
    ordered_codes = [
        "PAN",
        "INCORPORATION",
        "UDYAM",
        "GST",
        "SHOP_ACT",
        "PROFESSIONAL_TAX",
        "FACTORY_LICENSE",
        "FSSAI",
        "POLLUTION_CONSENT",
        "FIRE_NOC",
        "TRADE_LICENCE",
        "CONSENT_TO_OPERATE"
    ]

    applicable_steps = []
    step_order = 1

    for code in ordered_codes:
        is_app, reasons = evaluate_approval_applicability(code, business_data)
        if is_app:
            catalog_item = REGULATORY_CATALOG[code]
            premises_type = business_data.get("premises_type") or business_data.get("land_property") or "RENTED"
            premises_docs = get_premises_documents(premises_type)
            universal_docs = catalog_item.get("universal_documents", [])
            all_required_docs = universal_docs + premises_docs

            step_dict = {
                "code": code,
                "name": catalog_item["name"],
                "category": catalog_item["category"],
                "description": catalog_item["description"],
                "issuing_authority": catalog_item["issuing_authority"],
                "official_portal_url": catalog_item["official_portal_url"],
                "typical_timeline_days": catalog_item["typical_timeline_days"],
                "typical_cost": catalog_item["typical_cost"],
                "renewal_info": catalog_item["renewal_info"],
                "depends_on": catalog_item["depends_on"],
                "step_order": step_order,
                "reasons": reasons,
                "required_documents": all_required_docs,
                "required_information": catalog_item.get("required_information", []),
                "source": catalog_item.get("source"),
                "source_url": catalog_item.get("source_url"),
                "last_reviewed": catalog_item.get("last_reviewed")
            }
            applicable_steps.append(step_dict)
            step_order += 1

    return applicable_steps
