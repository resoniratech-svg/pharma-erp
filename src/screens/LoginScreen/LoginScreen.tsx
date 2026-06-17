// import React from 'react';
// import { View, Text, StyleSheet } from 'react-native';

// const LoginScreen = () => {
//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>Login Screen</Text>
//     </View>
//   );
// };

// export default LoginScreen;

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   title: {
//     fontSize: 24,
//     fontWeight: 'bold',
//   },
// });
//import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
   Image,
  Platform,
   
} from 'react-native';

const LoginScreen = () => {
     const navigation = useNavigation<any>();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // const handleLogin = () => {
  //   console.log('Login Clicked');
  // };
 
const handleLogin = async () => {
  let correctPassword = 'admin123';
  try {
    const storedPassword = await AsyncStorage.getItem('@user_password');
    if (storedPassword) {
      correctPassword = storedPassword;
    }
  } catch (e) {
    console.log('Failed to read stored password from AsyncStorage', e);
  }

  if (username === 'admin' && password === correctPassword) {
    try {
      await AsyncStorage.setItem('@user_name', 'Priya Reddy');
      await AsyncStorage.setItem('@designation', 'Medical Representative');
      await AsyncStorage.setItem('@employee_id', 'EMP-001');
    } catch (e) {
      console.log('Failed to save profile on login', e);
    }
    navigation.replace('App');
  } else {
    alert('Invalid Username or Password');
  }
};

  return (
    <View style={styles.container}>
      {/* <Text style={styles.logo}>Pharma ERP</Text> */}
<Image 
  source={require('../../../assets/images/logo.png')} 
  style={styles.logoImage} 
  resizeMode="contain"
/>
      <Text style={styles.subtitle}>Medical Representative Portal</Text>

      <TextInput
        placeholder="Username"
        style={styles.input}
        value={username}
        onChangeText={setUsername}
      />
{/* 
      <TextInput
        placeholder="Password"
        style={styles.input}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      /> */}
      <View style={styles.passwordContainer}>
  <TextInput
    placeholder="Password"
    style={styles.passwordInput}
    secureTextEntry={!showPassword}
    value={password}
    onChangeText={setPassword}
  />

  <TouchableOpacity
    onPress={() => setShowPassword(!showPassword)}
  >
    <Ionicons
      name={showPassword ? 'eye-off' : 'eye'}
      size={24}
      color="gray"
    />
  </TouchableOpacity>
</View>

      <TouchableOpacity
        style={styles.loginButton}
        onPress={handleLogin}
      >
        <Text style={styles.loginText}>Login</Text>
      </TouchableOpacity>

      <Text style={styles.forgotPassword}>
        Forgot Password?
      </Text>
    </View>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    justifyContent: 'center',
    paddingHorizontal: 25,
  },

  // logo: {
  //   fontSize: 32,
  //   fontWeight: 'bold',
  //   color: '#1E88E5',
  //   textAlign: 'center',
  //   marginBottom: 10,
  // }
  // logoImage: {
  // width: 250,          // Fits the logo width
  // height: 100,         // Fits the logo height
  // alignSelf: 'center', // Centers the logo horizontally
  // marginBottom: 20,    // Space below the logo
logoImage: {
  width: 320,
  height: 140,
  alignSelf: 'center',
  marginBottom: 25,
},





  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
  },

  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 15,
    height: 50,
    marginBottom: 15,
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      } as any,
    }),
  },

  loginButton: {
    backgroundColor: '#1E88E5',
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },

  loginText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },

  forgotPassword: {
    textAlign: 'center',
    marginTop: 20,
    color: '#1E88E5',
  },
  passwordContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: '#fff',
  borderWidth: 1,
  borderColor: '#ddd',
  borderRadius: 10,
  paddingHorizontal: 15,
  marginBottom: 15,
   height: 50,
},

passwordInput: {
  flex: 1,
  height: 50,
   borderWidth: 0,
   ...Platform.select({
     web: {
       outlineStyle: 'none',
     } as any,
   }),
},
});