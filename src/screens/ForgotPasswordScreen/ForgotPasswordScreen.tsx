import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const ForgotPasswordScreen = () => {
  const navigation = useNavigation<any>();
  const [step, setStep] = useState(1);
  const [emailOrMobile, setEmailOrMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Web safe alert
  const customAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const handleSendOTP = () => {
    if (!emailOrMobile.trim()) {
      customAlert('Error', 'Please enter your Email or Mobile Number');
      return;
    }
    // TODO: Connect to backend API: POST /api/auth/send-otp
    setStep(2);
  };

  const handleVerifyOTP = () => {
    if (!otp.trim() || otp.length !== 6) {
      customAlert('Error', 'Please enter a valid 6-digit OTP');
      return;
    }
    // TODO: Connect to backend API: POST /api/auth/verify-otp
    setStep(3);
  };

  const handleResetPassword = () => {
    if (!newPassword || newPassword.length < 6) {
      customAlert('Error', 'Password must be at least 6 characters long');
      return;
    }
    if (!confirmPassword) {
      customAlert('Error', 'Please confirm your new password');
      return;
    }
    if (newPassword !== confirmPassword) {
      customAlert('Error', 'Passwords do not match');
      return;
    }
    // TODO: Connect to backend API: POST /api/auth/reset-password
    setStep(4);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backButtonText}>⬅️ Back to Login</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Forgot Password</Text>
      <Text style={styles.subtitle}>
        {step === 1 && 'Enter your email or mobile number to receive an OTP.'}
        {step === 2 && 'Enter the OTP sent to your email or mobile.'}
        {step === 3 && 'Create a new password for your account.'}
        {step === 4 && 'Your password has been updated successfully.'}
      </Text>

      {/* Step 1: Request OTP */}
      {step === 1 && (
        <View style={styles.formContainer}>
          <TextInput
            placeholder="Email or Mobile Number"
            style={styles.input}
            value={emailOrMobile}
            onChangeText={setEmailOrMobile}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TouchableOpacity style={styles.primaryButton} onPress={handleSendOTP}>
            <Text style={styles.primaryButtonText}>Send OTP</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Step 2: Verify OTP */}
      {step === 2 && (
        <View style={styles.formContainer}>
          <TextInput
            style={[styles.input, styles.disabledInput]}
            value={emailOrMobile}
            editable={false}
          />
          <TextInput
            placeholder="Enter OTP"
            style={styles.input}
            value={otp}
            onChangeText={setOtp}
            keyboardType="number-pad"
            maxLength={6}
          />
          <TouchableOpacity style={styles.primaryButton} onPress={handleVerifyOTP}>
            <Text style={styles.primaryButtonText}>Verify OTP</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Step 3: Reset Password */}
      {step === 3 && (
        <View style={styles.formContainer}>
          <View style={styles.passwordContainer}>
            <TextInput
              placeholder="New Password"
              style={styles.passwordInput}
              secureTextEntry={!showNewPassword}
              value={newPassword}
              onChangeText={setNewPassword}
            />
            <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
              <Ionicons name={showNewPassword ? 'eye-off' : 'eye'} size={24} color="gray" />
            </TouchableOpacity>
          </View>

          <View style={styles.passwordContainer}>
            <TextInput
              placeholder="Confirm New Password"
              style={styles.passwordInput}
              secureTextEntry={!showConfirmPassword}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
              <Ionicons name={showConfirmPassword ? 'eye-off' : 'eye'} size={24} color="gray" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.primaryButton} onPress={handleResetPassword}>
            <Text style={styles.primaryButtonText}>Reset Password</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Step 4: Success */}
      {step === 4 && (
        <View style={styles.successContainer}>
          <View style={styles.iconCircle}>
            <Text style={styles.checkIcon}>✅</Text>
          </View>
          <Text style={styles.successTitle}>Password Reset Successful</Text>
          <Text style={styles.successSubtitle}>
            You can now use your new password to log in.
          </Text>
          <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.primaryButtonText}>Go to Login</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default ForgotPasswordScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    paddingHorizontal: 25,
    paddingTop: 80,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    padding: 10,
  },
  backButtonText: {
    fontSize: 14,
    color: '#1E88E5',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 10,
    marginTop: 20,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 40,
  },
  formContainer: {
    width: '100%',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 15,
    height: 50,
    marginBottom: 20,
    ...Platform.select({
      web: { outlineStyle: 'none' } as any,
    }),
  },
  disabledInput: {
    backgroundColor: '#F1F5F9',
    color: '#94A3B8',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 20,
    height: 50,
  },
  passwordInput: {
    flex: 1,
    height: 50,
    borderWidth: 0,
    ...Platform.select({
      web: { outlineStyle: 'none' } as any,
    }),
  },
  primaryButton: {
    backgroundColor: '#1E88E5',
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  successContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkIcon: {
    fontSize: 40,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#065F46',
    marginBottom: 10,
  },
  successSubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 30,
  },
});
