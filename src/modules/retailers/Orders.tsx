import { useState, useRef, useEffect } from 'react';
import { Plus, Download, Filter, Eye, X, ChevronDown } from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
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
import { AnimatePresence, motion } from 'framer-motion';

function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="fixed inset-0 bg-slate-900/30 backdrop-blur-[2px] z-50" onClick={onClose} />
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} className="fixed inset-0 m-auto z-50 w-full max-w-2xl max-h-[85vh] bg-white shadow-2xl rounded-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
              <h2 className="text-base font-bold text-slate-800">{title}</h2>
              <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

type OrderStatus = 'Pending' | 'Approved' | 'Rejected' | 'Processing' | 'Delivered';
type PaymentStatus = 'Paid' | 'Unpaid' | 'Partial';

interface OrderItem {
  id: string;
  productName: string;
  productCode: string;
  quantity: number;
  unitPrice: number;
  schemeBenefit?: string;
  lineTotal: number;
}

interface Order {
  id: string;
  orderNo: string;
  retailer: string;
  date: string;
  amount: number;
  schemeDiscount: number;
  netAmount: number;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  expectedDeliveryDate?: string;
  deliveryAddress: string;
  contactPerson: string;
  mobileNumber: string;
  remarks?: string;
  items: OrderItem[];
}

const initialMockData: Order[] = [
  { 
    id: '1', orderNo: 'RET-ORD-4412', retailer: 'Apollo Pharmacy', 
    date: '15-Oct-2026', amount: 48000, schemeDiscount: 3000, netAmount: 45000,
    paymentStatus: 'Unpaid', status: 'Pending', expectedDeliveryDate: '18-Oct-2026',
    deliveryAddress: '123 Apollo Street, HealthCity, HC 500001',
    contactPerson: 'Rahul Sharma', mobileNumber: '+91 9876543210',
    items: [
      { id: 'i1', productName: 'Paracetamol 650mg', productCode: 'PRC-650', quantity: 100, unitPrice: 48, lineTotal: 4800 },
      { id: 'i2', productName: 'Amoxicillin 500mg', productCode: 'AMX-500', quantity: 50, unitPrice: 120, lineTotal: 6000, schemeBenefit: '10+1 Free' }
    ]
  },
  { 
    id: '2', orderNo: 'RET-ORD-4411', retailer: 'MedPlus Store', 
    date: '14-Oct-2026', amount: 12000, schemeDiscount: 0, netAmount: 12000,
    paymentStatus: 'Paid', status: 'Processing', expectedDeliveryDate: '16-Oct-2026',
    deliveryAddress: '45 MedPlus Avenue, Wellness Park, WP 400012',
    contactPerson: 'Priya Patel', mobileNumber: '+91 8765432109',
    items: [
      { id: 'i3', productName: 'Vitamin C 1000mg', productCode: 'VIT-C', quantity: 200, unitPrice: 60, lineTotal: 12000 }
    ]
  },
  { 
    id: '3', orderNo: 'RET-ORD-4410', retailer: 'Apollo Pharmacy', 
    date: '12-Oct-2026', amount: 5500, schemeDiscount: 500, netAmount: 5000,
    paymentStatus: 'Paid', status: 'Delivered', expectedDeliveryDate: '14-Oct-2026',
    deliveryAddress: '123 Apollo Street, HealthCity, HC 500001',
    contactPerson: 'Rahul Sharma', mobileNumber: '+91 9876543210',
    items: [
      { id: 'i4', productName: 'Cough Syrup 100ml', productCode: 'CGH-100', quantity: 50, unitPrice: 110, lineTotal: 5500, schemeBenefit: '10% Off' }
    ]
  },
];

export default function Orders() {
  const activeRole = localStorage.getItem('activeRole') || ROLE_RETAILER;
  const isRetailer = activeRole === ROLE_RETAILER;
  
  const [data, setData] = useState<Order[]>(initialMockData);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  const [viewOrder, setViewOrder] = useState<Order | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // New Order Form State
  const [address, setAddress] = useState('123 Apollo Street, HealthCity, HC 500001'); 
  const [contact, setContact] = useState('Rahul Sharma');
  const [mobile, setMobile] = useState('+91 9876543210');
  const [remarks, setRemarks] = useState('');

  const [cartItems, setCartItems] = useState<OrderItem[]>([]);

  useEffect(() => {
    if (isCreateOpen) {
      const activeCart = localStorage.getItem('pharma_erp_retailer_cart');
      if (activeCart) {
        try {
          const parsed = JSON.parse(activeCart);
          // Standardize fields coming from the Product Catalog mapping ecosystem
          const formattedItems = parsed.map((item: any) => ({
            id: item.id || Math.random().toString(),
            productName: item.productName || 'N/A',
            productCode: item.productCode || 'N/A',
            quantity: Number(item.quantity || 0),
            unitPrice: Number(item.ptr || item.unitPrice || 0),
            schemeBenefit: item.scheme && item.scheme !== 'No Scheme' ? item.scheme : undefined,
            lineTotal: Number(item.lineTotal || 0)
          }));
          setCartItems(formattedItems);
        } catch (e) {
          console.error("Failed to parse cart information schema.", e);
          setCartItems([]);
        }
      } else {
        setCartItems([]);
      }
    }
  }, [isCreateOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const baseData = isRetailer ? data.filter(d => d.retailer === 'Apollo Pharmacy') : data;
  const filteredData = baseData.filter((item) => {
    const matchSearch = item.orderNo.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  const getStatusVariant = (status: OrderStatus): BadgeVariant => {
    if (status === 'Delivered' || status === 'Approved') return 'success';
    if (status === 'Pending' || status === 'Processing') return 'info';
    if (status === 'Rejected') return 'danger';
    return 'neutral';
  };

  // Safe currency converter containing error handling protections against rendering breaks
  const formatCurrency = (value: any) => {
    if (value === undefined || value === null || isNaN(Number(value))) {
      return '₹ 0';
    }
    const numericValue = typeof value === 'string' ? parseFloat(value) : value;
    return `₹ ${numericValue.toLocaleString('en-IN')}`;
  };

  const handleCancelOrder = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if(window.confirm("Are you sure you want to cancel this order?")) {
      setData(data.filter(d => d.id !== id));
    }
  };

  const handlePlaceOrder = () => {
    if (cartItems.length === 0) {
      alert("Your order sheet is completely empty. Please pull items from the catalog first.");
      return;
    }
    if (!address || !contact || !mobile) {
      alert("Please fill in all required delivery fields.");
      return;
    }

    const totalGross = cartItems.reduce((acc, item) => acc + item.lineTotal, 0);
    const schemeDiscount = totalGross > 2000 ? 50 : 0; 
    const newOrder: Order = {
      id: Math.random().toString(),
      orderNo: `RET-ORD-${Math.floor(4000 + Math.random() * 1000)}`,
      retailer: 'Apollo Pharmacy', 
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-'),
      amount: totalGross,
      schemeDiscount: schemeDiscount,
      netAmount: totalGross - schemeDiscount,
      paymentStatus: 'Unpaid',
      status: 'Pending',
      deliveryAddress: address,
      contactPerson: contact,
      mobileNumber: mobile,
      remarks: remarks,
      items: cartItems
    };

    setData([newOrder, ...data]);
    setIsCreateOpen(false);
    
    setCartItems([]);
    localStorage.removeItem('pharma_erp_retailer_cart');
    setRemarks('');
  };

  // FIXED: Changed property label to 'header' to properly match shared DataTable types configuration 
  const adminColumns: Column<Order>[] = [
    { key: 'orderNo', header: 'Order No', accessor: 'orderNo', render: (row) => <span className="font-semibold text-violet-700">{row.orderNo}</span> },
    { key: 'retailer', header: 'Retailer', accessor: 'retailer', render: (row) => <span className="text-slate-900">{row.retailer}</span> },
    { key: 'date', header: 'Order Date', accessor: 'date', render: (row) => <span className="text-slate-600">{row.date}</span> },
    { key: 'amount', header: 'Order Value', accessor: 'netAmount', render: (row) => <span className="font-medium text-slate-900">{formatCurrency(row.netAmount)}</span> },
    { key: 'paymentStatus', header: 'Payment Status', accessor: 'paymentStatus', render: (row) => <span className={`font-medium ${row.paymentStatus === 'Paid' ? 'text-emerald-600' : 'text-amber-600'}`}>{row.paymentStatus}</span> },
    { key: 'status', header: 'Order Status', accessor: 'status', render: (row) => <Badge variant={getStatusVariant(row.status)}>{row.status}</Badge> },
    {
      key: 'actions',
      header: 'Actions',
      accessor: 'id',
      render: (row) => (
        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          <button onClick={() => setViewOrder(row)} className="text-slate-400 hover:text-violet-600 transition-colors p-1" title="View Order">
            <Eye className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  // FIXED: Changed property label to 'header' to properly match shared DataTable types configuration 
  const retailerColumns: Column<Order>[] = [
    { key: 'orderNo', header: 'Order No', accessor: 'orderNo', render: (row) => <span className="font-semibold text-violet-700">{row.orderNo}</span> },
    { key: 'date', header: 'Order Date', accessor: 'date', render: (row) => <span className="text-slate-600">{row.date}</span> },
    { key: 'amount', header: 'Order Value', accessor: 'netAmount', render: (row) => <span className="font-medium text-slate-900">{formatCurrency(row.netAmount)}</span> },
    { key: 'paymentStatus', header: 'Payment Status', accessor: 'paymentStatus', render: (row) => <span className={`font-medium ${row.paymentStatus === 'Paid' ? 'text-emerald-600' : 'text-amber-600'}`}>{row.paymentStatus}</span> },
    { key: 'status', header: 'Order Status', accessor: 'status', render: (row) => <Badge variant={getStatusVariant(row.status)}>{row.status}</Badge> },
    { key: 'expectedDeliveryDate', header: 'Expected Delivery Date', accessor: 'expectedDeliveryDate', render: (row) => <span className="text-slate-600">{row.expectedDeliveryDate || 'TBD'}</span> },
    {
      key: 'actions',
      header: 'Actions',
      accessor: 'id',
      render: (row) => (
        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          <button onClick={() => setViewOrder(row)} className="text-slate-400 hover:text-violet-600 transition-colors p-1" title="View Order">
            <Eye className="w-4 h-4" />
          </button>
          {row.status === 'Pending' && (
            <button onClick={(e) => handleCancelOrder(row.id, e)} className="text-slate-400 hover:text-red-600 transition-colors p-1" title="Cancel Order">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )
    }
  ];

  const columns = isRetailer ? retailerColumns : adminColumns;

  const getExportData = () => {
    if (activeRole === ROLE_SUPER_ADMIN) {
      return filteredData.map(item => ({
        'Order Number': item.orderNo,
        'Retailer Name': item.retailer,
        'Order Date': item.date,
        'Order Value': formatCurrency(item.netAmount),
        'Payment Status': item.paymentStatus,
        'Order Status': item.status
      }));
    } else {
      return filteredData.map(item => ({
        'Order Number': item.orderNo,
        'Order Date': item.date,
        'Order Value': formatCurrency(item.netAmount),
        'Payment Status': item.paymentStatus,
        'Order Status': item.status
      }));
    }
  };

  const handleExportExcel = () => {
    const data = getExportData();
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Orders");
    XLSX.writeFile(wb, "Order_Placement.xlsx");
    setShowExportMenu(false);
  };

  const handleExportCSV = () => {
    const data = getExportData();
    const ws = XLSX.utils.json_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "Order_Placement.csv";
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportMenu(false);
  };

  const handleExportPDF = () => {
    const data = getExportData();
    const doc = new jsPDF('landscape');
    const headers = Object.keys(data[0] || {});
    const body = data.map(obj => headers.map(header => (obj as any)[header]));
    
    doc.text("Order Placement", 14, 15);
    autoTable(doc, {
      startY: 20,
      head: [headers],
      body: body,
      theme: 'striped',
      headStyles: { fillColor: [124, 58, 237] },
      styles: { fontSize: 9 }
    });
    doc.save("Order_Placement.pdf");
    setShowExportMenu(false);
  };

  // FIXED: Changed property label to 'header' to properly match shared DataTable types configuration 
  const viewOrderColumns: Column<OrderItem>[] = [
    { key: 'productName', header: 'Product Name', accessor: 'productName', render: (row) => <span className="font-medium text-slate-900">{row.productName}</span> },
    { key: 'productCode', header: 'Product Code', accessor: 'productCode', render: (row) => <span className="text-slate-600 text-xs">{row.productCode}</span> },
    { key: 'quantity', header: 'Quantity', accessor: 'quantity', render: (row) => <span className="text-slate-600">{row.quantity}</span> },
    { key: 'unitPrice', header: 'Unit Price', accessor: 'unitPrice', render: (row) => <span className="text-slate-600">{formatCurrency(row.unitPrice)}</span> },
    { key: 'schemeBenefit', header: 'Scheme Benefit', accessor: 'schemeBenefit', render: (row) => <span className="text-emerald-600 text-sm">{row.schemeBenefit || '-'}</span> },
    { key: 'amount', header: 'Line Total', accessor: 'lineTotal', render: (row) => <span className="font-medium text-slate-900">{formatCurrency(row.lineTotal)}</span> },
  ];

  // FIXED: Changed property label to 'header' to properly match shared DataTable types configuration 
  const cartColumns: Column<OrderItem>[] = [
    { key: 'productName', header: 'Product Name', accessor: 'productName', render: (row) => <span className="font-medium text-slate-900">{row.productName}</span> },
    { key: 'productCode', header: 'Product Code', accessor: 'productCode', render: (row) => <span className="text-slate-600 text-xs">{row.productCode}</span> },
    { key: 'quantity', header: 'Quantity', accessor: 'quantity', render: (row) => <span className="text-slate-600">{row.quantity}</span> },
    { key: 'unitPrice', header: 'Unit Price', accessor: 'unitPrice', render: (row) => <span className="text-slate-600">{formatCurrency(row.unitPrice)}</span> },
    { key: 'schemeBenefit', header: 'Scheme Benefit', accessor: 'schemeBenefit', render: (row) => <span className="text-emerald-600 text-sm">{row.schemeBenefit || '-'}</span> },
    { key: 'lineTotal', header: 'Line Total', accessor: 'lineTotal', render: (row) => <span className="font-medium text-slate-900">{formatCurrency(row.lineTotal)}</span> },
  ];

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Order Placement"
        subtitle={isRetailer ? "Create and manage your purchase orders." : "Manage and track incoming purchase orders from retailers."}
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
                  <div className="py-1" role="menu" aria-orientation="vertical">
                    <button onClick={handleExportCSV} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">Export CSV</button>
                    <button onClick={handleExportExcel} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">Export Excel</button>
                    <button onClick={handleExportPDF} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">Export PDF</button>
                  </div>
                </div>
              )}
            </div>
            {isRetailer && (
              <ActionButton icon={<Plus className="w-4 h-4" />} onClick={() => setIsCreateOpen(true)}>
                Create Order
              </ActionButton>
            )}
          </div>
        }
      />

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search order number..." />
        <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-600">Filters:</span>
        </div>
        <SelectFilter
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { label: 'All', value: '' },
            { label: 'Pending', value: 'Pending' },
            { label: 'Approved', value: 'Approved' },
            { label: 'Rejected', value: 'Rejected' },
            { label: 'Processing', value: 'Processing' },
            { label: 'Delivered', value: 'Delivered' },
          ]}
          placeholder="Status"
        />
      </FilterBar>

      <TableCard>
        <div className="[&>div::-webkit-scrollbar]:hidden [&>div]:[-ms-overflow-style:none] [&>div]:[scrollbar-width:none]">
          <DataTable
            columns={columns}
            data={filteredData}
            emptyMessage="No orders found."
          />
        </div>
      </TableCard>

      {/* View Order Drawer */}
      <Drawer
        open={!!viewOrder}
        onClose={() => setViewOrder(null)}
        title="Order Details"
      >
        {viewOrder && (
          <div className="space-y-6 pb-20">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Order Information</h3>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                <DrawerField label="Order Number" value={<span className="font-semibold text-violet-700">{viewOrder.orderNo}</span>} />
                <DrawerField label="Order Date" value={viewOrder.date} />
                <DrawerField label="Status" value={<Badge variant={getStatusVariant(viewOrder.status)}>{viewOrder.status}</Badge>} />
                <DrawerField label="Payment Status" value={<span className={`font-medium ${viewOrder.paymentStatus === 'Paid' ? 'text-emerald-600' : 'text-amber-600'}`}>{viewOrder.paymentStatus}</span>} />
                <DrawerField label="Expected Delivery Date" value={<span className="text-slate-600">{viewOrder.expectedDeliveryDate || 'TBD'}</span>} />
              </div>
            </div>

            {!isRetailer && (
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Retailer Information</h3>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <DrawerField label="Retailer Name" value={<span className="font-medium text-slate-900">{viewOrder.retailer}</span>} />
                </div>
              </div>
            )}

            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Delivery Information</h3>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-full">
                  <DrawerField label="Delivery Address" value={viewOrder.deliveryAddress} />
                </div>
                <DrawerField label="Contact Person" value={viewOrder.contactPerson} />
                <DrawerField label="Mobile Number" value={viewOrder.mobileNumber} />
                {viewOrder.remarks && (
                  <div className="col-span-full">
                    <DrawerField label="Remarks" value={<span className="italic text-slate-600">{viewOrder.remarks}</span>} />
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Order Items</h3>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <DataTable
                  columns={viewOrderColumns}
                  data={viewOrder.items}
                  emptyMessage="No items found."
                />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Order Summary</h3>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-600">Total Quantity</span>
                    <span className="font-medium text-slate-900">{viewOrder.items.reduce((acc, i) => acc + i.quantity, 0)} Units</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-600">Gross Amount</span>
                    <span className="font-medium text-slate-900">{formatCurrency(viewOrder.amount)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-600">Scheme Discount</span>
                    <span className="font-medium text-emerald-600">- {formatCurrency(viewOrder.schemeDiscount)}</span>
                  </div>
                  <div className="pt-3 mt-3 border-t border-slate-200 flex justify-between items-center">
                    <span className="font-semibold text-slate-900">Net Amount</span>
                    <span className="text-lg font-bold text-violet-700">{formatCurrency(viewOrder.netAmount)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* Create Order Modal */}
      <Modal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Order"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Order Number</label>
              <input type="text" value="Auto-generated" disabled className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Order Date</label>
              <input type="text" value={new Date().toLocaleDateString('en-GB')} disabled className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-500" />
            </div>
          </div>

          <div>
            <h4 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 mb-4">Delivery Information</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Delivery Address <span className="text-red-500">*</span></label>
                <textarea 
                  value={address} 
                  onChange={(e) => setAddress(e.target.value)} 
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                  placeholder="Enter complete delivery address"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Contact Person <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    value={contact} 
                    onChange={(e) => setContact(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                    placeholder="Person name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Mobile Number <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    value={mobile} 
                    onChange={(e) => setMobile(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                    placeholder="Mobile number"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Remarks (Optional)</label>
                <input 
                  type="text" 
                  value={remarks} 
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                  placeholder="Any specific instructions"
                />
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 mb-4">Cart Items</h4>
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <DataTable
                columns={cartColumns}
                data={cartItems}
                emptyMessage="Your cart is empty."
              />
            </div>
          </div>

          <div>
            <h4 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 mb-4">Order Summary</h4>
            <div className="bg-slate-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Total Quantity</span>
                <span className="font-medium text-slate-900">{cartItems.reduce((acc, i) => acc + i.quantity, 0)} Units</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Total Order Value</span>
                <span className="font-medium text-slate-900">{formatCurrency(cartItems.reduce((acc, i) => acc + i.lineTotal, 0))}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Scheme Discount</span>
                <span className="font-medium text-emerald-600">- {formatCurrency(cartItems.reduce((acc, i) => acc + i.lineTotal, 0) > 2000 ? 50 : 0)}</span>
              </div>
              <div className="pt-2 mt-2 border-t border-slate-200 flex justify-between">
                <span className="font-bold text-slate-900">Net Order Value</span>
                <span className="font-bold text-violet-700">{formatCurrency(cartItems.reduce((acc, i) => acc + i.lineTotal, 0) - (cartItems.reduce((acc, i) => acc + i.lineTotal, 0) > 2000 ? 50 : 0))}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <ActionButton variant="secondary" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </ActionButton>
            <ActionButton onClick={handlePlaceOrder}>
              Place Order
            </ActionButton>
          </div>
        </div>
      </Modal>
    </div>
  );
}