import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
// // REMOVED JSPDF
// // REMOVED JSPDF
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { getMyTeam } from '../services/employeeService';

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const generateCalendarDays = (month: number, year: number) => {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);
  return days;
};

const STORAGE_KEY = '@asm_mr_list';

const ASMMRManagementScreen = () => {
  const navigation = useNavigation<any>();
  const [mrList, setMrList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeam();
  }, []);

  const fetchTeam = async () => {
    try {
      setLoading(true);
      const team = await getMyTeam();
      const formatted = team.map((item: any) => ({
        id: item.id.toString(),
        code: item.employeeCode || '-',
        name: item.name || 'Unknown',
        hq: item.headquarters || '-',
        territory: item.area || '-',
        mobile: item.mobile || '-',
        status: item.status || 'Active',
      }));
      setMrList(formatted);
    } catch (error) {
      console.error('Failed to fetch team:', error);
      Alert.alert('Error', 'Failed to fetch MR list');
    } finally {
      setLoading(false);
    }
  };
  const [searchQuery, setSearchQuery] = useState('');
  
  // Dropdown state
  const [dropdownTarget, setDropdownTarget] = useState<'status' | 'formGender' | 'formAccountStatus' | 'formEmpStatus' | null>(null);
  const [selectedStatus, setSelectedStatus] = useState('All Status');
  
  // Export State
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Add MR Modal state
  const [isAddMRModalOpen, setIsAddMRModalOpen] = useState(false);
  const [editingMRId, setEditingMRId] = useState<string | null>(null);
  
  // View Profile state
  const [viewingMR, setViewingMR] = useState<any>(null);

  // Form State
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('Male');
  const [state, setState] = useState('');
  const [hq, setHq] = useState('');
  const [territory, setTerritory] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [joiningDate, setJoiningDate] = useState('');
  const [accountStatus, setAccountStatus] = useState('Active');
  const [employmentStatus, setEmploymentStatus] = useState('Active');
  const [remarks, setRemarks] = useState('');

  const [errors, setErrors] = useState<any>({});

  // Calendar State
  const [calendarTarget, setCalendarTarget] = useState<'dob' | 'joiningDate' | null>(null);
  const [calMode, setCalMode] = useState<'date'|'month'|'year'>('date');
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());

  const filteredMRs = mrList.filter(mr => {
    const matchesSearch = (mr.name || '').toLowerCase().includes((searchQuery || '').toLowerCase()) || 
                          (mr.code || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
                          mr.mobile.includes(searchQuery);
    const matchesStatus = selectedStatus === 'All Status' || mr.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const getDropdownOptions = () => {
    if (dropdownTarget === 'status') return ['All Status', 'Active', 'Inactive'];
    if (dropdownTarget === 'formGender') return ['Male', 'Female', 'Other'];
    if (dropdownTarget === 'formAccountStatus') return ['Active', 'Inactive'];
    if (dropdownTarget === 'formEmpStatus') return ['Active', 'Inactive'];
    return [];
  };

  const handleSelectDropdown = (val: string) => {
    if (dropdownTarget === 'status') setSelectedStatus(val);
    if (dropdownTarget === 'formGender') { setGender(val); setErrors({...errors, gender: ''}); }
    if (dropdownTarget === 'formAccountStatus') { setAccountStatus(val); setErrors({...errors, accountStatus: ''}); }
    if (dropdownTarget === 'formEmpStatus') { setEmploymentStatus(val); setErrors({...errors, employmentStatus: ''}); }
    setDropdownTarget(null);
  };

  const openCalendar = (target: 'dob' | 'joiningDate') => {
    setCalendarTarget(target);
    setCalMode('date');
    const existingDate = target === 'dob' ? dob : joiningDate;
    if (existingDate) {
      const parts = existingDate.split('-');
      if (parts.length === 3) {
        setCalMonth(parseInt(parts[1]) - 1);
        setCalYear(parseInt(parts[2]));
      }
    } else {
      setCalMonth(new Date().getMonth());
      setCalYear(new Date().getFullYear());
    }
  };

  const handleSelectDate = (day: number) => {
    const formatted = `${String(day).padStart(2, '0')}-${String(calMonth + 1).padStart(2, '0')}-${calYear}`;
    if (calendarTarget === 'dob') { setDob(formatted); setErrors({...errors, dob: ''}); }
    if (calendarTarget === 'joiningDate') { setJoiningDate(formatted); setErrors({...errors, joiningDate: ''}); }
    setCalendarTarget(null);
  };

  const handleExportCSV = async () => {
    setShowExportMenu(false);
    if (filteredMRs.length === 0) return Alert.alert('No Data', 'There is no data to export.');
    
    const header = 'MR CODE,MR NAME,HQ,TERRITORY,MOBILE,STATUS\n';
    const rows = filteredMRs.map(item => `${item.code},${item.name},${item.hq},${item.territory},${item.mobile},${item.status}`).join('\n');
    const csvContent = header + rows;

    if (Platform.OS === 'web') {
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', 'MR_Management_Export.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      await Share.share({ message: csvContent, title: 'MR_Management_Export.csv' });
    }
  };

  const handleExportPDF = async () => {
    setShowExportMenu(false);
    if (filteredMRs.length === 0) return Alert.alert('No Data', 'There is no data to export.');

    try {
      if (Platform.OS === 'web') {
        const doc = new jsPDF();
        doc.text("MR Management Report", 14, 15);
        autoTable(doc, {
          head: [["CODE", "NAME", "HQ", "TERRITORY", "MOBILE", "STATUS"]],
          body: filteredMRs.map(item => [item.code, item.name, item.hq, item.territory, item.mobile, item.status]),
          startY: 20,
        });
        doc.save('MR_Management_Export.pdf');
      } else {
        const htmlContent = `
          <html>
            <head>
              <style>
                body { font-family: Helvetica, sans-serif; padding: 20px; }
                h1 { text-align: center; color: #0F172A; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #E2E8F0; padding: 10px; text-align: left; font-size: 12px; }
                th { background-color: #F8FAFC; color: #475569; }
              </style>
            </head>
            <body>
              <h1>MR Management Report</h1>
              <table>
                <tr><th>CODE</th><th>NAME</th><th>HQ</th><th>TERRITORY</th><th>MOBILE</th><th>STATUS</th></tr>
                ${filteredMRs.map(item => `
                  <tr><td>${item.code}</td><td>${item.name}</td><td>${item.hq}</td><td>${item.territory}</td><td>${item.mobile}</td><td>${item.status}</td></tr>
                `).join('')}
              </table>
            </body>
          </html>
        `;
        const { uri } = await Print.printToFileAsync({ html: htmlContent });
        await Sharing.shareAsync(uri);
      }
    } catch (error: any) {
      console.log('PDF Export Error', error);
      Alert.alert('Export Failed', 'An error occurred while generating PDF.');
    }
  };

  const handleSubmitMR = () => {
    let newErrors: any = {};
    if (!fullName) newErrors.fullName = 'Full Name is required';
    if (!mobile) newErrors.mobile = 'Mobile Number is required';
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) newErrors.email = 'Email Address is required';
    else if (!emailRegex.test(email)) newErrors.email = 'Please enter a valid email';
    
    if (!dob) newErrors.dob = 'Date of Birth is required';
    if (!state) newErrors.state = 'State is required';
    if (!hq) newErrors.hq = 'Headquarters (HQ) is required';
    if (!password) newErrors.password = 'Password is required';
    if (!confirmPassword) newErrors.confirmPassword = 'Confirm Password is required';
    else if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    if (!joiningDate) newErrors.joiningDate = 'Joining Date is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
    } else {
      let updatedList = [];
      if (editingMRId) {
        // Edit existing MR
        updatedList = mrList.map(mr => 
          mr.id === editingMRId ? {
            ...mr,
            name: fullName,
            hq: hq,
            territory: territory || '-',
            mobile: mobile,
            status: accountStatus,
            email, dob, gender, state, password, joiningDate, employmentStatus, remarks
          } : mr
        );
        Alert.alert('✅ Success', 'MR has been updated successfully.');
      } else {
        // Create new MR
        const newMR = {
          id: Math.random().toString(),
          code: `EMP-MR-00${mrList.length + 1}`,
          name: fullName,
          hq: hq,
          territory: territory || '-',
          mobile: mobile,
          status: accountStatus,
          email, dob, gender, state, password, joiningDate, employmentStatus, remarks
        };
        updatedList = [...mrList, newMR];
        Alert.alert('✅ Success', 'New MR has been created successfully.');
      }
      
      setMrList(updatedList);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList)).catch(e => console.log('Error saving MR', e));
      
      setErrors({});
      setIsAddMRModalOpen(false);
      setEditingMRId(null);
    }
  };

  const cancelAddMR = () => {
    setErrors({});
    setIsAddMRModalOpen(false);
    setEditingMRId(null);
  };

  const handleOpenAddMR = () => {
    setEditingMRId(null);
    setFullName('');
    setMobile('');
    setEmail('');
    setDob('');
    setGender('Male');
    setState('');
    setHq('');
    setTerritory('');
    setPassword('');
    setConfirmPassword('');
    setJoiningDate('');
    setAccountStatus('Active');
    setEmploymentStatus('Active');
    setRemarks('');
    setErrors({});
    setIsAddMRModalOpen(true);
  };

  const handleEditClick = (mr: any) => {
    setEditingMRId(mr.id);
    setFullName(mr.name || '');
    setMobile(mr.mobile || '');
    setEmail(mr.email || '');
    setDob(mr.dob || '');
    setGender(mr.gender || 'Male');
    setState(mr.state || '');
    setHq(mr.hq !== '-' ? mr.hq : '');
    setTerritory(mr.territory !== '-' ? mr.territory : '');
    setPassword(mr.password || '');
    setConfirmPassword(mr.password || '');
    setJoiningDate(mr.joiningDate || '');
    setAccountStatus(mr.status || 'Active');
    setEmploymentStatus(mr.employmentStatus || 'Active');
    setRemarks(mr.remarks || '');
    setErrors({});
    setIsAddMRModalOpen(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      
      {/* ── Header Section ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#0F172A" />
          </TouchableOpacity>
          <View>
            <Text style={styles.title}>MR Management</Text>
            <Text style={styles.subtitle}>Manage MR profiles and monitor performance.</Text>
          </View>
        </View>
      </View>

      {/* ── Filters & Search ── */}
      <View style={styles.filtersContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color="#94A3B8" style={{ marginRight: 8 }} />
          <TextInput
            style={[styles.searchInput, Platform.OS === 'web' && { outlineStyle: 'none' } as any]}
            placeholder="Search by name, code, HQ, mobile..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ position: 'relative', zIndex: 10 }}>
            <TouchableOpacity 
              style={styles.dropdownBtn}
              onPress={() => setDropdownTarget('status')}
            >
              <Text style={styles.dropdownBtnText}>{selectedStatus}</Text>
              <Ionicons name="chevron-down" size={16} color="#64748B" />
            </TouchableOpacity>
          </View>
          
          <View style={{ position: 'relative', zIndex: 10 }}>
            <TouchableOpacity style={styles.exportBtn} onPress={() => setShowExportMenu(!showExportMenu)}>
              <Ionicons name="download-outline" size={16} color="#475569" />
              <Text style={styles.exportBtnText}>Export</Text>
              <Ionicons name="chevron-down" size={14} color="#475569" />
            </TouchableOpacity>
            
            {showExportMenu && (
              <View style={styles.exportDropdown}>
                <TouchableOpacity style={styles.dropdownOptionBtn} onPress={handleExportCSV}>
                  <Ionicons name="document-text-outline" size={16} color="#334155" />
                  <Text style={styles.dropdownOptionText}>Export as CSV</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.dropdownOptionBtn} onPress={handleExportPDF}>
                  <Ionicons name="document-outline" size={16} color="#334155" />
                  <Text style={styles.dropdownOptionText}>Export as PDF</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <TouchableOpacity style={styles.addBtn} onPress={handleOpenAddMR}>
            <Ionicons name="add" size={18} color="#FFF" />
            <Text style={styles.addBtnText}>Add MR</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Data Table ── */}
      <ScrollView style={styles.tableContainer} horizontal showsHorizontalScrollIndicator={false}>
        <View>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.columnHeader, { width: 140 }]}>MR CODE</Text>
            <Text style={[styles.columnHeader, { width: 180 }]}>MR NAME</Text>
            <Text style={[styles.columnHeader, { width: 100 }]}>HQ</Text>
            <Text style={[styles.columnHeader, { width: 140 }]}>TERRITORY</Text>
            <Text style={[styles.columnHeader, { width: 160 }]}>MOBILE</Text>
            <Text style={[styles.columnHeader, { width: 120 }]}>STATUS</Text>
            <Text style={[styles.columnHeader, { width: 100, textAlign: 'center' }]}>ACTION</Text>
          </View>

          {/* Table Body */}
          <ScrollView showsVerticalScrollIndicator={false}>
            {loading ? (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#4F46E5" />
                <Text style={{ marginTop: 10, color: '#64748B' }}>Loading Team...</Text>
              </View>
            ) : (
              <>
                {filteredMRs.map((item, index) => (
                  <View key={item.id} style={[styles.tableRow, index === filteredMRs.length - 1 && { borderBottomWidth: 0 }]}>
                    <Text style={[styles.cellText, styles.cellCode, { width: 140 }]}>{item.code}</Text>
                    <Text style={[styles.cellText, styles.cellName, { width: 180 }]}>{item.name}</Text>
                    <Text style={[styles.cellText, { width: 100 }]}>{item.hq}</Text>
                    <Text style={[styles.cellText, { width: 140 }]}>{item.territory}</Text>
                    <Text style={[styles.cellText, { width: 160 }]}>{item.mobile}</Text>
                    
                    <View style={{ width: 120 }}>
                      <View style={[styles.statusBadge, item.status === 'Active' ? styles.statusActive : styles.statusInactive]}>
                        <Text style={[styles.statusText, item.status === 'Active' ? styles.statusActiveText : styles.statusInactiveText]}>
                          {item.status}
                        </Text>
                      </View>
                    </View>

                    <View style={[styles.actionCell, { width: 100 }]}>
                      <TouchableOpacity style={styles.actionIcon} onPress={() => setViewingMR(item)}>
                        <Ionicons name="eye-outline" size={18} color="#94A3B8" />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.actionIcon} onPress={() => handleEditClick(item)}>
                        <Ionicons name="pencil-outline" size={17} color="#94A3B8" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
                
                {filteredMRs.length === 0 && (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyStateText}>No MRs found matching your search.</Text>
                  </View>
                )}
              </>
            )}
          </ScrollView>
        </View>
      </ScrollView>

      {/* ── Outer Status Dropdown Modal ── */}
      <Modal visible={dropdownTarget === 'status'} transparent animationType="fade">
        <TouchableOpacity style={[styles.modalOverlay, { backgroundColor: 'transparent' }]} activeOpacity={1} onPress={() => setDropdownTarget(null)}>
          <View style={[
            styles.dropdownModalCard, 
            { position: 'absolute', paddingVertical: 8, elevation: 5, shadowOpacity: 0.1, shadowRadius: 10 },
            { top: 220, left: 16, width: 200 }
          ]}>
            <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
              {getDropdownOptions().map((opt) => (
                <TouchableOpacity 
                  key={opt} 
                  style={{ paddingVertical: 10, paddingHorizontal: 16, backgroundColor: '#FFF' }} 
                  onPress={() => handleSelectDropdown(opt)}
                >
                  <Text style={{ fontSize: 13, color: '#334155' }}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── View MR Profile Panel ── */}
      {viewingMR && (
        <View style={[StyleSheet.absoluteFill, { flexDirection: 'row', zIndex: 2000, justifyContent: 'flex-end' }]}>
          <TouchableOpacity style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)' }]} activeOpacity={1} onPress={() => setViewingMR(null)} />
          <View style={styles.profilePanel}>
            <View style={styles.profilePanelHeader}>
              <Text style={styles.profilePanelTitle}>Medical Representative Profile</Text>
              <TouchableOpacity onPress={() => setViewingMR(null)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1, padding: 20 }} showsVerticalScrollIndicator={false}>
              <View style={styles.profileCard}>
                <View style={styles.profileAvatar}>
                  <Text style={styles.profileAvatarText}>{viewingMR.name.charAt(0).toUpperCase()}</Text>
                </View>
                <View>
                  <Text style={styles.profileName}>{viewingMR.name}</Text>
                  <Text style={styles.profileCode}>{viewingMR.code}</Text>
                  <View style={[styles.statusBadge, viewingMR.status === 'Active' ? styles.statusActive : styles.statusInactive, { marginTop: 6 }]}>
                    <Text style={[styles.statusText, viewingMR.status === 'Active' ? styles.statusActiveText : styles.statusInactiveText]}>{viewingMR.status}</Text>
                  </View>
                </View>
              </View>

              <Text style={styles.profileSectionTitle}>1. PERSONAL INFORMATION</Text>
              <View style={styles.profileField}>
                <Text style={styles.profileFieldLabel}>EMAIL ADDRESS</Text>
                <Text style={styles.profileFieldValue}>{viewingMR.email || '-'}</Text>
              </View>
              <View style={styles.profileField}>
                <Text style={styles.profileFieldLabel}>MOBILE NUMBER</Text>
                <Text style={styles.profileFieldValue}>{viewingMR.mobile || '-'}</Text>
              </View>
              <View style={styles.profileField}>
                <Text style={styles.profileFieldLabel}>GENDER</Text>
                <Text style={styles.profileFieldValue}>{viewingMR.gender || '-'}</Text>
              </View>
              <View style={styles.profileField}>
                <Text style={styles.profileFieldLabel}>DATE OF BIRTH</Text>
                <Text style={styles.profileFieldValue}>{viewingMR.dob || '-'}</Text>
              </View>
              <View style={styles.profileField}>
                <Text style={styles.profileFieldLabel}>JOINING DATE</Text>
                <Text style={styles.profileFieldValue}>{viewingMR.joiningDate || '-'}</Text>
              </View>

              <Text style={styles.profileSectionTitle}>2. ORGANIZATION INFORMATION</Text>
              <View style={styles.profileField}>
                <Text style={styles.profileFieldLabel}>REPORTING ASM</Text>
                <Text style={styles.profileFieldValue}>Current ASM User</Text>
              </View>
              <View style={styles.profileField}>
                <Text style={styles.profileFieldLabel}>STATE</Text>
                <Text style={styles.profileFieldValue}>{viewingMR.state || '-'}</Text>
              </View>
              <View style={styles.profileField}>
                <Text style={styles.profileFieldLabel}>HEADQUARTERS</Text>
                <Text style={styles.profileFieldValue}>{viewingMR.hq || '-'}</Text>
              </View>
              <View style={styles.profileField}>
                <Text style={styles.profileFieldLabel}>TERRITORY</Text>
                <Text style={styles.profileFieldValue}>{viewingMR.territory || '-'}</Text>
              </View>

              <Text style={styles.profileSectionTitle}>3. ACCOUNT INFORMATION</Text>
              <View style={styles.profileField}>
                <Text style={styles.profileFieldLabel}>LOGIN EMAIL</Text>
                <Text style={styles.profileFieldValue}>{viewingMR.email || '-'}</Text>
              </View>
              <View style={styles.profileField}>
                <Text style={styles.profileFieldLabel}>ACCOUNT STATUS</Text>
                <Text style={styles.profileFieldValue}>{viewingMR.status || '-'}</Text>
              </View>
              <View style={styles.profileField}>
                <Text style={styles.profileFieldLabel}>EMPLOYMENT STATUS</Text>
                <Text style={styles.profileFieldValue}>{viewingMR.employmentStatus || '-'}</Text>
              </View>
              <View style={{ height: 40 }} />
            </ScrollView>

            <View style={styles.profilePanelFooter}>
              <TouchableOpacity style={styles.profileCloseBtn} onPress={() => setViewingMR(null)}>
                <Text style={styles.profileCloseBtnText}>Close Profile</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* ── Add New MR Modal ── */}
      <Modal visible={isAddMRModalOpen} transparent={true} animationType="fade">
        <View style={styles.modalBackdrop}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, justifyContent: 'center', alignItems: 'center', width: '100%' }}>
            <View style={styles.addMrModalContainer}>
              {/* Modal Header */}
              <View style={styles.addMrHeader}>
                <Text style={styles.addMrTitle}>{editingMRId ? 'Edit MR' : 'Add New MR'}</Text>
                <TouchableOpacity onPress={cancelAddMR}>
                  <Ionicons name="close" size={24} color="#64748B" />
                </TouchableOpacity>
              </View>

              {/* Modal Form Scroll */}
              <ScrollView style={styles.addMrScroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
                
                {/* 1. BASIC INFORMATION */}
                <View style={styles.formSection}>
                  <Text style={styles.sectionTitle}>1. BASIC INFORMATION</Text>
                  
                  <View style={styles.formRow}>
                    <View style={styles.inputWrapper}>
                      <Text style={styles.inputLabel}>Employee Code</Text>
                      <TextInput style={[styles.formInput, styles.inputDisabled]} value="MR003" editable={false} />
                    </View>
                    <View style={styles.inputWrapper}>
                      <Text style={styles.inputLabel}>Full Name *</Text>
                      <TextInput 
                        style={[styles.formInput, errors.fullName && styles.formInputError]} 
                        value={fullName}
                        onChangeText={setFullName}
                      />
                      {errors.fullName && <Text style={styles.errorText}>{errors.fullName}</Text>}
                    </View>
                  </View>

                  <View style={styles.formRow}>
                    <View style={styles.inputWrapper}>
                      <Text style={styles.inputLabel}>Mobile Number *</Text>
                      <TextInput 
                        style={[styles.formInput, errors.mobile && styles.formInputError]} 
                        keyboardType="phone-pad" 
                        maxLength={10}
                        value={mobile}
                        onChangeText={setMobile}
                      />
                      {errors.mobile && <Text style={styles.errorText}>{errors.mobile}</Text>}
                    </View>
                    <View style={styles.inputWrapper}>
                      <Text style={styles.inputLabel}>Email Address *</Text>
                      <TextInput 
                        style={[styles.formInput, errors.email && styles.formInputError]} 
                        keyboardType="email-address" 
                        value={email}
                        onChangeText={setEmail}
                      />
                      {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
                    </View>
                  </View>

                  <View style={styles.formRow}>
                    <View style={styles.inputWrapper}>
                      <Text style={styles.inputLabel}>Gender *</Text>
                      <TouchableOpacity style={[styles.dropdownInput, errors.gender && styles.formInputError]} onPress={() => setDropdownTarget('formGender')}>
                        <Text style={styles.dropdownInputText}>{gender}</Text>
                        <Ionicons name="chevron-down" size={16} color="#64748B" />
                      </TouchableOpacity>
                      {errors.gender && <Text style={styles.errorText}>{errors.gender}</Text>}
                    </View>
                    <View style={styles.inputWrapper}>
                      <Text style={styles.inputLabel}>Date of Birth *</Text>
                      <TouchableOpacity style={[styles.iconInput, errors.dob && styles.formInputError]} onPress={() => openCalendar('dob')}>
                        <TextInput 
                          style={styles.formInputNoBorder} 
                          placeholder="dd-mm-yyyy" 
                          placeholderTextColor="#94A3B8"
                          value={dob}
                          editable={false}
                        />
                        <Ionicons name="calendar-outline" size={18} color="#64748B" />
                      </TouchableOpacity>
                      {errors.dob && <Text style={styles.errorText}>{errors.dob}</Text>}
                    </View>
                  </View>

                  <View style={styles.formRow}>
                    <View style={styles.inputWrapper}>
                      <Text style={styles.inputLabel}>Designation</Text>
                      <TextInput style={[styles.formInput, styles.inputDisabled]} value="Medical Representative" editable={false} />
                    </View>
                    <View style={styles.inputWrapper}>
                      <Text style={styles.inputLabel}>Reporting ASM</Text>
                      <TextInput style={[styles.formInput, styles.inputDisabled]} value="Current ASM User" editable={false} />
                    </View>
                  </View>
                </View>

                {/* 2. TERRITORY INFORMATION */}
                <View style={styles.formSection}>
                  <Text style={styles.sectionTitle}>2. TERRITORY INFORMATION</Text>
                  
                  <View style={styles.formRow}>
                    <View style={styles.inputWrapper}>
                      <Text style={styles.inputLabel}>State *</Text>
                      <TextInput 
                        style={[styles.formInput, errors.state && styles.formInputError]} 
                        placeholder="E.g. Maharashtra" 
                        placeholderTextColor="#94A3B8"
                        value={state}
                        onChangeText={setState}
                      />
                      {errors.state && <Text style={styles.errorText}>{errors.state}</Text>}
                    </View>
                    <View style={styles.inputWrapper}>
                      <Text style={styles.inputLabel}>Headquarters (HQ) *</Text>
                      <TextInput 
                        style={[styles.formInput, errors.hq && styles.formInputError]} 
                        value={hq}
                        onChangeText={setHq}
                      />
                      {errors.hq && <Text style={styles.errorText}>{errors.hq}</Text>}
                    </View>
                  </View>

                  <View style={styles.formRow}>
                    <View style={styles.inputWrapper}>
                      <Text style={styles.inputLabel}>Territory / Area</Text>
                      <TextInput 
                        style={styles.formInput} 
                        value={territory}
                        onChangeText={setTerritory}
                      />
                    </View>
                    <View style={styles.inputWrapper} />
                  </View>
                </View>

                {/* 3. LOGIN CREDENTIALS */}
                <View style={styles.formSection}>
                  <Text style={styles.sectionTitle}>3. LOGIN CREDENTIALS</Text>
                  
                  <View style={styles.formRow}>
                    <View style={styles.inputWrapper}>
                      <Text style={styles.inputLabel}>Email Address (Login ID)</Text>
                      <TextInput 
                        style={[styles.formInput, errors.email && styles.formInputError]} 
                        placeholder="Enter email address" 
                        placeholderTextColor="#94A3B8"
                        keyboardType="email-address"
                        value={email}
                        onChangeText={setEmail}
                      />
                    </View>
                    <View style={styles.inputWrapper}>
                      <Text style={styles.inputLabel}>Account Status</Text>
                      <TouchableOpacity style={[styles.dropdownInput, errors.accountStatus && styles.formInputError]} onPress={() => setDropdownTarget('formAccountStatus')}>
                        <Text style={styles.dropdownInputText}>{accountStatus}</Text>
                        <Ionicons name="chevron-down" size={16} color="#64748B" />
                      </TouchableOpacity>
                      {errors.accountStatus && <Text style={styles.errorText}>{errors.accountStatus}</Text>}
                    </View>
                  </View>

                  <View style={styles.formRow}>
                    <View style={styles.inputWrapper}>
                      <Text style={styles.inputLabel}>Password *</Text>
                      <TextInput 
                        style={[styles.formInput, errors.password && styles.formInputError]} 
                        secureTextEntry 
                        value={password}
                        onChangeText={setPassword}
                      />
                      {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
                    </View>
                    <View style={styles.inputWrapper}>
                      <Text style={styles.inputLabel}>Confirm Password *</Text>
                      <TextInput 
                        style={[styles.formInput, errors.confirmPassword && styles.formInputError]} 
                        secureTextEntry 
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                      />
                      {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
                    </View>
                  </View>
                </View>

                {/* 4. EMPLOYMENT INFORMATION */}
                <View style={styles.formSection}>
                  <Text style={styles.sectionTitle}>4. EMPLOYMENT INFORMATION</Text>
                  
                  <View style={styles.formRow}>
                    <View style={styles.inputWrapper}>
                      <Text style={styles.inputLabel}>Joining Date *</Text>
                      <TouchableOpacity style={[styles.iconInput, errors.joiningDate && styles.formInputError]} onPress={() => openCalendar('joiningDate')}>
                        <TextInput 
                          style={styles.formInputNoBorder} 
                          placeholder="dd-mm-yyyy" 
                          placeholderTextColor="#94A3B8"
                          value={joiningDate}
                          editable={false}
                        />
                        <Ionicons name="calendar-outline" size={18} color="#64748B" />
                      </TouchableOpacity>
                      {errors.joiningDate && <Text style={styles.errorText}>{errors.joiningDate}</Text>}
                    </View>
                    <View style={styles.inputWrapper}>
                      <Text style={styles.inputLabel}>Employment Status</Text>
                      <TouchableOpacity style={[styles.dropdownInput, errors.employmentStatus && styles.formInputError]} onPress={() => setDropdownTarget('formEmpStatus')}>
                        <Text style={styles.dropdownInputText}>{employmentStatus}</Text>
                        <Ionicons name="chevron-down" size={16} color="#64748B" />
                      </TouchableOpacity>
                      {errors.employmentStatus && <Text style={styles.errorText}>{errors.employmentStatus}</Text>}
                    </View>
                  </View>
                </View>

                {/* 5. OPTIONAL INFORMATION */}
                <View style={styles.formSection}>
                  <Text style={styles.sectionTitle}>5. OPTIONAL INFORMATION</Text>
                  
                  <View style={styles.formRow}>
                    <View style={[styles.inputWrapper, { flex: 1 }]}>
                      <Text style={styles.inputLabel}>Remarks</Text>
                      <TextInput 
                        style={[styles.formInput, { height: 80, textAlignVertical: 'top' }]} 
                        multiline 
                        placeholder="Add any additional notes here..."
                        placeholderTextColor="#94A3B8"
                        value={remarks}
                        onChangeText={setRemarks}
                      />
                    </View>
                  </View>
                </View>

              </ScrollView>

              {/* Modal Footer */}
              <View style={styles.addMrFooter}>
                <TouchableOpacity style={styles.modalCancelBtn} onPress={cancelAddMR}>
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalSubmitBtn} onPress={handleSubmitMR}>
                  <Text style={styles.modalSubmitText}>{editingMRId ? 'Update MR' : 'Create MR'}</Text>
                </TouchableOpacity>
              </View>

              {/* ── Form Dropdown Overlay ── */}
              {dropdownTarget !== null && dropdownTarget !== 'status' && (
                <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.1)', zIndex: 1000 }]}>
                  <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setDropdownTarget(null)} />
                  <View style={[
                    styles.dropdownModalCard, 
                    { position: 'absolute', top: 200, alignSelf: 'center', width: 220, paddingVertical: 8, zIndex: 1001 }
                  ]}>
                    <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
                      {getDropdownOptions().map((opt) => (
                        <TouchableOpacity 
                          key={opt} 
                          style={{ paddingVertical: 12, paddingHorizontal: 16, backgroundColor: '#FFF' }} 
                          onPress={() => handleSelectDropdown(opt)}
                        >
                          <Text style={{ fontSize: 14, color: '#334155' }}>{opt}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </View>
              )}

              {/* ── Form Calendar Overlay ── */}
              {calendarTarget !== null && (
                <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.1)', zIndex: 1000, justifyContent: 'center', alignItems: 'center' }]}>
                  <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setCalendarTarget(null)} />
                  <View style={styles.calModalCard}>
                    <View style={styles.calModalHeader}>
                      <TouchableOpacity onPress={() => {
                        if (calMode === 'year') setCalYear(calYear - 10);
                        else if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1); }
                        else { setCalMonth(calMonth - 1); }
                      }} style={{ padding: 8 }}>
                        <Ionicons name="chevron-back" size={18} color="#0F172A" />
                      </TouchableOpacity>
                      
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        <TouchableOpacity onPress={() => setCalMode(calMode === 'month' ? 'date' : 'month')}>
                          <Text style={[styles.calModalTitle, calMode === 'month' && { color: '#1E3A8A' }]}>{MONTH_NAMES[calMonth]}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setCalMode(calMode === 'year' ? 'date' : 'year')}>
                          <Text style={[styles.calModalTitle, calMode === 'year' && { color: '#1E3A8A' }]}>{calYear}</Text>
                        </TouchableOpacity>
                      </View>

                      <TouchableOpacity onPress={() => {
                        if (calMode === 'year') setCalYear(calYear + 10);
                        else if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1); }
                        else { setCalMonth(calMonth + 1); }
                      }} style={{ padding: 8 }}>
                        <Ionicons name="chevron-forward" size={18} color="#0F172A" />
                      </TouchableOpacity>
                    </View>
                    
                    {calMode === 'date' && (
                      <>
                        <View style={styles.calWeekRow}>
                          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                            <Text key={day} style={styles.calWeekText}>{day}</Text>
                          ))}
                        </View>
                        <View style={styles.calDaysGrid}>
                          {generateCalendarDays(calMonth, calYear).map((day, idx) => (
                            <TouchableOpacity 
                              key={idx} 
                              style={styles.calDayBox} 
                              onPress={() => day && handleSelectDate(day)}
                              disabled={!day}
                            >
                              <Text style={[styles.calDayText, !day && { color: 'transparent' }]}>{day || 1}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </>
                    )}

                    {calMode === 'month' && (
                      <View style={styles.calMonthGrid}>
                        {MONTH_NAMES.map((m, idx) => (
                          <TouchableOpacity key={m} style={calMonth === idx ? [styles.calMonthBox, { backgroundColor: '#1E3A8A' }] : styles.calMonthBox} onPress={() => { setCalMonth(idx); setCalMode('date'); }}>
                            <Text style={calMonth === idx ? { color: '#FFF', fontSize: 12 } : styles.calMonthText}>{m.substring(0, 3)}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}

                    {calMode === 'year' && (
                      <ScrollView style={{ maxHeight: 200 }} showsVerticalScrollIndicator={false}>
                        <View style={styles.calMonthGrid}>
                          {Array.from({ length: 100 }).map((_, i) => {
                            const y = new Date().getFullYear() - 80 + i;
                            return (
                              <TouchableOpacity key={y} style={calYear === y ? [styles.calMonthBox, { backgroundColor: '#1E3A8A' }] : styles.calMonthBox} onPress={() => { setCalYear(y); setCalMode('date'); }}>
                                <Text style={calYear === y ? { color: '#FFF', fontSize: 12 } : styles.calMonthText}>{y}</Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </ScrollView>
                    )}

                    <TouchableOpacity style={styles.btnSolidPrimary} onPress={() => setCalendarTarget(null)}>
                      <Text style={styles.btnSolidPrimaryText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

export default ASMMRManagementScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    alignItems: Platform.OS === 'web' ? 'center' : 'flex-start',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  backBtn: {
    padding: 6,
    marginRight: 12,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    marginTop: 2,
  },
  title: { fontSize: 22, fontWeight: 'bold', color: '#0F172A', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#64748B' },
  
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  exportBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  exportDropdown: {
    position: 'absolute',
    top: 48,
    right: 0,
    backgroundColor: '#FFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    width: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    zIndex: 50,
  },
  dropdownOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 8,
  },
  dropdownOptionText: {
    fontSize: 13,
    color: '#334155',
  },

  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E3A8A', 
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  addBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },

  filtersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 16,
    flexWrap: 'wrap',
    zIndex: 50,
  },
  searchBox: {
    flex: 1,
    minWidth: 200,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 38,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
  },
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 38,
    width: 120,
  },
  dropdownBtnText: { fontSize: 13, color: '#334155', fontWeight: '500' },

  tableContainer: {
    flex: 1,
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  columnHeader: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  cellText: {
    fontSize: 14,
    color: '#334155',
  },
  cellCode: {
    color: '#4F46E5', 
    fontWeight: '500',
  },
  cellName: {
    fontWeight: '600',
    color: '#0F172A',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusActive: { backgroundColor: '#DCFCE7' }, 
  statusInactive: { backgroundColor: '#FEE2E2' },
  statusText: { fontSize: 12, fontWeight: 'bold' },
  statusActiveText: { color: '#15803D' }, 
  statusInactiveText: { color: '#B91C1C' },
  actionCell: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  actionIcon: {
    padding: 4,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    color: '#94A3B8',
    fontSize: 15,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownModalCard: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },

  // Calendar Styles
  calModalCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12, // Reduced padding for shorter calendar
    width: 280, // Reduced width for mobile
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    zIndex: 1001,
  },
  calModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  calModalTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#334155',
  },
  calWeekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  calWeekText: {
    width: 35,
    textAlign: 'center',
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  calDaysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calDayBox: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calDayText: {
    fontSize: 14,
    color: '#0F172A',
  },
  calMonthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  calMonthBox: {
    width: '30%',
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  calMonthText: {
    fontSize: 13,
    color: '#334155',
  },
  btnSolidPrimary: {
    backgroundColor: '#1E3A8A',
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    paddingVertical: 10,
  },
  btnSolidPrimaryText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },

  // Add MR Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)', 
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  addMrModalContainer: {
    width: '100%',
    maxWidth: 800,
    maxHeight: '90%',
    flexShrink: 1, 
    backgroundColor: '#FFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  addMrHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  addMrTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  addMrScroll: {
    padding: 20,
  },
  formSection: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#334155',
    marginBottom: 16,
  },
  formRow: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    gap: 16,
    marginBottom: 16,
  },
  inputWrapper: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    color: '#475569',
    marginBottom: 6,
    fontWeight: '500',
  },
  formInput: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#0F172A',
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {} as any),
  },
  formInputError: {
    borderColor: '#DC2626',
    borderWidth: 1,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 11,
    marginTop: 4,
    fontWeight: '500',
  },
  inputDisabled: {
    backgroundColor: '#F1F5F9',
    color: '#64748B',
  },
  iconInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    paddingHorizontal: 12,
  },
  formInputNoBorder: {
    flex: 1,
    paddingVertical: 8,
    fontSize: 14,
    color: '#0F172A',
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {} as any),
  },
  dropdownInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dropdownInputText: {
    fontSize: 14,
    color: '#0F172A',
  },
  addMrFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#FFF',
    gap: 12,
  },
  modalCancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFF',
  },
  modalCancelText: {
    color: '#475569',
    fontWeight: '600',
    fontSize: 13,
  },
  modalSubmitBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#1E3A8A',
  },
  modalSubmitText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 13,
  },

  // View Profile Styles
  profilePanel: {
    width: '85%',
    maxWidth: 420,
    backgroundColor: '#FFF',
    height: '100%',
    shadowColor: '#000',
    shadowOffset: { width: -5, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 15,
  },
  profilePanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  profilePanelTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 24,
    gap: 16,
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileAvatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E3A8A',
  },
  profileName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 2,
  },
  profileCode: {
    fontSize: 13,
    color: '#64748B',
  },
  profileSectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#334155',
    marginTop: 20,
    marginBottom: 16,
  },
  profileField: {
    marginBottom: 16,
  },
  profileFieldLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  profileFieldValue: {
    fontSize: 14,
    color: '#0F172A',
  },
  profilePanelFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#FFF',
  },
  profileCloseBtn: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  profileCloseBtnText: {
    color: '#334155',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
