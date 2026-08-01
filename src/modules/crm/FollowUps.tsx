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
import { followUpService } from '../../services/followUpService';
import { leadService } from '../../services/leadService';

interface Lead {
  id: string;
  name: string;
  contact: string;
}

interface FollowUp {
  id: string;
  leadId: string;
  contactName: string;
  type: string;
  method: string;
  date: string;
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
  const [formData, setFormData] = useState<Partial<FollowUp>>({
    leadId: '',
    type: 'Lead Check-in',
    method: 'Phone Call',
    date: '',
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load real leads from DB
      const apiLeads = await leadService.getAll();
      setLeads(apiLeads.map((l) => ({
        id: l.id,
        name: l.name,
        contact: l.mobile || l.email || '',
      })));

      // Load real follow-ups from DB
      const apiFollowUps = await followUpService.getAll();
      const todayStr = new Date().toISOString().split('T')[0];
      const mapped: FollowUp[] = apiFollowUps.map((f) => ({
        id: String(f.id),
        leadId: f.leadId?.toString() || '',
        contactName: f.title || f.contactName || '—',
        type: f.type || '—',
        method: f.method || '—',
        date: f.followUpDate || '',
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
    if (!formData.leadId || !formData.date) {
      alert('Please select a lead and a due date.');
      return;
    }
    const selectedLead = leads.find((l) => l.id === formData.leadId);
    if (!selectedLead) return;

    try {
      const mrId = Number(localStorage.getItem('mrId') || '1');
      await followUpService.create({
        mrId: mrId,
        leadId: Number(selectedLead.id),
        type: formData.type || 'Lead Check-in',
        method: formData.method || 'Phone Call',
        title: selectedLead.name,
        remarks: formData.notes?.trim() || '',
        followUpDate: formData.date,
      });

      const todayStr = new Date().toISOString().split('T')[0];
      const computedStatus: FollowUp['status'] = formData.date < todayStr ? 'Overdue' : 'Pending';
      const newRecord: FollowUp = {
        id: generateFollowUpId(followUps),
        leadId: selectedLead.id,
        contactName: selectedLead.name,
        type: formData.type || 'Lead Check-in',
        method: formData.method || 'Phone Call',
        date: formData.date,
        notes: formData.notes?.trim() || '',
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
    setFormData({ leadId: '', type: 'Lead Check-in', method: 'Phone Call', date: '', notes: '' });
  };

  const handleExport = () => {
    if (followUps.length === 0) return alert("No data to export!");
    const headers = ['FollowUp ID', 'Lead ID', 'Contact Name', 'Purpose', 'Method', 'Due Date', 'Status', 'Completed By', 'Completed Date', 'Notes'];
    const rows = followUps.map(f => [
      f.id, f.leadId, `"${f.contactName}"`, `"${f.type}"`, f.method, f.date, f.status,
      `"${f.completedBy || 'N/A'}"`, `"${f.completedDate || 'N/A'}"`, `"${f.notes || ''}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `CRM_FollowUps_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const columns: Column<FollowUp>[] = [
    { key: 'id', label: 'ID', render: (row) => <span className="text-xs font-mono text-slate-400">{row.id}</span> },
    { key: 'contactName', label: 'Contact Name', render: (row) => <span className="font-semibold text-slate-900">{row.contactName || '—'}</span> },
    { key: 'type', label: 'Purpose', render: (row) => <span>{row.type || '—'}</span> },
    { key: 'method', label: 'Method', render: (row) => <span className="text-slate-600">{row.method || '—'}</span> },
    {
      key: 'date',
      label: 'Due Date',
      render: (row) => {
        const d = new Date(row.date);
        const displayDate = isNaN(d.getTime()) ? row.date : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        return <span className={row.status === 'Overdue' ? 'text-rose-600 font-medium' : ''}>{displayDate}</span>;
      }
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const variant = row.status === 'Completed' ? 'success' : row.status === 'Overdue' ? 'danger' : 'warning';
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

  // ✅ Safe toLowerCase — prevents crash if any field is undefined
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

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Select Lead *</label>
              <select
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                value={formData.leadId}
                onChange={(e) => setFormData({ ...formData, leadId: e.target.value })}
              >
                <option value="" disabled>-- Select a Lead --</option>
                {leads.map(lead => (
                  <option key={lead.id} value={lead.id}>{lead.name} ({lead.id})</option>
                ))}
              </select>
              {leads.length === 0 && (
                <p className="text-xs text-rose-500 mt-1">No leads found in database. Create a lead first!</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Purpose / Type</label>
              <select
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <option value="Lead Check-in">Lead Check-in</option>
                <option value="Product Demo">Product Demo</option>
                <option value="Proposal Review">Proposal Review</option>
                <option value="Contract Renewal">Contract Renewal</option>
                <option value="General Catch-up">General Catch-up</option>
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
              <label className="block text-sm font-medium text-slate-700 mb-1">Due Date *</label>
              <input
                type="date"
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Notes / Remarks</label>
              <textarea
                rows={3}
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