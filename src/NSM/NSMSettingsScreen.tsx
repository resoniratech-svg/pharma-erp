import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Switch,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { getNSMSettings, saveNSMSettings } from '../services/nsmStorageService';

const NSMSettingsScreen = () => {
  const navigation = useNavigation<any>();
  const [activeTab, setActiveTab] = useState<'Profile' | 'Password' | 'Notifications' | 'AppInfo'>('Profile');

  // Profile fields
  const [employeeId] = useState('NSM001');
  const [name, setName] = useState('Rajesh Sharma');
  const [mobile, setMobile] = useState('+91 98765 11223');
  const [email, setEmail] = useState('rajesh.sharma@pharmaerp.com');
  const [designation] = useState('National Sales Head');
  const [region] = useState('Pan-India Head Office');

  // Change Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Notification Toggles
  const [targetAlerts, setTargetAlerts] = useState(true);
  const [attendanceAlerts, setAttendanceAlerts] = useState(true);
  const [performanceAlerts, setPerformanceAlerts] = useState(true);
  const [systemNotifs, setSystemNotifs] = useState(true);

  // App Preferences
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const appVersion = 'v2.4.0-prod (Build 108)';

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const data = await getNSMSettings();
    if (data) {
      setTargetAlerts(data.targetAlerts ?? true);
      setAttendanceAlerts(data.attendanceAlerts ?? true);
      setPerformanceAlerts(data.performanceAlerts ?? true);
      setSystemNotifs(data.systemNotifs ?? true);
      setIsDarkMode(data.isDarkMode ?? false);
      setSelectedLanguage(data.selectedLanguage || 'English');
    }
  };

  const handleSaveProfile = () => {
    Alert.alert('✅ Profile Updated', 'NSM Profile information updated.');
  };

  const handleChangePassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('⚠️ Input Required', 'Please fill in all password fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('❌ Password Mismatch', 'New Password and Confirm Password do not match.');
      return;
    }
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    Alert.alert('🔒 Password Changed', 'Your security password has been updated.');
  };

  const handleSaveNotifications = async () => {
    const payload = { targetAlerts, attendanceAlerts, performanceAlerts, systemNotifs, isDarkMode, selectedLanguage };
    await saveNSMSettings(payload);
    Alert.alert('⚙️ Preferences Saved', 'Settings saved to local storage.');
  };

  const handleLogoutConfirm = () => {
    Alert.alert(
      '🚪 Logout Confirmation',
      'Are you sure you want to log out of the NSM Portal?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: () => navigation.replace('Auth') },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>⚙️ Settings & App Preferences</Text>
          <Text style={styles.subtitle}>Account profile, security, app preferences & support links.</Text>
        </View>

        {/* 4 Settings Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity style={[styles.tab, activeTab === 'Profile' && styles.activeTab]} onPress={() => setActiveTab('Profile')}>
            <Text style={[styles.tabText, activeTab === 'Profile' && styles.activeTabText]}>👤 Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.tab, activeTab === 'Password' && styles.activeTab]} onPress={() => setActiveTab('Password')}>
            <Text style={[styles.tabText, activeTab === 'Password' && styles.activeTabText]}>🔒 Password</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.tab, activeTab === 'Notifications' && styles.activeTab]} onPress={() => setActiveTab('Notifications')}>
            <Text style={[styles.tabText, activeTab === 'Notifications' && styles.activeTabText]}>🔔 Notifs</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.tab, activeTab === 'AppInfo' && styles.activeTab]} onPress={() => setActiveTab('AppInfo')}>
            <Text style={[styles.tabText, activeTab === 'AppInfo' && styles.activeTabText]}>📱 App Info</Text>
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

        {/* ── TAB 3: NOTIFICATIONS & PREFERENCES ── */}
        {activeTab === 'Notifications' && (
          <View style={styles.card}>
            <Text style={styles.cardSectionTitle}>System Notification Preferences</Text>

            <View style={styles.settingRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.settingTitle}>Target Alerts</Text>
                <Text style={styles.settingSub}>Alerts for RSM target approvals & monthly milestones</Text>
              </View>
              <Switch value={targetAlerts} onValueChange={setTargetAlerts} trackColor={{ false: '#E2E8F0', true: '#818CF8' }} thumbColor={targetAlerts ? '#4F46E5' : '#F1F5F9'} />
            </View>

            <View style={styles.settingRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.settingTitle}>Attendance Alerts</Text>
                <Text style={styles.settingSub}>Push alerts for team late check-ins and unexcused absences</Text>
              </View>
              <Switch value={attendanceAlerts} onValueChange={setAttendanceAlerts} trackColor={{ false: '#E2E8F0', true: '#818CF8' }} thumbColor={attendanceAlerts ? '#4F46E5' : '#F1F5F9'} />
            </View>

            <View style={styles.settingRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.settingTitle}>Dark Mode Theme</Text>
                <Text style={styles.settingSub}>Enable dark background theme</Text>
              </View>
              <Switch value={isDarkMode} onValueChange={setIsDarkMode} trackColor={{ false: '#E2E8F0', true: '#818CF8' }} thumbColor={isDarkMode ? '#4F46E5' : '#F1F5F9'} />
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveNotifications}>
              <Text style={styles.saveBtnText}>Save Preferences</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── TAB 4: APP INFO & SUPPORT ── */}
        {activeTab === 'AppInfo' && (
          <View style={styles.card}>
            <Text style={styles.cardSectionTitle}>App Information & Policy</Text>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>App Version</Text>
              <Text style={styles.infoVal}>{appVersion}</Text>
            </View>

            <TouchableOpacity style={styles.linkRow} onPress={() => Alert.alert('📜 Privacy Policy', 'Pharma ERP Enterprise Privacy Policy.')}>
              <Ionicons name="shield-checkmark-outline" size={18} color="#4F46E5" />
              <Text style={styles.linkText}>Privacy Policy</Text>
              <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.linkRow} onPress={() => Alert.alert('📋 Terms & Conditions', 'Pharma ERP Terms of Use.')}>
              <Ionicons name="document-text-outline" size={18} color="#4F46E5" />
              <Text style={styles.linkText}>Terms & Conditions</Text>
              <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.linkRow} onPress={() => Alert.alert('💬 Help & Support', 'Support Hotline: 1800-123-4567\nEmail: support@pharmaerp.com')}>
              <Ionicons name="help-buoy-outline" size={18} color="#4F46E5" />
              <Text style={styles.linkText}>Help & Support</Text>
              <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.linkRow} onPress={() => Alert.alert('ℹ️ About App', 'Pharma ERP Mobile Application v2.4.0\nDeveloped for Resonira Healthcare.')}>
              <Ionicons name="information-circle-outline" size={18} color="#4F46E5" />
              <Text style={styles.linkText}>About App</Text>
              <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
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
  tabText: { fontSize: 10, fontWeight: '600', color: '#64748B' },
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

  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  settingTitle: { fontSize: 13, fontWeight: 'bold', color: '#0F172A' },
  settingSub: { fontSize: 11, color: '#64748B', marginTop: 2 },

  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  infoLabel: { fontSize: 12, color: '#64748B' },
  infoVal: { fontSize: 12, fontWeight: 'bold', color: '#0F172A' },

  linkRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', gap: 10 },
  linkText: { flex: 1, fontSize: 13, fontWeight: '600', color: '#1E293B' },

  logoutCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#FEE2E2', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#FCA5A5' },
  logoutText: { color: '#DC2626', fontWeight: 'bold', fontSize: 13 },
});
