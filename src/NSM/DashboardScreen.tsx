import React, { useState, useCallback } from 'react';
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
  Dimensions,
  Animated,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';
import { getTargetPlanningData, getRSMList } from '../services/nsmStorageService';
import { LineChart } from 'react-native-chart-kit';

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

  const [unreadCount, setUnreadCount] = useState(0);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [isSalesOpsOpen, setIsSalesOpsOpen] = useState(false);
  const [isCRMOpen, setIsCRMOpen] = useState(false);
  const [selectedYear] = useState('2026-2027');
  const [selectedMonth] = useState('August');
  const [selectedRegion] = useState('All Regions');
  const [selectedState] = useState('All States');

  // Animation values for custom drawer
  const screenWidth = Dimensions.get('window').width;
  const slideAnim = React.useRef(new Animated.Value(-screenWidth)).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (isMenuVisible) {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: -screenWidth, duration: 250, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
      ]).start();
    }
  }, [isMenuVisible, slideAnim, fadeAnim, screenWidth]);

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

  const [nationalTarget, setNationalTarget] = useState('₹0');
  const [achievedTarget, setAchievedTarget] = useState('₹0');
  const [remainingTarget, setRemainingTarget] = useState('₹0');
  const [activeRSMsCount, setActiveRSMsCount] = useState(0);
  const [stateCoverage, setStateCoverage] = useState('0%');
  const [pendingApprovals, setPendingApprovals] = useState(0);
  const [dynamicRSMs, setDynamicRSMs] = useState<any[]>([]);
  const [monthlyTrendData, setMonthlyTrendData] = useState<any[]>([]);
  const [topStatesList, setTopStatesList] = useState<any[]>([]);
  const [topProductsList, setTopProductsList] = useState<any[]>([]);

  useFocusEffect(
    useCallback(() => {
      const loadDashboardData = async () => {
        // Fetch Unread Notifications
        try {
          const mrId = await AsyncStorage.getItem('@mrId');
          if (mrId) {
            const notifRes = await api.get(`/notifications/mr/${mrId}`);
            if (notifRes.data && notifRes.data.success) {
               const unread = notifRes.data.data.filter((n: any) => !n.isRead).length;
               setUnreadCount(unread);
            }
          }
        } catch(e) {}
    
        try {
          const formatCurrency = (val: number) => {
            return new Intl.NumberFormat('en-IN', {
              style: 'currency',
              currency: 'INR',
              maximumFractionDigits: 0,
            }).format(val);
          };

          const keepMenuOpen = await AsyncStorage.getItem('@nsm_keep_menu_open');
          if (keepMenuOpen === 'true') {
            slideAnim.setValue(0);
            fadeAnim.setValue(1);
            setIsMenuVisible(true);
            await AsyncStorage.removeItem('@nsm_keep_menu_open');
          }

          // Fetch Live Data
          const token = await AsyncStorage.getItem('@token');
          const response = await api.get('/dashboard/nsm', {
            headers: { Authorization: `Bearer ${token}` }
          });
          const liveData = response.data?.data;
          
          if (liveData) {
            setNationalTarget(formatCurrency(liveData.nationalTarget || 0));
            setAchievedTarget(formatCurrency(liveData.achievedTarget || 0));
            setRemainingTarget(formatCurrency(liveData.remainingTarget || 0));
            setActiveRSMsCount(liveData.activeRSMCount || 0);
            setStateCoverage(`${liveData.stateCoverage || 0}%`);
            setPendingApprovals(liveData.pendingApprovals || 0);

            // Mapping Monthly Trend
            if (liveData.monthlyData && liveData.monthlyData.length > 0) {
              setMonthlyTrendData(liveData.monthlyData);
            }

            // Mapping Top States
            if (liveData.topStates && liveData.topStates.length > 0) {
              const formattedStates = liveData.topStates.map((s: any) => ({
                ...s,
                target: formatCurrency(s.target),
                achieved: formatCurrency(s.achieved)
              }));
              setTopStatesList(formattedStates);
            }

            // Mapping Top Products
            if (liveData.topProducts && liveData.topProducts.length > 0) {
              setTopProductsList(liveData.topProducts.map((p: any) => p.name));
            }
          }
        } catch (error) {
          console.log('Error loading dashboard live data:', error);
        }
      };

      loadDashboardData();
    }, [])
  );

  const handleRefresh = () => {
    Alert.alert('↻ Dashboard Refreshed', 'Production KPI metrics updated.');
  };

  const handleNavigate = async (routeKey: string) => {
    setIsMenuVisible(false);
    if (routeKey === NSM_ROUTES.AUTH) {
      if (Platform.OS === 'web') {
        const confirmLogout = window.confirm('Are you sure you want to log out of the NSM Portal?');
        if (confirmLogout) {
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        }
      } else {
        Alert.alert(
          '🚪 Logout',
          'Are you sure you want to log out of the NSM Portal?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Logout', onPress: () => navigation.reset({ index: 0, routes: [{ name: 'Login' }] }), style: 'destructive' }
          ]
        );
      }
    } else {
      // Set a flag so when we come back, the menu re-opens automatically
      await AsyncStorage.setItem('@nsm_keep_menu_open', 'true');
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

            <TouchableOpacity onPress={() => navigation.navigate(NSM_ROUTES.NOTIFICATIONS)} style={{ padding: 4, marginRight: 8, position: 'relative' }}>
              <Ionicons name="notifications-outline" size={22} color="#FFF" />
              
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate(NSM_ROUTES.PROFILE)} style={{ padding: 4 }}>
              <Ionicons name="person-circle-outline" size={26} color="#FFF" />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>Executive overview of national sales performance and targets.</Text>
        </View>

        {/* 2. 6 KPI Cards (Web UI Layout) */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: 16, marginTop: 10 }}>
          <View style={styles.summaryCard}>
            <View style={styles.iconCircleBlue}><Ionicons name="disc-outline" size={20} color="#3B82F6" /></View>
            <Text style={styles.summaryLabel}>Assigned National Target</Text>
            <Text style={styles.summaryValue}>{nationalTarget}</Text>
            <Text style={styles.summarySubtext}>FY 2026-27</Text>
          </View>

          <View style={styles.summaryCard}>
            <View style={styles.iconCircleGreen}><Ionicons name="trending-up-outline" size={20} color="#10B981" /></View>
            <Text style={styles.summaryLabel}>Achieved Target</Text>
            <Text style={styles.summaryValue}>{achievedTarget}</Text>
            <Text style={styles.summarySubtext}>0.0% Achievement</Text>
          </View>

          <View style={styles.summaryCard}>
            <View style={styles.iconCircleOrange}><Ionicons name="alert-circle-outline" size={20} color="#F59E0B" /></View>
            <Text style={styles.summaryLabel}>Remaining Target</Text>
            <Text style={styles.summaryValue}>{remainingTarget}</Text>
            <Text style={styles.summarySubtext}>Pending realization</Text>
          </View>

          <View style={styles.summaryCard}>
            <View style={styles.iconCirclePurple}><Ionicons name="people-outline" size={20} color="#8B5CF6" /></View>
            <Text style={styles.summaryLabel}>Active RSMs</Text>
            <Text style={styles.summaryValue}>{activeRSMsCount}</Text>
            <Text style={styles.summarySubtext}>Direct reports</Text>
          </View>

          <View style={styles.summaryCard}>
            <View style={styles.iconCirclePurple}><Ionicons name="location-outline" size={20} color="#8B5CF6" /></View>
            <Text style={styles.summaryLabel}>State Coverage</Text>
            <Text style={styles.summaryValue}>{stateCoverage}</Text>
            <Text style={styles.summarySubtext}>Of planned territories</Text>
          </View>

          <View style={styles.summaryCard}>
            <View style={[styles.iconCirclePurple, { backgroundColor: '#FCE7F3' }]}><Ionicons name="checkbox-outline" size={20} color="#EC4899" /></View>
            <Text style={styles.summaryLabel}>Pending Approvals</Text>
            <Text style={styles.summaryValue}>{pendingApprovals}</Text>
            <Text style={styles.summarySubtext}>Awaiting your review</Text>
          </View>
        </View>

        {/* 3. Charts Section */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Monthly Sales Trend</Text>
          <LineChart
            data={{
              labels: monthlyTrendData.length > 0 ? monthlyTrendData.map(d => d.name) : ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
              datasets: [
                {
                  data: monthlyTrendData.length > 0 ? monthlyTrendData.map(d => Number(d.target) / 10000000) : [1.5, 1.5, 1.5, 1.7, 1.7, 2.0], // Convert to Cr
                  color: (opacity = 1) => `rgba(148, 163, 184, 1)`, // Gray (Target)
                  strokeWidth: 2,
                  strokeDashArray: [5, 5]
                },
                {
                  data: monthlyTrendData.length > 0 ? monthlyTrendData.map(d => Number(d.sales) / 10000000) : [0, 0, 0, 0, 0, 0], // Convert to Cr
                  color: (opacity = 1) => `rgba(30, 58, 138, 1)`, // Dark Blue (Actual)
                  strokeWidth: 2,
                }
              ]
            }}
            width={Dimensions.get('window').width - 64} // padding adjustment
            height={220}
            bezier
            withDots={false}
            withShadow={false}
            withInnerLines={false}
            withOuterLines={false}
            withVerticalLines={false}
            withHorizontalLines={true}
            yAxisLabel="₹"
            yAxisSuffix="Cr"
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              decimalPlaces: 1,
              color: (opacity = 1) => `rgba(15, 23, 42, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(100, 116, 139, 1)`,
              style: {
                borderRadius: 16
              },
              propsForDots: {
                r: "4",
                strokeWidth: "2",
                stroke: "#ffffff"
              }
            }}
            style={{
              marginTop: 16,
              borderRadius: 16,
              marginLeft: -20, // Align closer to left edge
            }}
          />
          
          {/* Custom Web-Style Legend */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: -10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 20 }}>
              <View style={{ width: 12, height: 2, backgroundColor: '#1E3A8A', marginRight: 4 }} />
              <Ionicons name="ellipse" size={6} color="#1E3A8A" style={{ marginLeft: -8, marginRight: 6 }} />
              <Text style={{ fontSize: 11, color: '#64748B', fontWeight: '500' }}>Actual Sales</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 12, height: 2, backgroundColor: '#94A3B8', borderStyle: 'dashed', marginRight: 4 }} />
              <Ionicons name="ellipse-outline" size={6} color="#94A3B8" style={{ marginLeft: -8, marginRight: 6 }} />
              <Text style={{ fontSize: 11, color: '#64748B', fontWeight: '500' }}>Target</Text>
            </View>
          </View>
        </View>

        {/* Top Products */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Top Products</Text>
          
          <View style={{ marginTop: 16 }}>
            {(topProductsList.length > 0 ? topProductsList : ['No Products Found']).map((prod, idx) => (
              <View key={idx} style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', alignItems: 'center' }}>
                <Text style={{ fontSize: 13, color: '#475569', fontWeight: '500' }}>{prod}</Text>
              </View>
            ))}
          </View>
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

          {topStatesList.map((s, idx) => (
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
            <Text style={[styles.th, { flex: 1 }]}>Target</Text>
            <Text style={[styles.th, { flex: 1 }]}>Achieved</Text>
            <Text style={[styles.th, { flex: 1, textAlign: 'right' }]}>Grade</Text>
          </View>

          {dynamicRSMs.map((r, idx) => (
            <View key={idx} style={styles.tableBodyRow}>
              <View style={{ flex: 1.2 }}>
                <Text style={[styles.td, { fontWeight: 'bold' }]}>{r.rsm}</Text>
                <Text style={{ fontSize: 10, color: '#94A3B8' }}>{r.region}</Text>
              </View>
              <Text style={[styles.td, { flex: 1 }]}>{r.target}</Text>
              <Text style={[styles.td, { flex: 0.9, color: '#059669', fontWeight: 'bold' }]}>{r.achieved}</Text>
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <View style={styles.gradeBadge}>
                  <Text style={{ fontSize: 9, color: '#16A34A', fontWeight: 'bold' }}>{r.grade}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
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
        <View style={styles.webDrawerHeader}>
          <Image source={require('../../assets/images/header_logo.jpg')} style={{ width: 170, height: 48, resizeMode: 'contain' }} />
        </View>

        <ScrollView style={{ paddingHorizontal: 12, paddingVertical: 10 }}>
          <TouchableOpacity style={styles.activePillMenuItem} onPress={() => handleNavigate(NSM_ROUTES.DASHBOARD)}>
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
              <TouchableOpacity style={styles.subMenuItem} onPress={() => { setIsMenuVisible(false); handleNavigate(NSM_ROUTES.RSM_SUPERVISION); }}>
                <Text style={styles.subMenuItemText}>RSM Management</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.subMenuItem} onPress={() => { setIsMenuVisible(false); handleNavigate(NSM_ROUTES.TARGET); }}>
                <Text style={styles.subMenuItemText}>Target Planning</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.subMenuItem} onPress={() => { setIsMenuVisible(false); handleNavigate(NSM_ROUTES.STATE); }}>
                <Text style={styles.subMenuItemText}>State Performance</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.subMenuItem} onPress={() => { setIsMenuVisible(false); handleNavigate(NSM_ROUTES.TEAM_PERFORMANCE); }}>
                <Text style={styles.subMenuItemText}>Team Performance</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.subMenuItem} onPress={() => { setIsMenuVisible(false); handleNavigate(NSM_ROUTES.TEAM_VISITS); }}>
                <Text style={styles.subMenuItemText}>Team Visits</Text>
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
      </Animated.View>
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

  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#1E293B', marginBottom: 10, marginTop: 4 },

  // Summary Cards (Web UI Layout Match)
  summaryCard: { backgroundColor: '#FFF', width: '48%', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 12 },
  iconCircleBlue: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#DBEAFE', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  iconCircleGreen: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#D1FAE5', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  iconCircleOrange: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#FEF3C7', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  iconCirclePurple: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#EDE9FE', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  summaryLabel: { fontSize: 11, color: '#64748B', fontWeight: '600', marginBottom: 4 },
  summaryValue: { fontSize: 16, fontWeight: 'bold', color: '#0F172A' },
  summarySubtext: { fontSize: 10, color: '#94A3B8', marginTop: 4 },

  chartCard: { backgroundColor: '#FFF', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 14 },
  chartTitle: { fontSize: 14, fontWeight: 'bold', color: '#1E293B', marginBottom: 10 },
  barChartRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 100 },
  barCol: { alignItems: 'center', flex: 1 },
  barVal: { fontSize: 9, fontWeight: 'bold', color: '#64748B', marginBottom: 4 },
  barFill: { width: 18, backgroundColor: '#4F46E5', borderRadius: 4 },
  barLbl: { fontSize: 10, color: '#64748B', marginTop: 4, fontWeight: '600' },

  tableCard: { backgroundColor: '#FFF', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  tableTitle: { fontSize: 15, fontWeight: 'bold', color: '#1E293B', marginBottom: 10 },
  tableHeaderRow: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', backgroundColor: '#F8FAFC' },
  th: { fontSize: 11, fontWeight: 'bold', color: '#64748B' },
  tableBodyRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  td: { fontSize: 12, color: '#334155' },
  gradeBadge: { backgroundColor: '#DCFCE7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  gradeText: { fontSize: 9, fontWeight: 'bold', color: '#15803D' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.5)', justifyContent: 'center', alignItems: 'center' },
  drawerContainer: { width: '50%', maxWidth: 260, height: '100%', backgroundColor: '#FFF', elevation: 10, alignSelf: 'flex-start' },
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
