import { useState } from 'react';
import { Users, Shield, Lock } from 'lucide-react';
import {
  PageHeader,
  FilterBar,
  SearchInput,
  SelectFilter,
  ActionButton,
  TableCard,
  DataTable,
  Badge,
  ExportButton,
  SummaryCard
} from './components/shared';
import { type Column } from './components/shared';

interface UserRole {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'Active' | 'Inactive';
  lastLogin: string;
}

const roles = [
  { name: 'Super Admin', users: 1 },
  { name: 'Warehouse Manager', users: 2 },
  { name: 'Accountant', users: 2 },
  { name: 'Distributor', users: 4 },
  { name: 'Retailer', users: 8 },
  { name: 'Medical Representative', users: 6 },
  { name: 'Transport Staff', users: 3 },
];

const mockUsers: UserRole[] = [
  { id: '1', name: 'Ramesh Patel', email: 'ramesh@pharma.com', role: 'Super Admin', status: 'Active', lastLogin: 'Today, 09:15 AM' },
  { id: '2', name: 'Suresh Kumar', email: 'suresh@pharma.com', role: 'Warehouse Manager', status: 'Active', lastLogin: 'Today, 10:30 AM' },
  { id: '3', name: 'Amit Singh', email: 'amit@pharma.com', role: 'Accountant', status: 'Inactive', lastLogin: '12-Oct-2026' },
  { id: '4', name: 'Priya Sharma', email: 'priya@pharma.com', role: 'Distributor', status: 'Active', lastLogin: 'Yesterday, 04:45 PM' },
];

export default function RoleBasedAccess() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [selectedRole, setSelectedRole] = useState('Super Admin');

  const [showAssignModal, setShowAssignModal] = useState(false);

  const [employeeId, setEmployeeId] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("Active");

  const columns: Column<UserRole>[] = [
    { key: 'name', label: 'User Name', render: (row) => <span className="font-semibold text-slate-900">{row.name}</span> },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Assigned Role', render: (row) => <Badge variant="purple">{row.role}</Badge> },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const variant = row.status === 'Active' ? 'success' : 'neutral';
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    },
    { key: 'lastLogin', label: 'Last Login', render: (row) => <span className="text-slate-500 text-sm">{row.lastLogin}</span> },
    {
      key: 'action',
      label: 'Actions',
      render: () => <ActionButton variant="ghost" className="text-violet-600 px-2 py-1">Manage</ActionButton>
    }
  ];

  const filteredData = mockUsers.filter((item) => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const activeRole = selectedRole || roleFilter;

    const matchRole = activeRole ? item.role === activeRole : true;
    return matchSearch && matchRole;
  });

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Role Based Access Control"
        subtitle="Manage system roles, assign permissions, and monitor user access."
        breadcrumb={[{ label: "Super Admin" }, { label: "Role Based Access" }]}
        actions={
          <>
            <ExportButton
              onClick={() => {
                const csvContent = [
                  ["Name", "Email", "Role", "Status", "Last Login"],
                  ...filteredData.map((user) => [
                    user.name,
                    user.email,
                    user.role,
                    user.status,
                    user.lastLogin,
                  ]),
                ]
                  .map((row) => row.join(","))
                  .join("\n");

                const blob = new Blob([csvContent], {
                  type: "text/csv;charset=utf-8;",
                });

                const url = URL.createObjectURL(blob);

                const link = document.createElement("a");
                link.href = url;
                link.download = "RoleBasedAccess.csv";

                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                URL.revokeObjectURL(url);
              }}
            />
            <ActionButton
              variant="primary"
              icon={<Shield className="w-4 h-4" />}
              onClick={() => setShowAssignModal(true)}
            >
              Create User
            </ActionButton>
          </>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <SummaryCard
          title="Total Users"
          value="26"
          icon={<Users className="w-6 h-6" />}
          colorClass="text-violet-600"
          bgClass="bg-violet-100"
        />

        <SummaryCard
          title="Active Users"
          value="22"
          icon={<Users className="w-6 h-6" />}
          colorClass="text-green-600"
          bgClass="bg-green-100"
        />

        <SummaryCard
          title="Total Roles"
          value="7"
          icon={<Shield className="w-6 h-6" />}
          colorClass="text-blue-600"
          bgClass="bg-blue-100"
        />

        <SummaryCard
          title="Locked Accounts"
          value="1"
          icon={<Lock className="w-6 h-6" />}
          colorClass="text-red-600"
          bgClass="bg-red-100"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-2 bg-white p-4 rounded-2xl border border-slate-200">
          <h3 className="font-semibold text-slate-800 mb-3 px-2">
            Role Management
          </h3>
          {roles.map((role, idx) => (
            <div
              key={role.name}
              onClick={() => setSelectedRole(role.name)}
              className={`px-4 py-3 rounded-lg border cursor-pointer transition-colors ${
                selectedRole === role.name
                  ? "bg-violet-50 text-violet-700 border-violet-200 font-semibold"
                  : "text-slate-700 border-transparent hover:border-slate-200 hover:bg-slate-50"
              }`}
            >
              <div className="flex justify-between items-center">
                <span>{role.name}</span>

                <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600">
                  {role.users}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-3">
          <FilterBar>
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search user..."
            />
            <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
            <SelectFilter
              value={roleFilter}
              onChange={setRoleFilter}
              options={roles.map((role) => ({
                label: role.name,
                value: role.name,
              }))}
              placeholder="All Roles"
            />
          </FilterBar>

          <TableCard>
            <DataTable columns={columns} data={filteredData} />
          </TableCard>
        </div>
      </div>

      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold">Create User</h2>

              <button
                onClick={() => setShowAssignModal(false)}
                className="text-slate-500 hover:text-slate-700 text-xl"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Employee ID */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Employee ID
                </label>

                <input
                  type="text"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="EMP001"
                />
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Full Name
                </label>

                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Enter Full Name"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Enter Email"
                />
              </div>

              {/* Mobile */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Mobile Number
                </label>

                <input
                  type="text"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Enter Mobile Number"
                />
              </div>

              {/* Username */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Username
                </label>

                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Enter Username"
                />
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium mb-2">Role</label>

                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="">Select Role</option>

                  {roles.map((item) => (
                    <option key={item.name} value={item.name}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Password
                </label>

                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Enter Password"
                />
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Confirm Password
                </label>

                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Confirm Password"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium mb-2">Status</label>

                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <ActionButton
                variant="secondary"
                onClick={() => setShowAssignModal(false)}
              >
                Cancel
              </ActionButton>

              <ActionButton
                variant="primary"
                onClick={() => {
                  alert("User Created Successfully");
                  setShowAssignModal(false);
                }}
              >
                Create User
              </ActionButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
