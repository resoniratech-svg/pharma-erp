import { useState, useEffect } from 'react';
import { Plus, Filter, Download, Trash2 } from 'lucide-react';
import {
  PageHeader,
  FilterBar,
  SearchInput,
  SelectFilter,
  ActionButton,
  TableCard,
  DataTable,
  Drawer,
  DrawerField,
  Badge,
} from '../products/components/shared';
import { warehouseService } from '../../services/warehouseService';
import authService from "../../services/authService";
import  activityLogService  from "../../services/activityLogService";
import * as XLSX from "xlsx";

interface Warehouse {
  id: string;
  code: string;
  name: string;
  type: string;
  branch: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  country: string;
  pinCode: string;
  gstNumber: string;
  licenseNumber: string;
  remarks: string;
  status: "Active" | "Inactive";
  createdAt: string;
  createdBy: string;
  lastModified: string;
}



const WAREHOUSE_TYPES = [
  "Main Warehouse",
  "Regional Warehouse",
  "Distribution Warehouse",
  "Cold Storage",
  "Returns Warehouse",
];

export default function WarehouseMaster() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  useEffect(() => {
    const saved = warehouseService.getAll();
    setWarehouses(saved);
  }, []);
 
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);
  const [warehouseToDelete, setWarehouseToDelete] = useState<Warehouse | null>(null);
  
  const [showFormModal, setShowFormModal] = useState(false);
  const [isEditingModal, setIsEditingModal] = useState(false);

  const currentUser = authService.getCurrentUser();

  const defaultNewWarehouse: Partial<Warehouse> = {
    code: "",
    name: "",
    type: "Main Warehouse",
    status: "Active",
    branch: "",
    contactPerson: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "",
    country: "",
    pinCode: "",
    gstNumber: "",
    licenseNumber: "",
    remarks: "",
  };

  const [newWarehouse, setNewWarehouse] = useState<Partial<Warehouse>>(defaultNewWarehouse);

  const handleSave = () => {
    if (!newWarehouse.code || !newWarehouse.name) {
      alert("Warehouse Code and Warehouse Name are required.");
      return;
    }

    const duplicate = warehouses.find(
      (w) =>
        w.code.trim().toLowerCase() ===
          newWarehouse.code?.trim().toLowerCase() && w.id !== newWarehouse.id,
    );

    if (duplicate) {
      alert("Warehouse Code already exists.");
      return;
    }

   if (isEditingModal) {
     const updatedWarehouse = {
       ...newWarehouse,
       lastModified: new Date().toISOString(),
     } as Warehouse;

     setWarehouses(
       warehouses.map((w) =>
         w.id === updatedWarehouse.id ? updatedWarehouse : w,
       ),
     );

     warehouseService.updateWarehouse(updatedWarehouse.id, updatedWarehouse);
     activityLogService.addLog({
       userId: currentUser?.id,
       userName: currentUser?.fullName,
       action: "Warehouse Updated",
       module: "Warehouse Master",
     });
   } else {
     const createdData: Warehouse = {
       ...(newWarehouse as Warehouse),
       id: Date.now().toString(),
       createdAt: new Date().toISOString(),
       createdBy: currentUser?.fullName ?? "System Admin",
       lastModified: new Date().toISOString(),
     };

     setWarehouses([...warehouses, createdData]);

     warehouseService.addWarehouse(createdData);
     activityLogService.addLog({
       userId: currentUser?.id,
       userName: currentUser?.fullName,
       action: "Warehouse Created",
       module: "Warehouse Master",
     });
   }
    setShowFormModal(false);
  };

  const handleDelete = () => {
    if (!warehouseToDelete) return;

    setWarehouses(warehouses.filter((w) => w.id !== warehouseToDelete.id));

    warehouseService.deleteWarehouse(warehouseToDelete.id);
    activityLogService.addLog({
      userId: currentUser?.id,
      userName: currentUser?.fullName,
      action: "Warehouse Deleted",
      module: "Warehouse Master",
    });

    setWarehouseToDelete(null);
  };

  const columns = [
    { key: "code", label: "Warehouse Code" },
    {
      key: "name",
      label: "Warehouse Name",
      render: (row: Warehouse) => (
        <div>
          <p className="font-medium text-slate-900">{row.name}</p>
        </div>
      ),
    },
    { key: "type", label: "Warehouse Type" },
    { key: "branch", label: "Branch" },
    { key: "contactPerson", label: "Contact Person" },
    { key: "phone", label: "Phone Number" },
    {
      key: "status",
      label: "Status",
      render: (row: Warehouse) => (
        <Badge variant={row.status === "Active" ? "success" : "neutral"}>
          {row.status}
        </Badge>
      ),
    },
    {
      key: "id",
      label: "Actions",
      render: (row: Warehouse) => (
        <div className="flex gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedWarehouse(row);
            }}
            className="text-violet-600 font-medium hover:text-violet-800"
          >
            View
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setNewWarehouse(row);
              setIsEditingModal(true);
              setShowFormModal(true);
            }}
            className="text-emerald-600 font-medium hover:text-emerald-800"
            title="Edit"
          >
            Edit
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setWarehouseToDelete(row);
            }}
            className="text-rose-600 font-medium hover:text-rose-800"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const filteredData = warehouses.filter((item) => {
    const matchSearch = item.code.toLowerCase().includes(search.toLowerCase()) || item.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  const getFormattedDate = () => {
    const d = new Date();

    const yyyy = d.getFullYear();

    const mm = String(d.getMonth() + 1).padStart(2, "0");

    const dd = String(d.getDate()).padStart(2, "0");

    return `${yyyy}${mm}${dd}`;
  };

  const handleExport = () => {
    const exportData = filteredData.map((row) => ({
      "Warehouse Code": row.code,
      "Warehouse Name": row.name,
      "Warehouse Type": row.type,
      Branch: row.branch,
      "Contact Person": row.contactPerson,
      Phone: row.phone,
      Email: row.email,
      City: row.city,
      State: row.state,
      Country: row.country,
      Status: row.status,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Warehouse Master");

    const fileName = `warehouse_master_${getFormattedDate()}.xlsx`;

    XLSX.writeFile(workbook, fileName);
  };

  const openNewWarehouseModal = () => {
    setNewWarehouse(defaultNewWarehouse);
    setIsEditingModal(false);
    setShowFormModal(true);
  };

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Warehouse Master"
        subtitle="Manage all warehouses used for inventory storage and stock movement."
        actions={
          <>
            <ActionButton
              variant="secondary"
              icon={<Download className="w-4 h-4" />}
              onClick={handleExport}
            >
              Export
            </ActionButton>
            <ActionButton
              icon={<Plus className="w-4 h-4" />}
              onClick={openNewWarehouseModal}
            >
              Add Warehouse
            </ActionButton>
          </>
        }
      />

      <FilterBar>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by Warehouse Name, Warehouse Code"
        />
        <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-600">Filters:</span>
        </div>
        <SelectFilter
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { label: "Active", value: "Active" },
            { label: "Inactive", value: "Inactive" },
          ]}
          placeholder="All Status"
        />
      </FilterBar>

      <TableCard>
        <DataTable
          columns={columns}
          data={filteredData}
          onRowClick={(row) => setSelectedWarehouse(row)}
          emptyMessage="No warehouses found matching your criteria."
        />
      </TableCard>

      {/* Shared Create / Edit Form Modal */}
      {showFormModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">
                {isEditingModal ? "Edit Warehouse" : "Add Warehouse"}
              </h2>
              <button
                onClick={() => setShowFormModal(false)}
                className="text-slate-500 hover:text-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              {/* Section 1: Warehouse Information */}
              <section>
                <h3 className="text-sm font-semibold text-slate-900 mb-3 border-b pb-1">
                  Warehouse Information
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Warehouse Code *
                    </label>
                    <input
                      value={newWarehouse.code}
                      onChange={(e) =>
                        setNewWarehouse({
                          ...newWarehouse,
                          code: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Warehouse Name *
                    </label>
                    <input
                      value={newWarehouse.name}
                      onChange={(e) =>
                        setNewWarehouse({
                          ...newWarehouse,
                          name: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Warehouse Type *
                    </label>
                    <select
                      value={newWarehouse.type}
                      onChange={(e) =>
                        setNewWarehouse({
                          ...newWarehouse,
                          type: e.target.value as any,
                        })
                      }
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 bg-white text-sm"
                    >
                      <option value="">Select Type</option>
                      {WAREHOUSE_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Status *
                    </label>
                    <select
                      value={newWarehouse.status}
                      onChange={(e) =>
                        setNewWarehouse({
                          ...newWarehouse,
                          status: e.target.value as any,
                        })
                      }
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 bg-white text-sm"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </section>

              {/* Section 2: Location Information */}
              <section>
                <h3 className="text-sm font-semibold text-slate-900 mb-3 border-b pb-1">
                  Location Information
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Address *
                    </label>
                    <input
                      value={newWarehouse.address}
                      onChange={(e) =>
                        setNewWarehouse({
                          ...newWarehouse,
                          address: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      City *
                    </label>
                    <input
                      value={newWarehouse.city}
                      onChange={(e) =>
                        setNewWarehouse({
                          ...newWarehouse,
                          city: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      State *
                    </label>
                    <input
                      value={newWarehouse.state}
                      onChange={(e) =>
                        setNewWarehouse({
                          ...newWarehouse,
                          state: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Country *
                    </label>
                    <input
                      value={newWarehouse.country}
                      onChange={(e) =>
                        setNewWarehouse({
                          ...newWarehouse,
                          country: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Pincode *
                    </label>
                    <input
                      value={newWarehouse.pinCode}
                      onChange={(e) =>
                        setNewWarehouse({
                          ...newWarehouse,
                          pinCode: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 text-sm"
                    />
                  </div>
                </div>
              </section>

              {/* Section 3: Contact Information */}
              <section>
                <h3 className="text-sm font-semibold text-slate-900 mb-3 border-b pb-1">
                  Contact Information
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Contact Person
                    </label>
                    <input
                      value={newWarehouse.contactPerson}
                      onChange={(e) =>
                        setNewWarehouse({
                          ...newWarehouse,
                          contactPerson: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Mobile Number
                    </label>
                    <input
                      value={newWarehouse.phone}
                      onChange={(e) =>
                        setNewWarehouse({
                          ...newWarehouse,
                          phone: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Email
                    </label>
                    <input
                      value={newWarehouse.email}
                      onChange={(e) =>
                        setNewWarehouse({
                          ...newWarehouse,
                          email: e.target.value,
                        })
                      }
                      type="email"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 text-sm"
                    />
                  </div>
                </div>
              </section>

              {/* Section 4: Additional Information */}
              <section>
                <h3 className="text-sm font-semibold text-slate-900 mb-3 border-b pb-1">
                  Additional Information
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      GST Number
                    </label>
                    <input
                      value={newWarehouse.gstNumber}
                      onChange={(e) =>
                        setNewWarehouse({
                          ...newWarehouse,
                          gstNumber: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      License Number
                    </label>
                    <input
                      value={newWarehouse.licenseNumber}
                      onChange={(e) =>
                        setNewWarehouse({
                          ...newWarehouse,
                          licenseNumber: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Remarks
                    </label>
                    <textarea
                      value={newWarehouse.remarks}
                      onChange={(e) =>
                        setNewWarehouse({
                          ...newWarehouse,
                          remarks: e.target.value,
                        })
                      }
                      rows={3}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 text-sm resize-none"
                    />
                  </div>
                </div>
              </section>

              {/* Footer Buttons */}
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                <ActionButton
                  variant="secondary"
                  onClick={() => setShowFormModal(false)}
                >
                  Cancel
                </ActionButton>
                <ActionButton onClick={handleSave}>Save Warehouse</ActionButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Drawer */}
      <Drawer
        open={!!selectedWarehouse}
        onClose={() => setSelectedWarehouse(null)}
        title="Warehouse Details"
      >
        {selectedWarehouse && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-xl font-bold text-slate-900">
                {selectedWarehouse.name}
              </h2>
              <Badge
                variant={
                  selectedWarehouse.status === "Active" ? "success" : "neutral"
                }
              >
                {selectedWarehouse.status}
              </Badge>
            </div>

            {/* Warehouse Information */}
            <section>
              <h3 className="text-sm font-semibold text-slate-900 mb-3 bg-slate-50 px-3 py-2 rounded">
                Warehouse Information
              </h3>
              <div className="space-y-1">
                <DrawerField
                  label="Warehouse Code"
                  value={selectedWarehouse.code}
                />
                <DrawerField
                  label="Warehouse Type"
                  value={selectedWarehouse.type}
                />
                <DrawerField label="Branch" value={selectedWarehouse.branch} />
              </div>
            </section>

            {/* Location Information */}
            <section>
              <h3 className="text-sm font-semibold text-slate-900 mb-3 bg-slate-50 px-3 py-2 rounded">
                Location Information
              </h3>
              <div className="space-y-1">
                <DrawerField
                  label="Address"
                  value={selectedWarehouse.address}
                />
                <DrawerField label="City" value={selectedWarehouse.city} />
                <DrawerField label="State" value={selectedWarehouse.state} />
                <DrawerField
                  label="Country"
                  value={selectedWarehouse.country}
                />
                <DrawerField
                  label="Pincode"
                  value={selectedWarehouse.pinCode}
                />
              </div>
            </section>

            {/* Contact Information */}
            <section>
              <h3 className="text-sm font-semibold text-slate-900 mb-3 bg-slate-50 px-3 py-2 rounded">
                Contact Information
              </h3>
              <div className="space-y-1">
                <DrawerField
                  label="Contact Person"
                  value={selectedWarehouse.contactPerson}
                />
                <DrawerField
                  label="Mobile Number"
                  value={selectedWarehouse.phone}
                />
                <DrawerField label="Email" value={selectedWarehouse.email} />
              </div>
            </section>

            {/* Additional Information */}
            <section>
              <h3 className="text-sm font-semibold text-slate-900 mb-3 bg-slate-50 px-3 py-2 rounded">
                Additional Information
              </h3>
              <div className="space-y-1">
                <DrawerField
                  label="GST Number"
                  value={selectedWarehouse.gstNumber}
                />
                <DrawerField
                  label="License Number"
                  value={selectedWarehouse.licenseNumber}
                />
                <DrawerField
                  label="Remarks"
                  value={selectedWarehouse.remarks}
                />
              </div>
            </section>

            {/* Metadata Footer */}
            <div className="flex flex-col gap-1 text-xs text-slate-400 mt-8 pt-4 border-t border-slate-100">
              <p>
                Created by:{" "}
                <span className="font-medium text-slate-500">
                  {selectedWarehouse.createdBy}
                </span>{" "}
                on {new Date(selectedWarehouse.createdAt).toLocaleDateString()}
              </p>
              <p>
                Last modified:{" "}
                <span className="font-medium text-slate-500">
                  {new Date(
                    selectedWarehouse.lastModified,
                  ).toLocaleDateString()}
                </span>
              </p>
            </div>
          </div>
        )}
      </Drawer>

      {/* Delete Confirmation Modal */}
      {warehouseToDelete && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/30 backdrop-blur-[2px]">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Delete Warehouse
            </h3>
            <p className="text-slate-600 mb-6 text-sm">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-slate-900">
                {warehouseToDelete.name}
              </span>
              ? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <ActionButton
                variant="secondary"
                onClick={() => setWarehouseToDelete(null)}
              >
                Cancel
              </ActionButton>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-rose-600 text-white text-sm rounded-lg font-semibold hover:bg-rose-700 transition-colors shadow-sm shadow-rose-600/20"
              >
                Delete Warehouse
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
