import React, { useState, useEffect } from 'react';
import { PageHeader, FilterBar, SelectFilter, SearchInput, TableCard, DataTable, Badge, SummaryCard, Drawer, DrawerField } from './components/shared';
import { Download, Eye, Map, Trophy, Target, ShoppingBag, FileText, Table as TableIcon, ChevronDown } from 'lucide-react';
import { rsmService } from '../../services/rsmService';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function RegionalPerformance() {
  const [stateFilter, setStateFilter] = useState('All States');
  const [search, setSearch] = useState('');
  
  const [kpis, setKpis] = useState<any>(null);
  const [asmPerformance, setAsmPerformance] = useState<any[]>([]);
  
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [viewingRecord, setViewingRecord] = useState<any>(null);
  
  const [isExportOpen, setIsExportOpen] = useState(false);



  useEffect(() => {
    try {
      setKpis(rsmService.getDashboardKPIs());
      
      const rawData = rsmService.getTeamPerformance();
      // Enrich data with mock states/orders/visits since backend doesn't have it yet for MRs
      const enrichedData = rawData.map(asm => ({
        ...asm,
        date: '2026-08-02', // Mock date for filtering purposes
        state: asm.headquarters === 'Mumbai' ? 'Maharashtra' : 
               asm.headquarters === 'Ahmedabad' ? 'Gujarat' : 
               asm.headquarters === 'Bangalore' ? 'Karnataka' : 
               asm.headquarters === 'Delhi NCR' ? 'Delhi' : 'Maharashtra',
        orders: Math.floor(Math.random() * 50) + 10,
        doctorVisits: Math.floor(Math.random() * 100) + 50,
        chemistVisits: Math.floor(Math.random() * 80) + 30,
        attendance: 90 + Math.floor(Math.random() * 10),
        status: asm.achievementPercentage >= 100 ? 'Exceeded' : 
                asm.achievementPercentage >= 80 ? 'On Track' : 'At Risk',
        remarks: 'Monitoring required for next quarter.'
      }));
      setAsmPerformance(enrichedData);
    } catch (e) {
      console.warn("Failed to load analytics:", e);
    }
  }, []);

  if (!kpis) return null;

  // Filtering
  const filteredData = asmPerformance.filter(row => {
    const matchesSearch = 
      row.state.toLowerCase().includes(search.toLowerCase()) || 
      row.asmName.toLowerCase().includes(search.toLowerCase()) || 
      row.territory.toLowerCase().includes(search.toLowerCase());
      
    const matchesState = stateFilter === 'All States' || row.state === stateFilter;
    
    return matchesSearch && matchesState;
  });

  // Deriving summary metrics based on filtered data
  const uniqueStates = Array.from(new Set(filteredData.map(a => a.state)));
  
  const bestPerformingAsm = [...filteredData].sort((a, b) => b.achievementPercentage - a.achievementPercentage)[0];
  const bestState = bestPerformingAsm ? bestPerformingAsm.state : 'N/A';
  
  const totalOrders = filteredData.reduce((sum, a) => sum + a.orders, 0);
  const totalAllocatedTarget = filteredData.reduce((sum, a) => sum + a.allocatedTarget, 0);
  const totalAchievement = filteredData.reduce((sum, a) => sum + a.achievement, 0);
  const overallAchievementPct = totalAllocatedTarget > 0 ? (totalAchievement / totalAllocatedTarget) * 100 : 0;

  const handleExportExcel = () => {
    if (filteredData.length === 0) return;
    
    const exportData = filteredData.map(row => ({
      'State': row.state,
      'Assigned ASM': row.asmName,
      'Target (₹)': (row.allocatedTarget / 100000).toFixed(2) + ' L',
      'Achievement (₹)': (row.achievement / 100000).toFixed(2) + ' L',
      'Achievement %': row.achievementPercentage.toFixed(1) + '%',
      'Orders': row.orders,
      'Status': row.status
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Regional Performance");
    XLSX.writeFile(workbook, "Regional_Performance.xlsx");
    setIsExportOpen(false);
  };

  const handleExportPDF = () => {
    if (filteredData.length === 0) return;
    
    const doc = new jsPDF();
    
    doc.setFontSize(16);
    doc.text("Regional Performance Report", 14, 20);
    
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);
    
    const tableColumn = ["State", "Assigned ASM", "Target", "Achievement", "Achievement %", "Orders", "Status"];
    const tableRows = filteredData.map(row => [
      row.state,
      row.asmName,
      `Rs. ${(row.allocatedTarget / 100000).toFixed(2)} L`,
      `Rs. ${(row.achievement / 100000).toFixed(2)} L`,
      `${row.achievementPercentage.toFixed(1)}%`,
      row.orders,
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

    doc.save("Regional_Performance.pdf");
    setIsExportOpen(false);
  };

  const columns = [
    { key: 'state', label: 'State' },
    { key: 'asmName', label: 'Assigned ASM' },
    { 
      key: 'allocatedTarget', 
      label: 'Target',
      render: (row: any) => `₹${(row.allocatedTarget / 100000).toFixed(2)} L`
    },
    { 
      key: 'achievement', 
      label: 'Achievement',
      render: (row: any) => `₹${(row.achievement / 100000).toFixed(2)} L`
    },
    { 
      key: 'achievementPercentage', 
      label: 'Achievement %',
      render: (row: any) => (
        <span className={row.achievementPercentage >= 80 ? 'text-emerald-600 font-medium' : 'text-amber-600 font-medium'}>
          {row.achievementPercentage.toFixed(1)}%
        </span>
      )
    },
    { key: 'orders', label: 'Orders' },
    {
      key: 'status',
      label: 'Status',
      render: (row: any) => (
        <Badge variant={row.status === 'Exceeded' ? 'success' : row.status === 'On Track' ? 'neutral' : 'danger'}>
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
        title="Regional Performance" 
        subtitle="Monitor state-wise target achievements, orders, and ASM activity across your region."
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
          title="States Covered" 
          value={uniqueStates.length.toString()} 
          icon={<Map className="w-6 h-6" />} 
          colorClass="text-blue-600" 
          bgClass="bg-blue-50" 
        />
        <SummaryCard 
          title="Best Performing State" 
          value={bestState} 
          icon={<Trophy className="w-6 h-6" />} 
          colorClass="text-emerald-600" 
          bgClass="bg-emerald-50" 
        />
        <SummaryCard 
          title="Overall Achievement %" 
          value={`${overallAchievementPct.toFixed(1)}%`} 
          icon={<Target className="w-6 h-6" />} 
          colorClass="text-indigo-600" 
          bgClass="bg-indigo-50" 
        />
        <SummaryCard 
          title="Total Orders" 
          value={totalOrders.toString()} 
          icon={<ShoppingBag className="w-6 h-6" />} 
          colorClass="text-purple-600" 
          bgClass="bg-purple-50" 
        />
      </div>

      <FilterBar>
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <SelectFilter 
            value={stateFilter} 
            onChange={setStateFilter} 
            options={uniqueStates.map(s => ({ label: s, value: s }))} 
            placeholder="All States"
          />
          <div className="flex-1 max-w-md">
            <SearchInput value={search} onChange={setSearch} placeholder="Search state, ASM, or territory..." />
          </div>
        </div>
      </FilterBar>

      <TableCard>
        <DataTable columns={columns} data={filteredData} emptyMessage="No regional performance data found." />
      </TableCard>

      {/* View Drawer */}
      <Drawer
        open={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        title="State Performance Details"
      >
        {viewingRecord && (
          <div className="flex flex-col h-full">
            <div className="space-y-1">
              <DrawerField label="State" value={viewingRecord.state} />
              <DrawerField label="Assigned ASM" value={viewingRecord.asmName} />
              <DrawerField label="Assigned Target" value={`₹${(viewingRecord.allocatedTarget / 100000).toFixed(2)} L`} />
              <DrawerField label="Achievement" value={`₹${(viewingRecord.achievement / 100000).toFixed(2)} L`} />
              <DrawerField label="Achievement %" value={
                <span className={viewingRecord.achievementPercentage >= 80 ? 'text-emerald-600' : 'text-amber-600'}>
                  {viewingRecord.achievementPercentage.toFixed(1)}%
                </span>
              } />
              <DrawerField label="Doctor Visits" value={viewingRecord.doctorVisits} />
              <DrawerField label="Chemist Visits" value={viewingRecord.chemistVisits} />
              <DrawerField label="Orders Booked" value={viewingRecord.orders} />
              <DrawerField label="Attendance %" value={`${viewingRecord.attendance}%`} />
              <DrawerField label="Top Performing Territory" value={viewingRecord.territory} />
              
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
