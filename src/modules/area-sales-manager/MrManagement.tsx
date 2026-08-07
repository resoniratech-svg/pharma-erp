import React, { useState, useEffect } from 'react';
import { PageHeader, FilterBar, SearchInput, SelectFilter, TableCard, DataTable, Badge, ActionButton, DrawerField } from './components/shared';
import { Users, Eye, Edit2, Plus, Target, Clock, TrendingUp, Download, ChevronDown, Table as TableIcon, FileText } from 'lucide-react';
import { Drawer } from '../../components/ui/Drawer';
import { Modal } from '../../components/ui/Modal';
import { employeeService } from '../../services/employeeService';
import { asmService } from '../../services/asmService';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { StateSelector } from '../super-admin/components/StateSelector';

export default function MRManagement() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [territoryFilter, setTerritoryFilter] = useState('All Territories');
  
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState<any | null>(null);

  const [newMr, setNewMr] = useState({
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
    status: 'Active' as 'Active' | 'Inactive',
    accountStatus: 'Active',
    joiningDate: '',
    remarks: ''
  });

  const { currentName, currentEmpId } = employeeService.getLoggedInEmployee();
  const loggedInAsm = currentName !== 'Super Admin' ? currentName : "Current ASM User"; 
  
  // Get inherited territory from logged in user
  const inheritedTerritoryObj = employeeService.getInheritedTerritory(currentEmpId);
  const inheritedZone = inheritedTerritoryObj.zone;
  const inheritedRegion = inheritedTerritoryObj.region;
  const inheritedState = inheritedTerritoryObj.state;
  const inheritedTerritory = inheritedTerritoryObj.territory;
  const inheritedArea = inheritedTerritoryObj.area;
  
  // Use global generator for code
  const generatedEmpCode = selectedEmp 
    ? (selectedEmp.employeeCode || selectedEmp.id) 
    : employeeService.generateNextEmployeeCode('Medical Representative');

  const loadData = async () => {
    try {
      const { isSuperAdmin, currentEmpId } = employeeService.getLoggedInEmployee();
      const data = await employeeService.getEmployees({
        designation: 'Medical Representative',
        ...(isSuperAdmin ? {} : { reportsToId: currentEmpId })
      });
      const mapped = data.map(emp => ({
        id: emp.id,
        employeeCode: emp.employeeCode,
        employeeName: emp.employeeName,
        mobile: (emp as any).mobile || '',
        email: (emp as any).email || '',
        gender: (emp as any).gender || '',
        dob: (emp as any).dob || '',
        state: (emp as any).state || '',
        headquarters: emp.headquarters || '',
        territory: (emp as any).territory || '',
        area: emp.area || '',
        status: emp.status,
        accountStatus: (emp as any).accountStatus || 'Active',
        joiningDate: emp.joiningDate || '',
        remarks: (emp as any).remarks || ''
      }));
      setEmployees(mapped.reverse());
    } catch (e) {
      console.warn("Failed to load MRs", e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredData = employees.filter(row => {
    const matchesSearch = row.employeeName.toLowerCase().includes(search.toLowerCase()) || 
                          row.employeeCode?.toLowerCase().includes(search.toLowerCase()) ||
                          row.mobile?.includes(search) ||
                          row.headquarters?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All Status' || row.status === statusFilter;
    const matchesTerritory = territoryFilter === 'All Territories' || row.territory === territoryFilter;
    
    return matchesSearch && matchesStatus && matchesTerritory;
  });

  const handleView = (row: any) => {
    setSelectedEmp(row);
    setDrawerOpen(true);
  };

  const handleEdit = (row: any) => {
    setSelectedEmp(row);
    setNewMr({
      name: row.employeeName || '', mobile: row.mobile || '', email: row.email || '', gender: row.gender || 'Male', dob: row.dob || '',
      state: row.state || '', hq: row.headquarters || '', territory: row.territory || '', area: row.area || '',
      password: '', confirmPassword: '', status: row.status || 'Active', accountStatus: row.accountStatus || 'Active', joiningDate: row.joiningDate || '', remarks: row.remarks || ''
    });
    setModalOpen(true);
  };

  const handleAdd = () => {
    setSelectedEmp(null);
    setNewMr({
      name: '', mobile: '', email: '', gender: 'Male', dob: '', state: inheritedState || '', hq: '', territory: '', area: '', 
      password: '', confirmPassword: '', status: 'Active', accountStatus: 'Active', joiningDate: '', remarks: ''
    });
    setModalOpen(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMr.password && newMr.password !== newMr.confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    
    const { currentName: currentUser, currentEmpId } = employeeService.getLoggedInEmployee();

    if (selectedEmp) {
      employeeService.updateEmployee(selectedEmp.id, {
        employeeName: newMr.name,
        mobile: newMr.mobile,
        email: newMr.email,
        state: newMr.state,
        territory: newMr.territory,
        area: newMr.area,
        headquarters: newMr.hq,
        status: newMr.status,
      });
    } else {
      employeeService.addEmployee({
        employeeCode: generatedEmpCode,
        employeeName: newMr.name,
        mobile: newMr.mobile,
        email: newMr.email,
        designation: 'Medical Representative',
        reportsTo: currentUser !== 'Super Admin' ? currentUser : 'Owner / Super Admin',
        reportsToId: currentEmpId || undefined,
        zone: inheritedZone,
        region: inheritedRegion,
        state: newMr.state,
        territory: newMr.territory,
        area: newMr.area,
        headquarters: newMr.hq,
        status: newMr.status as any,
        joiningDate: newMr.joiningDate || new Date().toISOString().split('T')[0]
      });
    }

    try {
      if (selectedEmp) {
        await asmService.updateMR(selectedEmp.id, {
          employeeName: newMr.name,
          mobile: newMr.mobile,
          email: newMr.email,
          gender: newMr.gender,
          dob: newMr.dob,
          state: newMr.state,
          headquarters: newMr.hq,
          territory: newMr.territory,
          status: newMr.status,
          accountStatus: newMr.accountStatus,
          remarks: newMr.remarks,
          ...(newMr.password && { password: newMr.password })
        });
        alert('MR Updated successfully');
      } else {
        await asmService.createMR({
          employeeCode: generatedEmpCode,
          employeeName: newMr.name,
          mobile: newMr.mobile,
          email: newMr.email,
          gender: newMr.gender,
          dob: newMr.dob,
          state: newMr.state,
          headquarters: newMr.hq,
          territory: newMr.territory,
          status: newMr.status,
          accountStatus: newMr.accountStatus,
          joiningDate: newMr.joiningDate,
          remarks: newMr.remarks,
          password: newMr.password
        });
        alert('MR Created successfully');
      }
      setModalOpen(false);
      await loadData();
    } catch (e: any) {
      alert(e.message || "Failed to save MR");
    }
  };

  const [isExportOpen, setIsExportOpen] = useState(false);

  const handleExportExcel = () => {
    if (filteredData.length === 0) return;
    
    const exportData = filteredData.map(row => ({
      'MR Code': row.employeeCode || row.id,
      'MR Name': row.employeeName,
      'HQ': row.headquarters || '-',
      'Territory': row.territory || '-',
      'Mobile': row.mobile || '-',
      'Status': row.status
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "MR Management");
    XLSX.writeFile(workbook, "MR_Management.xlsx");
    setIsExportOpen(false);
  };

  const handleExportPDF = () => {
    if (filteredData.length === 0) return;
    
    const doc = new jsPDF('landscape');
    
    doc.setFontSize(16);
    doc.text("MR Management Report", 14, 20);
    
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);
    
    const tableColumn = ["MR Code", "MR Name", "HQ", "Territory", "Mobile", "Status"];
    const tableRows = filteredData.map(row => [
      row.employeeCode || row.id,
      row.employeeName,
      row.headquarters || '-',
      row.territory || '-',
      row.mobile || '-',
      row.status
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 35,
      theme: 'grid',
      styles: { fontSize: 10 },
      headStyles: { fillColor: [22, 60, 120] } // #163c78
    });

    doc.save("MR_Management.pdf");
    setIsExportOpen(false);
  };

  const columns = [
    { key: 'employeeCode', label: 'MR Code', render: (row: any) => <span className="font-medium text-[#163c78]">{row.employeeCode || row.id}</span> },
    { key: 'employeeName', label: 'MR Name', render: (row: any) => <span className="font-semibold text-slate-800">{row.employeeName}</span> },
    { key: 'headquarters', label: 'HQ', render: (row: any) => row.headquarters || '-' },
    { key: 'territory', label: 'Territory', render: (row: any) => row.territory || '-' },
    { key: 'status', label: 'Status', render: (row: any) => <Badge variant={row.status === 'Active' ? 'success' : 'neutral'}>{row.status}</Badge> },
    {
      key: 'actions',
      label: 'Action',
      render: (row: any) => (
        <div className="flex gap-2">
          <button onClick={() => handleView(row)} className="p-1.5 text-slate-400 hover:text-[#163c78] hover:bg-blue-50 rounded transition-colors" title="View Profile">
            <Eye className="w-4 h-4" />
          </button>
          <button onClick={() => handleEdit(row)} className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors" title="Edit Profile">
            <Edit2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  // const uniqueTerritories = ['All Territories', ...Array.from(new Set(employees.map(e => e.territory).filter(Boolean)))];

  return (
    <div className="p-6">
      <PageHeader 
        title="MR Management" 
        subtitle="Manage your Medical Representatives, view profiles, and monitor individual performance."
        actions={
          <div className="flex items-center gap-2">
            <div className="relative">
              <button 
                onClick={() => setIsExportOpen(!isExportOpen)}
                disabled={filteredData.length === 0}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors shadow-sm border ${
                  filteredData.length === 0 
                    ? 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed' 
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
                title={filteredData.length === 0 ? "No data available to export" : "Export options"}
              >
                <Download className="w-4 h-4" /> Export <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>
              
              {isExportOpen && filteredData.length > 0 && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setIsExportOpen(false)}
                  ></div>
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-lg shadow-lg z-20 py-1 overflow-hidden">
                    <button 
                      onClick={handleExportExcel}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left"
                    >
                      <TableIcon className="w-4 h-4 text-emerald-600" /> Export as Excel (.xlsx)
                    </button>
                    <button 
                      onClick={handleExportPDF}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left"
                    >
                      <FileText className="w-4 h-4 text-rose-600" /> Export as PDF (.pdf)
                    </button>
                  </div>
                </>
              )}
            </div>
            <ActionButton onClick={handleAdd} icon={<Plus className="w-4 h-4" />}>
              Add MR
            </ActionButton>
          </div>
        }
      />

      <FilterBar>
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by name, code, HQ, mobile..." />

          <SelectFilter
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { label: 'All Status', value: 'All Status' },
              { label: 'Active', value: 'Active' },
              { label: 'Inactive', value: 'Inactive' }
            ]}
          />
        </div>
      </FilterBar>

      <TableCard>
        <DataTable columns={columns} data={filteredData} emptyMessage="No Medical Representatives found." />
      </TableCard>

      {/* View Drawer */}
      <Drawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Medical Representative Profile"
      >
        {selectedEmp && (
          <div className="flex flex-col h-full pb-8">
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100 mb-6">
              <div className="w-16 h-16 bg-blue-100 text-blue-700 flex items-center justify-center rounded-full text-2xl font-bold">
                {selectedEmp.employeeName.charAt(0)}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">{selectedEmp.employeeName}</h3>
                <p className="text-sm text-slate-500">{selectedEmp.employeeCode || selectedEmp.id}</p>
                <div className="mt-2">
                  <Badge variant={selectedEmp.status === 'Active' ? 'success' : 'neutral'}>{selectedEmp.status}</Badge>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="py-3 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">1. Personal Information</p>
                <div className="space-y-1">
                  <DrawerField label="Email Address" value={selectedEmp.email || '-'} />
                  <DrawerField label="Mobile Number" value={selectedEmp.mobile || '-'} />
                  <DrawerField label="Gender" value={selectedEmp.gender || '-'} />
                  <DrawerField label="Date of Birth" value={selectedEmp.dob || '-'} />
                  <DrawerField label="Joining Date" value={selectedEmp.joiningDate || '-'} />
                </div>
              </div>

              <div className="py-3 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">2. Organization Information</p>
                <div className="space-y-1">
                  <DrawerField label="Reporting ASM" value={loggedInAsm} />
                  <DrawerField label="State" value={selectedEmp.state || '-'} />
                  <DrawerField label="Territory" value={selectedEmp.territory || '-'} />
                  <DrawerField label="Area" value={selectedEmp.area || '-'} />
                  <DrawerField label="Headquarters" value={selectedEmp.headquarters || '-'} />
                </div>
              </div>

              <div className="py-3 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">3. Account Information</p>
                <div className="space-y-1">
                  <DrawerField label="Login Email" value={selectedEmp.email || '-'} />
                  <DrawerField label="Account Status" value={selectedEmp.accountStatus || 'Active'} />
                  <DrawerField label="Employment Status" value={selectedEmp.status || '-'} />
                </div>
              </div>

              {selectedEmp.remarks && (
                <div className="py-3 border-t border-slate-100">
                  <p className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">4. Remarks</p>
                  <div className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100 mt-2">
                    {selectedEmp.remarks}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-auto pt-6 border-t border-slate-100">
              <button
                onClick={() => setDrawerOpen(false)}
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors"
              >
                Close Profile
              </button>
            </div>
          </div>
        )}
      </Drawer>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selectedEmp ? "Edit MR Profile" : "Add New MR"}
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
                  value={newMr.name}
                  onChange={e => setNewMr({...newMr, name: e.target.value})}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#163c78] focus:border-[#163c78]" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Mobile Number *</label>
                <input 
                  type="tel"
                  required
                  maxLength={10}
                  pattern="[0-9]{10}"
                  value={newMr.mobile}
                  onChange={e => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setNewMr({...newMr, mobile: val});
                  }}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#163c78] focus:border-[#163c78]" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email Address *</label>
                <input 
                  type="email"
                  required
                  value={newMr.email}
                  onChange={e => setNewMr({...newMr, email: e.target.value})}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#163c78] focus:border-[#163c78]" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Gender *</label>
                <select 
                  required
                  value={newMr.gender}
                  onChange={e => setNewMr({...newMr, gender: e.target.value})}
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
                  value={newMr.dob}
                  onChange={e => setNewMr({...newMr, dob: e.target.value})}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#163c78] focus:border-[#163c78]" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Designation</label>
                <input 
                  type="text" 
                  value="Medical Representative"
                  disabled 
                  className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-medium cursor-not-allowed" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Reporting ASM</label>
                <input 
                  type="text" 
                  value={loggedInAsm}
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
                  value={newMr.state} 
                  onChange={(val) => setNewMr({ ...newMr, state: val })} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Territory *</label>
                <input 
                  type="text"
                  required
                  value={newMr.territory}
                  onChange={e => setNewMr({...newMr, territory: e.target.value})}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#163c78] focus:border-[#163c78]" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Area *</label>
                <input 
                  type="text"
                  required
                  value={newMr.area}
                  onChange={e => setNewMr({...newMr, area: e.target.value})}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#163c78] focus:border-[#163c78]" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Headquarters (HQ) *</label>
                <input 
                  type="text"
                  required
                  value={newMr.hq}
                  onChange={e => setNewMr({...newMr, hq: e.target.value})}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#163c78] focus:border-[#163c78]" 
                />
              </div>
            </div>
          </div>

          {/* 3. Login Credentials */}
          <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-800 mb-5 uppercase tracking-wider border-b border-slate-200 pb-2">3. Login Credentials</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email Address (Login ID)</label>
                <input 
                  type="email"
                  disabled 
                  value={newMr.email}
                  className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 cursor-not-allowed" 
                  placeholder="Auto-populated from email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Account Status</label>
                <select 
                  value={newMr.accountStatus}
                  onChange={e => setNewMr({...newMr, accountStatus: e.target.value})}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#163c78] focus:border-[#163c78]"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Password {selectedEmp ? '(Leave blank to keep unchanged)' : '*'}</label>
                <input 
                  type="password"
                  required={!selectedEmp}
                  minLength={8}
                  value={newMr.password}
                  onChange={e => setNewMr({...newMr, password: e.target.value})}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#163c78] focus:border-[#163c78]" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Confirm Password {selectedEmp ? '' : '*'}</label>
                <input 
                  type="password"
                  required={!selectedEmp && !!newMr.password}
                  minLength={8}
                  value={newMr.confirmPassword}
                  onChange={e => setNewMr({...newMr, confirmPassword: e.target.value})}
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
                  disabled={!!selectedEmp}
                  value={newMr.joiningDate}
                  onChange={e => setNewMr({...newMr, joiningDate: e.target.value})}
                  className={`w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#163c78] focus:border-[#163c78] ${selectedEmp ? 'bg-slate-100 cursor-not-allowed' : ''}`} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Employment Status</label>
                <select 
                  value={newMr.status}
                  onChange={e => setNewMr({...newMr, status: e.target.value as 'Active' | 'Inactive'})}
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
                  value={newMr.remarks}
                  onChange={e => setNewMr({...newMr, remarks: e.target.value})}
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
              onClick={() => setModalOpen(false)}
            >
               Cancel
            </button>
            <button 
              type="submit"
              className="px-6 py-2.5 text-sm font-medium text-white bg-[#163c78] rounded-lg hover:bg-[#122e5c] transition-colors"
            >
              {selectedEmp ? "Update MR" : "Create MR"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
