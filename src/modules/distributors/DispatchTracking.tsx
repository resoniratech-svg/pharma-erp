import { useState, useRef, useEffect } from 'react';
import { Download, Filter, Eye, Map, FileText, ChevronDown } from 'lucide-react';
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
import { type Column } from './components/shared';
import { ROLE_SUPER_ADMIN } from '../../constants/roles';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { generateLRPdf } from '../../documents/generators/generateLRPdf';
import { generatePODPdf } from '../../documents/generators/generatePODPdf';

interface Milestone {
  status: string;
  date: string;
  location: string;
  completed: boolean;
}

interface DispatchItem {
  id: string;
  dispatchNo: string;
  orderNo: string;
  distributor: string;
  dispatchDate: string;
  transporter: string;
  vehicleNo: string;
  lrNo: string;
  expectedDeliveryDate: string;
  actualDeliveryDate: string;
  dispatchStatus: 'Pending Dispatch' | 'Packed' | 'Dispatched' | 'In Transit' | 'Out For Delivery' | 'Delivered' | 'Delayed' | 'Cancelled';
  podStatus: 'Pending POD' | 'Uploaded' | 'Verified';
  driverName: string;
  driverMobile: string;
  milestones: Milestone[];
}

const mockData: DispatchItem[] = [
  { 
    id: '1', 
    dispatchNo: 'DSP-26-99881',
    orderNo: 'ORD-2026-001', 
    distributor: 'Metro Pharma Distributors', 
    dispatchDate: '25-Oct-2026',
    transporter: 'VRL Logistics', 
    vehicleNo: 'MH-01-AB-1234',
    lrNo: 'LR-MAH-00123', 
    expectedDeliveryDate: '26-Oct-2026',
    actualDeliveryDate: '26-Oct-2026',
    dispatchStatus: 'Delivered',
    podStatus: 'Verified',
    driverName: 'Ramesh Singh',
    driverMobile: '+91 98765 43210',
    milestones: [
      { status: 'Packed', date: '24-Oct-2026 14:30', location: 'Central Warehouse, Mumbai', completed: true },
      { status: 'Dispatched', date: '25-Oct-2026 09:15', location: 'Central Warehouse, Mumbai', completed: true },
      { status: 'In Transit', date: '25-Oct-2026 18:45', location: 'Navi Mumbai Hub', completed: true },
      { status: 'Out For Delivery', date: '26-Oct-2026 08:30', location: 'Andheri Delivery Center', completed: true },
      { status: 'Delivered', date: '26-Oct-2026 14:10', location: 'Metro Pharma Distributors', completed: true }
    ]
  },
  { 
    id: '2', 
    dispatchNo: 'DSP-26-99882',
    orderNo: 'ORD-2026-002', 
    distributor: 'Carewell Agencies', 
    dispatchDate: '26-Oct-2026',
    transporter: 'Gati', 
    vehicleNo: 'MH-12-CD-5678',
    lrNo: 'LR-PUN-00445', 
    expectedDeliveryDate: '28-Oct-2026',
    actualDeliveryDate: 'TBD',
    dispatchStatus: 'In Transit',
    podStatus: 'Pending POD',
    driverName: 'Abdul Shaikh',
    driverMobile: '+91 91234 56780',
    milestones: [
      { status: 'Packed', date: '25-Oct-2026 16:00', location: 'Central Warehouse, Mumbai', completed: true },
      { status: 'Dispatched', date: '26-Oct-2026 10:00', location: 'Central Warehouse, Mumbai', completed: true },
      { status: 'In Transit', date: '27-Oct-2026 06:20', location: 'Pune Highway Checkpoint', completed: true },
      { status: 'Out For Delivery', date: 'Pending', location: 'Pending', completed: false },
      { status: 'Delivered', date: 'Pending', location: 'Pending', completed: false }
    ]
  },
  { 
    id: '3', 
    dispatchNo: 'DSP-26-99883',
    orderNo: 'ORD-2026-003', 
    distributor: 'Global Health Supply', 
    dispatchDate: 'TBD',
    transporter: 'Delhivery', 
    vehicleNo: 'Pending Assignment',
    lrNo: 'Pending', 
    expectedDeliveryDate: '30-Oct-2026',
    actualDeliveryDate: 'TBD',
    dispatchStatus: 'Packed',
    podStatus: 'Pending POD',
    driverName: 'Pending',
    driverMobile: 'Pending',
    milestones: [
      { status: 'Packed', date: '27-Oct-2026 11:30', location: 'Central Warehouse, Mumbai', completed: true },
      { status: 'Dispatched', date: 'Pending', location: 'Pending', completed: false },
      { status: 'In Transit', date: 'Pending', location: 'Pending', completed: false },
      { status: 'Out For Delivery', date: 'Pending', location: 'Pending', completed: false },
      { status: 'Delivered', date: 'Pending', location: 'Pending', completed: false }
    ]
  },
];

export default function DispatchTracking() {
  const activeRole = localStorage.getItem('activeRole') || ROLE_SUPER_ADMIN;
  const loggedInDistributorName = 'Metro Pharma Distributors'; // Mock logged in context

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [podFilter, setPodFilter] = useState('');
  const [transporterFilter, setTransporterFilter] = useState('');
  
  const [viewDispatch, setViewDispatch] = useState<DispatchItem | null>(null);
  const [trackDispatch, setTrackDispatch] = useState<DispatchItem | null>(null);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowExportDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const roleFilteredData = activeRole === ROLE_SUPER_ADMIN 
    ? mockData 
    : mockData.filter(item => item.distributor === loggedInDistributorName);

  const filteredData = roleFilteredData.filter((item) => {
    const searchLower = search.toLowerCase();
    const matchSearch = activeRole === ROLE_SUPER_ADMIN
      ? item.dispatchNo.toLowerCase().includes(searchLower) || item.orderNo.toLowerCase().includes(searchLower) || item.distributor.toLowerCase().includes(searchLower) || item.lrNo.toLowerCase().includes(searchLower)
      : item.dispatchNo.toLowerCase().includes(searchLower) || item.orderNo.toLowerCase().includes(searchLower) || item.lrNo.toLowerCase().includes(searchLower);

    const matchStatus = statusFilter ? item.dispatchStatus === statusFilter : true;
    const matchPod = podFilter ? item.podStatus === podFilter : true;
    const matchTransporter = transporterFilter ? item.transporter === transporterFilter : true;
    
    return matchSearch && matchStatus && matchPod && matchTransporter;
  });

  const getDispatchStatusVariant = (status: string) => {
    switch (status) {
      case 'Delivered': return 'success';
      case 'In Transit': case 'Out For Delivery': case 'Dispatched': return 'info';
      case 'Packed': case 'Pending Dispatch': return 'secondary';
      case 'Delayed': case 'Cancelled': return 'danger';
      default: return 'neutral';
    }
  };

  const getPodStatusVariant = (status: string) => {
    switch (status) {
      case 'Verified': return 'success';
      case 'Uploaded': return 'info';
      case 'Pending POD': return 'warning';
      default: return 'neutral';
    }
  };

  // ----- EXPORT LOGIC -----
  const getExportData = () => {
    if (activeRole === ROLE_SUPER_ADMIN) {
      return filteredData.map(item => ({
        'Dispatch No': item.dispatchNo,
        'Order No': item.orderNo,
        'Distributor': item.distributor,
        'Dispatch Date': item.dispatchDate,
        'Transporter': item.transporter,
        'Vehicle No': item.vehicleNo,
        'LR No': item.lrNo,
        'Expected Delivery Date': item.expectedDeliveryDate,
        'Dispatch Status': item.dispatchStatus,
        'POD Status': item.podStatus
      }));
    } else {
      return filteredData.map(item => ({
        'Dispatch No': item.dispatchNo,
        'Order No': item.orderNo,
        'Dispatch Date': item.dispatchDate,
        'Transporter': item.transporter,
        'LR No': item.lrNo,
        'Expected Delivery Date': item.expectedDeliveryDate,
        'Dispatch Status': item.dispatchStatus
      }));
    }
  };

  const handleExportExcel = () => {
    const data = getExportData();
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Dispatch_Tracking");
    XLSX.writeFile(wb, "Dispatch_Tracking_Export.xlsx");
    setShowExportDropdown(false);
  };

  const handleExportCSV = () => {
    const data = getExportData();
    const ws = XLSX.utils.json_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "Dispatch_Tracking_Export.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportDropdown(false);
  };

  const handleExportPDF = () => {
    const data = getExportData();
    const doc = new jsPDF('landscape');
    const headers = Object.keys(data[0] || {});
    const body = data.map(obj => headers.map(header => (obj as any)[header]));
    
    doc.text("Dispatch Tracking Export", 14, 15);
    autoTable(doc, {
      startY: 20,
      head: [headers],
      body: body,
      theme: 'striped',
      headStyles: { fillColor: [124, 58, 237] },
      styles: { fontSize: 8 }
    });
    doc.save("Dispatch_Tracking_Export.pdf");
    setShowExportDropdown(false);
  };

  // ----- DOWNLOAD LR LOGIC -----
  const handleDownloadLR = (row: DispatchItem) => {
    generateLRPdf(row);
  };

  // ----- COLUMNS -----
  const adminColumns: Column<DispatchItem>[] = [
    { key: 'dispatchNo', label: 'Dispatch No', render: (row) => <span className="font-semibold text-slate-900">{row.dispatchNo}</span> },
    { key: 'orderNo', label: 'Order No', render: (row) => <span className="text-slate-600">{row.orderNo}</span> },
    { key: 'distributor', label: 'Distributor', render: (row) => <span className="text-slate-800">{row.distributor}</span> },
    { key: 'dispatchDate', label: 'Dispatch Date', render: (row) => <span className="text-slate-600">{row.dispatchDate}</span> },
    { key: 'transporter', label: 'Transporter', render: (row) => <span className="text-slate-600">{row.transporter}</span> },
    { key: 'vehicleNo', label: 'Vehicle No', render: (row) => <span className="text-slate-600">{row.vehicleNo}</span> },
    { key: 'lrNo', label: 'LR No', render: (row) => <span className="font-medium text-slate-800">{row.lrNo}</span> },
    { key: 'expectedDeliveryDate', label: 'Expected Delivery Date', render: (row) => <span className="text-slate-600">{row.expectedDeliveryDate}</span> },
    { key: 'dispatchStatus', label: 'Dispatch Status', render: (row) => <Badge variant={getDispatchStatusVariant(row.dispatchStatus) as any}>{row.dispatchStatus}</Badge> },
    { key: 'podStatus', label: 'POD Status', render: (row) => <Badge variant={getPodStatusVariant(row.podStatus) as any}>{row.podStatus}</Badge> },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          <button onClick={() => setViewDispatch(row)} className="text-slate-400 hover:text-violet-600 transition-colors p-1" title="View Details">
            <Eye className="w-4 h-4" />
          </button>
          <button onClick={() => setTrackDispatch(row)} className="text-slate-400 hover:text-blue-600 transition-colors p-1" title="Track Shipment">
            <Map className="w-4 h-4" />
          </button>
          {row.lrNo !== 'Pending' && (
            <button onClick={() => handleDownloadLR(row)} className="text-slate-400 hover:text-emerald-600 transition-colors p-1" title="Download LR">
              <FileText className="w-4 h-4" />
            </button>
          )}
          {row.podStatus !== 'Pending POD' && (
            <button onClick={() => generatePODPdf(row)} className="text-slate-400 hover:text-emerald-600 transition-colors p-1" title="Download POD">
              <Download className="w-4 h-4" />
            </button>
          )}
        </div>
      )
    }
  ];

  const distributorColumns: Column<DispatchItem>[] = [
    { key: 'dispatchNo', label: 'Dispatch No', render: (row) => <span className="font-semibold text-slate-900">{row.dispatchNo}</span> },
    { key: 'orderNo', label: 'Order No', render: (row) => <span className="text-slate-600">{row.orderNo}</span> },
    { key: 'dispatchDate', label: 'Dispatch Date', render: (row) => <span className="text-slate-600">{row.dispatchDate}</span> },
    { key: 'transporter', label: 'Transporter', render: (row) => <span className="text-slate-600">{row.transporter}</span> },
    { key: 'lrNo', label: 'LR No', render: (row) => <span className="font-medium text-slate-800">{row.lrNo}</span> },
    { key: 'expectedDeliveryDate', label: 'Expected Delivery Date', render: (row) => <span className="text-slate-600">{row.expectedDeliveryDate}</span> },
    { key: 'dispatchStatus', label: 'Dispatch Status', render: (row) => <Badge variant={getDispatchStatusVariant(row.dispatchStatus) as any}>{row.dispatchStatus}</Badge> },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          <button onClick={() => setViewDispatch(row)} className="text-slate-400 hover:text-violet-600 transition-colors p-1" title="View Details">
            <Eye className="w-4 h-4" />
          </button>
          <button onClick={() => setTrackDispatch(row)} className="text-slate-400 hover:text-blue-600 transition-colors p-1" title="Track Shipment">
            <Map className="w-4 h-4" />
          </button>
          {row.lrNo !== 'Pending' && (
            <button onClick={() => handleDownloadLR(row)} className="text-slate-400 hover:text-emerald-600 transition-colors p-1" title="Download LR">
              <FileText className="w-4 h-4" />
            </button>
          )}
          {row.podStatus !== 'Pending POD' && (
            <button onClick={() => generatePODPdf(row)} className="text-slate-400 hover:text-emerald-600 transition-colors p-1" title="Download POD">
              <Download className="w-4 h-4" />
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Dispatch & LR Tracking"
        subtitle={activeRole === ROLE_SUPER_ADMIN ? "Track distributor shipments and monitor proof of delivery." : "Track your shipments and monitor expected deliveries."}
        actions={
          <div className="relative" ref={dropdownRef}>
            <ActionButton 
              variant="secondary" 
              icon={<Download className="w-4 h-4" />} 
              onClick={() => setShowExportDropdown(!showExportDropdown)}
            >
              Export Logistics Report <ChevronDown className="w-3 h-3 opacity-50 ml-1" />
            </ActionButton>
            
            {showExportDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 overflow-hidden z-10 animate-in slide-in-from-top-2">
                <div className="p-1">
                  <button onClick={handleExportExcel} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-violet-700 rounded transition-colors">
                    Export as Excel (.xlsx)
                  </button>
                  <button onClick={handleExportCSV} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-violet-700 rounded transition-colors">
                    Export as CSV (.csv)
                  </button>
                  <button onClick={handleExportPDF} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-violet-700 rounded transition-colors">
                    Export as PDF (.pdf)
                  </button>
                </div>
              </div>
            )}
          </div>
        }
      />

      <FilterBar>
        <SearchInput 
          value={search} 
          onChange={setSearch} 
          placeholder={activeRole === ROLE_SUPER_ADMIN ? "Search dispatch, order, LR or distributor..." : "Search dispatch, order or LR..."} 
        />
        <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-600">Filters:</span>
        </div>
        <SelectFilter
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { label: 'Pending Dispatch', value: 'Pending Dispatch' },
            { label: 'Packed', value: 'Packed' },
            { label: 'Dispatched', value: 'Dispatched' },
            { label: 'In Transit', value: 'In Transit' },
            { label: 'Out For Delivery', value: 'Out For Delivery' },
            { label: 'Delivered', value: 'Delivered' },
            { label: 'Delayed', value: 'Delayed' },
            { label: 'Cancelled', value: 'Cancelled' },
          ]}
          placeholder="Dispatch Status"
        />
        {activeRole === ROLE_SUPER_ADMIN && (
          <SelectFilter
            value={podFilter}
            onChange={setPodFilter}
            options={[
              { label: 'Pending POD', value: 'Pending POD' },
              { label: 'Uploaded', value: 'Uploaded' },
              { label: 'Verified', value: 'Verified' },
            ]}
            placeholder="POD Status"
          />
        )}
        <SelectFilter
          value={transporterFilter}
          onChange={setTransporterFilter}
          options={[
            { label: 'VRL Logistics', value: 'VRL Logistics' },
            { label: 'Gati', value: 'Gati' },
            { label: 'Delhivery', value: 'Delhivery' },
            { label: 'Blue Dart', value: 'Blue Dart' },
            { label: 'Others', value: 'Others' },
          ]}
          placeholder="Transporter"
        />
      </FilterBar>

      <TableCard>
        <div className="[&>div::-webkit-scrollbar]:hidden [&>div]:[-ms-overflow-style:none] [&>div]:[scrollbar-width:none]">
          {activeRole === ROLE_SUPER_ADMIN ? (
            <DataTable
              columns={adminColumns}
              data={filteredData}
              emptyMessage="No dispatch records found."
            />
          ) : (
            <DataTable
              columns={distributorColumns}
              data={filteredData}
              emptyMessage="No dispatch records found."
            />
          )}
        </div>
      </TableCard>

      {/* View Drawer */}
      <Drawer
        open={viewDispatch !== null}
        onClose={() => setViewDispatch(null)}
        title="Shipment Details"
      >
        {viewDispatch && (
          <div className="space-y-6 pb-20">
            {/* Shipment Information */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Shipment Information</h3>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <DrawerField label="Dispatch No" value={<span className="font-semibold">{viewDispatch.dispatchNo}</span>} />
                <DrawerField label="Order No" value={viewDispatch.orderNo} />
                {activeRole === ROLE_SUPER_ADMIN && (
                  <DrawerField label="Distributor" value={<span className="font-medium text-slate-800">{viewDispatch.distributor}</span>} />
                )}
                <DrawerField label="Dispatch Date" value={viewDispatch.dispatchDate} />
              </div>
            </div>

            {/* Transport Information */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Transport Information</h3>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <DrawerField label="Transporter" value={viewDispatch.transporter} />
                <DrawerField label="LR Number" value={viewDispatch.lrNo} />
                {activeRole === ROLE_SUPER_ADMIN && (
                  <>
                    <DrawerField label="Vehicle No" value={viewDispatch.vehicleNo} />
                    <DrawerField label="Driver Name" value={viewDispatch.driverName} />
                    <DrawerField label="Driver Mobile" value={viewDispatch.driverMobile} />
                  </>
                )}
              </div>
            </div>

            {/* Delivery Information */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Delivery Information</h3>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                {activeRole === ROLE_SUPER_ADMIN && (
                  <DrawerField label="Dispatch Date" value={viewDispatch.dispatchDate} />
                )}
                <DrawerField label="Expected Delivery" value={viewDispatch.expectedDeliveryDate} />
                {activeRole === ROLE_SUPER_ADMIN ? (
                  <DrawerField label="Actual Delivery" value={viewDispatch.actualDeliveryDate} />
                ) : (
                  <DrawerField label="Current Status" value={<Badge variant={getDispatchStatusVariant(viewDispatch.dispatchStatus) as any}>{viewDispatch.dispatchStatus}</Badge>} />
                )}
              </div>
            </div>

            {/* Status Timeline (Admin Only inside drawer - Distributor handles in Track modal) */}
            {activeRole === ROLE_SUPER_ADMIN && (
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Status Timeline</h3>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <div className="flex flex-col space-y-4">
                    {viewDispatch.milestones.map((ms, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <div className={`mt-0.5 w-2.5 h-2.5 rounded-full ${ms.completed ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                        <div>
                          <p className={`text-sm font-medium ${ms.completed ? 'text-slate-800' : 'text-slate-400'}`}>{ms.status}</p>
                          {ms.completed && <p className="text-xs text-slate-500">{ms.date}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* POD Information */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">POD Information</h3>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <DrawerField label="POD Status" value={<Badge variant={getPodStatusVariant(viewDispatch.podStatus) as any}>{viewDispatch.podStatus}</Badge>} />
                {activeRole === ROLE_SUPER_ADMIN && viewDispatch.podStatus !== 'Pending POD' && (
                  <DrawerField label="POD Upload Date" value={viewDispatch.actualDeliveryDate} />
                )}
                {viewDispatch.podStatus !== 'Pending POD' && (
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <ActionButton variant="secondary" onClick={() => generatePODPdf(viewDispatch)} icon={<Download className="w-4 h-4" />}>
                      Download POD
                    </ActionButton>
                  </div>
                )}
              </div>
            </div>

            {/* Drawer Actions */}
            {viewDispatch.lrNo !== 'Pending' && (
              <div className="mt-6 pt-6 border-t border-slate-200">
                <ActionButton onClick={() => handleDownloadLR(viewDispatch)} icon={<FileText className="w-4 h-4" />}>
                  Download LR
                </ActionButton>
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* Track Shipment Modal/Drawer */}
      {trackDispatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">
                Track Shipment
              </h2>
              <button
                onClick={() => setTrackDispatch(null)}
                className="text-slate-500 hover:text-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-slate-500">Dispatch No</span>
                <span className="font-semibold text-slate-800">{trackDispatch.dispatchNo}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-slate-500">Transporter</span>
                <span className="font-medium text-slate-800">{trackDispatch.transporter}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">LR Number</span>
                <span className="font-medium text-slate-800">{trackDispatch.lrNo}</span>
              </div>
            </div>

            <h3 className="font-bold text-slate-900 mb-4">Tracking History</h3>
            <div className="relative pl-4 border-l-2 border-slate-200 ml-2 space-y-6">
              {trackDispatch.milestones.map((ms, idx) => (
                <div key={idx} className="relative">
                  <div className={`absolute -left-[21px] top-1 w-3 h-3 rounded-full border-2 border-white ${ms.completed ? 'bg-violet-600' : 'bg-slate-300'}`} />
                  <div className="pl-2">
                    <p className={`font-semibold text-sm ${ms.completed ? 'text-slate-900' : 'text-slate-500'}`}>{ms.status}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{ms.location}</p>
                    {ms.completed && <p className="text-xs text-slate-400 mt-1">{ms.date}</p>}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-4 border-t border-slate-100 flex justify-end">
              <ActionButton variant="ghost" onClick={() => setTrackDispatch(null)}>
                Close
              </ActionButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
