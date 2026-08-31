import { createExpense, getExpensesByMr, encodeReceiptToDataUrl } from '../../services/expenseService';
import { getDoctorVisitsByMr } from '../../services/doctorService';
import { getChemistVisitsByMr } from '../../services/chemistService';
import { getAttendanceLogs } from '../../services/attendanceService';
import { getTargetsByMr } from '../../services/targetService';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
  Alert,
  KeyboardAvoidingView,
  ActivityIndicator,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import RNDateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';

const safeJsonParse = (data: string | null, fallback: any) => {
  if (!data) return fallback;
  try {
    return JSON.parse(data);
  } catch (err) {
    console.log('safeJsonParse error in ExpenseClaimScreen:', err);
    return fallback;
  }
};

interface ExpenseClaim {
  id: number;
  date: string;
  category: 'Travel Allowance (TA)' | 'Daily Allowance (DA)' | 'Hotel / Lodging' | 'Toll / Parking' | 'Miscellaneous';
  amount: number;
  kmTravelled?: number;
  receiptRef: string;
  remarks: string;
  status: 'Pending Approval' | 'Approved' | 'Rejected';
}



const ExpenseClaimScreen = () => {
  const navigation = useNavigation<any>();
  const [claims, setClaims] = useState<ExpenseClaim[]>([]);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toLocaleDateString('en-GB').replace(/\//g, '-') // DD-MM-YYYY
  );
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Configuration settings loaded from backend, falling back to defaults
  const [configSettings, setConfigSettings] = useState({
    taRate: 5.00,
    daAmount: 250,
    maxLimit: 50000,
  });

  // Form Fields
  const [category, setCategory] = useState<'Travel Allowance (TA)' | 'Daily Allowance (DA)' | 'Hotel / Lodging' | 'Toll / Parking' | 'Miscellaneous'>('Travel Allowance (TA)');
  const [amount, setAmount] = useState('');
  const [kmTravelled, setKmTravelled] = useState('');
  const [taRateStr, setTaRateStr] = useState('5.00');
  const [remarks, setRemarks] = useState('');
  
  // Image Upload State
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedImageBase64, setSelectedImageBase64] = useState<string | null>(null);
  const [selectedImageMimeType, setSelectedImageMimeType] = useState<string | undefined>(undefined);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);

  const scrollViewRef = React.useRef<ScrollView>(null);

  // Summaries
  const [totals, setTotals] = useState({ claimed: 0, approved: 0, pending: 0 });
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);  // ← prevents double-submit
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadClaims();
    loadConfigSettings();
  }, []);

  // When selected date changes, lookup distance to prefill Travel Allowance if selected
  useEffect(() => {
    if (category === 'Travel Allowance (TA)') {
      autoLookupGPSDistance();
    }
  }, [selectedDate, category]);

  const loadConfigSettings = async () => {
    try {
      const targets = await getTargetsByMr();
      if (targets && (Array.isArray(targets) ? targets.length > 0 : targets)) {
        const tObj = Array.isArray(targets) ? targets[0] : targets;
        const fetchedTaRate = Number(tObj.taRate || tObj.travelRate) || 5.00;
        setConfigSettings({
          taRate: fetchedTaRate,
          daAmount: Number(tObj.daAmount || tObj.dailyAllowance || tObj.dailyRate) || 250,
          maxLimit: Number(tObj.maxLimit || tObj.maxClaimLimit) || 50000,
        });
        setTaRateStr(fetchedTaRate.toFixed(2));
      }
    } catch (error) {
      console.log('Could not load target config for rates:', error);
    }
  };

  const loadClaims = async () => {
    setLoading(true);
    setError(null);
    try {
      let serverClaims = [];
      try {
        serverClaims = await getExpensesByMr();
      } catch (err) {
        console.log('Failed to fetch expenses from backend:', err);
      }

      if (serverClaims && serverClaims.length > 0) {
        const parsed = serverClaims.map((c: any, idx: number) => ({
          id: c.id || Date.now() + idx,
          date: c.expenseDate || c.expense_date
            ? new Date(c.expenseDate || c.expense_date).toLocaleDateString('en-GB').replace(/\//g, '-')
            : c.date
            ? new Date(c.date).toLocaleDateString('en-GB').replace(/\//g, '-')
            : c.createdAt
            ? new Date(c.createdAt).toLocaleDateString('en-GB').replace(/\//g, '-')
            : 'N/A',
          category: c.type || c.category || c.expenseType || c.expense_type || 'Miscellaneous',
          amount: Number(c.amount) || 0,
          remarks: c.description || c.remarks || '',
          receiptRef: c.billUrl || c.receiptUrl || 'N/A',
          status: c.status || 'Pending Approval',
          kmTravelled: c.kmTravelled || c.km_travelled,
        }));
        setClaims(parsed);
        calculateTotals(parsed);
      } else {
        setClaims([]);
        calculateTotals([]);
      }
    } catch (e) {
      console.log('Failed to load claims:', e);
      setError('Failed to load expense claims.');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = (list: ExpenseClaim[]) => {
    const claimed = list.reduce((sum, item) => sum + item.amount, 0);
    const approved = list.reduce((sum, item) => {
      const isApproved = String(item.status).toUpperCase() === 'APPROVED';
      return sum + (isApproved ? item.amount : 0);
    }, 0);
    const pending = list.reduce((sum, item) => {
      const isPending = String(item.status).toUpperCase() === 'PENDING APPROVAL';
      return sum + (isPending ? item.amount : 0);
    }, 0);

    setTotals({ claimed, approved, pending });
  };

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

  const checkSameDay = (d1: Date, d2Str: string) => {
    if (!d2Str) return false;
    try {
      const d2 = new Date(d2Str);
      if (isNaN(d2.getTime())) {
        const cleaned = d2Str.replace(/-/g, ' ');
        const parts = cleaned.split(' ');
        if (parts.length >= 3) {
          const day = parseInt(parts[0]);
          const year = parseInt(parts[2]);
          const monthStr = parts[1].toLowerCase();
          const monthsAbbr = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
          const monthIdx = monthsAbbr.findIndex(m => monthStr.startsWith(m));
          if (day && year && monthIdx !== -1) {
            return d1.getDate() === day && d1.getMonth() === monthIdx && d1.getFullYear() === year;
          }
        }
        return false;
      }
      return d1.getDate() === d2.getDate() && 
             d1.getMonth() === d2.getMonth() && 
             d1.getFullYear() === d2.getFullYear();
    } catch (e) {
      return false;
    }
  };

  const extractCoords = (obj: any, type: 'checkin' | 'checkout' | 'visit') => {
    if (!obj) return null;
    let lat: any = null;
    let lng: any = null;

    if (type === 'checkin') {
      lat = obj.checkInLat || obj.checkInLatitude || obj.check_in_latitude || obj.latitude || obj.lat;
      lng = obj.checkInLng || obj.checkInLongitude || obj.check_in_longitude || obj.longitude || obj.lng;
    } else if (type === 'checkout') {
      lat = obj.checkOutLat || obj.checkOutLatitude || obj.check_out_latitude || obj.latitude || obj.lat;
      lng = obj.checkOutLng || obj.checkOutLongitude || obj.check_out_longitude || obj.longitude || obj.lng;
    } else {
      lat = obj.latitude || obj.lat || obj.latitude_coords || obj.doctorLatitude || obj.chemistLatitude || obj.visitLatitude || obj.gpsLatitude || (obj.location && obj.location.latitude);
      lng = obj.longitude || obj.lng || obj.longitude_coords || obj.doctorLongitude || obj.chemistLongitude || obj.visitLongitude || obj.gpsLongitude || (obj.location && obj.location.longitude);
    }

    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);

    if (isNaN(parsedLat) || isNaN(parsedLng)) return null;
    if (parsedLat === 0 && parsedLng === 0) return null;
    return { latitude: parsedLat, longitude: parsedLng };
  };

  // Prefills travel expense by looking up logged GPS coordinates from visits and attendance
  const autoLookupGPSDistance = async () => {
    try {
      const parts = selectedDate.split('-');
      if (parts.length !== 3) return;
      const targetDate = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
      
      // 1. Fetch Doctor Visits
      let allDocList: any[] = [];
      try {
        allDocList = await getDoctorVisitsByMr();
        if (!Array.isArray(allDocList)) allDocList = [];
      } catch (err) {
        console.log('Failed to fetch doctor visits for GPS distance:', err);
      }
      const docList = allDocList.filter((v: any) => checkSameDay(targetDate, v.visitDate || v.date || v.createdAt || v.visit_date));

      // 2. Fetch Chemist Visits
      let allChemistList: any[] = [];
      try {
        allChemistList = await getChemistVisitsByMr();
        if (!Array.isArray(allChemistList)) allChemistList = [];
      } catch (err) {
        console.log('Failed to fetch chemist visits for GPS distance:', err);
      }
      const chemistList = allChemistList.filter((v: any) => checkSameDay(targetDate, v.visitDate || v.date || v.createdAt || v.visit_date));

      // 3. Fetch Attendance Logs
      let logsList: any[] = [];
      try {
        logsList = await getAttendanceLogs();
        if (!Array.isArray(logsList)) logsList = [];
      } catch (err) {
        console.log('Failed to fetch attendance logs for GPS distance:', err);
      }
      const todayLog = logsList.find((log: any) => checkSameDay(targetDate, log.date || log.checkInTime || log.check_in_time || log.createdAt));

      let startLat: number | null = null;
      let startLng: number | null = null;
      let endLat: number | null = null;
      let endLng: number | null = null;

      if (todayLog) {
        const checkInCoords = extractCoords(todayLog, 'checkin');
        const checkOutCoords = extractCoords(todayLog, 'checkout');
        if (checkInCoords) {
          startLat = checkInCoords.latitude;
          startLng = checkInCoords.longitude;
        }
        if (checkOutCoords) {
          endLat = checkOutCoords.latitude;
          endLng = checkOutCoords.longitude;
        }
      }

      const routePoints: { latitude: number; longitude: number; time: number }[] = [];
      docList.forEach((v: any) => {
        const coords = extractCoords(v, 'visit');
        if (coords) {
          const timeVal = v.visitDate ? new Date(v.visitDate).getTime() : 
                         (v.date ? new Date(v.date).getTime() : 0);
          routePoints.push({ ...coords, time: timeVal });
        }
      });

      chemistList.forEach((v: any) => {
        const coords = extractCoords(v, 'visit');
        if (coords) {
          const timeVal = v.visitDate ? new Date(v.visitDate).getTime() : 
                         (v.date ? new Date(v.date).getTime() : 0);
          routePoints.push({ ...coords, time: timeVal });
        }
      });

      routePoints.sort((a, b) => a.time - b.time);

      const routeCoords: { latitude: number; longitude: number }[] = [];
      if (startLat !== null && startLng !== null) {
        routeCoords.push({ latitude: startLat, longitude: startLng });
      }
      routePoints.forEach(pt => {
        const last = routeCoords[routeCoords.length - 1];
        if (!last || last.latitude !== pt.latitude || last.longitude !== pt.longitude) {
          routeCoords.push({ latitude: pt.latitude, longitude: pt.longitude });
        }
      });
      if (endLat !== null && endLng !== null) {
        const last = routeCoords[routeCoords.length - 1];
        if (!last || last.latitude !== endLat || last.longitude !== endLng) {
          routeCoords.push({ latitude: endLat, longitude: endLng });
        }
      }

      let totalDist = 0;
      if (routeCoords.length > 1) {
        for (let i = 0; i < routeCoords.length - 1; i++) {
          const segmentDist = calculateDistance(routeCoords[i].latitude, routeCoords[i].longitude, routeCoords[i + 1].latitude, routeCoords[i + 1].longitude);
          if (segmentDist > 0.01) {
            totalDist += segmentDist;
          }
        }
      }

      if (totalDist > 0) {
        const finalDist = parseFloat(totalDist.toFixed(2));
        setKmTravelled(finalDist.toString());
        const rate = parseFloat(taRateStr) || 0;
        setAmount((finalDist * rate).toFixed(0));
        setRemarks(`Auto-fill: ${finalDist} km calculated from visits & attendance. TA calculated at ₹${rate.toFixed(2)}/km.`);
      } else {
        setKmTravelled('');
        setAmount('');
        setRemarks('');
      }
    } catch (e) {
      console.log('Failed to dynamic GPS distance lookup:', e);
    }
  };

  const pickImage = async (useCamera: boolean) => {
    try {
      let permissionResult;
      if (useCamera) {
        permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      } else {
        permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      }

      if (!permissionResult.granted) {
        customAlert('Permission Denied', `You need to grant ${useCamera ? 'camera' : 'gallery'} permission to pick a receipt.`);
        return;
      }

      let pickerResult;
      if (useCamera) {
        pickerResult = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          quality: 0.2, // Compress images directly at picker level
          base64: true, // Capture base64 so we can store it in the backend without a separate upload endpoint
        });
      } else {
        pickerResult = await ImagePicker.launchImageLibraryAsync({
          allowsEditing: true,
          quality: 0.2, // Compress images directly at picker level
          base64: true, // Capture base64 so we can store it in the backend without a separate upload endpoint
        });
      }

      if (!pickerResult.canceled && pickerResult.assets && pickerResult.assets.length > 0) {
        const asset = pickerResult.assets[0];
        
        // 1. Validation: File size (Max 5MB)
        if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
          customAlert('⚠️ File Too Large', 'The selected file exceeds the 5 MB size limit.');
          return;
        }

        // 2. Validation: File type (jpg, jpeg, png, pdf)
        const uri = asset.uri;
        const filename = asset.fileName || uri.split('/').pop() || 'receipt.jpg';
        const fileExtension = filename.split('.').pop()?.toLowerCase();
        const mimeType = asset.mimeType || (fileExtension === 'pdf' ? 'application/pdf' : fileExtension === 'png' ? 'image/png' : 'image/jpeg');
        
        const allowedExtensions = ['jpg', 'jpeg', 'png', 'pdf'];
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'application/pdf'];
        
        const isExtAllowed = fileExtension && allowedExtensions.includes(fileExtension);
        const isMimeAllowed = mimeType && allowedMimeTypes.includes(mimeType);

        if (!isExtAllowed && !isMimeAllowed) {
          customAlert('⚠️ Invalid File Type', 'Only JPG, JPEG, PNG, and PDF files are allowed.');
          return;
        }

        // Check duplicate receipt (same filename or local URI)
        const isDuplicate = claims.some(c => c.receiptRef === filename || c.receiptRef === uri);
        if (isDuplicate) {
          customAlert('⚠️ Duplicate Receipt', 'This receipt file has already been uploaded for another claim.');
          return;
        }

        setSelectedImage(uri);
        setSelectedImageBase64(asset.base64 ?? null);
        setSelectedImageMimeType(mimeType);
      }
    } catch (e) {
      console.log('Error picking image:', e);
      customAlert('Error', 'Failed to pick receipt image.');
    }
  };

  const handleCategorySelect = (cat: typeof category) => {
    setCategory(cat);
    if (cat === 'Daily Allowance (DA)') {
      setAmount(configSettings.daAmount.toString());
      setKmTravelled('');
      setRemarks(`HQ Daily Allowance base standard rate (₹${configSettings.daAmount})`);
    } else if (cat !== 'Travel Allowance (TA)') {
      setAmount('');
      setKmTravelled('');
      setRemarks('');
    }
  };

  const handleAddClaim = async () => {
    if (isSaving || uploadingReceipt) return;

    // ── Date Validation ──
    const parts = selectedDate.split('-');
    if (parts.length !== 3) {
      customAlert('⚠️ Invalid Date', 'Please select a valid expense date.');
      return;
    }
    const expenseDateObj = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
    if (isNaN(expenseDateObj.getTime())) {
      customAlert('⚠️ Invalid Date', 'The selected date is not valid. Please choose again.');
      return;
    }
    if (expenseDateObj > new Date()) {
      customAlert('⚠️ Future Date', 'Expense date cannot be a future date.');
      return;
    }

    // ── Amount Validation ──
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      customAlert('⚠️ Invalid Amount', 'Please enter a valid expense claim amount greater than ₹0.');
      return;
    }
    if (parsedAmount > configSettings.maxLimit) {
      customAlert('⚠️ Amount Too High', `A single expense claim cannot exceed ₹${configSettings.maxLimit.toLocaleString()}. Please contact your manager.`);
      return;
    }

    // ── Remarks Validation ──
    const cleanRemarks = remarks.trim();
    if (!cleanRemarks || cleanRemarks.length < 10) {
      customAlert('⚠️ Remarks Required', 'Please provide at least 10 characters of remarks describing the expense purpose.');
      return;
    }
    if (!/[a-zA-Z]/.test(cleanRemarks)) {
      customAlert('⚠️ Invalid Remarks', 'Remarks must contain meaningful text, not just numbers or symbols.');
      return;
    }

    // ── Receipt mandatory for Hotel/Toll ──
    const isReceiptMandatory = (category === 'Hotel / Lodging' || category === 'Toll / Parking');
    if (isReceiptMandatory && !selectedImage) {
      customAlert('⚠️ Receipt Required', `A receipt image upload is mandatory for ${category} claims.`);
      return;
    }

    // ── Duplicate claim check for same date + category ──
    const duplicate = claims.find(
      c => c.date === selectedDate && c.category === category && String(c.status).toUpperCase() !== 'REJECTED'
    );
    if (duplicate) {
      customAlert('⚠️ Duplicate Claim', `You have already submitted a ${category} claim for ${selectedDate}. Please check your history.`);
      return;
    }

    setIsSaving(true);
    setUploadingReceipt(true);
    try {
      let finalReceiptUrl = 'N/A';

      if (selectedImage) {
        try {
          // Encode the receipt image to a base64 data URI and save it directly in
          // the backend's billUrl / receiptUrl field — no separate upload server needed.
          finalReceiptUrl = await encodeReceiptToDataUrl(
            selectedImage,
            selectedImageMimeType || 'image/jpeg',
            selectedImageBase64
          );
        } catch (uploadErr: any) {
          console.error('Receipt encode failed:', uploadErr);
          customAlert('❌ Receipt Error', uploadErr?.message || 'Failed to process receipt image. Please try again.');
          setIsSaving(false);
          setUploadingReceipt(false);
          return;
        }
      }

      const isoDate = expenseDateObj.toISOString();

      await createExpense(
        category,
        parsedAmount,
        isoDate,
        cleanRemarks,
        finalReceiptUrl
      );

      // Reload from backend — backend is now the source of truth
      await loadClaims();

      // Reset form completely
      setAmount('');
      setKmTravelled('');
      setSelectedImage(null);
      setSelectedImageBase64(null);
      setSelectedImageMimeType(undefined);
      setRemarks('');
      setCategory('Travel Allowance (TA)');
      customAlert('✅ Success', 'Expense claim submitted successfully for manager approval.');
    } catch (err: any) {
      console.log('Expense Claim Submission Error:', err.response?.data || err.message);
      const status = err?.response?.status;
      const errorMsg = err?.response?.data?.message || err?.response?.data?.error || err?.message || 'Could not submit expense claim.';
      if (status === 401) {
        customAlert('❌ Unauthorized', 'Your session has expired. Please log in again.');
      } else if (status === 409) {
        customAlert('❌ Duplicate', 'This expense has already been submitted.');
      } else if (status === 422) {
        customAlert('❌ Validation Failed', 'Server rejected the data. Please check all fields and try again.');
      } else if (status >= 500) {
        customAlert('❌ Server Error', 'The server is unavailable. Please try again later.');
      } else {
        customAlert('❌ Failed to Save', `${errorMsg}\n\nPlease check your input and try again.`);
      }
    } finally {
      setIsSaving(false);
      setUploadingReceipt(false);
    }
  };

  const customAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const getWebDateFormat = (dateStr: string) => {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`; // YYYY-MM-DD
    }
    return dateStr;
  };

  const handleDateChangeWeb = (val: string) => {
    if (!val) return;
    const parts = val.split('-');
    if (parts.length === 3) {
      setSelectedDate(`${parts[2]}-${parts[1]}-${parts[0]}`); // DD-MM-YYYY
    }
  };

  const parseDateString = (dateStr: string): Date => {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    }
    return new Date();
  };

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
          <Text style={styles.backButtonText}>⬅️ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>💵 Expense Claims</Text>
        <Text style={styles.headerSubtitle}>Claim travel allowance (TA) & daily allowance (DA)</Text>
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loaderText}>Loading expense claims...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadClaims}>
            <Text style={styles.retryButtonText}>🔄 Retry Loading Expenses</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* Metrics Row */}
          <View style={styles.metricsRow}>
            <View style={[styles.metricCard, { borderLeftColor: '#4F46E5' }]}>
              <Text style={styles.metricVal}>₹{totals.claimed.toLocaleString()}</Text>
              <Text style={styles.metricLabel}>Total Claimed</Text>
            </View>
            <View style={[styles.metricCard, { borderLeftColor: '#10B981' }]}>
              <Text style={[styles.metricVal, { color: '#059669' }]}>₹{totals.approved.toLocaleString()}</Text>
              <Text style={styles.metricLabel}>Approved</Text>
            </View>
            <View style={[styles.metricCard, { borderLeftColor: '#F59E0B' }]}>
              <Text style={[styles.metricVal, { color: '#D97706' }]}>₹{totals.pending.toLocaleString()}</Text>
              <Text style={styles.metricLabel}>Pending Approval</Text>
            </View>
          </View>

          <KeyboardAvoidingView 
            style={{ flex: 1 }} 
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <ScrollView 
              ref={scrollViewRef}
              contentContainerStyle={styles.scrollContent}
            >
              {/* Form Container */}
              <Text style={styles.sectionTitle}>Submit New Expense Claim</Text>
              <View style={styles.formCard}>
                {/* Date Picker */}
                <Text style={styles.formLabel}>Expense Date:</Text>
                {Platform.OS === 'web' ? (
                  <input
                    type="date"
                    value={getWebDateFormat(selectedDate)}
                    onChange={(e) => handleDateChangeWeb(e.target.value)}
                    style={webInputStyle}
                  />
                ) : (
                  <TouchableOpacity
                    style={styles.datePickerBtn}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Text style={styles.datePickerBtnText}>{selectedDate}</Text>
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

                {/* Category Dropdown Selector */}
                <Text style={[styles.formLabel, { marginTop: 12 }]}>Expense Category:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                  {([
                    'Travel Allowance (TA)',
                    'Daily Allowance (DA)',
                    'Hotel / Lodging',
                    'Toll / Parking',
                    'Miscellaneous',
                  ] as const).map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.categoryPill, category === cat && styles.activePill]}
                      onPress={() => handleCategorySelect(cat)}
                    >
                      <Text style={[styles.pillText, category === cat && styles.activePillText]}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Conditional inputs */}
                {category === 'Travel Allowance (TA)' && (
                  <>
                    <View style={{ marginTop: 12 }}>
                      <Text style={styles.formLabel}>Rate per km (₹):</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. 5.00"
                        keyboardType="numeric"
                        value={taRateStr}
                        onChangeText={(val) => {
                          setTaRateStr(val);
                          const parsedRate = parseFloat(val) || 0;
                          const parsedKm = parseFloat(kmTravelled) || 0;
                          setAmount((parsedKm * parsedRate).toFixed(0));
                          if (remarks.includes('Auto-fill')) {
                            setRemarks(`Auto-fill: ${parsedKm} km calculated from visits & attendance. TA calculated at ₹${parsedRate.toFixed(2)}/km.`);
                          }
                        }}
                      />
                    </View>
                    <View style={{ marginTop: 12 }}>
                      <Text style={styles.formLabel}>Kilometers Travelled:</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. 24"
                        keyboardType="numeric"
                        value={kmTravelled}
                        onChangeText={(val) => {
                          setKmTravelled(val);
                          const parsedKm = parseFloat(val) || 0;
                          const parsedRate = parseFloat(taRateStr) || 0;
                          setAmount((parsedKm * parsedRate).toFixed(0));
                          if (remarks.includes('Auto-fill')) {
                            setRemarks(`Auto-fill: ${parsedKm} km calculated from visits & attendance. TA calculated at ₹${parsedRate.toFixed(2)}/km.`);
                          }
                        }}
                      />
                    </View>
                  </>
                )}

                <Text style={[styles.formLabel, { marginTop: 12 }]}>Amount (₹):</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Claim amount"
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={setAmount}
                  editable={category !== 'Travel Allowance (TA)' && category !== 'Daily Allowance (DA)'}
                />

                {/* Production Receipt Image Upload */}
                <Text style={[styles.formLabel, { marginTop: 12 }]}>Upload Receipt Document:</Text>
                <View style={styles.imagePickerContainer}>
                  <View style={styles.pickerButtonsRow}>
                    <TouchableOpacity style={styles.imagePickerBtn} onPress={() => pickImage(false)}>
                      <Text style={styles.imagePickerBtnText}>🖼️ Choose Gallery</Text>
                    </TouchableOpacity>
                    {Platform.OS !== 'web' && (
                      <TouchableOpacity style={styles.imagePickerBtn} onPress={() => pickImage(true)}>
                        <Text style={styles.imagePickerBtnText}>📷 Take Photo</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  
                  {selectedImage ? (
                    <View style={styles.imagePreviewContainer}>
                      <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
                      <View style={styles.imageInfo}>
                        <Text style={styles.imageNameText} numberOfLines={1}>
                          {selectedImage.split('/').pop() || 'selected_receipt.jpg'}
                        </Text>
                        <TouchableOpacity style={styles.removeImageBtn} onPress={() => setSelectedImage(null)}>
                          <Text style={styles.removeImageText}>❌ Remove File</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.emptyImagePlaceholder}>
                      <Text style={styles.placeholderImageText}>
                        No receipt selected. Allowed types: JPG, JPEG, PNG, PDF (Max 5MB).
                      </Text>
                    </View>
                  )}
                </View>

                <Text style={[styles.formLabel, { marginTop: 12 }]}>Additional Remarks / Objectives:</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Enter purpose of trip/expense"
                  multiline
                  numberOfLines={3}
                  value={remarks}
                  onChangeText={setRemarks}
                />

                <TouchableOpacity
                  style={[
                    styles.submitBtn,
                    (isSaving || uploadingReceipt) && { opacity: 0.6 },
                  ]}
                  onPress={handleAddClaim}
                  disabled={isSaving || uploadingReceipt}
                >
                  {isSaving || uploadingReceipt ? (
                    <View style={styles.progressBtnRow}>
                      <ActivityIndicator color="#fff" size="small" />
                      <Text style={styles.progressBtnText}>
                        {uploadingReceipt ? 'Uploading Receipt...' : 'Submitting Claim...'}
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.submitBtnText}>📎 Submit Expense Claim</Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* Claims Logs */}
              <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Claims Submission History</Text>
              {claims.length > 0 ? (
                <View style={styles.historyList}>
                  {claims.map((claim) => {
                    let statusColor = '#94A3B8';
                    let statusBg = '#F1F5F9';
                    const claimStatusUpper = (claim.status || '').toUpperCase();
                    if (claimStatusUpper === 'APPROVED') {
                      statusColor = '#10B981';
                      statusBg = '#D1FAE5';
                    } else if (claimStatusUpper === 'REJECTED') {
                      statusColor = '#EF4444';
                      statusBg = '#FEE2E2';
                    }

                    const hasValidReceipt = claim.receiptRef && claim.receiptRef !== 'N/A' && claim.receiptRef !== 'null';

                    return (
                      <View key={claim.id} style={styles.claimCard}>
                        <View style={styles.cardHeader}>
                          <View>
                            <Text style={styles.claimCategory}>{claim.category}</Text>
                            <Text style={styles.claimDate}>📅 Date: {claim.date}</Text>
                          </View>
                          <Text style={styles.claimAmount}>₹{claim.amount}</Text>
                        </View>
                        <View style={styles.cardDivider} />
                        <Text style={styles.claimDetailText}>📝 Remarks: {claim.remarks}</Text>
                        
                        <View style={styles.receiptDetailRow}>
                          <Text style={styles.claimDetailText}>📄 Receipt: </Text>
                          {hasValidReceipt ? (
                            (() => {
                              const isDataUri = claim.receiptRef.startsWith('data:');
                              const label = isDataUri
                                ? '🖼️ View Uploaded Receipt Image'
                                : (claim.receiptRef.split('/').pop() || 'View Receipt Document');
                              return (
                                <TouchableOpacity onPress={() => {
                                  if (Platform.OS === 'web') {
                                    if (isDataUri) {
                                      // Open base64 image in a new tab
                                      const win = window.open();
                                      if (win) {
                                        win.document.write(`<img src="${claim.receiptRef}" style="max-width:100%" />`);
                                      }
                                    } else {
                                      window.open(claim.receiptRef, '_blank');
                                    }
                                  } else {
                                    Alert.alert('Receipt', isDataUri ? 'Receipt image saved in this claim.' : claim.receiptRef);
                                  }
                                }}>
                                  <Text style={styles.receiptLinkText} numberOfLines={1}>{label}</Text>
                                </TouchableOpacity>
                              );
                            })()
                          ) : (
                            <Text style={styles.noReceiptText}>No Receipt Uploaded</Text>
                          )}
                        </View>
                        
                        {claim.kmTravelled && (
                          <Text style={styles.claimDetailText}>🚗 Distance: {claim.kmTravelled} km</Text>
                        )}

                        <View style={styles.statusRow}>
                          <View
                            style={[styles.statusBadge, { backgroundColor: statusBg }]}
                          >
                            <Text style={[styles.statusText, { color: statusColor }]}>
                              {claim.status}
                            </Text>
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>
              ) : (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>No expense claims filed yet.</Text>
                </View>
              )}
              <View style={{ height: 40 }} />
            </ScrollView>
          </KeyboardAvoidingView>
        </>
      )}
    </View>
  );
};

export default ExpenseClaimScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#4F46E5',
    paddingTop: 60,
    paddingBottom: 25,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 15,
    top: 50,
    zIndex: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  backButtonText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#E0E7FF',
    textAlign: 'center',
    marginTop: 6,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
    marginHorizontal: 20,
    marginTop: -15,
    zIndex: 10,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderLeftWidth: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 3,
  },
  metricVal: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  metricLabel: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 3,
    fontWeight: '600',
    textAlign: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 280,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 10,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#475569',
    marginBottom: 6,
  },
  datePickerBtn: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#F8FAFC',
  },
  datePickerBtnText: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: 'bold',
  },
  categoryScroll: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  categoryPill: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#EEF2F6',
    marginRight: 6,
  },
  activePill: {
    backgroundColor: '#4F46E5',
  },
  pillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  activePillText: {
    color: '#FFFFFF',
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    backgroundColor: '#F8FAFC',
    color: '#1E293B',
  },
  imagePickerContainer: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#F8FAFC',
  },
  pickerButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  imagePickerBtn: {
    flex: 1,
    backgroundColor: '#EEF2F6',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    paddingVertical: 8,
    alignItems: 'center',
  },
  imagePickerBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  imagePreviewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 6,
    padding: 8,
    gap: 10,
  },
  imagePreview: {
    width: 50,
    height: 50,
    borderRadius: 4,
    backgroundColor: '#F1F5F9',
  },
  imageInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  imageNameText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
  },
  removeImageBtn: {
    marginTop: 4,
  },
  removeImageText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#EF4444',
  },
  emptyImagePlaceholder: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderImageText: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 16,
  },
  textArea: {
    height: 70,
    textAlignVertical: 'top',
  },
  submitBtn: {
    backgroundColor: '#4F46E5',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  progressBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  historyList: {
    gap: 10,
  },
  claimCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  claimCategory: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  claimDate: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 3,
  },
  claimAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4F46E5',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },
  claimDetailText: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
  },
  receiptDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  receiptLinkText: {
    fontSize: 12,
    color: '#4F46E5',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  noReceiptText: {
    fontSize: 12,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 10,
  },
  statusBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  loaderContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    marginVertical: 20,
    marginHorizontal: 20,
  },
  loaderText: {
    marginTop: 15,
    fontSize: 14,
    color: '#666',
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    borderColor: '#FFCDD2',
    borderWidth: 1,
    borderRadius: 16,
    padding: 24,
    marginVertical: 15,
    marginHorizontal: 20,
    alignItems: 'center',
  },
  errorText: {
    color: '#C62828',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#C62828',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
});