import React, { useState, useEffect } from 'react';
import { getTodaySchedule } from '../../services/dailyScheduleService';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

// Note: Ensure getTodaySchedule is imported or defined.
// import { getTodaySchedule } from '../api/yourApiFile'; 

const safeJsonParse = (data: string | null, fallback: any) => {
  if (!data) return fallback;
  try {
    return JSON.parse(data);
  } catch (err) {
    console.log('safeJsonParse error in DailyScheduleScreen:', err);
    return fallback;
  }
};

interface PlannedVisit {
  id: string;
  name: string;
  type: 'Doctor' | 'Chemist';
  timeSlot: string;
  area: string;
  status: 'Pending' | 'Visited' | 'Missed';
}

const DailyScheduleScreen = () => {
  const navigation = useNavigation<any>();
  const getTodayDateString = () => {
    const today = new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = today.getDate().toString().padStart(2, '0');
    const month = months[today.getMonth()];
    const year = today.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const [scheduleDate, setScheduleDate] = useState(getTodayDateString());
  const [plannedVisits, setPlannedVisits] = useState<PlannedVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scheduleInfo, setScheduleInfo] = useState<any>(null);
  
  // Progress States
  const [stats, setStats] = useState({
    total: 0,
    visited: 0,
    pending: 0,
    missed: 0,
    percent: 0,
  });

  useEffect(() => {
    loadTodaySchedule();
  }, [scheduleDate]);

  const calculateStats = (visits: PlannedVisit[]) => {
    const total = visits.length;
    const visited = visits.filter(v => v.status === 'Visited').length;
    const pending = visits.filter(v => v.status === 'Pending').length;
    const missed = visits.filter(v => v.status === 'Missed').length;
    const percent = total > 0 ? Math.round((visited / total) * 100) : 0;

    setStats({ total, visited, pending, missed, percent });
  };

  const loadTodaySchedule = async () => {
    setLoading(true);
    setError(null);

    try {
      // Make sure getTodaySchedule is imported/available in this file scope
      const data = await getTodaySchedule();

      console.log('TODAY SCHEDULE API:', data);

      setScheduleInfo(data);

      setStats({
        total: data.plannedDoctors + data.plannedChemists,
        visited: data.completedDoctors + data.completedChemists,
        pending: Math.max(
          0,
          (data.plannedDoctors + data.plannedChemists) -
          (data.completedDoctors + data.completedChemists)
        ),
        missed: 0,
        percent: data.completion,
      });

    } catch (e) {
      console.log('Error loading schedule:', e);
      setError("Failed to load today's schedule.");
    } finally {
      setLoading(false);
    }
  };

  const handleVisitAction = (visit: PlannedVisit) => {
    if (visit.type === 'Doctor') {
      navigation.navigate('DoctorVisit', { preselectedDoctor: visit.name });
    } else {
      navigation.navigate('ChemistVisit', { preselectedChemist: visit.name });
    }
  };

  const toggleVisitStatus = async (id: string) => {
    const updated = plannedVisits.map((v) => {
      if (v.id === id) {
        const nextStatus: PlannedVisit['status'] =
          v.status === 'Pending' ? 'Visited' : v.status === 'Visited' ? 'Missed' : 'Pending';
        return { ...v, status: nextStatus };
      }
      return v;
    });

    setPlannedVisits(updated);
    calculateStats(updated);

    const storageKey = `@daily_schedule_${scheduleDate}`;
    await AsyncStorage.setItem(storageKey, JSON.stringify(updated));
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>⬅️ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>📅 Daily Work Schedule</Text>
        <Text style={styles.headerSubtitle}>Date: {scheduleDate}</Text>
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loaderText}>Loading daily schedule...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadTodaySchedule}>
            <Text style={styles.retryButtonText}>🔄 Retry Loading Schedule</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Progress summary card */}
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>📊 Today's Progress</Text>
              <Text style={styles.progressPercent}>{stats.percent}% Done</Text>
            </View>
            
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${stats.percent}%` }]} />
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statVal}>{stats.total}</Text>
                <Text style={styles.statLabel}>Planned</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={[styles.statVal, { color: '#10B981' }]}>{stats.visited}</Text>
                <Text style={styles.statLabel}>Visited</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={[styles.statVal, { color: '#F59E0B' }]}>{stats.pending}</Text>
                <Text style={styles.statLabel}>Pending</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={[styles.statVal, { color: '#EF4444' }]}>{stats.missed}</Text>
                <Text style={styles.statLabel}>Missed</Text>
              </View>
            </View>
          </View>

          {/* Schedule List */}
          <Text style={styles.sectionTitle}>Today's Schedule Checklist</Text>
          {plannedVisits.length > 0 ? (
            plannedVisits.map((visit, index) => {
              let statusColor = '#E2E8F0';
              let statusText = 'Pending';
              let statusTextColor = '#475569';
              if (visit.status === 'Visited') {
                statusColor = '#D1FAE5';
                statusText = 'Visited';
                statusTextColor = '#065F46';
              } else if (visit.status === 'Missed') {
                statusColor = '#FEE2E2';
                statusText = 'Missed';
                statusTextColor = '#991B1B';
              }

              return (
                <View key={`${visit.id}-${index}`} style={styles.visitCard}>
                  <View style={styles.cardHeader}>
                    <View style={styles.leftInfo}>
                      <Text style={styles.visitTime}>{visit.timeSlot}</Text>
                      <Text style={styles.visitName}>{visit.name}</Text>
                      <Text style={styles.visitArea}>📍 {visit.area} ({visit.type})</Text>
                    </View>

                    <TouchableOpacity
                      style={[styles.statusBadge, { backgroundColor: statusColor }]}
                      onPress={() => toggleVisitStatus(visit.id)}
                    >
                      <Text style={[styles.statusText, { color: statusTextColor }]}>
                        {statusText}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.cardActions}>
                    <Text style={styles.tapTip}>💡 Tap status badge to toggle</Text>
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => handleVisitAction(visit)}
                    >
                      <Text style={styles.actionBtnText}>Open Visit Form ➡️</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No scheduled visits for today.</Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
};

export default DailyScheduleScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
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
  backButtonText: { fontSize: 12, color: '#FFFFFF', fontWeight: 'bold' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFFFFF', textAlign: 'center' },
  headerSubtitle: { fontSize: 12, color: '#E0E7FF', textAlign: 'center', marginTop: 6 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 60 },
  progressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 2,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4F46E5',
  },
  progressBar: {
    height: 10,
    backgroundColor: '#EEF2F6',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4F46E5',
    borderRadius: 5,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
  },
  statBox: {
    alignItems: 'center',
  },
  statVal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  statLabel: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#1E293B', marginBottom: 12 },
  visitCard: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 2, elevation: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  leftInfo: { flex: 1 },
  visitTime: { fontSize: 11, color: '#4F46E5', fontWeight: 'bold' },
  visitName: { fontSize: 15, fontWeight: 'bold', color: '#1E293B', marginTop: 2 },
  visitArea: { fontSize: 12, color: '#64748B', marginTop: 2 },
  statusBadge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12 },
  statusText: { fontSize: 10, fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 10 },
  cardActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tapTip: { fontSize: 10, color: '#94A3B8', fontStyle: 'italic' },
  actionBtn: { paddingVertical: 4 },
  actionBtnText: { fontSize: 12, color: '#4F46E5', fontWeight: 'bold' },
  emptyCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 24, alignItems: 'center' },
  emptyText: { fontSize: 13, color: '#94A3B8', fontStyle: 'italic' },
  loaderContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    marginVertical: 20,
    marginHorizontal: 20,
  },
  loaderText: {
    marginTop: 15,
    fontSize: 14,
    color: '#666',
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    borderColor: '#FFCDD2',
    borderWidth: 1,
    borderRadius: 16,
    padding: 24,
    marginVertical: 15,
    marginHorizontal: 20,
    alignItems: 'center',
  },
  errorText: {
    color: '#C62828',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#C62828',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
});