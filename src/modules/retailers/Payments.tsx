// PaymentTracking.tsx
import { useState, useRef, useEffect, useMemo } from 'react';
import { Download, Filter, ReceiptText, ChevronDown, Printer } from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { applyPaymentReceiptTemplate } from '../../documents/templates/PaymentReceiptTemplate';
import authService from '../../services/authService';
import { retailerMasterService } from '../../services/retailerMasterService';
import { paymentService, type Payment, type PaymentStatus } from '../../services/paymentService';
import { salesInvoiceService } from '../../services/salesInvoiceService';
import {
  PageHeader,
  FilterBar,
  SearchInput,
  SelectFilter,
  ActionButton,
  TableCard,
  DataTable,
  Badge,
  Drawer,
  DrawerField
} from './components/shared';
import { type Column, type BadgeVariant } from './components/shared';

const formatCurrency = (amount: number | undefined) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount || 0);
};

export default function Payments() {
  const [payments, setPayments] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [distributorFilter, setDistributorFilter] = useState('');
  const [modeFilter, setModeFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  
  const [viewReceipt, setViewReceipt] = useState<any | null>(null);

  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  const [userRetailerContext, setUserRetailerContext] = useState<any>(null);

  // Dynamic Retailer Identity
  useEffect(() => {
    try {
      const user = authService.getCurrentUser();
      if (!user) return;
      const retailers = retailerMasterService.getAll ? retailerMasterService.getAll() : [];
      const userId = String(user.id || '').trim().toLowerCase();
      const userCode = String(user.employeeCode || '').trim().toLowerCase();
      const userEmail = String(user.email || '').trim().toLowerCase();
      const username = String((user as any).username || '').trim().toLowerCase();
      const userName = String(user.fullName || (user as any).name || '').trim().toLowerCase();

      let matchedRetailer = null;
      matchedRetailer = retailers.find((r: any) => String(r.id || '').trim().toLowerCase() === userId);
      if (!matchedRetailer && userCode) matchedRetailer = retailers.find((r: any) => String(r.code || '').trim().toLowerCase() === userCode);
      if (!matchedRetailer && userEmail) matchedRetailer = retailers.find((r: any) => String(r.emailAddress || r.email || '').trim().toLowerCase() === userEmail);
      if (!matchedRetailer && username) matchedRetailer = retailers.find((r: any) => String(r.username || '').trim().toLowerCase() === username);
      if (!matchedRetailer && userName) matchedRetailer = retailers.find((r: any) => String(r.name || r.retailerName || '').trim().toLowerCase() === userName);

      setUserRetailerContext(matchedRetailer || { id: user.id, code: user.employeeCode, email: user.email, username: (user as any).username, name: user.fullName });
    } catch (e) {
      console.error("Context error:", e);
    }
  }, []);

  // Load Invoices and Payments with synchronization
  useEffect(() => {
    if (!userRetailerContext) return;
    
    const fetchData = () => {
      try {
        const retId = String(userRetailerContext.id || '').toLowerCase();
        const retCode = String(userRetailerContext.code || '').toLowerCase();
        const retEmail = String(userRetailerContext.emailAddress || userRetailerContext.email || '').toLowerCase();
        const retUsername = String(userRetailerContext.username || '').toLowerCase();
        const retName = String(userRetailerContext.name || userRetailerContext.retailerName || '').toLowerCase();

        // 1. Fetch Invoices from salesInvoiceService
        const allInvoices = salesInvoiceService.getAll();
        
        // Match retailer invoices
        const myInvoices = allInvoices.filter(inv => {
          const invRetId = String(inv.retailerId || '').toLowerCase();
          const invRetCode = String(inv.retailerCode || '').toLowerCase();
          const invRetEmail = String((inv as any).email || '').toLowerCase();
          const invRetName = String(inv.retailerName || (inv as any).retailer || '').toLowerCase();
          
          if (retId && invRetId === retId) return true;
          if (retCode && invRetCode === retCode) return true;
          if (retEmail && invRetEmail === retEmail) return true;
          if (retUsername && invRetName === retUsername) return true;
          if (retName && invRetName === retName) return true;
          return false;
        });

        const invoiceMap = new Map(myInvoices.map(inv => [inv.invoiceNo, inv]));
        const allPayments = paymentService.getAll();
        
        // Calculate Total Paid per invoice
        const invoicePayments = new Map<string, number>();
        allPayments.forEach(p => {
            if (p.status === 'Completed' || p.status === 'Partially Paid') {
                const current = invoicePayments.get(p.invoiceNo) || 0;
                invoicePayments.set(p.invoiceNo, current + p.amount);
            }
        });

        // Sync back to ERP if needed
        let erpUpdated = false;
        const syncedInvoices = allInvoices.map(inv => {
            if (invoiceMap.has(inv.invoiceNo)) {
                const totalPaid = invoicePayments.get(inv.invoiceNo) || 0;
                const invAmt = inv.grandTotal || (inv as any).amount || 0;
                const outstanding = invAmt - totalPaid;
                
                let newStatus = inv.paymentStatus;
                if (totalPaid >= invAmt && invAmt > 0) newStatus = 'Paid';
                else if (totalPaid > 0) newStatus = 'Partial';
                else newStatus = 'Pending';
                
                if ((inv as any).paidAmount !== totalPaid || (inv as any).outstandingAmount !== outstanding || inv.paymentStatus !== newStatus) {
                    erpUpdated = true;
                    return { ...inv, paidAmount: totalPaid, outstandingAmount: outstanding, paymentStatus: newStatus };
                }
            }
            return inv;
        });

        if (erpUpdated) {
            localStorage.setItem('pharma_erp_sales_invoices', JSON.stringify(syncedInvoices));
        }

        const myPayments: any[] = [];

        for (const p of allPayments) {
          const inv = invoiceMap.get(p.invoiceNo);
          // Only show payments that have a corresponding invoice (No orphan payments)
          if (inv) {
            const invAmt = inv.grandTotal || (inv as any).amount || 0;
            const totalPaid = invoicePayments.get(inv.invoiceNo) || 0;
            
            const outstandingAfter = invAmt - totalPaid;
            const outstandingBefore = outstandingAfter + p.amount;

            // Overdue check
            let displayStatus = p.status;
            if (p.status === 'Pending' && (inv as any).dueDate && new Date((inv as any).dueDate) < new Date()) {
                displayStatus = 'Overdue' as any;
            }
            
            myPayments.push({
              ...p,
              status: displayStatus,
              invoiceAmount: invAmt,
              outstandingBefore: outstandingBefore,
              outstandingAfter: outstandingAfter,
              distributorName: inv.distributorName,
              distributorCode: inv.distributorCode,
              orderNo: inv.orderNo,
              dispatchNo: inv.dispatchNo,
              invoiceDate: inv.date,
              dueDate: (inv as any).dueDate,
              retailerName: inv.retailerName || (inv as any).retailer, 
            });
          }
        }
        
        const finalMyInvoices = syncedInvoices.filter(inv => invoiceMap.has(inv.invoiceNo));
        setInvoices(finalMyInvoices);
        setPayments(myPayments);
      } catch (e) {
        console.error("Error loading payments and invoices:", e);
      }
    };
    
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, [userRetailerContext]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const summary = useMemo(() => {
    let totalInvoiceAmount = 0;
    let totalPaid = 0;
    let totalOutstanding = 0;
    let pendingCount = 0;

    invoices.forEach(inv => {
      const invAmt = inv.grandTotal || inv.amount || 0;
      totalInvoiceAmount += invAmt;
      totalPaid += (inv.paidAmount || 0);
      totalOutstanding += (inv.outstandingAmount ?? invAmt);
    });
    
    pendingCount = payments.filter(p => p.status === 'Pending' || p.status === 'Overdue').length;

    return { totalInvoiceAmount, totalPaid, totalOutstanding, pendingCount };
  }, [invoices, payments]);

  const uniqueDistributors = useMemo(() => {
    const dists = new Set(payments.map(p => p.distributorName).filter(Boolean));
    return Array.from(dists).map(d => ({ label: d as string, value: d as string }));
  }, [payments]);

  const uniqueModes = useMemo(() => {
    const modes = new Set(payments.map(p => p.mode).filter(Boolean));
    return Array.from(modes).map(m => ({ label: m as string, value: m as string }));
  }, [payments]);

  const getStatusVariant = (status: PaymentStatus | 'Overdue'): BadgeVariant => {
    if (status === 'Completed') return 'success';
    if (status === 'Pending') return 'warning';
    if (status === 'Failed') return 'danger';
    if (status === 'Overdue') return 'danger';
    if (status === 'Partially Paid') return 'info';
    return 'neutral';
  };

  const filteredData = useMemo(() => {
    return payments.filter((item) => {
      const searchStr = search.toLowerCase();
      const matchSearch = item.receiptNo.toLowerCase().includes(searchStr) || 
                          item.invoiceNo.toLowerCase().includes(searchStr) ||
                          (item.distributorName && item.distributorName.toLowerCase().includes(searchStr));
      const matchStatus = statusFilter ? item.status === statusFilter : true;
      const matchDistributor = distributorFilter ? item.distributorName === distributorFilter : true;
      const matchMode = modeFilter ? item.mode === modeFilter : true;
      
      let matchDate = true;
      if (dateFilter) {
          const paymentDate = new Date(item.date);
          const today = new Date();
          if (dateFilter === 'today') {
              matchDate = paymentDate.toDateString() === today.toDateString();
          } else if (dateFilter === '7days') {
              const sevenDaysAgo = new Date(today);
              sevenDaysAgo.setDate(today.getDate() - 7);
              matchDate = paymentDate >= sevenDaysAgo;
          } else if (dateFilter === '30days') {
              const thirtyDaysAgo = new Date(today);
              thirtyDaysAgo.setDate(today.getDate() - 30);
              matchDate = paymentDate >= thirtyDaysAgo;
          } else if (dateFilter === 'this_month') {
              matchDate = paymentDate.getMonth() === today.getMonth() && paymentDate.getFullYear() === today.getFullYear();
          }
      }
      
      return matchSearch && matchStatus && matchDistributor && matchMode && matchDate;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [payments, search, statusFilter, distributorFilter, modeFilter, dateFilter]);

  const generatePDF = (payment: any | null, isDownload: boolean = true) => {
    if (!payment) return;
    const doc = new jsPDF();
    
    // We pass ROLE_RETAILER to ensure the template formats it correctly for a Retailer view.
    applyPaymentReceiptTemplate(doc, payment as Payment, 'ROLE_RETAILER');
    
    if (isDownload) {
      doc.save(`${payment.receiptNo}.pdf`);
    } else {
      doc.autoPrint();
      window.open(doc.output('bloburl'), '_blank');
    }
  };

  const columns: Column<any>[] = [
    { key: 'receiptNo', label: 'Receipt No', render: (row) => <span className="font-semibold text-slate-900">{row.receiptNo}</span> },
    { key: 'invoiceNo', label: 'Invoice No', render: (row) => <span className="text-slate-600">{row.invoiceNo}</span> },
    { key: 'distributorName', label: 'Distributor', render: (row) => <span className="text-slate-700 font-medium">{row.distributorName || '-'}</span> },
    { key: 'date', label: 'Payment Date', render: (row) => <span className="text-slate-600">{row.date}</span> },
    { key: 'mode', label: 'Payment Mode', render: (row) => <span className="text-slate-600">{row.mode}</span> },
    { key: 'amount', label: 'Amount Paid', render: (row) => <span className="font-bold text-emerald-600">{formatCurrency(row.amount)}</span> },
    { key: 'status', label: 'Payment Status', render: (row) => <Badge variant={getStatusVariant(row.status)}>{row.status}</Badge> },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          <ActionButton variant="ghost" className="text-brand-primary text-xs px-2 py-1" onClick={() => setViewReceipt(row)}>
            <ReceiptText className="w-4 h-4 mr-1" /> View Receipt
          </ActionButton>
          <ActionButton variant="ghost" className="text-slate-500 text-xs px-2 py-1 hover:text-brand-primary transition-colors" onClick={() => generatePDF(row)}>
            <Download className="w-4 h-4" />
          </ActionButton>
        </div>
      )
    }
  ];

  // Exports specifically formatted for the Retailer
  const getExportData = () => {
    return filteredData.map(item => ({
      'Receipt Number': item.receiptNo,
      'Invoice Number': item.invoiceNo,
      'Distributor': item.distributorName || '-',
      'Payment Date': item.date,
      'Payment Mode': item.mode,
      'Amount Paid': item.amount,
      'Payment Status': item.status
    }));
  };

  const handleExportExcel = () => {
    if (filteredData.length === 0) {
      setShowExportMenu(false);
      return;
    }
    const ws = XLSX.utils.json_to_sheet(getExportData());
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "My Payments");
    XLSX.writeFile(wb, "My_Payments.xlsx");
    setShowExportMenu(false);
  };

  const handleExportCSV = () => {
    if (filteredData.length === 0) {
      setShowExportMenu(false);
      return;
    }
    const ws = XLSX.utils.json_to_sheet(getExportData());
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "My_Payments.csv";
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportMenu(false);
  };

  const handleExportPDF = () => {
    const data = getExportData();
    if (data.length === 0) {
      setShowExportMenu(false);
      return;
    }
    const doc = new jsPDF('landscape');
    const headers = Object.keys(data[0] || {});
    const body = data.map(obj => headers.map(header => (obj as any)[header]));
    
    doc.text("My Payment Register", 14, 15);
    autoTable(doc, {
      startY: 20,
      head: [headers],
      body: body,
      theme: 'striped',
      headStyles: { fillColor: [22, 60, 120] }, // MJ Healthcare Primary (#163C78)
      styles: { fontSize: 9 }
    });
    doc.save("My_Payments.pdf");
    setShowExportMenu(false);
  };

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Payment Tracking"
        subtitle="Track your payment history, view payment receipts, monitor outstanding settlements, and download payment acknowledgements."
        actions={
          <div className="relative inline-block text-left" ref={exportMenuRef}>
            <ActionButton 
              variant="secondary" 
              icon={<Download className="w-4 h-4" />}
              onClick={() => setShowExportMenu(!showExportMenu)}
            >
              Export <ChevronDown className="w-3 h-3 ml-1" />
            </ActionButton>
            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                <div className="py-1" role="menu" aria-orientation="vertical">
                  <button onClick={handleExportCSV} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 hover:text-brand-primary transition-colors">Export CSV</button>
                  <button onClick={handleExportExcel} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 hover:text-brand-primary transition-colors">Export Excel</button>
                  <button onClick={handleExportPDF} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 hover:text-brand-primary transition-colors">Export PDF</button>
                </div>
              </div>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col">
          <span className="text-sm font-medium text-slate-500 mb-1">Total Invoice Amount</span>
          <span className="text-2xl font-bold text-slate-900">{formatCurrency(summary.totalInvoiceAmount)}</span>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col">
          <span className="text-sm font-medium text-emerald-600 mb-1">Total Amount Paid</span>
          <span className="text-2xl font-bold text-emerald-700">{formatCurrency(summary.totalPaid)}</span>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col">
          <span className="text-sm font-medium text-rose-600 mb-1">Total Outstanding</span>
          <span className="text-2xl font-bold text-rose-700">{formatCurrency(summary.totalOutstanding)}</span>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col">
          <span className="text-sm font-medium text-amber-600 mb-1">Pending Payments</span>
          <span className="text-2xl font-bold text-amber-700">{summary.pendingCount}</span>
        </div>
      </div>

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search receipt, invoice or distributor..." />
        <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-600">Filters:</span>
        </div>
        <SelectFilter
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { label: 'All Statuses', value: '' },
            { label: 'Completed', value: 'Completed' },
            { label: 'Pending', value: 'Pending' },
            { label: 'Partially Paid', value: 'Partially Paid' },
            { label: 'Failed', value: 'Failed' },
            { label: 'Overdue', value: 'Overdue' },
          ]}
          placeholder="Status"
        />
        <div className="w-px h-6 bg-slate-200 mx-1 hidden sm:block" />
        <SelectFilter
          value={distributorFilter}
          onChange={setDistributorFilter}
          options={[
            { label: 'All Distributors', value: '' },
            ...uniqueDistributors
          ]}
          placeholder="Distributor"
        />
        <div className="w-px h-6 bg-slate-200 mx-1 hidden sm:block" />
        <SelectFilter
          value={modeFilter}
          onChange={setModeFilter}
          options={[
            { label: 'All Modes', value: '' },
            ...uniqueModes
          ]}
          placeholder="Mode"
        />
        <div className="w-px h-6 bg-slate-200 mx-1 hidden sm:block" />
        <SelectFilter
          value={dateFilter}
          onChange={setDateFilter}
          options={[
            { label: 'All Dates', value: '' },
            { label: 'Today', value: 'today' },
            { label: 'Last 7 Days', value: '7days' },
            { label: 'Last 30 Days', value: '30days' },
            { label: 'This Month', value: 'this_month' }
          ]}
          placeholder="Date"
        />
      </FilterBar>

      <TableCard>
        <div className="[&>div::-webkit-scrollbar]:hidden [&>div]:[-ms-overflow-style:none] [&>div]:[scrollbar-width:none]">
          <DataTable
            columns={columns}
            data={filteredData}
            emptyMessage="No payments found."
          />
        </div>
      </TableCard>

      {/* View Receipt Drawer */}
      <Drawer
        open={!!viewReceipt}
        onClose={() => setViewReceipt(null)}
        title="Receipt Details"
      >
        {viewReceipt && (
          <div className="space-y-6 pb-20">
            {/* Section 1: Receipt Information */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Receipt Information</h3>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                <DrawerField label="Receipt Number" value={<span className="font-semibold text-brand-primary">{viewReceipt.receiptNo}</span>} />
                <DrawerField label="Invoice Number" value={viewReceipt.invoiceNo} />
                <DrawerField label="Payment Date" value={viewReceipt.date} />
                <DrawerField label="Payment Mode" value={viewReceipt.mode} />
                <DrawerField label="Payment Status" value={<Badge variant={getStatusVariant(viewReceipt.status)}>{viewReceipt.status}</Badge>} />
              </div>
            </div>

            {/* Section 1.5: Distributor Information */}
            {viewReceipt.distributorName && (
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Distributor Information</h3>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DrawerField label="Distributor Name" value={<span className="font-medium text-slate-900">{viewReceipt.distributorName}</span>} />
                  <DrawerField label="Distributor Code" value={<span className="font-mono text-slate-700">{viewReceipt.distributorCode}</span>} />
                </div>
              </div>
            )}

            {/* Section 2: Payment Information */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Payment Information</h3>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                <DrawerField label="Amount Paid" value={<span className="font-bold text-emerald-600 text-lg">{formatCurrency(viewReceipt.amount)}</span>} />
                <DrawerField label="Payment Mode" value={viewReceipt.mode} />
                <DrawerField label="Bank Name" value={viewReceipt.bankName} />
                <DrawerField label="Transaction Reference" value={<span className="font-mono text-slate-700">{viewReceipt.txnReference}</span>} />
                <DrawerField label="Payment Date" value={viewReceipt.date} />
              </div>
            </div>

            {/* Section 3: Invoice Information */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Invoice Information</h3>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <DrawerField label="Invoice Number" value={<span className="font-medium text-slate-900">{viewReceipt.invoiceNo}</span>} />
                    <DrawerField label="Order Number" value={viewReceipt.orderNo || '-'} />
                    <DrawerField label="Dispatch Number" value={viewReceipt.dispatchNo || '-'} />
                    <DrawerField label="Invoice Date" value={viewReceipt.invoiceDate || '-'} />
                    <DrawerField label="Due Date" value={viewReceipt.dueDate || '-'} />
                  </div>
                  <div className="flex justify-between items-center text-sm pt-3 border-t border-slate-200">
                    <span className="text-slate-600">Invoice Amount</span>
                    <span className="font-medium text-slate-900">{formatCurrency(viewReceipt.invoiceAmount)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Outstanding Before Payment</span>
                    <span className="font-medium text-slate-900">{formatCurrency(viewReceipt.outstandingBefore)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm pt-1">
                    <span className="font-semibold text-slate-900">Outstanding After Payment</span>
                    <span className={`font-bold ${viewReceipt.outstandingAfter > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{formatCurrency(viewReceipt.outstandingAfter)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 4: Drawer Actions */}
            <div className="flex gap-3 pt-4 border-t border-slate-200">
              <ActionButton className="flex-1 bg-brand-primary hover:bg-brand-secondary transition-colors text-white" icon={<Download className="w-4 h-4" />} onClick={() => generatePDF(viewReceipt)}>
                Download Receipt
              </ActionButton>
              <ActionButton variant="secondary" className="flex-1 border-brand-primary text-brand-primary hover:bg-brand-light transition-colors" icon={<Printer className="w-4 h-4" />} onClick={() => generatePDF(viewReceipt, false)}>
                Print Receipt
              </ActionButton>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
