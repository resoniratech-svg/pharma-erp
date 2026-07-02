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
import { mrpService } from '../../services/mrpService';
import { productService } from '../../services/productService';
import activityLogService  from '../../services/activityLogService';
import { hasModulePermission } from '../../utils/permissionUtils';

interface MRPItem {
  id: string;
  productCode: string;
  productName: string;
  category: string;
  productType?: string;
  mrp: number;
  previousMrp?: number;
  effectiveDate: string;
  revisedBy: string;
  revisionReason?: string;
  remarks?: string;
  status: 'Active' | 'Scheduled' | 'Expired' | 'Draft' | 'Cancelled';
}

const initialMockData: MRPItem[] = [
  {
    id: '1',
    productCode: 'PRD-000002',
    productName: 'Paracetamol 650mg',
    category: 'Tablet',
    productType: 'Tablet',
    mrp: 120,
    previousMrp: 110,
    effectiveDate: '2026-06-01',
    revisedBy: 'Admin User',
    revisionReason: 'Cost Increase',
    remarks: 'Routine inflation adjustment',
    status: 'Active',
  },
  {
    id: '2',
    productCode: 'PRD-000001',
    productName: 'Amoxicillin 500mg',
    category: 'Capsule',
    productType: 'Capsule',
    mrp: 185,
    previousMrp: 185,
    effectiveDate: '2026-06-15',
    revisedBy: 'Admin User',
    revisionReason: 'Marketing Strategy',
    remarks: 'No change in price',
    status: 'Active',
  },
  {
    id: '3',
    productCode: 'PRD-000004',
    productName: 'Vitamin C 1000mg',
    category: 'Tablet',
    productType: 'Tablet',
    mrp: 240,
    previousMrp: 210,
    effectiveDate: '2026-07-01',
    revisedBy: 'Pricing Team',
    revisionReason: 'Distributor Request',
    remarks: 'Approved by board',
    status: 'Scheduled',
  },
  {
    id: '4',
    productCode: 'PRD-000003',
    productName: 'Cough Syrup 100ml',
    category: 'Syrup',
    productType: 'Syrup',
    mrp: 95,
    previousMrp: 90,
    effectiveDate: '2025-01-01',
    revisedBy: 'Admin User',
    revisionReason: 'Cost Reduction',
    remarks: 'Old stock clearance',
    status: 'Expired',
  },
];

export default function MRPManagement() {
  const [data, setData] = useState<MRPItem[]>([]);
  const currentUser = JSON.parse(localStorage.getItem("authUser") || "{}");
  const activeRole = localStorage.getItem("activeRole") || "";
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    const savedProducts = productService.getProducts();
    setProducts(savedProducts);

    const savedData = mrpService.getAll();
    let loadedData = savedData.length ? savedData : initialMockData;
    
    // Auto-update Scheduled to Active when effective date is reached
    const todayStr = new Date().toISOString().split('T')[0];
    let changed = false;
    
    let updatedData = loadedData.map((item: MRPItem) => {
      if (item.status === 'Scheduled' && item.effectiveDate <= todayStr) {
        changed = true;
        return { ...item, status: 'Active' as const };
      }
      return item;
    });

    // Enforce single active MRP rule if we flipped status
    if (changed) {
      const productsWithActive = Array.from(new Set(updatedData.filter((i:any) => i.status === 'Active').map((i:any) => i.productCode)));
      productsWithActive.forEach(code => {
        const activeItems = updatedData.filter((i:any) => i.productCode === code && i.status === 'Active');
        if (activeItems.length > 1) {
          activeItems.sort((a:any, b:any) => b.effectiveDate.localeCompare(a.effectiveDate));
          const latestActiveId = activeItems[0].id;
          updatedData = updatedData.map((item:any) => {
            if (item.productCode === code && item.status === 'Active' && item.id !== latestActiveId) {
              return { ...item, status: 'Expired' as const };
            }
            return item;
          });
        }
      });
    }

    if (!savedData.length || changed) {
      mrpService.saveAll(updatedData);
    }
    setData(updatedData);
  }, []);

  useEffect(() => {
    if (data.length > 0) {
      mrpService.saveAll(data);
    }
  }, [data]);

  const canView = hasModulePermission(activeRole, "Products & Master", "View");
  const canCreate = hasModulePermission(activeRole, "Products & Master", "Create");
  const canEdit = hasModulePermission(activeRole, "Products & Master", "Edit");
  const canDelete = hasModulePermission(activeRole, "Products & Master", "Delete");

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const [isEditingModal, setIsEditingModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MRPItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<MRPItem | null>(null);

  const [newMrp, setNewMrp] = useState({
    id: '',
    productName: '',
    productCode: '',
    category: '',
    productType: '',
    currentMrp: '',
    newMrp: '',
    effectiveDate: '',
    revisionReason: '',
    remarks: '',
    revisedBy: 'Admin User',
    status: 'Draft' as 'Draft' | 'Scheduled' | 'Active' | 'Cancelled' | 'Expired'
  });

  const checkMrpInUse = (mrpItem: MRPItem) => {
    const invoices = JSON.parse(localStorage.getItem("billing_gst_invoices") || "[]");
    return invoices.some((inv: any) =>
      inv.items.some((item: any) => item.productCode === mrpItem.productCode && Number(item.mrp) === mrpItem.mrp)
    );
  };

  const resolveStatus = (effDateStr: string, currentStatus: MRPItem['status']): MRPItem['status'] => {
    if (['Cancelled', 'Expired', 'Draft'].includes(currentStatus)) {
      return currentStatus;
    }
    const todayStr = new Date().toISOString().split('T')[0];
    if (effDateStr > todayStr) {
      return 'Scheduled';
    } else {
      return 'Active';
    }
  };

  const calculatePriceChangePercentage = (oldPrice: number | undefined, newPrice: number) => {
    if (oldPrice === undefined || oldPrice === 0) return null;
    const diff = newPrice - oldPrice;
    const pct = (diff / oldPrice) * 100;
    const sign = pct >= 0 ? '+' : '';
    return `${sign}${pct.toFixed(1)}%`;
  };

  const columns: Column<MRPItem>[] = [
    {
      key: 'productCode',
      label: 'PRODUCT CODE',
    },
    {
      key: 'productName',
      label: 'PRODUCT NAME',
      render: (row) => (
        <span className="font-semibold text-slate-900">
          {row.productName}
        </span>
      ),
    },
    {
      key: 'category',
      label: 'CATEGORY',
    },
    {
      key: 'mrp',
      label: 'MRP',
      render: (row) => `₹${row.mrp}`,
    },
    {
      key: 'effectiveDate',
      label: 'EFFECTIVE DATE',
    },
    {
      key: 'revisedBy',
      label: 'REVISED BY',
    },
    {
      key: 'status',
      label: 'STATUS',
      render: (row) => (
        <Badge
          variant={
            row.status === 'Active'
              ? 'success'
              : row.status === 'Scheduled'
              ? 'warning'
              : row.status === 'Draft' || row.status === 'Cancelled'
              ? 'neutral'
              : 'danger'
          }
        >
          {row.status}
        </Badge>
      ),
    },
    {
      key: 'id',
      label: 'ACTIONS',
      render: (row) => (
        <div className="flex gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedItem(row);
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
    const matchesSearch =
      item.productName.toLowerCase().includes(search.toLowerCase()) ||
      item.productCode.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter
      ? item.status === statusFilter
      : true;

    return matchesSearch && matchesStatus;
  });

  const handleExport = () => {
    const headers = ['Product Code', 'Product Name', 'Category', 'MRP', 'Effective Date', 'Revised By', 'Status'];
    const csvContent = [
      headers.join(','),
      ...filteredData.map(row => 
        [row.productCode, `"${row.productName}"`, row.category, row.mrp, row.effectiveDate, row.revisedBy, row.status].join(',')
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

  const handleProductSelect = (productName: string) => {
    const product = products.find((p) => p.name === productName);
    if (product) {
      setNewMrp({
        ...newMrp,
        productName: product.name,
        productCode: product.code,
        category: product.category,
        productType: product.productType || '',
        currentMrp: String(product.mrp || '')
      });
    } else {
      setNewMrp({
        ...newMrp,
        productName: productName,
        productCode: '',
        category: '',
        productType: '',
        currentMrp: ''
      });
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
      currentMrp: '',
      newMrp: '',
      effectiveDate: new Date().toISOString().split('T')[0],
      revisionReason: '',
      remarks: '',
      revisedBy: currentUser?.fullName || 'Admin User',
      status: 'Draft'
    });
    setShowModal(true);
  };

  const openEditModal = () => {
    if (!selectedItem) return;
    if (selectedItem.status === 'Cancelled' || selectedItem.status === 'Expired') {
      alert("Error: Cannot edit Cancelled or Expired MRP records.");
      return;
    }
    setIsEditingModal(true);
    const product = products.find((p) => p.name === selectedItem.productName);
    setNewMrp({
      id: selectedItem.id,
      productName: selectedItem.productName,
      productCode: selectedItem.productCode,
      category: selectedItem.category,
      productType: selectedItem.productType || product?.productType || '',
      currentMrp: product?.mrp ? String(product.mrp) : '',
      newMrp: selectedItem.mrp.toString(),
      effectiveDate: selectedItem.effectiveDate,
      revisionReason: selectedItem.revisionReason || '',
      remarks: selectedItem.remarks || '',
      revisedBy: selectedItem.revisedBy,
      status: selectedItem.status
    });
    setShowModal(true);
  };

  const handleSaveMrp = () => {
    if (!newMrp.productName || !newMrp.newMrp || !newMrp.effectiveDate || !newMrp.revisionReason || !newMrp.status) {
      alert("Please fill all mandatory fields (*).");
      return;
    }

    const newMrpVal = Number(newMrp.newMrp);
    if (isNaN(newMrpVal) || newMrpVal <= 0) {
      alert("Error: MRP must be a positive numeric value greater than 0.");
      return;
    }
    if (newMrpVal > 999999) {
      alert("Error: MRP exceeds maximum sensible ERP limit (₹9,99,999).");
      return;
    }

    // Pricing Chain validation
    const product = products.find(p => p.code === newMrp.productCode);
    if (product) {
      const ptr = parseFloat(product.ptr) || 0;
      const pts = parseFloat(product.pts) || 0;
      const purchasePrice = parseFloat(product.purchasePrice) || 0;
      if (newMrpVal < ptr || newMrpVal < pts || newMrpVal < purchasePrice) {
        alert(`Error: MRP cannot be lower than the product's selling chain rates (PTR: ₹${ptr}, PTS: ₹${pts}, Purchase Price: ₹${purchasePrice}).`);
        return;
      }
    }

    // Effective Date cannot be prior to latest existing effective date
    const sameProductMrps = data.filter(item => item.productCode === newMrp.productCode && item.id !== newMrp.id);
    if (sameProductMrps.length > 0) {
      const latestEffectiveDate = sameProductMrps.reduce((latest, item) => 
        item.effectiveDate > latest ? item.effectiveDate : latest, sameProductMrps[0].effectiveDate);
      
      if (newMrp.effectiveDate < latestEffectiveDate) {
        alert(`Error: The effective date (${newMrp.effectiveDate}) cannot be earlier than the latest existing effective date (${latestEffectiveDate}) for this product.`);
        return;
      }
    }

    // Duplicate combinations check
    const isDuplicate = data.some(
      (item) => item.productCode === newMrp.productCode && item.effectiveDate === newMrp.effectiveDate && item.id !== newMrp.id
    );
    if (isDuplicate) {
      alert(`Error: An MRP record for product "${newMrp.productName}" on effective date "${newMrp.effectiveDate}" already exists.`);
      return;
    }

    const resolvedStatus = resolveStatus(newMrp.effectiveDate, newMrp.status as any);
    
    // Deactivate older active revisions
    let resolvedList = data;
    if (resolvedStatus === 'Active') {
      resolvedList = data.map(item => 
        (item.productCode === newMrp.productCode && item.status === 'Active' && item.id !== newMrp.id)
          ? { ...item, status: 'Expired' as const }
          : item
      );
    }
    
    if (isEditingModal && newMrp.id) {
      const updatedRecord: MRPItem = {
        id: newMrp.id,
        productCode: newMrp.productCode || 'N/A',
        productName: newMrp.productName,
        category: newMrp.category || 'N/A',
        productType: newMrp.productType,
        mrp: newMrpVal,
        previousMrp: Number(newMrp.currentMrp) || undefined,
        effectiveDate: newMrp.effectiveDate,
        revisionReason: newMrp.revisionReason,
        remarks: newMrp.remarks,
        revisedBy: newMrp.revisedBy,
        status: resolvedStatus
      };
      
      setData(resolvedList.map(item => item.id === updatedRecord.id ? updatedRecord : item));

      // Sync active MRP back to product master immediately
      if (resolvedStatus === 'Active') {
        const updatedProducts = products.map((p) =>
          p.code === updatedRecord.productCode ? { ...p, mrp: newMrpVal.toFixed(2) } : p
        );
        productService.saveProducts(updatedProducts);
      }

      activityLogService.addLog({
        userId: currentUser?.id,
        userName: currentUser?.fullName,
        action: `MRP Updated - Product: ${newMrp.productName}, New Price: ₹${newMrpVal} (${resolvedStatus})`,
        module: "MRP Management",
      });
      if (selectedItem && selectedItem.id === updatedRecord.id) {
        setSelectedItem(updatedRecord);
      }
    } else {
      const record: MRPItem = {
        id: Date.now().toString(),
        productCode: newMrp.productCode || 'N/A',
        productName: newMrp.productName,
        category: newMrp.category || 'N/A',
        productType: newMrp.productType,
        mrp: newMrpVal,
        previousMrp: Number(newMrp.currentMrp) || undefined,
        effectiveDate: newMrp.effectiveDate,
        revisionReason: newMrp.revisionReason,
        remarks: newMrp.remarks,
        revisedBy: newMrp.revisedBy,
        status: resolvedStatus
      };
      setData([record, ...resolvedList]);

      // Sync active MRP back to product master immediately
      if (resolvedStatus === 'Active') {
        const updatedProducts = products.map((p) =>
          p.code === record.productCode ? { ...p, mrp: newMrpVal.toFixed(2) } : p
        );
        productService.saveProducts(updatedProducts);
      }

      activityLogService.addLog({
        userId: currentUser?.id,
        userName: currentUser?.fullName,
        action: `MRP Created - Product: ${newMrp.productName}, Price: ₹${newMrpVal} (${resolvedStatus})`,
        module: "MRP Management",
      });
    }
    
    setShowModal(false);
  };

  const handleDelete = () => {
    if (itemToDelete) {
      const inUse = checkMrpInUse(itemToDelete);
      if (inUse) {
        const updated = data.map(item =>
          item.id === itemToDelete.id ? { ...item, status: 'Cancelled' as const } : item
        );
        setData(updated);
        activityLogService.addLog({
          userId: currentUser?.id,
          userName: currentUser?.fullName,
          action: `MRP Deleted (Blocked - Marked Cancelled instead due to Invoice usage) for ${itemToDelete.productName}`,
          module: "MRP Management",
        });
        alert("Warning: This MRP is used in invoices. To preserve financial history, it was marked as Cancelled instead of deleted.");
      } else {
        setData(data.filter(item => item.id !== itemToDelete.id));
        activityLogService.addLog({
          userId: currentUser?.id,
          userName: currentUser?.fullName,
          action: `MRP Deleted - Product: ${itemToDelete.productName}, Price: ₹${itemToDelete.mrp}`,
          module: "MRP Management",
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
          You do not have permission to view Product Management.
        </p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="MRP Management"
        subtitle="Manage Maximum Retail Price (MRP), revisions, and product-wise pricing controls."
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
              New MRP
            </ActionButton>
             )}
          </>
        }
      />

      <FilterBar>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search product..."
        />

        <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-600">
            Filters:
          </span>
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

      {/* MRP Details Drawer */}
      <Drawer open={!!selectedItem} onClose={() => setSelectedItem(null)} title="MRP Details">
        {selectedItem && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Product Information</h3>
              <div className="space-y-2">
                <DrawerField label="Product Code" value={selectedItem.productCode || 'N/A'} />
                <DrawerField label="Product Name" value={selectedItem.productName || 'N/A'} />
                <DrawerField label="Category" value={selectedItem.category || 'N/A'} />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Pricing Information</h3>
              <div className="space-y-2">
                <DrawerField label="Previous MRP" value={selectedItem.previousMrp ? `₹${selectedItem.previousMrp}` : 'N/A'} />
                <DrawerField 
                  label="Current MRP" 
                  value={
                    <span className="flex items-center gap-2">
                      ₹{selectedItem.mrp}
                      {selectedItem.previousMrp !== undefined && (
                        <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${selectedItem.mrp >= selectedItem.previousMrp ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                          {calculatePriceChangePercentage(selectedItem.previousMrp, selectedItem.mrp)}
                        </span>
                      )}
                    </span>
                  } 
                />
                <DrawerField label="Effective Date" value={selectedItem.effectiveDate || 'N/A'} />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Revision Information</h3>
              <div className="space-y-2">
                <DrawerField label="Revision Reason" value={selectedItem.revisionReason || 'N/A'} />
                <DrawerField label="Remarks" value={selectedItem.remarks || 'N/A'} />
                <DrawerField label="Revised By" value={selectedItem.revisedBy || 'N/A'} />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Status Information</h3>
              <div className="space-y-2">
                <DrawerField 
                  label="Status" 
                  value={
                    <Badge variant={selectedItem.status === 'Active' ? 'success' : selectedItem.status === 'Scheduled' ? 'warning' : selectedItem.status === 'Draft' || selectedItem.status === 'Cancelled' ? 'neutral' : 'danger'}>
                      {selectedItem.status}
                    </Badge>
                  } 
                />
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
              {canEdit && selectedItem.status !== 'Cancelled' && selectedItem.status !== 'Expired' && (
              <ActionButton onClick={openEditModal}>Edit MRP</ActionButton>
              )}
              <ActionButton variant="secondary" onClick={() => setSelectedItem(null)}>Close</ActionButton>
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
            <h3 className="text-lg font-bold text-slate-900 mb-2">Delete MRP Record</h3>
            <p className="text-sm text-slate-500 mb-6">
              Are you sure you want to delete this MRP record? This action cannot be undone.
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

      {/* New/Edit MRP Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">{isEditingModal ? 'Edit MRP' : 'New MRP'}</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-slate-800">✕</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* PRODUCT INFORMATION */}
              <div className="md:col-span-2 mt-2 first:mt-0">
                <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">PRODUCT INFORMATION</h3>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Product *</label>
                <select 
                  value={newMrp.productName} 
                  onChange={(e) => !isEditingModal && handleProductSelect(e.target.value)} 
                  disabled={isEditingModal}
                  className={`w-full border border-slate-200 rounded-lg px-3 py-2 ${isEditingModal ? 'bg-slate-50 opacity-70 cursor-not-allowed' : ''}`}
                >
                  <option value="">Select Product</option>
                  {products.map(p => <option key={p.code} value={p.name}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Product Code</label>
                <input value={newMrp.productCode} readOnly className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <input value={newMrp.category} readOnly className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Product Type</label>
                <input value={newMrp.productType} readOnly className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50" />
              </div>

              {/* CURRENT PRICING INFORMATION */}
              <div className="md:col-span-2 mt-4">
                <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">CURRENT PRICING INFORMATION</h3>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Current MRP</label>
                <input value={newMrp.currentMrp ? `₹${newMrp.currentMrp}` : ''} readOnly className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50" />
              </div>

              {/* NEW PRICING INFORMATION */}
              <div className="md:col-span-2 mt-4">
                <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">NEW PRICING INFORMATION</h3>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">New MRP *</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-500">₹</span>
                  <input type="number" value={newMrp.newMrp} onChange={(e) => setNewMrp({ ...newMrp, newMrp: e.target.value })} className="w-full border border-slate-200 rounded-lg pl-7 pr-3 py-2" />
                </div>
                {newMrp.currentMrp && newMrp.newMrp && (
                  <p className="text-xs mt-1 font-medium text-slate-500">
                    Change: {calculatePriceChangePercentage(Number(newMrp.currentMrp), Number(newMrp.newMrp))}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Effective Date *</label>
                <input type="date" value={newMrp.effectiveDate} onChange={(e) => setNewMrp({ ...newMrp, effectiveDate: e.target.value })} className="w-full border border-slate-200 rounded-lg px-3 py-2" />
              </div>

              {/* REVISION INFORMATION */}
              <div className="md:col-span-2 mt-4">
                <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">REVISION INFORMATION</h3>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Revision Reason *</label>
                <select value={newMrp.revisionReason} onChange={(e) => setNewMrp({ ...newMrp, revisionReason: e.target.value })} className="w-full border border-slate-200 rounded-lg px-3 py-2">
                  <option value="">Select Reason</option>
                  <option value="Cost Increase">Cost Increase</option>
                  <option value="Cost Reduction">Cost Reduction</option>
                  <option value="Government Regulation">Government Regulation</option>
                  <option value="Marketing Strategy">Marketing Strategy</option>
                  <option value="Distributor Request">Distributor Request</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Remarks</label>
                <textarea rows={2} value={newMrp.remarks} onChange={(e) => setNewMrp({ ...newMrp, remarks: e.target.value })} className="w-full border border-slate-200 rounded-lg px-3 py-2" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Revised By</label>
                <input value={newMrp.revisedBy} readOnly className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50" />
              </div>

              {/* STATUS INFORMATION */}
              <div className="md:col-span-2 mt-4">
                <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">STATUS INFORMATION</h3>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Status *</label>
                <select value={newMrp.status} onChange={(e) => setNewMrp({ ...newMrp, status: e.target.value as any })} className="w-full border border-slate-200 rounded-lg px-3 py-2">
                  <option value="Draft">Draft</option>
                  <option value="Scheduled">Scheduled</option>
                  <option value="Active">Active</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="Expired">Expired</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-100">
              <ActionButton variant="secondary" onClick={() => setShowModal(false)}>Cancel</ActionButton>
              <ActionButton onClick={handleSaveMrp}>{isEditingModal ? 'Save Changes' : 'Save MRP'}</ActionButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}