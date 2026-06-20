// import React from 'react';
// import { createNativeStackNavigator } from '@react-navigation/native-stack';

// import DashboardScreen from '../screens/DashboardScreen/DashboardScreen';
// import AttendanceScreen from '../screens/AttendanceScreen/AttendanceScreen';
// import DoctorVisitScreen from '../screens/DoctorVisitScreen/DoctorVisitScreen';
// import ChemistVisitScreen from '../screens/ChemistVisitScreen/ChemistVisitScreen';
// import ProfileScreen from '../screens/ProfileScreen/ProfileScreen';
// import BookOrderScreen from '../screens/BookOrderScreen/BookOrderScreen';
// import DailyReportScreen from '../screens/DailyReportScreen/DailyReportScreen';
// import TourPlanningScreen from '../screens/TourPlanningScreen/TourPlanningScreen';
// import FollowUpsScreen from '../screens/FollowUpsScreen/FollowUpsScreen';
// import ProductCatalogScreen from '../screens/ProductCatalogScreen/ProductCatalogScreen';
// import LeaveRequestScreen from '../screens/LeaveRequestScreen/LeaveRequestScreen';
// import NotificationsScreen from '../screens/NotificationsScreen/NotificationsScreen';
// import MeetingSchedulerScreen from '../screens/MeetingSchedulingScreen/MeetingSchedulingScreen';
// import TargetTrackingScreen from '../screens/TargetTrackingScreen/TargetTrackingScreen';
// import RouteHistoryScreen from '../screens/RouteHistoryScreen/RouteHistoryScreen';
// import DailyMovementTrackingScreen from '../screens/DailyMovementTrackingScreen/DailyMovementTrackingScreen';
// import CustomerDirectoryScreen from '../screens/CustomerDirectoryScreen/CustomerDirectoryScreen';

// import ExpenseClaimScreen from '../screens/ExpenseClaimScreen/ExpenseClaimScreen';
// const Stack = createNativeStackNavigator();

// const AppNavigator = () => {
//   return (
//     <Stack.Navigator>
//       <Stack.Screen
//         name="Dashboard"
//         component={DashboardScreen}
//       />

//       <Stack.Screen
//         name="Attendance"
//         component={AttendanceScreen}
//       />

//       <Stack.Screen
//         name="DoctorVisit"
//         component={DoctorVisitScreen}
//       />

//       <Stack.Screen
//         name="ChemistVisit"
//         component={ChemistVisitScreen}
//       />

//       <Stack.Screen
//         name="BookOrder"
//         component={BookOrderScreen}
//       />

//       <Stack.Screen
//         name="DailyReport"
//         component={DailyReportScreen}
//       />

//       <Stack.Screen
//         name="Profile"
//         component={ProfileScreen}
//       />
//       <Stack.Screen
//   name="TourPlanning"
//   component={TourPlanningScreen}
// />
// <Stack.Screen
// name="FollowUps"
// component={FollowUpsScreen}/>
// <Stack.Screen
//   name="ProductCatalog"
//   component={ProductCatalogScreen}
//   options={{ headerShown: false }} // Keep it consistent with dashboard
// />
// <Stack.Screen
//   name="LeaveRequest"
//   component={LeaveRequestScreen}
//   options={{ headerShown: false }}
// />
//  <Stack.Screen
//   name="Notifications"
//   component={NotificationsScreen}
//   options={{ headerShown: false }}
// /> 
// <Stack.Screen
//   name="MeetingScheduler"
//   component={MeetingSchedulerScreen}
//   options={{ headerShown: false }}
// />
// <Stack.Screen
//   name="TargetTracking"
//   component={TargetTrackingScreen}
//   options={{ headerShown: false }}
// />
// <Stack.Screen
//   name="RouteHistory"
//   component={RouteHistoryScreen}
//   options={{ headerShown: false }}
// />
// <Stack.Screen
//   name="RouteHistory"
//   component={RouteHistoryScreen}
//   options={{ headerShown: false }}
// />
// <Stack.Screen
//   name="DailyMovementTracking"
//   component={DailyMovementTrackingScreen}
//   options={{ headerShown: false }}
// />
// <Stack.Screen
//   name="TargetTracking"
//   component={TargetTrackingScreen}
//   options={{ headerShown: false }}
// />
// <Stack.Screen
//   name="CustomerDirectory"
//   component={CustomerDirectoryScreen}
//   options={{ headerShown: false }}
// />
// <Stack.Screen
//   name="ExpenseClaim"
//   component={ExpenseClaimScreen}
//   options={{ headerShown: false }}
// />
//     </Stack.Navigator>
//   );
// };

// export default AppNavigator;
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import ActivityTrackingScreen from '../screens/ActivityTrackingScreen/ActivityTrackingScreen';
import AttendanceScreen from '../screens/AttendanceScreen/AttendanceScreen';
import BookOrderScreen from '../screens/BookOrderScreen/BookOrderScreen';
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
import FollowUpsScreen from '../screens/FollowUpsScreen/FollowUpsScreen';
import GeoTaggedChemistVisitsScreen from '../screens/GeoTaggedChemistVisitsScreen/GeoTaggedChemistVisitsScreen';
import GeoTaggedDoctorVisitsScreen from '../screens/GeoTaggedDoctorVisitsScreen/GeoTaggedDoctorVisitsScreen';
import LeaveRequestScreen from '../screens/LeaveRequestScreen/LeaveRequestScreen';
import MeetingLocationScreen from '../screens/MeetingLocationScreen/MeetingLocationScreen';
import MeetingSchedulerScreen from '../screens/MeetingSchedulingScreen/MeetingSchedulingScreen';
import NotificationsScreen from '../screens/NotificationsScreen/NotificationsScreen';
import ProductCatalogScreen from '../screens/ProductCatalogScreen/ProductCatalogScreen';
import ProfileScreen from '../screens/ProfileScreen/ProfileScreen';
import RouteHistoryScreen from '../screens/RouteHistoryScreen/RouteHistoryScreen';
import TargetTrackingScreen from '../screens/TargetTrackingScreen/TargetTrackingScreen';
import TerritoryTrackingScreen from '../screens/TerritoryTrackingScreen/TerritoryTrackingScreen';
import TourPlanningScreen from '../screens/TourPlanningScreen/TourPlanningScreen';
import ExpiryAlertsScreen from '../screens/ExpiryAlertsScreen/ExpiryAlertsScreen';
import FollowUpRemindersScreen from '../screens/FollowUpRemindersScreen/FollowUpRemindersScreen';
import MeetingRemindersScreen from '@/screens/MeetingRemindersScreen/MeetingRemindersScreen';
import ActivityNotificationsScreen from '@/screens/ActivityNotificationsScreen/ActivityNotificationsScreen';


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
    </Stack.Navigator>
  );
};

export default AppNavigator;
