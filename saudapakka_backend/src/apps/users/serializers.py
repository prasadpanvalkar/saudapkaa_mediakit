from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import KYCVerification, BrokerProfile

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    """
    Standard User Serializer for Profile display and searching.
    Includes the 'full_name' property from the model.
    """
    full_name = serializers.ReadOnlyField()

    class Meta:
        model = User
        fields = [
            'id', 
            'email', 
            'first_name', 
            'last_name', 
            'full_name', 
            'phone_number', 
            'is_active_seller', 
            'is_active_broker'
        ]
        read_only_fields = ['id', 'email', 'full_name']

class KYCVerificationSerializer(serializers.ModelSerializer):
    """
    Serializer for Sandbox KYC data.
    Updated to match the real-world Sandbox fields (full_name, status, etc.)
    """
    class Meta:
        model = KYCVerification
        fields = ['status', 'full_name', 'dob', 'verified_at']
        read_only_fields = ['status', 'verified_at']

class BrokerProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for the detailed Broker information.
    """
    class Meta:
        model = BrokerProfile
        fields = ['services_offered', 'experience_years', 'is_verified']
        read_only_fields = ['is_verified']

class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    Handles secure User Registration.
    Ensures first_name, last_name, email, and phone_number are mandatory.
    """
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'email', 'phone_number', 'password']
        
        # Enforcing mandatory field validation for the API
        extra_kwargs = {
            'first_name': {'required': True, 'allow_blank': False},
            'last_name': {'required': True, 'allow_blank': False},
            'email': {'required': True, 'allow_blank': False},
            'phone_number': {'required': True, 'allow_blank': False},
        }

    def create(self, validated_data):
        """
        Creates a new User using the Custom User Manager to handle hashing and username.
        """
        # We use the email as the username by default in this architecture
        user = User.objects.create_user(
            username=validated_data['email'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            phone_number=validated_data['phone_number']
        )
        return user