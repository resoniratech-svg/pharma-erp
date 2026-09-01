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
import { getRecentTargetPlans, addRecentTargetPlan, saveTargetPlanningData, getTargetPlanningData } from '../services/nsmStorageService';

// Constants for Mock Data & Dropdowns
const FINANCIAL_YEARS = ['2025-26', '2026-27', '2027-28', '2028-29'];
const PLANNING_PERIODS = ['Annual', 'Quarterly', 'Monthly'];
const TARGET_TYPES = ['Sales Value', 'Sales Volume', 'Both'];

const INDIAN_STATES = [
  'All States', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Delhi', 'Goa', 'Gujarat',
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra',
  'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
];
const REGION_OPTIONS = ['All Regions', 'West', 'East', 'North', 'South'];
const STATUS_OPTIONS = ['All Status', 'Pending', 'Allocated'];

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const generateCalendarDays = (month: number, year: number) => {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);
  return days;
};

const RSM_LIST = [
  { id: '1', code: 'RSM001', name: 'Arun Kumar', state: 'Maharashtra', prevTarget: '₹1,20,00,000', currAchv: '85%', effectiveFrom: '2026-04-01', effectiveTo: '2027-03-31', status: 'Pending' },
  { id: '2', code: 'RSM002', name: 'Rajesh Singh', state: 'Gujarat', prevTarget: '₹1,50,00,000', currAchv: '92%', effectiveFrom: '2026-04-01', effectiveTo: '2027-03-31', status: 'Pending' },
  { id: '3', code: 'RSM003', name: 'Priya Sharma', state: 'Karnataka', prevTarget: '₹1,10,00,000', currAchv: '88%', effectiveFrom: '2026-04-01', effectiveTo: '2027-03-31', status: 'Pending' },
];

const NSMTargetPlanningScreen = () => {
  const [activeTab, setActiveTab] = useState<'Overview' | 'Define' | 'Allocation'>('Overview');

  // Form State (Define National Target)
  const [financialYear, setFinancialYear] = useState('2026-27');
  const [planningPeriod, setPlanningPeriod] = useState('Annual');
  const [nationalTarget, setNationalTarget] = useState('');
  const [targetType, setTargetType] = useState('Sales Value');
  const [startDate, setStartDate] = useState('01-04-2026');
  const [endDate, setEndDate] = useState('31-03-2027');
  const [remarks, setRemarks] = useState('');

  // Allocation State
  const [allocations, setAllocations] = useState<{ [key: string]: string }>({});
  const [rowStatuses, setRowStatuses] = useState<Record<string, string>>({});
  const [editModalData, setEditModalData] = useState<any>(null);
  const [editModalRemarks, setEditModalRemarks] = useState('');
  
  const [filterState, setFilterState] = useState('All States');
  const [filterRegion, setFilterRegion] = useState('All Regions');
  const [filterStatus, setFilterStatus] = useState('All Status');
  const [searchQuery, setSearchQuery] = useState('');
  
  // List State
  const [recentPlans, setRecentPlans] = useState<any[]>([]);
  const [viewPlan, setViewPlan] = useState<any>(null);
  
  // Modal State
  const [dropdownTarget, setDropdownTarget] = useState<'fy' | 'period' | 'type' | 'filterState' | 'filterRegion' | 'filterStatus' | null>(null);
  const [calendarTarget, setCalendarTarget] = useState<'start' | 'end' | null>(null);
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(2026);
  const [calMode, setCalMode] = useState<'date' | 'month' | 'year'>('date');

  // Load from Local Storage on Mount
  useEffect(() => {
    getTargetPlanningData().then(data => {
      if (data) {
        setFinancialYear(data.financialYear || '2026-27');
        setPlanningPeriod(data.planningPeriod || 'Annual');
        setNationalTarget(data.nationalTargetInput || '');
        setTargetType(data.targetType || 'Sales Value');
        setStartDate(data.startDate || '01-04-2026');
        setEndDate(data.endDate || '31-03-2027');
        
        if (data.allocationsMap) setAllocations(data.allocationsMap);
        if (data.rowStatusesMap) setRowStatuses(data.rowStatusesMap);
      }
    });
  }, []);

  React.useEffect(() => {
    const loadPlans = async () => {
      const plans = await getRecentTargetPlans();
      setRecentPlans(plans);
    };
    loadPlans();
  }, []);

  const openCalendar = (target: 'start' | 'end') => {
    setCalendarTarget(target);
    setCalMode('date');
    const existingDate = target === 'start' ? startDate : endDate;
    const parts = existingDate.split('-');
    if (parts.length === 3) {
      setCalMonth(parseInt(parts[1]) - 1);
      setCalYear(parseInt(parts[2]));
    }
  };

  const handleSelectDate = (day: number) => {
    const formatted = `${String(day).padStart(2, '0')}-${String(calMonth + 1).padStart(2, '0')}-${calYear}`;
    if (calendarTarget === 'start') setStartDate(formatted);
    if (calendarTarget === 'end') setEndDate(formatted);
    setCalendarTarget(null);
  };

  const handleSelectDropdown = (val: string) => {
    if (dropdownTarget === 'fy') setFinancialYear(val);
    if (dropdownTarget === 'period') setPlanningPeriod(val);
    if (dropdownTarget === 'type') setTargetType(val);
    if (dropdownTarget === 'filterState') setFilterState(val);
    if (dropdownTarget === 'filterRegion') setFilterRegion(val);
    if (dropdownTarget === 'filterStatus') setFilterStatus(val);
    setDropdownTarget(null);
  };

  const resetForm = () => {
    setFinancialYear('2026-27');
    setPlanningPeriod('Annual');
    setNationalTarget('');
    setTargetType('Sales Value');
    setStartDate('01-04-2026');
    setEndDate('31-03-2027');
    setRemarks('');
    setSearchQuery('');
    setAllocations({});
  };

  const handleSubmitNationalTarget = () => {
    if (!nationalTarget) {
      Alert.alert('Validation Error', 'Please enter a National Sales Target amount.');
      return;
    }
    
    // Date Validation
    const parseDateStr = (dateStr: string) => {
      const parts = dateStr.split('-');
      return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    };
    
    const startObj = parseDateStr(startDate);
    const endObj = parseDateStr(endDate);
    if (endObj < startObj) {
      Alert.alert('Validation Error', 'End Date cannot be earlier than Start Date.');
      return;
    }
    
    // Add to recent plans dynamically
    const newPlan = {
      id: Date.now().toString(),
      fy: financialYear,
      period: planningPeriod,
      created: new Date().toISOString().split('T')[0],
      status: 'Active',
      allocated: '₹0',
      remaining: `₹${nationalTarget}`
    };
    
    // Save to Local Storage and Update State
    addRecentTargetPlan(newPlan).then(updatedPlans => {
      if (updatedPlans) setRecentPlans(updatedPlans);
    });
    
    Alert.alert('✅ Target Submitted', 'The National Target has been securely saved to local storage and added to the Overview table.');
    resetForm();
    setActiveTab('Overview');
  };

  const handleSaveDraft = async () => {
    const updatedStatuses = { ...rowStatuses };
    let changed = false;
    Object.keys(allocations).forEach(id => {
      if (allocations[id] && (!rowStatuses[id] || rowStatuses[id] === 'Pending')) {
        updatedStatuses[id] = 'Draft';
        changed = true;
      }
    });
    setRowStatuses(updatedStatuses);
    
    saveTargetPlanningData({
      financialYear, planningPeriod, nationalTargetInput: nationalTarget, targetType, startDate, endDate,
      allocationsMap: allocations, rowStatusesMap: updatedStatuses
    });

    if (changed) {
      Alert.alert('Draft saved!', 'Your target allocation draft has been saved successfully.');
    }
  };

  const handleValidateAllocation = () => {
    const updatedStatuses = { ...rowStatuses };
    let changed = false;
    Object.keys(rowStatuses).forEach(id => {
      if (rowStatuses[id] === 'Draft') {
        updatedStatuses[id] = 'Validated';
        changed = true;
      }
    });
    setRowStatuses(updatedStatuses);

    saveTargetPlanningData({
      financialYear, planningPeriod, nationalTargetInput: nationalTarget, targetType, startDate, endDate,
      allocationsMap: allocations, rowStatusesMap: updatedStatuses
    });

    if (changed) {
      Alert.alert('Validation Successful!', 'Amounts are within target limits and set to Validated.');
    }
  };

  const handleSubmitAllocation = () => {
    const updatedStatuses = { ...rowStatuses };
    let changed = false;
    Object.keys(rowStatuses).forEach(id => {
      if (rowStatuses[id] === 'Validated') {
        updatedStatuses[id] = 'Allocated';
        changed = true;
      }
    });
    // Fallback: If they go straight from Pending/Draft -> Submit
    Object.keys(allocations).forEach(id => {
      if (allocations[id] && updatedStatuses[id] !== 'Allocated') {
        updatedStatuses[id] = 'Allocated';
        changed = true;
      }
    });
    setRowStatuses(updatedStatuses);

    saveTargetPlanningData({
      financialYear, planningPeriod, nationalTargetInput: nationalTarget, targetType, startDate, endDate,
      allocationsMap: allocations, rowStatusesMap: updatedStatuses
    });

    if (changed) {
      Alert.alert('Plan Submitted Successfully!', 'The final allocation plan has been successfully submitted and saved.');
    }
  };

  const handleUpdateAllocation = () => {
    // Save to Local Storage
    saveTargetPlanningData({
      financialYear, planningPeriod, nationalTargetInput: nationalTarget, targetType, startDate, endDate,
      allocationsMap: allocations, rowStatusesMap: rowStatuses
    });

    setEditModalData(null);
    Alert.alert('Success', 'Allocation updated successfully.');
  };

  const getStatusPillStyle = (status: string) => {
    switch (status) {
      case 'Allocated': return { backgroundColor: '#DCFCE7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: '#BBF7D0' };
      case 'Validated': return { backgroundColor: '#DBEAFE', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: '#BFDBFE' };
      case 'Draft': return { backgroundColor: '#FEF3C7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: '#FDE68A' };
      default: return styles.statusPendingBadge;
    }
  };

  const getStatusPillTextStyle = (status: string) => {
    switch (status) {
      case 'Allocated': return { color: '#15803D', fontSize: 10, fontWeight: 'bold' as any };
      case 'Validated': return { color: '#1E3A8A', fontSize: 10, fontWeight: 'bold' as any };
      case 'Draft': return { color: '#D97706', fontSize: 10, fontWeight: 'bold' as any };
      default: return styles.statusPendingText;
    }
  };

  // Derived Calculations
  const totalAllocated = Object.values(allocations).reduce((sum, val) => sum + (parseInt(val) || 0), 0);
  const remainingBalance = (parseInt(nationalTarget.replace(/[^0-9]/g, '')) || 0) - totalAllocated;

  // Helper to determine which list to render in the modal
  const getDropdownOptions = () => {
    switch (dropdownTarget) {
      case 'fy': return FINANCIAL_YEARS;
      case 'period': return PLANNING_PERIODS;
      case 'type': return TARGET_TYPES;
      case 'filterState': return INDIAN_STATES;
      case 'filterRegion': return REGION_OPTIONS;
      case 'filterStatus': return STATUS_OPTIONS;
      default: return [];
    }
  };

  const handleDropdownSelect = (opt: string) => {
    switch (dropdownTarget) {
      case 'fy': setFinancialYear(opt); break;
      case 'period': setPlanningPeriod(opt); break;
      case 'type': setTargetType(opt); break;
      case 'filterState': setFilterState(opt); break;
      case 'filterRegion': setFilterRegion(opt); break;
      case 'filterStatus': setFilterStatus(opt); break;
    }
    setDropdownTarget(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.title}>🎯 Target Planning Workspace</Text>
          <Text style={styles.subtitle}>Define National Targets and allocate to Regional Sales Managers.</Text>
        </View>

        {/* Custom Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity style={[styles.tab, activeTab === 'Overview' && styles.activeTab]} onPress={() => setActiveTab('Overview')}>
            <Text style={[styles.tabText, activeTab === 'Overview' && styles.activeTabText]}>Overview</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, activeTab === 'Define' && styles.activeTab]} onPress={() => setActiveTab('Define')}>
            <Text style={[styles.tabText, activeTab === 'Define' && styles.activeTabText]}>Define National Target</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, activeTab === 'Allocation' && styles.activeTab]} onPress={() => setActiveTab('Allocation')}>
            <Text style={[styles.tabText, activeTab === 'Allocation' && styles.activeTabText]}>RSM Allocation</Text>
          </TouchableOpacity>
        </View>

        {/* ── TAB 1: OVERVIEW ── */}
        {activeTab === 'Overview' && (
          <View>
            {/* Summary Cards */}
            <View style={styles.summaryGrid}>
              <View style={styles.summaryCard}>
                <View style={styles.iconCircleBlue}><Ionicons name="analytics-outline" size={18} color="#1E3A8A" /></View>
                <Text style={styles.summaryLabel}>National Target</Text>
                <Text style={styles.summaryValue}>₹10,00,000</Text>
                <Text style={styles.summarySubtext}>FY 2026-27</Text>
              </View>
              <View style={styles.summaryCard}>
                <View style={styles.iconCircleGreen}><Ionicons name="trending-up" size={18} color="#15803D" /></View>
                <Text style={styles.summaryLabel}>Total Allocated</Text>
                <Text style={styles.summaryValue}>₹0</Text>
                <Text style={styles.summarySubtext}>0.0% Distributed</Text>
              </View>
              <View style={styles.summaryCard}>
                <View style={styles.iconCircleOrange}><Ionicons name="alert-circle-outline" size={18} color="#D97706" /></View>
                <Text style={styles.summaryLabel}>Remaining Target</Text>
                <Text style={styles.summaryValueOrange}>₹10,00,000</Text>
                <Text style={styles.summarySubtext}>Available for allocation</Text>
              </View>
              <View style={styles.summaryCard}>
                <View style={styles.iconCirclePurple}><Ionicons name="calendar" size={18} color="#7E22CE" /></View>
                <Text style={styles.summaryLabel}>Planning Period</Text>
                <Text style={styles.summaryValue}>Annual</Text>
                <Text style={styles.summarySubtext}>Current active cycle</Text>
              </View>
              
              <View style={styles.summaryCard}>
                <View style={styles.iconCircleBlue}><Ionicons name="people" size={18} color="#1E3A8A" /></View>
                <Text style={styles.summaryLabel}>Total Active RSMs</Text>
                <Text style={styles.summaryValue}>3</Text>
              </View>
              <View style={styles.summaryCard}>
                <View style={styles.iconCircleGreen}><Ionicons name="checkmark-circle" size={18} color="#15803D" /></View>
                <Text style={styles.summaryLabel}>Allocated RSMs</Text>
                <Text style={styles.summaryValue}>0</Text>
              </View>
              <View style={styles.summaryCard}>
                <View style={styles.iconCircleOrange}><Ionicons name="time" size={18} color="#D97706" /></View>
                <Text style={styles.summaryLabel}>Pending Allocation</Text>
                <Text style={styles.summaryValue}>3</Text>
              </View>
            </View>

            {/* Recent Target Plans Table */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Recent Target Plans</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ minWidth: 700 }}>
                  <View style={styles.tableHeaderRow}>
                    <Text style={[styles.th, { width: 120 }]}>FINANCIAL YEAR</Text>
                    <Text style={[styles.th, { width: 130 }]}>PLANNING PERIOD</Text>
                    <Text style={[styles.th, { width: 120 }]}>CREATED DATE</Text>
                    <Text style={[styles.th, { width: 90 }]}>STATUS</Text>
                    <Text style={[styles.th, { width: 130 }]}>ALLOCATED AMOUNT</Text>
                    <Text style={[styles.th, { width: 130 }]}>REMAINING AMOUNT</Text>
                    <Text style={[styles.th, { width: 80, textAlign: 'center' }]}>ACTIONS</Text>
                  </View>
                  {recentPlans.map(plan => (
                    <View key={plan.id} style={styles.tableRow}>
                      <Text style={[styles.td, { width: 120 }]}>{plan.fy}</Text>
                      <Text style={[styles.td, { width: 130 }]}>{plan.period}</Text>
                      <Text style={[styles.td, { width: 120 }]}>{plan.created}</Text>
                      <View style={{ width: 90, alignItems: 'flex-start' }}>
                         <View style={styles.statusActiveBadge}><Text style={styles.statusActiveText}>{plan.status}</Text></View>
                      </View>
                      <Text style={[styles.td, { width: 130 }]}>{plan.allocated}</Text>
                      <Text style={[styles.td, { width: 130 }]}>{plan.remaining}</Text>
                      <TouchableOpacity style={{ width: 80, alignItems: 'center', paddingVertical: 4 }} onPress={() => setViewPlan(plan)}>
                         <Ionicons name="eye-outline" size={18} color="#1E3A8A" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>
          </View>
        )}

        {/* ── TAB 2: DEFINE NATIONAL TARGET ── */}
        {activeTab === 'Define' && (
          <View style={styles.card}>
             <Text style={styles.cardTitle}>Define New National Target</Text>
             
             <View style={styles.formRow}>
               <View style={styles.fieldHalf}>
                 <Text style={styles.label}>Financial Year *</Text>
                 <View style={styles.pickerBoxWithInput}>
                   <TextInput 
                     style={styles.pickerInputText}
                     value={financialYear}
                     onChangeText={setFinancialYear}
                     placeholder="e.g. 2026-27"
                   />
                   <TouchableOpacity onPress={() => setDropdownTarget('fy')} style={{ padding: 4 }}>
                     <Ionicons name="chevron-down" size={16} color="#64748B" />
                   </TouchableOpacity>
                 </View>
               </View>
               <View style={styles.fieldHalf}>
                 <Text style={styles.label}>Planning Period *</Text>
                 <TouchableOpacity style={styles.pickerBox} onPress={() => setDropdownTarget('period')} activeOpacity={0.7}>
                    <Text style={styles.pickerText}>{planningPeriod}</Text>
                    <Ionicons name="chevron-down" size={16} color="#64748B" />
                 </TouchableOpacity>
               </View>
             </View>

             <View style={styles.formRow}>
               <View style={styles.fieldHalf}>
                 <Text style={styles.label}>National Sales Target *</Text>
                 <TextInput 
                   style={styles.input} 
                   placeholder="e.g. 150000000" 
                   keyboardType="numeric" 
                   value={nationalTarget} 
                   onChangeText={setNationalTarget} 
                 />
               </View>
               <View style={styles.fieldHalf}>
                 <Text style={styles.label}>Target Type *</Text>
                 <TouchableOpacity style={styles.pickerBox} onPress={() => setDropdownTarget('type')} activeOpacity={0.7}>
                    <Text style={styles.pickerText}>{targetType}</Text>
                    <Ionicons name="chevron-down" size={16} color="#64748B" />
                 </TouchableOpacity>
               </View>
             </View>

             <View style={styles.formRow}>
               <View style={styles.fieldFull}>
                 <Text style={styles.label}>Currency</Text>
                 <TextInput style={[styles.input, styles.inputDisabled]} value="₹ (INR)" editable={false} />
               </View>
             </View>

             <View style={styles.formRow}>
               <View style={styles.fieldHalf}>
                 <Text style={styles.label}>Start Date *</Text>
                 <TouchableOpacity style={styles.pickerBox} onPress={() => openCalendar('start')} activeOpacity={0.7}>
                    <Text style={styles.pickerText}>{startDate}</Text>
                    <Ionicons name="calendar-outline" size={16} color="#64748B" />
                 </TouchableOpacity>
               </View>
               <View style={styles.fieldHalf}>
                 <Text style={styles.label}>End Date *</Text>
                 <TouchableOpacity style={styles.pickerBox} onPress={() => openCalendar('end')} activeOpacity={0.7}>
                    <Text style={styles.pickerText}>{endDate}</Text>
                    <Ionicons name="calendar-outline" size={16} color="#64748B" />
                 </TouchableOpacity>
               </View>
             </View>

             <View style={styles.formRow}>
               <View style={styles.fieldFull}>
                 <Text style={styles.label}>Remarks (Optional)</Text>
                 <TextInput 
                   style={[styles.input, { height: 80, textAlignVertical: 'top' }]} 
                   placeholder="Enter any planning context, special conditions..." 
                   multiline 
                   value={remarks} 
                   onChangeText={setRemarks} 
                 />
               </View>
             </View>

             <View style={styles.formFooter}>
               <TouchableOpacity style={styles.btnOutline} onPress={handleSaveDraft}>
                 <Ionicons name="document-text-outline" size={16} color="#475569" />
                 <Text style={styles.btnOutlineText}>Save Draft</Text>
               </TouchableOpacity>
               <TouchableOpacity style={styles.btnSolidPrimary} onPress={handleSubmitNationalTarget}>
                 <Ionicons name="paper-plane-outline" size={16} color="#FFF" />
                 <Text style={styles.btnSolidPrimaryText}>Submit National Target</Text>
               </TouchableOpacity>
             </View>
          </View>
        )}

        {/* ── TAB 3: RSM ALLOCATION ── */}
        {activeTab === 'Allocation' && (
          <View>
             {/* Planning Summary Header */}
             <View style={styles.card}>
                <Text style={styles.cardTitle}>1. PLANNING SUMMARY</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.summaryHeaderRow}>
                    <View style={styles.summaryHeaderCol}>
                      <Text style={styles.summaryHeaderLabel}>National Target</Text>
                      <Text style={styles.summaryHeaderValueBlue}>₹10,00,000</Text>
                    </View>
                    <View style={styles.summaryHeaderCol}>
                      <Text style={styles.summaryHeaderLabel}>Allocated Amount</Text>
                      <Text style={styles.summaryHeaderValueGreen}>₹0</Text>
                    </View>
                    <View style={styles.summaryHeaderCol}>
                      <Text style={styles.summaryHeaderLabel}>Remaining Amount</Text>
                      <Text style={styles.summaryHeaderValueOrange}>₹10,00,000</Text>
                    </View>
                    <View style={styles.summaryHeaderCol}>
                      <Text style={styles.summaryHeaderLabel}>Active RSM Count</Text>
                      <Text style={styles.summaryHeaderValueDark}>3</Text>
                    </View>
                    <View style={styles.summaryHeaderCol}>
                      <Text style={styles.summaryHeaderLabel}>Pending Allocation</Text>
                      <Text style={styles.summaryHeaderValueDark}>3</Text>
                    </View>
                  </View>
                </ScrollView>
             </View>

             {/* Filters */}
             <View style={styles.filterCard}>
               <TouchableOpacity style={styles.filterBox} onPress={() => setDropdownTarget('filterState')}>
                 <Text style={styles.filterText}>{filterState}</Text>
                 <Ionicons name="chevron-down" size={14} color="#64748B" />
               </TouchableOpacity>
               <TouchableOpacity style={styles.filterBox} onPress={() => setDropdownTarget('filterRegion')}>
                 <Text style={styles.filterText}>{filterRegion}</Text>
                 <Ionicons name="chevron-down" size={14} color="#64748B" />
               </TouchableOpacity>
               <TouchableOpacity style={styles.filterBox} onPress={() => setDropdownTarget('filterStatus')}>
                 <Text style={styles.filterText}>{filterStatus}</Text>
                 <Ionicons name="chevron-down" size={14} color="#64748B" />
               </TouchableOpacity>
               
               <View style={styles.searchBox}>
                 <Ionicons name="search" size={16} color="#94A3B8" />
                 <TextInput 
                   style={[styles.searchInput, Platform.OS === 'web' && { outlineStyle: 'none' } as any]} 
                   placeholder="Search RSM..." 
                   value={searchQuery}
                   onChangeText={setSearchQuery}
                 />
               </View>
             </View>

             {/* Allocation Table */}
             <View style={styles.card}>
                <Text style={styles.cardTitle}>2. RSM TARGET ALLOCATION</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{ minWidth: 1000 }}>
                    <View style={styles.tableHeaderRow}>
                      <Text style={[styles.th, { width: 90 }]}>EMPLOYEE CODE</Text>
                      <Text style={[styles.th, { width: 140 }]}>RSM NAME</Text>
                      <Text style={[styles.th, { width: 120 }]}>STATE</Text>
                      <Text style={[styles.th, { width: 130 }]}>PREVIOUS TARGET</Text>
                      <Text style={[styles.th, { width: 110 }]}>CURRENT ACHIEVEMENT</Text>
                      <Text style={[styles.th, { width: 160 }]}>ALLOCATED TARGET (₹)</Text>
                      <Text style={[styles.th, { width: 110 }]}>EFFECTIVE FROM</Text>
                      <Text style={[styles.th, { width: 110 }]}>EFFECTIVE TO</Text>
                      <Text style={[styles.th, { width: 90, textAlign: 'center' }]}>STATUS</Text>
                      <Text style={[styles.th, { width: 60, textAlign: 'center' }]}>ACTIONS</Text>
                    </View>
                    {
                      (() => {
                        const filteredRSMList = RSM_LIST.filter(rsm => {
                          const currentStatus = rowStatuses[rsm.id] || rsm.status;
                          const matchesStatus = filterStatus === 'All Status' || currentStatus === filterStatus;
                          const matchesSearch = (rsm.name || "").toLowerCase().includes(searchQuery.toLowerCase()) || (rsm.code || "").toLowerCase().includes(searchQuery.toLowerCase());
                          const matchesState = filterState === 'All States' || rsm.state === filterState;
                          return matchesStatus && matchesSearch && matchesState;
                        });

                        return filteredRSMList.map(rsm => (
                          <View key={rsm.id} style={styles.tableRow}>
                        <Text style={[styles.td, { width: 90, fontWeight: 'bold' }]}>{rsm.code}</Text>
                        <Text style={[styles.td, { width: 140 }]}>{rsm.name}</Text>
                        <Text style={[styles.td, { width: 120 }]}>{rsm.state}</Text>
                        <Text style={[styles.td, { width: 130 }]}>{rsm.prevTarget}</Text>
                        <Text style={[styles.td, { width: 110, color: '#15803D', fontWeight: 'bold' }]}>{rsm.currAchv}</Text>
                        <View style={{ width: 160, paddingRight: 20 }}>
                          {(rowStatuses[rsm.id] === 'Allocated') ? (
                            <Text style={{ fontSize: 13, color: '#0F172A', fontWeight: '500', paddingVertical: 8 }}>₹{allocations[rsm.id] || '0'}</Text>
                          ) : (
                            <TextInput 
                              style={styles.tableInput} 
                              placeholder="Amount" 
                              keyboardType="numeric"
                              value={allocations[rsm.id] || ''}
                              onChangeText={(val) => setAllocations(prev => ({ ...prev, [rsm.id]: val.replace(/[^0-9]/g, '') }))}
                            />
                          )}
                        </View>
                        <Text style={[styles.td, { width: 110 }]}>{rsm.effectiveFrom}</Text>
                        <Text style={[styles.td, { width: 110 }]}>{rsm.effectiveTo}</Text>
                        <View style={{ width: 90, alignItems: 'center' }}>
                           <View style={getStatusPillStyle(rowStatuses[rsm.id] || rsm.status)}><Text style={getStatusPillTextStyle(rowStatuses[rsm.id] || rsm.status)}>{rowStatuses[rsm.id] || rsm.status}</Text></View>
                        </View>
                        <View style={{ width: 60, alignItems: 'center' }}>
                           {rowStatuses[rsm.id] === 'Allocated' && (
                              <TouchableOpacity onPress={() => { setEditModalData(rsm); setEditModalRemarks(''); }}>
                                 <Ionicons name="pencil-outline" size={16} color="#64748B" />
                              </TouchableOpacity>
                           )}
                        </View>
                      </View>
                    ))
                  })()
                }
                  </View>
                </ScrollView>

                {/* Table Footer Actions - Fixed Wrap Issue */}
                <View style={styles.allocationFooterRow}>
                   <View style={styles.footerSummary}>
                      <View style={{ flex: 1, paddingRight: 8 }}>
                         <Text style={styles.footerLabel}>Total Allocated</Text>
                         <Text style={styles.footerValueBlue}>₹ {totalAllocated.toLocaleString('en-IN')}</Text>
                      </View>
                      <View style={{ flex: 1, borderLeftWidth: 1, borderLeftColor: '#E2E8F0', paddingLeft: 12 }}>
                         <Text style={styles.footerLabel}>Remaining Balance</Text>
                         <Text style={[styles.footerValueGreen, remainingBalance < 0 && { color: '#DC2626' }]}>
                           ₹ {remainingBalance.toLocaleString('en-IN')}
                         </Text>
                      </View>
                   </View>
                   <View style={styles.footerActions}>
                      <TouchableOpacity style={[styles.btnOutline, { flex: 1, paddingHorizontal: 4, justifyContent: 'center' }]} onPress={handleSaveDraft}>
                        <Text style={[styles.btnOutlineText, { fontSize: 11, textAlign: 'center' }]} numberOfLines={2}>Save Draft</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.btnSolidWarning, { flex: 1.2, paddingHorizontal: 4, justifyContent: 'center', alignItems: 'center' }]} onPress={handleValidateAllocation}>
                        <Text style={[styles.btnSolidWarningText, { fontSize: 11, textAlign: 'center' }]} numberOfLines={2}>Validate Allocation</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.btnSolidPrimary, { flex: 1.2, paddingHorizontal: 4, justifyContent: 'center', alignItems: 'center' }]} onPress={handleSubmitAllocation}>
                        <Text style={[styles.btnSolidPrimaryText, { fontSize: 11, textAlign: 'center' }]} numberOfLines={2}>Submit Final Plan</Text>
                      </TouchableOpacity>
                   </View>
                </View>
             </View>
          </View>
        )}
      </ScrollView>

      {/* ── Generic Dropdown Modal ── */}
      <Modal visible={dropdownTarget !== null} transparent animationType="fade">
        <TouchableOpacity style={[styles.modalOverlay, { backgroundColor: 'transparent' }]} activeOpacity={1} onPress={() => setDropdownTarget(null)}>
          <View style={[
            styles.dropdownModalCard, 
            { position: 'absolute', paddingVertical: 8, elevation: 5, shadowOpacity: 0.1, shadowRadius: 10 },
            dropdownTarget === 'filterRegion' ? { top: 160, left: 16, width: 140 } :
            dropdownTarget === 'filterState' ? { top: 160, left: 140, width: 180 } :
            dropdownTarget === 'filterStatus' ? { top: 160, left: 260, width: 140 } :
            { top: 250, alignSelf: 'center', width: 200 } // Center aligned for form dropdowns on mobile
          ]}>
            <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
              {getDropdownOptions().map((opt) => (
                <TouchableOpacity 
                  key={opt} 
                  style={{ paddingVertical: 10, paddingHorizontal: 16, backgroundColor: '#FFF' }} 
                  onPress={() => handleDropdownSelect(opt)}
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
                  <TouchableOpacity 
                    key={m} 
                    style={calMonth === idx ? [styles.calMonthBox, { backgroundColor: '#1E3A8A' }] : styles.calMonthBox} 
                    onPress={() => { setCalMonth(idx); setCalMode('date'); }}
                  >
                    <Text style={calMonth === idx ? { color: '#FFF', fontSize: 12 } : styles.calMonthText}>
                      {m.substring(0, 3)}
                    </Text>
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

      {/* ── View Plan Modal ── */}
      <Modal visible={viewPlan !== null} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.dropdownModalCard, { width: '85%', maxWidth: 400 }]}>
            <View style={styles.dropdownModalHeader}>
              <Text style={styles.dropdownModalTitle}>Target Plan Details</Text>
              <TouchableOpacity onPress={() => setViewPlan(null)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            <View style={{ padding: 20 }}>
              {viewPlan && (
                <>
                  <View style={styles.viewRow}><Text style={styles.viewLabel}>Financial Year:</Text><Text style={styles.viewValue}>{viewPlan.fy}</Text></View>
                  <View style={styles.viewRow}><Text style={styles.viewLabel}>Planning Period:</Text><Text style={styles.viewValue}>{viewPlan.period}</Text></View>
                  <View style={styles.viewRow}><Text style={styles.viewLabel}>Created Date:</Text><Text style={styles.viewValue}>{viewPlan.created}</Text></View>
                  <View style={styles.viewRow}><Text style={styles.viewLabel}>Status:</Text><View style={styles.statusActiveBadge}><Text style={styles.statusActiveText}>{viewPlan.status}</Text></View></View>
                  <View style={styles.viewRow}><Text style={styles.viewLabel}>Allocated Amount:</Text><Text style={styles.viewValue}>{viewPlan.allocated}</Text></View>
                  <View style={styles.viewRow}><Text style={styles.viewLabel}>Remaining Amount:</Text><Text style={[styles.viewValue, { color: '#D97706', fontWeight: 'bold' }]}>{viewPlan.remaining}</Text></View>
                </>
              )}
            </View>
            <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: '#E2E8F0', alignItems: 'center' }}>
              <TouchableOpacity style={styles.btnSolidPrimary} onPress={() => setViewPlan(null)}>
                <Text style={styles.btnSolidPrimaryText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Edit Allocation Modal ── */}
      <Modal visible={editModalData !== null} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.dropdownModalCard, { width: '90%', maxWidth: 450 }]}>
            <View style={styles.dropdownModalHeader}>
              <View>
                <Text style={styles.dropdownModalTitle}>Edit Allocation</Text>
                <Text style={styles.summarySubtext}>Update assigned target for {editModalData?.name}</Text>
              </View>
              <TouchableOpacity onPress={() => setEditModalData(null)}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ padding: 16 }}>
              {editModalData && (
                <>
                  <Text style={styles.label}>Employee Code</Text>
                  <TextInput style={[styles.input, styles.inputDisabled, { marginBottom: 16 }]} value={editModalData.code} editable={false} />
                  
                  <View style={{ flexDirection: 'row', gap: 16, marginBottom: 16 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.label}>RSM Name</Text>
                      <TextInput style={[styles.input, styles.inputDisabled]} value={editModalData.name} editable={false} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.label}>State</Text>
                      <TextInput style={[styles.input, styles.inputDisabled]} value={editModalData.state} editable={false} />
                    </View>
                  </View>

                  <Text style={styles.label}>Allocated Target (₹) *</Text>
                  <TextInput 
                    style={[styles.input, { marginBottom: 16 }]} 
                    keyboardType="numeric"
                    value={allocations[editModalData.id] || ''}
                    onChangeText={(val) => setAllocations(prev => ({ ...prev, [editModalData.id]: val.replace(/[^0-9]/g, '') }))}
                  />

                  <Text style={styles.label}>Remarks (Optional)</Text>
                  <TextInput 
                    style={[styles.input, { height: 80, textAlignVertical: 'top' }]} 
                    multiline 
                    placeholder="Enter context for this update..."
                    value={editModalRemarks}
                    onChangeText={setEditModalRemarks}
                  />

                  <View style={styles.formFooter}>
                    <TouchableOpacity style={styles.btnOutline} onPress={() => setEditModalData(null)}>
                      <Text style={styles.btnOutlineText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.btnSolidPrimary} onPress={handleUpdateAllocation}>
                      <Text style={styles.btnSolidPrimaryText}>Update Allocation</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

export default NSMTargetPlanningScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { padding: 16 },
  header: { marginBottom: 16 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#0F172A' },
  subtitle: { fontSize: 12, color: '#64748B', marginTop: 4 },

  tabContainer: { flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 8, padding: 4, marginBottom: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 6 },
  activeTab: { backgroundColor: '#FFF', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: {width: 0, height: 1}, elevation: 2 },
  tabText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  activeTabText: { color: '#1E3A8A', fontWeight: 'bold' },

  card: { backgroundColor: '#FFF', padding: 20, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 5, shadowOffset: {width: 0, height: 2}, elevation: 1, marginBottom: 16 },
  cardTitle: { fontSize: 14, fontWeight: 'bold', color: '#0F172A', marginBottom: 16 },

  // Overview Summary Cards
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 16 },
  summaryCard: { backgroundColor: '#FFF', width: '48%', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 16 },
  iconCircleBlue: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#DBEAFE', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  iconCircleGreen: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#DCFCE7', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  iconCircleOrange: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#FEF3C7', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  iconCirclePurple: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F3E8FF', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  summaryLabel: { fontSize: 12, color: '#64748B', fontWeight: '600', marginBottom: 4 },
  summaryValue: { fontSize: 18, fontWeight: 'bold', color: '#0F172A' },
  summaryValueOrange: { fontSize: 18, fontWeight: 'bold', color: '#D97706' },
  summarySubtext: { fontSize: 10, color: '#94A3B8', marginTop: 4 },

  // Tables
  tableHeaderRow: { flexDirection: 'row', paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  th: { fontSize: 10, fontWeight: 'bold', color: '#64748B' },
  tableRow: { flexDirection: 'row', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', alignItems: 'center' },
  td: { fontSize: 12, color: '#334155' },
  statusActiveBadge: { backgroundColor: '#DCFCE7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusActiveText: { color: '#15803D', fontSize: 10, fontWeight: 'bold' },
  statusPendingBadge: { backgroundColor: '#FEF3C7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: '#FDE68A' },
  statusPendingText: { color: '#D97706', fontSize: 10, fontWeight: 'bold' },

  tableInput: { borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 8, fontSize: 12, backgroundColor: '#FFF' },

  // Form Fields
  formRow: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  fieldHalf: { flex: 1 },
  fieldFull: { flex: 1 },
  label: { fontSize: 12, fontWeight: '600', color: '#475569', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 6, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, backgroundColor: '#FFF', color: '#0F172A' },
  inputDisabled: { backgroundColor: '#F1F5F9', color: '#64748B' },
  pickerBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 6, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#FFF' },
  pickerBoxWithInput: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 6, paddingHorizontal: 4, backgroundColor: '#FFF' },
  pickerInputText: { flex: 1, fontSize: 13, color: '#0F172A', paddingVertical: 8, paddingHorizontal: 8 },
  pickerText: { fontSize: 13, color: '#0F172A' },

  formFooter: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 16 },
  btnOutline: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 6, borderWidth: 1, borderColor: '#CBD5E1', gap: 6 },
  btnOutlineText: { color: '#475569', fontWeight: '600', fontSize: 13 },
  btnSolidPrimary: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E3A8A', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 6, gap: 6 },
  btnSolidPrimaryText: { color: '#FFF', fontWeight: '600', fontSize: 13 },
  btnSolidWarning: { backgroundColor: '#F59E0B', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 6 },
  btnSolidWarningText: { color: '#FFF', fontWeight: '600', fontSize: 13 },

  // Allocation Planning Summary Header
  summaryHeaderRow: { flexDirection: 'row', gap: 32, paddingBottom: 16 },
  summaryHeaderCol: { minWidth: 100 },
  summaryHeaderLabel: { fontSize: 11, color: '#64748B', fontWeight: '600', marginBottom: 4 },
  summaryHeaderValueBlue: { fontSize: 16, fontWeight: 'bold', color: '#1E3A8A' },
  summaryHeaderValueGreen: { fontSize: 16, fontWeight: 'bold', color: '#15803D' },
  summaryHeaderValueOrange: { fontSize: 16, fontWeight: 'bold', color: '#D97706' },
  summaryHeaderValueDark: { fontSize: 16, fontWeight: 'bold', color: '#0F172A' },

  // Filters
  filterCard: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 10, flexWrap: 'wrap' },
  filterBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, gap: 8 },
  filterText: { fontSize: 12, color: '#475569' },
  searchBox: { flex: 1, minWidth: 150, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, gap: 8 },
  searchInput: { flex: 1, fontSize: 12, color: '#0F172A', padding: 0 },

  // Allocation Footer Fixed Layout
  allocationFooterRow: { flexDirection: 'column', marginTop: 24, gap: 16 },
  footerSummary: { flexDirection: 'row', justifyContent: 'flex-start', flexWrap: 'wrap', marginBottom: 8 },
  footerLabel: { fontSize: 11, color: '#64748B', fontWeight: '600', marginBottom: 2 },
  footerValueBlue: { fontSize: 16, fontWeight: 'bold', color: '#1E3A8A' },
  footerValueGreen: { fontSize: 16, fontWeight: 'bold', color: '#15803D' },
  footerActions: { flexDirection: 'row', gap: 6, justifyContent: 'space-between' },

  // Dropdown & View Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.5)', justifyContent: 'center', alignItems: 'center' },
  dropdownModalCard: { backgroundColor: '#FFF', width: '90%', maxWidth: 320, maxHeight: 400, paddingBottom: 10, borderRadius: 12 },
  dropdownModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  dropdownModalTitle: { fontSize: 15, fontWeight: 'bold', color: '#0F172A' },
  dropdownOptionBtn: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  dropdownOptionText: { fontSize: 14, color: '#334155' },
  viewRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  viewLabel: { fontSize: 13, color: '#64748B', fontWeight: '600' },
  viewValue: { fontSize: 14, color: '#0F172A' },

  // Calendar Modal
  calModalCard: { backgroundColor: '#FFF', width: '80%', maxWidth: 260, padding: 12, borderRadius: 12 },
  calModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  calModalTitle: { fontSize: 13, fontWeight: 'bold', color: '#0F172A' },
  calWeekRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  calWeekText: { width: '14.28%', textAlign: 'center', fontSize: 10, color: '#64748B', fontWeight: 'bold' },
  calDaysGrid: { flexDirection: 'row', flexWrap: 'wrap', alignContent: 'flex-start' },
  calDayBox: { width: '14.28%', height: 28, justifyContent: 'center', alignItems: 'center', marginVertical: 0 },
  calDayText: { fontSize: 11, color: '#334155' },
  calMonthGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  calMonthBox: { width: '30%', height: 36, justifyContent: 'center', alignItems: 'center', marginVertical: 4, borderRadius: 6, backgroundColor: '#F1F5F9' },
  calMonthText: { fontSize: 12, color: '#334155' }
});