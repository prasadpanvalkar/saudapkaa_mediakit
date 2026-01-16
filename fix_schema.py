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
    'has_internal_roads'
]

with connection.cursor() as cursor:
    for field in new_fields:
        # Check if column exists
        cursor.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'properties_property' AND column_name = %s", [field])
        if not cursor.fetchone():
            print(f"Adding missing column: {field}")
            cursor.execute(f"ALTER TABLE properties_property ADD COLUMN {field} boolean DEFAULT false")
        else:
            print(f"Column exists: {field}")
            
print("Schema repair complete.")
