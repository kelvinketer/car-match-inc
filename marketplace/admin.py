from django.contrib import admin
from .models import User, Vehicle, SwipeAction, ChatRoom, Message, WaitlistLead, EscrowTransaction

# Standard registration for simpler models
admin.site.register(User)
admin.site.register(SwipeAction)
admin.site.register(ChatRoom)
admin.site.register(WaitlistLead)
admin.site.register(EscrowTransaction)

# Customized registration for the "Heavy Hitters"
@admin.register(Vehicle)
class VehicleAdmin(admin.ModelAdmin):
    # Columns to show in the list view
    list_display = ('year', 'make', 'model', 'asking_price', 'seller', 'is_active_listing')
    # Filters on the right sidebar
    list_filter = ('make', 'is_verified_match', 'is_active_listing')
    # Search box at the top
    search_fields = ('vin', 'make', 'model')

@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ('sender', 'room', 'timestamp', 'content_preview')
    list_filter = ('timestamp', 'sender')
    
    def content_preview(self, obj):
        # Shows a snippet of the message in the list
        return obj.content[:50] + "..." if len(obj.content) > 50 else obj.content