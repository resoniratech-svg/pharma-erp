import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { getDoctors } from '../../services/doctorService';
import { getChemists } from '../../services/chemistService';

interface MapMarker {
  latitude: number;
  longitude: number;
  label: string;
  type: 'doctor' | 'chemist' | 'checkin';
  details: string;
}

const safeJsonParse = (data: string | null, fallback: any) => {
  if (!data) return fallback;
  try {
    return JSON.parse(data);
  } catch (err) {
    console.log('safeJsonParse error in TerritoryMapScreen:', err);
    return fallback;
  }
};

const TerritoryMapScreen = () => {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [hqZone, setHqZone] = useState('Hyderabad');

  const loadTerritoryMapData = async () => {
    try {
      setLoading(true);
      
      // 1. Get user HQ
      const userRaw = await AsyncStorage.getItem('@user');
      const userObj = userRaw ? safeJsonParse(userRaw, null) : null;
      setHqZone(userObj?.hq || 'Hyderabad');

      const compiled: MapMarker[] = [];

      // 2. Add Check-In location from Attendance if available
      const checkInLat = await AsyncStorage.getItem('@check_in_lat');
      const checkInLng = await AsyncStorage.getItem('@check_in_lng');
      const checkInAddr = await AsyncStorage.getItem('@check_in_address');
      const checkInTime = await AsyncStorage.getItem('@check_in_time');

      if (checkInLat && checkInLng) {
        compiled.push({
          latitude: parseFloat(checkInLat),
          longitude: parseFloat(checkInLng),
          label: 'Checked-In (HQ Start)',
          type: 'checkin',
          details: `Logged at: ${checkInTime || '09:00 AM'}<br/>📍 ${checkInAddr || ''}`
        });
      }

      // 3. Load all Doctors
      try {
        const docRes = await getDoctors();
        const docs = docRes.data || docRes || [];
        docs.forEach((doc: any) => {
          if (doc.latitude && doc.longitude) {
            compiled.push({
              latitude: parseFloat(doc.latitude),
              longitude: parseFloat(doc.longitude),
              label: `Dr. ${doc.doctorName || doc.name}`,
              type: 'doctor',
              details: `👨‍⚕️ Specialty: ${doc.specialty || 'General'}<br/>🏢 Beat: ${doc.beat || 'Default'}`
            });
          }
        });
      } catch (err) {
        console.log('Error loading doctors for map:', err);
      }

      // 4. Load all Chemists
      try {
        const chemRes = await getChemists();
        const chems = chemRes.data || chemRes || [];
        chems.forEach((chem: any) => {
          if (chem.latitude && chem.longitude) {
            compiled.push({
              latitude: parseFloat(chem.latitude),
              longitude: parseFloat(chem.longitude),
              label: chem.name || chem.chemistName || chem.shopName,
              type: 'chemist',
              details: `💊 Beat: ${chem.beat || 'Default'}<br/>👤 Contact: ${chem.contactPerson || ''}`
            });
          }
        });
      } catch (err) {
        console.log('Error loading chemists for map:', err);
      }

      setMarkers(compiled);
    } catch (err) {
      console.log('Error loading territory map markers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTerritoryMapData();
  }, []);

  const mapHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    html, body, #map { height: 100%; margin: 0; padding: 0; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    const markers = ${JSON.stringify(markers)};
    if (markers.length > 0) {
      const map = L.map('map');
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
      }).addTo(map);

      const points = [];
      markers.forEach((item) => {
        let color = '#2563EB'; // Blue for Doctors
        let symbol = '🩺';
        if (item.type === 'checkin') {
          color = '#10B981'; // Green for Check-In
          symbol = '🏁';
        } else if (item.type === 'chemist') {
          color = '#F59E0B'; // Orange for Chemists
          symbol = '💊';
        }

        const customIcon = L.divIcon({
          className: 'custom-div-icon',
          html: '<div style="background-color: ' + color + '; width: 26px; height: 26px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; font-size: 13px; box-shadow: 0 2px 5px rgba(0,0,0,0.3)">' + symbol + '</div>',
          iconSize: [26, 26],
          iconAnchor: [13, 13]
        });

        L.marker([item.latitude, item.longitude], {icon: customIcon})
          .bindPopup('<b>' + item.label + '</b><br/>' + item.details)
          .addTo(map);
        
        points.push([item.latitude, item.longitude]);
      });

      map.fitBounds(points, { padding: [40, 40] });
    } else {
      document.getElementById('map').innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#64748B;font-family:sans-serif;font-size:14px;">No territory customer markers available on map</div>';
    }
  </script>
</body>
</html>
  `;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🗺️ Territory Map View</Text>
        <Text style={styles.headerSubtitle}>HQ: {hqZone} | Doctors & Chemists Markers</Text>
      </View>

      {loading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Fetching territory coordinates...</Text>
        </View>
      ) : (
        <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
          {Platform.OS === 'web' ? (
            <iframe
              srcDoc={mapHtml}
              style={{ width: '100%', height: '100%', border: 'none' }}
              title="Territory Customer Map"
            />
          ) : (
            <View style={styles.fallbackContainer}>
              <Ionicons name="map-outline" size={48} color="#94A3B8" />
              <Text style={styles.fallbackText}>Native Map fallback. Please view on Web platform.</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

export default TerritoryMapScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#4F46E5',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#E2E8F0',
    marginTop: 4,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: '#64748B',
  },
  fallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    gap: 12,
  },
  fallbackText: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
  },
});
