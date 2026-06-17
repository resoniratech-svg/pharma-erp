import React, { useState, useEffect, useCallback, useRef } from 'react';
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

const DEFAULT_LOGS: LocationLog[] = [
  {
    id: 1718100000000,
    time: '09:05 AM',
    latitude: 17.3850,
    longitude: 78.4867,
    address: 'Koti Main Road, Hyderabad Central, TS',
    type: 'checkin',
    label: 'Checked-In: HQ Gate',
    accuracy: 4,
  },
  {
    id: 1718103600000,
    time: '10:30 AM',
    latitude: 17.3912,
    longitude: 78.4905,
    address: 'Dr. Reddy Clinic, Barkatpura, Hyderabad',
    type: 'doctor',
    label: 'Visit: Dr. Suresh Kumar',
    accuracy: 5,
  },
  {
    id: 1718110800000,
    time: '12:45 PM',
    latitude: 17.3980,
    longitude: 78.4988,
    address: 'Sai Krupa Chemists, Himayatnagar, Hyderabad',
    type: 'chemist',
    label: 'Order: Sai Krupa Pharma',
    accuracy: 6,
  },
  {
    id: 1718118000000,
    time: '03:15 PM',
    latitude: 17.4055,
    longitude: 78.5021,
    address: 'MedPlus Drugs, Narayanguda, Hyderabad',
    type: 'chemist',
    label: 'Visit: MedPlus Retail',
    accuracy: 6,
  },
  {
    id: 1718128800000,
    time: '06:15 PM',
    latitude: 17.4120,
    longitude: 78.5110,
    address: 'Secunderabad Exit Beat Gate, Hyderabad',
    type: 'checkout',
    label: 'Checked-Out: Beat Exit',
    accuracy: 5,
  },
];

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
        return val === selectedDate;
      });
      const todayChems = chemVisits.filter((v: any) => {
        const val = v.date || v.visitDate || v.timestamp;
        return val === selectedDate;
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

  // Load logs
  const loadMovementLogs = async (showLoadingSpinner = true) => {
    if (showLoadingSpinner) {
      setLoading(true);
    }
    setError(null);
    try {
      const key = `@gps_movement_${selectedDate}`;
      const stored = await AsyncStorage.getItem(key);
      if (stored) {
        const parsed: LocationLog[] = safeJsonParse(stored, []);
        setMovementLogs(parsed);
        calculateTotalDist(parsed);
      } else {
        setMovementLogs([]);
        setTotalDistance(0);
      }
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
      loadMovementLogs(true);
      return () => {
        // Cleanup timers on focus blur
        if (trackingTimerRef.current) clearInterval(trackingTimerRef.current);
        if (simTimerRef.current) clearInterval(simTimerRef.current);
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
    const baseNode = movementLogs[movementLogs.length - 1] || DEFAULT_LOGS[0];
    const newLat = baseNode.latitude + (Math.random() - 0.5) * 0.006;
    const newLng = baseNode.longitude + (Math.random() - 0.5) * 0.006;
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

  const loadMockRouteDemo = async () => {
    setLoading(true);
    try {
      const key = `@gps_movement_${selectedDate}`;
      await AsyncStorage.setItem(key, JSON.stringify(DEFAULT_LOGS));
      setMovementLogs(DEFAULT_LOGS);
      calculateTotalDist(DEFAULT_LOGS);
      await calculateRealCoverage();
      setLastSynced(formatLastSyncedTime());
      customAlert('Demo Loaded', 'Simulated route data loaded successfully.');
    } catch (e) {
      console.log('Failed to load demo route logs', e);
      setError('Failed to seed demo route.');
    } finally {
      setLoading(false);
    }
  };

  const clearLogs = async () => {
    const key = `@gps_movement_${selectedDate}`;
    await AsyncStorage.removeItem(key);
    setMovementLogs([]);
    setTotalDistance(0);
    setIsSimulating(false);
    setIsLiveTracking(false);
    setRouteCoverage('N/A');
    customAlert('Logs Cleared', 'Location coordinates cleared for ' + selectedDate);
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

  // Dynamic MR metrics
  const firstLogged = movementLogs.length > 0 ? movementLogs[0].time : '--:--';
  const lastLogged = movementLogs.length > 0 ? movementLogs[movementLogs.length - 1].time : '--:--';

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
            <TouchableOpacity style={styles.seedBtn} onPress={loadMockRouteDemo}>
              <Ionicons name="color-wand-outline" size={16} color="#FFFFFF" />
              <Text style={styles.seedBtnText}>Seed Demo Route Trace</Text>
            </TouchableOpacity>
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
              <Text style={[styles.statVal, { color: '#0D9488' }]}>±5m</Text>
              <Text style={styles.statLabel}>GPS Precision</Text>
            </View>
          </View>

          {/* 🗺️ Route Trace Canvas */}
          <Text style={styles.sectionTitle}>🗺️ Visual GPS Path Trace</Text>
          <View style={styles.mapContainer}>
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

          {/* Path Log Table Header */}
          <View style={styles.logHeaderRow}>
            <Text style={styles.sectionTitle}>Route Track Details</Text>
            {movementLogs.length > 0 && (
              <TouchableOpacity onPress={clearLogs}>
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