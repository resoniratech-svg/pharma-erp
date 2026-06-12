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

interface PackingType {
  id: string;
  name: string;
  code: string;
  uom: string; // Unit of measure
  description: string;
  status: 'Active' | 'Inactive';
}

const initialMockData: PackingType[] = [
  { id: '1', name: 'Alu-Alu Blister', code: 'BLS-ALU', uom: 'Strip', description: 'Double aluminum foil blister pack', status: 'Active' },
  { id: '2', name: 'PET Bottle', code: 'BTL-PET', uom: 'Bottle', description: '100ml amber PET bottle with measuring cap', status: 'Active' },
  { id: '3', name: 'Glass Vial', code: 'VIL-GLS', uom: 'Vial', description: '10ml clear glass vial for injectables', status: 'Active' },
  { id: '4', name: 'Sachet', code: 'SAC-FOIL', uom: 'Sachet', description: '5g foil sachet for powders', status: 'Inactive' },
];

export default function PackingTypeManagement() {
  const [data, setData] = useState<PackingType[]>(initialMockData);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  const [selectedPacking, setSelectedPacking] = useState<PackingType | null>(null);
  const [itemToDelete, setItemToDelete] = useState<PackingType | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isEditingModal, setIsEditingModal] = useState(false);

  const [newPacking, setNewPacking] = useState({
    id: '',
    code: '',
    name: '',
    uom: 'Strip',
    description: '',
    status: 'Active' as 'Active' | 'Inactive',
  });

  const columns: Column<PackingType>[] = [
    { key: 'name', label: 'Packing Name', render: (row) => <span className="font-semibold text-slate-900">{row.name}</span> },
    { key: 'code', label: 'Code' },
    { key: 'uom', label: 'Unit of Measure', render: (row) => <Badge variant="purple">{row.uom}</Badge> },
    { key: 'description', label: 'Description', render: (row) => <span className="text-slate-500">{row.description}</span> },
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
              setSelectedPacking(row);
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
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase()) || item.code.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  const handleExport = () => {
    const headers = ['Packing Name', 'Code', 'Unit of Measure', 'Description', 'Status'];
    const csvContent = [
      headers.join(','),
      ...filteredData.map(row => 
        [
          `"${row.name}"`, 
          `"${row.code}"`, 
          `"${row.uom}"`, 
          `"${row.description.replace(/"/g, '""')}"`, 
          row.status
        ].join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'packing_type_export.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openNewModal = () => {
    setIsEditingModal(false);
    setNewPacking({
      id: '',
      code: '',
      name: '',
      uom: 'Strip',
      description: '',
      status: 'Active'
    });
    setShowModal(true);
  };

  const openEditModal = () => {
    if (!selectedPacking) return;
    setIsEditingModal(true);
    setNewPacking({
      id: selectedPacking.id,
      code: selectedPacking.code,
      name: selectedPacking.name,
      uom: selectedPacking.uom,
      description: selectedPacking.description,
      status: selectedPacking.status
    });
    setShowModal(true);
  };

  const handleSavePacking = () => {
    if (!newPacking.code || !newPacking.name || !newPacking.uom || !newPacking.status) {
      alert("Please fill all mandatory fields (*).");
      return;
    }
    
    if (isEditingModal && newPacking.id) {
      const updatedRecord: PackingType = {
        id: newPacking.id,
        code: newPacking.code,
        name: newPacking.name,
        uom: newPacking.uom,
        description: newPacking.description,
        status: newPacking.status as 'Active' | 'Inactive'
      };
      
      setData(data.map(item => item.id === updatedRecord.id ? updatedRecord : item));
      if (selectedPacking && selectedPacking.id === updatedRecord.id) {
        setSelectedPacking(updatedRecord);
      }
    } else {
      const record: PackingType = {
        id: Date.now().toString(),
        code: newPacking.code,
        name: newPacking.name,
        uom: newPacking.uom,
        description: newPacking.description,
        status: newPacking.status as 'Active' | 'Inactive'
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
        title="Packing Type Management"
        subtitle="Manage product packaging materials and units of measure."
        actions={
          <>
            <ActionButton variant="secondary" icon={<Download className="w-4 h-4" />} onClick={handleExport}>
              Export
            </ActionButton>
            <ActionButton icon={<Plus className="w-4 h-4" />} onClick={openNewModal}>
              Add Packing Type
            </ActionButton>
          </>
        }
      />

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search packing or code..." />
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
            { label: 'Inactive', value: 'Inactive' },
          ]}
          placeholder="All Status"
        />
      </FilterBar>

      <TableCard>
        <DataTable
          columns={columns}
          data={filteredData}
          onRowClick={(row) => setSelectedPacking(row)}
          emptyMessage="No packing types found."
        />
      </TableCard>

      {/* Packing Details Drawer */}
      <Drawer
        open={!!selectedPacking}
        onClose={() => setSelectedPacking(null)}
        title="Packing Details"
      >
        {selectedPacking && (
          <div className="space-y-4">
            <DrawerField label="Packing Code" value={selectedPacking.code} />
            <DrawerField label="Packing Name" value={selectedPacking.name} />
            <DrawerField label="Unit of Measure" value={<Badge variant="purple">{selectedPacking.uom}</Badge>} />
            <DrawerField label="Description" value={selectedPacking.description || 'N/A'} />
            <DrawerField
              label="Status"
              value={
                <Badge variant={selectedPacking.status === 'Active' ? 'success' : 'neutral'}>
                  {selectedPacking.status}
                </Badge>
              }
            />
            
            <div className="pt-6 border-t border-slate-100 flex justify-end gap-3 mt-4">
              <ActionButton onClick={openEditModal}>Edit Packing Type</ActionButton>
              <ActionButton variant="secondary" onClick={() => setSelectedPacking(null)}>Close</ActionButton>
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
            <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Packing Type</h3>
            <p className="text-sm text-slate-500 mb-6">
              Are you sure you want to delete this packing type? This action cannot be undone.
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

      {/* Add / Edit Packing Type Modal Form */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">{isEditingModal ? 'Edit Packing Type' : 'Add Packing Type'}</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-slate-800">✕</button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {/* BASIC INFORMATION */}
              <div className="mt-2 first:mt-0">
                <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">BASIC INFORMATION</h3>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Packing Code *</label>
                <input 
                  type="text"
                  value={newPacking.code} 
                  onChange={(e) => setNewPacking({ ...newPacking, code: e.target.value })} 
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-violet-500 focus:border-violet-500" 
                  placeholder="e.g. BLS-ALU"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Packing Name *</label>
                <input 
                  type="text"
                  value={newPacking.name} 
                  onChange={(e) => setNewPacking({ ...newPacking, name: e.target.value })} 
                  className="w-full border border-slate-200 rounded-lg px-3 py-2" 
                  placeholder="e.g. Alu-Alu Blister"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Unit of Measure *</label>
                <select 
                  value={newPacking.uom} 
                  onChange={(e) => setNewPacking({ ...newPacking, uom: e.target.value })} 
                  className="w-full border border-slate-200 rounded-lg px-3 py-2"
                >
                  <option value="Strip">Strip</option>
                  <option value="Bottle">Bottle</option>
                  <option value="Vial">Vial</option>
                  <option value="Ampoule">Ampoule</option>
                  <option value="Tube">Tube</option>
                  <option value="Sachet">Sachet</option>
                  <option value="Pack">Pack</option>
                  <option value="Box">Box</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea 
                  rows={2}
                  value={newPacking.description} 
                  onChange={(e) => setNewPacking({ ...newPacking, description: e.target.value })} 
                  className="w-full border border-slate-200 rounded-lg px-3 py-2" 
                  placeholder="e.g. Double aluminum foil blister pack"
                />
              </div>

              {/* STATUS INFORMATION */}
              <div className="mt-4">
                <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">STATUS INFORMATION</h3>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Status *</label>
                <select 
                  value={newPacking.status} 
                  onChange={(e) => setNewPacking({ ...newPacking, status: e.target.value as any })} 
                  className="w-full border border-slate-200 rounded-lg px-3 py-2"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-100">
              <ActionButton variant="secondary" onClick={() => setShowModal(false)}>Cancel</ActionButton>
              <ActionButton onClick={handleSavePacking}>{isEditingModal ? 'Save Changes' : 'Save Packing Type'}</ActionButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
