import os
import django
from django.conf import settings

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.properties.models import Property
from apps.properties.serializers import PropertySerializer
from apps.users.models import User

def debug_serialization():
    print("--- Starting Serialization Debug ---")
    
    # 1. Try to fetch one property
    prop = Property.objects.first()
    if not prop:
        print("No properties found in DB.")
        # Create a dummy one if needed, or just exit
        return

    print(f"Found property: {prop.id} - {prop.title}")

    # 2. Try to serialize it
    try:
        serializer = PropertySerializer(prop)
        print("Serializer initialized.")
        data = serializer.data
        print("Serialization successful!")
        # print(data) 
    except Exception as e:
        print(f"!!! Serialization FAILED !!!")
        print(f"Error: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    debug_serialization()
