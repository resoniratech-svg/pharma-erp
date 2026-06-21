import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Filter, Receipt, FileText, Layers, Eye, Download, Calculator, ChevronDown } from 'lucide-react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

import {
  PageHeader,
  FilterBar,
  SearchInput,
  SelectFilter,
  ActionButton,
  TableCard,
  DataTable,
  Badge,
  SummaryCard,
  Drawer,
  DrawerField
} from './components/shared';
import { type Column, type BadgeVariant } from './components/shared';

// --- TYPES ---

interface GstBreakdown {
  slab: string;
  taxableAmount: number;
  gstAmount: number;
}

interface InvoiceItem {
  id: string;
  invoiceNo: string;
  customerName: string;
  productCount: number;
  invoiceDate: string;
  status: 'Draft' | 'Generated' | 'Approved' | 'Cancelled';
  gstBreakdowns: GstBreakdown[];
}

// --- HELPERS ---

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

const getStatusVariant = (status: InvoiceItem['status']): BadgeVariant => {
  switch (status) {
    case 'Approved': return 'success';
    case 'Generated': return 'info';
    case 'Draft': return 'warning';
    case 'Cancelled': return 'danger';
    default: return 'neutral';
  }
};

const getFormattedDate = () => {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
};

// --- MOCK DATA ---

const initialInvoices: InvoiceItem[] = [
  {
    id: '1', invoiceNo: 'INV-2026-001', customerName: 'Apollo Pharmacy', productCount: 15, invoiceDate: '2026-06-10', status: 'Approved',
    gstBreakdowns: [
      { slab: '5%', taxableAmount: 20000, gstAmount: 1000 },
      { slab: '12%', taxableAmount: 25000, gstAmount: 3000 }
    ]
  },
  {
    id: '2', invoiceNo: 'INV-2026-002', customerName: 'Care Hospitals', productCount: 8, invoiceDate: '2026-06-11', status: 'Generated',
    gstBreakdowns: [
      { slab: '12%', taxableAmount: 10000, gstAmount: 1200 },
      { slab: '18%', taxableAmount: 2500, gstAmount: 450 }
    ]
  },
  {
    id: '3', invoiceNo: 'INV-2026-003', customerName: 'MedPlus Store', productCount: 30, invoiceDate: '2026-06-12', status: 'Draft',
    gstBreakdowns: [
      { slab: '18%', taxableAmount: 120000, gstAmount: 21600 }
    ]
  },
  {
    id: '4', invoiceNo: 'INV-2026-004', customerName: 'City Clinic', productCount: 3, invoiceDate: '2026-06-14', status: 'Cancelled',
    gstBreakdowns: [
      { slab: '5%', taxableAmount: 3400, gstAmount: 170 }
    ]
  },
  {
    id: '5', invoiceNo: 'INV-2026-005', customerName: 'Wellness Medicos', productCount: 42, invoiceDate: '2026-06-15', status: 'Approved',
    gstBreakdowns: [
      { slab: '0%', taxableAmount: 5000, gstAmount: 0 },
      { slab: '12%', taxableAmount: 45000, gstAmount: 5400 },
      { slab: '28%', taxableAmount: 15000, gstAmount: 4200 }
    ]
  }
];

// --- COMPONENT ---

export default function MultiRateBilling() {
  const [data] = useState<InvoiceItem[]>(initialInvoices);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [slabFilter, setSlabFilter] = useState('');
  const [dateRangeFilter, setDateRangeFilter] = useState('');

  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  const [viewRecord, setViewRecord] = useState<InvoiceItem | null>(null);
  const [breakdownRecord, setBreakdownRecord] = useState<InvoiceItem | null>(null);

  // Handle clicking outside export menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // --- DERIVED DATA / FILTERING ---

  const filteredInvoices = useMemo(() => {
    return data.filter((item) => {
      const s = search.toLowerCase();
      const matchSearch = item.invoiceNo.toLowerCase().includes(s) || item.customerName.toLowerCase().includes(s);
      const matchStatus = statusFilter ? item.status === statusFilter : true;
      
      const hasSlab = slabFilter ? item.gstBreakdowns.some(b => b.slab === slabFilter) : true;
      
      // Simple date range matching for demonstration
      let matchDate = true;
      if (dateRangeFilter === 'Last 7 Days') {
        matchDate = new Date(item.invoiceDate) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      } else if (dateRangeFilter === 'This Month') {
        const itemDate = new Date(item.invoiceDate);
        const today = new Date();
        matchDate = itemDate.getMonth() === today.getMonth() && itemDate.getFullYear() === today.getFullYear();
      }

      return matchSearch && matchStatus && hasSlab && matchDate;
    });
  }, [data, search, statusFilter, slabFilter, dateRangeFilter]);

  // Map to flat table rows with computed totals
  const tableData = useMemo(() => {
    return filteredInvoices.map(inv => {
      const taxableAmount = inv.gstBreakdowns.reduce((acc, curr) => acc + curr.taxableAmount, 0);
      const gstAmount = inv.gstBreakdowns.reduce((acc, curr) => acc + curr.gstAmount, 0);
      const netAmount = taxableAmount + gstAmount;
      const gstSlabs = inv.gstBreakdowns.map(b => b.slab).join(', ');
      
      return {
        ...inv,
        taxableAmount,
        gstAmount,
        netAmount,
        gstSlabs
      };
    });
  }, [filteredInvoices]);

  // Aggregate GST Summary
  const gstSummaryData = useMemo(() => {
    const summaryMap: Record<string, { count: number; billingValue: number }> = {
      '0%': { count: 0, billingValue: 0 },
      '5%': { count: 0, billingValue: 0 },
      '12%': { count: 0, billingValue: 0 },
      '18%': { count: 0, billingValue: 0 },
      '28%': { count: 0, billingValue: 0 }
    };

    filteredInvoices.forEach(inv => {
      inv.gstBreakdowns.forEach(b => {
        if (summaryMap[b.slab]) {
          summaryMap[b.slab].count += 1; // Count invoice for this slab
          summaryMap[b.slab].billingValue += b.taxableAmount + b.gstAmount;
        }
      });
    });

    return Object.entries(summaryMap)
      .filter(([_, data]) => data.count > 0)
      .map(([slab, data]) => ({
        id: slab,
        slab,
        invoiceCount: data.count,
        billingValue: formatCurrency(data.billingValue)
      }));
  }, [filteredInvoices]);

  // KPI Calculations
  const totalInvoices = filteredInvoices.length;
  const totalBillingValue = tableData.reduce((acc, curr) => acc + curr.netAmount, 0);
  const totalGstLiability = tableData.reduce((acc, curr) => acc + curr.gstAmount, 0);

  // --- EXPORTS ---

  const handleExportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(tableData.map(row => ({
      'Invoice No': row.invoiceNo,
      'Customer Name': row.customerName,
      'Invoice Date': row.invoiceDate,
      'Product Count': row.productCount,
      'GST Slabs': row.gstSlabs,
      'Taxable Amount': row.taxableAmount,
      'GST Amount': row.gstAmount,
      'Net Amount': row.netAmount,
      'Status': row.status
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'MultiRateInvoices');
    XLSX.writeFile(workbook, `MultiRateInvoices_${getFormattedDate()}.xlsx`);
    setShowExportMenu(false);
  };

  const handleExportDetailedExcel = () => {
    const flatData: any[] = [];
    filteredInvoices.forEach(inv => {
      inv.gstBreakdowns.forEach(b => {
        flatData.push({
          'Invoice No': inv.invoiceNo,
          'Customer Name': inv.customerName,
          'Invoice Date': inv.invoiceDate,
          'Status': inv.status,
          'GST Slab': b.slab,
          'Taxable Amount': b.taxableAmount,
          'GST Amount': b.gstAmount,
          'Net Amount': b.taxableAmount + b.gstAmount
        });
      });
    });

    const worksheet = XLSX.utils.json_to_sheet(flatData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'DetailedRegister');
    XLSX.writeFile(workbook, `MultiRateDetailedRegister_${getFormattedDate()}.xlsx`);
    setShowExportMenu(false);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF('landscape');
    doc.setFontSize(16);
    doc.text('Multi Rate Invoice Register', 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated On: ${new Date().toLocaleString()}`, 14, 22);
    
    // Add applied filters text
    let filtersText = `Filters: Status: ${statusFilter || 'All'}, Slab: ${slabFilter || 'All'}, Date Range: ${dateRangeFilter || 'All'}`;
    if (search) filtersText += `, Search: "${search}"`;
    doc.text(filtersText, 14, 28);

    const pdfTableData = tableData.map(row => [
      row.invoiceNo, row.customerName, row.invoiceDate, row.productCount.toString(),
      row.gstSlabs, formatCurrency(row.taxableAmount), formatCurrency(row.gstAmount),
      formatCurrency(row.netAmount), row.status
    ]);

    (doc as any).autoTable({
      head: [['Invoice No', 'Customer Name', 'Date', 'Items', 'GST Slabs', 'Taxable', 'GST Amount', 'Net Amount', 'Status']],
      body: pdfTableData,
      startY: 35,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [79, 70, 229] }
    });

    doc.save(`MultiRateInvoices_${getFormattedDate()}.pdf`);
    setShowExportMenu(false);
  };

  const handleExportGstSummaryPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('GST Slab Summary Report', 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated On: ${new Date().toLocaleString()}`, 14, 22);
    doc.text(`Total GST Liability: ${formatCurrency(totalGstLiability)}`, 14, 28);

    const pdfTableData = gstSummaryData.map(row => [
      row.slab, row.invoiceCount.toString(), row.billingValue
    ]);

    (doc as any).autoTable({
      head: [['GST Slab', 'Invoice Count', 'Billing Value']],
      body: pdfTableData,
      startY: 35,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [79, 70, 229] }
    });

    doc.save(`GSTSummaryReport_${getFormattedDate()}.pdf`);
    setShowExportMenu(false);
  };

  const downloadInvoicePDF = (record: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Invoice: ${record.invoiceNo}`, 14, 20);
    doc.setFontSize(12);
    doc.text(`Customer: ${record.customerName}`, 14, 30);
    doc.text(`Invoice Date: ${record.invoiceDate}`, 14, 40);
    doc.text(`Taxable Amount: ${formatCurrency(record.taxableAmount)}`, 14, 50);
    doc.text(`GST Amount: ${formatCurrency(record.gstAmount)}`, 14, 60);
    doc.text(`Net Amount: ${formatCurrency(record.netAmount)}`, 14, 70);
    doc.text(`Status: ${record.status}`, 14, 80);
    
    doc.save(`${record.invoiceNo}.pdf`);
  };

  // --- COLUMNS ---

  const invoiceColumns: Column<typeof tableData[0]>[] = [
    { key: 'invoiceNo', label: 'Invoice No', render: (row) => <span className="font-semibold text-slate-900">{row.invoiceNo}</span> },
    { key: 'customerName', label: 'Customer Name', render: (row) => <span className="font-medium text-violet-700">{row.customerName}</span> },
    { key: 'invoiceDate', label: 'Invoice Date' },
    { key: 'productCount', label: 'Product Count', render: (row) => <span className="font-mono text-slate-700">{row.productCount}</span> },
    { key: 'gstSlabs', label: 'GST Slabs', render: (row) => <span className="text-slate-600">{row.gstSlabs}</span> },
    { key: 'taxableAmount', label: 'Taxable Amount', render: (row) => <span>{formatCurrency(row.taxableAmount)}</span> },
    { key: 'gstAmount', label: 'GST Amount', render: (row) => <span>{formatCurrency(row.gstAmount)}</span> },
    { key: 'netAmount', label: 'Net Amount', render: (row) => <span className="font-bold text-slate-800">{formatCurrency(row.netAmount)}</span> },
    { key: 'status', label: 'Status', render: (row) => <Badge variant={getStatusVariant(row.status)}>{row.status}</Badge> },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          <button onClick={() => setViewRecord(row)} className="text-slate-400 hover:text-violet-600 transition-colors p-1" title="View">
            <Eye className="w-4 h-4" />
          </button>
          <button onClick={() => setBreakdownRecord(row)} className="text-amber-600 hover:text-amber-700 p-1 font-semibold flex items-center gap-1 text-xs" title="GST Breakdown">
            <Calculator className="w-3.5 h-3.5" /> GST Breakdown
          </button>
          <button onClick={(e) => downloadInvoicePDF(row, e)} className="text-slate-400 hover:text-emerald-600 p-1 font-semibold flex items-center gap-1 text-xs" title="Download PDF">
            <Download className="w-3.5 h-3.5" /> Docs
          </button>
        </div>
      )
    }
  ];

  const gstSummaryColumns: Column<{ slab: string; invoiceCount: number; billingValue: string }>[] = [
    { key: 'slab', label: 'GST Slab', render: (row) => <span className="font-semibold text-slate-900">{row.slab}</span> },
    { key: 'invoiceCount', label: 'Invoice Count', render: (row) => <span className="font-mono text-slate-700">{row.invoiceCount}</span> },
    { key: 'billingValue', label: 'Billing Value', render: (row) => <span className="font-bold text-slate-800">{row.billingValue}</span> }
  ];

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Multi Rate Billing"
        subtitle="Monitor and review invoices containing multiple GST slabs within the same invoice."
        actions={
          <div className="relative inline-block text-left" ref={exportMenuRef}>
            <ActionButton 
              variant="secondary" 
              onClick={() => setShowExportMenu(!showExportMenu)}
            >
              Export
              <ChevronDown className="w-3 h-3 ml-1" />
            </ActionButton>
            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50 py-1">
                <button onClick={handleExportExcel} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">Export Excel (.xlsx)</button>
                <button onClick={handleExportPDF} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">Export PDF (.pdf)</button>
                <button onClick={handleExportGstSummaryPDF} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">GST Summary Report (.pdf)</button>
                <button onClick={handleExportDetailedExcel} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">Detailed Invoice Register (.xlsx)</button>
              </div>
            )}
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <SummaryCard
          title="Total Multi Rate Invoices"
          value={totalInvoices.toString()}
          subtitle="Filtered count"
          icon={<Receipt className="w-6 h-6" />}
          colorClass="text-violet-600"
          bgClass="bg-violet-50"
        />
        <SummaryCard
          title="Total Billing Value"
          value={formatCurrency(totalBillingValue)}
          subtitle="Filtered net amount"
          icon={<FileText className="w-6 h-6" />}
          colorClass="text-emerald-600"
          bgClass="bg-emerald-50"
        />
        <SummaryCard
          title="GST Liability"
          value={formatCurrency(totalGstLiability)}
          subtitle="Filtered GST amount"
          icon={<Layers className="w-6 h-6" />}
          colorClass="text-amber-600"
          bgClass="bg-amber-50"
        />
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">GST Summary</h2>
        <TableCard>
          <DataTable
            columns={gstSummaryColumns}
            data={gstSummaryData}
            emptyMessage="No summary data."
          />
        </TableCard>
      </div>

      {/* Main Invoice Table */}
      <h2 className="text-lg font-semibold text-slate-900 mb-4">Multi Rate Invoice Register</h2>
      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search by invoice no or customer..." />
        <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-600">Filters:</span>
        </div>
        <SelectFilter
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { label: 'All Status', value: '' },
            { label: 'Draft', value: 'Draft' },
            { label: 'Generated', value: 'Generated' },
            { label: 'Approved', value: 'Approved' },
            { label: 'Cancelled', value: 'Cancelled' },
          ]}
          placeholder="Invoice Status"
        />
        <SelectFilter
          value={slabFilter}
          onChange={setSlabFilter}
          options={[
            { label: 'All Slabs', value: '' },
            { label: '0%', value: '0%' },
            { label: '5%', value: '5%' },
            { label: '12%', value: '12%' },
            { label: '18%', value: '18%' },
            { label: '28%', value: '28%' },
          ]}
          placeholder="GST Slab"
        />
        <SelectFilter
          value={dateRangeFilter}
          onChange={setDateRangeFilter}
          options={[
            { label: 'All Dates', value: '' },
            { label: 'Last 7 Days', value: 'Last 7 Days' },
            { label: 'This Month', value: 'This Month' }
          ]}
          placeholder="Date Range"
        />
      </FilterBar>

      <TableCard>
        <div className="[&>div::-webkit-scrollbar]:hidden [&>div]:[-ms-overflow-style:none] [&>div]:[scrollbar-width:none]">
          <DataTable
            columns={invoiceColumns}
            data={tableData}
            emptyMessage="No multi-rate invoices found."
          />
        </div>
      </TableCard>

      {/* VIEW DRAWER */}
      <Drawer open={!!viewRecord} onClose={() => setViewRecord(null)} title="View Invoice Details">
        {viewRecord && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">1. Basic Information</h3>
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
                <DrawerField label="Invoice No" value={<span className="font-semibold text-slate-900">{viewRecord.invoiceNo}</span>} />
                <DrawerField label="Customer Name" value={<span className="font-medium text-violet-700">{viewRecord.customerName}</span>} />
                <DrawerField label="Invoice Date" value={viewRecord.invoiceDate} />
                <DrawerField label="Status" value={<Badge variant={getStatusVariant(viewRecord.status)}>{viewRecord.status}</Badge>} />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">2. Billing Summary</h3>
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
                <DrawerField label="Product Count" value={viewRecord.productCount} />
                <DrawerField label="Taxable Amount" value={formatCurrency((viewRecord as any).taxableAmount)} />
                <DrawerField label="Total GST Amount" value={formatCurrency((viewRecord as any).gstAmount)} />
                <DrawerField label="Net Amount" value={<span className="font-bold text-slate-900">{formatCurrency((viewRecord as any).netAmount)}</span>} />
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
              <ActionButton variant="secondary" onClick={() => setViewRecord(null)}>Close</ActionButton>
            </div>
          </div>
        )}
      </Drawer>

      {/* GST BREAKDOWN DRAWER */}
      <Drawer open={!!breakdownRecord} onClose={() => setBreakdownRecord(null)} title="GST Breakdown">
        {breakdownRecord && (
          <div className="space-y-6">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-amber-800">
                Slab-wise GST calculation for Invoice <strong>{breakdownRecord.invoiceNo}</strong>
              </p>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 text-xs font-semibold text-slate-600 border-b border-slate-200 uppercase">
                  <tr>
                    <th className="px-4 py-3">GST Slab</th>
                    <th className="px-4 py-3 text-right">Taxable Amount</th>
                    <th className="px-4 py-3 text-right">GST Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {breakdownRecord.gstBreakdowns.map((b, idx) => (
                    <tr key={idx}>
                      <td className="px-4 py-3 font-medium text-slate-800">{b.slab}</td>
                      <td className="px-4 py-3 text-right text-slate-600">{formatCurrency(b.taxableAmount)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-800">{formatCurrency(b.gstAmount)}</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-50 font-bold">
                    <td className="px-4 py-3 text-slate-900">Total</td>
                    <td className="px-4 py-3 text-right text-slate-900">{formatCurrency((breakdownRecord as any).taxableAmount)}</td>
                    <td className="px-4 py-3 text-right text-slate-900">{formatCurrency((breakdownRecord as any).gstAmount)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
              <ActionButton variant="secondary" onClick={() => setBreakdownRecord(null)}>Close</ActionButton>
            </div>
          </div>
        )}
      </Drawer>

    </div>
  );
}
