import { useState, useMemo, useRef, useEffect } from 'react';
import { Search, Plus, Trash2, Download, Eye, FileText, Filter, Edit, ChevronDown } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { generatePurchaseOrderPdf } from '../../documents/generators/pdfGenerator';

import {
  PageHeader, FilterBar, SearchInput, SelectFilter, ActionButton,
  TableCard, DataTable, Badge, Drawer, DrawerField
} from './components/shared';
import { type Column, type BadgeVariant } from './components/shared';

// -- Mock Roles & Auth --
import { 
  ROLE_SUPER_ADMIN, 
  ROLE_DISTRIBUTOR, 
  ROLE_WAREHOUSE_MANAGER 
} from '../../constants/roles';

// --- Types ---
type OrderStatus = 'Draft' | 'Submitted' | 'Approved' | 'Rejected' | 'Processing' | 'Partially Fulfilled' | 'Fulfilled' | 'Cancelled';

interface OrderItem {
  productCode: string;
  productName: string;
  packType: string;
  ptr: number;
  scheme: string;
  quantity: number;
  amount: number;
}

interface Order {
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

interface Product {
  productCode: string;
  productName: string;
  packType: string;
  mrp: number;
  ptr: number;
  availableStock: number;
  schemeAvailable: string;
}

const initialOrders: Order[] = [
  {
    id: '1', orderNo: 'ORD-2026-1001', distributorName: 'Metro Pharma Distributors', distributorCode: 'DIST-001',
    date: '15-Oct-2026', expectedDeliveryDate: '18-Oct-2026', status: 'Submitted',
    deliveryLocation: 'Mumbai Central', warehouse: 'West Zone Hub', remarks: 'Urgent delivery required',
    items: [
      { productCode: 'PRD-001', productName: 'Amoxicillin 500mg', packType: '10x10 Tablets', ptr: 110, quantity: 50, scheme: '10+1 Free', amount: 5500 },
      { productCode: 'PRD-003', productName: 'Vitamin C 1000mg', packType: '20 Tablets Tube', ptr: 180, quantity: 20, scheme: '5% Off', amount: 3600 }
    ]
  },
  {
    id: '2', orderNo: 'ORD-2026-1002', distributorName: 'Metro Pharma Distributors', distributorCode: 'DIST-001',
    date: '16-Oct-2026', expectedDeliveryDate: '19-Oct-2026', status: 'Draft',
    deliveryLocation: 'Mumbai Central', warehouse: 'West Zone Hub', remarks: '',
    items: [
      { productCode: 'PRD-002', productName: 'Paracetamol 650mg', packType: '15x10 Tablets', ptr: 45, quantity: 100, scheme: 'No Scheme', amount: 4500 }
    ]
  },
  {
    id: '3', orderNo: 'ORD-2026-1003', distributorName: 'Global Health Supply', distributorCode: 'DIST-002',
    date: '10-Oct-2026', expectedDeliveryDate: '14-Oct-2026', status: 'Approved',
    deliveryLocation: 'Delhi North', warehouse: 'North Zone Hub', remarks: '',
    items: [
      { productCode: 'PRD-005', productName: 'Ibuprofen 400mg', packType: '10x10 Tablets', ptr: 75, quantity: 200, scheme: 'No Scheme', amount: 15000 }
    ]
  },
  {
    id: '4', orderNo: 'ORD-2026-1004', distributorName: 'Carewell Agencies', distributorCode: 'DIST-003',
    date: '05-Oct-2026', expectedDeliveryDate: '08-Oct-2026', status: 'Fulfilled',
    deliveryLocation: 'Bangalore South', warehouse: 'South Zone Hub', remarks: '',
    items: [
      { productCode: 'PRD-001', productName: 'Amoxicillin 500mg', packType: '10x10 Tablets', ptr: 110, quantity: 100, scheme: '10+1 Free', amount: 11000 }
    ]
  }
];

const formatCurrency = (amount: number) => `₹ ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function Orders() {
  const activeRole = localStorage.getItem('activeRole') || ROLE_SUPER_ADMIN;
  const loggedInDistributor = { name: 'Metro Pharma Distributors', code: 'DIST-001' };

  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // Modals/Drawers
  const [viewOrder, setViewOrder] = useState<Order | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteOrder, setDeleteOrder] = useState<Order | null>(null);

  // Create/Edit Form State
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [newOrderItems, setNewOrderItems] = useState<OrderItem[]>([]);
  const [deliveryLocation, setDeliveryLocation] = useState('');
  const [warehouse, setWarehouse] = useState('West Zone Hub');
  const [expectedDate, setExpectedDate] = useState('');
  const [remarks, setRemarks] = useState('');
  
  const [productSearch, setProductSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [orderQuantity, setOrderQuantity] = useState(1);

  // --- Live Dynamic Products Loading ---
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const sharedData = localStorage.getItem("pharma_erp_products");
    if (sharedData) {
      try {
        const parsedProducts = JSON.parse(sharedData);
        const mappedProducts = parsedProducts.map((p: any) => ({
          productCode: p.code || p.productCode,
          productName: p.name || p.productName,
          packType: p.packingType || p.packType || "Standard Pack",
          mrp: Number(p.mrp) || 0,
          ptr: Number(p.ptr) || 0,
          availableStock: Number(p.totalUnits) || 1000, 
          schemeAvailable: p.scheme && p.scheme !== "No Scheme" ? p.scheme : "No Scheme"
        }));
        setProducts(mappedProducts);
      } catch (e) {
        console.error("Failed to sync shared product catalog master", e);
      }
    } else {
      setProducts([
        { productCode: 'PRD-001', productName: 'Amoxicillin 500mg', packType: '10x10 Tablets', mrp: 150.00, ptr: 110.00, availableStock: 5000, schemeAvailable: '10+1 Free' },
        { productCode: 'PRD-002', productName: 'Paracetamol 650mg', packType: '15x10 Tablets', mrp: 60.00, ptr: 45.00, availableStock: 250, schemeAvailable: 'No Scheme' },
        { productCode: 'PRD-003', productName: 'Vitamin C 1000mg', packType: '20 Tablets Tube', mrp: 250.00, ptr: 180.00, availableStock: 1200, schemeAvailable: '5% Off' },
        { productCode: 'PRD-005', productName: 'Ibuprofen 400mg', packType: '10x10 Tablets', mrp: 95.00, ptr: 75.00, availableStock: 800, schemeAvailable: 'No Scheme' },
      ]);
    }
  }, [isCreateOpen]);

  const updateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    setViewOrder(null);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // --- Visibility & Filtering ---
  const visibleOrders = useMemo(() => {
    let base = orders;
    if (activeRole === ROLE_DISTRIBUTOR) {
      base = orders.filter(o => o.distributorCode === loggedInDistributor.code);
    } else if (activeRole === ROLE_WAREHOUSE_MANAGER) {
      base = orders.filter(o => o.status === 'Approved');
    }
    return base.filter(item => {
      const matchSearch = item.orderNo.toLowerCase().includes(search.toLowerCase()) || 
                          item.distributorName.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter ? item.status === statusFilter : true;
      return matchSearch && matchStatus;
    });
  }, [orders, activeRole, search, statusFilter]);

  // --- Export Logic ---
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
      'Order Date': row.date,
      'Total Items': row.items.length,
      'Order Value': row.items.reduce((sum, i) => sum + i.amount, 0),
      'Expected Delivery': row.expectedDeliveryDate,
      'Status': row.status
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Orders');
    XLSX.writeFile(workbook, `orders_${getFormattedDate()}.xlsx`);
    setShowExportMenu(false);
  };

  const handleExportCSV = () => {
    const headers = ['Order No', 'Order Date', 'Total Items', 'Order Value', 'Expected Delivery', 'Status'];
    const csvContent = [
      headers.join(','),
      ...visibleOrders.map(row => 
        [
          `"${row.orderNo}"`, `"${row.date}"`, row.items.length, 
          row.items.reduce((sum, i) => sum + i.amount, 0),
          `"${row.expectedDeliveryDate}"`, `"${row.status}"`
        ].join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `orders_${getFormattedDate()}.csv`;
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportMenu(false);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Orders Export', 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 22);

    autoTable(doc, {
      startY: 30,
      head: [['Order No', 'Date', 'Total Items', 'Order Value', 'Expected Delivery', 'Status']],
      body: visibleOrders.map(row => [
        row.orderNo,
        row.date,
        row.items.length,
        formatCurrency(row.items.reduce((sum, i) => sum + i.amount, 0)),
        row.expectedDeliveryDate,
        row.status
      ]),
      theme: 'grid',
      headStyles: { fillColor: [139, 92, 246] }
    });
    doc.save(`orders_${getFormattedDate()}.pdf`);
    setShowExportMenu(false);
  };

  const handleEditOrder = (order: Order) => {
    setEditingOrderId(order.id);
    setNewOrderItems(order.items);
    setDeliveryLocation(order.deliveryLocation);
    setWarehouse(order.warehouse);
    setExpectedDate(order.expectedDeliveryDate);
    setRemarks(order.remarks);
    setIsCreateOpen(true);
  };

  const confirmDeleteOrder = () => {
    if (deleteOrder) {
      setOrders(orders.filter(o => o.id !== deleteOrder.id));
      setDeleteOrder(null);
    }
  };

  const handleDownloadPO = (order: Order) => {
    generatePurchaseOrderPdf(order);
  };

  const handleRemoveProduct = (index: number) => {
    setNewOrderItems(newOrderItems.filter((_, i) => i !== index));
  };

  const handleSaveOrder = (status: OrderStatus) => {
    if (editingOrderId) {
      setOrders(orders.map(o => o.id === editingOrderId ? {
        ...o,
        status,
        expectedDeliveryDate: expectedDate || o.expectedDeliveryDate,
        deliveryLocation,
        warehouse,
        remarks,
        items: newOrderItems
      } : o));
    } else {
      const newOrder: Order = {
        id: Math.random().toString(36).substring(7),
        orderNo: `ORD-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        distributorName: loggedInDistributor.name,
        distributorCode: loggedInDistributor.code,
        date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-'),
        expectedDeliveryDate: expectedDate || 'Pending',
        status: status,
        deliveryLocation,
        warehouse,
        remarks,
        items: newOrderItems
      };
      setOrders([newOrder, ...orders]);
    }
    
    setIsCreateOpen(false);
    setNewOrderItems([]);
    setDeliveryLocation('');
    setExpectedDate('');
    setRemarks('');
    setEditingOrderId(null);
  };

  const calcSummary = (items: OrderItem[]) => {
    const totalItems = items.length;
    const totalQuantity = items.reduce((sum, i) => sum + i.quantity, 0);
    const grossAmount = items.reduce((sum, i) => sum + i.amount, 0);
    const schemeDiscount = items.reduce((sum, i) => i.scheme === '5% Off' ? sum + (i.amount * 0.05) : sum, 0);
    const afterDiscount = grossAmount - schemeDiscount;
    const gst = afterDiscount * 0.12; 
    const netAmount = afterDiscount + gst;
    return { totalItems, totalQuantity, grossAmount, schemeDiscount, gst, netAmount };
  };

  const createSummary = calcSummary(newOrderItems);
  const viewSummary = viewOrder ? calcSummary(viewOrder.items) : null;

  // Search Products dynamically from the live database state array
  const filteredProducts = products.filter(p => 
    p.productName.toLowerCase().includes(productSearch.toLowerCase()) || 
    p.productCode.toLowerCase().includes(productSearch.toLowerCase())
  );

  const columns: Column<Order>[] = [
    { key: 'orderNo', label: 'Order No', render: (row) => <span className="font-semibold text-slate-900">{row.orderNo}</span> },
    { key: 'date', label: 'Order Date' },
    { key: 'items', label: 'Total Items', render: (row) => <span className="text-slate-600">{row.items.length} Items</span> },
    { 
      key: 'amount', 
      label: 'Order Value', 
      render: (row) => <span className="font-bold text-slate-800">{formatCurrency(row.items.reduce((sum, i) => sum + i.amount, 0))}</span> 
    },
    { key: 'expectedDeliveryDate', label: 'Expected Delivery Date', render: (row) => <span className="text-slate-600">{row.expectedDeliveryDate}</span> },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        let variant: BadgeVariant = 'neutral';
        if (['Approved', 'Processing', 'Partially Fulfilled', 'Fulfilled'].includes(row.status)) variant = 'success';
        if (row.status === 'Submitted') variant = 'info';
        if (row.status === 'Draft') variant = 'warning';
        if (['Rejected', 'Cancelled'].includes(row.status)) variant = 'danger';
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          <button onClick={() => setViewOrder(row)} className="text-slate-400 hover:text-violet-600 transition-colors p-1" title="View">
            <Eye className="w-4 h-4" />
          </button>
          
          {activeRole === ROLE_DISTRIBUTOR && (
            <button 
              onClick={() => row.status === 'Draft' ? handleEditOrder(row) : null}
              className={`p-1 transition-colors ${row.status === 'Draft' ? 'text-slate-400 hover:text-blue-600' : 'text-slate-200 cursor-not-allowed'}`} 
              title="Edit"
              disabled={row.status !== 'Draft'}
            >
              <Edit className="w-4 h-4" />
            </button>
          )}

          <button onClick={() => handleDownloadPO(row)} className="text-slate-400 hover:text-slate-900 transition-colors p-1" title="Download Purchase Order">
            <FileText className="w-4 h-4" />
          </button>

          {activeRole === ROLE_DISTRIBUTOR && (
            <button 
              onClick={() => row.status === 'Draft' ? setDeleteOrder(row) : null} 
              className={`p-1 transition-colors ${row.status === 'Draft' ? 'text-slate-400 hover:text-red-600' : 'text-slate-200 cursor-not-allowed'}`} 
              title="Delete"
              disabled={row.status !== 'Draft'}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Order Placement"
        subtitle={activeRole === ROLE_DISTRIBUTOR ? "Place, manage, and track your purchase orders." : "Manage and approve incoming purchase orders from distributors."}
        actions={
          <div className="flex items-center gap-3">
            <div className="relative inline-block text-left" ref={exportMenuRef}>
              <ActionButton 
                variant="secondary" 
                icon={<Download className="w-4 h-4" />}
                onClick={() => setShowExportMenu(!showExportMenu)}
              >
                Export Orders
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

            {activeRole === ROLE_DISTRIBUTOR && (
              <ActionButton icon={<Plus className="w-4 h-4" />} onClick={() => {
                setEditingOrderId(null);
                setNewOrderItems([]);
                setDeliveryLocation('');
                setExpectedDate('');
                setRemarks('');
                setIsCreateOpen(true);
              }}>
                Create Order manually
              </ActionButton>
            )}
          </div>
        }
      />

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search order no or distributor..." />
        <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-600">Filters:</span>
        </div>
        <SelectFilter
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { label: 'Draft', value: 'Draft' },
            { label: 'Submitted', value: 'Submitted' },
            { label: 'Approved', value: 'Approved' },
            { label: 'Processing', value: 'Processing' },
            { label: 'Partially Fulfilled', value: 'Partially Fulfilled' },
            { label: 'Fulfilled', value: 'Fulfilled' },
            { label: 'Cancelled', value: 'Cancelled' },
          ]}
          placeholder="All Status"
        />
      </FilterBar>

      <TableCard>
        <div className="[&>div::-webkit-scrollbar]:hidden [&>div]:[-ms-overflow-style:none] [&>div]:[scrollbar-width:none]">
          <DataTable
            columns={columns}
            data={visibleOrders}
            emptyMessage="No orders found."
          />
        </div>
      </TableCard>

      {/* --- View Drawer --- */}
      <Drawer open={!!viewOrder} onClose={() => setViewOrder(null)} title="Order Details">
        {viewOrder && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Order Information</h3>
              <div className="space-y-2">
                <DrawerField label="Order No" value={<span className="font-semibold text-slate-900">{viewOrder.orderNo}</span>} />
                <DrawerField label="Order Date" value={viewOrder.date} />
                <DrawerField label="Status" value={
                  <Badge variant={['Approved', 'Processing', 'Partially Fulfilled', 'Fulfilled'].includes(viewOrder.status) ? 'success' : viewOrder.status === 'Submitted' ? 'info' : viewOrder.status === 'Draft' ? 'warning' : 'danger'}>
                    {viewOrder.status}
                  </Badge>
                } />
              </div>
            </div>

            {activeRole !== ROLE_DISTRIBUTOR && (
              <div>
                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Distributor Information</h3>
                <div className="space-y-2">
                  <DrawerField label="Distributor Name" value={viewOrder.distributorName} />
                  <DrawerField label="Distributor Code" value={viewOrder.distributorCode} />
                </div>
              </div>
            )}

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Delivery Information</h3>
              <div className="space-y-2">
                <DrawerField label="Delivery Location" value={viewOrder.deliveryLocation} />
                <DrawerField label="Warehouse" value={viewOrder.warehouse} />
                <DrawerField label="Expected Delivery Date" value={viewOrder.expectedDeliveryDate} />
                {viewOrder.remarks && <DrawerField label="Remarks" value={viewOrder.remarks} />}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Ordered Products</h3>
              <div className="bg-slate-50 border border-slate-200 rounded-lg overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-100/50 border-b border-slate-200 text-slate-500 uppercase">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Product</th>
                      <th className="px-4 py-3 font-semibold">PTR</th>
                      <th className="px-4 py-3 font-semibold">Qty</th>
                      <th className="px-4 py-3 font-semibold">Scheme</th>
                      <th className="px-4 py-3 font-semibold text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {viewOrder.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {item.productCode}
                          <div className="text-xs text-slate-500 font-normal">{item.productName}</div>
                        </td>
                        <td className="px-4 py-3">{formatCurrency(item.ptr)}</td>
                        <td className="px-4 py-3 font-mono">{item.quantity}</td>
                        <td className="px-4 py-3 text-emerald-600 text-xs">{item.scheme}</td>
                        <td className="px-4 py-3 text-right font-medium text-slate-900">{formatCurrency(item.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Order Summary</h3>
              <div className="space-y-2 bg-slate-50 p-4 rounded-lg border border-slate-100">
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Gross Amount ({viewSummary?.totalItems} items)</span>
                  <span>{formatCurrency(viewSummary?.grossAmount || 0)}</span>
                </div>
                <div className="flex justify-between text-sm text-emerald-600">
                  <span>Scheme Discount</span>
                  <span>- {formatCurrency(viewSummary?.schemeDiscount || 0)}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-600 pb-2 border-b border-slate-200">
                  <span>GST (Estimated)</span>
                  <span>+ {formatCurrency(viewSummary?.gst || 0)}</span>
                </div>
                <div className="flex justify-between text-base font-bold text-slate-900 pt-1">
                  <span>Net Amount</span>
                  <span>{formatCurrency(viewSummary?.netAmount || 0)}</span>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
              {activeRole === ROLE_SUPER_ADMIN || activeRole === ROLE_WAREHOUSE_MANAGER ? (
                viewOrder.status === 'Submitted' ? (
                  <>
                    <ActionButton variant="secondary" onClick={() => updateOrderStatus(viewOrder.id, 'Rejected')}>Reject Order</ActionButton>
                    <ActionButton onClick={() => updateOrderStatus(viewOrder.id, 'Approved')}>Approve Order</ActionButton>
                  </>
                ) : (
                  <ActionButton variant="secondary" onClick={() => setViewOrder(null)}>View Information</ActionButton>
                )
              ) : activeRole === ROLE_DISTRIBUTOR ? (
                viewOrder.status === 'Draft' ? (
                  <>
                    <ActionButton variant="secondary" onClick={() => setViewOrder(null)}>Edit Order</ActionButton>
                    <ActionButton onClick={() => updateOrderStatus(viewOrder.id, 'Submitted')}>Submit Order</ActionButton>
                  </>
                ) : (
                  <ActionButton variant="secondary" onClick={() => setViewOrder(null)}>Close</ActionButton>
                )
              ) : (
                <ActionButton variant="secondary" onClick={() => setViewOrder(null)}>Close</ActionButton>
              )}
            </div>
          </div>
        )}
      </Drawer>

      {/* --- Create Order Modal --- */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">
                {editingOrderId ? 'Edit Order' : 'Create Order Manually'}
              </h2>
              <button
                onClick={() => { setIsCreateOpen(false); setEditingOrderId(null); }}
                className="text-slate-500 hover:text-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Section A: Order Info */}
              <div className="md:col-span-2 mt-2 first:mt-0">
                <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">Order Information</h3>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Order No</label>
                <input type="text" value="Auto Generated" disabled className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 text-slate-500" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Order Date</label>
                <input type="text" value={new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} disabled className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 text-slate-500" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Distributor</label>
                <input type="text" value={`${loggedInDistributor.name} (${loggedInDistributor.code})`} disabled className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 text-slate-500" />
              </div>

              {/* Section B: Delivery Info */}
              <div className="md:col-span-2 mt-4">
                <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">Delivery Information</h3>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Delivery Location *</label>
                <input type="text" value={deliveryLocation} onChange={e => setDeliveryLocation(e.target.value)} placeholder="Enter delivery address or branch" className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-violet-400" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Warehouse</label>
                <input type="text" value={warehouse} onChange={e => setWarehouse(e.target.value)} placeholder="Enter supplying warehouse" className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-violet-400" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Expected Delivery Date *</label>
                <input type="date" value={expectedDate} onChange={e => setExpectedDate(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-violet-400" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Remarks</label>
                <input type="text" value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Optional delivery instructions" className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-violet-400" />
              </div>

              {/* Section C: Product Selection */}
              <div className="md:col-span-2 mt-4 relative">
                <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">Product Selection</h3>
                
                <div className="relative mb-4">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => { setProductSearch(e.target.value); setSelectedProduct(null); }}
                    placeholder="Search products by name or code..."
                    className="w-full border border-slate-200 rounded-lg pl-10 pr-3 py-2 focus:outline-none focus:border-violet-400"
                  />
                  {productSearch && !selectedProduct && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setProductSearch('')} />
                      <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 flex flex-col overflow-y-auto p-1">
                        {filteredProducts.map(p => (
                          <div key={p.productCode} onClick={() => { setSelectedProduct(p); setProductSearch(''); }} className="px-3 py-2 text-sm hover:bg-slate-50 cursor-pointer rounded flex justify-between items-center">
                            <div>
                              <span className="font-semibold block text-slate-900">{p.productName} <span className="text-slate-500 font-normal">({p.productCode})</span></span>
                              <span className="text-xs text-slate-500">{p.packType} • Stock: {p.availableStock}</span>
                            </div>
                            <span className="text-emerald-600 font-medium text-xs">{p.schemeAvailable}</span>
                          </div>
                        ))}
                        {filteredProducts.length === 0 && (
                          <div className="py-2 px-3 text-slate-500 text-sm">No products found</div>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {selectedProduct && (
                  <div className="flex flex-wrap items-end gap-4 p-4 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="flex-1 min-w-[200px]">
                      <div className="text-sm font-bold text-slate-900">{selectedProduct.productName}</div>
                      <div className="text-xs text-slate-500">{selectedProduct.productCode} • {selectedProduct.packType}</div>
                      <div className="mt-2 text-sm">
                        <span className="text-slate-600 mr-4">PTR: <span className="font-semibold text-slate-900">{formatCurrency(selectedProduct.ptr)}</span></span>
                        <span className="text-emerald-600 text-xs font-semibold px-2 py-0.5 bg-emerald-100 rounded-full">{selectedProduct.schemeAvailable}</span>
                      </div>
                    </div>
                    <div className="w-32">
                      <label className="block text-xs font-medium text-slate-700 mb-1">Quantity</label>
                      <input type="number" min="1" max={selectedProduct.availableStock} value={orderQuantity} onChange={e => setOrderQuantity(parseInt(e.target.value) || 0)} className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-violet-400" />
                    </div>
                    <button 
                      type="button"
                      onClick={() => {
                        setNewOrderItems(prev => [
                          ...prev,
                          {
                            productCode: selectedProduct.productCode,
                            productName: selectedProduct.productName,
                            packType: selectedProduct.packType,
                            ptr: selectedProduct.ptr,
                            scheme: selectedProduct.schemeAvailable,
                            quantity: orderQuantity,
                            amount: selectedProduct.ptr * orderQuantity
                          }
                        ]);
                        setSelectedProduct(null);
                        setProductSearch('');
                        setOrderQuantity(1);
                      }} 
                      disabled={orderQuantity <= 0 || orderQuantity > selectedProduct.availableStock}
                      className="px-4 py-2 text-sm font-semibold text-white bg-violet-600 rounded-lg hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      Add Item
                    </button>
                  </div>
                )}
              </div>

              {/* Section D: Order Items Grid */}
              <div className="md:col-span-2 mt-4">
                <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">Order Items</h3>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-xs">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Product</th>
                        <th className="px-4 py-3 font-semibold">PTR</th>
                        <th className="px-4 py-3 font-semibold">Qty</th>
                        <th className="px-4 py-3 font-semibold">Scheme</th>
                        <th className="px-4 py-3 font-semibold text-right">Amount</th>
                        <th className="px-4 py-3 font-semibold text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {newOrderItems.length === 0 ? (
                        <tr><td colSpan={6} className="py-8 text-center text-slate-500">No items added to the order yet.</td></tr>
                      ) : newOrderItems.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="font-semibold text-slate-900">{item.productName}</div>
                            <div className="text-xs text-slate-500">{item.productCode} • {item.packType}</div>
                          </td>
                          <td className="px-4 py-3 text-slate-700">{formatCurrency(item.ptr)}</td>
                          <td className="px-4 py-3 font-mono font-medium text-slate-900">{item.quantity}</td>
                          <td className="px-4 py-3 text-emerald-600 text-xs font-medium">{item.scheme}</td>
                          <td className="px-4 py-3 text-right font-bold text-slate-900">{formatCurrency(item.amount)}</td>
                          <td className="px-4 py-3 text-center">
                            <button type="button" onClick={() => handleRemoveProduct(idx)} className="text-slate-400 hover:text-rose-500 p-1 transition-colors"><Trash2 className="w-4 h-4 mx-auto" /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Section E: Order Summary */}
              {newOrderItems.length > 0 && (
                <div className="md:col-span-2 mt-4 bg-slate-50 p-6 rounded-xl border border-slate-200">
                  <h3 className="text-sm font-semibold text-slate-700 border-b border-slate-200 pb-2 mb-4">Order Summary</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Total Items / Quantity</span>
                      <span className="font-medium text-slate-900">{createSummary.totalItems} Items / {createSummary.totalQuantity} Qty</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Gross Amount</span>
                      <span className="font-medium text-slate-900">{formatCurrency(createSummary.grossAmount)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-emerald-600">Scheme Discount</span>
                      <span className="font-medium text-emerald-600">- {formatCurrency(createSummary.schemeDiscount)}</span>
                    </div>
                    <div className="flex justify-between text-sm pb-3 border-b border-slate-200">
                      <span className="text-slate-500">Estimated GST (12%)</span>
                      <span className="font-medium text-slate-900">+ {formatCurrency(createSummary.gst)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-lg font-medium text-slate-900">Net Amount</span>
                      <span className="text-2xl font-bold text-violet-600">{formatCurrency(createSummary.netAmount)}</span>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-slate-200">
              <ActionButton variant="secondary" onClick={() => { setIsCreateOpen(false); setEditingOrderId(null); }}>Cancel</ActionButton>
              <button 
                type="button"
                onClick={() => handleSaveOrder('Draft')}
                disabled={newOrderItems.length === 0}
                className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 border border-slate-200 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Save Draft
              </button>
              <button 
                type="button"
                onClick={() => handleSaveOrder('Submitted')}
                disabled={newOrderItems.length === 0 || !deliveryLocation || !expectedDate}
                className="px-4 py-2 text-sm font-semibold text-white bg-violet-600 rounded-lg hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Submit Order
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteOrder && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Delete Order</h2>
            <p className="text-slate-600 mb-6">
              Are you sure you want to delete this order? <br/>
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <ActionButton variant="secondary" onClick={() => setDeleteOrder(null)}>Cancel</ActionButton>
              <button 
                onClick={confirmDeleteOrder} 
                className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 font-medium transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}