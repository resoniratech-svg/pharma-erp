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
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker'; // ⬅️ Imported Picker
import * as Location from 'expo-location';
import {
  createDoctorVisit,
  getDoctors
} from '../../services/doctorService';
import { createFollowUp } from '../../services/followUpService'; // ⬅️ Imported service method for scheduling follow-ups

// ✅ Unified interface — matches React Web DoctorVisits.tsx exactly
interface DoctorVisit {
  id: string;
  doctorName: string;
  specialty: string;
  clinic: string;
  mobile?: string;
  visitDate: string;
  visitTime: string;
  visitType: 'Routine Visit' | 'Follow Up' | 'New Doctor';
  doctorClass: 'A' | 'B' | 'C';
  productsDiscussed: string;
  samplesGiven: string;
  prescriptionPotential: 'High' | 'Medium' | 'Low';
  nextFollowUp: string;
  remarks?: string;
  latitude?: number;
  longitude?: number;
  distanceVerified?: string;
  status: 'Completed' | 'Scheduled' | 'Missed';
}

const safeJsonParse = (data: string | null, fallback: any) => {
  if (!data) return fallback;
  try { return JSON.parse(data); }
  catch (err) { console.log('safeJsonParse error:', err); return fallback; }
};

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

  if (Platform.OS === 'web') {
    return (
      <View style={{ marginBottom: 12 }}>
        <Text style={styles.label}>{label}</Text>
        {/* @ts-ignore */}
        <input
          type="date"
          value={value}
          onChange={(e: any) => onChange(e.target.value)}
          style={{
            borderWidth: 1, border: '1px solid #ddd', borderRadius: 8, padding: '12px',
            fontSize: 14, backgroundColor: '#fafafa', width: '100%', boxSizing: 'border-box',
            fontFamily: 'inherit', color: value ? '#222' : '#999',
          }}
        />
      </View>
    );
  }

  return (
    <View style={{ marginBottom: 12 }}>
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
            setShowPicker(Platform.OS === 'ios');
            if (selectedDate) { onChange(formatDate(selectedDate)); }
            if (Platform.OS === 'android') { setShowPicker(false); }
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
}: {
  label: string;
  value: string;
  onChange: (time: string) => void;
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
      <View style={{ marginBottom: 12 }}>
        <Text style={styles.label}>{label}</Text>
        {/* @ts-ignore */}
        <input
          type="time"
          value={value}
          onChange={(e: any) => onChange(e.target.value)}
          style={{
            border: '1px solid #ddd', borderRadius: 8, padding: '12px',
            fontSize: 14, backgroundColor: '#fafafa', width: '100%', boxSizing: 'border-box',
            fontFamily: 'inherit', color: value ? '#222' : '#999',
          }}
        />
      </View>
    );
  }

  return (
    <View style={{ marginBottom: 12 }}>
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
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(_event: any, selectedTime?: Date) => {
            setShowPicker(Platform.OS === 'ios');
            if (selectedTime) { onChange(formatTime(selectedTime)); }
            if (Platform.OS === 'android') { setShowPicker(false); }
          }}
        />
      )}
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────

const DoctorVisitScreen = () => {
  // Common states
  const [visits, setVisits] = useState<DoctorVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // API Dropdown states
  const [doctors, setDoctors] = useState<any[]>([]);
  const [doctorId, setDoctorId] = useState<number | null>(null);
  
  // ⬅️ Modification Step: Dynamic tracking state variables for MR ID
  const [mrId, setMrId] = useState<number | null>(null);

  // Form states matching unified interface
  const [doctorName, setDoctorName] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [clinic, setClinic] = useState('');
  const [mobile, setMobile] = useState('');
  const [visitDate, setVisitDate] = useState('');
  const [visitTime, setVisitTime] = useState('');
  const [visitType, setVisitType] = useState<DoctorVisit['visitType']>('Routine Visit');
  const [doctorClass, setDoctorClass] = useState<DoctorVisit['doctorClass']>('B');
  const [productsDiscussed, setProductsDiscussed] = useState('');
  const [samplesGiven, setSamplesGiven] = useState('');
  const [prescriptionPotential, setPrescriptionPotential] = useState<DoctorVisit['prescriptionPotential']>('Medium');
  const [nextFollowUp, setNextFollowUp] = useState('');
  const [remarks, setRemarks] = useState('');
  const [status, setStatus] = useState<DoctorVisit['status']>('Scheduled');

  const scrollViewRef = React.useRef<ScrollView>(null);

  const customAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') { window.alert(`${title}\n\n${message}`); }
    else { Alert.alert(title, message); }
  };

  // ⬅️ Modification Step: Auto fetch authenticated profile token metadata on mount
  useEffect(() => {
    const loadMrId = async () => {
      const storedMrId = await AsyncStorage.getItem('@mrId');
      if (storedMrId) {
        setMrId(Number(storedMrId));
      }
    };
    loadMrId();
  }, []);

  useEffect(() => {
    loadVisits();
    loadDoctors(); // Fetching backend doctors
    setVisitDate(formatDate(new Date()));
    setVisitTime(formatTime(new Date()));
  }, []);

  const loadVisits = async () => {
    setLoading(true); setError(null);
    try {
      const storedVisits = await AsyncStorage.getItem('@doctor_visits');
      setVisits(safeJsonParse(storedVisits, []));
    } catch (err) {
      console.log('Failed to load:', err);
      setError('Failed to load doctor visits.');
    } finally {
      setLoading(false);
    }
  };

  const loadDoctors = async () => {
    try {
      const response = await getDoctors();
      console.log('Doctors:', response);
      setDoctors(response.data || response); // fallback array structural safety
    } catch (error) {
      console.log('Load Doctors Error:', error);
    }
  };

  const handleSubmit = async () => {
    if (!doctorId) { customAlert('Error', 'Please select a Doctor'); return; }
    if (!clinic.trim()) { customAlert('Error', 'Please enter Clinic / Hospital'); return; }
    if (!visitDate) { customAlert('Error', 'Please select Visit Date'); return; }
    if (mobile.trim() && mobile.length !== 10) {
      customAlert('Error', 'Mobile number must be exactly 10 digits.');
      return;
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

    // Backend submission step
    try {
      const result = await createDoctorVisit(
        doctorId,
        remarks,
        productsDiscussed,
        Number(samplesGiven || 0),
        currentLat,
        currentLon
      );
      console.log('Doctor Visit Saved to Backend:', result);

      console.log('FOLLOWUP MR ID:', mrId);
      console.log('FOLLOWUP DOCTOR ID:', doctorId);

      if (nextFollowUp) {
        console.log('FOLLOWUP MR ID:', mrId);

        console.log('FOLLOWUP PAYLOAD:', {
          mrId: Number(mrId),
          doctorId: Number(doctorId),
          title: 'Doctor Follow Up',
          remarks: remarks || 'Doctor follow-up scheduled',
          followUpDate: new Date(nextFollowUp),
        });

        // ⬅️ Modification Step: Configured dynamically resolved component properties
        await createFollowUp({
          mrId: Number(mrId),
          doctorId: Number(doctorId),
          title: 'Doctor Follow Up',
          remarks: remarks || 'Doctor follow-up scheduled',
          followUpDate: new Date(nextFollowUp),
        });

        console.log('Follow-up schedule created successfully on server.');
      }
    } catch (error) {
      console.log('Doctor Visit API Error:', error);
      customAlert('Error', 'Failed to save Doctor Visit to server.');
      setIsSubmitting(false);
      return;
    }

    const newVisit: DoctorVisit = {
      id: Date.now().toString(),
      doctorName,
      specialty: specialty || 'General Practitioner',
      clinic,
      mobile,
      visitDate,
      visitTime,
      visitType,
      doctorClass,
      productsDiscussed,
      samplesGiven,
      prescriptionPotential,
      nextFollowUp,
      latitude: currentLat,
      longitude: currentLon,
      distanceVerified: distVerified,
      remarks,
      status,
    };

    const updatedVisits = [newVisit, ...visits];
    setVisits(updatedVisits);

    try {
      await AsyncStorage.setItem('@doctor_visits', JSON.stringify(updatedVisits));
      customAlert('✅ Visit Saved!', `Dr. ${doctorName} visit logged successfully.`);
    } catch (err) {
      customAlert('Error', 'Failed to save visit data locally.');
    }

    // Reset form, keep date/time
    setDoctorId(null); setDoctorName(''); setSpecialty(''); setClinic(''); setMobile('');
    setVisitType('Routine Visit'); setDoctorClass('B'); setProductsDiscussed('');
    setSamplesGiven(''); setPrescriptionPotential('Medium'); setNextFollowUp('');
    setRemarks(''); setStatus('Scheduled');
    setIsSubmitting(false);
  };

  // Reusable toggle button row
  const ToggleRow = ({
    label, options, selected, onSelect, colors,
  }: {
    label: string; options: string[]; selected: string;
    onSelect: (val: any) => void; colors?: string[];
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
              selected === opt && { backgroundColor: colors ? colors[i] : '#1E88E5', borderColor: colors ? colors[i] : '#1E88E5' },
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
      <ScrollView ref={scrollViewRef} style={styles.container} contentContainerStyle={{ paddingBottom: 100 }} keyboardShouldPersistTaps="handled">

        <Text style={styles.title}>🩺 Doctor Visit</Text>

        <View style={styles.form}>
          <Text style={styles.label}>Select Doctor *</Text>
          <View
            style={{
              borderWidth: 1,
              borderColor: '#ddd',
              borderRadius: 8,
              marginBottom: 12,
            }}
          >
            <Picker
              selectedValue={doctorId}
              onValueChange={(itemValue) => {
                const doctorIdNum = Number(itemValue);
                setDoctorId(doctorIdNum);
                const selectedDoctor = doctors.find((d) => d.id === doctorIdNum);
                if (selectedDoctor) {
                  setDoctorName(selectedDoctor.name || '');
                  setSpecialty(selectedDoctor.specialization || '');
                  setClinic(selectedDoctor.hospital || '');
                  setMobile(selectedDoctor.mobile || '');
                }
              }}
            >
              <Picker.Item label="Select Doctor" value={null} />
              {doctors.map((doctor) => (
                <Picker.Item key={doctor.id} label={doctor.name} value={doctor.id} />
              ))}
            </Picker>
          </View>

          <Text style={styles.label}>Specialty</Text>
          <TextInput style={styles.input} placeholder="e.g. Cardiologist"
            value={specialty} onChangeText={setSpecialty} />

          <Text style={styles.label}>Clinic / Hospital Name *</Text>
          <TextInput style={styles.input} placeholder="e.g. City General Hospital"
            value={clinic} onChangeText={setClinic} />

          <Text style={styles.label}>Mobile Number</Text>
          <TextInput style={styles.input} placeholder="Enter 10-digit mobile number"
            value={mobile}
            onChangeText={(text) => setMobile(text.replace(/[^0-9]/g, '').slice(0, 10))}
            keyboardType="numeric" maxLength={10} />

          <DatePickerField label="Visit Date *" value={visitDate} onChange={setVisitDate} />
          <TimePickerField label="Visit Time" value={visitTime} onChange={setVisitTime} />

          <ToggleRow
            label="Visit Type"
            options={['Routine Visit', 'Follow Up', 'New Doctor']}
            selected={visitType} onSelect={setVisitType}
          />

          <ToggleRow
            label="Doctor Class"
            options={['A', 'B', 'C']}
            selected={doctorClass} onSelect={setDoctorClass}
          />

          <Text style={styles.label}>Products Discussed</Text>
          <TextInput style={styles.input} placeholder="e.g. Atorvastatin 40mg"
            value={productsDiscussed} onChangeText={setProductsDiscussed} />

          <Text style={styles.label}>Samples Given</Text>
          <TextInput style={styles.input} placeholder="e.g. 10 strips Atorvastatin"
            value={samplesGiven} onChangeText={setSamplesGiven} keyboardType="numeric" />

          <ToggleRow
            label="Rx Potential"
            options={['High', 'Medium', 'Low']}
            selected={prescriptionPotential} onSelect={setPrescriptionPotential}
            colors={['#10B981', '#F59E0B', '#EF4444']}
          />

          <DatePickerField label="Next Follow-Up Date" value={nextFollowUp} onChange={setNextFollowUp} />

          <Text style={styles.label}>Remarks / Meeting Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Any additional remarks..."
            value={remarks} onChangeText={setRemarks}
            multiline numberOfLines={3}
          />

          <ToggleRow
            label="Status"
            options={['Scheduled', 'Completed', 'Missed']}
            selected={status} onSelect={setStatus}
            colors={['#3B82F6', '#10B981', '#EF4444']}
          />

          <TouchableOpacity style={[styles.submitButton, isSubmitting && { opacity: 0.7 }]} onPress={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>LOG DOCTOR VISIT</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Visit History */}
        <Text style={styles.historyTitle}>Recent Visits</Text>
        {loading ? (
          <ActivityIndicator size="small" color="#1E88E5" style={{ marginVertical: 10 }} />
        ) : error ? (
          <View style={{ padding: 12, alignItems: 'center' }}>
            <Text style={{ color: '#EF4444', fontSize: 13, marginBottom: 6 }}>{error}</Text>
            <TouchableOpacity onPress={loadVisits} style={{ padding: 6, backgroundColor: '#E2E8F0', borderRadius: 4 }}>
              <Text style={{ fontSize: 12, color: '#475569', fontWeight: 'bold' }}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : visits.length === 0 ? (
          <Text style={{ fontSize: 13, color: '#94A3B8', fontStyle: 'italic', textAlign: 'center', marginVertical: 10 }}>
            No doctor visits logged yet.
          </Text>
        ) : (
          visits.map((visit) => (
            <View key={visit.id} style={styles.visitCard}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={styles.visitDoctor}>Dr. {visit.doctorName}</Text>
                <View style={{ backgroundColor: '#EEF2FF', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                  <Text style={{ fontSize: 10, color: '#4F46E5', fontWeight: 'bold' }}>Class {visit.doctorClass}</Text>
                </View>
              </View>
              <Text style={styles.visitInfo}>🏥 {visit.clinic}  •  👨‍⚕️ {visit.specialty}</Text>
              <Text style={styles.visitInfo}>📅 {visit.visitDate}  •  🕐 {visit.visitTime}</Text>
              <Text style={styles.visitInfo}>🔖 {visit.visitType}  •  rx: {visit.prescriptionPotential}</Text>
              {visit.productsDiscussed ? <Text style={styles.visitInfo}>💊 {visit.productsDiscussed}</Text> : null}
              {visit.status === 'Completed' ? (
                <Text style={[styles.visitInfo, { color: '#10B981', fontWeight: 'bold' }]}>✓ Completed</Text>
              ) : visit.status === 'Scheduled' ? (
                <Text style={[styles.visitInfo, { color: '#3B82F6', fontWeight: 'bold' }]}>⏳ Scheduled</Text>
              ) : (
                <Text style={[styles.visitInfo, { color: '#EF4444', fontWeight: 'bold' }]}>❌ Missed</Text>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default DoctorVisitScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA', padding: 20, paddingTop: 50 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 20, textAlign: 'center' },
  form: { backgroundColor: '#fff', borderRadius: 12, padding: 20, marginBottom: 20, elevation: 2 },
  label: { fontSize: 13, fontWeight: '600', color: '#64748B', marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, padding: 12,
    fontSize: 14, backgroundColor: '#F8FAFC', color: '#334155', marginBottom: 12,
  },
  textArea: { height: 80, textAlignVertical: 'top' },
  toggleRow: { flexDirection: 'row', gap: 8 },
  toggleBtn: {
    flex: 1, paddingVertical: 8, borderWidth: 1, borderColor: '#E2E8F0',
    borderRadius: 8, alignItems: 'center', backgroundColor: '#F8FAFC',
  },
  toggleBtnText: { fontSize: 12, color: '#64748B', fontWeight: '500' },
  submitButton: { backgroundColor: '#1E88E5', padding: 16, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
  historyTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  visitCard: { backgroundColor: '#fff', borderRadius: 10, padding: 15, marginBottom: 10, elevation: 1, borderLeftWidth: 4, borderLeftColor: '#1E88E5' },
  visitDoctor: { fontSize: 16, fontWeight: 'bold', color: '#1E88E5', marginBottom: 4 },
  visitInfo: { fontSize: 13, color: '#555', marginTop: 4 },
});