import React, { useState } from 'react';
import { PageHeader, FilterBar, SearchInput, TableCard, DataTable, Badge, ActionButton, SummaryCard, Drawer, DrawerField } from './components/shared';
import { Plus, Edit2, Eye, Users, UserCheck, UserX, MapPin } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';

export default function ASMManagement() {
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    state: 'All',
    status: 'All'
  });

  const [asmData, setAsmData] = useState<any[]>([
    { 
      id: 'ASM012', name: 'Vikas Sharma', mobile: '9876543213', email: 'vikas.s@pharma.com', 
      state: 'Maharashtra', hq: 'Pune', territory: 'Pune East', 
      status: 'Active', joiningDate: '2025-04-15'
    },
    { 
      id: 'ASM015', name: 'Amit Desai', mobile: '9876543214', email: 'amit.d@pharma.com', 
      state: 'Gujarat', hq: 'Ahmedabad', territory: 'Ahmedabad Central', 
      status: 'Active', joiningDate: '2025-05-10'
    },
    { 
      id: 'ASM018', name: 'Kiran Rao', mobile: '9876543215', email: 'kiran.r@pharma.com', 
      state: 'Maharashtra', hq: 'Mumbai', territory: 'Mumbai South', 
      status: 'Inactive', joiningDate: '2025-06-01'
    },
  ]);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingAsm, setViewingAsm] = useState<any | null>(null);
  
  const [availableStates, setAvailableStates] = useState<string[]>(() => {
    const saved = localStorage.getItem('pharma_states_master');
    if (saved) return JSON.parse(saved);
    return ['Maharashtra', 'Gujarat', 'Karnataka', 'Delhi', 'Tamil Nadu'];
  });
  const [isStateDropdownOpen, setIsStateDropdownOpen] = useState(false);
  const [stateSearch, setStateSearch] = useState('');

  const [newAsm, setNewAsm] = useState({
    name: '',
    mobile: '',
    email: '',
    gender: 'Male',
    dob: '',
    state: '',
    hq: '',
    territory: '',
    password: '',
    confirmPassword: '',
    status: 'Active',
    accountStatus: 'Active',
    joiningDate: '',
    remarks: ''
  });

  const loggedInRsm = "Arun Kumar (Regional Sales Manager)"; // Mocked logged-in RSM
  const generatedEmpCode = editingId ? editingId : `ASM${String(asmData.length + 12).padStart(3, '0')}`;

  const openAddModal = () => {
    setEditingId(null);
    setNewAsm({
      name: '', mobile: '', email: '', gender: 'Male', dob: '', state: '', hq: '', territory: '', 
      password: '', confirmPassword: '', status: 'Active', accountStatus: 'Active', joiningDate: '', remarks: ''
    });
    setStateSearch('');
    setIsAddModalOpen(true);
  };

  const openEditModal = (asm: any) => {
    setEditingId(asm.id);
    setNewAsm({
      name: asm.name || '', mobile: asm.mobile || '', email: asm.email || '', gender: asm.gender || 'Male', dob: asm.dob || '',
      state: asm.state || '', hq: asm.hq || '', territory: asm.territory || '', 
      password: '', confirmPassword: '', status: asm.status || 'Active', accountStatus: asm.accountStatus || 'Active', joiningDate: asm.joiningDate || '', remarks: asm.remarks || ''
    });
    setStateSearch(asm.state || '');
    setIsAddModalOpen(true);
  };

  const openViewModal = (asm: any) => {
    setViewingAsm(asm);
    setIsViewModalOpen(true);
  };

  const handleSelectState = (stateName: string) => {
    const trimmed = stateName.trim();
    if (!trimmed) return;
    const existing = availableStates.find(s => s.toLowerCase() === trimmed.toLowerCase());
    let finalState = existing ? existing : trimmed;
    
    setNewAsm({ ...newAsm, state: finalState });
    setStateSearch(finalState);
    setIsStateDropdownOpen(false);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newAsm.password && newAsm.password !== newAsm.confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    
    const trimmedState = newAsm.state.trim();
    if (!trimmedState) {
       alert("State is required");
       return;
    }
    
    const existing = availableStates.find(s => s.toLowerCase() === trimmedState.toLowerCase());
    let finalState = trimmedState;
    if (existing) {
       finalState = existing;
    } else {
       const updated = [...availableStates, trimmedState].sort();
       setAvailableStates(updated);
       localStorage.setItem('pharma_states_master', JSON.stringify(updated));
    }
    
    const asmToSave = { ...newAsm, state: finalState };
    
    if (editingId) {
      setAsmData(asmData.map(asm => asm.id === editingId ? { ...asm, ...asmToSave, id: editingId } : asm));
    } else {
      setAsmData([...asmData, {
        ...asmToSave,
        id: generatedEmpCode
      }]);
    }

    setIsAddModalOpen(false);
  };

  const filteredData = asmData.filter(row => {
    const s = search.toLowerCase();
    const matchesSearch = search === '' || 
      row.id.toLowerCase().includes(s) ||
      row.name.toLowerCase().includes(s) ||
      row.mobile.toLowerCase().includes(s) ||
      row.email.toLowerCase().includes(s) ||
      row.hq.toLowerCase().includes(s);

    const matchesState = filters.state === 'All' || row.state === filters.state;
    const matchesStatus = filters.status === 'All' || row.status === filters.status;
    
    return matchesSearch && matchesState && matchesStatus;
  });

  const columns = [
    { key: 'id', label: 'Employee Code' },
    { key: 'name', label: 'ASM Name' },
    { key: 'state', label: 'State' },
    { key: 'hq', label: 'Headquarters' },
    {
      key: 'status',
      label: 'Status',
      render: (row: any) => <Badge variant={row.status === 'Active' ? 'success' : 'neutral'}>{row.status}</Badge>
    },
    {
      key: 'actions',
      label: 'Action',
      render: (row: any) => (
        <div className="flex gap-2">
          <button onClick={() => openViewModal(row)} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors" title="View Details">
            <Eye className="w-4 h-4" />
          </button>
          <button onClick={() => openEditModal(row)} className="p-1.5 text-slate-400 hover:text-[#163c78] hover:bg-blue-50 rounded transition-colors" title="Edit ASM">
            <Edit2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="p-6">
      <PageHeader 
        title="ASM Management" 
        subtitle="Manage Area Sales Managers and assign operational details."
        actions={
          <ActionButton icon={<Plus className="w-4 h-4" />} onClick={openAddModal}>
            Add ASM
          </ActionButton>
        }
      />

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 space-y-4">
        <div className="flex flex-wrap gap-4 items-center">
          <select 
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#163c78] bg-white flex-1 min-w-[130px]"
            value={filters.state}
            onChange={(e) => setFilters({...filters, state: e.target.value})}
          >
            <option value="All">All States</option>
            {availableStates.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select 
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#163c78] bg-white flex-1 min-w-[130px]"
            value={filters.status}
            onChange={(e) => setFilters({...filters, status: e.target.value})}
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
          <div className="flex-[3] min-w-[300px]">
            <SearchInput value={search} onChange={setSearch} placeholder="Search by Emp Code, Name, Mobile, Email, HQ..." />
          </div>
        </div>
      </div>

      <TableCard>
        <DataTable columns={columns} data={filteredData} emptyMessage="No ASMs found." />
      </TableCard>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={editingId ? "Edit Area Sales Manager" : "Add Area Sales Manager (ASM)"}
        className="max-w-4xl w-full"
      >
        <form onSubmit={handleAddSubmit} className="space-y-6 mt-2">
          {/* 1. Basic Information */}
          <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-800 mb-5 uppercase tracking-wider border-b border-slate-200 pb-2">1. Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Employee Code</label>
                <input 
                  type="text" 
                  value={generatedEmpCode}
                  disabled 
                  className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 cursor-not-allowed" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Full Name *</label>
                <input 
                  type="text"
                  required
                  value={newAsm.name}
                  onChange={e => setNewAsm({...newAsm, name: e.target.value})}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#163c78] focus:border-[#163c78]" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Mobile Number *</label>
                <input 
                  type="tel"
                  required
                  pattern="[0-9]{10}"
                  value={newAsm.mobile}
                  onChange={e => setNewAsm({...newAsm, mobile: e.target.value})}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#163c78] focus:border-[#163c78]" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email Address *</label>
                <input 
                  type="email"
                  required
                  value={newAsm.email}
                  onChange={e => setNewAsm({...newAsm, email: e.target.value})}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#163c78] focus:border-[#163c78]" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Gender *</label>
                <select 
                  required
                  value={newAsm.gender}
                  onChange={e => setNewAsm({...newAsm, gender: e.target.value})}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#163c78] focus:border-[#163c78]"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Date of Birth *</label>
                <input 
                  type="date"
                  required
                  value={newAsm.dob}
                  onChange={e => setNewAsm({...newAsm, dob: e.target.value})}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#163c78] focus:border-[#163c78]" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Designation</label>
                <input 
                  type="text" 
                  value="Area Sales Manager"
                  disabled 
                  className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-medium cursor-not-allowed" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Reporting RSM</label>
                <input 
                  type="text" 
                  value={loggedInRsm}
                  disabled 
                  className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-medium cursor-not-allowed" 
                />
              </div>
            </div>
          </div>

          {/* 2. Territory Information */}
          <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-800 mb-5 uppercase tracking-wider border-b border-slate-200 pb-2">2. Territory Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <div className="relative">
                <label className="block text-sm font-medium text-slate-700 mb-2">State *</label>
                <div className="relative">
                  <input 
                    type="text"
                    required
                    disabled={!!editingId}
                    value={isStateDropdownOpen ? stateSearch : newAsm.state}
                    onChange={(e) => {
                       setStateSearch(e.target.value);
                       setNewAsm({ ...newAsm, state: e.target.value });
                       if (!isStateDropdownOpen) setIsStateDropdownOpen(true);
                    }}
                    onFocus={() => {
                       setStateSearch(newAsm.state);
                       setIsStateDropdownOpen(true);
                    }}
                    onBlur={() => {
                       setTimeout(() => {
                         setIsStateDropdownOpen(false);
                       }, 200);
                    }}
                    placeholder="Search or create new state..."
                    className={`w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#163c78] focus:border-[#163c78] ${editingId ? 'bg-slate-100 cursor-not-allowed' : ''}`}
                  />
                  {isStateDropdownOpen && !editingId && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {availableStates.filter(s => s.toLowerCase().includes(stateSearch.toLowerCase())).length > 0 ? (
                        availableStates.filter(s => s.toLowerCase().includes(stateSearch.toLowerCase())).map(s => (
                          <div 
                            key={s}
                            className="px-4 py-2.5 hover:bg-slate-50 cursor-pointer text-sm text-slate-700 transition-colors"
                            onMouseDown={() => handleSelectState(s)}
                          >
                            {s}
                          </div>
                        ))
                      ) : (
                         stateSearch.trim() ? (
                           <div 
                             className="px-4 py-2.5 hover:bg-blue-50 cursor-pointer text-sm text-[#163c78] font-medium flex items-center gap-2 transition-colors"
                             onMouseDown={() => handleSelectState(stateSearch)}
                           >
                             <Plus className="w-4 h-4" /> Create "{stateSearch.trim()}"
                           </div>
                         ) : (
                           <div className="px-4 py-2.5 text-sm text-slate-500 italic">Type to search or create...</div>
                         )
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Headquarters (HQ) *</label>
                <input 
                  type="text"
                  required
                  value={newAsm.hq}
                  onChange={e => setNewAsm({...newAsm, hq: e.target.value})}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#163c78] focus:border-[#163c78]" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Territory / Area (Optional)</label>
                <input 
                  type="text"
                  value={newAsm.territory}
                  onChange={e => setNewAsm({...newAsm, territory: e.target.value})}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#163c78] focus:border-[#163c78]" 
                />
              </div>
              <div className="hidden md:block"></div>
            </div>
          </div>

          {/* 3. Login Credentials */}
          <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-800 mb-5 uppercase tracking-wider border-b border-slate-200 pb-2">3. Login Credentials</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email Address (Login ID) *</label>
                <input 
                  type="email"
                  disabled 
                  value={newAsm.email}
                  className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 cursor-not-allowed" 
                  placeholder="Auto-populated from email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Account Status</label>
                <select 
                  value={newAsm.accountStatus}
                  onChange={e => setNewAsm({...newAsm, accountStatus: e.target.value})}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#163c78] focus:border-[#163c78]"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Password {editingId ? '(Leave blank to keep unchanged)' : '*'}</label>
                <input 
                  type="password"
                  required={!editingId}
                  minLength={8}
                  value={newAsm.password}
                  onChange={e => setNewAsm({...newAsm, password: e.target.value})}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#163c78] focus:border-[#163c78]" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Confirm Password {editingId ? '' : '*'}</label>
                <input 
                  type="password"
                  required={!editingId && !!newAsm.password}
                  minLength={8}
                  value={newAsm.confirmPassword}
                  onChange={e => setNewAsm({...newAsm, confirmPassword: e.target.value})}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#163c78] focus:border-[#163c78]" 
                />
              </div>
            </div>
          </div>

          {/* 4. Employment Information */}
          <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-800 mb-5 uppercase tracking-wider border-b border-slate-200 pb-2">4. Employment Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Joining Date *</label>
                <input 
                  type="date"
                  required
                  disabled={!!editingId}
                  value={newAsm.joiningDate}
                  onChange={e => setNewAsm({...newAsm, joiningDate: e.target.value})}
                  className={`w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#163c78] focus:border-[#163c78] ${editingId ? 'bg-slate-100 cursor-not-allowed' : ''}`} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Employment Status</label>
                <select 
                  value={newAsm.status}
                  onChange={e => setNewAsm({...newAsm, status: e.target.value})}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#163c78] focus:border-[#163c78]"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          {/* 5. Optional Information */}
          <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-800 mb-5 uppercase tracking-wider border-b border-slate-200 pb-2">5. Optional Information</h3>
            <div className="grid grid-cols-1 gap-x-8 gap-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Remarks</label>
                <textarea 
                  value={newAsm.remarks}
                  onChange={e => setNewAsm({...newAsm, remarks: e.target.value})}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#163c78] focus:border-[#163c78]" 
                ></textarea>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-6 border-t border-slate-200">
            <button 
              type="button" 
              className="px-6 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              onClick={() => setIsAddModalOpen(false)}
            >
               Cancel
            </button>
            <button 
              type="submit"
              className="px-6 py-2.5 text-sm font-medium text-white bg-[#163c78] rounded-lg hover:bg-[#122e5c] transition-colors"
            >
              {editingId ? "Update ASM" : "Create ASM"}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Drawer */}
      <Drawer
        open={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Area Sales Manager Details"
      >
        {viewingAsm && (
          <div className="flex flex-col h-full">
            <div className="space-y-1">
              <DrawerField label="Employee Code" value={viewingAsm.id} />
              <DrawerField label="Employee Name" value={viewingAsm.name} />
              <DrawerField label="Mobile Number" value={viewingAsm.mobile} />
              <DrawerField label="Email Address" value={viewingAsm.email} />
              <DrawerField label="Gender" value={viewingAsm.gender || '-'} />
              <DrawerField label="Date of Birth" value={viewingAsm.dob || '-'} />

              <div className="py-3 mt-2 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">Employment Information</p>
                <div className="space-y-1">
                  <DrawerField label="Joining Date" value={viewingAsm.joiningDate} />
                  <DrawerField label="State" value={viewingAsm.state} />
                  <DrawerField label="Headquarters" value={viewingAsm.hq} />
                  <DrawerField label="Territory" value={viewingAsm.territory || '-'} />
                  <DrawerField label="Reporting RSM" value={loggedInRsm} />
                  <DrawerField label="Employment Status" value={
                    <Badge variant={viewingAsm.status === 'Active' ? 'success' : 'neutral'}>{viewingAsm.status}</Badge>
                  } />
                </div>
              </div>

              <div className="py-3 mt-2 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">Audit Information</p>
                <div className="space-y-1">
                  <DrawerField label="Created Date" value={viewingAsm.joiningDate || 'N/A'} />
                  <DrawerField label="Remarks" value={viewingAsm.remarks || '-'} />
                </div>
              </div>
            </div>
            
            <div className="mt-auto pt-6 border-t border-slate-100">
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
