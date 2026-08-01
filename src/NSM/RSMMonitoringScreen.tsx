import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getRSMList, saveRSMList, addRSMRecord } from '../services/nsmStorageService';

const DAYS = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const YEARS = Array.from({ length: 50 }, (_, i) => String(1975 + i));

const NSMRSMMonitoringScreen = () => {
  const [activeTab, setActiveTab] = useState<'List' | 'Add' | 'Profile'>('List');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRegion] = useState('All Regions');
  const [filterState] = useState('All States');
  const [filterStatus] = useState('All Status');

  const [rsmList, setRsmList] = useState<any[]>([]);
  const [selectedRSM, setSelectedRSM] = useState<any>(null);

  // Add / Edit RSM Form State (Section 2.2 Fields)
  const [empCode] = useState('RSM004');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState('Male');
  const [dob, setDob] = useState('15 Aug 1988');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [address, setAddress] = useState('123 Pharma Park, Sector 4');
  const [joiningDate, setJoiningDate] = useState('01 Apr 2022');
  const [department] = useState('Sales & Marketing');
  const [designation] = useState('Regional Sales Manager (RSM)');
  const [region, setRegion] = useState('South Zone');
  const [assignedStates, setAssignedStates] = useState('Karnataka, Kerala');
  const [hq, setHq] = useState('Bangalore');
  const [reportingManager] = useState('Rajesh Sharma (NSM)');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Calendar Modal State
  const [datePickerTarget, setDatePickerTarget] = useState<'dob' | 'joiningDate' | null>(null);
  const [selDay, setSelDay] = useState('15');
  const [selMonth, setSelMonth] = useState('Aug');
  const [selYear, setSelYear] = useState('1988');

  useEffect(() => {
    loadRSMs();
  }, []);

  const loadRSMs = async () => {
    const data = await getRSMList();
    if (data && data.length > 0) {
      const enriched = data.map((item: any, i: number) => ({
        ...item,
        empId: item.empId || `EMP10${i + 1}`,
        mobile: item.mobile || `+91 98765 4321${i}`,
        email: item.email || `${item.name.toLowerCase().replace(' ', '.')}@pharmaerp.com`,
        assignedRegion: item.assignedRegion || (i === 0 ? 'West Zone' : i === 1 ? 'North Zone' : 'South Zone'),
        assignedStates: item.assignedStates || (i === 0 ? 'Maharashtra, Goa' : i === 1 ? 'Gujarat, Daman' : 'Karnataka, Kerala'),
        hq: item.hq || (i === 0 ? 'Mumbai' : i === 1 ? 'Ahmedabad' : 'Bangalore'),
        joiningDate: item.joiningDate || '01-04-2022',
        status: item.status || 'Active',
        address: '45 MG Road, Commercial Complex',
        salesTarget: item.currentTarget || '₹1,50,00,000',
        salesAchieved: item.achievedSales || '₹1,28,50,000',
        achvPct: '85.6%',
        doctorVisits: 1450,
        chemistVisits: 520,
        ordersCount: 4200,
        revenue: '₹1.28 Cr',
        totalASM: 4,
        activeASM: 4,
        totalMR: 22,
        activeMR: 20,
      }));
      setRsmList(enriched);
      setSelectedRSM(enriched[0]);
    }
  };

  const openCalendarPicker = (target: 'dob' | 'joiningDate') => {
    setDatePickerTarget(target);
    if (target === 'dob') {
      setSelDay('15');
      setSelMonth('Aug');
      setSelYear('1988');
    } else {
      setSelDay('01');
      setSelMonth('Apr');
      setSelYear('2022');
    }
  };

  const confirmDateSelection = () => {
    const formattedDate = `${selDay} ${selMonth} ${selYear}`;
    if (datePickerTarget === 'dob') {
      setDob(formattedDate);
    } else if (datePickerTarget === 'joiningDate') {
      setJoiningDate(formattedDate);
    }
    setDatePickerTarget(null);
  };

  const handleSaveRSM = async () => {
    if (!firstName.trim() || !lastName.trim() || !mobile.trim() || !email.trim()) {
      Alert.alert('⚠️ Validation Error', 'Please fill in all required personal & office details.');
      return;
    }

    const newRecord = {
      id: Date.now().toString(),
      empId: `EMP10${rsmList.length + 1}`,
      code: empCode,
      name: `${firstName} ${lastName}`,
      mobile,
      email,
      assignedRegion: region,
      assignedStates,
      hq,
      joiningDate,
      dob,
      status: 'Active',
      salesTarget: '₹1,50,00,000',
      salesAchieved: '₹0',
      achvPct: '0.0%',
      doctorVisits: 0,
      chemistVisits: 0,
      ordersCount: 0,
      revenue: '₹0',
      totalASM: 4,
      activeASM: 4,
      totalMR: 20,
      activeMR: 20,
    };

    const updated = await addRSMRecord(newRecord);
    if (updated) {
      setRsmList(updated);
      setActiveTab('List');
      Alert.alert('✅ RSM Created', `Regional Sales Manager ${newRecord.name} saved successfully.`);
    }
  };

  const toggleStatus = async (rsmItem: any) => {
    const newStatus = rsmItem.status === 'Active' ? 'Inactive' : 'Active';
    const updated = rsmList.map((r) => (r.id === rsmItem.id ? { ...r, status: newStatus } : r));
    setRsmList(updated);
    await saveRSMList(updated);
    Alert.alert(`⚙️ Account Status`, `${rsmItem.name} set to ${newStatus}.`);
  };

  const filteredList = rsmList.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRegion = filterRegion === 'All Regions' || item.assignedRegion === filterRegion;
    const matchesStatus = filterStatus === 'All Status' || item.status === filterStatus;
    return matchesSearch && matchesRegion && matchesStatus;
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>👨‍💼 RSM Management</Text>
            <Text style={styles.subtitle}>Manage, monitor, onboard and configure Regional Sales Managers.</Text>
          </View>
        </View>

        {/* 3 Main Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity style={[styles.tab, activeTab === 'List' && styles.activeTab]} onPress={() => setActiveTab('List')}>
            <Text style={[styles.tabText, activeTab === 'List' && styles.activeTabText]}>2.1 RSM List</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.tab, activeTab === 'Add' && styles.activeTab]} onPress={() => setActiveTab('Add')}>
            <Text style={[styles.tabText, activeTab === 'Add' && styles.activeTabText]}>2.2 Add RSM</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.tab, activeTab === 'Profile' && styles.activeTab]} onPress={() => setActiveTab('Profile')}>
            <Text style={[styles.tabText, activeTab === 'Profile' && styles.activeTabText]}>2.4 RSM Profile</Text>
          </TouchableOpacity>
        </View>

        {/* ── TAB 2.1: RSM LIST ── */}
        {activeTab === 'List' && (
          <View>
            <View style={styles.filterRow}>
              <View style={styles.filterPill}><Text style={styles.filterPillText}>{filterRegion}</Text></View>
              <View style={styles.filterPill}><Text style={styles.filterPillText}>{filterState}</Text></View>
              <View style={styles.filterPill}><Text style={styles.filterPillText}>{filterStatus}</Text></View>
            </View>

            <View style={styles.searchBar}>
              <Ionicons name="search-outline" size={18} color="#94A3B8" style={{ marginRight: 8 }} />
              <TextInput placeholder="Search by name or code..." style={styles.searchInput} value={searchQuery} onChangeText={setSearchQuery} />
            </View>

            <View style={{ gap: 12 }}>
              {filteredList.map((item) => (
                <View key={item.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View>
                      <Text style={styles.rsmCode}>{item.code} ({item.empId}) — <Text style={styles.rsmName}>{item.name}</Text></Text>
                      <Text style={styles.subInfo}>HQ: {item.hq} | Region: {item.assignedRegion} | Joining: {item.joiningDate}</Text>
                      <Text style={styles.subInfo}>States: {item.assignedStates}</Text>
                    </View>
                    <View style={[styles.statusBadge, item.status === 'Active' ? styles.statusActive : styles.statusInactive]}>
                      <Text style={[styles.statusBadgeText, item.status === 'Active' ? { color: '#15803D' } : { color: '#DC2626' }]}>● {item.status}</Text>
                    </View>
                  </View>

                  <View style={styles.actionsRow}>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => { setSelectedRSM(item); setActiveTab('Profile'); }}>
                      <Ionicons name="eye-outline" size={12} color="#4F46E5" />
                      <Text style={styles.actionBtnText}>View</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionBtn} onPress={() => { setSelectedRSM(item); setActiveTab('Add'); }}>
                      <Ionicons name="create-outline" size={12} color="#059669" />
                      <Text style={[styles.actionBtnText, { color: '#059669' }]}>Edit</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionBtn} onPress={() => toggleStatus(item)}>
                      <Ionicons name={item.status === 'Active' ? 'close-circle-outline' : 'checkmark-circle-outline'} size={12} color={item.status === 'Active' ? '#DC2626' : '#16A34A'} />
                      <Text style={[styles.actionBtnText, { color: item.status === 'Active' ? '#DC2626' : '#16A34A' }]}>{item.status === 'Active' ? 'Deactivate' : 'Activate'}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionBtn} onPress={() => Alert.alert('🔑 Password Reset', `Temporary password sent to ${item.email}`)}>
                      <Ionicons name="key-outline" size={12} color="#D97706" />
                      <Text style={[styles.actionBtnText, { color: '#D97706' }]}>Reset Pass</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── TAB 2.2: ADD / EDIT RSM ── */}
        {activeTab === 'Add' && (
          <View style={styles.card}>
            <Text style={styles.formSectionTitle}>1. Personal Details</Text>
            <View style={styles.formRow}>
              <View style={styles.fieldHalf}>
                <Text style={styles.label}>Employee Code (Auto)</Text>
                <TextInput style={[styles.input, { backgroundColor: '#F1F5F9' }]} value={empCode} editable={false} />
              </View>
              <View style={styles.fieldHalf}>
                <Text style={styles.label}>First Name *</Text>
                <TextInput style={styles.input} placeholder="e.g. Suresh" value={firstName} onChangeText={setFirstName} />
              </View>
            </View>

            <View style={styles.formRow}>
              <View style={styles.fieldHalf}>
                <Text style={styles.label}>Last Name *</Text>
                <TextInput style={styles.input} placeholder="e.g. Nambiar" value={lastName} onChangeText={setLastName} />
              </View>
              <View style={styles.fieldHalf}>
                <Text style={styles.label}>Mobile Number *</Text>
                <TextInput style={styles.input} placeholder="e.g. +91 98765 43210" keyboardType="phone-pad" value={mobile} onChangeText={setMobile} />
              </View>
            </View>

            <View style={styles.formRow}>
              <View style={styles.fieldHalf}>
                <Text style={styles.label}>Email Address *</Text>
                <TextInput style={styles.input} placeholder="e.g. suresh@pharmaerp.com" keyboardType="email-address" value={email} onChangeText={setEmail} />
              </View>
              <View style={styles.fieldHalf}>
                <Text style={styles.label}>Gender</Text>
                <TextInput style={styles.input} value={gender} onChangeText={setGender} />
              </View>
            </View>

            {/* Date of Birth Field with Interactive Calendar Picker Button */}
            <View style={styles.formRow}>
              <View style={styles.fieldHalf}>
                <Text style={styles.label}>Date of Birth 📅</Text>
                <TouchableOpacity style={styles.calendarPickerBtn} onPress={() => openCalendarPicker('dob')}>
                  <Text style={styles.calendarPickerText}>{dob}</Text>
                  <Ionicons name="calendar" size={16} color="#4F46E5" />
                </TouchableOpacity>
              </View>
              <View style={styles.fieldHalf}>
                <Text style={styles.label}>Blood Group</Text>
                <TextInput style={styles.input} value={bloodGroup} onChangeText={setBloodGroup} />
              </View>
            </View>

            <View style={{ marginBottom: 12 }}>
              <Text style={styles.label}>Residential Address</Text>
              <TextInput style={styles.input} value={address} onChangeText={setAddress} />
            </View>

            <Text style={[styles.formSectionTitle, { marginTop: 14 }]}>2. Office Details</Text>

            {/* Joining Date Field with Interactive Calendar Picker Button */}
            <View style={styles.formRow}>
              <View style={styles.fieldHalf}>
                <Text style={styles.label}>Joining Date 📅</Text>
                <TouchableOpacity style={styles.calendarPickerBtn} onPress={() => openCalendarPicker('joiningDate')}>
                  <Text style={styles.calendarPickerText}>{joiningDate}</Text>
                  <Ionicons name="calendar" size={16} color="#4F46E5" />
                </TouchableOpacity>
              </View>
              <View style={styles.fieldHalf}>
                <Text style={styles.label}>Department</Text>
                <TextInput style={[styles.input, { backgroundColor: '#F1F5F9' }]} value={department} editable={false} />
              </View>
            </View>

            <View style={styles.formRow}>
              <View style={styles.fieldHalf}>
                <Text style={styles.label}>Designation</Text>
                <TextInput style={[styles.input, { backgroundColor: '#F1F5F9' }]} value={designation} editable={false} />
              </View>
              <View style={styles.fieldHalf}>
                <Text style={styles.label}>Assigned Region *</Text>
                <TextInput style={styles.input} value={region} onChangeText={setRegion} />
              </View>
            </View>

            <View style={styles.formRow}>
              <View style={styles.fieldHalf}>
                <Text style={styles.label}>Assigned State(s) *</Text>
                <TextInput style={styles.input} value={assignedStates} onChangeText={setAssignedStates} />
              </View>
              <View style={styles.fieldHalf}>
                <Text style={styles.label}>Headquarters (HQ) *</Text>
                <TextInput style={styles.input} value={hq} onChangeText={setHq} />
              </View>
            </View>

            <View style={{ marginBottom: 12 }}>
              <Text style={styles.label}>Reporting Manager (Auto = NSM)</Text>
              <TextInput style={[styles.input, { backgroundColor: '#F1F5F9' }]} value={reportingManager} editable={false} />
            </View>

            <Text style={[styles.formSectionTitle, { marginTop: 14 }]}>3. Login Credentials</Text>
            <View style={styles.formRow}>
              <View style={styles.fieldHalf}>
                <Text style={styles.label}>Username</Text>
                <TextInput style={styles.input} placeholder="e.g. suresh.rsm" value={username} onChangeText={setUsername} />
              </View>
              <View style={styles.fieldHalf}>
                <Text style={styles.label}>Password</Text>
                <TextInput style={styles.input} secureTextEntry value={password} onChangeText={setPassword} />
              </View>
            </View>

            <View style={styles.formBtnRow}>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveRSM}>
                <Text style={styles.btnText}>Save RSM</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.resetBtn} onPress={() => { setFirstName(''); setLastName(''); setMobile(''); setEmail(''); }}>
                <Text style={styles.resetBtnText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setActiveTab('List')}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── TAB 2.4: RSM PROFILE ── */}
        {activeTab === 'Profile' && selectedRSM && (
          <View style={styles.card}>
            <View style={styles.profileHeader}>
              <Ionicons name="person-circle" size={56} color="#4F46E5" />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.profileName}>{selectedRSM.name}</Text>
                <Text style={styles.profileRole}>{selectedRSM.code} ({selectedRSM.empId}) • {selectedRSM.status}</Text>
                <Text style={styles.profileSub}>HQ: {selectedRSM.hq} | Region: {selectedRSM.assignedRegion}</Text>
              </View>
            </View>

            <Text style={styles.formSectionTitle}>1. Personal Information</Text>
            <Text style={styles.profileLine}>• Code: {selectedRSM.code} | ID: {selectedRSM.empId}</Text>
            <Text style={styles.profileLine}>• DOB: {dob}</Text>
            <Text style={styles.profileLine}>• Mobile: {selectedRSM.mobile}</Text>
            <Text style={styles.profileLine}>• Email: {selectedRSM.email}</Text>
            <Text style={styles.profileLine}>• Address: {selectedRSM.address}</Text>

            <Text style={[styles.formSectionTitle, { marginTop: 14 }]}>2. Office Information</Text>
            <Text style={styles.profileLine}>• Region: {selectedRSM.assignedRegion}</Text>
            <Text style={styles.profileLine}>• States: {selectedRSM.assignedStates}</Text>
            <Text style={styles.profileLine}>• HQ: {selectedRSM.hq}</Text>
            <Text style={styles.profileLine}>• Joining Date: {selectedRSM.joiningDate}</Text>

            <Text style={[styles.formSectionTitle, { marginTop: 14 }]}>3. Performance Summary</Text>
            <View style={styles.perfGrid}>
              <View style={styles.perfBox}><Text style={styles.perfLbl}>Target</Text><Text style={styles.perfVal}>{selectedRSM.salesTarget}</Text></View>
              <View style={styles.perfBox}><Text style={styles.perfLbl}>Achieved</Text><Text style={[styles.perfVal, { color: '#059669' }]}>{selectedRSM.salesAchieved}</Text></View>
              <View style={styles.perfBox}><Text style={styles.perfLbl}>Dr. Visits</Text><Text style={styles.perfVal}>{selectedRSM.doctorVisits}</Text></View>
              <View style={styles.perfBox}><Text style={styles.perfLbl}>Chemist Visits</Text><Text style={styles.perfVal}>{selectedRSM.chemistVisits}</Text></View>
            </View>

            <Text style={[styles.formSectionTitle, { marginTop: 14 }]}>4. Team Summary</Text>
            <Text style={styles.profileLine}>• ASMs: Total {selectedRSM.totalASM} | Active {selectedRSM.activeASM}</Text>
            <Text style={styles.profileLine}>• MRs: Total {selectedRSM.totalMR} | Active {selectedRSM.activeMR}</Text>

            <View style={[styles.actionsRow, { marginTop: 16 }]}>
              <TouchableOpacity style={styles.actionBtn} onPress={() => setActiveTab('Add')}>
                <Ionicons name="create-outline" size={14} color="#4F46E5" />
                <Text style={styles.actionBtnText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={() => Alert.alert('🔑 Reset Password', `Password reset link sent to ${selectedRSM.email}`)}>
                <Ionicons name="key-outline" size={14} color="#D97706" />
                <Text style={[styles.actionBtnText, { color: '#D97706' }]}>Reset Pass</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={() => toggleStatus(selectedRSM)}>
                <Ionicons name="power-outline" size={14} color="#DC2626" />
                <Text style={[styles.actionBtnText, { color: '#DC2626' }]}>{selectedRSM.status === 'Active' ? 'Deactivate' : 'Activate'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* ── Interactive Date Picker Calendar Selector Modal ── */}
      <Modal visible={datePickerTarget !== null} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.calModalCard}>
            <View style={styles.calModalHeader}>
              <Text style={styles.calModalTitle}>
                📅 Select {datePickerTarget === 'dob' ? 'Date of Birth' : 'Joining Date'}
              </Text>
              <TouchableOpacity onPress={() => setDatePickerTarget(null)}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.calPreviewText}>
              Selected: <Text style={{ color: '#4F46E5', fontWeight: 'bold' }}>{selDay} {selMonth} {selYear}</Text>
            </Text>

            {/* Day Selector */}
            <Text style={styles.wheelLabel}>Select Day:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
              {DAYS.map((day) => (
                <TouchableOpacity
                  key={day}
                  style={[styles.wheelItem, selDay === day && styles.wheelItemSel]}
                  onPress={() => setSelDay(day)}
                >
                  <Text style={[styles.wheelText, selDay === day && styles.wheelTextSel]}>{day}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Month Selector */}
            <Text style={styles.wheelLabel}>Select Month:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
              {MONTHS.map((month) => (
                <TouchableOpacity
                  key={month}
                  style={[styles.wheelItem, selMonth === month && styles.wheelItemSel]}
                  onPress={() => setSelMonth(month)}
                >
                  <Text style={[styles.wheelText, selMonth === month && styles.wheelTextSel]}>{month}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Year Selector */}
            <Text style={styles.wheelLabel}>Select Year:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
              {YEARS.map((year) => (
                <TouchableOpacity
                  key={year}
                  style={[styles.wheelItem, selYear === year && styles.wheelItemSel]}
                  onPress={() => setSelYear(year)}
                >
                  <Text style={[styles.wheelText, selYear === year && styles.wheelTextSel]}>{year}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity style={styles.confirmCalBtn} onPress={confirmDateSelection}>
              <Text style={styles.confirmCalBtnText}>Confirm Date Selection</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default NSMRSMMonitoringScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { padding: 16 },
  headerRow: { marginBottom: 14 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#0F172A' },
  subtitle: { fontSize: 12, color: '#64748B', marginTop: 2 },

  tabContainer: { flexDirection: 'row', backgroundColor: '#E2E8F0', borderRadius: 10, padding: 3, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  activeTab: { backgroundColor: '#FFF', elevation: 1 },
  tabText: { fontSize: 11, fontWeight: '600', color: '#64748B' },
  activeTabText: { color: '#4F46E5', fontWeight: 'bold' },

  filterRow: { flexDirection: 'row', gap: 6, marginBottom: 10 },
  filterPill: { flex: 1, backgroundColor: '#FFF', paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: '#CBD5E1', alignItems: 'center' },
  filterPillText: { fontSize: 10, color: '#1E293B', fontWeight: 'bold' },

  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 14 },
  searchInput: { flex: 1, fontSize: 13, color: '#0F172A' },

  card: { backgroundColor: '#FFF', padding: 16, borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  rsmCode: { fontSize: 12, color: '#64748B' },
  rsmName: { fontSize: 15, fontWeight: 'bold', color: '#0F172A' },
  subInfo: { fontSize: 11, color: '#64748B', marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, height: 22 },
  statusActive: { backgroundColor: '#DCFCE7' },
  statusInactive: { backgroundColor: '#FEE2E2' },
  statusBadgeText: { fontSize: 10, fontWeight: 'bold' },

  actionsRow: { flexDirection: 'row', gap: 6, borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 10 },
  actionBtn: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC', paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: '#E2E8F0', gap: 4 },
  actionBtnText: { fontSize: 10, fontWeight: 'bold', color: '#4F46E5' },

  formSectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#4F46E5', marginBottom: 10 },
  formRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  fieldHalf: { flex: 1 },
  label: { fontSize: 10, fontWeight: 'bold', color: '#64748B', marginBottom: 4 },
  input: { borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 6, fontSize: 12, backgroundColor: '#FFF' },

  calendarPickerBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#4F46E5', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 8, backgroundColor: '#EEF2FF' },
  calendarPickerText: { fontSize: 12, fontWeight: 'bold', color: '#4F46E5' },

  formBtnRow: { flexDirection: 'row', gap: 8, marginTop: 16 },
  saveBtn: { flex: 1, backgroundColor: '#4F46E5', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  btnText: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },
  resetBtn: { backgroundColor: '#FEF3C7', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, alignItems: 'center' },
  resetBtnText: { color: '#D97706', fontWeight: 'bold', fontSize: 12 },
  cancelBtn: { backgroundColor: '#F1F5F9', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, alignItems: 'center' },
  cancelBtnText: { color: '#64748B', fontWeight: 'bold', fontSize: 12 },

  profileHeader: { flexDirection: 'row', alignItems: 'center', paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', marginBottom: 12 },
  profileName: { fontSize: 16, fontWeight: 'bold', color: '#0F172A' },
  profileRole: { fontSize: 12, color: '#4F46E5', fontWeight: 'bold' },
  profileSub: { fontSize: 11, color: '#64748B', marginTop: 2 },
  profileLine: { fontSize: 12, color: '#334155', marginVertical: 2 },
  perfGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 8 },
  perfBox: { width: '48%', backgroundColor: '#F8FAFC', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  perfLbl: { fontSize: 10, color: '#64748B' },
  perfVal: { fontSize: 13, fontWeight: 'bold', color: '#0F172A', marginTop: 2 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.5)', justifyContent: 'center', alignItems: 'center' },
  calModalCard: { backgroundColor: '#FFF', width: '90%', maxWidth: 360, padding: 18, borderRadius: 16 },
  calModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  calModalTitle: { fontSize: 15, fontWeight: 'bold', color: '#0F172A' },
  calPreviewText: { fontSize: 13, color: '#475569', marginBottom: 12, textAlign: 'center' },
  wheelLabel: { fontSize: 11, fontWeight: 'bold', color: '#64748B', marginBottom: 4 },
  wheelItem: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, backgroundColor: '#F1F5F9', marginRight: 6 },
  wheelItemSel: { backgroundColor: '#4F46E5' },
  wheelText: { fontSize: 12, fontWeight: '600', color: '#334155' },
  wheelTextSel: { color: '#FFF', fontWeight: 'bold' },
  confirmCalBtn: { backgroundColor: '#4F46E5', paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  confirmCalBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },
});
