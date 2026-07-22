import { useState, useMemo, useRef, useEffect } from 'react';
import { Search, Plus, Trash2, Download, Eye, FileText, Filter, Edit, ChevronDown } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { generatePurchaseOrderPdf } from '../../documents/generators/pdfGenerator';
import { inventoryService } from '../../services/inventoryService';
import { orderService } from '../../services/orderService';

import {
  PageHeader, FilterBar, SearchInput, SelectFilter, ActionButton,
  TableCard, DataTable, Badge, Drawer, DrawerField
} from './components/shared';
import { type Column, type BadgeVariant } from './components/shared';

// --- Types ---
type OrderStatus = 'Draft' | 'Pending' | 'Approved' | 'Rejected' | 'Processing' | 'Partially Fulfilled' | 'Fulfilled' | 'Cancelled';

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
  manufacturer: string;
  composition: string;
  mrp: number;
  ptr: number;
  availableStock: number;
  schemeAvailable: string;
}

const initialOrders: Order[] = [
  {
    id: '1', orderNo: 'ORD-2026-1001', distributorName: 'Metro Pharma Distributors', distributorCode: 'DIST-001',
    date: '15-10-2026', expectedDeliveryDate: '18-10-2026', status: 'Pending',
    deliveryLocation: 'Mumbai Central', warehouse: 'West Zone Hub', remarks: 'Urgent delivery required',
    items: [
      { productCode: 'PRD-001', productName: 'Amoxicillin 500mg', packType: '10x10 Tablets', ptr: 110, quantity: 50, scheme: '10+1 Free', amount: 5500 },
      { productCode: 'PRD-003', productName: 'Vitamin C 1000mg', packType: '20 Tablets Tube', ptr: 180, quantity: 20, scheme: '5% Off', amount: 3600 }
    ]
  },
  {
    id: '2', orderNo: 'ORD-2026-1002', distributorName: 'Metro Pharma Distributors', distributorCode: 'DIST-001',
    date: '16-10-2026', expectedDeliveryDate: '19-10-2026', status: 'Draft',
    deliveryLocation: 'Mumbai Central', warehouse: 'West Zone Hub', remarks: '',
    items: [
      { productCode: 'PRD-002', productName: 'Paracetamol 650mg', packType: '15x10 Tablets', ptr: 45, quantity: 100, scheme: 'No Scheme', amount: 4500 }
    ]
  },
  {
    id: '3', orderNo: 'ORD-2026-1003', distributorName: 'Global Health Supply', distributorCode: 'DIST-002',
    date: '10-10-2026', expectedDeliveryDate: '14-10-2026', status: 'Approved',
    deliveryLocation: 'Delhi North', warehouse: 'North Zone Hub', remarks: '',
    items: [
      { productCode: 'PRD-005', productName: 'Ibuprofen 400mg', packType: '10x10 Tablets', ptr: 75, quantity: 200, scheme: 'No Scheme', amount: 15000 }
    ]
  },
  {
    id: '4', orderNo: 'ORD-2026-1004', distributorName: 'Carewell Agencies', distributorCode: 'DIST-003',
    date: '05-10-2026', expectedDeliveryDate: '08-10-2026', status: 'Fulfilled',
    deliveryLocation: 'Bangalore South', warehouse: 'South Zone Hub', remarks: '',
    items: [
      { productCode: 'PRD-001', productName: 'Amoxicillin 500mg', packType: '10x10 Tablets', ptr: 110, quantity: 100, scheme: '10+1 Free', amount: 11000 }
    ]
  }
];

const formatCurrency = (amount: number) => `₹ ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const getDDMMYYYY = (date: Date) => {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}-${m}-${y}`;
};

const formatDateForInput = (ddmmyyyy: string) => {
  if (!ddmmyyyy || ddmmyyyy === 'Pending') return '';
  const parts = ddmmyyyy.split('-');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return '';
};

const formatDateForDisplay = (yyyymmdd: string) => {
  if (!yyyymmdd) return 'Pending';
  const parts = yyyymmdd.split('-');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return 'Pending';
};

const isBeforeToday = (dateString: string) => {
  if (!dateString) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const selectedDate = new Date(dateString);
  return selectedDate < today;
};

export default function Orders() {
  const loggedInDistributor = { name: 'Metro Pharma Distributors', code: 'DIST-001' };

  const [orders, setOrders] = useState<Order[]>(() => {
    const savedOrders = localStorage.getItem("pharma_erp_orders");
    return savedOrders ? JSON.parse(savedOrders) : initialOrders;
  });

  useEffect(() => {
    orderService.loadOrders().then(allOrders => {
      if (allOrders && allOrders.length > 0) {
        setOrders(allOrders);
      }
    });
  }, []);
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const productSearchRef = useRef<HTMLInputElement>(null);

  const [viewOrder, setViewOrder] = useState<Order | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteOrder, setDeleteOrder] = useState<Order | null>(null);

  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [newOrderItems, setNewOrderItems] = useState<OrderItem[]>([]);
  const [deliveryLocation, setDeliveryLocation] = useState('');
  const [expectedDate, setExpectedDate] = useState(''); 
  const [remarks, setRemarks] = useState('');
  
  const [productSearch, setProductSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [orderQuantity, setOrderQuantity] = useState<number | string>(1);

  const [products, setProducts] = useState<Product[]>([]);

  // Validation States
  const [deliveryDateError, setDeliveryDateError] = useState('');
  const [addressError, setAddressError] = useState('');
  const [remarksError, setRemarksError] = useState('');
  const [productError, setProductError] = useState('');
  const [quantityError, setQuantityError] = useState('');

  const resetForm = () => {
    setIsCreateOpen(false);
    setEditingOrderId(null);
    setNewOrderItems([]);
    setDeliveryLocation('');
    setExpectedDate('');
    setRemarks('');
    setSelectedProduct(null);
    setProductSearch('');
    setDeliveryDateError('');
    setAddressError('');
    setRemarksError('');
    setProductError('');
    setQuantityError('');
  };

  // Close modal on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isCreateOpen) {
        resetForm();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCreateOpen]);

  useEffect(() => {
    const sharedData = localStorage.getItem("pharma_erp_products");
    if (sharedData) {
      try {
        const parsedProducts = JSON.parse(sharedData);
        const mappedProducts = parsedProducts.map((p: any) => {
          const productCode = p.code || p.productCode;
          const inventoryRecords = inventoryService.getByProduct(productCode);
          const actualStock = inventoryRecords.reduce((sum, record) => sum + (record.availableQty || 0), 0);

          return {
            productCode: productCode,
            productName: p.name || p.productName,
            manufacturer: p.manufacturer || p.company || 'Unknown',
            composition: p.composition || p.ingredients || '',
            packType: p.packingType || p.packType || "Standard Pack",
            mrp: Number(p.mrp) || 0,
            ptr: Number(p.ptr) || 0,
            availableStock: actualStock,
            schemeAvailable: p.scheme && p.scheme !== "No Scheme" ? p.scheme : "No Scheme"
          };
        });
        setProducts(mappedProducts);
      } catch (e) {
        console.error("Failed to sync shared product catalog master", e);
      }
    } else {
      const defaultProducts = [
        { productCode: 'PRD-001', productName: 'Amoxicillin 500mg', manufacturer: 'PharmaCorp', composition: 'Amoxicillin', packType: '10x10 Tablets', mrp: 150.00, ptr: 110.00, availableStock: 0, schemeAvailable: '10+1 Free' },
        { productCode: 'PRD-002', productName: 'Paracetamol 650mg', manufacturer: 'HealthPlus', composition: 'Paracetamol', packType: '15x10 Tablets', mrp: 60.00, ptr: 45.00, availableStock: 0, schemeAvailable: 'No Scheme' },
        { productCode: 'PRD-003', productName: 'Vitamin C 1000mg', manufacturer: 'VitaLife', composition: 'Ascorbic Acid', packType: '20 Tablets Tube', mrp: 250.00, ptr: 180.00, availableStock: 0, schemeAvailable: '5% Off' },
        { productCode: 'PRD-005', productName: 'Ibuprofen 400mg', manufacturer: 'MediCare', composition: 'Ibuprofen', packType: '10x10 Tablets', mrp: 95.00, ptr: 75.00, availableStock: 0, schemeAvailable: 'No Scheme' },
      ];
      
      setProducts(defaultProducts.map(p => {
        const inventoryRecords = inventoryService.getByProduct(p.productCode);
        const actualStock = inventoryRecords.reduce((sum, record) => sum + (record.availableQty || 0), 0);
        return { ...p, availableStock: actualStock };
      }));
    }
  }, [isCreateOpen]);

  // Helper function to calculate invoice aging
const calculateAgingDays = (invoiceDate: string) => {
  const [day, month, year] = invoiceDate.split("-").map(Number);
  const invoice = new Date(year, month - 1, day);
  const today = new Date();

  invoice.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  const diff = today.getTime() - invoice.getTime();

  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
};

  const syncWithOutstandingLedger = (allOrders: Order[]) => {
    const savedDistributorsRaw = localStorage.getItem('pharma_erp_distributors');
    if (!savedDistributorsRaw) return;

    try {
      const actualDistributors = JSON.parse(savedDistributorsRaw);
      
      const outstandingData = actualDistributors.map((dist: any) => {
        const dCode = dist.code || dist.distributorCode || dist.id;
        const dName = dist.name || dist.distributorName;

        const distributorOrders = allOrders.filter(o => o.distributorCode === dCode && o.status !== 'Draft');

        let totalTrackedBalance = 0;
        const associatedInvoices = distributorOrders.map((ord) => {
          const items = ord.items;
          const grossAmount = items.reduce((sum, i) => sum + i.amount, 0);
          const schemeDiscount = items.reduce((sum, i) => i.scheme === '5% Off' ? sum + (i.amount * 0.05) : sum, 0);
          const afterDiscount = grossAmount - schemeDiscount;
          const netTotal = Math.round(afterDiscount + (afterDiscount * 0.12));

          totalTrackedBalance += netTotal;

          return {
            invoiceNo: ord.orderNo.replace('ORD-', 'INV-'),
            date: ord.date,
            amount: netTotal,
            dueDate: ord.expectedDeliveryDate && ord.expectedDeliveryDate !== 'Pending' ? ord.expectedDeliveryDate : ord.date,
            agingDays: calculateAgingDays(ord.date),
            status: (ord.status === 'Fulfilled' ? 'Paid' : 'Unpaid') as 'Paid' | 'Unpaid'
          };
        });

        const activeUnpaids = associatedInvoices.filter(i => i.status === 'Unpaid');
        const activeOutstanding = activeUnpaids.reduce((sum, i) => sum + i.amount, 0);
        const creditLimit = Number(dist.creditLimit) || 500000;

        return {
          id: dist.id,
          distributorName: dName,
          distributorCode: dCode,
          contactPerson: dist.contactPerson || "-",
          mobile: dist.mobile || "-",
          gstin: dist.gstin || "-",
          creditLimit: creditLimit,
          usedCredit: activeOutstanding,
          availableCredit: Math.max(0, creditLimit - activeOutstanding),
          totalOutstanding: activeOutstanding,
          overdueAmount: Math.round(activeOutstanding * 0.10), 
          maxAging: activeUnpaids.length > 0 ? Math.max(...activeUnpaids.map(i => i.agingDays)) : 0,
          status: activeOutstanding > creditLimit ? 'Overdue' : 'Clear',
          lastPaymentDate: '-',
          invoices: associatedInvoices
        };
      });

      localStorage.setItem('pharma_erp_outstanding_records', JSON.stringify(outstandingData));
    } catch (err) {
      console.error("Error synchronizing tracking maps", err);
    }
  };

  const updateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    const updated = orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o);
    setOrders(updated);
    localStorage.setItem("pharma_erp_orders", JSON.stringify(updated));
    syncWithOutstandingLedger(updated);
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

  const activeRole = localStorage.getItem('activeRole') || 'SUPER_ADMIN';

  const visibleOrders = useMemo(() => {
    const isSuperAdminOrAdmin = ['SUPER_ADMIN', 'COMPANY_ADMIN', 'Super Admin', 'Company Admin', 'System Administrator'].includes(activeRole);
    
    const base = isSuperAdminOrAdmin
      ? orders
      : orders.filter(o => !o.distributorCode || o.distributorCode === loggedInDistributor.code || o.distributorName === loggedInDistributor.name);

    return base.filter(item => {
      const matchSearch = (item.orderNo || '').toLowerCase().includes(search.toLowerCase()) || (item.distributorName || '').toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter ? item.status === statusFilter : true;
      return matchSearch && matchStatus;
    });
  }, [orders, search, statusFilter, loggedInDistributor.code, loggedInDistributor.name, activeRole]);

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
    XLSX.writeFile(workbook, `orders_${getDDMMYYYY(new Date()).replace(/-/g, '')}.xlsx`);
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
    link.download = `orders_${getDDMMYYYY(new Date()).replace(/-/g, '')}.csv`;
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
    doc.text(`Generated on: ${getDDMMYYYY(new Date())}`, 14, 22);

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
    doc.save(`orders_${getDDMMYYYY(new Date()).replace(/-/g, '')}.pdf`);
    setShowExportMenu(false);
  };

  const handleEditOrder = (order: Order) => {
    setEditingOrderId(order.id);
    setNewOrderItems(order.items);
    setDeliveryLocation(order.deliveryLocation);
    setExpectedDate(formatDateForInput(order.expectedDeliveryDate));
    setRemarks(order.remarks);
    setIsCreateOpen(true);
  };

  const confirmDeleteOrder = () => {
    if (deleteOrder) {
      const updated = orders.filter(o => o.id !== deleteOrder.id && o.orderNo !== deleteOrder.orderNo);
      setOrders(updated);
      localStorage.setItem("pharma_erp_orders", JSON.stringify(updated));
      orderService.deleteOrder(deleteOrder.id);
      syncWithOutstandingLedger(updated);
      setDeleteOrder(null);
    }
  };

  const handleDownloadPO = (order: Order) => {
    generatePurchaseOrderPdf(order);
  };

  const handleRemoveProduct = (index: number) => {
    setNewOrderItems(newOrderItems.filter((_, i) => i !== index));
    if (newOrderItems.length === 1) {
      setProductError('');
    }
  };

  const handleAddProduct = () => {
    if (!selectedProduct) {
      if (productSearch) {
        setProductError('Please select a product from the search results.');
      }
      return;
    }
    
    const qtyNum = typeof orderQuantity === 'string' ? parseInt(orderQuantity, 10) : orderQuantity;
    
    if (!qtyNum || isNaN(qtyNum) || qtyNum <= 0) {
      setQuantityError('Quantity must be greater than zero.');
      return;
    }
    
    if (qtyNum > selectedProduct.availableStock) {
      setQuantityError(`Quantity cannot exceed available stock (${selectedProduct.availableStock}).`);
      return;
    }
    
    setQuantityError('');
    setProductError('');

    const amount = selectedProduct.ptr * qtyNum;
    const existingIndex = newOrderItems.findIndex(i => i.productCode === selectedProduct.productCode);

    if (existingIndex >= 0) {
      const updatedItems = [...newOrderItems];
      const newQty = updatedItems[existingIndex].quantity + qtyNum;
      updatedItems[existingIndex] = {
        ...updatedItems[existingIndex],
        quantity: newQty,
        amount: newQty * selectedProduct.ptr
      };
      setNewOrderItems(updatedItems);
    } else {
      setNewOrderItems([...newOrderItems, {
        productCode: selectedProduct.productCode,
        productName: selectedProduct.productName,
        packType: selectedProduct.packType,
        ptr: selectedProduct.ptr,
        scheme: selectedProduct.schemeAvailable,
        quantity: qtyNum,
        amount: amount
      }]);
    }
    
    setSelectedProduct(null);
    setProductSearch('');
    setOrderQuantity(1);
    
    setTimeout(() => {
      productSearchRef.current?.focus();
    }, 0);
  };

  const validateForm = () => {
    let isValid = true;
    
    if (!expectedDate) {
      setDeliveryDateError('Expected Delivery Date is required.');
      isValid = false;
    } else if (isBeforeToday(expectedDate)) {
      setDeliveryDateError('Expected Delivery Date cannot be in the past.');
      isValid = false;
    } else {
      setDeliveryDateError('');
    }

    const trimmedAddress = deliveryLocation.trim();
    if (!trimmedAddress) {
      setAddressError('Delivery Address is required.');
      isValid = false;
    } else if (trimmedAddress.length < 3) {
      setAddressError('Delivery Address must be at least 3 characters.');
      isValid = false;
    } else if (trimmedAddress.length > 200) {
      setAddressError('Delivery Address cannot exceed 200 characters.');
      isValid = false;
    } else {
      setAddressError('');
    }

    const trimmedRemarks = remarks.trim();
    if (trimmedRemarks.length > 250) {
      setRemarksError('Remarks cannot exceed 250 characters.');
      isValid = false;
    } else {
      setRemarksError('');
    }

    if (newOrderItems.length === 0) {
      setProductError('At least one product must be added to the order.');
      isValid = false;
    } else {
      setProductError('');
    }

    return isValid;
  };

  const handleSaveOrder = (status: OrderStatus) => {
    if (!validateForm()) return;
    
    let updatedOrders: Order[] = [];
    
    const savedDistributorsRaw = localStorage.getItem('pharma_erp_distributors');
    let dynamicDistName = loggedInDistributor.name;
    let dynamicDistCode = loggedInDistributor.code;

    if (savedDistributorsRaw) {
      try {
        const parsedDists = JSON.parse(savedDistributorsRaw);
        if (parsedDists.length > 0) {
          dynamicDistName = parsedDists[0].name || parsedDists[0].distributorName;
          dynamicDistCode = parsedDists[0].code || parsedDists[0].distributorCode || parsedDists[0].id;
        }
      } catch(e) {
        console.error("Master profile dynamic mapping failed", e);
      }
    }
    
    const finalAddress = deliveryLocation.trim();
    const finalRemarks = remarks.trim();

    if (editingOrderId) {
      updatedOrders = orders.map(o => o.id === editingOrderId ? {
        ...o,
        status,
        expectedDeliveryDate: formatDateForDisplay(expectedDate) || o.expectedDeliveryDate,
        deliveryLocation: finalAddress,
        warehouse: o.warehouse || '',
        remarks: finalRemarks,
        items: newOrderItems
      } : o);
    } else {
      const timestamp = Date.now().toString();
      const uniqueOrderNo = `ORD-${new Date().getFullYear()}-${timestamp.slice(-6)}`;
      
      const newOrder: Order = {
        id: timestamp,
        orderNo: uniqueOrderNo,
        distributorName: dynamicDistName,
        distributorCode: dynamicDistCode,
        date: getDDMMYYYY(new Date()),
        expectedDeliveryDate: formatDateForDisplay(expectedDate) || 'Pending',
        status: status,
        deliveryLocation: finalAddress,
        warehouse: '',
        remarks: finalRemarks,
        items: newOrderItems
      };
      updatedOrders = [newOrder, ...orders];
      orderService.createOrder(newOrder);
    }
    
    setOrders(updatedOrders);
    localStorage.setItem("pharma_erp_orders", JSON.stringify(updatedOrders));
    syncWithOutstandingLedger(updatedOrders);
    
    setStatusFilter('');
    setSearch('');
    resetForm();
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

  const filteredProducts = products.filter(p => 
    p.productName.toLowerCase().includes(productSearch.toLowerCase()) || 
    p.productCode.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.manufacturer.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.composition.toLowerCase().includes(productSearch.toLowerCase())
  ).sort((a, b) => a.productName.localeCompare(b.productName));

  const columns: Column<Order>[] = [
    { key: 'orderNo', label: 'Order No', render: (row) => <span className="font-semibold text-slate-900">{row.orderNo}</span> },
    { key: 'date', label: 'Order Date' },
    { key: 'expectedDeliveryDate', label: 'Expected Delivery', render: (row) => <span className="text-slate-600">{row.expectedDeliveryDate}</span> },
    { key: 'items', label: 'Total Items', render: (row) => <span className="text-slate-600">{row.items.length} Items</span> },
    { 
      key: 'amount', 
      label: 'Total Amount', 
      render: (row) => <span className="font-bold text-slate-800">{formatCurrency(row.items.reduce((sum, i) => sum + i.amount, 0))}</span> 
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        let variant: BadgeVariant = 'neutral';
        if (['Approved', 'Processing', 'Partially Fulfilled', 'Fulfilled'].includes(row.status)) variant = 'success';
        if (row.status === 'Pending') variant = 'info';
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
          <button onClick={() => setViewOrder(row)} className="text-slate-400 hover:text-[#163c78] transition-colors p-1" title="View">
            <Eye className="w-4 h-4" />
          </button>
          
          <button 
            onClick={() => handleEditOrder(row)}
            className="p-1 text-slate-400 hover:text-blue-600 transition-colors" 
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>

          <button 
            onClick={() => setDeleteOrder(row)} 
            className="p-1 text-slate-400 hover:text-red-600 transition-colors" 
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          {row.status === 'Fulfilled' && (
            <button onClick={() => handleDownloadPO(row)} className="text-slate-400 hover:text-slate-900 transition-colors p-1" title="Download PDF">
              <FileText className="w-4 h-4" />
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
        subtitle="Place, manage, and track your purchase orders."
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

            <ActionButton icon={<Plus className="w-4 h-4" />} onClick={() => setIsCreateOpen(true)}>
              Create Order
            </ActionButton>
          </div>
        }
      />

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search order no..." />
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
            { label: 'Pending', value: 'Pending' },
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
                <DrawerField label="Expected Delivery" value={viewOrder.expectedDeliveryDate} />
                <DrawerField label="Status" value={
                  <Badge variant={['Approved', 'Processing', 'Partially Fulfilled', 'Fulfilled'].includes(viewOrder.status) ? 'success' : viewOrder.status === 'Pending' ? 'info' : viewOrder.status === 'Draft' ? 'warning' : 'danger'}>
                    {viewOrder.status}
                  </Badge>
                } />
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
                      <th className="px-4 py-3 font-semibold">Qty</th>
                      <th className="px-4 py-3 font-semibold">PTR</th>
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
                        <td className="px-4 py-3 font-mono">{item.quantity}</td>
                        <td className="px-4 py-3">{formatCurrency(item.ptr)}</td>
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
                  <span>Grand Total</span>
                  <span>{formatCurrency(viewSummary?.netAmount || 0)}</span>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
              {viewOrder.status === 'Draft' ? (
                <>
                  <ActionButton variant="secondary" onClick={() => {
                    setViewOrder(null);
                    handleEditOrder(viewOrder);
                  }}>Edit Order</ActionButton>
                  <ActionButton onClick={() => updateOrderStatus(viewOrder.id, 'Pending')}>Submit Order</ActionButton>
                </>
              ) : (
                <ActionButton variant="secondary" onClick={() => setViewOrder(null)}>Close</ActionButton>
              )}
            </div>
          </div>
        )}
      </Drawer>

      {/* --- Create Order Modal --- */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={resetForm}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]" onClick={e => e.stopPropagation()}>
            
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">
                {editingOrderId ? 'Edit Order' : 'Create Order'}
              </h2>
              <button
                onClick={resetForm}
                className="text-slate-500 hover:text-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2 mt-2 first:mt-0">
                <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">Order Information</h3>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Order No</label>
                <input type="text" value="Auto Generated" disabled className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 text-slate-500" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Order Date</label>
                <input type="text" value={getDDMMYYYY(new Date())} disabled className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 text-slate-500" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Expected Delivery Date *</label>
                <input 
                  type="date" 
                  value={expectedDate} 
                  onChange={e => {
                    setExpectedDate(e.target.value);
                    if (deliveryDateError) setDeliveryDateError('');
                  }} 
                  className={`w-full border ${deliveryDateError ? 'border-red-400 focus:border-red-500' : 'border-slate-200 focus:border-violet-400'} rounded-lg px-3 py-2 focus:outline-none`} 
                />
                {deliveryDateError && <p className="text-red-500 text-xs mt-1">{deliveryDateError}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Delivery Address *</label>
                <input 
                  type="text" 
                  value={deliveryLocation} 
                  onChange={e => {
                    setDeliveryLocation(e.target.value);
                    if (addressError) setAddressError('');
                  }} 
                  placeholder="Enter delivery address" 
                  className={`w-full border ${addressError ? 'border-red-400 focus:border-red-500' : 'border-slate-200 focus:border-violet-400'} rounded-lg px-3 py-2 focus:outline-none`} 
                />
                {addressError && <p className="text-red-500 text-xs mt-1">{addressError}</p>}
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Remarks</label>
                <input 
                  type="text" 
                  value={remarks} 
                  onChange={e => {
                    setRemarks(e.target.value);
                    if (remarksError) setRemarksError('');
                  }} 
                  placeholder="Optional delivery instructions" 
                  className={`w-full border ${remarksError ? 'border-red-400 focus:border-red-500' : 'border-slate-200 focus:border-violet-400'} rounded-lg px-3 py-2 focus:outline-none`} 
                />
                {remarksError && <p className="text-red-500 text-xs mt-1">{remarksError}</p>}
              </div>

              <div className="md:col-span-2 mt-4 relative">
                <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">Product Selection</h3>
                
                <div className="relative mb-4">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    ref={productSearchRef}
                    type="text"
                    value={productSearch}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (!selectedProduct && productSearch) {
                          setProductError('Please select a product from the search results.');
                        } else if (selectedProduct) {
                          handleAddProduct();
                        }
                      }
                    }}
                    onChange={(e) => { 
                      setProductSearch(e.target.value); 
                      setSelectedProduct(null); 
                      if (productError) setProductError('');
                    }}
                    placeholder="Search products by name, code, manufacturer, or composition..."
                    className="w-full border border-slate-200 rounded-lg pl-10 pr-3 py-2 focus:outline-none focus:border-violet-400"
                  />
                  {productSearch && !selectedProduct && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setProductSearch('')} />
                      <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-80 flex flex-col overflow-y-auto">
                        {filteredProducts.map(p => (
                          <div key={p.productCode} onClick={() => { setSelectedProduct(p); setProductSearch(''); setProductError(''); }} className="px-4 py-3 text-sm hover:bg-slate-50 cursor-pointer border-b last:border-0 flex flex-col gap-1">
                            <div className="flex justify-between font-bold text-slate-900">
                              <span>{p.productName} <span className="font-normal text-slate-500">({p.productCode})</span></span>
                              <span>PTR : {formatCurrency(p.ptr)}</span>
                            </div>
                            <div className="text-xs text-slate-500">
                              {p.manufacturer} • {p.packType}
                            </div>
                            <div className="text-xs text-slate-500">
                              MRP : {formatCurrency(p.mrp)}
                            </div>
                            <div className="text-xs text-slate-500">
                              Available Qty : {p.availableStock} Units
                            </div>
                            <div className="text-xs font-medium">
                              Status : <span className={p.availableStock === 0 ? 'text-red-500' : (p.availableStock <= 50 ? 'text-orange-500' : 'text-emerald-500')}>
                                {p.availableStock === 0 ? 'Out of Stock' : (p.availableStock <= 50 ? 'Low Stock' : 'Available')}
                              </span>
                            </div>
                            <div className="text-xs font-medium text-indigo-600">
                              Scheme : {p.schemeAvailable !== 'No Scheme' ? p.schemeAvailable : 'No Active Scheme'}
                            </div>
                          </div>
                        ))}
                        {filteredProducts.length === 0 && (
                          <div className="px-4 py-3 text-sm text-slate-500 text-center">
                            No products found matching your search.
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* --- Product Adder Sub-Form Layout --- */}
            {selectedProduct && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 grid grid-cols-1 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="md:col-span-4 font-semibold text-slate-900 border-b border-slate-200 pb-2 mb-2">
                  {selectedProduct.productName} ({selectedProduct.productCode})
                  <div className="text-xs font-normal text-slate-500 mt-1">{selectedProduct.manufacturer} | {selectedProduct.packType}</div>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">PTR Rate</label>
                  <div className="font-medium text-slate-900">{formatCurrency(selectedProduct.ptr)}</div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Available Stock</label>
                  <div className="font-medium text-slate-900">{selectedProduct.availableStock} Units</div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Active Scheme</label>
                  <div className="font-medium text-emerald-600">{selectedProduct.schemeAvailable}</div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Line Amount</label>
                  <div className="font-medium text-[#163c78]">
                    {formatCurrency(selectedProduct.ptr * (typeof orderQuantity === 'number' ? orderQuantity : 1))}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">Order Quantity *</label>
                  <input 
                    type="number" 
                    min="1" 
                    value={orderQuantity}
                    onKeyDown={(e) => {
                      if (['-', '+', '.', 'e', 'E'].includes(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    onChange={e => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setOrderQuantity(val ? parseInt(val, 10) : '');
                      if (quantityError) setQuantityError('');
                    }} 
                    className={`w-full border ${quantityError ? 'border-red-400 focus:border-red-500' : 'border-slate-300 focus:border-violet-500'} rounded-lg px-3 py-2 bg-white focus:outline-none`} 
                  />
                  {quantityError && <p className="text-red-500 text-xs mt-1">{quantityError}</p>}
                </div>
                <div className="md:col-span-2 flex items-end">
                  <ActionButton 
                    onClick={handleAddProduct}
                    className="w-full justify-center py-2"
                  >
                    Add Product to Order
                  </ActionButton>
                </div>
              </div>
            )}

            {/* --- Selected Items Review Table --- */}
            {newOrderItems.length > 0 && (
              <div className="mt-4 border border-slate-200 rounded-xl overflow-hidden mb-6">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 font-medium text-slate-500">
                    <tr>
                      <th className="px-4 py-2">Product</th>
                      <th className="px-4 py-2">Qty</th>
                      <th className="px-4 py-2 text-right">Amount</th>
                      <th className="px-4 py-2 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {newOrderItems.map((item, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2 font-medium">{item.productName}</td>
                        <td className="px-4 py-2 font-mono">{item.quantity}</td>
                        <td className="px-4 py-2 text-right font-medium">{formatCurrency(item.amount)}</td>
                        <td className="px-4 py-2 text-center">
                          <button onClick={() => handleRemoveProduct(index)} className="text-rose-500 hover:text-rose-700">
                            <Trash2 className="w-4 h-4 mx-auto" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {productError && <p className="text-red-500 text-sm font-medium mb-4 text-center">{productError}</p>}

            {/* Summary calculations footer section */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex flex-col gap-2 mb-6">
              <div className="flex justify-between text-sm text-slate-600">
                <span>Subtotal ({createSummary.totalItems} items)</span>
                <span>{formatCurrency(createSummary.grossAmount)}</span>
              </div>
              <div className="flex justify-between text-sm text-emerald-600">
                <span>Scheme Discount</span>
                <span>- {formatCurrency(createSummary.schemeDiscount)}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-600 pb-2 border-b">
                <span>GST (12%)</span>
                <span>+ {formatCurrency(createSummary.gst)}</span>
              </div>
              <div className="flex justify-between font-bold text-base text-slate-900">
                <span>Grand Total</span>
                <span>{formatCurrency(createSummary.netAmount)}</span>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <ActionButton variant="secondary" onClick={resetForm}>
                Cancel
              </ActionButton>
              <ActionButton variant="secondary" onClick={() => handleSaveOrder('Draft')} >
                Save Draft
              </ActionButton>
              <ActionButton onClick={() => handleSaveOrder('Pending')} >
                Submit Order
              </ActionButton>
            </div>

          </div>
        </div>
      )}

      {/* --- Delete Confirmation Popup --- */}
      {deleteOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl">
            <h4 className="text-lg font-bold text-slate-900 mb-2">Delete Order Confirmation</h4>
            <p className="text-sm text-slate-500 mb-6">Are you sure you want to permanently delete draft order {deleteOrder.orderNo}?</p>
            <div className="flex justify-end gap-3">
              <ActionButton variant="secondary" onClick={() => setDeleteOrder(null)}>Cancel</ActionButton>
              <button onClick={confirmDeleteOrder} className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-medium shadow-sm">
                Delete Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}