import { useEffect, useState } from "react";
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
import activityLogService from "../../services/activityLogService";

import { hsnService, type HSNCode } from "../../services/hsnService";

const initialMockData: HSNCode[] = [
  { id: '1', code: '30049011', description: 'Medicaments consisting of mixed or unmixed products for therapeutic or prophylactic uses', status: 'Active', createdAt: '2023-01-10', updatedAt: '2023-01-10' },
  { id: '2', code: '30041000', description: 'Containing penicillins or derivatives thereof, with a penicillanic acid structure', status: 'Active', createdAt: '2023-02-15', updatedAt: '2023-02-15' },
];

const formatDate = (dateString: string | undefined) => {
  if (!dateString) return "-";
  if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const [year, month, day] = dateString.split('-');
    return `${day}-${month}-${year}`;
  }
  const date = new Date(dateString);
  if (!isNaN(date.getTime())) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }
  return dateString;
};

export default function HSNMaster() {
  const [data, setData] = useState<HSNCode[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  const [selectedHSN, setSelectedHSN] = useState<HSNCode | null>(null);
  const [itemToDelete, setItemToDelete] = useState<HSNCode | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isEditingModal, setIsEditingModal] = useState(false);

  const canCreate = true;
  const canEdit = true;
  const canDelete = true;

  const [newHSN, setNewHSN] = useState({
    id: '',
    code: '',
    description: '',
    status: 'Active' as 'Active' | 'Inactive',
    remarks: '',
  });

  const currentUser = JSON.parse(localStorage.getItem("authUser") || "{}");

  const columns: Column<HSNCode>[] = [
    { key: 'code', label: 'HSN Code', render: (row) => <span className="font-semibold text-slate-900">{row.code}</span> },
    { key: 'description', label: 'Description', render: (row) => <span className="text-slate-500">{row.description}</span> },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const variant = row.status === 'Active' ? 'success' : 'neutral';
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    },
    { key: 'createdOn', label: 'Created On', render: (row) => formatDate(row.createdAt) },
    { key: 'lastUpdated', label: 'Last Updated', render: (row) => formatDate(row.updatedAt) },
    {
      key: 'id',
      label: 'Actions',
      render: (row) => (
        <div className="flex gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedHSN(row);
            }}
            className="text-[#163c78] font-medium hover:text-[#0c1f3d]"
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
    const matchSearch = item.description.toLowerCase().includes(search.toLowerCase()) || item.code.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  const handleExport = () => {
    const headers = ['HSN Code', 'Description', 'Status', 'Created On', 'Last Updated', 'Remarks'];
    const csvContent = [
      headers.join(','),
      ...filteredData.map(row => 
        [
          `"${row.code}"`, 
          `"${row.description.replace(/"/g, '""')}"`, 
          row.status,
          formatDate(row.createdAt),
          formatDate(row.updatedAt),
          `"${(row.remarks || '').replace(/"/g, '""')}"`
        ].join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'hsn_master_export.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openNewModal = () => {
    setIsEditingModal(false);
    setNewHSN({
      id: '',
      code: '',
      description: '',
      status: 'Active',
      remarks: ''
    });
    setShowModal(true);
  };

  const openEditModal = () => {
    if (!selectedHSN) return;
    setIsEditingModal(true);
    setNewHSN({
      id: selectedHSN.id,
      code: selectedHSN.code,
      description: selectedHSN.description,
      status: selectedHSN.status,
      remarks: selectedHSN.remarks || ''
    });
    setShowModal(true);
  };

  const handleSaveHSN = async () => {
    if (!newHSN.code || !newHSN.description || !newHSN.status) {
      alert("Please fill all mandatory fields (*).");
      return;
    }

    if (!/^\d{1,8}$/.test(newHSN.code)) {
      alert("HSN Code must be numeric and maximum 8 digits.");
      return;
    }

    const isDuplicate = data.some(item => item.code === newHSN.code && item.id !== newHSN.id);
    if (isDuplicate) {
      alert("HSN Code must be unique.");
      return;
    }
    
    const today = new Date().toISOString().split('T')[0];
    
    try {
      if (isEditingModal && newHSN.id) {
        const payload: Partial<HSNCode> = {
          code: newHSN.code,
          description: newHSN.description,
          status: newHSN.status as 'Active' | 'Inactive',
          remarks: newHSN.remarks,
        };
        
        const updatedRecord = await hsnService.update(newHSN.id, payload);
        
        setData(data.map(item => item.id === newHSN.id ? updatedRecord : item));
        activityLogService.addLog({
          userId: currentUser.id,
          userName: currentUser.fullName,
          action: "HSN Code Updated",
          module: "HSN Master",
        });
        if (selectedHSN && selectedHSN.id === updatedRecord.id) {
          setSelectedHSN(updatedRecord);
        }
      } else {
        const payload: Partial<HSNCode> = {
          code: newHSN.code,
          description: newHSN.description,
          status: newHSN.status as 'Active' | 'Inactive',
          remarks: newHSN.remarks,
        };
        
        const newRecord = await hsnService.create(payload);
        setData([newRecord, ...data]);
        activityLogService.addLog({
          userId: currentUser.id,
          userName: currentUser.fullName,
          action: "HSN Code Created",
          module: "HSN Master",
        });
      }
      
      setShowModal(false);
    } catch (error) {
      console.error("Error saving HSN:", error);
      alert("Failed to save HSN code.");
    }
  };

  const handleDelete = async () => {
    if (itemToDelete) {
      try {
        if (itemToDelete.id) {
          await hsnService.delete(itemToDelete.id);
        }
        setData(data.filter(item => item.id !== itemToDelete.id));
        activityLogService.addLog({
          userId: currentUser.id,
          userName: currentUser.fullName,
          action: "HSN Code Deleted",
          module: "HSN Master",
         });
        setItemToDelete(null);
      } catch (error) {
        console.error("Error deleting HSN:", error);
        alert("Failed to delete HSN code.");
      }
    }
  };

  const fetchHSNs = async () => {
    try {
      const savedData = await hsnService.getAll();
      setData(savedData || []);
    } catch (error) { console.error(error); setData([]); }
  };

  useEffect(() => {
    fetchHSNs();
  }, []);

  const activeCount = data.filter(d => d.status === 'Active').length;
  const inactiveCount = data.filter(d => d.status === 'Inactive').length;
  const recentlyAddedCount = data.filter(d => {
    const diff = new Date().getTime() - new Date(d.createdAt).getTime();
    return diff < 7 * 24 * 60 * 60 * 1000;
  }).length;

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="HSN Master"
        subtitle="Manage HSN classifications used throughout Product Management and GST Management."
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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <span className="text-sm font-medium text-slate-500 mb-1">Total HSN Codes</span>
          <span className="text-2xl font-bold text-slate-900">{data.length}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <span className="text-sm font-medium text-slate-500 mb-1">Active HSN Codes</span>
          <span className="text-2xl font-bold text-emerald-600">{activeCount}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <span className="text-sm font-medium text-slate-500 mb-1">Inactive HSN Codes</span>
          <span className="text-2xl font-bold text-rose-600">{inactiveCount}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <span className="text-sm font-medium text-slate-500 mb-1">Recently Added</span>
          <span className="text-2xl font-bold text-blue-600">{recentlyAddedCount}</span>
        </div>
      </div>

      <FilterBar>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search HSN code or description..."
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
          onRowClick={(row) => setSelectedHSN(row)}
          emptyMessage="No HSN codes found."
        />
      </TableCard>

      <Drawer
        open={!!selectedHSN}
        onClose={() => setSelectedHSN(null)}
        title="HSN Details"
      >
        {selectedHSN && (
          <div className="space-y-4">
            <DrawerField label="HSN Code" value={selectedHSN.code} />
            <DrawerField label="Description" value={selectedHSN.description} />
            <DrawerField
              label="Status"
              value={
                <Badge
                  variant={selectedHSN.status === "Active" ? "success" : "neutral"}
                >
                  {selectedHSN.status}
                </Badge>
              }
            />
            <DrawerField label="Created On" value={formatDate(selectedHSN.createdAt)} />
            <DrawerField label="Updated On" value={formatDate(selectedHSN.updatedAt)} />
            <DrawerField label="Remarks" value={selectedHSN.remarks || "N/A"} />

            <div className="pt-6 border-t border-slate-100 flex justify-end gap-3 mt-4">
              {canEdit && (
                <ActionButton onClick={openEditModal}>
                  Edit HSN
                </ActionButton>
              )}
              <ActionButton
                variant="secondary"
                onClick={() => setSelectedHSN(null)}
              >
                Close
              </ActionButton>
            </div>
          </div>
        )}
      </Drawer>

      {itemToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setItemToDelete(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-rose-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Delete HSN Code
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              Are you sure you want to delete this HSN code? This action cannot be undone.
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

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">
                {isEditingModal ? "Edit HSN Code" : "Add HSN Code"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-500 hover:text-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="mt-2 first:mt-0">
                <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">
                  Basic Information
                </h3>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    HSN Code *
                  </label>
                  <input
                    type="text"
                    maxLength={8}
                    value={newHSN.code}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/\D/g, "").slice(0, 8);
                      setNewHSN({ ...newHSN, code: clean });
                    }}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                    placeholder="e.g. 30049011"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Description *
                  </label>
                  <input
                    type="text"
                    value={newHSN.description}
                    onChange={(e) =>
                      setNewHSN({ ...newHSN, description: e.target.value })
                    }
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                    placeholder="HSN Description"
                  />
                </div>
              </div>

              <div className="mt-4">
                <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">
                  Additional Information
                </h3>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Status *
                  </label>
                  <select
                    value={newHSN.status}
                    onChange={(e) =>
                      setNewHSN({ ...newHSN, status: e.target.value as any })
                    }
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
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
                    value={newHSN.remarks}
                    onChange={(e) =>
                      setNewHSN({ ...newHSN, remarks: e.target.value })
                    }
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                    placeholder="Optional remarks"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-100">
              <ActionButton
                variant="secondary"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </ActionButton>
              <ActionButton
                onClick={() => {
                  if (
                    (isEditingModal && !canEdit) ||
                    (!isEditingModal && !canCreate)
                  ) {
                    return;
                  }
                  handleSaveHSN();
                }}
              >
                {isEditingModal ? "Save Changes" : "Save HSN"}
              </ActionButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}