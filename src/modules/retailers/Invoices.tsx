import { useState, useRef, useEffect, useMemo } from 'react';
import { Download, Filter, ReceiptText, ChevronDown, Printer, Plus, Trash2 } from 'lucide-react';
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
import { ROLE_SUPER_ADMIN, ROLE_RETAILER } from '../../constants/roles';

type InvoiceStatus = 'Paid' | 'Unpaid' | 'Partially Paid' | 'Overdue';

interface InvoiceItem {
  id: string;
  productName: string;
  productCode: string;
  quantity: number;
  unitPrice: number;
  gstPct: number;
  lineAmount: number;
}

interface Invoice {
  id: string;
  invoiceNo: string;
  orderNo: string;
  retailer: string;
  retailerCode: string;
  billingAddress: string;
  gstNumber: string;
  date: string;
  dueDate: string;
  amount: number;
  subtotal: number;
  gstAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  status: InvoiceStatus;
  items: InvoiceItem[];
}

const initialMockInvoices: Invoice[] = [
  { 
    id: '1', invoiceNo: 'INV-RET-9912', orderNo: 'ORD-10045', retailer: 'Apollo Pharmacy', retailerCode: 'RET-001',
    billingAddress: '123 Health Ave, Bangalore, 560001', gstNumber: '29ABCDE1234F1Z5',
    date: '01-Oct-2026', dueDate: '15-Oct-2026', amount: 45000, subtotal: 40178.57, gstAmount: 4821.43,
    paidAmount: 0, outstandingAmount: 45000, status: 'Unpaid',
    items: [
      { id: 'i1', productName: 'Amoxicillin 500mg', productCode: 'AMX-500', quantity: 200, unitPrice: 150, gstPct: 12, lineAmount: 30000 },
      { id: 'i2', productName: 'Paracetamol 650mg', productCode: 'PRC-650', quantity: 100, unitPrice: 101.78, gstPct: 12, lineAmount: 10178.57 }
    ]
  },
  { 
    id: '2', invoiceNo: 'INV-RET-9900', orderNo: 'ORD-10022', retailer: 'MedPlus Store', retailerCode: 'RET-002',
    billingAddress: '45 Wellness Blvd, Mumbai, 400001', gstNumber: '27FGHIJ5678K1Z2',
    date: '15-Sep-2026', dueDate: '30-Sep-2026', amount: 12000, subtotal: 10714.29, gstAmount: 1285.71,
    paidAmount: 0, outstandingAmount: 12000, status: 'Overdue',
    items: [
      { id: 'i3', productName: 'Cough Syrup 100ml', productCode: 'CGH-100', quantity: 100, unitPrice: 107.14, gstPct: 12, lineAmount: 10714.29 }
    ]
  },
  { 
    id: '3', invoiceNo: 'INV-RET-9890', orderNo: 'ORD-10010', retailer: 'Apollo Pharmacy', retailerCode: 'RET-001',
    billingAddress: '123 Health Ave, Bangalore, 560001', gstNumber: '29ABCDE1234F1Z5',
    date: '10-Sep-2026', dueDate: '25-Sep-2026', amount: 5500, subtotal: 4910.71, gstAmount: 589.29,
    paidAmount: 5500, outstandingAmount: 0, status: 'Paid',
    items: [
      { id: 'i4', productName: 'Vitamin C 1000mg', productCode: 'VIT-C-1K', quantity: 50, unitPrice: 98.21, gstPct: 12, lineAmount: 4910.71 }
    ]
  }
];

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function Invoices() {
  const activeRole = localStorage.getItem('activeRole') || ROLE_SUPER_ADMIN;
  const isRetailer = activeRole === ROLE_RETAILER;
  
  // --- Persistent State Layer Pipeline ---
  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const saved = localStorage.getItem('pharma_erp_invoices');
    return saved ? JSON.parse(saved) : initialMockInvoices;
  });

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // --- New Invoice Creation Modal Form Matrix States ---
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newInvoice, setNewInvoice] = useState({
    invoiceNo: '',
    orderNo: '',
    retailer: '',
    retailerCode: '',
    billingAddress: '',
    gstNumber: '',
    dueDate: ''
  });
  const [formItems, setFormItems] = useState<InvoiceItem[]>([
    { id: '1', productName: '', productCode: '', quantity: 1, unitPrice: 0, gstPct: 12, lineAmount: 0 }
  ]);

  // Sync mutations back to local database references
  useEffect(() => {
    localStorage.setItem('pharma_erp_invoices', JSON.stringify(invoices));
  }, [invoices]);

  // Listen context triggers for outbound module collection updates
  useEffect(() => {
    const checkOutstandingUpdates = () => {
      const savedOutstanding = localStorage.getItem('pharma_erp_outstanding_records');
      if (!savedOutstanding) return;
      
      try {
        const records = JSON.parse(savedOutstanding);
        let updated = false;
        
        const nextInvoices = invoices.map(inv => {
          // Cross map across items log array matrices
          for (const rec of records) {
            const matchInvoice = rec.invoices.find((i: any) => i.invoiceNo === inv.invoiceNo);
            if (matchInvoice && matchInvoice.status === 'Paid' && inv.status !== 'Paid') {
              updated = true;
              return { ...inv, status: 'Paid' as const, paidAmount: inv.amount, outstandingAmount: 0 };
            }
          }
          return inv;
        });

        if (updated) {
          setInvoices(nextInvoices);
        }
      } catch (e) {
        console.error("Local crossing sync parsing fail", e);
      }
    };

    const interval = setInterval(checkOutstandingUpdates, 3000);
    return () => clearInterval(interval);
  }, [invoices]);

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
    const base = isRetailer ? invoices.filter(d => d.retailer === 'Apollo Pharmacy') : invoices;
    return base.filter((item) => {
      const searchStr = search.toLowerCase();
      const matchSearch = item.invoiceNo.toLowerCase().includes(searchStr) || 
                          item.orderNo.toLowerCase().includes(searchStr) ||
                          item.retailer.toLowerCase().includes(searchStr);
      const matchStatus = statusFilter ? item.status === statusFilter : true;
      return matchSearch && matchStatus;
    });
  }, [invoices, isRetailer, search, statusFilter]);

  // --- Auto Calculating Line Item Computations ---
  const handleItemChange = (index: number, fields: Partial<InvoiceItem>) => {
    const updated = [...formItems];
    const current = { ...updated[index], ...fields };
    current.lineAmount = Number((current.quantity * current.unitPrice).toFixed(2));
    updated[index] = current;
    setFormItems(updated);
  };

  const handleAddFormItem = () => {
    setFormItems([...formItems, { id: Date.now().toString(), productName: '', productCode: '', quantity: 1, unitPrice: 0, gstPct: 12, lineAmount: 0 }]);
  };

  const handleRemoveFormItem = (index: number) => {
    if (formItems.length > 1) {
      setFormItems(formItems.filter((_, i) => i !== index));
    }
  };

  // --- Form Creation Request Executions ---
  const handleCreateInvoiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInvoice.invoiceNo || !newInvoice.retailer) return;

    const totalLineAmount = formItems.reduce((sum, item) => sum + item.lineAmount, 0);
    const calculatedSubtotal = Number((totalLineAmount / 1.12).toFixed(2));
    const calculatedGst = Number((totalLineAmount - calculatedSubtotal).toFixed(2));

    const invoicePayload: Invoice = {
      id: Date.now().toString(),
      invoiceNo: newInvoice.invoiceNo.startsWith('INV-') ? newInvoice.invoiceNo : `INV-${newInvoice.invoiceNo}`,
      orderNo: newInvoice.orderNo.startsWith('ORD-') ? newInvoice.orderNo : `ORD-${newInvoice.orderNo}`,
      retailer: newInvoice.retailer,
      retailerCode: newInvoice.retailerCode || 'RET-CUSTOM',
      billingAddress: newInvoice.billingAddress || 'Corporate Distribution Hub Address',
      gstNumber: newInvoice.gstNumber || '29ABCDXXXXX1Z5',
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-'),
      dueDate: newInvoice.dueDate || '30-Oct-2026',
      amount: totalLineAmount,
      subtotal: calculatedSubtotal,
      gstAmount: calculatedGst,
      paidAmount: 0,
      outstandingAmount: totalLineAmount,
      status: 'Unpaid',
      items: formItems
    };

    setInvoices([invoicePayload, ...invoices]);
    setShowCreateModal(false);
    
    // Reset inputs
    setNewInvoice({ invoiceNo: '', orderNo: '', retailer: '', retailerCode: '', billingAddress: '', gstNumber: '', dueDate: '' });
    setFormItems([{ id: '1', productName: '', productCode: '', quantity: 1, unitPrice: 0, gstPct: 12, lineAmount: 0 }]);
  };

  const generatePDF = (invoice: Invoice | null, isDownload: boolean = true) => {
    if (!invoice) return;
    const doc = new jsPDF();
    applyInvoiceTemplate(doc, invoice, activeRole);
    
    if (isDownload) {
      doc.save(`${invoice.invoiceNo}.pdf`);
    } else {
      doc.autoPrint();
      window.open(doc.output('bloburl'), '_blank');
    }
  };

  // --- Table View Definitions ---
  const adminColumns: Column<Invoice>[] = [
    { key: 'invoiceNo', label: 'Invoice No', render: (row) => <span className="font-semibold text-slate-900">{row.invoiceNo}</span> },
    { key: 'retailer', label: 'Retailer Name', render: (row) => <span className="font-semibold text-violet-700">{row.retailer}</span> },
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
          <button onClick={() => setViewInvoice(row)} className="text-violet-600 hover:text-violet-800 text-xs px-2 py-1 flex items-center bg-violet-50 rounded-md font-medium">
            <ReceiptText className="w-3.5 h-3.5 mr-1" /> View
          </button>
          <button onClick={() => generatePDF(row)} className="text-slate-500 hover:text-slate-700 p-1">
            <Download className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  const retailerColumns: Column<Invoice>[] = [
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
          <button onClick={() => setViewInvoice(row)} className="text-violet-600 hover:text-violet-800 text-xs px-2 py-1 flex items-center bg-violet-50 rounded-md font-medium">
            <ReceiptText className="w-3.5 h-3.5 mr-1" /> View
          </button>
          <button onClick={() => generatePDF(row)} className="text-slate-500 hover:text-slate-700 p-1">
            <Download className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  const columns = isRetailer ? retailerColumns : adminColumns;

  const invoiceItemColumns: Column<InvoiceItem>[] = [
    { key: 'productName', label: 'Product Name', render: (row) => <span className="font-medium text-slate-900">{row.productName}</span> },
    { key: 'productCode', label: 'Product Code', render: (row) => <span className="text-slate-500 text-xs font-mono">{row.productCode}</span> },
    { key: 'quantity', label: 'Quantity', render: (row) => <span className="text-slate-600">{row.quantity}</span> },
    { key: 'unitPrice', label: 'Unit Price', render: (row) => <span className="text-slate-600">{formatCurrency(row.unitPrice)}</span> },
    { key: 'gstPct', label: 'GST %', render: (row) => <span className="text-slate-600">{row.gstPct}%</span> },
    { key: 'lineAmount', label: 'Line Amount', render: (row) => <span className="font-medium text-slate-900">{formatCurrency(row.lineAmount)}</span> },
  ];

  // --- Native Exports Generators ---
  const getExportData = () => {
    return filteredData.map(item => ({
      'Invoice Number': item.invoiceNo,
      ...(!isRetailer && { 'Retailer Name': item.retailer }),
      'Order Number': item.orderNo,
      'Invoice Date': item.date,
      'Due Date': item.dueDate,
      'Invoice Amount': item.amount,
      'Payment Status': item.status
    }));
  };

  const handleExportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(getExportData());
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Invoices");
    XLSX.writeFile(wb, `Invoice_Register_${new Date().toISOString().slice(0,10)}.xlsx`);
    setShowExportMenu(false);
  };

  const handleExportCSV = () => {
    const ws = XLSX.utils.json_to_sheet(getExportData());
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
    const doc = new jsPDF('landscape');
    const headers = Object.keys(data[0] || {});
    const body = data.map(obj => headers.map(header => (obj as any)[header]));
    
    doc.text("Pharma ERP - Invoice Balances Ledger", 14, 15);
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
        subtitle="View corporate invoices, configure billing options, tax margins, and log transaction balances."
        actions={
          <div className="flex items-center gap-3">
            {!isRetailer && (
              <ActionButton variant="primary" icon={<Plus className="w-4 h-4" />} onClick={() => setShowCreateModal(true)}>
                Create Invoice
              </ActionButton>
            )}
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
        <SearchInput value={search} onChange={setSearch} placeholder="Search by invoice number, order id or retailer..." />
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

      {/* --- Dialog Component Window: Create New Invoice Form --- */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm overflow-y-auto p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col my-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-2xl">
              <div>
                <h3 className="text-base font-bold text-slate-900">Compile Fresh Distribution Invoice</h3>
                <p className="text-xs text-slate-500">Add billing details and parameters to push invoice into pipeline logs.</p>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600 font-medium text-sm">✕</button>
            </div>

            <form onSubmit={handleCreateInvoiceSubmit} className="overflow-y-auto p-5 space-y-4 flex-1 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Invoice Number *</label>
                  <input required placeholder="INV-RET-XXXX" value={newInvoice.invoiceNo} onChange={e => setNewInvoice({...newInvoice, invoiceNo: e.target.value})} className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-violet-500 outline-none" />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Order Reference Mapping *</label>
                  <input required placeholder="ORD-XXXXX" value={newInvoice.orderNo} onChange={e => setNewInvoice({...newInvoice, orderNo: e.target.value})} className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-violet-500 outline-none" />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Retailer Profile Name *</label>
                  <input required placeholder="e.g. Apollo Pharmacy" value={newInvoice.retailer} onChange={e => setNewInvoice({...newInvoice, retailer: e.target.value})} className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-violet-500 outline-none" />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Retailer Account ID Code</label>
                  <input placeholder="RET-001" value={newInvoice.retailerCode} onChange={e => setNewInvoice({...newInvoice, retailerCode: e.target.value})} className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-violet-500 outline-none" />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Tax Matrix Identification (GSTIN)</label>
                  <input placeholder="29ABCDE1234F1Z5" value={newInvoice.gstNumber} onChange={e => setNewInvoice({...newInvoice, gstNumber: e.target.value})} className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-violet-500 outline-none" />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Payment Target Due Date</label>
                  <input type="date" value={newInvoice.dueDate} onChange={e => setNewInvoice({...newInvoice, dueDate: e.target.value})} className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-violet-500 outline-none" />
                </div>
                <div className="col-span-2">
                  <label className="block text-slate-600 font-semibold mb-1">Billing Destination Address</label>
                  <input placeholder="Enter full primary business address coordinates..." value={newInvoice.billingAddress} onChange={e => setNewInvoice({...newInvoice, billingAddress: e.target.value})} className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-violet-500 outline-none" />
                </div>
              </div>

              {/* --- Line Items Segment Matrix --- */}
              <div className="pt-2">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-slate-800 font-bold uppercase tracking-wider">Line Items Allocation Table</h4>
                  <button type="button" onClick={handleAddFormItem} className="text-violet-600 hover:text-violet-800 font-bold flex items-center gap-0.5">+ Add Line</button>
                </div>

                <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                  {formItems.map((item, index) => (
                    <div key={item.id} className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <input required placeholder="Product Name" value={item.productName} onChange={e => handleItemChange(index, { productName: e.target.value })} className="flex-2 border border-slate-200 rounded p-1.5 bg-white min-w-[120px]" />
                      <input required placeholder="Code" value={item.productCode} onChange={e => handleItemChange(index, { productCode: e.target.value })} className="w-16 border border-slate-200 rounded p-1.5 bg-white font-mono" />
                      <input required type="number" min="1" placeholder="Qty" value={item.quantity} onChange={e => handleItemChange(index, { quantity: Number(e.target.value) })} className="w-14 border border-slate-200 rounded p-1.5 bg-white" />
                      <input required type="number" step="0.01" placeholder="Price" value={item.unitPrice} onChange={e => handleItemChange(index, { unitPrice: Number(e.target.value) })} className="w-16 border border-slate-200 rounded p-1.5 bg-white" />
                      <span className="font-bold text-slate-700 min-w-[50px] text-right">₹{item.lineAmount}</span>
                      <button type="button" onClick={() => handleRemoveFormItem(index)} className="text-slate-400 hover:text-rose-600 p-1"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 border border-slate-200 rounded-lg font-medium text-slate-600 hover:bg-slate-50 transition-colors">Dismiss</button>
                <button type="submit" className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-bold shadow-sm transition-colors">Generate Pipeline Invoice</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- View Invoice Detail Layout Side Drawer --- */}
      <Drawer open={!!viewInvoice} onClose={() => setViewInvoice(null)} title="Invoice Details">
        {viewInvoice && (
          <div className="space-y-6 pb-20 text-xs">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Invoice Information</h3>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                <DrawerField label="Invoice Number" value={<span className="font-semibold text-violet-700">{viewInvoice.invoiceNo}</span>} />
                <DrawerField label="Order Number" value={viewInvoice.orderNo} />
                <DrawerField label="Invoice Date" value={viewInvoice.date} />
                <DrawerField label="Due Date" value={<span className={viewInvoice.status === 'Overdue' ? 'text-rose-600 font-medium' : ''}>{viewInvoice.dueDate}</span>} />
                <DrawerField label="Payment Status" value={<Badge variant={getStatusVariant(viewInvoice.status)}>{viewInvoice.status}</Badge>} />
              </div>
            </div>

            {!isRetailer && (
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Retailer Information</h3>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DrawerField label="Retailer Name" value={<span className="font-medium text-slate-900">{viewInvoice.retailer}</span>} />
                  <DrawerField label="Retailer Code" value={<span className="text-slate-600">{viewInvoice.retailerCode}</span>} />
                </div>
              </div>
            )}

            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Billing Information</h3>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 grid grid-cols-1 gap-4">
                <DrawerField label="Billing Address" value={viewInvoice.billingAddress} />
                <DrawerField label="GST Number" value={<span className="font-mono text-slate-700">{viewInvoice.gstNumber}</span>} />
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
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Subtotal</span>
                    <span className="font-medium text-slate-900">{formatCurrency(viewInvoice.subtotal)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">GST Amount</span>
                    <span className="font-medium text-slate-900">{formatCurrency(viewInvoice.gstAmount)}</span>
                  </div>
                  <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                    <span className="font-bold text-slate-900">Total Invoice Value</span>
                    <span className="text-sm font-bold text-violet-700">{formatCurrency(viewInvoice.amount)}</span>
                  </div>
                  
                  <div className="pt-3 mt-3 border-t border-slate-200 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">Paid Amount</span>
                      <span className="font-medium text-emerald-600">{formatCurrency(viewInvoice.paidAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-slate-900">Outstanding Amount</span>
                      <span className={`font-bold ${viewInvoice.outstandingAmount > 0 ? 'text-rose-600' : 'text-slate-900'}`}>{formatCurrency(viewInvoice.outstandingAmount)}</span>
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