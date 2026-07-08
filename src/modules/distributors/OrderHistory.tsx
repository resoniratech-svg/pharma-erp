import { useState, useRef, useEffect, useMemo } from 'react';
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
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { orderService } from '../../services/orderService';

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

const getDDMMYYYY = (dateStr: string) => {
  if (!dateStr || dateStr === '-' || dateStr === 'TBD' || dateStr === 'N/A' || dateStr === 'Not Dispatched') return dateStr;
  if (dateStr.includes('-')) {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      if (parts[2].length === 4) return dateStr;
      if (parts[0].length === 4) {
        return `${parts[2].padStart(2, '0')}-${parts[1].padStart(2, '0')}-${parts[0]}`;
      }
    }
  }
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
};

export default function OrderHistory() {
  const [orders, setOrders] = useState<OrderHistoryItem[]>([]);
  const [search, setSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('');
  const [dispatchStatusFilter, setDispatchStatusFilter] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  
  const [viewOrder, setViewOrder] = useState<OrderHistoryItem | null>(null);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loggedInDistributor = useMemo(() => {
    const raw = localStorage.getItem('pharma_erp_distributors');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed.length > 0) {
          return {
            name: parsed[0].name || parsed[0].distributorName || 'Unknown',
            code: parsed[0].code || parsed[0].distributorCode || parsed[0].id || 'DIST-001'
          };
        }
      } catch (e) {}
    }
    return { name: 'Metro Pharma Distributors', code: 'DIST-001' };
  }, []);

  useEffect(() => {
    try {
      const allOrders = orderService.getAll();
      const mappedOrders: OrderHistoryItem[] = allOrders.map((o: any) => {
        let derivedDispatch: any = o.dispatchStatus || 'Pending';
        if (!o.dispatchStatus) {
          if (o.status === 'Fulfilled') derivedDispatch = 'Delivered';
          else if (o.status === 'Approved') derivedDispatch = 'Processing';
          else if (o.status === 'Rejected' || o.status === 'Cancelled') derivedDispatch = 'Pending';
        }
        
        return {
          id: o.id || o.orderNo,
          orderNo: o.orderNo || 'N/A',
          distributor: o.distributorName || o.distributor || 'General Distributor',
          orderDate: getDDMMYYYY(o.date || o.orderDate || new Date().toISOString().split('T')[0]),
          orderValue: Number(o.netAmount || o.totalAmount || o.orderValue || 0),
          dispatchStatus: derivedDispatch,
          paymentStatus: o.paymentStatus || 'Unpaid',
          deliveryDate: getDDMMYYYY(o.deliveryDate || 'TBD'),
          orderStatus: o.status || o.orderStatus || 'Submitted',
          deliveryAddress: o.deliveryLocation || o.deliveryAddress || 'Main Warehouse Depot',
          grossAmount: Number(o.grossAmount || o.totalAmount || 0),
          schemeDiscount: Number(o.schemeDiscount || 0),
          taxAmount: Number(o.taxAmount || 0),
          netAmount: Number(o.netAmount || o.totalAmount || 0),
          dispatchNo: o.dispatchNo || 'Not Dispatched',
          lrNumber: o.lrNumber || 'N/A',
          vehicleDetails: o.vehicleDetails || 'N/A',
          expectedDeliveryDate: getDDMMYYYY(o.expectedDeliveryDate || 'TBD'),
          invoiceNo: o.invoiceNo || 'Not Generated',
          outstandingAmount: Number(o.outstandingAmount !== undefined ? o.outstandingAmount : (o.paymentStatus === 'Paid' ? 0 : (o.netAmount || o.totalAmount || 0))),
          items: Array.isArray(o.items) ? o.items.map((i: any) => ({
            product: i.productName || i.product || 'Unknown Product',
            qty: Number(i.quantity || i.qty || 0),
            ptr: Number(i.ptr || i.unitPrice || i.price || 0),
            amount: Number(i.amount || i.lineAmount || i.total || 0)
          })) : []
        };
      });
      setOrders(mappedOrders);
    } catch (e) {
      console.error("Error formatting local storage history", e);
      setOrders([]);
    }
  }, []);

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

  const filteredData = useMemo(() => {
    const distributorOrders = orders.filter(item => 
      item.distributor === loggedInDistributor.name || 
      item.distributor === loggedInDistributor.code
    );
    
    return distributorOrders.filter((item) => {
      const searchLower = search.toLowerCase();
      const matchSearch = 
        item.orderNo.toLowerCase().includes(searchLower) ||
        item.invoiceNo.toLowerCase().includes(searchLower) ||
        item.items.some(i => i.product.toLowerCase().includes(searchLower));

      const matchOrderStatus = orderStatusFilter ? item.orderStatus === orderStatusFilter : true;
      const matchDispatchStatus = dispatchStatusFilter ? item.dispatchStatus === dispatchStatusFilter : true;
      const matchPaymentStatus = paymentStatusFilter ? item.paymentStatus === paymentStatusFilter : true;
      
      let matchDate = true;
      if (fromDate || toDate) {
        // Simple string comparison works for YYYY-MM-DD if we parse the DD-MM-YYYY
        const orderDateParts = item.orderDate.split('-');
        if (orderDateParts.length === 3) {
          const isoDate = `${orderDateParts[2]}-${orderDateParts[1]}-${orderDateParts[0]}`;
          if (fromDate && isoDate < fromDate) matchDate = false;
          if (toDate && isoDate > toDate) matchDate = false;
        }
      }
      
      return matchSearch && matchOrderStatus && matchDispatchStatus && matchPaymentStatus && matchDate;
    });
  }, [orders, search, orderStatusFilter, dispatchStatusFilter, paymentStatusFilter, fromDate, toDate, loggedInDistributor]);

  const metrics = useMemo(() => {
    return {
      totalOrders: filteredData.length,
      deliveredOrders: filteredData.filter(o => o.dispatchStatus === 'Delivered').length,
      pendingOrders: filteredData.filter(o => ['Pending', 'Processing'].includes(o.dispatchStatus)).length,
      totalValue: filteredData.reduce((sum, order) => sum + order.orderValue, 0)
    };
  }, [filteredData]);

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

  const getExportData = () => {
    return filteredData.map(item => ({
      'Order No': item.orderNo,
      'Order Date': item.orderDate,
      'Order Value': formatCurrency(item.orderValue),
      'Dispatch Status': item.dispatchStatus,
      'Payment Status': item.paymentStatus,
      'Delivery Date': item.deliveryDate,
      'Order Status': item.orderStatus
    }));
  };

  const handleExportExcel = () => {
    const data = getExportData();
    if (data.length === 0) {
      setShowExportDropdown(false);
      return;
    }
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Order_History");
    XLSX.writeFile(wb, "Order_History_Export.xlsx");
    setShowExportDropdown(false);
  };

  const handleExportCSV = () => {
    const data = getExportData();
    if (data.length === 0) {
      setShowExportDropdown(false);
      return;
    }
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
    if (data.length === 0) {
      setShowExportDropdown(false);
      return;
    }
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

  const columns: Column<OrderHistoryItem>[] = [
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
        subtitle="Track and review your entire order history."
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
          title="My Orders"
          value={metrics.totalOrders.toString()}
          subtitle="Matching visible scope"
          icon={<ShoppingCart className="w-6 h-6" />}
          colorClass="text-violet-600"
          bgClass="bg-violet-50"
        />
        <SummaryCard
          title="Delivered Orders"
          value={metrics.deliveredOrders.toString()}
          subtitle="Successfully fulfilled"
          icon={<CheckCircle2 className="w-6 h-6" />}
          colorClass="text-emerald-600"
          bgClass="bg-emerald-50"
        />
        <SummaryCard
          title="Pending Orders"
          value={metrics.pendingOrders.toString()}
          subtitle="Awaiting processing"
          icon={<Clock className="w-6 h-6" />}
          colorClass="text-amber-600"
          bgClass="bg-amber-50"
        />
        <SummaryCard
          title="Total Purchase Value"
          value={formatCurrency(metrics.totalValue)}
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
          placeholder="Search order, invoice or product..." 
        />
        <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-600">Filters:</span>
        </div>
        
        <input 
          type="date" 
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          className="text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:border-violet-400 bg-white"
          title="From Date"
        />
        <span className="text-slate-400">-</span>
        <input 
          type="date" 
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          className="text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:border-violet-400 bg-white"
          title="To Date"
        />

        <SelectFilter
          value={orderStatusFilter}
          onChange={setOrderStatusFilter}
          options={[
            { label: 'All Orders', value: '' },
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
            { label: 'All Dispatches', value: '' },
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
            { label: 'All Payments', value: '' },
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
          <DataTable
            columns={columns}
            data={filteredData}
            onRowClick={setViewOrder}
            emptyMessage="No order history found."
          />
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
                <DrawerField label="Dispatch Status" value={<Badge variant={getDispatchStatusVariant(viewOrder.dispatchStatus) as any}>{viewOrder.dispatchStatus}</Badge>} />
                <DrawerField label="Dispatch No" value={viewOrder.dispatchNo} />
                <DrawerField label="LR Number" value={viewOrder.lrNumber} />
                <DrawerField label="Expected Delivery" value={viewOrder.expectedDeliveryDate} />
              </div>
            </div>

            {/* 5. PAYMENT INFORMATION */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Payment Information</h3>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <DrawerField label="Invoice No" value={viewOrder.invoiceNo} />
                <DrawerField label="Payment Status" value={<Badge variant={getPaymentStatusVariant(viewOrder.paymentStatus) as any}>{viewOrder.paymentStatus}</Badge>} />
                <DrawerField label="Outstanding Amount" value={<span className="font-semibold text-rose-600">{formatCurrency(viewOrder.outstandingAmount)}</span>} />
              </div>
            </div>
            
          </div>
        )}
      </Drawer>
    </div>
  );
}