// Refactored GST Invoicing Module
import { useState, useEffect } from 'react';
import { Plus, Download, ReceiptText, Trash2, Ban, Edit, Search, UserPlus, X, ChevronRight, Check } from 'lucide-react';
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
} from './components/shared';
import { type Column } from './components/shared';
import { productService } from '../../services/productService';
import { batchService } from '../../services/batchService';
import { schemeService } from '../../services/schemeService';
import { billingService, type GSTInvoice, type InvoiceItem } from '../../services/billingService';
import activityLogService from '../../services/activityLogService';
import authService from '../../services/authService';
import { NotificationService } from '../../services/notificationService';
import { hasModulePermission } from '../../utils/permissionUtils';
import { distributorMasterService } from '../../services/distributorMasterService';
import { generateInvoicePdf } from '../../documents/generators/pdfGenerator';
import { apiRequest } from '../../services/apiClient';
import { INDIAN_STATES } from '../../constants/indianStates';

export interface CustomerOption {
  id: string;
  code: string;
  name: string;
  type: string;
  state: string;
  creditDays: number;
  mobile?: string;
  gstin?: string;
  address?: string;
}

const DEFAULT_CUSTOMERS: CustomerOption[] = [
  { id: 'CUST-001', code: 'CUST-001', name: 'MedPlus Store', type: 'Retailer', state: 'Telangana', creditDays: 30, mobile: '9848012345' },
  { id: 'CUST-002', code: 'CUST-002', name: 'Apollo Pharmacy', type: 'Hospital Chain', state: 'Karnataka', creditDays: 45, mobile: '9848054321' },
  { id: 'CUST-003', code: 'CUST-003', name: 'Wellness Medicos', type: 'Retailer', state: 'Maharashtra', creditDays: 15, mobile: '9848098765' },
  { id: 'CUST-004', code: 'CUST-004', name: 'Care Hospitals', type: 'Institutional', state: 'Telangana', creditDays: 30, mobile: '9848067890' },
  { id: 'B2C', code: 'B2C', name: 'Walk-in / Cash Customer (B2C)', type: 'Counter', state: 'Telangana', creditDays: 0, mobile: '-' },
];

interface ProductRecord {
  id: string;
  code: string;
  name: string;
  gst: string;
  hsnCode: string;
  brand?: string;
  manufacturer?: string;
  mrp?: string;
  ptr?: string;
  barcode?: string;
  category?: string;
}

export default function GSTBilling() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [invoices, setInvoices] = useState<GSTInvoice[]>([]);
  const [inventory, setInventory] = useState<Record<string, { batchNo: string; expiry: string; stock: number; ptr: number; mrp?: number; status: string }[]>>({});
  const [products, setProducts] = useState<ProductRecord[]>([]);
  
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMode, setPaymentMode] = useState('Credit');
  const [status, setStatus] = useState<'Paid' | 'Unpaid' | 'Draft'>('Unpaid');
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [schemesState, setSchemesState] = useState<any[]>([]);

  // Customer Management & Search States
  const [customers, setCustomers] = useState<CustomerOption[]>(DEFAULT_CUSTOMERS);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);
  const [isSavingCustomer, setIsSavingCustomer] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState({
    name: '',
    type: 'Retailer',
    state: 'Telangana',
    mobile: '',
    contactPerson: '',
    gstNumber: '',
    drugLicenseNumber: '',
    address: '',
    creditDays: 30
  });

  // Organization Settings (Seller State)
  const companySettings = JSON.parse(localStorage.getItem('company_settings') || '{}');
  const sellerState = companySettings.state || 'Telangana';
  const [buyerState, setBuyerState] = useState('Telangana'); 

  const currentUser = authService.getCurrentUser();
  const activeRole = localStorage.getItem('activeRole') || '';
  const canView = hasModulePermission(activeRole, "Wholesale Billing System", "View") || 
                  hasModulePermission(activeRole, "Wholesale Billing", "View") ||
                  hasModulePermission(activeRole, "Billing & Invoicing", "View");
  const canCreate = hasModulePermission(activeRole, "Wholesale Billing System", "Create") || 
                    hasModulePermission(activeRole, "Wholesale Billing", "Create") ||
                    hasModulePermission(activeRole, "Billing & Invoicing", "Create");
  const canOverrideGst = activeRole === 'Super Admin' || activeRole === 'Admin';

  const loadCustomers = async () => {
    const list: CustomerOption[] = [];

    // 1. Fetch Retailers from Backend API
    try {
      const retRes = await apiRequest<{ success: boolean; data: any[] }>('/retailers');
      if (retRes && retRes.success && Array.isArray(retRes.data)) {
        retRes.data.forEach((r: any) => {
          list.push({
            id: String(r.id),
            code: r.code || `RET-${String(r.id).padStart(3, '0')}`,
            name: r.name,
            type: 'Retailer',
            state: r.state || (r.address && r.address.toLowerCase().includes('karnataka') ? 'Karnataka' : r.address && r.address.toLowerCase().includes('maharashtra') ? 'Maharashtra' : 'Telangana'),
            creditDays: 30,
            mobile: r.mobile || r.mobileNumber || '',
            gstin: r.gstNumber || r.drugLicenseNumber || '',
            address: r.address || ''
          });
        });
      }
    } catch (e) {
      console.warn("Could not load retailers from API:", e);
    }

    // 2. Fetch Distributors from Backend API
    try {
      const distRes = await apiRequest<{ success: boolean; data: any[] }>('/distributors');
      if (distRes && distRes.success && Array.isArray(distRes.data)) {
        distRes.data.forEach((d: any) => {
          list.push({
            id: String(d.id),
            code: d.code || `DIST-${String(d.id).padStart(3, '0')}`,
            name: d.name,
            type: 'Distributor',
            state: d.state || 'Telangana',
            creditDays: d.creditDays || 30,
            mobile: d.mobile || d.mobileNumber || '',
            gstin: d.companyPan || d.dlNumber || '',
            address: d.address || ''
          });
        });
      }
    } catch (e) {
      console.warn("Could not load distributors from API:", e);
    }

    // 3. Fallback / merge local distributor master if any
    const localDist = JSON.parse(localStorage.getItem('pharma_erp_distributor_master') || '[]');
    localDist.forEach((d: any) => {
      if (d.name && !list.some(c => c.name.toLowerCase() === d.name.toLowerCase())) {
        list.push({
          id: String(d.id || `DIST-${Date.now()}`),
          code: d.code || `DIST-${d.id}`,
          name: d.name,
          type: 'Distributor',
          state: d.state || 'Telangana',
          creditDays: d.creditDays || 30,
          mobile: d.mobileNumber || '',
          gstin: d.companyPan || ''
        });
      }
    });

    // 4. Always ensure Walk-in / Cash Customer (B2C) exists
    list.push({
      id: 'B2C',
      code: 'B2C',
      name: 'Walk-in / Cash Customer (B2C)',
      type: 'Counter',
      state: 'Telangana',
      creditDays: 0,
      mobile: '-'
    });

    // Fallback to DEFAULT_CUSTOMERS if list is empty or only B2C
    if (list.length <= 1) {
      DEFAULT_CUSTOMERS.forEach(dc => {
        if (!list.some(c => c.name.toLowerCase() === dc.name.toLowerCase())) {
          list.unshift(dc);
        }
      });
    }

    // Deduplicate by name
    const uniqueMap = new Map<string, CustomerOption>();
    list.forEach(item => {
      if (!uniqueMap.has(item.name.toLowerCase())) {
        uniqueMap.set(item.name.toLowerCase(), item);
      }
    });

    setCustomers(Array.from(uniqueMap.values()));
  };

  const loadDatabaseDetails = async () => {
    const savedInvoices = await billingService.loadInvoices();
    setInvoices(savedInvoices);

    const savedProducts = (await productService.loadProducts()) as ProductRecord[];
    setProducts(savedProducts || []);

    const savedBatches = await batchService.loadBatches();
    const groupInventory: Record<string, { batchNo: string; expiry: string; stock: number; ptr: number; mrp?: number; status: string }[]> = {};
    
    savedBatches.forEach(b => {
      const matchProduct = savedProducts.find((p) => 
        (b.productId && String(p.id) === String(b.productId)) ||
        (b.productCode && p.code.toLowerCase() === b.productCode.toLowerCase()) ||
        (b.productName && p.name.toLowerCase() === b.productName.toLowerCase())
      );
      
      const keysToGroup = new Set<string>();
      if (matchProduct) {
        keysToGroup.add(matchProduct.id);
        keysToGroup.add(matchProduct.code);
      }
      if (b.productId) keysToGroup.add(String(b.productId));
      if (b.productCode) keysToGroup.add(b.productCode);
      if (b.productName) keysToGroup.add(b.productName);

      const batchObj = {
        batchNo: b.batchNo,
        expiry: b.expDate,
        stock: Number(b.availableQty) || 0,
        ptr: Number(b.ptr) || 0,
        mrp: Number(b.mrp) || 0,
        status: b.status || 'Active'
      };

      keysToGroup.forEach(key => {
        if (!groupInventory[key]) {
          groupInventory[key] = [];
        }
        if (!groupInventory[key].some(item => item.batchNo === b.batchNo)) {
          groupInventory[key].push(batchObj);
        }
      });
    });

    setInventory(groupInventory);
  };

  useEffect(() => {
    loadDatabaseDetails();
    loadCustomers();
    distributorMasterService.fetchFromApi().catch(() => {});
    const fetchSchemes = async () => {
      try {
        const data = await schemeService.getAll();
        setSchemesState(data || []);
      } catch (e) {
        console.error("Failed to load schemes:", e);
      }
    };
    fetchSchemes();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
  };

  const isBatchExpired = (expiryStr: string) => {
    if (!expiryStr) return false;
    const parts = expiryStr.split('/');
    if (parts.length === 2) {
      const [month, year] = parts;
      const expDate = new Date(Number(year), Number(month), 0);
      return expDate < new Date();
    }
    const date = new Date(expiryStr);
    return !isNaN(date.getTime()) && date < new Date();
  };

  const calculateDueDate = (dateStr: string, days: number) => {
    const date = new Date(dateStr);
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  };

  const handlePaymentModeChange = (mode: string) => {
    setPaymentMode(mode);
    if (mode === 'Cash' || mode === 'UPI' || mode === 'Bank') {
      setStatus('Paid');
    } else {
      setStatus('Unpaid');
    }
  };

  const handleSelectCustomer = (c: CustomerOption) => {
    setCustomerId(c.id);
    setBuyerState(c.state || 'Telangana');
    setCustomerSearchQuery('');
    setIsCustomerDropdownOpen(false);
  };

  const handleCustomerChange = (id: string) => {
    setCustomerId(id);
    const customer = customers.find((c) => c.id === id);
    if (customer && customer.state) {
      setBuyerState(customer.state);
    }
  };

  const filteredCustomers = customers.filter(c => {
    if (!customerSearchQuery.trim()) return true;
    const q = customerSearchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.code && c.code.toLowerCase().includes(q)) ||
      (c.mobile && c.mobile.includes(q)) ||
      (c.state && c.state.toLowerCase().includes(q)) ||
      (c.type && c.type.toLowerCase().includes(q))
    );
  });

  const handleSaveQuickCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerForm.name.trim()) {
      alert("Please enter a customer name!");
      return;
    }

    setIsSavingCustomer(true);
    try {
      const generatedCode = `RET-${Date.now().toString().slice(-6)}`;
      const payload = {
        name: newCustomerForm.name.trim(),
        code: generatedCode,
        contactPerson: newCustomerForm.contactPerson || newCustomerForm.name.trim(),
        mobile: newCustomerForm.mobile || '9999999999',
        address: `${newCustomerForm.address || ''} ${newCustomerForm.state}`.trim(),
        state: newCustomerForm.state,
        drugLicenseNumber: newCustomerForm.drugLicenseNumber || '',
        companyPan: newCustomerForm.gstNumber || '',
        status: 'Active'
      };

      const response = await apiRequest<{ success: boolean; data: any }>('/retailers', {
        method: 'POST',
        bodyData: payload
      });

      const newId = response && response.data && response.data.id ? String(response.data.id) : `CUST-${Date.now()}`;
      const newCust: CustomerOption = {
        id: newId,
        code: generatedCode,
        name: newCustomerForm.name.trim(),
        type: newCustomerForm.type,
        state: newCustomerForm.state,
        creditDays: Number(newCustomerForm.creditDays) || 30,
        mobile: newCustomerForm.mobile,
        gstin: newCustomerForm.gstNumber,
        address: newCustomerForm.address
      };

      setCustomers(prev => [newCust, ...prev]);
      setCustomerId(newCust.id);
      setBuyerState(newCust.state);
      setCustomerSearchQuery('');
      setIsCustomerDropdownOpen(false);
      setIsAddCustomerModalOpen(false);

      setNewCustomerForm({
        name: '',
        type: 'Retailer',
        state: 'Telangana',
        mobile: '',
        contactPerson: '',
        gstNumber: '',
        drugLicenseNumber: '',
        address: '',
        creditDays: 30
      });

      NotificationService.addNotification({
        title: 'New Customer Registered',
        message: `${newCust.name} (${newCust.type}) registered and selected for billing.`,
        type: 'system',
        priority: 'info',
        module: 'Wholesale Billing'
      });

      alert(`✅ Customer "${newCust.name}" registered and selected for invoice!`);
    } catch (err: any) {
      console.error("Failed to save customer to API:", err);
      const fallbackId = `CUST-${Date.now()}`;
      const fallbackCust: CustomerOption = {
        id: fallbackId,
        code: `RET-${Date.now().toString().slice(-4)}`,
        name: newCustomerForm.name.trim(),
        type: newCustomerForm.type,
        state: newCustomerForm.state,
        creditDays: Number(newCustomerForm.creditDays) || 30,
        mobile: newCustomerForm.mobile,
        gstin: newCustomerForm.gstNumber,
        address: newCustomerForm.address
      };
      setCustomers(prev => [fallbackCust, ...prev]);
      setCustomerId(fallbackCust.id);
      setBuyerState(fallbackCust.state);
      setIsCustomerDropdownOpen(false);
      setIsAddCustomerModalOpen(false);
      alert(`✅ Customer "${fallbackCust.name}" added and selected!`);
    } finally {
      setIsSavingCustomer(false);
    }
  };

  const addLineItem = () => {
    setItems([...items, { id: Date.now().toString(), productId: '', productCode: '', productName: '', batchNo: '', qty: 1, freeQty: 0, ptr: 0, discountPercent: 0, gstPercent: 0, extraMargin: 0, total: 0, stock: 0 }]);
  };

  const removeLineItem = (id: string) => {
    if (window.confirm("Are you sure you want to remove this product?")) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const applyEligibleScheme = (productId: string, qty: number, ptr: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return { discountPercent: 0, freeQty: 0 };

    const schemes = schemesState;
    const todayStr = new Date().toISOString().split('T')[0];

    // Filter active schemes
    const activeSchemes = schemes.filter((s: any) => 
      s.status === 'Active' && 
      todayStr >= s.validFrom && 
      todayStr <= s.validTo
    );

    // Find matches
    const matchingSchemes = activeSchemes.filter((s: any) => {
      if (s.applicableTo === 'All Products') return true;
      if (s.applicableTo === 'Product' && s.applicableSelection === product.code) return true;
      if (s.applicableTo === 'Category' && s.applicableSelection === product.category) return true;
      if (s.applicableTo === 'Brand' && s.applicableSelection === (product.brand || product.manufacturer)) return true;
      return false;
    });

    if (matchingSchemes.length === 0) return { discountPercent: 0, freeQty: 0 };

    // Sort by priority (1 is highest priority)
    matchingSchemes.sort((a: any, b: any) => (Number(a.priority) || 10) - (Number(b.priority) || 10));
    const selectedScheme = matchingSchemes[0];

    const minQty = parseInt(selectedScheme.minQuantity) || 0;
    if (minQty > 0 && qty >= minQty) {
      if (selectedScheme.benefitType === 'Percentage Discount') {
        return { discountPercent: parseFloat(selectedScheme.benefitValue) || 0, freeQty: 0 };
      }
      if (selectedScheme.benefitType === 'Flat Discount') {
        const flatVal = parseFloat(selectedScheme.benefitValue) || 0;
        const pct = ptr > 0 ? (flatVal / ptr) * 100 : 0;
        return { discountPercent: Math.min(100, pct), freeQty: 0 };
      }
      if (selectedScheme.benefitType === 'Free Quantity') {
        const freeVal = parseInt(selectedScheme.freeQuantity) || 0;
        const freeQty = Math.floor(qty / minQty) * freeVal;
        return { discountPercent: 0, freeQty };
      }
    }

    return { discountPercent: 0, freeQty: 0 };
  };

  const updateLineItem = (id: string, field: keyof InvoiceItem, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        
        if (field === 'productId') {
          const product = products.find(p => p.id === value);
          const productInventory = inventory[value] || [];
          
          const parseExpiry = (expiryStr: string) => {
            if (!expiryStr) return new Date(9999, 11, 31);
            const parts = expiryStr.split('/');
            if (parts.length === 2) {
              return new Date(Number(parts[1]), Number(parts[0]) - 1, 1);
            }
            return new Date(expiryStr);
          };

          // Sort batches by expiry date (earliest first - FEFO) - Include Active & Healthy batches
          const batch = productInventory
            .filter(b => b.stock > 0 && !isBatchExpired(b.expiry) && (b.status === 'Active' || b.status === 'Healthy' || !b.status))
            .sort((a, b) => parseExpiry(a.expiry).getTime() - parseExpiry(b.expiry).getTime())[0];

          if (product) {
            updatedItem.productCode = product.code;
            updatedItem.productName = product.name;
            updatedItem.hsnCode = product.hsnCode;
            updatedItem.barcode = product.barcode || '';
            updatedItem.gstPercent = parseFloat(product.gst) || 12;
            if (batch) {
              updatedItem.batchNo = batch.batchNo;
              updatedItem.ptr = batch.ptr;
              updatedItem.stock = batch.stock;
              updatedItem.mrp = batch.mrp || parseFloat(product.mrp || '0') || 0;
            } else {
              updatedItem.batchNo = '';
              updatedItem.ptr = parseFloat(product.ptr || '0') || 0;
              updatedItem.stock = 0;
              updatedItem.mrp = parseFloat(product.mrp || '0') || 0;
            }
          } else {
            updatedItem.batchNo = ''; updatedItem.ptr = 0; updatedItem.stock = 0;
            updatedItem.productCode = ''; updatedItem.productName = ''; updatedItem.hsnCode = '';
            updatedItem.barcode = ''; updatedItem.mrp = 0;
          }
        }

        if (field === 'batchNo') {
          const productInventory = inventory[updatedItem.productId] || [];
          const batch = productInventory.find(b => b.batchNo === value);
          if (batch) {
            if (isBatchExpired(batch.expiry)) {
              alert(`Warning: Batch ${batch.batchNo} expired on ${batch.expiry}! Lock active.`);
              return item;
            }
            updatedItem.batchNo = batch.batchNo;
            updatedItem.ptr = batch.ptr;
            updatedItem.stock = batch.stock;
            updatedItem.mrp = batch.mrp || updatedItem.mrp || 0;
          }
        }

        if (field === 'qty') {
          if (updatedItem.stock > 0 && value > updatedItem.stock) {
            alert(`Insufficient Stock! Only ${updatedItem.stock} units available.`);
            updatedItem.qty = updatedItem.stock;
          }
        }

        // Apply dynamic promotions
        if (field === 'qty' || field === 'productId') {
          const promo = applyEligibleScheme(updatedItem.productId, updatedItem.qty, updatedItem.ptr);
          updatedItem.discountPercent = promo.discountPercent;
          updatedItem.freeQty = promo.freeQty;
        }

        if (field === 'extraMargin') {
          updatedItem.extraMargin = Math.max(0, parseFloat(value) || 0);
        }

        // Re-calculate line item total
        const baseAmt = (updatedItem.qty || 0) * (updatedItem.ptr || 0);
        const discAmt = (baseAmt * (updatedItem.discountPercent || 0)) / 100;
        const marginTotal = (updatedItem.qty || 0) * (Number(updatedItem.extraMargin) || 0);
        const taxable = Math.max(0, baseAmt - discAmt + marginTotal);
        const gst = (taxable * (updatedItem.gstPercent || 0)) / 100;
        updatedItem.total = taxable + gst;

        return updatedItem;
      }
      return item;
    }));
  };

  const subTotal = items.reduce((sum, item) => {
    const base = (item.qty || 0) * (item.ptr || 0) * (1 - (item.discountPercent || 0) / 100);
    const margin = (item.qty || 0) * (Number(item.extraMargin) || 0);
    return sum + Math.max(0, base + margin);
  }, 0);

  const totalGst = items.reduce((sum, item) => {
    const base = (item.qty || 0) * (item.ptr || 0) * (1 - (item.discountPercent || 0) / 100);
    const margin = (item.qty || 0) * (Number(item.extraMargin) || 0);
    const taxable = Math.max(0, base + margin);
    return sum + (taxable * (item.gstPercent || 0)) / 100;
  }, 0);
  
  // Dynamic Tax Determination Logic (same state vs different state)
  const isSameState = sellerState === buyerState;
  const cgstTotal = isSameState ? totalGst / 2 : 0;
  const sgstTotal = isSameState ? totalGst / 2 : 0;
  const igstTotal = isSameState ? 0 : totalGst;
  const grandTotal = subTotal + totalGst;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (new Date(invoiceDate) > new Date()) {
      alert("Invoice Date cannot be a future date!");
      return;
    }
    if (!customerId || items.length === 0) {
      alert("Please select a customer and add at least one product!");
      return;
    }
    for (let item of items) {
      if (!item.productId || !item.batchNo || item.qty <= 0) {
        alert("All products must have a selected Batch and Quantity > 0");
        return;
      }
    }
    
    const uniqueBatches = new Set(items.map(i => `${i.productId}-${i.batchNo}`));
    if (uniqueBatches.size < items.length) {
      alert("Duplicate batches found. Please merge the quantities into a single row.");
      return;
    }

    const customer = customers.find((c) => c.id === customerId);

    if (editingInvoiceId) {
      const existingInv = invoices.find(inv => inv.id === editingInvoiceId);
      const creditDays = customer?.creditDays || 30;
      const dueDate = paymentMode === 'Credit' ? calculateDueDate(invoiceDate, creditDays) : invoiceDate;

      const updatedInvoice: GSTInvoice = {
        id: editingInvoiceId,
        invoiceNo: existingInv?.invoiceNo || `GST-${editingInvoiceId}`,
        customerId,
        customerName: customer?.name || existingInv?.customerName || 'Unknown',
        date: invoiceDate,
        dueDate,
        items,
        subTotal,
        cgstTotal,
        sgstTotal,
        igstTotal,
        grandTotal,
        paymentMode,
        status,
      };

      billingService.updateInvoice(editingInvoiceId, updatedInvoice);

      // Synchronize finance outstandings
      const outstandings = JSON.parse(localStorage.getItem('finance_outstanding') || '[]');
      const outIdx = outstandings.findIndex((o: any) => o.invoiceNo === updatedInvoice.invoiceNo);
      if (outIdx !== -1) {
        if (status === 'Paid') {
          outstandings[outIdx].status = 'Paid';
          outstandings[outIdx].amount = 0;
        } else {
          outstandings[outIdx].status = 'Pending';
          outstandings[outIdx].amount = grandTotal;
          outstandings[outIdx].dueDate = dueDate;
        }
        localStorage.setItem('finance_outstanding', JSON.stringify(outstandings));
      } else if (paymentMode === 'Credit' && status === 'Unpaid') {
        billingService.saveOutstanding({
          id: `OUT-${Date.now()}`,
          invoiceNo: updatedInvoice.invoiceNo,
          customerName: updatedInvoice.customerName,
          invoiceDate,
          dueDate,
          amount: grandTotal,
          status: 'Pending'
        });
      }

      activityLogService.addLog({
        userId: currentUser?.id,
        userName: currentUser?.fullName,
        action: `Updated GST Invoice ${updatedInvoice.invoiceNo} for ${customer?.name} - Status: ${status}, Value: ${formatCurrency(grandTotal)}`,
        module: "Wholesale Billing",
      });

      NotificationService.addNotification({
        title: 'Sales Invoice Updated',
        message: `Invoice ${updatedInvoice.invoiceNo} updated successfully (Status: ${status}).`,
        type: 'system',
        priority: 'info',
        module: 'Wholesale Billing'
      });

      setInvoices(invoices.map(inv => inv.id === editingInvoiceId ? updatedInvoice : inv));

      setIsDrawerOpen(false);
      setEditingInvoiceId(null);
      setCustomerId('');
      setCustomerSearchQuery('');
      setIsCustomerDropdownOpen(false);
      setItems([]);
      setInvoiceDate(new Date().toISOString().split('T')[0]);
      setPaymentMode('Credit');
      setStatus('Unpaid');
      alert(`✅ GST Invoice ${updatedInvoice.invoiceNo} Updated Successfully!`);
      return;
    }

    const invoiceNo = billingService.getNextInvoiceNo();
    const creditDays = customer?.creditDays || 30;
    const dueDate = paymentMode === 'Credit' ? calculateDueDate(invoiceDate, creditDays) : invoiceDate;

    const newInvoice: GSTInvoice = {
      id: Date.now().toString(),
      invoiceNo,
      customerId,
      customerName: customer?.name || 'Unknown',
      date: invoiceDate,
      dueDate,
      items,
      subTotal,
      cgstTotal,
      sgstTotal,
      igstTotal,
      grandTotal,
      paymentMode,
      status,
    };

    // --- ERP STOCK INTEGRATION ---
    // Deduct stock from the central Batch Master database (Deduct qty + freeQty)
    const savedBatches = batchService.getAll();
    const updatedBatches = savedBatches.map(b => {
      const matchItem = items.find(item => item.batchNo === b.batchNo && item.productCode === b.productCode);
      if (matchItem) {
        return {
          ...b,
          availableQty: Math.max(0, b.availableQty - (matchItem.qty + (matchItem.freeQty || 0)))
        };
      }
      return b;
    });
    batchService.saveAll(updatedBatches);

    // Save ledger entry via service
    billingService.saveLedger({
      id: `LED-${Date.now()}`,
      date: invoiceDate,
      partyName: customer?.name,
      particulars: `Sales Invoice - ${invoiceNo}`,
      debit: grandTotal,
      credit: paymentMode !== 'Credit' ? grandTotal : 0,
      balance: paymentMode === 'Credit' ? grandTotal : 0
    });

    // Save credit outstandings
    if (paymentMode === 'Credit') {
      billingService.saveOutstanding({
        id: `OUT-${Date.now()}`,
        invoiceNo,
        customerName: customer?.name,
        invoiceDate,
        dueDate,
        amount: grandTotal,
        status: 'Pending'
      });
    }

    // Save sales register details & increment invoice counter
    billingService.saveSalesRegister(newInvoice);
    billingService.saveInvoice(newInvoice);
    billingService.incrementCounter();

    activityLogService.addLog({
      userId: currentUser?.id,
      userName: currentUser?.fullName,
      action: `Generated GST Invoice ${invoiceNo} for ${customer?.name} - Value: ${formatCurrency(grandTotal)}`,
      module: "Wholesale Billing",
    });

    // Write to Notification Center via NotificationService
    NotificationService.addNotification({
      title: 'Sales Invoice Created',
      message: `Invoice ${invoiceNo} generated for ${customer?.name} (₹${grandTotal}). Stock levels and ledgers synchronized.`,
      type: 'system',
      priority: 'info',
      module: 'Wholesale Billing'
    });

    setInvoices([newInvoice, ...invoices]);

    // Re-group local inventory stocks view
    const savedProducts = productService.getProducts();
    const groupInventory: Record<string, { batchNo: string; expiry: string; stock: number; ptr: number; mrp?: number; status: string }[]> = {};
    updatedBatches.forEach(b => {
      const matchProduct = savedProducts.find((p: any) => p.code === b.productCode);
      const prodId = matchProduct ? matchProduct.id : b.productCode;
      
      if (!groupInventory[prodId]) {
        groupInventory[prodId] = [];
      }
      groupInventory[prodId].push({
        batchNo: b.batchNo,
        expiry: b.expDate,
        stock: b.availableQty,
        ptr: Number(b.ptr) || 0,
        mrp: Number(b.mrp) || 0,
        status: b.status || 'Healthy'
      });
    });
    setInventory(groupInventory);

    setIsDrawerOpen(false);
    setCustomerId('');
    setCustomerSearchQuery('');
    setIsCustomerDropdownOpen(false);
    setItems([]);
    setInvoiceDate(new Date().toISOString().split('T')[0]);
    setPaymentMode('Credit');
    setStatus('Unpaid');
    alert('✅ GST Invoice Generated & Modules Synchronized Successfully!');
  };

  const handleEditInvoice = (inv: GSTInvoice) => {
    setEditingInvoiceId(inv.id);
    setCustomerId(inv.customerId);
    setCustomerSearchQuery('');
    setIsCustomerDropdownOpen(false);
    setInvoiceDate(inv.date || new Date().toISOString().split('T')[0]);
    setPaymentMode(inv.paymentMode || 'Credit');
    setStatus((inv.status as any) || 'Unpaid');
    setItems((inv.items || []).map(item => ({
      ...item,
      extraMargin: item.extraMargin !== undefined ? item.extraMargin : 0
    })));
    const customer = customers.find((c) => c.id === inv.customerId);
    if (customer && customer.state) {
      setBuyerState(customer.state);
    }
    setIsDrawerOpen(true);
  };

  // --- REVERSAL & INVOICE CANCELLATION WORKFLOW ---
  const handleCancelInvoice = (invoiceNo: string) => {
    if (!window.confirm(`⚠️ WARNING: Are you sure you want to CANCEL Invoice ${invoiceNo}? This action is irreversible, will restore stock levels, and reverse all accounting ledgers.`)) {
      return;
    }

    const targetInvoice = invoices.find(inv => inv.invoiceNo === invoiceNo);
    if (!targetInvoice) return;

    // 1. Restore Stock Levels
    const savedBatches = batchService.getAll();
    const updatedBatches = savedBatches.map(b => {
      const matchItem = targetInvoice.items.find(item => item.batchNo === b.batchNo && item.productCode === b.productCode);
      if (matchItem) {
        return {
          ...b,
          availableQty: b.availableQty + (matchItem.qty + (matchItem.freeQty || 0))
        };
      }
      return b;
    });
    batchService.saveAll(updatedBatches);

    // 2. Reverse Ledger Entries
    billingService.saveLedger({
      id: `LED-REV-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      partyName: targetInvoice.customerName,
      particulars: `REVERSAL - Sales Invoice Cancelled - ${invoiceNo}`,
      debit: 0,
      credit: targetInvoice.grandTotal,
      balance: 0
    });

    // 3. Reverse Outstanding Records
    const outstandings = JSON.parse(localStorage.getItem('finance_outstanding') || '[]');
    const updatedOutstandings = outstandings.map((out: any) => {
      if (out.invoiceNo === invoiceNo) {
        return { ...out, status: 'Cancelled', amount: 0 };
      }
      return out;
    });
    localStorage.setItem('finance_outstanding', JSON.stringify(updatedOutstandings));

    // 4. Update Invoices Database
    billingService.cancelInvoice(invoiceNo);

    // 5. Add Audit Log
    activityLogService.addLog({
      userId: currentUser?.id,
      userName: currentUser?.fullName,
      action: `Cancelled GST Invoice ${invoiceNo} - Reverted ${formatCurrency(targetInvoice.grandTotal)}`,
      module: "Wholesale Billing",
    });

    // 6. Notify Compliance
    NotificationService.addNotification({
      title: 'Invoice Cancelled',
      message: `Invoice ${invoiceNo} has been cancelled. Stock levels restored and ledger reversed.`,
      type: 'system',
      priority: 'high',
      module: 'Wholesale Billing'
    });

    loadDatabaseDetails();
    alert(`✅ Invoice ${invoiceNo} successfully Cancelled & Ledgers Reversed.`);
  };

  const handleExport = () => {
    const headers = ['Invoice No', 'Customer Name', 'Invoice Date', 'Due Date', 'Taxable Value', 'CGST', 'SGST', 'IGST', 'Grand Total', 'Payment Mode', 'Status'];
    const csvContent = [
      headers.join(','),
      ...filteredData.map(row => [
        row.invoiceNo,
        `="${row.customerName}"`,
        row.date,
        row.dueDate,
        row.subTotal,
        row.cgstTotal,
        row.sgstTotal,
        row.igstTotal,
        row.grandTotal,
        row.paymentMode,
        row.status
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'gst_billing_export.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    activityLogService.addLog({
      userId: currentUser?.id,
      userName: currentUser?.fullName,
      action: "GST Billing Register Exported",
      module: "Wholesale Billing",
    });
  };

  const columns: Column<GSTInvoice>[] = [
    { key: 'invoiceNo', label: 'Invoice No', render: (row: GSTInvoice) => <span className="font-semibold text-slate-900">{row.invoiceNo}</span> },
    { key: 'customerName', label: 'Customer Name' },
    { key: 'date', label: 'Invoice Date' },
    { key: 'subTotal', label: 'Taxable Amt', render: (row: GSTInvoice) => <span>{formatCurrency(row.subTotal)}</span> },
    { key: 'cgstTotal', label: 'CGST', render: (row: GSTInvoice) => <span className="text-slate-500 text-xs">{formatCurrency(row.cgstTotal)}</span> },
    { key: 'sgstTotal', label: 'SGST', render: (row: GSTInvoice) => <span className="text-slate-500 text-xs">{formatCurrency(row.sgstTotal)}</span> },
    { key: 'grandTotal', label: 'Total Value', render: (row: GSTInvoice) => <span className="font-bold text-violet-700">{formatCurrency(row.grandTotal)}</span> },
    {
      key: 'status',
      label: 'Status',
      render: (row: GSTInvoice) => {
        let variant: any = 'neutral';
        if (row.status === 'Paid') variant = 'success';
        else if (row.status === 'Unpaid') variant = 'warning';
        else if (row.status === 'Cancelled') variant = 'danger';
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    },
    {
      key: 'action',
      label: 'Actions',
      render: (row: GSTInvoice) => (
        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          <button 
            onClick={() => {
              activityLogService.addLog({
                userId: currentUser?.id,
                userName: currentUser?.fullName,
                action: `Generated & downloaded Tax Invoice PDF for ${row.invoiceNo}`,
                module: "Wholesale Billing"
              });
              generateInvoicePdf(row, activeRole);
            }}
            className="text-[#163c78] hover:text-violet-750 p-1"
            title="View & Download Tax Invoice PDF"
          >
            <ReceiptText className="w-4 h-4" />
          </button>
          {row.status !== 'Cancelled' && (
            <>
              <button 
                onClick={() => handleEditInvoice(row)} 
                className="text-indigo-600 hover:text-indigo-800 p-1"
                title="Edit Invoice & Payment Status"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button 
                onClick={() => handleCancelInvoice(row.invoiceNo)} 
                className="text-rose-600 hover:text-rose-750 p-1"
                title="Cancel & Reverse Invoice"
              >
                <Ban className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      )
    }
  ];

  const filteredData = invoices.filter((item) => {
    const matchSearch = item.invoiceNo.toLowerCase().includes(search.toLowerCase()) || item.customerName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  const selectedCustomer = customers.find((c) => c.id === customerId);

  if (!canView) {
    return (
      <div className="p-10 text-center">
        <h2 className="text-xl font-semibold">Access Denied</h2>
        <p className="text-slate-500 mt-2">
          You do not have permission to view GST Invoicing.
        </p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500 bg-white">
      <PageHeader
        title="GST Billing & Invoicing"
        subtitle="Create, manage, and track GST-compliant sales invoices with auto-calculation."
        actions={
          <>
            <ActionButton variant="secondary" icon={<Download className="w-4 h-4" />} onClick={handleExport}>Export Register</ActionButton>
            {canCreate && (
              <ActionButton icon={<Plus className="w-4 h-4" />} onClick={() => {
                setEditingInvoiceId(null);
                setCustomerId('');
                setCustomerSearchQuery('');
                setIsCustomerDropdownOpen(false);
                setInvoiceDate(new Date().toISOString().split('T')[0]);
                setPaymentMode('Credit');
                setStatus('Unpaid');
                setItems([]);
                setIsDrawerOpen(true);
              }}>
                New Invoice
              </ActionButton>
            )}
          </>
        }
      />

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search invoice no or customer..." />
        <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
        <SelectFilter value={statusFilter} onChange={setStatusFilter} options={[{ label: 'Paid', value: 'Paid' }, { label: 'Unpaid', value: 'Unpaid' }, { label: 'Cancelled', value: 'Cancelled' }]} placeholder="All Status" />
      </FilterBar>

      <TableCard>
        <DataTable columns={columns} data={filteredData} emptyMessage="No invoices found." />
      </TableCard>

      <Drawer 
        open={isDrawerOpen} 
        onClose={() => {
          setIsDrawerOpen(false);
          setEditingInvoiceId(null);
          setCustomerSearchQuery('');
          setIsCustomerDropdownOpen(false);
        }} 
        title={editingInvoiceId ? "Edit GST Invoice" : "Generate GST Invoice"}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div className="col-span-2 sm:col-span-1 relative">
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Customer Selection *
                </label>
                <button
                  type="button"
                  onClick={() => setIsAddCustomerModalOpen(true)}
                  className="text-[11px] font-semibold text-[#163c78] hover:text-[#0c1f3d] flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-750 px-2 py-0.5 rounded border border-indigo-200 transition-colors"
                  title="Add New Customer"
                >
                  <UserPlus className="w-3.5 h-3.5" /> + New Customer
                </button>
              </div>

              {selectedCustomer ? (
                <div className="flex items-center justify-between p-2 bg-white border border-indigo-300 rounded-lg shadow-sm">
                  <div className="flex flex-col min-w-0 pr-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-slate-900 truncate">{selectedCustomer.name}</span>
                      <span className="text-[10px] font-semibold bg-indigo-100 text-indigo-800 px-1.5 py-0.2 rounded">
                        {selectedCustomer.type}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500">
                      {selectedCustomer.state} {selectedCustomer.mobile && selectedCustomer.mobile !== '-' ? `| Ph: ${selectedCustomer.mobile}` : ''}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomerId('');
                      setCustomerSearchQuery('');
                      setIsCustomerDropdownOpen(true);
                    }}
                    className="text-slate-400 hover:text-rose-600 p-1 rounded-full hover:bg-slate-100 transition-colors shrink-0"
                    title="Change Customer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <div className="relative">
                    <input
                      type="text"
                      className="w-full pl-8 pr-8 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-600 text-xs bg-white text-slate-900 placeholder:text-slate-400"
                      placeholder="Search customer by name, code, phone..."
                      value={customerSearchQuery}
                      onChange={(e) => {
                        setCustomerSearchQuery(e.target.value);
                        setIsCustomerDropdownOpen(true);
                      }}
                      onFocus={() => setIsCustomerDropdownOpen(true)}
                    />
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    {customerSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setCustomerSearchQuery('')}
                        className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {isCustomerDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsCustomerDropdownOpen(false)} />
                      <div className="absolute z-50 left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl divide-y divide-slate-100">
                        {filteredCustomers.length > 0 ? (
                          filteredCustomers.map((c) => (
                            <div
                              key={c.id}
                              onClick={() => handleSelectCustomer(c)}
                              className="p-2 hover:bg-indigo-50 cursor-pointer flex justify-between items-center transition-colors"
                            >
                              <div className="min-w-0 pr-2">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-bold text-slate-800 truncate">{c.name}</span>
                                  <span className="text-[9px] font-medium bg-slate-100 text-slate-600 px-1 py-0.2 rounded border border-slate-200 shrink-0">
                                    {c.type}
                                  </span>
                                </div>
                                <div className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5 truncate">
                                  <span>{c.state}</span>
                                  {c.mobile && c.mobile !== '-' && <span>• Ph: {c.mobile}</span>}
                                  <span>• Terms: {c.creditDays}d</span>
                                </div>
                              </div>
                              <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                            </div>
                          ))
                        ) : (
                          <div className="p-3 text-center text-xs text-slate-500">
                            No customers found matching "{customerSearchQuery}".
                            <button
                              type="button"
                              onClick={() => {
                                setNewCustomerForm(prev => ({ ...prev, name: customerSearchQuery }));
                                setIsCustomerDropdownOpen(false);
                                setIsAddCustomerModalOpen(true);
                              }}
                              className="block mx-auto mt-2 text-indigo-600 font-bold hover:underline"
                            >
                              + Add "{customerSearchQuery}" as New Customer
                            </button>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Invoice Date *</label>
              <input 
                type="date" 
                required 
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-600 text-sm bg-white text-slate-900" 
                value={invoiceDate} 
                onChange={(e) => setInvoiceDate(e.target.value)} 
                max={new Date().toISOString().split("T")[0]}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Seller State *</label>
              <input type="text" readOnly className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-100 text-slate-500 text-sm cursor-not-allowed" value={sellerState} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Buyer State *</label>
              <select 
                disabled={!(activeRole === 'Super Admin' || activeRole === 'Admin')}
                className={`w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-600 text-sm text-slate-900 ${
                  !(activeRole === 'Super Admin' || activeRole === 'Admin') ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-white'
                }`}
                value={buyerState} 
                onChange={(e) => setBuyerState(e.target.value)}
              >
                <option value="Telangana">Telangana</option>
                <option value="Andhra Pradesh">Andhra Pradesh</option>
                <option value="Karnataka">Karnataka</option>
                <option value="Maharashtra">Maharashtra</option>
                <option value="Tamil Nadu">Tamil Nadu</option>
                <option value="Delhi">Delhi</option>
              </select>
            </div>
            {selectedCustomer && (
              <div className="col-span-2 text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-100 p-2 rounded-lg flex justify-between items-center flex-wrap gap-1">
                <span>Customer Location: <strong>{selectedCustomer.state}</strong> | Credit Terms: <strong>15 to 30 Days</strong></span>
                <span className="text-[11px] text-slate-500">{selectedCustomer.type} {selectedCustomer.code ? `(${selectedCustomer.code})` : ''}</span>
              </div>
            )}
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-bold text-slate-800">Product Details</label>
              <button type="button" onClick={addLineItem} className="text-xs font-semibold text-[#163c78] hover:text-[#0c1f3d] flex items-center gap-1">
                <Plus className="w-3 h-3" /> Add Product
              </button>
            </div>
            
            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={item.id} className="p-3 border border-slate-200 rounded-lg bg-white shadow-sm flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-500 uppercase">Item #{index + 1}</span>
                    <button type="button" onClick={() => removeLineItem(item.id)} className="text-rose-500 hover:text-rose-700"><Trash2 className="w-4 h-4" /></button>
                  </div>
                  <div className="grid grid-cols-12 gap-2">
                    <div className="col-span-4">
                      <select required className="w-full px-2 py-1.5 border border-slate-300 rounded focus:ring-2 focus:ring-violet-600 text-xs bg-white text-slate-900" value={item.productId} onChange={(e) => updateLineItem(item.id, 'productId', e.target.value)}>
                        <option value="">Select Medicine</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.code} - {p.name}</option>)}
                      </select>
                    </div>
                    <div className="col-span-5">
                      <select required className="w-full px-2 py-1.5 border border-slate-300 rounded bg-white text-xs text-slate-900" value={item.batchNo} onChange={(e) => updateLineItem(item.id, 'batchNo', e.target.value)}>
                        <option value="">Select Batch</option>
                        {item.productId && (inventory[item.productId] || []).filter(b => b.stock > 0 && !isBatchExpired(b.expiry) && (b.status === 'Active' || b.status === 'Healthy' || !b.status)).map(b => (
                          <option key={b.batchNo} value={b.batchNo}>
                            Batch: {b.batchNo} | Exp: {b.expiry} | Stock: {b.stock} | PTR: {formatCurrency(b.ptr)} | MRP: {formatCurrency(b.mrp || b.ptr * 1.2)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-3">
                      <div className="flex justify-between items-center mb-0.5">
                        <label className="text-[10px] font-bold text-slate-600 uppercase">Qty *</label>
                        {item.productId && (
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                            item.stock > 10 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                              : item.stock > 0 
                                ? 'bg-amber-50 text-amber-700 border-amber-200' 
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}>
                            {item.stock > 0 ? `Stock: ${item.stock}` : 'Out of Stock'}
                          </span>
                        )}
                      </div>
                      <input 
                        type="number" 
                        required 
                        min="1" 
                        max={item.stock || 1000} 
                        className={`w-full px-2 py-1.5 border rounded focus:ring-2 focus:ring-violet-600 text-xs bg-white text-slate-900 font-mono ${
                          item.qty > item.stock && item.stock > 0 ? 'border-rose-400 bg-rose-50' : 'border-slate-300'
                        }`} 
                        value={item.qty || ''} 
                        onChange={(e) => updateLineItem(item.id, 'qty', parseInt(e.target.value) || 0)} 
                        placeholder="Qty" 
                      />
                      {item.qty > item.stock && item.stock > 0 && (
                        <span className="text-[9px] text-rose-600 font-semibold block mt-0.5">
                          Exceeds available stock ({item.stock})
                        </span>
                      )}
                    </div>
                  </div>

                  {item.productId && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Item Discount %</label>
                        <input 
                          type="number" 
                          min="0"
                          max="100"
                          className="w-full px-2 py-1 border border-slate-300 rounded focus:ring-2 focus:ring-violet-600 text-xs bg-white text-slate-900 font-mono" 
                          value={item.discountPercent} 
                          onChange={(e) => updateLineItem(item.id, 'discountPercent', parseFloat(e.target.value) || 0)} 
                          placeholder="Disc %" 
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-0.5">GST Rate %</label>
                        <input 
                          type="number" 
                          min="0"
                          max="100"
                          disabled={!canOverrideGst}
                          className={`w-full px-2 py-1 border border-slate-300 rounded focus:ring-2 focus:ring-violet-600 text-xs text-slate-900 font-mono ${
                            !canOverrideGst ? 'bg-slate-50 opacity-70 cursor-not-allowed' : 'bg-white'
                          }`}
                          value={item.gstPercent} 
                          onChange={(e) => updateLineItem(item.id, 'gstPercent', parseFloat(e.target.value) || 0)} 
                          placeholder="GST %" 
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Extra Margin (₹)</label>
                        <input 
                          type="number" 
                          min="0"
                          step="0.01"
                          className="w-full px-2 py-1 border border-slate-300 rounded focus:ring-2 focus:ring-violet-600 text-xs bg-white text-slate-900 font-mono" 
                          value={item.extraMargin !== undefined && item.extraMargin !== null ? item.extraMargin : ''} 
                          onChange={(e) => updateLineItem(item.id, 'extraMargin', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)} 
                          placeholder="0.00" 
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Free Qty (Auto)</label>
                        <input 
                          type="text"
                          readOnly
                          className="w-full px-2 py-1 border border-slate-300 rounded bg-slate-50 text-slate-500 text-xs cursor-not-allowed font-mono" 
                          value={item.freeQty ? `+${item.freeQty}` : "0"} 
                        />
                      </div>
                    </div>
                  )}

                  {item.productId && (
                    <div className="flex flex-wrap justify-between items-center text-xs text-slate-600 bg-slate-50 p-2 rounded mt-1 border border-slate-100 font-medium gap-1">
                      <span>Rate: {formatCurrency(item.ptr)}</span>
                      <span className="font-semibold text-slate-700">
                        Available: <strong className={item.stock > 10 ? 'text-emerald-700' : item.stock > 0 ? 'text-amber-700' : 'text-rose-700'}>{item.stock} Units</strong>
                      </span>
                      {Number(item.extraMargin) > 0 && (
                        <span className="text-emerald-700 font-semibold">Margin: +{formatCurrency(Number(item.extraMargin))}</span>
                      )}
                      <span>GST: {item.gstPercent}%</span>
                      <span className="font-bold text-violet-700">Total: {formatCurrency(item.total)}</span>
                    </div>
                  )}
                </div>
              ))}
              {items.length === 0 && (
                <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-lg text-slate-500 text-sm">
                  No products added. Click "Add Product" to begin.
                </div>
              )}
            </div>
          </div>

          <div className="bg-slate-900 rounded-xl p-4 text-white space-y-3 shadow-lg">
            <div className="flex justify-between text-sm text-slate-300">
              <span>Taxable Value:</span>
              <span>{formatCurrency(subTotal)}</span>
            </div>
            {isSameState ? (
              <>
                <div className="flex justify-between text-sm text-slate-400">
                  <span>CGST:</span>
                  <span>{formatCurrency(cgstTotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-400 border-b border-slate-700 pb-3">
                  <span>SGST:</span>
                  <span>{formatCurrency(sgstTotal)}</span>
                </div>
              </>
            ) : (
              <div className="flex justify-between text-sm text-slate-400 border-b border-slate-700 pb-3">
                <span>IGST:</span>
                <span>{formatCurrency(igstTotal)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold text-emerald-400">
              <span>Grand Total:</span>
              <span>{formatCurrency(grandTotal)}</span>
            </div>
            
            <div className="grid grid-cols-2 gap-3 pt-3">
              <select className="bg-slate-800 border-slate-700 rounded text-sm text-white focus:ring-violet-500" value={paymentMode} onChange={(e) => handlePaymentModeChange(e.target.value)}>
                <option value="Credit">Credit Billing</option>
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Bank">Bank Transfer</option>
              </select>
              <select className="bg-slate-800 border-slate-700 rounded text-sm text-white focus:ring-violet-500" value={status} onChange={(e) => setStatus(e.target.value as any)}>
                <option value="Unpaid">Unpaid</option>
                <option value="Paid">Paid</option>
                <option value="Draft">Save as Draft</option>
              </select>
            </div>
          </div>

          <div className="pt-2 flex gap-3">
            <button type="submit" className="flex-1 bg-[#163c78] text-white px-4 py-3 rounded-xl font-bold hover:bg-[#112d59] transition-colors shadow-sm">
              {editingInvoiceId ? 'Update GST Invoice' : 'Generate GST Invoice'}
            </button>
            <button type="button" onClick={() => { setIsDrawerOpen(false); setEditingInvoiceId(null); }} className="flex-1 bg-white border border-slate-300 text-slate-700 px-4 py-3 rounded-xl font-bold hover:bg-slate-50 transition-colors">
              Cancel
            </button>
          </div>
        </form>
      </Drawer>

      {/* Quick Add Customer Modal */}
      {isAddCustomerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-slate-900 text-white px-5 py-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-base">Quick Add New Customer</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddCustomerModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuickCustomer} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Party / Customer Name *
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                  placeholder="e.g. Sri Balaji Medicals & General Stores"
                  value={newCustomerForm.name}
                  onChange={(e) => setNewCustomerForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Customer Type *
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 bg-white focus:ring-2 focus:ring-indigo-600"
                    value={newCustomerForm.type}
                    onChange={(e) => setNewCustomerForm(prev => ({ ...prev, type: e.target.value }))}
                  >
                    <option value="Retailer">Retailer / Chemist</option>
                    <option value="Distributor">Distributor / Stockist</option>
                    <option value="Hospital Chain">Hospital / Clinic</option>
                    <option value="Institutional">Institutional</option>
                    <option value="Counter">Counter / Cash</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    State (Tax Location) *
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 bg-white focus:ring-2 focus:ring-indigo-600"
                    value={newCustomerForm.state}
                    onChange={(e) => setNewCustomerForm(prev => ({ ...prev, state: e.target.value }))}
                  >
                    {INDIAN_STATES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Mobile Number *
                  </label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-indigo-600 font-mono"
                    placeholder="10-digit number"
                    value={newCustomerForm.mobile}
                    onChange={(e) => setNewCustomerForm(prev => ({ ...prev, mobile: e.target.value.replace(/\D/g, '') }))}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Credit Terms (Days)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="180"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-indigo-600 font-mono"
                    placeholder="30"
                    value={newCustomerForm.creditDays}
                    onChange={(e) => setNewCustomerForm(prev => ({ ...prev, creditDays: parseInt(e.target.value) || 0 }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Drug License (DL No)
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-indigo-600 uppercase"
                    placeholder="e.g. 20B/TG/12345"
                    value={newCustomerForm.drugLicenseNumber}
                    onChange={(e) => setNewCustomerForm(prev => ({ ...prev, drugLicenseNumber: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    GSTIN / PAN
                  </label>
                  <input
                    type="text"
                    maxLength={15}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-indigo-600 uppercase font-mono"
                    placeholder="15-digit GSTIN"
                    value={newCustomerForm.gstNumber}
                    onChange={(e) => setNewCustomerForm(prev => ({ ...prev, gstNumber: e.target.value.toUpperCase() }))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Shop Address / Location
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-indigo-600"
                  placeholder="Area, Street, City"
                  value={newCustomerForm.address}
                  onChange={(e) => setNewCustomerForm(prev => ({ ...prev, address: e.target.value }))}
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="submit"
                  disabled={isSavingCustomer}
                  className="flex-1 bg-[#163c78] text-white px-4 py-2.5 rounded-xl font-bold hover:bg-[#112d59] transition-colors shadow-sm disabled:opacity-50"
                >
                  {isSavingCustomer ? 'Saving...' : 'Save & Select Customer'}
                </button>
                <button
                  type="button"
                  disabled={isSavingCustomer}
                  onClick={() => setIsAddCustomerModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl font-semibold border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}