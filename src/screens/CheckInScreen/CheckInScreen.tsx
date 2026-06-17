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

const CheckInScreen = () => {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState('Fetching current position...');
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [fetchingLocation, setFetchingLocation] = useState(false);

  useEffect(() => {
    fetchCurrentLocation();
  }, []);

  const fetchCurrentLocation = async () => {
    setAddress('Fetching current position...');
    setCoords(null);
    setFetchingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setAddress('Location permission denied.');
        setFetchingLocation(false);
        return;
      }

      let coordsObj = null;
      try {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        coordsObj = loc.coords;
      } catch (err) {
        console.log('getCurrentPositionAsync failed, trying last known position:', err);
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

        try {
          const geocode = await Location.reverseGeocodeAsync({
            latitude: coordsObj.latitude,
            longitude: coordsObj.longitude,
          });
          if (geocode.length > 0) {
            const place = geocode[0];
            setAddress([place.name, place.street, place.city, place.region].filter(Boolean).join(', '));
          } else {
            setAddress(`Lat: ${coordsObj.latitude.toFixed(4)}, Lon: ${coordsObj.longitude.toFixed(4)}`);
          }
        } catch (err) {
          console.log('fetchCurrentLocation reverseGeocodeAsync failed:', err);
          setAddress(`Lat: ${coordsObj.latitude.toFixed(4)}, Lon: ${coordsObj.longitude.toFixed(4)}`);
        }
      } else {
        setAddress('Unable to fetch GPS signal. Please enable GPS and tap to retry.');
      }
    } catch (e) {
      setAddress('Unable to fetch GPS signal.');
    } finally {
      setFetchingLocation(false);
    }
  };

  const handleConfirmCheckIn = async () => {
    let activeCoords = coords;
    let finalAddress = address;

    // Retry fetching coordinates inline if not loaded yet
    if (!activeCoords) {
      setLoading(true);
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          try {
            const loc = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
            });
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

    // Verify GPS coordinates are present before continuing
    if (!activeCoords) {
      if (Platform.OS === 'web') {
        window.alert('Location Required\n\nWe cannot check you in without a valid GPS lock. Please ensure location service is enabled in settings, then try again.');
      } else {
        Alert.alert(
          'Location Required',
          'We cannot check you in without a valid GPS lock. Please ensure location service is enabled in settings, then try again.'
        );
      }
      return;
    }

    // Geocode activeCoords if we don't have a structured address yet (e.g. if we fetched inline)
    if (!coords || finalAddress.startsWith('Fetching') || finalAddress.startsWith('Unable')) {
      try {
        const geocode = await Location.reverseGeocodeAsync({
          latitude: activeCoords.latitude,
          longitude: activeCoords.longitude,
        });
        if (geocode.length > 0) {
          const place = geocode[0];
          finalAddress = [place.name, place.street, place.city, place.region].filter(Boolean).join(', ');
        } else {
          finalAddress = `Lat: ${activeCoords.latitude.toFixed(4)}, Lon: ${activeCoords.longitude.toFixed(4)}`;
        }
      } catch (err) {
        console.log('handleConfirmCheckIn reverseGeocodeAsync failed:', err);
        finalAddress = `Lat: ${activeCoords.latitude.toFixed(4)}, Lon: ${activeCoords.longitude.toFixed(4)}`;
      }
    }

    try {
      setLoading(true);
      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const latVal = activeCoords.latitude;
      const lngVal = activeCoords.longitude;

      await AsyncStorage.setItem('@checked_in', 'true');
      await AsyncStorage.setItem('@check_in_time', time);
      await AsyncStorage.setItem('@check_in_lat', latVal.toString());
      await AsyncStorage.setItem('@check_in_lng', lngVal.toString());
      await AsyncStorage.setItem('@check_in_address', finalAddress);
      await AsyncStorage.setItem('@attendance_date', new Date().toISOString());

      if (Platform.OS === 'web') {
        window.alert(`🟢 Checked In!\n\nDay started at ${time}`);
        navigation.goBack();
      } else {
        Alert.alert('🟢 Checked In!', `Day started at ${time}`, [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (error) {
      console.log('handleConfirmCheckIn save error:', error);
      if (Platform.OS === 'web') {
        window.alert('Error\n\nFailed to save Check-In.');
      } else {
        Alert.alert('Error', 'Failed to save Check-In.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <Text style={styles.icon}>🧭</Text>
        </View>
        <Text style={styles.title}>Ready to start your day?</Text>
        <Text style={styles.subtitle}>
          Ensure your device GPS is enabled. Your location coordinates will be tagged.
        </Text>

        <TouchableOpacity 
          style={styles.locationContainer} 
          onPress={fetchCurrentLocation}
          disabled={fetchingLocation}
        >
          <Text style={styles.locationPin}>📍</Text>
          {fetchingLocation ? (
            <ActivityIndicator size="small" color="#10B981" style={{ flex: 1, marginRight: 8 }} />
          ) : (
            <Text style={styles.locationText}>{address}</Text>
          )}
          {!fetchingLocation && (
            <Text style={{ fontSize: 11, color: '#10B981', fontWeight: 'bold' }}>🔄 Retry</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, (fetchingLocation || loading) && { backgroundColor: '#A7F3D0' }]} 
          onPress={handleConfirmCheckIn}
          disabled={fetchingLocation || loading}
        >
          {fetchingLocation || loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Confirm Check-In</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default CheckInScreen;

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
    backgroundColor: '#ECFDF5',
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
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 14,
    width: '100%',
    marginBottom: 24,
    gap: 8,
  },
  locationPin: {
    fontSize: 16,
  },
  locationText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
    flex: 1,
  },
  button: {
    backgroundColor: '#10B981',
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