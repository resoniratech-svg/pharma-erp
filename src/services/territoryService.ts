import type { Territory } from '../modules/super-admin/sales-organization/types';

export interface TerritoryMasterRecord {
  area: string;
  district: string;
  state: string;
  totalDoctors: number;
  totalChemists: number;
}

export const TERRITORY_MASTER: TerritoryMasterRecord[] = [
  { area: 'Mumbai Central', district: 'Mumbai City', state: 'Maharashtra', totalDoctors: 15, totalChemists: 10 },
  { area: 'Bandra-Khar West', district: 'Mumbai Suburban', state: 'Maharashtra', totalDoctors: 20, totalChemists: 15 },
  { area: 'knr', district: 'Kannur', state: 'Kerala', totalDoctors: 10, totalChemists: 8 },
  { area: 'pune', district: 'Pune', state: 'Maharashtra', totalDoctors: 12, totalChemists: 10 },
  { area: 'delhi', district: 'New Delhi', state: 'Delhi', totalDoctors: 18, totalChemists: 12 }
];

const STORAGE_KEY_ADMIN = 'sales_org_territories';

export const territoryService = {
  getTerritoryMaster: (): TerritoryMasterRecord[] => {
    return TERRITORY_MASTER;
  },

  getLocationDetails: (loc: string) => {
    const clean = loc.trim().toLowerCase();
    const match = TERRITORY_MASTER.find(t => t.area.toLowerCase() === clean);
    if (match) {
      return { district: match.district, state: match.state };
    }
    return { district: loc, state: 'Unknown' };
  },

  // --- Super Admin Territory Assignment (New) ---
  getAdminTerritories(): Territory[] {
    const data = localStorage.getItem(STORAGE_KEY_ADMIN);
    return data ? JSON.parse(data) : [];
  },

  addAdminTerritory(ter: Omit<Territory, 'id'>): Territory {
    const territories = this.getAdminTerritories();

    // Validate one active territory assignment per employee
    if (ter.status === 'Active') {
      const existing = territories.find(
        t => t.assignedManager === ter.assignedManager && t.status === 'Active'
      );
      if (existing) {
        throw new Error(`Employee ${ter.assignedManager} already has an active territory assignment (${existing.territoryCode}). Deactivate the existing one first.`);
      }
    }

    // Basic Hierarchy Validation rules
    if (!ter.zone) throw new Error("Zone is required.");
    if (!ter.region) throw new Error("Region is required and must belong to a Zone.");
    if (!ter.headquarters) throw new Error("Headquarters is required and must belong to a Region.");
    if (!ter.area) throw new Error("Area is required and must belong to a Headquarters.");

    const newTer: Territory = {
      ...ter,
      id: `ter-${Date.now()}`,
    };
    territories.unshift(newTer);
    localStorage.setItem(STORAGE_KEY_ADMIN, JSON.stringify(territories));
    return newTer;
  },

  updateAdminTerritory(id: string, updated: Partial<Territory>): Territory | null {
    const territories = this.getAdminTerritories();
    const index = territories.findIndex((t) => t.id === id);
    if (index === -1) return null;

    // If making active or changing assigned manager, validate one active territory per employee
    if ((updated.status === 'Active' || (updated.assignedManager && updated.assignedManager !== territories[index].assignedManager)) && 
         (updated.status !== 'Inactive' && territories[index].status !== 'Inactive')) {
      const targetManager = updated.assignedManager || territories[index].assignedManager;
      const targetStatus = updated.status || territories[index].status;

      if (targetStatus === 'Active') {
        const existing = territories.find(
          t => t.assignedManager === targetManager && t.status === 'Active' && t.id !== id
        );
        if (existing) {
          throw new Error(`Employee ${targetManager} already has an active territory assignment (${existing.territoryCode}). Deactivate the existing one first.`);
        }
      }
    }

    territories[index] = { ...territories[index], ...updated };
    localStorage.setItem(STORAGE_KEY_ADMIN, JSON.stringify(territories));
    return territories[index];
  },

  deactivateAdminTerritory(id: string): boolean {
    const ter = this.updateAdminTerritory(id, { status: 'Inactive' });
    return !!ter;
  }
};

