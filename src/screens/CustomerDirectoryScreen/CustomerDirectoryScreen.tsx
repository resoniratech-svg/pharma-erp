import React, { useState } from 'react';
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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

interface Customer {
  id: number;
  name: string;
  type: 'Doctor' | 'Chemist' | 'Hospital';
  subText: string;      // Specialty for doctors, Owner for chemists, Contact Manager for hospitals
  phone: string;
  address: string;
  lastVisitDate: string;
  categoryBadge?: string; // e.g. "Class A", "Key Client"
  outstandingBalance?: number;
}

const MASTER_CUSTOMERS: Customer[] = [
  {
    id: 1,
    name: 'Dr. Suresh Kumar',
    type: 'Doctor',
    subText: 'Cardiologist (MD, DM)',
    phone: '+919876543210',
    address: 'Apollo Hospitals, Room 204, Jubilee Hills, Hyderabad',
    lastVisitDate: '09-Jun-2026',
    categoryBadge: '★ Class A',
  },
  {
    id: 2,
    name: 'Sai Krupa Chemists',
    type: 'Chemist',
    subText: 'Proprietor: Mr. Ramesh Lal',
    phone: '+919543210987',
    address: 'Door 4-2-12, Main Bazar, Himayatnagar, Hyderabad',
    lastVisitDate: '11-Jun-2026',
    outstandingBalance: 4500.00,
  },
  {
    id: 3,
    name: 'Dr. Anita Roy',
    type: 'Doctor',
    subText: 'Gynecologist (MS, OBGYN)',
    phone: '+918765432109',
    address: 'Lifeline Fertility Center, Barkatpura, Hyderabad',
    lastVisitDate: '05-Jun-2026',
    categoryBadge: '★ Class A',
  },
  {
    id: 4,
    name: 'MedPlus Retail Drugs',
    type: 'Chemist',
    subText: 'Manager: Mr. Anil Deshmukh',
    phone: '+919432109876',
    address: 'Beside Metro Station, Narayanguda, Hyderabad',
    lastVisitDate: '07-Jun-2026',
    outstandingBalance: 1800.00,
  },
  {
    id: 5,
    name: 'Care General Hospital',
    type: 'Hospital',
    subText: 'Procurement: Mr. J. P. Gupta',
    phone: '+919321098765',
    address: 'Nampally Station Road, Abids, Hyderabad',
    lastVisitDate: '03-Jun-2026',
    categoryBadge: 'Key Hospital Acc',
    outstandingBalance: 24500.00,
  },
  {
    id: 6,
    name: 'Dr. Vikas Patel',
    type: 'Doctor',
    subText: 'Pediatrician (MD Pediatrics)',
    phone: '+917654321098',
    address: 'Kids Care Hospital, Somajiguda, Hyderabad',
    lastVisitDate: '28-May-2026',
    categoryBadge: 'Class B',
  },
  {
    id: 7,
    name: 'Apollo Pharmacy Retail',
    type: 'Chemist',
    subText: 'Store Manager: Ramesh Gupta',
    phone: '+919012345678',
    address: 'Street No 3, Ameerpet Cross Roads, Hyderabad',
    lastVisitDate: '10-Jun-2026',
    outstandingBalance: 7200.00,
  }
];

const CustomerDirectoryScreen = () => {
  const navigation = useNavigation<any>();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'All' | 'Doctor' | 'Chemist' | 'Hospital'>('All');

  const customAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
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
          // Fallback to generic web link if whatsapp scheme isn't registered
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
    // Route to appropriate visit entry screens with prefilled route values
    if (customer.type === 'Doctor') {
      navigation.navigate('DoctorVisit', { preselectedDoctor: customer.name });
    } else {
      navigation.navigate('ChemistVisit', { preselectedChemist: customer.name });
    }
  };

  const filteredCustomers = MASTER_CUSTOMERS.filter((item) => {
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
        {(['All', 'Doctor', 'Chemist', 'Hospital'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab}s
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Directory List */}
      <ScrollView contentContainerStyle={styles.listContainer}>
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
            }

            return (
              <View key={customer.id} style={[styles.card, { borderLeftColor: colorTheme }]}>
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
                  
                  {customer.outstandingBalance !== undefined && (
                    <Text style={styles.outstandingText}>
                      💸 Outstanding Dues: ₹{customer.outstandingBalance.toLocaleString()}
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
              </View>
            );
          })
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No matching customer contacts found.</Text>
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
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
    gap: 6,
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
    fontSize: 11,
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
});