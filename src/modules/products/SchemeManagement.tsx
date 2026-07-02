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

// import { schemeService } from "../../services/schemeService";
// import activityLogService from "../../services/activityLogService";
// import authService from "../../services/authService";
// import { hasModulePermission } from "../../utils/permissionUtils";

// interface Scheme {
//   id: string;
//   schemeCode: string;
//   name: string;
//   type: string;
//   applicableTo: string;
//   applicableSelection: string;
//   benefitType: string;
//   benefitValue: string;
//   minQuantity: string;
//   freeQuantity: string;
//   validFrom: string;
//   validTo: string;
//   remarks: string;
//   status: 'Active' | 'Upcoming' | 'Expired' | 'Draft' | 'Cancelled';
// }

// const initialMockData: Scheme[] = [
//   { id: '1', schemeCode: 'SCH-10+1', name: 'Buy 10 Get 1 Free', type: 'Quantity Discount', applicableTo: 'All Products', applicableSelection: '', benefitType: 'Free Quantity', benefitValue: '1', minQuantity: '10', freeQuantity: '1', validFrom: '2025-11-01', validTo: '2025-12-31', remarks: 'Year-end stock clearance.', status: 'Active' },
//   { id: '2', schemeCode: 'SCH-FLAT-5', name: 'Flat 5% Off PTR', type: 'Cash Discount', applicableTo: 'Brand', applicableSelection: 'Pain Relief Products', benefitType: 'Percentage Discount', benefitValue: '5', minQuantity: '50', freeQuantity: '0', validFrom: '2025-10-15', validTo: '2025-11-30', remarks: 'Exclusive for Pain Relief brand.', status: 'Active' },
//   { id: '3', schemeCode: 'SCH-WINTER', name: 'Winter Stock Up', type: 'Seasonal Offer', applicableTo: 'Category', applicableSelection: 'Antibiotics', benefitType: 'Flat Discount', benefitValue: '500', minQuantity: '100', freeQuantity: '0', validFrom: '2026-01-01', validTo: '2026-02-28', remarks: 'Flat ₹500 off on bulk antibiotic orders.', status: 'Upcoming' },
//   { id: '4', schemeCode: 'SCH-LAUNCH', name: 'New Launch Promo', type: 'Launch Offer', applicableTo: 'Product', applicableSelection: 'Paracetamol 650mg', benefitType: 'Cash Back', benefitValue: '1000', minQuantity: '200', freeQuantity: '0', validFrom: '2025-09-01', validTo: '2025-09-30', remarks: 'Launch cashback offer.', status: 'Expired' },
// ];

// export default function SchemeManagement() {
//   const [data, setData] = useState<Scheme[]>([]);
//   useEffect(() => {
//     const savedData = schemeService.getAll();

//     if (savedData.length > 0) {
//       setData(savedData);
//     } else {
//       setData(initialMockData);
//       schemeService.saveAll(initialMockData);
//     }
//   }, []);
//   useEffect(() => {
//     if (data.length > 0) {
//       schemeService.saveAll(data);
//     }
//   }, [data]);

//   const [search, setSearch] = useState('');
//   const [statusFilter, setStatusFilter] = useState('');
  
//   const [selectedScheme, setSelectedScheme] = useState<Scheme | null>(null);
//   const [itemToDelete, setItemToDelete] = useState<Scheme | null>(null);
//   const [showModal, setShowModal] = useState(false);
//   const [isEditingModal, setIsEditingModal] = useState(false);
//   const currentUser = authService.getCurrentUser();
//   const activeRole = localStorage.getItem("activeRole") || "";

//   const canView = hasModulePermission(activeRole, "Products & Master", "View");
//   const canCreate = hasModulePermission(activeRole, "Products & Master", "Create");
//   const canEdit = hasModulePermission(activeRole, "Products & Master", "Edit");
//   const canDelete = hasModulePermission(activeRole, "Products & Master", "Delete");

//   const [newScheme, setNewScheme] = useState({
//     id: '',
//     schemeCode: '',
//     name: '',
//     type: 'Quantity Discount',
//     applicableTo: 'All Products',
//     applicableSelection: '',
//     benefitType: 'Free Quantity',
//     benefitValue: '',
//     minQuantity: '',
//     freeQuantity: '',
//     validFrom: '',
//     validTo: '',
//     remarks: '',
//     status: 'Draft' as 'Active' | 'Upcoming' | 'Expired' | 'Draft' | 'Cancelled',
//   });

//   const columns: Column<Scheme>[] = [
//     { key: 'schemeCode', label: 'Scheme Code', render: (row) => <span className="font-mono text-violet-700 bg-violet-50 px-2 py-1 rounded">{row.schemeCode}</span> },
//     { key: 'name', label: 'Scheme Name', render: (row) => <span className="font-semibold text-slate-900">{row.name}</span> },
//     { key: 'type', label: 'Type' },
//     { key: 'applicableTo', label: 'Applicable To', render: (row) => <span>{row.applicableTo || '-'}</span> },
//     { key: 'validFrom', label: 'Valid From' },
//     { key: 'validTo', label: 'Valid To' },
//     {
//       key: 'status',
//       label: 'Status',
//       render: (row) => {
//         const variant = row.status === 'Active' ? 'success' : row.status === 'Upcoming' ? 'info' : (row.status === 'Draft' ? 'warning' : 'danger');
//         return <Badge variant={variant}>{row.status}</Badge>;
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
//               setSelectedScheme(row);
//             }}
//             className="text-violet-600 font-medium hover:text-violet-800"
//           >
//             View
//           </button>
//           {canDelete && (
//           <button
//             onClick={(e) => {
//               e.stopPropagation();
//               setItemToDelete(row);
//             }}
//             className="text-rose-600 font-medium hover:text-rose-800"
//             title="Delete"
//           >
//             <Trash2 className="w-4 h-4" />
//           </button>
//           )}
//         </div>
//       )
//     }
//   ];

//   const filteredData = data.filter((item) => {
//     const matchSearch = item.name.toLowerCase().includes(search.toLowerCase()) || item.schemeCode.toLowerCase().includes(search.toLowerCase());
//     const matchStatus = statusFilter ? item.status === statusFilter : true;
//     return matchSearch && matchStatus;
//   });

//   const handleExport = () => {
//     const headers = ['Scheme Code', 'Scheme Name', 'Type', 'Applicable To', 'Valid From', 'Valid To', 'Status'];
//     const csvContent = [
//       headers.join(','),
//       ...filteredData.map(row => 
//         [
//           `="${row.schemeCode}"`, 
//           `="${row.name}"`, 
//           `="${row.type}"`, 
//           `="${row.applicableTo || '-'}"`, 
//           `="${row.validFrom}"`, 
//           `="${row.validTo}"`, 
//           row.status
//         ].join(',')
//       )
//     ].join('\n');
    
//     const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
//     const link = document.createElement('a');
//     const url = URL.createObjectURL(blob);
//     link.setAttribute('href', url);
//     link.setAttribute('download', 'scheme_management_export.csv');
//     link.style.visibility = 'hidden';
//     document.body.appendChild(link);
//     link.click();
//     document.body.removeChild(link);
//   };

//   const openNewModal = () => {
//     setIsEditingModal(false);
//     setNewScheme({
//       id: '',
//       schemeCode: '',
//       name: '',
//       type: 'Quantity Discount',
//       applicableTo: 'All Products',
//       applicableSelection: '',
//       benefitType: 'Free Quantity',
//       benefitValue: '',
//       minQuantity: '',
//       freeQuantity: '',
//       validFrom: '',
//       validTo: '',
//       remarks: '',
//       status: 'Draft'
//     });
//     setShowModal(true);
//   };

//   const openEditModal = () => {
//     if (!selectedScheme) return;
//     setIsEditingModal(true);
//     setNewScheme({
//       id: selectedScheme.id,
//       schemeCode: selectedScheme.schemeCode,
//       name: selectedScheme.name,
//       type: selectedScheme.type,
//       applicableTo: selectedScheme.applicableTo,
//       applicableSelection: selectedScheme.applicableSelection,
//       benefitType: selectedScheme.benefitType,
//       benefitValue: selectedScheme.benefitValue,
//       minQuantity: selectedScheme.minQuantity,
//       freeQuantity: selectedScheme.freeQuantity,
//       validFrom: selectedScheme.validFrom,
//       validTo: selectedScheme.validTo,
//       remarks: selectedScheme.remarks,
//       status: selectedScheme.status
//     });
//     setShowModal(true);
//   };

//   const handleSaveScheme = () => {
//     if (!newScheme.schemeCode || !newScheme.name || !newScheme.type || !newScheme.benefitType || !newScheme.benefitValue || !newScheme.validFrom || !newScheme.validTo || !newScheme.status) {
//       alert("Please fill all mandatory fields (*).");
//       return;
//     }
    
//     if (isEditingModal && newScheme.id) {
//       const updatedRecord: Scheme = {
//         ...newScheme,
//         status: newScheme.status as 'Active' | 'Upcoming' | 'Expired' | 'Draft' | 'Cancelled'
//       };
      
//       setData(data.map(item => item.id === updatedRecord.id ? updatedRecord : item));
//       activityLogService.addLog({
//         userId: currentUser?.id,
//         userName: currentUser?.fullName,
//         action: "Scheme Updated",
//         module: "Scheme Management",
//       });
//       if (selectedScheme && selectedScheme.id === updatedRecord.id) {
//         setSelectedScheme(updatedRecord);
//       }
//     } else {
//       const record: Scheme = {
//         ...newScheme,
//         id: Date.now().toString(),
//         status: newScheme.status as 'Active' | 'Upcoming' | 'Expired' | 'Draft' | 'Cancelled'
//       };
//       setData([record, ...data]);
//       activityLogService.addLog({
//         userId: currentUser?.id,
//         userName: currentUser?.fullName,
//         action: "Scheme Created",
//         module: "Scheme Management",
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
//         action: "Scheme Deleted",
//         module: "Scheme Management",
//       });
//       setItemToDelete(null);
//     }
//   };

//   return (
//     <div className="animate-in fade-in duration-500">
//       <PageHeader
//         title="Scheme Management"
//         subtitle="Manage promotional schemes, discounts, and free goods offers."
//         actions={
//           <>
//             <ActionButton
//               variant="secondary"
//               icon={<Download className="w-4 h-4" />}
//               onClick={handleExport}
//             >
//               Export
//             </ActionButton>
//             {canCreate && (
//               <ActionButton
//                 icon={<Plus className="w-4 h-4" />}
//                 onClick={openNewModal}
//               >
//                 Create Scheme
//               </ActionButton>
//             )}
//           </>
//         }
//       />

//       <FilterBar>
//         <SearchInput
//           value={search}
//           onChange={setSearch}
//           placeholder="Search schemes..."
//         />
//         <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
//         <div className="flex items-center gap-2">
//           <Filter className="w-4 h-4 text-slate-400" />
//           <span className="text-sm font-medium text-slate-600">Filters:</span>
//         </div>
//         <SelectFilter
//           value={statusFilter}
//           onChange={setStatusFilter}
//           options={[
//             { label: "Active", value: "Active" },
//             { label: "Upcoming", value: "Upcoming" },
//             { label: "Expired", value: "Expired" },
//             { label: "Draft", value: "Draft" },
//             { label: "Cancelled", value: "Cancelled" },
//           ]}
//           placeholder="All Status"
//         />
//       </FilterBar>

//       <TableCard>
//         <DataTable
//           columns={columns}
//           data={filteredData}
//           onRowClick={(row) => setSelectedScheme(row)}
//           emptyMessage="No promotional schemes found."
//         />
//       </TableCard>

//       {/* Scheme Details Drawer */}
//       <Drawer
//         open={!!selectedScheme}
//         onClose={() => setSelectedScheme(null)}
//         title="Scheme Details"
//       >
//         {selectedScheme && (
//           <div className="space-y-6">
//             <div>
//               <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">
//                 Scheme Information
//               </h3>
//               <div className="space-y-2">
//                 <DrawerField
//                   label="Scheme Code"
//                   value={
//                     <span className="font-mono text-violet-700 bg-violet-50 px-2 py-1 rounded">
//                       {selectedScheme.schemeCode}
//                     </span>
//                   }
//                 />
//                 <DrawerField label="Scheme Name" value={selectedScheme.name} />
//                 <DrawerField label="Scheme Type" value={selectedScheme.type} />
//               </div>
//             </div>

//             <div>
//               <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">
//                 Applicability Information
//               </h3>
//               <div className="space-y-2">
//                 <DrawerField
//                   label="Applicable To"
//                   value={selectedScheme.applicableTo || "-"}
//                 />
//                 {selectedScheme.applicableTo !== "All Products" && (
//                   <DrawerField
//                     label="Product / Category / Brand"
//                     value={selectedScheme.applicableSelection || "-"}
//                   />
//                 )}
//               </div>
//             </div>

//             <div>
//               <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">
//                 Benefit Information
//               </h3>
//               <div className="space-y-2">
//                 <DrawerField
//                   label="Benefit Type"
//                   value={selectedScheme.benefitType}
//                 />
//                 <DrawerField
//                   label="Benefit Value"
//                   value={selectedScheme.benefitValue}
//                 />
//               </div>
//             </div>

//             <div>
//               <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">
//                 Quantity Criteria
//               </h3>
//               <div className="space-y-2">
//                 <DrawerField
//                   label="Min Purchase Qty"
//                   value={selectedScheme.minQuantity || "N/A"}
//                 />
//                 <DrawerField
//                   label="Free Qty"
//                   value={selectedScheme.freeQuantity || "N/A"}
//                 />
//               </div>
//             </div>

//             <div>
//               <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">
//                 Validity Information
//               </h3>
//               <div className="space-y-2">
//                 <DrawerField
//                   label="Valid From"
//                   value={selectedScheme.validFrom}
//                 />
//                 <DrawerField label="Valid To" value={selectedScheme.validTo} />
//               </div>
//             </div>

//             <div>
//               <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">
//                 Additional & Status
//               </h3>
//               <div className="space-y-2">
//                 <DrawerField
//                   label="Remarks"
//                   value={selectedScheme.remarks || "N/A"}
//                 />
//                 <DrawerField
//                   label="Status"
//                   value={
//                     <Badge
//                       variant={
//                         selectedScheme.status === "Active"
//                           ? "success"
//                           : selectedScheme.status === "Upcoming"
//                             ? "info"
//                             : selectedScheme.status === "Draft"
//                               ? "warning"
//                               : "danger"
//                       }
//                     >
//                       {selectedScheme.status}
//                     </Badge>
//                   }
//                 />
//               </div>
//             </div>

//             <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
//               {canEdit && (
//                 <ActionButton onClick={openEditModal}>Edit Scheme</ActionButton>
//               )}
//               <ActionButton
//                 variant="secondary"
//                 onClick={() => setSelectedScheme(null)}
//               >
//                 Close
//               </ActionButton>
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
//             <h3 className="text-lg font-bold text-slate-900 mb-2">
//               Delete Scheme
//             </h3>
//             <p className="text-sm text-slate-500 mb-6">
//               Are you sure you want to delete this promotional scheme? This
//               action cannot be undone.
//             </p>
//             <div className="flex justify-center gap-3">
//               <button
//                 onClick={() => setItemToDelete(null)}
//                 className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
//               >
//                 Cancel
//               </button>
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

//       {/* Create / Edit Scheme Modal Form */}
//       {showModal && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
//           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
//             <div className="flex items-center justify-between mb-6">
//               <h2 className="text-xl font-bold text-slate-900">
//                 {isEditingModal ? "Edit Scheme" : "Create Scheme"}
//               </h2>
//               <button
//                 onClick={() => setShowModal(false)}
//                 className="text-slate-500 hover:text-slate-800"
//               >
//                 ✕
//               </button>
//             </div>

//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               {/* SCHEME INFORMATION */}
//               <div className="md:col-span-2 mt-2 first:mt-0">
//                 <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">
//                   SCHEME INFORMATION
//                 </h3>
//               </div>
//               <div className="md:col-span-2">
//                 <label className="block text-sm font-medium mb-1">
//                   Scheme Code *
//                 </label>
//                 <input
//                   type="text"
//                   maxLength={20}
//                   value={newScheme.schemeCode}
//                   onChange={(e) =>
//                     setNewScheme({ ...newScheme, schemeCode: e.target.value.slice(0, 20) })
//                   }
//                   className="w-full border border-slate-200 rounded-lg px-3 py-2 font-mono focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
//                   placeholder="e.g. SCH-10+1"
//                 />
//               </div>
//               <div className="md:col-span-2">
//                 <label className="block text-sm font-medium mb-1">
//                   Scheme Name *
//                 </label>
//                 <input
//                   type="text"
//                   maxLength={20}
//                   value={newScheme.name}
//                   onChange={(e) =>
//                     setNewScheme({ ...newScheme, name: e.target.value.slice(0, 20) })
//                   }
//                   className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
//                   placeholder="e.g. Buy 10 Get 1 Free"
//                 />
//               </div>
//               <div className="md:col-span-2">
//                 <label className="block text-sm font-medium mb-1">
//                   Scheme Type *
//                 </label>
//                 <select
//                   value={newScheme.type}
//                   onChange={(e) =>
//                     setNewScheme({ ...newScheme, type: e.target.value })
//                   }
//                   className="w-full border border-slate-200 rounded-lg px-3 py-2"
//                 >
//                   <option value="Quantity Discount">Quantity Discount</option>
//                   <option value="Cash Discount">Cash Discount</option>
//                   <option value="Percentage Discount">
//                     Percentage Discount
//                   </option>
//                   <option value="Free Goods">Free Goods</option>
//                   <option value="Seasonal Offer">Seasonal Offer</option>
//                   <option value="Launch Offer">Launch Offer</option>
//                 </select>
//               </div>

//               {/* APPLICABILITY INFORMATION */}
//               <div className="md:col-span-2 mt-4">
//                 <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">
//                   APPLICABILITY INFORMATION
//                 </h3>
//               </div>
//               <div>
//                 <label className="block text-sm font-medium mb-1">
//                   Applicable To
//                 </label>
//                 <select
//                   value={newScheme.applicableTo}
//                   onChange={(e) => {
//                     const value = e.target.value;
//                     setNewScheme({
//                       ...newScheme,
//                       applicableTo: value,
//                       applicableSelection:
//                         value === "All Products"
//                           ? ""
//                           : newScheme.applicableSelection,
//                     });
//                   }}
//                   className="w-full border border-slate-200 rounded-lg px-3 py-2"
//                 >
//                   <option value="Product">Product</option>
//                   <option value="Category">Category</option>
//                   <option value="Brand">Brand</option>
//                   <option value="All Products">All Products</option>
//                 </select>
//               </div>
//               <div>
//                 <label className="block text-sm font-medium mb-1">
//                   Product / Category / Brand Selection
//                 </label>
//                 <input
//                   type="text"
//                   maxLength={20}
//                   disabled={newScheme.applicableTo === "All Products"}
//                   value={newScheme.applicableSelection}
//                   onChange={(e) =>
//                     setNewScheme({
//                       ...newScheme,
//                       applicableSelection: e.target.value.slice(0, 20),
//                     })
//                   }
//                   className={`w-full border border-slate-200 rounded-lg px-3 py-2 ${newScheme.applicableTo === "All Products" ? "bg-slate-100 cursor-not-allowed text-slate-400" : "bg-white"}`}
//                   placeholder={
//                     newScheme.applicableTo === "All Products"
//                       ? "Not Applicable"
//                       : `Select ${newScheme.applicableTo}...`
//                   }
//                 />
//               </div>

//               {/* BENEFIT INFORMATION */}
//               <div className="md:col-span-2 mt-4">
//                 <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">
//                   BENEFIT INFORMATION
//                 </h3>
//               </div>
//               <div>
//                 <label className="block text-sm font-medium mb-1">
//                   Benefit Type *
//                 </label>
//                 <select
//                   value={newScheme.benefitType}
//                   onChange={(e) =>
//                     setNewScheme({ ...newScheme, benefitType: e.target.value })
//                   }
//                   className="w-full border border-slate-200 rounded-lg px-3 py-2"
//                 >
//                   <option value="Free Quantity">Free Quantity</option>
//                   <option value="Percentage Discount">
//                     Percentage Discount
//                   </option>
//                   <option value="Flat Discount">Flat Discount</option>
//                   <option value="Cash Back">Cash Back</option>
//                 </select>
//               </div>
//               <div>
//                 <label className="block text-sm font-medium mb-1">
//                   Benefit Value *
//                 </label>
//                 <input
//                   type="number"
//                   maxLength={20}
//                   value={newScheme.benefitValue}
//                   onChange={(e) =>
//                     setNewScheme({ ...newScheme, benefitValue: e.target.value.slice(0, 20) })
//                   }
//                   className="w-full border border-slate-200 rounded-lg px-3 py-2"
//                   placeholder="e.g. 5"
//                 />
//               </div>

//               {/* QUANTITY CRITERIA */}
//               <div className="md:col-span-2 mt-4">
//                 <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">
//                   QUANTITY CRITERIA
//                 </h3>
//               </div>
//               <div>
//                 <label className="block text-sm font-medium mb-1">
//                   Minimum Purchase Quantity
//                 </label>
//                 <input
//                   type="number"
//                   maxLength={20}
//                   value={newScheme.minQuantity}
//                   onChange={(e) =>
//                     setNewScheme({ ...newScheme, minQuantity: e.target.value.slice(0, 20) })
//                   }
//                   className="w-full border border-slate-200 rounded-lg px-3 py-2"
//                   placeholder="e.g. 10"
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium mb-1">
//                   Free Quantity
//                 </label>
//                 <input
//                   type="number"
//                   maxLength={20}
//                   value={newScheme.freeQuantity}
//                   onChange={(e) =>
//                     setNewScheme({ ...newScheme, freeQuantity: e.target.value.slice(0, 20) })
//                   }
//                   className="w-full border border-slate-200 rounded-lg px-3 py-2"
//                   placeholder="e.g. 1"
//                 />
//               </div>

//               {/* VALIDITY INFORMATION */}
//               <div className="md:col-span-2 mt-4">
//                 <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">
//                   VALIDITY INFORMATION
//                 </h3>
//               </div>
//               <div>
//                 <label className="block text-sm font-medium mb-1">
//                   Valid From *
//                 </label>
//                 <input
//                   type="date"
//                   value={newScheme.validFrom}
//                   onChange={(e) =>
//                     setNewScheme({ ...newScheme, validFrom: e.target.value })
//                   }
//                   className="w-full border border-slate-200 rounded-lg px-3 py-2"
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium mb-1">
//                   Valid To *
//                 </label>
//                 <input
//                   type="date"
//                   value={newScheme.validTo}
//                   onChange={(e) =>
//                     setNewScheme({ ...newScheme, validTo: e.target.value })
//                   }
//                   className="w-full border border-slate-200 rounded-lg px-3 py-2"
//                 />
//               </div>

//               {/* ADDITIONAL & STATUS INFORMATION */}
//               <div className="md:col-span-2 mt-4">
//                 <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">
//                   ADDITIONAL & STATUS INFORMATION
//                 </h3>
//               </div>
//               <div className="md:col-span-2">
//                 <label className="block text-sm font-medium mb-1">
//                   Remarks
//                 </label>
//                 <textarea
//                   rows={2}
//                   maxLength={20}
//                   value={newScheme.remarks}
//                   onChange={(e) =>
//                     setNewScheme({ ...newScheme, remarks: e.target.value.slice(0, 20) })
//                   }
//                   className="w-full border border-slate-200 rounded-lg px-3 py-2"
//                   placeholder="Enter remarks..."
//                 />
//               </div>
//               <div className="md:col-span-2">
//                 <label className="block text-sm font-medium mb-1">
//                   Status *
//                 </label>
//                 <select
//                   value={newScheme.status}
//                   onChange={(e) =>
//                     setNewScheme({
//                       ...newScheme,
//                       status: e.target.value as any,
//                     })
//                   }
//                   className="w-full border border-slate-200 rounded-lg px-3 py-2"
//                 >
//                   <option value="Draft">Draft</option>
//                   <option value="Active">Active</option>
//                   <option value="Upcoming">Upcoming</option>
//                   <option value="Expired">Expired</option>
//                   <option value="Cancelled">Cancelled</option>
//                 </select>
//               </div>
//             </div>

//             <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-100">
//               <ActionButton
//                 variant="secondary"
//                 onClick={() => setShowModal(false)}
//               >
//                 Cancel
//               </ActionButton>
//               <ActionButton onClick={handleSaveScheme}>
//                 {isEditingModal ? "Save Changes" : "Create Scheme"}
//               </ActionButton>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

//////////////////////////////////////////////////////////////////////////////////////


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

import { schemeService } from "../../services/schemeService";
import { productService } from "../../services/productService";
import activityLogService from "../../services/activityLogService";
import authService from "../../services/authService";
import { hasModulePermission } from "../../utils/permissionUtils";

interface Product {
  id: string;
  code: string;
  name: string;
  category: string;
  manufacturer?: string;
  brand?: string;
  status?: string;
}

interface Scheme {
  id: string;
  schemeCode: string;
  name: string;
  type: string;
  applicableTo: 'Product' | 'Category' | 'Brand' | 'All Products';
  applicableSelection: string;
  benefitType: string;
  benefitValue: string;
  minQuantity: string;
  freeQuantity: string;
  validFrom: string;
  validTo: string;
  priority: number;
  remarks: string;
  status: 'Active' | 'Upcoming' | 'Expired' | 'Draft' | 'Cancelled';
}

export default function SchemeManagement() {
  const [data, setData] = useState<Scheme[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);

  
  const todayStr = new Date().toISOString().split('T')[0];
  const resolveSchemeStatus = (validFromStr: string, validToStr: string, currentStatus: Scheme['status']): Scheme['status'] => {
    if (['Cancelled', 'Draft'].includes(currentStatus)) {
      return currentStatus;
    }
    
    if (todayStr < validFromStr) {
      return 'Upcoming';
    } else if (todayStr > validToStr) {
      return 'Expired';
    } else {
      return 'Active';
    }
  };

  useEffect(() => {
    const savedProducts = productService.getProducts() as Product[];
    setProducts(savedProducts);

    // Extract categories and manufacturer brands dynamically from product definitions
    const extractedCategories = Array.from(new Set(savedProducts.map((p) => p.category).filter(Boolean))) as string[];
    const extractedBrands = Array.from(new Set(savedProducts.map((p) => p.brand || p.manufacturer).filter(Boolean))) as string[];
    setCategories(extractedCategories);
    setBrands(extractedBrands);

    const savedData = schemeService.getAll() as Scheme[];
    let loadedData = savedData;
    
    // Auto-resolve dates on page load
    let changed = false;
    
    const updatedData = loadedData.map((item: Scheme) => {
      const resolved = resolveSchemeStatus(item.validFrom, item.validTo, item.status);
      if (resolved !== item.status) {
        changed = true;
        return { ...item, status: resolved };
      }
      return item;
    });

    setData(updatedData);
    if (changed) {
      schemeService.saveAll(updatedData);
    }
  }, []);

  useEffect(() => {
    if (data.length > 0) {
      schemeService.saveAll(data);
    }
  }, [data]);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  const [selectedScheme, setSelectedScheme] = useState<Scheme | null>(null);
  const [itemToDelete, setItemToDelete] = useState<Scheme | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isEditingModal, setIsEditingModal] = useState(false);
  const currentUser = authService.getCurrentUser();
  const activeRole = localStorage.getItem("activeRole") || "";

  const canView = hasModulePermission(activeRole, "Products & Master", "View");
  const canCreate = hasModulePermission(activeRole, "Products & Master", "Create");
  const canEdit = hasModulePermission(activeRole, "Products & Master", "Edit");
  const canDelete = hasModulePermission(activeRole, "Products & Master", "Delete");

  const [newScheme, setNewScheme] = useState({
    id: '',
    schemeCode: '',
    name: '',
    type: 'Quantity Discount',
    applicableTo: 'All Products' as Scheme['applicableTo'],
    applicableSelection: '',
    benefitType: 'Free Quantity',
    benefitValue: '',
    minQuantity: '',
    freeQuantity: '',
    validFrom: new Date().toISOString().split('T')[0],
    validTo: '',
    priority: 1,
    remarks: '',
    status: 'Draft' as Scheme['status'],
  });

  const checkSchemeInUse = (schemeItem: Scheme) => {
    const invoices = JSON.parse(localStorage.getItem("billing_gst_invoices") || "[]");
    return invoices.some((inv: any) =>
      inv.items?.some((item: any) => item.schemeCode === schemeItem.schemeCode)
    );
  };

  const checkSchemeOverlap = (newSch: typeof newScheme, list: Scheme[]) => {
    if (newSch.status !== 'Active') return false;
    return list.some(item => {
      if (item.id === newSch.id || item.status !== 'Active') return false;
      
      // Matches same target
      if (item.applicableTo === newSch.applicableTo && item.applicableSelection === newSch.applicableSelection) {
        // Date overlap check: (StartA <= EndB) and (EndA >= StartB)
        const newFrom = newSch.validFrom;
        const newTo = newSch.validTo;
        const itemFrom = item.validFrom;
        const itemTo = item.validTo;
        return (newFrom <= itemTo && newTo >= itemFrom);
      }
      return false;
    });
  };

  const getApplicableSelectionText = (applicableTo: string, selection: string) => {
    if (applicableTo === "Product") {
      const match = products.find(p => p.code === selection);
      return match ? match.name : `${selection} (Deleted Product)`;
    }
    return selection;
  };

  const columns: Column<Scheme>[] = [
    { key: 'schemeCode', label: 'Scheme Code', render: (row) => <span className="font-mono text-violet-700 bg-violet-50 px-2 py-1 rounded">{row.schemeCode}</span> },
    { key: 'name', label: 'Scheme Name', render: (row) => <span className="font-semibold text-slate-900">{row.name}</span> },
    { key: 'type', label: 'Type' },
    { key: 'applicableTo', label: 'Applicable To', render: (row) => <span>{row.applicableTo || '-'}</span> },
    { key: 'applicableSelection', label: 'Selection target', render: (row) => <span>{getApplicableSelectionText(row.applicableTo, row.applicableSelection) || '-'}</span> },
    { key: 'validFrom', label: 'Valid From' },
    { key: 'validTo', label: 'Valid To' },
    { key: 'priority', label: 'Priority' },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const variant = row.status === 'Active' ? 'success' : row.status === 'Upcoming' ? 'info' : (row.status === 'Draft' ? 'warning' : 'danger');
        return <Badge variant={variant}>{row.status}</Badge>;
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
              setSelectedScheme(row);
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
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase()) || item.schemeCode.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  const handleExport = () => {
    const headers = [
      'Scheme Code', 
      'Scheme Name', 
      'Type', 
      'Applicable To', 
      'Selection', 
      'Benefit Type', 
      'Benefit Value', 
      'Min Qty', 
      'Free Qty', 
      'Valid From', 
      'Valid To', 
      'Priority', 
      'Status'
    ];
    const csvContent = [
      headers.join(','),
      ...filteredData.map(row => 
        [
          `="${row.schemeCode}"`, 
          `="${row.name}"`, 
          `="${row.type}"`, 
          `="${row.applicableTo || '-'}"`, 
          `="${getApplicableSelectionText(row.applicableTo, row.applicableSelection) || '-'}"`, 
          `="${row.benefitType}"`, 
          `="${row.benefitValue}"`, 
          `="${row.minQuantity || '-'}"`, 
          `="${row.freeQuantity || '-'}"`, 
          `="${row.validFrom}"`, 
          `="${row.validTo}"`, 
          row.priority,
          row.status
        ].join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'scheme_management_export.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openNewModal = () => {
    setIsEditingModal(false);
    setNewScheme({
      id: '',
      schemeCode: '',
      name: '',
      type: 'Quantity Discount',
      applicableTo: 'All Products',
      applicableSelection: '',
      benefitType: 'Free Quantity',
      benefitValue: '',
      minQuantity: '',
      freeQuantity: '',
      validFrom: new Date().toISOString().split('T')[0],
      validTo: '',
      priority: 1,
      remarks: '',
      status: 'Draft'
    });
    setShowModal(true);
  };

  const openEditModal = () => {
    if (!selectedScheme) return;
    if (selectedScheme.status === 'Cancelled' || selectedScheme.status === 'Expired') {
      alert("Error: Cannot edit Cancelled or Expired scheme campaigns.");
      return;
    }
    if (checkSchemeInUse(selectedScheme)) {
      alert("Error: Cannot edit schemes that have already been applied to invoices.");
      return;
    }
    setIsEditingModal(true);
    setNewScheme({
      id: selectedScheme.id,
      schemeCode: selectedScheme.schemeCode,
      name: selectedScheme.name,
      type: selectedScheme.type,
      applicableTo: selectedScheme.applicableTo,
      applicableSelection: selectedScheme.applicableSelection,
      benefitType: selectedScheme.benefitType,
      benefitValue: selectedScheme.benefitValue,
      minQuantity: selectedScheme.minQuantity,
      freeQuantity: selectedScheme.freeQuantity,
      validFrom: selectedScheme.validFrom,
      validTo: selectedScheme.validTo,
      priority: selectedScheme.priority || 1,
      remarks: selectedScheme.remarks,
      status: selectedScheme.status
    });
    setShowModal(true);
  };

  const handleSaveScheme = () => {
    if (!newScheme.schemeCode || !newScheme.name || !newScheme.type || !newScheme.benefitType || !newScheme.benefitValue || !newScheme.validFrom || !newScheme.validTo || !newScheme.status) {
      alert("Please fill all mandatory fields (*).");
      return;
    }

    // Dynamic product selection validation
    if (newScheme.applicableTo !== "All Products" && !newScheme.applicableSelection) {
      alert(`Error: Please select a target ${newScheme.applicableTo} for applicability.`);
      return;
    }

    // Valid To must be after Valid From
    if (newScheme.validTo < newScheme.validFrom) {
      alert("Error: The validity ending date (Valid To) cannot be earlier than start date (Valid From).");
      return;
    }

    // Priority range validation (1 to 10)
    const priorityVal = Number(newScheme.priority) || 1;
    if (priorityVal < 1 || priorityVal > 10) {
      alert("Error: Scheme Priority must be between 1 (Highest) and 10 (Lowest).");
      return;
    }

    // Benefit values validations
    const valNum = parseFloat(newScheme.benefitValue) || 0;
    if (valNum <= 0) {
      alert("Error: Benefit Value must be a positive number.");
      return;
    }
    if (newScheme.benefitType === "Percentage Discount" && valNum > 100) {
      alert("Error: Percentage Discount cannot exceed 100%.");
      return;
    }

    if (newScheme.benefitType === "Free Quantity") {
      const free = parseInt(newScheme.freeQuantity) || 0;
      const min = parseInt(newScheme.minQuantity) || 0;
      if (free <= 0 || min <= 0) {
        alert("Error: Minimum Quantity and Free Quantity must be positive integers.");
        return;
      }
      if (free >= min) {
        alert("Warning: Free Quantity matches or exceeds minimum purchase quantity.");
      }
    }

    // Duplicate Scheme Code Check
    const isDuplicateCode = data.some(item => item.schemeCode === newScheme.schemeCode && item.id !== newScheme.id);
    if (isDuplicateCode) {
      alert(`Error: A promotional scheme with code "${newScheme.schemeCode}" already exists.`);
      return;
    }

    // Duplicate Scheme Name Check
    const isDuplicateName = data.some(
      item => item.name.trim().toLowerCase() === newScheme.name.trim().toLowerCase() && item.id !== newScheme.id
    );
    if (isDuplicateName) {
      alert(`Error: A promotional scheme with name "${newScheme.name}" already exists.`);
      return;
    }

    const resolvedStatus = resolveSchemeStatus(newScheme.validFrom, newScheme.validTo, newScheme.status);
    const checkedForm = { ...newScheme, status: resolvedStatus };

    // Duplicate overlapping schemes check
    if (checkSchemeOverlap(checkedForm, data)) {
      alert(`Error: An active scheme has already been scheduled for "${getApplicableSelectionText(newScheme.applicableTo, newScheme.applicableSelection) || 'All Products'}" within these exact dates.`);
      return;
    }

    if (isEditingModal && newScheme.id) {
      const updatedRecord: Scheme = {
        id: newScheme.id,
        schemeCode: newScheme.schemeCode,
        name: newScheme.name,
        type: newScheme.type,
        applicableTo: newScheme.applicableTo,
        applicableSelection: newScheme.applicableSelection,
        benefitType: newScheme.benefitType,
        benefitValue: newScheme.benefitValue,
        minQuantity: newScheme.benefitType === "Free Quantity" ? newScheme.minQuantity : "",
        freeQuantity: newScheme.benefitType === "Free Quantity" ? newScheme.freeQuantity : "",
        validFrom: newScheme.validFrom,
        validTo: newScheme.validTo,
        priority: Number(newScheme.priority) || 1,
        remarks: newScheme.remarks,
        status: resolvedStatus
      };
      
      setData(data.map(item => item.id === updatedRecord.id ? updatedRecord : item));
      activityLogService.addLog({
        userId: currentUser?.id,
        userName: currentUser?.fullName,
        action: `Scheme Campaign Updated - Code: ${newScheme.schemeCode} (${resolvedStatus})`,
        module: "Scheme Management",
      });
      if (selectedScheme && selectedScheme.id === updatedRecord.id) {
        setSelectedScheme(updatedRecord);
      }
    } else {
      const record: Scheme = {
        id: Date.now().toString(),
        schemeCode: newScheme.schemeCode,
        name: newScheme.name,
        type: newScheme.type,
        applicableTo: newScheme.applicableTo,
        applicableSelection: newScheme.applicableSelection,
        benefitType: newScheme.benefitType,
        benefitValue: newScheme.benefitValue,
        minQuantity: newScheme.benefitType === "Free Quantity" ? newScheme.minQuantity : "",
        freeQuantity: newScheme.benefitType === "Free Quantity" ? newScheme.freeQuantity : "",
        validFrom: newScheme.validFrom,
        validTo: newScheme.validTo,
        priority: Number(newScheme.priority) || 1,
        remarks: newScheme.remarks,
        status: resolvedStatus
      };
      setData([record, ...data]);
      activityLogService.addLog({
        userId: currentUser?.id,
        userName: currentUser?.fullName,
        action: `Scheme Campaign Created - Code: ${newScheme.schemeCode} (${resolvedStatus})`,
        module: "Scheme Management",
      });
    }
    
    setShowModal(false);
  };

  const handleDelete = () => {
    if (itemToDelete) {
      const inUse = checkSchemeInUse(itemToDelete);
      if (inUse) {
        const updated = data.map(item =>
          item.id === itemToDelete.id ? { ...item, status: 'Cancelled' as const } : item
        );
        setData(updated);
        activityLogService.addLog({
          userId: currentUser?.id,
          userName: currentUser?.fullName,
          action: `Scheme Deleted (Blocked - Marked Cancelled instead due to Invoice usage) - Code: ${itemToDelete.schemeCode}`,
          module: "Scheme Management",
        });
        alert("Warning: This scheme is used in active billing invoices. To preserve transaction logs, it was marked as Cancelled instead of deleted.");
      } else {
        setData(data.filter(item => item.id !== itemToDelete.id));
        activityLogService.addLog({
          userId: currentUser?.id,
          userName: currentUser?.fullName,
          action: `Scheme Deleted - Code: ${itemToDelete.schemeCode}`,
          module: "Scheme Management",
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
          You do not have permission to view Scheme Management.
        </p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Scheme Management"
        subtitle="Manage promotional schemes, discounts, and free goods offers."
        actions={
          <>
            <ActionButton
              variant="secondary"
              icon={<Download className="w-4 h-4" />}
              onClick={handleExport}
            >
              Export
            </ActionButton>
            {canCreate && (
              <ActionButton
                icon={<Plus className="w-4 h-4" />}
                onClick={openNewModal}
              >
                Create Scheme
              </ActionButton>
            )}
          </>
        }
      />

      <FilterBar>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search schemes..."
        />
        <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-600">Filters:</span>
        </div>
        <SelectFilter
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { label: "Active", value: "Active" },
            { label: "Upcoming", value: "Upcoming" },
            { label: "Expired", value: "Expired" },
            { label: "Draft", value: "Draft" },
            { label: "Cancelled", value: "Cancelled" },
          ]}
          placeholder="All Status"
        />
      </FilterBar>

      <TableCard>
        <DataTable
          columns={columns}
          data={filteredData}
          onRowClick={(row) => setSelectedScheme(row)}
          emptyMessage="No promotional schemes found."
        />
      </TableCard>

      {/* Scheme Details Drawer */}
      <Drawer
        open={!!selectedScheme}
        onClose={() => setSelectedScheme(null)}
        title="Scheme Details"
      >
        {selectedScheme && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">
                Scheme Information
              </h3>
              <div className="space-y-2">
                <DrawerField
                  label="Scheme Code"
                  value={
                    <span className="font-mono text-violet-700 bg-violet-50 px-2 py-1 rounded">
                      {selectedScheme.schemeCode}
                    </span>
                  }
                />
                <DrawerField label="Scheme Name" value={selectedScheme.name} />
                <DrawerField label="Scheme Type" value={selectedScheme.type} />
                <DrawerField label="Priority" value={String(selectedScheme.priority || '1')} />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">
                Applicability Information
              </h3>
              <div className="space-y-2">
                <DrawerField
                  label="Applicable To"
                  value={selectedScheme.applicableTo || "-"}
                />
                {selectedScheme.applicableTo !== "All Products" && (
                  <DrawerField
                    label="Selection Target"
                    value={getApplicableSelectionText(selectedScheme.applicableTo, selectedScheme.applicableSelection) || "-"}
                  />
                )}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">
                Benefit Information
              </h3>
              <div className="space-y-2">
                <DrawerField
                  label="Benefit Type"
                  value={selectedScheme.benefitType}
                />
                <DrawerField
                  label="Benefit Value"
                  value={selectedScheme.benefitValue}
                />
              </div>
            </div>

            {selectedScheme.benefitType === "Free Quantity" && (
              <div>
                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">
                  Quantity Criteria
                </h3>
                <div className="space-y-2">
                  <DrawerField
                    label="Min Purchase Qty"
                    value={selectedScheme.minQuantity || "N/A"}
                  />
                  <DrawerField
                    label="Free Qty"
                    value={selectedScheme.freeQuantity || "N/A"}
                  />
                </div>
              </div>
            )}

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">
                Validity Information
              </h3>
              <div className="space-y-2">
                <DrawerField
                  label="Valid From"
                  value={selectedScheme.validFrom}
                />
                <DrawerField label="Valid To" value={selectedScheme.validTo} />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">
                Additional & Status
              </h3>
              <div className="space-y-2">
                <DrawerField
                  label="Remarks"
                  value={selectedScheme.remarks || "N/A"}
                />
                <DrawerField
                  label="Status"
                  value={
                    <Badge
                      variant={
                        selectedScheme.status === "Active"
                          ? "success"
                          : selectedScheme.status === "Upcoming"
                            ? "info"
                            : selectedScheme.status === "Draft"
                              ? "warning"
                              : "danger"
                      }
                    >
                      {selectedScheme.status}
                    </Badge>
                  }
                />
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
              {canEdit && 
                selectedScheme.status !== 'Cancelled' && 
                selectedScheme.status !== 'Expired' && 
                !checkSchemeInUse(selectedScheme) && (
                  <ActionButton onClick={openEditModal}>Edit Scheme</ActionButton>
              )}
              <ActionButton
                variant="secondary"
                onClick={() => setSelectedScheme(null)}
              >
                Close
              </ActionButton>
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
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Delete Scheme
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              Are you sure you want to delete this promotional scheme? This
              action cannot be undone.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setItemToDelete(null)}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
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

      {/* Create / Edit Scheme Modal Form */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">
                {isEditingModal ? "Edit Scheme" : "Create Scheme"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-500 hover:text-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* SCHEME INFORMATION */}
              <div className="md:col-span-2 mt-2 first:mt-0">
                <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">
                  SCHEME INFORMATION
                </h3>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Scheme Code *
                </label>
                <input
                  type="text"
                  maxLength={20}
                  value={newScheme.schemeCode}
                  onChange={(e) =>
                    setNewScheme({ ...newScheme, schemeCode: e.target.value.slice(0, 20) })
                  }
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 font-mono focus:ring-2 focus:ring-violet-500 focus:border-violet-500 bg-white text-slate-900"
                  placeholder="e.g. SCH-10+1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 flex justify-between">
                  <span>Scheme Priority * (1 to 10)</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={newScheme.priority}
                  onChange={(e) =>
                    setNewScheme({ ...newScheme, priority: Math.max(1, Math.min(10, parseInt(e.target.value) || 1)) })
                  }
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 bg-white text-slate-900"
                  placeholder="e.g. 1"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  (1 = Highest Priority, 10 = Lowest Priority)
                </span>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">
                  Scheme Name *
                </label>
                <input
                  type="text"
                  maxLength={50}
                  value={newScheme.name}
                  onChange={(e) =>
                    setNewScheme({ ...newScheme, name: e.target.value.slice(0, 50) })
                  }
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 bg-white text-slate-900"
                  placeholder="e.g. Buy 10 Get 1 Free"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">
                  Scheme Type *
                </label>
                <select
                  value={newScheme.type}
                  onChange={(e) =>
                    setNewScheme({ ...newScheme, type: e.target.value })
                  }
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-900"
                >
                  <option value="Quantity Discount">Quantity Discount</option>
                  <option value="Cash Discount">Cash Discount</option>
                  <option value="Percentage Discount">
                    Percentage Discount
                  </option>
                  <option value="Free Goods">Free Goods</option>
                  <option value="Seasonal Offer">Seasonal Offer</option>
                  <option value="Launch Offer">Launch Offer</option>
                </select>
              </div>

              {/* APPLICABILITY INFORMATION */}
              <div className="md:col-span-2 mt-4">
                <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">
                  APPLICABILITY INFORMATION
                </h3>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Applicable To
                </label>
                <select
                  value={newScheme.applicableTo}
                  onChange={(e) => {
                    const value = e.target.value as Scheme['applicableTo'];
                    setNewScheme({
                      ...newScheme,
                      applicableTo: value,
                      applicableSelection: "",
                    });
                  }}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-900"
                >
                  <option value="Product">Product</option>
                  <option value="Category">Category</option>
                  <option value="Brand">Brand</option>
                  <option value="All Products">All Products</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Selection Target Selection *
                </label>
                {newScheme.applicableTo === "All Products" ? (
                  <input
                    type="text"
                    disabled
                    value="Not Applicable"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-100 cursor-not-allowed text-slate-400"
                  />
                ) : newScheme.applicableTo === "Product" ? (
                  <select
                    value={newScheme.applicableSelection}
                    onChange={(e) => setNewScheme({ ...newScheme, applicableSelection: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-900"
                  >
                    <option value="">Select Product</option>
                    {products
                      .filter(p => !p.status || p.status === "Active")
                      .map(p => <option key={p.code} value={p.code}>{p.name}</option>)
                    }
                  </select>
                ) : newScheme.applicableTo === "Category" ? (
                  <select
                    value={newScheme.applicableSelection}
                    onChange={(e) => setNewScheme({ ...newScheme, applicableSelection: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-900"
                  >
                    <option value="">Select Category</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                ) : (
                  <select
                    value={newScheme.applicableSelection}
                    onChange={(e) => setNewScheme({ ...newScheme, applicableSelection: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-900"
                  >
                    <option value="">Select Brand</option>
                    {brands.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                )}
              </div>

              {/* BENEFIT INFORMATION */}
              <div className="md:col-span-2 mt-4">
                <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">
                  BENEFIT INFORMATION
                </h3>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Benefit Type *
                </label>
                <select
                  value={newScheme.benefitType}
                  onChange={(e) =>
                    setNewScheme({ ...newScheme, benefitType: e.target.value })
                  }
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-900"
                >
                  <option value="Free Quantity">Free Quantity</option>
                  <option value="Percentage Discount">
                    Percentage Discount
                  </option>
                  <option value="Flat Discount">Flat Discount</option>
                  <option value="Cash Back">Cash Back</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Benefit Value *
                </label>
                <input
                  type="number"
                  value={newScheme.benefitValue}
                  onChange={(e) =>
                    setNewScheme({ ...newScheme, benefitValue: e.target.value })
                  }
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-900"
                  placeholder="e.g. 5"
                />
              </div>

              {/* QUANTITY CRITERIA */}
              {newScheme.benefitType === "Free Quantity" && (
                <>
                  <div className="md:col-span-2 mt-4">
                    <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">
                      QUANTITY CRITERIA
                    </h3>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Minimum Purchase Quantity *
                    </label>
                    <input
                      type="number"
                      value={newScheme.minQuantity}
                      onChange={(e) =>
                        setNewScheme({ ...newScheme, minQuantity: e.target.value })
                      }
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-900"
                      placeholder="e.g. 10"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Free Quantity *
                    </label>
                    <input
                      type="number"
                      value={newScheme.freeQuantity}
                      onChange={(e) =>
                        setNewScheme({ ...newScheme, freeQuantity: e.target.value })
                      }
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-900"
                      placeholder="e.g. 1"
                    />
                  </div>
                </>
              )}

              {/* VALIDITY INFORMATION */}
              <div className="md:col-span-2 mt-4">
                <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">
                  VALIDITY INFORMATION
                </h3>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Valid From *
                </label>
                <input
                  type="date"
                  value={newScheme.validFrom}
                  onChange={(e) =>
                    setNewScheme({ ...newScheme, validFrom: e.target.value })
                  }
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Valid To *
                </label>
                <input
                  type="date"
                  value={newScheme.validTo}
                  onChange={(e) =>
                    setNewScheme({ ...newScheme, validTo: e.target.value })
                  }
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-900"
                />
              </div>

              {/* ADDITIONAL & STATUS INFORMATION */}
              <div className="md:col-span-2 mt-4">
                <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">
                  ADDITIONAL & STATUS INFORMATION
                </h3>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">
                  Remarks
                </label>
                <textarea
                  rows={2}
                  value={newScheme.remarks}
                  onChange={(e) =>
                    setNewScheme({ ...newScheme, remarks: e.target.value })
                  }
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-900"
                  placeholder="Enter remarks..."
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">
                  Status *
                </label>
                <select
                  value={newScheme.status}
                  onChange={(e) =>
                    setNewScheme({
                      ...newScheme,
                      status: e.target.value as any,
                    })
                  }
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-900"
                >
                  <option value="Draft">Draft (Manual)</option>
                  <option value="Cancelled">Cancelled (Manual)</option>
                  {['Active', 'Upcoming', 'Expired'].includes(newScheme.status) && (
                    <option value={newScheme.status} disabled>{newScheme.status} (System Auto)</option>
                  )}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-100">
              <ActionButton
                variant="secondary"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </ActionButton>
              <ActionButton onClick={handleSaveScheme}>
                {isEditingModal ? "Save Changes" : "Create Scheme"}
              </ActionButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}