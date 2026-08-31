import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, TextInput, ActivityIndicator, Alert, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { leadService } from '../../services/leadService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MyLeadsScreen = () => {
  const navigation = useNavigation<any>();
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // KPI Stats
  const [stats, setStats] = useState({
    totalAssigned: 0,
    newLeads: 0,
    followUpsDue: 0
  });

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const mrIdStr = await AsyncStorage.getItem('@mrId');
      const mrId = mrIdStr ? parseInt(mrIdStr, 10) : null;

      if (!mrId) {
        Alert.alert('Error', 'MR ID not found');
        return;
      }

      const response = await leadService.getLeadsByMr(mrId);
      const data = response?.data || [];
      setLeads(data);
      
      // Calculate KPIs
      let assigned = 0;
      let newCount = 0;
      let followUp = 0;
      
      data.forEach((lead: any) => {
        if (lead.status !== 'CLOSED' && lead.status !== 'CONVERTED') {
          assigned++;
        }
        if (lead.status === 'NEW') {
          newCount++;
        }
        if (lead.followUps && lead.followUps.some((f: any) => f.status === 'PENDING')) {
          followUp++;
        }
      });
      
      setStats({
        totalAssigned: assigned,
        newLeads: newCount,
        followUpsDue: followUp
      });

    } catch (error) {
      console.error('Error fetching leads:', error);
      Alert.alert('Error', 'Failed to fetch leads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const filteredLeads = leads.filter(l => 
    l.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    l.mobile?.includes(searchQuery) ||
    l.id?.toString().includes(searchQuery) ||
    l.territory?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderStatusBadge = (status: string) => {
    let bgColor = '#F3F4F6';
    let color = '#4B5563';
    let label = status || 'Unknown';
    
    if (status === 'NEW') {
      bgColor = '#E0F2FE';
      color = '#0284C7';
      label = 'New';
    } else if (status === 'CONTACTED') {
      bgColor = '#FEF3C7';
      color = '#D97706';
      label = 'Contacted';
    } else if (status === 'ASSIGNED') {
      bgColor = '#F3E8FF';
      color = '#9333EA';
      label = 'Assigned';
    } else if (status === 'CONVERTED') {
      bgColor = '#DCFCE7';
      color = '#16A34A';
      label = 'Converted';
    }

    return (
      <View style={[styles.badge, { backgroundColor: bgColor }]}>
        <Text style={[styles.badgeText, { color }]}>{label}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.menuButton}>
          <Ionicons name="arrow-back" size={28} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Leads</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        
        {/* KPI Cards */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.kpiContainer}>
          <View style={styles.kpiCard}>
            <View style={[styles.iconBox, { backgroundColor: '#F1F5F9' }]}>
              <Ionicons name="people-outline" size={20} color="#475569" />
            </View>
            <Text style={styles.kpiTitle}>Total Assigned</Text>
            <Text style={styles.kpiValue}>{stats.totalAssigned}</Text>
            <Text style={styles.kpiSub}>Currently assigned leads</Text>
          </View>
          
          <View style={styles.kpiCard}>
            <View style={[styles.iconBox, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="disc-outline" size={20} color="#3B82F6" />
            </View>
            <Text style={styles.kpiTitle}>New Leads</Text>
            <Text style={styles.kpiValue}>{stats.newLeads}</Text>
            <Text style={styles.kpiSub}>Awaiting first contact</Text>
          </View>
          
          <View style={styles.kpiCard}>
            <View style={[styles.iconBox, { backgroundColor: '#FFF7ED' }]}>
              <Ionicons name="call-outline" size={20} color="#F97316" />
            </View>
            <Text style={styles.kpiTitle}>Follow-Ups Due</Text>
            <Text style={styles.kpiValue}>{stats.followUpsDue}</Text>
            <Text style={styles.kpiSub}>Pending follow-ups</Text>
          </View>
        </ScrollView>

        {/* Search */}
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#94A3B8" />
            <TextInput 
              style={styles.searchInput} 
              placeholder="Search by ID, Name, Mobile, Territory" 
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <TouchableOpacity style={styles.filterBtn}>
            <Ionicons name="filter" size={20} color="#64748B" />
            <Text style={styles.filterText}>Filters</Text>
          </TouchableOpacity>
        </View>

        {/* List */}
        {loading ? (
          <ActivityIndicator size="large" color="#1E3A8A" style={{ marginTop: 50 }} />
        ) : filteredLeads.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="albums-outline" size={48} color="#CBD5E1" />
            <Text style={styles.emptyText}>No leads found</Text>
          </View>
        ) : (
          filteredLeads.map((lead, index) => {
            const nextFollowUp = lead.followUps?.find((f:any) => f.status === 'PENDING')?.date;
            
            return (
              <View key={lead.id?.toString() || index.toString()} style={styles.leadCard}>
                <View style={styles.cardHeader}>
                  <Text style={styles.leadId}>LD-{lead.id || '17865245'}</Text>
                  {renderStatusBadge(lead.status)}
                </View>
                
                <Text style={styles.leadName}>{lead.name}</Text>
                
                <View style={styles.infoRow}>
                  <View style={styles.infoCol}>
                    <Text style={styles.infoLabel}>TYPE</Text>
                    <Text style={styles.infoValue}>{lead.type}</Text>
                  </View>
                  <View style={styles.infoCol}>
                    <Text style={styles.infoLabel}>CONTACT</Text>
                    <Text style={styles.infoValue}>{lead.mobile}</Text>
                  </View>
                </View>
                
                <View style={styles.infoRow}>
                  <View style={styles.infoCol}>
                    <Text style={styles.infoLabel}>TERRITORY</Text>
                    <Text style={styles.infoValue}>{lead.territory || 'Unassigned'}</Text>
                  </View>
                  <View style={styles.infoCol}>
                    <Text style={styles.infoLabel}>NEXT FOLLOW-UP</Text>
                    <Text style={styles.infoValue}>{nextFollowUp ? new Date(nextFollowUp).toLocaleDateString() : 'None'}</Text>
                  </View>
                </View>
                
                <View style={styles.cardFooter}>
                  <TouchableOpacity 
                    style={styles.actionBtn}
                    onPress={() => navigation.navigate('LeadDetails', { lead })}
                  >
                    <Ionicons name="eye-outline" size={16} color="#3B82F6" />
                    <Text style={styles.actionText}>View Details</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
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
    borderBottomColor: '#F1F5F9',
  },
  menuButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  content: {
    padding: 16,
  },
  kpiContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  kpiCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    width: 220,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9'
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  kpiTitle: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  kpiValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
    marginVertical: 4,
  },
  kpiSub: {
    fontSize: 12,
    color: '#94A3B8',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#0F172A',
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 8,
  },
  filterText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: '#94A3B8',
    fontWeight: '500',
  },
  leadCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  leadId: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  leadName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  infoCol: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '500',
  },
  cardFooter: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    alignItems: 'flex-end',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600',
  },
});

export default MyLeadsScreen;
