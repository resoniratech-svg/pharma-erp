import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, TextInput, Platform, Modal, Alert, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
// REMOVED JSPDF
// REMOVED JSPDF

const INITIAL_DATA = [
  { id: '1', code: 'DIST001', name: 'Apollo Pharma', state: 'Maharashtra', asmName: 'Vikas Sharma', outstanding: '₹4,50,000', rawOutstanding: 450000, lastOrder: '2025-06-12', status: 'Active', contactPerson: 'Rahul Desai', phone: '9876543210', email: 'rahul@apollopharma.com', address: 'Andheri West, Mumbai, Maharashtra 400053', ytdSales: '₹24,00,000', creditLimit: '₹5,00,000', recentOrders: [{ id: 'ORD-1234', date: '2025-06-12', amount: '₹1,25,000', status: 'Delivered' }, { id: 'ORD-1230', date: '2025-06-01', amount: '₹95,000', status: 'Delivered' }], recentPayments: [{ date: '2025-06-10', mode: 'NEFT', ref: 'N123456789', amount: '₹1,00,000' }], recentVisits: [{ date: '2025-06-05', emp: 'Vikas Sharma (ASM)', type: 'Business Review', remarks: 'Positive - New line added' }] },
  { id: '2', code: 'DIST002', name: 'Gujarat Medicals', state: 'Gujarat', asmName: 'Amit Desai', outstanding: '₹8,50,000', rawOutstanding: 850000, lastOrder: '2025-05-28', status: 'At Risk', contactPerson: 'Sanjay Patel', phone: '9876543211', email: 'sanjay@gujmeds.com', address: 'Maninagar, Ahmedabad, Gujarat 380008', ytdSales: '₹12,00,000', creditLimit: '₹8,00,000', recentOrders: [], recentPayments: [], recentVisits: [] },
  { id: '3', code: 'DIST003', name: 'Pune Distributors', state: 'Maharashtra', asmName: 'Vikas Sharma', outstanding: '₹1,20,000', rawOutstanding: 120000, lastOrder: '2025-06-15', status: 'Active', contactPerson: 'Vijay Kumar', phone: '9876543212', email: 'vijay@punedist.com', address: 'Shivaji Nagar, Pune, Maharashtra 411005', ytdSales: '₹18,50,000', creditLimit: '₹4,00,000', recentOrders: [], recentPayments: [], recentVisits: [] },
  { id: '4', code: 'DIST004', name: 'Surat Pharma', state: 'Gujarat', asmName: 'Amit Desai', outstanding: '₹50,000', rawOutstanding: 50000, lastOrder: '2025-06-14', status: 'Active', contactPerson: 'Neha Shah', phone: '9876543213', email: 'neha@suratpharma.com', address: 'Adajan, Surat, Gujarat 395009', ytdSales: '₹10,00,000', creditLimit: '₹2,00,000', recentOrders: [], recentPayments: [], recentVisits: [] },
];

const TIME_FILTERS = ['This Month', 'Last Month', 'This Quarter', 'This Year'];
const STATUS_FILTERS = ['All Status', 'Active', 'At Risk'];

const RSMDistributorManagementScreen = () => {
  const navigation = useNavigation<any>();
  
  const [searchQuery, setSearchQuery] = useState('');
  
  // Dropdown states
  const [filterTime, setFilterTime] = useState('This Month');
  const [isTimeDropdownOpen, setIsTimeDropdownOpen] = useState(false);
  
  const [filterStatus, setFilterStatus] = useState('All Status');
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  
  // View Modal State
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [viewModalData, setViewModalData] = useState<any>(null);

  // Computed Filtered Data
  const filteredData = useMemo(() => {
    return INITIAL_DATA.filter(item => {
      const matchesStatus = filterStatus === 'All Status' || item.status === filterStatus;
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = item.code.toLowerCase().includes(searchLower) || 
                            item.name.toLowerCase().includes(searchLower) ||
                            item.state.toLowerCase().includes(searchLower) ||
                            item.asmName.toLowerCase().includes(searchLower);
      return matchesStatus && matchesSearch;
    });
  }, [searchQuery, filterStatus, filterTime]);

  // Computed Dynamic Stats
  const stats = useMemo(() => {
    const totalDistributors = filteredData.length;
    const activeDistributors = filteredData.filter(d => d.status === 'Active').length;
    const atRisk = filteredData.filter(d => d.status === 'At Risk').length;
    const totalOutstanding = filteredData.reduce((sum, item) => sum + item.rawOutstanding, 0);

    const formatCurrency = (amount: number) => {
      return '₹' + amount.toLocaleString('en-IN');
    };

    return {
      totalDistributors: totalDistributors.toString(),
      activeDistributors: activeDistributors.toString(),
      atRisk: atRisk.toString(),
      totalOutstanding: formatCurrency(totalOutstanding)
    };
  }, [filteredData]);

  const SUMMARY_CARDS = [
    { title: 'Total Distributors', value: stats.totalDistributors, icon: 'people-outline', color: '#3B82F6', bgColor: '#EFF6FF', subtext: '+2 vs last month' },
    { title: 'Active Distributors', value: stats.activeDistributors, icon: 'checkmark-circle-outline', color: '#10B981', bgColor: '#ECFDF5', subtext: '' },
    { title: 'Total Outstanding', value: stats.totalOutstanding, icon: 'cash-outline', color: '#F59E0B', bgColor: '#FEF3C7', subtext: '' },
    { title: 'At Risk', value: stats.atRisk, icon: 'warning-outline', color: '#EF4444', bgColor: '#FEF2F2', subtext: '-1 vs last month' },
  ];

  // Export - CSV
  const handleExportCSV = async () => {
    setIsExportMenuOpen(false);
    if (filteredData.length === 0) return Alert.alert('No Data', 'There is no data to export.');
    
    const header = 'DISTRIBUTOR CODE,DISTRIBUTOR NAME,STATE,MAPPED ASM,OUTSTANDING,LAST ORDER DATE,STATUS\n';
    const rows = filteredData.map(item => `${item.code},${item.name},${item.state},${item.asmName},"${item.outstanding}",${item.lastOrder},${item.status}`).join('\n');
    const csvContent = header + rows;

    if (Platform.OS === 'web') {
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', 'Distributor_Management_Export.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      await Share.share({ message: csvContent, title: 'Distributor_Management_Export.csv' });
    }
  };

  // Export - PDF
  const handleExportPDF = async () => {
    setIsExportMenuOpen(false);
    if (filteredData.length === 0) return Alert.alert('No Data', 'There is no data to export.');

    try {
      if (Platform.OS === 'web') {
        const doc = new jsPDF();
        doc.text("Distributor Management Report", 14, 15);
        autoTable(doc, {
          head: [["CODE", "NAME", "STATE", "ASM", "OUTSTANDING", "LAST ORDER", "STATUS"]],
          body: filteredData.map(item => [item.code, item.name, item.state, item.asmName, item.outstanding, item.lastOrder, item.status]),
          startY: 20,
        });
        doc.save('Distributor_Management_Export.pdf');
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
              <h1>Distributor Management Report</h1>
              <table>
                <tr><th>CODE</th><th>NAME</th><th>STATE</th><th>ASM</th><th>OUTSTANDING</th><th>LAST ORDER</th><th>STATUS</th></tr>
                ${filteredData.map(item => `
                  <tr><td>${item.code}</td><td>${item.name}</td><td>${item.state}</td><td>${item.asmName}</td><td>${item.outstanding}</td><td>${item.lastOrder}</td><td>${item.status}</td></tr>
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
    if (status === 'Active') return '#16A34A';
    if (status === 'At Risk') return '#EF4444';
    return '#475569';
  };
  const getStatusBg = (status: string) => {
    if (status === 'Active') return '#DCFCE7';
    if (status === 'At Risk') return '#FEF2F2';
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
            <Text style={styles.title}>Distributor Management</Text>
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
              {card.subtext ? <Text style={styles.cardSubtext}>{card.subtext}</Text> : null}
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
                placeholder="Search by code, name, state, or ASM..."
                placeholderTextColor="#94A3B8"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, { width: 140 }]}>DISTRIBUTOR CODE</Text>
                <Text style={[styles.tableHeaderText, { width: 180 }]}>DISTRIBUTOR NAME</Text>
                <Text style={[styles.tableHeaderText, { width: 120 }]}>STATE</Text>
                <Text style={[styles.tableHeaderText, { width: 140 }]}>MAPPED ASM</Text>
                <Text style={[styles.tableHeaderText, { width: 120 }]}>OUTSTANDING</Text>
                <Text style={[styles.tableHeaderText, { width: 140 }]}>LAST ORDER DATE</Text>
                <Text style={[styles.tableHeaderText, { width: 100 }]}>STATUS</Text>
                <Text style={[styles.tableHeaderText, { width: 80, textAlign: 'center' }]}>ACTION</Text>
              </View>
              {filteredData.map((item) => (
                <View key={item.id} style={styles.tableRow}>
                  <Text style={[styles.tableRowText, { width: 140, fontWeight: '600' }]}>{item.code}</Text>
                  <Text style={[styles.tableRowText, { width: 180, fontWeight: '600', color: '#1E293B' }]}>{item.name}</Text>
                  <Text style={[styles.tableRowText, { width: 120 }]}>{item.state}</Text>
                  <Text style={[styles.tableRowText, { width: 140 }]}>{item.asmName}</Text>
                  <Text style={[styles.tableRowText, { width: 120, color: item.status === 'At Risk' ? '#EF4444' : '#334155' }]}>{item.outstanding}</Text>
                  <Text style={[styles.tableRowText, { width: 140 }]}>{item.lastOrder}</Text>
                  <View style={{ width: 100, justifyContent: 'center' }}>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusBg(item.status), alignSelf: 'flex-start' }]}>
                      <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
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
              <Text style={styles.drawerTitle}>Distributor Details</Text>
              <TouchableOpacity onPress={() => setIsViewModalVisible(false)}><Ionicons name="close" size={24} color="#64748B" /></TouchableOpacity>
            </View>
            {viewModalData && (
              <ScrollView style={{ padding: 20 }} showsVerticalScrollIndicator={false}>
                
                {/* Profile Header */}
                <View style={{ marginBottom: 24 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                    <Text style={{ fontSize: 20, fontWeight: '700', color: '#0F172A', marginRight: 12 }}>{viewModalData.name}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusBg(viewModalData.status) }]}>
                      <Text style={[styles.statusText, { color: getStatusColor(viewModalData.status) }]}>{viewModalData.status}</Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 13, color: '#64748B' }}>Code: {viewModalData.code}</Text>
                </View>

                {/* DISTRIBUTOR INFORMATION */}
                <View style={styles.sectionHeaderRow}>
                  <Ionicons name="business-outline" size={16} color="#4F46E5" />
                  <Text style={styles.sectionHeaderTitle}>DISTRIBUTOR INFORMATION</Text>
                </View>
                <View style={styles.cardBlock}>
                  <View style={styles.rowTwoCols}>
                    <View style={styles.col}>
                      <Text style={styles.smLabel}>Contact Person</Text>
                      <Text style={styles.mdValue}>{viewModalData.contactPerson}</Text>
                    </View>
                    <View style={styles.col}>
                      <Text style={styles.smLabel}><Ionicons name="call-outline" size={12}/> Phone</Text>
                      <Text style={styles.mdValue}>{viewModalData.phone}</Text>
                    </View>
                  </View>
                  <View style={styles.rowTwoCols}>
                    <View style={styles.col}>
                      <Text style={styles.smLabel}><Ionicons name="mail-outline" size={12}/> Email</Text>
                      <Text style={styles.mdValue}>{viewModalData.email}</Text>
                    </View>
                    <View style={styles.col}>
                      <Text style={styles.smLabel}><Ionicons name="location-outline" size={12}/> Address</Text>
                      <Text style={styles.mdValue}>{viewModalData.address}</Text>
                    </View>
                  </View>
                  <View style={styles.rowTwoCols}>
                    <View style={styles.col}>
                      <Text style={styles.smLabel}>State</Text>
                      <Text style={styles.mdValue}>{viewModalData.state}</Text>
                    </View>
                    <View style={styles.col}>
                      <Text style={styles.smLabel}>Mapped ASM</Text>
                      <Text style={[styles.mdValue, { color: '#4F46E5' }]}>{viewModalData.asmName}</Text>
                    </View>
                  </View>
                </View>

                {/* BUSINESS SUMMARY */}
                <View style={styles.sectionHeaderRow}>
                  <Ionicons name="pulse-outline" size={16} color="#4F46E5" />
                  <Text style={styles.sectionHeaderTitle}>BUSINESS SUMMARY</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
                  <View style={[styles.cardBlock, { flex: 1, marginBottom: 0 }]}>
                    <Text style={styles.smLabel}>YTD Sales</Text>
                    <Text style={{ fontSize: 18, fontWeight: '700', color: '#16A34A', marginTop: 4 }}>{viewModalData.ytdSales}</Text>
                  </View>
                  <View style={[styles.cardBlock, { flex: 1, marginBottom: 0 }]}>
                    <Text style={styles.smLabel}>Current Outstanding</Text>
                    <Text style={{ fontSize: 18, fontWeight: '700', color: '#0F172A', marginTop: 4 }}>{viewModalData.outstanding}</Text>
                    <Text style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>Credit Limit: {viewModalData.creditLimit}</Text>
                  </View>
                </View>

                {/* RECENT ORDERS */}
                <View style={styles.sectionHeaderRow}>
                  <Ionicons name="cart-outline" size={16} color="#4F46E5" />
                  <Text style={styles.sectionHeaderTitle}>RECENT ORDERS</Text>
                </View>
                <View style={[styles.cardBlock, { padding: 0 }]}>
                  <View style={styles.tableHeader}>
                    <Text style={[styles.th, { flex: 1 }]}>Order ID</Text>
                    <Text style={[styles.th, { flex: 1 }]}>Date</Text>
                    <Text style={[styles.th, { flex: 1 }]}>Amount</Text>
                    <Text style={[styles.th, { flex: 1 }]}>Status</Text>
                  </View>
                  {viewModalData.recentOrders?.map((order: any, idx: number) => (
                    <View key={idx} style={[styles.tableRow, idx === viewModalData.recentOrders.length - 1 && { borderBottomWidth: 0 }]}>
                      <Text style={[styles.td, { flex: 1, color: '#4F46E5', fontWeight: '500' }]}>{order.id}</Text>
                      <Text style={[styles.td, { flex: 1 }]}>{order.date}</Text>
                      <Text style={[styles.td, { flex: 1 }]}>{order.amount}</Text>
                      <View style={{ flex: 1, alignItems: 'flex-start' }}>
                        <View style={[styles.statusBadge, { backgroundColor: '#DCFCE7', paddingVertical: 2, paddingHorizontal: 6 }]}>
                          <Text style={[styles.statusText, { color: '#16A34A', fontSize: 10 }]}>{order.status}</Text>
                        </View>
                      </View>
                    </View>
                  ))}
                  {(!viewModalData.recentOrders || viewModalData.recentOrders.length === 0) && <Text style={{ padding: 12, fontSize: 12, color: '#94A3B8' }}>No recent orders.</Text>}
                </View>

                {/* RECENT PAYMENTS */}
                <View style={styles.sectionHeaderRow}>
                  <Ionicons name="card-outline" size={16} color="#4F46E5" />
                  <Text style={styles.sectionHeaderTitle}>RECENT PAYMENTS</Text>
                </View>
                <View style={[styles.cardBlock, { padding: 0 }]}>
                  <View style={styles.tableHeader}>
                    <Text style={[styles.th, { flex: 1 }]}>Date</Text>
                    <Text style={[styles.th, { flex: 1 }]}>Mode</Text>
                    <Text style={[styles.th, { flex: 1.5 }]}>Reference</Text>
                    <Text style={[styles.th, { flex: 1 }]}>Amount</Text>
                  </View>
                  {viewModalData.recentPayments?.map((pay: any, idx: number) => (
                    <View key={idx} style={[styles.tableRow, idx === viewModalData.recentPayments.length - 1 && { borderBottomWidth: 0 }]}>
                      <Text style={[styles.td, { flex: 1 }]}>{pay.date}</Text>
                      <Text style={[styles.td, { flex: 1 }]}>{pay.mode}</Text>
                      <Text style={[styles.td, { flex: 1.5, color: '#64748B' }]}>{pay.ref}</Text>
                      <Text style={[styles.td, { flex: 1, color: '#16A34A', fontWeight: '600' }]}>{pay.amount}</Text>
                    </View>
                  ))}
                  {(!viewModalData.recentPayments || viewModalData.recentPayments.length === 0) && <Text style={{ padding: 12, fontSize: 12, color: '#94A3B8' }}>No recent payments.</Text>}
                </View>

                {/* RECENT VISITS */}
                <View style={styles.sectionHeaderRow}>
                  <Ionicons name="people-outline" size={16} color="#4F46E5" />
                  <Text style={styles.sectionHeaderTitle}>RECENT VISITS</Text>
                </View>
                <View style={[styles.cardBlock, { padding: 0, marginBottom: 40 }]}>
                  <View style={styles.tableHeader}>
                    <Text style={[styles.th, { flex: 1 }]}>Visit Date</Text>
                    <Text style={[styles.th, { flex: 1.2 }]}>Employee Name</Text>
                    <Text style={[styles.th, { flex: 1 }]}>Visit Type</Text>
                    <Text style={[styles.th, { flex: 1.5 }]}>Remarks</Text>
                  </View>
                  {viewModalData.recentVisits?.map((visit: any, idx: number) => (
                    <View key={idx} style={[styles.tableRow, idx === viewModalData.recentVisits.length - 1 && { borderBottomWidth: 0 }]}>
                      <Text style={[styles.td, { flex: 1 }]}>{visit.date}</Text>
                      <Text style={[styles.td, { flex: 1.2 }]}>{visit.emp}</Text>
                      <Text style={[styles.td, { flex: 1 }]}>{visit.type}</Text>
                      <Text style={[styles.td, { flex: 1.5, fontSize: 11, color: '#64748B' }]}>{visit.remarks}</Text>
                    </View>
                  ))}
                  {(!viewModalData.recentVisits || viewModalData.recentVisits.length === 0) && <Text style={{ padding: 12, fontSize: 12, color: '#94A3B8' }}>No recent visits.</Text>}
                </View>

              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

export default RSMDistributorManagementScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', zIndex: 10 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  backBtn: { padding: 4, marginRight: 12, backgroundColor: '#F1F5F9', borderRadius: 8 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#0F172A' },
  exportBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  exportBtnText: { marginLeft: 6, fontSize: 14, fontWeight: '500', color: '#475569' },
  
  scrollContent: { padding: 16, paddingBottom: 40 },
  
  cardsRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 },
  card: { width: '48%', backgroundColor: '#FFF', padding: 16, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  iconContainer: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  cardTitle: { fontSize: 12, color: '#64748B', fontWeight: '500', marginBottom: 4 },
  cardValue: { fontSize: 22, fontWeight: 'bold', color: '#0F172A' },
  cardSubtext: { fontSize: 11, color: '#94A3B8', marginTop: 4 },
  
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
  drawerCard: { backgroundColor: '#F8FAFC', width: '85%', maxWidth: 450, height: '100%', shadowColor: '#000', shadowOffset: { width: -2, height: 0 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  drawerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  drawerTitle: { fontSize: 16, fontWeight: 'bold', color: '#0F172A' },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, marginTop: 8 },
  sectionHeaderTitle: { fontSize: 12, fontWeight: '700', color: '#1E293B', marginLeft: 8, letterSpacing: 0.5 },
  cardBlock: { backgroundColor: '#FFF', borderRadius: 8, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: '#E2E8F0' },
  rowTwoCols: { flexDirection: 'row', marginBottom: 16 },
  col: { flex: 1, paddingRight: 8 },
  smLabel: { fontSize: 11, color: '#64748B', marginBottom: 4 },
  mdValue: { fontSize: 13, color: '#0F172A', fontWeight: '500' },
  th: { fontSize: 11, fontWeight: '600', color: '#64748B' },
  td: { fontSize: 12, color: '#334155' },
  closeDrawerBtn: { backgroundColor: '#F1F5F9', paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginTop: 20, marginBottom: 40 },
  closeDrawerBtnText: { color: '#475569', fontWeight: '600', fontSize: 14 }
});
