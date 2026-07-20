import { useState, useRef, useEffect, useMemo } from 'react';
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
import { AnimatePresence, motion } from 'framer-motion';

import authService from '../../services/authService';
import { retailerMasterService } from '../../services/retailerMasterService';
import { productService } from '../../services/productService';
import { inventoryService } from '../../services/inventoryService';
import { schemeService } from '../../services/schemeService';

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

type OrderStatus = 'Pending' | 'Approved' | 'Processing' | 'Packed' | 'Dispatched' | 'Delivered' | 'Completed' | 'Rejected' | 'Cancelled';
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
  retailerId: string;
  retailerCode: string;
  retailer: string;
  distributorId: string;
  distributorCode: string;
  distributorName: string;
  date: string;
  amount: number;
  schemeDiscount: number;
  netAmount: number;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  expectedDeliveryDate: string;
  deliveryAddress: string;
  contactPerson: string;
  mobileNumber: string;
  remarks?: string;
  items: OrderItem[];
  
  // Audit Fields
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  orderSource: string;
  statusTimestamp: string;
}

const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export default function Orders() {
  const [data, setData] = useState<Order[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  const [viewOrder, setViewOrder] = useState<Order | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // New Order Form State
  const [address, setAddress] = useState(''); 
  const [contact, setContact] = useState('');
  const [mobile, setMobile] = useState('');
  const [remarks, setRemarks] = useState('');

  const [cartItems, setCartItems] = useState<OrderItem[]>([]);
  const [userRetailerContext, setUserRetailerContext] = useState<any>(null);
  const [schemes, setSchemes] = useState<any[]>([]);

  useEffect(() => {
    const fetchSchemes = async () => {
      try {
        const data = await schemeService.getAll();
        setSchemes(data || []);
      } catch (e) {
        console.error("Failed to load schemes:", e);
      }
    };
    fetchSchemes();
  }, []);

  useEffect(() => {
    try {
      const allOrdersStr = localStorage.getItem('pharma_erp_retailer_orders');
      if (allOrdersStr) {
        setData(JSON.parse(allOrdersStr));
      }
    } catch (e) {
      console.error("Failed to parse orders", e);
    }
  }, []);

  useEffect(() => {
    try {
      const user = authService.getCurrentUser();
      if (!user) return;

      const retailers = retailerMasterService.getAll ? retailerMasterService.getAll() : [];
      
      const userId = String(user.id || '').trim().toLowerCase();
      const userCode = String(user.employeeCode || '').trim().toLowerCase();
      const userEmail = String(user.email || '').trim().toLowerCase();
      const username = String((user as any).username || '').trim().toLowerCase();
      const userName = String(user.fullName || (user as any).name || '').trim().toLowerCase();

      let matchedRetailer = null;

      // Strongest identifier priority: ID -> Code -> Email -> Username -> Name
      matchedRetailer = retailers.find((r: any) => String(r.id || '').trim().toLowerCase() === userId);
      if (!matchedRetailer && userCode) {
        matchedRetailer = retailers.find((r: any) => String(r.code || '').trim().toLowerCase() === userCode);
      }
      if (!matchedRetailer && userEmail) {
        matchedRetailer = retailers.find((r: any) => String(r.emailAddress || r.email || '').trim().toLowerCase() === userEmail);
      }
      if (!matchedRetailer && username) {
        matchedRetailer = retailers.find((r: any) => String(r.username || '').trim().toLowerCase() === username);
      }
      if (!matchedRetailer && userName) {
        matchedRetailer = retailers.find((r: any) => String(r.name || r.retailerName || '').trim().toLowerCase() === userName);
      }

      if (matchedRetailer) {
        setUserRetailerContext(matchedRetailer);
        setAddress((matchedRetailer as any).address || '');
        setContact(matchedRetailer.contactPerson || '');
        setMobile(matchedRetailer.mobileNumber || '');
      } else {
        setUserRetailerContext({
          id: user.id,
          code: user.employeeCode,
          name: user.fullName,
          emailAddress: user.email
        });
      }
    } catch (e) {
      console.error("Error resolving retailer context", e);
    }
  }, []);

  useEffect(() => {
    if (isCreateOpen) {
      const activeCart = localStorage.getItem('pharma_erp_retailer_cart');
      if (activeCart) {
        try {
          const parsed = JSON.parse(activeCart);
          const formattedItems = parsed.map((item: any) => ({
            id: item.id || generateUUID(),
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

  const baseData = useMemo(() => {
    if (!userRetailerContext) return [];
    const rId = String(userRetailerContext.id).toLowerCase();
    const rCode = String(userRetailerContext.code).toLowerCase();
    const rName = String(userRetailerContext.name).toLowerCase();
    
    return data.filter(d => {
      const dId = String(d.retailerId).toLowerCase();
      const dCode = String(d.retailerCode).toLowerCase();
      const dName = String(d.retailer).toLowerCase();
      return (dId && dId === rId) || (dCode && dCode === rCode) || (dName && dName === rName);
    });
  }, [data, userRetailerContext]);

  const filteredData = baseData.filter((item) => {
    const matchSearch = item.orderNo.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  const getStatusVariant = (status: OrderStatus): BadgeVariant => {
    if (status === 'Delivered' || status === 'Completed' || status === 'Approved') return 'success';
    if (status === 'Pending' || status === 'Processing' || status === 'Packed' || status === 'Dispatched') return 'info';
    if (status === 'Rejected' || status === 'Cancelled') return 'danger';
    return 'neutral';
  };

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
      const currentUser = authService.getCurrentUser();
      const updatedBy = currentUser ? currentUser.id : 'SYSTEM';
      const timestamp = new Date().toISOString();

      const updatedData = data.map(d => d.id === id ? { 
        ...d, 
        status: 'Cancelled' as OrderStatus,
        updatedAt: timestamp,
        updatedBy: updatedBy,
        statusTimestamp: timestamp
      } : d);
      setData(updatedData);
      localStorage.setItem('pharma_erp_retailer_orders', JSON.stringify(updatedData));
    }
  };

  const resolveAssignedDistributor = () => {
    if (!userRetailerContext) return null;
    let distId = '', distCode = '', distName = '';

    if (userRetailerContext.assignedDistributors && Array.isArray(userRetailerContext.assignedDistributors) && userRetailerContext.assignedDistributors.length > 0) {
      const dist = userRetailerContext.assignedDistributors[0];
      if (typeof dist === 'string') {
        distCode = dist;
        distName = dist;
        distId = dist;
      } else {
        distId = dist.id || dist.code || '';
        distCode = dist.code || distId;
        distName = dist.name || distCode;
      }
    } else if (userRetailerContext.assignedDistributor) {
        distId = userRetailerContext.assignedDistributor;
        distCode = userRetailerContext.assignedDistributor;
        distName = userRetailerContext.assignedDistributor;
    }

    if (!distCode) {
      // Fallback for administrators / users without a linked profile
      distId = '1';
      distCode = 'DIST-001';
      distName = 'Metro Pharma Distributors';
    }

    return { id: distId, code: distCode, name: distName };
  };

  const calculateAvailableInventory = (productCode: string) => {
    const inventory = inventoryService.getAll ? inventoryService.getAll() : [];
    return inventory
      .filter((inv: any) => inv.productCode === productCode)
      .reduce((acc: number, inv: any) => {
        const opening = Number(inv.openingStock || 0);
        const purchase = Number(inv.purchaseQty || 0);
        const transferIn = Number(inv.transferInQty || 0);
        const basicAvailable = Number(inv.availableQty || 0);
        
        let total = basicAvailable;
        if (!total && (opening || purchase)) {
           const reserved = Number(inv.reservedQty || 0);
           const dispatched = Number(inv.dispatchedQty || 0);
           const damaged = Number(inv.damagedQty || 0);
           const expired = Number(inv.expiredQty || 0);
           const blocked = Number(inv.blockedQty || 0);
           total = (opening + purchase + transferIn) - (reserved + dispatched + damaged + expired + blocked);
        }
        return acc + Math.max(0, total);
      }, 0);
  };

  const calculateSchemeDiscount = (items: OrderItem[]) => {
    try {
      let totalDiscount = 0;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const activeSchemes = schemes.filter((s: any) => {
        if (s.status !== 'Active') return false;
        if (s.validFrom) {
          const fromDate = new Date(s.validFrom);
          if (!isNaN(fromDate.getTime()) && today < fromDate) return false;
        }
        if (s.validTo) {
          const toDate = new Date(s.validTo);
          if (!isNaN(toDate.getTime())) {
            toDate.setHours(23, 59, 59, 999);
            if (today > toDate) return false;
          }
        }
        return true;
      });

      const products = productService.getProducts ? productService.getProducts() : [];
      
      const totalOrderQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
      const totalOrderValue = items.reduce((sum, item) => sum + item.lineTotal, 0);

      items.forEach(item => {
        const product = products.find((p: any) => p.code === item.productCode);
        
        const applicableSchemes = activeSchemes.filter((s: any) => {
          const minQty = Number(s.minQuantity || s.minOrderQty || 0);
          const minVal = Number(s.minOrderValue || 0);

          if (s.applicableTo === 'All Products') {
             if (minQty > 0 && totalOrderQuantity < minQty) return false;
             if (minVal > 0 && totalOrderValue < minVal) return false;
             return true;
          }

          let itemMatches = false;
          if (s.applicableTo === 'Product' && s.applicableSelection === item.productCode) itemMatches = true;
          if (s.applicableTo === 'Category' && product && product.category === s.applicableSelection) itemMatches = true;
          if (s.applicableTo === 'Brand' && product && (product.brandName || (product as any).brand) === s.applicableSelection) itemMatches = true;

          if (itemMatches) {
             if (minQty > 0 && item.quantity < minQty) return false;
             if (minVal > 0 && item.lineTotal < minVal) return false;
             return true;
          }
          return false;
        });

        applicableSchemes.forEach((s: any) => {
          const bType = String(s.benefitType || s.schemeType || '').toLowerCase();
          const bValue = parseFloat(s.benefitValue || s.discountPct || s.ptrDiscount || '0') || 0;

          if (bType.includes('percentage') || bType.includes('pct')) {
            totalDiscount += (item.lineTotal * bValue) / 100;
          } else if (bType.includes('flat') || bType.includes('cash')) {
            // Apply proportionate flat discount or full if item specific
            if (s.applicableTo === 'All Products') {
               // Approximate distribute flat discount based on line ratio to avoid over-discounting
               totalDiscount += bValue * (item.lineTotal / totalOrderValue);
            } else {
               totalDiscount += bValue;
            }
          } else if (bType.includes('ptr') || bType.includes('pts')) {
            totalDiscount += (item.unitPrice * bValue / 100) * item.quantity;
          }
        });
      });

      return totalDiscount;
    } catch (e) {
      console.error("Error calculating schemes", e);
      return 0;
    }
  };

  const getNextOrderSequence = () => {
    let maxSeq = 0;
    data.forEach(order => {
      const match = order.orderNo.match(/RET-ORD-(product.brandName || (product as any).brandd+)/);
      if (match && match[1]) {
        const seq = parseInt(match[1], 10);
        if (seq > maxSeq) maxSeq = seq;
      }
    });
    return maxSeq + 1;
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
    if (!userRetailerContext) {
      alert("Retailer context not established. Please login again.");
      return;
    }

    const distributor = resolveAssignedDistributor();
    if (!distributor) {
      alert("No distributor assigned. Please contact administration to assign a distributor to your profile before placing orders.");
      return;
    }

    try {
      const products = (productService as any).getProducts ? (productService as any).getProducts() : [];
      const inventory = inventoryService.getAll ? inventoryService.getAll() : [];
      const isInventoryModuleActive = inventory && inventory.length > 0;

      for (const item of cartItems) {
        if (item.quantity <= 0) {
          alert(`Quantity for ${item.productName} must be greater than zero.`);
          return;
        }

        const product = products.find((p: any) => p.code === item.productCode);
        if (!product) {
          alert(`Product ${item.productName} (${item.productCode}) no longer exists in Product Master.`);
          return;
        }
        if (product.status !== 'Active') {
          alert(`Product ${item.productName} is currently inactive and cannot be ordered.`);
          return;
        }
        if ((product as any).saleable === false || (product as any).blocked === true) {
           alert(`Product ${item.productName} is currently blocked from sales.`);
           return;
        }

        if (isInventoryModuleActive) {
          const availableStock = calculateAvailableInventory(item.productCode);
          if (availableStock < item.quantity) {
            alert(`Insufficient stock for ${item.productName}. Available: ${availableStock}`);
            return;
          }
        }
      }
    } catch (e) {
      console.warn("Pre-order validation encountered an error:", e);
    }

    const totalGross = cartItems.reduce((acc, item) => acc + item.lineTotal, 0);
    const schemeDiscount = calculateSchemeDiscount(cartItems);
    
    const nextSeq = getNextOrderSequence();
    const orderNumber = `RET-ORD-${String(nextSeq).padStart(6, '0')}`;

    const timestamp = new Date().toISOString();
    const currentUser = authService.getCurrentUser();
    const createdBy = currentUser ? currentUser.id : userRetailerContext.id;

    // Calculate Expected Delivery Date (Default 2 days lead time)
    const expectedDate = new Date();
    expectedDate.setDate(expectedDate.getDate() + 2);
    const expectedDeliveryDateStr = expectedDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-');

    const newOrder: Order = {
      id: generateUUID(),
      orderNo: orderNumber,
      retailerId: userRetailerContext.id || '',
      retailerCode: userRetailerContext.code || '',
      retailer: userRetailerContext.name || 'Unknown Retailer',
      distributorId: distributor.id,
      distributorCode: distributor.code,
      distributorName: distributor.name,
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-'),
      amount: totalGross,
      schemeDiscount: schemeDiscount,
      netAmount: Math.max(0, totalGross - schemeDiscount),
      paymentStatus: 'Unpaid',
      status: 'Pending',
      expectedDeliveryDate: expectedDeliveryDateStr,
      deliveryAddress: address,
      contactPerson: contact,
      mobileNumber: mobile,
      remarks: remarks,
      items: cartItems,
      
      createdAt: timestamp,
      createdBy: createdBy,
      updatedAt: timestamp,
      updatedBy: createdBy,
      orderSource: 'Retailer_Web_Portal',
      statusTimestamp: timestamp
    };

    const updatedData = [newOrder, ...data];
    setData(updatedData);
    localStorage.setItem('pharma_erp_retailer_orders', JSON.stringify(updatedData));
    
    setIsCreateOpen(false);
    setCartItems([]);
    localStorage.removeItem('pharma_erp_retailer_cart');
    setRemarks('');
  };

  const columns: Column<Order>[] = [
    { key: 'orderNo', label: 'Order No', render: (row) => <span className="font-semibold text-violet-700">{row.orderNo}</span> },
    { key: 'date', label: 'Order Date', render: (row) => <span className="text-slate-600">{row.date}</span> },
    { key: 'amount', label: 'Order Value', render: (row) => <span className="font-medium text-slate-900">{formatCurrency(row.netAmount)}</span> },
    { key: 'paymentStatus', label: 'Payment Status', render: (row) => <span className={`font-medium ${row.paymentStatus === 'Paid' ? 'text-emerald-600' : 'text-amber-600'}`}>{row.paymentStatus}</span> },
    { key: 'status', label: 'Order Status', render: (row) => <Badge variant={getStatusVariant(row.status)}>{row.status}</Badge> },
    { key: 'expectedDeliveryDate', label: 'Expected Delivery Date', render: (row) => <span className="text-slate-600">{row.expectedDeliveryDate || 'TBD'}</span> },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          <button onClick={() => setViewOrder(row)} className="text-slate-400 hover:text-[#163c78] transition-colors p-1" title="View Order">
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

  const getExportData = () => {
    return filteredData.map(item => ({
      'Order Number': item.orderNo,
      'Order Date': item.date,
      'Order Value': formatCurrency(item.netAmount),
      'Payment Status': item.paymentStatus,
      'Order Status': item.status
    }));
  };

  const handleExportExcel = () => {
    const dataToExport = getExportData();
    if (dataToExport.length === 0) {
        setShowExportMenu(false);
        return;
    }
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Orders");
    XLSX.writeFile(wb, "Order_Placement.xlsx");
    setShowExportMenu(false);
  };

  const handleExportCSV = () => {
    const dataToExport = getExportData();
    if (dataToExport.length === 0) {
        setShowExportMenu(false);
        return;
    }
    const ws = XLSX.utils.json_to_sheet(dataToExport);
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
    const dataToExport = getExportData();
    if (dataToExport.length === 0) {
        setShowExportMenu(false);
        return;
    }
    const doc = new jsPDF('landscape');
    const headers = Object.keys(dataToExport[0] || {});
    const body = dataToExport.map(obj => headers.map(header => (obj as any)[header]));
    
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

  const viewOrderColumns: Column<OrderItem>[] = [
    { key: 'productName', label: 'Product Name', render: (row) => <span className="font-medium text-slate-900">{row.productName}</span> },
    { key: 'productCode', label: 'Product Code', render: (row) => <span className="text-slate-600 text-xs">{row.productCode}</span> },
    { key: 'quantity', label: 'Quantity', render: (row) => <span className="text-slate-600">{row.quantity}</span> },
    { key: 'unitPrice', label: 'Unit Price', render: (row) => <span className="text-slate-600">{formatCurrency(row.unitPrice)}</span> },
    { key: 'schemeBenefit', label: 'Scheme Benefit', render: (row) => <span className="text-emerald-600 text-sm">{row.schemeBenefit || '-'}</span> },
    { key: 'amount', label: 'Line Total', render: (row) => <span className="font-medium text-slate-900">{formatCurrency(row.lineTotal)}</span> },
  ];

  const cartColumns: Column<OrderItem>[] = [
    { key: 'productName', label: 'Product Name', render: (row) => <span className="font-medium text-slate-900">{row.productName}</span> },
    { key: 'productCode', label: 'Product Code', render: (row) => <span className="text-slate-600 text-xs">{row.productCode}</span> },
    { key: 'quantity', label: 'Quantity', render: (row) => <span className="text-slate-600">{row.quantity}</span> },
    { key: 'unitPrice', label: 'Unit Price', render: (row) => <span className="text-slate-600">{formatCurrency(row.unitPrice)}</span> },
    { key: 'schemeBenefit', label: 'Scheme Benefit', render: (row) => <span className="text-emerald-600 text-sm">{row.schemeBenefit || '-'}</span> },
    { key: 'lineTotal', label: 'Line Total', render: (row) => <span className="font-medium text-slate-900">{formatCurrency(row.lineTotal)}</span> },
  ];

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Order Placement"
        subtitle="Create, submit, and track your purchase orders placed with your assigned distributor."
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
            <ActionButton icon={<Plus className="w-4 h-4" />} onClick={() => setIsCreateOpen(true)}>
              Create Order
            </ActionButton>
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
            { label: 'Processing', value: 'Processing' },
            { label: 'Packed', value: 'Packed' },
            { label: 'Dispatched', value: 'Dispatched' },
            { label: 'Delivered', value: 'Delivered' },
            { label: 'Completed', value: 'Completed' },
            { label: 'Rejected', value: 'Rejected' },
            { label: 'Cancelled', value: 'Cancelled' },
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
                <span className="font-medium text-emerald-600">- {formatCurrency(calculateSchemeDiscount(cartItems))}</span>
              </div>
              <div className="pt-2 mt-2 border-t border-slate-200 flex justify-between">
                <span className="font-bold text-slate-900">Net Order Value</span>
                <span className="font-bold text-violet-700">{formatCurrency(cartItems.reduce((acc, i) => acc + i.lineTotal, 0) - calculateSchemeDiscount(cartItems))}</span>
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