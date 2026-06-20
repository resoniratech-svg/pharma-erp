import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

interface ActivityLog {
  id: number | string;
  time: string;
  type: 'visit' | 'order' | 'expense' | 'attendance' | 'meeting' | 'followup' | 'report' | 'target';
  title: string;
  details: string;
  timestamp: number;
}

const safeJsonParse = (data: string | null, fallback: any) => {
  if (!data) return fallback;
  try {
    return JSON.parse(data);
  } catch (err) {
    console.log('safeJsonParse error:', err);
    return fallback;
  }
};

const createTimestamp = (dateStr: string, timeStr: string) => {
  try {
    return new Date(`${dateStr} ${timeStr}`).getTime();
  } catch {
    return Date.now();
  }
};

const ActivityTrackingScreen = () => {
  const navigation = useNavigation();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [activeTab, setActiveTab] = useState<'All' | 'visit' | 'order' | 'expense' | 'attendance' | 'meeting' | 'report' | 'followup' | 'target'>('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const compileActivityLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const compiled: ActivityLog[] = [];
      const todayStr = new Date().toISOString().split('T')[0];

      // 1. Fetch Doctor Visits
      const docsList = safeJsonParse(await AsyncStorage.getItem('@doctor_visits'), []);
      docsList.forEach((d: any) => {
        compiled.push({
          id: d.id,
          time: d.time || '10:00 AM',
          type: 'visit',
          title: `🩺 Doctor Visited: Dr. ${d.doctorName}`,
          details: `Specialty: ${d.specialty} at ${d.hospital}. Notes: ${d.notes || 'None'}`,
          timestamp: createTimestamp(todayStr, d.time || '10:00 AM')
        });

        if (d.followUpDate) {
          compiled.push({
            id: `fup-${d.id}`,
            time: d.time ? d.time.replace('00', '05') : '10:05 AM',
            type: 'followup',
            title: `🔔 Follow-Up Scheduled: Dr. ${d.doctorName}`,
            details: `Scheduled for: ${d.followUpDate}.`,
            timestamp: createTimestamp(todayStr, d.time || '10:05 AM') + 1000
          });
        }
      });

      // 2. Fetch Chemist Visits
      const chemistsList = safeJsonParse(await AsyncStorage.getItem('@chemist_visits'), []);
      chemistsList.forEach((c: any) => {
        compiled.push({
          id: c.id,
          time: c.time || '12:00 PM',
          type: 'visit',
          title: `💊 Chemist Visited: ${c.shopName}`,
          details: `Order Discussed: ${c.medicine || 'None'} (Qty: ${c.quantity || '0'}).`,
          timestamp: createTimestamp(todayStr, c.time || '12:00 PM')
        });
      });

      // 3. Fetch Orders
      const ordersList = safeJsonParse(await AsyncStorage.getItem('@orders'), []);
      ordersList.forEach((o: any) => {
        compiled.push({
          id: o.id,
          time: o.dateFormatted || '02:00 PM',
          type: 'order',
          title: `📦 Order Booked: ${o.orderNumber}`,
          details: `Customer: ${o.customerName}. Product: ${o.productName}. Amount: ₹${o.totalAmount}`,
          timestamp: createTimestamp(todayStr, o.dateFormatted || '02:00 PM')
        });
      });

      // 4. Fetch Expense Claims
      const expensesList = safeJsonParse(await AsyncStorage.getItem('@expense_claims'), []);
      expensesList.forEach((e: any) => {
        compiled.push({
          id: e.id,
          time: e.date || '04:00 PM',
          type: 'expense',
          title: `💵 Expense Claimed: ${e.category}`,
          details: `Claimed Amount: ₹${e.amount}. Purpose: ${e.remarks}`,
          timestamp: createTimestamp(todayStr, e.date || '04:00 PM')
        });
      });

      // 5. Attendance
      if (await AsyncStorage.getItem('@checked_in') === 'true') {
        const checkInTime = await AsyncStorage.getItem('@check_in_time');
        compiled.push({
          id: Date.now() - 100, 
          time: checkInTime || '09:00 AM',
          type: 'attendance',
          title: '📍 Daily Attendance: Checked-In',
          details: `Checked in successfully for duty.`,
          timestamp: createTimestamp(todayStr, checkInTime || '09:00 AM')
        });
      }

      if (await AsyncStorage.getItem('@checked_out') === 'true') {
        const checkOutTime = await AsyncStorage.getItem('@check_out_time');
        compiled.push({
          id: Date.now() - 50, 
          time: checkOutTime || '06:00 PM',
          type: 'attendance',
          title: '🏁 Daily Attendance: Checked-Out',
          details: `Day ended successfully. Duration logged.`,
          timestamp: createTimestamp(todayStr, checkOutTime || '06:00 PM')
        });
      }

      // 6. Meetings
      const meetingsList = safeJsonParse(await AsyncStorage.getItem('@meetings'), []);
      meetingsList.forEach((m: any) => {
        compiled.push({
          id: `meet-${m.id}`,
          time: m.time || '11:00 AM',
          type: 'meeting',
          title: `🤝 Meeting: ${m.topic || 'General'}`,
          details: `Client: ${m.participants || 'Client'} at ${m.venue}.`,
          timestamp: createTimestamp(todayStr, m.time || '11:00 AM')
        });
      });

      // 7. DCR Reports
      const reports = safeJsonParse(await AsyncStorage.getItem('@daily_reports'), []);
      reports.forEach((d: any) => {
        compiled.push({
          id: `dcr-${d.id || Date.now()}`,
          time: '07:00 PM',
          type: 'report',
          title: `📄 DCR Submitted`,
          details: `Status: Submitted for ${d.date || todayStr}.`,
          timestamp: createTimestamp(todayStr, '07:00 PM')
        });
      });

      // 8. Target Achievements
      const targets = safeJsonParse(await AsyncStorage.getItem('@targets'), []);
      targets.forEach((t: any) => {
        if (t.achieved >= t.goal) {
          compiled.push({
            id: `tgt-${t.id || Date.now()}`,
            time: '08:00 PM',
            type: 'target',
            title: `🎯 Target Achieved: ${t.title || 'Monthly Sales'}`,
            details: `Congratulations! Goal of ${t.goal} has been reached.`,
            timestamp: createTimestamp(todayStr, '08:00 PM')
          });
        }
      });

      // Sort
      compiled.sort((a, b) => b.timestamp - a.timestamp);
      setLogs(compiled);
    } catch (e) {
      console.log('Error compiling activity logs:', e);
      setError('Failed to compile activity logs.');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { compileActivityLogs(); }, []));

  const filteredLogs = logs.filter((log) => activeTab === 'All' || log.type === activeTab);

  const getBadgeColor = (type: string) => {
    if (type === 'visit') return '#06B6D4'; 
    if (type === 'order') return '#10B981'; 
    if (type === 'expense') return '#F59E0B'; 
    if (type === 'attendance') return '#8B5CF6'; 
    if (type === 'meeting') return '#6366F1'; 
    if (type === 'followup') return '#E11D48'; 
    if (type === 'report') return '#3B82F6';
    if (type === 'target') return '#10B981'; // Same green as success
    return '#4F46E5';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>⬅️ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Activity Tracking</Text>
        <Text style={styles.headerSubtitle}>Track and monitor MR field activities, visit performance, customer interactions, and daily productivity.</Text>
      </View>

      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.kpiScrollContainer}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiValue}>{logs.length}</Text>
            <Text style={styles.kpiLabel}>Total</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiValue}>{logs.filter(l => l.type === 'visit').length}</Text>
            <Text style={styles.kpiLabel}>Visits</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiValue}>{logs.filter(l => l.type === 'order').length}</Text>
            <Text style={styles.kpiLabel}>Orders</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiValue}>{logs.filter(l => l.type === 'meeting').length}</Text>
            <Text style={styles.kpiLabel}>Meetings</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiValue}>{logs.filter(l => l.type === 'report').length}</Text>
            <Text style={styles.kpiLabel}>DCRs</Text>
          </View>
        </ScrollView>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContainer}>
        {(['All', 'visit', 'order', 'meeting', 'expense', 'attendance', 'report', 'followup', 'target'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab === 'All' ? 'ALL' : `${tab.toUpperCase()}S`}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <ActivityIndicator size="large" color="#4F46E5" style={{ marginVertical: 30 }} />
        ) : error ? (
          <View style={[styles.emptyCard, { alignItems: 'center' }]}>
            <Text style={{ color: '#EF4444', fontSize: 14 }}>{error}</Text>
          </View>
        ) : filteredLogs.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={true}>
            <View style={styles.tableContainer}>
              <View style={styles.tableHeader}>
                <Text style={[styles.thText, { width: 80 }]}>Time</Text>
                <Text style={[styles.thText, { width: 85 }]}>Type</Text>
                <Text style={[styles.thText, { width: 180 }]}>Activity</Text>
                <Text style={[styles.thText, { width: 250 }]}>Details</Text>
              </View>
              {filteredLogs.map((log, index) => (
                <View key={`${log.id}-${index}`} style={[styles.tableRow, index % 2 === 1 && styles.tableRowEven]}>
                  <Text style={[styles.tdText, { width: 80, fontWeight: '700', color: '#475569' }]}>{log.time}</Text>
                  <View style={{ width: 85, justifyContent: 'center' }}>
                    <View style={[styles.badge, { backgroundColor: getBadgeColor(log.type) }]}>
                      <Text style={styles.badgeText}>{log.type}</Text>
                    </View>
                  </View>
                  <Text style={[styles.tdText, { width: 180, fontWeight: 'bold', color: '#1E293B' }]}>{log.title}</Text>
                  <Text style={[styles.tdText, { width: 250, color: '#64748B' }]}>{log.details}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No matching activity logs found.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default ActivityTrackingScreen;

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
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#FFFFFF', textAlign: 'center', marginTop: 15 },
  headerSubtitle: { fontSize: 11, color: '#E0E7FF', textAlign: 'center', marginTop: 6, paddingHorizontal: 10, lineHeight: 16 },
  
  kpiScrollContainer: { paddingHorizontal: 15, paddingTop: 20, paddingBottom: 5 },
  kpiCard: { 
    backgroundColor: '#FFFFFF', borderRadius: 16, paddingVertical: 12, paddingHorizontal: 16, 
    marginRight: 10, alignItems: 'center', justifyContent: 'center', minWidth: 80,
    shadowColor: '#000', shadowOpacity: 0.04, elevation: 2 
  },
  kpiValue: { fontSize: 18, fontWeight: 'bold', color: '#1E293B' },
  kpiLabel: { fontSize: 11, color: '#64748B', fontWeight: '600', marginTop: 2 },

  tabsContainer: { paddingHorizontal: 15, marginTop: 15, paddingBottom: 10, gap: 6 },
  tabButton: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, backgroundColor: '#E2E8F0', alignItems: 'center' },
  activeTabButton: { backgroundColor: '#4F46E5' },
  tabText: { fontSize: 10, fontWeight: '700', color: '#64748B' },
  activeTabText: { color: '#FFFFFF' },
  
  scrollContent: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 60 },
  
  tableContainer: {
    backgroundColor: '#FFFFFF', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#E2E8F0', minWidth: 600,
  },
  tableHeader: {
    flexDirection: 'row', backgroundColor: '#F1F5F9', paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#E2E8F0',
  },
  thText: { fontSize: 12, fontWeight: 'bold', color: '#64748B', textTransform: 'uppercase' },
  tableRow: { flexDirection: 'row', paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', backgroundColor: '#FFFFFF' },
  tableRowEven: { backgroundColor: '#F8FAFC' },
  tdText: { fontSize: 12, marginRight: 10 },
  badge: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6, alignSelf: 'flex-start' },
  badgeText: { fontSize: 9, color: '#FFFFFF', fontWeight: 'bold', textTransform: 'uppercase' },

  emptyCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 24, alignItems: 'center', marginTop: 20 },
  emptyText: { fontSize: 13, color: '#94A3B8', fontStyle: 'italic' },
});