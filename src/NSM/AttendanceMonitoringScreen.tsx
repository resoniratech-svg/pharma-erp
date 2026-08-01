import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const NSMAttendanceMonitoringScreen = () => {
  const [activeTab, setActiveTab] = useState<'MyAttendance' | 'TeamAttendance'>('MyAttendance');

  // Self Attendance State
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState<string | null>(null);
  const [checkOutTime, setCheckOutTime] = useState<string | null>(null);

  // Self Attendance History
  const [attendanceHistory] = useState([
    { id: '1', date: '01 Aug 2026', checkIn: '09:15 AM', checkOut: '06:30 PM', hours: '9h 15m', status: 'Present' },
    { id: '2', date: '31 Jul 2026', checkIn: '09:05 AM', checkOut: '06:15 PM', hours: '9h 10m', status: 'Present' },
    { id: '3', date: '30 Jul 2026', checkIn: '09:45 AM', checkOut: '06:45 PM', hours: '9h 00m', status: 'Late Check-In' },
    { id: '4', date: '29 Jul 2026', checkIn: '09:10 AM', checkOut: '06:20 PM', hours: '9h 10m', status: 'Present' },
  ]);

  // Team Attendance Data with GPS Exception & Punch Indicators
  const teamAttendanceData = [
    { id: '1', rsmName: 'Arun Kumar', region: 'Maharashtra', workingDays: 26, present: 24, absent: 0, leave: 2, late: 1, latePct: '3.8%', earlyOut: 0, missingPunch: 0, gpsException: 0, attdPct: '92.3%', status: 'Excellent', statusBg: '#DCFCE7', statusColor: '#15803D' },
    { id: '2', rsmName: 'Priya Sharma', region: 'Karnataka', workingDays: 26, present: 25, absent: 0, leave: 1, late: 0, latePct: '0.0%', earlyOut: 0, missingPunch: 0, gpsException: 0, attdPct: '96.1%', status: 'Excellent', statusBg: '#DCFCE7', statusColor: '#15803D' },
    { id: '3', rsmName: 'Rajesh Singh', region: 'Gujarat', workingDays: 26, present: 22, absent: 2, leave: 2, late: 3, latePct: '11.5%', earlyOut: 1, missingPunch: 1, gpsException: 2, attdPct: '84.6%', status: 'Good', statusBg: '#DBEAFE', statusColor: '#1D4ED8' },
    { id: '4', rsmName: 'M. Selvam', region: 'Tamil Nadu', workingDays: 26, present: 20, absent: 3, leave: 3, late: 4, latePct: '15.4%', earlyOut: 2, missingPunch: 2, gpsException: 4, attdPct: '76.9%', status: 'Needs Focus', statusBg: '#FEE2E2', statusColor: '#DC2626' },
  ];

  const handleCheckIn = () => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setIsCheckedIn(true);
    setCheckInTime(time);
    setCheckOutTime(null);
    Alert.alert('🟢 Checked In Successfully', `Recorded Check-In at ${time} with GPS Location (Lat: 19.0760, Long: 72.8777).`);
  };

  const handleCheckOut = () => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setIsCheckedIn(false);
    setCheckOutTime(time);
    Alert.alert('🔴 Checked Out Successfully', `Recorded Check-Out at ${time}. Working hours today: 8h 45m.`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>📋 Attendance & GPS Tracking</Text>
          <Text style={styles.subtitle}>Self GPS attendance punch-in & Regional Team Attendance health tracking.</Text>
        </View>

        {/* 2 Main Attendance Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'MyAttendance' && styles.activeTab]}
            onPress={() => setActiveTab('MyAttendance')}
          >
            <Text style={[styles.tabText, activeTab === 'MyAttendance' && styles.activeTabText]}>👤 My Attendance</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'TeamAttendance' && styles.activeTab]}
            onPress={() => setActiveTab('TeamAttendance')}
          >
            <Text style={[styles.tabText, activeTab === 'TeamAttendance' && styles.activeTabText]}>👥 Team Attendance</Text>
          </TouchableOpacity>
        </View>

        {/* ── TAB 1: MY ATTENDANCE ── */}
        {activeTab === 'MyAttendance' && (
          <View>
            {/* Punch In / Punch Out Card */}
            <View style={styles.punchCard}>
              <View style={{ alignItems: 'center', marginBottom: 14 }}>
                <Text style={styles.punchStatusTitle}>
                  {isCheckedIn ? '🟢 Currently Checked-In' : '⚪ Not Checked-In Today'}
                </Text>
                <Text style={styles.punchStatusSub}>
                  {isCheckedIn ? `In since ${checkInTime}` : 'Tap Check-In button to record today’s attendance'}
                </Text>
                <View style={styles.gpsPill}>
                  <Ionicons name="location-outline" size={13} color="#4F46E5" />
                  <Text style={styles.gpsPillText}>GPS Location: Mumbai Central HQ (19.0760° N, 72.8777° E)</Text>
                </View>
              </View>

              <View style={styles.punchBtnRow}>
                <TouchableOpacity
                  style={[styles.punchBtn, isCheckedIn ? styles.disabledBtn : styles.checkInBtn]}
                  disabled={isCheckedIn}
                  onPress={handleCheckIn}
                >
                  <Ionicons name="location-outline" size={20} color="#FFF" />
                  <Text style={styles.punchBtnText}>Check-In</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.punchBtn, !isCheckedIn ? styles.disabledBtn : styles.checkOutBtn]}
                  disabled={!isCheckedIn}
                  onPress={handleCheckOut}
                >
                  <Ionicons name="log-out-outline" size={20} color="#FFF" />
                  <Text style={styles.punchBtnText}>Check-Out</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Hours Summary Boxes */}
            <View style={styles.hoursGrid}>
              <View style={styles.hoursBox}>
                <Ionicons name="time-outline" size={20} color="#4F46E5" />
                <Text style={styles.hoursVal}>{isCheckedIn ? '4h 15m' : '8h 45m'}</Text>
                <Text style={styles.hoursLbl}>Working Hours Today</Text>
              </View>

              <View style={styles.hoursBox}>
                <Ionicons name="calendar-outline" size={20} color="#059669" />
                <Text style={[styles.hoursVal, { color: '#059669' }]}>184 hrs</Text>
                <Text style={styles.hoursLbl}>Total Hours This Month</Text>
              </View>
            </View>

            {/* Attendance History Table */}
            <View style={[styles.card, { marginTop: 16 }]}>
              <Text style={styles.cardTitle}>📜 Attendance History</Text>

              {attendanceHistory.map((item) => (
                <View key={item.id} style={styles.historyRow}>
                  <View>
                    <Text style={styles.historyDate}>{item.date}</Text>
                    <Text style={styles.historyTime}>In: {item.checkIn} | Out: {item.checkOut}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.historyHours}>{item.hours}</Text>
                    <Text style={[styles.historyStatus, item.status === 'Present' ? { color: '#059669' } : { color: '#DC2626' }]}>
                      {item.status}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── TAB 2: TEAM ATTENDANCE ── */}
        {activeTab === 'TeamAttendance' && (
          <View>
            {/* Team Counters */}
            <View style={styles.summaryGrid}>
              <View style={[styles.summaryBox, { backgroundColor: '#ECFDF5' }]}>
                <Text style={[styles.sumVal, { color: '#059669' }]}>91</Text>
                <Text style={styles.sumLbl}>Present</Text>
              </View>

              <View style={[styles.summaryBox, { backgroundColor: '#FEE2E2' }]}>
                <Text style={[styles.sumVal, { color: '#DC2626' }]}>5</Text>
                <Text style={styles.sumLbl}>Absent</Text>
              </View>

              <View style={[styles.summaryBox, { backgroundColor: '#FEF3C7' }]}>
                <Text style={[styles.sumVal, { color: '#D97706' }]}>4</Text>
                <Text style={styles.sumLbl}>Leave</Text>
              </View>

              <View style={[styles.summaryBox, { backgroundColor: '#F3E8FF' }]}>
                <Text style={[styles.sumVal, { color: '#7E22CE' }]}>8</Text>
                <Text style={styles.sumLbl}>Late Check-In</Text>
              </View>
            </View>

            {/* RSM Team Attendance & GPS Exception Health List */}
            <View style={[styles.card, { marginTop: 16 }]}>
              <Text style={styles.cardTitle}>👨‍💼 RSM Attendance & GPS Exception Health</Text>

              {teamAttendanceData.map((item) => (
                <View key={item.id} style={styles.teamAttdCard}>
                  <View style={styles.teamAttdHeader}>
                    <View>
                      <Text style={styles.teamRsmName}>{item.rsmName}</Text>
                      <Text style={styles.teamRegion}>📍 {item.region}</Text>
                    </View>
                    <View style={[styles.attdBadge, { backgroundColor: item.statusBg }]}>
                      <Text style={[styles.attdBadgeText, { color: item.statusColor }]}>{item.attdPct} ({item.status})</Text>
                    </View>
                  </View>

                  <View style={styles.teamStatsGrid}>
                    <View style={styles.teamStatBox}>
                      <Text style={styles.statLabel}>Present</Text>
                      <Text style={[styles.statVal, { color: '#059669' }]}>{item.present}</Text>
                    </View>

                    <View style={styles.teamStatBox}>
                      <Text style={styles.statLabel}>Late Check-In %</Text>
                      <Text style={[styles.statVal, { color: '#7E22CE' }]}>{item.latePct}</Text>
                    </View>

                    <View style={styles.teamStatBox}>
                      <Text style={styles.statLabel}>Early Out</Text>
                      <Text style={[styles.statVal, { color: '#D97706' }]}>{item.earlyOut}</Text>
                    </View>

                    <View style={styles.teamStatBox}>
                      <Text style={styles.statLabel}>Missing Punch</Text>
                      <Text style={[styles.statVal, { color: '#DC2626' }]}>{item.missingPunch}</Text>
                    </View>

                    <View style={styles.teamStatBox}>
                      <Text style={styles.statLabel}>GPS Exceptions</Text>
                      <Text style={[styles.statVal, { color: '#B91C1C' }]}>{item.gpsException}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default NSMAttendanceMonitoringScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { padding: 16 },
  header: { marginBottom: 14 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#0F172A' },
  subtitle: { fontSize: 12, color: '#64748B', marginTop: 2 },

  tabContainer: { flexDirection: 'row', backgroundColor: '#E2E8F0', borderRadius: 10, padding: 3, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 8 },
  activeTab: { backgroundColor: '#FFF', elevation: 1 },
  tabText: { fontSize: 12, fontWeight: '600', color: '#64748B' },
  activeTabText: { color: '#4F46E5', fontWeight: 'bold' },

  punchCard: { backgroundColor: '#FFF', padding: 18, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 14 },
  punchStatusTitle: { fontSize: 16, fontWeight: 'bold', color: '#0F172A' },
  punchStatusSub: { fontSize: 11, color: '#64748B', marginTop: 4 },
  gpsPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EEF2FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginTop: 8, gap: 4 },
  gpsPillText: { fontSize: 10, color: '#4F46E5', fontWeight: '600' },
  punchBtnRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
  punchBtn: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 12, borderRadius: 10, gap: 6 },
  checkInBtn: { backgroundColor: '#059669' },
  checkOutBtn: { backgroundColor: '#DC2626' },
  disabledBtn: { backgroundColor: '#CBD5E1' },
  punchBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },

  hoursGrid: { flexDirection: 'row', gap: 10 },
  hoursBox: { flex: 1, backgroundColor: '#FFF', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center' },
  hoursVal: { fontSize: 17, fontWeight: 'bold', color: '#4F46E5', marginTop: 4 },
  hoursLbl: { fontSize: 10, color: '#64748B', marginTop: 2 },

  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  summaryBox: { width: '48%', backgroundColor: '#FFF', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center' },
  sumVal: { fontSize: 18, fontWeight: 'bold', color: '#0F172A' },
  sumLbl: { fontSize: 11, color: '#64748B', marginTop: 2 },

  card: { backgroundColor: '#FFF', padding: 16, borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0' },
  cardTitle: { fontSize: 15, fontWeight: 'bold', color: '#0F172A', marginBottom: 12 },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  historyDate: { fontSize: 13, fontWeight: 'bold', color: '#0F172A' },
  historyTime: { fontSize: 11, color: '#64748B', marginTop: 2 },
  historyHours: { fontSize: 12, fontWeight: 'bold', color: '#4F46E5' },
  historyStatus: { fontSize: 11, fontWeight: 'bold', marginTop: 2 },

  teamAttdCard: { backgroundColor: '#F8FAFC', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 10 },
  teamAttdHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  teamRsmName: { fontSize: 14, fontWeight: 'bold', color: '#0F172A' },
  teamRegion: { fontSize: 11, color: '#64748B', marginTop: 2 },
  attdBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  attdBadgeText: { fontSize: 10, fontWeight: 'bold' },

  teamStatsGrid: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 8, borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  teamStatBox: { flex: 1, alignItems: 'center' },
  statLabel: { fontSize: 8, color: '#94A3B8', textAlign: 'center' },
  statVal: { fontSize: 11, fontWeight: 'bold', color: '#0F172A', marginTop: 2 },
});
