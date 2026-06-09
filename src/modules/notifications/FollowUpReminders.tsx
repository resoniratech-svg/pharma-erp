import { useState } from 'react';
import { Download, Filter, BellRing, CheckCircle2, AlertCircle, PhoneForwarded } from 'lucide-react';
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
} from './components/shared';
import { type Column } from './components/shared';

interface FollowUpReminder {
  id: string;
  followUpId: string;
  customerName: string;
  followUpType: string;
  assignedTo: string;
  dueDate: string;
  priority: 'High' | 'Medium' | 'Low';
  reminderStatus: 'Sent' | 'Pending';
  status: 'Pending' | 'Completed' | 'Overdue';
}

const mockData: FollowUpReminder[] = [
  { id: '1', followUpId: 'FU-001', customerName: 'City Hospital', followUpType: 'Lead Nurturing', assignedTo: 'Rahul Sharma', dueDate: '25-Oct-2024', priority: 'High', reminderStatus: 'Sent', status: 'Pending' },
  { id: '2', followUpId: 'FU-002', customerName: 'Dr. A.K. Singh', followUpType: 'Post-Visit Check', assignedTo: 'Amit Kumar', dueDate: '24-Oct-2024', priority: 'Medium', reminderStatus: 'Sent', status: 'Completed' },
  { id: '3', followUpId: 'FU-003', customerName: 'Apollo Pharmacy', followUpType: 'Payment Collection', assignedTo: 'Sanjay Patel', dueDate: '20-Oct-2024', priority: 'High', reminderStatus: 'Sent', status: 'Overdue' },
  { id: '4', followUpId: 'FU-004', customerName: 'Wellness Medicals', followUpType: 'Order Confirmation', assignedTo: 'Neha Gupta', dueDate: '26-Oct-2024', priority: 'Low', reminderStatus: 'Pending', status: 'Pending' },
];

export default function FollowUpReminders() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const columns: Column<FollowUpReminder>[] = [
    { key: 'followUpId', label: 'Follow-Up ID', render: (row) => <span className="font-semibold text-slate-900">{row.followUpId}</span> },
    { key: 'customerName', label: 'Customer / Lead Name', render: (row) => <span className="font-medium text-slate-800">{row.customerName}</span> },
    { key: 'followUpType', label: 'Follow-Up Type' },
    { key: 'assignedTo', label: 'Assigned To' },
    { key: 'dueDate', label: 'Due Date', render: (row) => <span className="font-medium text-slate-700">{row.dueDate}</span> },
    {
      key: 'priority',
      label: 'Priority',
      render: (row) => (
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
          row.priority === 'High' ? 'bg-rose-100 text-rose-700' :
          row.priority === 'Medium' ? 'bg-amber-100 text-amber-700' :
          'bg-slate-100 text-slate-700'
        }`}>
          {row.priority}
        </span>
      )
    },
    {
      key: 'reminderStatus',
      label: 'Reminder Status',
      render: (row) => {
        let variant: any = 'default';
        if (row.reminderStatus === 'Sent') variant = 'success';
        else if (row.reminderStatus === 'Pending') variant = 'warning';
        return <Badge variant={variant}>{row.reminderStatus}</Badge>;
      },
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        let variant: any = 'default';
        if (row.status === 'Completed') variant = 'success';
        else if (row.status === 'Pending') variant = 'warning';
        else if (row.status === 'Overdue') variant = 'danger';
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    },
    {
      key: 'id',
      label: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          <button className="text-xs bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-2 py-1 rounded font-medium transition-colors">View</button>
          <button className="text-xs bg-slate-50 text-slate-600 hover:bg-slate-100 px-2 py-1 rounded font-medium transition-colors">Update</button>
          {row.status !== 'Completed' && (
            <button className="text-xs bg-emerald-50 text-emerald-600 hover:bg-emerald-100 px-2 py-1 rounded font-medium transition-colors">Complete</button>
          )}
        </div>
      )
    }
  ];

  const filteredData = mockData.filter((item) => {
    const matchSearch = item.customerName.toLowerCase().includes(search.toLowerCase()) || 
                        item.assignedTo.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Follow-Up Reminder Center"
        subtitle="Monitor scheduled follow-ups and ensure timely customer engagement."
        actions={
          <ActionButton variant="secondary" icon={<Download className="w-4 h-4" />}>Export Follow-Ups</ActionButton>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <SummaryCard
          title="Pending Follow-Ups"
          value="34"
          subtitle="Currently active"
          icon={<BellRing className="w-6 h-6" />}
          colorClass="text-amber-600"
          bgClass="bg-amber-50"
        />
        <SummaryCard
          title="Today's Follow-Ups"
          value="12"
          subtitle="Scheduled for today"
          icon={<PhoneForwarded className="w-6 h-6" />}
          colorClass="text-blue-600"
          bgClass="bg-blue-50"
        />
        <SummaryCard
          title="Completed Follow-Ups"
          value="156"
          subtitle="This month"
          icon={<CheckCircle2 className="w-6 h-6" />}
          colorClass="text-emerald-600"
          bgClass="bg-emerald-50"
        />
        <SummaryCard
          title="Overdue Follow-Ups"
          value="8"
          subtitle="Needs immediate action"
          icon={<AlertCircle className="w-6 h-6" />}
          colorClass="text-danger-600"
          bgClass="bg-danger-50"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 mb-8">
        {/* Main Content Area */}
        <div className="xl:col-span-3 flex flex-col gap-4">
          <FilterBar>
            <SearchInput value={search} onChange={setSearch} placeholder="Search customer or assigned employee..." />
            <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-medium text-slate-600">Filters:</span>
            </div>
            <SelectFilter
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { label: 'Pending', value: 'Pending' },
                { label: 'Completed', value: 'Completed' },
                { label: 'Overdue', value: 'Overdue' },
              ]}
              placeholder="Status"
            />
          </FilterBar>

          <TableCard>
            <DataTable
              columns={columns}
              data={filteredData}
              emptyMessage="No follow-up reminders found."
            />
          </TableCard>
        </div>

        {/* Right Sidebar Widget */}
        <div className="xl:col-span-1">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Overdue Tracker</h2>
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-6">
            
            <div>
              <h3 className="text-xs font-bold text-rose-600 uppercase tracking-wider mb-3 flex items-center gap-2">
                High Priority
              </h3>
              <div className="space-y-3">
                <div className="bg-rose-50 border border-rose-100 p-3 rounded-lg">
                  <p className="text-sm font-semibold text-slate-900 mb-1">Apollo Pharmacy</p>
                  <p className="text-xs text-slate-600 flex justify-between">
                    <span>Payment Collection</span>
                    <span className="text-rose-600 font-medium">5 days ago</span>
                  </p>
                </div>
                <div className="bg-rose-50 border border-rose-100 p-3 rounded-lg">
                  <p className="text-sm font-semibold text-slate-900 mb-1">Dr. Sharma Clinic</p>
                  <p className="text-xs text-slate-600 flex justify-between">
                    <span>Contract Renewal</span>
                    <span className="text-rose-600 font-medium">2 days ago</span>
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-3 flex items-center gap-2">
                Medium Priority
              </h3>
              <div className="space-y-3">
                <div className="bg-amber-50 border border-amber-100 p-3 rounded-lg">
                  <p className="text-sm font-semibold text-slate-900 mb-1">HealthPlus Store</p>
                  <p className="text-xs text-slate-600 flex justify-between">
                    <span>Feedback Call</span>
                    <span className="text-amber-600 font-medium">Yesterday</span>
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                Low Priority
              </h3>
              <div className="space-y-3">
                <p className="text-sm text-slate-500 italic px-2">No low priority overdue items.</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
