import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { leadService } from '../../services/leadService';

const LeadConversionTrackingScreen = () => {
  const navigation = useNavigation<any>();
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const data = await leadService.getLeads();
      setLeads(data?.data || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalLeads = leads.length;
  const wonLeads = leads.filter(l => l.status === 'WON' || l.status === 'CONVERTED').length;
  const lostLeads = leads.filter(l => l.status === 'LOST').length;
  const activeLeads = totalLeads - wonLeads - lostLeads;

  const conversionRate = totalLeads > 0 ? ((wonLeads / totalLeads) * 100).toFixed(1) : '0.0';
  const lossRate = totalLeads > 0 ? ((lostLeads / totalLeads) * 100).toFixed(1) : '0.0';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Conversion Analytics</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color="#3B82F6" style={{ marginTop: 50 }} />
        ) : (
          <>
            <View style={styles.mainCard}>
              <Text style={styles.cardTitle}>Overall Conversion Rate</Text>
              <View style={styles.rateCircle}>
                <Text style={styles.rateText}>{conversionRate}%</Text>
                <Text style={styles.rateSub}>Win Rate</Text>
              </View>
              <Text style={styles.summaryText}>
                You have won {wonLeads} out of {totalLeads} total leads.
              </Text>
            </View>

            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Ionicons name="people-outline" size={24} color="#3B82F6" />
                <Text style={styles.statValue}>{totalLeads}</Text>
                <Text style={styles.statLabel}>Total Leads</Text>
              </View>
              
              <View style={styles.statBox}>
                <Ionicons name="flame-outline" size={24} color="#F59E0B" />
                <Text style={styles.statValue}>{activeLeads}</Text>
                <Text style={styles.statLabel}>Active Leads</Text>
              </View>
              
              <View style={styles.statBox}>
                <Ionicons name="trophy-outline" size={24} color="#10B981" />
                <Text style={styles.statValue}>{wonLeads}</Text>
                <Text style={styles.statLabel}>Closed Won</Text>
              </View>
              
              <View style={styles.statBox}>
                <Ionicons name="close-circle-outline" size={24} color="#EF4444" />
                <Text style={styles.statValue}>{lostLeads}</Text>
                <Text style={styles.statLabel}>Closed Lost</Text>
              </View>
            </View>

            <View style={styles.detailsCard}>
              <Text style={styles.cardTitle}>Conversion Funnel</Text>
              
              {/* Funnel visualization */}
              <View style={styles.funnelRow}>
                <View style={styles.funnelLabel}><Text style={styles.funnelText}>Total ({totalLeads})</Text></View>
                <View style={[styles.funnelBar, { width: '100%', backgroundColor: '#DBEAFE' }]} />
              </View>
              
              <View style={styles.funnelRow}>
                <View style={styles.funnelLabel}><Text style={styles.funnelText}>Active ({activeLeads})</Text></View>
                <View style={[styles.funnelBar, { width: totalLeads > 0 ? `${(activeLeads/totalLeads)*100}%` : '0%', backgroundColor: '#FEF3C7' }]} />
              </View>
              
              <View style={styles.funnelRow}>
                <View style={styles.funnelLabel}><Text style={styles.funnelText}>Won ({wonLeads})</Text></View>
                <View style={[styles.funnelBar, { width: totalLeads > 0 ? `${(wonLeads/totalLeads)*100}%` : '0%', backgroundColor: '#D1FAE5' }]} />
              </View>
            </View>
          </>
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  mainCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#94A3B8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  rateCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 8,
    borderColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  rateText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#10B981',
  },
  rateSub: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  summaryText: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statBox: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0F172A',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 40,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  funnelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  funnelLabel: {
    width: 90,
  },
  funnelText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
  funnelBar: {
    height: 24,
    borderRadius: 12,
  },
});

export default LeadConversionTrackingScreen;
