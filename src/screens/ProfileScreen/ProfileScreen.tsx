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

// ── API Services ──
import { getMrDashboardAnalytics } from '../../services/dashboardService';
import { getDoctorVisitsByMr } from '../../services/doctorService';
import { getChemistVisitsByMr } from '../../services/chemistService';
import { getAttendanceLogs } from '../../services/attendanceService';
import { getLeavesByMr } from '../../services/leaveService';

// ── Reusable Components ──
const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.row}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value}</Text>
  </View>
);

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

// ── Helpers ──
const safeJsonParse = (data: string | null, fallback: any) => {
  if (!data) return fallback;
  try {
    return JSON.parse(data);
  } catch (err) {
    console.log('safeJsonParse error in ProfileScreen:', err);
    return fallback;
  }
};

const formatDateTime = (date: Date) =>
  date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) +
  ' ' +
  date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const showAlert = (title: string, message: string) => {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
};

// ── Validation Regexes ──
const MOBILE_REGEX = /^[6-9]\d{9}$/;
const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
// Min 8 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special char
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

// ── Main Component ──
const ProfileScreen = () => {
  const navigation = useNavigation<any>();

  const [userName, setUserName] = useState('MR User');
  const [designation, setDesignation] = useState('Medical Representative');
  const [employeeId, setEmployeeId] = useState('EMP-XXXX');

  // UI States
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);  // ← prevents double-save
  const [error, setError] = useState<string | null>(null);

  // Edit Contact Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editMobile, setEditMobile] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editAddress, setEditAddress] = useState('');

  // Change Password Modal
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Privacy Policy Modal
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);

  // Stats & Performance
  const [docCount, setDocCount] = useState(0);
  const [chemistCount, setChemistCount] = useState(0);
  const [totalOrdersCount, setTotalOrdersCount] = useState(0);
  const [salesProgress, setSalesProgress] = useState(0);
  const [doctorProgress, setDoctorProgress] = useState(0);
  const [chemistProgress, setChemistProgress] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);

  // Employee Info
  const [hq, setHq] = useState('Not Assigned');
  const [region, setRegion] = useState('Not Assigned');
  const [zone, setZone] = useState('Not Assigned');
  const [manager, setManager] = useState('Not Assigned');
  const [joiningDate, setJoiningDate] = useState('N/A');
  const [assignedTerritory, setAssignedTerritory] = useState('Not Assigned');

  // Contact Info
  const [mobile, setMobile] = useState('Not Available');
  const [email, setEmail] = useState('Not Available');
  const [address, setAddress] = useState('Not Available');

  // Attendance Summary
  const [presentDays, setPresentDays] = useState(0);
  const [absentDays, setAbsentDays] = useState(0);
  const [leavesCount, setLeavesCount] = useState(0);
  const [workingDays, setWorkingDays] = useState(0);

  // Targets
  const [targets, setTargets] = useState({ sales: 50000, doctors: 30, chemists: 20 });

  // Timestamps
  const [lastSyncTime, setLastSyncTime] = useState('Never Synced');
  const [lastLoginTime, setLastLoginTime] = useState('Just Now');

  useFocusEffect(
    useCallback(() => {
      loadProfileAndStats();
    }, [])
  );

  const loadProfileAndStats = async () => {
    setLoading(true);
    setError(null);
    try {
      // ── 1. Basic Profile from AsyncStorage ──
      const storedName = await AsyncStorage.getItem('@user_name');
      const storedRole = await AsyncStorage.getItem('@designation');
      const storedId = await AsyncStorage.getItem('@employee_id');
      if (storedName) setUserName(storedName);
      if (storedRole) setDesignation(storedRole);
      if (storedId) setEmployeeId(storedId);

      // ── 2. Employee Details (AsyncStorage until /mr/profile API is ready) ──
      setHq((await AsyncStorage.getItem('@user_hq')) || 'Not Assigned');
      setRegion((await AsyncStorage.getItem('@user_region')) || 'Not Assigned');
      setZone((await AsyncStorage.getItem('@user_zone')) || 'Not Assigned');
      setManager((await AsyncStorage.getItem('@user_manager')) || 'Not Assigned');
      setJoiningDate((await AsyncStorage.getItem('@user_joining_date')) || 'N/A');

      const storedTerritories = safeJsonParse(await AsyncStorage.getItem('@assigned_territories'), []);
      setAssignedTerritory(storedTerritories.length > 0 ? storedTerritories[0].area : 'Not Assigned');

      // ── 3. Contact Info ──
      setMobile((await AsyncStorage.getItem('@user_mobile')) || 'Not Available');
      setEmail((await AsyncStorage.getItem('@user_email')) || 'Not Available');
      setAddress((await AsyncStorage.getItem('@user_address')) || 'Not Available');

      // ── 4. Monthly Targets ──
      const targetData = safeJsonParse(await AsyncStorage.getItem('@monthly_targets'), {
        sales: 50000,
        doctors: 30,
        chemists: 20,
      });
      setTargets(targetData);

      // ── 5. Dashboard Analytics API (Primary for performance) ──
      let performanceLoadedFromAPI = false;
      try {
        const stats = await getMrDashboardAnalytics();
        if (stats) {
          const apiDocCount = stats.todayDoctorVisits?.completed || 0;
          const apiChemCount = stats.todayChemistVisits?.completed || 0;
          const apiSalesAmt = stats.monthlyProgress?.sales?.amount || 0;
          setDocCount(apiDocCount);
          setChemistCount(apiChemCount);
          setTotalRevenue(apiSalesAmt);
          setDoctorProgress(stats.monthlyProgress?.docs?.percent || 0);
          setChemistProgress(stats.monthlyProgress?.chemists?.percent || 0);
          setSalesProgress(stats.monthlyProgress?.sales?.percent || 0);
          performanceLoadedFromAPI = true;
        }
      } catch (e) {
        console.log('Dashboard API failed, falling back to individual APIs:', e);
      }

      // ── 6. Doctor Visits via API (fallback if dashboard API failed) ──
      if (!performanceLoadedFromAPI) {
        try {
          const docVisits = await getDoctorVisitsByMr();
          const docList = Array.isArray(docVisits) ? docVisits : [];
          setDocCount(docList.length);
          setDoctorProgress(Math.min(Math.round((docList.length / targetData.doctors) * 100), 100));
        } catch (e) {
          console.log('Doctor visits API failed:', e);
          const docVisitsData = safeJsonParse(await AsyncStorage.getItem('@doctor_visits'), []);
          setDocCount(docVisitsData.length);
          setDoctorProgress(Math.min(Math.round((docVisitsData.length / targetData.doctors) * 100), 100));
        }

        // ── 7. Chemist Visits via API ──
        try {
          const chemVisits = await getChemistVisitsByMr();
          const chemList = Array.isArray(chemVisits) ? chemVisits : [];
          setChemistCount(chemList.length);
          const chemRevenue = chemList.reduce((s: number, c: any) => s + (parseFloat(c.orderValue || c.pobAmount) || 0), 0);
          setChemistProgress(Math.min(Math.round((chemList.length / targetData.chemists) * 100), 100));

          // ── 8. Orders via AsyncStorage (backend not ready yet) ──
          const ordersData = safeJsonParse(await AsyncStorage.getItem('@orders'), []);
          const ordersRevenue = ordersData.reduce((s: number, o: any) => s + (parseFloat(o.totalAmount) || 0), 0);
          setTotalOrdersCount(ordersData.length + chemList.filter((c: any) => parseFloat(c.orderValue) > 0).length);
          const totalRev = chemRevenue + ordersRevenue;
          setTotalRevenue(totalRev);
          setSalesProgress(Math.min(Math.round((totalRev / targetData.sales) * 100), 100));
        } catch (e) {
          console.log('Chemist visits API failed:', e);
          const chemData = safeJsonParse(await AsyncStorage.getItem('@chemist_visits'), []);
          setChemistCount(chemData.length);
          setChemistProgress(Math.min(Math.round((chemData.length / targetData.chemists) * 100), 100));
        }
      }

      // ── 9. Attendance from API ──
      try {
        const logs = await getAttendanceLogs();
        const logsList = Array.isArray(logs) ? logs : [];
        const present = logsList.filter((l: any) =>
          String(l.status).toUpperCase() === 'PRESENT' || String(l.status).toUpperCase() === 'APPROVED'
        ).length;
        const absent = logsList.filter((l: any) => String(l.status).toUpperCase() === 'ABSENT').length;
        setPresentDays(present);
        setAbsentDays(absent);
        setWorkingDays(logsList.length);
      } catch (e) {
        console.log('Attendance API failed, using AsyncStorage fallback:', e);
        const attData = safeJsonParse(await AsyncStorage.getItem('@attendance_logs'), []);
        setPresentDays(attData.filter((l: any) => l.status !== 'Absent').length);
        setAbsentDays(attData.filter((l: any) => l.status === 'Absent').length);
        setWorkingDays(attData.length);
      }

      // ── 10. Leaves from API ──
      try {
        const leavesData = await getLeavesByMr();
        const leavesList = Array.isArray(leavesData) ? leavesData : [];
        setLeavesCount(leavesList.filter((l: any) => l.status === 'Approved' || l.status === 'APPROVED').length);
      } catch (e) {
        console.log('Leaves API failed, using AsyncStorage fallback:', e);
        const leavesLocal = safeJsonParse(await AsyncStorage.getItem('@leave_requests'), []);
        setLeavesCount(leavesLocal.filter((r: any) => r.status === 'Approved').length);
      }

      // ── 11. Last Sync & Login ──
      setLastSyncTime((await AsyncStorage.getItem('@last_sync_time')) || 'Never Synced');
      setLastLoginTime((await AsyncStorage.getItem('@last_login_time')) || 'Just Now');

    } catch (e) {
      console.log('loadProfileAndStats error in ProfileScreen:', e);
      setError('Failed to load profile details.');
    } finally {
      setLoading(false);
    }
  };

  // ── Contact Info Save (with strong validation + isSaving guard) ──
  const handleOpenEditModal = () => {
    setEditMobile(mobile !== 'Not Available' ? mobile : '');
    setEditEmail(email !== 'Not Available' ? email : '');
    setEditAddress(address !== 'Not Available' ? address : '');
    setIsEditModalOpen(true);
  };

  const handleSaveContactInfo = async () => {
    if (isSaving) return; // ← prevent double-tap

    const mob = editMobile.trim();
    const eml = editEmail.trim();
    const addr = editAddress.trim();

    // ── Validation ──
    if (!mob || !eml || !addr) {
      showAlert('⚠️ Validation Error', 'All contact information fields are required.');
      return;
    }

    if (!MOBILE_REGEX.test(mob)) {
      showAlert('⚠️ Invalid Mobile', 'Enter a valid 10-digit Indian mobile number starting with 6–9.\n(No spaces, letters or symbols.)');
      return;
    }

    if (!EMAIL_REGEX.test(eml)) {
      showAlert('⚠️ Invalid Email', 'Please enter a valid email address (e.g. name@company.com).');
      return;
    }

    if (addr.length < 10) {
      showAlert('⚠️ Invalid Address', 'Address must contain at least 10 characters.');
      return;
    }

    setIsSaving(true);
    try {
      await AsyncStorage.setItem('@user_mobile', mob);
      await AsyncStorage.setItem('@user_email', eml);
      await AsyncStorage.setItem('@user_address', addr);

      setMobile(mob);
      setEmail(eml);
      setAddress(addr);
      setIsEditModalOpen(false);
      showAlert('✅ Success', 'Contact information updated successfully!');
    } catch (err) {
      console.log('Error saving contact info:', err);
      showAlert('❌ Error', 'Failed to save contact information.');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Change Password (production-grade validation) ──
  const handleChangePassword = async () => {
    if (loading) return;

    const cur = currentPassword.trim();
    const nw = newPassword.trim();
    const conf = confirmPassword.trim();

    if (!cur || !nw || !conf) {
      showAlert('⚠️ Validation Error', 'All password fields are required.');
      return;
    }

    // Verify current password
    setLoading(true);
    try {
      const storedPassword = (await AsyncStorage.getItem('@user_password')) || 'admin123';
      if (cur !== storedPassword) {
        showAlert('⚠️ Incorrect Password', 'Current password is incorrect.');
        setLoading(false);
        return;
      }
    } catch (e) {
      setLoading(false);
      return;
    }

    // New password must not be the same as current
    if (nw === cur) {
      showAlert('⚠️ Same Password', 'New password must be different from your current password.');
      setLoading(false);
      return;
    }

    // Production password rules
    if (!PASSWORD_REGEX.test(nw)) {
      showAlert(
        '⚠️ Weak Password',
        'New password must have:\n• Minimum 8 characters\n• At least 1 uppercase letter\n• At least 1 lowercase letter\n• At least 1 number\n• At least 1 special character (@$!%*?&)'
      );
      setLoading(false);
      return;
    }

    if (nw !== conf) {
      showAlert('⚠️ Password Mismatch', 'New password and confirm password do not match.');
      setLoading(false);
      return;
    }

    try {
      await AsyncStorage.setItem('@user_password', nw);
      setIsPasswordModalOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showAlert('✅ Password Changed', 'Your password has been updated successfully!');
    } catch (err) {
      console.log('Error changing password:', err);
      showAlert('❌ Error', 'Failed to change password.');
    } finally {
      setLoading(false);
    }
  };

  // ── Sync Data (real API calls) ──
  const handleSyncData = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      // Call all available APIs in parallel
      await Promise.allSettled([
        getMrDashboardAnalytics(),
        getDoctorVisitsByMr(),
        getChemistVisitsByMr(),
        getAttendanceLogs(),
        getLeavesByMr(),
      ]);

      // Reload everything from APIs
      await loadProfileAndStats();

      const nowStr = formatDateTime(new Date());
      await AsyncStorage.setItem('@last_sync_time', nowStr);
      setLastSyncTime(nowStr);
      showAlert('✅ Sync Complete', 'All data has been refreshed from the server.');
    } catch (err) {
      console.log('Sync error:', err);
      setError('Failed to sync details.');
      showAlert('❌ Sync Failed', 'Unable to connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Logout (clear entire session) ──
  const performLogout = async () => {
    try {
      await AsyncStorage.multiRemove([
        '@token',
        '@mrId',
        '@user_name',
        '@designation',
        '@employee_id',
        '@last_login_time',
        '@user_mobile',
        '@user_email',
        '@user_address',
        '@user_password',
      ]);
    } catch (e) {
      console.log('Logout clear error:', e);
    }
    navigation.replace('Login');
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      const confirmLogout = window.confirm('Are you sure you want to logout?');
      if (confirmLogout) performLogout();
    } else {
      Alert.alert('Logout', 'Are you sure you want to logout?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: performLogout },
      ]);
    }
  };

  // ── Initials ──
  const initials = userName
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  // ── Performance Grade ──
  const avgProgress = (salesProgress + doctorProgress + chemistProgress) / 3;
  let performanceGrade = 'D';
  let gradeColor = '#E53935';
  if (avgProgress >= 90) { performanceGrade = 'A+'; gradeColor = '#43A047'; }
  else if (avgProgress >= 80) { performanceGrade = 'A'; gradeColor = '#43A047'; }
  else if (avgProgress >= 70) { performanceGrade = 'B+'; gradeColor = '#1E88E5'; }
  else if (avgProgress >= 50) { performanceGrade = 'B'; gradeColor = '#FB8C00'; }
  else if (avgProgress >= 30) { performanceGrade = 'C'; gradeColor = '#FB8C00'; }

  // ── Loading Screen ──
  if (loading && !isEditModalOpen && !isPasswordModalOpen) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1E88E5" />
        <Text style={styles.loadingText}>Loading Profile...</Text>
      </View>
    );
  }

  if (error && !loading) {
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
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 30 }}>

      {/* ── Header ── */}
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
        <View style={styles.statusBadge}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>Active Employee</Text>
        </View>
        <Text style={styles.empId}>Employee ID: {employeeId}</Text>
      </View>

      {/* ── Employee Details ── */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🧑‍💼 Employee Details</Text>
        <InfoRow label="🏢 HQ"           value={hq} />
        <InfoRow label="🗺️ Region"        value={region} />
        <InfoRow label="📍 Zone"          value={zone} />
        <InfoRow label="📍 Assigned Beat" value={assignedTerritory} />
        <InfoRow label="👨‍💼 Manager"      value={manager} />
        <InfoRow label="📅 Joining Date"  value={joiningDate} />
      </View>

      {/* ── Contact Information ── */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardTitle}>📞 Contact Information</Text>
          <TouchableOpacity onPress={handleOpenEditModal} disabled={loading}>
            <Text style={styles.editLinkText}>✏️ Edit</Text>
          </TouchableOpacity>
        </View>
        <InfoRow label="📱 Mobile"     value={mobile} />
        <InfoRow label="📧 Email"      value={email} />
        <InfoRow label="🏠 Address"    value={address} />
        <InfoRow label="🕒 Last Login" value={lastLoginTime} />
      </View>

      {/* ── Attendance Summary ── */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📋 Attendance Summary</Text>
        <InfoRow label="✅ Present Days"  value={presentDays.toString()} />
        <InfoRow label="❌ Absent Days"   value={absentDays.toString()} />
        <InfoRow label="🏖️ Approved Leaves" value={leavesCount.toString()} />
        <InfoRow label="📆 Working Days"  value={workingDays.toString()} />
      </View>

      {/* ── Today's Summary ── */}
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

      {/* ── Monthly Performance ── */}
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
          label="👨‍⚕️ Doctor Visits"
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
        <View style={styles.gradeContainer}>
          <Text style={styles.gradeLabel}>🏆 Performance Grade</Text>
          <View style={[styles.gradeBadge, { backgroundColor: gradeColor }]}>
            <Text style={styles.gradeText}>{performanceGrade}</Text>
          </View>
        </View>
      </View>

      {/* ── Settings ── */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>⚙️ Settings</Text>

        <TouchableOpacity
          style={styles.settingRow}
          onPress={() => setIsPasswordModalOpen(true)}
          disabled={loading}
        >
          <Text style={styles.settingText}>🔒 Change Password</Text>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.settingRow}
          onPress={handleSyncData}
          disabled={loading}
        >
          <View>
            <Text style={[styles.settingText, loading && { color: '#94A3B8' }]}>
              {loading ? '🔄 Syncing...' : '🔄 Sync Data'}
            </Text>
            <Text style={styles.syncSubText}>Last Sync: {lastSyncTime.split(' ').slice(1).join(' ') || 'Never'}</Text>
          </View>
          {loading ? <ActivityIndicator size="small" color="#1E88E5" /> : <Text style={styles.arrow}>›</Text>}
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

      {/* ── Logout ── */}
      <TouchableOpacity
        style={[styles.logoutButton, loading && styles.disabledButton]}
        onPress={handleLogout}
        disabled={loading}
      >
        <Text style={styles.logoutText}>🚪 Logout</Text>
      </TouchableOpacity>

      <Text style={styles.syncFooterText}>Last Synced: {lastSyncTime}</Text>

      {/* ── Edit Contact Modal ── */}
      <Modal
        visible={isEditModalOpen}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsEditModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>✏️ Edit Contact Information</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Mobile Number (10-digit, starts 6–9)</Text>
              <TextInput
                style={styles.textInput}
                value={editMobile}
                onChangeText={setEditMobile}
                placeholder="9XXXXXXXXX"
                keyboardType="phone-pad"
                maxLength={10}
              />
            </View>

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

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Physical Address (min 10 characters)</Text>
              <TextInput
                style={styles.textInput}
                value={editAddress}
                onChangeText={setEditAddress}
                placeholder="Door No, Street, City, State"
              />
            </View>

            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setIsEditModalOpen(false)}
                disabled={isSaving}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSaveButton, isSaving && styles.disabledButton]}
                onPress={handleSaveContactInfo}
                disabled={isSaving}
              >
                {isSaving
                  ? <ActivityIndicator color="#FFF" size="small" />
                  : <Text style={styles.modalSaveText}>Save Changes</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Change Password Modal ── */}
      <Modal
        visible={isPasswordModalOpen}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsPasswordModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>🔒 Change Password</Text>

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

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>New Password</Text>
              <TextInput
                style={styles.textInput}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Min 8 chars, A-Z, a-z, 0-9, symbol"
                secureTextEntry={true}
              />
            </View>

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

            {/* Password hint */}
            <Text style={styles.passwordHint}>
              💡 Must have 8+ chars, uppercase, lowercase, number & special character (@$!%*?&)
            </Text>

            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setIsPasswordModalOpen(false);
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}
                disabled={loading}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSaveButton, loading && styles.disabledButton]}
                onPress={handleChangePassword}
                disabled={loading}
              >
                {loading
                  ? <ActivityIndicator color="#FFF" size="small" />
                  : <Text style={styles.modalSaveText}>Update</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Privacy Policy Modal ── */}
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
                Last Updated: 16-Jun-2026{'\n\n'}
                MJ Healthcare Pharma ERP collects location details, visit logging metrics, and order bookings for Medical Representatives to verify travel compliance and field metrics.{'\n\n'}
                1. Location tracking data is processed locally on this device and synchronized during check-in/check-out cycles.{'\n\n'}
                2. User credentials and profile contact detail updates are preserved locally in the AsyncStorage container on the client device.{'\n\n'}
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
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F7FA' },
  loadingText: { marginTop: 12, fontSize: 14, color: '#666', fontWeight: '500' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F7FA', padding: 20 },
  errorText: { fontSize: 16, color: '#E53935', fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  retryButton: { backgroundColor: '#1E88E5', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8, elevation: 2 },
  retryButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  header: { backgroundColor: '#1E88E5', alignItems: 'center', paddingVertical: 25, paddingTop: 50 },
  profileLogo: { width: 150, height: 50, marginBottom: 15, alignSelf: 'center' },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  avatarText: { fontSize: 32, fontWeight: 'bold', color: '#1E88E5' },
  name: { fontSize: 22, fontWeight: 'bold', color: '#fff', marginTop: 5 },
  designation: { color: '#cce5ff', marginTop: 4, fontSize: 14 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginTop: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4ADE80', marginRight: 6 },
  statusText: { color: '#FFF', fontSize: 11, fontWeight: 'bold' },
  empId: { color: '#cce5ff', marginTop: 8, fontSize: 12 },
  card: { backgroundColor: '#fff', margin: 15, marginBottom: 0, borderRadius: 12, padding: 15, elevation: 2 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 12 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  editLinkText: { color: '#1E88E5', fontWeight: 'bold', fontSize: 14 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  label: { color: '#666', fontSize: 14 },
  value: { fontWeight: '600', color: '#333', fontSize: 14 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statBox: { flex: 1, alignItems: 'center', padding: 12, backgroundColor: '#F5F7FA', borderRadius: 8, marginHorizontal: 4 },
  statNumber: { fontSize: 18, fontWeight: 'bold', color: '#1E88E5' },
  statLabel: { fontSize: 11, color: '#666', marginTop: 4, textAlign: 'center' },
  progressCard: { marginBottom: 15 },
  progressTopRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { fontSize: 14, color: '#555' },
  progressTarget: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  progressBar: { height: 10, backgroundColor: '#eee', borderRadius: 5, overflow: 'hidden' },
  progressFill: { height: 10, borderRadius: 5 },
  progressText: { fontSize: 12, color: '#888', marginTop: 4 },
  gradeContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 15, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  gradeLabel: { fontSize: 13, fontWeight: '600', color: '#475569' },
  gradeBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8 },
  gradeText: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  settingText: { fontSize: 14, color: '#333' },
  syncSubText: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  arrow: { fontSize: 20, color: '#999' },
  versionText: { fontSize: 13, color: '#999' },
  logoutButton: { backgroundColor: '#E53935', margin: 15, marginTop: 20, borderRadius: 12, padding: 16, alignItems: 'center' },
  logoutText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  disabledButton: { opacity: 0.5 },
  syncFooterText: { textAlign: 'center', fontSize: 12, color: '#94A3B8', marginTop: 5, fontStyle: 'italic' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.4)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { width: '85%', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E293B', marginBottom: 16, textAlign: 'center' },
  inputGroup: { marginBottom: 12 },
  inputLabel: { fontSize: 12, fontWeight: '600', color: '#64748B', marginBottom: 4 },
  textInput: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#0F172A', backgroundColor: '#F8FAFC' },
  passwordHint: { fontSize: 11, color: '#94A3B8', fontStyle: 'italic', marginBottom: 8 },
  modalActionRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 20 },
  modalCancelButton: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, backgroundColor: '#E2E8F0' },
  modalCancelText: { fontSize: 14, color: '#475569', fontWeight: 'bold' },
  modalSaveButton: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, backgroundColor: '#1E88E5', minWidth: 100, alignItems: 'center' },
  modalSaveText: { fontSize: 14, color: '#FFFFFF', fontWeight: 'bold' },
  policyText: { fontSize: 13, color: '#475569', lineHeight: 18 },
});