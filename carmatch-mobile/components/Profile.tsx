import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, FlatList, TouchableOpacity, ActivityIndicator, Modal, TextInput, Alert } from 'react-native';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// --- CHOOSE YOUR BACKEND URL ---
// 1. LOCAL TESTING (Just you on your Wi-Fi)
const API_BASE_URL = 'http://192.168.0.106:8000'; 

// 2. GLOBAL TESTING (Uncomment the line below and paste your ngrok link to share with your friend)
// const API_BASE_URL = 'https://YOUR_UNIQUE_STRING.ngrok-free.app'; 

export default function Profile({ onLogout }: { onLogout: () => void }) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // --- Edit Price Modal States ---
  const [isEditModalVisible, setEditModalVisible] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
  const [newPrice, setNewPrice] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = await SecureStore.getItemAsync('access_token');
      const response = await axios.get(`${API_BASE_URL}/api/profile/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(response.data);
    } catch (error) {
      console.error("Profile Error:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- Functions to handle the price update ---
  const openEditModal = (vehicleId: number, currentPrice: string) => {
    setSelectedVehicleId(vehicleId);
    setNewPrice(currentPrice);
    setEditModalVisible(true);
  };

  const handleUpdatePrice = async () => {
    if (!newPrice || isNaN(Number(newPrice))) {
      Alert.alert("Invalid Price", "Please enter a valid number.");
      return;
    }

    setIsUpdating(true);
    try {
      const token = await SecureStore.getItemAsync('access_token');
      await axios.post(`${API_BASE_URL}/api/vehicles/${selectedVehicleId}/update-price/`, 
        { new_price: newPrice },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      Alert.alert("Success!", "Price updated and buyers notified.");
      setEditModalVisible(false);
      fetchProfile(); // Refresh profile to show the new price
    } catch (error: any) {
      // Catch the custom error message we set up in Django
      const errorMessage = error.response?.data?.error || "Could not update price.";
      Alert.alert("Update Failed", errorMessage);
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) return <ActivityIndicator size="large" color="#2563eb" style={{ flex: 1 }} />;

  return (
    <View style={styles.container}>
      
      {/* --- The Edit Price Modal --- */}
      <Modal visible={isEditModalVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Drop the Price</Text>
            <Text style={styles.modalSubtitle}>Lowering the price sends a push notification to anyone who swiped right on this car.</Text>
            
            <TextInput
              style={styles.modalInput}
              keyboardType="numeric"
              placeholder="New Price ($)"
              value={newPrice}
              onChangeText={setNewPrice}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalBtn, styles.cancelBtn]} onPress={() => setEditModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={[styles.modalBtn, styles.saveBtn]} onPress={handleUpdatePrice} disabled={isUpdating}>
                {isUpdating ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Update</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Header / Identity Section */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{profile.username[0].toUpperCase()}</Text>
        </View>
        <Text style={styles.username}>{profile.username}</Text>
        <Text style={styles.email}>{profile.email}</Text>
        {profile.is_verified ? (
          <View style={styles.verifiedBadge}><Text style={styles.verifiedText}>✅ Verified Seller</Text></View>
        ) : (
          <Text style={styles.unverifiedText}>Identity Verification Pending</Text>
        )}
      </View>

      {/* Stats Section */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{profile.total_listings}</Text>
          <Text style={styles.statLabel}>Listings</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>0</Text>
          <Text style={styles.statLabel}>Sales</Text>
        </View>
      </View>

      {/* Listings Section */}
      <Text style={styles.sectionTitle}>My Active Listings</Text>
      <FlatList
        data={profile.listings}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.carCard}>
            <Image source={item.image_url ? { uri: item.image_url } : require('@/assets/images/favicon.png')} style={styles.carImg} />
            <View style={styles.carInfo}>
              <Text style={styles.carName}>{item.year} {item.make} {item.model}</Text>
              <Text style={styles.carPrice}>${item.price}</Text>
            </View>
            
            {/* Show "Edit Price" if active, otherwise just show status */}
            {item.status === 'Active' ? (
              <TouchableOpacity style={styles.editBtn} onPress={() => openEditModal(item.id, item.price)}>
                <Text style={styles.editBtnText}>Edit Price</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.carStatus}>{item.status}</Text>
            )}
          </View>
        )}
      />

      <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb', padding: 20 },
  header: { alignItems: 'center', marginTop: 40, marginBottom: 20 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#2563eb', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontSize: 32, fontWeight: 'bold' },
  username: { fontSize: 22, fontWeight: 'bold', marginTop: 10 },
  email: { color: '#6b7280', marginBottom: 10 },
  verifiedBadge: { backgroundColor: '#d1fae5', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  verifiedText: { color: '#065f46', fontWeight: '600', fontSize: 12 },
  unverifiedText: { color: '#9ca3af', fontStyle: 'italic' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 20, backgroundColor: '#fff', padding: 15, borderRadius: 12 },
  statBox: { alignItems: 'center' },
  statNum: { fontSize: 20, fontWeight: 'bold' },
  statLabel: { color: '#6b7280', fontSize: 12 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  
  // Card styles
  carCard: { flexDirection: 'row', backgroundColor: '#fff', padding: 10, borderRadius: 10, marginBottom: 10, alignItems: 'center' },
  carImg: { width: 50, height: 50, borderRadius: 5 },
  carInfo: { flex: 1, marginLeft: 10 },
  carName: { fontWeight: '600' },
  carPrice: { color: '#2563eb' },
  carStatus: { fontSize: 12, color: '#10b981', fontWeight: 'bold' },
  
  // Edit Button
  editBtn: { backgroundColor: '#f3f4f6', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  editBtnText: { color: '#374151', fontSize: 12, fontWeight: '600' },
  
  logoutBtn: { marginTop: 20, padding: 15, alignItems: 'center' },
  logoutText: { color: '#ef4444', fontWeight: 'bold' },

  // --- Modal Styles ---
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', backgroundColor: '#fff', borderRadius: 12, padding: 20, alignItems: 'center' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  modalSubtitle: { fontSize: 14, color: '#6b7280', textAlign: 'center', marginBottom: 20 },
  modalInput: { width: '100%', backgroundColor: '#f3f4f6', padding: 15, borderRadius: 10, fontSize: 18, textAlign: 'center', marginBottom: 20 },
  modalButtons: { flexDirection: 'row', width: '100%', justifyContent: 'space-between' },
  modalBtn: { flex: 1, padding: 15, borderRadius: 10, alignItems: 'center', marginHorizontal: 5 },
  cancelBtn: { backgroundColor: '#f3f4f6' },
  cancelBtnText: { color: '#374151', fontWeight: 'bold' },
  saveBtn: { backgroundColor: '#2563eb' },
  saveBtnText: { color: '#fff', fontWeight: 'bold' }
});