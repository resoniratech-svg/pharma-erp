import { useState, useEffect } from 'react';
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
import { gstService } from '../../services/gstService';
import { productService } from '../../services/productService';
import activityLogService from "../../services/activityLogService";
import authService from '../../services/authService';
import { hsnService, type HSNCode } from '../../services/hsnService';

export interface GST {
  id: string;
  hsnCode: string;
  description: string;
  gstPercent: string;
  effectiveDate?: string;
  createdBy?: string;
  lastUpdatedBy?: string;
  lastUpdatedDate?: string;
  status: 'Active' | 'Inactive';
  remarks?: string;
}

const initialMockData: GST[] = [
  { id: '1', hsnCode: '30049099', description: 'Medicaments consisting of mixed or unmixed products', gstPercent: '12%', effectiveDate: '2026-06-01', createdBy: 'Admin User', lastUpdatedBy: 'Admin User', lastUpdatedDate: '2026-06-01', status: 'Active' },
  { id: '2', hsnCode: '30041010', description: 'Penicillins or derivatives thereof', gstPercent: '12%', effectiveDate: '2026-06-05', createdBy: 'Admin User', lastUpdatedBy: 'System', lastUpdatedDate: '2026-06-05', status: 'Active' },
  { id: '3', hsnCode: '30022011', description: 'Vaccines for human medicine', gstPercent: '5%', effectiveDate: '2026-06-10', createdBy: 'System', lastUpdatedBy: 'Admin User', lastUpdatedDate: '2026-06-10', status: 'Active' },
  { id: '4', hsnCode: '30061010', description: 'Sterile surgical catgut', gstPercent: '12%', effectiveDate: '2025-12-01', createdBy: 'Admin User', lastUpdatedBy: 'Admin User', lastUpdatedDate: '2025-12-01', status: 'Inactive' },
];

const formatDate = (dateString?: string): string => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = String(date.getDate()).padStart(2, '0');
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

/**
 * Reusable service method to get the current applicable GST for a given HSN code.
 * Business Rules:
 * - Retrieves all ACTIVE GST mappings for the selected HSN.
 * - Considers only mappings where Effective From is <= today's date.
 * - Sorts by Effective From in descending order to return the latest valid mapping.
 */
export const GetCurrentGSTByHSN = (hsnCode: string, allGstData?: GST[]): GST | null => {
  const data: GST[] = allGstData || gstService.getAll();
  const today = new Date().toISOString().split('T')[0];
  
  const validMappings = data.filter(
    (item) => 
      item.hsnCode === hsnCode && 
      item.status === 'Active' && 
      item.effectiveDate && 
      item.effectiveDate <= today
  );

  if (validMappings.length === 0) return null;

  validMappings.sort((a, b) => {
    const dateA = new Date(a.effectiveDate!).getTime();
    const dateB = new Date(b.effectiveDate!).getTime();
    return dateB - dateA;
  });

  return validMappings[0];
};

export default function GSTManagement() {
  const [data, setData] = useState<GST[]>([]);
  const [activeHSNs, setActiveHSNs] = useState<HSNCode[]>([]);

  useEffect(() => {
    const savedData = gstService.getAll();
    if (savedData.length > 0) {
      setData(savedData);
    } else {
      gstService.saveAll(initialMockData);
      setData(initialMockData);
    }
    setActiveHSNs(hsnService.getActive());
  }, []);

  useEffect(() => {
    if (data.length > 0) {
      gstService.saveAll(data);
    }
  }, [data]);

  const canCreate = true;
  const canEdit = true;
  const canDelete = true;

  const currentUser = authService.getCurrentUser();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  const [selectedGST, setSelectedGST] = useState<GST | null>(null);
  const [itemToDelete, setItemToDelete] = useState<GST | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isEditingModal, setIsEditingModal] = useState(false);

  const [newGst, setNewGst] = useState({
    id: '',
    hsnCode: '',
    description: '',
    gstPercent: '',
    effectiveDate: new Date().toISOString().split('T')[0],
    status: 'Active' as 'Active' | 'Inactive',
    remarks: ''
  });

  const columns: Column<GST>[] = [
    { key: 'hsnCode', label: 'HSN Code', render: (row) => <span className="font-semibold text-slate-900">{row.hsnCode}</span> },
    { key: 'description', label: 'Description', render: (row) => <span className="max-w-xs truncate block" title={row.description}>{row.description}</span> },
    { key: 'gstPercent', label: 'GST %', render: (row) => <span className="font-bold text-slate-800">{row.gstPercent}</span> },
    { key: 'effectiveDate', label: 'Effective From', render: (row) => formatDate(row.effectiveDate) },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const variant = row.status === 'Active' ? 'success' : 'neutral';
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    },
    { key: 'lastUpdatedDate', label: 'Last Updated', render: (row) => formatDate(row.lastUpdatedDate) },
    {
      key: 'id',
      label: 'Actions',
      render: (row) => (
        <div className="flex gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedGST(row);
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
    const matchSearch = item.hsnCode.includes(search) || 
                        item.description.toLowerCase().includes(search.toLowerCase()) || 
                        item.gstPercent.includes(search);
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  const handleExport = () => {
    const headers = ['HSN Code', 'Description', 'GST %', 'Effective From', 'Status'];
    const csvContent = [
      headers.join(','),
      ...filteredData.map(row => 
        [
          row.hsnCode,
          `"${row.description.replace(/"/g, '""')}"`, 
          row.gstPercent.replace(/[^0-9.]/g, ''), 
          formatDate(row.effectiveDate),
          row.status
        ].join(',')
      )
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'gst_export.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openNewModal = () => {
    setIsEditingModal(false);
    setNewGst({
      id: '',
      hsnCode: '',
      description: '',
      gstPercent: '',
      effectiveDate: new Date().toISOString().split('T')[0],
      status: 'Active',
      remarks: ''
    });
    setShowModal(true);
  };

  const openEditModal = () => {
    if (!selectedGST) return;
    setIsEditingModal(true);
    setNewGst({
      id: selectedGST.id,
      hsnCode: selectedGST.hsnCode,
      description: selectedGST.description,
      gstPercent: selectedGST.gstPercent,
      effectiveDate: selectedGST.effectiveDate || new Date().toISOString().split('T')[0],
      status: selectedGST.status,
      remarks: selectedGST.remarks || ''
    });
    setShowModal(true);
  };

  const handleSaveGst = () => {
    if (!newGst.hsnCode || !newGst.gstPercent || !newGst.status || !newGst.effectiveDate) {
      alert("Please fill all mandatory fields (*).");
      return;
    }

    const isDuplicate = data.some(item => 
      item.hsnCode === newGst.hsnCode && 
      item.effectiveDate === newGst.effectiveDate && 
      item.id !== newGst.id && 
      item.status === 'Active' && 
      newGst.status === 'Active'
    );
    
    if (isDuplicate) {
      alert(`Error: An active GST mapping for HSN Code "${newGst.hsnCode}" with Effective Date "${newGst.effectiveDate}" already exists.`);
      return;
    }
    
    if (isEditingModal && newGst.id) {
      const products = productService.getProducts();
      const isUsed = products.some(p => p.hsnCode === newGst.hsnCode);
      if (isUsed) {
        if (!window.confirm("Warning: This HSN is currently assigned to one or more products. Modifying its details will affect future transactions for these products. Do you want to proceed?")) {
          return;
        }
      }

      const updatedRecord: GST = {
        id: newGst.id,
        hsnCode: newGst.hsnCode,
        description: newGst.description,
        gstPercent: newGst.gstPercent,
        effectiveDate: newGst.effectiveDate,
        createdBy: selectedGST?.createdBy || currentUser?.fullName || 'Admin User',
        lastUpdatedBy: currentUser?.fullName || 'Admin User',
        lastUpdatedDate: new Date().toISOString().split('T')[0],
        status: newGst.status as any,
        remarks: newGst.remarks
      };
      
      let detailedAction = `GST HSN Code ${newGst.hsnCode} Updated`;
      if (selectedGST) {
        const changes: string[] = [];
        if (selectedGST.gstPercent !== newGst.gstPercent) changes.push(`GST: ${selectedGST.gstPercent} → ${newGst.gstPercent}`);
        if (selectedGST.status !== newGst.status) changes.push(`Status: ${selectedGST.status} → ${newGst.status}`);
        if (changes.length > 0) {
          detailedAction += ` (${changes.join(", ")})`;
        }
      }

      setData(data.map(item => item.id === updatedRecord.id ? updatedRecord : item));
      activityLogService.addLog({
        userId: currentUser?.id || 'admin',
        userName: currentUser?.fullName || 'Admin User',
        action: detailedAction,
        module: "GST Management",
      });

      if (selectedGST && selectedGST.id === updatedRecord.id) {
        setSelectedGST(updatedRecord);
      }
    } else {
      const record: GST = {
        id: Date.now().toString(),
        hsnCode: newGst.hsnCode,
        description: newGst.description,
        gstPercent: newGst.gstPercent,
        effectiveDate: newGst.effectiveDate,
        createdBy: currentUser?.fullName || 'Admin User',
        lastUpdatedBy: currentUser?.fullName || 'Admin User',
        lastUpdatedDate: new Date().toISOString().split('T')[0],
        status: newGst.status as any,
        remarks: newGst.remarks
      };
      setData([record, ...data]);
      activityLogService.addLog({
        userId: currentUser?.id || 'admin',
        userName: currentUser?.fullName || 'Admin User',
        action: `GST HSN Code ${newGst.hsnCode} Created with rate ${newGst.gstPercent}`,
        module: "GST Management",
      });
    }
    
    setShowModal(false);
  };

  const handleDelete = () => {
    if (itemToDelete) {
      const products = productService.getProducts();
      const isUsed = products.some(p => p.hsnCode === itemToDelete.hsnCode);
      
      if (isUsed) {
        alert(`Error: This GST Mapping cannot be deleted because the HSN Code "${itemToDelete.hsnCode}" is currently assigned to one or more products and referenced by existing business records. Consider changing its status to Inactive instead.`);
        setItemToDelete(null);
        return;
      }

      setData(data.filter(item => item.id !== itemToDelete.id));
      activityLogService.addLog({
        userId: currentUser?.id || 'admin',
        userName: currentUser?.fullName || 'Admin User',
        action: `GST Deleted - HSN Code: ${itemToDelete.hsnCode}`,
        module: "GST Management",
      });
      setItemToDelete(null);
    }
  };

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="GST Management"
        subtitle="Manage GST mappings for HSN classifications."
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
                Add GST Mapping
              </ActionButton>
            )}
          </>
        }
      />

      <FilterBar>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by HSN, description, or GST %..."
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
            { label: "Inactive", value: "Inactive" },
          ]}
          placeholder="All Status"
        />
      </FilterBar>

      <TableCard>
        <DataTable
          columns={columns}
          data={filteredData}
          onRowClick={(row) => setSelectedGST(row)}
          emptyMessage="No GST records found."
        />
      </TableCard>

      {/* GST Details Drawer */}
      <Drawer
        open={!!selectedGST}
        onClose={() => setSelectedGST(null)}
        title="GST Details"
      >
        {selectedGST && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">
                GST Mapping Information
              </h3>
              <div className="space-y-2">
                <DrawerField label="HSN Code" value={selectedGST.hsnCode} />
                <DrawerField
                  label="Description"
                  value={selectedGST.description}
                />
                <DrawerField label="GST %" value={selectedGST.gstPercent} />
                <DrawerField
                  label="Effective From"
                  value={formatDate(selectedGST.effectiveDate)}
                />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">
                Status Information
              </h3>
              <div className="space-y-2">
                <DrawerField
                  label="Status"
                  value={
                    <Badge
                      variant={
                        selectedGST.status === "Active" ? "success" : "neutral"
                      }
                    >
                      {selectedGST.status}
                    </Badge>
                  }
                />
                <DrawerField
                  label="Remarks"
                  value={selectedGST.remarks || "N/A"}
                />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">
                Audit Information
              </h3>
              <div className="space-y-2">
                <DrawerField
                  label="Created By"
                  value={selectedGST.createdBy || "System"}
                />
                <DrawerField
                  label="Last Updated By"
                  value={selectedGST.lastUpdatedBy || "System"}
                />
                <DrawerField
                  label="Last Updated Date"
                  value={formatDate(selectedGST.lastUpdatedDate)}
                />
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
              {canEdit && (
                <ActionButton onClick={openEditModal}>Edit</ActionButton>
              )}
              <ActionButton
                variant="secondary"
                onClick={() => setSelectedGST(null)}
              >
                Close
              </ActionButton>
            </div>
          </div>
        )}
      </Drawer>

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setItemToDelete(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-rose-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Delete GST Mapping
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              Are you sure you want to delete this GST mapping? This action cannot
              be undone.
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

      {/* Add/Edit GST Mapping Modal Form */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">
                {isEditingModal ? "Edit GST Mapping" : "Add GST Mapping"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-500 hover:text-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* GST MAPPING INFORMATION */}
              <div className="md:col-span-2 mt-2 first:mt-0">
                <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">
                  GST MAPPING INFORMATION
                </h3>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  HSN Code *
                </label>
                <select
                  value={newGst.hsnCode}
                  onChange={(e) => {
                    const code = e.target.value;
                    const selected = activeHSNs.find(h => h.code === code);
                    setNewGst({ ...newGst, hsnCode: code, description: selected ? selected.description : '' });
                  }}
                  disabled={isEditingModal}
                  className={`w-full border border-slate-200 rounded-lg px-3 py-2 ${isEditingModal ? "bg-slate-50 opacity-70 cursor-not-allowed" : "bg-white text-slate-900"}`}
                >
                  <option value="">Select HSN Code</option>
                  {activeHSNs.map(hsn => (
                    <option key={hsn.id} value={hsn.code}>{hsn.code} - {hsn.description.substring(0, 30)}{hsn.description.length > 30 ? '...' : ''}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  GST Slab *
                </label>
                <select
                  value={newGst.gstPercent}
                  onChange={(e) => setNewGst({ ...newGst, gstPercent: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-900"
                >
                  <option value="">Select GST %</option>
                  <option value="0%">0%</option>
                  <option value="5%">5%</option>
                  <option value="12%">12%</option>
                  <option value="18%">18%</option>
                  <option value="28%">28%</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Description *
                </label>
                <textarea
                  rows={2}
                  value={newGst.description}
                  readOnly
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 opacity-70 cursor-not-allowed"
                  placeholder="Auto-populated from HSN Code"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  Effective From *
                </label>
                <input
                  type="date"
                  value={newGst.effectiveDate}
                  onChange={(e) =>
                    setNewGst({ ...newGst, effectiveDate: e.target.value })
                  }
                  className="w-full border border-slate-200 rounded-lg px-3 py-2"
                />
              </div>

              {/* STATUS INFORMATION */}
              <div className="md:col-span-2 mt-4">
                <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">
                  STATUS INFORMATION
                </h3>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  Status *
                </label>
                <select
                  value={newGst.status}
                  onChange={(e) =>
                    setNewGst({ ...newGst, status: e.target.value as any })
                  }
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-900"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  Remarks
                </label>
                <input
                  type="text"
                  value={newGst.remarks}
                  onChange={(e) =>
                    setNewGst({ ...newGst, remarks: e.target.value })
                  }
                  className="w-full border border-slate-200 rounded-lg px-3 py-2"
                  placeholder="Optional remarks"
                />
              </div>

              {/* AUDIT INFORMATION */}
              <div className="md:col-span-2 mt-4">
                <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">
                  AUDIT INFORMATION
                </h3>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Created By
                </label>
                <input
                  value={
                    isEditingModal
                      ? selectedGST?.createdBy || "System"
                      : currentUser?.fullName || "Admin User"
                  }
                  readOnly
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 text-slate-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {isEditingModal ? "Last Updated Date" : "Created Date"}
                </label>
                <input
                  value={
                    isEditingModal
                      ? formatDate(selectedGST?.lastUpdatedDate)
                      : formatDate(new Date().toISOString().split("T")[0])
                  }
                  readOnly
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 text-slate-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-100">
              <ActionButton
                variant="secondary"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </ActionButton>
              <ActionButton onClick={handleSaveGst}>
                {isEditingModal ? "Save Changes" : "Save Mapping"}
              </ActionButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}