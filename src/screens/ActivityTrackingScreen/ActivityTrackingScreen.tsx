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
  id: number;
  time: string;
  type: 'visit' | 'order' | 'expense' | 'attendance';
  title: string;
  details: string;
}

const safeJsonParse = (data: string | null, fallback: any) => {
  if (!data) return fallback;
  try {
    return JSON.parse(data);
  } catch (err) {
    console.log('safeJsonParse error in ActivityTrackingScreen:', err);
    return fallback;
  }
};

const ActivityTrackingScreen = () => {
  const navigation = useNavigation();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [activeTab, setActiveTab] = useState<'All' | 'visit' | 'order' | 'expense' | 'attendance'>('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const compileActivityLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const compiled: ActivityLog[] = [];

      // 1. Fetch Doctor Visits
      const docs = await AsyncStorage.getItem('@doctor_visits');
      const docsList = safeJsonParse(docs, []);
      docsList.forEach((d: any) => {
        compiled.push({
          id: d.id,
          time: d.time || '10:00 AM',
          type: 'visit',
          title: `🩺 Doctor Visited: Dr. ${d.doctorName}`,
          details: `Specialty: ${d.specialty} at ${d.hospital}. Notes: ${d.notes || 'None'}`,
        });
      });

      // 2. Fetch Chemist Visits
      const chemists = await AsyncStorage.getItem('@chemist_visits');
      const chemistsList = safeJsonParse(chemists, []);
      chemistsList.forEach((c: any) => {
        compiled.push({
          id: c.id,
          time: c.time || '12:00 PM',
          type: 'visit',
          title: `💊 Chemist Visited: ${c.shopName}`,
          details: `Order Discussed: ${c.medicine || 'None'} (Qty: ${c.quantity || '0'}). Total value: ₹${c.orderValue || '0'}`,
        });
      });

      // 3. Fetch Orders
      const orders = await AsyncStorage.getItem('@orders');
      const ordersList = safeJsonParse(orders, []);
      ordersList.forEach((o: any) => {
        compiled.push({
          id: o.id,
          time: o.dateFormatted || '02:00 PM',
          type: 'order',
          title: `📦 Order Booked: ${o.orderNumber}`,
          details: `Customer: ${o.customerName} (${o.customerType}). Product: ${o.productName} (Qty: ${o.quantity}). Amount: ₹${o.totalAmount}`,
        });
      });

      // 4. Fetch Expense Claims
      const expenses = await AsyncStorage.getItem('@expense_claims');
      const expensesList = safeJsonParse(expenses, []);
      expensesList.forEach((e: any) => {
        compiled.push({
          id: e.id,
          time: e.date || '04:00 PM',
          type: 'expense',
          title: `💵 Expense Claimed: ${e.category}`,
          details: `Claimed Amount: ₹${e.amount}. Purpose: ${e.remarks}`,
        });
      });

      // 5. Fetch Daily Attendance Status
      const checkedInStatus = await AsyncStorage.getItem('@checked_in');
      if (checkedInStatus === 'true') {
        const checkInTime = await AsyncStorage.getItem('@check_in_time');
        const checkInAddress = await AsyncStorage.getItem('@check_in_address');
        compiled.push({
          // Slightly offset timestamp to avoid collision with standard visits logged at same time
          id: Date.now() - 100, 
          time: checkInTime || '09:00 AM',
          type: 'attendance',
          title: '📍 Daily Attendance: Checked-In',
          details: `Checked in successfully for duty. Location: ${checkInAddress || 'Acquired GPS location'}.`,
        });
      }

      // Sort chronologically (latest first)
      compiled.sort((a, b) => b.id - a.id);
      setLogs(compiled);
    } catch (e) {
      console.log('Error compiling activity logs:', e);
      setError('Failed to compile activity logs.');
    } finally {
      setLoading(false);
    }
  };

  // Triggers reload every time the screen is displayed to the user
  useFocusEffect(
    useCallback(() => {
      compileActivityLogs();
    }, [])
  );

  const filteredLogs = logs.filter((log) => activeTab === 'All' || log.type === activeTab);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>⬅️ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>📋 Activity Logs</Text>
        <Text style={styles.headerSubtitle}>Real-time consolidated field action trail</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {(['All', 'visit', 'order', 'expense', 'attendance'] as const).map((tab) => (
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
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <ActivityIndicator size="large" color="#4F46E5" style={{ marginVertical: 30 }} />
        ) : error ? (
          <View style={[styles.emptyCard, { alignItems: 'center' }]}>
            <Text style={{ color: '#EF4444', fontSize: 14, marginBottom: 12 }}>{error}</Text>
            <TouchableOpacity onPress={compileActivityLogs} style={{ paddingVertical: 10, paddingHorizontal: 20, backgroundColor: '#4F46E5', borderRadius: 8 }}>
              <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 13 }}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : filteredLogs.length > 0 ? (
          filteredLogs.map((log, index) => {
            let badgeColor = '#4F46E5';
            if (log.type === 'visit') badgeColor = '#06B6D4';
            if (log.type === 'order') badgeColor = '#10B981';
            if (log.type === 'expense') badgeColor = '#F59E0B';
            if (log.type === 'attendance') badgeColor = '#8B5CF6'; // Violet color for attendance

            return (
              <View key={`${log.id}-${index}`} style={styles.logCard}>
                <View style={styles.cardHeader}>
                  <Text style={styles.time}>{log.time}</Text>
                  <View style={[styles.badge, { backgroundColor: badgeColor }]}>
                    <Text style={styles.badgeText}>{log.type}</Text>
                  </View>
                </View>

                <Text style={styles.title}>{log.title}</Text>
                <Text style={styles.details}>{log.details}</Text>
              </View>
            );
          })
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No matching activity logs logged today.</Text>
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
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFFFFF', textAlign: 'center' },
  headerSubtitle: { fontSize: 12, color: '#E0E7FF', textAlign: 'center', marginTop: 6 },
  tabsContainer: { flexDirection: 'row', paddingHorizontal: 20, marginTop: 15, gap: 6 },
  tabButton: { flex: 1, paddingVertical: 8, borderRadius: 20, backgroundColor: '#E2E8F0', alignItems: 'center' },
  activeTabButton: { backgroundColor: '#4F46E5' },
  tabText: { fontSize: 8.5, fontWeight: '700', color: '#64748B' },
  activeTabText: { color: '#FFFFFF' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 60 },
  logCard: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.02, elevation: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  time: { fontSize: 11, color: '#94A3B8', fontWeight: '600' },
  badge: { paddingVertical: 2, paddingHorizontal: 6, borderRadius: 8 },
  badgeText: { fontSize: 9, color: '#FFFFFF', fontWeight: 'bold', textTransform: 'uppercase' },
  title: { fontSize: 14, fontWeight: 'bold', color: '#1E293B', marginTop: 6 },
  details: { fontSize: 12, color: '#475569', marginTop: 4, lineHeight: 16 },
  emptyCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 24, alignItems: 'center' },
  emptyText: { fontSize: 13, color: '#94A3B8', fontStyle: 'italic' },
});