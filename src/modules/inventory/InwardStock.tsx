import { useState, useRef, useEffect, useMemo } from 'react';
import { Plus, Download, Filter, ChevronDown, Trash2, X } from 'lucide-react';
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
import { type Column } from './components/shared';

// --- Data Models ---

interface ProductLineItem {
  id: string;
  product: string;
  batchNo: string;
  mfgDate: string;
  expiryDate: string;
  quantity: number;
  ptr: number;
  mrp: number;
}

interface Inward {
  id: string;
  grnNo: string;
  date: string;
  supplier: string;
  location: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  itemsCount: number;
  totalQuantity: number;
  totalValue: number;
  status: 'Draft' | 'Pending QC' | 'Completed' | 'Rejected';
  products: ProductLineItem[];
  createdBy: string;
  createdDate: string;
  lastUpdatedBy: string;
  lastUpdatedDate: string;
}

const mockData: Inward[] = [
  { 
    id: '1', 
    grnNo: 'GRN-2026-001', 
    date: '2026-10-12', 
    supplier: 'PharmaCorp Ltd.', 
    location: 'Hyderabad Warehouse',
    invoiceNumber: 'INV-PC-991',
    invoiceDate: '2026-10-10',
    itemsCount: 2, 
    totalQuantity: 7000,
    totalValue: 145000, 
    status: 'Completed',
    products: [
      { id: 'p1', product: 'Paracetamol 650mg', batchNo: 'B-2026-01', mfgDate: '2026-01-01', expiryDate: '2028-01-01', quantity: 5000, ptr: 15, mrp: 20 },
      { id: 'p2', product: 'Amoxicillin 500mg', batchNo: 'B-2026-02', mfgDate: '2026-02-01', expiryDate: '2028-02-01', quantity: 2000, ptr: 35, mrp: 50 }
    ],
    createdBy: 'Admin User',
    createdDate: '12-Oct-2026',
    lastUpdatedBy: 'Admin User',
    lastUpdatedDate: '12-Oct-2026'
  },
  { 
    id: '2', 
    grnNo: 'GRN-2026-002', 
    date: '2026-10-12', 
    supplier: 'HealthPlus Inc.', 
    location: 'Mumbai Warehouse',
    itemsCount: 1, 
    totalQuantity: 1000,
    totalValue: 28500, 
    status: 'Pending QC',
    products: [
      { id: 'p3', product: 'Vitamin C 1000mg', batchNo: 'B-2026-03', mfgDate: '2026-03-01', expiryDate: '2027-03-01', quantity: 1000, ptr: 28.5, mrp: 40 }
    ],
    createdBy: 'System User',
    createdDate: '12-Oct-2026',
    lastUpdatedBy: 'Quality Dept',
    lastUpdatedDate: '12-Oct-2026'
  },
];

const MOCK_SUPPLIERS = ['PharmaCorp Ltd.', 'HealthPlus Inc.', 'MediCare Supply'];
const MOCK_LOCATIONS = ['Hyderabad Warehouse', 'Mumbai Warehouse', 'Bangalore Warehouse', 'Delhi Warehouse'];
const MOCK_PRODUCTS = ['Paracetamol 650mg', 'Amoxicillin 500mg', 'Vitamin C 1000mg', 'Cough Syrup 100ml'];

export default function InwardStock() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  const [inwardRecords, setInwardRecords] = useState<Inward[]>(mockData);

  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<Inward | null>(null);

  // Create GRN Form State
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    supplier: '',
    location: '',
    invoiceNumber: '',
    invoiceDate: '',
    status: 'Completed' as Inward['status'],
  });

  const [formProducts, setFormProducts] = useState<ProductLineItem[]>([]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredData = inwardRecords.filter((item) => {
    const matchSearch = item.grnNo.toLowerCase().includes(search.toLowerCase()) || item.supplier.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  const columns: Column<Inward>[] = [
    { key: 'grnNo', label: 'GRN Number', render: (row) => <span className="font-semibold text-violet-700">{row.grnNo}</span> },
    { key: 'date', label: 'Inward Date' },
    { key: 'supplier', label: 'Supplier / Vendor', render: (row) => <span className="font-medium text-slate-800">{row.supplier}</span> },
    { key: 'location', label: 'Location' },
    { key: 'itemsCount', label: 'Total Items' },
    { key: 'totalQuantity', label: 'Total Quantity', render: (row) => row.totalQuantity.toLocaleString() },
    { key: 'totalValue', label: 'Total Value', render: (row) => `₹${row.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        let variant: 'success' | 'warning' | 'danger' | 'neutral' = 'neutral';
        if (row.status === 'Completed') variant = 'success';
        if (row.status === 'Pending QC') variant = 'warning';
        if (row.status === 'Rejected') variant = 'danger';
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
      'GRN Number': row.grnNo,
      'Inward Date': row.date,
      'Supplier / Vendor': row.supplier,
      'Location': row.location,
      'Total Items': row.itemsCount,
      'Total Quantity': row.totalQuantity,
      'Total Value': row.totalValue,
      'Status': row.status
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Inward Stock');
    
    const fileName = `inward_stock_${getFormattedDate()}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    setShowExportMenu(false);
  };

  const handleExportCSV = () => {
    const headers = ['GRN Number', 'Inward Date', 'Supplier / Vendor', 'Location', 'Total Items', 'Total Quantity', 'Total Value', 'Status'];
    const csvContent = [
      headers.join(','),
      ...filteredData.map(row => 
        [
          row.grnNo, 
          row.date, 
          `"${row.supplier}"`, 
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
    const fileName = `inward_stock_${getFormattedDate()}.csv`;
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportMenu(false);
  };

  // Create GRN Form Logic
  const openCreateModal = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      supplier: '',
      location: '',
      invoiceNumber: '',
      invoiceDate: '',
      status: 'Completed',
    });
    setFormProducts([]);
    setShowCreateModal(true);
  };

  const closeCreateModal = () => {
    const isDirty = formProducts.length > 0 || formData.supplier !== '' || formData.location !== '' || formData.invoiceNumber !== '';
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
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showCreateModal, formProducts, formData]);

  const handleAddProductRow = () => {
    setFormProducts([
      ...formProducts, 
      { id: Date.now().toString(), product: '', batchNo: '', mfgDate: '', expiryDate: '', quantity: 0, ptr: 0, mrp: 0 }
    ]);
  };

  const handleProductChange = (id: string, field: keyof ProductLineItem, value: any) => {
    setFormProducts(formProducts.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const handleRemoveProductRow = (id: string) => {
    setFormProducts(formProducts.filter(p => p.id !== id));
  };

  const autoCalculatedMetrics = useMemo(() => {
    const totalItems = formProducts.length;
    const totalQuantity = formProducts.reduce((acc, curr) => acc + (Number(curr.quantity) || 0), 0);
    const totalValue = formProducts.reduce((acc, curr) => acc + ((Number(curr.quantity) || 0) * (Number(curr.ptr) || 0)), 0);
    return { totalItems, totalQuantity, totalValue };
  }, [formProducts]);

  const handleSaveGRN = () => {
    // Validation
    if (!formData.supplier || !formData.location || !formData.date) {
      alert("Please fill all mandatory fields (Supplier, Location, Date).");
      return;
    }

    if (formProducts.length === 0) {
      alert("Please add at least one product.");
      return;
    }

    for (const p of formProducts) {
      if (!p.product || !p.batchNo || !p.mfgDate || !p.expiryDate || !p.quantity || !p.ptr || !p.mrp) {
        alert("Please fill all product fields completely.");
        return;
      }
      if (Number(p.quantity) <= 0) {
        alert("Quantity must be greater than zero.");
        return;
      }
      if (new Date(p.expiryDate) <= new Date(p.mfgDate)) {
        alert(`Expiry Date must be greater than Manufacturing Date for batch ${p.batchNo}.`);
        return;
      }
    }

    // Save Logic (Frontend Phase)
    const newGrnNo = `GRN-${new Date().getFullYear()}-${String(inwardRecords.length + 1).padStart(3, '0')}`;
    
    const newRecord: Inward = {
      id: Date.now().toString(),
      grnNo: newGrnNo,
      date: formData.date,
      supplier: formData.supplier,
      location: formData.location,
      invoiceNumber: formData.invoiceNumber,
      invoiceDate: formData.invoiceDate,
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

    setInwardRecords([newRecord, ...inwardRecords]);
    setShowCreateModal(false);
    alert("GRN saved successfully!");
  };

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Inward Stock Management"
        subtitle="Manage Goods Receipt Notes and incoming inventory."
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
              Create GRN
            </ActionButton>
          </>
        }
      />

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search GRN or supplier..." />
        <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-600">Filters:</span>
        </div>
        <SelectFilter
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { label: 'Completed', value: 'Completed' },
            { label: 'Pending QC', value: 'Pending QC' },
            { label: 'Draft', value: 'Draft' },
            { label: 'Rejected', value: 'Rejected' },
          ]}
          placeholder="All Status"
        />
      </FilterBar>

      <TableCard>
        <div className="overflow-x-auto">
          <DataTable
            columns={columns}
            data={filteredData}
            emptyMessage="No inward records found."
          />
        </div>
      </TableCard>

      {/* Create GRN Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 backdrop-blur-[2px] bg-slate-900/40">
          <div className="bg-white rounded-2xl shadow-2xl flex flex-col animate-in zoom-in-95 duration-200 w-[95%] sm:w-[90%] md:w-[80%] max-w-[1200px] max-h-[95vh] md:max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white rounded-t-2xl flex-shrink-0">
              <h2 className="text-lg font-bold text-slate-900">Create Goods Receipt Note (GRN)</h2>
              <button 
                onClick={closeCreateModal} 
                className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              
              {/* GRN Information */}
              <section>
                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100">GRN Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">GRN Number</label>
                    <input type="text" readOnly value="Auto Generated" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-500 cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Inward Date *</label>
                    <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Supplier / Vendor *</label>
                    <select value={formData.supplier} onChange={e => setFormData({...formData, supplier: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2">
                      <option value="">Select Supplier</option>
                      {MOCK_SUPPLIERS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Location *</label>
                    <select value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2">
                      <option value="">Select Location</option>
                      {MOCK_LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Invoice Number (Optional)</label>
                    <input type="text" value={formData.invoiceNumber} onChange={e => setFormData({...formData, invoiceNumber: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2" placeholder="Enter invoice number" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Invoice Date (Optional)</label>
                    <input type="date" value={formData.invoiceDate} onChange={e => setFormData({...formData, invoiceDate: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2" />
                  </div>
                </div>
              </section>

              {/* Product Details Grid */}
              <section>
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                  <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Product Details</h3>
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
                        <th className="px-3 py-2 whitespace-nowrap">MFG Date</th>
                        <th className="px-3 py-2 whitespace-nowrap">Expiry Date</th>
                        <th className="px-3 py-2 whitespace-nowrap w-24">Quantity</th>
                        <th className="px-3 py-2 whitespace-nowrap w-24">PTR (₹)</th>
                        <th className="px-3 py-2 whitespace-nowrap w-24">MRP (₹)</th>
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
                          <td className="px-2 py-2 min-w-[120px]">
                            <input type="text" value={prod.batchNo} onChange={e => handleProductChange(prod.id, 'batchNo', e.target.value)} className="w-full border border-slate-200 rounded px-2 py-1.5 text-sm uppercase" placeholder="Batch" />
                          </td>
                          <td className="px-2 py-2 min-w-[140px]">
                            <input type="date" value={prod.mfgDate} onChange={e => handleProductChange(prod.id, 'mfgDate', e.target.value)} className="w-full border border-slate-200 rounded px-2 py-1.5 text-sm" />
                          </td>
                          <td className="px-2 py-2 min-w-[140px]">
                            <input type="date" value={prod.expiryDate} onChange={e => handleProductChange(prod.id, 'expiryDate', e.target.value)} className="w-full border border-slate-200 rounded px-2 py-1.5 text-sm" />
                          </td>
                          <td className="px-2 py-2">
                            <input type="number" value={prod.quantity || ''} onChange={e => handleProductChange(prod.id, 'quantity', e.target.value)} className="w-full border border-slate-200 rounded px-2 py-1.5 text-sm" min="1" placeholder="0" />
                          </td>
                          <td className="px-2 py-2">
                            <input type="number" value={prod.ptr || ''} onChange={e => handleProductChange(prod.id, 'ptr', e.target.value)} className="w-full border border-slate-200 rounded px-2 py-1.5 text-sm" min="0" step="0.01" placeholder="0.00" />
                          </td>
                          <td className="px-2 py-2">
                            <input type="number" value={prod.mrp || ''} onChange={e => handleProductChange(prod.id, 'mrp', e.target.value)} className="w-full border border-slate-200 rounded px-2 py-1.5 text-sm" min="0" step="0.01" placeholder="0.00" />
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
                          <td colSpan={8} className="text-center py-6 text-sm text-slate-500">
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
                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100">Workflow Status</h3>
                <div className="w-full md:w-1/2">
                  <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})} className="w-full border border-slate-200 rounded-lg px-3 py-2">
                    <option value="Draft">Draft</option>
                    <option value="Pending QC">Pending QC</option>
                    <option value="Completed">Completed</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              </section>

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 rounded-b-2xl flex-shrink-0">
              <ActionButton variant="secondary" onClick={closeCreateModal}>Cancel</ActionButton>
              <ActionButton onClick={handleSaveGRN}>Save GRN</ActionButton>
            </div>
          </div>
        </div>
      )}

      {/* GRN View Drawer */}
      <Drawer
        open={!!selectedRecord}
        onClose={() => setSelectedRecord(null)}
        title="GRN Details"
      >
        {selectedRecord && (
          <div className="space-y-6">
            
            {/* GRN Information */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">GRN Information</h3>
              <div className="space-y-2">
                <DrawerField label="GRN Number" value={<span className="font-mono text-violet-700 bg-violet-50 px-2 py-1 rounded">{selectedRecord.grnNo}</span>} />
                <DrawerField label="Inward Date" value={selectedRecord.date} />
                <DrawerField label="Supplier / Vendor" value={selectedRecord.supplier} />
                <DrawerField label="Location" value={selectedRecord.location} />
                <DrawerField label="Invoice Number" value={selectedRecord.invoiceNumber || 'N/A'} />
                <DrawerField label="Invoice Date" value={selectedRecord.invoiceDate || 'N/A'} />
                <DrawerField label="Status" value={<Badge variant={selectedRecord.status === 'Completed' ? 'success' : selectedRecord.status === 'Pending QC' ? 'warning' : selectedRecord.status === 'Rejected' ? 'danger' : 'neutral'}>{selectedRecord.status}</Badge>} />
              </div>
            </div>

            {/* Product Details Table */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Product Details</h3>
              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-2">Product</th>
                      <th className="px-3 py-2">Batch No</th>
                      <th className="px-3 py-2">MFG Date</th>
                      <th className="px-3 py-2">Expiry Date</th>
                      <th className="px-3 py-2 text-right">Qty</th>
                      <th className="px-3 py-2 text-right">PTR</th>
                      <th className="px-3 py-2 text-right">MRP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedRecord.products.map(prod => (
                      <tr key={prod.id}>
                        <td className="px-3 py-2 font-medium text-slate-900">{prod.product}</td>
                        <td className="px-3 py-2 text-slate-600">{prod.batchNo}</td>
                        <td className="px-3 py-2 text-slate-600">{prod.mfgDate}</td>
                        <td className="px-3 py-2 text-slate-600">{prod.expiryDate}</td>
                        <td className="px-3 py-2 text-right font-medium">{prod.quantity}</td>
                        <td className="px-3 py-2 text-right">₹{prod.ptr}</td>
                        <td className="px-3 py-2 text-right">₹{prod.mrp}</td>
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
              <div className="space-y-2">
                <DrawerField label="Created By" value={selectedRecord.createdBy} />
                <DrawerField label="Created Date" value={selectedRecord.createdDate} />
                <DrawerField label="Last Updated By" value={selectedRecord.lastUpdatedBy} />
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
