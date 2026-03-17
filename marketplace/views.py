import math
import stripe # <-- NEW: Import Stripe
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status, generics
from django.contrib.auth.hashers import make_password 
from django.db.models import Q
from .models import WaitlistLead, Vehicle, User, SwipeAction, ChatRoom, Message
from .serializers import VehicleSerializer

# --- NEW: Stripe Configuration ---
# In production, this MUST live in an environment variable (.env), not directly in code!
stripe.api_key = "sk_test_your_dummy_secret_key_here"

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
        
        image_url = request.build_absolute_uri(car.image.url) if car.image else None
        
        stack_data.append({
            'id': car.id,
            'vin': car.vin,
            'make': car.make,
            'model': car.model,
            'year': car.year,
            'price': str(car.asking_price),
            'mileage': car.mileage,
            'distance_miles': round(distance, 1) if distance else "Distance unknown",
            'image_url': image_url 
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
        
        print(f"NOTIFICATION: {user.username} liked {vehicle.seller.username}'s car!")
        
        return Response({
            'status': 'match', 
            'message': "It's a Match!", 
            'room_id': room.id
        })
        
    return Response({'status': 'passed', 'message': 'Swiped left successfully.'})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_matches(request):
    user = request.user
    
    liked_swipes = SwipeAction.objects.filter(buyer=user, is_liked=True)
    
    matches_data = []
    for swipe in liked_swipes:
        car = swipe.vehicle
        distance = calculate_distance(user.latitude, user.longitude, car.latitude, car.longitude)
        
        image_url = request.build_absolute_uri(car.image.url) if car.image else None
        
        matches_data.append({
            'id': car.id,
            'vin': car.vin,
            'make': car.make,
            'model': car.model,
            'year': car.year,
            'price': str(car.asking_price),
            'mileage': car.mileage,
            'distance_miles': round(distance, 1) if distance else "Distance unknown",
            'image_url': image_url,
        })
        
    return Response({"matches": matches_data}, status=200)

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def vehicle_chat(request, vehicle_id):
    user = request.user
    
    try:
        vehicle = Vehicle.objects.get(id=vehicle_id)
    except Vehicle.DoesNotExist:
        return Response({'error': 'Vehicle not found'}, status=404)

    room, created = ChatRoom.objects.get_or_create(
        vehicle=vehicle,
        buyer=user,
        defaults={'seller': vehicle.seller}
    )

    if request.method == 'GET':
        messages = Message.objects.filter(room=room).order_by('timestamp')
        msg_data = []
        for m in messages:
            msg_data.append({
                'id': str(m.id),
                'text': m.content, 
                'sender': 'me' if m.sender == user else 'them',
                'timestamp': m.timestamp
            })
        return Response({'messages': msg_data}, status=200)

    elif request.method == 'POST':
        text = request.data.get('text')
        if not text:
            return Response({'error': 'Message text is required'}, status=400)
        
        msg = Message.objects.create(room=room, sender=user, content=text)
        return Response({
            'id': str(msg.id),
            'text': msg.content,
            'sender': 'me',
            'timestamp': msg.timestamp
        }, status=201)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_vehicle(request):
    try:
        vehicle = Vehicle.objects.create(
            seller=request.user,
            vin=request.data.get('vin'),
            make=request.data.get('make'),
            model=request.data.get('model'),
            year=request.data.get('year'),
            mileage=request.data.get('mileage'),
            asking_price=request.data.get('asking_price'),
            image=request.FILES.get('image'), 
            is_active_listing=True
        )
        return Response({'message': 'Vehicle listed successfully!', 'id': vehicle.id}, status=201)
    except Exception as e:
        return Response({'error': str(e)}, status=400)

# --- PROFILE VIEW ---
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_profile(request):
    user = request.user
    my_listings = Vehicle.objects.filter(seller=user)
    
    listings_data = []
    for car in my_listings:
        listings_data.append({
            'id': car.id,
            'make': car.make,
            'model': car.model,
            'year': car.year,
            'price': str(car.asking_price),
            'status': 'Active' if car.is_active_listing else 'Sold',
            'image_url': request.build_absolute_uri(car.image.url) if car.image else None
        })

    return Response({
        'username': user.username,
        'email': user.email,
        'is_verified': user.is_identity_verified,
        'total_listings': my_listings.count(),
        'listings': listings_data
    })

# --- PRICE DROP & NOTIFICATION VIEW ---
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_vehicle_price(request, vehicle_id):
    try:
        vehicle = Vehicle.objects.get(id=vehicle_id, seller=request.user)
        old_price = vehicle.asking_price
        new_price = request.data.get('new_price')

        if not new_price:
            return Response({'error': 'Please provide a new price.'}, status=400)

        if float(new_price) < float(old_price):
            vehicle.asking_price = new_price
            vehicle.save()

            interested_buyers = SwipeAction.objects.filter(vehicle=vehicle, is_liked=True)
            
            for action in interested_buyers:
                print(f"PUSH: Hey {action.buyer.username}, the {vehicle.model} you liked just dropped to ${new_price}!")

            return Response({'message': 'Price updated and buyers notified!'}, status=200)
        
        return Response({'error': 'New price must be lower for a notification.'}, status=400)
    except Vehicle.DoesNotExist:
        return Response({'error': 'Vehicle not found or you are not the seller.'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=400)

# --- NEW: STRIPE PAYMENT INTENT VIEW ---
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_payment_intent(request):
    try:
        # Create a PaymentIntent with the escrow amount and currency
        # Amount is in cents, so 9900 = $99.00
        intent = stripe.PaymentIntent.create(
            amount=9900, 
            currency='usd',
            metadata={'integration_check': 'accept_a_payment'},
        )
        
        return Response({
            'client_secret': intent.client_secret
        }, status=200)
    except Exception as e:
        return Response({'error': str(e)}, status=403)