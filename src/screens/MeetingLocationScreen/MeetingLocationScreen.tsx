import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import * as Location from 'expo-location';

interface Meeting {
  id: number;
  topic: string;
  venue: string;
  date: string;
  time: string;
}

interface MeetLocationLog {
  id: number;
  topic: string;
  venue: string;
  latitude: number;
  longitude: number;
  time: string;
  status: 'Checked-In' | 'Checked-Out';
}

const safeJsonParse = (data: string | null, fallback: any) => {
  if (!data) return fallback;
  try {
    return JSON.parse(data);
  } catch (err) {
    console.log('safeJsonParse error in MeetingLocationScreen:', err);
    return fallback;
  }
};

const MeetingLocationScreen = () => {
  const navigation = useNavigation<any>();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loadingLoc, setLoadingLoc] = useState(false);
  const [logs, setLogs] = useState<MeetLocationLog[]>([]);

  const loadMeetingsAndLogs = async () => {
    try {
      const stored = await AsyncStorage.getItem('@meetings');
      const allMeetings = safeJsonParse(stored, []);
      
      const todayDate = new Date();
      todayDate.setHours(0, 0, 0, 0);

      const activeMeetings = allMeetings.filter((m: any) => {
        if (!m.date) return true;
        
        let mDate = new Date();
        const datePart = m.date.split(' ')[0];
        const parts = datePart.split('-');
        if (parts.length === 3) {
           if (parts[0].length === 4) {
              mDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
           } else {
              const day = parseInt(parts[0], 10);
              const year = parseInt(parts[2], 10);
              let monthStr = parts[1];
              let monthNum = 0;
              
              if (!isNaN(parseInt(monthStr, 10))) {
                 monthNum = parseInt(monthStr, 10) - 1;
              } else {
                 const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
                 monthNum = months.indexOf(monthStr.toLowerCase());
              }
              mDate = new Date(year, monthNum, day);
           }
        } else {
          mDate = new Date(m.date);
        }

        if (isNaN(mDate.getTime())) return true;
        
        mDate.setHours(0, 0, 0, 0);
        return mDate.getTime() >= todayDate.getTime();
      });

      setMeetings(activeMeetings);
      
      const storedLogs = await AsyncStorage.getItem('@meeting_gps_logs');
      setLogs(safeJsonParse(storedLogs, []));
    } catch (e) {
      console.log('Error loading meetings and logs:', e);
    }
  };

  // Automatically refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadMeetingsAndLogs();
    }, [])
  );

  const customAlert = (title: string, msg: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${msg}`);
    } else {
      Alert.alert(title, msg);
    }
  };

  const handleMeetingGPSCheck = async (meet: Meeting, type: 'Checked-In' | 'Checked-Out') => {
    setLoadingLoc(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        customAlert('Permission Denied', 'Please grant GPS location access.');
        return;
      }

      let lat: number | null = null;
      let lng: number | null = null;
      let source = '';

      try {
        // Removed the invalid timeout property to fix the TypeScript compilation error
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        lat = loc.coords.latitude;
        lng = loc.coords.longitude;
        source = 'GPS Satellites';
      } catch (gpsError) {
        console.log('Balanced accuracy GPS failed, trying last known position:', gpsError);
        try {
          const lastLoc = await Location.getLastKnownPositionAsync();
          if (lastLoc) {
            lat = lastLoc.coords.latitude;
            lng = lastLoc.coords.longitude;
            source = 'Last Known Location';
          }
        } catch (fallbackError) {
          console.log('Last known position failed:', fallbackError);
        }
      }

      // STRICT GPS REQUIREMENT FOR PRODUCTION (No mock default fallback coords)
      if (lat === null || lng === null) {
        customAlert(
          'GPS Lock Failure',
          'Unable to acquire real GPS coordinates. Please ensure your location settings are turned on and try again.'
        );
        return; 
      }

      const newLog: MeetLocationLog = {
        id: Date.now(),
        topic: meet.topic,
        venue: meet.venue,
        latitude: lat,
        longitude: lng,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: type,
      };

      // Functional state update avoids stale closures and race conditions
      setLogs((prevLogs) => {
        const updated = [newLog, ...prevLogs];
        AsyncStorage.setItem('@meeting_gps_logs', JSON.stringify(updated)).catch((err) => {
          console.log('Error saving GPS logs:', err);
        });
        return updated;
      });
      
      customAlert(
        'GPS Verified',
        `${type} logged successfully at venue: ${meet.venue}.\nCoordinates: ${lat.toFixed(5)}, ${lng.toFixed(5)} (${source})`
      );
    } catch (err) {
      console.log('Verification Error:', err);
      customAlert('Verification Error', 'Failed to complete GPS presence verification.');
    } finally {
      setLoadingLoc(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>⬅️ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>📍 Meeting Geofence</Text>
        <Text style={styles.headerSubtitle}>Validate coordinates & presence at meetings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {loadingLoc && (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color="#4F46E5" />
            <Text style={styles.loaderText}>Acquiring GPS lock...</Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>Active Scheduled Meetings</Text>
        {meetings.length > 0 ? (
          meetings.map((meet) => (
            <View key={meet.id} style={styles.meetCard}>
              <Text style={styles.topic}>{meet.topic}</Text>
              <Text style={styles.venue}>🏢 Venue: {meet.venue}</Text>
              <Text style={styles.date}>📅 {meet.date} | {meet.time}</Text>

              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[styles.btn, styles.inBtn]}
                  onPress={() => handleMeetingGPSCheck(meet, 'Checked-In')}
                >
                  <Text style={styles.inText}>🟢 Meet Check-In</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btn, styles.outBtn]}
                  onPress={() => handleMeetingGPSCheck(meet, 'Checked-Out')}
                >
                  <Text style={styles.outText}>🔴 Meet Check-Out</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No meetings scheduled to check in.</Text>
          </View>
        )}

        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>GPS Verification Logs</Text>
        {logs.length > 0 ? (
          logs.map((log) => (
            <View key={log.id} style={styles.logCard}>
              <View style={styles.logHeader}>
                <Text style={styles.logTopic}>{log.topic}</Text>
                <Text style={[
                  styles.logStatus,
                  { color: log.status === 'Checked-In' ? '#059669' : '#EF4444' }
                ]}>
                  {log.status}
                </Text>
              </View>
              <Text style={styles.logVenue}>📍 Venue: {log.venue}</Text>
              <Text style={styles.logCoords}>🌐 Lat: {log.latitude.toFixed(5)} | Lng: {log.longitude.toFixed(5)}</Text>
              <Text style={styles.logTime}>⏰ Logged at {log.time}</Text>
            </View>
          ))
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No verified presence logs recorded.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default MeetingLocationScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    backgroundColor: '#4F46E5',
    paddingTop: 60,
    paddingBottom: 25,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 15,
    top: 50,
    zIndex: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  backButtonText: { fontSize: 12, color: '#FFFFFF', fontWeight: 'bold' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFFFFF', textAlign: 'center' },
  headerSubtitle: { fontSize: 12, color: '#E0E7FF', textAlign: 'center', marginTop: 6 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 60 },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#1E293B', marginBottom: 12 },
  meetCard: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 2, elevation: 1 },
  topic: { fontSize: 15, fontWeight: 'bold', color: '#1E293B' },
  venue: { fontSize: 12, color: '#475569', marginTop: 4 },
  date: { fontSize: 12, color: '#64748B', marginTop: 2 },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  btn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  inBtn: { backgroundColor: '#D1FAE5' },
  outBtn: { backgroundColor: '#FEE2E2' },
  inText: { fontSize: 11, fontWeight: 'bold', color: '#065F46' },
  outText: { fontSize: 11, fontWeight: 'bold', color: '#991B1B' },
  loader: { padding: 16, alignItems: 'center' },
  loaderText: { fontSize: 12, color: '#64748B', marginTop: 8 },
  logCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, marginBottom: 8, shadowColor: '#000', shadowOpacity: 0.01, elevation: 1 },
  logHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  logTopic: { fontSize: 13, fontWeight: 'bold', color: '#1E293B' },
  logStatus: { fontSize: 11, fontWeight: 'bold' },
  logVenue: { fontSize: 12, color: '#475569', marginTop: 2 },
  logCoords: { fontSize: 11, fontFamily: 'monospace', color: '#4F46E5', marginTop: 2 },
  logTime: { fontSize: 11, color: '#94A3B8', marginTop: 4 },
  emptyCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 24, alignItems: 'center' },
  emptyText: { fontSize: 13, color: '#94A3B8', fontStyle: 'italic' },
});