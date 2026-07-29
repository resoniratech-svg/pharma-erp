import { useState, useMemo, useEffect, useRef } from 'react';
import { Download, Eye,  Filter, ChevronDown, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import authService from '../../services/authService';

import {
  PageHeader, FilterBar, SearchInput, SelectFilter, ActionButton,
  TableCard, DataTable, Badge, Drawer, DrawerField
} from './components/shared';
import { type Column, type BadgeVariant } from './components/shared';

// --- Types ---
interface Invoice {
  invoiceNo: string;
  date: string;
  amount: number;
  paidAmount?: number;
  id?: string;
  dueDate: string;
  agingDays: number;
  status: 'Paid' | 'Partially Paid' | 'Unpaid' | 'Overdue';
}

interface OutstandingRecord {
  id: string;
  distributorName: string;
  distributorCode: string;
  contactPerson: string;
  mobile: string;
  gstin: string;
  creditLimit: number;
  usedCredit: number;
  availableCredit: number;
  totalOutstanding: number;
  overdueAmount: number;
  maxAging: number;
  status: 'Clear' | 'Overdue';
  lastPaymentDate: string;
  invoices: Invoice[];
  paymentType?: string;
  creditDays?: number;
  paymentTerms?: string;
}

const formatCurrency = (amount: number) => `₹ ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const getDDMMYYYY = (date: Date) => {
  if (isNaN(date.getTime())) return '-';
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}-${m}-${y}`;
};

const parseDateString = (dateStr: string) => {
  if (!dateStr || dateStr === '-') return new Date(NaN);
  if (dateStr.includes('-')) {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      if (parts[2].length === 4) { // DD-MM-YYYY
        return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
      } else if (parts[0].length === 4) { // YYYY-MM-DD
        return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      }
    }
  }
  return new Date(dateStr);
};

const calculateAging = (dateStr: string) => {
  const invoiceDate = parseDateString(dateStr);
  if (isNaN(invoiceDate.getTime())) return 0;
  const diffTime = new Date().getTime() - invoiceDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
};

const getOutstandingAmount = (inv: Invoice) => {
  const paid = inv.paidAmount || 0;
  return Math.max(0, inv.amount - paid);
};

const getPaidAmount = (inv: Invoice) => {
  return inv.paidAmount || 0;
};

const getInvoiceStatus = (inv: Invoice): Invoice['status'] => {
  const outstanding = getOutstandingAmount(inv);
  if (outstanding <= 0) return 'Paid';
  
  const dueDate = parseDateString(inv.dueDate);
  if (!isNaN(dueDate.getTime())) {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    if (now > dueDate) {
      return 'Overdue';
    }
  }
  
  if ((inv.paidAmount || 0) > 0) return 'Partially Paid';
  
  return 'Unpaid';
};

export default function OutstandingTracking() {
  const loggedInDistributorCode = useMemo(() => {
    const user = authService.getCurrentUser();
    const role = localStorage.getItem('activeRole') || (user as any)?.role || '';
    if (role === 'SUPER_ADMIN') {
      return '';
    }
    let code = (user as any)?.linkedDistributorCode || (user as any)?.distributorCode || '';
    if (!code && user?.email === 'distributor@pharmaerp.com') {
      return 'DIST-001';
    }
    return code;
  }, []);

  const [records, setRecords] = useState<OutstandingRecord[]>([]);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateRange, setDateRange] = useState('');
  const [agingFilter, setAgingFilter] = useState('');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // Drawer
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    const trackingData = localStorage.getItem('pharma_erp_outstanding_records');
    if (trackingData) {
      try {
        const parsed = JSON.parse(trackingData);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setRecords(parsed);
          return;
        }
      } catch (e) {}
    }

    const defaultSeedOutstanding: OutstandingRecord[] = [
      {
        id: 'OUT-001',
        distributorName: 'Metro Pharma Distributors',
        distributorCode: 'DIST-001',
        contactPerson: 'Rajesh Kumar',
        mobile: '+91 98765 43210',
        gstin: '27AAAAA0000A1Z5',
        creditLimit: 500000,
        usedCredit: 125000,
        availableCredit: 375000,
        totalOutstanding: 125000,
        overdueAmount: 45000,
        maxAging: 42,
        status: 'Overdue',
        lastPaymentDate: '10-10-2026',
        paymentType: 'Credit',
        creditDays: 30,
        paymentTerms: '30 Days Net',
        invoices: [
          { invoiceNo: 'INV-2026-089', date: '01-09-2026', amount: 45000, paidAmount: 0, dueDate: '01-10-2026', agingDays: 42, status: 'Overdue' },
          { invoiceNo: 'INV-2026-095', date: '05-10-2026', amount: 80000, paidAmount: 0, dueDate: '05-11-2026', agingDays: 17, status: 'Unpaid' }
        ]
      },
      {
        id: 'OUT-002',
        distributorName: 'Global Health Supply',
        distributorCode: 'DIST-002',
        contactPerson: 'Suresh Verma',
        mobile: '+91 98111 22233',
        gstin: '07BBBBB1111B2Z6',
        creditLimit: 750000,
        usedCredit: 150000,
        availableCredit: 600000,
        totalOutstanding: 150000,
        overdueAmount: 0,
        maxAging: 12,
        status: 'Clear',
        lastPaymentDate: '12-10-2026',
        paymentType: 'Credit',
        creditDays: 45,
        paymentTerms: '45 Days Net',
        invoices: [
          { invoiceNo: 'INV-2026-102', date: '10-10-2026', amount: 150000, paidAmount: 0, dueDate: '25-11-2026', agingDays: 12, status: 'Unpaid' }
        ]
      }
    ];

    setRecords(defaultSeedOutstanding);
    localStorage.setItem('pharma_erp_outstanding_records', JSON.stringify(defaultSeedOutstanding));
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // --- Identify My Record ---
  const myRecord = useMemo(() => {
    let rec = records.find(r => r.distributorCode === loggedInDistributorCode);
    if (!rec && records.length > 0) {
      rec = records[0];
    }
    
    if (!rec) {
      return {
        distributorName: 'Unknown Distributor',
        creditLimit: 0,
        availableCredit: 0,
        usedCredit: 0,
        totalOutstanding: 0,
        overdueAmount: 0,
        invoices: [],
        lastPaymentDate: '-',
        paymentType: 'Credit',
        creditDays: 30,
        paymentTerms: 'Standard'
      } as unknown as OutstandingRecord;
    }

    const invoices: Invoice[] = (rec.invoices || []).map(inv => {
      const status = getInvoiceStatus(inv);
      const agingDays = (status === 'Paid') ? 0 : calculateAging(inv.date);
      
      const fmtDate = getDDMMYYYY(parseDateString(inv.date));
      const fmtDueDate = getDDMMYYYY(parseDateString(inv.dueDate));
      
      return {
        ...inv,
        date: fmtDate,
        dueDate: fmtDueDate,
        agingDays,
        status
      };
    });

    const totalOutstanding = invoices.reduce((sum, inv) => sum + getOutstandingAmount(inv), 0);
    const overdueAmount = invoices.filter(inv => inv.status === 'Overdue').reduce((sum, inv) => sum + getOutstandingAmount(inv), 0);
    const usedCredit = totalOutstanding;
    const availableCredit = Math.max(0, rec.creditLimit - usedCredit);
    const lastPaymentDate = rec.lastPaymentDate && rec.lastPaymentDate !== '-' ? getDDMMYYYY(parseDateString(rec.lastPaymentDate)) : '-';

    return {
      ...rec,
      lastPaymentDate,
      invoices,
      totalOutstanding,
      overdueAmount,
      usedCredit,
      availableCredit,
      status: totalOutstanding > rec.creditLimit ? 'Overdue' : 'Clear',
      paymentType: rec.paymentType || 'Credit',
      creditDays: rec.creditDays || 30,
      paymentTerms: rec.paymentTerms || 'Standard'
    } as OutstandingRecord;
  }, [records, loggedInDistributorCode]);

  // --- Filtering ---
  const visibleInvoices = useMemo(() => {
    return myRecord.invoices.filter(inv => {
      const matchSearch = inv.invoiceNo.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter ? inv.status === statusFilter : true;
      const matchDate = dateRange ? inv.date === getDDMMYYYY(new Date(dateRange)) : true;
      
      let matchAging = true;
      if (agingFilter) {
        if (agingFilter === '0-30') matchAging = inv.agingDays <= 30;
        else if (agingFilter === '31-60') matchAging = inv.agingDays > 30 && inv.agingDays <= 60;
        else if (agingFilter === '60+') matchAging = inv.agingDays > 60;
      }
      
      return matchSearch && matchStatus && matchDate && matchAging;
    });
  }, [myRecord, search, statusFilter, dateRange, agingFilter]);

  // --- Export Protocols Engine ---
  const handleExportExcel = () => {
    const data = visibleInvoices.map(inv => ({
      'Invoice No': inv.invoiceNo,
      'Invoice Date': inv.date,
      'Due Date': inv.dueDate,
      'Amount': inv.amount,
      'Paid Amount': getPaidAmount(inv),
      'Outstanding': getOutstandingAmount(inv),
      'Aging Days': inv.status === 'Paid' ? 0 : inv.agingDays,
      'Status': inv.status
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Invoices');
    XLSX.writeFile(wb, `My_Invoices_${getDDMMYYYY(new Date())}.xlsx`);
    setShowExportMenu(false);
  };

  const formatPdfCurrency = (val: number) => {
    const num = Number(val) || 0;
    const formatted = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 2 }).format(num);
    return `Rs. ${formatted}`;
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Outstanding Balances & Invoices', 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated: ${getDDMMYYYY(new Date())}`, 14, 21);
    doc.text(`Distributor: ${myRecord.distributorName}`, 14, 27);

    autoTable(doc, {
      startY: 32,
      head: [['Invoice No', 'Date', 'Due Date', 'Outstanding', 'Aging Days', 'Status']],
      body: visibleInvoices.map(inv => [
        inv.invoiceNo, inv.date, inv.dueDate, formatPdfCurrency(getOutstandingAmount(inv)),
        inv.status === 'Paid' ? '-' : inv.agingDays, inv.status
      ]),
      theme: 'grid',
      headStyles: { fillColor: [22, 60, 120] }
    });
    doc.save(`My_Invoices_${getDDMMYYYY(new Date())}.pdf`);
    setShowExportMenu(false);
  };

  const handleDownloadInvoice = (inv: Invoice) => {
    const doc = new jsPDF();

    // 1. Company Header
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(22, 60, 120);
    doc.text('MJ HEALTHCARE ERP', 14, 20);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    doc.text('Plot No. 45, Pharma City, Industrial Park, Hyderabad - 500072', 14, 26);
    doc.text('GSTIN: 36AAACM1234F1Z9 | License: DL-HYD-2024-88', 14, 31);
    doc.text('Email: info@mjhealthcare.com | Phone: +91 98765 00000', 14, 36);

    // Document Title
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(22, 60, 120);
    doc.text('TAX INVOICE', 145, 20);

    doc.setDrawColor(200, 200, 200);
    doc.line(14, 42, 196, 42);

    // 2. Invoice Meta & Bill To Info
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(40, 40, 40);
    doc.text('Billed To (Distributor):', 14, 48);
    
    doc.setFont("helvetica", "normal");
    doc.text(`Name: ${myRecord.distributorName || 'Distributor'}`, 14, 54);
    doc.text(`Code: ${myRecord.distributorCode || 'N/A'}`, 14, 59);
    doc.text(`GSTIN: ${myRecord.gstin || '36AAAAA0000A1Z5'}`, 14, 64);
    doc.text(`Contact: ${myRecord.contactPerson || '-'} (${myRecord.mobile || '-'})`, 14, 69);

    doc.setFont("helvetica", "bold");
    doc.text('Invoice Details:', 125, 48);
    doc.setFont("helvetica", "normal");
    doc.text(`Invoice No: ${inv.invoiceNo}`, 125, 54);
    doc.text(`Invoice Date: ${inv.date}`, 125, 59);
    doc.text(`Due Date: ${inv.dueDate}`, 125, 64);
    doc.text(`Payment Terms: ${myRecord.paymentTerms || 'Net 30 Days'}`, 125, 69);
    doc.text(`Status: ${inv.status}`, 125, 74);

    // 3. Resolve Line Items from Saved Orders
    let lineItems: any[] = [];
    const orderNoFromInv = inv.invoiceNo.replace('INV-', 'ORD-');
    const savedOrders = localStorage.getItem('pharma_erp_orders');
    if (savedOrders) {
      try {
        const orders = JSON.parse(savedOrders);
        const matchingOrder = orders.find((o: any) => o.orderNo === orderNoFromInv || o.id === inv.id || o.orderNo === inv.invoiceNo);
        if (matchingOrder && Array.isArray(matchingOrder.items)) {
          lineItems = matchingOrder.items;
        }
      } catch (e) {}
    }

    if (lineItems.length === 0) {
      const invTotal = inv.amount > 0 ? inv.amount : 15120;
      lineItems = [
        {
          productName: 'Pharmaceutical Supplies & Medicines Batch A',
          productCode: 'PRD-MED-001',
          quantity: 100,
          ptr: Math.round((invTotal / 1.12 / 100) * 100) / 100,
          amount: Math.round((invTotal / 1.12) * 100) / 100
        }
      ];
    }

    const tableBody = lineItems.map((item, idx) => [
      String(idx + 1),
      item.productName || 'Pharmaceutical Item',
      item.productCode || `PRD-00${idx + 1}`,
      String(item.quantity || 1),
      formatPdfCurrency(item.ptr || item.price || item.amount),
      formatPdfCurrency(item.amount || (item.quantity * item.ptr))
    ]);

    autoTable(doc, {
      startY: 80,
      head: [['#', 'Product Description', 'Product Code', 'Qty', 'PTR Rate', 'Total Amount']],
      body: tableBody,
      theme: 'grid',
      headStyles: { fillColor: [22, 60, 120], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 3 }
    });

    const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 8 : 140;

    // 4. Amount Financial Summary Box
    const paidAmt = getPaidAmount(inv);
    const outstandingAmt = getOutstandingAmount(inv);
    const totalAmt = inv.amount > 0 ? inv.amount : (paidAmt + outstandingAmt);
    const subtotal = totalAmt / 1.12;
    const gstAmt = totalAmt - subtotal;

    doc.setFillColor(245, 247, 250);
    doc.rect(115, finalY, 81, 42, 'F');
    doc.setDrawColor(220, 225, 230);
    doc.rect(115, finalY, 81, 42, 'S');

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);

    doc.text('Subtotal (Excl. Tax):', 119, finalY + 7);
    doc.text(formatPdfCurrency(subtotal), 190, finalY + 7, { align: 'right' });

    doc.text('GST Amount (12%):', 119, finalY + 14);
    doc.text(formatPdfCurrency(gstAmt), 190, finalY + 14, { align: 'right' });

    doc.setFont("helvetica", "bold");
    doc.setTextColor(22, 60, 120);
    doc.text('Total Invoice Amount:', 119, finalY + 22);
    doc.text(formatPdfCurrency(totalAmt), 190, finalY + 22, { align: 'right' });

    doc.setFont("helvetica", "normal");
    doc.setTextColor(16, 185, 129);
    doc.text('Amount Paid:', 119, finalY + 29);
    doc.text(formatPdfCurrency(paidAmt), 190, finalY + 29, { align: 'right' });

    doc.setFont("helvetica", "bold");
    doc.setTextColor(225, 29, 72);
    doc.text('Outstanding Balance:', 119, finalY + 36);
    doc.text(formatPdfCurrency(outstandingAmt), 190, finalY + 36, { align: 'right' });

    // Footer
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(120, 120, 120);
    doc.text('This is a computer generated invoice and does not require a physical signature.', 14, finalY + 48);

    doc.save(`${inv.invoiceNo}.pdf`);
  };

  // --- Grid Column Models ---
  const columns: Column<Invoice>[] = [
    { key: 'invoiceNo', label: 'Invoice No', render: (row) => <span className="font-semibold text-slate-900">{row.invoiceNo}</span> },
    { key: 'date', label: 'Invoice Date', render: (row) => <span className="text-slate-600">{row.date}</span> },
    { key: 'dueDate', label: 'Due Date', render: (row) => <span className="text-slate-600">{row.dueDate}</span> },
    { key: 'amount', label: 'Outstanding Amount', render: (row) => <span className="font-bold text-slate-900">{formatCurrency(getOutstandingAmount(row))}</span> },
    { key: 'agingDays', label: 'Aging (Days)', render: (row) => <span className={`font-mono ${(row.status === 'Unpaid' || row.status === 'Overdue') && row.agingDays > 30 ? 'text-amber-600 font-bold' : 'text-slate-600'}`}>{row.status === 'Paid' ? '-' : row.agingDays}</span> },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        let variant: BadgeVariant = 'neutral';
        if (row.status === 'Paid') variant = 'success';
        else if (row.status === 'Partially Paid') variant = 'info';
        else if (row.status === 'Unpaid') variant = 'warning';
        else if (row.status === 'Overdue') variant = 'danger';
        return <Badge variant={variant}>{row.status}</Badge>;
      }
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          <button onClick={() => setSelectedInvoice(row)} className="text-slate-400 hover:text-[#163c78] p-1 transition-colors" title="View Invoice">
            <Eye className="w-4 h-4" />
          </button>
          <button onClick={() => handleDownloadInvoice(row)} className="text-slate-400 hover:text-slate-900 transition-colors p-1" title="Download Invoice">
            <FileText className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Outstanding Tracking"
        subtitle="Track and manage your outstanding invoices and account balance."
        actions={
          <div className="relative inline-block text-left" ref={exportMenuRef}>
            <ActionButton 
              variant="secondary" 
              icon={<Download className="w-4 h-4" />}
              onClick={() => setShowExportMenu(!showExportMenu)}
            >
              Export Statement
              <ChevronDown className="w-3 h-3 ml-1" />
            </ActionButton>
            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                <div className="py-1">
                  <button onClick={handleExportExcel} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">Export Excel (.xlsx)</button>
                  <button onClick={handleExportPDF} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">Export PDF Report (.pdf)</button>
                </div>
              </div>
            )}
          </div>
        }
      />

      {/* --- Executive Dashboard KPI Metrics Panel Header Layout --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Total Outstanding</span>
            <span className="text-2xl font-black text-slate-900">{formatCurrency(myRecord.totalOutstanding || 0)}</span>
          </div>
          {/* <div className="p-3 bg-[#163c78]/10 text-[#163c78] rounded-xl"><DollarSign className="w-6 h-6" /></div> */}
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Overdue Amount</span>
            <span className={`text-2xl font-black ${(myRecord.overdueAmount || 0) > 0 ? 'text-rose-600' : 'text-slate-900'}`}>{formatCurrency(myRecord.overdueAmount || 0)}</span>
          </div>
          {/* <div className="p-3 bg-rose-50 text-rose-600 rounded-xl"><DollarSign className="w-6 h-6" /></div> */}
        </div>
      </div>

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search by invoice number..." />
        <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-600">Filters:</span>
        </div>
        <SelectFilter
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { label: 'Paid', value: 'Paid' },
            { label: 'Partially Paid', value: 'Partially Paid' },
            { label: 'Unpaid', value: 'Unpaid' },
            { label: 'Overdue', value: 'Overdue' }
          ]}
          placeholder="Status"
        />
        <SelectFilter
          value={agingFilter}
          onChange={setAgingFilter}
          options={[
            { label: '0-30 Days', value: '0-30' },
            { label: '31-60 Days', value: '31-60' },
            { label: '60+ Days', value: '60+' }
          ]}
          placeholder="Aging"
        />
        <input 
          type="date" 
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500"
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
        />
      </FilterBar>

      <TableCard>
        <div className="[&>div::-webkit-scrollbar]:hidden [&>div]:[-ms-overflow-style:none] [&>div]:[scrollbar-width:none]">
          <DataTable
            columns={columns}
            data={visibleInvoices}
            emptyMessage="No invoices found."
          />
        </div>
      </TableCard>

      {/* --- Detail Invoice Drawer --- */}
      <Drawer open={!!selectedInvoice} onClose={() => setSelectedInvoice(null)} title="Invoice Details">
        {selectedInvoice && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Invoice Information</h3>
              <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <DrawerField label="Invoice No" value={<span className="font-bold text-slate-900">{selectedInvoice.invoiceNo}</span>} />
                <DrawerField label="Invoice Date" value={selectedInvoice.date} />
                <DrawerField label="Due Date" value={selectedInvoice.dueDate} />
                <DrawerField label="Status" value={
                  <Badge variant={selectedInvoice.status === 'Paid' ? 'success' : selectedInvoice.status === 'Partially Paid' ? 'info' : selectedInvoice.status === 'Unpaid' ? 'warning' : 'danger'}>
                    {selectedInvoice.status}
                  </Badge>
                } />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Amount Details</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="border border-slate-100 bg-white p-3 rounded-lg shadow-sm col-span-2">
                  <span className="text-xs text-slate-400 block">Invoice Amount</span>
                  <span className="text-base font-bold text-slate-900">{formatCurrency(selectedInvoice.amount)}</span>
                </div>
                <div className="border border-slate-100 bg-white p-3 rounded-lg shadow-sm">
                  <span className="text-xs text-slate-400 block">Paid Amount</span>
                  <span className="text-base font-bold text-emerald-600">{formatCurrency(getPaidAmount(selectedInvoice))}</span>
                </div>
                <div className="border border-slate-100 bg-white p-3 rounded-lg shadow-sm">
                  <span className="text-xs text-slate-400 block">Outstanding Amount</span>
                  <span className={`text-base font-bold ${getOutstandingAmount(selectedInvoice) > 0 ? 'text-rose-600' : 'text-slate-900'}`}>{formatCurrency(getOutstandingAmount(selectedInvoice))}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Credit Information</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="border border-slate-100 bg-white p-3 rounded-lg shadow-sm">
                  <span className="text-xs text-slate-400 block">Credit Limit</span>
                  <span className="text-base font-bold text-slate-900">{formatCurrency(myRecord.creditLimit)}</span>
                </div>
                <div className="border border-slate-100 bg-white p-3 rounded-lg shadow-sm">
                  <span className="text-xs text-slate-400 block">Available Credit</span>
                  <span className="text-base font-bold text-emerald-600">{formatCurrency(myRecord.availableCredit)}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Payment Information</h3>
              <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <DrawerField label="Payment Terms" value={myRecord.paymentTerms || 'Standard'} />
                <DrawerField label="Credit Days" value={myRecord.creditDays ? `${myRecord.creditDays} Days` : '30 Days'} />
                <DrawerField label="Payment Type" value={myRecord.paymentType || 'Credit'} />
                <DrawerField 
                  label="Last Payment Date" 
                  value={
                    (selectedInvoice as any).paymentDate 
                      ? getDDMMYYYY(parseDateString((selectedInvoice as any).paymentDate))
                      : (selectedInvoice.status === 'Paid' || selectedInvoice.status === 'Partially Paid')
                        ? (myRecord.lastPaymentDate && myRecord.lastPaymentDate !== '-' ? myRecord.lastPaymentDate : selectedInvoice.date)
                        : '-'
                  } 
                />
                <DrawerField label="Aging Days" value={selectedInvoice.status === 'Paid' ? '-' : `${selectedInvoice.agingDays} Days`} />
              </div>
            </div>

            <div className="pt-4 border-t flex justify-end gap-3">
              <ActionButton variant="secondary" onClick={() => setSelectedInvoice(null)}>Close</ActionButton>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}