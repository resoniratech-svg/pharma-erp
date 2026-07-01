import { useState, useMemo } from 'react';
import { Plus, Download, Filter, Eye, Edit, Trash2, CheckCircle, XCircle, CheckSquare } from 'lucide-react';
import {
  PageHeader, FilterBar, SearchInput, SelectFilter, ActionButton,
  TableCard, DataTable, Badge, Drawer, DrawerField
} from './components/shared';
import { type Column, type BadgeVariant } from './components/shared';
import { jsPDF } from 'jspdf';
import { applyCreditNoteTemplate } from '../../documents/templates/CreditNoteTemplate';

type CNStatus = 'Draft' | 'Pending Approval' | 'Approved' | 'Applied' | 'Cancelled';

interface CreditNoteData {
  id: string;
  cnNo: string;
  cnDate: string;
  customerName: string;
  customerType: string;
  againstInvoiceNo: string;
  invoiceDate: string;
  cnType: string;
  reason: string;
  creditAmount: number;
  gstAdjustment: number;
  status: CNStatus;
}

const mockData: CreditNoteData[] = [
  { id: '1', cnNo: 'CN/26/045', cnDate: '16-Oct-2026', customerName: 'Apollo Pharmacy', customerType: 'Retailer', againstInvoiceNo: 'INV/26/001', invoiceDate: '10-Oct-2026', cnType: 'Sales Return', reason: 'Damaged Goods', creditAmount: 1500, gstAdjustment: 180, status: 'Approved' },
  { id: '2', cnNo: 'CN/26/046', cnDate: '17-Oct-2026', customerName: 'MedPlus Store', customerType: 'Hospital', againstInvoiceNo: 'INV/26/002', invoiceDate: '12-Oct-2026', cnType: 'Rate Difference', reason: 'Price Adjustment', creditAmount: 450, gstAdjustment: 54, status: 'Pending Approval' },
  { id: '3', cnNo: 'CN/26/047', cnDate: '18-Oct-2026', customerName: 'City Clinic', customerType: 'Clinic', againstInvoiceNo: 'INV/26/005', invoiceDate: '15-Oct-2026', cnType: 'Discount Adjustment', reason: 'Promotional Discount', creditAmount: 1200, gstAdjustment: 144, status: 'Draft' },
  { id: '4', cnNo: 'CN/26/048', cnDate: '19-Oct-2026', customerName: 'Wellness Medicos', customerType: 'Retailer', againstInvoiceNo: 'INV/26/008', invoiceDate: '18-Oct-2026', cnType: 'Sales Return', reason: 'Wrong Billing', creditAmount: 3400, gstAdjustment: 408, status: 'Applied' },
];

const mockInvoiceDetails = {
  customerName: 'Apollo Pharmacy',
  customerType: 'Retailer',
  gstin: '27ABCDE1234F1Z5',
  invoiceDate: '10-Oct-2026',
  products: [
    { id: 'p1', name: 'Paracetamol 500mg', batch: 'B001', soldQty: 100, returnQty: 0, unitRate: 15, gstPct: 12 },
    { id: 'p2', name: 'Amoxicillin 250mg', batch: 'B002', soldQty: 50, returnQty: 0, unitRate: 80, gstPct: 12 },
  ]
};

const formatCurrency = (amount: number) => `₹ ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function CreditNotes() {
  const [data, setData] = useState<CreditNoteData[]>(mockData);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Drawer States
  const [viewRecord, setViewRecord] = useState<CreditNoteData | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Form States
  const [editId, setEditId] = useState<string | null>(null);
  const [formCnType, setFormCnType] = useState('Sales Return');
  const [formInvoiceNo, setFormInvoiceNo] = useState('');
  const [formReason, setFormReason] = useState('Sales Return');
  const [formRemarks, setFormRemarks] = useState('');
  const [formProducts, setFormProducts] = useState(mockInvoiceDetails.products);

  const resetForm = () => {
    setEditId(null);
    setFormCnType('Sales Return');
    setFormInvoiceNo('');
    setFormReason('Sales Return');
    setFormRemarks('');
    setFormProducts(mockInvoiceDetails.products);
  };

  const getStatusVariant = (status: CNStatus): BadgeVariant => {
    switch (status) {
      case 'Approved': case 'Applied': return 'success';
      case 'Pending Approval': return 'warning';
      case 'Draft': return 'neutral';
      case 'Cancelled': return 'danger';
      default: return 'neutral';
    }
  };

  const handleAction = (id: string, action: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (action === 'Delete') {
      if (window.confirm('Are you sure you want to delete this Draft Credit Note?')) {
        setData(prev => prev.filter(item => item.id !== id));
      }
    } else if (action === 'Edit') {
      const record = data.find(item => item.id === id);
      if (record) {
        setEditId(id);
        setFormCnType(record.cnType);
        setFormInvoiceNo(record.againstInvoiceNo === 'INV/26/000' ? '' : record.againstInvoiceNo);
        setFormReason(record.reason);
        // We do not have stored remarks/products, so we just pre-populate what we have
        setFormRemarks('Adjustment for ' + record.reason);
        setShowCreateForm(true);
      }
    } else if (action === 'Approve') {
      setData(prev => prev.map(item => item.id === id ? { ...item, status: 'Approved' } : item));
    } else if (action === 'Reject') {
      setData(prev => prev.map(item => item.id === id ? { ...item, status: 'Cancelled' } : item));
    } else if (action === 'Apply Credit') {
      setData(prev => prev.map(item => item.id === id ? { ...item, status: 'Applied' } : item));
    }
  };

  const downloadPDF = (record: CreditNoteData, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const doc = new jsPDF();
    applyCreditNoteTemplate(doc, record);
    doc.save(`${record.cnNo.replace(/\//g, '-')}.pdf`);
  };

  const columns: Column<CreditNoteData>[] = [
    { key: 'cnNo', label: 'Credit Note No', render: (row) => <span className="font-semibold text-slate-900">{row.cnNo}</span> },
    { key: 'customerName', label: 'Customer Name', render: (row) => <span className="font-medium text-violet-700">{row.customerName}</span> },
    { key: 'againstInvoiceNo', label: 'Against Invoice', render: (row) => <span className="font-mono text-xs text-slate-600">{row.againstInvoiceNo}</span> },
    { key: 'cnDate', label: 'Credit Note Date' },
    { key: 'creditAmount', label: 'Credit Amount', render: (row) => <span className="font-bold text-slate-800">{formatCurrency(row.creditAmount)}</span> },
    { key: 'status', label: 'Status', render: (row) => <Badge variant={getStatusVariant(row.status)}>{row.status}</Badge> },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          <button onClick={() => setViewRecord(row)} className="text-slate-400 hover:text-violet-600 transition-colors p-1" title="View"><Eye className="w-4 h-4" /></button>
          <button onClick={(e) => downloadPDF(row, e)} className="text-slate-400 hover:text-violet-600 p-1" title="Download PDF"><Download className="w-4 h-4" /></button>
          
          {row.status === 'Draft' && (
            <>
              <button onClick={(e) => handleAction(row.id, 'Edit', e)} className="text-slate-400 hover:text-blue-600 p-1" title="Edit"><Edit className="w-4 h-4" /></button>
              <button onClick={(e) => handleAction(row.id, 'Delete', e)} className="text-slate-400 hover:text-rose-600 p-1" title="Delete"><Trash2 className="w-4 h-4" /></button>
            </>
          )}

          {row.status === 'Pending Approval' && (
            <>
              <button onClick={(e) => handleAction(row.id, 'Approve', e)} className="text-emerald-600 hover:text-emerald-700 p-1 font-semibold flex items-center gap-1 text-xs" title="Approve"><CheckCircle className="w-3.5 h-3.5" /> Approve</button>
              <button onClick={(e) => handleAction(row.id, 'Reject', e)} className="text-rose-600 hover:text-rose-700 p-1 font-semibold flex items-center gap-1 text-xs" title="Reject"><XCircle className="w-3.5 h-3.5" /> Reject</button>
            </>
          )}

          {row.status === 'Approved' && (
            <button onClick={(e) => handleAction(row.id, 'Apply Credit', e)} className="text-blue-600 hover:text-blue-700 p-1 font-semibold flex items-center gap-1 text-xs" title="Apply Credit"><CheckSquare className="w-3.5 h-3.5" /> Apply</button>
          )}
        </div>
      )
    }
  ];

  const visibleData = useMemo(() => {
    return data.filter(item => {
      const s = search.toLowerCase();
      const matchSearch = item.cnNo.toLowerCase().includes(s) || item.customerName.toLowerCase().includes(s) || item.againstInvoiceNo.toLowerCase().includes(s);
      const matchStatus = statusFilter ? item.status === statusFilter : true;
      return matchSearch && matchStatus;
    });
  }, [data, search, statusFilter]);

  // Form Calculations
  const calcValues = useMemo(() => {
    let creditAmt = 0;
    let gstAdj = 0;
    formProducts.forEach(p => {
      const lineAmt = p.returnQty * p.unitRate;
      creditAmt += lineAmt;
      gstAdj += lineAmt * (p.gstPct / 100);
    });
    return {
      taxable: creditAmt,
      cgst: gstAdj / 2,
      sgst: gstAdj / 2,
      totalGst: gstAdj,
      net: creditAmt + gstAdj
    };
  }, [formProducts]);

  const handleSubmit = (asDraft: boolean) => {
    if (editId) {
      setData(prev => prev.map(item => item.id === editId ? {
        ...item,
        againstInvoiceNo: formInvoiceNo || 'INV/26/000',
        cnType: formCnType,
        reason: formReason,
        creditAmount: calcValues.taxable,
        gstAdjustment: calcValues.totalGst,
        status: asDraft ? 'Draft' : 'Pending Approval'
      } : item));
    } else {
      const newRecord: CreditNoteData = {
        id: Math.random().toString(),
        cnNo: `CN/26/0${Math.floor(100 + Math.random() * 900)}`,
        cnDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-'),
        customerName: mockInvoiceDetails.customerName,
        customerType: mockInvoiceDetails.customerType,
        againstInvoiceNo: formInvoiceNo || 'INV/26/000',
        invoiceDate: mockInvoiceDetails.invoiceDate,
        cnType: formCnType,
        reason: formReason,
        creditAmount: calcValues.taxable,
        gstAdjustment: calcValues.totalGst,
        status: asDraft ? 'Draft' : 'Pending Approval'
      };
      setData([newRecord, ...data]);
    }
    setShowCreateForm(false);
    resetForm();
  };

  const updateProductQty = (id: string, qty: number) => {
    setFormProducts(prev => prev.map(p => {
      if (p.id === id) {
        return { ...p, returnQty: Math.min(Math.max(0, qty), p.soldQty) };
      }
      return p;
    }));
  };

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Credit Notes"
        subtitle="Manage credit notes issued against sales returns, price differences, or discounts."
        actions={
          <>
            <ActionButton variant="secondary" icon={<Download className="w-4 h-4" />}>Export Register</ActionButton>
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
            { label: 'Draft', value: 'Draft' },
            { label: 'Pending Approval', value: 'Pending Approval' },
            { label: 'Approved', value: 'Approved' },
            { label: 'Applied', value: 'Applied' },
            { label: 'Cancelled', value: 'Cancelled' },
          ]}
          placeholder="Status"
        />
      </FilterBar>

      <TableCard>
        <div className="[&>div::-webkit-scrollbar]:hidden [&>div]:[-ms-overflow-style:none] [&>div]:[scrollbar-width:none]">
          <DataTable
            columns={columns}
            data={visibleData}
            emptyMessage="No credit notes match the selected filters."
          />
        </div>
      </TableCard>

      {/* CREATE FORM MODAL */}
      {showCreateForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">{editId ? 'Edit Credit Note' : 'Create Credit Note'}</h2>
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
                  <option>Sales Return</option>
                  <option>Expiry Return</option>
                  <option>Damaged Goods</option>
                  <option>Rate Difference</option>
                  <option>Discount Adjustment</option>
                  <option>Manual Credit</option>
                </select>
              </div>

              {/* SECTION 2: INVOICE REFERENCE */}
              <div className="md:col-span-6 mt-4">
                <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">2. Invoice Reference</h3>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Select Invoice</label>
                <select className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-violet-500 bg-white" value={formInvoiceNo} onChange={e => setFormInvoiceNo(e.target.value)}>
                  <option value="">-- Select Invoice --</option>
                  <option value="INV/26/001">INV/26/001</option>
                  <option value="INV/26/002">INV/26/002</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Invoice Date</label>
                <input type="text" disabled value={formInvoiceNo ? mockInvoiceDetails.invoiceDate : ''} className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 text-slate-500" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Customer Name</label>
                <input type="text" disabled value={formInvoiceNo ? mockInvoiceDetails.customerName : ''} className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 text-slate-500" />
              </div>
              <div className="md:col-span-3">
                <label className="block text-sm font-medium mb-1">Customer Type</label>
                <input type="text" disabled value={formInvoiceNo ? mockInvoiceDetails.customerType : ''} className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 text-slate-500" />
              </div>
              <div className="md:col-span-3">
                <label className="block text-sm font-medium mb-1">GSTIN</label>
                <input type="text" disabled value={formInvoiceNo ? mockInvoiceDetails.gstin : ''} className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 text-slate-500" />
              </div>

              {/* SECTION 3: REASON */}
              <div className="md:col-span-6 mt-4">
                <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">3. Credit Note Reason</h3>
              </div>
              <div className="md:col-span-3">
                <label className="block text-sm font-medium mb-1">Reason</label>
                <select className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-violet-500 bg-white" value={formReason} onChange={e => setFormReason(e.target.value)}>
                  <option>Sales Return</option>
                  <option>Expiry Return</option>
                  <option>Damaged Goods</option>
                  <option>Wrong Billing</option>
                  <option>Price Adjustment</option>
                  <option>Promotional Discount</option>
                  <option>Other</option>
                </select>
              </div>
              <div className="md:col-span-3">
                <label className="block text-sm font-medium mb-1">Remarks</label>
                <input type="text" className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-violet-500" placeholder="Enter remarks..." value={formRemarks} onChange={e => setFormRemarks(e.target.value)} />
              </div>

              {/* SECTION 4: PRODUCT DETAILS */}
              {formInvoiceNo && (
                <>
                  <div className="md:col-span-6 mt-4">
                    <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">4. Product Adjustment Details</h3>
                  </div>
                  <div className="md:col-span-6 overflow-x-auto border border-slate-200 rounded-lg">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-50 text-xs font-semibold text-slate-600 border-b border-slate-200 uppercase">
                        <tr>
                          <th className="px-4 py-3">Product Name</th>
                          <th className="px-4 py-3">Batch Number</th>
                          <th className="px-4 py-3 text-right">Qty Sold</th>
                          <th className="px-4 py-3 text-right">Return Qty</th>
                          <th className="px-4 py-3 text-right">Unit Rate</th>
                          <th className="px-4 py-3 text-right">Credit Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm">
                        {formProducts.map(p => (
                          <tr key={p.id}>
                            <td className="px-4 py-3 font-medium text-slate-800">{p.name}</td>
                            <td className="px-4 py-3 text-slate-600">{p.batch}</td>
                            <td className="px-4 py-3 text-right text-slate-600">{p.soldQty}</td>
                            <td className="px-4 py-3 text-right">
                              <input type="number" min="0" max={p.soldQty} className="w-20 text-right border border-slate-200 rounded px-2 py-1 outline-none focus:border-violet-500" value={p.returnQty} onChange={e => updateProductQty(p.id, parseInt(e.target.value) || 0)} />
                            </td>
                            <td className="px-4 py-3 text-right text-slate-600">{formatCurrency(p.unitRate)}</td>
                            <td className="px-4 py-3 text-right font-bold text-slate-800">{formatCurrency(p.returnQty * p.unitRate)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {/* SECTION 5: GST ADJUSTMENT */}
              <div className="md:col-span-3 mt-4">
                <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">5. GST Adjustment</h3>
                <div className="space-y-3 mt-4 text-sm bg-slate-50 p-4 rounded-lg border border-slate-100">
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
                  <div className="flex justify-between">
                    <span className="text-slate-600">IGST Adjustment</span>
                    <span className="text-slate-600">₹ 0.00</span>
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
                <div className="space-y-4 mt-4 bg-violet-50 p-4 rounded-lg border border-violet-100 h-[calc(100%-2.5rem)] flex flex-col justify-center">
                  <div className="flex justify-between text-violet-900 text-sm">
                    <span>Total Credit Amount</span>
                    <span className="font-semibold">{formatCurrency(calcValues.taxable)}</span>
                  </div>
                  <div className="flex justify-between text-violet-900 text-sm border-b border-violet-200 pb-3">
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
                <ActionButton variant="secondary" onClick={() => handleSubmit(true)}>Save Draft</ActionButton>
                <ActionButton onClick={() => handleSubmit(false)}>Submit Credit Note</ActionButton>
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
               
               {viewRecord.status === 'Draft' && (
                 <>
                  <ActionButton icon={<Edit className="w-4 h-4"/>} onClick={() => { handleAction(viewRecord.id, 'Edit'); setViewRecord(null); }}>Edit</ActionButton>
                  <ActionButton variant="secondary" className="text-rose-600 border-rose-200 hover:bg-rose-50" icon={<Trash2 className="w-4 h-4"/>} onClick={() => { handleAction(viewRecord.id, 'Delete'); setViewRecord(null); }}>Delete</ActionButton>
                 </>
               )}
               {viewRecord.status === 'Pending Approval' && (
                 <>
                  <ActionButton className="bg-emerald-600 hover:bg-emerald-700" icon={<CheckCircle className="w-4 h-4"/>} onClick={() => { handleAction(viewRecord.id, 'Approve'); setViewRecord({...viewRecord, status: 'Approved'}); }}>Approve</ActionButton>
                  <ActionButton variant="secondary" className="text-rose-600 border-rose-200 hover:bg-rose-50" icon={<XCircle className="w-4 h-4"/>} onClick={() => { handleAction(viewRecord.id, 'Reject'); setViewRecord({...viewRecord, status: 'Cancelled'}); }}>Reject</ActionButton>
                 </>
               )}
               {viewRecord.status === 'Approved' && (
                 <ActionButton className="bg-blue-600 hover:bg-blue-700" icon={<CheckSquare className="w-4 h-4"/>} onClick={() => { handleAction(viewRecord.id, 'Apply Credit'); setViewRecord({...viewRecord, status: 'Applied'}); }}>Apply Credit</ActionButton>
               )}
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">SECTION 1 – Credit Note Information</h3>
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
                <DrawerField label="CN Number" value={<span className="font-semibold text-slate-900">{viewRecord.cnNo}</span>} />
                <DrawerField label="Date" value={viewRecord.cnDate} />
                <DrawerField label="Status" value={<Badge variant={getStatusVariant(viewRecord.status)}>{viewRecord.status}</Badge>} />
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
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">SECTION 5 – Financial Summary</h3>
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
                <DrawerField label="Taxable Amount" value={formatCurrency(viewRecord.creditAmount)} />
                <DrawerField label="GST Adjustment" value={formatCurrency(viewRecord.gstAdjustment)} />
                <div className="col-span-2">
                  <DrawerField label="Net Credit Value" value={<span className="font-bold text-lg text-slate-900">{formatCurrency(viewRecord.creditAmount + viewRecord.gstAdjustment)}</span>} />
                </div>
              </div>
            </div>

            {(viewRecord.status === 'Approved' || viewRecord.status === 'Applied') && (
              <div>
                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">SECTION 6 – Approval Audit</h3>
                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
                  <DrawerField label="Created By" value="Admin" />
                  <DrawerField label="Created Date" value={viewRecord.cnDate} />
                  <DrawerField label="Approved By" value="Finance Manager" />
                  <DrawerField label="Approval Date" value={new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-')} />
                </div>
              </div>
            )}

            <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
              <ActionButton variant="secondary" onClick={() => setViewRecord(null)}>Close</ActionButton>
            </div>
          </div>
        )}
      </Drawer>

    </div>
  );
}
