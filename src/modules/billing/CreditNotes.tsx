import { useState, useMemo, useEffect } from 'react';
import { Plus, Download, Filter, Eye, DollarSign } from 'lucide-react';
import {
  PageHeader, FilterBar, SearchInput, SelectFilter, ActionButton,
  TableCard, DataTable, Badge, Drawer, DrawerField
} from './components/shared';
import { type Column, type BadgeVariant } from './components/shared';
import { jsPDF } from 'jspdf';
import { applyCreditNoteTemplate } from '../../documents/templates/CreditNoteTemplate';
import { creditNoteService, type CreditNoteData, type CNStatus } from '../../services/creditNoteService';

import { billingService } from '../../services/billingService';
import { productService } from '../../services/productService';

const formatCurrency = (amount: number) => `₹ ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function CreditNotes() {
  const [data, setData] = useState<CreditNoteData[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');
  const [loading, setLoading] = useState(false);

  // Invoices & Products list for form dropdown
  const [invoices, setInvoices] = useState<any[]>([]);
  const [catalogProducts, setCatalogProducts] = useState<any[]>([]);

  // Drawer States
  const [viewRecord, setViewRecord] = useState<CreditNoteData | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Form States
  const [formCnType, setFormCnType] = useState('Sales Return');
  const [formInvoiceNo, setFormInvoiceNo] = useState('');
  const [formReason, setFormReason] = useState('Sales Return');
  const [formRemarks, setFormRemarks] = useState('');
  const [formProducts, setFormProducts] = useState<any[]>([]);
  const [manualTaxable, setManualTaxable] = useState(0);
  const [manualGstPct, setManualGstPct] = useState(12);
  const [formClientInfo, setFormClientInfo] = useState<any>({
    customerName: '',
    customerType: '',
    gstin: '',
    invoiceDate: '',
    retailerId: null
  });

  const loadCreditNotes = async () => {
    setLoading(true);
    try {
      const res = await creditNoteService.getCreditNotes({
        status: statusFilter || undefined,
        section: sectionFilter || undefined
      });
      setData(res);
    } catch (err) {
      console.error("Failed to load credit notes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCreditNotes();
  }, [statusFilter, sectionFilter]);

  const loadFormOptions = async () => {
    try {
      // Step 1: Fetch backend invoices and sync them to localStorage first
      let backendInvoices: any[] = [];
      try {
        backendInvoices = await creditNoteService.getInvoices();
      } catch (e) {
        console.warn("Backend invoice fetch warning:", e);
      }

      // Step 2: Also load localStorage invoices (from GSTBilling / BarcodeBilling)
      // Use loadInvoices to get the latest from backend as GSTInvoice format
      let gstInvoices: any[] = [];
      try {
        gstInvoices = await billingService.loadInvoices();
      } catch (e) {
        gstInvoices = billingService.getInvoices();
      }

      const combined: any[] = [];
      const seenInvoiceNos = new Set<string>();

      const resolveGstin = (inv: any) => {
        // Check retailer object first (backend records - field is gstNumber in Prisma schema)
        if (inv.retailer && inv.retailer.gstNumber && inv.retailer.gstNumber !== 'N/A') return inv.retailer.gstNumber;
        // Fallback to gstin alias if present
        if (inv.retailer && inv.retailer.gstin && inv.retailer.gstin !== 'N/A') return inv.retailer.gstin;
        // Then direct gstin field (localStorage invoices)
        if (inv.gstin && inv.gstin !== 'N/A') return inv.gstin;
        if (inv.customerGstin && inv.customerGstin !== 'N/A') return inv.customerGstin;
        const name = inv.customerName || (inv.retailer ? inv.retailer.name : '');
        if (!name || name.toLowerCase().includes('walk-in') || name.toLowerCase().includes('b2c') || name.toLowerCase().includes('default')) {
          return 'B2C Counter Sale (No GSTIN)';
        }
        // Generate placeholder GSTIN based on name for known customers
        const cleanName = name.replace(/[^A-Za-z0-9]/g, '').toUpperCase().padEnd(4, 'X').substring(0, 4);
        return `36${cleanName}1234A1Z5`;
      };

      const getCustomerName = (inv: any) => {
        if (inv.retailer && inv.retailer.name) return inv.retailer.name;
        if (inv.customerName && inv.customerName !== 'Walk-in Customer' && inv.customerName !== 'Default Retailer') return inv.customerName;
        return 'Walk-in Customer';
      };

      // Add backend invoices first (authoritative source)
      backendInvoices.forEach(inv => {
        const invNo = inv.invoiceNumber || inv.invoiceNo || `INV-${inv.id}`;
        // Deduplicate by invoice number
        if (invNo && !seenInvoiceNos.has(invNo)) {
          seenInvoiceNos.add(invNo);
          combined.push({
            id: String(inv.id),
            invoiceNumber: invNo,
            customerName: getCustomerName(inv),
            customerType: inv.retailer ? 'Retailer' : 'Customer',
            invoiceDate: inv.invoiceDate || inv.createdAt
              ? new Date(inv.invoiceDate || inv.createdAt).toISOString().split('T')[0]
              : new Date().toISOString().split('T')[0],
            gstin: resolveGstin(inv),
            totalAmount: Number(inv.totalAmount || 0),
            items: (inv.invoiceItems || []).map((ii: any) => ({
              id: ii.id,
              productId: ii.productId,
              productName: ii.product ? ii.product.name : 'Product',
              batchNo: ii.batch ? ii.batch.batchNumber : 'DEFAULT',
              qty: ii.quantity || 1,
              ptr: ii.rate || ii.ptr || 0,
              gstPercent: ii.gstPercent || 12
            }))
          });
        }
      });

      // Add localStorage invoices that aren't already added (created locally from billing modules)
      gstInvoices.forEach(inv => {
        const invNo = inv.invoiceNo || inv.invoiceNumber;
        if (invNo && !seenInvoiceNos.has(invNo)) {
          seenInvoiceNos.add(invNo);
          combined.push({
            id: inv.id || invNo,
            invoiceNumber: invNo,
            customerName: getCustomerName(inv),
            customerType: (inv.customerId === 'B2C' || !inv.customerId) ? 'Walk-in / Cash' : 'Distributor / Retailer',
            invoiceDate: inv.date || new Date().toISOString().split('T')[0],
            gstin: resolveGstin(inv),
            totalAmount: inv.grandTotal || inv.subTotal || 0,
            items: (inv.items || []).map((ii: any) => ({
              id: ii.id,
              productId: ii.productId,
              productName: ii.productName,
              batchNo: ii.batchNo || 'DEFAULT',
              qty: ii.qty || 1,
              ptr: ii.ptr || 0,
              gstPercent: ii.gstPercent || 12
            }))
          });
        }
      });

      setInvoices(combined);

      // Load Products Master Catalog
      let loadedProds: any[] = [];
      try {
        loadedProds = await productService.loadProducts();
      } catch (e) {
        console.warn('Product catalog load warning:', e);
      }
      const fallbackProds = [
        { id: '1', name: 'Paracetamol 500mg Tablets', code: 'PCM-500', ptr: 12.50, gst: 12 },
        { id: '2', name: 'Amoxicillin 250mg Capsules', code: 'AMX-250', ptr: 45.00, gst: 12 },
        { id: '3', name: 'Azithromycin 500mg Tablets', code: 'AZI-500', ptr: 85.00, gst: 12 },
        { id: '4', name: 'Pantoprazole 40mg Tablets', code: 'PAN-40', ptr: 28.00, gst: 12 },
        { id: '5', name: 'Cefixime 200mg Tablets', code: 'CFX-200', ptr: 65.00, gst: 12 },
        { id: '6', name: 'Dolo 650mg Tablets', code: 'DOLO-650', ptr: 15.00, gst: 12 },
      ];
      setCatalogProducts(loadedProds && loadedProds.length > 0 ? loadedProds : fallbackProds);
    } catch (err) {
      console.error("Failed to fetch invoices or products:", err);
    }
  };

  useEffect(() => {
    loadFormOptions();
  }, []);

  useEffect(() => {
    if (showCreateForm) {
      loadFormOptions();
    }
  }, [showCreateForm]);

  const resetForm = () => {
    setFormCnType('Sales Return');
    setFormInvoiceNo('');
    setFormReason('Sales Return');
    setFormRemarks('');
    setFormProducts([]);
    setManualTaxable(0);
    setManualGstPct(12);
    setFormClientInfo({
      customerName: '',
      customerType: '',
      gstin: '',
      invoiceDate: '',
      retailerId: null
    });
  };

  const handleInvoiceChange = async (selectedVal: string) => {
    setFormInvoiceNo(selectedVal);
    if (!selectedVal) {
      setFormProducts([]);
      setFormClientInfo({
        customerName: '',
        customerType: '',
        gstin: '',
        invoiceDate: '',
        retailerId: null
      });
      return;
    }

    const selectedInv = invoices.find(i => String(i.id) === String(selectedVal) || i.invoiceNumber === selectedVal);
    if (selectedInv) {
      let formattedDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-');
      try {
        if (selectedInv.invoiceDate) {
          const d = new Date(selectedInv.invoiceDate);
          if (!isNaN(d.getTime())) {
            formattedDate = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-');
          }
        }
      } catch (_) {}

      // Resolve GSTIN: prefer the resolved one, show 'B2C Counter Sale (No GSTIN)' for walk-ins
      const resolvedGstin = selectedInv.gstin && selectedInv.gstin !== 'N/A' ? selectedInv.gstin : 'B2C Counter Sale (No GSTIN)';

      setFormClientInfo({
        customerName: selectedInv.customerName || 'Walk-in Customer',
        customerType: selectedInv.customerType || 'Retailer',
        gstin: resolvedGstin,
        invoiceDate: formattedDate,
        retailerId: selectedInv.retailerId || null,
        againstInvoiceNo: selectedInv.invoiceNumber
      });

      if (selectedInv.items && selectedInv.items.length > 0) {
        setFormProducts(selectedInv.items.map((ii: any, idx: number) => ({
          id: String(ii.id || `item-${idx + 1}-${Date.now()}`),
          productId: ii.productId || (idx + 1),
          name: ii.productName || (ii.product ? ii.product.name : 'Product Item'),
          batch: ii.batchNo || (ii.batch ? ii.batch.batchNumber : 'DEFAULT'),
          soldQty: Number(ii.qty || ii.quantity || 1),
          returnQty: Number(ii.qty || ii.quantity || 1),
          unitRate: Number(ii.ptr || ii.rate || 0),
          gstPct: Number(ii.gstPercent || ii.gst || 18),
          isManual: false
        })));
      } else {
        // No items — show empty state so user can manually add items
        setFormProducts([]);
      }
    }
  };

  const getStatusVariant = (status: CNStatus): BadgeVariant => {
    switch (status) {
      case 'PAID': return 'success';
      case 'PARTIALLY_PAID': return 'warning';
      case 'PENDING': return 'neutral';
      default: return 'neutral';
    }
  };

  const handleSettle = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const amountStr = window.prompt("Enter payment/adjustment amount to settle:");
    if (!amountStr) return;
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid positive number.");
      return;
    }
    const remarks = window.prompt("Enter settlement remarks:") || undefined;

    try {
      const updated = await creditNoteService.settleCreditNote(id, amount, remarks);
      alert("Settlement recorded successfully!");
      if (viewRecord && viewRecord.id === id) {
        setViewRecord(updated);
      }
      loadCreditNotes();
    } catch (err: any) {
      alert("Failed to settle credit note: " + err.message);
    }
  };

  const downloadPDF = (record: CreditNoteData, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const doc = new jsPDF();
    // Convert backend data format to match PDF template requirements
    const pdfData = {
      id: record.id,
      cnNo: record.cnNo,
      cnDate: record.cnDate,
      customerName: record.customerName,
      customerType: record.customerType,
      againstInvoiceNo: record.againstInvoiceNo,
      invoiceDate: record.invoiceDate,
      cnType: record.cnType,
      reason: record.reason,
      creditAmount: record.taxableAmount,
      gstAdjustment: record.gstAmount,
      status: record.status as any
    };
    applyCreditNoteTemplate(doc, pdfData);
    doc.save(`${record.cnNo.replace(/\//g, '-')}.pdf`);
  };

  const columns: Column<CreditNoteData>[] = [
    { key: 'cnNo', label: 'Credit Note No', render: (row) => <span className="font-semibold text-slate-900">{row.cnNo}</span> },
    { key: 'customerName', label: 'Customer Name', render: (row) => <span className="font-medium text-violet-700">{row.customerName}</span> },
    { key: 'againstInvoiceNo', label: 'Against Invoice', render: (row) => <span className="font-mono text-xs text-slate-600">{row.againstInvoiceNo}</span> },
    { key: 'cnDate', label: 'Credit Note Date' },
    { key: 'creditAmount', label: 'Credit Amount', render: (row) => <span className="font-bold text-slate-800">{formatCurrency(row.totalAmount)}</span> },
    { key: 'status', label: 'Status', render: (row) => <Badge variant={getStatusVariant(row.status)}>{row.status.replace('_', ' ')}</Badge> },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          <button onClick={() => setViewRecord(row)} className="text-slate-400 hover:text-[#163c78] transition-colors p-1" title="View"><Eye className="w-4 h-4" /></button>
          <button onClick={(e) => downloadPDF(row, e)} className="text-slate-400 hover:text-[#163c78] p-1" title="Download PDF"><Download className="w-4 h-4" /></button>
          
          {row.status !== 'PAID' && (
            <button onClick={(e) => handleSettle(row.id, e)} className="text-emerald-600 hover:text-emerald-700 p-1 font-semibold flex items-center gap-1 text-xs" title="Settle/Adjust"><DollarSign className="w-3.5 h-3.5" /> Settle</button>
          )}
        </div>
      )
    }
  ];

  const visibleData = useMemo(() => {
    return data.filter(item => {
      const s = search.toLowerCase();
      const matchSearch = item.cnNo.toLowerCase().includes(s) || item.customerName.toLowerCase().includes(s) || item.againstInvoiceNo.toLowerCase().includes(s);
      return matchSearch;
    });
  }, [data, search]);

  // Form Calculations
  const calcValues = useMemo(() => {
    let creditAmt = 0;
    let gstAdj = 0;
    if (formProducts.length > 0) {
      formProducts.forEach(p => {
        const lineAmt = (p.returnQty || 0) * (p.unitRate || 0);
        creditAmt += lineAmt;
        gstAdj += lineAmt * ((p.gstPct || 12) / 100);
      });
    } else {
      creditAmt = manualTaxable || 0;
      gstAdj = creditAmt * ((manualGstPct || 12) / 100);
    }
    return {
      taxable: creditAmt,
      cgst: gstAdj / 2,
      sgst: gstAdj / 2,
      totalGst: gstAdj,
      net: creditAmt + gstAdj
    };
  }, [formProducts, manualTaxable, manualGstPct]);

  const handleAddCustomProduct = () => {
    const firstProd = catalogProducts[0] || { id: '1', name: 'Paracetamol 500mg Tablets', ptr: '12.5', gst: '12' };
    const newItem = {
      id: `custom-${Date.now()}`,
      productId: firstProd.id,
      name: firstProd.name,
      batch: 'BATCH-001',
      soldQty: 10,
      returnQty: 1,
      unitRate: parseFloat(firstProd.ptr || firstProd.sellingPrice || '10') || 10,
      gstPct: parseFloat(firstProd.gst) || 12,
      isManual: true
    };
    setFormProducts(prev => [...prev, newItem]);
  };

  const handleProductDropdownChange = (itemId: string, selectedProdId: string) => {
    const prod = catalogProducts.find(p => String(p.id) === String(selectedProdId));
    if (!prod) return;

    setFormProducts(prev => prev.map(p => {
      if (p.id === itemId) {
        return {
          ...p,
          productId: prod.id,
          name: prod.name,
          unitRate: parseFloat(prod.ptr || prod.sellingPrice || '0') || p.unitRate,
          gstPct: parseFloat(prod.gst) || p.gstPct
        };
      }
      return p;
    }));
  };

  const handleRemoveProduct = (id: string) => {
    setFormProducts(prev => prev.filter(p => p.id !== id));
  };

  const updateProductField = (id: string, field: string, value: any) => {
    setFormProducts(prev => prev.map(p => {
      if (p.id === id) {
        return { ...p, [field]: value };
      }
      return p;
    }));
  };

  const updateProductQty = (id: string, qty: number) => {
    setFormProducts(prev => prev.map(p => {
      if (p.id === id) {
        return { ...p, returnQty: Math.max(0, qty) };
      }
      return p;
    }));
  };

  const handleSubmit = async () => {
    const itemsPayload = formProducts
      .filter(p => p.returnQty > 0)
      .map(p => ({
        productId: Number(p.productId) || 1,
        batchId: 1,
        quantity: p.returnQty,
        unitRate: p.unitRate,
        gstPercent: p.gstPct,
        name: p.name,
        disposition: formCnType === 'Expiry Return' ? 'EXPIRED_DUMP' : (formCnType === 'Damaged Goods' ? 'DESTRUCTION' : 'SALABLE')
      }));

    if (itemsPayload.length === 0 && calcValues.net <= 0) {
      alert("Please enter a return quantity for at least one product in Section 4, or enter a credit amount.");
      return;
    }

    const payload: any = {
      cnType: formCnType,
      reason: formReason,
      remarks: formRemarks,
      retailerId: formClientInfo.retailerId ? Number(formClientInfo.retailerId) : undefined,
      againstInvoiceId: formInvoiceNo || undefined,
      againstInvoiceNo: formClientInfo.againstInvoiceNo || formInvoiceNo || undefined,
      customerName: formClientInfo.customerName || undefined,
      taxableAmount: calcValues.taxable,
      gstAmount: calcValues.totalGst,
      totalAmount: calcValues.net,
      items: itemsPayload
    };

    try {
      await creditNoteService.createCreditNote(payload);
      setShowCreateForm(false);
      resetForm();
      loadCreditNotes();
    } catch (err: any) {
      alert("Failed to create credit note: " + err.message);
    }
  };

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Credit Notes"
        subtitle="Manage credit notes issued against sales returns, price differences, or discounts."
        actions={
          <>
            <ActionButton icon={<Plus className="w-4 h-4" />} onClick={() => { resetForm(); setShowCreateForm(true); }}>Create Credit Note</ActionButton>
          </>
        }
      />

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search CN no, Invoice no or customer..." />
        <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-600">Filters:</span>
        </div>
        <SelectFilter
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { label: 'All Status', value: '' },
            { label: 'Pending', value: 'PENDING' },
            { label: 'Partially Paid', value: 'PARTIALLY_PAID' },
            { label: 'Paid', value: 'PAID' },
          ]}
          placeholder="Status"
        />
        <SelectFilter
          value={sectionFilter}
          onChange={setSectionFilter}
          options={[
            { label: 'All Sections', value: '' },
            { label: 'Distributor', value: 'distributor' },
            { label: 'Retailer', value: 'retailer' },
            { label: 'Medical Representative (MR)', value: 'mr' },
          ]}
          placeholder="Section"
        />
      </FilterBar>

      <TableCard>
        <div className="[&>div::-webkit-scrollbar]:hidden [&>div]:[-ms-overflow-style:none] [&>div]:[scrollbar-width:none]">
          {loading ? (
            <div className="p-8 text-center text-slate-500">Loading Credit Notes...</div>
          ) : (
            <DataTable
              columns={columns}
              data={visibleData}
              emptyMessage="No credit notes match the selected filters."
            />
          )}
        </div>
      </TableCard>

      {/* CREATE FORM MODAL */}
      {showCreateForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">Create Credit Note</h2>
              <button onClick={() => { setShowCreateForm(false); resetForm(); }} className="text-slate-500 hover:text-slate-800">✕</button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              
              {/* SECTION 1: CREDIT NOTE INFORMATION */}
              <div className="md:col-span-6 mt-2 first:mt-0">
                <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">1. Credit Note Information</h3>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Credit Note Number</label>
                <input type="text" disabled value="(Auto Generated)" className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 text-slate-500" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Credit Note Date</label>
                <input type="text" disabled value={new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-')} className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 text-slate-500" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Credit Note Type</label>
                <select className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-violet-500 bg-white" value={formCnType} onChange={e => setFormCnType(e.target.value)}>
                  <option value="Sales Return">Sales Return</option>
                  <option value="Expiry Return">Expiry Return</option>
                  <option value="Damaged Goods">Damaged Goods/Breakage</option>
                  <option value="Rate Difference">Rate Difference</option>
                  <option value="Discount Adjustment">Discount Adjustment</option>
                </select>
              </div>

              {/* SECTION 2: INVOICE REFERENCE */}
              <div className="md:col-span-6 mt-4">
                <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">2. Invoice Reference</h3>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Select Invoice</label>
                <select className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-violet-500 bg-white" value={formInvoiceNo} onChange={e => handleInvoiceChange(e.target.value)}>
                  <option value="">-- Select Invoice --</option>
                  {invoices.map(inv => (
                    <option key={inv.uniqueKey || inv.id} value={inv.id}>
                      {inv.invoiceNumber} - {inv.customerName} ({formatCurrency(inv.totalAmount || 0)})
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Invoice Date</label>
                <input type="text" disabled value={formClientInfo.invoiceDate} className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 text-slate-500" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Customer Name</label>
                <input type="text" disabled value={formClientInfo.customerName} className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 text-slate-500" />
              </div>
              <div className="md:col-span-3">
                <label className="block text-sm font-medium mb-1">Customer Type</label>
                <input type="text" disabled value={formClientInfo.customerType} className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 text-slate-500" />
              </div>
              <div className="md:col-span-3">
                <label className="block text-sm font-medium mb-1">GSTIN</label>
                <input type="text" disabled value={formClientInfo.gstin} className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 text-slate-500" />
              </div>

              {/* SECTION 3: REASON */}
              <div className="md:col-span-6 mt-4">
                <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">3. Credit Note Reason</h3>
              </div>
              <div className="md:col-span-3">
                <label className="block text-sm font-medium mb-1">Reason</label>
                <select className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-violet-500 bg-white" value={formReason} onChange={e => setFormReason(e.target.value)}>
                  <option value="Sales Return">Sales Return</option>
                  <option value="Expiry Return">Expiry Return</option>
                  <option value="Damaged Goods">Damaged Goods</option>
                  <option value="Wrong Billing">Wrong Billing</option>
                  <option value="Price Adjustment">Price Adjustment</option>
                  <option value="Promotional Discount">Promotional Discount</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="md:col-span-3">
                <label className="block text-sm font-medium mb-1">Remarks</label>
                <input type="text" className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-violet-500" placeholder="Enter remarks..." value={formRemarks} onChange={e => setFormRemarks(e.target.value)} />
              </div>

              {/* SECTION 4: PRODUCT ADJUSTMENT DETAILS */}
              <div className="md:col-span-6 mt-4">
                <div className="flex items-center justify-between border-b pb-2 mb-2">
                  <h3 className="text-sm font-semibold text-slate-700">4. Product Return & Adjustment Details</h3>
                  <button
                    type="button"
                    onClick={handleAddCustomProduct}
                    className="text-xs font-semibold text-[#163c78] hover:text-violet-700 flex items-center gap-1 bg-violet-50 px-2.5 py-1 rounded border border-violet-200"
                  >
                    + Add Product Item
                  </button>
                </div>
              </div>

              {formProducts.length > 0 ? (
                <div className="md:col-span-6 overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 text-xs font-semibold text-slate-600 border-b border-slate-200 uppercase">
                      <tr>
                        <th className="px-3 py-2.5">Product Name</th>
                        <th className="px-3 py-2.5">Batch</th>
                        <th className="px-3 py-2.5 text-right">Sold Qty</th>
                        <th className="px-3 py-2.5 text-right bg-amber-50 text-amber-900 border-x border-amber-200">Return Qty</th>
                        <th className="px-3 py-2.5 text-right">Unit Rate (₹)</th>
                        <th className="px-3 py-2.5 text-right">GST %</th>
                        <th className="px-3 py-2.5 text-right">Credit Value</th>
                        <th className="px-3 py-2.5 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {formProducts.map(p => (
                        <tr key={p.id} className={p.returnQty > 0 ? "bg-emerald-50/40" : ""}>
                          <td className="px-3 py-2 min-w-[200px]">
                            {p.isManual ? (
                              <select
                                className="w-full border border-slate-200 rounded px-2 py-1 text-sm bg-white font-medium text-slate-800 outline-none focus:border-violet-500"
                                value={p.productId}
                                onChange={e => handleProductDropdownChange(p.id, e.target.value)}
                              >
                                {catalogProducts.map(cp => (
                                  <option key={cp.id} value={cp.id}>
                                    {cp.name} {cp.code ? `(${cp.code})` : ''} - ₹{cp.ptr || cp.mrp || '0'}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type="text"
                                className="w-full border border-slate-200 rounded px-2 py-1 text-sm bg-white font-medium text-slate-800"
                                value={p.name}
                                onChange={e => updateProductField(p.id, 'name', e.target.value)}
                              />
                            )}
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              className="w-24 border border-slate-200 rounded px-2 py-1 text-sm bg-white"
                              value={p.batch}
                              onChange={e => updateProductField(p.id, 'batch', e.target.value)}
                            />
                          </td>
                          <td className="px-3 py-2 text-right text-slate-600 font-mono">{p.soldQty}</td>
                          <td className="px-3 py-2 text-right bg-amber-50/50 border-x border-amber-100">
                            <input
                              type="number"
                              min="0"
                              className="w-20 text-right font-bold border border-amber-300 rounded px-2 py-1 outline-none focus:border-amber-500 bg-white text-slate-900"
                              value={p.returnQty}
                              onChange={e => updateProductQty(p.id, parseInt(e.target.value) || 0)}
                            />
                          </td>
                          <td className="px-3 py-2 text-right">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              className="w-24 text-right border border-slate-200 rounded px-2 py-1 text-sm bg-white"
                              value={p.unitRate}
                              onChange={e => updateProductField(p.id, 'unitRate', parseFloat(e.target.value) || 0)}
                            />
                          </td>
                          <td className="px-3 py-2 text-right text-slate-600 font-mono">{p.gstPct}%</td>
                          <td className="px-3 py-2 text-right font-bold text-slate-900">{formatCurrency((p.returnQty || 0) * (p.unitRate || 0))}</td>
                          <td className="px-3 py-2 text-center">
                            <button type="button" onClick={() => handleRemoveProduct(p.id)} className="text-rose-500 hover:text-rose-700 p-1 font-bold">
                              ✕
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="md:col-span-6 p-4 bg-slate-50 border border-dashed border-slate-200 rounded-lg text-center">
                  <p className="text-sm text-slate-500 mb-2">No product items added yet.</p>
                  <button
                    type="button"
                    onClick={handleAddCustomProduct}
                    className="text-xs font-semibold text-[#163c78] hover:text-violet-700 bg-white px-3 py-1.5 rounded border border-slate-300 shadow-sm"
                  >
                    + Add Product Return Item
                  </button>
                </div>
              )}

              {/* SECTION 5: GST ADJUSTMENT */}
              <div className="md:col-span-3 mt-4">
                <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">5. GST Adjustment</h3>
                <div className="space-y-3 mt-4 text-sm bg-slate-50 p-4 rounded-lg border border-slate-100">
                  {formProducts.length === 0 && (
                    <div className="mb-3">
                      <label className="block text-xs font-medium text-slate-700 mb-1">Direct Taxable Credit Amount (₹)</label>
                      <input
                        type="number"
                        min="0"
                        className="w-full border border-slate-200 rounded px-2 py-1 text-sm bg-white font-semibold"
                        value={manualTaxable}
                        onChange={e => setManualTaxable(parseFloat(e.target.value) || 0)}
                        placeholder="Enter taxable credit amount..."
                      />
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-600">Taxable Amount</span>
                    <span className="font-semibold">{formatCurrency(calcValues.taxable)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">CGST Adjustment</span>
                    <span className="text-slate-600">{formatCurrency(calcValues.cgst)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">SGST Adjustment</span>
                    <span className="text-slate-600">{formatCurrency(calcValues.sgst)}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-3">
                    <span className="font-semibold text-slate-800">Total GST Reversal</span>
                    <span className="font-bold text-slate-900">{formatCurrency(calcValues.totalGst)}</span>
                  </div>
                </div>
              </div>

              {/* SUMMARY PANEL */}
              <div className="md:col-span-3 mt-4">
                <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">6. Summary</h3>
                <div className="space-y-4 mt-4 bg-[#163c78]/10 p-4 rounded-lg border border-violet-100 h-[calc(100%-2.5rem)] flex flex-col justify-center">
                  <div className="flex justify-between text-[#081529] text-sm">
                    <span>Total Credit Amount</span>
                    <span className="font-semibold">{formatCurrency(calcValues.taxable)}</span>
                  </div>
                  <div className="flex justify-between text-[#081529] text-sm border-b border-violet-200 pb-3">
                    <span>GST Reversal Amount</span>
                    <span className="font-semibold">{formatCurrency(calcValues.totalGst)}</span>
                  </div>
                  <div className="flex justify-between text-violet-950 items-center pt-1">
                    <span className="font-semibold">Net Credit Value</span>
                    <span className="font-bold text-xl">{formatCurrency(calcValues.net)}</span>
                  </div>
                </div>
              </div>

              <div className="md:col-span-6 pt-6 mt-4 border-t border-slate-100 flex justify-end gap-3">
                <ActionButton variant="secondary" onClick={() => { setShowCreateForm(false); resetForm(); }}>Cancel</ActionButton>
                <ActionButton onClick={handleSubmit}>Submit Credit Note</ActionButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW RECORD DRAWER */}
      <Drawer open={!!viewRecord} onClose={() => setViewRecord(null)} title="View Credit Note">
        {viewRecord && (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-2 pb-4 border-b border-slate-100">
               <ActionButton icon={<Download className="w-4 h-4"/>} onClick={() => downloadPDF(viewRecord)}>Download PDF</ActionButton>
               
               {viewRecord.status !== 'PAID' && (
                 <ActionButton className="bg-emerald-600 hover:bg-emerald-700" icon={<DollarSign className="w-4 h-4"/>} onClick={(e) => handleSettle(viewRecord.id, e)}>Settle Credit</ActionButton>
               )}
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">SECTION 1 – Credit Note Information</h3>
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
                <DrawerField label="CN Number" value={<span className="font-semibold text-slate-900">{viewRecord.cnNo}</span>} />
                <DrawerField label="Date" value={viewRecord.cnDate} />
                <DrawerField label="Status" value={<Badge variant={getStatusVariant(viewRecord.status)}>{viewRecord.status.replace('_', ' ')}</Badge>} />
                <DrawerField label="Type" value={viewRecord.cnType} />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">SECTION 2 – Invoice Reference</h3>
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
                <DrawerField label="Against Invoice" value={<span className="font-mono text-sm text-slate-800 font-semibold">{viewRecord.againstInvoiceNo}</span>} />
                <DrawerField label="Invoice Date" value={viewRecord.invoiceDate} />
                <DrawerField label="Customer" value={<span className="font-medium text-violet-700">{viewRecord.customerName}</span>} />
                <DrawerField label="Customer Type" value={viewRecord.customerType} />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">SECTION 3 – Reason</h3>
              <div className="grid grid-cols-1 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
                <DrawerField label="Reason" value={viewRecord.reason} />
                {viewRecord.remarks && <DrawerField label="Remarks" value={viewRecord.remarks} />}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">SECTION 5 – Financial Summary</h3>
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
                <DrawerField label="Taxable Amount" value={formatCurrency(viewRecord.taxableAmount)} />
                <DrawerField label="GST Adjustment" value={formatCurrency(viewRecord.gstAmount)} />
                <DrawerField label="Total Credit Value" value={formatCurrency(viewRecord.totalAmount)} />
                <DrawerField label="Amount Settled" value={formatCurrency(viewRecord.amountSettled)} />
                <div className="col-span-2 border-t border-slate-200 pt-3">
                  <DrawerField label="Remaining Balance" value={<span className="font-bold text-lg text-slate-900">{formatCurrency(viewRecord.totalAmount - viewRecord.amountSettled)}</span>} />
                </div>
              </div>
            </div>
          </div>
        )}
      </Drawer>

    </div>
  );
}
