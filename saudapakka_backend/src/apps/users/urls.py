from django.urls import path
from .views import (
    SendOtpView, VerifyOtpView, InitiateKYCView, 
    VerifyKYCStatusView, UpgradeRoleView, SearchProfileView, 
    AdminDashboardStats, UserProfileView, KYCCallbackView
)

urlpatterns = [
    path('auth/login/', SendOtpView.as_view(), name='login-otp'),
    path('auth/verify/', VerifyOtpView.as_view(), name='verify-otp'),
    path('user/me/', UserProfileView.as_view(), name='user-profile'),
    path('user/upgrade/', UpgradeRoleView.as_view(), name='upgrade-role'),
    path('search-profiles/', SearchProfileView.as_view(), name='search-profiles'),
    path('admin/stats/', AdminDashboardStats.as_view(), name='admin-stats'),
    path('kyc/initiate/', InitiateKYCView.as_view(), name='kyc-initiate'),
    path('kyc/callback/', KYCCallbackView.as_view(), name='kyc-callback'),
    path('kyc/verify-status/', VerifyKYCStatusView.as_view(), name='kyc-verify-status'),
]