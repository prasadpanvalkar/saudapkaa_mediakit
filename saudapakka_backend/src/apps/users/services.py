import os
import requests
import logging
from django.conf import settings

logger = logging.getLogger(__name__)

class SandboxClient:
    def __init__(self):
        self.api_key = settings.SANDBOX_API_KEY.strip() if settings.SANDBOX_API_KEY else None
        self.api_secret = settings.SANDBOX_API_SECRET.strip() if settings.SANDBOX_API_SECRET else None
        
        # FIX: Using test-api for test API keys
        # Production keys should use api.sandbox.co.in
        self.sandbox_env = getattr(settings, 'SANDBOX_ENV', 'test')
        if self.sandbox_env == 'production':
            self.base_url = 'https://api.sandbox.co.in'
        else:
            self.base_url = 'https://test-api.sandbox.co.in'  # Test environment
        
        self.access_token = None

    def _authenticate(self):
        """Step 1: Get JWT Access Token (Valid for 24 hours)"""
        url = f"{self.base_url}/authenticate"
        
        # DEBUG: Check for whitespace formatting issues
        if self.api_key:
             logger.info(f"DEBUG: API Key length: {len(self.api_key)}")
        if self.api_secret:
             logger.info(f"DEBUG: API Secret length: {len(self.api_secret)}")

        headers = {
            'x-api-key': self.api_key,
            'x-api-secret': self.api_secret,
            'x-api-version': '1.0.0', 
            'Content-Type': 'application/json'
        }
        try:
            print(f"DEBUG: Authenticating with {url}", flush=True)
            response = requests.post(url, headers=headers, timeout=15)
            print(f"DEBUG: Auth Response ({response.status_code}): {response.text}", flush=True)
            
            if response.status_code == 200:
                # The token is usually inside data -> access_token
                self.access_token = response.json().get('data', {}).get('access_token')
                return True
            
            return False
        except Exception as e:
            logger.error(f"Sandbox Auth Exception: {e}")
            return False

    def initiate_digilocker(self, redirect_url):
        """Step 2: Start DigiLocker Session"""
        if not self.access_token and not self._authenticate():
             return {'code': 500, 'message': 'Authentication failed'}

        # FIX: Check endpoint name (init vs initiate). Visual summary says check console. 
        # For now, using what was there but adding logging.
        # Guide said "Might be /initiate". I will keep /init for now but log heavily.
        # Actually visual summary says: "Issue 5: /init vs /initiate (needs verification)"
        # I'll stick to existing unless I get 404.
        url = f"{self.base_url}/kyc/digilocker/sessions/init"
        
        payload = {
            "@entity": "in.co.sandbox.kyc.digilocker.session.request",
            "flow": "signin",
            "doc_types": ["aadhaar"],
            "redirect_url": redirect_url
        }
        
        # FIX: Sandbox API does NOT use Bearer prefix - just raw token
        headers = {
            'Authorization': self.access_token, 
            'x-api-key': self.api_key,
            'x-api-version': '1.0.0',
            'Content-Type': 'application/json'
        }
        try:
            print(f"DEBUG: Initiating KYC with headers: {headers}", flush=True)
            response = requests.post(url, json=payload, headers=headers, timeout=20)
            print(f"DEBUG: Initiate Response ({response.status_code}): {response.text}", flush=True)
            
            data = response.json()
            if response.status_code == 200:
                return {
                    'code': 200,
                    'data': {
                        'entity_id': data['data']['session_id'],
                        'digilocker_url': data['data']['authorization_url']
                    }
                }
            return {'code': response.status_code, 'message': data.get('message')}
        except Exception as e:
            return {'code': 500, 'message': str(e)}

    def get_kyc_status(self, entity_id):
        """Step 3: Fetch Aadhaar Data"""
        if not self.access_token and not self._authenticate():
             return {'code': 500, 'message': 'Auth failed'}

        # Try standard 'aadhaar'
        url = f"{self.base_url}/kyc/digilocker/sessions/{entity_id}/documents/aadhaar"
        
        # FIX: Sandbox API does NOT use Bearer prefix - just raw token
        headers = {
            'Authorization': self.access_token,
            'x-api-key': self.api_key,
            'x-api-version': '1.0.0',
            'Content-Type': 'application/json'
        }
        print(f"DEBUG: Requesting {url}", flush=True)
        print(f"DEBUG: Headers: {headers}", flush=True)
        
        try:
            response = requests.get(url, headers=headers, timeout=20)
            print(f"DEBUG: Response 1 ({response.status_code}): {response.text}", flush=True)

            if response.status_code == 200:
                return {'code': 200, 'data': response.json()}
            
            # Print explicit error message if available
            try:
                err_msg = response.json().get('message', 'No message')
                print(f"DEBUG: API Error Message: {err_msg}", flush=True)
            except:
                pass
            
            # Fallback to 'ADHAR'
            url_fallback = f"{self.base_url}/kyc/digilocker/sessions/{entity_id}/documents/ADHAR"
            response_fallback = requests.get(url_fallback, headers=headers, timeout=20)
            print(f"DEBUG: Response 2 ({response_fallback.status_code}): {response_fallback.text}", flush=True)
            
            return {'code': response_fallback.status_code, 'data': response_fallback.json()}
            
        except Exception as e:
            print(f"DEBUG: Sandbox Request Exception: {e}", flush=True)
            return {'code': 500, 'message': str(e)}