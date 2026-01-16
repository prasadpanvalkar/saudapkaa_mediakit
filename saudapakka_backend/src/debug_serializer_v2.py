import os
import django
import sys

# Add current directory to path
sys.path.append(os.getcwd())

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'saudapakka.settings')
django.setup()

from apps.properties.models import Property
from apps.properties.serializers import PropertySerializer

def debug_serialization():
    print("--- Starting Serialization Debug ---")
    
    # 1. Try to fetch all properties to find the one causing issues
    props = Property.objects.all()
    print(f"Total properties: {props.count()}")

    success_count = 0
    fail_count = 0

    for prop in props:
        try:
            serializer = PropertySerializer(prop)
            data = serializer.data
            success_count += 1
        except Exception as e:
            fail_count += 1
            print(f"\n!!! Serialization FAILED for Property ID: {prop.id} !!!")
            print(f"Error: {str(e)}")
            import traceback
            traceback.print_exc()
            # Break after first failure to analyze
            break
            
    print(f"\nDebug Complete. Success: {success_count}, Fail: {fail_count}")

if __name__ == "__main__":
    debug_serialization()
