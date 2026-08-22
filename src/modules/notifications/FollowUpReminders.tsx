// // import { useState } from 'react';
// // import { Download, Filter, BellRing, CheckCircle2, AlertCircle, PhoneForwarded } from 'lucide-react';
// // import {
// //   PageHeader,
// //   FilterBar,
// //   SearchInput,
// //   SelectFilter,
// //   ActionButton,
// //   TableCard,
// //   DataTable,
// //   Badge,
// //   SummaryCard,
// // } from './components/shared';
// // import { type Column } from './components/shared';

// // interface FollowUpReminder {
// //   id: string;
// //   followUpId: string;
// //   customerName: string;
// //   followUpType: string;
// //   assignedTo: string;
// //   dueDate: string;
// //   priority: 'High' | 'Medium' | 'Low';
// //   reminderStatus: 'Sent' | 'Pending';
// //   status: 'Pending' | 'Completed' | 'Overdue';
// // }

// // const mockData: any[] = [];

// // export default function FollowUpReminders() {
// //   const [search, setSearch] = useState('');
// //   const [statusFilter, setStatusFilter] = useState('');

// //   const columns: Column<FollowUpReminder>[] = [
// //     { key: 'followUpId', label: 'Follow-Up ID', render: (row) => <span className="font-semibold text-slate-900">{row.followUpId}</span> },
// //     { key: 'customerName', label: 'Customer / Lead Name', render: (row) => <span className="font-medium text-slate-800">{row.customerName}</span> },
// //     { key: 'followUpType', label: 'Follow-Up Type' },
// //     { key: 'assignedTo', label: 'Assigned To' },
// //     { key: 'dueDate', label: 'Due Date', render: (row) => <span className="font-medium text-slate-700">{row.dueDate}</span> },
// //     {
// //       key: 'priority',
// //       label: 'Priority',
// //       render: (row) => (
// //         <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
// //           row.priority === 'High' ? 'bg-rose-100 text-rose-700' :
// //           row.priority === 'Medium' ? 'bg-amber-100 text-amber-700' :
// //           'bg-slate-100 text-slate-700'
// //         }`}>
// //           {row.priority}
// //         </span>
// //       )
// //     },
// //     {
// //       key: 'reminderStatus',
// //       label: 'Reminder Status',
// //       render: (row) => {
// //         let variant: any = 'default';
// //         if (row.reminderStatus === 'Sent') variant = 'success';
// //         else if (row.reminderStatus === 'Pending') variant = 'warning';
// //         return <Badge variant={variant}>{row.reminderStatus}</Badge>;
// //       },
// //     },
// //     {
// //       key: 'status',
// //       label: 'Status',
// //       render: (row) => {
// //         let variant: any = 'default';
// //         if (row.status === 'Completed') variant = 'success';
// //         else if (row.status === 'Pending') variant = 'warning';
// //         else if (row.status === 'Overdue') variant = 'danger';
// //         return <Badge variant={variant}>{row.status}</Badge>;
// //       },
// //     },
// //     {
// //       key: 'id',
// //       label: 'Actions',
// //       render: (row) => (
// //         <div className="flex gap-2">
// //           <button className="text-xs bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-2 py-1 rounded font-medium transition-colors">View</button>
// //           <button className="text-xs bg-slate-50 text-slate-600 hover:bg-slate-100 px-2 py-1 rounded font-medium transition-colors">Update</button>
// //           {row.status !== 'Completed' && (
// //             <button className="text-xs bg-emerald-50 text-emerald-600 hover:bg-emerald-100 px-2 py-1 rounded font-medium transition-colors">Complete</button>
// //           )}
// //         </div>
// //       )
// //     }
// //   ];

// //   const filteredData = mockData.filter((item) => {
// //     const matchSearch = item.customerName.toLowerCase().includes(search.toLowerCase()) || 
// //                         item.assignedTo.toLowerCase().includes(search.toLowerCase());
// //     const matchStatus = statusFilter ? item.status === statusFilter : true;
// //     return matchSearch && matchStatus;
// //   });

// //   return (
// //     <div className="animate-in fade-in duration-500">
// //       <PageHeader
// //         title="Follow-Up Reminder Center"
// //         subtitle="Monitor scheduled follow-ups and ensure timely customer engagement."
// //         actions={
// //           <ActionButton variant="secondary" icon={<Download className="w-4 h-4" />}>Export Follow-Ups</ActionButton>
// //         }
// //       />

// //       {/* KPI Cards */}
// //       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
// //         <SummaryCard
// //           title="Pending Follow-Ups"
// //           value="34"
// //           subtitle="Currently active"
// //           icon={<BellRing className="w-6 h-6" />}
// //           colorClass="text-amber-600"
// //           bgClass="bg-amber-50"
// //         />
// //         <SummaryCard
// //           title="Today's Follow-Ups"
// //           value="12"
// //           subtitle="Scheduled for today"
// //           icon={<PhoneForwarded className="w-6 h-6" />}
// //           colorClass="text-blue-600"
// //           bgClass="bg-blue-50"
// //         />
// //         <SummaryCard
// //           title="Completed Follow-Ups"
// //           value="156"
// //           subtitle="This month"
// //           icon={<CheckCircle2 className="w-6 h-6" />}
// //           colorClass="text-emerald-600"
// //           bgClass="bg-emerald-50"
// //         />
// //         <SummaryCard
// //           title="Overdue Follow-Ups"
// //           value="8"
// //           subtitle="Needs immediate action"
// //           icon={<AlertCircle className="w-6 h-6" />}
// //           colorClass="text-danger-600"
// //           bgClass="bg-danger-50"
// //         />
// //       </div>

// //       <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 mb-8">
// //         {/* Main Content Area */}
// //         <div className="xl:col-span-3 flex flex-col gap-4">
// //           <FilterBar>
// //             <SearchInput value={search} onChange={setSearch} placeholder="Search customer or assigned employee..." />
// //             <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
// //             <div className="flex items-center gap-2">
// //               <Filter className="w-4 h-4 text-slate-400" />
// //               <span className="text-sm font-medium text-slate-600">Filters:</span>
// //             </div>
// //             <SelectFilter
// //               value={statusFilter}
// //               onChange={setStatusFilter}
// //               options={[
// //                 { label: 'Pending', value: 'Pending' },
// //                 { label: 'Completed', value: 'Completed' },
// //                 { label: 'Overdue', value: 'Overdue' },
// //               ]}
// //               placeholder="Status"
// //             />
// //           </FilterBar>

// //           <TableCard>
// //             <DataTable
// //               columns={columns}
// //               data={filteredData}
// //               emptyMessage="No follow-up reminders found."
// //             />
// //           </TableCard>
// //         </div>

// //         {/* Right Sidebar Widget */}
// //         <div className="xl:col-span-1">
// //           <h2 className="text-lg font-semibold text-slate-900 mb-4">Overdue Tracker</h2>
// //           <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-6">
            
// //             <div>
// //               <h3 className="text-xs font-bold text-rose-600 uppercase tracking-wider mb-3 flex items-center gap-2">
// //                 High Priority
// //               </h3>
// //               <div className="space-y-3">
// //                 <div className="bg-rose-50 border border-rose-100 p-3 rounded-lg">
// //                   <p className="text-sm font-semibold text-slate-900 mb-1">Apollo Pharmacy</p>
// //                   <p className="text-xs text-slate-600 flex justify-between">
// //                     <span>Payment Collection</span>
// //                     <span className="text-rose-600 font-medium">5 days ago</span>
// //                   </p>
// //                 </div>
// //                 <div className="bg-rose-50 border border-rose-100 p-3 rounded-lg">
// //                   <p className="text-sm font-semibold text-slate-900 mb-1">Dr. Sharma Clinic</p>
// //                   <p className="text-xs text-slate-600 flex justify-between">
// //                     <span>Contract Renewal</span>
// //                     <span className="text-rose-600 font-medium">2 days ago</span>
// //                   </p>
// //                 </div>
// //               </div>
// //             </div>

// //             <div>
// //               <h3 className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-3 flex items-center gap-2">
// //                 Medium Priority
// //               </h3>
// //               <div className="space-y-3">
// //                 <div className="bg-amber-50 border border-amber-100 p-3 rounded-lg">
// //                   <p className="text-sm font-semibold text-slate-900 mb-1">HealthPlus Store</p>
// //                   <p className="text-xs text-slate-600 flex justify-between">
// //                     <span>Feedback Call</span>
// //                     <span className="text-amber-600 font-medium">Yesterday</span>
// //                   </p>
// //                 </div>
// //               </div>
// //             </div>

// //             <div>
// //               <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
// //                 Low Priority
// //               </h3>
// //               <div className="space-y-3">
// //                 <p className="text-sm text-slate-500 italic px-2">No low priority overdue items.</p>
// //               </div>
// //             </div>

// //           </div>
// //         </div>
// //       </div>
// //     </div>
// //   );
// // }

// ///////////////////////////////////////////////////////////////////////


// import { useState, useEffect } from 'react';
// import { Download, Filter, BellRing, CheckCircle2, AlertCircle, PhoneForwarded } from 'lucide-react';
// import {
//   PageHeader,
//   FilterBar,
//   SearchInput,
//   SelectFilter,
//   ActionButton,
//   TableCard,
//   DataTable,
//   Badge,
//   SummaryCard,
// } from './components/shared';
// import { type Column, type BadgeVariant } from './components/shared';

// interface FollowUpReminder {
//   id: string;
//   followUpId: string;
//   customerName: string;
//   followUpType: string;
//   assignedTo: string;
//   dueDate: string;
//   priority: 'High' | 'Medium' | 'Low';
//   reminderStatus: 'Sent' | 'Pending';
//   status: 'Pending' | 'Completed' | 'Overdue';
// }

// export default function FollowUpReminders() {
//   const [search, setSearch] = useState('');
//   const [statusFilter, setStatusFilter] = useState('');
//   const [followUps, setFollowUps] = useState<FollowUpReminder[]>([]);

//   // 1. Load Data on Component Mount
//   useEffect(() => {
//     loadFollowUps();
//   }, []);

//   const loadFollowUps = () => {
//     const storedFollowUps = localStorage.getItem('crm_followups');
//     let allFollowUps: FollowUpReminder[] = [];

//     if (storedFollowUps) {
//       try {
//         allFollowUps = [...JSON.parse(storedFollowUps)];
//       } catch (e) {
//         console.error("Error reading followups", e);
//       }
//     }

//     const today = new Date();
//     today.setHours(0, 0, 0, 0);

//     const processedData = allFollowUps.map(item => {
//       if (item.status === 'Completed') return item;

//       if (item.dueDate) {
//         const dueDate = new Date(item.dueDate);
        
//         if (!isNaN(dueDate.getTime())) {
//           dueDate.setHours(0, 0, 0, 0);
          
//           if (dueDate < today) {
//             return { ...item, status: 'Overdue' as const };
//           } else {
//             return { ...item, status: 'Pending' as const };
//           }
//         }
//       }
//       return item;
//     });

//     setFollowUps(processedData);
//     localStorage.setItem('crm_followups', JSON.stringify(processedData));
//   };

//   // 2. Complete Action Handler
//   const handleComplete = (id: string) => {
//     const updated = followUps.map(item => {
//       if (item.id === id) {
//         return { ...item, status: 'Completed' as const };
//       }
//       return item;
//     });
//     setFollowUps(updated);
//     localStorage.setItem('crm_followups', JSON.stringify(updated));
//   };

//   // 3. Export to CSV Logic
//   const handleExport = () => {
//     const headers = ['Follow-Up ID', 'Customer Name', 'Follow-Up Type', 'Assigned To', 'Due Date', 'Priority', 'Reminder Status', 'Status'];
    
//     const csvRows = filteredData.map(item => [
//       item.followUpId || '',
//       item.customerName || '',
//       item.followUpType || '',
//       item.assignedTo || '',
//       item.dueDate || '',
//       item.priority || '',
//       item.reminderStatus || '',
//       item.status || ''
//     ]);

//     const csvContent = [
//       headers.join(','),
//       ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
//     ].join('\n');

//     const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
//     const link = document.createElement("a");
//     const url = URL.createObjectURL(blob);
    
//     link.setAttribute("href", url);
//     link.setAttribute("download", `FollowUp_Reminders_${new Date().toISOString().split('T')[0]}.csv`);
//     link.style.visibility = 'hidden';
    
//     document.body.appendChild(link);
//     link.click();
//     document.body.removeChild(link);
//   };

//   const columns: Column<FollowUpReminder>[] = [
//     { key: 'followUpId', label: 'Follow-Up ID', render: (row) => <span className="font-semibold text-slate-900">{row.followUpId || '-'}</span> },
//     { key: 'customerName', label: 'Customer / Lead Name', render: (row) => <span className="font-medium text-slate-800">{row.customerName || 'Unknown'}</span> },
//     { key: 'followUpType', label: 'Follow-Up Type', render: (row) => <span>{row.followUpType || '-'}</span> },
//     { key: 'assignedTo', label: 'Assigned To', render: (row) => <span>{row.assignedTo || '-'}</span> },
//     { key: 'dueDate', label: 'Due Date', render: (row) => <span className="font-medium text-slate-700">{row.dueDate || '-'}</span> },
//     {
//       key: 'priority',
//       label: 'Priority',
//       render: (row) => (
//         <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
//           row.priority === 'High' ? 'bg-rose-100 text-rose-700' :
//           row.priority === 'Medium' ? 'bg-amber-100 text-amber-700' :
//           'bg-slate-100 text-slate-700'
//         }`}>
//           {row.priority || 'Low'}
//         </span>
//       )
//     },
//     {
//       key: 'reminderStatus',
//       label: 'Reminder Status',
//       render: (row) => {
//         // 🛡️ Strict TypeScript Safety Achieved!
//         let variant: BadgeVariant = 'neutral';
//         if (row.reminderStatus === 'Sent') variant = 'success';
//         else if (row.reminderStatus === 'Pending') variant = 'warning';
//         return <Badge variant={variant}>{row.reminderStatus || 'Pending'}</Badge>;
//       },
//     },
//     {
//       key: 'status',
//       label: 'Status',
//       render: (row) => {
//         // 🛡️ Strict TypeScript Safety Achieved!
//         let variant: BadgeVariant = 'neutral';
//         if (row.status === 'Completed') variant = 'success';
//         else if (row.status === 'Pending') variant = 'warning';
//         else if (row.status === 'Overdue') variant = 'danger';
//         return <Badge variant={variant}>{row.status || 'Pending'}</Badge>;
//       },
//     },
//     {
//       key: 'id',
//       label: 'Actions',
//       render: (row) => (
//         <div className="flex gap-2">
//           <button className="text-xs bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-2 py-1 rounded font-medium transition-colors">View</button>
//           <button className="text-xs bg-slate-50 text-slate-600 hover:bg-slate-100 px-2 py-1 rounded font-medium transition-colors">Update</button>
//           {row.status !== 'Completed' && (
//             <button 
//               onClick={() => handleComplete(row.id)}
//               className="text-xs bg-emerald-50 text-emerald-600 hover:bg-emerald-100 px-2 py-1 rounded font-medium transition-colors"
//             >
//               Complete
//             </button>
//           )}
//         </div>
//       )
//     }
//   ];

//   const filteredData = followUps.filter((item) => {
//     const custName = item.customerName || '';
//     const assigned = item.assignedTo || '';

//     const matchSearch = custName.toLowerCase().includes(search.toLowerCase()) || 
//                         assigned.toLowerCase().includes(search.toLowerCase());
//     const matchStatus = statusFilter ? item.status === statusFilter : true;
//     return matchSearch && matchStatus;
//   });

//   const pendingCount = followUps.filter(f => f.status === 'Pending').length;
//   const completedCount = followUps.filter(f => f.status === 'Completed').length;
//   const overdueCount = followUps.filter(f => f.status === 'Overdue').length;
  
//   const today = new Date();
//   today.setHours(0, 0, 0, 0);
//   const todayCount = followUps.filter(f => {
//     if (!f.dueDate) return false;
//     const d = new Date(f.dueDate);
//     d.setHours(0, 0, 0, 0);
//     return d.getTime() === today.getTime() && f.status !== 'Completed';
//   }).length;

//   const overdueHigh = followUps.filter(f => f.status === 'Overdue' && f.priority === 'High');
//   const overdueMedium = followUps.filter(f => f.status === 'Overdue' && f.priority === 'Medium');
//   const overdueLow = followUps.filter(f => f.status === 'Overdue' && f.priority === 'Low');

//   const getDaysAgo = (dueDateStr: string) => {
//     if (!dueDateStr) return 'Unknown';
//     const d = new Date(dueDateStr);
//     const diffTime = Math.abs(new Date().getTime() - d.getTime());
//     const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
//     return `${diffDays} days ago`;
//   };

//   return (
//     <div className="animate-in fade-in duration-500">
//       <PageHeader
//         title="Follow-Up Reminder Center"
//         subtitle="Monitor scheduled follow-ups and ensure timely customer engagement."
//         actions={
//           <ActionButton onClick={handleExport} variant="secondary" icon={<Download className="w-4 h-4" />}>
//             Export Follow-Ups
//           </ActionButton>
//         }
//       />

//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
//         <SummaryCard
//           title="Pending Follow-Ups"
//           value={pendingCount.toString()}
//           subtitle="Currently active"
//           icon={<BellRing className="w-6 h-6" />}
//           colorClass="text-amber-600"
//           bgClass="bg-amber-50"
//         />
//         <SummaryCard
//           title="Today's Follow-Ups"
//           value={todayCount.toString()}
//           subtitle="Scheduled for today"
//           icon={<PhoneForwarded className="w-6 h-6" />}
//           colorClass="text-blue-600"
//           bgClass="bg-blue-50"
//         />
//         <SummaryCard
//           title="Completed Follow-Ups"
//           value={completedCount.toString()}
//           subtitle="This month"
//           icon={<CheckCircle2 className="w-6 h-6" />}
//           colorClass="text-emerald-600"
//           bgClass="bg-emerald-50"
//         />
//         <SummaryCard
//           title="Overdue Follow-Ups"
//           value={overdueCount.toString()}
//           subtitle="Needs immediate action"
//           icon={<AlertCircle className="w-6 h-6" />}
//           colorClass="text-rose-600" 
//           bgClass="bg-rose-50"
//         />
//       </div>

//       <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 mb-8">
//         <div className="xl:col-span-3 flex flex-col gap-4">
//           <FilterBar>
//             <SearchInput value={search} onChange={setSearch} placeholder="Search customer or assigned employee..." />
//             <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
//             <div className="flex items-center gap-2">
//               <Filter className="w-4 h-4 text-slate-400" />
//               <span className="text-sm font-medium text-slate-600">Filters:</span>
//             </div>
//             <SelectFilter
//               value={statusFilter}
//               onChange={setStatusFilter}
//               options={[
//                 { label: 'Pending', value: 'Pending' },
//                 { label: 'Completed', value: 'Completed' },
//                 { label: 'Overdue', value: 'Overdue' },
//               ]}
//               placeholder="Status"
//             />
//           </FilterBar>

//           <TableCard>
//             <DataTable
//               columns={columns}
//               data={filteredData}
//               emptyMessage="No follow-up reminders found. Create follow-ups in the CRM module first!"
//             />
//           </TableCard>
//         </div>

//         <div className="xl:col-span-1">
//           <h2 className="text-lg font-semibold text-slate-900 mb-4">Overdue Tracker</h2>
//           <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-6">
            
//             <div>
//               <h3 className="text-xs font-bold text-rose-600 uppercase tracking-wider mb-3 flex items-center gap-2">
//                 High Priority
//               </h3>
//               <div className="space-y-3">
//                 {overdueHigh.length > 0 ? overdueHigh.map(item => (
//                   <div key={item.id} className="bg-rose-50 border border-rose-100 p-3 rounded-lg">
//                     <p className="text-sm font-semibold text-slate-900 mb-1">{item.customerName}</p>
//                     <p className="text-xs text-slate-600 flex justify-between">
//                       <span>{item.followUpType}</span>
//                       <span className="text-rose-600 font-medium">{getDaysAgo(item.dueDate)}</span>
//                     </p>
//                   </div>
//                 )) : (
//                   <p className="text-sm text-slate-500 italic px-2">No high priority overdue items.</p>
//                 )}
//               </div>
//             </div>

//             <div>
//               <h3 className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-3 flex items-center gap-2">
//                 Medium Priority
//               </h3>
//               <div className="space-y-3">
//                 {overdueMedium.length > 0 ? overdueMedium.map(item => (
//                   <div key={item.id} className="bg-amber-50 border border-amber-100 p-3 rounded-lg">
//                     <p className="text-sm font-semibold text-slate-900 mb-1">{item.customerName}</p>
//                     <p className="text-xs text-slate-600 flex justify-between">
//                       <span>{item.followUpType}</span>
//                       <span className="text-amber-600 font-medium">{getDaysAgo(item.dueDate)}</span>
//                     </p>
//                   </div>
//                 )) : (
//                   <p className="text-sm text-slate-500 italic px-2">No medium priority overdue items.</p>
//                 )}
//               </div>
//             </div>

//             <div>
//               <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
//                 Low Priority
//               </h3>
//               <div className="space-y-3">
//                 {overdueLow.length > 0 ? overdueLow.map(item => (
//                   <div key={item.id} className="bg-slate-50 border border-slate-200 p-3 rounded-lg">
//                     <p className="text-sm font-semibold text-slate-900 mb-1">{item.customerName}</p>
//                     <p className="text-xs text-slate-600 flex justify-between">
//                       <span>{item.followUpType}</span>
//                       <span className="text-slate-600 font-medium">{getDaysAgo(item.dueDate)}</span>
//                     </p>
//                   </div>
//                 )) : (
//                   <p className="text-sm text-slate-500 italic px-2">No low priority overdue items.</p>
//                 )}
//               </div>
//             </div>

//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
//////////////////////////////////////////////////////////////

import { useState, useEffect } from 'react';
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
import { type Column, type BadgeVariant } from './components/shared';
import { followUpService } from '../../services/followUpService';

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

export default function FollowUpReminders() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [followUps, setFollowUps] = useState<FollowUpReminder[]>([]);

  // 1. Load Data on Component Mount
  useEffect(() => {
    loadFollowUps();

    // Also merge backend API follow-ups
    followUpService.getAll().then((apiFollowUps) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const apiMapped: FollowUpReminder[] = apiFollowUps.map((f) => {
        const d = new Date(f.followUpDate);
        let computedStatus: FollowUpReminder['status'] = 'Pending';
        if (!isNaN(d.getTime())) {
          d.setHours(0, 0, 0, 0);
          computedStatus = d < today ? 'Overdue' : f.status === 'COMPLETED' ? 'Completed' : 'Pending';
        }
        return {
          id: `api-fu-${f.id}`,
          followUpId: `FU-${String(f.id).padStart(4, '0')}`,
          customerName: f.doctorId ? `Doctor #${f.doctorId}` : f.chemistId ? `Chemist #${f.chemistId}` : 'General',
          followUpType: f.doctorId ? 'Doctor Follow-Up' : f.chemistId ? 'Chemist Follow-Up' : 'General Follow-Up',
          assignedTo: `MR #${f.mrId}`,
          dueDate: f.followUpDate,
          priority: 'Medium' as const,
          reminderStatus: 'Sent' as const,
          status: computedStatus,
        };
      });

      setFollowUps((prev) => {
        // Merge: dedupe by id prefix to avoid duplicates on re-render
        const existingIds = new Set(prev.map((p) => p.id));
        const newOnes = apiMapped.filter((a) => !existingIds.has(a.id));
        return [...newOnes, ...prev];
      });
    }).catch((err) => console.error('Failed to load backend follow-ups:', err));
  }, []);


  // const loadFollowUps = () => {
  //   // 1. Load CRM Pipeline Follow-Ups
  //   const storedFollowUps = localStorage.getItem('crm_followups');
  //   let rawCrm: any[] = [];
  //   if (storedFollowUps) {
  //     try {
  //       rawCrm = JSON.parse(storedFollowUps);
  //     } catch (e) {
  //       console.error("Error reading crm_followups", e);
  //     }
  //   }

  //   // 2. Load Doctor Visits follow-ups
  //   const storedDocVisits = localStorage.getItem('doctor_visits');
  //   let docList: any[] = [];
  //   if (storedDocVisits) {
  //     try { docList = JSON.parse(storedDocVisits); } catch {}
  //   }

  //   // 3. Load Chemist Visits follow-ups
  //   const storedChemistVisits = localStorage.getItem('chemist_visits');
  //   let chemistList: any[] = [];
  //   if (storedChemistVisits) {
  //     try { chemistList = JSON.parse(storedChemistVisits); } catch {}
  //   }

  //   const today = new Date();
  //   today.setHours(0, 0, 0, 0);

  //   // Map CRM follow-ups dynamically to resolve key mismatches
  //   const mappedCrm: FollowUpReminder[] = rawCrm.map((item: any) => {
  //     const id = item.id || Date.now().toString();
  //     const followUpId = item.followUpId || (id.startsWith('FU-') ? id : `FU-${id.slice(-3)}`);
  //     const customerName = item.customerName || item.contactName || 'Unknown Customer';
  //     const followUpType = item.followUpType || item.type || 'Lead Check-in';
  //     const assignedTo = item.assignedTo || 'activeMRName';
  //     const dueDate = item.dueDate || item.date || '';
  //     const priority = item.priority || 'Medium';
  //     const reminderStatus = item.reminderStatus || 'Sent';
      
  //     let computedStatus = item.status || 'Pending';
  //     if (computedStatus !== 'Completed' && dueDate) {
  //       const d = new Date(dueDate);
  //       if (!isNaN(d.getTime())) {
  //         d.setHours(0, 0, 0, 0);
  //         computedStatus = d < today ? 'Overdue' : 'Pending';
  //       }
  //     }
  //   let authUser = null;
  //   try {
  //     const authUserString = localStorage.getItem('authUser');
  //     authUser = authUserString ? JSON.parse(authUserString) : null;
  //   } catch {
  //     authUser = null;
  //   }
  //   const activeMRName = authUser?.fullName || authUser?.name || 'Medical Representative';
  //     return {
  //       id,
  //       followUpId,
  //       customerName,
  //       followUpType,
  //       assignedTo,
  //       dueDate,
  //       priority: priority as any,
  //       reminderStatus: reminderStatus as any,
  //       status: computedStatus as any
  //     };
  //   });

  //   // Map Doctor next follow-ups
  //   const mappedDoc: FollowUpReminder[] = docList
  //     .filter((v: any) => v.nextFollowUp && v.nextFollowUp.trim() !== '')
  //     .map((v: any) => {
  //       const d = new Date(v.nextFollowUp);
  //       let computedStatus = 'Pending';
  //       if (!isNaN(d.getTime())) {
  //         d.setHours(0, 0, 0, 0);
  //         computedStatus = d < today ? 'Overdue' : 'Pending';
  //       }

  //       return {
  //         id: `${v.id}_doc_fu`,
  //         followUpId: `FU-DOC-${v.id.slice(-3)}`,
  //         customerName: v.doctorName,
  //         followUpType: 'Doctor Follow-Up',
  //        // assignedTo: 'Priya Reddy',
  //        assignedTo: activeMRName,
  //         dueDate: v.nextFollowUp,
  //         priority: 'Medium' as const,
  //         reminderStatus: 'Sent' as const,
  //         status: computedStatus as any
  //       };
  //     });

  //   // Map Chemist next follow-ups
  //   const mappedChemist: FollowUpReminder[] = chemistList
  //     .filter((v: any) => v.nextFollowUp && v.nextFollowUp.trim() !== '')
  //     .map((v: any) => {
  //       const d = new Date(v.nextFollowUp);
  //       let computedStatus = 'Pending';
  //       if (!isNaN(d.getTime())) {
  //         d.setHours(0, 0, 0, 0);
  //         computedStatus = d < today ? 'Overdue' : 'Pending';
  //       }

  //       return {
  //         id: `${v.id}_chem_fu`,
  //         followUpId: `FU-CHM-${v.id.slice(-3)}`,
  //         customerName: v.shopName || v.chemistName,
  //         followUpType: 'Chemist Follow-Up',
  //        // assignedTo: 'Priya Reddy',
  //        assignedTo: activeMRName,
  //         dueDate: v.nextFollowUp,
  //         priority: 'Medium' as const,
  //         reminderStatus: 'Sent' as const,
  //         status: computedStatus as any
  //       };
  //     });

  //   // Combine CRM pipeline followups with doctor & chemist followups
  //   const combined = [...mappedCrm, ...mappedDoc, ...mappedChemist];
  const loadFollowUps = () => {
    // 1. Load CRM Pipeline Follow-Ups from LocalStorage
    const storedFollowUps = localStorage.getItem('crm_followups');
    let rawCrm: any[] = [];
    if (storedFollowUps) {
      try {
        rawCrm = JSON.parse(storedFollowUps);
      } catch (e) {
        console.error("Error reading crm_followups", e);
      }
    }

    // 2. Load Doctor Visits follow-ups from LocalStorage
    const storedDocVisits = localStorage.getItem('doctor_visits');
    let docList: any[] = [];
    if (storedDocVisits) {
      try { 
        docList = JSON.parse(storedDocVisits); 
      } catch {}
    }

    // 3. Load Chemist Visits follow-ups from LocalStorage
    const storedChemistVisits = localStorage.getItem('chemist_visits');
    let chemistList: any[] = [];
    if (storedChemistVisits) {
      try { 
        chemistList = JSON.parse(storedChemistVisits); 
      } catch {}
    }

    // 4. Retrieve the active representative dynamically from authUser
    let authUser = null;
    try {
      const authUserString = localStorage.getItem('authUser');
      authUser = authUserString ? JSON.parse(authUserString) : null;
    } catch {
      authUser = null;
    }
    const activeMRName = authUser?.fullName || authUser?.name || 'Medical Representative';

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Map CRM follow-ups dynamically to resolve key mismatches
    const mappedCrm: FollowUpReminder[] = rawCrm.map((item: any) => {
      const safeId = String(item.id || Date.now());
      const followUpId = item.followUpId || (safeId.startsWith('FU-') ? safeId : `FU-${safeId.slice(-3)}`);
      const customerName = item.customerName || item.contactName || 'Unknown Customer';
      const followUpType = item.followUpType || item.type || 'Lead Check-in';
      const assignedTo = item.assignedTo || activeMRName; // ✅ Uses parent variable dynamically
      const dueDate = item.dueDate || item.date || '';
      const priority = item.priority || 'Medium';
      const reminderStatus = item.reminderStatus || 'Sent';
      
      let computedStatus = item.status || 'Pending';
      if (computedStatus !== 'Completed' && dueDate) {
        const d = new Date(dueDate);
        if (!isNaN(d.getTime())) {
          d.setHours(0, 0, 0, 0);
          computedStatus = d < today ? 'Overdue' : 'Pending';
        }
      }

      return {
        id: safeId,
        followUpId,
        customerName,
        followUpType,
        assignedTo,
        dueDate,
        priority: priority as any,
        reminderStatus: reminderStatus as any,
        status: computedStatus as any
      };
    });

    // Map Doctor next follow-ups
    const mappedDoc: FollowUpReminder[] = docList
      .filter((v: any) => v.nextFollowUp && v.nextFollowUp.trim() !== '')
      .map((v: any) => {
        const d = new Date(v.nextFollowUp);
        let computedStatus = 'Pending';
        if (!isNaN(d.getTime())) {
          d.setHours(0, 0, 0, 0);
          computedStatus = d < today ? 'Overdue' : 'Pending';
        }

        const safeId = String(v.id || Date.now());
        return {
          id: `${safeId}_doc_fu`,
          followUpId: `FU-DOC-${safeId.slice(-3)}`,
          customerName: v.doctorName,
          followUpType: 'Doctor Follow-Up',
          assignedTo: activeMRName, // ✅ Uses parent variable dynamically
          dueDate: v.nextFollowUp,
          priority: 'Medium' as const,
          reminderStatus: 'Sent' as const,
          status: computedStatus as any
        };
      });

    // Map Chemist next follow-ups
    const mappedChemist: FollowUpReminder[] = chemistList
      .filter((v: any) => v.nextFollowUp && v.nextFollowUp.trim() !== '')
      .map((v: any) => {
        const d = new Date(v.nextFollowUp);
        let computedStatus = 'Pending';
        if (!isNaN(d.getTime())) {
          d.setHours(0, 0, 0, 0);
          computedStatus = d < today ? 'Overdue' : 'Pending';
        }

        const safeId = String(v.id || Date.now());
        return {
          id: `${safeId}_chem_fu`,
          followUpId: `FU-CHM-${safeId.slice(-3)}`,
          customerName: v.shopName || v.chemistName,
          followUpType: 'Chemist Follow-Up',
          assignedTo: activeMRName, // ✅ Uses parent variable dynamically
          dueDate: v.nextFollowUp,
          priority: 'Medium' as const,
          reminderStatus: 'Sent' as const,
          status: computedStatus as any
        };
      });

    // Combine CRM pipeline followups with doctor & chemist followups
    const combined = [...mappedCrm, ...mappedDoc, ...mappedChemist];
    setFollowUps(combined);
    
    // Save updated CRM statuses back to localStorage
    localStorage.setItem('crm_followups', JSON.stringify(mappedCrm));
  };

  // 2. Complete Action Handler
  const handleComplete = async (id: string) => {
    // If it's a real API follow-up
    if (id.startsWith('api-fu-')) {
      try {
        const rawId = id.replace('api-fu-', '');
        await followUpService.update(rawId, { status: 'COMPLETED' });
      } catch (e) {
        console.error('Failed to complete API follow-up', e);
      }
    } 
    // If it's a Doctor Follow-Up, clear nextFollowUp in doctor_visits
    else if (id.endsWith('_doc_fu')) {
      const docId = id.replace('_doc_fu', '');
      const storedDocVisits = localStorage.getItem('doctor_visits');
      if (storedDocVisits) {
        const list = JSON.parse(storedDocVisits);
        const updated = list.map((v: any) => String(v.id) === docId ? { ...v, nextFollowUp: '' } : v);
        localStorage.setItem('doctor_visits', JSON.stringify(updated));
      }
    } 
    // If it's a Chemist Follow-Up, clear nextFollowUp in chemist_visits
    else if (id.endsWith('_chem_fu')) {
      const chemId = id.replace('_chem_fu', '');
      const storedChemistVisits = localStorage.getItem('chemist_visits');
      if (storedChemistVisits) {
        const list = JSON.parse(storedChemistVisits);
        const updated = list.map((v: any) => String(v.id) === chemId ? { ...v, nextFollowUp: '' } : v);
        localStorage.setItem('chemist_visits', JSON.stringify(updated));
      }
    } 
    // If it's a CRM Follow-Up, update status in crm_followups
    else {
      const storedFollowUps = localStorage.getItem('crm_followups');
      if (storedFollowUps) {
        const list = JSON.parse(storedFollowUps);
        const updated = list.map((v: any) => String(v.id) === id ? { ...v, status: 'Completed' } : v);
        localStorage.setItem('crm_followups', JSON.stringify(updated));
      }
    }
    
    alert('✅ Follow-up marked as Completed!');
    loadFollowUps();
    
    // Refresh backend follow ups as well
    followUpService.getAll().then((apiFollowUps) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const apiMapped: FollowUpReminder[] = apiFollowUps.map((f) => {
        const d = new Date(f.followUpDate);
        let computedStatus: FollowUpReminder['status'] = 'Pending';
        if (!isNaN(d.getTime())) {
          d.setHours(0, 0, 0, 0);
          computedStatus = d < today ? 'Overdue' : f.status === 'COMPLETED' ? 'Completed' : 'Pending';
        }
        return {
          id: `api-fu-${f.id}`,
          followUpId: `FU-${String(f.id).padStart(4, '0')}`,
          customerName: f.doctorId ? `Doctor #${f.doctorId}` : f.chemistId ? `Chemist #${f.chemistId}` : f.title || 'General',
          followUpType: f.doctorId ? 'Doctor Follow-Up' : f.chemistId ? 'Chemist Follow-Up' : f.type || 'General Follow-Up',
          assignedTo: `MR #${f.mrId}`,
          dueDate: f.followUpDate,
          priority: 'Medium' as const,
          reminderStatus: 'Sent' as const,
          status: computedStatus,
        };
      });

      setFollowUps((prev) => {
        const existingIds = new Set(prev.filter(p => !p.id.startsWith('api-fu-')).map(p => p.id));
        const prevNonApi = prev.filter(p => !p.id.startsWith('api-fu-'));
        return [...apiMapped, ...prevNonApi];
      });
    }).catch(console.error);
  };

  // 3. Export to CSV Logic
  const handleExport = () => {
    const headers = ['Follow-Up ID', 'Customer Name', 'Follow-Up Type', 'Assigned To', 'Due Date', 'Priority', 'Reminder Status', 'Status'];
    
    const csvRows = filteredData.map(item => [
      item.followUpId || '',
      item.customerName || '',
      item.followUpType || '',
      item.assignedTo || '',
      item.dueDate || '',
      item.priority || '',
      item.reminderStatus || '',
      item.status || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `FollowUp_Reminders_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columns: Column<FollowUpReminder>[] = [
    { key: 'followUpId', label: 'Follow-Up ID', render: (row) => <span className="font-semibold text-slate-900">{row.followUpId || '-'}</span> },
    { key: 'customerName', label: 'Customer / Lead Name', render: (row) => <span className="font-medium text-slate-800">{row.customerName || 'Unknown'}</span> },
    { key: 'followUpType', label: 'Follow-Up Type', render: (row) => <span>{row.followUpType || '-'}</span> },
    { key: 'assignedTo', label: 'Assigned To', render: (row) => <span>{row.assignedTo || '-'}</span> },
    { key: 'dueDate', label: 'Due Date', render: (row) => <span className="font-medium text-slate-700">{row.dueDate || '-'}</span> },
    {
      key: 'priority',
      label: 'Priority',
      render: (row) => (
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
          row.priority === 'High' ? 'bg-rose-100 text-rose-700' :
          row.priority === 'Medium' ? 'bg-amber-100 text-amber-700' :
          'bg-slate-100 text-slate-700'
        }`}>
          {row.priority || 'Low'}
        </span>
      )
    },
    {
      key: 'reminderStatus',
      label: 'Reminder Status',
      render: (row) => {
        let variant: BadgeVariant = 'neutral';
        if (row.reminderStatus === 'Sent') variant = 'success';
        else if (row.reminderStatus === 'Pending') variant = 'warning';
        return <Badge variant={variant}>{row.reminderStatus || 'Pending'}</Badge>;
      },
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        let variant: BadgeVariant = 'neutral';
        if (row.status === 'Completed') variant = 'success';
        else if (row.status === 'Pending') variant = 'warning';
        else if (row.status === 'Overdue') variant = 'danger';
        return <Badge variant={variant}>{row.status || 'Pending'}</Badge>;
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
            <button 
              onClick={() => handleComplete(row.id)}
              className="text-xs bg-emerald-50 text-emerald-600 hover:bg-emerald-100 px-2 py-1 rounded font-medium transition-colors"
            >
              Complete
            </button>
          )}
        </div>
      )
    }
  ];

  const filteredData = followUps.filter((item) => {
    const custName = item.customerName || '';
    const assigned = item.assignedTo || '';

    const matchSearch = custName.toLowerCase().includes(search.toLowerCase()) || 
                        assigned.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  const pendingCount = followUps.filter(f => f.status === 'Pending').length;
  const completedCount = followUps.filter(f => f.status === 'Completed').length;
  const overdueCount = followUps.filter(f => f.status === 'Overdue').length;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayCount = followUps.filter(f => {
    if (!f.dueDate) return false;
    const d = new Date(f.dueDate);
    d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime() && f.status !== 'Completed';
  }).length;

  const overdueHigh = followUps.filter(f => f.status === 'Overdue' && f.priority === 'High');
  const overdueMedium = followUps.filter(f => f.status === 'Overdue' && f.priority === 'Medium');
  const overdueLow = followUps.filter(f => f.status === 'Overdue' && f.priority === 'Low');

  const getDaysAgo = (dueDateStr: string) => {
    if (!dueDateStr) return 'Unknown';
    const d = new Date(dueDateStr);
    const diffTime = Math.abs(new Date().getTime() - d.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    return `${diffDays} days ago`;
  };

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Follow-Up Reminder Center"
        subtitle="Monitor scheduled follow-ups and ensure timely customer engagement."
        actions={
          <ActionButton onClick={handleExport} variant="secondary" icon={<Download className="w-4 h-4" />}>
            Export Follow-Ups
          </ActionButton>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <SummaryCard
          title="Pending Follow-Ups"
          value={pendingCount.toString()}
          subtitle="Currently active"
          icon={<BellRing className="w-6 h-6" />}
          colorClass="text-amber-600"
          bgClass="bg-amber-50"
        />
        <SummaryCard
          title="Today's Follow-Ups"
          value={todayCount.toString()}
          subtitle="Scheduled for today"
          icon={<PhoneForwarded className="w-6 h-6" />}
          colorClass="text-blue-600"
          bgClass="bg-blue-50"
        />
        <SummaryCard
          title="Completed Follow-Ups"
          value={completedCount.toString()}
          subtitle="This month"
          icon={<CheckCircle2 className="w-6 h-6" />}
          colorClass="text-emerald-600"
          bgClass="bg-emerald-50"
        />
        <SummaryCard
          title="Overdue Follow-Ups"
          value={overdueCount.toString()}
          subtitle="Needs immediate action"
          icon={<AlertCircle className="w-6 h-6" />}
          colorClass="text-rose-600" 
          bgClass="bg-rose-50"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 mb-8">
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
              emptyMessage="No follow-up reminders found. Create follow-ups in the CRM or Log visits first!"
            />
          </TableCard>
        </div>

        <div className="xl:col-span-1">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Overdue Tracker</h2>
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-6">
            
            <div>
              <h3 className="text-xs font-bold text-rose-600 uppercase tracking-wider mb-3 flex items-center gap-2">
                High Priority
              </h3>
              <div className="space-y-3">
                {overdueHigh.length > 0 ? overdueHigh.map(item => (
                  <div key={item.id} className="bg-rose-50 border border-rose-100 p-3 rounded-lg">
                    <p className="text-sm font-semibold text-slate-900 mb-1">{item.customerName}</p>
                    <p className="text-xs text-slate-600 flex justify-between">
                      <span>{item.followUpType}</span>
                      <span className="text-rose-600 font-medium">{getDaysAgo(item.dueDate)}</span>
                    </p>
                  </div>
                )) : (
                  <p className="text-sm text-slate-500 italic px-2">No high priority overdue items.</p>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-3 flex items-center gap-2">
                Medium Priority
              </h3>
              <div className="space-y-3">
                {overdueMedium.length > 0 ? overdueMedium.map(item => (
                  <div key={item.id} className="bg-amber-50 border border-amber-100 p-3 rounded-lg">
                    <p className="text-sm font-semibold text-slate-900 mb-1">{item.customerName}</p>
                    <p className="text-xs text-slate-600 flex justify-between">
                      <span>{item.followUpType}</span>
                      <span className="text-amber-600 font-medium">{getDaysAgo(item.dueDate)}</span>
                    </p>
                  </div>
                )) : (
                  <p className="text-sm text-slate-500 italic px-2">No medium priority overdue items.</p>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                Low Priority
              </h3>
              <div className="space-y-3">
                {overdueLow.length > 0 ? overdueLow.map(item => (
                  <div key={item.id} className="bg-slate-50 border border-slate-200 p-3 rounded-lg">
                    <p className="text-sm font-semibold text-slate-900 mb-1">{item.customerName}</p>
                    <p className="text-xs text-slate-600 flex justify-between">
                      <span>{item.followUpType}</span>
                      <span className="text-slate-600 font-medium">{getDaysAgo(item.dueDate)}</span>
                    </p>
                  </div>
                )) : (
                  <p className="text-sm text-slate-500 italic px-2">No low priority overdue items.</p>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}