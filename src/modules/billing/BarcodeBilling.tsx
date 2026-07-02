// Refactored Barcode Checkout Module
import { useState, useMemo, useEffect } from 'react';
import { ScanBarcode, Plus, Trash2, Printer, StopCircle, UserCircle, CreditCard, ListRestart } from 'lucide-react';
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
  
  // CRM Integration State
  const [selectedCustomerId, setSelectedCustomerId] = useState('');

  // Customer Info
  const [customerName, setCustomerName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [customerType, setCustomerType] = useState('Retail Customer');
  const [gstin, setGstin] = useState('');
  const [salesType, setSalesType] = useState('Cash');

  // Payment Info
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [amountReceived, setAmountReceived] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');

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

  // Save held bills persistently
  useEffect(() => {
    localStorage.setItem('pos_held_bills', JSON.stringify(heldBills));
  }, [heldBills]);

  // Cart Calculations
  const calculations = useMemo(() => {
    let subtotal = 0;
    let totalDiscount = 0;
    let totalTaxable = 0;
    let totalGstAmount = 0;

    cart.forEach(item => {
      const gross = item.qty * item.rate;
      const discount = gross * (item.discountPct / 100);
      const taxable = gross - discount;
      const gst = taxable * (item.gstPct / 100);
      
      subtotal += gross;
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

  const getProductBatches = (productCode: string) => {
    const inventory = inventoryService.getAll();
    const batches = batchService.getAll();
    
    const productInventory = inventory.filter(inv => inv.productCode === productCode && inv.availableQty > 0);
    
    return productInventory.map(inv => {
      const batchDetail = batches.find(b => b.batchNo === inv.batchNo);
      return {
        batchNo: inv.batchNo,
        availableQty: inv.availableQty,
        ptr: inv.ptr || (batchDetail ? batchDetail.ptr : 0),
        mrp: batchDetail ? batchDetail.mrp : 0,
        expDate: batchDetail ? batchDetail.expDate : '12/2026',
        status: batchDetail ? batchDetail.status : 'Healthy',
        warehouseId: inv.warehouseId,
        warehouseName: inv.warehouseName
      };
    }).filter(b => {
      if (b.status !== 'Healthy') return false; // Prevent Quarantine, Expired, Blocked, Damaged
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

    const schemes = schemeService.getAll();
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
    const invoiceNo = billingService.getNextInvoiceNo();
    const isSameState = sellerState === 'Telangana'; // Simplified state matching
    
    return {
      id: Date.now().toString(),
      invoiceNo,
      customerId: selectedCustomerId || 'WALK-IN',
      customerName: customerName || 'Retail Customer',
      date: new Date().toISOString().split('T')[0],
      dueDate: salesType === 'Credit' ? new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      status: salesType === 'Credit' ? 'Unpaid' : 'Paid',
      items: cart.map(c => ({
        id: c.id,
        productId: c.productId,
        productCode: c.productCode,
        productName: c.name,
        batchNo: c.batch,
        qty: c.qty,
        freeQty: c.freeQty || 0,
        ptr: c.rate,
        discountPercent: c.discountPct,
        gstPercent: c.gstPct,
        total: (c.qty * c.rate) * (1 - c.discountPct/100) * (1 + c.gstPct/100),
        stock: c.qty
      })),
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
  };

  const handleAddProduct = () => {
    if (!barcodeInput.trim()) return;
    const query = barcodeInput.toLowerCase().trim();
    
    const barcodesList = barcodeService.getAll();
    const matchedBarcode = barcodesList.find((b:any) => b.barcode.toLowerCase() === query && b.status === 'Active');
    
    let resolvedProductCode = '';
    let barcodeString = '';
    
    if (matchedBarcode) {
      resolvedProductCode = matchedBarcode.productCode;
      barcodeString = matchedBarcode.barcode;
    } else {
      const productsList = productService.getProducts();
      const matchedProduct = productsList.find((p: any) => 
        p.code.toLowerCase() === query || 
        p.name.toLowerCase().includes(query)
      );
      if (matchedProduct) {
        resolvedProductCode = matchedProduct.code;
        barcodeString = matchedProduct.barcode || '';
      }
    }
    
    if (!resolvedProductCode) {
      alert('Product not found! Please check barcode or name.');
      return;
    }

    const productsList = productService.getProducts();
    const product = productsList.find((p: any) => p.code === resolvedProductCode);
    if (!product || product.status !== 'Active') {
      alert('Product is not active or does not exist in master catalog.');
      return;
    }

    const availableBatches = getProductBatches(resolvedProductCode);
    if (availableBatches.length === 0) {
      alert('Product is completely out of stock, expired, or quarantine locked!');
      return;
    }

    // FEFO: Select first available batch
    const chosenBatch = availableBatches[0];
    const existing = cart.find(item => item.productCode === resolvedProductCode && item.batch === chosenBatch.batchNo);
    
    if (existing) {
      if (existing.qty + 1 > chosenBatch.availableQty) {
        alert(`Insufficient stock! Only ${chosenBatch.availableQty} units available in batch ${chosenBatch.batchNo}.`);
        return;
      }
      const newQty = existing.qty + 1;
      const promo = applyEligibleScheme(resolvedProductCode, newQty, existing.rate);
      setCart(cart.map(item => item.id === existing.id 
        ? { ...item, qty: newQty, discountPct: promo.discountPercent, freeQty: promo.freeQty } 
        : item
      ));
    } else {
      const rate = chosenBatch.ptr || parseFloat(product.ptr) || 0;
      const promo = applyEligibleScheme(resolvedProductCode, 1, rate);
      setCart([...cart, {
        id: Math.random().toString(),
        productId: product.id,
        productCode: product.code,
        barcode: barcodeString || product.barcode || '',
        name: product.name,
        batch: chosenBatch.batchNo,
        expiry: chosenBatch.expDate,
        qty: 1,
        freeQty: promo.freeQty,
        rate: rate,
        discountPct: promo.discountPercent,
        gstPct: parseFloat(product.gst) || 12,
        warehouseId: chosenBatch.warehouseId
      }]);
    }
    setBarcodeInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddProduct();
    }
  };

  const updateCartItem = (id: string, field: keyof CartItem, value: any) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        let val = typeof value === 'number' ? Math.max(1, value) : value;
        
        if (field === 'qty') {
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
    if (cart.length === 0) return alert('Cart is empty.');

    // 1. Validate Credit Sales Info
    if (salesType === 'Credit') {
      if (!customerName.trim()) {
        alert('Customer Name is required for Credit sales.');
        return;
      }
      if (!mobileNumber.trim()) {
        alert('Mobile Number is required for Credit sales.');
        return;
      }
      // Ensure GSTIN is present for business accounts
      if (customerType !== 'Retail Customer' && customerType !== 'Cash Sale' && !gstin.trim()) {
        alert('GSTIN is required for Credit sales to commercial accounts.');
        return;
      }
    }

    // 2. Validate Received Amount for Cash/Card/UPI
    const netPayable = calculations.netAmount;
    const received = parseFloat(amountReceived) || 0;
    if (salesType !== 'Credit' && received < netPayable) {
      alert(`Amount Received (${formatCurrency(received)}) must be at least the Net Payable Amount (${formatCurrency(netPayable)}).`);
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

    alert(`✅ POS Invoice ${invoicePayload.invoiceNo} Saved & Synchronized Successfully!`);
    resetForm();
  };

  // --- Print Bill Handling ---
  const handlePrintPreview = (temporary: boolean) => {
    if (cart.length === 0) return alert('Cart is empty.');
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
            <ActionButton onClick={handleGenerateInvoice}>Generate Invoice</ActionButton>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 flex flex-col gap-6">
          
          {/* Customer Information Section */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 print:hidden">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
              <UserCircle className="w-5 h-5 text-violet-600" />
              Customer Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Select CRM Customer</label>
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
                <label className="block text-xs font-medium text-slate-600 mb-1">Customer Name</label>
                <input type="text" placeholder="John Doe" className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-violet-500 text-slate-900" value={customerName} onChange={e => setCustomerName(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Mobile Number</label>
                <input type="text" placeholder="9876543210" className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-violet-500 text-slate-900" value={mobileNumber} onChange={e => setMobileNumber(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">GSTIN (Optional)</label>
                <input type="text" placeholder="27ABCDE1234F1Z5" className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-violet-500 uppercase text-slate-900" value={gstin} onChange={e => setGstin(e.target.value)} />
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

          {/* Barcode & Cart Section */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col flex-1 min-h-[400px] print:hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 rounded-t-2xl flex items-center gap-4">
               <div className="relative flex-1">
                  <ScanBarcode className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-violet-600" />
                  <input
                    type="text"
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Scan barcode or type product name/code... (e.g. '8901234567890')"
                    className="w-full pl-10 pr-4 py-3 text-sm bg-white border border-violet-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 shadow-sm transition-all font-mono"
                    autoFocus
                  />
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
                <div className="w-full min-w-[800px]">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 sticky top-0 z-10">
                      <tr>
                        <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase border-b border-slate-200">Product Name</th>
                        <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase border-b border-slate-200">Batch & Exp</th>
                        <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase border-b border-slate-200 w-24">Qty</th>
                        <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase border-b border-slate-200 w-24">Free</th>
                        <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase border-b border-slate-200 w-28">Rate</th>
                        <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase border-b border-slate-200 w-24">Disc %</th>
                        <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase border-b border-slate-200 w-24">GST %</th>
                        <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase border-b border-slate-200 text-right w-32">Total</th>
                        <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase border-b border-slate-200 w-12"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {cart.map(item => {
                        const gross = item.qty * item.rate;
                        const disc = gross * (item.discountPct / 100);
                        const taxable = gross - disc;
                        const lineTotal = taxable * (1 + item.gstPct / 100);

                        return (
                          <tr key={item.id} className="hover:bg-slate-50/50">
                            <td className="px-4 py-3">
                              <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                              <p className="text-xs text-slate-500 font-mono">{item.barcode}</p>
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-sm text-slate-700">{item.batch}</p>
                              <p className="text-xs text-slate-500">{item.expiry}</p>
                            </td>
                            <td className="px-4 py-3">
                              <input type="number" min="1" className="w-full text-sm border border-slate-200 rounded px-2 py-1 outline-none focus:border-violet-500 text-slate-900" value={item.qty} onChange={e => updateCartItem(item.id, 'qty', parseInt(e.target.value) || 0)} />
                            </td>
                            <td className="px-4 py-3">
                              <input type="number" min="0" className="w-full text-sm border border-slate-200 rounded px-2 py-1 outline-none focus:border-violet-500 text-slate-900" value={item.freeQty} onChange={e => updateCartItem(item.id, 'freeQty', parseInt(e.target.value) || 0)} />
                            </td>
                            <td className="px-4 py-3">
                              <input type="number" min="0" step="0.01" className="w-full text-sm border border-slate-200 rounded px-2 py-1 outline-none focus:border-violet-500 text-slate-900" value={item.rate} onChange={e => updateCartItem(item.id, 'rate', parseFloat(e.target.value) || 0)} />
                            </td>
                            <td className="px-4 py-3">
                              <input type="number" min="0" max="100" step="0.1" className="w-full text-sm border border-slate-200 rounded px-2 py-1 outline-none focus:border-violet-500 text-slate-900" value={item.discountPct} onChange={e => updateCartItem(item.id, 'discountPct', parseFloat(e.target.value) || 0)} />
                            </td>
                            <td className="px-4 py-3">
                              <select className="w-full text-sm border border-slate-200 rounded px-2 py-1 outline-none focus:border-violet-500 bg-transparent text-slate-900" value={item.gstPct} onChange={e => updateCartItem(item.id, 'gstPct', parseFloat(e.target.value) || 0)}>
                                <option value="0">0%</option>
                                <option value="5">5%</option>
                                <option value="12">12%</option>
                                <option value="18">18%</option>
                                <option value="28">28%</option>
                              </select>
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-slate-800">
                              {formatCurrency(lineTotal)}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button onClick={() => removeCartItem(item.id)} className="text-slate-400 hover:text-rose-600 transition-colors">
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
              <CreditCard className="w-5 h-5 text-violet-600" />
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
               <ActionButton variant="secondary" onClick={() => handlePrintPreview(true)} className="w-full justify-center border-violet-200 text-violet-700 bg-violet-50 hover:bg-violet-100">Print Bill without Saving</ActionButton>
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
