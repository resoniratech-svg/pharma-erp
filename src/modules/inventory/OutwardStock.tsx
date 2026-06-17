import { useState, useRef, useEffect, useMemo } from 'react';
import { Plus, Download, Filter, ChevronDown, Trash2 } from 'lucide-react';
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
  DrawerField
} from './components/shared';
import { type Column } from './components/shared';

// --- Data Models ---

interface DispatchLineItem {
  id: string;
  product: string;
  batchNo: string;
  availableQty: number;
  dispatchQty: number;
  rate: number;
}

interface Outward {
  id: string;
  dispatchNo: string;
  date: string;
  client: string;
  location: string;
  referenceNumber?: string;
  itemsCount: number;
  totalQuantity: number;
  totalValue: number;
  status: 'Draft' | 'Processing' | 'Dispatched' | 'Cancelled';
  products: DispatchLineItem[];
  createdBy: string;
  createdDate: string;
  lastUpdatedBy: string;
  lastUpdatedDate: string;
}

const mockData: Outward[] = [
  { 
    id: '1', 
    dispatchNo: 'OUT-2026-001', 
    date: '2026-10-14', 
    client: 'Apollo Hospitals', 
    location: 'Hyderabad Warehouse',
    referenceNumber: 'SO-2026-001',
    itemsCount: 2, 
    totalQuantity: 2000,
    totalValue: 245000, 
    status: 'Dispatched',
    products: [
      { id: 'p1', product: 'Paracetamol 650mg', batchNo: 'B-2026-01', availableQty: 5000, dispatchQty: 1000, rate: 120 },
      { id: 'p2', product: 'Amoxicillin 500mg', batchNo: 'B-2026-02', availableQty: 2000, dispatchQty: 1000, rate: 125 }
    ],
    createdBy: 'Admin User',
    createdDate: '14-Oct-2026',
    lastUpdatedBy: 'Admin User',
    lastUpdatedDate: '14-Oct-2026'
  },
  { 
    id: '2', 
    dispatchNo: 'OUT-2026-002', 
    date: '2026-10-14', 
    client: 'Care Pharmacy', 
    location: 'Mumbai Warehouse',
    itemsCount: 1, 
    totalQuantity: 500,
    totalValue: 18500, 
    status: 'Processing',
    products: [
      { id: 'p3', product: 'Vitamin C 1000mg', batchNo: 'B-2026-03', availableQty: 1000, dispatchQty: 500, rate: 37 }
    ],
    createdBy: 'System User',
    createdDate: '14-Oct-2026',
    lastUpdatedBy: 'Dispatch Dept',
    lastUpdatedDate: '14-Oct-2026'
  },
];

const MOCK_CLIENTS = ['Apollo Hospitals', 'Care Pharmacy', 'City Clinic'];
const MOCK_LOCATIONS = ['Hyderabad Warehouse', 'Mumbai Warehouse', 'Bangalore Warehouse', 'Delhi Warehouse'];
const MOCK_PRODUCTS = ['Paracetamol 650mg', 'Amoxicillin 500mg', 'Vitamin C 1000mg', 'Cough Syrup 100ml'];

// Mock Batch Database for cross-referencing Available Qty & Rate
const MOCK_BATCHES: Record<string, { batchNo: string, availableQty: number, rate: number }[]> = {
  'Paracetamol 650mg': [
    { batchNo: 'B-2026-01', availableQty: 5000, rate: 120 },
    { batchNo: 'B-2026-11', availableQty: 1500, rate: 120 }
  ],
  'Amoxicillin 500mg': [
    { batchNo: 'B-2026-02', availableQty: 2000, rate: 125 }
  ],
  'Vitamin C 1000mg': [
    { batchNo: 'B-2026-03', availableQty: 1000, rate: 37 }
  ],
  'Cough Syrup 100ml': [
    { batchNo: 'B-2026-04', availableQty: 800, rate: 85 }
  ]
};

export default function OutwardStock() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  const [outwardRecords, setOutwardRecords] = useState<Outward[]>(mockData);

  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<Outward | null>(null);

  // Create Dispatch Form State
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    client: '',
    location: '',
    referenceNumber: '',
    status: 'Processing' as Outward['status'],
  });

  const [formProducts, setFormProducts] = useState<DispatchLineItem[]>([]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredData = outwardRecords.filter((item) => {
    const matchSearch = item.dispatchNo.toLowerCase().includes(search.toLowerCase()) || item.client.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  const columns: Column<Outward>[] = [
    { key: 'dispatchNo', label: 'Dispatch Number', render: (row) => <span className="font-semibold text-violet-700">{row.dispatchNo}</span> },
    { key: 'date', label: 'Outward Date' },
    { key: 'client', label: 'Client / Buyer', render: (row) => <span className="font-medium text-slate-800">{row.client}</span> },
    { key: 'location', label: 'Location' },
    { key: 'itemsCount', label: 'Total Items' },
    { key: 'totalQuantity', label: 'Total Quantity', render: (row) => row.totalQuantity.toLocaleString() },
    { key: 'totalValue', label: 'Total Value', render: (row) => `₹${row.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        let variant: 'success' | 'warning' | 'danger' | 'neutral' | 'info' = 'neutral';
        if (row.status === 'Dispatched') variant = 'success';
        if (row.status === 'Processing') variant = 'info';
        if (row.status === 'Cancelled') variant = 'danger';
        if (row.status === 'Draft') variant = 'warning';
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
      'Dispatch Number': row.dispatchNo,
      'Outward Date': row.date,
      'Client / Buyer': row.client,
      'Location': row.location,
      'Total Items': row.itemsCount,
      'Total Quantity': row.totalQuantity,
      'Total Value': row.totalValue,
      'Status': row.status
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Outward Stock');
    
    const fileName = `outward_stock_${getFormattedDate()}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    setShowExportMenu(false);
  };

  const handleExportCSV = () => {
    const headers = ['Dispatch Number', 'Outward Date', 'Client / Buyer', 'Location', 'Total Items', 'Total Quantity', 'Total Value', 'Status'];
    const csvContent = [
      headers.join(','),
      ...filteredData.map(row => 
        [
          row.dispatchNo, 
          row.date, 
          `"${row.client}"`, 
          `"${row.location}"`, 
          row.itemsCount, 
          row.totalQuantity, 
          row.totalValue, 
          row.status
        ].join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    const fileName = `outward_stock_${getFormattedDate()}.csv`;
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportMenu(false);
  };

  // Create Dispatch Logic
  const openCreateModal = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      client: '',
      location: '',
      referenceNumber: '',
      status: 'Processing',
    });
    setFormProducts([]);
    setShowCreateModal(true);
  };

  const closeCreateModal = () => {
    const isDirty = formProducts.length > 0 || formData.client !== '' || formData.location !== '' || formData.referenceNumber !== '';
    if (isDirty) {
      if (window.confirm("You have unsaved changes. Are you sure you want to close?")) {
        setShowCreateModal(false);
      }
    } else {
      setShowCreateModal(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showCreateModal) {
        closeCreateModal();
      }
      if (e.key === 'Escape' && selectedRecord) {
        setSelectedRecord(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showCreateModal, formProducts, formData, selectedRecord]);

  const handleAddProductRow = () => {
    setFormProducts([
      ...formProducts, 
      { id: Date.now().toString(), product: '', batchNo: '', availableQty: 0, dispatchQty: 0, rate: 0 }
    ]);
  };

  const handleProductChange = (id: string, field: keyof DispatchLineItem, value: any) => {
    setFormProducts(prev => prev.map(p => {
      if (p.id !== id) return p;
      const updated = { ...p, [field]: value };
      
      // Auto-populate batch info when batchNo changes
      if (field === 'batchNo' && updated.product) {
        const batchInfo = MOCK_BATCHES[updated.product]?.find(b => b.batchNo === value);
        if (batchInfo) {
          updated.availableQty = batchInfo.availableQty;
          updated.rate = batchInfo.rate;
        } else {
          updated.availableQty = 0;
          updated.rate = 0;
        }
      }
      
      // Reset batch info if product changes
      if (field === 'product') {
        updated.batchNo = '';
        updated.availableQty = 0;
        updated.rate = 0;
      }
      
      return updated;
    }));
  };

  const handleRemoveProductRow = (id: string) => {
    setFormProducts(formProducts.filter(p => p.id !== id));
  };

  const autoCalculatedMetrics = useMemo(() => {
    const totalItems = formProducts.length;
    const totalQuantity = formProducts.reduce((acc, curr) => acc + (Number(curr.dispatchQty) || 0), 0);
    const totalValue = formProducts.reduce((acc, curr) => acc + ((Number(curr.dispatchQty) || 0) * (Number(curr.rate) || 0)), 0);
    return { totalItems, totalQuantity, totalValue };
  }, [formProducts]);

  const handleSaveDispatch = () => {
    if (!formData.client || !formData.location || !formData.date) {
      alert("Please fill all mandatory fields (Client, Location, Date).");
      return;
    }

    if (formProducts.length === 0) {
      alert("Please add at least one product to dispatch.");
      return;
    }

    for (const p of formProducts) {
      if (!p.product || !p.batchNo || !p.dispatchQty) {
        alert("Please select a Product, Batch No, and enter Dispatch Qty for all rows.");
        return;
      }
      if (Number(p.dispatchQty) <= 0) {
        alert(`Dispatch quantity must be greater than zero for batch ${p.batchNo}.`);
        return;
      }
      if (Number(p.dispatchQty) > p.availableQty) {
        alert(`Dispatch quantity cannot exceed Available Qty (${p.availableQty}) for batch ${p.batchNo}.`);
        return;
      }
    }

    // Save Logic
    const newDispatchNo = `OUT-${new Date().getFullYear()}-${String(outwardRecords.length + 1).padStart(3, '0')}`;
    
    const newRecord: Outward = {
      id: Date.now().toString(),
      dispatchNo: newDispatchNo,
      date: formData.date,
      client: formData.client,
      location: formData.location,
      referenceNumber: formData.referenceNumber,
      itemsCount: autoCalculatedMetrics.totalItems,
      totalQuantity: autoCalculatedMetrics.totalQuantity,
      totalValue: autoCalculatedMetrics.totalValue,
      status: formData.status,
      products: [...formProducts],
      createdBy: 'Current User',
      createdDate: new Date().toLocaleDateString('en-GB').replace(/\//g, '-'),
      lastUpdatedBy: 'Current User',
      lastUpdatedDate: new Date().toLocaleDateString('en-GB').replace(/\//g, '-')
    };

    setOutwardRecords([newRecord, ...outwardRecords]);
    setShowCreateModal(false);
    alert("Dispatch created successfully!");
  };

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Outward Stock Management"
        subtitle="Manage inventory leaving the warehouse and delivery challans."
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
            <ActionButton icon={<Plus className="w-4 h-4" />} onClick={openCreateModal}>
              Create Dispatch
            </ActionButton>
          </>
        }
      />

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search dispatch or client..." />
        <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-600">Filters:</span>
        </div>
        <SelectFilter
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { label: 'Dispatched', value: 'Dispatched' },
            { label: 'Processing', value: 'Processing' },
            { label: 'Draft', value: 'Draft' },
            { label: 'Cancelled', value: 'Cancelled' },
          ]}
          placeholder="All Status"
        />
      </FilterBar>

      <TableCard>
        <div className="overflow-x-auto">
          <DataTable
            columns={columns}
            data={filteredData}
            emptyMessage="No outward records found."
          />
        </div>
      </TableCard>

      {/* Create Dispatch Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">Create Dispatch</h2>
              <button onClick={closeCreateModal} className="text-slate-500 hover:text-slate-800">✕</button>
            </div>

            <div className="space-y-8">
              
              {/* Dispatch Information */}
              <section>
                <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">Dispatch Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Dispatch Number</label>
                    <input type="text" readOnly value="Auto Generated" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-500 cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Dispatch Date *</label>
                    <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Client / Buyer *</label>
                    <select value={formData.client} onChange={e => setFormData({...formData, client: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2">
                      <option value="">Select Client</option>
                      {MOCK_CLIENTS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Dispatch From Location *</label>
                    <select value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2">
                      <option value="">Select Location</option>
                      {MOCK_LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Reference Number (Optional)</label>
                    <input type="text" value={formData.referenceNumber} onChange={e => setFormData({...formData, referenceNumber: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2" placeholder="e.g. SO-2026-001" />
                  </div>
                </div>
              </section>

              {/* Product Details Grid */}
              <section>
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                  <h3 className="text-sm font-semibold text-slate-700">Product Details</h3>
                  <button onClick={handleAddProductRow} className="text-sm text-violet-600 font-medium hover:text-violet-800 flex items-center">
                    <Plus className="w-4 h-4 mr-1" /> Add Row
                  </button>
                </div>
                
                <div className="overflow-x-auto pb-4">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                      <tr>
                        <th className="px-3 py-2 whitespace-nowrap">Product</th>
                        <th className="px-3 py-2 whitespace-nowrap">Batch No</th>
                        <th className="px-3 py-2 whitespace-nowrap w-32">Available Qty</th>
                        <th className="px-3 py-2 whitespace-nowrap w-32">Dispatch Qty</th>
                        <th className="px-3 py-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {formProducts.map((prod) => (
                        <tr key={prod.id} className="border-b border-slate-100">
                          <td className="px-2 py-2 min-w-[200px]">
                            <select value={prod.product} onChange={e => handleProductChange(prod.id, 'product', e.target.value)} className="w-full border border-slate-200 rounded px-2 py-1.5 text-sm">
                              <option value="">Select Product</option>
                              {MOCK_PRODUCTS.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                          </td>
                          <td className="px-2 py-2 min-w-[150px]">
                            <select value={prod.batchNo} onChange={e => handleProductChange(prod.id, 'batchNo', e.target.value)} className="w-full border border-slate-200 rounded px-2 py-1.5 text-sm" disabled={!prod.product}>
                              <option value="">Select Batch</option>
                              {prod.product && MOCK_BATCHES[prod.product]?.filter(b => b.availableQty > 0).map(b => (
                                <option key={b.batchNo} value={b.batchNo}>{b.batchNo}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-2 py-2">
                            <input type="number" readOnly value={prod.availableQty || ''} className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1.5 text-sm text-slate-500 cursor-not-allowed" placeholder="0" />
                          </td>
                          <td className="px-2 py-2">
                            <input type="number" value={prod.dispatchQty || ''} onChange={e => handleProductChange(prod.id, 'dispatchQty', e.target.value)} className={`w-full border rounded px-2 py-1.5 text-sm ${prod.dispatchQty > prod.availableQty ? 'border-rose-300 bg-rose-50' : 'border-slate-200'}`} min="1" max={prod.availableQty} placeholder="0" />
                          </td>
                          <td className="px-2 py-2 text-center">
                            <button onClick={() => handleRemoveProductRow(prod.id)} className="text-slate-400 hover:text-rose-600 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {formProducts.length === 0 && (
                        <tr>
                          <td colSpan={5} className="text-center py-6 text-sm text-slate-500">
                            No products added yet. Click "Add Row" to begin.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Summary Section */}
              <section className="bg-slate-50 p-4 rounded-xl border border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <span className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Total Items</span>
                  <span className="text-lg font-bold text-slate-900">{autoCalculatedMetrics.totalItems}</span>
                </div>
                <div>
                  <span className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Total Quantity</span>
                  <span className="text-lg font-bold text-slate-900">{autoCalculatedMetrics.totalQuantity.toLocaleString()}</span>
                </div>
                <div>
                  <span className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Total Value</span>
                  <span className="text-lg font-bold text-violet-700">₹{autoCalculatedMetrics.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </section>

              {/* Status Section */}
              <section>
                <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">Dispatch Status</h3>
                <div className="w-full md:w-1/2">
                  <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})} className="w-full border border-slate-200 rounded-lg px-3 py-2">
                    <option value="Draft">Draft</option>
                    <option value="Processing">Processing</option>
                    <option value="Dispatched">Dispatched</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </section>

            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-slate-200">
              <ActionButton variant="secondary" onClick={closeCreateModal}>Cancel</ActionButton>
              <ActionButton onClick={handleSaveDispatch}>Save Dispatch</ActionButton>
            </div>
          </div>
        </div>
      )}

      {/* Dispatch Details View Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto p-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">Dispatch Details</h2>
              <button onClick={() => setSelectedRecord(null)} className="text-slate-500 hover:text-slate-800">✕</button>
            </div>

            <div className="space-y-8">
              
              {/* Dispatch Information */}
              <div>
                <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-3">Dispatch Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                  <DrawerField label="Dispatch Number" value={<span className="font-mono text-violet-700 bg-violet-50 px-2 py-1 rounded">{selectedRecord.dispatchNo}</span>} />
                  <DrawerField label="Dispatch Date" value={selectedRecord.date} />
                  <DrawerField label="Client / Buyer" value={selectedRecord.client} />
                  <DrawerField label="Location" value={selectedRecord.location} />
                  <DrawerField label="Reference Number" value={selectedRecord.referenceNumber || 'N/A'} />
                  <DrawerField label="Status" value={<Badge variant={selectedRecord.status === 'Dispatched' ? 'success' : selectedRecord.status === 'Processing' ? 'info' : selectedRecord.status === 'Cancelled' ? 'danger' : 'warning'}>{selectedRecord.status}</Badge>} />
                </div>
              </div>

              {/* Product Details Grid */}
              <div>
                <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-3">Product Details</h3>
                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-3 py-2">Product</th>
                        <th className="px-3 py-2">Batch No</th>
                        <th className="px-3 py-2 text-right">Quantity</th>
                        <th className="px-3 py-2 text-right">Rate</th>
                        <th className="px-3 py-2 text-right">Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedRecord.products.map(prod => (
                        <tr key={prod.id}>
                          <td className="px-3 py-2 font-medium text-slate-900">{prod.product}</td>
                          <td className="px-3 py-2 text-slate-600">{prod.batchNo}</td>
                          <td className="px-3 py-2 text-right font-medium">{prod.dispatchQty.toLocaleString()}</td>
                          <td className="px-3 py-2 text-right">₹{prod.rate}</td>
                          <td className="px-3 py-2 text-right">₹{(prod.dispatchQty * prod.rate).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Summary Information */}
              <div>
                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Summary</h3>
                <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Total Items</span>
                    <span className="font-semibold text-slate-900">{selectedRecord.itemsCount}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Total Quantity</span>
                    <span className="font-semibold text-slate-900">{selectedRecord.totalQuantity.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm pt-2 border-t border-slate-200">
                    <span className="font-medium text-slate-700">Total Value</span>
                    <span className="text-lg font-bold text-violet-700">₹{selectedRecord.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              {/* Audit Information */}
              <div>
                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Audit Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                  <DrawerField label="Created By" value={selectedRecord.createdBy} />
                  <DrawerField label="Created Date" value={selectedRecord.createdDate} />
                  <DrawerField label="Last Updated By" value={selectedRecord.lastUpdatedBy} />
                  <DrawerField label="Last Updated Date" value={selectedRecord.lastUpdatedDate} />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end mt-8 pt-4 border-t border-slate-200">
              <ActionButton onClick={() => setSelectedRecord(null)}>Close</ActionButton>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
