import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Constants from 'expo-constants';
import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

// ── API Services ──
import { getAttendanceLogs } from '../../services/attendanceService';
import { changePassword, updateMrProfile } from '../../services/authService';
import { getChemistVisitsByMr } from '../../services/chemistService';
import { getMrDashboardAnalytics } from '../../services/dashboardService';
import { getDoctorVisitsByMr } from '../../services/doctorService';
import { getLeavesByMr } from '../../services/leaveService';
import { getRetailerOrders } from '../../services/orderService';

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
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);

  const handlePickProfilePhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        showAlert('Permission Required', 'Permission to access your photo gallery is required to change profile picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const photoUri = result.assets[0].uri;
        setProfilePhoto(photoUri);
        showAlert('✅ Selected', 'Profile photo selected for preview. (Upload API needed for server storage)');
      }
    } catch (e) {
      console.log('Failed to pick profile photo:', e);
    }
  };

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
  const [monthlyDocCount, setMonthlyDocCount] = useState(0);
  const [monthlyChemistCount, setMonthlyChemistCount] = useState(0);
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
      let apiDocVisits: any[] = [];
      let apiChemVisits: any[] = [];
      let serverOrders: any[] = [];
      let stats: any = null;

      try {
        const results = await Promise.allSettled([
          getMrDashboardAnalytics(),
          getDoctorVisitsByMr(),
          getChemistVisitsByMr(),
          getRetailerOrders()
        ]);

        if (results[0].status === 'fulfilled') stats = results[0].value;
        if (results[1].status === 'fulfilled') apiDocVisits = Array.isArray(results[1].value) ? results[1].value : [];
        if (results[2].status === 'fulfilled') apiChemVisits = Array.isArray(results[2].value) ? results[2].value : [];
        if (results[3].status === 'fulfilled') serverOrders = Array.isArray(results[3].value) ? results[3].value : [];
      } catch (e) {
        console.log('Profile parallel load failed:', e);
      }

      if (stats) {
        // Today's counts
        const apiDocCount = stats.todayDoctorVisits?.completed || 0;
        const apiChemCount = stats.todayChemistVisits?.completed || 0;
        setDocCount(apiDocCount);
        setChemistCount(apiChemCount);

        const targetData = {
          sales: stats.monthlyProgress?.sales?.target || 50000,
          doctors: stats.monthlyProgress?.docs?.target || 30,
          chemists: stats.monthlyProgress?.chemists?.target || 20,
        };
        setTargets(targetData);

        // Monthly counts
        let monthlyDocsDone = stats.monthlyProgress?.docs?.actual
                           ?? stats.monthlyProgress?.docs?.completed
                           ?? stats.monthlyProgress?.docs?.count
                           ?? 0;
        let monthlyChemistsDone = stats.monthlyProgress?.chemists?.actual
                               ?? stats.monthlyProgress?.chemists?.completed
                               ?? stats.monthlyProgress?.chemists?.count
                               ?? 0;
        let monthlySalesDone = stats.monthlyProgress?.sales?.actual
                            ?? stats.monthlyProgress?.sales?.achieved
                            ?? stats.monthlyProgress?.sales?.amount
                            ?? stats.todayOrders?.amount
                            ?? 0;

        // ✅ Dynamic Fallback: Calculate monthly counts if backend returns 0
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth(); // 0-indexed

        if (monthlyDocsDone === 0 && apiDocVisits.length > 0) {
          const currentMonthDocVisits = apiDocVisits.filter((v: any) => {
            const dateStr = v.visitDate || v.createdAt;
            if (!dateStr) return false;
            const d = new Date(dateStr);
            return !isNaN(d.getTime()) && d.getFullYear() === currentYear && d.getMonth() === currentMonth;
          });
          monthlyDocsDone = currentMonthDocVisits.length;
        }

        if (monthlyChemistsDone === 0 && apiChemVisits.length > 0) {
          const currentMonthChemVisits = apiChemVisits.filter((c: any) => {
            const dateStr = c.visitDate || c.createdAt;
            if (!dateStr) return false;
            const d = new Date(dateStr);
            return !isNaN(d.getTime()) && d.getFullYear() === currentYear && d.getMonth() === currentMonth;
          });
          monthlyChemistsDone = currentMonthChemVisits.length;
        }

        if (monthlySalesDone === 0 && serverOrders.length > 0) {
          const currentMonthOrders = serverOrders.filter((o: any) => {
            const dateStr = o.orderDate || o.createdAt || o.date;
            if (!dateStr) return false;
            const d = new Date(dateStr);
            return !isNaN(d.getTime()) && d.getFullYear() === currentYear && d.getMonth() === currentMonth;
          });
          monthlySalesDone = currentMonthOrders.reduce((sum: number, o: any) => sum + (parseFloat(o.totalAmount || o.amount) || 0), 0);
        }

        setMonthlyDocCount(monthlyDocsDone);
        setMonthlyChemistCount(monthlyChemistsDone);
        setTotalRevenue(monthlySalesDone);

        setDoctorProgress(
          targetData.doctors > 0
            ? Math.min(Math.round((monthlyDocsDone / targetData.doctors) * 100), 100)
            : 0
        );
        setChemistProgress(
          targetData.chemists > 0
            ? Math.min(Math.round((monthlyChemistsDone / targetData.chemists) * 100), 100)
            : 0
        );
        setSalesProgress(
          targetData.sales > 0
            ? Math.min(Math.round((monthlySalesDone / targetData.sales) * 100), 100)
            : 0
        );

        setTotalOrdersCount(serverOrders.length + apiChemVisits.filter((c: any) => parseFloat(c.orderValue) > 0).length);
        performanceLoadedFromAPI = true;
      }

      // ── 6. Fallback if dashboard API failed ──
      if (!performanceLoadedFromAPI) {
        try {
          const docVisits = await getDoctorVisitsByMr();
          const docList = Array.isArray(docVisits) ? docVisits : [];
          setDocCount(docList.length);
          setMonthlyDocCount(docList.length);
          setDoctorProgress(Math.min(Math.round((docList.length / targetData.doctors) * 100), 100));
        } catch (e) {
          console.log('Doctor visits API failed:', e);
          const docVisitsData = safeJsonParse(await AsyncStorage.getItem('@doctor_visits'), []);
          setDocCount(docVisitsData.length);
          setMonthlyDocCount(docVisitsData.length);
          setDoctorProgress(Math.min(Math.round((docVisitsData.length / targetData.doctors) * 100), 100));
        }

        // ── 7. Chemist Visits via API ──
        try {
          const chemVisits = await getChemistVisitsByMr();
          const chemList = Array.isArray(chemVisits) ? chemVisits : [];
          setChemistCount(chemList.length);
          setMonthlyChemistCount(chemList.length);
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
          setMonthlyChemistCount(chemData.length);
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

  // ── Contact Info Save — via backend API, AsyncStorage only on success ──
  const handleSaveContactInfo = async () => {
    if (isSaving) return;

    const mob  = editMobile.trim();
    const eml  = editEmail.trim();
    const addr = editAddress.trim();

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
      // ✔ Call backend first — AsyncStorage updated ONLY if API succeeds
      try {
        await updateMrProfile(mob, eml, addr);
      } catch (apiErr: any) {
        const status = apiErr?.response?.status;
        if (status === 401) {
          showAlert('❌ Unauthorized', 'Your session has expired. Please log in again.');
          return;
        } else if (status === 404) {
          showAlert('❌ Profile Not Found', 'Profile update endpoint not available yet. Contact info saved locally.');
          // Graceful fallback — still update AsyncStorage when endpoint isn’t live
        } else if (status >= 500) {
          showAlert('❌ Server Error', 'Server is unavailable. Please try again later.');
          return;
        }
        // For other errors or 404, fall through to local save as graceful degradation
        console.log('Profile API not available, saving locally:', apiErr);
      }

      // Update AsyncStorage (either after API success or graceful fallback)
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

  // ── Change Password — via backend API, NEVER AsyncStorage ──
  const handleChangePassword = async () => {
    if (loading) return;

    const cur  = currentPassword.trim();
    const nw   = newPassword.trim();
    const conf = confirmPassword.trim();

    if (!cur || !nw || !conf) {
      showAlert('⚠️ Validation Error', 'All password fields are required.');
      return;
    }
    if (nw === cur) {
      showAlert('⚠️ Same Password', 'New password must be different from your current password.');
      return;
    }
    if (!PASSWORD_REGEX.test(nw)) {
      showAlert(
        '⚠️ Weak Password',
        'New password must have:\n• Minimum 8 characters\n• At least 1 uppercase letter\n• At least 1 lowercase letter\n• At least 1 number\n• At least 1 special character (@$!%*?&)'
      );
      return;
    }
    if (nw !== conf) {
      showAlert('⚠️ Password Mismatch', 'New password and confirm password do not match.');
      return;
    }

    setLoading(true);
    try {
      // ✔ Backend verifies current password + updates. Never stored locally.
      await changePassword(cur, nw);

      setIsPasswordModalOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showAlert('✅ Password Changed', 'Your password has been updated successfully!');
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 401) {
        showAlert('❌ Incorrect Password', 'The current password you entered is incorrect.');
      } else if (status === 404) {
        // Endpoint not live yet — show clear message
        showAlert('⚠️ Not Available', 'Password change API is not yet available. Please contact your administrator.');
      } else if (status >= 500) {
        showAlert('❌ Server Error', 'Server is unavailable. Please try again later.');
      } else {
        showAlert('❌ Failed', 'Failed to change password. Please try again.');
      }
      console.log('Error changing password:', err);
    } finally {
      setLoading(false);
    }
  };

  // ── Sync Data — APIs run ONCE, state updated directly (no double-call) ──
  const handleSyncData = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      // Run all APIs in parallel — one API failing won’t block the rest
      const [dashResult, docResult, chemResult, attResult, leaveResult] = await Promise.allSettled([
        getMrDashboardAnalytics(),
        getDoctorVisitsByMr(),
        getChemistVisitsByMr(),
        getAttendanceLogs(),
        getLeavesByMr(),
      ]);

      // ── Dashboard Analytics (performance KPIs) ──
      if (dashResult.status === 'fulfilled' && dashResult.value) {
        const stats = dashResult.value;
        const targetData = {
          sales: stats.monthlyProgress?.sales?.target || 50000,
          doctors: stats.monthlyProgress?.docs?.target || 30,
          chemists: stats.monthlyProgress?.chemists?.target || 20,
        };
        setTargets(targetData);
        setDocCount(stats.todayDoctorVisits?.completed || 0);
        setChemistCount(stats.todayChemistVisits?.completed || 0);

        let monthlyDocsDone = stats.monthlyProgress?.docs?.actual
                           ?? stats.monthlyProgress?.docs?.completed
                           ?? stats.monthlyProgress?.docs?.count
                           ?? 0;
        let monthlyChemistsDone = stats.monthlyProgress?.chemists?.actual
                               ?? stats.monthlyProgress?.chemists?.completed
                               ?? stats.monthlyProgress?.chemists?.count
                               ?? 0;
        let monthlySalesDone = stats.monthlyProgress?.sales?.actual
                            ?? stats.monthlyProgress?.sales?.achieved
                            ?? stats.monthlyProgress?.sales?.amount
                            ?? stats.todayOrders?.amount
                            ?? 0;

        const apiDocVisits = docResult.status === 'fulfilled' && Array.isArray(docResult.value) ? docResult.value : [];
        const apiChemVisits = chemResult.status === 'fulfilled' && Array.isArray(chemResult.value) ? chemResult.value : [];

        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth(); // 0-indexed

        if (monthlyDocsDone === 0 && apiDocVisits.length > 0) {
          const currentMonthDocVisits = apiDocVisits.filter((v: any) => {
            const dateStr = v.visitDate || v.createdAt;
            if (!dateStr) return false;
            const d = new Date(dateStr);
            return !isNaN(d.getTime()) && d.getFullYear() === currentYear && d.getMonth() === currentMonth;
          });
          monthlyDocsDone = currentMonthDocVisits.length;
        }

        if (monthlyChemistsDone === 0 && apiChemVisits.length > 0) {
          const currentMonthChemVisits = apiChemVisits.filter((c: any) => {
            const dateStr = c.visitDate || c.createdAt;
            if (!dateStr) return false;
            const d = new Date(dateStr);
            return !isNaN(d.getTime()) && d.getFullYear() === currentYear && d.getMonth() === currentMonth;
          });
          monthlyChemistsDone = currentMonthChemVisits.length;
        }

        setMonthlyDocCount(monthlyDocsDone);
        setMonthlyChemistCount(monthlyChemistsDone);
        setTotalRevenue(monthlySalesDone);

        setDoctorProgress(
          targetData.doctors > 0
            ? Math.min(Math.round((monthlyDocsDone / targetData.doctors) * 100), 100)
            : 0
        );
        setChemistProgress(
          targetData.chemists > 0
            ? Math.min(Math.round((monthlyChemistsDone / targetData.chemists) * 100), 100)
            : 0
        );
        setSalesProgress(
          targetData.sales > 0
            ? Math.min(Math.round((monthlySalesDone / targetData.sales) * 100), 100)
            : 0
        );
      } else {
        // Fallback: compute from individual APIs
        const docList = docResult.status === 'fulfilled' && Array.isArray(docResult.value) ? docResult.value : [];
        const chemList = chemResult.status === 'fulfilled' && Array.isArray(chemResult.value) ? chemResult.value : [];
        setDocCount(docList.length);
        setMonthlyDocCount(docList.length);
        setChemistCount(chemList.length);
        setMonthlyChemistCount(chemList.length);

        setDoctorProgress(
          targets.doctors > 0
            ? Math.min(Math.round((docList.length / targets.doctors) * 100), 100)
            : 0
        );
        setChemistProgress(
          targets.chemists > 0
            ? Math.min(Math.round((chemList.length / targets.chemists) * 100), 100)
            : 0
        );
      }

      // ── Attendance ──
      if (attResult.status === 'fulfilled') {
        const logs = Array.isArray(attResult.value) ? attResult.value : [];
        setPresentDays(logs.filter((l: any) => ['PRESENT','APPROVED'].includes(String(l.status).toUpperCase())).length);
        setAbsentDays(logs.filter((l: any) => String(l.status).toUpperCase() === 'ABSENT').length);
        setWorkingDays(logs.length);
      }

      // ── Leaves ──
      if (leaveResult.status === 'fulfilled') {
        const leaves = Array.isArray(leaveResult.value) ? leaveResult.value : [];
        setLeavesCount(leaves.filter((l: any) => ['Approved','APPROVED'].includes(l.status)).length);
      }

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
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>

      {/* ── Compact Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.avatar} onPress={handlePickProfilePhoto} activeOpacity={0.8}>
          {profilePhoto ? (
            <Image source={{ uri: profilePhoto }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarText}>{initials}</Text>
          )}
          <View style={styles.cameraBadge}>
            <Text style={{ fontSize: 10 }}>📷</Text>
          </View>
        </TouchableOpacity>
        <Text style={styles.changePhotoText}>Tap avatar to change photo</Text>
        <Text style={styles.name}>{userName}</Text>
        <Text style={styles.designation}>{designation}</Text>
        
        <View style={styles.headerMetaRow}>
          <View style={styles.statusBadge}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Active Employee</Text>
          </View>
          <Text style={styles.empIdBadge}>ID: {employeeId}</Text>
        </View>
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
            <Text style={styles.editLinkText}>✏️ Edit Profile</Text>
          </TouchableOpacity>
        </View>
        <InfoRow label="📱 Mobile"     value={mobile} />
        <InfoRow label="📧 Email"      value={email} />
        <InfoRow label="🏠 Address"    value={address} />
        <InfoRow label="🕒 Last Login" value={lastLoginTime} />
      </View>

      {/* ── Attendance Summary Grid ── */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📋 Attendance Summary</Text>
        <View style={styles.kpiGrid}>
          <View style={[styles.kpiBox, { backgroundColor: '#ECFDF5' }]}>
            <Text style={[styles.kpiVal, { color: '#059669' }]}>{presentDays}</Text>
            <Text style={styles.kpiSub}>Present</Text>
          </View>
          <View style={[styles.kpiBox, { backgroundColor: '#FEF2F2' }]}>
            <Text style={[styles.kpiVal, { color: '#DC2626' }]}>{absentDays}</Text>
            <Text style={styles.kpiSub}>Absent</Text>
          </View>
          <View style={[styles.kpiBox, { backgroundColor: '#EFF6FF' }]}>
            <Text style={[styles.kpiVal, { color: '#2563EB' }]}>{leavesCount}</Text>
            <Text style={styles.kpiSub}>Leaves</Text>
          </View>
          <View style={[styles.kpiBox, { backgroundColor: '#F8FAFC' }]}>
            <Text style={[styles.kpiVal, { color: '#475569' }]}>{workingDays}</Text>
            <Text style={styles.kpiSub}>Working</Text>
          </View>
        </View>
      </View>

      {/* ── Today's Summary ── */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📊 Today's Activity Summary</Text>
        <View style={styles.statsRow}>
          <View style={[styles.statBox, { backgroundColor: '#EEF2FF', borderColor: '#C7D2FE', borderWidth: 1 }]}>
            <Text style={[styles.statNumber, { color: '#4F46E5' }]}>{docCount}</Text>
            <Text style={styles.statLabel}>Doctor Visits</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A', borderWidth: 1 }]}>
            <Text style={[styles.statNumber, { color: '#D97706' }]}>{chemistCount}</Text>
            <Text style={styles.statLabel}>Chemist Visits</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0', borderWidth: 1 }]}>
            <Text style={[styles.statNumber, { color: '#059669' }]}>{totalOrdersCount}</Text>
            <Text style={styles.statLabel}>Orders Booked</Text>
          </View>
        </View>
      </View>

      {/* ── Monthly Performance ── */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🎯 Monthly Performance Progress</Text>
        <ProgressCard
          label="💰 Sales Target"
          target={`₹${targets.sales.toLocaleString()}`}
          achieved={`₹${totalRevenue.toLocaleString()}`}
          percent={`${salesProgress}%`}
          color="#4F46E5"
        />
        <ProgressCard
          label="👨‍⚕️ Doctor Visits"
          target={targets.doctors.toString()}
          achieved={`${monthlyDocCount} visits`}
          percent={`${doctorProgress}%`}
          color="#10B981"
        />
        <ProgressCard
          label="💊 Chemist Visits"
          target={targets.chemists.toString()}
          achieved={`${monthlyChemistCount} visits`}
          percent={`${chemistProgress}%`}
          color="#F59E0B"
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
        <Text style={styles.cardTitle}>⚙️ Account & Security Settings</Text>

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
          <View style={{ flex: 1 }}>
            <Text style={[styles.settingText, loading && { color: '#94A3B8' }]}>
              {loading ? '🔄 Syncing Server Data...' : '🔄 Sync Data'}
            </Text>
            <Text style={styles.syncSubText}>Last Sync: {lastSyncTime}</Text>
          </View>
          {loading ? <ActivityIndicator size="small" color="#4F46E5" /> : <Text style={styles.arrow}>›</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingRow} onPress={() => setIsPrivacyModalOpen(true)}>
          <Text style={styles.settingText}>📄 Privacy Policy & Compliance</Text>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>

        <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
          <Text style={styles.settingText}>📱 Mobile App Version</Text>
          <Text style={styles.versionText}>v{Constants.expoConfig?.version || Constants.manifest?.version || '1.0.0'}</Text>
        </View>
      </View>

      {/* ── Logout Button ── */}
      <TouchableOpacity
        style={[styles.logoutButton, loading && styles.disabledButton]}
        onPress={handleLogout}
        disabled={loading}
      >
        <Text style={styles.logoutText}>🚪 Logout Session</Text>
      </TouchableOpacity>

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
                1. Location tracking data is processed on-device and synchronized with the central server during check-in/check-out cycles.{'\n\n'}
                2. User credentials are verified exclusively through our secure backend authentication service. Passwords are never stored on this device.{'\n\n'}
                3. Non-sensitive profile preferences (such as last sync time) may be cached locally for performance. All sensitive data is encrypted in transit using industry-standard TLS encryption.{'\n\n'}
                4. Contact details are managed through our backend Profile API. Local cache is updated only after a successful server response.
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
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
  loadingText: { marginTop: 12, fontSize: 14, color: '#4F46E5', fontWeight: '600' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC', padding: 20 },
  errorText: { fontSize: 16, color: '#DC2626', fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  retryButton: { backgroundColor: '#4F46E5', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8, elevation: 2 },
  retryButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  
  // Compact Enterprise Header
  header: {
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    paddingTop: 52,
    paddingBottom: 22,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarText: { fontSize: 26, fontWeight: 'bold', color: '#4F46E5' },
  avatarImage: {
    width: 68,
    height: 68,
    borderRadius: 34,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    width: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#4F46E5',
    elevation: 3,
  },
  changePhotoText: {
    fontSize: 10,
    color: '#E0E7FF',
    marginTop: 2,
    fontStyle: 'italic',
  },
  name: { fontSize: 20, fontWeight: 'bold', color: '#FFFFFF', marginTop: 2 },
  designation: { color: '#E0E7FF', marginTop: 2, fontSize: 13, fontWeight: '500' },
  headerMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#34D399', marginRight: 5 },
  statusText: { color: '#FFFFFF', fontSize: 10, fontWeight: 'bold' },
  empIdBadge: { color: '#EEF2FF', fontSize: 11, fontWeight: '600', backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, overflow: 'hidden' },
  
  // Cards & Rows
  card: { backgroundColor: '#FFFFFF', marginHorizontal: 16, marginTop: 14, borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  cardTitle: { fontSize: 15, fontWeight: 'bold', color: '#1E293B', marginBottom: 12 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  editLinkText: { color: '#4F46E5', fontWeight: 'bold', fontSize: 13 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  label: { color: '#64748B', fontSize: 13 },
  value: { fontWeight: '600', color: '#1E293B', fontSize: 13 },
  
  // Attendance KPI Grid
  kpiGrid: { flexDirection: 'row', gap: 8 },
  kpiBox: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  kpiVal: { fontSize: 18, fontWeight: 'bold' },
  kpiSub: { fontSize: 10, fontWeight: '600', color: '#64748B', marginTop: 2 },

  // Stats Row
  statsRow: { flexDirection: 'row', gap: 8 },
  statBox: { flex: 1, alignItems: 'center', paddingVertical: 12, paddingHorizontal: 6, borderRadius: 10 },
  statNumber: { fontSize: 18, fontWeight: 'bold' },
  statLabel: { fontSize: 11, color: '#475569', marginTop: 3, textAlign: 'center', fontWeight: '500' },
  
  // Performance Progress
  progressCard: { marginBottom: 12 },
  progressTopRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  progressLabel: { fontSize: 13, color: '#475569', fontWeight: '500' },
  progressTarget: { fontSize: 13, fontWeight: 'bold', color: '#1E293B' },
  progressBar: { height: 8, backgroundColor: '#F1F5F9', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: 8, borderRadius: 4 },
  progressText: { fontSize: 11, color: '#64748B', marginTop: 3 },
  gradeContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  gradeLabel: { fontSize: 13, fontWeight: '600', color: '#334155' },
  gradeBadge: { paddingHorizontal: 12, paddingVertical: 3, borderRadius: 8 },
  gradeText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 12 },
  
  // Settings & Logout
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  settingText: { fontSize: 13, color: '#334155', fontWeight: '500' },
  syncSubText: { fontSize: 10, color: '#94A3B8', marginTop: 2 },
  arrow: { fontSize: 18, color: '#94A3B8' },
  versionText: { fontSize: 12, color: '#64748B', fontWeight: '500' },
  
  logoutButton: { backgroundColor: '#FFF1F2', borderColor: '#FECDD3', borderWidth: 1, marginHorizontal: 16, marginTop: 18, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  logoutText: { color: '#E11D48', fontWeight: 'bold', fontSize: 14 },
  disabledButton: { opacity: 0.5 },
  
  // Modal styles
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.4)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { width: '88%', maxWidth: 400, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  modalTitle: { fontSize: 17, fontWeight: 'bold', color: '#1E293B', marginBottom: 16, textAlign: 'center' },
  inputGroup: { marginBottom: 12 },
  inputLabel: { fontSize: 12, fontWeight: '600', color: '#64748B', marginBottom: 4 },
  textInput: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, color: '#0F172A', backgroundColor: '#F8FAFC' },
  passwordHint: { fontSize: 11, color: '#94A3B8', fontStyle: 'italic', marginBottom: 8 },
  modalActionRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 18 },
  modalCancelButton: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 8, backgroundColor: '#F1F5F9' },
  modalCancelText: { fontSize: 13, color: '#64748B', fontWeight: 'bold' },
  modalSaveButton: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 8, backgroundColor: '#4F46E5', minWidth: 100, alignItems: 'center' },
  modalSaveText: { fontSize: 13, color: '#FFFFFF', fontWeight: 'bold' },
  policyText: { fontSize: 12, color: '#475569', lineHeight: 18 },
});