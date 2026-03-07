import os
from django.core.asgi import get_asgi_application

# 1. Point to your settings FIRST
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'carmatch.settings')

# 2. Initialize Django NEXT (This tells Django to read settings.py and load apps)
# This MUST happen before importing any Channels routing or models!
django_asgi_app = get_asgi_application()

# 3. Import Channels and your custom routing LAST (Only safe after Django is awake)
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
import marketplace.routing

# 4. Build the final application router
application = ProtocolTypeRouter({
    # Django's standard HTTP server (for your REST API)
    "http": django_asgi_app,
    
    # Django Channels WebSocket server (for live chat)
    "websocket": AuthMiddlewareStack(
        URLRouter(
            marketplace.routing.websocket_urlpatterns
        )
    ),
})