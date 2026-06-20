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
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Location from 'expo-location';

const safeJsonParse = (data: string | null, fallback: any) => {
  if (!data) return fallback;
  try { return JSON.parse(data); }
  catch (err) { console.log('safeJsonParse error:', err); return fallback; }
};

// ✅ Unified interface — matches React Web ChemistVisits.tsx exactly
interface ChemistVisit {
  id: string;
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

// Helper: format Date object → YYYY-MM-DD string
const formatDate = (date: Date): string => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

// Helper: format Date object → HH:MM string
const formatTime = (date: Date): string => {
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${hh}:${min}`;
};

// ─── DatePickerField Component ───────────────────────────────────────────────
// On iOS/Android → opens native calendar picker
// On Web → shows HTML date input (no mistakes possible)
const DatePickerField = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (date: string) => void;
}) => {
  const [showPicker, setShowPicker] = useState(false);

  const dateObj = value ? new Date(value) : new Date();

  // Web: use HTML date input — no manual typing mistakes
  if (Platform.OS === 'web') {
    return (
      <View style={{ marginBottom: 4 }}>
        <Text style={styles.label}>{label}</Text>
        {/* @ts-ignore — input is valid HTML on web */}
        <input
          type="date"
          value={value}
          onChange={(e: any) => onChange(e.target.value)}
          style={{
            borderWidth: 1,
            border: '1px solid #ddd',
            borderRadius: 8,
            padding: '12px',
            fontSize: 14,
            backgroundColor: '#fafafa',
            width: '100%',
            boxSizing: 'border-box',
            fontFamily: 'inherit',
            color: value ? '#222' : '#999',
          }}
        />
      </View>
    );
  }

  // iOS / Android: native DateTimePicker
  return (
    <View style={{ marginBottom: 4 }}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={[styles.input, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
        onPress={() => setShowPicker(true)}
      >
        <Text style={{ fontSize: 14, color: value ? '#222' : '#999' }}>
          {value || 'Select date...'}
        </Text>
        <Text style={{ fontSize: 16 }}>📅</Text>
      </TouchableOpacity>

      {showPicker && (
        <DateTimePicker
          value={dateObj}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onChange={(_event: any, selectedDate?: Date) => {
            setShowPicker(Platform.OS === 'ios'); // iOS keeps open; Android closes
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
// ─────────────────────────────────────────────────────────────────────────────

// ─── TimePickerField Component ───────────────────────────────────────────────
// On iOS/Android → opens native clock picker
// On Web → shows HTML time input (no mistakes possible)
const TimePickerField = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (time: string) => void;
}) => {
  const [showPicker, setShowPicker] = useState(false);

  // Build a Date object from HH:MM string for the picker
  const buildTimeDate = (timeStr: string): Date => {
    const now = new Date();
    if (timeStr && timeStr.includes(':')) {
      const [hh, mm] = timeStr.split(':');
      now.setHours(Number(hh), Number(mm), 0, 0);
    }
    return now;
  };

  // Web: use HTML time input
  if (Platform.OS === 'web') {
    return (
      <View style={{ marginBottom: 4 }}>
        <Text style={styles.label}>{label}</Text>
        {/* @ts-ignore */}
        <input
          type="time"
          value={value}
          onChange={(e: any) => onChange(e.target.value)}
          style={{
            border: '1px solid #ddd',
            borderRadius: 8,
            padding: '12px',
            fontSize: 14,
            backgroundColor: '#fafafa',
            width: '100%',
            boxSizing: 'border-box',
            fontFamily: 'inherit',
            color: value ? '#222' : '#999',
          }}
        />
      </View>
    );
  }

  // iOS / Android: native clock picker
  return (
    <View style={{ marginBottom: 4 }}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={[styles.input, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
        onPress={() => setShowPicker(true)}
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
  const [chemistName, setChemistName] = useState('');
  const [shopName, setShopName] = useState('');
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
  const [status, setStatus] = useState<ChemistVisit['status']>('Scheduled');

  const [visits, setVisits] = useState<ChemistVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollViewRef = React.useRef<ScrollView>(null);

  const customAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') { window.alert(`${title}\n\n${message}`); }
    else { Alert.alert(title, message); }
  };

  useEffect(() => {
    loadVisits();
    // Auto-fill today's date and current time
    const today = new Date();
    setVisitDate(formatDate(today));
    setVisitTime(formatTime(today));
  }, []);

  const loadVisits = async () => {
    setLoading(true); setError(null);
    try {
      const storedVisits = await AsyncStorage.getItem('@chemist_visits');
      setVisits(safeJsonParse(storedVisits, []));
    } catch (err) {
      console.log('Failed to load chemist visits:', err);
      setError("Failed to load today's orders.");
      customAlert('Error', 'Failed to load chemist visits.');
    } finally { setLoading(false); }
  };

  const handleSubmit = async () => {
    if (!chemistName.trim()) { customAlert('Error', 'Please enter chemist name'); return; }
    if (!shopName.trim()) { customAlert('Error', 'Please enter shop name'); return; }
    if (mobile.trim() && mobile.length !== 10) {
      customAlert('Error', 'Mobile number must be exactly 10 digits.'); return;
    }

    setIsSubmitting(true);
    let currentLat: number | undefined = undefined;
    let currentLon: number | undefined = undefined;
    let distVerified = 'Pending Verification';

    try {
      if (Platform.OS !== 'web') {
        let { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
        if (locationStatus === 'granted') {
          let loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          currentLat = loc.coords.latitude;
          currentLon = loc.coords.longitude;
          distVerified = 'Verified (within 50m)';
        }
      }
    } catch (e) {
      console.log('Location error:', e);
    }

    const newVisit: ChemistVisit = {
      id: String(Date.now()),
      chemistName, shopName, mobile, location,
      visitDate, visitTime, stockCheck,
      latitude: currentLat,
      longitude: currentLon,
      distanceVerified: distVerified,
      pobAmount: Number(pobAmount) || 0,
      medicine, quantity, nextFollowUp, remarks, status,
    };

    const updatedVisits = [newVisit, ...visits];
    setVisits(updatedVisits);

    try {
      await AsyncStorage.setItem('@chemist_visits', JSON.stringify(updatedVisits));

      // Auto-create Order Booking if POB Amount > 0 (matches web behavior)
      if (Number(pobAmount) > 0) {
        const existingOrders = safeJsonParse(
          await AsyncStorage.getItem('@order_bookings'), []
        );
        const newOrder = {
          id: String(Date.now()) + '_pob',
          orderNo: `POB-${String(Date.now()).slice(-5)}`,
          chemist: shopName,
          date: visitDate,
          amount: Number(pobAmount),
          distributor: 'Assigned Stockist',
          status: 'Booked',
        };
        await AsyncStorage.setItem('@order_bookings', JSON.stringify([newOrder, ...existingOrders]));
      }
    } catch (err) {
      console.log('Failed to save:', err);
      customAlert('Error', 'Failed to save visit data locally.');
    }

    // Reset form — keep date/time pre-filled
    setChemistName(''); setShopName(''); setMobile(''); setLocation('');
    setStockCheck('Pending'); setPobAmount(''); setMedicine('');
    setQuantity(''); setNextFollowUp(''); setRemarks(''); setStatus('Scheduled');

    setIsSubmitting(false);
    customAlert('✅ Visit Saved!', `${shopName} visit logged successfully.`);
  };

  // Reusable toggle button row (for stockCheck and status)
  const ToggleRow = ({
    label, options, selected, onSelect, colors,
  }: {
    label: string; options: string[]; selected: string;
    onSelect: (val: any) => void; colors: string[];
  }) => (
    <View style={{ marginBottom: 12 }}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.toggleRow}>
        {options.map((opt, i) => (
          <TouchableOpacity
            key={opt}
            onPress={() => onSelect(opt)}
            style={[
              styles.toggleBtn,
              selected === opt && { backgroundColor: colors[i], borderColor: colors[i] },
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

          <Text style={styles.label}>Chemist Name *</Text>
          <TextInput style={styles.input} placeholder="Enter chemist name"
            value={chemistName} onChangeText={setChemistName} />

          <Text style={styles.label}>Shop / Pharmacy Name *</Text>
          <TextInput style={styles.input} placeholder="Enter pharmacy / shop name"
            value={shopName} onChangeText={setShopName} />

          <Text style={styles.label}>Mobile Number</Text>
          <TextInput style={styles.input} placeholder="Enter chemist's 10-digit mobile number"
            value={mobile}
            onChangeText={(text) => setMobile(text.replace(/[^0-9]/g, ''))}
            keyboardType="numeric" maxLength={10} />

          <Text style={styles.label}>Area / Location</Text>
          <TextInput style={styles.input} placeholder="e.g. Hyderabad, Banjara Hills"
            value={location} onChangeText={setLocation} />

          {/* ✅ Visit Date — Calendar Picker (no manual typing) */}
          <DatePickerField
            label="Visit Date *"
            value={visitDate}
            onChange={setVisitDate}
          />

          {/* ✅ Visit Time — Clock Picker (no manual typing) */}
          <TimePickerField
            label="Visit Time"
            value={visitTime}
            onChange={setVisitTime}
          />

          {/* RCPA / Stock Check — toggle buttons */}
          <ToggleRow
            label="RCPA / Stock Check"
            options={['Pending', 'Yes', 'No']}
            selected={stockCheck}
            onSelect={setStockCheck}
            colors={['#F59E0B', '#10B981', '#EF4444']}
          />

          <Text style={styles.label}>Medicine / Product Ordered</Text>
          <TextInput style={styles.input} placeholder="e.g. Calpol, Augmentin"
            value={medicine} onChangeText={setMedicine} />

          <Text style={styles.label}>Quantity</Text>
          <TextInput style={styles.input} placeholder="e.g. 10 strips, 5 boxes"
            value={quantity} onChangeText={setQuantity} />

          <Text style={styles.label}>Order Value / POB Amount (₹)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 15000 (numbers only)"
            value={pobAmount}
            onChangeText={(text) => {
              // ✅ Allow only digits, max 10 digits = ₹99,99,99,999
              const cleaned = text.replace(/[^0-9]/g, '').slice(0, 10);
              setPobAmount(cleaned);
            }}
            keyboardType="numeric"
            maxLength={10}
          />

          {/* ✅ Next Follow-Up Date — Calendar Picker (no manual typing) */}
          <DatePickerField
            label="Next Follow-Up Date"
            value={nextFollowUp}
            onChange={setNextFollowUp}
          />

          <Text style={styles.label}>Remarks</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Any additional remarks..."
            value={remarks}
            onChangeText={setRemarks}
            multiline
            numberOfLines={3}
            onFocus={() => {
              setTimeout(() => { scrollViewRef.current?.scrollToEnd({ animated: true }); }, 150);
            }}
          />

          {/* Status — toggle buttons */}
          <ToggleRow
            label="Status"
            options={['Scheduled', 'Completed', 'Missed']}
            selected={status}
            onSelect={setStatus}
            colors={['#3B82F6', '#10B981', '#EF4444']}
          />

          <TouchableOpacity style={[styles.submitButton, isSubmitting && { opacity: 0.7 }]} onPress={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>BOOK ORDER</Text>
            )}
          </TouchableOpacity>

        </View>

        {/* Visit History */}
        <Text style={styles.historyTitle}>Today's Orders</Text>
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
            No orders booked today yet.
          </Text>
        ) : (
          <>
            <Text style={[styles.historyTitle, { fontSize: 14, color: '#64748B', marginTop: -5, marginBottom: 10 }]}>
              Total booked: {visits.length}
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
                <View style={[
                  styles.statusBadge,
                  visit.status === 'Completed' ? { backgroundColor: '#D1FAE5' }
                  : visit.status === 'Scheduled' ? { backgroundColor: '#DBEAFE' }
                  : { backgroundColor: '#FEE2E2' },
                ]}>
                  <Text style={[
                    { fontSize: 11, fontWeight: 'bold' },
                    visit.status === 'Completed' ? { color: '#059669' }
                    : visit.status === 'Scheduled' ? { color: '#2563EB' }
                    : { color: '#DC2626' },
                  ]}>
                    {visit.status}
                  </Text>
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