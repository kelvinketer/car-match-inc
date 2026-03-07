import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
import marketplace.routing

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'carmatch.settings')

application = ProtocolTypeRouter({
    # Django's standard HTTP server (for your REST API)
    "http": get_asgi_application(),
    
    # Django Channels WebSocket server (for live chat)
    "websocket": AuthMiddlewareStack(
        URLRouter(
            marketplace.routing.websocket_urlpatterns
        )
    ),
})