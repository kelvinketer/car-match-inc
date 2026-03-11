from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    # FinTech & Trust fields required for the US market
    is_identity_verified = models.BooleanField(default=False)
    stripe_customer_id = models.CharField(max_length=120, blank=True, null=True)
    plaid_access_token = models.CharField(max_length=120, blank=True, null=True)
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    
    # NEW: Location tracking for the "Cars Near Me" radius filter
    latitude = models.FloatField(blank=True, null=True)
    longitude = models.FloatField(blank=True, null=True)
    
    def __str__(self):
        return self.username

class Vehicle(models.Model):
    # A user can have multiple cars, so we use a ForeignKey (One-to-Many)
    seller = models.ForeignKey(User, on_delete=models.CASCADE, related_name='vehicles')
    vin = models.CharField(max_length=17, unique=True)
    make = models.CharField(max_length=50)
    model = models.CharField(max_length=50)
    year = models.IntegerField()
    mileage = models.IntegerField()
    asking_price = models.DecimalField(max_digits=10, decimal_places=2)
    
    # NEW: Where is the car parked?
    latitude = models.FloatField(blank=True, null=True)
    longitude = models.FloatField(blank=True, null=True)
    
    # Car Match Inc. Trust Metrics
    is_verified_match = models.BooleanField(default=False)
    history_report_url = models.URLField(blank=True, null=True)
    is_active_listing = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.year} {self.make} {self.model} - {self.vin}"

# --- NEW: THE GAMIFICATION ENGINE ---
class SwipeAction(models.Model):
    buyer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='swipes')
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name='swipes')
    
    # True = Right Swipe (Like) / False = Left Swipe (Pass)
    is_liked = models.BooleanField()
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        # Crucial: A user can only swipe on a specific car once!
        unique_together = ('buyer', 'vehicle')

    def __str__(self):
        action = "Liked" if self.is_liked else "Passed on"
        return f"{self.buyer.username} {action} {self.vehicle.vin}"

class EscrowTransaction(models.Model):
    STATUS_CHOICES = [
        ('initiated', 'Initiated'),
        ('funds_secured', 'Funds Secured in Escrow'),
        ('handshake_pending', 'In-Person Handshake Pending'),
        ('completed', 'Transaction Completed & Title Transferred'),
        ('disputed', 'Disputed'),
        ('cancelled', 'Cancelled')
    ]

    buyer = models.ForeignKey(User, on_delete=models.PROTECT, related_name='purchases')
    seller = models.ForeignKey(User, on_delete=models.PROTECT, related_name='sales')
    vehicle = models.OneToOneField(Vehicle, on_delete=models.PROTECT)
    
    agreed_price = models.DecimalField(max_digits=10, decimal_places=2)
    escrow_fee = models.DecimalField(max_digits=6, decimal_places=2, default=99.00)
    
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='initiated')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Escrow: {self.vehicle.vin} | {self.status}"

class WaitlistLead(models.Model):
    email = models.EmailField(unique=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.email

class ChatRoom(models.Model):
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name='chats')
    buyer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='buyer_chats')
    seller = models.ForeignKey(User, on_delete=models.CASCADE, related_name='seller_chats')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Chat for {self.vehicle.vin} | Buyer: {self.buyer.username}"

class Message(models.Model):
    room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['timestamp']

    def __str__(self):
        return f"{self.sender.username}: {self.content[:20]}..."