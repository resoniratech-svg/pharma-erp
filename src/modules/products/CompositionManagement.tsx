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

interface Composition {
  id: string;
  genericName: string;
  strength: string;
  dosageForm: string;
  therapeuticClass: string;
  schedule: string;
  description: string;
  associatedProducts: number;
  status: 'Active' | 'Inactive';
  createdBy: string;
  createdDate: string;
}

const initialMockData: Composition[] = [
  { id: '1', genericName: 'Amoxicillin Trihydrate', strength: '500mg', dosageForm: 'Capsule', therapeuticClass: 'Antibiotic', schedule: 'Schedule H', description: 'Broad-spectrum antibiotic used to treat bacterial infections.', associatedProducts: 12, status: 'Active', createdBy: 'Admin User', createdDate: '2026-06-01' },
  { id: '2', genericName: 'Paracetamol', strength: '650mg', dosageForm: 'Tablet', therapeuticClass: 'Analgesic', schedule: 'OTC', description: 'Used for fever reduction and pain relief.', associatedProducts: 45, status: 'Active', createdBy: 'System', createdDate: '2026-05-15' },
  { id: '3', genericName: 'Ibuprofen', strength: '400mg', dosageForm: 'Tablet', therapeuticClass: 'NSAID', schedule: 'OTC', description: 'Nonsteroidal anti-inflammatory drug used for reducing fever and treating pain.', associatedProducts: 28, status: 'Active', createdBy: 'Admin User', createdDate: '2026-04-20' },
  { id: '4', genericName: 'Cetirizine Hydrochloride', strength: '10mg', dosageForm: 'Tablet', therapeuticClass: 'Antihistamine', schedule: 'Schedule H', description: 'Used to relieve allergy symptoms such as watery eyes, runny nose, itching eyes/nose, and sneezing.', associatedProducts: 8, status: 'Inactive', createdBy: 'Admin User', createdDate: '2025-12-05' },
  { id: '5', genericName: 'Vitamin C (Ascorbic Acid)', strength: '1000mg', dosageForm: 'Tablet', therapeuticClass: 'Vitamin Supplement', schedule: 'OTC', description: 'Vitamin supplement for immune system support.', associatedProducts: 15, status: 'Active', createdBy: 'System', createdDate: '2026-06-10' },
];

export default function CompositionManagement() {
  const [data, setData] = useState<Composition[]>(initialMockData);
  const [search, setSearch] = useState('');
  const [scheduleFilter, setScheduleFilter] = useState('');
  
  const [selectedComp, setSelectedComp] = useState<Composition | null>(null);
  const [itemToDelete, setItemToDelete] = useState<Composition | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isEditingModal, setIsEditingModal] = useState(false);

  const [newComp, setNewComp] = useState({
    id: '',
    genericName: '',
    strength: '',
    dosageForm: 'Tablet',
    therapeuticClass: '',
    schedule: 'OTC',
    description: '',
    status: 'Active' as 'Active' | 'Inactive',
  });

  const columns: Column<Composition>[] = [
    { key: 'genericName', label: 'Generic Name', render: (row) => <span className="font-semibold text-slate-900">{row.genericName}</span> },
    { key: 'strength', label: 'Strength' },
    { key: 'dosageForm', label: 'Dosage Form' },
    { key: 'therapeuticClass', label: 'Therapeutic Class' },
    {
      key: 'schedule',
      label: 'Schedule',
      render: (row) => {
        const variant = row.schedule === 'OTC' ? 'success' : row.schedule === 'Schedule H' || row.schedule === 'Schedule H1' ? 'warning' : 'danger';
        return <Badge variant={variant}>{row.schedule}</Badge>;
      },
    },
    { key: 'associatedProducts', label: 'Linked Products', render: (row) => <span className="text-violet-600 font-medium">{row.associatedProducts} Products</span> },
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
              setSelectedComp(row);
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
    const matchSearch = item.genericName.toLowerCase().includes(search.toLowerCase()) || item.therapeuticClass.toLowerCase().includes(search.toLowerCase());
    const matchSchedule = scheduleFilter ? item.schedule === scheduleFilter : true;
    return matchSearch && matchSchedule;
  });

  const handleExport = () => {
    const headers = ['Generic Name', 'Strength', 'Dosage Form', 'Therapeutic Class', 'Schedule', 'Linked Products', 'Status'];
    const csvContent = [
      headers.join(','),
      ...filteredData.map(row => 
        [
          `"${row.genericName}"`, 
          `"${row.strength}"`, 
          `"${row.dosageForm}"`, 
          `"${row.therapeuticClass}"`, 
          `"${row.schedule}"`, 
          row.associatedProducts, 
          row.status
        ].join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'composition_management_export.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openNewModal = () => {
    setIsEditingModal(false);
    setNewComp({
      id: '',
      genericName: '',
      strength: '',
      dosageForm: 'Tablet',
      therapeuticClass: '',
      schedule: 'OTC',
      description: '',
      status: 'Active'
    });
    setShowModal(true);
  };

  const openEditModal = () => {
    if (!selectedComp) return;
    setIsEditingModal(true);
    setNewComp({
      id: selectedComp.id,
      genericName: selectedComp.genericName,
      strength: selectedComp.strength,
      dosageForm: selectedComp.dosageForm,
      therapeuticClass: selectedComp.therapeuticClass,
      schedule: selectedComp.schedule,
      description: selectedComp.description,
      status: selectedComp.status
    });
    setShowModal(true);
  };

  const handleSaveComposition = () => {
    if (!newComp.genericName || !newComp.strength || !newComp.dosageForm || !newComp.therapeuticClass || !newComp.schedule || !newComp.status) {
      alert("Please fill all mandatory fields (*).");
      return;
    }
    
    if (isEditingModal && newComp.id) {
      const updatedRecord: Composition = {
        id: newComp.id,
        genericName: newComp.genericName,
        strength: newComp.strength,
        dosageForm: newComp.dosageForm,
        therapeuticClass: newComp.therapeuticClass,
        schedule: newComp.schedule,
        description: newComp.description,
        associatedProducts: selectedComp?.associatedProducts || 0,
        status: newComp.status as 'Active' | 'Inactive',
        createdBy: selectedComp?.createdBy || 'Admin User',
        createdDate: selectedComp?.createdDate || new Date().toISOString().split('T')[0]
      };
      
      setData(data.map(item => item.id === updatedRecord.id ? updatedRecord : item));
      if (selectedComp && selectedComp.id === updatedRecord.id) {
        setSelectedComp(updatedRecord);
      }
    } else {
      const record: Composition = {
        id: Date.now().toString(),
        genericName: newComp.genericName,
        strength: newComp.strength,
        dosageForm: newComp.dosageForm,
        therapeuticClass: newComp.therapeuticClass,
        schedule: newComp.schedule,
        description: newComp.description,
        associatedProducts: 0,
        status: newComp.status as 'Active' | 'Inactive',
        createdBy: 'Admin User',
        createdDate: new Date().toISOString().split('T')[0]
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
        title="Composition Management"
        subtitle="Manage generic formulas, strengths, and drug schedules."
        actions={
          <>
            <ActionButton variant="secondary" icon={<Download className="w-4 h-4" />} onClick={handleExport}>
              Export
            </ActionButton>
            <ActionButton icon={<Plus className="w-4 h-4" />} onClick={openNewModal}>
              Add Composition
            </ActionButton>
          </>
        }
      />

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search formula or class..." />
        <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-600">Filters:</span>
        </div>
        <SelectFilter
          value={scheduleFilter}
          onChange={setScheduleFilter}
          options={[
            { label: 'OTC', value: 'OTC' },
            { label: 'Schedule H', value: 'Schedule H' },
            { label: 'Schedule H1', value: 'Schedule H1' },
            { label: 'Schedule X', value: 'Schedule X' },
          ]}
          placeholder="All Schedules"
        />
      </FilterBar>

      <TableCard>
        <DataTable
          columns={columns}
          data={filteredData}
          onRowClick={(row) => setSelectedComp(row)}
          emptyMessage="No compositions found."
        />
      </TableCard>

      {/* Composition Details Drawer */}
      <Drawer
        open={!!selectedComp}
        onClose={() => setSelectedComp(null)}
        title="Composition Details"
      >
        {selectedComp && (
          <div className="space-y-4">
            <DrawerField label="Generic Name" value={selectedComp.genericName} />
            <DrawerField label="Strength" value={selectedComp.strength} />
            <DrawerField label="Dosage Form" value={selectedComp.dosageForm} />
            <DrawerField label="Therapeutic Class" value={selectedComp.therapeuticClass} />
            <DrawerField label="Drug Schedule" value={
              <Badge variant={selectedComp.schedule === 'OTC' ? 'success' : selectedComp.schedule === 'Schedule H' || selectedComp.schedule === 'Schedule H1' ? 'warning' : 'danger'}>
                {selectedComp.schedule}
              </Badge>
            } />
            <DrawerField label="Description" value={selectedComp.description || 'N/A'} />
            <DrawerField label="Linked Products" value={`${selectedComp.associatedProducts} Active Products`} />
            <DrawerField label="Status" value={
              <Badge variant={selectedComp.status === 'Active' ? 'success' : 'neutral'}>
                {selectedComp.status}
              </Badge>
            } />
            <DrawerField label="Created By" value={selectedComp.createdBy} />
            <DrawerField label="Created Date" value={selectedComp.createdDate} />
            
            <div className="pt-6 border-t border-slate-100 flex justify-end gap-3 mt-4">
              <ActionButton onClick={openEditModal}>Edit Composition</ActionButton>
              <ActionButton variant="secondary" onClick={() => setSelectedComp(null)}>Close</ActionButton>
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
            <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Composition</h3>
            <p className="text-sm text-slate-500 mb-6">
              Are you sure you want to delete this composition? This action cannot be undone.
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

      {/* Add / Edit Composition Modal Form */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">{isEditingModal ? 'Edit Composition' : 'Add Composition'}</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-slate-800">✕</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* BASIC INFORMATION */}
              <div className="md:col-span-2 mt-2 first:mt-0">
                <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">BASIC INFORMATION</h3>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Generic Name *</label>
                <input 
                  type="text"
                  value={newComp.genericName} 
                  onChange={(e) => setNewComp({ ...newComp, genericName: e.target.value })} 
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-violet-500 focus:border-violet-500" 
                  placeholder="e.g. Paracetamol"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Strength *</label>
                <input 
                  type="text"
                  value={newComp.strength} 
                  onChange={(e) => setNewComp({ ...newComp, strength: e.target.value })} 
                  className="w-full border border-slate-200 rounded-lg px-3 py-2" 
                  placeholder="e.g. 500mg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Dosage Form *</label>
                <select 
                  value={newComp.dosageForm} 
                  onChange={(e) => setNewComp({ ...newComp, dosageForm: e.target.value })} 
                  className="w-full border border-slate-200 rounded-lg px-3 py-2"
                >
                  <option value="Tablet">Tablet</option>
                  <option value="Capsule">Capsule</option>
                  <option value="Syrup">Syrup</option>
                  <option value="Injection">Injection</option>
                  <option value="Cream">Cream</option>
                  <option value="Ointment">Ointment</option>
                  <option value="Drops">Drops</option>
                  <option value="Powder">Powder</option>
                </select>
              </div>

              {/* CLASSIFICATION INFORMATION */}
              <div className="md:col-span-2 mt-4">
                <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">CLASSIFICATION INFORMATION</h3>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Therapeutic Class *</label>
                <input 
                  type="text"
                  value={newComp.therapeuticClass} 
                  onChange={(e) => setNewComp({ ...newComp, therapeuticClass: e.target.value })} 
                  className="w-full border border-slate-200 rounded-lg px-3 py-2" 
                  placeholder="e.g. Analgesic"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Drug Schedule *</label>
                <select 
                  value={newComp.schedule} 
                  onChange={(e) => setNewComp({ ...newComp, schedule: e.target.value })} 
                  className="w-full border border-slate-200 rounded-lg px-3 py-2"
                >
                  <option value="OTC">OTC</option>
                  <option value="Schedule H">Schedule H</option>
                  <option value="Schedule H1">Schedule H1</option>
                  <option value="Schedule X">Schedule X</option>
                </select>
              </div>

              {/* ADDITIONAL INFORMATION */}
              <div className="md:col-span-2 mt-4">
                <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">ADDITIONAL INFORMATION</h3>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea 
                  rows={2}
                  value={newComp.description} 
                  onChange={(e) => setNewComp({ ...newComp, description: e.target.value })} 
                  className="w-full border border-slate-200 rounded-lg px-3 py-2" 
                  placeholder="e.g. Used for fever reduction and pain relief."
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Status *</label>
                <select 
                  value={newComp.status} 
                  onChange={(e) => setNewComp({ ...newComp, status: e.target.value as any })} 
                  className="w-full border border-slate-200 rounded-lg px-3 py-2"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              {/* AUDIT INFORMATION */}
              <div className="md:col-span-2 mt-4">
                <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">AUDIT INFORMATION</h3>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Created By</label>
                <input 
                  value={isEditingModal ? (selectedComp?.createdBy || 'System') : 'Admin User'} 
                  readOnly 
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 text-slate-500 cursor-not-allowed" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Created Date</label>
                <input 
                  value={isEditingModal ? (selectedComp?.createdDate || 'N/A') : new Date().toISOString().split('T')[0]} 
                  readOnly 
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 text-slate-500 cursor-not-allowed" 
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-100">
              <ActionButton variant="secondary" onClick={() => setShowModal(false)}>Cancel</ActionButton>
              <ActionButton onClick={handleSaveComposition}>{isEditingModal ? 'Save Changes' : 'Save Composition'}</ActionButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
