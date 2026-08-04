import React, { useState, useEffect } from 'react';
import { PageHeader, FilterBar, SearchInput, SelectFilter, SummaryCard, TableCard, DataTable, Badge, ActionButton } from './components/shared';
import { Target, Activity, Users, FileText, CheckCircle, TrendingUp, Play, Eye, Download, ChevronDown, Table as TableIcon } from 'lucide-react';
import { Drawer } from '../../components/ui/Drawer';
import { asmService } from '../../services/asmService';
import { DrawerField } from './components/shared';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function TargetAchievement() {
  const [teamPerformance, setTeamPerformance] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [fyFilter, setFyFilter] = useState('All Financial Years');
  const [statusFilter, setStatusFilter] = useState('All');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState<any | null>(null);
  const [isExportOpen, setIsExportOpen] = useState(false);

  useEffect(() => {
    try {
      const data = asmService.getTeamPerformance();
      // add orders & status mock data
      setTeamPerformance(data.map(d => ({
        ...d, 
        orders: Math.floor(Math.random() * 50) + 10,
        status: d.achievementPercentage >= 100 ? 'Achieved' : (d.achievementPercentage >= 80 ? 'On Track' : 'Needs Attention')
      })));
    } catch (e) {
      console.warn("Failed to load target data", e);
    }
  }, []);

  const filteredData = teamPerformance.filter(row => {
    const matchesSearch = row.mrName.toLowerCase().includes(search.toLowerCase()) || 
                          row.territory?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || row.status === statusFilter;
    const matchesFy = fyFilter === 'All Financial Years' || true;
    return matchesSearch && matchesStatus && matchesFy;
  });

  const totalAssigned = filteredData.reduce((acc, row) => acc + (row.allocatedTarget || 0), 0);
  const totalAchieved = filteredData.reduce((acc, row) => acc + (row.achievement || 0), 0);
  const overallAchievement = totalAssigned > 0 ? ((totalAchieved / totalAssigned) * 100).toFixed(1) : 0;
  const topPerformer = [...filteredData].sort((a, b) => b.achievementPercentage - a.achievementPercentage)[0]?.mrName || 'N/A';
  const totalOrders = filteredData.reduce((acc, row) => acc + (row.orders || 0), 0);

  const handleView = (row: any) => {
    setSelectedEmp(row);
    setDrawerOpen(true);
  };

  const handleExportExcel = () => {
    if (filteredData.length === 0) return;
    
    const exportData = filteredData.map(row => ({
      'MR Name': row.mrName,
      'Territory': row.territory || '-',
      'Assigned Target (₹)': (row.allocatedTarget / 100000).toFixed(2) + ' L',
      'Achieved (₹)': (row.achievement / 100000).toFixed(2) + ' L',
      'Achievement %': row.achievementPercentage + '%',
      'Total Orders': row.orders,
      'Status': row.status
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Target Achievement");
    XLSX.writeFile(workbook, "Target_Achievement.xlsx");
    setIsExportOpen(false);
  };

  const handleExportPDF = () => {
    if (filteredData.length === 0) return;
    
    const doc = new jsPDF('landscape');
    
    doc.setFontSize(16);
    doc.text("Target Achievement Report", 14, 20);
    
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);
    
    const tableColumn = ["MR Name", "Territory", "Assigned Target", "Achieved", "Achievement %", "Total Orders", "Status"];
    const tableRows = filteredData.map(row => [
      row.mrName,
      row.territory || '-',
      `Rs. ${(row.allocatedTarget / 100000).toFixed(2)} L`,
      `Rs. ${(row.achievement / 100000).toFixed(2)} L`,
      `${row.achievementPercentage}%`,
      row.orders,
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

    doc.save("Target_Achievement.pdf");
    setIsExportOpen(false);
  };

  const columns = [
    { key: 'mrName', label: 'MR Name', render: (row: any) => <span className="font-semibold text-slate-800">{row.mrName}</span> },
    { key: 'territory', label: 'Territory', render: (row: any) => row.territory || '-' },
    { key: 'allocatedTarget', label: 'Assigned Target', render: (row: any) => `₹${(row.allocatedTarget / 100000).toFixed(2)} L` },
    { key: 'achievement', label: 'Achieved', render: (row: any) => `₹${(row.achievement / 100000).toFixed(2)} L` },
    { 
      key: 'achievementPercentage', 
      label: 'Achievement %', 
      render: (row: any) => (
        <span className={row.achievementPercentage >= 100 ? 'text-emerald-600 font-bold' : row.achievementPercentage >= 80 ? 'text-amber-600 font-bold' : 'text-rose-600 font-bold'}>
          {row.achievementPercentage}%
        </span>
      )
    },
    { key: 'orders', label: 'Total Orders' },
    { 
      key: 'status', 
      label: 'Status', 
      render: (row: any) => {
        let variant: "success" | "warning" | "error" = "warning";
        if (row.status === 'Achieved') variant = 'success';
        if (row.status === 'Needs Attention') variant = 'error';
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
        title="Target Achievement" 
        subtitle="Monitor sales targets, achievements, and performance of Medical Representatives."
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
          title="Active MRs" 
          value={filteredData.length} 
          icon={<Users className="w-6 h-6" />} 
          colorClass="text-indigo-600" 
          bgClass="bg-indigo-50" 
        />
        <SummaryCard 
          title="Overall Achievement %" 
          value={`${overallAchievement}%`} 
          icon={<Target className="w-6 h-6" />} 
          colorClass="text-emerald-600" 
          bgClass="bg-emerald-50" 
        />
        <SummaryCard 
          title="Total Orders" 
          value={totalOrders} 
          icon={<Activity className="w-6 h-6" />} 
          colorClass="text-blue-600" 
          bgClass="bg-blue-50" 
        />
        <SummaryCard 
          title="Top Performer" 
          value={topPerformer} 
          icon={<TrendingUp className="w-6 h-6" />} 
          colorClass="text-violet-600" 
          bgClass="bg-violet-50" 
        />
      </div>

      <FilterBar>
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by MR Name, Territory..." />
          <SelectFilter
            value={fyFilter}
            onChange={setFyFilter}
            options={[
              { label: 'All Financial Years', value: 'All Financial Years' },
              { label: 'FY 2026-27', value: 'FY 2026-27' },
              { label: 'FY 2025-26', value: 'FY 2025-26' },
              { label: 'FY 2024-25', value: 'FY 2024-25' }
            ]}
          />
          <SelectFilter
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { label: 'All', value: 'All' },
              { label: 'On Track', value: 'On Track' },
              { label: 'Needs Attention', value: 'Needs Attention' },
              { label: 'Achieved', value: 'Achieved' },
              { label: 'Exceeded', value: 'Exceeded' }
            ]}
          />
        </div>
      </FilterBar>

      <TableCard>
        <DataTable columns={columns} data={filteredData} emptyMessage="No target data found." />
      </TableCard>

      {/* Review Drawer */}
      <Drawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Target Achievement Details"
      >
        {selectedEmp && (
          <div className="flex flex-col h-full pb-8">
            <div className="space-y-1">
              
              <div className="py-3 border-t border-slate-100 first:border-0">
                <p className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">1. MR Information</p>
                <div className="space-y-1">
                  <DrawerField label="MR Code" value={selectedEmp.mrCode || `EMP-${selectedEmp.id}`} />
                  <DrawerField label="MR Name" value={selectedEmp.mrName} />
                  <DrawerField label="Territory" value={selectedEmp.territory || '-'} />
                  <DrawerField label="Headquarters" value={selectedEmp.headquarters || '-'} />
                  <DrawerField label="Reporting ASM" value="Current ASM User" />
                  <DrawerField label="Status" value={
                    <Badge variant={selectedEmp.status === 'Achieved' || selectedEmp.status === 'Exceeded' ? 'success' : selectedEmp.status === 'On Track' ? 'warning' : 'error'}>
                      {selectedEmp.status}
                    </Badge>
                  } />
                </div>
              </div>

              <div className="py-3 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">2. Target Summary</p>
                <div className="space-y-1">
                  <DrawerField label="Financial Year" value={fyFilter !== 'All Financial Years' ? fyFilter : 'FY 2024-25'} />
                  <DrawerField label="Assigned Target" value={`₹ ${(selectedEmp.allocatedTarget || 0).toLocaleString()}`} />
                  <DrawerField label="Achieved Target" value={`₹ ${(selectedEmp.achievement || 0).toLocaleString()}`} />
                  <DrawerField label="Remaining Target" value={`₹ ${Math.max(0, (selectedEmp.allocatedTarget || 0) - (selectedEmp.achievement || 0)).toLocaleString()}`} />
                  <DrawerField label="Achievement %" value={`${selectedEmp.achievementPercentage || 0}%`} />
                  <DrawerField label="Total Orders" value={selectedEmp.orders || 0} />
                </div>
              </div>

              <div className="py-3 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">3. Monthly Target Progress</p>
                <div className="mt-2 border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                      <tr>
                        <th className="px-3 py-2">Month</th>
                        <th className="px-3 py-2 text-right">Assigned Target</th>
                        <th className="px-3 py-2 text-right">Achieved</th>
                        <th className="px-3 py-2 text-right">Achievement %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      <tr>
                        <td className="px-3 py-2">April</td>
                        <td className="px-3 py-2 text-right">₹ 2,00,000</td>
                        <td className="px-3 py-2 text-right">₹ 2,10,000</td>
                        <td className="px-3 py-2 text-right text-emerald-600 font-medium">105%</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2">May</td>
                        <td className="px-3 py-2 text-right">₹ 2,00,000</td>
                        <td className="px-3 py-2 text-right">₹ 1,80,000</td>
                        <td className="px-3 py-2 text-right text-amber-600 font-medium">90%</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2">June</td>
                        <td className="px-3 py-2 text-right">₹ 2,20,000</td>
                        <td className="px-3 py-2 text-right">₹ 1,50,000</td>
                        <td className="px-3 py-2 text-right text-rose-600 font-medium">68%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="py-3 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">4. Performance Status</p>
                <div className="space-y-1">
                  <DrawerField label="Current Status" value={selectedEmp.status} />
                  <DrawerField label="Last Order Date" value="12 Aug 2026" />
                  <DrawerField label="Last Activity Date" value="14 Aug 2026" />
                </div>
              </div>

            </div>
            
            <div className="mt-auto pt-6 border-t border-slate-100">
              <button
                onClick={() => setDrawerOpen(false)}
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
