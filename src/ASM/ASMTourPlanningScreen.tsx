import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, TextInput, Platform, Alert, Share, Modal, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { getASMTourPlans } from '../services/tourPlanService';

const ASMTourPlanningScreen = () => {
  const navigation = useNavigation<any>();

  const [searchText, setSearchText] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('Current Month');
  const [selectedStatus, setSelectedStatus] = useState('All');
  
  // Dropdown UI states
  const [isMonthDropdownOpen, setIsMonthDropdownOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);

  // Detail View State
  const [selectedPlan, setSelectedPlan] = useState<any>(null);

  const [tourPlans, setTourPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTourPlans();
  }, []);

  const fetchTourPlans = async () => {
    try {
      setLoading(true);
      const data = await getASMTourPlans();
      
      const formatted = data.map((item: any) => ({
        id: item.id.toString(),
        date: item.tourDate ? new Date(item.tourDate).toLocaleDateString() : 'N/A',
        mrName: item.mr?.employee?.name || 'Unknown',
        territory: item.territory || 'Unassigned',
        visits: (item.tourPlanDoctors?.length || 0) + (item.tourPlanChemists?.length || 0),
        status: item.status || 'Pending',
        mrCode: item.mr?.employee?.employeeCode || '-',
        headquarters: item.mr?.employee?.headquarters || '-',
        tourMonth: item.tourDate ? new Date(item.tourDate).toLocaleString('default', { month: 'long', year: 'numeric' }) : 'N/A',
        tourType: item.planType || '-',
        plannedArea: item.area || '-',
        plannedRoute: item.beat || '-',
        plannedVisits: [
          ...(item.tourPlanDoctors || []).map((d: any) => ({ type: 'Doctor', name: d.doctor?.name, location: d.doctor?.address || '-', time: '-' })),
          ...(item.tourPlanChemists || []).map((c: any) => ({ type: 'Chemist', name: c.chemist?.name, location: c.chemist?.address || '-', time: '-' }))
        ],
        submittedDate: item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '-',
        mrRemarks: item.remarks || 'None',
        asmRemarks: 'N/A',
        raw: item,
      }));
      setTourPlans(formatted);
    } catch (error) {
      console.error("Failed to fetch tour plans:", error);
      Alert.alert("Error", "Could not load tour plans.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved': return { bg: '#ECFDF5', text: '#10B981' };
      case 'Pending': return { bg: '#FFFBEB', text: '#F59E0B' };
      case 'Rejected': return { bg: '#FEF2F2', text: '#EF4444' };
      default: return { bg: '#F1F5F9', text: '#64748B' };
    }
  };

  // Filter Data
  const filteredData = tourPlans.filter(item => {
    const matchesSearch = item.mrName.toLowerCase().includes(searchText.toLowerCase()) || 
                          item.territory.toLowerCase().includes(searchText.toLowerCase());
    const matchesStatus = selectedStatus === 'All' || item.status === selectedStatus;
    
    let matchesMonth = true;
    if (selectedMonth !== 'All' && selectedMonth !== 'Current Month') {
       matchesMonth = item.tourMonth === selectedMonth;
    }

    return matchesSearch && matchesStatus && matchesMonth;
  });

  const generateCSV = async () => {
    let csvContent = "Tour Date,MR Name,Territory,Planned Visits,Status\n";
    filteredData.forEach(item => {
      csvContent += `${item.date},${item.mrName},${item.territory},${item.visits},${item.status}\n`;
    });

    try {
      if (Platform.OS === 'web') {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', 'Tour_Planning_Report.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        await Share.share({ message: csvContent, title: 'Tour_Planning_Report.csv' });
      }
    } catch (error) {
      console.error("CSV generation failed", error);
      Alert.alert('Error', 'Failed to generate CSV.');
    }
  };

  const generatePDF = async () => {
    try {
      if (Platform.OS === 'web') {
        const doc = new jsPDF();
        doc.text("Tour Planning (MTP) Report", 14, 15);
        autoTable(doc, {
          startY: 20,
          head: [['Tour Date', 'MR Name', 'Territory', 'Planned Visits', 'Status']],
          body: filteredData.map(item => [item.date, item.mrName, item.territory, item.visits, item.status]),
        });
        doc.save("mtp_report.pdf");
      } else {
        const tableRows = filteredData.map(item => `
          <tr>
            <td>${item.date}</td>
            <td>${item.mrName}</td>
            <td>${item.territory}</td>
            <td>${item.visits}</td>
            <td>${item.status}</td>
          </tr>
        `).join('');

        const html = `
          <html>
            <head>
              <style>
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
                h1 { color: #333; }
              </style>
            </head>
            <body>
              <h1>Tour Planning (MTP) Report</h1>
              <table>
                <tr>
                  <th>Tour Date</th>
                  <th>MR Name</th>
                  <th>Territory</th>
                  <th>Planned Visits</th>
                  <th>Status</th>
                </tr>
                ${tableRows}
              </table>
            </body>
          </html>
        `;

        const { uri } = await Print.printToFileAsync({ html });
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri);
        } else {
          Alert.alert('Success', 'PDF generated at: ' + uri);
        }
      }
    } catch (error) {
      console.error("PDF generation failed", error);
      Alert.alert('Error', 'Failed to generate PDF.');
    }
  };

  // Compute dynamic KPI cards
  const pendingCount = filteredData.filter(i => i.status === 'Pending').length;
  const approvedCount = filteredData.filter(i => i.status === 'Approved').length;
  const rejectedCount = filteredData.filter(i => i.status === 'Rejected').length;
  const totalCount = filteredData.length;
  const compliancePercent = totalCount > 0 ? Math.round(((approvedCount + pendingCount) / totalCount) * 100) : 0;

  // Main View
  return (
    <SafeAreaView style={styles.container}>
      {/* Detail View Modal */}
      <Modal visible={!!selectedPlan} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.profilePanel}>
            <View style={styles.panelHeader}>
              <Text style={styles.panelTitle}>Tour Plan Review</Text>
              <TouchableOpacity onPress={() => setSelectedPlan(null)} style={{ padding: 4 }}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ padding: 20 }}>
              {selectedPlan && (
                <>
                  <Text style={styles.detailSectionTitle}>1. MR INFORMATION</Text>
                  
                  <View style={styles.detailStack}>
                    <Text style={styles.detailLabel}>MR CODE</Text>
                    <Text style={styles.detailValue}>{selectedPlan.mrCode || '-'}</Text>
                  </View>
                  <View style={styles.detailDividerLight} />

                  <View style={styles.detailStack}>
                    <Text style={styles.detailLabel}>MR NAME</Text>
                    <Text style={styles.detailValue}>{selectedPlan.mrName || '-'}</Text>
                  </View>
                  <View style={styles.detailDividerLight} />

                  <View style={styles.detailStack}>
                    <Text style={styles.detailLabel}>HEADQUARTERS</Text>
                    <Text style={styles.detailValue}>{selectedPlan.headquarters || '-'}</Text>
                  </View>
                  <View style={styles.detailDividerLight} />

                  <View style={styles.detailStack}>
                    <Text style={styles.detailLabel}>TERRITORY</Text>
                    <Text style={styles.detailValue}>{selectedPlan.territory || '-'}</Text>
                  </View>

                  <View style={styles.detailDivider} />

                  <Text style={styles.detailSectionTitle}>2. TOUR INFORMATION</Text>
                  
                  <View style={styles.detailStack}>
                    <Text style={styles.detailLabel}>TOUR MONTH</Text>
                    <Text style={styles.detailValue}>{selectedPlan.tourMonth || '-'}</Text>
                  </View>
                  <View style={styles.detailDividerLight} />

                  <View style={styles.detailStack}>
                    <Text style={styles.detailLabel}>TOUR DATE</Text>
                    <Text style={styles.detailValue}>{selectedPlan.date || '-'}</Text>
                  </View>
                  <View style={styles.detailDividerLight} />

                  <View style={styles.detailStack}>
                    <Text style={styles.detailLabel}>TOUR TYPE</Text>
                    <Text style={styles.detailValue}>{selectedPlan.tourType || '-'}</Text>
                  </View>
                  <View style={styles.detailDividerLight} />

                  <View style={styles.detailStack}>
                    <Text style={styles.detailLabel}>PLANNED AREA</Text>
                    <Text style={styles.detailValue}>{selectedPlan.plannedArea || '-'}</Text>
                  </View>
                  <View style={styles.detailDividerLight} />

                  <View style={styles.detailStack}>
                    <Text style={styles.detailLabel}>PLANNED ROUTE</Text>
                    <Text style={styles.detailValue}>{selectedPlan.plannedRoute || '-'}</Text>
                  </View>

                  <View style={styles.detailDivider} />

                  <Text style={styles.detailSectionTitle}>3. PLANNED VISITS</Text>
                  {selectedPlan.plannedVisits && selectedPlan.plannedVisits.length > 0 ? (
                    <View style={styles.visitTable}>
                      <View style={styles.visitTableHeader}>
                        <Text style={[styles.visitTableCol, { flex: 0.8 }]}>Type</Text>
                        <Text style={[styles.visitTableCol, { flex: 1.2 }]}>Name</Text>
                        <Text style={[styles.visitTableCol, { flex: 1 }]}>Location</Text>
                        <Text style={[styles.visitTableCol, { flex: 0.8 }]}>Time</Text>
                      </View>
                      {selectedPlan.plannedVisits.map((visit: any, index: number) => (
                        <View key={index} style={styles.visitTableRow}>
                          <View style={[styles.visitTableColData, { flex: 0.8 }]}>
                            <View style={styles.visitTypeBadge}>
                              <Text style={styles.visitTypeBadgeText}>{visit.type || '-'}</Text>
                            </View>
                          </View>
                          <Text style={[styles.visitTableColData, { flex: 1.2 }]}>{visit.name || '-'}</Text>
                          <Text style={[styles.visitTableColData, { flex: 1 }]}>{visit.location || '-'}</Text>
                          <Text style={[styles.visitTableColData, { flex: 0.8 }]}>{visit.time || '-'}</Text>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <Text style={[{ flex: 1, marginLeft: 8, fontSize: 13, color: '#334155' }, { outlineStyle: 'none' } as any]}>-</Text>
                  )}

                  <View style={styles.detailDivider} />

                  <Text style={styles.detailSectionTitle}>4. APPROVAL INFORMATION</Text>
                  
                  <View style={styles.detailStack}>
                    <Text style={styles.detailLabel}>SUBMITTED DATE</Text>
                    <Text style={styles.detailValue}>{selectedPlan.submittedDate || '-'}</Text>
                  </View>
                  <View style={styles.detailDividerLight} />

                  <View style={styles.detailStack}>
                    <Text style={styles.detailLabel}>APPROVAL STATUS</Text>
                    <View style={{ alignSelf: 'flex-start', marginTop: 4 }}>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedPlan.status).bg }]}>
                        <Text style={[styles.statusText, { color: getStatusColor(selectedPlan.status).text }]}>{selectedPlan.status || '-'}</Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.detailDividerLight} />

                  <View style={styles.detailStack}>
                    <Text style={styles.detailLabel}>APPROVED BY</Text>
                    <Text style={styles.detailValue}>{selectedPlan.approvedBy || '-'}</Text>
                  </View>
                  <View style={styles.detailDividerLight} />

                  <View style={styles.detailStack}>
                    <Text style={styles.detailLabel}>APPROVAL DATE</Text>
                    <Text style={styles.detailValue}>{selectedPlan.approvalDate || '-'}</Text>
                  </View>

                  <View style={styles.detailDivider} />

                  <Text style={styles.detailSectionTitle}>5. REMARKS</Text>
                  
                  <View style={styles.detailStack}>
                    <Text style={styles.detailLabel}>MR REMARKS</Text>
                    <Text style={styles.detailValue}>{selectedPlan.mrRemarks || '-'}</Text>
                  </View>
                  <View style={styles.detailDividerLight} />

                  <View style={styles.detailStack}>
                    <Text style={styles.detailLabel}>ASM REMARKS</Text>
                    <Text style={styles.detailValue}>{selectedPlan.asmRemarks || '-'}</Text>
                  </View>
                  
                  <View style={{ height: 40 }} />
                </>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.profileCloseBtn} onPress={() => setSelectedPlan(null)}>
                <Text style={styles.profileCloseBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16 }}>
        
        {/* Header Area */}
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#1E293B" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.pageTitle}>Tour Planning (MTP)</Text>
            <Text style={styles.pageSubtitle}>Manage and approve team tour plans.</Text>
          </View>
          <View style={{ position: 'relative', zIndex: 20 }}>
            <TouchableOpacity style={styles.exportBtn} onPress={() => setIsExportDropdownOpen(!isExportDropdownOpen)}>
              <Ionicons name="download-outline" size={16} color="#475569" />
              <Text style={styles.exportBtnText}>Export</Text>
              <Ionicons name="chevron-down" size={16} color="#475569" />
            </TouchableOpacity>
            
            {isExportDropdownOpen && (
              <View style={styles.exportDropdownMenu}>
                <TouchableOpacity style={styles.exportDropdownItem} onPress={() => { setIsExportDropdownOpen(false); generateCSV(); }}>
                  <Text style={styles.exportDropdownItemText}>Export as CSV</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.exportDropdownItem} onPress={() => { setIsExportDropdownOpen(false); generatePDF(); }}>
                  <Text style={styles.exportDropdownItemText}>Export as PDF</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <View style={[styles.iconCircle, { backgroundColor: '#FFFBEB' }]}>
              <Ionicons name="time-outline" size={20} color="#F59E0B" />
            </View>
            <Text style={styles.summaryCardLabel}>Pending Tours</Text>
            <Text style={styles.summaryCardValue}>{pendingCount}</Text>
          </View>
          <View style={styles.summaryCard}>
            <View style={[styles.iconCircle, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="checkmark-circle-outline" size={20} color="#10B981" />
            </View>
            <Text style={styles.summaryCardLabel}>Approved Tours</Text>
            <Text style={styles.summaryCardValue}>{approvedCount}</Text>
          </View>
          <View style={styles.summaryCard}>
            <View style={[styles.iconCircle, { backgroundColor: '#FEF2F2' }]}>
              <Ionicons name="close-circle-outline" size={20} color="#EF4444" />
            </View>
            <Text style={styles.summaryCardLabel}>Rejected Tours</Text>
            <Text style={styles.summaryCardValue}>{rejectedCount}</Text>
          </View>
          <View style={styles.summaryCard}>
            <View style={[styles.iconCircle, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="document-text-outline" size={20} color="#3B82F6" />
            </View>
            <Text style={styles.summaryCardLabel}>Compliance %</Text>
            <Text style={styles.summaryCardValue}>{compliancePercent}%</Text>
          </View>
        </View>

        {/* Filters */}
        <View style={styles.filterSection}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={18} color="#94A3B8" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by MR Name, Territory..."
              placeholderTextColor="#94A3B8"
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>
          
          <View style={styles.filterDropdownsRow}>
            {/* Month Dropdown */}
            <View style={{ flex: 1, zIndex: 10 }}>
              <TouchableOpacity style={styles.dropdownBtn} onPress={() => setIsMonthDropdownOpen(!isMonthDropdownOpen)}>
                <Text style={styles.dropdownBtnText}>{selectedMonth}</Text>
                <Ionicons name="chevron-down" size={16} color="#64748B" />
              </TouchableOpacity>
              {isMonthDropdownOpen && (
                <View style={styles.dropdownMenu}>
                  {['All', 'Current Month', 'Next Month', 'Previous Month', 'This Quarter'].map(opt => (
                    <TouchableOpacity key={opt} style={styles.dropdownItem} onPress={() => { setSelectedMonth(opt); setIsMonthDropdownOpen(false); }}>
                      <Text style={styles.dropdownItemText}>{opt}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Status Dropdown */}
            <View style={{ flex: 1, zIndex: 10 }}>
              <TouchableOpacity style={styles.dropdownBtn} onPress={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}>
                <Text style={styles.dropdownBtnText}>{selectedStatus}</Text>
                <Ionicons name="chevron-down" size={16} color="#64748B" />
              </TouchableOpacity>
              {isStatusDropdownOpen && (
                <View style={styles.dropdownMenu}>
                  {['All', 'Approved', 'Pending', 'Rejected'].map(opt => (
                    <TouchableOpacity key={opt} style={styles.dropdownItem} onPress={() => { setSelectedStatus(opt); setIsStatusDropdownOpen(false); }}>
                      <Text style={styles.dropdownItemText}>{opt}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Data List (Mobile layout of table) */}
        {loading ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#4F46E5" />
            <Text style={{ marginTop: 10, color: '#64748B' }}>Loading Tour Plans...</Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {filteredData.map(item => (
              <View key={item.id} style={styles.listItem}>
              <View style={styles.listHeaderRow}>
                <Text style={styles.listMrName}>{item.mrName}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status).bg }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(item.status).text }]}>{item.status}</Text>
                </View>
              </View>
              <Text style={styles.listTerritory}>{item.territory}</Text>
              
              <View style={styles.listDetailsRow}>
                <View style={styles.listStat}>
                          <Text style={styles.listStatLabel}>TOUR DATE</Text>
                  <Text style={styles.listStatValue}>{item.date}</Text>
                </View>
                <View style={styles.listStat}>
                  <Text style={styles.listStatLabel}>PLANNED VISITS</Text>
                  <Text style={styles.listStatValue}>{item.visits}</Text>
                </View>
              </View>

              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => setSelectedPlan(item)}>
                  <Ionicons name="eye-outline" size={16} color="#64748B" />
                  <Text style={styles.actionBtnText}>View</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
          {filteredData.length === 0 && (
            <Text style={{ textAlign: 'center', padding: 20, color: '#94A3B8' }}>No plans found.</Text>
          )}
        </View>
        )}
        
        {/* Bottom spacer */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default ASMTourPlanningScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  headerRow: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  backBtn: {
    marginRight: 12,
    padding: 4,
    marginTop: 2
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4
  },
  pageSubtitle: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24
  },
  exportBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#FFF', 
    borderWidth: 1, 
    borderColor: '#E2E8F0', 
    paddingHorizontal: 8, 
    paddingVertical: 6, 
    borderRadius: 6, 
    gap: 4,
    alignSelf: 'flex-start'
  },
  exportBtnText: { 
    fontSize: 12, 
    fontWeight: '600', 
    color: '#334155' 
  },
  exportDropdownMenu: {
    position: 'absolute',
    top: 42,
    right: 0,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    width: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    zIndex: 1000
  },
  exportDropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  exportDropdownItemText: {
    fontSize: 13,
    color: '#334155'
  },
  summaryCard: {
    backgroundColor: '#FFF',
    width: '48%', // 2 cards per row
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryCardLabel: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 8,
  },
  summaryCardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  filterSection: {
    marginBottom: 20,
    zIndex: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#1E293B',
    ...(Platform.OS === 'web' && { outlineStyle: 'none' })
  },
  filterDropdownsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
  },
  dropdownBtnText: {
    fontSize: 13,
    color: '#475569',
  },
  dropdownMenu: {
    position: 'absolute',
    top: 44,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 20,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dropdownItemText: {
    fontSize: 13,
    color: '#1E293B',
  },
  listContainer: {
    marginBottom: 20,
  },
  listItem: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  listMrName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  listTerritory: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 12,
  },
  listDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  listStat: {
    flex: 1,
  },
  listStatLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
    marginBottom: 4,
  },
  listStatValue: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '500',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
  },
  actionBtnText: {
    fontSize: 13,
    color: '#64748B',
    marginLeft: 4,
  },
  // Detail View Styles (Modal)
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', flexDirection: 'row', justifyContent: 'flex-end' },
  profilePanel: { width: '85%', maxWidth: 420, backgroundColor: '#FFF', height: '100%', alignSelf: 'flex-end', shadowColor: '#000', shadowOffset: { width: -5, height: 0 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 15 },
  panelHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  panelTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  modalFooter: { padding: 16, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  profileCloseBtn: { width: '100%', paddingVertical: 12, borderRadius: 8, backgroundColor: '#F8FAFC', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  profileCloseBtnText: { color: '#334155', fontWeight: 'bold', fontSize: 14 },
  
  detailDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 16
  },
  detailDividerLight: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12
  },
  detailSectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 16
  },
  detailStack: {
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
    textTransform: 'uppercase'
  },
  detailValue: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '500',
  },
  visitTable: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    overflow: 'hidden'
  },
  visitTableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0'
  },
  visitTableCol: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#64748B'
  },
  visitTableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    alignItems: 'center'
  },
  visitTableColData: {
    fontSize: 13,
    color: '#1E293B'
  },
  visitTypeBadge: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: 'flex-start'
  },
  visitTypeBadgeText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '500'
  }
});
