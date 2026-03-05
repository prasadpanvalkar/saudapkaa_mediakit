import environ
from pathlib import Path
import os
import sys

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# 1. Initialize environ
env = environ.Env(
    DEBUG=(bool, False),
    EMAIL_USE_TLS=(bool, True),
    EMAIL_PORT=(int, 587),
    
)

# 2. Read the .env file (Attempt to read, ignore if missing in prod)
environ.Env.read_env(os.path.join(BASE_DIR.parent.parent, '.env'))


# =============================================================================
# SECURITY SETTINGS (Production Hardened)
# =============================================================================

SECRET_KEY = env('SECRET_KEY', default='django-insecure-dev-key-change-in-prod')

DEBUG = env.bool('DEBUG', default=False)

# Robust definition of ALLOWED_HOSTS
default_hosts = ['*']
default_hosts = ['saudapakka.com', 'www.saudapakka.com', 'localhost', '127.0.0.1', 'saudapakka_backend', 'backend', 'backend:8000']
ALLOWED_HOSTS = env.list('ALLOWED_HOSTS', default=default_hosts)


# =============================================================================
# APPLICATION DEFINITION
# =============================================================================

INSTALLED_APPS = [
    'django_filters',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Third Party
    'rest_framework',
    'corsheaders',
    
    # Custom Apps
    'apps.users',
    'apps.properties',
    'apps.mandates',
    'apps.notifications',
    'apps.admin_panel',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',  # WhiteNoise for static files
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'saudapakka.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'saudapakka.wsgi.application'


# =============================================================================
# DATABASE
# =============================================================================

# Parse database connection from environment variables
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME':     env('POSTGRES_DB', default='saudapakka_db'),
        'USER':     env('POSTGRES_USER', default='hello_django'),
        'PASSWORD': env('POSTGRES_PASSWORD', default='hello_django'),
        'HOST':     env('POSTGRES_HOST', default='postgres'),
        'PORT':     env('POSTGRES_PORT', default='5432'),
    }
}


# =============================================================================
# PASSWORD VALIDATION
# =============================================================================

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]


# =============================================================================
# INTERNATIONALIZATION
# =============================================================================

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True


# =============================================================================
# STATIC & MEDIA FILES
# =============================================================================

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# MEDIA CONFIGURATION (Critical for Production Docker Setup)
# Nginx serves /media/ from /app/media
MEDIA_URL = '/media/'
MEDIA_ROOT = '/app/media'


# =============================================================================
# DEFAULT PRIMARY KEY
# =============================================================================

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
AUTH_USER_MODEL = 'users.User'


# =============================================================================
# EMAIL CONFIGURATION (Safe Parsing)
# =============================================================================

EMAIL_BACKEND = env('EMAIL_BACKEND', default='django.core.mail.backends.smtp.EmailBackend' if not DEBUG else 'django.core.mail.backends.console.EmailBackend')
EMAIL_HOST = env('EMAIL_HOST', default='smtp.gmail.com')
EMAIL_PORT = env.int('EMAIL_PORT', default=587)
EMAIL_USE_TLS = env.bool('EMAIL_USE_TLS', default=True)
EMAIL_HOST_USER = env('EMAIL_HOST_USER', default='qutubahmad3@gmail.com')
EMAIL_HOST_PASSWORD = env('EMAIL_HOST_PASSWORD', default='')

# STRICTLY enforce format to avoid SMTP 555 errors
_from_email_raw = env('DEFAULT_FROM_EMAIL', default='SaudaPakka <qutubahmad3@gmail.com>')
# Strip any extra quotes someone might have added in .env logic
_from_email_clean = _from_email_raw.replace('"', '').replace("'", "")
DEFAULT_FROM_EMAIL = _from_email_clean


# =============================================================================
# REST FRAMEWORK & JWT
# =============================================================================

REST_FRAMEWORK = {
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny',
    ],
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle'
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '1000/hour',
        'user': '5000/hour',
        'otp_request': '5/hour'
    }
}

from datetime import timedelta
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(days=7),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'AUTH_HEADER_TYPES': ('Bearer',),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
}


# =============================================================================
# CORS & CSRF CONFIGURATION
# =============================================================================

# In production, we assume HTTPS. Ensure env vars align.
# Default list for development
default_origins = [
    "https://saudapakka.com",
    "https://www.saudapakka.com",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

CORS_ALLOW_ALL_ORIGINS = env.bool('CORS_ALLOW_ALL_ORIGINS', default=DEBUG)
CORS_ALLOWED_ORIGINS = env.list('CORS_ALLOWED_ORIGINS', default=default_origins)
CORS_ALLOW_CREDENTIALS = True

# Trust the same origins for CSRF
CSRF_TRUSTED_ORIGINS = env.list('CSRF_TRUSTED_ORIGINS', default=default_origins)


# =============================================================================
# SECURITY HEADERS & PRODUCTION FLAGS
# =============================================================================

# Trust the X-Forwarded-Proto header sent by Nginx (since we are behind a proxy)
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

if not DEBUG:
    # Production Security settings
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    
    SECURE_HSTS_SECONDS = 31536000  # 1 year
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    
    SECURE_SSL_REDIRECT = True  # Force HTTPS
    
    # Cookie security
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    
    X_FRAME_OPTIONS = 'DENY'
else:
    # Relaxed settings for dev
    SECURE_SSL_REDIRECT = False
    SESSION_COOKIE_SECURE = False
    CSRF_COOKIE_SECURE = False


# =============================================================================
# LOGGING (Production)
# =============================================================================

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'django.server': {
            'format': '[%(asctime)s] %(levelname)s [%(name)s:%(lineno)s] %(message)s',
            'datefmt': '%d/%b/%Y %H:%M:%S'
        },
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'verbose'
        },
        'django.server': {
            'level': 'INFO', 
            'class': 'logging.StreamHandler',
            'formatter': 'django.server',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'WARNING',
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
        'django.server': {
            'handlers': ['django.server'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}


# =============================================================================
# SANDBOX KYC CONFIGURATION
# =============================================================================

SANDBOX_API_KEY = env('SANDBOX_API_KEY', default='')
SANDBOX_API_SECRET = env('SANDBOX_API_SECRET', default='')
SANDBOX_BASE_URL = env('SANDBOX_BASE_URL', default='https://api.sandbox.co.in')

# =============================================================================
# GOOGLE MAPS CONFIGURATION
# =============================================================================

GOOGLE_MAPS_API_KEY = env('GOOGLE_MAPS_API_KEY', default='')

# File upload settings
DATA_UPLOAD_MAX_MEMORY_SIZE = 10485760  # 10MB per file
FILE_UPLOAD_MAX_MEMORY_SIZE = 10485760  # 10MB per file
