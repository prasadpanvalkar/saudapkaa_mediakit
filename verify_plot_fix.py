import sys
sys.path.append('/app/src')
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'saudapakka.settings')
django.setup()

from apps.properties.models import Property
from apps.users.models import User

try:
    u = User.objects.first()
    if not u:
        print("No user found. Creating one.")
        u = User.objects.create(email='test_plot@example.com', first_name='Test', last_name='User', phone_number='9999999999')

    # Try creating a PLOT with NULL for residential fields
    p = Property.objects.create(
        owner=u,
        title='Test Plot Null Check',
        property_type='PLOT',
        sub_type='RES_PLOT_GUNTHEWARI',
        
        # Plot specific
        plot_area=1500,
        has_drainage_line=True,
        
        # Residential fields set to None explicitly (simulating what serializer does)
        bhk_config=None,
        bathrooms=None,
        balconies=None,
        specific_floor=None,
        total_floors=None,
        furnishing_status=None,
        
        # Required fields
        total_price=5000000,
        address_line='Test Plot Addr',
        locality='Test Locality',
        city='Test City',
        pincode='123456',
        project_name='Test Project',
        landmarks='Near Landmark'
    )
    
    print(f"SUCCESS: Property created with ID {p.id}")
    print(f"bhk_config: {p.bhk_config}")
    print(f"bathrooms: {p.bathrooms}")
    print(f"specific_floor: {p.specific_floor}")

except Exception as e:
    print("FAILURE:", e)
