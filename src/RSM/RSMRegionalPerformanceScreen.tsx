import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, TextInput, Platform, Modal, Share, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const INITIAL_DATA = [
  { id: '1', state: 'Maharashtra', asm: 'Gaurav Kapoor', target: '₹10.00 L', achievement: '₹2.00 L', percentage: '20.0', orders: 26, status: 'At Risk' },
  { id: '2', state: 'Maharashtra', asm: 'Manish Pandey', target: '₹12.00 L', achievement: '₹6.00 L', percentage: '50.0', orders: 45, status: 'On Track' },
  { id: '3', state: 'Gujarat', asm: 'Amit Desai', target: '₹8.00 L', achievement: '₹6.40 L', percentage: '80.0', orders: 52, status: 'Achieved' },
  { id: '4', state: 'Delhi', asm: 'Rajat Sharma', target: '₹15.00 L', achievement: '₹4.50 L', percentage: '30.0', orders: 30, status: 'At Risk' },
  { id: '5', state: 'Karnataka', asm: 'Priya Singh', target: '₹20.00 L', achievement: '₹18.00 L', percentage: '90.0', orders: 85, status: 'Achieved' },
];

const STATES = [
  'All States', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi'
];

const RSMRegionalPerformanceScreen = () => {
  const navigation = useNavigation<any>();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter States
  const [filterState, setFilterState] = useState('All States');
  const [isStateDropdownOpen, setIsStateDropdownOpen] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  
  // View Modal
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [viewModalData, setViewModalData] = useState<any>(null);

  // Computed Filtered Data
  const filteredData = useMemo(() => {
    return INITIAL_DATA.filter(item => {
      const matchesState = filterState === 'All States' || item.state === filterState;
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = item.state.toLowerCase().includes(searchLower) || item.asm.toLowerCase().includes(searchLower);
      return matchesState && matchesSearch;
    });
  }, [searchQuery, filterState]);

  // Computed Dynamic Stats
  const stats = useMemo(() => {
    const statesCovered = new Set(filteredData.map(item => item.state)).size;
    const totalOrders = filteredData.reduce((sum, item) => sum + item.orders, 0);
    
    // Average Achievement
    const totalPercentage = filteredData.reduce((sum, item) => sum + parseFloat(item.percentage), 0);
    const avgAchievement = filteredData.length > 0 ? (totalPercentage / filteredData.length).toFixed(1) : '0.0';

    // Best Performing State (by max total orders in state)
    const stateOrderMap: Record<string, number> = {};
    filteredData.forEach(item => {
      stateOrderMap[item.state] = (stateOrderMap[item.state] || 0) + item.orders;
    });
    
    let bestState = 'N/A';
    let maxOrders = -1;
    for (const [state, orders] of Object.entries(stateOrderMap)) {
      if (orders > maxOrders) {
        maxOrders = orders;
        bestState = state;
      }
    }

    return {
      statesCovered: statesCovered.toString(),
      bestState,
      avgAchievement: `${avgAchievement}%`,
      totalOrders: totalOrders.toString()
    };
  }, [filteredData]);

  const SUMMARY_CARDS = [
    { title: 'States Covered', value: stats.statesCovered, icon: 'map-outline', color: '#3B82F6', bgColor: '#EFF6FF' },
    { title: 'Best Performing State', value: stats.bestState, icon: 'trophy-outline', color: '#10B981', bgColor: '#ECFDF5' },
    { title: 'Overall Achievement %', value: stats.avgAchievement, icon: 'locate-outline', color: '#8B5CF6', bgColor: '#F5F3FF' },
    { title: 'Total Orders', value: stats.totalOrders, icon: 'bag-handle-outline', color: '#EC4899', bgColor: '#FDF2F8' },
  ];

  // Export Function - CSV
  const handleExportCSV = async () => {
    setIsExportMenuOpen(false);
    if (filteredData.length === 0) {
      Alert.alert('No Data', 'There is no data to export.');
      return;
    }
    
    const header = 'STATE,ASSIGNED ASM,TARGET,ACHIEVEMENT,ACHIEVEMENT %,ORDERS,STATUS\n';
    const rows = filteredData.map(item => 
      `${item.state},${item.asm},${item.target},${item.achievement},${item.percentage}%,${item.orders},${item.status}`
    ).join('\n');
    
    const csvContent = header + rows;

    if (Platform.OS === 'web') {
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'Regional_Performance_Export.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      try {
        await Share.share({
          message: csvContent,
          title: 'Regional_Performance_Export.csv'
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
        doc.text("Regional Performance Report", 14, 15);
        
        const tableColumn = ["STATE", "ASSIGNED ASM", "TARGET", "ACHIEVEMENT", "ACHIEVEMENT %", "ORDERS", "STATUS"];
        const tableRows: any[] = [];
        
        filteredData.forEach(item => {
          tableRows.push([
            item.state,
            item.asm,
            item.target,
            item.achievement,
            item.percentage + '%',
            item.orders,
            item.status
          ]);
        });
        
        autoTable(doc, {
          head: [tableColumn],
          body: tableRows,
          startY: 20,
        });
        
        doc.save('Regional_Performance_Export.pdf');
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
              <h1>Regional Performance Report</h1>
              <table>
                <tr>
                  <th>STATE</th>
                  <th>ASSIGNED ASM</th>
                  <th>TARGET</th>
                  <th>ACHIEVEMENT</th>
                  <th>ACHIEVEMENT %</th>
                  <th>ORDERS</th>
                  <th>STATUS</th>
                </tr>
                ${filteredData.map(item => `
                  <tr>
                    <td>${item.state}</td>
                    <td>${item.asm}</td>
                    <td>${item.target}</td>
                    <td>${item.achievement}</td>
                    <td>${item.percentage}%</td>
                    <td>${item.orders}</td>
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
    return '#EF4444'; // At Risk
  };
  const getStatusBg = (status: string) => {
    if (status === 'Achieved') return '#DCFCE7';
    if (status === 'On Track') return '#FEF3C7';
    return '#FEF2F2'; // At Risk
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
            <Text style={styles.title}>Regional Performance</Text>
            <Text style={styles.subtitle} numberOfLines={2}>Monitor state-wise target achievements, orders, and ASM activity across your region.</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.exportBtn} onPress={() => setIsExportMenuOpen(true)}>
          <Ionicons name="download-outline" size={16} color="#475569" />
          <Text style={styles.exportBtnText}>Export</Text>
          <Ionicons name="chevron-down" size={16} color="#475569" style={{ marginLeft: 4 }} />
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
          <View style={[styles.searchBox, { flex: 1 }]}>
            <Ionicons name="search" size={18} color="#94A3B8" />
            <TextInput
              style={[styles.searchInput, Platform.OS === 'web' && { outlineStyle: 'none' } as any]}
              placeholder="Search state or ASM name..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#94A3B8"
            />
          </View>
          <TouchableOpacity style={[styles.dropdown, { flex: 0, minWidth: 140 }]} onPress={() => setIsStateDropdownOpen(true)}>
            <Text style={styles.dropdownText}>{filterState}</Text>
            <Ionicons name="chevron-down" size={16} color="#64748B" />
          </TouchableOpacity>
        </View>

        {/* Data Table */}
        <View style={styles.tableCard}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ minWidth: 800 }}>
              {/* Table Header */}
              <View style={styles.tableHeader}>
                <Text style={[styles.th, { width: 120 }]}>STATE</Text>
                <Text style={[styles.th, { width: 150 }]}>ASSIGNED ASM</Text>
                <Text style={[styles.th, { width: 100 }]}>TARGET</Text>
                <Text style={[styles.th, { width: 120 }]}>ACHIEVEMENT</Text>
                <Text style={[styles.th, { width: 130 }]}>ACHIEVEMENT %</Text>
                <Text style={[styles.th, { width: 80 }]}>ORDERS</Text>
                <Text style={[styles.th, { width: 100, textAlign: 'center' }]}>STATUS</Text>
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
                    <Text style={[styles.td, { width: 120, color: '#475569' }]}>{item.state}</Text>
                    <Text style={[styles.td, { width: 150, color: '#1E293B', fontWeight: '500' }]}>{item.asm}</Text>
                    <Text style={[styles.td, { width: 100, color: '#475569' }]}>{item.target}</Text>
                    <Text style={[styles.td, { width: 120, color: '#475569' }]}>{item.achievement}</Text>
                    <Text style={[styles.td, { width: 130, color: getStatusColor(item.status), fontWeight: '600' }]}>{item.percentage}%</Text>
                    <Text style={[styles.td, { width: 80, color: '#475569' }]}>{item.orders}</Text>
                    
                    <View style={{ width: 100, alignItems: 'center' }}>
                      <View style={[styles.statusPill, { backgroundColor: getStatusBg(item.status) }]}>
                        <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
                      </View>
                    </View>
                    
                    <View style={{ width: 80, alignItems: 'center' }}>
                      <TouchableOpacity onPress={() => { setViewModalData(item); setIsViewModalVisible(true); }}>
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

      {/* ── State Dropdown Modal ── */}
      <Modal visible={isStateDropdownOpen} transparent animationType="fade">
        <TouchableOpacity style={[styles.modalOverlay, { backgroundColor: 'transparent' }]} activeOpacity={1} onPress={() => setIsStateDropdownOpen(false)}>
          <View style={[styles.dropdownModalCard, { position: 'absolute', top: 310, left: 180, maxWidth: 200, paddingVertical: 8, elevation: 5, shadowOpacity: 0.1, shadowRadius: 10 }]}>
            <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
              {STATES.map((opt) => (
                <TouchableOpacity 
                  key={opt} 
                  style={{ paddingVertical: 10, paddingHorizontal: 16, backgroundColor: filterState === opt ? '#F8FAFC' : '#FFF' }} 
                  onPress={() => {
                    setFilterState(opt);
                    setIsStateDropdownOpen(false);
                  }}
                >
                  <Text style={[{ fontSize: 13, color: '#334155' }, filterState === opt && { color: '#0F172A', fontWeight: '600' }]}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Export Dropdown Modal ── */}
      <Modal visible={isExportMenuOpen} transparent animationType="fade">
        <TouchableOpacity style={[styles.modalOverlay, { backgroundColor: 'transparent' }]} activeOpacity={1} onPress={() => setIsExportMenuOpen(false)}>
          <View style={[styles.dropdownModalCard, { position: 'absolute', top: 70, right: 16, maxWidth: 200, paddingVertical: 8, elevation: 5, shadowOpacity: 0.1, shadowRadius: 10 }]}>
            <TouchableOpacity 
              style={{ paddingVertical: 10, paddingHorizontal: 16, backgroundColor: '#FFF', flexDirection: 'row', alignItems: 'center' }} 
              onPress={handleExportCSV}
            >
              <Ionicons name="document-text-outline" size={16} color="#334155" style={{ marginRight: 8 }} />
              <Text style={{ fontSize: 13, color: '#334155' }}>Export as CSV</Text>
            </TouchableOpacity>
            <View style={{ height: 1, backgroundColor: '#F1F5F9' }} />
            <TouchableOpacity 
              style={{ paddingVertical: 10, paddingHorizontal: 16, backgroundColor: '#FFF', flexDirection: 'row', alignItems: 'center' }} 
              onPress={handleExportPDF}
            >
              <Ionicons name="document-outline" size={16} color="#334155" style={{ marginRight: 8 }} />
              <Text style={{ fontSize: 13, color: '#334155' }}>Export as PDF</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── View Row Details Modal ── */}
      <Modal visible={isViewModalVisible} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.dropdownModalCard, { maxWidth: 350 }]}>
             <View style={styles.dropdownModalHeader}>
              <Text style={styles.dropdownModalTitle}>Performance Details</Text>
              <TouchableOpacity onPress={() => setIsViewModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ padding: 20 }}>
               {viewModalData && (
                 <>
                   <View style={styles.viewRow}>
                     <View style={styles.viewCol}><Text style={styles.viewLabel}>ASM Name</Text><Text style={styles.viewValue}>{viewModalData.asm}</Text></View>
                     <View style={styles.viewCol}><Text style={styles.viewLabel}>State</Text><Text style={styles.viewValue}>{viewModalData.state}</Text></View>
                   </View>
                   <View style={styles.viewRow}>
                     <View style={styles.viewCol}><Text style={styles.viewLabel}>Target</Text><Text style={styles.viewValue}>{viewModalData.target}</Text></View>
                     <View style={styles.viewCol}><Text style={styles.viewLabel}>Achievement</Text><Text style={styles.viewValue}>{viewModalData.achievement}</Text></View>
                   </View>
                   <View style={styles.viewRow}>
                     <View style={styles.viewCol}><Text style={styles.viewLabel}>Total Orders</Text><Text style={styles.viewValue}>{viewModalData.orders}</Text></View>
                     <View style={styles.viewCol}><Text style={styles.viewLabel}>Achievement %</Text><Text style={[styles.viewValue, { color: getStatusColor(viewModalData.status) }]}>{viewModalData.percentage}%</Text></View>
                   </View>
                   <View style={styles.viewRow}>
                     <View style={styles.viewCol}>
                        <Text style={styles.viewLabel}>Current Status</Text>
                        <View style={[styles.statusPill, { alignSelf: 'flex-start', marginTop: 4, backgroundColor: getStatusBg(viewModalData.status) }]}>
                          <Text style={[styles.statusText, { color: getStatusColor(viewModalData.status) }]}>
                            {viewModalData.status}
                          </Text>
                        </View>
                     </View>
                   </View>
                 </>
               )}
            </ScrollView>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

export default RSMRegionalPerformanceScreen;

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
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
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
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  dropdownRow: {
    flexDirection: 'row',
    gap: 12
  },
  dropdown: {
    flex: 1,
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
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FFF'
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

  // View Row Details Modal Styles
  viewRow: { flexDirection: 'row', marginBottom: 16, gap: 16 },
  viewCol: { flex: 1 },
  viewLabel: { fontSize: 12, color: '#64748B', marginBottom: 4 },
  viewValue: { fontSize: 15, color: '#0F172A', fontWeight: '600' },
});
