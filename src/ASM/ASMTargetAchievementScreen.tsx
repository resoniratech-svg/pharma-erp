import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, TextInput, Platform, Modal, Alert, Share, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { getASMDashboard } from '../services/dashboardService';

const ASMTargetAchievementScreen = () => {
  const navigation = useNavigation<any>();

  const [achievements, setAchievements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchAchievements();
  }, []);

  const fetchAchievements = async () => {
    try {
      setLoading(true);
      const data = await getASMDashboard();
      if (data && data.reportingMRs) {
        setAchievements(data.reportingMRs.map((mr: any) => ({
          id: mr.id?.toString() || Math.random().toString(),
          code: mr.employeeCode || 'EMP-?',
          name: mr.name || 'Unknown',
          territory: mr.area || 'Unassigned',
          hq: mr.headquarters || 'Unassigned',
          reportingAsm: data.asm?.name || 'Current ASM User',
          financialYear: 'FY 2026-27',
          assignedTarget: mr.assignedTarget || 0,
          achieved: mr.achieved || 0,
          achievementPercent: mr.achievementPercent || 0,
          totalOrders: mr.totalOrders || 0,
          status: mr.achievementPercent >= 80 ? 'On Track' : 'Needs Attention',
          lastOrderDate: mr.lastOrderDate || 'No orders yet',
          lastActivityDate: mr.lastActivityDate || 'No activity',
          monthlyProgress: mr.monthlyProgress || []
        })));
      } else {
         setAchievements([]);
      }
    } catch (error) {
      console.error('Failed to fetch achievements:', error);
      Alert.alert('Error', 'Failed to fetch team achievements');
    } finally {
      setLoading(false);
    }
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [dropdownTarget, setDropdownTarget] = useState<string | null>(null);
  
  const [viewingMR, setViewingMR] = useState<any>(null);

  // Dynamic Calculations
  const activeMRsCount = achievements.length;
  
  const totalAssigned = achievements.reduce((sum, item) => sum + item.assignedTarget, 0);
  const totalAchieved = achievements.reduce((sum, item) => sum + item.achieved, 0);
  const overallAchievementPercent = totalAssigned > 0 ? ((totalAchieved / totalAssigned) * 100).toFixed(0) : '0';
  
  const totalOrdersCount = achievements.reduce((sum, item) => sum + item.totalOrders, 0);
  
  let topPerformer = 'N/A';
  if (achievements.length > 0) {
    // Sort by achievement percent, then by total orders if there's a tie
    const sorted = [...achievements].sort((a, b) => {
      if (b.achievementPercent === a.achievementPercent) {
        return b.totalOrders - a.totalOrders;
      }
      return b.achievementPercent - a.achievementPercent;
    });
    topPerformer = sorted[0].name;
  }

  const formatCurrencyLakhs = (val: number) => {
    return '₹' + (val / 100000).toFixed(2) + ' L';
  };

  // Filter Logic
  const filteredAchievements = achievements.filter(mr => {
    const matchesSearch = (mr.name || '').toLowerCase().includes((searchQuery || '').toLowerCase()) || 
                          (mr.code || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
                          (mr.territory || '').toLowerCase().includes((searchQuery || '').toLowerCase());
    const matchesStatus = selectedStatus === 'All' || mr.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const handleExportCSV = async () => {
    setShowExportMenu(false);
    if (filteredAchievements.length === 0) return Alert.alert('No Data', 'There is no data to export.');
    
    const header = 'MR NAME,TERRITORY,ASSIGNED TARGET,ACHIEVED,ACHIEVEMENT %,TOTAL ORDERS,STATUS\n';
    const rows = filteredAchievements.map(item => `${item.name},${item.territory},${item.assignedTarget},${item.achieved},${item.achievementPercent}%,${item.totalOrders},${item.status}`).join('\n');
    const csvContent = header + rows;

    if (Platform.OS === 'web') {
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', 'Target_Achievement_Export.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      await Share.share({ message: csvContent, title: 'Target_Achievement_Export.csv' });
    }
  };

  const handleExportPDF = async () => {
    setShowExportMenu(false);
    if (filteredAchievements.length === 0) return Alert.alert('No Data', 'There is no data to export.');

    try {
      if (Platform.OS === 'web') {
        const doc = new jsPDF();
        doc.text("Target Achievement Report", 14, 15);
        autoTable(doc, {
          head: [["NAME", "TERRITORY", "ASSIGNED", "ACHIEVED", "ACH. %", "ORDERS", "STATUS"]],
          body: filteredAchievements.map(item => [item.name, item.territory, item.assignedTarget.toString(), item.achieved.toString(), `${item.achievementPercent}%`, item.totalOrders.toString(), item.status]),
          startY: 20,
        });
        doc.save('Target_Achievement_Export.pdf');
      } else {
        const htmlContent = `
          <html>
            <head>
              <style>
                body { font-family: Helvetica, sans-serif; padding: 20px; }
                h1 { text-align: center; color: #0F172A; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #E2E8F0; padding: 10px; text-align: left; font-size: 12px; }
                th { background-color: #F8FAFC; color: #475569; }
              </style>
            </head>
            <body>
              <h1>Target Achievement Report</h1>
              <table>
                <tr><th>NAME</th><th>TERRITORY</th><th>ASSIGNED</th><th>ACHIEVED</th><th>ACH. %</th><th>ORDERS</th><th>STATUS</th></tr>
                ${filteredAchievements.map(item => `
                  <tr><td>${item.name}</td><td>${item.territory}</td><td>${item.assignedTarget}</td><td>${item.achieved}</td><td>${item.achievementPercent}%</td><td>${item.totalOrders}</td><td>${item.status}</td></tr>
                `).join('')}
              </table>
            </body>
          </html>
        `;
        const { uri } = await Print.printToFileAsync({ html: htmlContent });
        await Sharing.shareAsync(uri);
      }
    } catch (error: any) {
      console.log('PDF Export Error', error);
      Alert.alert('Export Failed', 'An error occurred while generating PDF.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={20} color="#334155" />
        </TouchableOpacity>
        <Text style={styles.title}>Target Achievement</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1, padding: 16 }}>
        
        <View style={styles.titleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.pageTitle}>Target Achievement</Text>
            <Text style={styles.pageSubtitle}>Monitor sales targets, achievements, and performance of Medical Representatives.</Text>
          </View>
          
          <View style={{ position: 'relative', zIndex: 20 }}>
            <TouchableOpacity style={styles.exportBtn} onPress={() => setShowExportMenu(!showExportMenu)}>
              <Ionicons name="download-outline" size={16} color="#334155" style={{ marginRight: 6 }} />
              <Text style={styles.exportBtnText}>Export</Text>
              <Ionicons name="chevron-down" size={14} color="#64748B" style={{ marginLeft: 6 }} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Dynamic Cards */}
        <View style={styles.cardsRow}>
          {/* Card 1 */}
          <View style={styles.card}>
            <View style={[styles.iconCircle, { backgroundColor: '#EEF2FF' }]}>
              <Ionicons name="people-outline" size={18} color="#4F46E5" />
            </View>
            <Text style={styles.cardLabel}>Active MRs</Text>
            <Text style={styles.cardValue}>{activeMRsCount}</Text>
          </View>
          {/* Card 2 */}
          <View style={styles.card}>
            <View style={[styles.iconCircle, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="pie-chart-outline" size={18} color="#10B981" />
            </View>
            <Text style={styles.cardLabel}>Overall Achievement %</Text>
            <Text style={styles.cardValue}>{overallAchievementPercent}%</Text>
          </View>
          {/* Card 3 */}
          <View style={styles.card}>
            <View style={[styles.iconCircle, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="pulse-outline" size={18} color="#3B82F6" />
            </View>
            <Text style={styles.cardLabel}>Total Orders</Text>
            <Text style={styles.cardValue}>{totalOrdersCount}</Text>
          </View>
          {/* Card 4 */}
          <View style={styles.card}>
            <View style={[styles.iconCircle, { backgroundColor: '#F5F3FF' }]}>
              <Ionicons name="trending-up-outline" size={18} color="#8B5CF6" />
            </View>
            <Text style={styles.cardLabel}>Top Performer</Text>
            <Text style={styles.cardValue}>{topPerformer}</Text>
          </View>
        </View>

        {/* Search & Filters */}
        <View style={styles.filtersContainer}>
          <View style={[styles.searchBox, { flex: 1 }]}>
            <Ionicons name="search" size={18} color="#94A3B8" style={{ marginRight: 8 }} />
            <TextInput
              style={[styles.searchInput, Platform.OS === 'web' && { outlineStyle: 'none' } as any]}
              placeholder="Search by MR Name, Territory..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          
          <View style={{ position: 'relative', zIndex: 10 }}>
            <TouchableOpacity 
              style={styles.dropdownBtn} 
              onPress={() => setDropdownTarget(dropdownTarget === 'status' ? null : 'status')}
            >
              <Text style={styles.dropdownBtnText}>{selectedStatus}</Text>
              <Ionicons name="chevron-down" size={16} color="#64748B" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Table */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -16 }}>
          <View style={styles.tableContainer}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.columnHeader, { width: 160 }]}>MR NAME</Text>
              <Text style={[styles.columnHeader, { width: 140 }]}>TERRITORY</Text>
              <Text style={[styles.columnHeader, { width: 140 }]}>ASSIGNED TARGET</Text>
              <Text style={[styles.columnHeader, { width: 140 }]}>ACHIEVED</Text>
              <Text style={[styles.columnHeader, { width: 140 }]}>ACHIEVEMENT %</Text>
              <Text style={[styles.columnHeader, { width: 120 }]}>TOTAL ORDERS</Text>
              <Text style={[styles.columnHeader, { width: 140 }]}>STATUS</Text>
              <Text style={[styles.columnHeader, { width: 80, textAlign: 'center' }]}>ACTION</Text>
            </View>
            
            {/* Table Body */}
            {filteredAchievements.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="folder-open-outline" size={48} color="#CBD5E1" />
                <Text style={styles.emptyStateText}>No achievements found matching your criteria</Text>
              </View>
            ) : (
              filteredAchievements.map((item, index) => (
                <View key={item.id} style={[styles.tableRow, index === filteredAchievements.length - 1 && { borderBottomWidth: 0 }]}>
                  <Text style={[styles.cellText, styles.cellName, { width: 160 }]}>{item.name}</Text>
                  <Text style={[styles.cellText, { width: 140 }]}>{item.territory}</Text>
                  <Text style={[styles.cellText, { width: 140 }]}>{formatCurrencyLakhs(item.assignedTarget)}</Text>
                  <Text style={[styles.cellText, { width: 140 }]}>{formatCurrencyLakhs(item.achieved)}</Text>
                  <Text style={[styles.cellText, { width: 140, color: item.achievementPercent < 50 ? '#DC2626' : (item.achievementPercent >= 100 ? '#10B981' : '#F59E0B'), fontWeight: 'bold' }]}>
                    {item.achievementPercent}%
                  </Text>
                  <Text style={[styles.cellText, { width: 120 }]}>{item.totalOrders}</Text>
                  
                  <View style={{ width: 140 }}>
                    <View style={[
                      styles.statusBadge, 
                      item.status === 'Needs Attention' ? styles.statusWarning : 
                      item.status === 'On Track' ? styles.statusSuccess : 
                      item.status === 'Achieved' ? styles.statusAchieved : 
                      item.status === 'Exceeded' ? styles.statusExceeded : 
                      styles.statusDanger
                    ]}>
                      <Text style={[
                        styles.statusText, 
                        item.status === 'Needs Attention' ? styles.statusWarningText : 
                        item.status === 'On Track' ? styles.statusSuccessText : 
                        item.status === 'Achieved' ? styles.statusAchievedText : 
                        item.status === 'Exceeded' ? styles.statusExceededText : 
                        styles.statusDangerText
                      ]}>
                        {item.status}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={[styles.actionCell, { width: 80 }]}>
                    <TouchableOpacity style={styles.actionIcon} onPress={() => setViewingMR(item)}>
                      <Ionicons name="eye-outline" size={18} color="#64748B" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* View Details Slide-in Panel */}
      <Modal visible={!!viewingMR} transparent animationType="fade" onRequestClose={() => setViewingMR(null)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setViewingMR(null)} />
          <View style={styles.profilePanel}>
            <View style={styles.panelHeader}>
              <Text style={styles.panelTitle}>Target Achievement Details</Text>
              <TouchableOpacity onPress={() => setViewingMR(null)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            
            {viewingMR && (
              <>
                <ScrollView style={{ padding: 20 }}>
                  {/* 1. MR INFORMATION */}
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>1. MR INFORMATION</Text>
                    <View style={styles.detailStack}>
                      <Text style={styles.detailLabel}>MR CODE</Text>
                      <Text style={styles.detailValue}>{viewingMR.code}</Text>
                    </View>
                    <View style={styles.detailStack}>
                      <Text style={styles.detailLabel}>MR NAME</Text>
                      <Text style={styles.detailValue}>{viewingMR.name}</Text>
                    </View>
                    <View style={styles.detailStack}>
                      <Text style={styles.detailLabel}>TERRITORY</Text>
                      <Text style={styles.detailValue}>{viewingMR.territory}</Text>
                    </View>
                    <View style={styles.detailStack}>
                      <Text style={styles.detailLabel}>HEADQUARTERS</Text>
                      <Text style={styles.detailValue}>{viewingMR.hq}</Text>
                    </View>
                    <View style={styles.detailStack}>
                      <Text style={styles.detailLabel}>REPORTING ASM</Text>
                      <Text style={styles.detailValue}>{viewingMR.reportingAsm}</Text>
                    </View>
                    <View style={styles.detailStack}>
                      <Text style={styles.detailLabel}>STATUS</Text>
                      <View style={{ alignSelf: 'flex-start', marginTop: 4 }}>
                        <View style={[
                          styles.statusBadge, 
                          viewingMR.status === 'Needs Attention' ? styles.statusWarning : 
                          viewingMR.status === 'On Track' ? styles.statusSuccess : 
                          viewingMR.status === 'Achieved' ? styles.statusAchieved : 
                          viewingMR.status === 'Exceeded' ? styles.statusExceeded : 
                          styles.statusDanger
                        ]}>
                          <Text style={[
                            styles.statusText, 
                            viewingMR.status === 'Needs Attention' ? styles.statusWarningText : 
                            viewingMR.status === 'On Track' ? styles.statusSuccessText : 
                            viewingMR.status === 'Achieved' ? styles.statusAchievedText : 
                            viewingMR.status === 'Exceeded' ? styles.statusExceededText : 
                            styles.statusDangerText
                          ]}>
                            {viewingMR.status}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* 2. TARGET SUMMARY */}
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>2. TARGET SUMMARY</Text>
                    <View style={styles.detailStack}>
                      <Text style={styles.detailLabel}>FINANCIAL YEAR</Text>
                      <Text style={styles.detailValue}>{viewingMR.financialYear}</Text>
                    </View>
                    <View style={styles.detailStack}>
                      <Text style={styles.detailLabel}>ASSIGNED TARGET</Text>
                      <Text style={styles.detailValue}>₹ {viewingMR.assignedTarget}</Text>
                    </View>
                    <View style={styles.detailStack}>
                      <Text style={styles.detailLabel}>ACHIEVED TARGET</Text>
                      <Text style={styles.detailValue}>₹ {viewingMR.achieved}</Text>
                    </View>
                    <View style={styles.detailStack}>
                      <Text style={styles.detailLabel}>REMAINING TARGET</Text>
                      <Text style={styles.detailValue}>₹ {Math.max(0, viewingMR.assignedTarget - viewingMR.achieved)}</Text>
                    </View>
                    <View style={styles.detailStack}>
                      <Text style={styles.detailLabel}>ACHIEVEMENT %</Text>
                      <Text style={styles.detailValue}>{viewingMR.achievementPercent}%</Text>
                    </View>
                    <View style={styles.detailStack}>
                      <Text style={styles.detailLabel}>TOTAL ORDERS</Text>
                      <Text style={styles.detailValue}>{viewingMR.totalOrders}</Text>
                    </View>
                  </View>

                  {/* 3. MONTHLY TARGET PROGRESS */}
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>3. MONTHLY TARGET PROGRESS</Text>
                    <View style={styles.monthlyTable}>
                      <View style={styles.monthlyTableHeader}>
                        <Text style={[styles.monthlyHeaderCell, { flex: 1.5 }]}>Month</Text>
                        <Text style={[styles.monthlyHeaderCell, { flex: 2 }]}>Assigned Target</Text>
                        <Text style={[styles.monthlyHeaderCell, { flex: 2 }]}>Achieved</Text>
                        <Text style={[styles.monthlyHeaderCell, { flex: 2, textAlign: 'right' }]}>Achievement %</Text>
                      </View>
                      
                      {viewingMR.monthlyProgress.map((row: any, idx: number) => (
                        <View key={idx} style={styles.monthlyTableRow}>
                          <Text style={[styles.monthlyCell, { flex: 1.5 }]}>{row.month}</Text>
                          <Text style={[styles.monthlyCell, { flex: 2 }]}>₹ {new Intl.NumberFormat('en-IN').format(row.assigned)}</Text>
                          <Text style={[styles.monthlyCell, { flex: 2 }]}>₹ {new Intl.NumberFormat('en-IN').format(row.achieved)}</Text>
                          <Text style={[styles.monthlyCell, { flex: 2, textAlign: 'right', color: row.percent >= 100 ? '#10B981' : (row.percent >= 80 ? '#F59E0B' : '#DC2626'), fontWeight: 'bold' }]}>
                            {row.percent}%
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* 4. PERFORMANCE STATUS */}
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>4. PERFORMANCE STATUS</Text>
                    <View style={styles.detailStack}>
                      <Text style={styles.detailLabel}>CURRENT STATUS</Text>
                      <Text style={styles.detailValue}>{viewingMR.status}</Text>
                    </View>
                    <View style={styles.detailStack}>
                      <Text style={styles.detailLabel}>LAST ORDER DATE</Text>
                      <Text style={styles.detailValue}>{viewingMR.lastOrderDate}</Text>
                    </View>
                    <View style={styles.detailStack}>
                      <Text style={styles.detailLabel}>LAST ACTIVITY DATE</Text>
                      <Text style={styles.detailValue}>{viewingMR.lastActivityDate}</Text>
                    </View>
                  </View>
                  
                  <View style={{ height: 40 }} />
                </ScrollView>
                
                {/* Footer with Close Button */}
                <View style={styles.modalFooter}>
                  <TouchableOpacity style={styles.profileCloseBtn} onPress={() => setViewingMR(null)}>
                    <Text style={styles.profileCloseBtnText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Export Dropdown Modal */}
      <Modal visible={showExportMenu} transparent animationType="fade" onRequestClose={() => setShowExportMenu(false)}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setShowExportMenu(false)}>
          <View style={[styles.dropdownModalCard, { position: 'absolute', top: Platform.OS === 'ios' ? 140 : 100, right: 16, width: 150, zIndex: 30 }]}>
            <TouchableOpacity style={styles.dropdownOptionBtn} onPress={handleExportCSV}>
              <Text style={styles.dropdownOptionText}>Export as CSV</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dropdownOptionBtn} onPress={handleExportPDF}>
              <Text style={styles.dropdownOptionText}>Export as PDF</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Status Dropdown Modal */}
      <Modal visible={dropdownTarget === 'status'} transparent animationType="fade" onRequestClose={() => setDropdownTarget(null)}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setDropdownTarget(null)}>
          <View style={[styles.dropdownModalCard, { position: 'absolute', top: Platform.OS === 'ios' ? 330 : 280, right: 16, width: 140, zIndex: 20 }]}>
            {['All', 'On Track', 'Needs Attention', 'Achieved', 'Exceeded'].map((st) => (
              <TouchableOpacity 
                key={st} 
                style={styles.dropdownOptionBtn}
                onPress={() => { setSelectedStatus(st); setDropdownTarget(null); }}
              >
                <Text style={styles.dropdownOptionText}>{st}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 16, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingTop: Platform.OS === 'ios' ? 48 : 16 },
  backBtn: { padding: 4, marginRight: 12 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#0F172A' },
  
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, zIndex: 10 },
  pageTitle: { fontSize: 24, fontWeight: 'bold', color: '#0F172A', marginBottom: 8 },
  pageSubtitle: { fontSize: 14, color: '#64748B', lineHeight: 20 },
  
  exportBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 6, gap: 6 },
  exportBtnText: { fontSize: 13, fontWeight: '600', color: '#334155' },
  
  cardsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 24 },
  card: { flex: 1, minWidth: '45%', backgroundColor: '#FFF', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  iconCircle: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  cardLabel: { fontSize: 13, color: '#64748B', fontWeight: '500', marginBottom: 8 },
  cardValue: { fontSize: 22, fontWeight: 'bold', color: '#0F172A' },
  
  filtersContainer: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 24, zIndex: 5 },
  searchBox: { minWidth: 200, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, paddingHorizontal: 10, height: 38 },
  searchInput: { flex: 1, fontSize: 13, color: '#0F172A' },
  dropdownBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, paddingHorizontal: 10, height: 38, width: 140 },
  dropdownBtnText: { fontSize: 13, color: '#334155', fontWeight: '500' },
  
  dropdownModalCard: { backgroundColor: '#FFF', borderRadius: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 5 },
  dropdownOptionBtn: { paddingVertical: 10, paddingHorizontal: 16 },
  dropdownOptionText: { fontSize: 13, color: '#334155' },

  tableContainer: { backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', minWidth: 900 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#F8FAFC', paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  columnHeader: { fontSize: 12, fontWeight: 'bold', color: '#64748B', textTransform: 'uppercase' },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  cellText: { fontSize: 14, color: '#334155' },
  cellName: { fontWeight: '600', color: '#0F172A' },
  
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start', borderWidth: 1 },
  statusText: { fontSize: 12, fontWeight: 'bold' },
  statusSuccess: { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' },
  statusSuccessText: { color: '#059669' },
  statusWarning: { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' },
  statusWarningText: { color: '#D97706' },
  statusDanger: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
  statusDangerText: { color: '#DC2626' },
  statusAchieved: { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' },
  statusAchievedText: { color: '#2563EB' },
  statusExceeded: { backgroundColor: '#F5F3FF', borderColor: '#DDD6FE' },
  statusExceededText: { color: '#7C3AED' },
  
  actionCell: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  actionIcon: { padding: 4 },
  
  emptyState: { padding: 40, alignItems: 'center' },
  emptyStateText: { marginTop: 12, color: '#94A3B8', fontSize: 15 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', flexDirection: 'row' },
  profilePanel: { width: '85%', maxWidth: 420, backgroundColor: '#FFF', height: '100%', alignSelf: 'flex-end', shadowColor: '#000', shadowOffset: { width: -5, height: 0 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 15 },
  panelHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  panelTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  detailSection: { marginBottom: 32 },
  detailSectionTitle: { fontSize: 13, fontWeight: 'bold', color: '#1E293B', marginBottom: 16, textTransform: 'uppercase' },
  detailStack: { marginBottom: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', paddingBottom: 12 },
  detailLabel: { fontSize: 11, color: '#64748B', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 6 },
  detailValue: { fontSize: 14, color: '#0F172A', fontWeight: '500' },
  
  monthlyTable: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, overflow: 'hidden' },
  monthlyTableHeader: { flexDirection: 'row', backgroundColor: '#F8FAFC', paddingVertical: 12, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  monthlyHeaderCell: { fontSize: 11, fontWeight: 'bold', color: '#64748B' },
  monthlyTableRow: { flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', backgroundColor: '#FFF' },
  monthlyCell: { fontSize: 13, color: '#334155' },

  modalFooter: { padding: 16, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  profileCloseBtn: { width: '100%', paddingVertical: 12, borderRadius: 8, backgroundColor: '#F8FAFC', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  profileCloseBtnText: { color: '#334155', fontWeight: 'bold', fontSize: 14 },
});

export default ASMTargetAchievementScreen;
