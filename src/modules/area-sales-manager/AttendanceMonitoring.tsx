import React, { useState, useEffect } from 'react';
import { PageHeader, FilterBar, SearchInput, SelectFilter, TableCard, DataTable, Badge, ActionButton, DrawerField } from './components/shared';
import { Eye, AlertCircle } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { asmService } from '../../services/asmService';

export default function AttendanceMonitoring() {
  const [attendance, setAttendance] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  useEffect(() => {
    try {
      setAttendance(asmService.getPendingAttendanceExceptions());
    } catch (e) {
      console.warn("Failed to load attendance", e);
    }
  }, []);
  
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);

  const filteredData = attendance.filter(row => 
    (row.mr.toLowerCase().includes(search.toLowerCase())) &&
    (statusFilter ? row.status === statusFilter : true)
  );

  const handleView = (row: any) => {
    setSelectedRecord(row);
    setViewModalOpen(true);
  };

  const columns = [
    { key: 'date', label: 'Date' },
    { key: 'mr', label: 'Medical Representative', render: (row: any) => <span className="font-bold text-slate-800">{row.mr}</span> },
    { key: 'checkIn', label: 'Check-in', render: (row: any) => <span className="text-slate-600 font-medium">{row.checkIn}</span> },
    { key: 'checkOut', label: 'Check-out', render: (row: any) => <span className="text-slate-600 font-medium">{row.checkOut}</span> },
    { key: 'workingHours', label: 'Working Hours', render: (row: any) => <span className="font-semibold text-[#163c78]">{row.workingHours}</span> },
    { 
      key: 'status', 
      label: 'Attendance Status',
      render: (row: any) => {
        let variant: any = 'neutral';
        if (row.status === 'Present') variant = 'success';
        if (row.status === 'Late') variant = 'warning';
        if (row.status === 'Absent') variant = 'danger';
        return <Badge variant={variant}>{row.status}</Badge>;
      }
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row: any) => (
        <div className="flex gap-2">
          <button onClick={() => handleView(row)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="View Attendance">
            <Eye className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="p-6">
      <PageHeader 
        title="Attendance Monitoring" 
        subtitle="Monitor daily attendance and working hours of Medical Representatives."
      />

      <div className="mb-6 bg-blue-50/50 border border-blue-200 rounded-xl p-4 flex gap-3">
        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
        <div>
          <h4 className="text-sm font-semibold text-blue-800">Awaiting MR Execution Data</h4>
          <p className="text-sm text-blue-600 mt-1">
            Attendance monitoring is deferred until the Medical Representative execution modules are implemented.
          </p>
        </div>
      </div>

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search by MR name..." />
        <SelectFilter 
          value={statusFilter} 
          onChange={setStatusFilter} 
          placeholder="All Statuses"
          options={[
            { label: 'Present', value: 'Present' },
            { label: 'Late', value: 'Late' },
            { label: 'Absent', value: 'Absent' }
          ]}
        />
      </FilterBar>

      <TableCard>
        <DataTable columns={columns} data={filteredData} emptyMessage="No attendance records available." />
      </TableCard>

      <Modal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        title="Attendance Details"
        footer={<ActionButton variant="secondary" onClick={() => setViewModalOpen(false)}>Close</ActionButton>}
      >
        {selectedRecord && (
          <div className="space-y-6">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 mb-4">Daily Record</h3>
              <div className="grid grid-cols-2 gap-4">
                <DrawerField label="Medical Representative" value={selectedRecord.mr} />
                <DrawerField label="Date" value={selectedRecord.date} />
                <DrawerField label="Check-in Time" value={selectedRecord.checkIn} />
                <DrawerField label="Check-out Time" value={selectedRecord.checkOut} />
                <DrawerField label="Total Working Hours" value={selectedRecord.workingHours} />
                <DrawerField label="Status" value={
                   <Badge variant={
                      selectedRecord.status === 'Present' ? 'success' : 
                      selectedRecord.status === 'Late' ? 'warning' : 'danger'
                   }>{selectedRecord.status}</Badge>
                } />
              </div>
            </div>
            
            <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 text-sm text-blue-700 text-center">
              This screen provides read-only monitoring of attendance records captured from the field.
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
