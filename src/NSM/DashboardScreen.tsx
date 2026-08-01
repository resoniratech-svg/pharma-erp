import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Modal,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export const NSM_ROUTES = {
  DASHBOARD: 'NSMDashboard',
  SALES_OPERATIONS: 'NSMSalesOperations',
  TARGET: 'NSMTargetPlanning',
  STATE: 'NSMStatePerformance',
  RSM_SUPERVISION: 'NSMRSMMonitoring',
  TEAM_PERFORMANCE: 'NSMTeamPerformance',
  TEAM_VISITS: 'NSMTeamVisits',
  ATTENDANCE: 'NSMAttendanceMonitoring',
  SETTINGS: 'NSMSettings',
  NOTIFICATIONS: 'NSMNotifications',
  PROFILE: 'NSMSettings',
  AUTH: 'Auth',
};

const NSMDashboardScreen = () => {
  const navigation = useNavigation<any>();

  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [selectedYear] = useState('2026-2027');
  const [selectedMonth] = useState('August');
  const [selectedRegion] = useState('All Regions');
  const [selectedState] = useState('All States');

  // 11 Production KPI Cards
  const kpiData = {
    totalSales: '₹1,24,50,000',
    salesTarget: '₹1,50,00,000',
    achievementPercent: '83.0%',
    totalRSMs: 8,
    totalASMs: 32,
    totalMRs: 140,
    totalOrders: '12,450',
    totalDoctorVisits: '36,200',
    totalChemistVisits: '14,800',
    activeStates: 28,
    pendingApprovals: 9,
    lastUpdated: '01 Aug 2026, 10:30 AM',
  };

  // Charts Data
  const monthlyTrend = [
    { month: 'Apr', sales: '₹1.10Cr', target: '₹1.25Cr', pct: 88 },
    { month: 'May', sales: '₹1.25Cr', target: '₹1.25Cr', pct: 100 },
    { month: 'Jun', sales: '₹1.15Cr', target: '₹1.25Cr', pct: 92 },
    { month: 'Jul', sales: '₹1.30Cr', target: '₹1.25Cr', pct: 104 },
    { month: 'Aug', sales: '₹1.24Cr', target: '₹1.50Cr', pct: 83 },
  ];

  const regionSales = [
    { region: 'North', sales: '₹34.5Cr', pct: '92.0%', color: '#4F46E5' },
    { region: 'South', sales: '₹42.0Cr', pct: '102.5%', color: '#059669' },
    { region: 'East', sales: '₹21.0Cr', pct: '78.0%', color: '#D97706' },
    { region: 'West', sales: '₹27.0Cr', pct: '88.5%', color: '#7E22CE' },
  ];

  // Top Performing States Table
  const topStates = [
    { state: 'Karnataka', target: '₹18.00 Cr', achieved: '₹19.50 Cr', percent: '108.3%' },
    { state: 'Maharashtra', target: '₹15.00 Cr', achieved: '₹13.50 Cr', percent: '90.0%' },
    { state: 'Gujarat', target: '₹12.00 Cr', achieved: '₹9.50 Cr', percent: '79.2%' },
  ];

  // Top Performing RSM Table
  const topRSMs = [
    { rsm: 'Priya Sharma', region: 'South Zone', target: '₹18.00 Cr', achieved: '₹19.50 Cr', grade: 'Star Performer' },
    { rsm: 'Arun Kumar', region: 'West Zone', target: '₹15.00 Cr', achieved: '₹13.50 Cr', grade: 'Top Performer' },
    { rsm: 'Rajesh Singh', region: 'North Zone', target: '₹12.00 Cr', achieved: '₹9.50 Cr', grade: 'On Track' },
  ];

  const handleRefresh = () => {
    Alert.alert('↻ Dashboard Refreshed', 'Production KPI metrics updated.');
  };

  const handleNavigate = (routeKey: string) => {
    setIsMenuVisible(false);
    if (routeKey === NSM_ROUTES.AUTH) {
      Alert.alert(
        '🚪 Confirm Logout',
        'Are you sure you want to log out of the NSM Portal?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Logout', style: 'destructive', onPress: () => navigation.replace('Auth') },
        ]
      );
    } else {
      navigation.navigate(routeKey);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerActionBar}>
            <TouchableOpacity onPress={() => setIsMenuVisible(true)} style={{ padding: 4 }}>
              <Ionicons name="menu-outline" size={26} color="#FFF" />
            </TouchableOpacity>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.title}>National Sales Head (NSM)</Text>
            </View>

            <TouchableOpacity onPress={handleRefresh} style={{ padding: 6, marginRight: 4 }}>
              <Ionicons name="refresh-outline" size={20} color="#FFF" />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => handleNavigate(NSM_ROUTES.NOTIFICATIONS)} style={{ padding: 4, marginRight: 8, position: 'relative' }}>
              <Ionicons name="notifications-outline" size={22} color="#FFF" />
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>3</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => handleNavigate(NSM_ROUTES.PROFILE)} style={{ padding: 4 }}>
              <Ionicons name="person-circle-outline" size={26} color="#FFF" />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>Pan-India Executive Sales & Performance Overview</Text>
          <Text style={styles.lastUpdatedText}>Last Updated: {kpiData.lastUpdated}</Text>
        </View>

        {/* 1. Dashboard Filters: Financial Year, Month, Region, State */}
        <View style={styles.filterRow}>
          <View style={styles.filterPill}>
            <Ionicons name="calendar-outline" size={12} color="#4F46E5" />
            <Text style={styles.filterPillText}>{selectedYear}</Text>
          </View>
          <View style={styles.filterPill}>
            <Ionicons name="time-outline" size={12} color="#4F46E5" />
            <Text style={styles.filterPillText}>{selectedMonth}</Text>
          </View>
          <View style={styles.filterPill}>
            <Ionicons name="globe-outline" size={12} color="#4F46E5" />
            <Text style={styles.filterPillText}>{selectedRegion}</Text>
          </View>
          <View style={styles.filterPill}>
            <Ionicons name="map-outline" size={12} color="#4F46E5" />
            <Text style={styles.filterPillText}>{selectedState}</Text>
          </View>
        </View>

        {/* 2. 11 KPI Cards */}
        <Text style={styles.sectionTitle}>📈 Executive Performance KPI Cards</Text>
        <View style={styles.kpiGrid}>
          <View style={[styles.kpiCard, { backgroundColor: '#EEF2FF' }]}>
            <Ionicons name="cash-outline" size={20} color="#4F46E5" />
            <Text style={[styles.kpiValue, { color: '#4F46E5' }]}>{kpiData.totalSales}</Text>
            <Text style={styles.kpiLabel}>Total Sales (₹)</Text>
          </View>

          <View style={[styles.kpiCard, { backgroundColor: '#FEF3C7' }]}>
            <Ionicons name="flag-outline" size={20} color="#D97706" />
            <Text style={[styles.kpiValue, { color: '#D97706' }]}>{kpiData.salesTarget}</Text>
            <Text style={styles.kpiLabel}>Sales Target (₹)</Text>
          </View>

          <View style={[styles.kpiCard, { backgroundColor: '#ECFDF5' }]}>
            <Ionicons name="trending-up-outline" size={20} color="#059669" />
            <Text style={[styles.kpiValue, { color: '#059669' }]}>{kpiData.achievementPercent}</Text>
            <Text style={styles.kpiLabel}>Achievement %</Text>
          </View>

          <View style={[styles.kpiCard, { backgroundColor: '#F3E8FF' }]}>
            <Ionicons name="cart-outline" size={20} color="#7E22CE" />
            <Text style={[styles.kpiValue, { color: '#7E22CE' }]}>{kpiData.totalOrders}</Text>
            <Text style={styles.kpiLabel}>Total Orders</Text>
          </View>

          <View style={[styles.kpiCard, { backgroundColor: '#EFF6FF' }]}>
            <Ionicons name="medkit-outline" size={20} color="#2563EB" />
            <Text style={[styles.kpiValue, { color: '#2563EB' }]}>{kpiData.totalDoctorVisits}</Text>
            <Text style={styles.kpiLabel}>Total Doctor Visits</Text>
          </View>

          <View style={[styles.kpiCard, { backgroundColor: '#FFF7ED' }]}>
            <Ionicons name="storefront-outline" size={20} color="#EA580C" />
            <Text style={[styles.kpiValue, { color: '#EA580C' }]}>{kpiData.totalChemistVisits}</Text>
            <Text style={styles.kpiLabel}>Total Chemist Visits</Text>
          </View>

          <View style={[styles.kpiCard, { backgroundColor: '#F0FDF4' }]}>
            <Ionicons name="people-outline" size={20} color="#16A34A" />
            <Text style={[styles.kpiValue, { color: '#16A34A' }]}>{kpiData.totalRSMs}</Text>
            <Text style={styles.kpiLabel}>Total RSMs</Text>
          </View>

          <View style={[styles.kpiCard, { backgroundColor: '#EEF2FF' }]}>
            <Ionicons name="people-circle-outline" size={20} color="#4F46E5" />
            <Text style={[styles.kpiValue, { color: '#4F46E5' }]}>{kpiData.totalASMs}</Text>
            <Text style={styles.kpiLabel}>Total ASMs</Text>
          </View>

          <View style={[styles.kpiCard, { backgroundColor: '#FEF3C7' }]}>
            <Ionicons name="walk-outline" size={20} color="#D97706" />
            <Text style={[styles.kpiValue, { color: '#D97706' }]}>{kpiData.totalMRs}</Text>
            <Text style={styles.kpiLabel}>Total MRs</Text>
          </View>

          <View style={[styles.kpiCard, { backgroundColor: '#ECFDF5' }]}>
            <Ionicons name="map-outline" size={20} color="#059669" />
            <Text style={[styles.kpiValue, { color: '#059669' }]}>{kpiData.activeStates}</Text>
            <Text style={styles.kpiLabel}>Active States</Text>
          </View>

          <View style={[styles.kpiCard, { backgroundColor: '#FEE2E2', width: '100%' }]}>
            <Ionicons name="alert-circle-outline" size={20} color="#DC2626" />
            <Text style={[styles.kpiValue, { color: '#DC2626' }]}>{kpiData.pendingApprovals}</Text>
            <Text style={styles.kpiLabel}>Pending Approvals (Target & Attendance Exceptions)</Text>
          </View>
        </View>

        {/* 3. Charts Section */}
        <Text style={styles.sectionTitle}>📊 Analytics & Trends</Text>

        {/* Monthly Sales Trend Chart */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>📈 Monthly Sales Trend (Apr - Aug)</Text>
          <View style={styles.barChartRow}>
            {monthlyTrend.map((item) => (
              <View key={item.month} style={styles.barCol}>
                <Text style={styles.barVal}>{item.sales}</Text>
                <View style={[styles.barFill, { height: item.pct * 0.7 }]} />
                <Text style={styles.barLbl}>{item.month}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Region Wise Sales */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>🌐 Region Wise Sales & Achievement %</Text>
          {regionSales.map((r) => (
            <View key={r.region} style={styles.regionProgressRow}>
              <Text style={styles.regionName}>{r.region} Zone</Text>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${parseFloat(r.pct)}%` as any, backgroundColor: r.color }]} />
              </View>
              <Text style={styles.regionSalesVal}>{r.sales} ({r.pct})</Text>
            </View>
          ))}
        </View>

        {/* 4. Tables Section */}
        {/* Table 1: Top Performing States */}
        <View style={styles.tableCard}>
          <Text style={styles.tableTitle}>🏆 Top Performing States</Text>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.th, { flex: 1.2 }]}>State</Text>
            <Text style={[styles.th, { flex: 1 }]}>Target</Text>
            <Text style={[styles.th, { flex: 1 }]}>Achieved</Text>
            <Text style={[styles.th, { flex: 0.9, textAlign: 'right' }]}>Achv %</Text>
          </View>

          {topStates.map((s, idx) => (
            <View key={idx} style={styles.tableBodyRow}>
              <Text style={[styles.td, { flex: 1.2, fontWeight: 'bold' }]}>{s.state}</Text>
              <Text style={[styles.td, { flex: 1 }]}>{s.target}</Text>
              <Text style={[styles.td, { flex: 1, color: '#059669', fontWeight: 'bold' }]}>{s.achieved}</Text>
              <Text style={[styles.td, { flex: 0.9, textAlign: 'right', color: '#4F46E5', fontWeight: 'bold' }]}>{s.percent}</Text>
            </View>
          ))}
        </View>

        {/* Table 2: Top Performing RSM */}
        <View style={[styles.tableCard, { marginTop: 14 }]}>
          <Text style={styles.tableTitle}>👨‍💼 Top Performing RSM</Text>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.th, { flex: 1.2 }]}>RSM</Text>
            <Text style={[styles.th, { flex: 1 }]}>Region</Text>
            <Text style={[styles.th, { flex: 1 }]}>Achieved</Text>
            <Text style={[styles.th, { flex: 1, textAlign: 'right' }]}>Grade</Text>
          </View>

          {topRSMs.map((r, idx) => (
            <View key={idx} style={styles.tableBodyRow}>
              <Text style={[styles.td, { flex: 1.2, fontWeight: 'bold' }]}>{r.rsm}</Text>
              <Text style={[styles.td, { flex: 1 }]}>{r.region}</Text>
              <Text style={[styles.td, { flex: 1, color: '#059669', fontWeight: 'bold' }]}>{r.achieved}</Text>
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <View style={styles.gradeBadge}>
                  <Text style={styles.gradeText}>{r.grade}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* ── Slide-out Navigation Drawer Modal ── */}
      <Modal visible={isMenuVisible} animationType="slide" transparent>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setIsMenuVisible(false)}>
          <View style={styles.drawerContainer}>
            <View style={styles.webDrawerHeader}>
              <Image source={require('../../assets/images/logo.jpg')} style={{ width: 170, height: 48, resizeMode: 'contain' }} />
            </View>

            <ScrollView style={{ paddingHorizontal: 12, paddingVertical: 10 }}>
              <TouchableOpacity style={styles.activePillMenuItem} onPress={() => handleNavigate(NSM_ROUTES.DASHBOARD)}>
                <Ionicons name="grid-outline" size={20} color="#4F46E5" />
                <Text style={styles.activePillMenuText}>Dashboard</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItemHeader} onPress={() => handleNavigate('NSMSalesOperations')}>
                <Ionicons name="trending-up-outline" size={20} color="#475569" />
                <Text style={styles.menuItemHeaderText}>Sales Operations</Text>
                <Ionicons name="chevron-down" size={16} color="#94A3B8" style={{ marginLeft: 'auto' }} />
              </TouchableOpacity>

              <View style={{ paddingLeft: 18, marginVertical: 2 }}>
                <TouchableOpacity style={styles.subMenuItem} onPress={() => handleNavigate(NSM_ROUTES.RSM_SUPERVISION)}>
                  <Text style={styles.subMenuItemText}>RSM Management</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.subMenuItem} onPress={() => handleNavigate(NSM_ROUTES.TARGET)}>
                  <Text style={styles.subMenuItemText}>Target Planning</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.subMenuItem} onPress={() => handleNavigate(NSM_ROUTES.STATE)}>
                  <Text style={styles.subMenuItemText}>State Performance</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.subMenuItem} onPress={() => handleNavigate(NSM_ROUTES.TEAM_PERFORMANCE)}>
                  <Text style={styles.subMenuItemText}>Team Performance</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.subMenuItem} onPress={() => handleNavigate(NSM_ROUTES.TEAM_VISITS)}>
                  <Text style={styles.subMenuItemText}>Team Visits</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.menuItem} onPress={() => handleNavigate(NSM_ROUTES.ATTENDANCE)}>
                <Ionicons name="time-outline" size={20} color="#475569" />
                <Text style={styles.menuItemText}>Attendance</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem} onPress={() => handleNavigate(NSM_ROUTES.SETTINGS)}>
                <Ionicons name="settings-outline" size={20} color="#475569" />
                <Text style={styles.menuItemText}>Settings</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem} onPress={() => handleNavigate(NSM_ROUTES.NOTIFICATIONS)}>
                <Ionicons name="notifications-outline" size={20} color="#475569" />
                <Text style={styles.menuItemText}>Notifications Inbox</Text>
              </TouchableOpacity>
            </ScrollView>

            <View style={styles.webUserFooter}>
              <Ionicons name="person-circle-outline" size={36} color="#4F46E5" />
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.footerUserName}>Rajesh Sharma</Text>
                <Text style={styles.footerUserRole}>National Sales Head</Text>
              </View>
              <TouchableOpacity onPress={() => handleNavigate(NSM_ROUTES.AUTH)}>
                <Ionicons name="log-out-outline" size={20} color="#DC2626" />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

export default NSMDashboardScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { padding: 16 },
  header: { backgroundColor: '#4F46E5', padding: 18, borderRadius: 16, marginBottom: 12 },
  headerActionBar: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#FFF' },
  subtitle: { fontSize: 12, color: '#E0E7FF', marginTop: 2 },
  lastUpdatedText: { fontSize: 11, color: '#C7D2FE', marginTop: 6, fontStyle: 'italic' },
  notifBadge: { position: 'absolute', top: -2, right: -2, backgroundColor: '#EF4444', borderRadius: 8, width: 16, height: 16, justifyContent: 'center', alignItems: 'center' },
  notifBadgeText: { color: '#FFF', fontSize: 9, fontWeight: 'bold' },

  filterRow: { flexDirection: 'row', gap: 6, marginBottom: 14 },
  filterPill: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF', paddingHorizontal: 6, paddingVertical: 7, borderRadius: 8, borderWidth: 1, borderColor: '#CBD5E1', gap: 3 },
  filterPillText: { fontSize: 10, fontWeight: '600', color: '#1E293B' },

  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#1E293B', marginBottom: 10 },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  kpiCard: { width: '48%', padding: 12, borderRadius: 12, alignItems: 'center' },
  kpiValue: { fontSize: 16, fontWeight: 'bold', marginTop: 4 },
  kpiLabel: { fontSize: 10, color: '#64748B', marginTop: 2, fontWeight: '500', textAlign: 'center' },

  chartCard: { backgroundColor: '#FFF', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 14 },
  chartTitle: { fontSize: 14, fontWeight: 'bold', color: '#1E293B', marginBottom: 10 },
  barChartRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 100 },
  barCol: { alignItems: 'center', flex: 1 },
  barVal: { fontSize: 9, fontWeight: 'bold', color: '#64748B', marginBottom: 4 },
  barFill: { width: 18, backgroundColor: '#4F46E5', borderRadius: 4 },
  barLbl: { fontSize: 10, color: '#64748B', marginTop: 4, fontWeight: '600' },

  regionProgressRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 6 },
  regionName: { width: 75, fontSize: 11, fontWeight: 'bold', color: '#1E293B' },
  progressTrack: { flex: 1, height: 8, backgroundColor: '#F1F5F9', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  regionSalesVal: { width: 95, fontSize: 11, fontWeight: 'bold', color: '#64748B', textAlign: 'right' },

  tableCard: { backgroundColor: '#FFF', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  tableTitle: { fontSize: 15, fontWeight: 'bold', color: '#1E293B', marginBottom: 10 },
  tableHeaderRow: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', backgroundColor: '#F8FAFC' },
  th: { fontSize: 11, fontWeight: 'bold', color: '#64748B' },
  tableBodyRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  td: { fontSize: 12, color: '#334155' },
  gradeBadge: { backgroundColor: '#DCFCE7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  gradeText: { fontSize: 9, fontWeight: 'bold', color: '#15803D' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.5)', justifyContent: 'center', alignItems: 'center' },
  drawerContainer: { width: '80%', maxWidth: 300, height: '100%', backgroundColor: '#FFF', elevation: 10, alignSelf: 'flex-start' },
  webDrawerHeader: { padding: 18, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  activePillMenuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingHorizontal: 12, backgroundColor: '#F3E8FF', borderRadius: 10, marginBottom: 4 },
  activePillMenuText: { fontSize: 14, fontWeight: 'bold', color: '#4F46E5' },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8 },
  menuItemText: { fontSize: 14, fontWeight: '500', color: '#475569' },
  menuItemHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingHorizontal: 12 },
  menuItemHeaderText: { fontSize: 14, fontWeight: '600', color: '#475569' },
  subMenuItem: { paddingVertical: 8, paddingHorizontal: 10 },
  subMenuItemText: { fontSize: 13, fontWeight: '500', color: '#64748B' },
  webUserFooter: { flexDirection: 'row', alignItems: 'center', padding: 14, borderTopWidth: 1, borderTopColor: '#F1F5F9', backgroundColor: '#FAFAFA' },
  footerUserName: { fontSize: 13, fontWeight: 'bold', color: '#1E293B' },
  footerUserRole: { fontSize: 10, color: '#64748B' },
});
