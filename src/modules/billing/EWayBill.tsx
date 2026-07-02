import { useState, useMemo, useRef, useEffect } from 'react';
import { Download, Filter, Eye, Play, RefreshCw, ChevronDown } from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

import {
  PageHeader, FilterBar, SearchInput, SelectFilter, ActionButton,
  TableCard, DataTable, Badge, Drawer, DrawerField
} from './components/shared';
import { type Column, type BadgeVariant } from './components/shared';
import { generateEWayBillPdf } from '../../documents/generators/pdfGenerator';

// --- Types ---
type EWayStatus = 'Active' | 'Pending' | 'Expired' | 'Cancelled' | 'Failed';
type TransportStatus = 'Not Dispatched' | 'Dispatched' | 'In Transit' | 'Delivered' | 'Pending';

interface EWayBillData {
  id: string;
  invoiceNo: string;
  customerName: string;
  ewbNumber: string;
  transporter: string;
  vehicleNo: string;
  generatedDate: string;
  validFrom: string;
  validTill: string;
  transportStatus: TransportStatus;
  status: EWayStatus;

  // Drawer specifics
  invoiceDate: string;
  gstin: string;
  invoiceAmount: number;
  
  transporterGstin: string;
  transportMode: string;
  
  sourceLocation: string;
  destinationLocation: string;
  distance: string;
}

// --- Mock Data ---
const mockData: EWayBillData[] = [
  {
    id: '1', invoiceNo: 'INV/26/001', customerName: 'Apollo Pharmacy', 
    ewbNumber: '123456789012', transporter: 'VRL Logistics', vehicleNo: 'MH-04-AB-1234',
    generatedDate: '15-Oct-2026', validFrom: '15-Oct-2026', validTill: '17-Oct-2026',
    transportStatus: 'In Transit', status: 'Active',
    invoiceDate: '15-Oct-2026', gstin: '29ABCDE1234F1Z5', invoiceAmount: 50400,
    transporterGstin: '27VRLDE5678G2H4', transportMode: 'Road',
    sourceLocation: 'Mumbai, Maharashtra', destinationLocation: 'Pune, Maharashtra', distance: '150 km'
  },
  {
    id: '2', invoiceNo: 'INV/26/002', customerName: 'MedPlus Store', 
    ewbNumber: '-', transporter: 'Delhivery', vehicleNo: '-',
    generatedDate: '-', validFrom: '-', validTill: '-',
    transportStatus: 'Pending', status: 'Pending',
    invoiceDate: '16-Oct-2026', gstin: '27XYZDE5678G2H4', invoiceAmount: 13440,
    transporterGstin: '07DELHI9999P1Z1', transportMode: 'Road',
    sourceLocation: 'Mumbai, Maharashtra', destinationLocation: 'Surat, Gujarat', distance: '280 km'
  },
  {
    id: '3', invoiceNo: 'INV/26/000', customerName: 'Wellness Medicos', 
    ewbNumber: '987654321098', transporter: 'Gati Express', vehicleNo: 'DL-01-XY-9876',
    generatedDate: '10-Oct-2026', validFrom: '10-Oct-2026', validTill: '12-Oct-2026',
    transportStatus: 'Not Dispatched', status: 'Expired',
    invoiceDate: '10-Oct-2026', gstin: '07DELHI9999P1Z1', invoiceAmount: 9520,
    transporterGstin: '27GATI1234H1Z5', transportMode: 'Road',
    sourceLocation: 'Mumbai, Maharashtra', destinationLocation: 'Delhi', distance: '1400 km'
  },
  {
    id: '4', invoiceNo: 'INV/26/004', customerName: 'City Hospital', 
    ewbNumber: '-', transporter: 'Blue Dart', vehicleNo: '-',
    generatedDate: '-', validFrom: '-', validTill: '-',
    transportStatus: 'Pending', status: 'Failed',
    invoiceDate: '17-Oct-2026', gstin: '27CITYH5678G2H4', invoiceAmount: 45000,
    transporterGstin: '27BLUE1234H1Z5', transportMode: 'Air',
    sourceLocation: 'Mumbai, Maharashtra', destinationLocation: 'Bangalore, Karnataka', distance: '980 km'
  }
];

const formatCurrency = (amount: number) => `₹ ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function EWayBill() {
  const [data, setData] = useState<EWayBillData[]>(mockData);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [transportStatusFilter, setTransportStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const [viewRecord, setViewRecord] = useState<EWayBillData | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const parseDateToInput = (dateStr: string) => {
    if (!dateStr || dateStr === '-') return dateStr;
    const parts = dateStr.split('-');
    if (parts.length === 3 && parts[0].length === 2) {
      const monthMap: Record<string, string> = { Jan:'01',Feb:'02',Mar:'03',Apr:'04',May:'05',Jun:'06',Jul:'07',Aug:'08',Sep:'09',Oct:'10',Nov:'11',Dec:'12' };
      const mm = monthMap[parts[1]] || parts[1];
      return `${parts[2]}-${mm}-${parts[0]}`;
    }
    return dateStr;
  };

  const visibleData = useMemo(() => {
    return data.filter(item => {
      const s = search.toLowerCase();
      const matchSearch = 
        item.invoiceNo.toLowerCase().includes(s) ||
        item.customerName.toLowerCase().includes(s) ||
        item.ewbNumber.toLowerCase().includes(s) ||
        item.vehicleNo.toLowerCase().includes(s) ||
        item.transporter.toLowerCase().includes(s);
        
      const matchStatus = statusFilter ? item.status === statusFilter : true;
      const matchTransportStatus = transportStatusFilter ? item.transportStatus === transportStatusFilter : true;
      const matchDate = dateFilter ? (parseDateToInput(item.generatedDate) === dateFilter || parseDateToInput(item.invoiceDate) === dateFilter) : true;
      
      return matchSearch && matchStatus && matchTransportStatus && matchDate;
    });
  }, [data, search, statusFilter, transportStatusFilter, dateFilter]);

  const getFormattedDateStr = () => {
    const d = new Date();
    return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  };

  const handleExportExcel = () => {
    const exportData = visibleData.map(row => ({
      'Invoice No': row.invoiceNo,
      'Customer Name': row.customerName,
      'E-Way Bill No': row.ewbNumber,
      'Transporter': row.transporter,
      'Vehicle No': row.vehicleNo,
      'Generated Date': row.generatedDate,
      'Valid Till': row.validTill,
      'Transport Status': row.transportStatus,
      'E-Way Status': row.status
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'E-Way-Bills');
    XLSX.writeFile(workbook, `ewaybills_${getFormattedDateStr()}.xlsx`);
    setShowExportMenu(false);
  };

  const handleExportCSV = () => {
    const headers = ['Invoice No', 'Customer Name', 'E-Way Bill No', 'Transporter', 'Vehicle No', 'Generated Date', 'Valid Till', 'Transport Status', 'E-Way Status'];
    const csvContent = [
      headers.join(','),
      ...visibleData.map(row => 
        [`"${row.invoiceNo}"`, `"${row.customerName}"`, `"${row.ewbNumber}"`, `"${row.transporter}"`, `"${row.vehicleNo}"`, `"${row.generatedDate}"`, `"${row.validTill}"`, `"${row.transportStatus}"`, `"${row.status}"`].join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `ewaybills_${getFormattedDateStr()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportMenu(false);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF('landscape');
    doc.setFontSize(16);
    doc.text('E-Way Bill Register', 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 22);

    autoTable(doc, {
      startY: 30,
      head: [['Invoice No', 'Customer', 'E-Way Bill No', 'Transporter', 'Vehicle No', 'Valid Till', 'Transport Status', 'Status']],
      body: visibleData.map(row => [
        row.invoiceNo, row.customerName, row.ewbNumber, row.transporter, row.vehicleNo, row.validTill, row.transportStatus, row.status
      ]),
      theme: 'grid',
      headStyles: { fillColor: [124, 58, 237] }
    });
    doc.save(`ewaybills_${getFormattedDateStr()}.pdf`);
    setShowExportMenu(false);
  };

  const generateMockDetails = () => {
    const d = new Date();
    const generatedDateStr = `${d.getDate().toString().padStart(2, '0')}-${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()]}-${d.getFullYear()}`;
    d.setDate(d.getDate() + 2);
    const validTillStr = `${d.getDate().toString().padStart(2, '0')}-${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()]}-${d.getFullYear()}`;
    const ewbNumber = Math.floor(100000000000 + Math.random() * 900000000000).toString();
    
    return {
      status: 'Active' as const,
      transportStatus: 'Not Dispatched' as const,
      ewbNumber,
      generatedDate: generatedDateStr,
      validFrom: generatedDateStr,
      validTill: validTillStr,
      vehicleNo: 'MH-02-CD-5678'
    };
  };

  const handleGenerate = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Are you sure you want to generate an E-Way Bill for this invoice?')) return;
    
    const updates = generateMockDetails();
    setData(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
    if (viewRecord?.id === id) setViewRecord(prev => prev ? { ...prev, ...updates } : null);
  };

  const handleRegenerate = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Are you sure you want to regenerate an expired E-Way Bill?')) return;
    
    const updates = generateMockDetails();
    setData(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
    if (viewRecord?.id === id) setViewRecord(prev => prev ? { ...prev, ...updates } : null);
  };

  const handleRetry = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    handleGenerate(id);
  };

  const handleDownloadPDF = (record: EWayBillData, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    generateEWayBillPdf(record);
  };

  const getStatusVariant = (status: string): BadgeVariant => {
    switch (status) {
      case 'Active': case 'Delivered': return 'success';
      case 'Pending': case 'Not Dispatched': return 'warning';
      case 'Expired': case 'Cancelled': case 'Failed': return 'danger';
      case 'In Transit': case 'Dispatched': return 'info';
      default: return 'neutral';
    }
  };

  const columns: Column<EWayBillData>[] = [
    { key: 'invoiceNo', label: 'Invoice No', render: (row) => <span className="font-semibold text-slate-900">{row.invoiceNo}</span> },
    { key: 'customerName', label: 'Customer Name', render: (row) => <span className="font-medium text-violet-700">{row.customerName}</span> },
    { key: 'ewbNumber', label: 'E-Way Bill No', render: (row) => <span className="font-medium text-slate-700">{row.ewbNumber}</span> },
    { key: 'transporter', label: 'Transporter' },
    { key: 'vehicleNo', label: 'Vehicle No', render: (row) => <span className="font-mono text-xs">{row.vehicleNo}</span> },
    { key: 'generatedDate', label: 'Generated Date' },
    { key: 'validTill', label: 'Valid Till' },
    { key: 'transportStatus', label: 'Transport Status', render: (row) => <Badge variant={getStatusVariant(row.transportStatus)}>{row.transportStatus}</Badge> },
    { key: 'status', label: 'E-Way Status', render: (row) => <Badge variant={getStatusVariant(row.status)}>{row.status}</Badge> },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          <button onClick={() => setViewRecord(row)} className="text-slate-400 hover:text-violet-600 transition-colors p-1" title="View Details">
            <Eye className="w-4 h-4" />
          </button>
          
          {row.status === 'Pending' && (
            <button onClick={(e) => handleGenerate(row.id, e)} className="text-emerald-600 hover:text-emerald-700 p-1 flex items-center gap-1 text-xs font-semibold" title="Generate">
              <Play className="w-3.5 h-3.5" /> Generate
            </button>
          )}

          {row.status === 'Active' && (
            <button onClick={(e) => handleDownloadPDF(row, e)} className="text-blue-600 hover:text-blue-700 p-1 flex items-center gap-1 text-xs font-semibold" title="Download PDF">
              <Download className="w-3.5 h-3.5" /> PDF
            </button>
          )}

          {row.status === 'Failed' && (
            <button onClick={(e) => handleRetry(row.id, e)} className="text-rose-600 hover:text-rose-700 p-1 flex items-center gap-1 text-xs font-semibold" title="Retry">
              <RefreshCw className="w-3.5 h-3.5" /> Retry
            </button>
          )}
          
          {row.status === 'Expired' && (
            <button onClick={(e) => handleRegenerate(row.id, e)} className="text-rose-600 hover:text-rose-700 p-1 flex items-center gap-1 text-xs font-semibold" title="Regenerate">
              <RefreshCw className="w-3.5 h-3.5" /> Regenerate
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="E-Way Bill Support"
        subtitle="Generate and track electronic waybills for goods transportation."
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
        <SearchInput value={search} onChange={setSearch} placeholder="Search Invoice No, EWB No, Customer..." />
        <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-600">Filters:</span>
        </div>
        <SelectFilter
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { label: 'All E-Way Status', value: '' },
            { label: 'Pending', value: 'Pending' },
            { label: 'Active', value: 'Active' },
            { label: 'Expired', value: 'Expired' },
            { label: 'Cancelled', value: 'Cancelled' },
          ]}
          placeholder="E-Way Status"
        />
        <SelectFilter
          value={transportStatusFilter}
          onChange={setTransportStatusFilter}
          options={[
            { label: 'All Transport Status', value: '' },
            { label: 'Not Dispatched', value: 'Not Dispatched' },
            { label: 'Dispatched', value: 'Dispatched' },
            { label: 'In Transit', value: 'In Transit' },
            { label: 'Delivered', value: 'Delivered' },
          ]}
          placeholder="Transport Status"
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
            emptyMessage="No e-way bills match the selected filters."
          />
        </div>
      </TableCard>

      {/* --- View Drawer --- */}
      <Drawer open={!!viewRecord} onClose={() => setViewRecord(null)} title="E-Way Bill Details">
        {viewRecord && (
          <div className="space-y-6">
            
            {/* Action Bar Inside Drawer */}
            <div className="flex flex-wrap gap-2 pb-4 border-b border-slate-100">
              {viewRecord.status === 'Pending' && (
                <ActionButton icon={<Play className="w-4 h-4" />} onClick={() => handleGenerate(viewRecord.id)}>Generate</ActionButton>
              )}
              {viewRecord.status === 'Active' && (
                <ActionButton icon={<Download className="w-4 h-4" />} onClick={() => handleDownloadPDF(viewRecord)}>Download E-Way Bill PDF</ActionButton>
              )}
              {viewRecord.status === 'Failed' && (
                <ActionButton icon={<RefreshCw className="w-4 h-4" />} onClick={() => handleRetry(viewRecord.id)}>Retry</ActionButton>
              )}
              {viewRecord.status === 'Expired' && (
                <ActionButton icon={<RefreshCw className="w-4 h-4" />} onClick={() => handleRegenerate(viewRecord.id)}>Regenerate</ActionButton>
              )}
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">SECTION 1 – Invoice Information</h3>
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
                <DrawerField label="Invoice Number" value={<span className="font-semibold text-slate-900">{viewRecord.invoiceNo}</span>} />
                <DrawerField label="Invoice Date" value={viewRecord.invoiceDate} />
                <DrawerField label="Customer Name" value={<span className="font-medium text-violet-700">{viewRecord.customerName}</span>} />
                <DrawerField label="GSTIN" value={viewRecord.gstin} />
                <div className="col-span-2">
                  <DrawerField label="Invoice Amount" value={<span className="font-bold text-slate-900">{formatCurrency(viewRecord.invoiceAmount)}</span>} />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">SECTION 2 – E-Way Bill Information</h3>
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
                <div className="col-span-2">
                  <DrawerField label="E-Way Status" value={<Badge variant={getStatusVariant(viewRecord.status)}>{viewRecord.status}</Badge>} />
                </div>
                <div className="col-span-2">
                  <DrawerField label="E-Way Bill Number" value={<span className="font-mono text-sm break-all text-slate-800 font-semibold">{viewRecord.ewbNumber}</span>} />
                </div>
                <DrawerField label="Generated Date" value={viewRecord.generatedDate} />
                <DrawerField label="Valid From" value={viewRecord.validFrom} />
                <DrawerField label="Valid Till" value={viewRecord.validTill} />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">SECTION 3 – Transport Information</h3>
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
                <div className="col-span-2">
                  <DrawerField label="Transport Status" value={<Badge variant={getStatusVariant(viewRecord.transportStatus)}>{viewRecord.transportStatus}</Badge>} />
                </div>
                <DrawerField label="Transporter Name" value={viewRecord.transporter} />
                <DrawerField label="Transporter GSTIN" value={viewRecord.transporterGstin} />
                <DrawerField label="Vehicle Number" value={<span className="font-mono text-xs">{viewRecord.vehicleNo}</span>} />
                <DrawerField label="Transport Mode" value={viewRecord.transportMode} />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">SECTION 4 – Route Information</h3>
              <div className="grid grid-cols-1 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
                <DrawerField label="Source Location" value={viewRecord.sourceLocation} />
                <DrawerField label="Destination Location" value={viewRecord.destinationLocation} />
                <DrawerField label="Distance" value={viewRecord.distance} />
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
