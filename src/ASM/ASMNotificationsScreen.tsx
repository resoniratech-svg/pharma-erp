import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { ASM_ROUTES } from './ASMDashboardScreen';

const ASMNotificationsScreen = () => {
  const navigation = useNavigation<any>();
  const [notifications, setNotifications] = useState([
    { id: '1', title: 'Target Allocated', message: 'Annual Target for your Area has been allocated by RSM.', time: '10:30 AM', dateGroup: 'Today', type: 'target', read: false, bg: '#EEF2FF', iconColor: '#4F46E5' },
    { id: '2', title: 'MR Attendance', message: '2 Late check-ins detected in your territory today.', time: '09:15 AM', dateGroup: 'Today', type: 'attendance', read: false, bg: '#FEE2E2', iconColor: '#DC2626' },
    { id: '3', title: 'Doctor Visit Alert', message: 'Dr. Sharma visit report is missing for this week.', time: 'Yesterday', dateGroup: 'Yesterday', type: 'performance', read: true, bg: '#FEF3C7', iconColor: '#D97706' },
    { id: '4', title: 'System Notification', message: 'Pharma ERP system scheduled maintenance on Aug 05.', time: '28 Jul', dateGroup: 'Earlier', type: 'system', read: true, bg: '#F1F5F9', iconColor: '#64748B' },
  ]);

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
    Alert.alert('✅ Marked Read', 'All notifications marked as read.');
  };

  const handleClearAll = () => {
    setNotifications([]);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.navigate(ASM_ROUTES.DASHBOARD)} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#0F172A" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>🔔 Notifications Inbox</Text>
            <Text style={styles.subtitle}>In-app system notifications & MR alerts.</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.markBtn} onPress={handleMarkAllRead}>
            <Ionicons name="checkmark-done-outline" size={16} color="#4F46E5" />
            <Text style={styles.markBtnText}>Mark All Read</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.clearBtn} onPress={handleClearAll}>
            <Ionicons name="trash-outline" size={16} color="#DC2626" />
            <Text style={styles.clearBtnText}>Delete All</Text>
          </TouchableOpacity>
        </View>

        {/* Notification Groups */}
        {['Today', 'Yesterday', 'Earlier'].map((group) => {
          const groupItems = notifications.filter((n) => n.dateGroup === group);
          if (groupItems.length === 0) return null;

          return (
            <View key={group} style={{ marginBottom: 16 }}>
              <Text style={styles.groupHeader}>{group}</Text>
              <View style={styles.card}>
                {groupItems.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.notifRow, !item.read && styles.unreadRow]}
                    onPress={() => setNotifications((prev) => prev.map((n) => (n.id === item.id ? { ...n, read: true } : n)))}
                  >
                    <View style={[styles.iconBox, { backgroundColor: item.bg }]}>
                      <Ionicons name={item.type === 'target' ? 'disc-outline' : item.type === 'attendance' ? 'time-outline' : item.type === 'performance' ? 'trophy-outline' : 'notifications-outline'} size={20} color={item.iconColor} />
                    </View>

                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={styles.notifTitle}>{item.title}</Text>
                        <Text style={styles.notifTime}>{item.time}</Text>
                      </View>
                      <Text style={styles.notifMsg}>{item.message}</Text>
                    </View>

                    {!item.read && <View style={styles.unreadDot} />}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
};

export default ASMNotificationsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: 16, 
    backgroundColor: '#FFF', 
    borderBottomWidth: 1, 
    borderBottomColor: '#E2E8F0',
    gap: 12
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1
  },
  backBtn: { 
    padding: 6, 
    marginRight: 12, 
    backgroundColor: '#F1F5F9', 
    borderRadius: 8,
    marginTop: 2
  },
  title: { fontSize: 20, fontWeight: 'bold', color: '#0F172A' },
  subtitle: { fontSize: 12, color: '#64748B', marginTop: 2 },
  scrollContent: { padding: 16 },
  actionRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginBottom: 16 },
  markBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EEF2FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, gap: 4 },
  markBtnText: { color: '#4F46E5', fontWeight: 'bold', fontSize: 12 },
  clearBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEE2E2', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, gap: 4 },
  clearBtnText: { color: '#DC2626', fontWeight: 'bold', fontSize: 12 },
  groupHeader: { fontSize: 12, fontWeight: 'bold', color: '#64748B', marginBottom: 8, textTransform: 'uppercase' },
  card: { backgroundColor: '#FFF', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', overflow: 'hidden' },
  notifRow: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  unreadRow: { backgroundColor: '#F8FAFC' },
  iconBox: { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  notifTitle: { fontSize: 13, fontWeight: 'bold', color: '#0F172A' },
  notifTime: { fontSize: 10, color: '#94A3B8' },
  notifMsg: { fontSize: 11, color: '#64748B', marginTop: 2 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4F46E5', marginLeft: 8 },
});
