import math
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status, generics
from django.contrib.auth.hashers import make_password 
from .models import WaitlistLead, Vehicle, User, SwipeAction, ChatRoom
from .serializers import VehicleSerializer

@api_view(['POST'])
def join_waitlist(request):
    email = request.data.get('email')
    
    if not email:
        return Response({"error": "Email is required"}, status=status.HTTP_400_BAD_REQUEST)

    lead, created = WaitlistLead.objects.get_or_create(email=email)
    
    if created:
        return Response({"message": "Successfully added to the waitlist!"}, status=status.HTTP_201_CREATED)
    else:
        return Response({"message": "You are already on the waitlist!"}, status=status.HTTP_200_OK)

class VehicleListView(generics.ListAPIView):
    serializer_class = VehicleSerializer

    def get_queryset(self):
        queryset = Vehicle.objects.filter(is_active_listing=True)
        
        make = self.request.query_params.get('make', None)
        max_price = self.request.query_params.get('max_price', None)
        verified_only = self.request.query_params.get('verified_only', None)

        if make:
            queryset = queryset.filter(make__iexact=make) 
        if max_price:
            queryset = queryset.filter(asking_price__lte=max_price) 
        if verified_only == 'true':
            queryset = queryset.filter(is_verified_match=True) 

        return queryset

@api_view(['POST'])
def support_chatbot(request):
    user_message = request.data.get('message', '').lower()
    
    if not user_message:
        return Response({"error": "Message is required"}, status=status.HTTP_400_BAD_REQUEST)

    if 'escrow' in user_message:
        bot_reply = "Our secure escrow system holds the buyer's funds safely. The money is only released to the seller once both parties confirm the in-person handshake and title transfer."
    elif 'verify' in user_message or 'verified' in user_message or 'vin' in user_message:
        bot_reply = "A 'Verified Match' means our system has successfully validated the vehicle's 17-digit VIN and checked its history report. It guarantees a safer transaction."
    elif 'fee' in user_message or 'cost' in user_message:
        bot_reply = "Car Match Inc. charges zero dealership fees! We only charge a flat $99 escrow fee to secure your transaction and protect your money."
    elif 'hello' in user_message or 'hi' in user_message:
        bot_reply = "Hello! I am the Car Match 24/7 Global Support Agent. I can answer questions about our escrow service, verified matches, or fees. How can I help?"
    else:
        bot_reply = "I'm still learning! For now, I can answer questions about how our escrow works, what a Verified Match is, or our fee structure. What would you like to know?"

    return Response({"reply": bot_reply}, status=status.HTTP_200_OK)

@api_view(['POST'])
def register_user(request):
    data = request.data
    try:
        if User.objects.filter(username=data['username']).exists():
            return Response({'error': 'Username already taken'}, status=status.HTTP_400_BAD_REQUEST)
        if User.objects.filter(email=data['email']).exists():
            return Response({'error': 'Email already registered'}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.create(
            username=data['username'],
            email=data['email'],
            password=make_password(data['password']),
            is_identity_verified=False 
        )
        return Response({'message': 'Account created successfully!'}, status=status.HTTP_201_CREATED)
    
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

# --- HELPER FUNCTION: The Haversine Formula ---
def calculate_distance(lat1, lon1, lat2, lon2):
    if not all([lat1, lon1, lat2, lon2]):
        return None 
    
    R = 3958.8 
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat/2) * math.sin(dlat/2) + math.cos(math.radians(lat1)) \
        * math.cos(math.radians(lat2)) * math.sin(dlon/2) * math.sin(dlon/2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    return R * c

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_vehicle_stack(request):
    user = request.user
    
    swiped_vehicle_ids = SwipeAction.objects.filter(buyer=user).values_list('vehicle_id', flat=True)
    
    unseen_vehicles = Vehicle.objects.filter(is_active_listing=True)\
                                     .exclude(id__in=swiped_vehicle_ids)\
                                     .exclude(seller=user)[:10] 
    
    stack_data = []
    for car in unseen_vehicles:
        distance = calculate_distance(user.latitude, user.longitude, car.latitude, car.longitude)
        
        stack_data.append({
            'id': car.id,
            'vin': car.vin,
            'make': car.make,
            'model': car.model,
            'year': car.year,
            'price': str(car.asking_price),
            'mileage': car.mileage,
            'distance_miles': round(distance, 1) if distance else "Distance unknown"
        })
        
    return Response({'stack': stack_data})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def record_swipe(request):
    user = request.user
    vehicle_id = request.data.get('vehicle_id')
    is_liked = request.data.get('is_liked') 
    
    try:
        vehicle = Vehicle.objects.get(id=vehicle_id)
    except Vehicle.DoesNotExist:
        return Response({'error': 'Vehicle not found'}, status=404)
        
    action, created = SwipeAction.objects.get_or_create(
        buyer=user,
        vehicle=vehicle,
        defaults={'is_liked': is_liked}
    )
    
    if created and is_liked:
        room, room_created = ChatRoom.objects.get_or_create(
            vehicle=vehicle,
            buyer=user,
            seller=vehicle.seller
        )
        return Response({
            'status': 'match', 
            'message': "It's a Match!", 
            'room_id': room.id
        })
        
    return Response({'status': 'passed', 'message': 'Swiped left successfully.'})