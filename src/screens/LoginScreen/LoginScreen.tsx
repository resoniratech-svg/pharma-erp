import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { loginUser } from '../../services/authService';

const LoginScreen = () => {
  const navigation = useNavigation<any>();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      alert('Please enter both Email and Password.');
      return;
    }
      // ✅ Put the Local Demo Check HERE (BEFORE API call)
    const userLower = username.trim().toLowerCase();
    // 🏛️ Local Demo Login for NSM (National Sales Head)
    if (userLower === 'nsm001' || userLower === 'nsm@pharmaerp.com') {
      await AsyncStorage.setItem('@user_name', 'Ravi Kumar');
      await AsyncStorage.setItem('@employee_id', 'NSM001');
      await AsyncStorage.setItem('@designation', 'National Sales Head');
      navigation.replace('App', { screen: 'NSMDashboard' });
      return;
    }
    // 🗺️ Local Demo Login for RSM (Regional Sales Manager)
    if (userLower === 'rsm001' || userLower === 'rsm@pharmaerp.com') {
      await AsyncStorage.setItem('@user_name', 'Rajesh Kumar');
      await AsyncStorage.setItem('@employee_id', 'RSM001');
      await AsyncStorage.setItem('@designation', 'Regional Sales Manager');
      navigation.replace('App', { screen: 'RSMDashboard' });
      return;
    }
    // 🚗 Local Demo Login for ASM (Area Sales Manager)
    if (userLower === 'asm001' || userLower === 'asm@pharmaerp.com') {
      await AsyncStorage.setItem('@user_name', 'Suresh');
      await AsyncStorage.setItem('@employee_id', 'ASM001');
      await AsyncStorage.setItem('@designation', 'Area Sales Manager');
      navigation.replace('App', { screen: 'ASMDashboard' });
      return;
    }
    // ── Live Backend API Call for MRs ──
   
    
    setIsSubmitting(true);
    try {
      const response = await loginUser(
        username,
        password
      );

      console.log('Login Response:', response);

      await AsyncStorage.setItem(
        '@token',
        response.data.token
      );

      if (response.data.mr) {
        await AsyncStorage.setItem(
          '@mrId',
          response.data.mr.id.toString()
        );
      }

      await AsyncStorage.setItem(
        '@user',
        JSON.stringify(response.data.user)
      );

      // ✅ Sync actual profile metadata to prevent stale John Doe defaults
      await AsyncStorage.setItem(
        '@user_name',
        response.data.mr?.name || response.data.user?.fullName || response.data.user?.name || ''
      );

      await AsyncStorage.setItem(
        '@designation',
        response.data.user?.role || 'Medical Representative'
      );

      setIsSubmitting(false);
      navigation.replace('App');

    } catch (error: any) {
      setIsSubmitting(false);
      console.log(error);
      alert(
        error?.response?.data?.message ||
        'Login failed'
      );
    }
    
    
  };

  return (
    <View style={styles.container}>
      {/* Background ambient decor elements */}
      <View style={styles.bubble1} />
      <View style={styles.bubble2} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            {/* Elegant logo container (acts as badge to look premium) */}
            <View style={styles.logoBadgeContainer}>
              <Image 
                source={require('../../../assets/images/logo.png')} 
                style={styles.logoImage} 
                resizeMode="cover"
              />
            </View>

            <Text style={styles.welcomeText}>MJ Happy Healthcare</Text>
            <Text style={styles.subtitle}>Medical Representative Portal</Text>

            {/* Email input field */}
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
              <TextInput
                placeholder="Email Address"
                placeholderTextColor="#94A3B8"
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Password input field */}
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
              <TextInput
                placeholder="Password"
                placeholderTextColor="#94A3B8"
                style={styles.passwordInput}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIconContainer}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#94A3B8"
                />
              </TouchableOpacity>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.loginButton, isSubmitting && { opacity: 0.8 }]}
              onPress={handleLogin}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.loginText}>Sign In</Text>
              )}
            </TouchableOpacity>

            {/* Forgot Password */}
            <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')} style={styles.forgotContainer}>
              <Text style={styles.forgotPassword}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  bubble1: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#E0F2FE',
    opacity: 0.6,
  },
  bubble2: {
    position: 'absolute',
    bottom: -70,
    left: -70,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#EEF2FF',
    opacity: 0.6,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 28,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  logoBadgeContainer: {
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    width: 204,
    height: 78,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  logoImage: {
    width: 215,
    height: 85,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 30,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 54,
    marginBottom: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 54,
    color: '#0F172A',
    fontSize: 14,
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      } as any,
    }),
  },
  passwordInput: {
    flex: 1,
    height: 54,
    color: '#0F172A',
    fontSize: 14,
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      } as any,
    }),
  },
  eyeIconContainer: {
    padding: 4,
  },
  loginButton: {
    backgroundColor: '#1E88E5',
    height: 54,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#1E88E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  loginText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  forgotContainer: {
    marginTop: 20,
    alignSelf: 'center',
  },
  forgotPassword: {
    color: '#1E88E5',
    fontSize: 14,
    fontWeight: '500',
  },
});