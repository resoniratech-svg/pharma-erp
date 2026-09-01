import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { leadService } from '../../services/leadService';

const LeadListScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const filterStatus = route.params?.filterStatus;
  const title = route.params?.title || 'All Leads';
  
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeads();
  }, [filterStatus]);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const data = await leadService.getLeads();
      let fetchedLeads = data?.data || [];
      if (filterStatus) {
        if (filterStatus === 'WON') {
          fetchedLeads = fetchedLeads.filter((l: any) => l.status === 'WON' || l.status === 'CONVERTED');
        } else {
          fetchedLeads = fetchedLeads.filter((l: any) => l.status === filterStatus);
        }
      }
      setLeads(fetchedLeads);
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'NEW': return '#3B82F6';
      case 'CONTACTED': return '#F59E0B';
      case 'QUALIFIED': return '#10B981';
      case 'PROPOSAL': return '#8B5CF6';
      case 'WON': return '#059669';
      case 'CONVERTED': return '#059669';
      case 'ASSIGNED': return '#0284C7';
      case 'LOST': return '#EF4444';
      default: return '#64748B';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <ActivityIndicator size="large" color="#3B82F6" style={{ marginTop: 50 }} />
        ) : leads.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="folder-open-outline" size={48} color="#CBD5E1" />
            <Text style={styles.emptyText}>No leads found.</Text>
          </View>
        ) : (
          leads.map((lead) => (
            <TouchableOpacity 
              key={lead.id} 
              style={styles.leadCard}
              onPress={() => navigation.navigate('LeadDetails', { leadId: lead.id })}
            >
              <View style={styles.leadHeaderRow}>
                <Text style={styles.leadName}>{lead.name}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(lead.status) + '20' }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(lead.status) }]}>
                    {lead.status}
                  </Text>
                </View>
              </View>
              <Text style={styles.leadType}>{lead.type} • {lead.territory || 'No Territory'}</Text>
              
              <View style={styles.contactRow}>
                <Ionicons name="call-outline" size={14} color="#64748B" />
                <Text style={styles.contactText}>{lead.mobile || 'N/A'}</Text>
                <View style={styles.divider} />
                <Ionicons name="mail-outline" size={14} color="#64748B" />
                <Text style={styles.contactText}>{lead.email || 'N/A'}</Text>
              </View>
            </TouchableOpacity>
          ))
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
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#94A3B8',
    marginTop: 12,
  },
  leadCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#94A3B8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  leadHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  leadName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  leadType: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 12,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactText: {
    fontSize: 12,
    color: '#475569',
    marginLeft: 4,
  },
  divider: {
    width: 1,
    height: 12,
    backgroundColor: '#CBD5E1',
    marginHorizontal: 8,
  },
});

export default LeadListScreen;
