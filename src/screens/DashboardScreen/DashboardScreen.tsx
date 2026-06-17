import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface RecentOrder {
  id: string; client: string; status: 'Shipped' | 'Pending' | 'Failed'; amount: string; date: string;
}

const DashboardScreen = () => {
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showMROps, setShowMROps] = useState(false);
  const [showGPS, setShowGPS] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const [docCount, setDocCount] = useState(0);
  const [chemistCount, setChemistCount] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [ordersCount, setOrdersCount] = useState(0);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState('');

  const [salesProgress, setSalesProgress] = useState(0);
  const [doctorProgress, setDoctorProgress] = useState(0);
  const [chemistProgress, setChemistProgress] = useState(0);
  
  const [followUps, setFollowUps] = useState<any[]>([]);
  const [recentOrdersList, setRecentOrdersList] = useState<RecentOrder[]>([]);
  const [scheduleList, setScheduleList] = useState<any[]>([]);
  
  const [recentVisitsList, setRecentVisitsList] = useState<any[]>([]);
  const [notificationsList, setNotificationsList] = useState<any[]>([]);
  const [gpsData, setGpsData] = useState<any>(null);

  const [userName, setUserName] = useState('Priya Reddy');
  const [designation, setDesignation] = useState('Medical Representative');

  useEffect(() => { if (isFocused) loadStats(); }, [isFocused]);

  const loadStats = async () => {
    try {
      const docVisitsData = await AsyncStorage.getItem('@doctor_visits');
      const docVisitsList = docVisitsData ? JSON.parse(docVisitsData) : [];
      setDocCount(docVisitsList.length);
      setDoctorProgress(Math.min(Math.round((docVisitsList.length / 30) * 100), 100));
      setFollowUps(docVisitsList.filter((visit: any) => visit.followUpDate).slice(0, 3));
    } catch (e) { console.log(e); }

    let chemistTotal = 0;
    try {
      const chemistVisitsData = await AsyncStorage.getItem('@chemist_visits');
      const chemistVisitsList = chemistVisitsData ? JSON.parse(chemistVisitsData) : [];
      setChemistCount(chemistVisitsList.length);
      chemistTotal = chemistVisitsList.reduce((sum: number, item: any) => sum + (parseFloat(item.orderValue) || 0), 0);
      setChemistProgress(Math.min(Math.round((chemistVisitsList.length / 20) * 100), 100));
    } catch (e) { console.log(e); }

    let ordersTotal = 0;
    try {
      const ordersData = await AsyncStorage.getItem('@orders');
      const ordersList = ordersData ? JSON.parse(ordersData) : [];
      setOrdersCount(ordersList.length);
      ordersTotal = ordersList.reduce((sum: number, item: any) => sum + (parseFloat(item.totalAmount) || 0), 0);

      if (ordersList.length > 0) {
        setRecentOrdersList(ordersList.slice(0, 4).map((o: any, idx: number) => ({
          id: o.orderNumber || `ORD-NEW-${idx}`,
          client: o.customerName || 'Chemist Store',
          status: o.status === 'Booked' ? 'Pending' : o.status === 'Fulfilled' ? 'Shipped' : 'Failed',
          amount: `₹${(parseFloat(o.totalAmount) || 0).toLocaleString()}`,
          date: o.dateFormatted ? o.dateFormatted.split(' ')[0] : 'Today'
        })));
      } else {
        setRecentOrdersList([
          { id: 'ORD-8901', client: 'Apollo Hospitals', status: 'Shipped', amount: '₹1,24,000', date: 'Oct 12, 2026' },
          { id: 'ORD-8902', client: 'Care Pharmacy', status: 'Pending', amount: '₹45,500', date: 'Oct 12, 2026' },
        ]);
      }
    } catch (e) { console.log(e); }

    const salesSum = chemistTotal + ordersTotal;
    setTotalOrders(salesSum);
    setSalesProgress(Math.min(Math.round((salesSum / 50000) * 100), 100));

    try {
      setIsCheckedIn((await AsyncStorage.getItem('@checked_in')) === 'true');
      setCheckInTime((await AsyncStorage.getItem('@check_in_time')) || '');
      setUserName((await AsyncStorage.getItem('@user_name')) || 'Priya Reddy');
      setDesignation((await AsyncStorage.getItem('@designation')) || 'Medical Representative');
    } catch (e) { console.log(e); }
    
    setScheduleList([]); 
    
    setRecentVisitsList([
      { id: 1, name: 'Dr. Ramesh Kumar', type: 'Doctor', time: '10:30 AM', status: 'Completed' },
      { id: 2, name: 'Apollo Pharmacy', type: 'Chemist', time: '11:45 AM', status: 'Completed' },
      { id: 3, name: 'Dr. Sarah Smith', type: 'Doctor', time: '02:15 PM', status: 'Pending' }
    ]);

    setNotificationsList([
      { id: 1, text: 'Meeting with Dr. Ramesh at 4 PM', type: 'meeting', time: '10 mins ago' },
      { id: 2, text: 'Monthly Sales Target reached 70%', type: 'target', time: '1 hour ago' },
      { id: 3, text: 'Follow-up with Care Pharmacy is overdue', type: 'alert', time: '2 hours ago' }
    ]);

    setGpsData({
      distance: '24 KM',
      checkIns: 8,
      territory: 'Hyderabad South',
      lastLocation: 'Banjara Hills, Road No 12',
      coverage: 75 
    });
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container}>
        
        {/* FIXED: Restored the exact original Header so the 3 lines work! */}
        <View style={styles.webHeader}>
          <View style={styles.profileRow}>
            {/* 3-Lines Hamburger Menu Button */}
            <TouchableOpacity 
              style={styles.hamburgerButton} 
              onPress={() => setIsMenuOpen(true)}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
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
          {/* Restored Date text that was missing! */}
          <Text style={styles.dateText}>{new Date().toDateString()}</Text>
        </View>

        <View style={styles.contentPadding}>
          
          <View style={styles.kpiRow}>
            <View style={[styles.kpiCard, { shadowColor: '#1abc9c' }]}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconContainer, { backgroundColor: isCheckedIn ? '#E6F4EA' : '#FDE8E8' }]}>
                  <Text style={[styles.kpiIcon, { color: isCheckedIn ? '#10B981' : '#E11D48' }]}>📍</Text>
                </View>
              </View>
              <Text style={styles.kpiLabel}>Attendance</Text>
              <Text style={styles.kpiValue}>{isCheckedIn ? 'Present' : 'Absent'}</Text>
              <Text style={styles.kpiSubText}>{isCheckedIn ? `Check In: ${checkInTime}` : 'Not Checked In'}</Text>
            </View>

            <View style={[styles.kpiCard, { shadowColor: '#6366f1' }]}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconContainer, { backgroundColor: '#EEF2FF' }]}>
                  <Text style={[styles.kpiIcon, { color: '#6366F1' }]}>🩺</Text>
                </View>
              </View>
              <Text style={styles.kpiLabel}>Doctor Visits</Text>
              <Text style={styles.kpiValue}>{docCount} <Text style={styles.kpiTarget}>/ 30</Text></Text>
              <Text style={styles.kpiSubText}>Today's Calls</Text>
            </View>
          </View>

          <View style={styles.kpiRow}>
            <View style={[styles.kpiCard, { shadowColor: '#f59e0b' }]}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconContainer, { backgroundColor: '#FEF3C7' }]}>
                  <Text style={[styles.kpiIcon, { color: '#D97706' }]}>💊</Text>
                </View>
              </View>
              <Text style={styles.kpiLabel}>Chemist Visits</Text>
              <Text style={styles.kpiValue}>{chemistCount} <Text style={styles.kpiTarget}>/ 20</Text></Text>
              <Text style={styles.kpiSubText}>Today's Calls</Text>
            </View>

            <View style={[styles.kpiCard, { shadowColor: '#06b6d4' }]}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconContainer, { backgroundColor: '#ECFEFF' }]}>
                  <Text style={[styles.kpiIcon, { color: '#06B6D4' }]}>🛒</Text>
                </View>
              </View>
              <Text style={styles.kpiLabel}>Orders Booked</Text>
              <Text style={styles.kpiValue}>{ordersCount}</Text>
              <Text style={styles.kpiSubText}>₹{totalOrders.toLocaleString()} Today</Text>
            </View>
          </View>

          <View style={[styles.largeCard, { shadowColor: '#8B5CF6' }]}>
            <Text style={styles.cardTitle}>🎯 Monthly Target Progress</Text>
            <View style={styles.targetLabelRow}>
              <Text style={styles.targetLabel}>Monthly Sales Target</Text>
              <Text style={[styles.targetValue, { color: '#4F46E5' }]}>{salesProgress}%</Text>
            </View>
            <View style={styles.progressBar}><View style={[styles.progressFill, { width: `${salesProgress}%`, backgroundColor: '#4F46E5' }]} /></View>
            <Text style={styles.kpiSubText}>₹{totalOrders.toLocaleString()} / ₹50,000</Text>
            
            <View style={styles.splitTargetsRow}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <View style={styles.targetLabelRow}>
                  <Text style={styles.targetLabel}>Doctor Target</Text>
                  <Text style={[styles.targetValue, { color: '#10B981' }]}>{doctorProgress}%</Text>
                </View>
                <View style={styles.progressBar}><View style={[styles.progressFill, { width: `${doctorProgress}%`, backgroundColor: '#10B981' }]} /></View>
                <Text style={styles.kpiSubText}>{docCount} / 30</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <View style={styles.targetLabelRow}>
                  <Text style={styles.targetLabel}>Chemist Target</Text>
                  <Text style={[styles.targetValue, { color: '#F59E0B' }]}>{chemistProgress}%</Text>
                </View>
                <View style={styles.progressBar}><View style={[styles.progressFill, { width: `${chemistProgress}%`, backgroundColor: '#F59E0B' }]} /></View>
                <Text style={styles.kpiSubText}>{chemistCount} / 20</Text>
              </View>
            </View>
          </View>

          <View style={styles.largeCard}>
            <Text style={styles.cardTitle}>📅 Today's Schedule</Text>
            {scheduleList.length > 0 ? (
              scheduleList.map((item, idx) => <Text key={idx}>{item.title}</Text>)
            ) : (
              <View style={styles.emptyBox}><Text style={styles.emptyText}>No schedule planned today.</Text></View>
            )}
          </View>

          <View style={styles.largeCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={styles.cardTitle}>⏰ Pending Follow-Ups</Text>
              <Text style={styles.dueTodayText}>{followUps.length} Due</Text>
            </View>
            {followUps.length > 0 ? (
              followUps.map((visit: any, index: number) => (
                <View key={index} style={styles.listRow}>
                  <Text style={styles.listTitleText}>Dr. {visit.doctorName}</Text>
                  <Text style={styles.listSubText}>📅 {visit.followUpDate}</Text>
                </View>
              ))
            ) : (
              <View style={styles.emptyBox}><Text style={styles.emptyText}>No pending follow-ups.</Text></View>
            )}
          </View>

          <View style={styles.largeCard}>
            <Text style={styles.cardTitle}>📍 Recent Visits</Text>
            {recentVisitsList.length > 0 ? (
              recentVisitsList.map((visit, index) => (
                <View key={index} style={styles.listRow}>
                  <View>
                    <Text style={styles.listTitleText}>{visit.name}</Text>
                    <Text style={styles.listSubText}>{visit.type} • {visit.time}</Text>
                  </View>
                  <View style={[styles.statusPill, { backgroundColor: visit.status === 'Completed' ? '#DEF7EC' : '#FEF3C7' }]}>
                    <Text style={[styles.statusPillText, { color: visit.status === 'Completed' ? '#03543F' : '#D97706' }]}>{visit.status}</Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No recent visits.</Text>
            )}
          </View>

          <View style={styles.largeCard}>
            <Text style={styles.cardTitle}>🛒 Recent Orders</Text>
            {recentOrdersList.length > 0 ? (
              recentOrdersList.map((order, index) => (
                <View key={`${order.id}-${index}`} style={styles.listRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.listTitleText}>{order.client}</Text>
                    <Text style={styles.listSubText}>{order.id}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.orderAmountText}>{order.amount}</Text>
                    <View style={[styles.statusPill, { marginTop: 4, backgroundColor: order.status === 'Shipped' ? '#DEF7EC' : order.status === 'Pending' ? '#FEF3C7' : '#FDE8E8' }]}>
                      <Text style={[styles.statusPillText, { color: order.status === 'Shipped' ? '#03543F' : order.status === 'Pending' ? '#D97706' : '#9B1C1C' }]}>{order.status}</Text>
                    </View>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No orders recorded.</Text>
            )}
          </View>

          <View style={styles.largeCard}>
            <Text style={styles.cardTitle}>🔔 Notifications</Text>
            {notificationsList.length > 0 ? (
              notificationsList.map((notif, index) => (
                <View key={index} style={styles.listRow}>
                  <View style={[styles.notificationDot, { 
                    backgroundColor: notif.type === 'meeting' ? '#3B82F6' : notif.type === 'target' ? '#10B981' : '#F43F5E' 
                  }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.listTitleText}>{notif.text}</Text>
                    <Text style={styles.listSubText}>{notif.time}</Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No new notifications.</Text>
            )}
          </View>

          <View style={styles.largeCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={styles.cardTitle}>🧭 GPS Route Summary</Text>
              <Text style={styles.activeGpsText}>Active</Text>
            </View>
            
            {gpsData && (
              <View style={styles.gpsBox}>
                <View style={styles.gpsGrid}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.listSubText}>Distance</Text>
                    <Text style={styles.gpsValue}>{gpsData.distance}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.listSubText}>Check-ins</Text>
                    <Text style={styles.gpsValue}>{gpsData.checkIns}</Text>
                  </View>
                </View>

                <View style={{ marginBottom: 16 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Text style={styles.listSubText}>Route Coverage</Text>
                    <Text style={[styles.gpsValue, { fontSize: 12, color: '#3B82F6' }]}>{gpsData.coverage}%</Text>
                  </View>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${gpsData.coverage}%`, backgroundColor: '#3B82F6' }]} />
                  </View>
                </View>

                <View style={{ borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 12 }}>
                  <Text style={styles.listSubText}>Territory</Text>
                  <Text style={styles.listTitleText}>{gpsData.territory}</Text>
                  <Text style={[styles.listSubText, { marginTop: 6 }]}>Last Ping: {gpsData.lastLocation}</Text>
                </View>
              </View>
            )}
          </View>

        </View>
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── CUSTOM SLIDE-OUT DRAWER MENU MODAL ── */}
      <Modal visible={isMenuOpen} transparent={true} animationType="fade" onRequestClose={() => setIsMenuOpen(false)}>
        <TouchableOpacity style={styles.drawerBackdrop} activeOpacity={1} onPress={() => setIsMenuOpen(false)}>
          <TouchableOpacity style={styles.drawerContainer} activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <View style={styles.drawerHeader}>
              <View style={styles.logoRow}>
                <Image source={require('../../../assets/images/logo.png')} style={styles.drawerLogo} resizeMode="contain" />
                <View style={styles.logoTextContainer}>
                  <Text style={styles.logoText}>Pharma ERP</Text>
                  <Text style={styles.logoSubtitle}>MJ Healthcare</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setIsMenuOpen(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Text style={styles.closeIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.drawerScroll}>
              <TouchableOpacity style={[styles.drawerItem, styles.activeDrawerItem]} onPress={() => { setIsMenuOpen(false); }}>
                <Text style={[styles.drawerItemText, styles.activeDrawerItemText]}>🏠 Dashboard</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.drawerGroupHeader} onPress={() => setShowMROps(!showMROps)}>
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
                    <TouchableOpacity key={index} style={styles.drawerSubItem} onPress={() => { setIsMenuOpen(false); navigation.navigate(item.route); }}>
                      <Text style={styles.drawerSubItemText}>{item.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <TouchableOpacity style={styles.drawerGroupHeader} onPress={() => setShowGPS(!showGPS)}>
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
                    <TouchableOpacity key={index} style={styles.drawerSubItem} onPress={() => { setIsMenuOpen(false); navigation.navigate(item.route); }}>
                      <Text style={styles.drawerSubItemText}>{item.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <TouchableOpacity style={styles.drawerGroupHeader} onPress={() => setShowAlerts(!showAlerts)}>
                <Text style={styles.drawerGroupLabel}>🔔 Alerts & Notifications</Text>
                <Text style={styles.arrowIcon}>{showAlerts ? '▲' : '▼'}</Text>
              </TouchableOpacity>
              {showAlerts && (
                <View style={styles.groupChildren}>
                  {[
                    { label: '🤝 Meeting Reminders', route: 'Notifications' },
                    { label: '🎯 Follow-Up Reminders', route: 'FollowUpReminders' },
                    { label: '🧪 Expiry Alerts', route: 'ExpiryAlerts' },
                    { label: '🔔 Activity Notifications', route: 'Notifications' },
                  ].map((item, index) => (
                    <TouchableOpacity key={index} style={styles.drawerSubItem} onPress={() => { setIsMenuOpen(false); navigation.navigate(item.route); }}>
                      <Text style={styles.drawerSubItemText}>{item.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <TouchableOpacity style={styles.drawerGroupHeader} onPress={() => setShowSettings(!showSettings)}>
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
                    <TouchableOpacity key={index} style={styles.drawerSubItem} onPress={() => { setIsMenuOpen(false); navigation.navigate(item.route); }}>
                      <Text style={styles.drawerSubItemText}>{item.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </ScrollView>

            <View style={styles.drawerFooter}>
              <View style={styles.avatarCircleSmall}>
                <Text style={styles.avatarTextSmall}>{userName.split(' ').map(n => n[0]).join('').toUpperCase()}</Text>
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
    backgroundColor: '#F8FAFC' 
  },
  
  // RESTORED: Exact styles from your perfectly working code!
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
  
  avatarCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#8B5CF6', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 },
  profileMeta: { flex: 1, marginLeft: 12 },
  welcomeText: { fontSize: 16, fontWeight: 'bold', color: '#1E293B' },
  designationText: { fontSize: 12, color: '#64748B', marginTop: 2 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#DEF7EC', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  greenDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#31C48D', marginRight: 6 },
  statusText: { color: '#03543F', fontSize: 11, fontWeight: 'bold' },
  
  // RESTORED: Date text style
  dateText: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 12,
  },
  
  contentPadding: { padding: 16 },
  kpiRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  
  kpiCard: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 24, padding: 16, borderWidth: 1, borderColor: '#F1F5F9', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 4 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  iconContainer: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  kpiIcon: { fontSize: 18 },
  kpiLabel: { fontSize: 12, color: '#64748B', fontWeight: '600' },
  kpiValue: { fontSize: 22, fontWeight: 'bold', color: '#0F172A', marginTop: 4 },
  kpiTarget: { fontSize: 16, color: '#94A3B8' },
  kpiSubText: { fontSize: 10, color: '#94A3B8', marginTop: 4 },

  largeCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#94A3B8', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 2, marginBottom: 16 },
  cardTitle: { fontSize: 15, fontWeight: 'bold', color: '#1E293B', marginBottom: 16 },
  
  targetLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  targetLabel: { fontSize: 11, color: '#475569', fontWeight: '600' },
  targetValue: { fontSize: 11, fontWeight: 'bold' },
  progressBar: { height: 6, backgroundColor: '#F1F5F9', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  splitTargetsRow: { flexDirection: 'row', marginTop: 16 },

  emptyBox: { backgroundColor: '#F8FAFC', borderRadius: 12, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: '#F1F5F9', borderStyle: 'dashed' },
  emptyText: { fontSize: 12, color: '#94A3B8', fontStyle: 'italic', textAlign: 'center' },
  
  dueTodayText: { fontSize: 11, color: '#E11D48', fontWeight: 'bold', backgroundColor: '#FFE4E6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, overflow: 'hidden' },
  
  listRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  listTitleText: { fontSize: 13, fontWeight: '600', color: '#1E293B' },
  listSubText: { fontSize: 11, color: '#64748B', marginTop: 2 },
  
  orderAmountText: { fontSize: 13, fontWeight: '700', color: '#0F172A' },
  
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  statusPillText: { fontSize: 10, fontWeight: 'bold' },

  notificationDot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  
  activeGpsText: { fontSize: 11, color: '#2563EB', fontWeight: 'bold', backgroundColor: '#DBEAFE', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, overflow: 'hidden' },
  gpsBox: { backgroundColor: '#F8FAFC', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#F1F5F9' },
  gpsGrid: { flexDirection: 'row', marginBottom: 16 },
  gpsValue: { fontSize: 16, fontWeight: 'bold', color: '#0F172A', marginTop: 2 },
  
  drawerBackdrop: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.4)' },
  drawerContainer: { width: '78%', height: '100%', backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 4, height: 0 }, shadowOpacity: 0.1, shadowRadius: 15, elevation: 16, paddingTop: 50, paddingBottom: 20, display: 'flex' },
  drawerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  logoRow: { flexDirection: 'row', alignItems: 'center' },
  drawerLogo: { width: 150, height: 50, marginRight: 8 },
  logoTextContainer: { flexDirection: 'column', justifyContent: 'center', marginLeft: 10 },
  logoText: { fontSize: 16, fontWeight: 'bold', color: '#0F172A' },
  logoSubtitle: { fontSize: 11, color: '#64748B', marginTop: 2, fontWeight: '500' },
  closeIcon: { fontSize: 18, color: '#64748B', fontWeight: 'bold' },
  drawerScroll: { flex: 1, paddingHorizontal: 12, paddingTop: 15 },
  drawerItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, marginBottom: 4 },
  activeDrawerItem: { backgroundColor: '#F3E8FF' },
  drawerItemText: { fontSize: 13.5, fontWeight: '500', color: '#475569' },
  activeDrawerItemText: { color: '#8B5CF6', fontWeight: 'bold' },
  drawerGroupHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, marginTop: 4 },
  drawerGroupLabel: { fontSize: 13.5, fontWeight: '600', color: '#334155' },
  arrowIcon: { fontSize: 10, color: '#94A3B8' },
  groupChildren: { paddingLeft: 24, backgroundColor: '#FAF9F6', borderRadius: 12, paddingVertical: 4, marginTop: 2 },
  drawerSubItem: { paddingVertical: 10, paddingHorizontal: 12 },
  drawerSubItemText: { fontSize: 12.5, color: '#475569', fontWeight: '500' },
  drawerFooter: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 16, paddingHorizontal: 20 },
  avatarCircleSmall: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' },
  avatarTextSmall: { color: '#6366F1', fontWeight: 'bold', fontSize: 13 },
  footerUserName: { fontSize: 13.5, fontWeight: 'bold', color: '#0F172A' },
  footerUserRole: { fontSize: 11, color: '#64748B', marginTop: 1 }
});