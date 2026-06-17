import AsyncStorage from '@react-native-async-storage/async-storage';
import RNDateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface Meeting {
  id: number;
  topic: string;
  meetingType: 'Doctor Group Meet' | 'Stockist Review' | 'Clinical Presentation' | 'Team Sync';
  date: string;
  time: string;
  venue: string;             
  outcome: string;           
  participants: string;
  attendeesCount: number;    
  status: 'Scheduled' | 'Completed' | 'Cancelled';
  approvalStatus: 'Pending Approval' | 'Approved' | 'Rejected'; 
  agenda: string;
}

const safeJsonParse = (data: string | null, fallback: any) => {
  if (!data) return fallback;
  try {
    return JSON.parse(data);
  } catch (err) {
    console.error('safeJsonParse error in MeetingSchedulerScreen:', err);
    return fallback;
  }
};

const MeetingSchedulerScreen = () => {
  const navigation = useNavigation<any>();
  const [topic, setTopic] = useState('');
  const [meetingType, setMeetingType] = useState<'Doctor Group Meet' | 'Stockist Review' | 'Clinical Presentation' | 'Team Sync'>('Doctor Group Meet');
  const [meetingDate, setMeetingDate] = useState(new Date().toISOString().split('T')[0]);
  const [meetingTime, setMeetingTime] = useState('11:00 AM');
  const [venue, setVenue] = useState('');
  const [outcome, setOutcome] = useState('Doctor Engagement');
  const [participants, setParticipants] = useState('');
  const [agenda, setAgenda] = useState('');
  const [meetings, setMeetings] = useState<Meeting[]>([]);

  const scrollViewRef = React.useRef<ScrollView>(null);

  // Time & Date picker displays for native devices
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const customAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  useEffect(() => {
    loadMeetings();
  }, []);

  const loadMeetings = async () => {
    try {
      const stored = await AsyncStorage.getItem('@meetings');
      setMeetings(safeJsonParse(stored, []));
    } catch (e) {
      console.error('Failed to load meeting schedules:', e);
    }
  };

  const formatDateDisplay = (dateStr: string): string => {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateStr;
  };

  const calculateAttendees = (list: string): number => {
    if (!list.trim()) return 0;
    return list.split(',').map((p) => p.trim()).filter((p) => p.length > 0).length;
  };

  const formatTime12to24 = (time12: string) => {
    const match = time12.match(/^(\d{2}):(\d{2})\s*(AM|PM)$/i);
    if (match) {
      let hours = parseInt(match[1]);
      const minutes = match[2];
      const ampm = match[3].toUpperCase();
      if (ampm === 'PM' && hours < 12) hours += 12;
      if (ampm === 'AM' && hours === 12) hours = 0;
      return `${hours.toString().padStart(2, '0')}:${minutes}`;
    }
    return '11:00';
  };

  const formatTime24to12 = (time24: string) => {
    const parts = time24.split(':');
    if (parts.length === 2) {
      let hours = parseInt(parts[0]);
      const minutes = parts[1];
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      return `${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
    }
    return time24;
  };

  const handleSubmit = async () => {
    if (!topic.trim()) {
      customAlert('Error', 'Please enter a meeting topic.');
      return;
    }
    if (!venue.trim()) {
      customAlert('Error', 'Please enter a meeting venue.');
      return;
    }
    if (!participants.trim()) {
      customAlert('Error', 'Please list at least one participant.');
      return;
    }

    // 1. Prevent Past-Date Meetings & Past-Time on Current Day
    const todayStr = new Date().toISOString().split('T')[0];
    if (meetingDate < todayStr) {
      customAlert('Scheduling Blocked', 'Cannot schedule a meeting on a past date.');
      return;
    }

    if (meetingDate === todayStr) {
      const now = new Date();
      const currentHours = now.getHours();
      const currentMinutes = now.getMinutes();
      const currentTimeStr = `${currentHours.toString().padStart(2, '0')}:${currentMinutes.toString().padStart(2, '0')}`;
      const selectedTime24 = formatTime12to24(meetingTime);

      if (selectedTime24 < currentTimeStr) {
        customAlert('Scheduling Blocked', 'Cannot schedule a meeting at a past time today.');
        return;
      }
    }

    // 2. Date + Time Conflict Validation
    const isConflict = meetings.some(
      (m) => m.date === meetingDate && m.time === meetingTime && m.status !== 'Cancelled'
    );
    if (isConflict) {
      customAlert(
        'Scheduling Conflict',
        `You already have another active meeting scheduled at ${meetingTime} on ${formatDateDisplay(meetingDate)}.`
      );
      return;
    }

    const attendeesCount = calculateAttendees(participants);

    const newMeeting: Meeting = {
      id: Date.now(),
      topic,
      meetingType,
      date: meetingDate,
      time: meetingTime,
      venue,
      outcome,
      participants,
      attendeesCount,
      status: 'Scheduled',
      approvalStatus: 'Pending Approval',
      agenda,
    };

    const updatedMeetings = [newMeeting, ...meetings];
    setMeetings(updatedMeetings);

    try {
      await AsyncStorage.setItem('@meetings', JSON.stringify(updatedMeetings));
      
      // Auto-integrate with Notification Center by creating a corresponding followup notification
      try {
        const notificationsStr = await AsyncStorage.getItem('@notifications');
        const currentNotifications = safeJsonParse(notificationsStr, []);
        const newNotification = {
          id: Date.now() + 1,
          type: 'followup',
          title: `📅 Meeting Scheduled: ${topic}`,
          message: `Meeting of type "${meetingType}" scheduled at ${venue} on ${formatDateDisplay(meetingDate)} at ${meetingTime}.`,
          time: 'Just Now',
          unread: true,
        };
        const updatedNotifications = [newNotification, ...currentNotifications];
        await AsyncStorage.setItem('@notifications', JSON.stringify(updatedNotifications));
      } catch (notiError) {
        console.error('Failed to save automatic meeting notification reminder:', notiError);
      }

      customAlert('Success', `Meeting for "${topic}" scheduled successfully.`);
      setTopic('');
      setVenue('');
      setParticipants('');
      setAgenda('');
    } catch (e) {
      console.error('Failed to save meeting:', e);
      customAlert('Error', 'Failed to save meeting.');
    }
  };

  const handleUpdateStatus = async (id: number, newStatus: 'Completed' | 'Cancelled') => {
    const updated = meetings.map((m) => {
      if (m.id === id) {
        return { ...m, status: newStatus };
      }
      return m;
    });

    setMeetings(updated);
    try {
      await AsyncStorage.setItem('@meetings', JSON.stringify(updated));
      customAlert('Status Updated', `Meeting status marked as ${newStatus}.`);
    } catch (e) {
      console.error('Failed to update status:', e);
    }
  };

  const cycleApprovalStatus = async (id: number) => {
    let nextApprovalName = '';
    const updated = meetings.map((m) => {
      if (m.id === id) {
        let nextApproval: 'Pending Approval' | 'Approved' | 'Rejected' = 'Pending Approval';
        if (m.approvalStatus === 'Pending Approval') nextApproval = 'Approved';
        else if (m.approvalStatus === 'Approved') nextApproval = 'Rejected';
        nextApprovalName = nextApproval;
        return { ...m, approvalStatus: nextApproval };
      }
      return m;
    });

    setMeetings(updated);
    try {
      await AsyncStorage.setItem('@meetings', JSON.stringify(updated));
      
      // Clearly state this is a manager simulation for compliance testing
      const message = `🛡️ Manager Simulation:\nCycled approval status to "${nextApprovalName}" on behalf of Manager Rajesh Kumar.`;
      if (Platform.OS === 'web') {
        window.alert(message);
      } else {
        Alert.alert('Manager Simulation', message);
      }
    } catch (e) {
      console.error('Failed to cycle approval status:', e);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return { bg: '#D1FAE5', text: '#059669' };
      case 'Cancelled':
        return { bg: '#FFE4E6', text: '#E11D48' };
      default:
        return { bg: '#DBEAFE', text: '#2563EB' };
    }
  };

  const getApprovalColor = (status: string) => {
    switch (status) {
      case 'Approved':
        return { bg: '#D1FAE5', text: '#059669' };
      case 'Rejected':
        return { bg: '#FFE4E6', text: '#E11D48' };
      default:
        return { bg: '#FEF3C7', text: '#D97706' };
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
        <Text style={styles.headerTitle}>📅 Meeting Scheduler</Text>
        <Text style={styles.headerSubtitle}>Set group meets, presentations & syncs</Text>
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView 
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContent}
        >
        {/* Scheduler Form */}
        <View style={styles.formCard}>
          <Text style={styles.sectionLabel}>Meeting Topic / Title *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Q2 Cardiovascular Range Presentation"
            placeholderTextColor="#94A3B8"
            value={topic}
            onChangeText={setTopic}
          />

          <Text style={styles.sectionLabel}>Meeting Type *</Text>
          <View style={styles.typeSelectorRow}>
            {(['Doctor Group Meet', 'Stockist Review', 'Clinical Presentation', 'Team Sync'] as const).map((type) => (
              <TouchableOpacity
                key={type}
                onPress={() => setMeetingType(type)}
                style={[styles.typeBtn, meetingType === type && styles.typeBtnActive]}
              >
                <Text style={[styles.typeBtnText, meetingType === type && styles.typeBtnTextActive]}>
                  {type.split(' ')[0]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Date & Time Selectors */}
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionLabel}>Meeting Date *</Text>
              {Platform.OS === 'web' ? (
                <input
                  type="date"
                  value={meetingDate}
                  onChange={(e) => setMeetingDate(e.target.value)}
                  style={webInputStyle}
                />
              ) : (
                <TouchableOpacity
                  style={styles.nativeBtn}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={styles.nativeBtnText}>{formatDateDisplay(meetingDate)}</Text>
                </TouchableOpacity>
              )}
              {showDatePicker && (
                <RNDateTimePicker
                  mode="date"
                  value={new Date(meetingDate)}
                  onChange={(e, d) => {
                    setShowDatePicker(false);
                    if (d) setMeetingDate(d.toISOString().split('T')[0]);
                  }}
                />
              )}
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.sectionLabel}>Meeting Time *</Text>
              {Platform.OS === 'web' ? (
                <input
                  type="time"
                  value={formatTime12to24(meetingTime)}
                  onChange={(e) => setMeetingTime(formatTime24to12(e.target.value))}
                  style={webInputStyle}
                />
              ) : (
                <TouchableOpacity
                  style={styles.nativeBtn}
                  onPress={() => setShowTimePicker(true)}
                >
                  <Text style={styles.nativeBtnText}>{meetingTime}</Text>
                </TouchableOpacity>
              )}
              {showTimePicker && (
                <RNDateTimePicker
                  mode="time"
                  value={new Date()}
                  onChange={(e, d) => {
                    setShowTimePicker(false);
                    if (d) {
                      let hours = d.getHours();
                      const minutes = d.getMinutes().toString().padStart(2, '0');
                      const ampm = hours >= 12 ? 'PM' : 'AM';
                      hours = hours % 12;
                      hours = hours ? hours : 12;
                      setMeetingTime(`${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`);
                    }
                  }}
                />
              )}
            </View>
          </View>

          <Text style={styles.sectionLabel}>Meeting Venue / Location *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Apollo Hospital Conference Hall"
            placeholderTextColor="#94A3B8"
            value={venue}
            onChangeText={setVenue}
            onFocus={() => {
              setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
              }, 150);
            }}
          />

          <Text style={styles.sectionLabel}>Expected Outcome / Purpose *</Text>
          <View style={styles.typeSelectorRow}>
            {['Doctor Engagement', 'New Product Launch', 'Prescription Growth', 'Distributor Review'].map((out) => (
              <TouchableOpacity
                key={out}
                onPress={() => setOutcome(out)}
                style={[styles.typeBtn, outcome === out && styles.typeBtnActive]}
              >
                <Text style={[styles.typeBtnText, outcome === out && styles.typeBtnTextActive]}>
                  {out.split(' ')[0]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.labelWithBadge}>
            <Text style={styles.sectionLabel}>Participants (Comma separated) *</Text>
            {participants.trim().length > 0 && (
              <Text style={styles.badgeCounter}>Attendees: {calculateAttendees(participants)}</Text>
            )}
          </View>
          <TextInput
            style={styles.input}
            placeholder="e.g. Dr. Ramesh, Dr. Sharma, Chemist Sunil"
            placeholderTextColor="#94A3B8"
            value={participants}
            onChangeText={setParticipants}
            onFocus={() => {
              setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
              }, 150);
            }}
          />

          <Text style={styles.sectionLabel}>Meeting Agenda / Notes</Text>
          <TextInput
            style={styles.textArea}
            placeholder="What will be discussed/demonstrated..."
            placeholderTextColor="#94A3B8"
            value={agenda}
            onChangeText={setAgenda}
            multiline
            numberOfLines={3}
            onFocus={() => {
              setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
              }, 150);
            }}
          />

          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
            <Text style={styles.submitBtnText}>SCHEDULE MEETING</Text>
          </TouchableOpacity>
        </View>

        {/* History / Scheduled list */}
        {meetings.length > 0 && (
          <>
            <Text style={styles.historyTitle}>Scheduled Meetings ({meetings.length})</Text>
            {meetings.map((meet) => {
              const statusStyle = getStatusColor(meet.status);
              const approvalStyle = getApprovalColor(meet.approvalStatus);
              const isScheduled = meet.status === 'Scheduled';

              return (
                <View key={meet.id} style={styles.meetCard}>
                  <View style={styles.meetCardHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.meetTopic}>{meet.topic}</Text>
                      <View style={styles.badgeRow}>
                        <Text style={styles.meetTypeBadge}>{meet.meetingType}</Text>
                        <Text style={styles.meetOutcomeBadge}>{meet.outcome || 'General Meet'}</Text>
                      </View>
                    </View>
                    <View style={{ gap: 6, alignItems: 'flex-end' }}>
                      <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                        <Text style={[styles.statusBadgeText, { color: statusStyle.text }]}>
                          {meet.status}
                        </Text>
                      </View>
                      
                      <TouchableOpacity
                        onPress={() => cycleApprovalStatus(meet.id)}
                        style={[styles.statusBadge, { backgroundColor: approvalStyle.bg }]}
                      >
                        <Text style={[styles.statusBadgeText, { color: approvalStyle.text }]}>
                          {meet.approvalStatus} 🔄
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.divider} />
                  
                  <Text style={styles.meetInfo}>📅 Date: {formatDateDisplay(meet.date)} at {meet.time}</Text>
                  <Text style={styles.meetInfo}>📍 Venue: {meet.venue || 'Not Specified'}</Text>
                  <Text style={styles.meetInfo}>👥 Participants ({meet.attendeesCount || 0}): {meet.participants}</Text>
                  {meet.agenda ? (
                    <Text style={styles.meetInfo}>📝 Agenda: {meet.agenda}</Text>
                  ) : null}

                  {/* Complete / Cancel Buttons for Scheduled Meetings only */}
                  {isScheduled && (
                    <View style={styles.cardActionsRow}>
                      <TouchableOpacity
                        style={[styles.cardActionBtn, styles.completeBtn]}
                        onPress={() => handleUpdateStatus(meet.id, 'Completed')}
                      >
                        <Text style={styles.completeBtnText}>✔️ Complete</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.cardActionBtn, styles.cancelBtn]}
                        onPress={() => handleUpdateStatus(meet.id, 'Cancelled')}
                      >
                        <Text style={styles.cancelBtnText}>❌ Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })}
          </>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default MeetingSchedulerScreen;

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
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 280, 
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#475569',
    marginBottom: 6,
  },
  labelWithBadge: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  badgeCounter: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#4F46E5',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#334155',
    backgroundColor: '#F8FAFC',
    marginBottom: 12,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  typeBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
  },
  typeBtnActive: {
    backgroundColor: '#4F46E5',
  },
  typeBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  typeBtnTextActive: {
    color: '#FFFFFF',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  nativeBtn: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
  },
  nativeBtnText: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '500',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#334155',
    backgroundColor: '#F8FAFC',
    height: 80,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  submitBtn: {
    backgroundColor: '#4F46E5',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 12,
  },
  meetCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
    borderLeftWidth: 4,
    borderLeftColor: '#4F46E5',
  },
  meetCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  meetTopic: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  meetTypeBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4F46E5',
    backgroundColor: '#EEF2F6',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  meetOutcomeBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D97706',
    backgroundColor: '#FEF3C7',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },
  meetInfo: {
    fontSize: 13,
    color: '#334155',
    marginTop: 4,
  },
  cardActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  cardActionBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeBtn: {
    backgroundColor: '#D1FAE5',
  },
  completeBtnText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: 'bold',
  },
  cancelBtn: {
    backgroundColor: '#FFE4E6',
  },
  cancelBtnText: {
    fontSize: 12,
    color: '#E11D48',
    fontWeight: 'bold',
  },
});