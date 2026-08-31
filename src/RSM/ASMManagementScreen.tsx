import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
  useWindowDimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getMyTeam } from '../services/employeeService';

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const generateCalendarDays = (month: number, year: number) => {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = Array(firstDay).fill(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);
  return days;
};

// Expanded Dummy data 
const INITIAL_ASM_DATA = [
  { 
    id: '1', code: 'ASM012', name: 'Vikas Sharma', state: 'Maharashtra', hq: 'Pune', status: 'Active',
    mobile: '9876543210', email: 'vikas.sharma@pharmaerp.com', gender: 'Male', dob: '15-08-1985', 
    designation: 'Area Sales Manager', reportingRsm: 'Amitabh Verma (Regional Sales Manager)', 
    territory: 'Pune West', password: 'password123', confirmPassword: 'password123', 
    joiningDate: '10-01-2020', employmentStatus: 'Active', remarks: 'Excellent performer.' 
  },
  { 
    id: '2', code: 'ASM015', name: 'Amit Desai', state: 'Gujarat', hq: 'Ahmedabad', status: 'Active',
    mobile: '9123456789', email: 'amit.desai@pharmaerp.com', gender: 'Male', dob: '22-11-1988', 
    designation: 'Area Sales Manager', reportingRsm: 'Amitabh Verma (Regional Sales Manager)', 
    territory: 'Ahmedabad Central', password: 'password123', confirmPassword: 'password123', 
    joiningDate: '05-06-2021', employmentStatus: 'Active', remarks: '' 
  },
  { 
    id: '3', code: 'ASM018', name: 'Kiran Rao', state: 'Maharashtra', hq: 'Mumbai', status: 'Inactive',
    mobile: '9988776655', email: 'kiran.rao@pharmaerp.com', gender: 'Female', dob: '30-03-1990', 
    designation: 'Area Sales Manager', reportingRsm: 'Amitabh Verma (Regional Sales Manager)', 
    territory: 'Mumbai South', password: 'password123', confirmPassword: 'password123', 
    joiningDate: '12-09-2019', employmentStatus: 'Inactive', remarks: 'On long leave.' 
  },
];

const STATES = [
  'All States',
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
];
const STATUSES = ['All Status', 'Active', 'Inactive'];

const GENDERS = ['Male', 'Female', 'Other'];
const ACCOUNT_STATUSES = ['Active', 'Inactive'];
const EMP_STATUSES = ['Active', 'Inactive'];

const STORAGE_KEY = '@rsm_asm_data';

const ASMManagementScreen = () => {
  const navigation = useNavigation<any>();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const [searchQuery, setSearchQuery] = useState('');
  
  // Table Data State
  const [asmData, setAsmData] = useState<any[]>([]);

  // Modals
  const [isFormModalVisible, setIsFormModalVisible] = useState(false);
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [dropdownTarget, setDropdownTarget] = useState<'state' | 'status' | 'formGender' | 'formAccountStatus' | 'formEmpStatus' | null>(null);
  
  // Calendar State
  const [calendarTarget, setCalendarTarget] = useState<'dob' | 'joining' | null>(null);
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMode, setCalMode] = useState<'date' | 'month' | 'year'>('date');
  
  // Filters
  const [filterState, setFilterState] = useState('All States');
  const [filterStatus, setFilterStatus] = useState('All Status');
  const [viewModalData, setViewModalData] = useState<any>(null);

  const [loading, setLoading] = useState(true);

  // Load Data on Mount
  useEffect(() => {
    fetchTeam();
  }, []);

  const fetchTeam = async () => {
    try {
      setLoading(true);
      const teamData = await getMyTeam();
      
      const mappedData = teamData.map((emp: any) => ({
        id: emp.id?.toString() || Math.random().toString(),
        code: emp.employeeCode || `EMP-${emp.id}`,
        name: emp.user?.name || emp.name || 'Unknown',
        state: emp.state || 'N/A',
        hq: emp.headquarters || 'N/A',
        status: emp.status || 'Active',
        mobile: emp.user?.mobile || emp.mobile || 'N/A',
        email: emp.user?.email || 'N/A',
        gender: emp.gender || 'N/A',
        dob: emp.dob ? new Date(emp.dob).toLocaleDateString() : 'N/A',
        designation: emp.designation || 'Area Sales Manager',
        joiningDate: emp.joiningDate ? new Date(emp.joiningDate).toLocaleDateString() : 'N/A',
        employmentStatus: emp.status || 'Active'
      }));
      setAsmData(mappedData);
    } catch (error) {
      console.error('Failed to load team data', error);
      Alert,
    useWindowDimensions.alert('Error', 'Could not load your ASMs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Form State
  const emptyForm = {
    id: '',
    code: `ASM0${Math.floor(Math.random() * 100) + 20}`,
    name: '',
    mobile: '',
    email: '',
    gender: 'Male',
    dob: '',
    designation: 'Area Sales Manager',
    reportingRsm: 'Amitabh Verma (Regional Sales Manager)',
    state: '',
    hq: '',
    territory: '',
    status: 'Active',
    password: '',
    confirmPassword: '',
    joiningDate: '',
    employmentStatus: 'Active',
    remarks: ''
  };
  const [formData, setFormData] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const getDropdownOptions = () => {
    if (dropdownTarget === 'state') return STATES;
    if (dropdownTarget === 'status') return STATUSES;
    if (dropdownTarget === 'formGender') return GENDERS;
    if (dropdownTarget === 'formAccountStatus') return ACCOUNT_STATUSES;
    if (dropdownTarget === 'formEmpStatus') return EMP_STATUSES;
    return [];
  };

  const handleSelectDropdown = (val: string) => {
    if (dropdownTarget === 'state') setFilterState(val);
    if (dropdownTarget === 'status') setFilterStatus(val);
    if (dropdownTarget === 'formGender') { setFormData({ ...formData, gender: val }); setFormErrors({...formErrors, gender: ''}); }
    if (dropdownTarget === 'formAccountStatus') { setFormData({ ...formData, status: val }); setFormErrors({...formErrors, status: ''}); }
    if (dropdownTarget === 'formEmpStatus') { setFormData({ ...formData, employmentStatus: val }); setFormErrors({...formErrors, employmentStatus: ''}); }
    setDropdownTarget(null);
  };

  const openCalendar = (target: 'dob' | 'joining') => {
    setCalendarTarget(target);
    setCalMode('date');
    const existingDate = target === 'dob' ? formData.dob : formData.joiningDate;
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
    if (calendarTarget === 'dob') { setFormData({ ...formData, dob: formatted }); setFormErrors({...formErrors, dob: ''}); }
    if (calendarTarget === 'joining') { setFormData({ ...formData, joiningDate: formatted }); setFormErrors({...formErrors, joiningDate: ''}); }
    setCalendarTarget(null);
  };

  const handleOpenAddForm = () => {
    setFormMode('add');
    setFormData({...emptyForm, code: `ASM0${Math.floor(Math.random() * 100) + 20}`});
    setFormErrors({});
    setIsFormModalVisible(true);
  };

  const handleOpenEditForm = (item: any) => {
    setFormMode('edit');
    setFormErrors({});
    setFormData({
      id: item.id,
      code: item.code,
      name: item.name,
      mobile: item.mobile || '',
      email: item.email || '',
      gender: item.gender || 'Male',
      dob: item.dob || '',
      designation: item.designation || 'Area Sales Manager',
      reportingRsm: item.reportingRsm || 'Amitabh Verma (Regional Sales Manager)',
      state: item.state || '',
      hq: item.hq || '',
      territory: item.territory || '',
      status: item.status || 'Active',
      password: item.password || '',
      confirmPassword: item.confirmPassword || '',
      joiningDate: item.joiningDate || '',
      employmentStatus: item.employmentStatus || 'Active',
      remarks: item.remarks || ''
    });
    setIsFormModalVisible(true);
  };

  const handleTextChange = (field: string, text: string) => {
    setFormData({ ...formData, [field]: text });
    if (formErrors[field]) {
      setFormErrors({ ...formErrors, [field]: '' });
    }
  };

  const handleSubmitForm = async () => {
    let errors: Record<string, string> = {};

    // Validate Mandatory Fields
    if (!formData.name.trim()) errors.name = 'Full Name is required';
    if (!formData.mobile.trim()) errors.mobile = 'Mobile Number is required';
    else if (formData.mobile.length < 10) errors.mobile = 'Mobile must be 10 digits';
    
    if (!formData.email.trim()) errors.email = 'Email Address is required';
    else if (!formData.email.includes('@') || !formData.email.includes('.com')) errors.email = 'Valid email is required (must contain @ and .com)';

    if (!formData.gender) errors.gender = 'Gender is required';
    if (!formData.dob) errors.dob = 'Date of Birth is required';
    if (!formData.state.trim()) errors.state = 'State is required';
    if (!formData.hq.trim()) errors.hq = 'Headquarters (HQ) is required';
    if (!formData.status) errors.status = 'Account Status is required';
    
    if (!formData.password) errors.password = 'Password is required';
    if (!formData.confirmPassword) errors.confirmPassword = 'Confirm Password is required';
    else if (formData.password !== formData.confirmPassword) errors.confirmPassword = 'Passwords do not match';

    if (!formData.joiningDate) errors.joiningDate = 'Joining Date is required';
    if (!formData.employmentStatus) errors.employmentStatus = 'Employment Status is required';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return; // Stop submission
    }

    let updatedList;
    if (formMode === 'add') {
      const newASM = { ...formData, id: Date.now().toString() };
      updatedList = [newASM, ...asmData];
    } else {
      updatedList = asmData.map(asm => asm.id === formData.id ? { ...formData } : asm);
    }

    setAsmData(updatedList);
    setIsFormModalVisible(false);

    // Save to Local Storage
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
    } catch (e) {
      console.error('Failed to save ASM data', e);
    }
  };

  // Filter Data
  const filteredData = asmData.filter(asm => {
    const matchesState = filterState === 'All States' || asm.state === filterState;
    const matchesStatus = filterStatus === 'All Status' || asm.status === filterStatus;
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = asm.name.toLowerCase().includes(searchLower) || asm.code.toLowerCase().includes(searchLower);
    return matchesState && matchesStatus && matchesSearch;
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Page Title & Add Button */}
        <View style={styles.pageHeaderRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={() => navigation.navigate('RSMDashboard')} style={{ padding: 4, marginRight: 8, backgroundColor: '#F1F5F9', borderRadius: 8 }}>
              <Ionicons name="arrow-back" size={24} color="#0F172A" />
            </TouchableOpacity>
            <View>
              <Text style={styles.pageTitle}>ASM Management</Text>
              <Text style={styles.pageSubtitle}>Manage Area Sales Managers and assign operational details.</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.btnAdd} onPress={handleOpenAddForm}>
            <Ionicons name="add" size={18} color="#FFF" />
            <Text style={styles.btnAddText}>Add ASM</Text>
          </TouchableOpacity>
        </View>

        {/* Filters */}
        <View style={styles.filtersContainer}>
          <TouchableOpacity style={styles.dropdown} onPress={() => setDropdownTarget('state')}>
            <Text style={styles.dropdownText}>{filterState}</Text>
            <Ionicons name="chevron-down" size={16} color="#64748B" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.dropdown} onPress={() => setDropdownTarget('status')}>
            <Text style={styles.dropdownText}>{filterStatus}</Text>
            <Ionicons name="chevron-down" size={16} color="#64748B" />
          </TouchableOpacity>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color="#94A3B8" />
            <TextInput
              style={[styles.searchInput, Platform.OS === 'web' && { outlineStyle: 'none' } as any]}
              placeholder="Search by Emp Code, Name, Mobile, Em"
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#94A3B8"
            />
          </View>
        </View>

        {/* Table */}
        <View style={styles.card}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ minWidth: 800 }}>
              {/* Header */}
              <View style={styles.tableHeader}>
                <Text style={[styles.th, { width: 120 }]}>EMPLOYEE CODE</Text>
                <Text style={[styles.th, { width: 160 }]}>ASM NAME</Text>
                <Text style={[styles.th, { width: 140 }]}>STATE</Text>
                <Text style={[styles.th, { width: 140 }]}>HEADQUARTERS</Text>
                <Text style={[styles.th, { width: 100, textAlign: 'center' }]}>STATUS</Text>
                <Text style={[styles.th, { width: 100, textAlign: 'center' }]}>ACTION</Text>
              </View>

              {/* Rows */}
              {filteredData.map((item, index) => (
                <View key={item.id} style={[styles.tableRow, index === filteredData.length - 1 && { borderBottomWidth: 0 }]}>
                  <Text style={[styles.td, { width: 120, color: '#475569' }]}>{item.code}</Text>
                  <Text style={[styles.td, { width: 160, color: '#1E293B', fontWeight: '500' }]}>{item.name}</Text>
                  <Text style={[styles.td, { width: 140, color: '#475569' }]}>{item.state}</Text>
                  <Text style={[styles.td, { width: 140, color: '#475569' }]}>{item.hq}</Text>
                  
                  <View style={{ width: 100, alignItems: 'center' }}>
                    <View style={[styles.statusPill, item.status === 'Active' ? styles.statusActive : styles.statusInactive]}>
                      <Text style={[styles.statusText, item.status === 'Active' ? styles.statusTextActive : styles.statusTextInactive]}>
                        {item.status}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={{ width: 100, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12 }}>
                    <TouchableOpacity onPress={() => { setViewModalData(item); setIsViewModalVisible(true); }}>
                      <Ionicons name="eye-outline" size={18} color="#94A3B8" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleOpenEditForm(item)}>
                      <Ionicons name="pencil-outline" size={18} color="#94A3B8" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </ScrollView>

      {/* ── Add / Edit ASM Form Modal ── */}
      <Modal visible={isFormModalVisible} animationType="slide" transparent={true}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{formMode === 'add' ? 'Add Area Sales Manager (ASM)' : 'Edit Area Sales Manager (ASM)'}</Text>
              <TouchableOpacity onPress={() => setIsFormModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {/* 1. BASIC INFORMATION */}
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>1. BASIC INFORMATION</Text>
                <View style={[styles.inputRow, { flexDirection: isMobile ? 'column' : 'row' }]}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Employee Code</Text>
                    <TextInput style={[styles.input, { backgroundColor: '#F8FAFC', color: '#64748B' }, Platform.OS === 'web' && { outlineStyle: 'none' } as any]} value={formData.code} editable={false} />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, formErrors.name && styles.labelError]}>Full Name *</Text>
                    <TextInput style={[styles.input, formErrors.name && styles.inputError, Platform.OS === 'web' && { outlineStyle: 'none' } as any]} value={formData.name} onChangeText={(t) => handleTextChange('name', t)} />
                    {formErrors.name && <Text style={styles.errorText}>{formErrors.name}</Text>}
                  </View>
                </View>

                <View style={[styles.inputRow, { flexDirection: isMobile ? 'column' : 'row' }]}>
                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, formErrors.mobile && styles.labelError]}>Mobile Number *</Text>
                    <TextInput style={[styles.input, formErrors.mobile && styles.inputError, Platform.OS === 'web' && { outlineStyle: 'none' } as any]} keyboardType="phone-pad" maxLength={10} value={formData.mobile} onChangeText={(t) => handleTextChange('mobile', t)} />
                    {formErrors.mobile && <Text style={styles.errorText}>{formErrors.mobile}</Text>}
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, formErrors.email && styles.labelError]}>Email Address *</Text>
                    <TextInput 
                      style={[styles.input, formErrors.email && styles.inputError, Platform.OS === 'web' && { outlineStyle: 'none' } as any]} 
                      keyboardType="email-address" 
                      value={formData.email} 
                      onChangeText={(t) => handleTextChange('email', t)} 
                    />
                    {formErrors.email && <Text style={styles.errorText}>{formErrors.email}</Text>}
                  </View>
                </View>

                <View style={[styles.inputRow, { flexDirection: isMobile ? 'column' : 'row' }]}>
                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, formErrors.gender && styles.labelError]}>Gender *</Text>
                    <TouchableOpacity style={[styles.selectInput, formErrors.gender && styles.inputError]} onPress={() => setDropdownTarget('formGender')}>
                      <Text style={styles.selectText}>{formData.gender || 'Select'}</Text>
                      <Ionicons name="chevron-down" size={16} color="#64748B" />
                    </TouchableOpacity>
                    {formErrors.gender && <Text style={styles.errorText}>{formErrors.gender}</Text>}
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, formErrors.dob && styles.labelError]}>Date of Birth *</Text>
                    <TouchableOpacity style={[styles.selectInput, formErrors.dob && styles.inputError]} onPress={() => openCalendar('dob')}>
                      <Text style={styles.selectText}>{formData.dob || 'dd-mm-yyyy'}</Text>
                      <Ionicons name="calendar-outline" size={16} color="#64748B" />
                    </TouchableOpacity>
                    {formErrors.dob && <Text style={styles.errorText}>{formErrors.dob}</Text>}
                  </View>
                </View>

                <View style={[styles.inputRow, { flexDirection: isMobile ? 'column' : 'row' }]}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Designation</Text>
                    <TextInput style={[styles.input, { backgroundColor: '#F8FAFC', color: '#64748B' }, Platform.OS === 'web' && { outlineStyle: 'none' } as any]} value={formData.designation} editable={false} />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Reporting RSM</Text>
                    <TextInput style={[styles.input, { backgroundColor: '#F8FAFC', color: '#64748B' }, Platform.OS === 'web' && { outlineStyle: 'none' } as any]} value={formData.reportingRsm} editable={false} />
                  </View>
                </View>
              </View>

              {/* 2. TERRITORY INFORMATION */}
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>2. TERRITORY INFORMATION</Text>
                <View style={[styles.inputRow, { flexDirection: isMobile ? 'column' : 'row' }]}>
                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, formErrors.state && styles.labelError]}>State *</Text>
                    <TextInput style={[styles.input, formErrors.state && styles.inputError, Platform.OS === 'web' && { outlineStyle: 'none' } as any]} placeholder="State name..." value={formData.state} onChangeText={(t) => handleTextChange('state', t)} />
                    {formErrors.state && <Text style={styles.errorText}>{formErrors.state}</Text>}
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, formErrors.hq && styles.labelError]}>Headquarters (HQ) *</Text>
                    <TextInput style={[styles.input, formErrors.hq && styles.inputError, Platform.OS === 'web' && { outlineStyle: 'none' } as any]} placeholder="HQ..." value={formData.hq} onChangeText={(t) => handleTextChange('hq', t)} />
                    {formErrors.hq && <Text style={styles.errorText}>{formErrors.hq}</Text>}
                  </View>
                </View>
                <View style={[styles.inputRow, { flexDirection: isMobile ? 'column' : 'row' }]}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Territory / Area (Optional)</Text>
                    <TextInput style={[styles.input, Platform.OS === 'web' && { outlineStyle: 'none' } as any]} value={formData.territory} onChangeText={(t) => handleTextChange('territory', t)} />
                  </View>
                  <View style={styles.inputGroup}></View>
                </View>
              </View>

              {/* 3. LOGIN CREDENTIALS */}
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>3. LOGIN CREDENTIALS</Text>
                <View style={[styles.inputRow, { flexDirection: isMobile ? 'column' : 'row' }]}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Email Address (Login ID)</Text>
                    <TextInput style={[styles.input, { backgroundColor: '#F8FAFC', color: '#64748B' }, Platform.OS === 'web' && { outlineStyle: 'none' } as any]} placeholder="Auto-populated from email" value={formData.email} editable={false} />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, formErrors.status && styles.labelError]}>Account Status *</Text>
                    <TouchableOpacity style={[styles.selectInput, formErrors.status && styles.inputError]} onPress={() => setDropdownTarget('formAccountStatus')}>
                      <Text style={styles.selectText}>{formData.status}</Text>
                      <Ionicons name="chevron-down" size={16} color="#64748B" />
                    </TouchableOpacity>
                    {formErrors.status && <Text style={styles.errorText}>{formErrors.status}</Text>}
                  </View>
                </View>
                <View style={[styles.inputRow, { flexDirection: isMobile ? 'column' : 'row' }]}>
                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, formErrors.password && styles.labelError]}>Password *</Text>
                    <TextInput style={[styles.input, formErrors.password && styles.inputError, Platform.OS === 'web' && { outlineStyle: 'none' } as any]} secureTextEntry value={formData.password} onChangeText={(t) => handleTextChange('password', t)} />
                    {formErrors.password && <Text style={styles.errorText}>{formErrors.password}</Text>}
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, formErrors.confirmPassword && styles.labelError]}>Confirm Password *</Text>
                    <TextInput style={[styles.input, formErrors.confirmPassword && styles.inputError, Platform.OS === 'web' && { outlineStyle: 'none' } as any]} secureTextEntry value={formData.confirmPassword} onChangeText={(t) => handleTextChange('confirmPassword', t)} />
                    {formErrors.confirmPassword && <Text style={styles.errorText}>{formErrors.confirmPassword}</Text>}
                  </View>
                </View>
              </View>
              
              {/* 4. EMPLOYMENT INFORMATION */}
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>4. EMPLOYMENT INFORMATION</Text>
                <View style={[styles.inputRow, { flexDirection: isMobile ? 'column' : 'row' }]}>
                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, formErrors.joiningDate && styles.labelError]}>Joining Date *</Text>
                    <TouchableOpacity style={[styles.selectInput, formErrors.joiningDate && styles.inputError]} onPress={() => openCalendar('joining')}>
                      <Text style={styles.selectText}>{formData.joiningDate || 'dd-mm-yyyy'}</Text>
                      <Ionicons name="calendar-outline" size={16} color="#64748B" />
                    </TouchableOpacity>
                    {formErrors.joiningDate && <Text style={styles.errorText}>{formErrors.joiningDate}</Text>}
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, formErrors.employmentStatus && styles.labelError]}>Employment Status *</Text>
                    <TouchableOpacity style={[styles.selectInput, formErrors.employmentStatus && styles.inputError]} onPress={() => setDropdownTarget('formEmpStatus')}>
                      <Text style={styles.selectText}>{formData.employmentStatus}</Text>
                      <Ionicons name="chevron-down" size={16} color="#64748B" />
                    </TouchableOpacity>
                    {formErrors.employmentStatus && <Text style={styles.errorText}>{formErrors.employmentStatus}</Text>}
                  </View>
                </View>
              </View>

              {/* 5. OPTIONAL INFORMATION */}
              <View style={[styles.sectionContainer, { borderBottomWidth: 0, paddingBottom: 0 }]}>
                <Text style={styles.sectionTitle}>5. OPTIONAL INFORMATION</Text>
                <View style={{ marginBottom: 16 }}>
                  <Text style={styles.label}>Remarks</Text>
                  <TextInput 
                    style={[styles.input, { height: 100, textAlignVertical: 'top' }, Platform.OS === 'web' && { outlineStyle: 'none' } as any]} 
                    multiline 
                    numberOfLines={4}
                    value={formData.remarks}
                    onChangeText={(t) => handleTextChange('remarks', t)} 
                  />
                </View>
              </View>

              <View style={{ height: 20 }} />
            </ScrollView>

            {/* Modal Footer Buttons */}
            <View style={styles.modalFooter}>
               <TouchableOpacity style={styles.btnCancel} onPress={() => setIsFormModalVisible(false)}>
                 <Text style={styles.btnCancelText}>Cancel</Text>
               </TouchableOpacity>
               <TouchableOpacity style={styles.btnSubmit} onPress={handleSubmitForm}>
                 <Text style={styles.btnSubmitText}>{formMode === 'add' ? 'Create ASM' : 'Save Changes'}</Text>
               </TouchableOpacity>
            </View>

          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── View ASM Modal (Expanded Details) ── */}
      <Modal visible={isViewModalVisible} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxWidth: 500 }]}>
             <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>ASM Detailed Information</Text>
              <TouchableOpacity onPress={() => setIsViewModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ padding: 20, maxHeight: 600 }}>
               {viewModalData && (
                 <>
                   <Text style={styles.sectionTitle}>BASIC DETAILS</Text>
                   <View style={styles.viewRow}>
                     <View style={styles.viewCol}><Text style={styles.viewLabel}>ASM Name</Text><Text style={styles.viewValue}>{viewModalData.name}</Text></View>
                     <View style={styles.viewCol}><Text style={styles.viewLabel}>Employee Code</Text><Text style={styles.viewValue}>{viewModalData.code}</Text></View>
                   </View>
                   <View style={styles.viewRow}>
                     <View style={styles.viewCol}><Text style={styles.viewLabel}>Mobile Number</Text><Text style={styles.viewValue}>{viewModalData.mobile}</Text></View>
                     <View style={styles.viewCol}><Text style={styles.viewLabel}>Email Address</Text><Text style={styles.viewValue}>{viewModalData.email}</Text></View>
                   </View>
                   <View style={styles.viewRow}>
                     <View style={styles.viewCol}><Text style={styles.viewLabel}>Gender</Text><Text style={styles.viewValue}>{viewModalData.gender}</Text></View>
                     <View style={styles.viewCol}><Text style={styles.viewLabel}>Date of Birth</Text><Text style={styles.viewValue}>{viewModalData.dob}</Text></View>
                   </View>

                   <View style={{ height: 16 }} />
                   <Text style={styles.sectionTitle}>TERRITORY & ROLES</Text>
                   <View style={styles.viewRow}>
                     <View style={styles.viewCol}><Text style={styles.viewLabel}>State</Text><Text style={styles.viewValue}>{viewModalData.state}</Text></View>
                     <View style={styles.viewCol}><Text style={styles.viewLabel}>Headquarters (HQ)</Text><Text style={styles.viewValue}>{viewModalData.hq}</Text></View>
                   </View>
                   <View style={styles.viewRow}>
                     <View style={styles.viewCol}><Text style={styles.viewLabel}>Territory/Area</Text><Text style={styles.viewValue}>{viewModalData.territory || 'Not Assigned'}</Text></View>
                     <View style={styles.viewCol}><Text style={styles.viewLabel}>Designation</Text><Text style={styles.viewValue}>{viewModalData.designation}</Text></View>
                   </View>
                   <View style={styles.viewRow}>
                     <View style={styles.viewCol}><Text style={styles.viewLabel}>Reporting To</Text><Text style={styles.viewValue}>{viewModalData.reportingRsm}</Text></View>
                   </View>

                   <View style={{ height: 16 }} />
                   <Text style={styles.sectionTitle}>EMPLOYMENT</Text>
                   <View style={styles.viewRow}>
                     <View style={styles.viewCol}><Text style={styles.viewLabel}>Joining Date</Text><Text style={styles.viewValue}>{viewModalData.joiningDate}</Text></View>
                     <View style={styles.viewCol}>
                        <Text style={styles.viewLabel}>Status</Text>
                        <View style={[styles.statusPill, { alignSelf: 'flex-start', marginTop: 4 }, viewModalData.employmentStatus === 'Active' ? styles.statusActive : styles.statusInactive]}>
                          <Text style={[styles.statusText, viewModalData.employmentStatus === 'Active' ? styles.statusTextActive : styles.statusTextInactive]}>
                            {viewModalData.employmentStatus}
                          </Text>
                        </View>
                     </View>
                   </View>
                   {viewModalData.remarks ? (
                     <View style={styles.viewRow}>
                       <View style={styles.viewCol}><Text style={styles.viewLabel}>Remarks</Text><Text style={styles.viewValue}>{viewModalData.remarks}</Text></View>
                     </View>
                   ) : null}
                 </>
               )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── Generic Dropdown Modal ── */}
      <Modal visible={dropdownTarget !== null} transparent animationType="fade">
        <TouchableOpacity style={[styles.modalOverlay, { backgroundColor: 'transparent' }]} activeOpacity={1} onPress={() => setDropdownTarget(null)}>
          <View style={[
            styles.dropdownModalCard, 
            { position: 'absolute', paddingVertical: 8, elevation: 5, shadowOpacity: 0.1, shadowRadius: 10 },
            dropdownTarget === 'state' ? { top: 280, left: 16, width: 200 } :
            dropdownTarget === 'status' ? { top: 280, left: 140, width: 180 } :
            { top: 250, alignSelf: 'center', width: 200 } // Safe centered fallback for ALL form dropdowns
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

      {/* ── Custom Calendar Modal ── */}
      <Modal visible={calendarTarget !== null} transparent animationType="fade">
        <View style={styles.modalOverlay}>
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

            <TouchableOpacity style={[styles.btnSolidPrimary, { marginTop: 10, justifyContent: 'center', paddingVertical: 8 }]} onPress={() => setCalendarTarget(null)}>
              <Text style={styles.btnSolidPrimaryText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

export default ASMManagementScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: 16,
    paddingTop: 24, 
  },
  pageHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    flexWrap: 'wrap',
    gap: 12
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  pageSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
  },
  btnAdd: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6
  },
  btnAddText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },
  filtersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minWidth: 140,
    backgroundColor: '#FFF'
  },
  dropdownText: {
    color: '#334155',
    fontSize: 14,
  },
  searchBox: {
    flex: 1,
    minWidth: 200,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FFF'
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    fontSize: 14,
    color: '#334155'
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    marginBottom: 24
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FAFAFA'
  },
  th: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  td: {
    fontSize: 13,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusActive: {
    backgroundColor: '#DCFCE7',
  },
  statusInactive: {
    backgroundColor: '#F1F5F9',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  statusTextActive: {
    color: '#16A34A',
  },
  statusTextInactive: {
    color: '#64748B',
  },
  
  // --- Modal Styles ---
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#FFF',
    width: '100%',
    maxWidth: 600,
    maxHeight: '90%',
    borderRadius: 12,
    overflow: 'hidden',
    flexDirection: 'column'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalScroll: {
    padding: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#FAFAFA',
    gap: 12
  },
  btnCancel: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFF'
  },
  btnCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569'
  },
  btnSubmit: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#1E3A8A'
  },
  btnSubmitText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF'
  },
  sectionContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  inputGroup: {
    flex: 1,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: '#334155',
    marginBottom: 6,
  },
  labelError: {
    color: '#EF4444',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
  },
  inputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 11,
    marginTop: 4,
  },
  selectInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  selectText: {
    fontSize: 14,
    color: '#0F172A',
  },

  // View Modal Styles
  viewRow: { flexDirection: 'row', marginBottom: 16, gap: 16 },
  viewCol: { flex: 1 },
  viewLabel: { fontSize: 12, color: '#64748B', marginBottom: 4 },
  viewValue: { fontSize: 15, color: '#0F172A', fontWeight: '600' },
  
  // Generic Dropdown Modal Styles
  dropdownModalCard: { backgroundColor: '#FFF', width: '100%', maxWidth: 300, borderRadius: 12, overflow: 'hidden' },
  dropdownModalHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  dropdownModalTitle: { fontSize: 16, fontWeight: 'bold', color: '#0F172A' },
  dropdownOptionBtn: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  dropdownOptionText: { fontSize: 15, color: '#334155' },

  // Calendar Modal Styles
  calModalCard: { backgroundColor: '#FFF', width: '90%', maxWidth: 280, borderRadius: 12, overflow: 'hidden', padding: 12 },
  calModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  calModalTitle: { fontSize: 15, fontWeight: 'bold', color: '#0F172A' },
  calWeekRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  calWeekText: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '600', color: '#64748B' },
  calDaysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calDayBox: { width: '14.28%', height: 32, justifyContent: 'center', alignItems: 'center' },
  calDayText: { fontSize: 13, color: '#334155' },
  calMonthGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' },
  calMonthBox: { width: '30%', paddingVertical: 8, alignItems: 'center', borderRadius: 8, backgroundColor: '#F8FAFC' },
  calMonthText: { fontSize: 12, color: '#334155', fontWeight: '500' },
  btnSolidPrimary: { backgroundColor: '#1E3A8A', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8, alignItems: 'center' },
  btnSolidPrimaryText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
});
