import {
  createLeaveRequest,
  getLeavesByMr
} from '../../services/leaveService';import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import RNDateTimePicker from '@react-native-community/datetimepicker';

interface LeaveRequest {
  id: number;
  leaveType: string;
  fromDate: string;
  toDate: string;
  isHalfDay?: boolean;
  reason: string;
  status: string;
  managerComment?: string;
  appliedAt: string;
  totalDays?: number;
}

const safeJsonParse = (data: string | null, fallback: any) => {
  if (!data) return fallback;
  try {
    return JSON.parse(data);
  } catch (err) {
    console.log('safeJsonParse error in LeaveRequestScreen:', err);
    return fallback;
  }
};

const LeaveRequestScreen = () => {
  const navigation = useNavigation<any>();
  const [leaveType, setLeaveType] = useState<'Casual Leave' | 'Sick Leave' | 'Earned Leave'>('Casual Leave');
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState('');
  const [history, setHistory] = useState<LeaveRequest[]>([]);

  const scrollViewRef = React.useRef<ScrollView>(null);

  // Native Date Picker controls
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  // Leave Balances state
  const [balances, setBalances] = useState({
    casual: 8,
    sick: 5,
    earned: 12,
  });

  const customAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  useEffect(() => {
    loadLeaveData();
  }, []);

  const loadLeaveData = async () => {
  try {
    const history = await getLeavesByMr();

    console.log('LEAVES FROM API =>', history);

    setHistory(history);

    const storedBalances = await AsyncStorage.getItem('@leave_balances');
    setBalances(
      safeJsonParse(storedBalances, {
        casual: 8,
        sick: 5,
        earned: 12,
      })
    );
  } catch (e) {
    console.log('Failed to load leave data:', e);
  }
};

  // Helper: Format date string from YYYY-MM-DD to DD-MM-YYYY for display
  const formatDateDisplay = (dateStr?: string): string => {
  if (!dateStr) return 'N/A';

  const date = new Date(dateStr);

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  return `${day}-${month}-${year}`;
};

  const calculateDays = (start: string, end: string): number => {
    if (isHalfDay) return 0.5;
    try {
      const s = new Date(start);
      const e = new Date(end);
      const diffTime = e.getTime() - s.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return isNaN(diffDays) || diffDays <= 0 ? 1 : diffDays;
    } catch (err) {
      console.log('calculateDays error:', err);
      return 1;
    }
  };

  const handleSubmit = async () => {
    if (!reason.trim()) {
      customAlert('Error', 'Please provide a reason for the leave.');
      return;
    }

    const currentStartDate = startDate;
    const currentEndDate = isHalfDay ? startDate : endDate;

    if (!isHalfDay && new Date(currentStartDate) > new Date(currentEndDate)) {
      customAlert('Error', 'Start Date cannot be after End Date.');
      return;
    }

    const totalDays = calculateDays(currentStartDate, currentEndDate);
    const requiredBalance = leaveType === 'Casual Leave' ? balances.casual : leaveType === 'Sick Leave' ? balances.sick : balances.earned;

    if (totalDays > requiredBalance) {
      customAlert(
        'Insufficient Balance', 
        `You requested ${totalDays} day(s), but only have ${requiredBalance} day(s) remaining for ${leaveType}.`
      );
      return;
    }
    
    try {
      await createLeaveRequest(
        leaveType,
        currentStartDate,
        currentEndDate,
        reason
      );
      console.log('Leave Request Saved Successfully');
    } catch (error) {
      console.log('Leave Request API Error:', error);
      customAlert('Error', 'Failed to submit leave request');
      return;
    }

    const newRequest: LeaveRequest = {
      id: Date.now(),
      leaveType,
      fromDate: currentStartDate,
      toDate: currentEndDate,
      isHalfDay,
      reason,
      status: 'Pending',
      managerComment: 'Awaiting review from Area Manager',
      appliedAt: new Date().toLocaleDateString(),
      totalDays,
    };

    const updatedHistory = [newRequest, ...history];
    setHistory(updatedHistory);

    // Update & Save Leave Balances in AsyncStorage
    const newBalances = { ...balances };
    if (leaveType === 'Casual Leave') newBalances.casual -= totalDays;
    else if (leaveType === 'Sick Leave') newBalances.sick -= totalDays;
    else newBalances.earned -= totalDays;
    
    setBalances(newBalances);

    try {
      await AsyncStorage.setItem('@leave_requests', JSON.stringify(updatedHistory));
      await AsyncStorage.setItem('@leave_balances', JSON.stringify(newBalances));
      customAlert('Success', `Leave request for ${totalDays} day(s) submitted successfully.`);
      setReason('');
    } catch (e) {
      customAlert('Error', 'Failed to save leave request.');
    }
  };

const getStatusStyle = (status: string) => {

  switch (status?.toUpperCase()) {

    case 'APPROVED':
      return {
        bg: '#D1FAE5',
        text: '#059669',
      };

    case 'REJECTED':
      return {
        bg: '#FFE4E6',
        text: '#E11D48',
      };

    default:
      return {
        bg: '#FEF3C7',
        text: '#D97706',
      };
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
        <Text style={styles.headerTitle}>📝 Leave Request Screen</Text>
        <Text style={styles.headerSubtitle}>Submit leaves & review balances</Text>
      </View>

      {/* Leave Balances Grid */}
      <View style={styles.balanceContainer}>
        <View style={[styles.balanceCard, { borderLeftColor: '#3B82F6' }]}>
          <Text style={[styles.balanceValue, { color: '#2563EB' }]}>{balances.casual}</Text>
          <Text style={styles.balanceLabel}>Casual (CL)</Text>
        </View>
        <View style={[styles.balanceCard, { borderLeftColor: '#10B981' }]}>
          <Text style={[styles.balanceValue, { color: '#059669' }]}>{balances.sick}</Text>
          <Text style={styles.balanceLabel}>Sick (SL)</Text>
        </View>
        <View style={[styles.balanceCard, { borderLeftColor: '#F59E0B' }]}>
          <Text style={[styles.balanceValue, { color: '#D97706' }]}>{balances.earned}</Text>
          <Text style={styles.balanceLabel}>Earned (EL)</Text>
        </View>
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView 
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Leave Form */}
          <View style={styles.formCard}>
            <Text style={styles.sectionLabel}>Leave Type *</Text>
            <View style={styles.typeSelectorRow}>
              {(['Casual Leave', 'Sick Leave', 'Earned Leave'] as const).map((type) => (
                <TouchableOpacity
                  key={type}
                  onPress={() => setLeaveType(type)}
                  style={[styles.typeBtn, leaveType === type && styles.typeBtnActive]}
                >
                  <Text style={[styles.typeBtnText, leaveType === type && styles.typeBtnTextActive]}>
                    {type.split(' ')[0]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Half-Day vs Full-Day Option */}
            <Text style={styles.sectionLabel}>Leave Duration *</Text>
            <View style={styles.typeSelectorRow}>
              <TouchableOpacity
                onPress={() => setIsHalfDay(false)}
                style={[styles.typeBtn, !isHalfDay && styles.typeBtnActive]}
              >
                <Text style={[styles.typeBtnText, !isHalfDay && styles.typeBtnTextActive]}>
                  Full Day
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setIsHalfDay(true)}
                style={[styles.typeBtn, isHalfDay && styles.typeBtnActive]}
              >
                <Text style={[styles.typeBtnText, isHalfDay && styles.typeBtnTextActive]}>
                  Half Day
                </Text>
              </TouchableOpacity>
            </View>

            {/* Date Range selectors */}
            <View style={styles.dateRangeRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionLabel}>Start Date *</Text>
                {Platform.OS === 'web' ? (
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    style={webInputStyle}
                  />
                ) : (
                  <TouchableOpacity
                    style={styles.nativeDateBtn}
                    onPress={() => setShowStartDatePicker(true)}
                  >
                    <Text style={styles.nativeDateText}>{formatDateDisplay(startDate)}</Text>
                  </TouchableOpacity>
                )}
                {showStartDatePicker && (
                  <RNDateTimePicker
                    mode="date"
                    value={new Date(startDate)}
                    onChange={(e, d) => {
                      setShowStartDatePicker(false);
                      if (d) setStartDate(d.toISOString().split('T')[0]);
                    }}
                  />
                )}
              </View>

              {/* Render End Date ONLY if it is not a Half-Day */}
              {!isHalfDay && (
                <View style={{ flex: 1 }}>
                  <Text style={styles.sectionLabel}>End Date *</Text>
                  {Platform.OS === 'web' ? (
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      style={webInputStyle}
                    />
                  ) : (
                    <TouchableOpacity
                      style={styles.nativeDateBtn}
                      onPress={() => setShowEndDatePicker(true)}
                    >
                      <Text style={styles.nativeDateText}>{formatDateDisplay(endDate)}</Text>
                    </TouchableOpacity>
                  )}
                  {showEndDatePicker && (
                    <RNDateTimePicker
                      mode="date"
                      value={new Date(endDate)}
                      onChange={(e, d) => {
                        setShowEndDatePicker(false);
                        if (d) setEndDate(d.toISOString().split('T')[0]);
                      }}
                    />
                  )}
                </View>
              )}
            </View>

            {/* Leave Reason Text area */}
            <Text style={[styles.sectionLabel, { marginTop: 12 }]}>Reason / Details *</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Provide medical reasons or urgency details..."
              placeholderTextColor="#94A3B8"
              value={reason}
              onChangeText={setReason}
              multiline
              numberOfLines={4}
              onFocus={() => {
                setTimeout(() => {
                  scrollViewRef.current?.scrollToEnd({ animated: true });
                }, 150);
              }}
            />

            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
              <Text style={styles.submitBtnText}>SUBMIT LEAVE REQUEST</Text>
            </TouchableOpacity>
          </View>

          {/* History Log */}
          {history.length > 0 && (
            <>
              <Text style={styles.historyTitle}>Leave Log History ({history.length})</Text>
              {history.map((req) => {
                const statusStyle = getStatusStyle(req.status);
                return (
                  <View key={req.id} style={styles.historyCard}>
                    <View style={styles.historyCardHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.historyLeaveType}>
                          {req.leaveType} {req.isHalfDay ? '(Half Day)' : ''}
                        </Text>
                        <Text style={styles.historyDays}>Total Days: {calculateDays(req.fromDate, req.toDate)} Day(s)</Text>
                      </View>
                      
                      {/* Changed to plain View — interactive toggle capability removed */}
                      <View
                        style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}
                      >
                        <Text style={[styles.statusBadgeText, { color: statusStyle.text }]}>
                          {req.status}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.divider} />
                    
                    <Text style={styles.historyInfo}>
  📅 Duration: {formatDateDisplay(req.fromDate)}
  {req.isHalfDay ? '' : ` to ${formatDateDisplay(req.toDate)}`}
</Text>
                    <Text style={styles.historyInfo}>📝 Reason: {req.reason}</Text>
                    
                    {/* Manager Comment display */}
                    {req.managerComment ? (
                      <View style={styles.managerCommentBox}>
                        <Text style={styles.managerCommentLabel}>💬 Manager Remarks:</Text>
                        <Text style={styles.managerCommentText}>{req.managerComment}</Text>
                      </View>
                    ) : null}
                    
                   <Text style={styles.appliedDate}>
  Applied on: {req.appliedAt ? formatDateDisplay(req.appliedAt) : 'N/A'}
</Text>
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

export default LeaveRequestScreen;

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
  appliedDate: {
  fontSize: 12,
  color: '#64748B',
  textAlign: 'right',
  marginTop: 8,
},
  headerSubtitle: {
    fontSize: 12,
    color: '#E0E7FF',
    textAlign: 'center',
    marginTop: 6,
  },
  balanceContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
    marginTop: -15,
    zIndex: 10,
  },
  balanceCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  balanceValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  balanceLabel: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
    fontWeight: '600',
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
    marginTop: 6,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
  },
  typeBtnActive: {
    backgroundColor: '#4F46E5',
  },
  typeBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  typeBtnTextActive: {
    color: '#FFFFFF',
  },
  dateRangeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  nativeDateBtn: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
  },
  nativeDateText: {
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
    height: 100,
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
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  historyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  historyLeaveType: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  historyDays: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
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
  historyInfo: {
    fontSize: 13,
    color: '#334155',
    marginTop: 4,
  },
  managerCommentBox: {
    marginTop: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#CBD5E1',
  },
  managerCommentLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#64748B',
  },
  managerCommentText: {
    fontSize: 12,
    color: '#334155',
    marginTop: 3,
    lineHeight: 16,
  },
  historyApplied: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'right',
    marginTop: 8,
  },
});