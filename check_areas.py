import sys
sys.path.append('/app/src')
import os
import django
from django.db import connection

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'saudapakka.settings')
django.setup()

with connection.cursor() as cursor:
    cursor.execute("SELECT column_name, is_nullable FROM information_schema.columns WHERE table_name = 'properties_property' AND column_name LIKE '%area'")
    columns = cursor.fetchall()
    print("Area Columns:")
    for col in columns:
        print(f"Name: {col[0]}, Nullable: {col[1]}")
