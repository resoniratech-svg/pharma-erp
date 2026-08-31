// ── NSM Module Screens ──
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import NSMAttendanceMonitoringScreen from '../NSM/AttendanceMonitoringScreen';
import NSMDashboardScreen from '../NSM/DashboardScreen';
import NSMSalesOperationsScreen from '../NSM/SalesOperationsScreen';
import NSMRSMMonitoringScreen from '../NSM/RSMMonitoringScreen';
import NSMStatePerformanceScreen from '../NSM/StatePerformanceScreen';
import NSMTargetPlanningScreen from '../NSM/TargetPlanningScreen';
import NSMTeamPerformanceScreen from '../NSM/TeamPerformanceScreen';
import NSMTeamVisitsScreen from '../NSM/TeamVisitsScreen';
import NSMSettingsScreen from '../NSM/NSMSettingsScreen';
import NSMNotificationsScreen from '../NSM/NotificationsScreen';

// ── RSM Module Screens ──
import RSMDashboardScreen from '../RSM/RSMDashboardScreen';
import ASMManagementScreen from '../RSM/ASMManagementScreen';
import RSMTargetAllocationScreen from '../RSM/RSMTargetAllocationScreen';
import RSMRegionalPerformanceScreen from '../RSM/RSMRegionalPerformanceScreen';
import RSMTeamPerformanceScreen from '../RSM/RSMTeamPerformanceScreen';
import RSMTeamVisitsScreen from '../RSM/RSMTeamVisitsScreen';
import RSMDistributorManagementScreen from '../RSM/RSMDistributorManagementScreen';
import RSMAttendanceScreen from '../RSM/RSMAttendanceScreen';
import RSMSettingsScreen from '../RSM/RSMSettingsScreen';
import RSMNotificationsScreen from '../RSM/RSMNotificationsScreen';

// ── ASM Module Screens ──
import ASMDashboardScreen from '../ASM/ASMDashboardScreen';
import ASMMRManagementScreen from '../ASM/ASMMRManagementScreen';
import ASMTargetAllocationScreen from '../ASM/ASMTargetAllocationScreen';
import ASMTargetAchievementScreen from '../ASM/ASMTargetAchievementScreen';
import ASMDailyActivitiesScreen from '../ASM/ASMDailyActivitiesScreen';
import ASMTourPlanningScreen from '../ASM/ASMTourPlanningScreen';
import ASMAttendanceScreen from '../ASM/ASMAttendanceScreen';
import ASMSettingsScreen from '../ASM/ASMSettingsScreen';

import ASMNotificationsScreen from '../ASM/ASMNotificationsScreen';

// ── CRM Leads Module Screens ──
import LeadsScreen from '../screens/CRM/LeadsScreen';
import MyLeadsScreen from '../screens/CRM/MyLeadsScreen';
import LeadCreationScreen from '../screens/CRM/LeadCreationScreen';
import LeadDetailsScreen from '../screens/CRM/LeadDetailsScreen';
import LeadAssignmentScreen from '../screens/CRM/LeadAssignmentScreen';
import LeadPipelineTrackingScreen from '../screens/CRM/LeadPipelineTrackingScreen';
import LeadConversionTrackingScreen from '../screens/CRM/LeadConversionTrackingScreen';
import LeadListScreen from '../screens/CRM/LeadListScreen';

import ActivityTrackingScreen from '../screens/ActivityTrackingScreen/ActivityTrackingScreen';
import AttendanceScreen from '../screens/AttendanceScreen/AttendanceScreen';
import BookOrderScreen from '../screens/BookOrderScreen/BookOrderScreen';

import ActivityNotificationsScreen from '@/screens/ActivityNotificationsScreen/ActivityNotificationsScreen';
import MeetingRemindersScreen from '@/screens/MeetingRemindersScreen/MeetingRemindersScreen';
import CheckInScreen from '../screens/CheckInScreen/CheckInScreen';
import CheckOutScreen from '../screens/CheckOutScreen/CheckOutScreen';
import ChemistVisitScreen from '../screens/ChemistVisitScreen/ChemistVisitScreen';
import CustomerDirectoryScreen from '../screens/CustomerDirectoryScreen/CustomerDirectoryScreen';
import DailyMovementTrackingScreen from '../screens/DailyMovementTrackingScreen/DailyMovementTrackingScreen';
import DailyReportScreen from '../screens/DailyReportScreen/DailyReportScreen';
import DailyScheduleScreen from '../screens/DailyScheduleScreen/DailyScheduleScreen';
import DashboardScreen from '../screens/DashboardScreen/DashboardScreen';
import DoctorVisitScreen from '../screens/DoctorVisitScreen/DoctorVisitScreen';
import ExpenseClaimScreen from '../screens/ExpenseClaimScreen/ExpenseClaimScreen';
import ExpiryAlertsScreen from '../screens/ExpiryAlertsScreen/ExpiryAlertsScreen';
import FollowUpRemindersScreen from '../screens/FollowUpRemindersScreen/FollowUpRemindersScreen';
import FollowUpsScreen from '../screens/FollowUpsScreen/FollowUpsScreen';
import GeoTaggedChemistVisitsScreen from '../screens/GeoTaggedChemistVisitsScreen/GeoTaggedChemistVisitsScreen';
import GeoTaggedDoctorVisitsScreen from '../screens/GeoTaggedDoctorVisitsScreen/GeoTaggedDoctorVisitsScreen';
import LeaveRequestScreen from '../screens/LeaveRequestScreen/LeaveRequestScreen';
import MeetingLocationScreen from '../screens/MeetingLocationScreen/MeetingLocationScreen';
import { default as MeetingSchedulerScreen, default as MeetingSchedulingScreen } from '../screens/MeetingSchedulingScreen/MeetingSchedulingScreen';
import NotificationsScreen from '../screens/NotificationsScreen/NotificationsScreen';
import ProductCatalogScreen from '../screens/ProductCatalogScreen/ProductCatalogScreen';
import ProfileScreen from '../screens/ProfileScreen/ProfileScreen';
import RouteHistoryScreen from '../screens/RouteHistoryScreen/RouteHistoryScreen';
import TargetTrackingScreen from '../screens/TargetTrackingScreen/TargetTrackingScreen';
import TerritoryMapScreen from '../screens/TerritoryMapScreen/TerritoryMapScreen';
import TerritoryTrackingScreen from '../screens/TerritoryTrackingScreen/TerritoryTrackingScreen';
import TourPlanningScreen from '../screens/TourPlanningScreen/TourPlanningScreen';



const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          headerBackVisible: false,
          headerLeft: () => null,
        }}
      />

      {/* ── ASM Module Routes ── */}
      <Stack.Screen name="ASMDashboard" component={ASMDashboardScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ASMMRManagement" component={ASMMRManagementScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ASMTargetAllocation" component={ASMTargetAllocationScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ASMTargetAchievement" component={ASMTargetAchievementScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ASMDailyActivities" component={ASMDailyActivitiesScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ASMTourPlanning" component={ASMTourPlanningScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ASMAttendance" component={ASMAttendanceScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ASMSettings" component={ASMSettingsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ASMNotifications" component={ASMNotificationsScreen} options={{ headerShown: false }} />
      
      {/* ── RSM Module Routes ── */}
        <Stack.Screen
          name="RSMDashboard"
          component={RSMDashboardScreen}
          options={{ title: 'RSM Executive Dashboard', headerBackVisible: false, headerLeft: () => null }}
        />
      <Stack.Screen name="ASMManagement" component={ASMManagementScreen} options={{ headerShown: false }} />
      <Stack.Screen name="RSMTargetAllocation" component={RSMTargetAllocationScreen} options={{ headerShown: false }} />
      <Stack.Screen name="RSMRegionalPerformance" component={RSMRegionalPerformanceScreen} options={{ headerShown: false }} />
      <Stack.Screen name="RSMTeamPerformance" component={RSMTeamPerformanceScreen} options={{ headerShown: false }} />
      <Stack.Screen name="RSMTeamVisits" component={RSMTeamVisitsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="RSMDistributorManagement" component={RSMDistributorManagementScreen} options={{ headerShown: false }} />
      <Stack.Screen name="RSMAttendance" component={RSMAttendanceScreen} options={{ headerShown: false }} />
      <Stack.Screen name="RSMSettings" component={RSMSettingsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="RSMNotifications" component={RSMNotificationsScreen} options={{ headerShown: false }} />

      <Stack.Screen
        name="Attendance"
        component={AttendanceScreen}
      />

      <Stack.Screen
        name="DoctorVisit"
        component={DoctorVisitScreen}
      />

      <Stack.Screen
  name="MeetingScheduling"
  component={MeetingSchedulingScreen}
/>

      <Stack.Screen
        name="ChemistVisit"
        component={ChemistVisitScreen}
      />

      <Stack.Screen
        name="BookOrder"
        component={BookOrderScreen}
      />

      <Stack.Screen
        name="DailyReport"
        component={DailyReportScreen}
      />

      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
      />
      <Stack.Screen
        name="TourPlanning"
        component={TourPlanningScreen}
      />
      <Stack.Screen
        name="FollowUps"
        component={FollowUpsScreen}
      />
      <Stack.Screen
        name="ProductCatalog"
        component={ProductCatalogScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="LeaveRequest"
        component={LeaveRequestScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ headerShown: false }}
      /> 
      <Stack.Screen
        name="MeetingScheduler"
        component={MeetingSchedulerScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="TargetTracking"
        component={TargetTrackingScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="RouteHistory"
        component={RouteHistoryScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="DailyMovementTracking"
        component={DailyMovementTrackingScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CustomerDirectory"
        component={CustomerDirectoryScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ExpenseClaim"
        component={ExpenseClaimScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="DailySchedule"
        component={DailyScheduleScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="TerritoryTracking"
        component={TerritoryTrackingScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="TerritoryMap"
        component={TerritoryMapScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="MeetingLocation"
        component={MeetingLocationScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ActivityTracking"
        component={ActivityTrackingScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CheckIn"
        component={CheckInScreen}
        options={{ headerShown: true, title: 'Day Start / Check-In' }}
      />
      <Stack.Screen
        name="CheckOut"
        component={CheckOutScreen}
        options={{ headerShown: true, title: 'Day End / Check-Out' }}
      />
      <Stack.Screen
        name="GeoTaggedDoctorVisits"
        component={GeoTaggedDoctorVisitsScreen}
        options={{ headerShown: true, title: 'Geo Tagged Doctor Visits' }}
      />
      <Stack.Screen
        name="GeoTaggedChemistVisits"
        component={GeoTaggedChemistVisitsScreen}
        options={{ headerShown: true, title: 'Geo Tagged Chemist Visits' }}
      />
      <Stack.Screen
        name="FollowUpReminders"
        component={FollowUpRemindersScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ExpiryAlerts"
        component={ExpiryAlertsScreen}
        options={{ headerShown: false }}
      />
     <Stack.Screen
        name="MeetingReminders"
        component={MeetingRemindersScreen}
        //options={{ headerShown: false }}
      />
      <Stack.Screen 
      name="ActivityNotifications"
     component={ActivityNotificationsScreen} />


     {/* <Stack.Screen
  //name="Attendance"
  component={AttendanceScreen}
  options={({ navigation }) => ({
    headerLeft: () => (
      <TouchableOpacity 
        onPress={async () => {
          const checkedIn = await AsyncStorage.getItem('@checked_in');
          const checkInDate = await AsyncStorage.getItem('@check_in_date');
          const todayStr = new Date().toISOString().slice(0, 10);
          
          // If Duty Completed for today, go straight to Dashboard to avoid Check-in popup!
          if (checkedIn === 'false' && checkInDate === todayStr) {
            navigation.navigate('Dashboard');
          } else {
            navigation.goBack();
          }
        }}
        style={{ paddingRight: 15, paddingVertical: 5 }}
      >
        <Text style={{ fontSize: 20, color: '#000' }}>←</Text>
      </TouchableOpacity>
    ),
  })} 
/>*/}

      {/* ── NSM Screens ── */}
      <Stack.Screen name="NSMDashboard" component={NSMDashboardScreen} options={{ title: 'NSM Executive Dashboard', headerBackVisible: false, headerLeft: () => null }} />
      <Stack.Screen name="NSMSalesOperations" component={NSMSalesOperationsScreen} options={{ title: 'Sales Operations' }} />
      <Stack.Screen name="NSMTargetPlanning" component={NSMTargetPlanningScreen} options={{ title: 'Target Planning' }} />
      <Stack.Screen name="NSMStatePerformance" component={NSMStatePerformanceScreen} options={{ title: 'State Performance' }} />
      <Stack.Screen name="NSMRSMMonitoring" component={NSMRSMMonitoringScreen} options={{ title: 'RSM Management' }} />
      <Stack.Screen name="NSMTeamPerformance" component={NSMTeamPerformanceScreen} options={{ title: 'Team Performance' }} />
      <Stack.Screen name="NSMTeamVisits" component={NSMTeamVisitsScreen} options={{ title: 'Team Visits' }} />
      <Stack.Screen name="NSMAttendanceMonitoring" component={NSMAttendanceMonitoringScreen} options={{ title: 'Attendance' }} />
      <Stack.Screen name="NSMSettings" component={NSMSettingsScreen} options={{ title: 'Settings & Profile' }} />
      <Stack.Screen name="NSMNotifications" component={NSMNotificationsScreen} options={{ title: 'Notifications Inbox' }} />

      {/* ── CRM Leads Module Routes ── */}
      <Stack.Screen name="Leads" component={LeadsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="MyLeads" component={MyLeadsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="LeadCreation" component={LeadCreationScreen} options={{ headerShown: false }} />
      <Stack.Screen name="LeadDetails" component={LeadDetailsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="LeadAssignment" component={LeadAssignmentScreen} options={{ headerShown: false }} />
      <Stack.Screen name="LeadPipelineTracking" component={LeadPipelineTrackingScreen} options={{ headerShown: false }} />
      <Stack.Screen name="LeadConversionTracking" component={LeadConversionTrackingScreen} options={{ headerShown: false }} />
      <Stack.Screen name="LeadList" component={LeadListScreen} options={{ headerShown: false }} />
    </Stack.Navigator>

    
  );
  
};

export default AppNavigator;
