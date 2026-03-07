from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status, generics
from django.contrib.auth.hashers import make_password # Securely hashes passwords
from .models import WaitlistLead, Vehicle, User
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

# UPDATED: The Smart Matching Algorithm Endpoint
class VehicleListView(generics.ListAPIView):
    """
    Returns a filtered list of active vehicle listings.
    This supports the 'Peer-to-peer' marketplace functionality and matching algorithm.
    """
    serializer_class = VehicleSerializer

    def get_queryset(self):
        # Start with all active listings
        queryset = Vehicle.objects.filter(is_active_listing=True)
        
        # Extract matching criteria from the frontend request
        make = self.request.query_params.get('make', None)
        max_price = self.request.query_params.get('max_price', None)
        verified_only = self.request.query_params.get('verified_only', None)

        # Apply the matching logic
        if make:
            queryset = queryset.filter(make__iexact=make) # Case-insensitive match
        if max_price:
            queryset = queryset.filter(asking_price__lte=max_price) # Less than or equal to budget
        if verified_only == 'true':
            queryset = queryset.filter(is_verified_match=True) # Trust metric filter

        return queryset

# NEW: 24/7 Global Support AI Prototype
@api_view(['POST'])
def support_chatbot(request):
    """
    Handles 24/7 customer support queries.
    This is the placeholder where we can integrate an LLM API later.
    """
    user_message = request.data.get('message', '').lower()
    
    if not user_message:
        return Response({"error": "Message is required"}, status=status.HTTP_400_BAD_REQUEST)

    # Prototype AI Logic Engine: Keyword matching for MVP
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

# NEW: Create the Registration Endpoint
@api_view(['POST'])
def register_user(request):
    """
    Creates a new user account for the platform.
    """
    data = request.data
    try:
        # Check if username or email already exists
        if User.objects.filter(username=data['username']).exists():
            return Response({'error': 'Username already taken'}, status=status.HTTP_400_BAD_REQUEST)
        if User.objects.filter(email=data['email']).exists():
            return Response({'error': 'Email already registered'}, status=status.HTTP_400_BAD_REQUEST)

        # Create the new user securely with a hashed password
        user = User.objects.create(
            username=data['username'],
            email=data['email'],
            password=make_password(data['password']),
            is_identity_verified=False # US Market trust metric default
        )
        return Response({'message': 'Account created successfully!'}, status=status.HTTP_201_CREATED)
    
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)