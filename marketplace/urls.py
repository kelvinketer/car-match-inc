from django.urls import path
from . import views

urlpatterns = [
    path('api/waitlist/', views.join_waitlist, name='join_waitlist'),
    path('api/vehicles/', views.VehicleListView.as_view(), name='vehicle_list'),
    path('api/support/', views.support_chatbot, name='support_chatbot'), 
    
    # ADD THIS:
    path('api/register/', views.register_user, name='register_user'),
]