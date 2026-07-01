import { useState, useMemo, useRef, useEffect } from 'react';
import { Download, Filter, PackageMinus, Eye, Edit, Trash2, CheckCircle, FileText, Settings2, ChevronDown } from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
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
  DrawerField,
} from './components/shared';
import { type Column, type BadgeVariant } from './components/shared';

type QCStatus = 'Pending QC' | 'Passed' | 'Failed';
type CNStatus = 'Not Generated' | 'Generated' | 'Applied';
type SRStatus = 'Draft' | 'Submitted' | 'QC Pending' | 'Approved' | 'Rejected' | 'Completed';

interface ReturnProduct {
  id: string;
  name: string;
  batch: string;
  soldQty: number;
  returnQty: number;
  unitPrice: number;
}

interface ReturnEntry {
  id: string;
  returnNo: string;
  customerName: string;
  customerType: string;
  invoiceNo: string;
  returnType: string;
  reason: string;
  remarks: string;
  returnValue: number;
  gstReversal: number;
  cnAmount: number;
  date: string;
  
  qcStatus: QCStatus;
  physicalCondition: string;
  batchVerification: string;
  expiryVerification: string;
  qcRemarks: string;
  
  cnStatus: CNStatus;
  status: SRStatus;
  
  approvedBy: string;
  approvalRemarks: string;
  
  products: ReturnProduct[];
}

const mockData: ReturnEntry[] = [
  { 
    id: '1', returnNo: 'SR-26-001', customerName: 'Apollo Pharmacy', customerType: 'Retailer', invoiceNo: 'INV/26/001', 
    returnType: 'Damaged Transit', reason: 'Boxes crushed during delivery', remarks: 'Received via logistics partner', 
    returnValue: 1500, gstReversal: 180, cnAmount: 1680, date: '15-Oct-2026', 
    qcStatus: 'Passed', physicalCondition: 'Damaged packaging, strips intact', batchVerification: 'Matched', expiryVerification: 'Valid', qcRemarks: 'Approved for destruction', 
    cnStatus: 'Generated', status: 'Approved', approvedBy: 'Admin', approvalRemarks: 'Processed for credit',
    products: [{ id: 'p1', name: 'Paracetamol 500mg', batch: 'B001', soldQty: 100, returnQty: 10, unitPrice: 150 }]
  },
  { 
    id: '2', returnNo: 'SR-26-002', customerName: 'MedPlus Store', customerType: 'Hospital', invoiceNo: 'INV/26/002', 
    returnType: 'Order Cancelled', reason: 'Customer rejected delivery', remarks: 'Late delivery', 
    returnValue: 4500, gstReversal: 540, cnAmount: 0, date: '16-Oct-2026', 
    qcStatus: 'Pending QC', physicalCondition: 'Not checked', batchVerification: 'Pending', expiryVerification: 'Pending', qcRemarks: '', 
    cnStatus: 'Not Generated', status: 'QC Pending', approvedBy: '', approvalRemarks: '',
    products: [{ id: 'p2', name: 'Amoxicillin 250mg', batch: 'B002', soldQty: 50, returnQty: 50, unitPrice: 90 }]
  },
  { 
    id: '3', returnNo: 'SR-26-003', customerName: 'City Clinic', customerType: 'Clinic', invoiceNo: 'INV/26/005', 
    returnType: 'Wrong Item', reason: 'Dispatched 500mg instead of 250mg', remarks: 'Replace requested', 
    returnValue: 1200, gstReversal: 144, cnAmount: 0, date: '18-Oct-2026', 
    qcStatus: 'Pending QC', physicalCondition: '', batchVerification: '', expiryVerification: '', qcRemarks: '', 
    cnStatus: 'Not Generated', status: 'Draft', approvedBy: '', approvalRemarks: '',
    products: [{ id: 'p3', name: 'Ciprofloxacin 500mg', batch: 'B005', soldQty: 20, returnQty: 20, unitPrice: 60 }]
  },
  { 
    id: '4', returnNo: 'SR-26-004', customerName: 'Wellness Medicos', customerType: 'Retailer', invoiceNo: 'INV/26/008', 
    returnType: 'Expired Goods', reason: 'Near expiry items returned per policy', remarks: 'Authorized by Sales Rep', 
    returnValue: 3400, gstReversal: 408, cnAmount: 3808, date: '19-Oct-2026', 
    qcStatus: 'Passed', physicalCondition: 'Sealed', batchVerification: 'Matched', expiryVerification: 'Expired', qcRemarks: 'Send to expiry warehouse', 
    cnStatus: 'Applied', status: 'Completed', approvedBy: 'Finance Manager', approvalRemarks: 'Credit adjusted against outstanding',
    products: [{ id: 'p4', name: 'Azithromycin 500mg', batch: 'B008', soldQty: 200, returnQty: 50, unitPrice: 68 }]
  },
];

const formatCurrency = (amount: number) => `₹ ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function SalesReturns() {
  const [data, setData] = useState<ReturnEntry[]>(mockData);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [qcFilter, setQcFilter] = useState('');
  const [cnFilter, setCnFilter] = useState('');

  // Export Menu State
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Drawer States
  const [viewRecord, setViewRecord] = useState<ReturnEntry | null>(null);
  const [processRecord, setProcessRecord] = useState<ReturnEntry | null>(null);

  const getQCVariant = (status: QCStatus): BadgeVariant => {
    switch(status) {
      case 'Passed': return 'success';
      case 'Failed': return 'danger';
      case 'Pending QC': return 'warning';
      default: return 'neutral';
    }
  };

  const getCNVariant = (status: CNStatus): BadgeVariant => {
    switch(status) {
      case 'Generated': case 'Applied': return 'success';
      case 'Not Generated': return 'neutral';
      default: return 'neutral';
    }
  };

  const getStatusVariant = (status: SRStatus): BadgeVariant => {
    switch(status) {
      case 'Completed': case 'Approved': return 'success';
      case 'Rejected': return 'danger';
      case 'Submitted': case 'QC Pending': return 'warning';
      case 'Draft': return 'neutral';
      default: return 'neutral';
    }
  };

  const handleAction = (id: string, action: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const record = data.find(item => item.id === id);
    if (!record) return;

    if (action === 'Delete') {
      if (window.confirm('Are you sure you want to delete this Draft return?')) {
        setData(prev => prev.filter(item => item.id !== id));
      }
    } else if (action === 'Process QC') {
      setProcessRecord(record);
    } else if (action === 'Generate Credit Note') {
      setData(prev => prev.map(item => item.id === id ? { ...item, status: 'Completed', cnStatus: 'Generated' } : item));
    }
  };

  const downloadDocument = (record: ReturnEntry, e: React.MouseEvent) => {
    e.stopPropagation();
    const doc = new jsPDF();
    doc.text(`Sales Return Document`, 14, 20);
    doc.text(`Return No: ${record.returnNo}`, 14, 30);
    doc.text(`Customer: ${record.customerName}`, 14, 40);
    doc.text(`Return Value: ${formatCurrency(record.returnValue)}`, 14, 50);
    doc.text(`Status: ${record.status}`, 14, 60);
    
    const tableData = record.products.map(p => [
      p.name, p.batch, p.soldQty.toString(), p.returnQty.toString(), formatCurrency(p.unitPrice), formatCurrency(p.returnQty * p.unitPrice)
    ]);
    (doc as any).autoTable({
      head: [['Product', 'Batch', 'Sold Qty', 'Return Qty', 'Unit Price', 'Amount']],
      body: tableData,
      startY: 70,
    });

    doc.save(`${record.returnNo}_Document.pdf`);
  };

  const columns: Column<ReturnEntry>[] = [
    { key: 'returnNo', label: 'Return No', render: (row) => <span className="font-semibold text-slate-900">{row.returnNo}</span> },
    { key: 'customerName', label: 'Customer Name', render: (row) => <span className="font-medium text-violet-700">{row.customerName}</span> },
    { key: 'invoiceNo', label: 'Original Invoice', render: (row) => <span className="font-mono text-xs text-slate-600">{row.invoiceNo}</span> },
    { key: 'returnValue', label: 'Return Value', render: (row) => <span className="font-bold text-slate-800">{formatCurrency(row.returnValue)}</span> },
    { key: 'qcStatus', label: 'QC Status', render: (row) => <Badge variant={getQCVariant(row.qcStatus)}>{row.qcStatus}</Badge> },
    { key: 'cnStatus', label: 'Credit Note Status', render: (row) => <Badge variant={getCNVariant(row.cnStatus)}>{row.cnStatus}</Badge> },
    { key: 'status', label: 'Status', render: (row) => <Badge variant={getStatusVariant(row.status)}>{row.status}</Badge> },
    { key: 'date', label: 'Return Date' },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          <button onClick={() => setViewRecord(row)} className="text-slate-400 hover:text-violet-600 transition-colors p-1" title="View"><Eye className="w-4 h-4" /></button>
          
          {row.status === 'Draft' && (
            <button onClick={(e) => handleAction(row.id, 'Delete', e)} className="text-slate-400 hover:text-rose-600 p-1" title="Delete"><Trash2 className="w-4 h-4" /></button>
          )}

          {row.status === 'QC Pending' && (
            <button onClick={(e) => handleAction(row.id, 'Process QC', e)} className="text-amber-600 hover:text-amber-700 p-1 font-semibold flex items-center gap-1 text-xs" title="Process QC"><Settings2 className="w-3.5 h-3.5" /> Process QC</button>
          )}

          {row.status === 'Approved' && row.cnStatus !== 'Generated' && row.cnStatus !== 'Applied' && (
            <button onClick={(e) => handleAction(row.id, 'Generate Credit Note', e)} className="text-blue-600 hover:text-blue-700 p-1 font-semibold flex items-center gap-1 text-xs" title="Generate Credit Note"><FileText className="w-3.5 h-3.5" /> Gen CN</button>
          )}

          {(row.status === 'Completed' || row.cnStatus === 'Generated' || row.cnStatus === 'Applied') && (
             <button onClick={(e) => downloadDocument(row, e)} className="text-slate-400 hover:text-emerald-600 p-1 font-semibold flex items-center gap-1 text-xs" title="Download Documents"><Download className="w-3.5 h-3.5" /> Docs</button>
          )}
        </div>
      )
    }
  ];

  const visibleData = useMemo(() => {
    return data.filter((item) => {
      const s = search.toLowerCase();
      const matchSearch = item.returnNo.toLowerCase().includes(s) || item.customerName.toLowerCase().includes(s) || item.invoiceNo.toLowerCase().includes(s);
      const matchStatus = statusFilter ? item.status === statusFilter : true;
      const matchQc = qcFilter ? item.qcStatus === qcFilter : true;
      const matchCn = cnFilter ? item.cnStatus === cnFilter : true;
      return matchSearch && matchStatus && matchQc && matchCn;
    });
  }, [data, search, statusFilter, qcFilter, cnFilter]);

  const metrics = useMemo(() => {
    return {
      pendingQc: data.filter(d => d.qcStatus === 'Pending QC').length,
      approved: data.filter(d => d.status === 'Approved').length,
      rejected: data.filter(d => d.status === 'Rejected').length,
      pendingCn: data.filter(d => d.status === 'Approved' && d.cnStatus !== 'Generated' && d.cnStatus !== 'Applied').length,
    };
  }, [data]);

  const getFormattedDate = () => {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`;
  };

  const handleExportExcel = () => {
    if (visibleData.length === 0) {
      alert('No data available for export.');
      setShowExportMenu(false);
      return;
    }
    const exportData = visibleData.map(row => ({
      'Return No': row.returnNo,
      'Customer Name': row.customerName,
      'Original Invoice': row.invoiceNo,
      'Return Value': row.returnValue,
      'QC Status': row.qcStatus,
      'Credit Note Status': row.cnStatus,
      'Status': row.status,
      'Return Date': row.date,
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sales Return');
    XLSX.writeFile(workbook, `Sales_Return_Register_${getFormattedDate()}.xlsx`);
    setShowExportMenu(false);
  };

  const handleExportCSV = () => {
    if (visibleData.length === 0) {
      alert('No data available for export.');
      setShowExportMenu(false);
      return;
    }
    const headers = ['Return No', 'Customer Name', 'Original Invoice', 'Return Value', 'QC Status', 'Credit Note Status', 'Status', 'Return Date'];
    const csvContent = [
      headers.join(','),
      ...visibleData.map(row => 
        [row.returnNo, `"${row.customerName}"`, row.invoiceNo, row.returnValue, row.qcStatus, row.cnStatus, row.status, row.date].join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `Sales_Return_Register_${getFormattedDate()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportMenu(false);
  };

  const handleExportPDF = () => {
    if (visibleData.length === 0) {
      alert('No data available for export.');
      setShowExportMenu(false);
      return;
    }
    const doc = new jsPDF('landscape');
    doc.text('Sales Return Register', 14, 15);
    
    const tableData = visibleData.map(row => [
      row.returnNo,
      row.customerName,
      row.invoiceNo,
      row.returnValue.toString(),
      row.qcStatus,
      row.cnStatus,
      row.status,
      row.date
    ]);

    (doc as any).autoTable({
      head: [['Return No', 'Customer Name', 'Original Invoice', 'Return Value', 'QC Status', 'Credit Note Status', 'Status', 'Return Date']],
      body: tableData,
      startY: 20,
    });

    doc.save(`Sales_Return_Register_${getFormattedDate()}.pdf`);
    setShowExportMenu(false);
  };

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Sales Return"
        subtitle="Manage goods returned due to damage, cancellation, or errors."
        actions={
          <div className="relative inline-block text-left" ref={exportMenuRef}>
            <ActionButton 
              variant="secondary" 
              onClick={() => setShowExportMenu(!showExportMenu)}
            >
              Export
              <ChevronDown className="w-3 h-3 ml-1" />
            </ActionButton>
            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50 py-1">
                <button onClick={handleExportExcel} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">Export as Excel (.xlsx)</button>
                <button onClick={handleExportCSV} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">Export as CSV</button>
                <button onClick={handleExportPDF} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">Export as PDF</button>
              </div>
            )}
          </div>
        }
      />

      {/* PENDING RETURN CHECKS CARD */}
      <div className="bg-white p-4 border border-slate-200 rounded-xl mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-violet-50 flex items-center justify-center text-violet-600 shrink-0">
                  <PackageMinus className="w-5 h-5" />
              </div>
              <div>
                  <h3 className="text-sm font-semibold text-slate-800">Return Workflow Tracking</h3>
                  <p className="text-xs text-slate-500">Overview of pending actions across all sales returns.</p>
              </div>
          </div>
          <div className="flex flex-wrap items-center gap-4 md:gap-8 bg-slate-50 px-4 py-2 rounded-lg border border-slate-100">
             <div className="flex flex-col">
               <span className="text-xs font-medium text-slate-500">Pending QC</span>
               <span className="text-lg font-bold text-amber-600">{metrics.pendingQc}</span>
             </div>
             <div className="w-px h-8 bg-slate-200 hidden md:block" />
             <div className="flex flex-col">
               <span className="text-xs font-medium text-slate-500">Approved</span>
               <span className="text-lg font-bold text-emerald-600">{metrics.approved}</span>
             </div>
             <div className="w-px h-8 bg-slate-200 hidden md:block" />
             <div className="flex flex-col">
               <span className="text-xs font-medium text-slate-500">Rejected</span>
               <span className="text-lg font-bold text-rose-600">{metrics.rejected}</span>
             </div>
             <div className="w-px h-8 bg-slate-200 hidden md:block" />
             <div className="flex flex-col">
               <span className="text-xs font-medium text-slate-500">Pending CN</span>
               <span className="text-lg font-bold text-blue-600">{metrics.pendingCn}</span>
             </div>
          </div>
      </div>

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search return no, invoice no or customer..." />
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
            { label: 'QC Pending', value: 'QC Pending' },
            { label: 'Approved', value: 'Approved' },
            { label: 'Rejected', value: 'Rejected' },
            { label: 'Completed', value: 'Completed' },
          ]}
          placeholder="Return Status"
        />
        <SelectFilter
          value={qcFilter}
          onChange={setQcFilter}
          options={[
            { label: 'All QC Status', value: '' },
            { label: 'Pending QC', value: 'Pending QC' },
            { label: 'Passed', value: 'Passed' },
            { label: 'Failed', value: 'Failed' },
          ]}
          placeholder="QC Status"
        />
        <SelectFilter
          value={cnFilter}
          onChange={setCnFilter}
          options={[
            { label: 'All CN Status', value: '' },
            { label: 'Not Generated', value: 'Not Generated' },
            { label: 'Generated', value: 'Generated' },
            { label: 'Applied', value: 'Applied' },
          ]}
          placeholder="Credit Note Status"
        />
      </FilterBar>

      <TableCard>
        <div className="[&>div::-webkit-scrollbar]:hidden [&>div]:[-ms-overflow-style:none] [&>div]:[scrollbar-width:none]">
          <DataTable
            columns={columns}
            data={visibleData}
            emptyMessage="No sales returns match the selected filters."
          />
        </div>
      </TableCard>

      {/* VIEW DRAWER */}
      <Drawer open={!!viewRecord} onClose={() => setViewRecord(null)} title="View Sales Return">
        {viewRecord && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">1. Return Information</h3>
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
                <DrawerField label="Return No" value={<span className="font-semibold text-slate-900">{viewRecord.returnNo}</span>} />
                <DrawerField label="Return Date" value={viewRecord.date} />
                <DrawerField label="Status" value={<Badge variant={getStatusVariant(viewRecord.status)}>{viewRecord.status}</Badge>} />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">2. Customer Information</h3>
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
                <DrawerField label="Customer Name" value={<span className="font-medium text-violet-700">{viewRecord.customerName}</span>} />
                <DrawerField label="Customer Type" value={viewRecord.customerType} />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">3. Invoice Information</h3>
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
                <DrawerField label="Original Invoice No" value={<span className="font-mono text-sm font-semibold text-slate-800">{viewRecord.invoiceNo}</span>} />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">4. Returned Products</h3>
              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 text-xs font-semibold text-slate-600 border-b border-slate-200 uppercase">
                    <tr>
                      <th className="px-4 py-3">Product Name</th>
                      <th className="px-4 py-3">Batch</th>
                      <th className="px-4 py-3 text-right">Sold</th>
                      <th className="px-4 py-3 text-right">Returned</th>
                      <th className="px-4 py-3 text-right">Unit Price</th>
                      <th className="px-4 py-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {viewRecord.products.map(p => (
                      <tr key={p.id}>
                        <td className="px-4 py-3 font-medium text-slate-800">{p.name}</td>
                        <td className="px-4 py-3 text-slate-600">{p.batch}</td>
                        <td className="px-4 py-3 text-right text-slate-600">{p.soldQty}</td>
                        <td className="px-4 py-3 text-right font-semibold text-rose-600">{p.returnQty}</td>
                        <td className="px-4 py-3 text-right text-slate-600">{formatCurrency(p.unitPrice)}</td>
                        <td className="px-4 py-3 text-right font-bold text-slate-800">{formatCurrency(p.returnQty * p.unitPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">5. Return Reason</h3>
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
                <DrawerField label="Return Type" value={viewRecord.returnType} />
                <DrawerField label="Reason" value={viewRecord.reason} />
                <div className="col-span-2">
                  <DrawerField label="Remarks" value={viewRecord.remarks || '-'} />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">6. QC Details</h3>
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
                <DrawerField label="QC Status" value={<Badge variant={getQCVariant(viewRecord.qcStatus)}>{viewRecord.qcStatus}</Badge>} />
                <DrawerField label="Physical Condition" value={viewRecord.physicalCondition || 'Not verified'} />
                <DrawerField label="Batch Verification" value={viewRecord.batchVerification || '-'} />
                <DrawerField label="Expiry Verification" value={viewRecord.expiryVerification || '-'} />
                <div className="col-span-2">
                  <DrawerField label="QC Remarks" value={viewRecord.qcRemarks || '-'} />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">7. Financial Impact</h3>
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
                <DrawerField label="Return Value" value={<span className="font-semibold text-slate-900">{formatCurrency(viewRecord.returnValue)}</span>} />
                <DrawerField label="GST Reversal" value={formatCurrency(viewRecord.gstReversal)} />
                <DrawerField label="Credit Note Amount" value={<span className="font-bold text-slate-900">{formatCurrency(viewRecord.cnAmount)}</span>} />
                <DrawerField label="Credit Note Status" value={<Badge variant={getCNVariant(viewRecord.cnStatus)}>{viewRecord.cnStatus}</Badge>} />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">8. Audit Information</h3>
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
                <DrawerField label="Approved By" value={viewRecord.approvedBy || '-'} />
                <div className="col-span-2">
                  <DrawerField label="Approval Remarks" value={viewRecord.approvalRemarks || '-'} />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
              <ActionButton variant="secondary" onClick={() => setViewRecord(null)}>Close</ActionButton>
            </div>
          </div>
        )}
      </Drawer>

      {/* PROCESS DRAWER */}
      <Drawer open={!!processRecord} onClose={() => setProcessRecord(null)} title="Process Sales Return">
        {processRecord && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">1. Return Information</h3>
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
                <DrawerField label="Return No" value={<span className="font-semibold text-slate-900">{processRecord.returnNo}</span>} />
                <DrawerField label="Return Date" value={processRecord.date} />
                <DrawerField label="Customer Name" value={<span className="font-medium text-violet-700">{processRecord.customerName}</span>} />
                <DrawerField label="Customer Type" value={processRecord.customerType} />
                <DrawerField label="Original Invoice No" value={<span className="font-mono text-sm font-semibold text-slate-800">{processRecord.invoiceNo}</span>} />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">2. Returned Products</h3>
              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 text-xs font-semibold text-slate-600 border-b border-slate-200 uppercase">
                    <tr>
                      <th className="px-4 py-3">Product Name</th>
                      <th className="px-4 py-3">Batch</th>
                      <th className="px-4 py-3 text-right">Sold</th>
                      <th className="px-4 py-3 text-right">Returned</th>
                      <th className="px-4 py-3 text-right">Unit Price</th>
                      <th className="px-4 py-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {processRecord.products.map(p => (
                      <tr key={p.id}>
                        <td className="px-4 py-3 font-medium text-slate-800">{p.name}</td>
                        <td className="px-4 py-3 text-slate-600">{p.batch}</td>
                        <td className="px-4 py-3 text-right text-slate-600">{p.soldQty}</td>
                        <td className="px-4 py-3 text-right font-semibold text-rose-600">{p.returnQty}</td>
                        <td className="px-4 py-3 text-right text-slate-600">{formatCurrency(p.unitPrice)}</td>
                        <td className="px-4 py-3 text-right font-bold text-slate-800">{formatCurrency(p.returnQty * p.unitPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">3. Return Reason</h3>
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
                <DrawerField label="Return Type" value={processRecord.returnType} />
                <DrawerField label="Reason" value={processRecord.reason} />
                <div className="col-span-2">
                  <DrawerField label="Remarks" value={processRecord.remarks || '-'} />
                </div>
              </div>
            </div>

            {/* Editable QC Verification Section */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">4. QC Verification</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-medium mb-1 text-slate-700">Physical Condition</label>
                  <select className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white outline-none focus:border-violet-500 text-sm">
                    <option>Good / Intact</option>
                    <option>Damaged Packaging</option>
                    <option>Product Damaged</option>
                    <option>Seal Broken</option>
                  </select>
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-medium mb-1 text-slate-700">Batch Verification</label>
                  <select className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white outline-none focus:border-violet-500 text-sm">
                    <option>Matched Invoice</option>
                    <option>Mismatch</option>
                    <option>Batch Unreadable</option>
                  </select>
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-medium mb-1 text-slate-700">Expiry Verification</label>
                  <select className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white outline-none focus:border-violet-500 text-sm">
                    <option>Valid</option>
                    <option>Near Expiry</option>
                    <option>Expired</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1 text-slate-700">QC Remarks</label>
                  <input type="text" placeholder="Enter quality check remarks..." className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-violet-500 text-sm" />
                </div>
              </div>
            </div>

            {/* Editable Approval Section */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">5. Approval Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-medium mb-1 text-slate-700">Approval Status</label>
                  <select className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white outline-none focus:border-violet-500 text-sm">
                    <option>-- Select Action --</option>
                    <option>Approve Return</option>
                    <option>Reject Return</option>
                    <option>Hold for Review</option>
                  </select>
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-medium mb-1 text-slate-700">Approved By</label>
                  <input type="text" disabled value="Current User (Admin)" className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 text-slate-500 text-sm" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1 text-slate-700">Approval Remarks</label>
                  <input type="text" placeholder="Enter approval remarks..." className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-violet-500 text-sm" />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">6. Financial Impact</h3>
              <div className="grid grid-cols-2 gap-4 bg-violet-50 p-4 rounded-lg border border-violet-100">
                <DrawerField label="Return Value" value={<span className="font-semibold text-violet-900">{formatCurrency(processRecord.returnValue)}</span>} />
                <DrawerField label="GST Reversal" value={<span className="text-violet-800">{formatCurrency(processRecord.gstReversal)}</span>} />
                <div className="col-span-2">
                  <DrawerField label="Credit Note Amount" value={<span className="font-bold text-lg text-violet-950">{formatCurrency(processRecord.returnValue + processRecord.gstReversal)}</span>} />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
              <ActionButton variant="secondary" onClick={() => setProcessRecord(null)}>Cancel</ActionButton>
              <ActionButton onClick={() => {
                 setData(prev => prev.map(item => item.id === processRecord.id ? { ...item, status: 'Approved', qcStatus: 'Passed' } : item));
                 setProcessRecord(null);
              }}>Submit Processing</ActionButton>
            </div>
          </div>
        )}
      </Drawer>

    </div>
  );
}
