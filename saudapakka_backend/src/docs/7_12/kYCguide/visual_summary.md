# KYC API IMPLEMENTATION - VISUAL ANALYSIS & SOLUTION MAP

## 🎯 THE 10 ISSUES AT A GLANCE

```
┌─────────────────────────────────────────────────────────────────┐
│ ISSUE PRIORITY MATRIX                                           │
└─────────────────────────────────────────────────────────────────┘

BLOCKING (FIXES IMMEDIATELY):
├─ #1  ❌ DOMAIN: .co.in → .code.in (API won't even connect)
├─ #2  ❌ NO CALLBACK VIEW (404 after DigiLocker)
└─ #3  ❌ NO CALLBACK URL (no endpoint to handle redirect)

HIGH PRIORITY (FIX NEXT):
├─ #4  ⚠️  BEARER TOKEN: Missing "Bearer" in header
├─ #5  ⚠️  ENDPOINT NAMES: /init vs /initiate (needs verification)
├─ #6  ⚠️  TOKEN EXPIRY: No refresh after 24 hours
└─ #7  ⚠️  ERROR HANDLING: Can't tell what's wrong

MEDIUM PRIORITY (FIX AFTER):
├─ #8  📋 SETTINGS: SANDBOX_API_KEY not configured
├─ #9  📋 ENV FILE: No .env file created
└─ #10 📋 PAYLOAD: Uncertain about field names
```

---

## 🔄 EXECUTION FLOW - CURRENT vs CORRECT

### CURRENT FLOW (BROKEN)
```
User clicks "Verify"
    ↓
Frontend calls /api/kyc/initiate/
    ↓
Backend tries to authenticate
    ↓ ❌ CONNECTION FAILS (wrong domain: .co.in)
    ↓
No session created
    ↓
User never gets redirect link
    ↓
❌ STOPS HERE - User sees connection error
```

### CORRECT FLOW (AFTER FIXES)
```
User clicks "Verify with DigiLocker"
    ↓
Frontend calls /api/kyc/initiate/
    ↓ POST {redirect_url: "..."}
Backend creates SandboxClient
    ↓
Backend authenticates (domain: .code.in) ✅
    ↓ Gets access_token
Backend initiates DigiLocker session
    ↓ Gets entity_id & authorization_url
Backend stores entity_id in session
    ↓
Frontend receives authorization_url
    ↓
Frontend redirects user to DigiLocker
    ↓ User completes Aadhaar verification
DigiLocker redirects to /dashboard/kyc/callback
    ↓
Backend callback view is triggered ✅
    ↓
Backend fetches KYC status with entity_id
    ↓ Gets user data
Backend stores KYC data in UserProfile
    ↓
Frontend callback page shows success ✅
    ↓
✅ COMPLETE - User is verified
```

---

## 📊 ISSUE SEVERITY & FIX TIME

```
╔════════════╦═════════╦════════════╦═══════════════╗
║ Issue      ║ Severity║ Time to Fix║ Impact        ║
╠════════════╬═════════╬════════════╬═══════════════╣
║ Domain     ║ 🔴 P0   ║ 1 min      ║ Nothing works ║
║ Callback   ║ 🔴 P0   ║ 5 min      ║ 404 error     ║
║ URL        ║ 🔴 P0   ║ 1 min      ║ 404 error     ║
║ Bearer     ║ 🟡 P1   ║ 2 min      ║ 401 error     ║
║ Endpoints  ║ 🟡 P1   ║ 5 min      ║ 404 error     ║
║ Expiry     ║ 🟡 P1   ║ 5 min      ║ Fails after   ║
║ Handling   ║ 🟡 P1   ║ 10 min     ║ Can't debug   ║
║ Settings   ║ 🟢 P2   ║ 3 min      ║ Keys not set  ║
║ .env       ║ 🟢 P2   ║ 2 min      ║ Keys missing  ║
║ Payload    ║ 🟢 P2   ║ 3 min      ║ Might reject  ║
╚════════════╩═════════╩════════════╩═══════════════╝

TOTAL TIME: ~25 minutes to fix everything
CRITICAL PATH: 7 minutes (P0 issues only)
```

---

## 🗺️ CODE CHANGE LOCATIONS MAP

```
PROJECT ROOT
│
├── django_project/
│   └── settings.py ...................... [ADD] SANDBOX_API_KEY, SECRET, ENV
│
├── api/
│   ├── sandbox_client.py ................ [CHANGE] base_url domain
│   ├── views.py
│   │   ├── InitiateKYCView .............. [EXISTS - MODIFY]
│   │   ├── KYCCallbackView .............. [ADD NEW]
│   │   └── VerifyKYCStatusView .......... [EXISTS - MODIFY]
│   │
│   ├── urls.py
│   │   ├── path('kyc/initiate/', ...) ... [EXISTS]
│   │   ├── path('kyc/callback/', ...) ... [ADD NEW]
│   │   └── path('kyc/verify-status/', ..) [EXISTS]
│   │
│   ├── models.py
│   │   └── UserProfile .................. [ADD] kyc_verified, kyc_data fields
│   │
│   └── migrations/
│       └── [AUTO-GENERATED after model changes]
│
├── frontend/
│   ├── app/dashboard/kyc/page.tsx ....... [EXISTS - MODIFY if needed]
│   └── app/dashboard/kyc/callback/
│       └── page.tsx ..................... [CREATE NEW]
│
├── .env ................................ [CREATE NEW]
├── .gitignore ........................... [MODIFY] Add .env, logs/
└── logs/ ............................... [AUTO-CREATED] For logging
```

---

## 🔍 BEFORE & AFTER CODE COMPARISON

### Issue #1: DOMAIN

```python
# ❌ BEFORE (WRONG)
self.base_url = 'https://api.sandbox.co.in'

# ✅ AFTER (CORRECT)
sandbox_env = getattr(settings, 'SANDBOX_ENV', 'test')
if sandbox_env == 'test':
    self.base_url = 'https://test-api.sandbox.code.in'
else:
    self.base_url = 'https://api.sandbox.code.in'
```

### Issue #2 & #3: MISSING CALLBACK

```python
# ❌ BEFORE - NO CALLBACK VIEW
# User gets 404 when DigiLocker redirects

# ✅ AFTER - ADD CALLBACK VIEW
class KYCCallbackView(APIView):
    def get(self, request):
        entity_id = request.session.get('kyc_entity_id')
        # ... fetch KYC status ...
        # ... save to UserProfile ...
        return Response({'verified': True})

# ✅ AFTER - ADD URL PATTERN
urlpatterns = [
    path('kyc/callback/', KYCCallbackView.as_view()),
]
```

### Issue #4: BEARER TOKEN

```python
# ❌ BEFORE (WRONG)
headers = {
    'Authorization': self.access_token
}

# ✅ AFTER (CORRECT)
headers = {
    'Authorization': f'Bearer {self.access_token}'
}
```

### Issue #8: MISSING SETTINGS

```python
# ❌ BEFORE - NO CONFIGURATION
# os.getenv() called but nothing set in settings

# ✅ AFTER - SETTINGS CONFIGURED
import os
SANDBOX_API_KEY = os.getenv('SANDBOX_API_KEY', '').strip()
SANDBOX_API_SECRET = os.getenv('SANDBOX_API_SECRET', '').strip()
SANDBOX_ENV = os.getenv('SANDBOX_ENV', 'test')
```

---

## 🧪 TEST PROGRESSION

```
LEVEL 1: ENDPOINT TEST (Is the domain correct?)
├─ Test: curl -X POST https://api.sandbox.code.in/authenticate
├─ Expected: 200 with access_token
├─ Fails if: Domain is wrong, API down, network issue
└─ Fix: Update domain to .code.in

LEVEL 2: DJANGO SHELL TEST (Can we auth from Python?)
├─ Test: 
│   from api.sandbox_client import SandboxClient
│   client = SandboxClient()
│   print(client._authenticate())
├─ Expected: True
├─ Fails if: API keys wrong, settings not configured
└─ Fix: Check .env and settings.py

LEVEL 3: API ENDPOINT TEST (Does backend endpoint work?)
├─ Test: POST /api/kyc/initiate/ with redirect_url
├─ Expected: {"entity_id": "...", "digilocker_url": "..."}
├─ Fails if: View doesn't exist, auth fails, payload wrong
└─ Fix: Create/update InitiateKYCView

LEVEL 4: DIGILOCKER FLOW TEST (Full user journey)
├─ Test: Click "Verify" → Redirect to DigiLocker → Complete auth
├─ Expected: Redirect to /dashboard/kyc/callback → Success
├─ Fails if: Callback view missing, session not stored
└─ Fix: Create KYCCallbackView and URL pattern

LEVEL 5: DATABASE TEST (Is KYC data saved?)
├─ Test: Check UserProfile.kyc_verified = True
├─ Expected: User marked as verified in database
├─ Fails if: Model doesn't have kyc fields
└─ Fix: Add kyc_* fields to UserProfile model
```

---

## 🎯 DEBUGGING DECISION TREE

```
                    Is KYC broken?
                            │
                ┌───────────┴───────────┐
                │                       │
          Get error from            Check logs
          frontend console
                │                       │
       ┌────────┴────────┐     tail -f logs/kyc.log
       │                 │
   Connection      Authentication
   Error            Error
       │                 │
       │             ┌───┴────┐
       │             │        │
       │         401     Other error
       │         │       │
  Domain    Keys wrong  Check
  wrong?       │      message
      │    Check .env
      │        │
      │    Fixed!
      │
   Fixed!


DOMAIN ERROR:
├─ URL shows: api.sandbox.co.in ❌
├─ Fix to: api.sandbox.code.in ✅
└─ Test: curl endpoint

401 UNAUTHORIZED:
├─ Problem: API keys wrong
├─ Check: .env file has real keys
├─ Fix: Update .env with correct keys
└─ Verify: Keys from Sandbox console

404 NOT FOUND:
├─ Problem: Endpoint path wrong OR callback handler missing
├─ Check: Does URL pattern exist?
├─ Fix: Add callback URL pattern
└─ Verify: grep 'kyc/callback' urls.py

NO SESSION DATA:
├─ Problem: entity_id not stored in session
├─ Check: InitiateKYCView stores entity_id?
├─ Fix: Add request.session['kyc_entity_id'] = ...
└─ Verify: Check session storage code

USER GETS 404 AFTER DIGILOCKER:
├─ Problem: No callback view/URL
├─ Check: Does /kyc/callback/ URL exist?
├─ Fix: Add KYCCallbackView and URL pattern
└─ Verify: path('kyc/callback/', ...) in urls.py
```

---

## 📈 PROGRESS TRACKER

```
PHASE 1: Domain & Settings (10 minutes)
└─ [_] Fix base_url: .co.in → .code.in
└─ [_] Create .env file
└─ [_] Add settings to settings.py
└─ [_] Test authentication with curl
└─ [_] Test auth in Django shell

PHASE 2: Add Missing Callback (10 minutes)
└─ [_] Create KYCCallbackView
└─ [_] Add callback URL pattern
└─ [_] Create callback component (frontend)
└─ [_] Test endpoint exists (HTTP GET)
└─ [_] Check session storage works

PHASE 3: Improve Code Quality (5 minutes)
└─ [_] Update Bearer token format
└─ [_] Add error handling
└─ [_] Add logging
└─ [_] Update models (if needed)

PHASE 4: Full Integration Test (5 minutes)
└─ [_] Test: Initiate → Redirect → Callback
└─ [_] Test: User marked as verified
└─ [_] Test: KYC data saved to database
└─ [_] Test: Success message shown

TOTAL ESTIMATED TIME: 30 minutes
```

---

## ✅ SUCCESS CRITERIA

Your implementation is working when:

1. ✅ `/api/kyc/initiate/` returns `{"entity_id": "...", "digilocker_url": "..."}`
2. ✅ User is redirected to DigiLocker successfully
3. ✅ DigiLocker redirects back to `/dashboard/kyc/callback`
4. ✅ Callback page shows "Verification successful"
5. ✅ Database shows `UserProfile.kyc_verified = True`
6. ✅ KYC data is stored in `UserProfile.kyc_data`
7. ✅ No errors in logs (only ✓ symbols)
8. ✅ Full flow works without manual intervention

---

## 📞 SUPPORT MATRIX

| Issue | Solution |
|-------|----------|
| Connection timeout | Check domain: `.code.in` |
| 401 Unauthorized | Check API keys in `.env` |
| 404 Not Found | Check endpoint/URL exists |
| No callback handler | Create `KYCCallbackView` |
| Session missing | Store `entity_id` in session |
| User never redirects | Check `digilocker_url` in response |
| User gets 404 after DigiLocker | Add callback URL pattern |
| KYC data not saved | Check UserProfile model |
| Logs not appearing | Check logging configuration |
| Token expires | Add refresh/re-auth logic |

---

## 🚀 FINAL CHECKLIST

```
PRE-IMPLEMENTATION:
[_] Read QUICK_START_FIX.md (5 min)
[_] Understand the 3 blocking issues
[_] Have API keys from Sandbox console ready

IMPLEMENTATION:
[_] Fix domain (.code.in) - 1 min
[_] Create .env file - 1 min
[_] Update settings.py - 1 min
[_] Create KYCCallbackView - 5 min
[_] Add callback URL - 1 min
[_] Update Bearer token format - 2 min
[_] Create callback page (frontend) - 5 min

TESTING:
[_] Test curl endpoint - 2 min
[_] Test Django shell auth - 2 min
[_] Test /api/kyc/initiate/ - 3 min
[_] Test full flow (user perspective) - 5 min

VERIFICATION:
[_] Check Django logs (no errors)
[_] Check database (user marked verified)
[_] Check KYC data saved
[_] All tests pass

TOTAL TIME: ~35 minutes
DIFFICULTY: Medium (mostly copy-paste with understanding)
```

---

**Document Status:** Complete Implementation Guide  
**Last Updated:** January 3, 2026  
**For:** Full-stack developers using Django + React/Next.js  
**Difficulty Level:** ⭐⭐ Medium  
**Time Estimate:** 30-45 minutes  

**Start with:** `QUICK_START_FIX.md` (5 minutes)  
**Then follow:** `kyc_fix_guide.md` (detailed)  
**Reference:** `corrected_code_reference.py` (code)  
