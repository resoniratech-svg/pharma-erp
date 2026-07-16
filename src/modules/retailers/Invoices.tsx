import { useState, useRef, useEffect, useMemo } from 'react';
import { Download, Filter, ReceiptText, ChevronDown, Printer } from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { applyInvoiceTemplate } from '../../documents/templates/InvoiceTemplate';
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

import authService from '../../services/authService';
import { retailerMasterService } from '../../services/retailerMasterService';
import { salesInvoiceService } from '../../services/salesInvoiceService';

type InvoiceStatus = 'Paid' | 'Unpaid' | 'Partially Paid' | 'Overdue';

interface InvoiceItem {
  id: string;
  productName: string;
  productCode: string;
  batchNumber?: string;
  expiryDate?: string;
  quantity: number;
  freeQuantity?: number;
  unitPrice: number; // PTR
  gstPct: number;
  discount?: number;
  schemeBenefit?: number;
  lineAmount: number;
}

interface Invoice {
  id: string;
  invoiceNo: string;
  orderNo: string;
  dispatchNo?: string;
  
  distributorName?: string;
  distributorGst?: string;
  
  retailer: string;
  retailerId?: string;
  retailerCode: string;
  gstNumber: string; // Retailer GST
  billingAddress: string;
  shippingAddress?: string;
  
  date: string;
  dueDate: string;
  paymentTerms?: string;
  
  grossAmount?: number;
  discountAmount?: number;
  schemeDiscountAmount?: number;
  taxableAmount?: number;
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
  roundOff?: number;
  
  amount: number; // Net amount
  subtotal: number;
  gstAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  
  status: InvoiceStatus;
  items: InvoiceItem[];
}

const formatCurrency = (amount: number | undefined) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount || 0);
};

export default function Invoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [distributorFilter, setDistributorFilter] = useState('');
  const [viewInvoice, setViewInvoice] = useState<any | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  
  const [userRetailerContext, setUserRetailerContext] = useState<any>(null);

  // Context Initialization
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

      setUserRetailerContext(matchedRetailer || { id: user.id, code: user.employeeCode, name: user.fullName });
    } catch (e) {
      console.error("Context error:", e);
    }
  }, []);

  // Load invoices from salesInvoiceService and Auto-Sync
  useEffect(() => {
    const fetchInvoices = () => {
      try {
        const allInvoices = salesInvoiceService.getAll();
        setInvoices(allInvoices as any[]);
      } catch (e) {
        console.error("Failed to load invoices via salesInvoiceService", e);
      }
    };
    
    fetchInvoices();
    
    const interval = setInterval(fetchInvoices, 3000);
    return () => clearInterval(interval);
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

  const getStatusVariant = (status: InvoiceStatus): BadgeVariant => {
    if (status === 'Paid') return 'success';
    if (status === 'Unpaid') return 'warning';
    if (status === 'Overdue') return 'danger';
    if (status === 'Partially Paid') return 'info';
    return 'neutral';
  };

  // --- Filtering Protocols ---
  const filteredData = useMemo(() => {
    if (!userRetailerContext) return [];
    
    const retId = String(userRetailerContext.id || '').toLowerCase();
    const retCode = String(userRetailerContext.code || '').toLowerCase();
    const retEmail = String(userRetailerContext.emailAddress || userRetailerContext.email || '').toLowerCase();
    const retUsername = String(userRetailerContext.username || '').toLowerCase();
    const retName = String(userRetailerContext.name || userRetailerContext.retailerName || '').toLowerCase();
    
    const base = invoices.filter(inv => {
      const invRetId = String(inv.retailerId || '').toLowerCase();
      const invRetCode = String(inv.retailerCode || '').toLowerCase();
      const invRetEmail = String((inv as any).email || '').toLowerCase();
      const invRetName = String(inv.retailer || (inv as any).retailerName || '').toLowerCase();
      
      let isMine = false;
      if (retId && invRetId === retId) isMine = true;
      else if (retCode && invRetCode === retCode) isMine = true;
      else if (retEmail && invRetEmail === retEmail) isMine = true;
      else if (retUsername && invRetName === retUsername) isMine = true;
      else if (retName && invRetName === retName) isMine = true;
      
      return isMine;
    });

    let result = base.filter((item) => {
      const searchStr = search.toLowerCase();
      const matchSearch = item.invoiceNo?.toLowerCase().includes(searchStr) || 
                          item.orderNo?.toLowerCase().includes(searchStr) ||
                          item.distributorName?.toLowerCase().includes(searchStr);
      const matchStatus = statusFilter ? item.status === statusFilter : true;
      const matchDistributor = distributorFilter ? item.distributorName === distributorFilter : true;
      return matchSearch && matchStatus && matchDistributor;
    });
    
    // Display newest invoices first
    result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    return result;
  }, [invoices, search, statusFilter, distributorFilter, userRetailerContext]);
  
  const uniqueDistributors = useMemo(() => {
    if (!userRetailerContext) return [];
    
    const retId = String(userRetailerContext.id || '').toLowerCase();
    const retCode = String(userRetailerContext.code || '').toLowerCase();
    const retEmail = String(userRetailerContext.emailAddress || userRetailerContext.email || '').toLowerCase();
    const retUsername = String(userRetailerContext.username || '').toLowerCase();
    const retName = String(userRetailerContext.name || userRetailerContext.retailerName || '').toLowerCase();
    
    const base = invoices.filter(inv => {
      const invRetId = String(inv.retailerId || '').toLowerCase();
      const invRetCode = String(inv.retailerCode || '').toLowerCase();
      const invRetEmail = String((inv as any).email || '').toLowerCase();
      const invRetName = String(inv.retailer || (inv as any).retailerName || '').toLowerCase();
      
      let isMine = false;
      if (retId && invRetId === retId) isMine = true;
      else if (retCode && invRetCode === retCode) isMine = true;
      else if (retEmail && invRetEmail === retEmail) isMine = true;
      else if (retUsername && invRetName === retUsername) isMine = true;
      else if (retName && invRetName === retName) isMine = true;
      
      return isMine;
    });
    
    const distributors = new Set(base.map(inv => inv.distributorName).filter(Boolean));
    return Array.from(distributors).map(d => ({ label: d as string, value: d as string }));
  }, [invoices, userRetailerContext]);

  const generatePDF = (invoice: Invoice | null, isDownload: boolean = true) => {
    if (!invoice) return;
    const doc = new jsPDF();
    // Enforcing RETAILER role format for PDF template
    applyInvoiceTemplate(doc, invoice, 'ROLE_RETAILER');
    
    if (isDownload) {
      doc.save(`${invoice.invoiceNo}.pdf`);
    } else {
      doc.autoPrint();
      window.open(doc.output('bloburl'), '_blank');
    }
  };

  // --- Table View Definitions ---
  const columns: Column<Invoice>[] = [
    { key: 'invoiceNo', label: 'Invoice No', render: (row) => <span className="font-semibold text-slate-900">{row.invoiceNo}</span> },
    { key: 'orderNo', label: 'Order No', render: (row) => <span className="text-slate-600">{row.orderNo}</span> },
    { key: 'date', label: 'Invoice Date', render: (row) => <span className="text-slate-600">{row.date}</span> },
    { key: 'dueDate', label: 'Due Date', render: (row) => <span className={row.status === 'Overdue' ? 'text-rose-600 font-medium' : 'text-slate-600'}>{row.dueDate}</span> },
    { key: 'amount', label: 'Invoice Amount', render: (row) => <span className="font-bold text-slate-800">{formatCurrency(row.amount)}</span> },
    { key: 'status', label: 'Payment Status', render: (row) => <Badge variant={getStatusVariant(row.status)}>{row.status}</Badge> },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          <button onClick={() => setViewInvoice(row)} className="text-[#163c78] hover:text-[#0c1f3d] text-xs px-2 py-1 flex items-center bg-[#163c78]/10 rounded-md font-medium">
            <ReceiptText className="w-3.5 h-3.5 mr-1" /> View
          </button>
          <button onClick={() => generatePDF(row)} className="text-slate-500 hover:text-slate-700 p-1">
            <Download className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  const invoiceItemColumns: Column<InvoiceItem>[] = [
    { key: 'productName', label: 'Product Name', render: (row) => <span className="font-medium text-slate-900">{row.productName}</span> },
    { key: 'batchNumber', label: 'Batch No', render: (row) => <span className="text-slate-500 text-xs font-mono">{row.batchNumber || '-'}</span> },
    { key: 'expiryDate', label: 'Expiry', render: (row) => <span className="text-slate-600 text-xs">{row.expiryDate || '-'}</span> },
    { key: 'quantity', label: 'Qty', render: (row) => <span className="text-slate-600">{row.quantity}</span> },
    { key: 'freeQuantity', label: 'Free Qty', render: (row) => <span className="text-slate-600">{row.freeQuantity || 0}</span> },
    { key: 'unitPrice', label: 'PTR', render: (row) => <span className="text-slate-600">{formatCurrency(row.unitPrice)}</span> },
    { key: 'gstPct', label: 'GST %', render: (row) => <span className="text-slate-600">{row.gstPct}%</span> },
    { key: 'discount', label: 'Discount', render: (row) => <span className="text-slate-600">{formatCurrency(row.discount || 0)}</span> },
    { key: 'schemeBenefit', label: 'Scheme Benefit', render: (row) => <span className="text-slate-600">{formatCurrency(row.schemeBenefit || 0)}</span> },
    { key: 'lineAmount', label: 'Line Amount', render: (row) => <span className="font-medium text-slate-900">{formatCurrency(row.lineAmount)}</span> },
  ];

  // --- Native Exports Generators ---
  const getExportData = () => {
    return filteredData.map(item => ({
      'Invoice Number': item.invoiceNo,
      'Order Number': item.orderNo,
      'Invoice Date': item.date,
      'Due Date': item.dueDate,
      'Invoice Amount': item.amount,
      'Payment Status': item.status
    }));
  };

  const handleExportExcel = () => {
    const dataToExport = getExportData();
    if (dataToExport.length === 0) {
      setShowExportMenu(false);
      return;
    }
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Invoices");
    XLSX.writeFile(wb, `Invoice_Register_${new Date().toISOString().slice(0,10)}.xlsx`);
    setShowExportMenu(false);
  };

  const handleExportCSV = () => {
    const dataToExport = getExportData();
    if (dataToExport.length === 0) {
      setShowExportMenu(false);
      return;
    }
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "Invoice_Register.csv";
    link.click();
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
    
    doc.text("MJ Healthcare ERP - Invoice Balances Ledger", 14, 15);
    autoTable(doc, {
      startY: 22,
      head: [headers],
      body: body,
      theme: 'striped',
      headStyles: { fillColor: [124, 58, 237] }
    });
    doc.save("Invoices_Master_Report.pdf");
    setShowExportMenu(false);
  };

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Invoice Manager"
        subtitle="View, download, and print invoices issued for your completed purchases and monitor their payment status."
        actions={
          <div className="flex items-center gap-3">
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
                  <div className="py-1">
                    <button onClick={handleExportCSV} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">Export CSV</button>
                    <button onClick={handleExportExcel} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">Export Excel</button>
                    <button onClick={handleExportPDF} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">Export PDF Matrix</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        }
      />

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search by invoice number or order id..." />
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
            { label: 'Paid', value: 'Paid' },
            { label: 'Unpaid', value: 'Unpaid' },
            { label: 'Partially Paid', value: 'Partially Paid' },
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
      </FilterBar>

      <TableCard>
        <div className="[&>div::-webkit-scrollbar]:hidden [&>div]:[-ms-overflow-style:none] [&>div]:[scrollbar-width:none]">
          <DataTable
            columns={columns}
            data={filteredData}
            emptyMessage="No available generation invoices found."
          />
        </div>
      </TableCard>

      {/* --- View Invoice Detail Layout Side Drawer --- */}
      <Drawer open={!!viewInvoice} onClose={() => setViewInvoice(null)} title="Invoice Details">
        {viewInvoice && (
          <div className="space-y-6 pb-20 text-xs">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Invoice Information</h3>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-4">
                <DrawerField label="Invoice Number" value={<span className="font-semibold text-violet-700">{viewInvoice.invoiceNo}</span>} />
                <DrawerField label="Invoice Date" value={viewInvoice.date} />
                <DrawerField label="Payment Status" value={<Badge variant={getStatusVariant(viewInvoice.status)}>{viewInvoice.status}</Badge>} />
                <DrawerField label="Order Number" value={viewInvoice.orderNo} />
                <DrawerField label="Dispatch Number" value={viewInvoice.dispatchNo || '-'} />
                <DrawerField label="Due Date" value={<span className={viewInvoice.status === 'Overdue' ? 'text-rose-600 font-medium' : ''}>{viewInvoice.dueDate}</span>} />
                <DrawerField label="Payment Terms" value={viewInvoice.paymentTerms || '-'} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Distributor Details</h3>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-4">
                  <DrawerField label="Distributor Name" value={<span className="font-medium text-slate-900">{viewInvoice.distributorName || '-'}</span>} />
                  <DrawerField label="Distributor GST" value={<span className="font-mono text-slate-700">{viewInvoice.distributorGst || '-'}</span>} />
                </div>
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Retailer Details</h3>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-4">
                  <DrawerField label="Retailer Name" value={<span className="font-medium text-slate-900">{viewInvoice.retailer || '-'}</span>} />
                  <DrawerField label="Retailer GST" value={<span className="font-mono text-slate-700">{viewInvoice.gstNumber || '-'}</span>} />
                  <DrawerField label="Billing Address" value={viewInvoice.billingAddress || '-'} />
                  <DrawerField label="Shipping Address" value={viewInvoice.shippingAddress || '-'} />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Invoice Items</h3>
              <div className="border border-slate-200 rounded-xl overflow-hidden [&>div::-webkit-scrollbar]:hidden [&>div]:[-ms-overflow-style:none] [&>div]:[scrollbar-width:none]">
                <DataTable columns={invoiceItemColumns} data={viewInvoice.items} />
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Invoice Summary</h3>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">Gross Amount</span>
                      <span className="font-medium text-slate-900">{formatCurrency(viewInvoice.grossAmount || viewInvoice.subtotal)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">Discount</span>
                      <span className="font-medium text-slate-900">{formatCurrency(viewInvoice.discountAmount || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">Scheme Discount</span>
                      <span className="font-medium text-slate-900">{formatCurrency(viewInvoice.schemeDiscountAmount || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                      <span className="text-slate-700 font-medium">Taxable Amount</span>
                      <span className="font-medium text-slate-900">{formatCurrency(viewInvoice.taxableAmount || viewInvoice.subtotal)}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">CGST</span>
                      <span className="font-medium text-slate-900">{formatCurrency(viewInvoice.cgstAmount || (viewInvoice.gstAmount / 2))}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">SGST</span>
                      <span className="font-medium text-slate-900">{formatCurrency(viewInvoice.sgstAmount || (viewInvoice.gstAmount / 2))}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">IGST</span>
                      <span className="font-medium text-slate-900">{formatCurrency(viewInvoice.igstAmount || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">Round Off</span>
                      <span className="font-medium text-slate-900">{formatCurrency(viewInvoice.roundOff || 0)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-200">
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-bold text-slate-900 text-sm">Net Invoice Amount</span>
                    <span className="text-base font-bold text-violet-700">{formatCurrency(viewInvoice.amount)}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200">
                    <div className="bg-emerald-50 p-3 rounded-lg flex justify-between items-center border border-emerald-100">
                      <span className="text-emerald-800 font-medium">Paid Amount</span>
                      <span className="font-bold text-emerald-700">{formatCurrency(viewInvoice.paidAmount)}</span>
                    </div>
                    <div className="bg-rose-50 p-3 rounded-lg flex justify-between items-center border border-rose-100">
                      <span className="text-rose-800 font-medium">Outstanding Amount</span>
                      <span className={`font-bold ${viewInvoice.outstandingAmount > 0 ? 'text-rose-700' : 'text-slate-900'}`}>{formatCurrency(viewInvoice.outstandingAmount)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-200">
              <ActionButton className="flex-1" icon={<Download className="w-4 h-4" />} onClick={() => generatePDF(viewInvoice)}>
                Download PDF
              </ActionButton>
              <ActionButton variant="secondary" className="flex-1" icon={<Printer className="w-4 h-4" />} onClick={() => generatePDF(viewInvoice, false)}>
                Print Invoice
              </ActionButton>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}