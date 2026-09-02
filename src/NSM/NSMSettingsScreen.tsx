import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { getMe } from '../services/authService';

const NSMSettingsScreen = () => {
  const navigation = useNavigation<any>();
  const [activeTab, setActiveTab] = useState<'Profile' | 'Password'>('Profile');

  
  const [employeeId, setEmployeeId] = useState('');
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [designation, setDesignation] = useState('');
  const [region, setRegion] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await getMe();
        if (res?.data) {
          setName(res.data.name || '');
          setEmail(res.data.email || '');
          if (res.data.employee) {
            setEmployeeId(res.data.employee.employeeCode || '');
            setMobile(res.data.employee.contactNumber || '');
            setDesignation(res.data.employee.designation || '');
            setRegion(res.data.employee.states?.join(', ') || res.data.employee.headquarters || '');
          }
        }
      } catch (e) {
        console.log('Failed to fetch profile', e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  // Change Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSaveProfile = () => {
    Alert.alert('✅ Profile Updated', 'NSM Profile information updated.');
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Input Required', 'Please fill in all password fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Password Mismatch', 'New Password and Confirm Password do not match.');
      return;
    }
    
    try {
      const token = await AsyncStorage.getItem('@token');
      const response = await api.put('/auth/change-password', {
        currentPassword,
        newPassword
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data && response.data.success) {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        Alert.alert('Success', 'Your security password has been updated.');
      } else {
        Alert.alert('Error', response.data.message || 'Failed to update password');
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to connect to the server.';
      Alert.alert('Error', msg);
    }
  };

  const handleLogoutConfirm = () => {
    if (Platform.OS === 'web') {
      const confirmLogout = window.confirm('Are you sure you want to log out of the NSM Portal?');
      if (confirmLogout) {
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
      }
    } else {
      Alert.alert(
        '🚪 Logout Confirmation',
        'Are you sure you want to log out of the NSM Portal?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Logout', style: 'destructive', onPress: () => navigation.reset({ index: 0, routes: [{ name: 'Login' }] }) },
        ]
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>⚙️ Settings</Text>
          <Text style={styles.subtitle}>Account profile & security settings.</Text>
        </View>

        {/* 2 Settings Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity style={[styles.tab, activeTab === 'Profile' && styles.activeTab]} onPress={() => setActiveTab('Profile')}>
            <Text style={[styles.tabText, activeTab === 'Profile' && styles.activeTabText]}>👤 Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.tab, activeTab === 'Password' && styles.activeTab]} onPress={() => setActiveTab('Password')}>
            <Text style={[styles.tabText, activeTab === 'Password' && styles.activeTabText]}>🔒 Password</Text>
          </TouchableOpacity>
        </View>

        {/* ── TAB 1: PROFILE ── */}
        {activeTab === 'Profile' && (
          <View style={styles.card}>
            {/* Profile Avatar Upload */}
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              <View style={{ position: 'relative' }}>
                <Ionicons name="person-circle" size={72} color="#4F46E5" />
                <TouchableOpacity style={styles.avatarEditBtn} onPress={() => Alert.alert('📷 Change Photo', 'Choose profile photo from gallery or camera.')}>
                  <Ionicons name="camera" size={14} color="#FFF" />
                </TouchableOpacity>
              </View>
              <Text style={styles.avatarName}>{name}</Text>
              <Text style={styles.avatarRole}>{designation}</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Employee ID</Text>
              <TextInput style={[styles.input, { backgroundColor: '#F1F5F9' }]} value={employeeId} editable={false} />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput style={styles.input} value={name} onChangeText={setName} />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mobile Number</Text>
              <TextInput style={styles.input} value={mobile} onChangeText={setMobile} keyboardType="phone-pad" />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Assigned Region</Text>
              <TextInput style={[styles.input, { backgroundColor: '#F1F5F9' }]} value={region} editable={false} />
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProfile}>
              <Text style={styles.saveBtnText}>Save Profile</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── TAB 2: CHANGE PASSWORD ── */}
        {activeTab === 'Password' && (
          <View style={styles.card}>
            <Text style={styles.cardSectionTitle}>Change Security Password</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Current Password *</Text>
              <TextInput style={styles.input} secureTextEntry placeholder="Enter current password" value={currentPassword} onChangeText={setCurrentPassword} />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>New Password *</Text>
              <TextInput style={styles.input} secureTextEntry placeholder="Enter new password" value={newPassword} onChangeText={setNewPassword} />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm Password *</Text>
              <TextInput style={styles.input} secureTextEntry placeholder="Re-enter new password" value={confirmPassword} onChangeText={setConfirmPassword} />
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleChangePassword}>
              <Text style={styles.saveBtnText}>Update Password</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutCard} onPress={handleLogoutConfirm}>
          <Ionicons name="log-out-outline" size={22} color="#DC2626" />
          <Text style={styles.logoutText}>🚪 Logout of NSM Portal</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default NSMSettingsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { padding: 16 },
  header: { marginBottom: 14 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#0F172A' },
  subtitle: { fontSize: 12, color: '#64748B', marginTop: 2 },

  tabContainer: { flexDirection: 'row', backgroundColor: '#E2E8F0', borderRadius: 10, padding: 3, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  activeTab: { backgroundColor: '#FFF', elevation: 1 },
  tabText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  activeTabText: { color: '#4F46E5', fontWeight: 'bold' },

  card: { backgroundColor: '#FFF', padding: 16, borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 14 },
  cardSectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#0F172A', marginBottom: 14 },

  avatarEditBtn: { position: 'absolute', bottom: 4, right: 4, backgroundColor: '#4F46E5', width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  avatarName: { fontSize: 16, fontWeight: 'bold', color: '#0F172A', marginTop: 4 },
  avatarRole: { fontSize: 11, color: '#64748B' },

  inputGroup: { marginBottom: 12 },
  label: { fontSize: 11, fontWeight: 'bold', color: '#64748B', marginBottom: 4 },
  input: { borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 13, backgroundColor: '#F8FAFC', color: '#0F172A' },
  saveBtn: { backgroundColor: '#4F46E5', paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginTop: 14 },
  saveBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },

  logoutCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#FEE2E2', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#FCA5A5' },
  logoutText: { color: '#DC2626', fontWeight: 'bold', fontSize: 13 },
});
