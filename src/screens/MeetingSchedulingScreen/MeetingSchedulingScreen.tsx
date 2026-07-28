import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RNDateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker'; // Imported cross-platform Picker
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

// Added service endpoint imports at the top
import { getChemists } from '../../services/chemistService';
import { getDoctors } from '../../services/doctorService';
import { getHospitals } from '../../services/hospitalService';
import {
  cancelMeeting,
  completeMeeting,
  createMeeting,
  getMeetingsByMr,
} from '../../services/meetingService';
import { getStockists } from '../../services/stockistService';
import { checkAttendanceStatus, getLocalDateStr } from '../../services/attendanceService';

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
  meetingHospitals?: Array<{ hospital?: { name?: string } }>;
  meetingStockists?: Array<{ stockist?: { name?: string } }>;
  meetingLink?: string;
}

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
  const [followUpDate, setFollowUpDate] = useState('');
  const [agenda, setAgenda] = useState('');
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null);

  // Inserted background entity dropdown track data states below meetings hook
  const [selectedDoctorId, setSelectedDoctorId] = useState<number | null>(null);
  const [selectedChemistId, setSelectedChemistId] = useState<number | null>(null);
  const [selectedHospitalId, setSelectedHospitalId] = useState<number | null>(null);
  const [selectedStockistId, setSelectedStockistId] = useState<number | null>(null);

  // Background entity track data arrays
  const [doctors, setDoctors] = useState<any[]>([]);
  const [chemists, setChemists] = useState<any[]>([]);
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [stockists, setStockists] = useState<any[]>([]);
  const [meetingLink, setMeetingLink] = useState('');

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
    loadBackendData(true);
    const fetchUserName = async () => {
      const storedName = await AsyncStorage.getItem('@user_name');
      if (storedName) setOrganizer(storedName);
    };
    fetchUserName();
  }, []);

  // Configured loader thread utility function to handle network operations
  const resolveArrayResponse = (response: any, arrayName: string): any[] => {
    if (!response) return [];
    if (Array.isArray(response)) return response;
    if (Array.isArray(response.data)) return response.data;
    if (response.data && Array.isArray(response.data.data)) return response.data.data;
    if (Array.isArray(response[arrayName])) return response[arrayName];
    if (response.data && Array.isArray(response.data[arrayName])) return response.data[arrayName];
    
    const listKey = `${arrayName}List`;
    if (Array.isArray(response[listKey])) return response[listKey];
    
    const fallback = response.data || response;
    return Array.isArray(fallback) ? fallback : [];
  };

  const loadBackendData = async (isInitial = false) => {
    if (isInitial) {
      setLoading(true);
    }
    try {
      const results = await Promise.allSettled([
        getDoctors(),
        getChemists(),
        getHospitals(),
        getStockists(),
        getMeetingsByMr(),
      ]);

      if (results[0].status === 'fulfilled') {
        setDoctors(resolveArrayResponse(results[0].value, 'doctors'));
      }
      if (results[1].status === 'fulfilled') {
        setChemists(resolveArrayResponse(results[1].value, 'chemists'));
      }
      if (results[2].status === 'fulfilled') {
        setHospitals(resolveArrayResponse(results[2].value, 'hospitals'));
      }
      if (results[3].status === 'fulfilled') {
        setStockists(resolveArrayResponse(results[3].value, 'stockists'));
      }

      if (results[4].status === 'fulfilled') {
        const meetingsData = results[4].value;
        const resolvedMeetings = meetingsData.data || meetingsData || [];
        const sortedMeetings = Array.isArray(resolvedMeetings)
          ? [...resolvedMeetings].sort((a: any, b: any) => {
              const dateA = new Date(a.meetingDate || a.date || 0).getTime();
              const dateB = new Date(b.meetingDate || b.date || 0).getTime();
              return dateB - dateA;
            })
          : [];
        setMeetings(sortedMeetings);
      } else {
        customAlert('Error', 'Unable to load meetings from server.');
      }
    } catch (error: any) {
      customAlert('Error', 'An unexpected error occurred while loading data.');
    } finally {
      if (isInitial) {
        setLoading(false);
      }
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


  const formatTime12to24 = (time12: string) => {
    if (!time12) return '11:00';
    const trimmed = time12.trim();
    const match = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
    if (match) {
      let hours = parseInt(match[1]);
      const minutes = match[2];
      const ampm = match[3] ? match[3].toUpperCase() : null;
      if (ampm) {
        if (ampm === 'PM' && hours < 12) hours += 12;
        if (ampm === 'AM' && hours === 12) hours = 0;
      }
      return `${hours.toString().padStart(2, '0')}:${minutes}`;
    }
    const match24 = trimmed.match(/^(\d{1,2}):(\d{2})$/);
    if (match24) {
      return `${parseInt(match24[1]).toString().padStart(2, '0')}:${match24[2]}`;
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
    if (submitting) return;
    setSubmitting(true);
    try {
      if (!topic.trim()) {
        customAlert('Error', 'Please enter a meeting topic.');
        return;
      }
      if ((meetingMode === 'Physical' || meetingMode === 'Hybrid') && !venue.trim()) {
        customAlert('Error', 'Please enter a meeting venue.');
        return;
      }
      if (meetingMode === 'Online' || meetingMode === 'Hybrid') {
        if (!meetingLink.trim()) {
          customAlert('Error', 'Please enter a meeting link.');
          return;
        }
        const trimmedLink = meetingLink.trim();
        let isValidUrl = false;
        try {
          const parsedUrl = new URL(trimmedLink.startsWith('http') ? trimmedLink : `https://${trimmedLink}`);
          isValidUrl = parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
        } catch (e) {
          isValidUrl = false;
        }

        if (!isValidUrl) {
          customAlert('Error', 'Please enter a valid online meeting URL (e.g. Google Meet, Zoom, Teams, Webex).');
          return;
        }
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

      const todayLocalStr = getLocalDateStr();

      // Rule 1: Block Past Dates
      if (meetingDate < todayLocalStr) {
        customAlert('Scheduling Blocked', 'Cannot schedule a meeting on a past date.');
        setSubmitting(false);
        return;
      }

      // Rule 2: Today's Meetings Check-In & Duty Validation via Live Backend
      if (meetingDate === todayLocalStr) {
        try {
          const { isCheckedInToday, isCheckedOutToday } = await checkAttendanceStatus();

          if (isCheckedOutToday) {
            customAlert(
              'Duty Completed 🔒',
              'Your duty has already been completed for today. Same-day meeting creation is locked after check-out.'
            );
            setSubmitting(false);
            return;
          }

          if (!isCheckedInToday) {
            customAlert(
              'Check-In Required 🔒',
              'Please check-in first so that attendance is recorded correctly for today\'s meetings.'
            );
            navigation.navigate('Attendance');
            setSubmitting(false);
            return;
          }
        } catch (err) {
          customAlert(
            'Network Error ⚠️',
            'Unable to verify live attendance status from server. Please check your network connection.'
          );
          setSubmitting(false);
          return;
        }

        // Past time check for today
        const now = new Date();
        const currentHours = now.getHours();
        const currentMinutes = now.getMinutes();
        const currentTimeStr = `${currentHours.toString().padStart(2, '0')}:${currentMinutes.toString().padStart(2, '0')}`;
        const selectedTime24 = formatTime12to24(meetingTime);

        if (selectedTime24 < currentTimeStr) {
          customAlert('Scheduling Blocked', 'Cannot schedule a meeting at a past time today.');
          setSubmitting(false);
          return;
        }
      }

      const timeToMinutes = (time12: string): number => {
        if (!time12) return 0;
        const time24 = formatTime12to24(time12);
        const [hh, mm] = time24.split(':').map(Number);
        return hh * 60 + mm;
      };

      const currentMeetingStart = timeToMinutes(meetingTime);
      const currentMeetingEnd = currentMeetingStart + 30; // 30-minute assumed meeting length

      const isConflict = meetings.some((m) => {
        const mDate = m.meetingDate ? m.meetingDate.split('T')[0] : m.date;
        if (mDate !== meetingDate || m.status === 'Cancelled') return false;

        let mStart = 0;
        if (m.meetingDate) {
          const mDateObj = new Date(m.meetingDate);
          if (!isNaN(mDateObj.getTime())) {
            mStart = mDateObj.getHours() * 60 + mDateObj.getMinutes();
          }
        } else if (m.time) {
          mStart = timeToMinutes(m.time);
        } else {
          return false;
        }

        const mEnd = mStart + 30;

        // Overlap logic: startA < endB && startB < endA
        return currentMeetingStart < mEnd && mStart < currentMeetingEnd;
      });
      if (isConflict) {
        customAlert(
          'Scheduling Conflict',
          `You already have another active meeting scheduled within this 30-minute window on ${formatDateDisplay(meetingDate)}.`
        );
        return;
      }

      // Dynamic validations based on Meeting Type
      if ((meetingType === 'Doctor Group Meeting' || meetingType === 'Clinical Presentation') && !selectedDoctorId) {
        customAlert('Error', 'Please select a Doctor.');
        return;
      }
      if (meetingType === 'Chemist Meeting' && !selectedChemistId) {
        customAlert('Error', 'Please select a Chemist.');
        return;
      }
      if (meetingType === 'Hospital Meeting' && !selectedHospitalId) {
        customAlert('Error', 'Please select a Hospital.');
        return;
      }
      if (meetingType === 'Stockist Review' && !selectedStockistId) {
        customAlert('Error', 'Please select a Stockist.');
        return;
      }

      const mrId = await AsyncStorage.getItem('@mrId');

      const payload = {
        mrId: Number(mrId),
        title: topic,
        description: agenda,
        meetingDate: new Date(
          `${meetingDate}T${formatTime12to24(meetingTime)}:00`
        ).toISOString(),
        location: meetingMode === 'Online' ? meetingLink : venue,
        meetingLink: meetingMode === 'Physical' ? '' : meetingLink,
        doctorIds: (meetingType === 'Doctor Group Meeting' || meetingType === 'Clinical Presentation') && selectedDoctorId ? [selectedDoctorId] : [],
        chemistIds: meetingType === 'Chemist Meeting' && selectedChemistId ? [selectedChemistId] : [],
        hospitalIds: meetingType === 'Hospital Meeting' && selectedHospitalId ? [selectedHospitalId] : [],
        stockistIds: meetingType === 'Stockist Review' && selectedStockistId ? [selectedStockistId] : [],
        meetingType: meetingType,
        meetingMode: meetingMode,
        reminder: reminder,
        outcome: outcome,
        followUpDate: followUpDate || undefined,
        organizer: organizer,
      };

      await createMeeting(payload);

      // Save meeting reminder notification if a reminder is selected
      if (reminder !== 'None') {
        try {
          const notifsData = await AsyncStorage.getItem('@notifications');
          const notifsList = notifsData ? JSON.parse(notifsData) : [];
          notifsList.unshift({
            id: `meet-reminder-${Date.now()}`,
            type: 'meeting',
            title: `⏰ Meeting Reminder Set`,
            message: `Reminder for "${topic}" set ${reminder} before the meeting starts at ${meetingTime} on ${formatDateDisplay(meetingDate)}.`,
            time: 'Just now',
            unread: true,
          });
          await AsyncStorage.setItem('@notifications', JSON.stringify(notifsList.slice(0, 50)));
        } catch (e) {
          // Silent notification save catch
        }
      }

      customAlert('Success', 'Meeting scheduled successfully');

      // Clear Form Fields
      setTopic('');
      setVenue('');
      setMeetingLink('');
      setFollowUpDate('');
      setAgenda('');
      setSelectedDoctorId(null);
      setSelectedChemistId(null);
      setSelectedHospitalId(null);
      setSelectedStockistId(null);

      loadBackendData(false);
    } catch (error: any) {
      const serverMsg = error?.response?.data?.message || error?.message || 'Unknown network error';
      customAlert('Error', `Failed to schedule meeting: ${serverMsg}`);
    } finally {
      setSubmitting(false);
    }
  };

  const getMeetingStatus = (meet: Meeting): 'Completed' | 'Cancelled' | 'Expired' | "Today's Meeting" | 'Scheduled' => {
    if (meet.status === 'Completed') return 'Completed';
    if (meet.status === 'Cancelled') return 'Cancelled';

    const meetDateVal = meet.meetingDate ? new Date(meet.meetingDate) : null;
    if (!meetDateVal || isNaN(meetDateVal.getTime())) {
      return meet.status || 'Scheduled';
    }

    const now = new Date();
    
    // Check if date and time have already passed
    if (meetDateVal.getTime() < now.getTime()) {
      return 'Expired';
    }

    // Check if it's today (using local date strings to be time-zone safe)
    const todayStr = now.toLocaleDateString();
    const meetDateStr = meetDateVal.toLocaleDateString();
    if (meetDateStr === todayStr) {
      return "Today's Meeting";
    }

    return 'Scheduled';
  };

  const handleUpdateStatus = async (id: number, newStatus: 'Completed' | 'Cancelled') => {
    const meetObj = meetings.find(m => m.id === id);
    if (meetObj) {
      const currentStatus = getMeetingStatus(meetObj);
      if (currentStatus === 'Completed' || currentStatus === 'Cancelled' || currentStatus === 'Expired') {
        customAlert('Action Blocked', `Cannot update status because the meeting is already ${currentStatus}.`);
        return;
      }
    }

    setUpdatingStatusId(id);
    try {
      if (newStatus === 'Completed') {
        await completeMeeting(id);
      } else {
        await cancelMeeting(id);
      }
      await loadBackendData(false);
      customAlert('Status Updated', `Meeting status marked as ${newStatus} on the server.`);
    } catch (e: any) {
      const updated = meetings.map((m) => {
        if (m.id === id) {
          return { ...m, status: newStatus };
        }
        return m;
      });
      setMeetings(updated);
      customAlert('Status Updated Locally', `Updated locally: ${e?.message || 'Sync failed'}`);
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return { bg: '#D1FAE5', text: '#059669' };
      case 'Cancelled':
        return { bg: '#FFE4E6', text: '#E11D48' };
      case 'Expired':
        return { bg: '#FEE2E2', text: '#EF4444' };
      case "Today's Meeting":
        return { bg: '#FEF3C7', text: '#D97706' };
      default:
        return { bg: '#DBEAFE', text: '#2563EB' };
    }
  };

  const handleMeetingTypeChange = (type: any) => {
    setMeetingType(type);
    setSelectedDoctorId(null);
    setSelectedChemistId(null);
    setSelectedHospitalId(null);
    setSelectedStockistId(null);
  };

  const getDoctorsList = () => {
    if (doctors && doctors.length > 0) {
      return doctors.map(d => ({
        id: d.id,
        name: d.name || d.doctorName || '',
      }));
    }
    return [];
  };

  const getChemistsList = () => {
    if (chemists && chemists.length > 0) {
      return chemists.map(c => ({
        id: c.id,
        name: c.name || c.chemistName || '',
      }));
    }
    return [];
  };

  const getHospitalsList = () => {
    if (hospitals && hospitals.length > 0) {
      return hospitals.map(h => ({
        id: h.id,
        name: h.name || h.hospitalName || '',
      }));
    }
    return [];
  };

  const getStockistsList = () => {
    if (stockists && stockists.length > 0) {
      return stockists.map(s => ({
        id: s.id,
        name: s.name || s.stockistName || '',
      }));
    }
    return [];
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate('Dashboard');
            }
          }}
        >
          <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>📅 Meeting Scheduler</Text>
        <Text style={styles.headerSubtitle}>Set group meets, presentations & syncs</Text>
      </View>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Loading meetings...</Text>
        </View>
      )}

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView 
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={async () => {
                setRefreshing(true);
                await loadBackendData(false);
                setRefreshing(false);
              }}
              colors={['#4F46E5']}
              tintColor="#4F46E5"
            />
          }
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
                  onPress={() => handleMeetingTypeChange(type)}
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
            style={[styles.input, { backgroundColor: '#F1F5F9', color: '#475569' }]}
            placeholder="Loading organizer name..."
            placeholderTextColor="#94A3B8"
            value={organizer}
            onChangeText={setOrganizer}
            editable={false}
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

          {(meetingMode === 'Physical' || meetingMode === 'Hybrid') && (
            <>
              <Text style={styles.sectionLabel}>Meeting Venue / Location *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Apollo Hospital Conference Hall"
                placeholderTextColor="#94A3B8"
                value={venue}
                onChangeText={setVenue}
              />
            </>
          )}

          {(meetingMode === 'Online' || meetingMode === 'Hybrid') && (
            <>
              <Text style={styles.sectionLabel}>Meeting Link *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. https://meet.google.com/abc-xyz"
                placeholderTextColor="#94A3B8"
                value={meetingLink}
                onChangeText={setMeetingLink}
              />
            </>
          )}

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

          {(meetingType === 'Doctor Group Meeting' || meetingType === 'Clinical Presentation') && (
            <>
              <Text style={styles.sectionLabel}>Select Doctor *</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={selectedDoctorId}
                  onValueChange={(value) => setSelectedDoctorId(value)}
                >
                  <Picker.Item label="Select Doctor" value={null} color="#94A3B8" />
                  {getDoctorsList().map((doctor) => (
                    <Picker.Item key={doctor.id} label={doctor.name} value={doctor.id} />
                  ))}
                </Picker>
              </View>
            </>
          )}

          {meetingType === 'Chemist Meeting' && (
            <>
              <Text style={styles.sectionLabel}>Select Chemist *</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={selectedChemistId}
                  onValueChange={(value) => setSelectedChemistId(value)}
                >
                  <Picker.Item label="Select Chemist" value={null} color="#94A3B8" />
                  {getChemistsList().map((chemist) => (
                    <Picker.Item key={chemist.id} label={chemist.name} value={chemist.id} />
                  ))}
                </Picker>
              </View>
            </>
          )}

          {meetingType === 'Hospital Meeting' && (
            <>
              <Text style={styles.sectionLabel}>Select Hospital *</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={selectedHospitalId}
                  onValueChange={(value) => setSelectedHospitalId(value)}
                >
                  <Picker.Item label="Select Hospital" value={null} color="#94A3B8" />
                  {getHospitalsList().map((hosp) => (
                    <Picker.Item key={hosp.id} label={hosp.name} value={hosp.id} />
                  ))}
                </Picker>
              </View>
            </>
          )}

          {meetingType === 'Stockist Review' && (
            <>
              <Text style={styles.sectionLabel}>Select Stockist *</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={selectedStockistId}
                  onValueChange={(value) => setSelectedStockistId(value)}
                >
                  <Picker.Item label="Select Stockist" value={null} color="#94A3B8" />
                  {getStockistsList().map((stock) => (
                    <Picker.Item key={stock.id} label={stock.name} value={stock.id} />
                  ))}
                </Picker>
              </View>
            </>
          )}

          <Text style={styles.sectionLabel}>Meeting Agenda / Notes</Text>
          <TextInput
            style={styles.textArea}
            placeholder="What will be discussed/demonstrated..."
            placeholderTextColor="#94A3B8"
            value={agenda}
            onChangeText={setAgenda}
            multiline
            numberOfLines={3}
        
          />

          <TouchableOpacity 
            style={[styles.submitBtn, submitting && { opacity: 0.7 }]} 
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.submitBtnText}>SCHEDULE MEETING</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* History / Scheduled list */}
        {meetings.length > 0 && (
          <>
            <Text style={styles.historyTitle}>Scheduled Meetings ({meetings.length})</Text>
            {meetings.map((meet) => {
              const currentStatus = getMeetingStatus(meet);
              const statusStyle = getStatusColor(currentStatus);
              const isScheduled = currentStatus === 'Scheduled' || currentStatus === "Today's Meeting";

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
                          {currentStatus}
                        </Text>
                      </View>
                    </View>
                    <View style={{ gap: 6, alignItems: 'flex-end' }}>
                      <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                        <Text style={[styles.statusBadgeText, { color: statusStyle.text }]}>
                          {currentStatus}
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
                    🕒 Time: {
                      meet.meetingDate
                        ? (() => {
                            const d = new Date(meet.meetingDate);
                            return isNaN(d.getTime())
                              ? (meet.time || 'N/A')
                              : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                          })()
                        : (meet.time || 'N/A')
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

                  {(meet.meetingType === 'Doctor Group Meeting' || meet.meetingType === 'Clinical Presentation') && (
                    <Text style={styles.meetInfo}>
                      👨‍⚕️ Doctor: {
                        meet.meetingDoctors && meet.meetingDoctors.length > 0
                          ? meet.meetingDoctors.map((d: any) => d.doctor?.name || d.doctor?.doctorName || 'N/A').join(', ')
                          : 'N/A'
                      }
                    </Text>
                  )}

                  {meet.meetingType === 'Chemist Meeting' && (
                    <Text style={styles.meetInfo}>
                      💊 Chemist: {
                        meet.meetingChemists && meet.meetingChemists.length > 0
                          ? meet.meetingChemists.map((c: any) => c.chemist?.name || 'N/A').join(', ')
                          : 'N/A'
                      }
                    </Text>
                  )}

                  {meet.meetingType === 'Hospital Meeting' && (
                    <Text style={styles.meetInfo}>
                      🏥 Hospital: {
                        meet.meetingHospitals && meet.meetingHospitals.length > 0
                          ? meet.meetingHospitals.map((h: any) => h.hospital?.name || 'N/A').join(', ')
                          : 'N/A'
                      }
                    </Text>
                  )}

                  {meet.meetingType === 'Stockist Review' && (
                    <Text style={styles.meetInfo}>
                      📦 Stockist: {
                        meet.meetingStockists && meet.meetingStockists.length > 0
                          ? meet.meetingStockists.map((s: any) => s.stockist?.name || 'N/A').join(', ')
                          : 'N/A'
                      }
                    </Text>
                  )}

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

                  {meet.meetingLink ? (
                    <TouchableOpacity
                      onPress={() => {
                        Linking.openURL(meet.meetingLink!).catch(() =>
                          customAlert('Error', 'Unable to open meeting link.')
                        );
                      }}
                      style={{
                        backgroundColor: '#EFF6FF',
                        borderColor: '#BFDBFE',
                        borderWidth: 1,
                        padding: 10,
                        borderRadius: 8,
                        marginTop: 10,
                        alignItems: 'center',
                        flexDirection: 'row',
                        justifyContent: 'center',
                        gap: 8,
                      }}
                    >
                      <Text style={{ color: '#1E40AF', fontWeight: 'bold', fontSize: 13 }}>
                        💻 Join Online Meeting
                      </Text>
                    </TouchableOpacity>
                  ) : null}

                  {isScheduled && (
                    <View style={styles.cardActionsRow}>
                      {updatingStatusId === meet.id ? (
                        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 10 }}>
                          <ActivityIndicator size="small" color="#4F46E5" />
                        </View>
                      ) : (
                        <>
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
                        </>
                      )}
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
    paddingTop: 64,
    paddingBottom: 25,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 16,
    top: 56,
    zIndex: 10,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
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
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#4F46E5',
    fontWeight: '600',
  },
});