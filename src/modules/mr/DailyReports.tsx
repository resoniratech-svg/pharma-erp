import { useState, useEffect, useMemo } from 'react';
import { Download, Filter, FileText, Activity, X, Check, Award, ShieldAlert } from 'lucide-react';
import {
  PageHeader,
  FilterBar,
  SearchInput,
  SelectFilter,
  ActionButton,
  TableCard,
  DataTable,
  Badge,
} from './components/shared';
import { type Column } from './components/shared';
import { ExportService } from '../../services/exportService';

// Centralized Services
import activityLogService from '../../services/activityLogService';
import { NotificationService } from '../../services/notificationService';
import { dailyReportService } from '../../services/dailyReportService';
import { doctorVisitService } from '../../services/doctorVisitService';
import { chemistVisitService } from '../../services/chemistVisitService';
import { retailerOrderService } from '../../services/retailerOrderService';

// Configurable Activity Score Multipliers
const SCORE_MULTIPLIERS = {
  doctor: 3,
  chemist: 2,
  order: 5,
};

// ✅ Helper to parse AM/PM or 24h time strings into sortable minutes from midnight
const parseTimeToMinutes = (timeStr: string): number => {
  if (!timeStr) return 0;
  const clean = timeStr.trim().toUpperCase();
  const match = clean.match(/^(\d+):(\d+)(?:\s*(AM|PM))?$/);
  if (!match) return 0;
  
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const ampm = match[3];
  
  if (ampm) {
    if (ampm === 'PM' && hours < 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;
  }
  return hours * 60 + minutes;
};

interface DCR {
  id: string;
  date: string;
  repName: string;
  userId: string; 
  area: string;
  doctorsVisited: number;
  chemistsVisited: number;
  totalOrders: number;
  orderValue: number;
  gpsAttendance?: string;
  startTime?: string;
  endTime?: string;
  workingHours?: string;    
  startLocation?: string;   
  endLocation?: string;     
  totalKmTravelled?: number;
  remarks?: string;
  challenges?: string;
  nextDayPlan?: string;
  status: 'Submitted' | 'Draft' | 'Approved' | 'Rejected';
  activityScore?: number;
  overtime?: boolean;
  managerRemarks?: string;
}

export default function DailyReports() {
  const [reports, setReports] = useState<DCR[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isCompiling, setIsCompiling] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);

  // Compile Modal & Form states
  const [showCompileModal, setShowCompileModal] = useState(false);
  const [tempReport, setTempReport] = useState<DCR | null>(null);
  const [remarks, setRemarks] = useState('');
  const [challenges, setChallenges] = useState('');
  const [nextPlan, setNextPlan] = useState('');
  const [isStillCheckedIn, setIsStillCheckedIn] = useState(false);

  // View Details Modal states
  const [selectedReport, setSelectedReport] = useState<DCR | null>(null);

  // Date Checker Helper at Component Level
  const isToday = (dateStr: string) => {
    if (!dateStr) return false;
    const today = new Date();
    const todayStr = today.toDateString();
    
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const isoToday = `${yyyy}-${mm}-${dd}`;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const formattedToday = `${dd}-${months[today.getMonth()]}-${yyyy}`;

    return dateStr.includes(isoToday) || dateStr.includes(formattedToday) || dateStr === todayStr;
  };

  // Safe JSON parsing for active user context to prevent component crash
  let authUser = null;
  try {
    const storedUser = localStorage.getItem('authUser');
    authUser = storedUser ? JSON.parse(storedUser) : null;
  } catch (e) {
    console.error("Error parsing authUser:", e);
  }
  const currentUserId = authUser?.id || '';

  // Memoized DCR lookup to optimize render performance
  const todayDCRInfo = useMemo(() => {
    const matchedDCR = reports.find(r => r.userId === currentUserId && isToday(r.date));
    const isLocked = matchedDCR && (matchedDCR.status === 'Submitted' || matchedDCR.status === 'Approved');
    return { todayDCR: matchedDCR, isTodayDCRLocked: isLocked };
  }, [reports, currentUserId]);

  const { todayDCR, isTodayDCRLocked } = todayDCRInfo;

  const mrId = Number(localStorage.getItem('mrId') || '1');

  useEffect(() => {
    async function loadData() {
      try {
        const loaded = await dailyReportService.loadDailyReports(mrId);
        setReports(loaded.map(r => ({
          id: r.id,
          date: r.date,
          repName: r.repName,
          userId: String(mrId),
          area: r.route || r.beat || 'Field',
          doctorsVisited: r.docCalls,
          chemistsVisited: r.chemCalls,
          totalOrders: r.orderCollected,
          orderValue: 0,
          remarks: r.remarks,
          status: 'Submitted' as const,
        })));

        // Pre-load current MR activities to local storage
        await doctorVisitService.loadDoctorVisits(mrId);
        await chemistVisitService.loadChemistVisits(mrId);
        await retailerOrderService.getRetailerOrders();
      } catch (error) {
        console.error('Failed to load DCR records from backend:', error);
      }
    }
    loadData();
  }, [mrId]);

  const handleStartCompile = () => {
    // Session Expiry Validation (No USR-MR fallback)
    if (!authUser || !currentUserId) {
      alert("❌ Session Expired: Please log in again to compile your DCR.");
      return;
    }

    setIsCompiling(true);
    setTimeout(() => {
      try {
        const today = new Date();
        const todayStr = today.toDateString();
        const activeMRName = authUser.fullName || authUser.name || 'Medical Representative';

        // Check for existing DCR today
        const existing = reports.find(
          (r) => r.userId === currentUserId && isToday(r.date)
        );

        // Double check UI lock
        if (existing && (existing.status === 'Submitted' || existing.status === 'Approved')) {
          alert(`❌ Compile Blocked: Today's DCR has already been ${existing.status} and is locked.`);
          setIsCompiling(false);
          return;
        }

        // Fetch attendance
        const attendanceData = JSON.parse(localStorage.getItem('web_attendance_records') || '[]');
        const todayAttendance = attendanceData.find(
          (a: any) => (a.userId === currentUserId || a.repName === activeMRName) && isToday(a.date)
        );

        // Load Doctor Visits (MR Filtered)
        const docData = JSON.parse(localStorage.getItem('doctor_visits') || localStorage.getItem('web_doctor_visits') || '[]');
        const todayDocs = docData.filter(
          (v: any) => (!v.mrId || Number(v.mrId) === mrId || v.userId === currentUserId || v.mrId === currentUserId || v.mrName === activeMRName) && isToday(v.visitDate || v.date)
        );
        const doctorsVisited = todayDocs.length;

        // Load Chemist Visits (MR Filtered)
        const chemData = JSON.parse(localStorage.getItem('chemist_visits') || localStorage.getItem('web_chemist_visits') || '[]');
        const todayChemists = chemData.filter(
          (v: any) => (!v.mrId || Number(v.mrId) === mrId || v.userId === currentUserId || v.mrId === currentUserId || v.mrName === activeMRName) && isToday(v.visitDate || v.date)
        );
        const chemistsVisited = todayChemists.length;

        // Load Orders (MR Filtered)
        const ordersData = JSON.parse(localStorage.getItem('@orders') || localStorage.getItem('web_orders') || '[]');
        const todayOrdersList = ordersData.filter(
          (o: any) => (!o.mrId || Number(o.mrId) === mrId || o.userId === currentUserId || o.mrId === currentUserId || o.mrName === activeMRName) && isToday(o.dateFormatted || o.date)
        );
        const totalOrders = todayOrdersList.length;
        const orderValue = todayOrdersList.reduce((sum: number, order: any) => sum + (parseFloat(order.totalAmount) || 0), 0);

        // Calculate Travel Distance (Haversine Formula)
        let totalKm = 0;
        if (todayAttendance && todayAttendance.latitude && todayAttendance.longitude) {
          let lastLat = parseFloat(todayAttendance.latitude);
          let lastLng = parseFloat(todayAttendance.longitude);
          
          const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
            const R = 6371;
            const dLat = (lat2 - lat1) * Math.PI / 180;
            const dLon = (lon2 - lon1) * Math.PI / 180;
            const a = 
              Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            return R * c;
          };

          const visitsList: any[] = [];
          todayDocs.forEach((v: any) => { if (v.latitude && v.longitude) visitsList.push({ lat: parseFloat(v.latitude), lng: parseFloat(v.longitude), time: v.time || '09:00 AM' }); });
          todayChemists.forEach((c: any) => { if (c.latitude && c.longitude) visitsList.push({ lat: parseFloat(c.latitude), lng: parseFloat(c.longitude), time: c.time || '10:00 AM' }); });
          
          // ✅ Chronological sorting using the parseTimeToMinutes comparator
          visitsList.sort((a, b) => parseTimeToMinutes(a.time) - parseTimeToMinutes(b.time));
          visitsList.forEach((visit) => {
            totalKm += calculateDistance(lastLat, lastLng, visit.lat, visit.lng);
            lastLat = visit.lat;
            lastLng = visit.lng;
          });
        }

        // Calculate Activity Score using constants
        const score = 
          (doctorsVisited * SCORE_MULTIPLIERS.doctor) + 
          (chemistsVisited * SCORE_MULTIPLIERS.chemist) + 
          (totalOrders * SCORE_MULTIPLIERS.order);

        // Calculate Shift Overtime
        let isOvertime = false;
        if (todayAttendance?.totalMinutes) {
          isOvertime = todayAttendance.totalMinutes > 540; // 9 hours
        }

        const areaName = todayAttendance?.location ? (todayAttendance.location.split(',')[0] || 'HQ Region') : 'HQ Region';
        const gpsStatus = todayAttendance?.status || 'Not Checked In';
        const startTime = todayAttendance?.checkInTime || '-';
        
        const checkedInStatus = todayAttendance?.checkOutTime === '-' || !todayAttendance?.checkOutTime;
        setIsStillCheckedIn(checkedInStatus);
        
        const endTime = !checkedInStatus ? todayAttendance.checkOutTime : 'Pending Check-Out';

        setTempReport({
          id: existing?.id || Date.now().toString(),
          date: todayStr,
          repName: activeMRName,
          userId: currentUserId, 
          area: areaName,
          doctorsVisited,
          chemistsVisited,
          totalOrders,
          orderValue,
          gpsAttendance: gpsStatus,
          startTime,
          endTime,
          workingHours: todayAttendance?.workingHours || '0h 0m',      
          startLocation: todayAttendance?.location || '-',             
          endLocation: todayAttendance?.checkOutLocation || '-',       
          totalKmTravelled: Math.round(totalKm),
          status: existing?.status || 'Draft',
          activityScore: score,
          overtime: isOvertime,
          managerRemarks: existing?.managerRemarks || ''
        });

        // Pre-fill text inputs if report already exists as draft
        setRemarks(existing?.remarks || '');
        setChallenges(existing?.challenges || '');
        setNextPlan(existing?.nextDayPlan || '');

        // Prompt if no activities logged today
        if (doctorsVisited + chemistsVisited + totalOrders === 0) {
          if (!confirm("⚠️ No activities (visits or orders) found for today. Do you still want to compile today's DCR?")) {
            setIsCompiling(false);
            return;
          }
        }

        setShowCompileModal(true);
      } catch (e) {
        console.error(e);
        alert('Failed to compile DCR metrics.');
      } finally {
        setIsCompiling(false);
      }
    }, 600);
  };

  const handleSaveDCR = async (finalStatus: 'Draft' | 'Submitted') => {
    if (!tempReport) return;

    if (finalStatus === 'Submitted' && isStillCheckedIn) {
      alert("❌ Submission Blocked: You must complete your Attendance Check-Out before submitting your final DCR!");
      return;
    }

    // Trim whitespace when submitting
    const trimmedRemarks = remarks.trim();
    if (finalStatus === 'Submitted' && trimmedRemarks.length === 0) {
      alert("❌ Remarks are required for DCR final submission.");
      return;
    }

    try {
      const mapped = await dailyReportService.addDailyReport(mrId, {
        date: new Date().toISOString().split('T')[0],
        docCalls: tempReport.doctorsVisited,
        chemCalls: tempReport.chemistsVisited,
        orderCollected: tempReport.totalOrders,
        remarks: trimmedRemarks,
        status: finalStatus === 'Submitted' ? 'Submitted' : 'Draft',
      });

      const newReport: DCR = {
        ...tempReport,
        id: String(mapped.id),
        remarks: trimmedRemarks,
        challenges: challenges.trim(),
        nextDayPlan: nextPlan.trim(),
        status: finalStatus === 'Submitted' ? 'Submitted' : 'Draft'
      };

      // Index check using scoped userId
      const existingIndex = reports.findIndex(
        (r) => r.userId === tempReport.userId && isToday(r.date)
      );
      let updatedReports;
      
      if (existingIndex >= 0) {
        updatedReports = [...reports];
        updatedReports[existingIndex] = newReport;
      } else {
        updatedReports = [newReport, ...reports];
      }

      setReports(updatedReports);
      localStorage.setItem('web_daily_reports', JSON.stringify(updatedReports));

      // Centralized Service Audit Log
      activityLogService.addLog({
        userId: tempReport.userId,
        userName: tempReport.repName,
        action: finalStatus === 'Submitted' ? 'Submitted DCR' : 'Saved DCR Draft',
        module: 'Daily Call Reporting (DCR)',
      });

      // Centralized Manager Notifications
      if (finalStatus === 'Submitted') {
        NotificationService.addNotification({
          title: 'New DCR Submitted',
          message: `${tempReport.repName} has submitted today's DCR for approval.`,
          type: 'mr',
          priority: 'high',
          module: 'Daily Call Reporting (DCR)',
          isActionRequired: true,
          actionUrl: '/workspace/super-admin/dcr-reviews'
        });
      }

      alert(finalStatus === 'Submitted' ? '✅ DCR submitted successfully to manager and database!' : '📝 DCR saved as draft.');
      setShowCompileModal(false);
      setTempReport(null);
    } catch (error: any) {
      console.error(error);
      alert('Failed to submit DCR: ' + error.message);
    }
  };

  const columns: Column<DCR>[] = [
    { key: 'date', label: 'Report Date', render: (row) => <span className="font-semibold text-slate-900">{row.date}</span> },
    { key: 'repName', label: 'Rep Name' },
    { key: 'doctorsVisited', label: 'Doc Calls' },
    { key: 'chemistsVisited', label: 'Chemist Calls' },
    { key: 'totalOrders', label: 'Orders' },
    { key: 'orderValue', label: 'Sales (₹)', render: (row) => <span className="font-semibold text-emerald-600">₹{row.orderValue?.toLocaleString() || 0}</span> },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const variant = 
          row.status === 'Approved' ? 'success' : 
          row.status === 'Submitted' ? 'info' : 
          row.status === 'Rejected' ? 'danger' : 'neutral';
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    },
    {
      key: 'action',
      label: 'Details',
      render: (row) => (
        <button 
          onClick={() => setSelectedReport(row)}
          className="text-violet-600 hover:text-violet-800 p-1 bg-violet-50 rounded-lg hover:bg-violet-100 transition-all"
        >
          <FileText className="w-4 h-4" />
        </button>
      )
    }
  ];

  const filteredData = reports.filter((item) => {
    const matchSearch = item.date.toLowerCase().includes(search.toLowerCase()) || item.repName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  // Rich Export columns
  const exportColumns = [
    { header: 'Date', dataKey: 'date' },
    { header: 'Rep Name', dataKey: 'repName' },
    { header: 'Area', dataKey: 'area' },
    { header: 'Doctor Calls', dataKey: 'doctorsVisited' },
    { header: 'Chemist Calls', dataKey: 'chemistsVisited' },
    { header: 'Total Orders', dataKey: 'totalOrders' },
    { header: 'Sales (Rs.)', dataKey: 'orderValue' },
    { header: 'Start Time', dataKey: 'startTime' },
    { header: 'End Time', dataKey: 'endTime' },
    { header: 'Working Hours', dataKey: 'workingHours' },
    { header: 'Distance (km)', dataKey: 'totalKmTravelled' },
    { header: 'Overtime', dataKey: 'overtime' },
    { header: 'GPS status', dataKey: 'gpsAttendance' },
    { header: 'Activity Score', dataKey: 'activityScore' },
    { header: 'Status', dataKey: 'status' }
  ];

  const handleExportPDF = () => {
    if (filteredData.length === 0) return alert("No reports to export.");
    ExportService.exportToPDF({
      title: 'Daily Call Report (DCR)',
      filename: `DCR_Export_${new Date().toISOString().split('T')[0]}`,
      data: filteredData,
      columns: exportColumns
    });
  };

  const handleExportExcel = () => {
    if (filteredData.length === 0) return alert("No reports to export.");
    ExportService.exportToExcel({
      title: 'Daily Call Report (DCR)',
      filename: `DCR_Export_${new Date().toISOString().split('T')[0]}`,
      data: filteredData,
      columns: exportColumns
    });
  };

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Daily Reporting (DCR)"
        subtitle="Submit and review daily field force activities and DCR logs."
        actions={
          <div className="flex items-center gap-3">
            {/* Export Dropdown */}
            <div className="relative">
              <ActionButton 
                variant="secondary" 
                onClick={() => setIsExportOpen(!isExportOpen)} 
                icon={<Download className="w-4 h-4" />}
              >
                Export Reports
              </ActionButton>
              
              {isExportOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden z-50">
                  <button 
                    onClick={() => { handleExportExcel(); setIsExportOpen(false); }} 
                    className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors border-b border-slate-100"
                  >
                    Excel (.xlsx)
                  </button>
                  <button 
                    onClick={() => { handleExportPDF(); setIsExportOpen(false); }} 
                    className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    PDF Document
                  </button>
                </div>
              )}
            </div>

            {/* ✅ Render a styled button that naturally supports the disabled property */}
            {isTodayDCRLocked ? (
              <button 
                disabled
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 outline-none bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
              >
                DCR Submitted & Locked
              </button>
            ) : (
              <button
                onClick={handleStartCompile} 
                disabled={isCompiling}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-1 text-white shadow-sm shadow-violet-200 transition-colors ${
                  isCompiling 
                    ? 'bg-slate-300 cursor-not-allowed' 
                    : 'bg-violet-600 hover:bg-violet-700 cursor-pointer'
                }`}
              >
                <Activity className="w-4 h-4" />
                {isCompiling ? 'Compiling Metrics...' : "Compile Today's DCR"}
              </button>
            )}
          </div>
        }
      />

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search by date or name..." />
        <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-600">Filters:</span>
        </div>
        <SelectFilter
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { label: 'Draft', value: 'Draft' },
            { label: 'Submitted', value: 'Submitted' },
            { label: 'Approved', value: 'Approved' },
            { label: 'Rejected', value: 'Rejected' },
          ]}
          placeholder="All Status"
        />
      </FilterBar>

      <TableCard>
        <DataTable
          columns={columns}
          data={filteredData}
          emptyMessage="No DCR submissions logged."
        />
      </TableCard>

      {/* ==================== 1. DCR SUBMISSION & FORM MODAL ==================== */}
      {showCompileModal && tempReport && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-2xl w-full shadow-2xl overflow-hidden animate-in zoom-in duration-200 flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Compile DCR Form</h3>
                <p className="text-xs text-slate-500">Review metrics and write daily activities summaries.</p>
              </div>
              <button onClick={() => setShowCompileModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              
              {/* Warnings and Check-out block */}
              {isStillCheckedIn ? (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-3.5 text-xs font-semibold flex items-center gap-2.5">
                  <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
                  <div>
                    <span>You are still checked in today. You can Save as Draft, but you must complete your Check-Out to Submit the final DCR.</span>
                  </div>
                </div>
              ) : (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-3.5 text-xs font-semibold flex items-center gap-2.5">
                  <Check className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>Check-Out validated. DCR is eligible for final submission.</span>
                </div>
              )}

              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="text-center p-2">
                  <span className="text-xs text-slate-500 font-medium block">Doc Calls</span>
                  <span className="text-lg font-bold text-slate-800">{tempReport.doctorsVisited}</span>
                </div>
                <div className="text-center p-2">
                  <span className="text-xs text-slate-500 font-medium block">Chemist Calls</span>
                  <span className="text-lg font-bold text-slate-800">{tempReport.chemistsVisited}</span>
                </div>
                <div className="text-center p-2">
                  <span className="text-xs text-slate-500 font-medium block">Orders</span>
                  <span className="text-lg font-bold text-slate-800">{tempReport.totalOrders}</span>
                </div>
                <div className="text-center p-2">
                  <span className="text-xs text-slate-500 font-medium block">Sales (₹)</span>
                  <span className="text-lg font-bold text-emerald-600">₹{tempReport.orderValue}</span>
                </div>
              </div>

              {/* KPI Calculations Info */}
              <div className="grid grid-cols-3 gap-4 text-xs font-medium text-slate-600 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-1.5 justify-center">
                  <Award className="w-4 h-4 text-violet-500" />
                  <span>Score: <b className="text-slate-800">{tempReport.activityScore} pts</b></span>
                </div>
                <div className="text-center">
                  <span>Distance: <b className="text-slate-800">{tempReport.totalKmTravelled} km</b></span>
                </div>
                <div className="text-center">
                  <span>Overtime: <b className={tempReport.overtime ? 'text-amber-600' : 'text-slate-800'}>{tempReport.overtime ? 'Yes' : 'No'}</b></span>
                </div>
              </div>

              {/* Remarks Form */}
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Today's Summary / Remarks <b className="text-rose-500">*</b></label>
                  <textarea 
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    rows={2.5}
                    placeholder="Enter highlights of the day..."
                    className="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500"
                  />
                </div>
                
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Challenges Faced</label>
                  <textarea 
                    value={challenges}
                    onChange={(e) => setChallenges(e.target.value)}
                    rows={2}
                    placeholder="e.g. Doctor unavailable, stock issues..."
                    className="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Next Day Plan</label>
                  <textarea 
                    value={nextPlan}
                    onChange={(e) => setNextPlan(e.target.value)}
                    rows={2}
                    placeholder="Enter route plan or targets for tomorrow..."
                    className="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500"
                  />
                </div>
              </div>

            </div>

            {/* Modal Actions */}
            <div className="px-6 py-4 border-t border-slate-100 flex gap-3 bg-slate-50 justify-end">
              <button 
                onClick={() => setShowCompileModal(false)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-100 font-bold transition-all"
              >
                Cancel
              </button>
              
              <button 
                onClick={() => handleSaveDCR('Draft')}
                className="px-4 py-2 border border-violet-200 text-violet-600 rounded-lg text-sm hover:bg-violet-50 font-bold transition-all"
              >
                Save as Draft
              </button>

              <button 
                disabled={isStillCheckedIn || remarks.trim().length === 0}
                onClick={() => handleSaveDCR('Submitted')}
                className={`px-5 py-2 rounded-lg text-sm font-bold text-white transition-all ${
                  isStillCheckedIn || remarks.trim().length === 0
                    ? 'bg-slate-300 cursor-not-allowed'
                    : 'bg-violet-600 hover:bg-violet-700 shadow-md shadow-violet-100 shadow-violet-100'
                }`}
              >
                Submit DCR
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ==================== 2. VIEW DETAILS MODAL ==================== */}
      {selectedReport && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-xl w-full shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-900">DCR Summary Detail</h3>
                <p className="text-xs text-slate-500">DCR date: {selectedReport.date}</p>
              </div>
              <button onClick={() => setSelectedReport(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-y-3.5 border-b border-slate-100 pb-4">
                <div>
                  <span className="text-xs font-semibold text-slate-400 block">MR Representative</span>
                  <span className="font-bold text-slate-800">{selectedReport.repName}</span>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-400 block">Status</span>
                  <Badge variant={selectedReport.status === 'Approved' ? 'success' : selectedReport.status === 'Submitted' ? 'info' : selectedReport.status === 'Rejected' ? 'danger' : 'neutral'}>
                    {selectedReport.status}
                  </Badge>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-400 block">Start / End Time</span>
                  <span className="font-bold text-slate-800">
                    {selectedReport.startTime} - {selectedReport.endTime}
                  </span>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-400 block">Shift Duration</span>
                  <span className="font-bold text-slate-800">
                    {selectedReport.workingHours || '0h 0m'} ({selectedReport.overtime ? 'Overtime' : 'Normal'})
                  </span>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-400 block">Start Location</span>
                  <span className="font-bold text-slate-800 text-xs truncate block" title={selectedReport.startLocation}>
                    {selectedReport.startLocation || '-'}
                  </span>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-400 block">End Location</span>
                  <span className="font-bold text-slate-800 text-xs truncate block" title={selectedReport.endLocation}>
                    {selectedReport.endLocation || '-'}
                  </span>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-400 block">Area Territory</span>
                  <span className="font-bold text-slate-800">{selectedReport.area}</span>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-400 block">Distance Travelled</span>
                  <span className="font-bold text-slate-800">{selectedReport.totalKmTravelled} km</span>
                </div>
              </div>

              {/* Activities and Score */}
              <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="space-y-1">
                  <span className="text-xs text-slate-500 font-medium block">Total Field Calls Logged</span>
                  <span className="text-slate-700 font-semibold">
                    Docs: {selectedReport.doctorsVisited} | Chemists: {selectedReport.chemistsVisited} | Orders: {selectedReport.totalOrders}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 block">Activity Score</span>
                  <span className="text-lg font-black text-violet-600">{selectedReport.activityScore || 0} pts</span>
                </div>
              </div>

              {/* DCR Summaries Text */}
              <div className="space-y-3 pt-2">
                <div>
                  <span className="text-xs font-bold text-slate-500 block mb-0.5">DCR Summary & Remarks</span>
                  <p className="bg-slate-50/50 p-2.5 rounded-lg text-slate-700 border border-slate-100 text-xs italic">
                    "{selectedReport.remarks || 'No remarks provided.'}"
                  </p>
                </div>
                
                {selectedReport.challenges && (
                  <div>
                    <span className="text-xs font-bold text-slate-500 block mb-0.5">Challenges Faced</span>
                    <p className="text-slate-700 text-xs">{selectedReport.challenges}</p>
                  </div>
                )}

                {selectedReport.nextDayPlan && (
                  <div>
                    <span className="text-xs font-bold text-slate-500 block mb-0.5">Next Day Plan</span>
                    <p className="text-slate-700 text-xs">{selectedReport.nextDayPlan}</p>
                  </div>
                )}

                {/* Manager Comments Section */}
                <div className="border-t border-slate-100 pt-3">
                  <span className="text-xs font-bold text-slate-500 block mb-1">Manager Remarks</span>
                  <p className="bg-amber-50 text-amber-900 p-2.5 rounded-lg border border-amber-100 text-xs">
                    {selectedReport.managerRemarks || 'No manager comments yet. Pending review.'}
                  </p>
                </div>
              </div>

            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button 
                onClick={() => setSelectedReport(null)}
                className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg text-sm font-bold transition-all"
              >
                Close View
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}