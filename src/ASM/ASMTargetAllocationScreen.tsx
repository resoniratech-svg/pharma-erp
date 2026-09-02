import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { Alert, Modal, Platform, SafeAreaView, ScrollView, Share, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
// // REMOVED JSPDF
// // REMOVED JSPDF
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { getASMTargetSummary } from '../services/targetService';

const ASMTargetAllocationScreen = () => {
  const navigation = useNavigation<any>();
  const [activeTab, setActiveTab] = useState<'Overview' | 'MR Allocation'>('Overview');
  const [searchQuery, setSearchQuery] = useState('');

  const [targetOverview, setTargetOverview] = useState<any[]>([]);
  const [mrAllocations, setMrAllocations] = useState<any[]>([]);

  useEffect(() => {
    fetchTargets();
  }, []);

  const fetchTargets = async () => {
    try {
      const data = await getASMTargetSummary();
      if (data && data.length > 0) {
        setTargetOverview(data.map((d: any) => ({
           id: d.id || Math.random().toString(),
           financialYear: d.financialYear || 'FY 2026-27',
           planningPeriod: 'Full Year',
           startDate: new Date().toLocaleDateString(),
           status: 'Partially Allocated',
           receivedAmount: (d.targetAmount || 0).toLocaleString(),
           allocatedDown: (d.allocatedAmount || 0).toLocaleString(),
           remainingBalance: (d.remainingAmount || 0).toLocaleString()
        })));
        
        const team = data[0].teamAllocations || [];
        setMrAllocations(team.map((a: any) => ({
           id: a.employeeId?.toString() || Math.random().toString(),
           code: a.employeeCode || '-',
           name: a.employeeName || 'Unknown',
           hq: a.headquarters || '-',
           territory: a.territory || '-',
           allocated: a.amount || '0',
           status: (a.amount && a.amount > 0) ? 'Allocated' : 'Pending'
        })));
      }
    } catch (error) {
      console.error('Failed to fetch targets', error);
    }
  };

  const [viewingMR, setViewingMR] = useState<any>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Dropdown States
  const [dropdownTarget, setDropdownTarget] = useState<'territory' | 'status' | null>(null);
  const [selectedTerritory, setSelectedTerritory] = useState('All Territories');
  const [selectedStatus, setSelectedStatus] = useState('All Status');

  const filteredTargets = targetOverview;

  const filteredMRs = mrAllocations.filter(mr => {
    const matchesSearch = (mr.name || '').toLowerCase().includes((searchQuery || '').toLowerCase()) || (mr.code || '').toLowerCase().includes((searchQuery || '').toLowerCase());
    const matchesTerritory = selectedTerritory === 'All Territories' || mr.territory === selectedTerritory;
    const matchesStatus = selectedStatus === 'All Status' || mr.status === selectedStatus;
    
    return matchesSearch && matchesTerritory && matchesStatus;
  });

  const handleUpdateAllocation = (id: string, value: string) => {
    setMrAllocations(prev => prev.map(mr => 
      mr.id === id ? { ...mr, allocated: value, status: value ? 'Allocated' : 'Pending' } : mr
    ));
  };

  const TERRITORY_OPTIONS = ['All Territories', 'South Mumbai', 'Navi Mumbai', 'Thane', 'Andheri', 'Pune East', 'Pune West', 'Nashik Central', 'Nagpur North'];
  const STATUS_OPTIONS = ['All Status', 'Allocated', 'Pending', 'Draft'];

  const getDropdownOptions = () => {
    if (dropdownTarget === 'territory') return TERRITORY_OPTIONS;
    if (dropdownTarget === 'status') return STATUS_OPTIONS;
    return [];
  };

  const handleSelectDropdown = (val: string) => {
    if (dropdownTarget === 'territory') setSelectedTerritory(val);
    if (dropdownTarget === 'status') setSelectedStatus(val);
    setDropdownTarget(null);
  };

  // Dynamic Calculations
  const totalActiveMRs = mrAllocations.length;
  const allocatedMRsCount = mrAllocations.filter(m => m.status === 'Allocated').length;
  const pendingMRsCount = totalActiveMRs - allocatedMRsCount;

  const assignedTargetStr = '15000000';
  const assignedTarget = parseInt(assignedTargetStr);
  const totalAllocated = mrAllocations.reduce((sum, mr) => sum + (parseInt(mr.allocated?.replace(/,/g, '') || '0') || 0), 0);
  const remainingTarget = assignedTarget - totalAllocated;
  
  const formatCurrency = (val: number) => {
    return '₹' + new Intl.NumberFormat('en-IN').format(val);
  };
  
  const distributedPercent = assignedTarget > 0 ? ((totalAllocated / assignedTarget) * 100).toFixed(1) : '0.0';

  const handleExportCSV = async () => {
    setShowExportMenu(false);
    if (filteredMRs.length === 0) return Alert.alert('No Data', 'There is no data to export.');
    
    const header = 'MR CODE,MR NAME,HEADQUARTERS,TERRITORY,ALLOCATED TARGET,STATUS\n';
    const rows = filteredMRs.map(item => `${item.code},${item.name},${item.hq},${item.territory},${item.allocated || '0'},${item.status}`).join('\n');
    const csvContent = header + rows;

    if (Platform.OS === 'web') {
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', 'MR_Allocation_Export.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      await Share.share({ message: csvContent, title: 'MR_Allocation_Export.csv' });
    }
  };

  const handleExportPDF = async () => {
    setShowExportMenu(false);
    if (filteredMRs.length === 0) return Alert.alert('No Data', 'There is no data to export.');

    try {
      if (Platform.OS === 'web') {
        // @ts-ignore
        const doc = new jsPDF();
        doc.text("MR Allocation Report", 14, 15);
        // @ts-ignore
          autoTable(doc, {
          head: [["CODE", "NAME", "HQ", "TERRITORY", "ALLOCATED", "STATUS"]],
          body: filteredMRs.map(item => [item.code, item.name, item.hq, item.territory, item.allocated || '0', item.status]),
          startY: 20,
        });
        doc.save('MR_Allocation_Export.pdf');
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
              <h1>MR Allocation Report</h1>
              <table>
                <tr><th>CODE</th><th>NAME</th><th>HQ</th><th>TERRITORY</th><th>ALLOCATED</th><th>STATUS</th></tr>
                ${filteredMRs.map(item => `
                  <tr><td>${item.code}</td><td>${item.name}</td><td>${item.hq}</td><td>${item.territory}</td><td>${item.allocated || '0'}</td><td>${item.status}</td></tr>
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

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={20} color="#334155" />
        </TouchableOpacity>
        <Text style={styles.title}>Target Allocation</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1, padding: 16 }}>
        
        {/* Page Titles */}
        <Text style={styles.pageTitle}>Target Allocation Workspace</Text>
        <Text style={styles.pageSubtitle}>Review targets received from the Regional Sales Manager and allocate them to Medical Representatives.</Text>

        {/* Custom Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity 
            style={[styles.tabBtn, activeTab === 'Overview' && styles.tabBtnActive]} 
            onPress={() => setActiveTab('Overview')}
          >
            <Text style={[styles.tabText, activeTab === 'Overview' && styles.tabTextActive]}>Overview</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabBtn, activeTab === 'MR Allocation' && styles.tabBtnActive]} 
            onPress={() => setActiveTab('MR Allocation')}
          >
            <Text style={[styles.tabText, activeTab === 'MR Allocation' && styles.tabTextActive]}>MR Allocation</Text>
          </TouchableOpacity>
        </View>

        {/* TAB CONTENT */}
        {activeTab === 'Overview' && (
          <View>
            {/* ROW 1 & 2 CARDS */}
            <View style={styles.cardsRow}>
              {/* Card 1 */}
              <View style={styles.card}>
                <View style={[styles.iconCircle, { backgroundColor: '#EEF2FF' }]}>
                  <Ionicons name="briefcase-outline" size={18} color="#4F46E5" />
                </View>
                <Text style={styles.cardLabel}>Assigned Target</Text>
                <Text style={styles.cardValue}>{formatCurrency(assignedTarget)}</Text>
                <Text style={styles.cardSubtitle}>From RSM</Text>
              </View>
              {/* Card 2 */}
              <View style={styles.card}>
                <View style={[styles.iconCircle, { backgroundColor: '#ECFDF5' }]}>
                  <Ionicons name="trending-up-outline" size={18} color="#10B981" />
                </View>
                <Text style={styles.cardLabel}>Total Allocated</Text>
                <Text style={styles.cardValue}>{formatCurrency(totalAllocated)}</Text>
                <Text style={styles.cardSubtitle}>{distributedPercent}% Distributed</Text>
              </View>
              {/* Card 3 */}
              <View style={styles.card}>
                <View style={[styles.iconCircle, { backgroundColor: '#FFFBEB' }]}>
                  <Ionicons name="alert-circle-outline" size={18} color="#F59E0B" />
                </View>
                <Text style={styles.cardLabel}>Remaining Target</Text>
                <Text style={styles.cardValue}>{formatCurrency(remainingTarget)}</Text>
                <Text style={styles.cardSubtitle}>Available for allocation</Text>
              </View>
              {/* Card 4 */}
              <View style={styles.card}>
                <View style={[styles.iconCircle, { backgroundColor: '#F5F3FF' }]}>
                  <Ionicons name="calendar-outline" size={18} color="#8B5CF6" />
                </View>
                <Text style={styles.cardLabel}>Planning Period</Text>
                <Text style={styles.cardValue}>{'Q2 (Jul - Sep)'}</Text>
                <Text style={styles.cardSubtitle}>Current active cycle</Text>
              </View>
              
              {/* Card 5 */}
              <View style={styles.card}>
                <View style={[styles.iconCircle, { backgroundColor: '#EFF6FF' }]}>
                  <Ionicons name="people-outline" size={18} color="#3B82F6" />
                </View>
                <Text style={styles.cardLabel}>Total Active MRs</Text>
                <Text style={styles.cardValue}>{totalActiveMRs}</Text>
                <Text style={styles.cardSubtitle}></Text>
              </View>
              {/* Card 6 */}
              <View style={styles.card}>
                <View style={[styles.iconCircle, { backgroundColor: '#ECFDF5' }]}>
                  <Ionicons name="checkmark-circle-outline" size={18} color="#10B981" />
                </View>
                <Text style={styles.cardLabel}>Allocated MRs</Text>
                <Text style={styles.cardValue}>{allocatedMRsCount}</Text>
                <Text style={styles.cardSubtitle}></Text>
              </View>
              {/* Card 7 (Takes up half width, or we can center it if we wanted to) */}
              <View style={styles.card}>
                <View style={[styles.iconCircle, { backgroundColor: '#FFFBEB' }]}>
                  <Ionicons name="alert-circle-outline" size={18} color="#F59E0B" />
                </View>
                <Text style={styles.cardLabel}>Pending Allocation</Text>
                <Text style={styles.cardValue}>{pendingMRsCount}</Text>
                <Text style={styles.cardSubtitle}></Text>
              </View>
            </View>

            {/* Overview Header without Search */}
            <View style={styles.listSectionHeader}>
              <Text style={styles.sectionTitle}>Assigned Targets (from RSM)</Text>
            </View>

            {/* List of Targets as Mobile Cards */}
            {filteredTargets.map((target) => (
              <View key={target.id} style={styles.targetCard}>
                <View style={styles.targetCardHeader}>
                  <Text style={styles.targetPeriod}>{target.planningPeriod}</Text>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusBadgeText}>{target.status}</Text>
                  </View>
                </View>
                
                <View style={styles.targetGrid}>
                  <View style={styles.targetGridItem}>
                    <Text style={styles.targetLabel}>Financial Year</Text>
                    <Text style={styles.targetValue}>{target.financialYear}</Text>
                  </View>
                  <View style={styles.targetGridItem}>
                    <Text style={styles.targetLabel}>Start Date</Text>
                    <Text style={styles.targetValue}>{target.startDate}</Text>
                  </View>
                </View>
                
                <View style={styles.divider} />
                
                <View style={styles.targetAmounts}>
                  <View style={styles.amountItem}>
                    <Text style={styles.amountLabel}>Received</Text>
                    <Text style={[styles.amountValue, { color: '#0F172A' }]}>₹{target.receivedAmount}</Text>
                  </View>
                  <View style={styles.amountItem}>
                    <Text style={styles.amountLabel}>Allocated Down</Text>
                    <Text style={[styles.amountValue, { color: '#10B981' }]}>₹{target.allocatedDown}</Text>
                  </View>
                  <View style={styles.amountItem}>
                    <Text style={styles.amountLabel}>Balance</Text>
                    <Text style={[styles.amountValue, { color: '#F59E0B' }]}>₹{target.remainingBalance}</Text>
                  </View>
                </View>
              </View>
            ))}

            {filteredTargets.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="search-outline" size={32} color="#CBD5E1" />
                <Text style={styles.emptyStateText}>No targets found matching your search.</Text>
              </View>
            )}
          </View>
        )}

        {activeTab === 'MR Allocation' && (
          <View>
            {/* 1. PLANNING SUMMARY (Horizontal scroll for mobile) */}
            <Text style={styles.sectionTitle}>1. PLANNING SUMMARY</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 24, marginHorizontal: -16, paddingHorizontal: 16 }}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Assigned Target</Text>
                <Text style={styles.summaryValue}>{formatCurrency(assignedTarget)}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Allocated Amount</Text>
                <Text style={[styles.summaryValue, { color: '#10B981' }]}>{formatCurrency(totalAllocated)}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Remaining Amount</Text>
                <Text style={[styles.summaryValue, { color: '#F59E0B' }]}>{formatCurrency(remainingTarget)}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Active MR Count</Text>
                <Text style={styles.summaryValue}>{totalActiveMRs}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Pending Allocation</Text>
                <Text style={styles.summaryValue}>{pendingMRsCount}</Text>
              </View>
              <View style={{ width: 16 }} />
            </ScrollView>

            {/* Filters & Search */}
            <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 24, zIndex: 10 }}>
              <View style={{ zIndex: 10, position: 'relative' }}>
                <TouchableOpacity 
                  style={styles.dropdownMini}
                  onPress={() => setDropdownTarget(dropdownTarget === 'territory' ? null : 'territory')}
                >
                  <Text style={styles.dropdownMiniText}>{selectedTerritory}</Text>
                  <Ionicons name="chevron-down" size={14} color="#64748B" />
                </TouchableOpacity>

                {dropdownTarget === 'territory' && (
                  <View style={[styles.dropdownModalCard, { position: 'absolute', top: 44, left: 0, width: 160, zIndex: 20, elevation: 5, shadowOpacity: 0.1, shadowRadius: 10 }]}>
                    <ScrollView style={{ maxHeight: 250 }} showsVerticalScrollIndicator={false}>
                      {TERRITORY_OPTIONS.map((opt) => (
                        <TouchableOpacity 
                          key={opt}
                          style={styles.dropdownOptionBtn} 
                          onPress={() => handleSelectDropdown(opt)}
                        >
                          <Text style={[
                            styles.dropdownOptionText,
                            selectedTerritory === opt ? { color: '#4F46E5', fontWeight: '600' } : {}
                          ]}>
                            {opt}
                          </Text>
                          {selectedTerritory === opt && (
                            <Ionicons name="checkmark" size={16} color="#4F46E5" style={{ marginLeft: 'auto' }} />
                          )}
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>

              <View style={{ zIndex: 10, position: 'relative' }}>
                <TouchableOpacity 
                  style={styles.dropdownMini}
                  onPress={() => setDropdownTarget(dropdownTarget === 'status' ? null : 'status')}
                >
                  <Text style={styles.dropdownMiniText}>{selectedStatus}</Text>
                  <Ionicons name="chevron-down" size={14} color="#64748B" />
                </TouchableOpacity>

                {dropdownTarget === 'status' && (
                  <View style={[styles.dropdownModalCard, { position: 'absolute', top: 44, left: 0, width: 160, zIndex: 20, elevation: 5, shadowOpacity: 0.1, shadowRadius: 10 }]}>
                    <ScrollView style={{ maxHeight: 250 }} showsVerticalScrollIndicator={false}>
                      {STATUS_OPTIONS.map((opt) => (
                        <TouchableOpacity 
                          key={opt}
                          style={styles.dropdownOptionBtn} 
                          onPress={() => handleSelectDropdown(opt)}
                        >
                          <Text style={[
                            styles.dropdownOptionText,
                            selectedStatus === opt ? { color: '#4F46E5', fontWeight: '600' } : {}
                          ]}>
                            {opt}
                          </Text>
                          {selectedStatus === opt && (
                            <Ionicons name="checkmark" size={16} color="#4F46E5" style={{ marginLeft: 'auto' }} />
                          )}
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>

              <View style={[styles.searchBox, { flex: 1, minWidth: 200 }]}>
                <Ionicons name="search" size={18} color="#94A3B8" style={{ marginRight: 8 }} />
                <TextInput
                  style={[styles.searchInput, Platform.OS === 'web' && { outlineStyle: 'none' } as any]}
                  placeholder="Search MR Name or Code..."
                  placeholderTextColor="#94A3B8"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>

              <View style={{ position: 'relative', zIndex: 20 }}>
                <TouchableOpacity style={styles.exportBtn} onPress={() => setShowExportMenu(!showExportMenu)}>
                  <Ionicons name="download-outline" size={16} color="#334155" style={{ marginRight: 6 }} />
                  <Text style={styles.exportBtnText}>Export</Text>
                  <Ionicons name="chevron-down" size={14} color="#64748B" style={{ marginLeft: 6 }} />
                </TouchableOpacity>

                {showExportMenu && (
                  <View style={[styles.dropdownModalCard, { position: 'absolute', top: 38, right: 0, width: 150, zIndex: 30, elevation: 5, shadowOpacity: 0.1, shadowRadius: 10 }]}>
                    <TouchableOpacity style={styles.dropdownOptionBtn} onPress={handleExportCSV}>
                      <Text style={styles.dropdownOptionText}>Export as CSV</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.dropdownOptionBtn} onPress={handleExportPDF}>
                      <Text style={styles.dropdownOptionText}>Export as PDF</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>

            {/* 2. MR TARGET ALLOCATION */}
            <Text style={styles.sectionTitle}>2. MR TARGET ALLOCATION</Text>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -16 }}>
              <View style={{ paddingHorizontal: 16, minWidth: 800 }}>
                {/* Table Header */}
                <View style={styles.tableHeader}>
                  <Text style={[styles.columnHeader, { width: 100 }]}>MR CODE</Text>
                  <Text style={[styles.columnHeader, { width: 160 }]}>MR NAME</Text>
                  <Text style={[styles.columnHeader, { width: 100 }]}>HEADQUARTERS</Text>
                  <Text style={[styles.columnHeader, { width: 140 }]}>TERRITORY</Text>
                  <Text style={[styles.columnHeader, { width: 160 }]}>ALLOCATED TARGET (₹)</Text>
                  <Text style={[styles.columnHeader, { width: 100 }]}>STATUS</Text>
                  <Text style={[styles.columnHeader, { width: 60, textAlign: 'center' }]}>ACTION</Text>
                </View>

                {/* Table Body */}
                {filteredMRs.map((item, index) => (
                  <View key={item.id} style={[styles.tableRow, index === filteredMRs.length - 1 && { borderBottomWidth: 0 }]}>
                    <Text style={[styles.cellText, styles.cellCode, { width: 100 }]}>{item.code}</Text>
                    <Text style={[styles.cellText, { width: 160 }]}>{item.name}</Text>
                    <Text style={[styles.cellText, { width: 100 }]}>{item.hq}</Text>
                    <Text style={[styles.cellText, { width: 140 }]}>{item.territory}</Text>
                    
                    <View style={{ width: 160, paddingRight: 16 }}>
                      <TextInput 
                        style={[styles.allocationInput, Platform.OS === 'web' && { outlineStyle: 'none' } as any]}
                        placeholder="Amount"
                        placeholderTextColor="#94A3B8"
                        keyboardType="numeric"
                        value={item.allocated}
                        onChangeText={(val) => handleUpdateAllocation(item.id, val)}
                      />
                    </View>

                    <View style={{ width: 100 }}>
                      <View style={[styles.statusBadgeSm, item.status === 'Allocated' ? styles.statusAllocated : styles.statusPending]}>
                        <Text style={[styles.statusTextSm, item.status === 'Allocated' ? styles.statusAllocatedText : styles.statusPendingText]}>
                          {item.status}
                        </Text>
                      </View>
                    </View>

                    <View style={{ width: 60, alignItems: 'center' }}>
                      <TouchableOpacity onPress={() => setViewingMR(item)}>
                        <Ionicons name="eye-outline" size={18} color="#94A3B8" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}

                {filteredMRs.length === 0 && (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyStateText}>No MR found matching your search.</Text>
                  </View>
                )}
              </View>
            </ScrollView>
          </View>
        )}

      </ScrollView>

      {/* ── View MR Allocation Details Modal (Right Panel) ── */}
      <Modal visible={!!viewingMR} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setViewingMR(null)} />
          <View style={styles.profilePanel}>
            <View style={styles.panelHeader}>
              <Text style={styles.panelTitle}>MR Allocation Details</Text>
              <TouchableOpacity onPress={() => setViewingMR(null)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
              {/* 1. MR INFORMATION */}
              <Text style={styles.panelSectionTitle}>1. MR INFORMATION</Text>
              
              <View style={styles.panelFieldGroup}>
                <Text style={styles.panelFieldLabel}>MR CODE</Text>
                <Text style={styles.panelFieldValue}>{viewingMR?.code}</Text>
              </View>

              <View style={styles.panelFieldGroup}>
                <Text style={styles.panelFieldLabel}>MR NAME</Text>
                <Text style={styles.panelFieldValue}>{viewingMR?.name}</Text>
              </View>

              <View style={styles.panelFieldGroup}>
                <Text style={styles.panelFieldLabel}>HEADQUARTERS</Text>
                <Text style={styles.panelFieldValue}>{viewingMR?.hq}</Text>
              </View>

              <View style={styles.panelFieldGroup}>
                <Text style={styles.panelFieldLabel}>TERRITORY</Text>
                <Text style={styles.panelFieldValue}>{viewingMR?.territory}</Text>
              </View>

              {/* 2. TARGET DETAILS */}
              <Text style={[styles.panelSectionTitle, { marginTop: 24 }]}>2. TARGET DETAILS</Text>
              
              <View style={styles.panelFieldGroup}>
                <Text style={styles.panelFieldLabel}>ASSIGNED TARGET (RSM)</Text>
                <Text style={styles.panelFieldValue}>₹1,50,00,000</Text>
              </View>

              <View style={styles.panelFieldGroup}>
                <Text style={styles.panelFieldLabel}>ALLOCATED TARGET</Text>
                <Text style={styles.panelFieldValue}>₹{viewingMR?.allocated || '0'}</Text>
              </View>

              <View style={styles.panelFieldGroup}>
                <Text style={styles.panelFieldLabel}>STATUS</Text>
                <View style={[styles.statusBadgeSm, viewingMR?.status === 'Allocated' ? styles.statusAllocated : styles.statusPending, { marginTop: 4 }]}>
                  <Text style={[styles.statusTextSm, viewingMR?.status === 'Allocated' ? styles.statusAllocatedText : styles.statusPendingText]}>
                    {viewingMR?.status || 'Pending'}
                  </Text>
                </View>
              </View>

              {/* 3. REMARKS */}
              <Text style={[styles.panelSectionTitle, { marginTop: 24 }]}>3. REMARKS</Text>
              
              <View style={styles.panelFieldGroup}>
                <Text style={styles.panelFieldLabel}>REMARKS</Text>
                <Text style={[styles.panelFieldValue, { fontSize: 13, lineHeight: 20 }]}>
                  Focus on maximizing new product lines in this territory. Review targets monthly.
                </Text>
              </View>
            </ScrollView>

            <View style={styles.panelFooter}>
              <TouchableOpacity style={styles.closeBtnLarge} onPress={() => setViewingMR(null)}>
                <Text style={styles.closeBtnLargeText}>Close Details</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  backBtn: { padding: 4, marginRight: 12, backgroundColor: '#F1F5F9', borderRadius: 8 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#0F172A' },
  
  pageTitle: { fontSize: 22, fontWeight: 'bold', color: '#0F172A', marginTop: 12, marginBottom: 6 },
  pageSubtitle: { fontSize: 13, color: '#64748B', marginBottom: 20 },
  
  tabsContainer: { flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 8, padding: 4, alignSelf: 'flex-start', marginBottom: 24 },
  tabBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 6 },
  tabBtnActive: { backgroundColor: '#FFF', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, shadowOffset: { width: 0, height: 1 }, elevation: 2 },
  tabText: { fontSize: 13, fontWeight: '500', color: '#64748B' },
  tabTextActive: { color: '#0F172A', fontWeight: '600' },

  dropdownModalCard: { backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', overflow: 'hidden' },
  dropdownOptionBtn: { paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center' },
  dropdownOptionText: { fontSize: 13, color: '#334155' },

  cardsRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 16 },
  card: { 
    backgroundColor: '#FFF', 
    borderRadius: 16, 
    padding: 16, 
    width: '48%', 
    marginBottom: 16, 
    borderWidth: 1, 
    borderColor: '#F1F5F9',
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 1 }, 
    shadowOpacity: 0.02, 
    shadowRadius: 4, 
    elevation: 1 
  },
  iconCircle: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  cardLabel: { fontSize: 12, color: '#64748B', fontWeight: '500', marginBottom: 4 },
  cardValue: { fontSize: 18, fontWeight: 'bold', color: '#0F172A', marginBottom: 4 },
  cardSubtitle: { fontSize: 10, color: '#94A3B8', minHeight: 14 },

  listSectionHeader: { marginBottom: 12, marginTop: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginBottom: 12 },
  
  searchBox: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#FFF', 
    borderWidth: 1, 
    borderColor: '#E2E8F0', 
    borderRadius: 8, 
    paddingHorizontal: 12, 
    height: 40 
  },
  searchInput: { flex: 1, fontSize: 14, color: '#0F172A' },
  
  targetCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  targetCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  targetPeriod: { fontSize: 16, fontWeight: 'bold', color: '#0F172A' },
  statusBadge: { backgroundColor: '#FFFBEB', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: '#FEF3C7' },
  statusBadgeText: { fontSize: 11, fontWeight: '600', color: '#F59E0B' },
  
  targetGrid: { flexDirection: 'row', marginBottom: 16 },
  targetGridItem: { flex: 1 },
  targetLabel: { fontSize: 12, color: '#64748B', marginBottom: 4 },
  targetValue: { fontSize: 13, fontWeight: '500', color: '#334155' },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginBottom: 16 },
  targetAmounts: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  amountItem: { flex: 1 },
  amountLabel: { fontSize: 11, color: '#64748B', marginBottom: 4 },
  amountValue: { fontSize: 14, fontWeight: '700' },
  exportBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
  exportBtnText: { fontSize: 13, fontWeight: '500', color: '#334155' },
  emptyState: { padding: 32, alignItems: 'center' },
  emptyStateText: { marginTop: 12, fontSize: 14, color: '#64748B', textAlign: 'center' },
  emptyStateBlock: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E2E8F0', marginTop: 8 },
  emptyStateTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A', marginBottom: 8 },
  emptyStateInner: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  bigSearchIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyStateDesc: { fontSize: 14, color: '#64748B' },

  summaryItem: { marginRight: 32, justifyContent: 'center' },
  summaryLabel: { fontSize: 11, color: '#64748B', fontWeight: '600', textTransform: 'uppercase', marginBottom: 6 },
  summaryValue: { fontSize: 16, fontWeight: 'bold', color: '#0F172A' },

  dropdownMini: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, paddingHorizontal: 12, height: 40, justifyContent: 'space-between', minWidth: 120 },
  dropdownMiniText: { fontSize: 13, color: '#334155', marginRight: 8 },

  tableHeader: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  columnHeader: { fontSize: 11, fontWeight: '600', color: '#64748B', textTransform: 'uppercase' },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  cellText: { fontSize: 13, color: '#334155' },
  cellCode: { fontWeight: '600', color: '#0F172A' },
  
  allocationInput: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 6, paddingHorizontal: 12, height: 36, fontSize: 13, color: '#0F172A', backgroundColor: '#FFF' },
  
  statusBadgeSm: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start' },
  statusAllocated: { backgroundColor: '#ECFDF5' },
  statusPending: { backgroundColor: '#FFFBEB' },
  statusTextSm: { fontSize: 11, fontWeight: '600' },
  statusAllocatedText: { color: '#10B981' },
  statusPendingText: { color: '#F59E0B' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', flexDirection: 'row' },
  profilePanel: { 
    width: '85%', 
    maxWidth: 420,
    backgroundColor: '#FFF', 
    height: '100%', 
    alignSelf: 'flex-end',
    shadowColor: '#000',
    shadowOffset: { width: -5, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 15,
  },
  panelHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  panelTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  
  panelSectionTitle: { fontSize: 11, fontWeight: '700', color: '#0F172A', marginBottom: 16, marginTop: 8 },
  panelFieldGroup: { marginBottom: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', paddingBottom: 12 },
  panelFieldLabel: { fontSize: 11, color: '#64748B', marginBottom: 6, fontWeight: '500' },
  panelFieldValue: { fontSize: 14, color: '#0F172A', fontWeight: '500' },
  
  panelFooter: { padding: 16, borderTopWidth: 1, borderTopColor: '#E2E8F0', backgroundColor: '#FFF' },
  closeBtnLarge: { backgroundColor: '#F8FAFC', paddingVertical: 12, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  closeBtnLargeText: { color: '#334155', fontWeight: '600', fontSize: 14 }
});

export default ASMTargetAllocationScreen;
