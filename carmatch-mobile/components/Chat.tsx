import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = 'http://192.168.0.106:8000';

interface Car {
  id: number;
  vin: string;
  make: string;
  model: string;
  year: number;
  price: string;
}

interface ChatMessage {
  id: string;
  text: string;
  sender: 'system' | 'me' | 'them';
}

export default function Chat({ car, onBack }: { car: Car; onBack: () => void }) {
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Fetch chat history
  const fetchChatHistory = async () => {
    try {
      const token = await SecureStore.getItemAsync('access_token');
      const response = await axios.get(`${API_BASE_URL}/api/vehicles/${car.id}/chat/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const systemMessage: ChatMessage = { 
        id: 'system-1', 
        text: `Secure Escrow active for ${car.make}.`, 
        sender: 'system' 
      };
      setMessages([systemMessage, ...response.data.messages]);
    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChatHistory();
  }, [car.id]);

  // 2. Send Message logic
  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const messageToSend = inputText;
    setInputText(''); // Clear input immediately for better UX

    try {
      const token = await SecureStore.getItemAsync('access_token');
      const response = await axios.post(`${API_BASE_URL}/api/vehicles/${car.id}/chat/`, 
        { text: messageToSend },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Add the confirmed message from the server to the list
      setMessages(prev => [...prev, response.data]);
    } catch (error: any) {
      Alert.alert("Connection Error", "Message could not reach the server. Check your network.");
      setInputText(messageToSend); // Put text back so user doesn't lose it
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}><Text style={styles.backArrow}>← Back</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>{car.make} {car.model}</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={messages}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={[styles.bubble, item.sender === 'me' ? styles.myBubble : item.sender === 'system' ? styles.systemBubble : styles.theirBubble]}>
            <Text style={[styles.msgText, item.sender === 'me' && {color: '#fff'}]}>{item.text}</Text>
          </View>
        )}
        contentContainerStyle={{ padding: 15 }}
      />

      <View style={styles.inputArea}>
        <TextInput
          style={styles.input}
          placeholder="Type here..."
          value={inputText}
          onChangeText={setInputText}
        />
        <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
          <Text style={{color: '#fff', fontWeight: 'bold'}}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#eee' },
  headerTitle: { fontWeight: 'bold', fontSize: 16 },
  backArrow: { color: '#2563eb', fontWeight: 'bold' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  bubble: { padding: 12, borderRadius: 15, marginBottom: 10, maxWidth: '80%' },
  myBubble: { alignSelf: 'flex-end', backgroundColor: '#2563eb' },
  theirBubble: { alignSelf: 'flex-start', backgroundColor: '#e5e7eb' },
  systemBubble: { alignSelf: 'center', backgroundColor: '#f3f4f6' },
  msgText: { fontSize: 15 },
  inputArea: { flexDirection: 'row', padding: 15, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#eee' },
  input: { flex: 1, backgroundColor: '#f3f4f6', borderRadius: 20, paddingHorizontal: 15, height: 40 },
  sendBtn: { marginLeft: 10, backgroundColor: '#2563eb', borderRadius: 20, paddingHorizontal: 20, justifyContent: 'center' }
});