import { useState, useMemo, useEffect } from 'react';
import {
  Plus, Download, Eye, DollarSign, RefreshCw, CheckCircle2,
  AlertTriangle, Layers, ArrowDownLeft, ArrowUpRight, Loader2, Store, FileText
} from 'lucide-react';
import {
  PageHeader, FilterBar, SearchInput, SelectFilter, ActionButton,
  TableCard, DataTable, Badge, Drawer, DrawerField, SummaryCard
} from './components/shared';
import { type Column, type BadgeVariant } from './components/shared';
import { jsPDF } from 'jspdf';
import { applyCreditNoteTemplate, type CreditNotePdfData } from '../../documents/templates/CreditNoteTemplate';
import { productService } from '../../services/productService';
import { creditNoteService, type CreditNoteData, type CreditNoteInput } from '../../services/creditNoteService';
import { ProductSearchDropdown, type CatalogProduct } from '../../shared/components/ProductSearchDropdown';

const formatCurrency = (amount: number = 0) =>
  `₹ ${(Number(amount) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export interface RetailerCreditNote {
  id: string;
  cnNo: string;
  cnDate: string;
  distributorName: string;
  distributorCode?: string;
  againstInvoiceNo: string;
  invoiceDate: string;
  reason: string;
  taxableAmount: number;
  gstAmount: number;
  totalAmount: number;
  status: 'PENDING' | 'APPROVED' | 'SETTLED';
  remarks?: string;
  disposition: 'SALABLE' | 'QUARANTINE_DUMP' | 'FINANCIAL_ONLY';
  direction: 'RECEIVED' | 'MY_CLAIM';
  items: Array<{
    id: number;
    productName: string;
    productCode: string;
    batchNumber: string;
    expiryDate: string;
    quantity: number;
    rate: number;
    gstPercent: number;
    totalAmount: number;
  }>;
}

const DEFAULT_REASONS = [
  'Sales Return',
  'Expiry Return',
  'Damaged Goods/Breakage',
  'Rate Difference',
  'Discount Adjustment'
];

const INITIAL_RETAILER_NOTES: RetailerCreditNote[] = [
  {
    id: 'cn-ret-001',
    cnNo: 'CN-DIST-2026-0001',
    cnDate: '26-Nov-2026',
    distributorName: 'Apex Healthcare Distributors',
    distributorCode: 'DIST-004',
    againstInvoiceNo: 'INV-20261120-0018',
    invoiceDate: '20-Nov-2026',
    reason: 'Sales Return',
    taxableAmount: 4500.0,
    gstAmount: 540.0,
    totalAmount: 5040.0,
    status: 'SETTLED',
    direction: 'RECEIVED',
    remarks: 'Slow moving inventory returned in salable condition',
    disposition: 'SALABLE',
    items: [
      {
        id: 1,
        productName: 'Paracetamol 650mg Tabs',
        productCode: 'PRD-001',
        batchNumber: 'BAT-2026-09A',
        expiryDate: '12/2027',
        quantity: 20,
        rate: 225.0,
        gstPercent: 12,
        totalAmount: 5040.0
      }
    ]
  },
  {
    id: 'cn-ret-002',
    cnNo: 'CN-DIST-2026-0002',
    cnDate: '25-Nov-2026',
    distributorName: 'Metro Pharma Wholesale Stockists',
    distributorCode: 'DIST-009',
    againstInvoiceNo: 'INV-20261115-0089',
    invoiceDate: '15-Nov-2026',
    reason: 'Expiry Return',
    taxableAmount: 7200.0,
    gstAmount: 864.0,
    totalAmount: 8064.0,
    status: 'APPROVED',
    direction: 'RECEIVED',
    remarks: 'Short expiry batches recalled and credited to account',
    disposition: 'QUARANTINE_DUMP',
    items: [
      {
        id: 2,
        productName: 'Amoxicillin 500mg Capsules',
        productCode: 'PRD-004',
        batchNumber: 'BAT-2024-EXP01',
        expiryDate: '11/2026',
        quantity: 15,
        rate: 480.0,
        gstPercent: 12,
        totalAmount: 8064.0
      }
    ]
  },
  {
    id: 'cn-ret-003',
    cnNo: 'CLM-RET-2026-0012',
    cnDate: '27-Nov-2026',
    distributorName: 'Apex Healthcare Distributors',
    distributorCode: 'DIST-004',
    againstInvoiceNo: 'INV-20261122-0045',
    invoiceDate: '22-Nov-2026',
    reason: 'Damaged Goods/Breakage',
    taxableAmount: 1850.0,
    gstAmount: 222.0,
    totalAmount: 2072.0,
    status: 'PENDING',
    direction: 'MY_CLAIM',
    remarks: 'Transit breakage claim submitted for inspection',
    disposition: 'QUARANTINE_DUMP',
    items: [
      {
        id: 3,
        productName: 'Cough Syrup 100ml Glass Bottle',
        productCode: 'PRD-019',
        batchNumber: 'BAT-2026-BRK02',
        expiryDate: '08/2027',
        quantity: 10,
        rate: 185.0,
        gstPercent: 12,
        totalAmount: 2072.0
      }
    ]
  }
];

function getSubmittedClaimIds(): Set<string> {
  try {
    const raw = localStorage.getItem('retailer_submitted_claims');
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function mapServiceNoteToRetailerNote(cn: CreditNoteData): RetailerCreditNote {
  let disposition: 'SALABLE' | 'QUARANTINE_DUMP' | 'FINANCIAL_ONLY' = 'SALABLE';
  const reasonStr = cn.reason || cn.cnType || 'Sales Return';
  if (reasonStr === 'Expiry Return' || reasonStr === 'Damaged Goods/Breakage') {
    disposition = 'QUARANTINE_DUMP';
  } else if (reasonStr === 'Rate Difference' || reasonStr === 'Discount Adjustment') {
    disposition = 'FINANCIAL_ONLY';
  }

  const items = (cn.items || []).map((it, idx) => ({
    id: it.id || idx + 1,
    productName: it.product?.name || 'Pharmaceutical Supplies',
    productCode: it.product?.code || 'PRD-GEN',
    batchNumber: it.batch?.batchNumber || 'BAT-01',
    expiryDate: '12/2027',
    quantity: it.quantity || 1,
    rate: it.rate || 0,
    gstPercent: it.gstPercent || 12,
    totalAmount: it.totalAmount || ((it.quantity || 1) * (it.rate || 0) * 1.12)
  }));

  const submittedSet = getSubmittedClaimIds();
  const isClaim = 
    submittedSet.has(String(cn.id)) ||
    submittedSet.has(String(cn.cnNo)) ||
    (cn as any).direction === 'MY_CLAIM' ||
    cn.status === 'PENDING' || 
    cn.status === 'SUBMITTED' || 
    cn.remarks?.toLowerCase().includes('claim') || 
    cn.remarks?.toLowerCase().includes('retailer') ||
    cn.remarks?.toLowerCase().includes('trying to create') ||
    cn.customerName === 'My Retail Chemist Pharmacy' ||
    cn.customerName?.toLowerCase().includes('retail') ||
    cn.customerName?.toLowerCase().includes('pharmacy');

  return {
    id: String(cn.id),
    cnNo: cn.cnNo,
    cnDate: cn.cnDate,
    distributorName: cn.distributorId ? `Distributor DIST-00${cn.distributorId}` : 'Authorized Stockist',
    distributorCode: cn.distributorId ? `DIST-00${cn.distributorId}` : 'DIST-MAIN',
    againstInvoiceNo: cn.againstInvoiceNo || 'N/A',
    invoiceDate: cn.invoiceDate || cn.cnDate,
    reason: reasonStr,
    taxableAmount: Number(cn.taxableAmount || 0),
    gstAmount: Number(cn.gstAmount || 0),
    totalAmount: Number(cn.totalAmount || 0),
    status: (cn.status === 'PAID' ? 'SETTLED' : cn.status) as any,
    direction: isClaim ? 'MY_CLAIM' : 'RECEIVED',
    remarks: cn.remarks || undefined,
    disposition,
    items: items.length > 0 ? items : [
      {
        id: 1,
        productName: 'Pharmaceutical Supplies (Preserved Batch)',
        productCode: 'PRD-GEN',
        batchNumber: 'BAT-GEN',
        expiryDate: '12/2027',
        quantity: 1,
        rate: Number(cn.taxableAmount || cn.totalAmount || 100),
        gstPercent: 12,
        totalAmount: Number(cn.totalAmount || 112)
      }
    ]
  };
}

export default function RetailerCreditNotes() {
  const [data, setData] = useState<RetailerCreditNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'RECEIVED' | 'MY_CLAIM'>('RECEIVED');
  const [search, setSearch] = useState('');
  const [reasonFilter, setReasonFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Catalog products for searchable dropdown
  const [catalogList, setCatalogList] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [selectedInvoiceItems, setSelectedInvoiceItems] = useState<CatalogProduct[]>([]);

  // Drawers & Modals
  const [viewRecord, setViewRecord] = useState<RetailerCreditNote | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddReasonModal, setShowAddReasonModal] = useState(false);
  const [newReasonInput, setNewReasonInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Custom reasons state
  const [customReasons, setCustomReasons] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('custom_cn_types');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const allReasons = useMemo(() => {
    const list = [...DEFAULT_REASONS];
    customReasons.forEach(r => {
      if (!list.includes(r)) list.push(r);
    });
    return list;
  }, [customReasons]);

  // Form State
  const [formDistributor, setFormDistributor] = useState('Apex Healthcare Distributors');
  const [formInvoiceNo, setFormInvoiceNo] = useState('');
  const [formInvoiceDate, setFormInvoiceDate] = useState('28-Nov-2026');
  const [formReason, setFormReason] = useState('Sales Return');
  const [formRemarks, setFormRemarks] = useState('');

  // Items in form
  const [formItems, setFormItems] = useState([
    {
      productName: '',
      productCode: '',
      batchNumber: '',
      expiryDate: '',
      quantity: 1,
      rate: 100,
      gstPercent: 12
    }
  ]);

  // Load real data from DB
  const loadData = async () => {
    setLoading(true);
    try {
      const dbNotes = await creditNoteService.getCreditNotes();
      if (dbNotes && dbNotes.length > 0) {
        const mapped = dbNotes.map(mapServiceNoteToRetailerNote);
        setData(mapped);
      } else {
        const saved = localStorage.getItem('retailer_credit_notes');
        setData(saved ? JSON.parse(saved) : INITIAL_RETAILER_NOTES);
      }
    } catch (err) {
      console.warn('Failed to load credit notes from DB, using fallback:', err);
      const saved = localStorage.getItem('retailer_credit_notes');
      setData(saved ? JSON.parse(saved) : INITIAL_RETAILER_NOTES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Load available catalog products for the searchable dropdown
    try {
      const currentProducts = productService.getProducts();
      if (Array.isArray(currentProducts) && currentProducts.length > 0) {
        setCatalogList(currentProducts);
      }
      if (typeof productService.loadProducts === 'function') {
        productService.loadProducts().then(res => {
          if (Array.isArray(res) && res.length > 0) {
            setCatalogList(res);
          }
        }).catch(() => {});
      }
    } catch (err) {
      console.warn('Error reading product catalog:', err);
    }

    // Load available invoices
    creditNoteService.getInvoices().then(invs => {
      if (Array.isArray(invs) && invs.length > 0) {
        setInvoices(invs);
      }
    }).catch(() => {});
  }, []);

  const handleSaveNewReason = () => {
    const trimmed = newReasonInput.trim();
    if (!trimmed) return;
    if (!customReasons.includes(trimmed)) {
      const updated = [...customReasons, trimmed];
      setCustomReasons(updated);
      localStorage.setItem('custom_cn_types', JSON.stringify(updated));
    }
    setFormReason(trimmed);
    setNewReasonInput('');
    setShowAddReasonModal(false);
  };

  // When retailer selects an invoice from dropdown
  const handleSelectInvoice = (selectedInvNo: string) => {
    setFormInvoiceNo(selectedInvNo);
    if (!selectedInvNo) {
      setSelectedInvoiceItems([]);
      return;
    }

    const found = invoices.find(i => (i.invoiceNumber || i.invoiceNo) === selectedInvNo);
    if (found) {
      const invDate = found.invoiceDate || found.date || '28-Nov-2026';
      setFormInvoiceDate(invDate);

      // Extract items from invoice with multi-tier resolution
      let rawItems: any[] = [];
      if (Array.isArray(found.items) && found.items.length > 0) {
        rawItems = found.items;
      } else if (found.jsonPayload) {
        let payloadObj = found.jsonPayload;
        if (typeof payloadObj === 'string') {
          try { payloadObj = JSON.parse(payloadObj); } catch(e) {}
        }
        if (payloadObj && Array.isArray(payloadObj.items) && payloadObj.items.length > 0) {
          rawItems = payloadObj.items;
        }
      } else if (Array.isArray(found.invoiceItems) && found.invoiceItems.length > 0) {
        rawItems = found.invoiceItems;
      }

      // Check dedicated local storage cache
      if (rawItems.length === 0) {
        try {
          const dedicatedRaw = localStorage.getItem(`billing_invoice_items_${selectedInvNo}`) || 
                               localStorage.getItem(`billing_invoice_items_${found.id}`);
          if (dedicatedRaw) {
            const parsed = JSON.parse(dedicatedRaw);
            if (Array.isArray(parsed) && parsed.length > 0) {
              rawItems = parsed;
            }
          }
        } catch(e) {}
      }

      // Check billing_gst_invoices
      if (rawItems.length === 0) {
        try {
          const savedGst = JSON.parse(localStorage.getItem('billing_gst_invoices') || '[]');
          const match = savedGst.find((g: any) => (g.invoiceNo || g.invoiceNumber) === selectedInvNo || g.id === found.id);
          if (match && Array.isArray(match.items) && match.items.length > 0) {
            rawItems = match.items;
          }
        } catch(e) {}
      }

      // Fallback for legacy DB records with total amount: create a scoped item so it NEVER falls back to full catalog
      if (rawItems.length === 0) {
        const invTotal = Number(found.totalAmount || found.grandTotal || 581.16);
        const invSub = Number(found.subTotal || (invTotal / 1.12));
        const invGst = Math.round(((invTotal - invSub) / (invSub || 1)) * 100) || 12;
        rawItems = [{
          productName: found.productName || 'Pharmaceutical Supplies (Invoice Billed)',
          productCode: 'PRD-INV-01',
          batchNumber: found.batchNumber || 'BAT-2026-01',
          expiryDate: '12/2027',
          rate: Number(invSub.toFixed(2)),
          gstPercent: invGst,
          quantity: 1,
          qty: 1
        }];
      }

      const scopedItems: CatalogProduct[] = rawItems.map((it: any, i: number) => ({
        id: it.id || i + 1,
        name: it.productName || it.product?.name || it.medicineName || 'Pharmaceutical Product',
        code: it.productCode || it.product?.code || 'PRD-01',
        batchNumber: it.batchNumber || it.batch?.batchNumber || it.batchNo || 'BAT-01',
        expiryDate: it.expiryDate || it.batch?.expiryDate || '12/2027',
        rate: Number(it.rate || it.unitRate || it.ptr || 100),
        gstPercent: Number(it.gstPercent || it.gstRate || 12),
        billedQty: Number(it.quantity || it.qty || 1)
      }));

      setSelectedInvoiceItems(scopedItems);

      // Pre-fill first item from the invoice
      const first = scopedItems[0];
      setFormItems([{
        productName: first.name,
        productCode: first.code || 'PRD-01',
        batchNumber: first.batchNumber || 'BAT-01',
        expiryDate: first.expiryDate || '12/2027',
        quantity: 1,
        rate: first.rate || 100,
        gstPercent: first.gstPercent || 12,
        maxQuantity: first.billedQty
      }]);
    } else {
      setSelectedInvoiceItems([]);
    }
  };

  // KPI Calculations
  const metrics = useMemo(() => {
    const currentList = data.filter(d => d.direction === activeTab);
    const totalCount = currentList.length;
    const totalValue = currentList.reduce((acc, curr) => acc + curr.totalAmount, 0);

    const salesReturnVal = currentList
      .filter(d => d.reason === 'Sales Return')
      .reduce((acc, curr) => acc + curr.totalAmount, 0);

    const expiryReturnVal = currentList
      .filter(d => d.reason === 'Expiry Return' || d.reason === 'Damaged Goods/Breakage')
      .reduce((acc, curr) => acc + curr.totalAmount, 0);

    const adjustmentsVal = currentList
      .filter(d => d.reason === 'Rate Difference' || d.reason === 'Discount Adjustment')
      .reduce((acc, curr) => acc + curr.totalAmount, 0);

    return { totalCount, totalValue, salesReturnVal, expiryReturnVal, adjustmentsVal };
  }, [data, activeTab]);

  // Filtered List
  const filteredData = useMemo(() => {
    return data.filter(item => {
      if (item.direction !== activeTab) return false;
      if (reasonFilter && item.reason !== reasonFilter) return false;
      if (statusFilter && item.status !== statusFilter) return false;
      if (search) {
        const query = search.toLowerCase();
        const matchNo = item.cnNo.toLowerCase().includes(query);
        const matchDist = item.distributorName.toLowerCase().includes(query);
        const matchInv = item.againstInvoiceNo.toLowerCase().includes(query);
        const matchReason = item.reason.toLowerCase().includes(query);
        if (!matchNo && !matchDist && !matchInv && !matchReason) return false;
      }
      return true;
    });
  }, [data, activeTab, reasonFilter, statusFilter, search]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      let calculatedTaxable = 0;
      let calculatedGst = 0;
      const processedItems = formItems.map((item, idx) => {
        const lineTaxable = (item.quantity || 0) * (item.rate || 0);
        const lineGst = (lineTaxable * (item.gstPercent || 12)) / 100;
        calculatedTaxable += lineTaxable;
        calculatedGst += lineGst;
        return {
          id: idx + 1,
          productName: item.productName || 'Pharmaceutical Product',
          productCode: item.productCode || 'PRD-01',
          batchNumber: item.batchNumber || 'BAT-2026-01',
          expiryDate: item.expiryDate || '12/2027',
          quantity: Number(item.quantity) || 1,
          rate: Number(item.rate) || 0,
          gstPercent: Number(item.gstPercent) || 12,
          totalAmount: lineTaxable + lineGst
        };
      });

      const netTotal = calculatedTaxable + calculatedGst;

      let dispositionType: 'SALABLE' | 'QUARANTINE_DUMP' | 'FINANCIAL_ONLY' = 'SALABLE';
      if (formReason === 'Expiry Return' || formReason === 'Damaged Goods/Breakage') {
        dispositionType = 'QUARANTINE_DUMP';
      } else if (formReason === 'Rate Difference' || formReason === 'Discount Adjustment') {
        dispositionType = 'FINANCIAL_ONLY';
      }

      const payload: CreditNoteInput = {
        cnType: formReason,
        reason: formReason,
        status: 'PENDING',
        customerName: 'My Retail Chemist Pharmacy',
        againstInvoiceNo: formInvoiceNo || `INV-RET-${Math.floor(1000 + Math.random() * 9000)}`,
        againstInvoiceId: formInvoiceNo || undefined,
        taxableAmount: calculatedTaxable,
        gstAmount: calculatedGst,
        totalAmount: netTotal,
        remarks: formRemarks ? `[Retailer Claim] ${formRemarks}` : `Retailer Return Claim against Invoice: ${formInvoiceNo || 'N/A'}`,
        items: processedItems.map(p => ({
          productId: 1,
          batchId: 1,
          quantity: p.quantity,
          rate: p.rate,
          gstPercent: p.gstPercent,
          disposition: dispositionType
        }))
      };

      const createdRecord = await creditNoteService.createCreditNote(payload);

      // Record ID & CN No in submitted claims registry
      const newCnNo = createdRecord.cnNo || `CN/26/${Math.floor(1000 + Math.random() * 9000)}`;
      const newId = String(createdRecord.id || Date.now());
      try {
        const currentClaims: string[] = JSON.parse(localStorage.getItem('retailer_submitted_claims') || '[]');
        currentClaims.push(newId, newCnNo);
        localStorage.setItem('retailer_submitted_claims', JSON.stringify(currentClaims));
      } catch (e) {}

      // Immediately create optimistic RetailerCreditNote with direction 'MY_CLAIM'
      const newClaimItem: RetailerCreditNote = {
        id: newId,
        cnNo: newCnNo,
        cnDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-'),
        distributorName: formDistributor || 'Authorized Stockist',
        distributorCode: 'DIST-MAIN',
        againstInvoiceNo: formInvoiceNo || 'N/A',
        invoiceDate: formInvoiceDate || 'Recent',
        reason: formReason,
        taxableAmount: calculatedTaxable,
        gstAmount: calculatedGst,
        totalAmount: netTotal,
        status: 'PENDING',
        direction: 'MY_CLAIM',
        remarks: formRemarks || `Retailer Return Claim against Invoice: ${formInvoiceNo || 'N/A'}`,
        disposition: dispositionType,
        items: processedItems
      };

      // Instantly insert into state so the user sees it immediately with 0 delay
      setData(prev => [newClaimItem, ...prev.filter(p => p.cnNo !== newCnNo)]);
      setShowCreateModal(false);
      setActiveTab('MY_CLAIM');
      setSuccessBanner(`Return Claim #${newCnNo} submitted successfully! Showing below under "My Return Claims Submitted".`);

      // Reset Form
      setFormInvoiceNo('');
      setFormRemarks('');
      setFormItems([{
        productName: '',
        productCode: '',
        batchNumber: '',
        expiryDate: '',
        quantity: 1,
        rate: 100,
        gstPercent: 12
      }]);

      // Sync with database in background
      loadData();
    } catch (err: any) {
      console.error('Failed to submit return request:', err);
      alert('Failed to submit: ' + (err.message || 'Server error'));
    } finally {
      setSubmitting(false);
    }
  };

  const downloadPDF = (record: RetailerCreditNote, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const doc = new jsPDF();
      const pdfData: CreditNotePdfData = {
        cnNo: record.cnNo,
        cnDate: record.cnDate,
        customerName: 'My Retail Chemist Pharmacy',
        customerType: 'Retailer',
        againstInvoiceNo: record.againstInvoiceNo,
        invoiceDate: record.invoiceDate,
        cnType: record.reason,
        reason: record.reason,
        status: record.status,
        creditAmount: record.totalAmount,
        gstAdjustment: record.gstAmount
      };
      applyCreditNoteTemplate(doc, pdfData);
      doc.save(`${record.cnNo}.pdf`);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      alert('Unable to generate Credit Note PDF');
    }
  };

  // Helper for reason badge styling
  const renderReasonBadge = (reason: string) => {
    switch (reason) {
      case 'Sales Return':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            {reason}
          </span>
        );
      case 'Expiry Return':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            {reason}
          </span>
        );
      case 'Damaged Goods/Breakage':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            {reason}
          </span>
        );
      case 'Rate Difference':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
            {reason}
          </span>
        );
      case 'Discount Adjustment':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            {reason}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
            {reason}
          </span>
        );
    }
  };

  const getStatusVariant = (status: string): BadgeVariant => {
    switch (status) {
      case 'SETTLED': return 'success';
      case 'APPROVED': return 'info';
      case 'PENDING': return 'warning';
      default: return 'neutral';
    }
  };

  const columns: Column<RetailerCreditNote>[] = [
    {
      key: 'cnNo',
      label: 'Credit Note / Claim No',
      render: (row) => (
        <div>
          <span className="font-semibold text-slate-900 block">{row.cnNo}</span>
          <span className="text-xs text-slate-500">{row.cnDate}</span>
        </div>
      )
    },
    {
      key: 'reason',
      label: 'Reason',
      render: (row) => renderReasonBadge(row.reason)
    },
    {
      key: 'distributorName',
      label: 'Distributor / Stockist',
      render: (row) => (
        <div>
          <span className="font-medium text-slate-800 block">{row.distributorName}</span>
          {row.distributorCode && <span className="text-xs text-slate-400 font-mono">{row.distributorCode}</span>}
        </div>
      )
    },
    {
      key: 'againstInvoiceNo',
      label: 'Against Invoice',
      render: (row) => (
        <div>
          <span className="font-mono text-xs font-semibold text-slate-700 block">{row.againstInvoiceNo}</span>
          <span className="text-[11px] text-slate-500">Inv Date: {row.invoiceDate}</span>
        </div>
      )
    },
    {
      key: 'totalAmount',
      label: 'Credit Amount',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900 block">{formatCurrency(row.totalAmount)}</span>
          <span className="text-[11px] text-slate-500">Taxable: {formatCurrency(row.taxableAmount)}</span>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <Badge variant={getStatusVariant(row.status)}>
          {row.status}
        </Badge>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setViewRecord(row)}
            className="text-slate-400 hover:text-[#163c78] p-1.5 rounded hover:bg-slate-100 transition-colors"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => downloadPDF(row, e)}
            className="text-slate-400 hover:text-[#163c78] p-1.5 rounded hover:bg-slate-100 transition-colors"
            title="Download PDF"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <PageHeader
        title="Retailer Credit Notes & Returns"
        subtitle="Track credit notes issued by distributors, manage return claims, and adjust dues"
        actions={
          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              title="Refresh from Database"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh DB
            </button>
            <ActionButton
              icon={<Plus className="w-4 h-4" />}
              onClick={() => setShowCreateModal(true)}
            >
              Raise Return / Credit Note
            </ActionButton>
          </div>
        }
      />

      {/* Success Notification Banner */}
      {successBanner && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 px-4 py-3 rounded-xl flex items-center justify-between shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="text-sm font-semibold">{successBanner}</span>
          </div>
          <button
            onClick={() => setSuccessBanner(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-bold px-2 py-1 rounded hover:bg-emerald-100"
          >
            ✕
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard
          title="Total Credit Notes"
          value={formatCurrency(metrics.totalValue)}
          subtitle={`${metrics.totalCount} active notes in this tab`}
          icon={<Layers className="w-6 h-6" />}
          colorClass="text-blue-600"
          bgClass="bg-blue-50"
        />
        <SummaryCard
          title="Sales Returns (Salable)"
          value={formatCurrency(metrics.salesReturnVal)}
          subtitle="Credited to Retailer Ledger"
          icon={<ArrowDownLeft className="w-6 h-6" />}
          colorClass="text-emerald-600"
          bgClass="bg-emerald-50"
        />
        <SummaryCard
          title="Expiry & Breakage Claims"
          value={formatCurrency(metrics.expiryReturnVal)}
          subtitle="Non-salable return compensation"
          icon={<AlertTriangle className="w-6 h-6" />}
          colorClass="text-rose-600"
          bgClass="bg-rose-50"
        />
        <SummaryCard
          title="Rate & Scheme Discounts"
          value={formatCurrency(metrics.adjustmentsVal)}
          subtitle="Post-billing price adjustments"
          icon={<DollarSign className="w-6 h-6" />}
          colorClass="text-purple-600"
          bgClass="bg-purple-50"
        />
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <div className="flex gap-8">
          <button
            onClick={() => setActiveTab('RECEIVED')}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'RECEIVED'
                ? 'border-[#163c78] text-[#163c78]'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <ArrowDownLeft className="w-4 h-4" />
            Credit Notes Received from Distributors
            <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full ml-1 font-mono">
              {data.filter(d => d.direction === 'RECEIVED').length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('MY_CLAIM')}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'MY_CLAIM'
                ? 'border-[#163c78] text-[#163c78]'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <ArrowUpRight className="w-4 h-4" />
            My Return Claims Submitted
            <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full ml-1 font-mono">
              {data.filter(d => d.direction === 'MY_CLAIM').length}
            </span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <FilterBar>
        <div className="w-80">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by CN No, Distributor, Invoice, Reason..."
          />
        </div>
        <div className="w-56">
          <SelectFilter
            value={reasonFilter}
            onChange={setReasonFilter}
            placeholder="All Return Reasons"
            options={allReasons.map(r => ({ value: r, label: r }))}
          />
        </div>
        <div className="w-48">
          <SelectFilter
            value={statusFilter}
            onChange={setStatusFilter}
            placeholder="All Statuses"
            options={[
              { value: 'APPROVED', label: 'Approved' },
              { value: 'SETTLED', label: 'Settled' },
              { value: 'PENDING', label: 'Pending' }
            ]}
          />
        </div>
        {(search || reasonFilter || statusFilter) && (
          <button
            onClick={() => {
              setSearch('');
              setReasonFilter('');
              setStatusFilter('');
            }}
            className="text-xs text-rose-600 hover:text-rose-700 font-medium px-2 py-1.5"
          >
            Clear Filters
          </button>
        )}
      </FilterBar>

      {/* Table Card */}
      <TableCard>
        {loading ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-[#163c78]" />
            <span className="text-sm font-medium">Loading Credit Notes from Database...</span>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={filteredData}
            onRowClick={(row) => setViewRecord(row)}
            emptyMessage="No Credit Notes found matching the selected filters"
          />
        )}
      </TableCard>

      {/* View Drawer */}
      {viewRecord && (
        <Drawer
          open={!!viewRecord}
          onClose={() => setViewRecord(null)}
          title={`Credit Note: ${viewRecord.cnNo}`}
        >
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <span className="text-xs text-slate-500 uppercase tracking-wider block">Reason for Credit</span>
                <div className="mt-1">{renderReasonBadge(viewRecord.reason)}</div>
              </div>
              <div>
                <Badge variant={getStatusVariant(viewRecord.status)}>
                  {viewRecord.status}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <DrawerField label="Date" value={viewRecord.cnDate} />
              <DrawerField label="Against Invoice" value={viewRecord.againstInvoiceNo} />
              <DrawerField label="Distributor / Stockist" value={viewRecord.distributorName} />
              <DrawerField label="Invoice Date" value={viewRecord.invoiceDate} />
              <DrawerField
                label="Stock Disposition"
                value={
                  viewRecord.disposition === 'SALABLE' ? (
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Restored to Active Stock
                    </span>
                  ) : viewRecord.disposition === 'QUARANTINE_DUMP' ? (
                    <span className="text-xs font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                      Quarantined / Disposed
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                      Financial Adjustment Only
                    </span>
                  )
                }
              />
              <DrawerField label="Net Credit Amount" value={<span className="text-lg font-bold text-slate-900">{formatCurrency(viewRecord.totalAmount)}</span>} />
            </div>

            {viewRecord.remarks && (
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-sm">
                <span className="font-semibold text-slate-700 block mb-1">Remarks & Notes:</span>
                <p className="text-slate-600">{viewRecord.remarks}</p>
              </div>
            )}

            {/* Line Items */}
            <div className="space-y-2">
              <span className="font-semibold text-slate-800 text-sm block">Items Credited / Returned:</span>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="p-2.5 font-semibold">Product</th>
                      <th className="p-2.5 font-semibold">Batch / Exp</th>
                      <th className="p-2.5 font-semibold text-right">Qty</th>
                      <th className="p-2.5 font-semibold text-right">Rate</th>
                      <th className="p-2.5 font-semibold text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(viewRecord.items || []).map((it, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="p-2.5">
                          <span className="font-medium text-slate-900 block">{it.productName}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{it.productCode}</span>
                        </td>
                        <td className="p-2.5 font-mono text-slate-600">
                          {it.batchNumber} ({it.expiryDate})
                        </td>
                        <td className="p-2.5 text-right font-semibold text-slate-900">{it.quantity}</td>
                        <td className="p-2.5 text-right text-slate-600">₹{it.rate}</td>
                        <td className="p-2.5 text-right font-bold text-slate-900">{formatCurrency(it.totalAmount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-slate-200">
              <button
                onClick={() => downloadPDF(viewRecord)}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-[#163c78] hover:bg-[#112d5a] text-white font-semibold text-sm transition-colors shadow-sm"
              >
                <Download className="w-4 h-4" /> Download Credit Note PDF
              </button>
            </div>
          </div>
        </Drawer>
      )}

      {/* Raise Return Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Raise Return Request / Credit Note</h3>
                <p className="text-xs text-slate-500">
                  Submit a claim to your distributor for sales return, short expiry batches, or damaged items
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-5">
              {/* Reference Invoice Selection */}
              <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-100 space-y-3">
                <label className="block text-xs font-bold text-[#163c78] uppercase tracking-wide">
                  Select Original Purchase Invoice (Auto-Fills Details)
                </label>
                <select
                  value={formInvoiceNo}
                  onChange={(e) => handleSelectInvoice(e.target.value)}
                  className="w-full text-sm border border-blue-200 rounded-lg p-2.5 bg-white font-mono text-slate-800"
                >
                  <option value="">-- Choose Existing Billed Invoice (or enter manually below) --</option>
                  {invoices.map((inv, i) => {
                    const num = inv.invoiceNumber || inv.invoiceNo || `INV-${inv.id}`;
                    const amt = inv.grandTotal || inv.totalAmount || inv.netPayable || 0;
                    return (
                      <option key={i} value={num}>
                        {num} - Date: {inv.invoiceDate || inv.date || 'Recent'} ({formatCurrency(amt)})
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Distributor & Invoice Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Supplying Distributor / Stockist *
                  </label>
                  <input
                    type="text"
                    value={formDistributor}
                    onChange={(e) => setFormDistributor(e.target.value)}
                    placeholder="e.g. Apex Healthcare Distributors"
                    required
                    className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#163c78] focus:border-[#163c78]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Original Invoice Number *
                  </label>
                  <input
                    type="text"
                    value={formInvoiceNo}
                    onChange={(e) => setFormInvoiceNo(e.target.value)}
                    placeholder="e.g. INV-20261120-0018"
                    required
                    className="w-full text-sm border border-slate-300 rounded-lg p-2.5 font-mono"
                  />
                </div>
              </div>

              {/* ⭐ REASON SELECTION WITH ADD + BUTTON */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Return Reason / Type *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowAddReasonModal(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold bg-[#163c78] text-white hover:bg-[#112d5a] shadow-sm transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add +
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <select
                      value={formReason}
                      onChange={(e) => setFormReason(e.target.value)}
                      className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-white font-medium text-slate-800"
                    >
                      {allReasons.map((r, i) => (
                        <option key={i} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Stock impact hint */}
                  <div className="flex items-center text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200">
                    {formReason === 'Sales Return' && (
                      <span className="text-emerald-700 font-medium flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        Salable Return: Stock returned in undamaged sellable condition.
                      </span>
                    )}
                    {(formReason === 'Expiry Return' || formReason === 'Damaged Goods/Breakage') && (
                      <span className="text-rose-700 font-medium flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                        Expiry / Breakage: Non-sellable return claim for credit.
                      </span>
                    )}
                    {(formReason === 'Rate Difference' || formReason === 'Discount Adjustment') && (
                      <span className="text-purple-700 font-medium flex items-center gap-1.5">
                        <DollarSign className="w-4 h-4 text-purple-600 shrink-0" />
                        Financial Credit: Price/scheme variance claim.
                      </span>
                    )}
                    {!DEFAULT_REASONS.includes(formReason) && (
                      <span className="text-indigo-700 font-medium flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                        Custom Reason: {formReason}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Returned Medicines Table with Searchable Dropdown */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Returned Medicines / Products
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setFormItems([
                        ...formItems,
                        {
                          productName: '',
                          productCode: '',
                          batchNumber: '',
                          expiryDate: '',
                          quantity: 1,
                          rate: 100,
                          gstPercent: 12
                        }
                      ])
                    }
                    className="text-xs text-[#163c78] hover:underline font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Another Item
                  </button>
                </div>

                {selectedInvoiceItems.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-xs text-amber-900 flex items-center justify-between">
                    <span className="flex items-center gap-2 font-medium">
                      <FileText className="w-4 h-4 text-amber-600 shrink-0" />
                      Only showing products billed on Invoice <strong>{formInvoiceNo}</strong> ({selectedInvoiceItems.length} items available)
                    </span>
                    <span className="text-[11px] text-amber-700">Original rates & batches pre-filled</span>
                  </div>
                )}

                {formItems.map((item, idx) => (
                  <div key={idx} className="p-3 border border-slate-200 rounded-lg space-y-3 bg-white">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      {/* ⭐ SEARCHABLE MEDICINE DROPDOWN (INVOICE SCOPED) */}
                      <div className="md:col-span-2">
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Product / Medicine Name * {selectedInvoiceItems.length > 0 ? '(From Invoice)' : '(Search Catalog)'}
                        </label>
                        <ProductSearchDropdown
                          value={item.productName}
                          onChangeName={(name) => {
                            const updated = [...formItems];
                            updated[idx].productName = name;
                            setFormItems(updated);
                          }}
                          onSelectProduct={(p) => {
                            const updated = [...formItems];
                            updated[idx].productName = p.name;
                            updated[idx].productCode = p.code;
                            if (p.batchNumber) updated[idx].batchNumber = p.batchNumber;
                            if (p.expiryDate) updated[idx].expiryDate = p.expiryDate;
                            updated[idx].rate = p.rate;
                            updated[idx].gstPercent = p.gstPercent;
                            (updated[idx] as any).maxQuantity = p.billedQty;
                            setFormItems(updated);
                          }}
                          catalog={selectedInvoiceItems.length > 0 ? selectedInvoiceItems : catalogList}
                          isInvoiceScoped={selectedInvoiceItems.length > 0}
                          invoiceNo={formInvoiceNo}
                          placeholder={selectedInvoiceItems.length > 0 ? "Select medicine from invoice..." : "Type or click arrow to see all medicines..."}
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Batch No *
                        </label>
                        <input
                          type="text"
                          value={item.batchNumber}
                          onChange={(e) => {
                            const updated = [...formItems];
                            updated[idx].batchNumber = e.target.value;
                            setFormItems(updated);
                          }}
                          placeholder="BAT-00021"
                          required
                          className="w-full text-xs border border-slate-300 rounded p-2 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Expiry Date
                        </label>
                        <input
                          type="text"
                          value={item.expiryDate}
                          onChange={(e) => {
                            const updated = [...formItems];
                            updated[idx].expiryDate = e.target.value;
                            setFormItems(updated);
                          }}
                          placeholder="MM/YYYY"
                          className="w-full text-xs border border-slate-300 rounded p-2"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Return Quantity * {(item as any).maxQuantity ? <span className="text-blue-600 font-normal">(Max: {(item as any).maxQuantity})</span> : ''}
                        </label>
                        <input
                          type="number"
                          min="1"
                          max={(item as any).maxQuantity}
                          value={item.quantity}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            const maxQ = (item as any).maxQuantity;
                            if (maxQ && val > maxQ) {
                              alert(`Cannot return more than billed quantity (${maxQ} units)`);
                              return;
                            }
                            const updated = [...formItems];
                            updated[idx].quantity = val;
                            setFormItems(updated);
                          }}
                          required
                          className="w-full text-xs border border-slate-300 rounded p-2"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Rate (PTR / Base) *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={item.rate}
                          onChange={(e) => {
                            const updated = [...formItems];
                            updated[idx].rate = Number(e.target.value);
                            setFormItems(updated);
                          }}
                          required
                          className="w-full text-xs border border-slate-300 rounded p-2"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          GST %
                        </label>
                        <select
                          value={item.gstPercent}
                          onChange={(e) => {
                            const updated = [...formItems];
                            updated[idx].gstPercent = Number(e.target.value);
                            setFormItems(updated);
                          }}
                          className="w-full text-xs border border-slate-300 rounded p-2"
                        >
                          <option value={0}>0%</option>
                          <option value={5}>5%</option>
                          <option value={12}>12%</option>
                          <option value={18}>18%</option>
                          <option value={28}>28%</option>
                        </select>
                      </div>
                    </div>

                    {formItems.length > 1 && (
                      <div className="flex justify-end pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            const updated = formItems.filter((_, i) => i !== idx);
                            setFormItems(updated);
                          }}
                          className="text-[11px] text-rose-600 hover:text-rose-700 hover:underline font-medium"
                        >
                          ✕ Remove this item
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason Remarks / Damage Notes
                </label>
                <textarea
                  value={formRemarks}
                  onChange={(e) => setFormRemarks(e.target.value)}
                  placeholder="Describe condition of returned medicines or specific reason for return..."
                  rows={2}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-lg bg-[#163c78] hover:bg-[#112d5a] text-white text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {submitting ? 'Submitting Claim...' : 'Submit Return Claim'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Add Reason Modal */}
      {showAddReasonModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div>
              <h4 className="text-base font-bold text-slate-900">Add Custom Return Reason</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Create a new reason or category that will be saved and visible in the Credit Note table.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reason / Type Name *
              </label>
              <input
                type="text"
                value={newReasonInput}
                onChange={(e) => setNewReasonInput(e.target.value)}
                placeholder="e.g. Festival Cashback / Broken Seal"
                autoFocus
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#163c78] focus:border-[#163c78]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setNewReasonInput('');
                  setShowAddReasonModal(false);
                }}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveNewReason}
                className="px-4 py-1.5 rounded-lg bg-[#163c78] hover:bg-[#112d5a] text-white text-xs font-semibold"
              >
                Save & Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
