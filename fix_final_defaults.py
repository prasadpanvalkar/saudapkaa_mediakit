import sys
sys.path.append('/app/src')
import os
import django
from django.db import connection

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'saudapakka.settings')
django.setup()

with connection.cursor() as cursor:
    print("Setting default for availability_status")
    cursor.execute("ALTER TABLE properties_property ALTER COLUMN availability_status SET DEFAULT 'READY'")
    
    # Check if 'state' exists before trying to fix it
    cursor.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'properties_property' AND column_name = 'state'")
    if cursor.fetchone():
        print("Setting default for state")
        cursor.execute("ALTER TABLE properties_property ALTER COLUMN state SET DEFAULT 'Maharashtra'")
    else:
        print("Column 'state' not found.")

print("Defaults fixed.")
