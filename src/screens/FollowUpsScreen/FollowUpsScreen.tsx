import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  TextInput,
  Linking,
  Modal,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RNDateTimePicker from '@react-native-community/datetimepicker';

const safeJsonParse = (data: string | null, fallback: any) => {
  if (!data) return fallback;
  try {
    return JSON.parse(data);
  } catch (err) {
    console.log('safeJsonParse error in FollowUpsScreen:', err);
    return fallback;
  }
};

const FollowUpsScreen = () => {
  const [visits, setVisits] = useState<any[]>([]);
  const [filteredVisits, setFilteredVisits] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'All' | 'Pending' | 'Completed' | 'Overdue'>('Pending');

  // Stats
  const [stats, setStats] = useState({
    pending: 0,
    completed: 0,
    overdue: 0,
  });

  // Modal Rescheduling state
  const [rescheduleModalVisible, setRescheduleModalVisible] = useState(false);
  const [selectedVisitId, setSelectedVisitId] = useState<number | null>(null);
  const [newFollowUpDate, setNewFollowUpDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Expandable Card state (stores expanded visit IDs)
  const [expandedCards, setExpandedCards] = useState<{ [key: number]: boolean }>({});

  // Web safe alert helper
  const customAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  // Helper: Parse DD-MM-YYYY or DD-MMM-YYYY date string into a JS Date object
  const parseDateString = (dateStr: string): Date => {
    if (!dateStr) return new Date();
    const parts = dateStr.split(/[-/]/);
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const monthStr = parts[1];
      const year = parseInt(parts[2], 10);

      const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
      let month = parseInt(monthStr, 10) - 1;
      if (isNaN(month)) {
        month = months.indexOf(monthStr.toLowerCase());
      }
      if (month >= 0 && month < 12) {
        return new Date(year, month, day);
      }
    }
    return new Date(dateStr);
  };

  // Helper: Format Date to DD-MM-YYYY format
  const formatDateString = (dateObj: Date): string => {
    const day = dateObj.getDate().toString().padStart(2, '0');
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const year = dateObj.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // Helper: Convert DD-MM-YYYY to YYYY-MM-DD for Web Date Input
  const getWebDateFormat = (dateStr: string): string => {
    const parts = dateStr.split(/[-/]/);
    if (parts.length === 3) {
      const day = parts[0];
      const monthStr = parts[1];
      const year = parts[2];
      const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
      let monthVal = monthStr;
      if (isNaN(parseInt(monthStr, 10))) {
        const idx = months.indexOf(monthStr.toLowerCase()) + 1;
        monthVal = idx.toString().padStart(2, '0');
      }
      return `${year}-${monthVal}-${day}`;
    }
    return dateStr;
  };

  // Helper: Convert YYYY-MM-DD back to DD-MM-YYYY
  const handleDateChangeWeb = (val: string): string => {
    if (!val) return '';
    const parts = val.split('-');
    if (parts.length === 3) {
      const year = parts[0];
      const month = parts[1];
      const day = parts[2];
      return `${day}-${month}-${year}`;
    }
    return val;
  };

  // Helper: Check if a date string has passed today's date
  const isDateOverdue = (dateStr: string, status: string): boolean => {
    if (status === 'Completed') return false;
    try {
      const dateObj = parseDateString(dateStr);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      dateObj.setHours(0, 0, 0, 0);
      return dateObj.getTime() < today.getTime();
    } catch (e) {
      return false;
    }
  };

  // Helper: Check if a date is today
  const isDateToday = (dateStr: string): boolean => {
    try {
      const dateObj = parseDateString(dateStr);
      const today = new Date();
      return (
        dateObj.getDate() === today.getDate() &&
        dateObj.getMonth() === today.getMonth() &&
        dateObj.getFullYear() === today.getFullYear()
      );
    } catch (e) {
      return false;
    }
  };

  useEffect(() => {
    loadFollowUps();
  }, []);

  // Filter logic on query or tab change
  useEffect(() => {
    filterAndCategorize();
  }, [visits, searchQuery, activeTab]);

  const loadFollowUps = async () => {
    setLoading(true);
    setError(null);
    try {
      const storedVisits = await AsyncStorage.getItem('@doctor_visits');
      const parsed = safeJsonParse(storedVisits, []);
      setVisits(parsed);
    } catch (err) {
      console.log('Failed to load doctor visits:', err);
      setError('Failed to load doctor follow-up visits.');
    } finally {
      setLoading(false);
    }
  };

  const filterAndCategorize = () => {
    // 1. Gather all visits that have followUpDate set
    const allFollowUps = visits.filter(
      (v: any) => v.followUpDate && v.followUpDate.trim() !== ''
    );

    // 2. Compute live status statistics
    let pendingCount = 0;
    let completedCount = 0;
    let overdueCount = 0;

    allFollowUps.forEach((v: any) => {
      if (v.followUpStatus === 'Completed') {
        completedCount++;
      } else {
        pendingCount++;
        if (isDateOverdue(v.followUpDate, v.followUpStatus || '')) {
          overdueCount++;
        }
      }
    });

    setStats({
      pending: pendingCount,
      completed: completedCount,
      overdue: overdueCount,
    });

    // 3. Filter list based on search query
    let list = allFollowUps.filter((v: any) => {
      const term = searchQuery.toLowerCase();
      const docName = (v.doctorName || '').toLowerCase();
      const spec = (v.specialty || '').toLowerCase();
      const hosp = (v.hospital || '').toLowerCase();
      return docName.includes(term) || spec.includes(term) || hosp.includes(term);
    });

    // 4. Sort and filter list based on selected Tab
    if (activeTab === 'Pending') {
      list = list.filter((v: any) => v.followUpStatus !== 'Completed');
    } else if (activeTab === 'Completed') {
      list = list.filter((v: any) => v.followUpStatus === 'Completed');
    } else if (activeTab === 'Overdue') {
      list = list.filter((v: any) => v.followUpStatus !== 'Completed' && isDateOverdue(v.followUpDate, v.followUpStatus || ''));
    }

    // Sort: Overdue & Today first, then ascending order of dates
    list.sort((a: any, b: any) => {
      return parseDateString(a.followUpDate).getTime() - parseDateString(b.followUpDate).getTime();
    });

    setFilteredVisits(list);
  };

  const handleMarkCompleted = async (visitId: number) => {
    const updatedVisits = visits.map((v) => {
      if (v.id === visitId) {
        return { ...v, followUpStatus: 'Completed' };
      }
      return v;
    });

    setVisits(updatedVisits);
    try {
      await AsyncStorage.setItem('@doctor_visits', JSON.stringify(updatedVisits));
      customAlert('Completed!', 'Follow-up has been marked as completed.');
    } catch (e) {
      console.log('Failed to save status');
    }
  };

  const openRescheduleModal = (visitId: number, currentDate: string) => {
    setSelectedVisitId(visitId);
    setNewFollowUpDate(currentDate);
    setRescheduleModalVisible(true);
  };

  const handleRescheduleSubmit = async () => {
    if (!newFollowUpDate || newFollowUpDate.trim() === '') {
      customAlert('Error', 'Please enter or select a valid date.');
      return;
    }

    const updatedVisits = visits.map((v: any) => {
      if (v.id === selectedVisitId) {
        return {
          ...v,
          followUpDate: newFollowUpDate,
          followUpStatus: 'Rescheduled',
        };
      }
      return v;
    });

    setVisits(updatedVisits);
    try {
      await AsyncStorage.setItem('@doctor_visits', JSON.stringify(updatedVisits));
      setRescheduleModalVisible(false);
      customAlert('Rescheduled', `Follow-up has been rescheduled to ${newFollowUpDate}.`);
    } catch (e) {
      console.log('Failed to reschedule follow-up');
    }
  };

  const onNativeDateChange = (event: any, date?: Date) => {
    setShowDatePicker(false);
    if (date) {
      setNewFollowUpDate(formatDateString(date));
    }
  };

  const makeCall = (phoneNumber: string) => {
    if (!phoneNumber) {
      customAlert('Error', 'No mobile number logged for this doctor.');
      return;
    }
    const cleanNumber = phoneNumber.replace(/[^0-9+]/g, '');
    Linking.openURL(`tel:${cleanNumber}`).catch(() => {
      customAlert('Error', 'Dialer could not be launched on this platform.');
    });
  };

  const toggleCardExpansion = (id: number) => {
    setExpandedCards((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const getStatusIndicatorColor = (item: any) => {
    if (item.followUpStatus === 'Completed') return '#10B981'; // Green
    if (isDateOverdue(item.followUpDate, item.followUpStatus || '')) return '#EF4444'; // Red
    if (isDateToday(item.followUpDate)) return '#3B82F6'; // Blue
    return '#F59E0B'; // Orange / Upcoming
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
      {/* Header and Stats */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🩺 Follow-Ups Tracker</Text>

        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { borderLeftColor: '#F59E0B' }]}>
            <Text style={[styles.summaryValue, { color: '#D97706' }]}>{stats.pending}</Text>
            <Text style={styles.summaryLabel}>Pending</Text>
          </View>
          <View style={[styles.summaryCard, { borderLeftColor: '#EF4444' }]}>
            <Text style={[styles.summaryValue, { color: '#DC2626' }]}>{stats.overdue}</Text>
            <Text style={styles.summaryLabel}>Overdue</Text>
          </View>
          <View style={[styles.summaryCard, { borderLeftColor: '#10B981' }]}>
            <Text style={[styles.summaryValue, { color: '#059669' }]}>{stats.completed}</Text>
            <Text style={styles.summaryLabel}>Completed</Text>
          </View>
        </View>
      </View>

      {loading ? (
        <View style={styles.loaderCard}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loaderText}>Loading follow-up visits...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadFollowUps}>
            <Text style={styles.retryButtonText}>🔄 Retry Loading Follow-Ups</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* Search Input */}
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="🔍 Search Doctor, Specialty, or Clinic..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Navigation Tabs */}
          <View style={styles.tabContainer}>
            {(['Pending', 'Overdue', 'Completed', 'All'] as const).map((tab) => (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}
              >
                <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Follow-up Cards ScrollList */}
          <ScrollView contentContainerStyle={styles.listContainer}>
            {filteredVisits.length > 0 ? (
              filteredVisits.map((item, index) => {
                const isCompleted = item.followUpStatus === 'Completed';
                const isOverdue = isDateOverdue(item.followUpDate, item.followUpStatus || '');
                const isToday = isDateToday(item.followUpDate);
                const leftBorderColor = getStatusIndicatorColor(item);
                const isExpanded = !!expandedCards[item.id];

                return (
                  <View
                    key={`${item.id}-${index}`}
                    style={[
                      styles.card,
                      isCompleted && styles.completedCard,
                      { borderLeftColor: leftBorderColor }
                    ]}
                  >
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => toggleCardExpansion(item.id)}
                      style={styles.cardHeader}
                    >
                      <View style={styles.cardHeaderLeft}>
                        <Text style={[styles.doctorName, isCompleted && styles.lineThrough]}>
                          Dr. {item.doctorName}
                        </Text>
                        <Text style={styles.specialtyText}>🩺 {item.specialty || 'General Physician'}</Text>
                      </View>
                      <View style={styles.cardHeaderRight}>
                        <Text
                          style={[
                            styles.badge,
                            isCompleted && styles.badgeCompleted,
                            isOverdue && styles.badgeOverdue,
                            isToday && styles.badgeToday,
                          ]}
                        >
                          {isCompleted ? '🟢 Completed' : isOverdue ? '⚠️ Overdue' : isToday ? '⏰ Today' : '📅 Upcoming'}
                        </Text>
                        <Text style={styles.dateText}>{item.followUpDate}</Text>
                      </View>
                    </TouchableOpacity>

                    <View style={styles.cardDetailsShort}>
                      <Text style={styles.detailsText}>🏥 Clinic: {item.hospital || 'Private Clinic'}</Text>
                    </View>

                    {/* Expanded Card Section */}
                    {isExpanded && (
                      <View style={styles.expandedContent}>
                        <View style={styles.divider} />
                        {item.mobile ? (
                          <Text style={styles.expandedText}>📱 Mobile: {item.mobile}</Text>
                        ) : null}
                        {item.products ? (
                          <Text style={styles.expandedText}>💊 Products Discussed: {item.products}</Text>
                        ) : null}
                        {item.samples ? (
                          <Text style={styles.expandedText}>📦 Samples Distributed: {item.samples}</Text>
                        ) : null}
                        {item.notes ? (
                          <Text style={styles.expandedText}>📝 Discussion Notes: {item.notes}</Text>
                        ) : null}
                        {item.remarks ? (
                          <Text style={styles.expandedText}>💬 Remarks: {item.remarks}</Text>
                        ) : null}
                      </View>
                    )}

                    {/* Card Action Drawer Buttons */}
                    {!isCompleted && (
                      <View style={styles.actionsRow}>
                        <TouchableOpacity
                          onPress={() => makeCall(item.mobile)}
                          style={[styles.actionBtn, styles.callBtn]}
                        >
                          <Text style={styles.callBtnText}>📱 Call Doctor</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => openRescheduleModal(item.id, item.followUpDate)}
                          style={[styles.actionBtn, styles.rescheduleBtn]}
                        >
                          <Text style={styles.rescheduleBtnText}>📅 Reschedule</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => handleMarkCompleted(item.id)}
                          style={[styles.actionBtn, styles.completeBtn]}
                        >
                          <Text style={styles.completeBtnText}>✔️ Complete</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              })
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No follow-ups matches found.</Text>
              </View>
            )}
            <View style={{ height: 40 }} />
          </ScrollView>
        </>
      )}

      {/* Reschedule Datepicker Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={rescheduleModalVisible}
        onRequestClose={() => setRescheduleModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>📅 Reschedule Follow-Up</Text>

            <View style={styles.modalInputWrapper}>
              {Platform.OS === 'web' ? (
                <input
                  type="date"
                  value={getWebDateFormat(newFollowUpDate)}
                  onChange={(e) => setNewFollowUpDate(handleDateChangeWeb(e.target.value))}
                  style={webInputStyle}
                />
              ) : (
                <>
                  <TouchableOpacity
                    style={styles.nativeDateButton}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Text style={styles.nativeDateButtonText}>
                      {newFollowUpDate || 'Select Date'}
                    </Text>
                  </TouchableOpacity>
                  {showDatePicker && (
                    <RNDateTimePicker
                      mode="date"
                      value={newFollowUpDate ? parseDateString(newFollowUpDate) : new Date()}
                      onChange={onNativeDateChange}
                    />
                  )}
                </>
              )}
            </View>

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalCancelBtn]}
                onPress={() => setRescheduleModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalConfirmBtn]}
                onPress={handleRescheduleSubmit}
              >
                <Text style={styles.modalConfirmText}>Reschedule</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default FollowUpsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#312E81',
    paddingTop: 60,
    paddingBottom: 25,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 18,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderLeftWidth: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  summaryLabel: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
    fontWeight: '600',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginTop: -18,
    zIndex: 10,
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 20,
    fontSize: 14,
    color: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 15,
    marginBottom: 10,
    gap: 6,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
    backgroundColor: '#E2E8F0',
  },
  activeTabButton: {
    backgroundColor: '#4F46E5',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  completedCard: {
    opacity: 0.6,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardHeaderLeft: {
    flex: 1,
    paddingRight: 10,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  specialtyText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  cardHeaderRight: {
    alignItems: 'flex-end',
  },
  badge: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#D97706',
    backgroundColor: '#FEF3C7',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  badgeCompleted: {
    color: '#059669',
    backgroundColor: '#D1FAE5',
  },
  badgeOverdue: {
    color: '#DC2626',
    backgroundColor: '#FEE2E2',
  },
  badgeToday: {
    color: '#2563EB',
    backgroundColor: '#DBEAFE',
  },
  dateText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
    marginTop: 6,
  },
  cardDetailsShort: {
    marginTop: 4,
  },
  detailsText: {
    fontSize: 13,
    color: '#334155',
  },
  lineThrough: {
    textDecorationLine: 'line-through',
  },
  expandedContent: {
    marginTop: 10,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 8,
  },
  expandedText: {
    fontSize: 13,
    color: '#475569',
    marginTop: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  callBtn: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  callBtnText: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: 'bold',
  },
  rescheduleBtn: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  rescheduleBtnText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: 'bold',
  },
  completeBtn: {
    backgroundColor: '#10B981',
  },
  completeBtnText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  emptyContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  emptyText: {
    fontSize: 14,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    maxWidth: 340,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalInputWrapper: {
    marginBottom: 20,
    width: '100%',
  },
  nativeDateButton: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
  },
  nativeDateButtonText: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '500',
  },
  modalButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalCancelBtn: {
    backgroundColor: '#F1F5F9',
  },
  modalCancelText: {
    fontSize: 14,
    color: '#475569',
    fontWeight: 'bold',
  },
  modalConfirmBtn: {
    backgroundColor: '#4F46E5',
  },
  modalConfirmText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  loaderCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    marginVertical: 20,
    marginHorizontal: 20,
  },
  loaderText: {
    marginTop: 15,
    fontSize: 14,
    color: '#666',
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    borderColor: '#FFCDD2',
    borderWidth: 1,
    borderRadius: 16,
    padding: 24,
    marginVertical: 15,
    marginHorizontal: 20,
    alignItems: 'center',
  },
  errorText: {
    color: '#C62828',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#C62828',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
});