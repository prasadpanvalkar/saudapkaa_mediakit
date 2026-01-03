# 🚨 KYC API IMPLEMENTATION - CRITICAL ISSUES & FIXES

## QUICK SUMMARY - Read This First

You have **10 critical issues** blocking your KYC implementation. The **#1 blocking issue** is:

### ❌ WRONG DOMAIN - This breaks EVERYTHING
```
Your code:  https://api.sandbox.co.in       ← WRONG
Correct:    https://api.sandbox.code.in     ← RIGHT (note: .code.in)
```

This single mistake breaks every API call.

---

## 🎯 THE 10 CRITICAL ISSUES

### 1. ❌ BLOCKING: Wrong API Base URL
- **Your code:** `https://api.sandbox.co.in`
- **Correct:** `https://api.sandbox.code.in` (.code.in NOT .co.in)
- **Impact:** ALL API requests fail with connection errors
- **Fix:** Change in `SandboxClient.__init__()` method

### 2. ❌ BLOCKING: Missing Callback View
- **Your code:** No handler for `/kyc/callback/`
- **What happens:** DigiLocker redirects user to callback URL, gets 404 error
- **Fix:** Create `KYCCallbackView` class in views.py
- **Impact:** User can't complete KYC flow

### 3. ❌ BLOCKING: Missing Callback URL Pattern
- **Your code:** No `path('kyc/callback/', ...)` in urls.py
- **Fix:** Add the URL pattern
- **Impact:** 404 error after DigiLocker redirect

### 4. ⚠️ HIGH: Wrong Authorization Header Format
- **Your code:** `'Authorization': self.access_token`
- **Should be:** `'Authorization': f'Bearer {self.access_token}'`
- **Impact:** API returns 401 Unauthorized

### 5. ⚠️ HIGH: Unsure Endpoint Names
- **Your code uses:** `/kyc/digilocker/sessions/init`
- **Might be:** `/kyc/digilocker/sessions/initiate` (MUST verify)
- **Impact:** 404 Not Found from API
- **Fix:** Check Sandbox console for exact endpoint

### 6. ⚠️ HIGH: No Token Expiry Handling
- **Problem:** Access token valid for only 24 hours
- **Your code:** No refresh/re-auth logic
- **Impact:** Long-running requests fail with 401
- **Fix:** Track token expiry, refresh if needed

### 7. ⚠️ HIGH: No Error Differentiation
- **Your code:** Returns generic `{"code": 500, "message": "error"}`
- **Problem:** Can't tell if it's network error vs API rejection
- **Impact:** Hard to debug problems
- **Fix:** Add status-specific error handling

### 8. ⚠️ HIGH: Missing Django Settings Configuration
- **Missing in settings.py:**
  ```python
  SANDBOX_API_KEY = os.getenv('SANDBOX_API_KEY')
  SANDBOX_API_SECRET = os.getenv('SANDBOX_API_SECRET')
  SANDBOX_ENV = os.getenv('SANDBOX_ENV', 'test')
  ```
- **Impact:** Settings not available to SandboxClient
- **Fix:** Add to settings.py

### 9. ⚠️ MEDIUM: No .env Configuration
- **Your code:** Reads from settings, but settings might not have values
- **Fix:** Create `.env` file:
  ```
  SANDBOX_API_KEY=your_key_here
  SANDBOX_API_SECRET=your_secret_here
  SANDBOX_ENV=test
  ```

### 10. ⚠️ MEDIUM: Unclear Payload Structure
- **Your code:** Has `@entity`, `flow: "signin"` - unclear if correct
- **Impact:** API might reject payload
- **Fix:** Check Sandbox documentation or test in Postman

---

## ✅ WHAT YOU NEED TO DO (IN ORDER)

### Phase 1: FIX THE DOMAIN (5 minutes) ⭐ START HERE
```python
# Change this line in SandboxClient.__init__()
# FROM:
self.base_url = 'https://api.sandbox.co.in'

# TO:
self.base_url = 'https://api.sandbox.code.in'  # .code.in !
```

### Phase 2: ADD MISSING VIEWS (10 minutes)
Create `KYCCallbackView` - see corrected code in full document

### Phase 3: ADD MISSING URL PATTERNS (2 minutes)
```python
path('kyc/callback/', KYCCallbackView.as_view(), name='kyc-callback'),
```

### Phase 4: UPDATE SETTINGS (5 minutes)
Add to `settings.py`:
```python
SANDBOX_API_KEY = os.getenv('SANDBOX_API_KEY')
SANDBOX_API_SECRET = os.getenv('SANDBOX_API_SECRET')
SANDBOX_ENV = os.getenv('SANDBOX_ENV', 'test')
```

### Phase 5: CREATE .env FILE (3 minutes)
```
SANDBOX_API_KEY=your_api_key_here
SANDBOX_API_SECRET=your_api_secret_here
SANDBOX_ENV=test
```

### Phase 6: FIX AUTHORIZATION HEADER (2 minutes)
```python
# FROM:
'Authorization': self.access_token

# TO:
'Authorization': f'Bearer {self.access_token}'
```

### Phase 7: ADD CALLBACK COMPONENT (10 minutes)
Create `app/dashboard/kyc/callback/page.tsx` - see full document

---

## 🧪 TEST THESE IN ORDER

### Test 1: Authentication (CRITICAL - Do First)
```bash
curl -X POST 'https://api.sandbox.code.in/authenticate' \
  -H 'x-api-key: YOUR_KEY' \
  -H 'x-api-secret: YOUR_SECRET' \
  -H 'x-api-version: 1.0.0' \
  -H 'Content-Type: application/json'
```

**If it fails with connection error:** Domain is still wrong  
**If it fails with 401:** API key/secret is wrong  
**If it succeeds (200):** You got the response! Check logs for token.

### Test 2: Backend Only
```python
from app.sandbox_client import SandboxClient
client = SandboxClient()
result = client._authenticate()
print("Auth successful:", result)
```

### Test 3: Full Flow
1. Go to `/dashboard/kyc`
2. Click "Verify with DigiLocker"
3. Complete DigiLocker verification
4. Should redirect to `/dashboard/kyc/callback`
5. Should show success message
6. Check Django logs for verification details

---

## 🔍 DEBUGGING - When Things Still Don't Work

### Issue: Connection Error (Connection refused)
```
Diagnosis: Domain is wrong or API is down
Solution:
  1. Double-check domain: https://api.sandbox.code.in (.code.in!)
  2. Try curl command above to verify endpoint works
  3. Check if using VPN/proxy that blocks the URL
```

### Issue: 401 Unauthorized
```
Diagnosis: API key or secret is wrong
Solution:
  1. Check .env file has correct SANDBOX_API_KEY and SANDBOX_API_SECRET
  2. Check for leading/trailing whitespace in keys
  3. Log in to Sandbox console and regenerate keys if needed
  4. Use .strip() to remove whitespace
```

### Issue: 404 Not Found
```
Diagnosis: Endpoint path is wrong
Solution:
  1. Confirm endpoint name in Sandbox console
  2. Might be /initiate not /init
  3. Check Sandbox API documentation
```

### Issue: 400 Bad Request
```
Diagnosis: Payload structure is wrong
Solution:
  1. Check payload fields are correct
  2. Verify field types (array vs string)
  3. Test in Postman with exact payload
  4. Check for required fields in documentation
```

### Issue: User gets 404 after DigiLocker
```
Diagnosis: Callback view doesn't exist
Solution:
  1. Check KYCCallbackView exists in views.py
  2. Check URL pattern exists: path('kyc/callback/', ...)
  3. Check callback page component exists at correct path
```

---

## 📋 CHECKLIST - Mark Off As You Fix

**Phase 1: Critical Domain Fix**
- [ ] Changed `base_url` from `.co.in` to `.code.in`
- [ ] Verified change in code

**Phase 2: Add Missing Views**
- [ ] Created `KYCCallbackView` class
- [ ] Added `VerifyKYCStatusView` view
- [ ] Both views have proper error handling

**Phase 3: Add Missing URLs**
- [ ] Added `path('kyc/callback/', KYCCallbackView.as_view())`
- [ ] Imported KYCCallbackView in urls.py
- [ ] Tested URL registration (no import errors)

**Phase 4: Settings Configuration**
- [ ] Added SANDBOX_API_KEY to settings
- [ ] Added SANDBOX_API_SECRET to settings
- [ ] Added SANDBOX_ENV to settings

**Phase 5: Environment Variables**
- [ ] Created .env file in project root
- [ ] Set SANDBOX_API_KEY (actual value)
- [ ] Set SANDBOX_API_SECRET (actual value)
- [ ] Set SANDBOX_ENV=test

**Phase 6: Authorization Header**
- [ ] Updated all Authorization headers to use `Bearer {token}`
- [ ] Tested authentication endpoint

**Phase 7: Frontend Callback**
- [ ] Created callback page at `/app/dashboard/kyc/callback/page.tsx`
- [ ] Handles loading state
- [ ] Handles success state
- [ ] Handles error state

**Testing**
- [ ] Authentication endpoint works (curl test passed)
- [ ] Backend can authenticate (Python test passed)
- [ ] Full KYC flow works (user can complete it)
- [ ] Callback page shows success message

---

## 📌 KEY POINTS TO REMEMBER

1. **The domain is `.code.in` not `.co.in`** - Check this 3 times!
2. **Create the callback view** - Without it, users get 404 after DigiLocker
3. **Add callback URL pattern** - The view needs a URL to respond to
4. **Use Bearer token format** - `Bearer {token}` not just `{token}`
5. **Check Django logs** - They tell you exactly what's wrong
6. **Test authentication first** - Before testing full flow
7. **Store entity_id in session** - You need it in the callback
8. **Add .env file** - Settings need to read from environment

---

## 🆘 STILL NOT WORKING?

If after all fixes it still doesn't work:

1. **Check Django logs** - Run: `tail -f logs/kyc.log`
2. **Check browser console** - Press F12 in browser
3. **Test endpoint with curl** - Use the curl command above
4. **Review error message** - What's the exact error?
5. **Check .env file** - Is it being read?
6. **Verify API keys** - Are they correct in Sandbox console?
7. **Check domain spelling** - `.code.in` NOT `.co.in`

If you still need help, share:
- The exact error message from Django logs
- The curl test result
- Your updated code (sanitize API keys)
- What step fails (auth, initiate, callback, status check)

---

## 📞 QUICK REFERENCE

| Issue | Fix |
|-------|-----|
| Connection error | Change domain to `.code.in` |
| 401 Unauthorized | Check API keys in .env |
| 404 Not Found | Verify endpoint name, check URL patterns |
| No callback handler | Create KYCCallbackView |
| User gets 404 after DigiLocker | Add callback URL pattern |
| Token refresh fails | Add token expiry tracking |
| Can't debug | Enable logging, check logs |

---

## 🎯 MOST IMPORTANT: THE DOMAIN

Your code currently breaks because you're using the wrong domain.

**CHANGE THIS:**
```python
self.base_url = 'https://api.sandbox.co.in'
```

**TO THIS:**
```python
self.base_url = 'https://api.sandbox.code.in'
```

Do this first. It fixes half your problems immediately.

---

**Document Status:** Ready to implement  
**Estimated Time to Fix:** 30-45 minutes  
**Difficulty:** Medium (mostly adding missing pieces)  

Good luck! You've got this. 🚀
