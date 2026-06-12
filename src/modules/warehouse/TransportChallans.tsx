import { useState, useMemo, useEffect, useRef } from 'react';
import { Plus, Download, Filter, X, ChevronDown, Eye, FileDown, Printer } from 'lucide-react';
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

// -- Mock Data & Types --

interface DispatchProduct {
  productName: string;
  batchNo: string;
  dispatchQty: number;
}

interface DispatchInfo {
  dispatchNo: string;
  orderNo: string;
  customer: string;
  customerContactPerson: string;
  customerMobile: string;
  destinationAddr: string;
  sourceWarehouse: string;
  transporter: string;
  vehicleNo: string;
  driverName: string;
  driverMobile: string;
  lrNumber: string;
  products: DispatchProduct[];
}

interface Challan {
  id: string;
  challanNo: string;
  challanDate: string;
  dispatchNo: string;
  orderNo: string;
  customer: string;
  customerContactPerson: string;
  customerMobile: string;
  deliveryAddress: string;
  sourceWarehouse: string;
  transporter: string;
  vehicleNo: string;
  driverName: string;
  driverMobile: string;
  lrNumber: string;
  noOfPackages: number;
  totalQty: number;
  totalWeight: string;
  expectedDeliveryDate: string;
  remarks: string;
  status: 'Generated' | 'In Transit' | 'Delivered' | 'Cancelled';
  products: DispatchProduct[];
  createdBy: string;
  createdDate: string;
  updatedBy: string;
  updatedDate: string;
}

const mockDispatches: DispatchInfo[] = [
  {
    dispatchNo: 'DSP-2026-0001',
    orderNo: 'SO-2026-0102',
    customer: 'Apollo Hospitals',
    customerContactPerson: 'Dr. Ramesh',
    customerMobile: '9876543210',
    destinationAddr: '123 Apollo Road, Jubilee Hills, Hyderabad',
    sourceWarehouse: 'Hyderabad Warehouse',
    transporter: 'VRL Logistics',
    vehicleNo: 'TS09AB1234',
    driverName: 'Suresh',
    driverMobile: '9988776655',
    lrNumber: 'LR-2026-2001',
    products: [
      { productName: 'Paracetamol 500mg', batchNo: 'B-102', dispatchQty: 2000 }
    ]
  },
  {
    dispatchNo: 'DSP-2026-0002',
    orderNo: 'SO-2026-0105',
    customer: 'Care Pharmacy',
    customerContactPerson: 'Mr. Sharma',
    customerMobile: '9123456789',
    destinationAddr: '45 Care Avenue, Andheri West, Mumbai',
    sourceWarehouse: 'Mumbai Warehouse',
    transporter: 'Blue Dart',
    vehicleNo: 'MH02XY5678',
    driverName: 'Raju',
    driverMobile: '9876512345',
    lrNumber: 'LR-2026-2005',
    products: [
      { productName: 'Amoxicillin 250mg', batchNo: 'B-105', dispatchQty: 3000 },
      { productName: 'Cough Syrup 100ml', batchNo: 'B-110', dispatchQty: 1500 }
    ]
  }
];

const mockTransporters = ['VRL Logistics', 'Blue Dart', 'Delhivery', 'Gati Express'];

const initialChallans: Challan[] = [
  {
    id: '1',
    challanNo: 'CHL-2026-1001',
    challanDate: '12-Jun-2026',
    dispatchNo: 'DSP-2026-0001',
    orderNo: 'SO-2026-0102',
    customer: 'Apollo Hospitals',
    customerContactPerson: 'Dr. Ramesh',
    customerMobile: '9876543210',
    deliveryAddress: '123 Apollo Road, Jubilee Hills, Hyderabad',
    sourceWarehouse: 'Hyderabad Warehouse',
    transporter: 'VRL Logistics',
    vehicleNo: 'TS09AB1234',
    driverName: 'Suresh',
    driverMobile: '9988776655',
    lrNumber: 'LR-2026-2001',
    noOfPackages: 25,
    totalQty: 2000,
    totalWeight: '850 KG',
    expectedDeliveryDate: '14-Jun-2026',
    remarks: 'Handle with care. Temperature controlled shipment.',
    status: 'In Transit',
    products: [
      { productName: 'Paracetamol 500mg', batchNo: 'B-102', dispatchQty: 2000 }
    ],
    createdBy: 'System User',
    createdDate: '12-Jun-2026 10:30 AM',
    updatedBy: 'System User',
    updatedDate: '12-Jun-2026 10:30 AM'
  }
];

export default function TransportChallans() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [challans, setChallans] = useState<Challan[]>(initialChallans);
  
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // View Drawer State
  const [selectedChallan, setSelectedChallan] = useState<Challan | null>(null);

  // Create Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedDispatchNo, setSelectedDispatchNo] = useState('');
  
  // Auto-populated fields
  const [activeDispatch, setActiveDispatch] = useState<DispatchInfo | null>(null);
  const [newTransporter, setNewTransporter] = useState('');
  const [newVehicle, setNewVehicle] = useState('');
  const [newDriverName, setNewDriverName] = useState('');
  const [newDriverMobile, setNewDriverMobile] = useState('');
  const [newLRNumber, setNewLRNumber] = useState('');
  
  // Form input fields
  const [newNoOfPackages, setNewNoOfPackages] = useState<number | ''>('');
  const [newTotalWeight, setNewTotalWeight] = useState('');
  const [newExpectedDate, setNewExpectedDate] = useState('');
  const [newRemarks, setNewRemarks] = useState('');

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync dispatch selection to modal fields
  useEffect(() => {
    if (selectedDispatchNo) {
      const disp = mockDispatches.find(d => d.dispatchNo === selectedDispatchNo);
      if (disp) {
        setActiveDispatch(disp);
        setNewTransporter(disp.transporter);
        setNewVehicle(disp.vehicleNo);
        setNewDriverName(disp.driverName);
        setNewDriverMobile(disp.driverMobile);
        setNewLRNumber(disp.lrNumber);
      }
    } else {
      setActiveDispatch(null);
      setNewTransporter('');
      setNewVehicle('');
      setNewDriverName('');
      setNewDriverMobile('');
      setNewLRNumber('');
    }
  }, [selectedDispatchNo]);

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

  const handlePrint = (challan: Challan) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const htmlContent = `
      <html>
        <head>
          <title>Transport Challan - ${challan.challanNo}</title>
          <style>
            body { font-family: system-ui, sans-serif; padding: 40px; color: #333; }
            h1 { text-align: center; border-bottom: 2px solid #ccc; padding-bottom: 10px; }
            .section { margin-bottom: 20px; }
            .section-title { font-weight: bold; margin-bottom: 10px; background: #f4f4f4; padding: 5px; }
            table { w-full border-collapse: collapse; width: 100%; margin-top: 10px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f9f9f9; }
            .row { display: flex; justify-content: space-between; margin-bottom: 5px; }
            .col { flex: 1; }
          </style>
        </head>
        <body>
          <h1>Transport Challan</h1>
          <div class="section">
            <div class="row">
              <div class="col"><strong>Challan No:</strong> ${challan.challanNo}</div>
              <div class="col"><strong>Date:</strong> ${challan.challanDate}</div>
            </div>
            <div class="row">
              <div class="col"><strong>Dispatch No:</strong> ${challan.dispatchNo}</div>
              <div class="col"><strong>Status:</strong> ${challan.status}</div>
            </div>
          </div>
          <div class="section">
            <div class="section-title">Customer Information</div>
            <div><strong>Name:</strong> ${challan.customer}</div>
            <div><strong>Address:</strong> ${challan.deliveryAddress}</div>
            <div><strong>Contact:</strong> ${challan.customerContactPerson} (${challan.customerMobile})</div>
          </div>
          <div class="section">
            <div class="section-title">Transport Information</div>
            <div class="row">
              <div class="col"><strong>Transporter:</strong> ${challan.transporter}</div>
              <div class="col"><strong>Vehicle No:</strong> ${challan.vehicleNo}</div>
            </div>
            <div class="row">
              <div class="col"><strong>Driver Name:</strong> ${challan.driverName || 'N/A'}</div>
              <div class="col"><strong>LR Number:</strong> ${challan.lrNumber || 'N/A'}</div>
            </div>
          </div>
          <div class="section">
            <div class="section-title">Product Details</div>
            <table>
              <tr><th>Product Name</th><th>Batch No</th><th>Quantity</th></tr>
              ${challan.products.map(p => `<tr><td>${p.productName}</td><td>${p.batchNo}</td><td>${p.dispatchQty}</td></tr>`).join('')}
            </table>
          </div>
        </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const handleDownloadPDF = (challan: Challan) => {
    // Generate an HTML payload and create a blob to simulate a PDF download since no PDF library is available
    const content = `Transport Challan: ${challan.challanNo}\nDate: ${challan.challanDate}\nCustomer: ${challan.customer}\nTransporter: ${challan.transporter}\nVehicle: ${challan.vehicleNo}\nTotal Qty: ${challan.totalQty}\nStatus: ${challan.status}\n\nProducts:\n${challan.products.map(p => `- ${p.productName} (Batch: ${p.batchNo}) Qty: ${p.dispatchQty}`).join('\n')}`;
    const blob = new Blob([content], { type: 'text/plain' }); // Fallback to plain text for mock
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${challan.challanNo}.pdf`;
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleGenerateChallan = () => {
    if (!activeDispatch) return alert("Dispatch Number is required.");
    if (!newTransporter) return alert("Transporter is required.");
    if (!newVehicle) return alert("Vehicle Number is required.");
    if (!newNoOfPackages) return alert("Number Of Packages is required.");

    const totalQty = activeDispatch.products.reduce((acc, curr) => acc + curr.dispatchQty, 0);

    const challanNo = `CHL-2026-${String(challans.length + 1001)}`;
    const newChallanObj: Challan = {
      id: Date.now().toString(),
      challanNo,
      challanDate: newDate,
      dispatchNo: activeDispatch.dispatchNo,
      orderNo: activeDispatch.orderNo,
      customer: activeDispatch.customer,
      customerContactPerson: activeDispatch.customerContactPerson,
      customerMobile: activeDispatch.customerMobile,
      deliveryAddress: activeDispatch.destinationAddr,
      sourceWarehouse: activeDispatch.sourceWarehouse,
      transporter: newTransporter,
      vehicleNo: newVehicle,
      driverName: newDriverName,
      driverMobile: newDriverMobile,
      lrNumber: newLRNumber,
      noOfPackages: Number(newNoOfPackages),
      totalQty,
      totalWeight: newTotalWeight,
      expectedDeliveryDate: newExpectedDate,
      remarks: newRemarks,
      status: 'Generated',
      products: activeDispatch.products.map(p => ({ ...p })),
      createdBy: 'System Admin',
      createdDate: new Date().toLocaleString(),
      updatedBy: 'System Admin',
      updatedDate: new Date().toLocaleString()
    };

    setChallans([newChallanObj, ...challans]);
    setShowCreateModal(false);
    
    // Reset Form
    setNewDate(new Date().toISOString().split('T')[0]);
    setSelectedDispatchNo('');
    setActiveDispatch(null);
    setNewTransporter('');
    setNewVehicle('');
    setNewDriverName('');
    setNewDriverMobile('');
    setNewLRNumber('');
    setNewNoOfPackages('');
    setNewTotalWeight('');
    setNewExpectedDate('');
    setNewRemarks('');
    
    console.log(`[Challan Generated] Linked to dispatch ${activeDispatch.dispatchNo}`);
    console.log(`[Challan Generated] Linked to transporter ${newTransporter}`);
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

      {/* Transport Challan Details Drawer */}
      <Drawer open={!!selectedChallan} onClose={() => setSelectedChallan(null)} title="Transport Challan Details">
        {selectedChallan && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Challan Information</h3>
              <div className="space-y-2">
                <DrawerField label="Challan Number" value={<span className="font-semibold text-slate-900">{selectedChallan.challanNo}</span>} />
                <DrawerField label="Challan Date" value={selectedChallan.challanDate} />
                <DrawerField label="Dispatch Number" value={selectedChallan.dispatchNo} />
                <DrawerField label="Order Number" value={selectedChallan.orderNo} />
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
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Customer Information</h3>
              <div className="space-y-2">
                <DrawerField label="Customer Name" value={selectedChallan.customer} />
                <DrawerField label="Contact Person" value={selectedChallan.customerContactPerson} />
                <DrawerField label="Mobile Number" value={selectedChallan.customerMobile} />
                <DrawerField label="Delivery Address" value={<span className="whitespace-pre-line">{selectedChallan.deliveryAddress}</span>} />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Product Information</h3>
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
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Transport Information</h3>
              <div className="space-y-2">
                <DrawerField label="Transporter" value={selectedChallan.transporter} />
                <DrawerField label="Vehicle Number" value={selectedChallan.vehicleNo} />
                <DrawerField label="Driver Name" value={selectedChallan.driverName || '—'} />
                <DrawerField label="Driver Mobile" value={selectedChallan.driverMobile || '—'} />
                <DrawerField label="LR Number" value={<span className="font-mono text-slate-700">{selectedChallan.lrNumber || '—'}</span>} />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Shipment Information</h3>
              <div className="space-y-2">
                <DrawerField label="Number Of Packages" value={selectedChallan.noOfPackages} />
                <DrawerField label="Total Quantity" value={<span className="font-semibold text-slate-900">{selectedChallan.totalQty}</span>} />
                <DrawerField label="Total Weight" value={selectedChallan.totalWeight || '—'} />
                <DrawerField label="Expected Delivery Date" value={selectedChallan.expectedDeliveryDate || '—'} />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Audit Information</h3>
              <div className="space-y-2">
                <DrawerField label="Created By" value={selectedChallan.createdBy} />
                <DrawerField label="Created Date" value={selectedChallan.createdDate} />
                <DrawerField label="Updated By" value={selectedChallan.updatedBy} />
                <DrawerField label="Updated Date" value={selectedChallan.updatedDate} />
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
              <ActionButton variant="secondary" onClick={() => setSelectedChallan(null)}>Close</ActionButton>
            </div>
          </div>
        )}
      </Drawer>

      {/* Generate Challan Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">Generate Transport Challan</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-500 hover:text-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-8">
              {/* Section 1 - Challan Information */}
              <div>
                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Challan Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium mb-1">Challan Number</label>
                    <input type="text" value={`CHL-2026-${String(challans.length + 1001)}`} readOnly className="w-full border border-slate-200 bg-slate-100 text-slate-500 rounded-lg px-3 py-2 font-mono" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Challan Date *</label>
                    <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} className="w-full border border-slate-200 bg-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Dispatch Number *</label>
                    <select value={selectedDispatchNo} onChange={e => setSelectedDispatchNo(e.target.value)} className="w-full border border-slate-200 bg-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400">
                      <option value="">Select Dispatch</option>
                      {mockDispatches.map(d => <option key={d.dispatchNo} value={d.dispatchNo}>{d.dispatchNo}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Order Number</label>
                    <input type="text" value={activeDispatch?.orderNo || ''} readOnly className="w-full border border-slate-200 bg-slate-100 text-slate-500 rounded-lg px-3 py-2" placeholder="Auto-populated" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Customer</label>
                    <input type="text" value={activeDispatch?.customer || ''} readOnly className="w-full border border-slate-200 bg-slate-100 text-slate-500 rounded-lg px-3 py-2" placeholder="Auto-populated" />
                  </div>
                </div>
              </div>

              {/* Section 2 - Source & Destination */}
              <div>
                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Source & Destination</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium mb-1">Source Warehouse</label>
                    <input type="text" value={activeDispatch?.sourceWarehouse || ''} readOnly className="w-full border border-slate-200 bg-slate-100 text-slate-500 rounded-lg px-3 py-2" placeholder="Auto-populated" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Destination</label>
                    <input type="text" value={activeDispatch?.customer || ''} readOnly className="w-full border border-slate-200 bg-slate-100 text-slate-500 rounded-lg px-3 py-2" placeholder="Auto-populated" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Delivery Address</label>
                    <textarea value={activeDispatch?.destinationAddr || ''} readOnly className="w-full border border-slate-200 bg-slate-100 text-slate-500 rounded-lg px-3 py-2 min-h-[80px]" placeholder="Auto-populated" />
                  </div>
                </div>
              </div>

              {/* Section 3 - Product Details */}
              <div>
                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Product Details</h3>
                {activeDispatch?.products && activeDispatch.products.length > 0 ? (
                  <div className="overflow-x-auto border border-slate-200 rounded-lg">
                    <table className="w-full text-left text-sm border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="py-3 px-4 font-semibold text-slate-700">Product Name</th>
                          <th className="py-3 px-4 font-semibold text-slate-700">Batch Number</th>
                          <th className="py-3 px-4 font-semibold text-slate-700 text-right">Dispatch Quantity</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeDispatch.products.map((p, i) => (
                          <tr key={i} className="border-b border-slate-100 last:border-0 bg-slate-50/50">
                            <td className="py-3 px-4 font-medium text-slate-600">{p.productName}</td>
                            <td className="py-3 px-4 text-slate-500 font-mono text-xs">{p.batchNo}</td>
                            <td className="py-3 px-4 text-right font-medium text-slate-600">{p.dispatchQty}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500 text-sm border border-dashed border-slate-200 rounded-lg bg-slate-50">
                    Select a Dispatch Number to load products.
                  </div>
                )}
              </div>

              {/* Section 4 - Transport Information */}
              <div>
                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Transport Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium mb-1">Transporter *</label>
                    <select value={newTransporter} onChange={e => setNewTransporter(e.target.value)} className="w-full border border-slate-200 bg-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400">
                      <option value="">Select Transporter</option>
                      {mockTransporters.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Vehicle Number *</label>
                    <input type="text" value={newVehicle} onChange={e => setNewVehicle(e.target.value)} placeholder="e.g. TS09AB1234" className="w-full border border-slate-200 bg-white rounded-lg px-3 py-2 uppercase focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Driver Name</label>
                    <input type="text" value={newDriverName} onChange={e => setNewDriverName(e.target.value)} className="w-full border border-slate-200 bg-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Driver Mobile</label>
                    <input type="text" value={newDriverMobile} onChange={e => setNewDriverMobile(e.target.value)} className="w-full border border-slate-200 bg-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">LR Number (Optional)</label>
                    <input type="text" value={newLRNumber} onChange={e => setNewLRNumber(e.target.value)} placeholder="e.g. LR-2026-2001" className="w-full border border-slate-200 bg-white rounded-lg px-3 py-2 font-mono text-sm focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400" />
                  </div>
                </div>
              </div>

              {/* Section 5 - Shipment Information */}
              <div>
                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Shipment Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium mb-1">Number Of Packages *</label>
                    <input type="number" min="1" value={newNoOfPackages} onChange={e => setNewNoOfPackages(e.target.value ? Number(e.target.value) : '')} placeholder="e.g. 25" className="w-full border border-slate-200 bg-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Total Quantity</label>
                    <input type="text" value={activeDispatch ? activeDispatch.products.reduce((acc, curr) => acc + curr.dispatchQty, 0) : ''} readOnly className="w-full border border-slate-200 bg-slate-100 text-slate-500 rounded-lg px-3 py-2" placeholder="Auto-calculated" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Total Weight</label>
                    <input type="text" value={newTotalWeight} onChange={e => setNewTotalWeight(e.target.value)} placeholder="e.g. 850 KG" className="w-full border border-slate-200 bg-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Expected Delivery Date</label>
                    <input type="date" value={newExpectedDate} onChange={e => setNewExpectedDate(e.target.value)} className="w-full border border-slate-200 bg-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400" />
                  </div>
                </div>
              </div>

              {/* Section 6 - Additional Information */}
              <div>
                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Additional Information</h3>
                <div className="grid grid-cols-1 gap-5">
                  <div>
                    <label className="block text-sm font-medium mb-1">Remarks</label>
                    <textarea value={newRemarks} onChange={e => setNewRemarks(e.target.value)} placeholder="e.g. Handle with care. Temperature controlled shipment." className="w-full border border-slate-200 bg-white rounded-lg px-3 py-2 min-h-[80px] focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400" />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-slate-100">
              <ActionButton variant="secondary" onClick={() => setShowCreateModal(false)}>Cancel</ActionButton>
              <ActionButton onClick={handleGenerateChallan}>Generate Challan</ActionButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
