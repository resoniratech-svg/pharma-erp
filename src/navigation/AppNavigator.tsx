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
      <Stack.Screen name="NSMDashboard" component={NSMDashboardScreen} options={{ title: 'NSM Executive Dashboard' }} />
      <Stack.Screen name="NSMSalesOperations" component={NSMSalesOperationsScreen} options={{ title: 'Sales Operations' }} />
      <Stack.Screen name="NSMTargetPlanning" component={NSMTargetPlanningScreen} options={{ title: 'Target Planning' }} />
      <Stack.Screen name="NSMStatePerformance" component={NSMStatePerformanceScreen} options={{ title: 'State Performance' }} />
      <Stack.Screen name="NSMRSMMonitoring" component={NSMRSMMonitoringScreen} options={{ title: 'RSM Management' }} />
      <Stack.Screen name="NSMTeamPerformance" component={NSMTeamPerformanceScreen} options={{ title: 'Team Performance' }} />
      <Stack.Screen name="NSMTeamVisits" component={NSMTeamVisitsScreen} options={{ title: 'Team Visits' }} />
      <Stack.Screen name="NSMAttendanceMonitoring" component={NSMAttendanceMonitoringScreen} options={{ title: 'Attendance' }} />
      <Stack.Screen name="NSMSettings" component={NSMSettingsScreen} options={{ title: 'Settings & Profile' }} />
      <Stack.Screen name="NSMNotifications" component={NSMNotificationsScreen} options={{ title: 'Notifications Inbox' }} />
    </Stack.Navigator>

    
  );
  
};

export default AppNavigator;
