import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, TextInput, ActivityIndicator, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { leadService } from '../../services/leadService';
import RNDateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LeadCreationScreen = () => {
  const navigation = useNavigation<any>();
  
  const [loading, setLoading] = useState(false);

  // Form State
  const [leadDate, setLeadDate] = useState(new Date());
  const [showLeadDatePicker, setShowLeadDatePicker] = useState(false);
  
  const [leadName, setLeadName] = useState('');
  const [leadType, setLeadType] = useState('Distributor');
  const [contactPerson, setContactPerson] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [state, setState] = useState('');
  const [district, setDistrict] = useState('');
  const [city, setCity] = useState('');
  const [territory, setTerritory] = useState('');
  const [status, setStatus] = useState('New');
  
  const [leadSource, setLeadSource] = useState('Direct Visit');
  const [assignedTo, setAssignedTo] = useState('');
  const [priority, setPriority] = useState('Medium');
  
  const [followUpDate, setFollowUpDate] = useState<Date | null>(null);
  const [showFollowUpDatePicker, setShowFollowUpDatePicker] = useState(false);

  const handleSave = async () => {
    if (!leadName || !contactPerson || !mobileNumber) {
      Alert.alert('Validation Error', 'Please fill in all mandatory fields (Name, Contact Person, Mobile).');
      return;
    }

    try {
      setLoading(true);
      const userStr = await AsyncStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      
      const payload = {
        name: leadName,
        type: leadType,
        mobile: mobileNumber,
        email: '', // Add email if needed, omitted from image UI
        address: `${city}, ${district}, ${state}`,
        territory: territory,
        status: status.toUpperCase(), // Assuming backend expects uppercase
        notes: `Source: ${leadSource}, Priority: ${priority}`,
        assignedToMrId: user?.mr?.id || user?.id || null, // Auto assign to logged in MR
      };

      await leadService.createLead(payload);
      
      Alert.alert('Success', 'Lead created successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Error creating lead:', error);
      Alert.alert('Error', 'Failed to create lead.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}/${date.getFullYear()}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="close" size={28} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add New Lead</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        {/* Section 1: Basic Information */}
        <Text style={styles.sectionTitle}>1. BASIC INFORMATION</Text>
        <View style={styles.divider} />
        
        <View style={styles.row}>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Lead ID</Text>
            <TextInput style={[styles.input, styles.disabledInput]} value="Auto Generated" editable={false} />
          </View>
          
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Lead Date *</Text>
            <TouchableOpacity style={styles.dateInput} onPress={() => setShowLeadDatePicker(true)}>
              <Text>{formatDate(leadDate)}</Text>
              <Ionicons name="calendar-outline" size={16} color="#64748B" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Lead Name *</Text>
            <TextInput 
              style={styles.input} 
              placeholder="e.g. Dr. Ramesh Sharma" 
              value={leadName}
              onChangeText={setLeadName}
            />
          </View>
          
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Lead Type *</Text>
            <View style={styles.pickerContainer}>
              <Picker selectedValue={leadType} onValueChange={setLeadType} style={styles.picker}>
                <Picker.Item label="Distributor" value="Distributor" />
                <Picker.Item label="Retailer" value="Retailer" />
                <Picker.Item label="Hospital" value="Hospital" />
                <Picker.Item label="Doctor" value="Doctor" />
              </Picker>
            </View>
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Contact Person *</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Enter name" 
              value={contactPerson}
              onChangeText={setContactPerson}
            />
          </View>
          
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Mobile Number *</Text>
            <TextInput 
              style={styles.input} 
              placeholder="e.g. 9876543210" 
              keyboardType="phone-pad"
              value={mobileNumber}
              onChangeText={setMobileNumber}
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>State</Text>
            <View style={styles.pickerContainer}>
              <Picker selectedValue={state} onValueChange={setState} style={styles.picker}>
                <Picker.Item label="Select State" value="" />
                <Picker.Item label="Maharashtra" value="Maharashtra" />
                <Picker.Item label="Karnataka" value="Karnataka" />
              </Picker>
            </View>
          </View>
          
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>District</Text>
            <View style={styles.pickerContainer}>
              <Picker selectedValue={district} onValueChange={setDistrict} style={styles.picker}>
                <Picker.Item label="Select District" value="" />
                <Picker.Item label="Mumbai" value="Mumbai" />
                <Picker.Item label="Bangalore" value="Bangalore" />
              </Picker>
            </View>
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>City</Text>
            <View style={styles.pickerContainer}>
              <Picker selectedValue={city} onValueChange={setCity} style={styles.picker}>
                <Picker.Item label="Select City" value="" />
                <Picker.Item label="Andheri" value="Andheri" />
                <Picker.Item label="Koramangala" value="Koramangala" />
              </Picker>
            </View>
          </View>
          
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Territory</Text>
            <View style={styles.pickerContainer}>
              <Picker selectedValue={territory} onValueChange={setTerritory} style={styles.picker}>
                <Picker.Item label="Select Territory" value="" />
                <Picker.Item label="Andheri West" value="Andheri West" />
                <Picker.Item label="Bangalore South" value="Bangalore South" />
              </Picker>
            </View>
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Status *</Text>
            <View style={styles.pickerContainer}>
              <Picker selectedValue={status} onValueChange={setStatus} style={styles.picker}>
                <Picker.Item label="New" value="New" />
                <Picker.Item label="Contacted" value="Contacted" />
                <Picker.Item label="Qualified" value="Qualified" />
              </Picker>
            </View>
          </View>
        </View>

        {/* Section 2: Sales Information */}
        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>2. SALES INFORMATION</Text>
        <View style={styles.divider} />
        
        <View style={styles.row}>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Lead Source *</Text>
            <View style={styles.pickerContainer}>
              <Picker selectedValue={leadSource} onValueChange={setLeadSource} style={styles.picker}>
                <Picker.Item label="Direct Visit" value="Direct Visit" />
                <Picker.Item label="Referral" value="Referral" />
                <Picker.Item label="Camp" value="Camp" />
              </Picker>
            </View>
          </View>
          
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Assigned To</Text>
            <View style={styles.pickerContainer}>
              <Picker selectedValue={assignedTo} onValueChange={setAssignedTo} style={styles.picker}>
                <Picker.Item label="Self" value="Self" />
              </Picker>
            </View>
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Priority *</Text>
            <View style={styles.pickerContainer}>
              <Picker selectedValue={priority} onValueChange={setPriority} style={styles.picker}>
                <Picker.Item label="High" value="High" />
                <Picker.Item label="Medium" value="Medium" />
                <Picker.Item label="Low" value="Low" />
              </Picker>
            </View>
          </View>
          
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Follow-Up Date</Text>
            <TouchableOpacity style={styles.dateInput} onPress={() => setShowFollowUpDatePicker(true)}>
              <Text style={{ color: followUpDate ? '#000' : '#94A3B8' }}>
                {followUpDate ? formatDate(followUpDate) : 'mm/dd/yyyy'}
              </Text>
              <Ionicons name="calendar-outline" size={16} color="#64748B" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveText}>Save Lead</Text>}
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* Modals for Date Picker */}
      {showLeadDatePicker && (
        <RNDateTimePicker
          value={leadDate}
          mode="date"
          display="default"
          onChange={(event, date) => {
            setShowLeadDatePicker(Platform.OS === 'ios');
            if (date) setLeadDate(date);
          }}
        />
      )}
      {showFollowUpDatePicker && (
        <RNDateTimePicker
          value={followUpDate || new Date()}
          mode="date"
          display="default"
          onChange={(event, date) => {
            setShowFollowUpDatePicker(Platform.OS === 'ios');
            if (date) setFollowUpDate(date);
          }}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
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
    padding: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1E40AF',
    marginBottom: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#1E40AF',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 16,
  },
  fieldContainer: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    color: '#0F172A',
    marginBottom: 6,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
  },
  disabledInput: {
    backgroundColor: '#F8FAFC',
    color: '#64748B',
  },
  dateInput: {
    height: 44,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerContainer: {
    height: 44,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  picker: {
    height: 44,
    width: '100%',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
    marginBottom: 40,
    gap: 12,
  },
  cancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cancelText: {
    color: '#475569',
    fontWeight: '600',
  },
  saveBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#1E3A8A',
    minWidth: 120,
    alignItems: 'center',
  },
  saveText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default LeadCreationScreen;
