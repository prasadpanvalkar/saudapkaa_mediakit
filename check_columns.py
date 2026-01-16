import sys
sys.path.append('/app/src')
import os
import django
from django.db import connection

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'saudapakka.settings')
django.setup()

with connection.cursor() as cursor:
    cursor.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'properties_property'")
    columns = cursor.fetchall()
    print("Columns in properties_property:")
    for col in columns:
        print(col)
