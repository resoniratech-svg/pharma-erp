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

const NSMTeamPerformanceScreen = () => {
  const [activeTab, setActiveTab] = useState<'Performance' | 'Attendance' | 'TargetAchv' | 'TeamStructure' | 'ActivityLog'>('Performance');
  const [searchQuery, setSearchQuery] = useState('');

  // 5.1 Performance Data
  const perfData = [
    { empCode: 'RSM001', empName: 'Arun Kumar', region: 'West Zone', target: '₹15.00 Cr', achieved: '₹13.50 Cr', pct: '90.0%', revenue: '₹13.50 Cr', grade: 'Top Performer' },
    { empCode: 'RSM002', empName: 'Rajesh Singh', region: 'North Zone', target: '₹12.00 Cr', achieved: '₹9.50 Cr', pct: '79.2%', revenue: '₹9.50 Cr', grade: 'On Track' },
    { empCode: 'RSM003', empName: 'Priya Sharma', region: 'South Zone', target: '₹18.00 Cr', achieved: '₹19.50 Cr', pct: '108.3%', revenue: '₹19.50 Cr', grade: 'Star Performer' },
  ];

  // 5.2 Attendance Data
  const attdData = [
    { empName: 'Arun Kumar', workingDays: 26, present: 24, leave: 2, attdPct: '92.3%' },
    { empName: 'Rajesh Singh', workingDays: 26, present: 22, leave: 4, attdPct: '84.6%' },
    { empName: 'Priya Sharma', workingDays: 26, present: 25, leave: 1, attdPct: '96.1%' },
  ];

  // 5.3 Target Achievement Data
  const targetAchvData = [
    { empName: 'Arun Kumar', salesTarget: '₹15.00Cr', salesAchieved: '₹13.50Cr', drTarget: 1200, drAchieved: 1150, chemistTarget: 400, chemistAchieved: 380 },
    { empName: 'Rajesh Singh', salesTarget: '₹12.00Cr', salesAchieved: '₹9.50Cr', drTarget: 1000, drAchieved: 850, chemistTarget: 350, chemistAchieved: 290 },
    { empName: 'Priya Sharma', salesTarget: '₹18.00Cr', salesAchieved: '₹19.50Cr', drTarget: 1400, drAchieved: 1450, chemistTarget: 450, chemistAchieved: 480 },
  ];

  // 5.4 Team Structure Data
  const teamStructData = [
    { empName: 'Arun Kumar', totalASM: 4, activeASM: 4, totalMR: 22, activeMR: 20, statesCovered: 'Maharashtra, Goa' },
    { empName: 'Rajesh Singh', totalASM: 3, activeASM: 3, totalMR: 18, activeMR: 16, statesCovered: 'Gujarat, Daman' },
    { empName: 'Priya Sharma', totalASM: 5, activeASM: 5, totalMR: 25, activeMR: 24, statesCovered: 'Karnataka, Kerala' },
  ];

  // 5.5 Activity Log Data
  const activityLogData = [
    { date: '01 Aug 2026', time: '10:30 AM', activity: 'Target Published', description: 'Published Q2 Sales target for South Zone', performedBy: 'Rajesh Sharma (NSM)', status: 'Success' },
    { date: '01 Aug 2026', time: '09:15 AM', activity: 'RSM Onboarded', description: 'Added Suresh Nambiar as Kerala RSM', performedBy: 'Rajesh Sharma (NSM)', status: 'Completed' },
    { date: '31 Jul 2026', time: '05:45 PM', activity: 'Attendance Override', description: 'Approved GPS exception for Arun Kumar', performedBy: 'Rajesh Sharma (NSM)', status: 'Approved' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>👥 RSM Monitoring Hub</Text>
          <Text style={styles.subtitle}>Performance, Attendance, Target Achievement, Team Structure & Activity Logs.</Text>
        </View>

        {/* 5 Production Sub-Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
          <View style={styles.tabContainer}>
            <TouchableOpacity style={[styles.tab, activeTab === 'Performance' && styles.activeTab]} onPress={() => setActiveTab('Performance')}>
              <Text style={[styles.tabText, activeTab === 'Performance' && styles.activeTabText]}>5.1 Performance</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.tab, activeTab === 'Attendance' && styles.activeTab]} onPress={() => setActiveTab('Attendance')}>
              <Text style={[styles.tabText, activeTab === 'Attendance' && styles.activeTabText]}>5.2 Attendance</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.tab, activeTab === 'TargetAchv' && styles.activeTab]} onPress={() => setActiveTab('TargetAchv')}>
              <Text style={[styles.tabText, activeTab === 'TargetAchv' && styles.activeTabText]}>5.3 Target Achv</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.tab, activeTab === 'TeamStructure' && styles.activeTab]} onPress={() => setActiveTab('TeamStructure')}>
              <Text style={[styles.tabText, activeTab === 'TeamStructure' && styles.activeTabText]}>5.4 Team Structure</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.tab, activeTab === 'ActivityLog' && styles.activeTab]} onPress={() => setActiveTab('ActivityLog')}>
              <Text style={[styles.tabText, activeTab === 'ActivityLog' && styles.activeTabText]}>5.5 Activity Log</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color="#94A3B8" style={{ marginRight: 8 }} />
          <TextInput placeholder="Search RSM or activity..." style={styles.searchInput} value={searchQuery} onChangeText={setSearchQuery} />
        </View>

        {/* ── 5.1 PERFORMANCE TABLE ── */}
        {activeTab === 'Performance' && (
          <View style={styles.card}>
            <Text style={styles.tableTitle}>5.1 Performance Table</Text>
            <View style={styles.tableHeader}>
              <Text style={[styles.th, { flex: 0.9 }]}>Code</Text>
              <Text style={[styles.th, { flex: 1.2 }]}>RSM Name</Text>
              <Text style={[styles.th, { flex: 1 }]}>Region</Text>
              <Text style={[styles.th, { flex: 1 }]}>Target</Text>
              <Text style={[styles.th, { flex: 1 }]}>Achieved</Text>
              <Text style={[styles.th, { flex: 0.9, textAlign: 'right' }]}>Grade</Text>
            </View>

            {perfData.map((row, idx) => (
              <View key={idx} style={styles.tableRow}>
                <Text style={[styles.td, { flex: 0.9, fontWeight: 'bold' }]}>{row.empCode}</Text>
                <Text style={[styles.td, { flex: 1.2, fontWeight: 'bold' }]}>{row.empName}</Text>
                <Text style={[styles.td, { flex: 1 }]}>{row.region}</Text>
                <Text style={[styles.td, { flex: 1 }]}>{row.target}</Text>
                <Text style={[styles.td, { flex: 1, color: '#059669', fontWeight: 'bold' }]}>{row.achieved}</Text>
                <Text style={[styles.td, { flex: 0.9, textAlign: 'right', color: '#4F46E5', fontWeight: 'bold' }]}>{row.grade}</Text>
              </View>
            ))}
          </View>
        )}

        {/* ── 5.2 ATTENDANCE TABLE ── */}
        {activeTab === 'Attendance' && (
          <View style={styles.card}>
            <Text style={styles.tableTitle}>5.2 Attendance Table</Text>
            <View style={styles.tableHeader}>
              <Text style={[styles.th, { flex: 1.3 }]}>Employee Name</Text>
              <Text style={[styles.th, { flex: 1 }]}>Working Days</Text>
              <Text style={[styles.th, { flex: 1 }]}>Present</Text>
              <Text style={[styles.th, { flex: 1 }]}>Leave</Text>
              <Text style={[styles.th, { flex: 0.9, textAlign: 'right' }]}>Attd %</Text>
            </View>

            {attdData.map((row, idx) => (
              <View key={idx} style={styles.tableRow}>
                <Text style={[styles.td, { flex: 1.3, fontWeight: 'bold' }]}>{row.empName}</Text>
                <Text style={[styles.td, { flex: 1 }]}>{row.workingDays}</Text>
                <Text style={[styles.td, { flex: 1, color: '#059669', fontWeight: 'bold' }]}>{row.present}</Text>
                <Text style={[styles.td, { flex: 1, color: '#D97706' }]}>{row.leave}</Text>
                <Text style={[styles.td, { flex: 0.9, textAlign: 'right', color: '#4F46E5', fontWeight: 'bold' }]}>{row.attdPct}</Text>
              </View>
            ))}
          </View>
        )}

        {/* ── 5.3 TARGET ACHIEVEMENT TABLE ── */}
        {activeTab === 'TargetAchv' && (
          <View style={styles.card}>
            <Text style={styles.tableTitle}>5.3 Target Achievement Table</Text>
            <View style={styles.tableHeader}>
              <Text style={[styles.th, { flex: 1.2 }]}>RSM Name</Text>
              <Text style={[styles.th, { flex: 1 }]}>Sales (Ach/Tgt)</Text>
              <Text style={[styles.th, { flex: 1 }]}>Dr (Ach/Tgt)</Text>
              <Text style={[styles.th, { flex: 1, textAlign: 'right' }]}>Chemist (Ach/Tgt)</Text>
            </View>

            {targetAchvData.map((row, idx) => (
              <View key={idx} style={styles.tableRow}>
                <Text style={[styles.td, { flex: 1.2, fontWeight: 'bold' }]}>{row.empName}</Text>
                <Text style={[styles.td, { flex: 1, color: '#059669', fontWeight: 'bold' }]}>{row.salesAchieved}/{row.salesTarget}</Text>
                <Text style={[styles.td, { flex: 1 }]}>{row.drAchieved}/{row.drTarget}</Text>
                <Text style={[styles.td, { flex: 1, textAlign: 'right' }]}>{row.chemistAchieved}/{row.chemistTarget}</Text>
              </View>
            ))}
          </View>
        )}

        {/* ── 5.4 TEAM STRUCTURE TABLE ── */}
        {activeTab === 'TeamStructure' && (
          <View style={styles.card}>
            <Text style={styles.tableTitle}>5.4 Team Structure Table</Text>
            <View style={styles.tableHeader}>
              <Text style={[styles.th, { flex: 1.2 }]}>RSM Name</Text>
              <Text style={[styles.th, { flex: 1 }]}>ASM (Act/Tot)</Text>
              <Text style={[styles.th, { flex: 1 }]}>MR (Act/Tot)</Text>
              <Text style={[styles.th, { flex: 1.2, textAlign: 'right' }]}>States Covered</Text>
            </View>

            {teamStructData.map((row, idx) => (
              <View key={idx} style={styles.tableRow}>
                <Text style={[styles.td, { flex: 1.2, fontWeight: 'bold' }]}>{row.empName}</Text>
                <Text style={[styles.td, { flex: 1 }]}>{row.activeASM}/{row.totalASM}</Text>
                <Text style={[styles.td, { flex: 1 }]}>{row.activeMR}/{row.totalMR}</Text>
                <Text style={[styles.td, { flex: 1.2, textAlign: 'right', color: '#4F46E5', fontWeight: 'bold' }]}>{row.statesCovered}</Text>
              </View>
            ))}
          </View>
        )}

        {/* ── 5.5 ACTIVITY LOG TABLE ── */}
        {activeTab === 'ActivityLog' && (
          <View style={styles.card}>
            <Text style={styles.tableTitle}>5.5 System Activity Logs</Text>
            {activityLogData.map((row, idx) => (
              <View key={idx} style={styles.logBox}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
                  <Text style={styles.logActivity}>{row.activity}</Text>
                  <Text style={styles.logTime}>{row.date} • {row.time}</Text>
                </View>
                <Text style={styles.logDesc}>{row.description}</Text>
                <Text style={styles.logUser}>By: {row.performedBy} • Status: <Text style={{ color: '#059669', fontWeight: 'bold' }}>{row.status}</Text></Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default NSMTeamPerformanceScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { padding: 16 },
  header: { marginBottom: 14 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#0F172A' },
  subtitle: { fontSize: 12, color: '#64748B', marginTop: 2 },

  tabContainer: { flexDirection: 'row', backgroundColor: '#E2E8F0', borderRadius: 10, padding: 3, gap: 4 },
  tab: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
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

  logBox: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  logActivity: { fontSize: 13, fontWeight: 'bold', color: '#0F172A' },
  logTime: { fontSize: 10, color: '#94A3B8' },
  logDesc: { fontSize: 11, color: '#64748B', marginTop: 2 },
  logUser: { fontSize: 10, color: '#475569', marginTop: 2 },
});
