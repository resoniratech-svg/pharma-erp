import React, { useState } from 'react';
import { PageHeader, TableCard, DataTable, ActionButton } from './components/shared';
import { Download, FileText, FileSpreadsheet, Loader2 } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { rsmService } from '../../services/rsmService';
import { exportToCSV, exportToExcel, exportToPDF } from '../../utils/exportUtils';

const REGIONAL_REPORTS = [
  { id: 'RPT-REG-01', name: 'Regional Performance Report', description: 'Comprehensive summary of regional sales, target achievement, and growth.' },
  { id: 'RPT-REG-02', name: 'Area Performance Report', description: 'Detailed breakdown of sales and targets by area within the region.' },
  { id: 'RPT-REG-03', name: 'Target Achievement Report', description: 'Comparison of assigned targets vs actual achievements across areas.' },
  { id: 'RPT-REG-04', name: 'Revenue Summary', description: 'High-level revenue contribution analysis by product and area.' },
];

export default function RegionalReports() {
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [format, setFormat] = useState('pdf');
  const [generating, setGenerating] = useState(false);

  const handleOpenGenerate = (report: any) => {
    setSelectedReport(report);
    setFormat('pdf');
    setGenerateModalOpen(true);
  };

  const handleGenerate = async () => {
    if (!selectedReport) return;
    
    let exportData: any[] = [];
    let columns: any[] = [];

    try {
      setGenerating(true);
      if (selectedReport.id === 'RPT-REG-01' || selectedReport.id === 'RPT-REG-03') {
        const summaries = await rsmService.getTargetSummaries();
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
      } else if (selectedReport.id === 'RPT-REG-02') {
        exportData = await rsmService.getTeamPerformance();
        columns = [
          { key: 'asmId', label: 'Employee Code' },
          { key: 'asmName', label: 'ASM Name' },
          { key: 'allocatedTarget', label: 'Total Allocated' },
          { key: 'achievement', label: 'Total Achievement' },
          { key: 'achievementPercentage', label: 'Achievement %' }
        ];
      } else {
        exportData = [{ product: 'All Products', revenue: 0 }];
        columns = [
          { key: 'product', label: 'Product' },
          { key: 'revenue', label: 'Revenue' }
        ];
      }

      const filename = `${selectedReport.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}`;
      
      if (format === 'pdf') {
        exportToPDF(exportData, columns, `${filename}.pdf`, selectedReport.name);
      } else if (format === 'excel') {
        exportToExcel(exportData, columns, `${filename}.xlsx`);
      } else {
        exportToCSV(exportData, columns, `${filename}.csv`);
      }
      setGenerateModalOpen(false);
    } catch (e) {
      console.error("Failed to generate report:", e);
      alert("Failed to generate report.");
    } finally {
      setGenerating(false);
    }
  };

  const columns = [
    { key: 'name', label: 'Report Name', render: (row: any) => <span className="font-semibold text-slate-800">{row.name}</span> },
    { key: 'description', label: 'Description', render: (row: any) => <span className="text-slate-500">{row.description}</span> },
    {
      key: 'actions',
      label: 'Action',
      render: (row: any) => (
        <ActionButton variant="secondary" onClick={() => handleOpenGenerate(row)} icon={<Download className="w-4 h-4" />}>
          Generate
        </ActionButton>
      )
    }
  ];

  return (
    <div className="p-6">
      <PageHeader 
        title="Regional Reports" 
        subtitle="Generate production-level reports for your assigned region (Database Integrated)."
      />

      <TableCard>
        <DataTable columns={columns} data={REGIONAL_REPORTS} />
      </TableCard>

      {/* Generate Report Modal */}
      <Modal
        isOpen={generateModalOpen}
        onClose={() => setGenerateModalOpen(false)}
        title="Generate Report"
        footer={
          <div className="flex justify-end gap-3 w-full">
            <ActionButton variant="secondary" onClick={() => setGenerateModalOpen(false)}>Cancel</ActionButton>
            <ActionButton variant="primary" onClick={handleGenerate} disabled={generating}>
              {generating ? 'Generating...' : 'Confirm & Download'}
            </ActionButton>
          </div>
        }
      >
        {selectedReport && (
          <div className="space-y-6">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">{selectedReport.name}</h3>
              <p className="text-sm text-slate-500 mt-1">{selectedReport.description}</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">Select Export Format</label>
              <div className="grid grid-cols-2 gap-4">
                <label className={`relative flex flex-col items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${format === 'pdf' ? 'border-rose-500 bg-rose-50/50' : 'border-slate-200 hover:border-slate-300'}`}>
                  <input type="radio" name="format" value="pdf" checked={format === 'pdf'} onChange={(e) => setFormat(e.target.value)} className="sr-only" />
                  <FileText className={`w-8 h-8 mb-2 ${format === 'pdf' ? 'text-rose-600' : 'text-slate-400'}`} />
                  <span className={`font-semibold ${format === 'pdf' ? 'text-rose-700' : 'text-slate-600'}`}>PDF Document</span>
                  {format === 'pdf' && (
                    <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-rose-500" />
                  )}
                </label>

                <label className={`relative flex flex-col items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${format === 'excel' ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-200 hover:border-slate-300'}`}>
                  <input type="radio" name="format" value="excel" checked={format === 'excel'} onChange={(e) => setFormat(e.target.value)} className="sr-only" />
                  <FileSpreadsheet className={`w-8 h-8 mb-2 ${format === 'excel' ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <span className={`font-semibold ${format === 'excel' ? 'text-emerald-700' : 'text-slate-600'}`}>Excel Spreadsheet</span>
                  {format === 'excel' && (
                    <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-emerald-500" />
                  )}
                </label>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
