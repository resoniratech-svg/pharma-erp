import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface RecentOrder {
  id: string;
  client: string;
  status: 'Shipped' | 'Pending' | 'Failed';
  amount: string;
  date: string;
}

const DashboardScreen = () => {
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();

  // State to control the slide-out hamburger menu drawer
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // States to control collapsible drawer groups
  const [showMROps, setShowMROps] = useState(false);
  const [showGPS, setShowGPS] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // State for dynamic stats
  const [docCount, setDocCount] = useState(0);
  const [chemistCount, setChemistCount] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState('');

  // Target progress rates
  const [salesProgress, setSalesProgress] = useState(0);
  const [doctorProgress, setDoctorProgress] = useState(0);
  const [chemistProgress, setChemistProgress] = useState(0);
  
  // Follow-ups and Recent Orders lists
  const [followUps, setFollowUps] = useState<any[]>([]);
  const [recentOrdersList, setRecentOrdersList] = useState<RecentOrder[]>([]);
  const [userName, setUserName] = useState('Priya Reddy');
  const [designation, setDesignation] = useState('Medical Representative');

  useEffect(() => {
    if (isFocused) {
      loadStats();
    }
  }, [isFocused]);

  const loadStats = async () => {
    // 1. Load Doctor Visits safely
    try {
      const docVisitsData = await AsyncStorage.getItem('@doctor_visits');
      const docVisitsList = docVisitsData ? JSON.parse(docVisitsData) : [];
      setDocCount(docVisitsList.length);

      const calculatedDoctorProgress = Math.min(Math.round((docVisitsList.length / 30) * 100), 100);
      setDoctorProgress(calculatedDoctorProgress);

      const filteredFollowUps = docVisitsList
        .filter((visit: any) => visit.followUpDate && visit.followUpDate.trim() !== '')
        .slice(0, 3);
      setFollowUps(filteredFollowUps);
    } catch (e) {
      console.log('Error loading doctor visits:', e);
    }

    // 2. Load Chemist Visits safely
    let chemistTotal = 0;
    try {
      const chemistVisitsData = await AsyncStorage.getItem('@chemist_visits');
      const chemistVisitsList = chemistVisitsData ? JSON.parse(chemistVisitsData) : [];
      setChemistCount(chemistVisitsList.length);

      chemistTotal = chemistVisitsList.reduce((sum: number, item: any) => {
        return sum + (parseFloat(item.orderValue) || 0);
      }, 0);

      const calculatedChemistProgress = Math.min(Math.round((chemistVisitsList.length / 20) * 100), 100);
      setChemistProgress(calculatedChemistProgress);
    } catch (e) {
      console.log('Error loading chemist visits:', e);
    }

    // 3. Load Orders safely & compile recent orders table
    let ordersTotal = 0;
    try {
      const ordersData = await AsyncStorage.getItem('@orders');
      const ordersList = ordersData ? JSON.parse(ordersData) : [];
      ordersTotal = ordersList.reduce((sum: number, item: any) => {
        return sum + (parseFloat(item.totalAmount) || 0);
      }, 0);

      if (ordersList.length > 0) {
        // Fix duplicate key console errors using composite indices
        const mappedOrders: RecentOrder[] = ordersList.slice(0, 4).map((o: any, idx: number) => ({
          id: o.orderNumber || `ORD-NEW-${o.id || idx}`,
          client: o.customerName || 'Chemist Store',
          status: o.status === 'Booked' ? 'Pending' : o.status === 'Fulfilled' ? 'Shipped' : 'Failed',
          amount: `₹${(parseFloat(o.totalAmount) || 0).toLocaleString()}`,
          date: o.dateFormatted ? o.dateFormatted.split(' ')[0] : 'Today'
        }));
        setRecentOrdersList(mappedOrders);
      } else {
        // Fallback to match Web Mock data exactly
        setRecentOrdersList([
          { id: 'ORD-8901', client: 'Apollo Hospitals', status: 'Shipped', amount: '₹1,24,000', date: 'Oct 12, 2026' },
          { id: 'ORD-8902', client: 'Care Pharmacy', status: 'Pending', amount: '₹45,500', date: 'Oct 12, 2026' },
          { id: 'ORD-8903', client: 'MediPlus Network', status: 'Failed', amount: '₹89,200', date: 'Oct 11, 2026' },
          { id: 'ORD-8904', client: 'City Clinic', status: 'Shipped', amount: '₹12,400', date: 'Oct 10, 2026' },
        ]);
      }
    } catch (e) {
      console.log('Error loading orders:', e);
    }

    // Sum up sales
    const salesSum = chemistTotal + ordersTotal;
    setTotalOrders(salesSum);
    const calculatedSalesProgress = Math.min(Math.round((salesSum / 50000) * 100), 100);
    setSalesProgress(calculatedSalesProgress);

    // 4. Load Attendance status
    try {
      const checkedInStatus = await AsyncStorage.getItem('@checked_in');
      const time = await AsyncStorage.getItem('@check_in_time');
      setIsCheckedIn(checkedInStatus === 'true');
      setCheckInTime(time || '');
    } catch (e) {
      console.log('Error loading attendance status:', e);
    }

    // 5. Load User Profile details
    try {
      const storedName = await AsyncStorage.getItem('@user_name');
      const storedRole = await AsyncStorage.getItem('@designation');
      if (storedName) setUserName(storedName);
      if (storedRole) setDesignation(storedRole);
    } catch (e) {
      console.log('Error loading user profile:', e);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container}>
        
        {/* Web-Style White Header with Avatar and Operational Badge */}
        <View style={styles.webHeader}>
          <View style={styles.profileRow}>
            {/* 3-Lines Hamburger Menu Button */}
            <TouchableOpacity 
              style={styles.hamburgerButton} 
              onPress={() => setIsMenuOpen(true)}
            >
              <Text style={styles.hamburgerIcon}>☰</Text>
            </TouchableOpacity>

            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>
                {userName.split(' ').map(n => n[0]).join('').toUpperCase()}
              </Text>
            </View>
            <View style={styles.profileMeta}>
              <Text style={styles.welcomeText}>{userName}</Text>
              <Text style={styles.designationText}>{designation}</Text>
            </View>
            <View style={styles.statusBadge}>
              <View style={styles.greenDot} />
              <Text style={styles.statusText}>Operational</Text>
            </View>
          </View>
          <Text style={styles.dateText}>{new Date().toDateString()}</Text>
        </View>

        {/* Attendance Status Bar */}
        <View style={[
          styles.attendanceBanner,
          { backgroundColor: isCheckedIn ? '#DEF7EC' : '#FDE8E8' }
        ]}>
          <Text style={[
            styles.attendanceText,
            { color: isCheckedIn ? '#03543F' : '#9B1C1C' }
          ]}>
            {isCheckedIn 
              ? `🟢 Duty Checked In at ${checkInTime}` 
              : '🔴 Off Duty - Attendance Not Marked'
            }
          </Text>
        </View>

        {/* KPI Metrics Cards (Thin borders, soft colored icon rings) */}
        <Text style={styles.sectionTitle}>Dashboard Overview</Text>
        <View style={styles.kpiContainer}>
          {/* Row 1 */}
          <View style={styles.kpiRow}>
            <View style={[styles.kpiCard, { shadowColor: '#1abc9c' }]}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconContainer, { backgroundColor: '#E6F4EA' }]}>
                  <Text style={[styles.kpiIcon, { color: '#10B981' }]}>📈</Text>
                </View>
                <View style={[styles.trendBadge, { backgroundColor: '#ECFDF5' }]}>
                  <Text style={[styles.trendText, { color: '#059669' }]}>+14.5%</Text>
                </View>
              </View>
              <Text style={styles.kpiValue}>₹12.4M</Text>
              <Text style={styles.kpiLabel}>Monthly Revenue</Text>
            </View>

            <View style={[styles.kpiCard, { shadowColor: '#6366f1' }]}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconContainer, { backgroundColor: '#EEF2FF' }]}>
                  <Text style={[styles.kpiIcon, { color: '#6366F1' }]}>📦</Text>
                </View>
                <View style={[styles.trendBadge, { backgroundColor: '#EEF2FF' }]}>
                  <Text style={[styles.trendText, { color: '#4F46E5' }]}>+2.1%</Text>
                </View>
              </View>
              <Text style={styles.kpiValue}>4,892</Text>
              <Text style={styles.kpiLabel}>Total SKUs</Text>
            </View>
          </View>

          {/* Row 2 */}
          <View style={[styles.kpiRow, { marginTop: 12 }]}>
            <View style={[styles.kpiCard, { shadowColor: '#06b6d4' }]}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconContainer, { backgroundColor: '#ECFEFF' }]}>
                  <Text style={[styles.kpiIcon, { color: '#06B6D4' }]}>🛒</Text>
                </View>
                <View style={[styles.trendBadge, { backgroundColor: '#FDF2F8' }]}>
                  <Text style={[styles.trendText, { color: '#E11D48' }]}>-4.2%</Text>
                </View>
              </View>
              <Text style={styles.kpiValue}>1,284</Text>
              <Text style={styles.kpiLabel}>Orders Processed</Text>
            </View>

            <View style={[styles.kpiCard, { shadowColor: '#f43f5e' }]}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconContainer, { backgroundColor: '#FFF1F2' }]}>
                  <Text style={[styles.kpiIcon, { color: '#F43F5E' }]}>⚠️</Text>
                </View>
                <View style={[styles.trendBadge, { backgroundColor: '#FFF1F2' }]}>
                  <Text style={[styles.trendText, { color: '#E11D48', fontSize: 9 }]}>Critical</Text>
                </View>
              </View>
              <Text style={styles.kpiValue}>3</Text>
              <Text style={styles.kpiLabel}>Critical Alerts</Text>
            </View>
          </View>
        </View>

        {/* Monthly Target Progress Bars (Using web colors) */}
        <Text style={styles.sectionTitle}>Performance Metrics</Text>
        <View style={styles.targetCard}>
          <View style={styles.targetLabelRow}>
            <Text style={styles.targetLabel}>💰 Sales Target (₹50,000)</Text>
            <Text style={styles.targetValue}>{salesProgress}%</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${salesProgress}%`, backgroundColor: '#8B5CF6' }]} />
          </View>
          
          <View style={[styles.targetLabelRow, { marginTop: 12 }]}>
            <Text style={styles.targetLabel}>🩺 Doctor Calls Target (30)</Text>
            <Text style={styles.targetValue}>{doctorProgress}%</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${doctorProgress}%`, backgroundColor: '#10B981' }]} />
          </View>

          <View style={[styles.targetLabelRow, { marginTop: 12 }]}>
            <Text style={styles.targetLabel}>💊 Chemist Calls Target (20)</Text>
            <Text style={styles.targetValue}>{chemistProgress}%</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${chemistProgress}%`, backgroundColor: '#F59E0B' }]} />
          </View>
        </View>

        {/* Upcoming Follow Up Reminders */}
        <Text style={styles.sectionTitle}>Reminders & Alerts</Text>
        <View style={styles.followUpCard}>
          {followUps.length > 0 ? (
            followUps.map((visit: any, index: number) => (
              <View 
                key={`${visit.id || index}-${index}`} 
                style={[
                  styles.followUpRow, 
                  index > 0 && { marginTop: 10, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 8 }
                ]}
              >
                <Text style={styles.followUpDoctor}>Dr. {visit.doctorName} ({visit.specialty || 'General'})</Text>
                <Text style={styles.followUpDate}>📅 {visit.followUpDate}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No upcoming follow-ups scheduled</Text>
          )}
        </View>

        {/* Recent Orders Log Table */}
        <Text style={styles.sectionTitle}>Recent Orders Log</Text>
        <View style={styles.tableCard}>
          {/* Table Header */}
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.headerCell, { flex: 1.2 }]}>ORDER ID</Text>
            <Text style={[styles.headerCell, { flex: 2 }]}>CLIENT</Text>
            <Text style={[styles.headerCell, { flex: 1.5, textAlign: 'center' }]}>STATUS</Text>
            <Text style={[styles.headerCell, { flex: 1.5, textAlign: 'right' }]}>AMOUNT</Text>
            <Text style={[styles.headerCell, { flex: 0.5, textAlign: 'right' }]}></Text>
          </View>

          {/* Table Rows */}
          {recentOrdersList.length > 0 ? (
            recentOrdersList.map((order, index) => {
              let statusColor = '#D97706'; // Amber (Pending)
              let statusBg = '#FEF3C7';
              
              if (order.status === 'Shipped') {
                statusColor = '#059669'; // Emerald (Shipped)
                statusBg = '#DEF7EC';
              } else if (order.status === 'Failed') {
                statusColor = '#E11D48'; // Rose (Failed)
                statusBg = '#FDE8E8';
              }

              return (
                <View key={`${order.id}-${index}`} style={styles.tableRow}>
                  <View style={{ flex: 1.2 }}>
                    <Text style={styles.orderIdText}>{order.id}</Text>
                    <Text style={styles.orderDateText}>{order.date}</Text>
                  </View>
                  <Text style={[styles.orderClientText, { flex: 2 }]}>{order.client}</Text>
                  <View style={{ flex: 1.5, alignItems: 'center' }}>
                    <View style={[styles.badge, { backgroundColor: statusBg }]}>
                      <Text style={[styles.badgeText, { color: statusColor }]}>{order.status}</Text>
                    </View>
                  </View>
                  <Text style={[styles.orderAmountText, { flex: 1.5 }]}>{order.amount}</Text>
                  <TouchableOpacity style={{ flex: 0.5, alignItems: 'flex-end' }}>
                    <Text style={styles.moreIcon}>⋮</Text>
                  </TouchableOpacity>
                </View>
              );
            })
          ) : (
            <Text style={styles.emptyText}>No orders recorded.</Text>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── CUSTOM SLIDE-OUT DRAWER MENU MODAL ── */}
      <Modal
        visible={isMenuOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsMenuOpen(false)}
      >
        {/* Semi-transparent Backdrop overlay */}
        <TouchableOpacity 
          style={styles.drawerBackdrop} 
          activeOpacity={1} 
          onPress={() => setIsMenuOpen(false)}
        >
          {/* Main Drawer Panel */}
          <TouchableOpacity 
            style={styles.drawerContainer} 
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Header section of the drawer */}
            <View style={styles.drawerHeader}>
              <View style={styles.logoRow}>
                <Image 
                  source={require('../../../assets/images/logo.png')} 
                  style={styles.drawerLogo} 
                  resizeMode="contain"
                />
                <View style={styles.logoTextContainer}>
                  <Text style={styles.logoText}>Pharma ERP</Text>
                  <Text style={styles.logoSubtitle}>MJ Healthcare</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setIsMenuOpen(false)}>
                <Text style={styles.closeIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Scrollable menu options */}
            <ScrollView style={styles.drawerScroll}>
              <TouchableOpacity 
                style={[styles.drawerItem, styles.activeDrawerItem]} 
                onPress={() => { setIsMenuOpen(false); }}
              >
                <Text style={[styles.drawerItemText, styles.activeDrawerItemText]}>🏠 Dashboard</Text>
              </TouchableOpacity>

              {/* 1. MR Operations Group */}
              <TouchableOpacity 
                style={styles.drawerGroupHeader} 
                onPress={() => setShowMROps(!showMROps)}
              >
                <Text style={styles.drawerGroupLabel}>👤 MR Operations</Text>
                <Text style={styles.arrowIcon}>{showMROps ? '▲' : '▼'}</Text>
              </TouchableOpacity>

              {showMROps && (
                <View style={styles.groupChildren}>
                  {[
                    { label: '🩺 Doctor Visit Entry', route: 'DoctorVisit' },
                    { label: '💊 Chemist Visit Entry', route: 'ChemistVisit' },
                    { label: '📦 Order Booking', route: 'BookOrder' },
                    { label: '📄 Daily Reporting', route: 'DailyReport' },
                    { label: '📈 Target Tracking', route: 'TargetTracking' },
                    { label: '🗺️ Tour Planning', route: 'TourPlanning' },
                    { label: '🤝 Meeting Scheduling', route: 'MeetingScheduler' },
                    { label: '📜 Activity Tracking', route: 'ActivityTracking' },
                    { label: '🎯 Follow-Ups Tracker', route: 'FollowUps' },
                    { label: '👥 Customer Directory', route: 'CustomerDirectory' },
                  ].map((item, index) => (
                    <TouchableOpacity 
                      key={index} 
                      style={styles.drawerSubItem} 
                      onPress={() => { 
                        setIsMenuOpen(false); 
                        navigation.navigate(item.route); 
                      }}
                    >
                      <Text style={styles.drawerSubItemText}>{item.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* 2. GPS & Location Tracking Group */}
              <TouchableOpacity 
                style={styles.drawerGroupHeader} 
                onPress={() => setShowGPS(!showGPS)}
              >
                <Text style={styles.drawerGroupLabel}>🧭 GPS & Location Tracking</Text>
                <Text style={styles.arrowIcon}>{showGPS ? '▲' : '▼'}</Text>
              </TouchableOpacity>

              {showGPS && (
                <View style={styles.groupChildren}>
                  {[
                    { label: '🕒 GPS Attendance', route: 'Attendance' },
                    { label: '🩺 Geo Tagged Doctor Visits', route: 'GeoTaggedDoctorVisits' },
                    { label: '💊 Geo Tagged Chemist Visits', route: 'GeoTaggedChemistVisits' },
                    { label: '🛣️ Route History', route: 'RouteHistory' },
                    { label: '📍 Territory Tracking', route: 'Territory' },
                    { label: '🧭 Daily Movement Tracking', route: 'DailyMovementTracking' },
                    { label: '🤝 Meeting/Event Location Tracking', route: 'MeetingLocation' },
                  ].map((item, index) => (
                    <TouchableOpacity 
                      key={index} 
                      style={styles.drawerSubItem} 
                      onPress={() => { 
                        setIsMenuOpen(false); 
                        navigation.navigate(item.route); 
                      }}
                    >
                      <Text style={styles.drawerSubItemText}>{item.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* 3. Alerts & Notifications Group */}
              <TouchableOpacity 
                style={styles.drawerGroupHeader} 
                onPress={() => setShowAlerts(!showAlerts)}
              >
                <Text style={styles.drawerGroupLabel}>🔔 Alerts & Notifications</Text>
                <Text style={styles.arrowIcon}>{showAlerts ? '▲' : '▼'}</Text>
              </TouchableOpacity>

              {showAlerts && (
                <View style={styles.groupChildren}>
                  {[
                    { label: '🤝 Meeting Reminders', route: 'Notifications' },
                    { label: '🎯 Follow-Up Reminders', route: 'FollowUpReminders' },
                    { label: '🧪 Expiry Alerts', route: 'ExpiryAlerts' },
                    // { label: '📦 Auto Reorder Alerts', route: 'AutoReorderAlerts' },
                    { label: '🔔 Activity Notifications', route: 'Notifications' },
                  ].map((item, index) => (
                    <TouchableOpacity 
                      key={index} 
                      style={styles.drawerSubItem} 
                      onPress={() => { 
                        setIsMenuOpen(false); 
                        navigation.navigate(item.route); 
                      }}
                    >
                      <Text style={styles.drawerSubItemText}>{item.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* 4. Settings Group */}
              <TouchableOpacity 
                style={styles.drawerGroupHeader} 
                onPress={() => setShowSettings(!showSettings)}
              >
                <Text style={styles.drawerGroupLabel}>⚙️ Settings</Text>
                <Text style={styles.arrowIcon}>{showSettings ? '▲' : '▼'}</Text>
              </TouchableOpacity>

              {showSettings && (
                <View style={styles.groupChildren}>
                  {[
                    { label: '👤 Profile Settings', route: 'Profile' },
                    { label: '🧪 Product Catalog List', route: 'ProductCatalog' },
                    { label: '📆 Leave Application', route: 'LeaveRequest' },
                    { label: '📋 Daily Schedule Checklist', route: 'DailySchedule' },
                    { label: '💵 Expense Claims', route: 'ExpenseClaim' },
                  ].map((item, index) => (
                    <TouchableOpacity 
                      key={index} 
                      style={styles.drawerSubItem} 
                      onPress={() => { 
                        setIsMenuOpen(false); 
                        navigation.navigate(item.route); 
                      }}
                    >
                      <Text style={styles.drawerSubItemText}>{item.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </ScrollView>

            {/* Footer Profile Details */}
            <View style={styles.drawerFooter}>
              <View style={styles.avatarCircleSmall}>
                <Text style={styles.avatarTextSmall}>
                  {userName.split(' ').map(n => n[0]).join('').toUpperCase()}
                </Text>
              </View>
              <View style={{ marginLeft: 10 }}>
                <Text style={styles.footerUserName}>{userName}</Text>
                <Text style={styles.footerUserRole}>{designation}</Text>
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default DashboardScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  webHeader: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hamburgerButton: {
    paddingRight: 16,
    paddingVertical: 8,
  },
  hamburgerIcon: {
    fontSize: 22,
    color: '#64748B',
    fontWeight: 'bold',
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  profileMeta: {
    flex: 1,
    marginLeft: 12,
  },
  welcomeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  designationText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DEF7EC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#31C48D',
    marginRight: 6,
  },
  statusText: {
    color: '#03543F',
    fontSize: 11,
    fontWeight: 'bold',
  },
  dateText: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 12,
  },
  attendanceBanner: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  attendanceText: {
    fontWeight: 'bold',
    fontSize: 13,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#475569',
    paddingHorizontal: 16,
    marginBottom: 8,
    marginTop: 20,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  kpiContainer: {
    paddingHorizontal: 16,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 12,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiIcon: {
    fontSize: 18,
  },
  trendBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  trendText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  kpiValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  kpiLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    fontWeight: '500',
  },
  targetCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  targetLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  targetLabel: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  targetValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  followUpCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  followUpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  followUpDoctor: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  followUpDate: {
    fontSize: 12,
    color: '#64748B',
  },
  emptyText: {
    fontSize: 12,
    color: '#94A3B8',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 10,
  },
  tableCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 8,
    marginBottom: 8,
  },
  headerCell: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  orderIdText: {
    fontSize: 12.5,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  orderDateText: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
  orderClientText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  orderAmountText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#334155',
    textAlign: 'right',
  },
  moreIcon: {
    fontSize: 16,
    color: '#94A3B8',
    fontWeight: 'bold',
  },
  drawerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
  },
  drawerContainer: {
    width: '78%',
    height: '100%',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 16,
    paddingTop: 50,
    paddingBottom: 20,
    display: 'flex',
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  drawerLogo: {
    width: 150,
    height: 50,
    marginRight: 8,
  },
  logoBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBadgeText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  logoText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  logoTextContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
    marginLeft: 10,
  },
  logoSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  closeIcon: {
    fontSize: 18,
    color: '#64748B',
    fontWeight: 'bold',
  },
  drawerScroll: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 15,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 4,
  },
  activeDrawerItem: {
    backgroundColor: '#F3E8FF',
  },
  drawerItemText: {
    fontSize: 13.5,
    fontWeight: '500',
    color: '#475569',
  },
  activeDrawerItemText: {
    color: '#8B5CF6',
    fontWeight: 'bold',
  },
  drawerGroupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginTop: 4,
  },
  drawerGroupLabel: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#334155',
  },
  arrowIcon: {
    fontSize: 10,
    color: '#94A3B8',
  },
  groupChildren: {
    paddingLeft: 24,
    backgroundColor: '#FAF9F6',
    borderRadius: 12,
    paddingVertical: 4,
    marginTop: 2,
  },
  drawerSubItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  drawerSubItemText: {
    fontSize: 12.5,
    color: '#475569',
    fontWeight: '500',
  },
  drawerFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 16,
    paddingHorizontal: 20,
  },
  avatarCircleSmall: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTextSmall: {
    color: '#6366F1',
    fontWeight: 'bold',
    fontSize: 13,
  },
  footerUserName: {
    fontSize: 13.5,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  footerUserRole: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
});