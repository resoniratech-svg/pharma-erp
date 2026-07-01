// TransportChallanManagement.tsx
import { useState, useMemo, useEffect, useRef } from 'react';
import { Plus, Download, Filter, ChevronDown, Eye, FileDown, Printer } from 'lucide-react';
import { generatePdf } from '../../documents/generators/pdfGenerator';
import { generatePrint } from '../../documents/generators/printGenerator';
import jsPDF from 'jspdf';
import { applyTransportChallanTemplate } from '../../documents/templates/TransportChallanTemplate';
import logoPng from '../../assets/logo/mj-healthcare-logo.png';
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
import { transportChallanService, type Challan } from '../../services/transportChallanService';

let cachedLogoBase64: string | null = null;

const getLogoBase64 = async (): Promise<string> => {
  if (cachedLogoBase64) return cachedLogoBase64;
  try {
    const res = await fetch(logoPng);
    const blob = await res.blob();
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        cachedLogoBase64 = reader.result as string;
        resolve(cachedLogoBase64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Failed to load logo base64:', error);
    return '';
  }
};

export default function TransportChallans() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [challans, setChallans] = useState<Challan[]>([]);
  const [dispatches, setDispatches] = useState<any[]>([]);
  
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  const [selectedChallan, setSelectedChallan] = useState<Challan | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedDispatchNo, setSelectedDispatchNo] = useState('');
  
  const [activeDispatch, setActiveDispatch] = useState<any | null>(null);
  const [newTransporter, setNewTransporter] = useState('');
  const [newVehicle, setNewVehicle] = useState('');
  const [newDriverName, setNewDriverName] = useState('');
  const [newDriverMobile, setNewDriverMobile] = useState('');
  const [nextChallanNo, setNextChallanNo] = useState('');

  useEffect(() => {
    setChallans(transportChallanService.getAllChallans());
    setDispatches(transportChallanService.getAllDispatches());

    function handleClickOutside(event: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (showCreateModal) {
      setNextChallanNo(transportChallanService.generateNextChallanNumber());
    }
  }, [showCreateModal, challans]);

  useEffect(() => {
    if (selectedDispatchNo) {
      const disp = dispatches.find(d => d.dispatchId === selectedDispatchNo);
      if (disp) {
        setActiveDispatch(disp);
        setNewTransporter(disp.transporter || '');
        setNewVehicle(disp.vehicleNumber || '');
        setNewDriverName(disp.driverName || '');
        setNewDriverMobile(disp.driverMobile || '');
      }
    } else {
      setActiveDispatch(null);
      setNewTransporter('');
      setNewVehicle('');
      setNewDriverName('');
      setNewDriverMobile('');
    }
  }, [selectedDispatchNo, dispatches]);

  const filteredData = useMemo(() => {
    return challans.filter((item) => {
      const searchStr = search.toLowerCase();
      const matchSearch = item.challanNo.toLowerCase().includes(searchStr) || 
                          item.dispatchNo.toLowerCase().includes(searchStr) || 
                          item.customer.toLowerCase().includes(searchStr) ||
                          item.transporter.toLowerCase().includes(searchStr) ||
                          item.vehicleNo.toLowerCase().includes(searchStr);
      const matchStatus = statusFilter ? item.status === statusFilter : true;
      return matchSearch && matchStatus;
    });
  }, [challans, search, statusFilter]);

  const columns: Column<Challan>[] = [
    { key: 'challanNo', label: 'Challan No', render: (row) => <span className="font-semibold text-slate-900">{row.challanNo}</span> },
    { key: 'challanDate', label: 'Challan Date', render: (row) => <span className="text-slate-600">{row.challanDate}</span> },
    { key: 'dispatchNo', label: 'Dispatch No', render: (row) => <span className="text-slate-700">{row.dispatchNo}</span> },
    { key: 'customer', label: 'Customer', render: (row) => <span className="font-medium text-slate-800">{row.customer}</span> },
    { key: 'transporter', label: 'Transporter' },
    { key: 'vehicleNo', label: 'Vehicle No', render: (row) => <span className="font-mono text-slate-600">{row.vehicleNo}</span> },
    { key: 'totalQty', label: 'Total Qty', render: (row) => <span className="font-medium text-slate-900">{row.totalQty}</span> },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        let variant: BadgeVariant = 'neutral';
        if (row.status === 'Generated') variant = 'info';
        if (row.status === 'In Transit') variant = 'warning';
        if (row.status === 'Delivered') variant = 'success';
        if (row.status === 'Cancelled') variant = 'danger';
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedChallan(row);
            }}
            className="text-slate-400 hover:text-violet-600 transition-colors"
            title="View Challan"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDownloadPDF(row);
            }}
            className="text-slate-400 hover:text-violet-600 transition-colors"
            title="Download PDF"
          >
            <FileDown className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePrint(row);
            }}
            className="text-slate-400 hover:text-violet-600 transition-colors"
            title="Print Challan"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  const getFormattedDate = () => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}${mm}${dd}`;
  };

  const handleExportExcel = () => {
    const exportData = filteredData.map(row => ({
      'Challan No': row.challanNo,
      'Challan Date': row.challanDate,
      'Dispatch No': row.dispatchNo,
      'Customer': row.customer,
      'Transporter': row.transporter,
      'Vehicle No': row.vehicleNo,
      'Total Qty': row.totalQty,
      'Status': row.status
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Challans');
    XLSX.writeFile(workbook, `transport_challans_${getFormattedDate()}.xlsx`);
    setShowExportMenu(false);
  };

  const handleExportCSV = () => {
    const headers = ['Challan No', 'Challan Date', 'Dispatch No', 'Customer', 'Transporter', 'Vehicle No', 'Total Qty', 'Status'];
    const csvContent = [
      headers.join(','),
      ...filteredData.map(row => 
        [
          `"${row.challanNo}"`, `"${row.challanDate}"`, `"${row.dispatchNo}"`, `"${row.customer}"`,
          `"${row.transporter}"`, `"${row.vehicleNo}"`, row.totalQty, `"${row.status}"`
        ].join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `transport_challans_${getFormattedDate()}.csv`;
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportMenu(false);
  };

  const handleDownloadPDF = async (challan: Challan) => {
    const base64 = await getLogoBase64();
    const originalAddImage = (jsPDF.prototype as any).addImage;
    
    if (base64) {
      (jsPDF.prototype as any).addImage = function(imageData: any, format: any, ...args: any[]) {
        if (imageData === logoPng) {
          return originalAddImage.apply(this, [base64, format, ...args]);
        }
        return originalAddImage.apply(this, [imageData, format, ...args]);
      };
    }
    
    try {
      generatePdf(challan);
    } finally {
      if (base64) {
        (jsPDF.prototype as any).addImage = originalAddImage;
      }
    }
  };

  const handlePrint = async (challan: Challan) => {
    const base64 = await getLogoBase64();
    const originalAddImage = (jsPDF.prototype as any).addImage;
    
    if (base64) {
      (jsPDF.prototype as any).addImage = function(imageData: any, format: any, ...args: any[]) {
        if (imageData === logoPng) {
          return originalAddImage.apply(this, [base64, format, ...args]);
        }
        return originalAddImage.apply(this, [imageData, format, ...args]);
      };
    }

    try {
      const doc = new jsPDF();
      applyTransportChallanTemplate(doc, challan);
      
      const pdfUrl = doc.output('bloburl');
      const iframe = document.createElement('iframe');
      
      // Use fixed positioning off-screen to avoid display:none print blocking in some browsers
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = 'none';
      iframe.src = pdfUrl.toString();
      
      iframe.onload = () => {
        setTimeout(() => {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        }, 500);
      };
      
      document.body.appendChild(iframe);
      
      // Cleanup the iframe after printing dialog appears
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 15000);
    } catch (err) {
      console.error('Print failed:', err);
    } finally {
      if (base64) {
        (jsPDF.prototype as any).addImage = originalAddImage;
      }
    }
  };

  const handleGenerateChallan = () => {
    if (!activeDispatch) return alert("Dispatch Number is required.");
    if (!newTransporter) return alert("Transporter is required.");
    if (!newVehicle) return alert("Vehicle Number is required.");

    const challanNo = transportChallanService.generateNextChallanNumber();
    const currentUser = transportChallanService.getCurrentUser();
    
    const newChallanObj: Challan = {
      id: Date.now().toString(),
      challanNo,
      challanDate: newDate,
      dispatchNo: activeDispatch.dispatchId,
      dispatchDate: activeDispatch.date,
      orderNo: activeDispatch.orderId || '',
      customer: activeDispatch.client,
      sourceWarehouse: activeDispatch.sourceWarehouse,
      transporter: newTransporter,
      vehicleNo: newVehicle,
      driverName: newDriverName,
      driverMobile: newDriverMobile,
      totalItems: activeDispatch.totalItems,
      totalQty: activeDispatch.totalQuantity,
      status: 'Generated',
      products: activeDispatch.products.map((p: any) => ({ ...p })),
      createdBy: currentUser?.fullName || 'System User',
      createdDate: new Date().toLocaleString()
    };

    const updatedChallans = transportChallanService.createChallan(newChallanObj);
    setChallans(updatedChallans);
    
    setShowCreateModal(false);
    
    setNewDate(new Date().toISOString().split('T')[0]);
    setSelectedDispatchNo('');
    setActiveDispatch(null);
    setNewTransporter('');
    setNewVehicle('');
    setNewDriverName('');
    setNewDriverMobile('');

    alert('Transport Challan generated successfully!');
  };

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Transport Challan Management"
        subtitle="Generate and manage transport challans for dispatched orders."
        actions={
          <>
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
                  </div>
                </div>
              )}
            </div>
            <ActionButton icon={<Plus className="w-4 h-4" />} onClick={() => setShowCreateModal(true)}>
              Generate Challan
            </ActionButton>
          </>
        }
      />

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search challan, dispatch, customer or vehicle..." />
        <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-600">Status:</span>
        </div>
        <SelectFilter
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { label: 'Generated', value: 'Generated' },
            { label: 'In Transit', value: 'In Transit' },
            { label: 'Delivered', value: 'Delivered' },
            { label: 'Cancelled', value: 'Cancelled' },
          ]}
          placeholder="All Statuses"
        />
      </FilterBar>

      <TableCard>
        <DataTable
          columns={columns}
          data={filteredData}
          emptyMessage="No transport challans found."
        />
      </TableCard>

      <Drawer open={!!selectedChallan} onClose={() => setSelectedChallan(null)} title="Transport Challan Details">
        {selectedChallan && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Challan Information</h3>
              <div className="space-y-2">
                <DrawerField label="Challan Number" value={<span className="font-semibold text-slate-900">{selectedChallan.challanNo}</span>} />
                <DrawerField label="Challan Date" value={selectedChallan.challanDate} />
                <DrawerField label="Dispatch Number" value={selectedChallan.dispatchNo} />
                <DrawerField label="Status" value={
                  <Badge variant={
                    selectedChallan.status === 'Generated' ? 'info' : 
                    selectedChallan.status === 'In Transit' ? 'warning' : 
                    selectedChallan.status === 'Delivered' ? 'success' : 'danger'
                  }>
                    {selectedChallan.status}
                  </Badge>
                } />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Customer & Warehouse</h3>
              <div className="space-y-2">
                <DrawerField label="Customer Name" value={selectedChallan.customer} />
                <DrawerField label="Source Warehouse" value={selectedChallan.sourceWarehouse} />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Product Summary</h3>
              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="py-2 px-3 font-semibold text-slate-600">Product Name</th>
                      <th className="py-2 px-3 font-semibold text-slate-600">Batch Number</th>
                      <th className="py-2 px-3 font-semibold text-slate-600 text-right">Quantity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedChallan.products.map((p, i) => (
                      <tr key={i} className="border-b border-slate-100 last:border-0">
                        <td className="py-2 px-3 text-slate-800">{p.productName}</td>
                        <td className="py-2 px-3 text-slate-600">{p.batchNo}</td>
                        <td className="py-2 px-3 text-slate-900 font-medium text-right">{p.dispatchQty}</td>
                      </tr>
                    ))}
                    <tr className="bg-slate-50 font-semibold text-slate-900 border-t border-slate-200">
                      <td colSpan={2} className="py-2 px-3 text-right">Total Quantity:</td>
                      <td className="py-2 px-3 text-right text-violet-700">{selectedChallan.totalQty}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Transport Information</h3>
              <div className="space-y-2">
                <DrawerField label="Transporter" value={selectedChallan.transporter} />
                <DrawerField label="Vehicle Number" value={<span className="font-mono text-slate-700">{selectedChallan.vehicleNo}</span>} />
                <DrawerField label="Driver Name" value={selectedChallan.driverName || '—'} />
                <DrawerField label="Driver Mobile" value={selectedChallan.driverMobile || '—'} />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Audit Information</h3>
              <div className="space-y-2">
                <DrawerField label="Created By" value={selectedChallan.createdBy} />
                <DrawerField label="Created Date" value={selectedChallan.createdDate} />
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
              <ActionButton variant="secondary" onClick={() => setSelectedChallan(null)}>Close</ActionButton>
            </div>
          </div>
        )}
      </Drawer>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">
                Generate Transport Challan
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-500 hover:text-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 mt-2 first:mt-0">
                <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">Challan Information</h3>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Challan Number</label>
                <input type="text" value={nextChallanNo} disabled className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 text-slate-500 font-mono" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Challan Date *</label>
                <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Dispatch Number *</label>
                <select value={selectedDispatchNo} onChange={e => setSelectedDispatchNo(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2">
                  <option value="">Select Dispatch</option>
                  {dispatches.filter(d => ['Ready to Ship', 'Packed', 'Dispatched'].includes(d.status)).map(d => (
                    <option key={d.dispatchId} value={d.dispatchId}>{d.dispatchId}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Dispatch Date</label>
                <input type="text" value={activeDispatch?.date || ''} readOnly className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 text-slate-500" placeholder="Auto-populated" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Customer</label>
                <input type="text" value={activeDispatch?.client || ''} readOnly className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 text-slate-500" placeholder="Auto-populated" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Source Warehouse</label>
                <input type="text" value={activeDispatch?.sourceWarehouse || ''} readOnly className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 text-slate-500" placeholder="Auto-populated" />
              </div>

              <div className="md:col-span-2 mt-4">
                <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">Product Summary</h3>
                {activeDispatch ? (
                  <div className="overflow-x-auto border border-slate-200 rounded-lg">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="py-2 px-3 font-semibold text-slate-600">Product Name</th>
                          <th className="py-2 px-3 font-semibold text-slate-600">Batch Number</th>
                          <th className="py-2 px-3 font-semibold text-slate-600 text-right">Dispatch Quantity</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeDispatch.products.map((p: any, i: number) => (
                          <tr key={i} className="border-b border-slate-100 last:border-0">
                            <td className="py-2 px-3 text-slate-800">{p.productName}</td>
                            <td className="py-2 px-3 text-slate-600 font-mono text-xs">{p.batchNo}</td>
                            <td className="py-2 px-3 text-right font-medium text-slate-900">{p.dispatchQty}</td>
                          </tr>
                        ))}
                        <tr className="bg-slate-50 font-semibold text-slate-900 border-t border-slate-200">
                          <td colSpan={2} className="py-2 px-3 text-right">Total Summary:</td>
                          <td className="py-2 px-3 text-right text-lg text-violet-700">{activeDispatch.totalQuantity}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500 text-sm border border-dashed border-slate-200 rounded-lg bg-slate-50">
                    Select a Dispatch Number to view product summary.
                  </div>
                )}
              </div>

              <div className="md:col-span-2 mt-4">
                <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">Transport Details</h3>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Transporter *</label>
                <input list="transporters" type="text" value={newTransporter} onChange={e => setNewTransporter(e.target.value)} placeholder="Enter Transporter" className="w-full border border-slate-200 rounded-lg px-3 py-2" />
                <datalist id="transporters">
                  <option value="Blue Dart" />
                  <option value="Delhivery" />
                  <option value="DTDC" />
                  <option value="VRL Logistics" />
                </datalist>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Vehicle Number *</label>
                <input type="text" value={newVehicle} onChange={e => setNewVehicle(e.target.value)} placeholder="e.g. MH-01-AB-1234" className="w-full border border-slate-200 rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Driver Name</label>
                <input type="text" value={newDriverName} onChange={e => setNewDriverName(e.target.value)} placeholder="Driver Name (Optional)" className="w-full border border-slate-200 rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Driver Mobile</label>
                <input type="text" value={newDriverMobile} onChange={e => setNewDriverMobile(e.target.value)} placeholder="Mobile Number (Optional)" className="w-full border border-slate-200 rounded-lg px-3 py-2" />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-slate-200">
              <ActionButton variant="secondary" onClick={() => setShowCreateModal(false)}>Cancel</ActionButton>
              <ActionButton onClick={handleGenerateChallan}>Generate Challan</ActionButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}