import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const safeJsonParse = (data: string | null, fallback: any) => {
  if (!data) return fallback;
  try {
    return JSON.parse(data);
  } catch (err) {
    console.log('safeJsonParse error in AttendanceScreen:', err);
    return fallback;
  }
};

const AttendanceScreen = () => {
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();

  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkInTime, setCheckInTime] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [address, setAddress] = useState('');
  const [userName, setUserName] = useState('Priya Reddy');
  const [designation, setDesignation] = useState('Medical Representative');
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    if (isFocused) {
      restoreAttendanceStatus();
    }
  }, [isFocused]);

  const restoreAttendanceStatus = async () => {
    try {
      setLoading(true);
      const storedCheckedIn = await AsyncStorage.getItem('@checked_in');
      const storedTime = await AsyncStorage.getItem('@check_in_time');
      const storedLat = await AsyncStorage.getItem('@check_in_lat');
      const storedLng = await AsyncStorage.getItem('@check_in_lng');
      const storedAddr = await AsyncStorage.getItem('@check_in_address');

      const storedName = await AsyncStorage.getItem('@user_name');
      const storedRole = await AsyncStorage.getItem('@designation');
      if (storedName) setUserName(storedName);
      if (storedRole) setDesignation(storedRole);

      const storedLogs = await AsyncStorage.getItem('@attendance_logs');
      setLogs(safeJsonParse(storedLogs, []));

      if (storedCheckedIn === 'true') {
        setIsCheckedIn(true);
        setCheckInTime(storedTime || '');
        if (storedLat && storedLng) {
          setLatitude(parseFloat(storedLat));
          setLongitude(parseFloat(storedLng));
        }
        setAddress(storedAddr || '');
      } else {
        setIsCheckedIn(false);
        setCheckInTime('');
        setLatitude(null);
        setLongitude(null);
        setAddress('');
      }
    } catch (e) {
      console.log('Failed to restore attendance status', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Profile Section */}
      <View style={styles.profileSection}>
        <Text style={styles.employeeName}>{userName}</Text>
        <Text style={styles.employeeRole}>{designation}</Text> 
      </View>

      <Text style={styles.title}>📍 Attendance Dashboard</Text>

      {/* Loading Indicator */}
      {loading ? (
        <ActivityIndicator size="large" color="#1E88E5" style={{ marginVertical: 30 }} />
      ) : (
        <>
          {/* Status Card */}
          <View style={[
            styles.statusCard,
            { backgroundColor: isCheckedIn ? '#e8f5e9' : '#ffebee' }
          ]}>
            <Text style={[
              styles.statusText,
              { color: isCheckedIn ? '#2e7d32' : '#c62828' }
            ]}>
              {isCheckedIn ? '🟢 Checked In / On Duty' : '🔴 Checked Out / Off Duty'}
            </Text>

            {isCheckedIn && (
              <View style={styles.statusDetails}>
                <Text style={styles.infoText}>⏰ Check-In Time: {checkInTime}</Text>
                <Text style={styles.infoText}>📌 Address: {address}</Text>
                {latitude !== null && longitude !== null && (
                  <Text style={styles.coordText}>
                    Coords: {latitude.toFixed(4)}° N, {longitude.toFixed(4)}° E
                  </Text>
                )}
              </View>
            )}
          </View>

          {/* Action Buttons */}
          {!isCheckedIn ? (
            <TouchableOpacity 
              style={styles.checkInButton} 
              onPress={() => navigation.navigate('CheckIn')}
            >
              <Text style={styles.buttonText}>CHECK IN</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={styles.checkOutButton} 
              onPress={() => navigation.navigate('CheckOut')}
            >
              <Text style={styles.buttonText}>CHECK OUT</Text>
            </TouchableOpacity>
          )}
        </>
      )}

      {/* Attendance History Log Feed */}
      <Text style={styles.historyTitle}>📅 Attendance History</Text>
      {logs.length > 0 ? (
        logs.slice(0, 10).map((log) => (
          <View key={log.id || log.date} style={[
            styles.logCard,
            log.status === 'GPS Unavailable' && { borderLeftColor: '#F59E0B' }
          ]}>
            <View style={styles.logHeader}>
              <Text style={styles.logDate}>{log.date}</Text>
              <Text style={[
                styles.logDuration,
                log.status === 'GPS Unavailable' && { color: '#F59E0B' }
              ]}>
                ⏱️ {log.duration}
              </Text>
            </View>
            <View style={styles.logDetailRow}>
              <Text style={styles.logLabel}>Check-In: </Text>
              <Text style={styles.logVal}>
                {log.checkInTime} - {log.checkInAddress}
                {log.checkInLat && log.checkInLng ? ` (${parseFloat(log.checkInLat).toFixed(4)}, ${parseFloat(log.checkInLng).toFixed(4)})` : ''}
              </Text>
            </View>
            <View style={styles.logDetailRow}>
              <Text style={styles.logLabel}>Check-Out: </Text>
              <Text style={styles.logVal}>
                {log.checkOutTime} - {log.checkOutAddress}
                {log.checkOutLat && log.checkOutLng ? ` (${parseFloat(log.checkOutLat).toFixed(4)}, ${parseFloat(log.checkOutLng).toFixed(4)})` : ''}
              </Text>
            </View>
            {log.status === 'GPS Unavailable' && (
              <View style={styles.warningRow}>
                <Text style={styles.warningText}>⚠️ Check-Out GPS unavailable</Text>
              </View>
            )}
          </View>
        ))
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No attendance history found.</Text>
        </View>
      )}
    </ScrollView>
  );
};

export default AttendanceScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    padding: 20,
    paddingTop: 50,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 10,
  },
  employeeName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1E88E5',
  },
  employeeRole: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    marginTop: 10,
    textAlign: 'center',
  },
  statusCard: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  statusDetails: {
    marginTop: 12,
    width: '100%',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 13.5,
    color: '#333',
    marginTop: 6,
    textAlign: 'center',
  },
  coordText: {
    fontSize: 11.5,
    color: '#777',
    marginTop: 6,
    textAlign: 'center',
  },
  checkInButton: {
    backgroundColor: '#1E88E5',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  checkOutButton: {
    backgroundColor: '#e53935',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 30,
    marginBottom: 12,
  },
  logCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    elevation: 1,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 6,
  },
  logDate: {
    fontWeight: 'bold',
    color: '#333',
    fontSize: 14,
  },
  logDuration: {
    color: '#4CAF50',
    fontWeight: 'bold',
    fontSize: 13,
  },
  logDetailRow: {
    flexDirection: 'row',
    marginTop: 5,
  },
  logLabel: {
    fontWeight: '600',
    color: '#666',
    fontSize: 12,
    width: 75,
  },
  logVal: {
    color: '#444',
    fontSize: 12,
    flex: 1,
  },
  warningRow: {
    marginTop: 6,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#ffe8cc',
  },
  warningText: {
    color: '#D97706',
    fontSize: 11,
    fontWeight: '600',
  },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  emptyText: {
    color: '#999',
    fontStyle: 'italic',
  },
});