import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, ScrollView, Alert, ActivityIndicator, Modal } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, useCameraPermissions } from 'expo-camera'; 
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// --- CHOOSE YOUR BACKEND URL ---
// 1. LOCAL TESTING (Just you on your Wi-Fi)
const API_BASE_URL = 'http://192.168.0.106:8000'; 

// 2. GLOBAL TESTING (Uncomment the line below and paste your ngrok link to share with your friend)
// const API_BASE_URL = 'https://YOUR_UNIQUE_STRING.ngrok-free.app'; 

export default function AddVehicle({ onComplete }: { onComplete: () => void }) {
  const [form, setForm] = useState({ make: '', model: '', year: '', price: '', vin: '', mileage: '' });
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDecoding, setIsDecoding] = useState(false);
  
  // SCANNER STATE
  const [permission, requestPermission] = useCameraPermissions();
  const [isScannerVisible, setIsScannerVisible] = useState(false);

  const decodeVIN = async (vinToDecode?: string) => {
    const targetVin = vinToDecode || form.vin;
    if (targetVin.length < 17) {
      Alert.alert("Invalid VIN", "Please enter a full 17-character VIN.");
      return;
    }

    setIsDecoding(true);
    try {
      const response = await axios.get(`https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/${targetVin}?format=json`);
      const results = response.data.Results;
      const getValue = (label: string) => results.find((r: any) => r.Variable === label)?.Value;

      const make = getValue('Make');
      const model = getValue('Model');
      const year = getValue('Model Year');

      if (make && model) {
        setForm({ ...form, vin: targetVin, make, model, year: year || '' });
      } else {
        Alert.alert("Not Found", "We couldn't decode that VIN automatically.");
      }
    } catch (error) {
      Alert.alert("Error", "Could not connect to the VIN database.");
    } finally {
      setIsDecoding(false);
    }
  };

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    setIsScannerVisible(false);
    // Barcodes sometimes include extra characters; we just want the 17-char VIN
    const cleanedVin = data.trim().toUpperCase().slice(-17); 
    decodeVIN(cleanedVin);
  };

  const startScan = async () => {
    if (!permission?.granted) {
      const status = await requestPermission();
      if (!status.granted) {
        Alert.alert("Permission Denied", "Camera access is required to scan VINs.");
        return;
      }
    }
    setIsScannerVisible(true);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  const handleSubmit = async () => {
    if (!form.make || !form.model || !form.vin || !image) {
      Alert.alert("Missing Info", "Please provide a photo and all car details.");
      return;
    }
    setLoading(true);
    const formData = new FormData();
    Object.keys(form).forEach(key => formData.append(key, form[key as keyof typeof form]));
    formData.append('asking_price', form.price);

    const filename = image.split('/').pop() || 'upload.jpg';
    // @ts-ignore
    formData.append('image', { uri: image, name: filename, type: 'image/jpeg' });

    try {
      const token = await SecureStore.getItemAsync('access_token');
      await axios.post(`${API_BASE_URL}/api/vehicles/add/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data', 'Authorization': `Bearer ${token}` },
      });
      Alert.alert("Success!", "Your car is now live.");
      onComplete();
    } catch (error) {
      Alert.alert("Error", "Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.title}>List Your Vehicle</Text>
      
      {/* SCANNER MODAL */}
      <Modal visible={isScannerVisible} animationType="slide">
        <CameraView
          style={StyleSheet.absoluteFillObject}
          onBarcodeScanned={handleBarCodeScanned}
          barcodeScannerSettings={{ barcodeTypes: ["code128", "datamatrix", "qr"] }}
        >
          <View style={styles.overlay}>
            <View style={styles.scanTarget} />
            <TouchableOpacity style={styles.closeBtn} onPress={() => setIsScannerVisible(false)}>
              <Text style={styles.closeBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </CameraView>
      </Modal>

      <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
        {image ? <Image source={{ uri: image }} style={styles.previewImage} /> : <Text style={styles.imagePlaceholder}>📸 Tap to add car photo</Text>}
      </TouchableOpacity>

      {/* VIN ROW WITH SCAN AND DECODE */}
      <View style={styles.vinRow}>
        <TextInput 
          style={[styles.input, { flex: 1, marginBottom: 0 }]} 
          placeholder="17-digit VIN" 
          autoCapitalize="characters" 
          value={form.vin} 
          onChangeText={(t) => setForm({...form, vin: t})} 
        />
        <TouchableOpacity style={styles.iconBtn} onPress={startScan}>
          <Text style={{fontSize: 20}}>📷</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.decodeBtn} onPress={() => decodeVIN()}>
          {isDecoding ? <ActivityIndicator color="#fff" /> : <Text style={styles.decodeBtnText}>Decode</Text>}
        </TouchableOpacity>
      </View>

      <TextInput style={styles.input} placeholder="Make" value={form.make} onChangeText={(t) => setForm({...form, make: t})} />
      <TextInput style={styles.input} placeholder="Model" value={form.model} onChangeText={(t) => setForm({...form, model: t})} />
      <TextInput style={styles.input} placeholder="Year" keyboardType="numeric" value={form.year} onChangeText={(t) => setForm({...form, year: t})} />
      <TextInput style={styles.input} placeholder="Price ($)" keyboardType="numeric" value={form.price} onChangeText={(t) => setForm({...form, price: t})} />
      <TextInput style={styles.input} placeholder="Mileage" keyboardType="numeric" value={form.mileage} onChangeText={(t) => setForm({...form, mileage: t})} />

      <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Post Vehicle</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 20, marginTop: 40 },
  imagePicker: { height: 180, backgroundColor: '#f3f4f6', borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 20, overflow: 'hidden' },
  previewImage: { width: '100%', height: '100%' },
  imagePlaceholder: { color: '#6b7280', fontWeight: '600' },
  vinRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  input: { backgroundColor: '#f3f4f6', padding: 15, borderRadius: 10, marginBottom: 15, fontSize: 16 },
  iconBtn: { backgroundColor: '#f3f4f6', padding: 12, borderRadius: 10, marginLeft: 8, height: 50, justifyContent: 'center' },
  decodeBtn: { backgroundColor: '#10b981', padding: 12, borderRadius: 10, marginLeft: 8, height: 50, justifyContent: 'center' },
  decodeBtnText: { color: '#fff', fontWeight: 'bold' },
  submitBtn: { backgroundColor: '#2563eb', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  submitText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  // SCANNER STYLES
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  scanTarget: { width: 300, height: 150, borderWidth: 2, borderColor: '#fff', borderRadius: 10 },
  closeBtn: { marginTop: 40, backgroundColor: '#ef4444', padding: 15, borderRadius: 10 },
  closeBtnText: { color: '#fff', fontWeight: 'bold' }
});