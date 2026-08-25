import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getAttendanceLogs } from '../../services/attendanceService';
import { getChemistVisitsByMr } from '../../services/chemistService';
import { getMrDashboardAnalytics } from '../../services/dashboardService';
import { getDoctorVisitsByMr } from '../../services/doctorService';
import { getAllFollowUps, getFollowUpsByMr } from '../../services/followUpService';
import { getMeetingsByMr } from '../../services/meetingService';
import { getRetailerOrders } from '../../services/orderService';

interface RecentOrder {
  id: string; client: string; status: 'Shipped' | 'Pending' | 'Failed'; amount: string; date: string;
}

const DashboardScreen = () => {
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();

  // Helper for GPS distance calculation
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Helper for robust date parsing (cross-platform DD-MMM-YYYY support)
  const parseCustomDate = (dateStr: string) => {
    if (!dateStr) return 0;
    const parts = dateStr.split('-');
    if (parts.length === 3) {
       if (parts[0].length === 4) return new Date(dateStr).getTime();
       const months = { 'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5, 'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11 } as any;
       if (isNaN(parseInt(parts[1], 10))) {
          return new Date(parseInt(parts[2], 10), months[parts[1]], parseInt(parts[0], 10)).getTime();
       }
       return new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10)).getTime();
    }
    return new Date(dateStr).getTime() || 0;
  };

  // Helper to format ISO timestamps or raw time strings to user-friendly local format (e.g., 10:08 AM)
  const formatTimeForDisplay = (rawTime: string): string => {
    if (!rawTime) return '';
    const trimmed = rawTime.trim();
    if (/\d{1,2}:\d{2}\s*(AM|PM|am|pm)/i.test(trimmed)) {
      return trimmed;
    }
    try {
      const parsedDate = new Date(trimmed);
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
    } catch {
      // Ignore
    }
    return trimmed;
  };

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showMROps, setShowMROps] = useState(false);
  const [showGPS, setShowGPS] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showCRM, setShowCRM] = useState(false);

  const [docCount, setDocCount] = useState(0);
  const [chemistCount, setChemistCount] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [ordersCount, setOrdersCount] = useState(0);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState('');
  const [hasCheckedOut, setHasCheckedOut] = useState(false);

  const [salesProgress, setSalesProgress] = useState(0);
  const [doctorProgress, setDoctorProgress] = useState(0);
  const [chemistProgress, setChemistProgress] = useState(0);
  // Monthly totals shown under the progress bars (separate from today's KPI counts)
  const [monthlyDocCount, setMonthlyDocCount] = useState(0);
  const [monthlyChemistCount, setMonthlyChemistCount] = useState(0);
  const [monthlySalesAmount, setMonthlySalesAmount] = useState(0);
  
  const [followUps, setFollowUps] = useState<any[]>([]);
  const [recentOrdersList, setRecentOrdersList] = useState<RecentOrder[]>([]);
  const [scheduleList, setScheduleList] = useState<any[]>([]);
  
  const [recentVisitsList, setRecentVisitsList] = useState<any[]>([]);
  const [notificationsList, setNotificationsList] = useState<any[]>([]);
  const [gpsData, setGpsData] = useState<any>(null);

  const [userName, setUserName] = useState('');
  const [designation, setDesignation] = useState('Medical Representative');

  const [dynamicTargets, setDynamicTargets] = useState({ sales: 50000, docs: 30, chemists: 20 });

  useEffect(() => { if (isFocused) loadStats(); }, [isFocused]);

  const loadStats = async () => {
    let docVisitsList: any[] = [];
    let chemistVisitsList: any[] = [];
    let ordersList: any[] = [];
    let targets = { sales: 50000, docs: 30, chemists: 20 };
    let determinedCheckedIn = false;
    let determinedCheckInTime = '';

    let apiDocVisits: any[] = [];
    let apiChemVisits: any[] = [];
    let serverOrders: any[] = [];
    let stats: any = null;

    let loadedFromServer = false;

    // 1. Try to fetch dynamic real-time stats and lists from backend in parallel
    try {
      const results = await Promise.allSettled([
        getMrDashboardAnalytics(),
        getDoctorVisitsByMr(),
        getChemistVisitsByMr(),
        getRetailerOrders()
      ]);

      if (results[0].status === 'fulfilled') {
        stats = results[0].value;
      }
      if (results[1].status === 'fulfilled') {
        apiDocVisits = Array.isArray(results[1].value) ? results[1].value : [];
      }
      if (results[2].status === 'fulfilled') {
        apiChemVisits = Array.isArray(results[2].value) ? results[2].value : [];
      }
      if (results[3].status === 'fulfilled') {
        serverOrders = Array.isArray(results[3].value) ? results[3].value : [];
      }
    } catch (e) {
      console.log('Dashboard parallel load failed:', e);
    }

    try {
      if (stats) {
        // Today's counts
        const todayDocs = stats.todayDoctorVisits?.completed || 0;
        const todayChemists = stats.todayChemistVisits?.completed || 0;
        setDocCount(todayDocs);
        setChemistCount(todayChemists);
        setOrdersCount(stats.todayOrders?.count || 0);
        setTotalOrders(stats.todayOrders?.amount || 0);
        
        // Guard: only trust attendance if the date returned by server is today's date
        const todayStr = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
        const attendanceDate = stats.attendance?.date
          ? String(stats.attendance.date).slice(0, 10)
          : null;
        const isCheckedInToday = stats.attendance?.status === 'Present'
          && (!attendanceDate || attendanceDate === todayStr);
        if (isCheckedInToday) {
          determinedCheckedIn = true;
          determinedCheckInTime = formatTimeForDisplay(stats.attendance?.checkInTime || '');
        }

        // Targets from backend (with safe fallbacks)
        targets = {
          sales: stats.monthlyProgress?.sales?.target || 50000,
          docs:  stats.monthlyProgress?.docs?.target  || 30,
          chemists: stats.monthlyProgress?.chemists?.target || 20,
        };
        setDynamicTargets(targets);

        // Monthly achieved values from backend
        let monthlyDocsDone     = stats.monthlyProgress?.docs?.actual
                                 ?? stats.monthlyProgress?.docs?.completed
                                 ?? stats.monthlyProgress?.docs?.count
                                 ?? 0;
        let monthlyChemistsDone = stats.monthlyProgress?.chemists?.actual
                                 ?? stats.monthlyProgress?.chemists?.completed
                                 ?? stats.monthlyProgress?.chemists?.count
                                 ?? 0;
        let monthlySalesDone    = stats.monthlyProgress?.sales?.actual
                                 ?? stats.monthlyProgress?.sales?.achieved
                                 ?? stats.monthlyProgress?.sales?.amount
                                 ?? stats.todayOrders?.amount
                                 ?? 0;

        // ✅ Dynamic Fallback: Calculate monthly counts if backend returns 0
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth(); // 0-indexed

        if (monthlyDocsDone === 0 && apiDocVisits.length > 0) {
          const currentMonthDocVisits = apiDocVisits.filter((v: any) => {
            const dateStr = v.visitDate || v.createdAt;
            if (!dateStr) return false;
            const d = new Date(dateStr);
            return !isNaN(d.getTime()) && d.getFullYear() === currentYear && d.getMonth() === currentMonth;
          });
          monthlyDocsDone = currentMonthDocVisits.length;
        }

        if (monthlyChemistsDone === 0 && apiChemVisits.length > 0) {
          const currentMonthChemVisits = apiChemVisits.filter((c: any) => {
            const dateStr = c.visitDate || c.createdAt;
            if (!dateStr) return false;
            const d = new Date(dateStr);
            return !isNaN(d.getTime()) && d.getFullYear() === currentYear && d.getMonth() === currentMonth;
          });
          monthlyChemistsDone = currentMonthChemVisits.length;
        }

        if (monthlySalesDone === 0 && serverOrders.length > 0) {
          const currentMonthOrders = serverOrders.filter((o: any) => {
            const dateStr = o.orderDate || o.createdAt || o.date;
            if (!dateStr) return false;
            const d = new Date(dateStr);
            return !isNaN(d.getTime()) && d.getFullYear() === currentYear && d.getMonth() === currentMonth;
          });
          monthlySalesDone = currentMonthOrders.reduce((sum: number, o: any) => sum + (parseFloat(o.totalAmount || o.amount) || 0), 0);
        }

        // Calculate progress percentages ourselves
        setMonthlyDocCount(monthlyDocsDone);
        setMonthlyChemistCount(monthlyChemistsDone);
        setMonthlySalesAmount(monthlySalesDone);
        setDoctorProgress(
          targets.docs > 0
            ? Math.min(Math.round((monthlyDocsDone / targets.docs) * 100), 100)
            : 0
        );
        setChemistProgress(
          targets.chemists > 0
            ? Math.min(Math.round((monthlyChemistsDone / targets.chemists) * 100), 100)
            : 0
        );
        setSalesProgress(
          targets.sales > 0
            ? Math.min(Math.round((monthlySalesDone / targets.sales) * 100), 100)
            : 0
        );

        console.log('[Dashboard] Computed progress — Docs:', monthlyDocsDone, '/', targets.docs,
          '| Chemists:', monthlyChemistsDone, '/', targets.chemists,
          '| Sales:', monthlySalesDone, '/', targets.sales);

        loadedFromServer = true;
      }
    } catch (err) {
      console.log('Failed to fetch dashboard stats from server, falling back to local storage:', err);
    }

    // 2. Fallback to AsyncStorage if server load failed
    if (!loadedFromServer) {
      try {
        const targetsData = await AsyncStorage.getItem('@monthly_targets');
        if (targetsData) targets = JSON.parse(targetsData);
      } catch (e) { console.log(e); }

      try {
        const docVisitsData = await AsyncStorage.getItem('@doctor_visits');
        docVisitsList = docVisitsData ? JSON.parse(docVisitsData) : [];
        setDocCount(docVisitsList.length);
        setDoctorProgress(Math.min(Math.round((docVisitsList.length / targets.docs) * 100), 100));
      } catch (e) { console.log(e); }

      let chemistTotal = 0;
      try {
        const chemistVisitsData = await AsyncStorage.getItem('@chemist_visits');
        chemistVisitsList = chemistVisitsData ? JSON.parse(chemistVisitsData) : [];
        setChemistCount(chemistVisitsList.length);
        chemistTotal = chemistVisitsList.reduce((sum: number, item: any) => sum + (parseFloat(item.orderValue || item.pobAmount) || 0), 0);
        setChemistProgress(Math.min(Math.round((chemistVisitsList.length / targets.chemists) * 100), 100));
      } catch (e) { console.log(e); }

      let ordersTotal = 0;
      try {
        const ordersData = await AsyncStorage.getItem('@orders');
        ordersList = ordersData ? JSON.parse(ordersData) : [];
        setOrdersCount(ordersList.length);
        ordersTotal = ordersList.reduce((sum: number, item: any) => sum + (parseFloat(item.totalAmount) || 0), 0);
      } catch (e) { console.log(e); }

      const salesSum = chemistTotal + ordersTotal;
      setTotalOrders(salesSum);
      setSalesProgress(Math.min(Math.round((salesSum / targets.sales) * 100), 100));
      setDynamicTargets(targets);

      try {
        const todayStr = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
        const storedCheckInDate = await AsyncStorage.getItem('@check_in_date');
        const rawCheckedIn = await AsyncStorage.getItem('@checked_in');
        // Only treat as checked-in if the stored date matches today
        const checkedInToday = rawCheckedIn === 'true' && storedCheckInDate === todayStr;
        if (checkedInToday) {
          determinedCheckedIn = true;
          determinedCheckInTime = ((await AsyncStorage.getItem('@check_in_time')) || '');
        }
      } catch (e) { console.log(e); }
    }

    // 3. Load other lists (recent orders list, meetings, follow-ups, GPS logs, notifications)
    try {
      const storedOrders = await AsyncStorage.getItem('@orders');
      const localOrders = storedOrders ? JSON.parse(storedOrders) : [];
      
      // Merge server orders and local orders, filtering duplicates
      const mergedOrders = [...serverOrders];
      localOrders.forEach((lo: any) => {
        const loNum = lo.orderNumber;
        const exists = mergedOrders.some((so: any) => so.orderNumber === loNum || so.id === lo.id || (so.id && lo.id && String(so.id) === String(lo.id)));
        if (!exists) {
          mergedOrders.push(lo);
        }
      });

      // Sort descending (newest first) by date
      const parseOrderDateMs = (o: any): number => {
        const val = o.orderDate || o.createdAt || o.date || o.dateFormatted || '';
        if (!val) return 0;
        try {
          const d = new Date(val);
          if (!isNaN(d.getTime())) return d.getTime();
        } catch {}
        try {
          const parts = String(val).split('-');
          if (parts.length === 3) {
            const day = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1;
            const year = parseInt(parts[2], 10);
            const d = new Date(year, month, day);
            if (!isNaN(d.getTime())) return d.getTime();
          }
        } catch {}
        return 0;
      };

      mergedOrders.sort((a: any, b: any) => parseOrderDateMs(b) - parseOrderDateMs(a));

      if (mergedOrders.length > 0) {
        setRecentOrdersList(mergedOrders.slice(0, 4).map((o: any, idx: number) => {
          const statusUpper = (o.status || '').toUpperCase();
          const clientName = o.retailer?.name || o.customerName || o.customer?.name || 'Chemist Store';
          const displayStatus = (statusUpper === 'BOOKED' || statusUpper === 'PENDING' || statusUpper === 'FORWARDED' || statusUpper === 'APPROVED')
            ? 'Pending'
            : (statusUpper === 'FULFILLED' || statusUpper === 'SHIPPED' || statusUpper === 'DELIVERED')
              ? 'Shipped'
              : 'Failed';
          return {
            id: o.orderNumber || `ORD-NEW-${idx}`,
            client: clientName,
            status: displayStatus,
            amount: `₹${(parseFloat(o.totalAmount || o.amount) || 0).toLocaleString()}`,
            date: o.orderDate ? o.orderDate.split('T')[0] : o.dateFormatted ? o.dateFormatted.split(' ')[0] : o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-GB').replace(/\//g, '-') : 'Today'
          };
        }));
      } else {
        setRecentOrdersList([]);
      }
    } catch (e) {
      console.log('Dashboard error loading recent orders:', e);
    }



    // 4. Consolidate attendance status checks
    try {
      let isTodayCheckedIn = false;
      let isTodayCheckedOut = false;
      let checkInTimeStr = '';
      let todayLogRecord: any = null;

      // Primary check: getAttendanceLogs (most reliable detailed log list)
      try {
        const logsList = await getAttendanceLogs();
        const today = new Date();
        
        const checkSameDay = (d1: Date, d2Str: string) => {
          if (!d2Str) return false;
          try {
            const d2 = new Date(d2Str);
            if (isNaN(d2.getTime())) {
              const cleaned = d2Str.replace(/-/g, ' ');
              const parts = cleaned.split(' ');
              if (parts.length >= 3) {
                const day = parseInt(parts[0]);
                const year = parseInt(parts[2]);
                const monthStr = parts[1].toLowerCase();
                const monthsAbbr = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
                const monthIdx = monthsAbbr.findIndex(m => monthStr.startsWith(m));
                if (day && year && monthIdx !== -1) {
                  return d1.getDate() === day && d1.getMonth() === monthIdx && d1.getFullYear() === year;
                }
              }
              return false;
            }
            return d1.getDate() === d2.getDate() && 
                   d1.getMonth() === d2.getMonth() && 
                   d1.getFullYear() === d2.getFullYear();
          } catch (e) {
            return false;
          }
        };

        const todayLogs = Array.isArray(logsList) ? logsList.filter((log: any) => 
          checkSameDay(today, log.date || log.checkIn || log.checkInTime || log.check_in_time || log.createdAt)
        ) : [];

        if (todayLogs.length > 0) {
          // Find the active log (no checkout)
          todayLogRecord = todayLogs.find((log: any) => !log.checkOut && !log.checkOutTime || log.checkOutTime === 'Active');
          
          if (todayLogRecord) {
            isTodayCheckedIn = true;
            checkInTimeStr = formatTimeForDisplay(todayLogRecord.checkIn || todayLogRecord.checkInTime || todayLogRecord.check_in_time || '');
          } else {
            isTodayCheckedOut = true;
            // Use the latest log's check-in time
            todayLogRecord = todayLogs[0];
            checkInTimeStr = formatTimeForDisplay(todayLogRecord.checkIn || todayLogRecord.checkInTime || todayLogRecord.check_in_time || '');
          }
        }
      } catch (err) {
        console.log('Dashboard failed to fetch attendance logs from API:', err);
      }

      // Secondary check: stats.attendance (fallback)
      if (!isTodayCheckedIn && !isTodayCheckedOut) {
        if (stats && stats.attendance) {
          const todayStrYMD = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
          const attendanceDate = stats.attendance.date
            ? String(stats.attendance.date).slice(0, 10)
            : null;
          const isToday = !attendanceDate || attendanceDate === todayStrYMD;
          if (isToday && stats.attendance.status === 'Present') {
            checkInTimeStr = formatTimeForDisplay(stats.attendance.checkInTime || stats.attendance.checkIn || '');
            if (stats.attendance.checkOutTime || stats.attendance.checkOut) {
              isTodayCheckedOut = true;
            } else {
              isTodayCheckedIn = true;
            }
          }
        }
      }

      // Synchronize back to AsyncStorage so Checkout/Dashboard stay in sync!
      const todayStr = new Date().toISOString().slice(0, 10);
      if (isTodayCheckedIn) {
        let resolvedAttId = '';
        if (todayLogRecord && todayLogRecord.id) {
          resolvedAttId = todayLogRecord.id.toString();
        } else if (stats && stats.attendance && stats.attendance.id) {
          resolvedAttId = stats.attendance.id.toString();
        }
        
        await AsyncStorage.setItem('@checked_in', 'true');
        if (resolvedAttId) await AsyncStorage.setItem('@attendanceId', resolvedAttId);
        await AsyncStorage.setItem('@check_in_date', todayStr);
        if (checkInTimeStr) await AsyncStorage.setItem('@check_in_time', checkInTimeStr);
        await AsyncStorage.setItem('@attendance_date', new Date().toISOString());
      } else if (isTodayCheckedOut) {
        await AsyncStorage.setItem('@checked_in', 'false');
        await AsyncStorage.removeItem('@attendanceId');
        await AsyncStorage.setItem('@check_in_date', todayStr);
      }

      // Final state updates (called exactly once)
      setIsCheckedIn(isTodayCheckedIn);
      setHasCheckedOut(isTodayCheckedOut);
      setCheckInTime(checkInTimeStr);
      setUserName((await AsyncStorage.getItem('@user_name')) || '');
      setDesignation((await AsyncStorage.getItem('@designation')) || 'Medical Representative');
    } catch (e) { console.log(e); }
    try {
      const meetingsData = await getMeetingsByMr();
      const meetingsList = Array.isArray(meetingsData) ? meetingsData : [];
      const todayStr = new Date().toISOString().split('T')[0];
      
      const todayMeetings = meetingsList.filter((m: any) => {
        if (!m.meetingDate) return false;
        const meetingDateStr = new Date(m.meetingDate).toISOString().split('T')[0];
        
        const isCompleted = m.status === 'COMPLETED' || m.status === 'Completed';
        const isCancelled = m.status === 'CANCELLED' || m.status === 'Cancelled';
        
        return meetingDateStr === todayStr && !isCompleted && !isCancelled;
      });
      
      setScheduleList(todayMeetings.map((m: any) => ({
        topic: m.title || 'Meeting',
        time: new Date(m.meetingDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        venue: m.location || 'N/A'
      })));
    } catch (e) {
      console.log('Error loading today schedule meetings:', e);
      setScheduleList([]);
    }

    // Load Pending Follow-Ups from backend API (primary source)
    // Helper to map a raw API follow-up item to dashboard display format
    const mapFollowUpItem = (item: any) => ({
      id: item.id,
      followUpType: item.doctorId ? 'Doctor' : 'Chemist',
      titleName:
        item.doctor?.doctorName ||
        item.doctor?.name ||
        item.doctorName ||
        item.chemist?.shopName ||
        item.chemist?.name ||
        item.chemistName ||
        item.shopName ||
        'Contact',
      followDate: item.followUpDate
        ? new Date(item.followUpDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
        : item.follow_date
          ? new Date(item.follow_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
          : '',
    });

    const filterFollowUpItem = (item: any, todayStr: string) => {
      const status = (item.status || '').toUpperCase();
      if (status === 'COMPLETED' || status === 'CANCELLED') return false;
      // Support both followUpDate and follow_date field names
      const rawDate = item.followUpDate || item.follow_date || item.scheduledDate || item.nextFollowUp || '';
      const followDateStr = rawDate ? rawDate.split('T')[0] : '';
      if (!followDateStr) return false;
      // Show overdue, today, AND upcoming within next 7 days
      const today = new Date(todayStr);
      const followDate = new Date(followDateStr);
      const diffDays = Math.ceil((followDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays <= 7; // overdue (negative), today (0), next 7 days (1–7)
    };

    try {
      const todayStr = new Date().toISOString().split('T')[0];

      // Step 1: Try MR-specific endpoint
      let apiFollowUps: any[] = [];
      try {
        const mrResult = await getFollowUpsByMr();
        apiFollowUps = Array.isArray(mrResult) ? mrResult : [];
        console.log('[Dashboard] getFollowUpsByMr returned:', apiFollowUps.length, 'records');
      } catch (mrErr) {
        console.log('[Dashboard] getFollowUpsByMr failed, will try getAllFollowUps:', mrErr);
      }

      // Step 2: If MR endpoint returned empty, fallback to global endpoint
      if (apiFollowUps.length === 0) {
        try {
          const allResult = await getAllFollowUps();
          apiFollowUps = Array.isArray(allResult) ? allResult : [];
          console.log('[Dashboard] getAllFollowUps returned:', apiFollowUps.length, 'records');
        } catch (allErr) {
          console.log('[Dashboard] getAllFollowUps also failed:', allErr);
        }
      }

      console.log('[Dashboard] API FollowUps sample:', JSON.stringify(apiFollowUps.slice(0, 2)));

      const pendingFollowUps = apiFollowUps
        .filter((item: any) => filterFollowUpItem(item, todayStr))
        .sort((a: any, b: any) => {
          // Sort by date ascending so overdue (earliest) appears first
          const dateA = a.followUpDate || a.follow_date || a.scheduledDate || a.nextFollowUp || '';
          const dateB = b.followUpDate || b.follow_date || b.scheduledDate || b.nextFollowUp || '';
          return dateA.localeCompare(dateB);
        })
        .map(mapFollowUpItem)
        .slice(0, 5);

      setFollowUps(pendingFollowUps);
    } catch (followUpErr) {
      // Fallback: build follow-ups from offline visit data
      try {
        const docVisitsData = await AsyncStorage.getItem('@doctor_visits');
        docVisitsList = docVisitsData ? JSON.parse(docVisitsData) : [];
        const chemistVisitsData = await AsyncStorage.getItem('@chemist_visits');
        chemistVisitsList = chemistVisitsData ? JSON.parse(chemistVisitsData) : [];
        const storedOrders = await AsyncStorage.getItem('@orders');
        ordersList = storedOrders ? JSON.parse(storedOrders) : [];

        const combinedFollowUps = [
          ...docVisitsList.map((v: any) => ({ followUpType: 'Doctor', titleName: v.doctorName, followDate: v.nextFollowUp || v.followUpDate })),
          ...chemistVisitsList.map((c: any) => ({ followUpType: 'Chemist', titleName: c.shopName || c.chemistName, followDate: c.nextFollowUp || c.followUpDate })),
          ...ordersList.map((o: any) => ({ followUpType: 'Order', titleName: o.customerName, followDate: o.expectedDelivery || o.followUpDate || o.nextFollowUp }))
        ];
        setFollowUps(combinedFollowUps.filter((visit: any) => visit.followDate).slice(0, 5));
      } catch (e) { console.log('Follow-up fallback error:', e); }
    }

    // Load Recent Visits — use backend API for correct names and times
    try {
      // Helper: parse visit time from ISO date string
      const parseVisitTime = (dateStr: string): string => {
        if (!dateStr) return '';
        try {
          const d = new Date(dateStr);
          if (isNaN(d.getTime())) return '';
          return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch { return ''; }
      };

      // Helper: parse visit date for sorting
      const parseVisitDateMs = (dateStr: string): number => {
        if (!dateStr) return 0;
        try { return new Date(dateStr).getTime() || 0; } catch { return 0; }
      };

      let combinedVisits: any[] = [];

      if (apiDocVisits.length > 0 || apiChemVisits.length > 0) {
        // Use API data — names come from nested doctor/chemist objects
        combinedVisits = [
          ...apiDocVisits.map((v: any) => ({
            id: v.id || Math.random(),
            name: v.doctor?.doctorName || v.doctor?.name || v.doctorName || 'Doctor',
            type: 'Doctor',
            time: parseVisitTime(v.visitDate || v.createdAt),
            status: v.status || 'Completed',
            date: v.visitDate || v.createdAt || '',
            dateMs: parseVisitDateMs(v.visitDate || v.createdAt),
          })),
          ...apiChemVisits.map((c: any) => ({
            id: c.id || Math.random(),
            name: c.chemist?.shopName || c.chemist?.name || c.shopName || c.chemistName || 'Chemist',
            type: 'Chemist',
            time: parseVisitTime(c.visitDate || c.createdAt),
            status: c.status || 'Completed',
            date: c.visitDate || c.createdAt || '',
            dateMs: parseVisitDateMs(c.visitDate || c.createdAt),
          })),
        ];
      } else {
        // Fallback: AsyncStorage (names may be incomplete, but still try)
        const docVisitsData = await AsyncStorage.getItem('@doctor_visits');
        docVisitsList = docVisitsData ? JSON.parse(docVisitsData) : [];
        const chemistVisitsData = await AsyncStorage.getItem('@chemist_visits');
        chemistVisitsList = chemistVisitsData ? JSON.parse(chemistVisitsData) : [];

        combinedVisits = [
          ...docVisitsList.map((v: any) => ({
            id: v.id || Math.random(),
            name: v.doctor?.doctorName || v.doctor?.name || v.doctorName
              ? `Dr. ${v.doctor?.doctorName || v.doctor?.name || v.doctorName}`
              : 'Doctor',
            type: 'Doctor',
            time: parseVisitTime(v.visitDate) || v.visitTime || '',
            status: v.status || 'Completed',
            date: v.visitDate || v.date || '',
            dateMs: parseVisitDateMs(v.visitDate || v.date),
          })),
          ...chemistVisitsList.map((c: any) => ({
            id: c.id || Math.random(),
            name: c.chemist?.shopName || c.chemist?.name || c.shopName || c.chemistName || 'Chemist',
            type: 'Chemist',
            time: parseVisitTime(c.visitDate) || c.visitTime || '',
            status: c.status || 'Completed',
            date: c.visitDate || c.date || '',
            dateMs: parseVisitDateMs(c.visitDate || c.date),
          })),
        ];
      }

      combinedVisits.sort((a, b) => b.dateMs - a.dateMs);
      setRecentVisitsList(combinedVisits.slice(0, 3));
    } catch (e) { console.log('Dashboard: Recent visits error:', e); }

    try {
      const notifsData = await AsyncStorage.getItem('@notifications');
      const notifsList = notifsData ? JSON.parse(notifsData) : [];
      setNotificationsList(notifsList.slice(0, 3));
    } catch (e) {
      setNotificationsList([]);
    }

    try {
      const todayString = new Date().toLocaleDateString('en-GB').replace(/\//g, '-');
      const gpsKey = `@gps_movement_${todayString}`;
      const gpsDataRaw = await AsyncStorage.getItem(gpsKey);
      const gpsLogs = gpsDataRaw ? JSON.parse(gpsDataRaw) : [];

      if (gpsLogs && gpsLogs.length > 0) {
        let dist = 0;
        for (let i = 0; i < gpsLogs.length - 1; i++) {
          dist += calculateDistance(
            gpsLogs[i].latitude, gpsLogs[i].longitude,
            gpsLogs[i + 1].latitude, gpsLogs[i + 1].longitude
          );
        }
        
        setGpsData({
          distance: `${dist.toFixed(2)} KM`,
          checkIns: gpsLogs.length,
          territory: 'Assigned Territory',
          lastLocation: gpsLogs[gpsLogs.length - 1].address || 'Unknown',
          coverage: 'Tracking'
        });
      } else {
        setGpsData(null);
      }
    } catch (e) {
      setGpsData(null);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container}>
        
        {/* FIXED: Restored the exact original Header so the 3 lines work! */}
        <View style={styles.webHeader}>
          <View style={styles.profileRow}>
            {/* 3-Lines Hamburger Menu Button */}
            <TouchableOpacity 
              style={styles.hamburgerButton} 
              onPress={() => setIsMenuOpen(true)}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            >
              <Text style={styles.hamburgerIcon}>☰</Text>
            </TouchableOpacity>

            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>
                {userName.split(' ').map(n => n[0]).join('').toUpperCase()}
              </Text>
            </View>
            <View style={styles.profileMeta}>
              <Text style={styles.welcomeText}>{userName}</Text>
              <Text style={styles.designationText}>{designation}</Text>
            </View>
            <View style={styles.statusBadge}>
              <View style={styles.greenDot} />
              <Text style={styles.statusText}>Operational</Text>
            </View>
          </View>
          {/* Restored Date text that was missing! */}
          <Text style={styles.dateText}>{new Date().toDateString()}</Text>
        </View>

        <View style={styles.contentPadding}>
          
          <View style={styles.kpiRow}>
            <View style={[styles.kpiCard, { shadowColor: '#1abc9c' }]}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconContainer, { backgroundColor: isCheckedIn ? '#E6F4EA' : hasCheckedOut ? '#E0F2F1' : '#FDE8E8' }]}>
                  <Text style={[styles.kpiIcon, { color: isCheckedIn ? '#10B981' : hasCheckedOut ? '#00796B' : '#E11D48' }]}>📍</Text>
                </View>
              </View>
              <Text style={styles.kpiLabel}>Attendance</Text>
              <Text style={styles.kpiValue}>{isCheckedIn ? 'Present' : hasCheckedOut ? 'Checked Out' : 'Absent'}</Text>
              <Text style={styles.kpiSubText}>
                {isCheckedIn ? `Check In: ${checkInTime}` : hasCheckedOut ? `Checked Out (In: ${checkInTime})` : 'Not Checked In'}
              </Text>
            </View>

            <View style={[styles.kpiCard, { shadowColor: '#6366f1' }]}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconContainer, { backgroundColor: '#EEF2FF' }]}>
                  <Text style={[styles.kpiIcon, { color: '#6366F1' }]}>🩺</Text>
                </View>
              </View>
              <Text style={styles.kpiLabel}>Doctor Visits</Text>
              <Text style={styles.kpiValue}>{docCount} <Text style={styles.kpiTarget}>/ {dynamicTargets.docs}</Text></Text>
              <Text style={styles.kpiSubText}>Today's Calls</Text>
            </View>
          </View>

          <View style={styles.kpiRow}>
            <View style={[styles.kpiCard, { shadowColor: '#f59e0b' }]}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconContainer, { backgroundColor: '#FEF3C7' }]}>
                  <Text style={[styles.kpiIcon, { color: '#D97706' }]}>💊</Text>
                </View>
              </View>
              <Text style={styles.kpiLabel}>Chemist Visits</Text>
              <Text style={styles.kpiValue}>{chemistCount} <Text style={styles.kpiTarget}>/ {dynamicTargets.chemists}</Text></Text>
              <Text style={styles.kpiSubText}>Today's Calls</Text>
            </View>

            <View style={[styles.kpiCard, { shadowColor: '#06b6d4' }]}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconContainer, { backgroundColor: '#ECFEFF' }]}>
                  <Text style={[styles.kpiIcon, { color: '#06B6D4' }]}>🛒</Text>
                </View>
              </View>
              <Text style={styles.kpiLabel}>Orders Booked</Text>
              <Text style={styles.kpiValue}>{ordersCount}</Text>
              <Text style={styles.kpiSubText}>₹{totalOrders.toLocaleString()} Today</Text>
            </View>
          </View>

          <View style={[styles.largeCard, { shadowColor: '#8B5CF6' }]}>
            <Text style={styles.cardTitle}>🎯 Monthly Target Progress</Text>
            <View style={styles.targetLabelRow}>
              <Text style={styles.targetLabel}>Monthly Sales Target</Text>
              <Text style={[styles.targetValue, { color: '#4F46E5' }]}>{salesProgress}%</Text>
            </View>
            <View style={styles.progressBar}><View style={[styles.progressFill, { width: `${salesProgress}%`, backgroundColor: '#4F46E5' }]} /></View>
            <Text style={styles.kpiSubText}>₹{monthlySalesAmount.toLocaleString()} / ₹{dynamicTargets.sales.toLocaleString()}</Text>
            
            <View style={styles.splitTargetsRow}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <View style={styles.targetLabelRow}>
                  <Text style={styles.targetLabel}>Doctor Target</Text>
                  <Text style={[styles.targetValue, { color: '#10B981' }]}>{doctorProgress}%</Text>
                </View>
                <View style={styles.progressBar}><View style={[styles.progressFill, { width: `${doctorProgress}%`, backgroundColor: '#10B981' }]} /></View>
                <Text style={styles.kpiSubText}>{monthlyDocCount} / {dynamicTargets.docs}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <View style={styles.targetLabelRow}>
                  <Text style={styles.targetLabel}>Chemist Target</Text>
                  <Text style={[styles.targetValue, { color: '#F59E0B' }]}>{chemistProgress}%</Text>
                </View>
                <View style={styles.progressBar}><View style={[styles.progressFill, { width: `${chemistProgress}%`, backgroundColor: '#F59E0B' }]} /></View>
                <Text style={styles.kpiSubText}>{monthlyChemistCount} / {dynamicTargets.chemists}</Text>
              </View>
            </View>
          </View>

          <View style={styles.largeCard}>
            <Text style={styles.cardTitle}>📅 Today's Schedule</Text>
            {scheduleList.length > 0 ? (
              scheduleList.map((item, idx) => (
                <View key={idx} style={styles.listRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.listTitleText}>{item.topic}</Text>
                    <Text style={styles.listSubText}>⏰ {item.time} • 📍 {item.venue}</Text>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyBox}><Text style={styles.emptyText}>No schedule planned today.</Text></View>
            )}
          </View>

          <View style={styles.largeCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <Text style={styles.cardTitle}>⏰ Pending Follow-Ups</Text>
              <View style={{ backgroundColor: followUps.length > 0 ? '#FEE2E2' : '#F1F5F9', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3 }}>
                <Text style={{ fontSize: 11, fontWeight: 'bold', color: followUps.length > 0 ? '#DC2626' : '#94A3B8' }}>
                  {followUps.length} Pending
                </Text>
              </View>
            </View>
            {followUps.length > 0 ? (
              followUps.map((visit: any, index: number) => (
                <View key={index} style={[styles.listRow, { alignItems: 'center' }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.listTitleText}>{visit.titleName}</Text>
                    <Text style={styles.listSubText}>
                      {visit.followUpType === 'Doctor' ? '🩺 Doctor' : '💊 Chemist'} • 📅 {visit.followDate}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyBox}><Text style={styles.emptyText}>No pending follow-ups.</Text></View>
            )}
          </View>

          <View style={styles.largeCard}>
            <Text style={styles.cardTitle}>📍 Recent Visits</Text>
            {recentVisitsList.length > 0 ? (
              recentVisitsList.map((visit, index) => (
                <View key={index} style={styles.listRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.listTitleText}>
                      {visit.type === 'Doctor' ? '🩺 ' : '💊 '}
                      {visit.name || (visit.type === 'Doctor' ? 'Doctor' : 'Chemist')}
                    </Text>
                    <Text style={styles.listSubText}>
                      {visit.type}{visit.time ? ` • ${visit.time}` : ''}
                    </Text>
                  </View>
                  <View style={[styles.statusPill, { backgroundColor: visit.status === 'Completed' ? '#DEF7EC' : '#FEF3C7' }]}>
                    <Text style={[styles.statusPillText, { color: visit.status === 'Completed' ? '#03543F' : '#D97706' }]}>{visit.status}</Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No recent visits.</Text>
            )}
          </View>

          <View style={styles.largeCard}>
            <Text style={styles.cardTitle}>🛒 Recent Orders</Text>
            {recentOrdersList.length > 0 ? (
              recentOrdersList.map((order, index) => (
                <View key={`${order.id}-${index}`} style={styles.listRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.listTitleText}>{order.client}</Text>
                    <Text style={styles.listSubText}>{order.id}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.orderAmountText}>{order.amount}</Text>
                    <View style={[styles.statusPill, { marginTop: 4, backgroundColor: order.status === 'Shipped' ? '#DEF7EC' : order.status === 'Pending' ? '#FEF3C7' : '#FDE8E8' }]}>
                      <Text style={[styles.statusPillText, { color: order.status === 'Shipped' ? '#03543F' : order.status === 'Pending' ? '#D97706' : '#9B1C1C' }]}>{order.status}</Text>
                    </View>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No orders recorded.</Text>
            )}
          </View>

          <View style={styles.largeCard}>
            <Text style={styles.cardTitle}>🔔 Notifications</Text>
            {notificationsList.length > 0 ? (
              notificationsList.map((notif, index) => (
                <View key={index} style={styles.listRow}>
                  <View style={[styles.notificationDot, { 
                    backgroundColor: notif.type === 'meeting' ? '#3B82F6' : notif.type === 'target' ? '#10B981' : '#F43F5E' 
                  }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.listTitleText}>{notif.text || notif.message || notif.title}</Text>
                    <Text style={styles.listSubText}>{notif.time}</Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No new notifications.</Text>
            )}
          </View>

          <View style={styles.largeCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={styles.cardTitle}>🧭 GPS Route Summary</Text>
              <Text style={styles.activeGpsText}>Active</Text>
            </View>
            
            {gpsData ? (
              <View style={styles.gpsBox}>
                <View style={styles.gpsGrid}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.listSubText}>Distance</Text>
                    <Text style={styles.gpsValue}>{gpsData.distance}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.listSubText}>Check-ins</Text>
                    <Text style={styles.gpsValue}>{gpsData.checkIns}</Text>
                  </View>
                </View>

                <View style={{ borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 12, marginTop: 12 }}>
                  <Text style={styles.listSubText}>Territory</Text>
                  <Text style={styles.listTitleText}>{gpsData.territory}</Text>
                  <Text style={[styles.listSubText, { marginTop: 6 }]}>Last Ping: {gpsData.lastLocation}</Text>
                </View>
              </View>
            ) : (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>No active GPS tracking session today.</Text>
              </View>
            )}
          </View>

        </View>
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── CUSTOM SLIDE-OUT DRAWER MENU MODAL ── */}
      <Modal visible={isMenuOpen} transparent={true} animationType="fade" onRequestClose={() => setIsMenuOpen(false)}>
        <TouchableOpacity style={styles.drawerBackdrop} activeOpacity={1} onPress={() => setIsMenuOpen(false)}>
          <TouchableOpacity style={styles.drawerContainer} activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <View style={styles.drawerHeader}>
              <View style={styles.logoRow}>
                <Image source={require('../../../assets/images/logo.png')} style={styles.drawerLogo} resizeMode="contain" />
                <View style={styles.logoTextContainer}>
                  <Text style={styles.logoText}>Pharma ERP</Text>
                  <Text style={styles.logoSubtitle}>MJ Healthcare</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setIsMenuOpen(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Text style={styles.closeIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.drawerScroll}>
              <TouchableOpacity style={[styles.drawerItem, styles.activeDrawerItem]} onPress={() => { setIsMenuOpen(false); }}>
                <Text style={[styles.drawerItemText, styles.activeDrawerItemText]}>🏠 Dashboard</Text>
              </TouchableOpacity>
               <TouchableOpacity style={styles.drawerGroupHeader} onPress={() => setShowGPS(!showGPS)}>
                <Text style={styles.drawerGroupLabel}>🧭 GPS & Location Tracking</Text>
                <Text style={styles.arrowIcon}>{showGPS ? '▲' : '▼'}</Text>
              </TouchableOpacity>
              {showGPS && (
                <View style={styles.groupChildren}>
                  {[
                    { label: '🕒 GPS Attendance', route: 'Attendance' },
                    { label: '🩺 Geo Tagged Doctor Visits', route: 'GeoTaggedDoctorVisits' },
                    { label: '💊 Geo Tagged Chemist Visits', route: 'GeoTaggedChemistVisits' },
                    { label: '🛣️ Route History', route: 'RouteHistory' },
                    { label: '📍 Territory Tracking', route: 'TerritoryTracking' },
                    { label: '🧭 Daily Movement Tracking', route: 'DailyMovementTracking' },
                    { label: '🤝 Meeting/Event Location Tracking', route: 'MeetingLocation' },
                  ].map((item, index) => (
                    <TouchableOpacity key={index} style={styles.drawerSubItem} onPress={() => { setIsMenuOpen(false); navigation.navigate(item.route); }}>
                      <Text style={styles.drawerSubItemText}>{item.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              
              <TouchableOpacity style={styles.drawerGroupHeader} onPress={() => setShowCRM(!showCRM)}>
                <Text style={styles.drawerGroupLabel}>🤝 Pre-Sales CRM</Text>
                <Text style={styles.arrowIcon}>{showCRM ? '▲' : '▼'}</Text>
              </TouchableOpacity>
              {showCRM && (
                <View style={styles.groupChildren}>
                  {[
                    { label: 'My Leads', route: 'MyLeads' },
                    { label: 'Lead Creation', route: 'LeadCreation' },
                    { label: 'Lead Pipeline Tracking', route: 'LeadPipelineTracking' },
                    { label: 'Follow-Up Management', route: 'FollowUps' },
                    { label: 'Meeting Scheduling', route: 'MeetingScheduler' },
                    { label: 'Activity Tracking', route: 'ActivityTracking' },
                  ].map((item, index) => (
                    <TouchableOpacity key={index} style={styles.drawerSubItem} onPress={() => { setIsMenuOpen(false); navigation.navigate(item.route); }}>
                      <Text style={styles.drawerSubItemText}>{item.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <TouchableOpacity style={styles.drawerGroupHeader} onPress={() => setShowMROps(!showMROps)}>
                <Text style={styles.drawerGroupLabel}>👤 MR Operations</Text>
                <Text style={styles.arrowIcon}>{showMROps ? '▲' : '▼'}</Text>
              </TouchableOpacity>
              {showMROps && (
                <View style={styles.groupChildren}>
                  {[
                    { label: '🩺 Doctor Visit Entry', route: 'DoctorVisit' },
                    { label: '💊 Chemist Visit Entry', route: 'ChemistVisit' },
                    { label: '📦 Order Booking', route: 'BookOrder' },
                    { label: '📄 Daily Reporting', route: 'DailyReport' },
                    { label: '📈 Target Tracking', route: 'TargetTracking' },
                    { label: '👤 Tour Planning', route: 'TourPlanning' },
                    { label: '📞 Customer Directory', route: 'CustomerDirectory' },
                  ].map((item, index) => (
                    <TouchableOpacity key={index} style={styles.drawerSubItem} onPress={() => { setIsMenuOpen(false); navigation.navigate(item.route); }}>
                      <Text style={styles.drawerSubItemText}>{item.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* <TouchableOpacity style={styles.drawerGroupHeader} onPress={() => setShowGPS(!showGPS)}>
                <Text style={styles.drawerGroupLabel}>🧭 GPS & Location Tracking</Text>
                <Text style={styles.arrowIcon}>{showGPS ? '▲' : '▼'}</Text>
              </TouchableOpacity>
              {showGPS && (
                <View style={styles.groupChildren}>
                  {[
                    { label: '🕒 GPS Attendance', route: 'Attendance' },
                    { label: '🩺 Geo Tagged Doctor Visits', route: 'GeoTaggedDoctorVisits' },
                    { label: '💊 Geo Tagged Chemist Visits', route: 'GeoTaggedChemistVisits' },
                    { label: '🛣️ Route History', route: 'RouteHistory' },
                    { label: '📍 Territory Tracking', route: 'TerritoryTracking' },
                    { label: '🧭 Daily Movement Tracking', route: 'DailyMovementTracking' },
                    { label: '🤝 Meeting/Event Location Tracking', route: 'MeetingLocation' },
                  ].map((item, index) => (
                    <TouchableOpacity key={index} style={styles.drawerSubItem} onPress={() => { setIsMenuOpen(false); navigation.navigate(item.route); }}>
                      <Text style={styles.drawerSubItemText}>{item.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )} */}

              <TouchableOpacity style={styles.drawerGroupHeader} onPress={() => setShowAlerts(!showAlerts)}>
                <Text style={styles.drawerGroupLabel}>🔔 Alerts & Notifications</Text>
                <Text style={styles.arrowIcon}>{showAlerts ? '▲' : '▼'}</Text>
              </TouchableOpacity>
              {showAlerts && (
                <View style={styles.groupChildren}>
                  {[
                    { label: '🤝 Meeting Reminders', route: 'MeetingReminders' },
                    { label: '🎯 Follow-Up Reminders', route: 'FollowUpReminders' },
                    { label: '📲 Activity Notifications', route: 'ActivityNotifications' },
                    { label: '📥 Notification Center', route: 'Notifications' },
                  ].map((item, index) => (
                    <TouchableOpacity key={index} style={styles.drawerSubItem} onPress={() => { setIsMenuOpen(false); navigation.navigate(item.route); }}>
                      <Text style={styles.drawerSubItemText}>{item.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <TouchableOpacity style={styles.drawerGroupHeader} onPress={() => setShowSettings(!showSettings)}>
                <Text style={styles.drawerGroupLabel}>⚙️ Settings</Text>
                <Text style={styles.arrowIcon}>{showSettings ? '▲' : '▼'}</Text>
              </TouchableOpacity>
              {showSettings && (
                <View style={styles.groupChildren}>
                  {[
                    { label: '👤 Profile Settings', route: 'Profile' },
                    { label: '🧪 Product Catalog List', route: 'ProductCatalog' },
                    { label: '📆 Leave Application', route: 'LeaveRequest' },
                    { label: '📋 Daily Schedule Checklist', route: 'DailySchedule' },
                    { label: '💵 Expense Claims', route: 'ExpenseClaim' },
                  ].map((item, index) => (
                    <TouchableOpacity key={index} style={styles.drawerSubItem} onPress={() => { setIsMenuOpen(false); navigation.navigate(item.route); }}>
                      <Text style={styles.drawerSubItemText}>{item.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </ScrollView>

            <View style={styles.drawerFooter}>
              <View style={styles.avatarCircleSmall}>
                <Text style={styles.avatarTextSmall}>{userName.split(' ').map(n => n[0]).join('').toUpperCase()}</Text>
              </View>
              <View style={{ marginLeft: 10 }}>
                <Text style={styles.footerUserName}>{userName}</Text>
                <Text style={styles.footerUserRole}>{designation}</Text>
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default DashboardScreen;

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F8FAFC' 
  },
  
  // RESTORED: Exact styles from your perfectly working code!
  webHeader: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hamburgerButton: {
    paddingRight: 16,
    paddingVertical: 8,
  },
  hamburgerIcon: {
    fontSize: 22,
    color: '#64748B',
    fontWeight: 'bold',
  },
  
  avatarCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#8B5CF6', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 },
  profileMeta: { flex: 1, marginLeft: 12 },
  welcomeText: { fontSize: 16, fontWeight: 'bold', color: '#1E293B' },
  designationText: { fontSize: 12, color: '#64748B', marginTop: 2 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#DEF7EC', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  greenDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#31C48D', marginRight: 6 },
  statusText: { color: '#03543F', fontSize: 11, fontWeight: 'bold' },
  
  // RESTORED: Date text style
  dateText: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 12,
  },
  
  contentPadding: { padding: 16 },
  kpiRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  
  kpiCard: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 24, padding: 16, borderWidth: 1, borderColor: '#F1F5F9', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 4 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  iconContainer: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  kpiIcon: { fontSize: 18 },
  kpiLabel: { fontSize: 12, color: '#64748B', fontWeight: '600' },
  kpiValue: { fontSize: 22, fontWeight: 'bold', color: '#0F172A', marginTop: 4 },
  kpiTarget: { fontSize: 16, color: '#94A3B8' },
  kpiSubText: { fontSize: 10, color: '#94A3B8', marginTop: 4 },

  largeCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#94A3B8', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 2, marginBottom: 16 },
  cardTitle: { fontSize: 15, fontWeight: 'bold', color: '#1E293B', marginBottom: 16 },
  
  targetLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  targetLabel: { fontSize: 11, color: '#475569', fontWeight: '600' },
  targetValue: { fontSize: 11, fontWeight: 'bold' },
  progressBar: { height: 6, backgroundColor: '#F1F5F9', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  splitTargetsRow: { flexDirection: 'row', marginTop: 16 },

  emptyBox: { backgroundColor: '#F8FAFC', borderRadius: 12, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: '#F1F5F9', borderStyle: 'dashed' },
  emptyText: { fontSize: 12, color: '#94A3B8', fontStyle: 'italic', textAlign: 'center' },
  
  dueTodayText: { fontSize: 11, color: '#E11D48', fontWeight: 'bold', backgroundColor: '#FFE4E6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, overflow: 'hidden' },
  
  listRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  listTitleText: { fontSize: 13, fontWeight: '600', color: '#1E293B' },
  listSubText: { fontSize: 11, color: '#64748B', marginTop: 2 },
  
  orderAmountText: { fontSize: 13, fontWeight: '700', color: '#0F172A' },
  
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  statusPillText: { fontSize: 10, fontWeight: 'bold' },

  notificationDot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  
  activeGpsText: { fontSize: 11, color: '#2563EB', fontWeight: 'bold', backgroundColor: '#DBEAFE', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, overflow: 'hidden' },
  gpsBox: { backgroundColor: '#F8FAFC', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#F1F5F9' },
  gpsGrid: { flexDirection: 'row', marginBottom: 16 },
  gpsValue: { fontSize: 16, fontWeight: 'bold', color: '#0F172A', marginTop: 2 },
  
  drawerBackdrop: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.4)' },
  drawerContainer: { width: '78%', height: '100%', backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 4, height: 0 }, shadowOpacity: 0.1, shadowRadius: 15, elevation: 16, paddingTop: 50, paddingBottom: 20, display: 'flex' },
  drawerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  logoRow: { flexDirection: 'row', alignItems: 'center' },
  drawerLogo: { width: 125, height: 125, marginTop: -35, marginBottom: -35, marginLeft: -22, marginRight: 0 },
  logoTextContainer: { flexDirection: 'column', justifyContent: 'center', marginLeft: 8 },
  logoText: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  logoSubtitle: { fontSize: 12, color: '#64748B', marginTop: 2, fontWeight: '500' },
  closeIcon: { fontSize: 18, color: '#64748B', fontWeight: 'bold' },
  drawerScroll: { flex: 1, paddingHorizontal: 12, paddingTop: 15 },
  drawerItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, marginBottom: 4 },
  activeDrawerItem: { backgroundColor: '#F3E8FF' },
  drawerItemText: { fontSize: 13.5, fontWeight: '500', color: '#475569' },
  activeDrawerItemText: { color: '#8B5CF6', fontWeight: 'bold' },
  drawerGroupHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, marginTop: 4 },
  drawerGroupLabel: { fontSize: 13.5, fontWeight: '600', color: '#334155' },
  arrowIcon: { fontSize: 10, color: '#94A3B8' },
  groupChildren: { paddingLeft: 24, backgroundColor: '#FAF9F6', borderRadius: 12, paddingVertical: 4, marginTop: 2 },
  drawerSubItem: { paddingVertical: 10, paddingHorizontal: 12 },
  drawerSubItemText: { fontSize: 12.5, color: '#475569', fontWeight: '500' },
  drawerFooter: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 16, paddingHorizontal: 20 },
  avatarCircleSmall: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' },
  avatarTextSmall: { color: '#6366F1', fontWeight: 'bold', fontSize: 13 },
  footerUserName: { fontSize: 13.5, fontWeight: 'bold', color: '#0F172A' },
  footerUserRole: { fontSize: 11, color: '#64748B', marginTop: 1 }
});
