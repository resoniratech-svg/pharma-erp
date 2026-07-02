import { useEffect, useState } from 'react';
import { Users, Shield, Lock, } from 'lucide-react';
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

const initialRoles = [
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
  const [roles, setRoles] = useState(initialRoles);

  useEffect(() => {
    const savedRoles = localStorage.getItem("customRoles");

    if (savedRoles) {
      setRoles(JSON.parse(savedRoles));
    }
  }, []);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [selectedRole, setSelectedRole] = useState('Super Admin');

  const [showRoleModal, setShowRoleModal] = useState(false);

  const [selectedUser, setSelectedUser] = useState<UserRole | null>(null);

  const [showAssignRoleModal, setShowAssignRoleModal] = useState(false);

  const [assignedRole, setAssignedRole] = useState("");

  const [roleName, setRoleName] = useState("");
  const [roleCode, setRoleCode] = useState("");
  const [roleDesc, setRoleDesc] = useState("");
  const [roleStatus, setRoleStatus] = useState("Active");

  const handleCreateRole = () => {
    if (!roleName || !roleCode) {
      alert("Please fill in all required fields.");
      return;
    }

    const newRole = {
      name: roleName,
      users: 0,
    };

    const updatedRoles = [...roles, newRole];

    setRoles(updatedRoles);

    localStorage.setItem("customRoles", JSON.stringify(updatedRoles));

    setRoleName("");
    setRoleCode("");
    setRoleDesc("");
    setRoleStatus("Active");

    setShowRoleModal(false);
  };

  const columns: Column<UserRole>[] = [
    {
      key: "name",
      label: "User Name",
      render: (row) => (
        <span className="font-semibold text-slate-900">{row.name}</span>
      ),
    },
    { key: "email", label: "Email" },
    {
      key: "role",
      label: "Assigned Role",
      render: (row) => <Badge variant="purple">{row.role}</Badge>,
    },
    {
      key: "status",
      label: "Status",
      render: (row) => {
        const variant = row.status === "Active" ? "success" : "neutral";
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    },
    {
      key: "lastLogin",
      label: "Last Login",
      render: (row) => (
        <span className="text-slate-500 text-sm">{row.lastLogin}</span>
      ),
    },
    {
      key: "action",
      label: "Actions",
      render: (row) => (
        <ActionButton
          variant="ghost"
          className="text-violet-600 px-2 py-1"
          onClick={() => {
            setSelectedUser(row);
            setAssignedRole(row.role);
            setShowAssignRoleModal(true);
          }}
        >
          Assign Role
        </ActionButton>
      ),
    },
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
              onClick={() => setShowRoleModal(true)}
            >
              Add Role
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
          value={roles.length.toString()}
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
          {roles.map((role) => (
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

      {showRoleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center text-violet-600">
                  <Shield className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-slate-800">Add Role</h2>
              </div>
              <button
                onClick={() => setShowRoleModal(false)}
                className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg p-2 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 gap-5">
              {/* Role Name */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Role Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-colors"
                  placeholder="e.g. Finance Manager"
                />
              </div>

              {/* Role Code */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Role Code <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={roleCode}
                  onChange={(e) => setRoleCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-colors"
                  placeholder="e.g. FINANCE_MANAGER"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Description
                </label>
                <textarea
                  value={roleDesc}
                  onChange={(e) => setRoleDesc(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-colors resize-none"
                  placeholder="Brief description of the role responsibilities"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Status <span className="text-rose-500">*</span>
                </label>
                <select
                  value={roleStatus}
                  onChange={(e) => setRoleStatus(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-colors appearance-none cursor-pointer"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-slate-100">
              <ActionButton
                variant="secondary"
                onClick={() => setShowRoleModal(false)}
              >
                Cancel
              </ActionButton>

              <ActionButton variant="primary" onClick={handleCreateRole}>
                Create Role
              </ActionButton>
            </div>
          </div>
        </div>
      )}

      {showAssignRoleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-5">Assign Role</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">User</label>

                <input
                  value={selectedUser?.name || ""}
                  disabled
                  className="w-full border rounded-lg px-3 py-2 bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Role</label>

                <select
                  value={assignedRole}
                  onChange={(e) => setAssignedRole(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  {roles.map((role) => (
                    <option key={role.name} value={role.name}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <ActionButton
                variant="secondary"
                onClick={() => setShowAssignRoleModal(false)}
              >
                Cancel
              </ActionButton>

              <ActionButton
                variant="primary"
                onClick={() => {
                  alert("Role assigned successfully");

                  setShowAssignRoleModal(false);
                }}
              >
                Save
              </ActionButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
