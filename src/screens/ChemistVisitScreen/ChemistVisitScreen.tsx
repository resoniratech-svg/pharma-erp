import { 
  createChemistVisit, 
  findChemistByMobile, 
  createChemist,
  getChemists,
  getChemistVisitsByMr,
  updateChemistVisit,
  updateChemist
} from '../../services/chemistService'; 
import { createFollowUp } from '../../services/followUpService'; 
import { getProducts } from '../../services/productService';
import { createRetailerOrder } from '../../services/orderService';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import * as Location from 'expo-location';

const safeJsonParse = (data: string | null, fallback: any) => {
  if (!data) return fallback;
  try { return JSON.parse(data); }
  catch (err) { console.log('safeJsonParse error:', err); return fallback; }
};

interface ChemistVisit {
  id: string;
  chemistId?: number | string;
  chemistName: string;
  shopName: string;
  mobile?: string;
  location: string;
  visitDate: string;
  visitTime: string;
  latitude?: number;
  longitude?: number;
  distanceVerified?: string;
  stockCheck: 'Yes' | 'No' | 'Pending';
  pobAmount: number;
  medicine?: string;
  quantity?: string;
  nextFollowUp?: string;
  remarks?: string;
  status: 'Scheduled' | 'Completed' | 'Missed';
}

const formatDate = (date: Date): string => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const formatTime = (date: Date): string => {
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${hh}:${min}`;
};

// ─── DatePickerField Component ───────────────────────────────────────────────
const DatePickerField = ({
  label,
  value,
  onChange,
  editable = true,
  minDate,
}: {
  label: string;
  value: string;
  onChange: (date: string) => void;
  editable?: boolean;
  minDate?: string;
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const dateObj = value ? new Date(value) : new Date();

  if (Platform.OS === 'web') {
    return (
      <View style={{ marginBottom: 4, opacity: editable ? 1 : 0.6 }}>
        <Text style={styles.label}>{label}</Text>
        {/* @ts-ignore */}
        <input
          type="date"
          value={value}
          onChange={(e: any) => editable && onChange(e.target.value)}
          disabled={!editable}
          min={minDate}
          style={{
            borderWidth: 1,
            border: '1px solid #ddd',
            borderRadius: 8,
            padding: '12px',
            fontSize: 14,
            backgroundColor: editable ? '#fafafa' : '#e2e8f0',
            width: '100%',
            boxSizing: 'border-box',
            fontFamily: 'inherit',
            color: value ? '#222' : '#999',
            cursor: editable ? 'default' : 'not-allowed',
          }}
        />
      </View>
    );
  }

  return (
    <View style={{ marginBottom: 4, opacity: editable ? 1 : 0.6 }}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={[styles.input, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, !editable && { backgroundColor: '#e2e8f0' }]}
        onPress={() => editable && setShowPicker(true)}
        disabled={!editable}
      >
        <Text style={{ fontSize: 14, color: value ? '#222' : '#999' }}>
          {value || 'Select date...'}
        </Text>
        <Text style={{ fontSize: 16 }}>📅</Text>
      </TouchableOpacity>

      {showPicker && editable && (
        <DateTimePicker
          value={dateObj}
          mode="date"
          minimumDate={minDate ? new Date(minDate) : undefined}
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onChange={(_event: any, selectedDate?: Date) => {
            setShowPicker(Platform.OS === 'ios');
            if (selectedDate) {
              onChange(formatDate(selectedDate));
            }
            if (Platform.OS === 'android') {
              setShowPicker(false);
            }
          }}
        />
      )}
    </View>
  );
};

// ─── TimePickerField Component ───────────────────────────────────────────────
const TimePickerField = ({
  label,
  value,
  onChange,
  editable = true,
}: {
  label: string;
  value: string;
  onChange: (time: string) => void;
  editable?: boolean;
}) => {
  const [showPicker, setShowPicker] = useState(false);

  const buildTimeDate = (timeStr: string): Date => {
    const now = new Date();
    if (timeStr && timeStr.includes(':')) {
      const [hh, mm] = timeStr.split(':');
      now.setHours(Number(hh), Number(mm), 0, 0);
    }
    return now;
  };

  if (Platform.OS === 'web') {
    return (
      <View style={{ marginBottom: 4, opacity: editable ? 1 : 0.6 }}>
        <Text style={styles.label}>{label}</Text>
        {/* @ts-ignore */}
        <input
          type="time"
          value={value}
          onChange={(e: any) => editable && onChange(e.target.value)}
          disabled={!editable}
          style={{
            border: '1px solid #ddd',
            borderRadius: 8,
            padding: '12px',
            fontSize: 14,
            backgroundColor: editable ? '#fafafa' : '#e2e8f0',
            width: '100%',
            boxSizing: 'border-box',
            fontFamily: 'inherit',
            color: value ? '#222' : '#999',
            cursor: editable ? 'default' : 'not-allowed',
          }}
        />
      </View>
    );
  }

  return (
    <View style={{ marginBottom: 4, opacity: editable ? 1 : 0.6 }}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={[styles.input, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, !editable && { backgroundColor: '#e2e8f0' }]}
        onPress={() => editable && setShowPicker(true)}
        disabled={!editable}
      >
        <Text style={{ fontSize: 14, color: value ? '#222' : '#999' }}>
          {value || 'Select time...'}
        </Text>
        <Text style={{ fontSize: 16 }}>🕐</Text>
      </TouchableOpacity>

      {showPicker && (
        <DateTimePicker
          value={buildTimeDate(value)}
          mode="time"
          is24Hour={true}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(_event: any, selectedTime?: Date) => {
            setShowPicker(Platform.OS === 'ios');
            if (selectedTime) {
              onChange(formatTime(selectedTime));
            }
            if (Platform.OS === 'android') {
              setShowPicker(false);
            }
          }}
        />
      )}
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────

const ChemistVisitScreen = () => {
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();

  const [chemistName, setChemistName] = useState('');
  const [shopName, setShopName] = useState('');

  useEffect(() => {
    if (isFocused) {
      checkAttendanceStatus();
    }
  }, [isFocused]);

  const checkAttendanceStatus = async () => {
    try {
      const storedCheckedIn = await AsyncStorage.getItem('@checked_in');
      const attendanceDate = await AsyncStorage.getItem('@attendance_date');
      const todayStr = new Date().toISOString().split('T')[0];

      let isCheckInValid = false;
      if (storedCheckedIn === 'true' && attendanceDate) {
        const storedDateStr = attendanceDate.split('T')[0];
        if (storedDateStr === todayStr) {
          isCheckInValid = true;
        } else {
          // Forgot to checkout: auto-checkout from previous day
          await AsyncStorage.removeItem('@checked_in');
          await AsyncStorage.removeItem('@check_in_time');
          await AsyncStorage.removeItem('@check_in_lat');
          await AsyncStorage.removeItem('@check_in_lng');
          await AsyncStorage.removeItem('@check_in_address');
          await AsyncStorage.removeItem('@attendance_date');
        }
      }

      if (!isCheckInValid) {
        customAlert(
          'Check-In Required',
          'Please check-in first so that attendance is recorded correctly.'
        );
        navigation.navigate('Attendance');
      }
    } catch (e) {
      console.log('Failed to verify attendance status', e);
    }
  };
  const [mobile, setMobile] = useState('');
  const [location, setLocation] = useState('');
  const [visitDate, setVisitDate] = useState('');
  const [visitTime, setVisitTime] = useState('');
  const [stockCheck, setStockCheck] = useState<ChemistVisit['stockCheck']>('Pending');
  const [pobAmount, setPobAmount] = useState('');
  const [medicine, setMedicine] = useState('');
  const [quantity, setQuantity] = useState('');
  const [nextFollowUp, setNextFollowUp] = useState('');
  const [remarks, setRemarks] = useState('');
  const [status, setStatus] = useState<ChemistVisit['status']>('Completed');

  const [chemistSource, setChemistSource] = useState<'Existing' | 'New'>('Existing');
  const [chemistId, setChemistId] = useState<number | null>(null);
  const [products, setProducts] = useState<any[]>([]);

  const [mrId, setMrId] = useState<number | null>(null);
  const [visits, setVisits] = useState<ChemistVisit[]>([]);
  const [chemists, setChemists] = useState<any[]>([]);
  const [rawVisits, setRawVisits] = useState<any[]>([]);
  const [editingVisitId, setEditingVisitId] = useState<string | null>(null);
  const [editedVisitIds, setEditedVisitIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollViewRef = React.useRef<ScrollView>(null);

  const customAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') { window.alert(`${title}\n\n${message}`); }
    else { Alert.alert(title, message); }
  };

  const confirmPromise = (title: string, message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      if (Platform.OS === 'web') {
        const ok = window.confirm(`${title}\n\n${message}`);
        resolve(ok);
      } else {
        Alert.alert(
          title,
          message,
          [
            { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
            { text: 'OK', onPress: () => resolve(true) },
          ],
          { cancelable: false }
        );
      }
    });
  };

  useEffect(() => {
    const loadMrId = async () => {
      const storedMrId = await AsyncStorage.getItem('@mrId');
      if (storedMrId) {
        setMrId(Number(storedMrId));
      }
      try {
        const storedEdited = await AsyncStorage.getItem('@edited_chemist_visit_ids');
        if (storedEdited) {
          setEditedVisitIds(JSON.parse(storedEdited));
        }
      } catch (e) {}
    };
    loadMrId();
  }, []);

  const loadChemists = async () => {
    try {
      const response = await getChemists();
      console.log('Chemists API Raw Response:', response);
      
      let resolvedChemists = [];
      if (Array.isArray(response)) {
        resolvedChemists = response;
      } else if (response) {
        if (Array.isArray(response.data)) {
          resolvedChemists = response.data;
        } else if (response.data && Array.isArray(response.data.data)) {
          resolvedChemists = response.data.data;
        } else if (Array.isArray(response.chemists)) {
          resolvedChemists = response.chemists;
        } else if (response.data && Array.isArray(response.data.chemists)) {
          resolvedChemists = response.data.chemists;
        } else if (Array.isArray(response.chemistsList)) {
          resolvedChemists = response.chemistsList;
        } else if (response.chemists && Array.isArray(response.chemists.data)) {
          resolvedChemists = response.chemists.data;
        } else {
          resolvedChemists = response.data || response || [];
        }
      }
      
      setChemists(Array.isArray(resolvedChemists) ? resolvedChemists : []);
    } catch (e) {
      console.log('Failed to load chemists:', e);
    }
  };

  const loadProducts = async () => {
    try {
      const prodData = await getProducts();
      setProducts(prodData || []);
    } catch (e) {
      console.log('Failed to load products:', e);
    }
  };

  useEffect(() => {
    const init = async () => {
      await loadChemists();
      await loadProducts();
      await loadVisits();
    };
    init();
    const today = new Date();
    setVisitDate(formatDate(today));
    setVisitTime(formatTime(today));
  }, []);

  const loadVisits = async () => {
    setLoading(true); setError(null);
    try {
      let serverVisits = [];
      try {
        serverVisits = await getChemistVisitsByMr();
        console.log("SERVER VISITS");
        console.log(serverVisits);
        console.log("COUNT =", serverVisits.length);
      } catch (err) {
        console.log('Failed to fetch chemist visits from backend:', err);
      }

      if (serverVisits && serverVisits.length > 0) {
        setRawVisits(serverVisits);
        await AsyncStorage.setItem('@chemist_visits', JSON.stringify(serverVisits));
      } else {
        const storedVisits = await AsyncStorage.getItem('@chemist_visits');
        setRawVisits(safeJsonParse(storedVisits, []));
      }
    } catch (err) {
      console.log('Failed to load chemist visits:', err);
      setError("Failed to load today's visits.");
      customAlert('Error', 'Failed to load chemist visits.');
    } finally { setLoading(false); }
  };

  useEffect(() => {
    if (rawVisits && rawVisits.length > 0) {
      const mapped: ChemistVisit[] = rawVisits.map((item: any, idx: number) => {
        const chemist = chemists.find((c: any) => c.id === Number(item.chemistId));
        
        let dateStr = '';
        let timeStr = '';
        if (item.visitDate || item.createdAt) {
          try {
            const d = new Date(item.visitDate || item.createdAt);
            dateStr = d.toISOString().split('T')[0];
            timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          } catch (e) {}
        }
        return {
          id: item.id?.toString() || `server-${idx}`,
          chemistId: item.chemistId,
          chemistName: chemist ? chemist.name : (item.chemistName || 'Chemist Name'),
          shopName: chemist ? chemist.shopName || chemist.name : (item.chemistName || 'Shop Name'),
          mobile: chemist ? chemist.mobile : '',
          location: chemist ? chemist.address || chemist.location || '' : (item.location || ''),
          visitDate: dateStr || item.visitDate || formatDate(new Date()),
          visitTime: timeStr || item.visitTime || formatTime(new Date()),
          latitude: item.latitude,
          longitude: item.longitude,
          distanceVerified: item.distanceVerified || 'Pending Verification',
          stockCheck: item.stockCheck || 'Pending',
          pobAmount: Number(item.orderValue || item.pobAmount || 0),
          medicine: item.productsDiscussed || item.medicine || '',
          quantity: item.quantity || '',
          nextFollowUp: item.followUpDate || item.nextFollowUp || '',
          remarks: item.remarks || '',
          status: item.status || 'Completed',
        };
      });
      setVisits(mapped);
    } else {
      setVisits([]);
    }
  }, [rawVisits, chemists]);

  const handleEdit = (visit: ChemistVisit) => {
    setEditingVisitId(visit.id);
    setChemistName(visit.chemistName);
    setShopName(visit.shopName);
    setMobile(visit.mobile || '');
    setLocation(visit.location);
    setVisitDate(visit.visitDate);
    setVisitTime(visit.visitTime);
    setStockCheck(visit.stockCheck);
    setMedicine(visit.medicine || '');
    setQuantity(visit.quantity || '');
    setPobAmount(visit.pobAmount > 0 ? String(visit.pobAmount) : '');
    setNextFollowUp(visit.nextFollowUp || '');
    setRemarks(visit.remarks || '');
    setStatus(visit.status);
    
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: 0, animated: true });
    }
  };

  const handleSubmit = async () => {
    const isEdit = !!editingVisitId;

    // Validation 1: Chemist Name (Required + alphabetic, space, dot only)
    if (!chemistName.trim()) {
      customAlert('Error', 'Please enter chemist name.');
      return;
    }
    const nameRegex = /^[A-Za-z\s\.]+$/;
    if (!nameRegex.test(chemistName.trim())) {
      customAlert('Error', 'Chemist Name can only contain letters, spaces, and dots.');
      return;
    }

    // Validation 2: Shop Name (Required + allowed symbols)
    if (!shopName.trim()) {
      customAlert('Error', 'Please enter shop/pharmacy name.');
      return;
    }
    const shopNameRegex = /^[A-Za-z0-9\s\.\-\/\&]+$/;
    if (!shopNameRegex.test(shopName.trim())) {
      customAlert('Error', 'Shop Name can only contain letters, numbers, spaces, and standard symbols (., -, /, &).');
      return;
    }

    // Validation 3: Mobile number (Required + starts with 6,7,8,9 and exactly 10 digits)
    if (!mobile.trim()) {
      customAlert('Error', 'Please enter mobile number.');
      return;
    }
    const mobileRegex = /^[6-9]\d{9}$/;
    if (!mobileRegex.test(mobile.trim())) {
      customAlert('Error', 'Mobile number must be exactly 10 digits and start with 6, 7, 8, or 9.');
      return;
    }

    // Validation 4: Location/Area (Required)
    if (!location.trim()) {
      customAlert('Error', 'Please enter area/location.');
      return;
    }

    // Validation 5: Visit Date (Required)
    if (!visitDate) {
      customAlert('Error', 'Please select visit date.');
      return;
    }

    // Validation 6: Visit Time (Required)
    if (!visitTime) {
      customAlert('Error', 'Please select visit time.');
      return;
    }

    // Validation 7: Medicine validation if POB is booked
    if (Number(pobAmount) > 0 && !medicine.trim()) {
      customAlert('Error', 'Please enter medicine/product for the booked order.');
      return;
    }

    // Validation 8: Quantity validation if POB is booked
    if (Number(pobAmount) > 0 && !quantity.trim()) {
      customAlert('Error', 'Please enter quantity for the booked order.');
      return;
    }

    // Validation 9: POB Amount must be greater than 0 if entered
    if (pobAmount && Number(pobAmount) <= 0) {
      customAlert('Error', 'POB Amount must be greater than 0.');
      return;
    }

    // Validation 10: Follow-up validation (if Next Follow-up is selected, remarks are required)
    if (nextFollowUp && !remarks.trim()) {
      customAlert('Error', 'Remarks are required when scheduling a follow-up.');
      return;
    }

    // Validation 11: Remarks length (max 250 characters)
    if (remarks.trim().length > 250) {
      customAlert('Error', 'Remarks cannot exceed 250 characters.');
      return;
    }

    // Validation 12: Next Follow-Up Date cannot be in the past
    if (nextFollowUp) {
      const todayStr = formatDate(new Date());
      if (nextFollowUp < todayStr) {
        customAlert('Error', 'Next Follow-Up Date cannot be in the past.');
        return;
      }
    }

    // ─── REPLACED GPS BLOCK ───
    setIsSubmitting(true);

    let currentLat: number | undefined = undefined;
    let currentLon: number | undefined = undefined;
    let distVerified = 'Pending Verification';

    try {
      if (Platform.OS === 'web') {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: false,
            timeout: 2000,
            maximumAge: 60000,
          });
        });

        currentLat = position.coords.latitude;
        currentLon = position.coords.longitude;
      } else {
        let { status: locationStatus } = await Location.requestForegroundPermissionsAsync();

        if (locationStatus === 'granted') {
          let loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });

          currentLat = loc.coords.latitude;
          currentLon = loc.coords.longitude;
        } else {
          distVerified = 'Location Permission Denied';
        }
      }

      console.log('CHEMIST GPS:', currentLat, currentLon);

      if (currentLat && currentLon) {
        distVerified = 'Location Recorded';
      }

    } catch (e) {
      console.log('Location error:', e);
      distVerified = 'Location Error';
    }

    let chemistId = 0;

    // ─── API SERVER CONDITIONAL RESOLUTION & SUBMISSION ───
    try {
      if (editingVisitId) {
        const origVisit = visits.find((v) => v.id?.toString() === editingVisitId.toString());
        if (!origVisit) {
          throw new Error("Original visit not found");
        }

        const matchedChem = chemists.find((c: any) => String(c.mobile).trim() === String(mobile).trim());
        if (matchedChem) {
          chemistId = matchedChem.id;
          try {
            await updateChemist(chemistId, shopName || chemistName, mobile, location);
            console.log("Chemist record updated successfully on backend");
          } catch (e) {
            console.log("Failed to update chemist master record on backend:", e);
          }
        } else {
          chemistId = Number(origVisit.chemistId);
          try {
            await updateChemist(chemistId, shopName || chemistName, mobile, location);
            console.log("Chemist record updated with new details on backend");
          } catch (e) {
            console.log("Failed to update chemist master record on backend:", e);
          }
        }
      } else {
        const existingChemist = await findChemistByMobile(mobile);

        if (existingChemist) {
          const chemistNameFromDb = existingChemist.name || 'Unknown Name';
          const shopNameFromDb = existingChemist.shopName || chemistNameFromDb;
          
          const proceed = await confirmPromise(
            'Chemist Already Registered',
            `Mobile number ${mobile} is already registered to ${chemistNameFromDb} (${shopNameFromDb}).\n\nDo you want to log the visit for this existing chemist?`
          );
          
          if (!proceed) {
            setIsSubmitting(false);
            return;
          }

          chemistId = existingChemist.id || (existingChemist.data && existingChemist.data.id) || Number(existingChemist);
          console.log('Using existing chemist:', chemistId);
        } else {
          const newChemist = await createChemist(chemistName, shopName, mobile, location);
          console.log("NEW CHEMIST RESPONSE:", newChemist);
          chemistId = newChemist.id || (newChemist.data && newChemist.data.id) || Number(newChemist);
          console.log('Created new chemist ID:', chemistId);
          await loadChemists();
        }
      }

      if (!chemistId || isNaN(chemistId)) {
        throw new Error(`Chemist ID resolution failed: resolved chemistId is ${chemistId}`);
      }

      console.log('SUBMIT TRANSACTION INFO:', {
        mrId: mrId,
        chemistId: chemistId,
        isEdit: !!editingVisitId,
      });

      if (editingVisitId) {
        const result = await updateChemistVisit(
          editingVisitId,
          chemistId,
          remarks,
          medicine,
          Number(pobAmount || 0),
          currentLat,
          currentLon
        );
        console.log('Chemist Visit Updated:', result);
        if (!result) {
          throw new Error("Chemist Visit Update API returned empty response");
        }

        try {
          const newEditedIds = [...editedVisitIds, editingVisitId];
          setEditedVisitIds(newEditedIds);
          await AsyncStorage.setItem('@edited_chemist_visit_ids', JSON.stringify(newEditedIds));
        } catch (e) {}

        setEditingVisitId(null);
      } else {
        const result = await createChemistVisit(
          chemistId,
          remarks,
          medicine,
          Number(pobAmount || 0),
          currentLat,
          currentLon
        );
        console.log('Chemist Visit Saved:', result);
        if (!result) {
          throw new Error("Chemist Visit Save API returned empty response");
        }

        if (nextFollowUp) {
          await createFollowUp({
            mrId: Number(mrId),
            chemistId: Number(chemistId),
            title: 'Chemist Follow Up',
            remarks: remarks || 'Chemist follow-up scheduled',
            followUpDate: new Date(nextFollowUp).toISOString(),
          });
          console.log('Chemist Follow-up created successfully');
        }
      }

    } catch (error: any) {
      console.log('Chemist Visit API Error:', error);
      let errMsg = 'Failed to save Chemist Visit to server';
      if (error && error.response && error.response.data) {
        errMsg += '\nDetails: ' + (typeof error.response.data === 'object' ? JSON.stringify(error.response.data) : error.response.data);
      } else if (error && error.message) {
        errMsg += '\nMessage: ' + error.message;
      }
      customAlert('Error', errMsg);
      setIsSubmitting(false);
      return;
    }

    try {
      // ✅ Instantly append a local notification if a follow-up is scheduled
      if (nextFollowUp) {
        try {
          const notifsData = await AsyncStorage.getItem('@notifications');
          const notifsList = notifsData ? JSON.parse(notifsData) : [];
          notifsList.unshift({
            id: `dyn-chem-notif-${Date.now()}`,
            type: 'followup',
            title: `📅 Follow-up Scheduled`,
            message: `Follow-up with ${shopName || chemistName || 'Pharmacy'} scheduled for ${nextFollowUp}.`,
            time: 'Just now',
            unread: true,
          });
          await AsyncStorage.setItem('@notifications', JSON.stringify(notifsList.slice(0, 50)));
        } catch (e) {
          console.log('Failed to save follow-up notification:', e);
        }
      }

      if (Number(pobAmount) > 0) {
        // Find matching product database ID from preloaded products state
        const matchedProduct = products.find(p => (p.name || p.productName) === medicine);
        const resolvedProductId = matchedProduct ? Number(matchedProduct.id) : null;

        let orderNumberVal = `POB-${String(Date.now()).slice(-5)}`;
        if (resolvedProductId) {
          const orderPayload = {
            retailerId: Number(chemistId),
            totalAmount: Number(pobAmount),
            orderItems: [
              {
                productId: resolvedProductId,
                quantity: Number(quantity) || 1,
                rate: Number(pobAmount) || 0,
                amount: Number(pobAmount) || 0
              }
            ]
          };

          try {
            const result = await createRetailerOrder(orderPayload);
            console.log('POB Order Saved to Backend via Chemist Visit Screen:', result);
            if (result && result.orderNumber) {
              orderNumberVal = result.orderNumber;
            }
          } catch (orderApiErr) {
            console.log('POB Order API submission failed, logging locally:', orderApiErr);
          }
        }

        const existingOrders = safeJsonParse(
          await AsyncStorage.getItem('@orders'), []
        );
        const d = new Date();
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        let hours = d.getHours();
        const minutes = d.getMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        
        const newOrder = {
          id: Date.now(),
          orderNumber: orderNumberVal,
          customerType: 'Chemist',
          customerName: shopName || chemistName,
          customerMobile: mobile || 'N/A',
          productName: medicine || 'Multiple Products',
          quantity: Number(quantity) || 1,
          rate: Number(pobAmount) || 0,
          totalAmount: Number(pobAmount) || 0,
          distributor: 'Pending Assignment',
          status: 'Booked',
          dateFormatted: `${d.getDate().toString().padStart(2, '0')}-${months[d.getMonth()]}-${d.getFullYear()} ${hours}:${minutes} ${ampm}`,
        };
        await AsyncStorage.setItem('@orders', JSON.stringify([newOrder, ...existingOrders]));
      }

      await loadChemists();
      await loadVisits();

      // Sync local chemists array state to reflect edited values instantly in the history card list
      if (chemistId) {
        setChemists((prevChemists) =>
          prevChemists.map((c) =>
            c.id === chemistId
              ? { ...c, name: chemistName, shopName: shopName || chemistName, mobile, address: location }
              : c
          )
        );
      }
    } catch (err) {
      console.log('Failed to save:', err);
      customAlert('Error', 'Failed to save visit data locally.');
    }

    setChemistName(''); setShopName(''); setMobile(''); setLocation('');
    setStockCheck('Pending'); setPobAmount(''); setMedicine('');
    setQuantity(''); setNextFollowUp(''); setRemarks(''); setStatus('Scheduled');

    setIsSubmitting(false);
    if (isEdit) {
      customAlert('✅ Visit Updated!', `${shopName} visit updated successfully.`);
    } else {
      customAlert('✅ Visit Saved!', `${shopName} visit logged successfully.`);
    }
  };

  const ToggleRow = ({
    label, options, selected, onSelect, colors, disabled = false,
  }: {
    label: string; options: string[]; selected: string;
    onSelect: (val: any) => void; colors?: string[]; disabled?: boolean;
  }) => (
    <View style={{ marginBottom: 12, opacity: disabled ? 0.6 : 1 }}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.toggleRow}>
        {options.map((opt, i) => (
          <TouchableOpacity
            key={opt}
            onPress={() => !disabled && onSelect(opt)}
            disabled={disabled}
            style={[
              styles.toggleBtn,
              selected === opt && { 
                backgroundColor: disabled ? '#94A3B8' : (colors ? colors[i] : '#1E88E5'), 
                borderColor: disabled ? '#94A3B8' : (colors ? colors[i] : '#1E88E5') 
              },
            ]}
          >
            <Text style={[styles.toggleBtnText, selected === opt && { color: '#fff', fontWeight: 'bold' }]}>
              {opt}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        ref={scrollViewRef}
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 280 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>💊 Chemist Visit</Text>

        <View style={styles.form}>
          {editingVisitId === null && (
            <ToggleRow
              label="Chemist Source"
              options={['Existing Chemist', 'New Chemist']}
              selected={chemistSource === 'Existing' ? 'Existing Chemist' : 'New Chemist'}
              onSelect={(val) => {
                setChemistSource(val === 'Existing Chemist' ? 'Existing' : 'New');
                setChemistId(null);
                setChemistName('');
                setShopName('');
                setMobile('');
                setLocation('');
              }}
            />
          )}

          {(chemistSource === 'Existing' && editingVisitId === null) && (
            <>
              <Text style={styles.label}>Select Chemist *</Text>
              <View
                style={{
                  borderWidth: 1,
                  borderColor: '#ddd',
                  borderRadius: 8,
                  marginBottom: 12,
                }}
              >
                <Picker
                  selectedValue={chemistId?.toString() ?? ""}
                  onValueChange={(itemValue) => {
                    if (!itemValue || itemValue === "") {
                      setChemistId(null);
                      setChemistName('');
                      setShopName('');
                      setMobile('');
                      setLocation('');
                      return;
                    }
                    const chemIdNum = Number(itemValue);
                    setChemistId(chemIdNum);
                    const selectedChemist = chemists.find((c) => c.id === chemIdNum);
                    if (selectedChemist) {
                      setChemistName(selectedChemist.name || '');
                      setShopName(selectedChemist.shopName || selectedChemist.name || '');
                      setMobile(selectedChemist.mobile || '');
                      setLocation(selectedChemist.address || selectedChemist.location || '');
                    }
                  }}
                >
                  <Picker.Item label="-- Select Existing Chemist --" value="" />
                  {chemists.map((c) => (
                    <Picker.Item key={c.id} label={`${c.shopName || c.name} (${c.name})`} value={c.id.toString()} />
                  ))}
                </Picker>
              </View>
            </>
          )}

          <Text style={styles.label}>Chemist Name *</Text>
          <TextInput 
            style={[
              styles.input,
              (editingVisitId === null && chemistSource === 'Existing' && chemistId !== null) && {
                backgroundColor: '#F1F5F9',
                color: '#64748B',
              },
            ]} 
            placeholder="Enter chemist name"
            value={chemistName} 
            onChangeText={setChemistName}
            editable={editingVisitId !== null || chemistSource === 'New' || chemistId === null}
          />

          <Text style={styles.label}>Shop / Pharmacy Name *</Text>
          <TextInput 
            style={[
              styles.input,
              (editingVisitId === null && chemistSource === 'Existing' && chemistId !== null) && {
                backgroundColor: '#F1F5F9',
                color: '#64748B',
              },
            ]} 
            placeholder="Enter pharmacy / shop name"
            value={shopName} 
            onChangeText={setShopName}
            editable={editingVisitId !== null || chemistSource === 'New' || chemistId === null}
          />

          <Text style={styles.label}>Mobile Number *</Text>
          <TextInput 
            style={[
              styles.input,
              (editingVisitId === null && chemistSource === 'Existing' && chemistId !== null) && {
                backgroundColor: '#F1F5F9',
                color: '#64748B',
              },
            ]} 
            placeholder="Enter chemist's 10-digit mobile number"
            value={mobile}
            onChangeText={(text) => setMobile(text.replace(/[^0-9]/g, ''))}
            keyboardType="numeric" 
            maxLength={10}
            editable={editingVisitId !== null || chemistSource === 'New' || chemistId === null}
          />

          <Text style={styles.label}>Area / Location *</Text>
          <TextInput 
            style={[
              styles.input,
              (editingVisitId === null && chemistSource === 'Existing' && chemistId !== null) && {
                backgroundColor: '#F1F5F9',
                color: '#64748B',
              },
            ]} 
            placeholder="e.g. Hyderabad, Banjara Hills"
            value={location} 
            onChangeText={setLocation}
            editable={editingVisitId !== null || chemistSource === 'New' || chemistId === null}
          />

          <DatePickerField
            label="Visit Date *"
            value={visitDate}
            onChange={setVisitDate}
            editable={false}
          />

          <TimePickerField
            label="Visit Time *"
            value={visitTime}
            onChange={setVisitTime}
            editable={false}
          />

          <ToggleRow
            label="RCPA / Stock Check"
            options={['Pending', 'Yes', 'No']}
            selected={stockCheck}
            onSelect={setStockCheck}
            colors={['#F59E0B', '#10B981', '#EF4444']}
          />

          <Text style={styles.label}>Medicine / Product Ordered</Text>
          <View
            style={{
              borderWidth: 1,
              borderColor: '#ddd',
              borderRadius: 8,
              marginBottom: 12,
            }}
          >
            <Picker
              selectedValue={medicine}
              onValueChange={(itemValue) => setMedicine(itemValue)}
            >
              <Picker.Item label="-- Select Medicine / Product --" value="" />
              {products.map((p) => (
                <Picker.Item key={p.id} label={`${p.name || p.productName}`} value={p.name || p.productName} />
              ))}
            </Picker>
          </View>

          <Text style={styles.label}>Quantity</Text>
          <TextInput style={styles.input} placeholder="e.g. 10 strips, 5 boxes"
            value={quantity} onChangeText={setQuantity} />

          <Text style={styles.label}>Order Value / POB Amount (₹)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 15000 (numbers only)"
            value={pobAmount}
            onChangeText={(text) => {
              const cleaned = text.replace(/[^0-9]/g, '').slice(0, 10);
              setPobAmount(cleaned);
            }}
            keyboardType="numeric"
            maxLength={10}
          />

          <DatePickerField
            label="Next Follow-Up Date"
            value={nextFollowUp}
            onChange={setNextFollowUp}
            minDate={formatDate(new Date())}
          />

          <Text style={styles.label}>Remarks</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Any additional remarks..."
            value={remarks}
            onChangeText={setRemarks}
            multiline
            numberOfLines={3}
          />

          <TouchableOpacity style={[styles.submitButton, isSubmitting && { opacity: 0.7 }]} onPress={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>{editingVisitId ? "UPDATE VISIT" : "SAVE VISIT"}</Text>
            )}
          </TouchableOpacity>

          {editingVisitId && (
            <TouchableOpacity 
              style={[styles.submitButton, { backgroundColor: '#64748B', marginTop: 8 }]} 
              onPress={() => {
                setEditingVisitId(null);
                setChemistName(''); setShopName(''); setMobile(''); setLocation('');
                setStockCheck('Pending'); setPobAmount(''); setMedicine('');
                setQuantity(''); setNextFollowUp(''); setRemarks(''); setStatus('Completed');
                setChemistSource('Existing'); setChemistId(null);
              }}
            >
              <Text style={styles.submitText}>CANCEL EDIT</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Visit History */}
        <Text style={styles.historyTitle}>Recent Visits</Text>
        {loading ? (
          <ActivityIndicator size="small" color="#43A047" style={{ marginVertical: 10 }} />
        ) : error ? (
          <View style={{ padding: 12, alignItems: 'center' }}>
            <Text style={{ color: '#EF4444', fontSize: 13, marginBottom: 6 }}>{error}</Text>
            <TouchableOpacity onPress={loadVisits}
              style={{ padding: 6, backgroundColor: '#E2E8F0', borderRadius: 4 }}>
              <Text style={{ fontSize: 12, color: '#475569', fontWeight: 'bold' }}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : visits.length === 0 ? (
          <Text style={{ fontSize: 13, color: '#94A3B8', fontStyle: 'italic', textAlign: 'center', marginVertical: 10 }}>
            No chemist visits found today.
          </Text>
        ) : (
          <>
            <Text style={[styles.historyTitle, { fontSize: 14, color: '#64748B', marginTop: -5, marginBottom: 10 }]}>
              Total visits: {visits.length}
            </Text>
            {visits.map((visit, index) => (
              <View key={`${visit.id}-${index}`} style={styles.visitCard}>
                <Text style={styles.visitName}>{visit.shopName}</Text>
                <Text style={styles.visitInfo}>👤 {visit.chemistName}</Text>
                <Text style={styles.visitInfo}>📅 {visit.visitDate}  🕐 {visit.visitTime}</Text>
                {visit.location ? <Text style={styles.visitInfo}>📍 {visit.location}</Text> : null}
                {visit.medicine ? <Text style={styles.visitInfo}>💊 {visit.medicine}</Text> : null}
                {visit.stockCheck ? (
                  <Text style={styles.visitInfo}>
                    RCPA: {visit.stockCheck === 'Yes' ? '✅' : visit.stockCheck === 'No' ? '❌' : '⏳'} {visit.stockCheck}
                  </Text>
                ) : null}
                {visit.pobAmount > 0 ? (
                  <Text style={styles.orderValue}>₹ {visit.pobAmount.toLocaleString('en-IN')}</Text>
                ) : null}
                {visit.nextFollowUp ? (
                  <Text style={styles.visitInfo}>🔔 Follow-Up: {visit.nextFollowUp}</Text>
                ) : null}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9' }}>
                  <View style={[
                    styles.statusBadge,
                    { marginTop: 0 },
                    visit.status === 'Completed' ? { backgroundColor: '#D1FAE5' }
                    : visit.status === 'Scheduled' ? { backgroundColor: '#DBEAFE' }
                    : { backgroundColor: '#FEE2E2' },
                  ]}>
                    <Text style={[
                      { fontSize: 11, fontWeight: 'bold' },
                      { color: visit.status === 'Completed' ? '#059669' : visit.status === 'Scheduled' ? '#2563EB' : '#DC2626' }
                    ]}>
                      {visit.status}
                    </Text>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    {editedVisitIds.includes(visit.id) && (
                      <Text style={{ fontSize: 11, color: '#64748B', fontStyle: 'italic', fontWeight: '600' }}>Edited</Text>
                    )}
                    <TouchableOpacity
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        backgroundColor: '#E2E8F0',
                        borderRadius: 6,
                      }}
                      onPress={() => handleEdit(visit)}
                    >
                      <Text style={{ fontSize: 12, color: '#475569', fontWeight: 'bold' }}>Edit</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default ChemistVisitScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA', padding: 20, paddingTop: 50 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 20, textAlign: 'center' },
  form: { backgroundColor: '#fff', borderRadius: 12, padding: 20, marginBottom: 20, elevation: 2 },
  label: { fontSize: 14, fontWeight: '600', color: '#444', marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 14, backgroundColor: '#fafafa' },
  textArea: { height: 80, textAlignVertical: 'top' },
  toggleRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  toggleBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1.5, borderColor: '#ddd', alignItems: 'center', backgroundColor: '#fafafa' },
  toggleBtnText: { fontSize: 13, color: '#555' },
  submitButton: { backgroundColor: '#43A047', padding: 16, borderRadius: 10, alignItems: 'center', marginTop: 20 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
  historyTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  visitCard: { backgroundColor: '#fff', borderRadius: 10, padding: 15, marginBottom: 10, elevation: 1, borderLeftWidth: 4, borderLeftColor: '#43A047' },
  visitName: { fontSize: 16, fontWeight: 'bold', color: '#43A047' },
  visitInfo: { fontSize: 13, color: '#555', marginTop: 4 },
  orderValue: { fontSize: 15, fontWeight: 'bold', color: '#1E88E5', marginTop: 6 },
  statusBadge: { marginTop: 8, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
});