import { useState, useEffect } from 'react';
import { Download, PhoneCall, Calendar, Plus, CheckCircle } from 'lucide-react';
import {
  PageHeader,
  FilterBar,
  SearchInput,
  SelectFilter,
  ActionButton,
  TableCard,
  DataTable,
  Badge,
  Drawer,
} from './components/shared';
import { type Column } from './components/shared';
import { employeeService } from '../../services/employeeService';
import { followUpService } from '../../services/followUpService';
import { leadService } from '../../services/leadService';

interface Lead {
  id: string;
  name: string;
  contact: string;
  territory?: string;
  leadCode?: string;
  assignedMrId?: number | null;
}

interface FollowUp {
  id: string;
  leadId: string;
  contactName: string;
  type: string;
  method: string;
  date: string;
  nextFollowUpDate?: string;
  notes?: string;
  status: 'Pending' | 'Completed' | 'Overdue';
  completedDate?: string;
  completedBy?: string;
  outcome?: string;
}

const generateFollowUpId = (history: FollowUp[]) => {
  if (history.length === 0) return 'FU-0001';
  let maxId = 0;
  history.forEach(record => {
    const numPart = parseInt(record.id?.split('-')[1] || '0', 10);
    if (numPart > maxId) maxId = numPart;
  });
  return `FU-${(maxId + 1).toString().padStart(4, '0')}`;
};

export default function FollowUps() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLeadDropdownOpen, setIsLeadDropdownOpen] = useState(false);
  const [leadSearchQuery, setLeadSearchQuery] = useState('');
  const [formData, setFormData] = useState<Partial<FollowUp>>({
    leadId: '',
    type: 'Call',
    method: 'Phone Call',
    date: '',
    nextFollowUpDate: '',
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const activeRole = localStorage.getItem('activeRole');
      const authUserStr = localStorage.getItem('authUser');
      const authUser = authUserStr ? JSON.parse(authUserStr) : null;
      
      const allEmployees = employeeService.getLocalEmployees();
      
      let currentRole = 'Super Admin';
      let currentName = 'Super Admin';
      let currentEmpId = '';
      let currentUserId = '';

      if (authUser) {
        currentRole = authUser.roleId || authUser.role || 'SUPER_ADMIN';
        currentName = authUser.fullName || authUser.name || authUser.adminName || 'Super Admin';
        currentUserId = String(authUser.id || '');
        currentEmpId = authUser.employeeId || '';
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

      const validCreatorIds = [currentUserId, currentEmpId].filter(Boolean);

      const isSuperAdmin = currentRole === 'SUPER_ADMIN' || currentRole === 'Super Admin';
      const subordinates = await employeeService.getAllSubordinates(currentEmpId, currentName, isSuperAdmin);
      const subNames = subordinates.map(s => s.employeeName);
      const subIds = subordinates.map(s => s.id);

      // Load real leads from DB
      const apiLeads = await leadService.getAll();
      
      let visibleLeads = apiLeads;
      if (!isSuperAdmin) {
           visibleLeads = apiLeads.filter(l => {
             const createdMatch = (l.createdByEmpId && (validCreatorIds.includes(String(l.createdByEmpId)) || subIds.includes(l.createdByEmpId))) || 
                                  (!l.createdByEmpId && (l.assignedMrName === currentName || subNames.includes(l.assignedMrName)));
             const assignedMatchReal = l.assignedMrName && (l.assignedMrName === currentName || subNames.includes(l.assignedMrName));
             return createdMatch || assignedMatchReal;
           });
      }

      setLeads(visibleLeads.map((l) => ({
        id: l.id,
        name: l.name,
        contact: l.mobile || l.email || '',
        territory: l.territory || '',
        leadCode: l.leadCode || String(l.id),
        assignedMrId: l.assignedMrId
      })));

      const validLeadIds = new Set(visibleLeads.map(l => String(l.id)));

      // Load real follow-ups from DB
      const apiFollowUps = await followUpService.getAll();
      const todayStr = new Date().toISOString().split('T')[0];
      
      const visibleFollowUps = isSuperAdmin ? apiFollowUps : apiFollowUps.filter(f => f.leadId && validLeadIds.has(String(f.leadId)));
      
      const mapped: FollowUp[] = visibleFollowUps.map((f) => ({
        id: String(f.id),
        leadId: f.leadId?.toString() || '',
        contactName: f.title || f.contactName || '-',
        type: f.type || '-',
        method: f.method || '-',
        date: f.followUpDate || '',
        nextFollowUpDate: f.nextFollowUpDate || '',
        notes: f.remarks || '',
        status: f.status === 'COMPLETED' ? 'Completed' :
          (f.followUpDate < todayStr && f.status === 'PENDING') ? 'Overdue' : 'Pending',
      }));
      setFollowUps(mapped);
    } catch (error) {
      console.error('Failed to load follow-up data:', error);
    }
  };

  const getManagerName = () => {
    const authUserStr = localStorage.getItem('authUser');
    const authUser = authUserStr ? JSON.parse(authUserStr) : null;
    return authUser?.fullName || authUser?.name || authUser?.username || 'Admin';
  };

  const logActivity = (type: string, description: string) => {
    try {
      const managerName = getManagerName();
      const existingActivities = JSON.parse(localStorage.getItem('crm_activities') || '[]');
      const newActivity = {
        id: Date.now().toString(),
        type,
        description,
        date: new Date().toLocaleString(),
        user: managerName
      };
      localStorage.setItem('crm_activities', JSON.stringify([newActivity, ...existingActivities]));
    } catch (error) {
      console.error("Failed to save activity log:", error);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.leadId || !formData.type || !formData.date || !formData.nextFollowUpDate || !formData.notes) {
      alert('Please fill out all mandatory fields.');
      return;
    }
    const selectedLead = leads.find((l) => l.id === formData.leadId);
    if (!selectedLead) return;
    if (!selectedLead.assignedMrId) {
      alert('Please assign this lead to an MR before scheduling a follow-up.');
      return;
    }

    try {
      const mrId = Number(selectedLead.assignedMrId);
      await followUpService.create({
        mrId: mrId,
        leadId: Number(selectedLead.id),
        type: formData.type,
        method: formData.method || 'Phone Call',
        title: selectedLead.name,
        remarks: formData.notes.trim(),
        followUpDate: formData.date,
        nextFollowUpDate: formData.nextFollowUpDate,
      });

      const todayStr = new Date().toISOString().split('T')[0];
      const computedStatus: FollowUp['status'] = formData.date < todayStr ? 'Overdue' : 'Pending';
      const newRecord: FollowUp = {
        id: generateFollowUpId(followUps),
        leadId: selectedLead.id,
        contactName: selectedLead.name,
        type: formData.type,
        method: formData.method || 'Phone Call',
        date: formData.date,
        nextFollowUpDate: formData.nextFollowUpDate,
        notes: formData.notes.trim(),
        status: computedStatus,
      };
      setFollowUps((prev) => [newRecord, ...prev]);
      closeDrawer();
    } catch (err: any) {
      alert(err.message || 'Failed to save follow-up');
    }
  };

  const markAsCompleted = async (id: string) => {
    const targetFollowUp = followUps.find((f) => f.id === id);
    if (!targetFollowUp) return;
    try {
      await followUpService.update(id, { status: 'COMPLETED' } as any);
    } catch (err) {
      console.error('Failed to mark follow-up as completed:', err);
    }
    const completedDateStr = new Date().toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
    setFollowUps((prev) =>
      prev.map((f) =>
        f.id === id ? { ...f, status: 'Completed' as const, completedDate: completedDateStr } : f
      )
    );
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setIsLeadDropdownOpen(false);
    setLeadSearchQuery('');
    setFormData({ leadId: '', type: 'Call', method: 'Phone Call', date: '', nextFollowUpDate: '', notes: '' });
  };

  const handleExport = () => {
    if (followUps.length === 0) return alert("No data to export!");
    const headers = ['FollowUp ID', 'Lead ID', 'Contact Name', 'Purpose', 'Method', 'Due Date', 'Status', 'Completed By', 'Completed Date', 'Notes'];
    const rows = followUps.map(f => [
      f.id, f.leadId, `"${f.contactName}"`, `"${f.type}"`, f.method, f.date, f.status,
      `"${f.completedBy || 'N/A'}"`, `"${f.completedDate || 'N/A'}"`, `"${f.notes || ''}"`
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `followups_${new Date().getTime()}.csv`;
    a.click();
  };

  const columns: Column[] = [
    { key: 'id', label: 'ID', render: (row) => <span className="font-medium text-[#163c78]">{row.id}</span> },
    { key: 'contactName', label: 'Contact Name' },
    { key: 'type', label: 'Purpose' },
    { key: 'method', label: 'Method' },
    { key: 'date', label: 'Due Date' },
    { 
      key: 'status', 
      label: 'Status',
      render: (row) => {
        const variant = row.status === 'Completed' ? 'success' : row.status === 'Overdue' ? 'error' : 'warning';
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    },
    {
      key: 'action',
      label: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          <ActionButton variant="ghost" className="text-[#163c78] text-xs px-2 py-1">
            <PhoneCall className="w-4 h-4" />
          </ActionButton>

          {row.status !== 'Completed' && (
            <ActionButton
              variant="ghost"
              onClick={() => markAsCompleted(row.id)}
              className="text-emerald-600 hover:bg-emerald-50 text-xs px-2 py-1"
            >
              <CheckCircle className="w-4 h-4" />
            </ActionButton>
          )}
        </div>
      )
    }
  ];

  const filteredData = followUps.filter((item) => {
    const s = search.toLowerCase();
    const matchSearch =
      (item.contactName || '').toLowerCase().includes(s) ||
      (item.type || '').toLowerCase().includes(s) ||
      (item.id || '').toLowerCase().includes(s);
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  const overdueCount = followUps.filter(f => f.status === 'Overdue').length;

  const filteredLeads = leads.filter(lead => {
    if (!leadSearchQuery) return true;
    const q = leadSearchQuery.toLowerCase();
    return (
      (lead.name || '').toLowerCase().includes(q) ||
      (lead.id || '').toLowerCase().includes(q) ||
      (lead.leadCode || '').toLowerCase().includes(q) ||
      (lead.contact || '').toLowerCase().includes(q) ||
      (lead.territory || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="animate-in fade-in duration-500 min-h-[calc(100vh-140px)] flex flex-col">
      <PageHeader
        title="Follow-Up Management"
        subtitle="Schedule and manage touchpoints with leads and clients."
        actions={
          <>
            <ActionButton onClick={handleExport} variant="secondary" icon={<Download className="w-4 h-4" />}>Export List</ActionButton>
            <ActionButton onClick={() => setIsDrawerOpen(true)} icon={<Plus className="w-4 h-4" />}>Schedule</ActionButton>
          </>
        }
      />

      {overdueCount > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <Calendar className="w-5 h-5 text-rose-600 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-rose-800">Overdue Follow-ups</h3>
            <p className="text-sm text-rose-700 mt-1">
              You have <b>{overdueCount}</b> overdue follow-up{overdueCount > 1 ? 's' : ''} that require immediate attention.
            </p>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col">
        <FilterBar>
          <SearchInput value={search} onChange={setSearch} placeholder="Search contacts or purpose..." />
          <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
          <SelectFilter
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { label: 'Pending', value: 'Pending' },
              { label: 'Completed', value: 'Completed' },
              { label: 'Overdue', value: 'Overdue' },
            ]}
            placeholder="All Status"
          />
        </FilterBar>

        <TableCard>
          <DataTable columns={columns} data={filteredData} emptyMessage="No follow-ups found. Click 'Schedule' to plan one." />
        </TableCard>
      </div>

      <Drawer open={isDrawerOpen} onClose={closeDrawer} title="Schedule Follow-Up">
        <form onSubmit={handleSave} className="flex flex-col h-full">
          <div className="space-y-4 flex-1">

            <div className="relative">
              <label className="block text-sm font-medium text-slate-700 mb-1">Select Lead *</label>
              <div 
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus-within:ring-2 focus-within:ring-violet-500 bg-white cursor-pointer flex justify-between items-center"
                onClick={() => setIsLeadDropdownOpen(!isLeadDropdownOpen)}
              >
                <span className={formData.leadId ? 'text-slate-900' : 'text-slate-400'}>
                  {formData.leadId ? (leads.find(l => l.id === formData.leadId)?.name || 'Unknown Lead') : '-- Select a Lead --'}
                </span>
                <span className="text-slate-400 text-xs">▼</span>
              </div>
              
              {isLeadDropdownOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  <div className="p-2 border-b border-slate-100 sticky top-0 bg-white">
                    <input
                      type="text"
                      className="w-full px-3 py-1.5 border border-slate-200 rounded text-sm focus:outline-none focus:border-violet-500"
                      placeholder="Search name, ID, territory..."
                      value={leadSearchQuery}
                      onChange={(e) => setLeadSearchQuery(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <ul className="py-1">
                    {filteredLeads.length > 0 ? (
                      filteredLeads.map(lead => (
                        <li 
                          key={lead.id}
                          className={`px-3 py-2 hover:bg-slate-50 cursor-pointer text-sm ${formData.leadId === lead.id ? 'bg-violet-50 text-violet-700' : 'text-slate-700'}`}
                          onClick={() => {
                            setFormData({ ...formData, leadId: lead.id });
                            setIsLeadDropdownOpen(false);
                            setLeadSearchQuery('');
                          }}
                        >
                          <div className="font-medium">{lead.name}</div>
                          <div className="text-xs text-slate-500 flex gap-2">
                            <span>{lead.leadCode || lead.id}</span>
                            {lead.territory && <span>• {lead.territory}</span>}
                            {lead.contact && <span>• {lead.contact}</span>}
                          </div>
                        </li>
                      ))
                    ) : (
                      <li className="px-3 py-3 text-sm text-slate-500 text-center">
                        {leads.length === 0 ? 'No leads available.' : 'No matching leads.'}
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Follow-up Type *</label>
              <select
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <option value="Call">Call</option>
                <option value="Visit">Visit</option>
                <option value="Meeting">Meeting</option>
                <option value="Email">Email</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Contact Method</label>
              <select
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                value={formData.method}
                onChange={(e) => setFormData({ ...formData, method: e.target.value })}
              >
                <option value="Phone Call">Phone Call</option>
                <option value="Email">Email</option>
                <option value="In-Person">In-Person</option>
                <option value="Video Call">Video Call</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Follow-up Date *</label>
              <input
                type="date"
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Next Follow-up Date *</label>
              <input
                type="date"
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                value={formData.nextFollowUpDate}
                onChange={(e) => setFormData({ ...formData, nextFollowUpDate: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Remarks *</label>
              <textarea
                rows={3}
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="What needs to be discussed?"
              />
            </div>

          </div>

          <div className="pt-4 border-t border-slate-100 mt-6 flex gap-3">
            <button
              type="button"
              onClick={closeDrawer}
              className="flex-1 bg-white border border-slate-200 text-slate-700 font-semibold py-2.5 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={leads.length === 0}
              className="flex-1 bg-[#163c78] text-white font-semibold py-2.5 rounded-lg hover:bg-[#112d59] transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
            >
              Save Follow-Up
            </button>
          </div>
        </form>
      </Drawer>
    </div>
  );
}
