# AI-Driven Industrial Approval & Compliance Management Platform

> **"One Platform from Approval Discovery to Document Readiness to Compliance."**
> 
> *DEMO REGULATORY DATA — FOR PROTOTYPE DEMONSTRATION ONLY*

---

## 📌 Executive Summary

Built for the **Smart India Hackathon (SIH)**, this enterprise-grade prototype eliminates bureaucratic delays in industrial clearances by providing a single-window compliance platform. It takes an entrepreneur through the entire regulatory journey:
**Business Profile → Approval Discovery → Document Readiness → Application Submission → Department Officer Review → Query Resolution → Physical Inspection → Final Approval → Renewal Lifecycle → Government Scheme Recommendation → Admin Bottlenecks Analytics**.

---

## 🚀 Key Differentiators & Features

1. **Deterministic Regulatory Engine:** Statutory requirements, applicability rules, and deadlines are calculated deterministically via relational rules—**never hallucinated by AI**.
2. **Smart Document Vault & OCR Classifier:** Automatic document classification across statutory categories, validity horizon tracking (VALID, EXPIRING SOON, EXPIRED), sensitive reference number masking (`••••••1234`), and simulated multi-step OCR extraction.
3. **Mathematical Readiness Score:** Real-time percentage (`Matched & Valid / Total Required`) with smooth animation that prevents premature filing. Reaching 100% unlocks the application package generator.
4. **5-Step Application Package Wizard:** Merges statutory documents into a single consolidated PDF package with a digital cover page, document index, and compression presets (High Quality, Balanced, Maximum Compression).
5. **Interactive Officer Scrutiny Workflow:** Department officers can review dossiers, raise formal statutory queries with deadlines, schedule on-site inspections, record outcomes, and grant final approval.
6. **Automatic Renewal & Subsidy Matching:** Approved applications automatically generate an electronic license certificate and register an annual renewal cycle in the vault, while the subsidy engine matches the business with central/state schemes (e.g. PMKSY ₹5 Cr capital grant, PMFME, CGTMSE).
7. **Two-Column Query Experience:** Officer question displayed side-by-side with entrepreneur response form and supplementary document upload.
8. **Statutory Grievance Redressal Mechanism:** Integrated complaint ticketing for reporting procedural bottlenecks and inspection queries with departmental SLA response tracking.
9. **Regulatory Knowledge Base:** Searchable catalog of statutory acts, rules, SOPs, and fee structures across FSSAI, DISH, MPCB, Fire, and MIDC.
10. **Global Search (Ctrl+K):** Instant multi-entity lookup across approvals, applications, documents, and schemes.
11. **Grounded AI Compliance Advisor:** An integrated assistant strictly grounded in the applicant's business data and verified clearance catalog.
12. **Admin Bottleneck Analytics:** Real-time charts identifying operational delay root causes and proposing mitigations.

---

## 👥 Pre-Seeded Demonstration Personas

A persistent **Demo Persona Switcher** is pinned to the top header so judges can switch roles in **one click**:

| Role | Email | Password | Scope & Persona |
| :--- | :--- | :--- | :--- |
| **Entrepreneur** | `demo@example.com` | `Demo123!` | Rajesh Sharma, Owner of *Demo Food Processing Unit* (Pune, Maharashtra) |
| **Department Officer** | `officer@example.com` | `Demo123!` | Dr. Vikram Deshmukh, Senior Food Safety Officer (FSSAI) |
| **System Admin** | `admin@example.com` | `Demo123!` | Priya Nair, State Industrial Directorate Administrator |

---

## 🛠️ Technology Stack

- **Backend:** Python 3.14, FastAPI, SQLAlchemy 2.0, Pydantic v2, SQLite (PostgreSQL-compatible), bcrypt, python-jose (JWT)
- **Document & PDF Processing:** `pypdf`, `reportlab`, `Pillow`
- **Frontend:** React 18, Vite, Tailwind CSS, Lucide React, Recharts, Axios, React Router v6

---

## 🏃 Running the Application Locally

### 1-Click Startup (Windows)
Double-click `run_platform.bat` in the project root.

### Manual Commands
#### Start the Backend Server (Port 8000)
```bash
.venv\Scripts\python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
API Documentation available at: `http://127.0.0.1:8000/docs`

#### Start the Frontend Dev Server (Port 5173)
```bash
cd frontend
npm run dev
```
Open your browser at: `http://localhost:5173`

---

## 🧪 Verified Judge Demo Journey

1. **Login as Entrepreneur:** Click the **Entrepreneur** chip on the login screen (`demo@example.com` / `Demo123!`).
2. **Review Business Profile:** View the pre-seeded "Demo Food Processing Unit" (₹50,00,000 investment, 25 workers, Chakan MIDC, Pune).
3. **Discover Approvals:** Click **Find Approvals** to see the 5 clearances identified by the deterministic rule engine.
4. **Open Document Planner:** Inspect the **Document Readiness** score, view matched vs missing items, and attach required documents with 1 click.
5. **Open Approval Checklist:** Select **Demo Food Processing Registration & Manufacturing License (FSSAI)**.
6. **Inspect Animated Readiness:** Observe the readiness score smoothly transition from 80% to 100% when all documents are verified.
7. **5-Step Package Wizard:** Launch the wizard: Select Documents → Arrange Order → Set Compression Preset → Preview Dossier → Generate Package.
8. **Submit Application:** Submit filing to the state single-window portal.
9. **Switch to Officer Persona:** Use the header dropdown to switch to **Officer** (`officer@example.com`).
10. **Review & Raise Query:** Open the submitted filing, scrutinize attachments, and raise a formal query.
11. **Switch to Entrepreneur & Respond:** View the **Action Required** alert on dashboard, click **"Respond Now →"**, and submit clarification via the 2-column response view.
12. **Switch to Officer & Inspect:** Schedule an on-site verification, record the result as **PASSED**, and click **"Grant Final Approval"**.
13. **Verify Certificate & Renewal:** Switch back to Entrepreneur dashboard to view the generated Certificate Number, check the **Renewals Tracker**, and explore matched **Government Schemes**.
14. **Switch to Admin:** View the state-wide KPI distribution, user directory, industrial enterprise registry, and identified **Process Bottlenecks**.
