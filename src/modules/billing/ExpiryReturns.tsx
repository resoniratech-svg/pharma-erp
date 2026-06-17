import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Download, Filter, AlertTriangle, Eye, Settings2, ChevronDown } from 'lucide-react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

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
  DrawerField
} from './components/shared';
import { type Column, type BadgeVariant } from './components/shared';

// -- TYPES --
type ERStatus = 'Pending Vendor' | 'Credit Note Received' | 'Replacement Received' | 'Settled' | 'Closed';

interface ExpiryReturn {
  id: string;
  returnNo: string;
  returnDate: string;
  customerName: string;
  productName: string;
  batchNo: string;
  expiryDate: string;
  qty: string;
  vendorName: string;
  settlementType: 'Credit Note' | 'Replacement' | 'Destruction' | 'Pending';
  claimValue: number;
  status: ERStatus;
  
  // Timeline dates
  createdDate: string;
  notifiedDate?: string;
  settledDate?: string;
  closedDate?: string;
}

// -- HELPERS --
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

const getStatusVariant = (status: ERStatus): BadgeVariant => {
  switch(status) {
    case 'Settled': 
    case 'Closed': 
      return 'success';
    case 'Credit Note Received':
    case 'Replacement Received':
      return 'info';
    case 'Pending Vendor': 
      return 'warning';
    default: 
      return 'neutral';
  }
};

const getFormattedDate = () => {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}_${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}`;
};

// -- MOCK DATA --
const initialData: ExpiryReturn[] = [
  { 
    id: '1', 
    returnNo: 'EXP-26-101', 
    returnDate: '2026-06-10',
    customerName: 'Wellness Medicos', 
    productName: 'Cough Syrup 100ml', 
    batchNo: 'B-8991', 
    expiryDate: '2026-05',
    qty: '50 Bottles', 
    vendorName: 'Sun Pharma',
    settlementType: 'Pending',
    claimValue: 4500,
    status: 'Pending Vendor',
    createdDate: '2026-06-10',
    notifiedDate: '2026-06-11'
  },
  { 
    id: '2', 
    returnNo: 'EXP-26-102', 
    returnDate: '2026-06-12',
    customerName: 'Apollo Pharmacy', 
    productName: 'Paracetamol 650mg', 
    batchNo: 'B-7712', 
    expiryDate: '2026-04',
    qty: '100 Strips', 
    vendorName: 'Cipla',
    settlementType: 'Credit Note',
    claimValue: 2200,
    status: 'Credit Note Received',
    createdDate: '2026-06-12',
    notifiedDate: '2026-06-12',
    settledDate: '2026-06-15'
  },
  { 
    id: '3', 
    returnNo: 'EXP-26-103', 
    returnDate: '2026-06-14',
    customerName: 'City Hospital', 
    productName: 'Amoxicillin 500mg', 
    batchNo: 'A-1022', 
    expiryDate: '2026-03',
    qty: '200 Caps', 
    vendorName: 'Alkem',
    settlementType: 'Replacement',
    claimValue: 5800,
    status: 'Settled',
    createdDate: '2026-06-14',
    notifiedDate: '2026-06-15',
    settledDate: '2026-06-16',
    closedDate: '2026-06-17'
  },
];

export default function ExpiryReturns() {
  const [data, setData] = useState<ExpiryReturn[]>(initialData);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [settlementFilter, setSettlementFilter] = useState('');
  const [vendorFilter, setVendorFilter] = useState('');
  const [expiryMonthFilter, setExpiryMonthFilter] = useState('');

  // Dropdown states
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // Drawer states
  const [viewRecord, setViewRecord] = useState<ExpiryReturn | null>(null);
  const [processRecord, setProcessRecord] = useState<ExpiryReturn | null>(null);

  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // -- FILTER LOGIC --
  const visibleData = useMemo(() => {
    return data.filter((item) => {
      const s = search.toLowerCase();
      const matchSearch = 
        item.returnNo.toLowerCase().includes(s) || 
        item.customerName.toLowerCase().includes(s) || 
        item.productName.toLowerCase().includes(s) || 
        item.batchNo.toLowerCase().includes(s);
        
      const matchStatus = statusFilter ? item.status === statusFilter : true;
      const matchSettlement = settlementFilter ? item.settlementType === settlementFilter : true;
      const matchVendor = vendorFilter ? item.vendorName === vendorFilter : true;
      const matchExpiry = expiryMonthFilter ? item.expiryDate === expiryMonthFilter : true;
      
      return matchSearch && matchStatus && matchSettlement && matchVendor && matchExpiry;
    });
  }, [data, search, statusFilter, settlementFilter, vendorFilter, expiryMonthFilter]);

  // -- EXPORT ACTIONS --
  const handleExportCSV = () => {
    const headers = ['Return No', 'Return Date', 'Customer Name', 'Product Name', 'Batch No', 'Expiry Date', 'Quantity', 'Vendor Name', 'Settlement Type', 'Claim Value', 'Status'];
    const csvData = visibleData.map(row => [
      row.returnNo, row.returnDate, row.customerName, row.productName, row.batchNo, row.expiryDate, row.qty, row.vendorName, row.settlementType, row.claimValue, row.status
    ]);
    const csvContent = [headers.join(','), ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Expiry_Return_Register_${getFormattedDate()}.csv`;
    link.click();
    setShowExportMenu(false);
  };

  const handleExportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(visibleData.map(row => ({
      'Return No': row.returnNo,
      'Return Date': row.returnDate,
      'Customer Name': row.customerName,
      'Product Name': row.productName,
      'Batch No': row.batchNo,
      'Expiry Date': row.expiryDate,
      'Quantity': row.qty,
      'Vendor Name': row.vendorName,
      'Settlement Type': row.settlementType,
      'Claim Value': row.claimValue,
      'Status': row.status
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'ExpiryReturns');
    XLSX.writeFile(workbook, `Expiry_Return_Register_${getFormattedDate()}.xlsx`);
    setShowExportMenu(false);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF('landscape');
    
    doc.setFontSize(16);
    doc.text('Pharma ERP - Expiry Return Register', 14, 15);
    
    doc.setFontSize(10);
    doc.text(`Export Date: ${new Date().toLocaleDateString()}`, 14, 25);
    doc.text(`Total Records: ${visibleData.length}`, 14, 30);
    
    const tableData = visibleData.map(row => [
      row.returnNo,
      row.returnDate,
      row.customerName,
      row.productName,
      row.batchNo,
      row.expiryDate,
      row.qty,
      row.vendorName,
      row.settlementType,
      formatCurrency(row.claimValue),
      row.status
    ]);

    (doc as any).autoTable({
      head: [['Return No', 'Date', 'Customer', 'Product', 'Batch', 'Expiry', 'Qty', 'Vendor', 'Settlement', 'Value', 'Status']],
      body: tableData,
      startY: 35,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [79, 70, 229] }
    });

    doc.save(`Expiry_Return_Register_${getFormattedDate()}.pdf`);
    setShowExportMenu(false);
  };

  const downloadDocument = (record: ExpiryReturn, e: React.MouseEvent) => {
    e.stopPropagation();
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`Vendor Settlement Document`, 14, 20);
    doc.setFontSize(12);
    doc.text(`Return No: ${record.returnNo}`, 14, 35);
    doc.text(`Vendor: ${record.vendorName}`, 14, 45);
    doc.text(`Product: ${record.productName} (Batch: ${record.batchNo})`, 14, 55);
    doc.text(`Settlement Type: ${record.settlementType}`, 14, 65);
    doc.text(`Claim Value: ${formatCurrency(record.claimValue)}`, 14, 75);
    doc.text(`Status: ${record.status}`, 14, 85);
    doc.text(`Settlement Date: ${record.settledDate || 'N/A'}`, 14, 95);
    
    doc.save(`${record.returnNo}_Settlement.pdf`);
  };

  // -- ACTION HANDLERS --
  const handleAction = (id: string, action: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const record = data.find(item => item.id === id);
    if (!record) return;

    if (action === 'Process Settlement') {
      setProcessRecord(record);
    }
  };

  const columns: Column<ExpiryReturn>[] = [
    { key: 'returnNo', label: 'Return No', render: (row) => <span className="font-semibold text-slate-900">{row.returnNo}</span> },
    { key: 'returnDate', label: 'Return Date' },
    { key: 'customerName', label: 'Customer Name', render: (row) => <span className="font-medium text-violet-700">{row.customerName}</span> },
    { key: 'productName', label: 'Product Name', render: (row) => <span className="font-medium text-slate-800">{row.productName}</span> },
    { key: 'batchNo', label: 'Batch No', render: (row) => <span className="font-mono text-xs text-slate-600">{row.batchNo}</span> },
    { key: 'expiryDate', label: 'Expiry Date', render: (row) => <span className="text-rose-600 font-medium">{row.expiryDate}</span> },
    { key: 'qty', label: 'Quantity Returned' },
    { key: 'vendorName', label: 'Vendor Name' },
    { key: 'settlementType', label: 'Settlement Type' },
    { key: 'claimValue', label: 'Claim Value', render: (row) => <span className="font-bold text-slate-800">{formatCurrency(row.claimValue)}</span> },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <Badge variant={getStatusVariant(row.status)}>{row.status}</Badge>,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => {
        const hasDocument = ['Credit Note Received', 'Replacement Received', 'Settled', 'Closed'].includes(row.status);
        
        return (
          <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
            <button onClick={() => setViewRecord(row)} className="text-slate-400 hover:text-violet-600 transition-colors p-1" title="View"><Eye className="w-4 h-4" /></button>
            
            {row.status === 'Pending Vendor' && (
              <button onClick={(e) => handleAction(row.id, 'Process Settlement', e)} className="text-amber-600 hover:text-amber-700 p-1 font-semibold flex items-center gap-1 text-xs" title="Settlement"><Settings2 className="w-3.5 h-3.5" /> Settlement</button>
            )}

            {hasDocument && (
               <button onClick={(e) => downloadDocument(row, e)} className="text-slate-400 hover:text-emerald-600 p-1 font-semibold flex items-center gap-1 text-xs" title="Download Document"><Download className="w-3.5 h-3.5" /> Docs</button>
            )}
          </div>
        );
      }
    }
  ];

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Expiry Return"
        subtitle="Manage expired goods returned from customers for vendor settlement or destruction."
        actions={
          <div className="relative inline-block text-left" ref={exportMenuRef}>
            <ActionButton 
              variant="secondary" 
              onClick={() => setShowExportMenu(!showExportMenu)}
            >
              Export Register
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

      <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 mb-6 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-rose-600 mt-0.5" />
        <div>
          <h3 className="text-sm font-semibold text-rose-800">Pending Vendor Settlements</h3>
          <p className="text-sm text-rose-700 mt-1">₹ 45,000 worth of expired stock is pending replacement or credit note settlement from vendors.</p>
        </div>
      </div>

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search return no, customer, product or batch..." />
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
            { label: 'Pending Vendor', value: 'Pending Vendor' },
            { label: 'Credit Note Received', value: 'Credit Note Received' },
            { label: 'Replacement Received', value: 'Replacement Received' },
            { label: 'Settled', value: 'Settled' },
            { label: 'Closed', value: 'Closed' },
          ]}
          placeholder="Status"
        />
        <SelectFilter
          value={settlementFilter}
          onChange={setSettlementFilter}
          options={[
            { label: 'All Settlements', value: '' },
            { label: 'Credit Note', value: 'Credit Note' },
            { label: 'Replacement', value: 'Replacement' },
            { label: 'Destruction', value: 'Destruction' },
            { label: 'Pending', value: 'Pending' },
          ]}
          placeholder="Settlement Type"
        />
        <SelectFilter
          value={vendorFilter}
          onChange={setVendorFilter}
          options={[
            { label: 'All Vendors', value: '' },
            { label: 'Sun Pharma', value: 'Sun Pharma' },
            { label: 'Cipla', value: 'Cipla' },
            { label: 'Alkem', value: 'Alkem' },
          ]}
          placeholder="Vendor"
        />
        <SelectFilter
          value={expiryMonthFilter}
          onChange={setExpiryMonthFilter}
          options={[
            { label: 'All Months', value: '' },
            { label: '2026-03', value: '2026-03' },
            { label: '2026-04', value: '2026-04' },
            { label: '2026-05', value: '2026-05' },
          ]}
          placeholder="Expiry Month"
        />
      </FilterBar>

      <TableCard>
        <div className="[&>div::-webkit-scrollbar]:hidden [&>div]:[-ms-overflow-style:none] [&>div]:[scrollbar-width:none]">
          <DataTable
            columns={columns}
            data={visibleData}
            emptyMessage="No expiry returns match the selected filters."
          />
        </div>
      </TableCard>

      {/* VIEW DRAWER */}
      <Drawer open={!!viewRecord} onClose={() => setViewRecord(null)} title="View Expiry Return Details">
        {viewRecord && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">1. Return Information</h3>
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
                <DrawerField label="Return No" value={<span className="font-semibold text-slate-900">{viewRecord.returnNo}</span>} />
                <DrawerField label="Return Date" value={viewRecord.returnDate} />
                <DrawerField label="Customer Name" value={<span className="font-medium text-violet-700">{viewRecord.customerName}</span>} />
                <DrawerField label="Vendor Name" value={viewRecord.vendorName} />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">2. Product Information</h3>
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
                <div className="col-span-2">
                  <DrawerField label="Product Name" value={<span className="font-medium text-slate-900">{viewRecord.productName}</span>} />
                </div>
                <DrawerField label="Batch No" value={<span className="font-mono text-xs">{viewRecord.batchNo}</span>} />
                <DrawerField label="Expiry Date" value={<span className="text-rose-600 font-medium">{viewRecord.expiryDate}</span>} />
                <DrawerField label="Quantity Returned" value={viewRecord.qty} />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">3. Settlement Information</h3>
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
                <DrawerField label="Settlement Type" value={viewRecord.settlementType} />
                <DrawerField label="Claim Value" value={<span className="font-bold text-slate-900">{formatCurrency(viewRecord.claimValue)}</span>} />
                <DrawerField label="Settlement Status" value={<Badge variant={getStatusVariant(viewRecord.status)}>{viewRecord.status}</Badge>} />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">4. Timeline</h3>
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
                <DrawerField label="Return Created" value={viewRecord.createdDate} />
                <DrawerField label="Vendor Notified" value={viewRecord.notifiedDate || '-'} />
                <DrawerField label="Settlement Received" value={viewRecord.settledDate || '-'} />
                <DrawerField label="Closed" value={viewRecord.closedDate || '-'} />
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
              <ActionButton variant="secondary" onClick={() => setViewRecord(null)}>Close</ActionButton>
            </div>
          </div>
        )}
      </Drawer>

      {/* PROCESS SETTLEMENT DRAWER */}
      <Drawer open={!!processRecord} onClose={() => setProcessRecord(null)} title="Process Vendor Settlement">
        {processRecord && (
          <div className="space-y-6">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-amber-800">
                Select the settlement outcome for Vendor: <strong>{processRecord.vendorName}</strong> regarding Claim Value: <strong>{formatCurrency(processRecord.claimValue)}</strong>.
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Settlement Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1 text-slate-700">Settlement Type</label>
                  <select 
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white outline-none focus:border-violet-500 text-sm"
                    value={processRecord.settlementType}
                    onChange={(e) => setProcessRecord({...processRecord, settlementType: e.target.value as any})}
                  >
                    <option value="Pending">-- Select --</option>
                    <option value="Credit Note">Credit Note</option>
                    <option value="Replacement">Replacement</option>
                    <option value="Destruction">Destruction</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
              <ActionButton variant="secondary" onClick={() => setProcessRecord(null)}>Cancel</ActionButton>
              <ActionButton onClick={() => {
                const newStatus = 
                  processRecord.settlementType === 'Credit Note' ? 'Credit Note Received' : 
                  processRecord.settlementType === 'Replacement' ? 'Replacement Received' : 
                  'Settled';
                  
                setData(prev => prev.map(item => item.id === processRecord.id ? { 
                  ...processRecord, 
                  status: newStatus,
                  settledDate: new Date().toISOString().split('T')[0]
                } : item));
                setProcessRecord(null);
              }}>Submit Settlement</ActionButton>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
