import React, { useState, useEffect } from 'react';
import { PageHeader, FilterBar, SearchInput, SelectFilter, SummaryCard, TableCard, DataTable, Badge, ActionButton } from './components/shared';
import { FileText, CheckCircle, Clock, XCircle, Play, Eye, Download, ChevronDown, Table as TableIcon } from 'lucide-react';
import { Drawer } from '../../components/ui/Drawer';
import { DrawerField } from './components/shared';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { asmService } from '../../services/asmService';

export default function TourPlanning() {
  const [plans, setPlans] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [periodFilter, setPeriodFilter] = useState('Current Month');
  const [statusFilter, setStatusFilter] = useState('All');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any | null>(null);
  const [isExportOpen, setIsExportOpen] = useState(false);

  useEffect(() => {
    // Realistic production mock data for Tour Planning
    const mockData = [
      { id: '001', mrName: 'Deepak Tyagi', territory: 'South Mumbai', headquarters: 'Mumbai', planDate: 'August 2026', plannedVisits: 45, status: 'Approved', submittedDate: '28 Jul 2026' },
      { id: '002', mrName: 'Rohit Saxena', territory: 'Navi Mumbai', headquarters: 'Mumbai', planDate: 'August 2026', plannedVisits: 38, status: 'Pending', submittedDate: '01 Aug 2026' },
      { id: '003', mrName: 'Vikram Singh', territory: 'Thane', headquarters: 'Thane', planDate: 'August 2026', plannedVisits: 52, status: 'Approved', submittedDate: '29 Jul 2026' },
      { id: '004', mrName: 'Sneha Patel', territory: 'Andheri', headquarters: 'Mumbai', planDate: 'August 2026', plannedVisits: 40, status: 'Pending', submittedDate: '02 Aug 2026' },
      { id: '005', mrName: 'Amit Kumar', territory: 'Pune East', headquarters: 'Pune', planDate: 'August 2026', plannedVisits: 30, status: 'Rejected', submittedDate: '25 Jul 2026' },
      { id: '006', mrName: 'Rahul Verma', territory: 'Pune West', headquarters: 'Pune', planDate: 'August 2026', plannedVisits: 48, status: 'Approved', submittedDate: '30 Jul 2026' },
      { id: '007', mrName: 'Neha Sharma', territory: 'Nashik Central', headquarters: 'Nashik', planDate: 'August 2026', plannedVisits: 35, status: 'Pending', submittedDate: '03 Aug 2026' },
      { id: '008', mrName: 'Priya Desai', territory: 'Nagpur North', headquarters: 'Nagpur', planDate: 'August 2026', plannedVisits: 42, status: 'Approved', submittedDate: '27 Jul 2026' }
    ];
    setPlans(mockData);
  }, []);

  const filteredData = plans.filter(row => {
    const matchesSearch = row.mrName.toLowerCase().includes(search.toLowerCase()) || 
                          row.territory?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || row.status === statusFilter;
    const matchesPeriod = periodFilter === 'Current Month' || true; // mock pass-through
    return matchesSearch && matchesStatus && matchesPeriod;
  });

  const pendingCount = filteredData.filter(d => d.status.includes('Pending')).length;
  const approvedCount = filteredData.filter(d => d.status === 'Approved').length;
  const rejectedCount = filteredData.filter(d => d.status === 'Rejected').length;
  const total = filteredData.length;
  const compliance = total > 0 ? Math.round(((approvedCount + pendingCount) / total) * 100) : 0;

  const handleView = (row: any) => {
    setSelectedPlan(row);
    setDrawerOpen(true);
  };

  const handleExportExcel = () => {
    if (filteredData.length === 0) return;
    
    const exportData = filteredData.map(row => ({
      'Tour Date': row.planDate,
      'MR Name': row.mrName,
      'Territory': row.territory,
      'Planned Visits': row.plannedVisits,
      'Status': row.status
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Tour Plans");
    XLSX.writeFile(workbook, "Tour_Plans.xlsx");
    setIsExportOpen(false);
  };

  const handleExportPDF = () => {
    if (filteredData.length === 0) return;
    
    const doc = new jsPDF('landscape');
    
    doc.setFontSize(16);
    doc.text("Tour Planning Report", 14, 20);
    
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);
    
    const tableColumn = ["Tour Date", "MR Name", "Territory", "Planned Visits", "Status"];
    const tableRows = filteredData.map(row => [
      row.planDate,
      row.mrName,
      row.territory,
      row.plannedVisits,
      row.status
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 35,
      theme: 'grid',
      styles: { fontSize: 10 },
      headStyles: { fillColor: [22, 60, 120] } // #163c78
    });

    doc.save("Tour_Plans.pdf");
    setIsExportOpen(false);
  };

  const columns = [
    { key: 'planDate', label: 'Tour Date', render: (row: any) => <span className="text-slate-600">{row.planDate}</span> },
    { key: 'mrName', label: 'MR Name', render: (row: any) => <span className="font-semibold text-slate-800">{row.mrName}</span> },
    { key: 'territory', label: 'Territory' },
    { key: 'plannedVisits', label: 'Planned Visits' },
    { 
      key: 'status', 
      label: 'Status', 
      render: (row: any) => {
        let variant: "success" | "warning" | "error" = "warning";
        if (row.status === 'Approved') variant = 'success';
        if (row.status === 'Rejected') variant = 'error';
        return <Badge variant={variant}>{row.status}</Badge>;
      } 
    },
    {
      key: 'actions',
      label: 'Action',
      render: (row: any) => (
        <button onClick={() => handleView(row)} className="p-1.5 text-slate-400 hover:text-[#163c78] hover:bg-blue-50 rounded transition-colors" title="View Details">
          <Eye className="w-4 h-4" />
        </button>
      )
    }
  ];

  return (
    <div className="p-6">
      <PageHeader 
        title="Tour Planning (MTP)" 
        subtitle="Review, approve, and track Monthly Tour Plans submitted by Medical Representatives."
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <SummaryCard 
          title="Pending Tours" 
          value={pendingCount} 
          icon={<Clock className="w-6 h-6" />} 
          colorClass="text-amber-600" 
          bgClass="bg-amber-50" 
        />
        <SummaryCard 
          title="Approved Tours" 
          value={approvedCount} 
          icon={<CheckCircle className="w-6 h-6" />} 
          colorClass="text-emerald-600" 
          bgClass="bg-emerald-50" 
        />
        <SummaryCard 
          title="Rejected Tours" 
          value={rejectedCount} 
          icon={<XCircle className="w-6 h-6" />} 
          colorClass="text-rose-600" 
          bgClass="bg-rose-50" 
        />
        <SummaryCard 
          title="Compliance %" 
          value={`${compliance}%`} 
          icon={<FileText className="w-6 h-6" />} 
          colorClass="text-blue-600" 
          bgClass="bg-blue-50" 
        />
      </div>

      <FilterBar>
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by MR Name, Territory..." />
          <SelectFilter
            value={periodFilter}
            onChange={setPeriodFilter}
            options={[
              { label: 'Current Month', value: 'Current Month' },
              { label: 'Next Month', value: 'Next Month' },
              { label: 'Previous Month', value: 'Previous Month' },
              { label: 'This Quarter', value: 'This Quarter' }
            ]}
          />
          <SelectFilter
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { label: 'All', value: 'All' },
              { label: 'Pending', value: 'Pending' },
              { label: 'Approved', value: 'Approved' },
              { label: 'Rejected', value: 'Rejected' }
            ]}
          />
        </div>
      </FilterBar>

      <TableCard>
        <DataTable columns={columns} data={filteredData} emptyMessage="No tour plans found." />
      </TableCard>

      {/* Review Drawer */}
      <Drawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Tour Plan Review"
      >
        {selectedPlan && (
          <div className="flex flex-col h-full pb-8">
            <div className="space-y-1">
              
              <div className="py-3 border-t border-slate-100 first:border-0">
                <p className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">1. MR Information</p>
                <div className="space-y-1">
                  <DrawerField label="MR Code" value={`EMP-${selectedPlan.id?.padStart(3, '0') || '001'}`} />
                  <DrawerField label="MR Name" value={selectedPlan.mrName} />
                  <DrawerField label="Headquarters" value="Mumbai" />
                  <DrawerField label="Territory" value={selectedPlan.territory || '-'} />
                </div>
              </div>

              <div className="py-3 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">2. Tour Information</p>
                <div className="space-y-1">
                  <DrawerField label="Tour Month" value={periodFilter !== 'Current Month' ? periodFilter : 'August 2026'} />
                  <DrawerField label="Tour Date" value={selectedPlan.planDate} />
                  <DrawerField label="Tour Type" value="Field Work" />
                  <DrawerField label="Planned Area" value={`${selectedPlan.territory} Zone`} />
                  <DrawerField label="Planned Route" value="Route A, Route B" />
                </div>
              </div>

              <div className="py-3 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">3. Planned Visits</p>
                <div className="mt-2 border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                      <tr>
                        <th className="px-3 py-2">Type</th>
                        <th className="px-3 py-2">Name</th>
                        <th className="px-3 py-2">Location</th>
                        <th className="px-3 py-2">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      <tr>
                        <td className="px-3 py-2"><Badge variant="neutral">Doctor</Badge></td>
                        <td className="px-3 py-2">Dr. A. Sharma</td>
                        <td className="px-3 py-2">Clinic 1</td>
                        <td className="px-3 py-2 text-slate-500">10:00 AM</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2"><Badge variant="neutral">Doctor</Badge></td>
                        <td className="px-3 py-2">Dr. V. Patel</td>
                        <td className="px-3 py-2">Hospital</td>
                        <td className="px-3 py-2 text-slate-500">11:30 AM</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2"><Badge variant="neutral">Chemist</Badge></td>
                        <td className="px-3 py-2">Apollo Pharmacy</td>
                        <td className="px-3 py-2">Main Road</td>
                        <td className="px-3 py-2 text-slate-500">12:15 PM</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="py-3 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">4. Approval Information</p>
                <div className="space-y-1">
                  <DrawerField label="Submitted Date" value="28 Jul 2026" />
                  <DrawerField label="Approval Status" value={
                    <Badge variant={selectedPlan.status === 'Approved' ? 'success' : selectedPlan.status === 'Rejected' ? 'error' : 'warning'}>
                      {selectedPlan.status}
                    </Badge>
                  } />
                  <DrawerField label="Approved By" value="Current ASM User" />
                  <DrawerField label="Approval Date" value="30 Jul 2026" />
                </div>
              </div>
              
              <div className="py-3 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">5. Remarks</p>
                <div className="space-y-1">
                  <DrawerField label="MR Remarks" value="Focus on Cardio new products this month." />
                  <DrawerField label="ASM Remarks" value="Approved, ensure maximum coverage." />
                </div>
              </div>

            </div>
            
            <div className="mt-auto pt-6 border-t border-slate-100">
              <button
                onClick={() => setDrawerOpen(false)}
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors"
              >
                Close Plan Details
              </button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
