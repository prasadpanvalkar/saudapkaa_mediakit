import sys
sys.path.append('/app/src')
import os
import django
from django.db import connection

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'saudapakka.settings')
django.setup()

with connection.cursor() as cursor:
    cursor.execute("SELECT column_name, column_default, is_nullable FROM information_schema.columns WHERE table_name = 'properties_property' AND data_type = 'boolean'")
    columns = cursor.fetchall()
    print("Problematic Boolean Columns (No Default + Not Null):")
    for col in columns:
        name, default, nullable = col
        # Note: information_schema might return None for default if not set
        if default is None and nullable == 'NO':
            print(f"Name: {name}")
