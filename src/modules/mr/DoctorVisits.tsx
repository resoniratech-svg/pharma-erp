import { useState, useEffect } from 'react';
import { Plus, Download, Filter, MapPin, Trash2 } from 'lucide-react';
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

// ✅ Unified interface — matches React Native DoctorVisitScreen exactly
interface DoctorVisit {
  id: string;
  doctorName: string;
  specialty: string;
  clinic: string;
  mobile?: string;
  visitDate: string;
  visitTime: string;
  visitType: 'Routine Visit' | 'Follow Up' | 'New Doctor';
  doctorClass: 'A' | 'B' | 'C';
  productsDiscussed: string;
  samplesGiven: string;
  prescriptionPotential: 'High' | 'Medium' | 'Low';
  nextFollowUp: string;
  remarks?: string;
  status: 'Completed' | 'Scheduled' | 'Missed';
    latitude?: string;  
  longitude?: string;
}

export default function DoctorVisits() {
  const [visits, setVisits] = useState<DoctorVisit[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Form fields
  const [newDocName, setNewDocName] = useState('');
  const [newSpecialty, setNewSpecialty] = useState('');
  const [newClinic, setNewClinic] = useState('');
  const [newMobile, setNewMobile] = useState('');
  //const [newVisitDate, setNewVisitDate] = useState('');
  const [newVisitDate, setNewVisitDate] = useState(new Date().toISOString().split('T')[0]);
  const [newVisitTime, setNewVisitTime] = useState('');
  const [newVisitType, setNewVisitType] = useState<DoctorVisit['visitType']>('Routine Visit');
  const [newDoctorClass, setNewDoctorClass] = useState<DoctorVisit['doctorClass']>('B');
  const [newProductsDiscussed, setNewProductsDiscussed] = useState('');
  const [newSamplesGiven, setNewSamplesGiven] = useState('');
  const [newPrescriptionPotential, setNewPrescriptionPotential] = useState<DoctorVisit['prescriptionPotential']>('Medium');
  const [newNextFollowUp, setNewNextFollowUp] = useState('');
  const [newRemarks, setNewRemarks] = useState('');
  const [newStatus, setNewStatus] = useState<DoctorVisit['status']>('Scheduled');

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('web_doctor_visits');
      if (stored) {
        setVisits(JSON.parse(stored));
      } else {
        const initialMock: DoctorVisit[] = [
          {
            id: '1',
            doctorName: 'Dr. Ramesh Kumar',
            specialty: 'Cardiologist',
            clinic: 'Heart Care Center',
            mobile: '9876543210',
            visitDate: '2026-06-15',
            visitTime: '10:30',
            visitType: 'Routine Visit',
            doctorClass: 'A',
            productsDiscussed: 'Atorvastatin 40mg, Clopidogrel',
            samplesGiven: 'Atorvastatin 10 strips',
            prescriptionPotential: 'High',
            nextFollowUp: '2026-06-22',
            remarks: 'Doctor very interested in new cardiac trial data.',
            status: 'Completed',
          },
          {
            id: '2',
            doctorName: 'Dr. Sunita Sharma',
            specialty: 'Pediatrician',
            clinic: 'Kids Clinic',
            mobile: '9123456780',
            visitDate: '2026-06-16',
            visitTime: '12:00',
            visitType: 'Follow Up',
            doctorClass: 'B',
            productsDiscussed: 'Azithromycin Suspension',
            samplesGiven: '5 bottles',
            prescriptionPotential: 'Medium',
            nextFollowUp: '2026-06-23',
            remarks: 'Need to supply pediatric samples next week.',
            status: 'Scheduled',
          },
        ];
        setVisits(initialMock);
        localStorage.setItem('web_doctor_visits', JSON.stringify(initialMock));
      }
    } catch (error) {
      console.error('Failed to load doctor visits:', error);
    }
  }, []);

  const saveVisits = (updatedList: DoctorVisit[]) => {
    setVisits(updatedList);
    localStorage.setItem('web_doctor_visits', JSON.stringify(updatedList));
  };

  // const handleAddVisit = () => {
  //   if (!newDocName.trim()) { alert('Doctor Name is required.'); return; }
  //   if (!newClinic.trim()) { alert('Clinic / Hospital is required.'); return; }
  //   if (!newVisitDate) { alert('Visit Date is required.'); return; }
  //   if (newMobile && newMobile.length !== 10) {
  //     alert('Mobile number must be exactly 10 digits.');
  //     return;
  //   }

  //   const newVisit: DoctorVisit = {
  //     id: Date.now().toString(),
  //     doctorName: newDocName,
  //     specialty: newSpecialty || 'General Practitioner',
  //     clinic: newClinic,
  //     mobile: newMobile,
  //     visitDate: newVisitDate,
  //     visitTime: newVisitTime,
  //     visitType: newVisitType,
  //     doctorClass: newDoctorClass,
  //     productsDiscussed: newProductsDiscussed,
  //     samplesGiven: newSamplesGiven,
  //     prescriptionPotential: newPrescriptionPotential,
  //     nextFollowUp: newNextFollowUp,
  //     remarks: newRemarks,
  //     status: newStatus,
  //   };

  //   saveVisits([newVisit, ...visits]);
  //   setIsDrawerOpen(false);

  //   // Reset form
  //   setNewDocName('');
  //   setNewSpecialty('');
  //   setNewClinic('');
  //   setNewMobile('');
  //   setNewVisitDate('');
  //   setNewVisitTime('');
  //   setNewVisitType('Routine Visit');
  //   setNewDoctorClass('B');
  //   setNewProductsDiscussed('');
  //   setNewSamplesGiven('');
  //   setNewPrescriptionPotential('Medium');
  //   setNewNextFollowUp('');
  //   setNewRemarks('');
  //   setNewStatus('Scheduled');
  // };
  // const handleAddVisit = () => {
  //   if (!newDocName.trim()) { alert('Doctor Name is required.'); return; }
  //   if (!newClinic.trim()) { alert('Clinic / Hospital is required.'); return; }
  //   if (!newVisitDate) { alert('Visit Date is required.'); return; }
  //   if (newMobile && newMobile.length !== 10) {
  //     alert('Mobile number must be exactly 10 digits.');
  //     return;
  //   }
  const handleAddVisit = () => {
    const nameRegex = /^[a-zA-Z\s.-]+$/;

    if (!newDocName.trim() || newDocName.trim().length < 3) { 
      alert('Doctor Name must be at least 3 characters long.'); 
      return; 
    }
    if (!nameRegex.test(newDocName.trim())) {
      alert('Doctor Name cannot contain numbers or special characters.');
      return;
    }
    if (!newClinic.trim() || newClinic.trim().length < 3) { 
      alert('Clinic / Hospital name must be at least 3 characters long.'); 
      return; 
    }
    if (!newVisitDate) { 
      alert('Visit Date is required.'); 
      return; 
    }

    // NEW: Prevent Past or Future Dates (Only Today Allowed)
    const todayDate = new Date().toISOString().split('T')[0];
    if (newVisitDate !== todayDate) {
      alert(`Visits can only be logged for today (${todayDate}). Back-dated or future visits are not allowed.`);
      return;
    }

    // NEW: Prevent Future Times for completed visits
    if (newVisitTime) {
      const now = new Date();
      const currentTimeString = now.toTimeString().slice(0, 5); // Gets "HH:MM"
      if (newStatus === 'Completed' && newVisitTime > currentTimeString) {
        alert('You cannot log a completed visit with a time in the future!');
        return;
      }
    }

    if (newMobile && newMobile.length !== 10) {
      alert('Mobile number must be exactly 10 digits.');
      return;
    }

    // Capture GPS before saving
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          saveNewVisit(position.coords.latitude.toString(), position.coords.longitude.toString());
        },
        (error) => {
          console.warn("GPS failed", error);
          saveNewVisit('Unavailable', 'Unavailable'); 
        }
      );
    } else {
      saveNewVisit('Not Supported', 'Not Supported');
    }
  };
  // Helper function to actually save the data
  const saveNewVisit = (lat: string, lng: string) => {
    const newVisit: DoctorVisit = {
      id: Date.now().toString(),
      doctorName: newDocName,
      specialty: newSpecialty || 'General Practitioner',
      clinic: newClinic,
      mobile: newMobile,
      visitDate: newVisitDate,
      visitTime: newVisitTime,
      visitType: newVisitType,
      doctorClass: newDoctorClass,
      productsDiscussed: newProductsDiscussed,
      samplesGiven: newSamplesGiven,
      prescriptionPotential: newPrescriptionPotential,
      nextFollowUp: newNextFollowUp,
      remarks: newRemarks,
      status: newStatus,
      latitude: lat,   // <-- Saved from GPS
      longitude: lng,  // <-- Saved from GPS
    };

    saveVisits([newVisit, ...visits]);
    setIsDrawerOpen(false);
    alert('✅ Doctor Visit saved successfully!');

    // Reset forms
    // setNewDocName(''); setNewSpecialty(''); setNewClinic('');
    // setNewMobile(''); setNewVisitDate(''); setNewVisitTime('');
        // Reset forms
    setNewDocName(''); setNewSpecialty(''); setNewClinic('');
    setNewMobile(''); setNewVisitDate(new Date().toISOString().split('T')[0]); setNewVisitTime('');
    setNewVisitType('Routine Visit'); setNewDoctorClass('B');
    setNewProductsDiscussed(''); setNewSamplesGiven('');
    setNewPrescriptionPotential('Medium'); setNewNextFollowUp('');
    setNewRemarks(''); setNewStatus('Scheduled');
  };


  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this visit record?')) {
      saveVisits(visits.filter((v) => v.id !== id));
    }
  };

  // Export to CSV
  const handleExport = () => {
    if (visits.length === 0) {
      alert('No data to export.');
      return;
    }

    const headers = [
      'Doctor Name', 'Specialty', 'Clinic / Hospital', 'Mobile',
      'Visit Date', 'Visit Time', 'Visit Type', 'Doctor Class',
      'Products Discussed', 'Samples Given', 'Rx Potential',
      'Next Follow-Up', 'Remarks', 'Status',
    ];

    const rows = visits.map((v) => [
      v.doctorName, v.specialty, v.clinic, v.mobile || '',
      v.visitDate, v.visitTime || '', v.visitType, `Class ${v.doctorClass}`,
      v.productsDiscussed, v.samplesGiven, v.prescriptionPotential,
      v.nextFollowUp || '', v.remarks || '', v.status,
    ]);

    const csvContent =
      [headers, ...rows]
        .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `doctor_visits_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const columns: Column<DoctorVisit>[] = [
    {
      key: 'doctorName',
      label: 'Doctor Name',
      render: (row) => (
        <div>
          <span className="font-semibold text-slate-900">{row.doctorName}</span>
          <span className="ml-2 text-xs font-bold px-1.5 py-0.5 rounded bg-violet-100 text-violet-700">
            Class {row.doctorClass}
          </span>
        </div>
      ),
    },
    {
      key: 'specialty',
      label: 'Specialty',
      render: (row) => <span className="text-slate-600">{row.specialty}</span>,
    },
    { key: 'clinic', label: 'Clinic / Hospital' },
    {
      key: 'visitDate',
      label: 'Visit Date & Time',
      render: (row) => (
        <div className="text-sm">
          <div className="text-slate-700">{row.visitDate}</div>
          {row.visitTime && <div className="text-xs text-slate-400">{row.visitTime}</div>}
        </div>
      ),
    },
    {
      key: 'visitType',
      label: 'Visit Type',
      render: (row) => <span className="text-xs text-slate-600">{row.visitType}</span>,
    },
    {
      key: 'productsDiscussed',
      label: 'Products Discussed',
      render: (row) => (
        <span className="text-xs text-slate-500 max-w-[150px] truncate block" title={row.productsDiscussed}>
          {row.productsDiscussed || '—'}
        </span>
      ),
    },
    {
      key: 'samplesGiven',
      label: 'Samples Given',
      render: (row) => (
        <span className="text-xs text-slate-500 max-w-[120px] truncate block" title={row.samplesGiven}>
          {row.samplesGiven || '—'}
        </span>
      ),
    },
    {
      key: 'prescriptionPotential',
      label: 'Rx Potential',
      render: (row) => {
        const color = row.prescriptionPotential === 'High' ? 'text-emerald-600'
          : row.prescriptionPotential === 'Medium' ? 'text-amber-600' : 'text-rose-500';
        return <span className={`text-sm font-semibold ${color}`}>{row.prescriptionPotential}</span>;
      },
    },
    {
      key: 'nextFollowUp',
      label: 'Next Follow-Up',
      render: (row) => <span className="text-xs text-slate-500">{row.nextFollowUp || '—'}</span>,
    },
    {
      key: 'remarks',
      label: 'Remarks',
      render: (row) => (
        <span className="text-xs text-slate-500 max-w-[150px] truncate block" title={row.remarks}>
          {row.remarks || '—'}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const variant = row.status === 'Completed' ? 'success'
          : row.status === 'Scheduled' ? 'info' : 'danger';
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    },
    {
      key: 'action',
      label: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2">
          <button title="Map Check-In Location" className="text-violet-600 hover:text-violet-700 hover:bg-violet-50 p-1.5 rounded-lg transition-colors">
            <MapPin className="w-4 h-4" />
          </button>
          <button title="Delete record" onClick={() => handleDelete(row.id)} className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 p-1.5 rounded-lg transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const filteredData = visits.filter((item) => {
    const matchSearch =
      item.doctorName.toLowerCase().includes(search.toLowerCase()) ||
      item.clinic.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Doctor Visit Entry"
        subtitle="Manage and track scheduled calls and visits to healthcare professionals."
        actions={
          <>
            <ActionButton variant="secondary" icon={<Download className="w-4 h-4" />} onClick={handleExport}>
              Export Log
            </ActionButton>
            <ActionButton onClick={() => setIsDrawerOpen(true)} icon={<Plus className="w-4 h-4" />}>
              Log Visit
            </ActionButton>
          </>
        }
      />

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search doctor or clinic..." />
        <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-600">Filters:</span>
        </div>
        <SelectFilter
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { label: 'Completed', value: 'Completed' },
            { label: 'Scheduled', value: 'Scheduled' },
            { label: 'Missed', value: 'Missed' },
          ]}
          placeholder="All Status"
        />
      </FilterBar>

      <TableCard>
        <DataTable columns={columns} data={filteredData} emptyMessage="No visits found." />
      </TableCard>

      {/* Drawer Form */}
      <Drawer open={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} title="Log New Doctor Visit">
        <form onSubmit={(e) => e.preventDefault()} className="space-y-4">

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Doctor Name *</label>
            <input type="text" value={newDocName} onChange={(e) => setNewDocName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-violet-500"
              placeholder="e.g. Dr. Satish Roy" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Specialty</label>
            <input type="text" value={newSpecialty} onChange={(e) => setNewSpecialty(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-violet-500"
              placeholder="e.g. Cardiologist" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Clinic / Hospital Name *</label>
            <input type="text" value={newClinic} onChange={(e) => setNewClinic(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-violet-500"
              placeholder="e.g. City General Hospital" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Mobile Number <span className="text-slate-400 font-normal text-xs">(10 digits)</span></label>
            <input type="tel" value={newMobile}
              onChange={(e) => setNewMobile(e.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-violet-500"
              placeholder="e.g. 9876543210" maxLength={10} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Visit Date *</label>
              <input type="date" value={newVisitDate} onChange={(e) => setNewVisitDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-violet-500" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Visit Time</label>
              <input type="time" value={newVisitTime} onChange={(e) => setNewVisitTime(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-violet-500" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Visit Type</label>
              <select value={newVisitType} onChange={(e) => setNewVisitType(e.target.value as DoctorVisit['visitType'])}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:border-violet-500">
                <option value="Routine Visit">Routine Visit</option>
                <option value="Follow Up">Follow Up</option>
                <option value="New Doctor">New Doctor</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Doctor Class</label>
              <select value={newDoctorClass} onChange={(e) => setNewDoctorClass(e.target.value as DoctorVisit['doctorClass'])}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:border-violet-500">
                <option value="A">Class A — High Prescriber</option>
                <option value="B">Class B — Medium Prescriber</option>
                <option value="C">Class C — Low Prescriber</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Products Discussed</label>
            <input type="text" value={newProductsDiscussed} onChange={(e) => setNewProductsDiscussed(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-violet-500"
              placeholder="e.g. Atorvastatin 40mg, Metformin 500mg" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Samples Given</label>
            <input type="text" value={newSamplesGiven} onChange={(e) => setNewSamplesGiven(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-violet-500"
              placeholder="e.g. 10 strips Atorvastatin" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Rx Potential</label>
              <select value={newPrescriptionPotential} onChange={(e) => setNewPrescriptionPotential(e.target.value as DoctorVisit['prescriptionPotential'])}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:border-violet-500">
                <option value="High">🟢 High</option>
                <option value="Medium">🟡 Medium</option>
                <option value="Low">🔴 Low</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Next Follow-Up</label>
              <input type="date" value={newNextFollowUp} onChange={(e) => setNewNextFollowUp(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-violet-500" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Remarks / Meeting Notes</label>
            <textarea value={newRemarks} onChange={(e) => setNewRemarks(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-violet-500 min-h-[70px] resize-none"
              placeholder="Any extra notes about the visit..." />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Status</label>
            <select value={newStatus} onChange={(e) => setNewStatus(e.target.value as DoctorVisit['status'])}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:border-violet-500">
              <option value="Scheduled">Scheduled</option>
              <option value="Completed">Completed</option>
              <option value="Missed">Missed</option>
            </select>
          </div>

          <div className="pt-4 flex gap-3">
            <ActionButton onClick={handleAddVisit} className="flex-1 justify-center">Save Visit</ActionButton>
            <ActionButton variant="secondary" onClick={() => setIsDrawerOpen(false)} className="flex-1 justify-center">Cancel</ActionButton>
          </div>

        </form>
      </Drawer>
    </div>
  );
}