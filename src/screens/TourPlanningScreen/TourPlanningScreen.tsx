import { createTourPlan } from '../../services/tourPlanService';
import { getDoctors } from '../../services/doctorService';
import { getChemists } from '../../services/chemistService';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RNDateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker'; // ⬅️ Step 2: Added Picker Import

const safeJsonParse = (data: string | null, fallback: any) => {
  if (!data) return fallback;
  try {
    return JSON.parse(data);
  } catch (err) {
    console.log('safeJsonParse error in TourPlanningScreen:', err);
    return fallback;
  }
};

const TourPlanningScreen = () => {
  // Tomorrow's date helper (DD-MMM-YYYY)
  const getTomorrowDateString = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = tomorrow.getDate().toString().padStart(2, '0');
    const month = months[tomorrow.getMonth()];
    const year = tomorrow.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // Format date to DD-MMM-YYYY (e.g. 12-Jun-2026)
  const formatDate = (dateObj: Date) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = dateObj.getDate().toString().padStart(2, '0');
    const month = months[dateObj.getMonth()];
    const year = dateObj.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // Convert DD-MMM-YYYY back to YYYY-MM-DD for Web Date Input
  const getWebDateFormat = (dateStr: string) => {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const day = parts[0];
      const monthStr = parts[1];
      const year = parts[2];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthIdx = months.indexOf(monthStr) + 1;
      const month = monthIdx.toString().padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    return dateStr;
  };

  // Convert Web Date Input (YYYY-MM-DD) to ERP format (DD-MMM-YYYY)
  const handleDateChangeWeb = (val: string) => {
    if (!val) return;
    const parts = val.split('-');
    if (parts.length === 3) {
      const year = parts[0];
      const monthIdx = parseInt(parts[1]) - 1;
      const day = parts[2];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      setDate(`${day}-${months[monthIdx]}-${year}`);
    } else {
      setDate(val);
    }
  };

  // Convert AM/PM time format (09:00 AM) to HTML5 time format (09:00)
  const formatTime12to24 = (time12: string) => {
    const match = time12.match(/^(\d{2}):(\d{2})\s*(AM|PM)$/i);
    if (match) {
      let hours = parseInt(match[1]);
      const minutes = match[2];
      const ampm = match[3].toUpperCase();
      if (ampm === 'PM' && hours < 12) hours += 12;
      if (ampm === 'AM' && hours === 12) hours = 0;
      return `${hours.toString().padStart(2, '0')}:${minutes}`;
    }
    return '09:00';
  };

  // Convert HTML5 time format (13:30) to AM/PM format (01:30 PM)
  const formatTime24to12 = (time24: string) => {
    const parts = time24.split(':');
    if (parts.length === 2) {
      let hours = parseInt(parts[0]);
      const minutes = parts[1];
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      return `${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
    }
    return time24;
  };

  const [date, setDate] = useState(getTomorrowDateString());
  const [area, setArea] = useState('');
  const [beat, setBeat] = useState('');
  const [territory, setTerritory] = useState('');
  const [docCount, setDocCount] = useState('0');
  const [doctorsList, setDoctorsList] = useState('');
  const [chemistCount, setChemistCount] = useState('0');
  const [chemistsList, setChemistsList] = useState('');
  const [startTime, setStartTime] = useState('09:00 AM');
  const [endTime, setEndTime] = useState('06:00 PM');
  const [objective, setObjective] = useState('Field Work');
  const [planType, setPlanType] = useState('MTP');
  const [remarks, setRemarks] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const scrollViewRef = React.useRef<ScrollView>(null);

  // Real visits states
  const [doctorVisits, setDoctorVisits] = useState<any[]>([]);
  const [chemistVisits, setChemistVisits] = useState<any[]>([]);

  // Native iOS/Android picker states
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  // Editing state
  const [editingPlanId, setEditingPlanId] = useState<number | null>(null);

  // Doctors & Chemists arrays
  const [doctors, setDoctors] = useState<any[]>([]);
  const [chemists, setChemists] = useState<any[]>([]);

  // ⬅️ Step 3: Added Selection Tracking States
  const [selectedDoctorId, setSelectedDoctorId] = useState<number | null>(null);
  const [selectedChemistId, setSelectedChemistId] = useState<number | null>(null);
  const [selectedDoctorIds, setSelectedDoctorIds] = useState<number[]>([]);
  const [selectedChemistIds, setSelectedChemistIds] = useState<number[]>([]);

  // Web safe alert
  const customAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  // Auto calculate planned counts
  useEffect(() => {
    const names = doctorsList.split(',').map(n => n.trim()).filter(n => n !== '');
    setDocCount(names.length.toString());
  }, [doctorsList]);

  useEffect(() => {
    const names = chemistsList.split(',').map(n => n.trim()).filter(n => n !== '');
    setChemistCount(names.length.toString());
  }, [chemistsList]);

  useEffect(() => {
    loadPlans();
  }, []);

  useEffect(() => {
    const loadDoctors = async () => {
      try {
        const response = await getDoctors();
        setDoctors(response.data || []);
      } catch (error) {
        console.log('Doctor Load Error:', error);
      }
    };
    loadDoctors();
  }, []);

  useEffect(() => {
    const loadChemists = async () => {
      try {
        const response = await getChemists();
        setChemists(response.data || []);
      } catch (error) {
        console.log('Chemist Load Error:', error);
      }
    };
    loadChemists();
  }, []);

  const loadPlans = async () => {
    setLoading(true);
    setError(null);
    try {
      const storedPlans = await AsyncStorage.getItem('@tour_plans');
      setPlans(safeJsonParse(storedPlans, []));

      const storedDocVisits = await AsyncStorage.getItem('@doctor_visits');
      setDoctorVisits(safeJsonParse(storedDocVisits, []));

      const storedChemistVisits = await AsyncStorage.getItem('@chemist_visits');
      setChemistVisits(safeJsonParse(storedChemistVisits, []));
    } catch (error) {
      console.log('Failed to load tour plans data:', error);
      setError('Failed to load tour planning data.');
    } finally {
      setLoading(false);
    }
  };

  // Native Picker callbacks
  const onChangeDate = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(formatDate(selectedDate));
    }
  };

  const onChangeStartTime = (event: any, selectedTime?: Date) => {
    setShowStartTimePicker(false);
    if (selectedTime) {
      let hours = selectedTime.getHours();
      const minutes = selectedTime.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      setStartTime(`${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`);
    }
  };

  const onChangeEndTime = (event: any, selectedTime?: Date) => {
    setShowEndTimePicker(false);
    if (selectedTime) {
      let hours = selectedTime.getHours();
      const minutes = selectedTime.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      setEndTime(`${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`);
    }
  };

  const handleSubmit = async () => {
    if (!date.trim()) {
      customAlert('Error', 'Please enter a date for the tour.');
      return;
    }
    if (!territory.trim()) {
      customAlert('Error', 'Please enter the HQ / Territory.');
      return;
    }
    if (!area.trim()) {
      customAlert('Error', 'Please enter the target area.');
      return;
    }
    if (!beat.trim()) {
      customAlert('Error', 'Please enter the target beat name.');
      return;
    }

    if (objective !== 'Leave' && objective !== 'Training') {
      if (!doctorsList.trim() && !chemistsList.trim()) {
        customAlert('Error', 'At least 1 Doctor or Chemist must be planned.');
        return;
      }
    }

    const timeToMinutes = (timeStr: string) => {
      const match = timeStr.match(/^(\d{2}):(\d{2})\s*(AM|PM)$/i);
      if (!match) return 0;
      let hours = parseInt(match[1]);
      const mins = parseInt(match[2]);
      const ampm = match[3].toUpperCase();
      if (ampm === 'PM' && hours < 12) hours += 12;
      if (ampm === 'AM' && hours === 12) hours = 0;
      return hours * 60 + mins;
    };

    if (timeToMinutes(startTime) >= timeToMinutes(endTime)) {
      customAlert('Error', 'Start time must be before End time.');
      return;
    }

    if (
      selectedDoctorIds.length === 0 &&
      selectedChemistIds.length === 0 &&
      objective !== 'Leave' &&
      objective !== 'Training'
    ) {
      customAlert('Error', 'Please select at least one Doctor or Chemist');
      return;
    }

    if (editingPlanId !== null) {
      const updatedPlans = plans.map((p) => {
        if (p.id === editingPlanId) {
          return {
            ...p,
            date,
            area,
            beat,
            territory,
            planType,
            docCount: parseInt(docCount) || 0,
            doctorsList,
            chemistCount: parseInt(chemistCount) || 0,
            chemistsList,
            startTime,
            endTime,
            objective,
            remarks,
          };
        }
        return p;
      });

      setPlans(updatedPlans);
      try {
        await AsyncStorage.setItem('@tour_plans', JSON.stringify(updatedPlans));
        customAlert('✅ Plan Updated', 'The tour plan has been successfully updated.');
        
        setEditingPlanId(null);
        setArea('');
        setBeat('');
        setTerritory('');
        setDoctorsList('');
        setChemistsList('');
        setRemarks('');
        setSelectedDoctorIds([]);
        setSelectedChemistIds([]);
        setDate(getTomorrowDateString());
      } catch (error) {
        customAlert('Error', 'Failed to update tour plan.');
      }
    } else {
      try {
        await createTourPlan(
          new Date(date).toISOString(),
          territory,
          objective,
          selectedDoctorIds,
          selectedChemistIds
        );
        console.log('Tour Plan Saved Successfully');
      } catch (error: any) {
  console.log('TOUR PLAN ERROR:', error);
  console.log('TOUR PLAN ERROR RESPONSE:', error?.response?.data);

  Alert.alert(
    'Error',
    JSON.stringify(error?.response?.data || error.message)
  );
}

      const newPlan = {
        id: Date.now(),
        date,
        area,
        beat,
        territory,
        planType,
        docCount: selectedDoctorIds.length,
        doctorsList,
        chemistCount: selectedChemistIds.length,
        chemistsList,
        startTime,
        endTime,
        objective,
        remarks,
        status: 'Draft',
      };

      const updatedPlans = [newPlan, ...plans];
      setPlans(updatedPlans);

      try {
        await AsyncStorage.setItem('@tour_plans', JSON.stringify(updatedPlans));
        customAlert('✅ Tour Plan Submitted', `Route plan for ${area} - ${beat} has been successfully logged.`);
        
        setArea('');
        setBeat('');
        setTerritory('');
        setDoctorsList('');
        setChemistsList('');
        setRemarks('');
        setSelectedDoctorIds([]);
        setSelectedChemistIds([]);
        setDate(getTomorrowDateString());
      } catch (error) {
        customAlert('Error', 'Failed to save tour plan locally.');
      }
    }
  };

  const handleEditPlan = (plan: any) => {
    setEditingPlanId(plan.id);
    setDate(plan.date);
    setTerritory(plan.territory);
    setArea(plan.area);
    setBeat(plan.beat);
    setPlanType(plan.planType || 'MTP');
    setStartTime(plan.startTime);
    setEndTime(plan.endTime);
    setObjective(plan.objective);
    setDoctorsList(plan.doctorsList || '');
    setChemistsList(plan.chemistsList || '');
    setRemarks(plan.remarks || '');
    customAlert('Editing Plan', `Modifying plan for ${plan.area}. Update form fields above.`);
  };

  const handleDeletePlan = async (planId: number) => {
    const confirmDelete = Platform.OS === 'web' ? window.confirm('Are you sure you want to delete this tour plan?') : true;

    if (Platform.OS === 'web') {
      if (confirmDelete) {
        const updatedPlans = plans.filter(p => p.id !== planId);
        setPlans(updatedPlans);
        try {
          await AsyncStorage.setItem('@tour_plans', JSON.stringify(updatedPlans));
          customAlert('Deleted', 'Tour plan deleted successfully.');
        } catch (e) {
          console.log('Failed to delete plan');
        }
      }
    } else {
      Alert.alert(
        'Delete Tour Plan',
        'Are you sure you want to delete this plan?',
        [
          { text: 'No', style: 'cancel' },
          { 
            text: 'Yes', 
            onPress: async () => {
              const updatedPlans = plans.filter(p => p.id !== planId);
              setPlans(updatedPlans);
              try {
                await AsyncStorage.setItem('@tour_plans', JSON.stringify(updatedPlans));
                customAlert('Deleted', 'Tour plan deleted successfully.');
              } catch (e) {
                console.log('Failed to delete plan');
              }
            }
          }
        ]
      );
    }
  };

  const cycleStatus = async (planId: number) => {
    const updatedPlans = plans.map((p) => {
      if (p.id === planId) {
        let currentStatus = p.status || 'Draft';
        let nextStatus = 'Draft';
        if (currentStatus === 'Draft') nextStatus = 'Pending Approval';
        else if (currentStatus === 'Pending Approval') nextStatus = 'Approved';
        else if (currentStatus === 'Approved') nextStatus = 'Rejected';
        else if (currentStatus === 'Rejected') nextStatus = 'Completed';
        else nextStatus = 'Draft';
        return { ...p, status: nextStatus };
      }
      return p;
    });

    setPlans(updatedPlans);
    try {
      await AsyncStorage.setItem('@tour_plans', JSON.stringify(updatedPlans));
    } catch (e) {
      console.log('Failed to update tour status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved': return { bg: '#E8F5E9', text: '#2E7D32' };
      case 'Completed': return { bg: '#ECEFF1', text: '#37474F' };
      case 'Rejected': return { bg: '#FFEBEE', text: '#C62828' };
      case 'Draft': return { bg: '#F3E5F5', text: '#6A1B9A' };
      default: return { bg: '#FFF3E0', text: '#E65100' }; // Pending Approval
    }
  };

  const getVisitedDocsCount = (plan: any, list: any[]) => {
    const planned = (plan.doctorsList || '').split(',').map((n: string) => n.trim().toLowerCase()).filter((n: string) => n !== '');
    if (planned.length === 0) return 0;
    const matches = list.filter((v) => {
      const vDate = formatDate(new Date(v.id));
      if (vDate !== plan.date) return false;
      const vName = (v.doctorName || '').trim().toLowerCase();
      return planned.some((pName: string) => vName.includes(pName) || pName.includes(vName));
    });
    return matches.length;
  };

  const getVisitedChemistsCount = (plan: any, list: any[]) => {
    const planned = (plan.chemistsList || '').split(',').map((n: string) => n.trim().toLowerCase()).filter((n: string) => n !== '');
    if (planned.length === 0) return 0;
    const matches = list.filter((v) => {
      const vDate = formatDate(new Date(v.id));
      if (vDate !== plan.date) return false;
      const vName = (v.shopName || '').trim().toLowerCase();
      return planned.some((pName: string) => vName.includes(pName) || pName.includes(vName));
    });
    return matches.length;
  };

  const totalDocsPlanned = plans.reduce((sum, p) => sum + (p.docCount || 0), 0);
  const totalChemistsPlanned = plans.reduce((sum, p) => sum + (p.chemistCount || 0), 0);

  // Web input CSS shim styles
  const webInputStyle = {
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '12px',
    fontSize: '14px',
    backgroundColor: '#fafafa',
    fontFamily: 'sans-serif',
    width: '100%',
    boxSizing: 'border-box' as 'border-box',
    outline: 'none',
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView 
        ref={scrollViewRef}
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 280 }}
      >
        <Text style={styles.title}>🗺️ Tour Planning</Text>
        {loading ? (
          <View style={styles.loaderCard}>
            <ActivityIndicator size="large" color="#1E88E5" />
            <Text style={styles.loaderText}>Loading tour plans data...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>⚠️ {error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadPlans}>
              <Text style={styles.retryButtonText}>🔄 Retry Loading Tour Plans</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Dynamic Summary Cards */}
            <View style={styles.summaryRow}>
              <View style={[styles.summaryCard, { borderLeftColor: '#1E88E5' }]}>
                <Text style={styles.summaryValue}>{totalDocsPlanned}</Text>
                <Text style={styles.summaryLabel}>Doctors Planned</Text>
              </View>
              <View style={[styles.summaryCard, { borderLeftColor: '#43A047' }]}>
                <Text style={styles.summaryValue}>{totalChemistsPlanned}</Text>
                <Text style={styles.summaryLabel}>Chemists Planned</Text>
              </View>
              <View style={[styles.summaryCard, { borderLeftColor: '#8E24AA' }]}>
                <Text style={styles.summaryValue}>{totalDocsPlanned + totalChemistsPlanned}</Text>
                <Text style={styles.summaryLabel}>Total Calls</Text>
              </View>
            </View>

            <View style={styles.form}>
              {editingPlanId !== null && (
                <View style={styles.editBanner}>
                  <Text style={styles.editBannerText}>✏️ Editing Tour Plan</Text>
                </View>
              )}

              <Text style={styles.label}>Plan Type *</Text>
              <View style={styles.selectorRow}>
                {['MTP', 'WTP', 'DTP'].map((pt) => (
                  <TouchableOpacity
                    key={pt}
                    onPress={() => setPlanType(pt)}
                    style={[
                      styles.selectorButton,
                      planType === pt && styles.selectorActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.selectorText,
                        planType === pt && styles.selectorTextActive,
                      ]}
                    >
                      {pt === 'MTP' ? 'Monthly' : pt === 'WTP' ? 'Weekly' : 'Daily'} ({pt})
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Date Selector input (Web Picker vs Native Picker) */}
              <Text style={styles.label}>Tour Date *</Text>
              {Platform.OS === 'web' ? (
                <input
                  type="date"
                  value={getWebDateFormat(date)}
                  onChange={(e) => handleDateChangeWeb(e.target.value)}
                  style={webInputStyle}
                />
              ) : (
                <TouchableOpacity style={styles.input} onPress={() => setShowDatePicker(true)}>
                  <Text style={{ color: date ? '#333' : '#999' }}>{date || 'Select Tour Date'}</Text>
                </TouchableOpacity>
              )}
              {showDatePicker && (
                <RNDateTimePicker mode="date" value={new Date()} onChange={onChangeDate} />
              )}

              <Text style={styles.label}>HQ / Territory *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Hyderabad South"
                value={territory}
                onChangeText={setTerritory}
              />

              <Text style={styles.label}>Area / Route Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Kukatpally"
                value={area}
                onChangeText={setArea}
              />

              <Text style={styles.label}>Beat Name / Sub-route *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. KPHB Colony"
                value={beat}
                onChangeText={setBeat}
              />

              {/* Start / End Time Pickers */}
              <View style={styles.row}>
                <View style={styles.rowItem}>
                  <Text style={styles.label}>Start Time *</Text>
                  {Platform.OS === 'web' ? (
                    <input
                      type="time"
                      value={formatTime12to24(startTime)}
                      onChange={(e) => setStartTime(formatTime24to12(e.target.value))}
                      style={webInputStyle}
                    />
                  ) : (
                    <TouchableOpacity style={styles.input} onPress={() => setShowStartTimePicker(true)}>
                      <Text style={{ color: startTime ? '#333' : '#999' }}>{startTime || '09:00 AM'}</Text>
                    </TouchableOpacity>
                  )}
                  {showStartTimePicker && (
                    <RNDateTimePicker mode="time" value={new Date()} onChange={onChangeStartTime} />
                  )}
                </View>
                
                <View style={styles.rowItem}>
                  <Text style={styles.label}>End Time *</Text>
                  {Platform.OS === 'web' ? (
                    <input
                      type="time"
                      value={formatTime12to24(endTime)}
                      onChange={(e) => setEndTime(formatTime24to12(e.target.value))}
                      style={webInputStyle}
                    />
                  ) : (
                    <TouchableOpacity style={styles.input} onPress={() => setShowEndTimePicker(true)}>
                      <Text style={{ color: endTime ? '#333' : '#999' }}>{endTime || '06:00 PM'}</Text>
                    </TouchableOpacity>
                  )}
                  {showEndTimePicker && (
                    <RNDateTimePicker mode="time" value={new Date()} onChange={onChangeEndTime} />
                  )}
                </View>
              </View>

              <Text style={styles.label}>Objective / Purpose</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom: 8}}>
                <View style={styles.selectorRow}>
                  {['Field Work', 'Doctor Meeting', 'Payment Collection', 'Training', 'Leave'].map((obj) => (
                    <TouchableOpacity
                      key={obj}
                      onPress={() => setObjective(obj)}
                      style={[
                        styles.selectorButton,
                        objective === obj && styles.selectorActive,
                        { paddingHorizontal: 12 }
                      ]}
                    >
                      <Text
                        style={[
                          styles.selectorText,
                          objective === obj && styles.selectorTextActive,
                        ]}
                      >
                        {obj}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <View style={styles.row}>
                <View style={styles.rowItem}>
                  <Text style={styles.label}>Planned Doc Count (Auto)</Text>
                  <View style={styles.disabledInput}>
                    <Text style={styles.disabledInputText}>{docCount}</Text>
                  </View>
                </View>
                <View style={styles.rowItem}>
                  <Text style={styles.label}>Planned Chemist Count (Auto)</Text>
                  <View style={styles.disabledInput}>
                    <Text style={styles.disabledInputText}>{chemistCount}</Text>
                  </View>
                </View>
              </View>

              {/* ⬅️ Step 4: Added Doctor Dropdown Picker wrapper */}
              <Text style={styles.label}>Select Doctor *</Text>
              <View style={styles.pickerOutlineContainer}>
                <Picker
                  selectedValue={selectedDoctorId}
                  onValueChange={(value) => {
                    if (!value) return;
                    const doctorId = Number(value);
                    if (!selectedDoctorIds.includes(doctorId)) {
                      setSelectedDoctorIds([...selectedDoctorIds, doctorId]);
                      const doctor = doctors.find((d) => d.id === doctorId);
                      if (doctor) {
                        setDoctorsList(doctorsList ? `${doctorsList}, ${doctor.name}` : doctor.name);
                      }
                    }
                    setSelectedDoctorId(null);
                  }}
                >
                  <Picker.Item label="Select Doctor..." value={null} color="#94A3B8" />
                  {doctors.map((doctor) => (
                    <Picker.Item key={doctor.id} label={doctor.name} value={doctor.id} />
                  ))}
                </Picker>
              </View>

              {/* ⬅️ Step 5: Show Selected Doctors List */}
              <Text style={styles.selectedText}>
                {doctorsList || 'No doctors selected yet.'}
              </Text>

              {/* ⬅️ Step 6: Added Chemist Dropdown Picker wrapper */}
              <Text style={styles.label}>Select Chemist *</Text>
              <View style={styles.pickerOutlineContainer}>
                <Picker
                  selectedValue={selectedChemistId}
                  onValueChange={(value) => {
                    if (!value) return;
                    const chemistId = Number(value);
                    if (!selectedChemistIds.includes(chemistId)) {
                      setSelectedChemistIds([...selectedChemistIds, chemistId]);
                      const chemist = chemists.find((c) => c.id === chemistId);
                      if (chemist) {
                        setChemistsList(chemistsList ? `${chemistsList}, ${chemist.name}` : chemist.name);
                      }
                    }
                    setSelectedChemistId(null);
                  }}
                >
                  <Picker.Item label="Select Chemist..." value={null} color="#94A3B8" />
                  {chemists.map((chemist) => (
                    <Picker.Item key={chemist.id} label={chemist.name} value={chemist.id} />
                  ))}
                </Picker>
              </View>

              {/* ⬅️ Step 7: Show Selected Chemists List */}
              <Text style={styles.selectedText}>
                {chemistsList || 'No chemists selected yet.'}
              </Text>

              <Text style={styles.label}>Special Remarks</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Enter itinerary details or comments..."
                value={remarks}
                onChangeText={setRemarks}
                multiline
                numberOfLines={3}
                onFocus={() => {
                  setTimeout(() => {
                    scrollViewRef.current?.scrollToEnd({ animated: true });
                  }, 150);
                }}
              />

              <View style={styles.buttonRow}>
                <TouchableOpacity 
                  style={[styles.submitButton, editingPlanId !== null && { flex: 2 }]} 
                  onPress={handleSubmit}
                >
                  <Text style={styles.submitText}>
                    {editingPlanId !== null ? 'UPDATE PLAN' : 'SUBMIT TOUR PLAN'}
                  </Text>
                </TouchableOpacity>
                {editingPlanId !== null && (
                  <TouchableOpacity 
                    style={styles.cancelEditButton} 
                    onPress={() => {
                      setEditingPlanId(null);
                      setArea('');
                      setBeat('');
                      setTerritory('');
                      setDoctorsList('');
                      setChemistsList('');
                      setRemarks('');
                      setSelectedDoctorIds([]);
                      setSelectedChemistIds([]);
                      setDate(getTomorrowDateString());
                    }}
                  >
                    <Text style={styles.cancelEditText}>CANCEL</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Tour Plan List */}
            {plans.length > 0 && (
              <>
                <Text style={styles.historyTitle}>Submitted Tour Plans ({plans.length})</Text>
                
                <TextInput
                  style={[styles.input, { marginBottom: 15 }]}
                  placeholder="🔍 Search by Route, HQ, or Date..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />

                {plans.filter(p => {
                  const q = searchQuery.toLowerCase();
                  return (
                    (p.area && p.area.toLowerCase().includes(q)) ||
                    (p.territory && p.territory.toLowerCase().includes(q)) ||
                    (p.date && p.date.toLowerCase().includes(q)) ||
                    (p.beat && p.beat.toLowerCase().includes(q))
                  );
                }).map((plan) => {
                  const statusStyle = getStatusColor(plan.status);
                  
                  const actualDocsVisited = getVisitedDocsCount(plan, doctorVisits);
                  const actualChemistsVisited = getVisitedChemistsCount(plan, chemistVisits);
                  
                  const totalPlanned = plan.docCount + plan.chemistCount;
                  const totalVisited = actualDocsVisited + actualChemistsVisited;
                  const kpiPercentage = totalPlanned > 0 ? Math.round((totalVisited / totalPlanned) * 100) : 0;

                  return (
                    <View key={plan.id} style={styles.planCard}>
                      <View style={styles.planHeader}>
                        <View style={{ flex: 1, paddingRight: 10 }}>
                          <Text style={styles.planDate}>📅 Date: {plan.date}</Text>
                          <Text style={styles.planArea}>📍 HQ: {plan.territory || 'N/A'}</Text>
                          <Text style={styles.planSubroute}>🛤️ {plan.planType || 'MTP'} Route: {plan.area} (Beat: {plan.beat || 'N/A'})</Text>
                        </View>
                        <TouchableOpacity 
                          onPress={() => cycleStatus(plan.id)}
                          style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}
                        >
                          <Text style={[styles.statusBadgeText, { color: statusStyle.text }]}>
                            {(plan.status || 'Pending Approval')} 🔄
                          </Text>
                        </TouchableOpacity>
                      </View>
                      <Text style={styles.planInfo}>🕐 Hours: {plan.startTime} - {plan.endTime}</Text>
                      <Text style={styles.planInfo}>🎯 Objective: {plan.objective}</Text>
                      <Text style={styles.planInfo}>🩺 Doctors Planned: {plan.docCount} ({plan.doctorsList || 'None'})</Text>
                      <Text style={styles.planInfo}>💊 Chemists Planned: {plan.chemistCount} ({plan.chemistsList || 'None'})</Text>
                      {plan.remarks ? (
                        <Text style={styles.planInfo}>💬 Remarks: {plan.remarks}</Text>
                      ) : null}

                      {plan.status === 'Completed' && totalPlanned > 0 && (
                        <View style={styles.kpiCard}>
                          <Text style={styles.kpiTitle}>📊 Actual Tour Performance KPI:</Text>
                          <Text style={styles.kpiItem}>🩺 Visited Doctors: {actualDocsVisited} / {plan.docCount}</Text>
                          <Text style={styles.kpiItem}>💊 Visited Chemists: {actualChemistsVisited} / {plan.chemistCount}</Text>
                          <Text style={styles.kpiScore}>Route Achievement: {kpiPercentage}%</Text>
                        </View>
                      )}

                      <View style={styles.cardDivider} />

                      {['Draft', 'Pending Approval', 'Rejected'].includes(plan.status) && (
                        <View style={styles.actionsRow}>
                          <TouchableOpacity 
                            onPress={() => handleEditPlan(plan)}
                            style={[styles.actionButtonItem, styles.editBtn]}
                          >
                            <Text style={styles.actionButtonText}>✏️ Edit</Text>
                          </TouchableOpacity>
                          <TouchableOpacity 
                            onPress={() => handleDeletePlan(plan.id)}
                            style={[styles.actionButtonItem, styles.cancelBtn]}
                          >
                            <Text style={styles.actionButtonText}>🗑️ Delete</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  );
                })}
              </>
            )}
          </>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default TourPlanningScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    padding: 20,
    paddingTop: 50,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  summaryRow: {
    flex: 'row',
    gap: 12,
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  summaryLabel: {
    fontSize: 11,
    color: '#777',
    marginTop: 2,
  },
  editBanner: {
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#1E88E5',
  },
  editBannerText: {
    fontSize: 13,
    color: '#0D47A1',
    fontWeight: 'bold',
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#444',
    marginBottom: 6,
    marginTop: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  rowItem: {
    flex: 1,
  },
  disabledInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#eceff1',
    justifyContent: 'center',
  },
  disabledInputText: {
    fontSize: 14,
    color: '#555',
    fontWeight: 'bold',
  },
  selectorRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  selectorButton: {
    flex: 1,
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#eee',
  },
  selectorActive: {
    backgroundColor: '#1E88E5',
  },
  selectorText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#333',
  },
  selectorTextActive: {
    color: '#fff',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#fafafa',
  },
  pickerOutlineContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fafafa',
    justifyContent: 'center',
  },
  textArea: {
    height: 70,
    textAlignVertical: 'top',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#1E88E5',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  cancelEditButton: {
    flex: 1,
    backgroundColor: '#757575',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelEditText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  planCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    elevation: 1,
    borderLeftWidth: 4,
    borderLeftColor: '#1E88E5',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  planDate: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  planArea: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 2,
  },
  planSubroute: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E88E5',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  planInfo: {
    fontSize: 13,
    color: '#555',
    marginTop: 3,
  },
  kpiCard: {
    backgroundColor: '#F1F8E9',
    borderColor: '#DCEDC8',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
  },
  kpiTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#33691E',
  },
  kpiItem: {
    fontSize: 11,
    color: '#558B2F',
    marginTop: 2,
  },
  kpiScore: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1B5E20',
    marginTop: 4,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 10,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  actionButtonItem: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  editBtn: {
    backgroundColor: '#E3F2FD',
  },
  cancelBtn: {
    backgroundColor: '#FFEBEE',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  loaderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    marginVertical: 20,
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
    borderRadius: 8,
    padding: 16,
    marginVertical: 15,
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
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  // ⬅️ Step 8: Appended Requested Custom Selection Styling Text Style
  selectedText: {
    color: '#475569',
    marginTop: 6,
    marginBottom: 12,
    fontSize: 13,
  },
});