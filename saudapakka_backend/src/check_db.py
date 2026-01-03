
import os
import sys
import django
from django.db import connection

sys.path.append('/app')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'saudapakka.settings')
django.setup()

print("--- Checking Columns ---")
with connection.cursor() as cursor:
    cursor.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users_kycverification';")
    columns = cursor.fetchall()
    for col in columns:
        print(f"Col: {col[0]} ({col[1]})")
