import React, { useState, useEffect } from 'react';
import { Plus, Download, Calendar, MapPin, X, Edit, Trash2, Clock, CheckCircle, XCircle } from 'lucide-react';
import {
  PageHeader,
  FilterBar,
  SearchInput,
  SelectFilter,
  ActionButton,
  TableCard,
  DataTable,
  Badge,
} from './components/shared';
import { type Column } from './components/shared';

interface TourPlan {
  id: string;
  planType: 'MTP' | 'WTP' | 'DTP';
  date: string;
  repName: string;
  hq: string;
  route: string;
  beat: string;
  startTime: string;
  endTime: string;
  objective: string;
  docCount: number;
  chemistCount: number;
  doctorsList: string;
  chemistsList: string;
  remarks: string;
  status: 'Draft' | 'Pending Approval' | 'Approved' | 'Rejected' | 'Completed';
}

export default function TourPlanning() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [plans, setPlans] = useState<TourPlan[]>([]);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [viewPlan, setViewPlan] = useState<TourPlan | null>(null);
  
  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [planType, setPlanType] = useState<'MTP' | 'WTP' | 'DTP'>('MTP');
  const [date, setDate] = useState('');
  const [hq, setHq] = useState('');
  const [route, setRoute] = useState('');
  const [beat, setBeat] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('18:00');
  const [objective, setObjective] = useState('Field Work');
  const [doctorsList, setDoctorsList] = useState('');
  const [chemistsList, setChemistsList] = useState('');
  const [remarks, setRemarks] = useState('');
  
  const [docCount, setDocCount] = useState(0);
  const [chemistCount, setChemistCount] = useState(0);

  useEffect(() => {
    const names = doctorsList.split(',').map(n => n.trim()).filter(n => n !== '');
    setDocCount(names.length);
  }, [doctorsList]);

  useEffect(() => {
    const names = chemistsList.split(',').map(n => n.trim()).filter(n => n !== '');
    setChemistCount(names.length);
  }, [chemistsList]);

  useEffect(() => {
    const stored = localStorage.getItem('@web_tour_plans');
    if (stored) {
      setPlans(JSON.parse(stored));
    } else {
      // Mock data if empty
      const initial: TourPlan[] = [
        { 
          id: '1', planType: 'MTP', date: '2026-10-01', repName: 'Rahul Verma', hq: 'Mumbai West', 
          route: 'Andheri', beat: 'Lokhandwala', docCount: 2, chemistCount: 1, 
          startTime: '09:00', endTime: '18:00', objective: 'Field Work',
          doctorsList: 'Dr. Ramesh, Dr. Kumar', chemistsList: 'Apollo Pharmacy', remarks: 'Standard route check.',
          status: 'Approved' 
        },
      ];
      setPlans(initial);
      localStorage.setItem('@web_tour_plans', JSON.stringify(initial));
    }
  }, []);

  const savePlans = (newPlans: TourPlan[]) => {
    setPlans(newPlans);
    localStorage.setItem('@web_tour_plans', JSON.stringify(newPlans));
  };

  const openForm = (plan?: TourPlan) => {
    if (plan) {
      setEditingId(plan.id);
      setPlanType(plan.planType);
      setDate(plan.date);
      setHq(plan.hq);
      setRoute(plan.route);
      setBeat(plan.beat);
      setStartTime(plan.startTime || '09:00');
      setEndTime(plan.endTime || '18:00');
      setObjective(plan.objective || 'Field Work');
      setDoctorsList(plan.doctorsList || '');
      setChemistsList(plan.chemistsList || '');
      setRemarks(plan.remarks || '');
    } else {
      setEditingId(null);
      setPlanType('MTP');
      setDate('');
      setHq('');
      setRoute('');
      setBeat('');
      setStartTime('09:00');
      setEndTime('18:00');
      setObjective('Field Work');
      setDoctorsList('');
      setChemistsList('');
      setRemarks('');
    }
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      savePlans(plans.map(p => p.id === editingId ? {
        ...p, planType, date, hq, route, beat, startTime, endTime, objective, docCount, chemistCount, doctorsList, chemistsList, remarks
      } : p));
    } else {
      const newPlan: TourPlan = {
        id: Date.now().toString(),
        planType,
        date,
        repName: 'Rahul Verma', // Mock logged in user
        hq,
        route,
        beat,
        startTime,
        endTime,
        objective,
        docCount,
        chemistCount,
        doctorsList,
        chemistsList,
        remarks,
        status: 'Draft'
      };
      savePlans([newPlan, ...plans]);
    }
    closeForm();
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this tour plan?')) {
      savePlans(plans.filter(p => p.id !== id));
      if (viewPlan?.id === id) setViewPlan(null);
    }
  };

  const handleStatusChange = (id: string, status: TourPlan['status']) => {
    savePlans(plans.map(p => p.id === id ? { ...p, status } : p));
  };

  const handleExport = () => {
    const headers = ['Type', 'Date', 'HQ', 'Route', 'Beat', 'Start Time', 'End Time', 'Objective', 'Planned Doctors', 'Planned Chemists', 'Status'];
    const csvContent = [
      headers.join(','),
      ...plans.map(p => [
        p.planType, p.date, `"${p.hq}"`, `"${p.route}"`, `"${p.beat}"`, p.startTime, p.endTime, `"${p.objective}"`, p.docCount, p.chemistCount, p.status
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Tour_Plans_Export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const totalPlans = plans.length;
  const approvedPlans = plans.filter(p => p.status === 'Approved').length;
  const pendingPlans = plans.filter(p => p.status === 'Pending Approval').length;
  const plannedCalls = plans.reduce((acc, p) => acc + p.docCount + p.chemistCount, 0);

  const columns: Column<TourPlan>[] = [
    { key: 'planType', label: 'Type', render: (row) => <span className="font-bold text-slate-800">{row.planType}</span> },
    { key: 'date', label: 'Tour Date', render: (row) => <span className="font-semibold text-slate-900">{row.date}</span> },
    { key: 'hq', label: 'HQ' },
    { key: 'route', label: 'Route' },
    { key: 'beat', label: 'Beat' },
    { key: 'docCount', label: 'Doctors', render: (row) => <span className="text-slate-600">{row.docCount}</span> },
    { key: 'chemistCount', label: 'Chemists', render: (row) => <span className="text-slate-600">{row.chemistCount}</span> },
    { key: 'totalCalls', label: 'Total Calls', render: (row) => <span className="text-slate-900 font-bold">{row.docCount + row.chemistCount}</span> },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        let variant: any = 'neutral';
        if (row.status === 'Approved') variant = 'success';
        if (row.status === 'Pending Approval') variant = 'warning';
        if (row.status === 'Rejected') variant = 'danger';
        if (row.status === 'Draft') variant = 'purple';
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    },
    {
      key: 'action',
      label: '',
      render: (row) => (
        <div className="flex items-center gap-2">
          {row.status === 'Draft' && (
            <button onClick={() => handleStatusChange(row.id, 'Pending Approval')} className="text-blue-600 hover:text-blue-800 p-1 bg-blue-50 rounded-md transition-colors" title="Submit for Approval"><CheckCircle className="w-4 h-4" /></button>
          )}
          {row.status === 'Pending Approval' && (
            <>
              <button onClick={() => handleStatusChange(row.id, 'Approved')} className="text-emerald-600 hover:text-emerald-800 p-1 bg-emerald-50 rounded-md transition-colors" title="Approve"><CheckCircle className="w-4 h-4" /></button>
              <button onClick={() => handleStatusChange(row.id, 'Rejected')} className="text-rose-600 hover:text-rose-800 p-1 bg-rose-50 rounded-md transition-colors" title="Reject"><XCircle className="w-4 h-4" /></button>
            </>
          )}
          <button onClick={() => setViewPlan(row)} className="text-violet-600 hover:text-violet-800 p-1 bg-violet-50 rounded-md transition-colors" title="View"><Calendar className="w-4 h-4" /></button>
          <button onClick={() => openForm(row)} className="text-slate-600 hover:text-slate-800 p-1 bg-slate-50 rounded-md transition-colors" title="Edit"><Edit className="w-4 h-4" /></button>
          <button onClick={() => handleDelete(row.id)} className="text-rose-600 hover:text-rose-800 p-1 bg-rose-50 rounded-md transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
        </div>
      )
    }
  ];

  const filteredData = plans.filter((item) => {
    const term = search.toLowerCase();
    const matchSearch = item.date.toLowerCase().includes(term) || 
                        item.hq.toLowerCase().includes(term) || 
                        item.route.toLowerCase().includes(term) ||
                        item.beat.toLowerCase().includes(term);
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Tour Planning"
        subtitle="Manage and submit monthly travel routes and daily patch assignments."
        actions={
          <>
            <ActionButton onClick={handleExport} variant="secondary" icon={<Download className="w-4 h-4" />}>Export MTP</ActionButton>
            <ActionButton onClick={() => openForm()} icon={<Plus className="w-4 h-4" />}>Create Plan</ActionButton>
          </>
        }
      />

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Total Plans</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{totalPlans}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-sm border-l-4 border-l-emerald-500">
          <p className="text-sm font-medium text-emerald-600">Approved Plans</p>
          <p className="text-2xl font-bold text-emerald-700 mt-1">{approvedPlans}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-amber-100 shadow-sm border-l-4 border-l-amber-500">
          <p className="text-sm font-medium text-amber-600">Pending Approval</p>
          <p className="text-2xl font-bold text-amber-700 mt-1">{pendingPlans}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-violet-100 shadow-sm border-l-4 border-l-violet-500">
          <p className="text-sm font-medium text-violet-600">Total Planned Calls</p>
          <p className="text-2xl font-bold text-violet-700 mt-1">{plannedCalls}</p>
        </div>
      </div>

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search Route, HQ, Date..." />
        <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
        <SelectFilter
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { label: 'Approved', value: 'Approved' },
            { label: 'Pending Approval', value: 'Pending Approval' },
            { label: 'Draft', value: 'Draft' },
            { label: 'Rejected', value: 'Rejected' },
          ]}
          placeholder="All Status"
        />
      </FilterBar>

      <TableCard>
        <DataTable
          columns={columns}
          data={filteredData}
          emptyMessage="No tour plans found."
        />
      </TableCard>

      {/* Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 flex-shrink-0">
              <h2 className="text-lg font-bold text-slate-800">{editingId ? 'Edit Tour Plan' : 'Create Tour Plan'}</h2>
              <button type="button" onClick={closeForm} className="text-slate-400 hover:text-slate-600 bg-white p-1.5 rounded-full shadow-sm"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Plan Type *</label>
                  <select value={planType} onChange={(e: any) => setPlanType(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-violet-500/30 outline-none">
                    <option value="MTP">MTP (Monthly)</option>
                    <option value="WTP">WTP (Weekly)</option>
                    <option value="DTP">DTP (Daily)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Tour Date *</label>
                  <input required type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-violet-500/30 outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Headquarters (HQ) *</label>
                <input required type="text" placeholder="e.g. Mumbai West" value={hq} onChange={(e) => setHq(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-violet-500/30 outline-none" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Route / Area Name *</label>
                  <input required type="text" placeholder="e.g. Andheri" value={route} onChange={(e) => setRoute(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-violet-500/30 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Beat / Sub-route *</label>
                  <input required type="text" placeholder="e.g. Lokhandwala" value={beat} onChange={(e) => setBeat(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-violet-500/30 outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Start Time *</label>
                  <input required type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-violet-500/30 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">End Time *</label>
                  <input required type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-violet-500/30 outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Objective / Purpose</label>
                <select value={objective} onChange={(e) => setObjective(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-violet-500/30 outline-none">
                  <option value="Field Work">Field Work</option>
                  <option value="Doctor Meeting">Doctor Meeting</option>
                  <option value="Payment Collection">Payment Collection</option>
                  <option value="Training">Training</option>
                  <option value="Leave">Leave</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Planned Doc Count (Auto)</label>
                  <div className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 font-bold">{docCount}</div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Planned Chemist Count (Auto)</label>
                  <div className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 font-bold">{chemistCount}</div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Planned Doctor Names (Comma separated) *</label>
                <input required type="text" placeholder="e.g. Dr. Ramesh, Dr. Kumar" value={doctorsList} onChange={(e) => setDoctorsList(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-violet-500/30 outline-none" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Planned Chemist Names (Comma separated) *</label>
                <input required type="text" placeholder="e.g. Apollo Pharmacy" value={chemistsList} onChange={(e) => setChemistsList(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-violet-500/30 outline-none" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Special Remarks</label>
                <textarea rows={2} placeholder="Enter itinerary details or comments..." value={remarks} onChange={(e) => setRemarks(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-violet-500/30 outline-none resize-none" />
              </div>

              <div className="pt-4 flex justify-end gap-3 sticky bottom-0 bg-white">
                <button type="button" onClick={closeForm} className="px-4 py-2 font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2 font-bold text-white bg-violet-600 hover:bg-violet-700 rounded-lg shadow-sm transition-colors">{editingId ? 'Update Plan' : 'Submit Tour Plan'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {viewPlan && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-violet-50 flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-violet-600" />
                </div>
                <h2 className="text-lg font-bold text-violet-900">Tour Details</h2>
              </div>
              <button onClick={() => setViewPlan(null)} className="text-violet-400 hover:text-violet-700 bg-white p-1.5 rounded-full shadow-sm"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="overflow-y-auto p-6 space-y-5">
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <span className="text-sm font-semibold text-slate-500">Status</span>
                <Badge variant={viewPlan.status === 'Approved' ? 'success' : viewPlan.status === 'Pending Approval' ? 'warning' : viewPlan.status === 'Rejected' ? 'danger' : 'purple'}>
                  {viewPlan.status}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-y-5 gap-x-4">
                <div>
                  <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Plan Type</span>
                  <span className="font-semibold text-slate-800">{viewPlan.planType}</span>
                </div>
                <div>
                  <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Tour Date</span>
                  <span className="font-semibold text-slate-800">{viewPlan.date}</span>
                </div>
                <div className="col-span-2">
                  <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Headquarters</span>
                  <span className="font-medium text-slate-700">{viewPlan.hq}</span>
                </div>
                <div>
                  <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Route / Area</span>
                  <span className="font-medium text-slate-700">{viewPlan.route}</span>
                </div>
                <div>
                  <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Beat / Sub-route</span>
                  <span className="font-medium text-slate-700">{viewPlan.beat}</span>
                </div>
                <div>
                  <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Start Time</span>
                  <span className="font-medium flex items-center text-slate-700"><Clock className="w-3 h-3 mr-1"/> {viewPlan.startTime}</span>
                </div>
                <div>
                  <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">End Time</span>
                  <span className="font-medium flex items-center text-slate-700"><Clock className="w-3 h-3 mr-1"/> {viewPlan.endTime}</span>
                </div>
                <div className="col-span-2">
                  <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Objective / Purpose</span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-sm font-medium"><CheckCircle className="w-3.5 h-3.5"/>{viewPlan.objective}</span>
                </div>
                
                <div className="col-span-2 bg-slate-50 p-4 rounded-xl space-y-3">
                  <div>
                    <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Planned Doctors ({viewPlan.docCount})</span>
                    <span className="font-medium text-slate-800">{viewPlan.doctorsList || 'None'}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Planned Chemists ({viewPlan.chemistCount})</span>
                    <span className="font-medium text-slate-800">{viewPlan.chemistsList || 'None'}</span>
                  </div>
                </div>

                {viewPlan.remarks && (
                  <div className="col-span-2">
                    <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Special Remarks</span>
                    <span className="text-sm text-slate-600 bg-amber-50 p-3 rounded-lg block border border-amber-100">{viewPlan.remarks}</span>
                  </div>
                )}

                <div className="col-span-2 bg-slate-800 p-3 rounded-lg flex justify-between items-center mt-2">
                  <span className="text-sm font-semibold text-slate-300">Total Planned Calls</span>
                  <span className="text-lg font-bold text-white">{viewPlan.docCount + viewPlan.chemistCount}</span>
                </div>

                {/* KPI Display for Approved/Completed Tours (DCR Actuals) */}
                {(viewPlan.status === 'Approved' || viewPlan.status === 'Completed') && (
                  <div className="col-span-2 bg-emerald-50 border border-emerald-100 p-4 rounded-xl space-y-3 mt-1">
                    <span className="block text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">Actual Field Execution (DCR)</span>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-emerald-700">Visited Doctors: <span className="font-bold text-emerald-900">{Math.max(0, viewPlan.docCount - 1)} / {viewPlan.docCount}</span></span>
                      <span className="text-sm font-semibold text-emerald-700">Visited Chemists: <span className="font-bold text-emerald-900">{viewPlan.chemistCount} / {viewPlan.chemistCount}</span></span>
                    </div>
                    <div className="w-full bg-emerald-200 rounded-full h-2">
                      <div className="bg-emerald-600 h-2 rounded-full" style={{ width: '85%' }}></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 flex-shrink-0">
              <button onClick={() => setViewPlan(null)} className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-colors">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
