import sys
sys.path.append('/app/src')
import os
import django
from django.db import connection

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'saudapakka.settings')
django.setup()

with connection.cursor() as cursor:
    cursor.execute("SELECT column_name, column_default, is_nullable, data_type FROM information_schema.columns WHERE table_name = 'properties_property'")
    columns = cursor.fetchall()
    print("Columns with No Default and Not Null:")
    for col in columns:
        name, default, nullable, dtype = col
        if default is None and nullable == 'NO':
            print(f"Name: {name}, Type: {dtype}")
