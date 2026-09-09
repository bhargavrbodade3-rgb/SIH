import urllib.request
import json

def post_json(url, data, token=None):
    req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers={'Content-Type': 'application/json'})
    if token:
        req.add_header('Authorization', f'Bearer {token}')
    with urllib.request.urlopen(req) as res:
        return json.loads(res.read().decode())

def get_json(url, token=None):
    req = urllib.request.Request(url)
    if token:
        req.add_header('Authorization', f'Bearer {token}')
    with urllib.request.urlopen(req) as res:
        return json.loads(res.read().decode())

print("1. Testing Frontend Dev Server...")
with urllib.request.urlopen('http://localhost:5173') as res:
    print(f"   Frontend HTTP Status: {res.status}")

print("2. Testing Backend Health...")
health = get_json('http://127.0.0.1:8000/api/health')
print(f"   Backend Health: {health['status']} | Demo Mode: {health['demo_mode']}")

print("3. Entrepreneur Login...")
demo_auth = post_json('http://127.0.0.1:8000/api/auth/login', {'email': 'demo@example.com', 'password': 'Demo123!'})
demo_token = demo_auth['access_token']
print(f"   Entrepreneur Logged In: {demo_auth['user']['full_name']}")

print("4. Primary Business Profile...")
biz = get_json('http://127.0.0.1:8000/api/business/primary', demo_token)
print(f"   Business Name: {biz['name']} | Completion: {biz.get('profile_completion')}%")

print("5. Approvals Discovery Engine...")
discover = post_json('http://127.0.0.1:8000/api/approvals/discover', {
    'sector': 'Food Processing', 'state': 'Maharashtra', 'district': 'Pune',
    'investment': 5000000, 'employees': 25, 'business_stage': 'PLANNING', 'business_activity': 'Agro'
}, demo_token)
print(f"   Discovered Approvals Count: {len(discover)}")

print("6. Document Vault & Readiness...")
docs = get_json('http://127.0.0.1:8000/api/documents', demo_token)
readiness = get_json(f"http://127.0.0.1:8000/api/documents/readiness/1?business_id={biz['id']}", demo_token)
print(f"   Vault Docs: {len(docs)} | Readiness for FSSAI: {readiness['readiness_percentage']}%")

print("7. Support Grievances...")
grievances = get_json('http://127.0.0.1:8000/api/grievances', demo_token)
print(f"   Grievance Tickets Count: {len(grievances)}")

print("8. Knowledge Base Articles...")
kb = get_json('http://127.0.0.1:8000/api/knowledge-base', demo_token)
print(f"   Regulatory Articles Count: {len(kb)}")

print("9. Officer Login & Scrutiny Caseload...")
off_auth = post_json('http://127.0.0.1:8000/api/auth/login', {'email': 'officer@example.com', 'password': 'Demo123!'})
off_token = off_auth['access_token']
queries = get_json('http://127.0.0.1:8000/api/queries', off_token)
inspections = get_json('http://127.0.0.1:8000/api/inspections', off_token)
print(f"   Officer: {off_auth['user']['full_name']} | Queries: {len(queries)} | Inspections: {len(inspections)}")

print("10. Admin Login & User/Business Directory...")
adm_auth = post_json('http://127.0.0.1:8000/api/auth/login', {'email': 'admin@example.com', 'password': 'Demo123!'})
adm_token = adm_auth['access_token']
users = get_json('http://127.0.0.1:8000/api/auth/users', adm_token)
businesses = get_json('http://127.0.0.1:8000/api/business', adm_token)
analytics = get_json('http://127.0.0.1:8000/api/analytics/dashboard', adm_token)
print(f"   Admin Users: {len(users)} | Businesses: {len(businesses)} | Total Apps: {analytics['total_applications']}")

print("\n>>> ALL 10 SUBSYSTEM VERIFICATIONS PASSED SUCCESSFULLY!")
