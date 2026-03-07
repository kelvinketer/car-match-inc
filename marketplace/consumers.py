import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import ChatRoom, Message, User

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Get the room ID from the URL
        self.room_id = self.scope['url_route']['kwargs']['room_id']
        self.room_group_name = f'chat_{self.room_id}'

        # Join the room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        # Leave the room group when the user closes the chat
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    # Receive message from WebSocket (Frontend)
    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json['message']
        sender_id = text_data_json['sender_id'] # Note: This is actually the username string from React

        # Save message to the SQLite database
        await self.save_message(sender_id, self.room_id, message)

        # Broadcast the message to everyone in the room
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': message,
                'sender_id': sender_id
            }
        )

    # Receive message from room group (Backend broadcast)
    async def chat_message(self, event):
        message = event['message']
        sender_id = event['sender_id']

        # Send message directly to WebSocket
        await self.send(text_data=json.dumps({
            'message': message,
            'sender_id': sender_id
        }))

    @database_sync_to_async
    def save_message(self, sender_id, room_id, message):
        # Helper function to save the chat history safely inside an async function
        # UPDATED: Search by username instead of ID to match what React sends
        sender = User.objects.get(username=sender_id)
        
        # FINAL FIX: Find the room, or automatically create it if it's missing!
        room, created = ChatRoom.objects.get_or_create(id=room_id)
        
        Message.objects.create(sender=sender, room=room, content=message)