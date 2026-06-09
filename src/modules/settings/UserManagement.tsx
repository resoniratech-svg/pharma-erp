import { useState } from 'react';
import { UserPlus, Settings2 } from 'lucide-react';
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

interface AppUser {
  id: string;
  name: string;
  email: string;
  role: string;
  branch: string;
  status: 'Active' | 'Locked' | 'Inactive';
}

const mockData: AppUser[] = [
  { id: '1', name: 'Admin User', email: 'admin@pharmatech.com', role: 'Super Admin', branch: 'HQ-MUM', status: 'Active' },
  { id: '2', name: 'Jane Smith', email: 'jane@pharmatech.com', role: 'Inventory Manager', branch: 'BR-PUN', status: 'Active' },
  { id: '3', name: 'John Doe', email: 'john@pharmatech.com', role: 'Billing Executive', branch: 'HQ-MUM', status: 'Locked' },
];

export default function UserManagement() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const columns: Column<AppUser>[] = [
    { key: 'name', label: 'User Name', render: (row) => <span className="font-semibold text-slate-900">{row.name}</span> },
    { key: 'email', label: 'Email', render: (row) => <span className="text-slate-500">{row.email}</span> },
    { key: 'role', label: 'Assigned Role', render: (row) => <Badge variant="purple">{row.role}</Badge> },
    { key: 'branch', label: 'Branch' },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const variant = row.status === 'Active' ? 'success' : row.status === 'Locked' ? 'danger' : 'neutral';
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    },
    {
      key: 'action',
      label: '',
      render: () => <ActionButton variant="ghost" className="text-slate-500 text-xs px-2 py-1"><Settings2 className="w-4 h-4" /></ActionButton>
    }
  ];

  const filteredData = mockData.filter((item) => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter ? item.role === roleFilter : true;
    return matchSearch && matchRole;
  });

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="User Management"
        subtitle="Manage employee access, accounts, and application logins."
        actions={
          <ActionButton variant="primary" icon={<UserPlus className="w-4 h-4" />}>Add User</ActionButton>
        }
      />

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search user..." />
        <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
        <SelectFilter
          value={roleFilter}
          onChange={setRoleFilter}
          options={[
            { label: 'Super Admin', value: 'Super Admin' },
            { label: 'Inventory Manager', value: 'Inventory Manager' },
            { label: 'Billing Executive', value: 'Billing Executive' },
          ]}
          placeholder="All Roles"
        />
      </FilterBar>

      <TableCard>
        <DataTable
          columns={columns}
          data={filteredData}
          emptyMessage="No users found."
        />
      </TableCard>
    </div>
  );
}
