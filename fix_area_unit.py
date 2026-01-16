import sys
sys.path.append('/app/src')
import os
import django
from django.db import connection

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'saudapakka.settings')
django.setup()

with connection.cursor() as cursor:
    print("Setting default for area_unit")
    cursor.execute("ALTER TABLE properties_property ALTER COLUMN area_unit SET DEFAULT 'sqft'")

print("Default fixed.")
