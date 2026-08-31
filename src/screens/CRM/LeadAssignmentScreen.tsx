import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { leadService } from '../../services/leadService';
import { api } from '../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LeadAssignmentScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const leadId = route.params?.leadId;
  const currentMr = route.params?.currentMr;
  
  const [mrs, setMrs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    fetchMRs();
  }, []);

  const fetchMRs = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('@token');
      const response = await api.get('/mrs', { headers: { Authorization: `Bearer ${token}` } }); // Assuming /mrs returns all MRs
      setMrs(response.data?.data || []);
    } catch (error) {
      console.error('Error fetching MRs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (mrId: number) => {
    try {
      setAssigning(true);
      await leadService.assignLead(leadId, mrId);
      
      // Simulate Push Notification sending 
      // In reality, the backend would trigger this via Expo Push API
      console.log(`[PUSH] Notifying MR ${mrId} about new lead ${leadId}`);
      
      Alert.alert('Success', 'Lead successfully assigned!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Error assigning lead:', error);
      Alert.alert('Error', 'Failed to assign lead.');
    } finally {
      setAssigning(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Assign Lead</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.subtitle}>Select a Medical Representative to assign this lead to.</Text>
        <Text style={styles.currentInfo}>Currently assigned: {currentMr ? currentMr.name : 'Unassigned'}</Text>
        
        {loading ? (
          <ActivityIndicator size="large" color="#3B82F6" style={{ marginTop: 50 }} />
        ) : (
          mrs.map(mr => (
            <TouchableOpacity 
              key={mr.id} 
              style={[
                styles.mrCard, 
                currentMr?.id === mr.id && styles.mrCardActive
              ]}
              onPress={() => handleAssign(mr.id)}
              disabled={assigning || currentMr?.id === mr.id}
            >
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>{mr.name.charAt(0)}</Text>
              </View>
              <View style={styles.mrInfo}>
                <Text style={styles.mrName}>{mr.name}</Text>
                <Text style={styles.mrTerritory}>{mr.territory || 'No territory'}</Text>
              </View>
              {currentMr?.id === mr.id ? (
                <Ionicons name="checkmark-circle" size={24} color="#10B981" />
              ) : (
                <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
              )}
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
  subtitle: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 8,
  },
  currentInfo: {
    fontSize: 13,
    color: '#10B981',
    fontWeight: '500',
    marginBottom: 20,
  },
  mrCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  mrCardActive: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6366F1',
  },
  mrInfo: {
    flex: 1,
  },
  mrName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  mrTerritory: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  }
});

export default LeadAssignmentScreen;
