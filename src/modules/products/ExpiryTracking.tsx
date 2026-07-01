import { useEffect, useState } from 'react';
import { Filter, Download } from 'lucide-react';

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
} from './components/shared';

import { type Column } from './types';

import { batchService } from "../../services/batchService";

import { getExpiryStatus, getDaysToExpiry } from "../../utils/expiryUtils";

import { expiryTrackingService } from "../../services/expiryTrackingService";

import { hasModulePermission } from '../../utils/permissionUtils';

import  activityLogService  from "../../services/activityLogService";

interface ExpiryItem {
  id: string;
  batchNo: string;
  productName: string;
  productType: string;
  mfgDate?: string;
  expDate: string;
  qty: number;
  daysLeft: number;
  storageLocation?: string;
  status?: string;
}





const getStatusVariant = (status: string) => {
  if (status === "Healthy") return "success";

  if (status === "Expired") return "danger";

  return "warning";
};



export default function ExpiryTracking() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedItem, setSelectedItem] = useState<ExpiryItem | null>(null);
  const currentUser = JSON.parse(localStorage.getItem("authUser") || "{}");


  const activeRole =
    localStorage.getItem('activeRole') || '';

    const canView = hasModulePermission(activeRole, "Products & Master", "View");
  
    const canCreate = hasModulePermission(
      activeRole,
      "Products & Master",
      "Create",
    );
  
    const canEdit = hasModulePermission(activeRole, "Products & Master", "Edit");
  
    const canDelete = hasModulePermission(
      activeRole,
      "Products & Master",
      "Delete",
    );

  const [data, setData] = useState<ExpiryItem[]>([]);

  useEffect(() => {
    const savedData = expiryTrackingService.getAll();

    if (savedData.length > 0) {
      setData(savedData);
    }
  }, []);


   useEffect(() => {
     const batches = batchService.getAll();

     const expiryData = batches.map((batch) => {
      
       const daysLeft = getDaysToExpiry(batch.expDate);

       const status = getExpiryStatus(batch.expDate);

       return {
         id: batch.id,

         batchNo: batch.batchNo,

         productName: batch.productName,

         productType: batch.unit,

         mfgDate: batch.mfgDate,

         expDate: batch.expDate,

         qty: batch.availableQty,

         daysLeft,

         storageLocation: batch.storageLocation,

         status: status,
       };
     });

     setData(expiryData);

     expiryTrackingService.saveAll(expiryData);
     
     activityLogService.addLog({
       userId: currentUser?.id,
       userName: currentUser?.fullName,
       action: "Expiry Status Updated",
       module: "Expiry Tracking",
     });

   }, []);

  const handleExport = () => {
    const headers = ['Batch No', 'Product Name', 'Product Type', 'Expiry Date', 'Quantity', 'Days Left', 'Status'];
    const csvContent = [
      headers.join(','),
      ...filteredData.map(row => {
        const status = getExpiryStatus(row.expDate);
        return [row.batchNo, `"${row.productName}"`, row.productType, row.expDate, row.qty, row.daysLeft, status].join(',');
      })
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'expiry_export.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    activityLogService.addLog({
      userId: currentUser?.id,
      userName: currentUser?.fullName,
      action: "Expiry Report Exported",
      module: "Expiry Tracking",
    });
  };

  const columns: Column<ExpiryItem>[] = [
    {
      key: "batchNo",
      label: "Batch No",
    },
    {
      key: "productName",
      label: "Product Name",
      render: (row) => (
        <span className="font-semibold text-slate-900">{row.productName}</span>
      ),
    },
    {
      key: "productType",
      label: "Product Type",
    },
    {
      key: "expDate",
      label: "Expiry Date",
    },
    {
      key: "qty",
      label: "Quantity",
    },
    {
      key: "daysLeft",
      label: "Days Left",
      render: (row) => {
        const daysLeft = getDaysToExpiry(row.expDate);

        return daysLeft <= 0 ? "Expired" : `${daysLeft} Days`;
      },
    },
    {
      key: "status",
      label: "Status",
      render: (row) => {
        const computedStatus = getExpiryStatus(row.expDate);
        const variant = getStatusVariant(computedStatus);
        return <Badge variant={variant}>{computedStatus}</Badge>;
      },
    },
    {
      key: "id",
      label: "Actions",
      render: (row) => (
        <div className="flex gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedItem(row);
            }}
            className="text-violet-600 font-medium hover:text-violet-800"
          >
            View
          </button>
        </div>
      ),
    },
  ];

  const filteredData = data.filter((item) => {
    const matchesSearch =
      item.batchNo
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      item.productName
        .toLowerCase()
        .includes(search.toLowerCase());

    const computedStatus = getExpiryStatus(item.expDate);
    const matchesStatus = statusFilter
      ? computedStatus === statusFilter
      : true;

    return matchesSearch && matchesStatus;
  });


  // if (!canView) {
  //   return (
  //     <div className="p-10 text-center">
  //       <h2 className="text-xl font-semibold">Access Denied</h2>

  //       <p className="text-slate-500 mt-2">
  //         You do not have permission to view Expiry Tracking.
  //       </p>
  //     </div>
  //   );
  // }

  
  
  
  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Expiry Tracking"
        subtitle="Monitor product expiry dates, near-expiry inventory, and expired stock."
        actions={
          <>
            <ActionButton
              variant="secondary"
              icon={<Download className="w-4 h-4" />}
              onClick={handleExport}
            >
              Export
            </ActionButton>
          </>
        }
      />

      <FilterBar>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by batch or product..."
        />

        <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-600">Filters:</span>
        </div>

        <SelectFilter
          value={statusFilter}
          onChange={setStatusFilter}
          placeholder="All Status"
          options={[
            { label: "Healthy", value: "Healthy" },
            { label: "Near Expiry", value: "Near Expiry" },
            { label: "Expired", value: "Expired" },
          ]}
        />
      </FilterBar>

      <TableCard>
        <DataTable
          columns={columns}
          data={filteredData}
          onRowClick={(row) => setSelectedItem(row)}
          emptyMessage="No expiry records found."
        />
      </TableCard>

      <Drawer
        open={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        title="Expiry Details"
      >
        {selectedItem && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">
                Batch Information
              </h3>
              <div className="space-y-2">
                <DrawerField
                  label="Batch Number"
                  value={selectedItem.batchNo || "N/A"}
                />
                <DrawerField
                  label="Product Name"
                  value={selectedItem.productName || "N/A"}
                />
                <DrawerField
                  label="Manufacturing Date"
                  value={selectedItem.mfgDate || "N/A"}
                />

                <DrawerField
                  label="Expiry Date"
                  value={selectedItem.expDate || "N/A"}
                />

                <DrawerField
                  label="Days Remaining"
                  value={selectedItem.daysLeft}
                />
                <DrawerField
                  label="Product Type"
                  value={selectedItem.productType || "N/A"}
                />
                <DrawerField
                  label="Storage Location"
                  value={selectedItem.storageLocation || "N/A"}
                />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">
                Expiry Information
              </h3>
              <div className="space-y-2">
                <DrawerField
                  label="Manufacturing Date"
                  value={selectedItem.mfgDate || "N/A"}
                />
                <DrawerField
                  label="Expiry Date"
                  value={selectedItem.expDate || "N/A"}
                />
                <DrawerField
                  label="Days Left"
                  value={
                    selectedItem.daysLeft <= 0
                      ? "Expired"
                      : `${selectedItem.daysLeft} Days`
                  }
                />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">
                Stock Information
              </h3>
              <div className="space-y-2">
                <DrawerField
                  label="Available Quantity"
                  value={selectedItem.qty?.toString() || "0"}
                />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">
                Status Information
              </h3>
              <div className="space-y-2">
                <DrawerField
                  label="Current Status"
                  value={
                    <Badge
                      variant={getStatusVariant(
                        getExpiryStatus(selectedItem.expDate),
                      )}
                    >
                      {getExpiryStatus(selectedItem.expDate)}
                    </Badge>
                  }
                />
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}