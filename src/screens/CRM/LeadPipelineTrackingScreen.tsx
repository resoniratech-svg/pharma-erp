import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { leadService } from '../../services/leadService';

const LeadPipelineTrackingScreen = () => {
  const navigation = useNavigation<any>();
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      // In a real scenario, this might be getLeads or getLeadsByMr based on role
      const data = await leadService.getLeads();
      setLeads(data?.data || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const stages = [
    { id: 'NEW', label: 'New Leads', icon: 'person-add-outline', color: '#3B82F6', bgColor: '#DBEAFE' },
    { id: 'CONTACTED', label: 'Contacted', icon: 'call-outline', color: '#F59E0B', bgColor: '#FEF3C7' },
    { id: 'QUALIFIED', label: 'Qualified', icon: 'checkmark-circle-outline', color: '#10B981', bgColor: '#D1FAE5' },
    { id: 'PROPOSAL', label: 'Proposal', icon: 'document-text-outline', color: '#8B5CF6', bgColor: '#EDE9FE' },
    { id: 'WON', label: 'Closed Won', icon: 'trophy-outline', color: '#059669', bgColor: '#A7F3D0' },
    { id: 'LOST', label: 'Closed Lost', icon: 'close-circle-outline', color: '#EF4444', bgColor: '#FEE2E2' },
  ];

  const getCountByStage = (stageId: string) => {
    return leads.filter(l => l.status === stageId).length;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pipeline Tracking</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <ActivityIndicator size="large" color="#3B82F6" style={{ marginTop: 50 }} />
        ) : (
          <View style={styles.gridContainer}>
            {stages.map((stage) => {
              const count = getCountByStage(stage.id);
              return (
                <TouchableOpacity
                  key={stage.id}
                  style={styles.card}
                  onPress={() => navigation.navigate('LeadList', { filterStatus: stage.id, title: stage.label })}
                >
                  <View style={[styles.iconContainer, { backgroundColor: stage.bgColor }]}>
                    <Ionicons name={stage.icon as any} size={24} color={stage.color} />
                  </View>
                  <Text style={styles.cardLabel}>{stage.label}</Text>
                  <Text style={styles.cardValue}>{count}</Text>
                  <Text style={styles.cardSubText}>Leads</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#94A3B8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  cardSubText: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
});

export default LeadPipelineTrackingScreen;
