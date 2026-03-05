from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse, Http404


def health_check(request):
    return JsonResponse({"status": "healthy"})

def api_root(request):
    # Return 404 for API root to hide endpoints
    raise Http404("Not found")


urlpatterns = [
    path('health/', health_check, name='health_check'),
    path('api/admin/', include('apps.admin_panel.urls')), 
    path('api/', api_root, name='api-root'),
    path('admin/', admin.site.urls),
    path('api/', include('apps.users.urls')),
    path('api/', include('apps.properties.urls')),
    path('api/', include('apps.mandates.urls')),
    path('api/', include('apps.notifications.urls')),

    # path('api/admin-panel/', include(admin_router.urls)),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
