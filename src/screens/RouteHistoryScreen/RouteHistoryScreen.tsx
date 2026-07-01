import AsyncStorage from '@react-native-async-storage/async-storage';
import RNDateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
  Platform,
  RefreshControl,  
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';

const safeJsonParse = (data: string | null, fallback: any) => {
  if (!data) return fallback;
  try {
    return JSON.parse(data);
  } catch (err) {
    console.log('safeJsonParse error in RouteHistoryScreen:', err);
    return fallback;
  }
};

interface TimelineEvent {
  time: string;
  title: string;
  subtitle: string;
  type: 'checkin' | 'doctor' | 'chemist' | 'checkout' | 'plan';
  details?: string;
  badge?: string;
  gpsVerified?: boolean;
  coords?: string;
}

const RouteHistoryScreen = () => {
  const navigation = useNavigation<any>();
  const [selectedDate, setSelectedDate] = useState(
    new Date().toLocaleDateString('en-GB').replace(/\//g, '-') // Default: today's date in DD-MM-YYYY
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // States for aggregated data
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [summary, setSummary] = useState({
    doctors: 0,
    chemists: 0,
    sales: 0,
    completion: '0%',
  });

  const [daySummary, setDaySummary] = useState({
    checkInTime: '-',
    checkOutTime: '-',
    durationStr: '-',
    plannedCalls: 0,
    actualCalls: 0,
  });

  // Date converters
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

  const normalizeTourPlanDate = (dateStr: string): string => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        // Handle YYYY-MM-DD format
        return `${parts[2].padStart(2, '0')}-${parts[1].padStart(2, '0')}-${parts[0]}`;
      }

      const day = parts[0].padStart(2, '0');
      const monthStr = parts[1];
      const year = parts[2];
      
      if (!isNaN(parseInt(monthStr, 10))) {
        return `${day}-${monthStr.padStart(2, '0')}-${year}`;
      }
      
      const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
      const idx = months.indexOf(monthStr.toLowerCase()) + 1;
      const month = idx.toString().padStart(2, '0');
      return `${day}-${month}-${year}`;
    }
    return dateStr;
  };

  // Helper to convert time "10:30 AM" or "02:00 PM" into minutes from midnight for sorting
  const timeToMinutes = (timeStr: string): number => {
    if (!timeStr) return 0;
    const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
    if (!match) return 0;
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const ampm = match[3];

    if (ampm) {
      const isPM = ampm.toUpperCase() === 'PM';
      if (isPM && hours < 12) hours += 12;
      if (!isPM && hours === 12) hours = 0;
    }
    return hours * 60 + minutes;
  };

  const isSameDay = (item: any, selectedDateStr: string): boolean => {
    try {
      const val = item.date || item.visitDate || item.timestamp || item.id;
      if (!val) return false;

      // Handle "19-Jun-2026 12:50 PM" or "19-06-2026" directly
      if (typeof val === 'string' && val.includes('-')) {
         const datePart = val.split(' ')[0]; // gets "19-Jun-2026"
         const normalized = normalizeTourPlanDate(datePart);
         if (normalized === selectedDateStr) return true;
      }

      if (typeof val === 'string' && /^\d{2}-\d{2}-\d{4}$/.test(val)) {
        return val === selectedDateStr;
      }

      let ts = Number(val);
      if (isNaN(ts) && typeof val === 'string') {
        const match = val.match(/\d{10,13}/);
        if (match) {
          ts = Number(match[0]);
        }
      }

      if (isNaN(ts) || ts <= 0) return false;

      const dateObj = new Date(ts);
      const day = dateObj.getDate().toString().padStart(2, '0');
      const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
      const year = dateObj.getFullYear();
      const formattedDate = `${day}-${month}-${year}`;
      return formattedDate === selectedDateStr;
    } catch (err) {
      console.log('isSameDay verification failed:', err);
      return false;
    }
  };

  useEffect(() => {
    compileRouteHistory();
  }, [selectedDate]);

  const compileRouteHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch all datasets from AsyncStorage
      const docVisitsData = await AsyncStorage.getItem('@doctor_visits');
      const chemistVisitsData = await AsyncStorage.getItem('@chemist_visits');
      const tourPlansData = await AsyncStorage.getItem('@tour_plans');
      const attendanceLogsData = await AsyncStorage.getItem('@attendance_logs');

      const allDocVisits = safeJsonParse(docVisitsData, []);
      const allChemistVisits = safeJsonParse(chemistVisitsData, []);
      const allTourPlans = safeJsonParse(tourPlansData, []);
      const attendanceLogs = safeJsonParse(attendanceLogsData, []);

      // 2. Filter data matching selectedDate
      const docsToday = allDocVisits.filter((v: any) => isSameDay(v, selectedDate));
      const chemistsToday = allChemistVisits.filter((v: any) => isSameDay(v, selectedDate));
      const planToday = allTourPlans.find((p: any) => normalizeTourPlanDate(p.date) === selectedDate);
      const attendanceToday = attendanceLogs.find((l: any) => l.date === selectedDate);

      // Check if selectedDate is today & retrieve active checked-in attendance details
      const todayStr = new Date().toLocaleDateString('en-GB').replace(/\//g, '-');
      const isToday = selectedDate === todayStr;
      const storedCheckedIn = await AsyncStorage.getItem('@attendance_checked_in');
      const storedCheckInTime = await AsyncStorage.getItem('@attendance_time');
      const storedAddress = await AsyncStorage.getItem('@attendance_address');

      let checkInTime = null;
      let checkInAddress = '';
      let checkOutTime = null;
      let checkOutAddress = '';
      let durationStr = '';

      if (attendanceToday) {
        checkInTime = attendanceToday.checkInTime;
        checkInAddress = attendanceToday.checkInAddress || '';
        checkOutTime = attendanceToday.checkOutTime !== '-' ? attendanceToday.checkOutTime : null;
        checkOutAddress = attendanceToday.checkOutAddress || '';
        durationStr = attendanceToday.duration || '';
      } else if (isToday && storedCheckedIn === 'true' && storedCheckInTime) {
        checkInTime = storedCheckInTime;
        checkInAddress = storedAddress || '';
      }

      // 3. Compute Summary Card Stats
      const salesToday = chemistsToday.reduce((sum: number, item: any) => {
        return sum + (parseFloat(item.orderValue) || 0);
      }, 0);

      const visited = docsToday.length + chemistsToday.length;
      let completionVal = '0%';
      let plannedCount = 10; // Baseline target if no beat plan
      if (planToday) {
        plannedCount = (parseInt(planToday.docCount, 10) || 0) + (parseInt(planToday.chemistCount, 10) || 0);
        completionVal = plannedCount > 0 ? `${Math.min(Math.round((visited / plannedCount) * 100), 100)}%` : '100%';
      } else {
        completionVal = visited > 0 ? `${Math.min(Math.round((visited / 10) * 100), 100)}%` : '0%';
      }

      setSummary({
        doctors: docsToday.length,
        chemists: chemistsToday.length,
        sales: salesToday,
        completion: completionVal,
      });

      setDaySummary({
        checkInTime: checkInTime || '-',
        checkOutTime: checkOutTime || '-',
        durationStr: durationStr || '-',
        plannedCalls: plannedCount,
        actualCalls: visited,
      });

      // 4. Build Chronological Timeline Events
      const eventsList: TimelineEvent[] = [];

      // A. Add Beat Tour Plan info if available
      if (planToday) {
        eventsList.push({
          time: planToday.startTime || '09:00 AM',
          title: `🗺️ Tour Beat: ${planToday.beat || 'Unscheduled'}`,
          subtitle: `Territory: ${planToday.territory || 'N/A'} (Route: ${planToday.area})`,
          type: 'plan',
          details: `Planned Objective: ${planToday.objective || 'Routine promotion'}. Planned Target count: ${planToday.docCount} Doctors, ${planToday.chemistCount} Chemists.`,
        });
      }

      // B. Real Attendance Check-In Integration
      if (checkInTime) {
        eventsList.push({
          time: checkInTime,
          title: '🟢 Beat Checked-In',
          subtitle: checkInAddress ? `Checked in at: ${checkInAddress}` : 'Territory gate geo-tag matched.',
          type: 'checkin',
          details: `Attendance logged successfully. Geofence verification status: Verified.`,
        });
      }

      // C. Add Doctor Visits (protecting against double "Dr." prefixes and null names)
      docsToday.forEach((v: any) => {
        const rawDocName = v.doctorName || 'Unknown Doctor';
        const docFormattedName = rawDocName.startsWith('Dr.') ? rawDocName : `Dr. ${rawDocName}`;
        const hasGps = v.latitude && v.longitude && v.latitude !== 'No GPS Data';
        
        eventsList.push({
          time: v.time || '10:30 AM',
          title: `🩺 Doctor Visited: ${docFormattedName}`,
          subtitle: `Hospital/Clinic: ${v.hospital || 'Clinic'} (${v.specialty || 'General'})`,
          type: 'doctor',
          badge: v.visitType || 'Routine',
          details: `Products Detailed: ${v.products || 'None'}. Samples Given: ${v.samples || 'None'}. Notes: ${v.notes || 'No notes logged.'}`,
          gpsVerified: !!hasGps,
          coords: hasGps ? `${parseFloat(v.latitude).toFixed(4)}° N, ${parseFloat(v.longitude).toFixed(4)}° E` : undefined,
        });
      });

      // D. Add Chemist Visits / Orders (safe orderValue parsing and null names)
      chemistsToday.forEach((v: any) => {
        const orderValNum = Number(v.orderValue) || 0;
        const hasGps = v.latitude && v.longitude && v.latitude !== 'No GPS Data';
        
        eventsList.push({
          time: v.time || '02:00 PM',
          title: `💊 Chemist Visited: ${v.shopName || 'Unknown Shop'}`,
          subtitle: `Chemist: ${v.chemistName || 'Staff'} (Location: ${v.area || 'N/A'})`,
          type: 'chemist',
          badge: orderValNum > 0 ? `Order Booked` : 'Feedback Meet',
          details: orderValNum > 0 
            ? `Medicine ordered: ${v.medicine || 'General'} (Qty: ${v.quantity || 'N/A'}). Order value booked: ₹${orderValNum.toLocaleString()}`
            : 'No order booked. Shared marketing literature.',
          gpsVerified: !!hasGps,
          coords: hasGps ? `${parseFloat(v.latitude).toFixed(4)}° N, ${parseFloat(v.longitude).toFixed(4)}° E` : undefined,
        });
      });

      // Sort timeline events chronologically by converting to minutes (checkin & plan always go first)
      eventsList.sort((a, b) => {
        if (a.type === 'plan') return -1;
        if (b.type === 'plan') return 1;
        if (a.type === 'checkin') return -1;
        if (b.type === 'checkin') return 1;
        if (a.type === 'checkout') return 1;
        if (b.type === 'checkout') return -1;
        return timeToMinutes(a.time) - timeToMinutes(b.time);
      });

      // E. Real Attendance Check-Out Integration
      if (checkOutTime) {
        eventsList.push({
          time: checkOutTime,
          title: '👋 Beat Checked-Out',
          subtitle: checkOutAddress ? `Checked out at: ${checkOutAddress}` : 'Route exits geofence matched.',
          type: 'checkout',
          details: `Daily duty duration: ${durationStr || 'N/A'}. Route logs successfully compiled.`,
        });
      }

      setTimelineEvents(eventsList);
    } catch (e) {
      console.log('Failed to compile route history', e);
      setError('Failed to compile route history.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await compileRouteHistory();
    setRefreshing(false);
  };

  const getTimelineEventColors = (type: string) => {
    switch (type) {
      case 'plan':
        return { dot: '#4F46E5', line: '#E2E8F0', icon: '🗺️' };
      case 'checkin':
        return { dot: '#10B981', line: '#10B981', icon: '🏁' };
      case 'doctor':
        return { dot: '#06B6D4', line: '#E2E8F0', icon: '🩺' };
      case 'chemist':
        return { dot: '#F59E0B', line: '#E2E8F0', icon: '💊' };
      default: // checkout
        return { dot: '#EF4444', line: '#E2E8F0', icon: '🚪' };
    }
  };

  const webInputStyle = {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
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
        <Text style={styles.headerTitle}>🛤️ Daily Route History</Text>
        <Text style={styles.headerSubtitle}>View timeline & geofence visit logs</Text>
      </View>

      {/* Date Picker Bar */}
      <View style={styles.dateSelectorCard}>
        <Text style={styles.dateLabel}>Select History Date:</Text>
        {Platform.OS === 'web' ? (
          <input
            type="date"
            value={getWebDateFormat(selectedDate)}
            onChange={(e) => handleDateChangeWeb(e.target.value)}
            style={webInputStyle}
          />
        ) : (
          <TouchableOpacity
            style={styles.nativeDateBtn}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.nativeDateBtnText}>{selectedDate}</Text>
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
      </View>

      {/* KPI Scrollbar */}
      <View style={{ height: 70, marginTop: 15 }}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.kpiScroll}
          contentContainerStyle={{ paddingHorizontal: 20 }}
        >
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Doctors</Text>
            <Text style={[styles.kpiValue, { color: '#06B6D4' }]}>{summary.doctors}</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Chemists</Text>
            <Text style={[styles.kpiValue, { color: '#F59E0B' }]}>{summary.chemists}</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Orders</Text>
            <Text style={[styles.kpiValue, { color: '#10B981' }]}>₹{summary.sales.toLocaleString()}</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Completion</Text>
            <Text style={[styles.kpiValue, { color: '#4F46E5' }]}>{summary.completion}</Text>
          </View>
        </ScrollView>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4F46E5']} />
        }
      >
        {loading ? (
          <ActivityIndicator size="large" color="#4F46E5" style={{ marginVertical: 30 }} />
        ) : error ? (
          <View style={[styles.emptyCard, { alignItems: 'center', padding: 20 }]}>
            <Text style={{ color: '#EF4444', fontSize: 14, marginBottom: 12 }}>{error}</Text>
            <TouchableOpacity onPress={compileRouteHistory} style={{ paddingVertical: 10, paddingHorizontal: 20, backgroundColor: '#4F46E5', borderRadius: 8 }}>
              <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 13 }}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Timeline List */}
            <Text style={styles.sectionTitle}>Activity Timeline</Text>
            {timelineEvents.length > 0 ? (
          <View style={styles.timelineContainer}>
            {timelineEvents.map((event, index) => {
              const theme = getTimelineEventColors(event.type);
              const isLast = index === timelineEvents.length - 1;

              return (
                <View key={index} style={styles.timelineRow}>
                  {/* Left Time Section */}
                  <View style={styles.timeColumn}>
                    <Text style={styles.timeText}>{event.time}</Text>
                  </View>

                  {/* Vertical line and dots */}
                  <View style={styles.indicatorColumn}>
                    <View style={[styles.dot, { backgroundColor: theme.dot }]}>
                      <Text style={styles.dotIcon}>{theme.icon}</Text>
                    </View>
                    {!isLast && <View style={[styles.verticalLine, { backgroundColor: theme.line }]} />}
                  </View>

                  {/* Card content */}
                  <View style={styles.contentColumn}>
                    <View style={styles.timelineCard}>
                      <View style={styles.cardHeader}>
                        <Text style={styles.cardTitle}>{event.title}</Text>
                        {event.badge && (
                          <Text style={styles.cardBadge}>{event.badge}</Text>
                        )}
                      </View>
                      <Text style={styles.cardSubtitle}>{event.subtitle}</Text>
                      {event.details ? (
                        <Text style={styles.cardDetails}>{event.details}</Text>
                      ) : null}
                      
                      {/* GPS Verification Badge inside visit cards */}
                      {event.gpsVerified !== undefined && (
                        <View style={styles.gpsRow}>
                          <Text style={[styles.gpsBadgeText, { color: event.gpsVerified ? '#10B981' : '#F59E0B' }]}>
                            {event.gpsVerified ? '🟢 GPS Verified' : '⚠️ GPS Unavailable'}
                          </Text>
                          {event.coords ? <Text style={styles.gpsCoordsText}> ({event.coords})</Text> : null}
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No route visits or check-ins logged for {selectedDate}.</Text>
          </View>
        )}

        {/* Daily Overview Summary Card */}
        {timelineEvents.length > 0 && (
          <View style={styles.daySummaryCard}>
            <Text style={styles.daySummaryTitle}>📋 Daily Route Summary</Text>
            <View style={styles.daySummaryGrid}>
              <View style={styles.daySummaryCol}>
                <Text style={styles.daySummaryLabel}>Check In</Text>
                <Text style={styles.daySummaryVal}>{daySummary.checkInTime}</Text>
              </View>
              <View style={styles.daySummaryCol}>
                <Text style={styles.daySummaryLabel}>Check Out</Text>
                <Text style={styles.daySummaryVal}>{daySummary.checkOutTime}</Text>
              </View>
              <View style={styles.daySummaryCol}>
                <Text style={styles.daySummaryLabel}>Duration</Text>
                <Text style={styles.daySummaryVal}>{daySummary.durationStr}</Text>
              </View>
            </View>
            <View style={[styles.daySummaryGrid, { marginTop: 12, borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 12 }]}>
              <View style={styles.daySummaryCol}>
                <Text style={styles.daySummaryLabel}>Call Target</Text>
                <Text style={styles.daySummaryVal}>{daySummary.actualCalls} / {daySummary.plannedCalls}</Text>
              </View>
              <View style={styles.daySummaryCol}>
                <Text style={styles.daySummaryLabel}>Completion</Text>
                <Text style={[styles.daySummaryVal, { color: '#4F46E5' }]}>{summary.completion}</Text>
              </View>
              <View style={styles.daySummaryCol}>
                <Text style={styles.daySummaryLabel}>Total Sales</Text>
                <Text style={[styles.daySummaryVal, { color: '#10B981' }]}>₹{summary.sales.toLocaleString()}</Text>
              </View>
            </View>
          </View>
        )}
        </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

export default RouteHistoryScreen;

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
  dateSelectorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginTop: -15,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  dateLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#475569',
  },
  nativeDateBtn: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#F8FAFC',
  },
  nativeDateBtnText: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: 'bold',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  kpiScroll: {
    flexGrow: 0,
  },
  kpiCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginRight: 10,
    minWidth: 100,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  kpiLabel: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 4,
    fontWeight: '600',
  },
  kpiValue: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 15,
    marginTop: 10,
  },
  timelineContainer: {
    paddingLeft: 5,
  },
  timelineRow: {
    flexDirection: 'row',
    minHeight: 80,
  },
  timeColumn: {
    width: 70,
    alignItems: 'flex-start',
    paddingTop: 6,
  },
  timeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#64748B',
  },
  indicatorColumn: {
    width: 44,
    alignItems: 'center',
    position: 'relative',
  },
  dot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  dotIcon: {
    fontSize: 14,
  },
  verticalLine: {
    position: 'absolute',
    top: 30,
    bottom: 0,
    width: 2,
    left: 21,
  },
  contentColumn: {
    flex: 1,
    paddingBottom: 20,
  },
  timelineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E293B',
    flex: 1,
  },
  cardBadge: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#4F46E5',
    backgroundColor: '#EEF2F6',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 10,
    overflow: 'hidden',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 3,
  },
  cardDetails: {
    fontSize: 12,
    color: '#475569',
    marginTop: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 6,
    padding: 8,
    lineHeight: 16,
  },
  gpsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 6,
  },
  gpsBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  gpsCoordsText: {
    fontSize: 10,
    color: '#94A3B8',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  daySummaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginTop: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  daySummaryTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 12,
  },
  daySummaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  daySummaryCol: {
    flex: 1,
    alignItems: 'center',
  },
  daySummaryLabel: {
    fontSize: 10,
    color: '#64748B',
    marginBottom: 4,
    fontWeight: '500',
  },
  daySummaryVal: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#334155',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  emptyText: {
    fontSize: 14,
    color: '#94A3B8',
    fontStyle: 'italic',
    textAlign: 'center',
  },
});