import { useEffect, useState } from 'react';
import {
  Filter,
  Download,
  Plus,
  Trash2,
} from 'lucide-react';

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
  DrawerField,
} from './components/shared';

import { type Column } from './types';
import { mrpService, type MRPRecord } from '../../services/mrpService';
import { productService } from '../../services/productService';
import activityLogService from '../../services/activityLogService';

const formatDate = (dateStr: string) => {
  if (!dateStr) return 'N/A';
  if (dateStr.includes('T')) {
    dateStr = dateStr.split('T')[0];
  }
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dateStr;
};

export default function MRPManagement() {
  const [data, setData] = useState<MRPRecord[]>([]);
  const currentUser = JSON.parse(localStorage.getItem("authUser") || "{}");
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    productService.loadProducts().then(async refreshedProducts => {
      setProducts(refreshedProducts);

      let records = await mrpService.loadMRPs();
      records = mrpService.activateScheduledMRPs(records);
      
      records = records.map(record => {
        const product = refreshedProducts.find(p => p.code === record.productCode);
        return {
          ...record,
          productType: product?.type || record.productType || 'N/A',
          manufacturer: product?.manufacturer || record.manufacturer || 'N/A'
        };
      });
      
      mrpService.saveAll(records);
      setData(records);
    });
  }, []);

  const activeProducts = products.filter(p => p.status === 'Active');

  const canCreate = true;
  const canEdit = true;
  const canDelete = true;
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const [isEditingModal, setIsEditingModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MRPRecord | null>(null);
  const [itemToDelete, setItemToDelete] = useState<MRPRecord | null>(null);

  const [newMrp, setNewMrp] = useState({
    id: '',
    productName: '',
    productCode: '',
    category: '',
    productType: '',
    manufacturer: '',
    currentMrp: '',
    newMrp: '',
    effectiveDate: '',
    revisionReason: '',
    remarks: '',
  });

  const checkMrpInUse = (mrpItem: MRPRecord) => {
    const invoices = JSON.parse(localStorage.getItem("billing_gst_invoices") || "[]");
    return invoices.some((inv: any) =>
      inv.items.some((item: any) => item.productCode === mrpItem.productCode && Number(item.mrp || item.currentMrp) === mrpItem.currentMrp)
    );
  };

  const columns: Column<MRPRecord>[] = [
    { key: 'productCode', label: 'Product Code' },
    { key: 'productName', label: 'Product Name', render: (row) => <span className="font-semibold text-slate-900">{row.productName}</span> },
    { key: 'previousMrp', label: 'Previous MRP', render: (row) => typeof row.previousMrp === 'number' ? `₹${row.previousMrp.toFixed(2)}` : '₹0.00' },
    { key: 'currentMrp', label: 'Current MRP', render: (row) => `₹${row.currentMrp.toFixed(2)}` },
    { key: 'effectiveFrom', label: 'Effective From', render: (row) => formatDate(row.effectiveFrom) },
    { key: 'status', label: 'Status', render: (row) => (
        <Badge variant={row.status === 'Active' ? 'success' : row.status === 'Scheduled' ? 'warning' : row.status === 'Draft' || row.status === 'Cancelled' ? 'neutral' : 'danger'}>
          {row.status}
        </Badge>
      )
    },
    { key: 'updatedAt', label: 'Last Updated', render: (row) => formatDate(row.updatedAt) },
    { key: 'id', label: 'Actions', render: (row) => (
        <div className="flex gap-3">
          <button onClick={(e) => { e.stopPropagation(); setSelectedItem(row); }} className="text-[#163c78] font-medium hover:text-[#0c1f3d]">View</button>
          {canDelete && (
          <button onClick={(e) => { e.stopPropagation(); setItemToDelete(row); }} className="text-rose-600 font-medium hover:text-rose-800" title="Delete">
            <Trash2 className="w-4 h-4" />
          </button>
          )}
        </div>
      )
    }
  ];

  const filteredData = data.filter((item) => {
    const matchesSearch = item.productName.toLowerCase().includes(search.toLowerCase()) || item.productCode.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter ? item.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleExport = () => {
    const headers = ['Product Code', 'Product Name', 'Previous MRP', 'Current MRP', 'Effective From', 'Status', 'Last Updated'];
    const csvContent = [
      headers.join(','),
      ...filteredData.map(row => 
        [row.productCode, `"${row.productName}"`, row.previousMrp || '', row.currentMrp, formatDate(row.effectiveFrom), row.status, formatDate(row.updatedAt)].join(',')
      )
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'mrp_export.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    activityLogService.addLog({
      userId: currentUser?.id,
      userName: currentUser?.fullName,
      action: "MRP Report Exported",
      module: "MRP Management",
    });
  };

  const handleProductSelect = (productCode: string) => {
    const product = activeProducts.find((p) => p.code === productCode);
    if (product) {
      const currentRecord = mrpService.getCurrentMRP(productCode);
      const activeMrp = currentRecord ? currentRecord.currentMrp : product.mrp;
      
      setNewMrp({
        ...newMrp,
        productName: product.name,
        productCode: product.code,
        category: product.category || '',
        productType: product.productType || product.type || '',
        manufacturer: product.manufacturer || '',
        currentMrp: activeMrp ? String(activeMrp) : '',
      });
    } else {
      setNewMrp({ ...newMrp, productName: '', productCode: '', category: '', productType: '', manufacturer: '', currentMrp: '' });
    }
  };

  const openNewModal = () => {
    setIsEditingModal(false);
    setNewMrp({
      id: '',
      productName: '',
      productCode: '',
      category: '',
      productType: '',
      manufacturer: '',
      currentMrp: '',
      newMrp: '',
      effectiveDate: new Date().toISOString().split('T')[0],
      revisionReason: '',
      remarks: '',
    });
    setShowModal(true);
  };

  const openEditModal = () => {
    if (!selectedItem) return;
    if (selectedItem.status === 'Cancelled' || selectedItem.status === 'Expired') {
      alert("Error: Cannot revise Cancelled or Expired MRP records.");
      return;
    }
    setIsEditingModal(true);
    setNewMrp({
      id: selectedItem.id,
      productName: selectedItem.productName,
      productCode: selectedItem.productCode,
      category: selectedItem.category,
      productType: selectedItem.productType || '',
      manufacturer: selectedItem.manufacturer || '',
      currentMrp: selectedItem.previousMrp ? String(selectedItem.previousMrp) : '',
      newMrp: selectedItem.currentMrp.toString(),
      effectiveDate: selectedItem.effectiveFrom,
      revisionReason: selectedItem.revisionReason || '',
      remarks: selectedItem.remarks || '',
    });
    setShowModal(true);
  };

  const handleSaveMrp = async () => {
    if (!newMrp.productCode || !newMrp.newMrp || !newMrp.effectiveDate || !newMrp.revisionReason) {
      alert("Please fill all mandatory fields (*).");
      return;
    }

    const newMrpVal = Number(parseFloat(newMrp.newMrp).toFixed(2));
    if (isNaN(newMrpVal) || newMrpVal <= 0) {
      alert("Error: MRP must be a positive numeric value greater than 0.");
      return;
    }
    if (newMrpVal > 999999) {
      alert("Error: MRP exceeds maximum sensible ERP limit (₹9,99,999).");
      return;
    }

    if (newMrp.currentMrp && newMrpVal === Number(newMrp.currentMrp)) {
      alert("Error: New MRP cannot equal Current MRP.");
      return;
    }

    const isDuplicate = mrpService.validateDuplicateVersion(
      newMrp.productCode,
      newMrp.effectiveDate,
      isEditingModal ? newMrp.id : undefined
    );

    if (isDuplicate) {
      alert("An MRP version already exists for this product with the selected Effective Date.");
      return;
    }

    let allRecords = mrpService.getAll();

    if (isEditingModal && newMrp.id) {
      const todayStr = new Date().toISOString().split('T')[0];
      const resolvedStatus = newMrp.effectiveDate > todayStr ? 'Scheduled' : 'Active';

      const updatedRecord: MRPRecord = {
        id: newMrp.id,
        productCode: newMrp.productCode,
        productName: newMrp.productName,
        category: newMrp.category,
        productType: newMrp.productType,
        manufacturer: newMrp.manufacturer,
        previousMrp: newMrp.currentMrp ? Number(newMrp.currentMrp) : undefined,
        currentMrp: newMrpVal,
        effectiveFrom: newMrp.effectiveDate,
        revisionReason: newMrp.revisionReason,
        remarks: newMrp.remarks,
        status: resolvedStatus,
        createdAt: selectedItem?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: selectedItem?.createdBy || currentUser?.fullName || 'System',
        updatedBy: currentUser?.fullName || 'System'
      };
      
      const matchedProduct = products.find(p => p.code === updatedRecord.productCode);
      const productId = matchedProduct ? parseInt(matchedProduct.id) : undefined;
      await mrpService.syncMRPToBackend(updatedRecord, productId);

      if (resolvedStatus === 'Active') {
        allRecords = mrpService.expirePreviousActiveMRP(allRecords, updatedRecord.productCode, updatedRecord.id);
        const updatedProducts = products.map((p) =>
          p.code === updatedRecord.productCode ? { ...p, mrp: updatedRecord.currentMrp } : p
        );
        productService.saveProducts(updatedProducts);
        setProducts(updatedProducts);

        // Sync updated MRP to backend database (product update)
        if (matchedProduct) {
          productService.updateProduct(matchedProduct.id, {
            ...matchedProduct,
            mrp: String(updatedRecord.currentMrp)
          }).catch(err => console.error("Failed to sync updated MRP to database:", err));
        }
      }

      allRecords = allRecords.map(item => item.id === updatedRecord.id ? updatedRecord : item);
      mrpService.saveAll(allRecords);
      setData(allRecords);

      if (selectedItem && selectedItem.id === updatedRecord.id) {
        setSelectedItem(updatedRecord);
      }

      activityLogService.addLog({
        userId: currentUser?.id,
        userName: currentUser?.fullName,
        action: `MRP Updated - Product: ${newMrp.productName}, New Price: ₹${newMrpVal} (${resolvedStatus})`,
        module: "MRP Management",
      });
    } else {
      const payload = {
        productCode: newMrp.productCode,
        productName: newMrp.productName,
        category: newMrp.category,
        productType: newMrp.productType,
        manufacturer: newMrp.manufacturer,
        previousMrp: newMrp.currentMrp ? Number(newMrp.currentMrp) : undefined,
        currentMrp: newMrpVal,
        effectiveFrom: newMrp.effectiveDate,
        revisionReason: newMrp.revisionReason,
        remarks: newMrp.remarks,
        createdBy: currentUser?.fullName || 'System',
        updatedBy: currentUser?.fullName || 'System'
      };

      const newRecord = mrpService.createMRPVersion(payload);
      
      const matchedProduct = products.find(p => p.code === newRecord.productCode);
      const productId = matchedProduct ? parseInt(matchedProduct.id) : undefined;
      await mrpService.syncMRPToBackend(newRecord, productId);
      
      allRecords = [...allRecords, newRecord];
      
      if (newRecord.status === 'Active') {
        allRecords = mrpService.expirePreviousActiveMRP(allRecords, newRecord.productCode, newRecord.id);
        
        const updatedProducts = products.map((p) =>
          p.code === newRecord.productCode ? { ...p, mrp: newRecord.currentMrp } : p
        );
        productService.saveProducts(updatedProducts);
        setProducts(updatedProducts);

        // Sync new MRP to backend database (product update)
        if (matchedProduct) {
          productService.updateProduct(matchedProduct.id, {
            ...matchedProduct,
            mrp: String(newRecord.currentMrp)
          }).catch(err => console.error("Failed to sync new MRP to database:", err));
        }
      }
      
      mrpService.saveAll(allRecords);
      setData(allRecords);

      activityLogService.addLog({
        userId: currentUser?.id,
        userName: currentUser?.fullName,
        action: `MRP Created - Product: ${newMrp.productName}, Price: ₹${newMrpVal} (${newRecord.status})`,
        module: "MRP Management",
      });
    }
    
    setShowModal(false);
  };

  const handleDelete = async () => {
    if (itemToDelete) {
      const inUse = checkMrpInUse(itemToDelete);
      if (inUse) {
        const updated = data.map(item =>
          item.id === itemToDelete.id ? { ...item, status: 'Cancelled' as const, updatedAt: new Date().toISOString() } : item
        );
        setData(updated);
        mrpService.saveAll(updated);
        // We sync the updated (cancelled) status to backend instead of deleting
        const matchedProduct = products.find(p => p.code === itemToDelete.productCode);
        const productId = matchedProduct ? parseInt(matchedProduct.id) : undefined;
        await mrpService.syncMRPToBackend(updated.find(u => u.id === itemToDelete.id)!, productId);

        activityLogService.addLog({
          userId: currentUser?.id,
          userName: currentUser?.fullName,
          action: `MRP Deleted (Blocked - Marked Cancelled instead due to Invoice usage) for ${itemToDelete.productName}`,
          module: "MRP Management",
        });
        alert("Warning: This MRP is used in invoices. To preserve financial history, it was marked as Cancelled instead of deleted.");
      } else {
        const updated = data.filter(item => item.id !== itemToDelete.id);
        setData(updated);
        mrpService.saveAll(updated);
        await mrpService.deleteMRPFromBackend(itemToDelete.id);

        activityLogService.addLog({
          userId: currentUser?.id,
          userName: currentUser?.fullName,
          action: `MRP Deleted - Product: ${itemToDelete.productName}, Price: ₹${itemToDelete.currentMrp}`,
          module: "MRP Management",
        });
      }
      setItemToDelete(null);
    }
  };

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="MRP Management"
        subtitle="Manage Maximum Retail Price (MRP), revisions, and product-wise pricing controls."
        actions={
          <>
            <ActionButton variant="secondary" icon={<Download className="w-4 h-4" />} onClick={handleExport}>
              Export
            </ActionButton>
             {canCreate && (
            <ActionButton icon={<Plus className="w-4 h-4" />} onClick={openNewModal}>
              New MRP
            </ActionButton>
             )}
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
          placeholder="All Status"
          options={[
            { label: 'Active', value: 'Active' },
            { label: 'Scheduled', value: 'Scheduled' },
            { label: 'Draft', value: 'Draft' },
            { label: 'Expired', value: 'Expired' },
            { label: 'Cancelled', value: 'Cancelled' },
          ]}
        />
      </FilterBar>

      <TableCard>
        <DataTable
          columns={columns}
          data={filteredData}
          onRowClick={(row) => setSelectedItem(row)}
          emptyMessage="No MRP records found."
        />
      </TableCard>

      <Drawer open={!!selectedItem} onClose={() => setSelectedItem(null)} title="MRP Details">
        {selectedItem && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Product Information</h3>
              <div className="space-y-2">
                <DrawerField label="Product Code" value={selectedItem.productCode || 'N/A'} />
                <DrawerField label="Product Name" value={selectedItem.productName || 'N/A'} />
                <DrawerField label="Category" value={selectedItem.category || 'N/A'} />
                <DrawerField label="Product Type" value={selectedItem.productType || 'N/A'} />
                <DrawerField label="Manufacturer" value={selectedItem.manufacturer || 'N/A'} />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Pricing Information</h3>
              <div className="space-y-2">
                <DrawerField label="Previous MRP" value={typeof selectedItem.previousMrp === 'number' ? `₹${selectedItem.previousMrp.toFixed(2)}` : '₹0.00'} />
                <DrawerField label="Current MRP" value={`₹${selectedItem.currentMrp.toFixed(2)}`} />
                <DrawerField label="Effective From" value={formatDate(selectedItem.effectiveFrom)} />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Revision Information</h3>
              <div className="space-y-2">
                <DrawerField label="Revision Reason" value={selectedItem.revisionReason || 'N/A'} />
                <DrawerField label="Remarks" value={selectedItem.remarks || 'N/A'} />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">System Information</h3>
              <div className="space-y-2">
                <DrawerField 
                  label="Status" 
                  value={
                    <Badge variant={selectedItem.status === 'Active' ? 'success' : selectedItem.status === 'Scheduled' ? 'warning' : selectedItem.status === 'Draft' || selectedItem.status === 'Cancelled' ? 'neutral' : 'danger'}>
                      {selectedItem.status}
                    </Badge>
                  } 
                />
                <DrawerField label="Created On" value={formatDate(selectedItem.createdAt)} />
                <DrawerField label="Updated On" value={formatDate(selectedItem.updatedAt)} />
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
              {canEdit && selectedItem.status !== 'Cancelled' && selectedItem.status !== 'Expired' && (
              <ActionButton onClick={openEditModal}>Revise MRP</ActionButton>
              )}
              <ActionButton variant="secondary" onClick={() => setSelectedItem(null)}>Close</ActionButton>
            </div>
          </div>
        )}
      </Drawer>

      {itemToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setItemToDelete(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-rose-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Delete MRP Record</h3>
            <p className="text-sm text-slate-500 mb-6">
              Are you sure you want to delete this MRP record? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setItemToDelete(null)} className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors">Cancel</button>
              <button onClick={handleDelete} className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 transition-colors">
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">{isEditingModal ? 'Revise MRP' : 'New MRP'}</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-slate-800">✕</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 mt-2 first:mt-0">
                <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">Product Information</h3>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Product *</label>
                <select 
                  value={newMrp.productCode} 
                  onChange={(e) => !isEditingModal && handleProductSelect(e.target.value)} 
                  disabled={isEditingModal}
                  className={`w-full border border-slate-200 rounded-lg px-3 py-2 ${isEditingModal ? 'bg-slate-50 opacity-70 cursor-not-allowed' : 'bg-white focus:outline-none focus:border-violet-400'}`}
                >
                  <option value="">Select Product</option>
                  {activeProducts.map(p => <option key={p.code} value={p.code}>{p.name} ({p.code})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Category (Read Only)</label>
                <input value={newMrp.category} readOnly className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 text-slate-500 cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Product Type (Read Only)</label>
                <input value={newMrp.productType} readOnly className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 text-slate-500 cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Manufacturer (Read Only)</label>
                <input value={newMrp.manufacturer} readOnly className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 text-slate-500 cursor-not-allowed" />
              </div>

              <div className="md:col-span-2 mt-4">
                <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">MRP Information</h3>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Current MRP (Read Only)</label>
                <input value={newMrp.currentMrp ? `₹${Number(newMrp.currentMrp).toFixed(2)}` : ''} readOnly className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 text-slate-500 cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">New MRP *</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-500">₹</span>
                  <input type="number" step="0.01" value={newMrp.newMrp} onChange={(e) => setNewMrp({ ...newMrp, newMrp: e.target.value })} className="w-full border border-slate-200 rounded-lg pl-7 pr-3 py-2 bg-white focus:outline-none focus:border-violet-400" />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Effective Date *</label>
                <input type="date" value={newMrp.effectiveDate} onChange={(e) => setNewMrp({ ...newMrp, effectiveDate: e.target.value })} className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-violet-400" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Revision Reason *</label>
                <select value={newMrp.revisionReason} onChange={(e) => setNewMrp({ ...newMrp, revisionReason: e.target.value })} className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-violet-400">
                  <option value="">Select Reason</option>
                  <option value="Government Revision">Government Revision</option>
                  <option value="Company Price Update">Company Price Update</option>
                  <option value="Cost Increase">Cost Increase</option>
                  <option value="Promotional Pricing">Promotional Pricing</option>
                  <option value="Market Adjustment">Market Adjustment</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Remarks</label>
                <textarea rows={2} value={newMrp.remarks} onChange={(e) => setNewMrp({ ...newMrp, remarks: e.target.value })} className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-violet-400" />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-100">
              <ActionButton variant="secondary" onClick={() => setShowModal(false)}>Cancel</ActionButton>
              <ActionButton onClick={handleSaveMrp}>Save MRP</ActionButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}