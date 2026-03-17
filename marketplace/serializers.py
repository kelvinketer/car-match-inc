from rest_framework import serializers
from .models import Vehicle

class VehicleSerializer(serializers.ModelSerializer):
    # These fields pull data from the User model to show buyer-seller trust
    seller_name = serializers.ReadOnlyField(source='seller.username')
    is_seller_verified = serializers.ReadOnlyField(source='seller.is_identity_verified')
    
    # NEW: This field will calculate the full URL for the car photo
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Vehicle
        fields = [
            'id', 'seller_name', 'is_seller_verified', 'vin', 
            'make', 'model', 'year', 'mileage', 'asking_price', 
            'is_verified_match', 'history_report_url',
            'image_url' # <-- Added to the fields list
        ]

    def get_image_url(self, obj):
        # This function checks if the car has a photo and builds the full URL
        request = self.context.get('request')
        if obj.image and request:
            return request.build_absolute_uri(obj.image.url)
        return None