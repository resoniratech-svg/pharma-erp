import { useState, useRef, useEffect, useMemo } from 'react';
import { IndianRupee, AlertCircle, Clock, Percent, Eye, Download, ChevronDown, FileSpreadsheet, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  PageHeader,
  SearchInput,
  SelectFilter,
  TableCard,
  DataTable,
  Badge,
  SummaryCard
} from './components/shared';
import { type Column } from './components/shared';
import { billingService } from '../../services/billingService';
import type { GSTInvoice } from '../../services/billingService';

interface PendingPayment {
  id: string;
  customerCode: string;
  customerName: string;
  partyType: string;
  invoiceNo: string;
  invoiceDate: string;
  dueDate: string;
  outstandingAmount: string;
  outstandingAmountNumber: number;
  daysOverdue: number;
  branch: string;
  status: 'Due Soon' | 'Overdue' | 'Critical' | 'Paid';
}

export default function PendingPaymentTracking() {
  const [search, setSearch] = useState('');
  
  // Filters
  const [partyType, setPartyType] = useState('');
  const [status, setStatus] = useState('');
  const [branch, setBranch] = useState('');

  const [isExportOpen, setIsExportOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [invoices, setInvoices] = useState<GSTInvoice[]>([]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsExportOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      const invs = await billingService.loadInvoices();
      setInvoices(invs);
    };
    loadData();
  }, []);

  const realData = useMemo(() => {
    const today = new Date();
    
    return invoices
      .filter(inv => inv.status !== 'Cancelled') // Only consider active/pending/paid invoices
      .map(inv => {
        const dueDate = new Date(inv.dueDate);
        const isPaid = inv.status === 'Paid';
        // In this system, if an order is Partially Paid, we assume the invoice status won't strictly be 'Paid'
        // For simplicity, we just use grandTotal if not fully Paid. 
        // Real logic should use (grandTotal - amountPaid) if partial payments exist on GSTInvoice.
        const outstandingAmountNum = isPaid ? 0 : inv.grandTotal;

        let daysOverdue = 0;
        let pStatus: PendingPayment['status'] = 'Due Soon';

        if (isPaid) {
          pStatus = 'Paid';
        } else {
          daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 3600 * 24));
          if (daysOverdue > 30) {
            pStatus = 'Critical';
          } else if (daysOverdue > 0) {
            pStatus = 'Overdue';
          } else {
            pStatus = 'Due Soon';
            daysOverdue = 0; // if it's not overdue yet
          }
        }

        // Mock party type, customer code and branch if missing, as they are not in GSTInvoice
        return {
          id: inv.id,
          customerCode: `CUS-${inv.customerId || '0000'}`,
          customerName: inv.customerName,
          partyType: 'Distributor', // Defaulting for now
          invoiceNo: inv.invoiceNo,
          invoiceDate: inv.date,
          dueDate: inv.dueDate,
          outstandingAmountNumber: outstandingAmountNum,
          outstandingAmount: `₹ ${outstandingAmountNum.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`,
          daysOverdue,
          branch: 'Main Warehouse', // Defaulting since branch is not in Invoice
          status: pStatus
        } as PendingPayment;
      })
      // Optionally sort by most overdue first
      .sort((a, b) => b.daysOverdue - a.daysOverdue);
  }, [invoices]);

  const columns: Column<PendingPayment>[] = [
    { key: 'customerCode', label: 'Customer Code', render: (row) => <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">{row.customerCode}</span> },
    { key: 'customerName', label: 'Customer Name', render: (row) => <span className="font-semibold text-slate-900">{row.customerName}</span> },
    { key: 'partyType', label: 'Party Type', render: (row) => <span className="text-slate-600">{row.partyType}</span> },
    { key: 'invoiceNo', label: 'Invoice No' },
    { key: 'invoiceDate', label: 'Invoice Date', render: (row) => <span className="text-slate-600">{new Date(row.invoiceDate).toLocaleDateString()}</span> },
    { key: 'dueDate', label: 'Due Date', render: (row) => <span className="text-slate-600 font-medium">{new Date(row.dueDate).toLocaleDateString()}</span> },
    { key: 'outstandingAmount', label: 'Outstanding Amount', render: (row) => <span className={row.outstandingAmountNumber > 0 ? "font-bold text-rose-600" : "font-bold text-emerald-600"}>{row.outstandingAmount}</span> },
    { key: 'daysOverdue', label: 'Days Overdue', render: (row) => <span className="text-slate-700">{row.daysOverdue > 0 ? `${row.daysOverdue} days` : '-'}</span> },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        let variant: 'success' | 'warning' | 'danger' | 'info' | 'neutral' = 'neutral';
        if (row.status === 'Paid') variant = 'success';
        if (row.status === 'Due Soon') variant = 'info';
        if (row.status === 'Overdue') variant = 'warning';
        if (row.status === 'Critical') variant = 'danger';
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    }
  ];

  const filteredData = realData.filter((item) => {
    let match = true;
    if (search) match = match && item.customerName.toLowerCase().includes(search.toLowerCase());
    if (partyType) match = match && item.partyType === partyType;
    if (status) match = match && item.status === status;
    if (branch) match = match && item.branch === branch;
    return match;
  });

  // Analytics
  const totalOutstanding = filteredData.reduce((sum, item) => sum + item.outstandingAmountNumber, 0);
  const overdueCount = filteredData.filter(item => item.status === 'Overdue' || item.status === 'Critical').length;
  const criticalCount = filteredData.filter(item => item.status === 'Critical').length;
  const criticalAmount = filteredData
    .filter(item => item.status === 'Critical')
    .reduce((sum, item) => sum + item.outstandingAmountNumber, 0);
  const collectionEfficiency = totalOutstanding > 0 ? Math.round(100 - ((criticalAmount / totalOutstanding) * 100)) : 100;

  const formatCurrency = (val: number) => {
    if (val >= 10000000) return `₹ ${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹ ${(val / 100000).toFixed(2)} L`;
    return `₹ ${val.toLocaleString('en-IN')}`;
  };

  const getExportData = () => {
    const timestamp = new Date().toLocaleString();
    const activeFilters = [
      search && `Search: ${search}`,
      partyType && `Party Type: ${partyType}`,
      status && `Status: ${status}`,
      branch && `Branch: ${branch}`
    ].filter(Boolean).join(' | ');

    return [
      ['Pending Payment Tracking Report'],
      ['Generated On:', timestamp],
      ['Filters Applied:', activeFilters || 'None'],
      [''],
      ['Customer Code', 'Customer Name', 'Party Type', 'Invoice No', 'Invoice Date', 'Due Date', 'Outstanding Amount', 'Days Overdue', 'Status'],
      ...filteredData.map(item => [
        item.customerCode,
        item.customerName,
        item.partyType,
        item.invoiceNo,
        new Date(item.invoiceDate).toLocaleDateString(),
        new Date(item.dueDate).toLocaleDateString(),
        item.outstandingAmountNumber,
        item.daysOverdue,
        item.status
      ])
    ];
  };

  const handleExportCSV = () => {
    const data = getExportData();
    const csvContent = data.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Pending_Payments_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    setIsExportOpen(false);
  };

  const handleExportExcel = () => {
    const data = getExportData();
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Pending Payments');
    XLSX.writeFile(wb, `Pending_Payments_${new Date().toISOString().split('T')[0]}.xlsx`);
    setIsExportOpen(false);
  };

  return (
    <div className="p-6">
      <PageHeader 
        title="Pending Payment Tracking" 
        subtitle="Monitor outstanding invoices, overdue payments, and collection efficiency"
        action={
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setIsExportOpen(!isExportOpen)}
              className="flex items-center gap-2 bg-[#163c78] text-white px-4 py-2 rounded-xl hover:bg-[#0c1f3d] transition-all shadow-sm hover:shadow active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span className="font-medium">Export</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${isExportOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isExportOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 shadow-lg rounded-xl overflow-hidden z-50 animate-in slide-in-from-top-2 duration-200">
                <div className="p-1">
                  <button
                    onClick={handleExportCSV}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-[#163c78] rounded-lg transition-colors text-left"
                  >
                    <FileText className="w-4 h-4" />
                    Export CSV
                  </button>
                  <button
                    onClick={handleExportExcel}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-[#163c78] rounded-lg transition-colors text-left mt-1"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    Export Excel (.xlsx)
                  </button>
                </div>
              </div>
            )}
          </div>
        }
      />

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <SummaryCard 
          title="Total Outstanding" 
          value={formatCurrency(totalOutstanding)} 
          icon={<IndianRupee className="w-6 h-6 text-blue-600" />} 
          colorClass="text-blue-600" 
          bgClass="bg-blue-100/50 border border-blue-200" 
        />
        <SummaryCard 
          title="Overdue Invoices" 
          value={overdueCount.toString()} 
          icon={<Clock className="w-6 h-6 text-amber-600" />} 
          colorClass="text-amber-600" 
          bgClass="bg-amber-100/50 border border-amber-200" 
        />
        <SummaryCard 
          title="Critical (>30 Days)" 
          value={criticalCount.toString()} 
          icon={<AlertCircle className="w-6 h-6 text-rose-600" />} 
          colorClass="text-rose-600" 
          bgClass="bg-rose-100/50 border border-rose-200 shadow-[0_0_15px_rgba(225,29,72,0.15)]" 
        />
        <SummaryCard 
          title="Collection Efficiency" 
          value={`${collectionEfficiency}%`} 
          icon={<Percent className="w-6 h-6 text-emerald-600" />} 
          colorClass="text-emerald-600" 
          bgClass="bg-emerald-100/50 border border-emerald-200" 
        />
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-wrap items-center gap-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Search customer name..." />
        <SelectFilter
          value={partyType} onChange={setPartyType}
          options={[
            { label: 'Distributor', value: 'Distributor' },
            { label: 'Retailer', value: 'Retailer' },
            { label: 'Hospital', value: 'Hospital' },
          ]}
          placeholder="Party Type"
        />
        <SelectFilter
          value={status} onChange={setStatus}
          options={[
            { label: 'Due Soon', value: 'Due Soon' },
            { label: 'Overdue', value: 'Overdue' },
            { label: 'Critical', value: 'Critical' },
            { label: 'Paid', value: 'Paid' },
          ]}
          placeholder="Status"
        />
        <SelectFilter
          value={branch} onChange={setBranch}
          options={[
            { label: 'Main Warehouse', value: 'Main Warehouse' }
          ]}
          placeholder="Branch"
        />
      </div>

      {/* Main Table with hidden scrollbar */}
      <div className="mb-6">
        <h3 className="font-bold text-slate-800 mb-4 px-1">Pending Invoice Details</h3>
        <TableCard>
          <div className="pending-payment-table-container">
            <DataTable columns={columns} data={filteredData} />
          </div>
        </TableCard>
      </div>
      
      <style>{`
        .pending-payment-table-container .overflow-x-auto {
          scrollbar-width: none; /* Firefox */
          -ms-overflow-style: none; /* IE and Edge */
        }
        .pending-payment-table-container .overflow-x-auto::-webkit-scrollbar {
          display: none; /* Chrome, Safari, Opera */
        }
      `}</style>
    </div>
  );
}
