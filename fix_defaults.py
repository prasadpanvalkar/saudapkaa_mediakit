import sys
sys.path.append('/app/src')
import os
import django
from django.db import connection

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'saudapakka.settings')
django.setup()

new_fields = [
    'has_drainage_line',
    'has_one_gate_entry',
    'has_jogging_park',
    'has_children_park',
    'has_temple',
    'has_water_line',
    'has_street_light',
    'has_internal_roads',
    # Residential amenities needing defaults
    'has_power_backup', 'has_lift', 'has_swimming_pool', 'has_club_house',
    'has_gym', 'has_park', 'has_reserved_parking', 'has_security',
    'is_vastu_compliant', 'has_intercom', 'has_piped_gas', 'has_wifi'
]

with connection.cursor() as cursor:
    for field in new_fields:
        print(f"Setting default for {field}")
        cursor.execute(f"ALTER TABLE properties_property ALTER COLUMN {field} SET DEFAULT false")

print("Defaults fixed.")
