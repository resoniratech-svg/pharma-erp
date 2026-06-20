// import React, { useState, useCallback } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   ScrollView,
//   Alert,
//   Platform,
//   TextInput,
//   Modal,
//   ActivityIndicator,
//   RefreshControl,
// } from 'react-native';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { useNavigation, useFocusEffect } from '@react-navigation/native';
// import { Ionicons } from '@expo/vector-icons';
// import RNDateTimePicker from '@react-native-community/datetimepicker';

// interface FollowUpReminder {
//   id: string;
//   name: string;
//   type: 'Doctor' | 'Chemist' | 'Hospital';
//   date: string;
//   purpose: string;
//   priority: 'High' | 'Medium' | 'Low';
//   status: 'Pending' | 'Completed' | 'Overdue';
//   notes: string;
//   contactPerson: string;
//   originalId: string;
// }

// const safeJsonParse = (data: string | null, fallback: any) => {
//   if (!data) return fallback;
//   try { return JSON.parse(data); } 
//   catch (err) { return fallback; }
// };

// const getDaysRemaining = (dateStr: string, todayStr: string) => {
//   if (dateStr === todayStr) return 0;
//   const today = new Date(todayStr);
//   const target = new Date(dateStr);
//   const diffTime = target.getTime() - today.getTime();
//   return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
// };

// const FollowUpRemindersScreen = () => {
//   const navigation = useNavigation<any>();
//   const [search, setSearch] = useState('');
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [sortBy, setSortBy] = useState<'Date' | 'Priority' | 'Name'>('Date');
//   const [activeTab, setActiveTab] = useState<'Pending' | 'Completed' | 'Overdue' | 'All'>('Pending');
//   const [reminders, setReminders] = useState<FollowUpReminder[]>([]);

//   // Modals
//   const [detailsModalVisible, setDetailsModalVisible] = useState(false);
//   const [activeReminder, setActiveReminder] = useState<FollowUpReminder | null>(null);

//   const [rescheduleModalVisible, setRescheduleModalVisible] = useState(false);
//   const [newDateStr, setNewDateStr] = useState('');
//   const [showDatePicker, setShowDatePicker] = useState(false);

//   const loadReminders = async () => {
//     try {
//       const todayStr = new Date().toISOString().split('T')[0];
      
//       const doctorVisits = safeJsonParse(await AsyncStorage.getItem('@doctor_visits'), []);
//       const chemistVisits = safeJsonParse(await AsyncStorage.getItem('@chemist_visits'), []);
//       const completedIds = safeJsonParse(await AsyncStorage.getItem('@completed_followups'), []);
//       const rescheduledDates = safeJsonParse(await AsyncStorage.getItem('@rescheduled_followups'), {});

//       const loadedReminders: FollowUpReminder[] = [];

//       doctorVisits.forEach((v: any) => {
//         if (v.followUpDate) {
//           const actualDate = rescheduledDates[`doc_${v.id}`] || v.followUpDate;
//           const isCompleted = completedIds.includes(`doc_${v.id}`);
//           const daysRemaining = getDaysRemaining(actualDate, todayStr);
//           const isOverdue = daysRemaining < 0 && !isCompleted;

//           loadedReminders.push({
//             id: `doc_${v.id || Date.now()}`,
//             originalId: v.id,
//             name: `Dr. ${v.doctorName || 'Unknown'}`,
//             type: 'Doctor',
//             date: actualDate,
//             purpose: 'Doctor Follow-Up',
//             priority: isOverdue || daysRemaining === 0 ? 'High' : (daysRemaining > 7 ? 'Low' : 'Medium'),
//             status: isCompleted ? 'Completed' : (isOverdue ? 'Overdue' : 'Pending'),
//             notes: v.notes || 'Routine check-in regarding recent visit.',
//             contactPerson: v.hospital || v.specialty || 'Clinic',
//           });
//         }
//       });

//       chemistVisits.forEach((v: any) => {
//         if (v.followUpDate) {
//           const actualDate = rescheduledDates[`chem_${v.id}`] || v.followUpDate;
//           const isCompleted = completedIds.includes(`chem_${v.id}`);
//           const daysRemaining = getDaysRemaining(actualDate, todayStr);
//           const isOverdue = daysRemaining < 0 && !isCompleted;

//           loadedReminders.push({
//             id: `chem_${v.id || Date.now()}`,
//             originalId: v.id,
//             name: v.chemistName || 'Pharmacy',
//             type: 'Chemist',
//             date: actualDate,
//             purpose: 'Stock & Order Follow-Up',
//             priority: isOverdue || daysRemaining === 0 ? 'High' : (daysRemaining > 7 ? 'Low' : 'Medium'),
//             status: isCompleted ? 'Completed' : (isOverdue ? 'Overdue' : 'Pending'),
//             notes: v.notes || 'Check pending orders and stock levels.',
//             contactPerson: v.location || 'Pharmacy Desk',
//           });
//         }
//       });

//       setReminders(loadedReminders);
//     } catch (e) {
//       console.log('Failed to load reminders', e);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const onRefresh = useCallback(async () => {
//     setRefreshing(true);
//     await loadReminders();
//     setRefreshing(false);
//   }, []);

//   useFocusEffect(
//     useCallback(() => {
//       setLoading(true);
//       loadReminders();
//     }, [])
//   );

//   const handleMarkCompleted = (id: string) => {
//     if (Platform.OS === 'web') {
//       if (window.confirm('Mark this follow-up as completed?')) executeMarkCompleted(id);
//     } else {
//       Alert.alert('Confirm Completion', 'Are you sure you want to mark this follow-up as completed?', [
//         { text: 'Cancel', style: 'cancel' },
//         { text: 'Complete', onPress: () => executeMarkCompleted(id) }
//       ]);
//     }
//   };

//   const executeMarkCompleted = async (id: string) => {
//     try {
//       const completedIds = safeJsonParse(await AsyncStorage.getItem('@completed_followups'), []);
//       if (!completedIds.includes(id)) {
//         completedIds.push(id);
//         await AsyncStorage.setItem('@completed_followups', JSON.stringify(completedIds));
//       }
      
//       const updated = reminders.map(item => item.id === id ? { ...item, status: 'Completed' as const } : item);
//       setReminders(updated);
//     } catch (e) {
//       console.log('Failed to complete', e);
//     }
//   };

//   const openDetailsModal = (reminder: FollowUpReminder) => {
//     setActiveReminder(reminder);
//     setDetailsModalVisible(true);
//   };

//   const openRescheduleModal = (reminder: FollowUpReminder) => {
//     setActiveReminder(reminder);
//     setNewDateStr(reminder.date);
//     setRescheduleModalVisible(true);
//   };

//   const handleRescheduleSubmit = async () => {
//     if (!activeReminder || !newDateStr) return;

//     // 🔥 Added Validation: Prevent past dates
//     const todayStr = new Date().toISOString().split('T')[0];
//     if (newDateStr < todayStr) {
//       if (Platform.OS === 'web') alert('Invalid Date: Cannot reschedule to a past date.');
//       else Alert.alert('Invalid Date', 'Cannot reschedule to a past date.');
//       return;
//     }

//     try {
//       const rescheduledDates = safeJsonParse(await AsyncStorage.getItem('@rescheduled_followups'), {});
//       rescheduledDates[activeReminder.id] = newDateStr;
//       await AsyncStorage.setItem('@rescheduled_followups', JSON.stringify(rescheduledDates));

//       const updated = reminders.map(item => {
//         if (item.id === activeReminder.id) {
//           const daysRemaining = getDaysRemaining(newDateStr, todayStr);
//           return {
//             ...item,
//             date: newDateStr,
//             status: (daysRemaining < 0 ? 'Overdue' : 'Pending') as 'Overdue' | 'Pending',
//           };
//         }
//         return item;
//       });

//       setReminders(updated);
//       setRescheduleModalVisible(false);
//       if (Platform.OS !== 'web') Alert.alert('Success', 'Follow-up date has been rescheduled.');
//     } catch (e) {
//       console.log('Error rescheduling', e);
//     }
//   };

//   const filtered = reminders.filter(item => {
//     const query = search.toLowerCase();
//     const matchesSearch = item.name.toLowerCase().includes(query) || item.notes.toLowerCase().includes(query);
    
//     let matchesTab = true;
//     if (activeTab === 'Pending') matchesTab = item.status === 'Pending';
//     else if (activeTab === 'Completed') matchesTab = item.status === 'Completed';
//     else if (activeTab === 'Overdue') matchesTab = item.status === 'Overdue';
    
//     return matchesSearch && matchesTab;
//   });

//   const sortedReminders = [...filtered].sort((a, b) => {
//     if (sortBy === 'Priority') {
//       const w = { High: 3, Medium: 2, Low: 1 };
//       return w[b.priority] - w[a.priority];
//     }
//     if (sortBy === 'Name') return a.name.localeCompare(b.name);
//     return new Date(a.date).getTime() - new Date(b.date).getTime();
//   });

//   const stats = {
//     today: reminders.filter(r => r.date === new Date().toISOString().split('T')[0] && r.status !== 'Completed').length,
//     pending: reminders.filter(r => r.status === 'Pending').length,
//     overdue: reminders.filter(r => r.status === 'Overdue').length,
//     completed: reminders.filter(r => r.status === 'Completed').length,
//   };

//   const getPriorityColor = (priority: string) => {
//     if (priority === 'High') return '#EF4444';
//     if (priority === 'Medium') return '#F59E0B';
//     return '#10B981';
//   };

//   const getStatusColor = (status: string) => {
//     if (status === 'Completed') return '#10B981';
//     if (status === 'Overdue') return '#EF4444';
//     return '#3B82F6';
//   };

//   return (
//     <View style={styles.container}>
//       <View style={styles.header}>
//         <View style={styles.headerTitleRow}>
//           <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
//             <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
//           </TouchableOpacity>
//           <Text style={styles.headerTitle}>Follow-Up Reminders</Text>
//           <View style={{ width: 40 }} />
//         </View>

//         <View style={styles.statsContainer}>
//           <View style={[styles.statsCard, { borderLeftColor: '#3B82F6' }]}>
//             <Text style={[styles.statsValue, { color: '#2563EB' }]}>{stats.today}</Text>
//             <Text style={styles.statsLabel}>Today</Text>
//           </View>
//           <View style={[styles.statsCard, { borderLeftColor: '#F59E0B' }]}>
//             <Text style={[styles.statsValue, { color: '#D97706' }]}>{stats.pending}</Text>
//             <Text style={styles.statsLabel}>Pending</Text>
//           </View>
//           <View style={[styles.statsCard, { borderLeftColor: '#EF4444' }]}>
//             <Text style={[styles.statsValue, { color: '#DC2626' }]}>{stats.overdue}</Text>
//             <Text style={styles.statsLabel}>Overdue</Text>
//           </View>
//           <View style={[styles.statsCard, { borderLeftColor: '#10B981' }]}>
//             <Text style={[styles.statsValue, { color: '#059669' }]}>{stats.completed}</Text>
//             <Text style={styles.statsLabel}>Completed</Text>
//           </View>
//         </View>
//       </View>

//       {loading ? (
//         <View style={styles.centerContent}><ActivityIndicator size="large" color="#4F46E5" /></View>
//       ) : (
//         <>
//           <View style={styles.searchContainer}>
//             <TextInput
//               style={styles.searchInput}
//               placeholder="Search by doctor, chemist or notes..."
//               placeholderTextColor="#94A3B8"
//               value={search}
//               onChangeText={setSearch}
//                 underlineColorAndroid="transparent"
//             />
//           </View>

//           <View style={styles.sortContainer}>
//             <Text style={styles.sortLabel}>Sort by:</Text>
//             <View style={styles.sortPills}>
//               {([{ key: 'Date', label: '📅 Date' }, { key: 'Priority', label: '🔥 Priority' }, { key: 'Name', label: '🔤 Name' }] as const).map(opt => (
//                 <TouchableOpacity key={opt.key} onPress={() => setSortBy(opt.key)} style={[styles.sortPill, sortBy === opt.key && styles.activeSortPill]}>
//                   <Text style={[styles.sortPillText, sortBy === opt.key && styles.activeSortPillText]}>{opt.label}</Text>
//                 </TouchableOpacity>
//               ))}
//             </View>
//           </View>

//           <View style={styles.tabContainer}>
//             {(['Pending', 'Overdue', 'Completed', 'All'] as const).map(tab => (
//               <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)} style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}>
//                 <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
//               </TouchableOpacity>
//             ))}
//           </View>

//           <ScrollView 
//             contentContainerStyle={styles.listContainer}
//             refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4F46E5']} />}
//           >
//             {sortedReminders.length > 0 ? (
//               sortedReminders.map((item) => (
//                 <View key={item.id} style={styles.card}>
//                   <View style={styles.cardHeaderRow}>
//                     <View style={{ flex: 1 }}>
//                       <Text style={styles.clientName}>{item.name}</Text>
//                       <Text style={styles.clientType}>
//                         {item.type === 'Doctor' ? '🩺' : '💊'} {item.type}
//                       </Text>
//                     </View>
//                     <View style={styles.badgeRow}>
//                       <View style={[styles.badge, { backgroundColor: getPriorityColor(item.priority) + '15' }]}>
//                         <Text style={[styles.badgeText, { color: getPriorityColor(item.priority) }]}>{item.priority}</Text>
//                       </View>
//                       <View style={[styles.badge, { backgroundColor: getStatusColor(item.status) + '15' }]}>
//                         <Text style={[styles.badgeText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
//                       </View>
//                     </View>
//                   </View>

//                   <View style={styles.divider} />
                  
//                   <View style={styles.infoRow}>
//                     <Text style={styles.infoLabel}>Scheduled Date:</Text>
//                     <Text style={[styles.infoValue, item.status === 'Overdue' && { color: '#EF4444', fontWeight: 'bold' }]}>
//                       📅 {item.date}
//                     </Text>
//                   </View>

//                   <Text style={styles.notesExcerpt} numberOfLines={1}>📝 {item.notes}</Text>

//                   <View style={styles.divider} />

//                   <View style={styles.actionsRow}>
//                     <TouchableOpacity style={styles.detailsBtn} onPress={() => openDetailsModal(item)}>
//                       <Ionicons name="information-circle-outline" size={16} color="#4F46E5" />
//                       <Text style={styles.detailsBtnText}>Details</Text>
//                     </TouchableOpacity>

//                     {item.status !== 'Completed' && (
//                       <>
//                         <TouchableOpacity style={styles.rescheduleBtn} onPress={() => openRescheduleModal(item)}>
//                           <Ionicons name="calendar-outline" size={16} color="#64748B" />
//                           <Text style={styles.rescheduleBtnText}>Reschedule</Text>
//                         </TouchableOpacity>
//                         <TouchableOpacity style={styles.completeBtn} onPress={() => handleMarkCompleted(item.id)}>
//                           <Ionicons name="checkmark-circle-outline" size={16} color="#FFFFFF" />
//                           <Text style={styles.completeBtnText}>Complete</Text>
//                         </TouchableOpacity>
//                       </>
//                     )}
//                   </View>
//                 </View>
//               ))
//             ) : (
//               <View style={styles.emptyCard}>
//                 <Ionicons name="checkmark-done-circle-outline" size={48} color="#10B981" />
//                 <Text style={styles.emptyText}>All Caught Up!</Text>
//                 <Text style={styles.emptySubText}>No follow-ups match this filter.</Text>
//               </View>
//             )}
//           </ScrollView>
//         </>
//       )}

//       {/* Details View Modal */}
//       <Modal animationType="slide" transparent={true} visible={detailsModalVisible} onRequestClose={() => setDetailsModalVisible(false)}>
//         <View style={styles.modalOverlay}>
//           <View style={styles.modalContentLarge}>
//             {activeReminder && (
//               <>
//                 <Text style={styles.modalTitle}>📋 Follow-Up Details</Text>
//                 <ScrollView style={styles.detailsScrollView}>
//                   {/* 🔥 Added Priority, Status, Purpose */}
//                   <View style={styles.detailGroup}><Text style={styles.detailFieldLabel}>Status</Text><Text style={[styles.detailFieldValueText, { color: getStatusColor(activeReminder.status), fontWeight: 'bold' }]}>📌 {activeReminder.status}</Text></View>
//                   <View style={styles.detailGroup}><Text style={styles.detailFieldLabel}>Priority</Text><Text style={[styles.detailFieldValueText, { color: getPriorityColor(activeReminder.priority), fontWeight: 'bold' }]}>🔥 {activeReminder.priority}</Text></View>
//                   <View style={styles.detailGroup}><Text style={styles.detailFieldLabel}>Purpose</Text><Text style={styles.detailFieldValueText}>🎯 {activeReminder.purpose}</Text></View>
//                   <View style={styles.detailGroup}><Text style={styles.detailFieldLabel}>Client</Text><Text style={styles.detailFieldValueText}>{activeReminder.name}</Text></View>
//                   <View style={styles.detailGroup}><Text style={styles.detailFieldLabel}>Type</Text><Text style={styles.detailFieldValueText}>{activeReminder.type}</Text></View>
//                   <View style={styles.detailGroup}><Text style={styles.detailFieldLabel}>Date</Text><Text style={styles.detailFieldValueText}>📅 {activeReminder.date}</Text></View>
//                   <View style={styles.detailGroup}><Text style={styles.detailFieldLabel}>Hospital / Clinic</Text><Text style={styles.detailFieldValueText}>🏥 {activeReminder.contactPerson}</Text></View>
//                   <View style={styles.detailGroup}><Text style={styles.detailFieldLabel}>Notes</Text><Text style={styles.detailFieldValueText}>{activeReminder.notes}</Text></View>
//                 </ScrollView>
//                 <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setDetailsModalVisible(false)}>
//                   <Text style={styles.modalCloseText}>Close Window</Text>
//                 </TouchableOpacity>
//               </>
//             )}
//           </View>
//         </View>
//       </Modal>

//       {/* Reschedule Modal */}
//       <Modal animationType="fade" transparent={true} visible={rescheduleModalVisible} onRequestClose={() => setRescheduleModalVisible(false)}>
//         <View style={styles.modalOverlay}>
//           <View style={styles.modalContent}>
//             <Text style={styles.modalTitle}>📅 Reschedule Follow-Up</Text>
//             <View style={styles.modalInputWrapper}>
//               {Platform.OS === 'web' ? (
//                 <input
//                   type="date"
//                   value={newDateStr}
//                   onChange={(e) => setNewDateStr(e.target.value)}
//                   style={{ borderWidth: 1, borderColor: '#CBD5E1', padding: 10, width: '100%', borderRadius: 8 }}
//                 />
//               ) : (
//                 <>
//                   <TouchableOpacity style={styles.nativeDateButton} onPress={() => setShowDatePicker(true)}>
//                     <Text style={styles.nativeDateButtonText}>{newDateStr || 'Select Date'}</Text>
//                   </TouchableOpacity>
//                   {showDatePicker && (
//                     <RNDateTimePicker
//                       mode="date"
//                       value={new Date(newDateStr || Date.now())}
//                       onChange={(event, date) => {
//                         setShowDatePicker(false);
//                         if (date) setNewDateStr(date.toISOString().split('T')[0]);
//                       }}
//                     />
//                   )}
//                 </>
//               )}
//             </View>
//             <View style={styles.modalButtonsRow}>
//               <TouchableOpacity style={[styles.modalBtn, styles.modalCancelBtn]} onPress={() => setRescheduleModalVisible(false)}>
//                 <Text style={styles.modalCancelText}>Cancel</Text>
//               </TouchableOpacity>
//               <TouchableOpacity style={[styles.modalBtn, styles.modalConfirmBtn]} onPress={handleRescheduleSubmit}>
//                 <Text style={styles.modalConfirmText}>Save Date</Text>
//               </TouchableOpacity>
//             </View>
//           </View>
//         </View>
//       </Modal>
//     </View>
//   );
// };

// export default FollowUpRemindersScreen;

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: '#F8FAFC' },
  
//   // 🔥 Increased bottom padding from 25 to 35 for better header height
//   header: { backgroundColor: '#4F46E5', paddingTop: 50, paddingBottom: 35, paddingHorizontal: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, position: 'relative' },
//   headerTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
//   backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255, 255, 255, 0.15)', justifyContent: 'center', alignItems: 'center' },
//   headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF', textAlign: 'center' },
//   statsContainer: { flexDirection: 'row', gap: 8 },
//   statsCard: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 6, borderLeftWidth: 4, alignItems: 'center' },
//   statsValue: { fontSize: 16, fontWeight: 'bold' },
//   statsLabel: { fontSize: 9, color: '#64748B', marginTop: 2, fontWeight: '600', textTransform: 'uppercase' },
  
//   // 🔥 Moved completely below the header (no negative margin!)
//   searchContainer: { paddingHorizontal: 20, marginTop: 15 },
//   // 🔥 Changed borderRadius to 16 to match the rest of the cards
//   searchInput: { backgroundColor: '#FFFFFF', borderRadius: 16, paddingVertical: 12, paddingHorizontal: 16, fontSize: 14, color: '#334155', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, borderWidth: 0, outlineStyle: 'none' } as any,
  
//   sortContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginTop: 15, marginBottom: 10, gap: 8 },
//   sortLabel: { fontSize: 12, fontWeight: 'bold', color: '#64748B' },
//   sortPills: { flexDirection: 'row', gap: 8 },
//   sortPill: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12, borderWidth: 1, borderColor: '#CBD5E1' },
//   activeSortPill: { borderColor: '#4F46E5', backgroundColor: '#EEF2F6' },
//   sortPillText: { fontSize: 11, color: '#475569', fontWeight: '500' },
//   activeSortPillText: { color: '#4F46E5', fontWeight: 'bold' },
  
//   tabContainer: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 5, gap: 6 },
//   tabButton: { flex: 1, paddingVertical: 8, borderRadius: 20, alignItems: 'center', backgroundColor: '#E2E8F0' },
//   activeTabButton: { backgroundColor: '#4F46E5' },
//   tabText: { fontSize: 11, fontWeight: '600', color: '#64748B' },
//   activeTabText: { color: '#FFFFFF' },
  
//   listContainer: { paddingHorizontal: 20, paddingTop: 15, paddingBottom: 60 },
//   card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0' },
//   cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
//   clientName: { fontSize: 15, fontWeight: 'bold', color: '#1E293B' },
//   clientType: { fontSize: 11, color: '#64748B', marginTop: 2 },
//   badgeRow: { flexDirection: 'row', gap: 4 },
//   badge: { paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6 },
//   badgeText: { fontSize: 9, fontWeight: 'bold' },
//   divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 10 },
//   infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
//   infoLabel: { fontSize: 12, color: '#64748B' },
//   infoValue: { fontSize: 12, color: '#334155', fontWeight: '500' },
//   notesExcerpt: { fontSize: 12, color: '#64748B', fontStyle: 'italic', backgroundColor: '#F8FAFC', padding: 8, borderRadius: 8, marginTop: 6 },
//   actionsRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
//   detailsBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, paddingVertical: 8 },
//   detailsBtnText: { fontSize: 11, color: '#4F46E5', fontWeight: 'bold' },
//   rescheduleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, paddingVertical: 8 },
//   rescheduleBtnText: { fontSize: 11, color: '#475569', fontWeight: 'bold' },
//   completeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, backgroundColor: '#10B981', borderRadius: 8, paddingVertical: 8 },
//   completeBtnText: { fontSize: 11, color: '#FFFFFF', fontWeight: 'bold' },
  
//   emptyCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0', marginTop: 20 },
//   emptyText: { fontSize: 16, fontWeight: 'bold', color: '#334155', marginTop: 12 },
//   emptySubText: { fontSize: 13, color: '#94A3B8', marginTop: 8, textAlign: 'center' },
//   centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  
//   modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.4)', justifyContent: 'center', alignItems: 'center', padding: 20 },
//   modalContentLarge: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 24, width: '100%', maxWidth: 450, maxHeight: '80%' },
//   modalContent: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 24, width: '100%', maxWidth: 360 },
//   modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E293B', marginBottom: 20, textAlign: 'center' },
//   detailsScrollView: { marginBottom: 20 },
//   detailGroup: { marginBottom: 16 },
//   detailFieldLabel: { fontSize: 11, color: '#64748B', fontWeight: '600', textTransform: 'uppercase', marginBottom: 4 },
//   detailFieldValueText: { fontSize: 14, color: '#1E293B', fontWeight: '500' },
//   modalCloseBtn: { backgroundColor: '#64748B', borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
//   modalCloseText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 13 },
//   modalInputWrapper: { marginBottom: 20, alignItems: 'center' },
//   nativeDateButton: { borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, padding: 12, backgroundColor: '#F8FAFC', alignItems: 'center', width: '100%' },
//   nativeDateButtonText: { fontSize: 14, color: '#334155', fontWeight: '500' },
//   modalButtonsRow: { flexDirection: 'row', gap: 12 },
//   modalBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
//   modalCancelBtn: { borderWidth: 1, borderColor: '#CBD5E1', backgroundColor: '#FFFFFF' },
//   modalConfirmBtn: { backgroundColor: '#4F46E5' },
//   modalCancelText: { fontSize: 13, color: '#475569', fontWeight: 'bold' },
//   modalConfirmText: { fontSize: 13, color: '#FFFFFF', fontWeight: 'bold' },
// });


// /////////////////////////////////////////////////////////////////////////////////







import React, { useState, useCallback, useRef } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import RNDateTimePicker from '@react-native-community/datetimepicker';

interface FollowUpReminder {
  id: string;
  name: string;
  type: 'Doctor' | 'Chemist' | 'Hospital';
  date: string;
  purpose: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Pending' | 'Completed' | 'Overdue';
  notes: string;
  contactPerson: string;
  originalId: string;
}

const safeJsonParse = (data: string | null, fallback: any) => {
  if (!data) return fallback;
  try { return JSON.parse(data); } 
  catch (err) { return fallback; }
};

const getDaysRemaining = (dateStr: string, todayStr: string) => {
  if (dateStr === todayStr) return 0;
  const today = new Date(todayStr);
  const target = new Date(dateStr);
  const diffTime = target.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const FollowUpRemindersScreen = () => {
  const navigation = useNavigation<any>();
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState<'Date' | 'Priority' | 'Name'>('Date');
  const [activeTab, setActiveTab] = useState<'Pending' | 'Completed' | 'Overdue' | 'All'>('Pending');
  const [reminders, setReminders] = useState<FollowUpReminder[]>([]);

  // Scroll to top states
  const scrollViewRef = useRef<ScrollView>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Modals
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [activeReminder, setActiveReminder] = useState<FollowUpReminder | null>(null);

  const [rescheduleModalVisible, setRescheduleModalVisible] = useState(false);
  const [newDateStr, setNewDateStr] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const loadReminders = async () => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      
      const doctorVisits = safeJsonParse(await AsyncStorage.getItem('@doctor_visits'), []);
      const chemistVisits = safeJsonParse(await AsyncStorage.getItem('@chemist_visits'), []);
      const completedIds = safeJsonParse(await AsyncStorage.getItem('@completed_followups'), []);
      const rescheduledDates = safeJsonParse(await AsyncStorage.getItem('@rescheduled_followups'), {});

      const loadedReminders: FollowUpReminder[] = [];

      doctorVisits.forEach((v: any) => {
        if (v.followUpDate) {
          const actualDate = rescheduledDates[`doc_${v.id}`] || v.followUpDate;
          const isCompleted = completedIds.includes(`doc_${v.id}`);
          const daysRemaining = getDaysRemaining(actualDate, todayStr);
          const isOverdue = daysRemaining < 0 && !isCompleted;

          loadedReminders.push({
            id: `doc_${v.id || Date.now()}`,
            originalId: v.id,
            name: `Dr. ${v.doctorName || 'Unknown'}`,
            type: 'Doctor',
            date: actualDate,
            purpose: 'Doctor Follow-Up',
            priority: isOverdue || daysRemaining === 0 ? 'High' : (daysRemaining > 7 ? 'Low' : 'Medium'),
            status: isCompleted ? 'Completed' : (isOverdue ? 'Overdue' : 'Pending'),
            notes: v.notes || 'Routine check-in regarding recent visit.',
            contactPerson: v.hospital || v.specialty || 'Clinic',
          });
        }
      });

      chemistVisits.forEach((v: any) => {
        if (v.followUpDate) {
          const actualDate = rescheduledDates[`chem_${v.id}`] || v.followUpDate;
          const isCompleted = completedIds.includes(`chem_${v.id}`);
          const daysRemaining = getDaysRemaining(actualDate, todayStr);
          const isOverdue = daysRemaining < 0 && !isCompleted;

          loadedReminders.push({
            id: `chem_${v.id || Date.now()}`,
            originalId: v.id,
            name: v.chemistName || 'Pharmacy',
            type: 'Chemist',
            date: actualDate,
            purpose: 'Stock & Order Follow-Up',
            priority: isOverdue || daysRemaining === 0 ? 'High' : (daysRemaining > 7 ? 'Low' : 'Medium'),
            status: isCompleted ? 'Completed' : (isOverdue ? 'Overdue' : 'Pending'),
            notes: v.notes || 'Check pending orders and stock levels.',
            contactPerson: v.location || 'Pharmacy Desk',
          });
        }
      });

      setReminders(loadedReminders);
    } catch (e) {
      console.log('Failed to load reminders', e);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadReminders();
    setRefreshing(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadReminders();
    }, [])
  );

  const handleMarkCompleted = (id: string) => {
    if (Platform.OS === 'web') {
      if (window.confirm('Mark this follow-up as completed?')) executeMarkCompleted(id);
    } else {
      Alert.alert('Confirm Completion', 'Are you sure you want to mark this follow-up as completed?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Complete', onPress: () => executeMarkCompleted(id) }
      ]);
    }
  };

  const executeMarkCompleted = async (id: string) => {
    try {
      const completedIds = safeJsonParse(await AsyncStorage.getItem('@completed_followups'), []);
      if (!completedIds.includes(id)) {
        completedIds.push(id);
        await AsyncStorage.setItem('@completed_followups', JSON.stringify(completedIds));
      }
      
      const updated = reminders.map(item => item.id === id ? { ...item, status: 'Completed' as const } : item);
      setReminders(updated);
    } catch (e) {
      console.log('Failed to complete', e);
    }
  };

  const openDetailsModal = (reminder: FollowUpReminder) => {
    setActiveReminder(reminder);
    setDetailsModalVisible(true);
  };

  const openRescheduleModal = (reminder: FollowUpReminder) => {
    setActiveReminder(reminder);
    setNewDateStr(reminder.date);
    setRescheduleModalVisible(true);
  };

  const handleRescheduleSubmit = async () => {
    if (!activeReminder || !newDateStr) return;

    const todayStr = new Date().toISOString().split('T')[0];
    if (newDateStr < todayStr) {
      if (Platform.OS === 'web') alert('Invalid Date: Cannot reschedule to a past date.');
      else Alert.alert('Invalid Date', 'Cannot reschedule to a past date.');
      return;
    }

    try {
      const rescheduledDates = safeJsonParse(await AsyncStorage.getItem('@rescheduled_followups'), {});
      rescheduledDates[activeReminder.id] = newDateStr;
      await AsyncStorage.setItem('@rescheduled_followups', JSON.stringify(rescheduledDates));

      const updated = reminders.map(item => {
        if (item.id === activeReminder.id) {
          const daysRemaining = getDaysRemaining(newDateStr, todayStr);
          return {
            ...item,
            date: newDateStr,
            status: (daysRemaining < 0 ? 'Overdue' : 'Pending') as 'Overdue' | 'Pending',
          };
        }
        return item;
      });

      setReminders(updated);
      setRescheduleModalVisible(false);
      if (Platform.OS !== 'web') Alert.alert('Success', 'Follow-up date has been rescheduled.');
    } catch (e) {
      console.log('Error rescheduling', e);
    }
  };

  // Check scroll position to show/hide the arrow button
  const handleScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.y;
    if (scrollPosition > 100) {
      setShowScrollTop(true);
    } else {
      setShowScrollTop(false);
    }
  };

  const scrollToTop = () => {
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };

  const filtered = reminders.filter(item => {
    const query = search.toLowerCase();
    const matchesSearch = item.name.toLowerCase().includes(query) || item.notes.toLowerCase().includes(query);
    
    let matchesTab = true;
    if (activeTab === 'Pending') matchesTab = item.status === 'Pending';
    else if (activeTab === 'Completed') matchesTab = item.status === 'Completed';
    else if (activeTab === 'Overdue') matchesTab = item.status === 'Overdue';
    
    return matchesSearch && matchesTab;
  });

  const sortedReminders = [...filtered].sort((a, b) => {
    if (sortBy === 'Priority') {
      const w = { High: 3, Medium: 2, Low: 1 };
      return w[b.priority] - w[a.priority];
    }
    if (sortBy === 'Name') return a.name.localeCompare(b.name);
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  const stats = {
    today: reminders.filter(r => r.date === new Date().toISOString().split('T')[0] && r.status !== 'Completed').length,
    pending: reminders.filter(r => r.status === 'Pending').length,
    overdue: reminders.filter(r => r.status === 'Overdue').length,
    completed: reminders.filter(r => r.status === 'Completed').length,
  };

  const getPriorityColor = (priority: string) => {
    if (priority === 'High') return '#EF4444';
    if (priority === 'Medium') return '#F59E0B';
    return '#10B981';
  };

  const getStatusColor = (status: string) => {
    if (status === 'Completed') return '#10B981';
    if (status === 'Overdue') return '#EF4444';
    return '#3B82F6';
  };

  return (
    <View style={styles.container}>
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
        <View style={styles.centerContent}><ActivityIndicator size="large" color="#4F46E5" /></View>
      ) : (
        <View style={{ flex: 1 }}>
          <ScrollView 
            ref={scrollViewRef}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            contentContainerStyle={styles.listContainer}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4F46E5']} />}
          >
            
            {/* Search, Sort, and Tabs moved inside ScrollView! */}
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search by doctor, chemist or notes..."
                placeholderTextColor="#94A3B8"
                value={search}
                onChangeText={setSearch}
                underlineColorAndroid="transparent"
              />
            </View>

            <View style={styles.sortContainer}>
              <Text style={styles.sortLabel}>Sort by:</Text>
              <View style={styles.sortPills}>
                {([{ key: 'Date', label: '📅 Date' }, { key: 'Priority', label: '🔥 Priority' }, { key: 'Name', label: '🔤 Name' }] as const).map(opt => (
                  <TouchableOpacity key={opt.key} onPress={() => setSortBy(opt.key)} style={[styles.sortPill, sortBy === opt.key && styles.activeSortPill]}>
                    <Text style={[styles.sortPillText, sortBy === opt.key && styles.activeSortPillText]}>{opt.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.tabContainer}>
              {(['Pending', 'Overdue', 'Completed', 'All'] as const).map(tab => (
                <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)} style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}>
                  <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* List of Reminders */}
            {sortedReminders.length > 0 ? (
              sortedReminders.map((item) => (
                <View key={item.id} style={styles.card}>
                  <View style={styles.cardHeaderRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.clientName}>{item.name}</Text>
                      <Text style={styles.clientType}>
                        {item.type === 'Doctor' ? '🩺' : '💊'} {item.type}
                      </Text>
                    </View>
                    <View style={styles.badgeRow}>
                      <View style={[styles.badge, { backgroundColor: getPriorityColor(item.priority) + '15' }]}>
                        <Text style={[styles.badgeText, { color: getPriorityColor(item.priority) }]}>{item.priority}</Text>
                      </View>
                      <View style={[styles.badge, { backgroundColor: getStatusColor(item.status) + '15' }]}>
                        <Text style={[styles.badgeText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.divider} />
                  
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Scheduled Date:</Text>
                    <Text style={[styles.infoValue, item.status === 'Overdue' && { color: '#EF4444', fontWeight: 'bold' }]}>
                      📅 {item.date}
                    </Text>
                  </View>

                  <Text style={styles.notesExcerpt} numberOfLines={1}>📝 {item.notes}</Text>

                  <View style={styles.divider} />

                  <View style={styles.actionsRow}>
                    <TouchableOpacity style={styles.detailsBtn} onPress={() => openDetailsModal(item)}>
                      <Ionicons name="information-circle-outline" size={16} color="#4F46E5" />
                      <Text style={styles.detailsBtnText}>Details</Text>
                    </TouchableOpacity>

                    {item.status !== 'Completed' && (
                      <>
                        <TouchableOpacity style={styles.rescheduleBtn} onPress={() => openRescheduleModal(item)}>
                          <Ionicons name="calendar-outline" size={16} color="#64748B" />
                          <Text style={styles.rescheduleBtnText}>Reschedule</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.completeBtn} onPress={() => handleMarkCompleted(item.id)}>
                          <Ionicons name="checkmark-circle-outline" size={16} color="#FFFFFF" />
                          <Text style={styles.completeBtnText}>Complete</Text>
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyCard}>
                <Ionicons name="checkmark-done-circle-outline" size={48} color="#10B981" />
                <Text style={styles.emptyText}>All Caught Up!</Text>
                <Text style={styles.emptySubText}>No follow-ups match this filter.</Text>
              </View>
            )}
          </ScrollView>

          {/* 🔥 Floating Scroll to Top Arrow Button */}
          {showScrollTop && (
            <TouchableOpacity style={styles.scrollTopFab} onPress={scrollToTop}>
              <Ionicons name="arrow-up" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          )}

        </View>
      )}

      {/* Details View Modal */}
      <Modal animationType="slide" transparent={true} visible={detailsModalVisible} onRequestClose={() => setDetailsModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContentLarge}>
            {activeReminder && (
              <>
                <Text style={styles.modalTitle}>📋 Follow-Up Details</Text>
                <ScrollView style={styles.detailsScrollView}>
                  <View style={styles.detailGroup}><Text style={styles.detailFieldLabel}>Status</Text><Text style={[styles.detailFieldValueText, { color: getStatusColor(activeReminder.status), fontWeight: 'bold' }]}>📌 {activeReminder.status}</Text></View>
                  <View style={styles.detailGroup}><Text style={styles.detailFieldLabel}>Priority</Text><Text style={[styles.detailFieldValueText, { color: getPriorityColor(activeReminder.priority), fontWeight: 'bold' }]}>🔥 {activeReminder.priority}</Text></View>
                  <View style={styles.detailGroup}><Text style={styles.detailFieldLabel}>Purpose</Text><Text style={styles.detailFieldValueText}>🎯 {activeReminder.purpose}</Text></View>
                  <View style={styles.detailGroup}><Text style={styles.detailFieldLabel}>Client</Text><Text style={styles.detailFieldValueText}>{activeReminder.name}</Text></View>
                  <View style={styles.detailGroup}><Text style={styles.detailFieldLabel}>Type</Text><Text style={styles.detailFieldValueText}>{activeReminder.type}</Text></View>
                  <View style={styles.detailGroup}><Text style={styles.detailFieldLabel}>Date</Text><Text style={styles.detailFieldValueText}>📅 {activeReminder.date}</Text></View>
                  <View style={styles.detailGroup}><Text style={styles.detailFieldLabel}>Hospital / Clinic</Text><Text style={styles.detailFieldValueText}>🏥 {activeReminder.contactPerson}</Text></View>
                  <View style={styles.detailGroup}><Text style={styles.detailFieldLabel}>Notes</Text><Text style={styles.detailFieldValueText}>{activeReminder.notes}</Text></View>
                </ScrollView>
                <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setDetailsModalVisible(false)}>
                  <Text style={styles.modalCloseText}>Close Window</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Reschedule Modal */}
      <Modal animationType="fade" transparent={true} visible={rescheduleModalVisible} onRequestClose={() => setRescheduleModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>📅 Reschedule Follow-Up</Text>
            <View style={styles.modalInputWrapper}>
              {Platform.OS === 'web' ? (
                <input
                  type="date"
                  value={newDateStr}
                  onChange={(e) => setNewDateStr(e.target.value)}
                  style={{ borderWidth: 1, borderColor: '#CBD5E1', padding: 10, width: '100%', borderRadius: 8 }}
                />
              ) : (
                <>
                  <TouchableOpacity style={styles.nativeDateButton} onPress={() => setShowDatePicker(true)}>
                    <Text style={styles.nativeDateButtonText}>{newDateStr || 'Select Date'}</Text>
                  </TouchableOpacity>
                  {showDatePicker && (
                    <RNDateTimePicker
                      mode="date"
                      value={new Date(newDateStr || Date.now())}
                      onChange={(event, date) => {
                        setShowDatePicker(false);
                        if (date) setNewDateStr(date.toISOString().split('T')[0]);
                      }}
                    />
                  )}
                </>
              )}
            </View>
            <View style={styles.modalButtonsRow}>
              <TouchableOpacity style={[styles.modalBtn, styles.modalCancelBtn]} onPress={() => setRescheduleModalVisible(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.modalConfirmBtn]} onPress={handleRescheduleSubmit}>
                <Text style={styles.modalConfirmText}>Save Date</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default FollowUpRemindersScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { backgroundColor: '#4F46E5', paddingTop: 50, paddingBottom: 35, paddingHorizontal: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, position: 'relative' },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255, 255, 255, 0.15)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF', textAlign: 'center' },
  statsContainer: { flexDirection: 'row', gap: 8 },
  statsCard: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 6, borderLeftWidth: 4, alignItems: 'center' },
  statsValue: { fontSize: 16, fontWeight: 'bold' },
  statsLabel: { fontSize: 9, color: '#64748B', marginTop: 2, fontWeight: '600', textTransform: 'uppercase' },
  
  // Adjusted for scrolling (removed horizontal padding so it aligns with cards)
  searchContainer: { marginTop: 0 },
  searchInput: { backgroundColor: '#FFFFFF', borderRadius: 16, paddingVertical: 12, paddingHorizontal: 16, fontSize: 14, color: '#334155', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, borderWidth: 0, outlineStyle: 'none' } as any,
  
  sortContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 15, marginBottom: 10, gap: 8 },
  sortLabel: { fontSize: 12, fontWeight: 'bold', color: '#64748B' },
  sortPills: { flexDirection: 'row', gap: 8 },
  sortPill: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12, borderWidth: 1, borderColor: '#CBD5E1' },
  activeSortPill: { borderColor: '#4F46E5', backgroundColor: '#EEF2F6' },
  sortPillText: { fontSize: 11, color: '#475569', fontWeight: '500' },
  activeSortPillText: { color: '#4F46E5', fontWeight: 'bold' },
  
  tabContainer: { flexDirection: 'row', marginBottom: 20, gap: 6 },
  tabButton: { flex: 1, paddingVertical: 8, borderRadius: 20, alignItems: 'center', backgroundColor: '#E2E8F0' },
  activeTabButton: { backgroundColor: '#4F46E5' },
  tabText: { fontSize: 11, fontWeight: '600', color: '#64748B' },
  activeTabText: { color: '#FFFFFF' },
  
  listContainer: { paddingHorizontal: 20, paddingTop: 15, paddingBottom: 60 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  clientName: { fontSize: 15, fontWeight: 'bold', color: '#1E293B' },
  clientType: { fontSize: 11, color: '#64748B', marginTop: 2 },
  badgeRow: { flexDirection: 'row', gap: 4 },
  badge: { paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 9, fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 10 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  infoLabel: { fontSize: 12, color: '#64748B' },
  infoValue: { fontSize: 12, color: '#334155', fontWeight: '500' },
  notesExcerpt: { fontSize: 12, color: '#64748B', fontStyle: 'italic', backgroundColor: '#F8FAFC', padding: 8, borderRadius: 8, marginTop: 6 },
  actionsRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  detailsBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, paddingVertical: 8 },
  detailsBtnText: { fontSize: 11, color: '#4F46E5', fontWeight: 'bold' },
  rescheduleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, paddingVertical: 8 },
  rescheduleBtnText: { fontSize: 11, color: '#475569', fontWeight: 'bold' },
  completeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, backgroundColor: '#10B981', borderRadius: 8, paddingVertical: 8 },
  completeBtnText: { fontSize: 11, color: '#FFFFFF', fontWeight: 'bold' },
  
  // 🔥 Floating Scroll to Top Arrow Style
  scrollTopFab: { position: 'absolute', bottom: 20, right: 20, backgroundColor: '#4F46E5', width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, zIndex: 100 },

  emptyCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0', marginTop: 20 },
  emptyText: { fontSize: 16, fontWeight: 'bold', color: '#334155', marginTop: 12 },
  emptySubText: { fontSize: 13, color: '#94A3B8', marginTop: 8, textAlign: 'center' },
  centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.4)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContentLarge: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 24, width: '100%', maxWidth: 450, maxHeight: '80%' },
  modalContent: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 24, width: '100%', maxWidth: 360 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E293B', marginBottom: 20, textAlign: 'center' },
  detailsScrollView: { marginBottom: 20 },
  detailGroup: { marginBottom: 16 },
  detailFieldLabel: { fontSize: 11, color: '#64748B', fontWeight: '600', textTransform: 'uppercase', marginBottom: 4 },
  detailFieldValueText: { fontSize: 14, color: '#1E293B', fontWeight: '500' },
  modalCloseBtn: { backgroundColor: '#64748B', borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  modalCloseText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 13 },
  modalInputWrapper: { marginBottom: 20, alignItems: 'center' },
  nativeDateButton: { borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, padding: 12, backgroundColor: '#F8FAFC', alignItems: 'center', width: '100%' },
  nativeDateButtonText: { fontSize: 14, color: '#334155', fontWeight: '500' },
  modalButtonsRow: { flexDirection: 'row', gap: 12 },
  modalBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  modalCancelBtn: { borderWidth: 1, borderColor: '#CBD5E1', backgroundColor: '#FFFFFF' },
  modalConfirmBtn: { backgroundColor: '#4F46E5' },
  modalCancelText: { fontSize: 13, color: '#475569', fontWeight: 'bold' },
  modalConfirmText: { fontSize: 13, color: '#FFFFFF', fontWeight: 'bold' },
});