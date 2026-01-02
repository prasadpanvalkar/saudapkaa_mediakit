from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, KYCVerification, BrokerProfile

@admin.register(User)
class CustomUserAdmin(BaseUserAdmin):
    list_display = ('email', 'first_name', 'last_name', 'phone_number', 'is_active_seller', 'is_active_broker')

admin.site.register(KYCVerification)
admin.site.register(BrokerProfile)