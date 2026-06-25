import { useState, useEffect } from "react";
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
import { barcodeService } from "../../services/barcodeService";

import { productService } from "../../services/productService";

import activityLogService from "../../services/activityLogService";

import { hasModulePermission } from '../../utils/permissionUtils';

interface Barcode {
  id: string;
  barcode: string;
  productCode: string;
  productName: string;
  type: string;
  assignedDate: string;
  generatedBy?: string;
  generatedDate?: string;
  status: 'Active' | 'Inactive' | 'Unassigned';
}

const mockProducts = [
  { code: 'PRD-001', name: 'Amoxicillin 500mg' },
  { code: 'PRD-002', name: 'Paracetamol 650mg' },
  { code: 'PRD-003', name: 'Cough Syrup 100ml' },
  { code: 'PRD-004', name: 'Vitamin C 1000mg' },
  { code: 'PRD-005', name: 'Ibuprofen 400mg' },
];

const initialMockData: Barcode[] = [
  { id: '1', barcode: '8901234567890', productCode: 'PRD-001', productName: 'Amoxicillin 500mg', type: 'EAN-13', assignedDate: '10-Oct-2025', generatedBy: 'Admin User', generatedDate: '10-Oct-2025', status: 'Active' },
  { id: '2', barcode: '8901234567891', productCode: 'PRD-002', productName: 'Paracetamol 650mg', type: 'EAN-13', assignedDate: '12-Oct-2025', generatedBy: 'System', generatedDate: '12-Oct-2025', status: 'Active' },
  { id: '3', barcode: '8901234567892', productCode: '-', productName: '-', type: 'EAN-13', assignedDate: '-', generatedBy: 'Admin User', generatedDate: '15-Oct-2025', status: 'Unassigned' },
  { id: '4', barcode: '8901234567893', productCode: 'PRD-004', productName: 'Vitamin C 1000mg', type: 'UPC-A', assignedDate: '15-Oct-2025', generatedBy: 'Admin User', generatedDate: '15-Oct-2025', status: 'Active' },
];

export default function BarcodeManagement() {
 const [data, setData] = useState<Barcode[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const currentUser = JSON.parse(localStorage.getItem("authUser") || "{}");
  
  const [selectedBarcode, setSelectedBarcode] = useState<Barcode | null>(null);
  const [itemToDelete, setItemToDelete] = useState<Barcode | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isEditingModal, setIsEditingModal] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  useEffect(() => {
    const savedProducts = productService.getProducts();

    setProducts(savedProducts);
  }, []);

  useEffect(() => {
  const savedData =
    barcodeService.getAll();

  if (savedData.length > 0) {
    setData(savedData);
  } else {
    setData(initialMockData);

    barcodeService.saveAll(
      initialMockData
    );
  }
}, []);

useEffect(() => {
  if (data.length > 0) {
    barcodeService.saveAll(data);
  }
}, [data]);


const activeRole = localStorage.getItem("activeRole") || "";

const canView = hasModulePermission(activeRole, "Products & Master", "View");

const canCreate = hasModulePermission(
  activeRole,
  "Products & Master",
  "Create",
);

const canEdit = hasModulePermission(activeRole, "Products & Master", "Edit");

const canDelete = hasModulePermission(
  activeRole,
  "Products & Master",
  "Delete",
);

  const [newBarcode, setNewBarcode] = useState({
    id: '',
    productName: '',
    productCode: '',
    type: 'EAN-13',
    barcodeNumber: '',
    status: 'Active' as 'Active' | 'Inactive' | 'Unassigned'
  });

  const columns: Column<Barcode>[] = [
    { key: 'barcode', label: 'Barcode', render: (row) => <span className="font-mono text-slate-800 bg-slate-100 px-2 py-1 rounded">{row.barcode}</span> },
    { key: 'productName', label: 'Assigned Product', render: (row) => <span className="font-semibold text-slate-900">{row.productName}</span> },
    { key: 'type', label: 'Type' },
    { key: 'assignedDate', label: 'Assigned Date' },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const variant = row.status === 'Active' ? 'success' : (row.status === 'Unassigned' ? 'warning' : 'neutral');
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
              setSelectedBarcode(row);
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
    const matchSearch = item.barcode.includes(search) || item.productName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  const handleExport = () => {
    const headers = ['Barcode', 'Assigned Product', 'Barcode Type', 'Assigned Date', 'Status'];
    const csvContent = [
      headers.join(','),
      ...filteredData.map(row => 
        [
          `="${row.barcode}"`, 
          `"${row.productName}"`, 
          row.type, 
          row.assignedDate, 
          row.status
        ].join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'barcode_export.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleProductSelect = (productName: string) => {
    const product = products.find((p) => p.name === productName);

    if (product) {
      setNewBarcode((prev) => ({
        ...prev,

        productName: product.name,

        productCode: product.code,
      }));
    }
  };

  const openNewModal = () => {
    setIsEditingModal(false);
    setValidationError('');
    setNewBarcode({
      id: '',
      productName: '',
      productCode: '',
      type: 'EAN-13',
      barcodeNumber: '',
      status: 'Active'
    });
    setShowModal(true);
  };

  const openEditModal = () => {
    if (!selectedBarcode) return;
    setIsEditingModal(true);
    setValidationError('');
    setNewBarcode({
      id: selectedBarcode.id,
      productName: selectedBarcode.productName === '-' ? '' : selectedBarcode.productName,
      productCode: selectedBarcode.productCode === '-' ? '' : selectedBarcode.productCode,
      type: selectedBarcode.type,
      barcodeNumber: selectedBarcode.barcode,
      status: selectedBarcode.status
    });
    setShowModal(true);
  };

  const handleSaveBarcode = () => {
    setValidationError('');

    if (!newBarcode.productName || !newBarcode.type || !newBarcode.barcodeNumber || !newBarcode.status) {
      setValidationError("Please fill all mandatory fields (*).");
      return;
    }

    const matchingProduct = mockProducts.find(p => p.name === newBarcode.productName);
    if (!matchingProduct) {
      setValidationError("Please select a valid existing product from the list.");
      return;
    }

    const isDuplicate = data.some(b => b.barcode === newBarcode.barcodeNumber && b.id !== newBarcode.id);
    if (isDuplicate) {
      setValidationError("This Barcode Number already exists. Barcode numbers must be unique.");
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    
    if (isEditingModal && newBarcode.id) {
      const updatedRecord: Barcode = {
        id: newBarcode.id,
        barcode: newBarcode.barcodeNumber,
        productCode: newBarcode.productCode,
        productName: newBarcode.productName,
        type: newBarcode.type,
        assignedDate: selectedBarcode?.assignedDate && selectedBarcode.assignedDate !== '-' ? selectedBarcode.assignedDate : today,
        generatedBy: selectedBarcode?.generatedBy || 'Admin User',
        generatedDate: selectedBarcode?.generatedDate || today,
        status: newBarcode.status as any
      };
      
      setData(data.map(item => item.id === updatedRecord.id ? updatedRecord : item));
      activityLogService.addLog({
        userId: currentUser?.id,
        userName: currentUser?.fullName,
        action: "Barcode Updated",
        module: "Barcode Management",
      });
      if (selectedBarcode && selectedBarcode.id === updatedRecord.id) {
        setSelectedBarcode(updatedRecord);
      }
    } else {
      const record: Barcode = {
        id: Date.now().toString(),
        barcode: newBarcode.barcodeNumber,
        productCode: newBarcode.productCode,
        productName: newBarcode.productName,
        type: newBarcode.type,
        assignedDate: today,
        generatedBy: 'Admin User',
        generatedDate: today,
        status: newBarcode.status as any
      };
      setData([record, ...data]);
      activityLogService.addLog({
        userId: currentUser?.id,
        userName: currentUser?.fullName,
        action: "Barcode Created",
        module: "Barcode Management",
      });
    }
    
    setShowModal(false);
  };

  const handleDelete = () => {
    if (itemToDelete) {
      setData(data.filter(item => item.id !== itemToDelete.id));
      activityLogService.addLog({
        userId: currentUser?.id,
        userName: currentUser?.fullName,
        action: "Barcode Deleted",
        module: "Barcode Management",
      });
      setItemToDelete(null);
    }
  };

  // if (!canView) {
  //   return (
  //     <div className="p-10 text-center">
  //       <h2 className="text-xl font-semibold">Access Denied</h2>

  //       <p className="text-slate-500 mt-2">
  //         You do not have permission to view Barcode Management.
  //       </p>
  //     </div>
  //   );
  // }

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Barcode Management"
        subtitle="Manage product barcodes, EAN/UPC mapping, and generation."
        actions={
          <>
            <ActionButton variant="secondary" icon={<Download className="w-4 h-4" />} onClick={handleExport}>
              Export
            </ActionButton>
            <ActionButton icon={<Plus className="w-4 h-4" />} onClick={openNewModal}>
              Generate Barcode
            </ActionButton>
          </>
        }
      />

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search barcode or product..." />
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
            { label: 'Unassigned', value: 'Unassigned' },
            { label: 'Inactive', value: 'Inactive' },
          ]}
          placeholder="All Status"
        />
      </FilterBar>

      <TableCard>
        <DataTable
          columns={columns}
          data={filteredData}
          onRowClick={(row) => setSelectedBarcode(row)}
          emptyMessage="No barcodes found."
        />
      </TableCard>

      {/* Barcode Details Drawer */}
      <Drawer
        open={!!selectedBarcode}
        onClose={() => setSelectedBarcode(null)}
        title="Barcode Details"
      >
        {selectedBarcode && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Product Information</h3>
              <div className="space-y-2">
                <DrawerField label="Product Name" value={selectedBarcode.productName} />
                <DrawerField label="Product Code" value={selectedBarcode.productCode} />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Barcode Information</h3>
              <div className="space-y-2">
                <DrawerField label="Barcode Number" value={
                  <span className="font-mono text-slate-800 bg-slate-100 px-2 py-1 rounded">{selectedBarcode.barcode}</span>
                } />
                <DrawerField label="Barcode Type" value={selectedBarcode.type} />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Assignment Information</h3>
              <div className="space-y-2">
                <DrawerField label="Assigned Date" value={selectedBarcode.assignedDate} />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Audit Information</h3>
              <div className="space-y-2">
                <DrawerField label="Generated By" value={selectedBarcode.generatedBy || 'System'} />
                <DrawerField label="Generated Date" value={selectedBarcode.generatedDate || 'N/A'} />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Status Information</h3>
              <div className="space-y-2">
                <DrawerField
                  label="Status"
                  value={
                    <Badge variant={selectedBarcode.status === 'Active' ? 'success' : (selectedBarcode.status === 'Unassigned' ? 'warning' : 'neutral')}>
                      {selectedBarcode.status}
                    </Badge>
                  }
                />
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
              <ActionButton onClick={openEditModal}>Edit Barcode</ActionButton>
              <ActionButton variant="secondary" onClick={() => setSelectedBarcode(null)}>Close</ActionButton>
            </div>
          </div>
        )}
      </Drawer>

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-rose-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Barcode Record</h3>
            <p className="text-sm text-slate-500 mb-6">
              Are you sure you want to delete this barcode record? This action cannot be undone.
            </p>
            <div className="flex justify-center gap-3">
              <button onClick={() => setItemToDelete(null)} className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors">Cancel</button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generate / Edit Barcode Modal Form */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">{isEditingModal ? 'Edit Barcode' : 'Generate Barcode'}</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-slate-800">✕</button>
            </div>

            {validationError && (
              <div className="mb-6 p-3 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-600 font-medium">
                {validationError}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* PRODUCT INFORMATION */}
              <div className="md:col-span-2 mt-2 first:mt-0">
                <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">PRODUCT INFORMATION</h3>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Product *</label>
                <div className="relative">
                  <input
                    list="product-suggestions"
                    value={newBarcode.productName}
                    onChange={(e) => handleProductSelect(e.target.value)}
                    placeholder="Search product..."
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                  />
                  <datalist id="product-suggestions">
                    {products.map(p => (
                      <option key={p.code} value={p.name} />
                    ))}
                  </datalist>
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Product Code</label>
                <input 
                  value={newBarcode.productCode} 
                  readOnly 
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 text-slate-500 cursor-not-allowed" 
                  placeholder="Auto-populated"
                />
              </div>

              {/* BARCODE INFORMATION */}
              <div className="md:col-span-2 mt-4">
                <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">BARCODE INFORMATION</h3>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Barcode Type *</label>
                <select 
                  value={newBarcode.type} 
                  onChange={(e) => setNewBarcode({ ...newBarcode, type: e.target.value })} 
                  className="w-full border border-slate-200 rounded-lg px-3 py-2"
                >
                  <option value="EAN-13">EAN-13</option>
                  <option value="Code 128">Code 128</option>
                  <option value="UPC-A">UPC-A</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Barcode Number *</label>
                <input 
                  type="text"
                  value={newBarcode.barcodeNumber} 
                  onChange={(e) => setNewBarcode({ ...newBarcode, barcodeNumber: e.target.value })} 
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 font-mono" 
                  placeholder="Enter unique barcode number"
                />
              </div>

              {/* ASSIGNMENT INFORMATION */}
              <div className="md:col-span-2 mt-4">
                <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">ASSIGNMENT INFORMATION</h3>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Status *</label>
                <select 
                  value={newBarcode.status} 
                  onChange={(e) => setNewBarcode({ ...newBarcode, status: e.target.value as any })} 
                  className="w-full border border-slate-200 rounded-lg px-3 py-2"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Unassigned">Unassigned</option>
                </select>
              </div>

              {/* AUDIT INFORMATION */}
              <div className="md:col-span-2 mt-4">
                <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">AUDIT INFORMATION</h3>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Generated By</label>
                <input 
                  value={isEditingModal ? (selectedBarcode?.generatedBy || 'System') : 'Admin User'} 
                  readOnly 
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 text-slate-500 cursor-not-allowed" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Generated Date</label>
                <input 
                  value={isEditingModal ? (selectedBarcode?.generatedDate || 'N/A') : new Date().toISOString().split('T')[0]} 
                  readOnly 
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 text-slate-500 cursor-not-allowed" 
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-100">
              <ActionButton variant="secondary" onClick={() => setShowModal(false)}>Cancel</ActionButton>
              <ActionButton onClick={handleSaveBarcode}>{isEditingModal ? 'Save Changes' : 'Generate Barcode'}</ActionButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
