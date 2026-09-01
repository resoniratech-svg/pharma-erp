import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';
import { useNavigation } from '@react-navigation/native';

const NSMSalesOperationsScreen = () => {
  const navigation = useNavigation<any>();

  const operationsModules = [
    {
      id: '1',
      title: 'RSM Management',
      subtitle: 'Supervise Regional Managers & Team Sizes',
      icon: 'people-outline',
      color: '#4F46E5',
      bgColor: '#EEF2FF',
      route: 'NSMRSMMonitoring',
    },
    {
      id: '2',
      title: 'Target Planning',
      subtitle: 'Configure & Allocate Revenue & Call Targets',
      icon: 'disc-outline',
      color: '#059669',
      bgColor: '#ECFDF5',
      route: 'NSMTargetPlanning',
    },
    {
      id: '3',
      title: 'State Performance',
      subtitle: 'State-wise Sales vs Target Analytics',
      icon: 'map-outline',
      color: '#D97706',
      bgColor: '#FEF3C7',
      route: 'NSMStatePerformance',
    },
    {
      id: '4',
      title: 'Team Performance',
      subtitle: 'Pan-India RSM & ASM Performance Ranking',
      icon: 'trophy-outline',
      color: '#7E22CE',
      bgColor: '#F3E8FF',
      route: 'NSMTeamPerformance',
    },
    {
      id: '5',
      title: 'Team Visits',
      subtitle: 'Field Doctor & Chemist Joint Visit Logs',
      icon: 'car-outline',
      color: '#2563EB',
      bgColor: '#EFF6FF',
      route: 'NSMTeamVisits',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="briefcase-outline" size={26} color="#FFF" />
            <Text style={styles.title}>Sales Operations</Text>
          </View>
          <Text style={styles.subtitle}>National Operations & Field Force Management Hub</Text>
        </View>

        {/* Module List Cards */}
        <View style={styles.moduleList}>
          {operationsModules.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.card}
              onPress={() => navigation.navigate(item.route)}
            >
              <View style={[styles.iconBox, { backgroundColor: item.bgColor }]}>
                <Ionicons name={item.icon as any} size={24} color={item.color} />
              </View>

              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
              </View>

              <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default NSMSalesOperationsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { padding: 16 },
  header: { backgroundColor: '#4F46E5', padding: 20, borderRadius: 16, marginBottom: 16 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#FFF' },
  subtitle: { fontSize: 12, color: '#E0E7FF', marginTop: 4 },
  moduleList: { gap: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  iconBox: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  cardTitle: { fontSize: 15, fontWeight: 'bold', color: '#1E293B' },
  cardSubtitle: { fontSize: 11, color: '#64748B', marginTop: 2 },
});
