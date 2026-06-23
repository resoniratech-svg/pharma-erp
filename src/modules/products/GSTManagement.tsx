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
import activityLogService from "../../services/activityLogService";
import authService from '../../services/authService';
import { hasModulePermission } from '../../utils/permissionUtils';



interface GST {
  id: string;
  hsnCode: string;
  description: string;
  sgst: string;
  cgst: string;
  igst: string;
  totalGst: string;
  createdBy?: string;
  lastUpdatedBy?: string;
  lastUpdatedDate?: string;
  status: 'Active' | 'Inactive';
}

const initialMockData: GST[] = [
  { id: '1', hsnCode: '30049099', description: 'Medicaments consisting of mixed or unmixed products', sgst: '6%', cgst: '6%', igst: '12%', totalGst: '12%', createdBy: 'Admin User', lastUpdatedBy: 'Admin User', lastUpdatedDate: '2026-06-01', status: 'Active' },
  { id: '2', hsnCode: '30041010', description: 'Penicillins or derivatives thereof', sgst: '6%', cgst: '6%', igst: '12%', totalGst: '12%', createdBy: 'Admin User', lastUpdatedBy: 'System', lastUpdatedDate: '2026-06-05', status: 'Active' },
  { id: '3', hsnCode: '30022011', description: 'Vaccines for human medicine', sgst: '2.5%', cgst: '2.5%', igst: '5%', totalGst: '5%', createdBy: 'System', lastUpdatedBy: 'Admin User', lastUpdatedDate: '2026-06-10', status: 'Active' },
  { id: '4', hsnCode: '30061010', description: 'Sterile surgical catgut', sgst: '6%', cgst: '6%', igst: '12%', totalGst: '12%', createdBy: 'Admin User', lastUpdatedBy: 'Admin User', lastUpdatedDate: '2025-12-01', status: 'Inactive' },
];

export default function GSTManagement() {
  

  
  const [data, setData] = useState<GST[]>([]);

  useEffect(() => {
    const savedData = gstService.getAll();

    if (savedData.length > 0) {
      setData(savedData);
    } else {
      gstService.saveAll(initialMockData);
    }
  }, []);

  useEffect(() => {
    if (data.length > 0) {
      gstService.saveAll(data);
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
    sgst: '',
    cgst: '',
    igst: '',
    totalGst: '',
    status: 'Active' as 'Active' | 'Inactive'
  });

  // Auto-calculate Total GST based on SGST and CGST inputs
  useEffect(() => {
    const s = parseFloat(newGst.sgst.replace(/[^0-9.]/g, '')) || 0;
    const c = parseFloat(newGst.cgst.replace(/[^0-9.]/g, '')) || 0;
    const total = s + c;
    setNewGst(prev => ({
      ...prev,
      totalGst: total > 0 ? `${total}%` : ''
    }));
  }, [newGst.sgst, newGst.cgst]);

  const columns: Column<GST>[] = [
    { key: 'hsnCode', label: 'HSN Code', render: (row) => <span className="font-semibold text-slate-900">{row.hsnCode}</span> },
    { key: 'description', label: 'Description', render: (row) => <span className="max-w-xs truncate block" title={row.description}>{row.description}</span> },
    { key: 'sgst', label: 'SGST' },
    { key: 'cgst', label: 'CGST' },
    { key: 'igst', label: 'IGST' },
    { key: 'totalGst', label: 'Total GST', render: (row) => <span className="font-bold text-slate-800">{row.totalGst}</span> },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const variant = row.status === 'Active' ? 'success' : 'neutral';
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
    const matchSearch = item.hsnCode.includes(search) || item.description.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  const handleExport = () => {
    const headers = ['HSN Code', 'Description', 'SGST %', 'CGST %', 'IGST %', 'Total GST %', 'Status'];
    const csvContent = [
      headers.join(','),
      ...filteredData.map(row => 
        [
          row.hsnCode, 
          `"${row.description.replace(/"/g, '""')}"`, 
          row.sgst.replace(/[^0-9.]/g, ''), 
          row.cgst.replace(/[^0-9.]/g, ''), 
          row.igst.replace(/[^0-9.]/g, ''), 
          row.totalGst.replace(/[^0-9.]/g, ''), 
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
      sgst: '',
      cgst: '',
      igst: '',
      totalGst: '',
      status: 'Active'
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
      sgst: selectedGST.sgst.replace(/[^0-9.]/g, ''),
      cgst: selectedGST.cgst.replace(/[^0-9.]/g, ''),
      igst: selectedGST.igst.replace(/[^0-9.]/g, ''),
      totalGst: selectedGST.totalGst.replace(/[^0-9.]/g, ''),
      status: selectedGST.status
    });
    setShowModal(true);
  };

  const handleSaveGst = () => {
    if (!newGst.hsnCode || !newGst.description || !newGst.sgst || !newGst.cgst || !newGst.igst || !newGst.status) {
      alert("Please fill all mandatory fields (*).");
      return;
    }
    
    const formatPct = (val: string) => val ? `${parseFloat(val)}%` : '';
    
    if (isEditingModal && newGst.id) {
      const updatedRecord: GST = {
        id: newGst.id,
        hsnCode: newGst.hsnCode, // Should not change due to readOnly, but retained
        description: newGst.description,
        sgst: formatPct(newGst.sgst),
        cgst: formatPct(newGst.cgst),
        igst: formatPct(newGst.igst),
        totalGst: newGst.totalGst, // Already auto-calculated and formatted in state effect
        createdBy: selectedGST?.createdBy || 'Admin User',
        lastUpdatedBy: 'Admin User',
        lastUpdatedDate: new Date().toISOString().split('T')[0],
        status: newGst.status as any
      };
      
      setData(data.map(item => item.id === updatedRecord.id ? updatedRecord : item));
      activityLogService.addLog({
        userId: currentUser.id,
        userName: currentUser.fullName,
        action: "GST Updated",
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
        sgst: formatPct(newGst.sgst),
        cgst: formatPct(newGst.cgst),
        igst: formatPct(newGst.igst),
        totalGst: newGst.totalGst,
        createdBy: 'Admin User',
        lastUpdatedBy: 'Admin User',
        lastUpdatedDate: new Date().toISOString().split('T')[0],
        status: newGst.status as any
      };
      setData([record, ...data]);
      activityLogService.addLog({
        userId: currentUser.id,
        userName: currentUser.fullName,
        action: "GST Created",
        module: "GST Management",
      });
    }
    
    setShowModal(false);
  };

  const handleDelete = () => {
    if (itemToDelete) {
      setData(data.filter(item => item.id !== itemToDelete.id));
      activityLogService.addLog({
        userId: currentUser.id,
        userName: currentUser.fullName,
        action: "GST Deleted",
        module: "GST Management",
      });
      setItemToDelete(null);
    }
  };

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="GST Management"
        subtitle="Manage HSN codes and GST taxation rates."
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
                Add HSN Code
              </ActionButton>
            )}
          </>
        }
      />

      <FilterBar>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by HSN or description..."
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
                HSN Information
              </h3>
              <div className="space-y-2">
                <DrawerField label="HSN Code" value={selectedGST.hsnCode} />
                <DrawerField
                  label="Description"
                  value={selectedGST.description}
                />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">
                GST Information
              </h3>
              <div className="space-y-2">
                <DrawerField label="SGST %" value={selectedGST.sgst} />
                <DrawerField label="CGST %" value={selectedGST.cgst} />
                <DrawerField label="IGST %" value={selectedGST.igst} />
                <DrawerField label="Total GST %" value={selectedGST.totalGst} />
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
                  value={selectedGST.lastUpdatedDate || "N/A"}
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
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
              {canEdit && (
                <ActionButton onClick={openEditModal}>Edit HSN</ActionButton>
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-rose-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Delete HSN Code
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              Are you sure you want to delete this HSN code? This action cannot
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

      {/* Add/Edit HSN Modal Form */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">
                {isEditingModal ? "Edit HSN Rates" : "Add HSN Code"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-500 hover:text-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* HSN INFORMATION */}
              <div className="md:col-span-2 mt-2 first:mt-0">
                <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">
                  HSN INFORMATION
                </h3>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">
                  HSN Code *
                </label>
                <input
                  value={newGst.hsnCode}
                  onChange={(e) =>
                    setNewGst({ ...newGst, hsnCode: e.target.value })
                  }
                  readOnly={isEditingModal}
                  className={`w-full border border-slate-200 rounded-lg px-3 py-2 ${isEditingModal ? "bg-slate-50 opacity-70 cursor-not-allowed" : ""}`}
                  placeholder="e.g. 30049099"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">
                  Description *
                </label>
                <textarea
                  rows={2}
                  value={newGst.description}
                  onChange={(e) =>
                    setNewGst({ ...newGst, description: e.target.value })
                  }
                  className="w-full border border-slate-200 rounded-lg px-3 py-2"
                  placeholder="Enter detailed description"
                />
              </div>

              {/* GST INFORMATION */}
              <div className="md:col-span-2 mt-4">
                <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">
                  GST INFORMATION
                </h3>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  SGST % *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    value={newGst.sgst}
                    onChange={(e) =>
                      setNewGst({ ...newGst, sgst: e.target.value })
                    }
                    className="w-full border border-slate-200 rounded-lg pr-7 pl-3 py-2"
                  />
                  <span className="absolute right-3 top-2 text-slate-500">
                    %
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  CGST % *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    value={newGst.cgst}
                    onChange={(e) =>
                      setNewGst({ ...newGst, cgst: e.target.value })
                    }
                    className="w-full border border-slate-200 rounded-lg pr-7 pl-3 py-2"
                  />
                  <span className="absolute right-3 top-2 text-slate-500">
                    %
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  IGST % *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    value={newGst.igst}
                    onChange={(e) =>
                      setNewGst({ ...newGst, igst: e.target.value })
                    }
                    className="w-full border border-slate-200 rounded-lg pr-7 pl-3 py-2"
                  />
                  <span className="absolute right-3 top-2 text-slate-500">
                    %
                  </span>
                </div>
              </div>

              {/* AUTO CALCULATION */}
              <div className="md:col-span-2 mt-4">
                <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">
                  AUTO CALCULATION
                </h3>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1 text-indigo-700">
                  Total GST %
                </label>
                <input
                  value={newGst.totalGst}
                  readOnly
                  className="w-full border border-indigo-200 rounded-lg px-3 py-2 bg-indigo-50 font-bold text-indigo-900"
                />
              </div>

              {/* STATUS INFORMATION */}
              <div className="md:col-span-2 mt-4">
                <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">
                  STATUS INFORMATION
                </h3>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">
                  Status *
                </label>
                <select
                  value={newGst.status}
                  onChange={(e) =>
                    setNewGst({ ...newGst, status: e.target.value as any })
                  }
                  className="w-full border border-slate-200 rounded-lg px-3 py-2"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
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
                      : "Admin User"
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
                      ? selectedGST?.lastUpdatedDate || "N/A"
                      : new Date().toISOString().split("T")[0]
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
                {isEditingModal ? "Save Changes" : "Save HSN"}
              </ActionButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
