import React, { useState, useEffect } from 'react';
import { PageHeader, FilterBar, SearchInput, TableCard, DataTable, Badge, ActionButton } from './components/shared';
import { Plus, Edit2, Eye, X, Loader2 } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { employeeService } from '../../services/employeeService';
import { authService } from '../../services/authService';
import { StateSelector } from '../super-admin/components/StateSelector';

export default function RSMManagement() {
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stateFilter, setStateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [stateSearch, setStateSearch] = useState('');
  
  // Master list of available states that can be expanded dynamically
  const [availableStates, setAvailableStates] = useState<string[]>([
    'Maharashtra', 'Gujarat', 'Karnataka', 'Delhi', 'Tamil Nadu', 'Telangana', 'Uttar Pradesh', 'West Bengal', 'Rajasthan', 'Kerala'
  ]);

  const [rsmData, setRsmData] = useState<any[]>([]);


  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingRsm, setViewingRsm] = useState<any | null>(null);

  const [newRsm, setNewRsm] = useState({
    name: '',
    mobile: '',
    email: '',
    state: '',
    states: [] as string[],
    territory: '',
    hq: '',
    area: '',
    password: '',
    confirmPassword: '',
    status: 'Active' as 'Active' | 'Inactive',
    joiningDate: ''
  });

  const currentUser = authService.getCurrentUser();
  const { currentName, currentEmpId, isSuperAdmin } = employeeService.getLoggedInEmployee();
  const loggedInNsm = currentName !== 'Super Admin' ? currentName : (currentUser ? `${currentUser.fullName || 'NSM'} (National Sales Head)` : "National Sales Head");
  
  const inheritedTerritoryObj = employeeService.getInheritedTerritory(currentEmpId);
  const inheritedZone = inheritedTerritoryObj.zone;
  const inheritedRegion = inheritedTerritoryObj.region;

  const generatedEmpCode = editingId 
    ? (rsmData.find(r => r.id === editingId)?.employeeCode || '') 
    : employeeService.generateNextEmployeeCode('Regional Sales Manager');

  useEffect(() => {
    loadRSMs();
  }, []);

  const loadRSMs = async () => {
    try {
      setLoading(true);
      setError(null);
      const employees = await employeeService.getEmployees({
        designation: 'Regional Sales Manager',
        ...(isSuperAdmin ? {} : { reportsToId: currentEmpId })
      });
      
      const mapped = employees.map(emp => ({
        id: emp.id,
        employeeCode: emp.employeeCode,
        name: emp.employeeName,
        mobile: (emp as any).mobile || '',
        email: (emp as any).email || '',
        state: (emp as any).state || '',
        states: (emp as any).states && (emp as any).states.length > 0 ? (emp as any).states : (emp.area ? [emp.area] : []),
        hq: emp.headquarters || '',
        area: emp.area || '',
        territory: (emp as any).territory || '',
        status: emp.status || 'Active',
        joiningDate: emp.joiningDate || '',
      })).reverse();

      setRsmData(mapped);

      const existingStates = new Set(availableStates);
      mapped.forEach(r => {
        if (r.states && Array.isArray(r.states)) {
          r.states.forEach((s: string) => { if (s) existingStates.add(s); });
        }
      });
      setAvailableStates(Array.from(existingStates));
    } catch (err: any) {
      console.error("Failed to load RSMs:", err);
      setError(err.message || "Failed to load Regional Sales Managers.");
    } finally {
      setLoading(false);
    }
  };

  const loadData = () => loadRSMs(); // Keep backward compatibility just in case

  const openAddModal = () => {
    setEditingId(null);
    setNewRsm({
      name: '', mobile: '', email: '', states: [], state: inheritedTerritoryObj.state || '', territory: '', hq: '', area: '', 
      password: '', confirmPassword: '', status: 'Active', 
      joiningDate: new Date().toISOString().split('T')[0]
    });
    setIsAddModalOpen(true);
  };

  const openEditModal = (rsm: any) => {
    setEditingId(rsm.id);
    let rsmStates = rsm.states || [];
    if (rsm.state && rsmStates.length === 0) rsmStates = [rsm.state];
    
    setNewRsm({
      name: rsm.name || '', mobile: rsm.mobile || '', email: rsm.email || '', 
      state: rsm.state || '', states: rsmStates, territory: rsm.territory || '', hq: rsm.hq || '', area: rsm.area || '', 
      password: '', confirmPassword: '', status: (rsm.status || 'Active') as 'Active' | 'Inactive', joiningDate: rsm.joiningDate || ''
    });
    setIsAddModalOpen(true);
  };

  const openViewModal = (rsm: any) => {
    setViewingRsm(rsm);
    setIsViewModalOpen(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRsm.state.trim()) {
      alert("Please select at least one State.");
      return;
    }
    if (!newRsm.territory?.trim() && (!newRsm.states || newRsm.states.length === 0) && !newRsm.state?.trim()) {
      alert("Territory or States are required.");
      return;
    }
    if (!editingId && (!newRsm.password || newRsm.password !== newRsm.confirmPassword)) {
      alert("Passwords do not match or is empty");
      return;
    }
    if (editingId && newRsm.password && newRsm.password !== newRsm.confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    
    try {
      setSubmitting(true);
      if (editingId) {
        await employeeService.updateEmployee(editingId, {
          employeeName: newRsm.name,
          mobile: newRsm.mobile,
          email: newRsm.email,
          states: newRsm.states,
          state: newRsm.state,
          territory: newRsm.territory,
          headquarters: newRsm.hq,
          area: newRsm.area,
          status: newRsm.status as any,
          joiningDate: newRsm.joiningDate,
          ...(newRsm.password ? { password: newRsm.password } : {}),
        });
      } else {
        await employeeService.addEmployee({
          employeeCode: generatedEmpCode,
          employeeName: newRsm.name,
          designation: 'Regional Sales Manager',
          reportsTo: currentName !== 'Super Admin' ? currentName : 'Owner / Super Admin',
          reportsToId: currentEmpId || undefined,
          zone: inheritedZone,
          region: inheritedRegion,
          mobile: newRsm.mobile,
          email: newRsm.email,
          password: newRsm.password,
          states: newRsm.states,
          state: newRsm.state,
          territory: newRsm.territory,
          headquarters: newRsm.hq,
          area: newRsm.area,
          status: newRsm.status as any,
          joiningDate: newRsm.joiningDate || new Date().toISOString().split('T')[0],
        });
      }

      await loadRSMs();
      setIsAddModalOpen(false);
    } catch (err: any) {
      alert(err.message || "Failed to save RSM");
    } finally {
      setSubmitting(false);
    }
  };

  // State Multiselect Logic
  const filteredStates = availableStates.filter(s => s.toLowerCase().includes((typeof stateSearch !== 'undefined' ? stateSearch : '').toLowerCase()));
  const isSearchStateNew = typeof stateSearch !== 'undefined' && stateSearch.trim() !== '' && !availableStates.some(s => s.toLowerCase() === stateSearch.trim().toLowerCase());

  const handleStateSelect = (stateName: string) => {
    if (newRsm.states.includes(stateName)) {
      setNewRsm({ ...newRsm, states: newRsm.states.filter(s => s !== stateName) });
    } else {
      setNewRsm({ ...newRsm, states: [...newRsm.states, stateName] });
    }
  };

  const handleCreateState = () => {
    if (typeof stateSearch === 'undefined') return;
    const newState = stateSearch.trim();
    if (!newState) return;
    
    const existingIndex = availableStates.findIndex(s => s.toLowerCase() === newState.toLowerCase());
    if (existingIndex === -1) {
      setAvailableStates([...availableStates, newState]);
      setNewRsm({ ...newRsm, states: [...newRsm.states, newState] });
    } else {
      const actualState = availableStates[existingIndex];
      if (!newRsm.states.includes(actualState)) {
        setNewRsm({ ...newRsm, states: [...newRsm.states, actualState] });
      }
    }
  };

  const filteredData = rsmData.filter(row => {
    const rowStates = row.states || (row.state ? [row.state] : []);
    const statesMatch = rowStates.some((s: string) => s.toLowerCase().includes(search.toLowerCase()));
    
    const hqMatch = (row.hq || '').toLowerCase().includes(search.toLowerCase());
    const nameMatch = (row.name || '').toLowerCase().includes(search.toLowerCase());
    const codeMatch = (row.employeeCode || '').toLowerCase().includes(search.toLowerCase());
    
    const matchesSearch = statesMatch || hqMatch || nameMatch || codeMatch;
    
    const matchesState = stateFilter ? rowStates.includes(stateFilter) : true;
    const matchesStatus = statusFilter ? row.status === statusFilter : true;
    
    return matchesSearch && matchesState && matchesStatus;
  });

  const columns = [
    { key: 'employeeCode', label: 'Employee Code', render: (row: any) => row.employeeCode || `EMP-${row.id}` },
    { key: 'name', label: 'RSM Name' },
    { 
      key: 'states', 
      label: 'State(s)',
      render: (row: any) => {
        const states = row.states || (row.state ? [row.state] : []);
        return states.length > 0 ? states.join(', ') : (row.area || '-');
      }
    },
    { key: 'territory', label: 'Territory', render: (row: any) => row.territory || '-' },
    { key: 'hq', label: 'Headquarters', render: (row: any) => row.hq || '-' },
    {
      key: 'status',
      label: 'Status',
      render: (row: any) => <Badge variant={row.status === 'Active' ? 'success' : 'neutral'}>{row.status}</Badge>
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row: any) => (
        <div className="flex gap-2">
          <button onClick={() => openViewModal(row)} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors" title="View Details">
            <Eye className="w-4 h-4" />
          </button>
          <button onClick={() => openEditModal(row)} className="p-1.5 text-slate-400 hover:text-[#163c78] hover:bg-blue-50 rounded transition-colors" title="Edit RSM">
            <Edit2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="p-6">
      <PageHeader 
        title="RSM Management" 
        subtitle="Manage Regional Sales Managers and assign State Territories (Database Integrated)."
        actions={
          <ActionButton icon={<Plus className="w-4 h-4" />} onClick={openAddModal}>
            Add RSM
          </ActionButton>
        }
      />

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search by name, code, state or HQ..." />
      </FilterBar>

      {error && (
        <div className="mb-4 p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg">
          {error}
        </div>
      )}

      <TableCard>
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-[#163c78] mb-2" />
            <p className="text-sm">Loading Regional Sales Managers from database...</p>
          </div>
        ) : (
          <DataTable columns={columns} data={filteredData} emptyMessage="No RSMs found in the database." />
        )}
      </TableCard>

      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={editingId ? "Edit Regional Sales Manager" : "Add Regional Sales Manager (RSM)"}
        className="max-w-4xl w-full"
      >
        <form onSubmit={handleAddSubmit} className="space-y-6 mt-2">
          <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-800 mb-5 uppercase tracking-wider border-b border-slate-200 pb-2">1. Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Employee Code</label>
                <input 
                  type="text" 
                  value={generatedEmpCode}
                  disabled 
                  className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 cursor-not-allowed text-sm" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Employee Name *</label>
                <input 
                  type="text" 
                  required
                  value={newRsm.name}
                  onChange={e => setNewRsm({...newRsm, name: e.target.value})}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#163c78] focus:border-[#163c78] text-sm" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Mobile Number *</label>
                <input 
                  type="tel"
                  required
                  pattern="[0-9]{10}"
                  maxLength={10}
                  value={newRsm.mobile}
                  onChange={e => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    setNewRsm({...newRsm, mobile: val});
                  }}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#163c78] focus:border-[#163c78] text-sm" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Designation</label>
                <input 
                  type="text" 
                  value="Regional Sales Manager"
                  disabled 
                  className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-medium cursor-not-allowed text-sm" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Reports To</label>
                <input 
                  type="text" 
                  value={loggedInNsm}
                  disabled 
                  className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-medium cursor-not-allowed text-sm" 
                />
              </div>
              <div className="hidden md:block"></div>
            </div>
          </div>

          <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-800 mb-5 uppercase tracking-wider border-b border-slate-200 pb-2">2. Territory Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Zone</label>
                <input 
                  type="text" 
                  value={inheritedZone}
                  disabled 
                  className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-medium cursor-not-allowed" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Region</label>
                <input 
                  type="text" 
                  value={inheritedRegion}
                  disabled 
                  className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-medium cursor-not-allowed" 
                />
              </div>
                
              <div className="relative">
                <label className="block text-sm font-medium text-slate-700 mb-2">State *</label>
                <StateSelector 
                  value={newRsm.state} 
                  onChange={(val) => setNewRsm({ ...newRsm, state: val })} 
                />
              </div>
                
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Territory *</label>
                <input 
                  type="text"
                  required
                  value={newRsm.territory}
                  onChange={e => setNewRsm({...newRsm, territory: e.target.value})}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#163c78] focus:border-[#163c78]" 
                  placeholder="Enter territory name"
                />
              </div>
                
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Headquarters *</label>
                <input 
                  type="text" 
                  required
                  value={newRsm.hq}
                  onChange={e => setNewRsm({...newRsm, hq: e.target.value})}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#163c78] focus:border-[#163c78] text-sm" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Area (Optional)</label>
                <input 
                  type="text" 
                  value={newRsm.area}
                  onChange={e => setNewRsm({...newRsm, area: e.target.value})}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#163c78] focus:border-[#163c78] text-sm" 
                  placeholder="Additional area details"
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
                  required
                  value={newRsm.email}
                  onChange={e => setNewRsm({...newRsm, email: e.target.value})}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#163c78] focus:border-[#163c78] text-sm" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Account Status</label>
                <select 
                  value={newRsm.status}
                  onChange={e => setNewRsm({...newRsm, status: e.target.value as 'Active' | 'Inactive'})}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#163c78] focus:border-[#163c78] text-sm"
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
                  minLength={6}
                  value={newRsm.password}
                  onChange={e => setNewRsm({...newRsm, password: e.target.value})}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#163c78] focus:border-[#163c78] text-sm" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Confirm Password {editingId ? '' : '*'}</label>
                <input 
                  type="password" 
                  required={!editingId && !!newRsm.password}
                  minLength={6}
                  value={newRsm.confirmPassword}
                  onChange={e => setNewRsm({...newRsm, confirmPassword: e.target.value})}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#163c78] focus:border-[#163c78] text-sm" 
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
                  value={newRsm.joiningDate}
                  onChange={e => setNewRsm({...newRsm, joiningDate: e.target.value})}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#163c78] focus:border-[#163c78] text-sm" 
                />
              </div>
              <div className="hidden md:block"></div>
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
              disabled={submitting}
              className="px-6 py-2.5 text-sm font-medium text-white bg-[#163c78] rounded-lg hover:bg-[#122e5c] transition-colors flex items-center gap-2"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {editingId ? "Update RSM" : "Create RSM"}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Modal */}
      {viewingRsm && (
        <Modal
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          title="Regional Sales Manager Details"
        >
          <div className="space-y-6">
            {/* 1. Basic Information */}
            <div>
              <h3 className="text-sm font-bold text-slate-800 mb-4 border-b pb-2">Basic Information</h3>
              <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                <div><span className="block text-xs text-slate-500 font-semibold mb-1">Employee Code</span><span className="text-sm font-medium">{viewingRsm.employeeCode || viewingRsm.id}</span></div>
                <div><span className="block text-xs text-slate-500 font-semibold mb-1">Employee Name</span><span className="text-sm font-medium">{viewingRsm.name}</span></div>
                <div><span className="block text-xs text-slate-500 font-semibold mb-1">Mobile Number</span><span className="text-sm font-medium">{viewingRsm.mobile || '-'}</span></div>
                <div><span className="block text-xs text-slate-500 font-semibold mb-1">Email Address</span><span className="text-sm font-medium">{viewingRsm.email || '-'}</span></div>
                <div><span className="block text-xs text-slate-500 font-semibold mb-1">Designation</span><span className="text-sm font-medium">Regional Sales Manager</span></div>
                <div><span className="block text-xs text-slate-500 font-semibold mb-1">Reports To</span><span className="text-sm font-medium">{loggedInNsm}</span></div>
                <div><span className="block text-xs text-slate-500 font-semibold mb-1">Joining Date</span><span className="text-sm font-medium">{viewingRsm.joiningDate || '-'}</span></div>
                <div><span className="block text-xs text-slate-500 font-semibold mb-1">Status</span><Badge variant={viewingRsm.status === 'Active' ? 'success' : 'neutral'}>{viewingRsm.status}</Badge></div>
              </div>
            </div>

            {/* 2. Territory Information */}
            <div>
              <h3 className="text-sm font-bold text-slate-800 mb-4 border-b pb-2">Territory Information</h3>
              <div className="grid grid-cols-3 gap-y-4 gap-x-8">
                <div>
                  <span className="block text-xs text-slate-500 font-semibold mb-1">State(s)</span>
                  <span className="text-sm font-medium">
                    {(viewingRsm.states && viewingRsm.states.length > 0) ? viewingRsm.states.join(', ') : (viewingRsm.state || '-')}
                  </span>
                </div>
                <div><span className="block text-xs text-slate-500 font-semibold mb-1">Headquarters</span><span className="text-sm font-medium">{viewingRsm.hq || '-'}</span></div>
                <div><span className="block text-xs text-slate-500 font-semibold mb-1">Area</span><span className="text-sm font-medium">{viewingRsm.area || '-'}</span></div>
              </div>
            </div>

            {/* 3. Performance Summary */}
            <div>
              <h3 className="text-sm font-bold text-slate-800 mb-4 border-b pb-2">Performance Summary</h3>
              <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                <div><span className="block text-xs text-slate-500 font-semibold mb-1">Current Target</span><span className="text-sm font-medium">₹0.00 L</span></div>
                <div><span className="block text-xs text-slate-500 font-semibold mb-1">Target Achievement</span><span className="text-sm font-medium text-emerald-600">0%</span></div>
                <div><span className="block text-xs text-slate-500 font-semibold mb-1">Attendance Percentage</span><span className="text-sm font-medium text-blue-600">0%</span></div>
                <div><span className="block text-xs text-slate-500 font-semibold mb-1">Number of ASMs</span><span className="text-sm font-medium">0</span></div>
              </div>
            </div>
          </div>
          <div className="flex justify-end pt-6 mt-4 border-t border-slate-100">
            <ActionButton variant="secondary" onClick={() => setIsViewModalOpen(false)}>Close</ActionButton>
          </div>
        </Modal>
      )}
    </div>
  );
}
