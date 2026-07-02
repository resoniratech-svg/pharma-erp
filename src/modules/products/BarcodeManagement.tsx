// // src/modules/products/BarcodeManagement.tsx
// import { useState, useEffect } from "react";
// import { Plus, Filter, Download, Trash2 } from 'lucide-react';
// import {
//   PageHeader,
//   FilterBar,
//   SearchInput,
//   SelectFilter,
//   ActionButton,
//   TableCard,
//   DataTable,
//   Drawer,
//   DrawerField,
//   Badge,
// } from './components/shared';
// import { type Column } from './types';
// import { barcodeService } from "../../services/barcodeService";
// import { productService } from "../../services/productService";
// import activityLogService from "../../services/activityLogService";
// import { hasModulePermission } from '../../utils/permissionUtils';

// interface Barcode {
//   id: string;
//   barcode: string;
//   productCode: string;
//   productName: string;
//   type: string;
//   assignedDate: string;
//   generatedBy?: string;
//   generatedDate?: string;
//   status: 'Active' | 'Inactive' | 'Unassigned';
// }

// const initialMockData: Barcode[] = [
//   { id: '1', barcode: '8901234567890', productCode: 'PRD-001', productName: 'Amoxicillin 500mg', type: 'EAN-13', assignedDate: '10-Oct-2025', generatedBy: 'Admin User', generatedDate: '10-Oct-2025', status: 'Active' },
//   { id: '2', barcode: '8901234567891', productCode: 'PRD-002', productName: 'Paracetamol 650mg', type: 'EAN-13', assignedDate: '12-Oct-2025', generatedBy: 'System', generatedDate: '12-Oct-2025', status: 'Active' },
//   { id: '3', barcode: '8901234567892', productCode: '-', productName: '-', type: 'EAN-13', assignedDate: '-', generatedBy: 'Admin User', generatedDate: '15-Oct-2025', status: 'Unassigned' },
//   { id: '4', barcode: '8901234567893', productCode: 'PRD-004', productName: 'Vitamin C 1000mg', type: 'UPC-A', assignedDate: '15-Oct-2025', generatedBy: 'Admin User', generatedDate: '15-Oct-2025', status: 'Active' },
// ];

// export default function BarcodeManagement() {
//   const [data, setData] = useState<Barcode[]>([]);
//   const [search, setSearch] = useState('');
//   const [statusFilter, setStatusFilter] = useState('');

//   const currentUser = JSON.parse(localStorage.getItem("authUser") || "{}");
  
//   const [selectedBarcode, setSelectedBarcode] = useState<Barcode | null>(null);
//   const [itemToDelete, setItemToDelete] = useState<Barcode | null>(null);
//   const [showModal, setShowModal] = useState(false);
//   const [isEditingModal, setIsEditingModal] = useState(false);
//   const [validationError, setValidationError] = useState('');
//   const [products, setProducts] = useState<any[]>([]);

//   useEffect(() => {
//     const savedProducts = productService.getProducts();
//     setProducts(savedProducts || []);
//   }, []);

//   useEffect(() => {
//     const savedData = barcodeService.getAll();
//     if (savedData && savedData.length > 0) {
//       setData(savedData);
//     } else {
//       setData(initialMockData);
//       barcodeService.saveAll(initialMockData);
//     }
//   }, []);

//   useEffect(() => {
//     if (data.length > 0) {
//       barcodeService.saveAll(data);
//     }
//   }, [data]);

//   const activeRole = localStorage.getItem("activeRole") || "";
//   const canView = hasModulePermission(activeRole, "Products & Master", "View");
//   const canCreate = hasModulePermission(activeRole, "Products & Master", "Create");
//   const canEdit = hasModulePermission(activeRole, "Products & Master", "Edit");
//   const canDelete = hasModulePermission(activeRole, "Products & Master", "Delete");

//   const [newBarcode, setNewBarcode] = useState({
//     id: '',
//     productName: '',
//     productCode: '',
//     type: 'EAN-13',
//     barcodeNumber: '',
//     status: 'Active' as 'Active' | 'Inactive' | 'Unassigned'
//   });

//   const columns: Column<Barcode>[] = [
//     { key: 'barcode', label: 'Barcode', render: (row) => <span className="font-mono text-slate-800 bg-slate-100 px-2 py-1 rounded">{row.barcode}</span> },
//     { key: 'productName', label: 'Assigned Product', render: (row) => <span className="font-semibold text-slate-900">{row.productName}</span> },
//     { key: 'type', label: 'Type' },
//     { key: 'assignedDate', label: 'Assigned Date' },
//     {
//       key: 'status',
//       label: 'Status',
//       render: (row) => {
//         const variant = row.status === 'Active' ? 'success' : (row.status === 'Unassigned' ? 'warning' : 'neutral');
//         return <Badge variant={variant as any}>{row.status}</Badge>;
//       },
//     },
//     {
//       key: 'id',
//       label: 'Actions',
//       render: (row) => (
//         <div className="flex gap-3">
//           <button
//             onClick={(e) => {
//               e.stopPropagation();
//               setSelectedBarcode(row);
//             }}
//             className="text-violet-600 font-medium hover:text-violet-800"
//           >
//             View
//           </button>
//           {canDelete && (
//             <button
//               onClick={(e) => {
//                 e.stopPropagation();
//                 setItemToDelete(row);
//               }}
//               className="text-rose-600 font-medium hover:text-rose-800"
//               title="Delete"
//             >
//               <Trash2 className="w-4 h-4" />
//             </button>
//           )}
//         </div>
//       )
//     }
//   ];

//   const filteredData = data.filter((item) => {
//     const matchSearch = item.barcode.includes(search) || item.productName.toLowerCase().includes(search.toLowerCase());
//     const matchStatus = statusFilter ? item.status === statusFilter : true;
//     return matchSearch && matchStatus;
//   });

//   const handleExport = () => {
//     const headers = ['Barcode', 'Assigned Product', 'Barcode Type', 'Assigned Date', 'Status'];
//     const csvContent = [
//       headers.join(','),
//       ...filteredData.map(row => 
//         [
//           `="${row.barcode}"`, 
//           `"${row.productName}"`, 
//           row.type, 
//           row.assignedDate, 
//           row.status
//         ].join(',')
//       )
//     ].join('\n');
    
//     const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
//     const link = document.createElement('a');
//     const url = URL.createObjectURL(blob);
//     link.setAttribute('href', url);
//     link.setAttribute('download', 'barcode_export.csv');
//     link.style.visibility = 'hidden';
//     document.body.appendChild(link);
//     link.click();
//     document.body.removeChild(link);
//   };

//   const handleProductSelect = (productName: string) => {
//     const product = products.find((p) => p.name === productName);
//     if (product) {
//       setNewBarcode((prev) => ({
//         ...prev,
//         productName: product.name,
//         productCode: product.code,
//       }));
//     } else {
//       setNewBarcode((prev) => ({
//         ...prev,
//         productName: productName,
//         productCode: '', 
//       }));
//     }
//   };

//   const openNewModal = () => {
//     setIsEditingModal(false);
//     setValidationError('');
//     setNewBarcode({
//       id: '',
//       productName: '',
//       productCode: '',
//       type: 'EAN-13',
//       barcodeNumber: '',
//       status: 'Active'
//     });
//     setShowModal(true);
//   };

//   const openEditModal = () => {
//     if (!selectedBarcode) return;
//     setIsEditingModal(true);
//     setValidationError('');
//     setNewBarcode({
//       id: selectedBarcode.id,
//       productName: selectedBarcode.productName === '-' ? '' : selectedBarcode.productName,
//       productCode: selectedBarcode.productCode === '-' ? '' : selectedBarcode.productCode,
//       type: selectedBarcode.type,
//       barcodeNumber: selectedBarcode.barcode,
//       status: selectedBarcode.status
//     });
//     setShowModal(true);
//   };

//   const handleSaveBarcode = () => {
//     setValidationError('');

//     if (!newBarcode.productName || !newBarcode.type || !newBarcode.barcodeNumber || !newBarcode.status) {
//       setValidationError("Please fill all mandatory fields (*).");
//       return;
//     }

//     const matchingProduct = products.find(p => p.name === newBarcode.productName);
//     if (!matchingProduct) {
//       setValidationError("Please select a valid existing product from the list.");
//       return;
//     }

//     const isDuplicate = data.some(b => b.barcode === newBarcode.barcodeNumber && b.id !== newBarcode.id);
//     if (isDuplicate) {
//       setValidationError("This Barcode Number already exists. Barcode numbers must be unique.");
//       return;
//     }

//     const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-');
    
//     if (isEditingModal && newBarcode.id) {
//       const updatedRecord: Barcode = {
//         id: newBarcode.id,
//         barcode: newBarcode.barcodeNumber,
//         productCode: newBarcode.productCode || matchingProduct.code,
//         productName: newBarcode.productName,
//         type: newBarcode.type,
//         assignedDate: selectedBarcode?.assignedDate && selectedBarcode.assignedDate !== '-' ? selectedBarcode.assignedDate : today,
//         generatedBy: selectedBarcode?.generatedBy || 'Admin User',
//         generatedDate: selectedBarcode?.generatedDate || today,
//         status: newBarcode.status as any
//       };
      
//       setData(data.map(item => item.id === updatedRecord.id ? updatedRecord : item));
//       activityLogService.addLog({
//         userId: currentUser?.id,
//         userName: currentUser?.fullName,
//         action: "Barcode Updated",
//         module: "Barcode Management",
//       });
//       if (selectedBarcode && selectedBarcode.id === updatedRecord.id) {
//         setSelectedBarcode(updatedRecord);
//       }
//     } else {
//       const record: Barcode = {
//         id: Date.now().toString(),
//         barcode: newBarcode.barcodeNumber,
//         productCode: newBarcode.productCode || matchingProduct.code,
//         productName: newBarcode.productName,
//         type: newBarcode.type,
//         assignedDate: today,
//         generatedBy: 'Admin User',
//         generatedDate: today,
//         status: newBarcode.status as any
//       };
//       setData([record, ...data]);
//       activityLogService.addLog({
//         userId: currentUser?.id,
//         userName: currentUser?.fullName,
//         action: "Barcode Created",
//         module: "Barcode Management",
//       });
//     }
    
//     setShowModal(false);
//   };

//   const handleDelete = () => {
//     if (itemToDelete) {
//       setData(data.filter(item => item.id !== itemToDelete.id));
//       activityLogService.addLog({
//         userId: currentUser?.id,
//         userName: currentUser?.fullName,
//         action: "Barcode Deleted",
//         module: "Barcode Management",
//       });
//       setItemToDelete(null);
//     }
//   };

//   return (
//     <div className="animate-in fade-in duration-500">
//       <PageHeader
//         title="Barcode Management"
//         subtitle="Manage product barcodes, EAN/UPC mapping, and generation."
//         actions={
//           <>
//             <ActionButton variant="secondary" icon={<Download className="w-4 h-4" />} onClick={handleExport}>
//               Export
//             </ActionButton>
//             {canCreate && (
//               <ActionButton icon={<Plus className="w-4 h-4" />} onClick={openNewModal}>
//                 Generate Barcode
//               </ActionButton>
//             )}
//           </>
//         }
//       />

//       <FilterBar>
//         <SearchInput value={search} onChange={setSearch} placeholder="Search barcode or product..." />
//         <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
//         <div className="flex items-center gap-2">
//           <Filter className="w-4 h-4 text-slate-400" />
//           <span className="text-sm font-medium text-slate-600">Filters:</span>
//         </div>
//         <SelectFilter
//           value={statusFilter}
//           onChange={setStatusFilter}
//           options={[
//             { label: 'Active', value: 'Active' },
//             { label: 'Unassigned', value: 'Unassigned' },
//             { label: 'Inactive', value: 'Inactive' },
//           ]}
//           placeholder="All Status"
//         />
//       </FilterBar>

//       <TableCard>
//         <DataTable
//           columns={columns}
//           data={filteredData}
//           onRowClick={(row) => setSelectedBarcode(row)}
//           emptyMessage="No barcodes found."
//         />
//       </TableCard>

//       {/* Barcode Details Drawer */}
//       <Drawer
//         open={!!selectedBarcode}
//         onClose={() => setSelectedBarcode(null)}
//         title="Barcode Details"
//       >
//         {selectedBarcode && (
//           <div className="space-y-6">
//             <div>
//               <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Product Information</h3>
//               <div className="space-y-2">
//                 <DrawerField label="Product Name" value={selectedBarcode.productName} />
//                 <DrawerField label="Product Code" value={selectedBarcode.productCode} />
//               </div>
//             </div>

//             <div>
//               <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Barcode Information</h3>
//               <div className="space-y-2">
//                 <DrawerField label="Barcode Number" value={
//                   <span className="font-mono text-slate-800 bg-slate-100 px-2 py-1 rounded">{selectedBarcode.barcode}</span>
//                 } />
//                 <DrawerField label="Barcode Type" value={selectedBarcode.type} />
//               </div>
//             </div>

//             <div>
//               <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Assignment Information</h3>
//               <div className="space-y-2">
//                 <DrawerField label="Assigned Date" value={selectedBarcode.assignedDate} />
//               </div>
//             </div>

//             <div>
//               <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Audit Information</h3>
//               <div className="space-y-2">
//                 <DrawerField label="Generated By" value={selectedBarcode.generatedBy || 'System'} />
//                 <DrawerField label="Generated Date" value={selectedBarcode.generatedDate || 'N/A'} />
//               </div>
//             </div>

//             <div>
//               <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Status Information</h3>
//               <div className="space-y-2">
//                 <DrawerField
//                   label="Status"
//                   value={
//                     <Badge variant={selectedBarcode.status === 'Active' ? 'success' : (selectedBarcode.status === 'Unassigned' ? 'warning' : 'neutral')}>
//                       {selectedBarcode.status}
//                     </Badge>
//                   }
//                 />
//               </div>
//             </div>

//             <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
//               {canEdit && <ActionButton onClick={openEditModal}>Edit Barcode</ActionButton>}
//               <ActionButton variant="secondary" onClick={() => setSelectedBarcode(null)}>Close</ActionButton>
//             </div>
//           </div>
//         )}
//       </Drawer>

//       {/* Delete Confirmation Modal */}
//       {itemToDelete && (
//         <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
//           <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center animate-in zoom-in-95 duration-200">
//             <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-4">
//               <Trash2 className="w-6 h-6 text-rose-600" />
//             </div>
//             <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Barcode Record</h3>
//             <p className="text-sm text-slate-500 mb-6">
//               Are you sure you want to delete this barcode record? This action cannot be undone.
//             </p>
//             <div className="flex justify-center gap-3">
//               <button onClick={() => setItemToDelete(null)} className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors">Cancel</button>
//               <button
//                 onClick={handleDelete}
//                 className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 transition-colors"
//               >
//                 Delete
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Generate / Edit Barcode Modal Form */}
//       {showModal && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
//           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
//             <div className="flex items-center justify-between mb-6">
//               <h2 className="text-xl font-bold text-slate-900">{isEditingModal ? 'Edit Barcode' : 'Generate Barcode'}</h2>
//               <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-slate-800">✕</button>
//             </div>

//             {validationError && (
//               <div className="mb-6 p-3 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-600 font-medium">
//                 {validationError}
//               </div>
//             )}

//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               {/* PRODUCT INFORMATION */}
//               <div className="md:col-span-2 mt-2 first:mt-0">
//                 <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">PRODUCT INFORMATION</h3>
//               </div>
//               <div className="md:col-span-2">
//                 <label className="block text-sm font-medium mb-1">Product *</label>
//                 <div className="relative">
//                   <input
//                     type="text"
//                     list="product-suggestions"
//                     value={newBarcode.productName}
//                     onChange={(e) => handleProductSelect(e.target.value)}
//                     placeholder="Search product..."
//                     className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
//                   />
//                   <datalist id="product-suggestions">
//                     {products.map((p) => (
//                       <option key={p.code || p.id} value={p.name} />
//                     ))}
//                   </datalist>
//                 </div>
//               </div>
//               <div className="md:col-span-2">
//                 <label className="block text-sm font-medium mb-1">Product Code</label>
//                 <input 
//                   value={newBarcode.productCode} 
//                   readOnly 
//                   className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 text-slate-500 cursor-not-allowed" 
//                   placeholder="Auto-populated"
//                 />
//               </div>

//               {/* BARCODE INFORMATION */}
//               <div className="md:col-span-2 mt-4">
//                 <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">BARCODE INFORMATION</h3>
//               </div>
//               <div className="md:col-span-2">
//                 <label className="block text-sm font-medium mb-1">Barcode Type *</label>
//                 <select 
//                   value={newBarcode.type} 
//                   onChange={(e) => setNewBarcode({ ...newBarcode, type: e.target.value })} 
//                   className="w-full border border-slate-200 rounded-lg px-3 py-2"
//                 >
//                   <option value="EAN-13">EAN-13</option>
//                   <option value="Code 128">Code 128</option>
//                   <option value="UPC-A">UPC-A</option>
//                 </select>
//               </div>
//               <div className="md:col-span-2">
//                 <label className="block text-sm font-medium mb-1">Barcode Number *</label>
//                 <input 
//                   type="text"
//                   value={newBarcode.barcodeNumber} 
//                   onChange={(e) => setNewBarcode({ ...newBarcode, barcodeNumber: e.target.value })} 
//                   maxLength={20}
//                   className="w-full border border-slate-200 rounded-lg px-3 py-2 font-mono" 
//                   placeholder="Enter unique barcode number"
//                 />
//               </div>

//               {/* ASSIGNMENT INFORMATION */}
//               <div className="md:col-span-2 mt-4">
//                 <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">ASSIGNMENT INFORMATION</h3>
//               </div>
//               <div className="md:col-span-2">
//                 <label className="block text-sm font-medium mb-1">Status *</label>
//                 <select 
//                   value={newBarcode.status} 
//                   onChange={(e) => setNewBarcode({ ...newBarcode, status: e.target.value as any })} 
//                   className="w-full border border-slate-200 rounded-lg px-3 py-2"
//                 >
//                   <option value="Active">Active</option>
//                   <option value="Inactive">Inactive</option>
//                   <option value="Unassigned">Unassigned</option>
//                 </select>
//               </div>

//               {/* AUDIT INFORMATION */}
//               <div className="md:col-span-2 mt-4">
//                 <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">AUDIT INFORMATION</h3>
//               </div>
//               <div>
//                 <label className="block text-sm font-medium mb-1">Generated By</label>
//                 <input 
//                   value={isEditingModal ? (selectedBarcode?.generatedBy || 'System') : 'Admin User'} 
//                   readOnly 
//                   className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 text-slate-500 cursor-not-allowed" 
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium mb-1">Generated Date</label>
//                 <input 
//                   value={isEditingModal ? (selectedBarcode?.generatedDate || 'N/A') : new Date().toISOString().split('T')[0]} 
//                   readOnly 
//                   className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 text-slate-500 cursor-not-allowed" 
//                 />
//               </div>
//             </div>

//             <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-100">
//               <ActionButton variant="secondary" onClick={() => setShowModal(false)}>Cancel</ActionButton>
//               <ActionButton onClick={handleSaveBarcode}>{isEditingModal ? 'Save Changes' : 'Generate Barcode'}</ActionButton>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }


/////////////////////////////////////////////////////////////////////////////////////


// src/modules/products/BarcodeManagement.tsx
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
import authService from "../../services/authService";
import { hasModulePermission } from '../../utils/permissionUtils';

interface Product {
  id: string;
  code: string;
  name: string;
  barcode?: string;
  status?: string;
}

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

interface InvoiceItem {
  productCode: string;
  barcode?: string;
}

interface Invoice {
  items?: InvoiceItem[];
}

export default function BarcodeManagement() {
  const [data, setData] = useState<Barcode[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const currentUser = authService.getCurrentUser();
  
  const [selectedBarcode, setSelectedBarcode] = useState<Barcode | null>(null);
  const [itemToDelete, setItemToDelete] = useState<Barcode | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isEditingModal, setIsEditingModal] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const savedProducts = productService.getProducts() as Product[];
    setProducts(savedProducts || []);
  }, []);

  useEffect(() => {
    const savedData = barcodeService.getAll() as Barcode[];
    setData(savedData || []);
  }, []);

  useEffect(() => {
    if (data.length > 0) {
      barcodeService.saveAll(data);
    }
  }, [data]);

  const activeRole = localStorage.getItem("activeRole") || "";
  const canView = hasModulePermission(activeRole, "Products & Master", "View");
  const canCreate = hasModulePermission(activeRole, "Products & Master", "Create");
  const canEdit = hasModulePermission(activeRole, "Products & Master", "Edit");
  const canDelete = hasModulePermission(activeRole, "Products & Master", "Delete");

  const [newBarcode, setNewBarcode] = useState({
    id: '',
    productName: '',
    productCode: '',
    type: 'EAN-13',
    barcodeNumber: '',
    status: 'Active' as 'Active' | 'Inactive' | 'Unassigned'
  });

  const checkBarcodeInUse = (barcodeItem: Barcode) => {
    const invoices = JSON.parse(localStorage.getItem("billing_gst_invoices") || "[]") as Invoice[];
    return invoices.some((inv) =>
      inv.items?.some((item) => item.barcode === barcodeItem.barcode)
    );
  };

  const getProductDisplay = (code: string, fallbackName: string) => {
    const match = products.find(p => p.code === code);
    return match ? match.name : `${fallbackName} (Deleted Product)`;
  };

  const generateAutoBarcode = (type: string): string => {
    if (type === 'EAN-13') {
      const codeBase = "890" + Math.floor(1000000000 + Math.random() * 9000000000).toString().slice(0, 9);
      let sum = 0;
      for (let i = 0; i < 12; i++) {
        sum += parseInt(codeBase[i]) * (i % 2 === 0 ? 1 : 3);
      }
      const checksum = (10 - (sum % 10)) % 10;
      return codeBase + checksum.toString();
    } else if (type === 'Code 128') {
      return "C128-" + Math.floor(100000 + Math.random() * 900000).toString();
    } else {
      return "QR-" + Math.random().toString(36).substr(2, 9).toUpperCase();
    }
  };

  const validateBarcodeFormat = (barcode: string, type: string): boolean => {
    if (type === 'EAN-13') {
      const eanRegex = /^\d{13}$/;
      return eanRegex.test(barcode);
    }
    if (type === 'Code 128') {
      const code128Regex = /^[A-Za-z0-9-_]{1,20}$/;
      return code128Regex.test(barcode);
    }
    if (type === 'QR Code') {
      return barcode.length >= 3 && barcode.length <= 50;
    }
    return true;
  };

  const columns: Column<Barcode>[] = [
    { key: 'barcode', label: 'Barcode', render: (row) => <span className="font-mono text-slate-800 bg-slate-100 px-2 py-1 rounded">{row.barcode}</span> },
    { key: 'productName', label: 'Assigned Product', render: (row) => <span className="font-semibold text-slate-900">{getProductDisplay(row.productCode, row.productName)}</span> },
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
          {canDelete && (
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
          )}
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
          `="${getProductDisplay(row.productCode, row.productName)}"`, 
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

  const handleProductSelect = (productCode: string) => {
    const product = products.find((p) => p.code === productCode);
    if (product) {
      setNewBarcode((prev) => ({
        ...prev,
        productName: product.name,
        productCode: product.code,
      }));
    } else {
      setNewBarcode((prev) => ({
        ...prev,
        productName: '',
        productCode: '', 
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

    if (!newBarcode.productCode || !newBarcode.type || !newBarcode.status) {
      setValidationError("Please fill all mandatory fields (*).");
      return;
    }

    const matchingProduct = products.find(p => p.code === newBarcode.productCode);
    if (!matchingProduct) {
      setValidationError("Please select a valid existing product from the list.");
      return;
    }

    let resolvedBarcodeNum = newBarcode.barcodeNumber.trim();
    
    // Auto-generate barcode if left empty on save
    if (resolvedBarcodeNum === "") {
      let isGenDuplicate = true;
      let attempts = 0;
      while (isGenDuplicate && attempts < 15) {
        resolvedBarcodeNum = generateAutoBarcode(newBarcode.type);
        isGenDuplicate = data.some(b => b.barcode === resolvedBarcodeNum && b.id !== newBarcode.id);
        attempts++;
      }
    }

    if (!validateBarcodeFormat(resolvedBarcodeNum, newBarcode.type)) {
      setValidationError(`Invalid barcode value format for ${newBarcode.type}. EAN-13 must be exactly 13 digits.`);
      return;
    }

    const isDuplicate = data.some(b => b.barcode === resolvedBarcodeNum && b.id !== newBarcode.id);
    if (isDuplicate) {
      setValidationError("This Barcode Number already exists. Barcode numbers must be unique.");
      return;
    }

    // Auto mark older active barcodes for this same product as Inactive
    let resolvedList = data;
    if (newBarcode.status === 'Active') {
      resolvedList = data.map(item => 
        (item.productCode === newBarcode.productCode && item.status === 'Active' && item.id !== newBarcode.id)
          ? { ...item, status: 'Inactive' as const }
          : item
      );
    }

    const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-');
    
    if (isEditingModal && newBarcode.id) {
      const updatedRecord: Barcode = {
        id: newBarcode.id,
        barcode: resolvedBarcodeNum,
        productCode: newBarcode.productCode,
        productName: matchingProduct.name,
        type: newBarcode.type,
        assignedDate: selectedBarcode?.assignedDate && selectedBarcode.assignedDate !== '-' ? selectedBarcode.assignedDate : today,
        generatedBy: selectedBarcode?.generatedBy || currentUser?.fullName || 'Admin User',
        generatedDate: selectedBarcode?.generatedDate || today,
        status: newBarcode.status as any
      };
      
      setData(resolvedList.map(item => item.id === updatedRecord.id ? updatedRecord : item));

      // Sync back to Product Master
      const productList = productService.getProducts();
      const updatedProducts = productList.map((p: any) =>
        p.code === updatedRecord.productCode ? { ...p, barcode: updatedRecord.barcode } : p
      );
      productService.saveProducts(updatedProducts);

      activityLogService.addLog({
        userId: currentUser?.id,
        userName: currentUser?.fullName,
        action: `Barcode Updated - Product: ${matchingProduct.name}, Barcode: ${resolvedBarcodeNum}`,
        module: "Barcode Management",
      });
      if (selectedBarcode && selectedBarcode.id === updatedRecord.id) {
        setSelectedBarcode(updatedRecord);
      }
    } else {
      const record: Barcode = {
        id: Date.now().toString(),
        barcode: resolvedBarcodeNum,
        productCode: newBarcode.productCode,
        productName: matchingProduct.name,
        type: newBarcode.type,
        assignedDate: today,
        generatedBy: currentUser?.fullName || 'Admin User',
        generatedDate: today,
        status: newBarcode.status as any
      };
      setData([record, ...resolvedList]);

      // Sync back to Product Master
      const productList = productService.getProducts();
      const updatedProducts = productList.map((p: any) =>
        p.code === record.productCode ? { ...p, barcode: record.barcode } : p
      );
      productService.saveProducts(updatedProducts);

      activityLogService.addLog({
        userId: currentUser?.id,
        userName: currentUser?.fullName,
        action: `Barcode Created - Product: ${matchingProduct.name}, Barcode: ${resolvedBarcodeNum}`,
        module: "Barcode Management",
      });
    }
    
    setShowModal(false);
  };

  const handleDelete = () => {
    if (itemToDelete) {
      const inUse = checkBarcodeInUse(itemToDelete);
      if (inUse) {
        const updated = data.map(item =>
          item.id === itemToDelete.id ? { ...item, status: 'Inactive' as const } : item
        );
        setData(updated);
        activityLogService.addLog({
          userId: currentUser?.id,
          userName: currentUser?.fullName,
          action: `Barcode marked Inactive (Delete Blocked due to invoice references) - Barcode: ${itemToDelete.barcode}`,
          module: "Barcode Management",
        });
        alert("Warning: This barcode is referenced in invoices. It has been marked as Inactive instead of deleted to preserve history.");
      } else {
        setData(data.filter(item => item.id !== itemToDelete.id));
        activityLogService.addLog({
          userId: currentUser?.id,
          userName: currentUser?.fullName,
          action: `Barcode Deleted - Barcode: ${itemToDelete.barcode}`,
          module: "Barcode Management",
        });
      }
      setItemToDelete(null);
    }
  };

  if (!canView) {
    return (
      <div className="p-10 text-center">
        <h2 className="text-xl font-semibold">Access Denied</h2>
        <p className="text-slate-500 mt-2">
          You do not have permission to view Barcode Management.
        </p>
      </div>
    );
  }

  // Only allow active products to be mapped to barcodes
  const activeProducts = products.filter(p => !p.status || p.status === 'Active');

  return (
    <div className="animate-in fade-in duration-500 bg-white">
      <PageHeader
        title="Barcode Management"
        subtitle="Manage product barcodes, EAN/UPC mapping, and generation."
        actions={
          <>
            <ActionButton variant="secondary" icon={<Download className="w-4 h-4" />} onClick={handleExport}>
              Export
            </ActionButton>
            {canCreate && (
              <ActionButton icon={<Plus className="w-4 h-4" />} onClick={openNewModal}>
                Generate Barcode
              </ActionButton>
            )}
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
                <DrawerField label="Product Name" value={getProductDisplay(selectedBarcode.productCode, selectedBarcode.productName)} />
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
              {canEdit && selectedBarcode.status !== 'Inactive' && (
                <ActionButton onClick={openEditModal}>Edit Barcode</ActionButton>
              )}
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
              Are you sure you want to delete this barcode record? If this barcode has already been used in billing invoices, it will be marked Inactive instead of permanently deleted.
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
                <select
                  value={newBarcode.productCode}
                  onChange={(e) => handleProductSelect(e.target.value)}
                  disabled={isEditingModal}
                  className={`w-full border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-900 ${
                    isEditingModal ? "bg-slate-50 opacity-70 cursor-not-allowed" : ""
                  }`}
                >
                  <option value="">Select Product</option>
                  {activeProducts.map((p) => (
                    <option key={p.code} value={p.code}>
                      {p.code} - {p.name}
                    </option>
                  ))}
                </select>
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
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-900"
                >
                  <option value="EAN-13">EAN-13</option>
                  <option value="Code 128">Code 128</option>
                  <option value="QR Code">QR Code</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Barcode Number</label>
                <div className="flex gap-2">
                  <input 
                    type="text"
                    value={newBarcode.barcodeNumber} 
                    onChange={(e) => setNewBarcode({ ...newBarcode, barcodeNumber: e.target.value })} 
                    className="flex-1 border border-slate-200 rounded-lg px-3 py-2 font-mono bg-white text-slate-900" 
                    placeholder="Leave blank to auto-generate"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const autoCode = generateAutoBarcode(newBarcode.type);
                      setNewBarcode({ ...newBarcode, barcodeNumber: autoCode });
                    }}
                    className="px-3 py-2 bg-violet-50 text-violet-600 border border-violet-200 rounded-lg text-sm font-medium hover:bg-violet-100 transition-colors"
                  >
                    Auto-Generate
                  </button>
                </div>
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
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-900"
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
                  value={isEditingModal ? (selectedBarcode?.generatedBy || 'System') : (currentUser?.fullName || 'Admin User')} 
                  readOnly 
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 text-slate-500 cursor-not-allowed" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Generated Date</label>
                <input 
                  value={isEditingModal ? (selectedBarcode?.generatedDate || 'N/A') : new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-')} 
                  readOnly 
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 text-slate-500 cursor-not-allowed" 
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <ActionButton onClick={handleSaveBarcode}>{isEditingModal ? 'Save Changes' : 'Generate Barcode'}</ActionButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}