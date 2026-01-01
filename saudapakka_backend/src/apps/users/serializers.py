from rest_framework import serializers
from .models import User, KycVerification, BrokerProfile

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id', 
            'full_name', 
            'email', 
            'phone_number', 
            'is_active_seller', 
            'is_active_broker'
        ]

class KycVerificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = KycVerification
        fields = ['aadhaar_number', 'pan_number', 'status']

class BrokerProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = BrokerProfile
        fields = ['services_offered', 'experience_years', 'is_verified']

class UserRegistrationSerializer(serializers.ModelSerializer):
    # Ensure password is write-only for security
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'email', 'phone_number', 'password']
        
        # Explicitly setting extra validation
        extra_kwargs = {
            'first_name': {'required': True, 'allow_blank': False},
            'last_name': {'required': True, 'allow_blank': False},
            'email': {'required': True, 'allow_blank': False},
            'phone_number': {'required': True, 'allow_blank': False},
        }

    def create(self, validated_data):
        # Create user with hashed password
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            phone_number=validated_data['phone_number']
        )
        return user

