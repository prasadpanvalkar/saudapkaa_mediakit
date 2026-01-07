import uuid
from django.db import models
from pgvector.django import VectorField
from django.conf import settings
from django.db.models.signals import post_delete
from django.dispatch import receiver

class Property(models.Model):
    # --- Identifiers ---
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='properties')
    
    # --- 1. Core Configuration ---
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    
    listing_type = models.CharField(max_length=10, choices=[
        ('SALE', 'Sell'),
        ('RENT', 'Rent')
    ], default='SALE')

    # Main Categories
    PROPERTY_TYPE_CHOICES = [
        ('VILLA_BUNGALOW', 'Villa / Bungalow / Rowhouse'),
        ('FLAT', 'Flat / Apartment'),
        ('PLOT', 'Plot (Residential / Commercial)'),
        ('LAND', 'Land (Agriculture / Industrial)'),
        ('COMMERCIAL_UNIT', 'Shop / Office / Showroom')
    ]

    # Specific Sub-types
    SUB_TYPE_CHOICES = [
        # Villa/Bungalow Sub-categories
        ('BUNGALOW', 'Bungalow'),
        ('TWIN_BUNGALOW', 'Twin Bungalow'),
        ('ROWHOUSE', 'Rowhouse'),
        ('VILLA', 'Villa'),
        # Plot Sub-categories
        ('RES_PLOT', 'Residential Plot'),
        ('COM_PLOT', 'Commercial Plot'),
        # Land Sub-categories
        ('AGRI_LAND', 'Agricultural Land'),
        ('IND_LAND', 'Industrial Land'),
        # Commercial Sub-categories
        ('SHOP', 'Shop'),
        ('OFFICE', 'Office'),
        ('SHOWROOM', 'Showroom'),
    ]

    property_type = models.CharField(max_length=50, choices=PROPERTY_TYPE_CHOICES)
    sub_type = models.CharField(max_length=50, choices=SUB_TYPE_CHOICES, null=True, blank=True)

    bhk_config = models.IntegerField(default=1, choices=[(1, '1 BHK'), (2, '2 BHK'), (3, '3 BHK'), (4, '4+ BHK'), (5, '5+ BHK')])
    bathrooms = models.IntegerField(default=1)
    balconies = models.IntegerField(default=0)
    
    # Area Details
    super_builtup_area = models.DecimalField(max_digits=12, decimal_places=2, help_text="Total saleable area")
    carpet_area = models.DecimalField(max_digits=12, decimal_places=2, help_text="RERA usable area")
    plot_area = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    
    furnishing_status = models.CharField(max_length=20, choices=[
        ('UNFURNISHED', 'Unfurnished'),
        ('SEMI_FURNISHED', 'Semi-Furnished'),
        ('FULLY_FURNISHED', 'Fully Furnished')
    ], default='UNFURNISHED')

    # --- 2. Pricing & Financials ---
    total_price = models.DecimalField(max_digits=15, decimal_places=2)
    price_per_sqft = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    maintenance_charges = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    maintenance_interval = models.CharField(max_length=10, choices=[('MONTHLY', 'Monthly'), ('YEARLY', 'Yearly')], default='MONTHLY')

    # --- 3. Location ---
    project_name = models.CharField(max_length=255, blank=True)
    address_line = models.TextField()
    locality = models.CharField(max_length=255)
    city = models.CharField(max_length=100)
    pincode = models.CharField(max_length=10)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    landmarks = models.TextField(blank=True, help_text="Nearby Schools, Metro, etc.")

    # --- 4. Floor & Building ---
    specific_floor = models.IntegerField(null=True, blank=True)
    total_floors = models.IntegerField(null=True, blank=True)
    facing = models.CharField(max_length=20, choices=[
        ('NORTH', 'North'), ('SOUTH', 'South'), ('EAST', 'East'), ('WEST', 'West'),
        ('NORTH_EAST', 'North-East'), ('SOUTH_EAST', 'South-East'),
        ('NORTH_WEST', 'North-West'), ('SOUTH_WEST', 'South-West')
    ], null=True, blank=True)

    # --- 5. Status & Ownership ---
    availability_status = models.CharField(max_length=20, choices=[
        ('READY', 'Ready to Move'),
        ('UNDER_CONSTRUCTION', 'Under Construction')
    ], default='READY')
    possession_date = models.DateField(null=True, blank=True)
    age_of_construction = models.IntegerField(help_text="In years", default=0)

    # --- 6. Amenities (Checkboxes) ---
    has_power_backup = models.BooleanField(default=False)
    has_lift = models.BooleanField(default=False)
    has_swimming_pool = models.BooleanField(default=False)
    has_club_house = models.BooleanField(default=False)
    has_gym = models.BooleanField(default=False)
    has_park = models.BooleanField(default=False)
    has_reserved_parking = models.BooleanField(default=False)
    has_security = models.BooleanField(default=False)
    is_vastu_compliant = models.BooleanField(default=False)
    has_intercom = models.BooleanField(default=False)
    has_piped_gas = models.BooleanField(default=False)
    has_wifi = models.BooleanField(default=False)

    # --- 7. Media & Docs ---
    video_url = models.URLField(blank=True, null=True, help_text="YouTube/Hosted link")
    floor_plan = models.ImageField(upload_to='properties/floor_plans/', null=True, blank=True)
    
    # Verification Documents (Comprehensive List)
    building_commencement_certificate = models.FileField(upload_to='properties/docs/', null=True, blank=False)
    building_completion_certificate = models.FileField(upload_to='properties/docs/', null=True, blank=False)
    layout_sanction = models.FileField(upload_to='properties/docs/', null=True, blank=False)
    layout_order = models.FileField(upload_to='properties/docs/', null=True, blank=False)
    na_order_or_gunthewari = models.FileField(upload_to='properties/docs/', null=True, blank=False)
    mojani_nakasha = models.FileField(upload_to='properties/docs/', null=True, blank=False) # Renamed from doc_mojani
    doc_7_12_or_pr_card = models.FileField(upload_to='properties/docs/', null=True, blank=False) # Renamed from doc_7_12
    title_search_report = models.FileField(upload_to='properties/docs/', null=True, blank=False)
    
    # Optional Verification Documents
    rera_project_certificate = models.FileField(upload_to='properties/docs/', null=True, blank=True)
    gst_registration = models.FileField(upload_to='properties/docs/', null=True, blank=True)
    sale_deed_registration_copy = models.FileField(upload_to='properties/docs/', null=True, blank=True)

    # --- 8. Contact Info ---
    listed_by = models.CharField(max_length=20, choices=[
        ('OWNER', 'Owner'), ('AGENT', 'Agent'), ('BUILDER', 'Builder')
    ], default='OWNER')
    whatsapp_number = models.CharField(max_length=15, blank=True, null=True)

    # --- System Fields ---
    verification_status = models.CharField(max_length=20, choices=[
        ('PENDING', 'Pending'), ('VERIFIED', 'Verified'), ('REJECTED', 'Rejected')
    ], default='PENDING')
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        # Auto-calculate Price per Sq.ft safely
        if self.total_price and self.super_builtup_area and self.super_builtup_area > 0:
            self.price_per_sqft = self.total_price / self.super_builtup_area
        super().save(*args, **kwargs)



class PropertyImage(models.Model):
    property = models.ForeignKey(Property, related_name='images', on_delete=models.CASCADE)
    image = models.ImageField(upload_to='properties/')
    is_thumbnail = models.BooleanField(default=False)

class PropertyFloorPlan(models.Model):
    property = models.ForeignKey(Property, related_name='floor_plans', on_delete=models.CASCADE)
    image = models.ImageField(upload_to='properties/floor_plans/')
    created_at = models.DateTimeField(auto_now_add=True)

# --- User Interactions ---
class SavedProperty(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    property = models.ForeignKey(Property, on_delete=models.CASCADE)
    saved_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'property')

class RecentlyViewed(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    property = models.ForeignKey(Property, on_delete=models.CASCADE)
    viewed_at = models.DateTimeField(auto_now=True)

@receiver(post_delete, sender=PropertyImage)
def delete_image_file(sender, instance, **kwargs):
    """Deletes physical image files from storage when the database record is deleted."""
    if instance.image:
        instance.image.delete(save=False)

@receiver(post_delete, sender=Property)
def delete_property_files(sender, instance, **kwargs):
    """Deletes all document files and floor plans when a Property record is deleted."""
    file_fields = [
        'floor_plan',
        'building_commencement_certificate',
        'building_completion_certificate',
        'layout_sanction',
        'layout_order',
        'na_order_or_gunthewari',
        'mojani_nakasha',
        'doc_7_12_or_pr_card',
        'title_search_report',
        'rera_project_certificate',
        'gst_registration',
        'sale_deed_registration_copy'
    ]
    for field_name in file_fields:
        file_field = getattr(instance, field_name)
        if file_field:
            file_field.delete(save=False)