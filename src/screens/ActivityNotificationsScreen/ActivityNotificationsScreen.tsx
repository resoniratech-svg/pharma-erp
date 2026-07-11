import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, ActivityIndicator, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import RNDateTimePicker from '@react-native-community/datetimepicker';

// API Imports
import { getRetailerOrders } from '../../services/orderService';
import { getAttendanceLogs } from '../../services/attendanceService';
import { getDoctorVisitsByMr } from '../../services/doctorService';
import { getChemistVisitsByMr } from '../../services/chemistService';

interface ActivityNotification {
  id: string | number;
  title: string;
  message: string;
  time: string;
  module: 'order' | 'attendance' | 'dcr' | 'target' | 'doctor_visit' | 'chemist_visit';
  timestamp: number;
}

const ActivityNotificationsScreen = () => {
  const navigation = useNavigation<any>();
  const [notifications, setNotifications] = useState<ActivityNotification[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);

  // Filter States
  const [selectedType, setSelectedType] = useState<'All' | 'Doctor Visits' | 'Chemist Visits' | 'Orders' | 'Attendance'>('All');
  const [selectedDateFilter, setSelectedDateFilter] = useState<'All' | 'Today' | 'Yesterday' | 'Custom'>('All');
  const [customDate, setCustomDate] = useState(new Date().toISOString().split('T')[0]);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const loadActivityNotifications = async () => {
    setLoading(true);
    try {
      const compiled: ActivityNotification[] = [];
      
      // Load all backend resources in parallel
      const [ordersRes, attendanceRes, doctorVisitsRes, chemistVisitsRes] = await Promise.allSettled([
        getRetailerOrders(),
        getAttendanceLogs(),
        getDoctorVisitsByMr(),
        getChemistVisitsByMr(),
      ]);

      const orders = ordersRes.status === 'fulfilled' && Array.isArray(ordersRes.value) ? ordersRes.value : [];
      const attendance = attendanceRes.status === 'fulfilled' && Array.isArray(attendanceRes.value) ? attendanceRes.value : [];
      const doctorVisits = doctorVisitsRes.status === 'fulfilled' && Array.isArray(doctorVisitsRes.value) ? doctorVisitsRes.value : [];
      const chemistVisits = chemistVisitsRes.status === 'fulfilled' && Array.isArray(chemistVisitsRes.value) ? chemistVisitsRes.value : [];

      // 1. Order Success Notifications
      orders.forEach((o: any) => {
        const date = o.createdAt ? new Date(o.createdAt) : new Date();
        compiled.push({
          id: `ord-${o.id || o.orderNumber}`,
          title: `Order Booked Successfully`,
          message: `Order ${o.orderNumber || 'recorded'} for ${o.customerName || o.customer?.name || 'Chemist Store'} has been saved in the system.`,
          time: date.toLocaleDateString('en-GB') + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          module: 'order',
          timestamp: date.getTime(),
        });
      });

      // 2. Attendance Notifications
      attendance.forEach((l: any) => {
        const date = l.checkInTime ? new Date(l.checkInTime) : (l.date ? new Date(l.date) : new Date());
        compiled.push({
          id: `att-${l.id}`,
          title: `Attendance Checked In`,
          message: `Your attendance status was logged as ${l.status || 'Present'}.`,
          time: date.toLocaleDateString('en-GB') + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          module: 'attendance',
          timestamp: date.getTime(),
        });
      });

      // 3. Doctor Visit Notifications
      doctorVisits.forEach((visit: any) => {
        const date = visit.visitDate || visit.createdAt ? new Date(visit.visitDate || visit.createdAt) : new Date();
        compiled.push({
          id: `doc-${visit.id}`,
          title: 'Doctor Visit Logged',
          message: `Visit recorded for Dr. ${visit.doctor?.doctorName || visit.doctor?.name || visit.doctorName || 'Unknown'}.`,
          time: date.toLocaleDateString('en-GB') + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          module: 'doctor_visit',
          timestamp: date.getTime(),
        });
      });

      // 4. Chemist Visit Notifications
      chemistVisits.forEach((visit: any) => {
        const date = visit.visitDate || visit.createdAt ? new Date(visit.visitDate || visit.createdAt) : new Date();
        compiled.push({
          id: `chem-${visit.id}`,
          title: 'Chemist Visit Logged',
          message: `Visit recorded for ${visit.chemist?.shopName || visit.chemist?.name || visit.shopName || visit.chemistName || 'Pharmacy'}.`,
          time: date.toLocaleDateString('en-GB') + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          module: 'chemist_visit',
          timestamp: date.getTime(),
        });
      });

      // Sort so latest (highest timestamp) is on top
      compiled.sort((a, b) => b.timestamp - a.timestamp);
      setNotifications(compiled); 
    } catch (e) {
      console.log('Error loading activity notifications', e);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadActivityNotifications();
    setRefreshing(false);
  }, []);

  useFocusEffect(useCallback(() => { loadActivityNotifications(); }, []));

  const getIcon = (module: string) => {
    switch (module) {
      case 'order': return '📦';
      case 'attendance': return '📍';
      case 'doctor_visit': return '🩺';
      case 'chemist_visit': return '💊';
      default: return '✅';
    }
  };

  const getColor = (module: string) => {
    switch (module) {
      case 'order': return '#DEF7EC'; // Green
      case 'attendance': return '#E0E7FF'; // Indigo
      case 'doctor_visit': return '#E6F4EA'; // Light Green
      case 'chemist_visit': return '#FEF3C7'; // Light Yellow/Orange
      default: return '#F1F5F9';
    }
  };

  // Filter Logic
  const filteredNotifications = notifications.filter(item => {
    // 1. Type Filter
    if (selectedType !== 'All') {
      if (selectedType === 'Doctor Visits' && item.module !== 'doctor_visit') return false;
      if (selectedType === 'Chemist Visits' && item.module !== 'chemist_visit') return false;
      if (selectedType === 'Orders' && item.module !== 'order') return false;
      if (selectedType === 'Attendance' && item.module !== 'attendance') return false;
    }

    // 2. Date Filter
    if (selectedDateFilter !== 'All') {
      const itemDateStr = new Date(item.timestamp).toISOString().split('T')[0];
      const todayStr = new Date().toISOString().split('T')[0];

      if (selectedDateFilter === 'Today') {
        if (itemDateStr !== todayStr) return false;
      } else if (selectedDateFilter === 'Yesterday') {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        if (itemDateStr !== yesterdayStr) return false;
      } else if (selectedDateFilter === 'Custom') {
        if (itemDateStr !== customDate) return false;
      }
    }

    return true;
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>⬅️ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>📲 Activity Notifications</Text>
        <Text style={styles.headerSubtitle}>System confirmations for your actions</Text>
      </View>

      {/* Filter Options Controls */}
      <View style={styles.filterSection}>
        {/* Module Type Filter Row */}
        <Text style={styles.filterLabel}>Type Filter</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          {(['All', 'Doctor Visits', 'Chemist Visits', 'Orders', 'Attendance'] as const).map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.filterChip, selectedType === type && styles.activeChip]}
              onPress={() => setSelectedType(type)}
            >
              <Text style={[styles.chipText, selectedType === type && styles.activeChipText]}>
                {type === 'Doctor Visits' ? '🩺 Doctor' : type === 'Chemist Visits' ? '💊 Chemist' : type === 'Orders' ? '📦 Orders' : type === 'Attendance' ? '📍 Attendance' : 'All'}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Date Filter Row */}
        <Text style={styles.filterLabel}>Date Filter</Text>
        <View style={styles.dateFilterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.filterRow, { flex: 1, marginBottom: 0 }]}>
            {(['All', 'Today', 'Yesterday', 'Custom'] as const).map((filter) => (
              <TouchableOpacity
                key={filter}
                style={[styles.filterChip, selectedDateFilter === filter && styles.activeChip]}
                onPress={() => setSelectedDateFilter(filter)}
              >
                <Text style={[styles.chipText, selectedDateFilter === filter && styles.activeChipText]}>
                  {filter}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Custom Date Picker Trigger */}
          {selectedDateFilter === 'Custom' && (
            <View style={styles.datePickerWrapper}>
              {Platform.OS === 'web' ? (
                <input
                  type="date"
                  value={customDate}
                  onChange={(e: any) => setCustomDate(e.target.value)}
                  style={{
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: '#E2E8F0',
                    borderRadius: '12px',
                    padding: '6px 10px',
                    fontSize: '13px',
                    backgroundColor: '#F8FAFC',
                    outline: 'none',
                    color: '#475569',
                    fontWeight: '600',
                  } as any}
                />
              ) : (
                <>
                  <TouchableOpacity
                    style={styles.nativeDatePickerButton}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Text style={styles.nativeDatePickerText}>{customDate}</Text>
                  </TouchableOpacity>
                  {showDatePicker && (
                    <RNDateTimePicker
                      mode="date"
                      value={new Date(customDate)}
                      onChange={(e, d) => {
                        setShowDatePicker(false);
                        if (d) setCustomDate(d.toISOString().split('T')[0]);
                      }}
                    />
                  )}
                </>
              )}
            </View>
          )}
        </View>
      </View>

      {/* Notifications List */}
      <ScrollView 
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4F46E5']} />
        }
      >
        {loading && filteredNotifications.length === 0 ? (
          <ActivityIndicator size="large" color="#4F46E5" style={{ marginTop: 40 }} />
        ) : filteredNotifications.length > 0 ? (
          filteredNotifications.map((item) => (
            <View key={item.id.toString()} style={styles.card}>
              <View style={[styles.iconContainer, { backgroundColor: getColor(item.module) }]}>
                <Text style={styles.icon}>{getIcon(item.module)}</Text>
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.message}>{item.message}</Text>
                <Text style={styles.time}>{item.time}</Text>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No matching notifications found.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default ActivityNotificationsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
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
  backButtonText: { fontSize: 12, color: '#FFFFFF', fontWeight: 'bold' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#FFFFFF', textAlign: 'center' },
  headerSubtitle: { fontSize: 12, color: '#E0E7FF', textAlign: 'center', marginTop: 6 },
  
  // Filter styles
  filterSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#64748B',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  filterRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  activeChip: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  chipText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  activeChipText: {
    color: '#FFFFFF',
  },
  dateFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  datePickerWrapper: {
    marginLeft: 8,
  },
  nativeDatePickerButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  nativeDatePickerText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: 'bold',
  },

  listContainer: { padding: 20 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9'
  },
  iconContainer: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  icon: { fontSize: 22 },
  textContainer: { flex: 1 },
  title: { fontSize: 14, fontWeight: '700', color: '#1E293B', marginBottom: 4 },
  message: { fontSize: 12.5, color: '#64748B', lineHeight: 18, marginBottom: 8 },
  time: { fontSize: 11, color: '#94A3B8', fontWeight: '600' },
  
  emptyCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 30, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0', marginTop: 40 },
  emptyText: { fontSize: 14, color: '#94A3B8', fontStyle: 'italic' }
});