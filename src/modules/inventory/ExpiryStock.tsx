import { useState, useRef, useEffect, useMemo } from 'react';
import { Download, Filter, AlertCircle, IndianRupee, Clock, ChevronDown, Trash2 } from 'lucide-react';
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
  SummaryCard,
  Drawer,
  DrawerField
} from './components/shared';
import { type Column } from './components/shared';

// --- Deep Mock Data Layer ---
interface RawExpiryStock {
  id: string;
  productName: string;
  sku: string;
  category: string;
  batchNo: string;
  warehouse: string;
  location: string;
  availableQty: number;
  unitCost: number;
  mfgDate: string;
  expiryDate: string;
  isDisposed: boolean;
  createdDate: string;
  lastUpdatedDate: string;
}

// Helper to generate dates relative to "today" for dynamic calculations
const getRelativeDate = (daysDiff: number) => {
  const d = new Date();
  d.setDate(d.getDate() + daysDiff);
  return d.toISOString().split('T')[0];
};

const rawDatabase: RawExpiryStock[] = [
  {
    id: 'EXP-001',
    productName: 'Paracetamol 650mg',
    sku: 'PRD-001',
    category: 'Tablets',
    batchNo: 'B-2024-331',
    warehouse: 'Hyderabad Warehouse',
    location: 'Aisle 1, Rack A',
    availableQty: 800,
    unitCost: 65,
    mfgDate: getRelativeDate(-700), // ~2 years ago
    expiryDate: getRelativeDate(45), // Near Expiry
    isDisposed: false,
    createdDate: getRelativeDate(-700),
    lastUpdatedDate: getRelativeDate(-30),
  },
  {
    id: 'EXP-002',
    productName: 'Cough Syrup 100ml',
    sku: 'PRD-045',
    category: 'Syrups',
    batchNo: 'B-2023-112',
    warehouse: 'Mumbai Warehouse',
    location: 'Aisle 3, Rack C',
    availableQty: 150,
    unitCost: 85,
    mfgDate: getRelativeDate(-800),
    expiryDate: getRelativeDate(-10), // Expired 10 days ago
    isDisposed: false,
    createdDate: getRelativeDate(-800),
    lastUpdatedDate: getRelativeDate(-10),
  },
  {
    id: 'EXP-003',
    productName: 'Eye Drops 5ml',
    sku: 'PRD-092',
    category: 'Drops',
    batchNo: 'B-2024-001',
    warehouse: 'Delhi Warehouse',
    location: 'Cold Storage 2',
    availableQty: 120,
    unitCost: 150,
    mfgDate: getRelativeDate(-400),
    expiryDate: getRelativeDate(15), // Critical
    isDisposed: false,
    createdDate: getRelativeDate(-400),
    lastUpdatedDate: getRelativeDate(-5),
  },
  {
    id: 'EXP-004',
    productName: 'Vitamin D3 Capsules',
    sku: 'PRD-105',
    category: 'Capsules',
    batchNo: 'B-2022-099',
    warehouse: 'Bangalore Warehouse',
    location: 'Dispose Area',
    availableQty: 0,
    unitCost: 200,
    mfgDate: getRelativeDate(-1200),
    expiryDate: getRelativeDate(-100),
    isDisposed: true, // Disposed
    createdDate: getRelativeDate(-1200),
    lastUpdatedDate: getRelativeDate(-2),
  }
];

// --- Calculated Interfaces ---
interface CalculatedExpiryStock extends RawExpiryStock {
  daysToExpiry: number;
  estimatedLoss: number;
  status: 'Critical' | 'Near Expiry' | 'Expired' | 'Disposed';
}

const formatCurrency = (value: number) => {
  if (value >= 10000000) return `₹ ${(value / 10000000).toFixed(2)} Cr`;
  if (value >= 100000) return `₹ ${(value / 100000).toFixed(2)} L`;
  return `₹ ${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
};

export default function ExpiryStock() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  const [selectedRecord, setSelectedRecord] = useState<CalculatedExpiryStock | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // --- Dynamic Calculation Engine ---
  const calculatedData: CalculatedExpiryStock[] = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return rawDatabase.map(item => {
      const expiry = new Date(item.expiryDate);
      expiry.setHours(0, 0, 0, 0);
      
      const diffTime = expiry.getTime() - today.getTime();
      const daysToExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      const estimatedLoss = item.availableQty * item.unitCost;

      // Status Rules Priority: Disposed -> Expired -> Critical -> Near Expiry
      let status: CalculatedExpiryStock['status'] = 'Near Expiry';
      if (item.isDisposed) {
        status = 'Disposed';
      } else if (daysToExpiry < 0) {
        status = 'Expired';
      } else if (daysToExpiry <= 30) {
        status = 'Critical';
      }

      return {
        ...item,
        daysToExpiry,
        estimatedLoss,
        status
      };
    });
  }, []);

  // --- Dashboard Card Metrics ---
  const dashboardMetrics = useMemo(() => {
    let totalExpiringBatches = 0;
    let expiredBatches = 0;
    let expiryStockValue = 0; // Value of near expiry & critical
    let estimatedLoss = 0;    // Value of expired

    calculatedData.forEach(c => {
      if (c.status === 'Critical' || c.status === 'Near Expiry') {
        totalExpiringBatches += 1;
        expiryStockValue += c.estimatedLoss;
      } else if (c.status === 'Expired') {
        expiredBatches += 1;
        estimatedLoss += c.estimatedLoss;
      }
    });

    return {
      totalExpiringBatches,
      expiredBatches,
      expiryStockValue,
      estimatedLoss
    };
  }, [calculatedData]);

  // --- Filtering ---
  const filteredData = calculatedData.filter((item) => {
    const term = search.toLowerCase();
    const matchSearch = item.productName.toLowerCase().includes(term) || 
                        item.sku.toLowerCase().includes(term) || 
                        item.batchNo.toLowerCase().includes(term);
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  const columns: Column<CalculatedExpiryStock>[] = [
    { key: 'productName', label: 'Product Name', render: (row) => <span className="font-semibold text-slate-900">{row.productName}</span> },
    { key: 'sku', label: 'SKU', render: (row) => <span className="font-mono text-slate-500">{row.sku}</span> },
    { key: 'batchNo', label: 'Batch No', render: (row) => <span className="font-mono text-slate-700">{row.batchNo}</span> },
    { key: 'warehouse', label: 'Warehouse' },
    { key: 'availableQty', label: 'Available Qty', render: (row) => <span className="font-bold text-slate-700">{row.availableQty.toLocaleString()}</span> },
    { key: 'mfgDate', label: 'MFG Date', render: (row) => <span className="text-slate-600">{row.mfgDate}</span> },
    { key: 'expiryDate', label: 'Expiry Date', render: (row) => <span className={row.status === 'Expired' || row.status === 'Critical' ? 'text-rose-600 font-medium' : 'text-slate-800'}>{row.expiryDate}</span> },
    { key: 'daysToExpiry', label: 'Days To Expiry', render: (row) => <span className="font-medium text-slate-800">{row.daysToExpiry < 0 ? 'Expired' : `${row.daysToExpiry} Days`}</span> },
    { key: 'estimatedLoss', label: 'Estimated Loss', render: (row) => <span className="font-bold text-slate-800">₹ {row.estimatedLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span> },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        let variant: 'success' | 'warning' | 'danger' | 'neutral' | 'info' | 'purple' = 'neutral';
        if (row.status === 'Critical') variant = 'danger';
        if (row.status === 'Near Expiry') variant = 'warning';
        if (row.status === 'Expired') variant = 'neutral'; // Usually a dark neutral or red, but let's use dark red if possible. Will use danger.
        if (row.status === 'Disposed') variant = 'success';
        
        // Custom styling mapping
        if (row.status === 'Expired') variant = 'danger'; // Keep danger for expired
        
        return <Badge variant={variant as any}>{row.status}</Badge>;
      },
    },
    {
      key: 'id',
      label: 'Actions',
      render: (row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSelectedRecord(row);
          }}
          className="text-violet-600 font-medium hover:text-violet-800"
        >
          View
        </button>
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
      'Product Name': row.productName,
      'SKU': row.sku,
      'Batch No': row.batchNo,
      'Warehouse': row.warehouse,
      'Available Qty': row.availableQty,
      'MFG Date': row.mfgDate,
      'Expiry Date': row.expiryDate,
      'Days To Expiry': row.daysToExpiry < 0 ? 'Expired' : row.daysToExpiry,
      'Estimated Loss': row.estimatedLoss,
      'Status': row.status
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Expiry Stock Tracking');
    
    const fileName = `expiry_stock_tracking_${getFormattedDate()}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    setShowExportMenu(false);
  };

  const handleExportCSV = () => {
    const headers = [
      'Product Name', 'SKU', 'Batch No', 'Warehouse', 'Available Qty', 
      'MFG Date', 'Expiry Date', 'Days To Expiry', 'Estimated Loss', 'Status'
    ];
    const csvContent = [
      headers.join(','),
      ...filteredData.map(row => 
        [
          `"${row.productName}"`,
          `"${row.sku}"`,
          `"${row.batchNo}"`,
          `"${row.warehouse}"`,
          row.availableQty, 
          row.mfgDate,
          row.expiryDate,
          row.daysToExpiry < 0 ? 'Expired' : row.daysToExpiry,
          row.estimatedLoss,
          row.status
        ].join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    const fileName = `expiry_stock_tracking_${getFormattedDate()}.csv`;
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportMenu(false);
  };

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Expiry Stock Tracking"
        subtitle="Monitor expired batches and items nearing expiration."
        actions={
          <div className="relative inline-block text-left" ref={exportMenuRef}>
            <ActionButton 
              variant="secondary" 
              icon={<Download className="w-4 h-4" />}
              onClick={() => setShowExportMenu(!showExportMenu)}
            >
              Export Report
              <ChevronDown className="w-3 h-3 ml-1" />
            </ActionButton>
            
            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                <div className="py-1" role="menu" aria-orientation="vertical">
                  <button
                    onClick={handleExportExcel}
                    className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                    role="menuitem"
                  >
                    Export as Excel (.xlsx)
                  </button>
                  <button
                    onClick={handleExportCSV}
                    className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                    role="menuitem"
                  >
                    Export as CSV (.csv)
                  </button>
                </div>
              </div>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <SummaryCard
          title="Total Expiring Batches"
          value={dashboardMetrics.totalExpiringBatches.toString()}
          subtitle="Within threshold"
          icon={<Clock className="w-6 h-6" />}
          colorClass="text-amber-600"
          bgClass="bg-amber-50"
        />
        <SummaryCard
          title="Expired Batches"
          value={dashboardMetrics.expiredBatches.toString()}
          subtitle="Past expiry date"
          icon={<AlertCircle className="w-6 h-6" />}
          colorClass="text-rose-600"
          bgClass="bg-rose-50"
        />
        <SummaryCard
          title="Expiry Stock Value"
          value={formatCurrency(dashboardMetrics.expiryStockValue)}
          subtitle="Value nearing expiry"
          icon={<IndianRupee className="w-6 h-6" />}
          colorClass="text-violet-600"
          bgClass="bg-violet-50"
        />
        <SummaryCard
          title="Estimated Loss"
          value={formatCurrency(dashboardMetrics.estimatedLoss)}
          subtitle="Value of expired stock"
          icon={<Trash2 className="w-6 h-6" />}
          colorClass="text-slate-600"
          bgClass="bg-slate-100"
        />
      </div>

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search product, SKU or batch..." />
        <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-600">Filters:</span>
        </div>
        <SelectFilter
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { label: 'Critical', value: 'Critical' },
            { label: 'Near Expiry', value: 'Near Expiry' },
            { label: 'Expired', value: 'Expired' },
            { label: 'Disposed', value: 'Disposed' },
          ]}
          placeholder="All Status"
        />
      </FilterBar>

      <TableCard>
        <div className="overflow-x-auto">
          <DataTable
            columns={columns}
            data={filteredData}
            emptyMessage="No expiry issues found. Great job!"
          />
        </div>
      </TableCard>

      {/* Expiry Stock Details Drawer */}
      <Drawer
        open={!!selectedRecord}
        onClose={() => setSelectedRecord(null)}
        title="Expiry Stock Details"
      >
        {selectedRecord && (
          <div className="space-y-6">
            
            {/* Product Information */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Product Information</h3>
              <div className="space-y-2">
                <DrawerField label="Product Name" value={selectedRecord.productName} />
                <DrawerField label="SKU" value={<span className="font-mono text-slate-600">{selectedRecord.sku}</span>} />
                <DrawerField label="Category" value={selectedRecord.category} />
                <DrawerField label="Status" value={
                  <Badge variant={selectedRecord.status === 'Critical' || selectedRecord.status === 'Expired' ? 'danger' : selectedRecord.status === 'Near Expiry' ? 'warning' : 'success'}>
                    {selectedRecord.status}
                  </Badge>
                } />
              </div>
            </div>

            {/* Batch Information */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Batch Information</h3>
              <div className="space-y-2">
                <DrawerField label="Batch Number" value={<span className="font-mono text-slate-700 bg-slate-50 px-2 py-1 rounded border border-slate-100">{selectedRecord.batchNo}</span>} />
                <DrawerField label="Manufacturing Date" value={selectedRecord.mfgDate} />
                <DrawerField label="Expiry Date" value={<span className={selectedRecord.status === 'Expired' || selectedRecord.status === 'Critical' ? 'text-rose-600 font-semibold' : ''}>{selectedRecord.expiryDate}</span>} />
                <div className="pt-2">
                  <DrawerField label="Days To Expiry" value={
                    <span className={`text-lg font-bold ${selectedRecord.daysToExpiry < 0 ? 'text-rose-600' : 'text-amber-600'}`}>
                      {selectedRecord.daysToExpiry < 0 ? 'Expired' : `${selectedRecord.daysToExpiry} Days`}
                    </span>
                  } />
                </div>
              </div>
            </div>

            {/* Inventory Information */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Inventory Information</h3>
              <div className="space-y-2">
                <DrawerField label="Warehouse" value={selectedRecord.warehouse} />
                <DrawerField label="Location / Bin" value={selectedRecord.location} />
                <DrawerField label="Available Quantity" value={<span className="font-semibold text-slate-900">{selectedRecord.availableQty.toLocaleString()}</span>} />
              </div>
            </div>

            {/* Financial Information */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Financial Information</h3>
              <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Unit Cost</span>
                  <span className="font-semibold text-slate-900">₹ {selectedRecord.unitCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center text-sm pt-2 border-t border-slate-200">
                  <span className="font-medium text-slate-700">Estimated Loss</span>
                  <span className="text-lg font-bold text-rose-600">₹ {selectedRecord.estimatedLoss.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            {/* Audit Information */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Audit Information</h3>
              <div className="space-y-2">
                <DrawerField label="Created Date" value={selectedRecord.createdDate} />
                <DrawerField label="Last Updated Date" value={selectedRecord.lastUpdatedDate} />
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
              <ActionButton variant="secondary" onClick={() => setSelectedRecord(null)}>Close</ActionButton>
            </div>
          </div>
        )}
      </Drawer>

    </div>
  );
}
