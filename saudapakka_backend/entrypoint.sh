#!/bin/bash
set -e

# Pre-create logs dir
mkdir -p /logs

# Wait for Postgres
# Note: Host 'postgres' must match the service name in docker-compose
while ! nc -z postgres 5432; do
  echo "Waiting for Postgres..."
  sleep 2
done

# Django migrations (slowest step)
echo "Running migrations..."
python manage.py migrate --noinput

# Collect static
python manage.py collectstatic --noinput

# Create superuser if missing
# Uses a shell snippet to check existence first to comply with idempotency
python manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(is_superuser=True).exists():
    print('Creating superuser...')
    User.objects.create_superuser('admin', 'admin@example.com', 'password')
else:
    print('Superuser already exists.')
"

# Start Gunicorn

if [ $# -gt 0 ]; then
    exec "$@"
else
    # Start Gunicorn
    echo "Starting Gunicorn..."
    # 120s timeout to handle slow initial requests/migrations if they overlap
    exec gunicorn saudapakka.wsgi:application --bind 0.0.0.0:8000 --workers 3 --timeout 120
fi
