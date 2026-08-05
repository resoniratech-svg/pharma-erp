import React, { useState } from 'react';
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

const RSMSettingsScreen = () => {
  const navigation = useNavigation<any>();
  const [activeTab, setActiveTab] = useState<'Profile' | 'Password'>('Profile');

  // Profile fields for Amitabh Verma
  const [employeeId] = useState('RSM001');
  const [name, setName] = useState('Amitabh Verma');
  const [mobile, setMobile] = useState('+91 98765 11223');
  const [email, setEmail] = useState('amitabh.verma@pharmaerp.com');
  const [designation] = useState('Regional Sales Manager');
  const [region] = useState('South Zone');

  // Change Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSaveProfile = () => {
    Alert.alert('✅ Profile Updated', 'RSM Profile information updated.');
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

  const handleLogoutConfirm = () => {
    if (Platform.OS === 'web') {
      const confirmLogout = window.confirm('Are you sure you want to log out of the RSM Portal?');
      if (confirmLogout) {
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
      }
    } else {
      Alert.alert(
        '🚪 Logout Confirmation',
        'Are you sure you want to log out of the RSM Portal?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Logout', style: 'destructive', onPress: () => navigation.reset({ index: 0, routes: [{ name: 'Login' }] }) },
        ]
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.navigate('RSMDashboard')} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#0F172A" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>⚙️ Settings</Text>
            <Text style={styles.subtitle}>Account profile & security settings.</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
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
          <Text style={styles.logoutText}>🚪 Logout of RSM Portal</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default RSMSettingsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: 16, 
    backgroundColor: '#FFF', 
    borderBottomWidth: 1, 
    borderBottomColor: '#E2E8F0',
    gap: 12
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1
  },
  backBtn: { 
    padding: 6, 
    marginRight: 12, 
    backgroundColor: '#F1F5F9', 
    borderRadius: 8,
    marginTop: 2
  },
  title: { fontSize: 20, fontWeight: 'bold', color: '#0F172A' },
  subtitle: { fontSize: 12, color: '#64748B', marginTop: 2 },
  scrollContent: { padding: 16 },

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
