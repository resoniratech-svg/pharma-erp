import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  getDailyMovement
} from '../../services/dailyMovementService';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
  Switch,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import RNDateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

interface LocationLog {
  id: number;
  time: string;
  latitude: number;
  longitude: number;
  address: string;
  type: 'checkin' | 'doctor' | 'chemist' | 'checkpoint' | 'checkout';
  label: string;
  accuracy?: number; // GPS precision in meters
}

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const safeJsonParse = (data: string | null, fallback: any) => {
  if (!data) return fallback;
  try {
    return JSON.parse(data);
  } catch (err) {
    console.log('safeJsonParse error:', err);
    return fallback;
  }
};

// Movement log data loaded from backend API and AsyncStorage only.
// No hardcoded location or visit data allowed in production.

const DailyMovementTrackingScreen = () => {
  const navigation = useNavigation<any>();
  const [selectedDate, setSelectedDate] = useState(
    new Date().toLocaleDateString('en-GB').replace(/\//g, '-')
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isLiveTracking, setIsLiveTracking] = useState(false);
  const [movementLogs, setMovementLogs] = useState<LocationLog[]>([]);
  const [totalDistance, setTotalDistance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSynced, setLastSynced] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [routeCoverage, setRouteCoverage] = useState('N/A');
  const [movementSummary, setMovementSummary] = useState<any>(null);

  const trackingTimerRef = useRef<any>(null);
  const simTimerRef = useRef<any>(null);

  // Web date picker config
  const getWebDateFormat = (dateStr: string) => {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateStr;
  };

  const handleDateChangeWeb = (val: string) => {
    if (!val) return;
    const parts = val.split('-');
    if (parts.length === 3) {
      setSelectedDate(`${parts[2]}-${parts[1]}-${parts[0]}`);
    }
  };

  const parseDateString = (dateStr: string): Date => {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    }
    return new Date();
  };

  const customAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const formatLastSyncedTime = () => {
    const d = new Date();
    const formattedDate = d.toLocaleDateString('en-GB').replace(/\//g, '-');
    const formattedTime = d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    return `${formattedDate} ${formattedTime}`;
  };

  const isDateMatch = (itemDate: any, targetDate: string): boolean => {
    if (!itemDate) return false;
    try {
      if (/^\d{2}-\d{2}-\d{4}$/.test(itemDate)) {
        return itemDate === targetDate;
      }
      const parts = itemDate.toString().replace(/,/g, '').split(/[\s-]+/);
      if (parts.length >= 3) {
        const day = parts[0].padStart(2, '0');
        const monthStr = parts[1];
        const year = parts[2];
        const months: { [key: string]: string } = {
          'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04', 'may': '05', 'jun': '06',
          'jul': '07', 'aug': '08', 'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12',
          'january': '01', 'february': '02', 'march': '03', 'april': '04', 'june': '06',
          'july': '07', 'august': '08', 'september': '09', 'october': '10', 'november': '11', 'december': '12'
        };
        let month = '01';
        if (months[monthStr.toLowerCase()]) {
          month = months[monthStr.toLowerCase()];
        } else {
          month = monthStr.padStart(2, '0');
        }
        const normalized = `${day}-${month}-${year}`;
        return normalized === targetDate;
      }
      return false;
    } catch {
      return false;
    }
  };

  // Real-time visit coverage calculations
  const calculateRealCoverage = async () => {
    try {
      const storedTerritories = await AsyncStorage.getItem('@assigned_territories');
      const activeTerritories = safeJsonParse(storedTerritories, []);
      
      const docVisitsData = await AsyncStorage.getItem('@doctor_visits');
      const chemistVisitsData = await AsyncStorage.getItem('@chemist_visits');
      const docVisits = safeJsonParse(docVisitsData, []);
      const chemVisits = safeJsonParse(chemistVisitsData, []);

      // Match visits for selected date
      const todayDocs = docVisits.filter((v: any) => {
        const val = v.date || v.visitDate || v.timestamp;
        return isDateMatch(val, selectedDate);
      });
      const todayChems = chemVisits.filter((v: any) => {
        const val = v.date || v.visitDate || v.timestamp;
        return isDateMatch(val, selectedDate);
      });

      const totalVisitedToday = todayDocs.length + todayChems.length;

      if (activeTerritories.length > 0) {
        const activeBeats = activeTerritories.filter((t: any) => t.status === 'Active Beat');
        const targetBeats = activeBeats.length > 0 ? activeBeats : activeTerritories;
        const totalAssigned = targetBeats.reduce(
          (sum: number, t: any) => sum + (t.doctorsCount || 0) + (t.chemistsCount || 0),
          0
        );

        if (totalAssigned > 0) {
          const pct = Math.min(Math.round((totalVisitedToday / totalAssigned) * 100), 100);
          setRouteCoverage(`${pct}%`);
        } else {
          setRouteCoverage('N/A');
        }
      } else {
        setRouteCoverage('N/A');
      }
    } catch (e) {
      console.log('Failed to calculate dynamic coverage', e);
      setRouteCoverage('N/A');
    }
  };

 const loadMovementSummary = async () => {

  try {

    const [day, month, year] =
      selectedDate.split('-');

    const apiDate =
      `${year}-${month}-${day}`;

    console.log(
      'API DATE:',
      apiDate
    );

    const summary =
      await getDailyMovement(
        apiDate
      );

      setMovementSummary(summary);

    console.log(
      'DAILY MOVEMENT:',
      summary
    );

  } catch (error) {

    console.log(
      'Daily Movement Error:',
      error
    );

  }
};

  // Load logs
  const loadMovementLogs = async (showLoadingSpinner = true) => {
    if (showLoadingSpinner) {
      setLoading(true);
    }
    setError(null);
    try {
      const key = `@gps_movement_${selectedDate}`;
      const stored = await AsyncStorage.getItem(key);
      let logs: LocationLog[] = [];
      if (stored) {
        logs = safeJsonParse(stored, []);
      }
      
      if (logs.length === 0) {
        const compiled: LocationLog[] = [];
        
        // 1. Add Check-In if exists
        const checkInLat = await AsyncStorage.getItem('@check_in_lat');
        const checkInLng = await AsyncStorage.getItem('@check_in_lng');
        const checkInAddress = await AsyncStorage.getItem('@check_in_address');
        const checkInTime = await AsyncStorage.getItem('@check_in_time');
        
        if (checkInLat && checkInLng) {
          compiled.push({
            id: Date.now() - 100000,
            time: checkInTime || '09:00 AM',
            latitude: parseFloat(checkInLat),
            longitude: parseFloat(checkInLng),
            address: checkInAddress || 'Check-in location',
            type: 'checkin',
            label: 'Checked-In: Beat Start',
            accuracy: 4
          });
        }
        
        // 2. Add doctor visits today
        const docVisitsData = await AsyncStorage.getItem('@doctor_visits');
        const docVisits = safeJsonParse(docVisitsData, []);
        const todayDocs = docVisits.filter((v: any) => isDateMatch(v.date || v.visitDate || v.timestamp, selectedDate));
        
        todayDocs.forEach((v: any, idx: number) => {
          if (v.latitude && v.longitude) {
            compiled.push({
              id: v.id || (Date.now() - 50000 + idx),
              time: v.visitTime || '10:00 AM',
              latitude: parseFloat(v.latitude),
              longitude: parseFloat(v.longitude),
              address: v.clinicAddress || v.address || 'Doctor clinic',
              type: 'doctor',
              label: `Visit: Dr. ${v.doctorName || 'Doctor'}`,
              accuracy: 5
            });
          }
        });
        
        // 3. Add chemist visits today
        const chemistVisitsData = await AsyncStorage.getItem('@chemist_visits');
        const chemVisits = safeJsonParse(chemistVisitsData, []);
        const todayChems = chemVisits.filter((v: any) => isDateMatch(v.date || v.visitDate || v.timestamp, selectedDate));
        
        todayChems.forEach((v: any, idx: number) => {
          if (v.latitude && v.longitude) {
            compiled.push({
              id: v.id || (Date.now() - 25000 + idx),
              time: v.visitTime || '11:00 AM',
              latitude: parseFloat(v.latitude),
              longitude: parseFloat(v.longitude),
              address: v.address || 'Chemist pharmacy store',
              type: 'chemist',
              label: `Visit: ${v.shopName || v.chemistName || 'Chemist'}`,
              accuracy: 6
            });
          }
        });
        
        // 4. Add Check-Out if exists
        const checkOutLat = await AsyncStorage.getItem('@check_out_lat');
        const checkOutLng = await AsyncStorage.getItem('@check_out_lng');
        const checkOutAddress = await AsyncStorage.getItem('@check_out_address');
        const checkOutTime = await AsyncStorage.getItem('@check_out_time');
        
        if (checkOutLat && checkOutLng) {
          compiled.push({
            id: Date.now(),
            time: checkOutTime || '06:00 PM',
            latitude: parseFloat(checkOutLat),
            longitude: parseFloat(checkOutLng),
            address: checkOutAddress || 'Check-out location',
            type: 'checkout',
            label: 'Checked-Out: Beat End',
            accuracy: 4
          });
        }

        const timeToMinutes = (timeStr: string): number => {
          if (!timeStr) return 0;
          const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
          if (!match) return 0;
          let hrs = parseInt(match[1]);
          const mins = parseInt(match[2]);
          const ampm = match[3].toUpperCase();
          if (ampm === 'PM' && hrs < 12) hrs += 12;
          if (ampm === 'AM' && hrs === 12) hrs = 0;
          return hrs * 60 + mins;
        };

        compiled.sort((a, b) => {
          if (a.type === 'checkin') return -1;
          if (b.type === 'checkin') return 1;
          if (a.type === 'checkout') return 1;
          if (b.type === 'checkout') return -1;
          return timeToMinutes(a.time) - timeToMinutes(b.time);
        });
        
        logs = compiled;
      }

      setMovementLogs(logs);
      calculateTotalDist(logs);
      await calculateRealCoverage();
      setLastSynced(formatLastSyncedTime());
    } catch (e) {
      console.log('Failed to load GPS logs', e);
      setError('Failed to load location logs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

 useFocusEffect(
  useCallback(() => {

    const loadData = async () => {

      await loadMovementSummary();

      console.log('SELECTED DATE:', selectedDate);
console.log('TYPE:', typeof selectedDate);

      await loadMovementLogs(true);

    };

    loadData();

    return () => {

      // Cleanup timers on focus blur
      if (trackingTimerRef.current) {
        clearInterval(trackingTimerRef.current);
      }

      if (simTimerRef.current) {
        clearInterval(simTimerRef.current);
      }

    };

  }, [selectedDate])
);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMovementLogs(false);
    setRefreshing(false);
  };

  const calculateTotalDist = (logs: LocationLog[]) => {
    if (logs.length < 2) {
      setTotalDistance(0);
      return;
    }
    let dist = 0;
    for (let i = 0; i < logs.length - 1; i++) {
      dist += calculateDistance(
        logs[i].latitude,
        logs[i].longitude,
        logs[i + 1].latitude,
        logs[i + 1].longitude
      );
    }
    setTotalDistance(parseFloat(dist.toFixed(2)));
  };

  // Live GPS Tracking Node Logging
  const logCurrentLocation = async (manualAlert = false) => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        customAlert('Permission Denied', 'GPS location tracking requires system permission.');
        setIsLiveTracking(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const lat = parseFloat(loc.coords.latitude.toFixed(5));
      const lng = parseFloat(loc.coords.longitude.toFixed(5));
      const accuracyRounded = loc.coords.accuracy ? Math.round(loc.coords.accuracy) : 6;

      // Reverse geocode for real address
      let addressStr = 'Resolving GPS Address...';
      try {
        const geocode = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
        if (geocode && geocode.length > 0) {
          const g = geocode[0];
          addressStr = `${g.name || ''} ${g.street || ''}, ${g.subregion || ''}, ${g.city || ''}, ${g.region || ''}`;
        }
      } catch (geoErr) {
        console.log('Failed to reverse geocode coordinate:', geoErr);
        addressStr = `GPS Coordinates (${lat}, ${lng})`;
      }

      const timeStr = new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });

      // Determine label based on existing nodes
      let type: LocationLog['type'] = 'checkpoint';
      let label = 'GPS Route Checkpoint';
      
      if (movementLogs.length === 0) {
        type = 'checkin';
        label = 'Auto Beat Check-In';
      }

      const newLog: LocationLog = {
        id: Date.now(),
        time: timeStr,
        latitude: lat,
        longitude: lng,
        address: addressStr.trim(),
        type,
        label,
        accuracy: accuracyRounded,
      };

      setMovementLogs(prev => {
        const updated = [...prev, newLog];
        calculateTotalDist(updated);
        const key = `@gps_movement_${selectedDate}`;
        AsyncStorage.setItem(key, JSON.stringify(updated)).catch(e => console.log(e));
        return updated;
      });

      setLastSynced(formatLastSyncedTime());
      if (manualAlert) {
        customAlert('GPS Logged', `Real coordinate saved with accuracy ±${accuracyRounded}m.`);
      }
    } catch (err) {
      console.log('Failed to fetch live GPS coordinate', err);
      if (manualAlert) {
        customAlert('GPS Error', 'Unable to fetch current GPS coordinates.');
      }
    }
  };

  // Live GPS tracking switch hook
  useEffect(() => {
    if (isLiveTracking) {
      // Log immediately first
      logCurrentLocation(false);
      // Run loop every 20 seconds
      trackingTimerRef.current = setInterval(() => {
        logCurrentLocation(false);
      }, 20000);
    } else {
      if (trackingTimerRef.current) {
        clearInterval(trackingTimerRef.current);
      }
    }
    return () => {
      if (trackingTimerRef.current) clearInterval(trackingTimerRef.current);
    };
  }, [isLiveTracking]);

  // Dev simulation loop
  useEffect(() => {
    if (isSimulating) {
      simTimerRef.current = setInterval(() => {
        addMockCoordinatesNode();
      }, 5000);
    } else {
      if (simTimerRef.current) clearInterval(simTimerRef.current);
    }
    return () => {
      if (simTimerRef.current) clearInterval(simTimerRef.current);
    };
  }, [isSimulating, movementLogs]);

  // Dev Simulation seed logs
  const addMockCoordinatesNode = async () => {
    let baseLat = 17.3850;
    let baseLng = 78.4867;
    
    if (movementLogs.length > 0) {
      baseLat = movementLogs[movementLogs.length - 1].latitude;
      baseLng = movementLogs[movementLogs.length - 1].longitude;
    } else {
      const checkInLat = await AsyncStorage.getItem('@check_in_lat');
      const checkInLng = await AsyncStorage.getItem('@check_in_lng');
      if (checkInLat && checkInLng) {
        baseLat = parseFloat(checkInLat);
        baseLng = parseFloat(checkInLng);
      }
    }

    const newLat = baseLat + (Math.random() - 0.5) * 0.003;
    const newLng = baseLng + (Math.random() - 0.5) * 0.003;
    const timeStr = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const newLog: LocationLog = {
      id: Date.now(),
      time: timeStr,
      latitude: parseFloat(newLat.toFixed(5)),
      longitude: parseFloat(newLng.toFixed(5)),
      address: `Simulated Beat coordinate Grid-${Math.floor(Math.random() * 80 + 20)}, Hyderabad`,
      type: 'checkpoint',
      label: `Auto GPS Checkpoint`,
      accuracy: Math.floor(Math.random() * 5 + 3), // ±3m to ±8m
    };

    setMovementLogs(prev => {
      const updated = [...prev, newLog];
      calculateTotalDist(updated);
      const key = `@gps_movement_${selectedDate}`;
      AsyncStorage.setItem(key, JSON.stringify(updated)).catch(e => console.log(e));
      return updated;
    });

    setLastSynced(formatLastSyncedTime());
  };

  // loadMockRouteDemo removed — no hardcoded location data in production.


  const clearLogs = async () => {
    const key = `@gps_movement_${selectedDate}`;
    await AsyncStorage.removeItem(key);
    await loadMovementLogs(false);
    setIsSimulating(false);
    setIsLiveTracking(false);
    await calculateRealCoverage();
    customAlert('Logs Cleared', 'Tracked location coordinates cleared for ' + selectedDate);
  };

  // Coordinate projections
  const projectCoordinates = (logs: LocationLog[]) => {
    if (logs.length === 0) return [];
    const minLat = Math.min(...logs.map((l) => l.latitude));
    const maxLat = Math.max(...logs.map((l) => l.latitude));
    const minLng = Math.min(...logs.map((l) => l.longitude));
    const maxLng = Math.max(...logs.map((l) => l.longitude));

    const latDiff = maxLat - minLat || 0.0001;
    const lngDiff = maxLng - minLng || 0.0001;

    return logs.map((log) => {
      const x = 20 + ((log.longitude - minLng) / lngDiff) * 240;
      const y = 140 - ((log.latitude - minLat) / latDiff) * 110;
      return { ...log, x, y };
    });
  };

  const projectedNodes = projectCoordinates(movementLogs);

  const avgAccuracy = movementLogs.length > 0
    ? Math.round(movementLogs.reduce((sum, log) => sum + (log.accuracy || 0), 0) / movementLogs.length)
    : 5;
  const averageAccuracy = `±${avgAccuracy}m`;

  const handleClearLogs = () => {
    if (Platform.OS === 'web') {
      const confirmClear = window.confirm('Are you sure you want to clear location logs for ' + selectedDate + '?');
      if (confirmClear) {
        clearLogs();
      }
    } else {
      Alert.alert(
        'Confirm Clear',
        'Are you sure you want to clear location logs for ' + selectedDate + '?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Clear', onPress: clearLogs, style: 'destructive' }
        ]
      );
    }
  };

  // Dynamic MR metrics
  const firstLogged = movementLogs.length > 0 ? movementLogs[0].time : '--:--';
  const lastLogged = movementLogs.length > 0 ? movementLogs[movementLogs.length - 1].time : '--:--';

  let calculatedWorkingHours = '0.0 hrs';
  if (movementSummary?.checkInTime) {
    const checkInDate = new Date(movementSummary.checkInTime);
    const end = movementSummary.checkOutTime ? new Date(movementSummary.checkOutTime) : new Date();
    const diffMs = end.getTime() - checkInDate.getTime();
    if (diffMs > 0) {
      const diffHrs = diffMs / (1000 * 60 * 60);
      calculatedWorkingHours = `${diffHrs.toFixed(1)} hrs`;
    }
  } else if (movementSummary?.workingHours) {
    calculatedWorkingHours = `${movementSummary.workingHours} hrs`;
  }

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
    const logs = ${JSON.stringify(movementLogs)};
    if (logs.length > 0) {
      const map = L.map('map');
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
      }).addTo(map);

      const points = logs.map(l => [l.latitude, l.longitude]);
      
      const polyline = L.polyline(points, {color: '#4F46E5', weight: 4, opacity: 0.8}).addTo(map);
      
      logs.forEach((log, idx) => {
        let color = '#2563EB';
        if (log.type === 'checkin') color = '#10B981';
        else if (log.type === 'checkout') color = '#EF4444';
        else if (log.type === 'doctor') color = '#06B6D4';
        else if (log.type === 'chemist') color = '#F59E0B';

        const customIcon = L.divIcon({
          className: 'custom-div-icon',
          html: '<div style="background-color: ' + color + '; width: 22px; height: 22px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 11px; box-shadow: 0 2px 5px rgba(0,0,0,0.3)">' + (idx + 1) + '</div>',
          iconSize: [22, 22],
          iconAnchor: [11, 11]
        });

        L.marker([log.latitude, log.longitude], {icon: customIcon})
          .bindPopup('<b>' + (idx + 1) + '. ' + log.label + '</b><br/>⏱️ ' + log.time + '<br/>📍 ' + log.address)
          .addTo(map);
      });

      map.fitBounds(polyline.getBounds(), { padding: [30, 30] });
    } else {
      document.getElementById('map').innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#64748B;font-family:sans-serif;font-size:14px;">No GPS route path trace available</div>';
    }
  </script>
</body>
</html>
  `;

  const webInputStyle = {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    backgroundColor: '#F8FAFC',
    width: '100%',
    outlineStyle: 'none',
  } as any;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Daily GPS Movement</Text>
        <Text style={styles.headerSubtitle}>Route coordinates trace & tracker</Text>
      </View>

      {/* Date & Simulator Controller Panel */}
      <View style={styles.controlCard}>
        <View style={styles.dateSelectorRow}>
          <Text style={styles.label}>Log Date:</Text>
          {Platform.OS === 'web' ? (
            <input
              type="date"
              value={getWebDateFormat(selectedDate)}
              onChange={(e) => handleDateChangeWeb(e.target.value)}
              style={webInputStyle}
            />
          ) : (
            <TouchableOpacity
              style={styles.dateBtn}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dateBtnText}>{selectedDate}</Text>
            </TouchableOpacity>
          )}
          {showDatePicker && (
            <RNDateTimePicker
              mode="date"
              value={parseDateString(selectedDate)}
              onChange={(e, d) => {
                setShowDatePicker(false);
                if (d) {
                  const day = d.getDate().toString().padStart(2, '0');
                  const month = (d.getMonth() + 1).toString().padStart(2, '0');
                  const year = d.getFullYear();
                  setSelectedDate(`${day}-${month}-${year}`);
                }
              }}
            />
          )}
        </View>

        {/* Live GPS tracking switch */}
        <View style={styles.liveTrackingRow}>
          <View>
            <Text style={styles.liveLabel}>Live GPS Route Tracking</Text>
            <Text style={styles.liveDesc}>Log device coordinates automatically</Text>
          </View>
          <Switch
            value={isLiveTracking}
            onValueChange={setIsLiveTracking}
            trackColor={{ false: '#CBD5E1', true: '#A7F3D0' }}
            thumbColor={isLiveTracking ? '#10B981' : '#94A3B8'}
          />
        </View>

        {lastSynced ? (
          <Text style={styles.syncText}>Last Synced: {lastSynced}</Text>
        ) : null}

        {/* Developer Simulation Section visible only in local development */}
        {__DEV__ && (
          <View style={styles.devTools}>
            <View style={styles.devDivider} />
            <Text style={styles.devTitle}>🛠️ Developer Simulation Tools</Text>
            <View style={styles.simulatorRow}>
              <View>
                <Text style={styles.simLabel}>GPS Simulation Switch</Text>
                <Text style={styles.simDesc}>Inject mock checkpoints (5s)</Text>
              </View>
              <Switch
                value={isSimulating}
                onValueChange={setIsSimulating}
                trackColor={{ false: '#CBD5E1', true: '#BFDBFE' }}
                thumbColor={isSimulating ? '#2563EB' : '#94A3B8'}
              />
            </View>
            {/* Seed Demo Route Trace button removed for production */}
          </View>
        )}
      </View>

      {loading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Fetching GPS track records...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContent}>
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => loadMovementLogs(true)}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4F46E5']} />
          }
        >
          {/* Stats Overview Grid (Production KPIs) */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statVal}>{totalDistance} km</Text>
              <Text style={styles.statLabel}>Distance Cover</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statVal}>{movementLogs.length}</Text>
              <Text style={styles.statLabel}>Total Nodes</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statVal}>{firstLogged}</Text>
              <Text style={styles.statLabel}>First Logged</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statVal}>{lastLogged}</Text>
              <Text style={styles.statLabel}>Last Logged</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statVal}>{routeCoverage}</Text>
              <Text style={styles.statLabel}>Route Coverage</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statVal, { color: '#0D9488' }]}>{averageAccuracy}</Text>
              <Text style={styles.statLabel}>GPS Precision</Text>
            </View>
          </View>

          {/* Today's Performance Summary Grid */}
          <Text style={styles.sectionTitle}>📋 Today's Performance Summary</Text>
          <View style={styles.summaryContainer}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryIcon}>👨‍⚕️</Text>
                <Text style={styles.summaryVal}>{movementSummary?.doctorVisits || 0}</Text>
                <Text style={styles.summaryLabel}>Doctor Visits</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryIcon}>💊</Text>
                <Text style={styles.summaryVal}>{movementSummary?.chemistVisits || 0}</Text>
                <Text style={styles.summaryLabel}>Chemist Visits</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryIcon}>📍</Text>
                <Text style={styles.summaryVal}>{movementSummary?.totalStops || 0}</Text>
                <Text style={styles.summaryLabel}>Total Stops</Text>
              </View>
            </View>
            <View style={styles.summaryRow}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryIcon}>⏱️</Text>
                <Text style={styles.summaryVal}>{calculatedWorkingHours}</Text>
                <Text style={styles.summaryLabel}>Working Hours</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryIcon}>🟢</Text>
                <Text style={styles.summaryVal}>
                  {movementSummary?.checkInTime
                    ? new Date(movementSummary.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : 'N/A'}
                </Text>
                <Text style={styles.summaryLabel}>Check In</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryIcon}>🔴</Text>
                <Text style={styles.summaryVal}>
                  {movementSummary?.checkOutTime
                    ? new Date(movementSummary.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : 'N/A'}
                </Text>
                <Text style={styles.summaryLabel}>Check Out</Text>
              </View>
            </View>
          </View>

          {/* 🗺️ Route Trace Map */}
          <Text style={styles.sectionTitle}>🗺️ Daily Movement Beat Map</Text>
          <View style={styles.mapContainer}>
            {Platform.OS === 'web' ? (
              <iframe
                srcDoc={mapHtml}
                style={{ width: '100%', height: '100%', border: 'none', borderRadius: 12 }}
                title="GPS Route Map"
              />
            ) : (
              <View style={{ flex: 1 }}>
                <View style={styles.gridBg}>
                  <View style={styles.gridLineH} />
                  <View style={styles.gridLineH} />
                  <View style={styles.gridLineH} />
                  <View style={styles.gridLineV} />
                  <View style={styles.gridLineV} />
                  <View style={styles.gridLineV} />
                </View>

                {projectedNodes.length > 0 ? (
                  projectedNodes.map((node: any, idx: number) => {
                    const isLatest = idx === projectedNodes.length - 1;
                    let color = '#2563EB';
                    if (node.type === 'checkin') color = '#10B981';
                    if (node.type === 'checkout') color = '#EF4444';
                    if (node.type === 'doctor') color = '#06B6D4';
                    if (node.type === 'chemist') color = '#F59E0B';

                    return (
                      <View
                        key={node.id}
                        style={[
                          styles.mapNode,
                          {
                            left: node.x,
                            top: node.y,
                            backgroundColor: color,
                            shadowColor: color,
                          },
                        ]}
                      >
                        {isLatest && <View style={styles.pulseRing} />}
                        <Text style={styles.nodeIdx}>{idx + 1}</Text>
                      </View>
                    );
                  })
                ) : (
                  <View style={styles.emptyMapContent}>
                    <Text style={styles.emptyMapText}>No visual track path available</Text>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Path Log Table Header */}
          <View style={styles.logHeaderRow}>
            <Text style={styles.sectionTitle}>Route Track Details</Text>
            {movementLogs.length > 0 && (
              <TouchableOpacity onPress={handleClearLogs}>
                <Text style={styles.clearText}>Clear Logs</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Location list or custom empty state card */}
          {movementLogs.length > 0 ? (
            <View style={styles.logsList}>
              {movementLogs.map((log, index) => {
                let tagStyle = styles.tagCheckpoint;
                if (log.type === 'checkin') tagStyle = styles.tagCheckin;
                if (log.type === 'checkout') tagStyle = styles.tagCheckout;
                if (log.type === 'doctor') tagStyle = styles.tagDoctor;
                if (log.type === 'chemist') tagStyle = styles.tagChemist;

                return (
                  <View key={log.id} style={styles.logCard}>
                    <View style={styles.logMeta}>
                      <View style={styles.logIndexCircle}>
                        <Text style={styles.logIndexText}>{index + 1}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.logTime}>
                          ⏱️ {log.time} {log.accuracy ? `| 📡 Accuracy: ±${log.accuracy}m` : ''}
                        </Text>
                        <Text style={styles.logLabel}>{log.label}</Text>
                      </View>
                      <Text style={[styles.tagBadge, tagStyle]}>
                        {log.type.toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.logDivider} />
                    <Text style={styles.logCoords}>
                      🌐 Lat: {log.latitude} | Lng: {log.longitude}
                    </Text>
                    <Text style={styles.logAddress}>{log.address}</Text>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <Ionicons name="location-outline" size={48} color="#94A3B8" />
              <Text style={styles.emptyCardTitle}>No Location Logs Available</Text>
              <Text style={styles.emptyCardSub}>
                There are no GPS coordinates logged for {selectedDate}. Enable "Live GPS Route Tracking" to automatically trace coordinates using the device GPS.
              </Text>
            </View>
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
};

export default DailyMovementTrackingScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#4F46E5',
    paddingTop: 50,
    paddingBottom: 25,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  headerSubtitle: {
    display: 'none', // Omit subtitle for layout simplicity
  },
  controlCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginTop: -15,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  dateSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  label: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#475569',
  },
  dateBtn: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#F8FAFC',
  },
  dateBtnText: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: 'bold',
  },
  liveTrackingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  liveLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  liveDesc: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 1,
  },
  syncText: {
    fontSize: 10,
    color: '#94A3B8',
    textAlign: 'right',
    marginTop: 8,
    fontStyle: 'italic',
  },
  devTools: {
    marginTop: 10,
  },
  devDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },
  devTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#D97706',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  simulatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  simLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#475569',
  },
  simDesc: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 1,
  },
  seedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#D97706',
    borderRadius: 8,
    paddingVertical: 8,
    marginTop: 4,
  },
  seedBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  statCard: {
    width: '31.5%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  statVal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4F46E5',
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 9,
    color: '#64748B',
    marginTop: 4,
    fontWeight: '600',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  summaryContainer: {
    marginHorizontal: 0,
    marginTop: 10,
    gap: 12,
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  summaryIcon: {
    fontSize: 20,
    marginBottom: 6,
  },
  summaryVal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0F172A',
    textAlign: 'center',
  },
  summaryLabel: {
    fontSize: 9,
    color: '#64748B',
    marginTop: 2,
    textAlign: 'center',
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 10,
  },
  mapContainer: {
    height: 180,
    backgroundColor: '#0F172A',
    borderRadius: 16,
    position: 'relative',
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  gridBg: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-around',
    alignItems: 'stretch',
    opacity: 0.08,
  },
  gridLineH: {
    height: 1,
    backgroundColor: '#FFFFFF',
  },
  gridLineV: {
    width: 1,
    backgroundColor: '#FFFFFF',
    position: 'absolute',
    top: 0,
    bottom: 0,
  },
  emptyMapContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyMapText: {
    color: '#64748B',
    fontSize: 13,
    fontStyle: 'italic',
  },
  mapNode: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4,
  },
  nodeIdx: {
    fontSize: 9,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  pulseRing: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(37, 99, 235, 0.4)',
    zIndex: 10,
  },
  logHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  clearText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: 'bold',
  },
  logsList: {
    gap: 10,
  },
  logCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  logMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logIndexCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#EEF2F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logIndexText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#475569',
  },
  logTime: {
    fontSize: 11,
    color: '#64748B',
  },
  logLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1E293B',
    marginTop: 1,
  },
  tagBadge: {
    fontSize: 9,
    fontWeight: 'bold',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 8,
    overflow: 'hidden',
  },
  tagCheckin: {
    backgroundColor: '#D1FAE5',
    color: '#065F46',
  },
  tagCheckout: {
    backgroundColor: '#FEE2E2',
    color: '#991B1B',
  },
  tagDoctor: {
    backgroundColor: '#CFFAFE',
    color: '#155E75',
  },
  tagChemist: {
    backgroundColor: '#FEF3C7',
    color: '#92400E',
  },
  tagCheckpoint: {
    backgroundColor: '#DBEAFE',
    color: '#1E40AF',
  },
  logDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 8,
  },
  logCoords: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#4F46E5',
    fontWeight: '600',
  },
  logAddress: {
    fontSize: 12,
    color: '#475569',
    marginTop: 4,
    lineHeight: 16,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  errorText: {
    marginTop: 12,
    fontSize: 14,
    color: '#EF4444',
    textAlign: 'center',
    fontWeight: '500',
  },
  retryBtn: {
    marginTop: 16,
    backgroundColor: '#4F46E5',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 10,
  },
  emptyCardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#334155',
    marginTop: 12,
    textAlign: 'center',
  },
  emptyCardSub: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
    paddingHorizontal: 10,
  },
});