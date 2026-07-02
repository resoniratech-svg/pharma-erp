import React, { useState, useEffect } from 'react';
import {
  getTargetsByMr
} from '../../services/targetService';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

interface MonthlyTarget {
  month: string;
  salesAchieved: number;
  salesTarget: number;
  docsVisited: number;
  docsTarget: number;
  chemistsVisited: number;
  chemistsTarget: number;
  incentiveEarned: number;
}

const safeJsonParse = (data: string | null, fallback: any) => {
  if (!data) return fallback;
  try {
    return JSON.parse(data);
  } catch (err) {
    console.log('safeJsonParse error in TargetTrackingScreen:', err);
    return fallback;
  }
};

const TargetTrackingScreen = () => {
  const navigation = useNavigation<any>();

  // Current month stats
  const [salesAchieved, setSalesAchieved] = useState(0);
  const [docsVisited, setDocsVisited] = useState(0);
  const [chemistsVisited, setChemistsVisited] = useState(0);

  // Dynamic Targets
  const [salesTarget, setSalesTarget] = useState(50000);
  const [docsTarget, setDocsTarget] = useState(30);
  const [chemistsTarget, setChemistsTarget] = useState(20);

  useEffect(() => {

  loadTargets();

  loadCurrentMonthPerformance();

}, []);

  const loadTargets = async () => {

  try {

    const targets =
      await getTargetsByMr();

    console.log(
      'TARGETS:',
      targets
    );

    if (
      targets &&
      targets.length > 0
    ) {

      const currentTarget =
        targets[0];

      setDocsTarget(
        currentTarget.doctorVisitTarget
      );

      setChemistsTarget(
        currentTarget.chemistVisitTarget
      );

      setSalesTarget(
        Number(
          currentTarget.orderTarget
        )
      );

    }

  } catch (error) {

    console.log(
      'Target Load Error:',
      error
    );

  }
};

  const loadCurrentMonthPerformance = async () => {
    try {
      const today = new Date();
      const currentMonthStr = String(today.getMonth() + 1).padStart(2, '0');
      const currentYearStr = String(today.getFullYear());
      
      const isCurrentMonth = (dateStr: string) => {
        if (!dateStr) return false;
        const shortMonthYear = today.toLocaleString('en-US', { month: 'short', year: 'numeric' }); // e.g. Jun 2026
        
        return dateStr.includes(`${currentYearStr}-${currentMonthStr}`) || 
               dateStr.includes(shortMonthYear) ||
               (dateStr.includes(today.toLocaleString('en-US', { month: 'short' })) && dateStr.includes(currentYearStr));
      };

      // Load Dynamic Targets
      // const targetsData = await AsyncStorage.getItem('@monthly_targets');
      // const targets = safeJsonParse(targetsData, { sales: 50000, docs: 30, chemists: 20 });
      // setSalesTarget(targets.sales);
      // setDocsTarget(targets.docs);
      // setChemistsTarget(targets.chemists);

      // 1. Calculate Doctor Visits
      const docVisitsData = await AsyncStorage.getItem('@doctor_visits');
      const docVisitsList = safeJsonParse(docVisitsData, []).filter((v: any) => isCurrentMonth(v.visitDate || v.date));
      setDocsVisited(docVisitsList.length);

      // 2. Calculate Chemist Visits
      const chemistVisitsData = await AsyncStorage.getItem('@chemist_visits');
      const chemistVisitsList = safeJsonParse(chemistVisitsData, []).filter((v: any) => isCurrentMonth(v.visitDate || v.date));
      setChemistsVisited(chemistVisitsList.length);

      // 3. Calculate Sales total (Orders + Chemist POB)
      const ordersData = await AsyncStorage.getItem('@orders');
      const ordersList = safeJsonParse(ordersData, []).filter((o: any) => isCurrentMonth(o.dateFormatted || o.date));

      const ordersTotal = ordersList.reduce((sum: number, item: any) => {
        return sum + (parseFloat(item.totalAmount) || 0);
      }, 0);

      const chemistTotal = chemistVisitsList.reduce((sum: number, item: any) => {
        return sum + (parseFloat(item.orderValue || item.pobAmount) || 0);
      }, 0);

      setSalesAchieved(ordersTotal + chemistTotal);
    } catch (e) {
      console.log('Failed to load targets:', e);
    }
  };

  const getPercentage = (achieved: number, target: number) => {
    return Math.min(Math.round((achieved / target) * 100), 100);
  };

  // Incentive Logic: If all targets are 100% achieved, MR gets 5% of sales as incentive
  const salesPercent = getPercentage(salesAchieved, salesTarget);
  const docsPercent = getPercentage(docsVisited, docsTarget);
  const chemistsPercent = getPercentage(chemistsVisited, chemistsTarget);

  const isEligibleForIncentive = salesPercent >= 100 && docsPercent >= 100 && chemistsPercent >= 100;
  const estimatedIncentive = isEligibleForIncentive ? Math.round(salesAchieved * 0.05) : 0;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>⬅️ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>📊 Target & Performance</Text>
        <Text style={styles.headerSubtitle}>Track achievements & incentive payouts</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Dynamic Progress Cards */}
        <Text style={styles.sectionTitle}>Active Monthly Targets</Text>

        {/* 1. Sales Progress */}
        <View style={styles.progressCard}>
          <View style={styles.cardInfoRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardLabel}>💰 Monthly Sales Target</Text>
              <Text style={styles.cardValues}>
                ₹{salesAchieved.toLocaleString()} / ₹{salesTarget.toLocaleString()}
              </Text>
              <Text style={[styles.cardValues, { fontSize: 12, color: '#64748B', marginTop: 2 }]}>
                Remaining: ₹{Math.max(0, salesTarget - salesAchieved).toLocaleString()}
              </Text>
            </View>
            <Text style={[styles.percentText, { color: '#2563EB' }]}>{salesPercent}%</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${salesPercent}%`, backgroundColor: '#3B82F6' }]} />
          </View>
        </View>

        {/* 2. Doctor Meets */}
        <View style={styles.progressCard}>
          <View style={styles.cardInfoRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardLabel}>🩺 Doctor Meets Target</Text>
              <Text style={styles.cardValues}>
                {docsVisited} / {docsTarget} Visits
              </Text>
              <Text style={[styles.cardValues, { fontSize: 12, color: '#64748B', marginTop: 2 }]}>
                Remaining: {Math.max(0, docsTarget - docsVisited)}
              </Text>
            </View>
            <Text style={[styles.percentText, { color: '#059669' }]}>{docsPercent}%</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${docsPercent}%`, backgroundColor: '#10B981' }]} />
          </View>
        </View>

        {/* 3. Chemist Meets */}
        <View style={styles.progressCard}>
          <View style={styles.cardInfoRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardLabel}>💊 Chemist Meets Target</Text>
              <Text style={styles.cardValues}>
                {chemistsVisited} / {chemistsTarget} Visits
              </Text>
              <Text style={[styles.cardValues, { fontSize: 12, color: '#64748B', marginTop: 2 }]}>
                Remaining: {Math.max(0, chemistsTarget - chemistsVisited)}
              </Text>
            </View>
            <Text style={[styles.percentText, { color: '#D97706' }]}>{chemistsPercent}%</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${chemistsPercent}%`, backgroundColor: '#F59E0B' }]} />
          </View>
        </View>

        {/* Incentive Eligibility Box */}
        <Text style={styles.sectionTitle}>Incentive Estimator</Text>
        <View style={[
          styles.incentiveCard,
          isEligibleForIncentive ? styles.eligibleBg : styles.notEligibleBg
        ]}>
          <Text style={styles.incentiveTitle}>
            {isEligibleForIncentive ? '🎉 Congratulations!' : '⏳ Keep Going!'}
          </Text>
          <Text style={styles.incentiveDesc}>
            {isEligibleForIncentive 
              ? 'You have fully met all monthly meet & sales targets. You qualify for a 5% incentive!'
              : 'Complete 100% of all active targets (Sales, Doctor, & Chemist visits) to unlock monthly commission incentives.'}
          </Text>
          <View style={styles.divider} />
          <View style={styles.incentiveRow}>
            <Text style={styles.incentiveLabel}>Estimated Commission payout:</Text>
            <Text style={[
              styles.incentiveValue,
              { color: isEligibleForIncentive ? '#059669' : '#64748B' }
            ]}>
              ₹{estimatedIncentive.toLocaleString()}
            </Text>
          </View>
        </View>


        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

export default TargetTrackingScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#4F46E5',
    paddingTop: 60,
    paddingBottom: 25,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 15,
    top: 50,
    zIndex: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  backButtonText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#E0E7FF',
    textAlign: 'center',
    marginTop: 6,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1E293B',
    marginVertical: 12,
  },
  progressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  cardInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  cardValues: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
    marginTop: 4,
  },
  percentText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  incentiveCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 15,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  eligibleBg: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  notEligibleBg: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  incentiveTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  incentiveDesc: {
    fontSize: 13,
    color: '#475569',
    marginTop: 6,
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 12,
  },
  incentiveRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  incentiveLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#475569',
  },
  incentiveValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  pastCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  pastHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 8,
  },
  pastMonth: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  pastIncentive: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#059669',
    backgroundColor: '#D1FAE5',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  pastGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pastGridItem: {
    flex: 1,
    alignItems: 'center',
  },
  pastGridLabel: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 4,
  },
  pastGridValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#334155',
  },
});