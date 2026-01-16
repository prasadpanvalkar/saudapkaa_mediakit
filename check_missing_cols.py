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
    cursor.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'properties_property'")
    existing_columns = [row[0] for row in cursor.fetchall()]
    
    print("Missing columns:")
    for field in new_fields:
        if field not in existing_columns:
            print(field)
        else:
            print(f"Found: {field}")
