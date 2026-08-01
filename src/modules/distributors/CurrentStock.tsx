import { useState, useMemo, useEffect } from 'react';
import { Package, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';
import {
  PageHeader,
  FilterBar,
  SearchInput,
  SelectFilter,
  TableCard,
  DataTable,
  Badge,
  SummaryCard
} from './components/shared';
import { type Column, type BadgeVariant } from './components/shared';

// Import existing production services
import { inventoryService, type InventoryRecord } from '../../services/inventoryService';
import { productService } from '../../services/productService';
import { batchService } from '../../services/batchService';
import authService from '../../services/authService';
import { orderService } from '../../services/orderService';

interface StockRow {
  id: string;
  productCode: string;
  productName: string;
  batchNumber: string;
  category: string;
  packType: string;
  availableQuantity: number;
  reservedQuantity: number;
  freeQuantity: number;
  damagedQuantity: number;
  quarantineQuantity: number;
  expiryDate: string;
  mrp: number;
  ptr: number;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock' | 'Near Expiry';
  isAvailableForOrdering: boolean;
  rawRecord: InventoryRecord;
}

export default function CurrentStock() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [batchFilter, setBatchFilter] = useState('');
  const [expiryFilter, setExpiryFilter] = useState('');

  const [rawInventory, setRawInventory] = useState<InventoryRecord[]>([]);

  const loggedInDistributorInfo = useMemo(() => {
    const user = authService.getCurrentUser();
    const role = localStorage.getItem('activeRole') || (user as any)?.role || '';
    const code = (user as any)?.linkedDistributorCode || (user as any)?.distributorCode || '';
    const name = user?.fullName || user?.name || (user as any)?.distributorName || '';
    const email = user?.email || '';
    return { role, code, name, email };
  }, []);
  useEffect(() => {
    const fetchData = async () => {
      const allOrders = await orderService.loadOrders();
      const approvedStatuses = ['Approved', 'Partially Paid', 'Processing', 'Partially Fulfilled', 'Fulfilled'];

      const approvedOrders = allOrders.filter(o => {
        if (!approvedStatuses.includes(o.status)) return false;

        // If Super Admin, show all approved orders
        if (loggedInDistributorInfo.role === 'SUPER_ADMIN') return true;

        // Match logged in distributor by code or name
        if (loggedInDistributorInfo.code && o.distributorCode === loggedInDistributorInfo.code) return true;
        if (loggedInDistributorInfo.name && o.distributorName && o.distributorName.toLowerCase().includes(loggedInDistributorInfo.name.toLowerCase())) return true;
        if (o.distributorName && loggedInDistributorInfo.name && loggedInDistributorInfo.name.toLowerCase().includes(o.distributorName.toLowerCase())) return true;

        // Fallback for default distributor accounts or generic distributor portal sessions
        if (!loggedInDistributorInfo.code || o.distributorName === 'Distributor' || !o.distributorCode) return true;

        return false;
      });

      const products = productService.getProducts();
      const stockMap = new Map<string, any>();
      
      approvedOrders.forEach(order => {
        (order.items || []).forEach(item => {
          const pCode = item.productCode || `PRD-${item.productId}`;
          const product = products.find(p => p.code === pCode || p.id === item.productId);
          const pName = item.productName || product?.name || 'Unknown Product';
          
          if (!stockMap.has(pCode)) {
            stockMap.set(pCode, {
              id: pCode,
              productCode: pCode,
              productName: pName,
              batchNo: item.batchNo || 'N/A',
              availableQty: 0,
              mrp: item.mrp || product?.mrp || 0,
              ptr: item.ptr || product?.ptr || 0,
              warehouseId: loggedInDistributorInfo.code || 'DIST',
              warehouseCode: loggedInDistributorInfo.code || 'DIST',
              isAvailableForOrdering: true
            });
          }
          const record = stockMap.get(pCode);
          record.availableQty += (Number(item.quantity) || 0);
        });
      });

      // Merge with live backend inventory records if present
      const defaultInventory = await inventoryService.loadInventory();
      defaultInventory.forEach(inv => {
        if (!stockMap.has(inv.productCode) && inv.availableQty > 0) {
          stockMap.set(inv.productCode, {
            id: inv.productCode,
            productCode: inv.productCode,
            productName: inv.productName,
            batchNo: inv.batchNo || 'N/A',
            availableQty: inv.availableQty,
            mrp: inv.ptr || 0,
            ptr: inv.ptr || 0,
            warehouseId: inv.warehouseCode,
            warehouseCode: inv.warehouseCode,
            isAvailableForOrdering: true
          });
        }
      });
      
      setRawInventory(Array.from(stockMap.values()));
    };
    
    fetchData();
  }, [loggedInDistributorInfo]);

  const handleToggleRetailAvailability = (id: string) => {
    setRawInventory(prev => prev.map(record => {
      if (record.id === id || record.productCode === id) {
        return {
          ...record,
          isAvailableForOrdering: !(record as any).isAvailableForOrdering
        };
      }
      return record;
    }));
  };

  const stockData = useMemo<StockRow[]>(() => {
    const products = productService.getProducts();
    const batches = batchService.getAll();

    return rawInventory.map(inv => {
      const product = products.find(p => p.code === inv.productCode || p.id === inv.productCode);
      const batch = batches.find(b => 
        (inv.batchNo && inv.batchNo !== 'N/A' && b.batchNo === inv.batchNo) ||
        (b.productCode && b.productCode === inv.productCode) ||
        (b.productName && inv.productName && b.productName.toLowerCase() === inv.productName.toLowerCase())
      );

      const resolvedBatchNumber = (inv.batchNo && inv.batchNo !== 'N/A') 
        ? inv.batchNo 
        : (batch?.batchNo || `BAT-${inv.productCode.replace(/\D/g, '').slice(-6) || '0001'}`);

      const packType = product?.packingType || (product as any)?.packType || ((product as any)?.packingType ? `${(product as any).packingType}` : 'Pack');

      const minStock = product?.minimumStock ? Number(product.minimumStock) : 50;
      let status: StockRow['status'] = 'In Stock';
      
      const rawExpiryDate = batch?.expDate || (batch as any)?.expiryDate || (product as any)?.expDate || '2027-12-31';
      
      if (inv.availableQty === 0) {
        status = 'Out of Stock';
      } else if (rawExpiryDate) {
        const today = new Date();
        const exp = new Date(rawExpiryDate);
        const daysToExpiry = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 3600 * 24));
        if (daysToExpiry <= 90 && daysToExpiry > 0) {
          status = 'Near Expiry';
        } else if (inv.availableQty <= minStock) {
          status = 'Low Stock';
        }
      } else if (inv.availableQty <= minStock) {
        status = 'Low Stock';
      }

      const formatExpDate = (dateStr: string) => {
        if (!dateStr || dateStr === 'N/A') return '31/12/2027';
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
      };

      const damagedQuantity = ('damagedQty' in inv) ? Number((inv as any).damagedQty || 0) : 0;
      const quarantineQuantity = ('blockedQty' in inv) ? Number((inv as any).blockedQty || 0) : 0;
      const isAvailableForOrdering = (inv as any).isAvailableForOrdering !== undefined 
        ? (inv as any).isAvailableForOrdering 
        : true;

      const mrpVal = (product?.mrp && Number(product.mrp) > 0) ? Number(product.mrp) : (inv.mrp || batch?.mrp || (inv.ptr ? inv.ptr * 1.5 : 15.00));
      const ptrVal = (product?.ptr && Number(product.ptr) > 0) ? Number(product.ptr) : (inv.ptr || batch?.ptr || 2.00);

      return {
        id: inv.id,
        productCode: inv.productCode,
        productName: inv.productName || product?.name || 'Unknown Product',
        batchNumber: resolvedBatchNumber,
        category: product?.category || (product as any)?.category || 'General',
        packType: packType === 'N/A' ? 'Pack' : packType,
        availableQuantity: Math.max(0, inv.availableQty || 0),
        reservedQuantity: inv.reservedQty || 0,
        freeQuantity: 0,
        damagedQuantity,
        quarantineQuantity,
        expiryDate: formatExpDate(rawExpiryDate),
        mrp: mrpVal,
        ptr: ptrVal,
        status,
        isAvailableForOrdering,
        rawRecord: inv
      };
    });
  }, [rawInventory]);

  const filteredData = useMemo(() => {
    return stockData.filter(item => {
      const searchLower = search.toLowerCase();
      const matchSearch = 
        item.productCode.toLowerCase().includes(searchLower) ||
        item.productName.toLowerCase().includes(searchLower);

      const matchCategory = categoryFilter ? item.category === categoryFilter : true;
      const matchStatus = statusFilter ? item.status === statusFilter : true;
      const matchBatch = batchFilter ? item.batchNumber.toLowerCase().includes(batchFilter.toLowerCase()) : true;
      
      let matchExpiry = true;
      if (expiryFilter) {
        if (expiryFilter === 'Expired' && item.expiryDate !== 'N/A') {
          const parts = item.expiryDate.split('/');
          if (parts.length === 3) {
             const exp = new Date(Number(parts[2]), Number(parts[1])-1, Number(parts[0]));
             if (exp >= new Date()) matchExpiry = false;
          }
        } else if (expiryFilter === 'Near Expiry') {
             matchExpiry = item.status === 'Near Expiry';
        }
      }

      return matchSearch && matchCategory && matchStatus && matchBatch && matchExpiry;
    });
  }, [stockData, search, categoryFilter, statusFilter, batchFilter, expiryFilter]);

  const metrics = useMemo(() => {
    const totalProducts = new Set(stockData.map(d => d.productCode)).size;
    const totalQty = stockData.reduce((sum, item) => sum + item.availableQuantity, 0);
    const lowStock = stockData.filter(d => d.status === 'Low Stock' || d.status === 'Out of Stock').length;
    const nearExpiry = stockData.filter(d => d.status === 'Near Expiry').length;

    return { totalProducts, totalQty, lowStock, nearExpiry };
  }, [stockData]);

  const uniqueCategories = useMemo(() => Array.from(new Set(stockData.map(item => item.category))), [stockData]);

  const columns: Column<StockRow>[] = [
    { key: 'productCode', label: 'Product Code' },
    { 
      key: 'productName', 
      label: 'Product Name',
      render: (row: any) => (
        <div>
          <p className="font-medium text-slate-900">{row.productName}</p>
          <p className="text-xs text-slate-500">{row.packType}</p>
        </div>
      )
    },
    { key: 'batchNumber', label: 'Batch Number' },
    { key: 'category', label: 'Category' },
    { key: 'expiryDate', label: 'Expiry Date' },
    { 
      key: 'mrp', 
      label: 'Pricing',
      render: (row: any) => (
        <div>
          <p className="text-sm">MRP: ₹{row.mrp.toFixed(2)}</p>
          <p className="text-xs text-slate-500 font-medium text-slate-700">PTR: ₹{row.ptr.toFixed(2)}</p>
        </div>
      )
    },
    { 
      key: 'ptr', 
      label: 'Distributor Selling Price',
      render: (row: any) => <span className="font-semibold text-slate-900">₹{row.ptr.toFixed(2)}</span>
    },
    { 
      key: 'availableQuantity', 
      label: 'Available',
      render: (row: any) => <span className="font-semibold">{row.availableQuantity}</span>
    },
    { key: 'reservedQuantity', label: 'Reserved' },
    { key: 'damagedQuantity', label: 'Damaged Qty' },
    { key: 'quarantineQuantity', label: 'Quarantine Qty' },
    {
      key: 'status',
      label: 'Status',
      render: (row: any) => {
        let variant: BadgeVariant = 'neutral';
        switch (row.status) {
          case 'In Stock': variant = 'success'; break;
          case 'Low Stock': variant = 'warning'; break;
          case 'Out of Stock': variant = 'danger'; break;
          case 'Near Expiry': variant = 'warning'; break;
        }
        return <Badge variant={variant}>{row.status}</Badge>;
      }
    },
    {
      key: 'isAvailableForOrdering',
      label: 'Retail Availability',
      render: (row: any) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleToggleRetailAvailability(row.id)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
              row.isAvailableForOrdering ? 'bg-violet-600' : 'bg-slate-200'
            }`}
            aria-label="Toggle retail availability"
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                row.isAvailableForOrdering ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <span className="text-xs font-semibold text-slate-600 min-w-[24px]">
            {row.isAvailableForOrdering ? 'Yes' : 'No'}
          </span>
        </div>
      )
    }
  ];

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <PageHeader
        title="Distributor Inventory"
        subtitle="Manage your inventory levels and control product visibility in the Retailer Product Catalog."
      />

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <SummaryCard
          title="Total Products"
          value={metrics.totalProducts.toLocaleString()}
          icon={<Package className="w-6 h-6" />}
          colorClass="text-blue-600"
          bgClass="bg-blue-50"
        />
        <SummaryCard
          title="Total Available Qty"
          value={metrics.totalQty.toLocaleString()}
          icon={<CheckCircle2 className="w-6 h-6" />}
          colorClass="text-emerald-600"
          bgClass="bg-emerald-50"
        />
        <SummaryCard
          title="Low/Out of Stock"
          value={metrics.lowStock.toLocaleString()}
          subtitle="Needs Replenishment"
          icon={<AlertCircle className="w-6 h-6" />}
          colorClass="text-rose-600"
          bgClass="bg-rose-50"
        />
        <SummaryCard
          title="Near Expiry Batches"
          value={metrics.nearExpiry.toLocaleString()}
          subtitle="Action Required"
          icon={<Clock className="w-6 h-6" />}
          colorClass="text-amber-600"
          bgClass="bg-amber-50"
        />
      </div>

      <TableCard>
        <FilterBar>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by Product Name or Code..."
          />
          <SelectFilter
            value={categoryFilter}
            onChange={setCategoryFilter}
            options={uniqueCategories.map(c => ({ value: c, label: c }))}
            placeholder="All Categories"
          />
          <SelectFilter
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: 'In Stock', label: 'In Stock' },
              { value: 'Low Stock', label: 'Low Stock' },
              { value: 'Out of Stock', label: 'Out of Stock' },
              { value: 'Near Expiry', label: 'Near Expiry' }
            ]}
            placeholder="All Statuses"
          />
          <SearchInput
            value={batchFilter}
            onChange={setBatchFilter}
            placeholder="Filter by Batch..."
          />
        </FilterBar>

        <DataTable
          columns={columns}
          data={filteredData}
        />
      </TableCard>
    </div>
  );
}
