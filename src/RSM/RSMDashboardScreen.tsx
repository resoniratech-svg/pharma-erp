import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  ActivityIndicator
} from 'react-native';
import { getRSMDashboard } from '../services/dashboardService';

const { width, height } = Dimensions.get('window');
const DRAWER_WIDTH = width * 0.50; // Keep 50% width exactly like NSM

export const RSM_ROUTES = {
  DASHBOARD: 'RSMDashboard',
  ASM_MANAGEMENT: 'ASMManagement',
  TARGET: 'RSMTargetAllocation',
  REGIONAL: 'RSMRegionalPerformance',
  TEAM_PERFORMANCE: 'RSMTeamPerformance',
  TEAM_VISITS: 'RSMTeamVisits',
  DISTRIBUTOR_MANAGEMENT: 'RSMDistributorManagement',
  ATTENDANCE: 'RSMAttendance',
  SETTINGS: 'RSMSettings',
  NOTIFICATIONS: 'RSMNotifications',
  AUTH: 'Login' // Maps back to the auth navigator
};

const RSMDashboardScreen = () => {
  const navigation = useNavigation<any>();
  const [isSalesOpsOpen, setIsSalesOpsOpen] = useState(false);
  const [isCRMOpen, setIsCRMOpen] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      fetchDashboard();
    }, [])
  );

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const data = await getRSMDashboard();
      setDashboardData(data);
    } catch (error) {
      console.error('Failed to load RSM Dashboard', error);
      Alert.alert('Error', 'Could not load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  // Handles the smooth slide-in and out of the left menu
  useEffect(() => {
    if (isMenuVisible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -DRAWER_WIDTH,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isMenuVisible]);

  // If a user navigated to a child screen and hits back, re-open the menu automatically
  useFocusEffect(
    React.useCallback(() => {
      const checkMenuState = async () => {
        const keepMenuOpen = await AsyncStorage.getItem('@rsm_keep_menu_open');
        const salesOpsOpen = await AsyncStorage.getItem('@rsm_sales_ops_open');

        if (keepMenuOpen === 'true') {
          slideAnim.setValue(0);
          fadeAnim.setValue(1);
          setIsMenuVisible(true);
          await AsyncStorage.removeItem('@rsm_keep_menu_open');
        }
        
        if (salesOpsOpen === 'true') {
          setIsSalesOpsOpen(true);
          await AsyncStorage.removeItem('@rsm_sales_ops_open');
        }
      };
      checkMenuState();
    }, [slideAnim, fadeAnim])
  );

  const handleNavigate = async (routeKey: string, keepSalesOpsOpen: boolean = false) => {
    setIsMenuVisible(false);
    if (routeKey === 'Login') {
      if (Platform.OS === 'web') {
        const confirmLogout = window.confirm('Are you sure you want to log out?');
        if (confirmLogout) {
          navigation.replace('Login');
        }
      } else {
        Alert.alert('Logout', 'Are you sure you want to log out?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Logout', onPress: () => navigation.replace('Login'), style: 'destructive' }
        ]);
      }
    } else {
      await AsyncStorage.setItem('@rsm_keep_menu_open', 'true');
      if (keepSalesOpsOpen) {
        await AsyncStorage.setItem('@rsm_sales_ops_open', 'true');
      }
      navigation.navigate(routeKey);
    }
  };

  const handlePendingApprovalView = (src: string) => {
    if (src === 'Attendance') {
      navigation.navigate(RSM_ROUTES.ATTENDANCE);
    } else if (src === 'Team Visit') {
      navigation.navigate(RSM_ROUTES.TEAM_VISITS);
    } else if (src === 'Distributor') {
      navigation.navigate(RSM_ROUTES.DISTRIBUTOR_MANAGEMENT);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16 }}>
        {/* ── Top Header Bar ── */}
        <View style={styles.header}>
          <View style={styles.headerActionBar}>
            {/* Hamburger Icon on the Left */}
            <TouchableOpacity onPress={() => setIsMenuVisible(true)} style={{ padding: 4 }}>
              <Ionicons name="menu-outline" size={26} color="#FFF" />
            </TouchableOpacity>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.title}>Regional Sales Manager (RSM)</Text>
            </View>

            {/* Header Icons */}
            <TouchableOpacity onPress={() => navigation.navigate(RSM_ROUTES.NOTIFICATIONS)} style={{ padding: 4, marginRight: 8, position: 'relative' }}>
              <Ionicons name="notifications-outline" size={22} color="#FFF" />
              <View style={[styles.notifBadge, { position: 'absolute', top: 2, right: 2, backgroundColor: '#EF4444', width: 14, height: 14, borderRadius: 7, justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: '#FFF', fontSize: 9, fontWeight: 'bold' }}>3</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate(RSM_ROUTES.SETTINGS)} style={{ padding: 4 }}>
              <Ionicons name="person-circle-outline" size={26} color="#FFF" />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>Executive overview of regional sales performance and targets.</Text>
        </View>

        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 }}>
            <ActivityIndicator size="large" color="#4F46E5" />
            <Text style={{ marginTop: 10, color: '#6B7280' }}>Loading regional dashboard...</Text>
          </View>
        ) : (
          <View style={styles.cardsRow}>
            <View style={styles.card}>
              <View style={[styles.iconCircle, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="disc-outline" size={18} color="#3B82F6" />
              </View>
              <Text style={styles.cardLabel}>Assigned Target</Text>
              <Text style={styles.cardValue}>₹{((dashboardData?.assignedTarget || 0) / 100000).toFixed(2)} L</Text>
              <Text style={styles.cardSubtitle}>FY 2026-27</Text>
            </View>
            <View style={styles.card}>
              <View style={[styles.iconCircle, { backgroundColor: '#ECFCCB' }]}>
                <Ionicons name="pulse-outline" size={18} color="#65A30D" />
              </View>
              <Text style={styles.cardLabel}>Achieved Target</Text>
              <Text style={styles.cardValue}>₹{((dashboardData?.targetAchievement || 0) / 100000).toFixed(2)} L</Text>
              <Text style={styles.cardSubtitle}>{dashboardData?.achievementPercentage || 0}% Achievement</Text>
            </View>
            <View style={styles.card}>
              <View style={[styles.iconCircle, { backgroundColor: '#FEF2F2' }]}>
                <Ionicons name="alert-circle-outline" size={18} color="#EF4444" />
              </View>
              <Text style={styles.cardLabel}>Remaining Target</Text>
              <Text style={styles.cardValue}>₹{((dashboardData?.remainingTarget || 0) / 100000).toFixed(2)} L</Text>
              <Text style={styles.cardSubtitle}>Pending realization</Text>
            </View>
            <View style={styles.card}>
              <View style={[styles.iconCircle, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="people-outline" size={18} color="#3B82F6" />
              </View>
              <Text style={styles.cardLabel}>Active ASMs</Text>
              <Text style={styles.cardValue}>{dashboardData?.activeAsmCount || 0}</Text>
              <Text style={styles.cardSubtitle}>Direct reports</Text>
            </View>
            <View style={styles.card}>
              <View style={[styles.iconCircle, { backgroundColor: '#FEE2E2' }]}>
                <Ionicons name="navigate-circle-outline" size={18} color="#EF4444" />
              </View>
              <Text style={styles.cardLabel}>Allocations</Text>
              <Text style={[styles.cardValue, { fontSize: 18 }]}>{dashboardData?.allocationStatus || 'Pending Allocation'}</Text>
              <Text style={styles.cardSubtitle}>Status</Text>
            </View>
          </View>
        )}

        <Text style={styles.sectionTitle}>Recent Pending Approvals & Activities</Text>
        <View style={styles.tableCard}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.th, { width: 100 }]}>SOURCE</Text>
                <Text style={[styles.th, { width: 160 }]}>EMPLOYEE / DISTRIBUTOR</Text>
                <Text style={[styles.th, { width: 180 }]}>ACTIVITY</Text>
                <Text style={[styles.th, { width: 80 }]}>DATE</Text>
                <Text style={[styles.th, { width: 120 }]}>STATUS</Text>
                <Text style={[styles.th, { width: 80 }]}>ACTION</Text>
              </View>
              {(dashboardData?.activities?.length > 0 ? dashboardData.activities : []).map((row: any, i: number) => (
                <View key={i} style={styles.tableRow}>
                  <Text style={[styles.td, { width: 100 }]}>{row.src || 'System'}</Text>
                  <Text style={[styles.td, { width: 160, fontWeight: '600', color: '#1E293B' }]}>{row.emp || 'N/A'}</Text>
                  <Text style={[styles.td, { width: 180 }]}>{row.act || '-'}</Text>
                  <Text style={[styles.td, { width: 80 }]}>{row.date || 'Today'}</Text>
                  <View style={{ width: 120, justifyContent: 'center' }}>
                    <View style={[styles.statusBadge, { backgroundColor: row.statBg || '#F1F5F9' }]}>
                      <Text style={[styles.statusText, { color: row.statColor || '#64748B' }]}>{row.stat || 'Pending'}</Text>
                    </View>
                  </View>
                  <View style={{ width: 80, justifyContent: 'center' }}>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => handlePendingApprovalView(row.src || 'Unknown')}>
                      <Ionicons name="eye-outline" size={14} color="#4F46E5" />
                      <Text style={styles.actionBtnText}>View</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
              {(!dashboardData?.activities || dashboardData.activities.length === 0) && (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <Text style={{ color: '#94A3B8' }}>No pending approvals or activities.</Text>
                </View>
              )}
            </View>
          </ScrollView>
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── Slide-out Navigation Drawer (Custom Animated) ── */}
      <Animated.View style={[StyleSheet.absoluteFill, { zIndex: isMenuVisible ? 100 : -1, opacity: fadeAnim, backgroundColor: 'rgba(15, 23, 42, 0.6)' }]} pointerEvents={isMenuVisible ? 'auto' : 'none'}>
        <TouchableWithoutFeedback onPress={() => setIsMenuVisible(false)}>
          <View style={{ flex: 1 }} />
        </TouchableWithoutFeedback>
      </Animated.View>

      <Animated.View style={[
        styles.drawerContainer,
        {
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          zIndex: 101,
          transform: [{ translateX: slideAnim }]
        }
      ]}>
        {/* Sidebar Logo */}
        <View style={styles.webDrawerHeader}>
          <Image source={require('../../assets/images/logo.jpg')} style={{ width: 170, height: 48, resizeMode: 'contain' }} />
        </View>

        {/* Sidebar Links matching exactly to the Web UI Screenshot */}
        <ScrollView style={{ paddingHorizontal: 12, paddingVertical: 10 }}>
          
          <TouchableOpacity style={styles.activePillMenuItem} onPress={() => handleNavigate(RSM_ROUTES.DASHBOARD)}>
            <Ionicons name="grid-outline" size={20} color="#4F46E5" />
            <Text style={styles.activePillMenuText}>Dashboard</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItemHeader} onPress={() => setIsSalesOpsOpen(!isSalesOpsOpen)}>
            <Ionicons name="trending-up-outline" size={20} color="#475569" />
            <Text style={styles.menuItemHeaderText}>Sales Operations</Text>
            <Ionicons name={isSalesOpsOpen ? "chevron-up" : "chevron-down"} size={16} color="#94A3B8" style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>

          {isSalesOpsOpen && (
            <View style={{ paddingLeft: 18, marginVertical: 2 }}>
              <TouchableOpacity style={styles.subMenuItem} onPress={() => handleNavigate(RSM_ROUTES.ASM_MANAGEMENT, true)}>
                <Text style={styles.subMenuItemText}>ASM Management</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.subMenuItem} onPress={() => handleNavigate(RSM_ROUTES.TARGET, true)}>
                <Text style={styles.subMenuItemText}>Target Allocation</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.subMenuItem} onPress={() => handleNavigate(RSM_ROUTES.REGIONAL, true)}>
                <Text style={styles.subMenuItemText}>Regional Performance</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.subMenuItem} onPress={() => handleNavigate(RSM_ROUTES.TEAM_PERFORMANCE, true)}>
                <Text style={styles.subMenuItemText}>Team Performance</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.subMenuItem} onPress={() => handleNavigate(RSM_ROUTES.TEAM_VISITS, true)}>
                <Text style={styles.subMenuItemText}>Team Visits</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.subMenuItem} onPress={() => handleNavigate(RSM_ROUTES.DISTRIBUTOR_MANAGEMENT, true)}>
                <Text style={styles.subMenuItemText}>Distributor Management</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity style={styles.menuItemHeader} onPress={() => setIsCRMOpen(!isCRMOpen)}>
            <Ionicons name="people-outline" size={20} color="#475569" />
            <Text style={styles.menuItemHeaderText}>CRM</Text>
            <Ionicons name={isCRMOpen ? "chevron-up" : "chevron-down"} size={16} color="#94A3B8" style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>

          {isCRMOpen && (
            <View style={{ paddingLeft: 18, marginVertical: 2 }}>
              <TouchableOpacity style={styles.subMenuItem} onPress={() => { setIsMenuVisible(false); navigation.navigate('LeadCreation'); }}>
                <Text style={styles.subMenuItemText}>Lead Creation</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.subMenuItem} onPress={() => { setIsMenuVisible(false); navigation.navigate('Leads'); }}>
                <Text style={styles.subMenuItemText}>Lead Assignment</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.subMenuItem} onPress={() => { setIsMenuVisible(false); navigation.navigate('LeadPipelineTracking'); }}>
                <Text style={styles.subMenuItemText}>Lead Pipeline</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.subMenuItem} onPress={() => { setIsMenuVisible(false); navigation.navigate('FollowUps'); }}>
                <Text style={styles.subMenuItemText}>Follow-Up Management</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.subMenuItem} onPress={() => { setIsMenuVisible(false); navigation.navigate('MeetingScheduler'); }}>
                <Text style={styles.subMenuItemText}>Meeting Scheduling</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.subMenuItem} onPress={() => { setIsMenuVisible(false); navigation.navigate('ActivityTracking'); }}>
                <Text style={styles.subMenuItemText}>Activity Timeline</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.subMenuItem} onPress={() => { setIsMenuVisible(false); navigation.navigate('LeadConversionTracking'); }}>
                <Text style={styles.subMenuItemText}>Lead Conversion</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity style={styles.menuItem} onPress={() => handleNavigate(RSM_ROUTES.ATTENDANCE)}>
            <Ionicons name="time-outline" size={20} color="#475569" />
            <Text style={styles.menuItemText}>Attendance</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => handleNavigate(RSM_ROUTES.SETTINGS)}>
            <Ionicons name="settings-outline" size={20} color="#475569" />
            <Text style={styles.menuItemText}>Settings</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => handleNavigate(RSM_ROUTES.NOTIFICATIONS)}>
            <Ionicons name="notifications-outline" size={20} color="#475569" />
            <Text style={styles.menuItemText}>Notifications Inbox</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Sidebar Footer User Profile */}
        <View style={styles.webUserFooter}>
          <Ionicons name="person-circle-outline" size={36} color="#4F46E5" />
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={styles.footerUserName}>Amitabh Verma</Text>
            <Text style={styles.footerUserRole}>Regional Sales Manager</Text>
          </View>
          <TouchableOpacity onPress={() => handleNavigate(RSM_ROUTES.AUTH)}>
            <Ionicons name="log-out-outline" size={20} color="#DC2626" />
          </TouchableOpacity>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

export default RSMDashboardScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  pageTitle: { fontSize: 22, fontWeight: 'bold', color: '#0F172A', marginTop: 12, marginBottom: 4 },
  pageSubtitle: { fontSize: 13, color: '#64748B', marginBottom: 24 },
  cardsRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: { backgroundColor: '#FFF', width: '48%', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.02, shadowRadius: 4, elevation: 1 },
  iconCircle: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  cardLabel: { fontSize: 12, color: '#64748B', fontWeight: '500', marginBottom: 4 },
  cardValue: { fontSize: 22, fontWeight: 'bold', color: '#0F172A', marginBottom: 4 },
  cardSubtitle: { fontSize: 10, color: '#94A3B8' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#0F172A', marginTop: 12, marginBottom: 16 },
  tableCard: { backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1, borderColor: '#F1F5F9', overflow: 'hidden' },
  tableHeaderRow: { flexDirection: 'row', backgroundColor: '#F8FAFC', paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  th: { fontSize: 11, fontWeight: '700', color: '#94A3B8', letterSpacing: 0.5 },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  td: { fontSize: 13, color: '#475569' },
  statusBadge: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 12, alignSelf: 'flex-start' },
  statusText: { fontSize: 11, fontWeight: '600' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EEF2FF', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6, alignSelf: 'flex-start' },
  actionBtnText: { color: '#4F46E5', fontSize: 12, fontWeight: '600', marginLeft: 4 },
  header: {
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerActionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  subtitle: {
    fontSize: 13,
    color: '#E0E7FF',
    opacity: 0.9,
  },
  notifBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    width: 14,
    height: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#1E3A8A'
  },
  notifBadgeText: {
    color: '#FFF',
    fontSize: 8,
    fontWeight: 'bold',
  },

  // --- Drawer Styles ---
  drawerContainer: {
    width: DRAWER_WIDTH,
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  webDrawerHeader: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    alignItems: 'center',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#475569',
    marginLeft: 12,
  },
  menuItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 2,
  },
  menuItemHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginLeft: 12,
  },
  subMenuItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 0,
  },
  subMenuItemText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  activePillMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  activePillMenuText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4F46E5',
    marginLeft: 12,
  },
  webUserFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: '#FAFAFA',
  },
  footerUserName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  footerUserRole: {
    fontSize: 11,
    color: '#64748B',
  },
});
