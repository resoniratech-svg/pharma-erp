import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { getAllNotifications, markAsRead } from '../services/notificationService';

const RSMNotificationsScreen = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [])
  );

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await getAllNotifications();
      if (data && data.length > 0) {
        setNotifications(data.map((item: any) => ({
          id: item.id.toString(),
          title: item.title,
          message: item.message,
          time: new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          dateGroup: new Date(item.createdAt).toLocaleDateString() === new Date().toLocaleDateString() ? 'Today' : new Date(item.createdAt).toLocaleDateString(),
          type: item.type.toLowerCase(),
          read: item.isRead,
          bg: item.isRead ? '#F1F5F9' : '#EEF2FF',
          iconColor: item.isRead ? '#64748B' : '#4F46E5',
        })));
      } else {
        setNotifications([]);
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
    Alert.alert('✅ Marked Read', 'All notifications marked as read.');
  };

  const handleClearAll = () => {
    setNotifications([]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>🔔 Notifications Inbox</Text>
            <Text style={styles.subtitle}>In-app system notifications, target alerts & attendance warnings.</Text>
          </View>
        </View>

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

        {loading ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#4F46E5" />
            <Text style={{ marginTop: 10, color: '#6B7280' }}>Loading notifications...</Text>
          </View>
        ) : (
          <>
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
        </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default RSMNotificationsScreen;

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
