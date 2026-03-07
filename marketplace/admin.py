from django.contrib import admin
from .models import User, Vehicle, EscrowTransaction

# This makes our custom tables visible and manageable in the dashboard
admin.site.register(User)
admin.site.register(Vehicle)
admin.site.register(EscrowTransaction)