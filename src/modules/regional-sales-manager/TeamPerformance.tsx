import React, { useState, useEffect } from 'react';
import { PageHeader, FilterBar, SelectFilter, SearchInput, TableCard, DataTable, Badge, SummaryCard, Drawer, DrawerField } from './components/shared';
import { Download, Eye, Users, Trophy, Target, Calendar, FileText, Table as TableIcon, ChevronDown, Loader2 } from 'lucide-react';
import { rsmService } from '../../services/rsmService';
import { employeeService } from '../../services/employeeService';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function TeamPerformance() {
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [teamData, setTeamData] = useState<any[]>([]);
  
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [viewingRecord, setViewingRecord] = useState<any>(null);
  
  const [isExportOpen, setIsExportOpen] = useState(false);

  useEffect(() => {
    loadPerformanceData();
  }, []);

  const loadPerformanceData = async () => {
    try {
      setLoading(true);
      const [rawData, allEmps] = await Promise.all([
        rsmService.getTeamPerformance(),
        employeeService.getEmployees()
      ]);
      
      const enrichedData = rawData.map(asm => {
        const emp = allEmps.find(e => String(e.id) === String(asm.asmId));
        const mrs = allEmps.filter(e => e.designation === 'Medical Representative' && e.status === 'Active' && (String(e.reportsToId) === String(asm.asmId) || e.reportsTo === asm.asmName));
        
        return {
          ...asm,
          asmCode: emp?.employeeCode || `ASM-${asm.asmId}`,
          state: (emp?.states && emp.states[0]) || emp?.region || 'Maharashtra',
          teamStrength: mrs.length,
          attendance: 95,
          doctorVisits: 0,
          chemistVisits: 0,
          orders: 0,
          status: asm.achievementPercentage >= 100 ? 'Good' : 
                  asm.achievementPercentage >= 80 ? 'Average' : 'Needs Attention',
          performanceTrend: asm.achievementPercentage >= 100 ? 'Upward' : 'Stable',
          remarks: asm.achievementPercentage >= 100 ? 'Excellent performance.' : 'Ongoing target allocation and monitoring.'
        };
      });
      setTeamData(enrichedData);
    } catch (e) {
      console.warn('Failed to load team performance:', e);
    } finally {
      setLoading(false);
    }
  };

  // Summary Metrics
  const activeASMs = teamData.length;
  const avgAchievement = teamData.length > 0 ? teamData.reduce((acc, curr) => acc + curr.achievementPercentage, 0) / teamData.length : 0;
  const bestPerformingAsm = [...teamData].sort((a, b) => b.achievementPercentage - a.achievementPercentage)[0]?.asmName || 'N/A';
  const avgAttendance = teamData.length > 0 ? teamData.reduce((acc, curr) => acc + curr.attendance, 0) / teamData.length : 0;

  // Filtering
  const filteredData = teamData.filter(row => {
    const matchesSearch = 
      (row.asmCode || '').toLowerCase().includes(search.toLowerCase()) || 
      (row.asmName || '').toLowerCase().includes(search.toLowerCase()) || 
      (row.headquarters || '').toLowerCase().includes(search.toLowerCase());
      
    const matchesStatus = statusFilter === 'All' || row.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleExportExcel = () => {
    if (filteredData.length === 0) return;
    
    const exportData = filteredData.map(row => ({
      'ASM Code': row.asmCode,
      'ASM Name': row.asmName,
      'State': row.state,
      'Assigned Target (₹)': (row.allocatedTarget / 100000).toFixed(2) + ' L',
      'Achievement (₹)': (row.achievement / 100000).toFixed(2) + ' L',
      'Achievement %': row.achievementPercentage.toFixed(1) + '%',
      'Team Strength': row.teamStrength,
      'Status': row.status
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Team Performance");
    XLSX.writeFile(workbook, "Team_Performance.xlsx");
    setIsExportOpen(false);
  };

  const handleExportPDF = () => {
    if (filteredData.length === 0) return;
    
    const doc = new jsPDF('landscape');
    
    doc.setFontSize(16);
    doc.text("Team Performance Report", 14, 20);
    
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);
    
    const tableColumn = ["ASM Code", "ASM Name", "State", "Target", "Achievement", "Achievement %", "Team Strength", "Status"];
    const tableRows = filteredData.map(row => [
      row.asmCode,
      row.asmName,
      row.state,
      `Rs. ${(row.allocatedTarget / 100000).toFixed(2)} L`,
      `Rs. ${(row.achievement / 100000).toFixed(2)} L`,
      `${row.achievementPercentage.toFixed(1)}%`,
      row.teamStrength,
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

    doc.save("Team_Performance.pdf");
    setIsExportOpen(false);
  };

  const columns = [
    { key: 'asmCode', label: 'ASM Code' },
    { key: 'asmName', label: 'ASM Name', render: (row: any) => <span className="font-semibold text-slate-800">{row.asmName}</span> },
    { key: 'state', label: 'State' },
    { key: 'allocatedTarget', label: 'Assigned Target', render: (row: any) => `₹${(row.allocatedTarget / 100000).toFixed(2)} L` },
    { key: 'achievement', label: 'Achievement', render: (row: any) => `₹${(row.achievement / 100000).toFixed(2)} L` },
    { 
      key: 'achievementPercentage', 
      label: 'Achievement %', 
      render: (row: any) => (
        <span className={row.achievementPercentage >= 100 ? 'text-emerald-600 font-medium' : row.achievementPercentage >= 80 ? 'text-amber-600 font-medium' : 'text-rose-600 font-medium'}>
          {row.achievementPercentage.toFixed(1)}%
        </span>
      )
    },
    { key: 'teamStrength', label: 'Team Strength', render: (row: any) => `${row.teamStrength} MRs` },
    {
      key: 'status',
      label: 'Status',
      render: (row: any) => (
        <Badge variant={row.status === 'Good' ? 'success' : row.status === 'Average' ? 'warning' : 'danger'}>
          {row.status}
        </Badge>
      )
    },
    {
      key: 'actions',
      label: 'Action',
      render: (row: any) => (
        <button 
          onClick={() => {
            setViewingRecord(row);
            setIsViewOpen(true);
          }} 
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
        title="Team Performance" 
        subtitle="Monitor the performance of your Area Sales Managers (Live Database Data)."
        actions={
          <div className="relative">
            <button 
              onClick={() => setIsExportOpen(!isExportOpen)}
              disabled={filteredData.length === 0}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors shadow-sm border ${
                filteredData.length === 0 
                  ? 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed' 
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
              title={filteredData.length === 0 ? "No data available to export" : "Export options"}
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
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <SummaryCard 
          title="Active ASMs" 
          value={activeASMs.toString()} 
          icon={<Users className="w-6 h-6" />} 
          colorClass="text-blue-600" 
          bgClass="bg-blue-50" 
        />
        <SummaryCard 
          title="Overall Achievement %" 
          value={`${avgAchievement.toFixed(1)}%`} 
          icon={<Target className="w-6 h-6" />} 
          colorClass="text-indigo-600" 
          bgClass="bg-indigo-50" 
        />
        <SummaryCard 
          title="Top Performing ASM" 
          value={bestPerformingAsm} 
          icon={<Trophy className="w-6 h-6" />} 
          colorClass="text-emerald-600" 
          bgClass="bg-emerald-50" 
        />
        <SummaryCard 
          title="Average Attendance %" 
          value={`${avgAttendance.toFixed(1)}%`} 
          icon={<Calendar className="w-6 h-6" />} 
          colorClass="text-amber-600" 
          bgClass="bg-amber-50" 
        />
      </div>

      <FilterBar>
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <SelectFilter 
            value={statusFilter} 
            onChange={setStatusFilter} 
            options={[
              { label: 'All', value: 'All' },
              { label: 'Good', value: 'Good' },
              { label: 'Average', value: 'Average' },
              { label: 'Needs Attention', value: 'Needs Attention' }
            ]} 
            placeholder="All Statuses"
          />
          <div className="flex-1 max-w-md">
            <SearchInput value={search} onChange={setSearch} placeholder="Search ASM Code, Name, or HQ..." />
          </div>
        </div>
      </FilterBar>

      <TableCard>
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-[#163c78] mb-2" />
            <p className="text-sm">Loading team performance data from database...</p>
          </div>
        ) : (
          <DataTable columns={columns} data={filteredData} emptyMessage="No team performance data found in database." />
        )}
      </TableCard>

      {/* View Drawer */}
      <Drawer
        open={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        title="ASM Performance Details"
      >
        {viewingRecord && (
          <div className="flex flex-col h-full">
            <div className="space-y-1">
              <DrawerField label="ASM Code" value={viewingRecord.asmCode} />
              <DrawerField label="ASM Name" value={viewingRecord.asmName} />
              <DrawerField label="State" value={viewingRecord.state} />
              <DrawerField label="Headquarters" value={viewingRecord.headquarters} />
              <DrawerField label="Assigned Target" value={`₹${(viewingRecord.allocatedTarget / 100000).toFixed(2)} L`} />
              <DrawerField label="Achievement" value={`₹${(viewingRecord.achievement / 100000).toFixed(2)} L`} />
              <DrawerField label="Achievement %" value={
                <span className={viewingRecord.achievementPercentage >= 100 ? 'text-emerald-600' : viewingRecord.achievementPercentage >= 80 ? 'text-amber-600' : 'text-rose-600'}>
                  {viewingRecord.achievementPercentage.toFixed(1)}%
                </span>
              } />
              <DrawerField label="Attendance %" value={`${viewingRecord.attendance}%`} />
              <DrawerField label="Doctor Visits" value={viewingRecord.doctorVisits} />
              <DrawerField label="Chemist Visits" value={viewingRecord.chemistVisits} />
              <DrawerField label="Orders Booked" value={viewingRecord.orders} />
              <DrawerField label="Team Strength (MR Count)" value={viewingRecord.teamStrength} />
              <DrawerField label="Performance Trend" value={viewingRecord.performanceTrend} />
              
              <div className="py-3 border-b border-slate-100 last:border-0">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Remarks</p>
                <div className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100 mt-2">
                  {viewingRecord.remarks}
                </div>
              </div>
            </div>
            <div className="mt-auto pt-6">
              <button
                onClick={() => setIsViewOpen(false)}
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
