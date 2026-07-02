import { useState, useRef, useEffect } from 'react';
import { Download, ChevronDown, Printer, FileText, TrendingUp, DollarSign, Percent, BarChart3, Info } from 'lucide-react';
import * as XLSX from 'xlsx';
import { generateProfitLossPdf } from '../../documents/generators/pdfGenerator';
import { generateProfitLossPrint } from '../../documents/generators/printGenerator';

import {
  PageHeader,
  FilterBar,
  SelectFilter,
  ActionButton,
  SummaryCard,
  Drawer,
  DataTable,
  } from './components/shared';
import { type Column } from './components/shared';

// --- Types ---
interface PLItem {
  id: string;
  name: string;
  current: number;
  previous: number;
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
const drItems: PLItem[] = [
  { id: 'd1', name: 'To Opening Stock', current: 1550000, previous: 1400000 },
  { id: 'd2', name: 'To Purchases', current: 14520000, previous: 13000000, isDrilldown: true },
  { id: 'd3', name: 'Less: Purchase Returns', current: -120000, previous: -80000 },
  { id: 'd4', name: 'To Direct Expenses', current: 840000, previous: 750000, isDrilldown: true },
  { id: 'd5', name: 'Gross Profit c/d', current: 6510000, previous: 5230000, isTotal: true },
  
  { id: 'd_space', name: '', current: 0, previous: 0, isHeading: true },
  
  { id: 'd6', name: 'To Salaries & Wages', current: 2400000, previous: 2100000, isDrilldown: true },
  { id: 'd7', name: 'To Rent & Utilities', current: 650000, previous: 600000 },
  { id: 'd8', name: 'To MR Commissions', current: 820000, previous: 680000, isDrilldown: true },
  { id: 'd9', name: 'To Marketing Expenses', current: 500000, previous: 420000, isDrilldown: true },
  { id: 'd10', name: 'To Depreciation', current: 310000, previous: 280000 },
  { id: 'd11', name: 'Net Profit', current: 1830000, previous: 1210000, isTotal: true },
];

const crItems: PLItem[] = [
  { id: 'c1', name: 'By Sales', current: 22050000, previous: 19000000, isDrilldown: true },
  { id: 'c2', name: 'Less: Sales Returns', current: -350000, previous: -250000 },
  { id: 'c3', name: 'By Closing Stock', current: 1600000, previous: 1550000 },
  { id: 'c4', name: '', current: 23300000, previous: 20300000, isTotal: true },
  
  { id: 'c_space', name: '', current: 0, previous: 0, isHeading: true },
  
  { id: 'c5', name: 'By Gross Profit b/d', current: 6510000, previous: 5230000, isTotal: true },
  { id: 'c6', name: 'By Discount Received', current: 450000, previous: 38000 },
  { id: 'c7', name: 'By Interest Income', current: 55000, previous: 22000, isDrilldown: true },
];

const mockDrilldownData: Record<string, DrillDownTxn[]> = {
  'By Sales': [
    { id: '1', date: '2026-10-01', voucherNo: 'INV-2026-001', particulars: 'Sales to Apollo Pharmacy', amount: 450000 },
    { id: '2', date: '2026-10-05', voucherNo: 'INV-2026-002', particulars: 'Sales to Apex Distributors', amount: 1200000 },
    { id: '3', date: '2026-10-12', voucherNo: 'INV-2026-003', particulars: 'Sales to Global Pharma', amount: 850000 },
  ],
  'To Purchases': [
    { id: '1', date: '2026-10-02', voucherNo: 'PUR-2026-001', particulars: 'Raw Materials from Cipla', amount: 800000 },
    { id: '2', date: '2026-10-08', voucherNo: 'PUR-2026-002', particulars: 'Packaging from Sun Pack', amount: 150000 },
  ],
  'To MR Commissions': [
    { id: '1', date: '2026-10-07', voucherNo: 'PMT-2026-041', particulars: 'Commission - Rahul Verma', amount: 21125 },
    { id: '2', date: '2026-10-07', voucherNo: 'PMT-2026-042', particulars: 'Commission - Amit Singh', amount: 36000 },
  ]
};

// Default empty fallback for items without specific drilldown mock data
const defaultDrilldown: DrillDownTxn[] = [
  { id: '1', date: '2026-10-01', voucherNo: 'JV-2026-001', particulars: 'Opening Balance', amount: 150000 },
  { id: '2', date: '2026-10-15', voucherNo: 'JV-2026-045', particulars: 'Period Transactions', amount: 350000 },
];

export default function ProfitLoss() {
  // Filter State
  const [fy, setFy] = useState('2026-27');
  const [periodType, setPeriodType] = useState('Yearly');
  const [fromDate, setFromDate] = useState('2026-04-01');
  const [toDate, setToDate] = useState('2027-03-31');
  const [branch, setBranch] = useState('All');
  const [division, setDivision] = useState('All');
  
  // UI State
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  
  // Drill-down State
  const [drilldownItem, setDrilldownItem] = useState<PLItem | null>(null);

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

  const calculateVariance = (current: number, previous: number) => current - previous;
  const calculateVariancePercent = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    const diff = current - previous;
    return (diff / Math.abs(previous)) * 100;
  };

  const renderPLRow = (item: PLItem) => {
    if (item.isHeading) {
      return (
        <div key={item.id} className="mt-8 pt-4 border-t-2 border-slate-200"></div>
      );
    }

    const variance = calculateVariance(item.current, item.previous);
    const varPercent = calculateVariancePercent(item.current, item.previous);
    
    return (
      <div key={item.id} className={`flex items-center text-sm py-2 px-2 hover:bg-slate-50 transition-colors ${item.isTotal ? 'font-bold bg-slate-50 border-t border-b border-slate-200 my-1' : 'text-slate-700'}`}>
        <div className="w-[40%] flex items-center gap-2">
          {item.isDrilldown ? (
            <button 
              onClick={() => setDrilldownItem(item)}
              className="text-violet-600 hover:text-violet-800 hover:underline flex items-center gap-1 text-left"
            >
              {item.name}
            </button>
          ) : (
            <span className={item.name.startsWith('Less:') ? 'pl-4 text-xs text-slate-500' : ''}>{item.name}</span>
          )}
        </div>
        <div className="w-[20%] text-right">{item.name ? formatCurrency(item.current) : ''}</div>
        <div className="w-[15%] text-right text-slate-500">{item.name ? formatCurrency(item.previous) : ''}</div>
        <div className={`w-[15%] text-right ${variance > 0 ? 'text-emerald-600' : variance < 0 ? 'text-rose-600' : 'text-slate-400'}`}>
          {item.name ? formatCurrency(variance) : ''}
        </div>
        <div className={`w-[10%] text-right text-xs ${varPercent > 0 ? 'text-emerald-600' : varPercent < 0 ? 'text-rose-600' : 'text-slate-400'}`}>
          {item.name ? (varPercent > 0 ? `+${varPercent.toFixed(1)}%` : varPercent < 0 ? `${varPercent.toFixed(1)}%` : '-') : ''}
        </div>
      </div>
    );
  };

  // --- Exports ---
  const handleExportExcel = () => {
    const dataToExport = [
      ['Particulars (Dr.)', 'Current', 'Previous', 'Variance', 'Var %', 'Particulars (Cr.)', 'Current', 'Previous', 'Variance', 'Var %'],
      // Note: A real Excel export would map rows cleanly, here we just show basic structure
      ...drItems.map((dr, i) => {
        const cr = crItems[i] || { name: '', current: 0, previous: 0 };
        return [
          dr.name, dr.current, dr.previous, calculateVariance(dr.current, dr.previous), calculateVariancePercent(dr.current, dr.previous).toFixed(1),
          cr.name, cr.current, cr.previous, calculateVariance(cr.current, cr.previous), calculateVariancePercent(cr.current, cr.previous).toFixed(1)
        ];
      })
    ];
    const worksheet = XLSX.utils.aoa_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'ProfitLoss');
    XLSX.writeFile(workbook, `Profit_Loss_${fy}.xlsx`);
    setShowExportMenu(false);
  };

  const handleExportPDF = () => {
    generateProfitLossPdf({ fy, periodType, fromDate, toDate, branch, division, drItems, crItems });
    setShowExportMenu(false);
  };

  const handlePrintStatement = () => {
    generateProfitLossPrint({ fy, periodType, fromDate, toDate, branch, division, drItems, crItems });
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
          title="Profit & Loss Statement"
          subtitle="Financial performance overview, automatically compiled from accounting transactions."
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
          options={[{label: '2026-27', value: '2026-27'}, {label: '2025-26', value: '2025-26'}]}
          placeholder="Financial Year"
        />
        <SelectFilter
          value={periodType}
          onChange={setPeriodType}
          options={[
            {label: 'Monthly', value: 'Monthly'},
            {label: 'Quarterly', value: 'Quarterly'},
            {label: 'Half Yearly', value: 'Half Yearly'},
            {label: 'Yearly', value: 'Yearly'}
          ]}
          placeholder="Period Type"
        />
        <div className="flex items-center gap-2">
          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 text-slate-700 bg-white" />
          <span className="text-slate-400">to</span>
          <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 text-slate-700 bg-white" />
        </div>
        <SelectFilter
          value={branch}
          onChange={setBranch}
          options={[{label: 'All Branches', value: 'All'}, {label: 'Mumbai HQ', value: 'Mumbai'}, {label: 'Delhi Branch', value: 'Delhi'}]}
          placeholder="Branch"
        />
        <SelectFilter
          value={division}
          onChange={setDivision}
          options={[{label: 'All Divisions', value: 'All'}, {label: 'Pharma Division', value: 'Pharma'}, {label: 'OTC Division', value: 'OTC'}]}
          placeholder="Division"
        />
      </FilterBar>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <SummaryCard 
            title="Total Revenue" 
          value="₹2,20,50,000" 
          subtitle="+15.8% vs last year"
          icon={<DollarSign className="w-6 h-6" />}
          colorClass="text-emerald-600"
          bgClass="bg-emerald-50"
        />
        <SummaryCard 
          title="Gross Profit" 
          value="₹65,10,000" 
          subtitle="Margin: 29.5%"
          icon={<BarChart3 className="w-6 h-6" />}
          colorClass="text-blue-600"
          bgClass="bg-blue-50"
        />
        <SummaryCard 
          title="Net Profit" 
          value="₹18,30,000" 
          subtitle="+51.2% vs last year"
          icon={<TrendingUp className="w-6 h-6" />}
          colorClass="text-violet-600"
          bgClass="bg-violet-50"
        />
        <SummaryCard 
          title="Net Profit Margin" 
          value="8.3%" 
          subtitle="Industry avg: 6.5%"
          icon={<Percent className="w-6 h-6" />}
          colorClass="text-amber-600"
          bgClass="bg-amber-50"
        />
      </div>

      <div className="bg-white p-4 sm:p-8 rounded-2xl border border-slate-200 shadow-sm w-full overflow-x-auto">
         <div className="min-w-[1000px]">
           <div className="text-center mb-8">
              <h2 className="text-xl font-bold text-slate-900">Pharma ERP Pvt. Ltd.</h2>
              <p className="text-slate-500">Profit & Loss Account for the period {fromDate} to {toDate}</p>
              {branch !== 'All' && <p className="text-slate-400 text-sm mt-1">Branch: {branch} | Division: {division}</p>}
           </div>
           
           <div className="grid grid-cols-2 gap-8">
               {/* Left Column: Expenses */}
               <div>
                  <div className="flex font-bold text-slate-800 border-b-2 border-slate-800 pb-2 mb-2 text-xs uppercase tracking-wider">
                      <div className="w-[40%]">Particulars (Dr.)</div>
                      <div className="w-[20%] text-right">Current (₹)</div>
                      <div className="w-[15%] text-right text-slate-500">Prev (₹)</div>
                      <div className="w-[15%] text-right">Var (₹)</div>
                      <div className="w-[10%] text-right">Var %</div>
                  </div>
                  <div className="flex flex-col">
                      {drItems.map(renderPLRow)}
                  </div>
               </div>
               
               {/* Right Column: Income */}
               <div>
                  <div className="flex font-bold text-slate-800 border-b-2 border-slate-800 pb-2 mb-2 text-xs uppercase tracking-wider">
                      <div className="w-[40%]">Particulars (Cr.)</div>
                      <div className="w-[20%] text-right">Current (₹)</div>
                      <div className="w-[15%] text-right text-slate-500">Prev (₹)</div>
                      <div className="w-[15%] text-right">Var (₹)</div>
                      <div className="w-[10%] text-right">Var %</div>
                  </div>
                  <div className="flex flex-col">
                      {crItems.map(renderPLRow)}
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
                <h3 className="font-semibold text-slate-900">{drilldownItem.name.replace('To ', '').replace('By ', '')} Account</h3>
                <p className="text-sm text-slate-500 mt-1">Showing underlying general ledger transactions contributing to the total balance of <span className="font-bold text-slate-700">{formatCurrency(drilldownItem.current)}</span> for the current period.</p>
              </div>
            </div>
            
            <div className="flex-1 overflow-auto border border-slate-200 rounded-lg">
              <DataTable
                columns={drilldownColumns}
                data={currentDrilldownData}
                emptyMessage="No transactions found."
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
