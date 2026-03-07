from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    # This captures the room_id from the URL and passes it to the consumer
    re_path(r'ws/chat/(?P<room_id>\w+)/$', consumers.ChatConsumer.as_asgi()),
]