import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, ActivityIndicator, Alert, Image, RefreshControl } from 'react-native';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { StripeProvider, useStripe } from '@stripe/stripe-react-native';

// --- CAR MATCH INC. PRODUCTION CLOUD URL ---
const API_BASE_URL = 'https://car-match-backend-wn9m.onrender.com'; 

// TODO: Replace with live key before full-time operations
const STRIPE_PUBLISHABLE_KEY = 'pk_test_your_dummy_publishable_key_here';

export default function Matches({ onLogout }: { onLogout?: () => void }) {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false); // Added for Pull-to-Refresh
  
  // Chat Modal States
  const [selectedCar, setSelectedCar] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  
  // Stripe Hook
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);

  // Fetch matches on initial load
  useEffect(() => {
    fetchMatches();
  }, []);

  // The Core Fetch Engine
  const fetchMatches = async () => {
    try {
      const token = await SecureStore.getItemAsync('access_token');
      const response = await axios.get(`${API_BASE_URL}/api/vehicles/matches/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Ensure we always set an array, even if the backend returns null
      setMatches(response.data.matches || []); 
    } catch (error) {
      console.error("Error fetching matches:", error);
      Alert.alert("Connection Error", "Could not load your garage.");
    } finally {
      setLoading(false);
      setRefreshing(false); // Stop the refresh spinner
    }
  };

  // Triggered when the user pulls down on the list
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchMatches();
  }, []);

  // Chat Logic
  const openChat = async (car: any) => {
    setSelectedCar(car);
    setMessages([]); // Clear previous chat history while loading
    try {
      const token = await SecureStore.getItemAsync('access_token');
      const response = await axios.get(`${API_BASE_URL}/api/vehicles/${car.id}/chat/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(response.data.messages || []);
    } catch (error) {
      console.error("Error fetching chat:", error);
      Alert.alert("Chat Error", "Could not load messages.");
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    
    // Optimistic UI Update: Show message instantly before server replies
    const tempMessage = { id: Date.now(), sender: 'me', text: newMessage };
    setMessages((prev) => [...prev, tempMessage]);
    setNewMessage('');

    try {
      const token = await SecureStore.getItemAsync('access_token');
      const response = await axios.post(`${API_BASE_URL}/api/vehicles/${selectedCar.id}/chat/`, 
        { text: tempMessage.text },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Optional: Replace temp message with actual database message if needed
    } catch (error) {
      console.error("Error sending message:", error);
      Alert.alert("Delivery Failed", "Message could not be sent.");
    }
  };

  // --- STRIPE PAYMENT FLOW ---
  const handlePayEscrow = async () => {
    setIsPaymentLoading(true);
    try {
      const token = await SecureStore.getItemAsync('access_token');
      
      const response = await axios.post(`${API_BASE_URL}/api/payment/intent/`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const { client_secret } = response.data;

      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: 'Car Match Inc.',
        paymentIntentClientSecret: client_secret,
      });

      if (initError) {
        Alert.alert("Payment Setup Error", initError.message);
        setIsPaymentLoading(false);
        return;
      }

      const { error: presentError } = await presentPaymentSheet();

      if (presentError) {
        Alert.alert("Payment Cancelled", "The escrow payment was not completed.");
      } else {
        Alert.alert("Escrow Secured! 🛡️", "Your $99 fee is paid. The funds are secure.");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Could not connect to the secure payment server.");
    } finally {
      setIsPaymentLoading(false);
    }
  };

  if (loading) return <ActivityIndicator size="large" color="#2563eb" style={{ flex: 1, backgroundColor: '#f9fafb' }} />;

  return (
    <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
      <View style={styles.container}>
        <Text style={styles.title}>Your Garage Matches</Text>

        {matches.length === 0 ? (
          <Text style={styles.noMatchesText}>No matches yet. Keep swiping!</Text>
        ) : (
          <FlatList
            data={matches}
            keyExtractor={(item) => item.id.toString()}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563eb" />}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.matchCard} onPress={() => openChat(item)}>
                {/* Fallback image logic */}
                <Image source={item.image_url ? { uri: item.image_url } : require('../assets/images/favicon.png')} style={styles.matchImg} />
                <View style={styles.matchInfo}>
                  <Text style={styles.matchName}>{item.year} {item.make} {item.model}</Text>
                  <Text style={styles.matchPrice}>${item.price}</Text>
                  <Text style={styles.matchDistance}>📍 {item.distance_miles} miles away</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        )}

        {/* --- THE CHAT MODAL --- */}
        <Modal visible={!!selectedCar} animationType="slide">
          <View style={styles.chatContainer}>
            
            <View style={styles.chatHeader}>
              <TouchableOpacity onPress={() => setSelectedCar(null)} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>← Back</Text>
              </TouchableOpacity>
              <Text style={styles.chatTitle}>{selectedCar?.make} {selectedCar?.model}</Text>
            </View>

            <View style={styles.escrowBanner}>
              <Text style={styles.escrowText}>Ready to buy? Lock it in safely.</Text>
              <TouchableOpacity style={styles.payBtn} onPress={handlePayEscrow} disabled={isPaymentLoading}>
                {isPaymentLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.payBtnText}>🛡️ Pay $99 Escrow</Text>}
              </TouchableOpacity>
            </View>

            <FlatList
              data={messages}
              keyExtractor={(item, index) => item.id ? item.id.toString() : index.toString()}
              contentContainerStyle={{ padding: 15 }}
              renderItem={({ item }) => (
                <View style={[styles.messageBubble, item.sender === 'me' ? styles.myMessage : styles.theirMessage]}>
                  <Text style={[styles.messageText, item.sender === 'me' ? styles.myMessageText : styles.theirMessageText]}>
                    {item.text}
                  </Text>
                </View>
              )}
            />

            <View style={styles.inputRow}>
              <TextInput
                style={styles.chatInput}
                placeholder="Type a message..."
                value={newMessage}
                onChangeText={setNewMessage}
              />
              <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
                <Text style={styles.sendBtnText}>Send</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

      </View>
    </StripeProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb', padding: 20 },
  title: { fontSize: 28, fontWeight: '800', marginTop: 40, marginBottom: 20 },
  noMatchesText: { textAlign: 'center', color: '#6b7280', marginTop: 50, fontSize: 16 },
  matchCard: { flexDirection: 'row', backgroundColor: '#fff', padding: 15, borderRadius: 15, marginBottom: 15, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  matchImg: { width: 70, height: 70, borderRadius: 10, backgroundColor: '#e5e7eb' },
  matchInfo: { marginLeft: 15, justifyContent: 'center' },
  matchName: { fontSize: 18, fontWeight: '700' },
  matchPrice: { fontSize: 16, color: '#2563eb', fontWeight: '600', marginTop: 4 },
  matchDistance: { color: '#6b7280', fontSize: 12, marginTop: 4 },
  chatContainer: { flex: 1, backgroundColor: '#f9fafb' },
  chatHeader: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 60, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e5e7eb' },
  closeBtn: { marginRight: 15 },
  closeBtnText: { color: '#2563eb', fontSize: 16, fontWeight: '600' },
  chatTitle: { fontSize: 18, fontWeight: 'bold' },
  escrowBanner: { backgroundColor: '#eff6ff', padding: 15, borderBottomWidth: 1, borderColor: '#bfdbfe', alignItems: 'center' },
  escrowText: { color: '#1e3a8a', marginBottom: 10, fontWeight: '500' },
  payBtn: { backgroundColor: '#2563eb', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, width: '100%', alignItems: 'center' },
  payBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  messageBubble: { maxWidth: '80%', padding: 12, borderRadius: 15, marginBottom: 10 },
  myMessage: { alignSelf: 'flex-end', backgroundColor: '#2563eb' },
  theirMessage: { alignSelf: 'flex-start', backgroundColor: '#e5e7eb' },
  messageText: { fontSize: 15 },
  myMessageText: { color: '#fff' },
  theirMessageText: { color: '#1f2937' },
  inputRow: { flexDirection: 'row', padding: 15, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#e5e7eb', paddingBottom: 30 },
  chatInput: { flex: 1, backgroundColor: '#f3f4f6', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 10, marginRight: 10 },
  sendBtn: { justifyContent: 'center', backgroundColor: '#2563eb', borderRadius: 20, paddingHorizontal: 20 },
  sendBtnText: { color: '#fff', fontWeight: 'bold' }
});