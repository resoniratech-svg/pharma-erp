import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

interface ActivityNotification {
  id: string | number;
  title: string;
  message: string;
  time: string;
  module: 'order' | 'attendance' | 'dcr' | 'visit' | 'target';
}

const safeJsonParse = (data: string | null, fallback: any) => {
  if (!data) return fallback;
  try { return JSON.parse(data); } catch (e) { return fallback; }
};

const ActivityNotificationsScreen = () => {
  const navigation = useNavigation<any>();
  const [notifications, setNotifications] = useState<ActivityNotification[]>([]);

  const loadActivityNotifications = async () => {
    try {
      const compiled: ActivityNotification[] = [];
      const todayStr = new Date().toISOString().split('T')[0];

      // 1. Order Success Notifications
      const orders = safeJsonParse(await AsyncStorage.getItem('@orders'), []);
      orders.forEach((o: any) => {
        compiled.push({
          id: `ord-${o.id}`,
          title: `Order Booked Successfully`,
          message: `Order ${o.orderNumber || 'recorded'} for ${o.customerName} has been saved in the system.`,
          time: o.dateFormatted || 'Today',
          module: 'order'
        });
      });

      // 2. Attendance Notifications
      if (await AsyncStorage.getItem('@checked_in') === 'true') {
        const time = await AsyncStorage.getItem('@check_in_time');
        compiled.push({
          id: 'att-in',
          title: `Attendance Checked In`,
          message: `Your location and check-in time have been successfully logged.`,
          time: time || 'Today',
          module: 'attendance'
        });
      }

      // 3. Daily Report Notifications
      const dcrs = safeJsonParse(await AsyncStorage.getItem('@daily_reports'), []);
      dcrs.forEach((d: any) => {
        compiled.push({
          id: `dcr-${d.id || Date.now()}`,
          title: `DCR Submitted`,
          message: `Your Daily Call Report for ${d.date || todayStr} was successfully submitted to your manager.`,
          time: 'Today',
          module: 'dcr'
        });
      });

      // 4. Target Progress
      compiled.push({
        id: 'tgt-1',
        title: `Target Progress Updated`,
        message: `Congratulations! Your monthly sales target has crossed 70% completion.`,
        time: '1 hour ago',
        module: 'target'
      });

      // 5. Doctor Visit Notifications
      const doctorVisits = safeJsonParse(await AsyncStorage.getItem('@doctor_visits'), []);
      doctorVisits.forEach((visit: any) => {
        compiled.push({
          id: `doc-${visit.id}`,
          title: 'Doctor Visit Logged',
          message: `Visit recorded for Dr. ${visit.doctorName}.`,
          time: visit.time || visit.date || 'Today',
          module: 'visit'
        });
      });

      // 6. Chemist Visit Notifications
      const chemistVisits = safeJsonParse(await AsyncStorage.getItem('@chemist_visits'), []);
      chemistVisits.forEach((visit: any) => {
        compiled.push({
          id: `chem-${visit.id}`,
          title: 'Chemist Visit Logged',
          message: `Visit recorded for ${visit.shopName}.`,
          time: visit.time || visit.date || 'Today',
          module: 'visit'
        });
      });

      // Sort so latest is on top
      setNotifications(compiled.reverse()); 
    } catch (e) {
      console.log('Error loading activity notifications', e);
    }
  };

  useFocusEffect(useCallback(() => { loadActivityNotifications(); }, []));

  const getIcon = (module: string) => {
    switch (module) {
      case 'order': return '📦';
      case 'attendance': return '📍';
      case 'dcr': return '📄';
      case 'target': return '🎯';
      case 'visit': return '🏥';
      default: return '✅';
    }
  };

  const getColor = (module: string) => {
    switch (module) {
      case 'order': return '#DEF7EC'; // Green
      case 'attendance': return '#E0E7FF'; // Indigo
      case 'dcr': return '#FEF3C7'; // Yellow
      case 'target': return '#ECFEFF'; // Cyan
      case 'visit': return '#DBEAFE'; // Light Blue
      default: return '#F1F5F9';
    }
  };

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

      <ScrollView contentContainerStyle={styles.listContainer}>
        {notifications.length > 0 ? (
          notifications.map((item) => (
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
            <Text style={styles.emptyText}>No recent activity notifications.</Text>
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