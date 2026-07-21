import { useState, useMemo, useRef, useEffect } from 'react';
import { Download, Filter, Eye, Play, RefreshCw, ChevronDown, FileJson, QrCode } from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

import {
  PageHeader, FilterBar, SearchInput, SelectFilter, ActionButton,
  TableCard, DataTable, Badge, Drawer, DrawerField
} from './components/shared';
import { type Column, type BadgeVariant } from './components/shared';
import { generateEInvoicePdf } from '../../documents/generators/pdfGenerator';
import { eInvoiceService } from '../../services/eInvoiceService';
import { NotificationService } from '../../services/notificationService';
import activityLogService from '../../services/activityLogService';
import authService from '../../services/authService';

// --- Types ---
type IRNStatus = 'Pending' | 'Generated' | 'Failed';
type NICStatus = 'Success' | 'Pending' | 'Error';

interface EInvoiceData {
  id: string;
  invoiceNo: string;
  orderNo: string;
  customerName: string;
  gstin: string;
  invoiceDate: string;
  taxableAmount: number;
  gstAmount: number;
  invoiceValue: number;
  
  irnStatus: IRNStatus;
  irnNumber: string;
  irnGeneratedOn: string;
  ackNo: string;
  ackDate: string;
  
  nicStatus: NICStatus;
  responseMessage: string;
  errorCode: string;
  errorDesc: string;
  
  qrStatus: 'Generated' | 'Pending' | 'Not Applicable';
}

const formatCurrency = (amount: number) => `₹ ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function EInvoice() {
  const [data, setData] = useState<EInvoiceData[]>([]);
  const [search, setSearch] = useState('');
  const [irnStatusFilter, setIrnStatusFilter] = useState('');
  const [nicStatusFilter, setNicStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const [viewRecord, setViewRecord] = useState<EInvoiceData | null>(null);

  // Dynamic invoice loader
  const loadInvoices = () => {
    const mapped = eInvoiceService.getEInvoices();
    setData(mapped);
  };

  useEffect(() => {
    loadInvoices();

    function handleClickOutside(event: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const parseDateToInput = (dateStr: string) => {
    const parts = dateStr.split('-');
    if (parts.length === 3 && parts[0].length === 2) {
      const monthMap: Record<string, string> = { Jan:'01',Feb:'02',Mar:'03',Apr:'04',May:'05',Jun:'06',Jul:'07',Aug:'08',Sep:'09',Oct:'10',Nov:'11',Dec:'12' };
      const mm = monthMap[parts[1]] || parts[1];
      return `${parts[2]}-${mm}-${parts[0]}`;
    }
    return dateStr;
  };

  const handleGenerateIRN = (invoiceNo: string, id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!window.confirm(`Are you sure you want to generate IRN for Invoice ${invoiceNo}?`)) return;
    
    const updates = eInvoiceService.generateIRN(invoiceNo);

    // Audit logs
    const currentUser = authService.getCurrentUser();
    activityLogService.addLog({
      userId: currentUser?.id,
      userName: currentUser?.fullName,
      action: `E-Invoice IRN Generated - ${invoiceNo}`,
      module: "Wholesale Billing",
    });

    // System Notification
    NotificationService.addNotification({
      title: 'E-Invoice IRN Generated',
      message: `E-Invoice IRN successfully generated for Invoice ${invoiceNo}.`,
      type: 'system',
      priority: 'info',
      module: 'Wholesale Billing'
    });

    // Reload active records
    loadInvoices();

    if (viewRecord?.id === id) {
      setViewRecord(prev => prev ? { ...prev, ...updates } : null);
    }
    
    alert(`✅ IRN Generated successfully for Invoice ${invoiceNo}!`);
  };

  const handleRetryGenerateIRN = (invoiceNo: string, id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    handleGenerateIRN(invoiceNo, id);

    const currentUser = authService.getCurrentUser();
    activityLogService.addLog({
      userId: currentUser?.id,
      userName: currentUser?.fullName,
      action: `Retried IRN Generation for Invoice ${invoiceNo}`,
      module: "Wholesale Billing"
    });
  };

  const handleDownloadPDF = (record: EInvoiceData, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    generateEInvoicePdf(record);
  };

  const handleDownloadJSON = (record: EInvoiceData, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const jsonData = {
      InvoiceNumber: record.invoiceNo,
      CustomerName: record.customerName,
      GSTIN: record.gstin,
      InvoiceDate: record.invoiceDate,
      InvoiceValue: record.invoiceValue,
      IRNNumber: record.irnNumber,
      AcknowledgementNumber: record.ackNo
    };
    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `INV-${record.invoiceNo.replace(/\//g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownloadQR = (record: EInvoiceData, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const qrDataUrl = eInvoiceService.getQRCodeDataUrl();
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `INV-${record.invoiceNo.replace(/\//g, '-')}-QR.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const visibleData = useMemo(() => {
    return data.filter(item => {
      const s = search.toLowerCase();
      const matchSearch = 
        item.invoiceNo.toLowerCase().includes(s) ||
        item.customerName.toLowerCase().includes(s) ||
        item.gstin.toLowerCase().includes(s) ||
        item.irnNumber.toLowerCase().includes(s) ||
        item.orderNo.toLowerCase().includes(s);
        
      const matchIrn = irnStatusFilter ? item.irnStatus === irnStatusFilter : true;
      const matchNic = nicStatusFilter ? item.nicStatus === nicStatusFilter : true;
      const matchDate = dateFilter ? parseDateToInput(item.invoiceDate) === dateFilter : true;
      
      return matchSearch && matchIrn && matchNic && matchDate;
    });
  }, [data, search, irnStatusFilter, nicStatusFilter, dateFilter]);

  const getFormattedDateStr = () => {
    const d = new Date();
    return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  };

  const handleExportExcel = () => {
    const exportData = visibleData.map(row => ({
      'Invoice No': row.invoiceNo,
      'Customer Name': row.customerName,
      'Invoice Date': row.invoiceDate,
      'Invoice Value': row.invoiceValue,
      'IRN Status': row.irnStatus,
      'NIC Status': row.nicStatus
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'E-Invoices');
    XLSX.writeFile(workbook, `einvoices_${getFormattedDateStr()}.xlsx`);
    setShowExportMenu(false);
  };

  const handleExportCSV = () => {
    const headers = ['Invoice No', 'Customer Name', 'Invoice Date', 'Invoice Value', 'IRN Status', 'NIC Status'];
    const csvContent = [
      headers.join(','),
      ...visibleData.map(row => 
        [`"${row.invoiceNo}"`, `"${row.customerName}"`, `"${row.invoiceDate}"`, row.invoiceValue, `"${row.irnStatus}"`, `"${row.nicStatus}"`].join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `einvoices_${getFormattedDateStr()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportMenu(false);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF('landscape');
    doc.setFontSize(16);
    doc.text('E-Invoice Register', 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 22);

    autoTable(doc, {
      startY: 30,
      head: [['Invoice No', 'Customer', 'Date', 'Value', 'IRN Status', 'NIC Status']],
      body: visibleData.map(row => [
        row.invoiceNo, row.customerName, row.invoiceDate, formatCurrency(row.invoiceValue), row.irnStatus, row.nicStatus
      ]),
      theme: 'grid',
      headStyles: { fillColor: [124, 58, 237] }
    });
    doc.save(`einvoices_${getFormattedDateStr()}.pdf`);
    setShowExportMenu(false);
  };

  const getStatusVariant = (status: string): BadgeVariant => {
    switch (status) {
      case 'Generated': case 'Success': return 'success';
      case 'Pending': return 'warning';
      case 'Failed': case 'Error': return 'danger';
      default: return 'neutral';
    }
  };

  const columns: Column<EInvoiceData>[] = [
    { key: 'invoiceNo', label: 'Invoice No', render: (row) => <span className="font-semibold text-slate-900">{row.invoiceNo}</span> },
    { key: 'customerName', label: 'Customer Name', render: (row) => <span className="font-medium text-violet-700">{row.customerName || 'Walk-in Customer'}</span> },
    { key: 'invoiceDate', label: 'Invoice Date' },
    { key: 'invoiceValue', label: 'Invoice Value', render: (row) => <span className="font-bold text-slate-900">{formatCurrency(row.invoiceValue)}</span> },
    { key: 'irnStatus', label: 'IRN Status', render: (row) => <Badge variant={getStatusVariant(row.irnStatus)}>{row.irnStatus}</Badge> },
    { key: 'nicStatus', label: 'NIC Status', render: (row) => <Badge variant={getStatusVariant(row.nicStatus)}>{row.nicStatus}</Badge> },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          <button onClick={() => setViewRecord(row)} className="text-slate-400 hover:text-[#163c78] transition-colors p-1" title="View Details">
            <Eye className="w-4 h-4" />
          </button>
          
          {row.irnStatus === 'Pending' && (
            <button onClick={(e) => handleGenerateIRN(row.invoiceNo, row.id, e)} className="text-emerald-600 hover:text-emerald-700 p-1 flex items-center gap-1 text-xs font-semibold" title="Generate IRN">
              <Play className="w-3.5 h-3.5" /> Generate
            </button>
          )}

          {row.irnStatus === 'Generated' && (
            <button onClick={(e) => handleDownloadPDF(row, e)} className="text-blue-600 hover:text-blue-700 p-1 flex items-center gap-1 text-xs font-semibold" title="Download PDF">
              <Download className="w-3.5 h-3.5" /> PDF
            </button>
          )}

          {row.irnStatus === 'Failed' && (
            <button onClick={(e) => handleRetryGenerateIRN(row.invoiceNo, row.id, e)} className="text-rose-600 hover:text-rose-700 p-1 flex items-center gap-1 text-xs font-semibold" title="Retry Generate IRN">
              <RefreshCw className="w-3.5 h-3.5" /> Retry
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="animate-in fade-in duration-500 bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-slate-100">
      <PageHeader
        title="E-Invoice Support"
        subtitle="Manage E-Invoicing workflows, IRN generation, and compliance."
        actions={
          <div className="relative inline-block text-left" ref={exportMenuRef}>
            <ActionButton 
              variant="secondary" 
              icon={<Download className="w-4 h-4" />}
              onClick={() => setShowExportMenu(!showExportMenu)}
            >
              Export
              <ChevronDown className="w-3 h-3 ml-1" />
            </ActionButton>
            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                <div className="py-1">
                  <button onClick={handleExportExcel} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">Export Excel (.xlsx)</button>
                  <button onClick={handleExportCSV} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">Export CSV (.csv)</button>
                  <button onClick={handleExportPDF} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">Export PDF (.pdf)</button>
                </div>
              </div>
            )}
          </div>
        }
      />

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search Invoice No, Customer, GSTIN, Order No, IRN..." />
        <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-600">Filters:</span>
        </div>
        <SelectFilter
          value={irnStatusFilter}
          onChange={setIrnStatusFilter}
          options={[
            { label: 'All IRN Status', value: '' },
            { label: 'Pending', value: 'Pending' },
            { label: 'Generated', value: 'Generated' },
            { label: 'Failed', value: 'Failed' },
          ]}
          placeholder="IRN Status"
        />
        <SelectFilter
          value={nicStatusFilter}
          onChange={setNicStatusFilter}
          options={[
            { label: 'All NIC Status', value: '' },
            { label: 'Success', value: 'Success' },
            { label: 'Pending', value: 'Pending' },
            { label: 'Error', value: 'Error' },
          ]}
          placeholder="NIC Status"
        />
        <input 
          type="date" 
          value={dateFilter} 
          onChange={(e) => setDateFilter(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-violet-500 text-slate-600"
          title="Date Range"
        />
      </FilterBar>

      <TableCard>
        <div className="[&>div::-webkit-scrollbar]:hidden [&>div]:[-ms-overflow-style:none] [&>div]:[scrollbar-width:none]">
          <DataTable
            columns={columns}
            data={visibleData}
            emptyMessage="No e-invoices match the selected filters."
          />
        </div>
      </TableCard>

      {/* --- View Drawer --- */}
      <Drawer open={!!viewRecord} onClose={() => setViewRecord(null)} title="E-Invoice Details">
        {viewRecord && (
          <div className="space-y-6">
            
            {/* Action Bar Inside Drawer */}
            <div className="flex flex-wrap gap-2 pb-4 border-b border-slate-100">
              {viewRecord.irnStatus === 'Pending' && (
                <ActionButton icon={<Play className="w-4 h-4" />} onClick={() => handleGenerateIRN(viewRecord.invoiceNo, viewRecord.id)}>Generate IRN</ActionButton>
              )}
              {viewRecord.irnStatus === 'Generated' && (
                <>
                  <ActionButton icon={<Download className="w-4 h-4" />} onClick={() => handleDownloadPDF(viewRecord)}>Download PDF</ActionButton>
                  <ActionButton variant="secondary" icon={<FileJson className="w-4 h-4" />} onClick={() => handleDownloadJSON(viewRecord)}>Download JSON</ActionButton>
                  <ActionButton variant="secondary" icon={<QrCode className="w-4 h-4" />} onClick={() => handleDownloadQR(viewRecord)}>Download QR Code</ActionButton>
                </>
              )}
              {viewRecord.irnStatus === 'Failed' && (
                <ActionButton icon={<RefreshCw className="w-4 h-4" />} onClick={() => handleRetryGenerateIRN(viewRecord.invoiceNo, viewRecord.id)}>Retry Generate IRN</ActionButton>
              )}
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Invoice Information</h3>
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
                <DrawerField label="Invoice No" value={<span className="font-semibold text-slate-900">{viewRecord.invoiceNo}</span>} />
                <DrawerField label="Invoice Date" value={viewRecord.invoiceDate} />
                <DrawerField label="Order Number" value={viewRecord.orderNo} />
                <DrawerField label="Customer Name" value={<span className="font-medium text-violet-700">{viewRecord.customerName}</span>} />
                <div className="col-span-2">
                  <DrawerField label="GSTIN" value={viewRecord.gstin} />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">IRN Information</h3>
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
                <div className="col-span-2">
                  <DrawerField label="IRN Status" value={<Badge variant={getStatusVariant(viewRecord.irnStatus)}>{viewRecord.irnStatus}</Badge>} />
                </div>
                <div className="col-span-2">
                  <DrawerField label="IRN Number" value={<span className="font-mono text-xs break-all text-slate-600">{viewRecord.irnNumber}</span>} />
                </div>
                <DrawerField label="IRN Generated On" value={viewRecord.irnGeneratedOn} />
                <DrawerField label="Ack Number" value={viewRecord.ackNo} />
                <DrawerField label="Ack Date" value={viewRecord.ackDate} />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">NIC Information</h3>
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
                <div className="col-span-2">
                  <DrawerField label="NIC Status" value={<Badge variant={getStatusVariant(viewRecord.nicStatus)}>{viewRecord.nicStatus}</Badge>} />
                </div>
                <div className="col-span-2">
                  <DrawerField label="Response Message" value={viewRecord.responseMessage} />
                </div>
                <DrawerField label="Error Code" value={viewRecord.errorCode} />
                <DrawerField label="Error Description" value={viewRecord.errorDesc} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Compliance Info</h3>
                <div className="space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-100">
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Taxable Amount</span>
                    <span>{formatCurrency(viewRecord.taxableAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>GST Amount</span>
                    <span>{formatCurrency(viewRecord.gstAmount)}</span>
                  </div>
                  <div className="flex justify-between text-base font-bold text-slate-900 pt-3 border-t border-slate-200 mt-2">
                    <span>Invoice Value</span>
                    <span className="text-violet-700">{formatCurrency(viewRecord.invoiceValue)}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">QR Information</h3>
                <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-lg border border-slate-100 h-[140px]">
                  {viewRecord.qrStatus === 'Generated' ? (
                    <div className="text-center">
                      <QrCode className="w-16 h-16 text-slate-800 mx-auto mb-2 opacity-80" />
                      <Badge variant="success">QR Generated</Badge>
                    </div>
                  ) : viewRecord.qrStatus === 'Pending' ? (
                    <div className="text-center">
                      <div className="w-16 h-16 border-2 border-dashed border-slate-300 rounded mx-auto mb-2 flex items-center justify-center">
                        <QrCode className="w-8 h-8 text-slate-300" />
                      </div>
                      <Badge variant="warning">Pending</Badge>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="w-16 h-16 border-2 border-slate-200 rounded mx-auto mb-2 flex items-center justify-center">
                        <span className="text-slate-400 text-xs">N/A</span>
                      </div>
                      <Badge variant="neutral">Not Applicable</Badge>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
              <ActionButton variant="secondary" onClick={() => setViewRecord(null)}>Close</ActionButton>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}