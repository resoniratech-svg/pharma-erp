//  import React from 'react';
//  import { createNativeStackNavigator } from '@react-navigation/native-stack';

//  import LoginScreen from '../screens/LoginScreen/LoginScreen';
// import SplashScreen from '../screens/SplashScreen/SplashScreen';
// import DashboardScreen from '../screens/DashboardScreen/DashboardScreen';
// //import App from '../../App';
//  import AppNavigator from './AppNavigator';



//  const Stack = createNativeStackNavigator();

//  const AuthNavigator = () => {
//    return (
//      <Stack.Navigator screenOptions={{ headerShown: false }}>
//        <Stack.Screen name="Splash" component={SplashScreen} />
//        <Stack.Screen name="Login" component={LoginScreen} />
//         <Stack.Screen name="App" component={AppNavigator} />

//         <Stack.Screen name="Dashboard" component={DashboardScreen} />

//      </Stack.Navigator>
//    );
//   };
//  <Stack.Navigator screenOptions={{ headerShown: false }}>
//    <Stack.Screen

//       name="Splash"
//          component={SplashScreen}
//    />
//     <Stack.Screen
//          name="Login"
//        component={LoginScreen}
//        />
//        <Stack.Screen name="App" component={AppNavigator} />


//    <Stack.Screen
//      name="Dashboard"
//      component={DashboardScreen}
//    /> 
//     <Stack.Screen
//         name="App"
//         component={AppNavigator}
//       />
//  </Stack.Navigator>
  

 
//   export default AuthNavigator;
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import LoginScreen from '../screens/LoginScreen/LoginScreen';
import SplashScreen from '../screens/SplashScreen/SplashScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen/ForgotPasswordScreen';
import AppNavigator from './AppNavigator';

const Stack = createNativeStackNavigator();

const AuthNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="App" component={AppNavigator} />
    </Stack.Navigator>
  );
};

export default AuthNavigator;