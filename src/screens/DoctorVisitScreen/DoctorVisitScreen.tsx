import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  createDoctor,
  createDoctorVisit,
  getDoctors,
  getDoctorVisitsByMr,
  updateDoctorVisit
} from '../../services/doctorService';
import { createFollowUp } from '../../services/followUpService';

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
  editable = true,
}: {
  label: string;
  value: string;
  onChange: (date: string) => void;
  editable?: boolean;
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const dateObj = value ? new Date(value) : new Date();

  if (Platform.OS === 'web') {
    return (
      <View style={{ marginBottom: 12, opacity: editable ? 1 : 0.6 }}>
        <Text style={styles.label}>{label}</Text>
        {/* @ts-ignore */}
        <input
          type="date"
          value={value}
          onChange={(e: any) => editable && onChange(e.target.value)}
          disabled={!editable}
          style={{
            borderWidth: 1, border: '1px solid #ddd', borderRadius: 8, padding: '12px',
            fontSize: 14, backgroundColor: editable ? '#fafafa' : '#e2e8f0', width: '100%', boxSizing: 'border-box',
            fontFamily: 'inherit', color: value ? '#222' : '#999',
            cursor: editable ? 'default' : 'not-allowed',
          }}
        />
      </View>
    );
  }

  return (
    <View style={{ marginBottom: 12, opacity: editable ? 1 : 0.6 }}>
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
      <View style={{ marginBottom: 12, opacity: editable ? 1 : 0.6 }}>
        <Text style={styles.label}>{label}</Text>
        {/* @ts-ignore */}
        <input
          type="time"
          value={value}
          onChange={(e: any) => editable && onChange(e.target.value)}
          disabled={!editable}
          style={{
            border: '1px solid #ddd', borderRadius: 8, padding: '12px',
            fontSize: 14, backgroundColor: editable ? '#fafafa' : '#e2e8f0', width: '100%', boxSizing: 'border-box',
            fontFamily: 'inherit', color: value ? '#222' : '#999',
            cursor: editable ? 'default' : 'not-allowed',
          }}
        />
      </View>
    );
  }

  return (
    <View style={{ marginBottom: 12, opacity: editable ? 1 : 0.6 }}>
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
      {showPicker && editable && (
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
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();

  // Common states
  const [visits, setVisits] = useState<DoctorVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  // API Dropdown states
  const [doctors, setDoctors] = useState<any[]>([]);
  const [doctorId, setDoctorId] = useState<number | null>(null);
  const [doctorSource, setDoctorSource] = useState<'Existing' | 'New'>('Existing');
  const [rawVisits, setRawVisits] = useState<any[]>([]);
  
  // Dynamic tracking state variables for MR ID
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
  const [status, setStatus] = useState<DoctorVisit['status']>('Completed');
  const [editingVisitId, setEditingVisitId] = useState<string | null>(null);
  const [editedVisitIds, setEditedVisitIds] = useState<string[]>([]);

  const scrollViewRef = React.useRef<ScrollView>(null);

  const customAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') { window.alert(`${title}\n\n${message}`); }
    else { Alert.alert(title, message); }
  };

  // Auto fetch authenticated profile token metadata on mount
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
    const init = async () => {
      await loadDoctors();
      await loadVisits();
      try {
        const stored = await AsyncStorage.getItem('@edited_visit_ids');
        if (stored) {
          setEditedVisitIds(JSON.parse(stored));
        }
      } catch (e) {
        console.log('Failed to load edited visits list:', e);
      }
    };
    init();
    setVisitDate(formatDate(new Date()));
    setVisitTime(formatTime(new Date()));
  }, []);

  // const loadVisits = async () => {
  //   setLoading(true); setError(null);
  //   try {
  //     const storedVisits = await AsyncStorage.getItem('@doctor_visits');
  //     setVisits(safeJsonParse(storedVisits, []));
  //   } catch (err) {
  //     console.log('Failed to load:', err);
  //     setError('Failed to load doctor visits.');
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const loadVisits = async () => {
    setLoading(true); setError(null);
    try {
      let serverVisits = [];
      try {
        serverVisits = await getDoctorVisitsByMr();
      } catch (err) {
        console.log('Failed to fetch doctor visits from backend:', err);
      }

      if (serverVisits && serverVisits.length > 0) {
        setRawVisits(serverVisits);
        await AsyncStorage.setItem('@doctor_visits', JSON.stringify(serverVisits));
      } else {
        const storedVisits = await AsyncStorage.getItem('@doctor_visits');
        setRawVisits(safeJsonParse(storedVisits, []));
      }
    } catch (err) {
      console.log('Failed to load:', err);
      setError('Failed to load doctor visits.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only map visits if doctors master list has loaded to prevent race conditions showing placeholder strings
    if (doctors && doctors.length > 0 && rawVisits && rawVisits.length > 0) {
      const mapped: DoctorVisit[] = rawVisits.map((item: any, idx: number) => {
        const doctor = doctors.find((d: any) => d.id === Number(item.doctorId));
        
        let dateStr = '';
        let timeStr = '';
        if (item.visitDate) {
          try {
            const d = new Date(item.visitDate);
            dateStr = d.toISOString().split('T')[0];
            timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          } catch (e) {}
        }
        return {
          id: item.id?.toString() || `server-${idx}`,
          doctorName: item.doctorName || (doctor ? doctor.name : `Doctor #${item.doctorId}`),
          specialty: doctor ? doctor.specialization || doctor.specialty || 'General Practitioner' : 'General Practitioner',
          clinic: doctor ? doctor.hospital || doctor.clinic || 'Clinic Address' : (item.remarks || 'Clinic Address'),
          mobile: doctor ? doctor.mobile || doctor.phone || '' : '',
          visitDate: dateStr || item.visitDate,
          visitTime: timeStr,
          visitType: item.visitType || 'Routine Visit',
          doctorClass: doctor ? doctor.classCategory || doctor.category || 'B' : 'B',
          productsDiscussed: item.productsDiscussed || '',
          samplesGiven: String(item.samplesGiven || 0),
          prescriptionPotential: doctor ? doctor.prescriptionPotential || 'Medium' : 'Medium',
          nextFollowUp: item.nextFollowUp || '',
          remarks: item.remarks || '',
          latitude: item.latitude,
          longitude: item.longitude,
          status: item.status || 'Completed',
        };
      });
      setVisits(mapped);
    } else {
      setVisits([]);
    }
  }, [rawVisits, doctors]);

  const loadDoctors = async () => {
    try {
      const response = await getDoctors();
      console.log('Doctors API Raw Response:', response);
      
      let resolvedDoctors = [];
      if (Array.isArray(response)) {
        resolvedDoctors = response;
      } else if (response) {
        if (Array.isArray(response.data)) {
          resolvedDoctors = response.data;
        } else if (response.data && Array.isArray(response.data.data)) {
          resolvedDoctors = response.data.data;
        } else if (Array.isArray(response.doctors)) {
          resolvedDoctors = response.doctors;
        } else if (response.data && Array.isArray(response.data.doctors)) {
          resolvedDoctors = response.data.doctors;
        } else if (Array.isArray(response.doctorsList)) {
          resolvedDoctors = response.doctorsList;
        } else if (response.doctors && Array.isArray(response.doctors.data)) {
          resolvedDoctors = response.doctors.data;
        } else {
          resolvedDoctors = response.data || response || [];
        }
      }
      
      setDoctors(Array.isArray(resolvedDoctors) ? resolvedDoctors : []);
    } catch (error) {
      console.log('Load Doctors Error:', error);
    }
  };

  const handleSubmit = async () => {
    if (doctorSource === 'Existing' && !doctorId) { 
      customAlert('Error', 'Please select a Doctor from the dropdown.'); 
      return; 
    }
    
    // 1. Doctor Name (min 3, max 100)
    if (!doctorName.trim() || doctorName.trim().length < 3 || doctorName.trim().length > 100) {
      customAlert('Error', 'Doctor Name must be between 3 and 100 characters.');
      return;
    }

    // 2. Clinic / Hospital Name (max 150)
    if (!clinic.trim() || clinic.trim().length > 150) {
      customAlert('Error', 'Clinic / Hospital Name must be between 1 and 150 characters.');
      return;
    }

    // 3. Mobile (starts with 6, 7, 8, 9 and exactly 10 digits)
    const mobileRegex = /^[6-9]\d{9}$/;
    if (mobile.trim() && !mobileRegex.test(mobile.trim())) {
      customAlert('Error', 'Mobile number must be exactly 10 digits and start with 6, 7, 8, or 9.');
      return;
    }

    // 4. Visit Date (cannot be in the future) - only validate on new visits
    if (!editingVisitId) {
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (new Date(visitDate) > today) {
        customAlert('Error', 'Visit Date cannot be in the future.');
        return;
      }
    }

    // 5. Next Follow Up Date (must be after Visit Date)
    if (nextFollowUp && new Date(nextFollowUp) <= new Date(visitDate)) {
      customAlert('Error', 'Next Follow Up Date must be after the Visit Date.');
      return;
    }

    // 6. Samples Given (must be 0 or a positive number)
    const samplesVal = Number(samplesGiven);
    if (samplesGiven && (isNaN(samplesVal) || samplesVal < 0)) {
      customAlert('Error', 'Samples Given must be 0 or a positive number.');
      return;
    }

    // 7. Products Discussed (max 250 characters)
    if (productsDiscussed.trim().length > 250) {
      customAlert('Error', 'Products Discussed cannot exceed 250 characters.');
      return;
    }

    // 8. Remarks (max 500 characters)
    if (remarks.trim().length > 500) {
      customAlert('Error', 'Remarks cannot exceed 500 characters.');
      return;
    }

    // 9. Prevent Duplicate Visits (same doctor on the same date) - only on new visits
    if (!editingVisitId) {
      const isDuplicate = visits.some(
        (v) =>
          v.doctorName.toLowerCase() === doctorName.trim().toLowerCase() &&
          v.visitDate === visitDate
      );
      if (isDuplicate) {
        customAlert('Warning', 'A visit for this doctor on the selected date is already logged.');
        return;
      }
    }

    // ─── REPLACED GPS BLOCK (WEB & MOBILE ACCURATE) ───
    setIsSubmitting(true);

    let currentLat: number | undefined = undefined;
    let currentLon: number | undefined = undefined;
    let distVerified = 'Pending Verification';

    try {
      if (Platform.OS === 'web') {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            resolve,
            reject,
            {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 0,
            }
          );
        });

        currentLat = position.coords.latitude;
        currentLon = position.coords.longitude;
      } else {
        let { status: locationStatus } = await Location.requestForegroundPermissionsAsync();

        if (locationStatus === 'granted') {
          let loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });

          currentLat = loc.coords.latitude;
          currentLon = loc.coords.longitude;
        }
      }

      console.log(
        'DOCTOR GPS:',
        currentLat,
        currentLon
      );

      if (currentLat && currentLon) {
        distVerified = 'Location Recorded';
      }
    } catch (e) {
      console.log(
        'Location error:',
        e
      );
    }
    // ───────────────────────────────────────────────────

    console.log('LATITUDE:', currentLat);
    console.log('LONGITUDE:', currentLon);

    // Backend submission step
    let finalDoctorId = doctorId;
    if (doctorSource === 'New' && !editingVisitId) {
      try {
        const newDoc = await createDoctor(
          doctorName,
          specialty || 'General Practitioner',
          clinic,
          mobile
        );
        console.log('New Doctor Saved to Backend:', newDoc);
        finalDoctorId = newDoc.id || newDoc.data?.id;
      } catch (error) {
        console.log('Create Doctor API Error:', error);
        customAlert('Error', 'Failed to save new Doctor profile to server.');
        setIsSubmitting(false);
        return;
      }
    }

    if (editingVisitId) {
      // Edit mode: call PUT API
      try {
        const numericId = Number(editingVisitId);
        if (!isNaN(numericId)) {
          // Find if we had mapped doctor ID originally from visits
          const origVisit = visits.find(v => v.id === editingVisitId);
          let apiDocId = finalDoctorId;
          if (!apiDocId && origVisit) {
            // Find doctor ID from master list
            const matchedDoc = doctors.find(d => d.name === origVisit.doctorName);
            if (matchedDoc) {
              apiDocId = matchedDoc.id;
            }
          }
          const parsedApiDocId = Number(apiDocId);
          if (isNaN(parsedApiDocId) || parsedApiDocId <= 0) {
            customAlert('Error', 'Invalid Doctor ID. Cannot update visit.');
            setIsSubmitting(false);
            return;
          }
          const result = await updateDoctorVisit(
            numericId,
            parsedApiDocId,
            remarks,
            productsDiscussed,
            Number(samplesGiven || 0),
            currentLat,
            currentLon
          );
          console.log('Doctor Visit Updated on Backend:', result);
        }
      } catch (error) {
        console.log('Doctor Visit API Error:', error);
        customAlert('Error', 'Failed to update Doctor Visit on server.');
        setIsSubmitting(false);
        return;
      }

      const updatedRawVisits = rawVisits.map((v) => {
        if (v.id?.toString() === editingVisitId?.toString()) {
          return {
            ...v,
            doctorId: finalDoctorId || v.doctorId,
            doctorName,
            remarks,
            productsDiscussed,
            samplesGiven: Number(samplesGiven || 0),
            visitType,
            nextFollowUp,
          };
        }
        return v;
      });
      setRawVisits(updatedRawVisits);

      try {
        await AsyncStorage.setItem('@doctor_visits', JSON.stringify(updatedRawVisits));
        
        // Track edited state locally
        const newEditedIds = [...editedVisitIds, editingVisitId];
        setEditedVisitIds(newEditedIds);
        await AsyncStorage.setItem('@edited_visit_ids', JSON.stringify(newEditedIds));
      } catch (err) {
        customAlert('Error', 'Failed to save visit data locally.');
      }

      const alertName = doctorName.toLowerCase().trim().startsWith('dr.') ? doctorName : `Dr. ${doctorName}`;
      customAlert('✅ Visit Updated!', `${alertName} visit updated successfully.`);

      // Reset editing state
      setEditingVisitId(null);
    } else {
      // Create mode
      const parsedDocId = Number(finalDoctorId);
      if (isNaN(parsedDocId) || parsedDocId <= 0) {
        customAlert('Error', 'Invalid Doctor ID. Cannot save visit.');
        setIsSubmitting(false);
        return;
      }
      try {
        const result = await createDoctorVisit(
          parsedDocId,
          remarks,
          productsDiscussed,
          Number(samplesGiven || 0),
          currentLat,
          currentLon
        );
        console.log('Doctor Visit Saved to Backend:', result);

          if (nextFollowUp) {
            await createFollowUp({
              mrId: Number(mrId),
              doctorId: Number(finalDoctorId),
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

      const newRawVisit = {
        id: Date.now(),
        doctorId: finalDoctorId,
        doctorName: doctorName,
        remarks: remarks,
        productsDiscussed: productsDiscussed,
        samplesGiven: Number(samplesGiven || 0),
        visitDate: new Date(`${visitDate}T${visitTime}`).toISOString(),
        visitType: visitType,
        status: status,
        latitude: currentLat,
        longitude: currentLon,
      };

      const updatedRawVisits = [newRawVisit, ...rawVisits];
      setRawVisits(updatedRawVisits);

      try {
        await AsyncStorage.setItem('@doctor_visits', JSON.stringify(updatedRawVisits));

        // ✅ Instantly append a local notification if a follow-up is scheduled
        if (nextFollowUp) {
          try {
            const notifsData = await AsyncStorage.getItem('@notifications');
            const notifsList = notifsData ? JSON.parse(notifsData) : [];
            notifsList.unshift({
              id: `dyn-doc-notif-${Date.now()}`,
              type: 'followup',
              title: `📅 Follow-up Scheduled`,
              message: `Follow-up with Dr. ${doctorName} scheduled for ${nextFollowUp}.`,
              time: 'Just now',
              unread: true,
            });
            await AsyncStorage.setItem('@notifications', JSON.stringify(notifsList.slice(0, 50)));
          } catch (e) {
            console.log('Failed to save follow-up notification:', e);
          }
        }
        await loadDoctors(); // Refresh dropdown master list so new doctor appears immediately
      } catch (err) {
        customAlert('Error', 'Failed to save visit data locally.');
      }

      const alertName = doctorName.toLowerCase().trim().startsWith('dr.') ? doctorName : `Dr. ${doctorName}`;
      customAlert('✅ Visit Saved!', `${alertName} visit logged successfully.`);
    }

    // Reset form, keep date/time
    setDoctorId(null); setDoctorName(''); setSpecialty(''); setClinic(''); setMobile('');
    setVisitType('Routine Visit'); setDoctorClass('B'); setProductsDiscussed('');
    setSamplesGiven(''); setPrescriptionPotential('Medium'); setNextFollowUp('');
        setRemarks(''); setStatus('Completed'); setDoctorSource('Existing');
    setIsSubmitting(false);
  };

  // Reusable toggle button row
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
      <ScrollView ref={scrollViewRef} style={styles.container} contentContainerStyle={{ paddingBottom: 100 }} keyboardShouldPersistTaps="handled">

        <Text style={styles.title}>🩺 Doctor Visit</Text>

        <View style={styles.form}>
          {editingVisitId === null && (
            <ToggleRow
              label="Doctor Source"
              options={['Existing Doctor', 'New Doctor']}
              selected={doctorSource === 'Existing' ? 'Existing Doctor' : 'New Doctor'}
              onSelect={(val) => {
                setDoctorSource(val === 'Existing Doctor' ? 'Existing' : 'New');
                setDoctorId(null);
                setDoctorName('');
                setSpecialty('');
                setClinic('');
                setMobile('');
              }}
            />
          )}

          {(doctorSource === 'Existing' && editingVisitId === null) && (
            <>
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
                  selectedValue={doctorId?.toString() ?? ""}
                  onValueChange={(itemValue) => {
                    if (!itemValue || itemValue === "") {
                      setDoctorId(null);
                      setDoctorName('');
                      setSpecialty('');
                      setClinic('');
                      setMobile('');
                      setDoctorClass('B');
                      setPrescriptionPotential('Medium');
                      return;
                    }
                    const doctorIdNum = Number(itemValue);
                    setDoctorId(doctorIdNum);
                    const selectedDoctor = doctors.find((d) => d.id === doctorIdNum);
                    if (selectedDoctor) {
                      setDoctorName(selectedDoctor.name || '');
                      setSpecialty(selectedDoctor.specialization || selectedDoctor.specialty || '');
                      setClinic(selectedDoctor.hospital || selectedDoctor.clinic || '');
                      setMobile(selectedDoctor.mobile || '');
                      setDoctorClass(selectedDoctor.classCategory || selectedDoctor.category || 'B');
                      setPrescriptionPotential(selectedDoctor.prescriptionPotential || 'Medium');
                    }
                  }}
                >
                  <Picker.Item label="-- Select Existing Doctor --" value="" />
                  {doctors.map((doctor) => (
                    <Picker.Item key={doctor.id} label={doctor.name} value={doctor.id.toString()} />
                  ))}
                </Picker>
              </View>
            </>
          )}

          <Text style={styles.label}>Doctor Name *</Text>
          <TextInput 
            style={[
              styles.input,
              (editingVisitId === null && doctorSource === 'Existing' && doctorId !== null) && {
                backgroundColor: '#F1F5F9',
                color: '#64748B',
              },
            ]}
            placeholder="Enter doctor's name"
            value={doctorName} 
            onChangeText={setDoctorName} 
            editable={editingVisitId !== null || doctorSource === 'New' || doctorId === null}
          />

          <Text style={styles.label}>Specialty</Text>
          <TextInput 
            style={[
              styles.input,
              (editingVisitId === null && doctorSource === 'Existing' && doctorId !== null) && {
                backgroundColor: '#F1F5F9',
                color: '#64748B',
              },
            ]}
            placeholder="e.g. Cardiologist"
            value={specialty} 
            onChangeText={setSpecialty} 
            editable={editingVisitId !== null || doctorSource === 'New' || doctorId === null}
          />

          <Text style={styles.label}>Clinic / Hospital Name *</Text>
          <TextInput 
            style={[
              styles.input,
              (editingVisitId === null && doctorSource === 'Existing' && doctorId !== null) && {
                backgroundColor: '#F1F5F9',
                color: '#64748B',
              },
            ]}
            placeholder="e.g. City General Hospital"
            value={clinic} 
            onChangeText={setClinic} 
            editable={editingVisitId !== null || doctorSource === 'New' || doctorId === null}
          />

          <Text style={styles.label}>Mobile Number</Text>
          <TextInput 
            style={[
              styles.input,
              (editingVisitId === null && doctorSource === 'Existing' && doctorId !== null) && {
                backgroundColor: '#F1F5F9',
                color: '#64748B',
              },
            ]}
            placeholder="Enter 10-digit mobile number"
            value={mobile}
            onChangeText={(text) => setMobile(text.replace(/[^0-9]/g, '').slice(0, 10))}
            keyboardType="numeric" 
            maxLength={10} 
            editable={editingVisitId !== null || doctorSource === 'New' || doctorId === null}
          />

           <DatePickerField label="Visit Date *" value={visitDate} onChange={setVisitDate} editable={false} />
          <TimePickerField label="Visit Time" value={visitTime} onChange={setVisitTime} editable={false} />

          <ToggleRow
            label="Visit Type"
            options={['Routine Visit', 'Follow Up']}
            selected={visitType} onSelect={setVisitType}
          />

          <ToggleRow
            label="Doctor Class"
            options={['A', 'B', 'C']}
            selected={doctorClass} onSelect={setDoctorClass}
            disabled={editingVisitId === null && doctorSource === 'Existing' && doctorId !== null}
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
            disabled={editingVisitId === null && doctorSource === 'Existing' && doctorId !== null}
          />

          <DatePickerField label="Next Follow-Up Date" value={nextFollowUp} onChange={setNextFollowUp} />

          <Text style={styles.label}>Remarks / Meeting Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Any additional remarks..."
            value={remarks} onChangeText={setRemarks}
            multiline numberOfLines={3}
          />

          {/* <ToggleRow
            label="Status"
            options={['Scheduled', 'Completed', 'Missed']}
            selected={status} onSelect={setStatus}
            colors={['#3B82F6', '#10B981', '#EF4444']}
          /> */}
           {/* Status is automatically set to Completed upon submission */}

          <TouchableOpacity style={[styles.submitButton, isSubmitting && { opacity: 0.7 }]} onPress={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>{editingVisitId ? "UPDATE DOCTOR VISIT" : "LOG DOCTOR VISIT"}</Text>
            )}
          </TouchableOpacity>

          {editingVisitId && (
            <TouchableOpacity 
              style={[styles.submitButton, { backgroundColor: '#64748B', marginTop: 8 }]} 
              onPress={() => {
                setEditingVisitId(null);
                setDoctorId(null); setDoctorName(''); setSpecialty(''); setClinic(''); setMobile('');
                setVisitType('Routine Visit'); setDoctorClass('B'); setProductsDiscussed('');
                setSamplesGiven(''); setPrescriptionPotential('Medium'); setNextFollowUp('');
                setRemarks(''); setStatus('Completed'); setDoctorSource('Existing');
              }}
            >
              <Text style={styles.submitText}>CANCEL EDIT</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Visit History */}
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
          <>
            <Text style={[styles.historyTitle, { fontSize: 14, color: '#64748B', marginTop: -5, marginBottom: 10 }]}>
              Total visits: {visits.length}
            </Text>
            {visits.map((visit) => (
              <View key={visit.id} style={styles.visitCard}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={styles.visitDoctor}>
                  {visit.doctorName.toLowerCase().trim().startsWith('dr.') ? visit.doctorName : `Dr. ${visit.doctorName}`}
                </Text>
                <View style={{ backgroundColor: '#EEF2FF', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                  <Text style={{ fontSize: 10, color: '#4F46E5', fontWeight: 'bold' }}>Class {visit.doctorClass}</Text>
                </View>
              </View>
              <Text style={styles.visitInfo}>🏥 {visit.clinic}  •  👨‍⚕️ {visit.specialty}</Text>
              <Text style={styles.visitInfo}>📅 {visit.visitDate}  •  🕐 {visit.visitTime}</Text>
              <Text style={styles.visitInfo}>🔖 {visit.visitType}  •  rx: {visit.prescriptionPotential}</Text>
              {visit.productsDiscussed ? <Text style={styles.visitInfo}>💊 {visit.productsDiscussed}</Text> : null}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9' }}>
                {visit.status === 'Completed' ? (
                  <Text style={[styles.visitInfo, { color: '#10B981', fontWeight: 'bold', marginTop: 0 }]}>✓ Completed</Text>
                ) : visit.status === 'Scheduled' ? (
                  <Text style={[styles.visitInfo, { color: '#3B82F6', fontWeight: 'bold', marginTop: 0 }]}>⏳ Scheduled</Text>
                ) : (
                  <Text style={[styles.visitInfo, { color: '#EF4444', fontWeight: 'bold', marginTop: 0 }]}>❌ Missed</Text>
                )}

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
                    onPress={() => {
                      setEditingVisitId(visit.id);
                      const matchedDoc = doctors.find((d: any) => d.name === visit.doctorName);
                      if (matchedDoc) {
                        setDoctorSource('Existing');
                        setDoctorId(matchedDoc.id);
                      } else {
                        setDoctorSource('New');
                        setDoctorId(null);
                      }
                      setDoctorName(visit.doctorName);
                      setSpecialty(visit.specialty);
                      setClinic(visit.clinic);
                      setMobile(visit.mobile || '');
                      setVisitDate(visit.visitDate);
                      setVisitTime(visit.visitTime);
                      setVisitType(visit.visitType);
                      setDoctorClass(visit.doctorClass);
                      setProductsDiscussed(visit.productsDiscussed);
                      setSamplesGiven(visit.samplesGiven);
                      setPrescriptionPotential(visit.prescriptionPotential);
                      setNextFollowUp(visit.nextFollowUp || '');
                      setRemarks(visit.remarks || '');
                      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
                    }}
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