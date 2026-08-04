import React, { useState } from 'react';
import { PageHeader, FilterBar, SearchInput, TableCard, DataTable, Badge, ActionButton, SummaryCard } from './components/shared';
import { Download, Eye, Users, UserCheck, UserX, Clock, MapPin, ChevronDown, FileText, Table as TableIcon } from 'lucide-react';
import CheckIn from '../gps/CheckIn';
import { exportToCSV } from '../../utils/exportUtils';
import { Modal } from '../../components/ui/Modal';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Mock Data for Team Attendance
const MOCK_TEAM_ATTENDANCE = [
  {
    id: 'ATT002',
    date: '2026-08-02',
    empCode: 'ASM012',
    empName: 'Vikas Sharma',
    designation: 'ASM',
    state: 'Maharashtra',
    reportingRsm: 'Arun Kumar',
    hq: 'Pune',
    checkInTime: '09:45 AM',
    checkOutTime: '-',
    workingHours: '-',
    status: 'Late',
    gpsStatus: 'Verified',
    checkInCoords: '18.5204° N, 73.8567° E',
    checkOutCoords: '-',
    checkInAddress: 'Shivaji Nagar, Pune',
    checkOutAddress: '-',
    deviceName: 'OnePlus 11',
    deviceId: 'DEV-102934',
    remarks: 'Delayed due to traffic.'
  },
  {
    id: 'ATT003',
    date: '2026-08-02',
    empCode: 'MR045',
    empName: 'Rahul Verma',
    designation: 'MR',
    state: 'Maharashtra',
    reportingRsm: 'Arun Kumar',
    hq: 'Nagpur',
    checkInTime: '-',
    checkOutTime: '-',
    workingHours: '-',
    status: 'Absent',
    gpsStatus: 'N/A',
    checkInCoords: '-',
    checkOutCoords: '-',
    checkInAddress: '-',
    checkOutAddress: '-',
    deviceName: '-',
    deviceId: '-',
    remarks: 'Sick Leave.'
  },
  {
    id: 'ATT005',
    date: '2026-08-02',
    empCode: 'ASM024',
    empName: 'Amit Desai',
    designation: 'ASM',
    state: 'Gujarat',
    reportingRsm: 'Arun Kumar',
    hq: 'Rajkot',
    checkInTime: '09:20 AM',
    checkOutTime: '06:00 PM',
    workingHours: '8h 40m',
    status: 'Present',
    gpsStatus: 'Verified',
    checkInCoords: '22.3039° N, 70.8022° E',
    checkOutCoords: '22.3039° N, 70.8022° E',
    checkInAddress: 'Rajkot Central, Rajkot',
    checkOutAddress: 'Rajkot Central, Rajkot',
    deviceName: 'Redmi Note 12',
    deviceId: 'DEV-561239',
    remarks: '-'
  },
  {
    id: 'ATT006',
    date: '2026-08-02',
    empCode: 'MR112',
    empName: 'Sneha Patel',
    designation: 'MR',
    state: 'Gujarat',
    reportingRsm: 'Arun Kumar',
    hq: 'Surat',
    checkInTime: '10:15 AM',
    checkOutTime: '-',
    workingHours: '-',
    status: 'Late',
    gpsStatus: 'Verified',
    checkInCoords: '21.1702° N, 72.8311° E',
    checkOutCoords: '-',
    checkInAddress: 'Ring Road, Surat',
    checkOutAddress: '-',
    deviceName: 'Samsung Galaxy A54',
    deviceId: 'DEV-882310',
    remarks: '-'
  }
];

export default function Attendance() {
  const [activeTab, setActiveTab] = useState<'my-attendance' | 'team-attendance'>('my-attendance');
  
  // Team Attendance State
  const [search, setSearch] = useState('');
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [isExportOpen, setIsExportOpen] = useState(false);

  const [filters, setFilters] = useState({
    period: 'Today',
    status: 'All'
  });

  // Custom Range State
  const [customRange, setCustomRange] = useState({ from: '', to: '' });
  const [appliedCustomRange, setAppliedCustomRange] = useState({ from: '', to: '' });
  const [dateError, setDateError] = useState('');

  const handleApplyCustomRange = () => {
    setDateError('');
    if (!customRange.from || !customRange.to) {
      setDateError('Both From Date and To Date are mandatory.');
      return;
    }
    if (new Date(customRange.from) > new Date(customRange.to)) {
      setDateError('From Date cannot be greater than To Date.');
      return;
    }
    setAppliedCustomRange(customRange);
  };

  const handleResetCustomRange = () => {
    setCustomRange({ from: '', to: '' });
    setAppliedCustomRange({ from: '', to: '' });
    setDateError('');
    setFilters({ ...filters, period: 'Today' });
  };

  const filteredData = MOCK_TEAM_ATTENDANCE.filter(row => {
    const s = search.toLowerCase();
    const matchesSearch = search === '' || 
      row.empCode.toLowerCase().includes(s) ||
      row.empName.toLowerCase().includes(s) ||
      row.hq.toLowerCase().includes(s) ||
      row.state.toLowerCase().includes(s) ||
      row.designation.toLowerCase().includes(s);
      
    const matchesStatus = filters.status === 'All' || row.status === filters.status;

    let matchesDate = true;
    if (filters.period === 'Custom Range' && appliedCustomRange.from && appliedCustomRange.to) {
      const rowDate = new Date(row.date);
      const fromDate = new Date(appliedCustomRange.from);
      const toDate = new Date(appliedCustomRange.to);
      matchesDate = rowDate >= fromDate && rowDate <= toDate;
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Present': return { label: 'Present', color: 'success' };
      case 'Absent': return { label: 'Absent', color: 'error' };
      case 'Late': return { label: 'Late', color: 'warning' };
      case 'Half Day': return { label: 'Half Day', color: 'primary' };
      case 'On Leave': return { label: 'On Leave', color: 'neutral' };
      default: return { label: status, color: 'neutral' };
    }
  };

  // Summary Calculations
  const totalEmployees = filteredData.length;
  const presentCount = filteredData.filter(r => r.status === 'Present').length;
  const lateCount = filteredData.filter(r => r.status === 'Late').length;
  const absentCount = filteredData.filter(r => r.status === 'Absent' || r.status === 'On Leave').length;
  
  // Treat 'Present' and 'Late' and 'Half Day' as some form of attendance for the overall percentage
  const totalAttended = presentCount + lateCount + filteredData.filter(r => r.status === 'Half Day').length;
  const attendancePct = totalEmployees > 0 ? ((totalAttended / totalEmployees) * 100).toFixed(1) : '0.0';

  const openViewModal = (record: any) => {
    setSelectedRecord(record);
    setIsViewModalOpen(true);
  };

  const handleExportExcel = () => {
    if (filteredData.length === 0) return;
    
    const exportData = filteredData.map(row => ({
      'Date': row.date,
      'Employee Code': row.empCode,
      'Employee Name': row.empName,
      'HQ': row.hq,
      'Check-In': row.checkInTime,
      'Check-Out': row.checkOutTime,
      'Status': row.status
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Team Attendance");
    XLSX.writeFile(workbook, "Team_Attendance.xlsx");
    setIsExportOpen(false);
  };

  const handleExportPDF = () => {
    if (filteredData.length === 0) return;
    
    const doc = new jsPDF('landscape');
    
    doc.setFontSize(16);
    doc.text("Team Attendance Report", 14, 20);
    
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);
    
    const tableColumn = ["Date", "Employee Code", "Employee Name", "HQ", "Check-In", "Check-Out", "Status"];
    const tableRows = filteredData.map(row => [
      row.date,
      row.empCode,
      row.empName,
      row.hq,
      row.checkInTime,
      row.checkOutTime,
      row.status
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 35,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [22, 60, 120] } // #163c78
    });

    doc.save("Team_Attendance.pdf");
    setIsExportOpen(false);
  };

  const columns = [
    { key: 'date', label: 'Date', render: (row: any) => <span className="font-medium text-slate-700">{row.date}</span> },
    { key: 'empCode', label: 'Employee Code' },
    { key: 'empName', label: 'Employee Name', render: (row: any) => <span className="font-semibold text-slate-800">{row.empName}</span> },
    { key: 'hq', label: 'HQ' },
    { key: 'checkInTime', label: 'Check-In' },
    { key: 'checkOutTime', label: 'Check-Out' },
    {
      key: 'status',
      label: 'Attendance Status',
      render: (row: any) => {
        const s = getStatusBadge(row.status);
        return <Badge variant={s.color as any}>{s.label}</Badge>;
      }
    },
    {
      key: 'actions',
      label: 'Action',
      render: (row: any) => (
        <button 
          onClick={() => openViewModal(row)}
          className="p-1.5 text-slate-400 hover:text-[#163c78] hover:bg-blue-50 rounded transition-colors" 
          title="View Details"
        >
          <Eye className="w-4 h-4" />
        </button>
      )
    }
  ];

  return (
    <div className="p-6">
      <PageHeader 
        title="Attendance & Check-in" 
        subtitle="Manage your daily attendance and monitor team attendance."
      />

      <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg w-max mb-6">
        <button
          onClick={() => setActiveTab('my-attendance')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'my-attendance' 
              ? 'bg-white text-[#163c78] shadow-sm' 
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
          }`}
        >
          My Attendance
        </button>
        <button
          onClick={() => setActiveTab('team-attendance')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'team-attendance' 
              ? 'bg-white text-[#163c78] shadow-sm' 
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
          }`}
        >
          Team Attendance
        </button>
      </div>

      <div className="mt-4">
        {activeTab === 'my-attendance' ? (
          <div>
            <h3 className="text-lg font-bold text-slate-800 mb-4">Daily Check-In</h3>
            <CheckIn />
          </div>
        ) : (
          <div>
            {/* Team Attendance Filters */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 space-y-4">
              <div className="flex flex-wrap gap-4 items-center">
                
                <select 
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#163c78] bg-white flex-1 min-w-[130px]"
                  value={filters.period}
                  onChange={(e) => {
                    setFilters({...filters, period: e.target.value});
                    if (e.target.value !== 'Custom Range') {
                      setAppliedCustomRange({ from: '', to: '' });
                      setCustomRange({ from: '', to: '' });
                      setDateError('');
                    }
                  }}
                >
                  <option value="Today">Today</option>
                  <option value="Yesterday">Yesterday</option>
                  <option value="This Week">This Week</option>
                  <option value="This Month">This Month</option>
                  <option value="Custom Range">Custom Range</option>
                </select>

                <select 
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#163c78] bg-white flex-1 min-w-[140px]"
                  value={filters.status}
                  onChange={(e) => setFilters({...filters, status: e.target.value})}
                >
                  <option value="All">All</option>
                  <option value="Present">Present</option>
                  <option value="Absent">Absent</option>
                  <option value="Late">Late</option>
                  <option value="On Leave">On Leave</option>
                </select>

                <div className="flex-[2] min-w-[200px]">
                  <SearchInput value={search} onChange={setSearch} placeholder="Search Employee, State, HQ, Designation..." />
                </div>
                
                <div className="relative">
                  <button 
                    onClick={() => setIsExportOpen(!isExportOpen)}
                    disabled={filteredData.length === 0}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors shadow-sm border ${
                      filteredData.length === 0 
                        ? 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed' 
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <Download className="w-4 h-4" /> Export <ChevronDown className="w-4 h-4 text-slate-400" />
                  </button>
                  
                  {isExportOpen && filteredData.length > 0 && (
                    <>
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setIsExportOpen(false)}
                      ></div>
                      <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-lg shadow-lg z-20 py-1 overflow-hidden">
                        <button 
                          onClick={handleExportExcel}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left"
                        >
                          <TableIcon className="w-4 h-4 text-emerald-600" /> Export as Excel (.xlsx)
                        </button>
                        <button 
                          onClick={handleExportPDF}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left"
                        >
                          <FileText className="w-4 h-4 text-rose-600" /> Export as PDF (.pdf)
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {filters.period === 'Custom Range' && (
                <div className="flex flex-wrap gap-4 items-end bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <div className="flex flex-col">
                    <label className="text-xs font-semibold text-slate-600 mb-1">From Date <span className="text-rose-500">*</span></label>
                    <input 
                      type="date" 
                      className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#163c78]"
                      value={customRange.from}
                      onChange={(e) => setCustomRange({ ...customRange, from: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-xs font-semibold text-slate-600 mb-1">To Date <span className="text-rose-500">*</span></label>
                    <input 
                      type="date" 
                      className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#163c78]"
                      value={customRange.to}
                      onChange={(e) => setCustomRange({ ...customRange, to: e.target.value })}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={handleApplyCustomRange}
                      className="px-4 py-2 bg-[#163c78] text-white text-sm font-medium rounded-lg hover:bg-[#122e5c] transition-colors"
                    >
                      Apply
                    </button>
                    <button 
                      onClick={handleResetCustomRange}
                      className="px-4 py-2 bg-white text-slate-700 border border-slate-300 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      Reset
                    </button>
                  </div>
                  {dateError && (
                    <div className="w-full mt-2 text-sm text-rose-500 font-medium">
                      {dateError}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <SummaryCard
                title="Present Today"
                value={presentCount.toString()}
                icon={<UserCheck className="w-6 h-6" />}
                colorClass="text-emerald-600"
                bgClass="bg-emerald-50"
              />
              <SummaryCard
                title="Absent Today"
                value={absentCount.toString()}
                icon={<UserX className="w-6 h-6" />}
                colorClass="text-rose-600"
                bgClass="bg-rose-50"
              />
              <SummaryCard
                title="Late Check-ins"
                value={lateCount.toString()}
                icon={<Clock className="w-6 h-6" />}
                colorClass="text-amber-600"
                bgClass="bg-amber-50"
              />
              <SummaryCard
                title="Attendance %"
                value={`${attendancePct}%`}
                icon={<Users className="w-6 h-6" />}
                colorClass="text-blue-600"
                bgClass="bg-blue-50"
              />
            </div>

            {/* Attendance Table */}
            <TableCard>
              <DataTable columns={columns} data={filteredData} emptyMessage="No attendance records found." />
            </TableCard>

            {/* View Details Modal */}
            {selectedRecord && (
              <Modal
                isOpen={isViewModalOpen}
                onClose={() => setIsViewModalOpen(false)}
                title={`Attendance Details: ${selectedRecord.empCode}`}
                className="max-w-3xl w-full"
              >
                <div className="space-y-6">
                  {/* Header Metrics */}
                  <div className="flex justify-between items-center bg-slate-50 p-6 rounded-xl border border-slate-200">
                    <div>
                      <span className="block text-sm font-semibold text-slate-500 mb-1">Date: {selectedRecord.date}</span>
                      <span className="text-xl font-bold text-[#163c78]">{selectedRecord.empName}</span>
                      <span className="block text-sm font-medium text-slate-500 mt-1">{selectedRecord.designation} • {selectedRecord.state}</span>
                    </div>
                    <div className="text-right">
                      <span className="block text-sm font-semibold text-slate-500 mb-1">Status</span>
                      <Badge variant={getStatusBadge(selectedRecord.status).color as any}>
                        {getStatusBadge(selectedRecord.status).label}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Employee Information */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Employee Information</h4>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-slate-600">Employee Code</span>
                          <span className="text-sm font-bold text-slate-800">{selectedRecord.empCode}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-slate-600">Employee Name</span>
                          <span className="text-sm font-bold text-slate-800">{selectedRecord.empName}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-slate-600">Designation</span>
                          <span className="text-sm font-bold text-slate-800">{selectedRecord.designation}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-slate-600">Reporting RSM</span>
                          <span className="text-sm font-bold text-[#163c78]">{selectedRecord.reportingRsm}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-slate-600">State</span>
                          <span className="text-sm font-bold text-slate-800">{selectedRecord.state}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-slate-600">HQ / Territory</span>
                          <span className="text-sm font-bold text-slate-800">{selectedRecord.hq}</span>
                        </div>
                      </div>
                    </div>

                    {/* Attendance Information */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Attendance Information</h4>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-slate-600">Attendance Date</span>
                          <span className="text-sm font-bold text-slate-800">{selectedRecord.date}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-slate-600">Attendance Status</span>
                          <Badge variant={getStatusBadge(selectedRecord.status).color as any}>{selectedRecord.status}</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-slate-600">Check-In Time</span>
                          <span className="text-sm font-bold text-slate-800">{selectedRecord.checkInTime}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-slate-600">Check-Out Time</span>
                          <span className="text-sm font-bold text-slate-800">{selectedRecord.checkOutTime}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-slate-600">Total Working Hours</span>
                          <span className="text-sm font-bold text-purple-600">{selectedRecord.workingHours}</span>
                        </div>
                      </div>
                    </div>

                    {/* GPS Information */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm col-span-1 md:col-span-2">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">GPS Information</h4>
                      
                      <div className="mb-6 flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200">
                         <span className="text-sm font-medium text-slate-600">GPS Verification Status</span>
                         <span className={`text-sm font-bold flex items-center gap-1 ${selectedRecord.gpsStatus === 'Verified' ? 'text-emerald-600' : 'text-slate-500'}`}>
                           <MapPin className="w-4 h-4" />
                           {selectedRecord.gpsStatus}
                         </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                          <h5 className="text-sm font-bold text-slate-800">Check-In Details</h5>
                          <div>
                            <span className="block text-xs font-medium text-slate-500 mb-1">Check-In Address</span>
                            <span className="text-sm font-semibold text-slate-800">{selectedRecord.checkInAddress}</span>
                          </div>
                          <div>
                            <span className="block text-xs font-medium text-slate-500 mb-1">Check-In Coordinates</span>
                            <span className="text-sm font-mono text-slate-600">{selectedRecord.checkInCoords}</span>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <h5 className="text-sm font-bold text-slate-800">Check-Out Details</h5>
                          <div>
                            <span className="block text-xs font-medium text-slate-500 mb-1">Check-Out Address</span>
                            <span className="text-sm font-semibold text-slate-800">{selectedRecord.checkOutAddress}</span>
                          </div>
                          <div>
                            <span className="block text-xs font-medium text-slate-500 mb-1">Check-Out Coordinates</span>
                            <span className="text-sm font-mono text-slate-600">{selectedRecord.checkOutCoords}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Additional Information */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm col-span-1 md:col-span-2">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Additional Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <span className="block text-xs font-medium text-slate-500 mb-1">Device Name</span>
                          <span className="text-sm font-semibold text-slate-800">{selectedRecord.deviceName || '-'}</span>
                        </div>
                        <div>
                          <span className="block text-xs font-medium text-slate-500 mb-1">Device ID</span>
                          <span className="text-sm font-semibold text-slate-800">{selectedRecord.deviceId || '-'}</span>
                        </div>
                        <div>
                          <span className="block text-xs font-medium text-slate-500 mb-1">Attendance Remarks</span>
                          <span className="text-sm font-semibold text-slate-800">{selectedRecord.remarks || '-'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <ActionButton variant="secondary" onClick={() => setIsViewModalOpen(false)}>Close Summary</ActionButton>
                  </div>
                </div>
              </Modal>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
