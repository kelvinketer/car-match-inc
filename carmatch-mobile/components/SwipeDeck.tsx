import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import Swiper from 'react-native-deck-swiper';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// --- CAR MATCH INC. PRODUCTION CLOUD URL ---
// This connects the mobile app to your live Render database
const API_BASE_URL = 'https://car-match-backend-wn9m.onrender.com'; 

interface Car {
  id: number;
  vin: string;
  make: string;
  model: string;
  year: number;
  price: string;
  mileage: number;
  distance_miles: number | string;
  image_url: string | null;
}

const SwipeDeck = ({ onLogout }: { onLogout: () => void }) => {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStack = async () => {
      try {
        const token = await SecureStore.getItemAsync('access_token');
        
        const response = await axios.get(`${API_BASE_URL}/api/vehicles/stack/`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setCars(response.data.stack);
      } catch (error) {
        console.error("Error fetching car stack:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStack();
  }, []);

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync('access_token');
    onLogout();
  };

  const onSwipeRight = async (cardIndex: number) => {
    const swipedCar = cars[cardIndex];
    console.log(`Swiped right on ${swipedCar.vin}`);

    try {
      const token = await SecureStore.getItemAsync('access_token');
      const response = await axios.post(`${API_BASE_URL}/api/vehicles/swipe/`, 
        {
          vehicle_id: swipedCar.id,
          is_liked: true
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.status === 'match') {
        Alert.alert("IT'S A MATCH! 🚗💨", "Opening secure escrow chat...");
        // TODO: Navigate to mobile Chat Screen
      }
    } catch (error) {
      console.error("Error recording swipe:", error);
    }
  };

  const onSwipeLeft = async (cardIndex: number) => {
    const swipedCar = cars[cardIndex];
    console.log(`Passed on ${swipedCar.vin}`);

    try {
      const token = await SecureStore.getItemAsync('access_token');
      await axios.post(`${API_BASE_URL}/api/vehicles/swipe/`, 
        {
          vehicle_id: swipedCar.id,
          is_liked: false
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      console.error("Error recording swipe:", error);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Finding cars near you...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Car Match</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {cars.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>You've swiped through all local cars! Check back later.</Text>
        </View>
      ) : (
        <View style={styles.swiperContainer}>
          <Swiper
            cards={cars}
            renderCard={(car) => (
              <View style={styles.card}>
                {car.image_url ? (
                  <Image source={{ uri: car.image_url }} style={styles.cardImage} />
                ) : (
                  <View style={styles.placeholderImage}>
                    <Text style={styles.placeholderText}>NO IMAGE</Text>
                  </View>
                )}
                <View style={styles.cardDetails}>
                  <Text style={styles.carTitle}>{car.year} {car.make} {car.model}</Text>
                  <Text style={styles.carPrice}>${car.price}</Text>
                  <Text style={styles.carInfo}>{car.mileage.toLocaleString()} miles • {car.distance_miles} mi away</Text>
                </View>
              </View>
            )}
            onSwipedRight={onSwipeRight}
            onSwipedLeft={onSwipeLeft}
            cardIndex={0}
            backgroundColor={'transparent'}
            stackSize={3}
            disableTopSwipe
            disableBottomSwipe
            animateCardOpacity
            overlayLabels={{
              left: {
                title: 'PASS',
                style: { label: { backgroundColor: 'red', color: 'white', fontSize: 24 }, wrapper: { flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'flex-start', marginTop: 30, marginLeft: -30 } }
              },
              right: {
                title: 'MATCH',
                style: { label: { backgroundColor: 'green', color: 'white', fontSize: 24 }, wrapper: { flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'flex-start', marginTop: 30, marginLeft: 30 } }
              }
            }}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  swiperContainer: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f3f4f6' },
  loadingText: { marginTop: 10, fontSize: 16, fontWeight: 'bold', color: '#333' },
  emptyText: { fontSize: 16, fontWeight: 'bold', color: '#555', textAlign: 'center', padding: 20 },
  
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 10, zIndex: 10, backgroundColor: '#f3f4f6' },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#111' },
  logoutText: { fontSize: 16, color: '#ef4444', fontWeight: '600' },
  
  card: { flex: 0.7, borderRadius: 16, borderWidth: 1, borderColor: '#E8E8E8', justifyContent: 'center', backgroundColor: 'white', overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 5, elevation: 5, marginTop: -30 }, 
  cardImage: { width: '100%', height: '70%' },
  placeholderImage: { width: '100%', height: '70%', backgroundColor: '#e5e7eb', justifyContent: 'center', alignItems: 'center' },
  placeholderText: { color: '#9ca3af', fontWeight: 'bold', fontSize: 20 },
  cardDetails: { padding: 20, height: '30%', justifyContent: 'center' },
  carTitle: { fontSize: 22, fontWeight: '800', color: '#111' },
  carPrice: { fontSize: 20, fontWeight: '700', color: '#2563eb', marginTop: 4 },
  carInfo: { fontSize: 14, color: '#6b7280', marginTop: 8, fontWeight: '600' }
});

export default SwipeDeck;