from django.contrib import admin
from django.urls import path, include
from django.conf import settings # <-- NEW: Import settings
from django.conf.urls.static import static # <-- NEW: Import static helper
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('marketplace.urls')), 
    
    # NEW: JWT Login & Refresh Endpoints
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'), # This is the "Login" endpoint
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]

# THE FIX: This tells Django to serve media files during local development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)