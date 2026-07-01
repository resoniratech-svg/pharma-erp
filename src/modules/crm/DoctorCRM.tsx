// import { useState } from 'react';
// import { Plus, Stethoscope } from 'lucide-react';
// import {
//   PageHeader,
//   FilterBar,
//   SearchInput,
//   SelectFilter,
//   ActionButton,
//   TableCard,
//   DataTable,
//   Badge,
// } from './components/shared';
// import { type Column } from './components/shared';

// interface DoctorProfile {
//   id: string;
//   name: string;
//   specialty: string;
//   class: 'Class A' | 'Class B' | 'Class C';
//   hospital: string;
//   lastVisit: string;
// }

// const mockData: DoctorProfile[] = [
//   { id: '1', name: 'Dr. Arvind Rao', specialty: 'Cardiology', class: 'Class A', hospital: 'Apollo Hospitals', lastVisit: '20-Oct-2026' },
//   { id: '2', name: 'Dr. Sunita Sharma', specialty: 'Pediatrics', class: 'Class B', hospital: 'Kids Clinic', lastVisit: '15-Oct-2026' },
// ];

// export default function DoctorCRM() {
//   const [search, setSearch] = useState('');
//   const [classFilter, setClassFilter] = useState('');

//   const columns: Column<DoctorProfile>[] = [
//     { key: 'name', label: 'Doctor Name', render: (row) => <span className="font-semibold text-slate-900">{row.name}</span> },
//     { key: 'specialty', label: 'Specialty' },
//     { key: 'hospital', label: 'Primary Affiliation' },
//     {
//       key: 'class',
//       label: 'Classification',
//       render: (row) => {
//         const variant = row.class === 'Class A' ? 'purple' : row.class === 'Class B' ? 'info' : 'neutral';
//         return <Badge variant={variant}>{row.class}</Badge>;
//       },
//     },
//     { key: 'lastVisit', label: 'Last Visit Date' },
//     {
//       key: 'action',
//       label: '',
//       render: () => <ActionButton variant="ghost" className="text-violet-600 text-xs px-2 py-1"><Stethoscope className="w-4 h-4 mr-1" /> Profile</ActionButton>
//     }
//   ];

//   const filteredData = mockData.filter((item) => {
//     const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
//     const matchClass = classFilter ? item.class === classFilter : true;
//     return matchSearch && matchClass;
//   });

//   return (
//     <div className="animate-in fade-in duration-500">
//       <PageHeader
//         title="Doctor/Hospital CRM"
//         subtitle="Manage detailed profiles, classifications, and engagement history for Key Opinion Leaders (KOLs)."
//         actions={
//           <ActionButton icon={<Plus className="w-4 h-4" />}>Add Doctor</ActionButton>
//         }
//       />

//       <FilterBar>
//         <SearchInput value={search} onChange={setSearch} placeholder="Search doctors..." />
//         <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
//         <SelectFilter
//           value={classFilter}
//           onChange={setClassFilter}
//           options={[
//             { label: 'Class A (High Priority)', value: 'Class A' },
//             { label: 'Class B', value: 'Class B' },
//             { label: 'Class C', value: 'Class C' },
//           ]}
//           placeholder="All Classes"
//         />
//       </FilterBar>

//       <TableCard>
//         <DataTable
//           columns={columns}
//           data={filteredData}
//           emptyMessage="No doctor profiles found."
//         />
//       </TableCard>
//     </div>
//   );
// }



/////////////////////////////////////////////////////////////////////////////

import { useState, useEffect } from 'react';
import { Plus, Stethoscope, Building, MapPin, Mail, Phone, User } from 'lucide-react';
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

// ✅ Proper TypeScript Interfaces
interface DoctorProfile {
  id: string;
  name: string;
  specialty: string;
  class: 'Class A' | 'Class B' | 'Class C';
  hospital: string;
  lastVisit: string;
  phone?: string;
  email?: string;
  createdAt?: string;
}

interface MRDoctorVisit {
  id?: string;
  doctorId?: string;
  doctorName: string;
  date: string;
}

// ✅ Interface for CRM Activities
interface CRMActivity {
  id: string;
  type: string;
  description: string;
  date: string;
  user: string;
}

export default function DoctorCRM() {
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    specialty: '',
    docClass: 'Class A' as 'Class A' | 'Class B' | 'Class C',
    hospital: '',
    phone: '',
    email: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    try {
      const storedDoctors: DoctorProfile[] = JSON.parse(localStorage.getItem('crm_doctors') || '[]');
      const mrVisits: MRDoctorVisit[] = JSON.parse(localStorage.getItem('mr_doctor_visits') || '[]');

      // Enrich doctors with 'lastVisit' data from the MR field mobile app
      const enrichedDoctors: DoctorProfile[] = storedDoctors.map((doc) => {
        const docVisits = mrVisits.filter((v) => 
          v.doctorId === doc.id || 
          v.doctorName.toLowerCase() === doc.name.toLowerCase() ||
          v.doctorName.toLowerCase().includes(doc.name.toLowerCase()) ||
          doc.name.toLowerCase().includes(v.doctorName.toLowerCase())
        );
        
        let lastVisitStr = '-';
        if (docVisits.length > 0) {
          docVisits.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          lastVisitStr = docVisits[0].date; 
        }

        return { 
          ...doc, 
          lastVisit: doc.lastVisit && doc.lastVisit !== '-' ? doc.lastVisit : lastVisitStr 
        };
      });

      // Sorted by createdAt timestamp (more robust than ID sorting)
      enrichedDoctors.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
      
      setDoctors(enrichedDoctors);
    } catch (e) {
      console.error('Failed to load doctors', e);
    }
  };

  const generateDoctorId = (existingDoctors: DoctorProfile[]) => {
    if (existingDoctors.length === 0) return 'DOC-0001';
    
    const ids = existingDoctors.map(d => {
      const parts = d.id.split('-');
      return parts.length > 1 ? parseInt(parts[1], 10) : 0;
    }).filter(n => !isNaN(n));
    
    const maxId = ids.length > 0 ? Math.max(...ids) : 0;
    return `DOC-${(maxId + 1).toString().padStart(4, '0')}`;
  };

  const getManagerName = () => {
    const authUserStr = localStorage.getItem('authUser');
    const authUser = authUserStr ? JSON.parse(authUserStr) : null;
    return authUser?.fullName || authUser?.name || authUser?.username || 'Admin';
  };

  const handleAddDoctor = (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const existingDoctors: DoctorProfile[] = JSON.parse(localStorage.getItem('crm_doctors') || '[]');
      
      // Auto-Trim inputs to prevent spacing bugs
      const trimmedName = formData.name.trim();
      const trimmedPhone = formData.phone.trim();
      const trimmedEmail = formData.email.trim();
      
      // ✅ Case-insensitive check for "Dr." prefix using Regex
      const hasPrefix = /^dr\./i.test(trimmedName);
      const finalName = hasPrefix ? trimmedName : `Dr. ${trimmedName}`;

      // Duplicate Doctor Check
      const nameExists = existingDoctors.some(
        (doc) => doc.name.toLowerCase() === finalName.toLowerCase()
      );
      if (nameExists) {
        alert(`A profile for ${finalName} already exists in the CRM.`);
        return;
      }

      // Duplicate Email Check
      if (trimmedEmail) {
        const emailExists = existingDoctors.some(
          (doc) => doc.email?.toLowerCase() === trimmedEmail.toLowerCase()
        );
        if (emailExists) {
          alert(`The email ${trimmedEmail} is already registered to another doctor.`);
          return;
        }
      }

      // Strict Phone Validation (Exactly 10 digits)
      if (trimmedPhone) {
        const digitCount = trimmedPhone.replace(/\D/g, '').length;
        if (digitCount !== 10) {
          alert("Please enter exactly 10 digits for the phone number.");
          return;
        }
      }

      const newDoctor: DoctorProfile = {
        id: generateDoctorId(existingDoctors),
        name: finalName,
        specialty: formData.specialty.trim(),
        class: formData.docClass,
        hospital: formData.hospital.trim(),
        phone: trimmedPhone,
        email: trimmedEmail,
        createdAt: new Date().toISOString(),
        lastVisit: '-'
      };

      const updatedDoctors = [newDoctor, ...existingDoctors];
      localStorage.setItem('crm_doctors', JSON.stringify(updatedDoctors));

      // Log to Master CRM Activities using proper Interface
      const managerName = getManagerName();
      const existingActivities: CRMActivity[] = JSON.parse(localStorage.getItem('crm_activities') || '[]');
      const newActivity: CRMActivity = {
        id: `ACT-${Date.now()}`,
        type: 'Doctor Added',
        description: `Added new KOL profile: ${newDoctor.name} (${newDoctor.specialty})`,
        date: new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        user: managerName
      };
      localStorage.setItem('crm_activities', JSON.stringify([newActivity, ...existingActivities]));

      // Reset & Reload
      setFormData({ name: '', specialty: '', docClass: 'Class A', hospital: '', phone: '', email: '' });
      setIsAddDrawerOpen(false);
      loadData();
    } catch (error) {
      console.error("Failed to add doctor", error);
      alert("Failed to add doctor profile.");
    }
  };

  const columns: Column<DoctorProfile>[] = [
    { key: 'name', label: 'Doctor Name', render: (row) => <span className="font-semibold text-slate-900">{row.name}</span> },
    { key: 'specialty', label: 'Specialty', render: (row) => <span className="text-slate-600">{row.specialty}</span> },
    { key: 'hospital', label: 'Primary Affiliation', render: (row) => <span className="text-slate-600">{row.hospital}</span> },
    {
      key: 'class',
      label: 'Classification',
      render: (row) => {
        const variant = row.class === 'Class A' ? 'purple' : row.class === 'Class B' ? 'info' : 'neutral';
        return <Badge variant={variant}>{row.class}</Badge>;
      },
    },
    { key: 'lastVisit', label: 'Last Visit Date', render: (row) => <span className="text-slate-600">{row.lastVisit}</span> },
    {
      key: 'action',
      label: '',
      render: () => <ActionButton variant="ghost" className="text-violet-600 text-xs px-2 py-1"><Stethoscope className="w-4 h-4 mr-1" /> Profile</ActionButton>
    }
  ];

  // ✅ Search now includes phone and email as well!
  const filteredData = doctors.filter((item) => {
    const term = search.toLowerCase();
    const matchSearch = 
      item.name.toLowerCase().includes(term) || 
      item.specialty.toLowerCase().includes(term) || 
      item.hospital.toLowerCase().includes(term) ||
      (item.phone && item.phone.toLowerCase().includes(term)) ||
      (item.email && item.email.toLowerCase().includes(term));
      
    const matchClass = classFilter ? item.class === classFilter : true;
    return matchSearch && matchClass;
  });

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Doctor/Hospital CRM"
        subtitle="Manage detailed profiles, classifications, and engagement history for Key Opinion Leaders (KOLs)."
        actions={
          <ActionButton onClick={() => setIsAddDrawerOpen(true)} icon={<Plus className="w-4 h-4" />}>Add Doctor</ActionButton>
        }
      />

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search name, specialty, phone or email..." />
        <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
        <SelectFilter
          value={classFilter}
          onChange={setClassFilter}
          options={[
            { label: 'Class A (High Priority)', value: 'Class A' },
            { label: 'Class B', value: 'Class B' },
            { label: 'Class C', value: 'Class C' },
          ]}
          placeholder="All Classes"
        />
      </FilterBar>

      <TableCard>
        <DataTable
          columns={columns}
          data={filteredData}
          emptyMessage="No doctor profiles available. Click 'Add Doctor' to create one."
        />
      </TableCard>

      <Drawer
        open={isAddDrawerOpen}
        onClose={() => setIsAddDrawerOpen(false)}
        title="Add New Doctor"
      >
        <form onSubmit={handleAddDoctor} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Doctor Name *</label>
              <div className="relative">
                <User className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Arvind Rao"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-violet-600 focus:border-violet-600 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Specialty *</label>
              <div className="relative">
                <Stethoscope className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Cardiology, Pediatrics"
                  value={formData.specialty}
                  onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-violet-600 focus:border-violet-600 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Primary Hospital/Clinic *</label>
              <div className="relative">
                <Building className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Apollo Hospitals"
                  value={formData.hospital}
                  onChange={(e) => setFormData({ ...formData, hospital: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-violet-600 focus:border-violet-600 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">KOL Classification *</label>
              <div className="relative">
                <MapPin className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <select
                  required
                  value={formData.docClass}
                  onChange={(e) => setFormData({ ...formData, docClass: e.target.value as 'Class A' | 'Class B' | 'Class C' })}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-violet-600 focus:border-violet-600 outline-none appearance-none"
                >
                  <option value="Class A">Class A (High Priority)</option>
                  <option value="Class B">Class B (Medium Priority)</option>
                  <option value="Class C">Class C (Standard)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    placeholder="10-digit number"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-violet-600 focus:border-violet-600 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    placeholder="Email address"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-violet-600 focus:border-violet-600 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddDrawerOpen(false)}
              className="flex-1 bg-white border border-slate-200 text-slate-700 font-semibold py-2.5 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-violet-600 text-white font-semibold py-2.5 rounded-lg hover:bg-violet-700 transition-colors"
            >
              Save Profile
            </button>
          </div>
        </form>
      </Drawer>
    </div>
  );
}