import os
import requests
import logging
from django.conf import settings

logger = logging.getLogger(__name__)

class SandboxClient:
    def __init__(self):
        self.api_key = settings.SANDBOX_API_KEY
        self.api_secret = settings.SANDBOX_API_SECRET
        self.base_url = 'https://api.sandbox.co.in'
        self.access_token = None

    def _authenticate(self):
        """Step 1: Get JWT Access Token (Valid for 24 hours)"""
        url = f"{self.base_url}/authenticate"
        headers = {
            'x-api-key': self.api_key,
            'x-api-secret': self.api_secret,
            'x-api-version': '1.0',
            'Content-Type': 'application/json'
        }
        try:
            response = requests.post(url, headers=headers, timeout=15)
            if response.status_code == 200:
                # The token is usually inside data -> access_token
                self.access_token = response.json().get('data', {}).get('access_token')
                return True
            logger.error(f"Sandbox Auth Failed: {response.text}")
            return False
        except Exception as e:
            logger.error(f"Sandbox Auth Exception: {e}")
            return False

    def initiate_digilocker(self, redirect_url):
        """Step 2: Start DigiLocker Session"""
        if not self.access_token and not self._authenticate():
            return {'code': 500, 'message': 'Authentication failed'}

        url = f"{self.base_url}/kyc/digilocker/sessions/init"
        payload = {
            "@entity": "in.co.sandbox.kyc.digilocker.session.request",
            "flow": "signin",
            "doc_types": ["aadhaar"],
            "redirect_url": redirect_url
        }
        headers = {
            'Authorization': self.access_token, # No 'Bearer' prefix needed for Sandbox JWT
            'x-api-key': self.api_key,
            'Content-Type': 'application/json'
        }
        try:
            response = requests.post(url, json=payload, headers=headers, timeout=20)
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

        # Endpoint to fetch the document directly
        url = f"{self.base_url}/kyc/digilocker/sessions/{entity_id}/documents/aadhaar"
        headers = {
            'Authorization': self.access_token,
            'x-api-key': self.api_key
        }
        try:
            response = requests.get(url, headers=headers, timeout=20)
            return {'code': response.status_code, 'data': response.json()}
        except Exception as e:
            return {'code': 500, 'message': str(e)}