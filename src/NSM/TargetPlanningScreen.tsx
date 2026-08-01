import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { saveTargetPlanningData } from '../services/nsmStorageService';

const NSMTargetPlanningScreen = () => {
  const [activeCycle, setActiveCycle] = useState<'Monthly' | 'Quarterly' | 'Annual'>('Monthly');

  // Form Fields for 3.1, 3.2, 3.3
  const [financialYear, setFinancialYear] = useState('2026-27');
  const [selectedMonth, setSelectedMonth] = useState('August');
  const [selectedQuarter, setSelectedQuarter] = useState('Q2 (Jul-Sep)');
  const [selectedRegion, setSelectedRegion] = useState('South Zone');
  const [selectedRSM, setSelectedRSM] = useState('Arun Kumar (RSM001)');
  const [salesTarget, setSalesTarget] = useState('15000000');
  const [drVisitTarget, setDrVisitTarget] = useState('1200');
  const [chemistVisitTarget, setChemistVisitTarget] = useState('400');
  const [remarks, setRemarks] = useState('Production target allocation cycle');

  const handleSave = async () => {
    if (!salesTarget || !drVisitTarget || !chemistVisitTarget) {
      Alert.alert('⚠️ Input Required', 'Please enter Sales, Doctor Visit and Chemist Visit Targets.');
      return;
    }
    const payload = {
      cycle: activeCycle,
      financialYear,
      period: activeCycle === 'Monthly' ? selectedMonth : activeCycle === 'Quarterly' ? selectedQuarter : 'Full Year',
      selectedRegion,
      selectedRSM,
      salesTarget,
      drVisitTarget,
      chemistVisitTarget,
      remarks,
    };
    await saveTargetPlanningData(payload);
    Alert.alert(`✅ ${activeCycle} Target Saved`, `${activeCycle} target allocation for ${selectedRSM} saved successfully.`);
  };

  const handleReset = () => {
    setSalesTarget('');
    setDrVisitTarget('');
    setChemistVisitTarget('');
    setRemarks('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>🎯 Target Allocation Workspace</Text>
          <Text style={styles.subtitle}>Configure Monthly, Quarterly, and Annual Target allocations for RSMs.</Text>
        </View>

        {/* 3 Target Allocation Cycles: 3.1 Monthly, 3.2 Quarterly, 3.3 Annual */}
        <View style={styles.tabContainer}>
          <TouchableOpacity style={[styles.tab, activeCycle === 'Monthly' && styles.activeTab]} onPress={() => setActiveCycle('Monthly')}>
            <Text style={[styles.tabText, activeCycle === 'Monthly' && styles.activeTabText]}>3.1 Monthly</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.tab, activeCycle === 'Quarterly' && styles.activeTab]} onPress={() => setActiveCycle('Quarterly')}>
            <Text style={[styles.tabText, activeCycle === 'Quarterly' && styles.activeTabText]}>3.2 Quarterly</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.tab, activeCycle === 'Annual' && styles.activeTab]} onPress={() => setActiveCycle('Annual')}>
            <Text style={[styles.tabText, activeCycle === 'Annual' && styles.activeTabText]}>3.3 Annual</Text>
          </TouchableOpacity>
        </View>

        {/* Allocation Form Card */}
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>{activeCycle} Target Allocation Form</Text>

          <View style={styles.formRow}>
            <View style={styles.fieldHalf}>
              <Text style={styles.label}>Financial Year *</Text>
              <TextInput style={styles.input} value={financialYear} onChangeText={setFinancialYear} />
            </View>

            {activeCycle === 'Monthly' && (
              <View style={styles.fieldHalf}>
                <Text style={styles.label}>Month *</Text>
                <TextInput style={styles.input} value={selectedMonth} onChangeText={setSelectedMonth} />
              </View>
            )}

            {activeCycle === 'Quarterly' && (
              <View style={styles.fieldHalf}>
                <Text style={styles.label}>Quarter *</Text>
                <TextInput style={styles.input} value={selectedQuarter} onChangeText={setSelectedQuarter} />
              </View>
            )}

            {activeCycle === 'Annual' && (
              <View style={styles.fieldHalf}>
                <Text style={styles.label}>Planning Cycle</Text>
                <TextInput style={[styles.input, { backgroundColor: '#F1F5F9' }]} value="Annual Allocation" editable={false} />
              </View>
            )}
          </View>

          <View style={styles.formRow}>
            <View style={styles.fieldHalf}>
              <Text style={styles.label}>Region *</Text>
              <TextInput style={styles.input} value={selectedRegion} onChangeText={setSelectedRegion} />
            </View>

            <View style={styles.fieldHalf}>
              <Text style={styles.label}>Select RSM *</Text>
              <TextInput style={styles.input} value={selectedRSM} onChangeText={setSelectedRSM} />
            </View>
          </View>

          <View style={styles.formRow}>
            <View style={styles.fieldHalf}>
              <Text style={styles.label}>{activeCycle === 'Annual' ? 'Annual Sales Target (₹) *' : 'Sales Target (₹) *'}</Text>
              <TextInput style={styles.input} keyboardType="numeric" value={salesTarget} onChangeText={setSalesTarget} />
            </View>

            <View style={styles.fieldHalf}>
              <Text style={styles.label}>{activeCycle === 'Annual' ? 'Annual Doctor Visits *' : 'Doctor Visit Target *'}</Text>
              <TextInput style={styles.input} keyboardType="numeric" value={drVisitTarget} onChangeText={setDrVisitTarget} />
            </View>
          </View>

          <View style={styles.formRow}>
            <View style={styles.fieldHalf}>
              <Text style={styles.label}>{activeCycle === 'Annual' ? 'Annual Chemist Visits *' : 'Chemist Visit Target *'}</Text>
              <TextInput style={styles.input} keyboardType="numeric" value={chemistVisitTarget} onChangeText={setChemistVisitTarget} />
            </View>
          </View>

          <View style={{ marginBottom: 14 }}>
            <Text style={styles.label}>Remarks (Optional)</Text>
            <TextInput style={[styles.input, { height: 60 }]} multiline value={remarks} onChangeText={setRemarks} />
          </View>

          {/* Action Buttons: Save, Reset */}
          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Ionicons name="checkmark-circle-outline" size={16} color="#FFF" />
              <Text style={styles.saveBtnText}>Save Target</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
              <Ionicons name="refresh-outline" size={16} color="#D97706" />
              <Text style={styles.resetBtnText}>Reset</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Target Allocation Summary Table */}
        <View style={[styles.card, { marginTop: 14 }]}>
          <Text style={styles.cardSectionTitle}>Active {activeCycle} Allocations Summary</Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.th, { flex: 1.2 }]}>RSM</Text>
            <Text style={[styles.th, { flex: 1 }]}>Sales Target</Text>
            <Text style={[styles.th, { flex: 0.9 }]}>Dr Visits</Text>
            <Text style={[styles.th, { flex: 0.9, textAlign: 'right' }]}>Chemist</Text>
          </View>

          <View style={styles.tableRow}>
            <Text style={[styles.td, { flex: 1.2, fontWeight: 'bold' }]}>Arun Kumar</Text>
            <Text style={[styles.td, { flex: 1, color: '#4F46E5', fontWeight: 'bold' }]}>₹1.50 Cr</Text>
            <Text style={[styles.td, { flex: 0.9 }]}>1,200</Text>
            <Text style={[styles.td, { flex: 0.9, textAlign: 'right' }]}>400</Text>
          </View>

          <View style={styles.tableRow}>
            <Text style={[styles.td, { flex: 1.2, fontWeight: 'bold' }]}>Priya Sharma</Text>
            <Text style={[styles.td, { flex: 1, color: '#4F46E5', fontWeight: 'bold' }]}>₹1.80 Cr</Text>
            <Text style={[styles.td, { flex: 0.9 }]}>1,400</Text>
            <Text style={[styles.td, { flex: 0.9, textAlign: 'right' }]}>450</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default NSMTargetPlanningScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { padding: 16 },
  header: { marginBottom: 14 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#0F172A' },
  subtitle: { fontSize: 12, color: '#64748B', marginTop: 2 },

  tabContainer: { flexDirection: 'row', backgroundColor: '#E2E8F0', borderRadius: 10, padding: 3, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  activeTab: { backgroundColor: '#FFF', elevation: 1 },
  tabText: { fontSize: 11, fontWeight: '600', color: '#64748B' },
  activeTabText: { color: '#4F46E5', fontWeight: 'bold' },

  card: { backgroundColor: '#FFF', padding: 16, borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0' },
  cardSectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#0F172A', marginBottom: 14 },

  formRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  fieldHalf: { flex: 1 },
  label: { fontSize: 10, fontWeight: 'bold', color: '#64748B', marginBottom: 4 },
  input: { borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 6, fontSize: 12, backgroundColor: '#FFF' },

  btnRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  saveBtn: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: '#4F46E5', paddingVertical: 10, borderRadius: 8, gap: 6 },
  saveBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },
  resetBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: '#FEF3C7', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, gap: 4 },
  resetBtnText: { color: '#D97706', fontWeight: 'bold', fontSize: 13 },

  tableHeader: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', backgroundColor: '#F8FAFC' },
  th: { fontSize: 11, fontWeight: 'bold', color: '#64748B' },
  tableRow: { flexDirection: 'row', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  td: { fontSize: 12, color: '#334155' },
});