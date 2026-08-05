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
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

const NSMStatePerformanceScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewDetails, setViewDetails] = useState<any>(null);
  
  // Filter States
  const [filterPeriod, setFilterPeriod] = useState('Annual');
  const [filterState, setFilterState] = useState('All States');
  const [dropdownTarget, setDropdownTarget] = useState<'period' | 'state' | null>(null);

  const statePerformanceData = [
    { id: '1', state: 'Maharashtra', rsm: 'Arun Kumar', target: '₹15.00 Cr', achieved: '₹13.50 Cr', achvPct: '90.0%', orders: '4,520', drVisits: '12,500', attdPct: '92%', status: 'Good' },
    { id: '2', state: 'Gujarat', rsm: 'Rajesh Singh', target: '₹12.00 Cr', achieved: '₹9.50 Cr', achvPct: '79.2%', orders: '3,100', drVisits: '9,800', attdPct: '88%', status: 'Average' },
    { id: '3', state: 'Karnataka', rsm: 'Priya Sharma', target: '₹18.00 Cr', achieved: '₹19.50 Cr', achvPct: '108.3%', orders: '5,800', drVisits: '15,200', attdPct: '95%', status: 'Excellent' },
    { id: '4', state: 'Tamil Nadu', rsm: 'Vikram Das', target: '₹10.00 Cr', achieved: '₹4.50 Cr', achvPct: '45.0%', orders: '1,200', drVisits: '5,100', attdPct: '78%', status: 'Needs Attention' },
  ];

  const handleExport = () => {
    const headers = ['State', 'Assigned RSM', 'State Target (Cr)', 'Achievement (Cr)', 'Achievement %', 'Orders Booked', 'Doctor Visits', 'Attendance %', 'Status'];
    const csvRows = [headers.join(',')];

    filteredData.forEach(row => {
      const values = [
        row.state,
        row.rsm,
        row.target.replace(/[^\d.]/g, ''),
        row.achieved.replace(/[^\d.]/g, ''),
        row.achvPct.replace('%', ''),
        row.orders.replace(/,/g, ''),
        row.drVisits.replace(/,/g, ''),
        row.attdPct.replace('%', ''),
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
      link.setAttribute('download', 'State_Performance_Report.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      Alert.alert('Export Successful', 'The report data has been generated.');
    }
  };

  const getStatusStyle = (status: string) => {
    switch(status) {
      case 'Excellent': return { bg: '#DCFCE7', text: '#15803D', border: '#bbf7d0' };
      case 'Good': return { bg: '#F1F5F9', text: '#334155', border: '#cbd5e1' };
      case 'Average': return { bg: '#FEF3C7', text: '#D97706', border: '#fde68a' };
      case 'Needs Attention': return { bg: '#FEE2E2', text: '#DC2626', border: '#fecaca' };
      default: return { bg: '#F1F5F9', text: '#334155', border: '#cbd5e1' };
    }
  };

  const getBarColor = (val: number) => {
    if (val >= 100) return '#10B981';
    if (val >= 80) return '#3B82F6';
    if (val >= 60) return '#F59E0B';
    return '#DC2626';
  };

  const trendData = {
    labels: ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
    datasets: [{ data: [4.2, 5.5, 4.8, 6.1, 5.9, 7.6] }]
  };

  const periodOptions = ['Annual', 'Quarterly', 'Monthly'];
  const stateOptions = [
    'All States', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Delhi', 'Goa', 'Gujarat',
    'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra',
    'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
  ];

  const filteredData = statePerformanceData.filter(row => {
    const matchesSearch = row.state.toLowerCase().includes(searchQuery.toLowerCase()) || row.rsm.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesState = filterState === 'All States' || row.state === filterState;
    return matchesSearch && matchesState;
  });

  // Dynamic Summary Stats Calculations
  const parseCr = (val: string) => parseFloat(val.replace(/[^\d.]/g, '')) || 0;
  const parsePct = (val: string) => parseFloat(val.replace('%', '')) || 0;

  const totalStates = statePerformanceData.length;
  
  const topStateRow = statePerformanceData.reduce((prev, current) => 
    parsePct(prev.achvPct) > parsePct(current.achvPct) ? prev : current
  );

  const totalTarget = statePerformanceData.reduce((sum, row) => sum + parseCr(row.target), 0);
  const totalAchieved = statePerformanceData.reduce((sum, row) => sum + parseCr(row.achieved), 0);
  const overallAchvPct = totalTarget > 0 ? ((totalAchieved / totalTarget) * 100).toFixed(1) : '0.0';

  const totalAttd = statePerformanceData.reduce((sum, row) => sum + parsePct(row.attdPct), 0);
  const avgAttdPct = totalStates > 0 ? (totalAttd / totalStates).toFixed(1) : '0.0';

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
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>State Performance Analytics</Text>
          <Text style={styles.subtitle}>Executive dashboard for state-level business intelligence.</Text>
        </View>

        {/* Filters */}
        <View style={styles.filterSection}>
           <View style={styles.dropdownsRow}>
              <TouchableOpacity style={styles.pickerBox} onPress={() => setDropdownTarget('period')}>
                <Text style={styles.pickerText}>{filterPeriod}</Text>
                <Ionicons name="chevron-down" size={14} color="#64748B" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.pickerBox} onPress={() => setDropdownTarget('state')}>
                <Text style={styles.pickerText}>{filterState}</Text>
                <Ionicons name="chevron-down" size={14} color="#64748B" />
              </TouchableOpacity>
           </View>
           
           <View style={styles.searchExportRow}>
              <View style={styles.searchBox}>
                <Ionicons name="search" size={16} color="#94A3B8" />
                <TextInput 
                  placeholder="Search State or RSM..." 
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
            <View style={styles.iconCircleBlue}><Ionicons name="location-outline" size={18} color="#1E3A8A" /></View>
            <Text style={styles.summaryLabel}>Total States Covered</Text>
            <Text style={styles.summaryValue}>{totalStates}</Text>
          </View>
          
          <View style={styles.summaryCard}>
            <View style={styles.iconCircleGreen}><Ionicons name="trending-up" size={18} color="#15803D" /></View>
            <Text style={styles.summaryLabel}>Top Performing State</Text>
            <Text style={styles.summaryValue}>{topStateRow.state}</Text>
            <Text style={styles.summarySubtext}>{topStateRow.achvPct} Achieved</Text>
          </View>

          <View style={styles.summaryCard}>
            <View style={styles.iconCircleBlue}><Ionicons name="disc-outline" size={18} color="#1E3A8A" /></View>
            <Text style={styles.summaryLabel}>Overall Achievement %</Text>
            <Text style={styles.summaryValue}>{overallAchvPct}%</Text>
            <Text style={styles.summarySubtext}>₹{totalAchieved.toFixed(2)}Cr / ₹{totalTarget.toFixed(2)}Cr</Text>
          </View>

          <View style={styles.summaryCard}>
            <View style={styles.iconCirclePurple}><Ionicons name="people-outline" size={18} color="#7E22CE" /></View>
            <Text style={styles.summaryLabel}>Avg Team Attendance %</Text>
            <Text style={styles.summaryValue}>{avgAttdPct}%</Text>
            <Text style={styles.summarySubtext}>All reporting employees</Text>
          </View>
        </View>

        {/* Main Table */}
        <View style={styles.card}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ minWidth: 900 }}>
              <View style={styles.tableHeader}>
                <Text style={[styles.th, { width: 100 }]}>STATE</Text>
                <Text style={[styles.th, { width: 110 }]}>ASSIGNED RSM</Text>
                <Text style={[styles.th, { width: 100 }]}>STATE TARGET</Text>
                <Text style={[styles.th, { width: 100 }]}>ACHIEVEMENT</Text>
                <Text style={[styles.th, { width: 70 }]}>ACHV %</Text>
                <Text style={[styles.th, { width: 80 }]}>ORDERS</Text>
                <Text style={[styles.th, { width: 90 }]}>DR. VISITS</Text>
                <Text style={[styles.th, { width: 70 }]}>ATTD %</Text>
                <Text style={[styles.th, { width: 110, textAlign: 'center' }]}>STATUS</Text>
                <Text style={[styles.th, { width: 60, textAlign: 'center' }]}>ACTION</Text>
              </View>

              {filteredData.map((row) => {
                const statusStyle = getStatusStyle(row.status);
                return (
                <View key={row.id} style={styles.tableRow}>
                  <Text style={[styles.td, { width: 100, fontWeight: 'bold' }]}>{row.state}</Text>
                  <Text style={[styles.td, { width: 110 }]}>{row.rsm}</Text>
                  <Text style={[styles.td, { width: 100 }]}>{row.target}</Text>
                  <Text style={[styles.td, { width: 100, color: '#059669', fontWeight: 'bold' }]}>{row.achieved}</Text>
                  <Text style={[styles.td, { width: 70 }]}>{row.achvPct}</Text>
                  <Text style={[styles.td, { width: 80 }]}>{row.orders}</Text>
                  <Text style={[styles.td, { width: 90 }]}>{row.drVisits}</Text>
                  <Text style={[styles.td, { width: 70 }]}>{row.attdPct}</Text>
                  <View style={{ width: 110, alignItems: 'center' }}>
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

        {/* Charts Section */}
        <View style={styles.chartsGrid}>
          
          {/* Achievement % by State (Horizontal Bar Chart) */}
          <View style={styles.chartCard}>
             <View style={styles.chartHeader}>
               <Ionicons name="pulse" size={18} color="#0F172A" />
               <Text style={styles.chartTitle}>Achievement % by State</Text>
             </View>
             
             <View style={styles.chartBody}>
                {filteredData.map((item, idx) => {
                  const val = parseFloat(item.achvPct.replace('%', ''));
                  return (
                  <View key={idx} style={styles.barRow}>
                     <Text style={styles.barLabel}>{item.state}</Text>
                     <View style={styles.barTrack}>
                        <View style={[styles.barFill, { width: `${Math.min(val, 100)}%`, backgroundColor: getBarColor(val) }]} />
                     </View>
                  </View>
                )})}
                
                {/* X Axis Labels */}
                <View style={styles.xAxis}>
                   <Text style={styles.axisText}>0</Text>
                   <Text style={styles.axisText}>35</Text>
                   <Text style={styles.axisText}>70</Text>
                   <Text style={styles.axisText}>105</Text>
                   <Text style={styles.axisText}>128.3</Text>
                </View>
             </View>
          </View>

          {/* Monthly Sales Trend (Curved Line Chart) */}
          <View style={styles.chartCard}>
             <View style={styles.chartHeader}>
               <Ionicons name="trending-up" size={18} color="#0F172A" />
               <Text style={styles.chartTitle}>Monthly Sales Trend (National)</Text>
             </View>
             
             <View style={{ alignItems: 'center', marginTop: 10 }}>
                <LineChart
                  data={trendData}
                  width={screenWidth < 700 ? screenWidth - 80 : 350} // Responsive width
                  height={220}
                  chartConfig={{
                    backgroundColor: '#FFF',
                    backgroundGradientFrom: '#FFF',
                    backgroundGradientTo: '#FFF',
                    decimalPlaces: 1,
                    color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
                    style: { borderRadius: 16 },
                    propsForDots: { r: "4", strokeWidth: "2", stroke: "#10B981" }
                  }}
                  bezier
                  style={{ marginVertical: 8, borderRadius: 16 }}
                />
             </View>
          </View>

        </View>
      </ScrollView>

      {/* ── View Details Modal ── */}
      <Modal visible={viewDetails !== null} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { width: '85%', maxWidth: 400 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{viewDetails?.state} - Performance Details</Text>
              <TouchableOpacity onPress={() => setViewDetails(null)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            <View style={{ padding: 20 }}>
              {viewDetails && (
                <>
                  <View style={styles.viewRow}><Text style={styles.viewLabel}>Assigned RSM:</Text><Text style={styles.viewValue}>{viewDetails.rsm}</Text></View>
                  <View style={styles.viewRow}><Text style={styles.viewLabel}>State Target:</Text><Text style={styles.viewValue}>{viewDetails.target}</Text></View>
                  <View style={styles.viewRow}><Text style={styles.viewLabel}>Achieved:</Text><Text style={[styles.viewValue, { color: '#15803D', fontWeight: 'bold' }]}>{viewDetails.achieved}</Text></View>
                  <View style={styles.viewRow}><Text style={styles.viewLabel}>Achievement %:</Text><Text style={styles.viewValue}>{viewDetails.achvPct}</Text></View>
                  <View style={styles.viewRow}><Text style={styles.viewLabel}>Orders Booked:</Text><Text style={styles.viewValue}>{viewDetails.orders}</Text></View>
                  <View style={styles.viewRow}><Text style={styles.viewLabel}>Doctor Visits:</Text><Text style={styles.viewValue}>{viewDetails.drVisits}</Text></View>
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
            dropdownTarget === 'period' ? { top: 160, left: 16, width: 150 } :
            dropdownTarget === 'state' ? { top: 160, left: 176, width: 200 } :
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

export default NSMStatePerformanceScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { padding: 16 },
  header: { marginBottom: 16 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#0F172A' },
  subtitle: { fontSize: 12, color: '#64748B', marginTop: 4 },

  filterSection: { marginBottom: 20, gap: 10 },
  dropdownsRow: { flexDirection: 'row', gap: 10 },
  pickerBox: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8 },
  pickerText: { fontSize: 13, color: '#475569', fontWeight: '500' },
  
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
  iconCircleOrange: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#FEF3C7', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
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

  // Charts Layout
  chartsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginTop: 16 },
  chartCard: { flex: 1, minWidth: 300, backgroundColor: '#FFF', padding: 20, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 5, shadowOffset: {width: 0, height: 2}, elevation: 1 },
  chartHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 24 },
  chartTitle: { fontSize: 15, fontWeight: 'bold', color: '#0F172A' },
  
  // Horizontal Bar Chart
  chartBody: { paddingRight: 10 },
  barRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  barLabel: { width: 80, fontSize: 11, color: '#475569', textAlign: 'right', paddingRight: 12 },
  barTrack: { flex: 1 },
  barFill: { height: 16, borderRadius: 4 },
  xAxis: { flexDirection: 'row', justifyContent: 'space-between', marginLeft: 80, marginTop: 10, borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 8 },
  
  // Vertical Column Chart
  chartBodyTrend: { flexDirection: 'row', height: 200 },
  yAxis: { justifyContent: 'space-between', paddingRight: 12, borderRightWidth: 1, borderRightColor: '#E2E8F0' },
  axisText: { fontSize: 10, color: '#94A3B8' },
  trendBarsContainer: { flex: 1, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', paddingBottom: 24, paddingLeft: 10 },
  trendCol: { alignItems: 'center', width: 30 },
  trendTrack: { height: 160, width: '100%', justifyContent: 'flex-end' },
  trendFill: { width: 12, backgroundColor: '#10B981', borderRadius: 4, alignSelf: 'center' },
  trendAxisLabel: { fontSize: 10, color: '#64748B', position: 'absolute', bottom: -20 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.5)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { backgroundColor: '#FFF', width: '90%', maxWidth: 320, paddingBottom: 10, borderRadius: 12 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  modalTitle: { fontSize: 15, fontWeight: 'bold', color: '#0F172A' },
  viewRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  viewLabel: { fontSize: 13, color: '#64748B', fontWeight: '600' },
  viewValue: { fontSize: 14, color: '#0F172A' },
  btnSolidPrimary: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E3A8A', paddingVertical: 10, paddingHorizontal: 24, borderRadius: 6 },
  btnSolidPrimaryText: { color: '#FFF', fontWeight: '600', fontSize: 13 },

  // Custom Dropdown Modal Styles
  dropdownModalCard: { backgroundColor: '#FFF', width: '80%', maxWidth: 300, borderRadius: 12, overflow: 'hidden' },
  dropdownHeader: { backgroundColor: '#F8FAFC', paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  dropdownTitle: { fontSize: 13, fontWeight: 'bold', color: '#0F172A' },
  dropdownOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  dropdownOptionText: { fontSize: 13, color: '#334155' },
  dropdownOptionTextSelected: { color: '#4F46E5', fontWeight: 'bold' },

});