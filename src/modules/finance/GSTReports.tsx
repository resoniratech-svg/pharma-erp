import React, { useState, useRef, useEffect } from 'react';
import { Download, Filter, Eye, ChevronDown, FileText, Printer, FileJson } from 'lucide-react';
import * as XLSX from 'xlsx';

import {
  PageHeader,
  ActionButton,
  SummaryCard,
  FilterBar,
  SearchInput,
  SelectFilter,
  TableCard,
  DataTable,
  Badge,
  Drawer,
} from './components/shared';
import { type Column, type BadgeVariant } from './components/shared';
import { generateGstReportPdf } from '../../documents/generators/pdfGenerator';
import { generateGstReportPrint } from '../../documents/generators/printGenerator';

// --- Types ---
interface GSTReportItem {
  id: string;
  returnType: 'GSTR-1' | 'GSTR-2B' | 'GSTR-3B';
  taxPeriod: string;
  financialYear: string;
  taxableValue: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalGst: number;
  dueDate: string;
  filingDate: string | null;
  status: 'Draft' | 'Ready for Filing' | 'Filed' | 'Filed with Errors' | 'Overdue';
  
  // Extra for Drawer
  invoiceCount?: number;
  creditNotes?: number;
  debitNotes?: number;
  inputTaxCredit?: number;
  taxPaid?: number;
  balancePayable?: number;
}

// --- Mock Data ---
const gstData: GSTReportItem[] = [
  {
    id: '1',
    returnType: 'GSTR-1',
    taxPeriod: 'Jul 2026',
    financialYear: '2026-27',
    taxableValue: 3540000,
    cgst: 180000,
    sgst: 180000,
    igst: 65000,
    totalGst: 425000,
    dueDate: '11-Aug-2026',
    filingDate: '05-Aug-2026',
    status: 'Filed',
    invoiceCount: 142,
    creditNotes: 3,
    debitNotes: 0,
  },
  {
    id: '2',
    returnType: 'GSTR-2B',
    taxPeriod: 'Jul 2026',
    financialYear: '2026-27',
    taxableValue: 2580000,
    cgst: 125000,
    sgst: 125000,
    igst: 60000,
    totalGst: 310000,
    dueDate: '14-Aug-2026',
    filingDate: '14-Aug-2026',
    status: 'Filed',
  },
  {
    id: '3',
    returnType: 'GSTR-3B',
    taxPeriod: 'Jul 2026',
    financialYear: '2026-27',
    taxableValue: 3540000,
    cgst: 55000,
    sgst: 55000,
    igst: 5000,
    totalGst: 115000,
    dueDate: '20-Aug-2026',
    filingDate: null,
    status: 'Draft',
    inputTaxCredit: 310000,
    taxPaid: 0,
    balancePayable: 115000,
  },
  {
    id: '4',
    returnType: 'GSTR-1',
    taxPeriod: 'Jun 2026',
    financialYear: '2026-27',
    taxableValue: 3120000,
    cgst: 156000,
    sgst: 156000,
    igst: 70000,
    totalGst: 382000,
    dueDate: '11-Jul-2026',
    filingDate: null,
    status: 'Overdue',
    invoiceCount: 110,
    creditNotes: 1,
    debitNotes: 2,
  },
  {
    id: '5',
    returnType: 'GSTR-3B',
    taxPeriod: 'Jun 2026',
    financialYear: '2026-27',
    taxableValue: 3120000,
    cgst: 20000,
    sgst: 20000,
    igst: 10000,
    totalGst: 50000,
    dueDate: '20-Jul-2026',
    filingDate: '19-Jul-2026',
    status: 'Filed with Errors',
    inputTaxCredit: 332000,
    taxPaid: 50000,
    balancePayable: 0,
  },
];

export default function GSTReports() {
  // Filters
  const [search, setSearch] = useState('');
  const [fy, setFy] = useState('All');
  const [period, setPeriod] = useState('All');
  const [branch, setBranch] = useState('All');
  const [division, setDivision] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // UI State
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const [selectedReport, setSelectedReport] = useState<GSTReportItem | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const columns: Column<GSTReportItem>[] = [
    {
      key: 'returnType',
      label: 'RETURN TYPE',
      render: (row) => <span className="font-semibold text-slate-900">{row.returnType}</span>,
    },
    { key: 'taxPeriod', label: 'GST PERIOD' },
    { key: 'financialYear', label: 'FINANCIAL YEAR' },
    { 
      key: 'taxableValue', 
      label: 'TAXABLE VALUE',
      render: (row) => formatCurrency(row.taxableValue),
    },
    { 
      key: 'cgst', 
      label: 'CGST',
      render: (row) => formatCurrency(row.cgst),
    },
    { 
      key: 'sgst', 
      label: 'SGST',
      render: (row) => formatCurrency(row.sgst),
    },
    { 
      key: 'igst', 
      label: 'IGST',
      render: (row) => formatCurrency(row.igst),
    },
    { 
      key: 'totalGst', 
      label: 'TOTAL GST',
      render: (row) => <span className="font-semibold text-slate-900">{formatCurrency(row.totalGst)}</span>,
    },
    { key: 'dueDate', label: 'DUE DATE' },
    { 
      key: 'filingDate', 
      label: 'FILING DATE',
      render: (row) => row.filingDate || <span className="text-slate-400">-</span>
    },
    {
      key: 'status',
      label: 'STATUS',
      render: (row) => {
        let variant: BadgeVariant = 'neutral';
        if (row.status === 'Filed') variant = 'success';
        else if (row.status === 'Ready for Filing') variant = 'info';
        else if (row.status === 'Draft') variant = 'warning';
        else if (row.status === 'Filed with Errors') variant = 'warning';
        else if (row.status === 'Overdue') variant = 'danger';

        return <Badge variant={variant}>{row.status}</Badge>;
      },
    },
    {
      key: 'actions',
      label: 'ACTION',
      render: (row) => (
        <button 
          onClick={() => setSelectedReport(row)}
          className="text-violet-600 font-medium hover:text-violet-700 flex items-center gap-1"
        >
          <Eye className="w-4 h-4" />
          View
        </button>
      ),
    },
  ];

  const filteredData = gstData.filter((item) => {
    const matchesSearch = item.returnType.toLowerCase().includes(search.toLowerCase()) || 
                          item.taxPeriod.toLowerCase().includes(search.toLowerCase());
    const matchesFy = fy === 'All' || item.financialYear === fy;
    const matchesPeriod = period === 'All' || item.taxPeriod.includes(period);
    // Assuming branch and division are globally applied logic, ignoring strict filter mapping for mock simplicity
    const matchesStatus = statusFilter === 'All' || item.status === statusFilter;

    return matchesSearch && matchesFy && matchesPeriod && matchesStatus;
  });

  // Export Handlers
  const handleExportExcel = () => {
    const dataToExport = filteredData.map(item => ({
      'Return Type': item.returnType,
      'GST Period': item.taxPeriod,
      'Financial Year': item.financialYear,
      'Taxable Value': item.taxableValue,
      'CGST': item.cgst,
      'SGST': item.sgst,
      'IGST': item.igst,
      'Total GST': item.totalGst,
      'Due Date': item.dueDate,
      'Filing Date': item.filingDate || 'Not Filed',
      'Status': item.status
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'GST_Reports');
    XLSX.writeFile(workbook, `GST_Reports_${fy === 'All' ? 'Overall' : fy}.xlsx`);
    setShowExportMenu(false);
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filteredData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", `GST_Returns_${fy === 'All' ? 'Overall' : fy}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    setShowExportMenu(false);
  };

  const handleExportPDF = () => {
    generateGstReportPdf({ 
      fy, period, branch, division, data: filteredData,
      summary: {
        outputGst: 807000,
        inputTaxCredit: 310000,
        netGstPayable: 165000
      }
    });
    setShowExportMenu(false);
  };

  const handlePrintReport = () => {
    generateGstReportPrint({ 
      fy, period, branch, division, data: filteredData,
      summary: {
        outputGst: 807000,
        inputTaxCredit: 310000,
        netGstPayable: 165000
      }
    });
    setShowExportMenu(false);
  };

  return (
    <div className="animate-in fade-in duration-500 pb-12">
      <PageHeader
        title="GST Reports"
        subtitle="Consolidated GST filing reports, automatically populated from accounting modules."
        actions={
          <div className="relative" ref={exportMenuRef}>
            <ActionButton 
              variant="secondary" 
              icon={<Download className="w-4 h-4" />}
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center gap-2"
            >
              Export <ChevronDown className="w-4 h-4" />
            </ActionButton>
            
            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50">
                <button onClick={handleExportExcel} className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 hover:text-violet-700 flex items-center gap-2">
                  <Download className="w-4 h-4" /> Export Excel
                </button>
                <button onClick={handleExportPDF} className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 hover:text-violet-700 flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Export PDF
                </button>
                <button onClick={handleExportJSON} className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 hover:text-violet-700 flex items-center gap-2">
                  <FileJson className="w-4 h-4" /> Export JSON
                </button>
                <div className="h-px bg-slate-100 my-1"></div>
                <button onClick={handlePrintReport} className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 hover:text-violet-700 flex items-center gap-2">
                  <Printer className="w-4 h-4" /> Print Report
                </button>
              </div>
            )}
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <SummaryCard
          title="Output GST Liability (GSTR-1)"
          value="₹ 8,07,000"
          subtitle="Tax on outward supplies"
          icon={<span className="font-bold">G1</span>}
          colorClass="text-indigo-600"
          bgClass="bg-indigo-50"
        />

        <SummaryCard
          title="Input Tax Credit (GSTR-2B)"
          value="₹ 3,10,000"
          subtitle="ITC on inward supplies"
          icon={<span className="font-bold">2B</span>}
          colorClass="text-emerald-600"
          bgClass="bg-emerald-50"
        />

        <SummaryCard
          title="Net GST Payable (GSTR-3B)"
          value="₹ 1,65,000"
          subtitle="To be paid via Cash Ledger"
          icon={<span className="font-bold">3B</span>}
          colorClass="text-rose-600"
          bgClass="bg-rose-50"
        />
      </div>

      {/* Filters */}
      <FilterBar>
        <SelectFilter
          value={fy}
          onChange={setFy}
          options={[{label: '2026-27', value: '2026-27'}, {label: '2025-26', value: '2025-26'}]}
          placeholder="Financial Year"
        />
        <SelectFilter
          value={period}
          onChange={setPeriod}
          options={[{label: 'Jul', value: 'Jul'}, {label: 'Jun', value: 'Jun'}, {label: 'May', value: 'May'}]}
          placeholder="GST Period"
        />
        <SelectFilter
          value={branch}
          onChange={setBranch}
          options={[{label: 'All Branches', value: 'All'}, {label: 'Hyderabad', value: 'Hyderabad'}, {label: 'Mumbai', value: 'Mumbai'}, {label: 'Delhi', value: 'Delhi'}]}
          placeholder="Branch"
        />
        <SelectFilter
          value={division}
          onChange={setDivision}
          options={[{label: 'All Divisions', value: 'All'}, {label: 'Pharma', value: 'Pharma'}, {label: 'Surgical', value: 'Surgical'}]}
          placeholder="Division"
        />
        
        <div className="w-px h-6 bg-slate-200 mx-2 hidden lg:block" />

        <SelectFilter
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { label: 'Draft', value: 'Draft' },
            { label: 'Ready for Filing', value: 'Ready for Filing' },
            { label: 'Filed', value: 'Filed' },
            { label: 'Filed with Errors', value: 'Filed with Errors' },
            { label: 'Overdue', value: 'Overdue' }
          ]}
          placeholder="Status"
        />
        
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search Return Type..."
        />
      </FilterBar>

      {/* GST Filing Summary */}
      <TableCard>
        <DataTable
          columns={columns}
          data={filteredData}
          emptyMessage="No GST filing records found."
        />
      </TableCard>

      {/* View Drawer */}
      <Drawer
        open={selectedReport !== null}
        onClose={() => setSelectedReport(null)}
        title={`${selectedReport?.returnType} Details`}
      >
        {selectedReport && (
          <div className="space-y-6">
             <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
               <div>
                 <p className="text-xs text-slate-500 font-medium uppercase">GST Period</p>
                 <p className="font-semibold text-slate-900">{selectedReport.taxPeriod}</p>
               </div>
               <div>
                 <p className="text-xs text-slate-500 font-medium uppercase">Financial Year</p>
                 <p className="font-semibold text-slate-900">{selectedReport.financialYear}</p>
               </div>
               <div>
                 <p className="text-xs text-slate-500 font-medium uppercase">Due Date</p>
                 <p className="font-semibold text-slate-900">{selectedReport.dueDate}</p>
               </div>
               <div>
                 <p className="text-xs text-slate-500 font-medium uppercase">Status</p>
                 <Badge variant={selectedReport.status === 'Filed' ? 'success' : selectedReport.status === 'Overdue' ? 'danger' : selectedReport.status === 'Draft' ? 'warning' : 'neutral'}>
                   {selectedReport.status}
                 </Badge>
               </div>
             </div>

             <div>
               <h4 className="text-sm font-bold text-slate-900 border-b pb-2 mb-4">Tax Computation</h4>
               <div className="space-y-3 text-sm">
                 <div className="flex justify-between">
                   <span className="text-slate-600">Taxable Value</span>
                   <span className="font-medium">{formatCurrency(selectedReport.taxableValue)}</span>
                 </div>
                 <div className="flex justify-between">
                   <span className="text-slate-600">CGST</span>
                   <span className="font-medium">{formatCurrency(selectedReport.cgst)}</span>
                 </div>
                 <div className="flex justify-between">
                   <span className="text-slate-600">SGST</span>
                   <span className="font-medium">{formatCurrency(selectedReport.sgst)}</span>
                 </div>
                 <div className="flex justify-between">
                   <span className="text-slate-600">IGST</span>
                   <span className="font-medium">{formatCurrency(selectedReport.igst)}</span>
                 </div>
                 <div className="flex justify-between font-bold pt-2 border-t text-slate-900">
                   <span>Total GST</span>
                   <span>{formatCurrency(selectedReport.totalGst)}</span>
                 </div>
               </div>
             </div>

             {selectedReport.returnType === 'GSTR-1' && (
               <div>
                 <h4 className="text-sm font-bold text-slate-900 border-b pb-2 mb-4">Outward Supplies Detail</h4>
                 <div className="space-y-3 text-sm">
                   <div className="flex justify-between">
                     <span className="text-slate-600">B2B & B2C Invoices</span>
                     <span className="font-medium">{selectedReport.invoiceCount}</span>
                   </div>
                   <div className="flex justify-between">
                     <span className="text-slate-600">Credit Notes</span>
                     <span className="font-medium">{selectedReport.creditNotes}</span>
                   </div>
                   <div className="flex justify-between">
                     <span className="text-slate-600">Debit Notes</span>
                     <span className="font-medium">{selectedReport.debitNotes}</span>
                   </div>
                 </div>
               </div>
             )}

             {selectedReport.returnType === 'GSTR-3B' && (
               <div>
                 <h4 className="text-sm font-bold text-slate-900 border-b pb-2 mb-4">Liability & Settlement</h4>
                 <div className="space-y-3 text-sm">
                   <div className="flex justify-between">
                     <span className="text-slate-600">Input Tax Credit (ITC)</span>
                     <span className="font-medium text-emerald-600">{formatCurrency(selectedReport.inputTaxCredit || 0)}</span>
                   </div>
                   <div className="flex justify-between">
                     <span className="text-slate-600">Net GST Liability</span>
                     <span className="font-medium">{formatCurrency(selectedReport.totalGst)}</span>
                   </div>
                   <div className="flex justify-between">
                     <span className="text-slate-600">Tax Paid (Cash)</span>
                     <span className="font-medium">{formatCurrency(selectedReport.taxPaid || 0)}</span>
                   </div>
                   <div className="flex justify-between font-bold text-rose-600 pt-2 border-t">
                     <span>Balance Payable</span>
                     <span>{formatCurrency(selectedReport.balancePayable || 0)}</span>
                   </div>
                 </div>
               </div>
             )}
          </div>
        )}
      </Drawer>

    </div>
  );
}