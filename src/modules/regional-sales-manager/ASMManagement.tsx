import React, { useState, useEffect } from 'react';
import { PageHeader, FilterBar, SearchInput, TableCard, DataTable, Badge, ActionButton, SummaryCard, Drawer, DrawerField } from './components/shared';
import { Plus, Edit2, Eye, Users, UserCheck, UserX, MapPin, Loader2 } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { employeeService } from '../../services/employeeService';
import type { Employee } from '../super-admin/sales-organization/types';
import { StateSelector } from '../super-admin/components/StateSelector';

export default function ASMManagement() {
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    state: 'All',
    status: 'All'
  });

  const [asmData, setAsmData] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingAsm, setViewingAsm] = useState<Employee | null>(null);
  
  const [availableStates, setAvailableStates] = useState<string[]>([
    'Maharashtra', 'Gujarat', 'Karnataka', 'Delhi', 'Tamil Nadu', 'Telangana', 'Uttar Pradesh', 'West Bengal'
  ]);
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
    area: '',
    password: '',
    confirmPassword: '',
    status: 'Active',
    accountStatus: 'Active',
    joiningDate: new Date().toISOString().split('T')[0],
    remarks: ''
  });

  const { currentName, currentEmpId } = employeeService.getLoggedInEmployee();
  const loggedInRsm = currentName !== 'Super Admin' ? currentName : "Arun Kumar (Regional Sales Manager)";

  const inheritedTerritoryObj = employeeService.getInheritedTerritory(currentEmpId);
  const inheritedZone = inheritedTerritoryObj.zone;
  const inheritedRegion = inheritedTerritoryObj.region;
  const inheritedState = inheritedTerritoryObj.state;

  const generatedEmpCode = editingId 
    ? (asmData.find(a => a.id === editingId)?.employeeCode || '') 
    : employeeService.generateNextEmployeeCode('Area Sales Manager');

  const loadData = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const { isSuperAdmin } = employeeService.getLoggedInEmployee();
      const employees = await employeeService.getEmployees({
        designation: 'Area Sales Manager',
        ...(isSuperAdmin ? {} : { reportsToId: currentEmpId })
      });
      setAsmData(employees.reverse());
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.message || 'Failed to load ASMs from database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setEditingId(null);
    setNewAsm({
      name: '', mobile: '', email: '', gender: 'Male', dob: '', state: inheritedState || '', hq: '', territory: '', area: '',
      password: '', confirmPassword: '', status: 'Active', accountStatus: 'Active', 
      joiningDate: new Date().toISOString().split('T')[0], remarks: ''
    });
    setStateSearch(inheritedState || '');
    setErrorMsg('');
    setIsAddModalOpen(true);
  };

  const openEditModal = (asm: Employee) => {
    setEditingId(asm.id);
    const anyAsm = asm as any;
    setNewAsm({
      name: asm.employeeName || '', 
      mobile: anyAsm.mobile || '', 
      email: anyAsm.email || '', 
      gender: anyAsm.gender || 'Male', 
      dob: anyAsm.dob || '',
      state: anyAsm.state || '', 
      hq: asm.headquarters || '', 
      territory: anyAsm.territory || '', 
      area: asm.area || '', 
      password: '', 
      confirmPassword: '', 
      status: asm.status, 
      accountStatus: anyAsm.accountStatus || 'Active', 
      joiningDate: asm.joiningDate || '',
      remarks: anyAsm.remarks || ''
    });
    setStateSearch(((asm as any).states && (asm as any).states[0]) || asm.region || '');
    setErrorMsg('');
    setIsAddModalOpen(true);
  };

  const openViewModal = (asm: Employee) => {
    setViewingAsm(asm);
    setIsViewModalOpen(true);
  };

  const handleSelectState = (stateName: string) => {
    const trimmed = stateName.trim();
    if (!trimmed) return;
    const existing = availableStates.find(s => s.toLowerCase() === trimmed.toLowerCase());
    const finalState = existing ? existing : trimmed;
    
    setNewAsm({ ...newAsm, state: finalState });
    setStateSearch(finalState);
    setIsStateDropdownOpen(false);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newAsm.password && newAsm.password !== newAsm.confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    
    if (!newAsm.territory.trim()) {
      alert("Territory is required");
      return;
    }
    
    try {
      setSaving(true);
      setErrorMsg('');
      
      const { currentName: currentUser, currentEmpId } = employeeService.getLoggedInEmployee();


      if (editingId) {
        await employeeService.updateEmployee(editingId, {
          employeeName: newAsm.name,
          designation: 'Area Sales Manager',
          email: newAsm.email,
          mobile: newAsm.mobile,
          gender: newAsm.gender,
          dob: newAsm.dob,
          remarks: newAsm.remarks,
          password: newAsm.password || undefined,
          states: [newAsm.state],
          state: newAsm.state,
          territory: newAsm.territory,
          headquarters: newAsm.hq,
          region: inheritedRegion,
          zone: inheritedZone,
          area: newAsm.area,
          joiningDate: newAsm.joiningDate,
          status: newAsm.status as 'Active' | 'Inactive',
        } as any);
      } else {
        await employeeService.addEmployee({
          employeeCode: generatedEmpCode,
          employeeName: newAsm.name,
          designation: 'Area Sales Manager',
          email: newAsm.email,
          mobile: newAsm.mobile,
          password: newAsm.password || 'Welcome@123',
          reportsTo: currentUser !== 'Super Admin' ? currentUser : 'Owner / Super Admin',
          reportsToId: currentEmpId || undefined,
          states: [newAsm.state],
          state: newAsm.state,
          territory: newAsm.territory,
          headquarters: newAsm.hq,
          region: inheritedRegion,
          zone: inheritedZone,
          area: newAsm.area,
          joiningDate: newAsm.joiningDate,
          status: newAsm.status as 'Active' | 'Inactive',
          gender: newAsm.gender,
          dob: newAsm.dob,
          remarks: newAsm.remarks,
        });
      }

      await loadData();
      setIsAddModalOpen(false);
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.message || 'Failed to save ASM');
    } finally {
      setSaving(false);
    }
  };

  const filteredData = asmData.filter(row => {
    const s = search.toLowerCase();
    const anyRow = row as any;
    const matchesSearch = search === '' || 
      (row.employeeCode || '').toLowerCase().includes(s) ||
      (row.employeeName || '').toLowerCase().includes(s) ||
      (anyRow.mobile || '').toLowerCase().includes(s) ||
      (anyRow.email || '').toLowerCase().includes(s) ||
      (row.headquarters || '').toLowerCase().includes(s);

    const rowState = ((row as any).states && (row as any).states[0]) || row.region || '';
    const matchesState = filters.state === 'All' || rowState === filters.state;
    const matchesStatus = filters.status === 'All' || row.status === filters.status;
    
    return matchesSearch && matchesState && matchesStatus;
  });

  const columns = [
    { key: 'id', label: 'Employee Code', render: (row: Employee) => row.employeeCode || `ASM-${row.id}` },
    { key: 'name', label: 'ASM Name', render: (row: Employee) => row.employeeName },
    { key: 'state', label: 'State', render: (row: Employee) => ((row as any).states && (row as any).states[0]) || row.region || '-' },
    { key: 'hq', label: 'Headquarters', render: (row: Employee) => row.headquarters || '-' },
    {
      key: 'status',
      label: 'Status',
      render: (row: Employee) => <Badge variant={row.status === 'Active' ? 'success' : 'neutral'}>{row.status}</Badge>
    },
    {
      key: 'actions',
      label: 'Action',
      render: (row: Employee) => (
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
        subtitle="Manage Area Sales Managers and assign operational details (Database Integrated)."
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
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-[#163c78] mb-2" />
            <p className="text-sm">Loading Area Sales Managers from database...</p>
          </div>
        ) : (
          <DataTable columns={columns} data={filteredData} emptyMessage="No ASMs found in database." />
        )}
      </TableCard>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={editingId ? "Edit Area Sales Manager" : "Add Area Sales Manager (ASM)"}
        className="max-w-4xl w-full"
      >
        <form onSubmit={handleAddSubmit} className="space-y-6 mt-2">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg">
              {errorMsg}
            </div>
          )}

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
                  onChange={e => setNewAsm({...newAsm, mobile: e.target.value.replace(/\\D/g, '').slice(0, 10)})}
                  maxLength={10}
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
                <label className="block text-sm font-medium text-slate-700 mb-2">Date of Birth</label>
                <input 
                  type="date"
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
                  value={newAsm.state} 
                  onChange={(val) => setNewAsm({ ...newAsm, state: val })} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Territory *</label>
                <input 
                  type="text"
                  required
                  value={newAsm.territory}
                  onChange={e => setNewAsm({...newAsm, territory: e.target.value})}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#163c78] focus:border-[#163c78]" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Area *</label>
                <input 
                  type="text"
                  required
                  value={newAsm.area}
                  onChange={e => setNewAsm({...newAsm, area: e.target.value})}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#163c78] focus:border-[#163c78]" 
                />
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
              <div className="hidden md:block"></div>
            </div>
          </div>

          {/* 3. Login Credentials */}
          <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-800 mb-5 uppercase tracking-wider border-b border-slate-200 pb-2">3. Login Credentials</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Password {editingId ? '(Leave blank to keep unchanged)' : '*'}</label>
                <input 
                  type="password"
                  required={!editingId}
                  minLength={6}
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
                  minLength={6}
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
                  value={newAsm.joiningDate}
                  onChange={e => setNewAsm({...newAsm, joiningDate: e.target.value})}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#163c78] focus:border-[#163c78]" 
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
              disabled={saving}
              className="px-6 py-2.5 text-sm font-medium text-white bg-[#163c78] rounded-lg hover:bg-[#122e5c] transition-colors flex items-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
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
              <DrawerField label="Employee Code" value={viewingAsm.employeeCode || viewingAsm.id} />
              <DrawerField label="Employee Name" value={viewingAsm.employeeName || '-'} />
              <DrawerField label="Mobile Number" value={(viewingAsm as any).mobile || '-'} />
              <DrawerField label="Email Address" value={(viewingAsm as any).email || '-'} />
              <DrawerField label="Gender" value={(viewingAsm as any).gender || '-'} />
              <DrawerField label="Date of Birth" value={(viewingAsm as any).dob || '-'} />

              <div className="py-3 mt-2 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">Employment Information</p>
                <div className="space-y-1">
                  <DrawerField label="Joining Date" value={viewingAsm.joiningDate || '-'} />
                  <DrawerField label="State" value={(viewingAsm as any).state || '-'} />
                  <DrawerField label="Headquarters" value={viewingAsm.headquarters || '-'} />
                  <DrawerField label="Territory" value={viewingAsm.territory || '-'} />
                  <DrawerField label="Area" value={viewingAsm.area || '-'} />
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
                  <DrawerField label="Remarks" value={(viewingAsm as any).remarks || '-'} />
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
