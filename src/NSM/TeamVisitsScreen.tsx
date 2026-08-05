import React, { useState } from 'react';
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
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const NSMTeamVisitsScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewDetails, setViewDetails] = useState<any>(null);

  // Filter States
  const [filterPeriod, setFilterPeriod] = useState('Monthly');
  const [filterState, setFilterState] = useState('All States');
  const [dropdownTarget, setDropdownTarget] = useState<'period' | 'state' | null>(null);

  const teamVisitsData = [
    { id: '1', date: '2026-08-01', rsmName: 'Arun Kumar', state: 'Maharashtra', visitType: 'Doctor Visit', doctorChemist: 'Dr. Suresh Patel', territory: 'Mumbai Central', checkIn: '10:00 AM', checkOut: '10:45 AM', duration: '45 mins', visitStatus: 'Completed' },
    { id: '2', date: '2026-08-01', rsmName: 'Rajesh Singh', state: 'Gujarat', visitType: 'Chemist Visit', doctorChemist: 'Apollo Pharmacy', territory: 'Ahmedabad East', checkIn: '11:30 AM', checkOut: '12:00 PM', duration: '30 mins', visitStatus: 'Completed' },
    { id: '3', date: '2026-08-02', rsmName: 'Priya Sharma', state: 'Karnataka', visitType: 'Joint Field Work', doctorChemist: 'Dr. Anil Kumar', territory: 'Bangalore South', checkIn: '-', checkOut: '-', duration: '-', visitStatus: 'Planned' },
    { id: '4', date: '2026-08-02', rsmName: 'Arun Kumar', state: 'Maharashtra', visitType: 'Chemist Visit', doctorChemist: 'LifeCare Pharmacy', territory: 'Andheri West', checkIn: '14:00 PM', checkOut: '14:20 PM', duration: '20 mins', visitStatus: 'Completed' },
  ];

  const periodOptions = ['Monthly', 'Quarterly', 'Annually'];
  const stateOptions = [
    'All States', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Delhi', 'Goa', 'Gujarat',
    'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra',
    'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
  ];

  const filteredData = teamVisitsData.filter(row => {
    const matchesSearch = row.rsmName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          row.doctorChemist.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          row.territory.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesState = filterState === 'All States' || row.state === filterState;
    return matchesSearch && matchesState;
  });

  const getStatusStyle = (status: string) => {
    switch(status) {
      case 'Completed': return { bg: '#DCFCE7', text: '#15803D', border: '#bbf7d0' };
      case 'Planned': return { bg: '#FEF3C7', text: '#D97706', border: '#fde68a' };
      case 'Cancelled': return { bg: '#FEE2E2', text: '#DC2626', border: '#fecaca' };
      default: return { bg: '#F1F5F9', text: '#334155', border: '#cbd5e1' };
    }
  };

  const handleExport = () => {
    const headers = ['Visit Date', 'RSM Name', 'State', 'Visit Type', 'Doctor / Chemist Name', 'Territory / HQ', 'Check-In', 'Check-Out', 'Duration', 'Visit Status'];
    const csvRows = [headers.join(',')];

    filteredData.forEach(row => {
      const values = [
        row.date,
        row.rsmName,
        row.state,
        row.visitType,
        row.doctorChemist,
        row.territory,
        row.checkIn,
        row.checkOut,
        row.duration,
        row.visitStatus
      ];
      csvRows.push(values.map(v => `"${v}"`).join(','));
    });

    const csvString = csvRows.join('\n');

    if (Platform.OS === 'web') {
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'Team_Visits_Report.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      Alert.alert('Export Successful', 'The report data has been generated.');
    }
  };

  // Dynamic Summary Stats Calculations
  const totalVisits = filteredData.length;
  const completedVisits = filteredData.filter(row => row.visitStatus === 'Completed').length;
  const pendingVisits = filteredData.filter(row => row.visitStatus === 'Planned').length;
  const compliancePct = totalVisits > 0 ? ((completedVisits / totalVisits) * 100).toFixed(1) : '0.0';

  const getDropdownOptions = () => {
    if (dropdownTarget === 'period') return periodOptions;
    if (dropdownTarget === 'state') return stateOptions;
    return [];
  };

  const handleDropdownSelect = (opt: string) => {
    if (dropdownTarget === 'period') setFilterPeriod(opt);
    if (dropdownTarget === 'state') setFilterState(opt);
    setDropdownTarget(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Filters */}
        <View style={styles.filterSection}>
           <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dropdownsRow}>
              <TouchableOpacity style={styles.pickerBox} onPress={() => setDropdownTarget('period')}>
                <Text style={styles.pickerText}>{filterPeriod}</Text>
                <Ionicons name="chevron-down" size={14} color="#64748B" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.pickerBox} onPress={() => setDropdownTarget('state')}>
                <Text style={styles.pickerText}>{filterState}</Text>
                <Ionicons name="chevron-down" size={14} color="#64748B" />
              </TouchableOpacity>
           </ScrollView>
           
           <View style={styles.searchExportRow}>
              <View style={styles.searchBox}>
                <Ionicons name="search" size={16} color="#94A3B8" />
                <TextInput 
                  placeholder="Search by RSM, Doctor, Chemist..." 
                  style={[styles.searchInput, Platform.OS === 'web' && { outlineStyle: 'none' } as any]} 
                  value={searchQuery} 
                  onChangeText={setSearchQuery} 
                />
              </View>
              <TouchableOpacity style={styles.exportBtn} onPress={handleExport}>
                <Ionicons name="download-outline" size={16} color="#475569" />
                <Text style={styles.exportBtnText}>Export</Text>
              </TouchableOpacity>
           </View>
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <View style={styles.iconCircleBlue}><Ionicons name="calendar-outline" size={18} color="#1E3A8A" /></View>
            <Text style={styles.summaryLabel}>Total Visits</Text>
            <Text style={styles.summaryValue}>{totalVisits}</Text>
          </View>
          
          <View style={styles.summaryCard}>
            <View style={styles.iconCircleGreen}><Ionicons name="checkmark-circle-outline" size={18} color="#15803D" /></View>
            <Text style={styles.summaryLabel}>Completed Visits</Text>
            <Text style={styles.summaryValue}>{completedVisits}</Text>
          </View>

          <View style={styles.summaryCard}>
            <View style={styles.iconCircleYellow}><Ionicons name="time-outline" size={18} color="#B45309" /></View>
            <Text style={styles.summaryLabel}>Pending Visits</Text>
            <Text style={styles.summaryValue}>{pendingVisits}</Text>
          </View>

          <View style={styles.summaryCard}>
            <View style={styles.iconCirclePurple}><Ionicons name="shield-checkmark-outline" size={18} color="#7E22CE" /></View>
            <Text style={styles.summaryLabel}>Visit Compliance %</Text>
            <Text style={styles.summaryValue}>{compliancePct}%</Text>
          </View>
        </View>

        {/* Main Table */}
        <View style={styles.card}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ minWidth: 1050 }}>
              <View style={styles.tableHeader}>
                <Text style={[styles.th, { width: 90 }]}>VISIT DATE</Text>
                <Text style={[styles.th, { width: 110 }]}>RSM NAME</Text>
                <Text style={[styles.th, { width: 90 }]}>STATE</Text>
                <Text style={[styles.th, { width: 110 }]}>VISIT TYPE</Text>
                <Text style={[styles.th, { width: 140 }]}>DOCTOR / CHEMIST</Text>
                <Text style={[styles.th, { width: 130 }]}>TERRITORY / HQ</Text>
                <Text style={[styles.th, { width: 80 }]}>CHECK-IN</Text>
                <Text style={[styles.th, { width: 80 }]}>CHECK-OUT</Text>
                <Text style={[styles.th, { width: 80 }]}>DURATION</Text>
                <Text style={[styles.th, { width: 100, textAlign: 'center' }]}>VISIT STATUS</Text>
                <Text style={[styles.th, { width: 60, textAlign: 'center' }]}>ACTION</Text>
              </View>

              {filteredData.map((row) => {
                const statusStyle = getStatusStyle(row.visitStatus);
                return (
                <View key={row.id} style={styles.tableRow}>
                  <Text style={[styles.td, { width: 90 }]}>{row.date}</Text>
                  <Text style={[styles.td, { width: 110, fontWeight: 'bold' }]}>{row.rsmName}</Text>
                  <Text style={[styles.td, { width: 90 }]}>{row.state}</Text>
                  <Text style={[styles.td, { width: 110 }]}>{row.visitType}</Text>
                  <Text style={[styles.td, { width: 140, color: '#1E3A8A', fontWeight: '500' }]}>{row.doctorChemist}</Text>
                  <Text style={[styles.td, { width: 130 }]}>{row.territory}</Text>
                  <Text style={[styles.td, { width: 80 }]}>{row.checkIn}</Text>
                  <Text style={[styles.td, { width: 80 }]}>{row.checkOut}</Text>
                  <Text style={[styles.td, { width: 80 }]}>{row.duration}</Text>
                  <View style={{ width: 100, alignItems: 'center' }}>
                     <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg, borderColor: statusStyle.border }]}>
                        <Text style={[styles.statusText, { color: statusStyle.text }]}>{row.visitStatus}</Text>
                     </View>
                  </View>
                  <TouchableOpacity style={{ width: 60, alignItems: 'center', paddingVertical: 4 }} onPress={() => setViewDetails(row)}>
                     <Ionicons name="eye-outline" size={18} color="#64748B" />
                  </TouchableOpacity>
                </View>
              )})}
            </View>
          </ScrollView>
        </View>

      </ScrollView>

      {/* ── View Details Modal ── */}
      <Modal visible={viewDetails !== null} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { width: '85%', maxWidth: 400 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Visit Details</Text>
              <TouchableOpacity onPress={() => setViewDetails(null)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            <View style={{ padding: 20 }}>
              {viewDetails && (
                <>
                  <View style={styles.viewRow}><Text style={styles.viewLabel}>RSM Name:</Text><Text style={[styles.viewValue, { fontWeight: 'bold' }]}>{viewDetails.rsmName}</Text></View>
                  <View style={styles.viewRow}><Text style={styles.viewLabel}>Visit Date:</Text><Text style={styles.viewValue}>{viewDetails.date}</Text></View>
                  <View style={styles.viewRow}><Text style={styles.viewLabel}>State / Territory:</Text><Text style={styles.viewValue}>{viewDetails.state} - {viewDetails.territory}</Text></View>
                  <View style={styles.viewRow}><Text style={styles.viewLabel}>Visit Type:</Text><Text style={styles.viewValue}>{viewDetails.visitType}</Text></View>
                  <View style={styles.viewRow}><Text style={styles.viewLabel}>Target / Doctor:</Text><Text style={[styles.viewValue, { color: '#1E3A8A', fontWeight: '500' }]}>{viewDetails.doctorChemist}</Text></View>
                  <View style={styles.viewRow}><Text style={styles.viewLabel}>Check-In:</Text><Text style={styles.viewValue}>{viewDetails.checkIn}</Text></View>
                  <View style={styles.viewRow}><Text style={styles.viewLabel}>Check-Out:</Text><Text style={styles.viewValue}>{viewDetails.checkOut}</Text></View>
                  <View style={styles.viewRow}><Text style={styles.viewLabel}>Duration:</Text><Text style={styles.viewValue}>{viewDetails.duration}</Text></View>
                  <View style={styles.viewRow}>
                     <Text style={styles.viewLabel}>Visit Status:</Text>
                     <View style={[styles.statusBadge, { backgroundColor: getStatusStyle(viewDetails.visitStatus).bg, borderColor: getStatusStyle(viewDetails.visitStatus).border }]}>
                        <Text style={[styles.statusText, { color: getStatusStyle(viewDetails.visitStatus).text }]}>{viewDetails.visitStatus}</Text>
                     </View>
                  </View>
                </>
              )}
            </View>
            <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: '#E2E8F0', alignItems: 'center' }}>
              <TouchableOpacity style={styles.btnSolidPrimary} onPress={() => setViewDetails(null)}>
                <Text style={styles.btnSolidPrimaryText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Dropdown Modal ── */}
      <Modal visible={dropdownTarget !== null} transparent animationType="fade">
        <TouchableOpacity style={[styles.modalOverlay, { backgroundColor: 'transparent' }]} activeOpacity={1} onPress={() => setDropdownTarget(null)}>
          <View style={[
            styles.dropdownModalCard, 
            { position: 'absolute', paddingVertical: 8, elevation: 5, shadowOpacity: 0.1, shadowRadius: 10 },
            dropdownTarget === 'period' ? { top: 160, left: 16, width: 160 } :
            dropdownTarget === 'state' ? { top: 160, left: 180, width: 200 } :
            { top: 250, alignSelf: 'center', width: 200 }
          ]}>
            <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
              {getDropdownOptions().map((opt) => (
                <TouchableOpacity 
                  key={opt} 
                  style={{ paddingVertical: 10, paddingHorizontal: 16, backgroundColor: '#FFF' }} 
                  onPress={() => handleDropdownSelect(opt)}
                >
                  <Text style={{ fontSize: 13, color: '#334155' }}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

    </SafeAreaView>
  );
};

export default NSMTeamVisitsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { padding: 16 },

  filterSection: { marginBottom: 20, gap: 10 },
  dropdownsRow: { flexDirection: 'row', gap: 10, paddingBottom: 6 },
  pickerBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8, minWidth: 120 },
  pickerText: { fontSize: 13, color: '#475569', fontWeight: '500', marginRight: 8 },
  
  searchExportRow: { flexDirection: 'row', gap: 10 },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, gap: 8 },
  searchInput: { flex: 1, fontSize: 13, color: '#0F172A', padding: 0 },
  exportBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, gap: 6 },
  exportBtnText: { fontSize: 13, color: '#475569', fontWeight: '500' },

  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingBottom: 16 },
  summaryCard: { backgroundColor: '#FFF', width: '48%', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 12 },
  iconCircleBlue: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#DBEAFE', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  iconCircleGreen: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#DCFCE7', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  iconCircleYellow: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#FEF3C7', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  iconCirclePurple: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F3E8FF', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  summaryLabel: { fontSize: 11, color: '#64748B', fontWeight: '600', marginBottom: 6 },
  summaryValue: { fontSize: 18, fontWeight: 'bold', color: '#0F172A' },

  card: { backgroundColor: '#FFF', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 5, shadowOffset: {width: 0, height: 2}, elevation: 1 },
  tableHeader: { flexDirection: 'row', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', backgroundColor: '#FFF' },
  th: { fontSize: 10, fontWeight: 'bold', color: '#64748B' },
  tableRow: { flexDirection: 'row', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', alignItems: 'center' },
  td: { fontSize: 12, color: '#334155' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, borderWidth: 1 },
  statusText: { fontSize: 10, fontWeight: 'bold' },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.5)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { backgroundColor: '#FFF', width: '90%', maxWidth: 320, paddingBottom: 10, borderRadius: 12 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  modalTitle: { fontSize: 15, fontWeight: 'bold', color: '#0F172A' },
  viewRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  viewLabel: { fontSize: 13, color: '#64748B', fontWeight: '600' },
  viewValue: { fontSize: 14, color: '#0F172A' },
  btnSolidPrimary: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E3A8A', paddingVertical: 10, paddingHorizontal: 24, borderRadius: 6 },
  btnSolidPrimaryText: { color: '#FFF', fontWeight: '600', fontSize: 13 },

  dropdownModalCard: { backgroundColor: '#FFF', width: '80%', maxWidth: 300, borderRadius: 12, overflow: 'hidden' },
  dropdownHeader: { backgroundColor: '#F8FAFC', paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  dropdownTitle: { fontSize: 13, fontWeight: 'bold', color: '#0F172A' },
  dropdownOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  dropdownOptionText: { fontSize: 13, color: '#334155' },
  dropdownOptionTextSelected: { color: '#4F46E5', fontWeight: 'bold' },
});
