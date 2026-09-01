import React, { useState, useEffect } from 'react';
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';

const ASMNotificationsScreen = () => {
  
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const token = await AsyncStorage.getItem('@token');
      const headers = { Authorization: `Bearer ${token}` };

      const [dashRes, attdRes] = await Promise.all([
        api.get('/dashboard/asm', { headers }).catch(() => null),
        api.get('/attendance', { headers }).catch(() => null)
      ]);

      const synthesized: any[] = [];
      let idCounter = 1;

      // 1. Performance Alerts
      if (dashRes?.data?.data?.teamPerformance) {
        dashRes.data.data.teamPerformance.forEach((member: any) => {
          const achvPct = parseFloat((member.achvPct || '').replace('%', '')) || 0;
          if (achvPct < 80) {
            synthesized.push({
              id: idCounter++,
              title: 'Target Risk Alert',
              message: `${member.name || member.empName || 'Team Member'} achieved only ${member.achvPct} of target. Action required.`,
              time: '10:00 AM',
              dateGroup: 'Today',
              type: 'target',
              read: false,
              bg: '#FEE2E2',
              iconColor: '#DC2626'
            });
          } else if (achvPct >= 100) {
            synthesized.push({
              id: idCounter++,
              title: 'Target Achieved',
              message: `${member.name || member.empName || 'Team Member'} has successfully achieved ${member.achvPct} of their target!`,
              time: '09:30 AM',
              dateGroup: 'Today',
              type: 'performance',
              read: false,
              bg: '#DCFCE7',
              iconColor: '#15803D'
            });
          }
        });
      }

      // 3. System Alerts
      synthesized.push({
        id: idCounter++,
        title: 'System Update',
        message: 'Monthly sales targets have been rolled out.',
        time: '08:00 AM',
        dateGroup: 'Yesterday',
        type: 'system',
        read: true,
        bg: '#F3E8FF',
        iconColor: '#7E22CE'
      });

      setNotifications(synthesized);

    } catch (error) {
      console.log('Error synthesizing ASM notifications', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
    Alert.alert('Success', 'All notifications marked as read.');
  };

  const handleClearAll = () => {
    setNotifications([]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>🔔 Notifications Inbox</Text>
            <Text style={styles.subtitle}>In-app system notifications, target alerts & attendance warnings.</Text>
          </View>
        </View>

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
        {notifications.length === 0 && (
            <View style={{ padding: 40, alignItems: 'center' }}>
                <Ionicons name="notifications-off-outline" size={48} color="#CBD5E1" />
                <Text style={{ marginTop: 16, color: '#64748B', fontSize: 14 }}>No notifications available</Text>
            </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default ASMNotificationsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { padding: 16 },
  headerRow: { marginBottom: 12 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#0F172A' },
  subtitle: { fontSize: 12, color: '#64748B', marginTop: 2 },
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
