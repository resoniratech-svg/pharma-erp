// DeliveryTracking.tsx
import { useState, useMemo, useRef, useEffect } from 'react';
import { Download, Filter, Eye, MapPin, UploadCloud, FileCheck, ChevronDown, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { generatePODPdf } from '../../documents/generators/generatePODPdf';
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
import { transportChallanService, type DeliveryRecord } from '../../services/transportChallanService';

export default function DeliveryTracking() {
  const [data, setData] = useState<DeliveryRecord[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  
  const [selectedRecord, setSelectedRecord] = useState<DeliveryRecord | null>(null);
  const [drawerMode, setDrawerMode] = useState<'view' | 'track'>('view');

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadRecord, setUploadRecord] = useState<DeliveryRecord | null>(null);

  // Upload Modal Form State
  const [podReceivedBy, setPodReceivedBy] = useState('');
  const [podDesignation, setPodDesignation] = useState('');
  const [podRemarks, setPodRemarks] = useState('');
  const [podFile, setPodFile] = useState<File | null>(null);

  useEffect(() => {
    setData(transportChallanService.getAllDeliveryRecords());

    function handleClickOutside(event: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const searchStr = search.toLowerCase();
      const matchSearch = 
        item.deliveryNo.toLowerCase().includes(searchStr) || 
        item.customer.toLowerCase().includes(searchStr) || 
        item.lrNumber.toLowerCase().includes(searchStr);
      const matchStatus = statusFilter ? item.status === statusFilter : true;
      return matchSearch && matchStatus;
    });
  }, [data, search, statusFilter]);

  const getFormattedDate = () => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}${mm}${dd}`;
  };

  const handleExportExcel = () => {
    const exportData = filteredData.map(row => ({
      'Delivery No': row.deliveryNo,
      'Customer': row.customer,
      'LR Number': row.lrNumber,
      'Expected Date': row.expectedDate,
      'Delivery Status': row.status,
      'POD Status': row.podStatus
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Deliveries');
    XLSX.writeFile(workbook, `delivery_tracking_${getFormattedDate()}.xlsx`);
    setShowExportMenu(false);
  };

  const handleExportCSV = () => {
    const headers = ['Delivery No', 'Customer', 'LR Number', 'Expected Date', 'Delivery Status', 'POD Status'];
    const csvContent = [
      headers.join(','),
      ...filteredData.map(row => 
        [
          `"${row.deliveryNo}"`, `"${row.customer}"`, `"${row.lrNumber}"`,
          `"${row.expectedDate}"`, `"${row.status}"`, `"${row.podStatus}"`
        ].join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `delivery_tracking_${getFormattedDate()}.csv`;
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportMenu(false);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Delivery Tracking Report', 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 22);

    autoTable(doc, {
      startY: 30,
      head: [['Delivery No', 'Customer', 'LR Number', 'Expected Date', 'Status', 'POD Status']],
      body: filteredData.map(row => [
        row.deliveryNo,
        row.customer,
        row.lrNumber,
        row.expectedDate,
        row.status,
        row.podStatus
      ]),
      theme: 'grid',
      headStyles: { fillColor: [139, 92, 246] }
    });
    doc.save(`delivery_tracking_${getFormattedDate()}.pdf`);
    setShowExportMenu(false);
  };

  const handleOpenDrawer = (record: DeliveryRecord, mode: 'view' | 'track') => {
    setDrawerMode(mode);
    setSelectedRecord(record);
  };

  const handleOpenUpload = (record: DeliveryRecord) => {
    setUploadRecord(record);
    setPodReceivedBy('');
    setPodDesignation('');
    setPodRemarks('');
    setPodFile(null);
    setShowUploadModal(true);
  };

  const handleUploadPOD = () => {
    if (!uploadRecord) return;
    if (!podFile) {
      alert("Please select a file to upload.");
      return;
    }
    
    const fileUrl = URL.createObjectURL(podFile);
    const now = new Date();
    const formattedNow = `${now.getDate().toString().padStart(2, '0')}-Oct-2026 ${now.getHours() % 12 || 12}:${now.getMinutes().toString().padStart(2, '0')} ${now.getHours() >= 12 ? 'PM' : 'AM'}`;
    const dateOnly = `${now.getDate().toString().padStart(2, '0')}-Oct-2026`;

    transportChallanService.updateChallan(uploadRecord.id, {
      status: 'Delivered',
      podStatus: 'Uploaded',
      actualDeliveryDate: dateOnly,
      podReceivedBy,
      podDesignation,
      podUploadedBy: 'System User',
      podUploadedDate: formattedNow,
      podFileUrl: fileUrl,
      podFileName: podFile.name,
      podFileType: podFile.type,
      podRemarks: podRemarks
    });

    setData(transportChallanService.getAllDeliveryRecords());

    setShowUploadModal(false);
    setUploadRecord(null);
    setPodFile(null);
  };

  const handleViewPOD = (record: DeliveryRecord) => {
    if (record.podFileUrl) {
      window.open(record.podFileUrl, '_blank');
    } else {
      alert("No file attached for viewing.");
    }
  };

  const columns: Column<DeliveryRecord>[] = [
    { key: 'deliveryNo', label: 'Delivery No', render: (row) => <span className="font-semibold text-slate-900">{row.deliveryNo}</span> },
    { key: 'customer', label: 'Customer', render: (row) => <span className="font-medium text-slate-800">{row.customer}</span> },
    { key: 'lrNumber', label: 'LR Number', render: (row) => <span className="text-slate-600">{row.lrNumber}</span> },
    { key: 'expectedDate', label: 'Expected Delivery Date' },
    {
      key: 'status',
      label: 'Delivery Status',
      render: (row) => {
        let variant: BadgeVariant = 'neutral';
        if (row.status === 'Delivered') variant = 'success';
        if (row.status === 'In Transit' || row.status === 'Out For Delivery') variant = 'info';
        if (row.status === 'Delayed') variant = 'danger';
        if (row.status === 'Returned') variant = 'warning';
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    },
    {
      key: 'podStatus',
      label: 'POD Status',
      render: (row) => {
        let variant: BadgeVariant = 'neutral';
        if (row.podStatus === 'Uploaded') variant = 'info';
        if (row.podStatus === 'Verified') variant = 'success';
        if (row.podStatus === 'Rejected') variant = 'danger';
        if (row.podStatus === 'Pending Upload') variant = 'warning';
        return <Badge variant={variant}>{row.podStatus}</Badge>;
      }
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-3">
          <button onClick={(e) => { e.stopPropagation(); handleOpenDrawer(row, 'view'); }} className="text-slate-400 hover:text-violet-600 transition-colors" title="View Delivery">
            <Eye className="w-4 h-4" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); handleOpenDrawer(row, 'track'); }} className="text-slate-400 hover:text-violet-600 transition-colors" title="Track Location">
            <MapPin className="w-4 h-4" />
          </button>
          {row.podStatus !== 'Pending Upload' ? (
            <>
              <button onClick={(e) => { e.stopPropagation(); handleViewPOD(row); }} className="text-emerald-500 hover:text-emerald-600 transition-colors" title="View POD">
                <FileCheck className="w-4 h-4" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); generatePODPdf(row); }} className="text-emerald-500 hover:text-emerald-600 transition-colors" title="Download POD">
                <Download className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button onClick={(e) => { e.stopPropagation(); handleOpenUpload(row); }} className="text-slate-400 hover:text-violet-600 transition-colors" title="Upload POD">
              <UploadCloud className="w-4 h-4" />
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Delivery Tracking & POD"
        subtitle="Monitor final mile deliveries and manage Proof of Delivery documents."
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
                <div className="py-1" role="menu" aria-orientation="vertical">
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
        <SearchInput value={search} onChange={setSearch} placeholder="Search delivery no, customer, or LR..." />
        <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-600">Filters:</span>
        </div>
        <SelectFilter
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { label: 'In Transit', value: 'In Transit' },
            { label: 'Out For Delivery', value: 'Out For Delivery' },
            { label: 'Delivered', value: 'Delivered' },
            { label: 'Delayed', value: 'Delayed' },
            { label: 'Returned', value: 'Returned' },
          ]}
          placeholder="All Statuses"
        />
      </FilterBar>

      <TableCard>
        <div className="[&>div::-webkit-scrollbar]:hidden [&>div]:[-ms-overflow-style:none] [&>div]:[scrollbar-width:none]">
          <DataTable
            columns={columns}
            data={filteredData}
            emptyMessage="No delivery records found."
          />
        </div>
      </TableCard>

      <Drawer 
        open={!!selectedRecord} 
        onClose={() => setSelectedRecord(null)} 
        title={drawerMode === 'view' ? "Delivery Details & POD" : "Track Delivery"}
      >
        {selectedRecord && (
          <div className="space-y-6">
            {drawerMode === 'track' && (
              <div>
                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Tracking Timeline</h3>
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg">
                  <div className="space-y-6">
                    {selectedRecord.timeline.map((event, idx) => {
                      const isLast = idx === selectedRecord.timeline.length - 1;
                      return (
                        <div key={idx} className="relative flex gap-4">
                          {!isLast && (
                            <div className="absolute left-1.5 top-6 bottom-[-24px] w-0.5 bg-slate-200" />
                          )}
                          <div className="relative">
                            <div className={`w-3 h-3 mt-1.5 rounded-full ring-4 ring-white relative z-10 shrink-0 ${isLast ? 'bg-violet-600' : 'bg-slate-300'}`} />
                            {isLast && (
                              <div className="absolute top-1.5 left-0 w-3 h-3 rounded-full bg-violet-600 animate-ping opacity-75" />
                            )}
                          </div>
                          <div>
                            <div className="text-xs font-medium text-slate-500 mb-0.5">
                              {event.date} {event.time && `• ${event.time}`}
                            </div>
                            <div className={`text-sm ${isLast ? 'font-bold text-violet-700' : 'font-semibold text-slate-900'}`}>{event.status}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {drawerMode === 'view' && (
              <>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Delivery Information</h3>
                  <div className="space-y-2">
                    <DrawerField label="Delivery No" value={<span className="font-semibold text-slate-900">{selectedRecord.deliveryNo}</span>} />
                    <DrawerField label="Dispatch No" value={selectedRecord.dispatchNo} />
                    <DrawerField label="Challan No" value={selectedRecord.challanNo} />
                    <DrawerField label="LR Number" value={selectedRecord.lrNumber} />
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Customer Information</h3>
                  <div className="space-y-2">
                    <DrawerField label="Customer Name" value={selectedRecord.customer} />
                    <DrawerField label="Delivery Address" value={<span className="whitespace-pre-line">{selectedRecord.deliveryAddress}</span>} />
                    <DrawerField label="Contact Person" value={selectedRecord.contactPerson} />
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Transport Information</h3>
                  <div className="space-y-2">
                    <DrawerField label="Transporter" value={selectedRecord.transporter} />
                    <DrawerField label="Vehicle Number" value={selectedRecord.vehicleNo} />
                    <DrawerField label="Driver Name" value={selectedRecord.driverName} />
                    <DrawerField label="Driver Mobile" value={selectedRecord.driverMobile} />
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Delivery Status</h3>
                  <div className="space-y-2">
                    <DrawerField label="Expected Date" value={selectedRecord.expectedDate} />
                    <DrawerField label="Actual Date" value={selectedRecord.actualDate} />
                    <DrawerField label="Delivery Status" value={
                      <Badge variant={
                        selectedRecord.status === 'Delivered' ? 'success' : 
                        selectedRecord.status === 'In Transit' || selectedRecord.status === 'Out For Delivery' ? 'info' : 
                        selectedRecord.status === 'Delayed' ? 'danger' : 'warning'
                      }>
                        {selectedRecord.status}
                      </Badge>
                    } />
                    <DrawerField label="POD Status" value={
                      <Badge variant={
                        selectedRecord.podStatus === 'Verified' ? 'success' : 
                        selectedRecord.podStatus === 'Uploaded' ? 'info' : 
                        selectedRecord.podStatus === 'Rejected' ? 'danger' : 'warning'
                      }>{selectedRecord.podStatus}</Badge>
                    } />
                  </div>
                </div>

                {selectedRecord.podStatus !== 'Pending Upload' && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">POD Details</h3>
                    <div className="space-y-2">
                      <DrawerField label="Uploaded By" value={selectedRecord.podUploadedBy || '-'} />
                      <DrawerField label="Uploaded Date" value={selectedRecord.podUploadedDate || '-'} />
                      <DrawerField label="Receiver Name" value={selectedRecord.podReceivedBy || '-'} />
                      <DrawerField label="Receiver Designation" value={selectedRecord.podDesignation || '-'} />
                      <div className="pt-3 flex gap-3">
                        <ActionButton variant="secondary" onClick={() => handleViewPOD(selectedRecord)} icon={<Eye className="w-4 h-4" />}>View POD</ActionButton>
                        <ActionButton variant="secondary" onClick={() => generatePODPdf(selectedRecord)} icon={<Download className="w-4 h-4" />}>Download POD</ActionButton>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="pt-6 border-t border-slate-100 flex justify-end">
              <ActionButton variant="secondary" onClick={() => setSelectedRecord(null)}>Close</ActionButton>
            </div>
          </div>
        )}
      </Drawer>

      {/* Upload POD Modal */}
      {showUploadModal && uploadRecord && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-0">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" onClick={() => setShowUploadModal(false)}></div>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 relative z-10 flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <h3 className="text-lg font-semibold text-slate-900">Upload Proof of Delivery</h3>
              <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-slate-500 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Delivery No</label>
                  <div className="font-semibold text-slate-900 text-sm">{uploadRecord.deliveryNo}</div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Dispatch No</label>
                  <div className="font-medium text-slate-900 text-sm">{uploadRecord.dispatchNo}</div>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-500 mb-1">LR Number</label>
                  <div className="font-medium text-slate-900 text-sm">{uploadRecord.lrNumber}</div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Delivery Date</label>
                <input type="date" className="w-full h-10 px-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500" defaultValue={new Date().toISOString().split('T')[0]} />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Received By</label>
                  <input value={podReceivedBy} onChange={e => setPodReceivedBy(e.target.value)} type="text" className="w-full h-10 px-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500" placeholder="Name" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Designation</label>
                  <input value={podDesignation} onChange={e => setPodDesignation(e.target.value)} type="text" className="w-full h-10 px-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500" placeholder="Role" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">POD Document</label>
                <div className="relative border-2 border-dashed border-slate-200 rounded-lg p-6 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors group">
                  <input 
                    type="file" 
                    accept=".pdf,.jpg,.jpeg,.png,.webp" 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={(e) => setPodFile(e.target.files?.[0] || null)}
                  />
                  <UploadCloud className={`w-8 h-8 mb-2 transition-colors ${podFile ? 'text-emerald-500' : 'text-slate-400 group-hover:text-violet-500'}`} />
                  <span className={`text-sm font-medium ${podFile ? 'text-emerald-600' : 'text-violet-600'}`}>
                    {podFile ? podFile.name : 'Click to upload'}
                  </span>
                  <span className="text-xs text-slate-500 mt-1">PDF, JPG, PNG, WEBP (Max 5MB)</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Remarks</label>
                <textarea value={podRemarks} onChange={e => setPodRemarks(e.target.value)} className="w-full p-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 resize-none" rows={2} placeholder="Optional remarks..."></textarea>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
              <button onClick={() => setShowUploadModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors">Cancel</button>
              <button onClick={handleUploadPOD} className="px-4 py-2 text-sm font-medium bg-violet-600 text-white rounded-lg hover:bg-violet-700 shadow-sm transition-all active:scale-[0.98]">Upload POD</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}