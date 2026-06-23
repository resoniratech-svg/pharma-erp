// import React, { useState, useEffect } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   TextInput,
//   ScrollView,
//   Platform,
//   Alert,
// } from 'react-native';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { useNavigation } from '@react-navigation/native';
// import RNDateTimePicker from '@react-native-community/datetimepicker';

// interface ExpenseClaim {
//   id: number;
//   date: string;
//   category: 'Travel Allowance (TA)' | 'Daily Allowance (DA)' | 'Hotel / Lodging' | 'Toll / Parking' | 'Miscellaneous';
//   amount: number;
//   kmTravelled?: number;
//   receiptRef: string;
//   remarks: string;
//   status: 'Pending Approval' | 'Approved' | 'Rejected';
// }

// const DEFAULT_CLAIMS: ExpenseClaim[] = [
//   {
//     id: 1718100000000,
//     date: '10-Jun-2026',
//     category: 'Travel Allowance (TA)',
//     amount: 110.00,
//     kmTravelled: 22,
//     receiptRef: 'GPS-AUTO-1006.jpg',
//     remarks: 'Auto-calculated from logged daily GPS route (22.0 km at ₹5.00/km)',
//     status: 'Approved',
//   },
//   {
//     id: 1718103600000,
//     date: '10-Jun-2026',
//     category: 'Daily Allowance (DA)',
//     amount: 250.00,
//     receiptRef: 'N/A',
//     remarks: 'Local HQ beat daily allowance standard rate',
//     status: 'Approved',
//   },
//   {
//     id: 1718110800000,
//     date: '11-Jun-2026',
//     category: 'Hotel / Lodging',
//     amount: 1200.00,
//     receiptRef: 'REC-90812.jpg',
//     remarks: 'Outstation hotel stay at Secunderabad Lodge',
//     status: 'Pending Approval',
//   }
// ];

// const ExpenseClaimScreen = () => {
//   const navigation = useNavigation<any>();
//   const [claims, setClaims] = useState<ExpenseClaim[]>([]);
//   const [selectedDate, setSelectedDate] = useState(
//     new Date().toLocaleDateString('en-GB').replace(/\//g, '-') // DD-MM-YYYY
//   );
//   const [showDatePicker, setShowDatePicker] = useState(false);

//   // Form Fields
//   const [category, setCategory] = useState<'Travel Allowance (TA)' | 'Daily Allowance (DA)' | 'Hotel / Lodging' | 'Toll / Parking' | 'Miscellaneous'>('Travel Allowance (TA)');
//   const [amount, setAmount] = useState('');
//   const [kmTravelled, setKmTravelled] = useState('');
//   const [receiptRef, setReceiptRef] = useState('');
//   const [remarks, setRemarks] = useState('');

//   // Summaries
//   const [totals, setTotals] = useState({
//     claimed: 0,
//     approved: 0,
//     pending: 0,
//   });

//   useEffect(() => {
//     loadClaims();
//   }, []);

//   // When selected date changes, lookup distance to prefill Travel Allowance if selected
//   useEffect(() => {
//     if (category === 'Travel Allowance (TA)') {
//       autoLookupGPSDistance();
//     }
//   }, [selectedDate, category]);

//   const loadClaims = async () => {
//     try {
//       const stored = await AsyncStorage.getItem('@expense_claims');
//       if (stored) {
//         const parsed = JSON.parse(stored);
//         setClaims(parsed);
//         calculateTotals(parsed);
//       } else {
//         await AsyncStorage.setItem('@expense_claims', JSON.stringify(DEFAULT_CLAIMS));
//         setClaims(DEFAULT_CLAIMS);
//         calculateTotals(DEFAULT_CLAIMS);
//       }
//     } catch (e) {
//       console.log('Failed to load claims');
//     }
//   };

//   const calculateTotals = (list: ExpenseClaim[]) => {
//     const claimed = list.reduce((sum, item) => sum + item.amount, 0);
//     const approved = list.reduce((sum, item) => sum + (item.status === 'Approved' ? item.amount : 0), 0);
//     const pending = list.reduce((sum, item) => sum + (item.status === 'Pending Approval' ? item.amount : 0), 0);

//     setTotals({ claimed, approved, pending });
//   };

//   const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
//     const R = 6371; // Earth's radius in km
//     const dLat = ((lat2 - lat1) * Math.PI) / 180;
//     const dLon = ((lon2 - lon1) * Math.PI) / 180;
//     const a =
//       Math.sin(dLat / 2) * Math.sin(dLat / 2) +
//       Math.cos((lat1 * Math.PI) / 180) *
//         Math.cos((lat2 * Math.PI) / 180) *
//         Math.sin(dLon / 2) *
//         Math.sin(dLon / 2);
//     const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//     return R * c;
//   };

//   // Prefills travel expense by looking up logged GPS coordinates from Movement Tracking screen
//   const autoLookupGPSDistance = async () => {
//     try {
//       const key = `@gps_movement_${selectedDate}`;
//       const stored = await AsyncStorage.getItem(key);
//       if (stored) {
//         const logs = JSON.parse(stored);
//         if (logs.length >= 2) {
//           let dist = 0;
//           for (let i = 0; i < logs.length - 1; i++) {
//             dist += calculateDistance(
//               logs[i].latitude,
//               logs[i].longitude,
//               logs[i + 1].latitude,
//               logs[i + 1].longitude
//             );
//           }
//           const finalDist = parseFloat(dist.toFixed(2));
//           setKmTravelled(finalDist.toString());
//           // Auto calculate amount at rate of ₹5.00 per kilometer
//           setAmount((finalDist * 5).toFixed(0));
//           setRemarks(`Auto-fill: ${finalDist} km recorded on route map. Travel Allowance calculated at ₹5.00/km.`);
//         }
//       }
//     } catch (e) {
//       console.log('Failed to lookup distance');
//     }
//   };

//   const handleCategorySelect = (cat: typeof category) => {
//     setCategory(cat);
//     if (cat === 'Daily Allowance (DA)') {
//       setAmount('250');
//       setKmTravelled('');
//       setRemarks('HQ Daily Allowance base standard rate');
//     } else if (cat !== 'Travel Allowance (TA)') {
//       setAmount('');
//       setKmTravelled('');
//       setRemarks('');
//     }
//   };

//   const handleAddClaim = async () => {
//     const parsedAmount = parseFloat(amount);
//     if (isNaN(parsedAmount) || parsedAmount <= 0) {
//       customAlert('Invalid Input', 'Please enter a valid expense claim amount.');
//       return;
//     }

//     const newClaim: ExpenseClaim = {
//       id: Date.now(),
//       date: selectedDate,
//       category,
//       amount: parsedAmount,
//       kmTravelled: kmTravelled ? parseFloat(kmTravelled) : undefined,
//       receiptRef: receiptRef.trim() || 'N/A',
//       remarks: remarks.trim() || 'No additional remarks.',
//       status: 'Pending Approval',
//     };

//     const updated = [newClaim, ...claims];
//     setClaims(updated);
//     calculateTotals(updated);
//     await AsyncStorage.setItem('@expense_claims', JSON.stringify(updated));

//     // Reset Form Fields
//     setAmount('');
//     setKmTravelled('');
//     setReceiptRef('');
//     setRemarks('');
//     customAlert('Success', 'Expense claim submitted successfully for manager approval.');
//   };

//   // Demonstration helper: cycles claim status
//   const cycleClaimStatus = async (id: number) => {
//     const updated = claims.map((item) => {
//       if (item.id === id) {
//         const nextStatus: ExpenseClaim['status'] =
//           item.status === 'Pending Approval'
//             ? 'Approved'
//             : item.status === 'Approved'
//             ? 'Rejected'
//             : 'Pending Approval';
//         return { ...item, status: nextStatus };
//       }
//       return item;
//     });

//     setClaims(updated);
//     calculateTotals(updated);
//     await AsyncStorage.setItem('@expense_claims', JSON.stringify(updated));
//   };

//   const customAlert = (title: string, message: string) => {
//     if (Platform.OS === 'web') {
//       window.alert(`${title}\n\n${message}`);
//     } else {
//       Alert.alert(title, message);
//     }
//   };

//   const getWebDateFormat = (dateStr: string) => {
//     const parts = dateStr.split('-');
//     if (parts.length === 3) {
//       return `${parts[2]}-${parts[1]}-${parts[0]}`; // YYYY-MM-DD
//     }
//     return dateStr;
//   };

//   const handleDateChangeWeb = (val: string) => {
//     if (!val) return;
//     const parts = val.split('-');
//     if (parts.length === 3) {
//       setSelectedDate(`${parts[2]}-${parts[1]}-${parts[0]}`); // DD-MM-YYYY
//     }
//   };

//   const parseDateString = (dateStr: string): Date => {
//     const parts = dateStr.split('-');
//     if (parts.length === 3) {
//       return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
//     }
//     return new Date();
//   };

//   const webInputStyle = {
//     borderWidth: 1,
//     borderColor: '#CBD5E1',
//     borderRadius: 8,
//     padding: 10,
//     fontSize: 14,
//     backgroundColor: '#F8FAFC',
//     width: '100%',
//     outlineStyle: 'none',
//   } as any;

//   return (
//     <View style={styles.container}>
//       {/* Header */}
//       <View style={styles.header}>
//         <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
//           <Text style={styles.backButtonText}>⬅️ Back</Text>
//         </TouchableOpacity>
//         <Text style={styles.headerTitle}>💵 Expense Claims</Text>
//         <Text style={styles.headerSubtitle}>Claim travel allowance (TA) & daily allowance (DA)</Text>
//       </View>

//       {/* Metrics Row */}
//       <View style={styles.metricsRow}>
//         <View style={[styles.metricCard, { borderLeftColor: '#4F46E5' }]}>
//           <Text style={styles.metricVal}>₹{totals.claimed.toLocaleString()}</Text>
//           <Text style={styles.metricLabel}>Total Claimed</Text>
//         </View>
//         <View style={[styles.metricCard, { borderLeftColor: '#10B981' }]}>
//           <Text style={[styles.metricVal, { color: '#059669' }]}>₹{totals.approved.toLocaleString()}</Text>
//           <Text style={styles.metricLabel}>Approved</Text>
//         </View>
//         <View style={[styles.metricCard, { borderLeftColor: '#F59E0B' }]}>
//           <Text style={[styles.metricVal, { color: '#D97706' }]}>₹{totals.pending.toLocaleString()}</Text>
//           <Text style={styles.metricLabel}>Pending Approval</Text>
//         </View>
//       </View>

//       <ScrollView contentContainerStyle={styles.scrollContent}>
//         {/* Form Container */}
//         <Text style={styles.sectionTitle}>Submit New Expense Claim</Text>
//         <View style={styles.formCard}>
//           {/* Date Picker */}
//           <Text style={styles.formLabel}>Expense Date:</Text>
//           {Platform.OS === 'web' ? (
//             <input
//               type="date"
//               value={getWebDateFormat(selectedDate)}
//               onChange={(e) => handleDateChangeWeb(e.target.value)}
//               style={webInputStyle}
//             />
//           ) : (
//             <TouchableOpacity
//               style={styles.datePickerBtn}
//               onPress={() => setShowDatePicker(true)}
//             >
//               <Text style={styles.datePickerBtnText}>{selectedDate}</Text>
//             </TouchableOpacity>
//           )}
//           {showDatePicker && (
//             <RNDateTimePicker
//               mode="date"
//               value={parseDateString(selectedDate)}
//               onChange={(e, d) => {
//                 setShowDatePicker(false);
//                 if (d) {
//                   const day = d.getDate().toString().padStart(2, '0');
//                   const month = (d.getMonth() + 1).toString().padStart(2, '0');
//                   const year = d.getFullYear();
//                   setSelectedDate(`${day}-${month}-${year}`);
//                 }
//               }}
//             />
//           )}

//           {/* Category Dropdown Selector */}
//           <Text style={[styles.formLabel, { marginTop: 12 }]}>Expense Category:</Text>
//           <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
//             {([
//               'Travel Allowance (TA)',
//               'Daily Allowance (DA)',
//               'Hotel / Lodging',
//               'Toll / Parking',
//               'Miscellaneous',
//             ] as const).map((cat) => (
//               <TouchableOpacity
//                 key={cat}
//                 style={[styles.categoryPill, category === cat && styles.activePill]}
//                 onPress={() => handleCategorySelect(cat)}
//               >
//                 <Text style={[styles.pillText, category === cat && styles.activePillText]}>
//                   {cat}
//                 </Text>
//               </TouchableOpacity>
//             ))}
//           </ScrollView>

//           {/* Conditional inputs */}
//           {category === 'Travel Allowance (TA)' && (
//             <View style={{ marginTop: 12 }}>
//               <Text style={styles.formLabel}>Kilometers Travelled (Rate: ₹5.00/km):</Text>
//               <TextInput
//                 style={styles.input}
//                 placeholder="e.g. 24"
//                 keyboardType="numeric"
//                 value={kmTravelled}
//                 onChangeText={(val) => {
//                   setKmTravelled(val);
//                   const parsed = parseFloat(val);
//                   if (!isNaN(parsed)) {
//                     setAmount((parsed * 5).toFixed(0));
//                   }
//                 }}
//               />
//             </View>
//           )}

//           <Text style={[styles.formLabel, { marginTop: 12 }]}>Amount (₹):</Text>
//           <TextInput
//             style={styles.input}
//             placeholder="Claim amount"
//             keyboardType="numeric"
//             value={amount}
//             onChangeText={setAmount}
//             editable={category !== 'Travel Allowance (TA)' && category !== 'Daily Allowance (DA)'}
//           />

//           <Text style={[styles.formLabel, { marginTop: 12 }]}>Receipt Image Reference / Filename:</Text>
//           <TextInput
//             style={styles.input}
//             placeholder="e.g. receipt_101.jpg"
//             value={receiptRef}
//             onChangeText={setReceiptRef}
//           />

//           <Text style={[styles.formLabel, { marginTop: 12 }]}>Additional Remarks / Objectives:</Text>
//           <TextInput
//             style={[styles.input, styles.textArea]}
//             placeholder="Enter purpose of trip/expense"
//             multiline
//             numberOfLines={3}
//             value={remarks}
//             onChangeText={setRemarks}
//           />

//           <TouchableOpacity style={styles.submitBtn} onPress={handleAddClaim}>
//             <Text style={styles.submitBtnText}>Submit Expense Claim</Text>
//           </TouchableOpacity>
//         </View>

//         {/* Claims Logs */}
//         <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Claims Submission History</Text>
//         {claims.length > 0 ? (
//           <View style={styles.historyList}>
//             {claims.map((claim) => {
//               let statusColor = '#94A3B8';
//               let statusBg = '#F1F5F9';
//               if (claim.status === 'Approved') {
//                 statusColor = '#10B981';
//                 statusBg = '#D1FAE5';
//               } else if (claim.status === 'Rejected') {
//                 statusColor = '#EF4444';
//                 statusBg = '#FEE2E2';
//               }

//               return (
//                 <View key={claim.id} style={styles.claimCard}>
//                   <View style={styles.cardHeader}>
//                     <View>
//                       <Text style={styles.claimCategory}>{claim.category}</Text>
//                       <Text style={styles.claimDate}>📅 Date: {claim.date}</Text>
//                     </View>
//                     <Text style={styles.claimAmount}>₹{claim.amount}</Text>
//                   </View>
//                   <View style={styles.cardDivider} />
//                   <Text style={styles.claimDetailText}>📝 Remarks: {claim.remarks}</Text>
//                   <Text style={styles.claimDetailText}>📄 Receipt: {claim.receiptRef}</Text>
                  
//                   {claim.kmTravelled && (
//                     <Text style={styles.claimDetailText}>🚗 Distance: {claim.kmTravelled} km</Text>
//                   )}

//                   <View style={styles.statusRow}>
//                     <Text style={styles.demoTip}>💡 Tap status to cycle for demo:</Text>
//                     <TouchableOpacity
//                       style={[styles.statusBadge, { backgroundColor: statusBg }]}
//                       onPress={() => cycleClaimStatus(claim.id)}
//                     >
//                       <Text style={[styles.statusText, { color: statusColor }]}>
//                         {claim.status}
//                       </Text>
//                     </TouchableOpacity>
//                   </View>
//                 </View>
//               );
//             })}
//           </View>
//         ) : (
//           <View style={styles.emptyCard}>
//             <Text style={styles.emptyText}>No expense claims filed yet.</Text>
//           </View>
//         )}
//         <View style={{ height: 40 }} />
//       </ScrollView>
//     </View>
//   );
// };

// export default ExpenseClaimScreen;

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#F8FAFC',
//   },
//   header: {
//     backgroundColor: '#4F46E5',
//     paddingTop: 60,
//     paddingBottom: 25,
//     paddingHorizontal: 20,
//     borderBottomLeftRadius: 24,
//     borderBottomRightRadius: 24,
//     position: 'relative',
//   },
//   backButton: {
//     position: 'absolute',
//     left: 15,
//     top: 50,
//     zIndex: 10,
//     paddingVertical: 6,
//     paddingHorizontal: 12,
//     borderRadius: 20,
//     backgroundColor: 'rgba(255, 255, 255, 0.2)',
//   },
//   backButtonText: {
//     fontSize: 12,
//     color: '#FFFFFF',
//     fontWeight: 'bold',
//   },
//   headerTitle: {
//     fontSize: 22,
//     fontWeight: 'bold',
//     color: '#FFFFFF',
//     textAlign: 'center',
//   },
//   headerSubtitle: {
//     fontSize: 12,
//     color: '#E0E7FF',
//     textAlign: 'center',
//     marginTop: 6,
//   },
//   metricsRow: {
//     flexDirection: 'row',
//     gap: 8,
//     marginHorizontal: 20,
//     marginTop: -15,
//     zIndex: 10,
//   },
//   metricCard: {
//     flex: 1,
//     backgroundColor: '#FFFFFF',
//     borderRadius: 12,
//     paddingVertical: 12,
//     paddingHorizontal: 8,
//     borderLeftWidth: 4,
//     alignItems: 'center',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.06,
//     shadowRadius: 3,
//     elevation: 3,
//   },
//   metricVal: {
//     fontSize: 15,
//     fontWeight: 'bold',
//     color: '#1E293B',
//   },
//   metricLabel: {
//     fontSize: 10,
//     color: '#64748B',
//     marginTop: 3,
//     fontWeight: '600',
//     textAlign: 'center',
//   },
//   scrollContent: {
//     paddingHorizontal: 20,
//     paddingTop: 20,
//   },
//   sectionTitle: {
//     fontSize: 15,
//     fontWeight: 'bold',
//     color: '#1E293B',
//     marginBottom: 10,
//   },
//   formCard: {
//     backgroundColor: '#FFFFFF',
//     borderRadius: 16,
//     padding: 16,
//     shadowColor: '#000',
//     shadowOpacity: 0.02,
//     shadowRadius: 2,
//     elevation: 1,
//   },
//   formLabel: {
//     fontSize: 12,
//     fontWeight: 'bold',
//     color: '#475569',
//     marginBottom: 6,
//   },
//   datePickerBtn: {
//     borderWidth: 1,
//     borderColor: '#CBD5E1',
//     borderRadius: 8,
//     paddingVertical: 10,
//     paddingHorizontal: 16,
//     backgroundColor: '#F8FAFC',
//   },
//   datePickerBtnText: {
//     fontSize: 14,
//     color: '#1E293B',
//     fontWeight: 'bold',
//   },
//   categoryScroll: {
//     flexDirection: 'row',
//     marginBottom: 4,
//   },
//   categoryPill: {
//     paddingVertical: 8,
//     paddingHorizontal: 12,
//     borderRadius: 20,
//     backgroundColor: '#EEF2F6',
//     marginRight: 6,
//   },
//   activePill: {
//     backgroundColor: '#4F46E5',
//   },
//   pillText: {
//     fontSize: 11,
//     fontWeight: '600',
//     color: '#475569',
//   },
//   activePillText: {
//     color: '#FFFFFF',
//   },
//   input: {
//     borderWidth: 1,
//     borderColor: '#CBD5E1',
//     borderRadius: 8,
//     padding: 10,
//     fontSize: 14,
//     backgroundColor: '#F8FAFC',
//     color: '#1E293B',
//   },
//   textArea: {
//     height: 70,
//     textAlignVertical: 'top',
//   },
//   submitBtn: {
//     backgroundColor: '#4F46E5',
//     borderRadius: 8,
//     paddingVertical: 12,
//     alignItems: 'center',
//     marginTop: 16,
//   },
//   submitBtnText: {
//     color: '#FFFFFF',
//     fontWeight: 'bold',
//     fontSize: 14,
//   },
//   historyList: {
//     gap: 10,
//   },
//   claimCard: {
//     backgroundColor: '#FFFFFF',
//     borderRadius: 12,
//     padding: 14,
//     shadowColor: '#000',
//     shadowOpacity: 0.02,
//     shadowRadius: 2,
//     elevation: 1,
//   },
//   cardHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'flex-start',
//   },
//   claimCategory: {
//     fontSize: 14,
//     fontWeight: 'bold',
//     color: '#1E293B',
//   },
//   claimDate: {
//     fontSize: 11,
//     color: '#64748B',
//     marginTop: 3,
//   },
//   claimAmount: {
//     fontSize: 16,
//     fontWeight: 'bold',
//     color: '#4F46E5',
//   },
//   cardDivider: {
//     height: 1,
//     backgroundColor: '#F1F5F9',
//     marginVertical: 10,
//   },
//   claimDetailText: {
//     fontSize: 12,
//     color: '#475569',
//     marginTop: 2,
//   },
//   statusRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginTop: 10,
//   },
//   demoTip: {
//     fontSize: 10,
//     color: '#94A3B8',
//     fontStyle: 'italic',
//   },
//   statusBadge: {
//     paddingVertical: 3,
//     paddingHorizontal: 8,
//     borderRadius: 8,
//   },
//   statusText: {
//     fontSize: 10,
//     fontWeight: 'bold',
//   },
//   emptyCard: {
//     backgroundColor: '#FFFFFF',
//     borderRadius: 16,
//     padding: 24,
//     alignItems: 'center',
//   },
//   emptyText: {
//     fontSize: 13,
//     color: '#94A3B8',
//     fontStyle: 'italic',
//   },
// });
////////////////////////////////////////////////////////////////////////////////////////////
import { createExpense } from '../../services/expenseService';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
  Alert,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import RNDateTimePicker from '@react-native-community/datetimepicker';

const safeJsonParse = (data: string | null, fallback: any) => {
  if (!data) return fallback;
  try {
    return JSON.parse(data);
  } catch (err) {
    console.log('safeJsonParse error in ExpenseClaimScreen:', err);
    return fallback;
  }
};

interface ExpenseClaim {
  id: number;
  date: string;
  category: 'Travel Allowance (TA)' | 'Daily Allowance (DA)' | 'Hotel / Lodging' | 'Toll / Parking' | 'Miscellaneous';
  amount: number;
  kmTravelled?: number;
  receiptRef: string;
  remarks: string;
  status: 'Pending Approval' | 'Approved' | 'Rejected';
}

const DEFAULT_CLAIMS: ExpenseClaim[] = [
  {
    id: 1718100000000,
    date: '10-Jun-2026',
    category: 'Travel Allowance (TA)',
    amount: 110.00,
    kmTravelled: 22,
    receiptRef: 'GPS-AUTO-1006.jpg',
    remarks: 'Auto-calculated from logged daily GPS route (22.0 km at ₹5.00/km)',
    status: 'Approved',
  },
  {
    id: 1718103600000,
    date: '10-Jun-2026',
    category: 'Daily Allowance (DA)',
    amount: 250.00,
    receiptRef: 'N/A',
    remarks: 'Local HQ beat daily allowance standard rate',
    status: 'Approved',
  },
  {
    id: 1718110800000,
    date: '11-Jun-2026',
    category: 'Hotel / Lodging',
    amount: 1200.00,
    receiptRef: 'REC-90812.jpg',
    remarks: 'Outstation hotel stay at Secunderabad Lodge',
    status: 'Pending Approval',
  }
];

const ExpenseClaimScreen = () => {
  const navigation = useNavigation<any>();
  const [claims, setClaims] = useState<ExpenseClaim[]>([]);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toLocaleDateString('en-GB').replace(/\//g, '-') // DD-MM-YYYY
  );
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Form Fields
  const [category, setCategory] = useState<'Travel Allowance (TA)' | 'Daily Allowance (DA)' | 'Hotel / Lodging' | 'Toll / Parking' | 'Miscellaneous'>('Travel Allowance (TA)');
  const [amount, setAmount] = useState('');
  const [kmTravelled, setKmTravelled] = useState('');
  const [receiptRef, setReceiptRef] = useState('');
  const [remarks, setRemarks] = useState('');

  const scrollViewRef = React.useRef<ScrollView>(null);

  // Summaries
  const [totals, setTotals] = useState({
    claimed: 0,
    approved: 0,
    pending: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadClaims();
  }, []);

  // When selected date changes, lookup distance to prefill Travel Allowance if selected
  useEffect(() => {
    if (category === 'Travel Allowance (TA)') {
      autoLookupGPSDistance();
    }
  }, [selectedDate, category]);

  const loadClaims = async () => {
    setLoading(true);
    setError(null);
    try {
      const stored = await AsyncStorage.getItem('@expense_claims');
      if (stored) {
        const parsed = safeJsonParse(stored, DEFAULT_CLAIMS);
        setClaims(parsed);
        calculateTotals(parsed);
      } else {
        await AsyncStorage.setItem('@expense_claims', JSON.stringify(DEFAULT_CLAIMS));
        setClaims(DEFAULT_CLAIMS);
        calculateTotals(DEFAULT_CLAIMS);
      }
    } catch (e) {
      console.log('Failed to load claims:', e);
      setError('Failed to load expense claims.');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = (list: ExpenseClaim[]) => {
    const claimed = list.reduce((sum, item) => sum + item.amount, 0);
    const approved = list.reduce((sum, item) => sum + (item.status === 'Approved' ? item.amount : 0), 0);
    const pending = list.reduce((sum, item) => sum + (item.status === 'Pending Approval' ? item.amount : 0), 0);

    setTotals({ claimed, approved, pending });
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Prefills travel expense by looking up logged GPS coordinates from Movement Tracking screen
  const autoLookupGPSDistance = async () => {
    try {
      const key = `@gps_movement_${selectedDate}`;
      const stored = await AsyncStorage.getItem(key);
      if (stored) {
        const logs = safeJsonParse(stored, []);
        if (logs.length >= 2) {
          let dist = 0;
          for (let i = 0; i < logs.length - 1; i++) {
            dist += calculateDistance(
              logs[i].latitude,
              logs[i].longitude,
              logs[i + 1].latitude,
              logs[i + 1].longitude
            );
          }
          const finalDist = parseFloat(dist.toFixed(2));
          setKmTravelled(finalDist.toString());
          // Auto calculate amount at rate of ₹5.00 per kilometer
          setAmount((finalDist * 5).toFixed(0));
          setRemarks(`Auto-fill: ${finalDist} km recorded on route map. Travel Allowance calculated at ₹5.00/km.`);
        }
      }
    } catch (e) {
      console.log('Failed to lookup distance:', e);
    }
  };

  const handleCategorySelect = (cat: typeof category) => {
    setCategory(cat);
    if (cat === 'Daily Allowance (DA)') {
      setAmount('250');
      setKmTravelled('');
      setRemarks('HQ Daily Allowance base standard rate');
    } else if (cat !== 'Travel Allowance (TA)') {
      setAmount('');
      setKmTravelled('');
      setRemarks('');
    }
  };

  const handleAddClaim = async () => {
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      customAlert('Invalid Input', 'Please enter a valid expense claim amount.');
      return;
    }

    try {

 const parts =
  selectedDate.split('-');

const isoDate =
  new Date(
    Number(parts[2]),
    Number(parts[1]) - 1,
    Number(parts[0])
  ).toISOString();

  await createExpense(
    category,
    parsedAmount,
    isoDate,
    remarks,
    receiptRef
  );

  console.log(
    'Expense Saved Successfully'
  );

} catch (error) {

  console.log(
    'Expense API Error:',
    error
  );

  customAlert(
    'Error',
    'Failed to save expense'
  );

  return;
}

    const newClaim: ExpenseClaim = {
      id: Date.now(),
      date: selectedDate,
      category,
      amount: parsedAmount,
      kmTravelled: kmTravelled ? parseFloat(kmTravelled) : undefined,
      receiptRef: receiptRef.trim() || 'N/A',
      remarks: remarks.trim() || 'No additional remarks.',
      status: 'Pending Approval',
    };

    const updated = [newClaim, ...claims];
    setClaims(updated);
    calculateTotals(updated);
    await AsyncStorage.setItem('@expense_claims', JSON.stringify(updated));

    // Reset Form Fields
    setAmount('');
    setKmTravelled('');
    setReceiptRef('');
    setRemarks('');
    customAlert('Success', 'Expense claim submitted successfully for manager approval.');
  };

  // Demonstration helper: cycles claim status
  const cycleClaimStatus = async (id: number) => {
    const updated = claims.map((item) => {
      if (item.id === id) {
        const nextStatus: ExpenseClaim['status'] =
          item.status === 'Pending Approval'
            ? 'Approved'
            : item.status === 'Approved'
            ? 'Rejected'
            : 'Pending Approval';
        return { ...item, status: nextStatus };
      }
      return item;
    });

    setClaims(updated);
    calculateTotals(updated);
    await AsyncStorage.setItem('@expense_claims', JSON.stringify(updated));
  };

  const customAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const getWebDateFormat = (dateStr: string) => {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`; // YYYY-MM-DD
    }
    return dateStr;
  };

  const handleDateChangeWeb = (val: string) => {
    if (!val) return;
    const parts = val.split('-');
    if (parts.length === 3) {
      setSelectedDate(`${parts[2]}-${parts[1]}-${parts[0]}`); // DD-MM-YYYY
    }
  };

  const parseDateString = (dateStr: string): Date => {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    }
    return new Date();
  };

  const webInputStyle = {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    padding: 10,
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
        <Text style={styles.headerTitle}>💵 Expense Claims</Text>
        <Text style={styles.headerSubtitle}>Claim travel allowance (TA) & daily allowance (DA)</Text>
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loaderText}>Loading expense claims...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadClaims}>
            <Text style={styles.retryButtonText}>🔄 Retry Loading Expenses</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* Metrics Row */}
          <View style={styles.metricsRow}>
            <View style={[styles.metricCard, { borderLeftColor: '#4F46E5' }]}>
              <Text style={styles.metricVal}>₹{totals.claimed.toLocaleString()}</Text>
              <Text style={styles.metricLabel}>Total Claimed</Text>
            </View>
            <View style={[styles.metricCard, { borderLeftColor: '#10B981' }]}>
              <Text style={[styles.metricVal, { color: '#059669' }]}>₹{totals.approved.toLocaleString()}</Text>
              <Text style={styles.metricLabel}>Approved</Text>
            </View>
            <View style={[styles.metricCard, { borderLeftColor: '#F59E0B' }]}>
              <Text style={[styles.metricVal, { color: '#D97706' }]}>₹{totals.pending.toLocaleString()}</Text>
              <Text style={styles.metricLabel}>Pending Approval</Text>
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
              {/* Form Container */}
              <Text style={styles.sectionTitle}>Submit New Expense Claim</Text>
              <View style={styles.formCard}>
                {/* Date Picker */}
                <Text style={styles.formLabel}>Expense Date:</Text>
                {Platform.OS === 'web' ? (
                  <input
                    type="date"
                    value={getWebDateFormat(selectedDate)}
                    onChange={(e) => handleDateChangeWeb(e.target.value)}
                    style={webInputStyle}
                  />
                ) : (
                  <TouchableOpacity
                    style={styles.datePickerBtn}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Text style={styles.datePickerBtnText}>{selectedDate}</Text>
                  </TouchableOpacity>
                )}
                {showDatePicker && (
                  <RNDateTimePicker
                    mode="date"
                    value={parseDateString(selectedDate)}
                    onChange={(e, d) => {
                      setShowDatePicker(false);
                      if (d) {
                        const day = d.getDate().toString().padStart(2, '0');
                        const month = (d.getMonth() + 1).toString().padStart(2, '0');
                        const year = d.getFullYear();
                        setSelectedDate(`${day}-${month}-${year}`);
                      }
                    }}
                  />
                )}

                {/* Category Dropdown Selector */}
                <Text style={[styles.formLabel, { marginTop: 12 }]}>Expense Category:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                  {([
                    'Travel Allowance (TA)',
                    'Daily Allowance (DA)',
                    'Hotel / Lodging',
                    'Toll / Parking',
                    'Miscellaneous',
                  ] as const).map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.categoryPill, category === cat && styles.activePill]}
                      onPress={() => handleCategorySelect(cat)}
                    >
                      <Text style={[styles.pillText, category === cat && styles.activePillText]}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Conditional inputs */}
                {category === 'Travel Allowance (TA)' && (
                  <View style={{ marginTop: 12 }}>
                    <Text style={styles.formLabel}>Kilometers Travelled (Rate: ₹5.00/km):</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. 24"
                      keyboardType="numeric"
                      value={kmTravelled}
                      onChangeText={(val) => {
                        setKmTravelled(val);
                        const parsed = parseFloat(val);
                        if (!isNaN(parsed)) {
                          setAmount((parsed * 5).toFixed(0));
                        }
                      }}
                    />
                  </View>
                )}

                <Text style={[styles.formLabel, { marginTop: 12 }]}>Amount (₹):</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Claim amount"
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={setAmount}
                  editable={category !== 'Travel Allowance (TA)' && category !== 'Daily Allowance (DA)'}
                />

                <Text style={[styles.formLabel, { marginTop: 12 }]}>Receipt Image Reference / Filename:</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. receipt_101.jpg"
                  value={receiptRef}
                  onChangeText={setReceiptRef}
                  onFocus={() => {
                    setTimeout(() => {
                      scrollViewRef.current?.scrollToEnd({ animated: true });
                    }, 150);
                  }}
                />

                <Text style={[styles.formLabel, { marginTop: 12 }]}>Additional Remarks / Objectives:</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Enter purpose of trip/expense"
                  multiline
                  numberOfLines={3}
                  value={remarks}
                  onChangeText={setRemarks}
                  onFocus={() => {
                    setTimeout(() => {
                      scrollViewRef.current?.scrollToEnd({ animated: true });
                    }, 150);
                  }}
                />

                <TouchableOpacity style={styles.submitBtn} onPress={handleAddClaim}>
                  <Text style={styles.submitBtnText}>Submit Expense Claim</Text>
                </TouchableOpacity>
              </View>

              {/* Claims Logs */}
              <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Claims Submission History</Text>
              {claims.length > 0 ? (
                <View style={styles.historyList}>
                  {claims.map((claim) => {
                    let statusColor = '#94A3B8';
                    let statusBg = '#F1F5F9';
                    if (claim.status === 'Approved') {
                      statusColor = '#10B981';
                      statusBg = '#D1FAE5';
                    } else if (claim.status === 'Rejected') {
                      statusColor = '#EF4444';
                      statusBg = '#FEE2E2';
                    }

                    return (
                      <View key={claim.id} style={styles.claimCard}>
                        <View style={styles.cardHeader}>
                          <View>
                            <Text style={styles.claimCategory}>{claim.category}</Text>
                            <Text style={styles.claimDate}>📅 Date: {claim.date}</Text>
                          </View>
                          <Text style={styles.claimAmount}>₹{claim.amount}</Text>
                        </View>
                        <View style={styles.cardDivider} />
                        <Text style={styles.claimDetailText}>📝 Remarks: {claim.remarks}</Text>
                        <Text style={styles.claimDetailText}>📄 Receipt: {claim.receiptRef}</Text>
                        
                        {claim.kmTravelled && (
                          <Text style={styles.claimDetailText}>🚗 Distance: {claim.kmTravelled} km</Text>
                        )}

                        <View style={styles.statusRow}>
                          <Text style={styles.demoTip}>💡 Tap status to cycle for demo:</Text>
                          <TouchableOpacity
                            style={[styles.statusBadge, { backgroundColor: statusBg }]}
                            onPress={() => cycleClaimStatus(claim.id)}
                          >
                            <Text style={[styles.statusText, { color: statusColor }]}>
                              {claim.status}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}
                </View>
              ) : (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>No expense claims filed yet.</Text>
                </View>
              )}
              <View style={{ height: 40 }} />
            </ScrollView>
          </KeyboardAvoidingView>
        </>
      )}
    </View>
  );
};

export default ExpenseClaimScreen;

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
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
    marginHorizontal: 20,
    marginTop: -15,
    zIndex: 10,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderLeftWidth: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 3,
  },
  metricVal: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  metricLabel: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 3,
    fontWeight: '600',
    textAlign: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 280,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 10,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#475569',
    marginBottom: 6,
  },
  datePickerBtn: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#F8FAFC',
  },
  datePickerBtnText: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: 'bold',
  },
  categoryScroll: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  categoryPill: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#EEF2F6',
    marginRight: 6,
  },
  activePill: {
    backgroundColor: '#4F46E5',
  },
  pillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  activePillText: {
    color: '#FFFFFF',
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    backgroundColor: '#F8FAFC',
    color: '#1E293B',
  },
  textArea: {
    height: 70,
    textAlignVertical: 'top',
  },
  submitBtn: {
    backgroundColor: '#4F46E5',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  historyList: {
    gap: 10,
  },
  claimCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  claimCategory: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  claimDate: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 3,
  },
  claimAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4F46E5',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },
  claimDetailText: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  demoTip: {
    fontSize: 10,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  statusBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  loaderContainer: {
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