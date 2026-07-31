import React, { useState } from 'react';
import { PageHeader, TableCard, DataTable, ActionButton } from './components/shared';
import { Download, FileText } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { nsmService } from '../../services/nsmService';
import { exportToCSV, exportToExcel, exportToPDF } from '../../utils/exportUtils';

const REPORTS = [
  { id: 'REP-001', name: 'National Sales Report', description: 'Comprehensive overview of national sales vs targets.' },
  { id: 'REP-002', name: 'Zone Performance Report', description: 'Detailed zone-by-zone performance and growth metrics.' },
  { id: 'REP-003', name: 'Target Achievement Report', description: 'Allocation and achievement status across all ZSMs.' },
  { id: 'REP-004', name: 'Revenue Summary', description: 'Consolidated revenue across all product categories.' },
];

export default function NationalSalesReports() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [format, setFormat] = useState('PDF');

  const handleGenerate = (row: any) => {
    setSelectedReport(row);
    setFormat('PDF');
    setModalOpen(true);
  };

  const handleDownload = () => {
    if (!selectedReport) return;
    
    let exportData: any[] = [];
    let columns: any[] = [];

    try {
      if (selectedReport.id === 'REP-001') {
        // National Sales Report
        const summaries = nsmService.getTargetSummaries();
        exportData = summaries.map(s => ({
          targetId: s.target.id,
          targetType: s.target.targetType,
          financialYear: s.target.financialYear,
          totalTarget: s.target.targetAmount,
          allocatedAmount: s.allocatedAmount,
          remainingAmount: s.remainingAmount
        }));
        columns = [
          { key: 'targetId', label: 'Target ID' },
          { key: 'targetType', label: 'Type' },
          { key: 'financialYear', label: 'Financial Year' },
          { key: 'totalTarget', label: 'Total Target' },
          { key: 'allocatedAmount', label: 'Allocated' },
          { key: 'remainingAmount', label: 'Remaining' },
        ];
      } else if (selectedReport.id === 'REP-002') {
        // Zone Performance Report
        exportData = nsmService.getTeamPerformance();
        columns = [
          { key: 'zsmId', label: 'Employee Code' },
          { key: 'zsmName', label: 'ZSM Name' },
          { key: 'totalAllocated', label: 'Total Allocated' },
          { key: 'totalAchievement', label: 'Total Achievement' },
          { key: 'achievementPercentage', label: 'Achievement %' }
        ];
      } else if (selectedReport.id === 'REP-003') {
        // Target Achievement Report
        exportData = nsmService.getTeamPerformance();
        columns = [
          { key: 'zsmId', label: 'ZSM Code' },
          { key: 'zsmName', label: 'ZSM Name' },
          { key: 'totalAllocated', label: 'Allocated Target' },
          { key: 'totalAchievement', label: 'Achieved Target' },
        ];
      } else if (selectedReport.id === 'REP-004') {
        // Revenue Summary (Mock empty since no transactions yet)
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

    setModalOpen(false);
  };

  const columns = [
    { 
      key: 'name', 
      label: 'Report Name',
      render: (row: any) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#163c78]/10 flex items-center justify-center flex-shrink-0">
            <FileText className="w-5 h-5 text-[#163c78]" />
          </div>
          <div>
            <p className="font-semibold text-slate-800">{row.name}</p>
            <p className="text-xs text-slate-500">{row.id}</p>
          </div>
        </div>
      )
    },
    { key: 'description', label: 'Description' },
    {
      key: 'actions',
      label: 'Actions',
      render: (row: any) => (
        <ActionButton variant="secondary" icon={<Download className="w-4 h-4" />} onClick={() => handleGenerate(row)}>
          Generate
        </ActionButton>
      )
    }
  ];

  return (
    <div className="p-6">
      <PageHeader 
        title="National Sales Reports" 
        subtitle="Access and export production-level sales reports."
      />

      <TableCard>
        <DataTable columns={columns} data={REPORTS} />
      </TableCard>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Select Report Format"
        footer={
          <div className="flex justify-end gap-3 w-full">
            <ActionButton variant="secondary" onClick={() => setModalOpen(false)}>Cancel</ActionButton>
            <ActionButton variant="primary" icon={<Download className="w-4 h-4" />} onClick={handleDownload}>Generate</ActionButton>
          </div>
        }
      >
        {selectedReport && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Generating: <span className="font-semibold text-slate-800">{selectedReport.name}</span>
            </p>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">Format</label>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="format" value="PDF" checked={format === 'PDF'} onChange={() => setFormat('PDF')} className="text-[#163c78] focus:ring-[#163c78] w-4 h-4" />
                  <span className="text-sm font-medium text-slate-700">PDF Document</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="format" value="Excel" checked={format === 'Excel'} onChange={() => setFormat('Excel')} className="text-[#163c78] focus:ring-[#163c78] w-4 h-4" />
                  <span className="text-sm font-medium text-slate-700">Excel Spreadsheet</span>
                </label>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
