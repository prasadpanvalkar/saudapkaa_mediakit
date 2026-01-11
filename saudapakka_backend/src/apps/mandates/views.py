from rest_framework import viewsets, permissions, status
from django.db.models import Q
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import Mandate
from .serializers import MandateSerializer
from rest_framework.exceptions import ValidationError
from apps.notifications.models import Notification
from apps.users.models import User

class MandateViewSet(viewsets.ModelViewSet):
    serializer_class = MandateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return Mandate.objects.all()
            
        return Mandate.objects.filter(
            Q(seller=user) | Q(broker=user)
        ).distinct()

    def notify_user(self, recipient, title, message, action_url=None):
        if recipient:
            Notification.objects.create(
                recipient=recipient,
                title=title,
                message=message,
                action_url=action_url
            )

    def perform_create(self, serializer):
        user = self.request.user
        initiated_by_payload = self.request.data.get('initiated_by')
        
        print(f"DEBUG: Mandate Creation Started by {user.email} ({user.id})")

        # Enforce server-side validation for initiated_by
        if user.is_active_broker:
             initiated_by = 'BROKER'
        elif user.is_active_seller:
             initiated_by = 'SELLER'
        else:
             initiated_by = initiated_by_payload
        
        print(f"DEBUG: initiated_by determined as: {initiated_by}")

        # Helper to ensure data integrity
        if initiated_by == 'BROKER' and not user.is_active_broker:
             raise ValidationError("You must be an active broker to initiate as BROKER.")
             
        # Check for existing processing/active mandates for this property
        property_obj = serializer.validated_data.get('property_item')
        if Mandate.objects.filter(property_item=property_obj, status__in=['PENDING', 'ACTIVE']).exists():
             raise ValidationError("This property already has an active or pending mandate.")
        
        mandate = None
        recipient = None

        if initiated_by == 'BROKER':
            # Auto-detect seller from the property owner
            property_instance = serializer.validated_data.get('property_item')
            if not property_instance:
                 raise ValidationError("Property details required.")
            
            seller = property_instance.owner
            
            sys_broker_sig = self.request.FILES.get('broker_signature') or self.request.data.get('broker_signature')
            
            mandate = serializer.save(
                broker=user, 
                initiated_by='BROKER', 
                seller=seller,
                broker_signature=sys_broker_sig 
            )
            recipient = mandate.seller
            print(f"DEBUG: Broker initiated. Recipient (Seller): {recipient}")

        elif initiated_by == 'SELLER':
            deal_type = self.request.data.get('deal_type')
            print(f"DEBUG: Seller initiated. Deal Type: {deal_type}")
            
            sys_seller_sig = self.request.FILES.get('seller_signature') or self.request.data.get('seller_signature')

            if deal_type == 'WITH_PLATFORM':
                 mandate = serializer.save(
                     seller=user, 
                     initiated_by='SELLER', 
                     deal_type='WITH_PLATFORM',
                     seller_signature=sys_seller_sig
                 )
                 # Notify all admins
                 admins = User.objects.filter(is_superuser=True)
                 print(f"DEBUG: Platform deal. Notifying {admins.count()} admins.")
                 for admin in admins:
                     self.notify_user(
                        recipient=admin,
                        title="New Platform Mandate Request",
                        message=f"{user.full_name} has initiated a mandate with SaudaPakka for {mandate.property_item.title}.",
                        action_url=f"/admin/mandates/{mandate.id}"
                     )
            else:
                broker_id = self.request.data.get('broker')
                print(f"DEBUG: Broker ID from request: {broker_id}")
                if not broker_id:
                     raise ValidationError("You must specify which Broker you are hiring.")
                mandate = serializer.save(
                    seller=user, 
                    initiated_by='SELLER',
                    seller_signature=sys_seller_sig
                )
                recipient = mandate.broker
                print(f"DEBUG: Seller initiated with Broker. Recipient (Broker): {recipient}")

        # Send Notification to Partner (if not platform)
        if recipient:
            print(f"DEBUG: Sending notification to {recipient.email}")
            self.notify_user(
                recipient=recipient,
                title="New Mandate Request",
                message=f"{user.full_name} has initiated a mandate request for {mandate.property_item.title}.",
                action_url=f"/dashboard/mandates/{mandate.id}"
            )
        elif deal_type == 'WITH_PLATFORM':
            print("DEBUG: Platform Deal - Admins already notified.")
        else:
            print("DEBUG: WARNING - No recipient determined for this mandate!")

    @action(detail=True, methods=['post'])
    def accept_and_sign(self, request, pk=None):
        mandate = self.get_object()
        
        if mandate.status != 'PENDING':
            return Response({"error": "This mandate is not in a pending state."}, status=400)

        signature_file = request.FILES.get('signature')
        if not signature_file:
            return Response({"error": "Digital signature file is required to accept."}, status=400)

        signer_role = None
        
        # Determine who is signing
        if request.user == mandate.seller:
            if mandate.seller_signature:
                 return Response({"error": "You have already signed this mandate."}, status=400)
            mandate.seller_signature = signature_file
            signer_role = 'SELLER'
            
        elif request.user == mandate.broker:
            if mandate.broker_signature:
                 return Response({"error": "You have already signed this mandate."}, status=400)
            mandate.broker_signature = signature_file
            signer_role = 'BROKER'
            
        elif request.user.is_staff and mandate.deal_type == 'WITH_PLATFORM':
            mandate.broker_signature = signature_file
            signer_role = 'ADMIN'
        else:
             return Response({"error": "You are not a party to this mandate."}, status=403)

        mandate.status = 'ACTIVE'
        mandate.start_date = timezone.now().date()
        mandate.save()

        # Notify the OTHER party (the initiator)
        # If deal type is Platform, and Admin just signed, notify Seller.
        # If initiated by Seller, and Broker signed, notify Seller.
        # If initiated by Broker, and Seller signed, notify Broker.
        
        recipient_to_notify = None
        
        if mandate.deal_type == 'WITH_PLATFORM':
            if signer_role == 'ADMIN':
                 recipient_to_notify = mandate.seller
        else:
            # For broker deals, notify the one who STARTED it (Initiator)
            if mandate.initiated_by == 'SELLER':
                recipient_to_notify = mandate.seller
            elif mandate.initiated_by == 'BROKER':
                recipient_to_notify = mandate.broker

        if recipient_to_notify:
             self.notify_user(
                recipient=recipient_to_notify,
                title="Mandate Accepted",
                message=f"Your mandate for {mandate.property_item.title} has been accepted and signed.",
                action_url=f"/dashboard/mandates/{mandate.id}"
            )

        return Response({"message": "Mandate signed and activated."})

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        mandate = self.get_object()
        reason = request.data.get('reason', 'No reason provided')
        
        if mandate.status != 'PENDING':
            return Response({"error": "Can only reject pending mandates."}, status=400)
            
        mandate.status = 'REJECTED'
        mandate.rejection_reason = reason
        mandate.save()
        
        # Notify Initiator
        recipient = None
        if mandate.initiated_by == 'SELLER':
            recipient = mandate.seller
        elif mandate.initiated_by == 'BROKER':
            recipient = mandate.broker
        
        if recipient:
            self.notify_user(
                recipient=recipient,
                title="Mandate Rejected",
                message=f"Your mandate request for {mandate.property_item.title} was rejected. Reason: {reason}",
                action_url=f"/dashboard/mandates/{mandate.id}"
            )
        
        return Response({"message": "Mandate rejected."})

    @action(detail=True, methods=['post'])
    def cancel_mandate(self, request, pk=None):
        mandate = self.get_object()
        
        # Allow cancellation if user is part of the deal
        if request.user != mandate.seller and request.user != mandate.broker and not request.user.is_staff:
             return Response({"error": "Permission denied."}, status=403)
             
        mandate.status = 'TERMINATED_BY_USER'
        mandate.end_date = timezone.now().date() # End it today
        mandate.save()
        
        return Response({"message": "Mandate terminated successfully."})

    @action(detail=True, methods=['post'])
    def renew_mandate(self, request, pk=None):
        old_mandate = self.get_object()
        
        if old_mandate.status != 'EXPIRED' and not old_mandate.is_near_expiry_notified:
             # Allow early renewal? "after the expiry there is button for renewal"
             # Let's allow renewal if expired OR near expiry
             pass
        
        # Create new mandate based on old one
        new_mandate = Mandate.objects.create(
            property_item=old_mandate.property_item,
            seller=old_mandate.seller,
            broker=old_mandate.broker,
            deal_type=old_mandate.deal_type,
            initiated_by=old_mandate.initiated_by, 
            is_exclusive=old_mandate.is_exclusive,
            commission_rate=old_mandate.commission_rate,
            fixed_amount=old_mandate.fixed_amount,
            status='PENDING',
            renewed_from=old_mandate
        )
        
        # Update initiator based on who is requesting renewal
        if request.user == old_mandate.seller:
            new_mandate.initiated_by = 'SELLER'
        elif request.user == old_mandate.broker:
            new_mandate.initiated_by = 'BROKER'
            
        new_mandate.save()

        return Response(MandateSerializer(new_mandate).data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'])
    def search_broker(self, request):
        mobile = request.query_params.get('mobile_number')
        if not mobile:
            return Response({"error": "Mobile number required"}, status=400)
            
        try:
            user = User.objects.get(phone_number=mobile, is_active_broker=True)
            return Response({
                "id": user.id,
                "full_name": user.full_name,
                "mobile_number": user.phone_number,
                "email": user.email
            })
        except User.DoesNotExist:
            return Response({"error": "Broker not found with this number."}, status=404)