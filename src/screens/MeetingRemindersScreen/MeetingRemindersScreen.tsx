import React, { useState, useCallback } from 'react';
import {
  getMeetingsByMr
} from '../../services/meetingService';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  Linking,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

interface MeetingReminder {
  id: string;
  topic: string;
  participants: string;
  date: string;
  time: string;
  venue: string;
  status: string;
  timestamp: number;
  isToday: boolean;
  daysText: string;
  meetingType: string;
  meetingMode: string;
  outcome: string;
  description: string;
  organizer: string;
  meetingLink?: string;
  rawDoctors?: string;
  rawChemists?: string;
}

const getDaysRemaining = (dateStr: string, todayStr: string) => {
  if (dateStr === todayStr) return 'Today';
  
  const today = new Date(todayStr);
  const target = new Date(dateStr);
  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) return 'Tomorrow';
  return `In ${diffDays} Days`;
};

const getStatusColor = (status: string) => {
  switch (status.toUpperCase()) {
    case 'SCHEDULED':    return '#3B82F6'; // Blue
    case 'COMPLETED':    return '#10B981'; // Green
    case 'RESCHEDULED':  return '#F59E0B'; // Orange
    case 'CANCELLED':    return '#64748B'; // Gray
    default:             return '#94A3B8'; // Neutral gray for unknown
  }
};

const MeetingRemindersScreen = () => {
  const navigation = useNavigation<any>();
  const [reminders, setReminders] = useState<MeetingReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReminder, setSelectedReminder] = useState<MeetingReminder | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const fetchMeetingReminders = async () => {
    setLoading(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const meetingsData = await getMeetingsByMr();
      const meetingsList = Array.isArray(meetingsData) ? meetingsData : [];
      
      const upcomingReminders: MeetingReminder[] = [];

      meetingsList.forEach((m: any) => {
        if (!m.meetingDate) return;
        const meetingDate = new Date(m.meetingDate).toISOString().split('T')[0];

        const isCompleted = m.status === 'COMPLETED' || m.status === 'Completed';
        const isCancelled = m.status === 'CANCELLED' || m.status === 'Cancelled';

        if (!isCompleted && !isCancelled) {
          // Participants: only show if backend returns actual attendees
          let participantStr = '';
          if (m.meetingDoctors && m.meetingDoctors.length > 0) {
            participantStr = `${m.meetingDoctors.length} Doctor(s)`;
          } else if (m.meetingChemists && m.meetingChemists.length > 0) {
            participantStr = `${m.meetingChemists.length} Chemist(s)`;
          }

          // Resolve names for detail modal
          let rawDoctors = '';
          if (m.meetingDoctors && m.meetingDoctors.length > 0) {
            rawDoctors = m.meetingDoctors.map((d: any) => d.doctor?.name || d.doctor?.doctorName || 'N/A').join(', ');
          }
          let rawChemists = '';
          if (m.meetingChemists && m.meetingChemists.length > 0) {
            rawChemists = m.meetingChemists.map((c: any) => c.chemist?.name || 'N/A').join(', ');
          }

          upcomingReminders.push({
            id: m.id.toString(),
            topic: m.title || '',               // Hide if not returned by backend
            participants: participantStr,        // Empty if no participants from backend
            date: meetingDate,
            time: new Date(m.meetingDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            venue: m.location || '',             // Hide if not returned by backend
            status: m.status || '',              // Empty, badge hidden if no status
            timestamp: new Date(m.meetingDate).getTime(),
            isToday: meetingDate === todayStr,
            daysText: getDaysRemaining(meetingDate, todayStr),
            meetingType: m.meetingType || 'General Meeting',
            meetingMode: m.meetingMode || 'Physical',
            outcome: m.outcome || 'General Sync',
            description: m.description || '',
            organizer: m.mr?.name || m.organizer || 'N/A',
            meetingLink: m.meetingLink || '',
            rawDoctors,
            rawChemists,
          });
        }
      });

      upcomingReminders.sort((a, b) => a.timestamp - b.timestamp);
      setReminders(upcomingReminders);
    } catch (e) {
      console.log('Error fetching meeting reminders:', e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchMeetingReminders();
    }, [])
  );

  const todayReminders = reminders.filter(r => r.isToday);
  const futureReminders = reminders.filter(r => !r.isToday);

  // Reusable card renderer used for both Today and Upcoming sections
  const renderCard = (reminder: MeetingReminder, isToday: boolean) => (
    <View key={reminder.id} style={[styles.reminderCard, isToday && styles.todayCard]}>
      <View style={styles.cardHeader}>
        {/* Topic: only render if backend provides it */}
        {reminder.topic ? (
          <Text style={styles.topic}>{reminder.topic}</Text>
        ) : (
          <Text style={[styles.topic, { color: '#94A3B8' }]}>Untitled Meeting</Text>
        )}

        {/* Status badge: only render if status is present */}
        {reminder.status ? (
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(reminder.status) }]}>
            <Text style={styles.statusText}>{reminder.status.toUpperCase()}</Text>
          </View>
        ) : null}
      </View>

      {/* Participants: only render if backend returned attendees */}
      {reminder.participants ? (
        <Text style={styles.clientText}>🤝 {reminder.participants}</Text>
      ) : null}

      <View style={styles.timeRow}>
        <View style={styles.iconText}>
          <Text style={styles.icon}>{isToday ? '⏰' : '📅'}</Text>
          <Text style={styles.timeText}>{reminder.time} ({reminder.daysText})</Text>
        </View>

        {/* Venue: only render if backend returned a location */}
        {reminder.venue ? (
          <View style={styles.iconText}>
            <Text style={styles.icon}>📍</Text>
            <Text style={styles.timeText}>{reminder.venue}</Text>
          </View>
        ) : null}
      </View>

      <TouchableOpacity
        style={isToday ? styles.actionButton : styles.actionButtonNeutral}
        onPress={() => {
          setSelectedReminder(reminder);
          setModalVisible(true);
        }}
      >
        <Text style={isToday ? styles.actionButtonText : styles.actionButtonTextNeutral}>
          View Details
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>⬅️ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Meeting Reminders</Text>
        <Text style={styles.headerSubtitle}>Upcoming doctor meetings and product presentations</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <ActivityIndicator size="large" color="#4F46E5" style={{ marginTop: 40 }} />
        ) : reminders.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🗓️</Text>
            <Text style={styles.emptyTitle}>No Upcoming Meetings</Text>
            <Text style={styles.emptySubtitle}>You don't have any scheduled meetings right now.</Text>
          </View>
        ) : (
          <View>
            {/* Today's Meetings Section */}
            {todayReminders.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🔴 Due Today ({todayReminders.length})</Text>
                {todayReminders.map(reminder => renderCard(reminder, true))}
              </View>
            )}

            {/* Upcoming Meetings Section */}
            {futureReminders.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>📅 Upcoming ({futureReminders.length})</Text>
                {futureReminders.map(reminder => renderCard(reminder, false))}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Modern, Detailed Modal Popup */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📋 Meeting Details</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            {selectedReminder && (
              <ScrollView style={styles.modalScroll}>
                <Text style={styles.modalTopic}>
                  {selectedReminder.topic || 'Untitled Meeting'}
                </Text>

                <View style={styles.modalBadgeRow}>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedReminder.status) }]}>
                    <Text style={styles.statusText}>{selectedReminder.status.toUpperCase()}</Text>
                  </View>
                  <View style={styles.modeBadge}>
                    <Text style={styles.modeBadgeText}>{selectedReminder.meetingMode}</Text>
                  </View>
                </View>

                <View style={styles.modalDivider} />

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>📅 Date & Time</Text>
                  <Text style={styles.detailValue}>
                    {selectedReminder.date} at {selectedReminder.time} ({selectedReminder.daysText})
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>👤 Organizer</Text>
                  <Text style={styles.detailValue}>{selectedReminder.organizer}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>🎯 Type & Purpose</Text>
                  <Text style={styles.detailValue}>
                    {selectedReminder.meetingType} • {selectedReminder.outcome}
                  </Text>
                </View>

                {selectedReminder.venue ? (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>📍 Venue / Location</Text>
                    <Text style={styles.detailValue}>{selectedReminder.venue}</Text>
                  </View>
                ) : null}

                {/* Participants details */}
                {selectedReminder.rawDoctors ? (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>👨‍⚕️ Doctors Invited</Text>
                    <Text style={styles.detailValue}>{selectedReminder.rawDoctors}</Text>
                  </View>
                ) : null}

                {selectedReminder.rawChemists ? (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>💊 Chemists Invited</Text>
                    <Text style={styles.detailValue}>{selectedReminder.rawChemists}</Text>
                  </View>
                ) : null}

                {selectedReminder.description ? (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>📝 Agenda & Notes</Text>
                    <Text style={styles.detailValue}>{selectedReminder.description}</Text>
                  </View>
                ) : null}

                {selectedReminder.meetingLink ? (
                  <TouchableOpacity
                    style={styles.joinLinkButton}
                    onPress={() => {
                      Linking.openURL(selectedReminder.meetingLink!).catch(() =>
                        Alert.alert('Error', 'Unable to open meeting link.')
                      );
                    }}
                  >
                    <Text style={styles.joinLinkText}>💻 Join Online Meeting</Text>
                  </TouchableOpacity>
                ) : null}
              </ScrollView>
            )}

            <TouchableOpacity style={styles.modalOkButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.modalOkButtonText}>CLOSE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default MeetingRemindersScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    backgroundColor: '#4F46E5', paddingTop: 60, paddingBottom: 25, paddingHorizontal: 20,
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24, position: 'relative',
  },
  backButton: { position: 'absolute', left: 15, top: 50, zIndex: 10, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, backgroundColor: 'rgba(255, 255, 255, 0.2)' },
  backButtonText: { fontSize: 12, color: '#FFFFFF', fontWeight: 'bold' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#FFFFFF', textAlign: 'center', marginTop: 15 },
  headerSubtitle: { fontSize: 11, color: '#E0E7FF', textAlign: 'center', marginTop: 6 },
  
  scrollContent: { padding: 20, paddingBottom: 60 },
  section: { marginBottom: 25 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#475569', marginBottom: 12, textTransform: 'uppercase' },
  
  reminderCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 },
  todayCard: { borderColor: '#FCA5A5', backgroundColor: '#FEF2F2' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  topic: { fontSize: 16, fontWeight: 'bold', color: '#1E293B', flex: 1, marginRight: 10 },
  
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { color: '#FFFFFF', fontSize: 9, fontWeight: 'bold' },
  
  clientText: { fontSize: 14, color: '#4F46E5', fontWeight: '600', marginBottom: 12 },
  
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 12, marginBottom: 12 },
  iconText: { flexDirection: 'row', alignItems: 'center' },
  icon: { fontSize: 14, marginRight: 6 },
  timeText: { fontSize: 12, color: '#64748B', fontWeight: '500' },

  actionButton: { backgroundColor: '#4F46E5', paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  actionButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: 'bold' },

  actionButtonNeutral: { backgroundColor: '#F1F5F9', paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  actionButtonTextNeutral: { color: '#475569', fontSize: 13, fontWeight: 'bold' },

  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E293B', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#64748B', textAlign: 'center' },

  // Detail Modal styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFFFFF', borderRadius: 20, width: '100%', maxHeight: '80%', padding: 20, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 15, elevation: 10 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E293B' },
  closeButton: { padding: 4 },
  closeButtonText: { fontSize: 18, color: '#94A3B8', fontWeight: 'bold' },
  modalScroll: { marginBottom: 15 },
  modalTopic: { fontSize: 20, fontWeight: 'bold', color: '#1E293B', marginBottom: 10 },
  modalBadgeRow: { flexDirection: 'row', gap: 8, marginBottom: 15 },
  modeBadge: { backgroundColor: '#EEF2F6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  modeBadgeText: { color: '#475569', fontSize: 9, fontWeight: 'bold' },
  modalDivider: { height: 1, backgroundColor: '#E2E8F0', marginBottom: 15 },
  detailRow: { marginBottom: 12 },
  detailLabel: { fontSize: 12, fontWeight: 'bold', color: '#64748B', marginBottom: 3 },
  detailValue: { fontSize: 14, color: '#334155', lineHeight: 20 },
  joinLinkButton: { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE', borderWidth: 1, padding: 12, borderRadius: 8, marginTop: 10, alignItems: 'center' },
  joinLinkText: { color: '#1E40AF', fontWeight: 'bold', fontSize: 13 },
  modalOkButton: { backgroundColor: '#4F46E5', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  modalOkButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold' },
});