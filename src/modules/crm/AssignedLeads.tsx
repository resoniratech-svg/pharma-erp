import { useState, useEffect } from 'react';
import { Plus, Download, Filter, User, Users, Target, PhoneCall, CheckCircle2, ChevronDown, Eye, X } from 'lucide-react';
import {
  PageHeader,
  FilterBar,
  SearchInput,
  SelectFilter,
  ActionButton,
  TableCard,
  DataTable,
  Badge,
  SummaryCard,
  Drawer,
  DrawerField,
} from './components/shared';
import { type Column } from './components/shared';
import { leadService } from '../../services/leadService';
import { employeeService } from '../../services/employeeService';
import { Modal } from '../../components/ui/Modal';

const generateLeadId = (currentLeads: Lead[]) => {
  if (currentLeads.length === 0) return 'LD-0001';
  
  let maxId = 0;
  currentLeads.forEach(lead => {
    const numPart = parseInt(lead.id.split('-')[1] || '0', 10);
    if (numPart > maxId) maxId = numPart;
  });
  
  const nextNum = maxId + 1;
  return `LD-${nextNum.toString().padStart(4, '0')}`;
};

interface Lead {
  id: string;
  name: string;
  type: string;
  source: string;
  contact: string;
  territory?: string;
  createdBy?: string;
  createdAt?: string;
  status: 'New' | 'Assigned' | 'Contacted' | 'Qualified' | 'Lost';
  contactPerson?: string;
  leadDate?: string;
  state?: string;
  district?: string;
  city?: string;
  priority?: string;
  followUpDate?: string;
  assignedTo?: string;
  _dbId?: string;
}

export default function AssignedLeads() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editingLeadId, setEditingLeadId] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  
  const [showStateDropdown, setShowStateDropdown] = useState(false);
  const [showDistrictDropdown, setShowDistrictDropdown] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [showTerritoryDropdown, setShowTerritoryDropdown] = useState(false);
  const [showAssignedToDropdown, setShowAssignedToDropdown] = useState(false);

  const [statesList, setStatesList] = useState<string[]>([]);
  const [districtsList, setDistrictsList] = useState<string[]>([]);
  const [citiesList, setCitiesList] = useState<string[]>([]);
  const [territoriesList, setTerritoriesList] = useState<string[]>([]);
  const [employeesList, setEmployeesList] = useState<string[]>([]);

  useEffect(() => {
    const s = localStorage.getItem('lead_states');
    setStatesList(s ? JSON.parse(s) : ['Maharashtra', 'Karnataka', 'Telangana']);
    
    const d = localStorage.getItem('lead_districts');
    setDistrictsList(d ? JSON.parse(d) : ['Mumbai', 'Pune', 'Bangalore', 'Hyderabad']);
    
    const c = localStorage.getItem('lead_cities');
    setCitiesList(c ? JSON.parse(c) : ['Mumbai', 'Pune', 'Bangalore', 'Hyderabad']);
    
    const t = localStorage.getItem('lead_territories');
    setTerritoriesList(t ? JSON.parse(t) : ['Andheri East', 'Koramangala', 'Madhapur']);
    
    const e = localStorage.getItem('lead_employees');
    setEmployeesList(e ? JSON.parse(e) : ['Deepak Tyagi (MR)', 'Rohit Saxena (MR)', 'Amit Kumar (MR)']);
  }, []);
  
  const [formData, setFormData] = useState<any>({
    name: '',
    type: 'Distributor',
    contactPerson: '',
    contact: '', // Serves as Mobile Number
    state: '',
    district: '',
    city: '',
    territory: '',
    status: 'New',
    leadDate: new Date().toISOString().split('T')[0],
    source: 'Direct Visit',
    assignedTo: '',
    priority: 'Medium',
    followUpDate: '',
    dealValue: undefined,
  });

  useEffect(() => {
    const activeRole = localStorage.getItem('activeRole');
    const authUserStr = localStorage.getItem('authUser');
    const authUser = authUserStr ? JSON.parse(authUserStr) : null;
    
    const allEmployees = employeeService.getLocalEmployees();
    
    let currentRole = 'Super Admin';
    let currentName = 'Super Admin';
    let currentEmpId = '';

    if (authUser) {
      currentRole = authUser.roleId || authUser.role || 'SUPER_ADMIN';
      currentName = authUser.fullName || authUser.name || authUser.adminName || 'Super Admin';
      currentEmpId = authUser.id || authUser.employeeId || '';
    } else if (activeRole) {
      currentRole = activeRole;
      if (activeRole === 'SUPER_ADMIN') {
        currentName = 'Super Admin';
      } else {
        let targetDesignation = '';
        if (activeRole === 'NATIONAL_SALES_HEAD') targetDesignation = 'National Sales Head';
        else if (activeRole === 'REGIONAL_SALES_MANAGER') targetDesignation = 'Regional Sales Manager';
        else if (activeRole === 'AREA_SALES_MANAGER') targetDesignation = 'Area Sales Manager';
        else if (activeRole === 'MEDICAL_REPRESENTATIVE') targetDesignation = 'Medical Representative';
        
        if (targetDesignation) {
          const mockEmp = allEmployees.find(e => e.designation === targetDesignation && e.status === 'Active');
          if (mockEmp) {
            currentName = mockEmp.employeeName;
            currentEmpId = mockEmp.id;
          }
        }
      }
    }

    if (!currentEmpId && currentName !== 'Super Admin') {
       const loggedInEmp = allEmployees.find(e => e.employeeName === currentName);
       if (loggedInEmp) currentEmpId = loggedInEmp.id;
    }

    const isSuperAdmin = currentRole === 'SUPER_ADMIN' || currentRole === 'Super Admin';

    leadService.getAll().then((apiLeads) => {
      // 1) Filter leads for visibility
      let visibleLeads = apiLeads;
      if (!isSuperAdmin) {
        visibleLeads = apiLeads.filter(l => {
          if (currentRole === 'MEDICAL_REPRESENTATIVE' || currentRole === 'ROLE_MEDICAL_REPRESENTATIVE') {
            return l.assignedMrName === currentName || (l.assignedMrId && l.assignedMrId.toString() === currentEmpId);
          }
          // If lead has creator ID, match it. Else fallback to assigned name matching for legacy leads
          if (l.createdByEmpId) {
            return l.createdByEmpId === currentEmpId;
          }
          return l.assignedMrName === currentName;
        });
      }

      const mapped = visibleLeads.map((l) => ({
        id: l.leadCode || l.id,
        name: l.name,
        type: l.type,
        source: l.source || 'Direct',
        contact: l.mobile || l.email || '',
        territory: l.territory || '',
        createdAt: l.createdAt ? new Date(l.createdAt).toLocaleDateString('en-GB') : '',
        createdBy: l.createdByName || l.assignedMrName || '',
        status: (l.status === 'NEW' ? 'New' : l.status === 'CONTACTED' ? 'Contacted' :
          l.status === 'QUALIFIED' ? 'Qualified' : l.status === 'CONVERTED' ? 'Qualified' :
          l.status === 'ASSIGNED' ? 'Assigned' : l.status === 'LOST' ? 'Lost' : 'New') as Lead['status'],
        contactPerson: l.contactPerson || '',
        leadDate: l.leadDate || '',
        state: l.state || '',
        district: l.district || '',
        city: l.city || '',
        priority: l.priority || '',
        followUpDate: l.followUpDate || '',
        assignedTo: l.assignedMrName || '',
        _dbId: l.id,
      }));
      if (mapped.length === 0 && (currentRole === 'MEDICAL_REPRESENTATIVE' || currentRole === 'ROLE_MEDICAL_REPRESENTATIVE')) {
        const mockAssignedLeads = [
          { id: 'LEAD-1001', leadCode: 'LEAD-1001', name: 'Dr. Ramesh Kumar', type: 'Doctor', contact: '9876543210', territory: 'Hyderabad', status: 'New', followUpDate: '12-08-2026', source: 'Direct Visit', createdAt: '10/08/2026', createdBy: 'Admin', _dbId: 'm1' },
          { id: 'LEAD-1002', leadCode: 'LEAD-1002', name: 'Sri Medicals', type: 'Retailer', contact: '9876543211', territory: 'Karimnagar', status: 'Contacted', followUpDate: '14-08-2026', source: 'Direct Visit', createdAt: '10/08/2026', createdBy: 'Admin', _dbId: 'm2' },
          { id: 'LEAD-1003', leadCode: 'LEAD-1003', name: 'ABC Distributors', type: 'Distributor', contact: '9876543212', territory: 'Warangal', status: 'Qualified', followUpDate: '16-08-2026', source: 'Direct Visit', createdAt: '10/08/2026', createdBy: 'Admin', _dbId: 'm3' },
          { id: 'LEAD-1004', leadCode: 'LEAD-1004', name: 'City Care Hospital', type: 'Hospital', contact: '9876543213', territory: 'Hyderabad', status: 'New', followUpDate: '-', source: 'Direct Visit', createdAt: '10/08/2026', createdBy: 'Admin', _dbId: 'm4' },
        ];
        setLeads(mockAssignedLeads as any);
      } else {
        setLeads(mapped as any);
      }
    }).catch((err) => console.error('Failed to load leads:', err));
  }, []);

  const handleSaveLead = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.contact || !formData.territory) {
      alert('Name, Contact, and Territory are required!');
      return;
    }

    try {
      const activeRole = localStorage.getItem('activeRole');
      const authUserStr = localStorage.getItem('authUser');
      const authUser = authUserStr ? JSON.parse(authUserStr) : null;
      const allEmployees = employeeService.getLocalEmployees();
      
      let currentRole = 'Super Admin';
      let currentName = 'Super Admin';
      let currentEmpId = '';

      if (authUser) {
        currentRole = authUser.roleId || authUser.role || 'SUPER_ADMIN';
        currentName = authUser.fullName || authUser.name || authUser.adminName || 'Super Admin';
        currentEmpId = authUser.id || authUser.employeeId || '';
      } else if (activeRole) {
        currentRole = activeRole;
        if (activeRole === 'SUPER_ADMIN') {
          currentName = 'Super Admin';
        } else {
          let targetDesignation = '';
          if (activeRole === 'NATIONAL_SALES_HEAD') targetDesignation = 'National Sales Head';
          else if (activeRole === 'REGIONAL_SALES_MANAGER') targetDesignation = 'Regional Sales Manager';
          else if (activeRole === 'AREA_SALES_MANAGER') targetDesignation = 'Area Sales Manager';
          else if (activeRole === 'MEDICAL_REPRESENTATIVE') targetDesignation = 'Medical Representative';
          
          if (targetDesignation) {
            const mockEmp = allEmployees.find(e => e.designation === targetDesignation && e.status === 'Active');
            if (mockEmp) {
              currentName = mockEmp.employeeName;
              currentEmpId = mockEmp.id;
            }
          }
        }
      }
      if (!currentEmpId && currentName !== 'Super Admin') {
         const loggedInEmp = allEmployees.find(e => e.employeeName === currentName);
         if (loggedInEmp) currentEmpId = loggedInEmp.id;
      }

      const isPhone = /^[\d\s+\-()]+$/.test(formData.contact!.trim());
      const payload = {
        name: formData.name!.trim(),
        type: formData.type || 'Doctor',
        source: formData.source || 'Direct Visit',
        mobile: isPhone ? formData.contact!.trim() : undefined,
        email: !isPhone ? formData.contact!.trim() : undefined,
        territory: formData.territory!.trim(),
        contactPerson: formData.contactPerson,
        leadDate: formData.leadDate,
        state: formData.state,
        district: formData.district,
        city: formData.city,
        priority: formData.priority,
        followUpDate: formData.followUpDate,
        assignedTo: formData.assignedTo,
        creatorInfo: {
          empId: currentEmpId,
          role: currentRole,
          name: currentName
        }
      };

      if (editMode && editingLeadId) {
        const updated = await leadService.update(editingLeadId, payload);
        if (updated) {
          const uiLead: Lead = {
            id: updated.leadCode,
            name: updated.name,
            type: updated.type,
            source: updated.source,
            contact: updated.mobile || updated.email || '',
            territory: updated.territory || '',
            createdAt: new Date(updated.createdAt).toLocaleDateString('en-GB'),
            createdBy: updated.assignedMrName || '',
            status: (updated.status === 'NEW' ? 'New' : updated.status === 'CONTACTED' ? 'Contacted' :
              updated.status === 'QUALIFIED' ? 'Qualified' : updated.status === 'CONVERTED' ? 'Qualified' :
              updated.status === 'ASSIGNED' ? 'Assigned' : updated.status === 'LOST' ? 'Lost' : 'New') as Lead['status'],
            contactPerson: updated.contactPerson || '',
            leadDate: updated.leadDate || '',
            state: updated.state || '',
            district: updated.district || '',
            city: updated.city || '',
            priority: updated.priority || '',
            followUpDate: updated.followUpDate || '',
            assignedTo: updated.assignedMrName || '',
            _dbId: updated.id,
          };
          setLeads((prev) => prev.map(l => l._dbId === editingLeadId ? uiLead : l));
        }
      } else {
        const created = await leadService.create(payload);
        const uiLead: Lead = {
          id: created.leadCode,
          name: created.name,
          type: created.type,
          source: created.source,
          contact: created.mobile || created.email || '',
          territory: created.territory || '',
          createdAt: new Date(created.createdAt).toLocaleDateString('en-GB'),
          createdBy: created.assignedMrName || '',
          status: 'New',
          contactPerson: created.contactPerson || '',
          leadDate: created.leadDate || '',
          state: created.state || '',
          district: created.district || '',
          city: created.city || '',
          priority: created.priority || '',
          followUpDate: created.followUpDate || '',
          assignedTo: created.assignedMrName || '',
          _dbId: created.id,
        };
        setLeads((prev) => [uiLead, ...prev]);
      }

      setFormData({
        name: '', type: 'Distributor', contactPerson: '', contact: '',
        state: '', district: '', city: '', territory: '',
        status: 'New', leadDate: new Date().toISOString().split('T')[0],
        source: 'Direct Visit', assignedTo: '', priority: 'Medium', followUpDate: '',
        dealValue: undefined,
      });
      setIsModalOpen(false);
      setEditMode(false);
      setEditingLeadId(null);
    } catch (err: any) {
      alert(err.message || 'Failed to save lead');
    }
  };

  const handleExportLeads = () => {
    if (leads.length === 0) {
      alert("No leads available to export!");
      return;
    }

    const headers = ['Lead ID', 'Lead Name', 'Type', 'Contact Info', 'Territory', 'Source', 'Status', 'Created Date', 'Created By'];
    
    const csvRows = leads.map(lead => [
      lead.id,
      `"${lead.name}"`, 
      lead.type,
      `"${lead.contact}"`,
      `"${lead.territory || 'Unassigned'}"`,
      lead.source,
      lead.status,
      `"${lead.createdAt || 'N/A'}"`,
      `"${lead.createdBy || 'Unknown'}"`
    ]);

    const csvContent = [
      headers.join(','),
      ...csvRows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `CRM_Leads_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link); 
    
    URL.revokeObjectURL(url);
  };

  const columns: Column<Lead>[] = [
    { key: 'id', label: 'Lead ID', render: (row) => <span className="text-xs font-mono text-slate-500">{row.id}</span> },
    { key: 'name', label: 'Lead Name', render: (row) => <span className="font-semibold text-slate-900 block">{row.name}</span> },
    { key: 'type', label: 'Type' },
    { key: 'contact', label: 'Contact Info' },
    { key: 'territory', label: 'Territory', render: (row) => <span>{row.territory || 'Unassigned'}</span> },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        let variant = 'neutral';
        if (row.status === 'New') variant = 'info';
        else if (row.status === 'Assigned') variant = 'purple';
        else if (row.status === 'Contacted') variant = 'warning';
        else if (row.status === 'Qualified') variant = 'success';
        else if (row.status === 'Lost') variant = 'danger';
        return <Badge variant={variant as any}>{row.status}</Badge>;
      },
    },
    { key: 'followUp', label: 'Next Follow-Up', render: (row) => <span className="text-sm">{row.followUpDate || '-'}</span> },
    {
      key: 'action',
      label: 'ACTIONS',
      render: (row) => (
        <ActionButton variant="ghost" className="text-[#163c78] text-xs px-2 py-1" onClick={() => setSelectedLead(row)}>
          <Eye className="w-4 h-4" />
        </ActionButton>
      )
    }
  ];

  const filteredData = leads.filter((item) => {
    const safeTerritory = item.territory || ''; 
    const safeAssigned = item.assignedTo || item.createdBy || '';
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase()) || 
                        item.contact.toLowerCase().includes(search.toLowerCase()) ||
                        item.id.toLowerCase().includes(search.toLowerCase()) ||
                        safeAssigned.toLowerCase().includes(search.toLowerCase()) ||
                        safeTerritory.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  const totalLeads = leads.length;
  const newLeads = leads.filter(l => l.status === 'New').length;
  const followUpsDue = leads.filter(l => l.followUpDate && l.followUpDate !== '-').length;

  return (
    <div className="animate-in fade-in duration-500 min-h-[calc(100vh-140px)] flex flex-col">
      <PageHeader
        title="Assigned Leads"
        subtitle="View and manage leads assigned to you."
        actions={
          <>
            <ActionButton onClick={handleExportLeads} variant="secondary" icon={<Download className="w-4 h-4" />}>Export Leads</ActionButton>
            
          </>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <SummaryCard title="Total Assigned" value={totalLeads.toString()} subtitle="Currently assigned leads" icon={<Users className="w-6 h-6" />} colorClass="text-[#163c78]" bgClass="bg-[#163c78]/10" />
        <SummaryCard title="New Leads" value={newLeads.toString()} subtitle="Awaiting first contact" icon={<Target className="w-6 h-6" />} colorClass="text-sky-600" bgClass="bg-sky-50" />
        <SummaryCard title="Follow-Ups Due" value={followUpsDue.toString()} subtitle="Pending follow-ups" icon={<PhoneCall className="w-6 h-6" />} colorClass="text-amber-600" bgClass="bg-amber-50" />
      </div>

      <div className="flex-1 flex flex-col">
        <FilterBar>
          <SearchInput value={search} onChange={setSearch} placeholder="Search by ID, Name, Mobile, User, Territory..." />
          <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-medium text-slate-600">Filters:</span>
          </div>
          
          
        </FilterBar>

        <TableCard>
          <DataTable columns={columns} data={filteredData} emptyMessage="No assigned leads found. Leads assigned to you will appear here." />
        </TableCard>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setIsModalOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">{editMode ? "Edit Lead" : "Add New Lead"}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLead} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Basic Information */}
                <div className="md:col-span-2 mt-2 first:mt-0">
                  <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2 uppercase">1. Basic Information</h3>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Lead ID</label>
                  <input 
                    type="text"
                    disabled
                    value="Auto Generated"
                    className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 cursor-not-allowed" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Lead Date *</label>
                  <input 
                    type="date"
                    required
                    value={formData.leadDate}
                    onChange={(e) => setFormData({...formData, leadDate: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#163c78] focus:border-[#163c78]" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Lead Name *</label>
                  <input 
                    type="text" 
                    required 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#163c78] focus:border-[#163c78]"
                    placeholder="e.g. Dr. Ramesh Sharma"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Lead Type *</label>
                  <select 
                    required
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#163c78] focus:border-[#163c78]"
                  >
                    <option value="Distributor">Distributor</option>
                    <option value="Retailer">Retailer / Pharmacy</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Contact Person *</label>
                  <input 
                    type="text" 
                    required 
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({...formData, contactPerson: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#163c78] focus:border-[#163c78]"
                    placeholder="Enter name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Mobile Number *</label>
                  <input 
                    type="tel" 
                    required
                    maxLength={10}
                    pattern="[0-9]{10}"
                    value={formData.contact}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setFormData({...formData, contact: val});
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#163c78] focus:border-[#163c78]"
                    placeholder="e.g. 9876543210"
                  />
                </div>
                <div className="relative">
                  <label className="block text-sm font-medium mb-1">State</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={formData.state} 
                      onChange={(e) => { setFormData({...formData, state: e.target.value}); setShowStateDropdown(true); }} 
                      onFocus={() => setShowStateDropdown(true)} 
                      placeholder="Select State" 
                      className="w-full px-3 py-2 pr-8 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#163c78] focus:border-[#163c78] bg-white text-slate-900" 
                    />
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 cursor-pointer" onClick={() => setShowStateDropdown(!showStateDropdown)} />
                  </div>
                  {showStateDropdown && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowStateDropdown(false)} />
                      <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 flex flex-col overflow-y-auto p-1">
                        {statesList.filter((s) => s.toLowerCase().includes((formData.state || "").toLowerCase())).map((s) => (
                          <div key={s} className="px-3 py-2 text-sm hover:bg-slate-50 cursor-pointer rounded text-slate-700" onClick={() => { setFormData({ ...formData, state: s }); setShowStateDropdown(false); }}>{s}</div>
                        ))}
                        {(formData.state || "").trim() !== "" && !statesList.some((s) => s.trim().toLowerCase() === (formData.state || "").trim().toLowerCase()) && (
                          <div className="px-3 py-2 text-sm text-[#163c78] font-medium hover:bg-[#163c78]/10 cursor-pointer rounded flex items-center gap-2" onClick={() => { 
                            const val = (formData.state || "").trim(); 
                            const updated = [...statesList, val]; 
                            setStatesList(updated); 
                            localStorage.setItem("lead_states", JSON.stringify(updated)); 
                            setFormData({ ...formData, state: val }); 
                            setShowStateDropdown(false); 
                          }}>
                            <Plus className="w-4 h-4" /> Add "{formData.state.trim()}"
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
                <div className="relative">
                  <label className="block text-sm font-medium mb-1">District</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={formData.district} 
                      onChange={(e) => { setFormData({...formData, district: e.target.value}); setShowDistrictDropdown(true); }} 
                      onFocus={() => setShowDistrictDropdown(true)} 
                      placeholder="Select District" 
                      className="w-full px-3 py-2 pr-8 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#163c78] focus:border-[#163c78] bg-white text-slate-900" 
                    />
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 cursor-pointer" onClick={() => setShowDistrictDropdown(!showDistrictDropdown)} />
                  </div>
                  {showDistrictDropdown && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowDistrictDropdown(false)} />
                      <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 flex flex-col overflow-y-auto p-1">
                        {districtsList.filter((s) => s.toLowerCase().includes((formData.district || "").toLowerCase())).map((s) => (
                          <div key={s} className="px-3 py-2 text-sm hover:bg-slate-50 cursor-pointer rounded text-slate-700" onClick={() => { setFormData({ ...formData, district: s }); setShowDistrictDropdown(false); }}>{s}</div>
                        ))}
                        {(formData.district || "").trim() !== "" && !districtsList.some((s) => s.trim().toLowerCase() === (formData.district || "").trim().toLowerCase()) && (
                          <div className="px-3 py-2 text-sm text-[#163c78] font-medium hover:bg-[#163c78]/10 cursor-pointer rounded flex items-center gap-2" onClick={() => { 
                            const val = (formData.district || "").trim(); 
                            const updated = [...districtsList, val]; 
                            setDistrictsList(updated); 
                            localStorage.setItem("lead_districts", JSON.stringify(updated)); 
                            setFormData({ ...formData, district: val }); 
                            setShowDistrictDropdown(false); 
                          }}>
                            <Plus className="w-4 h-4" /> Add "{formData.district.trim()}"
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
                <div className="relative">
                  <label className="block text-sm font-medium mb-1">City</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={formData.city} 
                      onChange={(e) => { setFormData({...formData, city: e.target.value}); setShowCityDropdown(true); }} 
                      onFocus={() => setShowCityDropdown(true)} 
                      placeholder="Select City" 
                      className="w-full px-3 py-2 pr-8 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#163c78] focus:border-[#163c78] bg-white text-slate-900" 
                    />
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 cursor-pointer" onClick={() => setShowCityDropdown(!showCityDropdown)} />
                  </div>
                  {showCityDropdown && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowCityDropdown(false)} />
                      <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 flex flex-col overflow-y-auto p-1">
                        {citiesList.filter((s) => s.toLowerCase().includes((formData.city || "").toLowerCase())).map((s) => (
                          <div key={s} className="px-3 py-2 text-sm hover:bg-slate-50 cursor-pointer rounded text-slate-700" onClick={() => { setFormData({ ...formData, city: s }); setShowCityDropdown(false); }}>{s}</div>
                        ))}
                        {(formData.city || "").trim() !== "" && !citiesList.some((s) => s.trim().toLowerCase() === (formData.city || "").trim().toLowerCase()) && (
                          <div className="px-3 py-2 text-sm text-[#163c78] font-medium hover:bg-[#163c78]/10 cursor-pointer rounded flex items-center gap-2" onClick={() => { 
                            const val = (formData.city || "").trim(); 
                            const updated = [...citiesList, val]; 
                            setCitiesList(updated); 
                            localStorage.setItem("lead_cities", JSON.stringify(updated)); 
                            setFormData({ ...formData, city: val }); 
                            setShowCityDropdown(false); 
                          }}>
                            <Plus className="w-4 h-4" /> Add "{formData.city.trim()}"
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
                <div className="relative">
                  <label className="block text-sm font-medium mb-1">Territory</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={formData.territory} 
                      onChange={(e) => { setFormData({...formData, territory: e.target.value}); setShowTerritoryDropdown(true); }} 
                      onFocus={() => setShowTerritoryDropdown(true)} 
                      placeholder="Select Territory" 
                      className="w-full px-3 py-2 pr-8 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#163c78] focus:border-[#163c78] bg-white text-slate-900" 
                    />
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 cursor-pointer" onClick={() => setShowTerritoryDropdown(!showTerritoryDropdown)} />
                  </div>
                  {showTerritoryDropdown && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowTerritoryDropdown(false)} />
                      <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 flex flex-col overflow-y-auto p-1">
                        {territoriesList.filter((s) => s.toLowerCase().includes((formData.territory || "").toLowerCase())).map((s) => (
                          <div key={s} className="px-3 py-2 text-sm hover:bg-slate-50 cursor-pointer rounded text-slate-700" onClick={() => { setFormData({ ...formData, territory: s }); setShowTerritoryDropdown(false); }}>{s}</div>
                        ))}
                        {(formData.territory || "").trim() !== "" && !territoriesList.some((s) => s.trim().toLowerCase() === (formData.territory || "").trim().toLowerCase()) && (
                          <div className="px-3 py-2 text-sm text-[#163c78] font-medium hover:bg-[#163c78]/10 cursor-pointer rounded flex items-center gap-2" onClick={() => { 
                            const val = (formData.territory || "").trim(); 
                            const updated = [...territoriesList, val]; 
                            setTerritoriesList(updated); 
                            localStorage.setItem("lead_territories", JSON.stringify(updated)); 
                            setFormData({ ...formData, territory: val }); 
                            setShowTerritoryDropdown(false); 
                          }}>
                            <Plus className="w-4 h-4" /> Add "{formData.territory.trim()}"
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Status *</label>
                  <select 
                    required
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#163c78] focus:border-[#163c78]"
                  >
                    <option value="New">New</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Qualified">Qualified</option>
                    <option value="Follow-up">Follow-up</option>
                    <option value="Converted">Converted</option>
                    <option value="Lost">Lost</option>
                  </select>
                </div>

                {/* 2. Sales Information */}
                <div className="md:col-span-2 mt-4">
                  <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2 uppercase">2. Sales Information</h3>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Lead Source *</label>
                  <select 
                    required
                    value={formData.source}
                    onChange={(e) => setFormData({...formData, source: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#163c78] focus:border-[#163c78]"
                  >
                    <option value="Direct Visit">Direct Visit</option>
                    <option value="Reference">Reference</option>
                    <option value="Campaign">Campaign</option>
                    <option value="Website">Website</option>
                    <option value="Distributor">Distributor</option>
                    <option value="Doctor Reference">Doctor Reference</option>
                    <option value="Chemist Reference">Chemist Reference</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="relative">
                  <label className="block text-sm font-medium mb-1">Assigned To</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      
                      value={formData.assignedTo} 
                      onChange={(e) => { setFormData({...formData, assignedTo: e.target.value}); setShowAssignedToDropdown(true); }} 
                      onFocus={() => setShowAssignedToDropdown(true)} 
                      placeholder="Select Employee" 
                      className="w-full px-3 py-2 pr-8 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#163c78] focus:border-[#163c78] bg-white text-slate-900" 
                    />
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 cursor-pointer" onClick={() => setShowAssignedToDropdown(!showAssignedToDropdown)} />
                  </div>
                  {showAssignedToDropdown && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowAssignedToDropdown(false)} />
                      <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 flex flex-col overflow-y-auto p-1">
                        {employeesList.filter((s) => s.toLowerCase().includes((formData.assignedTo || "").toLowerCase())).map((s) => (
                          <div key={s} className="px-3 py-2 text-sm hover:bg-slate-50 cursor-pointer rounded text-slate-700" onClick={() => { setFormData({ ...formData, assignedTo: s }); setShowAssignedToDropdown(false); }}>{s}</div>
                        ))}
                        {(formData.assignedTo || "").trim() !== "" && !employeesList.some((s) => s.trim().toLowerCase() === (formData.assignedTo || "").trim().toLowerCase()) && (
                          <div className="px-3 py-2 text-sm text-[#163c78] font-medium hover:bg-[#163c78]/10 cursor-pointer rounded flex items-center gap-2" onClick={() => { 
                            const val = (formData.assignedTo || "").trim(); 
                            const updated = [...employeesList, val]; 
                            setEmployeesList(updated); 
                            localStorage.setItem("lead_employees", JSON.stringify(updated)); 
                            setFormData({ ...formData, assignedTo: val }); 
                            setShowAssignedToDropdown(false); 
                          }}>
                            <Plus className="w-4 h-4" /> Add "{formData.assignedTo.trim()}"
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Priority *</label>
                  <select 
                    required
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#163c78] focus:border-[#163c78]"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Follow-Up Date</label>
                  <input 
                    type="date"
                    
                    value={formData.followUpDate}
                    onChange={(e) => setFormData({...formData, followUpDate: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#163c78] focus:border-[#163c78]" 
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-slate-100">
                <button 
                  type="button" 
                  className="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-[#163c78] hover:bg-[#122e5c] transition-colors"
                >
                  Save Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Drawer open={!!selectedLead} onClose={() => setSelectedLead(null)} title="Lead Details">
        {selectedLead && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">Basic Information</h3>
              <DrawerField label="Lead ID" value={selectedLead.id} />
              <DrawerField label="Lead Date" value={selectedLead.leadDate || "N/A"} />
              <DrawerField label="Name" value={selectedLead.name} />
              <DrawerField label="Type" value={selectedLead.type} />
              <DrawerField label="Contact Person" value={selectedLead.contactPerson || "N/A"} />
              <DrawerField label="Mobile Number" value={selectedLead.contact} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">Location & Details</h3>
              <DrawerField label="State" value={selectedLead.state || "N/A"} />
              <DrawerField label="District" value={selectedLead.district || "N/A"} />
              <DrawerField label="City" value={selectedLead.city || "N/A"} />
              <DrawerField label="Territory" value={selectedLead.territory || "Unassigned"} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">Sales Information</h3>
              <DrawerField label="Lead Source" value={selectedLead.source} />
              <DrawerField label="Assigned To" value={selectedLead.assignedTo || "N/A"} />
              <DrawerField label="Priority" value={selectedLead.priority || "N/A"} />
              <DrawerField label="Follow-Up Date" value={selectedLead.followUpDate || "N/A"} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">System Info</h3>
              <DrawerField label="Status" value={selectedLead.status} />
              <DrawerField label="Created At" value={selectedLead.createdAt || "N/A"} />
            </div>
            <div className="pt-6 mt-6 border-t border-slate-100 flex justify-end gap-3">
              <ActionButton variant="secondary" onClick={() => setSelectedLead(null)}>Close</ActionButton>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
