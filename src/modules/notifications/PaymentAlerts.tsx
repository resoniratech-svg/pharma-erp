// import { useState } from 'react';
// import { IndianRupee, CheckCircle2, BellRing } from 'lucide-react';
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

// interface PaymentAlert {
//   id: string;
//   date: string;
//   partyName: string;
//   invoiceNo: string;
//   amount: string;
//   daysOverdue: number;
//   priority: 'High' | 'Medium' | 'Low';
// }

// const mockData: PaymentAlert[] = [
//   { id: '1', date: '20-Oct-2026', partyName: 'Apollo Pharmacy', invoiceNo: 'INV/26/105', amount: '₹ 45,000', daysOverdue: 15, priority: 'High' },
//   { id: '2', date: '25-Oct-2026', partyName: 'Wellness Medicos', invoiceNo: 'INV/26/112', amount: '₹ 12,500', daysOverdue: 5, priority: 'Medium' },
//   { id: '3', date: '28-Oct-2026', partyName: 'City Hospital', invoiceNo: 'INV/26/120', amount: '₹ 8,200', daysOverdue: 2, priority: 'Low' },
// ];

// export default function PaymentAlerts() {
//   const [search, setSearch] = useState('');
//   const [priorityFilter, setPriorityFilter] = useState('');

//   const columns: Column<PaymentAlert>[] = [
//     { key: 'partyName', label: 'Party Name', render: (row) => <span className="font-semibold text-slate-900">{row.partyName}</span> },
//     { key: 'invoiceNo', label: 'Invoice No.' },
//     { key: 'date', label: 'Due Date' },
//     { key: 'amount', label: 'Amount', render: (row) => <span className="font-bold text-rose-600">{row.amount}</span> },
//     { key: 'daysOverdue', label: 'Days Overdue', render: (row) => <span className="text-slate-600">{row.daysOverdue} days</span> },
//     {
//       key: 'priority',
//       label: 'Priority',
//       render: (row) => {
//         const variant = row.priority === 'High' ? 'danger' : row.priority === 'Medium' ? 'warning' : 'info';
//         return <Badge variant={variant}>{row.priority}</Badge>;
//       },
//     },
//     {
//       key: 'action',
//       label: '',
//       render: () => <ActionButton variant="ghost" className="text-violet-600 text-xs px-2 py-1"><CheckCircle2 className="w-4 h-4 mr-1" /> Mark Resolved</ActionButton>
//     }
//   ];

//   const filteredData = mockData.filter((item) => {
//     const matchSearch = item.partyName.toLowerCase().includes(search.toLowerCase());
//     const matchPriority = priorityFilter ? item.priority === priorityFilter : true;
//     return matchSearch && matchPriority;
//   });

//   return (
//     <div className="animate-in fade-in duration-500">
//       <PageHeader
//         title="Payment Reminders"
//         subtitle="Notifications for overdue invoices and pending receivables."
//         actions={
//           <ActionButton variant="secondary" icon={<BellRing className="w-4 h-4" />}>Notify All Selected</ActionButton>
//         }
//       />

//       <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 mb-6 flex items-start gap-3">
//         <IndianRupee className="w-5 h-5 text-rose-600 mt-0.5" />
//         <div>
//           <h3 className="text-sm font-semibold text-rose-800">Critical Receivables</h3>
//           <p className="text-sm text-rose-700 mt-1">You have 3 invoices overdue by more than 10 days amounting to ₹ 1,25,000.</p>
//         </div>
//       </div>

//       <FilterBar>
//         <SearchInput value={search} onChange={setSearch} placeholder="Search party name..." />
//         <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
//         <SelectFilter
//           value={priorityFilter}
//           onChange={setPriorityFilter}
//           options={[
//             { label: 'High Priority', value: 'High' },
//             { label: 'Medium Priority', value: 'Medium' },
//             { label: 'Low Priority', value: 'Low' },
//           ]}
//           placeholder="All Priorities"
//         />
//       </FilterBar>

//       <TableCard>
//         <DataTable
//           columns={columns}
//           data={filteredData}
//           emptyMessage="No payment alerts."
//         />
//       </TableCard>
//     </div>
//   );
// }


/////////////////////////////////////////////////////////////////////

import { useState } from 'react';
import { IndianRupee, CheckCircle2, BellRing, FileText, Users } from 'lucide-react';
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

interface PaymentAlert {
  id: string;
  date: string;
  partyName: string;
  invoiceNo: string;
  amount: string;
  daysOverdue: number;
  priority: 'High' | 'Medium' | 'Low';
  
  collectedAmount?: string;
  outstandingAmount?: string;
  reminderCount?: number;
  lastReminderSent?: string;
}

const mockData: PaymentAlert[] = [
  { id: '1', date: '20-Oct-2026', partyName: 'Apollo Pharmacy', invoiceNo: 'INV/26/105', amount: '₹ 45,000', daysOverdue: 15, priority: 'High', outstandingAmount: '₹ 45,000', reminderCount: 2 },
  { id: '2', date: '25-Oct-2026', partyName: 'Wellness Medicos', invoiceNo: 'INV/26/112', amount: '₹ 12,500', daysOverdue: 5, priority: 'Medium', outstandingAmount: '₹ 12,500', reminderCount: 1 },
  { id: '3', date: '28-Oct-2026', partyName: 'City Hospital', invoiceNo: 'INV/26/120', amount: '₹ 8,200', daysOverdue: 2, priority: 'Low', outstandingAmount: '₹ 8,200', reminderCount: 0 },
];

export default function PaymentAlerts() {
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  const columns: Column<PaymentAlert>[] = [
    { key: 'partyName', label: 'Party Name', render: (row) => <span className="font-semibold text-slate-900">{row.partyName}</span> },
    { key: 'invoiceNo', label: 'Invoice No.' },
    { key: 'date', label: 'Due Date' },
    { key: 'amount', label: 'Invoice Amount', render: (row) => <span className="font-medium text-slate-500">{row.amount}</span> },
    { key: 'outstandingAmount', label: 'Outstanding Balance', render: (row) => <span className="font-bold text-rose-600">{row.outstandingAmount || row.amount}</span> },
    { key: 'reminderCount', label: 'Reminders Sent', render: (row) => <span className="text-slate-600 font-medium">{row.reminderCount || 0}</span> },
    { key: 'daysOverdue', label: 'Days Overdue', render: (row) => <span className="text-slate-600">{row.daysOverdue} days</span> },
    {
      key: 'priority',
      label: 'Priority',
      render: (row) => {
        const variant = row.priority === 'High' ? 'danger' : row.priority === 'Medium' ? 'warning' : 'info';
        return <Badge variant={variant}>{row.priority}</Badge>;
      },
    },
    {
      key: 'action',
      label: '',
      // 🛡️ Enterprise Feature: Adjusted workflow wording based on ERP standards
      render: () => <ActionButton variant="ghost" className="text-violet-600 text-xs px-2 py-1"><IndianRupee className="w-4 h-4 mr-1" /> Receive Payment</ActionButton>
    }
  ];

  const filteredData = mockData.filter((item) => {
    const matchSearch = item.partyName.toLowerCase().includes(search.toLowerCase());
    const matchPriority = priorityFilter ? item.priority === priorityFilter : true;
    return matchSearch && matchPriority;
  });

  // 🛡️ Calculate KPIs Dynamically
  //const overdueCount = mockData.length; 
  // 🛡️ Enterprise logic: Future-proof overdue counting
const overdueCount = mockData.filter(invoice => invoice.daysOverdue > 0).length;
  
  const outstandingTotalNum = mockData.reduce((sum, item) => sum + Number(item.outstandingAmount?.replace(/[₹,\s]/g, '') || 0), 0);
  const formattedOutstanding = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(outstandingTotalNum);

  const collectedToday = "₹ 15,000"; // Static mock until Payment Receipts module is done
  const pendingParties = new Set(mockData.map(m => m.partyName)).size;
  
  // 🛡️ Calculate Critical Banner Values Dynamically
  const highPriorityInvoices = mockData.filter(m => m.priority === 'High');
  const criticalAmountNum = highPriorityInvoices.reduce((sum, item) => sum + Number(item.outstandingAmount?.replace(/[₹,\s]/g, '') || 0), 0);
  const formattedCritical = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(criticalAmountNum);

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Payment Reminders"
        subtitle="Notifications for overdue invoices and pending receivables."
        actions={
          <ActionButton variant="secondary" icon={<BellRing className="w-4 h-4" />}>Notify All Selected</ActionButton>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <SummaryCard
          title="Overdue Invoices"
          value={overdueCount.toString()}
          subtitle="Pending collection"
          icon={<FileText className="w-6 h-6" />}
          colorClass="text-rose-600"
          bgClass="bg-rose-50"
        />
        <SummaryCard
          title="Outstanding Amount"
          value={formattedOutstanding}
          subtitle="Total pending receivables"
          icon={<IndianRupee className="w-6 h-6" />}
          colorClass="text-amber-600"
          bgClass="bg-amber-50"
        />
        <SummaryCard
          title="Collected Today"
          value={collectedToday}
          subtitle="Recent receipts"
          icon={<CheckCircle2 className="w-6 h-6" />}
          colorClass="text-emerald-600"
          bgClass="bg-emerald-50"
        />
        <SummaryCard
          title="Pending Parties"
          value={pendingParties.toString()}
          subtitle="Clients with overdue"
          icon={<Users className="w-6 h-6" />}
          colorClass="text-indigo-600"
          bgClass="bg-indigo-50"
        />
      </div>

      <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 mb-6 flex items-start gap-3">
        <IndianRupee className="w-5 h-5 text-rose-600 mt-0.5" />
        <div>
          <h3 className="text-sm font-semibold text-rose-800">Critical Receivables</h3>
          <p className="text-sm text-rose-700 mt-1">
            You have {highPriorityInvoices.length} {highPriorityInvoices.length === 1 ? 'invoice' : 'invoices'} overdue by more than 10 days amounting to {formattedCritical}.
          </p>
        </div>
      </div>

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search party name..." />
        <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
        <SelectFilter
          value={priorityFilter}
          onChange={setPriorityFilter}
          options={[
            { label: 'High Priority', value: 'High' },
            { label: 'Medium Priority', value: 'Medium' },
            { label: 'Low Priority', value: 'Low' },
          ]}
          placeholder="All Priorities"
        />
      </FilterBar>

      <TableCard>
        <DataTable
          columns={columns}
          data={filteredData}
          emptyMessage="No payment alerts."
        />
      </TableCard>
    </div>
  );
}