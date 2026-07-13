import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { getAttendanceLogs } from '../../services/attendanceService';
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

const formatTime = (timeStr: string) => {
  if (!timeStr || timeStr === 'N/A' || timeStr === 'Active') return timeStr;
  const trimmed = timeStr.trim();
  if (/\d{1,2}:\d{2}\s*(AM|PM|am|pm)/i.test(trimmed)) {
    return trimmed;
  }
  try {
    const parsedDate = new Date(trimmed);
    if (!isNaN(parsedDate.getTime())) {
      return parsedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  } catch (err) {
    // ignore
  }
  return trimmed;
};

const formatDate = (dateStr: string, timeFallback?: string) => {
  if (dateStr && dateStr !== 'N/A') {
    if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
      try {
        return new Date(dateStr).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' });
      } catch (e) {
        return dateStr;
      }
    }
    return dateStr;
  }
  if (timeFallback && timeFallback !== 'N/A') {
    try {
      const parsedDate = new Date(timeFallback);
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate.toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' });
      }
    } catch (e) {
      // ignore
    }
  }
  return 'N/A';
};

const calculateDuration = (start: string, end: string) => {
  if (!start || !end || start === 'N/A' || end === 'N/A' || end === 'Active') return '';
  try {
    let startMins = 0;
    let endMins = 0;

    const parseTimeStr = (timeStr: string) => {
      const parts = timeStr.trim().toLowerCase().split(' ');
      let [hours, minutes] = parts[0].split(':').map(Number);
      if (parts[1]) {
        if (hours === 12) {
          hours = parts[1] === 'am' ? 0 : 12;
        } else if (parts[1] === 'pm') {
          hours += 12;
        }
      }
      return (hours || 0) * 60 + (minutes || 0);
    };

    if (start.includes('T') || !isNaN(Date.parse(start))) {
      const startDateObj = new Date(start);
      startMins = startDateObj.getHours() * 60 + startDateObj.getMinutes();
    } else {
      startMins = parseTimeStr(start);
    }

    if (end.includes('T') || !isNaN(Date.parse(end))) {
      const endDateObj = new Date(end);
      endMins = endDateObj.getHours() * 60 + endDateObj.getMinutes();
    } else {
      endMins = parseTimeStr(end);
    }

    let diff = endMins - startMins;
    if (diff < 0) diff += 24 * 60;
    const hrs = Math.floor(diff / 60);
    const mins = diff % 60;
    return `${hrs}h ${mins}m`;
  } catch (e) {
    return '';
  }
};

const isToday = (dateStr: string | null | undefined, timeStr?: string) => {
  const today = new Date();
  
  if (dateStr && dateStr !== 'N/A') {
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      return parsed.getDate() === today.getDate() &&
             parsed.getMonth() === today.getMonth() &&
             parsed.getFullYear() === today.getFullYear();
    }
    // Handle manual DD-MMM-YYYY format (e.g., "13-Jul-2026")
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
      const month = months.indexOf(parts[1].toLowerCase());
      const year = parseInt(parts[2], 10);
      if (day === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
        return true;
      }
    }
  }
  
  if (timeStr && timeStr !== 'N/A') {
    const parsed = new Date(timeStr);
    if (!isNaN(parsed.getTime())) {
      return parsed.getDate() === today.getDate() &&
             parsed.getMonth() === today.getMonth() &&
             parsed.getFullYear() === today.getFullYear();
    }
  }
  
  return false;
};

const AttendanceScreen = () => {
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();

  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [hasCheckedOutToday, setHasCheckedOutToday] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkInTime, setCheckInTime] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [address, setAddress] = useState('');
  const [userName, setUserName] = useState('');
  const [designation, setDesignation] = useState('');
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    if (isFocused) {
      restoreAttendanceStatus();
    }
  }, [isFocused]);

  const restoreAttendanceStatus = async () => {
    try {
      setLoading(true);

      const storedName = await AsyncStorage.getItem('@user_name');
      const storedRole = await AsyncStorage.getItem('@designation');
      if (storedName) setUserName(storedName);
      if (storedRole) setDesignation(storedRole);

      let serverLogs: any[] = [];
      try {
        serverLogs = await getAttendanceLogs();
      } catch (err) {
        console.log('Failed to fetch attendance logs from backend:', err);
      }

      let mappedLogs: any[] = [];
      const todayStr = new Date().toISOString().split('T')[0]; // "2026-07-13"

      if (serverLogs && serverLogs.length > 0) {
        mappedLogs = serverLogs.map((log: any, idx: number) => {
          const checkInRaw = log.checkIn || log.checkInTime || 'N/A';
          
          // Detect active state robustly across null, undefined, "null", "NULL", "Active", or empty values
          const rawOut = log.checkOut || log.checkOutTime;
          const isActive = !rawOut || rawOut === 'Active' || rawOut === 'null' || rawOut === 'NULL';
          const checkOutRaw = isActive ? 'Active' : rawOut;
          
          const durationStr = calculateDuration(checkInRaw, checkOutRaw);
          const isTodayLog = isToday(log.date, checkInRaw);
          
          return {
            id: log.id || `att-log-${idx}`,
            date: formatDate(log.date, checkInRaw),
            isTodayLog,
            status: log.status ?? 'Unknown',
            checkInTime: formatTime(checkInRaw),
            checkInAddress: log.checkInAddress || log.address || 'N/A',
            checkOutTime: isActive ? 'Active' : formatTime(checkOutRaw),
            checkOutAddress: log.checkOutAddress || 'N/A',
            checkInLat: log.checkInLatitude ?? log.checkInLat ?? null,
            checkInLng: log.checkInLongitude ?? log.checkInLng ?? null,
            checkOutLat: log.checkOutLatitude ?? log.checkOutLat ?? null,
            checkOutLng: log.checkOutLongitude ?? log.checkOutLng ?? null,
            duration: durationStr || 'N/A'
          };
        });
        setLogs(mappedLogs);
        await AsyncStorage.setItem('@attendance_logs', JSON.stringify(mappedLogs));
      } else {
        const storedLogs = await AsyncStorage.getItem('@attendance_logs');
        mappedLogs = safeJsonParse(storedLogs, []);
        setLogs(mappedLogs);
      }

      // Check if there is any attendance log for today
      const todayLogs = mappedLogs.filter((log: any) => log.isTodayLog);

      let isCheckInValid = false;
      let activeTodayLog = null;

      if (todayLogs.length > 0) {
        activeTodayLog = todayLogs.find((log: any) => log.checkOutTime === 'Active');
        if (activeTodayLog) {
          isCheckInValid = true;
        }
      }

      // Update state and sync back to AsyncStorage
      if (isCheckInValid && activeTodayLog) {
        setIsCheckedIn(true);
        setHasCheckedOutToday(false);
        setCheckInTime(activeTodayLog.checkInTime || '');
        setLatitude(activeTodayLog.checkInLat ? parseFloat(activeTodayLog.checkInLat) : null);
        setLongitude(activeTodayLog.checkInLng ? parseFloat(activeTodayLog.checkInLng) : null);
        setAddress(activeTodayLog.checkInAddress || '');

        await AsyncStorage.setItem('@checked_in', 'true');
        await AsyncStorage.setItem('@attendanceId', activeTodayLog.id.toString());
        await AsyncStorage.setItem('@check_in_date', todayStr);
        await AsyncStorage.setItem('@check_in_time', activeTodayLog.checkInTime);
        if (activeTodayLog.checkInLat) await AsyncStorage.setItem('@check_in_lat', activeTodayLog.checkInLat.toString());
        if (activeTodayLog.checkInLng) await AsyncStorage.setItem('@check_in_lng', activeTodayLog.checkInLng.toString());
        await AsyncStorage.setItem('@check_in_address', activeTodayLog.checkInAddress);
        await AsyncStorage.setItem('@attendance_date', new Date().toISOString());
      } else {
        setIsCheckedIn(false);
        setCheckInTime('');
        setLatitude(null);
        setLongitude(null);
        setAddress('');

        await AsyncStorage.setItem('@checked_in', 'false');
        await AsyncStorage.removeItem('@attendanceId');
        
        if (todayLogs.length > 0) {
          setHasCheckedOutToday(true);
        } else {
          setHasCheckedOutToday(false);
        }
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
            { backgroundColor: isCheckedIn ? '#e8f5e9' : hasCheckedOutToday ? '#e0f2f1' : '#ffebee' }
          ]}>
            <Text style={[
              styles.statusText,
              { color: isCheckedIn ? '#2e7d32' : hasCheckedOutToday ? '#00796b' : '#c62828' }
            ]}>
              {isCheckedIn ? '🟢 Checked In / On Duty' : hasCheckedOutToday ? '🟢 Duty Completed / Checked Out' : '🔴 Checked Out / Off Duty'}
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
          {hasCheckedOutToday ? (
            <TouchableOpacity 
              style={[styles.checkInButton, { backgroundColor: '#B2DFDB' }]} 
              disabled={true}
            >
              <Text style={[styles.buttonText, { color: '#004d40' }]}>DUTY COMPLETED FOR TODAY</Text>
            </TouchableOpacity>
          ) : !isCheckedIn ? (
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