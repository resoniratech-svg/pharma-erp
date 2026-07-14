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
import { getDailyReportsByMr } from '../../services/dailyReportService';

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

// ── Badge colors ─────────────────────────────────────────────────────────────
const BADGE_COLOR: Record<string, string> = {
  visit:      '#06B6D4',
  order:      '#10B981',
  expense:    '#F59E0B',
  attendance: '#8B5CF6',
  meeting:    '#6366F1',
  followup:   '#E11D48',
  report:     '#3B82F6',
};

const BADGE_EMOJI: Record<string, string> = {
  visit:      '🩺',
  order:      '📦',
  expense:    '💵',
  attendance: '📍',
  meeting:    '🤝',
  followup:   '🔔',
  report:     '📄',
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
          title:     `Doctor Visited: Dr. ${doctorName}`,
          details:   `Specialty: ${specialty} | Hospital: ${hospital} | Notes: ${d.remarks || d.notes || 'None'}`,
          timestamp: ts,
        });
      });

      // ── 2. Chemist Visits ───────────────────────────────────────────────────
      const chemistVisits = await safeCall(() => getChemistVisitsByMr(), []);
      const cvArr = Array.isArray(chemistVisits) ? chemistVisits : [];
      cvArr.forEach((c: any, idx: number) => {
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
          title:     `Chemist Visited: ${shopName}`,
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
          title:     `Order Booked: #${o.id || '—'}`,
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
          title:     `Expense Claimed: ${e.expenseType || e.type || e.category || 'Miscellaneous'}`,
          details:   `Amount: ₹${e.amount ?? '—'} | Purpose: ${e.description || e.remarks || 'N/A'} | Status: ${e.status || 'Pending'}`,
          timestamp: ts,
        });
      });

      // ── 5. Attendance ───────────────────────────────────────────────────────
      const attendance = await safeCall(() => getAttendanceLogs(), []);
      const attArr = Array.isArray(attendance) ? attendance : [];
      attArr.forEach((a: any, idx: number) => {
        const checkInRaw = a.checkInTime || a.checkinTime || a.createdAt;
        if (checkInRaw) {
          compiled.push({
            id:        `att-in-${a.id || idx}`,
            time:      formatTime(checkInRaw),
            date:      formatDate(checkInRaw),
            type:      'attendance',
            title:     'Attendance: Checked-In',
            details:   `Status: ${a.status || 'Present'} | Location: ${a.checkInAddress || a.location || '—'}`,
            timestamp: toEpoch(checkInRaw),
          });
        }

        const checkOutRaw = a.checkOutTime || a.checkoutTime;
        if (checkOutRaw) {
          compiled.push({
            id:        `att-out-${a.id || idx}`,
            time:      formatTime(checkOutRaw),
            date:      formatDate(checkOutRaw),
            type:      'attendance',
            title:     'Attendance: Checked-Out',
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
          title:     `Meeting: ${m.topic || m.title || 'General Meeting'}`,
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
          title:     `Follow-Up: Dr. ${doctorName}`,
          details:   `Scheduled: ${formatDate(rawTs)} | Status: ${f.status || 'Pending'} | Remarks: ${f.remarks || f.notes || 'None'}`,
          timestamp: toEpoch(rawTs),
        });
      });

      // ── 8. Daily Reports ───────────────────────────────────────────────────
      const reports = await safeCall(() => getDailyReportsByMr(), []);
      const repArr = Array.isArray(reports) ? reports : [];
      repArr.forEach((r: any, idx: number) => {
        const rawTs = r.reportDate || r.createdAt;
        const ts    = toEpoch(rawTs);

        compiled.push({
          id:        `rep-${r.id || idx}`,
          time:      formatTime(rawTs),
          date:      formatDate(rawTs),
          type:      'report',
          title:     `Daily Report Submitted`,
          details:   `Visits: ${r.doctorVisits || 0} Dr / ${r.chemistVisits || 0} Chm | Samples Distributed: ${r.samplesDistributed || 0} | Orders: ${r.ordersCollected || 0} | Remarks: ${r.remarks || 'None'}`,
          timestamp: ts,
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
    reports:    logs.filter(l => l.type === 'report').length,
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
          Real-time field action summary and audit logs loaded live from server.
        </Text>
      </View>

      {/* ── KPI Summary Bar ── */}
      <View>
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
            { label: 'Reports',    value: kpiCounts.reports    },
          ].map((kpi) => (
            <View key={kpi.label} style={styles.kpiCard}>
              <Text style={styles.kpiValue}>{loading ? '—' : kpi.value}</Text>
              <Text style={styles.kpiLabel}>{kpi.label}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* ── Filter Tabs ── */}
      <View>
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
      </View>

      {/* ── Activity Mobile Timeline ── */}
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
              {activeTab === 'meeting' ? '🤝' : activeTab === 'report' ? '📄' : '📋'}
            </Text>
            <Text style={styles.emptyText}>
              No {activeTab === 'All' ? 'activity' : activeTab} records found.
            </Text>
            <Text style={styles.emptySubText}>
              {activeTab === 'meeting'
                ? 'Schedule a meeting to see it here.'
                : activeTab === 'report'
                ? 'Submit a daily report to see it here.'
                : 'Complete some field activities to see them here.'}
            </Text>
          </View>
        ) : (
          <View style={styles.timelineContainer}>
            {filteredLogs.map((log, index) => {
              const isLast = index === filteredLogs.length - 1;
              const themeColor = BADGE_COLOR[log.type] ?? '#4F46E5';
              const emoji = BADGE_EMOJI[log.type] ?? '📋';

              return (
                <View key={`${log.id}-${index}`} style={styles.timelineItem}>
                  {/* Left Column: Date & Time */}
                  <View style={styles.timelineLeft}>
                    <Text style={styles.timelineTime}>{log.time}</Text>
                    <Text style={styles.timelineDate}>{log.date}</Text>
                  </View>

                  {/* Middle Column: Line and Dot Indicator */}
                  <View style={styles.timelineMiddle}>
                    <View style={[styles.timelineDot, { backgroundColor: themeColor }]}>
                      <Text style={styles.timelineDotIcon}>{emoji}</Text>
                    </View>
                    {!isLast && <View style={[styles.timelineLine, { backgroundColor: '#E2E8F0' }]} />}
                  </View>

                  {/* Right Column: Card Details */}
                  <View style={styles.timelineRight}>
                    <View style={[styles.logCard, { borderLeftColor: themeColor }]}>
                      <View style={styles.cardHeader}>
                        <Text style={styles.logTitle}>{log.title}</Text>
                        <View style={[styles.badge, { backgroundColor: themeColor }]}>
                          <Text style={styles.badgeText}>{log.type}</Text>
                        </View>
                      </View>
                      <Text style={styles.logDetails}>{log.details}</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
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
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginBottom: 8,
  },
  backButtonText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#E0E7FF',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 15,
  },

  // KPI Bar
  kpiScrollContainer: {
    paddingHorizontal: 15,
    paddingTop: 12,
    paddingBottom: 6,
  },
  kpiCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    alignItems: 'center',
    minWidth: 70,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  kpiValue: { fontSize: 16, fontWeight: 'bold', color: '#1E293B' },
  kpiLabel: { fontSize: 9, color: '#64748B', fontWeight: '600', marginTop: 1 },

  // Filter Tabs
  tabsContainer: {
    paddingHorizontal: 15,
    marginTop: 8,
    paddingBottom: 8,
  },
  tabButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  activeTabButton: { backgroundColor: '#4F46E5' },
  tabText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    letterSpacing: 0.2,
  },
  activeTabText: { color: '#FFFFFF' },

  // Scroll content
  scrollContent: { paddingHorizontal: 15, paddingTop: 8, paddingBottom: 60 },

  // Timeline Layout
  timelineContainer: {
    width: '100%',
    paddingTop: 10,
  },
  timelineItem: {
    flexDirection: 'row',
    width: '100%',
    minHeight: 80,
  },
  timelineLeft: {
    width: 65,
    paddingRight: 6,
    alignItems: 'flex-end',
    paddingTop: 12,
  },
  timelineTime: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  timelineDate: {
    fontSize: 9,
    color: '#64748B',
    marginTop: 2,
  },
  timelineMiddle: {
    width: 32,
    alignItems: 'center',
    position: 'relative',
  },
  timelineDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    elevation: 2,
    marginTop: 10,
  },
  timelineDotIcon: {
    fontSize: 11,
  },
  timelineLine: {
    position: 'absolute',
    top: 30,
    bottom: 0,
    width: 2,
    zIndex: 1,
  },
  timelineRight: {
    flex: 1,
    paddingBottom: 15,
    paddingLeft: 4,
  },

  // Log Card
  logCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    width: '100%',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
    gap: 8,
  },
  logTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1E293B',
    flex: 1,
    lineHeight: 17,
  },
  logDetails: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
    marginTop: 2,
  },

  // Badge
  badge: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 8,
    color: '#FFFFFF',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },

  // Empty / Error cards
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    marginTop: 15,
  },
  emptyIcon:    { fontSize: 36, marginBottom: 10 },
  emptyText:    { fontSize: 14, color: '#475569', fontWeight: '600', textAlign: 'center' },
  emptySubText: { fontSize: 11, color: '#94A3B8', marginTop: 4, textAlign: 'center', lineHeight: 16 },

  errorCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginTop: 15,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  errorText: { fontSize: 12, color: '#EF4444', textAlign: 'center', lineHeight: 18 },
  retryButton: {
    marginTop: 12,
    backgroundColor: '#4F46E5',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 20,
  },
  retryText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 12 },
});