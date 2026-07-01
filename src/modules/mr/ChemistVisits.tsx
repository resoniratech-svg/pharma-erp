import { useState, useEffect } from 'react';
import { Plus, Download, Filter, MapPin, Trash2, IndianRupee } from 'lucide-react';
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
import { validateCheckIn } from '../../utils/attendanceValidation';

// ✅ Unified interface — matches React Native ChemistVisitScreen exactly
interface ChemistVisit {
  id: string;
  chemistName: string;
  shopName: string;
  mobile?: string;
  location: string;
  visitDate: string;
  visitTime: string;
  stockCheck: 'Yes' | 'No' | 'Pending';
  pobAmount: number;
  medicine?: string;
  quantity?: string;
  nextFollowUp?: string;
  remarks?: string;
  status: 'Scheduled' | 'Completed' | 'Missed';
}

export default function ChemistVisits() {
  const [visits, setVisits] = useState<ChemistVisit[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const [newChemistName, setNewChemistName] = useState('');
  const [newShopName, setNewShopName] = useState('');
  const [newMobile, setNewMobile] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newVisitDate, setNewVisitDate] = useState('');
  const [newVisitTime, setNewVisitTime] = useState('');
  const [newStockCheck, setNewStockCheck] = useState<ChemistVisit['stockCheck']>('Pending');
  const [newPobAmount, setNewPobAmount] = useState<string>('');  // string so '0' displays correctly
  const [newMedicine, setNewMedicine] = useState('');
  const [newQuantity, setNewQuantity] = useState('');
  const [newNextFollowUp, setNewNextFollowUp] = useState('');
  const [newRemarks, setNewRemarks] = useState('');
  const [newStatus, setNewStatus] = useState<ChemistVisit['status']>('Scheduled');

  useEffect(() => {
    try {
      const stored = localStorage.getItem('web_chemist_visits');
      if (stored) {
        setVisits(JSON.parse(stored));
      } else {
        const initialMock: ChemistVisit[] = [
          {
            id: '1', chemistName: 'Rajesh Kumar', shopName: 'Apollo Pharmacy',
            mobile: '9876543210', location: 'Downtown Market',
            visitDate: '2026-06-15', visitTime: '10:30', stockCheck: 'Yes',
            pobAmount: 15000, medicine: 'Calpol 650, Augmentin 625',
            quantity: '10 strips each', nextFollowUp: '2026-06-22',
            remarks: 'Good stock. Strong demand for Augmentin.', status: 'Completed',
          },
          {
            id: '2', chemistName: 'Suresh Patel', shopName: 'MedPlus Store',
            mobile: '9123456780', location: 'Uptown Avenue',
            visitDate: '2026-06-16', visitTime: '14:00', stockCheck: 'Pending',
            pobAmount: 0, medicine: '', quantity: '', nextFollowUp: '2026-06-23',
            remarks: 'Visit scheduled. RCPA pending.', status: 'Scheduled',
          },
          {
            id: '3', chemistName: 'Anil Sharma', shopName: 'Wellness Medicos',
            mobile: '', location: 'Suburbs',
            visitDate: '2026-06-14', visitTime: '09:00', stockCheck: 'No',
            pobAmount: 0, medicine: '', quantity: '', nextFollowUp: '2026-06-20',
            remarks: 'Chemist was unavailable. Rescheduled.', status: 'Missed',
          },
        ];
        setVisits(initialMock);
        localStorage.setItem('web_chemist_visits', JSON.stringify(initialMock));
      }
    } catch (error) {
      console.error('Failed to load chemist visits:', error);
    }
  }, []);

  const saveVisits = (updatedList: ChemistVisit[]) => {
    setVisits(updatedList);
    localStorage.setItem('web_chemist_visits', JSON.stringify(updatedList));
  };

  const savePobToOrders = (shopName: string, visitDate: string, amount: number) => {
    if (amount <= 0) return;
    try {
      const existingOrders = JSON.parse(localStorage.getItem('web_orders') || '[]');
      const newOrder = {
        id: Date.now().toString() + '_pob',
        orderNo: `POB-${Date.now().toString().slice(-5)}`,
        chemist: shopName, date: visitDate, amount,
        distributor: 'Assigned Stockist', status: 'Booked',
      };
      localStorage.setItem('web_orders', JSON.stringify([newOrder, ...existingOrders]));
    } catch (error) {
      console.error('Failed to save POB to orders:', error);
    }
  };

  const handleAddVisit = () => {
      if (!validateCheckIn()) {
      return; 
    }
    // ✅ Required field checks
    if (!newChemistName.trim()) {
      alert('Chemist Name is required.');
      return;
    }
    if (!newShopName.trim()) {
      alert('Shop / Pharmacy Name is required.');
      return;
    }
    if (!newLocation.trim()) {
      alert('Area / Location is required.');
      return;
    }
    if (!newVisitDate) {
      alert('Visit Date is required.');
      return;
    }
    // ✅ Mobile: must be exactly 10 digits if entered
    if (newMobile && newMobile.length !== 10) {
      alert('Mobile number must be exactly 10 digits.');
      return;
    }
    // ✅ POB Amount: must not be negative
    if (newPobAmount !== '' && Number(newPobAmount) < 0) {
      alert('POB Amount cannot be negative.');
      return;
    }
    const newVisit: ChemistVisit = {
      id: Date.now().toString(), chemistName: newChemistName, shopName: newShopName,
      mobile: newMobile, location: newLocation, visitDate: newVisitDate,
      visitTime: newVisitTime, stockCheck: newStockCheck, pobAmount: Number(newPobAmount) || 0,
      medicine: newMedicine, quantity: newQuantity, nextFollowUp: newNextFollowUp,
      remarks: newRemarks, status: newStatus,
    };
    saveVisits([newVisit, ...visits]);
    savePobToOrders(newShopName, newVisitDate, Number(newPobAmount) || 0);
    setIsDrawerOpen(false);
        alert('✅ Chemist Visit saved successfully!');

    setNewChemistName(''); setNewShopName(''); setNewMobile('');
    setNewLocation(''); setNewVisitDate(''); setNewVisitTime('');
    setNewStockCheck('Pending'); setNewPobAmount(''); setNewMedicine('');
    setNewQuantity(''); setNewNextFollowUp(''); setNewRemarks('');
    setNewStatus('Scheduled');
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this record?')) {
      saveVisits(visits.filter((v) => v.id !== id));
    }
  };

  const handleExport = () => {
    if (visits.length === 0) { alert('No data to export.'); return; }
    const headers = ['Chemist Name','Shop Name','Mobile','Location','Visit Date',
      'Visit Time','RCPA / Stock Check','POB Amount (₹)','Medicine','Quantity',
      'Next Follow-Up','Remarks','Status'];
    const rows = visits.map((v) => [
      v.chemistName, v.shopName, v.mobile || '', v.location, v.visitDate,
      v.visitTime || '', v.stockCheck, v.pobAmount.toString(),
      v.medicine || '', v.quantity || '', v.nextFollowUp || '',
      v.remarks || '', v.status,
    ]);
    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chemist_visits_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const columns: Column<ChemistVisit>[] = [
    {
      key: 'chemistName', label: 'Chemist Name',
      render: (row) => (
        <div>
          <span className="font-semibold text-slate-900">{row.chemistName}</span>
          <div className="text-xs text-slate-400">{row.shopName}</div>
        </div>
      ),
    },
    { key: 'location', label: 'Location' },
    {
      key: 'visitDate', label: 'Visit Date & Time',
      render: (row) => (
        <div className="text-sm">
          <div className="text-slate-700">{row.visitDate}</div>
          {row.visitTime && <div className="text-xs text-slate-400">{row.visitTime}</div>}
        </div>
      ),
    },
    {
      key: 'stockCheck', label: 'RCPA / Stock Check',
      render: (row) => {
        const color = row.stockCheck === 'Yes' ? 'text-emerald-600'
          : row.stockCheck === 'No' ? 'text-rose-600' : 'text-amber-600';
        return <span className={`text-sm font-semibold ${color}`}>{row.stockCheck}</span>;
      },
    },
    {
      key: 'pobAmount', label: 'POB Amount',
      render: (row) => (
        <span className={`text-sm font-semibold ${row.pobAmount > 0 ? 'text-violet-700' : 'text-slate-400'}`}>
          {row.pobAmount > 0 ? `₹ ${row.pobAmount.toLocaleString('en-IN')}` : '—'}
        </span>
      ),
    },
    {
      key: 'medicine', label: 'Medicine / Product',
      render: (row) => (
        <span className="text-xs text-slate-500 max-w-[140px] truncate block" title={row.medicine}>
          {row.medicine || '—'}
        </span>
      ),
    },
    {
      key: 'nextFollowUp', label: 'Next Follow-Up',
      render: (row) => <span className="text-xs text-slate-500">{row.nextFollowUp || '—'}</span>,
    },
    {
      key: 'remarks', label: 'Remarks',
      render: (row) => (
        <span className="text-xs text-slate-500 max-w-[140px] truncate block" title={row.remarks}>
          {row.remarks || '—'}
        </span>
      ),
    },
    {
      key: 'status', label: 'Status',
      render: (row) => {
        const variant = row.status === 'Completed' ? 'success'
          : row.status === 'Scheduled' ? 'info' : 'danger';
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    },
    {
      key: 'action', label: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2">
          <button title="Map Location" className="text-violet-600 hover:text-violet-700 hover:bg-violet-50 p-1.5 rounded-lg transition-colors">
            <MapPin className="w-4 h-4" />
          </button>
          <button title="Delete record" onClick={() => handleDelete(row.id)}
            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 p-1.5 rounded-lg transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const filteredData = visits.filter((item) => {
    const matchSearch =
      item.chemistName.toLowerCase().includes(search.toLowerCase()) ||
      item.shopName.toLowerCase().includes(search.toLowerCase()) ||
      item.location.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Chemist Visit Entry"
        subtitle="Log pharmacy visits and Retail Chemist Prescription Audit (RCPA) data."
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
        <SearchInput value={search} onChange={setSearch} placeholder="Search chemist, shop or location..." />
        <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-600">Filters:</span>
        </div>
        <SelectFilter
          value={statusFilter} onChange={setStatusFilter}
          options={[
            { label: 'Completed', value: 'Completed' },
            { label: 'Scheduled', value: 'Scheduled' },
            { label: 'Missed', value: 'Missed' },
          ]}
          placeholder="All Status"
        />
      </FilterBar>
      <TableCard>
        <DataTable columns={columns} data={filteredData} emptyMessage="No chemist visits found." />
      </TableCard>

      <Drawer open={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} title="Log Chemist Visit & RCPA">
        <form onSubmit={(e) => e.preventDefault()} className="space-y-4">

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Chemist Name *</label>
              <input type="text" value={newChemistName} onChange={(e) => setNewChemistName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-violet-500"
                placeholder="e.g. Rajesh Kumar" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Shop / Pharmacy Name *</label>
              <input type="text" value={newShopName} onChange={(e) => setNewShopName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-violet-500"
                placeholder="e.g. Apollo Pharmacy" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Mobile Number <span className="text-slate-400 font-normal text-xs">(10 digits)</span></label>
            <input type="tel" value={newMobile}
              onChange={(e) => setNewMobile(e.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-violet-500"
              placeholder="e.g. 9876543210" maxLength={10} />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Area / Location *</label>
            <input type="text" value={newLocation} onChange={(e) => setNewLocation(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-violet-500"
              placeholder="e.g. Hyderabad, Banjara Hills" />
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

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">RCPA / Stock Check</label>
            <select value={newStockCheck} onChange={(e) => setNewStockCheck(e.target.value as ChemistVisit['stockCheck'])}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:border-violet-500">
              <option value="Pending">Pending</option>
              <option value="Yes">Yes — Completed</option>
              <option value="No">No — Not Done</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Medicine / Product</label>
              <input type="text" value={newMedicine} onChange={(e) => setNewMedicine(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-violet-500"
                placeholder="e.g. Calpol, Augmentin" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Quantity</label>
              <input type="text" value={newQuantity} onChange={(e) => setNewQuantity(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-violet-500"
                placeholder="e.g. 10 strips" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Order Value / POB Amount (₹){' '}
              <span className="text-slate-400 font-normal text-xs">— auto-saved to Order Booking</span>
            </label>
            <div className="relative">
              <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="number"
                min="0"
                max="9999999999"
                value={newPobAmount}
                onChange={(e) => {
                  // ✅ Allow only digits, max 10 digits = ₹99,99,99,999
                  const cleaned = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
                  setNewPobAmount(cleaned);
                }}
                onKeyDown={(e) => {
                  // ✅ Block letters e/E/+/- (allow digits, Backspace, Delete, Tab, arrows)
                  const allowed = ['Backspace','Delete','Tab','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'];
                  if (!/[0-9]/.test(e.key) && !allowed.includes(e.key)) {
                    e.preventDefault();
                  }
                }}
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-violet-500"
                placeholder="0"
              />
            </div>
            {Number(newPobAmount) > 9999999999 && (
              <p className="text-xs text-rose-500 mt-1">⚠️ Maximum amount is ₹99,99,99,999</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Next Follow-Up Date</label>
            <input type="date" value={newNextFollowUp} onChange={(e) => setNewNextFollowUp(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-violet-500" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Remarks</label>
            <textarea value={newRemarks} onChange={(e) => setNewRemarks(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-violet-500 min-h-[70px] resize-none"
              placeholder="Any additional remarks..." />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Status</label>
            <select value={newStatus} onChange={(e) => setNewStatus(e.target.value as ChemistVisit['status'])}
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