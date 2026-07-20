import { useState, useMemo, useRef, useEffect } from 'react';
import { Download, Eye, Filter, CheckCircle, XCircle, FileText, ChevronDown } from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { generateInvoicePdf } from '../../documents/generators/pdfGenerator';
import { billingService } from '../../services/billingService';
import { paymentService } from '../../services/paymentService';

import {
  PageHeader, FilterBar, SearchInput, SelectFilter, ActionButton,
  TableCard, DataTable, Badge, Drawer, DrawerField
} from './components/shared';
import { type Column, type BadgeVariant } from './components/shared';

// -- Roles --
import { ROLE_DISTRIBUTOR } from '../../constants/roles';

// --- Types ---
type OrderStatus = 'Pending Approval' | 'Approved' | 'Rejected' | 'Invoice Generated' | 'Dispatched' | 'Delivered';

interface OrderItem {
  productCode: string;
  productName: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface SchemeInfo {
  appliedScheme: string;
  discountAmount: number;
  freeQuantity: number;
}

interface RetailerOrder {
  id: string;
  orderNo: string;
  retailerName: string;
  retailerCode: string;
  mobileNumber: string;
  address: string;
  date: string;
  invoiceNo?: string;
  paymentStatus: 'Paid' | 'Unpaid' | 'Partial';
  status: OrderStatus;
  items: OrderItem[];
  schemeInfo?: SchemeInfo;
  schemeDiscount?: number;
  grossAmount?: number;
  amount?: number;
  netAmount: number;
  distributorCode?: string;
  distributorId?: string;
}

// --- Seed Mock Data if not present ---
const initialOrders: RetailerOrder[] = [
  {
    id: 'ro1', orderNo: 'ORD-RET-5001', retailerName: 'Apollo Pharmacy', retailerCode: 'RET-001',
    mobileNumber: '+91 9876543210', address: '123 Health Ave, Bangalore, 560001',
    date: '10-Oct-2026', paymentStatus: 'Paid', status: 'Delivered',
    items: [
      { productCode: 'PRD-001', productName: 'Amoxicillin 500mg', quantity: 200, rate: 150, amount: 30000 },
      { productCode: 'PRD-002', productName: 'Paracetamol 650mg', quantity: 100, rate: 45, amount: 4500 }
    ],
    schemeInfo: { appliedScheme: 'Volume Discount', discountAmount: 1500, freeQuantity: 10 },
    grossAmount: 34500, netAmount: 33000
  },
  {
    id: 'ro2', orderNo: 'ORD-RET-5002', retailerName: 'MedPlus Store', retailerCode: 'RET-002',
    mobileNumber: '+91 8765432109', address: '45 Wellness Blvd, Mumbai, 400001',
    date: '12-Oct-2026', paymentStatus: 'Unpaid', status: 'Pending Approval',
    items: [
      { productCode: 'PRD-005', productName: 'Ibuprofen 400mg', quantity: 150, rate: 75, amount: 11250 }
    ],
    schemeInfo: { appliedScheme: 'No Scheme', discountAmount: 0, freeQuantity: 0 },
    grossAmount: 11250, netAmount: 11250
  },
  {
    id: 'ro3', orderNo: 'ORD-RET-5003', retailerName: 'Wellness Forever', retailerCode: 'RET-003',
    mobileNumber: '+91 7654321098', address: '78 Care Lane, Delhi, 110001',
    date: '14-Oct-2026', paymentStatus: 'Partial', status: 'Approved',
    items: [
      { productCode: 'PRD-003', productName: 'Vitamin C 1000mg', quantity: 50, rate: 180, amount: 9000 }
    ],
    schemeInfo: { appliedScheme: 'Festive Offer 5%', discountAmount: 450, freeQuantity: 0 },
    grossAmount: 9000, netAmount: 8550
  },
  {
    id: 'ro4', orderNo: 'ORD-RET-5004', retailerName: 'Apollo Pharmacy', retailerCode: 'RET-001',
    mobileNumber: '+91 9876543210', address: '123 Health Ave, Bangalore, 560001',
    date: '15-Oct-2026', invoiceNo: 'INV-2026-5004', paymentStatus: 'Unpaid', status: 'Invoice Generated',
    items: [
      { productCode: 'PRD-002', productName: 'Paracetamol 650mg', quantity: 300, rate: 45, amount: 13500 }
    ],
    schemeInfo: { appliedScheme: 'No Scheme', discountAmount: 0, freeQuantity: 0 },
    grossAmount: 13500, netAmount: 13500
  },
  {
    id: 'ro5', orderNo: 'ORD-RET-5005', retailerName: 'PharmaTrust', retailerCode: 'RET-004',
    mobileNumber: '+91 6543210987', address: '12 Clinic Road, Chennai, 600001',
    date: '16-Oct-2026', paymentStatus: 'Paid', status: 'Dispatched',
    items: [
      { productCode: 'PRD-001', productName: 'Amoxicillin 500mg', quantity: 100, rate: 150, amount: 15000 }
    ],
    schemeInfo: { appliedScheme: 'No Scheme', discountAmount: 0, freeQuantity: 0 },
    grossAmount: 15000, netAmount: 15000
  }
];

const formatCurrency = (amount: number | undefined | null) => {
  if (amount === null || amount === undefined || isNaN(amount)) return '₹ 0.00';
  return `₹ ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatCurrencyOrDash = (amount: number | null | undefined) => {
  if (amount === null || amount === undefined || isNaN(amount)) return '--';
  return `₹ ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export default function RetailerOrders() {
  const activeRole = localStorage.getItem('activeRole') || ROLE_DISTRIBUTOR;

  // 1. Get Authenticated User
  const authUser = useMemo(() => {
    const str = localStorage.getItem('authUser');
    return str ? JSON.parse(str) : null;
  }, []);

  const loggedInDistributorCode = useMemo(() => {
    const role = localStorage.getItem('activeRole') || authUser?.role || '';
    if (role === 'SUPER_ADMIN') {
      return '';
    }
    let code = authUser?.linkedDistributorCode || authUser?.distributorCode || '';
    if (!code && (authUser?.email === 'distributor@pharmaerp.com' || authUser?.fullName === 'Amit Kumar' || role === 'DISTRIBUTOR')) {
      return 'DIST-001';
    }
    return code;
  }, [authUser]);

  // 3. Resolve Distributor Details from Distributor Master
  const loggedInDistributor = useMemo(() => {
    if (!loggedInDistributorCode) return null;
    const rawMaster = localStorage.getItem('pharma_erp_distributor_master') || localStorage.getItem('pharma_erp_distributors') || '[]';
    try {
      const distributors = JSON.parse(rawMaster);
      return distributors.find((d: any) => 
        d.code === loggedInDistributorCode || 
        d.distributorCode === loggedInDistributorCode || 
        d.id === loggedInDistributorCode
      ) || null;
    } catch (e) {
      return null;
    }
  }, [loggedInDistributorCode]);

  // 4. Resolve Retailer Master Details Helper
  const getRetailerDetails = (retailerCode: string) => {
    const rawRetailers = localStorage.getItem('pharma_erp_retailer_master') || '[]';
    try {
      const retailers = JSON.parse(rawRetailers);
      const retailer = retailers.find((r: any) => r.code === retailerCode);
      if (retailer) {
        return {
          name: retailer.name || '',
          code: retailer.code || '',
          gstNumber: retailer.gstNumber || retailer.gstin || '',
          mobileNumber: retailer.mobileNumber || retailer.mobile || '',
          address: retailer.address || '',
          creditLimit: retailer.creditLimit !== undefined && retailer.creditLimit !== null ? Number(retailer.creditLimit) : null,
          outstandingBalance: retailer.outstandingBalance !== undefined && retailer.outstandingBalance !== null ? Number(retailer.outstandingBalance) : 
                              retailer.outstanding !== undefined && retailer.outstanding !== null ? Number(retailer.outstanding) : null,
          assignedDistributors: retailer.assignedDistributors || []
        };
      }
    } catch (e) {
      console.error(e);
    }
    return {
      name: '',
      code: '',
      gstNumber: '',
      mobileNumber: '',
      address: '',
      creditLimit: null,
      outstandingBalance: null,
      assignedDistributors: []
    };
  };

  // 5. Get dynamic Order status from other modules (Invoice & Dispatch)
  const getOrderCurrentStatus = (order: RetailerOrder): OrderStatus => {
    if (order.status === 'Pending Approval' || order.status === 'Rejected') {
      return order.status;
    }

    const invoices = billingService.getInvoices();
    const invoice = invoices.find(inv => inv.id === order.id);

    if (invoice) {
      const trackingStr = localStorage.getItem('pharma_erp_dispatch_tracking');
      if (trackingStr) {
        try {
          const trackingList = JSON.parse(trackingStr);
          const trackingRecord = trackingList.find((t: any) => t.orderId === order.id);
          if (trackingRecord) {
            if (trackingRecord.status === 'Delivered') return 'Delivered';
            if (['In Transit', 'Dispatched', 'Ready to Ship', 'Packed'].includes(trackingRecord.status)) return 'Dispatched';
          }
        } catch (e) {
          console.error(e);
        }
      }
      return 'Invoice Generated';
    }

    return order.status;
  };

  // Load orders from LocalStorage
  const [orders, setOrders] = useState<RetailerOrder[]>(() => {
    const data = localStorage.getItem('pharma_erp_retailer_orders');
    if (data !== null) {
      try {
        return JSON.parse(data);
      } catch (e) {
        console.error("Failed to parse retailer orders:", e);
      }
    }
    localStorage.setItem('pharma_erp_retailer_orders', JSON.stringify(initialOrders));
    return initialOrders;
  });

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [viewOrder, setViewOrder] = useState<RetailerOrder | null>(null);

  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const saveOrders = (updatedOrders: RetailerOrder[]) => {
    setOrders(updatedOrders);
    localStorage.setItem('pharma_erp_retailer_orders', JSON.stringify(updatedOrders));
  };

  const updateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    const updated = orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o);
    saveOrders(updated);
    setViewOrder(null);
  };

  const updateOrderPaymentStatus = (orderId: string, newStatus: string) => {
    const target = orders.find(o => o.id === orderId);
    if (target && newStatus === 'Paid') {
      try {
        paymentService.create({
          invoiceNo: target.invoiceNo || target.orderNo,
          amount: target.netAmount || target.amount || 0,
          paymentDate: new Date().toISOString().split('T')[0],
          paymentMethod: 'Bank Transfer',
          transactionRef: `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
          status: 'Completed',
          notes: `Payment recorded for order ${target.orderNo}`,
          retailerCode: target.retailerCode,
          retailerName: target.retailerName || (target as any).retailer
        });
      } catch (e) {
        console.error("Failed to auto-create payment entry:", e);
      }
    }
    const updated = orders.map(o => o.id === orderId ? { ...o, paymentStatus: newStatus as any } : o);
    saveOrders(updated);
    setViewOrder(null);
  };

  const handleGenerateInvoice = (order: RetailerOrder) => {
    const nextInvoiceNo = billingService.getNextInvoiceNo();
    const invoiceDate = new Date().toISOString().split('T')[0];
    const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const gstInvoice = {
      id: order.id,
      invoiceNo: nextInvoiceNo,
      customerId: order.retailerCode,
      customerName: order.retailerName,
      date: invoiceDate,
      dueDate: dueDate,
      items: order.items.map((item, idx) => ({
        id: `${order.id}-item-${idx}`,
        productId: item.productCode,
        productCode: item.productCode,
        productName: item.productName,
        batchNo: 'BATCH-GEN',
        qty: item.quantity,
        freeQty: 0,
        ptr: item.rate,
        mrp: item.rate * 1.2,
        discountPercent: 0,
        gstPercent: 12,
        total: item.amount,
        stock: 9999
      })),
      subTotal: order.grossAmount ?? order.amount ?? 0,
      cgstTotal: (order.grossAmount ?? order.amount ?? 0) * 0.06,
      sgstTotal: (order.grossAmount ?? order.amount ?? 0) * 0.06,
      igstTotal: 0,
      grandTotal: order.netAmount,
      paymentMode: 'Credit',
      status: 'Unpaid'
    };

    billingService.saveInvoice(gstInvoice);
    billingService.incrementCounter();

    const updated = orders.map(o => o.id === order.id ? { ...o, status: 'Invoice Generated' as OrderStatus, invoiceNo: nextInvoiceNo } : o);
    saveOrders(updated);
    setViewOrder(null);
  };

  const handleDownloadInvoice = (order: RetailerOrder) => {
    const invoiceNo = order.invoiceNo || order.orderNo.replace('ORD-RET', 'INV-2026');
    const retailerDetails = getRetailerDetails(order.retailerCode);
    const mockInvoice = {
      invoiceNo: invoiceNo,
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-'),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-'),
      status: order.paymentStatus,
      orderNo: order.orderNo,
      retailer: retailerDetails.name || '--',
      retailerCode: retailerDetails.code || '--',
      billingAddress: retailerDetails.address || '--',
      gstNumber: retailerDetails.gstNumber || '--',
      items: order.items.map(item => ({
        description: item.productName,
        productCode: item.productCode,
        quantity: item.quantity,
        rate: item.rate,
        gstPct: 12,
        amount: item.amount
      })),
      subtotal: order.grossAmount ?? order.amount ?? 0,
      gstAmount: (order.grossAmount ?? order.amount ?? 0) * 0.12,
      netAmount: order.netAmount,
      paidAmount: order.paymentStatus === 'Paid' ? order.netAmount : 0,
      outstandingAmount: order.paymentStatus === 'Paid' ? 0 : order.netAmount
    };
    generateInvoicePdf(mockInvoice, activeRole);
  };

  // --- Filtering ---
  const visibleOrders = useMemo(() => {
    if (activeRole !== ROLE_DISTRIBUTOR) return [];

    return orders.filter(item => {
      const retailer = getRetailerDetails(item.retailerCode);
      
      const explicitlyBelongs = item.distributorCode === loggedInDistributorCode || 
                                item.distributorId === loggedInDistributorCode;

      let isLinked = false;
      if (Array.isArray(retailer.assignedDistributors)) {
        isLinked = retailer.assignedDistributors.some((d: any) => 
          d === loggedInDistributorCode ||
          (d && (d.code === loggedInDistributorCode || 
                 d.distributorCode === loggedInDistributorCode || 
                 d.id === loggedInDistributorCode))
        );
      } else if (typeof retailer.assignedDistributors === 'string') {
         isLinked = retailer.assignedDistributors === loggedInDistributorCode;
      }

      // If it's a mock order and no code is provided, show it if we are the default distributor
      const isMockDefault = !item.distributorCode && loggedInDistributorCode === 'DIST-001';

      if (!explicitlyBelongs && !isLinked && !isMockDefault) return false;

      const matchSearch = item.orderNo.toLowerCase().includes(search.toLowerCase()) || 
                          (retailer.name && retailer.name.toLowerCase().includes(search.toLowerCase()));
      const currentStatus = getOrderCurrentStatus(item);
      const matchStatus = statusFilter ? currentStatus === statusFilter : true;
      return matchSearch && matchStatus;
    });
  }, [orders, search, statusFilter, activeRole, loggedInDistributorCode]);

  // --- Exports ---
  const getFormattedDate = () => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}${mm}${dd}`;
  };

  const handleExportExcel = () => {
    const exportData = visibleOrders.map(row => {
      const retailer = getRetailerDetails(row.retailerCode);
      const currentStatus = getOrderCurrentStatus(row);
      return {
        'Order No': row.orderNo,
        'Retailer': retailer.name || '--',
        'Order Date': row.date,
        'Order Value': row.netAmount,
        'Payment Status': row.paymentStatus,
        'Status': currentStatus
      };
    });
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Retailer Orders');
    XLSX.writeFile(workbook, `retailer_orders_${getFormattedDate()}.xlsx`);
    setShowExportMenu(false);
  };

  const handleExportCSV = () => {
    const headers = ['Order No', 'Retailer', 'Order Date', 'Order Value', 'Payment Status', 'Status'];
    const csvContent = [
      headers.join(','),
      ...visibleOrders.map(row => {
        const retailer = getRetailerDetails(row.retailerCode);
        const currentStatus = getOrderCurrentStatus(row);
        return [
          `"${row.orderNo}"`, `"${retailer.name || '--'}"`, `"${row.date}"`, 
          row.netAmount, `"${row.paymentStatus}"`, `"${currentStatus}"`
        ].join(',');
      })
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `retailer_orders_${getFormattedDate()}.csv`;
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportMenu(false);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Retailer Orders Export', 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 22);

    autoTable(doc, {
      startY: 30,
      head: [['Order No', 'Retailer', 'Date', 'Order Value', 'Payment', 'Status']],
      body: visibleOrders.map(row => {
        const retailer = getRetailerDetails(row.retailerCode);
        const currentStatus = getOrderCurrentStatus(row);
        return [
          row.orderNo,
          retailer.name || '--',
          row.date,
          formatCurrency(row.netAmount),
          row.paymentStatus,
          currentStatus
        ];
      }),
      theme: 'grid',
      headStyles: { fillColor: [139, 92, 246] }
    });
    doc.save(`retailer_orders_${getFormattedDate()}.pdf`);
    setShowExportMenu(false);
  };

  const getStatusVariant = (status: OrderStatus): BadgeVariant => {
    switch (status) {
      case 'Pending Approval': 
      case 'Pending': 
        return 'warning';
      case 'Approved': return 'info';
      case 'Invoice Generated': return 'neutral';
      case 'Dispatched': return 'info';
      case 'Delivered': return 'success';
      case 'Rejected': return 'danger';
      default: return 'neutral';
    }
  };

  const getPaymentVariant = (status: string): BadgeVariant => {
    if (status === 'Paid') return 'success';
    if (status === 'Unpaid') return 'danger';
    return 'warning';
  };

  // --- Columns ---
  const columns: Column<RetailerOrder>[] = [
    { key: 'orderNo', label: 'Order No', render: (row) => <span className="font-semibold text-slate-900">{row.orderNo}</span> },
    { key: 'retailerName', label: 'Retailer', render: (row) => <span className="font-semibold text-violet-700">{row.retailerName || row.retailer || getRetailerDetails(row.retailerCode).name || '--'}</span> },
    { key: 'products', label: 'Products', render: (row) => {
        const productNames = row.items?.map(i => i.productName).join(', ') || '--';
        return <span className="text-sm text-slate-500 truncate max-w-[200px] block" title={productNames}>{productNames}</span>;
      } 
    },
    { key: 'date', label: 'Order Date' },
    { key: 'netAmount', label: 'Order Value', render: (row) => <span className="font-bold text-slate-800">{formatCurrency(row.netAmount)}</span> },
    { key: 'paymentStatus', label: 'Payment Status', render: (row) => <Badge variant={getPaymentVariant(row.paymentStatus)}>{row.paymentStatus}</Badge> },
    { key: 'status', label: 'Order Status', render: (row) => <Badge variant={getStatusVariant(getOrderCurrentStatus(row))}>{getOrderCurrentStatus(row)}</Badge> },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => {
        const currentStatus = getOrderCurrentStatus(row);
        return (
          <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
            <button onClick={() => setViewOrder(row)} className="text-slate-400 hover:text-[#163c78] transition-colors p-1" title="View Order">
              <Eye className="w-4 h-4" />
            </button>
            
            {(currentStatus === 'Pending Approval' || currentStatus === 'Pending') && (
              <div className="flex items-center gap-2 ml-1">
                <button onClick={() => updateOrderStatus(row.id, 'Approved')} className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-md transition-colors shadow-sm" title="Approve">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Approve
                </button>
                <button onClick={() => updateOrderStatus(row.id, 'Rejected')} className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 rounded-md transition-colors shadow-sm" title="Reject">
                  <XCircle className="w-3.5 h-3.5" />
                  Reject
                </button>
              </div>
            )}

            {currentStatus === 'Approved' && (
              <button onClick={() => handleGenerateInvoice(row)} className="text-slate-400 hover:text-blue-600 transition-colors p-1" title="Generate Invoice">
                <FileText className="w-4 h-4" />
              </button>
            )}

            {currentStatus === 'Invoice Generated' && (
              <button onClick={() => handleDownloadInvoice(row)} className="text-slate-400 hover:text-slate-900 transition-colors p-1" title="Download Invoice">
                <Download className="w-4 h-4" />
              </button>
            )}
          </div>
        );
      }
    }
  ];

  if (activeRole !== ROLE_DISTRIBUTOR || !loggedInDistributorCode) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-500 font-medium">You do not have permission to view this screen.</p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Retailer Orders"
        subtitle="Manage and process incoming purchase orders from your retailers."
        actions={
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
        }
      />

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search order no or retailer..." />
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
            { label: 'Pending Approval', value: 'Pending Approval' },
            { label: 'Approved', value: 'Approved' },
            { label: 'Rejected', value: 'Rejected' },
            { label: 'Invoice Generated', value: 'Invoice Generated' },
            { label: 'Dispatched', value: 'Dispatched' },
            { label: 'Delivered', value: 'Delivered' },
          ]}
          placeholder="Status"
        />
      </FilterBar>

      <TableCard>
        <div className="[&>div::-webkit-scrollbar]:hidden [&>div]:[-ms-overflow-style:none] [&>div]:[scrollbar-width:none]">
          <DataTable
            columns={columns}
            data={visibleOrders}
            emptyMessage="No retailer orders found."
          />
        </div>
      </TableCard>

      {/* --- View Drawer --- */}
      <Drawer open={!!viewOrder} onClose={() => setViewOrder(null)} title="Retailer Order Details">
        {viewOrder && (() => {
          const retailerDetails = getRetailerDetails(viewOrder.retailerCode);
          const currentStatus = getOrderCurrentStatus(viewOrder);
          return (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Order Information</h3>
                <div className="space-y-2 bg-slate-50 p-4 rounded-lg border border-slate-100">
                  <DrawerField label="Order No" value={<span className="font-semibold text-slate-900">{viewOrder.orderNo}</span>} />
                  <DrawerField label="Order Date" value={viewOrder.date} />
                  <DrawerField label="Order Status" value={<Badge variant={getStatusVariant(currentStatus)}>{currentStatus}</Badge>} />
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Retailer Information</h3>
                <div className="space-y-2 bg-slate-50 p-4 rounded-lg border border-slate-100">
                  <DrawerField label="Retailer Name" value={<span className="font-medium text-violet-700">{viewOrder.retailerName || (viewOrder as any).retailer || retailerDetails.name || '--'}</span>} />
                  <DrawerField label="Retailer Code" value={viewOrder.retailerCode || retailerDetails.code || '--'} />
                  <DrawerField label="GST Number" value={retailerDetails.gstNumber || '--'} />
                  <DrawerField label="Mobile Number" value={retailerDetails.mobileNumber || '--'} />
                  <DrawerField label="Address" value={retailerDetails.address || '--'} />
                  <DrawerField label="Credit Limit" value={formatCurrencyOrDash(retailerDetails.creditLimit)} />
                  <DrawerField label="Outstanding Balance" value={formatCurrencyOrDash(retailerDetails.outstandingBalance)} />
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Order Items</h3>
                <div className="bg-white border border-slate-200 rounded-lg overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Product</th>
                        <th className="px-4 py-3 font-semibold">Rate</th>
                        <th className="px-4 py-3 font-semibold">Qty</th>
                        <th className="px-4 py-3 font-semibold text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {viewOrder.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="font-medium text-slate-900">{item.productName}</div>
                            <div className="text-xs text-slate-500">{item.productCode}</div>
                          </td>
                          <td className="px-4 py-3 text-slate-700">{formatCurrency(item.rate)}</td>
                          <td className="px-4 py-3 font-mono font-medium">{item.quantity}</td>
                          <td className="px-4 py-3 text-right font-medium text-slate-900">{formatCurrency(item.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Scheme Information</h3>
                <div className="space-y-2 bg-slate-50 p-4 rounded-lg border border-slate-100">
                  <DrawerField label="Applied Scheme" value={<span className="text-emerald-600 font-medium">{viewOrder.schemeInfo?.appliedScheme || 'N/A'}</span>} />
                  <DrawerField label="Discount Amount" value={<span className="text-slate-900 font-medium">{formatCurrency(viewOrder.schemeInfo?.discountAmount ?? viewOrder.schemeDiscount ?? 0)}</span>} />
                  <DrawerField label="Free Quantity" value={viewOrder.schemeInfo?.freeQuantity ? (viewOrder.schemeInfo.freeQuantity > 0 ? <span className="font-medium text-emerald-600">{viewOrder.schemeInfo.freeQuantity} units</span> : 'None') : 'None'} />
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Order Summary</h3>
                <div className="space-y-2 bg-slate-50 p-4 rounded-lg border border-slate-100">
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Gross Amount</span>
                    <span className="font-medium text-slate-900">{formatCurrency(viewOrder.grossAmount ?? viewOrder.amount ?? 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-emerald-600">
                    <span>Discount Amount</span>
                    <span>- {formatCurrency(viewOrder.schemeInfo?.discountAmount ?? viewOrder.schemeDiscount ?? 0)}</span>
                  </div>
                  <div className="flex justify-between text-base font-bold text-slate-900 pt-3 border-t border-slate-200 mt-2">
                    <span>Net Amount</span>
                    <span className="text-xl text-violet-700">{formatCurrency(viewOrder.netAmount)}</span>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
                {(currentStatus === 'Pending Approval' || currentStatus === 'Pending') && (
                  <>
                    <ActionButton variant="secondary" onClick={() => updateOrderStatus(viewOrder.id, 'Rejected')}>Reject Order</ActionButton>
                    <ActionButton onClick={() => updateOrderStatus(viewOrder.id, 'Approved')}>Approve Order</ActionButton>
                  </>
                )}
                {currentStatus === 'Approved' && (
                  <ActionButton onClick={() => handleGenerateInvoice(viewOrder)}>Generate Invoice</ActionButton>
                )}
                {(viewOrder.paymentStatus === 'Unpaid' || viewOrder.paymentStatus === 'Partial') && (
                  <button onClick={() => updateOrderPaymentStatus(viewOrder.id, 'Paid')} className="px-4 py-2 text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-lg transition-colors shadow-sm">
                    Mark as Paid
                  </button>
                )}
                {currentStatus === 'Invoice Generated' && (
                  <ActionButton onClick={() => handleDownloadInvoice(viewOrder)}>Download Invoice</ActionButton>
                )}
                <ActionButton variant="secondary" onClick={() => setViewOrder(null)}>Close</ActionButton>
              </div>
            </div>
          );
        })()}
      </Drawer>
    </div>
  );
}