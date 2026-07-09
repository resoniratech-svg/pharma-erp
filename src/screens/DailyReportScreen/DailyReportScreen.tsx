import { createDailyReport } from '../../services/dailyReportService';
import { getDoctorVisitsByMr } from '../../services/doctorService';
import { getChemistVisitsByMr } from '../../services/chemistService';
import { getAttendanceLogs } from '../../services/attendanceService';
import { getTourPlansByMr } from '../../services/tourPlanService';
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
  ActivityIndicator,
  KeyboardAvoidingView,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';


const safeJsonParse = (data: string | null, fallback: any) => {
  if (!data) return fallback;
  try {
    return JSON.parse(data);
  } catch (err) {
    console.log('safeJsonParse error in DailyReportScreen:', err);
    return fallback;
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
  if (parsedLat < -90 || parsedLat > 90 || parsedLng < -180 || parsedLng > 180) return null;

  return { latitude: parsedLat, longitude: parsedLng };
};

const DailyReportScreen = () => {
  const [docCount, setDocCount] = useState(0);
  const [chemistCount, setChemistCount] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [totalSales, setTotalSales] = useState(0);
  const [attendanceStatus, setAttendanceStatus] = useState('Absent');
  const [checkInTime, setCheckInTime] = useState('');
  const [upcomingFollowUps, setUpcomingFollowUps] = useState(0);
  const [endTime, setEndTime] = useState('');
  const [todayTourTerritory, setTodayTourTerritory] = useState('Field Work (Ad-hoc)');
  const [totalKmTravelled, setTotalKmTravelled] = useState(0);

  // Form states
  const [remarks, setRemarks] = useState('');
  const [competitorActivity, setCompetitorActivity] = useState('');
  const [approvalStatus, setApprovalStatus] = useState('Pending Approval');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [reportGenerated, setReportGenerated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const scrollViewRef = React.useRef<ScrollView>(null);

  // Web-safe Alert Helper
  const customAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      loadDailyMetrics();
    }
  }, [isFocused]);



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

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const formatTime12h = (timeStr: string) => {
    if (!timeStr || timeStr === 'N/A' || timeStr === 'Active') return timeStr;
    if (timeStr.toLowerCase().includes('am') || timeStr.toLowerCase().includes('pm')) {
      return timeStr;
    }
    try {
      const date = new Date(timeStr);
      if (isNaN(date.getTime())) return timeStr;
      let hours = date.getHours();
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'pm' : 'am';
      hours = hours % 12;
      hours = hours ? hours : 12;
      return `${hours}:${minutes} ${ampm}`;
    } catch (e) {
      return timeStr;
    }
  };

  const calculateDuration = (start: string, end: string) => {
    if (!start || !end || start === 'N/A' || end === 'N/A' || end === 'Active') return '';
    try {
      let startDate = new Date(start);
      let endDate = new Date(end);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        const parseTimeStr = (timeStr: string) => {
          const dateAttempt = new Date(timeStr);
          if (!isNaN(dateAttempt.getTime())) {
            return dateAttempt.getHours() * 60 + dateAttempt.getMinutes();
          }
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
        const startMins = parseTimeStr(start);
        const endMins = parseTimeStr(end);
        let diff = endMins - startMins;
        if (diff < 0) diff += 24 * 60; 
        const hrs = Math.floor(diff / 60);
        const mins = diff % 60;
        return ` (${hrs}h ${mins}m)`;
      }

      const diffMs = endDate.getTime() - startDate.getTime();
      if (diffMs < 0) return '';
      const totalMins = Math.floor(diffMs / 60000);
      const hrs = Math.floor(totalMins / 60);
      const mins = totalMins % 60;
      return ` (${hrs}h ${mins}m)`;
    } catch (e) {
      return '';
    }
  };

  const loadDailyMetrics = async () => {
    setLoading(true);
    setError(null);
    try {
      const today = new Date();

      // 1. Get Doctor Visits & Follow Ups from API (with AsyncStorage fallback)
      let allDocList: any[] = [];
      try {
        allDocList = await getDoctorVisitsByMr();
        if (!Array.isArray(allDocList)) allDocList = [];
      } catch (err) {
        console.log('Failed to fetch doctor visits from API, falling back to AsyncStorage:', err);
        const docData = await AsyncStorage.getItem('@doctor_visits');
        allDocList = safeJsonParse(docData, []);
      }
      const docList = allDocList.filter((v: any) => checkSameDay(today, v.visitDate || v.date || v.createdAt || v.visit_date));
      setDocCount(docList.length);

      const followUpCount = docList.filter((v: any) => {
        const fUp = v.nextFollowUp || v.followUpDate;
        return fUp && fUp.trim() !== '';
      }).length;
      setUpcomingFollowUps(followUpCount);

      // 2. Get Chemist Visits from API (with AsyncStorage fallback)
      let allChemistList: any[] = [];
      try {
        allChemistList = await getChemistVisitsByMr();
        if (!Array.isArray(allChemistList)) allChemistList = [];
      } catch (err) {
        console.log('Failed to fetch chemist visits from API, falling back to AsyncStorage:', err);
        const chemistData = await AsyncStorage.getItem('@chemist_visits');
        allChemistList = safeJsonParse(chemistData, []);
      }
      const chemistList = allChemistList.filter((v: any) => checkSameDay(today, v.visitDate || v.date || v.createdAt || v.visit_date));
      setChemistCount(chemistList.length);

      // 3. Get Orders & Calculate Sales (Keep AsyncStorage until orders API is ready)
      const ordersData = await AsyncStorage.getItem('@orders');
      const allOrdersList = safeJsonParse(ordersData, []);
      const ordersList = allOrdersList.filter((o: any) => checkSameDay(today, o.dateFormatted || o.date || o.createdAt));
      setOrderCount(ordersList.length);

      // Sum values from both orders and chemist visit values
      const chemistSalesSum = chemistList.reduce((sum: number, item: any) => {
        return sum + (parseFloat(item.orderValue) || 0);
      }, 0);

      const ordersSalesSum = ordersList.reduce((sum: number, item: any) => {
        return sum + (parseFloat(item.totalAmount) || 0);
      }, 0);

      setTotalSales(chemistSalesSum + ordersSalesSum);

      // 3.5 Get Tour Plan / Beat for Today (with fallback)
      let todayTour = 'Field Work (Ad-hoc)';
      try {
        const allTourPlans = await getTourPlansByMr();
        const activeTour = Array.isArray(allTourPlans) ? allTourPlans.find((plan: any) => 
          checkSameDay(today, plan.tourDate || plan.date || plan.createdAt)
        ) : null;
        if (activeTour && activeTour.territory) {
          todayTour = activeTour.territory;
        }
      } catch (err) {
        console.log('Failed to fetch tour plans for DailyReport:', err);
      }
      setTodayTourTerritory(todayTour);

      // 4. Get Attendance Status from API (with AsyncStorage fallback)
      let logsList: any[] = [];
      try {
        logsList = await getAttendanceLogs();
        if (!Array.isArray(logsList)) logsList = [];
      } catch (err) {
        console.log('Failed to fetch attendance logs from API, falling back to AsyncStorage:', err);
        const storedLogs = await AsyncStorage.getItem('@attendance_logs');
        logsList = safeJsonParse(storedLogs, []);
      }

      const todayLog = logsList.find((log: any) => checkSameDay(today, log.date || log.checkInTime || log.check_in_time || log.createdAt));

      let statusStr = 'Absent';
      let checkInStr = '';
      let endStr = '';

      let startLat: number | null = null;
      let startLng: number | null = null;
      let endLat: number | null = null;
      let endLng: number | null = null;
      let checkInCoords: { latitude: number; longitude: number } | null = null;
      let checkOutCoords: { latitude: number; longitude: number } | null = null;

      const isLogPresent = todayLog && (!todayLog.status || 
                            String(todayLog.status).toUpperCase() === 'PRESENT' || 
                            String(todayLog.status).toUpperCase() === 'APPROVED');

      if (isLogPresent) {
        statusStr = 'Present';
        checkInStr = todayLog.checkInTime || todayLog.check_in_time || '';
        
        const checkOutVal = todayLog.checkOutTime || todayLog.check_out_time;
        if (checkOutVal && checkOutVal !== 'Active') {
          endStr = checkOutVal;
        } else {
          endStr = 'Active';
        }
        
        // Parse Check-in & Check-out Coordinates dynamically from API
        checkInCoords = extractCoords(todayLog, 'checkin');
        checkOutCoords = extractCoords(todayLog, 'checkout');
        
        if (checkInCoords) {
          startLat = checkInCoords.latitude;
          startLng = checkInCoords.longitude;
        }
        if (checkOutCoords) {
          endLat = checkOutCoords.latitude;
          endLng = checkOutCoords.longitude;
        }
      } else {
        // Fallback to AsyncStorage if API fails or returns no log
        const localCheckedIn = await AsyncStorage.getItem('@checked_in');
        const localCheckInTime = await AsyncStorage.getItem('@check_in_time');
        const localCheckInDate = await AsyncStorage.getItem('@attendance_date');
        
        if (localCheckedIn === 'true' && localCheckInTime && localCheckInDate && checkSameDay(today, localCheckInDate)) {
          statusStr = 'Present';
          checkInStr = localCheckInTime;
          endStr = 'Active';
          
          const localLat = await AsyncStorage.getItem('@check_in_lat');
          const localLng = await AsyncStorage.getItem('@check_in_lng');
          if (localLat && localLng) {
            startLat = parseFloat(localLat);
            startLng = parseFloat(localLng);
            checkInCoords = { latitude: startLat, longitude: startLng };
          }
        } else {
          // Fallback: if they logged any doctor/chemist visits or orders today, they were present!
          if (docList.length > 0 || chemistList.length > 0 || ordersList.length > 0) {
            statusStr = 'Present';
            checkInStr = 'N/A';
            endStr = 'N/A';
          } else {
            statusStr = 'Absent';
          }
        }
      }

      // ─── BUSINESS ROUTE DISTANCE CALCULATION ───
      let kmStr = 0;
      if (statusStr === 'Present') {
        const routePoints: { latitude: number; longitude: number; time: number; seq: number; name: string }[] = [];
        let sequenceCounter = 0;

        // 1. Gather Doctor Visit coordinates using API-compliant keys
        docList.forEach((v: any) => {
          const coords = extractCoords(v, 'visit');
          if (coords) {
            const timeVal = v.visitDate ? new Date(v.visitDate).getTime() : 
                           (v.date ? new Date(v.date).getTime() : 
                           (v.createdAt ? new Date(v.createdAt).getTime() : 0));
            routePoints.push({ 
              ...coords, 
              time: timeVal, 
              seq: sequenceCounter++,
              name: `Doctor: ${v.doctorName || v.name || 'Unnamed'}`
            });
          }
        });

        // 2. Gather Chemist Visit coordinates using API-compliant keys
        chemistList.forEach((v: any) => {
          const coords = extractCoords(v, 'visit');
          if (coords) {
            const timeVal = v.visitDate ? new Date(v.visitDate).getTime() : 
                           (v.date ? new Date(v.date).getTime() : 
                           (v.createdAt ? new Date(v.createdAt).getTime() : 0));
            routePoints.push({ 
              ...coords, 
              time: timeVal, 
              seq: sequenceCounter++,
              name: `Chemist: ${v.chemistName || v.shopName || v.name || 'Unnamed'}`
            });
          }
        });

        // Sort visits chronologically (prefer parsed timestamp, fall back to stable logging order)
        routePoints.sort((a, b) => {
          if (a.time !== b.time) {
            return a.time - b.time;
          }
          return a.seq - b.seq;
        });

        // Compile complete route coordinates: Check-in -> Visits -> Check-out
        const routeCoords: { latitude: number; longitude: number; name: string }[] = [];
        
        if (startLat !== null && startLng !== null) {
          routeCoords.push({ latitude: startLat, longitude: startLng, name: 'Attendance Check-In' });
        }
        routePoints.forEach(pt => {
          const last = routeCoords[routeCoords.length - 1];
          if (!last || last.latitude !== pt.latitude || last.longitude !== pt.longitude) {
            routeCoords.push({ latitude: pt.latitude, longitude: pt.longitude, name: pt.name });
          }
        });
        if (endLat !== null && endLng !== null) {
          const last = routeCoords[routeCoords.length - 1];
          if (!last || last.latitude !== endLat || last.longitude !== endLng) {
            routeCoords.push({ latitude: endLat, longitude: endLng, name: 'Attendance Check-Out' });
          }
        }

        // --- DETAILED DEBUGGING COORDINATES PRINT ---
        console.log("=== DAILY REPORT COORDINATES DIAGNOSTICS ===");
        console.log("1. ATTENDANCE CHECK-IN:", checkInCoords ? `${checkInCoords.latitude}, ${checkInCoords.longitude}` : "N/A");
        
        console.log("2. DOCTOR VISITS:");
        docList.forEach((d: any, idx: number) => {
          const c = extractCoords(d, 'visit');
          console.log(`   [Doc #${idx + 1}] ID: ${d.id || d._id || 'N/A'}, Name: ${d.doctorName || d.name || 'N/A'}, Coords: ${c ? `${c.latitude}, ${c.longitude}` : 'N/A'}`);
        });

        console.log("3. CHEMIST VISITS:");
        chemistList.forEach((c: any, idx: number) => {
          const coords = extractCoords(c, 'visit');
          console.log(`   [Chemist #${idx + 1}] ID: ${c.id || c._id || 'N/A'}, Name: ${c.chemistName || c.shopName || c.name || 'N/A'}, Coords: ${coords ? `${coords.latitude}, ${coords.longitude}` : 'N/A'}`);
        });

        console.log("4. ATTENDANCE CHECK-OUT:", checkOutCoords ? `${checkOutCoords.latitude}, ${checkOutCoords.longitude}` : "N/A");
        console.log("5. FINAL COMPILED ROUTE:", routeCoords.map(pt => `${pt.name} (${pt.latitude}, ${pt.longitude})`));

        // Calculate cumulative distance, printing each individual segment
        console.log("6. INDIVIDUAL ROUTE SEGMENTS:");
        let totalDist = 0;
        if (routeCoords.length > 1) {
          for (let i = 0; i < routeCoords.length - 1; i++) {
            const pA = routeCoords[i];
            const pB = routeCoords[i + 1];
            const segmentDist = calculateDistance(pA.latitude, pA.longitude, pB.latitude, pB.longitude);
            
            console.log(`   Segment [${pA.name}] -> [${pB.name}] = ${segmentDist.toFixed(4)} km`);
            
            // Ignore drift under 10m
            if (segmentDist > 0.01) {
              totalDist += segmentDist;
            }
          }
        }
        console.log(`7. TOTAL HAVERSINE DISTANCE CALCULATED: ${totalDist.toFixed(2)} km`);
        console.log("============================================");

        // Show "Distance not available" if fewer than 2 valid points exist or total distance is 0
        if (routeCoords.length < 2) {
          kmStr = 0;
        } else {
          kmStr = parseFloat(totalDist.toFixed(2));
        }
      }

      setAttendanceStatus(statusStr);
      setCheckInTime(checkInStr);
      setEndTime(endStr);
      setTotalKmTravelled(kmStr);

      // Check if report is already generated for today
      const savedReport = await AsyncStorage.getItem('@daily_report_submitted');
      if (savedReport === new Date().toDateString()) {
        setReportGenerated(true);
        customAlert('Already Submitted', 'You have already submitted today\'s daily work report.');
        const reportDataStr = await AsyncStorage.getItem('@daily_report_data');
        if (reportDataStr) {
          const reportData = safeJsonParse(reportDataStr, null);
          if (reportData) {
            setRemarks(reportData.remarks || '');
            setCompetitorActivity(reportData.competitorActivity || '');
            setApprovalStatus(reportData.status || 'Pending Approval');
          }
        }
      } else {
        setReportGenerated(false);
        await AsyncStorage.removeItem('@daily_report_submitted');
        await AsyncStorage.removeItem('@daily_report_data');
      }

    } catch (err) {
      console.log('Failed to load metrics for daily report:', err);
      setError('Failed to load daily metrics from storage.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    if (reportGenerated) {
      customAlert('Already Submitted', 'You have already submitted your daily report for today.');
      return;
    }
    if (attendanceStatus === 'Absent') {
      customAlert('Warning', 'You cannot submit a daily report if you have not marked your attendance today.');
      return;
    }

    const cleanRemarks = remarks.trim();
    if (!cleanRemarks) {
      customAlert('Error', 'Please enter daily activity remarks before submitting.');
      return;
    }

    if (cleanRemarks.length < 20) {
      customAlert('Error', 'Daily activity remarks must be at least 20 characters long.');
      return;
    }

    if (cleanRemarks.length > 500) {
      customAlert('Error', 'Daily activity remarks cannot exceed 500 characters.');
      return;
    }

    // Reject repeated character sequences (e.g. aaaaa, 11111, .....)
    const simplifiedRemarks = cleanRemarks.replace(/\s/g, '').toLowerCase();
    if (/^(.)\1+$/.test(simplifiedRemarks) || /^(abc|xyz|test|spam|remarks|qwert|12345|xxxxx)+$/.test(simplifiedRemarks)) {
      customAlert('Error', 'Please write a meaningful description of today\'s activities.');
      return;
    }

    const cleanCompetitor = competitorActivity.trim();
    if (cleanCompetitor && cleanCompetitor.length > 500) {
      customAlert('Error', 'Competitor activity notes cannot exceed 500 characters.');
      return;
    }

    // Write cleaned/trimmed values back to state so PDF & Share use clean strings consistently
    setRemarks(cleanRemarks);
    setCompetitorActivity(cleanCompetitor);

    setIsSubmitting(true);

    const avgOrderValue = orderCount > 0 ? totalSales / orderCount : 0;

    const reportData = {
      date: new Date().toDateString(),
      doctorVisits: docCount,
      chemistVisits: chemistCount,
      ordersPlaced: orderCount,
      totalSales: totalSales,
      avgOrderValue: avgOrderValue,
      attendance: attendanceStatus,
      checkInTime: checkInTime,
      endTime: endTime,
      totalKmTravelled: totalKmTravelled,
      upcomingFollowUps: upcomingFollowUps,
      remarks: cleanRemarks,
      competitorActivity: cleanCompetitor,
      status: 'Pending Approval',
      submittedAt: new Date().toLocaleTimeString(),
    };

    try {
      const reportDate = new Date().toISOString();

      await createDailyReport(
        reportDate,
        docCount,
        chemistCount,
        0, // samplesDistributed
        totalSales, // ordersCollected
        cleanRemarks
      );

      console.log('Daily Report Saved Successfully');
      // Save submission state to storage
      await AsyncStorage.setItem('@daily_report_submitted', new Date().toDateString());
      await AsyncStorage.setItem('@daily_report_data', JSON.stringify(reportData));
      
      setReportGenerated(true);
      setApprovalStatus('Pending Approval');
      customAlert('🎉 Report Submitted!', 'Your daily work report has been successfully compiled and sent to your manager.');
    } catch (error) {
      customAlert('Error', 'Failed to submit the report.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Real PDF Generation logic
  const handleExportPDF = async () => {
    try {
      const htmlContent = `
        <html>
          <head>
            <style>
              body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; }
              .header { text-align: center; border-bottom: 2px solid #43A047; padding-bottom: 20px; margin-bottom: 30px; }
              h1 { color: #2E7D32; margin: 0; font-size: 28px; }
              .subtitle { color: #666; font-size: 16px; margin-top: 5px; }
              .row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #eee; }
              .label { font-weight: bold; color: #555; }
              .value { font-weight: bold; color: #000; }
              .section { margin-top: 30px; background-color: #f9f9f9; padding: 15px; border-radius: 8px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Daily Work Report</h1>
              <div class="subtitle">Generated on ${new Date().toDateString()}</div>
            </div>
            
            <div class="row">
              <span class="label">Attendance Status:</span>
              <span class="value" style="color: ${attendanceStatus === 'Present' ? '#2E7D32' : '#C62828'}">${attendanceStatus}</span>
            </div>
            <div class="row">
              <span class="label">Daily Tour Beat:</span>
              <span class="value">${todayTourTerritory}</span>
            </div>
            <div class="row">
              <span class="label">Distance Travelled:</span>
              <span class="value">${totalKmTravelled > 0 ? `${totalKmTravelled} km` : 'Distance not available'}</span>
            </div>
            <div class="row">
              <span class="label">Doctor Visits:</span>
              <span class="value">${docCount}</span>
            </div>
            <div class="row">
              <span class="label">Chemist Visits:</span>
              <span class="value">${chemistCount}</span>
            </div>
            <div class="row">
              <span class="label">Orders Booked:</span>
              <span class="value">${orderCount}</span>
            </div>
            <div class="row">
              <span class="label">Total Sales:</span>
              <span class="value" style="color: #0D47A1; font-size: 18px;">Rs. ${totalSales.toLocaleString('en-IN')}</span>
            </div>

            <div class="section">
              <span class="label">Remarks:</span><br/>
              <p>${remarks || 'No remarks provided for today.'}</p>
            </div>
            
            <div class="section">
              <span class="label">Competitor Activity:</span><br/>
              <p>${competitorActivity || 'No competitor activity reported.'}</p>
            </div>
          </body>
        </html>
      `;

      if (Platform.OS === 'web') {
        // On web, open a new window to print the HTML content natively
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(htmlContent);
          printWindow.document.close();
          // Let Edge/Chrome render the HTML before triggering the print dialog
          setTimeout(() => {
            printWindow.print();
          }, 300);
        } else {
          customAlert('Popups Blocked', 'Please allow popups to export the PDF report.');
        }
      } else {
        // On mobile, save as PDF and open share dialog
        const { uri } = await Print.printToFileAsync({ html: htmlContent });
        await Sharing.shareAsync(uri, { 
          UTI: '.pdf', 
          mimeType: 'application/pdf',
          dialogTitle: 'Share Daily Report PDF'
        });
      }
    } catch (error) {
      customAlert('Error', 'Failed to generate PDF document.');
    }
  };

  const handleShareReport = async () => {
    try {
      const shareMessage = `📋 *Daily Work Report - ${new Date().toDateString()}*\n\n`
        + `📍 Attendance: ${attendanceStatus}\n`
        + `🗺️ Tour Beat: ${todayTourTerritory}\n`
        + `🚗 Distance: ${totalKmTravelled > 0 ? `${totalKmTravelled} km` : 'Distance not available'}\n`
        + `🩺 Doctors Visited: ${docCount}\n`
        + `💊 Chemists Visited: ${chemistCount}\n`
        + `📦 Orders Booked: ${orderCount}\n`
        + `💰 Total Sales: ₹${totalSales}\n\n`
        + `📝 Remarks: ${remarks || 'None'}\n`
        + `🏢 Competitor Activity: ${competitorActivity || 'None'}`;
        
      import('react-native').then(({ Share }) => {
        Share.share({
          message: shareMessage,
          title: 'Daily Report'
        }).catch(() => {
          customAlert('Error', 'Failed to open share menu');
        });
      });
    } catch (error) {
      customAlert('Error', 'Failed to open share menu');
    }
  };

  const avgOrderValue = orderCount > 0 ? totalSales / orderCount : 0;

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#43A047" />
        <Text style={styles.loaderText}>Compiling daily analytics...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>⚠️ {error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadDailyMetrics}>
          <Text style={styles.retryButtonText}>🔄 Retry Loading Metrics</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isLocked = reportGenerated || isSubmitting;
  console.log("DailyReport States:", { reportGenerated, isSubmitting, isLocked });

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView 
        ref={scrollViewRef}
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 280 }}
        keyboardShouldPersistTaps="handled"
        {...({ className: 'print-report-container' } as any)}
      >
      <Text style={styles.title}>📋 Daily Work Report</Text>

      {reportGenerated ? (
        <View style={styles.successCard} {...{ className: 'no-print' } as any}>
          <Text style={styles.successText}>✅ Report Already Submitted</Text>
          <Text style={styles.successSubtext}>Today's report is saved and locked for changes.</Text>
          
          <View style={styles.statusBadgeRow}>
            <Text style={styles.statusBadgeLabel}>Approval Status:</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>🟡 {approvalStatus}</Text>
            </View>
          </View>

          <View style={styles.mockActionsRow}>
            <TouchableOpacity style={styles.mockActionBtn} onPress={handleExportPDF}>
              <Text style={styles.mockActionBtnText}>📥 Export PDF</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.mockActionBtn} onPress={handleShareReport}>
              <Text style={styles.mockActionBtnText}>📤 Share Report</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={[styles.mockActionBtn, { marginTop: 12, width: '100%', backgroundColor: '#d32f2f', paddingVertical: 12 }]} 
            onPress={async () => {
              await AsyncStorage.removeItem('@daily_report_submitted');
              await AsyncStorage.removeItem('@daily_report_data');
              setReportGenerated(false);
              setRemarks('');
              setCompetitorActivity('');
              customAlert('Reset Success', 'Today\'s daily report submission has been cleared. You can now edit and re-submit.');
            }}
          >
            <Text style={styles.mockActionBtnText}>🔄 Reset Today's Submission (Unlock & Edit)</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <View style={styles.card} {...{ className: 'print-card' } as any}>
        <Text style={styles.cardHeader}>Summary Metrics ({new Date().toDateString()})</Text>

        <View style={styles.row}>
          <Text style={styles.label}>📍 Attendance Status:</Text>
          <Text style={[styles.value, { color: attendanceStatus === 'Present' ? '#2E7D32' : '#C62828' }]}>
            {attendanceStatus}
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>🗺️ Daily Tour Beat:</Text>
          <Text style={styles.value}>{todayTourTerritory}</Text>
        </View>

        {attendanceStatus === 'Present' && (
          <View style={styles.row}>
            <Text style={styles.label}>⏰ Working Hours:</Text>
            <Text style={styles.value}>
               {formatTime12h(checkInTime)} - {formatTime12h(endTime) || 'Active'}
               <Text style={{ color: '#059669', fontWeight: 'bold' }}>{calculateDuration(checkInTime, endTime)}</Text>
            </Text>
          </View>
        )}

        {attendanceStatus === 'Present' && (
          <View style={styles.row}>
            <Text style={styles.label}>🚗 Distance Travelled:</Text>
            <Text style={styles.value}>
              {totalKmTravelled > 0 ? `${totalKmTravelled} km` : 'Distance not available'}
            </Text>
          </View>
        )}

        <View style={styles.row}>
          <Text style={styles.label}>🩺 Doctor Visits Logged:</Text>
          <Text style={styles.value}>{docCount}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>📅 Doctor Follow-Ups Scheduled:</Text>
          <Text style={styles.value}>{upcomingFollowUps}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>💊 Chemist Visits Logged:</Text>
          <Text style={styles.value}>{chemistCount}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>📦 Orders Booked Today:</Text>
          <Text style={styles.value}>{orderCount}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>📊 Average Order Value:</Text>
          <Text style={[styles.value, { color: '#0D47A1' }]}>
            ₹ {avgOrderValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
        </View>

        <View style={[styles.row, { borderBottomWidth: 0, paddingBottom: 0 }]}>
          <Text style={styles.label}>💰 Total Sales Generated:</Text>
          <Text style={[styles.value, { fontWeight: 'bold', color: '#2E7D32', fontSize: 16 }]}>
            ₹ {totalSales.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
        </View>
      </View>

      <View style={styles.card} {...{ className: 'print-card' } as any}>
        <Text style={styles.cardHeader}>Daily Activity Remarks</Text>
        {isLocked ? (
          <View style={styles.readOnlyContainer}>
            <Text style={styles.readOnlyText}>{remarks || 'No remarks provided for today.'}</Text>
          </View>
        ) : (
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Summary of today's field work, customer discussions, or feedback..."
            value={remarks}
            onChangeText={setRemarks}
            multiline
            numberOfLines={4}
          />
        )}

        <Text style={[styles.cardHeader, { marginTop: 20, borderBottomWidth: 0, paddingBottom: 0 }]}>
          Competitor Activity & Feedback
        </Text>
        {isLocked ? (
          <View style={styles.readOnlyContainer}>
            <Text style={styles.readOnlyText}>{competitorActivity || 'No competitor activity reported.'}</Text>
          </View>
        ) : (
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="e.g. Competitor product offers seen, pricing discounts, doctor feedback on alternative options..."
            value={competitorActivity}
            onChangeText={setCompetitorActivity}
            multiline
            numberOfLines={4}
          />
        )}

        <TouchableOpacity 
          style={[
            styles.submitButton, 
            { backgroundColor: (reportGenerated || isSubmitting) ? '#9E9E9E' : '#43A047' }
          ]} 
          onPress={handleGenerateReport}
          disabled={reportGenerated || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>SUBMIT DAILY REPORT</Text>
          )}
        </TouchableOpacity>
      </View>
      <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default DailyReportScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    padding: 20,
    paddingTop: 50,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  loaderContainer: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loaderText: {
    marginTop: 15,
    fontSize: 14,
    color: '#666',
  },
  successCard: {
    backgroundColor: '#E8F5E9',
    borderColor: '#C8E6C9',
    borderWidth: 1,
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    alignItems: 'center',
  },
  successText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  successSubtext: {
    fontSize: 12,
    color: '#558B2F',
    textAlign: 'center',
    marginTop: 4,
  },
  statusBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 8,
  },
  statusBadgeLabel: {
    fontSize: 12,
    color: '#455A64',
    fontWeight: '600',
  },
  statusBadge: {
    backgroundColor: '#FFF9C4',
    borderColor: '#FBC02D',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#F57F17',
  },
  mockActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 15,
    width: '100%',
  },
  mockActionBtn: {
    flex: 1,
    backgroundColor: '#43A047',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  mockActionBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  cardHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 10,
    marginBottom: 15,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#fafafa',
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#fafafa',
    marginTop: 10,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#43A047',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#FFEBEE',
    borderColor: '#FFCDD2',
    borderWidth: 1,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: '#C62828',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#C62828',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  readOnlyContainer: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    backgroundColor: '#EEF2F6',
    padding: 12,
    marginTop: 10,
    minHeight: 80,
  },
  readOnlyText: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
});
