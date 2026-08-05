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
  Modal,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getRSMList, saveRSMList, addRSMRecord } from '../services/nsmStorageService';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Delhi', 'Goa', 'Gujarat',
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra',
  'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
];

const STATUS_OPTIONS = ['Active', 'Inactive'];

const getCurrentFormattedDate = () => {
  const date = new Date();
  return `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`;
};

const NSMRSMMonitoringScreen = () => {
  const [activeTab, setActiveTab] = useState<'List' | 'Add'>('List');
  const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [rsmList, setRsmList] = useState<any[]>([]);
  const [selectedRSM, setSelectedRSM] = useState<any>(null);

  // Add / Edit RSM Form State
  const [empCode] = useState('RSM004'); // Usually auto-generated from backend
  const [empName, setEmpName] = useState('');
  const [mobile, setMobile] = useState('');
  const [designation] = useState('Regional Sales Manager');
  const [reportsTo] = useState('Rajesh Sharma (National Sales Head)');

  const [stateTerritory, setStateTerritory] = useState('');
  const [headquarters, setHeadquarters] = useState('');
  const [area, setArea] = useState('');

  const [email, setEmail] = useState('');
  const [accountStatus, setAccountStatus] = useState('Active');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Validation State
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Dropdown Modal State
  const [dropdownTarget, setDropdownTarget] = useState<'state' | 'status' | null>(null);

  useEffect(() => {
    loadRSMs();
  }, []);

  const loadRSMs = async () => {
    const data = await getRSMList();
    if (data && data.length > 0) {
      const enriched = data.map((item: any, i: number) => ({
        ...item,
        empName: item.name || `Employee ${i + 1}`,
        mobile: item.mobile || `+91 98765 4321${i}`,
        email: item.email || `${item.name?.toLowerCase().replace(' ', '.')}@pharmaerp.com`,
        stateTerritory: item.state || (i === 0 ? 'Maharashtra' : i === 1 ? 'Gujarat' : 'Karnataka'),
        hq: item.hq || (i === 0 ? 'Mumbai' : i === 1 ? 'Ahmedabad' : 'Bangalore'),
        status: item.status || 'Active',
        area: item.area || 'Metro Area',
        
        // As requested: professional summary is 0 at start
        salesTarget: item.salesTarget || '₹0',
        salesAchievedPct: item.salesAchievedPct || '0%',
        attendancePct: item.attendancePct || '0%',
        activeASM: item.activeASM || '0',
        
        designation: 'Regional Sales Manager',
        reportsTo: 'Rajesh Sharma (National Sales Head)',
        
        // Creation dates and Audit details mapped to current date if missing
        createdDate: item.createdDate || '10-01-2026',
        lastModified: item.lastModified || '15-01-2026',
        lastLogin: item.lastLogin || 'Never',
        password: item.password || '********'
      }));
      setRsmList(enriched);
    }
  };

  const handleSelectDropdown = (value: string) => {
    if (dropdownTarget === 'state') {
      setStateTerritory(value);
      if (errors.stateTerritory) setErrors({ ...errors, stateTerritory: '' });
    } else if (dropdownTarget === 'status') {
      setAccountStatus(value);
    }
    setDropdownTarget(null);
  };

  const getDropdownOptions = () => {
    if (dropdownTarget === 'state') return INDIAN_STATES;
    if (dropdownTarget === 'status') return STATUS_OPTIONS;
    return [];
  };

  const handleSaveRSM = async () => {
    // Inline Validation
    const newErrors: { [key: string]: string } = {};
    if (!empName.trim()) newErrors.empName = "Employee Name is required";
    
    // Mobile validation: exactly 10 digits
    if (!mobile.trim()) {
      newErrors.mobile = "Mobile Number is required";
    } else if (mobile.length !== 10 || !/^\d+$/.test(mobile)) {
      newErrors.mobile = "Mobile must be exactly 10 digits";
    }

    if (!stateTerritory.trim()) newErrors.stateTerritory = "State is required";
    if (!headquarters.trim()) newErrors.headquarters = "Headquarters is required";
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      newErrors.email = "Email Address is required";
    } else if (!emailRegex.test(email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!password.trim()) newErrors.password = "Password is required";
    if (password.trim() && password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return; // Stop submission
    }
    
    setErrors({});

    const currentDate = getCurrentFormattedDate();

    const newRecord = {
      id: Date.now().toString(),
      code: `RSM00${rsmList.length + 1}`, // Simulate auto-generating code
      name: empName,
      mobile,
      email,
      state: stateTerritory,
      hq: headquarters,
      area,
      status: accountStatus,
      password,
      
      // Initialize stats to 0 as requested
      salesTarget: '₹0',
      salesAchievedPct: '0%',
      attendancePct: '0%',
      activeASM: '0',
      
      // Store actual creation and audit dates locally
      createdDate: currentDate,
      lastModified: currentDate,
      lastLogin: 'Never'
    };

    const updated = await addRSMRecord(newRecord);
    if (updated) {
      loadRSMs();
      setActiveTab('List');
      Alert.alert('✅ RSM Created', `Regional Sales Manager ${newRecord.name} saved successfully.`);
      // Reset form
      setEmpName(''); setMobile(''); setEmail(''); setStateTerritory(''); setHeadquarters(''); setArea(''); setPassword(''); setConfirmPassword(''); setAccountStatus('Active');
    }
  };

  const filteredList = rsmList.filter((item) => {
    return item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
           item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
           item.stateTerritory.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>👨‍💼 RSM Management</Text>
            <Text style={styles.subtitle}>Manage Regional Sales Managers and assign State Territories.</Text>
          </View>
          {activeTab === 'List' && (
            <TouchableOpacity style={styles.headerAddBtn} onPress={() => { setErrors({}); setActiveTab('Add'); }}>
              <Ionicons name="add" size={16} color="#FFF" />
              <Text style={styles.headerAddBtnText}>Add RSM</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── TAB 1: RSM LIST ── */}
        {activeTab === 'List' && (
          <View style={styles.card}>
            <View style={styles.searchBar}>
              <Ionicons name="search-outline" size={18} color="#94A3B8" style={{ marginRight: 8 }} />
              <TextInput placeholder="Search by name or state..." style={[styles.searchInput, Platform.OS === 'web' && { outlineStyle: 'none' } as any]} value={searchQuery} onChangeText={setSearchQuery} />
            </View>

            {/* 6-Column Table wrapped in Horizontal ScrollView */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ minWidth: 840 }}>
                {/* Table Header */}
                <View style={styles.tableHeaderRow}>
                  <Text style={[styles.tableHeaderCell, { width: 120 }]}>EMPLOYEE CODE</Text>
                  <Text style={[styles.tableHeaderCell, { width: 160 }]}>RSM NAME</Text>
                  <Text style={[styles.tableHeaderCell, { width: 160 }]}>STATE (TERRITORY)</Text>
                  <Text style={[styles.tableHeaderCell, { width: 140 }]}>HEADQUARTERS</Text>
                  <Text style={[styles.tableHeaderCell, { width: 120, textAlign: 'center' }]}>STATUS</Text>
                  <Text style={[styles.tableHeaderCell, { width: 140, textAlign: 'center' }]}>ACTIONS</Text>
                </View>

                {/* Table Body */}
                {filteredList.map((item) => (
                  <View key={item.id} style={styles.tableRow}>
                    <View style={{ width: 120 }}>
                      <Text style={styles.cellTextCode}>{item.code}</Text>
                    </View>
                    <View style={{ width: 160 }}>
                      <Text style={styles.cellTextName}>{item.name}</Text>
                    </View>
                    <View style={{ width: 160 }}>
                      <Text style={styles.cellTextNormal}>{item.stateTerritory}</Text>
                    </View>
                    <View style={{ width: 140 }}>
                      <Text style={styles.cellTextNormal}>{item.hq}</Text>
                    </View>
                    <View style={{ width: 120, alignItems: 'center' }}>
                      <View style={[styles.statusBadge, item.status === 'Active' ? styles.statusActive : styles.statusInactive]}>
                        <Text style={[styles.statusBadgeText, item.status === 'Active' ? { color: '#15803D' } : { color: '#DC2626' }]}>
                          {item.status}
                        </Text>
                      </View>
                    </View>
                    <View style={{ width: 140, flexDirection: 'row', justifyContent: 'center', gap: 16 }}>
                      <TouchableOpacity onPress={() => { setSelectedRSM(item); setIsProfileModalVisible(true); }}>
                        <Ionicons name="eye-outline" size={18} color="#94A3B8" />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => { setErrors({}); setSelectedRSM(item); setActiveTab('Add'); }}>
                        <Ionicons name="pencil-outline" size={18} color="#94A3B8" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* ── TAB 2: ADD / EDIT RSM ── */}
        {(activeTab === 'Add') && (
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Add Regional Sales Manager (RSM)</Text>
              <TouchableOpacity onPress={() => setActiveTab('List')}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* 1. BASIC INFORMATION */}
            <View style={styles.sectionCard}>
              <Text style={styles.formSectionTitle}>1. BASIC INFORMATION</Text>
              
              <View style={styles.formRow}>
                <View style={styles.fieldHalf}>
                  <Text style={styles.label}>Employee Code</Text>
                  <TextInput style={[styles.input, styles.inputDisabled]} value="Auto-generated" editable={false} />
                </View>
                <View style={styles.fieldHalf}>
                  <Text style={styles.label}>Employee Name *</Text>
                  <TextInput style={[styles.input, errors.empName ? styles.inputError : null]} value={empName} onChangeText={(t) => { setEmpName(t); if(errors.empName) setErrors({...errors, empName: ''}) }} />
                  {errors.empName && <Text style={styles.errorText}>{errors.empName}</Text>}
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={styles.fieldHalf}>
                  <Text style={styles.label}>Mobile Number *</Text>
                  <TextInput 
                    style={[styles.input, errors.mobile ? styles.inputError : null]} 
                    keyboardType="phone-pad" 
                    maxLength={10}
                    value={mobile} 
                    onChangeText={(t) => { setMobile(t.replace(/[^0-9]/g, '')); if(errors.mobile) setErrors({...errors, mobile: ''}) }} 
                  />
                  {errors.mobile && <Text style={styles.errorText}>{errors.mobile}</Text>}
                </View>
                <View style={styles.fieldHalf}>
                  <Text style={styles.label}>Designation</Text>
                  <TextInput style={[styles.input, styles.inputDisabled]} value={designation} editable={false} />
                </View>
              </View>

              <View style={{ marginTop: 10 }}>
                <Text style={styles.label}>Reports To</Text>
                <TextInput style={[styles.input, styles.inputDisabled]} value={reportsTo} editable={false} />
              </View>
            </View>

            {/* 2. TERRITORY INFORMATION */}
            <View style={styles.sectionCard}>
              <Text style={styles.formSectionTitle}>2. TERRITORY INFORMATION</Text>
              
              <View style={styles.formRow}>
                <View style={styles.fieldHalf}>
                  <Text style={styles.label}>State *</Text>
                  <TouchableOpacity style={[styles.dropdownInput, errors.stateTerritory ? styles.inputError : null]} onPress={() => setDropdownTarget('state')} activeOpacity={0.7}>
                    <Text style={[styles.dropdownInputText, { color: stateTerritory ? '#0F172A' : '#94A3B8', fontSize: 13 }]}>
                      {stateTerritory || "Select State"}
                    </Text>
                    <Ionicons name="chevron-down" size={16} color="#64748B" />
                  </TouchableOpacity>
                  {errors.stateTerritory && <Text style={styles.errorText}>{errors.stateTerritory}</Text>}
                </View>
                <View style={styles.fieldHalf}>
                  <Text style={styles.label}>Headquarters *</Text>
                  <TextInput style={[styles.input, errors.headquarters ? styles.inputError : null]} value={headquarters} onChangeText={(t) => { setHeadquarters(t); if(errors.headquarters) setErrors({...errors, headquarters: ''}) }} />
                  {errors.headquarters && <Text style={styles.errorText}>{errors.headquarters}</Text>}
                </View>
              </View>

              <View style={{ marginTop: 10 }}>
                <Text style={styles.label}>Area (Optional)</Text>
                <TextInput style={styles.input} placeholder="Additional area details" value={area} onChangeText={setArea} />
              </View>
            </View>

            {/* 3. LOGIN CREDENTIALS */}
            <View style={styles.sectionCard}>
              <Text style={styles.formSectionTitle}>3. LOGIN CREDENTIALS</Text>
              
              <View style={styles.formRow}>
                <View style={styles.fieldHalf}>
                  <Text style={styles.label}>Email Address (Login ID) *</Text>
                  <TextInput 
                    style={[styles.input, errors.email ? styles.inputError : null]} 
                    keyboardType="email-address" 
                    autoCapitalize="none"
                    value={email} 
                    onChangeText={(t) => { setEmail(t); if(errors.email) setErrors({...errors, email: ''}) }} 
                  />
                  {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
                </View>
                <View style={styles.fieldHalf}>
                  <Text style={styles.label}>Account Status</Text>
                  <TouchableOpacity style={styles.dropdownInput} onPress={() => setDropdownTarget('status')} activeOpacity={0.7}>
                    <Text style={[styles.dropdownInputText, { fontSize: 13 }]}>{accountStatus}</Text>
                    <Ionicons name="chevron-down" size={16} color="#64748B" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={styles.fieldHalf}>
                  <Text style={styles.label}>Password *</Text>
                  <TextInput style={[styles.input, errors.password ? styles.inputError : null]} secureTextEntry value={password} onChangeText={(t) => { setPassword(t); if(errors.password) setErrors({...errors, password: ''}) }} />
                  {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
                </View>
                <View style={styles.fieldHalf}>
                  <Text style={styles.label}>Confirm Password *</Text>
                  <TextInput style={[styles.input, errors.confirmPassword ? styles.inputError : null]} secureTextEntry value={confirmPassword} onChangeText={(t) => { setConfirmPassword(t); if(errors.confirmPassword) setErrors({...errors, confirmPassword: ''}) }} />
                  {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
                </View>
              </View>
            </View>

            {/* Employment Information / Joining Date is now automatically the Creation Date and handled implicitly upon Save */}

            <View style={styles.formFooter}>
              <TouchableOpacity style={styles.cancelBtnOutline} onPress={() => setActiveTab('List')}>
                <Text style={styles.cancelBtnOutlineText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtnSolid} onPress={handleSaveRSM}>
                <Text style={styles.saveBtnSolidText}>Create RSM</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        {/* ── RSM PROFILE (VIEW DETAILS SLIDE-OUT MODAL) ── */}
        <Modal visible={isProfileModalVisible} transparent={true} animationType="fade">
          <View style={styles.modalOverlay}>
            <TouchableOpacity style={{ flex: 1 }} onPress={() => setIsProfileModalVisible(false)} />
            
            <View style={styles.profilePanel}>
              <View style={[styles.modalHeaderRow, { backgroundColor: '#4F46E5', padding: 16 }]}>
                <Text style={[styles.modalTitle, { color: '#FFF', fontSize: 18 }]}>View Details</Text>
              </View>

              <ScrollView style={{ flex: 1, padding: 16 }} showsVerticalScrollIndicator={false}>
                {selectedRSM && (
                  <>
                    <View style={styles.sectionCard}>
                       <Text style={styles.formSectionTitle}>Basic Information</Text>
                       <View style={styles.detailRow}><Text style={styles.detailLabel}>Code:</Text><Text style={styles.detailValue}>{selectedRSM.code}</Text></View>
                       <View style={styles.detailRow}><Text style={styles.detailLabel}>Name:</Text><Text style={styles.detailValue}>{selectedRSM.empName}</Text></View>
                       <View style={styles.detailRow}><Text style={styles.detailLabel}>Mobile:</Text><Text style={styles.detailValue}>{selectedRSM.mobile}</Text></View>
                       <View style={styles.detailRow}><Text style={styles.detailLabel}>Email:</Text><Text style={styles.detailValue}>{selectedRSM.email}</Text></View>
                       <View style={styles.detailRow}><Text style={styles.detailLabel}>Designation:</Text><Text style={styles.detailValue}>{selectedRSM.designation}</Text></View>
                       <View style={styles.detailRow}><Text style={styles.detailLabel}>Reports To:</Text><Text style={styles.detailValue}>{selectedRSM.reportsTo}</Text></View>
                       {/* Joining date is the created date */}
                       <View style={styles.detailRow}><Text style={styles.detailLabel}>Joining Date:</Text><Text style={styles.detailValue}>{selectedRSM.createdDate}</Text></View>
                       <View style={styles.detailRow}><Text style={styles.detailLabel}>Status:</Text><Text style={[styles.detailValue, {color: selectedRSM.status === 'Active' ? '#15803D' : '#DC2626'}]}>{selectedRSM.status}</Text></View>
                    </View>

                    <View style={styles.sectionCard}>
                       <Text style={styles.formSectionTitle}>Territory Information</Text>
                       <View style={styles.detailRow}><Text style={styles.detailLabel}>State:</Text><Text style={styles.detailValue}>{selectedRSM.stateTerritory}</Text></View>
                       <View style={styles.detailRow}><Text style={styles.detailLabel}>Headquarters:</Text><Text style={styles.detailValue}>{selectedRSM.hq}</Text></View>
                       <View style={styles.detailRow}><Text style={styles.detailLabel}>Area:</Text><Text style={styles.detailValue}>{selectedRSM.area || 'N/A'}</Text></View>
                    </View>

                    <View style={styles.sectionCard}>
                       <Text style={styles.formSectionTitle}>Performance Summary</Text>
                       <View style={styles.detailRow}><Text style={styles.detailLabel}>Current Target:</Text><Text style={styles.detailValue}>{selectedRSM.salesTarget}</Text></View>
                       <View style={styles.detailRow}><Text style={styles.detailLabel}>Target Achievement %:</Text><Text style={styles.detailValue}>{selectedRSM.salesAchievedPct}</Text></View>
                       <View style={styles.detailRow}><Text style={styles.detailLabel}>Attendance %:</Text><Text style={styles.detailValue}>{selectedRSM.attendancePct}</Text></View>
                       <View style={styles.detailRow}><Text style={styles.detailLabel}>Number of ASMs:</Text><Text style={styles.detailValue}>{selectedRSM.activeASM}</Text></View>
                    </View>

                    <View style={styles.sectionCard}>
                       <Text style={styles.formSectionTitle}>Security</Text>
                       <View style={styles.detailRow}><Text style={styles.detailLabel}>Email Address:</Text><Text style={styles.detailValue}>{selectedRSM.email}</Text></View>
                       <View style={styles.detailRow}><Text style={styles.detailLabel}>Password:</Text><Text style={styles.detailValue}>********</Text></View>
                       <TouchableOpacity onPress={() => Alert.alert('🔑 Password Link sent')}><Text style={{color: '#4F46E5', fontSize: 13, marginTop: 4}}>Send Password Reset Link</Text></TouchableOpacity>
                    </View>

                    <View style={styles.sectionCard}>
                       <Text style={styles.formSectionTitle}>Audit Information</Text>
                       <View style={styles.detailRow}><Text style={styles.detailLabel}>Created By:</Text><Text style={styles.detailValue}>Rajesh Sharma</Text></View>
                       <View style={styles.detailRow}><Text style={styles.detailLabel}>Created Date:</Text><Text style={styles.detailValue}>{selectedRSM.createdDate}</Text></View>
                       <View style={styles.detailRow}><Text style={styles.detailLabel}>Last Modified:</Text><Text style={styles.detailValue}>{selectedRSM.lastModified}</Text></View>
                       <View style={styles.detailRow}><Text style={styles.detailLabel}>Last Login:</Text><Text style={styles.detailValue}>{selectedRSM.lastLogin}</Text></View>
                    </View>
                  </>
                )}
                
                <View style={[styles.formFooter, { marginTop: 20 }]}>
                  <TouchableOpacity style={styles.saveBtnSolid} onPress={() => setIsProfileModalVisible(false)}>
                    <Text style={styles.saveBtnSolidText}>Close</Text>
                  </TouchableOpacity>
                </View>

                <View style={{ height: 40 }} />
              </ScrollView>
            </View>
          </View>
        </Modal>
      </ScrollView>

      {/* ── Generic Dropdown Modal ── */}
      <Modal visible={dropdownTarget !== null} transparent animationType="fade">
        <TouchableOpacity 
          style={[styles.modalOverlay, { backgroundColor: 'transparent', justifyContent: 'center', alignItems: 'center' }]} 
          activeOpacity={1} 
          onPress={() => setDropdownTarget(null)}
        >
          <View style={[
            { backgroundColor: '#FFF', borderRadius: 12, paddingBottom: 10, elevation: 5, shadowOpacity: 0.1, shadowRadius: 10 },
            { width: 220 }
          ]}>
            <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
              {getDropdownOptions().map((opt) => (
                <TouchableOpacity 
                  key={opt} 
                  style={{ paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', paddingHorizontal: 16 }} 
                  onPress={() => handleSelectDropdown(opt)}
                >
                  <Text style={{ fontSize: 14, color: '#334155', textAlign: 'center' }}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

    </SafeAreaView>
  );
};

export default NSMRSMMonitoringScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { padding: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#0F172A' },
  subtitle: { fontSize: 12, color: '#64748B', marginTop: 4 },
  
  headerAddBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E3A8A', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, gap: 4 },
  headerAddBtnText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },

  card: { backgroundColor: '#FFF', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, shadowOffset: {width: 0, height: 2}, elevation: 2 },
  
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 16 },
  searchInput: { flex: 1, fontSize: 13, color: '#0F172A' },

  // Updated 6 Column Table Styles
  tableHeaderRow: { flexDirection: 'row', paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  tableHeaderCell: { fontSize: 11, fontWeight: '700', color: '#64748B' },
  tableRow: { flexDirection: 'row', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', alignItems: 'center' },
  cellTextCode: { fontSize: 13, color: '#64748B' },
  cellTextName: { fontSize: 13, fontWeight: '600', color: '#0F172A' },
  cellTextNormal: { fontSize: 13, color: '#334155' },
  
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusActive: { backgroundColor: '#DCFCE7' },
  statusInactive: { backgroundColor: '#FEE2E2' },
  statusBadgeText: { fontSize: 11, fontWeight: '600' },

  modalCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 20, borderWidth: 1, borderColor: '#E2E8F0' },
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  modalTitle: { fontSize: 16, fontWeight: 'bold', color: '#0F172A' },

  sectionCard: { backgroundColor: '#F8FAFC', borderRadius: 8, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  formSectionTitle: { fontSize: 12, fontWeight: 'bold', color: '#334155', marginBottom: 16 },
  
  formRow: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  fieldHalf: { flex: 1 },
  label: { fontSize: 12, fontWeight: '600', color: '#475569', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 6, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, backgroundColor: '#FFF', color: '#0F172A' },
  inputDisabled: { backgroundColor: '#F1F5F9', color: '#64748B' },
  
  // Validation Styles
  inputError: { borderColor: '#DC2626', borderWidth: 1.5 },
  errorText: { color: '#DC2626', fontSize: 10, marginTop: 4, fontWeight: '500' },

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

  formFooter: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 10 },
  cancelBtnOutline: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 6, borderWidth: 1, borderColor: '#CBD5E1' },
  cancelBtnOutlineText: { color: '#475569', fontWeight: '600', fontSize: 13 },
  saveBtnSolid: { backgroundColor: '#1E3A8A', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 6 },
  saveBtnSolidText: { color: '#FFF', fontWeight: '600', fontSize: 13 },

  detailRow: { flexDirection: 'row', marginBottom: 8 },
  detailLabel: { width: 140, fontSize: 13, color: '#64748B', fontWeight: '500' },
  detailValue: { flex: 1, fontSize: 13, color: '#0F172A', fontWeight: '500' },

  // Modals (Calendar & Dropdown)
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  profilePanel: {
    width: '85%',
    maxWidth: 420,
    backgroundColor: '#F8FAFC',
    height: '100%',
    alignSelf: 'flex-end',
    shadowColor: '#000',
    shadowOffset: { width: -5, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 15,
  },
  calModalCard: { backgroundColor: '#FFF', width: '90%', maxWidth: 360, padding: 18, borderRadius: 16 },
  calModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  calModalTitle: { fontSize: 15, fontWeight: 'bold', color: '#0F172A' },
  dropdownOptionBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  dropdownOptionText: { fontSize: 14, color: '#334155' }
});
