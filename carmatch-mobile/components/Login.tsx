import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet, Text, Alert, TouchableOpacity, ActivityIndicator } from 'react-native';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// --- CAR MATCH INC. PRODUCTION CLOUD URL ---
// This connects the mobile app to your live Render database
const API_BASE_URL = 'https://car-match-backend-wn9m.onrender.com'; 

export default function Login({ onLoginSuccess }: { onLoginSuccess: () => void }) {
  const [isLoginMode, setIsLoginMode] = useState(true);
  
  // Loading state to control the spinner
  const [isLoading, setIsLoading] = useState(false); 
  
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async () => {
    // Basic validation to prevent unnecessary API calls
    if (!isLoginMode && (!username || !email || !password)) {
      Alert.alert("Missing Fields", "Please fill out all fields to register.");
      return;
    }
    if (isLoginMode && (!username || !password)) {
      Alert.alert("Missing Fields", "Please enter your username and password.");
      return;
    }

    setIsLoading(true); // Turn on the spinner

    try {
      if (isLoginMode) {
        // --- LOGIN FLOW ---
        const response = await axios.post(`${API_BASE_URL}/api/token/`, {
          username,
          password,
        });
        await SecureStore.setItemAsync('access_token', response.data.access);
        onLoginSuccess();
      } else {
        // --- SIGN UP FLOW ---
        await axios.post(`${API_BASE_URL}/api/register/`, {
          username,
          email,
          password,
        });
        
        Alert.alert("Success! 🎉", "Account created successfully. You can now log in.");
        setIsLoginMode(true); 
        setPassword(''); 
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || "Authentication failed. Please check your credentials.";
      Alert.alert("Error", errorMessage);
    } finally {
      setIsLoading(false); // Turn off the spinner
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Car Match Inc.</Text>

      {!isLoginMode && (
        <TextInput 
          style={styles.input} 
          placeholder="Email Address" 
          value={email} 
          onChangeText={setEmail} 
          keyboardType="email-address"
          autoCapitalize="none"
        />
      )}

      <TextInput 
        style={styles.input} 
        placeholder="Username" 
        value={username} 
        onChangeText={setUsername} 
        autoCapitalize="none"
      />

      <TextInput 
        style={styles.input} 
        placeholder="Password" 
        value={password} 
        onChangeText={setPassword} 
        secureTextEntry 
      />

      <View style={styles.buttonContainer}>
        {isLoading ? (
          <ActivityIndicator size="large" color="#2563eb" />
        ) : (
          <Button 
            title={isLoginMode ? "Login" : "Create Account"} 
            onPress={handleSubmit} 
          />
        )}
      </View>

      <TouchableOpacity 
        style={styles.toggleContainer} 
        onPress={() => setIsLoginMode(!isLoginMode)}
        disabled={isLoading} 
      >
        <Text style={styles.toggleText}>
          {isLoginMode 
            ? "Don't have an account? Sign Up" 
            : "Already have an account? Log In"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#f3f4f6' },
  title: { fontSize: 36, fontWeight: '900', textAlign: 'center', marginBottom: 40, color: '#111' },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#d1d5db', padding: 15, marginBottom: 15, borderRadius: 10, fontSize: 16 },
  buttonContainer: { marginTop: 10, height: 40, justifyContent: 'center' }, 
  toggleContainer: { marginTop: 25, alignItems: 'center' },
  toggleText: { color: '#2563eb', fontSize: 16, fontWeight: '600' }
});