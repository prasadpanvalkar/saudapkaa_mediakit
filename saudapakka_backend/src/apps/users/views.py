import random
import logging
from django.conf import settings
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.db.models import Q
from django.core.mail import EmailMultiAlternatives
from django.utils.html import strip_tags

from rest_framework import status, permissions, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken

# Internal App Imports
from .models import KYCVerification, BrokerProfile
from .serializers import UserSerializer
from .services import SandboxClient
from apps.properties.models import Property



User = get_user_model()
logger = logging.getLogger(__name__)

# Initialize Sandbox AWS-Powered Client
# This client handles the AWS SigV4 signing to prevent 403/400 errors
sandbox = SandboxClient()

# --- 1. AUTHENTICATION VIEWS ---

class SendOtpView(APIView):
    """Generates a 6-digit OTP and sends it via SaudaPakka branded email."""
    permission_classes = [AllowAny]
    
    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({'error': 'Email is required'}, status=400)

        otp = str(random.randint(100000, 999999))
        user, created = User.objects.get_or_create(email=email, defaults={'username': email})
        
        user.otp = otp
        user.otp_created_at = timezone.now()
        user.save()
        
        # Professional Email Template
        subject = f"{otp} is your SaudaPakka verification code"
        html_content = f"""
            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h2 style="color: #2D3FE2;">SaudaPakka</h2>
                <p>Your verification code is:</p>
                <h1 style="letter-spacing: 5px; color: #1a1a1a;">{otp}</h1>
                <p style="color: #666; font-size: 12px;">Valid for 5 minutes.</p>
            </div>
        """
        
        try:
            msg = EmailMultiAlternatives(subject, strip_tags(html_content), settings.DEFAULT_FROM_EMAIL, [email])
            msg.attach_alternative(html_content, "text/html")
            msg.send()
            return Response({'message': 'OTP sent successfully'})
        except Exception as e:
            logger.error(f"Email Error: {e}")
            return Response({'error': 'Failed to send email'}, status=500)

class VerifyOtpView(APIView):
    """Verifies OTP and returns JWT tokens + User details."""
    permission_classes = [AllowAny]
    
    def post(self, request):
        email = request.data.get('email')
        otp = request.data.get('otp')
        
        try:
            user = User.objects.get(email=email)
            # Check OTP match and 5-minute expiry
            if user.otp == otp and (timezone.now() - user.otp_created_at).total_seconds() < 300:
                user.otp = None # Clear OTP after success
                user.save()
                
                refresh = RefreshToken.for_user(user)
                return Response({
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                    'user': UserSerializer(user).data
                })
            return Response({'error': 'Invalid or expired OTP'}, status=400)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=404)

# --- 2. PROFILE & SEARCH VIEWS ---

class UserProfileView(APIView):
    """Retrieve or partially update current authenticated user profile."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

class SearchProfileView(generics.ListAPIView):
    """Publicly searchable directory of verified Brokers or Sellers."""
    permission_classes = [AllowAny]
    serializer_class = UserSerializer

    def get_queryset(self):
        query = self.request.query_params.get('query', '')
        role = self.request.query_params.get('role', 'BROKER')
        
        qs = User.objects.all()
        if role == 'BROKER':
            qs = qs.filter(is_active_broker=True)
        elif role == 'SELLER':
            qs = qs.filter(is_active_seller=True)
            
        if query:
            # Search across first_name, last_name, and email
            qs = qs.filter(
                Q(first_name__icontains=query) | 
                Q(last_name__icontains=query) | 
                Q(email__icontains=query)
            )
        return qs

# --- 3. REAL SANDBOX KYC FLOW ---

class InitiateKYCView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        redirect_url = request.data.get('redirect_url')
        result = sandbox.initiate_digilocker(redirect_url)
        
        if result.get('code') == 200:
            # FIX: Store entity_id in session as per guide
            request.session['kyc_entity_id'] = result['data']['entity_id']
            
            KYCVerification.objects.update_or_create(
                user=request.user,
                defaults={'request_id': result['data']['entity_id'], 'status': 'INITIATED'}
            )
            return Response(result['data'])
        
        # Log error detail for you
        print(f"❌ SANDBOX ERROR: {result}")
        return Response({"error": result.get('message', "Forbidden")}, status=403)

class KYCCallbackView(APIView):
    """
    Handles the redirect from DigiLocker.
    Even though Frontend handles the main flow, this endpoint prevents 404s 
    if the redirect hits the backend directly.
    """
    permission_classes = [AllowAny] # Callback might not have auth headers if browser redirect

    def get(self, request):
        print("DEBUG: KYCCallbackView hit!", flush=True)
        # We can try to rely on session if cookie is present, but usually 
        # for detached callbacks we just return a success page or JSON.
        # Since frontend handles the verification, we just confirm receipt.
        return Response({
            "status": "Target Reached", 
            "message": "Please close this window and return to the dashboard if not redirected automatically."
        })

class VerifyKYCStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        entity_id = request.data.get('entity_id')
        print(f"DEBUG: VerifyKYCStatusView received entity_id: {entity_id}", flush=True)
        
        if not entity_id:
            return Response({"error": "entity_id is required"}, status=400)

        result = sandbox.get_kyc_status(entity_id)
        print(f"DEBUG: Sandbox result: {result}", flush=True)
        
        # 1. Check if Sandbox returned a "Processing" status
        # Note: Sandbox might return a 202 status code or a message like yours
        if result.get('code') == 202 or "processing" in result.get('message', '').lower():
            return Response({
                "status": "PROCESSING",
                "message": "User authorized, but data is still being fetched from DigiLocker. Please retry in 3-5 seconds."
            }, status=202)

        # 2. Check for success (200)
        if result.get('code') == 200:
            raw_data = result.get('data', {})
            # Use .get() to avoid KeyErrors if the structure is slightly different
            aadhaar = raw_data.get('data', {}).get('aadhaar_data', {})

            if not aadhaar:
                return Response({"status": "PROCESSING", "message": "Aadhaar data not yet available."}, status=202)

            # --- DATA IS READY: SAVE TO DB ---
            try:
                kyc = KYCVerification.objects.get(user=request.user)
                kyc.full_name = aadhaar.get('name')
                kyc.dob = aadhaar.get('dob')
                kyc.address_json = aadhaar.get('address')
                kyc.status = 'VERIFIED'
                kyc.save()
                
                # Sync User Model
                user = request.user
                name_parts = kyc.full_name.split(' ')
                user.first_name = name_parts[0]
                if len(name_parts) > 1:
                    user.last_name = name_parts[-1]
                user.save()

                return Response({
                    "status": "SUCCESS",
                    "message": "Identity Verified Successfully!",
                    "data": {"name": kyc.full_name}
                })
            except KYCVerification.DoesNotExist:
                return Response({"error": "KYC session mismatch."}, status=404)
            
        return Response({
            "status": "FAILED",
            "error": result.get('message', "Verification failed."),
            "upstream_response": result
        }, status=400)
# --- 4. ROLE UPGRADES ---

class UpgradeRoleView(APIView):
    """Allows KYC-verified users to become active Sellers or Brokers."""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        role = request.data.get('role')
        
        # Security: Force KYC completion before role upgrade
        try:
            kyc = request.user.kycverification
            if kyc.status != 'VERIFIED':
                return Response({"error": "Please complete KYC verification first."}, status=400)
        except KYCVerification.DoesNotExist:
            return Response({"error": "No KYC record found for this user."}, status=400)

        if role == 'SELLER':
            request.user.is_active_seller = True
        elif role == 'BROKER':
            request.user.is_active_broker = True
            BrokerProfile.objects.get_or_create(user=request.user)
        else:
            return Response({"error": "Invalid role type. Choose 'SELLER' or 'BROKER'."}, status=400)
            
        request.user.save()
        return Response({"message": f"Congratulations! You are now a verified {role.lower()}"})

# --- 5. ADMIN DASHBOARD ---

class AdminDashboardStats(APIView):
    """Aggregate business metrics for the platform administrator."""
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        return Response({
            "user_metrics": {
                "total": User.objects.count(),
                "sellers": User.objects.filter(is_active_seller=True).count(),
                "brokers": User.objects.filter(is_active_broker=True).count(),
                "kyc_completed": KYCVerification.objects.filter(status='VERIFIED').count()
            },
            "property_metrics": {
                "total": Property.objects.count(),
                "verified": Property.objects.filter(verification_status='VERIFIED').count(),
                "pending": Property.objects.filter(verification_status='PENDING').count()
            },
            "server_info": {
                "timezone": settings.TIME_ZONE,
                "current_time": timezone.now()
            }
        })