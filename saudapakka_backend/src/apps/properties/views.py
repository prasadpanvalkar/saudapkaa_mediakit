from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
import django_filters

from .models import Property, PropertyImage, SavedProperty, RecentlyViewed
from .serializers import PropertySerializer, PropertyImageSerializer
from .permissions import IsOwnerOrReadOnly
import logging

logger = logging.getLogger(__name__)

# --- ADVANCED FILTERING LOGIC ---

class PropertyFilter(django_filters.FilterSet):
    # Professional Price Range Filters
    min_price = django_filters.NumberFilter(field_name="total_price", lookup_expr='gte')
    max_price = django_filters.NumberFilter(field_name="total_price", lookup_expr='lte')
    
    # Area Filters
    min_area = django_filters.NumberFilter(field_name="carpet_area", lookup_expr='gte')
    
    # Exact Match Filters
    city = django_filters.CharFilter(field_name="city", lookup_expr='icontains')
    bhk = django_filters.NumberFilter(field_name="bhk_config")
    
    class Meta:
        model = Property
        fields = [
            'property_type', 'sub_type', 'bhk_config', 'city', 'locality', 
            'furnishing_status', 'availability_status', 'facing'
        ]

# --- MAIN VIEWSET ---

class PropertyViewSet(viewsets.ModelViewSet):
    serializer_class = PropertySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]
    parser_classes = [MultiPartParser, FormParser] 
    
    # Filtering & Search Configuration
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = PropertyFilter
    search_fields = ['title', 'project_name', 'address_line', 'locality', 'city', 'landmarks']
    ordering_fields = ['total_price', 'created_at', 'super_builtup_area']

    def get_queryset(self):
        """
        Visibility Logic:
        1. Admin: Everything.
        2. Owners: Verified + Their Own (Pending/Rejected).
        3. Public: Verified Only.
        """
        user = self.request.user
        base_query = Property.objects.all().prefetch_related('images').select_related('owner')

        if user.is_staff:
            return base_query.order_by('-created_at')
        
        # Public & Authenticated Users: Only show VERIFIED properties or their own properties
        if user.is_authenticated:
            return base_query.filter(
                Q(verification_status='VERIFIED') | Q(owner=user)
            ).order_by('-created_at').distinct()
            
        return base_query.filter(verification_status='VERIFIED').order_by('-created_at')

    def create(self, request, *args, **kwargs):
        # Log incoming data for debugging
        logger.info(f"Property Type: {request.data.get('property_type')}")
        logger.info(f"Received fields: {list(request.data.keys())}")
        
        try:
            response = super().create(request, *args, **kwargs)
            logger.info("Property created successfully")
            return response
        except Exception as e:
            logger.error(f"Property creation failed: {str(e)}")
            logger.error(f"Error type: {type(e).__name__}")
            raise

    def perform_create(self, serializer):
        user = self.request.user
        
        # Check User Authorization (Staff users bypass this check)
        if not user.is_staff and not (user.is_active_seller or user.is_active_broker):
            raise permissions.PermissionDenied(
                "Access Denied: You must complete KYC to list properties."
            )
        
        # Save with owner and initial pending status
        property_instance = serializer.save(owner=user, verification_status='PENDING')

        # Handle Floor Plan Uploads (Multipart)
        floor_plans = self.request.FILES.getlist('floor_plans')
        if floor_plans:
            from .models import PropertyFloorPlan
            for i, fp_file in enumerate(floor_plans):
                PropertyFloorPlan.objects.create(
                    property=property_instance,
                    image=fp_file,
                    order=i
                )

    # --- IMAGE MANAGEMENT ---

    @action(detail=True, methods=['post'], url_path='upload_image')
    def upload_image(self, request, pk=None):
        """Allows uploading multiple images to the gallery"""
        property_obj = self.get_object()
        
        if property_obj.owner != request.user and not request.user.is_staff:
            return Response({"error": "Unauthorized"}, status=403)

        serializer = PropertyImageSerializer(data=request.data, context={'request': request})
        
        if serializer.is_valid():
            serializer.save(property=property_obj)
            return Response(serializer.data, status=201)
            
        return Response(serializer.errors, status=400)

    @action(detail=True, methods=['delete'], url_path='delete_image/(?P<image_id>\d+)')
    def delete_image(self, request, pk=None, image_id=None):
        """
        Delete a specific image from the property gallery.
        """
        property_obj = self.get_object()
        
        # Authorization Check
        if property_obj.owner != request.user and not request.user.is_staff:
            return Response({"error": "Unauthorized: You do not own this property."}, status=403)
        
        try:
            image = PropertyImage.objects.get(id=image_id, property=property_obj)
            image.delete()
            return Response({"message": "Image deleted successfully"}, status=200)
        except PropertyImage.DoesNotExist:
            return Response({"error": "Image not found or does not belong to this property"}, status=404)

    @action(detail=True, methods=['get'])
    def get_contact_details(self, request, pk=None):
        """
        Secure endpoint to retrieve owner's contact details.
        Only accessible by authenticated users.
        """
        property_obj = self.get_object()
        
        # In a real scenario, we might want to log who accessed whose contact info
        # or implement a credit system/subscription check here.
        
        owner = property_obj.owner
        contact_info = {
            "id": owner.id,
            "full_name": owner.full_name,
            "phone_number": owner.phone_number,
            "email": owner.email,
            "whatsapp_number": property_obj.whatsapp_number # This is on the property model itself
        }
        return Response(contact_info)

    @action(detail=True, methods=['get'])
    def images(self, request, pk=None):
        """
        Get all images for a property
        """
        property_instance = self.get_object()
        # Ensure PropertyImage model is imported or available via property_instance.images
        # Using the related name 'images' from the model definition (assuming it exists)
        images = property_instance.images.all().order_by('-is_thumbnail', 'id')
        
        return Response([{
            'id': img.id,
            'image': request.build_absolute_uri(img.image.url) if img.image else None,
            'is_thumbnail': img.is_thumbnail,
            'created_at': img.created_at if hasattr(img, 'created_at') else None,
        } for img in images])

    # --- USER INTERACTIONS (SAVE/RECENT/HISTORY) ---

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def save_property(self, request, pk=None):
        property_obj = self.get_object()
        saved_item, created = SavedProperty.objects.get_or_create(user=request.user, property=property_obj)
        if not created:
            saved_item.delete()
            return Response({'message': 'Removed from saved'}, status=200)
        return Response({'message': 'Saved successfully'}, status=201)

    @action(detail=True, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def record_view(self, request, pk=None):
        """Called when user opens a property. Updates the 'Recently Viewed' list."""
        property_obj = self.get_object()
        RecentlyViewed.objects.update_or_create(user=request.user, property=property_obj)
        serializer = self.get_serializer(property_obj)
        return Response(serializer.data)


    @action(detail=False, methods=['get'], url_path='my_saved')
    def my_saved(self, request):
        """
        Get all properties saved/favorited by the current user
        """
        try:
            saved_property_ids = SavedProperty.objects.filter(
                user=request.user
            ).values_list('property_id', flat=True)
            
            properties = Property.objects.filter(
                id__in=saved_property_ids
            ).select_related('owner').prefetch_related('images', 'floor_plans').order_by('-created_at')
            
            serializer = self.get_serializer(properties, many=True)
            
            return Response(serializer.data, status=status.HTTP_200_OK)
        
        except Exception as e:
            logger.error(f"Error in my_saved: {str(e)}")
            return Response(
                {'error': 'Failed to fetch saved listings', 'detail': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def my_recent(self, request):
        recent = RecentlyViewed.objects.filter(user=request.user).order_by('-viewed_at')[:10]
        props = [r.property for r in recent]
        serializer = self.get_serializer(props, many=True)
        return Response(serializer.data)


    @action(detail=False, methods=['get'], url_path='my_listings')
    def my_listings(self, request):
        """
        Get all properties owned by the current user
        """
        try:
            logger.info(f"=== MY_LISTINGS CALLED ===")
            logger.info(f"User: {request.user}")
            # Check if user is authenticated
            if not request.user.is_authenticated:
                logger.error("User not authenticated")
                return Response(
                    {'error': 'Authentication required'},
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
            # Get properties owned by current user
            logger.info(f"Querying properties for user ID: {request.user.id}")
            properties = Property.objects.filter(
                owner=request.user
            ).select_related('owner').prefetch_related('images', 'floor_plans').order_by('-created_at')
            
            # Serialize the properties
            serializer = self.get_serializer(properties, many=True)
            
            logger.info(f"Serialization successful, returning {len(serializer.data)} items")
            return Response(serializer.data, status=status.HTTP_200_OK)
        
        except Exception as e:
            logger.error(f"=== MY_LISTINGS ERROR ===")
            logger.error(f"Error type: {type(e).__name__}")
            logger.error(f"Error message: {str(e)}")
            import traceback
            logger.error(f"Traceback:\n{traceback.format_exc()}")
            return Response(
                {'error': 'Failed to fetch your listings', 'detail': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


    


    def destroy(self, request, *args, **kwargs):
        property_obj = self.get_object()
        user = request.user
        
        # 1. Admin can delete anything
        if user.is_staff:
             self.perform_destroy(property_obj)
             return Response({"message": "Property deleted successfully by Admin."}, status=status.HTTP_204_NO_CONTENT)

        # 2. Owner can delete their own
        if property_obj.owner == user:
             # Check for active mandates (prevent deletion if active mandate exists)
             if property_obj.mandates.filter(status__in=['ACTIVE', 'PENDING', 'SIGNED']).exists():
                 return Response(
                     {"error": "Cannot delete a property with an active/pending mandate. Please cancel the mandate first."},
                     status=status.HTTP_400_BAD_REQUEST
                 )
             self.perform_destroy(property_obj)
             return Response({"message": "Property deleted successfully."}, status=status.HTTP_204_NO_CONTENT)
        
        # 3. Brokers: Can delete properties linked to their active mandates.
        # Check if this user is a broker for an ACTIVE mandate on this property.
        is_broker_linked = property_obj.mandates.filter(
            broker=user, 
            status__in=['ACTIVE', 'PENDING']
        ).exists()

        if is_broker_linked:
             self.perform_destroy(property_obj)
             return Response({"message": "Property deleted by authorized Broker."}, status=status.HTTP_204_NO_CONTENT)

        return Response({"error": "Unauthorized: You do not have permission to delete this property."}, status=403)

    def update(self, request, *args, **kwargs):
        """
        Update property - regular users can only update their own
        Admins can update any property and admin-specific fields
        """
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        # Permission check
        if instance.owner != request.user and not (request.user.is_staff or request.user.is_superuser):
            return Response(
                {'error': 'You do not have permission to edit this property'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Handle owner reassignment (admin only)
        if request.user.is_staff or request.user.is_superuser:
            owner_email = request.data.get('owner_email')
            if owner_email:
                try:
                    from django.contrib.auth import get_user_model
                    User = get_user_model()
                    new_owner = User.objects.get(email=owner_email)
                    if isinstance(request.data, dict):
                        request.data['owner'] = new_owner.id
                    else:
                        request.data._mutable = True
                        request.data['owner'] = new_owner.id
                        request.data._mutable = False
                except User.DoesNotExist:
                    pass  # Keep current owner if email not found
        
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        return Response(serializer.data)