import uuid
from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # --- MANDATORY FIELDS ---
    # We set blank=False and null=False to ensure these are never empty
    email = models.EmailField(unique=True, blank=False, null=False)
    first_name = models.CharField(max_length=150, blank=False, null=False)
    last_name = models.CharField(max_length=150, blank=False, null=False)
    phone_number = models.CharField(max_length=15, unique=True, blank=False, null=False)
    
    # Roles
    is_active_seller = models.BooleanField(default=False)
    is_active_broker = models.BooleanField(default=False)
     
    # OTP Fields
    otp = models.CharField(max_length=6, blank=True, null=True)
    otp_created_at = models.DateTimeField(blank=True, null=True)

    # Authentication Configuration
    USERNAME_FIELD = 'email'
    # These fields are required when running 'python manage.py createsuperuser'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name', 'phone_number']

    # Fix for group/permission clashes
    groups = models.ManyToManyField(
        'auth.Group', 
        related_name='custom_user_set', 
        blank=True
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission', 
        related_name='custom_user_set', 
        blank=True
    )

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.email})"

class KycVerification(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    # New field to track Sandbox session
    sandbox_request_id = models.CharField(max_length=255, blank=True, null=True)
    
    # Verified data from DigiLocker
    aadhaar_number = models.CharField(max_length=12, blank=True)
    full_name = models.CharField(max_length=255, blank=True)
    dob = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=10, blank=True)
    address_json = models.JSONField(default=dict, blank=True)
    
    status = models.CharField(max_length=20, choices=[
        ('NOT_STARTED', 'Not Started'),
        ('INITIATED', 'Initiated'),
        ('VERIFIED', 'Verified'),
        ('FAILED', 'Failed')
    ], default='NOT_STARTED')
    
    updated_at = models.DateTimeField(auto_now=True)

class BrokerProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    services_offered = models.JSONField(default=list)
    experience_years = models.IntegerField(default=0)
    is_verified = models.BooleanField(default=False)

