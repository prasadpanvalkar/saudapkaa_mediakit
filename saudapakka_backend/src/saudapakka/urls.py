from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse


def health_check(request):
    return JsonResponse({"status": "healthy"})

urlpatterns = [
    path('health/', lambda r: JsonResponse({'status': 'healthy'}), name='health'),
    path('admin/', admin.site.urls),
    path('api/', include('apps.users.urls')),
    path('api/', include('apps.properties.urls')),
    path('api/admin/', include('apps.admin_panel.urls')), 
    path('api/', include('apps.mandates.urls')),
    path('api/', include('apps.notifications.urls')),
    path('health/', health_check, name='health_check'),

    # path('api/admin-panel/', include(admin_router.urls)),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
