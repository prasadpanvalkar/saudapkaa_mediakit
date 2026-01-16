import sys
sys.path.append('/app/src')
import os
import django
from django.db import connection

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'saudapakka.settings')
django.setup()

with connection.cursor() as cursor:
    # Find all boolean columns with no default and not nullable
    cursor.execute("SELECT column_name, column_default, is_nullable FROM information_schema.columns WHERE table_name = 'properties_property' AND data_type = 'boolean'")
    columns = cursor.fetchall()
    
    for col in columns:
        name, default, nullable = col
        if default is None and nullable == 'NO':
            print(f"Fixing default for column: {name}")
            # Use separate cursor or try-catch block for safety, though single transaction is usually fine
            cursor.execute(f"ALTER TABLE properties_property ALTER COLUMN {name} SET DEFAULT false")
            
print("All broken boolean defaults fixed.")
