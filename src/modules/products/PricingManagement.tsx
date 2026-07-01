import { useState } from 'react';
import { Plus, Filter, Download, Trash2 } from 'lucide-react';
import {
  PageHeader,
  FilterBar,
  SearchInput,
  SelectFilter,
  ActionButton,
  TableCard,
  DataTable,
  Drawer,
  DrawerField,
  Badge,
} from './components/shared';
import { type Column } from './types';

interface Pricing {
  id: string;
  productCode: string;
  productName: string;
  category?: string;
  mrp: string;
  pts: string;
  ptr: string;
  margin: string;
  revisionReason?: string;
  remarks?: string;
  effectiveDate?: string;
  revisedBy?: string;
  status: 'Active' | 'Pending Review' | 'Draft' | 'Scheduled' | 'Cancelled';
}

const mockProducts = [
  { code: 'PRD-001', name: 'Amoxicillin 500mg', category: 'Capsule', currentMrp: '150.00', currentPts: '105.00', currentPtr: '120.00' },
  { code: 'PRD-002', name: 'Paracetamol 650mg', category: 'Tablet', currentMrp: '45.00', currentPts: '32.00', currentPtr: '38.00' },
  { code: 'PRD-003', name: 'Cough Syrup 100ml', category: 'Syrup', currentMrp: '85.00', currentPts: '60.00', currentPtr: '72.00' },
  { code: 'PRD-004', name: 'Vitamin C 1000mg', category: 'Tablet', currentMrp: '120.00', currentPts: '85.00', currentPtr: '100.00' },
  { code: 'PRD-005', name: 'Ibuprofen 400mg', category: 'Tablet', currentMrp: '65.00', currentPts: '45.00', currentPtr: '55.00' },
];

const initialMockData: Pricing[] = [
  { id: '1', productCode: 'PRD-001', productName: 'Amoxicillin 500mg', category: 'Capsule', mrp: '₹ 150.00', pts: '₹ 105.00', ptr: '₹ 120.00', margin: '15%', revisionReason: 'Marketing Strategy', remarks: '', effectiveDate: '2026-06-01', revisedBy: 'Admin User', status: 'Active' },
  { id: '2', productCode: 'PRD-002', productName: 'Paracetamol 650mg', category: 'Tablet', mrp: '₹ 45.00', pts: '₹ 32.00', ptr: '₹ 38.00', margin: '12%', revisionReason: 'Cost Increase', remarks: '', effectiveDate: '2026-05-15', revisedBy: 'Admin User', status: 'Active' },
  { id: '3', productCode: 'PRD-003', productName: 'Cough Syrup 100ml', category: 'Syrup', mrp: '₹ 85.00', pts: '₹ 60.00', ptr: '₹ 72.00', margin: '18%', revisionReason: 'Distributor Request', remarks: '', effectiveDate: '2026-07-01', revisedBy: 'Pricing Team', status: 'Pending Review' },
  { id: '4', productCode: 'PRD-004', productName: 'Vitamin C 1000mg', category: 'Tablet', mrp: '₹ 120.00', pts: '₹ 85.00', ptr: '₹ 100.00', margin: '15%', revisionReason: 'Cost Reduction', remarks: '', effectiveDate: '2026-06-10', revisedBy: 'Admin User', status: 'Active' },
  { id: '5', productCode: 'PRD-005', productName: 'Ibuprofen 400mg', category: 'Tablet', mrp: '₹ 65.00', pts: '₹ 45.00', ptr: '₹ 55.00', margin: '14%', revisionReason: 'Government Revision', remarks: '', effectiveDate: '2026-04-20', revisedBy: 'Admin User', status: 'Active' },
];

export default function PricingManagement() {
  const [data, setData] = useState<Pricing[]>(initialMockData);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  const [selectedPricing, setSelectedPricing] = useState<Pricing | null>(null);
  const [itemToDelete, setItemToDelete] = useState<Pricing | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isEditingModal, setIsEditingModal] = useState(false);

  const [newPricing, setNewPricing] = useState({
    id: '',
    productName: '',
    productCode: '',
    category: '',
    currentMrp: '',
    currentPts: '',
    currentPtr: '',
    newMrp: '',
    newPts: '',
    newPtr: '',
    revisionReason: '',
    remarks: '',
    effectiveDate: '',
    revisedBy: 'Admin User',
    status: 'Draft' as 'Draft' | 'Scheduled' | 'Active' | 'Cancelled' | 'Pending Review'
  });

  const columns: Column<Pricing>[] = [
    { key: 'productCode', label: 'Code' },
    { key: 'productName', label: 'Product Name', render: (row) => <span className="font-semibold text-slate-900">{row.productName}</span> },
    { key: 'mrp', label: 'MRP' },
    { key: 'pts', label: 'PTS (To Stockist)' },
    { key: 'ptr', label: 'PTR (To Retailer)' },
    { key: 'margin', label: 'Margin' },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const variant = (row.status === 'Active' || row.status === 'Scheduled') ? 'success' : (row.status === 'Pending Review' ? 'warning' : row.status === 'Draft' || row.status === 'Cancelled' ? 'neutral' : 'danger');
        return <Badge variant={variant as any}>{row.status}</Badge>;
      },
    },
    {
      key: 'id',
      label: 'Actions',
      render: (row) => (
        <div className="flex gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedPricing(row);
            }}
            className="text-violet-600 font-medium hover:text-violet-800"
          >
            View
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setItemToDelete(row);
            }}
            className="text-rose-600 font-medium hover:text-rose-800"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  const filteredData = data.filter((item) => {
    const matchSearch = item.productCode.toLowerCase().includes(search.toLowerCase()) || item.productName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  const handleExport = () => {
    const headers = ['Code', 'Product Name', 'MRP', 'PTS', 'PTR', 'Margin', 'Status'];
    const csvContent = [
      headers.join(','),
      ...filteredData.map(row => 
        [
          row.productCode, 
          `"${row.productName}"`, 
          row.mrp.replace(/[^0-9.]/g, ''), 
          row.pts.replace(/[^0-9.]/g, ''), 
          row.ptr.replace(/[^0-9.]/g, ''), 
          `"${row.margin}"`, 
          row.status
        ].join(',')
      )
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'pricing_export.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleProductSelect = (productName: string) => {
    const product = mockProducts.find(p => p.name === productName);
    if (product) {
      setNewPricing({
        ...newPricing,
        productName: product.name,
        productCode: product.code,
        category: product.category,
        currentMrp: `₹ ${product.currentMrp}`,
        currentPts: `₹ ${product.currentPts}`,
        currentPtr: `₹ ${product.currentPtr}`
      });
    } else {
      setNewPricing({
        ...newPricing,
        productName: productName,
        productCode: '',
        category: '',
        currentMrp: '',
        currentPts: '',
        currentPtr: ''
      });
    }
  };

  const openNewModal = () => {
    setIsEditingModal(false);
    setNewPricing({
      id: '',
      productName: '',
      productCode: '',
      category: '',
      currentMrp: '',
      currentPts: '',
      currentPtr: '',
      newMrp: '',
      newPts: '',
      newPtr: '',
      revisionReason: '',
      remarks: '',
      effectiveDate: '',
      revisedBy: 'Admin User',
      status: 'Draft'
    });
    setShowModal(true);
  };

  const openEditModal = () => {
    if (!selectedPricing) return;
    setIsEditingModal(true);
    const product = mockProducts.find(p => p.name === selectedPricing.productName);
    setNewPricing({
      id: selectedPricing.id,
      productName: selectedPricing.productName,
      productCode: selectedPricing.productCode,
      category: selectedPricing.category || product?.category || '',
      currentMrp: product?.currentMrp ? `₹ ${product.currentMrp}` : '',
      currentPts: product?.currentPts ? `₹ ${product.currentPts}` : '',
      currentPtr: product?.currentPtr ? `₹ ${product.currentPtr}` : '',
      newMrp: selectedPricing.mrp.replace(/[^0-9.]/g, ''),
      newPts: selectedPricing.pts.replace(/[^0-9.]/g, ''),
      newPtr: selectedPricing.ptr.replace(/[^0-9.]/g, ''),
      revisionReason: selectedPricing.revisionReason || '',
      remarks: selectedPricing.remarks || '',
      effectiveDate: selectedPricing.effectiveDate || '',
      revisedBy: selectedPricing.revisedBy || 'Admin User',
      status: selectedPricing.status
    });
    setShowModal(true);
  };

  const calculateMargin = (pts: string, ptr: string) => {
    const ptsNum = parseFloat(pts);
    const ptrNum = parseFloat(ptr);
    if (!isNaN(ptsNum) && !isNaN(ptrNum) && ptrNum > 0) {
      return `${(((ptrNum - ptsNum) / ptrNum) * 100).toFixed(1)}%`;
    }
    return '0%';
  };

  const handleSavePricing = () => {
    if (!newPricing.productName || !newPricing.newMrp || !newPricing.newPts || !newPricing.newPtr || !newPricing.revisionReason || !newPricing.effectiveDate || !newPricing.status) {
      alert("Please fill all mandatory fields (*).");
      return;
    }
    
    if (isEditingModal && newPricing.id) {
      const updatedRecord: Pricing = {
        id: newPricing.id,
        productCode: newPricing.productCode || 'N/A',
        productName: newPricing.productName,
        category: newPricing.category,
        mrp: `₹ ${Number(newPricing.newMrp).toFixed(2)}`,
        pts: `₹ ${Number(newPricing.newPts).toFixed(2)}`,
        ptr: `₹ ${Number(newPricing.newPtr).toFixed(2)}`,
        margin: calculateMargin(newPricing.newPts, newPricing.newPtr),
        revisionReason: newPricing.revisionReason,
        remarks: newPricing.remarks,
        effectiveDate: newPricing.effectiveDate,
        revisedBy: newPricing.revisedBy,
        status: newPricing.status as any
      };
      
      setData(data.map(item => item.id === updatedRecord.id ? updatedRecord : item));
      if (selectedPricing && selectedPricing.id === updatedRecord.id) {
        setSelectedPricing(updatedRecord);
      }
    } else {
      const record: Pricing = {
        id: Date.now().toString(),
        productCode: newPricing.productCode || 'N/A',
        productName: newPricing.productName,
        category: newPricing.category,
        mrp: `₹ ${Number(newPricing.newMrp).toFixed(2)}`,
        pts: `₹ ${Number(newPricing.newPts).toFixed(2)}`,
        ptr: `₹ ${Number(newPricing.newPtr).toFixed(2)}`,
        margin: calculateMargin(newPricing.newPts, newPricing.newPtr),
        revisionReason: newPricing.revisionReason,
        remarks: newPricing.remarks,
        effectiveDate: newPricing.effectiveDate,
        revisedBy: newPricing.revisedBy,
        status: newPricing.status as any
      };
      setData([record, ...data]);
    }
    
    setShowModal(false);
  };

  const handleDelete = () => {
    if (itemToDelete) {
      setData(data.filter(item => item.id !== itemToDelete.id));
      setItemToDelete(null);
    }
  };

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="PTR / PTS / PTD Pricing"
        subtitle="Manage MRP, PTS, PTR, and product margins."
        actions={
          <>
            <ActionButton variant="secondary" icon={<Download className="w-4 h-4" />} onClick={handleExport}>
              Export
            </ActionButton>
            <ActionButton icon={<Plus className="w-4 h-4" />} onClick={openNewModal}>
              Update Pricing
            </ActionButton>
          </>
        }
      />

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search product..." />
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
            { label: 'Pending Review', value: 'Pending Review' },
            { label: 'Draft', value: 'Draft' },
            { label: 'Scheduled', value: 'Scheduled' },
            { label: 'Cancelled', value: 'Cancelled' },
            { label: 'Expired', value: 'Expired' },
          ]}
          placeholder="All Status"
        />
      </FilterBar>

      <TableCard>
        <DataTable
          columns={columns}
          data={filteredData}
          onRowClick={(row) => setSelectedPricing(row)}
          emptyMessage="No pricing records found."
        />
      </TableCard>

      {/* Pricing Details Drawer */}
      <Drawer
        open={!!selectedPricing}
        onClose={() => setSelectedPricing(null)}
        title="Pricing Details"
      >
        {selectedPricing && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Product Information</h3>
              <div className="space-y-2">
                <DrawerField label="Product Code" value={selectedPricing.productCode} />
                <DrawerField label="Product Name" value={selectedPricing.productName} />
                <DrawerField label="Category" value={selectedPricing.category || 'N/A'} />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Pricing Information</h3>
              <div className="space-y-2">
                <DrawerField label="Current MRP" value={selectedPricing.mrp} />
                <DrawerField label="Current PTS" value={selectedPricing.pts} />
                <DrawerField label="Current PTR" value={selectedPricing.ptr} />
                <DrawerField label="Margin %" value={selectedPricing.margin} />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Revision Information</h3>
              <div className="space-y-2">
                <DrawerField label="Revision Reason" value={selectedPricing.revisionReason || 'N/A'} />
                <DrawerField label="Remarks" value={selectedPricing.remarks || 'N/A'} />
                <DrawerField label="Effective Date" value={selectedPricing.effectiveDate || 'N/A'} />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Audit Information</h3>
              <div className="space-y-2">
                <DrawerField label="Revised By" value={selectedPricing.revisedBy || 'N/A'} />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Status Information</h3>
              <div className="space-y-2">
                <DrawerField
                  label="Status"
                  value={
                    <Badge variant={(selectedPricing.status === 'Active' || selectedPricing.status === 'Scheduled') ? 'success' : (selectedPricing.status === 'Pending Review' ? 'warning' : selectedPricing.status === 'Draft' || selectedPricing.status === 'Cancelled' ? 'neutral' : 'danger')}>
                      {selectedPricing.status}
                    </Badge>
                  }
                />
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
              <ActionButton onClick={openEditModal}>Edit Pricing</ActionButton>
              <ActionButton variant="secondary" onClick={() => setSelectedPricing(null)}>Close</ActionButton>
            </div>
          </div>
        )}
      </Drawer>

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-rose-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Pricing Record</h3>
            <p className="text-sm text-slate-500 mb-6">
              Are you sure you want to delete this pricing record? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setItemToDelete(null)} className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors">Cancel</button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 transition-colors"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pricing Form Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">{isEditingModal ? 'Edit Pricing' : 'Update Pricing'}</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-slate-800">✕</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* PRODUCT INFORMATION */}
              <div className="md:col-span-2 mt-2 first:mt-0">
                <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">PRODUCT INFORMATION</h3>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Product Name *</label>
                <select 
                  value={newPricing.productName} 
                  onChange={(e) => !isEditingModal && handleProductSelect(e.target.value)} 
                  disabled={isEditingModal}
                  className={`w-full border border-slate-200 rounded-lg px-3 py-2 ${isEditingModal ? 'bg-slate-50 opacity-70 cursor-not-allowed' : ''}`}
                >
                  <option value="">Select Product</option>
                  {mockProducts.map(p => <option key={p.code} value={p.name}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Product Code</label>
                <input value={newPricing.productCode} readOnly className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <input value={newPricing.category} readOnly className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50" />
              </div>

              {/* CURRENT PRICING INFORMATION */}
              <div className="md:col-span-2 mt-4">
                <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">CURRENT PRICING INFORMATION (Read Only)</h3>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Current MRP</label>
                <input value={newPricing.currentMrp} readOnly className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Current PTS</label>
                <input value={newPricing.currentPts} readOnly className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Current PTR</label>
                <input value={newPricing.currentPtr} readOnly className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50" />
              </div>

              {/* NEW PRICING INFORMATION */}
              <div className="md:col-span-2 mt-4">
                <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">NEW PRICING INFORMATION</h3>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">New MRP *</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-500">₹</span>
                  <input type="number" value={newPricing.newMrp} onChange={(e) => setNewPricing({ ...newPricing, newMrp: e.target.value })} className="w-full border border-slate-200 rounded-lg pl-7 pr-3 py-2" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">New PTS *</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-500">₹</span>
                  <input type="number" value={newPricing.newPts} onChange={(e) => setNewPricing({ ...newPricing, newPts: e.target.value })} className="w-full border border-slate-200 rounded-lg pl-7 pr-3 py-2" />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">New PTR *</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-500">₹</span>
                  <input type="number" value={newPricing.newPtr} onChange={(e) => setNewPricing({ ...newPricing, newPtr: e.target.value })} className="w-full border border-slate-200 rounded-lg pl-7 pr-3 py-2" />
                </div>
              </div>

              {/* REVISION INFORMATION */}
              <div className="md:col-span-2 mt-4">
                <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">REVISION INFORMATION</h3>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Revision Reason *</label>
                <select value={newPricing.revisionReason} onChange={(e) => setNewPricing({ ...newPricing, revisionReason: e.target.value })} className="w-full border border-slate-200 rounded-lg px-3 py-2">
                  <option value="">Select Reason</option>
                  <option value="Cost Increase">Cost Increase</option>
                  <option value="Cost Reduction">Cost Reduction</option>
                  <option value="Government Revision">Government Revision</option>
                  <option value="GST Change">GST Change</option>
                  <option value="Marketing Strategy">Marketing Strategy</option>
                  <option value="Distributor Request">Distributor Request</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Remarks</label>
                <textarea rows={2} value={newPricing.remarks} onChange={(e) => setNewPricing({ ...newPricing, remarks: e.target.value })} className="w-full border border-slate-200 rounded-lg px-3 py-2" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Effective Date *</label>
                <input type="date" value={newPricing.effectiveDate} onChange={(e) => setNewPricing({ ...newPricing, effectiveDate: e.target.value })} className="w-full border border-slate-200 rounded-lg px-3 py-2" />
              </div>

              {/* AUDIT INFORMATION */}
              <div className="md:col-span-2 mt-4">
                <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">AUDIT INFORMATION</h3>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Revised By</label>
                <input value={newPricing.revisedBy} readOnly className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50" />
              </div>

              {/* STATUS INFORMATION */}
              <div className="md:col-span-2 mt-4">
                <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">STATUS INFORMATION</h3>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Status</label>
                <select value={newPricing.status} onChange={(e) => setNewPricing({ ...newPricing, status: e.target.value as any })} className="w-full border border-slate-200 rounded-lg px-3 py-2">
                  <option value="Draft">Draft</option>
                  <option value="Pending Review">Pending Review</option>
                  <option value="Scheduled">Scheduled</option>
                  <option value="Active">Active</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-100">
              <ActionButton variant="secondary" onClick={() => setShowModal(false)}>Cancel</ActionButton>
              <ActionButton onClick={handleSavePricing}>{isEditingModal ? 'Save Changes' : 'Save Pricing'}</ActionButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
