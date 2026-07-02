import { useState, useRef, useEffect } from 'react';
import { Download, ChevronDown, Printer, FileText, Wallet, BarChart3, TrendingUp, Info, CreditCard } from 'lucide-react';
import * as XLSX from 'xlsx';
import { generateBalanceSheetPdf } from '../../documents/generators/pdfGenerator';
import { generateBalanceSheetPrint } from '../../documents/generators/printGenerator';

import {
  PageHeader,
  FilterBar,
  SelectFilter,
  ActionButton,
  SummaryCard,
  Drawer,
  DataTable
} from './components/shared';
import { type Column } from './components/shared';

// --- Types ---
interface BSItem {
  id: string;
  name: string;
  amount: number;
  isHeading?: boolean;
  isTotal?: boolean;
  isDrilldown?: boolean;
}

interface DrillDownTxn {
  id: string;
  date: string;
  voucherNo: string;
  particulars: string;
  amount: number;
}

// --- Mock Data ---
const liabilitiesItems: BSItem[] = [
  { id: 'l_cap_head', name: 'Capital Account', amount: 0, isHeading: true },
  { id: 'l1', name: 'Opening Capital', amount: 5000000 },
  { id: 'l2', name: 'Add: Net Profit', amount: 1830000 },
  { id: 'l3', name: 'Less: Drawings', amount: -500000 },
  { id: 'l_cap_tot', name: 'Closing Capital', amount: 6330000, isTotal: true },

  { id: 'l_loan_head', name: 'Loans', amount: 0, isHeading: true },
  { id: 'l4', name: 'Bank Loans', amount: 2500000, isDrilldown: true },
  { id: 'l5', name: 'Working Capital Loans', amount: 800000 },
  { id: 'l6', name: 'Vehicle Loans', amount: 450000 },
  { id: 'l7', name: 'Term Loans', amount: 1200000, isDrilldown: true },
  { id: 'l_loan_tot', name: 'Total Loans', amount: 4950000, isTotal: true },

  { id: 'l_cur_head', name: 'Current Liabilities', amount: 0, isHeading: true },
  { id: 'l8', name: 'Trade Creditors', amount: 1450000, isDrilldown: true },
  { id: 'l9', name: 'Outstanding Expenses', amount: 120000 },
  { id: 'l10', name: 'GST Payable', amount: 250000, isDrilldown: true },
  { id: 'l11', name: 'TDS Payable', amount: 85000 },
  { id: 'l12', name: 'Salary Payable', amount: 350000 },
  { id: 'l13', name: 'Customer Advances', amount: 150000 },
  { id: 'l_cur_tot', name: 'Total Current Liabilities', amount: 2405000, isTotal: true },
  
  { id: 'l_space', name: '', amount: 0, isHeading: true },
  { id: 'l_grand_tot', name: 'Total Liabilities', amount: 13685000, isTotal: true },
];

const assetsItems: BSItem[] = [
  { id: 'a_fix_head', name: 'Fixed Assets', amount: 0, isHeading: true },
  { id: 'a1', name: 'Plant & Machinery', amount: 4500000 },
  { id: 'a2', name: 'Manufacturing Equipment', amount: 1200000 },
  { id: 'a3', name: 'Laboratory Equipment', amount: 750000 },
  { id: 'a4', name: 'Furniture & Fixtures', amount: 550000 },
  { id: 'a5', name: 'Computers & IT Equipment', amount: 300000 },
  { id: 'a6', name: 'Vehicles', amount: 850000 },
  { id: 'a_fix_tot', name: 'Total Fixed Assets', amount: 8150000, isTotal: true },

  { id: 'a_cur_head', name: 'Current Assets', amount: 0, isHeading: true },
  { id: 'a7', name: 'Inventory', amount: 1600000, isDrilldown: true },
  { id: 'a8', name: 'Trade Debtors', amount: 2850000, isDrilldown: true },
  { id: 'a9', name: 'Cash In Hand', amount: 150000 },
  { id: 'a10', name: 'Bank Accounts', amount: 450000, isDrilldown: true },
  { id: 'a11', name: 'GST Receivable', amount: 85000, isDrilldown: true },
  { id: 'a12', name: 'Advances To Suppliers', amount: 200000 },
  { id: 'a13', name: 'Security Deposits', amount: 200000 },
  { id: 'a_cur_tot', name: 'Total Current Assets', amount: 5535000, isTotal: true },

  { id: 'a_space', name: '', amount: 0, isHeading: true },
  { id: 'a_grand_tot', name: 'Total Assets', amount: 13685000, isTotal: true },
];

const mockDrilldownData: Record<string, DrillDownTxn[]> = {
  'Inventory': [
    { id: '1', date: '2026-10-31', voucherNo: 'STK-001', particulars: 'Warehouse-wise Stock', amount: 800000 },
    { id: '2', date: '2026-10-31', voucherNo: 'STK-002', particulars: 'Product-wise Stock', amount: 500000 },
    { id: '3', date: '2026-10-31', voucherNo: 'STK-003', particulars: 'Batch-wise Stock', amount: 300000 },
  ],
  'Trade Debtors': [
    { id: '1', date: '2026-10-31', voucherNo: 'BAL-001', particulars: 'Customer Outstanding - Apollo', amount: 1200000 },
    { id: '2', date: '2026-10-31', voucherNo: 'BAL-002', particulars: 'Customer Outstanding - MedPlus', amount: 850000 },
    { id: '3', date: '2026-10-31', voucherNo: 'BAL-003', particulars: 'Customer Outstanding - Local', amount: 800000 },
  ],
  'Trade Creditors': [
    { id: '1', date: '2026-10-31', voucherNo: 'BAL-101', particulars: 'Supplier Outstanding - Cipla', amount: 850000 },
    { id: '2', date: '2026-10-31', voucherNo: 'BAL-102', particulars: 'Supplier Outstanding - Sun', amount: 600000 },
  ],
  'Bank Accounts': [
    { id: '1', date: '2026-10-31', voucherNo: 'BNK-001', particulars: 'Bank Ledger Summary - HDFC', amount: 350000 },
    { id: '2', date: '2026-10-31', voucherNo: 'BNK-002', particulars: 'Bank Ledger Summary - SBI', amount: 100000 },
  ]
};

const defaultDrilldown: DrillDownTxn[] = [
  { id: '1', date: '2026-10-01', voucherNo: 'JV-001', particulars: 'Opening Balance', amount: 100000 },
  { id: '2', date: '2026-10-31', voucherNo: 'JV-045', particulars: 'Period Transactions', amount: 150000 },
];

export default function BalanceSheet() {
  // Filter State
  const [fy, setFy] = useState('2026-27');
  const [asOnDate, setAsOnDate] = useState('2027-03-31');
  const [branch, setBranch] = useState('All');
  const [division, setDivision] = useState('All');
  
  // UI State
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  
  // Drill-down State
  const [drilldownItem, setDrilldownItem] = useState<BSItem | null>(null);

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
    if (amount === 0) return '-';
    const isNegative = amount < 0;
    const absAmount = Math.abs(amount);
    const formatted = new Intl.NumberFormat('en-IN', {
      style: 'decimal',
      maximumFractionDigits: 0,
    }).format(absAmount);
    return isNegative ? `(${formatted})` : formatted;
  };

  const renderBSRow = (item: BSItem) => {
    if (item.isHeading && item.name === '') {
      return <div key={item.id} className="mt-8 pt-4 border-t-2 border-slate-200"></div>;
    }
    
    if (item.isHeading) {
      return (
        <div key={item.id} className="font-bold text-slate-800 pt-4 pb-1 border-b border-slate-200 mb-2">
          {item.name}
        </div>
      );
    }

    return (
      <div key={item.id} className={`flex items-center justify-between text-sm py-2 px-2 hover:bg-slate-50 transition-colors ${item.isTotal ? 'font-bold bg-slate-50 border-t border-b border-slate-200 mt-4 mb-2' : 'text-slate-700'}`}>
        <div className="flex items-center gap-2">
          {item.isDrilldown ? (
            <button 
              onClick={() => setDrilldownItem(item)}
              className="text-violet-600 hover:text-violet-800 hover:underline flex items-center gap-1 text-left"
            >
              {item.name}
            </button>
          ) : (
            <span className={item.isTotal ? '' : 'pl-4'}>{item.name}</span>
          )}
        </div>
        <div className="text-right">{item.name ? formatCurrency(item.amount) : ''}</div>
      </div>
    );
  };

  // --- Exports ---
  const handleExportExcel = () => {
    const dataToExport = [
      ['Liabilities', 'Amount (₹)', 'Assets', 'Amount (₹)'],
      ...liabilitiesItems.map((liab, i) => {
        const asset = assetsItems[i] || { name: '', amount: 0 };
        return [
          liab.name, liab.amount,
          asset.name, asset.amount
        ];
      })
    ];
    const worksheet = XLSX.utils.aoa_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'BalanceSheet');
    XLSX.writeFile(workbook, `Balance_Sheet_${fy}.xlsx`);
    setShowExportMenu(false);
  };

  const handleExportPDF = () => {
    generateBalanceSheetPdf({ fy, asOnDate, branch, division, liabilitiesItems, assetsItems });
    setShowExportMenu(false);
  };

  const handlePrintStatement = () => {
    generateBalanceSheetPrint({ fy, asOnDate, branch, division, liabilitiesItems, assetsItems });
    setShowExportMenu(false);
  };

  // Drilldown Table Columns
  const drilldownColumns: Column<DrillDownTxn>[] = [
    { key: 'date', label: 'Date' },
    { key: 'voucherNo', label: 'Voucher No' },
    { key: 'particulars', label: 'Particulars' },
    { key: 'amount', label: 'Amount (₹)', render: (row) => <span className="font-semibold">{formatCurrency(row.amount)}</span> },
  ];

  const currentDrilldownData = drilldownItem ? (mockDrilldownData[drilldownItem.name] || defaultDrilldown) : [];

  return (
    <div className="animate-in fade-in duration-500 pb-12">
      <PageHeader
        title="Balance Sheet"
        subtitle="Snapshot of the company's financial position, automatically compiled from accounting ledgers."
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
                <button 
                  onClick={handleExportExcel}
                  className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 hover:text-violet-700 flex items-center gap-2"
                >
                  <Download className="w-4 h-4" /> Export Excel
                </button>
                <button 
                  onClick={handleExportPDF}
                  className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 hover:text-violet-700 flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" /> Export PDF
                </button>
                <div className="h-px bg-slate-100 my-1"></div>
                <button 
                  onClick={handlePrintStatement}
                  className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 hover:text-violet-700 flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" /> Print Statement
                </button>
              </div>
            )}
          </div>
        }
      />

      <FilterBar>
        <SelectFilter
          value={fy}
          onChange={setFy}
          options={[{label: '2026-27', value: '2026-27'}, {label: '2025-26', value: '2025-26'}, {label: '2024-25', value: '2024-25'}]}
          placeholder="Financial Year"
        />
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-700 whitespace-nowrap">As On Date:</span>
          <input type="date" value={asOnDate} onChange={(e) => setAsOnDate(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 text-slate-700 bg-white" />
        </div>
        <SelectFilter
          value={branch}
          onChange={setBranch}
          options={[{label: 'All Branches', value: 'All'}, {label: 'Hyderabad', value: 'Hyderabad'}, {label: 'Mumbai', value: 'Mumbai'}, {label: 'Delhi', value: 'Delhi'}]}
          placeholder="Branch"
        />
        <SelectFilter
          value={division}
          onChange={setDivision}
          options={[{label: 'All Divisions', value: 'All'}, {label: 'Pharma', value: 'Pharma'}, {label: 'Surgical', value: 'Surgical'}, {label: 'OTC', value: 'OTC'}, {label: 'Export', value: 'Export'}]}
          placeholder="Division"
        />
      </FilterBar>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <SummaryCard 
          title="Total Assets" 
          value="₹1.36 Cr" 
          subtitle="Matching Liabilities"
          icon={<Wallet className="w-6 h-6" />}
          colorClass="text-emerald-600"
          bgClass="bg-emerald-50"
        />
        <SummaryCard 
          title="Total Liabilities" 
          value="₹73.55 L" 
          subtitle="External Obligations"
          icon={<CreditCard className="w-6 h-6" />}
          colorClass="text-amber-600"
          bgClass="bg-amber-50"
        />
        <SummaryCard 
          title="Net Worth" 
          value="₹63.30 L" 
          subtitle="Total Capital"
          icon={<TrendingUp className="w-6 h-6" />}
          colorClass="text-violet-600"
          bgClass="bg-violet-50"
        />
        <SummaryCard 
          title="Working Capital" 
          value="₹31.30 L" 
          subtitle="Current Assets - Current Liab"
          icon={<BarChart3 className="w-6 h-6" />}
          colorClass="text-blue-600"
          bgClass="bg-blue-50"
        />
      </div>

      <div className="bg-white p-4 sm:p-8 rounded-2xl border border-slate-200 shadow-sm max-w-5xl mx-auto overflow-x-auto">
         <div className="min-w-[600px]">
           <div className="text-center mb-8">
              <h2 className="text-xl font-bold text-slate-900">Pharma ERP Pvt. Ltd.</h2>
              <p className="text-slate-500">Balance Sheet as on {asOnDate}</p>
              {branch !== 'All' && <p className="text-slate-400 text-sm mt-1">Branch: {branch} | Division: {division}</p>}
           </div>
           
           <div className="grid grid-cols-2 gap-8">
               {/* Left Column: Liabilities */}
               <div>
                  <div className="flex justify-between font-bold text-slate-800 border-b-2 border-slate-800 pb-2 mb-2 text-xs uppercase tracking-wider">
                      <span>Liabilities</span>
                      <span>Amount (₹)</span>
                  </div>
                  <div className="flex flex-col">
                      {liabilitiesItems.map(renderBSRow)}
                  </div>
               </div>
               
               {/* Right Column: Assets */}
               <div>
                  <div className="flex justify-between font-bold text-slate-800 border-b-2 border-slate-800 pb-2 mb-2 text-xs uppercase tracking-wider">
                      <span>Assets</span>
                      <span>Amount (₹)</span>
                  </div>
                  <div className="flex flex-col">
                      {assetsItems.map(renderBSRow)}
                  </div>
               </div>
           </div>
         </div>
      </div>

      {/* Drill-down Drawer */}
      <Drawer
        open={drilldownItem !== null}
        onClose={() => setDrilldownItem(null)}
        title="Ledger Drill-down"
      >
        {drilldownItem && (
          <div className="flex flex-col h-full">
            <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3">
              <Info className="w-5 h-5 text-violet-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-slate-900">{drilldownItem.name}</h3>
                <p className="text-sm text-slate-500 mt-1">Showing underlying general ledger transactions contributing to the balance of <span className="font-bold text-slate-700">{formatCurrency(drilldownItem.amount)}</span> as on {asOnDate}.</p>
              </div>
            </div>
            
            <div className="flex-1 overflow-auto border border-slate-200 rounded-lg">
              <DataTable
                columns={drilldownColumns}
                data={currentDrilldownData}
                emptyMessage="No ledger data found."
              />
            </div>
            
            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
              <ActionButton variant="secondary" onClick={() => setDrilldownItem(null)}>Close</ActionButton>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
