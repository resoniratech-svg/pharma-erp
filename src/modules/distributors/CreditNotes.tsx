import { useState, useMemo, useEffect } from 'react';
import {
  Plus, Download, Eye, DollarSign, RefreshCw, CheckCircle2,
  AlertTriangle, Archive, FileText, ChevronRight, Layers, ArrowDownLeft, ArrowUpRight
} from 'lucide-react';
import {
  PageHeader, FilterBar, SearchInput, SelectFilter, ActionButton,
  TableCard, DataTable, Badge, Drawer, DrawerField, SummaryCard
} from './components/shared';
import { type Column, type BadgeVariant } from './components/shared';
import { jsPDF } from 'jspdf';
import { applyCreditNoteTemplate, type CreditNotePdfData } from '../../documents/templates/CreditNoteTemplate';
import { billingService } from '../../services/billingService';
import { productService } from '../../services/productService';
import { retailerMasterService } from '../../services/retailerMasterService';

const formatCurrency = (amount: number) =>
  `₹ ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export interface DistributorCreditNote {
  id: string;
  cnNo: string;
  cnDate: string;
  direction: 'ISSUED_TO_RETAILER' | 'RECEIVED_FROM_COMPANY';
  customerName: string;
  customerType: string;
  retailerCode?: string;
  againstInvoiceNo: string;
  invoiceDate: string;
  reason: string;
  taxableAmount: number;
  gstAmount: number;
  totalAmount: number;
  status: 'PENDING' | 'APPROVED' | 'SETTLED';
  remarks?: string;
  disposition: 'SALABLE' | 'QUARANTINE_DUMP' | 'FINANCIAL_ONLY';
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

const INITIAL_MOCK_NOTES: DistributorCreditNote[] = [
  {
    id: 'cn-dist-001',
    cnNo: 'CN-DIST-2026-0001',
    cnDate: '26-Nov-2026',
    direction: 'ISSUED_TO_RETAILER',
    customerName: 'Apollo Pharmacy - Banjara Hills',
    customerType: 'Retailer',
    retailerCode: 'RET-0012',
    againstInvoiceNo: 'INV-20261120-0018',
    invoiceDate: '20-Nov-2026',
    reason: 'Sales Return',
    taxableAmount: 4500.0,
    gstAmount: 540.0,
    totalAmount: 5040.0,
    status: 'SETTLED',
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
    id: 'cn-dist-002',
    cnNo: 'CN-DIST-2026-0002',
    cnDate: '25-Nov-2026',
    direction: 'ISSUED_TO_RETAILER',
    customerName: 'MedPlus Health Services - Secunderabad',
    customerType: 'Retailer',
    retailerCode: 'RET-0045',
    againstInvoiceNo: 'INV-20261115-0089',
    invoiceDate: '15-Nov-2026',
    reason: 'Expiry Return',
    taxableAmount: 7200.0,
    gstAmount: 864.0,
    totalAmount: 8064.0,
    status: 'APPROVED',
    remarks: 'Short expiry batches recalled from retailer shelf',
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
    id: 'cn-dist-003',
    cnNo: 'CN-DIST-2026-0003',
    cnDate: '24-Nov-2026',
    direction: 'ISSUED_TO_RETAILER',
    customerName: 'Sri Balaji Medicals',
    customerType: 'Retailer',
    retailerCode: 'RET-0088',
    againstInvoiceNo: 'INV-20261118-0034',
    invoiceDate: '18-Nov-2026',
    reason: 'Damaged Goods/Breakage',
    taxableAmount: 1850.0,
    gstAmount: 222.0,
    totalAmount: 2072.0,
    status: 'SETTLED',
    remarks: 'Transit breakage confirmed during unboxing',
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
  },
  {
    id: 'cn-dist-004',
    cnNo: 'CN-DIST-2026-0004',
    cnDate: '23-Nov-2026',
    direction: 'ISSUED_TO_RETAILER',
    customerName: 'Care Pharmacy & Surgicals',
    customerType: 'Retailer',
    retailerCode: 'RET-0102',
    againstInvoiceNo: 'INV-20261110-0012',
    invoiceDate: '10-Nov-2026',
    reason: 'Rate Difference',
    taxableAmount: 3200.0,
    gstAmount: 384.0,
    totalAmount: 3584.0,
    status: 'APPROVED',
    remarks: 'Special festival discount rate adjusted post billing',
    disposition: 'FINANCIAL_ONLY',
    items: [
      {
        id: 4,
        productName: 'Azithromycin 500mg Tabs',
        productCode: 'PRD-008',
        batchNumber: 'BAT-2026-AZ09',
        expiryDate: '04/2028',
        quantity: 40,
        rate: 80.0,
        gstPercent: 12,
        totalAmount: 3584.0
      }
    ]
  },
  {
    id: 'cn-comp-001',
    cnNo: 'CN-CORP-2026-0114',
    cnDate: '22-Nov-2026',
    direction: 'RECEIVED_FROM_COMPANY',
    customerName: 'MJ Healthcare Corporate / Super Admin',
    customerType: 'Manufacturer',
    againstInvoiceNo: 'SUP-INV-2026-0921',
    invoiceDate: '05-Nov-2026',
    reason: 'Expiry Return',
    taxableAmount: 34500.0,
    gstAmount: 4140.0,
    totalAmount: 38640.0,
    status: 'SETTLED',
    remarks: 'Consolidated expired return credit note settled by company',
    disposition: 'QUARANTINE_DUMP',
    items: [
      {
        id: 5,
        productName: 'Consolidated Recalled Antibiotics',
        productCode: 'PRD-MULTI',
        batchNumber: 'VARIOUS',
        expiryDate: '10/2026',
        quantity: 80,
        rate: 431.25,
        gstPercent: 12,
        totalAmount: 38640.0
      }
    ]
  }
];

export default function DistributorCreditNotes() {
  const [data, setData] = useState<DistributorCreditNote[]>(() => {
    try {
      const saved = localStorage.getItem('distributor_credit_notes');
      return saved ? JSON.parse(saved) : INITIAL_MOCK_NOTES;
    } catch {
      return INITIAL_MOCK_NOTES;
    }
  });

  const [activeTab, setActiveTab] = useState<'ISSUED_TO_RETAILER' | 'RECEIVED_FROM_COMPANY'>('ISSUED_TO_RETAILER');
  const [search, setSearch] = useState('');
  const [reasonFilter, setReasonFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Drawers & Modals
  const [viewRecord, setViewRecord] = useState<DistributorCreditNote | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddReasonModal, setShowAddReasonModal] = useState(false);
  const [newReasonInput, setNewReasonInput] = useState('');

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

  // Create Form State
  const [formParty, setFormParty] = useState('');
  const [formPartyType, setFormPartyType] = useState('Retailer');
  const [formInvoiceNo, setFormInvoiceNo] = useState('');
  const [formInvoiceDate, setFormInvoiceDate] = useState('27-Nov-2026');
  const [formReason, setFormReason] = useState('Sales Return');
  const [formRemarks, setFormRemarks] = useState('');

  // Line item in form
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

  // Available Retailers & Invoices for autocomplete
  const [retailersList, setRetailersList] = useState<any[]>([]);
  const [catalogList, setCatalogList] = useState<any[]>([]);

  useEffect(() => {
    // Load retailers
    const rList = retailerMasterService.getAll();
    if (rList && rList.length > 0) {
      setRetailersList(rList);
    } else {
      setRetailersList([
        { name: 'Apollo Pharmacy - Banjara Hills', code: 'RET-0012' },
        { name: 'MedPlus Health Services - Secunderabad', code: 'RET-0045' },
        { name: 'Sri Balaji Medicals', code: 'RET-0088' },
        { name: 'Care Pharmacy & Surgicals', code: 'RET-0102' }
      ]);
    }

    // Load products
    productService.getProducts().then(res => {
      if (res && res.length > 0) setCatalogList(res);
    }).catch(() => {});
  }, []);

  const handleSaveData = (newData: DistributorCreditNote[]) => {
    setData(newData);
    localStorage.setItem('distributor_credit_notes', JSON.stringify(newData));
  };

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
        const matchCustomer = item.customerName.toLowerCase().includes(query);
        const matchInv = item.againstInvoiceNo.toLowerCase().includes(query);
        const matchReason = item.reason.toLowerCase().includes(query);
        if (!matchNo && !matchCustomer && !matchInv && !matchReason) return false;
      }
      return true;
    });
  }, [data, activeTab, reasonFilter, statusFilter, search]);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formParty) {
      alert('Please select a customer/party');
      return;
    }

    let calculatedTaxable = 0;
    let calculatedGst = 0;
    const processedItems = formItems.map((item, idx) => {
      const lineTaxable = (item.quantity || 0) * (item.rate || 0);
      const lineGst = (lineTaxable * (item.gstPercent || 12)) / 100;
      calculatedTaxable += lineTaxable;
      calculatedGst += lineGst;
      return {
        id: idx + 1,
        productName: item.productName || 'General Pharmaceutical Product',
        productCode: item.productCode || 'PRD-GEN',
        batchNumber: item.batchNumber || 'BAT-2026-01',
        expiryDate: item.expiryDate || '12/2027',
        quantity: Number(item.quantity) || 1,
        rate: Number(item.rate) || 0,
        gstPercent: Number(item.gstPercent) || 12,
        totalAmount: lineTaxable + lineGst
      };
    });

    const netTotal = calculatedTaxable + calculatedGst;
    const generatedNo = `CN-DIST-2026-000${data.length + 1}`;

    let dispositionType: 'SALABLE' | 'QUARANTINE_DUMP' | 'FINANCIAL_ONLY' = 'SALABLE';
    if (formReason === 'Expiry Return' || formReason === 'Damaged Goods/Breakage') {
      dispositionType = 'QUARANTINE_DUMP';
    } else if (formReason === 'Rate Difference' || formReason === 'Discount Adjustment') {
      dispositionType = 'FINANCIAL_ONLY';
    }

    const newRecord: DistributorCreditNote = {
      id: `cn-dist-${Date.now()}`,
      cnNo: generatedNo,
      cnDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-'),
      direction: activeTab,
      customerName: formParty,
      customerType: formPartyType,
      againstInvoiceNo: formInvoiceNo || `INV-202611-${Math.floor(1000 + Math.random() * 9000)}`,
      invoiceDate: formInvoiceDate,
      reason: formReason,
      taxableAmount: calculatedTaxable,
      gstAmount: calculatedGst,
      totalAmount: netTotal,
      status: 'APPROVED',
      remarks: formRemarks,
      disposition: dispositionType,
      items: processedItems
    };

    const updated = [newRecord, ...data];
    handleSaveData(updated);
    setShowCreateModal(false);

    // Reset Form
    setFormParty('');
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
  };

  const handleSettle = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = data.map(item => {
      if (item.id === id) {
        return { ...item, status: 'SETTLED' as const };
      }
      return item;
    });
    handleSaveData(updated);
  };

  const downloadPDF = (record: DistributorCreditNote, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const doc = new jsPDF();
      const pdfData: CreditNotePdfData = {
        cnNo: record.cnNo,
        cnDate: record.cnDate,
        customerName: record.customerName,
        customerType: record.customerType,
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

  const columns: Column<DistributorCreditNote>[] = [
    {
      key: 'cnNo',
      label: 'Credit Note No',
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
      key: 'customerName',
      label: activeTab === 'ISSUED_TO_RETAILER' ? 'Retailer / Customer' : 'Issuing Authority / Company',
      render: (row) => (
        <div>
          <span className="font-medium text-slate-800 block">{row.customerName}</span>
          {row.retailerCode && <span className="text-xs text-slate-400 font-mono">{row.retailerCode}</span>}
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
          {row.status !== 'SETTLED' && (
            <button
              onClick={(e) => handleSettle(row.id, e)}
              className="text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-colors border border-emerald-200"
              title="Settle against Ledger dues"
            >
              <DollarSign className="w-3.5 h-3.5" /> Settle
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <PageHeader
        title="Distributor Credit Notes & Returns"
        subtitle="Single unified console for all retailer returns, expiry claims, rate adjustments, and company credit notes"
        actions={
          <ActionButton
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setShowCreateModal(true)}
          >
            Create Credit Note
          </ActionButton>
        }
      />

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
          subtitle="Stock returned to sellable inventory"
          icon={<ArrowDownLeft className="w-6 h-6" />}
          colorClass="text-emerald-600"
          bgClass="bg-emerald-50"
        />
        <SummaryCard
          title="Expiry & Breakage Returns"
          value={formatCurrency(metrics.expiryReturnVal)}
          subtitle="Quarantine / Disposed batches"
          icon={<AlertTriangle className="w-6 h-6" />}
          colorClass="text-rose-600"
          bgClass="bg-rose-50"
        />
        <SummaryCard
          title="Rate & Scheme Adjustments"
          value={formatCurrency(metrics.adjustmentsVal)}
          subtitle="Financial credits without stock impact"
          icon={<DollarSign className="w-6 h-6" />}
          colorClass="text-purple-600"
          bgClass="bg-purple-50"
        />
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <div className="flex gap-8">
          <button
            onClick={() => setActiveTab('ISSUED_TO_RETAILER')}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'ISSUED_TO_RETAILER'
                ? 'border-[#163c78] text-[#163c78]'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <ArrowDownLeft className="w-4 h-4" />
            Issued to Retailers / Chemists
            <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full ml-1 font-mono">
              {data.filter(d => d.direction === 'ISSUED_TO_RETAILER').length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('RECEIVED_FROM_COMPANY')}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'RECEIVED_FROM_COMPANY'
                ? 'border-[#163c78] text-[#163c78]'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <ArrowUpRight className="w-4 h-4" />
            Received from Company / Super Admin
            <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full ml-1 font-mono">
              {data.filter(d => d.direction === 'RECEIVED_FROM_COMPANY').length}
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
            placeholder="Search by CN No, Retailer, Invoice, Reason..."
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
        <DataTable
          columns={columns}
          data={filteredData}
          onRowClick={(row) => setViewRecord(row)}
          emptyMessage="No Credit Notes found matching the selected filters"
        />
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
              <DrawerField label="Credit Note Date" value={viewRecord.cnDate} />
              <DrawerField label="Against Invoice" value={viewRecord.againstInvoiceNo} />
              <DrawerField label="Customer / Party" value={viewRecord.customerName} />
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
                    {viewRecord.items.map((it, idx) => (
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
                className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-sm transition-colors"
              >
                <Download className="w-4 h-4" /> Download PDF
              </button>
              {viewRecord.status !== 'SETTLED' && (
                <button
                  onClick={(e) => {
                    handleSettle(viewRecord.id, e);
                    setViewRecord({ ...viewRecord, status: 'SETTLED' });
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-colors"
                >
                  <DollarSign className="w-4 h-4" /> Settle In Ledger
                </button>
              )}
            </div>
          </div>
        </Drawer>
      )}

      {/* Create Credit Note Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Create New Credit Note</h3>
                <p className="text-xs text-slate-500">
                  {activeTab === 'ISSUED_TO_RETAILER'
                    ? 'Issue credit note to chemist/retailer for returned stock or adjustments'
                    : 'Record credit note received from company / super admin'}
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
              {/* Party & Invoice Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {activeTab === 'ISSUED_TO_RETAILER' ? 'Retailer / Customer *' : 'Company / Entity *'}
                  </label>
                  {activeTab === 'ISSUED_TO_RETAILER' ? (
                    <select
                      value={formParty}
                      onChange={(e) => setFormParty(e.target.value)}
                      required
                      className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#163c78] focus:border-[#163c78]"
                    >
                      <option value="">-- Select Retailer --</option>
                      {retailersList.map((r, i) => (
                        <option key={i} value={r.name}>
                          {r.name} ({r.code || 'CHEM'})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={formParty}
                      onChange={(e) => setFormParty(e.target.value)}
                      placeholder="e.g. MJ Healthcare Corporate"
                      required
                      className="w-full text-sm border border-slate-300 rounded-lg p-2.5"
                    />
                  )}
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
                    Credit Note Reason / Type *
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
                        Salable Return: Stock will be added back to sellable inventory.
                      </span>
                    )}
                    {(formReason === 'Expiry Return' || formReason === 'Damaged Goods/Breakage') && (
                      <span className="text-rose-700 font-medium flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                        Quarantine: Product marked for return/disposal (not salable).
                      </span>
                    )}
                    {(formReason === 'Rate Difference' || formReason === 'Discount Adjustment') && (
                      <span className="text-purple-700 font-medium flex items-center gap-1.5">
                        <DollarSign className="w-4 h-4 text-purple-600 shrink-0" />
                        Financial Credit: Adjusts ledger without touching physical stock.
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

              {/* Item Entry */}
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

                {formItems.map((item, idx) => (
                  <div key={idx} className="p-3 border border-slate-200 rounded-lg space-y-3 bg-white">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div className="md:col-span-2">
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Product / Medicine Name *
                        </label>
                        <input
                          type="text"
                          value={item.productName}
                          onChange={(e) => {
                            const updated = [...formItems];
                            updated[idx].productName = e.target.value;
                            setFormItems(updated);
                          }}
                          placeholder="e.g. Paracetamol 650mg / Amoxicillin"
                          required
                          className="w-full text-xs border border-slate-300 rounded p-2"
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
                          Return Quantity *
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => {
                            const updated = [...formItems];
                            updated[idx].quantity = Number(e.target.value);
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
                  </div>
                ))}
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Remarks / Justification
                </label>
                <textarea
                  value={formRemarks}
                  onChange={(e) => setFormRemarks(e.target.value)}
                  placeholder="State the condition of goods, batch verification notes, or approval reason..."
                  rows={2}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#163c78] hover:bg-[#112d5a] text-white text-xs font-semibold shadow-sm transition-colors"
                >
                  Generate Credit Note
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
              <h4 className="text-base font-bold text-slate-900">Add Custom Credit Note Reason</h4>
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
                placeholder="e.g. Festival Cashback / Transport Shortage"
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
