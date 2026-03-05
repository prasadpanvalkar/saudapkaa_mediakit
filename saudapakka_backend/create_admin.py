from django.contrib.auth import get_user_model
User = get_user_model()
username_field = getattr(User, 'USERNAME_FIELD', 'username')

try:
    if username_field == 'email':
        if not User.objects.filter(email='admin@saudapakka.com').exists():
            User.objects.create_superuser('admin@saudapakka.com', 'admin_password')
            print('Admin created: email=admin@saudapakka.com, password=admin_password')
        else:
            print('Admin already exists: email=admin@saudapakka.com')
    else:
        if not User.objects.filter(username='admin').exists():
            User.objects.create_superuser('admin', 'admin@saudapakka.com', 'admin_password')
            print('Admin created: username=admin, password=admin_password')
        else:
            print('Admin already exists: username=admin')
except Exception as e:
    print(f'Error creating admin: {e}')
