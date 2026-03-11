from django.core.management.base import BaseCommand
from marketplace.models import User, Vehicle
import random

class Command(BaseCommand):
    help = 'Automatically seeds the database with a Test Seller and test vehicles.'

    def handle(self, *args, **kwargs):
        self.stdout.write("Seeding database...")

        # 1. Create a Test Seller
        seller, created = User.objects.get_or_create(
            username='TestSeller',
            defaults={
                'email': 'seller@carmatch.inc',
                'is_identity_verified': True,
                # Setting base coordinates around Nairobi
                'latitude': -1.2921,
                'longitude': 36.8219 
            }
        )
        if created:
            # Set a usable password just in case you ever need to log in as them
            seller.set_password('carmatch123')
            seller.save()
            self.stdout.write(self.style.SUCCESS('✅ Created TestSeller account.'))

        # 2. Define our Test Inventory
        vehicles_data = [
            {'vin': '1HGCM82633A000001', 'make': 'Toyota', 'model': 'Hilux', 'year': 2021, 'mileage': 45000, 'asking_price': 35000.00},
            {'vin': '2T1BR32EXA0000002', 'make': 'Tesla', 'model': 'Model 3', 'year': 2022, 'mileage': 22000, 'asking_price': 42000.00},
            {'vin': '3FADP4A26BM000003', 'make': 'Ford', 'model': 'Mustang', 'year': 2019, 'mileage': 55000, 'asking_price': 28000.00},
            {'vin': '4JFBG28B5CA000004', 'make': 'Honda', 'model': 'CR-V', 'year': 2023, 'mileage': 12000, 'asking_price': 31000.00},
            {'vin': '5XYPG4A51CG000005', 'make': 'Subaru', 'model': 'Outback', 'year': 2020, 'mileage': 68000, 'asking_price': 24500.00},
        ]

        # 3. Inject the cars into the database
        for data in vehicles_data:
            vehicle, v_created = Vehicle.objects.get_or_create(
                vin=data['vin'],
                defaults={
                    'seller': seller,
                    'make': data['make'],
                    'model': data['model'],
                    'year': data['year'],
                    'mileage': data['mileage'],
                    'asking_price': data['asking_price'],
                    # We slightly randomize the GPS coordinates so they aren't all parked in the exact same spot
                    'latitude': -1.2921 + random.uniform(-0.05, 0.05), 
                    'longitude': 36.8219 + random.uniform(-0.05, 0.05),
                    'is_active_listing': True,
                    'is_verified_match': True
                }
            )
            if v_created:
                self.stdout.write(self.style.SUCCESS(f"🚗 Added Vehicle: {vehicle.year} {vehicle.make} {vehicle.model}"))

        self.stdout.write(self.style.SUCCESS('🎉 Successfully seeded the Gamification Engine!'))