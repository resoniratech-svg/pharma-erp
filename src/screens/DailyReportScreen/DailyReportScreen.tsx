import { createDailyReport } from '../../services/dailyReportService';
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
import * as Location from 'expo-location';

const safeJsonParse = (data: string | null, fallback: any) => {
  if (!data) return fallback;
  try {
    return JSON.parse(data);
  } catch (err) {
    console.log('safeJsonParse error in DailyReportScreen:', err);
    return fallback;
  }
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
  const [totalKmTravelled, setTotalKmTravelled] = useState(0);

  // Form states
  const [remarks, setRemarks] = useState('');
  const [competitorActivity, setCompetitorActivity] = useState('');
  const [approvalStatus, setApprovalStatus] = useState('Pending Approval');

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

  const calculateDuration = (start: string, end: string) => {
    if (!start || !end || start === 'N/A' || end === 'N/A' || end === 'Active') return '';
    try {
      const parseTime = (timeStr: string) => {
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
      const startMins = parseTime(start);
      const endMins = parseTime(end);
      let diff = endMins - startMins;
      if (diff < 0) diff += 24 * 60; 
      const hrs = Math.floor(diff / 60);
      const mins = diff % 60;
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
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      const isoToday = `${yyyy}-${mm}-${dd}`;

      // 1. Get Doctor Visits & Follow Ups
      const docData = await AsyncStorage.getItem('@doctor_visits');
      const allDocList = safeJsonParse(docData, []);
      const docList = allDocList.filter((v: any) => checkSameDay(today, v.visitDate || v.date));
      setDocCount(docList.length);

      const followUpCount = docList.filter((v: any) => {
        const fUp = v.nextFollowUp || v.followUpDate;
        return fUp && fUp.trim() !== '';
      }).length;
      setUpcomingFollowUps(followUpCount);

      // 2. Get Chemist Visits
      const chemistData = await AsyncStorage.getItem('@chemist_visits');
      const allChemistList = safeJsonParse(chemistData, []);
      const chemistList = allChemistList.filter((v: any) => checkSameDay(today, v.visitDate || v.date));
      setChemistCount(chemistList.length);

      // 3. Get Orders & Calculate Sales
      const ordersData = await AsyncStorage.getItem('@orders');
      const allOrdersList = safeJsonParse(ordersData, []);
      const ordersList = allOrdersList.filter((o: any) => checkSameDay(today, o.dateFormatted || o.date));
      setOrderCount(ordersList.length);

      // Sum values from both orders and chemist visit values
      const chemistSalesSum = chemistList.reduce((sum: number, item: any) => {
        return sum + (parseFloat(item.orderValue) || 0);
      }, 0);

      const ordersSalesSum = ordersList.reduce((sum: number, item: any) => {
        return sum + (parseFloat(item.totalAmount) || 0);
      }, 0);

      setTotalSales(chemistSalesSum + ordersSalesSum);

      // 4. Get Dynamic GPS Route Distance (matches DashboardScreen)
      let gpsDistance = 0;
      try {
        const todayString = today.toLocaleDateString('en-GB').replace(/\//g, '-');
        const gpsKey = `@gps_movement_${todayString}`;
        const gpsDataRaw = await AsyncStorage.getItem(gpsKey);
        const gpsLogs = gpsDataRaw ? JSON.parse(gpsDataRaw) : [];

        if (gpsLogs && gpsLogs.length > 1) {
          let dist = 0;
          for (let i = 0; i < gpsLogs.length - 1; i++) {
            dist += calculateDistance(
              gpsLogs[i].latitude, gpsLogs[i].longitude,
              gpsLogs[i + 1].latitude, gpsLogs[i + 1].longitude
            );
          }
          gpsDistance = dist;
        }
      } catch (e) {
        console.log('Failed to calculate GPS distance', e);
      }

      // 5. Get Attendance Status
      const checkedInStatus = await AsyncStorage.getItem('@checked_in');
      const checkInTimeStored = await AsyncStorage.getItem('@check_in_time');
      const attendanceDateStored = await AsyncStorage.getItem('@attendance_date');
      const storedLogs = await AsyncStorage.getItem('@attendance_logs');
      const logsList = safeJsonParse(storedLogs, []);

      // Find today's checkout log
      const todayLog = logsList.find((log: any) => checkSameDay(today, log.date || log.checkInTime));

      let statusStr = 'Absent';
      let checkInStr = '';
      let endStr = '';
      let kmStr = 0;

      let startLat: number | null = null;
      let startLng: number | null = null;
      let endLat: number | null = null;
      let endLng: number | null = null;

      if (checkedInStatus === 'true' && attendanceDateStored && checkSameDay(today, attendanceDateStored)) {
        statusStr = 'Present';
        checkInStr = checkInTimeStored || '';
        endStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        const storedLat = await AsyncStorage.getItem('@check_in_lat');
        const storedLng = await AsyncStorage.getItem('@check_in_lng');
        if (storedLat) startLat = parseFloat(storedLat);
        if (storedLng) startLng = parseFloat(storedLng);
        
        try {
           const { status } = await Location.requestForegroundPermissionsAsync();
           if (status === 'granted') {
             const currentLoc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
             endLat = currentLoc.coords.latitude;
             endLng = currentLoc.coords.longitude;
           }
        } catch(e) {}

        const checkInCheckOutDist = (startLat && startLng && endLat && endLng) 
            ? calculateDistance(startLat, startLng, endLat, endLng) : 0;
            
        const totalVisits = docList.length + chemistList.length;
        kmStr = checkInCheckOutDist > 0 ? parseFloat(checkInCheckOutDist.toFixed(2)) 
                : (gpsDistance > 0 ? parseFloat(gpsDistance.toFixed(2)) : (totalVisits > 0 ? (totalVisits * 4) + 6 : 0));
      } else if (todayLog) {
        statusStr = 'Present';
        checkInStr = todayLog.checkInTime || '';
        endStr = todayLog.checkOutTime || '';
        
        if (todayLog.checkInLat) startLat = todayLog.checkInLat;
        if (todayLog.checkInLng) startLng = todayLog.checkInLng;
        if (todayLog.checkOutLat) endLat = todayLog.checkOutLat;
        if (todayLog.checkOutLng) endLng = todayLog.checkOutLng;

        const checkInCheckOutDist = (startLat && startLng && endLat && endLng) 
            ? calculateDistance(startLat, startLng, endLat, endLng) : 0;

        const totalVisits = docList.length + chemistList.length;
        kmStr = checkInCheckOutDist > 0 ? parseFloat(checkInCheckOutDist.toFixed(2)) 
                : (gpsDistance > 0 ? parseFloat(gpsDistance.toFixed(2)) : (totalVisits > 0 ? (totalVisits * 4) + 6 : 12));
      } else {
        // Fallback: if they logged any doctor/chemist visits or orders today, they were present!
        if (docList.length > 0 || chemistList.length > 0 || ordersList.length > 0) {
          statusStr = 'Present';
          checkInStr = 'N/A';
          endStr = 'N/A';
          const totalVisits = docList.length + chemistList.length;
          kmStr = gpsDistance > 0 ? parseFloat(gpsDistance.toFixed(2)) : (totalVisits > 0 ? (totalVisits * 4) + 6 : 8);
        } else {
          statusStr = 'Absent';
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
        const reportDataStr = await AsyncStorage.getItem('@daily_report_data');
        if (reportDataStr) {
          const reportData = safeJsonParse(reportDataStr, null);
          if (reportData) {
            setRemarks(reportData.remarks || '');
            setCompetitorActivity(reportData.competitorActivity || '');
            setApprovalStatus(reportData.status || 'Pending Approval');
          }
        }
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
    if (!remarks.trim()) {
      customAlert('Error', 'Please enter daily activity remarks before submitting.');
      return;
    }

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
      remarks: remarks,
      competitorActivity: competitorActivity,
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
  remarks
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
              <span class="label">Distance Travelled:</span>
              <span class="value">${totalKmTravelled} km</span>
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
        // On web, directly open the print dialog
        await Print.printAsync({ html: htmlContent });
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
        + `🚗 Distance: ${totalKmTravelled} km\n`
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
      >
      <Text style={styles.title}>📋 Daily Work Report</Text>

      {reportGenerated ? (
        <View style={styles.successCard}>
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
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.cardHeader}>Summary Metrics ({new Date().toDateString()})</Text>

        <View style={styles.row}>
          <Text style={styles.label}>📍 Attendance Status:</Text>
          <Text style={[styles.value, { color: attendanceStatus === 'Present' ? '#2E7D32' : '#C62828' }]}>
            {attendanceStatus}
          </Text>
        </View>

        {attendanceStatus === 'Present' && (
          <View style={styles.row}>
            <Text style={styles.label}>⏰ Working Hours:</Text>
            <Text style={styles.value}>
               {checkInTime} - {endTime || 'Active'}
               <Text style={{ color: '#059669', fontWeight: 'bold' }}>{calculateDuration(checkInTime, endTime)}</Text>
            </Text>
          </View>
        )}

        {attendanceStatus === 'Present' && (
          <View style={styles.row}>
            <Text style={styles.label}>🚗 Distance Travelled:</Text>
            <Text style={styles.value}>{totalKmTravelled} km</Text>
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

      <View style={styles.card}>
        <Text style={styles.cardHeader}>Daily Activity Remarks</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Summary of today's field work, customer discussions, or feedback..."
          value={remarks}
          onChangeText={setRemarks}
          multiline
          numberOfLines={4}
          editable={!reportGenerated}
          onFocus={() => {
            setTimeout(() => {
              scrollViewRef.current?.scrollToEnd({ animated: true });
            }, 150);
          }}
        />

        <Text style={[styles.cardHeader, { marginTop: 20, borderBottomWidth: 0, paddingBottom: 0 }]}>
          Competitor Activity & Feedback
        </Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="e.g. Competitor product offers seen, pricing discounts, doctor feedback on alternative options..."
          value={competitorActivity}
          onChangeText={setCompetitorActivity}
          multiline
          numberOfLines={4}
          editable={!reportGenerated}
          onFocus={() => {
            setTimeout(() => {
              scrollViewRef.current?.scrollToEnd({ animated: true });
            }, 150);
          }}
        />

        <TouchableOpacity 
          style={[styles.submitButton, reportGenerated && { backgroundColor: '#9E9E9E' }]} 
          onPress={handleGenerateReport}
        >
          <Text style={styles.submitText}>SUBMIT DAILY REPORT</Text>
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
});
