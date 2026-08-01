import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const NSMStatePerformanceScreen = () => {
  const [activeTab, setActiveTab] = useState<'Sales' | 'Visits' | 'Orders' | 'Collection'>('Sales');
  const [searchQuery, setSearchQuery] = useState('');

  // 4.1 Sales Performance Data
  const salesData = [
    { state: 'Maharashtra', rsm: 'Arun Kumar', target: '₹15.00 Cr', achieved: '₹13.50 Cr', pct: '90.0%', orders: '4,520', revenue: '₹13.50 Cr' },
    { state: 'Gujarat', rsm: 'Rajesh Singh', target: '₹12.00 Cr', achieved: '₹9.50 Cr', pct: '79.2%', orders: '3,100', revenue: '₹9.50 Cr' },
    { state: 'Karnataka', rsm: 'Priya Sharma', target: '₹18.00 Cr', achieved: '₹19.50 Cr', pct: '108.3%', orders: '5,200', revenue: '₹19.50 Cr' },
  ];

  // 4.2 Visit Performance Data
  const visitData = [
    { state: 'Maharashtra', rsm: 'Arun Kumar', drVisits: '12,500', chemistVisits: '4,200', avgCallsPerMR: '10.5 Calls/day', productivityPct: '92.4%' },
    { state: 'Gujarat', rsm: 'Rajesh Singh', drVisits: '9,800', chemistVisits: '3,100', avgCallsPerMR: '9.2 Calls/day', productivityPct: '85.0%' },
    { state: 'Karnataka', rsm: 'Priya Sharma', drVisits: '14,100', chemistVisits: '5,100', avgCallsPerMR: '11.8 Calls/day', productivityPct: '96.8%' },
  ];

  // 4.3 Order Performance Data
  const orderData = [
    { state: 'Maharashtra', ordersBooked: '4,520', orderValue: '₹13.50 Cr', aov: '₹29,867', pendingOrders: '120' },
    { state: 'Gujarat', ordersBooked: '3,100', orderValue: '₹9.50 Cr', aov: '₹30,645', pendingOrders: '85' },
    { state: 'Karnataka', ordersBooked: '5,200', orderValue: '₹19.50 Cr', aov: '₹37,500', pendingOrders: '42' },
  ];

  // 4.4 Collection Performance Data
  const collectionData = [
    { state: 'Maharashtra', totalInvoice: '₹13.50 Cr', amountReceived: '₹12.10 Cr', outstanding: '₹1.40 Cr', collectionPct: '89.6%' },
    { state: 'Gujarat', totalInvoice: '₹9.50 Cr', amountReceived: '₹8.00 Cr', outstanding: '₹1.50 Cr', collectionPct: '84.2%' },
    { state: 'Karnataka', totalInvoice: '₹19.50 Cr', amountReceived: '₹18.80 Cr', outstanding: '₹0.70 Cr', collectionPct: '96.4%' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>🗺️ State Performance Analytics</Text>
          <Text style={styles.subtitle}>State Sales, Field Visits, Order Bookings & Financial Collections.</Text>
        </View>

        {/* Filters: Financial Year, Month, Region, State */}
        <View style={styles.filterRow}>
          <View style={styles.filterPill}><Text style={styles.filterPillText}>FY 2026-27</Text></View>
          <View style={styles.filterPill}><Text style={styles.filterPillText}>August</Text></View>
          <View style={styles.filterPill}><Text style={styles.filterPillText}>All Regions</Text></View>
          <View style={styles.filterPill}><Text style={styles.filterPillText}>All States</Text></View>
        </View>

        {/* 4 Performance Sub-Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity style={[styles.tab, activeTab === 'Sales' && styles.activeTab]} onPress={() => setActiveTab('Sales')}>
            <Text style={[styles.tabText, activeTab === 'Sales' && styles.activeTabText]}>4.1 Sales</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.tab, activeTab === 'Visits' && styles.activeTab]} onPress={() => setActiveTab('Visits')}>
            <Text style={[styles.tabText, activeTab === 'Visits' && styles.activeTabText]}>4.2 Visits</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.tab, activeTab === 'Orders' && styles.activeTab]} onPress={() => setActiveTab('Orders')}>
            <Text style={[styles.tabText, activeTab === 'Orders' && styles.activeTabText]}>4.3 Orders</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.tab, activeTab === 'Collection' && styles.activeTab]} onPress={() => setActiveTab('Collection')}>
            <Text style={[styles.tabText, activeTab === 'Collection' && styles.activeTabText]}>4.4 Collection</Text>
          </TouchableOpacity>
        </View>

        {/* Search Input */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color="#94A3B8" style={{ marginRight: 8 }} />
          <TextInput placeholder="Search state or RSM..." style={styles.searchInput} value={searchQuery} onChangeText={setSearchQuery} />
        </View>

        {/* ── 4.1 SALES PERFORMANCE TABLE ── */}
        {activeTab === 'Sales' && (
          <View style={styles.card}>
            <Text style={styles.tableTitle}>4.1 Sales Performance</Text>
            <View style={styles.tableHeader}>
              <Text style={[styles.th, { flex: 1.1 }]}>State</Text>
              <Text style={[styles.th, { flex: 1 }]}>RSM</Text>
              <Text style={[styles.th, { flex: 1 }]}>Target</Text>
              <Text style={[styles.th, { flex: 1 }]}>Achieved</Text>
              <Text style={[styles.th, { flex: 0.8, textAlign: 'right' }]}>Achv %</Text>
            </View>

            {salesData.map((row, idx) => (
              <View key={idx} style={styles.tableRow}>
                <Text style={[styles.td, { flex: 1.1, fontWeight: 'bold' }]}>{row.state}</Text>
                <Text style={[styles.td, { flex: 1 }]}>{row.rsm}</Text>
                <Text style={[styles.td, { flex: 1 }]}>{row.target}</Text>
                <Text style={[styles.td, { flex: 1, color: '#059669', fontWeight: 'bold' }]}>{row.achieved}</Text>
                <Text style={[styles.td, { flex: 0.8, textAlign: 'right', color: '#4F46E5', fontWeight: 'bold' }]}>{row.pct}</Text>
              </View>
            ))}
          </View>
        )}

        {/* ── 4.2 VISIT PERFORMANCE TABLE ── */}
        {activeTab === 'Visits' && (
          <View style={styles.card}>
            <Text style={styles.tableTitle}>4.2 Field Visit Performance</Text>
            <View style={styles.tableHeader}>
              <Text style={[styles.th, { flex: 1.1 }]}>State</Text>
              <Text style={[styles.th, { flex: 1 }]}>Dr Visits</Text>
              <Text style={[styles.th, { flex: 1 }]}>Chemist</Text>
              <Text style={[styles.th, { flex: 1.1 }]}>Avg Calls/MR</Text>
              <Text style={[styles.th, { flex: 0.9, textAlign: 'right' }]}>Productivity</Text>
            </View>

            {visitData.map((row, idx) => (
              <View key={idx} style={styles.tableRow}>
                <Text style={[styles.td, { flex: 1.1, fontWeight: 'bold' }]}>{row.state}</Text>
                <Text style={[styles.td, { flex: 1 }]}>{row.drVisits}</Text>
                <Text style={[styles.td, { flex: 1 }]}>{row.chemistVisits}</Text>
                <Text style={[styles.td, { flex: 1.1 }]}>{row.avgCallsPerMR}</Text>
                <Text style={[styles.td, { flex: 0.9, textAlign: 'right', color: '#059669', fontWeight: 'bold' }]}>{row.productivityPct}</Text>
              </View>
            ))}
          </View>
        )}

        {/* ── 4.3 ORDER PERFORMANCE TABLE ── */}
        {activeTab === 'Orders' && (
          <View style={styles.card}>
            <Text style={styles.tableTitle}>4.3 Order Booking Performance</Text>
            <View style={styles.tableHeader}>
              <Text style={[styles.th, { flex: 1.1 }]}>State</Text>
              <Text style={[styles.th, { flex: 1 }]}>Booked</Text>
              <Text style={[styles.th, { flex: 1 }]}>Order Value</Text>
              <Text style={[styles.th, { flex: 1 }]}>AOV</Text>
              <Text style={[styles.th, { flex: 0.8, textAlign: 'right' }]}>Pending</Text>
            </View>

            {orderData.map((row, idx) => (
              <View key={idx} style={styles.tableRow}>
                <Text style={[styles.td, { flex: 1.1, fontWeight: 'bold' }]}>{row.state}</Text>
                <Text style={[styles.td, { flex: 1 }]}>{row.ordersBooked}</Text>
                <Text style={[styles.td, { flex: 1, color: '#059669', fontWeight: 'bold' }]}>{row.orderValue}</Text>
                <Text style={[styles.td, { flex: 1 }]}>{row.aov}</Text>
                <Text style={[styles.td, { flex: 0.8, textAlign: 'right', color: '#DC2626', fontWeight: 'bold' }]}>{row.pendingOrders}</Text>
              </View>
            ))}
          </View>
        )}

        {/* ── 4.4 COLLECTION PERFORMANCE TABLE ── */}
        {activeTab === 'Collection' && (
          <View style={styles.card}>
            <Text style={styles.tableTitle}>4.4 Financial Collection Performance</Text>
            <View style={styles.tableHeader}>
              <Text style={[styles.th, { flex: 1.1 }]}>State</Text>
              <Text style={[styles.th, { flex: 1 }]}>Invoice</Text>
              <Text style={[styles.th, { flex: 1 }]}>Received</Text>
              <Text style={[styles.th, { flex: 1 }]}>Outstanding</Text>
              <Text style={[styles.th, { flex: 0.9, textAlign: 'right' }]}>Collection %</Text>
            </View>

            {collectionData.map((row, idx) => (
              <View key={idx} style={styles.tableRow}>
                <Text style={[styles.td, { flex: 1.1, fontWeight: 'bold' }]}>{row.state}</Text>
                <Text style={[styles.td, { flex: 1 }]}>{row.totalInvoice}</Text>
                <Text style={[styles.td, { flex: 1, color: '#059669', fontWeight: 'bold' }]}>{row.amountReceived}</Text>
                <Text style={[styles.td, { flex: 1, color: '#DC2626' }]}>{row.outstanding}</Text>
                <Text style={[styles.td, { flex: 0.9, textAlign: 'right', color: '#4F46E5', fontWeight: 'bold' }]}>{row.collectionPct}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default NSMStatePerformanceScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { padding: 16 },
  header: { marginBottom: 14 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#0F172A' },
  subtitle: { fontSize: 12, color: '#64748B', marginTop: 2 },

  filterRow: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  filterPill: { flex: 1, backgroundColor: '#FFF', paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: '#CBD5E1', alignItems: 'center' },
  filterPillText: { fontSize: 10, color: '#1E293B', fontWeight: 'bold' },

  tabContainer: { flexDirection: 'row', backgroundColor: '#E2E8F0', borderRadius: 10, padding: 3, marginBottom: 14 },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  activeTab: { backgroundColor: '#FFF', elevation: 1 },
  tabText: { fontSize: 11, fontWeight: '600', color: '#64748B' },
  activeTabText: { color: '#4F46E5', fontWeight: 'bold' },

  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 14 },
  searchInput: { flex: 1, fontSize: 13, color: '#0F172A' },

  card: { backgroundColor: '#FFF', padding: 16, borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0' },
  tableTitle: { fontSize: 15, fontWeight: 'bold', color: '#0F172A', marginBottom: 12 },
  tableHeader: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', backgroundColor: '#F8FAFC' },
  th: { fontSize: 10, fontWeight: 'bold', color: '#64748B' },
  tableRow: { flexDirection: 'row', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', alignItems: 'center' },
  td: { fontSize: 11, color: '#334155' },
});