import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  Animated,
  TouchableWithoutFeedback,
  Platform,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');
const DRAWER_WIDTH = width * 0.50; // Keep 50% width exactly like NSM/RSM

export const ASM_ROUTES = {
  DASHBOARD: 'ASMDashboard',
  MR_MANAGEMENT: 'ASMMRManagement',
  TARGET_ALLOCATION: 'ASMTargetAllocation',
  TARGET_ACHIEVEMENT: 'ASMTargetAchievement',
  DAILY_ACTIVITIES: 'ASMDailyActivities',
  TOUR_PLANNING: 'ASMTourPlanning',
  ATTENDANCE: 'ASMAttendance',
  SETTINGS: 'ASMSettings',
  NOTIFICATIONS: 'ASMNotifications',
  AUTH: 'Login' // Maps back to the auth navigator
};

const ASMDashboardScreen = () => {
  const [userName, setUserName] = useState('');
  const [designation, setDesignation] = useState('Area Sales Manager');

  // KPI States
  const [activeMRs, setActiveMRs] = useState(12);
  const [assignedTarget, setAssignedTarget] = useState('0.00');
  const [achievedTarget, setAchievedTarget] = useState('0.00');
  const [remainingTarget, setRemainingTarget] = useState('0.00');
  const [achievementPercent, setAchievementPercent] = useState('0');
  const [pendingApprovals, setPendingApprovals] = useState(4); // from the length of activities

  const [dynamicTargets, setDynamicTargets] = useState({ sales: 50000, docs: 30, chemists: 20 });
  const navigation = useNavigation<any>();
  const [isSalesOpsOpen, setIsSalesOpsOpen] = useState(false);
  const [isCRMOpen, setIsCRMOpen] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

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
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isMenuVisible]);

  const handleNavigate = async (routeKey: string, keepSalesOpsOpen: boolean = false) => {
    setIsMenuVisible(false);
    
    if (routeKey === ASM_ROUTES.AUTH) {
      if (Platform.OS === 'web') {
        const confirmLogout = window.confirm('Are you sure you want to log out of the ASM Portal?');
        if (confirmLogout) {
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        }
      } else {
        Alert.alert(
          '🚪 Logout',
          'Are you sure you want to log out of the ASM Portal?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Logout', onPress: () => navigation.reset({ index: 0, routes: [{ name: 'Login' }] }), style: 'destructive' }
          ]
        );
      }
    } else {
      await AsyncStorage.setItem('@asm_keep_menu_open', 'true');
      if (keepSalesOpsOpen) {
        await AsyncStorage.setItem('@asm_sales_ops_open', 'true');
      }
      navigation.navigate(routeKey);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      const checkMenuState = async () => {
        const keepMenuOpen = await AsyncStorage.getItem('@asm_keep_menu_open');
        const salesOpsOpen = await AsyncStorage.getItem('@asm_sales_ops_open');
        
        if (keepMenuOpen === 'true') {
          slideAnim.setValue(0);
          fadeAnim.setValue(1);
          setIsMenuVisible(true);
          await AsyncStorage.removeItem('@asm_keep_menu_open');
        }
        
        if (salesOpsOpen === 'true') {
          setIsSalesOpsOpen(true);
          await AsyncStorage.removeItem('@asm_sales_ops_open');
        }
      };
      checkMenuState();
    }, [slideAnim, fadeAnim])
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* ── Top Header Bar ── */}
      <View style={styles.header}>
        <View style={styles.headerActionBar}>
          {/* Hamburger Icon on the Left */}
          <TouchableOpacity onPress={() => setIsMenuVisible(true)} style={{ padding: 4 }}>
            <Ionicons name="menu-outline" size={26} color="#FFF" />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text 
              style={[styles.title, width < 380 && { fontSize: 17 }]} 
              numberOfLines={1}
            >
              Area Sales Manager (ASM)
            </Text>
          </View>

          {/* Header Icons */}
          <TouchableOpacity onPress={() => navigation.navigate(ASM_ROUTES.NOTIFICATIONS)} style={{ padding: 4, marginRight: 8, position: 'relative' }}>
            <Ionicons name="notifications-outline" size={22} color="#FFF" />
            <View style={[styles.notifBadge, { position: 'absolute', top: 2, right: 2, backgroundColor: '#EF4444', width: 14, height: 14, borderRadius: 7, justifyContent: 'center', alignItems: 'center' }]}>
              <Text style={{ color: '#FFF', fontSize: 9, fontWeight: 'bold' }}>3</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate(ASM_ROUTES.SETTINGS)} style={{ padding: 4 }}>
            <Ionicons name="person-circle-outline" size={26} color="#FFF" />
          </TouchableOpacity>
        </View>

        <Text style={styles.subtitle} numberOfLines={1}>Executive overview of area sales performance and targets.</Text>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16 }}>
        <Text style={styles.pageTitle}>Area Sales Dashboard</Text>
        <Text style={styles.pageSubtitle}>Executive overview of area performance and metrics.</Text>

        <View style={styles.cardsRow}>
          <View style={styles.card}>
            <View style={[styles.iconCircle, { backgroundColor: '#EEF2FF' }]}>
              <Ionicons name="people-outline" size={18} color="#4F46E5" />
            </View>
            <Text style={styles.cardLabel}>Active MRs</Text>
            <Text style={styles.cardValue}>{activeMRs}</Text>
          </View>
          <View style={styles.card}>
            <View style={[styles.iconCircle, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="disc-outline" size={18} color="#3B82F6" />
            </View>
            <Text style={styles.cardLabel}>Assigned Target</Text>
            <Text style={styles.cardValue}>₹{assignedTarget} L</Text>
          </View>
          <View style={styles.card}>
            <View style={[styles.iconCircle, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="pulse-outline" size={18} color="#10B981" />
            </View>
            <Text style={styles.cardLabel}>Achieved Target</Text>
            <Text style={styles.cardValue}>₹{achievedTarget} L</Text>
          </View>
          <View style={styles.card}>
            <View style={[styles.iconCircle, { backgroundColor: '#FFFBEB' }]}>
              <Ionicons name="pie-chart-outline" size={18} color="#D97706" />
            </View>
            <Text style={styles.cardLabel}>Remaining Target</Text>
            <Text style={styles.cardValue}>₹{remainingTarget} L</Text>
          </View>
          <View style={styles.card}>
            <View style={[styles.iconCircle, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="analytics-outline" size={18} color="#10B981" />
            </View>
            <Text style={styles.cardLabel}>Achievement %</Text>
            <Text style={styles.cardValue}>{achievementPercent}%</Text>
          </View>
          <View style={styles.card}>
            <View style={[styles.iconCircle, { backgroundColor: '#FEF2F2' }]}>
              <Ionicons name="alert-circle-outline" size={18} color="#EF4444" />
            </View>
            <Text style={styles.cardLabel}>Pending Approvals</Text>
            <Text style={styles.cardValue}>{pendingApprovals}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Recent Pending Approvals & Activities</Text>
        <View style={styles.listContainer}>
          {[
            { id: '1', source: 'Attendance', employee: 'Rahul Verma', activity: 'Late Check-in', date: 'Today', status: 'Pending', statusColor: { bg: '#FEF3C7', text: '#D97706' } },
            { id: '2', source: 'Tour Planning', employee: 'Sneha Patel', activity: 'MTP Approval for May', date: 'Today', status: 'Pending Review', statusColor: { bg: '#FEF3C7', text: '#D97706' } },
            { id: '3', source: 'Attendance', employee: 'Amit Kumar', activity: 'Leave Request (Sick)', date: 'Yesterday', status: 'Pending Approval', statusColor: { bg: '#FEF3C7', text: '#D97706' } },
            { id: '4', source: 'Target Allocation', employee: 'Vikas Singh', activity: 'Target Acknowledgment', date: '2 Days Ago', status: 'Pending', statusColor: { bg: '#FEF3C7', text: '#D97706' } }
          ].map(item => (
            <View key={item.id} style={styles.listItem}>
              <View style={styles.listHeaderRow}>
                <Text style={styles.listTitle}>{item.source}</Text>
                <View style={[styles.statusBadge, { backgroundColor: item.statusColor.bg }]}>
                  <Text style={[styles.statusText, { color: item.statusColor.text }]}>{item.status}</Text>
                </View>
              </View>
              
              <Text style={styles.listSubtitle}>{item.employee}</Text>
              
              <View style={styles.listDetailsRow}>
                <View style={styles.listStat}>
                  <Text style={styles.listStatLabel}>ACTIVITY</Text>
                  <Text style={styles.listStatValue}>{item.activity}</Text>
                </View>
                <View style={styles.listStat}>
                  <Text style={styles.listStatLabel}>DATE</Text>
                  <Text style={styles.listStatValue}>{item.date}</Text>
                </View>
              </View>
              <View style={styles.actionRow}>
                <TouchableOpacity 
                  style={styles.actionBtn}
                  onPress={() => {
                    if (item.source === 'Attendance') {
                      navigation.navigate(ASM_ROUTES.ATTENDANCE);
                    } else if (item.source === 'Tour Planning') {
                      navigation.navigate(ASM_ROUTES.TOUR_PLANNING);
                    } else if (item.source === 'Target Allocation') {
                      navigation.navigate(ASM_ROUTES.TARGET_ALLOCATION);
                    }
                  }}
                >
                  <Ionicons name="eye-outline" size={16} color="#64748B" />
                  <Text style={styles.actionBtnText}>View</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
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
        styles.webDrawer,
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

        {/* Sidebar Links */}
        <ScrollView style={{ paddingHorizontal: 12, paddingVertical: 10 }}>
          
          <TouchableOpacity style={styles.activePillMenuItem} onPress={() => handleNavigate(ASM_ROUTES.DASHBOARD)}>
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
              <TouchableOpacity style={styles.subMenuItem} onPress={() => handleNavigate(ASM_ROUTES.MR_MANAGEMENT, true)}>
                <Text style={styles.subMenuItemText}>MR Management</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.subMenuItem} onPress={() => handleNavigate(ASM_ROUTES.TARGET_ALLOCATION, true)}>
                <Text style={styles.subMenuItemText}>Target Allocation</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.subMenuItem} onPress={() => handleNavigate(ASM_ROUTES.TARGET_ACHIEVEMENT, true)}>
                <Text style={styles.subMenuItemText}>Target Achievement</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.subMenuItem} onPress={() => handleNavigate(ASM_ROUTES.DAILY_ACTIVITIES, true)}>
                <Text style={styles.subMenuItemText}>Daily Activities</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.subMenuItem} onPress={() => handleNavigate(ASM_ROUTES.TOUR_PLANNING, true)}>
                <Text style={styles.subMenuItemText}>Tour Planning</Text>
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

              <TouchableOpacity style={styles.subMenuItem} onPress={() => { setIsMenuVisible(false); navigation.navigate('LeadAssignment'); }}>
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

          <TouchableOpacity style={styles.menuItem} onPress={() => handleNavigate(ASM_ROUTES.ATTENDANCE)}>
            <Ionicons name="time-outline" size={20} color="#475569" />
            <Text style={styles.menuItemText}>Attendance</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => handleNavigate(ASM_ROUTES.SETTINGS)}>
            <Ionicons name="settings-outline" size={20} color="#475569" />
            <Text style={styles.menuItemText}>Settings</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => handleNavigate(ASM_ROUTES.NOTIFICATIONS)}>
            <Ionicons name="notifications-outline" size={20} color="#475569" />
            <Text style={styles.menuItemText}>Notifications Inbox</Text>
          </TouchableOpacity>

        </ScrollView>

        {/* Sidebar Footer User Profile */}
        <View style={styles.webUserFooter}>
          <Ionicons name="person-circle-outline" size={36} color="#4F46E5" />
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={styles.footerUserName}>Suresh</Text>
            <Text style={styles.footerUserRole}>Area Sales Manager</Text>
          </View>
          <TouchableOpacity onPress={() => handleNavigate(ASM_ROUTES.AUTH)}>
            <Ionicons name="log-out-outline" size={20} color="#DC2626" />
          </TouchableOpacity>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

export default ASMDashboardScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9', // Light gray background standard across NSM/RSM
  },
  header: {
    backgroundColor: '#4F46E5', // Indigo-600
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerActionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  subtitle: {
    fontSize: 13,
    color: '#E0E7FF',
    marginTop: 4,
    marginLeft: 6
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 20,
  },
  cardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 16,
    width: '48%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginTop: 10,
    marginBottom: 16,
  },
  listContainer: {
    gap: 12,
  },
  listItem: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  listTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  listSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  listDetailsRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  listStat: {
    flex: 1,
  },
  listStatLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 4,
  },
  listStatValue: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '500',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  // ── Drawer Styles ──
  webDrawer: {
    width: DRAWER_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 5, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
    display: 'flex',
    flexDirection: 'column',
  },
  webDrawerHeader: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Platform.OS === 'ios' ? 40 : 10,
  },
  activePillMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  activePillMenuText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#4F46E5',
    marginLeft: 12,
  },
  webUserFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  menuItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  menuItemHeaderText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#334155',
    marginLeft: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  menuItemText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#475569',
    marginLeft: 12,
  },
  subMenuItem: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginLeft: 16,
  },
  subMenuItemText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  footerUserName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  footerUserRole: {
    fontSize: 11,
    color: '#64748B',
  },
});
