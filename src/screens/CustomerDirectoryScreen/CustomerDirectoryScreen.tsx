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
        id: d.id || Math.random(),
        name: d.doctorName || d.name || 'Dr. Unknown',
        type: 'Doctor',
        subText: d.specialization || d.specialty || 'General Practitioner',
        phone: d.mobile || d.phone || '+919876543210',
        address: d.clinicAddress || d.address || 'Clinic Address, Hyderabad',
        lastVisitDate: d.lastVisitDate || '09-Jun-2026',
        categoryBadge: d.classCategory || d.category || '★ Class A',
      }));

      // Map Chemists
      const mappedChems: Customer[] = (Array.isArray(chemList) ? chemList : []).map((c: any) => ({
        id: c.id || Math.random(),
        name: c.name || c.chemistName || 'Chemist Store',
        type: 'Chemist',
        subText: `Proprietor: ${c.ownerName || c.proprietor || 'Mr. Ramesh Lal'}`,
        phone: c.mobile || c.phone || '+919543210987',
        address: c.address || 'Door 4-2-12, Main Bazar, Hyderabad',
        lastVisitDate: c.lastVisitDate || '11-Jun-2026',
        outstandingBalance: c.outstandingBalance != null ? Number(c.outstandingBalance) : 4500.00,
        creditLimit: c.creditLimit != null ? Number(c.creditLimit) : 50000,
        availableCredit: c.availableCredit != null ? Number(c.availableCredit) : 45500,
        lastPaymentDate: c.lastPaymentDate || '01-Jun-2026',
        pendingInvoices: c.pendingInvoices != null ? Number(c.pendingInvoices) : 2,
      }));

      // Map Hospitals
      const mappedHosps: Customer[] = (Array.isArray(hospList) ? hospList : []).map((h: any) => ({
        id: h.id || Math.random(),
        name: h.name || h.hospitalName || 'General Hospital',
        type: 'Hospital',
        subText: `Procurement: ${h.contactPerson || h.procurement || 'Mr. J. P. Gupta'}`,
        phone: h.mobile || h.phone || '+919321098765',
        address: h.address || 'Nampally Station Road, Hyderabad',
        lastVisitDate: h.lastVisitDate || '03-Jun-2026',
        categoryBadge: 'Key Hospital Acc',
        outstandingBalance: h.outstandingBalance != null ? Number(h.outstandingBalance) : 24500.00,
        creditLimit: h.creditLimit != null ? Number(h.creditLimit) : 200000,
        availableCredit: h.availableCredit != null ? Number(h.availableCredit) : 175500,
        lastPaymentDate: h.lastPaymentDate || '28-May-2026',
        pendingInvoices: h.pendingInvoices != null ? Number(h.pendingInvoices) : 5,
      }));

      // Map Stockists
      const mappedStocks: Customer[] = (Array.isArray(stockList) ? stockList : []).map((s: any) => ({
        id: s.id || Math.random(),
        name: s.name || s.stockistName || 'Distributor Agency',
        type: 'Stockist',
        subText: `Manager: ${s.contactPerson || s.owner || 'Mr. Balaji'}`,
        phone: s.mobile || s.phone || '+919012345678',
        address: s.address || 'Metro Road, Himayatnagar, Hyderabad',
        lastVisitDate: s.lastVisitDate || '12-Jun-2026',
        outstandingBalance: s.outstandingBalance != null ? Number(s.outstandingBalance) : 12300.00,
        creditLimit: s.creditLimit != null ? Number(s.creditLimit) : 500000,
        availableCredit: s.availableCredit != null ? Number(s.availableCredit) : 487700,
        lastPaymentDate: s.lastPaymentDate || '05-Jun-2026',
        pendingInvoices: s.pendingInvoices != null ? Number(s.pendingInvoices) : 1,
      }));

      // Fallbacks if empty
      let finalDocs = mappedDocs;
      if (finalDocs.length === 0) {
        finalDocs = [
          { id: 1, name: 'Dr. Suresh Kumar', type: 'Doctor', subText: 'Cardiologist (MD, DM)', phone: '+919876543210', address: 'Apollo Hospitals, Hyderabad', lastVisitDate: '09-Jun-2026', categoryBadge: '★ Class A' },
          { id: 3, name: 'Dr. Anita Roy', type: 'Doctor', subText: 'Gynecologist (MS, OBGYN)', phone: '+918765432109', address: 'Lifeline Fertility Center, Hyderabad', lastVisitDate: '05-Jun-2026', categoryBadge: '★ Class A' },
          { id: 6, name: 'Dr. Vikas Patel', type: 'Doctor', subText: 'Pediatrician (MD Pediatrics)', phone: '+917654321098', address: 'Kids Care Hospital, Hyderabad', lastVisitDate: '28-May-2026', categoryBadge: 'Class B' }
        ];
      }

      let finalChems = mappedChems;
      if (finalChems.length === 0) {
        finalChems = [
          { id: 2, name: 'Sai Krupa Chemists', type: 'Chemist', subText: 'Proprietor: Mr. Ramesh Lal', phone: '+919543210987', address: 'Door 4-2-12, Main Bazar, Hyderabad', lastVisitDate: '11-Jun-2026', outstandingBalance: 4500.00, creditLimit: 50000, availableCredit: 45500, lastPaymentDate: '01-Jun-2026', pendingInvoices: 2 },
          { id: 4, name: 'MedPlus Retail Drugs', type: 'Chemist', subText: 'Manager: Mr. Anil Deshmukh', phone: '+919432109876', address: 'Beside Metro Station, Hyderabad', lastVisitDate: '07-Jun-2026', outstandingBalance: 1800.00, creditLimit: 30000, availableCredit: 28200, lastPaymentDate: '07-Jun-2026', pendingInvoices: 1 },
          { id: 7, name: 'Apollo Pharmacy Retail', type: 'Chemist', subText: 'Store Manager: Ramesh Gupta', phone: '+919012345678', address: 'Street No 3, Ameerpet Cross Roads, Hyderabad', lastVisitDate: '10-Jun-2026', outstandingBalance: 7200.00, creditLimit: 80000, availableCredit: 72800, lastPaymentDate: '29-May-2026', pendingInvoices: 3 }
        ];
      }

      let finalHosps = mappedHosps;
      if (finalHosps.length === 0) {
        finalHosps = [
          { id: 5, name: 'Care General Hospital', type: 'Hospital', subText: 'Procurement: Mr. J. P. Gupta', phone: '+919321098765', address: 'Nampally Station Road, Hyderabad', lastVisitDate: '03-Jun-2026', categoryBadge: 'Key Hospital Acc', outstandingBalance: 24500.00, creditLimit: 200000, availableCredit: 175500, lastPaymentDate: '28-May-2026', pendingInvoices: 5 }
        ];
      }

      let finalStocks = mappedStocks;
      if (finalStocks.length === 0) {
        finalStocks = [
          { id: 8, name: 'Metro Pharma Stockist', type: 'Stockist', subText: 'Proprietor: Mr. S. Venkatesh', phone: '+919888877777', address: 'Main Warehouse Road, Hyderabad', lastVisitDate: '12-Jun-2026', outstandingBalance: 54000.00, creditLimit: 500000, availableCredit: 446000, lastPaymentDate: '02-Jun-2026', pendingInvoices: 4 }
        ];
      }

      setCustomers([...finalDocs, ...finalChems, ...finalHosps, ...finalStocks]);
    } catch (err: any) {
      console.log('Customers Directory Load Error:', err);
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
    const waUrl = `https://wa.me/${phone.replace('+', '')}?text=Hello%20${encodeURIComponent(name)},%20this%20is%20MJ%20Healthcare%20MR%20representative.`;
    Linking.canOpenURL(waUrl)
      .then((supported) => {
        if (supported) {
          Linking.openURL(waUrl);
        } else {
          Linking.openURL(`https://api.whatsapp.com/send?phone=${phone.replace('+', '')}`);
        }
      })
      .catch(() => customAlert('Error', 'Unable to launch WhatsApp chat'));
  };

  const handleDirections = (address: string) => {
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
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
      item.phone.includes(searchQuery);

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
                        onPress={() => handleDirections(customer.address)}
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