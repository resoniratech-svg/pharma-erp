import { apiRequest } from './apiClient';

export interface DistributorMasterRecord {
  id: string;
  code: string;
  name: string;
  contactPerson: string;
  mobileNumber: string;
  emailAddress?: string;
  status: 'Active' | 'Inactive';
  createdDate: string;
  state?: string;
}

function mapToUi(d: any): DistributorMasterRecord {
  return {
    id: String(d.id),
    code: d.code || `DIST-${String(d.id).padStart(3, '0')}`,
    name: d.name,
    contactPerson: d.contactPerson || d.name,
    mobileNumber: d.mobile || d.mobileNumber || '-',
    emailAddress: d.emailAddress || d.email || '',
    state: d.state || '',
    status: d.status === 'Inactive' ? 'Inactive' : 'Active',
    createdDate: d.createdAt
      ? new Date(d.createdAt).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
  };
}

// In-memory cache so synchronous getAll() still works
let cache: DistributorMasterRecord[] = [];

export const distributorMasterService = {
  // Synchronous getter — returns in-memory cache (populated by load())
  getAll(): DistributorMasterRecord[] {
    return cache;
  },

  // Load from DB into cache — call this on page mount
  async load(): Promise<DistributorMasterRecord[]> {
    try {
      const response = await apiRequest<{ success: boolean; data: any[] }>('/distributors');
      if (response && response.success && Array.isArray(response.data)) {
        cache = response.data.map(mapToUi);
      }
    } catch (err) {
      console.error('Failed to fetch distributors from API:', err);
    }
    return cache;
  },

  // Alias used in some places
  async fetchFromApi(): Promise<DistributorMasterRecord[]> {
    return this.load();
  },

  getById(id: string): DistributorMasterRecord | undefined {
    return cache.find((d) => d.id === id);
  },

  async create(
    record: Omit<DistributorMasterRecord, 'id' | 'code' | 'createdDate'>
  ): Promise<DistributorMasterRecord> {
    const response = await apiRequest<{ success: boolean; data: any }>('/distributors', {
      method: 'POST',
      bodyData: {
        name: record.name,
        contactPerson: record.contactPerson,
        mobile: record.mobileNumber,
        emailAddress: record.emailAddress,
        state: record.state,
        status: record.status,
      },
    });
    if (!response.success || !response.data) {
      throw new Error('Failed to create distributor');
    }
    const created = mapToUi(response.data);
    cache = [created, ...cache];
    return created;
  },

  async update(
    id: string,
    updates: Partial<DistributorMasterRecord>
  ): Promise<DistributorMasterRecord | null> {
    const numId = parseInt(id, 10);
    if (isNaN(numId)) return null;
    try {
      const response = await apiRequest<{ success: boolean; data: any }>(`/distributors/${numId}`, {
        method: 'PUT',
        bodyData: {
          name: updates.name,
          contactPerson: updates.contactPerson,
          mobile: updates.mobileNumber,
          emailAddress: updates.emailAddress,
          state: updates.state,
          status: updates.status,
        },
      });
      if (response.success && response.data) {
        const updated = mapToUi(response.data);
        cache = cache.map((d) => (d.id === id ? updated : d));
        return updated;
      }
    } catch (err: any) {
      console.error('Failed to update distributor:', err.message);
    }
    return null;
  },

  updateStatus(id: string, status: 'Active' | 'Inactive'): void {
    this.update(id, { status });
  },
};
