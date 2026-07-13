import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

// ── API Services (no AsyncStorage for data) ──────────────────────────────────
import { getDoctorVisitsByMr } from '../../services/doctorService';
import { getChemistVisitsByMr } from '../../services/chemistService';
import { getAttendanceLogs } from '../../services/attendanceService';
import { getExpensesByMr } from '../../services/expenseService';
import { getMeetingsByMr } from '../../services/meetingService';
import { getFollowUpsByMr } from '../../services/followUpService';
import { getRetailerOrders } from '../../services/orderService';

// ── Types ─────────────────────────────────────────────────────────────────────
type ActivityType =
  | 'visit'
  | 'order'
  | 'expense'
  | 'attendance'
  | 'meeting'
  | 'followup'
  | 'report';

interface ActivityLog {
  id: number | string;
  time: string;    // "HH:MM AM/PM" display string
  date: string;    // "DD-MM-YYYY" display string
  type: ActivityType;
  title: string;
  details: string;
  timestamp: number; // epoch ms for sorting
}

type TabKey = 'All' | ActivityType;

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Format an ISO timestamp (or any Date-parseable string) to "hh:mm AM/PM" */
const formatTime = (raw: string | null | undefined): string => {
  if (!raw) return '—';
  const d = new Date(raw);
  if (isNaN(d.getTime())) return '—';
  const h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, '0');
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = ((h % 12) || 12).toString();
  return `${hour}:${m} ${period}`;
};

/** Format an ISO timestamp to "DD-MM-YYYY" */
const formatDate = (raw: string | null | undefined): string => {
  if (!raw) return '—';
  const d = new Date(raw);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB').replace(/\//g, '-');
};

/** Resolve epoch ms from any raw date/time field */
const toEpoch = (raw: string | null | undefined): number => {
  if (!raw) return 0;
  const t = new Date(raw).getTime();
  return isNaN(t) ? 0 : t;
};

/** Safely call an async API function; returns fallback on error */
async function safeCall<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    const result = await fn();
    return (Array.isArray(result) ? result : result ?? fallback) as T;
  } catch {
    return fallback;
  }
}

// ── Tab Configuration ─────────────────────────────────────────────────────────
const TABS: { key: TabKey; label: string; emoji: string }[] = [
  { key: 'All',        label: 'ALL',        emoji: '📋' },
  { key: 'visit',      label: 'VISITS',     emoji: '🩺' },
  { key: 'order',      label: 'ORDERS',     emoji: '📦' },
  { key: 'meeting',    label: 'MEETINGS',   emoji: '🤝' },
  { key: 'expense',    label: 'EXPENSES',   emoji: '💵' },
  { key: 'attendance', label: 'ATTENDANCE', emoji: '📍' },
  { key: 'followup',   label: 'FOLLOW-UPS', emoji: '🔔' },
  { key: 'report',     label: 'REPORTS',    emoji: '📄' },
];

// ── Badge colours ─────────────────────────────────────────────────────────────
const BADGE_COLOR: Record<string, string> = {
  visit:      '#06B6D4',
  order:      '#10B981',
  expense:    '#F59E0B',
  attendance: '#8B5CF6',
  meeting:    '#6366F1',
  followup:   '#E11D48',
  report:     '#3B82F6',
};

// ── Main Component ────────────────────────────────────────────────────────────
const ActivityTrackingScreen = () => {
  const navigation = useNavigation();
  const [logs, setLogs]           = useState<ActivityLog[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>('All');
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);

  const compileActivityLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const compiled: ActivityLog[] = [];

      // ── 1. Doctor Visits ────────────────────────────────────────────────────
      const doctorVisits = await safeCall(() => getDoctorVisitsByMr(), []);
      const dvArr = Array.isArray(doctorVisits) ? doctorVisits : [];
      dvArr.forEach((d: any, idx: number) => {
        // doctor name: may come via join as d.doctor.name, or d.doctorName
        const doctorName =
          d.doctor?.name ||
          d.doctorName ||
          (d.doctorId ? `Doctor #${d.doctorId}` : 'Unknown Doctor');

        const specialty = d.doctor?.specialization || d.specialty || '—';
        const hospital  = d.doctor?.hospital || d.hospital || '—';
        const rawTs     = d.visitDate || d.createdAt || d.visitedAt;
        const ts        = toEpoch(rawTs);

        compiled.push({
          id:        d.id || `dv-${idx}`,
          time:      formatTime(rawTs),
          date:      formatDate(rawTs),
          type:      'visit',
          title:     `🩺 Doctor Visited: Dr. ${doctorName}`,
          details:   `Specialty: ${specialty} | Hospital: ${hospital} | Notes: ${d.remarks || d.notes || 'None'}`,
          timestamp: ts,
        });
      });

      // ── 2. Chemist Visits ───────────────────────────────────────────────────
      const chemistVisits = await safeCall(() => getChemistVisitsByMr(), []);
      const cvArr = Array.isArray(chemistVisits) ? chemistVisits : [];
      cvArr.forEach((c: any, idx: number) => {
        // chemist name: may come via join as c.chemist.name / c.chemist.shopName
        const shopName =
          c.chemist?.shopName ||
          c.chemist?.name ||
          c.shopName ||
          c.chemistName ||
          (c.chemistId ? `Chemist #${c.chemistId}` : 'Unknown Chemist');

        const rawTs = c.visitDate || c.createdAt || c.visitedAt;
        const ts    = toEpoch(rawTs);

        compiled.push({
          id:        c.id || `cv-${idx}`,
          time:      formatTime(rawTs),
          date:      formatDate(rawTs),
          type:      'visit',
          title:     `💊 Chemist Visited: ${shopName}`,
          details:   `Products: ${c.productsDiscussed || c.medicine || 'None'} | Order Value: ₹${c.orderValue ?? c.orderAmount ?? 0}`,
          timestamp: ts,
        });
      });

      // ── 3. Retailer Orders ──────────────────────────────────────────────────
      const orders = await safeCall(() => getRetailerOrders(), []);
      const ordArr = Array.isArray(orders) ? orders : [];
      ordArr.forEach((o: any, idx: number) => {
        const customerName =
          o.retailer?.name ||
          o.customerName ||
          o.customer ||
          (o.retailerId ? `Retailer #${o.retailerId}` : 'Unknown Customer');

        const rawTs = o.orderDate || o.createdAt || o.submittedAt;
        const ts    = toEpoch(rawTs);

        compiled.push({
          id:        o.id || `ord-${idx}`,
          time:      formatTime(rawTs),
          date:      formatDate(rawTs),
          type:      'order',
          title:     `📦 Order Booked: #${o.id || '—'}`,
          details:   `Customer: ${customerName} | Amount: ₹${o.totalAmount ?? '—'} | Status: ${o.status || 'Pending'}`,
          timestamp: ts,
        });
      });

      // ── 4. Expense Claims ───────────────────────────────────────────────────
      const expenses = await safeCall(() => getExpensesByMr(), []);
      const expArr = Array.isArray(expenses) ? expenses : [];
      expArr.forEach((e: any, idx: number) => {
        const rawTs = e.submittedAt || e.expenseDate || e.createdAt;
        const ts    = toEpoch(rawTs);

        compiled.push({
          id:        e.id || `exp-${idx}`,
          time:      formatTime(rawTs),
          date:      formatDate(rawTs),
          type:      'expense',
          title:     `💵 Expense Claimed: ${e.expenseType || e.type || e.category || 'Miscellaneous'}`,
          details:   `Amount: ₹${e.amount ?? '—'} | Purpose: ${e.description || e.remarks || 'N/A'} | Status: ${e.status || 'Pending'}`,
          timestamp: ts,
        });
      });

      // ── 5. Attendance ───────────────────────────────────────────────────────
      const attendance = await safeCall(() => getAttendanceLogs(), []);
      const attArr = Array.isArray(attendance) ? attendance : [];
      attArr.forEach((a: any, idx: number) => {
        // Check-In entry
        const checkInRaw = a.checkInTime || a.checkinTime || a.createdAt;
        if (checkInRaw) {
          compiled.push({
            id:        `att-in-${a.id || idx}`,
            time:      formatTime(checkInRaw),
            date:      formatDate(checkInRaw),
            type:      'attendance',
            title:     '📍 Attendance: Checked-In',
            details:   `Status: ${a.status || 'Present'} | Location: ${a.checkInAddress || a.location || '—'}`,
            timestamp: toEpoch(checkInRaw),
          });
        }

        // Check-Out entry (only if checked out)
        const checkOutRaw = a.checkOutTime || a.checkoutTime;
        if (checkOutRaw) {
          compiled.push({
            id:        `att-out-${a.id || idx}`,
            time:      formatTime(checkOutRaw),
            date:      formatDate(checkOutRaw),
            type:      'attendance',
            title:     '🏁 Attendance: Checked-Out',
            details:   `Duration logged | Status: ${a.status || 'Present'}`,
            timestamp: toEpoch(checkOutRaw),
          });
        }
      });

      // ── 6. Meetings ─────────────────────────────────────────────────────────
      const meetings = await safeCall(() => getMeetingsByMr(), []);
      const meetArr = Array.isArray(meetings) ? meetings : [];
      meetArr.forEach((m: any, idx: number) => {
        const rawTs = m.meetingDate || m.date || m.createdAt;
        const ts    = toEpoch(rawTs);

        compiled.push({
          id:        `meet-${m.id || idx}`,
          time:      formatTime(rawTs),
          date:      formatDate(rawTs),
          type:      'meeting',
          title:     `🤝 Meeting: ${m.topic || m.title || 'General Meeting'}`,
          details:   `Venue: ${m.venue || m.location || '—'} | Participants: ${m.attendees || m.participants || '—'} | Status: ${m.status || 'Scheduled'}`,
          timestamp: ts,
        });
      });

      // ── 7. Follow-Ups ───────────────────────────────────────────────────────
      const followUps = await safeCall(() => getFollowUpsByMr(), []);
      const fupArr = Array.isArray(followUps) ? followUps : [];
      fupArr.forEach((f: any, idx: number) => {
        const rawTs = f.followUpDate || f.scheduledDate || f.createdAt;
        const doctorName =
          f.doctor?.name || f.doctorName || (f.doctorId ? `Doctor #${f.doctorId}` : '—');

        compiled.push({
          id:        `fup-${f.id || idx}`,
          time:      formatTime(rawTs),
          date:      formatDate(rawTs),
          type:      'followup',
          title:     `🔔 Follow-Up: Dr. ${doctorName}`,
          details:   `Scheduled: ${formatDate(rawTs)} | Status: ${f.status || 'Pending'} | Remarks: ${f.remarks || f.notes || 'None'}`,
          timestamp: toEpoch(rawTs),
        });
      });

      // ── Sort newest first ────────────────────────────────────────────────────
      compiled.sort((a, b) => b.timestamp - a.timestamp);
      setLogs(compiled);
    } catch (e) {
      console.error('Error compiling activity logs:', e);
      setError('Failed to load activity data. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { compileActivityLogs(); }, []));

  const filteredLogs = activeTab === 'All'
    ? logs
    : logs.filter((log) => log.type === activeTab);

  // KPI counts
  const kpiCounts = {
    total:      logs.length,
    visits:     logs.filter(l => l.type === 'visit').length,
    orders:     logs.filter(l => l.type === 'order').length,
    meetings:   logs.filter(l => l.type === 'meeting').length,
    expenses:   logs.filter(l => l.type === 'expense').length,
    attendance: logs.filter(l => l.type === 'attendance').length,
    followups:  logs.filter(l => l.type === 'followup').length,
  };

  return (
    <View style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => (navigation as any).goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Activity Tracking</Text>
        <Text style={styles.headerSubtitle}>
          All field activities, visits, orders, and meetings loaded live from the server.
        </Text>
      </View>

      {/* ── KPI Summary Bar ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.kpiScrollContainer}
      >
        {[
          { label: 'Total',      value: kpiCounts.total      },
          { label: 'Visits',     value: kpiCounts.visits     },
          { label: 'Orders',     value: kpiCounts.orders     },
          { label: 'Meetings',   value: kpiCounts.meetings   },
          { label: 'Expenses',   value: kpiCounts.expenses   },
          { label: 'Follow-Ups', value: kpiCounts.followups  },
        ].map((kpi) => (
          <View key={kpi.label} style={styles.kpiCard}>
            <Text style={styles.kpiValue}>{loading ? '—' : kpi.value}</Text>
            <Text style={styles.kpiLabel}>{kpi.label}</Text>
          </View>
        ))}
      </ScrollView>

      {/* ── Filter Tabs ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsContainer}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={[styles.tabButton, isActive && styles.activeTabButton]}
              hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
            >
              <Text style={[styles.tabText, isActive && styles.activeTabText]}>
                {tab.emoji} {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── Activity Table ── */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <ActivityIndicator
            size="large"
            color="#4F46E5"
            style={{ marginVertical: 40 }}
          />
        ) : error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>⚠️ {error}</Text>
            <TouchableOpacity
              onPress={compileActivityLogs}
              style={styles.retryButton}
            >
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : filteredLogs.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>
              {activeTab === 'meeting' ? '🤝' : '📋'}
            </Text>
            <Text style={styles.emptyText}>
              No {activeTab === 'All' ? 'activity' : activeTab} records found.
            </Text>
            <Text style={styles.emptySubText}>
              {activeTab === 'meeting'
                ? 'Schedule a meeting to see it here.'
                : 'Complete some field activities to see them here.'}
            </Text>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator>
            <View style={styles.tableContainer}>
              {/* Table Header */}
              <View style={styles.tableHeader}>
                <Text style={[styles.thText, styles.colDate]}>DATE</Text>
                <Text style={[styles.thText, styles.colTime]}>TIME</Text>
                <Text style={[styles.thText, styles.colType]}>TYPE</Text>
                <Text style={[styles.thText, styles.colTitle]}>ACTIVITY</Text>
                <Text style={[styles.thText, styles.colDetails]}>DETAILS</Text>
              </View>

              {/* Table Rows */}
              {filteredLogs.map((log, index) => (
                <View
                  key={`${log.id}-${index}`}
                  style={[
                    styles.tableRow,
                    index % 2 === 1 && styles.tableRowEven,
                  ]}
                >
                  {/* Date */}
                  <Text style={[styles.tdText, styles.colDate, styles.tdDate]}>
                    {log.date}
                  </Text>

                  {/* Time */}
                  <Text style={[styles.tdText, styles.colTime, styles.tdTime]}>
                    {log.time}
                  </Text>

                  {/* Type Badge */}
                  <View style={[styles.colType, { justifyContent: 'center' }]}>
                    <View
                      style={[
                        styles.badge,
                        { backgroundColor: BADGE_COLOR[log.type] ?? '#4F46E5' },
                      ]}
                    >
                      <Text style={styles.badgeText}>{log.type}</Text>
                    </View>
                  </View>

                  {/* Activity Title */}
                  <Text
                    style={[styles.tdText, styles.colTitle, styles.tdTitle]}
                    numberOfLines={2}
                  >
                    {log.title}
                  </Text>

                  {/* Details */}
                  <Text
                    style={[styles.tdText, styles.colDetails, styles.tdDetails]}
                    numberOfLines={3}
                  >
                    {log.details}
                  </Text>
                </View>
              ))}
            </View>
          </ScrollView>
        )}
      </ScrollView>
    </View>
  );
};

export default ActivityTrackingScreen;

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },

  // Header
  header: {
    backgroundColor: '#4F46E5',
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginBottom: 12,
  },
  backButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#E0E7FF',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 17,
  },

  // KPI Bar
  kpiScrollContainer: {
    paddingHorizontal: 15,
    paddingTop: 18,
    paddingBottom: 6,
  },
  kpiCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginRight: 10,
    alignItems: 'center',
    minWidth: 72,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    elevation: 2,
  },
  kpiValue: { fontSize: 20, fontWeight: 'bold', color: '#1E293B' },
  kpiLabel: { fontSize: 10, color: '#64748B', fontWeight: '600', marginTop: 2 },

  // Filter Tabs
  tabsContainer: {
    paddingHorizontal: 15,
    marginTop: 12,
    paddingBottom: 8,
    gap: 8,
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 22,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTabButton: { backgroundColor: '#4F46E5' },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    letterSpacing: 0.3,
  },
  activeTabText: { color: '#FFFFFF' },

  // Scroll content
  scrollContent: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 80 },

  // Table
  tableContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  thText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
    alignItems: 'flex-start',
  },
  tableRowEven: { backgroundColor: '#F8FAFC' },
  tdText: { fontSize: 12, color: '#334155', marginRight: 8 },

  // Column widths
  colDate:    { width: 90 },
  colTime:    { width: 76 },
  colType:    { width: 80 },
  colTitle:   { width: 200 },
  colDetails: { width: 280 },

  // Cell variants
  tdDate:    { color: '#64748B', fontWeight: '600' },
  tdTime:    { fontWeight: '700', color: '#475569' },
  tdTitle:   { fontWeight: 'bold', color: '#1E293B' },
  tdDetails: { color: '#64748B', lineHeight: 17 },

  // Badge
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 9,
    color: '#FFFFFF',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Empty / Error cards
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 36,
    alignItems: 'center',
    marginTop: 20,
  },
  emptyIcon:    { fontSize: 40, marginBottom: 12 },
  emptyText:    { fontSize: 15, color: '#475569', fontWeight: '600', textAlign: 'center' },
  emptySubText: { fontSize: 12, color: '#94A3B8', marginTop: 6, textAlign: 'center', lineHeight: 18 },

  errorCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  errorText: { fontSize: 13, color: '#EF4444', textAlign: 'center', lineHeight: 20 },
  retryButton: {
    marginTop: 14,
    backgroundColor: '#4F46E5',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 24,
  },
  retryText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 13 },
});