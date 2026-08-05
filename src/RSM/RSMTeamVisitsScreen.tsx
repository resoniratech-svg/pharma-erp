import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, TextInput, Platform, Modal, Alert, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const INITIAL_DATA = [
  { id: '1', visitDate: '2026-08-01', asmName: 'Vikas Sharma', mrName: 'Rahul Verma', visitType: 'Doctor Visit', visitStatus: 'Completed', details: 'Discussed new cardiology range. Positive response.', state: 'Maharashtra', territory: 'Mumbai Central', hq: 'Mumbai', doctorName: 'Dr. Suresh Patel', specialty: 'Cardiology', checkIn: '10:00 AM', checkOut: '10:45 AM', duration: '45 mins', gps: '123 Health Clinic, Andheri West, Mumbai\n19.1136° N, 72.8697° E', jointVisit: 'No' },
  { id: '2', visitDate: '2026-08-01', asmName: 'Amit Desai', mrName: 'Sneha Patel', visitType: 'Chemist Visit', visitStatus: 'Completed', details: 'Checked stock availability for seasonal flu meds.', state: 'Gujarat', territory: 'Ahmedabad East', hq: 'Ahmedabad', doctorName: 'N/A', specialty: 'N/A', checkIn: '11:00 AM', checkOut: '11:20 AM', duration: '20 mins', gps: 'Patel Pharmacy, Maninagar, Ahmedabad', jointVisit: 'Yes' },
  { id: '3', visitDate: '2026-08-02', asmName: 'Kiran Rao', mrName: 'Vivek Shetty', visitType: 'Joint Field Work', visitStatus: 'Planned', details: 'Scheduled joint visit in South region.', state: 'Karnataka', territory: 'Bangalore South', hq: 'Bangalore', doctorName: 'Dr. Ramesh Kumar', specialty: 'Neurology', checkIn: '-', checkOut: '-', duration: '-', gps: '-', jointVisit: 'Yes' },
  { id: '4', visitDate: '2026-07-28', asmName: 'Arjun Singh', mrName: 'Priya Kapoor', visitType: 'Doctor Visit', visitStatus: 'Missed', details: 'Doctor was unavailable.', state: 'Delhi', territory: 'South Delhi', hq: 'Delhi', doctorName: 'Dr. Kavita Verma', specialty: 'Pediatrics', checkIn: '-', checkOut: '-', duration: '-', gps: '-', jointVisit: 'No' },
];

const TIME_FILTERS = ['All', 'This Month', 'Last Month', 'Quarter', 'Financial Year'];
const STATUS_FILTERS = ['All', 'Completed', 'Planned', 'Missed'];

const RSMTeamVisitsScreen = () => {
  const navigation = useNavigation<any>();
  
  const [searchQuery, setSearchQuery] = useState('');
  
  // Dropdown states
  const [filterTime, setFilterTime] = useState('This Month');
  const [isTimeDropdownOpen, setIsTimeDropdownOpen] = useState(false);
  
  const [filterStatus, setFilterStatus] = useState('All');
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  
  // View Modal State
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [viewModalData, setViewModalData] = useState<any>(null);

  // Computed Filtered Data
  const filteredData = useMemo(() => {
    return INITIAL_DATA.filter(item => {
      const matchesStatus = filterStatus === 'All' || item.visitStatus === filterStatus;
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = item.asmName.toLowerCase().includes(searchLower) || 
                            item.mrName.toLowerCase().includes(searchLower) ||
                            item.visitType.toLowerCase().includes(searchLower);
      return matchesStatus && matchesSearch;
    });
  }, [searchQuery, filterStatus, filterTime]);

  // Computed Dynamic Stats
  const stats = useMemo(() => {
    const totalVisits = filteredData.length;
    const completedVisits = filteredData.filter(d => d.visitStatus === 'Completed').length;
    const pendingVisits = filteredData.filter(d => d.visitStatus === 'Planned').length;
    const compliance = totalVisits > 0 ? ((completedVisits / totalVisits) * 100).toFixed(1) : '0.0';

    return {
      totalVisits: totalVisits.toString(),
      completedVisits: completedVisits.toString(),
      pendingVisits: pendingVisits.toString(),
      compliance: `${compliance}%`
    };
  }, [filteredData]);

  const SUMMARY_CARDS = [
    { title: 'Total Visits', value: stats.totalVisits, icon: 'calendar-outline', color: '#3B82F6', bgColor: '#EFF6FF' },
    { title: 'Completed Visits', value: stats.completedVisits, icon: 'checkmark-circle-outline', color: '#10B981', bgColor: '#ECFDF5' },
    { title: 'Pending Visits', value: stats.pendingVisits, icon: 'time-outline', color: '#F59E0B', bgColor: '#FEF3C7' },
    { title: 'Visit Compliance %', value: stats.compliance, icon: 'shield-checkmark-outline', color: '#8B5CF6', bgColor: '#F5F3FF' },
  ];

  // Export - CSV
  const handleExportCSV = async () => {
    setIsExportMenuOpen(false);
    if (filteredData.length === 0) return Alert.alert('No Data', 'There is no data to export.');
    
    const header = 'VISIT DATE,ASM NAME,MR NAME,VISIT TYPE,VISIT STATUS\n';
    const rows = filteredData.map(item => `${item.visitDate},${item.asmName},${item.mrName},${item.visitType},${item.visitStatus}`).join('\n');
    const csvContent = header + rows;

    if (Platform.OS === 'web') {
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', 'Team_Visits_Export.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      await Share.share({ message: csvContent, title: 'Team_Visits_Export.csv' });
    }
  };

  // Export - PDF
  const handleExportPDF = async () => {
    setIsExportMenuOpen(false);
    if (filteredData.length === 0) return Alert.alert('No Data', 'There is no data to export.');

    try {
      if (Platform.OS === 'web') {
        const doc = new jsPDF();
        doc.text("Team Visits Report", 14, 15);
        autoTable(doc, {
          head: [["VISIT DATE", "ASM NAME", "MR NAME", "VISIT TYPE", "VISIT STATUS"]],
          body: filteredData.map(item => [item.visitDate, item.asmName, item.mrName, item.visitType, item.visitStatus]),
          startY: 20,
        });
        doc.save('Team_Visits_Export.pdf');
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
              <h1>Team Visits Report</h1>
              <table>
                <tr><th>VISIT DATE</th><th>ASM NAME</th><th>MR NAME</th><th>VISIT TYPE</th><th>VISIT STATUS</th></tr>
                ${filteredData.map(item => `
                  <tr><td>${item.visitDate}</td><td>${item.asmName}</td><td>${item.mrName}</td><td>${item.visitType}</td><td>${item.visitStatus}</td></tr>
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
    if (status === 'Completed') return '#16A34A';
    if (status === 'Planned') return '#D97706';
    if (status === 'Missed') return '#EF4444';
    return '#475569';
  };
  const getStatusBg = (status: string) => {
    if (status === 'Completed') return '#DCFCE7';
    if (status === 'Planned') return '#FEF3C7';
    if (status === 'Missed') return '#FEE2E2';
    return '#F1F5F9';
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.navigate('RSMDashboard')} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#0F172A" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Team Visits</Text>
            <Text style={styles.subtitle} numberOfLines={2}>Monitor field activities, joint visits, and check-ins for your ASMs and MRs.</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.exportBtn} onPress={() => setIsExportMenuOpen(true)}>
          <Ionicons name="download-outline" size={16} color="#475569" />
          <Text style={styles.exportBtnText}>Export</Text>
          <Ionicons name="chevron-down" size={16} color="#475569" style={{ marginLeft: 4 }} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.cardsRow}>
          {SUMMARY_CARDS.map((card, idx) => (
            <View key={idx} style={styles.card}>
              <View style={[styles.iconContainer, { backgroundColor: card.bgColor }]}>
                <Ionicons name={card.icon as any} size={20} color={card.color} />
              </View>
              <Text style={styles.cardTitle}>{card.title}</Text>
              <Text style={styles.cardValue}>{card.value}</Text>
            </View>
          ))}
        </View>

        <View style={styles.tableContainer}>
          <View style={styles.filterRow}>
            <View style={styles.dropdownsGroup}>
              <TouchableOpacity style={styles.dropdown} onPress={() => setIsTimeDropdownOpen(true)}>
                <Text style={styles.dropdownText}>{filterTime}</Text>
                <Ionicons name="chevron-down" size={16} color="#64748B" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.dropdown} onPress={() => setIsStatusDropdownOpen(true)}>
                <Text style={styles.dropdownText}>{filterStatus}</Text>
                <Ionicons name="chevron-down" size={16} color="#64748B" />
              </TouchableOpacity>
            </View>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={18} color="#94A3B8" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search ASM, MR, Doctor, Chemist..."
                placeholderTextColor="#94A3B8"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, { width: 120 }]}>VISIT DATE</Text>
                <Text style={[styles.tableHeaderText, { width: 160 }]}>ASM NAME</Text>
                <Text style={[styles.tableHeaderText, { width: 160 }]}>MR NAME</Text>
                <Text style={[styles.tableHeaderText, { width: 140 }]}>VISIT TYPE</Text>
                <Text style={[styles.tableHeaderText, { width: 120 }]}>VISIT STATUS</Text>
                <Text style={[styles.tableHeaderText, { width: 80, textAlign: 'center' }]}>ACTION</Text>
              </View>
              {filteredData.map((item) => (
                <View key={item.id} style={styles.tableRow}>
                  <Text style={[styles.tableRowText, { width: 120, fontWeight: '600' }]}>{item.visitDate}</Text>
                  <Text style={[styles.tableRowText, { width: 160, fontWeight: '600' }]}>{item.asmName}</Text>
                  <Text style={[styles.tableRowText, { width: 160 }]}>{item.mrName}</Text>
                  <Text style={[styles.tableRowText, { width: 140 }]}>{item.visitType}</Text>
                  <View style={{ width: 120, justifyContent: 'center' }}>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusBg(item.visitStatus), alignSelf: 'flex-start' }]}>
                      <Text style={[styles.statusText, { color: getStatusColor(item.visitStatus) }]}>{item.visitStatus}</Text>
                    </View>
                  </View>
                  <View style={{ width: 80, alignItems: 'center', justifyContent: 'center' }}>
                    <TouchableOpacity onPress={() => { setViewModalData(item); setIsViewModalVisible(true); }}>
                      <Ionicons name="eye-outline" size={20} color="#94A3B8" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </ScrollView>

      {/* Popovers & Modals */}
      <Modal visible={isTimeDropdownOpen} transparent animationType="fade">
        <TouchableOpacity style={[styles.modalOverlay, { backgroundColor: 'transparent' }]} activeOpacity={1} onPress={() => setIsTimeDropdownOpen(false)}>
          <View style={[styles.dropdownModalCard, { position: 'absolute', top: 280, left: 16, maxWidth: 180, paddingVertical: 8, elevation: 5, shadowOpacity: 0.1, shadowRadius: 10 }]}>
            {TIME_FILTERS.map((opt) => (
              <TouchableOpacity key={opt} style={{ paddingVertical: 10, paddingHorizontal: 16, backgroundColor: filterTime === opt ? '#F8FAFC' : '#FFF' }} onPress={() => { setFilterTime(opt); setIsTimeDropdownOpen(false); }}>
                <Text style={[{ fontSize: 13, color: '#334155' }, filterTime === opt && { color: '#0F172A', fontWeight: '600' }]}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={isStatusDropdownOpen} transparent animationType="fade">
        <TouchableOpacity style={[styles.modalOverlay, { backgroundColor: 'transparent' }]} activeOpacity={1} onPress={() => setIsStatusDropdownOpen(false)}>
          <View style={[styles.dropdownModalCard, { position: 'absolute', top: 280, left: 160, maxWidth: 180, paddingVertical: 8, elevation: 5, shadowOpacity: 0.1, shadowRadius: 10 }]}>
            {STATUS_FILTERS.map((opt) => (
              <TouchableOpacity key={opt} style={{ paddingVertical: 10, paddingHorizontal: 16, backgroundColor: filterStatus === opt ? '#F8FAFC' : '#FFF' }} onPress={() => { setFilterStatus(opt); setIsStatusDropdownOpen(false); }}>
                <Text style={[{ fontSize: 13, color: '#334155' }, filterStatus === opt && { color: '#0F172A', fontWeight: '600' }]}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={isExportMenuOpen} transparent animationType="fade">
        <TouchableOpacity style={[styles.modalOverlay, { backgroundColor: 'transparent' }]} activeOpacity={1} onPress={() => setIsExportMenuOpen(false)}>
          <View style={[styles.dropdownModalCard, { position: 'absolute', top: 70, right: 16, maxWidth: 200, paddingVertical: 8, elevation: 5, shadowOpacity: 0.1, shadowRadius: 10 }]}>
            <TouchableOpacity style={{ paddingVertical: 10, paddingHorizontal: 16, backgroundColor: '#FFF', flexDirection: 'row', alignItems: 'center' }} onPress={handleExportCSV}>
              <Ionicons name="document-text-outline" size={16} color="#334155" style={{ marginRight: 8 }} />
              <Text style={{ fontSize: 13, color: '#334155' }}>Export as CSV</Text>
            </TouchableOpacity>
            <View style={{ height: 1, backgroundColor: '#F1F5F9' }} />
            <TouchableOpacity style={{ paddingVertical: 10, paddingHorizontal: 16, backgroundColor: '#FFF', flexDirection: 'row', alignItems: 'center' }} onPress={handleExportPDF}>
              <Ionicons name="document-outline" size={16} color="#334155" style={{ marginRight: 8 }} />
              <Text style={{ fontSize: 13, color: '#334155' }}>Export as PDF</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={isViewModalVisible} animationType="slide" transparent={true}>
        <View style={styles.drawerOverlay}>
          <View style={styles.drawerCard}>
            <View style={styles.drawerHeader}>
              <Text style={styles.drawerTitle}>Visit Details</Text>
              <TouchableOpacity onPress={() => setIsViewModalVisible(false)}><Ionicons name="close" size={24} color="#64748B" /></TouchableOpacity>
            </View>
            {viewModalData && (
              <ScrollView style={{ padding: 20 }} showsVerticalScrollIndicator={false}>
                <Text style={styles.sectionHeader}>BASIC INFORMATION</Text>
                <View style={styles.drawerField}>
                  <Text style={styles.drawerLabel}>VISIT DATE</Text>
                  <Text style={styles.drawerValue}>{viewModalData.visitDate}</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.drawerField}>
                  <Text style={styles.drawerLabel}>VISIT TYPE</Text>
                  <Text style={styles.drawerValue}>{viewModalData.visitType}</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.drawerField}>
                  <Text style={styles.drawerLabel}>VISIT STATUS</Text>
                  <View style={[styles.statusBadge, { alignSelf: 'flex-start', backgroundColor: getStatusBg(viewModalData.visitStatus) }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(viewModalData.visitStatus) }]}>{viewModalData.visitStatus}</Text>
                  </View>
                </View>

                <Text style={styles.sectionHeader}>EMPLOYEE INFORMATION</Text>
                <View style={styles.drawerField}>
                  <Text style={styles.drawerLabel}>ASM NAME</Text>
                  <Text style={styles.drawerValue}>{viewModalData.asmName}</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.drawerField}>
                  <Text style={styles.drawerLabel}>MR NAME</Text>
                  <Text style={styles.drawerValue}>{viewModalData.mrName}</Text>
                </View>

                <Text style={styles.sectionHeader}>LOCATION INFORMATION</Text>
                <View style={styles.drawerField}>
                  <Text style={styles.drawerLabel}>STATE</Text>
                  <Text style={styles.drawerValue}>{viewModalData.state}</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.drawerField}>
                  <Text style={styles.drawerLabel}>TERRITORY</Text>
                  <Text style={styles.drawerValue}>{viewModalData.territory}</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.drawerField}>
                  <Text style={styles.drawerLabel}>HEADQUARTERS</Text>
                  <Text style={styles.drawerValue}>{viewModalData.hq}</Text>
                </View>

                <Text style={styles.sectionHeader}>CUSTOMER INFORMATION</Text>
                <View style={styles.drawerField}>
                  <Text style={styles.drawerLabel}>DOCTOR NAME</Text>
                  <Text style={styles.drawerValue}>{viewModalData.doctorName}</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.drawerField}>
                  <Text style={styles.drawerLabel}>SPECIALTY</Text>
                  <Text style={styles.drawerValue}>{viewModalData.specialty}</Text>
                </View>

                <Text style={styles.sectionHeader}>VISIT INFORMATION</Text>
                <View style={styles.drawerField}>
                  <Text style={styles.drawerLabel}>CHECK-IN TIME</Text>
                  <Text style={styles.drawerValue}>{viewModalData.checkIn}</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.drawerField}>
                  <Text style={styles.drawerLabel}>CHECK-OUT TIME</Text>
                  <Text style={styles.drawerValue}>{viewModalData.checkOut}</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.drawerField}>
                  <Text style={styles.drawerLabel}>DURATION</Text>
                  <Text style={styles.drawerValue}>{viewModalData.duration}</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.drawerField}>
                  <Text style={styles.drawerLabel}>GPS LOCATION</Text>
                  <Text style={styles.drawerValue}>{viewModalData.gps}</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.drawerField}>
                  <Text style={styles.drawerLabel}>JOINT VISIT</Text>
                  <Text style={styles.drawerValue}>{viewModalData.jointVisit}</Text>
                </View>

                <Text style={styles.sectionHeader}>VISIT REMARKS</Text>
                <View style={styles.remarksBox}>
                  <Text style={styles.remarksText}>{viewModalData.details}</Text>
                </View>

                <TouchableOpacity style={styles.closeDrawerBtn} onPress={() => setIsViewModalVisible(false)}>
                  <Text style={styles.closeDrawerBtnText}>Close</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

export default RSMTeamVisitsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', zIndex: 10 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  backBtn: { padding: 4, marginRight: 12, backgroundColor: '#F1F5F9', borderRadius: 8 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#0F172A' },
  subtitle: { fontSize: 13, color: '#64748B', marginTop: 2 },
  exportBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  exportBtnText: { marginLeft: 6, fontSize: 14, fontWeight: '500', color: '#475569' },
  
  scrollContent: { padding: 16, paddingBottom: 40 },
  
  cardsRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 },
  card: { width: '48%', backgroundColor: '#FFF', padding: 16, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  iconContainer: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  cardTitle: { fontSize: 12, color: '#64748B', fontWeight: '500', marginBottom: 4 },
  cardValue: { fontSize: 22, fontWeight: 'bold', color: '#0F172A' },
  
  tableContainer: { backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', overflow: 'hidden' },
  filterRow: { flexDirection: 'column', gap: 12, padding: 16, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', backgroundColor: '#F8FAFC' },
  dropdownsGroup: { flexDirection: 'row', gap: 12 },
  dropdown: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8 },
  dropdownText: { fontSize: 14, color: '#334155' },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, paddingHorizontal: 12, height: 40 },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14, color: '#0F172A', outlineStyle: 'none' },
  
  tableHeader: { flexDirection: 'row', backgroundColor: '#F1F5F9', paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  tableHeaderText: { fontSize: 12, fontWeight: 'bold', color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5 },
  tableRow: { flexDirection: 'row', paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', alignItems: 'center' },
  tableRowText: { fontSize: 14, color: '#334155' },
  
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, alignItems: 'center' },
  statusText: { fontSize: 12, fontWeight: '600' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.5)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  dropdownModalCard: { backgroundColor: '#FFF', width: '100%', maxWidth: 300, borderRadius: 12, overflow: 'hidden' },
  
  drawerOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.5)', flexDirection: 'row', justifyContent: 'flex-end' },
  drawerCard: { backgroundColor: '#FFF', width: '85%', maxWidth: 400, height: '100%', shadowColor: '#000', shadowOffset: { width: -2, height: 0 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  drawerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  drawerTitle: { fontSize: 16, fontWeight: 'bold', color: '#0F172A' },
  sectionHeader: { fontSize: 11, fontWeight: '700', color: '#94A3B8', marginTop: 16, marginBottom: 16, textTransform: 'uppercase', letterSpacing: 0.5 },
  drawerField: { marginBottom: 16 },
  drawerLabel: { fontSize: 11, fontWeight: '600', color: '#64748B', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  drawerValue: { fontSize: 14, color: '#1E293B', fontWeight: '500' },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 8, marginBottom: 16 },
  remarksBox: { backgroundColor: '#F8FAFC', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', marginTop: 4 },
  remarksText: { fontSize: 13, color: '#475569', lineHeight: 18 },
  closeDrawerBtn: { backgroundColor: '#F1F5F9', paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginTop: 20, marginBottom: 40 },
  closeDrawerBtnText: { color: '#475569', fontWeight: '600', fontSize: 14 }
});
