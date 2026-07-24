import { useState, useEffect, useMemo } from 'react';
import { Eye, CheckCircle, XCircle, PauseCircle, Clock, CheckCircle2, IndianRupee } from 'lucide-react';
import {
  PageHeader,
  FilterBar,
  SearchInput,
  SelectFilter,
  SummaryCard,
  TableCard,
  DataTable,
  Badge,
  ActionButton,
  Drawer,
  DrawerField,
  type Column
} from './components/shared';
import { inventoryService } from '../../services/inventoryService';
import { distributorOrderApprovalService } from '../../services/distributorOrderApprovalService';
import { orderService } from '../../services/orderService';
import { apiRequest } from '../../services/apiClient';

// --- Types ---
type OrderStatus = 'Draft' | 'Pending' | 'Approved' | 'Rejected' | 'Processing' | 'Partially Fulfilled' | 'Fulfilled' | 'Cancelled' | 'On Hold';

interface OrderItem {
  id?: string;
  productCode: string;
  productName: string;
  packType: string;
  ptr: number;
  scheme: string;
  quantity: number;
  amount: number;
}

interface OrderData {
  id: string;
  orderNo: string;
  distributorName: string;
  distributorCode: string;
  date: string;
  expectedDeliveryDate: string;
  status: OrderStatus;
  items: OrderItem[];
  deliveryLocation: string;
  warehouse: string;
  remarks: string;
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
  status: string;
}

const formatCurrency = (amount: number) => `₹ ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const getDDMMYYYY = (date: Date) => {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}-${m}-${y}`;
};

export default function DistributorOrders() {
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [outstandingRecords, setOutstandingRecords] = useState<OutstandingRecord[]>([]);

  useEffect(() => {
    orderService.loadOrders().then(allOrders => {
      setOrders(allOrders.filter((o: any) => o.status !== 'Draft'));
    });
    
    const savedOutstanding = localStorage.getItem("pharma_erp_outstanding_records");
    if (savedOutstanding) {
      setOutstandingRecords(JSON.parse(savedOutstanding));
    }
  }, []);

  const [search, setSearch] = useState('');
  const [distributorFilter, setDistributorFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [dateRange, setDateRange] = useState('');
  
  const [viewOrder, setViewOrder] = useState<OrderData | null>(null);
  const [approvalRemarks, setApprovalRemarks] = useState('');
  const [remarksError, setRemarksError] = useState('');

  const distributorOptions = useMemo(() => {
    const unique = Array.from(new Set(orders.map(o => o.distributorName)));
    return unique.map(name => ({ label: name, value: name }));
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const searchLower = search.toLowerCase();
      const matchSearch = order.orderNo.toLowerCase().includes(searchLower) || order.distributorName.toLowerCase().includes(searchLower);
      const matchDistributor = distributorFilter ? order.distributorName === distributorFilter : true;
      const matchStatus = statusFilter ? order.status === statusFilter : true;
      
      const distInfo = distributorOrderApprovalService.getDistributorInfo(order.distributorCode);
      const matchPayment = paymentFilter ? (distInfo?.paymentType === paymentFilter) : true;
      
      const matchDate = dateRange ? order.date === getDDMMYYYY(new Date(dateRange)) : true;
      
      return matchSearch && matchDistributor && matchStatus && matchPayment && matchDate;
    });
  }, [orders, search, distributorFilter, statusFilter, paymentFilter, dateRange]);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Approved':
      case 'Processing':
      case 'Partially Fulfilled':
      case 'Fulfilled':
        return 'success';
      case 'Pending': 
        return 'warning';
      case 'On Hold': 
        return 'info';
      case 'Rejected':
      case 'Cancelled':
        return 'danger';
      default: 
        return 'neutral';
    }
  };

  const columns: Column<OrderData>[] = [
    { key: 'orderNo', label: 'Order No', render: (row) => <span className="font-semibold text-slate-900">{row.orderNo}</span> },
    { key: 'date', label: 'Order Date' },
    { key: 'distributorName', label: 'Distributor Name', render: (row) => <span className="font-medium text-slate-800">{row.distributorName}</span> },
    { key: 'orderValue', label: 'Order Value', render: (row) => <span className="font-semibold text-emerald-600">{formatCurrency(row.items.reduce((s, i) => s + i.amount, 0))}</span> },
    { key: 'status', label: 'Order Status', render: (row) => <Badge variant={getStatusVariant(row.status) as any}>{row.status}</Badge> },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2">
          <button onClick={() => setViewOrder(row)} className="text-slate-400 hover:text-[#163c78] transition-colors p-1" title="View">
            <Eye className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  const productColumns: Column<OrderItem>[] = [
    { key: 'productName', label: 'Product' },
    { key: 'productCode', label: 'Code' },
    { key: 'quantity', label: 'Quantity' },
    { key: 'ptr', label: 'PTR', render: (row) => formatCurrency(row.ptr) },
    { key: 'scheme', label: 'Scheme' },
    { key: 'amount', label: 'Amount', render: (row) => formatCurrency(row.amount) },
  ];

  const summary = useMemo(() => {
    const today = getDDMMYYYY(new Date());
    const pendingOrders = orders.filter(o => o.status === 'Pending');
    
    return {
      pendingCount: pendingOrders.length,
      approvedToday: orders.filter(o => ['Approved', 'Processing', 'Partially Fulfilled', 'Fulfilled'].includes(o.status) && o.date === today).length,
      rejectedToday: orders.filter(o => ['Rejected', 'Cancelled'].includes(o.status) && o.date === today).length,
      pendingValue: pendingOrders.reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.amount, 0), 0)
    };
  }, [orders]);

  const currentDistributor = viewOrder ? distributorOrderApprovalService.getDistributorInfo(viewOrder.distributorCode) : null;
  const currentOutstandingAmount = viewOrder ? distributorOrderApprovalService.getDistributorOutstanding(viewOrder.distributorCode) : 0;
  const currentValidation = viewOrder ? distributorOrderApprovalService.validateOrderForApproval(viewOrder) : null;

  const getFinancialSummary = (items: OrderItem[]) => {
    const grossAmount = items.reduce((sum, i) => sum + i.amount, 0);
    const schemeDiscount = items.reduce((sum, i) => i.scheme === '5% Off' ? sum + (i.amount * 0.05) : sum, 0);
    const afterDiscount = grossAmount - schemeDiscount;
    const gstAmount = afterDiscount * 0.12; 
    const grandTotal = afterDiscount + gstAmount;
    return { subtotal: grossAmount, schemeDiscount, gstAmount, grandTotal };
  };

  const getInventoryStatus = (items: OrderItem[]) => {
    if (!items || items.length === 0) return { status: 'Out of Stock', available: 0, reserved: 0 };
    
    let allAvailable = true;
    let anyAvailable = false;
    let totalAvailable = 0;
    let totalRequested = 0;

    items.forEach(item => {
      const records = inventoryService.getByProduct(item.productCode);
      const stock = records.reduce((sum, r) => sum + (r.availableQty || 0), 0);
      
      totalAvailable += stock;
      totalRequested += item.quantity;
      
      if (stock >= item.quantity) {
        anyAvailable = true;
      } else if (stock > 0) {
        anyAvailable = true;
        allAvailable = false;
      } else {
        allAvailable = false;
      }
    });

    return {
      status: allAvailable ? 'Available' : anyAvailable ? 'Partial' : 'Out of Stock',
      available: totalAvailable,
      reserved: totalRequested
    };
  };

  const handleUpdateStatus = (newStatus: OrderStatus) => {
    if (!viewOrder) return;
    
    const numericId = String(viewOrder.id).replace(/\D/g, '');
    if (numericId) {
      let backendStatus = 'PENDING';
      if (newStatus === 'Approved') backendStatus = 'APPROVED';
      else if (newStatus === 'Rejected') backendStatus = 'REJECTED';
      else if (newStatus === 'On Hold') backendStatus = 'ON_HOLD';

      apiRequest(`/retailer-orders/${numericId}`, {
        method: 'PUT',
        bodyData: { status: backendStatus }
      }).catch(console.warn);
    }

    const savedOrders = localStorage.getItem("pharma_erp_orders");
    if (savedOrders) {
      let allOrders = JSON.parse(savedOrders) as OrderData[];
      allOrders = allOrders.map(o => o.id === viewOrder.id ? { ...o, status: newStatus, remarks: approvalRemarks } : o);
      
      localStorage.setItem("pharma_erp_orders", JSON.stringify(allOrders));
      setOrders(allOrders.filter(o => o.status !== 'Draft'));
      
      if (newStatus === 'Approved') {
        distributorOrderApprovalService.updateOutstanding(viewOrder);
        const updatedOut = localStorage.getItem("pharma_erp_outstanding_records");
        if (updatedOut) {
          setOutstandingRecords(JSON.parse(updatedOut));
        }
      }
    }
    
    setViewOrder(null);
    setApprovalRemarks('');
    setRemarksError('');
  };

  const currentFinancials = viewOrder ? getFinancialSummary(viewOrder.items) : null;
  const currentInventory = viewOrder ? getInventoryStatus(viewOrder.items) : null;

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Distributor Orders"
        subtitle="Review, validate and approve distributor purchase orders."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <SummaryCard title="Pending Orders" value={summary.pendingCount.toString()} icon={<Clock className="w-5 h-5 text-amber-600" />} colorClass="text-amber-600" bgClass="bg-amber-50" />
        <SummaryCard title="Approved Today" value={summary.approvedToday.toString()} icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />} colorClass="text-emerald-600" bgClass="bg-emerald-50" />
        <SummaryCard title="Rejected Today" value={summary.rejectedToday.toString()} icon={<XCircle className="w-5 h-5 text-rose-600" />} colorClass="text-rose-600" bgClass="bg-rose-50" />
        <SummaryCard title="Pending Order Value" value={formatCurrency(summary.pendingValue)} icon={<IndianRupee className="w-5 h-5 text-[#163c78]" />} colorClass="text-[#163c78]" bgClass="bg-[#163c78]/10" />
      </div>

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search Order No or Distributor..." />
        <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
        <SelectFilter
          value={distributorFilter}
          onChange={setDistributorFilter}
          options={distributorOptions}
          placeholder="Distributor"
        />
        <SelectFilter
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { label: 'Pending', value: 'Pending' },
            { label: 'Approved', value: 'Approved' },
            { label: 'Rejected', value: 'Rejected' },
            { label: 'On Hold', value: 'On Hold' }
          ]}
          placeholder="Order Status"
        />
        <SelectFilter
          value={paymentFilter}
          onChange={setPaymentFilter}
          options={[
            { label: 'Credit', value: 'Credit' },
            { label: 'Advance', value: 'Advance' }
          ]}
          placeholder="Payment Type"
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
            data={filteredOrders}
            emptyMessage="No distributor orders found."
          />
        </div>
      </TableCard>

      <Drawer
        open={viewOrder !== null}
        onClose={() => { setViewOrder(null); setApprovalRemarks(''); setRemarksError(''); }}
        title="Distributor Order Details"
      >
        {viewOrder && currentDistributor && currentFinancials && currentInventory && (
          <div className="space-y-6 pb-20">
            {/* Distributor Information */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Distributor Information</h3>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <DrawerField label="Distributor Name" value={currentDistributor.name} />
                <DrawerField label="Distributor Code" value={currentDistributor.code} />
                <DrawerField label="GST Number" value={currentDistributor.gstin} />
                <DrawerField label="Drug License Number" value={currentDistributor.drugLicense} />
                <DrawerField label="Payment Type" value={currentDistributor.paymentType || "Credit"} />
                <DrawerField label="Outstanding Amount" value={<span className="text-amber-600 font-medium">{formatCurrency(currentOutstandingAmount)}</span>} />
                <DrawerField label="Credit Limit" value={formatCurrency(currentDistributor.creditLimit)} />
                <DrawerField label="Used Credit" value={formatCurrency(currentOutstandingAmount)} />
                <DrawerField label="Available Credit" value={<span className="font-medium text-emerald-600">{formatCurrency(Math.max(0, currentDistributor.creditLimit - currentOutstandingAmount))}</span>} />
                <DrawerField label="Credit Status" value={<Badge variant={currentOutstandingAmount > currentDistributor.creditLimit ? 'danger' : 'success'}>{currentOutstandingAmount > currentDistributor.creditLimit ? 'Exceeded' : 'Within Limit'}</Badge>} />
                <DrawerField label="Distributor Status" value={<Badge variant={currentDistributor.status === 'Active' ? 'success' : 'danger'}>{currentDistributor.status}</Badge>} />
              </div>
            </div>

            {/* Order Information */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Order Information</h3>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <DrawerField label="Order Number" value={<span className="font-semibold">{viewOrder.orderNo}</span>} />
                <DrawerField label="Order Date" value={viewOrder.date} />
                <DrawerField label="Requested Delivery Date" value={viewOrder.expectedDeliveryDate || "Standard"} />
                <DrawerField label="Order Status" value={<Badge variant={getStatusVariant(viewOrder.status) as any}>{viewOrder.status}</Badge>} />
              </div>
            </div>

            {/* Ordered Products Table */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Ordered Products</h3>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <DataTable
                  columns={productColumns}
                  data={viewOrder.items}
                />
              </div>
            </div>

            {/* Financial Summary */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Financial Summary</h3>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Subtotal</span>
                    <span className="font-medium text-slate-900">{formatCurrency(currentFinancials.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Scheme Discount</span>
                    <span className="font-medium text-emerald-600">-{formatCurrency(currentFinancials.schemeDiscount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">GST (12%)</span>
                    <span className="font-medium text-slate-900">{formatCurrency(currentFinancials.gstAmount)}</span>
                  </div>
                  <div className="pt-2 mt-2 border-t border-slate-200 flex justify-between">
                    <span className="font-bold text-slate-900">Grand Total</span>
                    <span className="font-bold text-violet-700">{formatCurrency(currentFinancials.grandTotal)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Inventory Validation */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Inventory Validation</h3>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <DrawerField label="Stock Availability" value={<Badge variant={currentInventory.status === 'Available' ? 'success' : currentInventory.status === 'Partial' ? 'warning' : 'danger'}>{currentInventory.status}</Badge>} />
                <DrawerField label="Available Quantity" value={<span className="font-medium">{currentInventory.available}</span>} />
                <DrawerField label="Requested Quantity" value={<span className="font-medium text-amber-600">{currentInventory.reserved}</span>} />
              </div>
            </div>

            {/* Approval Section */}
            {['Pending', 'On Hold'].includes(viewOrder.status) && (
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Approval Section</h3>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">

                  <div className="flex flex-col sm:flex-row gap-3">
                    <ActionButton variant="primary" onClick={() => handleUpdateStatus('Approved')} icon={<CheckCircle className="w-4 h-4" />}>
                      Approve
                    </ActionButton>
                    <ActionButton variant="secondary" onClick={() => handleUpdateStatus('On Hold')} icon={<PauseCircle className="w-4 h-4" />}>
                      Hold
                    </ActionButton>
                    <ActionButton variant="secondary" className="text-rose-600 border-rose-200 hover:bg-rose-50" onClick={() => handleUpdateStatus('Rejected')} icon={<XCircle className="w-4 h-4" />}>
                      Reject
                    </ActionButton>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}