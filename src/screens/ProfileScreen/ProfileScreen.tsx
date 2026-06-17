import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  Platform,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

// Reusable InfoRow Component
const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.row}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value}</Text>
  </View>
);

// Reusable ProgressCard Component
const ProgressCard = ({
  label,
  target,
  achieved,
  percent,
  color,
}: {
  label: string;
  target: string;
  achieved: string;
  percent: string;
  color: string;
}) => (
  <View style={styles.progressCard}>
    <View style={styles.progressTopRow}>
      <Text style={styles.progressLabel}>{label}</Text>
      <Text style={styles.progressTarget}>{target}</Text>
    </View>
    <View style={styles.progressBar}>
      <View
        style={[
          styles.progressFill,
          { width: percent as any, backgroundColor: color },
        ]}
      />
    </View>
    <Text style={styles.progressText}>
      {percent} achieved — {achieved}
    </Text>
  </View>
);

const safeJsonParse = (data: string | null, fallback: any) => {
  if (!data) return fallback;
  try {
    return JSON.parse(data);
  } catch (err) {
    console.log('safeJsonParse error in ProfileScreen:', err);
    return fallback;
  }
};

const formatDateTime = (date: Date) => {
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }) + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const ProfileScreen = () => {
  const navigation = useNavigation<any>();
  const [userName, setUserName] = useState('Priya Reddy');
  const [designation, setDesignation] = useState('Medical Representative');
  const [employeeId, setEmployeeId] = useState('EMP-001');

  // Loading and Error UI States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit Modal State variables
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editMobile, setEditMobile] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editAddress, setEditAddress] = useState('');

  // Change Password Modal States
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Privacy Policy Modal State
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);

  // Dynamic Stats & Performance States
  const [docCount, setDocCount] = useState(0);
  const [chemistCount, setChemistCount] = useState(0);
  const [totalOrdersCount, setTotalOrdersCount] = useState(0);

  const [salesProgress, setSalesProgress] = useState(0);
  const [doctorProgress, setDoctorProgress] = useState(0);
  const [chemistProgress, setChemistProgress] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);

  // Dynamic Employee Info
  const [hq, setHq] = useState('Hyderabad');
  const [region, setRegion] = useState('Telangana');
  const [zone, setZone] = useState('South Zone');
  const [manager, setManager] = useState('Rajesh Kumar');
  const [joiningDate, setJoiningDate] = useState('01-Jan-2026');
  const [assignedTerritory, setAssignedTerritory] = useState('Hyderabad Central');

  // Dynamic Contact Info
  const [mobile, setMobile] = useState('+91 98765 43210');
  const [email, setEmail] = useState('admin@pharma.com');
  const [address, setAddress] = useState('Hyderabad, Telangana');

  // Dynamic Attendance Summary
  const [presentDays, setPresentDays] = useState(20);
  const [absentDays, setAbsentDays] = useState(2);
  const [leavesCount, setLeavesCount] = useState(1);

  // Dynamic Targets Limits
  const [targets, setTargets] = useState({
    sales: 50000,
    doctors: 30,
    chemists: 20,
  });

  // Last Synced & Login Timestamps
  const [lastSyncTime, setLastSyncTime] = useState('16-Jun-2026 11:35 AM');
  const [lastLoginTime, setLastLoginTime] = useState('16-Jun-2026 09:02 AM');

  // Load profile stats whenever the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadProfileAndStats();
    }, [])
  );

  const loadProfileAndStats = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Load Profile Details
      const storedName = await AsyncStorage.getItem('@user_name');
      const storedRole = await AsyncStorage.getItem('@designation');
      const storedId = await AsyncStorage.getItem('@employee_id');
      if (storedName) setUserName(storedName);
      if (storedRole) setDesignation(storedRole);
      if (storedId) setEmployeeId(storedId);

      // 2. Load Employee Details dynamically with fallbacks
      const storedHq = await AsyncStorage.getItem('@user_hq');
      const storedRegion = await AsyncStorage.getItem('@user_region');
      const storedZone = await AsyncStorage.getItem('@user_zone');
      const storedManager = await AsyncStorage.getItem('@user_manager');
      const storedJoinDate = await AsyncStorage.getItem('@user_joining_date');

      setHq(storedHq || 'Hyderabad');
      setRegion(storedRegion || 'Telangana');
      setZone(storedZone || 'South Zone');
      setManager(storedManager || 'Rajesh Kumar');
      setJoiningDate(storedJoinDate || '01-Jan-2026');

      // 3. Load Assigned Territory dynamically from Territory lists
      const storedTerritories = await AsyncStorage.getItem('@assigned_territories');
      const territoriesList = safeJsonParse(storedTerritories, []);
      if (territoriesList.length > 0) {
        setAssignedTerritory(territoriesList[0].area);
      } else {
        setAssignedTerritory('Hyderabad Central');
      }

      // 4. Load Contact Information dynamically
      const storedMobile = await AsyncStorage.getItem('@user_mobile');
      const storedEmail = await AsyncStorage.getItem('@user_email');
      const storedAddress = await AsyncStorage.getItem('@user_address');
      setMobile(storedMobile || '+91 98765 43210');
      setEmail(storedEmail || 'admin@pharma.com');
      setAddress(storedAddress || 'Hyderabad, Telangana');

      // 5. Load Monthly Targets dynamically
      const targetData = safeJsonParse(await AsyncStorage.getItem('@monthly_targets'), {
        sales: 50000,
        doctors: 30,
        chemists: 20,
      });
      setTargets(targetData);

      // 6. Load Doctor Visits
      const docVisitsData = await AsyncStorage.getItem('@doctor_visits');
      const docVisitsList = safeJsonParse(docVisitsData, []);
      setDocCount(docVisitsList.length);
      const calculatedDocProgress = Math.min(Math.round((docVisitsList.length / targetData.doctors) * 100), 100);
      setDoctorProgress(calculatedDocProgress);

      // 7. Load Chemist Visits
      const chemistVisitsData = await AsyncStorage.getItem('@chemist_visits');
      const chemistVisitsList = safeJsonParse(chemistVisitsData, []);
      setChemistCount(chemistVisitsList.length);
      const calculatedChemProgress = Math.min(Math.round((chemistVisitsList.length / targetData.chemists) * 100), 100);
      setChemistProgress(calculatedChemProgress);

      // 8. Load Orders count and sum
      const ordersData = await AsyncStorage.getItem('@orders');
      const ordersList = safeJsonParse(ordersData, []);
      
      const ordersSum = ordersList.reduce((sum: number, item: any) => sum + (parseFloat(item.totalAmount) || 0), 0);
      const chemistOrdersSum = chemistVisitsList.reduce((sum: number, item: any) => sum + (parseFloat(item.orderValue) || 0), 0);
      
      const totalRev = ordersSum + chemistOrdersSum;
      setTotalRevenue(totalRev);
      
      // Combine chemist bookings and direct orders count
      setTotalOrdersCount(ordersList.length + chemistVisitsList.filter((c: any) => parseFloat(c.orderValue) > 0).length);

      const calculatedSalesProgress = Math.min(Math.round((totalRev / targetData.sales) * 100), 100);
      setSalesProgress(calculatedSalesProgress);

      // 9. Load Attendance history
      const attendanceLogsData = await AsyncStorage.getItem('@attendance_logs');
      const attendanceLogs = safeJsonParse(attendanceLogsData, []);
      setPresentDays(20 + attendanceLogs.length);

      // Load leaves requested status
      const leavesData = await AsyncStorage.getItem('@leave_requests');
      const leaveRequests = safeJsonParse(leavesData, []);
      const approvedCount = leaveRequests.filter((req: any) => req.status === 'Approved').length;
      setLeavesCount(1 + approvedCount);

      // Adjust absent days realistically
      setAbsentDays(Math.max(0, 2 - attendanceLogs.filter((l: any) => l.status === 'Absent').length));

      // 10. Load Last Sync and Last Login Times
      const storedSync = await AsyncStorage.getItem('@last_sync_time');
      const storedLogin = await AsyncStorage.getItem('@last_login_time');
      setLastSyncTime(storedSync || '16-Jun-2026 11:35 AM');
      setLastLoginTime(storedLogin || '16-Jun-2026 09:02 AM');

    } catch (e) {
      console.log('loadProfileAndStats error in ProfileScreen:', e);
      setError('Failed to load profile details.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEditModal = () => {
    setEditMobile(mobile);
    setEditEmail(email);
    setEditAddress(address);
    setIsEditModalOpen(true);
  };

  const handleSaveContactInfo = async () => {
    if (!editMobile.trim() || !editEmail.trim() || !editAddress.trim()) {
      if (Platform.OS === 'web') {
        window.alert('⚠️ All contact information fields are required.');
      } else {
        Alert.alert('Validation Error', 'All contact information fields are required.');
      }
      return;
    }

    if (editMobile.trim().length < 10) {
      if (Platform.OS === 'web') {
        window.alert('⚠️ Mobile number must be at least 10 digits.');
      } else {
        Alert.alert('Validation Error', 'Mobile number must be at least 10 digits.');
      }
      return;
    }

    if (!editEmail.includes('@')) {
      if (Platform.OS === 'web') {
        window.alert('⚠️ Please enter a valid email address.');
      } else {
        Alert.alert('Validation Error', 'Please enter a valid email address.');
      }
      return;
    }

    setLoading(true);
    try {
      await AsyncStorage.setItem('@user_mobile', editMobile.trim());
      await AsyncStorage.setItem('@user_email', editEmail.trim());
      await AsyncStorage.setItem('@user_address', editAddress.trim());

      setMobile(editMobile.trim());
      setEmail(editEmail.trim());
      setAddress(editAddress.trim());

      setIsEditModalOpen(false);

      if (Platform.OS === 'web') {
        window.alert('✅ Contact information updated successfully!');
      } else {
        Alert.alert('Success', 'Contact information updated successfully!');
      }
    } catch (err) {
      console.log('Error saving contact info:', err);
      if (Platform.OS === 'web') {
        window.alert('❌ Failed to save contact information.');
      } else {
        Alert.alert('Error', 'Failed to save contact information.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      if (Platform.OS === 'web') {
        window.alert('⚠️ All password fields are required.');
      } else {
        Alert.alert('Validation Error', 'All password fields are required.');
      }
      return;
    }

    setLoading(true);
    try {
      const storedPassword = await AsyncStorage.getItem('@user_password') || 'admin123';
      if (currentPassword.trim() !== storedPassword) {
        if (Platform.OS === 'web') {
          window.alert('⚠️ Incorrect current password.');
        } else {
          Alert.alert('Validation Error', 'Incorrect current password.');
        }
        setLoading(false);
        return;
      }

      if (newPassword.length < 6) {
        if (Platform.OS === 'web') {
          window.alert('⚠️ New password must be at least 6 characters.');
        } else {
          Alert.alert('Validation Error', 'New password must be at least 6 characters.');
        }
        setLoading(false);
        return;
      }

      if (newPassword !== confirmPassword) {
        if (Platform.OS === 'web') {
          window.alert('⚠️ Passwords do not match.');
        } else {
          Alert.alert('Validation Error', 'Passwords do not match.');
        }
        setLoading(false);
        return;
      }

      // Simulate password change
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await AsyncStorage.setItem('@user_password', newPassword);

      setIsPasswordModalOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      if (Platform.OS === 'web') {
        window.alert('✅ Password changed successfully!');
      } else {
        Alert.alert('Success', 'Password changed successfully!');
      }
    } catch (err) {
      console.log('Error changing password:', err);
      if (Platform.OS === 'web') {
        window.alert('❌ Failed to change password.');
      } else {
        Alert.alert('Error', 'Failed to change password.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSyncData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Simulate API sync check
      await new Promise((resolve) => setTimeout(resolve, 1200));
      await loadProfileAndStats();

      const nowStr = formatDateTime(new Date());
      await AsyncStorage.setItem('@last_sync_time', nowStr);
      setLastSyncTime(nowStr);

      if (Platform.OS === 'web') {
        window.alert('✅ Data Synced Successfully!');
      } else {
        Alert.alert('Success', '✅ Data Synced Successfully!');
      }
    } catch (err) {
      setError('Failed to sync details.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      const confirmLogout = window.confirm('Are you sure you want to logout?');
      if (confirmLogout) {
        navigation.replace('Login');
      }
    } else {
      Alert.alert(
        'Logout',
        'Are you sure you want to logout?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Logout',
            style: 'destructive',
            onPress: () => navigation.replace('Login'),
          },
        ]
      );
    }
  };

  // Safe initials mapping
  const initials = userName
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  // Dynamic Performance Grade Calculation
  const avgProgress = (salesProgress + doctorProgress + chemistProgress) / 3;
  let performanceGrade = 'B';
  let gradeColor = '#FB8C00'; // Amber/Orange
  if (avgProgress >= 90) {
    performanceGrade = 'A+';
    gradeColor = '#43A047'; // Green
  } else if (avgProgress >= 80) {
    performanceGrade = 'A';
    gradeColor = '#43A047';
  } else if (avgProgress >= 70) {
    performanceGrade = 'B+';
    gradeColor = '#1E88E5'; // Blue
  } else if (avgProgress >= 50) {
    performanceGrade = 'C';
    gradeColor = '#FB8C00';
  } else {
    performanceGrade = 'D';
    gradeColor = '#E53935'; // Red
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1E88E5" />
        <Text style={styles.loadingText}>Loading Profile...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>⚠️ {error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadProfileAndStats}>
          <Text style={styles.retryButtonText}>🔄 Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 30 }}
    >
      {/* Header */}
      <View style={styles.header}>
        <Image 
          source={require('../../../assets/images/logo.png')} 
          style={styles.profileLogo} 
          resizeMode="contain"
        />
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.name}>{userName}</Text>
        <Text style={styles.designation}>{designation}</Text>
        
        {/* Status Badge */}
        <View style={styles.statusBadge}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>Active Employee</Text>
        </View>

        <Text style={styles.empId}>Employee ID: {employeeId}</Text>
      </View>

      {/* Employee Details */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🧑‍💼 Employee Details</Text>
        <InfoRow label="🏢 HQ"           value={hq} />
        <InfoRow label="🗺️ Region"        value={region} />
        <InfoRow label="📍 Zone"          value={zone} />
        <InfoRow label="📍 Assigned Beat" value={assignedTerritory} />
        <InfoRow label="👨‍💼 Manager"      value={manager} />
        <InfoRow label="📅 Joining Date"  value={joiningDate} />
      </View>

      {/* Contact Information */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardTitle}>📞 Contact Information</Text>
          <TouchableOpacity onPress={handleOpenEditModal}>
            <Text style={styles.editLinkText}>✏️ Edit</Text>
          </TouchableOpacity>
        </View>
        <InfoRow label="📱 Mobile"  value={mobile} />
        <InfoRow label="📧 Email"   value={email} />
        <InfoRow label="🏠 Address" value={address} />
        <InfoRow label="🕒 Last Login" value={lastLoginTime} />
      </View>

      {/* Attendance Summary */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📋 Attendance Summary</Text>
        <InfoRow label="✅ Present Days" value={presentDays.toString()} />
        <InfoRow label="❌ Absent Days"  value={absentDays.toString()} />
        <InfoRow label="🏖️ Leaves"       value={leavesCount.toString()} />
      </View>

      {/* Today's Summary */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📊 Today's Summary</Text>
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{docCount}</Text>
            <Text style={styles.statLabel}>Doctor{'\n'}Visits</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{chemistCount}</Text>
            <Text style={styles.statLabel}>Chemist{'\n'}Visits</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{totalOrdersCount}</Text>
            <Text style={styles.statLabel}>Orders{'\n'}Booked</Text>
          </View>
        </View>
      </View>

      {/* Monthly Performance */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🎯 Monthly Performance</Text>
        <ProgressCard
          label="💰 Sales Target"
          target={`₹${targets.sales.toLocaleString()}`}
          achieved={`₹${totalRevenue.toLocaleString()}`}
          percent={`${salesProgress}%`}
          color="#1E88E5"
        />
        <ProgressCard
          label="👨⚕️ Doctor Visits"
          target={targets.doctors.toString()}
          achieved={`${docCount} visits`}
          percent={`${doctorProgress}%`}
          color="#43A047"
        />
        <ProgressCard
          label="💊 Chemist Visits"
          target={targets.chemists.toString()}
          achieved={`${chemistCount} visits`}
          percent={`${chemistProgress}%`}
          color="#FB8C00"
        />

        {/* Dynamic Performance Grade */}
        <View style={styles.gradeContainer}>
          <Text style={styles.gradeLabel}>🏆 Performance Grade</Text>
          <View style={[styles.gradeBadge, { backgroundColor: gradeColor }]}>
            <Text style={styles.gradeText}>{performanceGrade}</Text>
          </View>
        </View>
      </View>

      {/* Settings */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>⚙️ Settings</Text>
        <TouchableOpacity style={styles.settingRow} onPress={() => setIsPasswordModalOpen(true)}>
          <Text style={styles.settingText}>🔒 Change Password</Text>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingRow} onPress={handleSyncData}>
          <View>
            <Text style={styles.settingText}>🔄 Sync Data</Text>
            <Text style={styles.syncSubText}>Last Sync: {lastSyncTime.split(' ').slice(1).join(' ') || '11:35 AM'}</Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingRow} onPress={() => setIsPrivacyModalOpen(true)}>
          <Text style={styles.settingText}>📄 Privacy Policy</Text>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
        <View style={styles.settingRow}>
          <Text style={styles.settingText}>📱 App Version</Text>
          <Text style={styles.versionText}>v1.0.0</Text>
        </View>
      </View>

      {/* Logout */}
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
      >
        <Text style={styles.logoutText}>🚪 Logout</Text>
      </TouchableOpacity>

      <Text style={styles.syncFooterText}>Last Synced: {lastSyncTime}</Text>

      {/* ── PROFILE CONTACT INFORMATION EDITING MODAL ── */}
      <Modal
        visible={isEditModalOpen}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsEditModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>✏️ Edit Contact Information</Text>

            {/* Input Mobile */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Mobile Number</Text>
              <TextInput
                style={styles.textInput}
                value={editMobile}
                onChangeText={setEditMobile}
                placeholder="+91 XXXXX XXXXX"
                keyboardType="phone-pad"
              />
            </View>

            {/* Input Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <TextInput
                style={styles.textInput}
                value={editEmail}
                onChangeText={setEditEmail}
                placeholder="example@pharma.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Input Address */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Physical Address</Text>
              <TextInput
                style={styles.textInput}
                value={editAddress}
                onChangeText={setEditAddress}
                placeholder="City, State"
              />
            </View>

            {/* Modal Actions */}
            <View style={styles.modalActionRow}>
              <TouchableOpacity 
                style={styles.modalCancelButton} 
                onPress={() => setIsEditModalOpen(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalSaveButton} 
                onPress={handleSaveContactInfo}
              >
                <Text style={styles.modalSaveText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── CHANGE PASSWORD MODAL ── */}
      <Modal
        visible={isPasswordModalOpen}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsPasswordModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>🔒 Change Password</Text>

            {/* Current Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Current Password</Text>
              <TextInput
                style={styles.textInput}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Enter current password"
                secureTextEntry={true}
              />
            </View>

            {/* New Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>New Password</Text>
              <TextInput
                style={styles.textInput}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Min 6 characters"
                secureTextEntry={true}
              />
            </View>

            {/* Confirm New Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirm New Password</Text>
              <TextInput
                style={styles.textInput}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Re-enter new password"
                secureTextEntry={true}
              />
            </View>

            {/* Actions */}
            <View style={styles.modalActionRow}>
              <TouchableOpacity 
                style={styles.modalCancelButton} 
                onPress={() => {
                  setIsPasswordModalOpen(false);
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalSaveButton} 
                onPress={handleChangePassword}
              >
                <Text style={styles.modalSaveText}>Update</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── PRIVACY POLICY MODAL ── */}
      <Modal
        visible={isPrivacyModalOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsPrivacyModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>📄 Privacy Policy & Data Handling</Text>
            
            <ScrollView style={{ maxHeight: 300, marginBottom: 15 }}>
              <Text style={styles.policyText}>
                Last Updated: 16-Jun-2026{"\n\n"}
                MJ Healthcare Pharma ERP collects location details, visit logging metrics, and order bookings for Medical Representatives to verify travel compliance and field metrics.{"\n\n"}
                1. Location tracking data is processed locally on this device and synchronized during check-in/check-out cycles.{"\n\n"}
                2. User credentials and profile contact detail updates are preserved locally in the AsyncStorage container on the client device.{"\n\n"}
                3. We implement strong industry-standard security measures to encrypt sync data transmitted to central databases.
              </Text>
            </ScrollView>

            <TouchableOpacity 
              style={[styles.modalCancelButton, { alignSelf: 'flex-end' }]} 
              onPress={() => setIsPrivacyModalOpen(false)}
            >
              <Text style={styles.modalCancelText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </ScrollView>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#E53935',
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#1E88E5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    elevation: 2,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  header: {
    backgroundColor: '#1E88E5',
    alignItems: 'center',
    paddingVertical: 25,
    paddingTop: 50,
  },
  profileLogo: {
    width: 150,
    height: 50,
    marginBottom: 15,
    alignSelf: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1E88E5',
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 5,
  },
  designation: {
    color: '#cce5ff',
    marginTop: 4,
    fontSize: 14,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4ADE80',
    marginRight: 6,
  },
  statusText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  empId: {
    color: '#cce5ff',
    marginTop: 8,
    fontSize: 12,
  },
  card: {
    backgroundColor: '#fff',
    margin: 15,
    marginBottom: 0,
    borderRadius: 12,
    padding: 15,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  editLinkText: {
    color: '#1E88E5',
    fontWeight: 'bold',
    fontSize: 14,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  label: {
    color: '#666',
    fontSize: 14,
  },
  value: {
    fontWeight: '600',
    color: '#333',
    fontSize: 14,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F5F7FA',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E88E5',
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  progressCard: {
    marginBottom: 15,
  },
  progressTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 14,
    color: '#555',
  },
  progressTarget: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  progressBar: {
    height: 10,
    backgroundColor: '#eee',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: 10,
    borderRadius: 5,
  },
  progressText: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  gradeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  gradeLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  gradeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  gradeText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  settingText: {
    fontSize: 14,
    color: '#333',
  },
  syncSubText: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  arrow: {
    fontSize: 20,
    color: '#999',
  },
  versionText: {
    fontSize: 13,
    color: '#999',
  },
  logoutButton: {
    backgroundColor: '#E53935',
    margin: 15,
    marginTop: 20,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  logoutText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  syncFooterText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 5,
    fontStyle: 'italic',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 16,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
  },
  modalActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 20,
  },
  modalCancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
  },
  modalCancelText: {
    fontSize: 14,
    color: '#475569',
    fontWeight: 'bold',
  },
  modalSaveButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#1E88E5',
  },
  modalSaveText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  policyText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },
});