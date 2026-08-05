import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');
const isTablet = width > 768;

const RSMTargetAllocationScreen = () => {
  const navigation = useNavigation<any>();
  const [activeTab, setActiveTab] = useState<'Overview' | 'ASM Allocation'>('Overview');

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('RSMDashboard')} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.title}>Target Allocation</Text>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16 }}>
        
        {/* Page Titles */}
        <Text style={styles.pageTitle}>Target Allocation Workspace</Text>
        <Text style={styles.pageSubtitle}>Review targets received from the NSM and allocate them to your Area Sales Managers.</Text>

        {/* Custom Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity 
            style={[styles.tabBtn, activeTab === 'Overview' && styles.tabBtnActive]} 
            onPress={() => setActiveTab('Overview')}
          >
            <Text style={[styles.tabText, activeTab === 'Overview' && styles.tabTextActive]}>Overview</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabBtn, activeTab === 'ASM Allocation' && styles.tabBtnActive]} 
            onPress={() => setActiveTab('ASM Allocation')}
          >
            <Text style={[styles.tabText, activeTab === 'ASM Allocation' && styles.tabTextActive]}>ASM Allocation</Text>
          </TouchableOpacity>
        </View>

        {/* TAB CONTENT */}
        {activeTab === 'Overview' ? (
          <View>
            {/* ROW 1 CARDS */}
            <View style={styles.cardsRow}>
              {/* Card 1 */}
              <View style={styles.card}>
                <View style={[styles.iconCircle, { backgroundColor: '#F1F5F9' }]}>
                  <Ionicons name="disc-outline" size={18} color="#475569" />
                </View>
                <Text style={styles.cardLabel}>Assigned Target</Text>
                <Text style={styles.cardValue}>Not Set</Text>
                <Text style={styles.cardSubtitle}>Awaiting assignment</Text>
              </View>
              {/* Card 2 */}
              <View style={styles.card}>
                <View style={[styles.iconCircle, { backgroundColor: '#DCFCE7' }]}>
                  <Ionicons name="trending-up-outline" size={18} color="#16A34A" />
                </View>
                <Text style={styles.cardLabel}>Total Allocated</Text>
                <Text style={styles.cardValue}>₹0</Text>
                <Text style={styles.cardSubtitle}></Text>
              </View>
              {/* Card 3 */}
              <View style={styles.card}>
                <View style={[styles.iconCircle, { backgroundColor: '#F1F5F9' }]}>
                  <Ionicons name="alert-circle-outline" size={18} color="#64748B" />
                </View>
                <Text style={styles.cardLabel}>Remaining Target</Text>
                <Text style={styles.cardValue}>₹0</Text>
                <Text style={styles.cardSubtitle}>Available for allocation</Text>
              </View>
              {/* Card 4 */}
              <View style={styles.card}>
                <View style={[styles.iconCircle, { backgroundColor: '#F3E8FF' }]}>
                  <Ionicons name="calendar-outline" size={18} color="#9333EA" />
                </View>
                <Text style={styles.cardLabel}>Planning Period</Text>
                <Text style={styles.cardValue}>N/A</Text>
                <Text style={styles.cardSubtitle}>Current active cycle</Text>
              </View>
            </View>

            {/* ROW 2 CARDS */}
            <View style={styles.cardsRow}>
              {/* Card 5 */}
              <View style={styles.card}>
                <View style={[styles.iconCircle, { backgroundColor: '#F1F5F9' }]}>
                  <Ionicons name="disc-outline" size={18} color="#475569" />
                </View>
                <Text style={styles.cardLabel}>Total Active ASMs</Text>
                <Text style={styles.cardValue}>2</Text>
                <Text style={styles.cardSubtitle}></Text>
              </View>
              {/* Card 6 */}
              <View style={styles.card}>
                <View style={[styles.iconCircle, { backgroundColor: '#DCFCE7' }]}>
                  <Ionicons name="checkmark-circle-outline" size={18} color="#16A34A" />
                </View>
                <Text style={styles.cardLabel}>Allocated ASMs</Text>
                <Text style={styles.cardValue}>0</Text>
                <Text style={styles.cardSubtitle}></Text>
              </View>
              {/* Card 7 */}
              <View style={styles.card}>
                <View style={[styles.iconCircle, { backgroundColor: '#FEF3C7' }]}>
                  <Ionicons name="warning-outline" size={18} color="#D97706" />
                </View>
                <Text style={styles.cardLabel}>Pending Allocation</Text>
                <Text style={styles.cardValue}>2</Text>
                <Text style={styles.cardSubtitle}></Text>
              </View>
            </View>

            {/* BIG BLOCK: Assigned Targets */}
            <View style={styles.emptyStateBlock}>
              <Text style={styles.emptyStateTitle}>Assigned Targets (from NSM)</Text>
              <View style={styles.emptyStateInner}>
                <View style={styles.bigSearchIcon}>
                  <Ionicons name="search-outline" size={32} color="#94A3B8" />
                </View>
                <Text style={styles.emptyStateDesc}>No targets have been assigned to you yet.</Text>
              </View>
            </View>

          </View>
        ) : (
          <View style={{ marginTop: 24, padding: 24, backgroundColor: '#FFF', borderRadius: 12, alignItems: 'center', borderColor: '#E2E8F0', borderWidth: 1 }}>
            <Ionicons name="people-outline" size={40} color="#94A3B8" style={{ marginBottom: 16 }} />
            <Text style={{ fontSize: 16, color: '#64748B' }}>ASM Allocation data will be added here later.</Text>
          </View>
        )}

        {/* Bottom spacer */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default RSMTargetAllocationScreen;

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
  cardValue: { fontSize: 22, fontWeight: 'bold', color: '#0F172A', marginBottom: 4 },
  cardSubtitle: { fontSize: 10, color: '#94A3B8', minHeight: 14 },

  emptyStateBlock: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E2E8F0', marginTop: 8 },
  emptyStateTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A', marginBottom: 20 },
  emptyStateInner: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  bigSearchIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyStateDesc: { fontSize: 14, color: '#64748B' }
});
