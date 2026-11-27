// Refactored Barcode Checkout Module
import { useState, useMemo, useEffect, useRef } from 'react';
import { ScanBarcode, Plus, Trash2, Printer, StopCircle, UserCircle, CreditCard, ListRestart, CheckCircle, Download, FileText, Barcode } from 'lucide-react';
import { PageHeader, ActionButton, Drawer } from './components/shared';
import { jsPDF } from 'jspdf';
import { applyInvoiceTemplate } from '../../documents/templates/InvoiceTemplate';
import { productService } from '../../services/productService';
import { barcodeService } from '../../services/barcodeService';
import { inventoryService } from '../../services/inventoryService';
import { batchService } from '../../services/batchService';
import { schemeService } from '../../services/schemeService';
import { billingService } from '../../services/billingService';
import activityLogService from '../../services/activityLogService';
import authService from '../../services/authService';
import { NotificationService } from '../../services/notificationService';
import { hasModulePermission } from '../../utils/permissionUtils';

interface CartItem {
  id: string;
  productId: string;
  productCode: string;
  barcode: string;
  name: string;
  batch: string;
  expiry: string;
  qty: number;
  freeQty: number;
  rate: number;
  extraMargin?: number;
  discountPct: number;
  gstPct: number;
  warehouseId: string;
}

interface HeldBill {
  id: string;
  timestamp: string;
  customerName: string;
  customerType: string;
  mobileNumber: string;
  gstin: string;
  salesType: string;
  paymentMode: string;
  amountReceived: string;
  referenceNumber: string;
  cart: CartItem[];
  itemCount: number;
  billAmount: number;
  bodyAmount?: number;
}

// --- DYNAMIC CRM INTEGRATION ---
const crmDistributors = JSON.parse(localStorage.getItem('crm_distributors') || '[]');
const CUSTOMERS = crmDistributors.map((d: any) => ({ 
  id: d.id, 
  name: d.name, 
  type: d.tier || 'Distributor',
  state: d.state || (d.region === 'South' ? 'Karnataka' : 'Telangana'),
  creditDays: d.creditDays || 30,
  mobile: d.phone || d.mobile || '',
  gstin: d.gstin || ''
}));

const formatCurrency = (amount: number) => `₹ ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function BarcodeBilling() {
  const activeRole = localStorage.getItem("activeRole") || "";
  const canView = hasModulePermission(activeRole, "Wholesale Billing System", "View") || 
                  hasModulePermission(activeRole, "Wholesale Billing", "View") ||
                  hasModulePermission(activeRole, "Billing & Invoicing", "View");
  const canCreate = hasModulePermission(activeRole, "Wholesale Billing System", "Create") || 
                    hasModulePermission(activeRole, "Wholesale Billing", "Create") ||
                    hasModulePermission(activeRole, "Billing & Invoicing", "Create");

  const [barcodeInput, setBarcodeInput] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // Database Catalogs
  const [productsList, setProductsList] = useState<any[]>([]);
  const [batchesList, setBatchesList] = useState<any[]>([]);
  const [barcodesList, setBarcodesList] = useState<any[]>([]);

  // Autocomplete Suggestions State
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // CRM Integration State
  const [selectedCustomerId, setSelectedCustomerId] = useState('');

  // Customer Info (Mandatory)
  const [customerName, setCustomerName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [customerErrors, setCustomerErrors] = useState<{ name?: string; mobile?: string }>({});
  const [customerType, setCustomerType] = useState('Retail Customer');
  const [gstin, setGstin] = useState('');
  const [salesType, setSalesType] = useState('Cash');

  // Payment Info
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [amountReceived, setAmountReceived] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [schemesState, setSchemesState] = useState<any[]>([]);

  // Generated Invoice Feedback
  const [lastGeneratedInvoice, setLastGeneratedInvoice] = useState<{
    invoiceNo: string;
    date: string;
    customerName: string;
    mobileNumber: string;
    grandTotal: number;
    itemsCount: number;
  } | null>(null);

  // Held Bills State
  const [heldBills, setHeldBills] = useState<HeldBill[]>([]);
  const [showHeldBills, setShowHeldBills] = useState(false);

  // Print Preview State
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [isTemporaryPrint, setIsTemporaryPrint] = useState(false);
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string>('');

  // Organization Settings (Seller State)
  const companySettings = JSON.parse(localStorage.getItem('company_settings') || '{}');
  const sellerState = companySettings.state || 'Telangana';

  // Load catalogs on mount
  useEffect(() => {
    const loadCatalog = async () => {
      try {
        const [prods, bts, bcs] = await Promise.all([
          productService.loadProducts().catch(() => productService.getProducts()),
          batchService.loadBatches().catch(() => batchService.getAll()),
          barcodeService.loadBarcodes().catch(() => barcodeService.getAll())
        ]);
        setProductsList(prods || []);
        setBatchesList(bts || []);
        setBarcodesList(bcs || []);
      } catch (e) {
        console.error("Failed to load catalog for Barcode Billing:", e);
      }
    };
    loadCatalog();
  }, []);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load persistent held bills
  useEffect(() => {
    const savedHeld = localStorage.getItem('pos_held_bills');
    if (savedHeld) {
      try {
        setHeldBills(JSON.parse(savedHeld));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  useEffect(() => {
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

  // Save held bills persistently
  useEffect(() => {
    localStorage.setItem('pos_held_bills', JSON.stringify(heldBills));
  }, [heldBills]);

  // Cart Calculations (Including Extra Margin per unit)
  const calculations = useMemo(() => {
    let subtotal = 0;
    let totalDiscount = 0;
    let totalTaxable = 0;
    let totalGstAmount = 0;

    cart.forEach(item => {
      const itemQty = Number(item.qty) || 0;
      const itemRate = Number(item.rate) || 0;
      const itemMargin = Number(item.extraMargin) || 0;
      const itemDisc = Number(item.discountPct) || 0;
      const itemGst = Number(item.gstPct) || 0;

      const baseGross = itemQty * itemRate;
      const discount = baseGross * (itemDisc / 100);
      const marginTotal = itemQty * itemMargin;
      const taxable = Math.max(0, baseGross - discount + marginTotal);
      const gst = taxable * (itemGst / 100);
      
      subtotal += (baseGross + marginTotal);
      totalDiscount += discount;
      totalTaxable += taxable;
      totalGstAmount += gst;
    });

    const cgst = totalGstAmount / 2;
    const sgst = totalGstAmount / 2;
    const igst = 0; 
    
    const rawTotal = totalTaxable + totalGstAmount;
    const roundOff = Math.round(rawTotal) - rawTotal;
    const netAmount = Math.round(rawTotal);
    
    const received = parseFloat(amountReceived) || 0;
    const balance = received > 0 ? received - netAmount : 0;

    return {
      subtotal, totalDiscount, totalTaxable, cgst, sgst, igst, roundOff, netAmount, balance
    };
  }, [cart, amountReceived]);

  const handleCrmCustomerChange = (id: string) => {
    setSelectedCustomerId(id);
    const customer = CUSTOMERS.find((c: any) => c.id === id);
    if (customer) {
      setCustomerName(customer.name);
      setCustomerType(customer.type);
      setMobileNumber(customer.mobile);
      setGstin(customer.gstin);
      setSalesType(customer.creditDays > 0 ? 'Credit' : 'Cash');
    } else {
      setCustomerName('');
      setCustomerType('Retail Customer');
      setMobileNumber('');
      setGstin('');
      setSalesType('Cash');
    }
  };

  const getProductBatches = (productCode: string, productName?: string, productId?: string) => {
    const batches = batchService.getAll();
    const inventory = inventoryService.getAll();
    
    // Filter batches matching product code, id, or name with available stock
    const matchingBatches = batches.filter(b => {
      const isMatch = (b.productCode && b.productCode.toLowerCase() === productCode.toLowerCase()) ||
                      (productId && String(b.productId) === String(productId)) ||
                      (productName && b.productName && b.productName.toLowerCase() === productName.toLowerCase());
      const hasStock = Number(b.availableQty) > 0;
      return isMatch && hasStock;
    });

    let finalBatches = matchingBatches.map(b => ({
      batchNo: b.batchNo,
      availableQty: Number(b.availableQty),
      ptr: Number(b.ptr) || 0,
      mrp: Number(b.mrp) || Number(b.ptr) * 1.2,
      expDate: b.expDate || '12/2028',
      status: b.status || 'Active',
      warehouseId: 'WH-001',
      warehouseName: 'Main Warehouse'
    }));

    if (finalBatches.length === 0) {
      const invMatches = inventory.filter(inv => 
        (inv.productCode && inv.productCode.toLowerCase() === productCode.toLowerCase()) && 
        inv.availableQty > 0
      );
      finalBatches = invMatches.map(inv => {
        const batchDetail = batches.find(b => b.batchNo === inv.batchNo);
        return {
          batchNo: inv.batchNo,
          availableQty: inv.availableQty,
          ptr: inv.ptr || (batchDetail ? Number(batchDetail.ptr) : 0),
          mrp: batchDetail ? Number(batchDetail.mrp) : (inv.ptr ? inv.ptr * 1.2 : 0),
          expDate: batchDetail ? batchDetail.expDate : '12/2028',
          status: batchDetail ? batchDetail.status : 'Active',
          warehouseId: inv.warehouseId || 'WH-001',
          warehouseName: inv.warehouseName || 'Main Warehouse'
        };
      });
    }

    return finalBatches.filter(b => {
      // Exclude Quarantined, Damaged, Blocked, or Expired batches
      if (b.status === 'Quarantine' || b.status === 'Damaged' || b.status === 'Blocked' || b.status === 'Expired') {
        return false;
      }
      if (!b.expDate) return true;
      const parts = b.expDate.split('/');
      if (parts.length === 2) {
        const [month, year] = parts;
        const exp = new Date(Number(year), Number(month), 0);
        return exp >= new Date();
      }
      const expDate = new Date(b.expDate);
      return isNaN(expDate.getTime()) || expDate >= new Date();
    }).sort((a, b) => {
      const parseExpiry = (expiryStr: string) => {
        if (!expiryStr) return new Date(9999, 11, 31);
        const parts = expiryStr.split('/');
        if (parts.length === 2) {
          return new Date(Number(parts[1]), Number(parts[0]) - 1, 1);
        }
        return new Date(expiryStr);
      };
      return parseExpiry(a.expDate).getTime() - parseExpiry(b.expDate).getTime();
    });
  };

  // --- DYNAMIC SCHEME INTEGRATION ---
  const applyEligibleScheme = (productCode: string, qty: number, ptr: number) => {
    const productsList = productService.getProducts();
    const product = productsList.find(p => p.code === productCode);
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
      if (s.applicableTo === 'Brand' && s.applicableSelection === (product.brandName || product.manufacturer)) return true;
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

  const buildInvoicePayload = () => {
    const invoiceNo = lastGeneratedInvoice ? lastGeneratedInvoice.invoiceNo : billingService.getNextInvoiceNo();
    const isSameState = sellerState === 'Telangana'; // Simplified state matching
    
    return {
      id: Date.now().toString(),
      invoiceNo,
      customerId: selectedCustomerId || 'WALK-IN',
      customerName: customerName.trim() || 'Retail Customer',
      mobileNumber: mobileNumber.trim() || '',
      customerMobile: mobileNumber.trim() || '',
      gstin: gstin.trim() || '',
      date: new Date().toISOString().split('T')[0],
      dueDate: salesType === 'Credit' ? new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      status: salesType === 'Credit' ? 'Unpaid' : 'Paid',
      items: cart.map(c => {
        const baseGross = (c.qty || 0) * (c.rate || 0);
        const discount = (baseGross * (c.discountPct || 0)) / 100;
        const marginTotal = (c.qty || 0) * (Number(c.extraMargin) || 0);
        const taxable = Math.max(0, baseGross - discount + marginTotal);
        const gst = (taxable * (c.gstPct || 0)) / 100;
        const lineTotal = taxable + gst;

        return {
          id: c.id,
          productId: c.productId,
          productCode: c.productCode,
          productName: c.name,
          batchNo: c.batch,
          qty: c.qty,
          freeQty: c.freeQty || 0,
          ptr: c.rate,
          extraMargin: Number(c.extraMargin) || 0,
          discountPercent: c.discountPct,
          gstPercent: c.gstPct,
          total: Number(lineTotal.toFixed(2)),
          stock: c.qty
        };
      }),
      subTotal: calculations.totalTaxable,
      cgstTotal: isSameState ? calculations.cgst : 0,
      sgstTotal: isSameState ? calculations.sgst : 0,
      igstTotal: isSameState ? 0 : calculations.cgst + calculations.sgst,
      grandTotal: calculations.netAmount,
      paymentMode: paymentMode,
    };
  };

  const resetForm = () => {
    setCart([]);
    setSelectedCustomerId('');
    setCustomerName('');
    setMobileNumber('');
    setCustomerType('Retail Customer');
    setGstin('');
    setSalesType('Cash');
    setPaymentMode('Cash');
    setAmountReceived('');
    setReferenceNumber('');
    setLastGeneratedInvoice(null);
    setCustomerErrors({});
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleInputChange = (val: string) => {
    const query = val.trim().toLowerCase();
    if (!query) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const matches: any[] = [];
    const seenKeys = new Set<string>();

    const prods = productsList.length > 0 ? productsList : productService.getProducts();
    const bts = batchesList.length > 0 ? batchesList : batchService.getAll();
    const bcs = barcodesList.length > 0 ? barcodesList : barcodeService.getAll();

    // 1. Match products by name, code, barcode
    prods.forEach(p => {
      const codeMatch = p.code && p.code.toLowerCase().includes(query);
      const nameMatch = p.name && p.name.toLowerCase().includes(query);
      const barcodeMatch = p.barcode && p.barcode.toLowerCase().includes(query);

      if (codeMatch || nameMatch || barcodeMatch) {
        const pBatches = getProductBatches(p.code, p.name, p.id);
        const bestBatch = pBatches[0];
        const key = `${p.id}-${p.code}`;
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          matches.push({
            type: 'product',
            product: p,
            batch: bestBatch,
            name: p.name,
            code: p.code,
            barcode: p.barcode || (bestBatch ? bestBatch.barcode : '') || '',
            ptr: bestBatch ? bestBatch.ptr : (parseFloat(p.ptr) || 0),
            mrp: bestBatch ? bestBatch.mrp : (parseFloat(p.mrp) || 0),
            availableQty: bestBatch ? bestBatch.availableQty : 0,
            expDate: bestBatch ? bestBatch.expDate : ''
          });
        }
      }
    });

    // 2. Match barcodes catalog
    bcs.forEach(b => {
      if (b.status === 'Active' && b.barcode && b.barcode.toLowerCase().includes(query)) {
        const p = prods.find(prod => prod.code === b.productCode || prod.id === b.productCode);
        const key = `BC-${b.barcode}`;
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          const pBatches = p ? getProductBatches(p.code, p.name, p.id) : [];
          const bestBatch = pBatches[0];
          matches.push({
            type: 'barcode',
            product: p || { id: b.id, code: b.productCode, name: b.productName, barcode: b.barcode, gst: '12' },
            batch: bestBatch,
            name: b.productName || (p ? p.name : 'Product'),
            code: b.productCode,
            barcode: b.barcode,
            ptr: bestBatch ? bestBatch.ptr : (p ? parseFloat(p.ptr) || 0 : 0),
            mrp: bestBatch ? bestBatch.mrp : (p ? parseFloat(p.mrp) || 0 : 0),
            availableQty: bestBatch ? bestBatch.availableQty : 0,
            expDate: bestBatch ? bestBatch.expDate : ''
          });
        }
      }
    });

    // 3. Match batches
    bts.forEach(bt => {
      const bMatch = bt.batchNo && bt.batchNo.toLowerCase().includes(query);
      const bProdMatch = bt.productName && bt.productName.toLowerCase().includes(query);
      const bBarcodeMatch = bt.barcode && bt.barcode.toLowerCase().includes(query);
      if (bMatch || bProdMatch || bBarcodeMatch) {
        const key = `BT-${bt.productCode || bt.productId}-${bt.batchNo}`;
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          const p = prods.find(prod => prod.code === bt.productCode || prod.id === bt.productId);
          matches.push({
            type: 'batch',
            product: p || { id: bt.productId, code: bt.productCode, name: bt.productName, barcode: bt.barcode, gst: '12' },
            batch: bt,
            name: bt.productName || (p ? p.name : 'Product'),
            code: bt.productCode,
            barcode: bt.barcode || (p ? p.barcode : '') || '',
            ptr: Number(bt.ptr) || 0,
            mrp: Number(bt.mrp) || 0,
            availableQty: Number(bt.availableQty) || 0,
            expDate: bt.expDate || ''
          });
        }
      }
    });

    setSuggestions(matches.slice(0, 10));
    setShowSuggestions(matches.length > 0);
    setSelectedIndex(-1);
  };

  const handleSelectSuggestion = (sug: any) => {
    const product = sug.product;
    const availableBatches = getProductBatches(sug.code || product.code, sug.name || product.name, product.id);
    const chosenBatch = sug.batch || availableBatches[0];

    if (!chosenBatch) {
      alert(`Product ${sug.name} is completely out of stock, expired, or locked!`);
      return;
    }

    const existing = cart.find(item => item.productCode === (product.code || sug.code) && item.batch === chosenBatch.batchNo);
    if (existing) {
      if (existing.qty + 1 > chosenBatch.availableQty) {
        alert(`Insufficient stock! Only ${chosenBatch.availableQty} units available in batch ${chosenBatch.batchNo}.`);
        return;
      }
      const newQty = existing.qty + 1;
      const promo = applyEligibleScheme(product.code || sug.code, newQty, existing.rate);
      setCart(cart.map(item => item.id === existing.id 
        ? { ...item, qty: newQty, discountPct: promo.discountPercent, freeQty: promo.freeQty } 
        : item
      ));
    } else {
      const rate = chosenBatch.ptr || parseFloat(product.ptr) || 0;
      const promo = applyEligibleScheme(product.code || sug.code, 1, rate);
      setCart([...cart, {
        id: Math.random().toString(),
        productId: product.id || String(sug.code),
        productCode: product.code || sug.code,
        barcode: sug.barcode || product.barcode || '',
        name: sug.name || product.name,
        batch: chosenBatch.batchNo,
        expiry: chosenBatch.expDate,
        qty: 1,
        freeQty: promo.freeQty,
        rate: rate,
        extraMargin: 0,
        discountPct: promo.discountPercent,
        gstPct: parseFloat(product.gst) || 12,
        warehouseId: chosenBatch.warehouseId || 'WH-001'
      }]);
    }

    setBarcodeInput('');
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleAddProduct = () => {
    if (!barcodeInput.trim()) return;
    const query = barcodeInput.toLowerCase().trim();
    
    const barcodes = barcodesList.length > 0 ? barcodesList : barcodeService.getAll();
    const matchedBarcode = barcodes.find((b:any) => b.barcode.toLowerCase() === query && b.status === 'Active');
    
    let resolvedProductCode = '';
    let barcodeString = '';
    let resolvedProduct: any = null;
    
    if (matchedBarcode) {
      resolvedProductCode = matchedBarcode.productCode;
      barcodeString = matchedBarcode.barcode;
    } else {
      const prods = productsList.length > 0 ? productsList : productService.getProducts();
      resolvedProduct = prods.find((p: any) => 
        p.code.toLowerCase() === query || 
        p.name.toLowerCase().includes(query) ||
        (p.barcode && p.barcode.toLowerCase() === query)
      );
      if (resolvedProduct) {
        resolvedProductCode = resolvedProduct.code;
        barcodeString = resolvedProduct.barcode || '';
      } else {
        // Direct Batch Lookup
        const allBatches = batchesList.length > 0 ? batchesList : batchService.getAll();
        const matchedBatch = allBatches.find(b => 
          (b.productName && b.productName.toLowerCase().includes(query)) ||
          (b.productCode && b.productCode.toLowerCase() === query) ||
          (b.barcode && b.barcode.toLowerCase() === query) ||
          (b.batchNo && b.batchNo.toLowerCase() === query)
        );
        if (matchedBatch) {
          resolvedProductCode = matchedBatch.productCode || matchedBatch.productId;
          barcodeString = matchedBatch.barcode || '';
          resolvedProduct = {
            id: matchedBatch.productId || `prd-${matchedBatch.productCode}`,
            code: matchedBatch.productCode || matchedBatch.productId,
            name: matchedBatch.productName || query,
            ptr: matchedBatch.ptr,
            mrp: matchedBatch.mrp,
            gst: 12,
            status: 'Active'
          };
        }
      }
    }
    
    if (!resolvedProductCode && !resolvedProduct) {
      alert('Product not found! Please check barcode or name.');
      return;
    }

    const prods = productsList.length > 0 ? productsList : productService.getProducts();
    const product = resolvedProduct || prods.find((p: any) => p.code === resolvedProductCode);
    if (!product) {
      alert('Product does not exist in catalog.');
      return;
    }

    const availableBatches = getProductBatches(resolvedProductCode || product.code, product.name, product.id);
    if (availableBatches.length === 0) {
      alert('Product is completely out of stock, expired, or quarantine locked!');
      return;
    }

    // FEFO: Select first available batch
    const chosenBatch = availableBatches[0];
    const existing = cart.find(item => item.productCode === (product.code || resolvedProductCode) && item.batch === chosenBatch.batchNo);
    
    if (existing) {
      if (existing.qty + 1 > chosenBatch.availableQty) {
        alert(`Insufficient stock! Only ${chosenBatch.availableQty} units available in batch ${chosenBatch.batchNo}.`);
        return;
      }
      const newQty = existing.qty + 1;
      const promo = applyEligibleScheme(product.code, newQty, existing.rate);
      setCart(cart.map(item => item.id === existing.id 
        ? { ...item, qty: newQty, discountPct: promo.discountPercent, freeQty: promo.freeQty } 
        : item
      ));
    } else {
      const rate = chosenBatch.ptr || parseFloat(product.ptr) || 0;
      const promo = applyEligibleScheme(product.code, 1, rate);
      setCart([...cart, {
        id: Math.random().toString(),
        productId: product.id,
        productCode: product.code || resolvedProductCode,
        barcode: barcodeString || product.barcode || '',
        name: product.name,
        batch: chosenBatch.batchNo,
        expiry: chosenBatch.expDate,
        qty: 1,
        freeQty: promo.freeQty,
        rate: rate,
        extraMargin: 0,
        discountPct: promo.discountPercent,
        gstPct: parseFloat(product.gst) || 12,
        warehouseId: chosenBatch.warehouseId
      }]);
    }
    setBarcodeInput('');
    setShowSuggestions(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : 0));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : suggestions.length - 1));
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleSelectSuggestion(suggestions[selectedIndex]);
          return;
        } else if (suggestions.length > 0) {
          handleSelectSuggestion(suggestions[0]);
          return;
        }
      }
      if (e.key === 'Escape') {
        setShowSuggestions(false);
        return;
      }
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddProduct();
    }
  };

  const updateCartItem = (id: string, field: keyof CartItem, value: any) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        let val = typeof value === 'number' ? Math.max(0, value) : value;
        if (field === 'qty') {
          val = typeof value === 'number' ? Math.max(0, value) : (value === '' ? 0 : Math.max(0, parseInt(value, 10) || 0));
          const availableBatches = getProductBatches(item.productCode);
          const currentBatch = availableBatches.find(b => b.batchNo === item.batch);
          if (currentBatch && val > currentBatch.availableQty) {
            alert(`Insufficient stock! Only ${currentBatch.availableQty} units available.`);
            val = currentBatch.availableQty;
          }
        }
        
        const updatedItem = { ...item, [field]: val };
        
        if (field === 'qty') {
          const promo = applyEligibleScheme(updatedItem.productCode, val, updatedItem.rate);
          updatedItem.discountPct = promo.discountPercent;
          updatedItem.freeQty = promo.freeQty;
        }

        return updatedItem;
      }
      return item;
    }));
  };

  const removeCartItem = (id: string) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const handleClearCart = () => {
    if (window.confirm('Are you sure you want to clear the cart?')) {
      resetForm();
    }
  };

  const handleGenerateInvoice = () => {
    if (!canCreate) {
      alert("You do not have permission to create invoices.");
      return;
    }
    if (cart.length === 0) return alert('Cart is empty. Please add at least one product.');

    // Validate that all items have a valid quantity > 0
    const zeroQtyItem = cart.find(item => (Number(item.qty) || 0) <= 0);
    if (zeroQtyItem) {
      alert(`Please enter a valid quantity greater than 0 for "${zeroQtyItem.name}".`);
      return;
    }

    // 1. Mandatory Customer Validation (Customer Name & 10-digit Mobile Number)
    const trimmedName = customerName.trim();
    const trimmedMobile = mobileNumber.trim();

    const errors: { name?: string; mobile?: string } = {};
    if (!trimmedName) {
      errors.name = "Customer Name is mandatory.";
    }
    if (!trimmedMobile) {
      errors.mobile = "Mobile Number is mandatory.";
    } else if (trimmedMobile.length < 10) {
      errors.mobile = "Mobile Number must be a valid 10-digit number.";
    }

    if (Object.keys(errors).length > 0) {
      setCustomerErrors(errors);
      alert(`⚠️ Mandatory Customer Details Required:\n${errors.name ? '• ' + errors.name + '\n' : ''}${errors.mobile ? '• ' + errors.mobile : ''}`);
      return;
    }
    setCustomerErrors({});

    // 2. Validate Credit Sales Info
    if (salesType === 'Credit') {
      if (customerType !== 'Retail Customer' && customerType !== 'Cash Sale' && !gstin.trim()) {
        alert('GSTIN is required for Credit sales to commercial accounts.');
        return;
      }
    }

    // 3. Validate Received Amount for Cash/Card/UPI
    const netPayable = calculations.netAmount;
    const received = parseFloat(amountReceived) || 0;
    if (salesType !== 'Credit' && amountReceived && received < netPayable) {
      alert(`Amount Received (${formatCurrency(received)}) is less than Net Payable (${formatCurrency(netPayable)}).`);
      return;
    }
    
    const invoicePayload = buildInvoicePayload();
    
    // Deduct Stock in inventoryRecords (Deduct qty + freeQty)
    const currentInventory = inventoryService.getAll();
    cart.forEach(item => {
      const match = currentInventory.find(inv => inv.productCode === item.productCode && inv.batchNo === item.batch && inv.warehouseId === item.warehouseId);
      if (match) {
        match.availableQty = Math.max(0, match.availableQty - (item.qty + (item.freeQty || 0)));
      }
    });
    inventoryService.saveAll(currentInventory);

    // Deduct stock in central Batch Master (Deduct qty + freeQty)
    const savedBatches = batchService.getAll();
    const updatedBatches = savedBatches.map(b => {
      const matchItem = cart.find(item => item.batch === b.batchNo && item.productCode === b.productCode);
      if (matchItem) {
        return {
          ...b,
          availableQty: Math.max(0, b.availableQty - (matchItem.qty + (matchItem.freeQty || 0)))
        };
      }
      return b;
    });
    batchService.saveAll(updatedBatches);

    // Save to Invoice Registry via billingService
    billingService.saveInvoice(invoicePayload as any);
    billingService.incrementCounter();

    // Save to Party Ledger via billingService
    billingService.saveLedger({
      id: `LED-${Date.now()}`,
      date: invoicePayload.date,
      partyName: invoicePayload.customerName,
      particulars: `POS Invoice - ${invoicePayload.invoiceNo}`,
      debit: invoicePayload.grandTotal,
      credit: salesType !== 'Credit' ? invoicePayload.grandTotal : 0,
      balance: salesType === 'Credit' ? invoicePayload.grandTotal : 0
    });

    // Save Outstandings if Credit via billingService
    if (salesType === 'Credit') {
      billingService.saveOutstanding({
        id: `OUT-${Date.now()}`,
        invoiceNo: invoicePayload.invoiceNo,
        customerName: invoicePayload.customerName,
        invoiceDate: invoicePayload.date,
        dueDate: invoicePayload.dueDate,
        amount: invoicePayload.grandTotal,
        status: 'Pending'
      });
    }

    // Append to Sales Register & Activity logs
    billingService.saveSalesRegister(invoicePayload as any);

    const currentUser = authService.getCurrentUser();
    activityLogService.addLog({
      userId: currentUser?.id,
      userName: currentUser?.fullName,
      action: `POS Invoice Generated - ${invoicePayload.invoiceNo}`,
      module: "Wholesale Billing",
    });

    // Write to Notification Center via NotificationService
    NotificationService.addNotification({
      title: 'POS Invoice Created',
      message: `POS Invoice ${invoicePayload.invoiceNo} generated for ${invoicePayload.customerName} (₹${invoicePayload.grandTotal}). Stock levels and ledgers synchronized.`,
      type: 'system',
      priority: 'info',
      module: 'Wholesale Billing'
    });

    // Set generated invoice status and preserve details on screen
    setLastGeneratedInvoice({
      invoiceNo: invoicePayload.invoiceNo,
      date: invoicePayload.date,
      customerName: invoicePayload.customerName,
      mobileNumber: trimmedMobile,
      grandTotal: invoicePayload.grandTotal,
      itemsCount: cart.length
    });

    alert(`✅ POS Invoice ${invoicePayload.invoiceNo} Saved & Synchronized Successfully!`);
  };

  const handleDownloadPdf = () => {
    if (cart.length === 0) return alert('Cart is empty.');
    const zeroQtyItem = cart.find(item => (Number(item.qty) || 0) <= 0);
    if (zeroQtyItem) {
      alert(`Please enter a valid quantity greater than 0 for "${zeroQtyItem.name}".`);
      return;
    }
    const doc = new jsPDF();
    const invoice = buildInvoicePayload();
    applyInvoiceTemplate(doc, invoice as any, 'Retailer');
    doc.save(`${invoice.invoiceNo || 'POS-Invoice'}.pdf`);
  };

  // --- Print Bill Handling ---
  const handlePrintPreview = (temporary: boolean) => {
    if (cart.length === 0) return alert('Cart is empty.');
    const zeroQtyItem = cart.find(item => (Number(item.qty) || 0) <= 0);
    if (zeroQtyItem) {
      alert(`Please enter a valid quantity greater than 0 for "${zeroQtyItem.name}".`);
      return;
    }
    setIsTemporaryPrint(temporary);
    
    const doc = new jsPDF();
    const invoice = buildInvoicePayload();
    if (temporary) {
      invoice.invoiceNo = 'TEMPORARY BILL - NOT SAVED';
    }
    applyInvoiceTemplate(doc, invoice as any, 'Retailer');
    const blobUrl = doc.output('bloburl') as any as string;
    setPreviewPdfUrl(blobUrl);

    // Audit logs for print actions
    const currentUser = authService.getCurrentUser();
    activityLogService.addLog({
      userId: currentUser?.id,
      userName: currentUser?.fullName,
      action: temporary 
        ? `Temporary POS Invoice Printed (Not Saved)` 
        : `POS Invoice Printed - ${invoice.invoiceNo}`,
      module: "Wholesale Billing",
    });
    
    setShowPrintPreview(true);
  };

  const executeBrowserPrint = () => {
    const doc = new jsPDF();
    const invoice = buildInvoicePayload();
    if (isTemporaryPrint) {
      invoice.invoiceNo = 'TEMPORARY BILL - NOT SAVED';
    }
    applyInvoiceTemplate(doc, invoice as any, 'Retailer');
    doc.autoPrint();
    window.open(doc.output('bloburl') as any as string, '_blank');
  };

  // --- Hold Bill Handling ---
  const handleHoldBill = () => {
    if (cart.length === 0) return alert('Cart is empty. Nothing to hold.');
    
    const newHold: HeldBill = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
      customerName,
      customerType,
      mobileNumber,
      gstin,
      salesType,
      paymentMode,
      amountReceived,
      referenceNumber,
      cart: [...cart],
      itemCount: cart.reduce((acc, curr) => acc + curr.qty, 0),
      billAmount: calculations.netAmount
    };

    setHeldBills([...heldBills, newHold]);

    // Audit Log hold action
    const currentUser = authService.getCurrentUser();
    activityLogService.addLog({
      userId: currentUser?.id,
      userName: currentUser?.fullName,
      action: `Held POS Bill (Draft ID: ${newHold.id}) for ${newHold.customerName || 'Walk-in'}`,
      module: "Wholesale Billing",
    });

    resetForm();
  };

  const handleResumeBill = (heldBill: HeldBill) => {
    setCustomerName(heldBill.customerName);
    setCustomerType(heldBill.customerType);
    setMobileNumber(heldBill.mobileNumber);
    setGstin(heldBill.gstin);
    setSalesType(heldBill.salesType);
    setPaymentMode(heldBill.paymentMode);
    setAmountReceived(heldBill.amountReceived);
    setReferenceNumber(heldBill.referenceNumber);
    setCart(heldBill.cart);
    
    setHeldBills(heldBills.filter(b => b.id !== heldBill.id));
    setShowHeldBills(false);

    // Audit Log resume action
    const currentUser = authService.getCurrentUser();
    activityLogService.addLog({
      userId: currentUser?.id,
      userName: currentUser?.fullName,
      action: `Resumed Held POS Bill (Draft ID: ${heldBill.id})`,
      module: "Wholesale Billing",
    });
  };

  const handleDeleteHeldBill = (id: string) => {
    setHeldBills(heldBills.filter(b => b.id !== id));
  };

  if (!canView) {
    return (
      <div className="p-10 text-center">
        <h2 className="text-xl font-semibold">Access Denied</h2>
        <p className="text-slate-500 mt-2">You do not have permission to view POS Billing.</p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500 pb-20 lg:pb-0 bg-white">
      <PageHeader
        title="POS Billing"
        subtitle="Fast checkout interface for retail counters and cash sales."
        actions={
          <div className="flex gap-2">
            <ActionButton variant="secondary" onClick={() => setShowHeldBills(true)} icon={<ListRestart className="w-4 h-4" />}>
              Held Bills {heldBills.length > 0 && <span className="ml-1 bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded-full text-xs">{heldBills.length}</span>}
            </ActionButton>
            <ActionButton variant="secondary" onClick={handleHoldBill} icon={<StopCircle className="w-4 h-4" />}>Hold Bill</ActionButton>
            <ActionButton variant="secondary" onClick={handleClearCart} className="text-rose-600 hover:bg-rose-50 border-rose-200" icon={<Trash2 className="w-4 h-4" />}>Clear</ActionButton>
            <ActionButton variant="secondary" onClick={() => handlePrintPreview(false)} icon={<Printer className="w-4 h-4" />}>Print Bill</ActionButton>
            <ActionButton variant="secondary" onClick={handleDownloadPdf} icon={<Download className="w-4 h-4" />}>Download PDF</ActionButton>
            <ActionButton onClick={handleGenerateInvoice}>Generate Invoice</ActionButton>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 flex flex-col gap-6">
          
          {/* Customer Information Section */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 print:hidden">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
              <UserCircle className="w-5 h-5 text-[#163c78]" />
              Customer Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select CRM Customer</label>
                <select 
                  className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-violet-500 text-slate-900"
                  value={selectedCustomerId}
                  onChange={e => handleCrmCustomerChange(e.target.value)}
                >
                  <option value="">-- Walk-in / Cash Customer --</option>
                  {CUSTOMERS.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name} ({c.type})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Customer Name <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="text" 
                  placeholder="e.g. John Doe / Yashoda Hospital" 
                  required
                  className={`w-full text-sm border rounded-lg px-3 py-2 outline-none text-slate-900 transition-colors ${
                    customerErrors.name ? 'border-rose-500 ring-2 ring-rose-200 bg-rose-50/40' : 'border-slate-200 focus:border-violet-500'
                  }`} 
                  value={customerName} 
                  onChange={e => {
                    setCustomerName(e.target.value);
                    if (customerErrors.name) setCustomerErrors({ ...customerErrors, name: undefined });
                  }} 
                />
                {customerErrors.name && (
                  <p className="text-[11px] text-rose-500 font-semibold mt-1">{customerErrors.name}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mobile Number <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="text" 
                  placeholder="10-digit mobile number" 
                  required
                  className={`w-full text-sm border rounded-lg px-3 py-2 outline-none text-slate-900 font-mono transition-colors ${
                    customerErrors.mobile ? 'border-rose-500 ring-2 ring-rose-200 bg-rose-50/40' : 'border-slate-200 focus:border-violet-500'
                  }`} 
                  value={mobileNumber} 
                  onChange={e => {
                    const clean = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setMobileNumber(clean);
                    if (customerErrors.mobile && clean.length === 10) setCustomerErrors({ ...customerErrors, mobile: undefined });
                  }} 
                  maxLength={10} 
                />
                {customerErrors.mobile && (
                  <p className="text-[11px] text-rose-500 font-semibold mt-1">{customerErrors.mobile}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">GSTIN (Optional)</label>
                <input type="text" placeholder="27ABCDE1234F1Z5" className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-violet-500 uppercase text-slate-900 font-mono" value={gstin} onChange={e => setGstin(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Sales Type</label>
                <select className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-violet-500 text-slate-900" value={salesType} onChange={e => setSalesType(e.target.value)}>
                  <option>Cash</option>
                  <option>Credit</option>
                  <option>Counter Sale</option>
                </select>
              </div>
            </div>
          </div>

          {/* Generated Invoice Success Banner */}
          {lastGeneratedInvoice && (
            <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm animate-in fade-in slide-in-from-top-2 print:hidden">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shrink-0">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-emerald-900 text-base">Invoice Generated Successfully!</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono font-bold text-xs border border-emerald-300">
                      {lastGeneratedInvoice.invoiceNo}
                    </span>
                  </div>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    Customer: <strong className="text-emerald-900">{lastGeneratedInvoice.customerName}</strong> (Ph: {lastGeneratedInvoice.mobileNumber}) • Amount: <strong>{formatCurrency(lastGeneratedInvoice.grandTotal)}</strong> ({lastGeneratedInvoice.itemsCount} items)
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                <button
                  type="button"
                  onClick={() => handlePrintPreview(false)}
                  className="px-3.5 py-2 rounded-xl bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Bill
                </button>
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download PDF
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                >
                  Start New Sale
                </button>
              </div>
            </div>
          )}

          {/* Barcode & Cart Section */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col flex-1 min-h-[400px] print:hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 rounded-t-2xl flex items-center gap-4 relative" ref={searchContainerRef}>
               <div className="relative flex-1">
                  <ScanBarcode className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#163c78]" />
                  <input
                    type="text"
                    value={barcodeInput}
                    onChange={(e) => {
                      setBarcodeInput(e.target.value);
                      handleInputChange(e.target.value);
                    }}
                    onFocus={() => {
                      if (barcodeInput.trim()) setShowSuggestions(true);
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="Scan barcode or type product name/code... (e.g. '8901234567890' or 'Amoxicillin')"
                    className="w-full pl-10 pr-4 py-3 text-sm bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#163c78]/30 focus:border-[#163c78] shadow-sm transition-all"
                    autoFocus
                  />

                  {/* Autocomplete Suggestions Dropdown with Product Name & Barcode */}
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-2xl max-h-80 overflow-y-auto z-50 divide-y divide-slate-100">
                      <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-200 flex justify-between items-center text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        <span>Matching Products & Barcodes ({suggestions.length})</span>
                        <span className="text-slate-400 font-normal">Click or press Enter to add</span>
                      </div>
                      {suggestions.map((sug, idx) => (
                        <div
                          key={`${sug.code}-${sug.barcode}-${idx}`}
                          onClick={() => handleSelectSuggestion(sug)}
                          className={`p-3 flex items-center justify-between cursor-pointer transition-colors ${
                            idx === selectedIndex ? 'bg-[#163c78]/10' : 'hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[#163c78]/10 text-[#163c78] flex items-center justify-center shrink-0">
                              <ScanBarcode className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-bold text-slate-900">{sug.name}</span>
                                {sug.barcode && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-mono font-bold bg-violet-100 text-violet-800 rounded border border-violet-200">
                                    <ScanBarcode className="w-3 h-3 text-violet-600" />
                                    {sug.barcode}
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5 flex-wrap">
                                <span className="font-mono text-slate-600 bg-slate-100 px-1 rounded">{sug.code}</span>
                                <span>•</span>
                                <span>Batch: <strong className="text-slate-700">{sug.batch?.batchNo || 'Auto FEFO'}</strong></span>
                                {sug.expDate && (
                                  <>
                                    <span>•</span>
                                    <span>Exp: {sug.expDate}</span>
                                  </>
                                )}
                                <span>•</span>
                                <span className={sug.availableQty > 10 ? 'text-emerald-700 font-bold' : sug.availableQty > 0 ? 'text-amber-700 font-bold' : 'text-rose-600 font-bold'}>
                                  {sug.availableQty > 0 ? `${sug.availableQty} in stock` : 'Out of stock'}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right shrink-0 ml-3">
                            <div className="text-sm font-bold text-[#163c78]">{formatCurrency(sug.ptr)}</div>
                            <div className="text-[10px] text-slate-400">PTR / Unit</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
               </div>
               <ActionButton onClick={handleAddProduct} icon={<Plus className="w-4 h-4"/>}>Add Item</ActionButton>
            </div>

            <div className="flex-1 overflow-auto bg-white rounded-b-2xl">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 p-8 min-h-[300px]">
                    <ScanBarcode className="w-16 h-16 mb-4 text-slate-200" />
                    <p className="text-lg font-medium text-slate-500">Cart is empty</p>
                    <p className="text-sm mt-1">Scan a barcode or search for a product to begin billing.</p>
                </div>
              ) : (
                <div className="w-full min-w-[1020px]">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200">
                      <tr>
                        <th className="px-3.5 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider min-w-[200px]">Product Name</th>
                        <th className="px-3 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider min-w-[130px]">Batch & Exp</th>
                        <th className="px-2 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider text-center w-24">Qty</th>
                        <th className="px-2 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider text-center w-28">Extra Margin</th>
                        <th className="px-2 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider text-center w-20">Free</th>
                        <th className="px-2 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider text-right w-28">Rate (₹)</th>
                        <th className="px-2 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider text-center w-20">Disc %</th>
                        <th className="px-2 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider text-center w-24">GST %</th>
                        <th className="px-3.5 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider text-right w-32 min-w-[110px]">Total</th>
                        <th className="px-2 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider text-center w-12"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {cart.map(item => {
                        const itemQty = Number(item.qty) || 0;
                        const itemRate = Number(item.rate) || 0;
                        const itemMargin = Number(item.extraMargin) || 0;
                        const itemDisc = Number(item.discountPct) || 0;
                        const itemGst = Number(item.gstPct) || 0;

                        const baseGross = itemQty * itemRate;
                        const disc = baseGross * (itemDisc / 100);
                        const margin = itemQty * itemMargin;
                        const taxable = Math.max(0, baseGross - disc + margin);
                        const lineTotal = taxable * (1 + itemGst / 100);

                        return (
                          <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="px-3.5 py-3.5 min-w-[200px]">
                              <p className="text-sm font-bold text-slate-900 leading-snug">{item.name}</p>
                              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                <span className="text-xs font-mono font-medium text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">{item.productCode}</span>
                                {item.barcode && (
                                  <span className="text-[11px] font-mono bg-violet-50 text-violet-700 px-1.5 py-0.5 rounded border border-violet-200 flex items-center gap-1">
                                    <ScanBarcode className="w-3 h-3 text-violet-600" />
                                    {item.barcode}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-3 py-3.5 min-w-[130px]">
                              <p className="text-sm font-semibold text-slate-800">{item.batch}</p>
                              <p className="text-xs text-slate-500 font-mono mt-0.5">
                                {item.expiry ? (item.expiry.includes('T') ? item.expiry.split('T')[0] : item.expiry) : 'N/A'}
                              </p>
                            </td>
                            <td className="px-2 py-3.5 w-24">
                              <input 
                                type="number" 
                                min="0" 
                                placeholder="0"
                                className="w-full text-sm border border-slate-300 rounded-lg px-2 py-2 outline-none focus:ring-2 focus:ring-[#163c78]/25 focus:border-[#163c78] text-center font-bold text-slate-900 bg-white transition-all shadow-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                                value={item.qty === 0 ? '' : item.qty} 
                                onChange={e => {
                                  const raw = e.target.value.trim();
                                  const num = raw === '' ? 0 : parseInt(raw, 10);
                                  updateCartItem(item.id, 'qty', isNaN(num) ? 0 : Math.max(0, num));
                                }} 
                              />
                            </td>
                            <td className="px-2 py-3.5 w-28">
                              <input 
                                type="number" 
                                min="0" 
                                step="0.01" 
                                placeholder="0.00" 
                                className="w-full text-sm border border-slate-300 rounded-lg px-2 py-2 outline-none focus:ring-2 focus:ring-[#163c78]/25 focus:border-[#163c78] text-right font-medium text-slate-900 bg-white transition-all shadow-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                                value={item.extraMargin === 0 || item.extraMargin === undefined ? '' : item.extraMargin} 
                                onChange={e => {
                                  const raw = e.target.value.trim();
                                  const num = raw === '' ? 0 : parseFloat(raw);
                                  updateCartItem(item.id, 'extraMargin', isNaN(num) ? 0 : Math.max(0, num));
                                }} 
                              />
                            </td>
                            <td className="px-2 py-3.5 w-20">
                              <input 
                                type="number" 
                                min="0" 
                                placeholder="0"
                                className="w-full text-sm border border-slate-300 rounded-lg px-2 py-2 outline-none focus:ring-2 focus:ring-[#163c78]/25 focus:border-[#163c78] text-center font-medium text-slate-900 bg-white transition-all shadow-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                                value={item.freeQty === 0 || item.freeQty === undefined ? '' : item.freeQty} 
                                onChange={e => {
                                  const raw = e.target.value.trim();
                                  const num = raw === '' ? 0 : parseInt(raw, 10);
                                  updateCartItem(item.id, 'freeQty', isNaN(num) ? 0 : Math.max(0, num));
                                }} 
                              />
                            </td>
                            <td className="px-2 py-3.5 w-28">
                              <input 
                                type="number" 
                                min="0" 
                                step="0.01" 
                                placeholder="0.00"
                                className="w-full text-sm border border-slate-300 rounded-lg px-2 py-2 outline-none focus:ring-2 focus:ring-[#163c78]/25 focus:border-[#163c78] text-right font-semibold text-slate-900 bg-white transition-all shadow-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                                value={item.rate === 0 || item.rate === undefined ? '' : item.rate} 
                                onChange={e => {
                                  const raw = e.target.value.trim();
                                  const num = raw === '' ? 0 : parseFloat(raw);
                                  updateCartItem(item.id, 'rate', isNaN(num) ? 0 : Math.max(0, num));
                                }} 
                              />
                            </td>
                            <td className="px-2 py-3.5 w-20">
                              <input 
                                type="number" 
                                min="0" 
                                max="100" 
                                step="0.1" 
                                placeholder="0"
                                className="w-full text-sm border border-slate-300 rounded-lg px-2 py-2 outline-none focus:ring-2 focus:ring-[#163c78]/25 focus:border-[#163c78] text-center font-medium text-slate-900 bg-white transition-all shadow-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                                value={item.discountPct === 0 || item.discountPct === undefined ? '' : item.discountPct} 
                                onChange={e => {
                                  const raw = e.target.value.trim();
                                  const num = raw === '' ? 0 : parseFloat(raw);
                                  updateCartItem(item.id, 'discountPct', isNaN(num) ? 0 : Math.max(0, Math.min(100, num)));
                                }} 
                              />
                            </td>
                            <td className="px-2 py-3.5 w-24">
                              <select 
                                className="w-full text-sm border border-slate-300 rounded-lg px-1.5 py-2 outline-none focus:ring-2 focus:ring-[#163c78]/25 focus:border-[#163c78] bg-white text-slate-900 font-semibold text-center cursor-pointer shadow-sm transition-all" 
                                value={item.gstPct} 
                                onChange={e => updateCartItem(item.id, 'gstPct', parseFloat(e.target.value) || 0)}
                              >
                                <option value="0">0%</option>
                                <option value="5">5%</option>
                                <option value="12">12%</option>
                                <option value="18">18%</option>
                                <option value="28">28%</option>
                              </select>
                            </td>
                            <td className="px-3.5 py-3.5 text-right font-bold text-slate-900 whitespace-nowrap text-sm w-32 min-w-[110px]">
                              {formatCurrency(lineTotal)}
                            </td>
                            <td className="px-2 py-3.5 text-center w-12">
                              <button 
                                type="button"
                                title="Remove item"
                                onClick={() => removeCartItem(item.id)} 
                                className="text-slate-400 hover:text-rose-600 transition-colors p-1.5 rounded-lg hover:bg-rose-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Payment Information Section */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 print:hidden">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-[#163c78]" />
              Payment Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Payment Mode</label>
                <select className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-violet-500 text-slate-900" value={paymentMode} onChange={e => setPaymentMode(e.target.value)}>
                  <option>Cash</option>
                  <option>Card</option>
                  <option>UPI</option>
                  <option>Bank Transfer</option>
                  <option>Credit</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Amount Received (₹)</label>
                <input type="number" placeholder="0.00" className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-emerald-500 text-emerald-700 font-bold" value={amountReceived} onChange={e => setAmountReceived(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Balance Return</label>
                <div className="w-full text-sm bg-slate-100 border border-transparent rounded-lg px-3 py-2 text-rose-600 font-bold">
                  {formatCurrency(calculations.balance)}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Reference Number</label>
                <input type="text" placeholder="Trx ID / Cheque No" className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-violet-500 text-slate-900" value={referenceNumber} onChange={e => setReferenceNumber(e.target.value)} />
              </div>
            </div>
          </div>

        </div>

        {/* Bill Summary Sidebar */}
        <div className="lg:col-span-1 print:hidden">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sticky top-6">
             <h3 className="text-lg font-bold text-slate-900 mb-6 border-b border-slate-100 pb-4">Bill Summary</h3>
             <div className="space-y-3 mb-6">
               <div className="flex justify-between text-sm">
                 <span className="text-slate-500">Subtotal</span>
                 <span className="font-medium text-slate-800">{formatCurrency(calculations.subtotal)}</span>
               </div>
               <div className="flex justify-between text-sm">
                 <span className="text-slate-500">Total Discount</span>
                 <span className="font-medium text-emerald-600">- {formatCurrency(calculations.totalDiscount)}</span>
               </div>
               <div className="flex justify-between text-sm pt-2 border-t border-slate-100">
                 <span className="text-slate-600 font-medium">Taxable Amount</span>
                 <span className="font-bold text-slate-800">{formatCurrency(calculations.totalTaxable)}</span>
               </div>
               <div className="flex justify-between text-sm">
                 <span className="text-slate-500">CGST</span>
                 <span className="font-medium text-slate-600">{formatCurrency(calculations.cgst)}</span>
               </div>
               <div className="flex justify-between text-sm">
                 <span className="text-slate-500">SGST</span>
                 <span className="font-medium text-slate-600">{formatCurrency(calculations.sgst)}</span>
               </div>
               <div className="flex justify-between text-sm">
                 <span className="text-slate-500">IGST</span>
                 <span className="font-medium text-slate-600">{formatCurrency(calculations.igst)}</span>
               </div>
               <div className="flex justify-between text-sm">
                 <span className="text-slate-500">Round Off</span>
                 <span className="font-medium text-slate-600">{formatCurrency(calculations.roundOff)}</span>
               </div>
               
               <div className="pt-4 mt-2 border-t border-slate-200 flex flex-col items-center justify-center bg-slate-50 rounded-lg p-4">
                 <span className="text-sm font-semibold text-slate-500 mb-1">Net Payable Amount</span>
                 <span className="text-3xl font-bold text-violet-700">{formatCurrency(calculations.netAmount)}</span>
               </div>
             </div>
             
             <div className="space-y-3">
               <ActionButton onClick={handleGenerateInvoice} className="w-full justify-center py-4 text-base shadow-md hover:shadow-lg transition-all bg-emerald-600 hover:bg-emerald-700">Complete & Invoice</ActionButton>
               <ActionButton variant="secondary" onClick={() => handlePrintPreview(true)} className="w-full justify-center border-violet-200 text-violet-700 bg-[#163c78]/10 hover:bg-violet-100">Print Bill without Saving</ActionButton>
               {cart.length > 0 && (
                 <ActionButton variant="secondary" onClick={handleDownloadPdf} className="w-full justify-center border-slate-300 text-slate-700 hover:bg-slate-100 flex items-center gap-2">
                   <Download className="w-4 h-4" /> Download PDF Invoice
                 </ActionButton>
               )}
             </div>
          </div>
        </div>
      </div>

      {/* Held Bills Drawer */}
      <Drawer open={showHeldBills} onClose={() => setShowHeldBills(false)} title="Held Bills">
        {heldBills.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500">
            <StopCircle className="w-12 h-12 mb-3 text-slate-300" />
            <p>No bills are currently on hold.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {heldBills.map(bill => (
              <div key={bill.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-bold text-slate-900">{bill.customerName || bill.customerType}</h4>
                    <p className="text-xs text-slate-500">Held on: {new Date(bill.timestamp).toLocaleTimeString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-violet-700">{formatCurrency(bill.billAmount || bill.bodyAmount || 0)}</p>
                    <p className="text-xs text-slate-500">{bill.itemCount} items</p>
                  </div>
                </div>
                <div className="flex gap-2 justify-end mt-4">
                  <ActionButton variant="secondary" onClick={() => handleDeleteHeldBill(bill.id)} className="text-rose-600 border-rose-200 hover:bg-rose-50 px-3 py-1.5 text-xs">Delete</ActionButton>
                  <ActionButton onClick={() => handleResumeBill(bill)} className="px-3 py-1.5 text-xs">Resume Bill</ActionButton>
                </div>
              </div>
            ))}
          </div>
        )}
      </Drawer>

      {/* Print Preview Drawer/Modal */}
      <Drawer open={showPrintPreview} onClose={() => setShowPrintPreview(false)} title="Print Preview">
        <div className="flex flex-col h-full">
          <div className="flex-1 bg-slate-100 rounded-lg border border-slate-200 shadow-sm overflow-hidden flex flex-col">
             {previewPdfUrl ? (
                <iframe src={previewPdfUrl} className="w-full h-full flex-1" title="Invoice Preview" />
             ) : (
               <div className="flex-1 flex items-center justify-center text-slate-500">Generating Preview...</div>
             )}
          </div>
          <div className="pt-4 border-t border-slate-200 flex justify-end gap-3 mt-4">
            <ActionButton variant="secondary" onClick={() => setShowPrintPreview(false)}>Close</ActionButton>
            <ActionButton icon={<Printer className="w-4 h-4" />} onClick={executeBrowserPrint}>Print Document</ActionButton>
          </div>
        </div>
      </Drawer>
    </div>
  );
}
