import { useState, useMemo } from 'react';
import { 
  BellRing, 
  CheckCircle2, 
  Eye, 
  Mail, 
  MessageSquare, 
  Phone, 
  Calendar, 
  AlertCircle,
  X,
  MoreVertical,
  Send,
  IndianRupee
} from 'lucide-react';
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
  DrawerField
} from './components/shared';
import { type Column } from './components/shared';

// Type Definitions
type PriorityType = 'Low' | 'Medium' | 'High' | 'Critical';
type StatusType = 'Pending' | 'In Follow-Up' | 'Partially Paid' | 'Paid' | 'Escalated' | 'Closed';

interface PaymentAlert {
  id: string;
  customerName: string;
  invoiceNo: string;
  dueDate: string;
  outstandingAmount: number;
  daysOverdue: number;
  priority: PriorityType;
  assignedTo: string;
  status: StatusType;
  history: { date: string; action: string; notes: string }[];
}

const generateMockData = (): PaymentAlert[] => {
  return [
    { 
      id: '1', 
      customerName: 'Apollo Pharmacy', 
      invoiceNo: 'INV/26/105', 
      dueDate: '20-Oct-2026', 
      outstandingAmount: 45000, 
      daysOverdue: 15, 
      priority: 'Critical',
      assignedTo: 'Rahul Kumar',
      status: 'Pending',
      history: [
        { date: '01-Nov-2026', action: 'System Alert', notes: 'Invoice marked as overdue.' }
      ]
    },
    { 
      id: '2', 
      customerName: 'Wellness Medicos', 
      invoiceNo: 'INV/26/112', 
      dueDate: '25-Oct-2026', 
      outstandingAmount: 12500, 
      daysOverdue: 10, 
      priority: 'High',
      assignedTo: 'Sneha Reddy',
      status: 'In Follow-Up',
      history: [
        { date: '26-Oct-2026', action: 'System Alert', notes: 'Invoice marked as overdue.' },
        { date: '02-Nov-2026', action: 'Phone Call', notes: 'Spoke to manager, promised payment by next week.' }
      ]
    },
    { 
      id: '3', 
      customerName: 'City Hospital', 
      invoiceNo: 'INV/26/120', 
      dueDate: '28-Oct-2026', 
      outstandingAmount: 8200, 
      daysOverdue: 7, 
      priority: 'Medium',
      assignedTo: 'Vikram Singh',
      status: 'Pending',
      history: [
        { date: '29-Oct-2026', action: 'System Alert', notes: 'Invoice marked as overdue.' }
      ]
    },
    { 
      id: '4', 
      customerName: 'Sanjeevani Clinic', 
      invoiceNo: 'INV/26/128', 
      dueDate: '02-Nov-2026', 
      outstandingAmount: 3200, 
      daysOverdue: 2, 
      priority: 'Low',
      assignedTo: 'Priya Sharma',
      status: 'Pending',
      history: [
        { date: '03-Nov-2026', action: 'System Alert', notes: 'Grace period initiated.' }
      ]
    },
    { 
      id: '5', 
      customerName: 'Metro Pharma Distributors', 
      invoiceNo: 'INV/26/095', 
      dueDate: '10-Oct-2026', 
      outstandingAmount: 215000, 
      daysOverdue: 25, 
      priority: 'Critical',
      assignedTo: 'Amit Patel',
      status: 'Escalated',
      history: [
        { date: '11-Oct-2026', action: 'System Alert', notes: 'Invoice marked as overdue.' },
        { date: '20-Oct-2026', action: 'Email Sent', notes: 'First formal reminder dispatched.' },
        { date: '30-Oct-2026', action: 'Escalation', notes: 'Transferred to legal team due to non-response.' }
      ]
    }
  ];
};

// Custom Action Menu Component for the Table
const ActionMenu = ({ row, onAction }: { row: PaymentAlert, onAction: (action: string, row: PaymentAlert) => void }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative flex justify-end">
      <button onClick={() => setOpen(!open)} className="p-1.5 hover:bg-slate-100 rounded-md text-slate-500 transition-colors">
        <MoreVertical className="w-4 h-4" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-8 w-44 bg-white border border-slate-200 shadow-lg rounded-md py-1 z-20 animate-in fade-in zoom-in-95 duration-100">
             <button onClick={() => { setOpen(false); onAction('view', row); }} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 flex items-center gap-2 text-slate-700 transition-colors">
               <Eye className="w-4 h-4 text-slate-400" /> View Details
             </button>
             {row.status !== 'Closed' && row.status !== 'Paid' && (
               <>
                 <button onClick={() => { setOpen(false); onAction('remind', row); }} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 flex items-center gap-2 text-slate-700 transition-colors">
                   <Send className="w-4 h-4 text-slate-400" /> Send Reminder
                 </button>
                 <button onClick={() => { setOpen(false); onAction('followup', row); }} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 flex items-center gap-2 text-slate-700 transition-colors">
                   <Calendar className="w-4 h-4 text-slate-400" /> Add Follow-Up
                 </button>
                 <div className="h-px bg-slate-100 my-1" />
                 <button onClick={() => { setOpen(false); onAction('resolve', row); }} className="w-full text-left px-4 py-2 text-sm hover:bg-emerald-50 flex items-center gap-2 text-emerald-700 transition-colors">
                   <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Mark Resolved
                 </button>
               </>
             )}
          </div>
        </>
      )}
    </div>
  );
};

export default function PaymentAlerts() {
  const [data, setData] = useState<PaymentAlert[]>(generateMockData());

  // Filters State
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [assignedToFilter, setAssignedToFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Modals / Drawer State
  const [viewRow, setViewRow] = useState<PaymentAlert | null>(null);
  const [remindRow, setRemindRow] = useState<PaymentAlert | null>(null);
  const [followupRow, setFollowupRow] = useState<PaymentAlert | null>(null);
  
  // Follow-Up Form State
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpRemarks, setFollowUpRemarks] = useState('');

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Handlers
  const handleAction = (action: string, row: PaymentAlert) => {
    if (action === 'view') setViewRow(row);
    if (action === 'remind') setRemindRow(row);
    if (action === 'followup') {
      setFollowUpDate('');
      setFollowUpRemarks('');
      setFollowupRow(row);
    }
    if (action === 'resolve') {
      setData(prev => prev.map(item => item.id === row.id ? { ...item, status: 'Closed' } : item));
      showToast(`Invoice ${row.invoiceNo} marked as resolved.`);
    }
  };

  const handleSendReminder = (method: string) => {
    if (!remindRow) return;
    const newHistoryEntry = {
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-'),
      action: `Reminder via ${method}`,
      notes: `System generated reminder dispatched to customer.`
    };
    
    setData(prev => prev.map(item => {
      if (item.id === remindRow.id) {
        return {
          ...item,
          status: item.status === 'Pending' ? 'In Follow-Up' : item.status,
          history: [...item.history, newHistoryEntry]
        };
      }
      return item;
    }));
    
    setRemindRow(null);
    showToast(`Reminder sent successfully via ${method}.`);
  };

  const handleSaveFollowUp = () => {
    if (!followupRow || !followUpDate) return;
    
    const formattedDate = new Date(followUpDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-');
    const newHistoryEntry = {
      date: formattedDate,
      action: 'Follow-Up Added',
      notes: followUpRemarks || 'Scheduled follow-up.'
    };

    setData(prev => prev.map(item => {
      if (item.id === followupRow.id) {
        return {
          ...item,
          status: 'In Follow-Up',
          history: [...item.history, newHistoryEntry]
        };
      }
      return item;
    }));

    setFollowupRow(null);
    showToast(`Follow-up scheduled for ${formattedDate}.`);
  };

  // Derived Metrics & Filtering
  const metrics = useMemo(() => {
    let criticalAlerts = 0;
    let overdueAmount = 0;
    
    data.forEach(row => {
      if (row.status !== 'Closed' && row.status !== 'Paid') {
        if (row.priority === 'Critical') criticalAlerts += 1;
        overdueAmount += row.outstandingAmount;
      }
    });

    return { criticalAlerts, overdueAmount };
  }, [data]);

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      if (search && !item.customerName.toLowerCase().includes(search.toLowerCase()) && !item.invoiceNo.toLowerCase().includes(search.toLowerCase())) return false;
      if (priorityFilter && item.priority !== priorityFilter) return false;
      if (statusFilter && item.status !== statusFilter) return false;
      if (assignedToFilter && item.assignedTo !== assignedToFilter) return false;
      
      // Rough date filtering using string comparison (works for simple testing, normally parse to Date)
      if (fromDate) {
         const rowDate = new Date(item.dueDate);
         if (rowDate < new Date(fromDate)) return false;
      }
      if (toDate) {
         const rowDate = new Date(item.dueDate);
         if (rowDate > new Date(toDate)) return false;
      }

      return true;
    });
  }, [data, search, priorityFilter, statusFilter, assignedToFilter, fromDate, toDate]);

  const columns: Column<PaymentAlert>[] = [
    { key: 'customerName', label: 'Customer Name', render: (row) => <span className="font-semibold text-slate-900">{row.customerName}</span> },
    { key: 'invoiceNo', label: 'Invoice No.' },
    { key: 'dueDate', label: 'Due Date' },
    { key: 'outstandingAmount', label: 'Outstanding Amount', render: (row) => <span className="font-bold text-rose-600">{formatCurrency(row.outstandingAmount)}</span> },
    { key: 'daysOverdue', label: 'Days Overdue', render: (row) => <span className="text-slate-600 font-medium">{row.daysOverdue}</span> },
    {
      key: 'priority',
      label: 'Priority',
      render: (row) => {
        let variant: 'danger' | 'warning' | 'info' | 'neutral' = 'neutral';
        if (row.priority === 'Critical') variant = 'danger';
        if (row.priority === 'High') variant = 'warning'; // Using warning color for High to distinguish from Critical red
        if (row.priority === 'Medium') variant = 'info';
        return <Badge variant={variant}>{row.priority}</Badge>;
      },
    },
    { key: 'assignedTo', label: 'Assigned To' },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        let variant: 'success' | 'warning' | 'danger' | 'info' | 'neutral' = 'neutral';
        if (row.status === 'Closed' || row.status === 'Paid') variant = 'success';
        if (row.status === 'In Follow-Up' || row.status === 'Partially Paid') variant = 'warning';
        if (row.status === 'Escalated') variant = 'danger';
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    },
    {
      key: 'action',
      label: 'Action',
      render: (row) => <ActionMenu row={row} onAction={handleAction} />
    }
  ];

  return (
    <div className="animate-in fade-in duration-500 pb-12 relative">
      <PageHeader
        title="Payment Reminders"
        subtitle="Monitor overdue invoices and follow up with customers."
      />

      {toastMessage && (
        <div className="fixed top-6 right-6 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl z-50 flex items-center gap-3 animate-in slide-in-from-top-4 fade-in duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <p className="text-sm font-medium">{toastMessage}</p>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white border border-rose-200 p-6 rounded-xl shadow-sm flex flex-col bg-rose-50/30 transition-all">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-rose-600 font-semibold uppercase tracking-wider">Critical Alerts</p>
            <AlertCircle className="w-5 h-5 text-rose-500" />
          </div>
          <p className="text-3xl font-bold text-slate-900">{metrics.criticalAlerts}</p>
        </div>
        <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm flex flex-col transition-all">
          <p className="text-sm text-slate-500 font-semibold uppercase tracking-wider mb-2">Overdue Amount</p>
          <p className="text-3xl font-bold text-slate-900">{formatCurrency(metrics.overdueAmount)}</p>
        </div>
      </div>

      {/* Filter Bar */}
      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search customer, invoice..." />
        
        <SelectFilter
          value={priorityFilter}
          onChange={setPriorityFilter}
          options={[
            { label: 'Critical', value: 'Critical' },
            { label: 'High', value: 'High' },
            { label: 'Medium', value: 'Medium' },
            { label: 'Low', value: 'Low' },
          ]}
          placeholder="Priority"
        />
        
        <SelectFilter
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { label: 'Pending', value: 'Pending' },
            { label: 'In Follow-Up', value: 'In Follow-Up' },
            { label: 'Partially Paid', value: 'Partially Paid' },
            { label: 'Paid', value: 'Paid' },
            { label: 'Escalated', value: 'Escalated' },
            { label: 'Closed', value: 'Closed' }
          ]}
          placeholder="Status"
        />

        <SelectFilter
          value={assignedToFilter}
          onChange={setAssignedToFilter}
          options={[
            { label: 'Rahul Kumar', value: 'Rahul Kumar' },
            { label: 'Sneha Reddy', value: 'Sneha Reddy' },
            { label: 'Vikram Singh', value: 'Vikram Singh' },
            { label: 'Priya Sharma', value: 'Priya Sharma' },
            { label: 'Amit Patel', value: 'Amit Patel' }
          ]}
          placeholder="Assigned To"
        />

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-all"
          />
          <span className="text-slate-400 text-sm">to</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-all"
          />
        </div>
      </FilterBar>

      <TableCard>
        <DataTable
          columns={columns}
          data={filteredData}
          emptyMessage="No payment alerts found for the selected criteria."
        />
      </TableCard>

      {/* View Details Drawer */}
      <Drawer
        open={viewRow !== null}
        onClose={() => setViewRow(null)}
        title="Reminder Details"
      >
        {viewRow && (
          <div className="space-y-6">
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Customer & Invoice</h4>
              <div className="space-y-1">
                <DrawerField label="Customer" value={viewRow.customerName} />
                <DrawerField label="Invoice No." value={viewRow.invoiceNo} />
                <DrawerField label="Due Date" value={viewRow.dueDate} />
                <DrawerField label="Days Overdue" value={<span className="text-rose-600 font-medium">{viewRow.daysOverdue} days</span>} />
                <DrawerField label="Outstanding" value={<span className="font-bold text-slate-900">{formatCurrency(viewRow.outstandingAmount)}</span>} />
                <DrawerField label="Priority" value={<Badge variant={viewRow.priority === 'Critical' ? 'danger' : 'neutral'}>{viewRow.priority}</Badge>} />
                <DrawerField label="Status" value={<Badge variant="info">{viewRow.status}</Badge>} />
                <DrawerField label="Assigned To" value={viewRow.assignedTo} />
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Reminder History & Follow-ups</h4>
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-100 space-y-4">
                {viewRow.history.map((h, i) => (
                  <div key={i} className="relative pl-4 border-l-2 border-violet-200 last:mb-0">
                    <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-violet-400 border-2 border-white" />
                    <p className="text-xs text-slate-500 font-medium mb-0.5">{h.date}</p>
                    <p className="text-sm font-semibold text-slate-800">{h.action}</p>
                    <p className="text-sm text-slate-600 mt-1">{h.notes}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* Send Reminder Modal */}
      {remindRow && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
               <h3 className="text-lg font-bold text-slate-900">Send Reminder</h3>
               <button onClick={() => setRemindRow(null)} className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                 <X className="w-5 h-5" />
               </button>
            </div>
            
            <div className="p-6 bg-slate-50/50">
              <p className="text-sm text-slate-600 mb-4">Select a method to send a payment reminder to <strong>{remindRow.customerName}</strong> for Invoice <strong>{remindRow.invoiceNo}</strong>.</p>
              
              <div className="space-y-2">
                <button onClick={() => handleSendReminder('Email')} className="w-full flex items-center justify-between px-4 py-3 bg-white border border-slate-200 rounded-xl hover:border-violet-300 hover:bg-violet-50 transition-all text-left group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 group-hover:bg-violet-200">
                      <Mail className="w-4 h-4" />
                    </div>
                    <span className="font-medium text-slate-700 group-hover:text-violet-700">Send via Email</span>
                  </div>
                </button>
                <button onClick={() => handleSendReminder('SMS')} className="w-full flex items-center justify-between px-4 py-3 bg-white border border-slate-200 rounded-xl hover:border-violet-300 hover:bg-violet-50 transition-all text-left group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 group-hover:bg-blue-200">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <span className="font-medium text-slate-700 group-hover:text-violet-700">Send via SMS</span>
                  </div>
                </button>
                <button onClick={() => handleSendReminder('WhatsApp')} className="w-full flex items-center justify-between px-4 py-3 bg-white border border-slate-200 rounded-xl hover:border-emerald-300 hover:bg-emerald-50 transition-all text-left group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-200">
                      <Phone className="w-4 h-4" />
                    </div>
                    <span className="font-medium text-slate-700 group-hover:text-emerald-700">Send via WhatsApp</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Follow-Up Modal */}
      {followupRow && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
               <h3 className="text-lg font-bold text-slate-900">Add Follow-Up</h3>
               <button onClick={() => setFollowupRow(null)} className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                 <X className="w-5 h-5" />
               </button>
            </div>
            
            <div className="p-6 bg-slate-50/50 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Follow-Up Date</label>
                <input 
                  type="date" 
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Remarks / Notes</label>
                <textarea 
                  rows={4}
                  value={followUpRemarks}
                  onChange={(e) => setFollowUpRemarks(e.target.value)}
                  placeholder="Enter details about the follow-up..."
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 resize-none"
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-white border-t border-slate-100 flex justify-end gap-3">
              <button 
                onClick={() => setFollowupRow(null)} 
                className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveFollowUp}
                disabled={!followUpDate}
                className="px-4 py-2 text-sm font-medium text-white bg-violet-600 rounded-lg shadow-sm shadow-violet-200 hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Calendar className="w-4 h-4" /> Save Follow-Up
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
