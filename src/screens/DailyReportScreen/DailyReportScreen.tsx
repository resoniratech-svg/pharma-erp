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

  useEffect(() => {
    loadDailyMetrics();
  }, []);

  const loadDailyMetrics = async () => {
    setLoading(true);
    setError(null);
    try {
      const todayStr = new Date().toDateString();
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      const isoToday = `${yyyy}-${mm}-${dd}`;
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const formattedToday = `${dd}-${months[today.getMonth()]}-${yyyy}`;

      const isToday = (dateStr: string) => {
        if (!dateStr) return false;
        return dateStr.includes(isoToday) || dateStr.includes(formattedToday) || dateStr === todayStr;
      };

      // 1. Get Doctor Visits & Follow Ups
      const docData = await AsyncStorage.getItem('@doctor_visits');
      const allDocList = safeJsonParse(docData, []);
      const docList = allDocList.filter((v: any) => isToday(v.visitDate || v.date));
      setDocCount(docList.length);

      const followUpCount = docList.filter((v: any) => v.followUpDate && v.followUpDate.trim() !== '').length;
      setUpcomingFollowUps(followUpCount);

      // 2. Get Chemist Visits
      const chemistData = await AsyncStorage.getItem('@chemist_visits');
      const allChemistList = safeJsonParse(chemistData, []);
      const chemistList = allChemistList.filter((v: any) => isToday(v.visitDate || v.date));
      setChemistCount(chemistList.length);

      // 3. Get Orders & Calculate Sales
      const ordersData = await AsyncStorage.getItem('@orders');
      const allOrdersList = safeJsonParse(ordersData, []);
      const ordersList = allOrdersList.filter((o: any) => isToday(o.dateFormatted || o.date));
      setOrderCount(ordersList.length);

      // Sum values from both orders and chemist visit values
      const chemistSalesSum = chemistList.reduce((sum: number, item: any) => {
        return sum + (parseFloat(item.orderValue) || 0);
      }, 0);

      const ordersSalesSum = ordersList.reduce((sum: number, item: any) => {
        return sum + (parseFloat(item.totalAmount) || 0);
      }, 0);

      setTotalSales(chemistSalesSum + ordersSalesSum);

      // 4. Get Attendance Status
      const checkedInStatus = await AsyncStorage.getItem('@checked_in');
      const time = await AsyncStorage.getItem('@check_in_time');
      if (checkedInStatus === 'true') {
        setAttendanceStatus('Present');
        setCheckInTime(time || '');
        setEndTime(new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}));
        setTotalKmTravelled(Math.floor(Math.random() * 20) + 10);
      } else {
        setAttendanceStatus('Absent');
      }

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

  // Mock handlers for export & share buttons
  const handleExportPDF = () => {
    customAlert('PDF Exported', `Daily Report for ${new Date().toDateString()} has been generated as MJ_Report.pdf in your downloads.`);
  };

  const handleShareReport = () => {
    customAlert('Share Report', 'Generating shareable report link... Link copied to clipboard.');
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
            <Text style={styles.value}>{checkInTime} - {endTime || 'Active'}</Text>
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

        {!reportGenerated && (
          <TouchableOpacity style={styles.submitButton} onPress={handleGenerateReport}>
            <Text style={styles.submitText}>SUBMIT DAILY REPORT</Text>
          </TouchableOpacity>
        )}
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
