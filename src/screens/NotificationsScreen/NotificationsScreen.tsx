import React, { useCallback, useState } from 'react';
import {
  Alert,
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

// ── API Services (no AsyncStorage for data) ──────────────────────────────────
import { getDoctorVisitsByMr } from '../../services/doctorService';
import { getChemistVisitsByMr } from '../../services/chemistService';
import { getAttendanceLogs } from '../../services/attendanceService';
import { getMeetingsByMr } from '../../services/meetingService';
import { getFollowUpsByMr } from '../../services/followUpService';

// ── Types ─────────────────────────────────────────────────────────────────────
type NotifType =
  | 'announcement'
  | 'stock'
  | 'birthday'
  | 'message'
  | 'attendance'
  | 'territory'
  | 'followup'
  | 'meeting'
  | 'activity';

interface NotificationItem {
  id: string | number;
  type: NotifType;
  title: string;
  message: string;
  time: string;
  unread: boolean;
}

type TabKey = 'All' | 'Alerts' | 'Follow-Ups' | 'Announcements';

// ── Helpers ───────────────────────────────────────────────────────────────────
async function safeCall<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    const result = await fn();
    return (result ?? fallback) as T;
  } catch {
    return fallback;
  }
}

const formatRelativeTime = (raw: string | null | undefined): string => {
  if (!raw) return 'Unknown time';
  const date = new Date(raw);
  if (isNaN(date.getTime())) return 'Unknown time';
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const h = date.getHours();
  const m = date.getMinutes().toString().padStart(2, '0');
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = ((h % 12) || 12).toString();
  const timeStr = `${hour}:${m} ${period}`;

  if (diffDays === 0) return `Today, ${timeStr}`;
  if (diffDays === 1) return `Yesterday, ${timeStr}`;
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString('en-GB');
};

const toEpoch = (raw: string | null | undefined): number => {
  if (!raw) return 0;
  const t = new Date(raw).getTime();
  return isNaN(t) ? 0 : t;
};

// ── Avatar config per type ────────────────────────────────────────────────────
const AVATAR: Record<string, { emoji: string; bg: string }> = {
  stock:        { emoji: '⚠️',  bg: '#FFE4E6' },
  attendance:   { emoji: '📋',  bg: '#EFF6FF' },
  territory:    { emoji: '🗺️', bg: '#ECFDF5' },
  followup:     { emoji: '📅',  bg: '#F5F3FF' },
  meeting:      { emoji: '🤝',  bg: '#E0E7FF' },
  activity:     { emoji: '⚡',  bg: '#FEF08A' },
  birthday:     { emoji: '🎂',  bg: '#FDF2F8' },
  message:      { emoji: '💬',  bg: '#EFF6FF' },
  announcement: { emoji: '📢',  bg: '#FEF3C7' },
};

// ── Main Component ────────────────────────────────────────────────────────────
const NotificationsScreen = () => {
  const navigation = useNavigation<any>();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [readIds, setReadIds]               = useState<Set<string | number>>(new Set());
  const [activeTab, setActiveTab]           = useState<TabKey>('All');
  const [loading, setLoading]               = useState(true);

  // ── Load notifications from APIs ────────────────────────────────────────────
  const loadNotifications = async () => {
    setLoading(true);
    try {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      const compiled: NotificationItem[] = [];

      // ── 1. Follow-Up Alerts from API ──────────────────────────────────────
      const followUps = await safeCall(() => getFollowUpsByMr(), []);
      const fupArr = Array.isArray(followUps) ? followUps : [];
      fupArr.forEach((f: any) => {
        const rawDate = f.followUpDate || f.scheduledDate || f.createdAt;
        const dueDate = rawDate ? rawDate.split('T')[0] : null;
        const isPending = String(f.status || '').toLowerCase() !== 'completed'
          && String(f.status || '').toLowerCase() !== 'cancelled';

        if (dueDate && dueDate <= todayStr && isPending) {
          const doctorName =
            f.doctor?.name || f.doctorName || (f.doctorId ? `Doctor #${f.doctorId}` : 'Doctor');
          compiled.push({
            id:      `fup-${f.id}`,
            type:    'followup',
            title:   `⏰ Follow-Up Due: Dr. ${doctorName}`,
            message: `Scheduled follow-up${dueDate < todayStr ? ' was' : ' is'} due today. Remarks: ${f.remarks || f.notes || 'None'}`,
            time:    formatRelativeTime(rawDate),
            unread:  true,
          });
        }
      });

      // ── 2. Meeting Alerts from API ────────────────────────────────────────
      const meetings = await safeCall(() => getMeetingsByMr(), []);
      const meetArr = Array.isArray(meetings) ? meetings : [];
      meetArr.forEach((m: any) => {
        const rawDate = m.meetingDate || m.date || m.createdAt;
        const meetDate = rawDate ? rawDate.split('T')[0] : null;
        const isToday = meetDate === todayStr;
        const isScheduled = String(m.status || '').toLowerCase() === 'scheduled'
          || !m.status;

        if (isToday && isScheduled) {
          compiled.push({
            id:      `meet-${m.id}`,
            type:    'meeting',
            title:   `🤝 Meeting Today: ${m.topic || m.title || 'General Meeting'}`,
            message: `Meeting scheduled at ${m.venue || m.location || '—'} with ${m.attendees || m.participants || 'team'}.`,
            time:    formatRelativeTime(rawDate),
            unread:  true,
          });
        }
      });

      // ── 3. Attendance Alerts from API ─────────────────────────────────────
      const attendance = await safeCall(() => getAttendanceLogs(), []);
      const attArr = Array.isArray(attendance) ? attendance : [];
      // Find today's record
      const todayAtt = attArr.find((a: any) => {
        const d = a.checkInTime || a.checkinTime || a.createdAt || '';
        return d.startsWith(todayStr);
      });

      if (todayAtt) {
        const hasCheckedIn  = !!(todayAtt.checkInTime || todayAtt.checkinTime);
        const hasCheckedOut = !!(todayAtt.checkOutTime || todayAtt.checkoutTime);

        if (hasCheckedIn && !hasCheckedOut) {
          compiled.push({
            id:      'att-checkout-pending',
            type:    'attendance',
            title:   '📋 Check-Out Pending',
            message: 'You checked in today but have not checked out yet. Please update attendance before end of day.',
            time:    'Today',
            unread:  true,
          });
        }
        if (!hasCheckedIn) {
          compiled.push({
            id:      'att-checkin-missing',
            type:    'attendance',
            title:   '⚠️ Attendance Not Marked',
            message: 'You have not checked in today. Please mark attendance from the Attendance screen.',
            time:    'Today',
            unread:  true,
          });
        }
      } else {
        // No attendance record today at all
        compiled.push({
          id:      'att-checkin-missing',
          type:    'attendance',
          title:   '⚠️ Attendance Not Marked',
          message: 'You have not checked in today. Please mark attendance from the Attendance screen.',
          time:    'Today',
          unread:  true,
        });
      }

      // ── 4. Doctor Visit Summary (activity notification) ───────────────────
      const doctorVisits = await safeCall(() => getDoctorVisitsByMr(), []);
      const dvArr = Array.isArray(doctorVisits) ? doctorVisits : [];
      // Find visits done today
      const todayVisits = dvArr.filter((d: any) => {
        const raw = d.visitDate || d.createdAt || '';
        return raw.startsWith(todayStr);
      });

      if (todayVisits.length > 0) {
        compiled.push({
          id:      'activity-doctor-today',
          type:    'activity',
          title:   `⚡ ${todayVisits.length} Doctor Visit${todayVisits.length > 1 ? 's' : ''} Today`,
          message: `You have completed ${todayVisits.length} doctor visit(s) today. Keep up the great work!`,
          time:    'Today',
          unread:  false,
        });
      }

      // ── 5. Chemist Visit Summary ──────────────────────────────────────────
      const chemistVisits = await safeCall(() => getChemistVisitsByMr(), []);
      const cvArr = Array.isArray(chemistVisits) ? chemistVisits : [];
      const todayChemist = cvArr.filter((c: any) => {
        const raw = c.visitDate || c.createdAt || '';
        return raw.startsWith(todayStr);
      });
      if (todayChemist.length > 0) {
        compiled.push({
          id:      'activity-chemist-today',
          type:    'activity',
          title:   `⚡ ${todayChemist.length} Chemist Visit${todayChemist.length > 1 ? 's' : ''} Today`,
          message: `You have completed ${todayChemist.length} chemist visit(s) today.`,
          time:    'Today',
          unread:  false,
        });
      }

      // ── 6. Upcoming Follow-Ups (next 3 days) ─────────────────────────────
      const threeDaysLater = new Date(today);
      threeDaysLater.setDate(today.getDate() + 3);
      const threeDaysStr = threeDaysLater.toISOString().split('T')[0];

      const upcomingFups = fupArr.filter((f: any) => {
        const dueDate = (f.followUpDate || f.scheduledDate || '').split('T')[0];
        const isPending = String(f.status || '').toLowerCase() !== 'completed'
          && String(f.status || '').toLowerCase() !== 'cancelled';
        return dueDate > todayStr && dueDate <= threeDaysStr && isPending;
      });

      upcomingFups.forEach((f: any) => {
        const rawDate = f.followUpDate || f.scheduledDate;
        const doctorName =
          f.doctor?.name || f.doctorName || (f.doctorId ? `Doctor #${f.doctorId}` : 'Doctor');
        compiled.push({
          id:      `fup-upcoming-${f.id}`,
          type:    'followup',
          title:   `🔔 Upcoming Follow-Up: Dr. ${doctorName}`,
          message: `Follow-up scheduled for ${rawDate ? new Date(rawDate).toLocaleDateString('en-GB') : 'soon'}.`,
          time:    formatRelativeTime(rawDate),
          unread:  false,
        });
      });

      // ── Sort: unread first, then by recency ───────────────────────────────
      compiled.sort((a, b) => {
        if (a.unread !== b.unread) return a.unread ? -1 : 1;
        return 0;
      });

      // ── Restore read status from current state ────────────────────────────
      const finalNotifs = compiled.map(n => ({
        ...n,
        unread: readIds.has(n.id) ? false : n.unread,
      }));

      setNotifications(finalNotifs);
    } catch (e) {
      console.error('Failed to load notifications:', e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { loadNotifications(); }, []));

  // ── Mark all read ─────────────────────────────────────────────────────────
  const handleMarkAllRead = () => {
    const allIds = new Set(notifications.map(n => n.id));
    setReadIds(allIds);
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  // ── Toggle single read ────────────────────────────────────────────────────
  const handleToggleRead = (id: string | number) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, unread: !n.unread } : n)
    );
    setReadIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // ── Tap to navigate ───────────────────────────────────────────────────────
  const handleNotificationPress = (item: NotificationItem) => {
    // Mark as read
    if (item.unread) {
      handleToggleRead(item.id);
    }

    switch (item.type) {
      case 'followup':
        navigation.navigate('FollowUpReminders');
        break;
      case 'meeting':
        navigation.navigate('MeetingScheduling');
        break;
      case 'attendance':
        navigation.navigate('Attendance');
        break;
      case 'territory':
        navigation.navigate('TerritoryTracking');
        break;
      case 'stock':
        navigation.navigate('ProductCatalog');
        break;
      case 'activity':
        navigation.navigate('ActivityTracking');
        break;
      default:
        if (Platform.OS === 'web') {
          window.alert(`${item.title}\n\n${item.message}`);
        } else {
          Alert.alert(item.title, item.message);
        }
    }
  };

  // ── Clear all ────────────────────────────────────────────────────────────
  const handleClearAll = () => {
    const confirm = Platform.OS === 'web'
      ? window.confirm('Clear all notifications?')
      : true;
    if (confirm) {
      setNotifications([]);
      setReadIds(new Set());
    }
  };

  // ── Tab filtering ─────────────────────────────────────────────────────────
  const isAlertType    = (t: string) => ['stock', 'attendance', 'territory'].includes(t);
  const isFollowUpType = (t: string) => ['followup', 'meeting'].includes(t);
  const isAnnouncType  = (t: string) => ['announcement', 'message', 'birthday', 'activity'].includes(t);

  const filteredList = notifications.filter(item => {
    if (activeTab === 'Alerts')        return isAlertType(item.type);
    if (activeTab === 'Follow-Ups')    return isFollowUpType(item.type);
    if (activeTab === 'Announcements') return isAnnouncType(item.type);
    return true;
  });

  const getUnreadCount = (tab: TabKey): number =>
    notifications.filter(n => {
      if (!n.unread) return false;
      if (tab === 'Alerts')        return isAlertType(n.type);
      if (tab === 'Follow-Ups')    return isFollowUpType(n.type);
      if (tab === 'Announcements') return isAnnouncType(n.type);
      return true;
    }).length;

  const unreadCount = notifications.filter(n => n.unread).length;
  const TABS: TabKey[] = ['All', 'Alerts', 'Follow-Ups', 'Announcements'];

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🔔 Notification Center</Text>
        <Text style={styles.headerSubtitle}>
          {loading
            ? 'Loading notifications…'
            : unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
              : "You're all caught up! ✅"}
        </Text>
      </View>

      {/* ── Controls ───────────────────────────────────────────────────── */}
      <View style={styles.controlRow}>
        <TouchableOpacity onPress={handleMarkAllRead} style={styles.controlBtn}>
          <Text style={styles.controlBtnText}>✔️ Mark all read</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={loadNotifications} style={styles.controlBtn}>
          <Text style={styles.controlBtnText}>🔄 Refresh</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleClearAll} style={styles.controlBtn}>
          <Text style={[styles.controlBtnText, { color: '#E11D48' }]}>🗑️ Clear all</Text>
        </TouchableOpacity>
      </View>

      {/* ── Tabs ───────────────────────────────────────────────────────── */}
      <View style={styles.tabBarWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabScrollContainer}
        >
          {TABS.map(tab => {
            const count = getUnreadCount(tab);
            const isActive = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={[styles.tabButton, isActive && styles.activeTabButton]}
                hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
              >
                <Text style={[styles.tabText, isActive && styles.activeTabText]}>
                  {tab}{count > 0 ? ` (${count})` : ''}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Notification List ───────────────────────────────────────────── */}
      <ScrollView contentContainerStyle={styles.listContainer}>
        {loading ? (
          <ActivityIndicator size="large" color="#4F46E5" style={{ marginVertical: 40 }} />
        ) : filteredList.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>
              {activeTab === 'Follow-Ups' ? '📅' : activeTab === 'Alerts' ? '✅' : '🔔'}
            </Text>
            <Text style={styles.emptyTitle}>
              {activeTab === 'Follow-Ups'
                ? 'No pending follow-ups'
                : activeTab === 'Alerts'
                  ? 'No active alerts'
                  : 'No notifications'}
            </Text>
            <Text style={styles.emptySubText}>
              {activeTab === 'Follow-Ups'
                ? 'All your follow-ups are done or scheduled in the future.'
                : activeTab === 'Alerts'
                  ? 'All attendance and stock alerts are clear.'
                  : "You're all caught up! Check back later."}
            </Text>
          </View>
        ) : (
          filteredList.map(item => {
            const av = AVATAR[item.type] ?? AVATAR.announcement;
            return (
              <TouchableOpacity
                key={String(item.id)}
                activeOpacity={0.78}
                onPress={() => handleNotificationPress(item)}
                onLongPress={() => handleToggleRead(item.id)}
                delayLongPress={350}
                style={[styles.card, !item.unread && styles.readCard]}
              >
                {/* Unread bar */}
                {item.unread && <View style={styles.unreadBar} />}

                {/* Avatar */}
                <View style={[styles.avatarContainer, { backgroundColor: av.bg }]}>
                  <Text style={styles.avatarEmoji}>{av.emoji}</Text>
                </View>

                {/* Text content */}
                <View style={{ flex: 1 }}>
                  <View style={styles.cardHeader}>
                    <Text
                      style={[styles.cardTitle, item.unread && styles.unreadTitle]}
                      numberOfLines={2}
                    >
                      {item.title}
                    </Text>
                    {item.unread && <View style={styles.unreadDot} />}
                  </View>
                  <Text style={styles.cardMessage} numberOfLines={3}>
                    {item.message}
                  </Text>
                  <Text style={styles.cardTime}>{item.time}</Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
};

export default NotificationsScreen;

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },

  header: {
    backgroundColor: '#4F46E5',
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginBottom: 12,
  },
  backButtonText: { fontSize: 14, color: '#FFFFFF', fontWeight: '700' },
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
    lineHeight: 17,
  },

  controlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 14,
    marginBottom: 4,
  },
  controlBtn: { paddingVertical: 6 },
  controlBtnText: { fontSize: 12, fontWeight: '700', color: '#4F46E5' },

  tabBarWrapper: { marginTop: 8, marginBottom: 4, height: 44 },
  tabScrollContainer: {
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 8,
  },
  tabButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E2E8F0',
  },
  activeTabButton: { backgroundColor: '#4F46E5' },
  tabText: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  activeTabText: { color: '#FFFFFF' },

  listContainer: { paddingHorizontal: 16, paddingTop: 12 },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
    overflow: 'hidden',
  },
  readCard: { opacity: 0.65 },
  unreadBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: '#4F46E5',
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginLeft: 6,
  },
  avatarEmoji: { fontSize: 22 },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingRight: 4,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    flex: 1,
    lineHeight: 18,
  },
  unreadTitle: { color: '#0F172A', fontWeight: '700' },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4F46E5',
    marginLeft: 6,
    marginTop: 5,
  },
  cardMessage: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    lineHeight: 17,
  },
  cardTime: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 6,
    fontWeight: '600',
  },

  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 36,
    alignItems: 'center',
    marginTop: 20,
  },
  emptyIcon:    { fontSize: 44, marginBottom: 12 },
  emptyTitle:   { fontSize: 16, fontWeight: '700', color: '#334155', textAlign: 'center' },
  emptySubText: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 18,
  },
});
