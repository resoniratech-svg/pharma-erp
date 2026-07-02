// import { useEffect, useState } from 'react';
// import { Filter, Download } from 'lucide-react';

// import {
//   PageHeader,
//   FilterBar,
//   SearchInput,
//   SelectFilter,
//   ActionButton,
//   TableCard,
//   DataTable,
//   Drawer,
//   DrawerField,
//   Badge,
// } from './components/shared';

// import { type Column } from './types';

// import { batchService } from "../../services/batchService";

// import { getExpiryStatus, getDaysToExpiry } from "../../utils/expiryUtils";

// import { expiryTrackingService } from "../../services/expiryTrackingService";

// import { hasModulePermission } from '../../utils/permissionUtils';

// import  activityLogService  from "../../services/activityLogService";

// interface ExpiryItem {
//   id: string;
//   batchNo: string;
//   productName: string;
//   productType: string;
//   mfgDate?: string;
//   expDate: string;
//   qty: number;
//   daysLeft: number;
//   storageLocation?: string;
//   status?: string;
// }





// const getStatusVariant = (status: string) => {
//   if (status === "Healthy") return "success";

//   if (status === "Expired") return "danger";

//   return "warning";
// };



// export default function ExpiryTracking() {
//   const [search, setSearch] = useState('');
//   const [statusFilter, setStatusFilter] = useState('');
//   const [selectedItem, setSelectedItem] = useState<ExpiryItem | null>(null);
//   const currentUser = JSON.parse(localStorage.getItem("authUser") || "{}");


//   const activeRole =
//     localStorage.getItem('activeRole') || '';

//     const canView = hasModulePermission(activeRole, "Products & Master", "View");
  
//     const canCreate = hasModulePermission(
//       activeRole,
//       "Products & Master",
//       "Create",
//     );
  
//     const canEdit = hasModulePermission(activeRole, "Products & Master", "Edit");
  
//     const canDelete = hasModulePermission(
//       activeRole,
//       "Products & Master",
//       "Delete",
//     );

//   const [data, setData] = useState<ExpiryItem[]>([]);

//   useEffect(() => {
//     const savedData = expiryTrackingService.getAll();

//     if (savedData.length > 0) {
//       setData(savedData);
//     }
//   }, []);


//    useEffect(() => {
//      const batches = batchService.getAll();

//      const expiryData = batches.map((batch) => {
      
//        const daysLeft = getDaysToExpiry(batch.expDate);

//        const status = getExpiryStatus(batch.expDate);

//        return {
//          id: batch.id,

//          batchNo: batch.batchNo,

//          productName: batch.productName,

//          productType: batch.unit,

//          mfgDate: batch.mfgDate,

//          expDate: batch.expDate,

//          qty: batch.availableQty,

//          daysLeft,

//          storageLocation: batch.storageLocation,

//          status: status,
//        };
//      });

//      setData(expiryData);

//      expiryTrackingService.saveAll(expiryData);
     
//      activityLogService.addLog({
//        userId: currentUser?.id,
//        userName: currentUser?.fullName,
//        action: "Expiry Status Updated",
//        module: "Expiry Tracking",
//      });

//    }, []);

//   const handleExport = () => {
//     const headers = ['Batch No', 'Product Name', 'Product Type', 'Expiry Date', 'Quantity', 'Days Left', 'Status'];
//     const csvContent = [
//       headers.join(','),
//       ...filteredData.map(row => {
//         const status = getExpiryStatus(row.expDate);
//         return [row.batchNo, `"${row.productName}"`, row.productType, row.expDate, row.qty, row.daysLeft, status].join(',');
//       })
//     ].join('\n');
//     const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
//     const link = document.createElement('a');
//     const url = URL.createObjectURL(blob);
//     link.setAttribute('href', url);
//     link.setAttribute('download', 'expiry_export.csv');
//     link.style.visibility = 'hidden';
//     document.body.appendChild(link);
//     link.click();
//     document.body.removeChild(link);
//     activityLogService.addLog({
//       userId: currentUser?.id,
//       userName: currentUser?.fullName,
//       action: "Expiry Report Exported",
//       module: "Expiry Tracking",
//     });
//   };

//   const columns: Column<ExpiryItem>[] = [
//     {
//       key: "batchNo",
//       label: "Batch No",
//     },
//     {
//       key: "productName",
//       label: "Product Name",
//       render: (row) => (
//         <span className="font-semibold text-slate-900">{row.productName}</span>
//       ),
//     },
//     {
//       key: "productType",
//       label: "Product Type",
//     },
//     {
//       key: "expDate",
//       label: "Expiry Date",
//     },
//     {
//       key: "qty",
//       label: "Quantity",
//     },
//     {
//       key: "daysLeft",
//       label: "Days Left",
//       render: (row) => {
//         const daysLeft = getDaysToExpiry(row.expDate);

//         return daysLeft <= 0 ? "Expired" : `${daysLeft} Days`;
//       },
//     },
//     {
//       key: "status",
//       label: "Status",
//       render: (row) => {
//         const computedStatus = getExpiryStatus(row.expDate);
//         const variant = getStatusVariant(computedStatus);
//         return <Badge variant={variant}>{computedStatus}</Badge>;
//       },
//     },
//     {
//       key: "id",
//       label: "Actions",
//       render: (row) => (
//         <div className="flex gap-3">
//           <button
//             onClick={(e) => {
//               e.stopPropagation();
//               setSelectedItem(row);
//             }}
//             className="text-violet-600 font-medium hover:text-violet-800"
//           >
//             View
//           </button>
//         </div>
//       ),
//     },
//   ];

//   const filteredData = data.filter((item) => {
//     const matchesSearch =
//       item.batchNo
//         .toLowerCase()
//         .includes(search.toLowerCase()) ||
//       item.productName
//         .toLowerCase()
//         .includes(search.toLowerCase());

//     const computedStatus = getExpiryStatus(item.expDate);
//     const matchesStatus = statusFilter
//       ? computedStatus === statusFilter
//       : true;

//     return matchesSearch && matchesStatus;
//   });


//   // if (!canView) {
//   //   return (
//   //     <div className="p-10 text-center">
//   //       <h2 className="text-xl font-semibold">Access Denied</h2>

//   //       <p className="text-slate-500 mt-2">
//   //         You do not have permission to view Expiry Tracking.
//   //       </p>
//   //     </div>
//   //   );
//   // }

  
  
  
//   return (
//     <div className="animate-in fade-in duration-500">
//       <PageHeader
//         title="Expiry Tracking"
//         subtitle="Monitor product expiry dates, near-expiry inventory, and expired stock."
//         actions={
//           <>
//             <ActionButton
//               variant="secondary"
//               icon={<Download className="w-4 h-4" />}
//               onClick={handleExport}
//             >
//               Export
//             </ActionButton>
//           </>
//         }
//       />

//       <FilterBar>
//         <SearchInput
//           value={search}
//           onChange={setSearch}
//           placeholder="Search by batch or product..."
//         />

//         <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />

//         <div className="flex items-center gap-2">
//           <Filter className="w-4 h-4 text-slate-400" />
//           <span className="text-sm font-medium text-slate-600">Filters:</span>
//         </div>

//         <SelectFilter
//           value={statusFilter}
//           onChange={setStatusFilter}
//           placeholder="All Status"
//           options={[
//             { label: "Healthy", value: "Healthy" },
//             { label: "Near Expiry", value: "Near Expiry" },
//             { label: "Expired", value: "Expired" },
//           ]}
//         />
//       </FilterBar>

//       <TableCard>
//         <DataTable
//           columns={columns}
//           data={filteredData}
//           onRowClick={(row) => setSelectedItem(row)}
//           emptyMessage="No expiry records found."
//         />
//       </TableCard>

//       <Drawer
//         open={!!selectedItem}
//         onClose={() => setSelectedItem(null)}
//         title="Expiry Details"
//       >
//         {selectedItem && (
//           <div className="space-y-6">
//             <div>
//               <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">
//                 Batch Information
//               </h3>
//               <div className="space-y-2">
//                 <DrawerField
//                   label="Batch Number"
//                   value={selectedItem.batchNo || "N/A"}
//                 />
//                 <DrawerField
//                   label="Product Name"
//                   value={selectedItem.productName || "N/A"}
//                 />
//                 <DrawerField
//                   label="Manufacturing Date"
//                   value={selectedItem.mfgDate || "N/A"}
//                 />

//                 <DrawerField
//                   label="Expiry Date"
//                   value={selectedItem.expDate || "N/A"}
//                 />

//                 <DrawerField
//                   label="Days Remaining"
//                   value={selectedItem.daysLeft}
//                 />
//                 <DrawerField
//                   label="Product Type"
//                   value={selectedItem.productType || "N/A"}
//                 />
//                 <DrawerField
//                   label="Storage Location"
//                   value={selectedItem.storageLocation || "N/A"}
//                 />
//               </div>
//             </div>

//             <div>
//               <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">
//                 Expiry Information
//               </h3>
//               <div className="space-y-2">
//                 <DrawerField
//                   label="Manufacturing Date"
//                   value={selectedItem.mfgDate || "N/A"}
//                 />
//                 <DrawerField
//                   label="Expiry Date"
//                   value={selectedItem.expDate || "N/A"}
//                 />
//                 <DrawerField
//                   label="Days Left"
//                   value={
//                     selectedItem.daysLeft <= 0
//                       ? "Expired"
//                       : `${selectedItem.daysLeft} Days`
//                   }
//                 />
//               </div>
//             </div>

//             <div>
//               <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">
//                 Stock Information
//               </h3>
//               <div className="space-y-2">
//                 <DrawerField
//                   label="Available Quantity"
//                   value={selectedItem.qty?.toString() || "0"}
//                 />
//               </div>
//             </div>

//             <div>
//               <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">
//                 Status Information
//               </h3>
//               <div className="space-y-2">
//                 <DrawerField
//                   label="Current Status"
//                   value={
//                     <Badge
//                       variant={getStatusVariant(
//                         getExpiryStatus(selectedItem.expDate),
//                       )}
//                     >
//                       {getExpiryStatus(selectedItem.expDate)}
//                     </Badge>
//                   }
//                 />
//               </div>
//             </div>
//           </div>
//         )}
//       </Drawer>
//     </div>
//   );
// }

/////////////////////////////////////////////////////////////////////////////////////////


import { useEffect, useState } from 'react';
import { Filter, Download, RefreshCw } from 'lucide-react';

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
import { hasModulePermission } from '../../utils/permissionUtils';
import activityLogService from "../../services/activityLogService";
import authService from "../../services/authService";

interface Batch {
  id: string;
  batchNo: string;
  productName: string;
  productCode?: string;
  hsnCode?: string;
  gst?: string;
  unit?: string;
  composition?: string;
  packingType?: string;
  scheme?: string;
  manufacturer: string;
  mfgDate: string;
  expDate: string;
  receivedQty: number;
  availableQty: number;
  mrp: string;
  ptr: string;
  pts: string;
  barcode: string;
  remarks: string;
  status: string;
}

interface ExpiryItem {
  id: string;
  batchNo: string;
  productName: string;
  productType: string;
  productCode: string;
  mfgDate?: string;
  expDate: string;
  qty: number;
  daysLeft: number;
  status: string;
  manufacturer?: string;
  barcode?: string;
  hsnCode?: string;
}

const getStatusVariant = (status: string) => {
  if (status === "Healthy") return "success";
  if (status === "Expired" || status.startsWith("Critical")) return "danger";
  return "warning";
};

export default function ExpiryTracking() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedItem, setSelectedItem] = useState<ExpiryItem | null>(null);
  const [data, setData] = useState<ExpiryItem[]>([]);

  const currentUser = authService.getCurrentUser();
  const activeRole = localStorage.getItem('activeRole') || '';
  const canView = hasModulePermission(activeRole, "Products & Master", "View");

  const loadExpiryData = () => {
    const batches = batchService.getAll() as unknown as Batch[];
    const expiryData: ExpiryItem[] = batches.map((batch) => {
      const daysLeft = getDaysToExpiry(batch.expDate);
      const status = getExpiryStatus(batch.expDate);

      return {
        id: batch.id,
        batchNo: batch.batchNo,
        productName: batch.productName,
        productType: batch.unit || 'N/A',
        productCode: batch.productCode || 'N/A',
        mfgDate: batch.mfgDate,
        expDate: batch.expDate,
        qty: batch.availableQty,
        daysLeft,
        status: status,
        manufacturer: batch.manufacturer,
        barcode: batch.barcode,
        hsnCode: batch.hsnCode,
      };
    });
    setData(expiryData);
  };

  useEffect(() => {
    loadExpiryData();
  }, []);

  const handleRefresh = () => {
    loadExpiryData();
    activityLogService.addLog({
      userId: currentUser?.id,
      userName: currentUser?.fullName,
      action: "Expiry Status Refreshed",
      module: "Expiry Tracking",
    });
  };

  const getFEFORank = (row: ExpiryItem, allItems: ExpiryItem[]): number => {
    if (row.daysLeft <= 0 || row.qty <= 0) return 0;
    const productBatches = allItems
      .filter(item => item.productCode === row.productCode && item.qty > 0 && item.daysLeft > 0)
      .sort((a, b) => new Date(a.expDate).getTime() - new Date(b.expDate).getTime());
    
    const index = productBatches.findIndex(item => item.id === row.id);
    return index !== -1 ? index + 1 : 0;
  };

  const getStatusLabelAndVariant = (daysLeft: number, status: string) => {
    if (status === "Expired" || daysLeft <= 0) {
      return { label: "Expired", variant: "danger" as const };
    }
    if (daysLeft <= 30) {
      return { label: `Critical Expiry (${daysLeft} Days)`, variant: "danger" as const };
    }
    if (daysLeft <= 90) {
      return { label: `Near Expiry (${daysLeft} Days)`, variant: "warning" as const };
    }
    return { label: "Healthy", variant: "success" as const };
  };

  const handleExport = () => {
    const headers = ['Batch No', 'Product Code', 'Product Name', 'Product Type', 'Expiry Date', 'Quantity', 'Days Left', 'Status'];
    const csvContent = [
      headers.join(','),
      ...filteredData.map(row => {
        const { label } = getStatusLabelAndVariant(row.daysLeft, row.status);
        return [
          row.batchNo, 
          `="${row.productCode}"`,
          `="${row.productName}"`, 
          row.productType, 
          row.expDate, 
          row.qty, 
          row.daysLeft, 
          label
        ].join(',');
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
        return row.daysLeft <= 0 ? "Expired" : `${row.daysLeft} Days`;
      },
    },
    {
      key: "id",
      label: "FEFO Priority",
      render: (row) => {
        const rank = getFEFORank(row, data);
        if (rank === 0) return <span className="text-slate-400 text-xs">N/A (Not Eligible)</span>;
        return rank === 1 ? (
          <Badge variant="success">Next to Sell (FEFO 1)</Badge>
        ) : (
          <span className="text-slate-500 text-sm font-medium">Rank {rank}</span>
        );
      }
    },
    {
      key: "status",
      label: "Status",
      render: (row) => {
        const { label, variant } = getStatusLabelAndVariant(row.daysLeft, row.status);
        return <Badge variant={variant}>{label}</Badge>;
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
      item.batchNo.toLowerCase().includes(search.toLowerCase()) ||
      item.productName.toLowerCase().includes(search.toLowerCase());

    const { label } = getStatusLabelAndVariant(item.daysLeft, item.status);
    const matchesStatus = statusFilter
      ? (statusFilter === "Healthy" && label === "Healthy") ||
        (statusFilter === "Near Expiry" && (label.startsWith("Near Expiry") || label.startsWith("Critical Expiry"))) ||
        (statusFilter === "Expired" && label === "Expired")
      : true;

    return matchesSearch && matchesStatus;
  });

  // Sort by earliest expiry date (FEFO)
  const sortedFilteredData = [...filteredData].sort((a, b) => {
    return new Date(a.expDate).getTime() - new Date(b.expDate).getTime();
  });

  // Calculate Summary metrics
  const healthyCount = data.filter(item => getStatusLabelAndVariant(item.daysLeft, item.status).label === "Healthy").length;
  const nearExpiryCount = data.filter(item => {
    const label = getStatusLabelAndVariant(item.daysLeft, item.status).label;
    return label.startsWith("Near Expiry");
  }).length;
  const criticalCount = data.filter(item => {
    const label = getStatusLabelAndVariant(item.daysLeft, item.status).label;
    return label.startsWith("Critical Expiry");
  }).length;
  const expiredCount = data.filter(item => getStatusLabelAndVariant(item.daysLeft, item.status).label === "Expired").length;

  if (!canView) {
    return (
      <div className="p-10 text-center">
        <h2 className="text-xl font-semibold">Access Denied</h2>
        <p className="text-slate-500 mt-2">
          You do not have permission to view Expiry Tracking.
        </p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Expiry Tracking"
        subtitle="Monitor product expiry dates, near-expiry inventory, and expired stock."
        actions={
          <>
            <ActionButton
              variant="secondary"
              icon={<RefreshCw className="w-4 h-4" />}
              onClick={handleRefresh}
            >
              Refresh
            </ActionButton>
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

      {/* Expiry Dashboard Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Healthy Batches</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{healthyCount}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Near Expiry (31-90 Days)</div>
          <div className="text-2xl font-bold text-amber-500 mt-1">{nearExpiryCount}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Critical (≤30 Days)</div>
          <div className="text-2xl font-bold text-rose-500 mt-1">{criticalCount}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Expired Stock</div>
          <div className="text-2xl font-bold text-rose-700 mt-1">{expiredCount}</div>
        </div>
      </div>

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
          data={sortedFilteredData}
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
                Batch & Product Information
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
                  label="Product Code"
                  value={selectedItem.productCode || "N/A"}
                />
                <DrawerField
                  label="Product Type"
                  value={selectedItem.productType || "N/A"}
                />
                <DrawerField
                  label="Manufacturer"
                  value={selectedItem.manufacturer || "N/A"}
                />
                <DrawerField
                  label="HSN Code"
                  value={selectedItem.hsnCode || "N/A"}
                />
                <DrawerField
                  label="Barcode"
                  value={selectedItem.barcode || "N/A"}
                />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">
                Expiry Details
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
                  label="Days Remaining"
                  value={
                    selectedItem.daysLeft <= 0
                      ? "Expired"
                      : `${selectedItem.daysLeft} Days`
                  }
                />
                <DrawerField
                  label="FEFO Issue Priority"
                  value={
                    getFEFORank(selectedItem, data) === 0
                      ? "N/A (Not Eligible)"
                      : `Rank ${getFEFORank(selectedItem, data)}`
                  }
                />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">
                Stock & Status
              </h3>
              <div className="space-y-2">
                <DrawerField
                  label="Available Quantity"
                  value={selectedItem.qty?.toString() || "0"}
                />
                <DrawerField
                  label="Current Status"
                  value={
                    <Badge
                      variant={getStatusVariant(
                        getStatusLabelAndVariant(selectedItem.daysLeft, selectedItem.status).label === "Healthy"
                          ? "Healthy"
                          : getStatusLabelAndVariant(selectedItem.daysLeft, selectedItem.status).label === "Expired"
                            ? "Expired"
                            : "Near Expiry"
                      )}
                    >
                      {getStatusLabelAndVariant(selectedItem.daysLeft, selectedItem.status).label}
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