import { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Globe, 
  Plane, 
  Ship, 
  FileCheck, 
  AlertTriangle, 
  Eye, 
  Download, 
  ChevronDown, 
  FileSpreadsheet, 
  FileText,
  DollarSign,
  Plus,
  RefreshCw,
  X,
  Package,
  Database,
  CheckCircle2,
  Trash2
} from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  PageHeader,
  SearchInput,
  SelectFilter,
  TableCard,
  DataTable,
  Badge,
  SummaryCard
} from './components/shared';
import { type Column } from './components/shared';
import { exportOrderService, type ExportOrder, type CreateExportOrderPayload } from '../../services/exportOrderService';

export default function ExportOrderMonitoring() {
  const [orders, setOrders] = useState<ExportOrder[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  
  // Filters
  const [country, setCountry] = useState('');
  const [shippingMode, setShippingMode] = useState('');
  const [status, setStatus] = useState('');

  // Modals
  const [selectedOrder, setSelectedOrder] = useState<ExportOrder | null>(null);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  // New Order Form State
  const [formData, setFormData] = useState<CreateExportOrderPayload>({
    orderNumber: '',
    invoiceNumber: '',
    buyerName: '',
    destinationCountry: 'United Kingdom',
    destinationPort: 'Port of Felixstowe',
    portOfLoading: 'Nhava Sheva (JNPT), Mumbai',
    shippingMode: 'Ocean Cargo',
    containerOrAwbNo: '',
    orderValueUSD: 100000,
    orderValueINR: 8320000,
    orderDate: new Date().toISOString().slice(0, 10),
    eta: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    customsStatus: 'Cleared',
    status: 'In Transit',
    itemsSummary: 'Amoxicillin 500mg, Paracetamol 650mg (1,000 Cartons)',
    incoterm: 'CIF',
  });

  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await exportOrderService.getExportOrders();
      setOrders(data);
    } catch (err: any) {
      console.error('Failed to fetch export orders:', err);
      setError(err.message || 'Failed to load export orders from database.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsExportOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.buyerName || !formData.destinationCountry || !formData.orderValueUSD) {
      alert('Please fill in required fields: Buyer Name, Destination Country, and Order Value.');
      return;
    }
    try {
      setIsSubmitting(true);
      const created = await exportOrderService.createExportOrder(formData);
      setOrders((prev) => [created, ...prev]);
      setIsCreateModalOpen(false);
      // Reset form
      setFormData({
        orderNumber: '',
        invoiceNumber: '',
        buyerName: '',
        destinationCountry: 'United Kingdom',
        destinationPort: 'Port of Felixstowe',
        portOfLoading: 'Nhava Sheva (JNPT), Mumbai',
        shippingMode: 'Ocean Cargo',
        containerOrAwbNo: '',
        orderValueUSD: 100000,
        orderValueINR: 8320000,
        orderDate: new Date().toISOString().slice(0, 10),
        eta: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        customsStatus: 'Cleared',
        status: 'In Transit',
        itemsSummary: '',
        incoterm: 'CIF',
      });
    } catch (err: any) {
      alert(`Error creating export order: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSeedSampleData = async () => {
    try {
      setIsSeeding(true);
      const sampleOrders: CreateExportOrderPayload[] = [
        {
          orderNumber: 'EXP-ORD-2026-001',
          invoiceNumber: 'EXP-INV-9901',
          buyerName: 'Apotheke Global Health Ltd',
          destinationCountry: 'United Kingdom',
          destinationPort: 'Port of Felixstowe',
          portOfLoading: 'Nhava Sheva (JNPT), Mumbai',
          shippingMode: 'Ocean Cargo',
          containerOrAwbNo: 'MEDU-9481023-7',
          orderValueUSD: 145000,
          orderValueINR: 12035000,
          orderDate: '2026-07-15',
          eta: '2026-08-20',
          customsStatus: 'Cleared',
          status: 'In Transit',
          itemsSummary: 'Amoxicillin 500mg, Paracetamol 650mg (1,200 Cartons)',
          incoterm: 'CIF'
        },
        {
          orderNumber: 'EXP-ORD-2026-002',
          invoiceNumber: 'EXP-INV-9902',
          buyerName: 'Gulf Pharma Distribution LLC',
          destinationCountry: 'United Arab Emirates',
          destinationPort: 'Dubai Cargo Village (DXB)',
          portOfLoading: 'Mumbai Air Cargo Terminal',
          shippingMode: 'Air Freight',
          containerOrAwbNo: 'AWB-176-49201948',
          orderValueUSD: 85000,
          orderValueINR: 7055000,
          orderDate: '2026-07-28',
          eta: '2026-08-06',
          customsStatus: 'Cleared',
          status: 'Port Departure',
          itemsSummary: 'Azithromycin Tablets & Cough Syrup formulations',
          incoterm: 'FOB'
        },
        {
          orderNumber: 'EXP-ORD-2026-003',
          invoiceNumber: 'EXP-INV-9903',
          buyerName: 'BioHealth Pharma USA Inc',
          destinationCountry: 'United States',
          destinationPort: 'Port of New York / Newark',
          portOfLoading: 'Nhava Sheva (JNPT), Mumbai',
          shippingMode: 'Ocean Cargo',
          containerOrAwbNo: 'MSCU-8849102-1',
          orderValueUSD: 240000,
          orderValueINR: 19920000,
          orderDate: '2026-07-02',
          eta: '2026-08-10',
          customsStatus: 'Cleared',
          status: 'In Transit',
          itemsSummary: 'Pantoprazole 40mg & Metformin 500mg (2,500 Cartons)',
          incoterm: 'CIF'
        },
        {
          orderNumber: 'EXP-ORD-2026-004',
          invoiceNumber: 'EXP-INV-9904',
          buyerName: 'AfriCare Pharmaceuticals',
          destinationCountry: 'Kenya',
          destinationPort: 'Port of Mombasa',
          portOfLoading: 'Chennai Sea Port',
          shippingMode: 'Ocean Cargo',
          containerOrAwbNo: 'CMAU-4910482-9',
          orderValueUSD: 62000,
          orderValueINR: 5146000,
          orderDate: '2026-07-20',
          eta: '2026-08-15',
          customsStatus: 'Under Inspection',
          status: 'Documentation',
          itemsSummary: 'Multivitamin Supplements & Antibiotic Injectables',
          incoterm: 'CFR'
        },
        {
          orderNumber: 'EXP-ORD-2026-005',
          invoiceNumber: 'EXP-INV-9905',
          buyerName: 'EuroPharma Distribution GmbH',
          destinationCountry: 'Germany',
          destinationPort: 'Frankfurt Cargo City',
          portOfLoading: 'Delhi IGI Air Cargo',
          shippingMode: 'Air Freight',
          containerOrAwbNo: 'AWB-020-84729103',
          orderValueUSD: 95000,
          orderValueINR: 7885000,
          orderDate: '2026-07-30',
          eta: '2026-08-08',
          customsStatus: 'Documentation Pending',
          status: 'On Hold',
          itemsSummary: 'Specialty Formulations (Certificate of Origin under review)',
          incoterm: 'FOB'
        }
      ];

      for (const sample of sampleOrders) {
        await exportOrderService.createExportOrder(sample);
      }
      await fetchOrders();
    } catch (err: any) {
      alert(`Failed to seed data into database: ${err.message}`);
    } finally {
      setIsSeeding(false);
    }
  };

  const handleDeleteOrder = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this export order from PostgreSQL database?')) {
      return;
    }
    try {
      await exportOrderService.deleteExportOrder(id);
      setOrders(prev => prev.filter(o => o.id !== id));
      if (selectedOrder && selectedOrder.id === id) {
        setSelectedOrder(null);
      }
    } catch (err: any) {
      alert(`Failed to delete order: ${err.message}`);
    }
  };

  const filteredData = useMemo(() => {
    return orders.filter(item => {
      let match = true;
      if (search) {
        const q = search.toLowerCase();
        match = match && (
          (item.orderNumber || '').toLowerCase().includes(q) ||
          (item.invoiceNumber || '').toLowerCase().includes(q) ||
          (item.buyerName || '').toLowerCase().includes(q) ||
          (item.destinationCountry || '').toLowerCase().includes(q) ||
          (item.containerOrAwbNo || '').toLowerCase().includes(q)
        );
      }
      if (country) match = match && item.destinationCountry === country;
      if (shippingMode) match = match && item.shippingMode === shippingMode;
      if (status) match = match && item.status === status;
      return match;
    });
  }, [orders, search, country, shippingMode, status]);

  // Dynamic KPI Aggregations from PostgreSQL data
  const totalValueUSD = filteredData.reduce((acc, curr) => acc + (curr.orderValueUSD || 0), 0);
  const totalValueINR = filteredData.reduce((acc, curr) => acc + (curr.orderValueINR || 0), 0);
  const activeShipmentsCount = filteredData.filter(d => d.status === 'In Transit' || d.status === 'Port Departure').length;
  const customsClearedCount = filteredData.filter(d => d.customsStatus === 'Cleared').length;
  const pendingDocsCount = filteredData.filter(d => d.customsStatus === 'Documentation Pending' || d.status === 'On Hold').length;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toISOString().slice(0, 10);
    } catch {
      return dateStr;
    }
  };

  const columns: Column<ExportOrder>[] = [
    {
      key: 'orderNumber',
      label: 'Export Order / Inv',
      render: (row) => (
        <div>
          <span className="font-semibold text-slate-900 block">{row.orderNumber}</span>
          <span className="font-mono text-xs text-slate-500">{row.invoiceNumber || 'No Invoice'}</span>
        </div>
      )
    },
    {
      key: 'buyerName',
      label: 'Buyer & Destination',
      render: (row) => (
        <div>
          <span className="font-medium text-slate-800 block">{row.buyerName}</span>
          <span className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
            <Globe className="w-3 h-3 text-[#163c78]" />
            {row.destinationCountry} {row.destinationPort ? `(${row.destinationPort})` : ''}
          </span>
        </div>
      )
    },
    {
      key: 'shippingMode',
      label: 'Logistics Mode',
      render: (row) => (
        <div className="flex items-center gap-1.5">
          {row.shippingMode === 'Air Freight' ? (
            <Plane className="w-4 h-4 text-sky-600" />
          ) : (
            <Ship className="w-4 h-4 text-indigo-600" />
          )}
          <div>
            <span className="text-xs font-semibold text-slate-700 block">{row.shippingMode}</span>
            <span className="font-mono text-[11px] text-slate-500">{row.containerOrAwbNo || 'Pending AWB'}</span>
          </div>
        </div>
      )
    },
    {
      key: 'orderValueUSD',
      label: 'Order Value',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900 block">${Number(row.orderValueUSD || 0).toLocaleString()}</span>
          <span className="text-xs text-slate-500 font-medium">₹ {((Number(row.orderValueINR || 0)) / 100000).toFixed(2)} Lakhs</span>
        </div>
      )
    },
    {
      key: 'eta',
      label: 'Order Date / ETA',
      render: (row) => (
        <div className="text-xs">
          <span className="text-slate-500 block">Booked: {formatDate(row.orderDate)}</span>
          <span className="text-slate-800 font-semibold block">ETA: {formatDate(row.eta)}</span>
        </div>
      )
    },
    {
      key: 'customsStatus',
      label: 'Customs',
      render: (row) => {
        const variant = row.customsStatus === 'Cleared' ? 'success' : row.customsStatus === 'Under Inspection' ? 'warning' : 'danger';
        return <Badge variant={variant}>{row.customsStatus}</Badge>;
      }
    },
    {
      key: 'status',
      label: 'Shipment Status',
      render: (row) => {
        const variant = 
          row.status === 'Delivered' ? 'success' : 
          row.status === 'In Transit' ? 'info' : 
          row.status === 'Port Departure' ? 'primary' : 
          row.status === 'Documentation' ? 'warning' : 'danger';
        return <Badge variant={variant}>{row.status}</Badge>;
      }
    },
    {
      key: 'id',
      label: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setSelectedOrder(row)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-[#163c78] bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
            title="View full shipment details"
          >
            <Eye className="w-3.5 h-3.5" />
            Details
          </button>
          <button
            onClick={() => handleDeleteOrder(row.id)}
            className="p-1.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
            title="Delete record from PostgreSQL"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )
    }
  ];

  const getExportData = () => {
    const timestamp = new Date().toLocaleString();
    const activeFilters = [
      search && `Search: ${search}`,
      country && `Country: ${country}`,
      shippingMode && `Mode: ${shippingMode}`,
      status && `Status: ${status}`
    ].filter(Boolean).join(' | ') || 'None';

    const headerRows = [
      ['Export Order Monitoring Report (PostgreSQL DB)'],
      [`Generated On: ${timestamp}`],
      [`Active Filters: ${activeFilters}`],
      []
    ];

    const tableHeaders = [
      'Order Number',
      'Invoice Number',
      'Buyer Name',
      'Destination Country',
      'Destination Port',
      'Shipping Mode',
      'Container / AWB',
      'Value (USD)',
      'Value (INR)',
      'Order Date',
      'ETA',
      'Customs Status',
      'Shipment Status',
      'Incoterm'
    ];

    const tableRows = filteredData.map(row => [
      row.orderNumber,
      row.invoiceNumber || '',
      row.buyerName,
      row.destinationCountry,
      row.destinationPort || '',
      row.shippingMode,
      row.containerOrAwbNo || '',
      `$${row.orderValueUSD}`,
      `₹${row.orderValueINR}`,
      formatDate(row.orderDate),
      formatDate(row.eta),
      row.customsStatus,
      row.status,
      row.incoterm
    ]);

    return { headerRows, tableHeaders, tableRows };
  };

  const handleExportCSV = () => {
    if (filteredData.length === 0) {
      alert("No data available for export.");
      return;
    }
    const { headerRows, tableHeaders, tableRows } = getExportData();
    const csvContent = [
      ...headerRows.map(row => `"${row.join('","')}"`),
      `"${tableHeaders.join('","')}"`,
      ...tableRows.map(row => `"${row.join('","')}"`)
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    link.href = URL.createObjectURL(blob);
    link.download = `Export_Order_Monitoring_${dateStr}.csv`;
    link.click();
    setIsExportOpen(false);
  };

  const handleExportExcel = () => {
    if (filteredData.length === 0) {
      alert("No data available for export.");
      return;
    }
    const { headerRows, tableHeaders, tableRows } = getExportData();
    const wsData = [
      ...headerRows,
      tableHeaders,
      ...tableRows
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Export Orders");
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    XLSX.writeFile(wb, `Export_Order_Monitoring_${dateStr}.xlsx`);
    setIsExportOpen(false);
  };

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Export Order Monitoring"
        subtitle="Real-time oversight of international pharma shipments, customs clearance, and global buyers connected to PostgreSQL."
        breadcrumb={[{ label: 'Super Admin' }, { label: 'Export Order Monitoring' }]}
        actions={
          <div className="flex items-center gap-3">
            <button
              onClick={fetchOrders}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
              title="Refresh from PostgreSQL Database"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Sync DB
            </button>

            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#163c78] hover:bg-[#112d5a] text-white rounded-lg text-sm font-semibold shadow-sm transition-all duration-200 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              New Export Order
            </button>

            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsExportOpen(!isExportOpen)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-sm font-semibold transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-violet-500 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Export
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>
              
              {isExportOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 shadow-lg rounded-xl overflow-hidden z-50 animate-in slide-in-from-top-2 duration-200">
                  <div className="p-1">
                    <button
                      onClick={handleExportCSV}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-[#163c78] rounded-lg transition-colors text-left cursor-pointer"
                    >
                      <FileText className="w-4 h-4" />
                      Export CSV
                    </button>
                    <button
                      onClick={handleExportExcel}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-[#163c78] rounded-lg transition-colors text-left mt-1 cursor-pointer"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      Export Excel (.xlsx)
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        }
      />

      {/* Database Connection Badge */}
      <div className="flex items-center justify-between bg-blue-50/70 border border-blue-200/80 px-4 py-2.5 rounded-xl mb-6 text-xs text-blue-900">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-[#163c78]" />
          <span><strong>PostgreSQL Database Connected:</strong> Table <code className="bg-white px-1.5 py-0.5 rounded border border-blue-200 font-mono">"ExportOrder"</code></span>
        </div>
        <span className="font-semibold text-slate-700">Total Records in DB: {orders.length}</span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <SummaryCard 
          title="Total Export Value" 
          value={totalValueUSD >= 1000 ? `$${(totalValueUSD / 1000).toFixed(0)}K` : `$${totalValueUSD}`} 
          subtitle={`₹ ${(totalValueINR / 10000000).toFixed(2)} Cr Eqv`}
          icon={<DollarSign className="w-6 h-6" />} 
          colorClass="text-blue-600" 
          bgClass="bg-blue-100" 
        />
        <SummaryCard 
          title="Active Shipments" 
          value={`${activeShipmentsCount} Orders`} 
          subtitle="In Transit / Port Clearance"
          icon={<Ship className="w-6 h-6" />} 
          colorClass="text-[#163c78]" 
          bgClass="bg-violet-100" 
        />
        <SummaryCard 
          title="Customs Cleared" 
          value={`${customsClearedCount} Orders`} 
          subtitle="Ready / Dispatched"
          icon={<FileCheck className="w-6 h-6" />} 
          colorClass="text-emerald-600" 
          bgClass="bg-emerald-100" 
        />
        <SummaryCard 
          title="Pending Compliance" 
          value={`${pendingDocsCount} Orders`} 
          subtitle="Docs / Under Review"
          icon={<AlertTriangle className="w-6 h-6" />} 
          colorClass="text-amber-600" 
          bgClass="bg-amber-100" 
        />
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <SearchInput 
            value={search} 
            onChange={setSearch} 
            placeholder="Search order #, invoice, buyer, country..." 
          />
          <SelectFilter
            value={country} 
            onChange={setCountry}
            options={[
              { label: 'United Kingdom', value: 'United Kingdom' },
              { label: 'United States', value: 'United States' },
              { label: 'United Arab Emirates', value: 'United Arab Emirates' },
              { label: 'Germany', value: 'Germany' },
              { label: 'Singapore', value: 'Singapore' },
              { label: 'Kenya', value: 'Kenya' },
            ]}
            placeholder="Destination Country"
          />
          <SelectFilter
            value={shippingMode} 
            onChange={setShippingMode}
            options={[
              { label: 'Air Freight', value: 'Air Freight' },
              { label: 'Ocean Cargo', value: 'Ocean Cargo' },
              { label: 'Express Courier', value: 'Express Courier' },
            ]}
            placeholder="Shipping Mode"
          />
          <SelectFilter
            value={status} 
            onChange={setStatus}
            options={[
              { label: 'In Transit', value: 'In Transit' },
              { label: 'Port Departure', value: 'Port Departure' },
              { label: 'Documentation', value: 'Documentation' },
              { label: 'Delivered', value: 'Delivered' },
              { label: 'On Hold', value: 'On Hold' },
            ]}
            placeholder="Status"
          />
        </div>
      </div>

      {/* Main Table or Loading / Empty States */}
      <div className="mb-6">
        <TableCard>
          {isLoading ? (
            <div className="py-16 text-center">
              <RefreshCw className="w-8 h-8 animate-spin text-[#163c78] mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-700">Loading export shipments from PostgreSQL...</p>
            </div>
          ) : error ? (
            <div className="py-12 px-4 text-center">
              <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
              <p className="text-sm font-semibold text-rose-700 mb-2">{error}</p>
              <button
                onClick={fetchOrders}
                className="px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Retry Connection
              </button>
            </div>
          ) : orders.length === 0 ? (
            <div className="py-16 px-6 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-300">
              <Package className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800 mb-1">No Export Orders in Database Yet</h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
                Your PostgreSQL table <code className="font-mono text-slate-700">"ExportOrder"</code> is currently ready and waiting for international orders.
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#163c78] hover:bg-[#112d5a] text-white rounded-xl text-sm font-semibold shadow-sm cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Create First Order
                </button>
                <button
                  onClick={handleSeedSampleData}
                  disabled={isSeeding}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-sm font-semibold cursor-pointer"
                >
                  <Database className="w-4 h-4 text-emerald-600" />
                  {isSeeding ? 'Seeding PostgreSQL...' : 'Seed Sample Global Shipments'}
                </button>
              </div>
            </div>
          ) : (
            <div className="export-orders-table-container">
              <DataTable columns={columns} data={filteredData} />
            </div>
          )}
        </TableCard>
      </div>

      {/* Create Order Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="p-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Create International Export Order</h3>
                <p className="text-xs text-slate-500">Record will be saved directly into PostgreSQL database table</p>
              </div>
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Order # (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. EXP-ORD-2026-007"
                    value={formData.orderNumber}
                    onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#163c78]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Commercial Invoice #</label>
                  <input
                    type="text"
                    placeholder="e.g. EXP-INV-9907"
                    value={formData.invoiceNumber}
                    onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#163c78]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Buyer / Consignee Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apotheke Global Health Ltd"
                    value={formData.buyerName}
                    onChange={(e) => setFormData({ ...formData, buyerName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#163c78]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Destination Country *</label>
                  <select
                    value={formData.destinationCountry}
                    onChange={(e) => setFormData({ ...formData, destinationCountry: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#163c78]"
                  >
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="United States">United States</option>
                    <option value="United Arab Emirates">United Arab Emirates</option>
                    <option value="Germany">Germany</option>
                    <option value="Singapore">Singapore</option>
                    <option value="Kenya">Kenya</option>
                    <option value="Australia">Australia</option>
                    <option value="Canada">Canada</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Port of Loading</label>
                  <input
                    type="text"
                    placeholder="e.g. Nhava Sheva (JNPT), Mumbai"
                    value={formData.portOfLoading}
                    onChange={(e) => setFormData({ ...formData, portOfLoading: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#163c78]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Destination Discharge Port</label>
                  <input
                    type="text"
                    placeholder="e.g. Port of Felixstowe"
                    value={formData.destinationPort}
                    onChange={(e) => setFormData({ ...formData, destinationPort: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#163c78]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Shipping Mode</label>
                  <select
                    value={formData.shippingMode}
                    onChange={(e) => setFormData({ ...formData, shippingMode: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#163c78]"
                  >
                    <option value="Ocean Cargo">Ocean Cargo</option>
                    <option value="Air Freight">Air Freight</option>
                    <option value="Express Courier">Express Courier</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Incoterm</label>
                  <select
                    value={formData.incoterm}
                    onChange={(e) => setFormData({ ...formData, incoterm: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#163c78]"
                  >
                    <option value="CIF">CIF (Cost, Insurance & Freight)</option>
                    <option value="FOB">FOB (Free On Board)</option>
                    <option value="DDP">DDP (Delivered Duty Paid)</option>
                    <option value="CFR">CFR (Cost and Freight)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Container / AWB #</label>
                  <input
                    type="text"
                    placeholder="e.g. MEDU-9481023-7"
                    value={formData.containerOrAwbNo}
                    onChange={(e) => setFormData({ ...formData, containerOrAwbNo: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#163c78]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Order Value ($ USD) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.orderValueUSD}
                    onChange={(e) => {
                      const usd = Number(e.target.value);
                      setFormData({ 
                        ...formData, 
                        orderValueUSD: usd,
                        orderValueINR: Math.round(usd * 83.2)
                      });
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#163c78]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">INR Eqv (₹ Auto-calculated)</label>
                  <input
                    type="number"
                    readOnly
                    value={formData.orderValueINR}
                    className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-lg text-sm text-slate-600 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Customs Clearance</label>
                  <select
                    value={formData.customsStatus}
                    onChange={(e) => setFormData({ ...formData, customsStatus: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#163c78]"
                  >
                    <option value="Cleared">Cleared</option>
                    <option value="Under Inspection">Under Inspection</option>
                    <option value="Documentation Pending">Documentation Pending</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Shipment Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#163c78]"
                  >
                    <option value="In Transit">In Transit</option>
                    <option value="Port Departure">Port Departure</option>
                    <option value="Documentation">Documentation</option>
                    <option value="Delivered">Delivered</option>
                    <option value="On Hold">On Hold</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Items & Formulations Summary</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Amoxicillin 500mg, Paracetamol 650mg (1,200 Cartons)"
                  value={formData.itemsSummary}
                  onChange={(e) => setFormData({ ...formData, itemsSummary: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#163c78]"
                />
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 rounded-b-2xl">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-sm font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-[#163c78] hover:bg-[#112d5a] text-white rounded-lg text-sm font-semibold cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {isSubmitting ? 'Saving to Database...' : 'Save Export Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="p-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{selectedOrder.orderNumber}</h3>
                <p className="text-xs text-slate-500">Commercial Invoice: {selectedOrder.invoiceNumber || 'N/A'} | Incoterm: {selectedOrder.incoterm}</p>
              </div>
              <button 
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-xs font-semibold text-slate-500 block mb-1">Buyer / Consignee</span>
                  <span className="text-sm font-bold text-slate-900 block">{selectedOrder.buyerName}</span>
                  <span className="text-xs text-slate-600">{selectedOrder.destinationCountry}</span>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-xs font-semibold text-slate-500 block mb-1">Commercial Valuation</span>
                  <span className="text-sm font-bold text-slate-900 block">${Number(selectedOrder.orderValueUSD || 0).toLocaleString()} USD</span>
                  <span className="text-xs text-slate-600">₹ {Number(selectedOrder.orderValueINR || 0).toLocaleString()} INR</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-xs font-semibold text-slate-500 block mb-1">Port of Loading</span>
                  <span className="text-sm font-medium text-slate-900">{selectedOrder.portOfLoading || 'Not specified'}</span>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-xs font-semibold text-slate-500 block mb-1">Port of Discharge / Destination</span>
                  <span className="text-sm font-medium text-slate-900">{selectedOrder.destinationPort || 'Not specified'}</span>
                </div>
              </div>

              <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-100">
                <span className="text-xs font-semibold text-blue-900 block mb-1">Items & Formulations</span>
                <p className="text-sm text-blue-950">{selectedOrder.itemsSummary || 'Standard export pharma formulations'}</p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  <span className="text-[11px] font-semibold text-slate-500 block">Shipping Mode</span>
                  <span className="text-xs font-bold text-slate-800 mt-1 block">{selectedOrder.shippingMode}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  <span className="text-[11px] font-semibold text-slate-500 block">Customs Clearance</span>
                  <span className="text-xs font-bold text-slate-800 mt-1 block">{selectedOrder.customsStatus}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  <span className="text-[11px] font-semibold text-slate-500 block">Shipment Status</span>
                  <span className="text-xs font-bold text-slate-800 mt-1 block">{selectedOrder.status}</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
              <button
                onClick={() => handleDeleteOrder(selectedOrder.id)}
                className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              >
                Delete from DB
              </button>
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .export-orders-table-container .overflow-x-auto {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .export-orders-table-container .overflow-x-auto::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
