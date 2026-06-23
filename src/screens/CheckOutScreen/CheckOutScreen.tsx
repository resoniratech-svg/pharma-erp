import { checkOutAttendance } from '../../services/attendanceService';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Platform,
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
    console.log('safeJsonParse error in CheckOutScreen:', err);
    return fallback;
  }
};

const CheckOutScreen = () => {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState('Checking current position...');
  const [totalSales, setTotalSales] = useState('₹ 0');
  const [callsCount, setCallsCount] = useState(0);
  const [fetchingLocation, setFetchingLocation] = useState(false);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    loadDcrMetrics();
  }, []);

  const loadDcrMetrics = async () => {
    setAddress('Checking current position...');
    setFetchingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setAddress('Location permission denied');
        setFetchingLocation(false);
      } else {
        try {
          let coordsObj = null;
          try {
            const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
            coordsObj = loc.coords;
          } catch (gpsError) {
            console.log('Balanced accuracy GPS failed, trying last known position:', gpsError);
            try {
              const lastLoc = await Location.getLastKnownPositionAsync();
              if (lastLoc) {
                coordsObj = lastLoc.coords;
              }
            } catch (fallbackError) {
              console.log('getLastKnownPositionAsync failed:', fallbackError);
            }
          }

          if (coordsObj) {
            setCoords({ latitude: coordsObj.latitude, longitude: coordsObj.longitude });
            const result = await Location.reverseGeocodeAsync({ latitude: coordsObj.latitude, longitude: coordsObj.longitude });
            if (result.length > 0) {
              const place = result[0];
              setAddress([place.name, place.street, place.city, place.region].filter(Boolean).join(', '));
            } else {
              setAddress(`Lat: ${coordsObj.latitude.toFixed(4)}, Lon: ${coordsObj.longitude.toFixed(4)}`);
            }
          } else {
            setAddress('Unable to fetch location. Please enable GPS and tap to retry.');
          }
        } catch (locationError) {
          console.log('Error acquiring location:', locationError);
          setAddress('Unable to fetch location');
        }
      }
    } catch (permissionError) {
      console.log('Permission request error:', permissionError);
      setAddress('Unable to fetch location');
    }

    try {
      // Aggregate today's metrics
      const docData = await AsyncStorage.getItem('@doctor_visits');
      const docList = safeJsonParse(docData, []);
      const chemData = await AsyncStorage.getItem('@chemist_visits');
      const chemList = safeJsonParse(chemData, []);
      const orderData = await AsyncStorage.getItem('@orders');
      const orderList = safeJsonParse(orderData, []);

      setCallsCount(docList.length + chemList.length);

      const orderSum = orderList.reduce((sum: number, item: any) => sum + (parseFloat(item.totalAmount) || 0), 0);
      setTotalSales(`₹ ${orderSum.toLocaleString()}`);
    } catch (e) {
      console.log('Error aggregating DCR metrics:', e);
    } finally {
      setFetchingLocation(false);
    }
  };

  const handleConfirmCheckOut = async () => {
    let activeCoords = coords;
    let finalAddress = address;

    // Try fetching coordinates inline if not loaded yet
    if (!activeCoords) {
      setLoading(true);
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          try {
            const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
            activeCoords = loc.coords;
          } catch (err) {
            const lastLoc = await Location.getLastKnownPositionAsync();
            if (lastLoc) {
              activeCoords = lastLoc.coords;
            }
          }
        }
      } catch (err) {
        console.log('Inline location check error:', err);
      } finally {
        setLoading(false);
      }
    }

    if (!activeCoords) {
      // GPS is unavailable, prompt user to allow checkout without GPS
      if (Platform.OS === 'web') {
        const confirmCheckOut = window.confirm(
          'GPS Lock Unavailable\n\nCould not lock your current GPS coordinates. Do you want to check out anyway? (Logged as GPS unavailable)'
        );
        if (confirmCheckOut) {
          performCheckout(null, 'Location Unavailable (Offline/No GPS)', 'GPS Unavailable');
        }
      } else {
        Alert.alert(
          'GPS Lock Unavailable',
          'Could not lock your current GPS coordinates. Do you want to check out anyway? (Logged as GPS unavailable)',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Check Out Anyway',
              onPress: () => performCheckout(null, 'Location Unavailable (Offline/No GPS)', 'GPS Unavailable')
            }
          ]
        );
      }
      return;
    }

    // Geocode coordinates if we don't have address or it's a fallback string
    if (finalAddress.startsWith('Checking') || finalAddress.startsWith('Unable') || finalAddress.startsWith('Fetching')) {
      setLoading(true);
      try {
        const result = await Location.reverseGeocodeAsync({
          latitude: activeCoords.latitude,
          longitude: activeCoords.longitude,
        });
        if (result.length > 0) {
          const place = result[0];
          finalAddress = [place.name, place.street, place.city, place.region].filter(Boolean).join(', ');
        } else {
          finalAddress = `Lat: ${activeCoords.latitude.toFixed(4)}, Lon: ${activeCoords.longitude.toFixed(4)}`;
        }
      } catch (err) {
        console.log('handleConfirmCheckOut reverseGeocodeAsync failed:', err);
        finalAddress = `Lat: ${activeCoords.latitude.toFixed(4)}, Lon: ${activeCoords.longitude.toFixed(4)}`;
      } finally {
        setLoading(false);
      }
    }

    // Proceed with valid GPS coordinates
    await performCheckout(activeCoords, finalAddress, 'Normal');
  };

  const performCheckout = async (
    checkoutCoords: { latitude: number; longitude: number } | null,
    checkoutAddr: string,
    gpsStatus: 'Normal' | 'GPS Unavailable'
  ) => {
    try {
      setLoading(true);
      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

     const attendanceId =
  await AsyncStorage.getItem('@attendanceId');

console.log(
  'Attendance ID:',
  attendanceId
);

if (
  attendanceId &&
  checkoutCoords
) {
  const response =
    await checkOutAttendance(
      Number(attendanceId),
      checkoutCoords.latitude,
      checkoutCoords.longitude
    );

  console.log(
    'Checkout Response:',
    response
  );
}



      // Fetch check-in data from storage
      const checkInDateStr = await AsyncStorage.getItem('@attendance_date');
      const storedTime = await AsyncStorage.getItem('@check_in_time');
      const storedLat = await AsyncStorage.getItem('@check_in_lat');
      const storedLng = await AsyncStorage.getItem('@check_in_lng');
      const storedAddr = await AsyncStorage.getItem('@check_in_address');

      let durationStr = 'N/A';
      if (checkInDateStr) {
        const checkInDate = new Date(checkInDateStr);
        const checkOutDate = new Date();
        let diffMs = checkOutDate.getTime() - checkInDate.getTime();
        if (diffMs < 0) diffMs = 0; // Guard against negative duration from clock adjustments
        const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        durationStr = `${diffHrs}h ${diffMins}m`;
      }

      // Compile history log entry
      const storedLogs = await AsyncStorage.getItem('@attendance_logs');
      const logsList = safeJsonParse(storedLogs, []);
      const newLog = {
        id: Date.now().toString(),
        date: new Date().toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' }),
        checkInTime: storedTime || 'N/A',
        checkOutTime: time,
        duration: durationStr,
        checkInLat: storedLat ? parseFloat(storedLat) : null,
        checkInLng: storedLng ? parseFloat(storedLng) : null,
        checkOutLat: checkoutCoords ? checkoutCoords.latitude : null,
        checkOutLng: checkoutCoords ? checkoutCoords.longitude : null,
        checkInAddress: storedAddr || 'N/A',
        checkOutAddress: checkoutAddr,
        status: gpsStatus,
      };

      const updatedLogs = [newLog, ...logsList];
      await AsyncStorage.setItem('@attendance_logs', JSON.stringify(updatedLogs));

      // Clear current check-in session variables
      await AsyncStorage.setItem('@checked_in', 'false');
      await AsyncStorage.removeItem(
  '@attendanceId'
);
      await AsyncStorage.removeItem('@check_in_time');
      await AsyncStorage.removeItem('@check_in_lat');
      await AsyncStorage.removeItem('@check_in_lng');
      await AsyncStorage.removeItem('@check_in_address');
      await AsyncStorage.removeItem('@attendance_date');

      if (Platform.OS === 'web') {
        window.alert(`🔴 Checked Out!\n\nDay ended at ${time}`);
        navigation.navigate('Dashboard');
      } else {
        Alert.alert('🔴 Checked Out!', `Day ended at ${time}`, [
          { text: 'OK', onPress: () => navigation.navigate('Dashboard') }
        ]);
      }
    } catch (error) {
      console.log('Error during checkout logging:', error);
      if (Platform.OS === 'web') {
        window.alert('Error\n\nFailed to save Check-Out.');
      } else {
        Alert.alert('Error', 'Failed to save Check-Out.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <Text style={styles.icon}>🏁</Text>
        </View>
        <Text style={styles.title}>Ready to end your day?</Text>
        <Text style={styles.subtitle}>
          Ensure your DCR logs and daily reporting have been submitted before checking out.
        </Text>

        <View style={styles.summaryContainer}>
          <View style={styles.summaryRow}>
            <Text style={styles.label}>Calls Logged:</Text>
            <Text style={styles.value}>{callsCount}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.label}>POB Collected:</Text>
            <Text style={styles.value}>{totalSales}</Text>
          </View>
          <TouchableOpacity 
            style={[styles.summaryRow, styles.addressRow]} 
            onPress={loadDcrMetrics}
            disabled={fetchingLocation}
          >
            <Text style={styles.label}>📍 Location:</Text>
            {fetchingLocation ? (
              <ActivityIndicator size="small" color="#F43F5E" style={{ flex: 1, marginRight: 8 }} />
            ) : (
              <Text style={[styles.addressValue, { flex: 1, textAlign: 'right' }]}>{address} 🔄</Text>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={[styles.button, (fetchingLocation || loading) && { backgroundColor: '#FDA4AF' }]} 
          onPress={handleConfirmCheckOut}
          disabled={fetchingLocation || loading}
        >
          {fetchingLocation || loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Confirm Check-Out</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default CheckOutScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 30,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF1F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  icon: {
    fontSize: 36,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 18,
  },
  summaryContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    padding: 16,
    width: '100%',
    marginBottom: 24,
    gap: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  value: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  addressRow: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 12,
    marginTop: 4,
  },
  addressValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  button: {
    backgroundColor: '#F43F5E',
    borderRadius: 12,
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
});