import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Linking,
  Platform,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getDoctors } from '../../services/doctorService';
import { getChemists } from '../../services/chemistService';
import { getHospitals } from '../../services/hospitalService';
import { getStockists } from '../../services/stockistService';

interface Customer {
  id: number;
  name: string;
  type: 'Doctor' | 'Chemist' | 'Hospital' | 'Stockist';
  subText: string;      // Specialty for doctors, Proprietor for chemists, Procurement manager for hospitals, etc.
  phone: string;
  address: string;
  lastVisitDate: string;
  customerCode?: string; // code identifier for searching
  latitude?: number;
  longitude?: number;
  categoryBadge?: string; // e.g. "Class A", "Key Client"
  outstandingBalance?: number;
  creditLimit?: number;
  availableCredit?: number;
  lastPaymentDate?: string;
  pendingInvoices?: number;
}

const CustomerDirectoryScreen = () => {
  const navigation = useNavigation<any>();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'All' | 'Doctor' | 'Chemist' | 'Hospital' | 'Stockist'>('All');
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedProfileCustomer, setSelectedProfileCustomer] = useState<Customer | null>(null);

  const customAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    setLoading(true);
    setError(null);
    try {
      let docList: any[] = [];
      let chemList: any[] = [];
      let hospList: any[] = [];
      let stockList: any[] = [];

      try {
        const docRes = await getDoctors();
        docList = docRes.data || docRes || [];
      } catch (e) { console.log('Docs load error in directory:', e); }

      try {
        const chemRes = await getChemists();
        chemList = chemRes.data || chemRes || [];
      } catch (e) { console.log('Chemists load error in directory:', e); }

      try {
        const hospRes = await getHospitals();
        hospList = hospRes.data || hospRes || [];
      } catch (e) { console.log('Hospitals load error in directory:', e); }

      try {
        const stockRes = await getStockists();
        stockList = stockRes.data || stockRes || [];
      } catch (e) { console.log('Stockists load error in directory:', e); }

      // Map doctors
      const mappedDocs: Customer[] = (Array.isArray(docList) ? docList : []).map((d: any) => ({
        id: Number(d.id || d._id) || 0,
        customerCode: d.doctorCode || d.code || 'N/A',
        name: d.name || d.doctorName || 'N/A',
        type: 'Doctor' as const,
        subText: d.specialization || d.specialty || 'General Practitioner',
        phone: d.mobile || d.phone || 'N/A',
        address: d.clinicAddress || d.address || 'N/A',
        lastVisitDate: d.lastVisitDate || d.last_visit_date || 'Never Visited',
        categoryBadge: d.classCategory || d.category || undefined,
        latitude: d.latitude != null ? Number(d.latitude) : undefined,
        longitude: d.longitude != null ? Number(d.longitude) : undefined,
      })).filter(c => c.id !== 0);

      // Map Chemists
      const mappedChems: Customer[] = (Array.isArray(chemList) ? chemList : []).map((c: any) => ({
        id: Number(c.id || c._id) || 0,
        customerCode: c.chemistCode || c.code || 'N/A',
        name: c.name || c.chemistName || 'N/A',
        type: 'Chemist' as const,
        subText: c.ownerName || c.proprietor ? `Proprietor: ${c.ownerName || c.proprietor}` : 'Proprietor: N/A',
        phone: c.mobile || c.phone || 'N/A',
        address: c.address || 'N/A',
        lastVisitDate: c.lastVisitDate || c.last_visit_date || 'Never Visited',
        outstandingBalance: c.outstandingBalance != null ? Number(c.outstandingBalance) : undefined,
        creditLimit: c.creditLimit != null ? Number(c.creditLimit) : undefined,
        availableCredit: c.availableCredit != null ? Number(c.availableCredit) : undefined,
        lastPaymentDate: c.lastPaymentDate || undefined,
        pendingInvoices: c.pendingInvoices != null ? Number(c.pendingInvoices) : undefined,
        latitude: c.latitude != null ? Number(c.latitude) : undefined,
        longitude: c.longitude != null ? Number(c.longitude) : undefined,
      })).filter(c => c.id !== 0);

      // Map Hospitals
      const mappedHosps: Customer[] = (Array.isArray(hospList) ? hospList : []).map((h: any) => ({
        id: Number(h.id || h._id) || 0,
        customerCode: h.hospitalCode || h.code || 'N/A',
        name: h.name || h.hospitalName || 'N/A',
        type: 'Hospital' as const,
        subText: h.contactPerson || h.procurement ? `Procurement: ${h.contactPerson || h.procurement}` : 'Procurement: N/A',
        phone: h.mobile || h.phone || 'N/A',
        address: h.address || 'N/A',
        lastVisitDate: h.lastVisitDate || h.last_visit_date || 'Never Visited',
        categoryBadge: h.categoryBadge || h.category || undefined,
        outstandingBalance: h.outstandingBalance != null ? Number(h.outstandingBalance) : undefined,
        creditLimit: h.creditLimit != null ? Number(h.creditLimit) : undefined,
        availableCredit: h.availableCredit != null ? Number(h.availableCredit) : undefined,
        lastPaymentDate: h.lastPaymentDate || undefined,
        pendingInvoices: h.pendingInvoices != null ? Number(h.pendingInvoices) : undefined,
        latitude: h.latitude != null ? Number(h.latitude) : undefined,
        longitude: h.longitude != null ? Number(h.longitude) : undefined,
      })).filter(c => c.id !== 0);

      // Map Stockists
      const mappedStocks: Customer[] = (Array.isArray(stockList) ? stockList : []).map((s: any) => ({
        id: Number(s.id || s._id) || 0,
        customerCode: s.stockistCode || s.code || 'N/A',
        name: s.name || s.stockistName || 'N/A',
        type: 'Stockist' as const,
        subText: s.contactPerson || s.owner ? `Manager: ${s.contactPerson || s.owner}` : 'Manager: N/A',
        phone: s.mobile || s.phone || 'N/A',
        address: s.address || 'N/A',
        lastVisitDate: s.lastVisitDate || s.last_visit_date || 'Never Visited',
        outstandingBalance: s.outstandingBalance != null ? Number(s.outstandingBalance) : undefined,
        creditLimit: s.creditLimit != null ? Number(s.creditLimit) : undefined,
        availableCredit: s.availableCredit != null ? Number(s.availableCredit) : undefined,
        lastPaymentDate: s.lastPaymentDate || undefined,
        pendingInvoices: s.pendingInvoices != null ? Number(s.pendingInvoices) : undefined,
        latitude: s.latitude != null ? Number(s.latitude) : undefined,
        longitude: s.longitude != null ? Number(s.longitude) : undefined,
      })).filter(c => c.id !== 0);

      // Combine and sort alphabetically by customer name
      const sortedCombined = [...mappedDocs, ...mappedChems, ...mappedHosps, ...mappedStocks];
      sortedCombined.sort((a, b) => a.name.localeCompare(b.name));
      setCustomers(sortedCombined);
    } catch (err: any) {
      console.error('Customers Directory Load Error:', err);
      setError('Failed to fetch customer directory records. Pull down to try again.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCustomers();
    setRefreshing(false);
  };

  const handleCall = (phone: string) => {
    const telUrl = `tel:${phone}`;
    Linking.canOpenURL(telUrl)
      .then((supported) => {
        if (supported) {
          Linking.openURL(telUrl);
        } else {
          customAlert('Not Supported', `Dialer is not supported on this platform. Phone: ${phone}`);
        }
      })
      .catch(() => customAlert('Error', 'Unable to open phone dialer'));
  };

  const handleWhatsApp = (phone: string, name: string) => {
    const cleanName = name.startsWith('Dr.') ? name : `Mr./Ms. ${name}`;
    const waUrl = `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(cleanName)},%20this%20is%20MJ%20Healthcare.`;
    Linking.canOpenURL(waUrl)
      .then((supported) => {
        if (supported) {
          Linking.openURL(waUrl);
        } else {
          Linking.openURL(`https://api.whatsapp.com/send?phone=${phone.replace(/[^0-9]/g, '')}`);
        }
      })
      .catch(() => customAlert('Error', 'Unable to launch WhatsApp chat'));
  };

  const handleDirections = (customer: Customer) => {
    const hasCoords = customer.latitude != null && customer.longitude != null;
    const query = hasCoords ? `${customer.latitude},${customer.longitude}` : customer.address;
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
    Linking.openURL(mapsUrl).catch(() =>
      customAlert('Error', 'Failed to open navigation directions')
    );
  };

  const handleRecordVisit = (customer: Customer) => {
    if (customer.type === 'Doctor') {
      navigation.navigate('DoctorVisit', { preselectedDoctor: customer.name });
    } else if (customer.type === 'Chemist') {
      navigation.navigate('ChemistVisit', { preselectedChemist: customer.name });
    } else if (customer.type === 'Hospital') {
      // NOTE: Hospitals are logged under Chemist Visit flow to match the ERP procurement workflow
      navigation.navigate('ChemistVisit', { preselectedChemist: customer.name });
    } else if (customer.type === 'Stockist') {
      // NOTE: Stockists do not have a dedicated visit screen but MRs can book orders directly for them
      navigation.navigate('BookOrder', { preselectedCustomer: customer.name, customerType: 'Stockist' });
    }
  };

  const filteredCustomers = customers.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.subText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.phone.includes(searchQuery) ||
      (item.customerCode && item.customerCode.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesTab = activeTab === 'All' || item.type === activeTab;

    return matchesSearch && matchesTab;
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>⬅️ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>👥 Customer Directory</Text>
        <Text style={styles.headerSubtitle}>Manage doctors, chemist shops & accounts</Text>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="🔍 Search name, specialty, address, mobile..."
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Segment Tabs */}
      <View style={styles.tabsContainer}>
        {(['All', 'Doctor', 'Chemist', 'Hospital', 'Stockist'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab === 'All' ? 'All' : `${tab}s`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.loaderCard}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loaderText}>Loading customer directory...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadCustomers}>
            <Text style={styles.retryButtonText}>🔄 Retry Loading Contacts</Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* Directory List */
        <ScrollView 
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4F46E5']} />
          }
        >
          {filteredCustomers.length > 0 ? (
            filteredCustomers.map((customer) => {
              let avatarEmoji = '🩺';
              let avatarBg = '#E0F2F1';
              let colorTheme = '#06B6D4';

              if (customer.type === 'Chemist') {
                avatarEmoji = '💊';
                avatarBg = '#FFF3E0';
                colorTheme = '#F59E0B';
              } else if (customer.type === 'Hospital') {
                avatarEmoji = '🏢';
                avatarBg = '#EEF2F6';
                colorTheme = '#4F46E5';
              } else if (customer.type === 'Stockist') {
                avatarEmoji = '📦';
                avatarBg = '#E0F2FE';
                colorTheme = '#10B981';
              }

              return (
                <TouchableOpacity
                  key={customer.id}
                  activeOpacity={0.9}
                  onPress={() => setSelectedProfileCustomer(customer)}
                  style={[styles.card, { borderLeftColor: colorTheme }]}
                >
                  {/* Upper row */}
                  <View style={styles.cardHeader}>
                    <View style={[styles.avatar, { backgroundColor: avatarBg }]}>
                      <Text style={styles.avatarEmoji}>{avatarEmoji}</Text>
                    </View>

                    <View style={{ flex: 1 }}>
                      <View style={styles.titleRow}>
                        <Text style={styles.customerName}>{customer.name}</Text>
                        {customer.categoryBadge && (
                          <Text style={styles.badgeText}>{customer.categoryBadge}</Text>
                        )}
                      </View>
                      <Text style={styles.subText}>{customer.subText}</Text>
                    </View>
                  </View>

                  {/* Body Details */}
                  <View style={styles.cardBody}>
                    <Text style={styles.detailText}>📍 {customer.address}</Text>
                    <Text style={styles.detailText}>📞 {customer.phone}</Text>
                    <Text style={styles.visitText}>🕒 Last Visited: {customer.lastVisitDate}</Text>
                    
                    {customer.outstandingBalance != null && (
                      <Text style={styles.outstandingText}>
                        💸 Outstanding Dues: ₹{Number(customer.outstandingBalance).toLocaleString()}
                      </Text>
                    )}
                  </View>

                  {/* Actions Bar */}
                  <View style={styles.actionsBar}>
                    <View style={styles.leftActions}>
                      <TouchableOpacity
                        style={styles.circleBtn}
                        onPress={() => handleCall(customer.phone)}
                      >
                        <Text style={styles.actionIcon}>📞</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.circleBtn}
                        onPress={() => handleWhatsApp(customer.phone, customer.name)}
                      >
                        <Text style={styles.actionIcon}>💬</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.circleBtn}
                        onPress={() => handleDirections(customer)}
                      >
                        <Text style={styles.actionIcon}>🗺️</Text>
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                      style={[styles.recordBtn, { backgroundColor: colorTheme }]}
                      onPress={() => handleRecordVisit(customer)}
                    >
                      <Text style={styles.recordBtnText}>Log New Visit</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>
                {searchQuery ? "No customer contacts match your search." : "No customer contacts found."}
              </Text>
            </View>
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* Customer Profile Modal (Central Hub) */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={selectedProfileCustomer !== null}
        onRequestClose={() => setSelectedProfileCustomer(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedProfileCustomer && (
              <>
                <Text style={styles.modalTitle}>👤 Customer Profile</Text>
                
                <View style={styles.profileHeader}>
                  <Text style={styles.profileName}>{selectedProfileCustomer.name}</Text>
                  <Text style={styles.profileType}>Type: {selectedProfileCustomer.type}</Text>
                  {selectedProfileCustomer.categoryBadge && (
                    <Text style={styles.profileBadge}>{selectedProfileCustomer.categoryBadge}</Text>
                  )}
                </View>

                <View style={styles.profileSection}>
                  <Text style={styles.sectionTitle}>Details</Text>
                  <Text style={styles.profileText}>📞 Mobile: {selectedProfileCustomer.phone}</Text>
                  <Text style={styles.profileText}>📍 Address: {selectedProfileCustomer.address}</Text>
                  <Text style={styles.profileText}>ℹ️ Info: {selectedProfileCustomer.subText}</Text>
                  <Text style={styles.profileText}>🕒 Last Visited: {selectedProfileCustomer.lastVisitDate}</Text>
                </View>

                {(selectedProfileCustomer.type === 'Chemist' || selectedProfileCustomer.type === 'Hospital' || selectedProfileCustomer.type === 'Stockist') && (
                  <View style={styles.profileSection}>
                    <Text style={styles.sectionTitle}>Financial Summary</Text>
                    {selectedProfileCustomer.outstandingBalance != null && (
                      <Text style={[styles.profileText, { color: '#E11D48', fontWeight: 'bold' }]}>
                        💸 Outstanding Balance: ₹{Number(selectedProfileCustomer.outstandingBalance).toLocaleString()}
                      </Text>
                    )}
                    {selectedProfileCustomer.creditLimit != null && (
                      <Text style={styles.profileText}>
                        💳 Credit Limit: ₹{Number(selectedProfileCustomer.creditLimit).toLocaleString()}
                      </Text>
                    )}
                    {selectedProfileCustomer.availableCredit != null && (
                      <Text style={styles.profileText}>
                        ✅ Available Credit: ₹{Number(selectedProfileCustomer.availableCredit).toLocaleString()}
                      </Text>
                    )}
                    {selectedProfileCustomer.lastPaymentDate ? (
                      <Text style={styles.profileText}>
                        📅 Last Payment Date: {selectedProfileCustomer.lastPaymentDate}
                      </Text>
                    ) : null}
                    {selectedProfileCustomer.pendingInvoices != null && (
                      <Text style={styles.profileText}>
                        📄 Pending Invoices: {selectedProfileCustomer.pendingInvoices}
                      </Text>
                    )}
                  </View>
                )}

                <View style={styles.modalButtonsRow}>
                  <TouchableOpacity
                    style={[styles.modalBtn, styles.modalCloseBtn]}
                    onPress={() => setSelectedProfileCustomer(null)}
                  >
                    <Text style={styles.modalCloseText}>Close</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.modalBtn, styles.modalActionBtn]}
                    onPress={() => {
                      const cust = selectedProfileCustomer;
                      setSelectedProfileCustomer(null);
                      handleRecordVisit(cust);
                    }}
                  >
                    <Text style={styles.modalActionText}>Log Visit</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default CustomerDirectoryScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#4F46E5',
    paddingTop: 60,
    paddingBottom: 25,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 15,
    top: 50,
    zIndex: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  backButtonText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#E0E7FF',
    textAlign: 'center',
    marginTop: 6,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginTop: -18,
    zIndex: 10,
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 20,
    fontSize: 14,
    color: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 4,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 15,
    justifyContent: 'space-between',
    gap: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
  },
  activeTabButton: {
    backgroundColor: '#4F46E5',
  },
  tabText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 15,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    borderLeftWidth: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 20,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 6,
  },
  customerName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#4F46E5',
    backgroundColor: '#EEF2F6',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 8,
    overflow: 'hidden',
  },
  subText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  cardBody: {
    marginTop: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    gap: 4,
  },
  detailText: {
    fontSize: 12,
    color: '#475569',
  },
  visitText: {
    fontSize: 11,
    color: '#64748B',
    fontStyle: 'italic',
    marginTop: 2,
  },
  outstandingText: {
    fontSize: 12,
    color: '#E11D48',
    fontWeight: 'bold',
    marginTop: 2,
  },
  actionsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  leftActions: {
    flexDirection: 'row',
    gap: 8,
  },
  circleBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EEF2F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIcon: {
    fontSize: 14,
  },
  recordBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  recordBtnText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  // Modal (Central Profile Hub) styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 16,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 12,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#312E81',
    textAlign: 'center',
  },
  profileType: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  profileBadge: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#4F46E5',
    backgroundColor: '#EEF2F6',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginTop: 6,
    overflow: 'hidden',
  },
  profileSection: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    gap: 6,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#475569',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 4,
    marginBottom: 4,
  },
  profileText: {
    fontSize: 12,
    color: '#334155',
  },
  modalButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCloseBtn: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalCloseText: {
    color: '#64748B',
    fontWeight: 'bold',
    fontSize: 13,
  },
  modalActionBtn: {
    backgroundColor: '#4F46E5',
  },
  modalActionText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  // Loader & Retry style
  loaderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    marginTop: 20,
    marginHorizontal: 20,
  },
  loaderText: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 10,
  },
  errorContainer: {
    backgroundColor: '#FFF1F2',
    borderColor: '#FECDD3',
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginTop: 20,
    marginHorizontal: 20,
  },
  errorText: {
    fontSize: 13,
    color: '#BE123C',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#BE123C',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 10,
  },
  retryButtonText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});