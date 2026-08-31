import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { leadService } from '../../services/leadService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LeadDetailsScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const leadId = route.params?.leadId || route.params?.lead?.id;
  
  const [lead, setLead] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [status, setStatus] = useState('');
  const [notes, setNotes] = useState('');
  
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    fetchLead();
    getUserRole();
  }, [leadId]);

  const getUserRole = async () => {
    const designation = await AsyncStorage.getItem('@designation');
    if (designation) {
      setUserRole(designation);
    }
  };

  const fetchLead = async () => {
    try {
      setLoading(true);
      const data = await leadService.getLeadById(leadId);
      setLead(data?.data || null);
      setStatus(data?.data?.status || '');
      setNotes(data?.data?.notes || '');
    } catch (error) {
      console.error('Error fetching lead details:', error);
      Alert.alert('Error', 'Failed to load lead details.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      setSaving(true);
      await leadService.convertLead(leadId, status, notes);
      Alert.alert('Success', 'Lead updated successfully!');
      fetchLead();
    } catch (error) {
      console.error('Error updating lead:', error);
      Alert.alert('Error', 'Failed to update lead.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#3B82F6" style={{ marginTop: 100 }} />
      </SafeAreaView>
    );
  }

  if (!lead) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Lead not found.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lead Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.infoCard}>
          <View style={styles.rowBetween}>
            <Text style={styles.leadName}>{lead.name}</Text>
            <Text style={styles.leadCode}>{lead.leadCode}</Text>
          </View>
          <Text style={styles.leadType}>{lead.type}</Text>
          
          <View style={styles.detailRow}>
            <Ionicons name="call-outline" size={16} color="#64748B" />
            <Text style={styles.detailText}>{lead.mobile || 'N/A'}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Ionicons name="mail-outline" size={16} color="#64748B" />
            <Text style={styles.detailText}>{lead.email || 'N/A'}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={16} color="#64748B" />
            <Text style={styles.detailText}>{lead.address || 'N/A'}, {lead.territory || 'No Territory'}</Text>
          </View>
        </View>

        {(userRole === 'NSM' || userRole === 'RSM') && (
          <View style={styles.assignCard}>
            <Text style={styles.sectionTitle}>Assignment</Text>
            <Text style={styles.assignText}>Assigned to: {lead.assignedToMr ? lead.assignedToMr.name : 'Unassigned'}</Text>
            <TouchableOpacity 
              style={styles.assignButton}
              onPress={() => navigation.navigate('LeadAssignment', { leadId: lead.id, currentMr: lead.assignedToMr })}
            >
              <Text style={styles.assignButtonText}>Change Assignment</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.updateCard}>
          <Text style={styles.sectionTitle}>Update Pipeline Stage</Text>
          
          <View style={styles.statusGrid}>
            {['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'WON', 'LOST'].map(s => (
              <TouchableOpacity 
                key={s} 
                style={[styles.statusOption, status === s && styles.statusSelected]}
                onPress={() => setStatus(s)}
              >
                <Text style={[styles.statusOptionText, status === s && styles.statusSelectedText]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.inputLabel}>Notes</Text>
          <TextInput
            style={styles.textArea}
            multiline
            numberOfLines={4}
            value={notes}
            onChangeText={setNotes}
            placeholder="Add update notes..."
          />

          <TouchableOpacity 
            style={[styles.saveButton, saving && { opacity: 0.7 }]} 
            onPress={handleUpdate}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.saveButtonText}>Save Updates</Text>
            )}
          </TouchableOpacity>
        </View>
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
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    marginTop: 100,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#94A3B8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leadName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  leadCode: {
    fontSize: 12,
    color: '#64748B',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  leadType: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#334155',
    marginLeft: 8,
  },
  assignCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 12,
  },
  assignText: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 16,
  },
  assignButton: {
    backgroundColor: '#DBEAFE',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  assignButtonText: {
    color: '#2563EB',
    fontWeight: '600',
  },
  updateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 40,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  statusOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  statusSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  statusOptionText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  statusSelectedText: {
    color: '#FFFFFF',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#475569',
    marginBottom: 8,
  },
  textArea: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  saveButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default LeadDetailsScreen;
