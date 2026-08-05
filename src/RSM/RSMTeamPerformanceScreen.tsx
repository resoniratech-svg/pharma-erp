import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, TextInput, Platform, Modal, Share, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const INITIAL_DATA = [
  { 
    id: '1', asmCode: 'EMP-ASM-001', asmName: 'Gaurav Kapoor', state: 'Maharashtra', 
    hq: 'Unassigned', assignedTarget: '₹0.00 L', achievement: '₹0.00 L', 
    achievementPct: '0.0%', attendancePct: '99%', docVisits: 113, 
    chemVisits: 152, ordersBooked: 47, teamStrength: '2 MRs', 
    trend: 'Stable', remarks: 'Needs improvement in target achievement.', status: 'Needs Attention' 
  },
  { 
    id: '2', asmCode: 'EMP-ASM-002', asmName: 'Manish Pandey', state: 'Maharashtra', 
    hq: 'Pune', assignedTarget: '₹0.00 L', achievement: '₹0.00 L', 
    achievementPct: '0.0%', attendancePct: '98%', docVisits: 105, 
    chemVisits: 140, ordersBooked: 42, teamStrength: '2 MRs', 
    trend: 'Stable', remarks: 'Needs attention on chemist visits.', status: 'Needs Attention' 
  },
];

const STATUSES = [
  'All Statuses', 'Good', 'Average', 'Needs Attention'
];

const RSMTeamPerformanceScreen = () => {
  const navigation = useNavigation<any>();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter Status
  const [filterStatus, setFilterStatus] = useState('All Statuses');
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  
  // Export Dropdown
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  
  // View Details Modal (Side Drawer Style)
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [viewModalData, setViewModalData] = useState<any>(null);

  // Computed Filtered Data
  const filteredData = useMemo(() => {
    return INITIAL_DATA.filter(item => {
      const matchesStatus = filterStatus === 'All Statuses' || item.status === filterStatus;
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        item.state.toLowerCase().includes(searchLower) || 
        item.asmName.toLowerCase().includes(searchLower) ||
        item.asmCode.toLowerCase().includes(searchLower);
      return matchesStatus && matchesSearch;
    });
  }, [searchQuery, filterStatus]);

  // Computed Dynamic Stats
  const stats = useMemo(() => {
    const activeAsms = filteredData.length;
    
    // Average Achievement
    const totalAchievement = filteredData.reduce((sum, item) => sum + parseFloat(item.achievementPct), 0);
    const avgAchievement = activeAsms > 0 ? (totalAchievement / activeAsms).toFixed(1) : '0.0';

    // Average Attendance
    const totalAttendance = filteredData.reduce((sum, item) => sum + parseFloat(item.attendancePct), 0);
    const avgAttendance = activeAsms > 0 ? (totalAttendance / activeAsms).toFixed(1) : '0.0';

    // Top Performing ASM (by most orders booked)
    let topAsm = 'N/A';
    let maxOrders = -1;
    filteredData.forEach(item => {
      if (item.ordersBooked > maxOrders) {
        maxOrders = item.ordersBooked;
        topAsm = item.asmName;
      }
    });

    return {
      activeAsms: activeAsms.toString(),
      avgAchievement: `${avgAchievement}%`,
      topAsm: topAsm,
      avgAttendance: `${avgAttendance}%`
    };
  }, [filteredData]);

  const SUMMARY_CARDS = [
    { title: 'Active ASMs', value: stats.activeAsms, icon: 'people-outline', color: '#3B82F6', bgColor: '#EFF6FF' },
    { title: 'Overall Achievement %', value: stats.avgAchievement, icon: 'locate-outline', color: '#8B5CF6', bgColor: '#F5F3FF' },
    { title: 'Top Performing ASM', value: stats.topAsm, icon: 'trophy-outline', color: '#10B981', bgColor: '#ECFDF5' },
    { title: 'Average Attendance %', value: stats.avgAttendance, icon: 'calendar-outline', color: '#F59E0B', bgColor: '#FEF3C7' },
  ];

  // Export Function - CSV
  const handleExportCSV = async () => {
    setIsExportMenuOpen(false);
    if (filteredData.length === 0) {
      Alert.alert('No Data', 'There is no data to export.');
      return;
    }
    
    const header = 'ASM CODE,ASM NAME,STATE,ASSIGNED TARGET,ACHIEVEMENT,ACHIEVEMENT %,TEAM STRENGTH,STATUS\n';
    const rows = filteredData.map(item => 
      `${item.asmCode},${item.asmName},${item.state},${item.assignedTarget},${item.achievement},${item.achievementPct},${item.teamStrength},${item.status}`
    ).join('\n');
    
    const csvContent = header + rows;

    if (Platform.OS === 'web') {
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'Team_Performance_Export.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      try {
        await Share.share({
          message: csvContent,
          title: 'Team_Performance_Export.csv'
        });
      } catch (error: any) {
        Alert.alert('Export Failed', error.message);
      }
    }
  };

  // Export Function - PDF
  const handleExportPDF = async () => {
    setIsExportMenuOpen(false);
    if (filteredData.length === 0) {
      Alert.alert('No Data', 'There is no data to export.');
      return;
    }

    try {
      if (Platform.OS === 'web') {
        const doc = new jsPDF();
        doc.text("Team Performance Report", 14, 15);
        
        const tableColumn = ["ASM CODE", "ASM NAME", "STATE", "TARGET", "ACHIEVEMENT", "ACHIEVEMENT %", "STATUS"];
        const tableRows: any[] = [];
        
        filteredData.forEach(item => {
          tableRows.push([
            item.asmCode,
            item.asmName,
            item.state,
            item.assignedTarget,
            item.achievement,
            item.achievementPct,
            item.status
          ]);
        });
        
        autoTable(doc, {
          head: [tableColumn],
          body: tableRows,
          startY: 20,
        });
        
        doc.save('Team_Performance_Export.pdf');
      } else {
        const htmlContent = `
          <html>
            <head>
              <style>
                body { font-family: Helvetica, Arial, sans-serif; padding: 20px; }
                h1 { color: #0F172A; text-align: center; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #E2E8F0; padding: 10px; text-align: left; font-size: 12px; }
                th { background-color: #F8FAFC; color: #475569; }
              </style>
            </head>
            <body>
              <h1>Team Performance Report</h1>
              <table>
                <tr>
                  <th>ASM CODE</th>
                  <th>ASM NAME</th>
                  <th>STATE</th>
                  <th>TARGET</th>
                  <th>ACHIEVEMENT</th>
                  <th>ACHIEVEMENT %</th>
                  <th>STATUS</th>
                </tr>
                ${filteredData.map(item => `
                  <tr>
                    <td>${item.asmCode}</td>
                    <td>${item.asmName}</td>
                    <td>${item.state}</td>
                    <td>${item.assignedTarget}</td>
                    <td>${item.achievement}</td>
                    <td>${item.achievementPct}</td>
                    <td style="color: ${getStatusColor(item.status)}">${item.status}</td>
                  </tr>
                `).join('')}
              </table>
            </body>
          </html>
        `;
        const { uri } = await Print.printToFileAsync({ html: htmlContent });
        await Sharing.shareAsync(uri);
      }
    } catch (error: any) {
      Alert.alert('Export Failed', error.message);
    }
  };

  const getStatusColor = (status: string) => {
    if (status === 'Achieved') return '#16A34A';
    if (status === 'On Track') return '#D97706';
    return '#DC2626'; // Needs Attention
  };
  
  const getStatusBg = (status: string) => {
    if (status === 'Achieved') return '#DCFCE7';
    if (status === 'On Track') return '#FEF3C7';
    return '#FEE2E2'; // Needs Attention
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.navigate('RSMDashboard')} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#0F172A" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Team Performance</Text>
            <Text style={styles.subtitle} numberOfLines={2}>Monitor the performance of your Area Sales Managers.</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.exportBtn} onPress={() => setIsExportMenuOpen(true)}>
          <Ionicons name="download-outline" size={16} color="#475569" />
          <Text style={styles.exportBtnText}>Export</Text>
          <Ionicons name="chevron-down" size={14} color="#475569" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* 2x2 Summary Cards Grid */}
        <View style={styles.cardsGrid}>
          {SUMMARY_CARDS.map((card, index) => (
            <View key={index} style={styles.cardContainer}>
              <View style={[styles.iconCircle, { backgroundColor: card.bgColor }]}>
                <Ionicons name={card.icon as any} size={20} color={card.color} />
              </View>
              <Text style={styles.cardTitle}>{card.title}</Text>
              <Text style={styles.cardValue} numberOfLines={1} adjustsFontSizeToFit>{card.value}</Text>
            </View>
          ))}
        </View>

        {/* Filters Section */}
        <View style={styles.filtersContainer}>
          <TouchableOpacity style={styles.dropdown} onPress={() => setIsStatusDropdownOpen(true)}>
            <Text style={styles.dropdownText}>{filterStatus === 'All Statuses' ? 'All' : filterStatus}</Text>
            <Ionicons name="chevron-down" size={16} color="#64748B" />
          </TouchableOpacity>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color="#94A3B8" />
            <TextInput
              style={[styles.searchInput, Platform.OS === 'web' && { outlineStyle: 'none' } as any]}
              placeholder="Search ASM Code, Name, or HQ..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#94A3B8"
            />
          </View>
        </View>

        {/* Data Table */}
        <View style={styles.tableCard}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ minWidth: 900 }}>
              {/* Table Header */}
              <View style={styles.tableHeader}>
                <Text style={[styles.th, { width: 120 }]}>ASM CODE</Text>
                <Text style={[styles.th, { width: 150 }]}>ASM NAME</Text>
                <Text style={[styles.th, { width: 120 }]}>STATE</Text>
                <Text style={[styles.th, { width: 140 }]}>ASSIGNED TARGET</Text>
                <Text style={[styles.th, { width: 120 }]}>ACHIEVEMENT</Text>
                <Text style={[styles.th, { width: 130 }]}>ACHIEVEMENT %</Text>
                <Text style={[styles.th, { width: 130 }]}>TEAM STRENGTH</Text>
                <Text style={[styles.th, { width: 120, textAlign: 'center' }]}>STATUS</Text>
                <Text style={[styles.th, { width: 80, textAlign: 'center' }]}>ACTION</Text>
              </View>

              {/* Table Rows */}
              {filteredData.length === 0 ? (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <Text style={{ color: '#64748B' }}>No results found.</Text>
                </View>
              ) : (
                filteredData.map((item, index) => (
                  <View key={item.id} style={[styles.tableRow, index === filteredData.length - 1 && { borderBottomWidth: 0 }]}>
                    <Text style={[styles.td, { width: 120, color: '#475569' }]}>{item.asmCode}</Text>
                    <Text style={[styles.td, { width: 150, color: '#1E293B', fontWeight: '500' }]}>{item.asmName}</Text>
                    <Text style={[styles.td, { width: 120, color: '#475569' }]}>{item.state}</Text>
                    <Text style={[styles.td, { width: 140, color: '#475569' }]}>{item.assignedTarget}</Text>
                    <Text style={[styles.td, { width: 120, color: '#475569' }]}>{item.achievement}</Text>
                    <Text style={[styles.td, { width: 130, color: '#DC2626', fontWeight: '600' }]}>{item.achievementPct}</Text>
                    <Text style={[styles.td, { width: 130, color: '#475569' }]}>{item.teamStrength}</Text>
                    
                    <View style={{ width: 120, alignItems: 'center' }}>
                      <View style={[styles.statusPill, { backgroundColor: getStatusBg(item.status) }]}>
                        <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
                      </View>
                    </View>
                    
                    <View style={{ width: 80, alignItems: 'center' }}>
                      <TouchableOpacity 
                        onPress={() => { setViewModalData(item); setIsViewModalVisible(true); }}
                      >
                        <Ionicons name="eye-outline" size={18} color="#94A3B8" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </View>
          </ScrollView>
        </View>

      </ScrollView>

      {/* ── Status Dropdown Modal ── */}
      <Modal visible={isStatusDropdownOpen} transparent animationType="fade">
        <TouchableOpacity style={[styles.modalOverlay, { backgroundColor: 'transparent' }]} activeOpacity={1} onPress={() => setIsStatusDropdownOpen(false)}>
          <View style={[styles.dropdownModalCard, { position: 'absolute', top: 230, left: 16, maxWidth: 180, paddingVertical: 8, elevation: 5, shadowOpacity: 0.1, shadowRadius: 10 }]}>
            {STATUSES.map((opt) => (
              <TouchableOpacity 
                key={opt} 
                style={{ paddingVertical: 10, paddingHorizontal: 16, backgroundColor: filterStatus === opt ? '#F8FAFC' : '#FFF' }} 
                onPress={() => {
                  setFilterStatus(opt);
                  setIsStatusDropdownOpen(false);
                }}
              >
                <Text style={[{ fontSize: 13, color: '#334155' }, filterStatus === opt && { color: '#0F172A', fontWeight: '600' }]}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Export Dropdown Modal ── */}
      <Modal visible={isExportMenuOpen} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setIsExportMenuOpen(false)}>
          <View style={[styles.dropdownModalCard, { position: 'absolute', top: 70, right: 16, maxWidth: 200 }]}>
            <TouchableOpacity style={styles.dropdownOptionBtn} onPress={handleExportCSV}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16 }}>
                <Ionicons name="document-text-outline" size={18} color="#059669" />
                <Text style={styles.dropdownOptionText}>Export as CSV</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dropdownOptionBtn} onPress={handleExportPDF}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16 }}>
                <Ionicons name="document-outline" size={18} color="#DC2626" />
                <Text style={styles.dropdownOptionText}>Export as PDF</Text>
              </View>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── View Row Details Side Drawer Modal ── */}
      <Modal visible={isViewModalVisible} animationType="slide" transparent={true}>
        <View style={styles.drawerOverlay}>
          <View style={styles.drawerCard}>
             <View style={styles.drawerHeader}>
              <Text style={styles.drawerTitle}>ASM Performance Details</Text>
              <TouchableOpacity onPress={() => setIsViewModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ padding: 20 }}>
               {viewModalData && (
                 <>
                   <View style={styles.drawerField}><Text style={styles.drawerLabel}>ASM CODE</Text><Text style={styles.drawerValue}>{viewModalData.asmCode}</Text></View>
                   <View style={styles.drawerField}><Text style={styles.drawerLabel}>ASM NAME</Text><Text style={styles.drawerValue}>{viewModalData.asmName}</Text></View>
                   <View style={styles.drawerField}><Text style={styles.drawerLabel}>STATE</Text><Text style={styles.drawerValue}>{viewModalData.state}</Text></View>
                   <View style={styles.drawerField}><Text style={styles.drawerLabel}>HEADQUARTERS</Text><Text style={styles.drawerValue}>{viewModalData.hq}</Text></View>
                   
                   <View style={styles.divider} />
                   
                   <View style={styles.drawerField}><Text style={styles.drawerLabel}>ASSIGNED TARGET</Text><Text style={styles.drawerValue}>{viewModalData.assignedTarget}</Text></View>
                   <View style={styles.drawerField}><Text style={styles.drawerLabel}>ACHIEVEMENT</Text><Text style={styles.drawerValue}>{viewModalData.achievement}</Text></View>
                   <View style={styles.drawerField}><Text style={styles.drawerLabel}>ACHIEVEMENT %</Text><Text style={[styles.drawerValue, { color: '#DC2626' }]}>{viewModalData.achievementPct}</Text></View>
                   
                   <View style={styles.divider} />

                   <View style={styles.drawerField}><Text style={styles.drawerLabel}>ATTENDANCE %</Text><Text style={styles.drawerValue}>{viewModalData.attendancePct}</Text></View>
                   <View style={styles.drawerField}><Text style={styles.drawerLabel}>DOCTOR VISITS</Text><Text style={styles.drawerValue}>{viewModalData.docVisits}</Text></View>
                   <View style={styles.drawerField}><Text style={styles.drawerLabel}>CHEMIST VISITS</Text><Text style={styles.drawerValue}>{viewModalData.chemVisits}</Text></View>
                   <View style={styles.drawerField}><Text style={styles.drawerLabel}>ORDERS BOOKED</Text><Text style={styles.drawerValue}>{viewModalData.ordersBooked}</Text></View>
                   <View style={styles.drawerField}><Text style={styles.drawerLabel}>TEAM STRENGTH (MR COUNT)</Text><Text style={styles.drawerValue}>{viewModalData.teamStrength.split(' ')[0]}</Text></View>
                   
                   <View style={styles.divider} />

                   <View style={styles.drawerField}><Text style={styles.drawerLabel}>PERFORMANCE TREND</Text><Text style={styles.drawerValue}>{viewModalData.trend}</Text></View>
                   <View style={styles.drawerField}>
                     <Text style={styles.drawerLabel}>REMARKS</Text>
                     <View style={styles.remarksBox}>
                       <Text style={styles.remarksText}>{viewModalData.remarks}</Text>
                     </View>
                   </View>

                   <TouchableOpacity style={styles.closeDrawerBtn} onPress={() => setIsViewModalVisible(false)}>
                     <Text style={styles.closeDrawerBtnText}>Close</Text>
                   </TouchableOpacity>
                 </>
               )}
            </ScrollView>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

export default RSMTeamPerformanceScreen;

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F8FAFC' 
  },
  header: { 
    flexDirection: 'row', 
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: 16, 
    backgroundColor: '#FFF', 
    borderBottomWidth: 1, 
    borderBottomColor: '#E2E8F0',
    gap: 12
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1
  },
  backBtn: { 
    padding: 6, 
    marginRight: 12, 
    backgroundColor: '#F1F5F9', 
    borderRadius: 8,
    marginTop: 2
  },
  title: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: '#0F172A',
    marginBottom: 4
  },
  subtitle: { 
    fontSize: 13, 
    color: '#64748B',
    lineHeight: 18
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
    marginTop: 2
  },
  exportBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569'
  },
  scrollContent: { 
    padding: 16,
    paddingBottom: 40
  },
  
  // 4 Cards Grid (2x2)
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20
  },
  cardContainer: {
    width: '48%', 
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12
  },
  cardTitle: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 4
  },
  cardValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0F172A'
  },

  // Filters Section
  filtersContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  dropdown: {
    width: 120,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFF'
  },
  dropdownText: {
    color: '#334155',
    fontSize: 13,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FAFAFA'
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    fontSize: 13,
    color: '#334155'
  },

  // Table
  tableCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#FAFAFA'
  },
  th: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  td: {
    fontSize: 13,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  dropdownModalCard: { backgroundColor: '#FFF', width: '100%', maxWidth: 300, borderRadius: 12, overflow: 'hidden' },
  dropdownModalHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  dropdownModalTitle: { fontSize: 16, fontWeight: 'bold', color: '#0F172A' },
  dropdownOptionBtn: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  dropdownOptionText: { fontSize: 15, color: '#334155' },

  // Side Drawer Modal Styles
  drawerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    flexDirection: 'row',
    justifyContent: 'flex-end' // Aligns the drawer to the right
  },
  drawerCard: { 
    backgroundColor: '#FFF', 
    width: '85%', 
    maxWidth: 400, 
    height: '100%', 
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5
  },
  drawerHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    padding: 20, 
    borderBottomWidth: 1, 
    borderBottomColor: '#F1F5F9' 
  },
  drawerTitle: { fontSize: 16, fontWeight: 'bold', color: '#0F172A' },
  drawerField: {
    marginBottom: 16
  },
  drawerLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  drawerValue: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '500'
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 8,
    marginBottom: 16
  },
  remarksBox: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 4
  },
  remarksText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18
  },
  closeDrawerBtn: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40
  },
  closeDrawerBtnText: {
    color: '#475569',
    fontWeight: '600',
    fontSize: 14
  }
});
