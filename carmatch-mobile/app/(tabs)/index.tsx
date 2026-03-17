import { StyleSheet, View, Text, TouchableOpacity, Platform } from 'react-native';
import { useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import * as Notifications from 'expo-notifications';
import SwipeDeck from '@/components/SwipeDeck';
import Login from '@/components/Login';
import Matches from '@/components/Matches';
import AddVehicle from '@/components/AddVehicle';
import Profile from '@/components/Profile';

// --- Handle notifications when the app is in the foreground ---
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function HomeScreen() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState('swipe');

  // 1. Check if the user is already logged in
  useEffect(() => {
    const checkToken = async () => {
      const token = await SecureStore.getItemAsync('access_token');
      if (token) setIsLoggedIn(true);
    };
    checkToken();
  }, []);

  // 2. Request Push Notification Permissions once logged in
  useEffect(() => {
    const registerForPush = async () => {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Permission not granted for push notifications.');
        return;
      }
      
      // --- THE FIX: Safely try to get the token ---
      try {
        const tokenData = await Notifications.getExpoPushTokenAsync({
          projectId: 'dummy-project-id-for-local-testing'
        });
        console.log("Device Push Token:", tokenData.data);
      } catch (error) {
        console.log("Skipping push token in Expo Go simulator.");
      }
    };

    if (isLoggedIn) {
      registerForPush();
    }
  }, [isLoggedIn]);

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync('access_token');
    setIsLoggedIn(false);
  };

  if (!isLoggedIn) {
    return (
      <View style={styles.container}>
        <Login onLoginSuccess={() => setIsLoggedIn(true)} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Dynamic Screen Content */}
      <View style={styles.contentArea}>
        {activeTab === 'swipe' ? (
          <SwipeDeck onLogout={handleLogout} />
        ) : activeTab === 'sell' ? (
          <AddVehicle onComplete={() => setActiveTab('swipe')} />
        ) : activeTab === 'matches' ? (
          <Matches onLogout={handleLogout} />
        ) : (
          <Profile onLogout={handleLogout} />
        )}
      </View>

      {/* The Bottom Navigation Bar */}
      <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={styles.navItem} 
          onPress={() => setActiveTab('swipe')}
        >
          <Text style={[styles.navText, activeTab === 'swipe' && styles.activeNavText]}>🚗 Swap</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navItem} 
          onPress={() => setActiveTab('sell')}
        >
          <Text style={[styles.navText, activeTab === 'sell' && styles.activeNavText]}>➕ Sell</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navItem} 
          onPress={() => setActiveTab('matches')}
        >
          <Text style={[styles.navText, activeTab === 'matches' && styles.activeNavText]}>💬 Matches</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navItem} 
          onPress={() => setActiveTab('profile')}
        >
          <Text style={[styles.navText, activeTab === 'profile' && styles.activeNavText]}>👤 Me</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  contentArea: { flex: 1 }, 
  
  bottomNav: { 
    flexDirection: 'row', 
    backgroundColor: '#ffffff', 
    paddingVertical: 15, 
    borderTopWidth: 1, 
    borderTopColor: '#e5e7eb',
    justifyContent: 'space-around',
    paddingBottom: 25 
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  navText: {
    fontSize: 14,
    color: '#9ca3af',
    fontWeight: '600',
  },
  activeNavText: {
    color: '#2563eb', 
    fontWeight: '800',
  }
});