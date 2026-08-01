import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const NSMTeamVisitsScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const visitData = [
    { id: '1', rsmName: 'Arun Kumar', region: 'Maharashtra', drVisits: '1,250', chemistVisits: '420', jointVisits: '310', missedVisits: '12', todaysVisits: '45', pendingVisits: '8', orders: '4,520', coverage: '94.2%', lastVisit: '01 Aug 2026' },
    { id: '2', rsmName: 'Priya Sharma', region: 'Karnataka', drVisits: '1,410', chemistVisits: '510', jointVisits: '420', missedVisits: '5', todaysVisits: '52', pendingVisits: '3', orders: '5,200', coverage: '98.5%', lastVisit: '01 Aug 2026' },
    { id: '3', rsmName: 'Rajesh Singh', region: 'Gujarat', drVisits: '980', chemistVisits: '310', jointVisits: '210', missedVisits: '28', todaysVisits: '30', pendingVisits: '15', orders: '3,100', coverage: '88.0%', lastVisit: '31 Jul 2026' },
  ];

  const filteredVisits = visitData.filter(
    (item) =>
      item.rsmName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.region.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>🚗 Team Field Visits Monitoring</Text>
          <Text style={styles.subtitle}>Supervise joint visits, missed visits, today's visits & pending doctor coverage.</Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color="#94A3B8" style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Search by RSM name or region..."
            placeholderTextColor="#94A3B8"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Team Visit Cards */}
        <View style={{ gap: 12 }}>
          {filteredVisits.map((item) => (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.rsmName}>{item.rsmName}</Text>
                  <Text style={styles.regionText}>📍 {item.region}</Text>
                </View>
                <View style={styles.coverageBadge}>
                  <Text style={styles.coverageText}>🎯 {item.coverage} Coverage</Text>
                </View>
              </View>

              {/* Primary Visit Metrics */}
              <View style={styles.statsGrid}>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Doctor Visits</Text>
                  <Text style={styles.statVal}>{item.drVisits}</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Chemist Visits</Text>
                  <Text style={styles.statVal}>{item.chemistVisits}</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Total Orders</Text>
                  <Text style={styles.statVal}>{item.orders}</Text>
                </View>
              </View>

              {/* Secondary Visit Metrics: Joint, Missed, Today, Pending */}
              <View style={styles.secStatsGrid}>
                <View style={styles.secStatBox}>
                  <Text style={styles.secLabel}>🤝 Joint Visits</Text>
                  <Text style={[styles.secVal, { color: '#4F46E5' }]}>{item.jointVisits}</Text>
                </View>

                <View style={styles.secStatBox}>
                  <Text style={styles.secLabel}>⚠️ Missed Visits</Text>
                  <Text style={[styles.secVal, { color: '#DC2626' }]}>{item.missedVisits}</Text>
                </View>

                <View style={styles.secStatBox}>
                  <Text style={styles.secLabel}>📅 Today's Visits</Text>
                  <Text style={[styles.secVal, { color: '#059669' }]}>{item.todaysVisits}</Text>
                </View>

                <View style={styles.secStatBox}>
                  <Text style={styles.secLabel}>⏳ Pending Visits</Text>
                  <Text style={[styles.secVal, { color: '#D97706' }]}>{item.pendingVisits}</Text>
                </View>
              </View>

              <View style={styles.cardFooter}>
                <Ionicons name="calendar-outline" size={13} color="#64748B" />
                <Text style={styles.footerText}>Last Visit Date: {item.lastVisit}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default NSMTeamVisitsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { padding: 16 },
  header: { marginBottom: 12 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#0F172A' },
  subtitle: { fontSize: 12, color: '#64748B', marginTop: 2 },

  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 14 },
  searchInput: { flex: 1, fontSize: 13, color: '#0F172A' },

  card: { backgroundColor: '#FFF', padding: 16, borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  rsmName: { fontSize: 15, fontWeight: 'bold', color: '#0F172A' },
  regionText: { fontSize: 11, color: '#4F46E5', fontWeight: '600', marginTop: 2 },
  coverageBadge: { backgroundColor: '#DCFCE7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  coverageText: { color: '#15803D', fontSize: 11, fontWeight: 'bold' },

  statsGrid: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderTopWidth: 1, borderColor: '#F1F5F9' },
  statBox: { flex: 1, alignItems: 'center' },
  statLabel: { fontSize: 10, color: '#94A3B8' },
  statVal: { fontSize: 14, fontWeight: 'bold', color: '#0F172A', marginTop: 2 },

  secStatsGrid: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#F1F5F9', backgroundColor: '#F8FAFC', borderRadius: 8, paddingHorizontal: 8, marginVertical: 6 },
  secStatBox: { flex: 1, alignItems: 'center' },
  secLabel: { fontSize: 9, color: '#64748B', fontWeight: '500' },
  secVal: { fontSize: 13, fontWeight: 'bold', marginTop: 2 },

  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  footerText: { fontSize: 11, color: '#64748B' },
});
