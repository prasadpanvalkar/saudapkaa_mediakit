from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import KYCVerification

@receiver(post_save, sender=KYCVerification)
def sync_kyc_status_to_user(sender, instance, created, **kwargs):
    """
    Syncs the KYCVerification status to the User's is_kyc_verified flag.
    This ensures that updates from Django Admin or other sources are reflected on the User model.
    """
    user = instance.user
    
    if instance.status == 'VERIFIED':
        if not user.is_kyc_verified:
            user.is_kyc_verified = True
            user.save(update_fields=['is_kyc_verified'])
    else:
        # If status is INITIATED or FAILED, revoke verification
        if user.is_kyc_verified:
            user.is_kyc_verified = False
            user.save(update_fields=['is_kyc_verified'])
