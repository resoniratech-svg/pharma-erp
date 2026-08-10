export type LeadStatus = 'NEW' | 'CONTACTED' | 'ASSIGNED' | 'QUALIFIED' | 'CONVERTED' | 'LOST';

export interface Lead {
  id: string;
  leadCode: string;
  name: string;
  type: string;          // 'Doctor' | 'Chemist' | 'Hospital' | 'Distributor'
  mobile: string;
  email: string;
  address: string;
  territory: string;
  source: string;
  status: LeadStatus;
  assignedMrId: number | null;
  assignedMrName: string;
  createdAt: string;
  createdByEmpId?: string;
  createdByRole?: string;
  createdByName?: string;
  contactPerson?: string;
  leadDate?: string;
  state?: string;
  district?: string;
  city?: string;
  priority?: string;
  followUpDate?: string;
  conversionDate?: string;
  convertedBy?: string;
}

const STORAGE_KEY = 'local_leads';

function getLocalLeads(): Lead[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored) as Lead[];
  } catch {
    return [];
  }
}

function saveLocalLeads(leads: Lead[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
}

export const leadService = {
  async getAll(): Promise<Lead[]> {
    return getLocalLeads();
  },

  async getById(id: string): Promise<Lead | null> {
    const leads = getLocalLeads();
    return leads.find(l => l.id === id) || null;
  },

  async create(data: {
    name: string;
    type: string;
    mobile?: string;
    email?: string;
    address?: string;
    territory?: string;
    source?: string;
    contactPerson?: string;
    leadDate?: string;
    state?: string;
    district?: string;
    city?: string;
    priority?: string;
    followUpDate?: string;
    assignedTo?: string;
    creatorInfo?: {
      empId: string;
      role: string;
      name: string;
    };
  }): Promise<Lead> {
    const leads = getLocalLeads();
    const newId = String(Date.now());
    const leadCode = `LEAD-${newId.slice(-4)}`;
    
    const newLead: Lead = {
      id: newId,
      leadCode,
      name: data.name || '',
      type: data.type || 'Doctor',
      mobile: data.mobile || '',
      email: data.email || '',
      address: data.address || '',
      territory: data.territory || '',
      source: data.source || '',
      status: 'NEW',
      assignedMrId: null,
      assignedMrName: data.assignedTo || '',
      createdAt: new Date().toISOString(),
      createdByEmpId: data.creatorInfo?.empId,
      createdByRole: data.creatorInfo?.role,
      createdByName: data.creatorInfo?.name,
      contactPerson: data.contactPerson,
      leadDate: data.leadDate,
      state: data.state,
      district: data.district,
      city: data.city,
      priority: data.priority,
      followUpDate: data.followUpDate,
    };
    
    leads.push(newLead);
    saveLocalLeads(leads);
    return newLead;
  },

  async update(id: string, updates: Partial<Lead>): Promise<Lead | null> {
    const leads = getLocalLeads();
    const index = leads.findIndex(l => l.id === id);
    if (index === -1) return null;
    
    leads[index] = { ...leads[index], ...updates };
    saveLocalLeads(leads);
    return leads[index];
  },

  async updateStatus(id: string, status: LeadStatus): Promise<Lead | null> {
    return this.update(id, { status });
  },

  async assign(id: string, mrId: number): Promise<Lead | null> {
    const mrName = `MR-${mrId}`; // Mock MR name based on ID
    return this.update(id, { assignedMrId: mrId, assignedMrName: mrName });
  },

  async convert(id: string): Promise<Lead | null> {
    return this.update(id, { status: 'CONVERTED' });
  },

  async delete(id: string): Promise<boolean> {
    const leads = getLocalLeads();
    const filtered = leads.filter(l => l.id !== id);
    if (leads.length === filtered.length) return false;
    saveLocalLeads(filtered);
    return true;
  },
};

