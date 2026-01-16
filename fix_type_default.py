import sys
sys.path.append('/app/src')
import os
import django
from django.db import connection

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'saudapakka.settings')
django.setup()

with connection.cursor() as cursor:
    print("Setting default for listing_type")
    cursor.execute("ALTER TABLE properties_property ALTER COLUMN listing_type SET DEFAULT 'SELL'")

print("Default fixed.")
