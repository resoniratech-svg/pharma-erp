// Refactored GST Invoicing Module
import { useState, useEffect } from 'react';
import { Plus, Download, ReceiptText, Trash2, Ban } from 'lucide-react';
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

// --- DYNAMIC CRM INTEGRATION ---
const crmDistributors = JSON.parse(localStorage.getItem('crm_distributors') || '[]');
const CUSTOMERS = crmDistributors.map((d: any) => ({ 
  id: d.id, 
  name: d.name, 
  type: d.tier || 'Distributor',
  state: d.state || (d.region === 'South' ? 'Karnataka' : 'Telangana'),
  creditDays: d.creditDays || 30
}));

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
  const [customerId, setCustomerId] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMode, setPaymentMode] = useState('Credit');
  const [status, setStatus] = useState<'Paid' | 'Unpaid' | 'Draft'>('Unpaid');
  const [items, setItems] = useState<InvoiceItem[]>([]);

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

  const loadDatabaseDetails = () => {
    const savedInvoices = billingService.getInvoices();
    setInvoices(savedInvoices);

    const savedProducts = productService.getProducts() as ProductRecord[];
    setProducts(savedProducts || []);

    const savedBatches = batchService.getAll();
    const groupInventory: Record<string, { batchNo: string; expiry: string; stock: number; ptr: number; mrp?: number; status: string }[]> = {};
    
    savedBatches.forEach(b => {
      const matchProduct = savedProducts.find((p) => p.code === b.productCode);
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
  };

  useEffect(() => {
    loadDatabaseDetails();
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

  const handleCustomerChange = (id: string) => {
    setCustomerId(id);
    const customer = CUSTOMERS.find((c: any) => c.id === id);
    if (customer && customer.state) {
      setBuyerState(customer.state);
    }
  };

  const addLineItem = () => {
    setItems([...items, { id: Date.now().toString(), productId: '', productCode: '', productName: '', batchNo: '', qty: 1, freeQty: 0, ptr: 0, discountPercent: 0, gstPercent: 0, total: 0, stock: 0 }]);
  };

  const removeLineItem = (id: string) => {
    if (window.confirm("Are you sure you want to remove this product?")) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const applyEligibleScheme = (productId: string, qty: number, ptr: number) => {
    const product = products.find(p => p.id === productId);
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

          // Sort batches by expiry date (earliest first - FEFO) - Lock to healthy batches
          const batch = productInventory
            .filter(b => b.stock > 0 && !isBatchExpired(b.expiry) && b.status === 'Healthy')
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
            if (batch.status !== 'Healthy') {
              alert(`Warning: Batch ${batch.batchNo} is quarantined/damaged/blocked (${batch.status}). Lock active.`);
              return item;
            }
            if (isBatchExpired(batch.expiry)) {
              alert(`Warning: Batch ${batch.batchNo} expired on ${batch.expiry}! Lock active.`);
              return item;
            }
            updatedItem.ptr = batch.ptr;
            updatedItem.stock = batch.stock;
            updatedItem.mrp = batch.mrp || updatedItem.mrp || 0;
          }
        }

        if (field === 'qty') {
          if (value > updatedItem.stock) {
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

        const basePrice = updatedItem.qty * updatedItem.ptr * (1 - updatedItem.discountPercent / 100);
        const gstAmount = (basePrice * updatedItem.gstPercent) / 100;
        updatedItem.total = basePrice + gstAmount;

        return updatedItem;
      }
      return item;
    }));
  };

  const subTotal = items.reduce((sum, item) => sum + (item.qty * item.ptr * (1 - item.discountPercent / 100)), 0);
  const totalGst = items.reduce((sum, item) => sum + (((item.qty * item.ptr * (1 - item.discountPercent / 100)) * item.gstPercent) / 100), 0);
  
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

    const customer = CUSTOMERS.find((c: any)=> c.id === customerId);
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
    setItems([]);
    setInvoiceDate(new Date().toISOString().split('T')[0]);
    setPaymentMode('Credit');
    setStatus('Unpaid');
    alert('✅ GST Invoice Generated & Modules Synchronized Successfully!');
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
                action: `Printed invoice details for ${row.invoiceNo}`,
                module: "Wholesale Billing"
              });
              alert("Invoice preview printed successfully.");
            }}
            className="text-violet-600 hover:text-violet-750 p-1"
            title="Print Preview Invoice"
          >
            <ReceiptText className="w-4 h-4" />
          </button>
          {row.status !== 'Cancelled' && (
            <button 
              onClick={() => handleCancelInvoice(row.invoiceNo)} 
              className="text-rose-600 hover:text-rose-750 p-1"
              title="Cancel & Reverse Invoice"
            >
              <Ban className="w-4 h-4" />
            </button>
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

  const selectedCustomer = CUSTOMERS.find((c: any) => c.id === customerId);

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
              <ActionButton icon={<Plus className="w-4 h-4" />} onClick={() => { setIsDrawerOpen(true); setItems([]); }}>
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

      <Drawer open={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} title="Generate GST Invoice">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Customer Selection *</label>
              <select required className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-600 text-sm bg-white text-slate-900" value={customerId} onChange={(e) => handleCustomerChange(e.target.value)}>
                <option value="">-- Select Customer --</option>
                {CUSTOMERS.map((c:any) => <option key={c.id} value={c.id}>{c.name} ({c.type})</option>)}
              </select>
            </div>
            <div>
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
              <div className="col-span-2 text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-100 p-2 rounded-lg">
                Customer Location: {selectedCustomer.state} | Credit Terms: {selectedCustomer.creditDays} Days
              </div>
            )}
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-bold text-slate-800">Product Details</label>
              <button type="button" onClick={addLineItem} className="text-xs font-semibold text-violet-600 hover:text-violet-800 flex items-center gap-1">
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
                        {item.productId && (inventory[item.productId] || []).filter(b => !isBatchExpired(b.expiry) && b.status === 'Healthy').map(b => (
                          <option key={b.batchNo} value={b.batchNo}>
                            Batch: {b.batchNo} | Exp: {b.expiry} | Stock: {b.stock} | PTR: {formatCurrency(b.ptr)} | MRP: {formatCurrency(b.mrp || b.ptr * 1.2)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-3">
                      <div className="flex items-center gap-2">
                        <input type="number" required min="1" max={item.stock || 1000} className="w-full px-2 py-1.5 border border-slate-300 rounded focus:ring-2 focus:ring-violet-600 text-xs bg-white text-slate-900" value={item.qty} onChange={(e) => updateLineItem(item.id, 'qty', parseInt(e.target.value) || 0)} placeholder="Qty" />
                      </div>
                    </div>
                  </div>

                  {item.productId && (
                    <div className="grid grid-cols-3 gap-2 mt-1">
                      <div className="col-span-1">
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
                      <div className="col-span-1">
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
                      <div className="col-span-1">
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
                    <div className="flex justify-between text-xs text-slate-600 bg-slate-50 p-2 rounded mt-1 border border-slate-100 font-medium">
                      <span>Rate: {formatCurrency(item.ptr)}</span>
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
              <select disabled className="bg-slate-800 border-slate-700 rounded text-sm text-white opacity-70 cursor-not-allowed" value={status} onChange={(e) => setStatus(e.target.value as any)}>
                <option value="Unpaid">Unpaid</option>
                <option value="Paid">Paid</option>
                <option value="Draft">Save as Draft</option>
              </select>
            </div>
          </div>

          <div className="pt-2 flex gap-3">
            <button type="submit" className="flex-1 bg-violet-600 text-white px-4 py-3 rounded-xl font-bold hover:bg-violet-700 transition-colors shadow-sm">
              Generate GST Invoice
            </button>
            <button type="button" onClick={() => setIsDrawerOpen(false)} className="flex-1 bg-white border border-slate-300 text-slate-700 px-4 py-3 rounded-xl font-bold hover:bg-slate-50 transition-colors">
              Cancel
            </button>
          </div>
        </form>
      </Drawer>
    </div>
  );
}