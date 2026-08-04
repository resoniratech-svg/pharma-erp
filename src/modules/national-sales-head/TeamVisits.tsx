import React, { useState } from 'react';
import { PageHeader, SearchInput, TableCard, DataTable, Badge, ActionButton, SummaryCard } from './components/shared';
import { Download, Eye, Calendar, MapPin, Clock, Activity, CheckCircle, ShieldCheck } from 'lucide-react';
import { exportToCSV } from '../../utils/exportUtils';
import { Modal } from '../../components/ui/Modal';

const MOCK_VISITS_DATA = [
  {
    visitId: 'VST-2026-0801',
    date: '2026-08-01',
    rsmName: 'Arun Kumar',
    asmName: 'Vikas Sharma',
    mrName: 'Rahul Verma',
    state: 'Maharashtra',
    region: 'West',
    type: 'Doctor Visit',
    customerName: 'Dr. Suresh Patel',
    territory: 'Mumbai Central',
    checkIn: '10:00 AM',
    checkOut: '10:45 AM',
    duration: '45 mins',
    status: 'Completed',
    gpsAddress: '123 Health Clinic, Andheri West, Mumbai',
    gpsCoords: '19.1136° N, 72.8697° E',
    remarks: 'Discussed new cardiology range. Positive response.',
    orderBooked: 'Yes',
    products: 'CardioMax 10mg (50 boxes)',
    followUp: '2026-08-15',
    outcome: 'Successful'
  },
  {
    visitId: 'VST-2026-0802',
    date: '2026-08-01',
    rsmName: 'Rajesh Singh',
    asmName: 'Amit Desai',
    mrName: 'Sneha Patel',
    state: 'Gujarat',
    region: 'West',
    type: 'Chemist Visit',
    customerName: 'Apollo Pharmacy',
    territory: 'Ahmedabad East',
    checkIn: '11:30 AM',
    checkOut: '12:00 PM',
    duration: '30 mins',
    status: 'Completed',
    gpsAddress: '45 MG Road, Ahmedabad',
    gpsCoords: '23.0225° N, 72.5714° E',
    remarks: 'Stock checked. Placed replenishment order.',
    orderBooked: 'Yes',
    products: 'Paracetamol 650mg, Cough Syrup',
    followUp: '2026-08-10',
    outcome: 'Successful'
  },
  {
    visitId: 'VST-2026-0803',
    date: '2026-08-02',
    rsmName: 'Priya Sharma',
    asmName: 'Kiran Rao',
    mrName: 'Vivek Shetty',
    state: 'Karnataka',
    region: 'South',
    type: 'Joint Field Work',
    customerName: 'Dr. Anil Kumar',
    territory: 'Bangalore South',
    checkIn: '-',
    checkOut: '-',
    duration: '-',
    status: 'Planned',
    gpsAddress: '-',
    gpsCoords: '-',
    remarks: 'Scheduled to introduce new pediatric line.',
    orderBooked: 'No',
    products: '-',
    followUp: '-',
    outcome: 'Pending'
  },
  {
    visitId: 'VST-2026-0804',
    date: '2026-08-02',
    rsmName: 'Arun Kumar',
    asmName: 'Vikas Sharma',
    mrName: 'Rahul Verma',
    state: 'Maharashtra',
    region: 'West',
    type: 'Chemist Visit',
    customerName: 'LifeCare Pharmacy',
    territory: 'Andheri West',
    checkIn: '14:00 PM',
    checkOut: '14:20 PM',
    duration: '20 mins',
    status: 'Completed',
    gpsAddress: 'Opposite Metro Station, Andheri West, Mumbai',
    gpsCoords: '19.1197° N, 72.8464° E',
    remarks: 'Collected payment for last invoice. No new orders.',
    orderBooked: 'No',
    products: '-',
    followUp: '2026-08-20',
    outcome: 'Follow-up Required'
  }
];

export default function TeamVisits() {
  const [search, setSearch] = useState('');
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<any>(null);

  const [filters, setFilters] = useState({
    financialYear: '2026-27',
    planningPeriod: 'Monthly',
    state: 'All',
    rsm: 'All'
  });

  const filteredData = MOCK_VISITS_DATA.filter(row => {
    const matchesSearch = search === '' || 
      row.rsmName.toLowerCase().includes(search.toLowerCase()) ||
      row.customerName.toLowerCase().includes(search.toLowerCase()) ||
      row.territory.toLowerCase().includes(search.toLowerCase());
      
    const matchesState = filters.state === 'All' || row.state === filters.state;
    const matchesRsm = filters.rsm === 'All' || row.rsmName === filters.rsm;

    return matchesSearch && matchesState && matchesRsm;
  });

  const calculateStatus = (status: string) => {
    switch (status) {
      case 'Completed': return { label: 'Completed', color: 'success' };
      case 'Planned': return { label: 'Planned', color: 'warning' };
      default: return { label: status, color: 'neutral' };
    }
  };

  const totalVisits = filteredData.length;
  const completedVisits = filteredData.filter(v => v.status === 'Completed').length;
  const pendingVisits = filteredData.filter(v => v.status === 'Planned').length;
  const compliancePct = totalVisits > 0 ? ((completedVisits / totalVisits) * 100).toFixed(1) : '0.0';

  const openViewModal = (visit: any) => {
    setSelectedVisit(visit);
    setIsViewModalOpen(true);
  };

  const columns = [
    { key: 'date', label: 'Visit Date', render: (row: any) => <span className="font-medium text-slate-700">{row.date}</span> },
    { key: 'rsmName', label: 'RSM Name', render: (row: any) => <span className="font-semibold text-slate-800">{row.rsmName}</span> },
    { key: 'state', label: 'State' },
    { key: 'type', label: 'Visit Type' },
    { key: 'customerName', label: 'Doctor / Chemist Name', render: (row: any) => <span className="font-medium text-[#163c78]">{row.customerName}</span> },
    { key: 'territory', label: 'Territory / HQ' },
    { key: 'checkIn', label: 'Check-In' },
    { key: 'checkOut', label: 'Check-Out' },
    { key: 'duration', label: 'Duration' },
    {
      key: 'status',
      label: 'Visit Status',
      render: (row: any) => {
        const s = calculateStatus(row.status);
        return <Badge variant={s.color as any}>{s.label}</Badge>;
      }
    },
    {
      key: 'actions',
      label: 'Action',
      render: (row: any) => (
        <button 
          onClick={() => openViewModal(row)}
          className="p-1.5 text-slate-400 hover:text-[#163c78] hover:bg-blue-50 rounded transition-colors" 
          title="View Visit Details"
        >
          <Eye className="w-4 h-4" />
        </button>
      )
    }
  ];

  return (
    <div className="p-6">
      <PageHeader 
        title="Team Visits" 
        subtitle="Executive dashboard for monitoring field activities and joint visits."
      />

      {/* Production Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 space-y-4">
        <div className="flex flex-wrap gap-4 items-center">
          <select 
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#163c78] bg-white flex-1 min-w-[130px]"
            value={filters.planningPeriod}
            onChange={(e) => setFilters({...filters, planningPeriod: e.target.value})}
          >
            <option value="Annual">Annual</option>
            <option value="Quarterly">Quarterly</option>
            <option value="Monthly">Monthly</option>
          </select>
          
          <select 
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#163c78] bg-white flex-1 min-w-[130px]"
            value={filters.state}
            onChange={(e) => setFilters({...filters, state: e.target.value})}
          >
            <option value="All">All States</option>
            <option value="Maharashtra">Maharashtra</option>
            <option value="Gujarat">Gujarat</option>
            <option value="Karnataka">Karnataka</option>
          </select>
          <div className="flex-[2] min-w-[200px]">
            <SearchInput value={search} onChange={setSearch} placeholder="Search by RSM, Doctor, Chemist, Territory..." />
          </div>
          
          <ActionButton variant="secondary" icon={<Download className="w-4 h-4" />} onClick={() => exportToCSV(filteredData, columns as any, 'Team_Visits.csv')}>
            Export
          </ActionButton>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <SummaryCard
          title="Total Visits"
          value={totalVisits.toString()}
          icon={<Calendar className="w-6 h-6" />}
          colorClass="text-blue-600"
          bgClass="bg-blue-50"
        />
        <SummaryCard
          title="Completed Visits"
          value={completedVisits.toString()}
          icon={<CheckCircle className="w-6 h-6" />}
          colorClass="text-emerald-600"
          bgClass="bg-emerald-50"
        />
        <SummaryCard
          title="Pending Visits"
          value={pendingVisits.toString()}
          icon={<Clock className="w-6 h-6" />}
          colorClass="text-amber-600"
          bgClass="bg-amber-50"
        />
        <SummaryCard
          title="Visit Compliance %"
          value={`${compliancePct}%`}
          icon={<ShieldCheck className="w-6 h-6" />}
          colorClass="text-purple-600"
          bgClass="bg-purple-50"
        />
      </div>

      <TableCard>
        <DataTable columns={columns} data={filteredData} emptyMessage="No field visits found matching your criteria." />
      </TableCard>

      {/* View Details Modal */}
      {selectedVisit && (
        <Modal
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          title={`Visit Details: ${selectedVisit.visitId}`}
          className="max-w-4xl w-full"
        >
          <div className="space-y-6">
            {/* Header Metrics */}
            <div className="flex justify-between items-center bg-slate-50 p-6 rounded-xl border border-slate-200">
              <div>
                <span className="block text-sm font-semibold text-slate-500 mb-1">Date: {selectedVisit.date}</span>
                <span className="text-xl font-bold text-[#163c78]">{selectedVisit.type}</span>
              </div>
              <div className="text-right">
                <span className="block text-sm font-semibold text-slate-500 mb-1">Status</span>
                <Badge variant={calculateStatus(selectedVisit.status).color as any}>
                  {calculateStatus(selectedVisit.status).label}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Employee Information */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Employee Information</h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-600">RSM</span>
                    <span className="text-sm font-bold text-slate-800">{selectedVisit.rsmName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-600">ASM</span>
                    <span className="text-sm font-bold text-slate-800">{selectedVisit.asmName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-600">MR</span>
                    <span className="text-sm font-bold text-slate-800">{selectedVisit.mrName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-600">State</span>
                    <span className="text-sm font-bold text-slate-800">{selectedVisit.state}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-600">Region</span>
                    <span className="text-sm font-bold text-slate-800">{selectedVisit.region}</span>
                  </div>
                </div>
              </div>

              {/* Customer Information */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Customer Information</h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-600">Name</span>
                    <span className="text-sm font-bold text-[#163c78]">{selectedVisit.customerName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-600">Territory / HQ</span>
                    <span className="text-sm font-bold text-slate-800">{selectedVisit.territory}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-600">Visit Type</span>
                    <span className="text-sm font-bold text-slate-800">{selectedVisit.type}</span>
                  </div>
                </div>
              </div>

              {/* GPS Information */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">GPS Information</h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-600">Check-In Time</span>
                    <span className="text-sm font-bold text-slate-800">{selectedVisit.checkIn}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-600">Check-Out Time</span>
                    <span className="text-sm font-bold text-slate-800">{selectedVisit.checkOut}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-600">Duration</span>
                    <span className="text-sm font-bold text-purple-600">{selectedVisit.duration}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-medium text-slate-500 mb-1">GPS Address</span>
                    <span className="text-sm font-semibold text-slate-800">{selectedVisit.gpsAddress}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-medium text-slate-500 mb-1">Coordinates</span>
                    <span className="text-sm font-mono text-slate-600">{selectedVisit.gpsCoords}</span>
                  </div>
                </div>
              </div>

              {/* Visit Summary */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Visit Summary</h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-600">Order Booked</span>
                    <span className={`text-sm font-bold ${selectedVisit.orderBooked === 'Yes' ? 'text-emerald-600' : 'text-slate-600'}`}>
                      {selectedVisit.orderBooked}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-600">Visit Outcome</span>
                    <span className="text-sm font-bold text-slate-800">{selectedVisit.outcome}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-600">Follow-up Date</span>
                    <span className="text-sm font-bold text-[#163c78]">{selectedVisit.followUp}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-medium text-slate-500 mb-1">Products Discussed/Ordered</span>
                    <span className="text-sm font-semibold text-slate-800">{selectedVisit.products}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-medium text-slate-500 mb-1">Remarks</span>
                    <p className="text-sm text-slate-700 italic border-l-2 border-slate-200 pl-3 py-1">
                      "{selectedVisit.remarks}"
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <ActionButton variant="secondary" onClick={() => setIsViewModalOpen(false)}>Close Summary</ActionButton>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
