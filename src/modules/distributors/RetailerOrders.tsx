import { useState, useMemo, useRef, useEffect } from 'react';
import { Download, Eye, Filter, CheckCircle, XCircle, FileText, ChevronDown } from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { generateInvoicePdf } from '../../documents/generators/pdfGenerator';

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
  schemeInfo: SchemeInfo;
  grossAmount: number;
  netAmount: number;
}

// --- Mock Data ---
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

const formatCurrency = (amount: number) => `₹ ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function RetailerOrders() {
  const activeRole = localStorage.getItem('activeRole') || ROLE_DISTRIBUTOR;

  const [orders, setOrders] = useState<RetailerOrder[]>(initialOrders);
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

  const updateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    setViewOrder(null);
  };

  const handleGenerateInvoice = (order: RetailerOrder) => {
    const invoiceNo = order.orderNo.replace('ORD-RET', 'INV-2026');
    setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'Invoice Generated', invoiceNo } : o));
    setViewOrder(null);
  };

  const handleDownloadInvoice = (order: RetailerOrder) => {
    const invoiceNo = order.invoiceNo || order.orderNo.replace('ORD-RET', 'INV-2026');
    const mockInvoice = {
      invoiceNo: invoiceNo,
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-'),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-'),
      status: order.paymentStatus,
      orderNo: order.orderNo,
      retailer: order.retailerName,
      retailerCode: order.retailerCode,
      billingAddress: order.address,
      gstNumber: '27AADCB2230M1Z2', // Mock GSTIN
      items: order.items.map(item => ({
        description: item.productName,
        productCode: item.productCode,
        quantity: item.quantity,
        rate: item.rate,
        gstPct: 12, // Mock GST
        amount: item.amount
      })),
      subtotal: order.grossAmount,
      gstAmount: order.grossAmount * 0.12,
      netAmount: order.netAmount,
      paidAmount: order.paymentStatus === 'Paid' ? order.netAmount : 0,
      outstandingAmount: order.paymentStatus === 'Paid' ? 0 : order.netAmount
    };
    generateInvoicePdf(mockInvoice, activeRole);
  };

  // --- Filtering ---
  const visibleOrders = useMemo(() => {
    // This screen is distributor-only, but logic strictly enforces visibility
    if (activeRole !== ROLE_DISTRIBUTOR) return [];

    return orders.filter(item => {
      const matchSearch = item.orderNo.toLowerCase().includes(search.toLowerCase()) || 
                          item.retailerName.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter ? item.status === statusFilter : true;
      return matchSearch && matchStatus;
    });
  }, [orders, search, statusFilter, activeRole]);

  // --- Exports ---
  const getFormattedDate = () => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}${mm}${dd}`;
  };

  const handleExportExcel = () => {
    const exportData = visibleOrders.map(row => ({
      'Order No': row.orderNo,
      'Retailer': row.retailerName,
      'Order Date': row.date,
      'Order Value': row.netAmount,
      'Payment Status': row.paymentStatus,
      'Status': row.status
    }));
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
      ...visibleOrders.map(row => 
        [
          `"${row.orderNo}"`, `"${row.retailerName}"`, `"${row.date}"`, 
          row.netAmount, `"${row.paymentStatus}"`, `"${row.status}"`
        ].join(',')
      )
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
      body: visibleOrders.map(row => [
        row.orderNo,
        row.retailerName,
        row.date,
        formatCurrency(row.netAmount),
        row.paymentStatus,
        row.status
      ]),
      theme: 'grid',
      headStyles: { fillColor: [139, 92, 246] }
    });
    doc.save(`retailer_orders_${getFormattedDate()}.pdf`);
    setShowExportMenu(false);
  };

  const getStatusVariant = (status: OrderStatus): BadgeVariant => {
    switch (status) {
      case 'Pending Approval': return 'warning';
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
    { key: 'retailerName', label: 'Retailer', render: (row) => <span className="font-semibold text-violet-700">{row.retailerName}</span> },
    { key: 'date', label: 'Order Date' },
    { key: 'netAmount', label: 'Order Value', render: (row) => <span className="font-bold text-slate-800">{formatCurrency(row.netAmount)}</span> },
    { key: 'paymentStatus', label: 'Payment Status', render: (row) => <Badge variant={getPaymentVariant(row.paymentStatus)}>{row.paymentStatus}</Badge> },
    { key: 'status', label: 'Order Status', render: (row) => <Badge variant={getStatusVariant(row.status)}>{row.status}</Badge> },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          <button onClick={() => setViewOrder(row)} className="text-slate-400 hover:text-violet-600 transition-colors p-1" title="View Order">
            <Eye className="w-4 h-4" />
          </button>
          
          {row.status === 'Pending Approval' && (
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

          {row.status === 'Approved' && (
            <button onClick={() => handleGenerateInvoice(row)} className="text-slate-400 hover:text-blue-600 transition-colors p-1" title="Generate Invoice">
              <FileText className="w-4 h-4" />
            </button>
          )}

          {row.status === 'Invoice Generated' && (
            <button onClick={() => handleDownloadInvoice(row)} className="text-slate-400 hover:text-slate-900 transition-colors p-1" title="Download Invoice">
              <Download className="w-4 h-4" />
            </button>
          )}
        </div>
      )
    }
  ];

  if (activeRole !== ROLE_DISTRIBUTOR) {
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
        {viewOrder && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Order Information</h3>
              <div className="space-y-2 bg-slate-50 p-4 rounded-lg border border-slate-100">
                <DrawerField label="Order No" value={<span className="font-semibold text-slate-900">{viewOrder.orderNo}</span>} />
                <DrawerField label="Order Date" value={viewOrder.date} />
                <DrawerField label="Order Status" value={<Badge variant={getStatusVariant(viewOrder.status)}>{viewOrder.status}</Badge>} />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Retailer Information</h3>
              <div className="space-y-2 bg-slate-50 p-4 rounded-lg border border-slate-100">
                <DrawerField label="Retailer Name" value={<span className="font-medium text-violet-700">{viewOrder.retailerName}</span>} />
                <DrawerField label="Retailer Code" value={viewOrder.retailerCode} />
                <DrawerField label="Mobile Number" value={viewOrder.mobileNumber} />
                <DrawerField label="Address" value={viewOrder.address} />
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
                <DrawerField label="Applied Scheme" value={<span className="text-emerald-600 font-medium">{viewOrder.schemeInfo.appliedScheme}</span>} />
                <DrawerField label="Discount Amount" value={<span className="text-slate-900 font-medium">{formatCurrency(viewOrder.schemeInfo.discountAmount)}</span>} />
                <DrawerField label="Free Quantity" value={viewOrder.schemeInfo.freeQuantity > 0 ? <span className="font-medium text-emerald-600">{viewOrder.schemeInfo.freeQuantity} units</span> : 'None'} />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Order Summary</h3>
              <div className="space-y-2 bg-slate-50 p-4 rounded-lg border border-slate-100">
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Gross Amount</span>
                  <span className="font-medium text-slate-900">{formatCurrency(viewOrder.grossAmount)}</span>
                </div>
                <div className="flex justify-between text-sm text-emerald-600">
                  <span>Discount Amount</span>
                  <span>- {formatCurrency(viewOrder.schemeInfo.discountAmount)}</span>
                </div>
                <div className="flex justify-between text-base font-bold text-slate-900 pt-3 border-t border-slate-200 mt-2">
                  <span>Net Amount</span>
                  <span className="text-xl text-violet-700">{formatCurrency(viewOrder.netAmount)}</span>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
              {viewOrder.status === 'Pending Approval' && (
                <>
                  <ActionButton variant="secondary" onClick={() => updateOrderStatus(viewOrder.id, 'Rejected')}>Reject Order</ActionButton>
                  <ActionButton onClick={() => updateOrderStatus(viewOrder.id, 'Approved')}>Approve Order</ActionButton>
                </>
              )}
              {viewOrder.status === 'Approved' && (
                <ActionButton onClick={() => handleGenerateInvoice(viewOrder)}>Generate Invoice</ActionButton>
              )}
              {viewOrder.status === 'Invoice Generated' && (
                <ActionButton onClick={() => handleDownloadInvoice(viewOrder)}>Download Invoice</ActionButton>
              )}
              <ActionButton variant="secondary" onClick={() => setViewOrder(null)}>Close</ActionButton>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
