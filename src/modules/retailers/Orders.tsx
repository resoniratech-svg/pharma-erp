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
import { retailerOrderService } from '../../services/retailerOrderService';
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
  productId?: number;
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
    const loadOrders = async () => {
      let localOrders: Order[] = [];
      try {
        const allOrdersStr = localStorage.getItem('pharma_erp_retailer_orders');
        if (allOrdersStr) {
          localOrders = JSON.parse(allOrdersStr);
        }
      } catch (e) {
        console.error("Failed to parse orders from localStorage", e);
      }

      try {
        const apiOrders = await retailerOrderService.getRetailerOrders();
        if (apiOrders && apiOrders.length > 0) {
          const mappedApiOrders: Order[] = apiOrders.map(apiOrder => ({
            id: String(apiOrder.id),
            orderNo: apiOrder.orderNumber,
            retailerId: String(apiOrder.retailerId || apiOrder.retailer?.code || ''),
            retailerCode: apiOrder.retailer?.code || '',
            retailer: apiOrder.retailer?.name || 'Retailer',
            distributorId: String(apiOrder.stockistId || apiOrder.stockist?.code || ''),
            distributorCode: apiOrder.stockist?.code || 'DIST-001',
            distributorName: apiOrder.stockist?.name || 'Metro Pharma Distributors',
            date: apiOrder.orderDate ? new Date(apiOrder.orderDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-') : '',
            amount: apiOrder.totalAmount,
            schemeDiscount: 0,
            netAmount: apiOrder.totalAmount,
            paymentStatus: 'Unpaid',
            status: (apiOrder.status === 'PENDING' ? 'Pending' : apiOrder.status) as OrderStatus,
            expectedDeliveryDate: '',
            deliveryAddress: apiOrder.retailer?.address || '',
            contactPerson: apiOrder.retailer?.contactPerson || '',
            mobileNumber: apiOrder.retailer?.mobile || '',
            items: Array.isArray(apiOrder.orderItems) ? apiOrder.orderItems.map((oi: any) => ({
              id: String(oi.id || oi.productId),
              productId: oi.productId,
              productCode: oi.product?.code || String(oi.productId),
              productName: oi.product?.name || 'Medicine',
              quantity: oi.quantity,
              unitPrice: oi.rate,
              lineTotal: oi.amount
            })) : []
          }));

          const apiOrderNos = new Set(mappedApiOrders.map(o => o.orderNo));
          const localOnly = localOrders.filter(o => !apiOrderNos.has(o.orderNo));
          const merged = [...localOnly, ...mappedApiOrders];
          setData(merged);
          localStorage.setItem('pharma_erp_retailer_orders', JSON.stringify(merged));
          return;
        }
      } catch (apiErr) {
        console.warn("Could not load orders from API, using local storage:", apiErr);
      }

      if (localOrders.length > 0) {
        setData(localOrders);
      }
    };

    loadOrders();
  }, []);

  useEffect(() => {
    const resolveContext = async () => {
      try {
        const user = authService.getCurrentUser();
        if (!user) return;

        let retailers: any[] = [];
        try {
          retailers = await retailerMasterService.fetchFromApi();
        } catch (apiErr) {
          console.warn("API retailer fetch failed, using local fallback:", apiErr);
        }

        if (!retailers || retailers.length === 0) {
          retailers = retailerMasterService.getAll ? retailerMasterService.getAll() : [];
        }
        
        const userId = String(user.id || '').trim().toLowerCase();
        const userCode = String(user.employeeCode || (user as any).linkedRetailerCode || localStorage.getItem('retailerCode') || '').trim().toLowerCase();
        const userEmail = String(user.email || '').trim().toLowerCase();
        const username = String((user as any).username || '').trim().toLowerCase();
        const userName = String(user.fullName || (user as any).name || '').trim().toLowerCase();

        let matchedRetailer = null;

        // Strongest identifier priority: Code -> Email -> ID -> Username -> Name
        if (userCode) {
          matchedRetailer = retailers.find((r: any) => String(r.code || '').trim().toLowerCase() === userCode);
        }
        if (!matchedRetailer && userEmail) {
          matchedRetailer = retailers.find((r: any) => String(r.emailAddress || r.email || '').trim().toLowerCase() === userEmail);
        }
        if (!matchedRetailer && userId) {
          matchedRetailer = retailers.find((r: any) => String(r.id || '').trim().toLowerCase() === userId);
        }
        if (!matchedRetailer && username) {
          matchedRetailer = retailers.find((r: any) => String(r.username || '').trim().toLowerCase() === username);
        }
        if (!matchedRetailer && userName) {
          matchedRetailer = retailers.find((r: any) => String(r.name || r.retailerName || '').trim().toLowerCase() === userName);
        }

        if (matchedRetailer) {
          setUserRetailerContext(matchedRetailer);
          setAddress(matchedRetailer.address || '');
          setContact(matchedRetailer.contactPerson || matchedRetailer.name || '');
          setMobile(matchedRetailer.mobileNumber || (matchedRetailer as any).mobile || '');
        } else {
          const isDemoArun = userEmail === 'retailer@pharmaerp.com' || userName.includes('arun') || userCode === 'ret-001';
          const defaultRetailer = isDemoArun ? {
            id: user.id || 'RET-001',
            code: 'RET-001',
            name: 'Arun Patel',
            contactPerson: 'Arun Patel',
            mobileNumber: '9876543210',
            address: '123 Health Ave, Bangalore, 560001',
            assignedDistributors: ['DIST-001']
          } : {
            id: user.id,
            code: userCode || user.employeeCode,
            name: user.fullName,
            emailAddress: user.email
          };

          setUserRetailerContext(defaultRetailer);
          if (isDemoArun) {
            setAddress(defaultRetailer.address);
            setContact(defaultRetailer.contactPerson);
            setMobile(defaultRetailer.mobileNumber);
          }
        }
      } catch (e) {
        console.error("Error resolving retailer context", e);
      }
    };

    resolveContext();
  }, []);

  const handleOpenCreateOrder = () => {
    if (userRetailerContext) {
      if (!address && userRetailerContext.address) {
        setAddress(userRetailerContext.address);
      }
      if (!contact && (userRetailerContext.contactPerson || userRetailerContext.name)) {
        setContact(userRetailerContext.contactPerson || userRetailerContext.name);
      }
      if (!mobile && (userRetailerContext.mobileNumber || userRetailerContext.mobile)) {
        setMobile(userRetailerContext.mobileNumber || userRetailerContext.mobile);
      }
    }
    setIsCreateOpen(true);
  };

  useEffect(() => {
    if (isCreateOpen) {
      if (userRetailerContext) {
        if (!address && userRetailerContext.address) setAddress(userRetailerContext.address);
        if (!contact && (userRetailerContext.contactPerson || userRetailerContext.name)) setContact(userRetailerContext.contactPerson || userRetailerContext.name);
        if (!mobile && (userRetailerContext.mobileNumber || userRetailerContext.mobile)) setMobile(userRetailerContext.mobileNumber || userRetailerContext.mobile);
      }
      const activeCart = localStorage.getItem('pharma_erp_retailer_cart');
      if (activeCart) {
        try {
          const parsed = JSON.parse(activeCart);
          const formattedItems = parsed.map((item: any) => ({
            id: item.id || generateUUID(),
            productId: item.productId ? Number(item.productId) : undefined,
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
  }, [isCreateOpen, userRetailerContext]);

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
    const rId = String(userRetailerContext.id || '').toLowerCase();
    const rCode = String(userRetailerContext.code || '').toLowerCase();
    const rName = String(userRetailerContext.name || '').toLowerCase();
    
    return data.filter(d => {
      const dId = String(d.retailerId || '').toLowerCase();
      const dCode = String(d.retailerCode || '').toLowerCase();
      const dName = String(d.retailer || '').toLowerCase();
      
      const isDemoMatch = (rCode === 'ret-001' || rName.includes('arun')) && 
                          (dCode === 'ret-001' || dName.includes('arun'));
      return isDemoMatch || (dId && dId === rId) || (dCode && dCode === rCode) || (dName && dName === rName);
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

  const getSchemeCalculation = (items: OrderItem[]) => {
    try {
      let totalDiscount = 0;
      const breakdownMap = new Map<string, number>();

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const activeSchemes = schemes.filter((s: any) => {
        if (s.status && s.status !== 'Active') return false;
        if (s.validFrom || s.startDate) {
          const fromDate = new Date(s.validFrom || s.startDate);
          if (!isNaN(fromDate.getTime()) && today < fromDate) return false;
        }
        if (s.validTo || s.endDate) {
          const toDate = new Date(s.validTo || s.endDate);
          if (!isNaN(toDate.getTime())) {
            toDate.setHours(23, 59, 59, 999);
            if (today > toDate) return false;
          }
        }
        return true;
      });

      const products = productService.getProducts ? productService.getProducts() : [];

      items.forEach(item => {
        if (!item.quantity || item.quantity <= 0) return;
        const product = products.find((p: any) => p.code === item.productCode);

        // Priority 1: Direct match by scheme name / code attached to cart item
        let matchedScheme = null;
        if (item.schemeBenefit && item.schemeBenefit !== 'No Scheme' && item.schemeBenefit !== '-') {
          const benefitClean = item.schemeBenefit.trim().toLowerCase();
          matchedScheme = activeSchemes.find((s: any) => {
            const sName = String(s.name || '').trim().toLowerCase();
            const sCode = String(s.code || '').trim().toLowerCase();
            return (sName && (sName === benefitClean || benefitClean.includes(sName) || sName.includes(benefitClean))) ||
                   (sCode && sCode === benefitClean);
          });
        }

        // Priority 2: Match by product code, category, brand, or All Products
        if (!matchedScheme) {
          matchedScheme = activeSchemes.find((s: any) => {
            if (s.productId && product && s.productId === product.id) return true;
            if (s.applicableTo === 'Product' && s.applicableSelection === item.productCode) return true;
            if (s.applicableTo === 'Category' && product && product.category === s.applicableSelection) return true;
            if (s.applicableTo === 'Brand' && product && (product.brandName || (product as any).brand) === s.applicableSelection) return true;
            if (s.applicableTo === 'All Products') return true;
            return false;
          });
        }

        let itemDiscount = 0;
        let schemeLabel = item.schemeBenefit || matchedScheme?.name || 'Promotional Scheme';

        if (matchedScheme) {
          schemeLabel = matchedScheme.name || schemeLabel;
          const buyQty = Number(matchedScheme.buyQty || matchedScheme.minQuantity || matchedScheme.minOrderQty || 0);
          const freeQty = Number(matchedScheme.freeQty || 0);
          const bType = String(matchedScheme.benefitType || matchedScheme.schemeType || matchedScheme.type || '').toLowerCase();
          
          const rawVal = matchedScheme.benefitValue || matchedScheme.discountPct || matchedScheme.ptrDiscount || '0';
          const bValue = parseFloat(String(rawVal).replace(/[^0-9.]/g, '')) || 0;

          const meetsMinQty = buyQty <= 0 || item.quantity >= buyQty;

          if (meetsMinQty) {
            // Case 1: Buy X Get Y Free / Free Quantity
            if (freeQty > 0 && buyQty > 0) {
              const freeUnits = Math.floor(item.quantity / buyQty) * freeQty;
              itemDiscount += freeUnits * item.unitPrice;
            } 
            // Case 2: Percentage discount
            else if (bType.includes('percentage') || bType.includes('pct') || bValue > 0) {
              if (bValue <= 100) {
                itemDiscount += (item.lineTotal * bValue) / 100;
              } else {
                itemDiscount += bValue;
              }
            } 
            // Case 3: Flat or PTR discount
            else if (bType.includes('flat') || bType.includes('cash')) {
              itemDiscount += bValue;
            } else if (bType.includes('ptr') || bType.includes('pts')) {
              itemDiscount += (item.unitPrice * bValue / 100) * item.quantity;
            }
          }
        } 
        // Fallback: If no scheme matched in DB list, but item has scheme text like "10% off" or "Buy 20 Get 1"
        else if (item.schemeBenefit && item.schemeBenefit !== 'No Scheme' && item.schemeBenefit !== '-') {
          const pctMatch = item.schemeBenefit.match(/(\d+(\.\d+)?)%/);
          const buyGetMatch = item.schemeBenefit.match(/buy\s+(\d+)\s+get\s+(\d+)/i);

          if (pctMatch) {
            const pct = parseFloat(pctMatch[1]);
            itemDiscount += (item.lineTotal * pct) / 100;
          } else if (buyGetMatch) {
            const bQty = parseInt(buyGetMatch[1], 10);
            const fQty = parseInt(buyGetMatch[2], 10);
            if (bQty > 0 && fQty > 0 && item.quantity >= bQty) {
              const freeUnits = Math.floor(item.quantity / bQty) * fQty;
              itemDiscount += freeUnits * item.unitPrice;
            }
          }
        }

        if (itemDiscount > 0) {
          totalDiscount += itemDiscount;
          const current = breakdownMap.get(schemeLabel) || 0;
          breakdownMap.set(schemeLabel, current + itemDiscount);
        }
      });

      const breakdown = Array.from(breakdownMap.entries()).map(([name, amount]) => ({
        name,
        amount
      }));

      return { totalDiscount, breakdown };
    } catch (e) {
      console.error("Error calculating schemes", e);
      return { totalDiscount: 0, breakdown: [] };
    }
  };

  const calculateSchemeDiscount = (items: OrderItem[]) => {
    return getSchemeCalculation(items).totalDiscount;
  };

  const handleRemoveCartItem = (id: string) => {
    const updatedCart = cartItems.filter(item => item.id !== id);
    setCartItems(updatedCart);
    localStorage.setItem('pharma_erp_retailer_cart', JSON.stringify(updatedCart));
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

  const handleUpdateCartQuantity = (id: string, newQuantity: number) => {
    if (newQuantity < 1) newQuantity = 1;
    const updatedCart = cartItems.map(item => {
      if (item.id === id) {
        return {
          ...item,
          quantity: newQuantity,
          lineTotal: newQuantity * item.unitPrice
        };
      }
      return item;
    });
    setCartItems(updatedCart);
    localStorage.setItem('pharma_erp_retailer_cart', JSON.stringify(updatedCart));
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
    
    // Submit to database API
    const orderPayload = {
      orderNumber: orderNumber,
      retailerId: typeof userRetailerContext.id === 'number' ? userRetailerContext.id : undefined,
      retailerCode: userRetailerContext.code || 'RET-001',
      retailerName: userRetailerContext.name || 'Arun Patel',
      distributorCode: distributor.code || 'DIST-001',
      distributorName: distributor.name || 'Metro Pharma Distributors',
      stockistId: typeof distributor.id === 'number' ? distributor.id : undefined,
      totalAmount: Math.max(0, totalGross - schemeDiscount),
      deliveryAddress: address,
      contactPerson: contact,
      mobileNumber: mobile,
      remarks: remarks,
      status: 'Pending',
      orderItems: cartItems.map(item => ({
        productId: item.productId,
        productCode: item.productCode,
        productName: item.productName,
        quantity: item.quantity,
        rate: item.unitPrice,
        amount: item.lineTotal
      }))
    };

    retailerOrderService.addRetailerOrder(orderPayload).then((apiRes) => {
      if (apiRes) {
        console.log("Order saved to database successfully:", apiRes.orderNumber || apiRes.id);
      }
    }).catch(err => {
      console.warn("Could not save to backend database, retained in local storage:", err);
    });

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
    { 
      key: 'quantity', 
      label: 'Quantity', 
      render: (row) => (
        <input 
          type="number" 
          min="1" 
          className="w-20 px-2 py-1 border border-slate-200 rounded text-sm focus:outline-none focus:border-violet-500 text-slate-700" 
          value={row.quantity}
          onChange={(e) => handleUpdateCartQuantity(row.id, parseInt(e.target.value) || 1)}
        />
      ) 
    },
    { key: 'unitPrice', label: 'Unit Price', render: (row) => <span className="text-slate-600">{formatCurrency(row.unitPrice)}</span> },
    { key: 'schemeBenefit', label: 'Scheme Benefit', render: (row) => <span className="text-emerald-600 text-sm">{row.schemeBenefit || '-'}</span> },
    { key: 'lineTotal', label: 'Line Total', render: (row) => <span className="font-medium text-slate-900">{formatCurrency(row.lineTotal)}</span> },
    {
      key: 'id',
      label: 'Action',
      render: (row) => (
        <button
          type="button"
          onClick={() => handleRemoveCartItem(row.id)}
          className="w-6 h-6 flex items-center justify-center rounded-full bg-red-50 text-red-600 hover:bg-red-100 font-bold text-sm transition-colors shadow-sm"
          title="Remove from cart"
        >
          -
        </button>
      )
    }
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
            <ActionButton icon={<Plus className="w-4 h-4" />} onClick={handleOpenCreateOrder}>
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
                    onChange={(e) => setMobile(e.target.value.replace(/\\D/g, '').slice(0, 10))}
                    maxLength={10}
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
            {(() => {
              const schemeCalc = getSchemeCalculation(cartItems);
              const totalGross = cartItems.reduce((acc, i) => acc + i.lineTotal, 0);
              const netAmount = Math.max(0, totalGross - schemeCalc.totalDiscount);

              return (
                <div className="bg-slate-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Total Quantity</span>
                    <span className="font-medium text-slate-900">{cartItems.reduce((acc, i) => acc + i.quantity, 0)} Units</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Total Order Value</span>
                    <span className="font-medium text-slate-900">{formatCurrency(totalGross)}</span>
                  </div>

                  {schemeCalc.breakdown.length > 0 ? (
                    schemeCalc.breakdown.map((s, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-emerald-800 font-medium">Scheme Discount ({s.name})</span>
                        <span className="font-medium text-emerald-600">- {formatCurrency(s.amount)}</span>
                      </div>
                    ))
                  ) : (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Scheme Discount</span>
                      <span className="font-medium text-slate-400">- {formatCurrency(0)}</span>
                    </div>
                  )}

                  {schemeCalc.breakdown.length > 1 && (
                    <div className="flex justify-between text-sm pt-1 border-t border-slate-200/60">
                      <span className="text-slate-700 font-medium">Total Scheme Discount</span>
                      <span className="font-bold text-emerald-600">- {formatCurrency(schemeCalc.totalDiscount)}</span>
                    </div>
                  )}

                  <div className="pt-2 mt-2 border-t border-slate-200 flex justify-between">
                    <span className="font-bold text-slate-900">Net Order Value</span>
                    <span className="font-bold text-violet-700">{formatCurrency(netAmount)}</span>
                  </div>
                </div>
              );
            })()}
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