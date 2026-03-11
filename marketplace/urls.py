from django.urls import path
from . import views

urlpatterns = [
    path('api/waitlist/', views.join_waitlist, name='join_waitlist'),
    path('api/vehicles/', views.VehicleListView.as_view(), name='vehicle_list'),
    path('api/support/', views.support_chatbot, name='support_chatbot'), 
    path('api/register/', views.register_user, name='register_user'),

    # ==========================================
    # NEW: THE GAMIFICATION ENGINE ENDPOINTS
    # ==========================================
    path('api/vehicles/stack/', views.get_vehicle_stack, name='vehicle-stack'),
    path('api/vehicles/swipe/', views.record_swipe, name='record-swipe'),
]