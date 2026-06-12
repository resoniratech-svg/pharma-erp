import { useState, useRef, useEffect, useMemo } from 'react';
import { Download, Filter, Building2, IndianRupee, PackageCheck, Bookmark, ChevronDown } from 'lucide-react';
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

// --- Deep Mock Data Layer (Simulating Database Relationships) ---
interface MockBatch {
  batchNo: string;
  warehouse: string;
  quantity: number;
  reserved: number;
  cost: number;
  isNearExpiry: boolean;
  isExpired: boolean;
}

interface MockProduct {
  name: string;
  batches: MockBatch[];
}

interface MockCompany {
  id: string;
  companyName: string;
  companyCode: string;
  products: MockProduct[];
  createdDate: string;
  lastUpdatedDate: string;
}

const rawDatabase: MockCompany[] = [
  {
    id: 'C001',
    companyName: 'PharmaCorp Inc.',
    companyCode: 'PHARMA-INC',
    createdDate: '12-Jan-2025',
    lastUpdatedDate: '14-Oct-2026',
    products: [
      {
        name: 'Paracetamol 650mg',
        batches: [
          { batchNo: 'B-2026-01', warehouse: 'Hyderabad Warehouse', quantity: 50000, reserved: 5000, cost: 15, isNearExpiry: false, isExpired: false },
          { batchNo: 'B-2026-02', warehouse: 'Mumbai Warehouse', quantity: 20000, reserved: 2000, cost: 15, isNearExpiry: true, isExpired: false },
        ]
      },
      {
        name: 'Cough Syrup 100ml',
        batches: [
          { batchNo: 'B-2026-03', warehouse: 'Hyderabad Warehouse', quantity: 84000, reserved: 10000, cost: 85, isNearExpiry: false, isExpired: false },
        ]
      }
    ]
  },
  {
    id: 'C002',
    companyName: 'HealthPlus Labs',
    companyCode: 'HEALTH-LABS',
    createdDate: '05-Mar-2025',
    lastUpdatedDate: '12-Oct-2026',
    products: [
      {
        name: 'Vitamin C 1000mg',
        batches: [
          { batchNo: 'B-2026-04', warehouse: 'Delhi Warehouse', quantity: 45000, reserved: 15000, cost: 35, isNearExpiry: false, isExpired: false },
        ]
      }
    ]
  },
  {
    id: 'C003',
    companyName: 'MediCare Pharma',
    companyCode: 'MEDICARE',
    createdDate: '18-Aug-2025',
    lastUpdatedDate: '10-Oct-2026',
    products: [
      {
        name: 'Ibuprofen 400mg',
        batches: [
          { batchNo: 'B-2025-99', warehouse: 'Bangalore Warehouse', quantity: 12000, reserved: 1000, cost: 22, isNearExpiry: true, isExpired: false },
        ]
      }
    ]
  },
  {
    id: 'C004',
    companyName: 'VitaLife Sciences',
    companyCode: 'VITALIFE',
    createdDate: '22-Sep-2025',
    lastUpdatedDate: '01-Oct-2026',
    products: [
      {
        name: 'Zinc Supplements',
        batches: [
          { batchNo: 'B-2024-01', warehouse: 'Delhi Warehouse', quantity: 0, reserved: 0, cost: 50, isNearExpiry: false, isExpired: true },
        ]
      }
    ]
  }
];

// --- Calculated Interfaces ---
interface CalculatedCompany {
  id: string;
  companyName: string;
  companyCode: string;
  productCount: number;
  availableQty: number;
  reservedQty: number;
  stockValue: number;
  warehouses: number;
  activeBatches: number;
  nearExpiryQty: number;
  nearExpiryBatchesCount: number;
  expiredBatchesCount: number;
  warehouseSummary: { name: string; qty: number }[];
  productSummary: { name: string; qty: number; activeBatches: number }[];
  status: 'Active' | 'Inactive';
  createdDate: string;
  lastUpdatedDate: string;
}

const formatCurrency = (value: number) => {
  if (value >= 10000000) return `₹ ${(value / 10000000).toFixed(2)} Cr`;
  if (value >= 100000) return `₹ ${(value / 100000).toFixed(2)} L`;
  return `₹ ${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
};

export default function CompanyWiseInventoryTracking() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  const [selectedRecord, setSelectedRecord] = useState<CalculatedCompany | null>(null);

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
  const calculatedData: CalculatedCompany[] = useMemo(() => {
    return rawDatabase.map(company => {
      let availableQty = 0;
      let reservedQty = 0;
      let stockValue = 0;
      let activeBatches = 0;
      let nearExpiryQty = 0;
      let nearExpiryBatchesCount = 0;
      let expiredBatchesCount = 0;
      
      const warehouseMap: Record<string, number> = {};
      const productSummary: { name: string; qty: number; activeBatches: number }[] = [];

      company.products.forEach(prod => {
        let prodQty = 0;
        let prodActiveBatches = 0;

        prod.batches.forEach(batch => {
          availableQty += batch.quantity;
          reservedQty += batch.reserved;
          stockValue += (batch.quantity * batch.cost);
          
          if (batch.quantity > 0 && !batch.isExpired) {
            activeBatches += 1;
            prodActiveBatches += 1;
          }
          if (batch.isNearExpiry) {
            nearExpiryQty += batch.quantity;
            nearExpiryBatchesCount += 1;
          }
          if (batch.isExpired) {
            expiredBatchesCount += 1;
          }

          if (batch.quantity > 0) {
            warehouseMap[batch.warehouse] = (warehouseMap[batch.warehouse] || 0) + batch.quantity;
          }
          
          prodQty += batch.quantity;
        });

        productSummary.push({ name: prod.name, qty: prodQty, activeBatches: prodActiveBatches });
      });

      const warehouseSummary = Object.entries(warehouseMap).map(([name, qty]) => ({ name, qty }));

      return {
        id: company.id,
        companyName: company.companyName,
        companyCode: company.companyCode,
        productCount: company.products.length,
        availableQty,
        reservedQty,
        stockValue,
        warehouses: warehouseSummary.length,
        activeBatches,
        nearExpiryQty,
        nearExpiryBatchesCount,
        expiredBatchesCount,
        warehouseSummary,
        productSummary,
        status: availableQty > 0 ? 'Active' : 'Inactive',
        createdDate: company.createdDate,
        lastUpdatedDate: company.lastUpdatedDate
      };
    });
  }, []);

  // --- Dashboard Card Metrics ---
  const dashboardMetrics = useMemo(() => {
    const totalCompanies = new Set(calculatedData.filter(c => c.availableQty > 0).map(c => c.id)).size;
    const totalStockValue = calculatedData.reduce((acc, curr) => acc + curr.stockValue, 0);
    const totalAvailableStock = calculatedData.reduce((acc, curr) => acc + curr.availableQty, 0);
    const totalReservedStock = calculatedData.reduce((acc, curr) => acc + curr.reservedQty, 0);

    return {
      totalCompanies,
      totalStockValue,
      totalAvailableStock,
      totalReservedStock
    };
  }, [calculatedData]);

  // --- Filtering ---
  const filteredData = calculatedData.filter((item) => {
    const matchSearch = item.companyName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  const columns: Column<CalculatedCompany>[] = [
    { key: 'companyName', label: 'Company Name', render: (row) => <span className="font-semibold text-slate-900">{row.companyName}</span> },
    { key: 'productCount', label: 'Product Count', render: (row) => <span className="font-mono text-slate-700">{row.productCount}</span> },
    { key: 'availableQty', label: 'Available Qty', render: (row) => <span className="font-mono text-slate-700">{row.availableQty.toLocaleString()}</span> },
    { key: 'stockValue', label: 'Stock Value', render: (row) => <span className="font-bold text-slate-800">{formatCurrency(row.stockValue)}</span> },
    { key: 'warehouses', label: 'Warehouses', render: (row) => <span className="text-slate-700">{row.warehouses} Locations</span> },
    { key: 'activeBatches', label: 'Active Batches', render: (row) => <span className="text-slate-700">{row.activeBatches}</span> },
    { key: 'nearExpiryQty', label: 'Near Expiry Qty', render: (row) => <span className={`font-medium ${row.nearExpiryQty > 0 ? 'text-amber-600' : 'text-slate-500'}`}>{row.nearExpiryQty.toLocaleString()}</span> },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const variant = row.status === 'Active' ? 'success' : 'danger';
        return <Badge variant={variant}>{row.status}</Badge>;
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
      'Company Name': row.companyName,
      'Product Count': row.productCount,
      'Available Qty': row.availableQty,
      'Stock Value': row.stockValue,
      'Warehouses': row.warehouses,
      'Active Batches': row.activeBatches,
      'Near Expiry Qty': row.nearExpiryQty,
      'Status': row.status
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Company Wise Inventory');
    
    const fileName = `company_wise_inventory_${getFormattedDate()}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    setShowExportMenu(false);
  };

  const handleExportCSV = () => {
    const headers = ['Company Name', 'Product Count', 'Available Qty', 'Stock Value', 'Warehouses', 'Active Batches', 'Near Expiry Qty', 'Status'];
    const csvContent = [
      headers.join(','),
      ...filteredData.map(row => 
        [
          `"${row.companyName}"`,
          row.productCount, 
          row.availableQty, 
          row.stockValue, 
          row.warehouses, 
          row.activeBatches, 
          row.nearExpiryQty, 
          row.status
        ].join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    const fileName = `company_wise_inventory_${getFormattedDate()}.csv`;
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
        title="Company-wise Inventory Tracking"
        subtitle="Monitor inventory company-wise across all products, warehouses, and stock locations."
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
          title="Total Companies"
          value={dashboardMetrics.totalCompanies.toString()}
          subtitle="Companies with active inventory"
          icon={<Building2 className="w-6 h-6" />}
          colorClass="text-violet-600"
          bgClass="bg-violet-50"
        />
        <SummaryCard
          title="Total Stock Value"
          value={formatCurrency(dashboardMetrics.totalStockValue)}
          subtitle="Across all companies"
          icon={<IndianRupee className="w-6 h-6" />}
          colorClass="text-emerald-600"
          bgClass="bg-emerald-50"
        />
        <SummaryCard
          title="Available Stock"
          value={`${(dashboardMetrics.totalAvailableStock / 1000).toFixed(1)}k`}
          subtitle="Units ready for dispatch"
          icon={<PackageCheck className="w-6 h-6" />}
          colorClass="text-blue-600"
          bgClass="bg-blue-50"
        />
        <SummaryCard
          title="Reserved Stock"
          value={`${(dashboardMetrics.totalReservedStock / 1000).toFixed(1)}k`}
          subtitle="Units locked in orders"
          icon={<Bookmark className="w-6 h-6" />}
          colorClass="text-amber-600"
          bgClass="bg-amber-50"
        />
      </div>

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search companies..." />
        <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-600">Filters:</span>
        </div>
        <SelectFilter
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { label: 'Active', value: 'Active' },
            { label: 'Inactive', value: 'Inactive' },
          ]}
          placeholder="All Status"
        />
      </FilterBar>

      <TableCard>
        <div className="overflow-x-auto">
          <DataTable
            columns={columns}
            data={filteredData}
            emptyMessage="No companies found matching criteria."
          />
        </div>
      </TableCard>

      {/* Company Inventory Details Drawer */}
      <Drawer
        open={!!selectedRecord}
        onClose={() => setSelectedRecord(null)}
        title="Company Inventory Details"
      >
        {selectedRecord && (
          <div className="space-y-6">
            
            {/* Company Information */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Company Information</h3>
              <div className="space-y-2">
                <DrawerField label="Company Name" value={selectedRecord.companyName} />
                <DrawerField label="Company Code" value={<span className="font-mono text-violet-700 bg-violet-50 px-2 py-1 rounded">{selectedRecord.companyCode}</span>} />
                <DrawerField label="Status" value={<Badge variant={selectedRecord.status === 'Active' ? 'success' : 'danger'}>{selectedRecord.status}</Badge>} />
              </div>
            </div>

            {/* Inventory Summary */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Inventory Summary</h3>
              <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Product Count</span>
                  <span className="font-semibold text-slate-900">{selectedRecord.productCount}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Available Quantity</span>
                  <span className="font-semibold text-slate-900">{selectedRecord.availableQty.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Reserved Quantity</span>
                  <span className="font-semibold text-slate-900">{selectedRecord.reservedQty.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-sm pt-2 border-t border-slate-200">
                  <span className="font-medium text-slate-700">Total Stock Value</span>
                  <span className="text-lg font-bold text-emerald-600">{formatCurrency(selectedRecord.stockValue)}</span>
                </div>
              </div>
            </div>

            {/* Warehouse Summary */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Warehouse Summary</h3>
              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-2">Warehouse</th>
                      <th className="px-3 py-2 text-right">Available Qty</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedRecord.warehouseSummary.map(wh => (
                      <tr key={wh.name}>
                        <td className="px-3 py-2 font-medium text-slate-900">{wh.name}</td>
                        <td className="px-3 py-2 text-right font-medium">{wh.qty.toLocaleString()}</td>
                      </tr>
                    ))}
                    {selectedRecord.warehouseSummary.length === 0 && (
                      <tr>
                        <td colSpan={2} className="px-3 py-4 text-center text-slate-500 text-sm">No warehouse stock found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Batch Summary */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Batch Summary</h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-lg text-center">
                  <div className="text-xs text-emerald-600 font-semibold mb-1 uppercase tracking-wider">Active</div>
                  <div className="text-xl font-bold text-emerald-700">{selectedRecord.activeBatches}</div>
                </div>
                <div className="bg-amber-50 border border-amber-100 p-3 rounded-lg text-center">
                  <div className="text-xs text-amber-600 font-semibold mb-1 uppercase tracking-wider">Near Expiry</div>
                  <div className="text-xl font-bold text-amber-700">{selectedRecord.nearExpiryBatchesCount}</div>
                </div>
                <div className="bg-rose-50 border border-rose-100 p-3 rounded-lg text-center">
                  <div className="text-xs text-rose-600 font-semibold mb-1 uppercase tracking-wider">Expired</div>
                  <div className="text-xl font-bold text-rose-700">{selectedRecord.expiredBatchesCount}</div>
                </div>
              </div>
            </div>

            {/* Product Summary */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Product Summary</h3>
              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-2">Product Name</th>
                      <th className="px-3 py-2 text-right">Available Qty</th>
                      <th className="px-3 py-2 text-right">Active Batches</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedRecord.productSummary.map(prod => (
                      <tr key={prod.name}>
                        <td className="px-3 py-2 font-medium text-slate-900">{prod.name}</td>
                        <td className="px-3 py-2 text-right font-medium">{prod.qty.toLocaleString()}</td>
                        <td className="px-3 py-2 text-right">{prod.activeBatches}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
