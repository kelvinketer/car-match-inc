from django.urls import path
from . import views

urlpatterns = [
    # --- Core & Onboarding ---
    path('api/waitlist/', views.join_waitlist, name='join_waitlist'),
    path('api/vehicles/', views.VehicleListView.as_view(), name='vehicle_list'),
    path('api/support/', views.support_chatbot, name='support_chatbot'), 
    path('api/register/', views.register_user, name='register_user'),

    # --- Gamified Discovery (The Swipe Stack) ---
    path('api/vehicles/stack/', views.get_vehicle_stack, name='vehicle-stack'),
    path('api/vehicles/swipe/', views.record_swipe, name='record-swipe'),
    
    # --- Post-Match Interaction ---
    path('api/vehicles/matches/', views.get_user_matches, name='user-matches'),
    path('api/vehicles/<int:vehicle_id>/chat/', views.vehicle_chat, name='vehicle_chat'),
    
    # --- Seller & Profile Functionality ---
    path('api/vehicles/add/', views.add_vehicle, name='add-vehicle'),
    path('api/profile/', views.get_user_profile, name='user-profile'), # <-- NEW: Profile Endpoint
    path('api/vehicles/<int:vehicle_id>/update-price/', views.update_vehicle_price, name='update_price'),
    path('api/payment/intent/', views.create_payment_intent, name='payment_intent'),]