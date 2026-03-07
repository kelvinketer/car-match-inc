from rest_framework import serializers
from .models import Vehicle

class VehicleSerializer(serializers.ModelSerializer):
    # These fields pull data from the User model to show buyer-seller trust
    seller_name = serializers.ReadOnlyField(source='seller.username')
    is_seller_verified = serializers.ReadOnlyField(source='seller.is_identity_verified')

    class Meta:
        model = Vehicle
        fields = [
            'id', 'seller_name', 'is_seller_verified', 'vin', 
            'make', 'model', 'year', 'mileage', 'asking_price', 
            'is_verified_match', 'history_report_url'
        ]