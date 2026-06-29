export interface WarehouseRecord {
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

const defaultWarehouses: WarehouseRecord[] = [
  {
    id: "1",
    code: "WH001",
    name: "Hyderabad Main Warehouse",
    type: "Main Warehouse",
    branch: "Hyderabad",
    contactPerson: "Rajesh Kumar",
    phone: "+91 9876543210",
    email: "rajesh@mjhealthcare.com",
    address: "Plot 123, Industrial Area",
    city: "Hyderabad",
    state: "Telangana",
    country: "India",
    pinCode: "500001",
    gstNumber: "36AAAAA1234A1Z1",
    licenseNumber: "LIC-HYD-001",
    remarks: "Central hub for southern region",
    status: "Active",
    createdAt: "2026-01-10T10:00:00",
    createdBy: "System Admin",
    lastModified: "2026-06-15T14:30:00",
  },
  {
    id: "2",
    code: "WH002",
    name: "Bangalore Warehouse",
    type: "Regional Warehouse",
    branch: "Bangalore",
    contactPerson: "Priya Sharma",
    phone: "+91 8765432109",
    email: "priya@mjhealthcare.com",
    address: "45, Logistics Park",
    city: "Bangalore",
    state: "Karnataka",
    country: "India",
    pinCode: "560001",
    gstNumber: "29BBBBB1234B1Z2",
    licenseNumber: "LIC-BLR-002",
    remarks: "",
    status: "Active",
    createdAt: "2026-02-15T09:15:00",
    createdBy: "System Admin",
    lastModified: "2026-05-20T11:45:00",
  },
  {
    id: "3",
    code: "WH003",
    name: "Chennai Cold Storage",
    type: "Cold Storage",
    branch: "Chennai",
    contactPerson: "Karthik Rajan",
    phone: "+91 7654321098",
    email: "karthik@mjhealthcare.com",
    address: "Zone A, Cold Chain Facility",
    city: "Chennai",
    state: "Tamil Nadu",
    country: "India",
    pinCode: "600001",
    gstNumber: "33CCCCC1234C1Z3",
    licenseNumber: "LIC-CHN-003",
    remarks: "Requires continuous temperature monitoring",
    status: "Active",
    createdAt: "2026-03-20T11:30:00",
    createdBy: "System Admin",
    lastModified: "2026-06-01T09:20:00",
  },
  {
    id: "4",
    code: "WH004",
    name: "Mumbai Distribution Center",
    type: "Distribution Warehouse",
    branch: "Mumbai",
    contactPerson: "Amit Patel",
    phone: "+91 6543210987",
    email: "amit@mjhealthcare.com",
    address: "Shed 12, Transport Nagar",
    city: "Mumbai",
    state: "Maharashtra",
    country: "India",
    pinCode: "400001",
    gstNumber: "27DDDDD1234D1Z4",
    licenseNumber: "LIC-MUM-004",
    remarks: "Under renovation",
    status: "Inactive",
    createdAt: "2026-04-10T15:45:00",
    createdBy: "System Admin",
    lastModified: "2026-06-10T16:15:00",
  },
  {
    id: "5",
    code: "WH005",
    name: "Returns Warehouse",
    type: "Returns Warehouse",
    branch: "Hyderabad",
    contactPerson: "Suresh Reddy",
    phone: "+91 9988776655",
    email: "suresh@mjhealthcare.com",
    address: "Plot 89, Phase 2",
    city: "Hyderabad",
    state: "Telangana",
    country: "India",
    pinCode: "500002",
    gstNumber: "36EEEEE1234E1Z5",
    licenseNumber: "LIC-HYD-005",
    remarks: "For damaged and expired goods processing",
    status: "Active",
    createdAt: "2026-05-05T10:20:00",
    createdBy: "System Admin",
    lastModified: "2026-06-20T13:10:00",
  },
];

const STORAGE_KEY = "warehouseRecords";

export const warehouseService = {
  getAll(): WarehouseRecord[] {
    const data = localStorage.getItem(STORAGE_KEY);

    if (!data) {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(defaultWarehouses)
      );

      return defaultWarehouses;
    }

    try {
      return JSON.parse(data) as WarehouseRecord[];
    } catch {
      return defaultWarehouses;
    }
  },

  saveAll(records: WarehouseRecord[]): void {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(records)
    );
  },

  addWarehouse(record: WarehouseRecord): void {
    const records = this.getAll();

    records.unshift(record);

    this.saveAll(records);
  },

  updateWarehouse(
    id: string,
    updatedRecord: WarehouseRecord
  ): void {
    const records = this.getAll();

    const updated = records.map((record) =>
      record.id === id ? updatedRecord : record
    );

    this.saveAll(updated);
  },

  deleteWarehouse(id: string): void {
    const records = this.getAll();

    const filtered = records.filter(
      (record) => record.id !== id
    );

    this.saveAll(filtered);
  },
};