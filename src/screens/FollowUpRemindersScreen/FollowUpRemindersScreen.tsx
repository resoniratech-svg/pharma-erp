import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  TextInput,
  Modal,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import RNDateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';

interface FollowUpReminder {
  id: string;
  name: string;
  type: 'Doctor' | 'Chemist' | 'Hospital' | 'Other';
  date: string; // DD-MM-YYYY format
  purpose: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Pending' | 'Completed' | 'Overdue';
  notes?: string;
  contactPerson?: string;
}

const SEED_FOLLOW_UPS: FollowUpReminder[] = [
  {
    id: '1',
    name: 'Dr. Ramesh Kumar',
    type: 'Doctor',
    date: '15-Jun-2026',
    purpose: 'Product Discussion',
    priority: 'High',
    status: 'Pending',
    notes: 'Discuss the new cardiac drug range and hand over product brochures.',
    contactPerson: 'Clinic Front Desk'
  },
  {
    id: '2',
    name: 'Apollo Pharmacy Central',
    type: 'Chemist',
    date: '16-Jun-2026',
    purpose: 'Pending Orders',
    priority: 'Medium',
    status: 'Pending',
    notes: 'Follow up on the pending order for Paracetamol 500mg batches.',
    contactPerson: 'Mr. Srinivas (Manager)'
  },
  {
    id: '3',
    name: 'Hyderabad City Hospital',
    type: 'Hospital',
    date: '12-Jun-2026',
    purpose: 'Sample Requests',
    priority: 'High',
    status: 'Pending',
    notes: 'Deliver pediatric suspension samples requested by the HOD.',
    contactPerson: 'Dr. Anjali (HOD Pediatrics)'
  },
  {
    id: '4',
    name: 'Dr. Sneha Reddy',
    type: 'Doctor',
    date: '14-Jun-2026',
    purpose: 'Discuss New Drug Launches',
    priority: 'Low',
    status: 'Completed',
    notes: 'Initial introduction of anti-diabetic formulations. Doctors feedback was very positive.',
    contactPerson: 'Personal Assistant'
  },
  {
    id: '5',
    name: 'Care Hospitals Secunderabad',
    type: 'Hospital',
    date: '18-Jun-2026',
    purpose: 'Contract Renewal',
    priority: 'High',
    status: 'Pending',
    notes: 'Follow up with purchase committee regarding yearly rate contracts.',
    contactPerson: 'Mr. Prabhakar (Purchase HOD)'
  }
];

const safeJsonParse = (data: string | null, fallback: any) => {
  if (!data) return fallback;
  try {
    return JSON.parse(data);
  } catch (err) {
    console.log('safeJsonParse error:', err);
    return fallback;
  }
};

const FollowUpRemindersScreen = () => {
  const navigation = useNavigation<any>();
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'Date' | 'Priority' | 'Name'>('Date');
  const [activeTab, setActiveTab] = useState<'All' | 'Pending' | 'Completed' | 'Overdue'>('Pending');
  const [reminders, setReminders] = useState<FollowUpReminder[]>([]);

  // Modal Rescheduling State
  const [rescheduleModalVisible, setRescheduleModalVisible] = useState(false);
  const [selectedReminderId, setSelectedReminderId] = useState<string | null>(null);
  const [newDateStr, setNewDateStr] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Modal View Details State
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [activeReminder, setActiveReminder] = useState<FollowUpReminder | null>(null);

  // Web safe alert helper
  const customAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  // Date parsers and formats
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

  const formatDateString = (dateObj: Date): string => {
    const day = dateObj.getDate().toString().padStart(2, '0');
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const year = dateObj.getFullYear();
    return `${day}-${month}-${year}`;
  };

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

  const isDateOverdue = (dateStr: string, status: string): boolean => {
    if (status === 'Completed') return false;
    try {
      const dateObj = parseDateString(dateStr);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      dateObj.setHours(0, 0, 0, 0);
      return dateObj.getTime() < today.getTime();
    } catch (e) {
      console.log('Error parsing date in isDateOverdue:', e);
      return false;
    }
  };

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
      console.log('Error parsing date in isDateToday:', e);
      return false;
    }
  };

  // Load reminders
  const loadReminders = async (showLoadingSpinner = true) => {
    if (showLoadingSpinner) {
      setLoading(true);
    }
    setError(null);
    try {
      const stored = await AsyncStorage.getItem('@follow_up_reminders');
      if (stored) {
        setReminders(safeJsonParse(stored, []));
      } else {
        // Fallback or Initial seed for MR
        await AsyncStorage.setItem('@follow_up_reminders', JSON.stringify(SEED_FOLLOW_UPS));
        setReminders(SEED_FOLLOW_UPS);
      }
    } catch (e) {
      console.log('Failed to load reminders', e);
      setError('Failed to load reminders. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadReminders(true);
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReminders(false);
    setRefreshing(false);
  };

  // Actions handlers
  const handleMarkCompleted = (id: string) => {
    if (Platform.OS === 'web') {
      const confirm = window.confirm('Are you sure you want to mark this follow-up as completed?');
      if (confirm) {
        executeMarkCompleted(id);
      }
    } else {
      Alert.alert(
        'Confirm Completion',
        'Are you sure you want to mark this follow-up as completed?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Complete', onPress: () => executeMarkCompleted(id) }
        ]
      );
    }
  };

  const executeMarkCompleted = async (id: string) => {
    const updated = reminders.map(item => {
      if (item.id === id) {
        return { ...item, status: 'Completed' as const };
      }
      return item;
    });
    setReminders(updated);
    try {
      await AsyncStorage.setItem('@follow_up_reminders', JSON.stringify(updated));
      customAlert('Follow-Up Completed', 'Status updated to Completed.');
    } catch (e) {
      console.log('Failed to save completion state', e);
    }
  };

  const openRescheduleModal = (id: string, date: string) => {
    setSelectedReminderId(id);
    setNewDateStr(date);
    setRescheduleModalVisible(true);
  };

  const handleRescheduleSubmit = async () => {
    if (!newDateStr || newDateStr.trim() === '') {
      customAlert('Error', 'Please enter or select a valid date.');
      return;
    }

    const updated = reminders.map(item => {
      if (item.id === selectedReminderId) {
        return {
          ...item,
          date: newDateStr,
          status: 'Pending' as const // Reset status to pending when rescheduled
        };
      }
      return item;
    });

    setReminders(updated);
    try {
      await AsyncStorage.setItem('@follow_up_reminders', JSON.stringify(updated));
      setRescheduleModalVisible(false);
      customAlert('Rescheduled', `Follow-up has been rescheduled to ${newDateStr}.`);
    } catch (e) {
      console.log('Failed to save rescheduled date', e);
    }
  };

  const onNativeDateChange = (event: any, date?: Date) => {
    setShowDatePicker(false);
    if (date) {
      setNewDateStr(formatDateString(date));
    }
  };

  const openDetailsModal = (reminder: FollowUpReminder) => {
    setActiveReminder(reminder);
    setDetailsModalVisible(true);
  };

  const handleResetReminders = async () => {
    try {
      await AsyncStorage.setItem('@follow_up_reminders', JSON.stringify(SEED_FOLLOW_UPS));
      setReminders(SEED_FOLLOW_UPS);
      customAlert('Reset Successful', 'Follow-up reminders reset to default demo data.');
    } catch (e) {
      console.log('Failed to reset reminders', e);
    }
  };

  // Filter and compute items
  const filtered = reminders.filter(item => {
    const query = search.toLowerCase();
    const nameMatch = item.name.toLowerCase().includes(query);
    const purposeMatch = item.purpose.toLowerCase().includes(query);
    const notesMatch = (item.notes || '').toLowerCase().includes(query);
    const typeMatch = item.type.toLowerCase().includes(query);
    const matchesSearch = nameMatch || purposeMatch || notesMatch || typeMatch;

    const overdue = isDateOverdue(item.date, item.status);
    let matchesTab = true;
    if (activeTab === 'Pending') {
      matchesTab = item.status === 'Pending' && !overdue;
    } else if (activeTab === 'Completed') {
      matchesTab = item.status === 'Completed';
    } else if (activeTab === 'Overdue') {
      matchesTab = item.status === 'Pending' && overdue;
    }

    return matchesSearch && matchesTab;
  });

  // Sort filtered list
  const sortedReminders = [...filtered].sort((a, b) => {
    if (sortBy === 'Priority') {
      const priorityWeight = { High: 3, Medium: 2, Low: 1 };
      return (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
    }
    if (sortBy === 'Name') {
      return a.name.localeCompare(b.name);
    }
    // Default: Date Sort (earliest date first)
    try {
      const dateA = parseDateString(a.date).getTime();
      const dateB = parseDateString(b.date).getTime();
      return dateA - dateB;
    } catch {
      return 0;
    }
  });

  // Calculate live stats
  const stats = {
    today: reminders.filter(r => isDateToday(r.date) && r.status === 'Pending').length,
    pending: reminders.filter(r => r.status === 'Pending' && !isDateOverdue(r.date, r.status)).length,
    completed: reminders.filter(r => r.status === 'Completed').length,
    overdue: reminders.filter(r => r.status === 'Pending' && isDateOverdue(r.date, r.status)).length,
  };

  const getPriorityColor = (priority: string) => {
    if (priority === 'High') return '#EF4444';
    if (priority === 'Medium') return '#F59E0B';
    return '#10B981';
  };

  const getStatusColor = (item: FollowUpReminder) => {
    if (item.status === 'Completed') return '#10B981';
    if (isDateOverdue(item.date, item.status)) return '#EF4444';
    return '#3B82F6';
  };

  const getStatusLabel = (item: FollowUpReminder) => {
    if (item.status === 'Completed') return 'Completed';
    if (isDateOverdue(item.date, item.status)) return 'Overdue';
    return 'Pending';
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
        <View style={styles.headerTitleRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Follow-Up Reminders</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.statsContainer}>
          <View style={[styles.statsCard, { borderLeftColor: '#3B82F6' }]}>
            <Text style={[styles.statsValue, { color: '#2563EB' }]}>{stats.today}</Text>
            <Text style={styles.statsLabel}>Today</Text>
          </View>
          <View style={[styles.statsCard, { borderLeftColor: '#F59E0B' }]}>
            <Text style={[styles.statsValue, { color: '#D97706' }]}>{stats.pending}</Text>
            <Text style={styles.statsLabel}>Pending</Text>
          </View>
          <View style={[styles.statsCard, { borderLeftColor: '#EF4444' }]}>
            <Text style={[styles.statsValue, { color: '#DC2626' }]}>{stats.overdue}</Text>
            <Text style={styles.statsLabel}>Overdue</Text>
          </View>
          <View style={[styles.statsCard, { borderLeftColor: '#10B981' }]}>
            <Text style={[styles.statsValue, { color: '#059669' }]}>{stats.completed}</Text>
            <Text style={styles.statsLabel}>Completed</Text>
          </View>
        </View>
      </View>

      {loading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Loading reminders...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContent}>
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => loadReminders(true)}>
            <Text style={styles.retryButtonText}>Retry Loading</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search by doctor, chemist, hospital or purpose..."
              placeholderTextColor="#94A3B8"
              value={search}
              onChangeText={setSearch}
            />
          </View>

          {/* Sorting Selector */}
          <View style={styles.sortContainer}>
            <Text style={styles.sortLabel}>Sort by:</Text>
            <View style={styles.sortPills}>
              {([
                { key: 'Date', label: '📅 Date' },
                { key: 'Priority', label: '🔥 Priority' },
                { key: 'Name', label: '🔤 Name' }
              ] as const).map(opt => (
                <TouchableOpacity
                  key={opt.key}
                  onPress={() => setSortBy(opt.key)}
                  style={[styles.sortPill, sortBy === opt.key && styles.activeSortPill]}
                >
                  <Text style={[styles.sortPillText, sortBy === opt.key && styles.activeSortPillText]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Filter Tabs */}
          <View style={styles.tabContainer}>
            {(['Pending', 'Overdue', 'Completed', 'All'] as const).map(tab => (
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

          {/* Reset Bar when empty */}
          {reminders.length === 0 && (
            <View style={styles.resetContainer}>
              <TouchableOpacity style={styles.resetButton} onPress={handleResetReminders}>
                <Text style={styles.resetButtonText}>Reset Demo Reminders</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Reminders List */}
          <ScrollView
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4F46E5']} />
            }
          >
            {sortedReminders.length > 0 ? (
              sortedReminders.map((item, index) => {
                const priorityColor = getPriorityColor(item.priority);
                const statusColor = getStatusColor(item);
                const statusLabel = getStatusLabel(item);

                return (
                  <View key={`${item.id}-${index}`} style={styles.card}>
                    {/* Header Row */}
                    <View style={styles.cardHeaderRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.clientName}>{item.name}</Text>
                        <Text style={styles.clientType}>
                          {item.type === 'Doctor' ? '🩺' : item.type === 'Chemist' ? '💊' : '🏥'} {item.type}
                        </Text>
                      </View>
                      <View style={styles.badgeRow}>
                        <View style={[styles.badge, { backgroundColor: priorityColor + '15' }]}>
                          <Text style={[styles.badgeText, { color: priorityColor }]}>
                            {item.priority === 'High' ? '🔴 High' : item.priority === 'Medium' ? '🟠 Medium' : '🟢 Low'}
                          </Text>
                        </View>
                        <View style={[styles.badge, { backgroundColor: statusColor + '15' }]}>
                          <Text style={[styles.badgeText, { color: statusColor }]}>
                            {statusLabel}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.divider} />

                    {/* Details Row */}
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Purpose:</Text>
                      <Text style={styles.infoValue}>{item.purpose}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Scheduled Date:</Text>
                      <Text style={[styles.infoValue, isDateOverdue(item.date, item.status) && { color: '#EF4444', fontWeight: 'bold' }]}>
                        📅 {item.date} {isDateToday(item.date) && '(Today)'}
                      </Text>
                    </View>

                    {item.notes && (
                      <Text style={styles.notesExcerpt} numberOfLines={1}>
                        📝 {item.notes}
                      </Text>
                    )}

                    <View style={styles.divider} />

                    {/* Actions Row */}
                    <View style={styles.actionsRow}>
                      <TouchableOpacity 
                        style={styles.detailsBtn} 
                        onPress={() => openDetailsModal(item)}
                      >
                        <Ionicons name="information-circle-outline" size={16} color="#4F46E5" />
                        <Text style={styles.detailsBtnText}>Details</Text>
                      </TouchableOpacity>

                      {item.status !== 'Completed' && (
                        <>
                          <TouchableOpacity 
                            style={styles.rescheduleBtn} 
                            onPress={() => openRescheduleModal(item.id, item.date)}
                          >
                            <Ionicons name="calendar-outline" size={16} color="#64748B" />
                            <Text style={styles.rescheduleBtnText}>Reschedule</Text>
                          </TouchableOpacity>

                          <TouchableOpacity 
                            style={styles.completeBtn} 
                            onPress={() => handleMarkCompleted(item.id)}
                          >
                            <Ionicons name="checkmark-circle-outline" size={16} color="#FFFFFF" />
                            <Text style={styles.completeBtnText}>Complete</Text>
                          </TouchableOpacity>
                        </>
                      )}
                    </View>
                  </View>
                );
              })
            ) : (
              <View style={styles.emptyCard}>
                <Ionicons name="calendar-clear-outline" size={48} color="#64748B" />
                <Text style={styles.emptyText}>No follow-ups found</Text>
                <Text style={styles.emptySubText}>
                  There are no reminders in this tab{__DEV__ && ". Pull to refresh or tap to load defaults"}.
                </Text>
                {__DEV__ && (
                  <TouchableOpacity style={styles.seedButton} onPress={handleResetReminders}>
                    <Text style={styles.seedButtonText}>Load Demo Reminders</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
            <View style={{ height: 40 }} />
          </ScrollView>
        </>
      )}

      {/* Reschedule Datepicker Modal */}
      <Modal
        animationType="fade"
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
                  value={getWebDateFormat(newDateStr)}
                  onChange={(e) => setNewDateStr(handleDateChangeWeb(e.target.value))}
                  style={webInputStyle}
                />
              ) : (
                <>
                  <TouchableOpacity
                    style={styles.nativeDateButton}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Text style={styles.nativeDateButtonText}>
                      {newDateStr || 'Select Date'}
                    </Text>
                  </TouchableOpacity>
                  {showDatePicker && (
                    <RNDateTimePicker
                      mode="date"
                      value={newDateStr ? parseDateString(newDateStr) : new Date()}
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
                <Text style={styles.modalConfirmText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Details View Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={detailsModalVisible}
        onRequestClose={() => setDetailsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContentLarge}>
            {activeReminder && (
              <>
                <Text style={styles.modalTitle}>📋 Follow-Up Details</Text>
                
                <ScrollView style={styles.detailsScrollView}>
                  <View style={styles.detailGroup}>
                    <Text style={styles.detailFieldLabel}>Client / Entity Name</Text>
                    <Text style={styles.detailFieldValueText}>{activeReminder.name}</Text>
                  </View>

                  <View style={styles.detailGroup}>
                    <Text style={styles.detailFieldLabel}>Category Type</Text>
                    <Text style={styles.detailFieldValueText}>
                      {activeReminder.type === 'Doctor' ? '🩺 Doctor' : activeReminder.type === 'Chemist' ? '💊 Chemist' : '🏥 Hospital'}
                    </Text>
                  </View>

                  <View style={styles.detailGroup}>
                    <Text style={styles.detailFieldLabel}>Follow-Up Purpose</Text>
                    <Text style={styles.detailFieldValueText}>{activeReminder.purpose}</Text>
                  </View>

                  <View style={styles.detailGroup}>
                    <Text style={styles.detailFieldLabel}>Scheduled Date</Text>
                    <Text style={[styles.detailFieldValueText, isDateOverdue(activeReminder.date, activeReminder.status) && { color: '#EF4444', fontWeight: 'bold' }]}>
                      📅 {activeReminder.date}
                    </Text>
                  </View>

                  <View style={styles.detailGroupRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.detailFieldLabel}>Priority</Text>
                      <Text style={[styles.detailFieldValueText, { color: getPriorityColor(activeReminder.priority), fontWeight: 'bold' }]}>
                        {activeReminder.priority}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.detailFieldLabel}>Status</Text>
                      <Text style={[styles.detailFieldValueText, { color: getStatusColor(activeReminder), fontWeight: 'bold' }]}>
                        {getStatusLabel(activeReminder)}
                      </Text>
                    </View>
                  </View>

                  {activeReminder.contactPerson && (
                    <View style={styles.detailGroup}>
                      <Text style={styles.detailFieldLabel}>Contact Person / Reference</Text>
                      <Text style={styles.detailFieldValueText}>{activeReminder.contactPerson}</Text>
                    </View>
                  )}

                  {activeReminder.notes && (
                    <View style={styles.detailGroup}>
                      <Text style={styles.detailFieldLabel}>Discussion Notes / Remarks</Text>
                      <View style={styles.notesWrapper}>
                        <Text style={styles.detailFieldNotesText}>{activeReminder.notes}</Text>
                      </View>
                    </View>
                  )}
                </ScrollView>

                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => setDetailsModalVisible(false)}
                >
                  <Text style={styles.modalCloseText}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default FollowUpRemindersScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#4F46E5',
    paddingTop: 50,
    paddingBottom: 25,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  statsCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderLeftWidth: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  statsValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statsLabel: {
    fontSize: 9,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginTop: -16,
    zIndex: 10,
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    paddingVertical: 10,
    paddingHorizontal: 20,
    fontSize: 14,
    color: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 15,
    marginBottom: 5,
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
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 60,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  clientName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  clientType: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 4,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  infoLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  infoValue: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '500',
  },
  notesExcerpt: {
    fontSize: 12,
    color: '#64748B',
    fontStyle: 'italic',
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 8,
    marginTop: 6,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  detailsBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
  },
  detailsBtnText: {
    fontSize: 11,
    color: '#4F46E5',
    fontWeight: 'bold',
  },
  rescheduleBtn: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
  },
  rescheduleBtnText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: 'bold',
  },
  completeBtn: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#10B981',
    borderRadius: 8,
    paddingVertical: 8,
  },
  completeBtnText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
    gap: 8,
  },
  sortLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#64748B',
  },
  sortPills: {
    flexDirection: 'row',
    gap: 8,
  },
  sortPill: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  activeSortPill: {
    borderColor: '#4F46E5',
    backgroundColor: '#EEF2F6',
  },
  sortPillText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '500',
  },
  activeSortPillText: {
    color: '#4F46E5',
    fontWeight: 'bold',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 20,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#334155',
    marginTop: 12,
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
    paddingHorizontal: 10,
  },
  seedButton: {
    marginTop: 16,
    backgroundColor: '#4F46E5',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  seedButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  errorText: {
    marginTop: 12,
    fontSize: 14,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  resetContainer: {
    paddingHorizontal: 20,
    marginTop: 10,
    alignItems: 'flex-end',
  },
  resetButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  resetButtonText: {
    fontSize: 11,
    color: '#4F46E5',
    fontWeight: 'bold',
  },
  // Modals Styling
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 10,
  },
  modalContentLarge: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 450,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInputWrapper: {
    marginBottom: 20,
    alignItems: 'center',
  },
  nativeDateButton: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    width: '100%',
  },
  nativeDateButtonText: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '500',
  },
  modalButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCancelBtn: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  modalConfirmBtn: {
    backgroundColor: '#4F46E5',
  },
  modalCancelText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: 'bold',
  },
  modalConfirmText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  detailsScrollView: {
    marginBottom: 20,
  },
  detailGroup: {
    marginBottom: 16,
  },
  detailGroupRow: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  detailFieldLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  detailFieldValueText: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '500',
  },
  notesWrapper: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  detailFieldNotesText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
    fontStyle: 'italic',
  },
  modalCloseBtn: {
    backgroundColor: '#64748B',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalCloseText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
});
