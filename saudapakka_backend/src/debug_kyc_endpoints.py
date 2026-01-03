
import os
import sys
import django
import requests

sys.path.append('/app')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'saudapakka.settings')
django.setup()

from django.conf import settings

api_key = settings.SANDBOX_API_KEY.strip()
api_secret = settings.SANDBOX_API_SECRET.strip()

base_url = "https://api.sandbox.co.in"
# Use a clearly fake ID to test route existence, not data validity
fake_id = "00000000-0000-0000-0000-000000000000"

# Authenticate first
print("Authenticating...")
auth_url = f"{base_url}/authenticate"
auth_headers = {
    'x-api-key': api_key,
    'x-api-secret': api_secret,
    'x-api-version': '1.0.0',
    'Content-Type': 'application/json'
}
auth_res = requests.post(auth_url, headers=auth_headers)
if auth_res.status_code != 200:
    print(f"Auth Failed: {auth_res.status_code} {auth_res.text}")
    sys.exit(1)

access_token = auth_res.json().get('data', {}).get('access_token')
print("Authenticated.")

def probe(url_suffix, method='GET'):
    url = f"{base_url}{url_suffix}"
    headers = {
        'x-api-key': api_key,
        'Authorization': f"Bearer {access_token}",
        'x-api-version': '1.0.0',
        'Content-Type': 'application/json'
    }
    try:
        if method == 'GET':
            res = requests.get(url, headers=headers, timeout=5)
        else:
            res = requests.post(url, headers=headers, json={}, timeout=5)
            
        print(f"Result: {url_suffix} -> {res.status_code}")
        print(f"    Res: {res.text[:100]}") # Show small part of response
    except Exception as e:
        print(f"Error: {e}")

# Test 1: aadhaar (Current)
probe(f"/kyc/digilocker/sessions/{fake_id}/documents/aadhaar")

# Test 2: ADHAR (Possible correct one)
probe(f"/kyc/digilocker/sessions/{fake_id}/documents/ADHAR")

# Test 3: adhar 
probe(f"/kyc/digilocker/sessions/{fake_id}/documents/adhar")

# Test 4: List Documents (if supported)
probe(f"/kyc/digilocker/sessions/{fake_id}/documents")
