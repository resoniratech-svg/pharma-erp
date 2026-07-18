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
import { getAttendanceLogs } from '../../services/attendanceService';

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

const formatTime = (timeStr: string | null | undefined): string => {
  if (!timeStr) return 'N/A';
  try {
    const d = new Date(timeStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    }
  } catch {}
  return timeStr || 'N/A';
};

const TerritoryMapScreen = () => {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [hqZone, setHqZone] = useState('N/A');

  const loadTerritoryMapData = async () => {
    try {
      setLoading(true);
      
      // 1. Get user HQ
      const userRaw = await AsyncStorage.getItem('@user');
      const userObj = userRaw ? safeJsonParse(userRaw, null) : null;
      setHqZone(userObj?.hq || userObj?.headquarters || 'N/A');

      const compiled: MapMarker[] = [];

      // 2. Load Attendance Logs to get check-in from database instead of local AsyncStorage
      let attendanceLogs: any[] = [];
      try {
        const rawAttendance = await getAttendanceLogs();
        attendanceLogs = Array.isArray(rawAttendance) ? rawAttendance : [];
      } catch (err) {
        console.log('Error loading attendance for map:', err);
      }

      const todayStr = new Date().toLocaleDateString('en-GB').replace(/\//g, '-');
      const isSameDay = (item: any, targetDateStr: string): boolean => {
        try {
          const val = item.date || item.checkInTime || item.checkinTime || item.createdAt || '';
          if (!val) return false;
          if (typeof val === 'string' && /^\d{2}-\d{2}-\d{4}$/.test(val)) return val === targetDateStr;
          
          let ts = typeof val === 'number' ? val : Number(val);
          if (isNaN(ts) && typeof val === 'string') {
            const match = val.match(/\d{10,13}/);
            if (match) ts = Number(match[0]);
          }
          if (isNaN(ts) || ts <= 0) {
            const dateObj = new Date(val);
            if (!isNaN(dateObj.getTime())) {
              const day = String(dateObj.getDate()).padStart(2, '0');
              const month = String(dateObj.getMonth() + 1).padStart(2, '0');
              const year = dateObj.getFullYear();
              return `${day}-${month}-${year}` === targetDateStr;
            }
            return false;
          }
          const dateObj = new Date(ts);
          if (isNaN(dateObj.getTime())) return false;
          const day = String(dateObj.getDate()).padStart(2, '0');
          const month = String(dateObj.getMonth() + 1).padStart(2, '0');
          const year = dateObj.getFullYear();
          return `${day}-${month}-${year}` === targetDateStr;
        } catch {
          return false;
        }
      };

      const todayAtt = attendanceLogs.find((a: any) => {
        const d = a.checkInTime || a.checkinTime || a.createdAt || '';
        return isSameDay({ date: d }, todayStr);
      });

      if (todayAtt) {
        const ciLat = parseFloat(todayAtt.checkInLatitude || todayAtt.latitude || '0');
        const ciLng = parseFloat(todayAtt.checkInLongitude || todayAtt.longitude || '0');
        const ciTime = todayAtt.checkInTime || todayAtt.checkinTime;
        const ciAddr = todayAtt.checkInAddress || todayAtt.address || '';

        if (ciLat && ciLng) {
          compiled.push({
            latitude: ciLat,
            longitude: ciLng,
            label: 'Checked-In (HQ Start)',
            type: 'checkin',
            details: `Logged at: ${formatTime(ciTime)}<br/>📍 ${ciAddr || 'N/A'}`
          });
        }
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
              details: `👨‍⚕️ Specialty: ${doc.specialty || 'N/A'}<br/>🏢 Beat: ${doc.beat || 'N/A'}`
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
              details: `💊 Beat: ${chem.beat || 'N/A'}<br/>👤 Contact: ${chem.contactPerson || 'N/A'}`
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
