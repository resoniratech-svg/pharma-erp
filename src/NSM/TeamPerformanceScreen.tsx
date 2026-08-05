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

const NSMTeamPerformanceScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewDetails, setViewDetails] = useState<any>(null);

  // Filter States
  const [filterTarget, setFilterTarget] = useState('Annual Target');
  const [filterRegion, setFilterRegion] = useState('All Regions');
  const [filterState, setFilterState] = useState('All States');
  const [dropdownTarget, setDropdownTarget] = useState<'target' | 'region' | 'state' | null>(null);

  const teamPerformanceData = [
    { id: '1', empCode: 'RSM001', empName: 'Arun Kumar', state: 'Maharashtra', target: '₹15.00 Cr', achieved: '₹13.50 Cr', achvPct: '90.0%', teamStrength: '53 Members', attdPct: '92%', orders: '4,520', status: 'Good' },
    { id: '2', empCode: 'RSM002', empName: 'Rajesh Singh', state: 'Gujarat', target: '₹12.00 Cr', achieved: '₹9.50 Cr', achvPct: '79.2%', teamStrength: '41 Members', attdPct: '88%', orders: '3,100', status: 'Average' },
    { id: '3', empCode: 'RSM003', empName: 'Priya Sharma', state: 'Karnataka', target: '₹18.00 Cr', achieved: '₹19.50 Cr', achvPct: '108.3%', teamStrength: '65 Members', attdPct: '95%', orders: '5,800', status: 'Excellent' },
    { id: '4', empCode: 'RSM004', empName: 'Vikram Das', state: 'Tamil Nadu', target: '₹10.00 Cr', achieved: '₹4.50 Cr', achvPct: '45.0%', teamStrength: '30 Members', attdPct: '78%', orders: '1,200', status: 'Needs Attention' },
  ];

  const targetOptions = ['Monthly Target', 'Quarterly Target', 'Annual Target'];
  const regionOptions = ['All Regions', 'North Zone', 'South Zone', 'East Zone', 'West Zone'];
  const stateOptions = [
    'All States', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Delhi', 'Goa', 'Gujarat',
    'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra',
    'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
  ];

  const filteredData = teamPerformanceData.filter(row => {
    const matchesSearch = row.empName.toLowerCase().includes(searchQuery.toLowerCase()) || row.empCode.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesState = filterState === 'All States' || row.state === filterState;
    return matchesSearch && matchesState;
  });

  const getStatusStyle = (status: string) => {
    switch(status) {
      case 'Excellent': return { bg: '#DCFCE7', text: '#15803D', border: '#bbf7d0' };
      case 'Good': return { bg: '#F1F5F9', text: '#334155', border: '#cbd5e1' };
      case 'Average': return { bg: '#FEF3C7', text: '#D97706', border: '#fde68a' };
      case 'Needs Attention': return { bg: '#FEE2E2', text: '#DC2626', border: '#fecaca' };
      default: return { bg: '#F1F5F9', text: '#334155', border: '#cbd5e1' };
    }
  };

  const handleExport = () => {
    const headers = ['Employee Code', 'RSM Name', 'State', 'Assigned Target (Cr)', 'Achievement (Cr)', 'Achievement %', 'Team Strength', 'Attendance %', 'Orders', 'Status'];
    const csvRows = [headers.join(',')];

    filteredData.forEach(row => {
      const values = [
        row.empCode,
        row.empName,
        row.state,
        row.target.replace(/[^\d.]/g, ''),
        row.achieved.replace(/[^\d.]/g, ''),
        row.achvPct.replace('%', ''),
        row.teamStrength.replace(/[^\d]/g, ''),
        row.attdPct.replace('%', ''),
        row.orders.replace(/,/g, ''),
        row.status
      ];
      csvRows.push(values.map(v => `"${v}"`).join(','));
    });

    const csvString = csvRows.join('\n');

    if (Platform.OS === 'web') {
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'Team_Performance_Report.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      Alert.alert('Export Successful', 'The report data has been generated.');
    }
  };

  // Dynamic Summary Stats Calculations
  const parseCr = (val: string) => parseFloat(val.replace(/[^\d.]/g, '')) || 0;
  const parsePct = (val: string) => parseFloat(val.replace('%', '')) || 0;
  const parseMembers = (val: string) => parseInt(val.replace(/[^\d]/g, '')) || 0;

  const activeRSMs = filteredData.length;
  
  const totalFieldForce = filteredData.reduce((sum, row) => sum + parseMembers(row.teamStrength), 0);
  
  let topRsmRow = filteredData[0];
  if (filteredData.length > 0) {
    topRsmRow = filteredData.reduce((prev, current) => 
      parsePct(prev.achvPct) > parsePct(current.achvPct) ? prev : current
    );
  }

  const totalTarget = filteredData.reduce((sum, row) => sum + parseCr(row.target), 0);
  const totalAchieved = filteredData.reduce((sum, row) => sum + parseCr(row.achieved), 0);
  const overallAchvPct = totalTarget > 0 ? ((totalAchieved / totalTarget) * 100).toFixed(1) : '0.0';

  const getDropdownOptions = () => {
    if (dropdownTarget === 'target') return targetOptions;
    if (dropdownTarget === 'region') return regionOptions;
    if (dropdownTarget === 'state') return stateOptions;
    return [];
  };

  const handleDropdownSelect = (opt: string) => {
    if (dropdownTarget === 'target') setFilterTarget(opt);
    if (dropdownTarget === 'region') setFilterRegion(opt);
    if (dropdownTarget === 'state') setFilterState(opt);
    setDropdownTarget(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Filters */}
        <View style={styles.filterSection}>
           <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dropdownsRow}>
              <TouchableOpacity style={styles.pickerBox} onPress={() => setDropdownTarget('target')}>
                <Text style={styles.pickerText}>{filterTarget}</Text>
                <Ionicons name="chevron-down" size={14} color="#64748B" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.pickerBox} onPress={() => setDropdownTarget('region')}>
                <Text style={styles.pickerText}>{filterRegion}</Text>
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
                  placeholder="Search RSM Name or Code..." 
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
            <View style={styles.iconCirclePurple}><Ionicons name="shield-checkmark-outline" size={18} color="#7E22CE" /></View>
            <Text style={styles.summaryLabel}>Active RSMs</Text>
            <Text style={styles.summaryValue}>{activeRSMs}</Text>
          </View>
          
          <View style={styles.summaryCard}>
            <View style={styles.iconCircleBlue}><Ionicons name="people-outline" size={18} color="#1E3A8A" /></View>
            <Text style={styles.summaryLabel}>Total Field Force</Text>
            <Text style={styles.summaryValue}>{totalFieldForce}</Text>
            <Text style={styles.summarySubtext}>{activeRSMs} ASM | {totalFieldForce - activeRSMs} MR</Text>
          </View>

          <View style={styles.summaryCard}>
            <View style={styles.iconCircleGreen}><Ionicons name="trending-up" size={18} color="#15803D" /></View>
            <Text style={styles.summaryLabel}>Top Performing RSM</Text>
            <Text style={styles.summaryValue}>{topRsmRow?.empName || '--'}</Text>
            <Text style={styles.summarySubtext}>{topRsmRow?.achvPct || '0%'} Achieved</Text>
          </View>

          <View style={styles.summaryCard}>
            <View style={styles.iconCircleBlue}><Ionicons name="disc-outline" size={18} color="#1E3A8A" /></View>
            <Text style={styles.summaryLabel}>Overall Team Achievement</Text>
            <Text style={styles.summaryValue}>{overallAchvPct}%</Text>
            <Text style={styles.summarySubtext}>₹{totalAchieved.toFixed(2)}Cr / ₹{totalTarget.toFixed(2)}Cr</Text>
          </View>
        </View>

        {/* Main Table */}
        <View style={styles.card}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ minWidth: 1000 }}>
              <View style={styles.tableHeader}>
                <Text style={[styles.th, { width: 110 }]}>EMPLOYEE CODE</Text>
                <Text style={[styles.th, { width: 110 }]}>RSM NAME</Text>
                <Text style={[styles.th, { width: 90 }]}>STATE</Text>
                <Text style={[styles.th, { width: 110 }]}>ASSIGNED TARGET</Text>
                <Text style={[styles.th, { width: 100 }]}>ACHIEVEMENT</Text>
                <Text style={[styles.th, { width: 70 }]}>ACHV %</Text>
                <Text style={[styles.th, { width: 110 }]}>TEAM STRENGTH</Text>
                <Text style={[styles.th, { width: 70 }]}>ATTD %</Text>
                <Text style={[styles.th, { width: 70 }]}>ORDERS</Text>
                <Text style={[styles.th, { width: 100, textAlign: 'center' }]}>STATUS</Text>
                <Text style={[styles.th, { width: 60, textAlign: 'center' }]}>ACTION</Text>
              </View>

              {filteredData.map((row) => {
                const statusStyle = getStatusStyle(row.status);
                return (
                <View key={row.id} style={styles.tableRow}>
                  <Text style={[styles.td, { width: 110 }]}>{row.empCode}</Text>
                  <Text style={[styles.td, { width: 110, fontWeight: 'bold' }]}>{row.empName}</Text>
                  <Text style={[styles.td, { width: 90 }]}>{row.state}</Text>
                  <Text style={[styles.td, { width: 110 }]}>{row.target}</Text>
                  <Text style={[styles.td, { width: 100, color: '#059669', fontWeight: 'bold' }]}>{row.achieved}</Text>
                  <Text style={[styles.td, { width: 70 }]}>{row.achvPct}</Text>
                  <Text style={[styles.td, { width: 110 }]}>{row.teamStrength}</Text>
                  <Text style={[styles.td, { width: 70 }]}>{row.attdPct}</Text>
                  <Text style={[styles.td, { width: 70 }]}>{row.orders}</Text>
                  <View style={{ width: 100, alignItems: 'center' }}>
                     <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg, borderColor: statusStyle.border }]}>
                        <Text style={[styles.statusText, { color: statusStyle.text }]}>{row.status}</Text>
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
              <Text style={styles.modalTitle}>{viewDetails?.empName} - Details</Text>
              <TouchableOpacity onPress={() => setViewDetails(null)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            <View style={{ padding: 20 }}>
              {viewDetails && (
                <>
                  <View style={styles.viewRow}><Text style={styles.viewLabel}>Employee Code:</Text><Text style={styles.viewValue}>{viewDetails.empCode}</Text></View>
                  <View style={styles.viewRow}><Text style={styles.viewLabel}>State:</Text><Text style={styles.viewValue}>{viewDetails.state}</Text></View>
                  <View style={styles.viewRow}><Text style={styles.viewLabel}>Assigned Target:</Text><Text style={styles.viewValue}>{viewDetails.target}</Text></View>
                  <View style={styles.viewRow}><Text style={styles.viewLabel}>Achieved:</Text><Text style={[styles.viewValue, { color: '#15803D', fontWeight: 'bold' }]}>{viewDetails.achieved}</Text></View>
                  <View style={styles.viewRow}><Text style={styles.viewLabel}>Achievement %:</Text><Text style={styles.viewValue}>{viewDetails.achvPct}</Text></View>
                  <View style={styles.viewRow}><Text style={styles.viewLabel}>Team Strength:</Text><Text style={styles.viewValue}>{viewDetails.teamStrength}</Text></View>
                  <View style={styles.viewRow}><Text style={styles.viewLabel}>Doctor Visits:</Text><Text style={styles.viewValue}>{viewDetails.drVisits || 'N/A'}</Text></View>
                  <View style={styles.viewRow}><Text style={styles.viewLabel}>Attendance %:</Text><Text style={styles.viewValue}>{viewDetails.attdPct}</Text></View>
                  <View style={styles.viewRow}>
                     <Text style={styles.viewLabel}>Status:</Text>
                     <View style={[styles.statusBadge, { backgroundColor: getStatusStyle(viewDetails.status).bg, borderColor: getStatusStyle(viewDetails.status).border }]}>
                        <Text style={[styles.statusText, { color: getStatusStyle(viewDetails.status).text }]}>{viewDetails.status}</Text>
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
            dropdownTarget === 'target' ? { top: 160, left: 16, width: 160 } :
            dropdownTarget === 'region' ? { top: 160, left: 140, width: 140 } :
            dropdownTarget === 'state' ? { top: 160, left: 260, width: 180 } :
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

export default NSMTeamPerformanceScreen;

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
  iconCirclePurple: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F3E8FF', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  summaryLabel: { fontSize: 11, color: '#64748B', fontWeight: '600', marginBottom: 6 },
  summaryValue: { fontSize: 18, fontWeight: 'bold', color: '#0F172A' },
  summarySubtext: { fontSize: 10, color: '#94A3B8', marginTop: 4 },

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
