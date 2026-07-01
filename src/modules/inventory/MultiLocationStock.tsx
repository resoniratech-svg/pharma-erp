import { useState, useRef, useEffect } from 'react';
import { Download, Plus, ChevronDown, Filter } from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  PageHeader,
  FilterBar,
  SearchInput,
  SelectFilter,
  ActionButton,
  TableCard,
  DataTable,
  Badge
} from './components/shared';
import { type Column } from './components/shared';

// --- Data Models ---

interface Product {
  name: string;
  sku: string;
  reorderLevel: number;
}

interface Location {
  code: string;
  name: string;
  city: string;
  state: string;
  type: string;
  status: 'Active' | 'Inactive';
}

interface InventoryRecord {
  id: string;
  productName: string;
  sku: string;
  location: string;
  availableQty: number;
  reorderLevel: number;
  status: 'In Stock' | 'Low Stock' | 'Out Of Stock';
}

const mockProducts: Product[] = [
  { name: 'Paracetamol 650mg', sku: 'PRD-001', reorderLevel: 1000 },
  { name: 'Amoxicillin 500mg', sku: 'PRD-002', reorderLevel: 500 },
];

const initialLocations: Location[] = [
  { code: 'HYD001', name: 'Hyderabad Warehouse', city: 'Hyderabad', state: 'Telangana', type: 'Central Warehouse', status: 'Active' },
  { code: 'MUM001', name: 'Mumbai Warehouse', city: 'Mumbai', state: 'Maharashtra', type: 'Regional Warehouse', status: 'Active' },
  { code: 'DEL001', name: 'Delhi Warehouse', city: 'Delhi', state: 'Delhi', type: 'Distribution Center', status: 'Active' },
];

// Mapping: `${SKU}_${LocationCode}` -> quantity
const initialInventoryMap: Record<string, number> = {
  'PRD-001_HYD001': 5000,
  'PRD-001_MUM001': 2000,
  'PRD-001_DEL001': 500,
  'PRD-002_HYD001': 1200,
  'PRD-002_MUM001': 0,
  'PRD-002_DEL001': 1500,
};

export default function MultiLocationStock() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [locations, setLocations] = useState<Location[]>(initialLocations);
  const [products] = useState<Product[]>(mockProducts);
  const [inventoryMap] = useState<Record<string, number>>(initialInventoryMap);

  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  const [newLocation, setNewLocation] = useState<Location>({
    code: '',
    name: '',
    city: '',
    state: '',
    type: 'Central Warehouse',
    status: 'Active'
  });

  // Handle clicking outside export menu to close it
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute flattened table data
  const computeTableData = (): InventoryRecord[] => {
    const data: InventoryRecord[] = [];
    products.forEach(product => {
      locations.forEach(location => {
        const qty = inventoryMap[`${product.sku}_${location.code}`] || 0;
        let status: 'In Stock' | 'Low Stock' | 'Out Of Stock' = 'In Stock';
        if (qty === 0) status = 'Out Of Stock';
        else if (qty <= product.reorderLevel) status = 'Low Stock';
        
        data.push({
          id: `${product.sku}_${location.code}`,
          productName: product.name,
          sku: product.sku,
          location: location.name,
          availableQty: qty,
          reorderLevel: product.reorderLevel,
          status: status
        });
      });
    });
    return data;
  };

  const tableData = computeTableData();

  const filteredData = tableData.filter((item) => {
    const matchesSearch = item.productName.toLowerCase().includes(search.toLowerCase()) || 
                          item.sku.toLowerCase().includes(search.toLowerCase()) ||
                          item.location.toLowerCase().includes(search.toLowerCase());
                          
    const matchesStatus = statusFilter ? item.status === statusFilter : true;

    return matchesSearch && matchesStatus;
  });

  const columns: Column<InventoryRecord>[] = [
    { key: 'productName', label: 'Product Name', render: (row) => <span className="font-semibold text-slate-900">{row.productName}</span> },
    { key: 'sku', label: 'SKU', render: (row) => <span className="text-slate-600">{row.sku}</span> },
    { key: 'location', label: 'Location' },
    { key: 'availableQty', label: 'Available Qty', render: (row) => <span className="font-medium text-slate-900">{row.availableQty}</span> },
    { key: 'reorderLevel', label: 'Reorder Level', render: (row) => <span className="text-slate-500">{row.reorderLevel}</span> },
    { 
      key: 'status', 
      label: 'Status', 
      render: (row) => {
        const variant = row.status === 'In Stock' ? 'success' : row.status === 'Low Stock' ? 'warning' : 'danger';
        return <Badge variant={variant}>{row.status}</Badge>;
      } 
    },
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
      'Location': row.location,
      'Available Qty': row.availableQty,
      'Reorder Level': row.reorderLevel,
      'Status': row.status
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventory');
    
    const fileName = `multi_location_inventory_${getFormattedDate()}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    setShowExportMenu(false);
  };

  const handleExportCSV = () => {
    const headers = ['Product Name', 'SKU', 'Location', 'Available Qty', 'Reorder Level', 'Status'];
    const csvContent = [
      headers.join(','),
      ...filteredData.map(row => 
        [
          `"${row.productName}"`, 
          row.sku, 
          `"${row.location}"`, 
          row.availableQty, 
          row.reorderLevel, 
          row.status
        ].join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    const fileName = `multi_location_inventory_${getFormattedDate()}.csv`;
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportMenu(false);
  };

  const openAddLocationModal = () => {
    setNewLocation({
      code: '',
      name: '',
      city: '',
      state: '',
      type: 'Central Warehouse',
      status: 'Active'
    });
    setShowLocationModal(true);
  };

  const handleSaveLocation = () => {
    if (!newLocation.code || !newLocation.name || !newLocation.city || !newLocation.state || !newLocation.type || !newLocation.status) {
      alert("Please fill all mandatory fields.");
      return;
    }

    const codeExists = locations.some(loc => loc.code.toLowerCase() === newLocation.code.toLowerCase());
    if (codeExists) {
      alert("Location Code must be unique.");
      return;
    }

    const nameExists = locations.some(loc => loc.name.toLowerCase() === newLocation.name.toLowerCase());
    if (nameExists) {
      alert("Location Name must be unique.");
      return;
    }

    setLocations([...locations, { ...newLocation }]);
    setShowLocationModal(false);
  };

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Multi-Location Inventory Management"
        subtitle="Track inventory levels across all registered warehouses and branches."
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
            <ActionButton icon={<Plus className="w-4 h-4" />} onClick={openAddLocationModal}>
              Add Location
            </ActionButton>
          </>
        }
      />

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search product, SKU or location..." />
        
        <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-600">Filters:</span>
        </div>

        <SelectFilter
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { label: 'In Stock', value: 'In Stock' },
            { label: 'Low Stock', value: 'Low Stock' },
            { label: 'Out Of Stock', value: 'Out Of Stock' },
          ]}
          placeholder="All Status"
        />
      </FilterBar>

      <TableCard>
        <DataTable
          columns={columns}
          data={filteredData}
          emptyMessage="No location stock data found."
        />
      </TableCard>

      {/* Add Location Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">Add Location</h2>
              <button onClick={() => setShowLocationModal(false)} className="text-slate-500 hover:text-slate-800">✕</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Location Code *</label>
                <input 
                  type="text"
                  value={newLocation.code} 
                  onChange={(e) => setNewLocation({ ...newLocation, code: e.target.value })} 
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 uppercase" 
                  placeholder="e.g. WH001"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Location Name *</label>
                <input 
                  type="text"
                  value={newLocation.name} 
                  onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })} 
                  className="w-full border border-slate-200 rounded-lg px-3 py-2" 
                  placeholder="e.g. Hyderabad Warehouse"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">City *</label>
                <input 
                  type="text"
                  value={newLocation.city} 
                  onChange={(e) => setNewLocation({ ...newLocation, city: e.target.value })} 
                  className="w-full border border-slate-200 rounded-lg px-3 py-2" 
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">State *</label>
                <input 
                  type="text"
                  value={newLocation.state} 
                  onChange={(e) => setNewLocation({ ...newLocation, state: e.target.value })} 
                  className="w-full border border-slate-200 rounded-lg px-3 py-2" 
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Type *</label>
                <select 
                  value={newLocation.type} 
                  onChange={(e) => setNewLocation({ ...newLocation, type: e.target.value })} 
                  className="w-full border border-slate-200 rounded-lg px-3 py-2"
                >
                  <option value="Central Warehouse">Central Warehouse</option>
                  <option value="Regional Warehouse">Regional Warehouse</option>
                  <option value="Branch Warehouse">Branch Warehouse</option>
                  <option value="Distribution Center">Distribution Center</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Status *</label>
                <select 
                  value={newLocation.status} 
                  onChange={(e) => setNewLocation({ ...newLocation, status: e.target.value as any })} 
                  className="w-full border border-slate-200 rounded-lg px-3 py-2"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-100">
              <ActionButton variant="secondary" onClick={() => setShowLocationModal(false)}>Cancel</ActionButton>
              <ActionButton onClick={handleSaveLocation}>Save</ActionButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
