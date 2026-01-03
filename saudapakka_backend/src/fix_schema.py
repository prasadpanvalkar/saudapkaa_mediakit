
import os
import sys
import django
from django.db import connection

sys.path.append('/app')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'saudapakka.settings')
django.setup()

print("--- Fixing Schema Drift ---")
with connection.cursor() as cursor:
    # 1. Check/Add request_id
    try:
        cursor.execute("ALTER TABLE users_kycverification ADD COLUMN request_id varchar(100);")
        print("✅ Added column 'request_id'")
    except Exception as e:
        print(f"⚠️ 'request_id' add error (maybe exists): {e}")

    # 2. Rename updated_at -> verified_at
    try:
        cursor.execute("ALTER TABLE users_kycverification RENAME COLUMN updated_at TO verified_at;")
        print("✅ Renamed 'updated_at' to 'verified_at'")
    except Exception as e:
        print(f"⚠️ 'updated_at' rename error: {e}")
        # Only if rename failed, try adding verified_at if missing
        try:
             cursor.execute("ALTER TABLE users_kycverification ADD COLUMN verified_at timestamp with time zone;")
             print("✅ Added column 'verified_at'")
        except:
             pass

    # 3. Check/Fix dob type
    try:
        cursor.execute("ALTER TABLE users_kycverification ALTER COLUMN dob TYPE varchar(20);")
        print("✅ Altered 'dob' to varchar(20)")
    except Exception as e:
        print(f"⚠️ 'dob' alter error: {e}")

    # 4. Check user_id existence
    try:
        cursor.execute("SELECT user_id FROM users_kycverification LIMIT 1;")
        print("✅ 'user_id' column exists.")
    except Exception as e:
        print(f"❌ 'user_id' MISSING! Attempting to add...")
        try:
            cursor.execute("ALTER TABLE users_kycverification ADD COLUMN user_id uuid NOT NULL CONSTRAINT users_kycverification_user_id_fk_users_user_id REFERENCES users_user(id);")
            print("✅ Added 'user_id' column logic.")
        except Exception as inner_e:
             print(f"❌ Failed to add user_id: {inner_e}")

    # 5. Fix verified_at null/default if new
    # If we added verified_at, it might be null.
    
print("Schema patch complete.")
