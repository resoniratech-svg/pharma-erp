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
import { Picker } from '@react-native-picker/picker'; // Imported cross-platform Picker

// Added service endpoint imports at the top
import {
  createMeeting,
  getMeetingsByMr,
} from '../../services/meetingService';
import { getDoctors } from '../../services/doctorService';
import { getChemists } from '../../services/chemistService';

interface Meeting {
  id: number;
  topic: string;
  meetingType: 'Doctor Group Meeting' | 'Chemist Meeting' | 'Hospital Meeting' | 'Stockist Review' | 'Clinical Presentation' | 'Team Meeting';
  date: string;
  time: string;
  venue: string;
  organizer: string;
  meetingMode: 'Physical' | 'Online' | 'Hybrid';
  reminder: '15 Minutes' | '30 Minutes' | '1 Hour' | '1 Day' | 'None';
  outcome: string;           
  participants: string;
  attendeesCount: number;    
  status: 'Scheduled' | 'Completed' | 'Cancelled';
  followUpDate: string;
  agenda: string;
  title?: string;          
  meetingDate?: string;    
  location?: string;       
  description?: string;    
  mr?: { name?: string };  
  meetingDoctors?: Array<{ doctor?: { name?: string; doctorName?: string } }>; 
  meetingChemists?: Array<{ chemist?: { name?: string } }>; 
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
  const [meetingType, setMeetingType] = useState<'Doctor Group Meeting' | 'Chemist Meeting' | 'Hospital Meeting' | 'Stockist Review' | 'Clinical Presentation' | 'Team Meeting'>('Doctor Group Meeting');
  const [meetingDate, setMeetingDate] = useState(new Date().toISOString().split('T')[0]);
  const [meetingTime, setMeetingTime] = useState('11:00 AM');
  const [venue, setVenue] = useState('');
  const [organizer, setOrganizer] = useState('');
  const [meetingMode, setMeetingMode] = useState<'Physical' | 'Online' | 'Hybrid'>('Physical');
  const [reminder, setReminder] = useState<'15 Minutes' | '30 Minutes' | '1 Hour' | '1 Day' | 'None'>('15 Minutes');
  const [outcome, setOutcome] = useState('Doctor Engagement');
  const [participants, setParticipants] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [agenda, setAgenda] = useState('');
  const [meetings, setMeetings] = useState<Meeting[]>([]);

  // Inserted background entity dropdown track data states below meetings hook
  const [selectedDoctorId, setSelectedDoctorId] = useState<number | null>(null);
  const [selectedChemistId, setSelectedChemistId] = useState<number | null>(null);

  // Background entity track data arrays
  const [doctors, setDoctors] = useState<any[]>([]);
  const [chemists, setChemists] = useState<any[]>([]);

  const scrollViewRef = React.useRef<ScrollView>(null);

  // Time & Date picker displays for native devices
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showFollowUpPicker, setShowFollowUpPicker] = useState(false);

  const customAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  // Connected mounting callback to trigger backend fetching loops
  useEffect(() => {
    loadBackendData();
  }, []);

  // Configured loader thread utility function to handle network operations
  const loadBackendData = async () => {
    try {
      const doctorsResponse = await getDoctors();
      setDoctors(doctorsResponse.data || doctorsResponse);

      const chemistsResponse = await getChemists();
      setChemists(chemistsResponse.data || chemistsResponse);

      const meetingsData = await getMeetingsByMr();
      console.log('MEETINGS DATA:', JSON.stringify(meetingsData, null, 2));
      console.log('Meetings:', meetingsData);
      setMeetings(meetingsData.data || meetingsData || []);
    } catch (error) {
      console.log('Meeting Load Error:', error);
    }
  };

  const formatDateDisplay = (dateStr: string): string => {
    const parts = dateStr.split('T')[0].split(/[-/]/);
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
      return `${parts[0]}-${parts[1]}-${parts[2]}`;
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
    if (!organizer.trim()) {
      customAlert('Error', 'Please enter an organizer.');
      return;
    }

    if (followUpDate && followUpDate < meetingDate) {
      customAlert(
        'Invalid Follow-Up Date',
        'Follow-up date cannot be earlier than meeting date.'
      );
      return;
    }

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

    if (!selectedDoctorId && !selectedChemistId) {
      customAlert('Error', 'Select at least one Doctor or Chemist');
      return;
    }

    try {
      const mrId = await AsyncStorage.getItem('@mrId');

      console.log('MEETING PAYLOAD', {
        mrId: Number(mrId),
        title: topic,
        description: agenda,
        meetingDate: new Date(
          `${meetingDate}T${formatTime12to24(meetingTime)}:00`
        ).toISOString(),
        location: venue,
        doctorIds: selectedDoctorId ? [selectedDoctorId] : [],
        chemistIds: selectedChemistId ? [selectedChemistId] : [],
      });

      await createMeeting({
        mrId: Number(mrId),
        title: topic,
        description: agenda,
        meetingDate: new Date(
          `${meetingDate}T${formatTime12to24(meetingTime)}:00`
        ).toISOString(),
        location: venue,
        doctorIds: selectedDoctorId ? [selectedDoctorId] : [],
        chemistIds: selectedChemistId ? [selectedChemistId] : [],
      });

      customAlert('Success', 'Meeting scheduled successfully');

      // Clear Form Fields
      setTopic('');
      setVenue('');
      setOrganizer('');
      setParticipants('');
      setFollowUpDate('');
      setAgenda('');
      setSelectedDoctorId(null);
      setSelectedChemistId(null);

      loadBackendData();
    } catch (error: any) {
      console.log(
        'Meeting Create Error:',
        error?.response?.data || error
      );

      customAlert(
        'Error',
        JSON.stringify(
          error?.response?.data || error
        )
      );
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
          <Text style={styles.topicLabel}>Meeting Topic / Title *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Q2 Cardiovascular Range Presentation"
            placeholderTextColor="#94A3B8"
            value={topic}
            onChangeText={setTopic}
          />

          <Text style={styles.sectionLabel}>Meeting Type *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {(['Doctor Group Meeting', 'Chemist Meeting', 'Hospital Meeting', 'Stockist Review', 'Clinical Presentation', 'Team Meeting'] as const).map((type) => (
                <TouchableOpacity
                  key={type}
                  onPress={() => setMeetingType(type as any)}
                  style={[styles.typeBtn, meetingType === type && styles.typeBtnActive, { marginRight: 6 }]}
                >
                  <Text style={[styles.typeBtnText, meetingType === type && styles.typeBtnTextActive]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <Text style={styles.sectionLabel}>Organizer *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. RSM, ASM, Management"
            placeholderTextColor="#94A3B8"
            value={organizer}
            onChangeText={setOrganizer}
          />

          {/* Date & Time Selectors */}
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionLabel}>Meeting Date *</Text>
              {Platform.OS === 'web' ? (
                <input
                  type="date"
                  value={meetingDate}
                  onChange={(e) => setMeetingDate(e.target.value)}
                  style={{
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: '#E2E8F0',
                    borderRadius: '8px',
                    padding: '12px',
                    fontSize: '14px',
                    backgroundColor: '#F8FAFC',
                    width: '100%',
                    boxSizing: 'border-box',
                    outline: 'none',
                    color: '#334155',
                  }}
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
                  style={{
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: '#E2E8F0',
                    borderRadius: '8px',
                    padding: '12px',
                    fontSize: '14px',
                    backgroundColor: '#F8FAFC',
                    width: '100%',
                    boxSizing: 'border-box',
                    outline: 'none',
                    color: '#334155',
                  }}
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

          <Text style={styles.sectionLabel}>Meeting Mode *</Text>
          <View style={styles.typeSelectorRow}>
            {(['Physical', 'Online', 'Hybrid'] as const).map((mode) => (
              <TouchableOpacity
                key={mode}
                onPress={() => setMeetingMode(mode)}
                style={[styles.typeBtn, meetingMode === mode && styles.typeBtnActive]}
              >
                <Text style={[styles.typeBtnText, meetingMode === mode && styles.typeBtnTextActive]}>{mode}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionLabel}>Reminder Before Meeting</Text>
          <View style={styles.typeSelectorRow}>
            {(['15 Minutes', '30 Minutes', '1 Hour', '1 Day', 'None'] as const).map((rem) => (
              <TouchableOpacity
                key={rem}
                onPress={() => setReminder(rem)}
                style={[styles.typeBtn, reminder === rem && styles.typeBtnActive]}
              >
                <Text style={[styles.typeBtnText, reminder === rem && styles.typeBtnTextActive]}>{rem}</Text>
              </TouchableOpacity>
            ))}
          </View>

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

          <Text style={styles.sectionLabel}>Select Doctor</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedDoctorId}
              onValueChange={(value) => setSelectedDoctorId(value)}
            >
              <Picker.Item label="Select Doctor" value={null} color="#94A3B8" />
              {doctors.map((doctor) => (
                <Picker.Item key={doctor.id} label={doctor.name} value={doctor.id} />
              ))}
            </Picker>
          </View>

          <Text style={styles.sectionLabel}>Select Chemist</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedChemistId}
              onValueChange={(value) => setSelectedChemistId(value)}
            >
              <Picker.Item label="Select Chemist" value={null} color="#94A3B8" />
              {chemists.map((chemist) => (
                <Picker.Item key={chemist.id} label={chemist.name} value={chemist.id} />
              ))}
            </Picker>
          </View>

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
              const isScheduled = meet.status === 'Scheduled';

              return (
                <View key={meet.id} style={styles.meetCard}>
                  <View style={styles.meetCardHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.meetTopic}>
                        {meet.title || 'Meeting'}
                      </Text>
                      <View style={styles.badgeRow}>
                        <Text style={styles.meetTypeBadge}>
                          {meet.meetingType || 'General'}
                        </Text>
                        <Text style={styles.meetOutcomeBadge}>
                          {meet.status || 'Scheduled'}
                        </Text>
                      </View>
                    </View>
                    <View style={{ gap: 6, alignItems: 'flex-end' }}>
                      <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                        <Text style={[styles.statusBadgeText, { color: statusStyle.text }]}>
                          {meet.status}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Cleaned layout mappings */}
                  <View style={styles.divider} />

                  <Text style={styles.meetInfo}>
                    📅 Date: {
                      meet.meetingDate
                        ? formatDateDisplay(meet.meetingDate)
                        : 'N/A'
                    }
                  </Text>

                  <Text style={styles.meetInfo}>
                    📍 Venue: {
                      meet.location || 'Not Specified'
                    }
                  </Text>

                  <Text style={styles.meetInfo}>
                    👤 Organizer: {
                      meet.mr?.name ||
                      meet.organizer ||
                      'Not Specified'
                    }
                  </Text>

                  <Text style={styles.meetInfo}>
                    👨‍⚕️ Doctor: {
                      meet.meetingDoctors &&
                      meet.meetingDoctors.length > 0
                        ? meet.meetingDoctors
                            .map(
                              (d: any) =>
                                d.doctor?.name ||
                                d.doctor?.doctorName
                            )
                            .join(', ')
                        : 'N/A'
                    }
                  </Text>

                  <Text style={styles.meetInfo}>
                    💊 Chemist: {
                      meet.meetingChemists &&
                      meet.meetingChemists.length > 0
                        ? meet.meetingChemists
                            .map(
                              (c: any) =>
                                c.chemist?.name
                            )
                            .join(', ')
                        : 'N/A'
                    }
                  </Text>

                  {meet.description ? (
                    <Text style={styles.meetInfo}>
                      📝 Description: {meet.description}
                    </Text>
                  ) : null}

                  {meet.followUpDate ? (
                    <Text style={styles.meetInfo}>
                      🔁 Follow Up: {
                        formatDateDisplay(
                          meet.followUpDate
                        )
                      }
                    </Text>
                  ) : null}

                  {meet.reminder &&
                   meet.reminder !== 'None' ? (
                    <Text style={styles.meetInfo}>
                      🔔 Reminder: {
                        meet.reminder
                      } before
                    </Text>
                  ) : null}

                  {meet.agenda ? (
                    <Text style={styles.meetInfo}>
                      📋 Agenda: {
                        meet.agenda
                      }
                    </Text>
                  ) : null}

                  {isScheduled && (
                    <View style={styles.cardActionsRow}>
                      <TouchableOpacity
                        style={[
                          styles.cardActionBtn,
                          styles.completeBtn
                        ]}
                        onPress={() =>
                          handleUpdateStatus(
                            meet.id,
                            'Completed'
                          )
                        }
                      >
                        <Text style={styles.completeBtnText}>✔️ Complete</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.cardActionBtn,
                          styles.cancelBtn
                        ]}
                        onPress={() =>
                          handleUpdateStatus(
                            meet.id,
                            'Cancelled'
                          )
                        }
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
  topicLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#475569',
    marginBottom: 6,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#475569',
    marginBottom: 6,
    marginTop: 6,
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
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    marginBottom: 12,
    justifyContent: 'center',
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