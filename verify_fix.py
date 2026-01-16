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
        u = User.objects.create(email='test@example.com', first_name='Test', last_name='User', phone_number='1234567890')

    p = Property.objects.create(
        owner=u,
        title='Test Plot',
        property_type='PLOT',
        sub_type='RES_PLOT_GUNTHEWARI',
        has_one_gate_entry=True,
        has_children_park=True,
        total_price=1000000,
        bhk_config=0.5,
        address_line='Test Addr',
        locality='Test Loc',
        city='Test City',
        pincode='123456',
        project_name='Test Project', 
        landmarks='Test Landmark'
    )
    print("Property created successfully ID:", p.id)
except Exception as e:
    print("Error:", e)
