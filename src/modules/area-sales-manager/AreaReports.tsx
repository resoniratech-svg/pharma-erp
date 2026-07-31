import React, { useState } from 'react';
import { PageHeader, FilterBar, SearchInput, TableCard, DataTable, ActionButton } from './components/shared';
import { FileText, Download, FileSpreadsheet } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';

import { asmService } from '../../services/asmService';
import { exportToCSV, exportToExcel, exportToPDF } from '../../utils/exportUtils';

const MOCK_REPORTS = [
  { id: 'RPT-001', name: 'Area Performance Report', description: 'Comprehensive overview of overall area sales and growth metrics.' },
  { id: 'RPT-002', name: 'Medical Representative Performance Report', description: 'Detailed individual performance metrics, coverage, and target achievements.' },
  { id: 'RPT-003', name: 'Target Achievement Report', description: 'Analysis of assigned vs achieved targets across all territories.' },
  { id: 'RPT-004', name: 'Revenue Summary', description: 'Product-wise revenue contribution and financial breakdowns.' },
];

export default function AreaReports() {
  const [search, setSearch] = useState('');
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);

  const filteredReports = MOCK_REPORTS.filter(row => 
    row.name.toLowerCase().includes(search.toLowerCase()) || 
    row.description.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenGenerate = (row: any) => {
    setSelectedReport(row);
    setGenerateModalOpen(true);
  };

  const handleGenerate = (format: string) => {
    if (!selectedReport) return;
    
    let exportData: any[] = [];
    let columns: any[] = [];

    try {
      if (selectedReport.id === 'RPT-001' || selectedReport.id === 'RPT-003') {
        const summaries = asmService.getTargetSummaries();
        exportData = summaries.map(s => ({
          allocationId: s.parentAllocation.id,
          targetType: s.parentAllocation.targetType,
          financialYear: s.parentAllocation.financialYear,
          allocatedAmount: s.allocatedAmount,
          remainingAmount: s.remainingAmount
        }));
        columns = [
          { key: 'allocationId', label: 'Allocation ID' },
          { key: 'targetType', label: 'Type' },
          { key: 'financialYear', label: 'Financial Year' },
          { key: 'allocatedAmount', label: 'Allocated' },
          { key: 'remainingAmount', label: 'Remaining' },
        ];
      } else if (selectedReport.id === 'RPT-002') {
        exportData = asmService.getTeamPerformance();
        columns = [
          { key: 'mrId', label: 'Employee Code' },
          { key: 'mrName', label: 'MR Name' },
          { key: 'totalAllocated', label: 'Total Allocated' },
          { key: 'totalAchievement', label: 'Total Achievement' },
          { key: 'achievementPercentage', label: 'Achievement %' }
        ];
      } else {
        exportData = [{ product: 'All Products', revenue: 0 }];
        columns = [
          { key: 'product', label: 'Product' },
          { key: 'revenue', label: 'Revenue' }
        ];
      }

      const filename = `${selectedReport.name.replace(/\s+/g, '_')}_2026-07-30`;
      
      if (format === 'PDF') {
        exportToPDF(exportData, columns, `${filename}.pdf`, selectedReport.name);
      } else if (format === 'Excel') {
        exportToExcel(exportData, columns, `${filename}.xlsx`);
      } else {
        exportToCSV(exportData, columns, `${filename}.csv`);
      }
    } catch (e) {
      console.error("Failed to generate report:", e);
      alert("Failed to generate report.");
    }
    
    setGenerateModalOpen(false);
  };

  const columns = [
    { 
      key: 'name', 
      label: 'Report Name', 
      render: (row: any) => (
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
          <span className="font-bold text-slate-800">{row.name}</span>
        </div>
      ) 
    },
    { 
      key: 'description', 
      label: 'Description', 
      render: (row: any) => <span className="text-slate-500">{row.description}</span> 
    },
    {
      key: 'actions',
      label: 'Actions',
      width: '120px',
      render: (row: any) => (
        <ActionButton 
          variant="secondary" 
          onClick={() => handleOpenGenerate(row)}
          className="!py-1.5 !px-3 !text-sm"
        >
          Generate
        </ActionButton>
      )
    }
  ];

  return (
    <div className="p-6">
      <PageHeader 
        title="Area Reports" 
        subtitle="Generate and download analytical reports for your area."
      />

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search reports..." />
      </FilterBar>

      <TableCard>
        <DataTable columns={columns} data={filteredReports} />
      </TableCard>

      <Modal
        isOpen={generateModalOpen}
        onClose={() => setGenerateModalOpen(false)}
        title="Generate Report"
        footer={<ActionButton variant="secondary" onClick={() => setGenerateModalOpen(false)}>Cancel</ActionButton>}
      >
        {selectedReport && (
          <div className="space-y-6">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <h3 className="font-bold text-slate-800">{selectedReport.name}</h3>
              <p className="text-sm text-slate-500 mt-1">{selectedReport.description}</p>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Select Date Range</label>
              <div className="grid grid-cols-2 gap-4">
                <input type="date" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                <input type="date" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">Select Export Format</label>
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => handleGenerate('PDF')}
                  className="flex flex-col items-center justify-center p-4 border border-slate-200 rounded-xl hover:border-rose-500 hover:bg-rose-50 transition-all group"
                >
                  <Download className="w-8 h-8 text-rose-500 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="font-bold text-slate-700">Download PDF</span>
                  <span className="text-xs text-slate-500 mt-1">For sharing & printing</span>
                </button>
                <button 
                  onClick={() => handleGenerate('Excel')}
                  className="flex flex-col items-center justify-center p-4 border border-slate-200 rounded-xl hover:border-emerald-500 hover:bg-emerald-50 transition-all group"
                >
                  <FileSpreadsheet className="w-8 h-8 text-emerald-500 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="font-bold text-slate-700">Download Excel</span>
                  <span className="text-xs text-slate-500 mt-1">For deep analysis</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
