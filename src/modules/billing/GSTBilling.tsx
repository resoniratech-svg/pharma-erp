import { useState, useMemo, useRef, useEffect } from 'react';
import { Search, Plus, Download, Eye, Edit, FileText, XCircle, Filter, ChevronDown, Trash2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

import {
  PageHeader, FilterBar, SearchInput, SelectFilter, ActionButton,
  TableCard, DataTable, Badge, Drawer, DrawerField
} from './components/shared';
import { type Column, type BadgeVariant } from './components/shared';
import { generateInvoicePdf } from '../../documents/generators/pdfGenerator';
import { ROLE_SUPER_ADMIN } from '../../constants/roles';

// --- Types ---
type InvoiceStatus = 'Draft' | 'Generated' | 'Cancelled' | 'Credit Note Issued';
type PaymentStatus = 'Paid' | 'Partial' | 'Unpaid' | 'Overdue';
type InvoiceType = 'Tax Invoice' | 'Debit Note' | 'Credit Note';

interface GSTInvoiceItem {
  productName: string;
  productCode: string;
  batchNumber: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  taxableAmount: number;
  gstPct: number;
  gstAmount: number;
  lineTotal: number;
}

interface GSTInvoice {
  id: string;
  invoiceNo: string;
  invoiceDate: string;
  invoiceType: InvoiceType;
  
  customerName: string;
  gstin: string;
  state: string;
  billingAddress: string;
  contactPerson: string;
  mobileNumber: string;
  
  orderNo: string;
  
  items: GSTInvoiceItem[];
  
  grossAmount: number;
  totalDiscount: number;
  taxableAmount: number;
  totalGst: number;
  roundOff: number;
  netAmount: number;
  
  dueDate: string;
  creditDays: number;
  paymentTerms: string;
  
  paymentStatus: PaymentStatus;
  status: InvoiceStatus;
}

// --- Mock Data ---
const initialInvoices: GSTInvoice[] = [
  {
    id: 'inv1', invoiceNo: 'INV-2026-1001', invoiceDate: '15-Oct-2026', invoiceType: 'Tax Invoice',
    customerName: 'Apollo Pharmacy', gstin: '29ABCDE1234F1Z5', state: 'Karnataka',
    billingAddress: '123 Health Ave, Bangalore, 560001', contactPerson: 'Ramesh Kumar', mobileNumber: '+91 9876543210',
    orderNo: 'ORD-RET-5001',
    items: [
      { productName: 'Amoxicillin 500mg', productCode: 'PRD-001', batchNumber: 'B-2026-X1', quantity: 200, unitPrice: 150, discount: 0, taxableAmount: 30000, gstPct: 12, gstAmount: 3600, lineTotal: 33600 }
    ],
    grossAmount: 30000, totalDiscount: 0, taxableAmount: 30000, totalGst: 3600, roundOff: 0, netAmount: 33600,
    dueDate: '14-Nov-2026', creditDays: 30, paymentTerms: '30 Days',
    paymentStatus: 'Paid', status: 'Generated'
  },
  {
    id: 'inv2', invoiceNo: 'INV-2026-1002', invoiceDate: '16-Oct-2026', invoiceType: 'Tax Invoice',
    customerName: 'MedPlus Store', gstin: '27XYZDE5678G2H4', state: 'Maharashtra',
    billingAddress: '45 Wellness Blvd, Mumbai, 400001', contactPerson: 'Suresh Menon', mobileNumber: '+91 8765432109',
    orderNo: 'ORD-RET-5002',
    items: [
      { productName: 'Paracetamol 650mg', productCode: 'PRD-002', batchNumber: 'B-2026-Y2', quantity: 150, unitPrice: 45, discount: 0, taxableAmount: 6750, gstPct: 12, gstAmount: 810, lineTotal: 7560 }
    ],
    grossAmount: 6750, totalDiscount: 0, taxableAmount: 6750, totalGst: 810, roundOff: 0, netAmount: 7560,
    dueDate: '31-Oct-2026', creditDays: 15, paymentTerms: '15 Days',
    paymentStatus: 'Unpaid', status: 'Draft'
  }
];

const formatCurrency = (amount: number) => `₹ ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// --- Mock Orders for Auto-Population ---
const mockRetailerOrders = [
  { orderNo: 'ORD-RET-5003', customerName: 'Wellness Forever', gstin: '07DELHI9999P1Z1', state: 'Delhi', billingAddress: '78 Care Lane, Delhi', mobileNumber: '7654321098', items: [
    { productName: 'Vitamin C 1000mg', productCode: 'PRD-003', batchNumber: 'B-2026-Z3', quantity: 50, unitPrice: 180 }
  ]},
  { orderNo: 'ORD-RET-5004', customerName: 'PharmaTrust', gstin: '33CHENN1111Q2Z2', state: 'Tamil Nadu', billingAddress: '12 Clinic Road, Chennai', mobileNumber: '6543210987', items: [
    { productName: 'Ibuprofen 400mg', productCode: 'PRD-005', batchNumber: 'B-2026-W4', quantity: 100, unitPrice: 75 }
  ]}
];

const mockDistributorOrders = [
  { orderNo: 'ORD-DIST-1001', customerName: 'National Pharma Distributors', gstin: '27MUMBAI001D1Z5', state: 'Maharashtra', billingAddress: 'Distributor Park, Mumbai', mobileNumber: '9988776655', items: [
    { productName: 'Azithromycin 250mg', productCode: 'PRD-010', batchNumber: 'B-2026-A1', quantity: 500, unitPrice: 40 }
  ]},
  { orderNo: 'ORD-DIST-1002', customerName: 'South India Meds', gstin: '32KERALA002D1Z6', state: 'Kerala', billingAddress: 'Medical Hub, Kochi', mobileNumber: '8877665544', items: [
    { productName: 'Cetirizine 10mg', productCode: 'PRD-011', batchNumber: 'B-2026-C2', quantity: 1000, unitPrice: 5 }
  ]}
];

type InvoiceSource = 'Retailer Order' | 'Distributor Order' | 'Manual Billing';

export default function GSTBilling() {
  const activeRole = localStorage.getItem('activeRole') || ROLE_SUPER_ADMIN;

  const [invoices, setInvoices] = useState<GSTInvoice[]>(initialInvoices);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');

  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  const [viewInvoice, setViewInvoice] = useState<GSTInvoice | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editInvoiceId, setEditInvoiceId] = useState<string | null>(null);

  // New Invoice State
  const [formInvoiceSource, setFormInvoiceSource] = useState<InvoiceSource>('Retailer Order');
  const [formInvoiceType, setFormInvoiceType] = useState<InvoiceType>('Tax Invoice');
  const [formInvoiceDate, setFormInvoiceDate] = useState('');
  
  const [formCustomerName, setFormCustomerName] = useState('');
  const [formGstin, setFormGstin] = useState('');
  const [formState, setFormState] = useState('');
  const [formBillingAddress, setFormBillingAddress] = useState('');
  const [formContactPerson, setFormContactPerson] = useState('');
  const [formMobileNumber, setFormMobileNumber] = useState('');
  
  const [formOrderNo, setFormOrderNo] = useState('');
  
  const [formItems, setFormItems] = useState<GSTInvoiceItem[]>([]);
  
  const [formDueDate, setFormDueDate] = useState('');
  const [formCreditDays, setFormCreditDays] = useState<number>(30);
  const [formPaymentTerms, setFormPaymentTerms] = useState('30 Days');

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // --- Calculations ---
  const calculateTotals = (items: GSTInvoiceItem[]) => {
    let grossAmount = 0;
    let totalDiscount = 0;
    let taxableAmount = 0;
    let totalGst = 0;

    items.forEach(i => {
      grossAmount += (i.quantity * i.unitPrice);
      totalDiscount += i.discount;
      taxableAmount += i.taxableAmount;
      totalGst += i.gstAmount;
    });

    const netBeforeRound = taxableAmount + totalGst;
    const netAmount = Math.round(netBeforeRound);
    const roundOff = Number((netAmount - netBeforeRound).toFixed(2));

    return { grossAmount, totalDiscount, taxableAmount, totalGst, roundOff, netAmount };
  };

  const formTotals = calculateTotals(formItems);

  // --- Auto Population Logic ---
  useEffect(() => {
    if (formOrderNo && formInvoiceSource !== 'Manual Billing') {
      const activeMockOrders = formInvoiceSource === 'Retailer Order' ? mockRetailerOrders : mockDistributorOrders;
      const matchedOrder = activeMockOrders.find(o => o.orderNo === formOrderNo);
      if (matchedOrder) {
        setFormCustomerName(matchedOrder.customerName);
        setFormGstin(matchedOrder.gstin);
        setFormState(matchedOrder.state);
        setFormBillingAddress(matchedOrder.billingAddress);
        setFormMobileNumber(matchedOrder.mobileNumber);
        
        const mappedItems: GSTInvoiceItem[] = matchedOrder.items.map(i => {
          const taxable = i.quantity * i.unitPrice;
          const gstAmt = taxable * 0.12; // default 12%
          return {
            ...i,
            discount: 0,
            taxableAmount: taxable,
            gstPct: 12,
            gstAmount: gstAmt,
            lineTotal: taxable + gstAmt
          };
        });
        setFormItems(mappedItems);
      }
    } else if (formInvoiceSource === 'Manual Billing') {
      setFormOrderNo('');
    }
  }, [formOrderNo, formInvoiceSource]);

  const handleOrderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormOrderNo(e.target.value);
  };

  const handleAddManualItem = () => {
    setFormItems([...formItems, {
      productName: '', productCode: '', batchNumber: '', quantity: 1, unitPrice: 0, discount: 0, taxableAmount: 0, gstPct: 12, gstAmount: 0, lineTotal: 0
    }]);
  };

  const handleUpdateManualItem = (index: number, field: keyof GSTInvoiceItem, value: any) => {
    const newItems = [...formItems];
    const item = { ...newItems[index], [field]: value };
    // Recalculate line totals
    item.taxableAmount = (item.quantity * item.unitPrice) - item.discount;
    item.gstAmount = item.taxableAmount * (item.gstPct / 100);
    item.lineTotal = item.taxableAmount + item.gstAmount;
    newItems[index] = item;
    setFormItems(newItems);
  };

  const handleRemoveManualItem = (index: number) => {
    setFormItems(formItems.filter((_, i) => i !== index));
  };

  // --- Handlers ---
  const handleOpenCreate = () => {
    setFormInvoiceSource('Retailer Order');
    setFormInvoiceDate(new Date().toISOString().split('T')[0]);
    setFormInvoiceType('Tax Invoice');
    setFormCustomerName(''); setFormGstin(''); setFormState(''); setFormBillingAddress(''); setFormContactPerson(''); setFormMobileNumber('');
    setFormOrderNo(''); setFormItems([]);
    setFormDueDate(''); setFormCreditDays(30); setFormPaymentTerms('30 Days');
    setEditInvoiceId(null);
    setIsCreateOpen(true);
  };

  const parseDateToInput = (dateStr: string) => {
    const parts = dateStr.split('-');
    if (parts.length === 3 && parts[0].length === 2) {
      const monthMap: Record<string, string> = { Jan:'01',Feb:'02',Mar:'03',Apr:'04',May:'05',Jun:'06',Jul:'07',Aug:'08',Sep:'09',Oct:'10',Nov:'11',Dec:'12' };
      const mm = monthMap[parts[1]] || parts[1];
      return `${parts[2]}-${mm}-${parts[0]}`;
    }
    return new Date().toISOString().split('T')[0];
  };

  const handleEditInvoice = (inv: GSTInvoice) => {
    setFormInvoiceDate(parseDateToInput(inv.invoiceDate));
    setFormInvoiceType(inv.invoiceType);
    setFormCustomerName(inv.customerName);
    setFormGstin(inv.gstin);
    setFormState(inv.state);
    setFormBillingAddress(inv.billingAddress);
    setFormContactPerson(inv.contactPerson);
    setFormMobileNumber(inv.mobileNumber);
    setFormOrderNo(inv.orderNo);
    setFormItems(inv.items);
    setFormDueDate(inv.dueDate ? parseDateToInput(inv.dueDate) : '');
    setFormCreditDays(inv.creditDays);
    setFormPaymentTerms(inv.paymentTerms);
    setEditInvoiceId(inv.id);
    setIsCreateOpen(true);
  };

  const handleDeleteDraft = (id: string) => {
    setInvoices(prev => prev.filter(inv => inv.id !== id));
  };

  const validateForm = () => {
    if (!formInvoiceSource || !formInvoiceDate || !formInvoiceType || !formCustomerName || !formGstin || !formBillingAddress || formItems.length === 0) {
      return false;
    }
    if (formInvoiceSource !== 'Manual Billing' && !formOrderNo) {
      return false;
    }
    return true;
  };

  const buildInvoiceObject = (status: InvoiceStatus): GSTInvoice => {
    return {
      id: Math.random().toString(36).substr(2, 9),
      invoiceNo: `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      invoiceDate: formInvoiceDate.split('-').reverse().join('-'), // simple format
      invoiceType: formInvoiceType,
      customerName: formCustomerName,
      gstin: formGstin,
      state: formState,
      billingAddress: formBillingAddress,
      contactPerson: formContactPerson,
      mobileNumber: formMobileNumber,
      orderNo: formOrderNo,
      items: formItems,
      ...formTotals,
      dueDate: formDueDate || 'On Receipt',
      creditDays: formCreditDays,
      paymentTerms: formPaymentTerms,
      paymentStatus: 'Unpaid',
      status
    };
  };

  const handleSaveDraft = () => {
    if (!validateForm()) return alert('Please fill all required fields and add at least one item.');
    if (editInvoiceId) {
      const updatedInv = buildInvoiceObject('Draft');
      updatedInv.id = editInvoiceId;
      setInvoices(prev => prev.map(inv => inv.id === editInvoiceId ? updatedInv : inv));
    } else {
      const newInv = buildInvoiceObject('Draft');
      setInvoices([newInv, ...invoices]);
    }
    setIsCreateOpen(false);
  };

  const handleGenerateInvoice = () => {
    if (!validateForm()) return alert('Please fill all required fields and add at least one item.');
    const newInv = buildInvoiceObject('Generated');
    if (editInvoiceId) {
      newInv.id = editInvoiceId;
      setInvoices(prev => prev.map(inv => inv.id === editInvoiceId ? newInv : inv));
    } else {
      setInvoices([newInv, ...invoices]);
    }
    setIsCreateOpen(false);
    
    // Trigger PDF generation
    generatePdfForInvoice(newInv);
  };

  const handleGenerateFromTable = (inv: GSTInvoice) => {
    updateInvoiceStatus(inv.id, 'Generated');
    generatePdfForInvoice({ ...inv, status: 'Generated' });
  };

  const generatePdfForInvoice = (inv: GSTInvoice) => {
    const mockInvoice = {
      invoiceNo: inv.invoiceNo,
      date: inv.invoiceDate,
      dueDate: inv.dueDate,
      status: inv.paymentStatus,
      orderNo: inv.orderNo,
      retailer: inv.customerName,
      retailerCode: inv.gstin,
      billingAddress: inv.billingAddress,
      gstNumber: inv.gstin,
      items: inv.items.map(item => ({
        description: item.productName,
        productCode: item.productCode,
        batch: item.batchNumber,
        quantity: item.quantity,
        rate: item.unitPrice,
        gstPct: item.gstPct,
        amount: item.lineTotal
      })),
      subtotal: inv.taxableAmount,
      gstAmount: inv.totalGst,
      netAmount: inv.netAmount,
      paidAmount: inv.paymentStatus === 'Paid' ? inv.netAmount : (inv.paymentStatus === 'Partial' ? inv.netAmount / 2 : 0),
      outstandingAmount: inv.paymentStatus === 'Paid' ? 0 : (inv.paymentStatus === 'Partial' ? inv.netAmount / 2 : inv.netAmount)
    };
    generateInvoicePdf(mockInvoice, activeRole);
  };

  const updateInvoiceStatus = (id: string, status: InvoiceStatus) => {
    setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, status } : inv));
  };

  const handleCancelInvoice = () => {
    if (window.confirm("Are you sure you want to cancel this invoice? This action cannot be undone.")) {
      updateInvoiceStatus(viewInvoice!.id, 'Cancelled');
      setViewInvoice({ ...viewInvoice!, status: 'Cancelled' });
    }
  };

  // --- Filtering & Export ---
  const visibleInvoices = useMemo(() => {
    return invoices.filter(item => {
      const matchSearch = 
        item.invoiceNo.toLowerCase().includes(search.toLowerCase()) || 
        item.customerName.toLowerCase().includes(search.toLowerCase()) ||
        item.orderNo.toLowerCase().includes(search.toLowerCase()) ||
        item.gstin.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter ? item.status === statusFilter : true;
      const matchPayment = paymentFilter ? item.paymentStatus === paymentFilter : true;
      return matchSearch && matchStatus && matchPayment;
    });
  }, [invoices, search, statusFilter, paymentFilter]);

  const getFormattedDate = () => {
    const d = new Date();
    return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  };

  const handleExportExcel = () => {
    const exportData = visibleInvoices.map(row => ({
      'Invoice No': row.invoiceNo,
      'Invoice Date': row.invoiceDate,
      'Customer Name': row.customerName,
      'GSTIN': row.gstin,
      'Order No': row.orderNo,
      'Taxable Amount': row.taxableAmount,
      'GST Amount': row.totalGst,
      'Total Value': row.netAmount,
      'Payment Status': row.paymentStatus,
      'Status': row.status
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Invoices');
    XLSX.writeFile(workbook, `gst_invoices_${getFormattedDate()}.xlsx`);
    setShowExportMenu(false);
  };

  const handleExportCSV = () => {
    const headers = ['Invoice No', 'Invoice Date', 'Customer Name', 'GSTIN', 'Order No', 'Taxable Amount', 'GST Amount', 'Total Value', 'Payment Status', 'Status'];
    const csvContent = [
      headers.join(','),
      ...visibleInvoices.map(row => 
        [
          `"${row.invoiceNo}"`, `"${row.invoiceDate}"`, `"${row.customerName}"`, `"${row.gstin}"`, `"${row.orderNo}"`,
          row.taxableAmount, row.totalGst, row.netAmount, `"${row.paymentStatus}"`, `"${row.status}"`
        ].join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `gst_invoices_${getFormattedDate()}.csv`;
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportMenu(false);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF('landscape');
    doc.setFontSize(16);
    doc.text('GST Billing Register', 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 22);

    autoTable(doc, {
      startY: 30,
      head: [['Invoice No', 'Date', 'Customer', 'GSTIN', 'Order No', 'Taxable', 'GST', 'Total', 'Payment', 'Status']],
      body: visibleInvoices.map(row => [
        row.invoiceNo, row.invoiceDate, row.customerName, row.gstin, row.orderNo,
        formatCurrency(row.taxableAmount), formatCurrency(row.totalGst), formatCurrency(row.netAmount),
        row.paymentStatus, row.status
      ]),
      theme: 'grid',
      headStyles: { fillColor: [124, 58, 237] }
    });
    doc.save(`gst_invoices_${getFormattedDate()}.pdf`);
    setShowExportMenu(false);
  };

  const getStatusVariant = (status: InvoiceStatus): BadgeVariant => {
    switch (status) {
      case 'Generated': return 'success';
      case 'Draft': return 'warning';
      case 'Cancelled': return 'danger';
      case 'Credit Note Issued': return 'info';
      default: return 'neutral';
    }
  };

  const getPaymentVariant = (status: PaymentStatus): BadgeVariant => {
    switch (status) {
      case 'Paid': return 'success';
      case 'Partial': return 'info';
      case 'Unpaid': return 'warning';
      case 'Overdue': return 'danger';
      default: return 'neutral';
    }
  };

  const columns: Column<GSTInvoice>[] = [
    { key: 'invoiceNo', label: 'Invoice No', render: (row) => <span className="font-semibold text-slate-900">{row.invoiceNo}</span> },
    { key: 'invoiceDate', label: 'Invoice Date' },
    { key: 'customerName', label: 'Customer Name', render: (row) => <span className="font-medium text-violet-700">{row.customerName}</span> },
    { key: 'gstin', label: 'GSTIN', render: (row) => <span className="text-slate-500 text-xs">{row.gstin}</span> },
    { key: 'orderNo', label: 'Order No' },
    { key: 'taxableAmount', label: 'Taxable Amt', render: (row) => <span className="text-slate-700">{formatCurrency(row.taxableAmount)}</span> },
    { key: 'totalGst', label: 'GST Amt', render: (row) => <span className="text-slate-600">{formatCurrency(row.totalGst)}</span> },
    { key: 'netAmount', label: 'Total Value', render: (row) => <span className="font-bold text-slate-900">{formatCurrency(row.netAmount)}</span> },
    { key: 'paymentStatus', label: 'Payment', render: (row) => <Badge variant={getPaymentVariant(row.paymentStatus)}>{row.paymentStatus}</Badge> },
    { key: 'status', label: 'Status', render: (row) => <Badge variant={getStatusVariant(row.status)}>{row.status}</Badge> },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          <button onClick={() => setViewInvoice(row)} className="text-slate-400 hover:text-violet-600 transition-colors p-1" title="View Invoice">
            <Eye className="w-4 h-4" />
          </button>
          
          {row.status === 'Draft' && (
            <>
              <button onClick={() => handleEditInvoice(row)} className="text-slate-400 hover:text-blue-600 transition-colors p-1" title="Edit Draft">
                <Edit className="w-4 h-4" />
              </button>
              <button onClick={() => handleGenerateFromTable(row)} className="text-slate-400 hover:text-emerald-600 transition-colors p-1" title="Generate Invoice">
                <FileText className="w-4 h-4" />
              </button>
              <button onClick={() => handleDeleteDraft(row.id)} className="text-slate-400 hover:text-rose-600 transition-colors p-1" title="Delete Draft">
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}

          {row.status !== 'Draft' && (
            <button onClick={() => generatePdfForInvoice(row)} className="text-slate-400 hover:text-slate-900 transition-colors p-1" title="Download PDF">
              <Download className="w-4 h-4" />
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="GST Billing & Invoicing"
        subtitle="Create, manage, and track GST-compliant sales invoices."
        actions={
          <div className="flex items-center gap-3">
            <div className="relative inline-block text-left" ref={exportMenuRef}>
              <ActionButton 
                variant="secondary" 
                icon={<Download className="w-4 h-4" />}
                onClick={() => setShowExportMenu(!showExportMenu)}
              >
                Export
                <ChevronDown className="w-3 h-3 ml-1" />
              </ActionButton>
              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                  <div className="py-1">
                    <button onClick={handleExportExcel} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">Export Excel (.xlsx)</button>
                    <button onClick={handleExportCSV} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">Export CSV (.csv)</button>
                    <button onClick={handleExportPDF} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">Export PDF (.pdf)</button>
                  </div>
                </div>
              )}
            </div>
            <ActionButton icon={<Plus className="w-4 h-4" />} onClick={handleOpenCreate}>New Invoice</ActionButton>
          </div>
        }
      />

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search invoice, customer, order, GSTIN..." />
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
            { label: 'Cancelled', value: 'Cancelled' },
            { label: 'Credit Note Issued', value: 'Credit Note Issued' },
          ]}
          placeholder="Invoice Status"
        />
        <SelectFilter
          value={paymentFilter}
          onChange={setPaymentFilter}
          options={[
            { label: 'All Payments', value: '' },
            { label: 'Paid', value: 'Paid' },
            { label: 'Partial', value: 'Partial' },
            { label: 'Unpaid', value: 'Unpaid' },
            { label: 'Overdue', value: 'Overdue' },
          ]}
          placeholder="Payment Status"
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

      {/* --- View Drawer --- */}
      <Drawer open={!!viewInvoice} onClose={() => setViewInvoice(null)} title="View Invoice Details">
        {viewInvoice && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Invoice Information</h3>
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
                <DrawerField label="Invoice No" value={<span className="font-semibold text-slate-900">{viewInvoice.invoiceNo}</span>} />
                <DrawerField label="Invoice Date" value={viewInvoice.invoiceDate} />
                <DrawerField label="Invoice Type" value={viewInvoice.invoiceType} />
                <DrawerField label="Status" value={<Badge variant={getStatusVariant(viewInvoice.status)}>{viewInvoice.status}</Badge>} />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Customer Information</h3>
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
                <DrawerField label="Customer Name" value={<span className="font-medium text-violet-700">{viewInvoice.customerName}</span>} />
                <DrawerField label="GSTIN" value={viewInvoice.gstin} />
                <DrawerField label="State" value={viewInvoice.state} />
                <DrawerField label="Mobile Number" value={viewInvoice.mobileNumber} />
                <div className="col-span-2">
                  <DrawerField label="Billing Address" value={viewInvoice.billingAddress} />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Order Information</h3>
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                <DrawerField label="Order Number" value={viewInvoice.orderNo || 'N/A'} />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Product Items</h3>
              <div className="bg-white border border-slate-200 rounded-lg overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-xs">
                    <tr>
                      <th className="px-3 py-2 font-semibold">Product</th>
                      <th className="px-3 py-2 font-semibold text-right">Qty</th>
                      <th className="px-3 py-2 font-semibold text-right">Price</th>
                      <th className="px-3 py-2 font-semibold text-right">GST %</th>
                      <th className="px-3 py-2 font-semibold text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {viewInvoice.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-3 py-2">
                          <div className="font-medium text-slate-900">{item.productName}</div>
                          <div className="text-xs text-slate-500">{item.productCode} • {item.batchNumber}</div>
                        </td>
                        <td className="px-3 py-2 text-right font-mono">{item.quantity}</td>
                        <td className="px-3 py-2 text-right">{formatCurrency(item.unitPrice)}</td>
                        <td className="px-3 py-2 text-right">{item.gstPct}%</td>
                        <td className="px-3 py-2 text-right font-medium text-slate-900">{formatCurrency(item.lineTotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Payment Terms</h3>
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
                <DrawerField label="Payment Status" value={<Badge variant={getPaymentVariant(viewInvoice.paymentStatus)}>{viewInvoice.paymentStatus}</Badge>} />
                <DrawerField label="Payment Terms" value={viewInvoice.paymentTerms} />
                <DrawerField label="Due Date" value={viewInvoice.dueDate} />
                <DrawerField label="Credit Days" value={viewInvoice.creditDays} />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">GST & Invoice Summary</h3>
              <div className="space-y-2 bg-slate-50 p-4 rounded-lg border border-slate-100">
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Gross Amount</span>
                  <span>{formatCurrency(viewInvoice.grossAmount)}</span>
                </div>
                {viewInvoice.totalDiscount > 0 && (
                  <div className="flex justify-between text-sm text-emerald-600">
                    <span>Total Discount</span>
                    <span>- {formatCurrency(viewInvoice.totalDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm text-slate-600 border-t border-slate-200 pt-2 mt-2">
                  <span>Taxable Amount</span>
                  <span className="font-medium text-slate-900">{formatCurrency(viewInvoice.taxableAmount)}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Total GST</span>
                  <span>+ {formatCurrency(viewInvoice.totalGst)}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-500">
                  <span>Round Off</span>
                  <span>{viewInvoice.roundOff > 0 ? '+' : ''}{viewInvoice.roundOff}</span>
                </div>
                <div className="flex justify-between text-base font-bold text-slate-900 pt-3 border-t border-slate-200 mt-2 bg-violet-50 -mx-4 -mb-4 p-4 rounded-b-lg">
                  <span>Net Invoice Value</span>
                  <span className="text-xl text-violet-700">{formatCurrency(viewInvoice.netAmount)}</span>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex justify-between items-center">
              <div>
                {viewInvoice.status === 'Generated' && viewInvoice.paymentStatus === 'Unpaid' && (
                  <button onClick={handleCancelInvoice} className="text-sm font-semibold text-rose-600 hover:text-rose-700 transition-colors">
                    Cancel Invoice
                  </button>
                )}
              </div>
              <div className="flex gap-3">
                <ActionButton variant="secondary" onClick={() => setViewInvoice(null)}>Close</ActionButton>
                {viewInvoice.status !== 'Draft' && (
                  <ActionButton onClick={() => generatePdfForInvoice(viewInvoice)}>Download PDF</ActionButton>
                )}
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* --- New Invoice Modal / Drawer --- */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto p-6 md:p-8 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-900">Create New Invoice</h2>
              <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-slate-700 transition-colors">✕</button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8 space-y-8">
                {/* Sec 1: Invoice Info */}
                <section>
                  <h3 className="text-sm font-semibold text-violet-700 uppercase tracking-wider mb-4 border-b pb-2">1. Invoice Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Invoice Source <span className="text-rose-500">*</span></label>
                      <select value={formInvoiceSource} onChange={e => { setFormInvoiceSource(e.target.value as InvoiceSource); setFormOrderNo(''); setFormItems([]); }} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500 font-semibold bg-violet-50 text-violet-900">
                        <option value="Retailer Order">Retailer Order</option>
                        <option value="Distributor Order">Distributor Order</option>
                        <option value="Manual Billing">Manual Billing</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Invoice Number</label>
                      <input type="text" disabled value="Auto Generated" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Invoice Date <span className="text-rose-500">*</span></label>
                      <input type="date" value={formInvoiceDate} onChange={e => setFormInvoiceDate(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Invoice Type <span className="text-rose-500">*</span></label>
                      <select value={formInvoiceType} onChange={e => setFormInvoiceType(e.target.value as InvoiceType)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500">
                        <option value="Tax Invoice">Tax Invoice</option>
                        <option value="Debit Note">Debit Note</option>
                        <option value="Credit Note">Credit Note</option>
                      </select>
                    </div>
                  </div>
                </section>

                {/* Sec 3: Order Reference (Conditional) */}
                {formInvoiceSource !== 'Manual Billing' && (
                  <section>
                    <h3 className="text-sm font-semibold text-violet-700 uppercase tracking-wider mb-4 border-b pb-2">2. Order Reference</h3>
                    <div>
                      <label className="block text-sm font-medium mb-1">Select Order to Auto-Populate <span className="text-rose-500">*</span></label>
                      <select value={formOrderNo} onChange={handleOrderChange} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500">
                        <option value="">-- Select Approved {formInvoiceSource === 'Retailer Order' ? 'Retailer' : 'Distributor'} Order --</option>
                        {(formInvoiceSource === 'Retailer Order' ? mockRetailerOrders : mockDistributorOrders).map(mo => (
                          <option key={mo.orderNo} value={mo.orderNo}>{mo.orderNo} - {mo.customerName}</option>
                        ))}
                      </select>
                      <p className="text-xs text-slate-500 mt-1">Selecting an order will automatically load customer details and products.</p>
                    </div>
                  </section>
                )}

                {/* Sec 2: Customer Info */}
                <section>
                  <h3 className="text-sm font-semibold text-violet-700 uppercase tracking-wider mb-4 border-b pb-2">3. Customer Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Customer Name <span className="text-rose-500">*</span></label>
                      <input type="text" value={formCustomerName} disabled={formInvoiceSource !== 'Manual Billing'} onChange={e => setFormCustomerName(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500 disabled:bg-slate-50 disabled:text-slate-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">GSTIN <span className="text-rose-500">*</span></label>
                      <input type="text" value={formGstin} disabled={formInvoiceSource !== 'Manual Billing'} onChange={e => setFormGstin(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500 disabled:bg-slate-50 disabled:text-slate-500" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-1">Billing Address <span className="text-rose-500">*</span></label>
                      <textarea rows={2} value={formBillingAddress} disabled={formInvoiceSource !== 'Manual Billing'} onChange={e => setFormBillingAddress(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500 disabled:bg-slate-50 disabled:text-slate-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">State <span className="text-rose-500">*</span></label>
                      <input type="text" value={formState} disabled={formInvoiceSource !== 'Manual Billing'} onChange={e => setFormState(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500 disabled:bg-slate-50 disabled:text-slate-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Mobile Number</label>
                      <input type="text" value={formMobileNumber} disabled={formInvoiceSource !== 'Manual Billing'} onChange={e => setFormMobileNumber(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500 disabled:bg-slate-50 disabled:text-slate-500" />
                    </div>
                  </div>
                </section>

                {/* Sec 4: Product Items */}
                <section>
                  <div className="flex items-center justify-between mb-4 border-b pb-2">
                    <h3 className="text-sm font-semibold text-violet-700 uppercase tracking-wider">4. Product Items <span className="text-rose-500">*</span></h3>
                    {formInvoiceSource === 'Manual Billing' && (
                      <button onClick={handleAddManualItem} className="text-xs font-semibold text-violet-600 hover:text-violet-700 flex items-center gap-1">
                        <Plus className="w-3 h-3" /> Add Item
                      </button>
                    )}
                  </div>
                  <div className="border border-slate-200 rounded-lg overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-xs">
                        <tr>
                          <th className="px-3 py-2">Product</th>
                          <th className="px-3 py-2 w-20">Qty</th>
                          <th className="px-3 py-2 w-24">Rate</th>
                          <th className="px-3 py-2 w-24">Disc.</th>
                          <th className="px-3 py-2 w-24">Taxable</th>
                          <th className="px-3 py-2 w-20">GST%</th>
                          <th className="px-3 py-2 w-24">Total</th>
                          {formInvoiceSource === 'Manual Billing' && <th className="px-3 py-2 w-10"></th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {formItems.length === 0 ? (
                          <tr><td colSpan={formInvoiceSource === 'Manual Billing' ? 8 : 7} className="text-center py-6 text-slate-500">No items added. {formInvoiceSource === 'Manual Billing' ? 'Click "Add Item" to start.' : 'Select an order to auto-populate.'}</td></tr>
                        ) : formItems.map((item, idx) => (
                          <tr key={idx}>
                            {formInvoiceSource === 'Manual Billing' ? (
                              <>
                                <td className="px-3 py-2">
                                  <input type="text" placeholder="Product Name" value={item.productName} onChange={e => handleUpdateManualItem(idx, 'productName', e.target.value)} className="w-full border border-slate-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-violet-500" />
                                </td>
                                <td className="px-3 py-2">
                                  <input type="number" min="1" value={item.quantity} onChange={e => handleUpdateManualItem(idx, 'quantity', parseInt(e.target.value) || 0)} className="w-full border border-slate-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-violet-500" />
                                </td>
                                <td className="px-3 py-2">
                                  <input type="number" min="0" value={item.unitPrice} onChange={e => handleUpdateManualItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)} className="w-full border border-slate-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-violet-500" />
                                </td>
                                <td className="px-3 py-2">
                                  <input type="number" min="0" value={item.discount} onChange={e => handleUpdateManualItem(idx, 'discount', parseFloat(e.target.value) || 0)} className="w-full border border-slate-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-violet-500 text-emerald-600" />
                                </td>
                                <td className="px-3 py-2 font-medium">{formatCurrency(item.taxableAmount)}</td>
                                <td className="px-3 py-2">
                                  <select value={item.gstPct} onChange={e => handleUpdateManualItem(idx, 'gstPct', parseFloat(e.target.value) || 0)} className="w-full border border-slate-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-violet-500">
                                    <option value="0">0%</option><option value="5">5%</option><option value="12">12%</option><option value="18">18%</option><option value="28">28%</option>
                                  </select>
                                </td>
                                <td className="px-3 py-2 font-medium text-slate-900">{formatCurrency(item.lineTotal)}</td>
                                <td className="px-3 py-2">
                                  <button onClick={() => handleRemoveManualItem(idx)} className="text-slate-400 hover:text-rose-600"><Trash2 className="w-4 h-4" /></button>
                                </td>
                              </>
                            ) : (
                              <>
                                <td className="px-3 py-2">
                                  <div className="font-medium text-slate-900 whitespace-nowrap">{item.productName}</div>
                                  <div className="text-xs text-slate-500">{item.productCode} • {item.batchNumber}</div>
                                </td>
                                <td className="px-3 py-2 font-mono">{item.quantity}</td>
                                <td className="px-3 py-2">{formatCurrency(item.unitPrice)}</td>
                                <td className="px-3 py-2 text-emerald-600">{formatCurrency(item.discount)}</td>
                                <td className="px-3 py-2">{formatCurrency(item.taxableAmount)}</td>
                                <td className="px-3 py-2">{item.gstPct}%</td>
                                <td className="px-3 py-2 font-medium text-slate-900">{formatCurrency(item.lineTotal)}</td>
                              </>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
                
                {/* Sec 6: Payment Terms */}
                <section>
                  <h3 className="text-sm font-semibold text-violet-700 uppercase tracking-wider mb-4 border-b pb-2">5. Payment Terms</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Payment Terms</label>
                      <select value={formPaymentTerms} onChange={e => setFormPaymentTerms(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500">
                        <option value="Immediate">Immediate</option>
                        <option value="15 Days">15 Days</option>
                        <option value="30 Days">30 Days</option>
                        <option value="45 Days">45 Days</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Credit Days</label>
                      <input type="number" value={formCreditDays} onChange={e => setFormCreditDays(parseInt(e.target.value) || 0)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Due Date</label>
                      <input type="date" value={formDueDate} onChange={e => setFormDueDate(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500" />
                    </div>
                  </div>
                </section>
              </div>

              {/* Sidebar Summary (Sec 5 & 7 combined for UI layout) */}
              <div className="lg:col-span-4">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 sticky top-6">
                  <h3 className="text-sm font-semibold text-violet-700 uppercase tracking-wider mb-4 border-b pb-2">GST & Summary</h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Gross Amount</span>
                      <span className="font-medium text-slate-900">{formatCurrency(formTotals.grossAmount)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-emerald-600">
                      <span>Total Discount</span>
                      <span>- {formatCurrency(formTotals.totalDiscount)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-semibold text-slate-800 border-t border-slate-200 pt-2">
                      <span>Taxable Amount</span>
                      <span>{formatCurrency(formTotals.taxableAmount)}</span>
                    </div>
                    
                    {/* GST Section dynamically splitting depending on state logic. Mocking split here: */}
                    <div className="bg-white border border-slate-200 rounded-lg p-3 my-3 space-y-2">
                      <p className="text-xs font-semibold text-slate-500 uppercase">GST Calculation</p>
                      {formState.toLowerCase() === 'maharashtra' ? (
                        <>
                          <div className="flex justify-between text-sm text-slate-600"><span>CGST</span><span>{formatCurrency(formTotals.totalGst / 2)}</span></div>
                          <div className="flex justify-between text-sm text-slate-600"><span>SGST</span><span>{formatCurrency(formTotals.totalGst / 2)}</span></div>
                        </>
                      ) : (
                        <div className="flex justify-between text-sm text-slate-600"><span>IGST</span><span>{formatCurrency(formTotals.totalGst)}</span></div>
                      )}
                    </div>

                    <div className="flex justify-between text-sm text-slate-600">
                      <span>Total GST</span>
                      <span className="font-medium text-slate-900">+ {formatCurrency(formTotals.totalGst)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-slate-500">
                      <span>Round Off</span>
                      <span>{formTotals.roundOff > 0 ? '+' : ''}{formTotals.roundOff}</span>
                    </div>

                    <div className="flex justify-between items-center text-lg font-bold text-slate-900 pt-3 border-t border-slate-200">
                      <span>Net Value</span>
                      <span className="text-violet-700 text-2xl">{formatCurrency(formTotals.netAmount)}</span>
                    </div>
                  </div>

                  <div className="mt-8 space-y-3">
                    <button onClick={handleGenerateInvoice} className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold py-2.5 rounded-lg transition-colors">
                      Generate Invoice
                    </button>
                    <button onClick={handleSaveDraft} className="w-full bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold py-2.5 rounded-lg transition-colors">
                      Save as Draft
                    </button>
                    <button onClick={() => setIsCreateOpen(false)} className="w-full text-slate-500 hover:text-slate-700 font-medium py-2 transition-colors">
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
