import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, TextInput, Platform, Modal, Alert, Share, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { getASMDailyReports } from '../services/dailyReportService';

const ASMDailyActivitiesScreen = () => {
  const navigation = useNavigation<any>();

  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const data = await getASMDailyReports();
      if (data && data.length > 0) {
        setActivities(data.map((report: any) => ({
          id: report.id?.toString() || Math.random().toString(),
          date: report.reportDate ? new Date(report.reportDate).toLocaleDateString() : new Date().toLocaleDateString(),
          mrName: (report.mr?.user?.employee || report.mr).name || 'Unknown',
          activityType: 'Daily Report',
          customer: '-',
          territory: report.territory || '-',
          status: 'Completed',
          activityTime: report.checkInTime || '-',
          mrCode: (report.mr?.user?.employee || report.mr).employeeCode || '-',
          headquarters: (report.mr?.user?.employee || report.mr).headquarters || '-',
          customerType: 'N/A',
          specialty: 'N/A',
          clinicName: 'N/A',
          productsDiscussed: 'N/A',
          samplesGiven: report.samplesDistributed?.toString() || '0',
          remarks: report.remarks || '-',
          gpsLocation: 'Verified',
          checkInTime: report.checkInTime || '-',
          checkOutTime: report.checkOutTime || '-'
        })));
      } else {
        setActivities([]);
      }
    } catch (error) {
      console.error('Failed to fetch daily activities:', error);
      Alert.alert('Error', 'Could not fetch daily activities');
    } finally {
      setLoading(false);
    }
  };

  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedDateFilter, setSelectedDateFilter] = useState('Today');
  const [selectedActivityFilter, setSelectedActivityFilter] = useState('All Activities');
  
  const [dropdownTarget, setDropdownTarget] = useState<'export' | 'date' | 'activity' | null>(null);
  
  const [viewingActivity, setViewingActivity] = useState<any>(null);

  // Dynamic Calculations based on filtered data
  const todaysActivitiesCount = activities.length;
  const doctorVisitsCount = activities.filter(a => a.activityType === 'Doctor Visit').length;
  const chemistVisitsCount = activities.filter(a => a.activityType === 'Chemist Visit').length;
  const ordersCount = activities.filter(a => a.activityType === 'Order Booking').length;

  // Filter Logic
  const filteredActivities = activities.filter(act => {
    const matchesSearch = (act.mrName || '').toLowerCase().includes((searchQuery || '').toLowerCase()) || 
                          (act.customer || '').toLowerCase().includes((searchQuery || '').toLowerCase());
    
    const matchesActivity = selectedActivityFilter === 'All' || selectedActivityFilter === 'All Activities' || act.activityType === selectedActivityFilter;
    
    // For date filter, since it's mock data, we just assume it matches 'Today'
    return matchesSearch && matchesActivity;
  });

  const handleExportCSV = async () => {
    setDropdownTarget(null);
    if (filteredActivities.length === 0) return Alert.alert('No Data', 'There is no data to export.');
    
    const header = 'DATE,MR NAME,ACTIVITY TYPE,CUSTOMER,TERRITORY,STATUS\n';
    const rows = filteredActivities.map(item => `${item.date},${item.mrName},${item.activityType},${item.customer},${item.territory},${item.status}`).join('\n');
    const csvContent = header + rows;

    if (Platform.OS === 'web') {
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', 'Daily_Activities_Export.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      await Share.share({ message: csvContent, title: 'Daily_Activities_Export.csv' });
    }
  };

  const handleExportPDF = async () => {
    setDropdownTarget(null);
    if (filteredActivities.length === 0) return Alert.alert('No Data', 'There is no data to export.');

    try {
      if (Platform.OS === 'web') {
        // @ts-ignore
        const doc = new jsPDF();
        doc.text("Daily Activities Report", 14, 15);
        // @ts-ignore
          autoTable(doc, {
          head: [["DATE", "MR NAME", "ACTIVITY TYPE", "CUSTOMER", "TERRITORY", "STATUS"]],
          body: filteredActivities.map(item => [item.date, item.mrName, item.activityType, item.customer, item.territory, item.status]),
          startY: 20,
        });
        doc.save('Daily_Activities_Export.pdf');
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
              <h1>Daily Activities Report</h1>
              <table>
                <tr><th>DATE</th><th>MR NAME</th><th>ACTIVITY TYPE</th><th>CUSTOMER</th><th>TERRITORY</th><th>STATUS</th></tr>
                ${filteredActivities.map(item => `
                  <tr><td>${item.date}</td><td>${item.mrName}</td><td>${item.activityType}</td><td>${item.customer}</td><td>${item.territory}</td><td>${item.status}</td></tr>
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
        <Text style={styles.title}>Daily Activities</Text>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        style={{ flex: 1, padding: 16 }}
        onScroll={() => setDropdownTarget(null)}
        scrollEventThrottle={16}
      >
        
        <View style={styles.titleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.pageTitle}>Daily Activities</Text>
            <Text style={styles.pageSubtitle}>Monitor daily field activities, doctor visits, chemist visits, and order bookings of your MRs.</Text>
          </View>
        </View>

        {/* Dynamic Cards */}
        <View style={styles.cardsRow}>
          {/* Card 1 */}
          <View style={styles.card}>
            <View style={[styles.iconCircle, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="checkmark-circle-outline" size={18} color="#10B981" />
            </View>
            <Text style={styles.cardLabel}>Today's Activities</Text>
            <Text style={styles.cardValue}>{todaysActivitiesCount}</Text>
          </View>
          {/* Card 2 */}
          <View style={styles.card}>
            <View style={[styles.iconCircle, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="people-outline" size={18} color="#3B82F6" />
            </View>
            <Text style={styles.cardLabel}>Doctor Visits</Text>
            <Text style={styles.cardValue}>{doctorVisitsCount}</Text>
          </View>
          {/* Card 3 */}
          <View style={styles.card}>
            <View style={[styles.iconCircle, { backgroundColor: '#F5F3FF' }]}>
              <Ionicons name="location-outline" size={18} color="#8B5CF6" />
            </View>
            <Text style={styles.cardLabel}>Chemist Visits</Text>
            <Text style={styles.cardValue}>{chemistVisitsCount}</Text>
          </View>
          {/* Card 4 */}
          <View style={styles.card}>
            <View style={[styles.iconCircle, { backgroundColor: '#F0F9FF' }]}>
              <Ionicons name="document-text-outline" size={18} color="#0EA5E9" />
            </View>
            <Text style={styles.cardLabel}>Orders</Text>
            <Text style={styles.cardValue}>{ordersCount}</Text>
          </View>
        </View>

        {/* Search & Filters */}
        <View style={[styles.filtersContainer, { zIndex: 50, elevation: 50 }]}>
          <View style={[styles.searchBox, { flex: 1, minWidth: 220 }]}>
            <Ionicons name="search" size={18} color="#94A3B8" style={{ marginRight: 8 }} />
            <TextInput
              style={[styles.searchInput, Platform.OS === 'web' && { outlineStyle: 'none' } as any]}
              placeholder="Search by MR or Customer..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={() => setDropdownTarget(null)}
            />
          </View>
          
          <View style={{ zIndex: dropdownTarget === 'date' ? 100 : 1, elevation: dropdownTarget === 'date' ? 100 : 1 }}>
            <TouchableOpacity 
              style={[styles.dropdownBtn, { width: 110 }]} 
              onPress={() => setDropdownTarget(dropdownTarget === 'date' ? null : 'date')}
            >
              <Text style={styles.dropdownBtnText}>{selectedDateFilter}</Text>
              <Ionicons name="chevron-down" size={16} color="#64748B" />
            </TouchableOpacity>
            
            {dropdownTarget === 'date' && (
              <View style={[styles.dropdownModalCard, { position: 'absolute', top: '100%', right: 0, marginTop: 4, width: 110 }]}>
                {['All', 'Today', 'Yesterday', 'This Week', 'This Month'].map((dt) => (
                  <TouchableOpacity 
                    key={dt} 
                    style={styles.dropdownOptionBtn}
                    onPress={() => { setSelectedDateFilter(dt); setDropdownTarget(null); }}
                  >
                    <Text style={styles.dropdownOptionText}>{dt}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={{ zIndex: dropdownTarget === 'activity' ? 100 : 1, elevation: dropdownTarget === 'activity' ? 100 : 1 }}>
            <TouchableOpacity 
              style={[styles.dropdownBtn, { width: 140 }]} 
              onPress={() => setDropdownTarget(dropdownTarget === 'activity' ? null : 'activity')}
            >
              <Text style={styles.dropdownBtnText}>{selectedActivityFilter}</Text>
              <Ionicons name="chevron-down" size={16} color="#64748B" />
            </TouchableOpacity>
            
            {dropdownTarget === 'activity' && (
              <View style={[styles.dropdownModalCard, { position: 'absolute', top: '100%', right: 0, marginTop: 4, width: 140 }]}>
                {['All Activities', 'Doctor Visit', 'Chemist Visit', 'Order Booking'].map((type) => (
                  <TouchableOpacity 
                    key={type} 
                    style={styles.dropdownOptionBtn}
                    onPress={() => { setSelectedActivityFilter(type); setDropdownTarget(null); }}
                  >
                    <Text style={styles.dropdownOptionText}>{type}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={{ zIndex: dropdownTarget === 'export' ? 100 : 1, elevation: dropdownTarget === 'export' ? 100 : 1 }}>
            <TouchableOpacity 
              style={styles.exportBtn} 
              onPress={() => setDropdownTarget(dropdownTarget === 'export' ? null : 'export')}
            >
              <Ionicons name="download-outline" size={16} color="#334155" style={{ marginRight: 6 }} />
              <Text style={styles.exportBtnText}>Export</Text>
              <Ionicons name="chevron-down" size={14} color="#64748B" style={{ marginLeft: 6 }} />
            </TouchableOpacity>
            
            {dropdownTarget === 'export' && (
              <View style={[styles.dropdownModalCard, { position: 'absolute', bottom: '100%', right: 0, marginBottom: 4, width: 150 }]}>
                <TouchableOpacity style={styles.dropdownOptionBtn} onPress={handleExportCSV}>
                  <Text style={styles.dropdownOptionText}>Export as CSV</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.dropdownOptionBtn} onPress={handleExportPDF}>
                  <Text style={styles.dropdownOptionText}>Export as PDF</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Table */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -16 }}>
          <View style={styles.tableContainer}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.columnHeader, { width: 110 }]}>DATE</Text>
              <Text style={[styles.columnHeader, { width: 150 }]}>MR NAME</Text>
              <Text style={[styles.columnHeader, { width: 140 }]}>ACTIVITY TYPE</Text>
              <Text style={[styles.columnHeader, { width: 160 }]}>CUSTOMER</Text>
              <Text style={[styles.columnHeader, { width: 140 }]}>TERRITORY</Text>
              <Text style={[styles.columnHeader, { width: 120 }]}>STATUS</Text>
              <Text style={[styles.columnHeader, { width: 80, textAlign: 'center' }]}>ACTION</Text>
            </View>
            
            {/* Table Body */}
            {filteredActivities.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="folder-open-outline" size={48} color="#CBD5E1" />
                <Text style={styles.emptyStateText}>No activities found matching your criteria</Text>
              </View>
            ) : (
              filteredActivities.map((item, index) => (
                <View key={item.id} style={[styles.tableRow, index === filteredActivities.length - 1 && { borderBottomWidth: 0 }]}>
                  <Text style={[styles.cellText, { width: 110, color: '#64748B' }]}>{item.date}</Text>
                  <Text style={[styles.cellText, styles.cellName, { width: 150 }]}>{item.mrName}</Text>
                  
                  <View style={{ width: 140 }}>
                    <View style={styles.activityBadge}>
                      <Text style={styles.activityBadgeText}>{item.activityType}</Text>
                    </View>
                  </View>

                  <Text style={[styles.cellText, { width: 160 }]}>{item.customer}</Text>
                  <Text style={[styles.cellText, { width: 140 }]}>{item.territory}</Text>
                  
                  <View style={{ width: 120 }}>
                    <View style={[
                      styles.statusBadge, 
                      item.status === 'Completed' ? styles.statusSuccess : 
                      item.status === 'Pending' ? styles.statusWarning : 
                      styles.statusDanger
                    ]}>
                      <Text style={[
                        styles.statusText, 
                        item.status === 'Completed' ? styles.statusSuccessText : 
                        item.status === 'Pending' ? styles.statusWarningText : 
                        styles.statusDangerText
                      ]}>
                        {item.status}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={[styles.actionCell, { width: 80 }]}>
                    <TouchableOpacity style={styles.actionIcon} onPress={() => setViewingActivity(item)}>
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



      {/* View Activity Slide-in Panel */}
      <Modal visible={!!viewingActivity} transparent animationType="fade" onRequestClose={() => setViewingActivity(null)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setViewingActivity(null)} />
          <View style={styles.profilePanel}>
            <View style={styles.panelHeader}>
              <Text style={styles.panelTitle}>Activity Details</Text>
              <TouchableOpacity onPress={() => setViewingActivity(null)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            
            {viewingActivity && (
              <>
                <ScrollView showsVerticalScrollIndicator={false} style={{ padding: 20 }}>
                  
                  {/* 1. ACTIVITY INFORMATION */}
                  <Text style={styles.sectionHeading}>1. ACTIVITY INFORMATION</Text>
                  
                  <Text style={styles.detailLabel}>ACTIVITY DATE</Text>
                  <Text style={styles.detailValue}>{viewingActivity.date || '-'}</Text>
                  
                  <Text style={styles.detailLabel}>ACTIVITY TIME</Text>
                  <Text style={styles.detailValue}>{viewingActivity.activityTime || '-'}</Text>
                  
                  <Text style={styles.detailLabel}>ACTIVITY TYPE</Text>
                  <Text style={styles.detailValue}>{viewingActivity.activityType || '-'}</Text>
                  
                  <View style={styles.divider} />

                  {/* 2. MR INFORMATION */}
                  <Text style={styles.sectionHeading}>2. MR INFORMATION</Text>
                  
                  <Text style={styles.detailLabel}>MR CODE</Text>
                  <Text style={styles.detailValue}>{viewingActivity.mrCode || '-'}</Text>
                  
                  <Text style={styles.detailLabel}>MR NAME</Text>
                  <Text style={styles.detailValue}>{viewingActivity.mrName || '-'}</Text>
                  
                  <Text style={styles.detailLabel}>HEADQUARTERS</Text>
                  <Text style={styles.detailValue}>{viewingActivity.headquarters || '-'}</Text>
                  
                  <Text style={styles.detailLabel}>TERRITORY</Text>
                  <Text style={styles.detailValue}>{viewingActivity.territory || '-'}</Text>
                  
                  <View style={styles.divider} />

                  {/* 3. CUSTOMER INFORMATION */}
                  <Text style={styles.sectionHeading}>3. CUSTOMER INFORMATION</Text>
                  
                  <Text style={styles.detailLabel}>CUSTOMER TYPE</Text>
                  <Text style={styles.detailValue}>{viewingActivity.customerType || '-'}</Text>
                  
                  <Text style={styles.detailLabel}>CUSTOMER NAME</Text>
                  <Text style={styles.detailValue}>{viewingActivity.customer || '-'}</Text>
                  
                  <Text style={styles.detailLabel}>SPECIALTY</Text>
                  <Text style={styles.detailValue}>{viewingActivity.specialty || '-'}</Text>
                  
                  <Text style={styles.detailLabel}>CLINIC NAME</Text>
                  <Text style={styles.detailValue}>{viewingActivity.clinicName || '-'}</Text>
                  
                  <View style={styles.divider} />

                  {/* 4. ACTIVITY DETAILS */}
                  <Text style={styles.sectionHeading}>4. ACTIVITY DETAILS</Text>
                  
                  <Text style={styles.detailLabel}>PRODUCTS DISCUSSED</Text>
                  <Text style={styles.detailValue}>{viewingActivity.productsDiscussed || '-'}</Text>
                  
                  <Text style={styles.detailLabel}>SAMPLES GIVEN</Text>
                  <Text style={styles.detailValue}>{viewingActivity.samplesGiven || '-'}</Text>
                  
                  <Text style={styles.detailLabel}>REMARKS</Text>
                  <Text style={styles.detailValue}>{viewingActivity.remarks || '-'}</Text>
                  
                  <View style={styles.divider} />

                  {/* 5. VISIT INFORMATION */}
                  <Text style={styles.sectionHeading}>5. VISIT INFORMATION</Text>
                  
                  <Text style={styles.detailLabel}>GPS LOCATION</Text>
                  <Text style={styles.detailValue}>{viewingActivity.gpsLocation || '-'}</Text>
                  
                  <Text style={styles.detailLabel}>VISIT STATUS</Text>
                  <View style={[
                      styles.statusBadge, 
                      { marginBottom: 16, paddingHorizontal: 12, paddingVertical: 4 },
                      viewingActivity.status === 'Completed' ? styles.statusSuccess : 
                      viewingActivity.status === 'Pending' ? styles.statusWarning : 
                      styles.statusDanger
                    ]}>
                      <Text style={[
                        styles.statusText, 
                        viewingActivity.status === 'Completed' ? styles.statusSuccessText : 
                        viewingActivity.status === 'Pending' ? styles.statusWarningText : 
                        styles.statusDangerText
                      ]}>
                        {viewingActivity.status || '-'}
                      </Text>
                  </View>
                  
                  <Text style={styles.detailLabel}>CHECK-IN TIME</Text>
                  <Text style={styles.detailValue}>{viewingActivity.checkInTime || '-'}</Text>
                  
                  <Text style={styles.detailLabel}>CHECK-OUT TIME</Text>
                  <Text style={styles.detailValue}>{viewingActivity.checkOutTime || '-'}</Text>
                  
                  <View style={{ height: 40 }} />
                </ScrollView>

                <View style={styles.modalFooter}>
                  <TouchableOpacity style={styles.profileCloseBtn} onPress={() => setViewingActivity(null)}>
                    <Text style={styles.profileCloseBtnText}>Close Activity Details</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
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
  dropdownBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, paddingHorizontal: 10, height: 38 },
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
  
  activityBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' },
  activityBadgeText: { fontSize: 12, color: '#475569', fontWeight: '600' },

  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start', borderWidth: 1 },
  statusText: { fontSize: 12, fontWeight: 'bold' },
  statusSuccess: { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' },
  statusSuccessText: { color: '#059669' },
  statusWarning: { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' },
  statusWarningText: { color: '#D97706' },
  statusDanger: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
  statusDangerText: { color: '#DC2626' },
  
  actionCell: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  actionIcon: { padding: 4 },
  
  emptyState: { padding: 40, alignItems: 'center' },
  emptyStateText: { marginTop: 12, color: '#94A3B8', fontSize: 15 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', flexDirection: 'row' },
  profilePanel: { width: '85%', maxWidth: 420, backgroundColor: '#FFF', height: '100%', alignSelf: 'flex-end', shadowColor: '#000', shadowOffset: { width: -5, height: 0 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 15 },
  panelHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  panelTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  
  sectionHeading: { fontSize: 13, fontWeight: 'bold', color: '#1E293B', marginTop: 10, marginBottom: 16 },
  detailLabel: { fontSize: 11, fontWeight: '600', color: '#64748B', marginBottom: 4, textTransform: 'uppercase' },
  detailValue: { fontSize: 14, color: '#0F172A', marginBottom: 16 },
  divider: { height: 1, backgroundColor: '#E2E8F0', marginVertical: 8, marginBottom: 24 },
  
  modalFooter: { padding: 16, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  profileCloseBtn: { width: '100%', paddingVertical: 12, borderRadius: 8, backgroundColor: '#F8FAFC', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  profileCloseBtnText: { color: '#334155', fontWeight: 'bold', fontSize: 14 },
});

export default ASMDailyActivitiesScreen;
