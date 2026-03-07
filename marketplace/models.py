from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    # FinTech & Trust fields required for the US market
    is_identity_verified = models.BooleanField(default=False)
    stripe_customer_id = models.CharField(max_length=120, blank=True, null=True)
    plaid_access_token = models.CharField(max_length=120, blank=True, null=True)
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    
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
    
    # Car Match Inc. Trust Metrics
    is_verified_match = models.BooleanField(default=False)
    history_report_url = models.URLField(blank=True, null=True)
    is_active_listing = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.year} {self.make} {self.model} - {self.vin}"

class EscrowTransaction(models.Model):
    STATUS_CHOICES = [
        ('initiated', 'Initiated'),
        ('funds_secured', 'Funds Secured in Escrow'),
        ('handshake_pending', 'In-Person Handshake Pending'),
        ('completed', 'Transaction Completed & Title Transferred'),
        ('disputed', 'Disputed'),
        ('cancelled', 'Cancelled')
    ]

    # PROTECT prevents a user from being deleted if they are tied to an active financial transaction
    buyer = models.ForeignKey(User, on_delete=models.PROTECT, related_name='purchases')
    seller = models.ForeignKey(User, on_delete=models.PROTECT, related_name='sales')
    
    # OneToOne ensures a specific car cannot be in two active escrows at the exact same time
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
    # Connects the chat to a specific car listing
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name='chats')
    buyer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='buyer_chats')
    seller = models.ForeignKey(User, on_delete=models.CASCADE, related_name='seller_chats')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Chat for {self.vehicle.vin} | Buyer: {self.buyer.username}"

class Message(models.Model):
    # Links each message to a specific ChatRoom
    room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        # Ensures messages are always ordered from oldest to newest
        ordering = ['timestamp']

    def __str__(self):
        return f"{self.sender.username}: {self.content[:20]}..."