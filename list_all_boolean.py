import sys
sys.path.append('/app/src')
import os
import django
from django.db import connection

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'saudapakka.settings')
django.setup()

with connection.cursor() as cursor:
    cursor.execute("SELECT column_name, column_default, is_nullable, data_type FROM information_schema.columns WHERE table_name = 'properties_property' AND data_type = 'boolean'")
    columns = cursor.fetchall()
    print("Boolean Columns in properties_property:")
    for col in columns:
        print(f"Name: {col[0]}, Default: {col[1]}, Nullable: {col[2]}")
