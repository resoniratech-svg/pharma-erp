import React, { useState } from 'react';
import { PageHeader, FilterBar, SearchInput, TableCard, DataTable, Badge, ActionButton, SummaryCard, DrawerField } from './components/shared';
import { Download, Eye, Users, UserCheck, UserX, Clock, MapPin, ChevronDown, FileText, Table as TableIcon } from 'lucide-react';

import { exportToCSV } from '../../utils/exportUtils';
import { Drawer } from '../../components/ui/Drawer';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { asmService } from '../../services/asmService';

import { attendanceService } from '../../services/attendanceService';

export default function Attendance() {
  const [activeTab, setActiveTab] = useState<'my-attendance' | 'team-attendance'>('my-attendance');
  const [myRecords, setMyRecords] = useState<any[]>([]);
  
  // Team Attendance State
  const [teamAttendance, setTeamAttendance] = useState<any[]>([]);
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

  React.useEffect(() => {
    const fetchMyRecords = async () => {
      try {
        let authUser = null;
        try {
          const authUserString = localStorage.getItem('authUser');
          authUser = authUserString ? JSON.parse(authUserString) : null;
        } catch { }
        
        let isManager = false;
        if (authUser) {
          const userRole = authUser.roleId || authUser.role;
          const managementRoles = ['SUPER_ADMIN', 'ADMIN', 'NATIONAL_SALES_HEAD', 'REGIONAL_SALES_MANAGER', 'AREA_SALES_MANAGER', 'National Sales Head', 'Regional Sales Manager', 'Area Sales Manager'];
          if (managementRoles.includes(userRole)) {
            isManager = true;
          }
        }

        const rawMrId = localStorage.getItem('mrId');
        
        if (!isManager && rawMrId) {
          const mrId = Number(rawMrId);
          const data = await attendanceService.loadAttendance(mrId);
          setMyRecords(data);
        } else {
          // Managers load from scoped localStorage
          const userId = authUser?.id || 'default';
          const scopedKey = `web_attendance_records_${userId}`;
          const stored = localStorage.getItem(scopedKey);
          if (stored) {
            setMyRecords(JSON.parse(stored));
          }
        }
      } catch (e) {
        console.error("Failed to load personal attendance records:", e);
      }
    };
    if (activeTab === 'my-attendance') {
      fetchMyRecords();
    }
  }, [activeTab]);

  React.useEffect(() => {
    if (activeTab === 'team-attendance') {
      asmService.getTeamAttendance().then(data => {
        const mapped = data.map((d: any) => ({
          id: `ATT${d.id}`,
          date: d.attendanceDate ? new Date(d.attendanceDate).toLocaleDateString() : '-',
          empCode: d.mr?.employee?.employeeCode || `EMP-${d.mr?.employee?.id}`,
          empName: d.mr?.employee?.employeeName || 'Unknown',
          designation: d.mr?.employee?.designation || 'MR',
          state: d.mr?.employee?.state || '-',
          reportingRsm: '-',
          hq: d.mr?.employee?.headquarters || '-',
          checkInTime: d.checkInTime ? new Date(d.checkInTime).toLocaleTimeString() : '-',
          checkOutTime: d.checkOutTime ? new Date(d.checkOutTime).toLocaleTimeString() : '-',
          workingHours: '-',
          status: 'Present',
          gpsStatus: 'Verified',
          checkInCoords: `${d.checkInLatitude}, ${d.checkInLongitude}`,
          checkOutCoords: d.checkOutLatitude ? `${d.checkOutLatitude}, ${d.checkOutLongitude}` : '-',
          checkInAddress: '-',
          checkOutAddress: '-',
          deviceName: '-',
          deviceId: '-',
          remarks: '-'
        }));
        setTeamAttendance(mapped);
      }).catch(console.error);
    }
  }, [activeTab]);

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

  const filteredData = teamAttendance.filter(row => {
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
        subtitle="Manage your daily attendance and monitor MR attendance."
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
            <h3 className="text-lg font-bold text-slate-800 mb-4">My Attendance History</h3>
            <TableCard>
              <DataTable 
                columns={[
                  { key: 'date', label: 'Date', render: (row: any) => <span className="font-semibold text-slate-900">{row.date}</span> },
                  { key: 'checkInTime', label: 'Check In', render: (row: any) => <span className="text-emerald-600 font-medium">{row.checkInTime}</span> },
                  { key: 'checkOutTime', label: 'Check Out', render: (row: any) => <span className="text-rose-600 font-medium">{row.checkOutTime}</span> },
                  { key: 'location', label: 'Start Location' },
                  {
                    key: 'status',
                    label: 'Status',
                    render: (row: any) => {
                      const currentStatus = row.dayStatus || row.status;
                      const variant = currentStatus === 'Present' || currentStatus === 'Completed' ? 'success' : 
                                      currentStatus === 'Absent' || currentStatus === 'Missed Check-Out' || currentStatus === 'Auto Closed' ? 'danger' : 
                                      currentStatus === 'Half Day' || currentStatus === 'Pending Checkout' ? 'warning' : 'neutral';
                      return <Badge variant={variant as any}>{currentStatus}</Badge>;
                    }
                  }
                ]}
                data={myRecords}
                emptyMessage="No attendance records found."
              />
            </TableCard>
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
                  <SearchInput value={search} onChange={setSearch} placeholder="Search MR, State, HQ..." />
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

            {/* View Details Drawer */}
            <Drawer
              isOpen={isViewModalOpen}
              onClose={() => setIsViewModalOpen(false)}
              title={`Attendance Details: ${selectedRecord?.empCode}`}
            >
              {selectedRecord && (
                <div className="flex flex-col h-full pb-8">
                  <div className="space-y-1">
                    
                    {/* Employee Information */}
                    <div className="py-3 border-t border-slate-100 first:border-0">
                      <p className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">Employee Information</p>
                      <div className="space-y-1">
                        <DrawerField label="Employee Code" value={selectedRecord.empCode} />
                        <DrawerField label="Employee Name" value={selectedRecord.empName} />
                        <DrawerField label="Designation" value={selectedRecord.designation} />
                        <DrawerField label="Reporting Manager" value={selectedRecord.reportingRsm} />
                        <DrawerField label="State" value={selectedRecord.state} />
                        <DrawerField label="HQ / Territory" value={selectedRecord.hq} />
                      </div>
                    </div>

                    {/* Attendance Information */}
                    <div className="py-3 border-t border-slate-100 first:border-0">
                      <p className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">Attendance Information</p>
                      <div className="space-y-1">
                        <DrawerField label="Attendance Date" value={selectedRecord.date} />
                        <DrawerField label="Attendance Status" value={selectedRecord.status} />
                        <DrawerField label="Check-In Time" value={selectedRecord.checkInTime} />
                        <DrawerField label="Check-Out Time" value={selectedRecord.checkOutTime} />
                        <DrawerField label="Total Working Hours" value={selectedRecord.workingHours} />
                      </div>
                    </div>

                    {/* GPS Information */}
                    <div className="py-3 border-t border-slate-100 first:border-0">
                      <p className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">GPS Information</p>
                      <div className="space-y-1">
                        <DrawerField label="GPS Verification Status" value={selectedRecord.gpsStatus} />
                        <DrawerField label="Check-In Address" value={selectedRecord.checkInAddress} />
                        <DrawerField label="Check-In Coordinates" value={selectedRecord.checkInCoords} />
                        <DrawerField label="Check-Out Address" value={selectedRecord.checkOutAddress} />
                        <DrawerField label="Check-Out Coordinates" value={selectedRecord.checkOutCoords} />
                      </div>
                    </div>

                    {/* Additional Information */}
                    <div className="py-3 border-t border-slate-100 first:border-0">
                      <p className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">Additional Information</p>
                      <div className="space-y-1">
                        <DrawerField label="Device Name" value={selectedRecord.deviceName || '-'} />
                        <DrawerField label="Device ID" value={selectedRecord.deviceId || '-'} />
                        <DrawerField label="Attendance Remarks" value={selectedRecord.remarks || '-'} />
                      </div>
                    </div>

                  </div>
                  
                  <div className="mt-auto pt-6 border-t border-slate-100">
                    <button
                      onClick={() => setIsViewModalOpen(false)}
                      className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors"
                    >
                      Close Details
                    </button>
                  </div>
                </div>
              )}
            </Drawer>
          </div>
        )}
      </div>
    </div>
  );
}
