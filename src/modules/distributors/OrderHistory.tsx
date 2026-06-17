import { useState, useRef, useEffect } from 'react';
import { Download, Filter, ShoppingCart, CheckCircle2, Clock, IndianRupee, Eye, ChevronDown } from 'lucide-react';
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
import { type Column } from './components/shared';
import { ROLE_SUPER_ADMIN } from '../../constants/roles';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface OrderItem {
  product: string;
  qty: number;
  ptr: number;
  amount: number;
}

interface OrderHistoryItem {
  id: string;
  orderNo: string;
  distributor: string;
  orderDate: string;
  orderValue: number;
  dispatchStatus: 'Pending' | 'Processing' | 'Packed' | 'Dispatched' | 'In Transit' | 'Delivered';
  paymentStatus: 'Unpaid' | 'Partially Paid' | 'Paid' | 'Overdue';
  deliveryDate: string;
  orderStatus: 'Draft' | 'Submitted' | 'Approved' | 'Rejected' | 'Fulfilled' | 'Cancelled';
  
  // Drawer extra fields
  deliveryAddress: string;
  grossAmount: number;
  schemeDiscount: number;
  taxAmount: number;
  netAmount: number;
  
  dispatchNo: string;
  lrNumber: string;
  vehicleDetails: string;
  expectedDeliveryDate: string;
  
  invoiceNo: string;
  outstandingAmount: number;
  
  items: OrderItem[];
}

const mockData: OrderHistoryItem[] = [
  { 
    id: '1', 
    orderNo: 'ORD-2026-001', 
    distributor: 'Metro Pharma Distributors',
    orderDate: '24-Oct-2026', 
    orderValue: 45000, 
    dispatchStatus: 'Delivered', 
    paymentStatus: 'Paid', 
    deliveryDate: '26-Oct-2026', 
    orderStatus: 'Fulfilled',
    deliveryAddress: '123 Health Avenue, Medical District, Mumbai',
    grossAmount: 46000,
    schemeDiscount: 6520,
    taxAmount: 5520,
    netAmount: 45000,
    dispatchNo: 'DSP-99881',
    lrNumber: 'LR-MAH-00123',
    vehicleDetails: 'MH-01-AB-1234',
    expectedDeliveryDate: '26-Oct-2026',
    invoiceNo: 'INV-26-9912',
    outstandingAmount: 0,
    items: [
      { product: 'Paracetamol 500mg', qty: 1000, ptr: 15, amount: 15000 },
      { product: 'Amoxicillin 250mg', qty: 500, ptr: 30, amount: 15000 }
    ]
  },
  { 
    id: '2', 
    orderNo: 'ORD-2026-002', 
    distributor: 'Carewell Agencies',
    orderDate: '26-Oct-2026', 
    orderValue: 12500, 
    dispatchStatus: 'In Transit', 
    paymentStatus: 'Unpaid', 
    deliveryDate: 'TBD', 
    orderStatus: 'Approved',
    deliveryAddress: '45 Carewell Plaza, Pune',
    grossAmount: 11000,
    schemeDiscount: 0,
    taxAmount: 1500,
    netAmount: 12500,
    dispatchNo: 'DSP-99882',
    lrNumber: 'LR-PUN-00445',
    vehicleDetails: 'MH-12-CD-5678',
    expectedDeliveryDate: '28-Oct-2026',
    invoiceNo: 'INV-26-9913',
    outstandingAmount: 12500,
    items: [
      { product: 'Cetirizine 10mg', qty: 2000, ptr: 5.5, amount: 11000 }
    ]
  },
  { 
    id: '3', 
    orderNo: 'ORD-2026-003', 
    distributor: 'Metro Pharma Distributors',
    orderDate: '27-Oct-2026', 
    orderValue: 120000, 
    dispatchStatus: 'Packed', 
    paymentStatus: 'Partially Paid', 
    deliveryDate: 'TBD', 
    orderStatus: 'Approved',
    deliveryAddress: '123 Health Avenue, Medical District, Mumbai',
    grossAmount: 110000,
    schemeDiscount: 5000,
    taxAmount: 15000,
    netAmount: 120000,
    dispatchNo: 'DSP-99883',
    lrNumber: 'Pending',
    vehicleDetails: 'Pending Assignment',
    expectedDeliveryDate: '30-Oct-2026',
    invoiceNo: 'INV-26-9914',
    outstandingAmount: 60000,
    items: [
      { product: 'Azithromycin 500mg', qty: 1000, ptr: 110, amount: 110000 }
    ]
  },
  { 
    id: '4', 
    orderNo: 'ORD-2026-004', 
    distributor: 'Global Health Supply',
    orderDate: '28-Oct-2026', 
    orderValue: 3400, 
    dispatchStatus: 'Pending', 
    paymentStatus: 'Unpaid', 
    deliveryDate: 'TBD', 
    orderStatus: 'Submitted',
    deliveryAddress: '88 Supply Chain Road, Delhi',
    grossAmount: 3000,
    schemeDiscount: 0,
    taxAmount: 400,
    netAmount: 3400,
    dispatchNo: 'Not Dispatched',
    lrNumber: 'N/A',
    vehicleDetails: 'N/A',
    expectedDeliveryDate: 'TBD',
    invoiceNo: 'Not Generated',
    outstandingAmount: 3400,
    items: [
      { product: 'Vitamin C 500mg', qty: 100, ptr: 30, amount: 3000 }
    ]
  },
];

export default function OrderHistory() {
  const activeRole = localStorage.getItem('activeRole') || ROLE_SUPER_ADMIN;
  const loggedInDistributorName = 'Metro Pharma Distributors'; // Mock logged in context

  const [search, setSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('');
  const [dispatchStatusFilter, setDispatchStatusFilter] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
  const [viewOrder, setViewOrder] = useState<OrderHistoryItem | null>(null);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowExportDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatCurrency = (amount: number) => `₹ ${amount.toLocaleString('en-IN')}`;

  const roleFilteredData = activeRole === ROLE_SUPER_ADMIN 
    ? mockData 
    : mockData.filter(item => item.distributor === loggedInDistributorName);

  const filteredData = roleFilteredData.filter((item) => {
    const searchLower = search.toLowerCase();
    const matchSearch = activeRole === ROLE_SUPER_ADMIN
      ? item.orderNo.toLowerCase().includes(searchLower) || item.distributor.toLowerCase().includes(searchLower)
      : item.orderNo.toLowerCase().includes(searchLower);

    const matchOrderStatus = orderStatusFilter ? item.orderStatus === orderStatusFilter : true;
    const matchDispatchStatus = dispatchStatusFilter ? item.dispatchStatus === dispatchStatusFilter : true;
    const matchPaymentStatus = paymentStatusFilter ? item.paymentStatus === paymentStatusFilter : true;
    
    return matchSearch && matchOrderStatus && matchDispatchStatus && matchPaymentStatus;
  });

  // Calculate Metrics based on visible data
  const totalOrders = filteredData.length;
  const deliveredOrders = filteredData.filter(o => o.dispatchStatus === 'Delivered').length;
  const pendingOrders = filteredData.filter(o => ['Pending', 'Processing'].includes(o.dispatchStatus)).length;
  const totalValue = filteredData.reduce((sum, order) => sum + order.orderValue, 0);

  const getOrderStatusVariant = (status: string) => {
    switch (status) {
      case 'Fulfilled': return 'success';
      case 'Approved': return 'info';
      case 'Submitted': return 'warning';
      case 'Draft': return 'secondary';
      case 'Cancelled': case 'Rejected': return 'danger';
      default: return 'neutral';
    }
  };

  const getDispatchStatusVariant = (status: string) => {
    switch (status) {
      case 'Delivered': return 'success';
      case 'In Transit': case 'Dispatched': return 'info';
      case 'Processing': case 'Packed': return 'warning';
      case 'Pending': return 'secondary';
      default: return 'neutral';
    }
  };

  const getPaymentStatusVariant = (status: string) => {
    switch (status) {
      case 'Paid': return 'success';
      case 'Partially Paid': return 'info';
      case 'Unpaid': return 'warning';
      case 'Overdue': return 'danger';
      default: return 'neutral';
    }
  };

  // ----- EXPORT LOGIC -----
  const getExportData = () => {
    if (activeRole === ROLE_SUPER_ADMIN) {
      return filteredData.map(item => ({
        'Order No': item.orderNo,
        'Distributor': item.distributor,
        'Order Date': item.orderDate,
        'Order Value': formatCurrency(item.orderValue),
        'Dispatch Status': item.dispatchStatus,
        'Payment Status': item.paymentStatus,
        'Delivery Date': item.deliveryDate,
        'Order Status': item.orderStatus
      }));
    } else {
      return filteredData.map(item => ({
        'Order No': item.orderNo,
        'Order Date': item.orderDate,
        'Order Value': formatCurrency(item.orderValue),
        'Dispatch Status': item.dispatchStatus,
        'Payment Status': item.paymentStatus,
        'Delivery Date': item.deliveryDate,
        'Order Status': item.orderStatus
      }));
    }
  };

  const handleExportExcel = () => {
    const data = getExportData();
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Order_History");
    XLSX.writeFile(wb, "Order_History_Export.xlsx");
    setShowExportDropdown(false);
  };

  const handleExportCSV = () => {
    const data = getExportData();
    const ws = XLSX.utils.json_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "Order_History_Export.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportDropdown(false);
  };

  const handleExportPDF = () => {
    const data = getExportData();
    const doc = new jsPDF('landscape');
    const headers = Object.keys(data[0] || {});
    const body = data.map(obj => headers.map(header => (obj as any)[header]));
    
    doc.text("Order History Export", 14, 15);
    autoTable(doc, {
      startY: 20,
      head: [headers],
      body: body,
      theme: 'striped',
      headStyles: { fillColor: [124, 58, 237] },
      styles: { fontSize: 8 }
    });
    doc.save("Order_History_Export.pdf");
    setShowExportDropdown(false);
  };

  // ----- COLUMNS -----
  const adminColumns: Column<OrderHistoryItem>[] = [
    { key: 'orderNo', label: 'Order No', render: (row) => <span className="font-semibold text-slate-900">{row.orderNo}</span> },
    { key: 'distributor', label: 'Distributor', render: (row) => <span className="text-slate-800">{row.distributor}</span> },
    { key: 'orderDate', label: 'Order Date', render: (row) => <span className="text-slate-600">{row.orderDate}</span> },
    { key: 'orderValue', label: 'Order Value', render: (row) => <span className="font-bold text-slate-800">{formatCurrency(row.orderValue)}</span> },
    { key: 'dispatchStatus', label: 'Dispatch Status', render: (row) => <Badge variant={getDispatchStatusVariant(row.dispatchStatus) as any}>{row.dispatchStatus}</Badge> },
    { key: 'paymentStatus', label: 'Payment Status', render: (row) => <Badge variant={getPaymentStatusVariant(row.paymentStatus) as any}>{row.paymentStatus}</Badge> },
    { key: 'deliveryDate', label: 'Delivery Date', render: (row) => <span className="text-slate-600">{row.deliveryDate}</span> },
    { key: 'orderStatus', label: 'Order Status', render: (row) => <Badge variant={getOrderStatusVariant(row.orderStatus) as any}>{row.orderStatus}</Badge> },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          <button onClick={() => setViewOrder(row)} className="text-slate-400 hover:text-violet-600 transition-colors p-1" title="View">
            <Eye className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  const distributorColumns: Column<OrderHistoryItem>[] = [
    { key: 'orderNo', label: 'Order No', render: (row) => <span className="font-semibold text-slate-900">{row.orderNo}</span> },
    { key: 'orderDate', label: 'Order Date', render: (row) => <span className="text-slate-600">{row.orderDate}</span> },
    { key: 'orderValue', label: 'Order Value', render: (row) => <span className="font-bold text-slate-800">{formatCurrency(row.orderValue)}</span> },
    { key: 'dispatchStatus', label: 'Dispatch Status', render: (row) => <Badge variant={getDispatchStatusVariant(row.dispatchStatus) as any}>{row.dispatchStatus}</Badge> },
    { key: 'paymentStatus', label: 'Payment Status', render: (row) => <Badge variant={getPaymentStatusVariant(row.paymentStatus) as any}>{row.paymentStatus}</Badge> },
    { key: 'deliveryDate', label: 'Delivery Date', render: (row) => <span className="text-slate-600">{row.deliveryDate}</span> },
    { key: 'orderStatus', label: 'Order Status', render: (row) => <Badge variant={getOrderStatusVariant(row.orderStatus) as any}>{row.orderStatus}</Badge> },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          <button onClick={() => setViewOrder(row)} className="text-slate-400 hover:text-violet-600 transition-colors p-1" title="View">
            <Eye className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Order History"
        subtitle={activeRole === ROLE_SUPER_ADMIN ? "Track and review all previously placed distributor orders." : "Track and review your entire order history."}
        actions={
          <div className="relative" ref={dropdownRef}>
            <ActionButton 
              variant="secondary" 
              icon={<Download className="w-4 h-4" />} 
              onClick={() => setShowExportDropdown(!showExportDropdown)}
            >
              Export History <ChevronDown className="w-3 h-3 opacity-50 ml-1" />
            </ActionButton>
            
            {showExportDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 overflow-hidden z-10 animate-in slide-in-from-top-2">
                <div className="p-1">
                  <button onClick={handleExportExcel} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-violet-700 rounded transition-colors">
                    Export as Excel (.xlsx)
                  </button>
                  <button onClick={handleExportCSV} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-violet-700 rounded transition-colors">
                    Export as CSV (.csv)
                  </button>
                  <button onClick={handleExportPDF} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-violet-700 rounded transition-colors">
                    Export as PDF (.pdf)
                  </button>
                </div>
              </div>
            )}
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <SummaryCard
          title={activeRole === ROLE_SUPER_ADMIN ? "Total Orders" : "My Orders"}
          value={totalOrders.toString()}
          subtitle="Matching visible scope"
          icon={<ShoppingCart className="w-6 h-6" />}
          colorClass="text-violet-600"
          bgClass="bg-violet-50"
        />
        <SummaryCard
          title="Delivered Orders"
          value={deliveredOrders.toString()}
          subtitle="Successfully fulfilled"
          icon={<CheckCircle2 className="w-6 h-6" />}
          colorClass="text-emerald-600"
          bgClass="bg-emerald-50"
        />
        <SummaryCard
          title="Pending Orders"
          value={pendingOrders.toString()}
          subtitle="Awaiting processing"
          icon={<Clock className="w-6 h-6" />}
          colorClass="text-amber-600"
          bgClass="bg-amber-50"
        />
        <SummaryCard
          title={activeRole === ROLE_SUPER_ADMIN ? "Total Order Value" : "Total Purchase Value"}
          value={formatCurrency(totalValue)}
          subtitle="Visible data value"
          icon={<IndianRupee className="w-6 h-6" />}
          colorClass="text-blue-600"
          bgClass="bg-blue-50"
        />
      </div>

      <FilterBar>
        <SearchInput 
          value={search} 
          onChange={setSearch} 
          placeholder={activeRole === ROLE_SUPER_ADMIN ? "Search by order no or distributor..." : "Search by order no..."} 
        />
        <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-600">Filters:</span>
        </div>
        <SelectFilter
          value={orderStatusFilter}
          onChange={setOrderStatusFilter}
          options={[
            { label: 'Draft', value: 'Draft' },
            { label: 'Submitted', value: 'Submitted' },
            { label: 'Approved', value: 'Approved' },
            { label: 'Rejected', value: 'Rejected' },
            { label: 'Fulfilled', value: 'Fulfilled' },
            { label: 'Cancelled', value: 'Cancelled' },
          ]}
          placeholder="Order Status"
        />
        <SelectFilter
          value={dispatchStatusFilter}
          onChange={setDispatchStatusFilter}
          options={[
            { label: 'Pending', value: 'Pending' },
            { label: 'Processing', value: 'Processing' },
            { label: 'Packed', value: 'Packed' },
            { label: 'Dispatched', value: 'Dispatched' },
            { label: 'In Transit', value: 'In Transit' },
            { label: 'Delivered', value: 'Delivered' },
          ]}
          placeholder="Dispatch Status"
        />
        <SelectFilter
          value={paymentStatusFilter}
          onChange={setPaymentStatusFilter}
          options={[
            { label: 'Unpaid', value: 'Unpaid' },
            { label: 'Partially Paid', value: 'Partially Paid' },
            { label: 'Paid', value: 'Paid' },
            { label: 'Overdue', value: 'Overdue' },
          ]}
          placeholder="Payment Status"
        />
      </FilterBar>

      <TableCard>
        <div className="[&>div::-webkit-scrollbar]:hidden [&>div]:[-ms-overflow-style:none] [&>div]:[scrollbar-width:none]">
          {activeRole === ROLE_SUPER_ADMIN ? (
            <DataTable
              columns={adminColumns}
              data={filteredData}
              onRowClick={setViewOrder}
              emptyMessage="No order history found."
            />
          ) : (
            <DataTable
              columns={distributorColumns}
              data={filteredData}
              onRowClick={setViewOrder}
              emptyMessage="No order history found."
            />
          )}
        </div>
      </TableCard>

      {/* View Drawer */}
      <Drawer
        open={viewOrder !== null}
        onClose={() => setViewOrder(null)}
        title="Order Details"
      >
        {viewOrder && (
          <div className="space-y-6 pb-20">
            {/* 1. ORDER INFORMATION */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Order Information</h3>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <DrawerField label="Order No" value={<span className="font-semibold">{viewOrder.orderNo}</span>} />
                <DrawerField label="Order Date" value={viewOrder.orderDate} />
                {activeRole === ROLE_SUPER_ADMIN && (
                  <DrawerField label="Distributor" value={<span className="font-medium text-slate-800">{viewOrder.distributor}</span>} />
                )}
                <DrawerField label="Delivery Address" value={viewOrder.deliveryAddress} />
              </div>
            </div>

            {/* 2. ORDER ITEMS */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Order Items</h3>
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-2 font-medium text-slate-600">Product</th>
                      <th className="px-4 py-2 font-medium text-slate-600 text-right">Qty</th>
                      <th className="px-4 py-2 font-medium text-slate-600 text-right">PTR</th>
                      <th className="px-4 py-2 font-medium text-slate-600 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {viewOrder.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-3 text-slate-800">{item.product}</td>
                        <td className="px-4 py-3 text-slate-600 text-right">{item.qty}</td>
                        <td className="px-4 py-3 text-slate-600 text-right">{formatCurrency(item.ptr)}</td>
                        <td className="px-4 py-3 text-slate-800 text-right font-medium">{formatCurrency(item.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 3. FINANCIAL SUMMARY */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Financial Summary</h3>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <div className="flex justify-between py-2 text-sm text-slate-600">
                  <span>Gross Amount</span>
                  <span>{formatCurrency(viewOrder.grossAmount)}</span>
                </div>
                <div className="flex justify-between py-2 text-sm text-slate-600">
                  <span>Scheme Discount</span>
                  <span className="text-emerald-600">- {formatCurrency(viewOrder.schemeDiscount)}</span>
                </div>
                <div className="flex justify-between py-2 text-sm text-slate-600 border-b border-slate-200">
                  <span>Tax Amount</span>
                  <span>{formatCurrency(viewOrder.taxAmount)}</span>
                </div>
                <div className="flex justify-between py-3 text-sm font-bold text-slate-900">
                  <span>Net Amount</span>
                  <span>{formatCurrency(viewOrder.netAmount)}</span>
                </div>
              </div>
            </div>

            {/* 4. DISPATCH INFORMATION */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Dispatch Information</h3>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                {activeRole === ROLE_SUPER_ADMIN ? (
                  <>
                    <DrawerField label="Dispatch No" value={viewOrder.dispatchNo} />
                    <DrawerField label="LR Number" value={viewOrder.lrNumber} />
                    <DrawerField label="Vehicle Details" value={viewOrder.vehicleDetails} />
                    <DrawerField label="Dispatch Status" value={<Badge variant={getDispatchStatusVariant(viewOrder.dispatchStatus) as any}>{viewOrder.dispatchStatus}</Badge>} />
                  </>
                ) : (
                  <>
                    <DrawerField label="Dispatch Status" value={<Badge variant={getDispatchStatusVariant(viewOrder.dispatchStatus) as any}>{viewOrder.dispatchStatus}</Badge>} />
                    <DrawerField label="LR Number" value={viewOrder.lrNumber} />
                    <DrawerField label="Expected Delivery" value={viewOrder.expectedDeliveryDate} />
                  </>
                )}
              </div>
            </div>

            {/* 5. PAYMENT INFORMATION */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Payment Information</h3>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                {activeRole === ROLE_SUPER_ADMIN ? (
                  <>
                    <DrawerField label="Invoice No" value={viewOrder.invoiceNo} />
                    <DrawerField label="Outstanding" value={<span className={viewOrder.outstandingAmount > 0 ? "text-rose-600 font-semibold" : "text-emerald-600 font-semibold"}>{formatCurrency(viewOrder.outstandingAmount)}</span>} />
                    <DrawerField label="Payment Status" value={<Badge variant={getPaymentStatusVariant(viewOrder.paymentStatus) as any}>{viewOrder.paymentStatus}</Badge>} />
                  </>
                ) : (
                  <>
                    <DrawerField label="Invoice No" value={viewOrder.invoiceNo} />
                    <DrawerField label="Payment Status" value={<Badge variant={getPaymentStatusVariant(viewOrder.paymentStatus) as any}>{viewOrder.paymentStatus}</Badge>} />
                  </>
                )}
              </div>
            </div>
            
          </div>
        )}
      </Drawer>
    </div>
  );
}
