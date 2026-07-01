// import { useState } from 'react';
// import { Plus, Download, Filter, ReceiptText } from 'lucide-react';
// import {
//   PageHeader,
//   FilterBar,
//   SearchInput,
//   SelectFilter,
//   ActionButton,
//   TableCard,
//   DataTable,
//   Badge,
// } from './components/shared';
// import { type Column } from './components/shared';

// interface GSTInvoice {
//   id: string;
//   invoiceNo: string;
//   customerName: string;
//   date: string;
//   taxableAmount: string;
//   gstAmount: string;
//   totalAmount: string;
//   status: 'Paid' | 'Unpaid' | 'Draft';
// }

// const mockData: GSTInvoice[] = [
//   { id: '1', invoiceNo: 'INV/26/001', customerName: 'Apollo Pharmacy', date: '15-Oct-2026', taxableAmount: '₹ 45,000', gstAmount: '₹ 5,400', totalAmount: '₹ 50,400', status: 'Paid' },
//   { id: '2', invoiceNo: 'INV/26/002', customerName: 'MedPlus Store', date: '16-Oct-2026', taxableAmount: '₹ 12,000', gstAmount: '₹ 1,440', totalAmount: '₹ 13,440', status: 'Unpaid' },
//   { id: '3', invoiceNo: 'INV/26/003', customerName: 'Wellness Medicos', date: '17-Oct-2026', taxableAmount: '₹ 8,500', gstAmount: '₹ 1,020', totalAmount: '₹ 9,520', status: 'Draft' },
// ];

// export default function GSTBilling() {
//   const [search, setSearch] = useState('');
//   const [statusFilter, setStatusFilter] = useState('');

//   const columns: Column<GSTInvoice>[] = [
//     { key: 'invoiceNo', label: 'Invoice No', render: (row) => <span className="font-semibold text-slate-900">{row.invoiceNo}</span> },
//     { key: 'customerName', label: 'Customer Name' },
//     { key: 'date', label: 'Invoice Date' },
//     { key: 'taxableAmount', label: 'Taxable Amount' },
//     { key: 'gstAmount', label: 'GST Amount', render: (row) => <span className="text-slate-500">{row.gstAmount}</span> },
//     { key: 'totalAmount', label: 'Total Value', render: (row) => <span className="font-bold text-violet-700">{row.totalAmount}</span> },
//     {
//       key: 'status',
//       label: 'Status',
//       render: (row) => {
//         const variant = row.status === 'Paid' ? 'success' : row.status === 'Unpaid' ? 'warning' : 'neutral';
//         return <Badge variant={variant}>{row.status}</Badge>;
//       },
//     },
//     {
//       key: 'action',
//       label: '',
//       render: () => <button className="text-violet-600 hover:text-violet-700 p-1"><ReceiptText className="w-4 h-4" /></button>
//     }
//   ];

//   const filteredData = mockData.filter((item) => {
//     const matchSearch = item.invoiceNo.toLowerCase().includes(search.toLowerCase()) || item.customerName.toLowerCase().includes(search.toLowerCase());
//     const matchStatus = statusFilter ? item.status === statusFilter : true;
//     return matchSearch && matchStatus;
//   });

//   return (
//     <div className="animate-in fade-in duration-500">
//       <PageHeader
//         title="GST Billing & Invoicing"
//         subtitle="Create, manage, and track GST-compliant sales invoices."
//         actions={
//           <>
//             <ActionButton variant="secondary" icon={<Download className="w-4 h-4" />}>Export Register</ActionButton>
//             <ActionButton icon={<Plus className="w-4 h-4" />}>New Invoice</ActionButton>
//           </>
//         }
//       />

//       <FilterBar>
//         <SearchInput value={search} onChange={setSearch} placeholder="Search invoice no or customer..." />
//         <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
//         <div className="flex items-center gap-2">
//           <Filter className="w-4 h-4 text-slate-400" />
//           <span className="text-sm font-medium text-slate-600">Filters:</span>
//         </div>
//         <SelectFilter
//           value={statusFilter}
//           onChange={setStatusFilter}
//           options={[
//             { label: 'Paid', value: 'Paid' },
//             { label: 'Unpaid', value: 'Unpaid' },
//             { label: 'Draft', value: 'Draft' },
//           ]}
//           placeholder="All Status"
//         />
//       </FilterBar>

//       <TableCard>
//         <DataTable
//           columns={columns}
//           data={filteredData}
//           emptyMessage="No invoices found."
//         />
//       </TableCard>
//     </div>
//   );
// }


////////////////////////////////////////////////////////////////////////////////////

import { useState, useEffect } from 'react';
import { Plus, Download, ReceiptText, Trash2 } from 'lucide-react';
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

// --- DYNAMIC CRM INTEGRATION ---
const crmDistributors = JSON.parse(localStorage.getItem('crm_distributors') || '[]');
const CUSTOMERS = crmDistributors.length > 0 
  ? crmDistributors.map((d: any) => ({ id: d.id, name: d.name, type: d.tier || 'Distributor' }))
  : [
      { id: 'C001', name: 'Apollo Pharmacy', type: 'Retailer' },
      { id: 'C002', name: 'MedPlus Store', type: 'Retailer' },
      { id: 'C003', name: 'City Hospital', type: 'Hospital' },
    ];

const PRODUCTS = [
  { id: 'P001', name: 'Paracetamol 500mg', gst: 12 },
  { id: 'P002', name: 'Azithromycin 250mg', gst: 12 },
  { id: 'P003', name: 'Cough Syrup 100ml', gst: 5 },
];

const DEFAULT_INVENTORY: Record<string, { batchNo: string; expiry: string; stock: number; ptr: number }[]> = {
  'P001': [{ batchNo: 'B-PARA-01', expiry: '12/2026', stock: 500, ptr: 15.50 }],
  // B-AZI-99 is intentionally set to expire in the past to test validation!
  'P002': [{ batchNo: 'B-AZI-99', expiry: '10/2023', stock: 200, ptr: 45.00 }, { batchNo: 'B-AZI-100', expiry: '10/2026', stock: 100, ptr: 46.00 }],
  'P003': [{ batchNo: 'B-COUGH-22', expiry: '08/2027', stock: 150, ptr: 35.00 }],
};
// -----------------------------------------------------------------------------

interface InvoiceItem {
  id: string;
  productId: string;
  batchNo: string;
  qty: number;
  ptr: number;
  gstPercent: number;
  total: number;
  stock: number;
}

interface GSTInvoice {
  id: string;
  invoiceNo: string;
  customerId: string;
  customerName: string;
  date: string;
  dueDate: string;
  items: InvoiceItem[];
  subTotal: number;
  cgstTotal: number;
  sgstTotal: number;
  grandTotal: number;
  paymentMode: string;
  status: 'Paid' | 'Unpaid' | 'Draft';
}

export default function GSTBilling() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [invoices, setInvoices] = useState<GSTInvoice[]>([]);
  const [inventory, setInventory] = useState(DEFAULT_INVENTORY);
  
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [customerId, setCustomerId] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMode, setPaymentMode] = useState('Credit');
  const [status, setStatus] = useState<'Paid' | 'Unpaid' | 'Draft'>('Unpaid');
  const [items, setItems] = useState<InvoiceItem[]>([]);

  useEffect(() => {
    const savedInvoices = localStorage.getItem('billing_gst_invoices');
    if (savedInvoices) setInvoices(JSON.parse(savedInvoices));

    const savedInventory = localStorage.getItem('billing_inventory');
    if (savedInventory) setInventory(JSON.parse(savedInventory));
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
  };

  const isBatchExpired = (expiryStr: string) => {
    const [month, year] = expiryStr.split('/');
    const expDate = new Date(Number(year), Number(month), 0); // Last day of expiry month
    return expDate < new Date();
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

  const addLineItem = () => {
    setItems([...items, { id: Date.now().toString(), productId: '', batchNo: '', qty: 1, ptr: 0, gstPercent: 0, total: 0, stock: 0 }]);
  };

  const removeLineItem = (id: string) => {
    if (window.confirm("Are you sure you want to remove this product?")) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const updateLineItem = (id: string, field: keyof InvoiceItem, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        
        if (field === 'productId') {
          const product = PRODUCTS.find(p => p.id === value);
          const batch = inventory[value]?.filter(b => b.stock > 0 && !isBatchExpired(b.expiry))[0]; // Only pick valid batches
          if (product && batch) {
            updatedItem.gstPercent = product.gst;
            updatedItem.batchNo = batch.batchNo;
            updatedItem.ptr = batch.ptr;
            updatedItem.stock = batch.stock;
          } else {
            updatedItem.batchNo = ''; updatedItem.ptr = 0; updatedItem.stock = 0;
          }
        }

        if (field === 'batchNo') {
          const batch = inventory[updatedItem.productId]?.find(b => b.batchNo === value);
          if (batch) {
            if (isBatchExpired(batch.expiry)) {
              alert(`Warning: Batch ${batch.batchNo} expired on ${batch.expiry}! Cannot be selected.`);
              return item;
            }
            updatedItem.ptr = batch.ptr;
            updatedItem.stock = batch.stock;
          }
        }

        if (field === 'qty') {
          if (value > updatedItem.stock) {
            alert(`Insufficient Stock! Only ${updatedItem.stock} units available.`);
            updatedItem.qty = updatedItem.stock;
          }
        }

        const basePrice = updatedItem.qty * updatedItem.ptr;
        const gstAmount = (basePrice * updatedItem.gstPercent) / 100;
        updatedItem.total = basePrice + gstAmount;

        return updatedItem;
      }
      return item;
    }));
  };

  const subTotal = items.reduce((sum, item) => sum + (item.qty * item.ptr), 0);
  const totalGst = items.reduce((sum, item) => sum + ((item.qty * item.ptr * item.gstPercent) / 100), 0);
  const cgstTotal = totalGst / 2; // Split equally for intra-state
  const sgstTotal = totalGst / 2;
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
    const invoiceCounter = parseInt(localStorage.getItem('billing_invoice_counter') || '1');
    const invoiceNo = `INV-HYD-26-${String(invoiceCounter).padStart(4, '0')}`;
    localStorage.setItem('billing_invoice_counter', (invoiceCounter + 1).toString());
    const dueDate = paymentMode === 'Credit' ? calculateDueDate(invoiceDate, 30) : invoiceDate;

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
      grandTotal,
      paymentMode,
      status,
    };

    // --- ERP INTEGRATIONS ---
    const newInventory = JSON.parse(JSON.stringify(inventory));
    items.forEach(item => {
      const productBatches = newInventory[item.productId];
      const batchIndex = productBatches.findIndex((b: any) => b.batchNo === item.batchNo);
      if (batchIndex >= 0) productBatches[batchIndex].stock -= item.qty;
    });

    const ledger = JSON.parse(localStorage.getItem('finance_ledger') || '[]');
    ledger.push({
      id: `LED-${Date.now()}`,
      date: invoiceDate,
      partyName: customer?.name,
      particulars: `Sales Invoice - ${invoiceNo}`,
      debit: grandTotal,
      credit: paymentMode !== 'Credit' ? grandTotal : 0,
      balance: paymentMode === 'Credit' ? grandTotal : 0
    });

    if (paymentMode === 'Credit') {
      const outstanding = JSON.parse(localStorage.getItem('finance_outstanding') || '[]');
      outstanding.push({
        id: `OUT-${Date.now()}`,
        invoiceNo,
        customerName: customer?.name,
        invoiceDate,
        dueDate,
        amount: grandTotal,
        status: 'Pending'
      });
      localStorage.setItem('finance_outstanding', JSON.stringify(outstanding));
    }

    const sales = JSON.parse(localStorage.getItem('sales_register') || '[]');
    sales.push(newInvoice);
    
    const logs = JSON.parse(localStorage.getItem('activity_logs') || '[]');
    logs.push({ text: `Generated GST Invoice ${invoiceNo} for ${customer?.name}`, time: new Date().toISOString() });
    
    localStorage.setItem('billing_gst_invoices', JSON.stringify([newInvoice, ...invoices]));
    localStorage.setItem('billing_inventory', JSON.stringify(newInventory));
    localStorage.setItem('finance_ledger', JSON.stringify(ledger));
    localStorage.setItem('sales_register', JSON.stringify(sales));
    localStorage.setItem('activity_logs', JSON.stringify(logs));

    setInvoices([newInvoice, ...invoices]);
    setInventory(newInventory);

    setIsDrawerOpen(false);
    setCustomerId('');
    setItems([]);
    setInvoiceDate(new Date().toISOString().split('T')[0]);
    setPaymentMode('Credit');
    setStatus('Unpaid');
    alert('✅ GST Invoice Generated & Modules Synchronized Successfully!');
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
        const variant = row.status === 'Paid' ? 'success' : row.status === 'Unpaid' ? 'warning' : 'neutral';
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    },
    {
      key: 'action',
      label: '',
      render: () => <button className="text-violet-600 hover:text-violet-700 p-1"><ReceiptText className="w-4 h-4" /></button>
    }
  ];

  const filteredData = invoices.filter((item) => {
    const matchSearch = item.invoiceNo.toLowerCase().includes(search.toLowerCase()) || item.customerName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="GST Billing & Invoicing"
        subtitle="Create, manage, and track GST-compliant sales invoices with auto-calculation."
        actions={
          <>
            <ActionButton variant="secondary" icon={<Download className="w-4 h-4" />}>Export Register</ActionButton>
            <ActionButton icon={<Plus className="w-4 h-4" />} onClick={() => { setIsDrawerOpen(true); setItems([]); }}>
              New Invoice
            </ActionButton>
          </>
        }
      />

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search invoice no or customer..." />
        <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
        <SelectFilter value={statusFilter} onChange={setStatusFilter} options={[{ label: 'Paid', value: 'Paid' }, { label: 'Unpaid', value: 'Unpaid' }, { label: 'Draft', value: 'Draft' }]} placeholder="All Status" />
      </FilterBar>

      <TableCard>
        <DataTable columns={columns} data={filteredData} emptyMessage="No invoices found." />
      </TableCard>

      <Drawer open={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} title="Generate GST Invoice">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Customer Selection *</label>
              <select required className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-600 text-sm" value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
                <option value="">-- Select Customer --</option>
                {CUSTOMERS.map((c:any) => <option key={c.id} value={c.id}>{c.name} ({c.type})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Invoice Date *</label>
              <input type="date" required className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-600 text-sm" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} />
            </div>
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
                      <select required className="w-full px-2 py-1.5 border border-slate-300 rounded focus:ring-2 focus:ring-violet-600 text-xs" value={item.productId} onChange={(e) => updateLineItem(item.id, 'productId', e.target.value)}>
                        <option value="">Select Medicine</option>
                        {PRODUCTS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                    <div className="col-span-5">
                      <select required className="w-full px-2 py-1.5 border border-slate-300 rounded bg-slate-50 text-xs" value={item.batchNo} onChange={(e) => updateLineItem(item.id, 'batchNo', e.target.value)}>
                        <option value="">Select Batch</option>
                        {item.productId && inventory[item.productId]?.filter(b => !isBatchExpired(b.expiry)).map(b => (
                          <option key={b.batchNo} value={b.batchNo}>
                            Batch: {b.batchNo} | Exp: {b.expiry} | Stock: {b.stock} | PTR: {formatCurrency(b.ptr)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-3">
                      <div className="flex items-center gap-2">
                        <input type="number" required min="1" max={item.stock || 1000} className="w-full px-2 py-1.5 border border-slate-300 rounded focus:ring-2 focus:ring-violet-600 text-xs" value={item.qty} onChange={(e) => updateLineItem(item.id, 'qty', parseInt(e.target.value) || 0)} placeholder="Qty" />
                      </div>
                    </div>
                  </div>
                  {item.productId && (
                    <div className="flex justify-between text-xs text-slate-600 bg-slate-50 p-2 rounded mt-1 border border-slate-100">
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
            <div className="flex justify-between text-sm text-slate-400">
              <span>CGST:</span>
              <span>{formatCurrency(cgstTotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-slate-400 border-b border-slate-700 pb-3">
              <span>SGST:</span>
              <span>{formatCurrency(sgstTotal)}</span>
            </div>
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